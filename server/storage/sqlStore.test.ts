import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import knex, { type Knex } from 'knex';
import { afterAll, beforeAll } from 'vitest';
import { COLLECTIONS } from './collections';
import { describeDataStore } from './contract';
import { createSqlStore, ensureSchema } from './sqlStore';

/**
 * The SQL implementation proves the whole DataStore contract on a real database engine
 * (SQLite through Knex here — the same code runs on Postgres, MySQL and SQL Server, whose
 * JSON path dialects are handled by sqlStore.ts). Not wired in the app yet: Firestore
 * stays the active storage until the migration.
 */

let db: Knex;
let driver: betterSqlite3.Database;
let file = '';

beforeAll(async () => {
  // A shared FILE database: knex and the raw driver (synchronous wipe between tests) see the same data
  file = path.join(tmpdir(), `chnawa-sql-store-test-${process.pid}-${Date.now()}.db`);
  driver = betterSqlite3(file);
  db = knex({ client: 'better-sqlite3', connection: { filename: file } });
  await ensureSchema(db);
});

afterAll(async () => {
  await db.destroy();
  driver.close();
  rmSync(file, { force: true });
});

// Each contract test starts from the same engine with clean tables (the driver wipes synchronously)
describeDataStore('sqlite (knex)', () => {
  for (const spec of Object.values(COLLECTIONS)) driver.prepare(`DELETE FROM ${spec.name}`).run();
  return createSqlStore(db);
});
