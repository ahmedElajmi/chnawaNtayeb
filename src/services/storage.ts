import { Ingredient, Recipe, DayPlan, GroceryItem, UserPreferences, AppTheme } from '../types';
import { DEFAULT_THEME_ID } from '../data/builtinThemes';
import { isValidTheme } from './themeValidation';
import { normalizeRecipe } from './mealCourse';
import { migrateDayPlan } from './menuPlanner';
import { initialIngredients } from '../data/initialIngredients';
import { initialRecipes } from '../data/initialRecipes';

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

/**
 * Bump when initialRecipes / initialIngredients change. Users who already
 * have a cached catalog then receive the new recipes/ingredients and the
 * missing ingredient roles, without losing what the admin edited.
 */
export const SEED_VERSION = 4;

/**
 * Brings stored recipes up to date with the current model: ingredient roles,
 * 3 courses (entrée / plat / dessert) and the healthy flag of built-in recipes.
 * Values edited by the admin are kept.
 */
export function migrateRecipes(recipes: Recipe[]): Recipe[] {
  const seedById = new Map(initialRecipes.map((r) => [r.id, r]));
  return fillRolesFromSeed(recipes).map((recipe) => {
    const normalized = normalizeRecipe(recipe);
    const seed = seedById.get(recipe.id);
    if (seed && normalized.is_healthy === undefined && seed.is_healthy !== undefined) {
      return { ...normalized, is_healthy: seed.is_healthy };
    }
    return normalized;
  });
}

/** Adds roles/substitutes from the built-in catalog to recipes that do not have them yet. */
export function fillRolesFromSeed(recipes: Recipe[]): Recipe[] {
  const seedById = new Map(initialRecipes.map((r) => [r.id, r]));
  return recipes.map((recipe) => {
    const seed = seedById.get(recipe.id);
    if (!seed || recipe.ingredients.every((i) => i.role)) return recipe;
    return {
      ...recipe,
      ingredients: recipe.ingredients.map((item) => {
        if (item.role) return item;
        const fromSeed = seed.ingredients.find((s) => s.ingredient_id === item.ingredient_id);
        if (!fromSeed?.role) return item;
        return {
          ...item,
          role: fromSeed.role,
          ...(fromSeed.substitutes && !item.substitutes ? { substitutes: fromSeed.substitutes } : {}),
        };
      }),
    };
  });
}

/** Ingredients most Tunisian kitchens always have. Editable by the user from the fridge screen. */
export const DEFAULT_PANTRY_STAPLES = [
  'ing_sel_poivre',
  'ing_huile_olive',
  'ing_tabel_karwiya',
  'ing_harissa',
  'ing_ail',
];

export const defaultPreferences: UserPreferences = {
  language: 'derja',
  default_servings: 4,
  mode: 'system',
  themeId: DEFAULT_THEME_ID,
  pantryStaples: DEFAULT_PANTRY_STAPLES,
  dietary_filter: 'all',
};

export const defaultWeeklyPlan: DayPlan[] = [
  { day_id: 'mon', day_name_fr: 'Lundi', day_name_derja: 'El Ethnin', day_name_ar: 'الإثنين', lunch: { plat_id: 'rec_ojja_merguez', entree_id: 'rec_slata_tounsia' }, dinner: { plat_id: 'rec_kaskrout_tounsi' } },
  { day_id: 'tue', day_name_fr: 'Mardi', day_name_derja: 'El Thlatha', day_name_ar: 'الثلاثاء', lunch: { plat_id: 'rec_chakchouka_bsal' }, dinner: { plat_id: 'rec_batata_four', entree_id: 'rec_chorba_frik' } },
  { day_id: 'wed', day_name_fr: 'Mercredi', day_name_derja: 'El Arba3', day_name_ar: 'الأربعاء', lunch: { plat_id: 'rec_kafteji' }, dinner: { plat_id: 'rec_lablabi' } },
  { day_id: 'thu', day_name_fr: 'Jeudi', day_name_derja: 'El Khemis', day_name_ar: 'الخميس', lunch: { plat_id: 'rec_makarouna_salsa_djaj', entree_id: 'rec_brik_oeuf_thon' }, dinner: { plat_id: 'rec_tajine_tounsi' } },
  { day_id: 'fri', day_name_fr: 'Vendredi', day_name_derja: 'El Jom3a', day_name_ar: 'الجمعة', lunch: { plat_id: 'rec_couscous_allouch', entree_id: 'rec_slata_mechouia', dessert_id: 'rec_slata_bordgen' }, dinner: { plat_id: 'rec_kaskrout_tounsi' } },
  { day_id: 'sat', day_name_fr: 'Samedi', day_name_derja: 'El Sebt', day_name_ar: 'السبت', lunch: { plat_id: 'rec_rouz_jerbi' }, dinner: { plat_id: 'rec_ojja_merguez' } },
  { day_id: 'sun', day_name_fr: 'Dimanche', day_name_derja: 'El A7ad', day_name_ar: 'الأحد', lunch: { plat_id: 'rec_mloukhiya', dessert_id: 'rec_mhalbiya' }, dinner: { plat_id: 'rec_tajine_tounsi' } },
];

