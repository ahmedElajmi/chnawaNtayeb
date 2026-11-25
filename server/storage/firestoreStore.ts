import { DocumentData, Query, Timestamp, Transaction, type Firestore } from 'firebase-admin/firestore';
import type {
  ChangeCursor,
  CollectionName,
  CommitResult,
  DataStore,
  DirectoryPage,
  DirectoryQuery,
  StorageChanges,
  SyncCursor,
  TransactOutcome,
  WriteGuard,
  WriteOp,
} from './types';
import { normalizeCursor } from './types';
import { assertCommitEnvelope, assertWritable, DocumentValidationError, stripUndefined } from './validation';

/**
 * Firestore implementation of the DataStore contract (Admin SDK, bypasses the client rules:
 * every read and write is authorised by the routes, not by the database).
 *
 * Revisions are a strictly increasing per-collection sequence, assigned by this adapter
 * (never the provider clock): the sequence value is stored as a Timestamp whose millis are
 * the value — the contract exposes integers, exactly as the historical data did. The counter
 * lives in the internal `_sync_meta` collection (adapter-owned, never served): one
 * transaction advances it and writes the documents together, so concurrent writers get
 * distinct values, and an init reads the stored max first. A counter observed behind the
 * maximum this session has VALIDATED stops the collection's writes loudly (corruption, never
 * a silent reset). The maxima live at two levels: `sessionWritten` — the validated maximum,
 * advanced only by absorption after a successful transaction — and a per-call attempt state
 * (`seed` snapshot of the validated history, `highWater` across all executions of the
 * callback, `assigned` for the current execution, cleared at each execution start) so a
 * retry re-estimates cleanly, a rollback between retries is still caught, and no estimate is
 * ever absorbed before it is validated. Within a transaction every read precedes every
 * write — production Firestore refuses any read that runs after a write in the same
 * transaction, so the stamp is read first (`readStampTx`) and the counter write is applied
 * later (`writeStampTx`).
 *
 * The change feed paginates in contract order (revision, id): documents are read in real
 * timestamp order (Firestore's own), grouped by exposed revision, each complete group is
 * sorted by id, and a group larger than the page is delivered whole (the limit is soft) —
 * so no document can be skipped, whatever the timestamp precision below the millisecond.
 */
