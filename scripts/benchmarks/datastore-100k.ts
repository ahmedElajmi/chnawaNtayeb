/**
 * Performance harness of the data layer (lot 1.4, C5): a 100 000-document reference base,
 * the p95 of the operations that matter (full catch-up pagination, single write, change
 * poll). The measured baseline is recorded (thresholds are a later explicit decision —
 * validated micro-arbitrage 3); this script only measures and prints.
 *
 * Usage (from the project root):
 *   npx tsx scripts/benchmarks/datastore-100k.ts [--docs 100000] [--writes 2000] [--page 300] [--polls 50]
 *   PERF_STORE=memory npx tsx scripts/benchmarks/datastore-100k.ts --docs 10000                    (in-memory variant)
 *   TEST_SQL_CLIENT=pg TEST_SQL_DSN=postgres://… npx tsx scripts/benchmarks/datastore-100k.ts      (any engine via the env)
 */
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import knex, { type Knex } from 'knex';
import { createSqliteKnex, createSqlStore, ensureSchema } from '../../server/storage/sqlStore';
import { createMemoryDataStore } from '../../server/storage/memoryDataStore';
import type { DataStore } from '../../server/storage/types';

const args = (flag: string, fallback: number): number => {
  const raw = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return raw ? Number(raw.split('=')[1]) : fallback;
};

const DOCS = args('docs', 100_000);
const WRITES = args('writes', 2_000);
const PAGE = args('page', 300);
const POLLS = args('polls', 50);

/** The reference document (~600 bytes stored, the shape of a real recipe row). */
const DOC = {
  name_fr: 'Recette de référence',
  description_fr: 'Document du corpus de référence du harnais de performance (lot 1.4).',
  is_published: true,
  category: 'plat_principal',
  cuisine_type: 'tunisienne',
  difficulty: 'facile',
  steps: [{ step_number: 1, instruction_fr: 'Étape de préparation du corpus.' }],
  ingredients: [{ ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'kg', is_optional: false }],
  prep_time_minutes: 5,
  cook_time_minutes: 10,
  base_servings: 2,
  estimated_cost_tnd: 8,
  chef_tip: { fr: 'Astuce du corpus de référence.' },
  keywords: ['corpus', 'performance'],
};

/** Percentile helper (nearest-rank). */
const percentile = (values: number[], rank: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((rank / 100) * sorted.length) - 1)] ?? 0;
};

const ms = (values: number[]): string =>
  `${percentile(values, 50).toFixed(2)} / ${percentile(values, 95).toFixed(2)} / ${Math.max(...values).toFixed(2)}`;

const idOf = (i: number): string => `doc_${String(i).padStart(7, '0')}`;

let db: Knex | null = null;
let file = '';

/** Builds the store under test: SQLite file by default, any engine via TEST_SQL_CLIENT/DSN, or memory. */
async function buildStore(): Promise<{ store: DataStore; teardown: () => Promise<void> }> {
  if (process.env.TEST_SQL_CLIENT && process.env.TEST_SQL_DSN) {
    db = knex({ client: process.env.TEST_SQL_CLIENT, connection: process.env.TEST_SQL_DSN });
    await ensureSchema(db);
    return {
      store: createSqlStore(db),
      teardown: async () => {
        if (db) await db.destroy();
      },
    };
  }
  if (process.env.PERF_STORE === 'memory') {
    return { store: createMemoryDataStore(), teardown: async () => undefined };
  }
  file = join(tmpdir(), `datastore-100k-${process.pid}-${Date.now()}.db`);
  db = createSqliteKnex(file);
  await ensureSchema(db);
  return {
    store: createSqlStore(db),
    teardown: async () => {
      if (!db) return;
      await db.destroy();
      db = null;
      rmSync(file, { force: true });
      rmSync(`${file}-wal`, { force: true });
      rmSync(`${file}-shm`, { force: true });
    },
  };
}

