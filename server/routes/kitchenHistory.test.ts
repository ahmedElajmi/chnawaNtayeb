import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { kitchenRoutes } from './kitchenRoutes';
import { authRoutes } from '../auth/routes';
import { dataRoutes } from './dataRoutes';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import { resetWatermarks } from '../storage/watermark';
import type { DataStore } from '../storage/types';

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

let app: express.Express;
let server: ReturnType<express.Express['listen']>;
let base = '';

beforeAll(async () => {
  resetWatermarks();
  const store: DataStore = createMemoryDataStore();
  app = express();
  app.use(express.json());
  app.use(authRoutes(ADMIN_CONFIG, store, async () => COUNTRIES));
  // The eviction test posts more entries than the production limiter allows in a minute:
  // the ceiling is lifted here so the route logic alone is under test.
  app.use(kitchenRoutes(ADMIN_CONFIG, store, { syncLimit: 1000 }));
  app.use(dataRoutes(ADMIN_CONFIG, store));
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

const get = async (path: string, headers: Record<string, string> = {}) => fetch(base + path, { headers });

const post = async (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const del = async (path: string, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'DELETE', headers });

const put = async (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const section = (value: unknown, updated_at: number = 1000) => ({ value, updated_at });

const entry = (id: string, archived_at: string, extra: Record<string, unknown> = {}) => ({
  id,
  archived_at,
  items: [{ id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce' }],
  comment: 'marché de la médina',
  planned_cost_min: 10,
  planned_cost_max: 20,
  spent_tnd: 15.5,
  ...extra,
});

const postEntry = async (token: string, e: unknown) => post('/api/kitchen/history', { entry: e }, auth(token));

describe('kitchen history routes over HTTP', () => {
  let token = '';
  let token2 = '';
  let guestToken = '';

  it('creates two clients and a guest session to test with', async () => {
    const register = async (email: string, name: string) => {
      const res = await fetch(base + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'long-enough-1',
          displayName: name,
          address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
        }),
      });
      return ((await res.json()) as { token?: string }).token ?? '';
    };
    token = await register('Amine@b.co', 'Amine');
    token2 = await register('Salma@b.co', 'Salma');
    const guest = await fetch(base + '/api/auth/guest', { method: 'POST' });
    guestToken = ((await guest.json()) as { token?: string }).token ?? '';
    expect(token).not.toBe('');
    expect(token2).not.toBe('');
    expect(guestToken).not.toBe('');
  });

  it('refuses anonymous callers and guests on every history endpoint', async () => {
    const body = { entry: entry('run-0', '2026-01-01T10:00:00Z') };
    expect((await post('/api/kitchen/history', body)).status).toBe(401);
    expect((await post('/api/kitchen/history', body, auth(guestToken))).status).toBe(401);
    expect((await post('/api/kitchen/history', body, { Authorization: 'Bearer nope' })).status).toBe(401);
    expect((await get('/api/kitchen/history')).status).toBe(401);
    expect((await get('/api/kitchen/history', auth(guestToken))).status).toBe(401);
    expect((await del('/api/kitchen/history/run-0', auth(guestToken))).status).toBe(401);
  });

  it('stores an entry and reads it back without the wrapper fields', async () => {
    const res = await postEntry(token, entry('run-1', '2026-01-02T10:00:00Z'));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);

    const read = await get('/api/kitchen/history', auth(token));
    expect(read.status).toBe(200);
    const data = (await read.json()) as { ok: boolean; entries: Array<Record<string, unknown>> };
    expect(data.ok).toBe(true);
    expect(data.entries).toHaveLength(1);
    const stored = data.entries[0] as Record<string, unknown>;
    expect(stored.id).toBe('run-1');
    expect(stored.archived_at).toBe('2026-01-02T10:00:00Z');
    expect(stored.comment).toBe('marché de la médina');
    expect(stored.spent_tnd).toBe(15.5);
    expect(Array.isArray(stored.items)).toBe(true);
    expect(stored.uid).toBeUndefined();
    expect(stored.entry_id).toBeUndefined();
    expect(stored.revision).toBeUndefined();
  });

  it('returns the entries newest first', async () => {
    await postEntry(token, entry('run-2', '2026-01-01T10:00:00Z'));
    await postEntry(token, entry('run-3', '2026-02-01T10:00:00Z'));
    const read = await get('/api/kitchen/history', auth(token));
    const data = (await read.json()) as { entries: Array<{ id: string }> };
    expect(data.entries.map((e) => e.id)).toEqual(['run-3', 'run-1', 'run-2']);
  });

  it('deletes only the entries of its own account', async () => {
    // Another account archived an entry under the same entry id: storage ids differ per uid.
    const own = await postEntry(token2, entry('run-1', '2026-03-01T10:00:00Z'));
    expect(own.status).toBe(200);
    const remove = await del('/api/kitchen/history/run-1', auth(token2));
    expect(remove.status).toBe(200);
    expect(((await remove.json()) as { ok: boolean }).ok).toBe(true);

    // The first account's entry with the same id survived, and the other account cannot
    // delete it either.
    const stillThere = await get('/api/kitchen/history', auth(token));
    const data = (await stillThere.json()) as { entries: Array<{ id: string }> };
    expect(data.entries.map((e) => e.id)).toContain('run-1');
    expect((await del('/api/kitchen/history/run-1', auth(token2))).status).toBe(404);
    expect((await del('/api/kitchen/history/run-2', auth(token2))).status).toBe(404);
    expect((await del('/api/kitchen/history/never-existed', auth(token))).status).toBe(404);

    // A real owner deletes its own entry.
    expect((await del('/api/kitchen/history/run-2', auth(token))).status).toBe(200);
    const after = await get('/api/kitchen/history', auth(token));
    const afterData = (await after.json()) as { entries: Array<{ id: string }> };
    expect(afterData.entries.map((e) => e.id)).toEqual(['run-3', 'run-1']);
  });

  it('evicts the oldest entry when the 51st one is stored', async () => {
    for (let i = 0; i < 51; i++) {
      const res = await postEntry(token, entry(`ev-${i}`, `2026-04-01T10:${String(i).padStart(2, '0')}:00Z`));
      expect(res.status).toBe(200);
    }
    const read = await get('/api/kitchen/history', auth(token));
    const data = (await read.json()) as { entries: Array<{ id: string }> };
    expect(data.entries).toHaveLength(50);
    const ids = data.entries.map((e) => e.id);
    expect(ids).not.toContain('ev-0');
    expect(ids).toContain('ev-50');
    // The evicted entry is gone for good: deleting it answers 404.
    expect((await del('/api/kitchen/history/ev-0', auth(token))).status).toBe(404);
  });

  it('refuses malformed entries with 400 without storing anything', async () => {
    const bad = async (e: unknown) => (await postEntry(token, e)).status;
    expect((await post('/api/kitchen/history', {}, auth(token))).status).toBe(400);
    expect(await bad({ archived_at: '2026-01-01T10:00:00Z', items: [] })).toBe(400); // no id
    expect(await bad(entry('x'.repeat(101), '2026-01-01T10:00:00Z'))).toBe(400); // id too long
    expect(await bad(entry('run-bad', 'yesterday'))).toBe(400); // not ISO-like
    expect(await bad(entry('run-bad', '2026-13-45T99:99:00Z'))).toBe(400); // shape only, no real date
    expect(await bad({ id: 'run-bad', archived_at: '2026-01-01T10:00:00Z' })).toBe(400); // no items
    expect(
      await bad(entry('run-bad', '2026-01-01T10:00:00Z', { items: Array.from({ length: 501 }, () => ({})) }))
    ).toBe(400);
    expect(await bad(entry('run-bad', '2026-01-01T10:00:00Z', { items: ['not-an-object'] }))).toBe(400);
    expect(await bad(entry('run-bad', '2026-01-01T10:00:00Z', { comment: 'c'.repeat(301) }))).toBe(400);
    expect(await bad(entry('run-bad', '2026-01-01T10:00:00Z', { spent_tnd: -1 }))).toBe(400);
    expect(await bad(entry('run-bad', '2026-01-01T10:00:00Z', { planned_cost_min: 'ten' }))).toBe(400);
    expect(await bad(entry('run-bad', '2026-01-01T10:00:00Z', { planned_cost_max: Number.NaN }))).toBe(400);
    // Nothing of the refused batch was written: the newest entry is still ev-50.
    const read = await get('/api/kitchen/history', auth(token));
    const data = (await read.json()) as { entries: Array<{ id: string }> };
    expect(data.entries[0]?.id).toBe('ev-50');
    expect(data.entries).toHaveLength(50);
  });

  it('accepts the groceryMeta section and refuses malformed ones', async () => {
    const ok = await put(
      '/api/kitchen',
      { sections: { groceryMeta: section({ note: 'payer en espèces', spent_tnd: 42.5 }) } },
      auth(token)
    );
    expect(ok.status).toBe(200);
    const okData = (await ok.json()) as { doc: { sections: Record<string, { value: unknown }> } };
    expect(okData.doc.sections.groceryMeta?.value).toEqual({ note: 'payer en espèces', spent_tnd: 42.5 });

    const read = await get('/api/kitchen', auth(token));
    const readData = (await read.json()) as { doc: { sections: Record<string, { value: unknown } | undefined> } };
    expect(readData.doc.sections.groceryMeta?.value).toEqual({ note: 'payer en espèces', spent_tnd: 42.5 });

    const longNote = await put(
      '/api/kitchen',
      { sections: { groceryMeta: section({ note: 'n'.repeat(301) }) } },
      auth(token)
    );
    expect(longNote.status).toBe(400);
    const badSpent = await put(
      '/api/kitchen',
      { sections: { groceryMeta: section({ spent_tnd: '12' }) } },
      auth(token)
    );
    expect(badSpent.status).toBe(400);
    // Explicit null is a legal value (nothing spent yet).
    const nullSpent = await put(
      '/api/kitchen',
      { sections: { groceryMeta: section({ spent_tnd: null }) } },
      auth(token)
    );
    expect(nullSpent.status).toBe(200);
    const array = await put('/api/kitchen', { sections: { groceryMeta: section([{ note: 'x' }]) } }, auth(token));
    expect(array.status).toBe(400);
    const badStamp = await put(
      '/api/kitchen',
      { sections: { groceryMeta: { value: { note: 'x' }, updated_at: 'now' } } },
      auth(token)
    );
    expect(badStamp.status).toBe(400);
    // Unknown section names are still refused.
    const unknown = await put('/api/kitchen', { sections: { secrets: section(['x']) } }, auth(token));
    expect(unknown.status).toBe(400);
  });

  it('keeps kitchen_history out of the public data endpoints', async () => {
    const res = await get('/api/data/kitchen_history/empty', auth(token));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error?: string }).error).toBe('unknown_collection');
  });
});
