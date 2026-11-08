import { DEFAULT_MATCHING_CONFIG, resolveMatchingConfig, type MatchingConfig } from '@/core/matching';
import type { MatchingSettingsCache, MatchingSettingsRepository, StoredMatchingSettings, WriteResult } from '../ports';
import { Store } from '../store';

export interface MatchingSettingsState {
  /** Settings used by the engine (always valid) */
  config: MatchingConfig;
  /** Published version in use; null = built-in defaults */
  version: number | null;
  updatedAt?: string;
  note?: string;
  /** Where the settings come from */
  source: 'default' | 'cache' | 'database';
}

const fromStored = (s: StoredMatchingSettings, source: MatchingSettingsState['source']): MatchingSettingsState => ({
  config: resolveMatchingConfig(s.config),
  version: s.version,
  updatedAt: s.updatedAt,
  note: s.note,
  source,
});

const DEFAULT_STATE: MatchingSettingsState = { config: DEFAULT_MATCHING_CONFIG, version: null, source: 'default' };

/**
 * Matching engine settings: the database is the source of truth; the device keeps a copy
 * for offline use; the built-in defaults apply when nothing was ever published.
 */
export class MatchingSettingsStore extends Store<MatchingSettingsState> {
  constructor(
    private readonly repo: MatchingSettingsRepository,
    private readonly cache: MatchingSettingsCache
  ) {
    const cached = cache.read();
    super(cached ? fromStored(cached, 'cache') : DEFAULT_STATE);
  }

  async load(): Promise<void> {
    try {
      const active = await this.repo.loadActive();
      if (!active) {
        this.setState(DEFAULT_STATE);
        return;
      }
      this.cache.write(active);
      this.setState(fromStored(active, 'database'));
    } catch {
      // Offline or unreachable: keep the cached copy (or the defaults)
    }
  }

  /** Publishes new settings (admin). They apply immediately on this device. */
  async publish(config: MatchingConfig, note: string): Promise<WriteResult> {
    const clean = resolveMatchingConfig(config);
    const result = await this.repo.publish(clean, note.trim());
    if (!result.ok) return result;
    const stored: StoredMatchingSettings = {
      version: result.version ?? (this.getState().version ?? 0) + 1,
      config: clean,
      updatedAt: new Date().toISOString(),
      note: note.trim(),
    };
    this.cache.write(stored);
    this.setState(fromStored(stored, 'database'));
    return { ok: true };
  }

  listVersions(limit = 20): Promise<StoredMatchingSettings[]> {
    return this.repo.listVersions(limit);
  }

  /** Publishes an old version again (the history is kept: it becomes the newest version). */
  restore(version: StoredMatchingSettings): Promise<WriteResult> {
    return this.publish(resolveMatchingConfig(version.config), `Restauration de la version ${version.version}`);
  }
}
