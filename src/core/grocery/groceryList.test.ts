import { describe, expect, it } from 'vitest';
import { addGroceryItems, buildGroceryListFromPlan, clearCheckedGroceryItems, toggleGroceryItem } from './groceryList';
import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';

let n = 0;
const newId = (prefix: string) => `${prefix}_${++n}`;

const ingredients = [
  { id: 'ing_tomate', name_fr: 'Tomate', category: 'vegetables' },
  { id: 'ing_oeuf', name_fr: 'Oeuf', category: 'dairy_eggs' },
] as Ingredient[];

const recipe = (id: string, items: [string, number][]) =>
  ({
    id,
    ingredients: items.map(([ingredient_id, quantity_base]) => ({ ingredient_id, quantity_base, unit: 'kg' })),
  }) as Recipe;

const recipes = [
  recipe('r1', [
    ['ing_tomate', 0.5],
    ['ing_oeuf', 4],
  ]),
  recipe('r2', [
    ['ing_tomate', 0.25],
    ['ing_inconnu', 1],
  ]),
];

const day = (lunch: DayPlan['lunch'], dinner: DayPlan['dinner'] = {}) => ({ day_id: 'mon', lunch, dinner }) as DayPlan;

describe('buildGroceryListFromPlan', () => {
  it('sums quantities of the same ingredient across every planned dish', () => {
    const list = buildGroceryListFromPlan(
      [day({ plat_id: 'r1', entree_id: 'r2' }, { plat_id: 'r1' })],
      recipes,
      ingredients,
      newId
    );
    const tomate = list.find((i) => i.name === 'Tomate');
    expect(tomate?.quantity).toBe(1.3); // 0.25 + 0.5 + 0.5, rounded to 1 decimal
    expect(list.find((i) => i.name === 'Oeuf')?.quantity).toBe(8);
    expect(list.every((i) => !i.is_checked)).toBe(true);
  });

  it('keeps unknown ingredients under their id, in the "other" category', () => {
    const list = buildGroceryListFromPlan([day({ plat_id: 'r2' })], recipes, ingredients, newId);
    expect(list.find((i) => i.name === 'ing_inconnu')?.category).toBe('other');
  });

  it('ignores recipes that no longer exist', () => {
    expect(buildGroceryListFromPlan([day({ plat_id: 'deleted' })], recipes, ingredients, newId)).toEqual([]);
  });
});

describe('grocery list editing', () => {
  it('adds custom items with defaults, toggles and clears checked ones', () => {
    let list = addGroceryItems([], [{ name: 'Pain' }, { name: 'Lait', quantity: 2, unit: 'L' }], newId);
    expect(list.map((i) => [i.name, i.quantity, i.unit, i.is_custom])).toEqual([
      ['Pain', 1, 'pièce', true],
      ['Lait', 2, 'L', true],
    ]);
    list = toggleGroceryItem(list, list[0].id);
    expect(list[0].is_checked).toBe(true);
    expect(clearCheckedGroceryItems(list).map((i) => i.name)).toEqual(['Lait']);
  });
});
