import { describe, expect, it } from 'vitest';
import { planCostRange } from './budget';
import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';

const ingredients = [
  {
    id: 'ing_tomate',
    name_fr: 'Tomate',
    name_derja: 'Tomate',
    name_ar: 'طماطم',
    category: 'vegetables',
    unit_default: 'kg',
    price_min_tnd: 10,
    price_max_tnd: 20,
  },
] as Ingredient[];

const recipe = (id: string, overrides: Partial<Recipe> = {}): Recipe =>
  ({
    id,
    ingredients: [{ ingredient_id: 'ing_tomate', quantity_base: 0.5, unit: 'kg' }],
    estimated_cost_tnd: 0,
    ...overrides,
  }) as Recipe;

const day = (lunch: DayPlan['lunch'], dinner: DayPlan['dinner'] = {}) => ({ day_id: 'mon', lunch, dinner }) as DayPlan;

describe('planCostRange', () => {
  it('sums the cost range of every unique recipe of the plan', () => {
    const recipes = [
      recipe('r1'),
      recipe('r2', { ingredients: [{ ingredient_id: 'ing_tomate', quantity_base: 1, unit: 'kg' }] }),
    ];
    // r1 (0.5 kg -> 5-10) + r2 (1 kg -> 10-20)
    const range = planCostRange([day({ plat_id: 'r1', entree_id: 'r2' }, { plat_id: 'r1' })], recipes, ingredients);
    expect(range).toEqual({ min: 15, max: 30 });
  });

  it('counts a repeated meal only once', () => {
    const recipes = [recipe('r1')];
    // 2 occurrences of r1 would give 10-20, a single one gives 5-10
    const range = planCostRange([day({ plat_id: 'r1' }, { plat_id: 'r1' })], recipes, ingredients);
    expect(range).toEqual({ min: 5, max: 10 });
  });

  it('skips recipes that no longer exist', () => {
    expect(planCostRange([day({ plat_id: 'deleted' })], [recipe('r1')], ingredients)).toEqual({ min: 0, max: 0 });
  });

  it('falls back to the chef estimate when no ingredient can be priced', () => {
    const recipes = [
      recipe('r3', {
        ingredients: [{ ingredient_id: 'ing_inconnu', quantity_base: 2, unit: 'pièce' }],
        estimated_cost_tnd: 12,
      }),
    ];
    const range = planCostRange([day({ plat_id: 'r3' })], recipes, ingredients);
    expect(range).toEqual({ min: 12, max: 12 });
  });
});