export function createFirestoreStore(db: Firestore): DataStore {
  const dbx = db;
  const table = (name: CollectionName) => dbx.collection(name);
  /** Adapter-internal counters, one document per collection (`{ next }` = last assigned). */
  const counterRef = (name: CollectionName) => dbx.collection('_sync_meta').doc(name);
  /** Highest revision this session VALIDATED (successfully committed) per collection. A
   * fresh counter read behind it is external corruption: the write is refused loudly.
   * Advanced only by absorption after a successful transaction — never during an attempt. */
  const sessionWritten = new Map<CollectionName, number>();

  /** Per-call attempt state (lot A3): `seed` snapshots the validated history at call start
   * (it spans every execution of the callback), `highWater` keeps the highest estimate across
   * ALL executions (it detects a regression between retries), and `assigned` holds the
   * current execution's estimates (cleared at each execution start — a retry re-estimates
   * cleanly, and two stampings can never share a revision within one execution). Discarded
   * on failure: an abandoned attempt leaves nothing behind. */
  type Attempt = {
    seed: Map<CollectionName, number>;
    highWater: Map<CollectionName, number>;
    assigned: Map<CollectionName, number>;
  };
  const beginAttempt = (): Attempt => ({
    seed: new Map(sessionWritten),
    highWater: new Map(),
    assigned: new Map(),
  });

  const stamped = (doc: Record<string, unknown>, revision: number) => ({
    ...doc,
    revision: Timestamp.fromMillis(revision),
  });

  /** The storage layer owns `id` and `revision`: they never persist inside the document, and
   * `undefined` leaves the stored shape (a removed field is absent on every provider). */
  const withoutOwnFields = (doc: Record<string, unknown>): Record<string, unknown> => {
    const clean = stripUndefined(doc) as Record<string, unknown>;
    delete clean.id;
    delete clean.revision;
    return clean;
  };

  /**
   * READ phase of the stamp: computes the collection's next revision inside the write
   * transaction. Concurrent writers serialise on the counter document, so two commits never
   * share a revision. A missing counter initialises above the stored maximum (fresh base,
   * import, rollback); a counter behind what this session has validated — or behind an
   * estimate already made for this attempt — is corruption: the write is refused loudly.
   *
   * Production Firestore requires ALL reads of a transaction before ANY write: this function
   * performs reads only — the counter write is applied later by `writeStampTx`, after every
   * read of the transaction has been performed.
   *
   * Strict operation order (lot A3): compute `next`; check the refusal conditions in order
   * (`seed`, then `assigned`, then `highWater`) and throw BEFORE touching any maximum; only
   * then update `assigned`, then `highWater`, and return the revision.
   */
  const readStampTx = async (tx: Transaction, name: CollectionName, attempt: Attempt): Promise<number> => {
    const snap = await tx.get(counterRef(name));
    const stored = snap.exists && typeof snap.get('next') === 'number' ? (snap.get('next') as number) : null;
    let next: number;
    if (stored === null) {
      const newest = await tx.get(table(name).orderBy('revision', 'desc').limit(1));
      const top = newest.empty ? 0 : (millis(newest.docs[0].get('revision')) ?? 0);
      next = top + 1;
    } else {
      next = stored + 1;
    }
    const seeded = attempt.seed.get(name) ?? 0;
    const assigned = attempt.assigned.get(name) ?? 0;
    const highWater = attempt.highWater.get(name) ?? 0;
    if (next <= seeded || next <= assigned || next < highWater) {
      console.error(
        `[storage] sync counter corruption on ${name}: next=${next} is behind seed=${seeded}, assigned=${assigned} or high-water=${highWater} — writes stopped`
      );
      throw new DocumentValidationError('sync_counter_corrupt', `counter behind the observed maximum on ${name}`);
    }
    attempt.assigned.set(name, next);
    attempt.highWater.set(name, Math.max(highWater, next));
    return next;
  };

  /** WRITE phase of the stamp: the counter write, applied once every read of the
   * transaction has been performed (see `readStampTx`). */
  const writeStampTx = (tx: Transaction, name: CollectionName, revision: number): void => {
    tx.set(counterRef(name), { next: revision });
  };

  /** Success only: fold the LAST execution's validated estimates into the session maxima.
   * `highWater` is never absorbed (an abandoned estimate is never validated) and the merge
   * keeps the maximum (never a regression). A failure, an abort or a commit conflict leaves
   * the session maxima untouched. */
  const absorbAttempt = (attempt: Attempt): void => {
    for (const [name, value] of attempt.assigned) {
      const written = sessionWritten.get(name) ?? 0;
      if (value > written) sessionWritten.set(name, value);
    }
  };

  const guardValue = async (tx: Transaction, guard: WriteGuard): Promise<number | null> => {
    const d = await tx.get(table(guard.name).doc(guard.id));
    if (!d.exists || d.get('deleted') === true) return null;
    const value = d.get(guard.field);
    return typeof value === 'number' ? value : null;
  };

  /** Same read outside a transaction: true when the guard no longer holds (the batch lost a
   * clean race against a concurrent batch, e.g. two registrations of the same e-mail). */
  const guardViolated = async (guard: WriteGuard): Promise<boolean> => {
    const d = await table(guard.name).doc(guard.id).get();
    const value =
      !d.exists || d.get('deleted') === true
        ? null
        : typeof d.get(guard.field) === 'number'
          ? (d.get(guard.field) as number)
          : null;
    return value !== guard.expected;
  };

  /**
   * The change feed in contract order. `cursor` modes: legacy number = strict revision
   * (compatibility), structured without id = inclusive re-delivery of the frontier revision,
   * structured with id = strictly after that change. Reads run in real order through
   * `startAfterDocument` (no composite index needed), groups flush completely, the page
   * never cuts inside a group larger than its remaining capacity (the limit is soft) and an
   * early stop abandons the incomplete buffer — the next call re-reads it from the window.
   */
  async function changes(name: CollectionName, cursor: ChangeCursor, limit: number): Promise<StorageChanges> {
    const c = normalizeCursor(cursor);
    const mode: 'legacy' | 'inclusive' | 'strict' =
      typeof cursor === 'number' ? 'legacy' : cursor.id === undefined ? 'inclusive' : 'strict';
    const L = Math.max(1, limit);
    const BATCH = Math.min(Math.max(L, 32), 300);

    const keeps = (stamp: number, id: string): boolean => {
      if (mode === 'legacy') return stamp > c.revision;
      if (mode === 'inclusive') return stamp >= c.revision;
      return stamp > c.revision || (stamp === c.revision && id > (c.id as string));
    };

    let q: Query = table(name);
    if (c.revision > 0) {
      // The exact window start of the cursor revision: every document whose exposed revision
      // is R₀ or later has its real timestamp at or after this instant — nothing is missed.
      q = q.where('revision', '>=', Timestamp.fromMillis(c.revision));
    }
    q = q.orderBy('revision');

    type Member = { id: string; stamp: number; data: DocumentData; deleted: boolean };
    const flushed: { revision: number; kept: Member[] }[] = [];
    let current: { revision: number; docs: Member[] } | null = null;
    let conservables = 0;
    let earlyStop = false;
    let exhausted = false;

    const flush = (): void => {
      if (!current) return;
      const kept = [...current.docs]
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .filter((m) => keeps(m.stamp, m.id));
      if (kept.length) {
        flushed.push({ revision: current.revision, kept });
        conservables += kept.length;
      }
      current = null;
    };

    let pageQuery = q;
    /** Exact position of the last read document (the raw stored revision value), for the cursor. */
    let lastRevValue: unknown;
    let lastId = '';
    while (!earlyStop) {
      const snap = await pageQuery.limit(BATCH).get();
      if (snap.empty) {
        exhausted = true;
        break;
      }
      for (const d of snap.docs) {
        const stamp = millis(d.get('revision')) ?? 0;
        if (current && stamp > current.revision) {
          flush(); // the group ended: its members are complete, they may be delivered
        }
        if (!current) current = { revision: stamp, docs: [] };
        current.docs.push({
          id: d.id,
          stamp,
          data: d.data() as DocumentData,
          deleted: d.get('deleted') === true,
        });
        // The page cursor must be EXACT (the real stored revision value, not its truncated
        // millis projection) or the last doc could be re-read forever at a page boundary.
        lastRevValue = d.get('revision');
        lastId = d.id;
        if (conservables > L) {
          // Enough complete groups read; the buffer just opened (d) stays incomplete: abandoned,
          // re-read from the window start next call — never delivered half-read.
          earlyStop = true;
          break;
        }
      }
      if (earlyStop) break;
      if (snap.docs.length < BATCH) {
        exhausted = true;
        flush(); // end of the source: the last group is complete
        break;
      }
      // Value-based cursor on the ordered fields (revision, id) — the document-cursor method
      // is not part of the installed Firestore type family, and the value form is exact.
      pageQuery = q.startAfter(lastRevValue, lastId);
    }

    // Adaptive cutting: a group that does not fit the remaining page capacity is delivered
    // whole (the response may exceed the requested limit rather than cut inside it).
    const page: Member[] = [];
    let lastCursor: SyncCursor | undefined;
    let more = false;
    for (const [index, group] of flushed.entries()) {
      const fits = page.length + group.kept.length <= L;
      page.push(...group.kept);
      lastCursor = { revision: group.revision, id: group.kept[group.kept.length - 1].id };
      if (!fits) {
        // The next call resumes after this whole group — unless the source is exhausted and
        // nothing was read beyond it (then a re-poll would answer an empty page).
        more = !exhausted || index < flushed.length - 1 || conservables > page.length;
        break;
      }
      if (page.length >= L) {
        more = !exhausted || conservables > page.length;
        break;
      }
    }
    if (!more) {
      more = earlyStop || conservables > page.length;
    }

    const items: Record<string, unknown>[] = [];
    const removedIds: string[] = [];
    let revision = c.revision;
    for (const m of page) {
      revision = Math.max(revision, m.stamp);
      if (m.deleted) removedIds.push(m.id);
      else items.push({ ...m.data, id: m.id, revision: m.stamp });
    }
    return {
      items,
      removedIds,
      revision,
      ...(lastCursor ? { cursor: lastCursor } : {}),
      more,
    };
  }

  return {
    changes,

    async get(name, id): Promise<Record<string, unknown> | null> {
      const d = await table(name).doc(id).get();
      return d.exists ? { ...(d.data() as DocumentData), id: d.id, revision: millis(d.get('revision')) ?? 0 } : null;
    },

    async findFirst(name, field, value): Promise<Record<string, unknown> | null> {
      const snap = await table(name).where(field, '==', value).limit(1).get();
      return snap.empty
        ? null
        : { ...snap.docs[0].data(), id: snap.docs[0].id, revision: millis(snap.docs[0].get('revision')) ?? 0 };
    },

    async findWhere(name, field, value, limit): Promise<Record<string, unknown>[]> {
      const snap = await table(name).where(field, '==', value).orderBy('revision').limit(limit).get();
      return snap.docs.map((d) => ({ ...d.data(), id: d.id, revision: millis(d.get('revision')) ?? 0 }));
    },

    async page(name, query: DirectoryQuery): Promise<DirectoryPage> {
      let q: Query = table(name);
      if (query.where) q = q.where(query.where.field, '==', query.where.value);
      let ordered = false;
      if (query.prefix) {
        // A range query is implicitly ordered by its field: no composite index to maintain
        q = q
          .where(query.prefix.field, '>=', query.prefix.value)
          .where(query.prefix.field, '<=', `${query.prefix.value}\uf8ff`);
        ordered = true;
      }
      // Page by document id otherwise; a prefix search returns one page without pagination
      q = q.limit(query.limit);
      if (!ordered) {
        q = q.orderBy('__name__');
        if (query.after) q = q.startAfter(query.after);
      }
      const snap = await q.get();
      const countSnap = await q.count().get();
      return {
        items: snap.docs.map((d) => ({ ...d.data(), id: d.id, revision: millis(d.get('revision')) ?? 0 })),
        total: countSnap.data().count,
        nextCursor:
          !ordered && snap.docs.length >= query.limit && snap.docs.length > 0 ? (snap.docs.at(-1)?.id ?? null) : null,
      };
    },

    async ids(name): Promise<string[]> {
      const snap = await table(name).select().get();
      return snap.docs.map((d) => d.id);
    },

    async maxRevision(name): Promise<number> {
      const snap = await table(name).orderBy('revision', 'desc').limit(1).get();
      return snap.empty ? 0 : (millis(snap.docs[0].get('revision')) ?? 0);
    },

    async put(name, id, doc): Promise<number> {
      const clean = stripUndefined(doc) as Record<string, unknown>;
      assertWritable(name, id, clean);
      const attempt = beginAttempt();
      const revision = await dbx.runTransaction(async (tx) => {
        attempt.assigned.clear(); // each callback execution re-estimates from fresh reads
        // Reads first (the counter), writes after: legal on production Firestore.
        const next = await readStampTx(tx, name, attempt);
        writeStampTx(tx, name, next);
        tx.set(table(name).doc(id), stamped(withoutOwnFields(clean), next));
        return next;
      });
      absorbAttempt(attempt);
      return revision;
    },

    async remove(name, id): Promise<number> {
      assertWritable(name, id, { deleted: true });
      const attempt = beginAttempt();
      const revision = await dbx.runTransaction(async (tx) => {
        attempt.assigned.clear(); // each callback execution re-estimates from fresh reads
        // Reads first (the counter), writes after: legal on production Firestore.
        const next = await readStampTx(tx, name, attempt);
        writeStampTx(tx, name, next);
        tx.set(table(name).doc(id), { deleted: true, revision: Timestamp.fromMillis(next) });
        return next;
      });
      absorbAttempt(attempt);
      return revision;
    },

    async commit(ops, guard): Promise<CommitResult> {
      assertCommitEnvelope(ops);
      const attempt = beginAttempt();
      try {
        const result = await dbx.runTransaction<CommitResult>(async (tx): Promise<CommitResult> => {
          attempt.assigned.clear(); // each callback execution re-estimates from fresh reads
          if (guard && (await guardValue(tx, guard)) !== guard.expected) {
            return { ok: false, conflict: true }; // nothing is written
          }
          // Every collection touched gets ONE revision shared by all its ops (a commit is one
          // moment of the collection's history — the tie set a cursor group covers completely).
          // Phase 1 — every read first: counter stamps (and their fallback probes) of ALL the
          // collections this batch touches. Production Firestore refuses any read that runs
          // after a write in the same transaction, so no write may start yet.
          const batch = ops as WriteOp[];
          const revisions = new Map<CollectionName, number>();
          for (const op of batch) {
            if (!revisions.has(op.name)) revisions.set(op.name, await readStampTx(tx, op.name, attempt));
          }
          // Phase 2 — every write after: the counters, then the documents of the batch.
          for (const [name, value] of revisions) writeStampTx(tx, name, value);
          let revision = 0;
          for (const op of batch) {
            const value = revisions.get(op.name) as number;
            tx.set(table(op.name).doc(op.id), stamped(withoutOwnFields(op.doc), value));
            revision = Math.max(revision, value);
          }
          return { ok: true, revision };
        });
        // Success only — a conflict return carries no estimate (nothing was stamped).
        absorbAttempt(attempt);
        return result;
      } catch (error) {
        if (error instanceof DocumentValidationError) throw error;
        // A concurrent guarded batch aborts this transaction. The guard is read back once more:
        // when it no longer holds, the batch lost a clean race — a conflict, not a storage failure.
        if (guard && (await guardViolated(guard))) return { ok: false, conflict: true };
        throw error;
      }
    },

    async transact<T>(
      name: CollectionName,
      id: string,
      operation: (current: Record<string, unknown> | null) => TransactOutcome<T>
    ): Promise<T> {
      // Firestore re-runs the callback on contention: `operation` must be pure, the contract
      // states it. The read (tx.get) and the write are atomic — the callback either applies
      // over the state it read or is re-run over the fresh one.
      const ref = table(name).doc(id);
      const attempt = beginAttempt();
      const result = await dbx.runTransaction(async (tx) => {
        attempt.assigned.clear(); // each callback execution re-estimates from fresh reads
        const snap = await tx.get(ref);
        const current =
          snap.exists && snap.get('deleted') !== true
            ? { ...(snap.data() as Record<string, unknown>), id: snap.id, revision: millis(snap.get('revision')) ?? 0 }
            : null;
        const outcome: TransactOutcome<T> = operation(current);
        if (outcome.next && outcome.next !== current) {
          const doc = withoutOwnFields(stripUndefined(outcome.next) as Record<string, unknown>);
          assertWritable(name, id, doc);
          // Reads first (the counter), writes after: legal on production Firestore.
          const revision = await readStampTx(tx, name, attempt);
          writeStampTx(tx, name, revision);
          tx.set(ref, stamped(doc, revision));
        }
        return outcome.result;
      });
      absorbAttempt(attempt);
      return result;
    },
  };
}

function millis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const d = value as DocumentData & { toMillis?: () => number };
  return typeof d.toMillis === 'function' ? d.toMillis() : null;
}
