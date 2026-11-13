import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction } from 'firebase/firestore';
import type { ReviewSettingsRepository, StoredReviewSettings } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

/**
 * Firestore layout (see firestore.rules), same pattern as the matching engine settings:
 *   settings/review                 workflows and roles in use (admin only)
 *   review_settings_versions/v<n>   every saved version (admin only, never modified)
 */
const ACTIVE = doc(db, 'settings', 'review');
const VERSIONS = collection(db, 'review_settings_versions');

interface SettingsDoc {
  version: number;
  settings: unknown;
  updated_at: string;
  note: string;
}

const toStored = (d: SettingsDoc): StoredReviewSettings => ({
  version: d.version,
  settings: d.settings,
  updatedAt: d.updated_at,
  note: d.note ?? '',
});

export const firestoreReviewSettings: ReviewSettingsRepository = {
  follow(onChange, onError) {
    return onSnapshot(
      ACTIVE,
      (snap) => {
        if (snap.metadata.fromCache && !snap.exists()) return;
        onChange(snap.exists() ? toStored(snap.data() as SettingsDoc) : null);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/review');
        onError();
      }
    );
  },

  async publish(settings, note) {
    try {
      const version = await runTransaction(db, async (tx) => {
        const current = await tx.get(ACTIVE);
        const next = ((current.data() as SettingsDoc | undefined)?.version ?? 0) + 1;
        const data: SettingsDoc = {
          version: next,
          // Plain JSON only (Firestore refuses `undefined`)
          settings: JSON.parse(JSON.stringify(settings)),
          updated_at: new Date().toISOString(),
          note: note.slice(0, 200),
        };
        tx.set(doc(VERSIONS, `v${next}`), data);
        tx.set(ACTIVE, data);
        return next;
      });
      return { ok: true, version };
    } catch (error) {
      const info = handleFirestoreError(error, OperationType.WRITE, 'settings/review');
      return {
        ok: false,
        error: /permission|insufficient/i.test(info.error)
          ? 'La base a refusé l’enregistrement (droits insuffisants, ou règles Firestore non déployées).'
          : 'La base de données est injoignable, réessaie plus tard.',
      };
    }
  },

  async listVersions() {
    const snap = await getDocs(query(VERSIONS, orderBy('version', 'desc'), limit(50)));
    return snap.docs.map((d) => toStored(d.data() as SettingsDoc));
  },
};
