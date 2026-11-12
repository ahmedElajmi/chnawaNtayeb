import MiniSearch from 'minisearch';
import { SEARCH_FIELD_WEIGHTS, type SearchDocument } from '@/core/search';
import type { SearchEngine } from '@/application';

/**
 * Allowed typos per query word: none under 5 letters ("oeuf" must not find "boeuf"), 1 up to
 * 8 letters, then 2 (the usual thresholds of search engines).
 */
export function allowedTypos(term: string): number {
  if (term.length < 5) return 0;
  return term.length < 9 ? 1 : 2;
}

/**
 * SearchEngine on the device with MiniSearch (MIT, ~6 kB): works offline, nothing is sent anywhere.
 * Texts arrive already normalized by the core, so words are only split on spaces.
 * Every query word must be found (AND), as the beginning of a word or with a few typos.
 */
export function createMiniSearchEngine(): SearchEngine {
  const fields = Object.keys(SEARCH_FIELD_WEIGHTS);
  const create = () =>
    new MiniSearch<SearchDocument>({
      fields,
      storeFields: [],
      tokenize: (text) => text.split(' '),
      processTerm: (term) => term || null,
      searchOptions: {
        boost: { ...SEARCH_FIELD_WEIGHTS },
        combineWith: 'AND',
        prefix: true,
        fuzzy: (term) => allowedTypos(term),
      },
    });
  let index = create();

  return {
    async rebuild(documents) {
      index = create();
      index.addAll(documents);
    },
    async upsert(documents) {
      for (const doc of documents) {
        if (index.has(doc.id)) index.replace(doc);
        else index.add(doc);
      }
    },
    async remove(ids) {
      for (const id of ids) if (index.has(id)) index.discard(id);
    },
    async search(query) {
      if (!query.trim()) return [];
      return index.search(query).map((result) => ({ id: String(result.id), score: result.score }));
    },
  };
}
