import { withoutUndefined } from '@/core/shared';
import type { Versioned } from '@/core/sync';
import type { RemoteChanges, SharedCollectionSource, SharedCollectionWriter } from '@/application';

type Listener = (changes: RemoteChanges) => void;

/**
 * Shared collection held in memory: reference implementation of SharedCollectionSource and
 * SharedCollectionWriter (the behaviour every database adapter must reproduce), used by tests.
 * Revisions come from a counter, like a database clock that only goes forward.
 */
export function createMemorySharedCollection<T extends Versioned>() {
  const docs = new Map<string, Versioned>();
  const listeners = new Set<Listener>();
  let clock = 0;

  const write = (doc: Versioned) => {
    const stored = { ...withoutUndefined(doc), revision: ++clock };
    docs.set(doc.id, stored);
    for (const send of listeners) send({ items: [structuredClone(stored)], removedIds: [], complete: false });
  };

  const source: SharedCollectionSource = {
    follow(since, onChanges) {
      const initial = [...docs.values()].filter((d) => since === null || (d.revision ?? 0) >= since);
      onChanges({ items: structuredClone(initial), removedIds: [], complete: since === null });
      listeners.add(onChanges);
      return () => listeners.delete(onChanges);
    },
  };

  const writer: SharedCollectionWriter<T> = {
    async put(item) {
      write(item);
      return { ok: true };
    },
    async remove(id) {
      write({ id, deleted: true });
      return { ok: true };
    },
    async putAll(items) {
      items.forEach(write);
      return { ok: true };
    },
    async replaceAll(items) {
      const keep = new Set(items.map((i) => i.id));
      const gone = [...docs.values()].filter((d) => !keep.has(d.id) && !d.deleted);
      gone.forEach((d) => write({ id: d.id, deleted: true }));
      items.forEach(write);
      return { ok: true, removed: gone.length };
    },
    async isEmpty() {
      return docs.size === 0;
    },
  };

  return { source, writer };
}
