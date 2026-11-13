import { resolveUserProfile, type AccountSummary } from '@/core/accounts';
import type { AccountDirectoryPage, AccountDirectoryQuery, AccountDirectoryRepository } from '@/application';

/** In-memory directory over a fixed list of stored profiles (reference implementation). */
export function createMemoryAccountDirectory(initial: unknown[]): AccountDirectoryRepository & { docs: unknown[] } {
  const docs = initial;
  return {
    docs,
    async list({ type, search, limit, cursor }: AccountDirectoryQuery): Promise<AccountDirectoryPage> {
      const wanted = search ? search.toLowerCase() : '';
      // Same semantics as Firestore: the type filter reads the stored field (strict), so a
      // legacy document without `type` only shows under 'all' — and gets typed at next login.
      const all = docs
        .map((d) => (type === 'all' ? resolveUserProfile(d) : d))
        .filter((d) => (type === 'all' ? d !== null : (d as Record<string, unknown>).type === type))
        .map((d) => resolveUserProfile(d))
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .filter((p) => (wanted ? (p.email ?? '').toLowerCase().startsWith(wanted) : true))
        .sort((a, b) => a.uid.localeCompare(b.uid));
      const start = cursor ? all.findIndex((p) => p.uid === cursor) + 1 : 0;
      const items: AccountSummary[] = all.slice(start, start + limit).map((p) => ({
        uid: p.uid,
        type: p.type,
        email: p.email,
        displayName: p.displayName,
        phone: p.phone,
        isAnonymous: p.isAnonymous,
        lastLogin: p.lastLogin,
      }));
      return { items, total: all.length, nextCursor: start + limit < all.length ? all[start + limit - 1].uid : null };
    },
  };
}
