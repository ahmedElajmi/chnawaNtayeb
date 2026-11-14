import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetUserAuthGatewayForTests, userAuthHttpGateway } from './userAuthHttpGateway';

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const PROFILE = {
  uid: 'u1',
  type: 'client',
  email: 'amine@b.co',
  displayName: 'Amine',
  isAnonymous: false,
  lastLogin: '2026-01-01T00:00:00.000Z',
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

/** The tests run without localStorage: sessions live in the gateway memory only. */
describe('site sessions against the server', () => {
  beforeEach(() => {
    _resetUserAuthGatewayForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts signed out, then serves the live password criteria', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/auth/password-criteria'
          ? jsonResponse(200, { ok: true, criteria: { min_length: 10, require_digit: true } })
          : jsonResponse(404, {})
      )
    );
    const seen: unknown[] = [];
    userAuthHttpGateway.subscribe((user) => seen.push(user));
    await tick();
    expect(seen[0]).toBeNull();
    expect(await userAuthHttpGateway.passwordCriteria()).toEqual({
      minLength: 10,
      digit: true,
      uppercase: false,
      special: false,
    });
    expect(userAuthHttpGateway.minPasswordLength).toBe(10);
  });

  it('signs in from the server answer and emits the account', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/auth/login'
          ? jsonResponse(200, {
              ok: true,
              uid: 'u1',
              kind: 'client',
              token: 'tok',
              expires_at: Date.now() + 60_000,
              user: PROFILE,
            })
          : jsonResponse(200, { ok: true, criteria: {} })
      )
    );
    const seen: unknown[] = [];
    userAuthHttpGateway.subscribe((user) => seen.push(user));
    await tick();
    await userAuthHttpGateway.loginWithEmail('amine@b.co', 'pw');
    expect(seen.at(-1)).toMatchObject({ uid: 'u1', email: 'amine@b.co', isAnonymous: false, emailVerified: true });
    await userAuthHttpGateway.logout();
    expect(seen.at(-1)).toBeNull();
  });

  it('keeps guests on their device identity', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/auth/guest'
          ? jsonResponse(200, {
              ok: true,
              kind: 'guest',
              uid: 'guest:abc123',
              token: 'tok',
              expires_at: Date.now() + 60_000,
            })
          : jsonResponse(200, { ok: true, criteria: {} })
      )
    );
    const seen: unknown[] = [];
    userAuthHttpGateway.subscribe((user) => seen.push(user));
    await tick();
    await userAuthHttpGateway.loginAsGuest();
    expect(seen.at(-1)).toMatchObject({ uid: 'guest:abc123', isAnonymous: true, email: null });
  });

  it('translates the server failure codes for the interface', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(401, { ok: false, error: 'invalid-credentials' }))
    );
    let failure: unknown = null;
    await userAuthHttpGateway.loginWithEmail('amine@b.co', 'pw').catch((err) => (failure = err));
    expect(userAuthHttpGateway.errorCode(failure)).toBe('invalid-credentials');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(423, { ok: false, error: 'locked' }))
    );
    await userAuthHttpGateway.loginWithEmail('amine@b.co', 'pw').catch((err) => (failure = err));
    expect(userAuthHttpGateway.errorCode(failure)).toBe('locked');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(429, {}))
    );
    await userAuthHttpGateway.loginWithEmail('amine@b.co', 'pw').catch((err) => (failure = err));
    expect(userAuthHttpGateway.errorCode(failure)).toBe('too-many-attempts');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    await userAuthHttpGateway.loginWithEmail('amine@b.co', 'pw').catch((err) => (failure = err));
    expect(userAuthHttpGateway.errorCode(failure)).toBe('network');
  });

  it('sends the change through the server with the current password', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe('/api/auth/change-password');
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ current: 'old', next: 'new' });
        return jsonResponse(200, { ok: true });
      })
    );
    await expect(userAuthHttpGateway.changePassword('old', 'new')).resolves.toBeUndefined();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(401, { ok: false, error: 'invalid-credentials' }))
    );
    await expect(userAuthHttpGateway.changePassword('wrong', 'new')).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
  });
});
