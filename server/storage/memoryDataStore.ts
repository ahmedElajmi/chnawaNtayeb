import type {
  CollectionName,
  CommitResult,
  DataStore,
  DirectoryPage,
  DirectoryQuery,
  StorageChanges,
  TransactOutcome,
  WriteGuard,
} from './types';
import { normalizeCursor } from './types';
import { assertCommitEnvelope, assertWritable, stripUndefined } from './validation';

interface StoredDoc {
  id: string;
  revision: number;
  doc: Record<string, unknown>;
}
  id: string;
  revision: number;
  doc: Record<string, unknown>;
}

/**
 * In-memory reference implementation of the DataStore contract: strictly increasing
 * per-collection revisions, deletion markers, structured change cursor. Used by the
 * contract suite and as the blueprint every real backend must reproduce.
 */
export function createMemoryDataStore(): DataStore {
  const collections = new Map<CollectionName, Map<string, StoredDoc>>();
  /** Next revision per collection: max(stored)+1, never reused, never decreasing. */
  const counters = new Map<CollectionName, number>();

  const table = (name: CollectionName): Map<string, StoredDoc> => {
    let t = collections.get(name);
    if (!t) {
      t = new Map();
      collections.set(name, t);
    }
    return t;
  };

  const nextRevision = (name: CollectionName): number => {
    const next = (counters.get(name) ?? 0) + 1;
    counters.set(name, next);
    return next;
  };

  const guardValue = (guard: WriteGuard): number | null => {
    const d = table(guard.name).get(guard.id);
    if (!d || d.doc.deleted === true) return null;
    const value = (d.doc as Record<string, unknown>)[guard.field];
    return typeof value === 'number' ? value : null;
  };

  const writeOne = (name: CollectionName, id: string, doc: Record<string, unknown>, revision: number): void => {
    // The stored shape is the sanitized one: `undefined` leaves the document (a removed field
    // is absent on every provider), and validation applies to that same shape.
    const clean = stripUndefined(doc) as Record<string, unknown>;
    assertWritable(name, id, clean);
    table(name).set(id, { id, revision, doc: clean });
  };

  /** The contract order of a collection: (revision, id) — the single pagination authority. */
  const ordered = (name: CollectionName): StoredDoc[] =>
    [...table(name).values()].sort((a, b) => a.revision - b.revision || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    async changes(name, cursor, limit): Promise<StorageChanges> {
      const c = normalizeCursor(cursor);
      const inclusive = typeof cursor === 'object' && cursor.id === undefined; // resume at the whole revision
      const keeps = (d: StoredDoc): boolean =>
        inclusive
          ? d.revision >= c.revision
          : c.id !== undefined
            ? d.revision > c.revision || (d.revision === c.revision && d.id > c.id)
            : d.revision > c.revision; // legacy number cursor: strict, as before
      const L = Math.max(1, limit);
      const all = ordered(name);
      const page: StoredDoc[] = [];
      for (const d of all) {
        if (keeps(d)) page.push(d);
        if (page.length >= L) break;
      }
      // A revision's tie set (one commit's changes) is never cut: complete the last delivered
      // revision even past the limit — the limit is soft by contract.
      if (page.length >= L && page.length > 0) {
        const tieRevision = page[page.length - 1].revision;
        const stop = all.indexOf(page[page.length - 1]);
        for (let i = stop + 1; i < all.length && all[i].revision === tieRevision; i++) {
          if (keeps(all[i])) page.push(all[i]);
        }
      }
      const items: Record<string, unknown>[] = [];
      const removedIds: string[] = [];
      let revision = c.revision;
      for (const d of page) {
        revision = d.revision;
        if (d.doc.deleted === true) removedIds.push(d.id);
        else items.push({ ...d.doc, id: d.id, revision: d.revision });
      }
      const last = page.at(-1);
      // `more` = a next call from the returned cursor would answer something (exact, not a
      // heuristic): the memory adapter sees the whole ordered feed, free of charge.
      const cur = last ? { revision: last.revision, id: last.id } : c;
      let more = false;
      if (last) {
        const stop = all.indexOf(last);
        for (let i = stop + 1; i < all.length && !more; i++) {
          const d = all[i];
          more = d.revision > cur.revision || (d.revision === cur.revision && d.id > (cur.id as string));
        }
      }
      return {
        items,
        removedIds,
        revision,
        ...(last ? { cursor: cur } : {}),
        more,
      };
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
      const orderedById = filtered.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const start = query.after ? orderedById.findIndex((d) => d.id === query.after) + 1 : 0;
      const bounded = orderedById.slice(start, start + Math.max(1, query.limit));
      return {
        items: bounded.map((d) => ({ ...d.doc, id: d.id, revision: d.revision })),
        total: filtered.length,
        nextCursor: start + bounded.length < orderedById.length ? (bounded.at(-1)?.id ?? null) : null,
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
      const clean = stripUndefined(doc) as Record<string, unknown>;
      assertWritable(name, id, clean);
      const revision = nextRevision(name);
      writeOne(name, id, clean, revision);
      return revision;
    },

    async remove(name, id): Promise<number> {
      assertWritable(name, id, { deleted: true });
      const revision = nextRevision(name);
      writeOne(name, id, { deleted: true }, revision);
      return revision;
    },

    async commit(ops, guard): Promise<CommitResult> {
      assertCommitEnvelope(ops);
      if (guard && guardValue(guard) !== guard.expected) return { ok: false, conflict: true };
      // Every collection touched gets ONE revision shared by all its ops (a commit is one
      // moment of the collection's history — the tie set a cursor group covers completely).
      const perCollection = new Map<CollectionName, number>();
      for (const op of ops) {
        if (!perCollection.has(op.name)) perCollection.set(op.name, nextRevision(op.name));
      }
      let revision = 0;
      for (const op of ops) {
        const value = perCollection.get(op.name) as number;
        writeOne(op.name, op.id, op.doc, value);
        if (value > revision) revision = value;
      }
      return { ok: true, revision };
    },

    async transact<T>(
      name: CollectionName,
      id: string,
      operation: (current: Record<string, unknown> | null) => TransactOutcome<T>
    ): Promise<T> {
      // A single synchronous pass: Node runs it without interleaving, so the read and the
      // write are atomic by construction (the blueprint every real backend must reproduce).
      const stored = table(name).get(id);
      const current =
        stored && stored.doc.deleted !== true ? { ...stored.doc, id: stored.id, revision: stored.revision } : null;
      const outcome: TransactOutcome<T> = operation(current);
      if (outcome.next && outcome.next !== current) {
        const doc = { ...outcome.next };
        delete doc.id;
        delete doc.revision;
        const clean = stripUndefined(doc) as Record<string, unknown>;
        assertWritable(name, id, clean);
        writeOne(name, id, clean, nextRevision(name));
      }
      return outcome.result;
    },
  };
}
