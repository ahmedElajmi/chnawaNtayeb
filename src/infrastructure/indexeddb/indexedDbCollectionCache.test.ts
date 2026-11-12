import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { describeLocalCollectionCache } from '../contracts/localCollectionCache.contract';
import { createIndexedDbCollectionCache } from './indexedDbCollectionCache';

// A fresh database for every test
describeLocalCollectionCache('IndexedDB', () =>
  createIndexedDbCollectionCache('recipes', { factory: new IDBFactory() })
);

describe('IndexedDB cache: move from the old localStorage copy', () => {
  it('moves the old copy once (to be read in full), then forgets it', async () => {
    let old: unknown[] | null = [{ id: 'a', name: 'A' }];
    const factory = new IDBFactory();
    const legacy = { read: () => old, forget: () => (old = null) };
    const cache = createIndexedDbCollectionCache('recipes', { factory, legacy });
    expect(await cache.load()).toEqual({ items: [{ id: 'a', name: 'A' }], revision: null, savedAt: 0 });
    expect(old).toBeNull();
    const again = createIndexedDbCollectionCache('recipes', { factory, legacy });
    expect((await again.load())?.items).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('keeps each collection apart', async () => {
    const factory = new IDBFactory();
    const recipes = createIndexedDbCollectionCache('recipes', { factory });
    const ingredients = createIndexedDbCollectionCache('ingredients', { factory });
    await recipes.replace({ items: [{ id: 'r' }], revision: 1, savedAt: 1 });
    expect(await ingredients.load()).toBeNull();
  });
});
