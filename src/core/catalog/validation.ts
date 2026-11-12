import type { Ingredient, Recipe, RecipeStep } from './types';

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

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
  if (!trim(recipe.name_fr)) return { ok: false, error: 'Le nom de la recette en français est obligatoire.' };
  if (recipe.ingredients.length === 0) return { ok: false, error: 'Ajoutez au moins un ingrédient.' };
  const steps = normalizeSteps(recipe.steps);
  if (steps.length === 0) return { ok: false, error: 'Ajoutez au moins une étape de préparation.' };
  const missing = steps.find((s) => !s.instruction_fr);
  if (missing) return { ok: false, error: `L'étape ${missing.step_number} doit être écrite en français.` };
  return {
    ok: true,
    value: {
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
    },
  };
}

/**
 * Rules of an ingredient edited by the chef: French name and unit required,
 * price a positive number; empty derja / Arabic names take the French name.
 */
export function validateIngredient(ingredient: Ingredient): Checked<Ingredient> {
  const name_fr = trim(ingredient.name_fr);
  if (!name_fr) return { ok: false, error: "Le nom de l'ingrédient en français est obligatoire." };
  const unit_default = trim(ingredient.unit_default);
  if (!unit_default) return { ok: false, error: "L'unité est obligatoire." };
  const price = Number(ingredient.default_price_tnd);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'Le prix doit être un nombre positif.' };
  return {
    ok: true,
    value: {
      ...ingredient,
      name_fr,
      name_derja: trim(ingredient.name_derja) || name_fr,
      name_ar: trim(ingredient.name_ar) || name_fr,
      unit_default,
      default_price_tnd: price,
    },
  };
}
