import type { Ingredient, Recipe } from '@/core/catalog';
import type { DayPlan } from '@/core/planning';
import {
  DEFAULT_GROCERY_LIST_NAME,
  type GroceryItem,
  type GroceryList,
  type NewGroceryItem,
  addGroceryItems,
  buildGroceryListFromPlan,
  changeGroceryItemUnit,
  clearCheckedGroceryItems,
  createGroceryList as appendGroceryList,
  deleteGroceryList as removeNamedList,
  duplicateGroceryList as copyNamedList,
  groceryListFromItems,
  removeGroceryItem,
  renameGroceryList,
  resolveActiveGroceryListId,
  toggleGroceryItem,
  updateGroceryItemQuantity,
} from '@/core/grocery';
import { createId, toggleInList } from '@/core/shared';
import type { KitchenRepository } from '../ports';
import { Store } from '../store';

export interface KitchenState {
  fridge: string[];
  pantry: string[];
  favorites: string[];
  weeklyPlan: DayPlan[];
  /** The named shopping lists, in the user's order (never re-sorted). */
  groceryLists: GroceryList[];
  /** Id of the list currently shown; always references an existing list (first one otherwise). */
  activeGroceryListId: string;
}

/** The user's kitchen: fridge, pantry, favorites, weekly menu and shopping lists. Every change is saved. */
export class KitchenStore extends Store<KitchenState> {
  constructor(private readonly repo: KitchenRepository) {
    super(KitchenStore.load(repo));
  }

  private static load(repo: KitchenRepository): KitchenState {
    const stored = repo.loadGroceryLists();
    return {
      fridge: repo.loadFridge(),
      pantry: repo.loadPantry(),
      favorites: repo.loadFavorites(),
      weeklyPlan: repo.loadWeeklyPlan(),
      groceryLists: stored.lists,
      activeGroceryListId: resolveActiveGroceryListId(stored.lists, stored.activeId),
    };
  }

  /** Re-reads everything from storage (after a backup import or a reset). */
  reload(): void {
    this.setState(KitchenStore.load(this.repo));
  }

  /** The list currently shown: the active one, or the first one when the id no longer exists. */
  activeGroceryList(): GroceryList {
    const { groceryLists, activeGroceryListId } = this.getState();
    return groceryLists.find((list) => list.id === activeGroceryListId) ?? groceryLists[0];
  }

  /** Compat getter: the items of the active list, as when the kitchen held a single list. */
  get groceryList(): GroceryItem[] {
    return this.activeGroceryList().items;
  }

  // --- Fridge & pantry ---
  toggleFridgeItem(id: string): void {
    this.updateFridge(toggleInList(this.getState().fridge, id));
  }

  clearFridge(): void {
    this.updateFridge([]);
  }

  togglePantryItem(id: string): void {
    const pantry = toggleInList(this.getState().pantry, id);
    this.repo.savePantry(pantry);
    this.setState({ pantry });
  }

  // --- Merges coming from another device (sync): sets grow, they never lose an entry ---
  mergeFavorites(ids: string[]): void {
    const favorites = Array.from(new Set([...this.getState().favorites, ...ids]));
    this.repo.saveFavorites(favorites);
    this.setState({ favorites });
  }

  mergeFridge(ids: string[]): void {
    const fridge = Array.from(new Set([...this.getState().fridge, ...ids]));
    this.updateFridge(fridge);
  }

  mergePantry(ids: string[]): void {
    const pantry = Array.from(new Set([...this.getState().pantry, ...ids]));
    this.repo.savePantry(pantry);
    this.setState({ pantry });
  }

  // --- Favorites ---
  toggleFavorite(recipeId: string): void {
    const favorites = toggleInList(this.getState().favorites, recipeId);
    this.repo.saveFavorites(favorites);
    this.setState({ favorites });
  }

  /** Replaces the favorites (backup restored). */
  setFavorites(favorites: string[]): void {
    this.repo.saveFavorites(favorites);
    this.setState({ favorites });
  }

