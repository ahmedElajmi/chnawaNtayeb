import { resolveUserProfile, type UserProfile } from '@/core/accounts';
import type { AccountProfileRepository } from '@/application';
import { authHeaders } from './userSession';

/**
 * Profile of the signed-in account through our server: reads come from /api/auth/me
 * (the session decides whose profile it is), writes go to /api/auth/profile where the
 * fields are normalized and revalidated before touching the database.
 */

/** Profile of the signed-in account served by the server (port AccountProfileRepository). */
export const accountProfileHttpGateway: AccountProfileRepository = {
  read: async (uid) => {
    const session = authHeaders();
    if (!session.Authorization) return null; // guests and signed-out visitors have no profile
    try {
      const res = await fetch('/api/auth/me', { headers: session });
      if (!res.ok) return null;
      const data = (await res.json().catch(() => ({}))) as { user?: unknown };
      const profile = resolveUserProfile(data.user);
      // The session owner only: a mismatch (re-login elsewhere) shows no profile
      return profile && profile.uid === uid && !profile.isAnonymous ? profile : null;
    } catch {
      return null;
    }
  },
  write: async (profile: UserProfile) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profile.displayName,
          phone: profile.phone,
          preferredLanguage: profile.preferredLanguage,
          address: profile.address,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
