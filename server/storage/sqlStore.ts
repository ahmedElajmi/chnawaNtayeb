import knex, { type Knex } from 'knex';
import { COLLECTIONS } from './collections';
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
import { assertCommitEnvelope, assertWritable, stripUndefined } from './validation';
import { withTransactRetries, type SqlConflictClass } from './conflicts';

/**
 * SQL implementation of the DataStore contract — the portability preparation (PR E).
 * One table per collection of the registry, a uniform shape for every engine:
 *   id (text, primary key) · data (JSON: the document without its id) · revision (ms) ·
 *   updated_at · deleted (0/1 — deletion markers).
 * The documents keep their exact stored shape: the core parsers are untouched, and a
 * switch from Firestore to SQL (or between SQL engines) changes nothing else.
 *
 * Wired for a local/test run only: `DATA_STORE=sql` (server/app.ts) builds it over SQLite
 * with `createSqliteKnex` + `ensureSchema`. The production switch stays the one global
 * migration (lot 1.5, then the explicit decision). Every engine passes the same contract
 * suite (server/storage/contract.ts); the SQLite run proves it locally, any other engine
 * must run it (and the contention suite) before being declared compatible — capability
 * matrix in docs/encyclopedie/donnees/lot-1.4-matrice-capacites.md.
 */

/** The JSON path dialects of the engines we target (equality queries on one field). */
function jsonField(instance: Knex, column: string, field: string): string {
  const client = instance.client.config.client;
  switch (client) {
    case 'better-sqlite3':
    case 'sqlite3':
      return `json_extract(${column}, '$.${field}')`;
    case 'pg':
      return `${column}->>'${field}'`;
    case 'mysql2':
      return `json_unquote(json_extract(${column}, '$."${field}"'))`;
    case 'mssql':
      return `JSON_VALUE(${column}, '$.${field}')`;
    default:
      throw new Error(`unsupported SQL client for JSON queries: ${String(client)}`);
  }
}

/** A guarded batch whose guard no longer holds: a clean lost race, not a storage failure. */
class GuardConflict extends Error {}

/** The row changed since the transaction read it: the attempt is retried over the fresh state. */
class TransactConflict extends Error {}

/**
 * The named conflict classes (server/storage/conflicts.ts) from this engine's error shapes.
 * The engine-specific codes and messages stay here — the vocabulary is shared, the matcher
 * is per engine (lot 1.4).
 */
const conflictClass = (error: unknown): SqlConflictClass | null => {
  if (error instanceof TransactConflict) return 'cas_lost';
  const e = error as { code?: string; message?: string } | undefined;
  if (typeof e?.code === 'string') {
    // Lock/serialisation failures first, then primary-key losses (codes never overlap)
    if (/BUSY|LOCK|40001|40P01|1205/.test(e.code)) return 'lock_lost';
    if (e.code.startsWith('SQLITE_CONSTRAINT') || /23505|2601|2627/.test(e.code)) return 'unique_lost';
  }
  if (/SQLITE_BUSY|database is locked|could not serialize|deadlock detected/i.test(e?.message ?? '')) {
    return 'lock_lost';
  }
  if (/unique constraint|duplicate entry|cannot be duplicate/i.test(e?.message ?? '')) return 'unique_lost';
  return null;
};

/** The storage layer owns `id` and `revision`: they never persist inside the document. */
const withoutOwnFields = (doc: Record<string, unknown>): Record<string, unknown> => {
  const clean = { ...doc };
  delete clean.id;
  delete clean.revision;
  return clean;
};

