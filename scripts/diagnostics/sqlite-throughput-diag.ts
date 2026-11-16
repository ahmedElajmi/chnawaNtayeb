/**
 * Diagnostic (lot 1.4): parallel put throughput over two real SQLite connections — measures
 * each write's duration to explain contention-suite slowness, and checks the pragmas.
 */
import { createSqliteKnex, createSqlStore, ensureSchema } from '../../server/storage/sqlStore';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Knex } from 'knex';

const file = join(tmpdir(), `throughput-${process.pid}-${Date.now()}.db`);
const dbA: Knex = createSqliteKnex(file);
const dbB: Knex = createSqliteKnex(file);
await ensureSchema(dbA);

const storeA = createSqlStore(dbA);
const storeB = createSqlStore(dbB);

const DOC = {
  name_fr: 'Recette',
  is_published: true,
  category: 'plat_principal',
  steps: [],
  ingredients: [],
  prep_time_minutes: 5,
  cook_time_minutes: 10,
  base_servings: 2,
  estimated_cost_tnd: 8,
  cuisine_type: 'tunisienne',
  chef_tip: { fr: 'x' },
  description_fr: 'y',
};

const probe = await dbA.raw('PRAGMA journal_mode');
console.log('journal_mode:', JSON.stringify(probe[0]));
const sync = await dbA.raw('PRAGMA synchronous');
console.log('synchronous:', JSON.stringify(sync[0]));
const busy = await dbA.raw('PRAGMA busy_timeout');
console.log('busy_timeout:', JSON.stringify(busy[0]));
console.log('pool A:', JSON.stringify(dbA.client.config.pool ?? {}));
console.log('pool B:', JSON.stringify(dbB.client.config.pool ?? {}));

const t0 = Date.now();
const writes: Promise<unknown>[] = [];
const results: string[] = [];
for (let i = 0; i < 20; i++) {
  const store = i % 2 === 0 ? storeA : storeB;
  const start = Date.now();
  writes.push(
    store
      .put('recipes', `p${i}`, DOC)
      .then(() => results.push(`p${i}:ok:${Date.now() - start}ms`))
      .catch((e: Error) =>
        results.push(`p${i}:FAIL:${Date.now() - start}ms:${e.message.slice(0, 60).split(/\s+/).join(' ')}`)
      )
  );
}
await Promise.all(writes);
console.log('total:', Date.now() - t0, 'ms');
console.log(results.join(String.fromCharCode(10)));

await dbA.destroy();
await dbB.destroy();
rmSync(file, { force: true });
rmSync(`${file}-wal`, { force: true });
rmSync(`${file}-shm`, { force: true });
