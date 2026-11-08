import { describe, expect, it } from 'vitest';
import { DEFAULT_MATCHING_CONFIG } from '@/core/matching';
import type { MatchingSettingsCache, MatchingSettingsRepository, StoredMatchingSettings } from '../ports';
import { MatchingSettingsStore } from './MatchingSettingsStore';

function fakes(active: StoredMatchingSettings | null | 'offline', cached: StoredMatchingSettings | null = null) {
  const published: StoredMatchingSettings[] = active && active !== 'offline' ? [active] : [];
  let cacheValue = cached;
  const repo: MatchingSettingsRepository = {
    loadActive: async () => {
      if (active === 'offline') throw new Error('offline');
      return published.at(-1) ?? null;
    },
    publish: async (config, note) => {
      const version = published.length + 1;
      published.push({ version, config, note, updatedAt: 'now' });
      return { ok: true, version };
    },
    listVersions: async (limit) => [...published].reverse().slice(0, limit),
  };
  const cache: MatchingSettingsCache = { read: () => cacheValue, write: (s) => void (cacheValue = s) };
  return { repo, cache, published, readCache: () => cacheValue };
}

const stored = (version: number, almostMaxToBuy: number): StoredMatchingSettings => ({
  version,
  config: { tiers: { almostMaxToBuy } },
  updatedAt: '2026-11-01',
  note: '',
});

describe('MatchingSettingsStore', () => {
  it('uses the built-in defaults when nothing was published', async () => {
    const { repo, cache } = fakes(null);
    const store = new MatchingSettingsStore(repo, cache);
    await store.load();
    expect(store.getState()).toMatchObject({ source: 'default', version: null, config: DEFAULT_MATCHING_CONFIG });
  });

  it('loads the published settings from the database and keeps an offline copy', async () => {
    const { repo, cache, readCache } = fakes(stored(3, 1));
    const store = new MatchingSettingsStore(repo, cache);
    await store.load();
    expect(store.getState()).toMatchObject({ source: 'database', version: 3 });
    expect(store.getState().config.tiers.almostMaxToBuy).toBe(1);
    expect(readCache()?.version).toBe(3);
  });

  it('offline: keeps the copy saved on the device', async () => {
    const { repo, cache } = fakes('offline', stored(2, 1));
    const store = new MatchingSettingsStore(repo, cache);
    await store.load();
    expect(store.getState()).toMatchObject({ source: 'cache', version: 2 });
  });

  it('publishing creates a new version; restoring an old one creates another (history kept)', async () => {
    const { repo, cache, published } = fakes(stored(1, 2));
    const store = new MatchingSettingsStore(repo, cache);
    await store.load();
    const stricter = { ...DEFAULT_MATCHING_CONFIG, tiers: { ...DEFAULT_MATCHING_CONFIG.tiers, almostMaxToBuy: 1 } };
    expect(await store.publish(stricter, ' moins de courses ')).toEqual({ ok: true });
    expect(store.getState()).toMatchObject({ version: 2, note: 'moins de courses' });

    const [, first] = await store.listVersions();
    await store.restore(first);
    expect(store.getState().version).toBe(3);
    expect(store.getState().config.tiers.almostMaxToBuy).toBe(2);
    expect(published).toHaveLength(3);
  });
});
