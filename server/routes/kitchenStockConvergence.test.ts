import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import knex, { type Knex } from 'knex';
import betterSqlite3 from 'better-sqlite3';
import { cert, deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { presenceEntryId, stockDerivedPresence, STALE_DEVICE_MS, type StockSection } from '../../src/core/kitchen';
import { DEFAULT_PREFERENCES, type UserPreferences } from '../../src/core/preferences';
import type {
  HostLifecycle,
  RemoteKitchenDocument,
  RemoteKitchenPull,
  RemoteKitchenSections,
} from '../../src/application';
import { KitchenStore } from '../../src/application/kitchen/KitchenStore';
import { KitchenSync } from '../../src/application/kitchen/KitchenSync';
import { createLocalKitchenRepository } from '../../src/infrastructure/local/localRepositories';
import { storage } from '../../src/infrastructure/local/storage';
import { kitchenRoutes } from './kitchenRoutes';
import { authRoutes } from '../auth/routes';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import { resetWatermarks } from '../storage/watermark';
import { createSqlStore, ensureSchema } from '../storage/sqlStore';
import { createFirestoreStore } from '../storage/firestoreStore';
import { COLLECTIONS } from '../storage/collections';
import type { DataStore } from '../storage/types';

/**
 * Convergence of the stock of entries (lot F1, § 10 of the execution dossier) AT THE CLIENT
 * LEVEL: two devices run the REAL KitchenStore + KitchenSync + local repository (a per-device
 * scoped local document) against the REAL kitchen routes on each of the three DataStore
 * backends (memory, SQLite, Firestore emulator). The devices reconcile through the stock
 * section; the legacy conversions, tombstones, offline operations and the stale-device reset
 * are exercised end to end. The Firestore suite is skipped cleanly when the emulator is off.
 */

const COUNTRIES = [
  {
    id: 'TN',
    dial: '+216',
    enabled: true,
    regions: [{ id: 'tunis', name_fr: 'Tunis', name_ar: 'تونس' }],
    postal_digits: 4,
  },
];

const ADMIN_CONFIG = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

let accountCounter = 0;

async function seedIngredients(store: DataStore): Promise<void> {
  for (const id of ['ing1', 'ing2', 'ing3']) {
    await store.put('ingredients', id, {
      id,
      name_fr: `Ingrédient ${id}`,
      name_derja: '',
      name_ar: '',
      category: 'vegetables',
      unit_default: 'pièce',
      price_min_tnd: 1,
      price_max_tnd: 2,
    });
  }
}

interface Backend {
  base: string;
  close: () => Promise<void>;
}

/** Boots the real routes over one DataStore and answers with the listening base URL. */
export async function bootRoutes(store: DataStore): Promise<Backend> {
  await seedIngredients(store);
  const app = express();
  app.use(express.json());
  app.use(authRoutes(ADMIN_CONFIG, store, async () => COUNTRIES));
  app.use(kitchenRoutes(ADMIN_CONFIG, store, { syncLimit: 1000 }));
  await new Promise<void>((resolve) => {
    void app.listen(0, () => resolve());
  }).then(() => undefined);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', resolve));
  const address = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

/** Registers one fresh client account and returns its session token. */
export async function registerAccount(base: string): Promise<string> {
  accountCounter += 1;
  const res = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `convergence${accountCounter}@b.co`,
      password: 'long-enough-1',
      displayName: 'Amine',
      address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
    }),
  });
  const data = (await res.json()) as { token?: string };
  expect(data.token).not.toBe('');
  return data.token!;
}

/** A raw PUT as the PREVIOUS app version would send it (legacy element sets, no stock). */
async function putLegacySections(base: string, token: string, sections: Record<string, unknown>): Promise<void> {
  const res = await fetch(base + '/api/kitchen', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Kitchen-Protocol-Version': '1',
    },
    body: JSON.stringify({
      sections: Object.fromEntries(
        Object.entries(sections).map(([name, value]) => [name, { value, updated_at: Date.now() }])
      ),
    }),
  });
  expect(res.status).toBe(200);
}

