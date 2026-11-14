/**
 * Imports a JSON backup into the SQL tables (the migration path from Firestore, or any
 * restore): one table per collection of the registry, documents stored verbatim.
 *
 * Expected file shape (a future export produces exactly this):
 *   { "recipes": [ { "id": "r1", ...fields } ], "ingredients": [ ... ] }
 * Collections missing from the file are simply left untouched.
 *
 * Usage:
 *   npx tsx scripts/sql/import-json.ts --file backup.json \
 *     --client postgres --connection "postgresql://user:pass@host/db"
 * Clients: postgres | mysql2 | mssql | better-sqlite3 (connection = filename).
 */
import { readFileSync } from 'node:fs';
import knex, { type Knex } from 'knex';
import { COLLECTIONS } from '../../server/storage/collections';
import { createSqlStore, ensureSchema } from '../../server/storage/sqlStore';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const file = arg('file');
  const client = arg('client');
  const connection = arg('connection');
  if (!file || !client || !connection) {
    console.error('Usage: npx tsx scripts/sql/import-json.ts --file backup.json --client postgres --connection "…"\n');
    console.error('File shape: { "recipes": [ { "id": "r1", ...fields } ], … }');
    process.exit(1);
  }
  if (!(client in { postgres: 1, mysql2: 1, mssql: 1, 'better-sqlite3': 1 })) {
    console.error(`Unknown client "${client}" (postgres, mysql2, mssql, better-sqlite3).`);
    process.exit(1);
  }

  const db: Knex = knex({ client, connection });
  await ensureSchema(db);
  const store = createSqlStore(db);

  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  let total = 0;
  for (const [name, entries] of Object.entries(parsed)) {
    if (!COLLECTIONS[name] || !Array.isArray(entries)) continue;
    for (const raw of entries as Record<string, unknown>[]) {
      const id = typeof raw.id === 'string' ? raw.id : '';
      if (!id) continue;
      await store.put(name, id, raw);
      total += 1;
    }
    console.log(`  ${name}: imported`);
  }
  console.log(`Done — ${total} documents written.`);
  await db.destroy();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
