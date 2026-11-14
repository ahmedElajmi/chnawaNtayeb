import type { AccountSummary } from '@/core/accounts';
import type { AccountDirectoryPage, AccountDirectoryQuery, AccountDirectoryRepository } from '@/application';
import { dataHeaders } from './dataApi';

/**
 * Backoffice directory of every account through the server: the paged queries the generic
 * data endpoints cannot express (equality filter, e-mail prefix, count) live on the
 * manager-only /admin/api/accounts route.
 */

interface RawPage {
  ok?: boolean;
  items?: Partial<AccountSummary>[];
  total?: number;
  nextCursor?: string | null;
}

/** Directory of every account, for managers only (port AccountDirectoryRepository). */
export const accountDirectoryHttp: AccountDirectoryRepository = {
  async list(query: AccountDirectoryQuery): Promise<AccountDirectoryPage> {
    try {
      const params = new URLSearchParams({ type: query.type, limit: String(query.limit) });
      if (query.search) params.set('search', query.search);
      if (query.cursor) params.set('cursor', query.cursor);
      const res = await fetch(`/admin/api/accounts?${params.toString()}`, { headers: dataHeaders() });
      if (!res.ok) return { items: [], total: 0, nextCursor: null };
      const data = (await res.json()) as RawPage;
      const items = (data.items ?? []).filter((s): s is AccountSummary => !!s && typeof s.uid === 'string');
      return {
        items,
        total: typeof data.total === 'number' ? data.total : items.length,
        nextCursor: data.nextCursor ?? null,
      };
    } catch {
      return { items: [], total: 0, nextCursor: null };
    }
  },

  /** Clears the lockout of an account (server endpoint, manager session). */
  unlock: async (uid) => {
    try {
      const res = await fetch(`/admin/api/accounts/${encodeURIComponent(uid)}/unlock`, {
        method: 'POST',
        headers: dataHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