export async function getRawDocument(
  base: string,
  token: string
): Promise<Record<string, { value: unknown; updated_at: number }> | null> {
  const res = await fetch(base + '/api/kitchen', {
    headers: { Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' },
  });
  if (res.status !== 200) return null;
  const body = (await res.json()) as {
    doc?: { sections?: Record<string, { value: unknown; updated_at: number }> } | null;
  };
  return body.doc?.sections ?? null;
}

/** One device: the real local repository (per-device scoped doc), store and sync engine. */
export interface Device {
  kitchen: KitchenStore;
  sync: KitchenSync;
  /** Lets the pushes through again after an offline period */
  goOnline(): void;
  /** The device leaves the network: every push fails, nothing is lost locally */
  goOffline(): void;
  /** A pull (the pull guard is bypassed by advancing the injected clock) */
  pull(): Promise<void>;
  /** Gateway counters, for the diagnostics of a device that does not settle */
  traffic: { pulls: number; pushes: number; pushFails: number };
  /** Ledger + state snapshot, for the diagnostics of a device that does not settle */
  debug(): { pending: string[]; times: Record<string, number>; stock: StockSection };
}

export function makeDevice(
  base: string,
  token: string,
  uid: string,
  deviceId: string,
  time: { value: number }
): Device {
  const visibility: { hidden: (() => void)[]; visible: (() => void)[] } = { hidden: [], visible: [] };
  const host: HostLifecycle = {
    // Near-immediate flush: the deferred push fires on the next macrotask (a synchronous
    // host would break KitchenSync's invariant: the cancel token is assigned AFTER defer
    // returns, so the callback must not run inside defer)
    defer: (fn) => {
      const id = setTimeout(fn, 0);
      return () => clearTimeout(id);
    },
    subscribeVisibility: (onHidden, onVisible) => {
      visibility.hidden.push(onHidden);
      visibility.visible.push(onVisible);
      return () => {
        const h = visibility.hidden.indexOf(onHidden);
        if (h >= 0) visibility.hidden.splice(h, 1);
        const v = visibility.visible.indexOf(onVisible);
        if (v >= 0) visibility.visible.splice(v, 1);
      };
    },
  };
  const traffic = {
    pulls: 0,
    pushes: 0,
    pushFails: 0,
    pushStatuses: [] as string[],
    pullFails: 0,
    pushedAt: [] as number[],
  };
  const gateway = {
    offline: false,
    async pull(): Promise<RemoteKitchenPull> {
      traffic.pulls += 1;
      try {
        const res = await fetch(base + '/api/kitchen', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('kitchen_unavailable');
        const body = (await res.json()) as {
          doc?: { sections?: Record<string, { value: unknown; updated_at: number }> } | null;
        };
        if (!body.doc) return { doc: null, reconciliationRequired: false };
        const sections = body.doc.sections ?? {};
        const document: RemoteKitchenDocument = {};
        for (const [name, section] of Object.entries(sections)) {
          if (section && typeof section.updated_at === 'number') {
            document[name as keyof RemoteKitchenDocument] = {
              value: section.value,
              updatedAt: section.updated_at,
            } as never;
          }
        }
        return { doc: document, reconciliationRequired: false };
      } catch (error) {
        traffic.pullFails += 1;
        throw error;
      }
    },
    async push(sections: RemoteKitchenSections): Promise<RemoteKitchenDocument> {
      traffic.pushes += 1;
      traffic.pushedAt.push(sections.stock?.updatedAt ?? -1);
      (traffic as unknown as { names?: string[][] }).names ??= [];
      (traffic as unknown as { names: string[][] }).names.push(Object.keys(sections));
      if (gateway.offline) {
        traffic.pushFails += 1;
        throw new Error('offline');
      }
      const res = await fetch(base + '/api/kitchen', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Kitchen-Protocol-Version': '1',
        },
        body: JSON.stringify({
          sections: Object.fromEntries(
            Object.entries(sections).map(([name, section]) => [
              name,
              { value: section.value, updated_at: section.updatedAt },
            ])
          ),
        }),
      });
      traffic.pushStatuses.push(String(res.status));
      if (!res.ok) throw new Error('kitchen_refused');
      const body = (await res.json()) as {
        doc?: { sections?: Record<string, { value: unknown; updated_at: number }> } | null;
      };
      if (!body.doc?.sections) return {};
      const document: RemoteKitchenDocument = {};
      for (const [name, section] of Object.entries(body.doc.sections)) {
        if (section && typeof section.updated_at === 'number') {
          document[name as keyof RemoteKitchenDocument] = {
            value: section.value,
            updatedAt: section.updated_at,
          } as never;
        }
      }
      return document;
    },
  };
  const preferences = {
    load: (): UserPreferences => ({ ...DEFAULT_PREFERENCES }),
    save: (_patch: Partial<UserPreferences>, _at?: number) => undefined,
  };
  const repo = createLocalKitchenRepository(() => `${uid}#${deviceId}`, { now: () => time.value, deviceId });
  const kitchen = new KitchenStore(repo);
  const sync = new KitchenSync({
    gateway,
    kitchen,
    preferences,
    ledger: repo.ledger,
    owner: () => uid,
    now: () => time.value,
    host,
  });
  const device: Device = {
    kitchen,
    sync,
    traffic,
    debug: () => ({ pending: repo.ledger.pending(), times: repo.ledger.sectionTimes(), stock: kitchen.stock() }),
    goOffline: () => {
      gateway.offline = true;
    },
    goOnline: () => {
      gateway.offline = false;
    },
    pull: async () => {
      time.value += 61_000; // the pull guard allows the pull again
      for (const fn of visibility.visible) fn();
      await settle(device, (s) => !s.syncing);
    },
  };
  return device;
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));
/** The devices share one injected clock: time moves between the events, like in reality. */
const bump = (time: { value: number }): void => {
  time.value += 1_000;
};
/** Waits until one device reaches a sync state (the pushes and pulls are async). */
async function settle(device: Device, ready: (state: { pending: number; syncing: boolean }) => boolean): Promise<void> {
  for (let i = 0; i < 400; i++) {
    await tick();
    if (ready(device.sync.getState())) return;
  }
  throw new Error(
    `the device did not settle in time: sync=${JSON.stringify(device.sync.getState())} traffic=${JSON.stringify(device.traffic)} ledger=${JSON.stringify(device.debug())}`
  );
}
/** Waits until the change of one ONLINE device reached the server and was confirmed. */
const afterChange = (device: Device): Promise<void> => settle(device, (s) => s.pending === 0 && !s.syncing);

