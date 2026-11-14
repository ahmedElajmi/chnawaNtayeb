import { describe, expect, it } from 'vitest';
import { AISLE_ORDER, groupByAisle } from './aisles';
import type { GroceryItem } from './types';

const item = (overrides: Partial<GroceryItem>): GroceryItem => ({
  id: overrides.id ?? 'g1',
  name: 'Tomate',
  quantity: 1,
  unit: 'kg',
  category: 'vegetables',
  is_checked: false,
  ...overrides,
});

describe('AISLE_ORDER', () => {
  it('walks fresh produce first and always ends with "other"', () => {
    expect(AISLE_ORDER[0]).toBe('vegetables');
    expect(AISLE_ORDER.at(-1)).toBe('other');
    expect(new Set(AISLE_ORDER).size).toBe(AISLE_ORDER.length);
  });
});

describe('groupByAisle', () => {
  it('groups items per aisle in store walk order', () => {
    const groups = groupByAisle([
      item({ id: 'a', category: 'dairy_eggs' }),
      item({ id: 'b', category: 'vegetables' }),
      item({ id: 'c', category: 'vegetables' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['vegetables', 'dairy_eggs']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'c']);
  });

  it('appends unknown categories after every built-in aisle', () => {
    const groups = groupByAisle([
      item({ id: 'a', category: 'epicerie_maison' }),
      item({ id: 'b', category: 'other' }),
      item({ id: 'c', category: 'meats' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['meats', 'other', 'epicerie_maison']);
  });

  it('keeps checked items as-is and returns no empty aisle', () => {
    const groups = groupByAisle([item({ id: 'a', category: 'meats', is_checked: true })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items[0].is_checked).toBe(true);
  });

  it('returns an empty list for an empty shopping list', () => {
    expect(groupByAisle([])).toEqual([]);
  });
});
