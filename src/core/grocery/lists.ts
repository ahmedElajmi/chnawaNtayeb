import type { GroceryItem, GroceryList } from './types';
import { createId, type IdFactory } from '../shared/id';

/**
 * The named shopping lists of the kitchen (pure domain): create, rename, delete,
 * duplicate. Order of the lists is never re-sorted: the newest one is appended at
 * the end and every mutation keeps the position of the list it touches.
 */

/** French reference name of a list created without one (shown through the UI as-is). */
export const DEFAULT_GROCERY_LIST_NAME = 'Mes courses';

/** A list name is kept short so it fits one line everywhere. */
const MAX_NAME_LENGTH = 80;

const newListId = (newId: IdFactory): string => newId('grocery_list');

/** Trims a name and caps its length; an empty result falls back to the default name. */
const normalizeName = (name: string): string => {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || DEFAULT_GROCERY_LIST_NAME;
};

/** Appends a new empty list (items, note and spend start empty). The caller passes a unique name. */
export function createGroceryList(lists: GroceryList[], name: string, newId: IdFactory = createId): GroceryList[] {
  return [
    ...lists,
    { id: newListId(newId), name: normalizeName(name), items: [] as GroceryItem[], note: '', spent_tnd: null },
  ];
}

/** Renames one list. Returns null — leaving the lists untouched — when the list does not
 *  exist or the trimmed name is empty. Names longer than 80 characters are trimmed down. */
export function renameGroceryList(lists: GroceryList[], listId: string, name: string): GroceryList[] | null {
  const next = normalizeName(name);
  if (name.trim() === '' || !lists.some((list) => list.id === listId)) return null;
  return lists.map((list) => (list.id === listId ? { ...list, name: next } : list));
}

/** Result of a deletion: the remaining lists and the id of the list that must become active. */
export interface GroceryListsAfterDelete {
  lists: GroceryList[];
  activeId: string;
}

/**
 * Removes one list. Returns null — removing nothing — when the list does not exist or when
 * it is the last one (there is always at least one shopping list). When the removed list was
 * active, the first remaining one becomes active; any other list keeps its position.
 */
export function deleteGroceryList(
  lists: GroceryList[],
  activeId: string,
  listId: string,
  _newId: IdFactory = createId
): GroceryListsAfterDelete | null {
  if (lists.length <= 1 || !lists.some((list) => list.id === listId)) return null;
  const remaining = lists.filter((list) => list.id !== listId);
  const nextActive = activeId === listId ? remaining[0].id : activeId;
  return {
    lists: remaining,
    activeId: remaining.some((list) => list.id === nextActive) ? nextActive : remaining[0].id,
  };
}

/** Deep unchecked copy of a list's items with fresh ids (a duplicate is a list to shop again). */
const copyItems = (items: GroceryItem[], newId: IdFactory): GroceryItem[] =>
  items.map((item) => {
    const { id: _id, is_checked: _checked, ...rest } = item;
    return { ...rest, id: newId('grocery'), is_checked: false };
  });

/**
 * Duplicates one list: a deep copy of its items (fresh ids, everything unchecked), the same
 * note, but no spend yet (the copy has not been shopped). The source is untouched and the
 * duplicate is appended at the end. Returns null when the source does not exist.
 */
export function duplicateGroceryList(
  lists: GroceryList[],
  sourceId: string,
  newName: string,
  newId: IdFactory = createId
): GroceryList[] | null {
  const source = lists.find((list) => list.id === sourceId);
  if (!source) return null;
  const duplicate: GroceryList = {
    id: newListId(newId),
    name: normalizeName(newName),
    items: copyItems(source.items, newId),
    note: source.note,
    spent_tnd: null,
  };
  return [...lists, duplicate];
}

/**
 * Builds a list from raw items — used to duplicate from an archived history entry without
 * touching the history internals: unchecked copies with fresh ids, no note and no spend.
 */
export function groceryListFromItems(name: string, items: GroceryItem[], newId: IdFactory = createId): GroceryList {
  return {
    id: newListId(newId),
    name: normalizeName(name),
    items: copyItems(items, newId),
    note: '',
    spent_tnd: null,
  };
}

/**
 * The id of the list that should be active: the given one when it still exists, the first
 * list otherwise. Used whenever the lists change shape (deletion, sync adoption, migration).
 */
export function resolveActiveGroceryListId(lists: GroceryList[], activeId: string): string {
  return lists.some((list) => list.id === activeId) ? activeId : (lists[0]?.id ?? '');
}
