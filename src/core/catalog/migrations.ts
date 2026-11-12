import type { Ingredient, Recipe } from './types';
import { normalizeRecipe } from './course';
import { initialRecipes } from './seed/initialRecipes';
import { initialIngredients } from './seed/initialIngredients';

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

/** Shape of an ingredient as it may still be stored: before price ranges it had one fixed price. */
type StoredIngredient = Omit<Ingredient, 'price_min_tnd' | 'price_max_tnd'> & {
  price_min_tnd?: number;
  price_max_tnd?: number;
  default_price_tnd?: number;
};

const toPrice = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
};

const seedIngredientsById = new Map(initialIngredients.map((i) => [i.id, i]));

/**
 * Brings a stored ingredient up to date: the old fixed price (`default_price_tnd`)
 * becomes a range, an inverted range is put back in order and an empty photo link is
 * removed. A built-in ingredient still at a single price that lies within the built-in
 * market range takes that range (prices were single values before ranges existed); a
 * price set by the chef outside of it is kept. Ingredients already up to date come back unchanged.
 */
export function migrateIngredient(
  stored: StoredIngredient,
  seedById: ReadonlyMap<string, Ingredient> = seedIngredientsById
): Ingredient {
  const { default_price_tnd, price_min_tnd, price_max_tnd, image_url, ...rest } = stored;
  const legacy = toPrice(default_price_tnd);
  let min = toPrice(price_min_tnd) ?? toPrice(price_max_tnd) ?? legacy ?? 0;
  let max = toPrice(price_max_tnd) ?? toPrice(price_min_tnd) ?? legacy ?? 0;
  const seed = seedById.get(stored.id);
  if (min === max && seed && seed.price_min_tnd < seed.price_max_tnd) {
    if (min >= seed.price_min_tnd && min <= seed.price_max_tnd) {
      min = seed.price_min_tnd;
      max = seed.price_max_tnd;
    }
  }
  const photo = typeof image_url === 'string' ? image_url.trim() : '';
  return {
    ...rest,
    price_min_tnd: Math.min(min, max),
    price_max_tnd: Math.max(min, max),
    ...(photo ? { image_url: photo } : {}),
  };
}

export function migrateIngredients(list: StoredIngredient[]): Ingredient[] {
  return list.map((i) => migrateIngredient(i));
}

/** Adds the seed items that are not in `list` yet (matched by id), keeping existing ones untouched. */
export function mergeMissingById<T extends { id: string }>(list: T[], seed: T[]): T[] {
  const known = new Set(list.map((x) => x.id));
  return [...list, ...seed.filter((x) => !known.has(x.id))];
}
