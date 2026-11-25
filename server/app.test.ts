import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import type { AddressInfo } from 'node:net';
import knex, { type Knex } from 'knex';
import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApiApp } from './app';
import { ensureSchema } from './storage/sqlStore';
import { resetWatermarks } from './storage/watermark';
import {
  activeEnvelope,
  presenceEntryId,
  projectStockToLegacy,
  tombstoneEnvelope,
  type ElementSet,
  type ElementVersion,
  type StockEntry,
  type StockSection,
} from '../src/core/kitchen';
import type { BackofficeAuthConfig } from './backofficeAuth';

/**
 * The provider selection (lot 1.3): one active provider chosen by DATA_STORE, an unknown
 * value is an explicit startup error, memory is refused in production, sql runs locally on
 * SQLite (SQLITE_PATH), the default stays Firestore (degraded when unconfigured).
 */

const CONFIG: BackofficeAuthConfig = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

const deps = { backofficeAuthConfig: CONFIG, vision: null };

const saved = {
  DATA_STORE: process.env.DATA_STORE,
  SQLITE_PATH: process.env.SQLITE_PATH,
  NODE_ENV: process.env.NODE_ENV,
};
afterAll(() => {
  process.env.DATA_STORE = saved.DATA_STORE;
  process.env.SQLITE_PATH = saved.SQLITE_PATH;
  process.env.NODE_ENV = saved.NODE_ENV;
});

let db: Knex;
let driver: betterSqlite3.Database;
let file = '';

beforeAll(() => {
  file = join(tmpdir(), `app-selection-${process.pid}-${Date.now()}.db`);
  driver = betterSqlite3(file);
  db = knex({ client: 'better-sqlite3', connection: { filename: file }, useNullAsDefault: true });
});

afterAll(async () => {
  await db.destroy();
  driver.close();
  // The app's own Knex instance still holds the file: the temp cleanup is best-effort
  try {
    rmSync(file, { force: true });
  } catch {
    /* the temp directory is cleaned by the OS */
  }
});