/**
 * Seeds the reference base with prepared statements inside one transaction (setup, never
 * measured): the store under test only READS the seeded base; the measured writes go
 * through the real contract. Revisions 1..N give the same gap-free reference order a real
 * catalogue would have. (knex batchInsert compiles to a compound SELECT capped by
 * SQLITE_MAX_COMPOUND_SELECT — the prepared loop avoids it and is far faster.)
 */
async function seed(count: number): Promise<void> {
  if (!db) throw new Error('the direct seed needs a SQL store (use PERF_STORE=memory for the memory variant)');
  const data = JSON.stringify(DOC);
  const now = new Date().toISOString();
  // The raw driver connection: a prepared statement + one transaction for the whole seed
  const driver = (await db.client.acquireConnection()) as {
    prepare: (sql: string) => { run: (...bind: unknown[]) => unknown };
    transaction: (fn: (from: number, to: number) => void) => (from: number, to: number) => void;
  };
  const insert = driver.prepare(
    'INSERT OR REPLACE INTO recipes (id, data, revision, updated_at, deleted) VALUES (?, ?, ?, ?, 0)'
  );
  const run = driver.transaction((from: number, to: number) => {
    for (let i = from; i < to; i++) insert.run(idOf(i), data, i + 1, now);
  });
  for (let start = 0; start < count; start += 10_000) run(start, Math.min(count, start + 10_000));
  await db.client.releaseConnection(driver);
}

async function main(): Promise<void> {
  console.log(`[perf] corpus ${DOCS} docs · writes ${WRITES} · page ${PAGE} · polls ${POLLS}`);
  const { store, teardown } = await buildStore();
  const tSeed = Date.now();
  if (db) await seed(DOCS);
  else for (let i = 0; i < DOCS; i++) await store.put('recipes', idOf(i), DOC);
  console.log(`[perf] seed: ${Date.now() - tSeed} ms`);

  // 1. Full catch-up pagination: the critical path of the sync protocol
  const pageDurations: number[] = [];
  let cursor = 0;
  let pages = 0;
  let delivered = 0;
  const t0 = Date.now();
  for (;;) {
    const start = performance.now();
    const changes = await store.changes('recipes', cursor, PAGE);
    pageDurations.push(performance.now() - start);
    delivered += changes.items.length;
    cursor = changes.revision;
    pages += 1;
    if (!changes.more) break;
  }
  console.log(`[perf] catch-up: ${pages} pages, ${delivered} docs, ${Date.now() - t0} ms total`);
  console.log(`[perf]   page ms p50/p95/max: ${ms(pageDurations)}`);

  // 2. Write throughput: single puts through the real contract
  const writeDurations: number[] = [];
  const t1 = Date.now();
  for (let i = 0; i < WRITES; i++) {
    const start = performance.now();
    await store.put('recipes', `new_${String(i).padStart(7, '0')}`, DOC);
    writeDurations.push(performance.now() - start);
  }
  const writesMs = Date.now() - t1;
  console.log(
    `[perf] writes: ${WRITES} puts, ${writesMs} ms total, ${(WRITES / (writesMs / 1000)).toFixed(0)} writes/s`
  );
  console.log(`[perf]   put ms p50/p95/max: ${ms(writeDurations)}`);

  // 3. Change polls: one write then one poll (the backoffice poller's shape)
  const pollDurations: number[] = [];
  let pollCursor = cursor;
  for (let i = 0; i < POLLS; i++) {
    await store.put('recipes', `poll_${String(i).padStart(5, '0')}`, DOC);
    const start = performance.now();
    const changes = await store.changes('recipes', pollCursor, PAGE);
    pollDurations.push(performance.now() - start);
    pollCursor = changes.revision;
  }
  console.log(`[perf] polls: ${POLLS} (one write each)`);
  console.log(`[perf]   poll ms p50/p95/max: ${ms(pollDurations)}`);

  await teardown();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[perf] failed:', error);
    process.exit(1);
  });