/** The local repository persists through the global localStorage: stubbed once (one shared
 *  map — the scopes are unique per device, which emulates two browsers). */
function stubLocalStorage(): void {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => void map.clear(),
  });
}

/** The convergence scenarios, run once per DataStore backend. */
function convergenceSuite(
  label: string,
  boot: () => Promise<Backend>,
  teardown: (backend: Backend) => Promise<void>
): void {
  describe(`two devices converge over the ${label}`, () => {
    let backend: Backend;
    let time: { value: number };

    beforeAll(async () => {
      resetWatermarks();
      stubLocalStorage();
      time = { value: Date.now() };
      // The built-in pantry preset counts as legacy data: cleared for a clean baseline
      // (the change time is 0: the preferences are never pushed by the devices)
      storage.savePreferences({ pantryStaples: [] }, 0);
      backend = await boot();
    });

    afterAll(async () => {
      vi.unstubAllGlobals();
      await teardown(backend);
    });

    it('a legacy device and a new device converge through the stock (scenarios 1 and 8)', async () => {
      const token = await registerAccount(backend.base);
      const uid = 'legacy-owner';
      // The OLD app version writes its legacy fridge on the account
      await putLegacySections(backend.base, token, { fridge: ['ing1'] });
      // The new device pulls: the legacy section is converted into the stock (same core
      // function as the server) and the ingredient becomes visible
      const deviceB = makeDevice(backend.base, token, uid, 'devB', time);
      deviceB.sync.start();
      await deviceB.pull();
      expect(deviceB.kitchen.getState().fridge).toEqual(['ing1']);
      // The new device removes it: the tombstone travels, and the legacy device would see
      // the projected legacy section without it
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing1');
      await afterChange(deviceB);
      const raw = await getRawDocument(backend.base, token);
      const legacyFridge = raw?.fridge?.value as { added: Record<string, unknown> } | undefined;
      expect(legacyFridge?.added).toEqual({}); // the projected legacy card no longer lists ing1
      // A new device reads the projected legacy section: nothing resurrects
      const deviceC = makeDevice(backend.base, token, uid, 'devC', time);
      deviceC.sync.start();
      await deviceC.pull();
      expect(deviceC.kitchen.getState().fridge).toEqual([]);
      const key = presenceEntryId('fridge', 'ing1');
      expect(deviceC.kitchen.stock()[key].state).toBe('tombstoned');
    });

    it('two new devices converge to the same stock, whatever the push order (scenarios 2, 3, 7)', async () => {
      const token = await registerAccount(backend.base);
      const uid = 'order-owner';
      const deviceB = makeDevice(backend.base, token, uid, 'devB', time);
      const deviceC = makeDevice(backend.base, token, uid, 'devC', time);
      deviceB.sync.start();
      deviceC.sync.start();
      // B changes first, C pulls: the change arrives intact
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing2');
      await afterChange(deviceB);
      await deviceC.pull();
      expect(deviceC.kitchen.getState().fridge).toEqual(['ing2']);
      // C changes back, B pulls: both hold both ingredients and EQUAL stocks
      bump(time);
      deviceC.kitchen.toggleFridgeItem('ing3');
      await afterChange(deviceC);
      await deviceB.pull();
      expect(deviceB.kitchen.getState().fridge).toEqual(['ing2', 'ing3']);
      expect(deviceC.kitchen.getState().fridge).toEqual(['ing2', 'ing3']);
      const stockB: StockSection = deviceB.kitchen.stock();
      const stockC: StockSection = deviceC.kitchen.stock();
      expect(Object.keys(stockC).sort()).toEqual(Object.keys(stockB).sort());
      expect(stockC).toEqual(stockB);
    });

    it('a deletion travels as a tombstone, and a re-add after it is a new bare entry (scenarios 4, 5)', async () => {
      const token = await registerAccount(backend.base);
      const uid = 'tombstone-owner';
      const deviceB = makeDevice(backend.base, token, uid, 'devB', time);
      const deviceC = makeDevice(backend.base, token, uid, 'devC', time);
      deviceB.sync.start();
      deviceC.sync.start();
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing1');
      await afterChange(deviceB);
      await deviceC.pull();
      expect(deviceC.kitchen.getState().fridge).toEqual(['ing1']);
      // The deletion on C propagates to B: the tombstone travels, nothing resurrects
      bump(time);
      deviceC.kitchen.toggleFridgeItem('ing1');
      await afterChange(deviceC);
      await deviceB.pull();
      expect(deviceB.kitchen.getState().fridge).toEqual([]);
      const key = presenceEntryId('fridge', 'ing1');
      expect(deviceB.kitchen.stock()[key].state).toBe('tombstoned');
      // The re-add on B is a legitimate new event: a BARE presence entry (no invented data)
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing1');
      await afterChange(deviceB);
      await deviceC.pull();
      expect(deviceC.kitchen.getState().fridge).toEqual(['ing1']);
      const envelope = deviceC.kitchen.stock()[key];
      expect(envelope.state).toBe('active');
      expect(envelope.state === 'active' ? 'quantity' in envelope.entry : true).toBe(false);
    });

    it('offline operations on two devices are never lost and converge (conflict resolution)', async () => {
      const token = await registerAccount(backend.base);
      const uid = 'offline-owner';
      const deviceB = makeDevice(backend.base, token, uid, 'devB', time);
      const deviceC = makeDevice(backend.base, token, uid, 'devC', time);
      deviceB.sync.start();
      deviceC.sync.start();
      await deviceB.pull();
      await deviceC.pull();
      // Both devices work offline: each change stays pending locally
      deviceB.goOffline();
      deviceC.goOffline();
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing2');
      bump(time);
      deviceC.kitchen.toggleFridgeItem('ing3');
      // Back online: each device flushes its pending stock, then pulls the merged result
      deviceB.goOnline();
      deviceB.sync.stop();
      deviceB.sync.start(); // the recovery pushes the pending section first
      await afterChange(deviceB);
      deviceC.goOnline();
      deviceC.sync.stop();
      deviceC.sync.start();
      await afterChange(deviceC);
      await deviceB.pull();
      // Both devices converge to the same stock that holds both changes
      const expected = ['ing2', 'ing3'];
      expect(stockDerivedPresence(deviceB.kitchen.stock(), 'fridge').sort()).toEqual(expected);
      expect(stockDerivedPresence(deviceC.kitchen.stock(), 'fridge').sort()).toEqual(expected);
      expect(deviceC.kitchen.stock()).toEqual(deviceB.kitchen.stock());
      // Nothing stays pending on either device
      expect(deviceB.sync.getState().pending).toBe(0);
      expect(deviceC.sync.getState().pending).toBe(0);
    });

    it('a device that synced too long ago never pushes its offline change: it is archived and the state re-adopts the server (scenario 6, lot F1 D3 P1)', async () => {
      const token = await registerAccount(backend.base);
      const uid = 'stale-owner';
      const deviceB = makeDevice(backend.base, token, uid, 'devB', time);
      deviceB.sync.start();
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing2');
      await afterChange(deviceB);
      const syncedAt = time.value; // B is in sync with the server here
      // B keeps working OFFLINE (one unsynced change) while another device changes the account
      deviceB.goOffline();
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing1');
      const deviceC = makeDevice(backend.base, token, uid, 'devC', time);
      deviceC.sync.start();
      bump(time);
      deviceC.kitchen.toggleFridgeItem('ing3');
      await afterChange(deviceC);
      bump(time);
      deviceC.kitchen.togglePantryItem('ing3');
      await afterChange(deviceC);
      // B comes back after longer than the reset margin: it must NOT push its pending
      // change first (an old deletion could resurrect a tombstone the server purged).
      // The refused offline change is archived locally (never silently lost), then the
      // reset wipes the state and the server document is re-adopted.
      time.value = syncedAt + STALE_DEVICE_MS + 1_000;
      const pushesBefore = deviceB.traffic.pushes;
      deviceB.goOnline();
      deviceB.sync.stop();
      deviceB.sync.start();
      await afterChange(deviceB);
      // Face A: no push ever carried the refused offline change — the pushes before the
      // recovery are the synced 'stock' pushes; anything pushed AFTER the reset (the
      // migration push of the fresh default grocery list, an existing pre-reset behavior)
      // must never carry the stock section
      const pushesAfterReset = ((deviceB.traffic as unknown as { names?: string[][] }).names ?? []).slice(pushesBefore);
      for (const names of pushesAfterReset) expect(names).not.toContain('stock');
      expect(deviceB.traffic.pushes).toBeLessThanOrEqual(pushesBefore + 1);
      // The reset + adoption left B exactly at the server's merged state — WITHOUT its own
      // offline change (it was archived, not applied): no resurrection window
      expect(deviceB.kitchen.getState().fridge.slice().sort()).toEqual(['ing2', 'ing3']);
      expect(deviceB.kitchen.getState().pantry).toEqual(['ing3']);
      // The refused change is explicitly archived: not synced, never presented as synced,
      // never re-emitted — the interface can show it and discard it once acted on
      expect(deviceB.sync.getState().offlineChangesArchived).toBe(true);
      const archived = deviceB.sync.unsyncedArchive();
      expect(archived).not.toBeNull();
      expect(archived!.sections.stock).toBeDefined();
      const archivedStock = archived!.sections.stock!.value as StockSection;
      expect(archivedStock[presenceEntryId('fridge', 'ing1')]).toBeDefined(); // the offline add, kept
      expect(deviceB.sync.getState().pending).toBe(0); // the reset cleared the bookkeeping
      // Face B: the HLC clock survived the reset — the next change carries a version the
      // server never rejects, and it lands (the stale refusal never locks the device out)
      bump(time);
      deviceB.kitchen.toggleFridgeItem('ing1');
      await afterChange(deviceB);
      expect(deviceB.sync.getState().pending).toBe(0);
      await deviceC.pull();
      expect(deviceC.kitchen.getState().fridge.slice().sort()).toEqual(['ing1', 'ing2', 'ing3']);
      expect(deviceC.kitchen.stock()).toEqual(deviceB.kitchen.stock());
    });
  });
}

