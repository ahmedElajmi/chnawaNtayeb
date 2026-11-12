import { applyChanges, type Versioned } from '@/core/sync';
import type { CollectionCopy, LocalCollectionCache } from '@/application';

/** Device copy held in memory: reference implementation of LocalCollectionCache. */
export function createMemoryCollectionCache<T extends Versioned>(): LocalCollectionCache<T> {
  let copy: CollectionCopy<T> | null = null;
  return {
    async load() {
      return copy ? structuredClone(copy) : null;
    },
    async replace(next) {
      copy = structuredClone(next);
    },
    async update(changes, meta) {
      copy = { items: applyChanges(copy?.items ?? [], structuredClone(changes)), ...meta };
    },
  };
}
