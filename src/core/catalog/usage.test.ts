import { describe, expect, it } from 'vitest';
import { countIngredientUsage, findDuplicateIngredient } from './usage';

describe('countIngredientUsage', () => {
  it('counts each recipe once per ingredient, substitutes included', () => {
    const counts = countIngredientUsage([
      {
        ingredients: [
          { ingredient_id: 'a', quantity_base: 1, unit: 'g', substitutes: ['b'] },
          { ingredient_id: 'a', quantity_base: 2, unit: 'g' },
        ],
      },
      { ingredients: [{ ingredient_id: 'b', quantity_base: 1, unit: 'g' }] },
    ]);
    expect(Object.fromEntries(counts)).toEqual({ a: 1, b: 2 });
  });
});

describe('findDuplicateIngredient', () => {
  const list = [
    { id: '1', name_fr: 'Pâtes' },
    { id: '2', name_fr: 'Tomate' },
  ];
  it('ignores case and accents, and the ingredient being edited', () => {
    expect(findDuplicateIngredient(' pates ', list)?.id).toBe('1');
    expect(findDuplicateIngredient('Tomate', list, '2')).toBeUndefined();
    expect(findDuplicateIngredient('', list)).toBeUndefined();
  });
});
