import { describe, expect, it } from 'vitest';
import { KitchenStore } from './KitchenStore';
import { DEFAULT_GROCERY_LIST_NAME, type GroceryItem, type GroceryList } from '@/core/grocery';
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

const list = (id: string, name: string, items: GroceryItem[] = []): GroceryList => ({
  id,
  name,
  items,
  note: '',
  spent_tnd: null,
});

function makeStore(
  initial: GroceryList[],
  activeId?: string
): {
  store: KitchenStore;
  saved: { lists: GroceryList[]; activeId: string }[];
} {
  const saved: { lists: GroceryList[]; activeId: string }[] = [];
  const state = { lists: initial, activeId: activeId ?? initial[0]?.id ?? '' };
  const repo: KitchenRepository = {
    loadFridge: () => [],
    saveFridge: () => undefined,
    loadPantry: () => [],
    savePantry: () => undefined,
    loadFavorites: () => [],
    saveFavorites: () => undefined,
    loadWeeklyPlan: () => [],
    saveWeeklyPlan: () => undefined,
    loadGroceryLists: () => state,
    saveGroceryLists: (next) => {
      state.lists = next.lists;
      state.activeId = next.activeId;
      saved.push(next);
    },
  };
  return { store: new KitchenStore(repo), saved };
}

describe('KitchenStore: shopping list unit change', () => {
  it('converts the quantity and saves the list', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend', [item({ name: 'Tomate', quantity: 500, unit: 'g' })])]);
    store.setGroceryItemUnit('g_tomate', 'kg');
    expect(store.groceryList[0]).toMatchObject({ quantity: 0.5, unit: 'kg' });
    expect(saved).toHaveLength(1);
    expect(saved[0].lists[0].items[0]).toMatchObject({ quantity: 0.5, unit: 'kg' });
    expect(saved[0].activeId).toBe('l1');
  });

  it('leaves the list untouched on an incompatible unit', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend', [item({ name: 'Tomate', quantity: 500, unit: 'g' })])]);
    store.setGroceryItemUnit('g_tomate', 'ml');
    expect(store.groceryList).toEqual([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    expect(saved).toHaveLength(0);
  });

  it('leaves the list untouched on an unknown item', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend', [item({ name: 'Tomate', quantity: 500, unit: 'g' })])]);
    store.setGroceryItemUnit('missing', 'kg');
    expect(store.groceryList).toEqual([item({ name: 'Tomate', quantity: 500, unit: 'g' })]);
    expect(saved).toHaveLength(0);
  });
});