/** Boots the app on a free port; the caller closes the server when done. */
async function start(app: Express): Promise<{ base: string; close: () => Promise<void> }> {
  const server = await new Promise<ReturnType<Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return {
    base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

describe('DATA_STORE selection', () => {
  it('an unknown value is an explicit startup error, never a silent fallback', async () => {
    process.env.DATA_STORE = 'mongo';
    await expect(createApiApp(deps)).rejects.toThrow(
      'DATA_STORE="mongo" is unknown: expected firestore | sql | memory'
    );
  });

  it('memory is refused in production', async () => {
    process.env.DATA_STORE = 'memory';
    process.env.NODE_ENV = 'production';
    await expect(createApiApp(deps)).rejects.toThrow('DATA_STORE=memory is refused in production');
  });

  it('sql needs its local connection setting', async () => {
    process.env.DATA_STORE = 'sql';
    delete process.env.SQLITE_PATH;
    process.env.NODE_ENV = 'test';
    await expect(createApiApp(deps)).rejects.toThrow('DATA_STORE=sql needs SQLITE_PATH');
  });

  it('the default stays Firestore, degraded to the endpoints when unconfigured', async () => {
    delete process.env.DATA_STORE;
    process.env.NODE_ENV = 'test';
    // No service account in the test environment: the app boots with a null store
    const { base, close } = await start(await createApiApp(deps));
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    await close();
  });

  it('the sql option serves the endpoints through the contract (schema ensured at startup)', async () => {
    process.env.DATA_STORE = 'sql';
    process.env.SQLITE_PATH = file;
    process.env.NODE_ENV = 'test';
    const { base, close } = await start(await createApiApp(deps));
    // The startup ensured the schema: one table per registry collection is really there
    const table = driver.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recipes'").get();
    expect(table).toBeDefined();
    // And the change feed answers through the contract (a real read of the SQLite store)
    const feed = await fetch(`${base}/api/data/changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(feed.status).toBe(200);
    const feedJson = (await feed.json()) as { ok?: boolean };
    expect(feedJson.ok).toBe(true);
    await close();
  });
});

/**
 * Lot F1 A1 (implementation, dossier `lot-F1-A1-dossier-implementation.md` v2): the
 * dedicated transport limit of /api/kitchen — 3 MiB = 3 145 728 bytes, /api/kitchen and its
 * real sub-routes only, every other endpoint unchanged, business caps untouched. The
 * payloads are built programmatically with the same core functions as the measure
 * (scripts/diagnostics/measure-a1-fullcaps.ts): no committed fixture, no truncation, no
 * artificial value — the boundary payloads stay business-valid end to end (the last byte of
 * tuning uses ONE legal uncapped field: a grocery item name, the documented contract gap).
 */

const A1_LIMIT_BYTES = 3_145_728; // bytes('3mb') — the production selector's bound

const A1_INGREDIENT_COUNT = 700;
const A1_INGREDIENT = (i: number): string => (i < 8 ? `perm${i}` : `ing${String(i).padStart(4, '0')}`);

let a1Now = 0;
const a1Version = (age: number, counter = 0): ElementVersion => ({ physical: a1Now - age, counter, device: 'a1' });

function a1ActiveStock(location: 'fridge' | 'pantry', count: number, firstIngredient: number): StockSection {
  const section: StockSection = {};
  for (let i = 0; i < count; i++) {
    const ingredientId = A1_INGREDIENT(firstIngredient + i);
    const entry: StockEntry = {
      id: presenceEntryId(location, ingredientId),
      ingredient_id: ingredientId,
      location,
      origin: 'manual',
      added_at: new Date(a1Now - i * 1_000).toISOString(),
      quantity: 2_000 - i,
      unit: 'pièce',
      note: 'Sachet ouvert, à finir cette semaine',
    };
    section[entry.id] = activeEnvelope(entry, a1Version(i * 1_000, i % 8));
  }
  return section;
}

function a1Tombstones(location: 'fridge' | 'pantry', count: number, firstIngredient: number): StockSection {
  const section: StockSection = {};
  for (let i = 0; i < count; i++) {
    const ingredientId = A1_INGREDIENT(firstIngredient + i);
    const stub = { id: presenceEntryId(location, ingredientId), ingredient_id: ingredientId, location };
    section[stub.id] = tombstoneEnvelope(stub, a1Version(i * 1_000));
  }
  return section;
}

function a1ElementSet(prefix: string, added: number, removed: number): ElementSet {
  const addedMap: Record<string, ElementVersion> = {};
  for (let i = 0; i < added; i++) addedMap[`${prefix}${String(i).padStart(4, '0')}`] = a1Version(i * 1_000);
  const removedMap: Record<string, ElementVersion> = {};
  for (let i = 0; i < removed; i++) {
    removedMap[`${prefix}${String(added + i).padStart(4, '0')}`] = a1Version(i * 1_000);
  }
  return { added: addedMap, removed: removedMap };
}

function a1GroceryItem(i: number): Record<string, unknown> {
  return {
    id: `g${String(i).padStart(4, '0')}`,
    ingredient_id: A1_INGREDIENT(i % A1_INGREDIENT_COUNT),
    name: `Article ${i}`,
    quantity: 2,
    unit: 'pièce',
    category: 'vegetables',
    is_checked: i % 2 === 0,
  };
}

function a1GroceryLists(): unknown {
  return {
    activeId: 'list_0',
    lists: Array.from({ length: 20 }, (_, l) => ({
      id: `list_${l}`,
      name: `Liste ${l}`,
      note: 'Grand marché',
      spent_tnd: 42.5,
      items: Array.from({ length: 500 }, (_item, i) => a1GroceryItem(i)),
    })),
  };
}

function a1WeeklyPlan(): unknown {
  return Array.from({ length: 14 }, (_, d) => ({
    date: `2026-11-${String(20 + (d % 9)).padStart(2, '0')}`,
    lunch: { plat_id: 'rec0001', portions: 4 },
    dinner: { plat_id: 'rec0002', portions: 2 },
  }));
}

function a1Preferences(): unknown {
  return {
    language: 'derja',
    default_servings: 4,
    mode: 'system',
    themeId: '',
    pantryStaples: Array.from({ length: A1_INGREDIENT_COUNT }, (_, i) => A1_INGREDIENT(i)),
    dietary_filter: 'all',
  };
}

interface A1Sections {
  [name: string]: { value: unknown; updated_at: number };
}

/** C1 (the measure's realistic worst case): every section at the contract caps, the legacy
 *  cards being the server-side projection of the capped stock — byte-reproducible
 *  (2 435 950 bytes in the measure of 2026-11-20). */
function a1C1Sections(): A1Sections {
  const stock: StockSection = {
    ...a1ActiveStock('fridge', 300, 0),
    ...a1ActiveStock('pantry', 300, 300),
    ...a1Tombstones('fridge', 2_000, 600),
  };
  return {
    favorites: { value: a1ElementSet('rec', 300, 2_000), updated_at: a1Now - 10_000 },
    fridge: { value: projectStockToLegacy(stock, 'fridge'), updated_at: a1Now - 9_000 },
    pantry: { value: projectStockToLegacy(stock, 'pantry'), updated_at: a1Now - 8_000 },
    weeklyPlan: { value: a1WeeklyPlan(), updated_at: a1Now - 7_000 },
    groceryList: { value: Array.from({ length: 500 }, (_, i) => a1GroceryItem(i)), updated_at: a1Now - 6_500 },
    groceryLists: { value: a1GroceryLists(), updated_at: a1Now - 6_000 },
    groceryMeta: { value: { note: 'Grand marché', spent_tnd: 42.5 }, updated_at: a1Now - 5_500 },
    preferences: { value: a1Preferences(), updated_at: a1Now - 5_000 },
    stock: { value: stock, updated_at: a1Now },
  };
}

const a1Payload = (sections: A1Sections): string => JSON.stringify({ sections });
const a1Bytes = (sections: A1Sections): number => Buffer.byteLength(a1Payload(sections), 'utf8');

/** The transport boundary: full C1 with ONE legal uncapped field (a grocery item name)
 *  tuned so the serialized payload is EXACTLY `target` bytes. The payload stays
 *  business-valid — the verdict at the boundary is a transport verdict, never a business
 *  tolerance and never a parsing artefact. */
function a1C1PaddedTo(target: number): { sections: A1Sections; bytes: number } {
  const sections = a1C1Sections();
  const firstItem = (sections.groceryLists.value as { lists: Array<{ items: Array<Record<string, unknown>> }> })
    .lists[0].items[0];
  firstItem.name = 'a';
  const base = a1Bytes(sections);
  firstItem.name = 'a'.repeat(target - base + 1);
  return { sections, bytes: a1Bytes(sections) };
}

const A1_COUNTRY = {
  id: 'TN',
  dial: '+216',
  enabled: true,
  regions: [{ id: 'tunis', name_fr: 'Tunis', name_ar: 'تونس' }],
  postal_digits: 4,
};

describe('the dedicated /api/kitchen transport limit (lot F1 A1)', () => {
  beforeAll(async () => {
    process.env.DATA_STORE = 'sql';
    process.env.SQLITE_PATH = file;
    process.env.NODE_ENV = 'test';
    resetWatermarks();
    a1Now = Date.now();
    // The registry the kitchen validation reads (same seeds as the measure): countries for
    // the registration flow, the 700 referenced ingredients for the stock envelopes.
    await ensureSchema(db);
    await db('countries').insert({
      id: 'TN',
      data: JSON.stringify(A1_COUNTRY),
      revision: 1,
      updated_at: new Date().toISOString(),
      deleted: false,
    });
    await db.batchInsert(
      'ingredients',
      Array.from({ length: A1_INGREDIENT_COUNT }, (_, i) => {
        const id = A1_INGREDIENT(i);
        return {
          id,
          data: JSON.stringify({
            id,
            name_fr: `Ingrédient ${id}`,
            name_derja: '',
            name_ar: '',
            category: id.startsWith('perm') ? 'canned_pantry' : 'vegetables',
            unit_default: 'pièce',
            price_min_tnd: 1,
            price_max_tnd: 2,
          }),
          revision: 1,
          updated_at: new Date().toISOString(),
          deleted: false,
        };
      }),
      100
    );
  });

  const a1Boot = async (): Promise<{ base: string; close: () => Promise<void> }> => start(await createApiApp(deps));

  let a1Seq = 0;
  const a1Register = async (base: string): Promise<string> => {
    const res = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `a1transport${++a1Seq}@test.tn`,
        password: 'long-enough-1',
        displayName: 'Amine',
        address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
      }),
    });
    const body = (await res.json()) as { token?: string };
    if (!body.token) throw new Error(`register failed: ${res.status}`);
    return body.token;
  };

  const a1Put = (base: string, token: string, body: string): Promise<Response> =>
    fetch(base + '/api/kitchen', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Kitchen-Protocol-Version': '1',
      },
      body,
    });

  const a1StockKeys = async (base: string, token: string): Promise<string[]> => {
    const res = await fetch(base + '/api/kitchen', {
      headers: { Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { doc: { sections: Record<string, { value: unknown }> } | null };
    return Object.keys((data.doc?.sections.stock?.value ?? {}) as Record<string, unknown>);
  };

  it('test 1 (mandatory) — a full-caps C1 payload (~2.4 MiB) is accepted and stored whole', async () => {
    const { base, close } = await a1Boot();
    const token = await a1Register(base);
    const sections = a1C1Sections();
    const bytes = a1Bytes(sections);
    expect(bytes).toBeGreaterThanOrEqual(2_400_000); // the measured legitimate worst case
    const res = await a1Put(base, token, a1Payload(sections));
    expect(res.status).toBe(200);
    expect(await a1StockKeys(base, token)).toHaveLength(2_600); // 600 active + 2 000 tombstones
    const getRes = await fetch(base + '/api/kitchen', {
      headers: { Authorization: `Bearer ${token}`, 'X-Kitchen-Protocol-Version': '1' },
    });
    expect(getRes.status).toBe(200);
    const after = (await getRes.json()) as { doc: { sections: Record<string, { value: unknown }> } | null };
    const grocery = after.doc?.sections.groceryLists?.value as { lists: unknown[] } | undefined;
    expect(grocery?.lists).toHaveLength(20);
    await close();
  }, 60_000);

  it('test 2 — a legal push over the old limit (B1c: 2 000 tombstones, ~498 KiB) is accepted', async () => {
    const { base, close } = await a1Boot();
    const token = await a1Register(base);
    const sections: A1Sections = { stock: { value: a1Tombstones('fridge', 2_000, 600), updated_at: a1Now } };
    const bytes = a1Bytes(sections);
    expect(bytes).toBeGreaterThan(100 * 1024); // the old limit would have refused it
    expect(bytes).toBeLessThan(A1_LIMIT_BYTES);
    const res = await a1Put(base, token, a1Payload(sections));
    expect(res.status).toBe(200);
    expect(await a1StockKeys(base, token)).toHaveLength(2_000);
    await close();
  }, 60_000);

  it('test 3 — a body just over the limit is a 413, nothing is written', async () => {
    const { base, close } = await a1Boot();
    const token = await a1Register(base);
    const { sections, bytes } = a1C1PaddedTo(A1_LIMIT_BYTES + 1);
    expect(bytes).toBe(A1_LIMIT_BYTES + 1);
    const res = await a1Put(base, token, a1Payload(sections));
    expect(res.status).toBe(413);
    expect(await a1StockKeys(base, token)).toEqual([]); // nothing treated
    await close();
  }, 60_000);

  it('test 4 — a business-valid payload exactly one byte under the limit is accepted', async () => {
    const { base, close } = await a1Boot();
    const token = await a1Register(base);
    const { sections, bytes } = a1C1PaddedTo(A1_LIMIT_BYTES - 1);
    expect(bytes).toBe(A1_LIMIT_BYTES - 1);
    const res = await a1Put(base, token, a1Payload(sections));
    expect(res.status).toBe(200);
    expect(await a1StockKeys(base, token)).toHaveLength(2_600);
    await close();
  }, 60_000);

  it('test 5 — the exact boundary: at the limit is accepted, one byte over is a 413', async () => {
    const { base, close } = await a1Boot();
    const atLimit = a1C1PaddedTo(A1_LIMIT_BYTES);
    expect(atLimit.bytes).toBe(A1_LIMIT_BYTES);
    const tokenAt = await a1Register(base);
    expect((await a1Put(base, tokenAt, a1Payload(atLimit.sections))).status).toBe(200); // raw-body refuses only length > limit
    const tokenOver = await a1Register(base);
    const over = a1C1PaddedTo(A1_LIMIT_BYTES + 1);
    expect((await a1Put(base, tokenOver, a1Payload(over.sections))).status).toBe(413);
    await close();
  }, 120_000);

  it('test 6 — three error families stay distinct: 400-parse, 400-métier, 413', async () => {
    const { base, close } = await a1Boot();
    // (a) malformed JSON under the limit: a parse error, never a business verdict
    const tokenParse = await a1Register(base);
    const parseFail = await fetch(base + '/api/kitchen', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenParse}`,
        'X-Kitchen-Protocol-Version': '1',
      },
      body: '{"sections":{"stock":{"value":',
    });
    expect(parseFail.status).toBe(400);
    expect(await parseFail.text()).not.toContain('stock-caps');
    // (b) valid JSON, caps violated at the MERGE: the business refusal keeps its reason
    // (300 stored, then 300 different = 600 merged → refused without any write)
    const tokenCaps = await a1Register(base);
    expect(
      (
        await a1Put(
          base,
          tokenCaps,
          a1Payload({ stock: { value: a1ActiveStock('fridge', 300, 0), updated_at: a1Now } })
        )
      ).status
    ).toBe(200);
    const caps = await a1Put(
      base,
      tokenCaps,
      a1Payload({ stock: { value: a1ActiveStock('fridge', 300, 300), updated_at: a1Now } })
    );
    expect(caps.status).toBe(400);
    expect(((await caps.json()) as { reason?: string }).reason).toBe('stock-caps');
    // (c) over the limit: a transport refusal before any handler, never a business reason
    const tokenTransport = await a1Register(base);
    const over = a1C1PaddedTo(A1_LIMIT_BYTES + 1);
    const oversize = await a1Put(base, tokenTransport, a1Payload(over.sections));
    expect(oversize.status).toBe(413);
    expect(await oversize.text()).not.toContain('stock-caps');
    await close();
  }, 120_000);

  it('test 7 — the business caps (B1a–B1d) still refuse with 400, never a 413 nor an acceptation', async () => {
    const { base, close } = await a1Boot();
    const token = await a1Register(base);
    // B1a/B1b (active entries per location): 300 stored, then 300 different = 600 merged
    expect(
      (await a1Put(base, token, a1Payload({ stock: { value: a1ActiveStock('fridge', 300, 0), updated_at: a1Now } })))
        .status
    ).toBe(200);
    const refused = await a1Put(
      base,
      token,
      a1Payload({ stock: { value: a1ActiveStock('fridge', 300, 300), updated_at: a1Now } })
    );
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { reason?: string }).reason).toBe('stock-caps');
    // B1d (tombstones): 2 001 tombstones in one push are refused by the push-level
    // validation (a 400 'invalid-input' — the reason field is carried only by the
    // merge-level refusal; still never a 413 and never an acceptation)
    const tooMany = await a1Put(
      base,
      token,
      a1Payload({ stock: { value: a1Tombstones('fridge', 2_001, 600), updated_at: a1Now + 1 } })
    );
    expect(tooMany.status).toBe(400);
    expect(await tooMany.text()).not.toBe('');
    expect(await a1StockKeys(base, token)).toHaveLength(300); // the first push is intact
    await close();
  }, 60_000);

  it('test 8 — the other endpoints keep their limits unchanged', async () => {
    const { base, close } = await a1Boot();
    // a small-JSON endpoint: over 100 KiB is still a 413 (unchanged)
    const register413 = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'a1big@test.tn',
        password: 'long-enough-1',
        displayName: 'Amine',
        junk: 'x'.repeat(200_000),
      }),
    });
    expect(register413.status).toBe(413);
    // the data batches: the 5 MiB limit is unchanged (a >100 KiB body is NOT a 413)
    const changes = await fetch(base + '/api/data/changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ junk: 'y'.repeat(200_000) }),
    });
    expect(changes.status).not.toBe(413);
    await close();
  }, 60_000);

  it('test 9 — the kitchen branch catches the kitchen routes only (exact match + real sub-routes)', async () => {
    const { base, close } = await a1Boot();
    // a sibling path that merely starts with the same prefix keeps the 100 KiB limit
    const sibling = await fetch(base + '/api/kitchenX', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ junk: 'x'.repeat(200_000) }),
    });
    expect(sibling.status).toBe(413);
    // the real sub-route /api/kitchen/history IS covered by the kitchen branch: a >100 KiB
    // body is parsed (unauthenticated → the route answers, never a transport 413)
    const history = await fetch(base + '/api/kitchen/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ junk: 'x'.repeat(200_000) }),
    });
    expect(history.status).not.toBe(413);
    await close();
  }, 60_000);

  it('test 10 — the C1 acceptance is reproducible (two independent accounts, same verdict)', async () => {
    const { base, close } = await a1Boot();
    const payload = a1Payload(a1C1Sections());
    for (let run = 0; run < 2; run++) {
      const token = await a1Register(base);
      expect((await a1Put(base, token, payload)).status).toBe(200);
    }
    await close();
  }, 120_000);
});
