import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import {
  PERMANENT_STOCK_CATEGORIES,
  RESERVED_SYNC_DEVICE,
  compareVersions,
  presenceEntryId,
  type ElementSet,
  type ElementVersion,
  type StockEnvelope,
  type StockSection,
} from '../../src/core/kitchen';
import { kitchenRoutes } from './kitchenRoutes';
import { authRoutes } from '../auth/routes';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import { resetWatermarks } from '../storage/watermark';
import type { DataStore } from '../storage/types';

/**
 * Server-side lot F1 (step 1): the `stock` section of /api/kitchen — validation core
 * partagée, conversion transactionnelle legacy → stock (E1-a), projection stock → legacy
 * (§ 7.4), garde du dispositif réservé `server` (§ 7.5), registres avec relecture sans
 * cache avant refus (§ 4.5), purge des tombstones. The server-level convergence scenarios
 * of § 9 (1, 2, 3, 4, 5, 7, 8, 9) run here; the client-level ones follow in step 2.
 */

const v = (physical: number, device = 'd1', counter = 0): ElementVersion => ({ physical, counter, device });

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

const INGREDIENT_IDS = ['ingA', 'ingB', 'ingC', 'ingD', 'perm1', 'veg1'];
for (let i = 0; i < 620; i++) INGREDIENT_IDS.push(`bulk${i}`);

let app: express.Express;
let server: ReturnType<express.Express['listen']>;
let base = '';
let store: DataStore;

beforeAll(async () => {
  resetWatermarks();
  store = createMemoryDataStore();
  // The registry the stock validation reads: the referenced ingredients must exist
  for (const id of INGREDIENT_IDS) {
    await store.put('ingredients', id, {
      id,
      name_fr: `Ingrédient ${id}`,
      name_derja: '',
      name_ar: '',
      category: id.startsWith('perm') ? 'canned_pantry' : 'vegetables',
      unit_default: 'pièce',
      price_min_tnd: 1,
      price_max_tnd: 2,
    });
  }
  app = express();
  app.use(express.json());
  app.use(authRoutes(ADMIN_CONFIG, store, async () => COUNTRIES));
  app.use(kitchenRoutes(ADMIN_CONFIG, store, { syncLimit: 100000 }));
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server?.close();
});

const register = async (email: string): Promise<string> => {
  const res = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'long-enough-1',
      displayName: 'Amine',
      address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
    }),
  });
  return ((await res.json()) as { token?: string }).token ?? '';
};

type Doc = { sections: Record<string, { value: unknown; updated_at: number } | undefined> };

const putSections = async (token: string, sections: Record<string, unknown>) =>
  fetch(base + '/api/kitchen', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sections }),
  });

