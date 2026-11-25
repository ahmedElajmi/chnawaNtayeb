/**
 * Lot F1 — step 3, D2 fixture (dossier v4.2 § 5.1): replays the OLD client's exact data path
 * against the projected legacy sections of the real isolated server. The historical reading
 * chain — `parseElementSet → mergeElementSets → presentIds` (the last pre-F1 client state is
 * commit f6cd2ed, "propagate deletions between devices with per-element versions"; the three
 * functions live in src/core/kitchen/elementSets.ts and are UNCHANGED since) — is applied to
 * the sections the server regenerates at every PUT, and the visible lists it produced are
 * compared with the actual stock. The old client's full-card write is then replayed (as the
 * legacy device of the convergence suite does) and the server must convert it without loss
 * or resurrection (rollback A, proof (iii) § 13).
 *
 * Scope honesty (dossier § 5.1): the replay is EXACT for the data path (the same functions,
 * the same call chain) — it does not run the historical binary (UI, screens): this fixture
 * verifies the old client's data path, not the historical executable.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { mergeElementSets, parseElementSet, presentIds } from '../../src/core/kitchen/elementSets';
import { stockDerivedPresence, type ElementSet } from '../../src/core/kitchen';
import { authRoutes } from '../../server/auth/routes';
import { kitchenRoutes } from '../../server/routes/kitchenRoutes';
import { createMemoryDataStore } from '../../server/storage/memoryDataStore';
import type { DataStore } from '../../server/storage/types';

const ELEMENT_VERSION = (physical: number): { physical: number; counter: number; device: string } => ({
  physical,
  counter: 0,
  device: 'legacy-fixture',
});

const ADMIN_CONFIG = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

const COUNTRIES = [
  {
    id: 'TN',
    dial: '+216',
    enabled: true,
    regions: [{ id: 'tunis', name_fr: 'Tunis', name_ar: 'تونس' }],
    postal_digits: 4,
  },
];

interface Backend {
  base: string;
  close: () => Promise<void>;
}

let backend: Backend;
let accountCounter = 0;

/** The same three test ingredients the convergence suite seeds (the registry the stock
 *  validation reads against). */
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

