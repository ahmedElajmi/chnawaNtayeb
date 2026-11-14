import type { Ingredient, PriceRange } from '../catalog/types';
import { addPriceRanges, ingredientPriceRange, roundPriceRange, ZERO_PRICE } from '../catalog/pricing';
import { purchaseUnits } from '../catalog/costEstimate';
import type { GroceryItem } from './types';

/**
 * Cost range of a shopping list: each item is converted to its ingredient's purchase
 * unit (by ingredient_id, then by name) and multiplied by the ingredient's price range.
 * Items with no matching ingredient or an incomparable unit are left out of the total.
 */
export function groceryCost(items: GroceryItem[], ingredientsById: ReadonlyMap<string, Ingredient>): PriceRange {
  // Name index built once: custom or legacy items may only carry the French name
  const byName = new Map<string, Ingredient>();
  for (const ingredient of ingredientsById.values()) {
    if (!byName.has(ingredient.name_fr)) byName.set(ingredient.name_fr, ingredient);
  }

  let total = ZERO_PRICE;
  for (const item of items) {
    const ingredient =
      (item.ingredient_id ? ingredientsById.get(item.ingredient_id) : undefined) ?? byName.get(item.name);
    if (!ingredient) continue;
    const units = purchaseUnits(item.quantity, item.unit, ingredient.unit_default);
    if (units === null) continue;
    const price = ingredientPriceRange(ingredient);
    total = addPriceRanges(total, { min: units * price.min, max: units * price.max });
  }
  return roundPriceRange(total);
}
