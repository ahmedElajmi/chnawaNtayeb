import { useState } from 'react';

/** Number of items rendered at first, and added by each "show more". */
export const PAGE_SIZE = 24;

export interface PagedList<T> {
  /** Items to render now (the first pages) */
  visible: T[];
  /** Size of the whole list: what counters show, never `visible.length` */
  total: number;
  hasMore: boolean;
  showMore: () => void;
}

/**
 * Progressive rendering of a long list (thousands of recipes or ingredients): only the first
 * pages are rendered, more on demand. Counters must use `total` (the whole list). The pages
 * start again from the top when `resetKey` changes (new search or filters), not when the list
 * itself is updated live.
 */
export function usePagedList<T>(items: readonly T[], resetKey: string, pageSize = PAGE_SIZE): PagedList<T> {
  // Pages shown for one reset key: a new key starts from the first page again
  const [pages, setPages] = useState({ key: resetKey, shown: pageSize });
  const shown = pages.key === resetKey ? pages.shown : pageSize;
  return {
    visible: items.slice(0, shown),
    total: items.length,
    hasMore: shown < items.length,
    showMore: () => setPages({ key: resetKey, shown: shown + pageSize }),
  };
}
