import type {
  CollectionName,
  CommitResult,
  DataStore,
  DirectoryPage,
  DirectoryQuery,
  StorageChanges,
  WriteGuard,
} from './types';

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

  const guardValue = (guard: WriteGuard): number | null => {
    const d = table(guard.name).get(guard.id);
    if (!d || d.doc.deleted === true) return null;
    const value = (d.doc as Record<string, unknown>)[guard.field];
    return typeof value === 'number' ? value : null;
  };

  const writeOne = (name: CollectionName, id: string, doc: Record<string, unknown>): number => {
    const t = table(name);
    const previous = t.get(id);
    const revision = previous ? Math.max(previous.revision + 1, nextRevision()) : nextRevision();
    t.set(id, { id, revision, doc: { ...doc } });
    return revision;
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
      return { items, removedIds, revision, more: changed.length > bounded.length };
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

    async findWhere(name, field, value, limit): Promise<Record<string, unknown>[]> {
      const found: Record<string, unknown>[] = [];
      for (const d of table(name).values()) {
        if ((d.doc as Record<string, unknown>)[field] === value) {
          found.push({ ...d.doc, id: d.id, revision: d.revision });
          if (found.length >= Math.max(1, limit)) break;
        }
      }
      return found;
    },

    async page(name, query: DirectoryQuery): Promise<DirectoryPage> {
      const all = [...table(name).values()].filter((d) => d.doc.deleted !== true);
      const filtered = all.filter((d) => {
        const doc = d.doc as Record<string, unknown>;
        if (query.where && doc[query.where.field] !== query.where.value) return false;
        if (query.prefix) {
          const value = doc[query.prefix.field];
          if (typeof value !== 'string' || value < query.prefix.value || value > `${query.prefix.value}\uf8ff`) {
            return false;
          }
        }
        return true;
      });
      const ordered = filtered.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const start = query.after ? ordered.findIndex((d) => d.id === query.after) + 1 : 0;
      const bounded = ordered.slice(start, start + Math.max(1, query.limit));
      return {
        items: bounded.map((d) => ({ ...d.doc, id: d.id, revision: d.revision })),
        total: filtered.length,
        nextCursor: start + bounded.length < ordered.length ? (bounded.at(-1)?.id ?? null) : null,
      };
    },

    async ids(name): Promise<string[]> {
      return [...table(name).keys()];
    },

    async maxRevision(name): Promise<number> {
      const t = table(name);
      let max = 0;
      for (const d of t.values()) if (d.revision > max) max = d.revision;
      return max;
    },

    async put(name, id, doc): Promise<number> {
      return writeOne(name, id, doc);
    },

    async remove(name, id): Promise<number> {
      const t = table(name);
      const previous = t.get(id);
      const revision = previous ? Math.max(previous.revision + 1, nextRevision()) : nextRevision();
      t.set(id, { id, revision, doc: { deleted: true } });
      return revision;
    },

    async commit(ops, guard): Promise<CommitResult> {
      if (guard && guardValue(guard) !== guard.expected) return { ok: false, conflict: true };
      let revision = 0;
      for (const op of ops) {
        revision = writeOne(op.name, op.id, op.doc);
      }
      return { ok: true, revision };
    },
  };
}
