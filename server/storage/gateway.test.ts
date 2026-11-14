import { beforeEach, describe, expect, it } from 'vitest';
import { computeChanges } from './gateway';
import { createMemoryDataStore } from './memoryDataStore';
import { resetWatermarks } from './watermark';

const store = createMemoryDataStore();
const publicIdentity = { read: 'public' as const };
const adminIdentity = { read: 'admin' as const };

describe('computeChanges (the batched change feed)', () => {
  beforeEach(() => resetWatermarks());

  it('returns the deltas of the collections the client follows', async () => {
    await store.put('recipes', 'r1', { name_fr: 'Ojja' });
    await store.put('ingredients', 'i1', { name_fr: 'Tomate' });
    const result = await computeChanges({ recipes: 0, ingredients: 0 }, publicIdentity, store);
    expect(result.recipes?.items.map((d) => d.id)).toEqual(['r1']);
    expect(result.ingredients?.items.map((d) => d.id)).toEqual(['i1']);
  });

  it('skips a collection the watermark proves up-to-date (zero database query)', async () => {
    await store.put('recipes', 'r1', { name_fr: 'Ojja' });
    const first = await computeChanges({ recipes: 0 }, publicIdentity, store);
    const revision = first.recipes?.revision ?? 0;
    // the client is now at the watermark: no delta, no query — the store is not even touched
    const spy = { calls: 0 };
    const countingStore = {
      changes: async (name: string, since: number, limit: number) => {
        spy.calls += 1;
        return store.changes(name, since, limit);
      },
    };
    const second = await computeChanges({ recipes: revision }, publicIdentity, countingStore);
    expect(spy.calls).toBe(0);
    expect(second.recipes).toBeUndefined();
  });

  it('re-derives the watermark after a restart (empty memory) from the first poll', async () => {
    await store.put('recipes', 'r1', { name_fr: 'Ojja' });
    await computeChanges({ recipes: 0 }, publicIdentity, store); // watermark derived
    resetWatermarks(); // simulates a server restart
    const spy = { calls: 0 };
    const countingStore = {
      changes: async (name: string, since: number, limit: number) => {
        spy.calls += 1;
        return store.changes(name, since, limit);
      },
    };
    // an up-to-date client costs one empty query (correctness), then the shortcut is back
    const result = await computeChanges({ recipes: await store.maxRevision('recipes') }, publicIdentity, countingStore);
    expect(spy.calls).toBe(1);
    expect(result.recipes?.items).toHaveLength(0);
    await computeChanges({ recipes: await store.maxRevision('recipes') }, publicIdentity, countingStore);
    expect(spy.calls).toBe(1); // shortcut restored for everyone
  });

  it('hides admin-only collections from a public visitor', async () => {
    await store.put('matching_scenarios', 's1', { name: 'sc' });
    const result = await computeChanges({ matching_scenarios: 0 }, publicIdentity, store);
    expect(result.matching_scenarios).toBeUndefined();
    const adminResult = await computeChanges({ matching_scenarios: 0 }, adminIdentity, store);
    expect(adminResult.matching_scenarios?.items.map((d) => d.id)).toEqual(['s1']);
  });

  it('ignores negative or non-numeric client revisions (treated as 0)', async () => {
    await store.put('recipes', 'r1', { name_fr: 'Ojja' });
    const result = await computeChanges({ recipes: -5 }, publicIdentity, store);
    expect(result.recipes?.items.map((d) => d.id)).toEqual(['r1']);
  });
});
