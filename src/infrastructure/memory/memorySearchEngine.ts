import { SEARCH_FIELD_WEIGHTS, type SearchDocument, type SearchHit } from '@/core/search';
import type { SearchEngine } from '@/application';

const FIELDS = Object.keys(SEARCH_FIELD_WEIGHTS) as (keyof typeof SEARCH_FIELD_WEIGHTS)[];

/**
 * Search engine held in memory: reference implementation of SearchEngine (the behaviour every engine
 * must reproduce), used by tests. Simple and exact: a query word matches an indexed word that starts
 * with it; every query word must match; no typo tolerance.
 */
export function createMemorySearchEngine(): SearchEngine {
  const docs = new Map<string, Record<keyof typeof SEARCH_FIELD_WEIGHTS, string[]>>();

  const store = (doc: SearchDocument) =>
    docs.set(doc.id, {
      name: doc.name.split(' ').filter(Boolean),
      related: doc.related.split(' ').filter(Boolean),
      details: doc.details.split(' ').filter(Boolean),
    });

  return {
    async rebuild(documents) {
      docs.clear();
      documents.forEach(store);
    },
    async upsert(documents) {
      documents.forEach(store);
    },
    async remove(ids) {
      ids.forEach((id) => docs.delete(id));
    },
    async search(query) {
      const terms = query.split(' ').filter(Boolean);
      if (!terms.length) return [];
      const hits: SearchHit[] = [];
      for (const [id, fields] of docs) {
        let score = 0;
        const all = terms.every((term) => {
          const weights = FIELDS.filter((f) => fields[f].some((word) => word.startsWith(term))).map(
            (f) => SEARCH_FIELD_WEIGHTS[f]
          );
          score += weights.reduce((a, b) => a + b, 0);
          return weights.length > 0;
        });
        if (all) hits.push({ id, score });
      }
      return hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    },
  };
}
