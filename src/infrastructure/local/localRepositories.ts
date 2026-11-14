import type { KitchenRepository, KitchenSyncLedger } from '@/application';
import type { DayPlan } from '@/core/planning';
import { DEFAULT_GROCERY_LIST_NAME, type GroceryList } from '@/core/grocery';
import { createId } from '@/core/shared';
import { type StoredGroceryLists, type StoredKitchenDoc, storage } from '@/infrastructure/local/storage';

/**
 * The user's kitchen data on this device, kept in one document per scope (an account uid,
 * or 'local' for a device used without an account). The first read of a scope adopts the
 * data written by earlier versions (unscoped keys) — read-only migration, nothing deleted.
 * A doc written before the named shopping lists (one `groceryList` + note + spend) is
 * migrated on its first read: the single list becomes the default-named list, and the
 * migrated shape is saved back right away so the migration runs only once.
 */

const EMPTY_DOC: StoredKitchenDoc = {
  favorites: [],
  fridge: [],
  pantry: [],
  weeklyPlan: [],
  groceryLists: undefined,
  sections: {},
  pending: [],
  preferencesSyncedAt: null,
};

/** A fresh single empty list under the default name, active by definition. */
function freshGroceryLists(): StoredGroceryLists {
  const id = createId('grocery_list');
  return {
    lists: [{ id, name: DEFAULT_GROCERY_LIST_NAME, items: [], note: '', spent_tnd: null }],
    activeId: id,
  };
}

function migrateLegacyKitchen(): StoredKitchenDoc {
  const legacy = storage.readLegacyKitchen();
  if (!legacy) return { ...EMPTY_DOC, weeklyPlan: storage.getWeeklyPlan(), groceryLists: freshGroceryLists() };
  // Non-empty legacy sections count as changed now: they are pushed to the cloud once
  // the account syncs (the validated migration: the device sends its data up).
  const now = Date.now();
  const changed: string[] = [];
  if (legacy.favorites.length) changed.push('favorites');
  if (legacy.fridge.length) changed.push('fridge');
  if (legacy.pantry.length) changed.push('pantry');
  if (legacy.groceryList.length) changed.push('groceryLists');
  const sections: Record<string, number> = {};
  for (const name of changed) sections[name] = now;
  return {
    favorites: legacy.favorites,
    fridge: legacy.fridge,
    pantry: legacy.pantry,
    weeklyPlan: legacy.weeklyPlan.length ? legacy.weeklyPlan : storage.getWeeklyPlan(),
    groceryLists: legacy.groceryList.length ? wrapLegacyGroceryList(legacy.groceryList, '', null) : freshGroceryLists(),
    sections,
    pending: changed,
    preferencesSyncedAt: null,
  };
}

/** Wraps the legacy single list (items + note + spend) as the one default-named list. */
function wrapLegacyGroceryList(items: GroceryList['items'], note: string, spent: number | null): StoredGroceryLists {
  const id = createId('grocery_list');
  return { lists: [{ id, name: DEFAULT_GROCERY_LIST_NAME, items, note, spent_tnd: spent }], activeId: id };
}

/** Kitchen repository scoped by the current owner (wired in the container). */
export function createLocalKitchenRepository(scope: () => string): KitchenRepository & { ledger: KitchenSyncLedger } {
  let suspended = false;
  const doc = (): StoredKitchenDoc => {
    const key = scope();
    const current = storage.getKitchenDoc(key) ?? migrateLegacyKitchen();
    if (current.groceryLists) return current;
    // One-time migration of a doc written before the named lists: the legacy single list
    // (items, note, spend) becomes the default-named list, saved back right away so this
    // runs only once, and marked pending so the migrated lists reach the other devices.
    const lists = wrapLegacyGroceryList(
      current.groceryList ?? [],
      current.groceryNote ?? '',
      current.grocerySpent ?? null
    );
    const migrated: StoredKitchenDoc = {
      favorites: current.favorites,
      fridge: current.fridge,
      pantry: current.pantry,
      weeklyPlan: current.weeklyPlan,
      groceryLists: lists,
      sections: { ...current.sections, groceryLists: Date.now() },
      pending: current.pending.includes('groceryLists') ? current.pending : [...current.pending, 'groceryLists'],
      preferencesSyncedAt: current.preferencesSyncedAt,
    };
    storage.saveKitchenDoc(key, migrated);
    return migrated;
  };
  const withDoc = (update: (current: StoredKitchenDoc) => StoredKitchenDoc): void => {
    storage.saveKitchenDoc(scope(), update(doc()));
  };
  /** Records a local change: time + pending flag, unless the save came from a merge. */
  const changed = (current: StoredKitchenDoc, section: string): StoredKitchenDoc => ({
    ...current,
    sections: suspended ? current.sections : { ...current.sections, [section]: Date.now() },
    pending: suspended || current.pending.includes(section) ? current.pending : [...current.pending, section],
  });

  const repository = {
    loadFridge: () => doc().fridge,
    saveFridge: (ids: string[]) => withDoc((d) => changed({ ...d, fridge: ids }, 'fridge')),
    loadPantry: () => doc().pantry,
    savePantry: (ids: string[]) => withDoc((d) => changed({ ...d, pantry: ids }, 'pantry')),
    loadFavorites: () => doc().favorites,
    saveFavorites: (ids: string[]) => withDoc((d) => changed({ ...d, favorites: ids }, 'favorites')),
    loadWeeklyPlan: () => doc().weeklyPlan,
    saveWeeklyPlan: (plan: DayPlan[]) => withDoc((d) => changed({ ...d, weeklyPlan: plan }, 'weeklyPlan')),
    loadGroceryLists: () => doc().groceryLists ?? freshGroceryLists(),
    saveGroceryLists: (state: StoredGroceryLists) =>
      withDoc((d) => changed({ ...d, groceryLists: state }, 'groceryLists')),
  };

  /** Sync bookkeeping over the same document (exported as its own port). */
  const ledger: KitchenSyncLedger = {
    hasData: () => {
      const current = doc();
      if (current.favorites.length || current.fridge.length || current.pantry.length) return true;
      if (current.groceryLists?.lists.some((list) => list.items.length > 0)) return true;
      // The scoped document is written on the first change: fall back to the legacy keys
      return storage.readLegacyKitchen() !== null;
    },
    pending: () => doc().pending,
    sectionTimes: () => doc().sections,
    preferencesChangedAt: () => storage.preferencesUpdatedAt(),
    preferencesSyncedAt: () => doc().preferencesSyncedAt,
    confirm: (sections: string[]) =>
      withDoc((d) => ({ ...d, pending: d.pending.filter((s) => !sections.includes(s)) })),
    confirmPreferences: (at: number) => withDoc((d) => ({ ...d, preferencesSyncedAt: at })),
    setSectionTime: (section: string, at: number) =>
      withDoc((d) => ({ ...d, sections: { ...d.sections, [section]: at } })),
    suspend: () => {
      const was = suspended;
      suspended = true;
      return () => {
        suspended = was;
      };
    },
  };

  return { ...repository, ledger };
}
