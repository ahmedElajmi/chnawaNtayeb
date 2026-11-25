import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { createFirestoreStore } from './firestoreStore';
import type { DataStore } from './types';

/**
 * Attempt state across retries (lot F1 — A3): the store keeps three levels of maxima —
 * `sessionWritten` (validated, absorbed only after a successful transaction), and a per-call
 * attempt state with `seed` (validated history snapshot), `highWater` (highest estimate
 * across ALL executions of the callback) and `assigned` (current execution, cleared at each
 * execution start). This fake applies the production rules AND the retry loop: a simulated
 * abort re-runs the callback with fresh reads, a commit-time READ VALIDATION conflicts when
 * a document read by the attempt changed (like Firestore), and the test's `onAttempt` hook
 * may mutate the base between attempts (a concurrent sibling — a REAL store call — or an
 * adversarial external change, stricter than the adapter's own invariant).
 */

type DocData = Record<string, unknown>;
type TraceEntry = { op: 'get' | 'set'; path: string };
type AttemptDecision = 'commit' | 'abort';

const READ_AFTER_WRITE = 'read after write inside a transaction';

type Snapshot = {
  exists: boolean;
  id: string;
  get: (field: string) => unknown;
  data: () => DocData;
};

const snapOf = (id: string, data: DocData | null): Snapshot => ({
  exists: data !== null,
  id,
  get: (field: string) => (data ? data[field] : undefined),
  data: () => data ?? {},
});

const millisOf = (value: unknown): number => {
  const m = value as { toMillis?: () => number } | undefined;
  return typeof m?.toMillis === 'function' ? m.toMillis() : 0;
};

class FakeDocRef {
  readonly kind = 'doc' as const;
  readonly path: string;
  constructor(
    private readonly db: FakeDb,
    readonly collectionName: string,
    readonly id: string
  ) {
    this.path = `${collectionName}/${id}`;
  }
  async get(): Promise<Snapshot> {
    return snapOf(this.id, this.db.readDoc(this.collectionName, this.id));
  }
}

class FakeQuery {
  readonly kind = 'query' as const;
  readonly path: string;
  constructor(
    private readonly db: FakeDb,
    private readonly name: string,
    private readonly field: string,
    private readonly cap: number
  ) {
    this.path = `probe:${name}`;
  }
  limit(n: number): FakeQuery {
    return new FakeQuery(this.db, this.name, this.field, n);
  }
  async get(): Promise<{ empty: boolean; docs: Snapshot[] }> {
    const entries = [...(this.db.data.get(this.name)?.entries() ?? [])]
      .map(([id, d]) => ({ id, d }))
      .filter(({ d }) => d[this.field] !== undefined)
      .sort((a, b) => millisOf(b.d[this.field]) - millisOf(a.d[this.field]))
      .slice(0, this.cap)
      .map(({ id, d }) => snapOf(id, d));
    return { empty: entries.length === 0, docs: entries };
  }
}

class FakeCollection {
  constructor(
    private readonly db: FakeDb,
    private readonly name: string
  ) {}
  doc(id: string): FakeDocRef {
    return new FakeDocRef(this.db, this.name, id);
  }
  orderBy(field: string, dir: 'asc' | 'desc'): FakeQuery {
    if (dir !== 'desc') throw new Error('fake supports only the desc probe query');
    return new FakeQuery(this.db, this.name, field, Number.POSITIVE_INFINITY);
  }
}

class FakeTransaction {
  wroteSinceRead = false;
  readonly trace: TraceEntry[] = [];
  /** Documents read by this execution, with the value seen — commit-time read validation. */
  readonly reads = new Map<string, DocData | null>();
  constructor(
    private readonly db: FakeDb,
    private readonly buffer: Map<string, DocData>
  ) {}
  async get(target: FakeDocRef | FakeQuery): Promise<Snapshot | { empty: boolean; docs: Snapshot[] }> {
    if (this.wroteSinceRead) throw new Error(READ_AFTER_WRITE);
    this.trace.push({ op: 'get', path: target.path });
    if (target.kind === 'doc') {
      const value = this.db.readDoc(target.collectionName, target.id);
      this.reads.set(target.path, value ? { ...value } : null);
      return snapOf(target.id, value);
    }
    return target.get();
  }
  set(ref: FakeDocRef, data: DocData): FakeDocRef {
    this.wroteSinceRead = true;
    this.trace.push({ op: 'set', path: ref.path });
    this.buffer.set(ref.path, data);
    return ref;
  }
}