export function createSqlStore(instance: Knex): DataStore {
  const table = (name: CollectionName) => instance(name);

  /** The strictly increasing per-collection sequence. The revision is computed by the INSERT or
   *  UPDATE statement itself — `MAX(revision)+1` evaluated when the statement takes the row
   *  lock — so a concurrent writer can never observe a stale maximum (the SQLite shape; any
   *  other engine gets its own locking strategy in its adapter, see the lot-1.4 capability
   *  matrix). No clock dependence: a revision is a sequence value, not a date. */
  const freshRevision = (name: CollectionName) =>
    instance.raw('(SELECT COALESCE(MAX(revision), 0) + 1 FROM ??)', [name]);

  /** writeOne marker: the revision is computed by the statement itself, then read back —
   *  the value is shared with the remaining ops of the same commit (one commit = one tie group). */
  const FRESH_STAMP = Symbol('fresh revision');

  const writeOne = async (
    trx: Knex.Transaction,
    op: WriteOp,
    revision: number | typeof FRESH_STAMP,
    insertOnly = false
  ): Promise<number> => {
    // `undefined` leaves the stored shape: a removed field is absent on every provider
    const doc = stripUndefined(op.doc) as Record<string, unknown>;
    delete doc.id;
    const row: Record<string, unknown> = {
      id: op.id,
      data: JSON.stringify(doc),
      revision: revision === FRESH_STAMP ? freshRevision(op.name) : revision,
      updated_at: new Date().toISOString(),
      deleted: doc.deleted === true ? 1 : 0,
    };
    if (insertOnly) {
      // A plain insert fails on an existing row (primary key): the atomic test-and-set a
      // reservation claim relies on — a concurrent batch that took the row makes this one fail.
      await trx(op.name).insert(row);
    } else {
      await trx(op.name)
        .insert(row)
        .onConflict('id')
        .merge({
          data: row.data,
          revision: revision === FRESH_STAMP ? instance.raw('excluded.revision') : revision,
          updated_at: row.updated_at,
          deleted: row.deleted,
        });
    }
    if (revision !== FRESH_STAMP) return revision;
    // Read the freshly computed revision back: the rest of the batch shares it
    const back = await trx(op.name).where('id', op.id).first('revision');
    return Number(back?.revision ?? 0);
  };

  const materialize = (id: string, data: string, revision: number): Record<string, unknown> => ({
    ...(JSON.parse(data) as Record<string, unknown>),
    id,
    revision,
  });

  /** The guarded field of a row (null when absent, deleted, or not a number). */
  const rowGuardValue = (row: { data: string; deleted: number | boolean } | undefined, guard: WriteGuard) => {
    if (!row || row.deleted) return null;
    const data = JSON.parse(row.data) as Record<string, unknown>;
    return typeof data[guard.field] === 'number' ? (data[guard.field] as number) : null;
  };

  /** Same read outside a transaction, to classify the failure of an aborted guarded batch. */
  const guardValue = async (guard: WriteGuard): Promise<number | null> =>
    rowGuardValue(await table(guard.name).where('id', guard.id).first('data', 'deleted'), guard);

  return {
    /** Per-collection changes in contract order (revision, id): the single pagination authority.
     *  SQL orders natively on (revision, id) — the whole group machinery only exists for
     *  Firestore, whose real order sorts by the timestamp itself. */
    async changes(name, cursor: ChangeCursor, limit): Promise<StorageChanges> {
      const c = normalizeCursor(cursor);
      const inclusive = typeof cursor === 'object' && cursor.id === undefined; // resume at the whole revision
      const L = Math.max(1, limit);
      let rows = await table(name)
        .where((q) => {
          if (inclusive) {
            q.where('revision', '>=', c.revision); // re-deliver the whole frontier revision
          } else if (c.id !== undefined) {
            q.where('revision', '>', c.revision).orWhere((tie) =>
              tie.where('revision', c.revision).where('id', '>', c.id as string)
            );
          } else {
            q.where('revision', '>', c.revision); // legacy number cursor: strict, as before
          }
        })
        .orderBy('revision', 'asc')
        .orderBy('id', 'asc')
        .limit(L)
        .select('id', 'data', 'revision', 'deleted');
      // A revision's tie set (one commit's changes) is never cut: complete the last delivered
      // revision even past the limit — the limit is soft by contract.
      if (rows.length >= L && rows.length > 0) {
        const tieLast = rows[rows.length - 1];
        const rest = await table(name)
          .where('revision', Number(tieLast.revision))
          .where('id', '>', tieLast.id)
          .orderBy('id', 'asc')
          .select('id', 'data', 'revision', 'deleted');
        rows = [...rows, ...rest];
      }
      const items: Record<string, unknown>[] = [];
      const removedIds: string[] = [];
      let revision = c.revision;
      let lastPosition: SyncCursor | undefined;
      for (const row of rows) {
        revision = Number(row.revision);
        lastPosition = { revision, id: row.id };
        if (row.deleted) removedIds.push(row.id);
        else items.push(materialize(row.id, row.data, revision));
      }
      // `more` = a next call from the returned cursor would answer something (exact check)
      let more = false;
      if (lastPosition) {
        const remaining = await table(name)
          .whereRaw('(revision > ? OR (revision = ? AND id > ?))', [
            lastPosition.revision,
            lastPosition.revision,
            // The cursor is always built with an id in this code path (last delivered row)
            lastPosition.id as string,
          ])
          .select('id')
          .limit(1);
        more = remaining.length > 0;
      }
      return {
        items,
        removedIds,
        revision,
        ...(lastPosition ? { cursor: lastPosition } : {}),
        more,
      };
    },

    async get(name, id) {
      const row = await table(name).where('id', id).first('id', 'data', 'revision', 'deleted');
      return row && !row.deleted ? materialize(row.id, row.data, Number(row.revision)) : null;
    },

    async findFirst(name, field, value) {
      const rows = await table(name)
        .whereRaw(`${jsonField(instance, 'data', field)} = ?`, value)
        .andWhere('deleted', 0)
        .limit(1)
        .select('id', 'data', 'revision');
      return rows.length ? materialize(rows[0].id, rows[0].data, Number(rows[0].revision)) : null;
    },

    async findWhere(name, field, value, limit) {
      const rows = await table(name)
        .whereRaw(`${jsonField(instance, 'data', field)} = ?`, value)
        .andWhere('deleted', 0)
        .orderBy('revision', 'asc')
        .limit(Math.max(1, limit))
        .select('id', 'data', 'revision');
      return rows.map((r: { id: string; data: string; revision: number }) =>
        materialize(r.id, r.data, Number(r.revision))
      );
    },

    async page(name, query: DirectoryQuery): Promise<DirectoryPage> {
      const withFilters = (q: Knex.QueryBuilder): Knex.QueryBuilder => {
        if (query.where) q = q.whereRaw(`${jsonField(instance, 'data', query.where.field)} = ?`, query.where.value);
        if (query.prefix) {
          q = q.whereRaw(`${jsonField(instance, 'data', query.prefix.field)} >= ?`, query.prefix.value);
          q = q.whereRaw(`${jsonField(instance, 'data', query.prefix.field)} <= ?`, `${query.prefix.value}\uf8ff`);
        }
        return q;
      };
      let q = withFilters(table(name).select('id', 'data', 'revision'))
        .orderBy('id', 'asc')
        .limit(Math.max(1, query.limit));
      if (query.after) q = q.where('id', '>', query.after);
      const rows = await q;
      const countRow = await withFilters(table(name).count({ total: '*' })).first();
      return {
        items: rows.map((r: { id: string; data: string; revision: number }) =>
          materialize(r.id, r.data, Number(r.revision))
        ),
        total: Number((countRow as { total: number } | undefined)?.total ?? rows.length),
        nextCursor:
          rows.length >= Math.max(1, query.limit) && rows.length > 0 ? (rows.at(-1) as { id: string }).id : null,
      };
    },

    async ids(name) {
      const rows = await table(name).select('id');
      return rows.map((r: { id: string }) => r.id);
    },

    async maxRevision(name) {
      const row = await table(name).max({ max: 'revision' }).first();
      return row ? Number(row.max ?? 0) || 0 : 0;
    },

    async put(name, id, doc): Promise<number> {
      // The validated shape is the sanitized one: `undefined` never reaches the provider.
      // A lost write lock is retried within the shared budget (a single-INSERT transaction
      // never returns a cas: only lock contention can conflict here).
      const clean = stripUndefined(doc) as Record<string, unknown>;
      assertWritable(name, id, clean);
      return withTransactRetries(
        () => instance.transaction((trx) => writeOne(trx, { name, id, doc: clean }, FRESH_STAMP)),
        (error) => conflictClass(error) === 'lock_lost'
      );
    },

    async remove(name, id): Promise<number> {
      assertWritable(name, id, { deleted: true });
      return withTransactRetries(
        () => instance.transaction((trx) => writeOne(trx, { name, id, doc: { deleted: true } }, FRESH_STAMP)),
        (error) => conflictClass(error) === 'lock_lost'
      );
    },

    async commit(ops, guard): Promise<CommitResult> {
      assertCommitEnvelope(ops);
      // A lost write lock is retried within the shared budget — the guard itself is re-read
      // at every attempt, so a retry never overrides a change the batch did not see. The
      // guard and uniqueness conflicts are NOT retried here: they come back as the contract's
      // `{ ok: false, conflict }` (the caller decides), or a clean storage error past budget.
      return withTransactRetries(
        async () => {
          try {
            const batchRevision = await instance.transaction(async (trx) => {
              let claimAbsentRow = false;
              if (guard) {
                const row = await trx(guard.name).where('id', guard.id).first('data', 'deleted');
                const value = rowGuardValue(row, guard);
                if (value !== guard.expected) throw new GuardConflict();
                // A reservation claims a row that does not exist at all with a plain insert (a deleted
                // row still exists: it comes back to life through the merge, last writer wins).
                claimAbsentRow = !row;
              }
              // Every collection touched gets ONE revision shared by all its ops (a commit is one
              // moment of the collection's history — the tie set a cursor group covers completely).
              // The primary key rejects a concurrent batch that claimed the same absent guarded row
              // in between (a merge would silently overwrite it and break the uniqueness).
              const insertOnly = claimAbsentRow;
              const revisions = new Map<CollectionName, number>();
              let revision = 0;
              for (const op of ops) {
                if (!revisions.has(op.name)) {
                  // The collection's first op stamps atomically (the INSERT computes the revision);
                  // the remaining ops of the batch share it (one commit = one tie group).
                  revisions.set(op.name, await writeOne(trx, op, FRESH_STAMP, insertOnly));
                } else {
                  await writeOne(trx, op, revisions.get(op.name) as number, insertOnly);
                }
                revision = Math.max(revision, revisions.get(op.name) as number);
              }
              return revision;
            });
            return batchRevision ? { ok: true, revision: batchRevision } : { ok: true, revision: 0 };
          } catch (error) {
            if (error instanceof GuardConflict) return { ok: false, conflict: true };
            // The batch failed after the guard was read: it may have lost a clean race (a concurrent
            // batch claimed the guarded row in between). The guard is read back once more — when it
            // no longer holds, the failure is a conflict, not a storage error; otherwise it rethrows.
            if (guard && (await guardValue(guard)) !== guard.expected) return { ok: false, conflict: true };
            throw error;
          }
        },
        (error) => conflictClass(error) === 'lock_lost'
      );
    },

    async transact<T>(
      name: CollectionName,
      id: string,
      operation: (current: Record<string, unknown> | null) => TransactOutcome<T>
    ): Promise<T> {
      // One attempt = read, run the pure operation, claim the write — inside one transaction.
      // The claim is a compare-and-swap on the revision (the write only lands when the row is
      // still exactly what was read), so a contended attempt retries over the fresh state and
      // a read-merge-write can never overwrite a change it did not see. Same guarantee as the
      // automatic re-runs of a Firestore transaction; the operation being pure makes retries
      // safe. The retry budget is the shared one (conflicts.ts): initial attempt + 3 rejeux,
      // then a clean storage error.
      return withTransactRetries(
        () =>
          instance.transaction(async (trx) => {
            const row = await trx(name).where('id', id).first('id', 'data', 'revision', 'deleted');
            const current = row && !row.deleted ? materialize(row.id, row.data, Number(row.revision)) : null;
            const outcome: TransactOutcome<T> = operation(current);
            if (outcome.next && outcome.next !== current) {
              const doc = withoutOwnFields(stripUndefined(outcome.next) as Record<string, unknown>);
              assertWritable(name, id, doc);
              if (!row) {
                // The row must still be absent: a plain insert (the primary key rejects a
                // concurrent claimant that took the row in between). The revision is computed
                // by the INSERT itself — fresh after the write lock.
                await writeOne(trx, { name, id, doc }, FRESH_STAMP, true);
              } else {
                // The compare-and-swap on the read revision stays the conflict detector; the
                // new revision is computed by the UPDATE itself, after the write lock.
                const updated = await trx(name)
                  .where({ id, revision: Number(row.revision) })
                  .update({
                    data: JSON.stringify(doc),
                    revision: freshRevision(name),
                    updated_at: new Date().toISOString(),
                    deleted: 0,
                  });
                if (updated === 0) throw new TransactConflict();
              }
            }
            return outcome.result;
          }),
        (error) => conflictClass(error) !== null
      );
    },
  };
}

