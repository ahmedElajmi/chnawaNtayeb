import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KitchenStore } from './KitchenStore';
import { KitchenSync } from './KitchenSync';
import type { DayId } from '@/core/planning';
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

type SectionName = 'favorites' | 'fridge' | 'pantry' | 'weeklyPlan' | 'groceryList';

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
    groceryList: [],
    ...initial,
  };
  const syncState = { suspended: false };
  const ledgerData = {
    pending: new Set<string>(),
    times: {} as Record<string, number>,
    prefs: { changed: null as number | null, synced: null as number | null },
  };

  const repo: KitchenRepository = {
    loadFridge: () => data.fridge as string[],
    saveFridge: (ids) => {
      data.fridge = ids;
      if (!syncState.suspended) {
        ledgerData.pending.add('fridge');
        ledgerData.times.fridge = time.value;
      }
    },
    loadPantry: () => data.pantry as string[],
    savePantry: (ids) => {
      data.pantry = ids;
      if (!syncState.suspended) {
        ledgerData.pending.add('pantry');
        ledgerData.times.pantry = time.value;
      }
    },
    loadFavorites: () => data.favorites as string[],
    saveFavorites: (ids) => {
      data.favorites = ids;
      if (!syncState.suspended) {
        ledgerData.pending.add('favorites');
        ledgerData.times.favorites = time.value;
      }
    },
    loadWeeklyPlan: () => data.weeklyPlan as never,
    saveWeeklyPlan: (plan) => {
      data.weeklyPlan = plan;
      if (!syncState.suspended) {
        ledgerData.pending.add('weeklyPlan');
        ledgerData.times.weeklyPlan = time.value;
      }
    },
    loadGroceryList: () => data.groceryList as never,
    saveGroceryList: (items) => {
      data.groceryList = items;
      if (!syncState.suspended) {
        ledgerData.pending.add('groceryList');
        ledgerData.times.groceryList = time.value;
      }
    },
    loadGroceryMeta: () => ({ note: '', spent: null }),
    saveGroceryMeta: () => undefined,
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
  };
  const gatewayPort = {
    async pull(): Promise<RemoteKitchenDocument | null> {
      gateway.pulls += 1;
      if (gateway.fail === 'pull') throw new Error('unreachable');
      return gateway.remote;
    },
    async push(sections: RemoteKitchenSections): Promise<RemoteKitchenDocument> {
      gateway.pushes.push(sections);
      if (gateway.fail === 'push') throw new Error('refused');
      const remote: RemoteKitchenDocument = { ...gateway.remote };
      for (const [name, section] of Object.entries(sections)) {
        const current = remote[name as keyof RemoteKitchenDocument];
        if (!current || section.updatedAt > current.updatedAt) {
          remote[name as keyof RemoteKitchenDocument] = section as never;
        }
      }
      gateway.remote = remote;
      return remote;
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
    expect(h.gateway.pushes[0].favorites?.value).toEqual(['r0', 'r1', 'r2']);
    expect(h.gateway.pushes[0].fridge?.value).toEqual(['ing1']);
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
    expect(h.gateway.pushes[1].favorites?.value).toEqual([]);
  });

  it('adopts a newer remote document: unions for sets, newest write for the rest', async () => {
    const h = makeHarness({
      favorites: ['r1'],
      fridge: ['ing1'],
      weeklyPlan: [DAY('mon', 'local1')],
      groceryList: [{ id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce', category: 'other', is_checked: false }],
    });
    h.ledger.times.favorites = 100;
    h.ledger.times.fridge = 100;
    h.ledger.times.weeklyPlan = 100;
    h.ledger.times.groceryList = 100;
    h.gateway.remote = {
      favorites: { value: ['r1', 'r2'], updatedAt: 500 },
      fridge: { value: ['ing2'], updatedAt: 500 },
      weeklyPlan: { value: [DAY('mon', 'remote1')], updatedAt: 500 },
      groceryList: {
        value: [{ id: 'g2', name: 'Lait', quantity: 1, unit: 'l', category: 'other', is_checked: false }],
        updatedAt: 500,
      },
    };
    h.sync.start();
    await vi.runAllTimersAsync();

    expect(h.kitchen.getState().favorites).toEqual(['r1', 'r2']);
    expect(h.kitchen.getState().fridge).toEqual(['ing1', 'ing2']);
    expect(h.kitchen.getState().weeklyPlan[0].lunch.plat_id).toBe('remote1');
    expect(h.kitchen.getState().groceryList[0].id).toBe('g2');
    // The adoption marked nothing pending and triggered no push
    expect(h.ledger.pendingSet.size).toBe(0);
    expect(h.gateway.pushes).toHaveLength(0);
  });

  it('ignores an older remote section', async () => {
    const h = makeHarness({ favorites: ['local1'] });
    h.ledger.times.favorites = 100;
    h.gateway.remote = { favorites: { value: ['old1'], updatedAt: 50 } };
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
    expect(h.gateway.pushes[0].favorites?.value).toEqual(['r1']);
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
    expect(h.gateway.pushes[0].favorites?.value).toEqual(['kept']);
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
    expect(h.gateway.pushes[1].favorites?.value).toEqual(['r1', 'r2']);
    expect(h.sync.getState().pending).toBe(0);
    expect(h.sync.getState().failed).toBe(false);
  });

  it('reloads the local state and pulls when the account changes', async () => {
    const h = makeHarness();
    h.sync.start();
    await vi.runAllTimersAsync();
    const pullsAfterStart = h.gateway.pulls;

    h.owner.uid = 'u2';
    h.gateway.remote = { favorites: { value: ['from-u2'], updatedAt: 9000 } };
    h.sync.onAccountChanged();
    await vi.runAllTimersAsync();
    expect(h.gateway.pulls).toBe(pullsAfterStart + 1);
    expect(h.kitchen.getState().favorites).toEqual(['from-u2']);
  });
});
