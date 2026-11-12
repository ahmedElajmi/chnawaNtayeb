import type { KitchenRepository } from '@/application';
import { storage } from '@/infrastructure/local/storage';

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
