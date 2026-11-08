import type { CatalogRepository, KitchenRepository } from '@/application';
import { storage } from '@/infrastructure/local/storage';

/** Catalog copy stored in the browser (localStorage), with seed migrations. */
export const localCatalogRepository: CatalogRepository = {
  loadRecipes: () => storage.getRecipes(),
  saveRecipes: (recipes) => storage.saveRecipes(recipes),
  loadIngredients: () => storage.getIngredients(),
  saveIngredients: (ingredients) => storage.saveIngredients(ingredients),
};

/** The user's kitchen data stored in the browser (localStorage). */
export const localKitchenRepository: KitchenRepository = {
  loadFridge: () => storage.getFridgeSelected(),
  saveFridge: (ids) => storage.saveFridgeSelected(ids),
  loadPantry: () => storage.getPreferences().pantryStaples,
  savePantry: (ids) => void storage.savePreferences({ pantryStaples: ids }),
  loadFavorites: () => storage.getFavorites(),
  saveFavorites: (ids) => storage.saveFavorites(ids),
  loadWeeklyPlan: () => storage.getWeeklyPlan(),
  saveWeeklyPlan: (plan) => storage.saveWeeklyPlan(plan),
  loadGroceryList: () => storage.getGroceryList(),
  saveGroceryList: (items) => storage.saveGroceryList(items),
};
