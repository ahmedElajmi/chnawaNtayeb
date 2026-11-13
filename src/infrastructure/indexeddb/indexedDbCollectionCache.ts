import type { Versioned } from '@/core/sync';
import type { CollectionCopy, LocalCollectionCache } from '@/application';

/**
 * Device copy of shared collections in IndexedDB: one object store per collection (items
 * stored one by one, so a change only rewrites the changed items) and one `meta` store
 * holding each collection's newest revision. Large volumes (thousands of recipes) fit,
 * unlike localStorage (about 5 MB).
 */

export const COLLECTIONS = [
  'recipes',
  'ingredients',
  'recipes_workspace',
  'ingredients_workspace',
  'recipe_categories',
  'ingredient_categories',
  'countries',
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

const DB_NAME = 'chnowa';
// 2: workspaces of the validation workflow; 3: categories; 4: countries (stores created on upgrade, existing ones kept)
const DB_VERSION = 4;
const META = 'meta';

interface Meta {
  collection: string;
  revision: number | null;
  savedAt: number;
}

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of COLLECTIONS)
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'collection' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export interface IndexedDbCacheOptions {
  /** IndexedDB implementation (the browser's by default; a fake one in tests) */
  factory?: IDBFactory;
  /**
   * Older device copy to move over once (previous versions kept the catalog in localStorage).
   * Returns the raw items, or null when there is none; `forget` deletes it after the move.
   */
  legacy?: { read: () => unknown[] | null; forget: () => void };
}

export function createIndexedDbCollectionCache<T extends Versioned>(
  collection: CollectionName,
  options: IndexedDbCacheOptions = {}
): LocalCollectionCache<T> {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => {
    const factory = options.factory ?? globalThis.indexedDB;
    if (!factory) return Promise.reject(new Error('IndexedDB unavailable'));
    dbPromise ??= openDb(factory);
    return dbPromise;
  };

  const writeAll = async (copy: CollectionCopy<T>) => {
    const tx = (await db()).transaction([collection, META], 'readwrite');
    const items = tx.objectStore(collection);
    items.clear();
    for (const item of copy.items) items.put(item);
    tx.objectStore(META).put({ collection, revision: copy.revision, savedAt: copy.savedAt } satisfies Meta);
    await done(tx);
  };

  return {
    async load() {
      const tx = (await db()).transaction([collection, META], 'readonly');
      const [meta, items] = await Promise.all([
        result(tx.objectStore(META).get(collection) as IDBRequest<Meta | undefined>),
        result(tx.objectStore(collection).getAll()),
      ]);
      if (meta) return { items, revision: meta.revision, savedAt: meta.savedAt };

      const legacy = options.legacy?.read();
      if (!legacy) return null;
      // First visit since the move to IndexedDB: the old copy is read in full by the next sync
      const moved = { items: legacy as T[], revision: null, savedAt: 0 };
      await writeAll(moved);
      options.legacy?.forget();
      return moved;
    },

    replace: writeAll,

    async update(changes, meta) {
      const tx = (await db()).transaction([collection, META], 'readwrite');
      const items = tx.objectStore(collection);
      for (const id of changes.removedIds) items.delete(id);
      for (const item of changes.items) {
        if (item.deleted) items.delete(item.id);
        else items.put(item);
      }
      tx.objectStore(META).put({ collection, ...meta } satisfies Meta);
      await done(tx);
    },
  };
}