convergenceSuite(
  'memory store',
  async () => bootRoutes(createMemoryDataStore()),
  (backend) => backend.close()
);

describe('sqlite backend', () => {
  let db: Knex;
  let driver: betterSqlite3.Database;
  let file = '';

  beforeAll(async () => {
    file = path.join(tmpdir(), `chnawa-kitchen-convergence-${process.pid}-${Date.now()}.db`);
    driver = betterSqlite3(file);
    db = knex({ client: 'better-sqlite3', connection: { filename: file } });
    await ensureSchema(db);
  });

  afterAll(async () => {
    await db.destroy();
    driver.close();
    rmSync(file, { force: true });
  });

  convergenceSuite(
    'sqlite store',
    async () => bootRoutes(createSqlStore(db)),
    async (backend) => {
      await backend.close();
      for (const spec of Object.values(COLLECTIONS)) driver.prepare(`DELETE FROM ${spec.name}`).run();
    }
  );
});

const emulatorReady = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_PROJECT_ID);

describe.skipIf(!emulatorReady)('firestore backend (emulator)', () => {
  let app: App;
  let db: Firestore;

  beforeAll(async () => {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: 'test@example.com',
        privateKey: 'x',
      } as never),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    db = getFirestore(app);
  });

  afterAll(async () => {
    if (app) await deleteApp(app);
  });

  convergenceSuite(
    'firestore emulator',
    async () => {
      for (const name of ['ingredients', 'kitchen']) {
        const docs = await db.collection(name).listDocuments();
        await Promise.all(docs.map((d) => d.delete()));
      }
      return bootRoutes(createFirestoreStore(db));
    },
    async (backend) => {
      await backend.close();
      for (const name of ['ingredients', 'kitchen']) {
        const docs = await db.collection(name).listDocuments();
        await Promise.all(docs.map((d) => d.delete()));
      }
    }
  );
});
