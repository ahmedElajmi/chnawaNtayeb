import type { Knex } from 'knex';
import { COLLECTIONS } from './collections';
import type {
  CollectionName,
  CommitResult,
  DataStore,
  DirectoryPage,
  DirectoryQuery,
  StorageChanges,
  WriteOp,
} from './types';

/**
 * SQL implementation of the DataStore contract — the portability preparation (PR E).
 * One table per collection of the registry, a uniform shape for every engine:
 *   id (text, primary key) · data (JSON: the document without its id) · revision (ms) ·
 *   updated_at · deleted (0/1 — deletion markers).
 * The documents keep their exact stored shape: the core parsers are untouched, and a
 * switch from Firestore to SQL (or between SQL engines) changes nothing else.
 *
 * NOT wired yet: `server/app.ts` still uses Firestore. To switch, create the Knex instance
 * (Postgres, MySQL, SQL Server — or better-sqlite3 for a local run), call `ensureSchema()`
 * and pass it to `createSqlStore`. Every engine passes the same contract suite
 * (server/storage/contract.ts); the SQLite run proves it locally.
 */

/** The JSON path dialects of the engines we target (equality queries on one field). */
function jsonField(knex: Knex, column: string, field: string): string {
  const client = knex.client.config.client;
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

export function createSqlStore(knex: Knex): DataStore {
  const table = (name: CollectionName) => knex(name);

  /** Strictly increasing revision per collection: the clock, held back by the newest row. */
  const stamp = async (trx: Knex.Transaction, name: CollectionName): Promise<number> => {
    const row = await trx(name).max({ max: 'revision' }).first();
    const max = typeof row?.max === 'number' ? row.max : Number(row?.max ?? 0);
    return Math.max(max + 1, Date.now());
  };

  const writeOne = async (trx: Knex.Transaction, op: WriteOp, revision: number): Promise<void> => {
    const doc = { ...op.doc };
    delete doc.id;
    await trx(op.name)
      .insert({
        id: op.id,
        data: JSON.stringify(doc),
        revision,
        updated_at: new Date().toISOString(),
        deleted: doc.deleted === true ? 1 : 0,
      })
      .onConflict('id')
      .merge({
        data: JSON.stringify(doc),
        revision,
        updated_at: new Date().toISOString(),
        deleted: doc.deleted === true ? 1 : 0,
      });
  };

  const materialize = (id: string, data: string, revision: number): Record<string, unknown> => ({
    ...(JSON.parse(data) as Record<string, unknown>),
    id,
    revision,
  });

  return {
    async changes(name, since, limit): Promise<StorageChanges> {
      const rows = await table(name)
        .where('revision', '>', since)
        .orderBy('revision', 'asc')
        .limit(Math.max(1, limit))
        .select('id', 'data', 'revision', 'deleted');
      const items: Record<string, unknown>[] = [];
      const removedIds: string[] = [];
      let revision = since;
      for (const row of rows) {
        revision = Number(row.revision);
        if (row.deleted) removedIds.push(row.id);
        else items.push(materialize(row.id, row.data, Number(row.revision)));
      }
      return { items, removedIds, revision, more: rows.length >= Math.max(1, limit) };
    },

    async get(name, id) {
      const row = await table(name).where('id', id).first('id', 'data', 'revision', 'deleted');
      return row && !row.deleted ? materialize(row.id, row.data, Number(row.revision)) : null;
    },

    async findFirst(name, field, value) {
      const rows = await table(name)
        .whereRaw(`${jsonField(knex, 'data', field)} = ?`, value)
        .andWhere('deleted', 0)
        .limit(1)
        .select('id', 'data', 'revision');
      return rows.length ? materialize(rows[0].id, rows[0].data, Number(rows[0].revision)) : null;
    },

    async findWhere(name, field, value, limit) {
      const rows = await table(name)
        .whereRaw(`${jsonField(knex, 'data', field)} = ?`, value)
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
        if (query.where) q = q.whereRaw(`${jsonField(knex, 'data', query.where.field)} = ?`, query.where.value);
        if (query.prefix) {
          q = q.whereRaw(`${jsonField(knex, 'data', query.prefix.field)} >= ?`, query.prefix.value);
          q = q.whereRaw(`${jsonField(knex, 'data', query.prefix.field)} <= ?`, `${query.prefix.value}\uf8ff`);
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
      return knex.transaction(async (trx) => {
        const revision = await stamp(trx, name);
        await writeOne(trx, { name, id, doc }, revision);
        return revision;
      });
    },

    async remove(name, id): Promise<number> {
      return knex.transaction(async (trx) => {
        const revision = await stamp(trx, name);
        await writeOne(trx, { name, id, doc: { deleted: true } }, revision);
        return revision;
      });
    },

    async commit(ops, guard): Promise<CommitResult> {
      return knex.transaction(async (trx) => {
        if (guard) {
          const row = await trx(guard.name).where('id', guard.id).first('data', 'deleted');
          const value =
            row && !row.deleted
              ? (() => {
                  const data = JSON.parse(row.data) as Record<string, unknown>;
                  return typeof data[guard.field] === 'number' ? (data[guard.field] as number) : null;
                })()
              : null;
          if (value !== guard.expected) return { ok: false, conflict: true };
        }
        let revision = 0;
        for (const op of ops) {
          revision = await stamp(trx, op.name);
          await writeOne(trx, op, revision);
        }
        return revision ? { ok: true, revision } : { ok: true, revision: Date.now() };
      });
    },
  };
}

/** Creates one table per collection of the registry (idempotent — safe to call at startup). */
export async function ensureSchema(knex: Knex): Promise<void> {
  for (const spec of Object.values(COLLECTIONS)) {
    await knex.schema.hasTable(spec.name).then((exists) => {
      if (exists) return undefined;
      return knex.schema.createTable(spec.name, (t) => {
        t.text('id').primary();
        t.jsonb('data');
        t.bigInteger('revision').index();
        t.text('updated_at');
        t.boolean('deleted').defaultTo(false);
      });
    });
  }
}