describe('KitchenStore: the active named list', () => {
  it('serves the items, note and spend of the active list through the compat getter', () => {
    const { store } = makeStore(
      [list('l1', 'Weekend', [item({ name: 'Pain' })]), list('l2', 'Ramadan', [item({ name: 'Dattes' })])],
      'l2'
    );
    store.setGroceryNote('chez Carrefour');
    store.setGrocerySpent(37.5);
    expect(store.getState().activeGroceryListId).toBe('l2');
    expect(store.groceryList).toEqual([item({ name: 'Dattes' })]);
    expect(store.activeGroceryList()).toMatchObject({ name: 'Ramadan', note: 'chez Carrefour', spent_tnd: 37.5 });
    // The other list is untouched
    expect(store.getState().groceryLists[0]).toMatchObject({ name: 'Weekend', note: '', spent_tnd: null });
  });

  it('targets another list by id without changing the active one', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')], 'l1');
    store.addGroceryItems([{ name: 'Lait', quantity: 1, unit: 'l' }], 'l2');
    expect(store.getState().activeGroceryListId).toBe('l1');
    expect(store.getState().groceryLists[1].items).toHaveLength(1);
    expect(store.getState().groceryLists[0].items).toHaveLength(0);
    expect(saved[0].activeId).toBe('l1');
    expect(store.getState().groceryLists.map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('falls back to the first list when the active id no longer exists', () => {
    const { store } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')], 'gone');
    expect(store.activeGroceryList().id).toBe('l1');
  });
});

describe('KitchenStore: creating, renaming and deleting lists', () => {
  it('creates a list, activates it and saves it', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend')]);
    store.createGroceryList('Ramadan');
    const { groceryLists, activeGroceryListId } = store.getState();
    expect(groceryLists).toHaveLength(2);
    expect(groceryLists[1]).toMatchObject({ name: 'Ramadan', items: [], note: '', spent_tnd: null });
    expect(activeGroceryListId).toBe(groceryLists[1].id);
    expect(saved).toHaveLength(1);
  });

  it('uses the default name when none is given', () => {
    const { store } = makeStore([list('l1', 'Weekend')]);
    store.createGroceryList();
    expect(store.getState().groceryLists[1].name).toBe(DEFAULT_GROCERY_LIST_NAME);
  });

  it('renames one list in place', () => {
    const { store } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')]);
    store.renameGroceryList('l2', '  Ramadan 2026 ');
    expect(store.getState().groceryLists[1].name).toBe('Ramadan 2026');
    expect(store.getState().groceryLists.map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('ignores a rename of an unknown list or with an empty name', () => {
    const { store } = makeStore([list('l1', 'Weekend')]);
    store.renameGroceryList('nope', 'X');
    store.renameGroceryList('l1', '   ');
    expect(store.getState().groceryLists[0].name).toBe('Weekend');
  });

  it('deletes a list and falls back to the first remaining one when it was active', () => {
    const { store } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')], 'l2');
    store.deleteGroceryList('l2');
    expect(store.getState().groceryLists.map((l) => l.id)).toEqual(['l1']);
    expect(store.getState().activeGroceryListId).toBe('l1');
  });

  it('never deletes the last list', () => {
    const { store } = makeStore([list('l1', 'Weekend')]);
    store.deleteGroceryList('l1');
    expect(store.getState().groceryLists).toHaveLength(1);
    expect(store.getState().groceryLists[0].name).toBe('Weekend');
  });

  it('keeps the active list when another one is deleted', () => {
    const { store } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')], 'l2');
    store.deleteGroceryList('l1');
    expect(store.getState().activeGroceryListId).toBe('l2');
  });
});

describe('KitchenStore: duplicating lists', () => {
  const source = list('l1', 'Weekend', [item({ name: 'Tomates', is_checked: true })]);
  source.note = 'chez Carrefour';
  source.spent_tnd = 42.5;

  it('duplicates with a name from the caller, unchecked items and no spend', () => {
    const { store } = makeStore([source, list('l2', 'Ramadan')], 'l2');
    store.duplicateGroceryList('l1', 'Weekend bis');
    const { groceryLists, activeGroceryListId } = store.getState();
    expect(groceryLists).toHaveLength(3);
    const duplicate = groceryLists[2];
    expect(duplicate.name).toBe('Weekend bis');
    expect(duplicate.items.map((i) => i.name)).toEqual(['Tomates']);
    expect(duplicate.items.every((i) => !i.is_checked && i.id !== 'g_tomates')).toBe(true);
    expect(duplicate.note).toBe('chez Carrefour');
    expect(duplicate.spent_tnd).toBeNull();
    // Duplicating does not move the focus
    expect(activeGroceryListId).toBe('l2');
  });

  it('keeps the name unique when none is given', () => {
    const { store } = makeStore([list('l1', DEFAULT_GROCERY_LIST_NAME), list('l2', 'Mes courses 2')]);
    store.duplicateGroceryList('l1');
    expect(store.getState().groceryLists[2].name).toBe('Mes courses 3');
  });

  it('builds a list from history items and activates it', () => {
    const { store } = makeStore([list('l1', 'Weekend')]);
    store.createGroceryListFromItems('Semaine 12', [item({ name: 'Œufs', is_checked: true })]);
    const created = store.getState().groceryLists[1];
    expect(created.name).toBe('Semaine 12');
    expect(created.items[0].is_checked).toBe(false);
    expect(created.items[0].id).not.toBe('g_œufs');
    expect(created.note).toBe('');
    expect(created.spent_tnd).toBeNull();
    expect(store.getState().activeGroceryListId).toBe(created.id);
  });
});

describe('KitchenStore: activating, clearing and regenerating', () => {
  it('switches the active list and persists it', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend'), list('l2', 'Ramadan')]);
    store.setActiveGroceryList('l2');
    expect(store.getState().activeGroceryListId).toBe('l2');
    expect(saved[0].activeId).toBe('l2');
  });

  it('ignores an unknown list id', () => {
    const { store, saved } = makeStore([list('l1', 'Weekend')]);
    store.setActiveGroceryList('nope');
    expect(store.getState().activeGroceryListId).toBe('l1');
    expect(saved).toHaveLength(0);
  });

  it('clears the active list: items, note and spend together', () => {
    const { store } = makeStore([list('l1', 'Weekend', [item({ name: 'Pain' })])]);
    store.setGroceryNote('chez Carrefour');
    store.setGrocerySpent(20);
    store.clearGroceryList();
    expect(store.activeGroceryList()).toMatchObject({ items: [], note: '', spent_tnd: null });
    expect(store.getState().groceryLists).toHaveLength(1);
  });

  it('replaces the items of one list (backup restore) without touching the others', () => {
    const { store } = makeStore([list('l1', 'Weekend', [item({ name: 'Pain' })]), list('l2', 'Ramadan')]);
    store.setGroceryList([item({ name: 'Lait' })], 'l2');
    expect(store.getState().groceryLists[1].items.map((i) => i.name)).toEqual(['Lait']);
    expect(store.getState().groceryLists[0].items).toHaveLength(1);
  });
});
