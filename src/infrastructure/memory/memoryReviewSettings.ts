import type { ReviewSettingsRepository, StoredReviewSettings } from '@/application';

/** Review settings held in memory: reference implementation of ReviewSettingsRepository (tests). */
export function createMemoryReviewSettings(): ReviewSettingsRepository {
  const versions: StoredReviewSettings[] = [];
  const listeners = new Set<(active: StoredReviewSettings | null) => void>();
  const active = () => (versions.length ? structuredClone(versions[versions.length - 1]) : null);
  return {
    follow(onChange) {
      onChange(active());
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    async publish(settings, note) {
      const version = versions.length + 1;
      versions.push({
        version,
        settings: JSON.parse(JSON.stringify(settings)),
        updatedAt: new Date(version).toISOString(),
        note,
      });
      for (const send of listeners) send(active());
      return { ok: true, version };
    },
    async listVersions() {
      return structuredClone([...versions].reverse());
    },
  };
}
