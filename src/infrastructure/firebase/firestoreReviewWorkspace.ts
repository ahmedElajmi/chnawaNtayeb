import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';
import { withoutUndefined } from '@/core/shared';
import type { ReviewItems, ReviewKind, WorkCopy } from '@/core/review';
import type { ReviewWorkspaceWriter, WorkspaceWriteResult } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';
import { createFirestoreSharedCollection } from './firestoreSharedCollection';

/**
 * Firestore layout of the validation workflow (see firestore.rules), for a kind of content:
 *   <public>/<id>               public collection (recipes, ingredients): validated versions only
 *   <public>_workspace/<id>     work copies (admin only), followed like any shared collection
 *   <public>_versions/<id>-<t>  every published version (admin only, never modified)
 * Publishing writes the three in one transaction, after checking that the work copy is still the
 * one the change started from (`written_at`), so two members never overwrite each other.
 */

const BATCH_SIZE = 400;

/** Plain stored data: no id, no client revision (the database sets it), no `undefined`. */
const plain = <T extends { id: string; revision?: number }>(value: T) => {
  const { id: _id, revision: _revision, ...data } = value;
  return withoutUndefined(data);
};
const stamped = <T extends { id: string; revision?: number }>(value: T) => ({
  ...plain(value),
  revision: serverTimestamp(),
});
/** A work copy's content keeps no database revision of its own (it keeps its id, read back by the domain). */
const storedCopy = <K extends ReviewKind>(copy: WorkCopy<K>) => {
  const { revision: _revision, ...content } = copy.content as ReviewItems[K] & { revision?: number };
  return stamped({ ...copy, content: withoutUndefined(content) });
};

class Conflict extends Error {}

function failure(error: unknown, path: string): WorkspaceWriteResult {
  if (error instanceof Conflict) return { ok: false, conflict: true, error: 'conflict' };
  const info = handleFirestoreError(error, OperationType.WRITE, path);
  return {
    ok: false,
    error: /permission|insufficient/i.test(info.error)
      ? 'La base a refusé l’enregistrement (droits insuffisants, ou règles Firestore non déployées).'
      : 'La base de données est injoignable : rien n’a été enregistré, réessaie plus tard.',
  };
}

/** Fails the transaction when the stored work copy is not the one the change starts from. */
async function checkUnchanged(tx: Transaction, ref: DocumentReference, expected: number | null) {
  const snap = await tx.get(ref);
  const data = snap.exists() ? snap.data() : null;
  const current = data && data.deleted !== true && typeof data.written_at === 'number' ? data.written_at : null;
  if (current !== expected) throw new Conflict();
}

export function createFirestoreReviewWorkspace<K extends ReviewKind>(publicName: string) {
  const workspaceName = `${publicName}_workspace`;
  const workspace = createFirestoreSharedCollection<WorkCopy<K>>(workspaceName);
  const workspaceCol = collection(db, workspaceName);
  const publicCol = collection(db, publicName);
  const versionsCol = collection(db, `${publicName}_versions`);

  const writer: ReviewWorkspaceWriter<K> = {
    async save(copy, expected) {
      const ref = doc(workspaceCol, copy.id);
      try {
        await runTransaction(db, async (tx) => {
          await checkUnchanged(tx, ref, expected);
          tx.set(ref, storedCopy(copy));
        });
        return { ok: true };
      } catch (error) {
        return failure(error, `${workspaceName}/${copy.id}`);
      }
    },

    async importAll(copies) {
      try {
        const existing = await getDocs(workspaceCol);
        const taken = new Set(existing.docs.filter((d) => d.data().deleted !== true).map((d) => d.id));
        const fresh = copies.filter((c) => !taken.has(c.id));
        for (let k = 0; k < fresh.length; k += BATCH_SIZE) {
          const batch = writeBatch(db);
          fresh.slice(k, k + BATCH_SIZE).forEach((c) => batch.set(doc(workspaceCol, c.id), storedCopy(c)));
          await batch.commit();
        }
        return { ok: true, imported: fresh.length };
      } catch (error) {
        return failure(error, workspaceName);
      }
    },

    remove: (id) => workspace.writer.remove(id),

    async publish(item, copy, version, expected) {
      const ref = doc(workspaceCol, copy.id);
      try {
        await runTransaction(db, async (tx) => {
          await checkUnchanged(tx, ref, expected);
          tx.set(doc(publicCol, item.id), stamped(item));
          tx.set(ref, storedCopy(copy));
          tx.set(doc(versionsCol, version.id), {
            ...withoutUndefined(version),
            content: withoutUndefined({ ...version.content, revision: undefined }),
          });
        });
        return { ok: true };
      } catch (error) {
        return failure(error, `${publicName}/${item.id}`);
      }
    },

    async unpublish(copy, expected) {
      const ref = doc(workspaceCol, copy.id);
      try {
        await runTransaction(db, async (tx) => {
          await checkUnchanged(tx, ref, expected);
          tx.set(doc(publicCol, copy.id), { deleted: true, revision: serverTimestamp() });
          tx.set(ref, storedCopy(copy));
        });
        return { ok: true };
      } catch (error) {
        return failure(error, `${publicName}/${copy.id}`);
      }
    },

    async listVersions(itemId) {
      const snap = await getDocs(query(versionsCol, where('item_id', '==', itemId)));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    },
  };

  return { source: workspace.source, writer };
}