/** Creates one table per collection of the registry (idempotent — safe to call at startup). */
export async function ensureSchema(instance: Knex): Promise<void> {
  for (const spec of Object.values(COLLECTIONS)) {
    await instance.schema.hasTable(spec.name).then((exists) => {
      if (exists) return undefined;
      return instance.schema.createTable(spec.name, (t) => {
        t.text('id').primary();
        t.jsonb('data');
        t.bigInteger('revision').index();
        t.text('updated_at');
        t.boolean('deleted').defaultTo(false);
        t.index(['revision', 'id']); // the contract order (revision, id) natively indexable
      });
    });
  }
}

/** The SQLite configuration used everywhere the adapter runs (DATA_STORE=sql, the tests):
 *  WAL so readers never block a writer, synchronous=NORMAL (the WAL standard — no fsync per
 *  commit, documented in the lot-1.4 matrix), and a SHORT busy timeout: better-sqlite3's
 *  busy wait blocks the whole event loop, so any real wait would freeze the lock holder
 *  itself — within one process, contention is resolved by the retry budget (conflicts.ts),
 *  not by waiting. */
export function createSqliteKnex(filename: string): Knex {
  return knex({
    client: 'better-sqlite3',
    connection: { filename },
    useNullAsDefault: true,
    pool: {
      // Knex types the connection loosely; better-sqlite3 hands its own Database object
      afterCreate: ((
        connection: { pragma: (statement: string) => unknown },
        callback: (error: null, connection: unknown) => void
      ) => {
        connection.pragma('busy_timeout = 10');
        connection.pragma('journal_mode = WAL');
        connection.pragma('synchronous = NORMAL');
        callback(null, connection);
      }) as never,
    },
  });
}
