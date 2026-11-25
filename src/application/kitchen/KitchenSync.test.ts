import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KitchenStore } from './KitchenStore';
import { KitchenSync } from './KitchenSync';
import {
  EMPTY_ELEMENT_SET,
  STALE_DEVICE_MS,
  convertLegacyElementSet,
  mergeElementSets,
  mergeLegacyCandidates,
  mergeStockSections,
  parseStockSection,
  presenceEntryId,
  presenceEnvelope,
  presentIds,
  stockDerivedPresence,
  stockRemovalTarget,
  tombstonedFromEntry,
  tombstoneStockLocation,
  wrapLegacyList,
  type ElementSet,
  type StockEnvelope,
  type StockLocation,
  type StockSection,
} from '@/core/kitchen';
import type { DayId } from '@/core/planning';
import type { GroceryList } from '@/core/grocery';
import type {
  HostLifecycle,
  KitchenRepository,
  KitchenSyncLedger,
  PreferencesRepository,
  RemoteKitchenDocument,
  RemoteKitchenPull,
  RemoteKitchenSections,
} from '../ports';

/**
 * The sync engine is tested with in-memory fakes and a fake clock: the triggers (debounce,
 * visibility, start-up catch-up) are driven manually, like the server would see them.
 */

type SectionName = 'favorites' | 'fridge' | 'pantry' | 'weeklyPlan' | 'groceryLists';

