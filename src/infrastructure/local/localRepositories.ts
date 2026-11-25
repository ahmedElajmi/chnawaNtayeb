import type { KitchenRepository, KitchenSyncLedger, UnsyncedOfflineChanges } from '@/application';
import type { DayPlan } from '@/core/planning';
import { DEFAULT_GROCERY_LIST_NAME, type GroceryList } from '@/core/grocery';
import { createId } from '@/core/shared';
import {
  EMPTY_ELEMENT_SET,
  compareVersions,
  convertLegacyElementSet,
  mergeElementSets,
  mergeLegacyCandidates,
  mergeStockSections,
  newestVersion,
  parseElementSet,
  parseStockSection,
  parseStockSectionUnbounded,
  presenceEnvelope,
  presenceEntryId,
  presentIds,
  projectStockToLegacy,
  receiveVersion,
  SET_SECTIONS,
  STOCK_LOCATIONS,
  stockDerivedPresence,
  stockRemovalTarget,
  tickClock,
  tombstonedFromEntry,
  tombstoneStockLocation,
  wrapLegacyList,
  type DeviceClock,
  type ElementSet,
  type ElementVersion,
  type SetSectionName,
  type StockLocation,
  type StockSection,
} from '@/core/kitchen';
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
  elements: {},
  stock: undefined,
  deviceClock: null,
  lastSyncedAt: null,
};

/** A fresh single empty list under the default name, active by definition. */
function freshGroceryLists(): StoredGroceryLists {
  const id = createId('grocery_list');
  return {
    lists: [{ id, name: DEFAULT_GROCERY_LIST_NAME, items: [], note: '', spent_tnd: null }],
    activeId: id,
  };
}

