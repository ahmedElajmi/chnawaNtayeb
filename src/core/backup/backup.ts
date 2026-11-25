import { migrateRecipes, parseStoredIngredient, parseStoredRecipe, type Ingredient, type Recipe } from '../catalog';
import type { GroceryItem } from '../grocery';
import type { DayPlan } from '../planning';
import { parseStockSectionUnbounded, type StockSection } from '../kitchen';

/** Transport-style guard of the backup import (lot F1 A4, chef decision AR-1): a restore
 *  must be whole, never a memory or freeze hazard. The measured legal worst case of the
 *  stock alone is the extreme contract bound C3 = 9 585 094 bytes (measure 2026-11-20);
 *  the guard sits far above every legitimate backup (full stock at the extreme bound plus
 *  a large catalog), and only refuses absurd files before any parse — an explicit refusal,
 *  never a truncation. The guard is a guard-rail, not a business cap.
 *
 *  Unit (exact, not approximated): the limit counts UTF-16 code units (`string.length`),
 *  i.e. the LOGICAL length of the already-loaded string — 33 554 432 units corresponds to
 *  64 MiB only in a THEORETICAL UTF-16 representation of two bytes per unit; it bounds the
 *  string's logical length, NOT its exact real memory footprint (an engine may store a
 *  string more compactly than that) and NOT the file's UTF-8 size. The UTF-8 size of the
 *  file on disk is a DIFFERENT quantity the guard deliberately does not measure: it varies
 *  from about 32 MiB (pure ASCII, 1 byte per unit) up to about 128 MiB (every unit an astral
 *  character, 4 bytes per unit). Measuring UTF-8 bytes would require encoding the whole
 *  string first — an allocation of the same order as the parse itself, against the very
 *  hazard this guard prevents. In every representation and encoding the bound stays far
 *  above the measured legal worst case C3 = 9 585 094 bytes (≥ 3.4× even at 1 byte per unit). */
export const BACKUP_IMPORT_MAX_CHARS = 33_554_432;

/** True when a backup file may be parsed and restored (guard-rail, never a business rule).
 *  Counts UTF-16 code units (logical length) — see the constant above. */
export function backupImportWithinBound(json: string): boolean {
  return json.length <= BACKUP_IMPORT_MAX_CHARS;
}

/** Content of a backup file once read: only the sections present and valid, plus what was skipped. */
export interface ParsedBackup {
  recipes?: Recipe[];
  ingredients?: Ingredient[];
  /** Raw days, read later by migrateDayPlan (it needs the recipes) */
  weeklyPlan?: unknown[];
  favorites?: string[];
  groceryList?: GroceryItem[];
  /** The typed stock of entries (lot F1 § 13-B): full envelopes, read through the core
   *  parser (tolerant per envelope, identity invariant enforced there) — absent in old
   *  backups, which stay compatible unchanged. */
  stock?: StockSection;
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
    category: typeof raw.category === 'string' && raw.category.trim() ? raw.category : 'other',
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
  const known = ['recipes', 'ingredients', 'weekly_plan', 'favorites', 'grocery_list', 'stock'].filter(
    (k) => Array.isArray(raw[k]) || (k === 'stock' && isObject(raw[k]))
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
  if (raw.stock !== undefined) {
    // Envelope by envelope: a malformed envelope is dropped (read tolerance), a stock
    // exceeding the volume caps is read WHOLE (lot F1 A4, option α — a backup restore is
    // never partial; the caps are an admission policy, not a restore filter), and a stock
    // that is not an object at all is skipped and counted — never a crash
    const stock = parseStockSectionUnbounded(raw.stock);
    if (stock) result.stock = stock;
    else if (raw.stock !== null) skipped++;
  }
  result.skipped = skipped;
  return result;
}

export interface BackupContent {
  recipes: Recipe[];
  ingredients: Ingredient[];
  weeklyPlan: DayPlan[];
  favorites: string[];
  groceryList: GroceryItem[];
  /** The typed stock of entries (lot F1 § 13-B): full envelopes, one per entry id */
  stock?: StockSection;
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
    ...(content.stock !== undefined ? { stock: content.stock } : {}),
  };
}
