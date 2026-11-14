import type { Ingredient, PriceRange, Recipe } from '../catalog/types';
import { addPriceRanges, roundPriceRange, ZERO_PRICE } from '../catalog/pricing';
import { recipeCostRange } from '../catalog/costEstimate';
import { collectRecipeIds } from './planner';
import type { DayPlan } from './types';

/**
 * Cost range of a whole weekly plan: each UNIQUE recipe of the plan is costed once
 * (recipeCostRange computes from ingredient prices, falling back to the chef's
 * estimate when the data is inconsistent). Recipes that no longer exist are skipped
 * and repeated meals are only counted a single time.
 */
export function planCostRange(plan: DayPlan[], recipes: Recipe[], ingredients: Ingredient[]): PriceRange {
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const ingredientsById = new Map(ingredients.map((i) => [i.id, i]));

  let total = ZERO_PRICE;
  const seen = new Set<string>();
  for (const recipeId of collectRecipeIds(plan)) {
    if (seen.has(recipeId)) continue;
    seen.add(recipeId);
    const recipe = recipeById.get(recipeId);
    if (!recipe) continue;
    total = addPriceRanges(total, recipeCostRange(recipe, ingredientsById));
  }
  return roundPriceRange(total);
}
