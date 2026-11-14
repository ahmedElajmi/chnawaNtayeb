import { DocumentData, FieldValue, Transaction, type Firestore, type Query } from 'firebase-admin/firestore';
import type {
  CollectionName,
  CommitResult,
  DataStore,
  DirectoryPage,
  DirectoryQuery,
  StorageChanges,
  WriteGuard,
  WriteOp,
} from './types';

/**
 * Firestore implementation of the DataStore contract (Admin SDK, bypasses the client rules:
 * every read and write is authorised by the routes, not by the database). Revisions are
 * server timestamps, serialised to epoch milliseconds for the HTTP layer.
 */
export function createFirestoreStore(db: Firestore): DataStore {
  const dbx = db;
  const table = (name: CollectionName) => dbx.collection(name);

  const stamped = (doc: Record<string, unknown>) => ({ ...doc, revision: FieldValue.serverTimestamp() });

  const guardValue = async (tx: Transaction, guard: WriteGuard): Promise<number | null> => {
    const d = await tx.get(table(guard.name).doc(guard.id));
    if (!d.exists || d.get('deleted') === true) return null;
    const value = d.get(guard.field);
    return typeof value === 'number' ? value : null;
  };

  return {
    async changes(name, since, limit): Promise<StorageChanges> {
      const snap = await table(name).where('revision', '>', new Date(since)).orderBy('revision').limit(limit).get();
      const items: Record<string, unknown>[] = [];
      const removedIds: string[] = [];
      let revision = since;
      for (const d of snap.docs) {
        const stamp = millis(d.get('revision')) ?? since;
        if (stamp > revision) revision = stamp;
        if (d.get('deleted') === true) removedIds.push(d.id);
        else items.push({ ...d.data(), id: d.id, revision: stamp });
      }
      return { items, removedIds, revision, more: snap.docs.length >= limit };
    },

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
      const ref = table(name).doc(id);
      await ref.set(stamped(doc));
      const written = await ref.get();
      return millis(written.get('revision')) ?? Date.now();
    },

    async remove(name, id): Promise<number> {
      const ref = table(name).doc(id);
      await ref.set({ deleted: true, revision: FieldValue.serverTimestamp() });
      const written = await ref.get();
      return millis(written.get('revision')) ?? Date.now();
    },

    async commit(ops, guard): Promise<CommitResult> {
      let revision = 0;
      await dbx.runTransaction(async (tx) => {
        if (guard && (await guardValue(tx, guard)) !== guard.expected) {
          return; // conflict: nothing is written
        }
        for (const op of ops as WriteOp[]) {
          tx.set(table(op.name).doc(op.id), stamped(op.doc));
        }
        // The batch revision is the server clock at commit time
        revision = Date.now();
        // A marker read back right after would give the real stamp; the pollers
        // reconcile through the next delta anyway.
      });
      if (revision === 0) return { ok: false, conflict: true };
      const newest = await maxStamp(table, ops);
      return { ok: true, revision: newest };
    },
  };
}

/** Reads back the newest revision the batch actually received (server clock). */
async function maxStamp(
  table: (name: CollectionName) => ReturnType<Firestore['collection']>,
  ops: WriteOp[]
): Promise<number> {
  let max = Date.now();
  for (const op of ops) {
    const d = await table(op.name).doc(op.id).get();
    max = Math.max(max, millis(d.get('revision')) ?? max);
  }
  return max;
}

function millis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const d = value as DocumentData & { toMillis?: () => number };
  return typeof d.toMillis === 'function' ? d.toMillis() : null;
}
