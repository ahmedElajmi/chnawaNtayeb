import type { KitchenSyncGateway, RemoteKitchenDocument, RemoteKitchenSections } from '@/application';
import { authHeaders } from './userSession';

/**
 * The signed-in account's kitchen kept on our server (GET/PUT /api/kitchen, session token).
 * Guests have no kitchen on the server: the endpoints refuse them and this adapter is only
 * called when a client or employee session exists.
 */

const asSection = (raw: unknown): { value: unknown; updatedAt: number } | null => {
  const section = raw as { value?: unknown; updated_at?: unknown } | null;
  if (!section || typeof section !== 'object') return null;
  if (typeof section.updated_at !== 'number') return null;
  return { value: section.value, updatedAt: section.updated_at };
};

/** Reads the server document ({ uid, sections }) back into the port shape (unknown sections are ignored). */
function asDocument(raw: unknown): RemoteKitchenDocument {
  const doc = (raw ?? {}) as { sections?: Record<string, unknown> };
  const sections = doc.sections && typeof doc.sections === 'object' ? doc.sections : {};
  const document: RemoteKitchenDocument = {};
  for (const name of ['favorites', 'fridge', 'pantry', 'weeklyPlan', 'groceryLists', 'preferences'] as const) {
    const section = asSection(sections[name]);
    if (section) document[name] = section as never;
  }
  return document;
}

export const kitchenSyncHttpGateway: KitchenSyncGateway = {
  async pull() {
    const res = await fetch('/api/kitchen', { headers: authHeaders() });
    if (!res.ok) throw new Error('kitchen_unavailable');
    const body = (await res.json().catch(() => ({}))) as { doc?: unknown };
    return body.doc ? asDocument(body.doc) : null;
  },

  async push(sections: RemoteKitchenSections) {
    const res = await fetch('/api/kitchen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        sections: Object.fromEntries(
          Object.entries(sections).map(([name, section]) => [
            name,
            { value: section.value, updated_at: section.updatedAt },
          ])
        ),
      }),
    });
    if (!res.ok) throw new Error('kitchen_refused');
    const body = (await res.json().catch(() => ({}))) as { doc?: unknown };
    return asDocument(body.doc);
  },
};
