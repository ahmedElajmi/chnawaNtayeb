import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { afterAll, beforeAll, describe } from 'vitest';
import { createFirestoreStore } from './firestoreStore';
import { describeDataStore } from './contract';
import type { DataStore } from './types';

/**
 * The Firestore implementation proves the whole DataStore contract on the Firestore
 * EMULATOR (FIRESTORE_EMULATOR_HOST and FIREBASE_PROJECT_ID set, emulator running, e.g.
 * `firebase emulators:exec --only firestore`). Skipped cleanly when the emulator is
 * unavailable: it is never a silent pass. The emulator is a characterization tool, not a
 * production proof — the production confirmation stays with the rehearsal lot (1.5).
 */

/** The collections the contract suite touches, plus the adapter's internal counters. */
const SUITE_COLLECTIONS = [
  'recipes',
  'ingredients',
  'recipes_versions',
  'recipes_workspace',
  'users',
  'kitchen',
  'email_index',
  'countries',
  '_sync_meta',
];

let app: App | null = null;

const emulatorReady = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_PROJECT_ID);

beforeAll(async () => {
  if (!emulatorReady) return;
  // firebase-admin 14 rejects a fake `cert` key at init (OpenSSL decode). On the emulator the
  // documented pattern is a projectId-only app: the Firestore client sees FIRESTORE_EMULATOR_HOST
  // and uses the no-auth channel.
  app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
});

afterAll(async () => {
  if (app) await deleteApp(app);
});

async function wipeAll(db: Firestore): Promise<void> {
  for (const name of SUITE_COLLECTIONS) {
    const docs = await db.collection(name).listDocuments();
    await Promise.all(docs.map((d) => d.delete()));
  }
}

describe.skipIf(!emulatorReady)('firestore (emulator)', () => {
  describeDataStore('firestore emulator', () => {
    const db = getFirestore(app!);
    const inner = createFirestoreStore(db);
    // One wipe per test (create() runs at the start of each `it`): the first call of the
    // test awaits it, every later call reuses it — the suite always starts from a clean base.
    let wiped: Promise<void> | null = null;
    const ensureWiped = () => (wiped ??= wipeAll(db));
    return new Proxy<DataStore>(inner, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;
        return async (...args: unknown[]) => {
          await ensureWiped();
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      },
    });
  });
});
