import type {
  KitchenSyncGateway,
  RemoteKitchenDocument,
  RemoteKitchenPull,
  RemoteKitchenSections,
} from '@/application';
import { authHeaders } from './userSession';

/**
 * The signed-in account's kitchen kept on our server (GET/PUT /api/kitchen, session token).
 * Guests have no kitchen on the server: the endpoints refuse them and this adapter is only
 * called when a client or employee session exists.
 *
 * Every request declares the application protocol version (lot B22-07); a pull answered
 * with `X-Kitchen-Protocol-Status: reconciliation-required` carries a client-side marker
 * back to the sync (never a server proof). Protocol refusals surface as distinct error
 * codes; the local changes stay pending (nothing is lost, the retry happens after update).
 */

/** B22-07 initial version — the evolution policy stays open (P3, server: protocolVersion.ts). */
const PROTOCOL_VERSION = '1';
const PROTOCOL_VERSION_HEADER = 'X-Kitchen-Protocol-Version';
const PROTOCOL_STATUS_HEADER = 'x-kitchen-protocol-status';
const PROTOCOL_STATUS_RECONCILIATION_REQUIRED = 'reconciliation-required';

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
  for (const name of ['favorites', 'fridge', 'pantry', 'stock', 'weeklyPlan', 'groceryLists', 'preferences'] as const) {
    const section = asSection(sections[name]);
    if (section) document[name] = section as never;
  }
  return document;
}

/** Distinct codes for the protocol refusals (translated by the interface, never shown raw);
 * any other refusal keeps the context's own code. */
async function refusalCode(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: unknown };
  if (body.error === 'protocol-version-unsupported') return 'kitchen_protocol_unsupported';
  if (body.error === 'protocol-version-invalid') return 'kitchen_protocol_invalid';
  return fallback;
}

export const kitchenSyncHttpGateway: KitchenSyncGateway = {
  async pull(): Promise<RemoteKitchenPull> {
    const res = await fetch('/api/kitchen', {
      headers: { ...authHeaders(), [PROTOCOL_VERSION_HEADER]: PROTOCOL_VERSION },
    });
    if (!res.ok) throw new Error(await refusalCode(res, 'kitchen_unavailable'));
    const signal = res.headers?.get?.(PROTOCOL_STATUS_HEADER);
    const reconciliationRequired = signal === PROTOCOL_STATUS_RECONCILIATION_REQUIRED;
    const body = (await res.json().catch(() => ({}))) as { doc?: unknown };
    return { doc: body.doc ? asDocument(body.doc) : null, reconciliationRequired };
  },

  async push(sections: RemoteKitchenSections) {
    const res = await fetch('/api/kitchen', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        [PROTOCOL_VERSION_HEADER]: PROTOCOL_VERSION,
        ...authHeaders(),
      },
      body: JSON.stringify({
        sections: Object.fromEntries(
          Object.entries(sections).map(([name, section]) => [
            name,
            { value: section.value, updated_at: section.updatedAt },
          ])
        ),
      }),
    });
    if (!res.ok) throw new Error(await refusalCode(res, 'kitchen_refused'));
    const body = (await res.json().catch(() => ({}))) as { doc?: unknown };
    return asDocument(body.doc);
  },
};
