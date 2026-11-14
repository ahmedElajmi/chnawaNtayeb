import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { authRoutes } from './routes';
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
const get = async (path: string, headers: Record<string, string> = {}) => fetch(base + path, { headers });

describe('auth routes over HTTP', () => {
  let token = '';

  it('registers an account and answers a client session with the profile', async () => {
    const res = await post('/api/auth/register', {
      email: 'Amine@b.co',
      password: 'long-enough-1',
      displayName: 'Amine',
      address: { line: '12 rue des Oliviers', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.ok).toBe(true);
    expect(data.kind).toBe('client');
    expect(typeof data.token).toBe('string');
    expect(typeof data.expires_at).toBe('number');
    expect((data.user as { email?: string }).email).toBe('amine@b.co');
    token = data.token as string;
  });

  it('refuses an invalid address with a field-level 400', async () => {
    const res = await post('/api/auth/register', {
      email: 'bad@b.co',
      password: 'long-enough-1',
      address: { line: 'ab', region: 'nowhere', city: '', postalCode: '12', country: 'ZZ' },
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toBe('invalid-input');
  });

  it('serves the public, client-safe password criteria', async () => {
    const res = await get('/api/auth/password-criteria');
    expect(res.status).toBe(200);
    const { criteria } = (await res.json()) as { criteria: Record<string, unknown> };
    expect(criteria.min_length).toBe(8);
    expect(Object.keys(criteria).sort()).toEqual([
      'min_length',
      'require_digit',
      'require_special',
      'require_uppercase',
    ]);
  });

  it('logs in and tells employees apart from clients', async () => {
    const wrong = await post('/api/auth/login', { email: 'amine@b.co', password: 'wrong' });
    expect(wrong.status).toBe(401);
    const ok = await post('/api/auth/login', { email: 'amine@b.co', password: 'long-enough-1' });
    expect(ok.status).toBe(200);
    const data = (await ok.json()) as Record<string, unknown>;
    expect(data.kind).toBe('client');
    expect(data.force_change).toBe(false);
  });

  it('opens a guest session whose /me has no account', async () => {
    const res = await post('/api/auth/guest', {});
    const data = (await res.json()) as Record<string, unknown>;
    expect(String(data.uid)).toContain('guest:');
    const me = await get('/api/auth/me', { Authorization: `Bearer ${data.token}` });
    const meData = (await me.json()) as { user: unknown };
    expect(meData.user).toBeNull();
  });

  it('answers /me with the signed-in profile, null for an unknown token', async () => {
    const me = await get('/api/auth/me', { Authorization: `Bearer ${token}` });
    const data = (await me.json()) as { user: { email?: string } | null };
    expect(data.user?.email).toBe('amine@b.co');
    const forged = await get('/api/auth/me', { Authorization: 'Bearer not-a-token' });
    expect(((await forged.json()) as { user: unknown }).user).toBeNull();
  });

  it('updates the profile (address revalidated server side)', async () => {
    const ok = await put(
      '/api/auth/profile',
      { displayName: 'Amine B.', phone: '+21620123456', preferredLanguage: 'ar' },
      { Authorization: `Bearer ${token}` }
    );
    expect(((await ok.json()) as { user: { displayName?: string } }).user.displayName).toBe('Amine B.');
    const bad = await put(
      '/api/auth/profile',
      { address: { line: 'ab', region: 'nowhere', city: '', postalCode: '12', country: 'ZZ' } },
      { Authorization: `Bearer ${token}` }
    );
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error?: string }).error).toBe('invalid-input');
  });

  it('changes the password, then only the new one opens the session', async () => {
    const res = await post(
      '/api/auth/change-password',
      { current: 'long-enough-1', next: 'even-longer-2' },
      { Authorization: `Bearer ${token}` }
    );
    expect(res.status).toBe(200);
    const oldLogin = await post('/api/auth/login', { email: 'amine@b.co', password: 'long-enough-1' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await post('/api/auth/login', { email: 'amine@b.co', password: 'even-longer-2' });
    expect(newLogin.status).toBe(200);
  });

  it('keeps the sync lists of the signed-in account', async () => {
    const res = await put(
      '/api/auth/sync-lists',
      { favorites: ['r1', 'r2'], savedFridge: ['i1'] },
      { Authorization: `Bearer ${token}` }
    );
    expect(res.status).toBe(200);
    const me = await get('/api/auth/me', { Authorization: `Bearer ${token}` });
    const data = (await me.json()) as { user: { favorites?: string[]; savedFridge?: string[] } | null };
    expect(data.user?.favorites).toEqual(['r1', 'r2']);
    expect(data.user?.savedFridge).toEqual(['i1']);
  });

  it('refuses the profile and password writes without a session', async () => {
    expect((await put('/api/auth/profile', { displayName: 'X' })).status).toBe(401);
    expect((await post('/api/auth/change-password', { current: 'a', next: 'b' })).status).toBe(401);
    expect((await put('/api/auth/sync-lists', { favorites: ['r1'] })).status).toBe(401);
  });
});
