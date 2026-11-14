import { getBackofficeToken } from './backofficeAuth';
import { readUserSession } from './userSession';

/**
 * Low-level access to the data endpoints (/api/data/*, /api/themes, /api/settings/*):
 * every read and write goes to our server, which decides the identity from the session
 * it signed (super-admin backoffice session first, then the employee/client session).
 */

/** The session that proves the caller's rights: the backoffice session or the site one. */
export function dataHeaders(): Record<string, string> {
  const admin = getBackofficeToken();
  if (admin) return { Authorization: `Bearer ${admin}` };
  const session = readUserSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export interface ChangesPayload {
  items: Record<string, unknown>[];
  removedIds: string[];
  revision: number;
  more?: boolean;
}

/** Sends every followed collection's revision at once; the server answers only the late ones. */
export async function fetchChanges(rev: Record<string, number>): Promise<Record<string, ChangesPayload> | null> {
  try {
    const res = await fetch('/api/data/changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...dataHeaders() },
      body: JSON.stringify({ rev }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Record<string, ChangesPayload> };
    return data.data ?? null;
  } catch {
    return null;
  }
}

export type HttpWriteResult = { ok: true; revision: number } | { ok: false; error: string };

async function send(method: string, url: string, body?: unknown): Promise<HttpWriteResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...dataHeaders() },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; revision?: number; error?: string };
    if (res.ok && data.ok && typeof data.revision === 'number') return { ok: true, revision: data.revision };
    // The server refused the write itself (rights, invalid document): the caller shows it
    return { ok: false, error: res.status === 403 ? 'err:write-refused' : 'err:unreachable' };
  } catch {
    return { ok: false, error: 'err:unreachable' };
  }
}

/** A stored document is the item without its device revision (the server stamps its own). */
export const storedDoc = <T extends { id: string; revision?: number }>(item: T): Record<string, unknown> => {
  const { revision: _revision, ...doc } = item;
  return doc as Record<string, unknown>;
};

export function putDoc(name: string, id: string, doc: Record<string, unknown>): Promise<HttpWriteResult> {
  return send('PUT', `/api/data/${name}/${encodeURIComponent(id)}`, { doc });
}

export function deleteDoc(name: string, id: string): Promise<HttpWriteResult> {
  return send('DELETE', `/api/data/${name}/${encodeURIComponent(id)}`);
}

const BATCH = 200;

/** Writes many complete documents, chunked so one call never carries more than 200. */
export async function putDocs(name: string, docs: Record<string, unknown>[]): Promise<HttpWriteResult> {
  let revision = 0;
  for (let k = 0; k < docs.length; k += BATCH) {
    const result = await send('POST', `/api/data/${name}`, { docs: docs.slice(k, k + BATCH) });
    if (!result.ok) return result;
    revision = result.revision;
  }
  return { ok: true, revision };
}

/** Makes the collection exactly `docs` (the others become deletion markers, server-side). */
export async function replaceDocs(name: string, docs: Record<string, unknown>[]): Promise<HttpWriteResult> {
  if (docs.length > 500) return { ok: false, error: 'err:unreachable' };
  return send('POST', `/api/data/${name}/replace`, { docs });
}

/** True when the collection holds nothing yet (reads at most one document). */
export async function isEmptyCollection(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/${name}/empty`, { headers: dataHeaders() });
    if (!res.ok) return false;
    const data = (await res.json()) as { empty?: boolean };
    return data.empty === true;
  } catch {
    return false;
  }
}

/** The polling interval configured in the backoffice (seconds), null when unreachable. */
export async function fetchPollingInterval(): Promise<number | null> {
  try {
    const res = await fetch('/api/settings/polling');
    if (!res.ok) return null;
    const data = (await res.json()) as { interval_seconds?: number };
    return typeof data.interval_seconds === 'number' ? data.interval_seconds : null;
  } catch {
    return null;
  }
}