const GROCERY_ITEM = { id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce', category: 'other', is_checked: false };

const groceryLists = (lists: GroceryList[], activeId?: string): { lists: GroceryList[]; activeId: string } => ({
  lists,
  activeId: activeId ?? lists[0]?.id ?? '',
});

const list = (id: string, items: GroceryList['items'] = [], note = ''): GroceryList => ({
  id,
  name: id,
  items,
  note,
  spent_tnd: null,
});

/** A remote set section as the server would keep it (added/removed versions per id). */
const elementSet = (added: string[] = [], removed: string[] = [], at = 500, device = 'remote'): ElementSet => ({
  added: Object.fromEntries(added.map((id) => [id, { physical: at, counter: 0, device }])),
  removed: Object.fromEntries(removed.map((id) => [id, { physical: at, counter: 0, device }])),
});

const DAY = (id: DayId, plat = 'p1') => ({
  day_id: id,
  day_name_fr: id,
  day_name_derja: id,
  day_name_ar: id,
  lunch: { plat_id: plat },
  dinner: { plat_id: `${plat}-2` },
});

interface Harness {
  sync: KitchenSync;
  kitchen: KitchenStore;
  ledger: KitchenSyncLedger & {
    pendingSet: Set<string>;
    times: Record<string, number>;
    prefs: { changed: number | null; synced: number | null };
  };
  gateway: {
    pulls: number;
    pushes: RemoteKitchenSections[];
    remote: RemoteKitchenDocument | null;
    fail: 'pull' | 'push' | null;
    /** Error code thrown by the fake instead of the default one (protocol refusals) */
    failCode: string | null;
    /** Responses held in flight until the test releases them (oldest first) */
    holdPulls: number;
    holdPushes: number;
    /** Reconciliation signal carried by the next pull (B22-07, undefined = none) */
    reconciliationRequired: boolean | undefined;
    release: () => void;
  };
  time: { value: number };
  /** The fake host: fire the visibility callbacks, inspect the armed debounce timers */
  host: HostLifecycle & { fireHidden(): void; fireVisible(): void; armed(): number };
  owner: { uid: string | null };
  preferences: PreferencesRepository & { saved: Partial<{ pantryStaples: string[]; themeId: string }>[] };
}

function makeHarness(initial?: Partial<Record<SectionName, unknown>>): Harness {
  const time = { value: 1_000 };
  const owner = { uid: 'u1' as string | null };
  const data: Record<string, unknown> = {
    favorites: [],
    fridge: [],
    pantry: [],
    weeklyPlan: [DAY('mon')],
    groceryLists: groceryLists([list('l1')]),
    ...initial,
  };
  const syncState = { suspended: false };
  const ledgerData = {
    pending: new Set<string>(),
    times: {} as Record<string, number>,
    prefs: { changed: null as number | null, synced: null as number | null },
    lastSynced: null as number | null,
  };
  /** Element-set state mirrored from the list saves (like the real repository keeps it). */
  const elements: Record<string, ElementSet> = {};
  let deviceClock = { physical: 0, counter: 0, device: 'test' };
  // Pre-existing lists (written before element sets existed) wrap once, like the real migration
  for (const section of ['favorites', 'fridge', 'pantry'] as const) {
    const legacyIds = initial?.[section];
    if (Array.isArray(legacyIds) && legacyIds.length) {
      elements[section] = wrapLegacyList(legacyIds as string[], 100)!;
    }
  }
  // Lot F1: the stock of entries the visible fridge/pantry lists derive from (like the real
  // migration, the legacy lists convert once with the same core function)
  const stock: Record<string, StockEnvelope> = {};
  for (const location of ['fridge', 'pantry'] as const) {
    const set = elements[location];
    if (set) Object.assign(stock, convertLegacyElementSet(set, location));
  }
  const presence = (location: StockLocation): string[] => stockDerivedPresence(stock, location);
  const refreshDerived = (): void => {
    data.fridge = presence('fridge');
    data.pantry = presence('pantry');
  };

  /** A local favorites save: the diff becomes versions, like the real repository records them. */
  const saveList = (section: 'favorites', ids: string[]): void => {
    const before = (data[section] as string[]) ?? [];
    data[section] = ids;
    const set = elements[section] ?? EMPTY_ELEMENT_SET;
    const physical = Math.max(deviceClock.physical + 1, time.value);
    deviceClock = { physical, counter: 0, device: 'test' };
    const added = { ...set.added };
    const removed = { ...set.removed };
    for (const id of ids) if (!before.includes(id)) added[id] = { ...deviceClock };
    for (const id of before) if (!ids.includes(id)) removed[id] = { ...deviceClock };
    elements[section] = { added, removed };
    if (!syncState.suspended) {
      ledgerData.pending.add(section);
      ledgerData.times[section] = time.value;
    }
  };

  /** A local fridge/pantry save: the diff becomes stock envelopes (lot F1, like the real
   * repository records them) — the change is marked pending as the 'stock' section. */
  const saveStockList = (location: StockLocation, ids: string[]): void => {
    const before = presence(location);
    if (before.length === ids.length && before.every((id, i) => id === ids[i])) return;
    const physical = Math.max(deviceClock.physical + 1, time.value);
    deviceClock = { physical, counter: 0, device: 'test' };
    const version = { ...deviceClock };
    for (const id of ids) {
      if (before.includes(id)) continue;
      const key = presenceEntryId(location, id);
      if (stock[key]?.state === 'active') continue;
      stock[key] = presenceEnvelope(location, id, version);
    }
    for (const id of before) {
      if (ids.includes(id)) continue;
      const target = stockRemovalTarget(stock, location, id);
      if (target) stock[target] = tombstonedFromEntry(stock[target], version);
    }
    if (!syncState.suspended) {
      ledgerData.pending.add('stock');
      ledgerData.times.stock = time.value;
    }
    refreshDerived();
  };

  const repo: KitchenRepository = {
    loadFridge: () => presence('fridge'),
    saveFridge: (ids) => saveStockList('fridge', ids),
    loadPantry: () => presence('pantry'),
    savePantry: (ids) => saveStockList('pantry', ids),
    loadFavorites: () => data.favorites as string[],
    saveFavorites: (ids) => saveList('favorites', ids),
    loadWeeklyPlan: () => data.weeklyPlan as never,
    saveWeeklyPlan: (plan) => {
      data.weeklyPlan = plan;
      if (!syncState.suspended) {
        ledgerData.pending.add('weeklyPlan');
        ledgerData.times.weeklyPlan = time.value;
      }
    },
    loadGroceryLists: () => data.groceryLists as never,
    saveGroceryLists: (state) => {
      data.groceryLists = state;
      if (!syncState.suspended) {
        ledgerData.pending.add('groceryLists');
        ledgerData.times.groceryLists = time.value;
      }
    },
    elementSet: (section) => elements[section] ?? EMPTY_ELEMENT_SET,
    loadStock: () => ({ ...stock }),
    saveStock: (next) => {
      for (const key of Object.keys(stock)) delete stock[key];
      Object.assign(stock, parseStockSection(next) ?? {});
      refreshDerived();
    },
    mergeStock: (remote) => {
      const parsed = parseStockSection(remote);
      if (!parsed) return;
      Object.assign(stock, mergeStockSections(stock, parsed));
      refreshDerived();
    },
    clearStockLocation: (location) => {
      const physical = Math.max(deviceClock.physical + 1, time.value);
      deviceClock = { physical, counter: 0, device: 'test' };
      Object.assign(stock, tombstoneStockLocation(stock, location, { ...deviceClock }));
      refreshDerived();
    },
    mergeElementSet: (section, remote) => {
      const merged = mergeElementSets(elements[section] ?? EMPTY_ELEMENT_SET, remote);
      elements[section] = merged;
      if (section !== 'favorites') {
        // Like the real adapter: a legacy fridge/pantry section adopted from the server
        // converts into the stock with the same core function (§ 7.2)
        Object.assign(stock, mergeLegacyCandidates(stock, convertLegacyElementSet(remote, section)));
      }
      if (section === 'favorites') data.favorites = presentIds(merged);
      else refreshDerived();
    },
    resetLocal: () => {
      for (const section of ['favorites', 'fridge', 'pantry', 'weeklyPlan'] as const) {
        data[section] = [];
      }
      // Like the real adapter: the named lists fall back to one fresh empty default list
      const fresh = list('fresh');
      data.groceryLists = groceryLists([fresh]);
      for (const section of ['favorites', 'fridge', 'pantry'] as const) delete elements[section];
      for (const key of Object.keys(stock)) delete stock[key];
      ledgerData.pending.clear();
      for (const key of Object.keys(ledgerData.times)) delete ledgerData.times[key];
    },
  };
  const kitchen = new KitchenStore(repo);

  const preferences: Harness['preferences'] = {
    load: () => ({ language: 'fr', default_servings: 2, mode: 'light', pantryStaples: [], themeId: 'classic' }),
    save: (patch, at) => {
      preferences.saved.push(patch);
      ledgerData.prefs.changed = at ?? time.value;
    },
    saved: [],
  };

  const ledger = {
    pendingSet: ledgerData.pending,
    times: ledgerData.times,
    prefs: ledgerData.prefs,
    pending: () => [...ledgerData.pending],
    sectionTimes: () => ledgerData.times,
    preferencesChangedAt: () => ledgerData.prefs.changed,
    preferencesSyncedAt: () => ledgerData.prefs.synced,
    confirm: (sections: string[]) => {
      for (const s of sections) ledgerData.pending.delete(s);
    },
    confirmPreferences: (at: number) => {
      ledgerData.prefs.synced = at;
    },
    setSectionTime: (section: string, at: number) => {
      ledgerData.times[section] = at;
    },
    lastSyncedAt: () => ledgerData.lastSynced,
    recordSynced: (at: number) => {
      ledgerData.lastSynced = at;
    },
    suspend: () => {
      syncState.suspended = true;
      return () => {
        syncState.suspended = false;
      };
    },
    hasData: () => true,
  } as Harness['ledger'];

  const gateway = {
    pulls: 0,
    pushes: [] as RemoteKitchenSections[],
    remote: null as RemoteKitchenDocument | null,
    fail: null as 'pull' | 'push' | null,
    failCode: null as string | null,
    holdPulls: 0,
    holdPushes: 0,
    reconciliationRequired: undefined as boolean | undefined,
    release: () => undefined,
  };
  const held: (() => void)[] = [];
  gateway.release = () => {
    held.shift()?.();
  };
  const gatewayPort = {
    async pull(): Promise<RemoteKitchenPull> {
      gateway.pulls += 1;
      // The document is snapshotted before waiting: the release must answer with the
      // version this request would have received, not the one the server holds later
      const snapshot = gateway.remote;
      if (gateway.holdPulls > 0) {
        gateway.holdPulls -= 1;
        await new Promise<void>((resolve) => held.push(resolve));
      }
      if (gateway.fail === 'pull') throw new Error(gateway.failCode ?? 'unreachable');
      return { doc: snapshot, reconciliationRequired: gateway.reconciliationRequired ?? false };
    },
    async push(sections: RemoteKitchenSections): Promise<RemoteKitchenDocument> {
      gateway.pushes.push(sections);
      const merged: RemoteKitchenDocument = { ...gateway.remote };
      for (const [name, section] of Object.entries(sections)) {
        const current = merged[name as keyof RemoteKitchenDocument];
        if (!current || section.updatedAt > current.updatedAt) {
          merged[name as keyof RemoteKitchenDocument] = section as never;
        }
      }
      if (gateway.holdPushes > 0) {
        gateway.holdPushes -= 1;
        await new Promise<void>((resolve) => held.push(resolve));
      }
      if (gateway.fail === 'push') throw new Error(gateway.failCode ?? 'refused');
      gateway.remote = merged;
      return merged;
    },
  };

  const armedTimers = new Set<ReturnType<typeof setTimeout>>();
  const visibility = { hidden: [] as (() => void)[], visible: [] as (() => void)[] };
  const host: Harness['host'] = {
    defer: (fn, ms) => {
      const id = setTimeout(() => {
        armedTimers.delete(id);
        fn();
      }, ms);
      armedTimers.add(id);
      return () => {
        clearTimeout(id);
        armedTimers.delete(id);
      };
    },
    subscribeVisibility: (onHidden, onVisible) => {
      visibility.hidden.push(onHidden);
      visibility.visible.push(onVisible);
      return () => {
        const removeOne = (listeners: (() => void)[], fn: () => void) => {
          const i = listeners.indexOf(fn);
          if (i !== -1) listeners.splice(i, 1);
        };
        removeOne(visibility.hidden, onHidden);
        removeOne(visibility.visible, onVisible);
      };
    },
    fireHidden: () => [...visibility.hidden].forEach((fn) => fn()),
    fireVisible: () => [...visibility.visible].forEach((fn) => fn()),
    armed: () => armedTimers.size,
  };

  const sync = new KitchenSync({
    gateway: gatewayPort,
    kitchen,
    preferences,
    ledger,
    owner: () => owner.uid,
    now: () => time.value,
    host,
  });
  return { sync, kitchen, ledger, gateway, time, host, owner, preferences };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the kitchen sync engine', () => {
  it('merges a burst of changes into one debounced push', async () => {
    const h = makeHarness({ favorites: ['r0'] });
    h.sync.start();
    await vi.runAllTimersAsync(); // start-up catch-up settles
    expect(h.gateway.pushes).toHaveLength(0);

    h.kitchen.toggleFavorite('r1');
    h.kitchen.toggleFavorite('r2');
    h.kitchen.toggleFridgeItem('ing1');
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    expect(presentIds(h.gateway.pushes[0].favorites!.value)).toEqual(['r0', 'r1', 'r2']);
    // The fridge change travels as its stock section: one deterministic presence envelope
    const stock = h.gateway.pushes[0].stock!.value as StockSection;
    expect(stockDerivedPresence(stock, 'fridge')).toEqual(['ing1']);
    expect(h.sync.getState().pending).toBe(0);
  });

  it('sends two modifications more than two seconds apart as two pushes', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.toggleFavorite('r1');
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);

    h.time.value += 10_000;
    h.kitchen.toggleFavorite('r1'); // removed again: the newer value wins on the server
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(2);
    expect(presentIds(h.gateway.pushes[1].favorites!.value)).toEqual([]); // a tombstone, an empty list
  });

  it('adopts a newer remote document: unions for sets, newest write for the rest', async () => {
    const h = makeHarness({
      favorites: ['r1'],
      fridge: ['ing1'],
      weeklyPlan: [DAY('mon', 'local1')],
      groceryLists: groceryLists([list('l1', [GROCERY_ITEM])]),
    });
    h.ledger.times.favorites = 100;
    h.ledger.times.fridge = 100;
    h.ledger.times.weeklyPlan = 100;
    h.ledger.times.groceryLists = 100;
    h.gateway.remote = {
      favorites: { value: elementSet(['r1', 'r2'], [], 500), updatedAt: 500 },
      fridge: { value: elementSet(['ing2'], [], 500), updatedAt: 500 },
      weeklyPlan: { value: [DAY('mon', 'remote1')], updatedAt: 500 },
      groceryLists: {
        value: groceryLists(
          [list('l1', [GROCERY_ITEM]), list('l2', [{ ...GROCERY_ITEM, id: 'g2', name: 'Lait' }])],
          'l2'
        ),
        updatedAt: 500,
      },
    };
    h.sync.start();
    await vi.runAllTimersAsync();

    expect(h.kitchen.getState().favorites).toEqual(['r1', 'r2']);
    expect(h.kitchen.getState().fridge).toEqual(['ing1', 'ing2']);
    expect(h.kitchen.getState().weeklyPlan[0].lunch.plat_id).toBe('remote1');
    expect(h.kitchen.getState().groceryLists.map((l) => l.id)).toEqual(['l1', 'l2']);
    expect(h.kitchen.getState().activeGroceryListId).toBe('l2');
    expect(h.kitchen.groceryList[0].id).toBe('g2');
    // The adoption marked nothing pending and triggered no push
    expect(h.ledger.pendingSet.size).toBe(0);
    expect(h.gateway.pushes).toHaveLength(0);
  });

  it('adopts a remote stock not older than ours without any echo, and ignores an older one (lot F1)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.gateway.pushes).toHaveLength(0);

    // Concurrent pushes land under one server timestamp: the answer to OUR pull may carry
    // another device's envelope inside OUR OWN section time. The stock is adopted when it
    // is not older, and the adoption runs under suspend(): nothing pending, no push, no echo
    h.ledger.times.stock = 500;
    h.gateway.remote = {
      stock: {
        value: {
          [presenceEntryId('fridge', 'ingX')]: presenceEnvelope('fridge', 'ingX', {
            physical: 900,
            counter: 0,
            device: 'devB',
          }),
        },
        updatedAt: 500,
      },
    };
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().fridge).toEqual(['ingX']);
    expect(h.ledger.pendingSet.size).toBe(0);
    expect(h.gateway.pushes).toHaveLength(0);

    // A strictly older remote stock changes nothing (same strict rule as the other sections)
    h.gateway.remote = {
      stock: {
        value: {
          [presenceEntryId('pantry', 'ingY')]: presenceEnvelope('pantry', 'ingY', {
            physical: 400,
            counter: 0,
            device: 'devC',
          }),
        },
        updatedAt: 400,
      },
    };
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().pantry).toEqual([]);
  });

  it('never pushes a stock section stamped 0: 0 means "never written", the device clock goes out (lot F1)', async () => {
    const h = makeHarness({ fridge: ['ing1'] });
    h.sync.start();
    await vi.runAllTimersAsync();
    h.kitchen.toggleFridgeItem('ing1'); // a change flushes the pending stock section
    h.ledger.times.stock = 0; // a persisted 0 adopted from an earlier server build (it once
    // stamped its converted stock sections 0 — the server half of D3): the device heals by
    // sending its own clock instead, which the fixed server accepts
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    expect(h.gateway.pushes[0].stock!.updatedAt).toBe(h.time.value);
  });

  it('pushes the named lists as one groceryLists section (debounced)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.createGroceryList('Ramadan');
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    const section = h.gateway.pushes[0].groceryLists;
    expect(section?.value.lists).toHaveLength(2);
    expect(section?.value.lists[1].name).toBe('Ramadan');
    expect(section?.value.activeId).toBe(section?.value.lists[1].id);
  });

  it('keeps the local lists when the server document only holds the legacy sections', async () => {
    const h = makeHarness({ groceryLists: groceryLists([list('l1', [GROCERY_ITEM])]) });
    // The migration of the legacy doc marked the named lists as changed here
    h.ledger.pendingSet.add('groceryLists');
    h.ledger.times.groceryLists = 900;
    // A document written by the previous app version: legacy groceryList/groceryMeta only
    h.gateway.remote = {
      groceryList: {
        value: [{ id: 'g9', name: 'Lait', quantity: 1, unit: 'l', category: 'other', is_checked: false }],
        updatedAt: 9000,
      },
      groceryMeta: { value: { note: 'legacy note', spent_tnd: 12 }, updatedAt: 9000 },
    } as unknown as RemoteKitchenDocument;
    h.sync.start();
    await vi.runAllTimersAsync();

    expect(h.kitchen.getState().groceryLists.map((l) => l.id)).toEqual(['l1']);
    expect(h.kitchen.groceryList[0].id).toBe('g1');
    // The local lists (newer shape) go up to the server instead
    expect(h.gateway.pushes).toHaveLength(1);
    expect(h.gateway.pushes[0].groceryLists?.value.lists.map((l) => l.id)).toEqual(['l1']);
  });

  it('ignores an older remote section', async () => {
    const h = makeHarness({ favorites: ['local1'] });
    h.ledger.times.favorites = 100;
    h.gateway.remote = { favorites: { value: elementSet(['old1'], [], 50), updatedAt: 50 } };
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().favorites).toEqual(['local1']);
  });

  it('pulls at most once a minute when the page becomes visible again', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.gateway.pulls).toBe(1);

    h.time.value += 30_000;
    h.host.fireVisible();
    expect(h.gateway.pulls).toBe(1); // inside the one-minute guard

    h.time.value += 61_000;
    h.host.fireVisible();
    expect(h.gateway.pulls).toBe(2);
  });

  it('flushes the pending buffer when the page goes to the background', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.toggleFavorite('r1'); // debounce timer armed
    h.host.fireVisible(); // coming back to the page never flushes
    expect(h.gateway.pushes).toHaveLength(0);

    h.host.fireHidden(); // backgrounded (or parked in the back/forward cache): flush now
    expect(h.gateway.pushes).toHaveLength(1);
    expect(presentIds(h.gateway.pushes[0].favorites!.value)).toEqual(['r1']);
  });

  it('survives repeated visibility cycles: every hidden flushes, visible keeps the pull guard', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    const pullsAfterStart = h.gateway.pulls;

    for (let cycle = 1; cycle <= 3; cycle++) {
      h.kitchen.toggleFavorite(`r${cycle}`);
      expect(h.host.armed()).toBe(1); // one debounce timer armed per change burst
      h.host.fireHidden();
      expect(h.gateway.pushes).toHaveLength(cycle);
      expect(h.host.armed()).toBe(0); // the timer was flushed, not left behind

      h.time.value += 15_000; // still inside the one-minute pull guard
      h.host.fireVisible();
      expect(h.gateway.pulls).toBe(pullsAfterStart);
    }

    h.time.value += 61_000; // past the guard: the next return pulls
    h.host.fireVisible();
    expect(h.gateway.pulls).toBe(pullsAfterStart + 1);
  });

  it('stop() unsubscribes from the host and cancels the armed debounce', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.toggleFavorite('r1');
    expect(h.host.armed()).toBe(1);
    h.sync.stop();
    expect(h.host.armed()).toBe(0); // the timer is cancelled, nothing is sent

    h.host.fireHidden(); // no listener left: no flush
    h.host.fireVisible(); // no listener left: no pull
    await vi.advanceTimersByTimeAsync(5000);
    expect(h.gateway.pushes).toHaveLength(0);
    expect(h.gateway.pulls).toBe(1); // only the start-up one
  });

  it('a pending debounce is cancelled when the account changes, the section stays pending', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.toggleFavorite('r1');
    expect(h.host.armed()).toBe(1);
    h.owner.uid = 'u2';
    h.sync.onAccountChanged();
    expect(h.host.armed()).toBe(0); // the timer of u1 is gone, nothing was sent for u1
    expect(h.ledger.pendingSet.has('favorites')).toBe(true); // it will go up on the next trigger
  });

  it('a flush while another push is in flight sends the remaining changes (no loss)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.gateway.holdPushes = 1;
    h.kitchen.toggleFavorite('r1');
    await vi.advanceTimersByTimeAsync(2000); // push 1 in flight (held by the server)
    expect(h.gateway.pushes).toHaveLength(1);

    h.kitchen.toggleFavorite('r2'); // new pending section, debounce armed
    h.host.fireHidden(); // immediate flush instead of waiting the debounce
    expect(h.gateway.pushes).toHaveLength(2);
    expect(presentIds(h.gateway.pushes[1].favorites!.value)).toEqual(['r1', 'r2']);

    h.gateway.release(); // both responses settle
    await vi.runAllTimersAsync();
    expect(h.sync.getState().pending).toBe(0);
    expect(h.sync.getState().failed).toBe(false);
  });

  it('pushes and pulls nothing for a visitor without an account', async () => {
    const h = makeHarness();
    h.owner.uid = null;
    h.sync.start();
    await vi.runAllTimersAsync();
    h.kitchen.toggleFavorite('r1');
    await vi.advanceTimersByTimeAsync(5000);
    expect(h.gateway.pushes).toHaveLength(0);
    expect(h.gateway.pulls).toBe(0);
  });

  it('sends the sections pending from a previous run at start-up, before pulling', async () => {
    const h = makeHarness({ favorites: ['kept'] });
    h.ledger.pendingSet.add('favorites');
    h.ledger.times.favorites = 900;
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.gateway.pushes).toHaveLength(1);
    expect(presentIds(h.gateway.pushes[0].favorites!.value)).toEqual(['kept']);
    expect(h.gateway.pushes[0].favorites?.updatedAt).toBe(900);
    expect(h.gateway.pulls).toBe(1);
  });

  it('pushes the changed preferences with the same debounce (without the pantry)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.preferences.save({ themeId: 'dark' }); // the container forwards every save to the sync
    h.sync.notifyPreferencesChanged();
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    const preferences = h.gateway.pushes[0].preferences;
    expect(preferences).toBeDefined();
    expect(preferences?.value).not.toHaveProperty('pantryStaples');
    expect(h.ledger.prefs.synced).not.toBeNull();
  });

  it('keeps the change pending when a push fails, and retries on the next trigger', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.gateway.fail = 'push';
    h.kitchen.toggleFavorite('r1');
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    expect(h.sync.getState().failed).toBe(true);
    expect(h.sync.getState().pending).toBe(1);

    h.gateway.fail = null;
    h.time.value += 10_000;
    h.kitchen.toggleFavorite('r2'); // next trigger: a new push carries the two changes
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(2);
    expect(presentIds(h.gateway.pushes[1].favorites!.value)).toEqual(['r1', 'r2']);
    expect(h.sync.getState().pending).toBe(0);
    expect(h.sync.getState().failed).toBe(false);
  });

  it('keeps the local modifications intact when the push is refused for the protocol version (B22-07)', async () => {
    const h = makeHarness({ favorites: ['r0'] });
    h.sync.start();
    await vi.runAllTimersAsync();

    // The protocol refusal surfaces as a distinct code; nothing local is lost: the change
    // stays pending, no acknowledgment is recorded, no local data is dropped or replaced
    h.gateway.fail = 'push';
    h.gateway.failCode = 'kitchen_protocol_unsupported';
    h.kitchen.toggleFavorite('r1');
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.gateway.pushes).toHaveLength(1);
    expect(h.sync.getState().failed).toBe(true);
    expect(h.sync.getState().pending).toBe(1);
    expect(h.sync.getState().reconciliationRequired).toBe(false);
    expect(h.kitchen.getState().favorites).toEqual(['r0', 'r1']);

    // After the client update the same changes leave with a supported version
    h.gateway.fail = null;
    h.gateway.failCode = null;
    h.time.value += 10_000;
    h.kitchen.toggleFavorite('r2');
    await vi.advanceTimersByTimeAsync(2000);
    expect(presentIds(h.gateway.pushes[1].favorites!.value)).toEqual(['r0', 'r1', 'r2']);
    expect(h.sync.getState().pending).toBe(0);
    expect(h.sync.getState().failed).toBe(false);
  });

  it('a failed pull does not erase a recorded reconciliation signal (B22-07)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.gateway.reconciliationRequired = true;
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(true);

    // A failed pull changes nothing but `failed`: the signal stays until a SUCCESSFUL
    // pull without it — which, the server signaling deterministically per declared
    // version, only happens once the mismatch is genuinely resolved
    h.gateway.fail = 'pull';
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(true);
    expect(h.sync.getState().failed).toBe(true);

    h.gateway.fail = null;
    h.gateway.reconciliationRequired = false; // updated client: the server no longer signals
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(false);
  });

  it('records the reconciliation signal idempotently and only while it is signaled (B22-07)', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(false); // the startup pull carries none

    h.gateway.reconciliationRequired = true;
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(true);

    // A pull without signal means the mismatch is resolved (updated client): the marker
    // reflects the LAST pull only — never a server proof, erased by nothing else
    h.gateway.reconciliationRequired = false;
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().reconciliationRequired).toBe(false);
  });

  it('reloads the local state and pulls when the account changes', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    const pullsAfterStart = h.gateway.pulls;

    h.owner.uid = 'u2';
    h.gateway.remote = { favorites: { value: elementSet(['from-u2'], [], 9000), updatedAt: 9000 } };
    h.sync.onAccountChanged();
    await vi.runAllTimersAsync();
    expect(h.gateway.pulls).toBe(pullsAfterStart + 1);
    expect(h.kitchen.getState().favorites).toEqual(['from-u2']);
  });

  it('drops a pull that resolves after the account changed', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    // u1's pull is in flight when u2 signs in, whose own pull is held too: the two
    // responses arrive in the order they were sent (u1's stale one first)
    h.gateway.remote = { favorites: { value: elementSet(['stale-u1'], [], 9000), updatedAt: 9000 } };
    h.gateway.holdPulls = 2;
    h.time.value += 61_000;
    h.host.fireVisible(); // u1's pull, held
    h.owner.uid = 'u2';
    h.gateway.remote = { favorites: { value: elementSet(['from-u2'], [], 9000), updatedAt: 9000 } };
    h.sync.onAccountChanged(); // u2's pull, held

    h.gateway.release(); // u1's stale response arrives after the switch
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().favorites).toEqual([]); // nothing from u1 touched u2's document
    expect(h.ledger.times.favorites).toBeUndefined(); // not even the section timestamps
    expect(h.sync.getState().syncing).toBe(true); // u2's pull is still the one in flight

    h.gateway.release(); // u2's own response arrives
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().favorites).toEqual(['from-u2']);
    expect(h.sync.getState().syncing).toBe(false);
  });

  it('keeps the sections pending when a push resolves after the account changed', async () => {
    const h = makeHarness({ favorites: ['r1'] });
    h.sync.start();
    await vi.runAllTimersAsync();

    // The server holds a named list with a note: if the stale response were applied, it would
    // land on u2
    h.gateway.remote = {
      groceryLists: {
        value: groceryLists([list('l1', [], 'note-from-u1')]),
        updatedAt: 9000,
      },
    };
    h.kitchen.toggleFavorite('r2'); // favorites pending, debounced push armed
    h.gateway.holdPushes = 1;
    await vi.advanceTimersByTimeAsync(2000); // u1's push, held in flight

    h.owner.uid = 'u2';
    h.gateway.holdPulls = 1; // hold u2's own pull: only the stale response must arrive now
    h.sync.onAccountChanged();
    h.gateway.release(); // the push response arrives for u2's session
    await vi.runAllTimersAsync();

    // The stale response confirmed nothing and applied nothing on u2's document
    expect(h.ledger.pendingSet.has('favorites')).toBe(true);
    expect(h.kitchen.getState().groceryLists[0]?.note).toBe('');
    expect(h.sync.getState().syncing).toBe(true); // the flags still belong to u2's pull in flight

    h.gateway.release(); // u2's own pull arrives
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().groceryLists[0]?.note).toBe('note-from-u1');
    expect(h.sync.getState().syncing).toBe(false);
    expect(h.gateway.pushes).toHaveLength(1);

    // Signing back in with u1: the sections that stayed pending replay on the next
    // trigger (here a restart, like the start-up catch-up) — nothing was lost
    h.owner.uid = 'u1';
    h.sync.onAccountChanged();
    h.sync.stop();
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.gateway.pushes).toHaveLength(2);
    expect(presentIds(h.gateway.pushes[1].favorites!.value)).toEqual(['r1', 'r2']);
    expect(h.ledger.pendingSet.has('favorites')).toBe(false);
  });

  it('applies a remote deletion: the element is gone, not resurrected by the union', async () => {
    const h = makeHarness({ favorites: ['r1'] });
    h.ledger.times.favorites = 100;
    // Another device removed r1 (tombstone at 600) and added r2: both travel in the maps
    h.gateway.remote = {
      favorites: {
        value: {
          added: {
            r1: { physical: 100, counter: 0, device: 'other' },
            r2: { physical: 500, counter: 0, device: 'other' },
          },
          removed: { r1: { physical: 600, counter: 0, device: 'other' } },
        },
        updatedAt: 600,
      },
    };
    h.sync.start();
    await vi.runAllTimersAsync();
    expect(h.kitchen.getState().favorites).toEqual(['r2']); // r1 stays deleted
    // A later local save keeps the tombstone: the element cannot come back on a push
    h.kitchen.toggleFavorite('r3');
    await vi.advanceTimersByTimeAsync(2000);
    const pushed = h.gateway.pushes[0].favorites!.value;
    expect(presentIds(pushed)).toEqual(['r2', 'r3']);
    expect(pushed.removed['r1']).toBeDefined();
  });

  it('resets a device that has not synced within the retention and re-adopts the server', async () => {
    const h = makeHarness({ favorites: ['stale-local'], weeklyPlan: [DAY('mon', 'stale-plan')] });
    h.sync.start();
    await vi.runAllTimersAsync();
    h.time.value += STALE_DEVICE_MS + 1;
    h.gateway.remote = {
      favorites: { value: elementSet(['from-server'], [], 9000), updatedAt: 9000 },
      weeklyPlan: { value: [DAY('mon', 'server-plan')], updatedAt: 9000 },
    };
    h.host.fireVisible();
    h.time.value += 61_000; // past the pull guard
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    // The stale local data is wiped and the server document is adopted as it is
    expect(h.kitchen.getState().favorites).toEqual(['from-server']);
    expect(h.kitchen.getState().weeklyPlan[0].lunch.plat_id).toBe('server-plan');
    expect(h.sync.getState().lastPullAt).not.toBeNull();
  });

  it('wipes nothing when the pull fails, even for a stale device', async () => {
    const h = makeHarness({ favorites: ['kept'] });
    h.sync.start();
    await vi.runAllTimersAsync();
    h.time.value += STALE_DEVICE_MS + 1;
    h.gateway.fail = 'pull';
    h.host.fireVisible();
    h.time.value += 61_000;
    h.host.fireVisible();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().failed).toBe(true);
    expect(h.kitchen.getState().favorites).toEqual(['kept']); // the local data is untouched
  });
});
