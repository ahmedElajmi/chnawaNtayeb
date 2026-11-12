import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { withoutUndefined } from '@/core/shared';
import type { Versioned } from '@/core/sync';
import type { RemoteChanges, SharedCollectionSource, SharedCollectionWriter, WriteResult } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

/**
 * Generic Firestore adapter of a shared collection (recipes, ingredients, and any later one).
 *
 * - Every write is complete (setDoc without merge: a removed field disappears) and carries
 *   `revision = serverTimestamp()`: the database clock, the same for every device, so a
 *   device can ask `revision >= newest it knows` without any clock drift.
 *   firestore.rules require `revision == request.time`.
 * - A deletion is a marker `{ deleted: true, revision }`, so other devices learn about it.
 * - Reading = one live query (onSnapshot): the first answer brings only what changed since
 *   the device's revision (or everything on a first visit), then each change arrives alone.
 */

/** Firestore batches are limited to 500 operations */
const BATCH_SIZE = 400;

function writeError(error: unknown, path: string): WriteResult {
  const info = handleFirestoreError(error, OperationType.WRITE, path);
  const denied = /permission|insufficient/i.test(info.error);
  return {
    ok: false,
    error: denied
      ? 'Enregistré sur cet appareil seulement : le cloud a refusé l’écriture (session patron non reliée à Firebase, ou règles non déployées).'
      : 'Enregistré sur cet appareil seulement : le cloud est injoignable.',
  };
}

/** Stored document -> plain entry with its revision in milliseconds. */
function fromDoc(d: QueryDocumentSnapshot<DocumentData>): unknown {
  const data = d.data({ serverTimestamps: 'estimate' });
  // A write still pending on this device only has an estimated time: it must not move the
  // device's revision forward (the confirmed time arrives right after)
  const revision =
    data.revision instanceof Timestamp && !d.metadata.hasPendingWrites ? data.revision.toMillis() : undefined;
  const { revision: _stored, ...rest } = data;
  return revision === undefined ? { ...rest, id: d.id } : { ...rest, id: d.id, revision };
}

const stamped = (data: object) => ({ ...withoutUndefined(data), revision: serverTimestamp() });

export function createFirestoreSharedCollection<T extends Versioned>(name: string) {
  const col = collection(db, name);

  const source: SharedCollectionSource = {
    follow(since, onChanges, onError) {
      const q = since === null ? col : query(col, where('revision', '>=', Timestamp.fromMillis(since)));
      let answered = false;
      return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          if (!answered) {
            // Wait for the server: an answer from the local cache may be partial
            if (snap.metadata.fromCache) return;
            answered = true;
            const changes: RemoteChanges =
              since === null
                ? { items: snap.docs.map(fromDoc), removedIds: [], complete: true }
                : { items: snap.docs.map(fromDoc), removedIds: [], complete: false };
            onChanges(changes);
            return;
          }
          const items: unknown[] = [];
          const removedIds: string[] = [];
          for (const change of snap.docChanges()) {
            if (change.type === 'removed') removedIds.push(change.doc.id);
            else items.push(fromDoc(change.doc));
          }
          if (items.length || removedIds.length) onChanges({ items, removedIds, complete: false });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, name);
          onError();
        }
      );
    },
  };

  const commitInBatches = async (ops: ((batch: ReturnType<typeof writeBatch>) => void)[]) => {
    for (let k = 0; k < ops.length; k += BATCH_SIZE) {
      const batch = writeBatch(db);
      ops.slice(k, k + BATCH_SIZE).forEach((op) => op(batch));
      await batch.commit();
    }
  };

  const writer: SharedCollectionWriter<T> = {
    async put(item) {
      try {
        const { id, revision: _r, ...data } = item;
        await setDoc(doc(col, id), stamped(data));
        return { ok: true };
      } catch (error) {
        return writeError(error, `${name}/${item.id}`);
      }
    },

    async remove(id) {
      try {
        await setDoc(doc(col, id), stamped({ deleted: true }));
        return { ok: true };
      } catch (error) {
        return writeError(error, `${name}/${id}`);
      }
    },

    async putAll(items) {
      try {
        await commitInBatches(
          items.map((item) => (batch) => {
            const { id, revision: _r, ...data } = item;
            batch.set(doc(col, id), stamped(data));
          })
        );
        return { ok: true };
      } catch (error) {
        return writeError(error, name);
      }
    },

    async replaceAll(items) {
      try {
        const keep = new Set(items.map((i) => i.id));
        const existing = await getDocs(col);
        const gone = existing.docs.filter((d) => !keep.has(d.id) && d.data().deleted !== true).map((d) => d.id);
        await commitInBatches([
          ...gone.map(
            (id) => (batch: ReturnType<typeof writeBatch>) => batch.set(doc(col, id), stamped({ deleted: true }))
          ),
          ...items.map((item) => (batch: ReturnType<typeof writeBatch>) => {
            const { id, revision: _r, ...data } = item;
            batch.set(doc(col, id), stamped(data));
          }),
        ]);
        return { ok: true, removed: gone.length };
      } catch (error) {
        return writeError(error, name);
      }
    },

    async isEmpty() {
      const snap = await getDocs(query(col, limit(1)));
      return snap.empty;
    },
  };

  return { source, writer };
}
