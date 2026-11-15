import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GROCERY_LIST_NAME,
  createGroceryList,
  deleteGroceryList,
  duplicateGroceryList,
  groceryListFromItems,
  renameGroceryList,
  resolveActiveGroceryListId,
} from './lists';
import type { GroceryItem, GroceryList } from './types';

/** Injected id factory: deterministic ids in call order (list ids, then item ids). */
let idCounter = 0;
const newId = (prefix: string) => `${prefix}_test_${++idCounter}`;

beforeEach(() => {
  idCounter = 0;
});

const item = (name: string, overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: `g_${name.toLowerCase()}`,
  name,
  quantity: 1,
  unit: 'pièce',
  category: 'other',
  is_checked: false,
  ...overrides,
});

const list = (id: string, name: string, items: GroceryItem[] = [], extra: Partial<GroceryList> = {}): GroceryList => ({
  id,
  name,
  items,
  note: '',
  spent_tnd: null,
  ...extra,
});

describe('createGroceryList', () => {
  it('appends an empty list, keeping the existing ones and their order', () => {
    const lists = [list('l1', 'Weekend')];
    const next = createGroceryList(lists, 'Ramadan', newId);
    expect(next).toHaveLength(2);
    expect(next[0]).toBe(lists[0]);
    expect(next[1]).toMatchObject({ name: 'Ramadan', items: [], note: '', spent_tnd: null });
    expect(next[1].id).toBe('grocery_list_test_1');
  });

  it('trims the name and falls back to the default name when it is empty', () => {
    const next = createGroceryList([], '  Courses du soir  ', newId);
    expect(next[0].name).toBe('Courses du soir');
    expect(createGroceryList([], '   ', newId)[0].name).toBe(DEFAULT_GROCERY_LIST_NAME);
    expect(createGroceryList([], '', newId)[0].name).toBe(DEFAULT_GROCERY_LIST_NAME);
  });
});

describe('renameGroceryList', () => {
  const lists = [list('l1', 'Weekend'), list('l2', 'Ramadan')];

  it('renames one list without moving it', () => {
    const next = renameGroceryList(lists, 'l2', '  Ramadan 2026  ');
    expect(next?.[1].name).toBe('Ramadan 2026');
    expect(next?.[0]).toBe(lists[0]);
  });

  it('returns null when the list does not exist', () => {
    expect(renameGroceryList(lists, 'nope', 'X')).toBeNull();
  });

  it('returns null on an empty trimmed name', () => {
    expect(renameGroceryList(lists, 'l1', '   ')).toBeNull();
    expect(renameGroceryList(lists, 'l1', '')).toBeNull();
  });

  it('caps the name at 80 characters', () => {
    const next = renameGroceryList(lists, 'l1', 'a'.repeat(90));
    expect(next?.[0].name).toHaveLength(80);
  });
});

describe('deleteGroceryList', () => {
  const lists = [list('l1', 'Weekend'), list('l2', 'Ramadan'), list('l3', 'Freezer')];

  it('removes the list and keeps the others in order', () => {
    const result = deleteGroceryList(lists, 'l1', 'l2', newId);
    expect(result).toEqual({ lists: [lists[0], lists[2]], activeId: 'l1' });
  });

  it('activates the first remaining list when the active one is deleted', () => {
    const result = deleteGroceryList(lists, 'l2', 'l2', newId);
    expect(result?.lists.map((l) => l.id)).toEqual(['l1', 'l3']);
    expect(result?.activeId).toBe('l1');
  });

  it('never removes the last list', () => {
    expect(deleteGroceryList([lists[0]], 'l1', 'l1', newId)).toBeNull();
  });

  it('returns null when the list does not exist', () => {
    expect(deleteGroceryList(lists, 'l1', 'nope', newId)).toBeNull();
  });
});

describe('duplicateGroceryList', () => {
  const source = list(
    'l1',
    'Weekend',
    [item('Tomates', { is_checked: true, quantity: 3 }), item('Pain', { id: 'g_2', is_checked: false })],
    { note: 'chez Carrefour', spent_tnd: 42.5 }
  );
  const lists = [source, list('l2', 'Ramadan')];

  it('appends a copy with fresh ids, unchecked items, the note but no spend', () => {
    const next = duplicateGroceryList(lists, 'l1', 'Weekend (copie)', newId);
    expect(next).toHaveLength(3);
    const duplicate = next![2];
    expect(duplicate.name).toBe('Weekend (copie)');
    expect(duplicate.note).toBe('chez Carrefour');
    expect(duplicate.spent_tnd).toBeNull();
    expect(duplicate.items.map((i) => i.name)).toEqual(['Tomates', 'Pain']);
    expect(duplicate.items.every((i) => i.is_checked === false)).toBe(true);
    expect(duplicate.items.every((i) => !i.id.startsWith('g_'))).toBe(true);
    // The source is untouched
    expect(next![0]).toBe(source);
    expect(source.items[0].is_checked).toBe(true);
  });

  it('falls back to the default name when none is given', () => {
    const next = duplicateGroceryList(lists, 'l1', '', newId);
    expect(next![2].name).toBe(DEFAULT_GROCERY_LIST_NAME);
  });

  it('returns null when the source does not exist', () => {
    expect(duplicateGroceryList(lists, 'nope', 'X', newId)).toBeNull();
  });
});

describe('groceryListFromItems', () => {
  it('builds a fresh list from history items: unchecked, new ids, no note and no spend', () => {
    const built = groceryListFromItems('  Semaine 12  ', [item('Œufs', { is_checked: true })], newId);
    expect(built).toMatchObject({
      name: 'Semaine 12',
      note: '',
      spent_tnd: null,
      items: [{ name: 'Œufs', is_checked: false }],
    });
    expect(built.id).toBe('grocery_list_test_1');
    expect(built.items[0].id).toBe('grocery_test_2');
    expect(built.items[0].id).not.toBe('g_œufs');
  });

  it('falls back to the default name on an empty name', () => {
    expect(groceryListFromItems('', [], newId).name).toBe(DEFAULT_GROCERY_LIST_NAME);
  });
});

describe('resolveActiveGroceryListId', () => {
  const lists = [list('l1', 'Weekend'), list('l2', 'Ramadan')];

  it('keeps the active id when the list still exists', () => {
    expect(resolveActiveGroceryListId(lists, 'l2')).toBe('l2');
  });

  it('falls back to the first list when the id is unknown', () => {
    expect(resolveActiveGroceryListId(lists, 'nope')).toBe('l1');
  });
});
