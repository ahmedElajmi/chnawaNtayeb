import { describe, expect, it } from 'vitest';
import { parseStoredIngredients, parseStoredRecipes, type Ingredient, type Recipe } from '@/core/catalog';
import { parseStoredUnitInfos, type UnitInfo } from '@/core/units';
import { createBackup, BACKUP_IMPORT_MAX_CHARS } from '@/core/backup';
import type { Versioned } from '@/core/sync';
import { initialRecipes } from '@/core/catalog';
import { createMemoryCollectionCache } from '@/infrastructure/memory/memoryCollectionCache';
import { createMemorySharedCollection } from '@/infrastructure/memory/memorySharedCollection';
import { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import { CatalogStore } from './CatalogStore';
import { CatalogAdmin } from './CatalogAdmin';

/** A minimal kitchen fake: records every save (no partial write can hide) and mirrors the
 *  KitchenStore methods importBackup goes through. */
function makeKitchen() {
  const saved: string[] = [];
  let favorites: string[] = [];
  const kitchen = {
    setStock: () => {
      saved.push('saveStock');
    },
    setFavorites: (value: string[]) => {
      saved.push('saveFavorites');
      favorites = value;
    },
    setGroceryList: () => {
      saved.push('saveGroceryList');
    },
    setWeeklyPlan: () => {
      saved.push('saveWeeklyPlan');
    },
    loadFavorites: () => favorites,
  };
  return { kitchen: kitchen as never, saved, loadFavorites: kitchen.loadFavorites };
}

function setup() {
  const sharedRecipes = createMemorySharedCollection<Recipe>();
  const sharedIngredients = createMemorySharedCollection<Ingredient>();
  const sharedUnits = createMemorySharedCollection<UnitInfo>();
  const synced = <T extends Versioned>(
    shared: ReturnType<typeof createMemorySharedCollection<T>>,
    read: (raw: readonly unknown[]) => T[]
  ) =>
    new SyncedCollectionStore<T>({
      source: shared.source,
      cache: createMemoryCollectionCache<T>(),
      read,
      builtIn: () => [],
      now: () => 1,
      fullRefreshAfterMs: 1e12,
    });
  const catalog = new CatalogStore(
    synced(sharedRecipes, parseStoredRecipes),
    synced(sharedIngredients, parseStoredIngredients),
    synced(sharedUnits, parseStoredUnitInfos)
  );
  catalog.start();
  const kitchen = makeKitchen();
  const admin = new CatalogAdmin(
    catalog,
    sharedRecipes.writer,
    sharedIngredients.writer,
    sharedUnits.writer,
    kitchen.kitchen,
    { cloudName: 'Serveur', newId: () => 'id1', nowIso: () => '2026-11-25T22:00:00Z' }
  );
  return { admin, catalog, kitchen, sharedRecipes, sharedIngredients };
}

describe('CatalogAdmin.importBackup — oversized-file guard (lot F1 A4, AR-1)', () => {
  it('refuses a file over the import bound: ok:false, catalog strictly unchanged, no write', () => {
    const { admin, catalog, kitchen } = setup();
    const before = {
      recipes: catalog.getState().recipes.length,
      ingredients: catalog.getState().ingredients.length,
      units: catalog.getState().units.length,
    };
    // An oversized backup that is otherwise VALID content: only the size refuses it
    const valid = createBackup(
      { recipes: initialRecipes.slice(0, 3), ingredients: [], weeklyPlan: [], favorites: [], groceryList: [] },
      '2026-11-25T22:00:00Z'
    );
    const oversized = 'x'.repeat(BACKUP_IMPORT_MAX_CHARS - JSON.stringify(valid).length + 1) + JSON.stringify(valid);
    expect(oversized.length).toBe(BACKUP_IMPORT_MAX_CHARS + 1); // just over the bound

    const result = admin.importBackup(oversized);

    expect(result.ok).toBe(false);
    expect(catalog.getState().recipes.length).toBe(before.recipes); // strictly unchanged
    expect(catalog.getState().ingredients.length).toBe(before.ingredients);
    expect(catalog.getState().units.length).toBe(before.units);
    expect(kitchen.saved).toEqual([]); // no partial restore: not a single kitchen write
  });

  it('still imports a legitimate backup (the guard never bites under the bound)', () => {
    const { admin, catalog, kitchen } = setup();
    const json = JSON.stringify(
      createBackup(
        { recipes: initialRecipes.slice(0, 2), ingredients: [], weeklyPlan: [], favorites: ['r1'], groceryList: [] },
        '2026-11-25T22:00:00Z'
      )
    );
    const result = admin.importBackup(json);
    expect(result.ok).toBe(true);
    expect(catalog.getState().recipes.length).toBe(2);
    expect(kitchen.saved).toContain('saveFavorites');
  });
});
