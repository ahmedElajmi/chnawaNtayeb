import { useLocation } from 'react-router';
import { PATHS } from '@/shared/paths';
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
 * Builds the address of the recipe list with the current filters (those of the address
 * when the list is on screen, the remembered ones otherwise), optionally changing some.
 */
export function useRecipesHref(): (patch?: Partial<RecipeFilters>) => string {
  const { pathname, search } = useLocation();
  const current = pathname === PATHS.recipes ? parseRecipeFilters(search) : remembered;
  return (patch: Partial<RecipeFilters> = {}) => PATHS.recipes + serializeRecipeFilters({ ...current, ...patch });
}
