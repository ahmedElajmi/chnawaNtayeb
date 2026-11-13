import { MEAL_CATEGORIES, type MealCategory } from '@/core/catalog';
import type { MatchTier } from '@/core/matching';

/**
 * Filters of the recipe list, kept in the address (/recettes?temps=30&plat=dessert)
 * so a search can be shared, bookmarked and survives a reload.
 */
export interface RecipeFilters {
  query: string;
  maxBudget?: number;
  maxTime?: number;
  cuisine: string; // 'all' or a CuisineType
  course: 'all' | MealCategory;
  healthyOnly: boolean;
  tier: 'all' | MatchTier;
  favoritesOnly: boolean;
  /** Managed category (its sub-categories included); absent = every category */
  category?: string;
}

export const DEFAULT_RECIPE_FILTERS: RecipeFilters = {
  query: '',
  cuisine: 'all',
  course: 'all',
  healthyOnly: false,
  tier: 'all',
  favoritesOnly: false,
};

const TIERS: MatchTier[] = ['ready', 'almost', 'ideas'];

function positiveNumber(value: string | null): number | undefined {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseRecipeFilters(search: string | URLSearchParams): RecipeFilters {
  const p = typeof search === 'string' ? new URLSearchParams(search) : search;
  const course = p.get('plat');
  const tier = p.get('niveau');
  return {
    query: p.get('q') ?? '',
    maxBudget: positiveNumber(p.get('budget')),
    maxTime: positiveNumber(p.get('temps')),
    cuisine: p.get('cuisine') || 'all',
    course: MEAL_CATEGORIES.includes(course as MealCategory) ? (course as MealCategory) : 'all',
    healthyOnly: p.get('healthy') === '1',
    tier: TIERS.includes(tier as MatchTier) ? (tier as MatchTier) : 'all',
    favoritesOnly: p.get('favoris') === '1',
    ...(/^[a-z0-9_-]{1,64}$/.test(p.get('categorie') ?? '') ? { category: p.get('categorie')! } : {}),
  };
}

/** Only non-default values are written, so the default list is plain /recettes. */
export function serializeRecipeFilters(filters: Partial<RecipeFilters>): string {
  const f = { ...DEFAULT_RECIPE_FILTERS, ...filters };
  const p = new URLSearchParams();
  if (f.query) p.set('q', f.query);
  if (f.maxBudget) p.set('budget', String(f.maxBudget));
  if (f.maxTime) p.set('temps', String(f.maxTime));
  if (f.cuisine !== 'all') p.set('cuisine', f.cuisine);
  if (f.course !== 'all') p.set('plat', f.course);
  if (f.healthyOnly) p.set('healthy', '1');
  if (f.tier !== 'all') p.set('niveau', f.tier);
  if (f.favoritesOnly) p.set('favoris', '1');
  if (f.category) p.set('categorie', f.category);
  const query = p.toString();
  return query ? `?${query}` : '';
}
