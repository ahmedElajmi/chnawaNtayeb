import { initialRecipes } from '@/core/catalog';
import { type DayPlan, DEFAULT_WEEKLY_PLAN, migrateDayPlan } from '@/core/planning';
import type { GroceryItem } from '@/core/grocery';
import { type UserPreferences, DEFAULT_PREFERENCES, normalizePreferences } from '@/core/preferences';
import { type AppTheme, isValidTheme } from '@/core/theme';

const KEYS = {
  RECIPES: 'chnowa_recipes_v1',
  INGREDIENTS: 'chnowa_ingredients_v1',
  FRIDGE_SELECTED: 'chnowa_fridge_selected_v1',
  FAVORITES: 'chnowa_favorites_v1',
  WEEKLY_PLAN: 'chnowa_weekly_plan_v1',
  GROCERY_LIST: 'chnowa_grocery_list_v1',
  PREFERENCES: 'chnowa_preferences_v1',
  PREFERENCES_UPDATED_AT: 'chnowa_preferences_updated_at',
  SEARCH_HISTORY: 'chnowa_search_history_v1',
  THEMES: 'chnowa_themes_v1',
  SEED_VERSION: 'chnowa_seed_version',
  ACTIVE_THEME_VARS: 'chnowa_active_theme_vars_v1',
};

/** Kitchen data of one scope (an account uid, or 'local' for a device used without one). */
export interface StoredKitchenDoc {
  favorites: string[];
  fridge: string[];
  pantry: string[];
  weeklyPlan: DayPlan[];
  groceryList: GroceryItem[];
  /** Note attached to the current shopping list */
  groceryNote: string;
  /** Amount actually spent, entered when the list was completed (null = not entered) */
  grocerySpent: number | null;
  /** Last local change per section, in ms since epoch (drives the newest-write-wins merge) */
  sections: Record<string, number>;
  /** Sections changed locally and not confirmed by the server yet */
  pending: string[];
  /** When the preferences mirror was last confirmed by the server (null = never) */
  preferencesSyncedAt: number | null;
}