class FakeDb {
  readonly data = new Map<string, Map<string, DocData>>();
  /** One trace per executed callback, across every call (appended at execution end). */
  readonly allTraces: TraceEntry[][] = [];
  /** Trace of the execution that committed (the last successful one). */
  committedTrace: TraceEntry[] = [];
  failWrite = false;
  /** Decides, after each execution of the CURRENT call, whether to commit or abort+retry.
   * It may mutate the base (a sibling commit, an adversarial external change). */
  onAttempt?: (execution: number, db: FakeDb) => Promise<AttemptDecision>;
  maxAttempts = 5;

  collection(name: string): FakeCollection {
    return new FakeCollection(this, name);
  }

  readDoc(name: string, id: string): DocData | null {
    return this.data.get(name)?.get(id) ?? null;
  }

  writeDoc(name: string, id: string, doc: DocData): void {
    let col = this.data.get(name);
    if (!col) {
      col = new Map();
      this.data.set(name, col);
    }
    col.set(id, doc);
  }

  setCounter(name: string, next: number): void {
    this.writeDoc('_sync_meta', name, { next });
  }

  counter(name: string): number | null {
    const next = this.data.get('_sync_meta')?.get(name)?.next;
    return typeof next === 'number' ? next : null;
  }

  storedRevision(name: string, id: string): number {
    return millisOf(this.data.get(name)?.get(id)?.revision);
  }

  private sameRead(a: DocData | null, b: DocData | null): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /** A transaction applies ALL its writes at the end (or none of them). The commit validates
   * the documents READ by the attempt: a change since the read conflicts (like Firestore)
   * and the callback is re-run — a callback error (e.g. the corruption guard) is NOT a
   * contention abort: it propagates immediately, exactly like production. */
  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    for (let execution = 1; execution <= this.maxAttempts; execution++) {
      const buffer = new Map<string, DocData>();
      const tx = new FakeTransaction(this, buffer);
      const result = await fn(tx);
      this.allTraces.push([...tx.trace]);
      const decision = this.onAttempt ? await this.onAttempt(execution, this) : 'commit';
      if (decision === 'abort') continue; // buffer discarded: nothing applied
      if (this.failWrite) throw new Error('simulated write failure at commit time');
      // commit-time read validation (like Firestore): a document READ by this execution that
      // changed since the read conflicts → the callback is re-run with fresh reads
      let conflicted = false;
      for (const [path, seen] of tx.reads) {
        const sep = path.indexOf('/');
        if (!this.sameRead(this.readDoc(path.slice(0, sep), path.slice(sep + 1)), seen)) conflicted = true;
      }
      if (conflicted) {
        if (execution >= this.maxAttempts) throw new Error('ABORTED: too many simulated attempts');
        continue;
      }
      this.committedTrace = [...tx.trace];
      for (const [path, doc] of buffer) {
        const sep = path.indexOf('/');
        this.writeDoc(path.slice(0, sep), path.slice(sep + 1), doc);
      }
      return result;
    }
    throw new Error('ABORTED: too many simulated attempts');
  }
}

const storeOf = (db: FakeDb): DataStore => createFirestoreStore(db as unknown as Firestore);

/** The exact multi-collection shape of `createAccount` (server/auth/users.ts). */
const accountCommit = (email = 'a@b.co', uid = 'u-test-1'): Parameters<DataStore['commit']> => [
  [
    { name: 'users', id: uid, doc: { uid, type: 'client', email, lastLogin: '2026-01-01T00:00:00.000Z' } },
    { name: 'auth', id: uid, doc: { password_phc: 'phc-x', failed_attempts: 0, locked_until: null } },
    { name: 'email_index', id: email, doc: { uid, taken: 1 } },
  ],
  { name: 'email_index', id: email, field: 'taken', expected: null },
];

