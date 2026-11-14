import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';
import type { GroceryItem } from './types';
import { collectRecipeIds } from '../planning/planner';
import { createId, type IdFactory } from '../shared/id';
import { areUnitsCompatible, convertQuantity, parseMeasure } from '../units';

export interface NewGroceryItem {
  name: string;
  /** Catalog ingredient the item comes from, when known (merges with rows of the same ingredient) */
  ingredient_id?: string;
  quantity?: number;
  unit?: string;
  /** Aisle (ingredient category). Callers that know the catalog ingredient pass its category. */
  category?: string;
  /** Force the custom flag; defaults to false when the item carries an ingredient_id, true otherwise. */
  is_custom?: boolean;
}

export interface BuildGroceryListOptions {
  /** Household size the plan is scaled to. Default: each recipe for its base servings (no scaling). */
  servings?: number;
}

/** A quantity normalized to one canonical family: grams, milliliters, a counted thing or a raw unit. */
interface CanonicalQuantity {
  /** Bucket key: "mass", "volume", "count:<label>" or "raw" (units that cannot be compared) */
  key: string;
  /** Amount in the canonical base (grams, milliliters or count of <label>) */
  base: number;
  /** Original unit, kept only for raw buckets that cannot be converted */
  rawUnit?: string;
}

const round = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/**
 * Converts a recipe quantity to its canonical family (mass -> grams, volume -> milliliters,
 * counted things -> their singular label). Units that cannot be compared ("c.à.s") stay raw.
 */
function canonicalize(quantity: number, unit: string): CanonicalQuantity {
  const measure = parseMeasure(unit);
  if (!measure) return { key: 'raw', base: quantity, rawUnit: unit.trim() };
  if (measure.kind === 'mass') return { key: 'mass', base: quantity * measure.amount };
  if (measure.kind === 'volume') return { key: 'volume', base: quantity * measure.amount };
  return { key: `count:${measure.label}`, base: quantity * measure.amount };
}

/** Picks the most readable unit for a canonical amount (1500 g -> 1.5 kg, 250 ml stays ml). */
function toDisplay(canonical: CanonicalQuantity): { quantity: number; unit: string } {
  if (canonical.key === 'mass') {
    return canonical.base >= 1000
      ? { quantity: round(canonical.base / 1000, 2), unit: 'kg' }
      : { quantity: round(canonical.base, 1), unit: 'g' };
  }
  if (canonical.key === 'volume') {
    return canonical.base >= 1000
      ? { quantity: round(canonical.base / 1000, 2), unit: 'l' }
      : { quantity: round(canonical.base, 1), unit: 'ml' };
  }
  if (canonical.key.startsWith('count:')) {
    return { quantity: round(canonical.base, 1), unit: canonical.key.slice('count:'.length) };
  }
  return { quantity: round(canonical.base, 1), unit: canonical.rawUnit ?? 'pièce' };
}

/** Accumulator for one ingredient: sums per unit family, so g and ml never mix. */
interface IngredientBucket {
  name: string;
  ingredient_id?: string;
  category: string;
  sums: Map<string, { base: number; rawUnit?: string }>;
}

function addTo(bucket: IngredientBucket, canonical: CanonicalQuantity): void {
  const current = bucket.sums.get(canonical.key);
  if (current) current.base += canonical.base;
  else bucket.sums.set(canonical.key, { base: canonical.base, rawUnit: canonical.rawUnit });
}

/**
 * Shopping list for a whole weekly menu: every ingredient of every planned dish
 * (starter, main course, dessert). Quantities are scaled to the requested servings
 * (default: each recipe for its base servings), then consolidated per ingredient and
 * per unit family: grams with grams, milliliters with milliliters, counted things with
 * the same label. The same ingredient bought in incompatible units (500 g and 2 l)
 * appears as distinct entries rather than a nonsensical sum.
 */
