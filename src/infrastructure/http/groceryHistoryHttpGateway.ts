import type { GroceryHistoryGateway } from '@/application';
import type { GroceryHistoryEntry } from '@/core/grocery';
import { authHeaders } from './userSession';

/**
 * Archived shopping lists of the signed-in account, kept on our server
 * (GET/POST /api/kitchen/history and DELETE /api/kitchen/history/:id, session token).
 */

const isEntry = (raw: unknown): raw is GroceryHistoryEntry =>
  !!raw &&
  typeof raw === 'object' &&
  typeof (raw as GroceryHistoryEntry).id === 'string' &&
  typeof (raw as GroceryHistoryEntry).archived_at === 'string' &&
  Array.isArray((raw as GroceryHistoryEntry).items);

export const groceryHistoryHttpGateway: GroceryHistoryGateway = {
  async list() {
    const res = await fetch('/api/kitchen/history', { headers: authHeaders() });
    if (!res.ok) throw new Error('kitchen_history_unavailable');
    const body = (await res.json().catch(() => ({}))) as { entries?: unknown[] };
    return (body.entries ?? []).filter(isEntry);
  },

  async save(entry: GroceryHistoryEntry) {
    const res = await fetch('/api/kitchen/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ entry }),
    });
    if (!res.ok) throw new Error('kitchen_history_refused');
  },

  async remove(entryId: string) {
    const res = await fetch(`/api/kitchen/history/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('kitchen_history_refused');
  },
};
