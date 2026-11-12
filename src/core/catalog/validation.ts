import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory, type Recipe, type RecipeStep } from './types';
import { migrateIngredient, migrateRecipes } from './migrations';
import { normalizeRecipe } from './course';
import { withoutUndefined } from '../shared';
import { hasImplausibleUnitPrice } from './costEstimate';

/** Part of the edited object an error is about, so a form can show it next to the right field. */
export type CheckedField = 'name' | 'ingredients' | 'steps' | 'video' | 'price' | 'unit' | 'photo';

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string; field?: CheckedField };

const trim = (s: string | undefined) => (s ?? '').trim();

/** Steps without any text are dropped, the others are trimmed and numbered 1..n. */
export function normalizeSteps(steps: RecipeStep[]): RecipeStep[] {
  return steps
    .map((s) => ({
      instruction_fr: trim(s.instruction_fr),
      instruction_derja: trim(s.instruction_derja),
      instruction_ar: trim(s.instruction_ar),
    }))
    .filter((s) => s.instruction_fr || s.instruction_derja || s.instruction_ar)
    .map((s, i) => ({ step_number: i + 1, ...s }));
}

/**
 * Rules of a recipe written by the chef: French name, at least one ingredient
 * and at least one preparation step written in French (the other languages
 * fall back to French when empty). Returns the cleaned recipe.
 */
export function validateRecipe(recipe: Recipe): Checked<Recipe> {
  if (!trim(recipe.name_fr))
    return { ok: false, field: 'name', error: 'Le nom de la recette en français est obligatoire.' };
  if (recipe.ingredients.length === 0)
    return { ok: false, field: 'ingredients', error: 'Ajoutez au moins un ingrédient.' };
  const steps = normalizeSteps(recipe.steps);
  if (steps.length === 0) return { ok: false, field: 'steps', error: 'Ajoutez au moins une étape de préparation.' };
  const missing = steps.find((s) => !s.instruction_fr);
  if (missing)
    return { ok: false, field: 'steps', error: `L'étape ${missing.step_number} doit être écrite en français.` };
  // A cleared optional field (role, optional flag, substitutes...) must be absent, not `undefined`
  return {
    ok: true,
    value: withoutUndefined({
      ...recipe,
      name_fr: trim(recipe.name_fr),
      name_derja: trim(recipe.name_derja),
      name_ar: trim(recipe.name_ar),
      description_fr: trim(recipe.description_fr),
      description_derja: trim(recipe.description_derja),
      description_ar: trim(recipe.description_ar),
      chef_tip: {
        fr: trim(recipe.chef_tip?.fr),
        derja: trim(recipe.chef_tip?.derja),
        ar: trim(recipe.chef_tip?.ar),
      },
      steps,
    }),
  };
}

/**
 * A photo link set by the chef: empty means "no photo" (undefined), otherwise it
 * must be a full https address. Returns null when the link is not valid.
 */
export function parseImageUrl(raw: string | undefined): string | undefined | null {
  const value = trim(raw);
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Rules of an ingredient edited by the chef: French name and unit required,
 * price range with 0 <= min <= max, optional https photo link; empty derja /
 * Arabic names take the French name.
 */
export function validateIngredient(ingredient: Ingredient): Checked<Ingredient> {
  const name_fr = trim(ingredient.name_fr);
  if (!name_fr) return { ok: false, field: 'name', error: "Le nom de l'ingrédient en français est obligatoire." };
  const unit_default = trim(ingredient.unit_default);
  if (!unit_default) return { ok: false, field: 'unit', error: "L'unité est obligatoire." };
  const min = Number(ingredient.price_min_tnd);
  if (!Number.isFinite(min) || min < 0)
    return { ok: false, field: 'price', error: 'Le prix minimum doit être un nombre positif.' };
  const max = Number(ingredient.price_max_tnd);
  if (!Number.isFinite(max) || max < min)
    return { ok: false, field: 'price', error: 'Le prix maximum doit être supérieur ou égal au prix minimum.' };
  if (hasImplausibleUnitPrice({ unit_default, price_max_tnd: max }))
    return {
      ok: false,
      field: 'unit',
      error: `Ce prix ne peut pas être celui d'un seul « ${unit_default} » : indiquez l'unité d'achat réelle (ex. 100 g, 250 g, kg, paquet (500 g)).`,
    };
  const image_url = parseImageUrl(ingredient.image_url);
  if (image_url === null)
    return {
      ok: false,
      field: 'photo',
      error: 'Le lien de la photo doit être une adresse complète commençant par https://',
    };
  const { image_url: _previous, ...rest } = ingredient;
  return {
    ok: true,
    value: {
      ...rest,
      name_fr,
      name_derja: trim(ingredient.name_derja) || name_fr,
      name_ar: trim(ingredient.name_ar) || name_fr,
      unit_default,
      price_min_tnd: min,
      price_max_tnd: max,
      ...(image_url ? { image_url } : {}),
    },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * Recipe read back from outside (unsaved draft, backup file): returns null
 * unless it has the shape of a recipe (id, names, numbers, ingredient and step lists).
 * It is validated again (validateRecipe) when the chef saves it.
 */
export function parseStoredRecipe(raw: unknown): Recipe | null {
  if (!isObject(raw)) return null;
  const textKeys = ['id', 'name_fr', 'name_derja', 'name_ar', 'description_fr', 'description_derja', 'description_ar'];
  if (!textKeys.every((k) => typeof raw[k] === 'string')) return null;
  if (!Array.isArray(raw.ingredients) || !Array.isArray(raw.steps)) return null;
  const ingredientsOk = raw.ingredients.every(
    (i) => isObject(i) && typeof i.ingredient_id === 'string' && typeof i.quantity_base === 'number'
  );
  const stepsOk = raw.steps.every((s) => isObject(s) && typeof s.instruction_fr === 'string');
  const numbersOk = ['prep_time_minutes', 'cook_time_minutes', 'base_servings', 'estimated_cost_tnd'].every(
    (k) => typeof raw[k] === 'number'
  );
  if (!ingredientsOk || !stepsOk || !numbersOk) return null;
  return normalizeRecipe(raw as unknown as Recipe);
}

/**
 * Reads an ingredient coming from outside (database, backup, device copy): id, French name,
 * unit and category are required; prices and photo are brought up to date (migrateIngredient).
 */
export function parseStoredIngredient(raw: unknown): Ingredient | null {
  if (!isObject(raw)) return null;
  const textsOk = ['id', 'name_fr', 'unit_default'].every(
    (k) => typeof raw[k] === 'string' && (raw[k] as string).trim() !== ''
  );
  if (!textsOk || !INGREDIENT_CATEGORIES.includes(raw.category as IngredientCategory)) return null;
  const withNames = {
    ...raw,
    name_derja: typeof raw.name_derja === 'string' ? raw.name_derja : '',
    name_ar: typeof raw.name_ar === 'string' ? raw.name_ar : '',
  };
  return migrateIngredient(withNames as unknown as Parameters<typeof migrateIngredient>[0]);
}

const keepValid = <T>(list: readonly unknown[], read: (raw: unknown) => T | null): T[] =>
  list.flatMap((raw) => {
    const value = read(raw);
    return value === null ? [] : [value];
  });

/** Recipes from outside, invalid ones left out, brought up to date. */
export const parseStoredRecipes = (list: readonly unknown[]): Recipe[] =>
  migrateRecipes(keepValid(list, parseStoredRecipe));

/** Ingredients from outside, invalid ones left out, brought up to date. */
export const parseStoredIngredients = (list: readonly unknown[]): Ingredient[] =>
  keepValid(list, parseStoredIngredient);
