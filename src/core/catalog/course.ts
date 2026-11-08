import { MealCategory, Recipe } from './types';

/** Total time under which a dish gets the "Express" label. */
export const EXPRESS_MAX_MINUTES = 20;

/**
 * Converts any stored category (including the old values `express`,
 * `kaskrout`, `soupe`) to one of the three courses.
 */
export function normalizeCategory(raw: unknown): MealCategory {
  if (raw === 'entree' || raw === 'soupe') return 'entree';
  if (raw === 'dessert') return 'dessert';
  return 'plat_principal';
}

export function normalizeRecipe(recipe: Recipe): Recipe {
  const category = normalizeCategory(recipe.category);
  return category === recipe.category ? recipe : { ...recipe, category };
}

export function isExpress(recipe: Pick<Recipe, 'prep_time_minutes' | 'cook_time_minutes'>): boolean {
  return recipe.prep_time_minutes + recipe.cook_time_minutes <= EXPRESS_MAX_MINUTES;
}
