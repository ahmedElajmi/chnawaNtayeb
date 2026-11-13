import { describe, expect, it } from 'vitest';
import type { Versioned } from '@/core/sync';
import { createMemorySharedCollection } from '@/infrastructure/memory/memorySharedCollection';
import { createMemoryCollectionCache } from '@/infrastructure/memory/memoryCollectionCache';
import type { LocalCollectionCache, RemoteChanges, SharedCollectionSource } from '../ports';
import { SyncedCollectionStore } from './SyncedCollectionStore';

interface Item extends Versioned {
  name: string;
}

const isItem = (x: unknown): x is Item => typeof (x as Item)?.id === 'string' && typeof (x as Item)?.name === 'string';
const read = (raw: readonly unknown[]) => raw.filter(isItem);
const BUILT_IN: Item[] = [{ id: 'seed', name: 'Seed' }];
const DAY = 86_400_000;

function setup(opts: { cache?: LocalCollectionCache<Item>; now?: () => number; source?: SharedCollectionSource } = {}) {
  const shared = createMemorySharedCollection<Item>();
  const cache = opts.cache ?? createMemoryCollectionCache<Item>();
  const store = new SyncedCollectionStore<Item>({
    source: opts.source ?? shared.source,
    cache,
    read,
    builtIn: () => BUILT_IN,
    now: opts.now ?? (() => 1000),
    fullRefreshAfterMs: 30 * DAY,
  });
  return { store, cache, writer: shared.writer, source: shared.source };
}

const names = (store: SyncedCollectionStore<Item>) => store.getState().items.map((i) => i.name);
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('SyncedCollectionStore', () => {
  it('shows the built-in content, then the database content', async () => {
    const { store, writer } = setup();
    await writer.putAll([{ id: 'a', name: 'A' }]);
    expect(names(store)).toEqual(['Seed']);
    store.start();
    await settle();
    expect(names(store)).toEqual(['A']);
    expect(store.getState().synced).toBe(true);
  });

  it('keeps the built-in content when the database is empty', async () => {
    const { store } = setup();
    store.start();
    await settle();
    expect(names(store)).toEqual(['Seed']);
    expect(store.getState().synced).toBe(true);
  });

  it('shows nothing when everything was deleted on purpose (no fallback to the built-in content)', async () => {
    const { store, writer } = setup();
    await writer.putAll([{ id: 'a', name: 'A' }]);
    await writer.remove('a');
    store.start();
    await settle();
    expect(names(store)).toEqual([]);
  });

  it('receives a change made on another device live, deletions included', async () => {
    const { store, writer } = setup();
    await writer.putAll([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    store.start();
    await settle();
    await writer.put({ id: 'a', name: 'A edited' });
    await writer.remove('b');
    expect(names(store)).toEqual(['A edited']);
  });

  it('leaves invalid entries out (every entry is read by the domain)', async () => {
    const { store, writer } = setup();
    await writer.putAll([{ id: 'a', name: 'A' }, { id: 'broken' } as Item]);
    store.start();
    await settle();
    expect(names(store)).toEqual(['A']);
  });

  it('on the next start, only asks for what changed since the newest revision of its copy', async () => {
    const { store, writer, cache, source } = setup();
    await writer.putAll([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    store.start();
    await settle();
    store.stop();
    await store.flush();
    await writer.put({ id: 'b', name: 'B2' });

    const asked: (number | null)[] = [];
    const received: RemoteChanges[] = [];
    const spy: SharedCollectionSource = {
      follow(since, onChanges, onError) {
        asked.push(since);
        return source.follow(
          since,
          (c) => {
            received.push(c);
            onChanges(c);
          },
          onError
        );
      },
    };
    const next = setup({ cache, source: spy }).store;
    next.start();
    await settle();
    expect(asked[0]).toBeTypeOf('number');
    // Only the changed item crosses the network, the rest comes from the device copy
    expect(received[0].items).toHaveLength(1);
    expect(names(next)).toEqual(['A', 'B2']);
  });

  it('reads everything again when its copy is too old', async () => {
    const { store, writer, cache, source } = setup();
    await writer.put({ id: 'a', name: 'A' });
    store.start();
    await settle();
    store.stop();
    await store.flush();

    const asked: (number | null)[] = [];
    const later = setup({
      cache,
      now: () => 1000 + 31 * DAY,
      source: { follow: (since, ok, ko) => (asked.push(since), source.follow(since, ok, ko)) },
    }).store;
    later.start();
    await settle();
    expect(asked).toEqual([null]);
  });

  it('shows a local edit at once and keeps it in the device copy', async () => {
    const { store, cache } = setup();
    store.start();
    await settle();
    store.putLocal({ id: 'x', name: 'X' });
    expect(names(store)).toContain('X');
    await store.flush();
    expect((((await cache.load())?.items ?? []) as Item[]).some((i) => i.id === 'x')).toBe(true);
  });

  it('marks itself synced when the database cannot be read (the copy stays)', async () => {
    const failing: SharedCollectionSource = {
      follow: (_since, _ok, onError) => {
        onError();
        return () => {};
      },
    };
    const { store } = setup({ source: failing });
    store.start();
    await settle();
    expect(store.getState()).toMatchObject({ synced: true, loaded: true });
    expect(names(store)).toEqual(['Seed']);
  });
});
