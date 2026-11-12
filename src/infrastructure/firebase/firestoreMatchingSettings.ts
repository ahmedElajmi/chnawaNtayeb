import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
import type { MatchingSettingsRepository, StoredMatchingSettings } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

/**
 * Firestore layout (see firestore.rules):
 *   settings/matching                  active settings, read by every visitor
 *   matching_settings_versions/v<n>    every published version (history, admin only, never modified)
 */
const ACTIVE = doc(db, 'settings', 'matching');
const VERSIONS = collection(db, 'matching_settings_versions');

interface SettingsDoc {
  version: number;
  config: unknown;
  updated_at: string;
  note: string;
}

const toStored = (d: SettingsDoc): StoredMatchingSettings => ({
  version: d.version,
  config: d.config,
  updatedAt: d.updated_at,
  note: d.note ?? '',
});

function friendlyError(raw: string): string {
  return /permission|insufficient/i.test(raw)
    ? 'La base a refusé l’enregistrement (session patron non reliée à Firebase, ou règles Firestore non déployées).'
    : 'La base de données est injoignable, réessaie plus tard.';
}

export const firestoreMatchingSettings: MatchingSettingsRepository = {
  async loadActive() {
    const snap = await getDoc(ACTIVE);
    return snap.exists() ? toStored(snap.data() as SettingsDoc) : null;
  },

  followActive(onChange) {
    // One document: every new publication arrives live (one read per device)
    return onSnapshot(
      ACTIVE,
      (snap) => {
        if (snap.metadata.fromCache && !snap.exists()) return;
        onChange(snap.exists() ? toStored(snap.data() as SettingsDoc) : null);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/matching')
    );
  },

  async publish(config, note) {
    try {
      const version = await runTransaction(db, async (tx) => {
        const current = await tx.get(ACTIVE);
        const next = ((current.data() as SettingsDoc | undefined)?.version ?? 0) + 1;
        const data: SettingsDoc = {
          version: next,
          // Plain JSON only (Firestore refuses `undefined`)
          config: JSON.parse(JSON.stringify(config)),
          updated_at: new Date().toISOString(),
          note: note.slice(0, 200),
        };
        tx.set(doc(VERSIONS, `v${next}`), data);
        tx.set(ACTIVE, data);
        return next;
      });
      return { ok: true, version };
    } catch (error) {
      const info = handleFirestoreError(error, OperationType.WRITE, 'settings/matching');
      return { ok: false, error: friendlyError(info.error) };
    }
  },

  async listVersions(max) {
    try {
      const snap = await getDocs(query(VERSIONS, orderBy('version', 'desc'), limit(max)));
      return snap.docs.map((d) => toStored(d.data() as SettingsDoc));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'matching_settings_versions');
      return [];
    }
  },
};
