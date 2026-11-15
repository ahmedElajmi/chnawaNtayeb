import type { KitchenRepository, KitchenSyncLedger } from '@/application';
import type { DayPlan } from '@/core/planning';
import type { GroceryItem } from '@/core/grocery';
import {
  EMPTY_ELEMENT_SET,
  mergeElementSets,
  newestVersion,
  parseElementSet,
  presentIds,
  receiveVersion,
  SET_SECTIONS,
  tickClock,
  wrapLegacyList,
  type DeviceClock,
  type ElementSet,
  type SetSectionName,
} from '@/core/kitchen';
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
  elements: {},
  deviceClock: null,
  lastSyncedAt: null,
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
    elements: {},
    deviceClock: null,
    lastSyncedAt: null,
  };
}

/** Kitchen repository scoped by the current owner (wired in the container). The clock and the
 * device id are injectable so the tests drive time (domain rule: the clock is never read hidden). */
export function createLocalKitchenRepository(
  scope: () => string,
  options: { now?: () => number; deviceId?: string } = {}
): KitchenRepository & { ledger: KitchenSyncLedger } {
  let suspended = false;
  const now = options.now ?? ((): number => Date.now());
  const clock = (d: StoredKitchenDoc): DeviceClock =>
    d.deviceClock ?? { physical: 0, counter: 0, device: options.deviceId ?? storage.deviceId() };
  const doc = (): StoredKitchenDoc => ensureElementState(storage.getKitchenDoc(key()) ?? migrateLegacyKitchen(), now());
  const key = scope;
  const withDoc = (update: (current: StoredKitchenDoc) => StoredKitchenDoc): void => {
    storage.saveKitchenDoc(key(), update(doc()));
  };
  /** Records a local change: time + pending flag, unless the save came from a merge. */
  const changed = (current: StoredKitchenDoc, section: string): StoredKitchenDoc => ({
    ...current,
    sections: suspended ? current.sections : { ...current.sections, [section]: now() },
    pending: suspended || current.pending.includes(section) ? current.pending : [...current.pending, section],
  });

  /**
   * One device upgrade path: a document written before element sets existed holds lists without
   * version maps. Each list wraps once as its own tombstone-less element set (a pre-migration
   * deletion may reappear once per device — documented compromise of the migration).
   */
  function ensureElementState(d: StoredKitchenDoc, at: number): StoredKitchenDoc {
    let wrapped = false;
    const elements = { ...d.elements };
    for (const section of SET_SECTIONS) {
      if (elements[section]) continue;
      const list = d[section];
      if (list.length) {
        elements[section] = wrapLegacyList(list, d.sections[section] ?? at)!;
        wrapped = true;
      }
    }
    return wrapped ? { ...d, elements } : d;
  }

  /** Applies one local list change to a set section: the diff becomes versions (adds and
   * tombstones), so the change propagates — including its deletions — to the other devices. */
  const withListChange = (current: StoredKitchenDoc, section: SetSectionName, after: string[]): StoredKitchenDoc => {
    const before = current[section];
    if (before.length === after.length && before.every((id, i) => id === after[i])) return current;
    const state = ensureElementState(current, now());
    const set = state.elements[section] ?? EMPTY_ELEMENT_SET;
    const tick = tickClock(clock(state), now());
    let added = { ...set.added };
    let removed = { ...set.removed };
    for (const id of after) if (!before.includes(id)) added[id] = tick.version;
    for (const id of before) if (!after.includes(id)) removed[id] = tick.version;
    return {
      ...changed(
        { ...state, deviceClock: tick.clock, elements: { ...state.elements, [section]: { added, removed } } },
        section
      ),
      [section]: after,
    } as StoredKitchenDoc;
  };

  const repository = {
    loadFridge: () => doc().fridge,
    saveFridge: (ids: string[]) => withDoc((d) => withListChange(d, 'fridge', ids)),
    loadPantry: () => doc().pantry,
    savePantry: (ids: string[]) => withDoc((d) => withListChange(d, 'pantry', ids)),
    loadFavorites: () => doc().favorites,
    saveFavorites: (ids: string[]) => withDoc((d) => withListChange(d, 'favorites', ids)),
    loadWeeklyPlan: () => doc().weeklyPlan,
    saveWeeklyPlan: (plan: DayPlan[]) => withDoc((d) => changed({ ...d, weeklyPlan: plan }, 'weeklyPlan')),
    loadGroceryList: () => doc().groceryList,
    saveGroceryList: (items: GroceryItem[]) => withDoc((d) => changed({ ...d, groceryList: items }, 'groceryList')),
    loadGroceryMeta: () => ({ note: doc().groceryNote, spent: doc().grocerySpent }),
    saveGroceryMeta: (note: string, spent: number | null) =>
      withDoc((d) => changed({ ...d, groceryNote: note, grocerySpent: spent }, 'groceryMeta')),

    elementSet: (section: SetSectionName): ElementSet => doc().elements[section] ?? EMPTY_ELEMENT_SET,

    /** The server's version maps merge into this device's own (newest per entry wins); the
     * visible list is recomputed from the merged maps — deletions travel with their tombstone. */
    mergeElementSet: (section: SetSectionName, remote: ElementSet): void =>
      withDoc((d) => {
        const parsed = parseElementSet(remote);
        if (!parsed) return d; // malformed external data: read, refused, nothing stored
        const state = ensureElementState(d, now());
        const merged = mergeElementSets(state.elements[section] ?? EMPTY_ELEMENT_SET, parsed);
        const observed = newestVersion(parsed);
        const deviceClock = observed ? receiveVersion(clock(state), observed) : state.deviceClock;
        return {
          ...state,
          deviceClock,
          elements: { ...state.elements, [section]: merged },
          [section]: presentIds(merged),
        } as StoredKitchenDoc;
      }),

    /** Empties the whole kitchen document of this scope (a device that has not synced within
     * the tombstone retention re-adopts the server document instead of resurrecting an element).
     * The device clock is kept: this device never issues a version older than one it issued. */
    resetLocal: (): void =>
      withDoc((d) => ({
        ...EMPTY_DOC,
        deviceClock: d.deviceClock,
        lastSyncedAt: d.lastSyncedAt,
      })),
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
    lastSyncedAt: () => doc().lastSyncedAt,
    recordSynced: (at: number) => withDoc((d) => ({ ...d, lastSyncedAt: at })),
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
