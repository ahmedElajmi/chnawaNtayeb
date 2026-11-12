import type { Ingredient, PriceRange, Recipe } from './types';
import { addPriceRanges, roundPriceRange, ZERO_PRICE } from './pricing';

/** A unit understood as an amount of mass (g), volume (ml) or of a counted thing ("pièce", "botte"...). */
interface Measure {
  kind: 'mass' | 'volume' | 'count';
  /** For counted things: the singular word, so "pièces" and "pièce" match */
  label: string;
  amount: number;
}

const MASS: Record<string, number> = { g: 1, gr: 1, kg: 1000 };
const VOLUME: Record<string, number> = { ml: 1, cl: 10, dl: 100, l: 1000, litre: 1000, litres: 1000 };

const singular = (word: string) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word);

/**
 * Reads a unit such as "kg", "100 g", "paquet (500g)", "boîte (400 ml)", "pièces (durs)".
 * A quantity in brackets wins ("paquet (500g)" = 500 g); other brackets are only comments.
 * Returns null when the unit cannot be compared ("c.à.s / L").
 */
export function parseMeasure(unit: string): Measure | null {
  const text = unit.trim().toLowerCase().replace(',', '.');
  if (!text || text.includes('/')) return null;
  const bracket = /\(([^)]*)\)/.exec(text)?.[1];
  // Only a bracket holding a quantity changes the unit ("(500g)"), not a comment ("(durs)")
  const fromBracket = bracket && /\d/.test(bracket) ? parseAmount(bracket) : null;
  if (fromBracket) return fromBracket;
  const main = text.replace(/\([^)]*\)/g, '').trim();
  return parseAmount(main) ?? (main ? { kind: 'count', label: singular(main.split(/\s+/)[0]), amount: 1 } : null);
}

function parseAmount(text: string): Measure | null {
  const m = /^(\d+(?:\.\d+)?)?\s*([a-zà-ÿ.]+)$/.exec(text.trim());
  if (!m) return null;
  const amount = m[1] ? parseFloat(m[1]) : 1;
  const word = m[2];
  if (word in MASS) return { kind: 'mass', label: 'g', amount: amount * MASS[word] };
  if (word in VOLUME) return { kind: 'volume', label: 'ml', amount: amount * VOLUME[word] };
  return m[1] ? null : { kind: 'count', label: singular(word), amount };
}

/** How many purchase units of the ingredient a recipe quantity represents, or null if not comparable. */
export function purchaseUnits(quantity: number, unit: string, purchaseUnit: string): number | null {
  const need = parseMeasure(unit);
  const sold = parseMeasure(purchaseUnit);
  if (!need || !sold || need.kind !== sold.kind || sold.amount <= 0) return null;
  if (need.kind === 'count' && need.label !== sold.label) return null;
  return (quantity * need.amount) / sold.amount;
}

export interface RecipeCostSuggestion {
  /** Cost range of the priced ingredients, for the base servings */
  range: PriceRange;
  priced: number;
  /** Ingredient ids whose quantity could not be converted to their purchase unit */
  unpriced: string[];
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
  for (const item of recipe.ingredients) {
    if (item.is_optional) continue;
    const ingredient = ingredientsById.get(item.ingredient_id);
    const units = ingredient ? purchaseUnits(item.quantity_base, item.unit, ingredient.unit_default) : null;
    if (!ingredient || units === null) {
      unpriced.push(item.ingredient_id);
      continue;
    }
    priced++;
    range = addPriceRanges(range, { min: units * ingredient.price_min_tnd, max: units * ingredient.price_max_tnd });
  }
  return { range: roundPriceRange(range), priced, unpriced };
}

/**
 * Cost range of a recipe for its base servings, shown to the public: computed from the
 * ingredient price ranges; the chef's single estimate when no ingredient can be priced.
 */
export function recipeCostRange(
  recipe: Pick<Recipe, 'ingredients' | 'estimated_cost_tnd'>,
  ingredientsById: ReadonlyMap<string, Ingredient>
): PriceRange {
  const suggestion = suggestRecipeCost(recipe, ingredientsById);
  if (suggestion.priced > 0) return suggestion.range;
  const estimate = Math.max(0, recipe.estimated_cost_tnd || 0);
  return { min: estimate, max: estimate };
}

/** Middle of a range (averages, sorting by cost). */
export const middleOfRange = (range: PriceRange): number => (range.min + range.max) / 2;
