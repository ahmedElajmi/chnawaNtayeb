import { describe, expect, it } from 'vitest';
import type { LocalCollectionCache } from '@/application';
import type { Versioned } from '@/core/sync';

interface Item extends Versioned {
  name: string;
}

/**
 * Behaviour every device copy adapter must have, whatever the storage:
 *   describeLocalCollectionCache('my storage', () => createMyCache());
 */
export function describeLocalCollectionCache(name: string, create: () => LocalCollectionCache<Item>) {
  describe(`LocalCollectionCache contract: ${name}`, () => {
    it('has no copy at first', async () => {
      expect(await create().load()).toBeNull();
    });

    it('gives back the copy it replaced, with its revision and date', async () => {
      const cache = create();
      await cache.replace({ items: [{ id: 'a', name: 'A', revision: 3 }], revision: 3, savedAt: 1000 });
      expect(await cache.load()).toEqual({ items: [{ id: 'a', name: 'A', revision: 3 }], revision: 3, savedAt: 1000 });
    });

    it('applies changes: replaced, added and removed items', async () => {
      const cache = create();
      await cache.replace({
        items: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
        revision: null,
        savedAt: 1,
      });
      await cache.update(
        {
          items: [
            { id: 'a', name: 'A2', revision: 5 },
            { id: 'c', name: 'C', revision: 6 },
          ],
          removedIds: ['b'],
        },
        { revision: 6, savedAt: 2 }
      );
      const copy = await cache.load();
      expect(copy?.revision).toBe(6);
      expect(copy?.savedAt).toBe(2);
      expect(((copy?.items ?? []) as Item[]).map((i) => i.name).sort()).toEqual(['A2', 'C']);
    });

    it('replacing drops the previous items', async () => {
      const cache = create();
      await cache.replace({ items: [{ id: 'a', name: 'A' }], revision: 1, savedAt: 1 });
      await cache.replace({ items: [{ id: 'b', name: 'B' }], revision: 2, savedAt: 2 });
      expect((await cache.load())?.items).toEqual([{ id: 'b', name: 'B' }]);
    });
  });
}
