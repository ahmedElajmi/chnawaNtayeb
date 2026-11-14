import type { Ingredient, PriceRange, Recipe } from './types';
import { addPriceRanges, roundPriceRange, ZERO_PRICE } from './pricing';
import { parseMeasure } from '../units';

// Unit parsing lives in @/core/units; re-exported here for the existing catalog API
export { parseMeasure };

/** How many purchase units of the ingredient a recipe quantity represents, or null if not comparable. */
export function purchaseUnits(quantity: number, unit: string, purchaseUnit: string): number | null {
  const need = parseMeasure(unit);
  const sold = parseMeasure(purchaseUnit);
  if (!need || !sold || need.kind !== sold.kind || sold.amount <= 0) return null;
  if (need.kind === 'count' && need.label !== sold.label) return null;
  return (quantity * need.amount) / sold.amount;
}

/**
 * A recipe needing more purchase units than this of one ingredient reveals inconsistent data
 * (e.g. "600 g" of an ingredient whose price is given for "g" but really is for 500 g):
 * that ingredient is left out of the cost instead of producing an absurd amount.
 */
export const MAX_PURCHASE_UNITS = 50;

/** A computed cost this many times above the chef's estimate is not trusted (the estimate is shown). */
export const MAX_COST_OVER_ESTIMATE = 5;

/** Above this price per kg (or per L), the price was surely given for another unit (a pack, not a gram). */
export const MAX_PRICE_PER_KG = 500;

/**
 * True when the purchase unit and the price do not fit together: e.g. unit "g" with the price of
 * a 250 g pack (3 DT per gram = 3000 DT per kg). Such an ingredient is left out of computed costs
 * and refused by the ingredient form, and the backoffice lists it to be corrected.
 */
export function hasImplausibleUnitPrice(ingredient: Pick<Ingredient, 'unit_default' | 'price_max_tnd'>): boolean {
  const measure = parseMeasure(ingredient.unit_default);
  if (!measure || measure.kind === 'count' || measure.amount <= 0) return false;
  return (ingredient.price_max_tnd / measure.amount) * 1000 > MAX_PRICE_PER_KG;
}

export interface RecipeCostSuggestion {
  /** Cost range of the priced ingredients, for the base servings */
  range: PriceRange;
  priced: number;
  /** Ingredient ids whose quantity could not be converted to their purchase unit (or not plausibly) */
  unpriced: string[];
  /** Among them, those left out because their data is inconsistent (price given for another unit) */
  suspicious: string[];
}

/**
 * Suggested cost of a recipe from the ingredient price ranges: each non-optional
 * ingredient costs (its quantity in purchase units) x (its price range). Quantities
 * in another kind of unit (spoons of an ingredient sold by the kg) are left out
 * and listed, so the chef knows the suggestion is partial.
 */
export function suggestRecipeCost(
  recipe: Pick<Recipe, 'ingredients'>,
  ingredientsById: ReadonlyMap<string, Ingredient>
): RecipeCostSuggestion {
  let range = ZERO_PRICE;
  let priced = 0;
  const unpriced: string[] = [];
  const suspicious: string[] = [];
  for (const item of recipe.ingredients) {
    if (item.is_optional) continue;
    const ingredient = ingredientsById.get(item.ingredient_id);
    const units = ingredient ? purchaseUnits(item.quantity_base, item.unit, ingredient.unit_default) : null;
    if (ingredient && units !== null && (units > MAX_PURCHASE_UNITS || hasImplausibleUnitPrice(ingredient))) {
      unpriced.push(item.ingredient_id);
      suspicious.push(item.ingredient_id);
      continue;
    }
    if (!ingredient || units === null) {
      unpriced.push(item.ingredient_id);
      continue;
    }
    priced++;
    range = addPriceRanges(range, { min: units * ingredient.price_min_tnd, max: units * ingredient.price_max_tnd });
  }
  return { range: roundPriceRange(range), priced, unpriced, suspicious };
}

/**
 * Cost range of a recipe for its base servings, shown to the public: computed from the
 * ingredient price ranges; the chef's single estimate when no ingredient can be priced or when
 * an ingredient's data is inconsistent (see hasImplausibleUnitPrice).
 */
export function recipeCostRange(
  recipe: Pick<Recipe, 'ingredients' | 'estimated_cost_tnd'>,
  ingredientsById: ReadonlyMap<string, Ingredient>
): PriceRange {
  const suggestion = suggestRecipeCost(recipe, ingredientsById);
  const estimate = Math.max(0, recipe.estimated_cost_tnd || 0);
  // Inconsistent data on one ingredient (often the main one) would make the total misleading
  const plausible =
    suggestion.suspicious.length === 0 && !(estimate > 0 && suggestion.range.min > estimate * MAX_COST_OVER_ESTIMATE);
  if (suggestion.priced > 0 && plausible) return suggestion.range;
  return { min: estimate, max: estimate };
}

/** Middle of a range (averages, sorting by cost). */
export const middleOfRange = (range: PriceRange): number => (range.min + range.max) / 2;
