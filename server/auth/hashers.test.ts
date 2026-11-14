import { describe, expect, it } from 'vitest';
import { needsUpgrade, preferredHasher, verifyPassword } from './hashers';

describe('password hashers', () => {
  it('round-trips a password through the configured algorithm', async () => {
    const phc = await preferredHasher('argon2id').hash('mot-de-passe-sûr-123', {
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });
    expect(phc.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(phc, 'mot-de-passe-sûr-123')).toBe(true);
    expect(await verifyPassword(phc, 'autre')).toBe(false);
  });

  it('refuses an unknown algorithm instead of crashing', async () => {
    expect(await verifyPassword('$desalgo$v=1$abc$def', 'x')).toBe(false);
  });

  it('flags a hash that was not produced by the configured algorithm', async () => {
    const phc = await preferredHasher('argon2id').hash('x'.repeat(12), {
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });
    expect(needsUpgrade(phc, 'argon2id')).toBe(false);
    expect(needsUpgrade(phc, 'bcrypt')).toBe(true);
  });

  it('params come from the policy: two hashes with different costs differ', async () => {
    const light = await preferredHasher('argon2id').hash('x'.repeat(12), {
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });
    const heavy = await preferredHasher('argon2id').hash('x'.repeat(12), {
      memoryCost: 4096,
      timeCost: 2,
      parallelism: 2,
    });
    expect(light).not.toBe(heavy);
    expect(light).toContain('m=2048');
    expect(heavy).toContain('m=4096');
  });
});
