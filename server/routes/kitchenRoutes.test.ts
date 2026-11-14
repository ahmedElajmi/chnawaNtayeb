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

const put = async (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const section = (value: unknown, updated_at: number | string = 1000) => ({ value, updated_at });

const item = { id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce' };

describe('kitchen routes over HTTP', () => {
  let token = '';
  let guestToken = '';

  it('creates a client and a guest session to test with', async () => {
    const register = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'Amine@b.co',
        password: 'long-enough-1',
        displayName: 'Amine',
        address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
      }),
    });
    const data = (await register.json()) as { token?: string };
    token = data.token ?? '';
    expect(token).not.toBe('');
    const guest = await fetch(base + '/api/auth/guest', { method: 'POST' });
    guestToken = ((await guest.json()) as { token?: string }).token ?? '';
    expect(guestToken).not.toBe('');
  });

  it('refuses the kitchen of an anonymous caller and of a guest', async () => {
    expect((await get('/api/kitchen')).status).toBe(401);
    expect((await get('/api/kitchen', { Authorization: 'Bearer nope' })).status).toBe(401);
    expect((await get('/api/kitchen', { Authorization: `Bearer ${guestToken}` })).status).toBe(401);
    const guestPut = await put(
      '/api/kitchen',
      { sections: { favorites: section(['r1']) } },
      { Authorization: `Bearer ${guestToken}` }
    );
    expect(guestPut.status).toBe(401);
  });

  it('answers an empty document for a new account', async () => {
    const res = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; doc: unknown };
    expect(data.ok).toBe(true);
    expect(data.doc).toBeNull();
  });

  it('stores sections and reads them back', async () => {
    const res = await put(
      '/api/kitchen',
      {
        sections: {
          favorites: section(['r1', 'r2']),
          fridge: section(['ing1']),
          groceryList: section([{ id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce' }]),
        },
      },
      { Authorization: `Bearer ${token}` }
    );
    expect(res.status).toBe(200);
    const putData = (await res.json()) as { ok: boolean; doc: { sections: Record<string, unknown> } };
    expect(putData.ok).toBe(true);
    expect(putData.doc.sections.favorites).toEqual({ value: ['r1', 'r2'], updated_at: 1000 });

    const read = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    const readData = (await read.json()) as {
      doc: { sections: Record<string, { value: unknown; updated_at: number } | undefined> };
    };
    expect(readData.doc.sections.favorites).toEqual({ value: ['r1', 'r2'], updated_at: 1000 });
    expect(readData.doc.sections.groceryList?.value).toHaveLength(1);
  });

  it('keeps the stored section when the pushed one is older (newest write wins)', async () => {
    const res = await put(
      '/api/kitchen',
      { sections: { favorites: section(['r3'], 500) } },
      { Authorization: `Bearer ${token}` }
    );
    const data = (await res.json()) as {
      doc: { sections: Record<string, { value: string[]; updated_at: number } | undefined> };
    };
    expect(data.doc.sections.favorites?.value).toEqual(['r1', 'r2']);
    expect(data.doc.sections.favorites?.updated_at).toBe(1000);
  });

  it('replaces a section when the pushed one is newer', async () => {
    const res = await put(
      '/api/kitchen',
      { sections: { weeklyPlan: section([{ day_id: 'mon' }], 5000) } },
      { Authorization: `Bearer ${token}` }
    );
    const data = (await res.json()) as { doc: { sections: Record<string, { updated_at: number } | undefined> } };
    expect(data.doc.sections.weeklyPlan?.updated_at).toBe(5000);
  });

  it('refuses a malformed or oversized section without writing anything', async () => {
    const badName = await put(
      '/api/kitchen',
      { sections: { passwords: section(['x']) } },
      { Authorization: `Bearer ${token}` }
    );
    expect(badName.status).toBe(400);
    const badStamp = await put(
      '/api/kitchen',
      { sections: { favorites: section(['x'], 'yesterday') } },
      { Authorization: `Bearer ${token}` }
    );
    expect(badStamp.status).toBe(400);
    const tooMany = await put(
      '/api/kitchen',
      { sections: { favorites: section(Array.from({ length: 301 }, () => 'r')) } },
      { Authorization: `Bearer ${token}` }
    );
    expect(tooMany.status).toBe(400);
    const badValue = await put(
      '/api/kitchen',
      { sections: { favorites: section([42]) } },
      { Authorization: `Bearer ${token}` }
    );
    expect(badValue.status).toBe(400);
    // Nothing was written by the refused calls
    const read = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    const data = (await read.json()) as { doc: { sections: Record<string, unknown> } };
    expect(Object.keys(data.doc.sections).sort()).toEqual(['favorites', 'fridge', 'groceryList', 'weeklyPlan']);
  });

  it('keeps the kitchen out of the public data endpoints', async () => {
    const res = await get('/api/data/kitchen/empty', { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error?: string }).error).toBe('unknown_collection');
  });

  it('stores the named grocery lists and reads them back', async () => {
    const lists = [
      { id: 'l1', name: 'Weekend', items: [{ id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce' }], note: '' },
      { id: 'l2', name: 'Ramadan', items: [], note: 'chez Carrefour', spent_tnd: 25.5 },
    ];
    const res = await put(
      '/api/kitchen',
      { sections: { groceryLists: section({ lists, activeId: 'l2' }, 3000) } },
      { Authorization: `Bearer ${token}` }
    );
    expect(res.status).toBe(200);
    const read = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    const data = (await read.json()) as { doc: { sections: Record<string, { value: unknown; updated_at: number }> } };
    expect(data.doc.sections.groceryLists).toEqual({ value: { lists, activeId: 'l2' }, updated_at: 3000 });
  });

  it('refuses a malformed groceryLists section without writing anything', async () => {
    const cases: unknown[] = [
      { lists: [], activeId: '' }, // no list at all
      Array.from({ length: 21 }, (_, i) => ({ id: `l${i}`, name: `L${i}`, items: [] })), // too many lists
      { lists: [{ id: 'l1', name: '', items: [] }], activeId: 'l1' }, // empty name
      { lists: [{ id: 'l1', name: 'x'.repeat(81), items: [] }], activeId: 'l1' }, // name too long
      { lists: [{ id: 'l1', name: 'L1', items: Array.from({ length: 501 }, () => item) }], activeId: 'l1' }, // too many items
      { lists: [{ id: 'l1', name: 'L1', items: [], note: 'x'.repeat(301) }], activeId: 'l1' }, // note too long
      { lists: [{ id: 'l1', name: 'L1', items: [], spent_tnd: '10' }], activeId: 'l1' }, // spend not a number
      { lists: [{ id: 'l1', name: 'L1', items: [] }], activeId: 'nope' }, // active id unknown
      { lists: [{ id: 'l1', name: 'L1', items: 'not-a-list' }], activeId: 'l1' }, // broken items
      { lists: 'not-a-list', activeId: 'l1' }, // broken lists
    ];
    for (const value of cases) {
      const res = await put(
        '/api/kitchen',
        { sections: { groceryLists: section(value, 4000) } },
        { Authorization: `Bearer ${token}` }
      );
      expect(res.status).toBe(400);
    }
    const read = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    const data = (await read.json()) as { doc: { sections: Record<string, { value: unknown }> } };
    // Nothing malformed was written; the valid section from the previous test is intact
    expect(data.doc.sections.groceryLists?.value).toMatchObject({ activeId: 'l2' });
  });

  it('still accepts the legacy groceryList and groceryMeta sections on PUT', async () => {
    const res = await put(
      '/api/kitchen',
      {
        sections: {
          groceryList: section([item], 5000),
          groceryMeta: section({ note: 'old note', spent_tnd: 10 }, 5000),
        },
      },
      { Authorization: `Bearer ${token}` }
    );
    expect(res.status).toBe(200);
    const read = await get('/api/kitchen', { Authorization: `Bearer ${token}` });
    const data = (await read.json()) as { doc: { sections: Record<string, { value: unknown }> } };
    expect(data.doc.sections.groceryList?.value).toEqual([item]);
    expect(data.doc.sections.groceryMeta?.value).toEqual({ note: 'old note', spent_tnd: 10 });
    // The named lists are unaffected: the legacy sections are stored as-is, never merged
    expect(data.doc.sections.groceryLists?.value).toMatchObject({ activeId: 'l2' });
  });

  it('refuses a legacy groceryList over the item cap and a groceryMeta with a bad spend', async () => {
    const tooMany = await put(
      '/api/kitchen',
      {
        sections: {
          groceryList: section(
            Array.from({ length: 501 }, () => item),
            6000
          ),
        },
      },
      { Authorization: `Bearer ${token}` }
    );
    expect(tooMany.status).toBe(400);
    const badSpend = await put(
      '/api/kitchen',
      { sections: { groceryMeta: section({ spent_tnd: 'x' }, 6000) } },
      { Authorization: `Bearer ${token}` }
    );
    expect(badSpend.status).toBe(400);
  });
});
