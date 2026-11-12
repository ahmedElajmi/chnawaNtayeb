import {
  type Ingredient,
  type Recipe,
  initialIngredients,
  initialRecipes,
  mergeMissingById,
  migrateIngredients,
  migrateRecipes,
  SEED_VERSION,
} from '@/core/catalog';
import { type DayPlan, DEFAULT_WEEKLY_PLAN, migrateDayPlan } from '@/core/planning';
import type { GroceryItem } from '@/core/grocery';
import { type UserPreferences, DEFAULT_PREFERENCES, normalizePreferences } from '@/core/preferences';
import { type AppTheme, isValidTheme } from '@/core/theme';
import { createId, upsertById } from '@/core/shared';
import { parseBackup } from '@/core/backup';
import type { BackupImportResult } from '@/application';

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

  // --- INGREDIENTS ---
  getIngredients(): Ingredient[] {
    try {
      const data = localStorage.getItem(KEYS.INGREDIENTS);
      if (data) {
        // Stored copies may predate price ranges / photos: always read through the core migration
        const list = migrateIngredients(JSON.parse(data));
        if (this.getSeedVersion() < SEED_VERSION) {
          // Add built-in ingredients that appeared since the last visit
          const merged = mergeMissingById(list, initialIngredients);
          this.saveIngredients(merged);
          return merged;
        }
        return list;
      }
    } catch {}
    this.saveIngredients(initialIngredients);
    return initialIngredients;
  }

  saveIngredients(ingredients: Ingredient[]): void {
    try {
      localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(ingredients));
    } catch {}
  }

  addCustomIngredient(ing: Omit<Ingredient, 'id'>): Ingredient {
    const newIngredient: Ingredient = { ...ing, id: createId('custom_ing') };
    this.saveIngredients([...this.getIngredients(), newIngredient]);
    return newIngredient;
  }

  // --- RECIPES ---
  getRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(KEYS.RECIPES);
      if (data) {
        const list: Recipe[] = JSON.parse(data);
        if (this.getSeedVersion() < SEED_VERSION) {
          // Migration: new built-in recipes + ingredient roles, admin edits are kept
          const merged = migrateRecipes(mergeMissingById(list, initialRecipes));
          this.saveRecipes(merged);
          this.getIngredients(); // migrates ingredients with the same seed version
          this.setSeedVersion(SEED_VERSION);
          return merged;
        }
        return list;
      }
    } catch {}
    this.saveRecipes(initialRecipes);
    this.setSeedVersion(SEED_VERSION);
    return initialRecipes;
  }

  private getSeedVersion(): number {
    try {
      return parseInt(localStorage.getItem(KEYS.SEED_VERSION) || '1', 10) || 1;
    } catch {
      return 1;
    }
  }

  private setSeedVersion(v: number): void {
    try {
      localStorage.setItem(KEYS.SEED_VERSION, String(v));
    } catch {}
  }

  saveRecipes(recipes: Recipe[]): void {
    try {
      localStorage.setItem(KEYS.RECIPES, JSON.stringify(recipes));
    } catch {}
  }

  saveRecipe(recipe: Recipe): Recipe {
    this.saveRecipes(upsertById(this.getRecipes(), recipe, true));
    return recipe;
  }

  deleteRecipe(id: string): void {
    this.saveRecipes(this.getRecipes().filter((r) => r.id !== id));
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
      // v1 menus stored one recipe per meal (lunch_recipe_id / dinner_recipe_id)
      const recipes = this.getRecipes();
      return parsed.map((day) => migrateDayPlan(day, recipes));
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

  // --- BACKUP & RESTORE ---
  exportFullBackup(): string {
    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      recipes: this.getRecipes(),
      ingredients: this.getIngredients(),
      weekly_plan: this.getWeeklyPlan(),
      favorites: this.getFavorites(),
      grocery_list: this.getGroceryList(),
    };
    return JSON.stringify(backup, null, 2);
  }

  /** Restores a backup: every section is read through the domain rules (parseBackup). */
  importFullBackup(jsonString: string): BackupImportResult {
    let backup;
    try {
      backup = parseBackup(JSON.parse(jsonString));
    } catch {
      return { ok: false };
    }
    if (!backup) return { ok: false };
    if (backup.recipes) this.saveRecipes(backup.recipes);
    if (backup.ingredients) this.saveIngredients(backup.ingredients);
    if (backup.weeklyPlan) {
      const recipes = this.getRecipes();
      this.saveWeeklyPlan(backup.weeklyPlan.map((day) => migrateDayPlan(day as DayPlan, recipes)));
    }
    if (backup.favorites) this.saveFavorites(backup.favorites);
    if (backup.groceryList) this.saveGroceryList(backup.groceryList);
    return {
      ok: true,
      recipes: backup.recipes?.length ?? 0,
      ingredients: backup.ingredients?.length ?? 0,
      skipped: backup.skipped,
    };
  }

  /** Replaces the local recipes and ingredients with the built-in catalog (menu and favorites are kept). */
  resetCatalog(): void {
    this.saveRecipes(initialRecipes);
    this.saveIngredients(initialIngredients);
    this.setSeedVersion(SEED_VERSION);
  }

  resetToDefaults(): void {
    this.resetCatalog();
    this.saveWeeklyPlan(DEFAULT_WEEKLY_PLAN);
  }
}

export const storage = new StorageService();