class StorageService {
  // --- PREFERENCES ---
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(KEYS.PREFERENCES);
      return data ? normalizePreferences(JSON.parse(data)) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs: Partial<UserPreferences>, at?: number): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
      localStorage.setItem(KEYS.PREFERENCES_UPDATED_AT, String(at ?? Date.now()));
    } catch {}
    return updated;
  }

  /** When the preferences were last changed on this device (null = never changed). */
  preferencesUpdatedAt(): number | null {
    try {
      const raw = localStorage.getItem(KEYS.PREFERENCES_UPDATED_AT);
      const value = raw === null ? null : Number(raw);
      return value !== null && Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }

  // --- THEMES (remote themes cache, for offline use) ---
  getCachedThemes(): AppTheme[] {
    try {
      const data = localStorage.getItem(KEYS.THEMES);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed.filter(isValidTheme) : [];
    } catch {
      return [];
    }
  }

  saveCachedThemes(themes: AppTheme[]): void {
    try {
      localStorage.setItem(KEYS.THEMES, JSON.stringify(themes));
    } catch {}
  }

  /** Resolved CSS variables of the active theme, read by the anti-flash script in index.html */
  saveActiveThemeSnapshot(snapshot: {
    dark: boolean;
    vars: Record<string, string>;
    cardShape: string;
    pattern: string;
  }): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_THEME_VARS, JSON.stringify(snapshot));
    } catch {}
  }

  // --- CATALOG (previous versions) ---
  /**
   * Catalog copy written by previous versions (now kept in IndexedDB): read once to move it
   * over, then forgotten. Raw entries, read through the domain by the catalog store.
   */
  readLegacyCatalog(kind: 'recipes' | 'ingredients'): unknown[] | null {
    try {
      const data = localStorage.getItem(kind === 'recipes' ? KEYS.RECIPES : KEYS.INGREDIENTS);
      const parsed = data ? JSON.parse(data) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  forgetLegacyCatalog(kind: 'recipes' | 'ingredients'): void {
    try {
      localStorage.removeItem(kind === 'recipes' ? KEYS.RECIPES : KEYS.INGREDIENTS);
      localStorage.removeItem(KEYS.SEED_VERSION);
    } catch {}
  }

  // --- FRIDGE SELECTIONS ---
  getFridgeSelected(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FRIDGE_SELECTED);
      // New users start with an empty fridge: suggestions must reflect *their* fridge
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveFridgeSelected(ids: string[]): void {
    try {
      localStorage.setItem(KEYS.FRIDGE_SELECTED, JSON.stringify(ids));
    } catch {}
  }

  // --- FAVORITES ---
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveFavorites(ids: string[]): void {
    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
    } catch {}
  }

  // --- WEEKLY PLAN ---
  getWeeklyPlan(): DayPlan[] {
    try {
      const data = localStorage.getItem(KEYS.WEEKLY_PLAN);
      if (!data) return DEFAULT_WEEKLY_PLAN;
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return DEFAULT_WEEKLY_PLAN;
      // v1 menus stored one recipe per meal (lunch_recipe_id / dinner_recipe_id), made from built-in recipes
      return parsed.map((day) => migrateDayPlan(day, initialRecipes));
    } catch {
      return DEFAULT_WEEKLY_PLAN;
    }
  }

  saveWeeklyPlan(plan: DayPlan[]): void {
    try {
      localStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
    } catch {}
  }

  // --- GROCERY LIST ---
  getGroceryList(): GroceryItem[] {
    try {
      const data = localStorage.getItem(KEYS.GROCERY_LIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveGroceryList(items: GroceryItem[]): void {
    try {
      localStorage.setItem(KEYS.GROCERY_LIST, JSON.stringify(items));
    } catch {}
  }

  // --- SCOPED KITCHEN DOC (one per account uid, or 'local' for a device without an account) ---
  private kitchenKey(scope: string): string {
    return `chnowa_kitchen_${scope}_v1`;
  }

  getKitchenDoc(scope: string): StoredKitchenDoc | null {
    try {
      const data = localStorage.getItem(this.kitchenKey(scope));
      if (!data) return null;
      const doc = JSON.parse(data) as Partial<StoredKitchenDoc>;
      if (!doc || typeof doc !== 'object') return null;
      return {
        favorites: Array.isArray(doc.favorites) ? doc.favorites.map(String) : [],
        fridge: Array.isArray(doc.fridge) ? doc.fridge.map(String) : [],
        pantry: Array.isArray(doc.pantry) ? doc.pantry.map(String) : [],
        weeklyPlan: Array.isArray(doc.weeklyPlan)
          ? doc.weeklyPlan.map((day) => migrateDayPlan(day, initialRecipes))
          : DEFAULT_WEEKLY_PLAN,
        groceryList: Array.isArray(doc.groceryList) ? doc.groceryList : [],
        groceryNote: typeof doc.groceryNote === 'string' ? doc.groceryNote : '',
        grocerySpent:
          typeof doc.grocerySpent === 'number' && Number.isFinite(doc.grocerySpent) ? doc.grocerySpent : null,
        sections: doc.sections && typeof doc.sections === 'object' ? { ...doc.sections } : {},
        pending: Array.isArray(doc.pending) ? doc.pending.map(String) : [],
        preferencesSyncedAt: typeof doc.preferencesSyncedAt === 'number' ? doc.preferencesSyncedAt : null,
      };
    } catch {
      return null;
    }
  }

  saveKitchenDoc(scope: string, doc: StoredKitchenDoc): void {
    try {
      localStorage.setItem(this.kitchenKey(scope), JSON.stringify(doc));
    } catch {}
  }

  /** Kitchen data written by earlier versions (unscoped keys): read once, then only the scoped doc is used. */
  readLegacyKitchen(): {
    favorites: string[];
    fridge: string[];
    pantry: string[];
    weeklyPlan: DayPlan[];
    groceryList: GroceryItem[];
  } | null {
    const favorites = this.getFavorites();
    const fridge = this.getFridgeSelected();
    const weeklyPlan = this.getWeeklyPlan();
    const groceryList = this.getGroceryList();
    const pantry = this.getPreferences().pantryStaples ?? [];
    if (!favorites.length && !fridge.length && !groceryList.length && !pantry.length) return null;
    return { favorites, fridge, pantry, weeklyPlan, groceryList };
  }
}

export const storage = new StorageService();
