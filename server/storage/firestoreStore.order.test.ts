import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { createFirestoreStore } from './firestoreStore';
import type { DataStore } from './types';

/**
 * The READ-BEFORE-WRITE order guard (lot F1 — A2): production Firestore refuses any read
 * that runs after a write inside the same transaction, while the EMULATOR does not — so
 * suites on the emulator never caught the violation. This fake applies the PRODUCTION rule:
 * any `get` after any `set` in the same attempt fails the attempt. Each case runs on a
 * SINGLE attempt — no Firestore retry is exercised here: the retry semantics (contention,
 * `sessionMax` across attempts) belong to lot A3.
 */

const READ_AFTER_WRITE = 'read after write inside a transaction';

type DocData = Record<string, unknown>;

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
  /** Read outside a transaction (the `guardViolated` fallback in `commit`). */
  async get(): Promise<Snapshot> {
    return snapOf(this.id, this.db.readDoc(this.collectionName, this.id));
  }
}

class FakeQuery {
  readonly kind = 'query' as const;
  constructor(
    private readonly db: FakeDb,
    private readonly name: string,
    private readonly field: string,
    private readonly cap: number
  ) {}
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
  readonly trace: ('get' | 'set')[] = [];
  constructor(
    private readonly db: FakeDb,
    private readonly buffer: Map<string, DocData>
  ) {}
  async get(target: FakeDocRef | FakeQuery): Promise<Snapshot | { empty: boolean; docs: Snapshot[] }> {
    if (this.wroteSinceRead) throw new Error(READ_AFTER_WRITE);
    this.trace.push('get');
    if (target.kind === 'doc') return snapOf(target.id, this.db.readDoc(target.collectionName, target.id));
    return target.get();
  }
  set(ref: FakeDocRef, data: DocData): FakeDocRef {
    this.wroteSinceRead = true;
    this.trace.push('set');
    this.buffer.set(ref.path, data);
    return ref;
  }
}

class FakeDb {
  /** Committed data: collection name → (document id → stored document). */
  readonly data = new Map<string, Map<string, DocData>>();
  /** Per-call trace of the last transaction (get/set order), reset by `runTransaction`. */
  lastTrace: ('get' | 'set')[] = [];
  /** Case 5: an infrastructure write failure at commit time (after the callback succeeded). */
  failWrite = false;

  collection(name: string): FakeCollection {
    return new FakeCollection(this, name);
  }

  readDoc(name: string, id: string): DocData | null {
    return this.data.get(name)?.get(id) ?? null;
  }

  storedRevision(name: string, id: string): number {
    return millisOf(this.data.get(name)?.get(id)?.revision);
  }

  counter(name: string): number | null {
    const next = this.data.get('_sync_meta')?.get(name)?.next;
    return typeof next === 'number' ? next : null;
  }

  /** A transaction applies ALL its writes at the end, or none of them — the same guarantee
   * production Firestore gives, which the order cases rely on (atomicity, case 5). */
  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    const buffer = new Map<string, DocData>();
    const tx = new FakeTransaction(this, buffer);
    const result = await fn(tx);
    this.lastTrace = [...tx.trace];
    if (this.failWrite) throw new Error('simulated write failure at commit time');
    for (const [path, doc] of buffer) {
      const sep = path.indexOf('/');
      const name = path.slice(0, sep);
      const id = path.slice(sep + 1);
      let col = this.data.get(name);
      if (!col) {
        col = new Map();
        this.data.set(name, col);
      }
      col.set(id, doc);
    }
    return result;
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

/** The trace shows no get after the first set: every read preceded every write. */
const expectReadsBeforeWrites = (trace: ('get' | 'set')[]): void => {
  const firstSet = trace.indexOf('set');
  expect(firstSet).toBeGreaterThan(-1);
  expect(trace.slice(firstSet + 1)).toEqual(Array(trace.length - firstSet - 1).fill('set'));
};

describe('firestore store — production read-before-write order (lot A2)', () => {
  it('accepts the exact createAccount shape (users + auth + email_index, guard) in one legal transaction', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    const result = await store.commit(...accountCommit());
    expect(result).toEqual({ ok: true, revision: 1 });
    expect(db.data.get('users')?.get('u-test-1')).toBeTruthy();
    expect(db.data.get('auth')?.get('u-test-1')).toBeTruthy();
    expect(db.data.get('email_index')?.get('a@b.co')).toEqual({
      uid: 'u-test-1',
      taken: 1,
      revision: expect.anything(),
    });
    expect(db.counter('users')).toBe(1);
    expect(db.counter('auth')).toBe(1);
    expect(db.counter('email_index')).toBe(1);
    expectReadsBeforeWrites(db.lastTrace);
    // Fresh base: 1 guard read + 3 counter reads + 3 fallback probes (every counter is
    // missing); then 3 counter writes + 3 document writes.
    expect(db.lastTrace).toEqual([
      'get',
      'get',
      'get',
      'get',
      'get',
      'get',
      'get',
      'set',
      'set',
      'set',
      'set',
      'set',
      'set',
    ]);
  });

  it('keeps the order legal when a counter is missing and the fallback probe reads the collection', async () => {
    const db = new FakeDb();
    db.data.set('users', new Map([['u-old', { revision: Timestamp.fromMillis(5), uid: 'u-old' }]]));
    db.data.set('_sync_meta', new Map([['email_index', { next: 10 }]]));
    const store = storeOf(db);
    const result = await store.commit(...accountCommit());
    // users: probe finds revision 5 → next 6; email_index: stored 10 → next 11; auth: probe on empty → 1.
    expect(result).toEqual({ ok: true, revision: 11 });
    expect(db.storedRevision('users', 'u-test-1')).toBe(6);
    expect(db.storedRevision('auth', 'u-test-1')).toBe(1);
    expect(db.storedRevision('email_index', 'a@b.co')).toBe(11);
    expectReadsBeforeWrites(db.lastTrace);
  });

  it('keeps put, remove and transact in the same legal order with identical revisions', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    const rev1 = await store.put('users', 'u-2', { uid: 'u-2', type: 'client' });
    expect(rev1).toBe(1);
    expectReadsBeforeWrites(db.lastTrace);
    const rev2 = await store.remove('users', 'u-2');
    expect(rev2).toBe(2);
    expectReadsBeforeWrites(db.lastTrace);
    expect(db.data.get('users')?.get('u-2')?.deleted).toBe(true);
    const outcome = await store.transact('users', 'u-3', () => ({
      next: { uid: 'u-3', type: 'employee' },
      result: 'created',
    }));
    expect(outcome).toBe('created');
    expect(db.storedRevision('users', 'u-3')).toBe(3);
    expectReadsBeforeWrites(db.lastTrace);
  });

  it('applies the transaction all-or-nothing: a write failure persists nothing', async () => {
    const db = new FakeDb();
    const store = storeOf(db);
    db.failWrite = true;
    await expect(store.commit(...accountCommit())).rejects.toThrow('simulated write failure at commit time');
    expect(db.data.get('users')).toBeUndefined();
    expect(db.data.get('auth')).toBeUndefined();
    expect(db.data.get('email_index')).toBeUndefined();
    expect(db.data.get('_sync_meta')).toBeUndefined();
  });
});
