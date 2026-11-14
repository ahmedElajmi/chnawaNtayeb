import type { Ingredient, Recipe } from '@/core/catalog';
import type { DayPlan } from '@/core/planning';
import {
  type GroceryItem,
  type NewGroceryItem,
  addGroceryItems,
  buildGroceryListFromPlan,
  changeGroceryItemUnit,
  clearCheckedGroceryItems,
  removeGroceryItem,
  toggleGroceryItem,
  updateGroceryItemQuantity,
} from '@/core/grocery';
import { toggleInList } from '@/core/shared';
import type { KitchenRepository } from '../ports';
import { Store } from '../store';

export interface KitchenState {
  fridge: string[];
  pantry: string[];
  favorites: string[];
  weeklyPlan: DayPlan[];
  groceryList: GroceryItem[];
  /** Note attached to the current shopping list (synced as the groceryMeta section) */
  groceryNote: string;
  /** Amount actually spent, entered by the user (null = not entered yet) */
  grocerySpent: number | null;
}

/** The user's kitchen: fridge, pantry, favorites, weekly menu and shopping list. Every change is saved. */
export class KitchenStore extends Store<KitchenState> {
  constructor(private readonly repo: KitchenRepository) {
    super(KitchenStore.load(repo));
  }

  private static load(repo: KitchenRepository): KitchenState {
    return {
      fridge: repo.loadFridge(),
      pantry: repo.loadPantry(),
      favorites: repo.loadFavorites(),
      weeklyPlan: repo.loadWeeklyPlan(),
      groceryList: repo.loadGroceryList(),
      groceryNote: repo.loadGroceryMeta().note,
      grocerySpent: repo.loadGroceryMeta().spent,
    };
  }

  /** Re-reads everything from storage (after a backup import or a reset). */
  reload(): void {
    this.setState(KitchenStore.load(this.repo));
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

  /** Replaces the shopping list (backup restored). */
  setGroceryList(groceryList: GroceryItem[]): void {
    this.updateGroceryList(groceryList);
  }

  // --- Weekly menu ---
  setWeeklyPlan(weeklyPlan: DayPlan[]): void {
    this.repo.saveWeeklyPlan(weeklyPlan);
    this.setState({ weeklyPlan });
  }

  // --- Shopping list ---
  /** Builds the list from the menu, scaled to the household size; items already checked on
   *  this device (same ingredient) stay checked — regenerating must not forget the shopping. */
  generateGroceryListFromPlan(recipes: Recipe[], ingredients: Ingredient[], servings?: number): void {
    const fresh = buildGroceryListFromPlan(this.getState().weeklyPlan, recipes, ingredients, undefined, { servings });
    const wasChecked = (item: GroceryItem): boolean =>
      this.getState().groceryList.some(
        (old) =>
          old.is_checked &&
          (old.ingredient_id !== undefined && old.ingredient_id !== ''
            ? old.ingredient_id === item.ingredient_id
            : old.name === item.name)
      );
    this.updateGroceryList(fresh.map((item) => (wasChecked(item) ? { ...item, is_checked: true } : item)));
  }

  addGroceryItems(items: NewGroceryItem[]): void {
    this.updateGroceryList(addGroceryItems(this.getState().groceryList, items));
  }

  toggleGroceryItem(id: string): void {
    this.updateGroceryList(toggleGroceryItem(this.getState().groceryList, id));
  }

  /** Removes one item from the list (distinct from checking it off as bought). */
  removeGroceryItem(id: string): void {
    this.updateGroceryList(removeGroceryItem(this.getState().groceryList, id));
  }

  /** Edits the quantity of one item (garbage values leave the list untouched). */
  setGroceryItemQuantity(id: string, quantity: number): void {
    this.updateGroceryList(updateGroceryItemQuantity(this.getState().groceryList, id, quantity));
  }

  /** Switches one item to a compatible unit (g -> kg, ml -> l...), converting its quantity;
   *  an incompatible unit or an unknown item leaves the list untouched. */
  setGroceryItemUnit(id: string, newUnit: string): void {
    const next = changeGroceryItemUnit(this.getState().groceryList, id, newUnit);
    if (next) this.updateGroceryList(next);
  }

  clearCheckedGroceryItems(): void {
    this.updateGroceryList(clearCheckedGroceryItems(this.getState().groceryList));
  }

  // --- List note and actual spend (the groceryMeta sync section) ---
  setGroceryNote(note: string): void {
    this.setGroceryMeta(note, this.getState().grocerySpent);
  }

  setGrocerySpent(spent: number | null): void {
    this.setGroceryMeta(this.getState().groceryNote, spent);
  }

  setGroceryMeta(note: string, spent: number | null): void {
    this.repo.saveGroceryMeta(note, spent);
    this.setState({ groceryNote: note, grocerySpent: spent });
  }

  /** Empties the whole list, note and spend included (deletion: never goes to the history). */
  clearGroceryList(): void {
    this.setGroceryMeta('', null);
    this.updateGroceryList([]);
  }

  private updateFridge(fridge: string[]): void {
    this.repo.saveFridge(fridge);
    this.setState({ fridge });
  }

  private updateGroceryList(groceryList: GroceryItem[]): void {
    this.repo.saveGroceryList(groceryList);
    this.setState({ groceryList });
  }
}
