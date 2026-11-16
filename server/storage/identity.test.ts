import { describe, expect, it } from 'vitest';
import { createMemoryDataStore } from './memoryDataStore';
import { contractEmployeeRights, createIdentityResolver } from './identity';
import type { DataStore } from './types';
import { createSessionToken, type BackofficeAuthConfig } from '../backofficeAuth';
import { createUserSessionToken } from '../auth/sessions';

const CONFIG: BackofficeAuthConfig = {
  ok: true as const,
  username: 'admin',
  password: 'a-very-long-password',
  secret: 'a-secret-long-enough-for-hmac-tests',
};

/** A fake request carrying an Authorization header. */
const request = (token?: string) =>
  ({ headers: token ? { authorization: `Bearer ${token}` } : {} }) as unknown as import('express').Request;

describe('contractEmployeeRights (lot 1.3: the rights read goes through the contract)', () => {
  it('returns null when no storage is configured (same as the unconfigured Firebase read)', async () => {
    const rights = contractEmployeeRights(null);
    await expect(rights('u1')).resolves.toBeNull();
  });

  it('reads the admins record of a member over the contract', async () => {
    const store = createMemoryDataStore();
    await store.put('admins', 'u1', { can_publish: true, can_manage: false });
    await expect(contractEmployeeRights(store)('u1')).resolves.toMatchObject({
      can_publish: true,
      can_manage: false,
    });
  });

  it('returns null for an absent member, and propagates storage errors', async () => {
    const store = createMemoryDataStore();
    await expect(contractEmployeeRights(store)('absent')).resolves.toBeNull();
    const broken = {
      get: () => Promise.reject(new Error('storage down')),
    } as unknown as DataStore;
    await expect(contractEmployeeRights(broken)('u1')).rejects.toThrow('storage down');
  });
});

describe('createIdentityResolver (the three identities, unchanged outcomes)', () => {
  const rights = (uid: string) => {
    const store = createMemoryDataStore();
    return contractEmployeeRights(store)(uid);
  };

  it('a super-admin session owns everything', async () => {
    const identity = createIdentityResolver(CONFIG, rights);
    const token = createSessionToken(CONFIG.username, CONFIG.secret).token;
    await expect(identity(request(token))).resolves.toEqual({ owner: true, canPublish: true, canManage: true });
  });

  it('an employee proves themselves with their session and their team record', async () => {
    const store = createMemoryDataStore();
    await store.put('admins', 'emp1', { can_publish: true, can_manage: false });
    const identity = createIdentityResolver(CONFIG, contractEmployeeRights(store));
    const token = createUserSessionToken('employee', 'emp1', CONFIG.secret).token;
    await expect(identity(request(token))).resolves.toEqual({ owner: false, canPublish: true, canManage: false });
  });

  it('an employee whose record is absent is a visitor', async () => {
    const identity = createIdentityResolver(CONFIG, contractEmployeeRights(createMemoryDataStore()));
    const token = createUserSessionToken('employee', 'ghost', CONFIG.secret).token;
    await expect(identity(request(token))).resolves.toEqual({ owner: false, canPublish: false, canManage: false });
  });

  it('a visitor without proof is read-only', async () => {
    const identity = createIdentityResolver(CONFIG, rights);
    await expect(identity(request())).resolves.toEqual({ owner: false, canPublish: false, canManage: false });
    await expect(identity(request('not-a-session'))).resolves.toEqual({
      owner: false,
      canPublish: false,
      canManage: false,
    });
  });
});
