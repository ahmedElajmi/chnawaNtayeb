import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import type { AddressInfo } from 'node:net';
import knex, { type Knex } from 'knex';
import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApiApp } from './app';
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
