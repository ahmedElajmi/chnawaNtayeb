import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KitchenStore } from './KitchenStore';
import { KitchenSync } from './KitchenSync';
import {
  EMPTY_ELEMENT_SET,
  STALE_DEVICE_MS,
  mergeElementSets,
  presentIds,
  wrapLegacyList,
  type ElementSet,
} from '@/core/kitchen';
import type { DayId } from '@/core/planning';
import type { GroceryList } from '@/core/grocery';
import type {
  KitchenRepository,
  KitchenSyncLedger,
  PreferencesRepository,
  RemoteKitchenDocument,
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
    /** Responses held in flight until the test releases them (oldest first) */
    holdPulls: number;
    holdPushes: number;
    release: () => void;
  };
  time: { value: number };
  documentListeners: Map<string, () => void>;
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
    const list = initial?.[section];
    if (Array.isArray(list) && list.length) {
      elements[section] = wrapLegacyList(list as string[], 100)!;
    }
  }

  /** A local list save: the diff becomes versions, like the real repository records them. */
  const saveList = (section: 'favorites' | 'fridge' | 'pantry', ids: string[]): void => {
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

  const repo: KitchenRepository = {
    loadFridge: () => data.fridge as string[],
    saveFridge: (ids) => saveList('fridge', ids),
    loadPantry: () => data.pantry as string[],
    savePantry: (ids) => saveList('pantry', ids),
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
    mergeElementSet: (section, remote) => {
      const merged = mergeElementSets(elements[section] ?? EMPTY_ELEMENT_SET, remote);
      elements[section] = merged;
      data[section] = presentIds(merged);
    },
    resetLocal: () => {
      for (const section of ['favorites', 'fridge', 'pantry', 'weeklyPlan'] as const) {
        data[section] = [];
      }
      // Like the real adapter: the named lists fall back to one fresh empty default list
      const fresh = list('fresh');
      data.groceryLists = groceryLists([fresh]);
      for (const section of ['favorites', 'fridge', 'pantry'] as const) delete elements[section];
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
    holdPulls: 0,
    holdPushes: 0,
    release: () => undefined,
  };
  const held: (() => void)[] = [];
  gateway.release = () => {
    held.shift()?.();
  };
  const gatewayPort = {
    async pull(): Promise<RemoteKitchenDocument | null> {
      gateway.pulls += 1;
      // The document is snapshotted before waiting: the release must answer with the
      // version this request would have received, not the one the server holds later
      const snapshot = gateway.remote;
      if (gateway.holdPulls > 0) {
        gateway.holdPulls -= 1;
        await new Promise<void>((resolve) => held.push(resolve));
      }
      if (gateway.fail === 'pull') throw new Error('unreachable');
      return snapshot;
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
      if (gateway.fail === 'push') throw new Error('refused');
      gateway.remote = merged;
      return merged;
    },
  };

  const documentListeners = new Map<string, () => void>();
  vi.stubGlobal('window', {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  vi.stubGlobal('document', {
    addEventListener: (kind: string, listener: () => void) => documentListeners.set(kind, listener),
    removeEventListener: (kind: string) => documentListeners.delete(kind),
    visibilityState: 'visible',
  });

  const sync = new KitchenSync({
    gateway: gatewayPort,
    kitchen,
    preferences,
    ledger,
    owner: () => owner.uid,
    now: () => time.value,
  });
  return { sync, kitchen, ledger, gateway, time, documentListeners, owner, preferences };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
    expect(presentIds(h.gateway.pushes[0].fridge!.value)).toEqual(['ing1']);
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
    h.documentListeners.get('visibilitychange')!();
    expect(h.gateway.pulls).toBe(1); // inside the one-minute guard

    h.time.value += 61_000;
    h.documentListeners.get('visibilitychange')!();
    expect(h.gateway.pulls).toBe(2);
  });

  it('flushes the pending buffer when the page goes to the background', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();

    h.kitchen.toggleFavorite('r1'); // debounce timer armed
    h.documentListeners.get('visibilitychange')!(); // hidden flush — but the stub says visible
    expect(h.gateway.pushes).toHaveLength(0); // no flush while visible

    (document as { visibilityState: string }).visibilityState = 'hidden';
    h.documentListeners.get('visibilitychange')!();
    expect(h.gateway.pushes).toHaveLength(1);
    expect(presentIds(h.gateway.pushes[0].favorites!.value)).toEqual(['r1']);
    (document as { visibilityState: string }).visibilityState = 'visible';
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
    h.documentListeners.get('visibilitychange')!(); // u1's pull, held
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
    h.documentListeners.get('visibilitychange')!();
    h.time.value += 61_000; // past the pull guard
    h.documentListeners.get('visibilitychange')!();
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
    h.documentListeners.get('visibilitychange')!();
    h.time.value += 61_000;
    h.documentListeners.get('visibilitychange')!();
    await vi.runAllTimersAsync();
    expect(h.sync.getState().failed).toBe(true);
    expect(h.kitchen.getState().favorites).toEqual(['kept']); // the local data is untouched
  });
});
