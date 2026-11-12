import type { Ingredient, Recipe } from '../catalog/types';
import { normalizeSearchText } from './normalize';

/**
 * What a search engine indexes for one catalog item: already normalized texts (all languages),
 * from the most important field to the least important one. Engines weigh the fields in this order.
 */
export interface SearchDocument {
  id: string;
  /** Names in every language */
  name: string;
  /** Related names (the ingredients of a recipe) */
  related: string;
  /** Longer texts (descriptions) */
  details: string;
}

/** Relative weight of each field, shared by every engine. */
export const SEARCH_FIELD_WEIGHTS: Readonly<Record<Exclude<keyof SearchDocument, 'id'>, number>> = {
  name: 3,
  related: 1.5,
  details: 1,
};

/** Search result: an item id and its relevance (higher is better, only comparable within one search). */
export interface SearchHit {
  id: string;
  score: number;
}

const join = (...texts: (string | undefined)[]) => normalizeSearchText(texts.filter(Boolean).join(' '));

/**
 * Every language version of a localized field (`name_fr`, `name_derja`, `name_ar`…). Read by prefix,
 * so a new language or language variant (e.g. derja in Arabic letters) is searchable without any
 * change here.
 */
export function localizedValues(item: object, field: string): string[] {
  const prefix = `${field}_`;
  return Object.entries(item)
    .filter(([key, value]) => key.startsWith(prefix) && typeof value === 'string')
    .map(([, value]) => value as string);
}

export function recipeSearchDocument(recipe: Recipe, ingredientsById: ReadonlyMap<string, Ingredient>): SearchDocument {
  const related = (recipe.ingredients ?? []).flatMap((line) => {
    const ingredient = ingredientsById.get(line.ingredient_id);
    return ingredient ? localizedValues(ingredient, 'name') : [];
  });
  return {
    id: recipe.id,
    name: join(...localizedValues(recipe, 'name')),
    related: join(...related),
    details: join(...localizedValues(recipe, 'description')),
  };
}

export function ingredientSearchDocument(ingredient: Ingredient): SearchDocument {
  return {
    id: ingredient.id,
    name: join(...localizedValues(ingredient, 'name')),
    related: '',
    details: '',
  };
}

/** Search results as `id → score`, the shape the list filters use. */
export function toSearchMatches(hits: readonly SearchHit[]): ReadonlyMap<string, number> {
  return new Map(hits.map((hit) => [hit.id, hit.score]));
}

/**
 * Orders items by search relevance (best first); items with the same score, or not in the results,
 * keep their current order.
 */
export function sortBySearchScore<T>(
  items: readonly T[],
  idOf: (item: T) => string,
  matches: ReadonlyMap<string, number>
): T[] {
  return items
    .map((item, index) => ({ item, index, score: matches.get(idOf(item)) ?? -Infinity }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}