export function buildGroceryListFromPlan(
  plan: DayPlan[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  newId: IdFactory = createId,
  options: BuildGroceryListOptions = {}
): GroceryItem[] {
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const buckets = new Map<string, IngredientBucket>();

  const servings = options.servings;

  for (const recipeId of collectRecipeIds(plan)) {
    const recipe = recipeById.get(recipeId);
    if (!recipe) continue;
    const factor = servings && recipe.base_servings > 0 ? servings / recipe.base_servings : 1;
    for (const item of recipe.ingredients) {
      if (!item.ingredient_id) continue;
      const ingredient = ingredientById.get(item.ingredient_id);
      // Merge on the ingredient when known, otherwise on the raw id referenced by the recipe
      const mergeKey = ingredient ? `ing:${ingredient.id}` : `name:${item.ingredient_id}`;
      let bucket = buckets.get(mergeKey);
      if (!bucket) {
        bucket = {
          name: ingredient ? ingredient.name_fr : item.ingredient_id,
          ingredient_id: item.ingredient_id,
          category: ingredient ? ingredient.category : 'other',
          sums: new Map(),
        };
        buckets.set(mergeKey, bucket);
      }
      const canonical = canonicalize(item.quantity_base * factor, item.unit);
      addTo(bucket, canonical);
    }
  }

  const items: GroceryItem[] = [];
  for (const bucket of buckets.values()) {
    for (const [key, sum] of bucket.sums) {
      const { quantity, unit } = toDisplay({ ...sum, key });
      items.push({
        id: newId('grocery'),
        ingredient_id: bucket.ingredient_id,
        name: bucket.name,
        quantity,
        unit,
        category: bucket.category,
        is_checked: false,
      });
    }
  }
  return items;
}

/** Lower-cased, trimmed name used to spot the same free-text item twice. */
const normalizeName = (name: string): string => name.trim().toLowerCase();

/**
 * Adds items to the list. A new item matching an existing row — same ingredient, or the same
 * name for free-text entries — in a compatible unit (g with kg, ml with l...) is merged into
 * it: the incoming quantity is converted to the row's unit, summed, and the row is unchecked
 * again (something to buy was just added). The existing row keeps its id, name, unit,
 * category and custom flag. Incompatible units (500 g and 2 pièces) stay as two rows.
 */
export function addGroceryItems(
  list: GroceryItem[],
  items: NewGroceryItem[],
  newId: IdFactory = createId
): GroceryItem[] {
  let next = [...list];
  for (const item of items) {
    const quantity = item.quantity ?? 1;
    const unit = item.unit ?? 'pièce';
    const name = normalizeName(item.name);
    const index = next.findIndex((existing) => {
      const sameIngredient =
        item.ingredient_id !== undefined && item.ingredient_id !== '' && existing.ingredient_id === item.ingredient_id;
      const sameName = name !== '' && normalizeName(existing.name) === name;
      return (sameIngredient || sameName) && areUnitsCompatible(existing.unit, unit);
    });
    const merged = index >= 0 ? convertQuantity(quantity, unit, next[index].unit) : null;
    if (index >= 0 && merged !== null) {
      next[index] = { ...next[index], quantity: next[index].quantity + merged, is_checked: false };
      continue;
    }
    next = [
      ...next,
      {
        id: newId('grocery'),
        ...(item.ingredient_id ? { ingredient_id: item.ingredient_id } : {}),
        name: item.name,
        quantity,
        unit,
        category: item.category ?? 'other',
        is_checked: false,
        is_custom: item.is_custom ?? !item.ingredient_id,
      },
    ];
  }
  return next;
}

/**
 * Switches one item to another unit of the same family (g -> kg, ml -> l, pièces -> pièce...):
 * the quantity is converted. Returns null — and leaves the list untouched — when the item does
 * not exist or the units are not compatible.
 */
export function changeGroceryItemUnit(list: GroceryItem[], itemId: string, newUnit: string): GroceryItem[] | null {
  const item = list.find((entry) => entry.id === itemId);
  if (!item) return null;
  const converted = convertQuantity(item.quantity, item.unit, newUnit);
  if (converted === null) return null;
  const unit = newUnit.trim();
  return list.map((entry) => (entry.id === itemId ? { ...entry, quantity: converted, unit } : entry));
}

export function toggleGroceryItem(list: GroceryItem[], id: string): GroceryItem[] {
  return list.map((item) => (item.id === id ? { ...item, is_checked: !item.is_checked } : item));
}

export function removeGroceryItem(list: GroceryItem[], id: string): GroceryItem[] {
  return list.filter((item) => item.id !== id);
}

/** Sets a new quantity. Anything that is not a finite, non-negative number leaves the list untouched. */
export function updateGroceryItemQuantity(list: GroceryItem[], id: string, quantity: number): GroceryItem[] {
  if (!Number.isFinite(quantity) || quantity < 0) return list;
  return list.map((item) => (item.id === id ? { ...item, quantity } : item));
}

export function clearCheckedGroceryItems(list: GroceryItem[]): GroceryItem[] {
  return list.filter((item) => !item.is_checked);
}
