import type { MatchingSettingsCache, StoredMatchingSettings } from '@/application';

const KEY = 'chnowa_matching_settings_cache_v1';

/** Offline copy of the published matching settings (the database stays the source of truth). */
export const localMatchingSettingsCache: MatchingSettingsCache = {
  read() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredMatchingSettings) : null;
      return parsed && typeof parsed.version === 'number' ? parsed : null;
    } catch {
      return null;
    }
  },
  write(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {}
  },
};
