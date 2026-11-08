import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router';
import { matchRecipes, type MatchingResult } from '@/core/matching';
import { useCatalog, useKitchen, useMatchingSettings } from '@/app/ContainerContext';
import { PATHS, recipePath } from '@/shared/paths';
import { parseRecipeFilters, serializeRecipeFilters, type RecipeFilters } from './recipeFilters';
import { rememberRecipeFilters } from './filterMemory';

export interface RecipeMatches {
  ready: MatchingResult[];
  almost: MatchingResult[];
  ideas: MatchingResult[];
}

/** Recipes the user can cook with their fridge, grouped by tier, with the given filters applied. */
export function useRecipeMatches(filters: RecipeFilters): RecipeMatches {
  const { recipes, ingredients } = useCatalog();
  const { fridge, pantry, favorites } = useKitchen();
  const { config } = useMatchingSettings();

  return useMemo(() => {
    const result = matchRecipes(
      recipes,
      fridge,
      {
        maxBudget: filters.maxBudget,
        maxTotalTime: filters.maxTime,
        cuisineType: filters.cuisine,
        category: filters.course,
        healthyOnly: filters.healthyOnly,
        searchQuery: filters.query,
      },
      { pantryIds: pantry, catalog: ingredients, config }
    );
    const keep = (list: MatchingResult[]) =>
      filters.favoritesOnly ? list.filter((r) => favorites.includes(r.recipe.id)) : list;
    return { ready: keep(result.ready), almost: keep(result.almost), ideas: keep(result.ideas) };
  }, [recipes, ingredients, fridge, pantry, favorites, filters, config]);
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
 * Filters of the recipe list, read from and written to the address.
 * While a recipe is open on top of the list, the list keeps the filters of the address it came from.
 */
export function useRecipeFiltersInUrl(): [RecipeFilters, (patch: Partial<RecipeFilters>) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const background = (location.state as RecipeOverlayState | null)?.background;
  const search = background?.pathname === PATHS.recipes ? background.search : location.search;
  const filters = useMemo(() => parseRecipeFilters(search), [search]);
  useEffect(() => rememberRecipeFilters(filters), [filters]);

  const update = useCallback(
    (patch: Partial<RecipeFilters>) =>
      navigate(
        { pathname: PATHS.recipes, search: serializeRecipeFilters({ ...filters, ...patch }) },
        { replace: true }
      ),
    [navigate, filters]
  );
  return [filters, update];
}
