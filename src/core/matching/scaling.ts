import type { Recipe } from '../catalog/types';

/** Ingredient quantities for another number of servings (rounded for the kitchen). */
export function scaleIngredients(
  recipe: Recipe,
  targetServings: number
): { ingredient_id: string; quantity: number; unit: string; is_optional?: boolean }[] {
  const ratio = Math.max(1, targetServings) / Math.max(1, recipe.base_servings);

  return recipe.ingredients.map((item) => {
    const rawQty = item.quantity_base * ratio;
    const rounded = rawQty >= 10 ? Math.round(rawQty) : Math.round(rawQty * 10) / 10;
    return {
      ingredient_id: item.ingredient_id,
      quantity: rounded,
      unit: item.unit,
      is_optional: item.is_optional,
    };
  });
}
