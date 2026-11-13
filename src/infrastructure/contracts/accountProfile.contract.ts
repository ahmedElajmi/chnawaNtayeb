import { describe, expect, it } from 'vitest';
import type { AccountProfileRepository } from '@/application';
import type { UserProfile } from '@/core/accounts';

/** Every AccountProfileRepository implementation must pass: same semantics as the Firebase adapter. */
export function describeAccountProfile(name: string, create: () => AccountProfileRepository): void {
  describe(`AccountProfileRepository (${name})`, () => {
    it('returns null when the account has no profile', async () => {
      const repo = create();
      await expect(repo.read('nobody')).resolves.toBeNull();
    });

    it('reads back a written profile, complete', async () => {
      const repo = create();
      const profile: UserProfile = {
        uid: 'u1',
        type: 'client',
        email: 'a@b.co',
        displayName: 'Amine',
        phone: '+21620123456',
        address: { line: '12 rue X', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
        preferredLanguage: 'derja',
        isAnonymous: false,
      };
      await expect(repo.write(profile)).resolves.toBe(true);
      await expect(repo.read('u1')).resolves.toMatchObject({
        uid: 'u1',
        type: 'client',
        displayName: 'Amine',
        phone: '+21620123456',
        preferredLanguage: 'derja',
      });
    });

    it('writes completely: a cleared field disappears', async () => {
      const repo = create();
      const withPhone: UserProfile = { uid: 'u2', type: 'client', phone: '+21620123456', isAnonymous: false };
      await repo.write(withPhone);
      const withoutPhone: UserProfile = { uid: 'u2', type: 'client', isAnonymous: false };
      await repo.write(withoutPhone);
      await expect(repo.read('u2')).resolves.toMatchObject({ uid: 'u2' });
      await expect(repo.read('u2')).resolves.not.toHaveProperty('phone');
    });

    it('accepts legacy documents and defaults the type to client', async () => {
      const repo = create();
      const legacy = { uid: 'u3', email: 'old@b.co', isAnonymous: false, favorites: ['r1'] };
      await repo.write(legacy as unknown as UserProfile);
      await expect(repo.read('u3')).resolves.toMatchObject({ uid: 'u3', type: 'client', email: 'old@b.co' });
    });
  });
}
