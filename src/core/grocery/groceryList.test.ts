import { describe, expect, it } from 'vitest';
import {
  addGroceryItems,
  buildGroceryListFromPlan,
  changeGroceryItemUnit,
  clearCheckedGroceryItems,
  removeGroceryItem,
  toggleGroceryItem,
  updateGroceryItemQuantity,
} from './groceryList';
import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';
import type { GroceryItem } from './types';

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

describe('addGroceryItems: merging on compatible units', () => {
  const item = (overrides: Partial<GroceryItem> & { name: string }): GroceryItem => ({
    id: `g_${overrides.name.toLowerCase().replace(/\s+/g, '_')}`,
    quantity: 1,
    unit: 'pièce',
    category: 'other',
    is_checked: false,
    ...overrides,
  });

  it('merges a compatible unit into the existing row, converted to its unit', () => {
    const list = [item({ name: 'Lait', quantity: 1, unit: 'L', is_custom: true, is_checked: true })];
    const next = addGroceryItems(list, [{ name: 'lait', quantity: 500, unit: 'ml' }], newId);
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ name: 'Lait', quantity: 1.5, unit: 'L', is_checked: false, is_custom: true });
  });

  it('merges by ingredient id and keeps the category and custom flag of the existing row', () => {
    const list = [
      item({ name: 'Tomate', ingredient_id: 'ing_tomate', quantity: 500, unit: 'g', category: 'vegetables' }),
    ];
    const next = addGroceryItems(
      list,
      [{ name: 'Tomate', ingredient_id: 'ing_tomate', quantity: 1, unit: 'kg' }],
      newId
    );
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      ingredient_id: 'ing_tomate',
      quantity: 1500, // 500 g + 1 kg converted to the existing row's unit (g)
      unit: 'g',
      category: 'vegetables',
    });
    expect(next[0].id).toBe(list[0].id);
    expect('is_custom' in next[0]).toBe(false);
  });

  it('unchecks the row it merges into (something to buy was just added)', () => {
    const list = [item({ name: 'Farine', quantity: 2, unit: 'kg', is_checked: true, is_custom: true })];
    const next = addGroceryItems(list, [{ name: 'Farine', quantity: 1, unit: 'kg' }], newId);
    expect(next[0]).toMatchObject({ quantity: 3, unit: 'kg', is_checked: false });
  });

  it('keeps two rows when the units are incompatible', () => {
    const list = [item({ name: 'Tomate', ingredient_id: 'ing_tomate', quantity: 500, unit: 'g', is_checked: true })];
    const next = addGroceryItems(list, [{ name: 'Tomate', quantity: 2, unit: 'pièces' }], newId);
    expect(next.map((i) => [i.quantity, i.unit, i.is_checked, i.is_custom])).toEqual([
      [500, 'g', true, undefined],
      [2, 'pièces', false, true],
    ]);
  });

  it('keeps two rows for different counted things of the same ingredient', () => {
    const list = [item({ name: 'Ail', quantity: 2, unit: 'tête' })];
    const next = addGroceryItems(list, [{ name: 'Ail', quantity: 3, unit: 'gousse' }], newId);
    expect(next.map((i) => i.unit)).toEqual(['tête', 'gousse']);
  });

  it('merges two added items of the same name into one row', () => {
    const next = addGroceryItems(
      [],
      [
        { name: 'Eau', quantity: 1, unit: 'l' },
        { name: 'eau', quantity: 500, unit: 'ml' },
      ],
      newId
    );
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ quantity: 1.5, unit: 'l', is_custom: true });
  });

  it('adds a row when the name alone differs, even in the same unit', () => {
    const list = [item({ name: 'Lait', quantity: 1, unit: 'l' })];
    const next = addGroceryItems(list, [{ name: 'Eau', quantity: 1, unit: 'l' }], newId);
    expect(next.map((i) => i.name)).toEqual(['Lait', 'Eau']);
  });
});

describe('changeGroceryItemUnit', () => {
  const item = (overrides: Partial<GroceryItem> & { name: string }): GroceryItem => ({
    id: `g_${overrides.name.toLowerCase()}`,
    quantity: 1,
    unit: 'pièce',
    category: 'other',
    is_checked: false,
    ...overrides,
  });

  it('converts the quantity to the new unit', () => {
    const list = [item({ name: 'Tomate', quantity: 500, unit: 'g' })];
    const next = changeGroceryItemUnit(list, list[0].id, 'kg');
    expect(next).toEqual([item({ name: 'Tomate', quantity: 0.5, unit: 'kg' })]);
    expect(list[0].unit).toBe('g'); // the original list is untouched
  });

  it('accepts the same unit written differently, including plural forms', () => {
    const list = [item({ name: 'Oeuf', quantity: 6, unit: 'pièces' })];
    expect(changeGroceryItemUnit(list, list[0].id, 'pièce')?.[0]).toMatchObject({ quantity: 6, unit: 'pièce' });
    expect(changeGroceryItemUnit(list, list[0].id, 'PIECES')).toBeNull(); // not the same written label
    expect(changeGroceryItemUnit(list, list[0].id, 'Pièces')?.[0]).toMatchObject({ quantity: 6, unit: 'Pièces' });
  });

  it('keeps units that cannot be compared when asked for themselves', () => {
    const list = [item({ name: 'Huile', quantity: 3, unit: 'c.à.s / bol' })];
    expect(changeGroceryItemUnit(list, list[0].id, 'c.à.s / bol')?.[0]).toMatchObject({
      quantity: 3,
      unit: 'c.à.s / bol',
    });
  });

  it('returns null and leaves the list untouched on an incompatible unit', () => {
    const list = [item({ name: 'Tomate', quantity: 500, unit: 'g' }), item({ name: 'Oeuf', quantity: 2 })];
    expect(changeGroceryItemUnit(list, list[0].id, 'ml')).toBeNull();
    expect(changeGroceryItemUnit(list, list[0].id, 'pièce')).toBeNull();
    expect(changeGroceryItemUnit(list, list[0].id, '')).toBeNull();
    expect(changeGroceryItemUnit(list, 'missing', 'kg')).toBeNull();
    expect(list).toEqual([item({ name: 'Tomate', quantity: 500, unit: 'g' }), item({ name: 'Oeuf', quantity: 2 })]);
  });
});
