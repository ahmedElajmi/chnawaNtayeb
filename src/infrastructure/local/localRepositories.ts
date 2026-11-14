import type { KitchenRepository, KitchenSyncLedger } from '@/application';
import type { DayPlan } from '@/core/planning';
import type { GroceryItem } from '@/core/grocery';
import { type StoredKitchenDoc, storage } from '@/infrastructure/local/storage';

/**
 * The user's kitchen data on this device, kept in one document per scope (an account uid,
 * or 'local' for a device used without an account). The first read of a scope adopts the
 * data written by earlier versions (unscoped keys) — read-only migration, nothing deleted.
 */

const EMPTY_DOC: StoredKitchenDoc = {
  favorites: [],
  fridge: [],
  pantry: [],
  weeklyPlan: [],
  groceryList: [],
  groceryNote: '',
  grocerySpent: null,
  sections: {},
  pending: [],
  preferencesSyncedAt: null,
};

function migrateLegacyKitchen(): StoredKitchenDoc {
  const legacy = storage.readLegacyKitchen();
  if (!legacy) return { ...EMPTY_DOC, weeklyPlan: storage.getWeeklyPlan() };
  // Non-empty legacy sections count as changed now: they are pushed to the cloud once
  // the account syncs (the validated migration: the device sends its data up).
  const now = Date.now();
  const changed: string[] = [];
  if (legacy.favorites.length) changed.push('favorites');
  if (legacy.fridge.length) changed.push('fridge');
  if (legacy.pantry.length) changed.push('pantry');
  if (legacy.groceryList.length) changed.push('groceryList');
  const sections: Record<string, number> = {};
  for (const name of changed) sections[name] = now;
  return {
    ...legacy,
    weeklyPlan: legacy.weeklyPlan.length ? legacy.weeklyPlan : storage.getWeeklyPlan(),
    groceryNote: '',
    grocerySpent: null,
    sections,
    pending: changed,
    preferencesSyncedAt: null,
  };
}

/** Kitchen repository scoped by the current owner (wired in the container). */
export function createLocalKitchenRepository(scope: () => string): KitchenRepository & { ledger: KitchenSyncLedger } {
  let suspended = false;
  const doc = (): StoredKitchenDoc => {
    const key = scope();
    return storage.getKitchenDoc(key) ?? migrateLegacyKitchen();
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
    loadGroceryList: () => doc().groceryList,
    saveGroceryList: (items: GroceryItem[]) => withDoc((d) => changed({ ...d, groceryList: items }, 'groceryList')),
    loadGroceryMeta: () => ({ note: doc().groceryNote, spent: doc().grocerySpent }),
    saveGroceryMeta: (note: string, spent: number | null) =>
      withDoc((d) => changed({ ...d, groceryNote: note, grocerySpent: spent }, 'groceryMeta')),
  };

  /** Sync bookkeeping over the same document (exported as its own port). */
  const ledger: KitchenSyncLedger = {
    hasData: () => {
      const current = doc();
      if (current.favorites.length || current.fridge.length || current.pantry.length || current.groceryList.length) {
        return true;
      }
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
