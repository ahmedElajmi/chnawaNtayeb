import { useLocation } from 'react-router';
import { isRecipeListPath, PATHS, type RecipeListPath } from '@/shared/paths';
import {
  DEFAULT_RECIPE_FILTERS,
  parseRecipeFilters,
  serializeRecipeFilters,
  type RecipeFilters,
} from './recipeFilters';

/**
 * The recipe filters follow the user from screen to screen (as before the router):
 * every link to the recipe list carries the last filters used, and a shortcut
 * (e.g. "Plats Express") only changes its own filter. Kept for the session only.
 */
let remembered: RecipeFilters = DEFAULT_RECIPE_FILTERS;

export function rememberRecipeFilters(filters: RecipeFilters): void {
  remembered = filters;
}

/**
 * Builds the address of a recipe list (the catalog by default, or the suggestions) with the
 * current filters (those of the address when a list is on screen, the remembered ones otherwise),
 * optionally changing some. The tier filter only exists on the suggestions screen.
 */
export function useRecipesHref(target: RecipeListPath = PATHS.recipes): (patch?: Partial<RecipeFilters>) => string {
  const { pathname, search } = useLocation();
  const current = isRecipeListPath(pathname) ? parseRecipeFilters(search) : remembered;
  return (patch: Partial<RecipeFilters> = {}) => {
    const next = { ...current, ...patch };
    if (target === PATHS.recipes) next.tier = 'all';
    return target + serializeRecipeFilters(next);
  };
}