class StorageService {
  // --- PREFERENCES ---
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(KEYS.PREFERENCES);
      if (!data) return defaultPreferences;
      const parsed = JSON.parse(data);
      // Migration: v1 stored `theme: 'light' | 'dark'` instead of `mode`
      if (!parsed.mode && (parsed.theme === 'light' || parsed.theme === 'dark')) {
        parsed.mode = parsed.theme;
      }
      delete parsed.theme;
      const prefs: UserPreferences = { ...defaultPreferences, ...parsed };
      if (!Array.isArray(prefs.pantryStaples)) prefs.pantryStaples = DEFAULT_PANTRY_STAPLES;
      if (!['light', 'dark', 'system'].includes(prefs.mode)) prefs.mode = 'system';
      if (typeof prefs.themeId !== 'string') prefs.themeId = DEFAULT_THEME_ID;
      return prefs;
    } catch {
      return defaultPreferences;
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
  saveActiveThemeSnapshot(snapshot: { dark: boolean; vars: Record<string, string>; cardShape: string; pattern: string }): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_THEME_VARS, JSON.stringify(snapshot));
    } catch {}
  }

  // --- INGREDIENTS ---
  getIngredients(): Ingredient[] {
    try {
      const data = localStorage.getItem(KEYS.INGREDIENTS);
      if (data) {
        const list: Ingredient[] = JSON.parse(data);
        if (this.getSeedVersion() < SEED_VERSION) {
          // Add built-in ingredients that appeared since the last visit
          const known = new Set(list.map((i) => i.id));
          const merged = [...list, ...initialIngredients.filter((i) => !known.has(i.id))];
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

  updateIngredientPrice(id: string, newPriceTnd: number): void {
    const list = this.getIngredients();
    const updated = list.map((ing) => (ing.id === id ? { ...ing, default_price_tnd: newPriceTnd } : ing));
    this.saveIngredients(updated);
  }

  addCustomIngredient(ing: Omit<Ingredient, 'id'>): Ingredient {
    const list = this.getIngredients();
    const newIngredient: Ingredient = {
      ...ing,
      id: `custom_ing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.push(newIngredient);
    this.saveIngredients(list);
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
          const known = new Set(list.map((r) => r.id));
          const merged = migrateRecipes([...list, ...initialRecipes.filter((r) => !known.has(r.id))]);
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
    const list = this.getRecipes();
    const index = list.findIndex((r) => r.id === recipe.id);
    if (index >= 0) {
      list[index] = recipe;
    } else {
      list.unshift(recipe);
    }
    this.saveRecipes(list);
    return recipe;
  }

  deleteRecipe(id: string): void {
    const list = this.getRecipes().filter((r) => r.id !== id);
    this.saveRecipes(list);
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

  toggleFavorite(recipeId: string): boolean {
    const favs = this.getFavorites();
    const index = favs.indexOf(recipeId);
    let isFav = false;
    if (index >= 0) {
      favs.splice(index, 1);
      isFav = false;
    } else {
      favs.push(recipeId);
      isFav = true;
    }
    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
    } catch {}
    return isFav;
  }

  // --- WEEKLY PLAN ---
  getWeeklyPlan(): DayPlan[] {
    try {
      const data = localStorage.getItem(KEYS.WEEKLY_PLAN);
      if (!data) return defaultWeeklyPlan;
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return defaultWeeklyPlan;
      // v1 menus stored one recipe per meal (lunch_recipe_id / dinner_recipe_id)
      const recipes = this.getRecipes();
      return parsed.map((day) => migrateDayPlan(day, recipes));
    } catch {
      return defaultWeeklyPlan;
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

  toggleGroceryItem(id: string): void {
    const list = this.getGroceryList().map((item) =>
      item.id === id ? { ...item, is_checked: !item.is_checked } : item
    );
    this.saveGroceryList(list);
  }

  addManualGroceryItem(name: string, quantity = 1, unit = 'pièce'): GroceryItem {
    const list = this.getGroceryList();
    const newItem: GroceryItem = {
      id: `grocery_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      quantity,
      unit,
      category: 'other',
      is_checked: false,
      is_custom: true,
    };
    list.push(newItem);
    this.saveGroceryList(list);
    return newItem;
  }

  clearCheckedGroceryItems(): void {
    const list = this.getGroceryList().filter((item) => !item.is_checked);
    this.saveGroceryList(list);
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

  importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.recipes)) {
        this.saveRecipes(parsed.recipes);
      }
      if (Array.isArray(parsed.ingredients)) {
        this.saveIngredients(parsed.ingredients);
      }
      if (Array.isArray(parsed.weekly_plan)) {
        const recipes = this.getRecipes();
        this.saveWeeklyPlan(parsed.weekly_plan.map((day: DayPlan) => migrateDayPlan(day, recipes)));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }

  /** Replaces the local recipes and ingredients with the built-in catalog (menu and favorites are kept). */
  resetCatalog(): void {
    this.saveRecipes(initialRecipes);
    this.saveIngredients(initialIngredients);
    this.setSeedVersion(SEED_VERSION);
  }

  resetToDefaults(): void {
    this.resetCatalog();
    this.saveWeeklyPlan(defaultWeeklyPlan);
  }
}

export const storage = new StorageService();
