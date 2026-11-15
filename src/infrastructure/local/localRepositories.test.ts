import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalKitchenRepository } from './localRepositories';
import { storage } from './storage';
import { DEFAULT_GROCERY_LIST_NAME, type GroceryItem } from '@/core/grocery';

/**
 * The scoped kitchen document is tested against a fake localStorage: the interesting part
 * is the migration of the docs written before the named shopping lists, which must happen
 * once, on the first read, and be saved back right away.
 */

const ITEM: GroceryItem = { id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce', category: 'other', is_checked: false };

function fakeLocalStorage(): void {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => void map.clear(),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('the local kitchen repository', () => {
  it('saves and reads the named lists back with the active id', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const lists = [
      { id: 'l1', name: 'Weekend', items: [ITEM], note: '', spent_tnd: null },
      { id: 'l2', name: 'Ramadan', items: [], note: 'chez Carrefour', spent_tnd: 12 },
    ];
    repo.saveGroceryLists({ lists, activeId: 'l2' });
    expect(repo.loadGroceryLists()).toEqual({ lists, activeId: 'l2' });
  });

  it('migrates a legacy scoped doc on the first read and saves the new shape back at once', () => {
    fakeLocalStorage();
    const legacyDoc = {
      favorites: ['r1'],
      fridge: ['ing1'],
      pantry: [],
      weeklyPlan: [],
      groceryList: [ITEM],
      groceryNote: 'chez Carrefour',
      grocerySpent: 25.5,
      sections: { favorites: 100 },
      pending: ['favorites'],
      preferencesSyncedAt: null,
    };
    storage.saveKitchenDoc('u1', legacyDoc as never);

    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({
      name: DEFAULT_GROCERY_LIST_NAME,
      items: [ITEM],
      note: 'chez Carrefour',
      spent_tnd: 25.5,
    });
    expect(state.activeId).toBe(state.lists[0].id);

    // The migrated shape replaced the legacy one in storage right away (one write)
    const stored = storage.getKitchenDoc('u1')!;
    expect(stored.groceryLists).toEqual(state);
    expect(stored.groceryList).toBeUndefined();
    expect(stored.groceryNote).toBeUndefined();
    expect(stored.grocerySpent).toBeUndefined();
    // The migrated lists count as changed here: they are pushed to the server once synced
    expect(stored.pending).toContain('groceryLists');
    expect(stored.sections.groceryLists).toBeGreaterThan(0);
    expect(stored.favorites).toEqual(['r1']); // the rest of the doc is untouched
  });

  it('migrates only once: the list ids stay stable across reads', () => {
    fakeLocalStorage();
    storage.saveKitchenDoc('u1', { groceryList: [ITEM] } as never);
    const repo = createLocalKitchenRepository(() => 'u1');
    const first = repo.loadGroceryLists();
    const second = repo.loadGroceryLists();
    expect(second).toEqual(first);
  });

  it('adopts the unscoped legacy keys of an old version into one default-named list', () => {
    fakeLocalStorage();
    storage.saveGroceryList([ITEM]);
    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({ name: DEFAULT_GROCERY_LIST_NAME, items: [ITEM], note: '', spent_tnd: null });
    // The adopted legacy list counts as changed here: it is pushed to the server once synced
    expect(repo.ledger.pending()).toContain('groceryLists');
  });

  it('starts a new scope with one empty default-named list', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({ name: DEFAULT_GROCERY_LIST_NAME, items: [], note: '', spent_tnd: null });
    expect(state.activeId).toBe(state.lists[0].id);
  });

  it('reports data through the ledger, named lists included', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const { ledger } = repo;
    repo.saveGroceryLists({
      lists: [{ id: 'l1', name: 'Weekend', items: [ITEM], note: '', spent_tnd: null }],
      activeId: 'l1',
    });
    expect(ledger.hasData()).toBe(true);
    expect(ledger.pending()).toContain('groceryLists');
    expect(ledger.sectionTimes().groceryLists).toBeGreaterThan(0);
    ledger.confirm(['groceryLists']);
    expect(ledger.pending()).not.toContain('groceryLists');
  });
});
