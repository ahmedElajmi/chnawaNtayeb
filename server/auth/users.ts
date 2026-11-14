import {
  normalizePhone,
  resolveUserProfile,
  validateAddress,
  type CountryRecord,
  type UserProfile,
} from '../../src/core/accounts';
import type { DataStore } from '../storage/types';
import { preferredHasher, verifyPassword, needsUpgrade } from './hashers';
import { getPolicy, passwordMeetsCriteria } from './policy';

/**
 * Accounts through the storage contract: the profile lives in users/{uid} (never a secret),
 * the password hash lives in auth/{uid} (server-only collection, never served to clients).
 * Everything here is DB-agnostic: Firestore today, any SQL engine tomorrow.
 */

const USERS = 'users';
const AUTH = 'auth';

export interface AuthRecord {
  password_phc: string;
  failed_attempts: number;
  locked_until: number | null;
  updated_at: string;
}

export interface AccountWithProfile {
  profile: UserProfile;
  auth: AuthRecord | null;
}

/** The account behind an e-mail, null when none. */
export async function findAccountByEmail(store: DataStore, email: string): Promise<AccountWithProfile | null> {
  const clean = email.trim().toLowerCase();
  if (!clean) return null;
  const raw = await store.findFirst(USERS, 'email', clean);
  if (!raw) return null;
  const profile = resolveUserProfile(raw);
  if (!profile) return null;
  const auth = await readAuth(store, profile.uid);
  return { profile, auth };
}

export async function readProfile(store: DataStore, uid: string): Promise<UserProfile | null> {
  const raw = await store.get(USERS, uid);
  return raw ? resolveUserProfile(raw) : null;
}

async function readAuth(store: DataStore, uid: string): Promise<AuthRecord | null> {
  const raw = await store.get(AUTH, uid);
  if (!raw) return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.password_phc !== 'string') return null;
  return {
    password_phc: d.password_phc,
    failed_attempts: typeof d.failed_attempts === 'number' ? d.failed_attempts : 0,
    locked_until: typeof d.locked_until === 'number' ? d.locked_until : null,
    updated_at: typeof d.updated_at === 'string' ? d.updated_at : '',
  };
}

async function writeAuth(store: DataStore, uid: string, auth: AuthRecord, now: number): Promise<void> {
  await store.put(AUTH, uid, { ...auth, id: uid, updated_at: new Date(now).toISOString() });
}

export class AuthError extends Error {
  constructor(
    public code: 'email-in-use' | 'invalid-credentials' | 'weak-password' | 'invalid-input' | 'locked' | 'unknown'
  ) {
    super(code);
  }
}

