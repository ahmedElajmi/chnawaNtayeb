import type { Ingredient, Recipe } from '@/core/catalog';
import type { DayPlan } from '@/core/planning';
import {
  type GroceryItem,
  type NewGroceryItem,
  addGroceryItems,
  buildGroceryListFromPlan,
  clearCheckedGroceryItems,
  toggleGroceryItem,
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
  generateGroceryListFromPlan(recipes: Recipe[], ingredients: Ingredient[]): void {
    this.updateGroceryList(buildGroceryListFromPlan(this.getState().weeklyPlan, recipes, ingredients));
  }

  addGroceryItems(items: NewGroceryItem[]): void {
    this.updateGroceryList(addGroceryItems(this.getState().groceryList, items));
  }

  toggleGroceryItem(id: string): void {
    this.updateGroceryList(toggleGroceryItem(this.getState().groceryList, id));
  }

  clearCheckedGroceryItems(): void {
    this.updateGroceryList(clearCheckedGroceryItems(this.getState().groceryList));
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
