import type { Recipe } from '../catalog/types';
import { normalizeCategory } from '../catalog/course';
import { normalizeText } from '../shared/text';

export interface FilterOptions {
  maxBudget?: number; // In Dinars (DT)
  maxTotalTime?: number; // In minutes
  category?: string; // 'all' or MealCategory
  cuisineType?: string; // 'all' or CuisineType
  searchQuery?: string;
  /**
   * Ids found by the search engine for `searchQuery`, with their relevance. When present, they
   * replace the simple name filter (typos, derja spellings, ingredients, descriptions) and the
   * full list is ordered by relevance; when absent (engine not ready), the name filter applies.
   */
  searchMatches?: ReadonlyMap<string, number>;
  healthyOnly?: boolean;
  /** Managed categories accepted (a category and its sub-categories): a recipe in one of them passes */
  categoryIds?: ReadonlySet<string>;
}

type RecipePredicate = (recipe: Recipe) => boolean;

/** One predicate per active filter: adding a filter = adding one line here. */
function predicates(filters: FilterOptions = {}): RecipePredicate[] {
  const list: RecipePredicate[] = [(r) => r.is_published];
  const { category, cuisineType, maxBudget, maxTotalTime, healthyOnly } = filters;
  const query = filters.searchQuery?.trim() ? normalizeText(filters.searchQuery) : '';
  if (category && category !== 'all') list.push((r) => normalizeCategory(r.category) === category);
  if (cuisineType && cuisineType !== 'all') list.push((r) => r.cuisine_type === cuisineType);
  if (healthyOnly) list.push((r) => !!r.is_healthy);
  const categories = filters.categoryIds;
  if (categories) list.push((r) => (r.category_ids ?? []).some((id) => categories.has(id)));
  if (maxBudget) list.push((r) => r.estimated_cost_tnd <= maxBudget);
  if (maxTotalTime) list.push((r) => r.prep_time_minutes + r.cook_time_minutes <= maxTotalTime);
  const matches = filters.searchMatches;
  if (query && matches) list.push((r) => matches.has(r.id));
  else if (query) list.push((r) => [r.name_fr, r.name_derja, r.name_ar].some((n) => normalizeText(n).includes(query)));
  return list;
}

export function createRecipeFilter(filters?: FilterOptions): RecipePredicate {
  const list = predicates(filters);
  return (recipe) => list.every((test) => test(recipe));
}
