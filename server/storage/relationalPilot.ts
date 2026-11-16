import type { Knex } from 'knex';
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
 * Relational pilot (HARNESS ONLY — never wired in the app): proves the DataStore contract
 * over a genuinely relational SQLite representation for the Identity domain, with typed
 * columns, keys and constraints — never a JSON column standing in for the business models.
 *
 * - `pilot_users` (+ `pilot_user_favorites`, `pilot_user_saved_fridge` liaison tables): the
 *   profile with its id lists as explicit relations, positioned like the stored arrays;
 * - `pilot_auth`: the credentials (the PHC string embeds the algorithm and its parameters);
 * - `pilot_email_index`: the reservation, its technical id being the reversible Base64URL of
 *   the normalized address (the shape in force at the storage switch), with the address as a
 *   unique column — the integrity the generic harness cannot express.
 *
 * A field without a mapped column is a loud contract error (never a silent JSON dump); a
 * NULL column comes back as an absent field (the domain parsers treat both alike).
 */
export const PILOT_COLLECTIONS: CollectionName[] = ['users', 'auth', 'email_index'];

type FieldMap = Record<string, string>;

const USER_FIELDS: FieldMap = {
  type: 'type',
  email: 'email',
  displayName: 'display_name',
  phone: 'phone',
  preferredLanguage: 'preferred_language',
  isAnonymous: 'is_anonymous',
  lastLogin: 'last_login',
};
const USER_ADDRESS_FIELDS: Record<string, string> = {
  line: 'address_line',
  region: 'address_region',
  city: 'address_city',
  postalCode: 'address_postal_code',
  country: 'address_country',
};
const AUTH_FIELDS: FieldMap = {
  password_phc: 'password_phc',
  failed_attempts: 'failed_attempts',
  locked_until: 'locked_until',
  updated_at: 'updated_at',
};
const EMAIL_INDEX_FIELDS: FieldMap = { uid: 'uid', taken: 'taken' };

/** Flattens the document into its typed row; an unmapped field is a loud error. Every mapped
 *  column is written (absent → NULL): a put is a whole overwrite, never a partial merge. */
function toRow(collection: CollectionName, doc: Record<string, unknown>): Record<string, unknown> {
  const fields = collection === 'users' ? USER_FIELDS : collection === 'auth' ? AUTH_FIELDS : EMAIL_INDEX_FIELDS;
  const allowed = new Set([
    ...Object.keys(fields),
    ...(collection === 'users' ? ['uid', 'address', 'favorites', 'savedFridge'] : []),
  ]);
  for (const key of Object.keys(doc)) {
    if (!allowed.has(key)) {
      throw new DocumentValidationError('invalid_document', `${collection}.${key}: no mapped column`);
    }
  }
  const row: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(fields)) {
    const value = doc[field];
    if (value === undefined || value === null) row[column] = null;
    else if (typeof value === 'boolean') row[column] = value ? 1 : 0;
    else if (typeof value === 'string' || typeof value === 'number') row[column] = value;
    else throw new DocumentValidationError('invalid_document', `${collection}.${field}: not a flat value`);
  }
  if (collection === 'users') {
    const address = doc.address as Record<string, unknown> | undefined;
    if (address !== undefined && (address === null || typeof address !== 'object' || Array.isArray(address))) {
      throw new DocumentValidationError('invalid_document', 'users.address: not an object');
    }
    for (const [field, column] of Object.entries(USER_ADDRESS_FIELDS)) {
      const value = address?.[field];
      if (value === undefined || value === null) row[column] = null;
      else if (typeof value !== 'string')
        throw new DocumentValidationError('invalid_document', `users.address.${field}: not a string`);
      else row[column] = value;
    }
  }
  return row;
}

/** Rebuilds the contract document from its typed columns (NULL = absent field). */
function toDoc(
  collection: CollectionName,
  row: Record<string, unknown>,
  extra: { favorites?: string[]; savedFridge?: string[] } = {}
): Record<string, unknown> {
  const fields = collection === 'users' ? USER_FIELDS : collection === 'auth' ? AUTH_FIELDS : EMAIL_INDEX_FIELDS;
  const doc: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(fields)) {
    const value = row[column];
    if (value === null || value === undefined) continue;
    doc[field] = column === 'is_anonymous' ? value === 1 : value;
  }
  if (collection === 'users') {
    doc.uid = row.id; // the identity is the primary key: no separate uid column
    for (const [field, column] of Object.entries(USER_ADDRESS_FIELDS)) {
      const value = row[column];
      if (value === null || value === undefined) continue;
      doc.address = { ...(doc.address as Record<string, unknown> | undefined), [field]: value };
    }
    if (extra.favorites) doc.favorites = extra.favorites;
    if (extra.savedFridge) doc.savedFridge = extra.savedFridge;
  }
  return doc;
}

