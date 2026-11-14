import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { dataRoutes } from './dataRoutes';
import { adminDataRoutes } from './adminDataRoutes';
import { authRoutes } from '../auth/routes';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import { resetWatermarks } from '../storage/watermark';
import { createSessionToken } from '../backofficeAuth';

const ADMIN_CONFIG = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

let server: ReturnType<express.Express['listen']>;
let base = '';
let adminToken = '';

beforeAll(async () => {
  resetWatermarks();
  const store = createMemoryDataStore();
  const app = express();
  app.use(express.json());
  app.use(dataRoutes(ADMIN_CONFIG, store));
  app.use(adminDataRoutes(ADMIN_CONFIG, store));
  app.use(authRoutes(ADMIN_CONFIG, store, async () => []));
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
  adminToken = createSessionToken(ADMIN_CONFIG.username, ADMIN_CONFIG.secret).token;
});

afterAll(() => server?.close());

const get = async (path: string, headers: Record<string, string> = {}) => fetch(base + path, { headers });
const post = async (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const put = async (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
/** Read at call time: the token exists only once the server has started. */
const admin = () => ({ Authorization: `Bearer ${adminToken}` });

const RECIPE = {
  id: 'r1',
  name_fr: 'Ojja',
  name_derja: 'ojja',
  name_ar: 'أوجة',
  description_fr: 'd',
  description_derja: 'd',
  description_ar: 'd',
  prep_time_minutes: 10,
  cook_time_minutes: 20,
  base_servings: 2,
  estimated_cost_tnd: 5,
  ingredients: [{ ingredient_id: 'i1', quantity_base: 2 }],
  steps: [{ instruction_fr: 'cuire' }],
};

describe('data endpoints over HTTP', () => {
  it('polls only the collections the client follows, and the watermark makes it free', async () => {
    await put('/api/data/recipes/r1', { doc: RECIPE }, admin());
    const { verifySessionToken } = await import('../backofficeAuth');
    console.log('VERIFY', verifySessionToken(adminToken, ADMIN_CONFIG.secret));
    const first = await post('/api/data/changes', { rev: { recipes: 0 } });
    const data1 = (await first.json()) as { data: Record<string, { items: unknown[] }> };
    expect(data1.data.recipes?.items).toHaveLength(1);
    // An up-to-date client gets no entry at all (fast path)
    const recipeDelta = data1.data.recipes as { items: { revision: number }[] };
    const revision = recipeDelta.items[0].revision;
    const second = await post('/api/data/changes', { rev: { recipes: revision } });
    expect(Object.keys(((await second.json()) as { data: Record<string, unknown> }).data)).toEqual([]);
  });

  it('serves public reads to anyone and refuses the writes without a session', async () => {
    expect((await get('/api/data/recipes/r1')).status).toBe(200);
    expect((await get('/api/data/recipes/empty')).status).toBe(200);
    const anonymous = await put('/api/data/recipes/r2', { doc: RECIPE });
    expect(anonymous.status).toBe(403);
    expect((await get('/api/data/users/u1')).status).toBe(403); // server-only collection
  });

  it('refuses writing to server-only collections even with a valid session', async () => {
    const res = await put('/api/data/recipes_versions/v1', { doc: { item_id: 'r1' } }, admin());
    expect(res.status).toBe(404);
  });

  it('writes many documents in batches and replaces a whole collection', async () => {
    const batch = await post(
      '/api/data/ingredients',
      { docs: [{ id: 'i1', name_fr: 'Tomate', unit_default: 'pièce' }] },
      admin()
    );
    expect(((await batch.json()) as { written: number }).written).toBe(1);
    const replaced = await post(
      '/api/data/ingredients/replace',
      { docs: [{ id: 'i9', name_fr: 'Ail', unit_default: 'g' }] },
      admin()
    );
    const data = (await replaced.json()) as { ok: boolean; removed: number };
    expect(data.ok).toBe(true);
    expect(data.removed).toBe(1);
    const delta = await post('/api/data/changes', { rev: { ingredients: 0 } }, admin());
    const items = ((await delta.json()) as { data: Record<string, { removedIds: string[] }> }).data.ingredients;
    expect(items.removedIds).toEqual(['i1']);
  });

  it('publishes a workflow item atomically, with its work copy and version', async () => {
    const copy = {
      id: 'r1',
      kind: 'recipe',
      content: RECIPE,
      decisions: {},
      history: [],
      updated_by: 'chef',
      updated_at: 1,
      written_at: 10,
    };
    const saved = await post('/admin/api/workspace/save', { kind: 'recipe', copy, expected: null }, admin());
    expect(((await saved.json()) as { ok: boolean }).ok).toBe(true);
    // A save started from an older copy is refused (two editors never overwrite each other)
    const stale = await post('/admin/api/workspace/save', { kind: 'recipe', copy, expected: null }, admin());
    expect(((await stale.json()) as { conflict?: boolean }).conflict).toBe(true);
    const version = {
      id: 'r1-v1',
      item_id: 'r1',
      kind: 'recipe',
      content: RECIPE,
      published_at: 1,
      published_by: 'chef',
    };
    const published = await post(
      '/admin/api/workspace/publish',
      { kind: 'recipe', item: RECIPE, copy: { ...copy, written_at: 11 }, version, expected: 10 },
      admin()
    );
    expect(((await published.json()) as { ok: boolean }).ok).toBe(true);
    const versions = await get('/api/data/recipes_versions/where?field=item_id&value=r1', admin());
    expect(((await versions.json()) as { items: unknown[] }).items).toHaveLength(1);
    // A stale publish (wrong written_at) writes nothing at all
    const stalePublish = await post(
      '/admin/api/workspace/publish',
      { kind: 'recipe', item: RECIPE, copy: { ...copy, written_at: 99 }, version, expected: 10 },
      admin()
    );
    expect(((await stalePublish.json()) as { conflict?: boolean }).conflict).toBe(true);
  });

  it('publishes settings with a version guard and lists the history', async () => {
    const config = { version: 1, weights: {} };
    const published = await post(
      '/admin/api/settings/publish',
      { doc: 'matching', config, note: 'first', expected_version: null },
      admin()
    );
    expect(((await published.json()) as { version: number }).version).toBe(1);
    const conflict = await post(
      '/admin/api/settings/publish',
      { doc: 'matching', config, note: 'again', expected_version: null },
      admin()
    );
    expect(((await conflict.json()) as { conflict?: boolean }).conflict).toBe(true);
    const active = await get('/api/settings/matching');
    expect(((await active.json()) as { doc: { version: number } }).doc.version).toBe(1);
    const review = await get('/api/settings/review'); // anonymous: refused
    expect(review.status).toBe(403);
  });

  it('answers the themes read with the published subset to visitors', async () => {
    await put('/api/data/themes/dark', { doc: { id: 'dark', is_published: true } }, admin());
    await put('/api/data/themes/draft', { doc: { id: 'draft', is_published: false } }, admin());
    const publicRead = await get('/api/themes');
    const items = ((await publicRead.json()) as { items: { id: string }[] }).items;
    expect(items.map((t) => t.id)).toEqual(['dark']);
    const adminRead = await get('/api/themes', admin());
    expect(((await adminRead.json()) as { items: { id: string }[] }).items).toHaveLength(2);
  });

  it('pages the accounts directory for managers only', async () => {
    await post('/api/auth/register', { email: 'amine@b.co', password: 'long-enough-1' });
    await post('/api/auth/register', { email: 'sami@b.co', password: 'long-enough-1' });
    const page = await get('/admin/api/accounts?type=all&limit=1', admin());
    const data = (await page.json()) as { items: unknown[]; total: number; nextCursor: string | null };
    expect(data.total).toBe(2);
    expect(data.items).toHaveLength(1);
    expect(data.nextCursor).toBeTruthy();
    const search = await get('/admin/api/accounts?search=sami', admin());
    expect(((await search.json()) as { total: number }).total).toBe(1);
    expect((await get('/admin/api/accounts')).status).toBe(403);
    const lookup = await get('/admin/api/accounts/lookup?email=amine@b.co', admin());
    expect(((await lookup.json()) as { account: { uid: string } | null }).account).toBeTruthy();
  });
});
