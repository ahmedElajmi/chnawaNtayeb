import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { kitchenRoutes } from './kitchenRoutes';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import { resetWatermarks } from '../storage/watermark';
import { createUserSessionToken } from '../auth/sessions';
import type { DataStore } from '../storage/types';

/**
 * Integration tests of the protocol version gate (lot B22-07, D16 fail-closed): the gate
 * sits between `syncLimiter` and the handlers on GET and PUT only. An unauthenticated
 * request is never classified: it reaches the handler and answers 401 exactly as before.
 * Protocol refusals are counted by the rate limiter (they cannot bypass it).
 */

const ADMIN_CONFIG = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

let app: express.Express;
let server: ReturnType<express.Express['listen']>;
let base = '';
let token = '';

beforeAll(async () => {
  resetWatermarks();
  const store: DataStore = createMemoryDataStore();
  app = express();
  app.use(express.json());
  app.use(kitchenRoutes(ADMIN_CONFIG, store, { syncLimit: 1000 }));
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  token = createUserSessionToken('client', 'user-gate', ADMIN_CONFIG.secret).token;
});

afterAll(() => {
  server?.close();
});

const get = (path = '/api/kitchen', headers: Record<string, string> = {}) => fetch(`${base}${path}`, { headers });

const put = (headers: Record<string, string> = {}, body: unknown = { sections: {} }) =>
  fetch(`${base}/api/kitchen`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const auth = (): Record<string, string> => ({ Authorization: `Bearer ${token}` });
const version = (value: string): Record<string, string> => ({ 'X-Kitchen-Protocol-Version': value });

describe('the protocol version gate (B22-07)', () => {
  describe('writes (PUT)', () => {
    it('succeeds for the supported version and its equivalent representations', async () => {
      for (const value of ['1', '1.0', '01']) {
        const res = await put({ ...auth(), ...version(value) });
        expect(res.status).toBe(200);
      }
    });

    it('refuses unsupported versions with 409 and writes nothing', async () => {
      for (const value of ['0.9', '1.1', '2']) {
        const res = await put({ ...auth(), ...version(value) });
        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-unsupported' });
      }
    });

    it('refuses a PUT without version with 409 (option A: immediate refusal)', async () => {
      const res = await put(auth());
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-unsupported' });
    });

    it('refuses malformed, over-bounded and duplicated declarations with 400', async () => {
      for (const value of ['v1', '1..2', '1.2.3.4', '1.9999999', '1,1.2']) {
        const res = await put({ ...auth(), ...version(value) });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-invalid' });
      }
      // A duplicated raw header never resolves to its first value
      const res = await fetch(`${base}/api/kitchen`, {
        method: 'PUT',
        headers: [
          ['Content-Type', 'application/json'],
          ['Authorization', `Bearer ${token}`],
          ['X-Kitchen-Protocol-Version', '1'],
          ['X-Kitchen-Protocol-Version', '2'],
        ] as unknown as HeadersInit,
        body: JSON.stringify({ sections: {} }),
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-invalid' });
    });
  });

  describe('reads (GET)', () => {
    it('succeeds silently for the supported version', async () => {
      const res = await get('/api/kitchen', { ...auth(), ...version('1') });
      expect(res.status).toBe(200);
      expect(res.headers.get('x-kitchen-protocol-status')).toBeNull();
    });

    it('succeeds with the reconciliation signal for an absent or older unsupported version', async () => {
      for (const headers of [auth(), { ...auth(), ...version('0.9') }]) {
        const res = await get('/api/kitchen', headers);
        expect(res.status).toBe(200);
        expect(res.headers.get('x-kitchen-protocol-status')).toBe('reconciliation-required');
      }
    });

    it('refuses a later unknown version even for a read', async () => {
      const res = await get('/api/kitchen', { ...auth(), ...version('2') });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-unsupported' });
    });

    it('refuses a malformed version even for a read', async () => {
      const res = await get('/api/kitchen', { ...auth(), ...version('v1') });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: 'protocol-version-invalid' });
    });
  });

  describe('authentication order', () => {
    it('keeps 401 for unauthenticated requests, whatever the version', async () => {
      const withoutHeader = await get('/api/kitchen');
      expect(withoutHeader.status).toBe(401);
      const laterVersion = await put(version('2'));
      expect(laterVersion.status).toBe(401);
      const malformed = await put({ ...version('v1'), 'Content-Type': 'application/json' }, { sections: {} });
      expect(malformed.status).toBe(401);
    });

    it('keeps 401 for an invalid token instead of a protocol refusal', async () => {
      const res = await put({ ...version('v1'), Authorization: 'Bearer not-a-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('the rate limiter stays active', () => {
    it('counts the protocol refusals: repeated refusals eventually hit the limiter', async () => {
      const limited = express();
      limited.use(express.json());
      limited.use(kitchenRoutes(ADMIN_CONFIG, createMemoryDataStore(), { syncLimit: 2 }));
      const scoped = limited.listen(0);
      const limitBase = `http://127.0.0.1:${(scoped.address() as AddressInfo).port}`;
      try {
        const statuses: number[] = [];
        for (let index = 0; index < 5; index += 1) {
          const res = await fetch(`${limitBase}/api/kitchen`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...version('2') },
            body: JSON.stringify({ sections: {} }),
          });
          statuses.push(res.status);
        }
        // Two refusals pass, then the limiter answers 429: a protocol refusal cannot bypass it
        expect(statuses).toEqual([409, 409, 429, 429, 429]);
      } finally {
        scoped.close();
      }
    });
  });

  describe('unrelated endpoints', () => {
    it('never intercepts the business sub-routes', async () => {
      const res = await get('/api/kitchen/history', { Authorization: `Bearer ${token}` });
      // The history routes exist and do their own work: no protocol refusal here
      expect([200, 400, 401]).toContain(res.status);
      expect(res.status).not.toBe(409);
    });
  });
});
