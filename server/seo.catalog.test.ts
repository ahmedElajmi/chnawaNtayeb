import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import knex, { type Knex } from 'knex';
import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqlStore, ensureSchema } from './storage/sqlStore';
import { contractPublishedCatalog, type PublishedCatalogSource } from './storage/publishedCatalog';
import { initialRecipes } from '../src/core/catalog';
import { slugify } from '../src/core/shared';

/**
 * The server-side SEO catalog reader (getCatalog) over the real storage contract. The
 * preserved behaviours (lot 1.3 requirement): complete first load, pagination, deletions,
 * resume after an error, the cursor moving only after a page was fully applied, and the
 * last catalog kept when the storage is unavailable.
 *
 * getCatalog keeps module state (copies, cache): each scenario imports a fresh module and
 * wires its own source. The 60 s cache is jumped over with the clock (same behaviour as a
 * robot arriving after the refresh delay).
 */

let db: Knex;
let driver: betterSqlite3.Database;
let file = '';

beforeAll(async () => {
  file = join(tmpdir(), `seo-catalog-${process.pid}-${Date.now()}.db`);
  driver = betterSqlite3(file);
  db = knex({ client: 'better-sqlite3', connection: { filename: file }, useNullAsDefault: true });
  await ensureSchema(db);
});

afterAll(async () => {
  await db.destroy();
  driver.close();
  rmSync(file, { force: true });
});

afterEach(() => {
  vi.useRealTimers();
  // The tests share one SQLite file: each scenario starts from an empty collection
  driver.prepare('DELETE FROM recipes').run();
});

/** A valid stored recipe (the parser of the registry accepts it as it is). */
const doc = (name: string): Record<string, unknown> => ({
  ...initialRecipes[0],
  name_fr: name,
  slug: slugify(name),
});

/** The clock is moved past the refresh delay: the next getCatalog really talks to the source. */
const pastCache = () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 120_000);
};

/** A fresh reader module: empty copies, empty cache, the given source wired. */
async function freshReader(source: PublishedCatalogSource | null) {
  vi.resetModules();
  const seo = await import('./seo');
  seo.setCatalogSource(source);
  return seo;
}

describe('seo catalog reader (getCatalog over the storage contract)', () => {
  it('serves the built-in fallback when no source is wired (no storage configured)', async () => {
    const { getCatalog } = await freshReader(null);
    const catalog = await getCatalog();
    expect(catalog.recipes).toEqual([]);
    expect(catalog.ingredients.length).toBeGreaterThan(0);
  });

  it('loads the published recipes completely, deletions applied, through the contract', async () => {
    const store = createSqlStore(db);
    const { getCatalog } = await freshReader(contractPublishedCatalog(store));
    await store.put('recipes', 'r1', doc('Ojja'));
    await store.put('recipes', 'r2', doc('Kafteji'));
    await store.remove('recipes', 'r2');
    const catalog = await getCatalog();
    expect(catalog.recipes.map((r) => r.slug)).toEqual([slugify('Ojja')]);
  });

  it('catches up incrementally: the second read applies only the new changes', async () => {
    const store = createSqlStore(db);
    const { getCatalog } = await freshReader(contractPublishedCatalog(store));
    const first = await getCatalog(); // first load: the storage holds nothing yet
    expect(first.recipes).toEqual([]);
    await store.put('recipes', 'r1', doc('Ojja'));
    pastCache();
    const second = await getCatalog();
    expect(second.recipes).toHaveLength(1);
    // And a third read inside the refresh delay is served from the cache, not the storage
    const cached = await getCatalog();
    expect(cached).toBe(second);
  });

  it('keeps the last catalog when the storage becomes unavailable', async () => {
    const store = createSqlStore(db);
    const { getCatalog, setCatalogSource } = await freshReader(contractPublishedCatalog(store));
    await store.put('recipes', 'r1', doc('Ojja'));
    await getCatalog();
    pastCache();
    // The storage goes down: the previous catalog is served (robots never see a blank site)
    setCatalogSource({ changes: () => Promise.reject(new Error('storage down')) });
    const kept = await getCatalog();
    expect(kept.recipes).toHaveLength(1);
  });

  it('moves the cursor only after a page was fully applied (resume after an error)', async () => {
    const store = createSqlStore(db);
    const source = contractPublishedCatalog(store);
    // The recipes feed succeeds on its first page and fails on the second one: the cursor
    // stays at the first applied page (the other collections are unaffected).
    let recipePages = 0;
    const flaky: PublishedCatalogSource = {
      changes: async (name, cursor, limit) => {
        if (name === 'recipes') {
          recipePages += 1;
          if (recipePages === 2) throw new Error('flaky storage');
        }
        return source.changes(name, cursor, limit);
      },
    };
    const { getCatalog } = await freshReader(flaky);
    for (let i = 0; i < 305; i++) await store.put('recipes', `r${i}`, doc(`Recette ${i}`));
    // The failed first load serves the same empty fallback a robot without storage sees
    const failed = await getCatalog();
    expect(failed.recipes).toEqual([]);
    expect(recipePages).toBe(2); // page 1 applied, page 2 failed
    pastCache();
    // The retry, same source, resumes exactly at the cursor: one more page, no loss, no duplicate
    const retried = await getCatalog();
    expect(retried.recipes).toHaveLength(305);
    expect(recipePages).toBe(3); // the retry read only the missing page
  });

  it('paginates a long catch-up beyond one contract page', { timeout: 30_000 }, async () => {
    await ensureSchema(db);
    const store = createSqlStore(db);
    const { getCatalog } = await freshReader(contractPublishedCatalog(store));
    for (let i = 0; i < 350; i++) await store.put('recipes', `r${i}`, doc(`Recette ${i}`));
    const catalog = await getCatalog();
    expect(catalog.recipes).toHaveLength(350);
  });
});
