import { fetchChanges, dataHeaders } from './dataApi';

/**
 * The two active settings documents (matching, review) through the server: the matching
 * configuration drives the suggestions of every visitor, the review settings drive the
 * backoffice workflow. Their version history follows through the data endpoints (manager).
 */

export interface StoredSettingsDoc {
  version: number;
  config: unknown;
  updated_at: string;
  note: string;
}

export async function loadActiveSettings(doc: 'matching' | 'review'): Promise<StoredSettingsDoc | null> {
  try {
    const res = await fetch(`/api/settings/${doc}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { doc?: StoredSettingsDoc | null };
    return data.doc ?? null;
  } catch {
    return null;
  }
}

/** Follows one active settings document (60 s, refreshed on focus by the shared poller). */
export function followActiveSettings(
  doc: 'matching' | 'review',
  onChange: (settings: StoredSettingsDoc | null) => void,
  onError: () => void
): () => void {
  let stopped = false;
  let lastRevision: number | null = null;
  const read = async () => {
    try {
      const res = await fetch(`/api/settings/${doc}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { doc?: StoredSettingsDoc | null; revision?: number };
      if (stopped) return;
      // Same document: skip (the revision comes back with the answer)
      const revision = data.revision ?? 0;
      if (lastRevision !== null && revision === lastRevision) return;
      lastRevision = revision;
      onChange(data.doc ?? null);
    } catch {
      if (!stopped) onError();
    }
  };
  void read();
  const timer = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') void read();
  }, 60 * 1000);
  const onFocus = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') void read();
  };
  window.addEventListener('focus', onFocus);
  return () => {
    stopped = true;
    clearInterval(timer);
    window.removeEventListener('focus', onFocus);
  };
}

/** Publishes new active settings (one server write guarded by the version being replaced). */
export async function publishSettings(
  doc: 'matching' | 'review',
  config: unknown,
  note: string,
  expectedVersion: number | null
): Promise<{ ok: true; version: number } | { ok: false; conflict?: boolean; error: string }> {
  try {
    const res = await fetch('/admin/api/settings/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...dataHeaders() },
      body: JSON.stringify({ doc, config, note, expected_version: expectedVersion }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; version?: number; conflict?: boolean };
    if (res.ok && data.ok && typeof data.version === 'number') return { ok: true, version: data.version };
    if (data.conflict) return { ok: false, conflict: true, error: 'conflict' };
    return { ok: false, error: friendlyWrite(res.status) };
  } catch {
    return { ok: false, error: friendlyWrite(0) };
  }
}

/** The version history of one settings document, newest first (read once, on demand). */
export async function listSettingsVersions(doc: 'matching' | 'review', max: number): Promise<StoredSettingsDoc[]> {
  const versions = doc === 'matching' ? 'matching_settings_versions' : 'review_settings_versions';
  const delta = await fetchChanges({ [versions]: 0 });
  if (!delta) return [];
  return (delta[versions]?.items ?? [])
    .map((d) => d as unknown as StoredSettingsDoc & { id?: string })
    .filter((d) => typeof d.version === 'number')
    .sort((a, b) => b.version - a.version)
    .slice(0, Math.max(1, max));
}

function friendlyWrite(status: number): string {
  return status === 403
    ? 'La base a refusé l’enregistrement (session sans droits suffisants).'
    : 'La base de données est injoignable, réessaie plus tard.';
}