  /** Replaces the items of one list (the active one by default; backup restored). */
  setGroceryList(items: GroceryItem[], listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items }));
  }

  /** Replaces the named lists and the active one (sync adoption or backup restore). */
  setGroceryLists(lists: GroceryList[], activeId?: string): void {
    const activeGroceryListId = resolveActiveGroceryListId(lists, activeId ?? this.getState().activeGroceryListId);
    this.repo.saveGroceryLists({ lists, activeId: activeGroceryListId });
    this.setState({ groceryLists: lists, activeGroceryListId });
  }

  // --- Weekly menu ---
  setWeeklyPlan(weeklyPlan: DayPlan[]): void {
    this.repo.saveWeeklyPlan(weeklyPlan);
    this.setState({ weeklyPlan });
  }

  // --- Named shopping lists ---
  /** Creates a list (default name when none), makes it active and saves it. */
  createGroceryList(name?: string): void {
    const lists = appendGroceryList(this.getState().groceryLists, name ?? '', createId);
    this.setGroceryLists(lists, lists[lists.length - 1].id);
  }

  /** Builds a list from raw items (duplicate from an archived run), makes it active and saves it. */
  createGroceryListFromItems(name: string, items: GroceryItem[]): void {
    const list = groceryListFromItems(name, items, createId);
    this.setGroceryLists([...this.getState().groceryLists, list], list.id);
  }

  /** Renames one list; an unknown id or an empty name leaves the lists untouched. */
  renameGroceryList(id: string, name: string): void {
    const lists = renameGroceryList(this.getState().groceryLists, id, name);
    if (lists) this.setGroceryLists(lists);
  }

  /** Removes one list (never the last one); a deleted active list falls back to the first remaining. */
  deleteGroceryList(id: string): void {
    const { groceryLists, activeGroceryListId } = this.getState();
    const result = removeNamedList(groceryLists, activeGroceryListId, id, createId);
    if (result) this.setGroceryLists(result.lists, result.activeId);
  }

  /**
   * Duplicates one list (unchecked items, fresh ids, note kept, spend reset). The name comes
   * from the caller; when none is given, the default name is suffixed to stay unique.
   */
  duplicateGroceryList(sourceId: string, name?: string): void {
    const lists = copyNamedList(this.getState().groceryLists, sourceId, name ?? this.uniqueListName(), createId);
    if (lists) this.setGroceryLists(lists);
  }

  /** A unique name for a new list: the default name, suffixed "2", "3"... when taken. */
  private uniqueListName(): string {
    const names = new Set(this.getState().groceryLists.map((list) => list.name));
    let candidate = DEFAULT_GROCERY_LIST_NAME;
    for (let n = 2; names.has(candidate); n++) candidate = `${DEFAULT_GROCERY_LIST_NAME} ${n}`;
    return candidate;
  }

  /** Shows another list (only when it exists). */
  setActiveGroceryList(id: string): void {
    if (this.getState().groceryLists.some((list) => list.id === id)) {
      this.setGroceryLists(this.getState().groceryLists, id);
    }
  }

  // --- Shopping list (the active one, or the list whose id is passed) ---
  /** Builds the list from the menu, scaled to the household size; items already checked on
   *  this device (same ingredient) stay checked — regenerating must not forget the shopping. */
  generateGroceryListFromPlan(recipes: Recipe[], ingredients: Ingredient[], servings?: number, listId?: string): void {
    const target = this.targetList(listId);
    const fresh = buildGroceryListFromPlan(this.getState().weeklyPlan, recipes, ingredients, undefined, { servings });
    const wasChecked = (item: GroceryItem): boolean =>
      target.items.some(
        (old) =>
          old.is_checked &&
          (old.ingredient_id !== undefined && old.ingredient_id !== ''
            ? old.ingredient_id === item.ingredient_id
            : old.name === item.name)
      );
    this.updateList(target.id, (list) => ({
      ...list,
      items: fresh.map((item) => (wasChecked(item) ? { ...item, is_checked: true } : item)),
    }));
  }

  addGroceryItems(items: NewGroceryItem[], listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: addGroceryItems(list.items, items) }));
  }

  toggleGroceryItem(id: string, listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: toggleGroceryItem(list.items, id) }));
  }

  /** Removes one item from the list (distinct from checking it off as bought). */
  removeGroceryItem(id: string, listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: removeGroceryItem(list.items, id) }));
  }

  /** Edits the quantity of one item (garbage values leave the list untouched). */
  setGroceryItemQuantity(id: string, quantity: number, listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: updateGroceryItemQuantity(list.items, id, quantity) }));
  }

  /** Switches one item to a compatible unit (g -> kg, ml -> l...), converting its quantity;
   *  an incompatible unit or an unknown item leaves the list untouched. */
  setGroceryItemUnit(id: string, newUnit: string, listId?: string): void {
    const target = this.targetList(listId);
    const next = changeGroceryItemUnit(target.items, id, newUnit);
    if (next) this.updateList(target.id, (list) => ({ ...list, items: next }));
  }

  clearCheckedGroceryItems(listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: clearCheckedGroceryItems(list.items) }));
  }

  // --- List note and actual spend (per-list fields of the groceryLists sync section) ---
  setGroceryNote(note: string, listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, note }));
  }

  setGrocerySpent(spent: number | null, listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, spent_tnd: spent }));
  }

  /** Empties the whole list, note and spend included (deletion: never goes to the history). */
  clearGroceryList(listId?: string): void {
    const target = this.targetList(listId);
    this.updateList(target.id, (list) => ({ ...list, items: [], note: '', spent_tnd: null }));
  }

  // --- internals ---
  private updateFridge(fridge: string[]): void {
    this.repo.saveFridge(fridge);
    this.setState({ fridge });
  }

  /** The list a change applies to: the given id when it exists, the active list otherwise. */
  private targetList(listId?: string): GroceryList {
    const { groceryLists, activeGroceryListId } = this.getState();
    const id = listId ?? activeGroceryListId;
    return groceryLists.find((list) => list.id === id) ?? groceryLists[0];
  }

  /** Applies an update to one list: the other lists and their order are kept as they are. */
  private updateList(listId: string, update: (list: GroceryList) => GroceryList): void {
    const { groceryLists, activeGroceryListId } = this.getState();
    const lists = groceryLists.map((list) => (list.id === listId ? update(list) : list));
    this.repo.saveGroceryLists({ lists, activeId: activeGroceryListId });
    this.setState({ groceryLists: lists });
  }
}
