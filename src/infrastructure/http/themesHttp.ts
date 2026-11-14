import { isValidTheme, pickThemeFields, validateTheme, type AppTheme } from '@/core/theme';
import type { ThemeRepository, WriteResult } from '@/application';
import { storage } from '@/infrastructure/local/storage';
import { dataHeaders, deleteDoc, putDoc } from './dataApi';

/**
 * Themes through the server: visitors read the published ones (`/api/themes` answers the
 * published subset only), the backoffice reads and writes every theme with its session —
 * a draft never reaches the public answer.
 */

async function fetchThemes(includeDrafts: boolean): Promise<AppTheme[] | null> {
  try {
    const res = await fetch('/api/themes', { headers: dataHeaders() });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: unknown[] };
    const themes: AppTheme[] = [];
    for (const raw of data.items ?? []) {
      const candidate = raw as Record<string, unknown>;
      // Never trust stored data blindly: an invalid theme is ignored, not applied
      if (includeDrafts || candidate.is_published === true) {
        if (isValidTheme(candidate)) themes.push(pickThemeFields(candidate));
      }
    }
    return themes;
  } catch {
    return null;
  }
}

/** Themes published on the server, with an offline copy on the device (port ThemeRepository). */
export const themesHttp: ThemeRepository = {
  cached: () => storage.getCachedThemes(),
  fetchPublished: async () => {
    const remote = await fetchThemes(false);
    if (remote) {
      storage.saveCachedThemes(remote);
      return remote;
    }
    return storage.getCachedThemes();
  },
  fetchAll: () => fetchThemes(true),
  save: async (theme): Promise<WriteResult> => {
    const errors = validateTheme(theme);
    if (errors.length > 0) return { ok: false, error: errors.join(' · ') };
    if (theme.is_builtin) return { ok: false, error: 'Les thèmes intégrés ne peuvent pas être modifiés.' };
    const clean = { ...pickThemeFields(theme), updated_at: new Date().toISOString() };
    const { id, revision: _r, ...doc } = clean as AppTheme & { revision?: number };
    const result = await putDoc('themes', id, doc as Record<string, unknown>);
    return result.ok ? { ok: true } : { ok: false, error: friendlyWrite(result.error) };
  },
  remove: async (themeId): Promise<WriteResult> => {
    const result = await deleteDoc('themes', themeId);
    return result.ok ? { ok: true } : { ok: false, error: friendlyWrite(result.error) };
  },
  saveActiveSnapshot: (snapshot) => storage.saveActiveThemeSnapshot(snapshot),
};

function friendlyWrite(error: string): string {
  return error === 'err:write-refused'
    ? 'le serveur a refusé l’écriture (session sans droits suffisants).'
    : 'le serveur est injoignable, réessaie plus tard.';
}
