import { describe, expect, it } from 'vitest';
import {
  addGroceryItems,
  buildGroceryListFromPlan,
  clearCheckedGroceryItems,
  removeGroceryItem,
  toggleGroceryItem,
  updateGroceryItemQuantity,
} from './groceryList';
import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';

let n = 0;
const newId = (prefix: string) => `${prefix}_${++n}`;

const ingredients = [
  { id: 'ing_tomate', name_fr: 'Tomate', category: 'vegetables' },
  { id: 'ing_oeuf', name_fr: 'Oeuf', category: 'dairy_eggs' },
] as Ingredient[];

const recipe = (id: string, items: [string, number, string?][], baseServings?: number) =>
  ({
    id,
    base_servings: baseServings,
    ingredients: items.map(([ingredient_id, quantity_base, unit]) => ({
      ingredient_id,
      quantity_base,
      unit: unit ?? 'kg',
    })),
  }) as unknown as Recipe;

const recipes = [
  recipe('r1', [
    ['ing_tomate', 0.5],
    ['ing_oeuf', 4, 'pièce'],
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
    expect(tomate?.quantity).toBe(1.25); // 0.25 kg + 0.5 kg + 0.5 kg
    expect(tomate?.unit).toBe('kg');
    expect(tomate?.ingredient_id).toBe('ing_tomate');
    expect(tomate?.category).toBe('vegetables');
    const oeuf = list.find((i) => i.name === 'Oeuf');
    expect(oeuf?.quantity).toBe(8);
    expect(oeuf?.unit).toBe('pièce');
    expect(list.every((i) => !i.is_checked)).toBe(true);
  });

  it('keeps unknown ingredients under their id, in the "other" category', () => {
    const list = buildGroceryListFromPlan([day({ plat_id: 'r2' })], recipes, ingredients, newId);
    const unknown = list.find((i) => i.name === 'ing_inconnu');
    expect(unknown?.category).toBe('other');
    expect(unknown?.ingredient_id).toBe('ing_inconnu');
    expect(unknown?.quantity).toBe(1); // 1 kg kept as kg
  });

  it('ignores recipes that no longer exist', () => {
    expect(buildGroceryListFromPlan([day({ plat_id: 'deleted' })], recipes, ingredients, newId)).toEqual([]);
  });

  it('scales quantities to the requested household servings', () => {
    const scaled = recipe(
      'r3',
      [
        ['ing_tomate', 0.5],
        ['ing_oeuf', 2, 'pièce'],
      ],
      4
    );
    const list = buildGroceryListFromPlan([day({ plat_id: 'r3' })], [scaled], ingredients, newId, { servings: 6 });
    expect(list.find((i) => i.name === 'Tomate')?.quantity).toBe(750); // 0.5 kg * 6/4 = 750 g
    expect(list.find((i) => i.name === 'Oeuf')?.quantity).toBe(3); // 2 pièces * 6/4
  });

  it('does not scale when no servings are given (unit still canonicalized)', () => {
    const scaled = recipe('r3', [['ing_tomate', 0.5]], 4);
    const list = buildGroceryListFromPlan([day({ plat_id: 'r3' })], [scaled], ingredients, newId);
    expect(list[0]).toMatchObject({ quantity: 500, unit: 'g' });
  });

  it('consolidates compatible units into the most readable one', () => {
    const mixed = [recipe('r1', [['ing_tomate', 500, 'g']]), recipe('r2', [['ing_tomate', 1, 'kg']])];
    const list = buildGroceryListFromPlan([day({ plat_id: 'r1' }, { plat_id: 'r2' })], mixed, ingredients, newId);
    expect(list).toHaveLength(1);
    expect(list[0].quantity).toBe(1.5); // 500 g + 1 kg -> 1.5 kg
    expect(list[0].unit).toBe('kg');
  });

  it('keeps small quantities in grams', () => {
    const small = recipe('r1', [['ing_tomate', 500, 'g']]);
    const list = buildGroceryListFromPlan([day({ plat_id: 'r1' })], [small], ingredients, newId);
    expect(list[0]).toMatchObject({ quantity: 500, unit: 'g' });
  });

  it('splits incompatible units into distinct entries of the same ingredient', () => {
    const mixed = [recipe('r1', [['ing_tomate', 500, 'g']]), recipe('r2', [['ing_tomate', 200, 'ml']])];
    const list = buildGroceryListFromPlan([day({ plat_id: 'r1' }, { plat_id: 'r2' })], mixed, ingredients, newId);
    expect(list.map((i) => [i.name, i.quantity, i.unit])).toEqual([
      ['Tomate', 500, 'g'],
      ['Tomate', 200, 'ml'],
    ]);
    expect(list.every((i) => i.ingredient_id === 'ing_tomate')).toBe(true);
  });

  it('keeps units that cannot be converted as separate raw entries', () => {
    const raw = recipe('r1', [['ing_tomate', 3, 'c.à.s / bol']]);
    const list = buildGroceryListFromPlan([day({ plat_id: 'r1' })], [raw], ingredients, newId);
    expect(list[0].quantity).toBe(3);
    expect(list[0].unit).toBe('c.à.s / bol');
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

  it('removes an item by id', () => {
    const list = addGroceryItems([], [{ name: 'Pain' }, { name: 'Lait' }], newId);
    const next = removeGroceryItem(list, list[0].id);
    expect(next.map((i) => i.name)).toEqual(['Lait']);
    expect(removeGroceryItem(list, 'missing')).toEqual(list);
  });

  it('updates the quantity of one item and rejects invalid values', () => {
    const list = addGroceryItems([], [{ name: 'Pain', quantity: 1 }], newId);
    const next = updateGroceryItemQuantity(list, list[0].id, 3);
    expect(next[0].quantity).toBe(3);
    expect(updateGroceryItemQuantity(list, list[0].id, -1)).toEqual(list);
    expect(updateGroceryItemQuantity(list, list[0].id, NaN)).toEqual(list);
    expect(updateGroceryItemQuantity(list, 'missing', 3)).toEqual(list);
  });
});