const getDoc = async (token: string): Promise<Doc> => {
  const res = await fetch(base + '/api/kitchen', { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json()) as { doc: Doc | null };
  return data.doc ?? { sections: {} };
};

const stockOf = (doc: Doc): StockSection => (doc.sections.stock?.value ?? {}) as StockSection;
const legacyOf = (doc: Doc, location: 'fridge' | 'pantry'): ElementSet =>
  (doc.sections[location]?.value ?? { added: {}, removed: {} }) as ElementSet;

const section = (value: unknown, updated_at: number) => ({ value, updated_at });

/** One ACTIVE presence envelope as a new client pushes it (validated entry). */
const activeStock = (location: 'fridge' | 'pantry', ingredientId: string, version: ElementVersion): StockSection => {
  const key = presenceEntryId(location, ingredientId);
  return {
    [key]: {
      state: 'active',
      entry: {
        id: key,
        ingredient_id: ingredientId,
        location,
        origin: 'manual',
        added_at: new Date(version.physical).toISOString(),
      },
      version,
    },
  };
};

let tokenSeq = 0;
const newAccount = async (): Promise<string> => register(`f1stock${++tokenSeq}@test.tn`);

describe('lot F1 step 1 — the stock section of /api/kitchen (server)', () => {
  it('scenario 1 — a legacy push is converted into the stock with the deterministic id, and projected back', async () => {
    const token = await newAccount();
    const res = await putSections(token, { fridge: section(['ingA'], 1000) });
    expect(res.status).toBe(200);
    const doc = await getDoc(token);
    const key = presenceEntryId('fridge', 'ingA');
    const stock = stockOf(doc);
    expect((stock[key] as StockEnvelope).state).toBe('active');
    expect((stock[key] as { version: ElementVersion }).version).toEqual(v(1000, 'legacy'));
    // The identity invariant: the entry id IS the key
    expect((stock[key] as { entry: { id: string } }).entry.id).toBe(key);
    // The legacy card is regenerated by the projection (same presence, carried versions)
    const fridge = legacyOf(doc, 'fridge');
    expect(Object.keys(fridge.added)).toEqual(['ingA']);
    expect(fridge.added['ingA']).toEqual(v(1000, 'legacy'));
  });

  it('scenario 2 — a legacy deletion writes the canonical tombstone; nothing resurrects', async () => {
    const token = await newAccount();
    const t0 = Date.now(); // realistic HLC physicals: fresh tombstones survive the retention
    await putSections(token, { fridge: section(['ingA'], t0 - 2000) });
    const res = await putSections(token, {
      fridge: section({ added: {}, removed: { ingA: v(t0, 'old-device') } }, t0),
    });
    expect(res.status).toBe(200);
    const doc = await getDoc(token);
    const key = presenceEntryId('fridge', 'ingA');
    const envelope = stockOf(doc)[key] as StockEnvelope;
    expect(envelope.state).toBe('tombstoned');
    expect(envelope).toEqual({
      state: 'tombstoned',
      stub: { id: key, ingredient_id: 'ingA', location: 'fridge' },
      version: v(t0, 'old-device'),
      removed: v(t0, 'old-device'),
    });
    expect(Object.keys(legacyOf(doc, 'fridge').added)).toEqual([]);
    // A late legacy add OLDER than the deletion never resurrects (§ 8, guarantee 5)
    await putSections(token, { fridge: section({ added: { ingA: v(t0 - 500, 'late') }, removed: {} }, t0 + 500) });
    const after = await getDoc(token);
    expect((stockOf(after)[key] as StockEnvelope).state).toBe('tombstoned');
  });

  it('scenarios 3 and 7 — concurrent modifications converge, whatever the push order', async () => {
    const enriched = (location: 'fridge' | 'pantry', ingredientId: string, version: ElementVersion): StockSection => {
      const key = presenceEntryId(location, ingredientId);
      return {
        [key]: {
          state: 'active',
          entry: {
            id: key,
            ingredient_id: ingredientId,
            location,
            quantity: 250,
            unit: 'g',
            note: `v${version.physical}`,
            origin: 'manual',
            added_at: new Date(version.physical).toISOString(),
          },
          version,
        },
      };
    };
    for (const reversed of [false, true]) {
      const token = await newAccount();
      const [first, second] = reversed ? [v(2000, 'devB'), v(1000, 'devA')] : [v(1000, 'devA'), v(2000, 'devB')];
      await putSections(token, { stock: section(enriched('fridge', 'ingA', first), first.physical) });
      await putSections(token, { stock: section(enriched('fridge', 'ingA', second), second.physical) });
      const doc = await getDoc(token);
      const key = presenceEntryId('fridge', 'ingA');
      const winner = stockOf(doc)[key] as { version: ElementVersion; entry: { note: string } };
      expect(compareVersions(winner.version, v(2000, 'devB'))).toBe(0);
      expect(winner.entry.note).toBe('v2000');
    }
  });

  it('scenario 4 — a concurrent delete-vs-modify resolves by HLC; an exact tie = deleted', async () => {
    for (const tie of [false, true]) {
      const token = await newAccount();
      const t0 = Date.now();
      const key = presenceEntryId('fridge', 'ingA');
      // Device A modifies, device B deletes while A was offline
      await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(t0 + 1000, 'devA')), t0 + 1000) });
      const deleteVersion = tie ? v(t0 + 1000, 'devB') : v(t0 + 2000, 'devB');
      await putSections(token, {
        stock: section(
          {
            [key]: {
              state: 'tombstoned',
              stub: { id: key, ingredient_id: 'ingA', location: 'fridge' },
              version: deleteVersion,
              removed: deleteVersion,
            },
          },
          t0 + 2000
        ),
      });
      const doc = await getDoc(token);
      expect((stockOf(doc)[key] as StockEnvelope).state).toBe(tie ? 'tombstoned' : 'tombstoned');
      // The other issue: a modification NEWER than the deletion survives
      await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(t0 + 3000, 'devA')), t0 + 3000) });
      const after = await getDoc(token);
      expect((stockOf(after)[key] as StockEnvelope).state).toBe('active');
    }
  });

  it('scenarios 8 and 9 — bidirectional compatibility legacy ↔ stock', async () => {
    // 9: a legacy modification is absorbed into the stock (visible to the migrated clients)
    const token = await newAccount();
    await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(1000, 'migrated')), 1000) });
    await putSections(token, { fridge: section({ added: { ingB: v(3000, 'legacy') }, removed: {} }, 3000) });
    let doc = await getDoc(token);
    expect((stockOf(doc)[presenceEntryId('fridge', 'ingB')] as StockEnvelope).state).toBe('active');
    // ...and the legacy card still shows both (projection)
    expect(Object.keys(legacyOf(doc, 'fridge').added).sort()).toEqual(['ingA', 'ingB']);
    // 8: a migrated modification shows up in the legacy card of an old device
    await putSections(token, { stock: section(activeStock('fridge', 'ingC', v(4000, 'migrated')), 4000) });
    doc = await getDoc(token);
    expect(Object.keys(legacyOf(doc, 'fridge').added).sort()).toEqual(['ingA', 'ingB', 'ingC']);
  });

  it('three full cycles of projection → legacy push back → conversion converge to a fixed point', async () => {
    const token = await newAccount();
    const t0 = Date.now();
    const dKey = presenceEntryId('fridge', 'ingA');
    await putSections(token, {
      stock: section(activeStock('fridge', 'ingB', v(t0 + 3000, 'd2')), t0 + 3000),
    });
    // Delete ingA on a migrated device (an enriched entry) then let a legacy device sync
    await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(t0 + 1000, 'd1')), t0 + 1000) });
    await putSections(token, {
      stock: section(
        {
          [dKey]: {
            state: 'tombstoned',
            stub: { id: dKey, ingredient_id: 'ingA', location: 'fridge' },
            version: v(t0 + 2000, 'd1'),
            removed: v(t0 + 2000, 'd1'),
          },
        },
        t0 + 2000
      ),
    });
    let previousFridge: ElementSet | null = null;
    for (let cycle = 0; cycle < 3; cycle++) {
      const doc = await getDoc(token);
      const fridge = legacyOf(doc, 'fridge');
      // A legacy device pushes its whole card back (the merged card = the projection)
      await putSections(token, { fridge: section(fridge, 5000 + cycle) });
      const after = await getDoc(token);
      const stock = stockOf(after);
      expect((stock[dKey] as StockEnvelope).state).toBe('tombstoned'); // no resurrection
      const nextFridge = legacyOf(after, 'fridge');
      if (previousFridge) expect(nextFridge).toEqual(previousFridge); // fixed point
      previousFridge = nextFridge;
    }
  });

  it('the reserved device id in a pushed stock section is refused with a 400 and nothing is written', async () => {
    const token = await newAccount();
    await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(1000)), 1000) });
    const before = await getDoc(token);
    const forged = activeStock('fridge', 'ingB', v(2000, RESERVED_SYNC_DEVICE));
    const res = await putSections(token, { stock: section(forged, 2000) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { reason?: string }).reason).toBe('reserved-device');
    const after = await getDoc(token);
    expect(stockOf(after)).toEqual(stockOf(before)); // nothing written
    // ...and the reserved id cannot sneak in through `removed` either: an ACTIVE envelope
    // carrying a superseded deletion issued by `server` is refused
    const key = presenceEntryId('fridge', 'ingA');
    const forgedRemoved: StockSection = {
      [key]: {
        state: 'active',
        entry: {
          id: key,
          ingredient_id: 'ingA',
          location: 'fridge',
          origin: 'manual',
          added_at: new Date(1000).toISOString(),
        },
        version: v(3000),
        removed: v(2000, RESERVED_SYNC_DEVICE),
      },
    };
    const res2 = await putSections(token, { stock: section(forgedRemoved, 3000) });
    expect(res2.status).toBe(400);
  });

  it('an echo of the projection pushed back inside a legacy card is ignored (no reactivation)', async () => {
    const token = await newAccount();
    const t0 = Date.now();
    const dKey = presenceEntryId('fridge', 'ingA');
    // The stock holds: ingA deleted (tombstone t0+2000), ingB absent
    await putSections(token, {
      stock: section(activeStock('fridge', 'ingA', v(t0 + 1000, 'd1')), t0 + 1000),
    });
    await putSections(token, {
      stock: section(
        {
          [dKey]: {
            state: 'tombstoned',
            stub: { id: dKey, ingredient_id: 'ingA', location: 'fridge' },
            version: v(t0 + 2000, 'd1'),
            removed: v(t0 + 2000, 'd1'),
          },
        },
        t0 + 2000
      ),
    });
    const doc = await getDoc(token);
    const projected = legacyOf(doc, 'fridge'); // ingA: tombstoned → absent
    // The legacy device merges the projection and pushes its card back with a synthetic
    // re-add of ingA (the echo the server itself wrote in a previous cycle)
    const echoCard: ElementSet = {
      added: { ...projected.added, ingA: { physical: t0 + 2000, counter: 1, device: RESERVED_SYNC_DEVICE } },
      removed: { ...projected.removed },
    };
    const res = await putSections(token, { fridge: section(echoCard, t0 + 5000) });
    expect(res.status).toBe(200);
    const after = await getDoc(token);
    expect((stockOf(after)[dKey] as StockEnvelope).state).toBe('tombstoned'); // never reactivated
  });

  it('the registry rules are applied with the cache-less re-read before any refusal (§ 4.5)', async () => {
    const token = await newAccount();
    // 1. An unknown ingredient refuses the push without writing anything
    const refused = await putSections(token, { stock: section(activeStock('fridge', 'ghost', v(1000)), 1000) });
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { reason?: string }).reason).toBe('unknown-ingredient');
    expect(Object.keys(stockOf(await getDoc(token)))).toEqual([]);
    // 2. The ingredient is created AFTER the failed push (within the cache TTL): the
    //    cache-less re-read accepts it — a fresh ingredient is never rejected by mistake
    await store.put('ingredients', 'ghost', {
      id: 'ghost',
      name_fr: 'Nouveau',
      name_derja: '',
      name_ar: '',
      category: 'vegetables',
      unit_default: 'pièce',
      price_min_tnd: 1,
      price_max_tnd: 2,
    });
    const accepted = await putSections(token, { stock: section(activeStock('fridge', 'ghost', v(2000)), 2000) });
    expect(accepted.status).toBe(200);
    // 3. A permanent entry outside the E6 categories is refused (real category of the catalog)
    const wrongCategory = await putSections(token, {
      stock: section(
        (() => {
          const key = presenceEntryId('fridge', 'veg1');
          return {
            [key]: {
              state: 'active',
              entry: {
                id: key,
                ingredient_id: 'veg1',
                location: 'fridge',
                permanent: true,
                origin: 'manual',
                added_at: new Date(3000).toISOString(),
              },
              version: v(3000),
            },
          } as StockSection;
        })(),
        3000
      ),
    });
    expect(wrongCategory.status).toBe(400);
    expect(((await wrongCategory.json()) as { reason?: string }).reason).toBe('permanent-category');
    // 4. The same permanent entry on an E6 category is accepted
    const key = presenceEntryId('fridge', 'perm1');
    const permanent: StockSection = {
      [key]: {
        state: 'active',
        entry: {
          id: key,
          ingredient_id: 'perm1',
          location: 'fridge',
          permanent: true,
          origin: 'manual',
          added_at: new Date(4000).toISOString(),
        },
        version: v(4000),
      },
    };
    const ok = await putSections(token, { stock: section(permanent, 4000) });
    expect(ok.status).toBe(200);
    expect(PERMANENT_STOCK_CATEGORIES).toContain('canned_pantry');
  });

  it('an unknown unit refuses the push, then the cache-less re-read of the registry accepts it', async () => {
    const token = await newAccount();
    const withUnit = (unit: string): StockSection => {
      const key = presenceEntryId('fridge', 'ingA');
      return {
        [key]: {
          state: 'active',
          entry: {
            id: key,
            ingredient_id: 'ingA',
            location: 'fridge',
            quantity: 2,
            unit,
            origin: 'manual',
            added_at: new Date(1000).toISOString(),
          },
          version: v(1000),
        },
      };
    };
    const refused = await putSections(token, { stock: section(withUnit('bol'), 1000) });
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { reason?: string }).reason).toBe('unknown-unit');
    // A built-in unit is always known (the registry of the core)
    expect((await putSections(token, { stock: section(withUnit('kg'), 2000) })).status).toBe(200);
    // A configured unit added to the catalog is accepted through the cache-less re-read
    await store.put('units', 'bol', {
      id: 'bol',
      label: 'bol',
      kind: 'other',
      description_fr: 'Bol',
      description_derja: '',
      description_ar: '',
    });
    const accepted = await putSections(token, { stock: section(withUnit('bol'), 3000) });
    expect(accepted.status).toBe(200);
  });

  it('a quantity without its unit (or an invalid envelope) refuses the whole push, nothing partially applied', async () => {
    const token = await newAccount();
    await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(1000)), 1000) });
    // The push carries a valid favorites section AND an invalid stock section: the WHOLE
    // push is refused (a push is never partially applied)
    const badPayload = activeStock('fridge', 'ingB', v(2000));
    const badKey = Object.keys(badPayload)[0];
    (badPayload[badKey] as { entry: { quantity?: number; unit?: string } }).entry.quantity = 3;
    delete (badPayload[badKey] as { entry: { unit?: string } }).entry.unit;
    const res = await putSections(token, {
      favorites: section(['r1'], 2000),
      stock: section(badPayload, 2000),
    });
    expect(res.status).toBe(400);
    const after = await getDoc(token);
    expect(after.sections.favorites).toBeUndefined(); // nothing of the push landed
    expect(Object.keys(stockOf(after))).toEqual([presenceEntryId('fridge', 'ingA')]);
    // An entry id contradicting its key is refused (identity invariant)
    const forged = activeStock('fridge', 'ingB', v(3000));
    const forgedKey = Object.keys(forged)[0];
    (forged[forgedKey] as { entry: { id: string } }).entry.id = 'st_fridge_other';
    expect((await putSections(token, { stock: section(forged, 3000) })).status).toBe(400);
  });

  it('the caps are applied on the merged stock (explicit refusal, never a truncation)', async () => {
    const token = await newAccount();
    const payload = (ids: string[]): Record<string, unknown> => {
      const stock: StockSection = {};
      for (const id of ids) Object.assign(stock, activeStock('fridge', id, v(1000 + ids.indexOf(id), 'bulk')));
      return { stock: section(stock, 1000) };
    };
    const first = await putSections(token, payload(INGREDIENT_IDS.filter((id) => id.startsWith('bulk')).slice(0, 300)));
    expect(first.status).toBe(200);
    // 300 stored + 300 different incoming = 600 active fridge entries: over the cap, refused
    const second = await putSections(
      token,
      payload(INGREDIENT_IDS.filter((id) => id.startsWith('bulk')).slice(300, 600))
    );
    expect(second.status).toBe(400);
    expect(((await second.json()) as { reason?: string }).reason).toBe('stock-caps');
    const doc = await getDoc(token);
    expect(Object.keys(stockOf(doc))).toHaveLength(300); // the stored section is intact
  });

  it('the stock tombstones are purged beyond the retention window', async () => {
    const token = await newAccount();
    const key = presenceEntryId('fridge', 'ingA');
    const retention = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    // The entry is added BEFORE the deletion (the tombstone is newer) and both are stale
    await putSections(token, { stock: section(activeStock('fridge', 'ingA', v(now - retention - 5000, 'd1')), now) });
    const stale: StockSection = {
      [key]: {
        state: 'tombstoned',
        stub: { id: key, ingredient_id: 'ingA', location: 'fridge' },
        version: v(now - retention - 1, 'd1'),
        removed: v(now - retention - 1, 'd1'),
      },
    };
    const res = await putSections(token, { stock: section(stale, now) });
    expect(res.status).toBe(200);
    expect(stockOf(await getDoc(token))[key]).toBeUndefined(); // purged during the merge
  });
});
