import { DocumentData, FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { CollectionName, DataStore, StorageChanges } from './types';

/**
 * Firestore implementation of the DataStore contract (Admin SDK, bypasses the client rules:
 * every read and write is authorised by the routes, not by the database). Revisions are
 * server timestamps, serialised to epoch milliseconds for the HTTP layer.
 */
export function createFirestoreStore(db: Firestore): DataStore {
  const dbx = db;
  const table = (name: CollectionName) => dbx.collection(name);

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
      return { items, removedIds, revision };
    },

    async maxRevision(name): Promise<number> {
      const snap = await table(name).orderBy('revision', 'desc').limit(1).get();
      return snap.empty ? 0 : (millis(snap.docs[0].get('revision')) ?? 0);
    },

    async put(name, id, doc): Promise<number> {
      const ref = table(name).doc(id);
      await ref.set({ ...doc, revision: FieldValue.serverTimestamp() });
      const written = await ref.get();
      return millis(written.get('revision')) ?? Date.now();
    },

    async remove(name, id): Promise<number> {
      const ref = table(name).doc(id);
      await ref.set({ deleted: true, revision: FieldValue.serverTimestamp() });
      const written = await ref.get();
      return millis(written.get('revision')) ?? Date.now();
    },
  };
}

function millis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const d = value as DocumentData & { toMillis?: () => number };
  return typeof d.toMillis === 'function' ? d.toMillis() : null;
}
