import { describe, expect, it } from 'vitest';
import { createMemoryDataStore } from '../storage/memoryDataStore';
import {
  changePassword,
  createAccount,
  isLocked,
  saveSyncLists,
  unlockAccount,
  updateProfile,
  verifyLogin,
} from './users';
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

async function store(): Promise<DataStore> {
  resetWatermarks();
  return createMemoryDataStore();
}

describe('accounts through the storage contract', () => {
  it('registers, then logs in with the same password', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    await createAccount(
      s,
      { email: 'amine@b.co', password: 'long-enough-1', displayName: 'Amine', type: 'client' },
      COUNTRIES,
      now
    );
    const login = await verifyLogin(s, 'amine@b.co', 'long-enough-1', now);
    expect(login.profile.type).toBe('client');
    expect(login.forceChange).toBe(false);
    expect(await readProfileName(s, login.uid)).toBe('Amine');
  });

  async function readProfileName(s: DataStore, uid: string): Promise<string | undefined> {
    const profile = await s.get('users', uid);
    return (profile as Record<string, unknown> | null)?.displayName as string | undefined;
  }

  it('refuses a duplicate e-mail and a too-short password', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    await createAccount(s, { email: 'a@b.co', password: 'long-enough-1', type: 'client' }, COUNTRIES, now);
    await expect(
      createAccount(s, { email: 'a@b.co', password: 'long-enough-1', type: 'client' }, COUNTRIES, now)
    ).rejects.toMatchObject({ code: 'email-in-use' });
    await expect(
      createAccount(s, { email: 'c@b.co', password: 'short', type: 'client' }, COUNTRIES, now)
    ).rejects.toMatchObject({ code: 'weak-password' });
  });

  it('answers the same failure for an unknown e-mail and a wrong password', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    await createAccount(s, { email: 'a@b.co', password: 'long-enough-1', type: 'client' }, COUNTRIES, now);
    await expect(verifyLogin(s, 'nobody@b.co', 'long-enough-1', now)).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
    await expect(verifyLogin(s, 'a@b.co', 'wrong-password', now)).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
  });

  it('locks the account after the configured attempts and unlocks it manually', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    await createAccount(s, { email: 'a@b.co', password: 'long-enough-1', type: 'client' }, COUNTRIES, now);
    // default policy: 5 attempts
    for (let i = 0; i < 4; i++) {
      await expect(verifyLogin(s, 'a@b.co', 'wrong', now)).rejects.toMatchObject({ code: 'invalid-credentials' });
    }
    await expect(verifyLogin(s, 'a@b.co', 'wrong', now)).rejects.toMatchObject({ code: 'locked' });
    await expect(verifyLogin(s, 'a@b.co', 'long-enough-1', now)).rejects.toMatchObject({ code: 'locked' });
    const doc = await s.findFirst('users', 'email', 'a@b.co');
    const uid = ((doc ?? {}) as Record<string, unknown>).uid as string;
    expect(await isLocked(s, uid, now)).toBe(true);
    expect(await unlockAccount(s, uid, now)).toBe(true);
    await expect(verifyLogin(s, 'a@b.co', 'long-enough-1', now)).resolves.toBeTruthy();
  });

  it('auto-unlocks when the configured delay has passed', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    await createAccount(s, { email: 'a@b.co', password: 'long-enough-1', type: 'client' }, COUNTRIES, now);
    for (let i = 0; i < 5; i++) await verifyLogin(s, 'a@b.co', 'wrong', now).catch(() => undefined);
    const later = now + 31 * 60 * 1000; // default lock: 30 minutes
    await expect(verifyLogin(s, 'a@b.co', 'long-enough-1', later)).resolves.toBeTruthy();
  });

  it('changes the password only with the right current one, then logs in with the new', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    const { uid } = await createAccount(
      s,
      { email: 'a@b.co', password: 'long-enough-1', type: 'client' },
      COUNTRIES,
      now
    );
    await expect(changePassword(s, uid, 'wrong', 'another-pass-1', now)).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
    await changePassword(s, uid, 'long-enough-1', 'another-pass-1', now);
    await expect(verifyLogin(s, 'a@b.co', 'another-pass-1', now)).resolves.toBeTruthy();
    await expect(verifyLogin(s, 'a@b.co', 'long-enough-1', now)).rejects.toBeTruthy();
  });

  it('updates the profile fields and keeps the sync lists', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    const { uid } = await createAccount(
      s,
      { email: 'a@b.co', password: 'long-enough-1', type: 'client' },
      COUNTRIES,
      now
    );
    const profile = await updateProfile(
      s,
      uid,
      { displayName: 'Amine B.', phone: '+21620123456', preferredLanguage: 'ar' },
      now
    );
    expect(profile?.displayName).toBe('Amine B.');
    expect(profile?.phone).toBe('+21620123456');
    await saveSyncLists(s, uid, ['r1', 'r2'], ['i1']);
    const doc = (await s.get('users', uid)) as Record<string, unknown>;
    expect(doc.favorites).toEqual(['r1', 'r2']);
    expect(doc.savedFridge).toEqual(['i1']);
  });

  it('creates employee accounts with their own auth record', async () => {
    const s = await store();
    const now = 1_700_000_000_000;
    const { uid, profile } = await createAccount(
      s,
      { email: 'chef@b.co', password: 'temp-pass-123', displayName: 'Chef', type: 'employee' },
      COUNTRIES,
      now
    );
    expect(profile.type).toBe('employee');
    const auth = await s.get('auth', uid);
    expect(((auth ?? {}) as Record<string, unknown>).password_phc).toContain('$argon2id$');
  });
});
