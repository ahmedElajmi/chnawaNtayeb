import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import knex, { type Knex } from 'knex';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COLLECTIONS } from './collections';
import { createSqlStore, ensureSchema } from './sqlStore';
import { createMemoryDataStore } from './memoryDataStore';
import type { DataStore } from './types';

/**
 * Smoke benchmark of the change-feed pagination: a full catch-up over a reference-sized
 * collection must stay linear (no super-linear cost), for the memory and the SQL stores.
 * Generous wall-clock bounds — this test catches algorithmic drift, not absolute latency
 * (the recorded baseline and the per-engine thresholds live in lot 1.4).
 */

const N = 1000;
const PAGE = 100;
const GENEROUS_MS = 15_000;

let db: Knex;
let driver: betterSqlite3.Database;
let file = '';

beforeAll(async () => {
  file = path.join(tmpdir(), `chnawa-perf-smoke-${process.pid}-${Date.now()}.db`);
  driver = betterSqlite3(file);
  db = knex({ client: 'better-sqlite3', connection: { filename: file }, useNullAsDefault: true });
  await ensureSchema(db);
});

afterAll(async () => {
  await db.destroy();
  driver.close();
  rmSync(file, { force: true });
});

async function fullCatchUp(store: DataStore): Promise<number> {
  const started = Date.now();
  let cursor: number | { revision: number; id?: string } = 0;
  let delivered = 0;
  let pages = 0;
  for (;;) {
    const delta = await store.changes('recipes', cursor, PAGE);
    delivered += delta.items.length + delta.removedIds.length;
    pages += 1;
    if (!delta.cursor || !delta.more) break;
    cursor = delta.cursor;
    expect(pages).toBeLessThan(N / PAGE + 10); // linear page count, never a pathological drift
  }
  const elapsed = Date.now() - started;
  expect(elapsed).toBeLessThan(GENEROUS_MS);
  return delivered;
}

describe('change-feed pagination smoke benchmark', () => {
  it(
    'a full catch-up of 1000 documents stays linear (sqlite)',
    async () => {
      for (const spec of Object.values(COLLECTIONS)) driver.prepare(`DELETE FROM ${spec.name}`).run();
      const store = createSqlStore(db);
      for (let i = 1; i <= N; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
      expect(await fullCatchUp(store)).toBe(N);
    },
    60_000 // the 1000 sequential writes are the fixture, not the measurement: no 5 s cap
  );

  it('a full catch-up of 1000 documents stays linear (memory)', async () => {
    const store = createMemoryDataStore();
    for (let i = 1; i <= N; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
    expect(await fullCatchUp(store)).toBe(N);
  });
});
