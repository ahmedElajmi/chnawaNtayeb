import { describe, expect, it } from 'vitest';
import { catalogHealth, ingredientNeedsTranslation, recipeNeedsTranslation } from './health';
import { initialIngredients, initialRecipes } from './index';

describe('catalog health', () => {
  const recipe = initialRecipes[0];

  it('counts what is left to do on the whole lists', () => {
    const recipes = [
      { ...recipe, image_url: '' },
      { ...recipe, id: 'b' },
    ];
    const health = catalogHealth(recipes, initialIngredients);
    expect(health.recipesWithoutPhoto).toBe(1);
    expect(health.ingredientsUnused).toBeGreaterThan(0);
    expect(health.ingredientsWithoutPhoto).toBeLessThanOrEqual(initialIngredients.length);
  });

  it('flags a text written in French but missing in a language or variant', () => {
    // The built-in catalog has no derja in Arabic letters yet
    expect(recipeNeedsTranslation(recipe)).toBe(true);
    const full = {
      ...recipe,
      name_derja_ar: 'x',
      description_derja_ar: 'x',
      steps: recipe.steps.map((s) => ({ ...s, instruction_derja_ar: 'x' })),
      chef_tip: { ...recipe.chef_tip, derja_ar: recipe.chef_tip.fr ? 'x' : '' },
    };
    expect(recipeNeedsTranslation(full)).toBe(false);
    expect(ingredientNeedsTranslation({ ...initialIngredients[0], name_derja_ar: 'ي' })).toBe(false);
  });
});
