import type { Recipe } from '../catalog/types';
import { normalizeCategory } from '../catalog/course';
import { normalizeText } from '../shared/text';

export interface FilterOptions {
  maxBudget?: number; // In Dinars (DT)
  maxTotalTime?: number; // In minutes
  category?: string; // 'all' or MealCategory
  cuisineType?: string; // 'all' or CuisineType
  searchQuery?: string;
  healthyOnly?: boolean;
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
  if (maxBudget) list.push((r) => r.estimated_cost_tnd <= maxBudget);
  if (maxTotalTime) list.push((r) => r.prep_time_minutes + r.cook_time_minutes <= maxTotalTime);
  if (query) list.push((r) => [r.name_fr, r.name_derja, r.name_ar].some((n) => normalizeText(n).includes(query)));
  return list;
}

export function createRecipeFilter(filters?: FilterOptions): RecipePredicate {
  const list = predicates(filters);
  return (recipe) => list.every((test) => test(recipe));
}
