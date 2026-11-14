import { describe, expect, it } from 'vitest';
import { groceryCost } from './budget';
import type { Ingredient } from '../catalog/types';
import type { GroceryItem } from './types';

const ingredient = (overrides: Partial<Ingredient>): Ingredient =>
  ({
    id: 'ing_tomate',
    name_fr: 'Tomate',
    name_derja: 'Tomate',
    name_ar: 'طماطم',
    category: 'vegetables',
    unit_default: 'kg',
    price_min_tnd: 10,
    price_max_tnd: 20,
    ...overrides,
  }) as Ingredient;

const ingredientsById = new Map<string, Ingredient>([
  ['ing_tomate', ingredient({})],
  [
    'ing_oeuf',
    ingredient({
      id: 'ing_oeuf',
      name_fr: 'Oeuf',
      category: 'dairy_eggs',
      unit_default: 'pièce',
      price_min_tnd: 0.5,
      price_max_tnd: 1,
    }),
  ],
]);

const item = (overrides: Partial<GroceryItem>): GroceryItem => ({
  id: 'g1',
  name: 'Tomate',
  quantity: 1.5,
  unit: 'kg',
  category: 'vegetables',
  is_checked: false,
  ingredient_id: 'ing_tomate',
  ...overrides,
});

describe('groceryCost', () => {
  it('prices each item against its purchase unit and sums the ranges', () => {
    const items = [
      item({}), // 1.5 kg at 10-20 DT/kg -> 15-30
      item({ id: 'g2', name: 'Oeuf', ingredient_id: 'ing_oeuf', quantity: 6, unit: 'pièce' }), // 6 x 0.5-1 -> 3-6
    ];
    expect(groceryCost(items, ingredientsById)).toEqual({ min: 18, max: 36 });
  });

  it('matches an item by name when it carries no ingredient id', () => {
    const items = [item({ ingredient_id: undefined, name: 'Tomate', quantity: 2, unit: 'kg' })];
    expect(groceryCost(items, ingredientsById)).toEqual({ min: 20, max: 40 });
  });

  it('excludes items without a matching ingredient or an incomparable unit', () => {
    const items = [
      item({ name: 'Inconnu', ingredient_id: undefined }),
      item({ id: 'g2', name: 'Oeuf', ingredient_id: 'ing_oeuf', quantity: 2, unit: 'kg' }), // eggs are not sold by the kg
    ];
    expect(groceryCost(items, ingredientsById)).toEqual({ min: 0, max: 0 });
  });

  it('returns zero for an empty list', () => {
    expect(groceryCost([], ingredientsById)).toEqual({ min: 0, max: 0 });
  });
});
