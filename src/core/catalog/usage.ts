import { normalizeText } from '../shared';
import type { Ingredient, Recipe } from './types';

/** Number of recipes that use each ingredient (as ingredient or as a recipe-specific substitute). */
export function countIngredientUsage(recipes: Pick<Recipe, 'ingredients'>[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    const ids = new Set(recipe.ingredients.flatMap((i) => [i.ingredient_id, ...(i.substitutes ?? [])]));
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Another ingredient of the catalog with the same French name (case, accents and spaces ignored). */
export function findDuplicateIngredient(
  nameFr: string,
  ingredients: Pick<Ingredient, 'id' | 'name_fr'>[],
  excludeId?: string
): Pick<Ingredient, 'id' | 'name_fr'> | undefined {
  const key = normalizeText(nameFr).trim();
  if (!key) return undefined;
  return ingredients.find((i) => i.id !== excludeId && normalizeText(i.name_fr).trim() === key);
}
