import {
  INGREDIENT_CATEGORIES,
  migrateRecipes,
  parseStoredIngredient,
  parseStoredRecipe,
  type Ingredient,
  type IngredientCategory,
  type Recipe,
} from '../catalog';
import type { GroceryItem } from '../grocery';
import type { DayPlan } from '../planning';

/** Content of a backup file once read: only the sections present and valid, plus what was skipped. */
export interface ParsedBackup {
  recipes?: Recipe[];
  ingredients?: Ingredient[];
  /** Raw days, read later by migrateDayPlan (it needs the recipes) */
  weeklyPlan?: unknown[];
  favorites?: string[];
  groceryList?: GroceryItem[];
  /** Entries that were not valid and were left out */
  skipped: number;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isText = (v: unknown): v is string => typeof v === 'string';

function parseGroceryItem(raw: unknown): GroceryItem | null {
  if (!isObject(raw) || !isText(raw.id) || !isText(raw.name) || typeof raw.quantity !== 'number') return null;
  return {
    id: raw.id,
    name: raw.name,
    quantity: raw.quantity,
    unit: isText(raw.unit) ? raw.unit : '',
    category: INGREDIENT_CATEGORIES.includes(raw.category as IngredientCategory)
      ? (raw.category as IngredientCategory)
      : 'other',
    is_checked: raw.is_checked === true,
    ...(isText(raw.ingredient_id) ? { ingredient_id: raw.ingredient_id } : {}),
    ...(raw.is_custom === true ? { is_custom: true } : {}),
  };
}

/**
 * Reads a JSON backup (export of the backoffice). Every entry goes through the rules of the
 * domain: recipes must have the shape of a recipe and are brought up to date (roles, courses,
 * all three languages kept), ingredients too (old single price -> range); invalid entries are
 * skipped and counted. Returns null when the file is not a backup at all.
 */
export function parseBackup(raw: unknown): ParsedBackup | null {
  if (!isObject(raw)) return null;
  const known = ['recipes', 'ingredients', 'weekly_plan', 'favorites', 'grocery_list'].filter((k) =>
    Array.isArray(raw[k])
  );
  if (known.length === 0) return null;
  let skipped = 0;
  const keep = <T>(list: unknown[], read: (x: unknown) => T | null): T[] =>
    list.flatMap((x) => {
      const value = read(x);
      if (value === null) skipped++;
      return value === null ? [] : [value];
    });

  const result: ParsedBackup = { skipped: 0 };
  if (Array.isArray(raw.recipes)) result.recipes = migrateRecipes(keep(raw.recipes, parseStoredRecipe));
  if (Array.isArray(raw.ingredients)) {
    result.ingredients = keep(raw.ingredients, parseStoredIngredient);
  }
  if (Array.isArray(raw.weekly_plan)) result.weeklyPlan = raw.weekly_plan.filter(isObject);
  if (Array.isArray(raw.favorites)) result.favorites = keep(raw.favorites, (x) => (isText(x) ? x : null));
  if (Array.isArray(raw.grocery_list)) result.groceryList = keep(raw.grocery_list, parseGroceryItem);
  result.skipped = skipped;
  return result;
}

export interface BackupContent {
  recipes: Recipe[];
  ingredients: Ingredient[];
  weeklyPlan: DayPlan[];
  favorites: string[];
  groceryList: GroceryItem[];
}

/**
 * Backup file content (JSON dump): complete objects, every language and every field,
 * read back by parseBackup. Sync revisions are left out (they belong to one database).
 */
export function createBackup(content: BackupContent, exportedAt: string) {
  const strip = <T extends { revision?: number }>(list: T[]) => list.map(({ revision: _revision, ...rest }) => rest);
  return {
    version: 1,
    exported_at: exportedAt,
    recipes: strip(content.recipes),
    ingredients: strip(content.ingredients),
    weekly_plan: content.weeklyPlan,
    favorites: content.favorites,
    grocery_list: content.groceryList,
  };
}
