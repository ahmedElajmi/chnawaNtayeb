import { Ingredient, IngredientRole, Recipe, RecipeIngredient } from '../types';

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

/**
 * Groups of interchangeable ingredients (applies to every recipe).
 * A substitute counts as available, with a slightly lower score.
 */
export const SUBSTITUTE_GROUPS: string[][] = [
  ['ing_tomate', 'ing_tomate_concentree'],
  ['ing_boeuf', 'ing_agneau', 'ing_viande_hachee'],
  ['ing_harissa', 'ing_piment_moulu'],
  ['ing_persil', 'ing_coriandre'],
  ['ing_fromage_rape', 'ing_ricotta'],
  ['ing_beurre', 'ing_huile_olive'],
];

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

/** Recipe-specific substitutes first, then the global groups. */
export function getSubstitutes(item: RecipeIngredient): string[] {
  const fromGroups = SUBSTITUTE_GROUPS.filter((g) => g.includes(item.ingredient_id)).flat();
  return Array.from(new Set([...(item.substitutes ?? []), ...fromGroups])).filter((id) => id !== item.ingredient_id);
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
