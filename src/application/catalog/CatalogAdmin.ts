import { createBackup, parseBackup } from '@/core/backup';
import { initialIngredients, initialRecipes, type Ingredient, type Recipe } from '@/core/catalog';
import { unitIdFromLabel, type UnitInfo } from '@/core/units';
import { DEFAULT_WEEKLY_PLAN, migrateDayPlan, type DayPlan } from '@/core/planning';
import type { IdFactory } from '@/core/shared';
import type { BackupImportResult, CatalogInitStats, SharedCollectionWriter, WriteResult } from '../ports';
import type { KitchenStore } from '../kitchen/KitchenStore';
import type { CatalogStore } from './CatalogStore';

export interface CatalogAdminDeps {
  /** Name of the cloud project shown to the admin */
  cloudName: string;
  newId: IdFactory;
  /** ISO date of now (backup file name and content) */
  nowIso: () => string;
}

/**
 * Catalog administration (backoffice). Every change shows at once on this device, then is
 * written to the database, which sends it live to every other device.
 */
export class CatalogAdmin {
  readonly cloudName: string;

  constructor(
    private readonly catalog: CatalogStore,
    private readonly recipesCloud: SharedCollectionWriter<Recipe>,
    private readonly ingredientsCloud: SharedCollectionWriter<Ingredient>,
    private readonly unitsCloud: SharedCollectionWriter<UnitInfo>,
    private readonly kitchen: KitchenStore,
    private readonly deps: CatalogAdminDeps
  ) {
    this.cloudName = deps.cloudName;
  }

  saveRecipe(recipe: Recipe): Promise<WriteResult> {
    this.catalog.recipes.putLocal(recipe);
    return this.recipesCloud.put(recipe);
  }

  deleteRecipe(recipeId: string): Promise<WriteResult> {
    this.catalog.recipes.removeLocal(recipeId);
    return this.recipesCloud.remove(recipeId);
  }

  saveIngredient(ingredient: Ingredient): Promise<WriteResult> {
    this.catalog.ingredients.putLocal(ingredient);
    return this.ingredientsCloud.put(ingredient);
  }

  saveUnit(unit: UnitInfo): Promise<WriteResult> {
    this.catalog.units.putLocal(unit);
    return this.unitsCloud.put(unit);
  }

  deleteUnit(unitId: string): Promise<WriteResult> {
    this.catalog.units.removeLocal(unitId);
    return this.unitsCloud.remove(unitId);
  }

  /** Gives a new unit description its id (then `saveUnit` publishes it). */
  createUnit(data: Omit<UnitInfo, 'id'>): UnitInfo {
    return { ...data, id: unitIdFromLabel(data.label) || this.deps.newId('unit') };
  }

  /** Gives a new ingredient its id (then `saveIngredient` publishes it). */
  createIngredient(data: Omit<Ingredient, 'id'>): Ingredient {
    return { ...data, id: this.deps.newId('custom_ing') };
  }

  /** Sends every recipe and ingredient of this device to the database. */
  async pushAll(): Promise<WriteResult> {
    const { recipes, ingredients } = this.catalog.getState();
    const r = await this.recipesCloud.putAll(recipes);
    if (!r.ok) return r;
    return this.ingredientsCloud.putAll(ingredients);
  }

  /** Replaces the shared catalog with the built-in one (the others are removed everywhere). */
  async resetCloudCatalog(): Promise<WriteResult & { stats?: CatalogInitStats }> {
    this.catalog.recipes.replaceLocal(initialRecipes);
    this.catalog.ingredients.replaceLocal(initialIngredients);
    const r = await this.recipesCloud.replaceAll(initialRecipes);
    if (!r.ok) return r;
    const i = await this.ingredientsCloud.replaceAll(initialIngredients);
    if (!i.ok) return i;
    return {
      ok: true,
      stats: {
        recipes: initialRecipes.length,
        ingredients: initialIngredients.length,
        deleted: (r.removed ?? 0) + (i.removed ?? 0),
      },
    };
  }

  /** Reads the whole catalog again from the database. */
  pullFromCloud(): void {
    this.catalog.refreshAll();
  }

  /** Seeds an empty database with the built-in catalog (first admin connection). */
  async seedIfEmpty(): Promise<void> {
    if (await this.recipesCloud.isEmpty()) await this.recipesCloud.putAll(this.catalog.getState().recipes);
    if (await this.ingredientsCloud.isEmpty()) await this.ingredientsCloud.putAll(this.catalog.getState().ingredients);
  }

  /** Full backup as JSON text (dump). */
  exportBackup(): string {
    const { recipes, ingredients } = this.catalog.getState();
    const { weeklyPlan, favorites, groceryList } = this.kitchen.getState();
    return JSON.stringify(
      createBackup({ recipes, ingredients, weeklyPlan, favorites, groceryList }, this.deps.nowIso()),
      null,
      2
    );
  }

  /** Restores a JSON backup on this device (every entry read through the domain). */
  importBackup(json: string): BackupImportResult {
    let backup;
    try {
      backup = parseBackup(JSON.parse(json));
    } catch {
      return { ok: false };
    }
    if (!backup) return { ok: false };
    if (backup.recipes) this.catalog.recipes.replaceLocal(backup.recipes);
    if (backup.ingredients) this.catalog.ingredients.replaceLocal(backup.ingredients);
    if (backup.weeklyPlan) {
      const recipes = this.catalog.getState().recipes;
      this.kitchen.setWeeklyPlan(backup.weeklyPlan.map((day) => migrateDayPlan(day as DayPlan, recipes)));
    }
    if (backup.favorites) this.kitchen.setFavorites(backup.favorites);
    if (backup.groceryList) this.kitchen.setGroceryList(backup.groceryList);
    return {
      ok: true,
      recipes: backup.recipes?.length ?? 0,
      ingredients: backup.ingredients?.length ?? 0,
      skipped: backup.skipped,
    };
  }

  /** Built-in catalog and default menu on this device. */
  resetLocalToDefaults(): void {
    this.catalog.recipes.replaceLocal(initialRecipes);
    this.catalog.ingredients.replaceLocal(initialIngredients);
    this.kitchen.setWeeklyPlan(DEFAULT_WEEKLY_PLAN);
  }
}