export function createRelationalPilot(knex: Knex): DataStore {
  const supported = (name: CollectionName): void => {
    if (!PILOT_COLLECTIONS.includes(name)) {
      throw new DocumentValidationError(
        'invalid_document',
        `the relational pilot only serves ${PILOT_COLLECTIONS.join(', ')}`
      );
    }
  };
  /** The typed column behind one mapped field (filters never use the whole mapped row). */
  const columnOf = (name: CollectionName, field: string): string => {
    const fields = name === 'users' ? USER_FIELDS : name === 'auth' ? AUTH_FIELDS : EMAIL_INDEX_FIELDS;
    if (!Object.prototype.hasOwnProperty.call(fields, field)) {
      throw new DocumentValidationError('invalid_document', `${name}.${field}: no mapped column`);
    }
    return fields[field as keyof typeof fields] as string;
  };
  const table = (name: CollectionName) => knex(`pilot_${name}`);
  /** The strictly increasing sequence: max(stored)+1 inside the write transaction. */
  const stamp = async (trx: Knex.Transaction, name: CollectionName): Promise<number> => {
    const row = await trx(`pilot_${name}`).max({ max: 'revision' }).first();
    const max = typeof row?.max === 'number' ? row.max : Number(row?.max ?? 0);
    return max + 1;
  };

  /** The guarded field of a row (null when absent, deleted, or not a number). */
  const guardValue = async (guard: WriteGuard, trx?: Knex.Transaction): Promise<number | null> => {
    const q = (trx ?? knex)(`pilot_${guard.name}`).where('id', guard.id).first();
    const row = (await q) as (Record<string, unknown> & { deleted?: number | boolean }) | undefined;
    if (!row || row.deleted) return null;
    const doc = toDoc(guard.name, row);
    return typeof doc[guard.field] === 'number' ? (doc[guard.field] as number) : null;
  };

  const readOne = async (name: CollectionName, id: string, trx?: Knex.Transaction) => {
    const row = await (trx ?? knex)(`pilot_${name}`).where('id', id).first();
    if (!row || row.deleted) return null;
    const extra: { favorites?: string[]; savedFridge?: string[] } = {};
    if (name === 'users') {
      const lists = await readLists(id, trx ?? knex);
      if (lists.favorites) extra.favorites = lists.favorites;
      if (lists.savedFridge) extra.savedFridge = lists.savedFridge;
    }
    return { doc: toDoc(name, row as Record<string, unknown>, extra), revision: Number(row.revision) };
  };

  const readLists = async (
    uid: string,
    db: Knex | Knex.Transaction
  ): Promise<{ favorites?: string[]; savedFridge?: string[] }> => {
    const out: { favorites?: string[]; savedFridge?: string[] } = {};
    for (const [linkTable, key] of [
      ['pilot_user_favorites', 'favorites'],
      ['pilot_user_saved_fridge', 'savedFridge'],
    ] as const) {
      const rows = (await db(linkTable).where('uid', uid).orderBy('position', 'asc')) as { item_id: string }[];
      if (rows.length) out[key] = rows.map((r) => r.item_id);
    }
    return out;
  };

  const writeOne = async (trx: Knex.Transaction, op: WriteOp, revision: number): Promise<void> => {
    if (op.doc.deleted === true) {
      // A deletion marker: the row stays (relations intact), its revision moves forward.
      // SQLite evaluates the NOT NULL constraints of the inserted tuple even when the
      // conflict clause resolves on the id — a bare marker cannot be inserted in a typed
      // entity table. A marker therefore only ever soft-deletes a stored row: the identity
      // domain always removes existing documents (the contract never tombstones an absent id
      // in this pilot; the generic stores publish that case, tested on memory and SQLite).
      const updated = await trx(`pilot_${op.name}`).where('id', op.id).update({ revision, deleted: 1 });
      if (updated === 0) {
        throw new DocumentValidationError(
          'invalid_document',
          `${op.name}.${op.id}: a deletion marker needs the stored row (relational pilot)`
        );
      }
      return;
    }
    // `undefined` leaves the stored shape: a removed field is absent on every provider
    const doc = stripUndefined(op.doc) as Record<string, unknown>;
    const row = toRow(op.name, doc);
    row.id = op.id;
    row.revision = revision;
    row.deleted = 0;
    if (op.name === 'email_index' && !('email' in row)) {
      // The technical id is the reversible Base64URL of the normalized address: the address
      // column is derived from it (the unique constraint then guards the reservation).
      row.email = Buffer.from(op.id, 'base64url').toString('utf8');
    }
    await trx(`pilot_${op.name}`).insert(row).onConflict('id').merge(row);
    if (op.name === 'users') {
      // The id lists are explicit relations: rewritten whole with the document (same transaction)
      for (const [linkTable, field] of [
        ['pilot_user_favorites', 'favorites'],
        ['pilot_user_saved_fridge', 'savedFridge'],
      ] as const) {
        await trx(linkTable).where('uid', op.id).delete();
        const list = doc[field];
        if (Array.isArray(list)) {
          for (let position = 0; position < list.length; position++) {
            await trx(linkTable).insert({ uid: op.id, item_id: list[position], position });
          }
        }
      }
    }
  };

  return {
    async changes(name, cursor: ChangeCursor, limit): Promise<StorageChanges> {
      supported(name);
      const c = normalizeCursor(cursor);
      const inclusive = typeof cursor === 'object' && cursor.id === undefined;
      const L = Math.max(1, limit);
      let rows = await table(name)
        .where((q) => {
          if (inclusive) q.where('revision', '>=', c.revision);
          else if (c.id !== undefined) {
            q.where('revision', '>', c.revision).orWhere((tie) =>
              tie.where('revision', c.revision).where('id', '>', c.id as string)
            );
          } else q.where('revision', '>', c.revision);
        })
        .orderBy('revision', 'asc')
        .orderBy('id', 'asc')
        .limit(L)
        .select();
      if (rows.length >= L && rows.length > 0) {
        const tieLast = rows[rows.length - 1];
        const rest = await table(name)
          .where('revision', Number(tieLast.revision))
          .where('id', '>', tieLast.id)
          .orderBy('id', 'asc')
          .select();
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
        else {
          const read = await readOne(name, row.id);
          items.push({ ...read!.doc, id: row.id, revision });
        }
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
      supported(name);
      const read = await readOne(name, id);
      return read ? { ...read.doc, id, revision: read.revision } : null;
    },

    async findFirst(name, field, value) {
      supported(name);
      const row = await table(name).where(columnOf(name, field), value).whereNot('deleted', 1).first();
      if (!row) return null;
      const read = await readOne(name, row.id);
      return { ...read!.doc, id: row.id, revision: Number(row.revision) };
    },

    async findWhere(name, field, value, limit) {
      supported(name);
      const rows = await table(name)
        .where(columnOf(name, field), value)
        .whereNot('deleted', 1)
        .orderBy('revision', 'asc')
        .limit(Math.max(1, limit))
        .select();
      const found: Record<string, unknown>[] = [];
      for (const row of rows) {
        const read = await readOne(name, row.id);
        found.push({ ...read!.doc, id: row.id, revision: Number(row.revision) });
      }
      return found;
    },

    async page(name, query: DirectoryQuery): Promise<DirectoryPage> {
      supported(name);
      const withFilters = (q: Knex.QueryBuilder): Knex.QueryBuilder => {
        if (query.where) q = q.where(columnOf(name, query.where.field), query.where.value);
        if (query.prefix) {
          const key = columnOf(name, query.prefix.field);
          q = q.where(key, '>=', query.prefix.value).where(key, '<=', `${query.prefix.value}\uf8ff`);
        }
        return q;
      };
      let q = withFilters(table(name).whereNot('deleted', 1).select())
        .orderBy('id', 'asc')
        .limit(Math.max(1, query.limit));
      if (query.after) q = q.where('id', '>', query.after);
      const rows = await q;
      const countRow = await withFilters(table(name).whereNot('deleted', 1).count({ total: '*' })).first();
      const items: Record<string, unknown>[] = [];
      for (const row of rows) {
        const read = await readOne(name, row.id);
        items.push({ ...read!.doc, id: row.id, revision: Number(row.revision) });
      }
      return {
        items,
        total: Number((countRow as { total: number } | undefined)?.total ?? rows.length),
        nextCursor: rows.length >= Math.max(1, query.limit) && rows.length > 0 ? rows[rows.length - 1].id : null,
      };
    },

    async ids(name) {
      supported(name);
      const rows = await table(name).select('id');
      return rows.map((r: { id: string }) => r.id);
    },

    async maxRevision(name) {
      supported(name);
      const row = await table(name).max({ max: 'revision' }).first();
      return row ? Number(row.max ?? 0) || 0 : 0;
    },

    async put(name, id, doc): Promise<number> {
      supported(name);
      const clean = stripUndefined(doc) as Record<string, unknown>;
      assertWritable(name, id, clean);
      return knex.transaction(async (trx) => {
        const revision = await stamp(trx, name);
        await writeOne(trx, { name, id, doc: clean }, revision);
        return revision;
      });
    },

    async remove(name, id): Promise<number> {
      supported(name);
      assertWritable(name, id, { deleted: true });
      return knex.transaction(async (trx) => {
        const revision = await stamp(trx, name);
        await writeOne(trx, { name, id, doc: { deleted: true } }, revision);
        return revision;
      });
    },

    async commit(ops, guard): Promise<CommitResult> {
      assertCommitEnvelope(ops);
      for (const op of ops) supported(op.name);
      try {
        const revision = await knex.transaction(async (trx) => {
          if (guard && (await guardValue(guard, trx)) !== guard.expected) return null; // conflict
          const revisions = new Map<CollectionName, number>();
          let top = 0;
          for (const op of ops) {
            if (!revisions.has(op.name)) revisions.set(op.name, await stamp(trx, op.name));
            const value = revisions.get(op.name) as number;
            await writeOne(trx, op, value);
            top = Math.max(top, value);
          }
          return top;
        });
        return revision !== null ? { ok: true, revision } : { ok: false, conflict: true };
      } catch (error) {
        if (error instanceof DocumentValidationError) throw error;
        if (guard && (await guardValue(guard)) !== guard.expected) return { ok: false, conflict: true };
        throw error;
      }
    },

    async transact<T>(
      name: CollectionName,
      id: string,
      operation: (current: Record<string, unknown> | null) => TransactOutcome<T>
    ): Promise<T> {
      supported(name);
      for (let attempt = 0; ; attempt++) {
        try {
          return await knex.transaction(async (trx) => {
            const read = await readOne(name, id, trx);
            const current = read ? { ...read.doc, id, revision: read.revision } : null;
            const outcome: TransactOutcome<T> = operation(current);
            if (outcome.next && outcome.next !== current) {
              const doc = stripUndefined(outcome.next) as Record<string, unknown>;
              delete doc.id;
              delete doc.revision;
              assertWritable(name, id, doc);
              const revision = await stamp(trx, name);
              await writeOne(trx, { name, id, doc }, revision);
            }
            return outcome.result;
          });
        } catch (error) {
          // SQLite serialises writers; a rare busy lock is retried a bounded number of times
          if (attempt < 10 && String((error as { code?: string }).code ?? '').startsWith('SQLITE_BUSY')) continue;
          throw error;
        }
      }
    },
  };
}

/** Creates the pilot's relational schema (harness only, idempotent). */
export async function ensurePilotSchema(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('pilot_users'))) {
    await knex.schema.createTable('pilot_users', (t) => {
      t.text('id').primary();
      t.text('type').notNullable();
      t.text('email').unique();
      t.text('display_name');
      t.text('phone');
      t.text('preferred_language');
      t.text('address_line');
      t.text('address_city');
      t.text('address_region');
      t.text('address_postal_code');
      t.text('address_country');
      t.integer('is_anonymous').notNullable();
      t.text('last_login');
      t.integer('revision').notNullable();
      t.integer('deleted').notNullable().defaultTo(0);
      t.index(['revision', 'id']);
    });
  }
  if (!(await knex.schema.hasTable('pilot_auth'))) {
    await knex.schema.createTable('pilot_auth', (t) => {
      t.text('id').primary();
      t.text('password_phc').notNullable();
      t.integer('failed_attempts').notNullable();
      t.integer('locked_until');
      t.text('updated_at');
      t.integer('revision').notNullable();
      t.integer('deleted').notNullable().defaultTo(0);
      t.foreign('id').references('pilot_users.id');
      t.index(['revision', 'id']);
    });
  }
  if (!(await knex.schema.hasTable('pilot_email_index'))) {
    await knex.schema.createTable('pilot_email_index', (t) => {
      t.text('id').primary();
      t.text('email').notNullable().unique();
      t.text('uid');
      t.integer('taken');
      t.integer('revision').notNullable();
      t.integer('deleted').notNullable().defaultTo(0);
      t.foreign('uid').references('pilot_users.id');
      t.index(['revision', 'id']);
    });
  }
  for (const table of ['pilot_user_favorites', 'pilot_user_saved_fridge']) {
    if (!(await knex.schema.hasTable(table))) {
      await knex.schema.createTable(table, (t) => {
        t.text('uid').notNullable();
        t.text('item_id').notNullable();
        t.integer('position').notNullable();
        t.primary(['uid', 'item_id']);
        t.foreign('uid').references('pilot_users.id');
      });
    }
  }
}