/** Wraps the legacy single list (items + note + spend) as the one default-named list. */
function wrapLegacyGroceryList(items: GroceryList['items'], note: string, spent: number | null): StoredGroceryLists {
  const id = createId('grocery_list');
  return { lists: [{ id, name: DEFAULT_GROCERY_LIST_NAME, items, note, spent_tnd: spent }], activeId: id };
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
  const key = scope;
  const doc = (): StoredKitchenDoc => {
    let current = ensureElementState(storage.getKitchenDoc(key()) ?? migrateLegacyKitchen(), now());
    // Lot F1 (§ 7.2): a document without a stock section but with legacy fridge/pantry data
    // is converted ONCE with the same core function as the server — same deterministic ids,
    // same versions — and the migrated stock is saved back right away so this runs only
    // once; the legacy sections/elements stay intact (rollback A).
    if (current.stock === undefined) {
      const migrated = buildStockFromLegacy(current, now());
      if (migrated !== current) {
        storage.saveKitchenDoc(key(), migrated);
        current = migrated;
      }
    }
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
      stock: current.stock,
      sections: { ...current.sections, groceryLists: now() },
      pending: current.pending.includes('groceryLists') ? current.pending : [...current.pending, 'groceryLists'],
      preferencesSyncedAt: current.preferencesSyncedAt,
      elements: current.elements,
      deviceClock: current.deviceClock,
      lastSyncedAt: current.lastSyncedAt,
    };
    storage.saveKitchenDoc(key(), migrated);
    return migrated;
  };
  const withDoc = (update: (current: StoredKitchenDoc) => StoredKitchenDoc): void => {
    storage.saveKitchenDoc(key(), update(doc()));
  };
  /** Records a local change: time + pending flag, unless the save came from a merge. */
  const changed = (current: StoredKitchenDoc, section: string): StoredKitchenDoc => ({
    ...current,
    sections: suspended ? current.sections : { ...current.sections, [section]: now() },
    pending: suspended || current.pending.includes(section) ? current.pending : [...current.pending, section],
  });

  /** The newest version carried by a stock section (adoption keeps the device clock ahead
   *  of what it observed). */
  const newestStockVersion = (stock: StockSection): ElementVersion | null => {
    let newest: ElementVersion | null = null;
    for (const envelope of Object.values(stock)) {
      const versions: ElementVersion[] =
        envelope.state === 'active'
          ? envelope.removed
            ? [envelope.version, envelope.removed]
            : [envelope.version]
          : [envelope.version];
      for (const version of versions) {
        if (!newest || compareVersions(version, newest) > 0) newest = version;
      }
    }
    return newest;
  };

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

  /**
   * Lot F1 § 7.2 — the local twin of the server conversion: a document without a stock
   * section but with legacy fridge/pantry data builds its envelopes with the SAME core
   * function (`convertLegacyElementSet`, five cases, echoes ignored), the SAME deterministic
   * ids and the local versions carried as they are. The migrated stock is marked pending so
   * it reaches the other devices; the legacy sections/elements stay untouched (rollback A).
   * Returns the same reference when there is nothing to convert.
   */
  function buildStockFromLegacy(d: StoredKitchenDoc, at: number): StoredKitchenDoc {
    const state = ensureElementState(d, at);
    let stock: StockSection = {};
    for (const location of STOCK_LOCATIONS) {
      const set = state.elements[location];
      if (set) stock = mergeStockSections(stock, convertLegacyElementSet(set, location));
    }
    if (Object.keys(stock).length === 0) return d;
    return {
      ...state,
      stock,
      sections: { ...state.sections, stock: at },
      pending: state.pending.includes('stock') ? state.pending : [...state.pending, 'stock'],
    };
  }

  /** Recomputes everything the stock derives: the two visible lists AND the local legacy
   * cards (§ 7.4, projection purement locale — the device stays coherent with itself and
   * the rollback A keeps working at any time of the window). */
  function withDerivedLists(d: StoredKitchenDoc): StoredKitchenDoc {
    const stock = d.stock ?? {};
    return {
      ...d,
      fridge: stockDerivedPresence(stock, 'fridge'),
      pantry: stockDerivedPresence(stock, 'pantry'),
      elements: {
        favorites: d.elements.favorites,
        fridge: projectStockToLegacy(stock, 'fridge'),
        pantry: projectStockToLegacy(stock, 'pantry'),
      },
    };
  }

  /** Applies one local stock change: records the change (time + pending) and refreshes the
   * derived lists and the local legacy cards (their section times follow the stock's). */
  const withStockApplied = (d: StoredKitchenDoc, at: number): StoredKitchenDoc => {
    const marked = changed(d, 'stock');
    const time = marked.sections.stock ?? at;
    return {
      ...withDerivedLists(marked),
      sections: { ...marked.sections, fridge: time, pantry: time },
    };
  };

  /** Re-creates the deterministic presence entry of one ingredient (a re-add after a
   * deletion is a legitimate new event: bare presence, fresh version — an enriched entry
   * never comes back from a re-add, it must be re-created on purpose). */
  const reAddPresence = (
    stock: StockSection,
    location: StockLocation,
    ingredientId: string,
    version: ElementVersion
  ): StockSection => {
    const presenceKey = presenceEntryId(location, ingredientId);
    const existing = stock[presenceKey];
    if (existing?.state === 'active') return stock; // already present: nothing to add
    return { ...stock, [presenceKey]: presenceEnvelope(location, ingredientId, version) };
  };

  /**
   * Applies one local list change to a stock location (the diff of the visible lists
   * becomes envelopes): each added ingredient re-creates its deterministic presence entry,
   * each removed one tombstones the entry E3 targets (deterministic presence entry first,
   * else the newest `added_at` — one entry per action, never all). One clock tick per
   * change: the whole diff carries the same version (one user action).
   */
  const withListChangeToStock = (
    current: StoredKitchenDoc,
    location: StockLocation,
    after: string[]
  ): StoredKitchenDoc => {
    const before = stockDerivedPresence(current.stock ?? {}, location);
    if (before.length === after.length && before.every((id, i) => id === after[i])) return current;
    const tick = tickClock(clock(current), now());
    let stock = current.stock ?? {};
    for (const id of after) {
      if (!before.includes(id)) stock = reAddPresence(stock, location, id, tick.version);
    }
    for (const id of before) {
      if (after.includes(id)) continue;
      const target = stockRemovalTarget(stock, location, id);
      if (!target) continue;
      stock = { ...stock, [target]: tombstonedFromEntry(stock[target], tick.version) };
    }
    return withStockApplied({ ...current, deviceClock: tick.clock, stock }, now());
  };

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
    loadFridge: () => stockDerivedPresence(doc().stock ?? {}, 'fridge'),
    saveFridge: (ids: string[]) => withDoc((d) => withListChangeToStock(d, 'fridge', ids)),
    loadPantry: () => stockDerivedPresence(doc().stock ?? {}, 'pantry'),
    savePantry: (ids: string[]) => withDoc((d) => withListChangeToStock(d, 'pantry', ids)),
    loadFavorites: () => doc().favorites,
    saveFavorites: (ids: string[]) => withDoc((d) => withListChange(d, 'favorites', ids)),
    loadWeeklyPlan: () => doc().weeklyPlan,
    saveWeeklyPlan: (plan: DayPlan[]) => withDoc((d) => changed({ ...d, weeklyPlan: plan }, 'weeklyPlan')),
    loadGroceryLists: () => doc().groceryLists ?? freshGroceryLists(),
    saveGroceryLists: (state: StoredGroceryLists) =>
      withDoc((d) => changed({ ...d, groceryLists: state }, 'groceryLists')),
    elementSet: (section: SetSectionName): ElementSet => doc().elements[section] ?? EMPTY_ELEMENT_SET,

    /** The stock of entries of this scope (lot F1 § 4.3): one canonical envelope per entry id. */
    loadStock: (): StockSection => doc().stock ?? {},

    /** Replaces the whole stock (backup restore): read UNBOUNDED (lot F1 A4, chef decision
     *  AR-1 option α): the caps are an admission policy, not a filter of what the user holds.
     *  A restore of a backup exceeding the caps restores EVERYTHING (no partial restore, no
     *  silent loss); the explicit refusal keeps happening at the sources that own it (server
     *  caps on push, bounded adoption of server data). A malformed value is refused, nothing
     *  stored. A restore of an empty stock is legitimate (wipes the location lists). */
    saveStock: (stock: StockSection): void =>
      withDoc((d) => {
        const parsed = parseStockSectionUnbounded(stock);
        if (!parsed) return d; // malformed external data: read, refused, nothing stored
        return withStockApplied({ ...d, stock: parsed }, now());
      }),

    /** Merges a stock section adopted from the server: the envelopes reconcile by HLC version
     *  (a deletion travels with its tombstone, an enriched entry is never impoverished). */
    mergeStock: (remote: StockSection): void =>
      withDoc((d) => {
        const parsed = parseStockSection(remote);
        if (!parsed) return d; // malformed external data: read, refused, nothing stored
        const observed = newestStockVersion(parsed);
        const deviceClock = observed ? receiveVersion(clock(d), observed) : d.deviceClock;
        return withDerivedLists({ ...d, deviceClock, stock: mergeStockSections(d.stock ?? {}, parsed) });
      }),

    /** Explicit global clear of one location (clearFridge/clearPantry): tombstones of EVERY
     *  entry of the location with one clock tick (one user action) — distinct from a single
     *  removal (E3, one entry per action). */
    clearStockLocation: (location: StockLocation): void =>
      withDoc((d) => {
        const tick = tickClock(clock(d), now());
        const stock = tombstoneStockLocation(d.stock ?? {}, location, tick.version);
        if (stock === d.stock) return d; // nothing active at this location: nothing to clear
        return withStockApplied({ ...d, deviceClock: tick.clock, stock }, now());
      }),

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
        let next: StoredKitchenDoc = {
          ...state,
          deviceClock,
          favorites: section === 'favorites' ? presentIds(merged) : state.favorites,
          elements: { ...state.elements, [section]: merged },
        } as StoredKitchenDoc;
        if (section !== 'favorites') {
          // A legacy fridge/pantry section adopted from the server (or an old server document)
          // is converted into the stock with the SAME core function as the server: the two
          // conversions converge (same deterministic ids, same versions carried) — § 7.2.
          const location: StockLocation = section;
          const candidates = convertLegacyElementSet(parsed, location);
          next = { ...next, stock: mergeLegacyCandidates(next.stock ?? {}, candidates) };
        }
        return withDerivedLists(next);
      }),

    /** Empties the whole kitchen document of this scope (a device that has not synced within
     * the tombstone retention re-adopts the server document instead of resurrecting an element).
     * The device clock is kept: this device never issues a version older than one it issued. */
    resetLocal: (): void =>
      withDoc((d) => ({
        ...EMPTY_DOC,
        // Lot F1 § 6.3: the stock is emptied with the rest of the document; the HLC device
        // clock is kept — this device never issues a version older than one it issued.
        stock: undefined,
        deviceClock: d.deviceClock,
        lastSyncedAt: d.lastSyncedAt,
      })),
  };

  /** Sync bookkeeping over the same document (exported as its own port). */
  const ledger: KitchenSyncLedger = {
    hasData: () => {
      const current = doc();
      if (current.favorites.length || current.fridge.length || current.pantry.length) return true;
      if (current.groceryLists?.lists.some((list) => list.items.length > 0)) return true;
      if (current.stock && Object.keys(current.stock).length > 0) return true;
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
    // Lot F1 D3 (P1): the offline changes a stale device could not push are archived in
    // their OWN storage key — they survive the resetLocal wipe, are never re-emitted
    // automatically and stay available for the interface to show what was not synced.
    unsyncedArchive: () => storage.getKitchenUnsynced(key()),
    archiveUnsyncedChanges: (snapshot: UnsyncedOfflineChanges): boolean => storage.saveKitchenUnsynced(key(), snapshot),
    discardUnsyncedArchive: () => storage.clearKitchenUnsynced(key()),
  };

  return { ...repository, ledger };
}
