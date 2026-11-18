import { AppTheme } from '@/core/theme';

/**
 * Picks the theme to apply from the already-loaded theme list (built-in themes
 * from the bundle + locally cached published themes).
 *
 * Pure and synchronous by contract: it never reads IndexedDB or the network
 * itself — the caller passes the data it has already loaded. The future CMS
 * will pass its server-side resolution through the same signature.
 *
 * Rules (lot 2.6.1 dossier § 2.1 / § 7.3):
 * - a requested theme found in the list is applied, never replaced by the default;
 * - the fallback to the configured default happens only when the requested theme
 *   is really unavailable (not in the list, or unpublished);
 * - the default itself comes from the centralized app configuration, never from
 *   the core and never from device preferences.
 */
export function resolveTheme(themes: readonly AppTheme[], requestedId: string | null, defaultId: string): AppTheme {
  const available = themes.filter((t) => t.is_published); // unpublished themes are never applied
  if (requestedId) {
    const requested = available.find((t) => t.id === requestedId);
    if (requested) return requested;
  }
  return available.find((t) => t.id === defaultId) ?? available[0];
}
