// Diagnostic: two better-sqlite3 connections on one WAL file — how does a contended write behave?
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'diag-'));
const file = join(dir, 't.db');
const a = new Database(file);
const b = new Database(file);
for (const c of [a, b]) {
  c.pragma('journal_mode = WAL');
  c.pragma('busy_timeout = 5000');
}
a.exec('CREATE TABLE t (id text primary key, v integer)');
const t0 = Date.now();
a.exec('BEGIN');
a.prepare('INSERT INTO t VALUES (1, 1)').run();
// b tries a write while a holds the write lock
try {
  b.exec('BEGIN');
  b.prepare('INSERT INTO t VALUES (2, 2)').run();
  console.log('b wrote immediately?!', Date.now() - t0, 'ms');
  b.exec('COMMIT');
} catch (e) {
  console.log('b failed after', Date.now() - t0, 'ms:', (e as Error).message);
}
a.exec('COMMIT');
// Now: deferred transaction that READ first, then upgrades (the guard/CAS shape)
const t1 = Date.now();
a.exec('BEGIN');
a.prepare('SELECT COUNT(*) FROM t').get();
b.exec('BEGIN');
b.prepare('INSERT INTO t VALUES (3, 3)').run();
try {
  a.prepare('INSERT INTO t VALUES (4, 4)').run();
  console.log('a upgraded after', Date.now() - t1, 'ms');
  a.exec('COMMIT');
} catch (e) {
  console.log('a upgrade failed after', Date.now() - t1, 'ms:', (e as Error).message);
  try {
    a.exec('ROLLBACK');
  } catch {
    /* already rolled back */
  }
}
try {
  b.exec('COMMIT');
} catch {
  b.exec('ROLLBACK');
}
console.log('journal mode:', a.pragma('journal_mode', { simple: true }));
console.log('busy_timeout:', a.pragma('busy_timeout', { simple: true }));
a.close();
b.close();
rmSync(dir, { recursive: true, force: true });
