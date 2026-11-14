import type { PasswordPolicy } from '@/core/accounts';

/** Stand-in default matching the server defaults (tests only). */
export const DEFAULT_POLICY_LIKE: PasswordPolicy = {
  algorithm: 'argon2id',
  params: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
  min_password_length: 8,
  require_digit: false,
  require_uppercase: false,
  require_special: false,
  migration: 'auto',
  lockout: { max_attempts: 5, lock_minutes: 30, auto_unlock: true },
};
