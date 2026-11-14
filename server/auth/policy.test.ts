import { describe, expect, it } from 'vitest';
import { DEFAULT_POLICY, mergePolicy, passwordMeetsCriteria } from './policy';

describe('password policy', () => {
  it('falls back to defaults on malformed stored data (never throws)', () => {
    const policy = mergePolicy({ algorithm: 42, lockout: { max_attempts: 'five' } });
    expect(policy.algorithm).toBe(DEFAULT_POLICY.algorithm);
    expect(policy.lockout.max_attempts).toBe(DEFAULT_POLICY.lockout.max_attempts);
    expect(policy.min_password_length).toBe(DEFAULT_POLICY.min_password_length);
  });

  it('keeps a valid stored policy', () => {
    const policy = mergePolicy({
      algorithm: 'argon2id',
      min_password_length: 12,
      require_digit: true,
      migration: 'force_change',
      lockout: { max_attempts: 3, lock_minutes: 60, auto_unlock: false },
    });
    expect(policy.min_password_length).toBe(12);
    expect(policy.require_digit).toBe(true);
    expect(policy.migration).toBe('force_change');
    expect(policy.lockout).toEqual({ max_attempts: 3, lock_minutes: 60, auto_unlock: false });
  });

  it('applies the length criterion and the character classes', () => {
    const base = { ...DEFAULT_POLICY };
    expect(passwordMeetsCriteria('12345678', base)).toBe(true);
    expect(passwordMeetsCriteria('short', base)).toBe(false);
    const digit = { ...base, require_digit: true };
    expect(passwordMeetsCriteria('abcdefgh', digit)).toBe(false);
    expect(passwordMeetsCriteria('abcdefgh1', digit)).toBe(true);
    const upper = { ...base, require_uppercase: true };
    expect(passwordMeetsCriteria('abcdefgh', upper)).toBe(false);
    expect(passwordMeetsCriteria('Abcdefgh', upper)).toBe(true);
    const special = { ...base, require_special: true };
    expect(passwordMeetsCriteria('abcdefgh', special)).toBe(false);
    expect(passwordMeetsCriteria('abcdefg!', special)).toBe(true);
  });
});
