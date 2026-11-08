import type { Recipe } from './types';
import { normalizeRecipe } from './course';
import { initialRecipes } from './seed/initialRecipes';

/**
 * Version of the built-in catalog (seed/). Bump it when initialRecipes / initialIngredients
 * change: users who already have a cached catalog then receive the new recipes/ingredients
 * and the missing ingredient roles, without losing what the admin edited.
 */
export const SEED_VERSION = 4;

/** Adds roles/substitutes from the built-in catalog to recipes that do not have them yet. */
export function fillRolesFromSeed(recipes: Recipe[], seed: Recipe[] = initialRecipes): Recipe[] {
  const seedById = new Map(seed.map((r) => [r.id, r]));
  return recipes.map((recipe) => {
    const fromSeed = seedById.get(recipe.id);
    if (!fromSeed || recipe.ingredients.every((i) => i.role)) return recipe;
    return {
      ...recipe,
      ingredients: recipe.ingredients.map((item) => {
        if (item.role) return item;
        const seedItem = fromSeed.ingredients.find((s) => s.ingredient_id === item.ingredient_id);
        if (!seedItem?.role) return item;
        return {
          ...item,
          role: seedItem.role,
          ...(seedItem.substitutes && !item.substitutes ? { substitutes: seedItem.substitutes } : {}),
        };
      }),
    };
  });
}

/**
 * Brings stored recipes up to date with the current model: ingredient roles,
 * 3 courses (entrée / plat / dessert) and the healthy flag of built-in recipes.
 * Values edited by the admin are kept.
 */
export function migrateRecipes(recipes: Recipe[], seed: Recipe[] = initialRecipes): Recipe[] {
  const seedById = new Map(seed.map((r) => [r.id, r]));
  return fillRolesFromSeed(recipes, seed).map((recipe) => {
    const normalized = normalizeRecipe(recipe);
    const fromSeed = seedById.get(recipe.id);
    if (fromSeed && normalized.is_healthy === undefined && fromSeed.is_healthy !== undefined) {
      return { ...normalized, is_healthy: fromSeed.is_healthy };
    }
    return normalized;
  });
}

/** Adds the seed items that are not in `list` yet (matched by id), keeping existing ones untouched. */
export function mergeMissingById<T extends { id: string }>(list: T[], seed: T[]): T[] {
  const known = new Set(list.map((x) => x.id));
  return [...list, ...seed.filter((x) => !known.has(x.id))];
}
