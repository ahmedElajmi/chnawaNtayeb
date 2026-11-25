import type { DataStore, SyncCursor } from './types';

/** The public collections the server-side SEO pages render (the readable copy of the site). */
export type PublishedCollection = 'recipes' | 'ingredients' | 'ingredient_categories';

export const PUBLISHED_COLLECTIONS: readonly PublishedCollection[] = [
  'recipes',
  'ingredients',
  'ingredient_categories',
];

/** One change page of a published collection, with the exact position to resume from. */
export interface PublishedChanges {
  /** Documents written since the cursor (deletion markers excluded) */
  items: Record<string, unknown>[];
  /** Ids published as deleted since the cursor */
  removedIds: string[];
  /** Exact position to pass back to resume after the last delivered change */
  cursor: SyncCursor;
  /** True when the page was bounded: the reader must catch up again right away */
  more: boolean;
}

/**
 * Read-only port of the published catalog for the server-side SEO (server/seo.ts): the change
 * feed of the public collections, the same pages the devices receive. The storage contract is
 * the only pagination authority — no second cursor, and no write is ever exposed to the page
 * rendering.
 */
export interface PublishedCatalogSource {
  /** null cursor = the first catch-up, from the very beginning of the collection */
  changes(name: PublishedCollection, cursor: SyncCursor | null, limit: number): Promise<PublishedChanges>;
}

/** Adapter of the port over the storage contract. A null store means "not configured":
 * the reader then sees an empty feed and serves the built-in fallback, as before. */
export function contractPublishedCatalog(store: DataStore | null): PublishedCatalogSource {
  return {
    async changes(name, cursor, limit) {
      if (!store) return { items: [], removedIds: [], cursor: cursor ?? { revision: 0 }, more: false };
      const delta = await store.changes(name, cursor ?? 0, limit);
      return {
        items: delta.items,
        removedIds: delta.removedIds,
        cursor: delta.cursor ?? { revision: delta.revision },
        more: delta.more === true,
      };
    },
  };
}
