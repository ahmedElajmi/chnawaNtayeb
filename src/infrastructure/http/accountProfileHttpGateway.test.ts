import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountProfileHttpGateway } from './accountProfileHttpGateway';
import { _resetUserAuthGatewayForTests } from './userAuthHttpGateway';
import { saveUserSession } from './userSession';
import type { UserProfile } from '@/core/accounts';

/** The tests run without a browser: an in-memory localStorage backs the session storage. */
function stubLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
}

const CLIENT_SESSION = { token: 'tok', uid: 'u1', kind: 'client' as const, expiresAt: Date.now() + 60_000 };

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const PROFILE: UserProfile = {
  uid: 'u1',
  type: 'client',
  email: 'amine@b.co',
  displayName: 'Amine',
  isAnonymous: false,
  lastLogin: '2026-01-01T00:00:00.000Z',
};

describe('account profile through the server', () => {
  beforeEach(() => _resetUserAuthGatewayForTests());
  afterEach(() => vi.unstubAllGlobals());

  it('reads the profile of the session owner only', async () => {
    stubLocalStorage();
    saveUserSession(CLIENT_SESSION);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { ok: true, kind: 'client', user: PROFILE }))
    );
    await expect(accountProfileHttpGateway.read('u1')).resolves.toMatchObject({ displayName: 'Amine' });
    await expect(accountProfileHttpGateway.read('someone-else')).resolves.toBeNull();
  });

  it('reads nothing without a session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', undefined);
    await expect(accountProfileHttpGateway.read('u1')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('writes the editable fields to the server and reports the outcome', async () => {
    stubLocalStorage();
    saveUserSession(CLIENT_SESSION);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        expect(init?.method).toBe('PUT');
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        expect(body.displayName).toBe('Amine B.');
        return jsonResponse(200, { ok: true });
      })
    );
    await expect(accountProfileHttpGateway.write({ ...PROFILE, displayName: 'Amine B.' })).resolves.toBe(true);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(400, { ok: false, error: 'invalid-input' }))
    );
    await expect(accountProfileHttpGateway.write(PROFILE)).resolves.toBe(false);
  });
});
