import type { CollectionName, DataStore, StorageChanges } from './types';

interface StoredDoc {
  id: string;
  revision: number;
  doc: Record<string, unknown>;
}

/**
 * In-memory reference implementation of the DataStore contract: same revision semantics as
 * the Firestore adapter (monotonic revisions, deletion markers, bounded change queries).
 * Used by the contract suite and as the blueprint for any new backend.
 */
export function createMemoryDataStore(): DataStore {
  const collections = new Map<CollectionName, Map<string, StoredDoc>>();
  let clock = Date.now();

  const table = (name: CollectionName): Map<string, StoredDoc> => {
    let t = collections.get(name);
    if (!t) {
      t = new Map();
      collections.set(name, t);
    }
    return t;
  };

  const nextRevision = (): number => {
    clock += 1;
    return clock;
  };

  return {
    async changes(name, since, limit): Promise<StorageChanges> {
      const t = table(name);
      const changed = [...t.values()].filter((d) => d.revision > since).sort((a, b) => a.revision - b.revision);
      const bounded = changed.slice(0, Math.max(1, limit));
      const items: Record<string, unknown>[] = [];
      const removedIds: string[] = [];
      let revision = since;
      for (const d of bounded) {
        revision = d.revision;
        if (d.doc.deleted === true) removedIds.push(d.id);
        else items.push({ ...d.doc, id: d.id, revision: d.revision });
      }
      return { items, removedIds, revision };
    },

    async get(name, id): Promise<Record<string, unknown> | null> {
      const d = table(name).get(id);
      return d ? { ...d.doc, id: d.id, revision: d.revision } : null;
    },

    async findFirst(name, field, value): Promise<Record<string, unknown> | null> {
      const t = table(name);
      for (const d of t.values()) {
        if ((d.doc as Record<string, unknown>)[field] === value) return { ...d.doc, id: d.id, revision: d.revision };
      }
      return null;
    },

    async maxRevision(name): Promise<number> {
      const t = table(name);
      let max = 0;
      for (const d of t.values()) if (d.revision > max) max = d.revision;
      return max;
    },

    async put(name, id, doc): Promise<number> {
      const t = table(name);
      const previous = t.get(id);
      const revision = previous ? Math.max(previous.revision + 1, nextRevision()) : nextRevision();
      t.set(id, { id, revision, doc: { ...doc } });
      return revision;
    },

    async remove(name, id): Promise<number> {
      const t = table(name);
      const previous = t.get(id);
      const revision = previous ? Math.max(previous.revision + 1, nextRevision()) : nextRevision();
      t.set(id, { id, revision, doc: { deleted: true } });
      return revision;
    },
  };
}
