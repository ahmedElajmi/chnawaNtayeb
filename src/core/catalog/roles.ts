import type { Ingredient, IngredientRole, Recipe, RecipeIngredient } from './types';
import { getSubstitutes } from './substitutions';

/** Pantry items: they never block a recipe (salt, oil, spices, condiments). */
export const STAPLE_INGREDIENT_IDS = new Set([
  'ing_sel_poivre',
  'ing_huile_olive',
  'ing_tabel_karwiya',
  'ing_curcuma',
  'ing_piment_moulu',
  'ing_cumin',
  'ing_menthe_sechee',
  'ing_harissa',
  'ing_ail',
  'ing_capres',
  'ing_olives',
  'ing_sucre',
  'ing_cannelle',
  'ing_fleur_oranger',
]);

/** Ingredients that usually *are* the dish when a recipe uses them. */
const LIKELY_KEY_IDS = new Set([
  'ing_pates',
  'ing_riz',
  'ing_semoule_couscous',
  'ing_frik',
  'ing_malsouka',
  'ing_nwasser',
  'ing_mloukhiya_poudre',
  'ing_pois_chiches',
]);

const KEY_CATEGORIES = new Set(['meats', 'fish']);

/** Role used when a recipe ingredient has no explicit role (custom recipes, old data). */
export function inferRole(ingredientId: string, catalog?: Ingredient[]): IngredientRole {
  if (STAPLE_INGREDIENT_IDS.has(ingredientId)) return 'staple';
  if (LIKELY_KEY_IDS.has(ingredientId)) return 'key';
  const ing = catalog?.find((i) => i.id === ingredientId);
  if (ing && KEY_CATEGORIES.has(ing.category)) return 'key';
  if (ing?.category === 'spices_condiments') return 'staple';
  return 'secondary';
}

export function getRole(item: RecipeIngredient, catalog?: Ingredient[]): IngredientRole {
  return item.role ?? inferRole(item.ingredient_id, catalog);
}

/** Ingredients that can influence suggestions: used by a published recipe, directly or as a substitute. */
export function getUsedIngredientIds(recipes: Recipe[]): Set<string> {
  const used = new Set<string>();
  for (const recipe of recipes) {
    if (!recipe.is_published) continue;
    for (const item of recipe.ingredients) {
      used.add(item.ingredient_id);
      getSubstitutes(item).forEach((id) => used.add(id));
    }
  }
  return used;
}