beforeAll(async () => {
  const store = createMemoryDataStore();
  await seedIngredients(store);
  const app = express();
  app.use(express.json());
  app.use(authRoutes(ADMIN_CONFIG, store, async () => COUNTRIES));
  app.use(kitchenRoutes(ADMIN_CONFIG, store, { syncLimit: 1000 }));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', resolve));
  const address = server.address() as AddressInfo;
  backend = { base: `http://127.0.0.1:${address.port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
});

afterAll(async () => {
  await backend.close();
});

async function register(): Promise<string> {
  accountCounter += 1;
  const res = await fetch(backend.base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `d2fixture${accountCounter}@b.co`,
      password: 'long-enough-1',
      displayName: 'Amine',
      address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
    }),
  });
  const data = (await res.json()) as { token?: string };
  expect(data.token).toBeTruthy();
  return data.token!;
}

describe('D2 — the old client path over the server-projected legacy sections', () => {
  it('reading the regenerated sections with the historical chain shows the exact stock presence', async () => {
    const token = await register();
    const put = async (sections: Record<string, unknown>): Promise<void> => {
      const res = await fetch(backend.base + '/api/kitchen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' },
        body: JSON.stringify({
          sections: Object.fromEntries(Object.entries(sections).map(([name, value]) => [name, { value, updated_at: Date.now() }])),
        }),
      });
      expect(res.status).toBe(200);
    };
    // A NEW device pushes stock (enriched entry + tombstone + a pantry entry); the server
    // regenerates the legacy sections at every PUT (§ 7.4 projection)
    const now = Date.now();
    const stock = {
      st_fridge_ing1: {
        state: 'active',
        version: ELEMENT_VERSION(now - 100),
        entry: {
          id: 'st_fridge_ing1',
          ingredient_id: 'ing1',
          location: 'fridge',
          origin: 'manual',
          added_at: new Date(now - 100).toISOString(),
          quantity: 2,
          unit: 'pièce',
        },
      },
      st_fridge_ing2: { state: 'tombstoned', version: ELEMENT_VERSION(now - 90), stub: { id: 'st_fridge_ing2', ingredient_id: 'ing2', location: 'fridge' }, removed: ELEMENT_VERSION(now - 90) },
      st_pantry_ing3: {
        state: 'active',
        version: ELEMENT_VERSION(now - 80),
        entry: {
          id: 'st_pantry_ing3',
          ingredient_id: 'ing3',
          location: 'pantry',
          origin: 'manual',
          added_at: new Date(now - 80).toISOString(),
        },
      },
    };
    await put({ stock });

    const res = await fetch(backend.base + '/api/kitchen', { headers: { Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' } });
    const doc = (await res.json()) as { doc?: { sections?: Record<string, { value: unknown }> } };
    const projectedFridge = doc.doc?.sections?.fridge?.value as ElementSet;
    const projectedPantry = doc.doc?.sections?.pantry?.value as ElementSet;
    expect(projectedFridge).toBeDefined();
    expect(projectedPantry).toBeDefined();

    // The OLD client's reading chain, exactly (empty local state, then a prior local state)
    const empty: ElementSet = { added: {}, removed: {} };
    expect(presentIds(mergeElementSets(empty, parseElementSet(projectedFridge)!))).toEqual(['ing1']);
    expect(presentIds(mergeElementSets(empty, parseElementSet(projectedPantry)!))).toEqual(['ing3']);
    // With a PRIOR local state (an element the old client already had): the merge keeps it
    const prior: ElementSet = { added: { ing2: ELEMENT_VERSION(now - 200) }, removed: {} };
    // ing2 is tombstoned in the projected card: the merged view must NOT resurrect it —
    // the old client's own merge honours the server tombstone (deletion propagation, f6cd2ed)
    const merged = mergeElementSets(prior, parseElementSet(projectedFridge)!);
    expect(presentIds(merged)).toEqual(['ing1']);
    expect(merged.removed.ing2).toBeDefined();

    // The server's own projection agrees with what the old client's chain displays
    const getDoc = doc.doc?.sections?.stock?.value as never;
    expect(getDoc).toBeDefined();
    expect(stockDerivedPresence(stock, 'fridge')).toEqual(presentIds(mergeElementSets(empty, parseElementSet(projectedFridge)!)));
  });

  it('the old client full-card write is converted by the server without loss or resurrection', async () => {
    const token = await register();
    // The old client writes its complete fridge card (as f6cd2ed did: full added/removed maps)
    const now = Date.now();
    const card: ElementSet = {
      added: { ing1: ELEMENT_VERSION(now - 100) },
      removed: { ing2: ELEMENT_VERSION(now - 90) },
    };
    const put = await fetch(backend.base + '/api/kitchen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' },
      body: JSON.stringify({ sections: { fridge: { value: card, updated_at: now } } }),
    });
    expect(put.status).toBe(200);
    const res = await fetch(backend.base + '/api/kitchen', { headers: { Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' } });
    const doc = (await res.json()) as { doc?: { sections?: Record<string, { value: unknown }> } };
    const stock = doc.doc?.sections?.stock?.value as Record<
      string,
      { state: string; stub?: { ingredient_id: string } }
    >;
    expect(stock).toBeDefined();
    // ing1 became an active presence entry with the SAME deterministic id
    expect(stock['st_fridge_ing1']?.state).toBe('active');
    // ing2's deletion travelled: a tombstone, never a resurrection
    expect(stock['st_fridge_ing2']?.state).toBe('tombstoned');
    expect(stock['st_fridge_ing2']?.stub?.ingredient_id).toBe('ing2');
  });
});
