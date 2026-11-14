import { resolveUserProfile, type UserProfile } from '@/core/accounts';
import type { AccountProfileRepository } from '@/application';

/**
 * In-memory reference implementation of the account profile repository: same complete-write
 * semantics as the Firebase adapter (a cleared field disappears).
 */
export function createMemoryAccountProfile(
  initial: UserProfile[] = []
): AccountProfileRepository & { docs: Map<string, UserProfile> } {
  const docs = new Map<string, UserProfile>();
  for (const profile of initial) docs.set(profile.uid, profile);
  return {
    docs,
    async read(uid) {
      const stored = docs.get(uid);
      return stored ? resolveUserProfile(stored) : null;
    },
    async write(profile) {
      docs.set(profile.uid, profile);
      return true;
    },
  };
}
