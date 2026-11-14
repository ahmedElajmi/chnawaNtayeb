import type { DataStore } from '../storage/types';

/**
 * Password policy, configured by the super admin in the backoffice (settings/password) and
 * applied to every account — clients and employees alike. Cached in memory: the writes go
 * through the server, so a cache reset (restart) just re-reads the document once.
 */

export interface PasswordPolicy {
  algorithm: string;
  params: Record<string, number>;
  min_password_length: number;
  require_digit: boolean;
  require_uppercase: boolean;
  require_special: boolean;
  migration: 'auto' | 'force_change';
  lockout: { max_attempts: number; lock_minutes: number; auto_unlock: boolean };
}

export const DEFAULT_POLICY: PasswordPolicy = {
  algorithm: 'argon2id',
  params: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
  min_password_length: 8,
  require_digit: false,
  require_uppercase: false,
  require_special: false,
  migration: 'auto',
  lockout: { max_attempts: 5, lock_minutes: 30, auto_unlock: true },
};

const DOC_COLLECTION = 'settings';
const DOC_ID = 'password';

let cache: PasswordPolicy | null = null;

/** Loads the stored policy (defaults when absent or malformed); cached until the next write. */
export async function getPolicy(store: DataStore): Promise<PasswordPolicy> {
  if (cache) return cache;
  try {
    const changes = await store.changes(DOC_COLLECTION, 0, 1);
    const doc = changes.items.find((d) => d.id === DOC_ID) as Record<string, unknown> | undefined;
    cache = doc ? mergePolicy(doc) : { ...DEFAULT_POLICY };
  } catch {
    cache = { ...DEFAULT_POLICY };
  }
  return cache;
}

export function invalidatePolicyCache(): void {
  cache = null;
}

export function mergePolicy(raw: Record<string, unknown>): PasswordPolicy {
  const d = raw as Record<string, unknown>;
  const lock = (d.lockout ?? {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && v > 0 ? v : fallback);
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  return {
    algorithm: typeof d.algorithm === 'string' && d.algorithm ? d.algorithm : DEFAULT_POLICY.algorithm,
    params: (typeof d.params === 'object' && d.params !== null ? d.params : DEFAULT_POLICY.params) as Record<
      string,
      number
    >,
    min_password_length: num(d.min_password_length, DEFAULT_POLICY.min_password_length),
    require_digit: bool(d.require_digit, DEFAULT_POLICY.require_digit),
    require_uppercase: bool(d.require_uppercase, DEFAULT_POLICY.require_uppercase),
    require_special: bool(d.require_special, DEFAULT_POLICY.require_special),
    migration: d.migration === 'force_change' ? 'force_change' : 'auto',
    lockout: {
      max_attempts: num(lock.max_attempts, DEFAULT_POLICY.lockout.max_attempts),
      lock_minutes: num(lock.lock_minutes, DEFAULT_POLICY.lockout.lock_minutes),
      auto_unlock: bool(lock.auto_unlock, DEFAULT_POLICY.lockout.auto_unlock),
    },
  };
}

/** Saves the policy; the caller must be proven to be the super admin. */
export async function savePolicy(store: DataStore, policy: PasswordPolicy, now: number): Promise<void> {
  await store.put(DOC_COLLECTION, DOC_ID, { ...policy, id: DOC_ID, updated_at: new Date(now).toISOString() });
  invalidatePolicyCache();
}

/** Whether a plain password satisfies the configured criteria (length + character classes). */
export function passwordMeetsCriteria(plain: string, policy: PasswordPolicy): boolean {
  if (plain.length < policy.min_password_length) return false;
  if (policy.require_digit && !/\d/.test(plain)) return false;
  if (policy.require_uppercase && !/[A-Z]/.test(plain)) return false;
  if (policy.require_special && !/[^a-zA-Z0-9]/.test(plain)) return false;
  return true;
}