const expectReadsBeforeWrites = (trace: TraceEntry[]): void => {
  const firstSet = trace.findIndex((e) => e.op === 'set');
  expect(firstSet).toBeGreaterThan(-1);
  expect(trace.slice(firstSet + 1).every((e) => e.op === 'set')).toBe(true);
};

const counterGets = (trace: TraceEntry[], collection: string): number =>
  trace.filter((e) => e.op === 'get' && e.path === `_sync_meta/${collection}`).length;

describe('firestore store — attempt state across retries (lot A3)', () => {
  it('case 1 — a sibling commit between our attempts: our retry estimates higher and succeeds', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    const sibling = storeOf(db);
    db.onAttempt = async (execution) => {
      if (execution === 1) {
        db.onAttempt = undefined; // the sibling call runs unplanned
        await sibling.put('users', 'u-sib', { uid: 'u-sib', type: 'client' }); // revision 1
        return 'abort';
      }
      return 'commit';
    };
    const revision = await store.put('users', 'u-ours', { uid: 'u-ours', type: 'client' });
    expect(revision).toBe(2); // distinct revisions, no false sync_counter_corrupt
    expect(db.storedRevision('users', 'u-sib')).toBe(1);
    expect(db.storedRevision('users', 'u-ours')).toBe(2);
  });

  it('case 2 — situation A: a retry with an unchanged counter re-estimates the same revision', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    await store.put('users', 'u-1', { uid: 'u-1', type: 'client' }); // revision 1, counter at 1
    db.onAttempt = async (execution) => (execution === 1 ? 'abort' : 'commit');
    // adversarial abort: no document changed at all (stricter than any real conflict)
    const revision = await store.put('users', 'u-2', { uid: 'u-2', type: 'client' });
    expect(revision).toBe(2); // re-estimation identical (next == attemptHighWater): accepted
    // variant: the counter ADVANCES between the executions (a sibling validates revision 3)
    db.onAttempt = async (execution) => {
      if (execution === 1) {
        db.onAttempt = undefined;
        await storeOf(db).put('users', 'u-3', { uid: 'u-3', type: 'client' }); // revision 3
        return 'abort';
      }
      return 'commit';
    };
    const later = await store.put('users', 'u-4', { uid: 'u-4', type: 'client' });
    expect(later).toBe(4);
  });

  it('case 3 — an abandoned attempt leaves no state behind', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    await store.put('users', 'u-1', { uid: 'u-1', type: 'client' }); // counter at 1
    db.onAttempt = async (execution) => (execution === 1 ? 'abort' : 'commit');
    expect(await store.put('users', 'u-2', { uid: 'u-2', type: 'client' })).toBe(2);
    // a SEPARATE later call recomputes from the fresh base without any false refusal
    db.onAttempt = undefined;
    expect(await store.put('users', 'u-3', { uid: 'u-3', type: 'client' })).toBe(3);
  });

  it('case 4 — real regressions are refused loudly before any write', async () => {
    // (a) before the call: the counter lowered behind the validated history
    const db = new FakeDb();
    const store = storeOf(db);
    await store.put('users', 'u-1', { uid: 'u-1', type: 'client' });
    await store.put('users', 'u-2', { uid: 'u-2', type: 'client' }); // sessionWritten = 2
    db.setCounter('users', 0); // external rollback behind the validated history
    await expect(store.put('users', 'u-3', { uid: 'u-3', type: 'client' })).rejects.toThrow(
      'counter behind the observed maximum'
    );
    // boundary: the counter lowered to exactly max - 1 → next == seed → also refused
    db.setCounter('users', 1);
    await expect(store.put('users', 'u-3', { uid: 'u-3', type: 'client' })).rejects.toThrow(
      'counter behind the observed maximum'
    );
    expect(db.storedRevision('users', 'u-3')).toBe(0); // nothing written
    // (b) between two executions of the same call (the chef's scenario): the estimate of the
    // abandoned execution is preserved by attemptHighWater — seed alone would miss it
    const db2 = new FakeDb();
    const store2 = storeOf(db2);
    db2.setCounter('users', 1); // a counter exists; nothing validated in THIS session
    db2.onAttempt = async (execution, d) => {
      if (execution === 1) {
        d.setCounter('users', 0); // external rollback between the executions
        return 'abort';
      }
      return 'commit';
    };
    await expect(store2.put('users', 'u-9', { uid: 'u-9', type: 'client' })).rejects.toThrow(
      'counter behind the observed maximum'
    );
    expect(db2.storedRevision('users', 'u-9')).toBe(0);
    // (c) within one execution: structurally impossible (case 8) and refused by the guard.
  });

  it('case 5 — absorption happens on success only and never carries attemptHighWater', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    await store.put('users', 'u-1', { uid: 'u-1', type: 'client' }); // sessionWritten = 1
    // (i) a failed transaction is not absorbed
    db.failWrite = true;
    await expect(store.put('users', 'u-2', { uid: 'u-2', type: 'client' })).rejects.toThrow(
      'simulated write failure at commit time'
    );
    db.failWrite = false;
    // had the failed attempt been absorbed (sessionWritten = 2), this would refuse:
    expect(await store.put('users', 'u-2', { uid: 'u-2', type: 'client' })).toBe(2);
    // (ii) attemptHighWater is never absorbed: a retried transact that ends up stamping nothing
    db.onAttempt = async (execution, d) => {
      if (execution === 1) {
        // adversarial: the change lands WITHOUT a counter advancement (external writer)
        d.writeDoc('users', 'u-3', {
          uid: 'u-3',
          type: 'client',
          done: true,
          revision: Timestamp.fromMillis(999),
        });
        return 'abort';
      }
      return 'commit';
    };
    const outcome = await store.transact('users', 'u-3', (current) => {
      const done = (current as { done?: boolean } | null)?.done;
      return done ? { next: current, result: 'already' } : { next: { ...current, done: true }, result: 'applied' };
    });
    expect(outcome).toBe('already'); // succeeded without stamping anything
    // sessionWritten must still be 2: the next put computes next = 3 and must SUCCEED
    // (had attemptHighWater = 3 been absorbed, sessionWritten = 3 → next = 3 ≤ seed → refuse)
    db.onAttempt = undefined;
    expect(await store.put('users', 'u-4', { uid: 'u-4', type: 'client' })).toBe(3);
  });

  it('case 6 — a commit conflict without any write does not advance sessionWritten', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    db.writeDoc('email_index', 'a@b.co', { uid: 'u-old', taken: 1 }); // guard fails immediately
    const result = await store.commit(...accountCommit());
    expect(result).toEqual({ ok: false, conflict: true });
    // the guard is the first read of the transaction: no counter was ever read
    expect(db.committedTrace.some((e) => e.path.startsWith('_sync_meta/'))).toBe(false);
    // once the condition is lifted, the next commit estimates the expected revisions —
    // no gap, no refusal (nothing was absorbed by the failed commit)
    db.data.get('email_index')!.delete('a@b.co');
    const retry = await store.commit(...accountCommit());
    expect(retry).toEqual({ ok: true, revision: 1 });
  });

  it('case 7 — put, remove, commit and transact keep their revisions, order and atomicity', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    expect(await store.put('users', 'u-1', { uid: 'u-1', type: 'client' })).toBe(1);
    expect(await store.remove('users', 'u-1')).toBe(2);
    expect(db.readDoc('users', 'u-1')?.deleted).toBe(true);
    expect(
      await store.transact('users', 'u-2', () => ({ next: { uid: 'u-2', type: 'employee' }, result: 'created' }))
    ).toBe('created');
    expect(db.storedRevision('users', 'u-2')).toBe(3);
    expect(await store.commit(...accountCommit())).toEqual({ ok: true, revision: 4 }); // auth/email start at 1
    for (const trace of db.allTraces) expectReadsBeforeWrites(trace); // A2 order preserved
    // atomicity: a write failure persists nothing
    db.failWrite = true;
    await expect(store.commit(...accountCommit('c@d.co', 'u-9'))).rejects.toThrow(
      'simulated write failure at commit time'
    );
    expect(db.readDoc('auth', 'u-9')).toBeNull();
  });

  it('case 8 — at most one counter read per collection per callback execution', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    await store.put('users', 'u-1', { uid: 'u-1', type: 'client' });
    await store.remove('users', 'u-1');
    await store.transact('users', 'u-2', () => ({ next: { uid: 'u-2', type: 'employee' }, result: 1 }));
    await store.commit([
      { name: 'users', id: 'u-3', doc: { uid: 'u-3', type: 'client' } },
      { name: 'users', id: 'u-4', doc: { uid: 'u-4', type: 'client' } },
    ]);
    for (const trace of db.allTraces) expect(counterGets(trace, 'users')).toBeLessThanOrEqual(1);
    // the commit grouped its two ops on the same collection: exactly ONE counter read
    expect(counterGets(db.committedTrace, 'users')).toBe(1);
    expect(db.committedTrace.filter((e) => e.op === 'set' && e.path === 'users/u-3')).toHaveLength(1);
    expect(db.committedTrace.filter((e) => e.op === 'set' && e.path === 'users/u-4')).toHaveLength(1);
  });

  it('case 9 — independent concurrent calls in the same process: no false positive', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    const sibling = storeOf(db);
    // our execution 1 reads a stale counter (0) and estimates next = 1; the sibling then
    // VALIDATES revision 1; our commit-time read validation conflicts → retry → fresh read
    // (counter = 1) → next = 2 > highWater → success: never a sync_counter_corrupt
    db.onAttempt = async (execution) => {
      if (execution === 1) {
        db.onAttempt = undefined;
        await sibling.put('users', 'u-sib', { uid: 'u-sib', type: 'client' });
        return 'abort';
      }
      return 'commit';
    };
    expect(await store.put('users', 'u-ours', { uid: 'u-ours', type: 'client' })).toBe(2);
    expect(db.storedRevision('users', 'u-sib')).toBe(1);
    expect(db.storedRevision('users', 'u-ours')).toBe(2);
    // variant "an estimate behind a concurrent validation": execution 1 estimates next = 3
    // (counter = 2), aborts, the sibling validates revision 3; our retry reads the FRESH
    // counter (3) → estimates 4 strictly above the high-water → success. The equality path
    // (identical re-estimation) is covered by case 2; the true serialization of an estimate
    // colliding with a concurrent validation is Firestore's conflict → retry (proved by the
    // emulator contract suite and case 1).
    db.onAttempt = async (execution) => {
      if (execution === 1) {
        db.onAttempt = undefined;
        await sibling.put('users', 'u-sib2', { uid: 'u-sib2', type: 'client' }); // revision 3
        return 'abort';
      }
      return 'commit';
    };
    expect(await store.put('users', 'u-ours2', { uid: 'u-ours2', type: 'client' })).toBe(4);
  });

  it('case 10 — a rollback between retries fails the call; once repaired, a new call converges', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    db.setCounter('users', 1); // counter exists; nothing validated in this session
    db.onAttempt = async (execution, d) => {
      if (execution === 1) {
        d.setCounter('users', 0); // external rollback between the executions
        return 'abort';
      }
      return 'commit';
    };
    await expect(store.put('users', 'u-1', { uid: 'u-1', type: 'client' })).rejects.toThrow(
      'counter behind the observed maximum'
    );
    // the failed call left nothing behind; the base is repaired (counter restored above the
    // validated history) → a new call resumes the sequence cleanly
    db.onAttempt = undefined;
    db.setCounter('users', 5);
    expect(await store.put('users', 'u-2', { uid: 'u-2', type: 'client' })).toBe(6);
  });
});