/** Creates an account (registration or an employee invited by the super admin). */
export async function createAccount(
  store: DataStore,
  input: {
    email: string;
    password: string;
    displayName?: string;
    phone?: string;
    address?: UserProfile['address'];
    preferredLanguage?: string;
    type: 'client' | 'employee';
    uid?: string;
  },
  countries: readonly CountryRecord[],
  now: number
): Promise<{ uid: string; profile: UserProfile }> {
  const email = input.email.trim().toLowerCase();
  const existing = await store.findFirst(USERS, 'email', email);
  if (existing) throw new AuthError('email-in-use');
  const policy = await getPolicy(store);
  if (!passwordMeetsCriteria(input.password, policy)) throw new AuthError('weak-password');
  if (input.address && validateAddress(input.address, countries).length) throw new AuthError('invalid-input');
  const uid = input.uid ?? `u-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const profile: UserProfile = {
    uid,
    type: input.type,
    email,
    displayName: input.displayName?.trim() || email.split('@')[0].slice(0, 60),
    isAnonymous: false,
    lastLogin: new Date(now).toISOString(),
  };
  // Guests keep their data local; a registered profile is written complete, without favorites.
  const document: Record<string, unknown> = {
    uid: profile.uid,
    type: profile.type,
    email: profile.email,
    displayName: profile.displayName,
    isAnonymous: false,
    lastLogin: profile.lastLogin,
  };
  await store.put(USERS, uid, document);
  const phc = await preferredHasher(policy.algorithm).hash(input.password, policy.params);
  await writeAuth(
    store,
    uid,
    { password_phc: phc, failed_attempts: 0, locked_until: null, updated_at: new Date(now).toISOString() },
    now
  );
  void countries; // address fields arrive later, validated with the enabled countries
  return { uid, profile };
}

/** Full login: lockout check, dispatch verification, lazy re-hash, counter reset. */
export async function verifyLogin(
  store: DataStore,
  email: string,
  password: string,
  now: number
): Promise<{ uid: string; profile: UserProfile; forceChange: boolean }> {
  const account = await findAccountByEmail(store, email);
  // Same failure shape either way: an attacker never learns whether the e-mail exists
  if (!account || !account.auth) throw new AuthError('invalid-credentials');
  const policy = await getPolicy(store);
  const auth = account.auth;
  if (auth.locked_until && auth.locked_until > now && policy.lockout.auto_unlock) {
    throw new AuthError('locked');
  }
  const ok = await verifyPassword(auth.password_phc, password);
  if (!ok) {
    const failed = auth.failed_attempts + 1;
    const locked = failed >= policy.lockout.max_attempts;
    await writeAuth(
      store,
      account.profile.uid,
      {
        ...auth,
        failed_attempts: locked ? 0 : failed,
        // A locked account either auto-unlocks after the delay or waits for the super admin
        locked_until: locked && policy.lockout.auto_unlock ? now + policy.lockout.lock_minutes * 60 * 1000 : null,
      },
      now
    );
    if (locked) throw new AuthError('locked');
    throw new AuthError('invalid-credentials');
  }
  // Lazy migration: an old-algorithm hash is re-hashed with the configured one
  const forceChange = policy.migration === 'force_change' && needsUpgrade(auth.password_phc, policy.algorithm);
  if (needsUpgrade(auth.password_phc, policy.algorithm) && policy.migration === 'auto') {
    await writeAuth(
      store,
      account.profile.uid,
      {
        password_phc: await preferredHasher(policy.algorithm).hash(password, policy.params),
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date(now).toISOString(),
      },
      now
    );
  } else {
    await writeAuth(store, account.profile.uid, { ...auth, failed_attempts: 0, locked_until: null }, now);
  }
  return { uid: account.profile.uid, profile: account.profile, forceChange };
}

/** Changes the password: the current one is re-verified first. */
export async function changePassword(
  store: DataStore,
  uid: string,
  currentPassword: string,
  newPassword: string,
  now: number
): Promise<void> {
  const auth = await readAuth(store, uid);
  if (!auth) throw new AuthError('invalid-credentials');
  const policy = await getPolicy(store);
  if (!(await verifyPassword(auth.password_phc, currentPassword))) throw new AuthError('invalid-credentials');
  if (!passwordMeetsCriteria(newPassword, policy)) throw new AuthError('weak-password');
  await writeAuth(
    store,
    uid,
    {
      password_phc: await preferredHasher(policy.algorithm).hash(newPassword, policy.params),
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date(now).toISOString(),
    },
    now
  );
}

/** Unlocks an account manually (backoffice action on the client row). */
export async function unlockAccount(store: DataStore, uid: string, now: number): Promise<boolean> {
  const auth = await readAuth(store, uid);
  if (!auth) return false;
  await writeAuth(store, uid, { ...auth, failed_attempts: 0, locked_until: null }, now);
  return true;
}

/** Whether the account is currently locked (for the backoffice row). */
export async function isLocked(store: DataStore, uid: string, now: number): Promise<boolean> {
  const auth = await readAuth(store, uid);
  return !!auth?.locked_until && auth.locked_until > now;
}

/** Profile update coming from the client: normalized and revalidated server side. */
export async function updateProfile(
  store: DataStore,
  uid: string,
  patch: { displayName?: string; phone?: string; preferredLanguage?: string },
  now: number
): Promise<UserProfile | null> {
  const current = await readProfile(store, uid);
  if (!current) return null;
  const normalized: UserProfile = { ...current };
  if (patch.displayName !== undefined) normalized.displayName = patch.displayName.trim().slice(0, 60) || undefined;
  if (patch.phone !== undefined)
    normalized.phone = patch.phone.trim() ? (normalizePhone(patch.phone.trim()) ?? undefined) : undefined;
  if (patch.preferredLanguage !== undefined) normalized.preferredLanguage = patch.preferredLanguage || undefined;
  normalized.lastLogin = new Date(now).toISOString();
  const document: Record<string, unknown> = {
    uid: normalized.uid,
    type: normalized.type,
    email: normalized.email,
    displayName: normalized.displayName,
    phone: normalized.phone,
    address: normalized.address,
    preferredLanguage: normalized.preferredLanguage,
    isAnonymous: normalized.isAnonymous,
    favorites: normalized.favorites,
    savedFridge: normalized.savedFridge,
    lastLogin: normalized.lastLogin,
  };
  await store.put(USERS, uid, document);
  return normalized;
}

/** Keeps the sync lists of a signed-in account (favorites and the saved fridge). */
export async function saveSyncLists(
  store: DataStore,
  uid: string,
  favorites: string[] | undefined,
  savedFridge: string[] | undefined
): Promise<boolean> {
  const current = await readProfile(store, uid);
  if (!current) return false;
  const normalized: UserProfile = { ...current };
  if (favorites) normalized.favorites = favorites.filter((v) => typeof v === 'string').slice(0, 300);
  if (savedFridge) normalized.savedFridge = savedFridge.filter((v) => typeof v === 'string').slice(0, 300);
  const document: Record<string, unknown> = {
    uid: normalized.uid,
    type: normalized.type,
    email: normalized.email,
    displayName: normalized.displayName,
    phone: normalized.phone,
    address: normalized.address,
    preferredLanguage: normalized.preferredLanguage,
    isAnonymous: normalized.isAnonymous,
    favorites: normalized.favorites,
    savedFridge: normalized.savedFridge,
    lastLogin: normalized.lastLogin,
  };
  await store.put(USERS, uid, document);
  return true;
}
