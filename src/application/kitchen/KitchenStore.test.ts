import { describe, expect, it } from 'vitest';
import { KitchenStore } from './KitchenStore';
import type { GroceryItem } from '@/core/grocery';
import type { KitchenRepository } from '../ports';

/** The store is tested with an in-memory fake of the repository port, like the UI uses it. */

const item = (overrides: Partial<GroceryItem> & { name: string }): GroceryItem => ({
  id: `g_${overrides.name.toLowerCase().replace(/\s+/g, '_')}`,
  quantity: 1,
  unit: 'pièce',
  category: 'other',
  is_checked: false,
  ...overrides,
});

function makeStore(initial: GroceryItem[]): { store: KitchenStore; saved: GroceryItem[][] } {
  const saved: GroceryItem[][] = [];
  const repo: KitchenRepository = {
    loadFridge: () => [],
    saveFridge: () => undefined,
    loadPantry: () => [],
    savePantry: () => undefined,
    loadFavorites: () => [],
    saveFavorites: () => undefined,
    loadWeeklyPlan: () => [],
    saveWeeklyPlan: () => undefined,
    loadGroceryList: () => initial,
    saveGroceryList: (items) => saved.push(items),
    loadGroceryMeta: () => ({ note: '', spent: null }),
    saveGroceryMeta: () => undefined,
  };
  return { store: new KitchenStore(repo), saved };
}

describe('KitchenStore: shopping list unit change', () => {
  it('converts the quantity and saves the list', () => {
    const { store, saved } = makeStore([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    store.setGroceryItemUnit('g_tomate', 'kg');
    expect(store.getState().groceryList[0]).toMatchObject({ quantity: 0.5, unit: 'kg' });
    expect(saved).toHaveLength(1);
    expect(saved[0][0]).toMatchObject({ quantity: 0.5, unit: 'kg' });
  });

  it('leaves the list untouched on an incompatible unit', () => {
    const { store, saved } = makeStore([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    store.setGroceryItemUnit('g_tomate', 'ml');
    expect(store.getState().groceryList).toEqual([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    expect(saved).toHaveLength(0);
  });

  it('leaves the list untouched on an unknown item', () => {
    const { store, saved } = makeStore([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    store.setGroceryItemUnit('missing', 'kg');
    expect(store.getState().groceryList).toEqual([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    expect(saved).toHaveLength(0);
  });
});
