import { LANGUAGE_CODES, REFERENCE_LANGUAGE, localizedField, type Language } from '../shared';
import { hasImplausibleUnitPrice } from './costEstimate';
import type { Ingredient, Recipe } from './types';
import { countIngredientUsage } from './usage';

/** What is left to do on the catalog, counted on the whole lists (shown on the backoffice home). */
export interface CatalogHealth {
  recipesWithoutPhoto: number;
  /** Recipes with a text written in French but empty in another language or variant */
  recipesToTranslate: number;
  recipesWithoutVideo: number;
  ingredientsWithoutPhoto: number;
  ingredientsToTranslate: number;
  /** Price of one unit that cannot be right (e.g. "g" with a pack price) */
  ingredientsUnitCheck: number;
  ingredientsUnused: number;
}

const missesALanguage = (texts: Partial<Record<Language, string>>[]) =>
  texts.some(
    (t) => t[REFERENCE_LANGUAGE]?.trim() && LANGUAGE_CODES.some((l) => l !== REFERENCE_LANGUAGE && !t[l]?.trim())
  );

export function recipeNeedsTranslation(recipe: Recipe): boolean {
  return missesALanguage([
    localizedField(recipe, 'name'),
    localizedField(recipe, 'description'),
    ...recipe.steps.map((s) => localizedField(s, 'instruction')),
    recipe.chef_tip ?? {},
  ]);
}

export function ingredientNeedsTranslation(ingredient: Ingredient): boolean {
  return missesALanguage([localizedField(ingredient, 'name')]);
}

export function catalogHealth(recipes: readonly Recipe[], ingredients: readonly Ingredient[]): CatalogHealth {
  const usage = countIngredientUsage([...recipes]);
  return {
    recipesWithoutPhoto: recipes.filter((r) => !r.image_url?.trim()).length,
    recipesToTranslate: recipes.filter(recipeNeedsTranslation).length,
    recipesWithoutVideo: recipes.filter((r) => !r.video_url?.trim()).length,
    ingredientsWithoutPhoto: ingredients.filter((i) => !i.image_url?.trim()).length,
    ingredientsToTranslate: ingredients.filter(ingredientNeedsTranslation).length,
    ingredientsUnitCheck: ingredients.filter(hasImplausibleUnitPrice).length,
    ingredientsUnused: ingredients.filter((i) => !usage.get(i.id)).length,
  };
}
