import { describe, expect, it } from 'vitest';
import { DEFAULT_RECIPE_FILTERS, parseRecipeFilters, serializeRecipeFilters } from './recipeFilters';

describe('recipe filters in the address', () => {
  it('defaults give a plain /recettes address', () => {
    expect(serializeRecipeFilters(DEFAULT_RECIPE_FILTERS)).toBe('');
    expect(parseRecipeFilters('')).toEqual(DEFAULT_RECIPE_FILTERS);
  });

  it('round-trips every filter', () => {
    const filters = {
      query: 'ojja',
      maxBudget: 10,
      maxTime: 30,
      cuisine: 'traditionnelle',
      course: 'dessert' as const,
      healthyOnly: true,
      tier: 'ready' as const,
      favoritesOnly: true,
    };
    const search = serializeRecipeFilters(filters);
    expect(search).toBe(
      '?q=ojja&budget=10&temps=30&cuisine=traditionnelle&plat=dessert&healthy=1&niveau=ready&favoris=1'
    );
    expect(parseRecipeFilters(search)).toEqual(filters);
  });

  it('ignores invalid values from a hand-edited address', () => {
    const f = parseRecipeFilters('?budget=-3&temps=abc&plat=pizza&niveau=top&healthy=yes');
    expect(f).toEqual(DEFAULT_RECIPE_FILTERS);
  });
});
