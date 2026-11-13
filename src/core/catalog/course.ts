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

const CATEGORY_ID = /^[a-z0-9_-]{1,64}$/;

/** Managed categories of a recipe: valid ids, each once (unknown values dropped). */
export function normalizeCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && CATEGORY_ID.test(x)))];
}

export function normalizeRecipe(recipe: Recipe): Recipe {
  const category = normalizeCategory(recipe.category);
  const ids = normalizeCategoryIds(recipe.category_ids);
  const sameIds =
    Array.isArray(recipe.category_ids) &&
    ids.length === recipe.category_ids.length &&
    ids.every((id, i) => id === recipe.category_ids![i]);
  if (category === recipe.category && (sameIds || (ids.length === 0 && recipe.category_ids === undefined)))
    return recipe;
  const { category_ids: _ids, ...rest } = recipe;
  return { ...rest, category, ...(ids.length ? { category_ids: ids } : {}) };
}

export function isExpress(recipe: Pick<Recipe, 'prep_time_minutes' | 'cook_time_minutes'>): boolean {
  return recipe.prep_time_minutes + recipe.cook_time_minutes <= EXPRESS_MAX_MINUTES;
}
