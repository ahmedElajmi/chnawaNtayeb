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
  SEARCH_HISTORY: 'chnowa_search_history_v1',
  THEMES: 'chnowa_themes_v1',
  SEED_VERSION: 'chnowa_seed_version',
  ACTIVE_THEME_VARS: 'chnowa_active_theme_vars_v1',
};

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

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
    } catch {}
    return updated;
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
}

export const storage = new StorageService();
