import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router';
import { browseRecipes, matchRecipes, type FilterOptions, type MatchingResult } from '@/core/matching';
import { useCatalog, useKitchen, useMatchingSettings, useSearchMatches } from '@/app/ContainerContext';
import { recipePath, type RecipeListPath } from '@/shared/paths';
import { parseRecipeFilters, serializeRecipeFilters, type RecipeFilters } from './recipeFilters';
import { rememberRecipeFilters } from './filterMemory';

export interface RecipeMatches {
  ready: MatchingResult[];
  almost: MatchingResult[];
  ideas: MatchingResult[];
}

const toFilterOptions = (filters: RecipeFilters, searchMatches?: ReadonlyMap<string, number>): FilterOptions => ({
  maxBudget: filters.maxBudget,
  maxTotalTime: filters.maxTime,
  cuisineType: filters.cuisine,
  category: filters.course,
  healthyOnly: filters.healthyOnly,
  searchQuery: filters.query,
  searchMatches,
});

/** Shared inputs of the two recipe lists. */
function useMatchingInputs(filters: RecipeFilters) {
  const { recipes, ingredients } = useCatalog();
  const { fridge, pantry, favorites } = useKitchen();
  const { config } = useMatchingSettings();
  const searchMatches = useSearchMatches('recipes', filters.query ?? '');
  return useMemo(() => {
    const keep = (list: MatchingResult[]) =>
      filters.favoritesOnly ? list.filter((r) => favorites.includes(r.recipe.id)) : list;
    const ctx = { pantryIds: pantry, catalog: ingredients, config };
    return { recipes, fridge, options: toFilterOptions(filters, searchMatches), ctx, keep };
  }, [recipes, ingredients, fridge, pantry, favorites, filters, config, searchMatches]);
}

/** Recipes the user can cook with their fridge, grouped by tier, with the given filters applied. */
export function useRecipeMatches(filters: RecipeFilters): RecipeMatches {
  const { recipes, fridge, options, ctx, keep } = useMatchingInputs(filters);
  return useMemo(() => {
    const result = matchRecipes(recipes, fridge, options, ctx);
    return { ready: keep(result.ready), almost: keep(result.almost), ideas: keep(result.ideas) };
  }, [recipes, fridge, options, ctx, keep]);
}

/** Every recipe of the catalog with the given filters applied (fridge suggestions first). */
export function useRecipeCatalog(filters: RecipeFilters): MatchingResult[] {
  const { recipes, fridge, options, ctx, keep } = useMatchingInputs(filters);
  return useMemo(() => keep(browseRecipes(recipes, fridge, options, ctx)), [recipes, fridge, options, ctx, keep]);
}

/** State carried by the recipe address when it is opened over another screen. */
export interface RecipeOverlayState {
  background?: Location;
}

/** Opens a recipe at /recette/<slug>, on top of the current screen (back closes it). */
export function useOpenRecipe(): (recipeId: string) => void {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipes } = useCatalog();
  return useCallback(
    (recipeId: string) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      const background = (location.state as RecipeOverlayState | null)?.background ?? location;
      navigate(recipePath(recipe.slug), { state: { background } satisfies RecipeOverlayState });
    },
    [navigate, location, recipes]
  );
}

/**
 * Filters of a recipe list screen, read from and written to its address.
 * While a recipe is open on top of the list, the list keeps the filters of the address it came from.
 */
export function useRecipeFiltersInUrl(
  pathname: RecipeListPath
): [RecipeFilters, (patch: Partial<RecipeFilters>) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const background = (location.state as RecipeOverlayState | null)?.background;
  const search = background?.pathname === pathname ? background.search : location.search;
  const filters = useMemo(() => parseRecipeFilters(search), [search]);
  useEffect(() => rememberRecipeFilters(filters), [filters]);

  const update = useCallback(
    (patch: Partial<RecipeFilters>) =>
      navigate({ pathname, search: serializeRecipeFilters({ ...filters, ...patch }) }, { replace: true }),
    [navigate, filters, pathname]
  );
  return [filters, update];
}
