import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalKitchenRepository } from './localRepositories';
import { storage } from './storage';
import { DEFAULT_GROCERY_LIST_NAME, type GroceryItem } from '@/core/grocery';
import {
  activeEnvelope,
  presenceEntryId,
  projectStockToLegacy,
  stockDerivedPresence,
  tombstoneEnvelope,
  type ElementVersion,
  type StockSection,
} from '@/core/kitchen';

/**
 * The scoped kitchen document is tested against a fake localStorage: the interesting part
 * is the migration of the docs written before the named shopping lists, which must happen
 * once, on the first read, and be saved back right away.
 */

const ITEM: GroceryItem = { id: 'g1', name: 'Œufs', quantity: 6, unit: 'pièce', category: 'other', is_checked: false };

function fakeLocalStorage(): void {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => void map.clear(),
  });
}

afterEach(() => vi.unstubAllGlobals());

/** A deterministic clock: the toggles' versions are asserted exactly. By default the
 *  built-in pantry preset is cleared so a fresh scope holds no legacy data at all. */
function makeRepo(scope = 'u1', start = 1_000, options: { withPresetPantry?: boolean } = {}) {
  const time = { value: start };
  if (!options.withPresetPantry) storage.savePreferences({ pantryStaples: [] });
  const repo = createLocalKitchenRepository(() => scope, { now: () => time.value, deviceId: 'devA' });
  return { repo, time };
}

const version = (physical: number, device = 'remote', counter = 0): ElementVersion => ({ physical, counter, device });

/** A full ACTIVE envelope for a backup-restore seed (the id must match the deterministic key). */
const enriched = (
  location: 'fridge' | 'pantry',
  ingredientId: string,
  quantity: number,
  unit: string
): StockSection => {
  const id = presenceEntryId(location, ingredientId);
  return {
    [id]: activeEnvelope(
      {
        id,
        ingredient_id: ingredientId,
        location,
        origin: 'manual',
        added_at: '2026-01-01T10:00:00Z',
        quantity,
        unit,
        note: 'paquet ouvert',
      },
      version(500, 'otherDevice')
    ),
  };
};

const asStored = (doc: unknown): Record<string, unknown> => doc as Record<string, unknown>;

describe('the local kitchen repository', () => {
  it('saves and reads the named lists back with the active id', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const lists = [
      { id: 'l1', name: 'Weekend', items: [ITEM], note: '', spent_tnd: null },
      { id: 'l2', name: 'Ramadan', items: [], note: 'chez Carrefour', spent_tnd: 12 },
    ];
    repo.saveGroceryLists({ lists, activeId: 'l2' });
    expect(repo.loadGroceryLists()).toEqual({ lists, activeId: 'l2' });
  });

  it('migrates a legacy scoped doc on the first read and saves the new shape back at once', () => {
    fakeLocalStorage();
    const legacyDoc = {
      favorites: ['r1'],
      fridge: ['ing1'],
      pantry: [],
      weeklyPlan: [],
      groceryList: [ITEM],
      groceryNote: 'chez Carrefour',
      grocerySpent: 25.5,
      sections: { favorites: 100 },
      pending: ['favorites'],
      preferencesSyncedAt: null,
    };
    storage.saveKitchenDoc('u1', legacyDoc as never);

    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({
      name: DEFAULT_GROCERY_LIST_NAME,
      items: [ITEM],
      note: 'chez Carrefour',
      spent_tnd: 25.5,
    });
    expect(state.activeId).toBe(state.lists[0].id);

    // The migrated shape replaced the legacy one in storage right away (one write)
    const stored = storage.getKitchenDoc('u1')!;
    expect(stored.groceryLists).toEqual(state);
    expect(stored.groceryList).toBeUndefined();
    expect(stored.groceryNote).toBeUndefined();
    expect(stored.grocerySpent).toBeUndefined();
    // The migrated lists count as changed here: they are pushed to the server once synced
    expect(stored.pending).toContain('groceryLists');
    expect(stored.sections.groceryLists).toBeGreaterThan(0);
    expect(stored.favorites).toEqual(['r1']); // the rest of the doc is untouched
  });

  it('migrates only once: the list ids stay stable across reads', () => {
    fakeLocalStorage();
    storage.saveKitchenDoc('u1', { groceryList: [ITEM] } as never);
    const repo = createLocalKitchenRepository(() => 'u1');
    const first = repo.loadGroceryLists();
    const second = repo.loadGroceryLists();
    expect(second).toEqual(first);
  });

  it('adopts the unscoped legacy keys of an old version into one default-named list', () => {
    fakeLocalStorage();
    storage.saveGroceryList([ITEM]);
    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({ name: DEFAULT_GROCERY_LIST_NAME, items: [ITEM], note: '', spent_tnd: null });
    // The adopted legacy list counts as changed here: it is pushed to the server once synced
    expect(repo.ledger.pending()).toContain('groceryLists');
  });

  it('starts a new scope with one empty default-named list', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const state = repo.loadGroceryLists();
    expect(state.lists).toHaveLength(1);
    expect(state.lists[0]).toMatchObject({ name: DEFAULT_GROCERY_LIST_NAME, items: [], note: '', spent_tnd: null });
    expect(state.activeId).toBe(state.lists[0].id);
  });

  it('reports data through the ledger, named lists included', () => {
    fakeLocalStorage();
    const repo = createLocalKitchenRepository(() => 'u1');
    const { ledger } = repo;
    repo.saveGroceryLists({
      lists: [{ id: 'l1', name: 'Weekend', items: [ITEM], note: '', spent_tnd: null }],
      activeId: 'l1',
    });
    expect(ledger.hasData()).toBe(true);
    expect(ledger.pending()).toContain('groceryLists');
    expect(ledger.sectionTimes().groceryLists).toBeGreaterThan(0);
    ledger.confirm(['groceryLists']);
    expect(ledger.pending()).not.toContain('groceryLists');
  });
});

describe('the local stock of entries (lot F1, client)', () => {
  beforeEach(() => fakeLocalStorage());

  it('a scope with no legacy data at all never gets a doc nor a stock section (no needless writes)', () => {
    const { repo } = makeRepo(); // the built-in pantry preset is cleared: no legacy data at all
    repo.loadGroceryLists();
    expect(storage.getKitchenDoc('u1')).toBeNull();
    expect(repo.loadStock()).toEqual({});
  });

  it('the built-in pantry preset adopts into the stock like any legacy data (one write)', () => {
    const { repo } = makeRepo('u1', 1_000, { withPresetPantry: true }); // the preset stays: legacy data
    const pantry = repo.loadPantry();
    expect(pantry.length).toBeGreaterThan(0);
    const stored = asStored(storage.getKitchenDoc('u1'));
    expect(asStored(stored.stock)).toBeDefined();
    expect(asStored(stored.pending)).toContain('stock');
    expect(pantry).toEqual(stockDerivedPresence(repo.loadStock(), 'pantry'));
  });

  it('ensureStockState converts the legacy lists once, with the same ids and versions as the server', () => {
    // A doc written by the previous app version: legacy lists wrapped as element sets
    // (version carried verbatim, physical 500) and no stock section yet
    storage.saveKitchenDoc('u1', {
      favorites: [],
      fridge: ['ing1'],
      pantry: ['ing2'],
      weeklyPlan: [],
      groceryLists: undefined,
      sections: { fridge: 500, pantry: 501 },
      pending: [],
      elements: {
        fridge: { added: { ing1: { physical: 500, counter: 0, device: 'legacy' } }, removed: {} },
        pantry: { added: { ing2: { physical: 501, counter: 0, device: 'legacy' } }, removed: {} },
      },
      deviceClock: null,
      lastSyncedAt: null,
    } as never);
    const { repo } = makeRepo();
    expect(repo.loadFridge()).toEqual(['ing1']);
    expect(repo.loadPantry()).toEqual(['ing2']);
    const stock = repo.loadStock();
    const fridgeKey = presenceEntryId('fridge', 'ing1');
    expect(stock[fridgeKey]?.state).toBe('active');
    expect(stock[fridgeKey]?.state === 'active' ? stock[fridgeKey].version : null).toEqual({
      physical: 500,
      counter: 0,
      device: 'legacy',
    });
    expect(stock[presenceEntryId('pantry', 'ing2')].state === 'tombstoned').toBe(false);
    // The migrated stock is marked pending (it must reach the other devices) and saved once
    expect(repo.ledger.pending()).toContain('stock');
    const stored = asStored(storage.getKitchenDoc('u1'));
    expect(stored.fridge).toEqual(['ing1']); // the legacy sections stay intact (rollback A)
    expect(asStored(stored.elements).fridge).toBeDefined();
    // The conversion is a one-time migration: the named lists migration also ran on this
    // old doc; a second read adds nothing more
    expect(repo.ledger.pending()).toEqual(['stock', 'groceryLists']);
  });

  it('a toggle creates the deterministic bare presence entry, and the list derives from the stock', () => {
    const { repo, time } = makeRepo();
    repo.saveFridge(['ing1']);
    const key = presenceEntryId('fridge', 'ing1');
    const stock = repo.loadStock();
    expect(stock[key].state).toBe('active');
    expect(stock[key].state === 'active' ? stock[key].entry : null).toMatchObject({
      id: key,
      ingredient_id: 'ing1',
      location: 'fridge',
      origin: 'manual',
    });
    expect(stock[key].state === 'active' ? 'quantity' in stock[key].entry : true).toBe(false); // bare presence
    expect(stock[key].state === 'active' ? stock[key].version : null).toEqual({
      physical: 1_000,
      counter: 0,
      device: 'devA',
    });
    expect(repo.loadFridge()).toEqual(['ing1']);
    expect(repo.ledger.pending()).toContain('stock');
    expect(repo.ledger.sectionTimes().stock).toBe(time.value);
    // The derived lists and the local legacy card follow the stock (purely local projection)
    const stored = asStored(storage.getKitchenDoc('u1'));
    expect(stored.fridge).toEqual(stockDerivedPresence(repo.loadStock(), 'fridge'));
    expect(asStored(stored.elements).fridge).toEqual(projectStockToLegacy(repo.loadStock(), 'fridge'));
    expect(asStored(stored.sections).fridge).toBe(asStored(stored.sections).stock);
  });

  it('a second toggle tombstones the presence entry: the visible list empties', () => {
    const { repo } = makeRepo();
    repo.saveFridge(['ing1']);
    repo.saveFridge([]);
    const key = presenceEntryId('fridge', 'ing1');
    const envelope = repo.loadStock()[key];
    expect(envelope.state).toBe('tombstoned');
    expect(envelope.state === 'tombstoned' ? envelope.removed : null).toEqual(envelope.version);
    expect(repo.loadFridge()).toEqual([]);
  });

  it('re-adding after the removal creates a fresh bare entry: enriched data never comes back', () => {
    const { repo } = makeRepo();
    repo.saveStock(enriched('fridge', 'ing1', 2, 'g')); // an enriched entry (quantity + note)
    repo.saveFridge([]); // the removal tombstones the enriched entry (stub from the real entry)
    const key = presenceEntryId('fridge', 'ing1');
    expect(repo.loadStock()[key].state).toBe('tombstoned');
    repo.saveFridge(['ing1']); // the re-add is a legitimate new event: bare presence, new version
    const envelope = repo.loadStock()[key];
    expect(envelope.state).toBe('active');
    expect(envelope.state === 'active' ? 'quantity' in envelope.entry : true).toBe(false);
    expect(envelope.state === 'active' ? 'note' in envelope.entry : true).toBe(false);
    expect(envelope.state === 'active' ? envelope.version.physical : 0).toBeGreaterThan(500);
  });

  it('adopting a legacy fridge section from the server converts it into the stock (same ids)', () => {
    const { repo } = makeRepo();
    repo.mergeElementSet('fridge', {
      added: { ing2: { physical: 700, counter: 0, device: 'remote' } },
      removed: {},
    });
    const key = presenceEntryId('fridge', 'ing2');
    const stock = repo.loadStock();
    expect(stock[key].state).toBe('active');
    expect(stock[key].state === 'active' ? stock[key].version : null).toEqual({
      physical: 700,
      counter: 0,
      device: 'remote',
    });
    expect(repo.loadFridge()).toEqual(['ing2']);
    // An adoption records nothing pending (the server already holds the data)
    expect(repo.ledger.pending()).toEqual([]);
  });
  it('mergeStock reconciles the envelopes by HLC version and re-derives the lists', () => {
    const { repo } = makeRepo();
    repo.saveStock(enriched('fridge', 'ing1', 2, 'g'));
    const key = presenceEntryId('fridge', 'ing1');
    // A remote deletion that is NEWER wins: the entry disappears (its tombstone travels)
    repo.mergeStock({ [key]: tombstoneEnvelope({ id: key, ingredient_id: 'ing1', location: 'fridge' }, version(900)) });
    expect(repo.loadFridge()).toEqual([]);
    expect(repo.loadStock()[key].state).toBe('tombstoned');
    // A remote add that is OLDER loses: no resurrection, the enriched entry could not be erased either
    repo.mergeStock({
      [key]: activeEnvelope(
        { id: key, ingredient_id: 'ing1', location: 'fridge', origin: 'manual', added_at: '2026-01-02T10:00:00Z' },
        version(100)
      ),
    });
    expect(repo.loadStock()[key].state).toBe('tombstoned');
    expect(repo.loadFridge()).toEqual([]);
  });

  it('the global clear tombstones every entry of the location only (clearFridge)', () => {
    const { repo } = makeRepo();
    repo.saveStock({
      ...enriched('fridge', 'ing1', 1, 'g'),
      ...enriched('fridge', 'ing2', 3, 'kg'),
      ...enriched('pantry', 'ing3', 1, 'l'),
    });
    repo.clearStockLocation('fridge');
    const stock = repo.loadStock();
    expect(stock[presenceEntryId('fridge', 'ing1')].state).toBe('tombstoned');
    expect(stock[presenceEntryId('fridge', 'ing2')].state).toBe('tombstoned');
    expect(stock[presenceEntryId('pantry', 'ing3')].state).toBe('active');
    expect(repo.loadFridge()).toEqual([]);
    expect(repo.loadPantry()).toEqual(['ing3']);
    expect(repo.ledger.pending()).toContain('stock');
  });

  it('resetLocal empties the stock too (the clock and the last sync stay)', () => {
    const { repo } = makeRepo();
    repo.saveFridge(['ing1']);
    repo.resetLocal();
    expect(repo.loadStock()).toEqual({});
    expect(repo.loadFridge()).toEqual([]);
    // The stock is gone; the fresh default list fallback is the only pending section left
    expect(repo.ledger.pending()).toEqual(['groceryLists']);
    expect(repo.ledger.pending()).not.toContain('stock');
  });

  it('a backup restore replaces the whole stock and re-derives the lists', () => {
    const { repo } = makeRepo();
    repo.saveFridge(['old1']);
    // One valid enriched entry and one envelope violating the identity invariant (id != key):
    // the invalid one is dropped, the valid one is stored
    const valid = enriched('fridge', 'ing1', 2, 'g');
    const invalidKey = 'st_fridge_ing9';
    repo.saveStock({
      ...valid,
      [invalidKey]: activeEnvelope(
        {
          id: 'st_fridge_ing1',
          ingredient_id: 'ing1',
          location: 'fridge',
          origin: 'manual',
          added_at: '2026-01-01T10:00:00Z',
        },
        version(600)
      ),
    });
    const stock = repo.loadStock();
    const restored = stock[presenceEntryId('fridge', 'ing1')];
    expect(Object.keys(stock)).toEqual([presenceEntryId('fridge', 'ing1')]);
    expect(restored.state === 'active' ? restored.entry.quantity : null).toBe(2);
    expect(repo.loadFridge()).toEqual(['ing1']);
  });

  it('the removal of an ingredient holding two entries targets ONE entry (E3): the ingredient stays present', () => {
    const { repo } = makeRepo();
    const key1 = presenceEntryId('fridge', 'ing1'); // the deterministic presence entry (bare)
    const extra = 'st_fridge_ing1_x2'; // a second, enriched entry of the same ingredient
    repo.saveStock({
      [key1]: activeEnvelope(
        { id: key1, ingredient_id: 'ing1', location: 'fridge', origin: 'manual', added_at: '2026-01-01T10:00:00Z' },
        version(100, 'otherDevice')
      ),
      [extra]: activeEnvelope(
        {
          id: extra,
          ingredient_id: 'ing1',
          location: 'fridge',
          origin: 'manual',
          added_at: '2026-01-02T10:00:00Z',
          quantity: 3,
          unit: 'kg',
        },
        version(101, 'otherDevice')
      ),
    });
    repo.saveFridge([]); // the UI removes the visible ingredient once: ONE entry tombstoned
    const stock = repo.loadStock();
    expect(stock[key1].state).toBe('tombstoned');
    expect(stock[extra].state).toBe('active'); // the enriched entry survives untouched
    expect(repo.loadFridge()).toEqual(['ing1']); // still present: the contract's behavior
    // A second removal targets the enriched entry now: the ingredient really leaves
    repo.saveFridge([]);
    expect(repo.loadStock()[extra].state).toBe('tombstoned');
    expect(repo.loadFridge()).toEqual([]);
  });

  it('the ledger counts stock entries the visible lists exclude (permanent exhausted)', () => {
    const { repo } = makeRepo();
    const id = presenceEntryId('fridge', 'sel');
    repo.saveStock({
      [id]: activeEnvelope(
        {
          id,
          ingredient_id: 'sel',
          location: 'fridge',
          origin: 'manual',
          added_at: '2026-01-01T10:00:00Z',
          permanent: true,
          exhausted_at: '2026-01-01',
        },
        version(500)
      ),
    });
    expect(repo.loadFridge()).toEqual([]); // not visible: excluded from the derived presence
    expect(repo.ledger.hasData()).toBe(true); // but the stock holds data (lot F1 § 4.3)
  });
});

describe('own-state integrity beyond the caps (lot F1 A4 — chef decision AR-1, option α)', () => {
  it('restores a backup stock over the caps WHOLE and re-reads it intact (no silent truncation)', () => {
    fakeLocalStorage();
    const { repo } = makeRepo();
    // 301 active fridge entries (one over the cap) + 2 001 tombstones: the adopted state
    // B1d plus one offline toggle — exactly the scenario that used to lose st_fridge_ing0299
    const stock: StockSection = {};
    for (let i = 0; i < 301; i++) {
      const id = presenceEntryId('fridge', `i${i}`);
      stock[id] = activeEnvelope(
        { id, ingredient_id: `i${i}`, location: 'fridge', origin: 'manual', added_at: '2026-01-01T10:00:00Z' },
        version(100 + i, 'remote')
      );
    }
    for (let i = 0; i < 2001; i++) {
      const id = presenceEntryId('fridge', `t${i}`);
      stock[id] = tombstoneEnvelope({ id, ingredient_id: `t${i}`, location: 'fridge' }, version(5000 + i, 'remote'));
    }
    repo.saveStock(stock);
    // Re-reading through getKitchenDoc returns the whole persisted state — the entry over
    // the cap is present, the tombstones are not trimmed at read time
    const stored = storage.getKitchenDoc('u1')!;
    expect(stored.stock && Object.keys(stored.stock).length).toBe(2302);
    expect(repo.loadStock()[presenceEntryId('fridge', 'i300')]).toBeDefined();
    expect(repo.loadFridge().length).toBe(301);
  });

  it('keeps the bounded admission on the server-adoption path (mergeStock still refuses over-caps data)', () => {
    fakeLocalStorage();
    const { repo } = makeRepo();
    const over: StockSection = {};
    for (let i = 0; i < 301; i++) {
      const id = presenceEntryId('fridge', `r${i}`);
      over[id] = activeEnvelope(
        { id, ingredient_id: `r${i}`, location: 'fridge', origin: 'manual', added_at: '2026-01-01T10:00:00Z' },
        version(100 + i, 'remote')
      );
    }
    repo.mergeStock(over);
    expect(repo.loadStock()).toEqual({}); // external data: the admission refusal still applies
  });

  it('archives the refused offline changes of a stale device outside the kitchen document (lot F1 D3, P1)', () => {
    fakeLocalStorage();
    const { repo, time } = makeRepo();
    const id = presenceEntryId('fridge', 'ing1');
    repo.saveStock({
      [id]: activeEnvelope(
        { id, ingredient_id: 'ing1', location: 'fridge', origin: 'manual', added_at: '2026-01-01T10:00:00Z' },
        version(100, 'remote')
      ),
    });
    const snapshot = { archivedAt: time.value + 5, sections: { stock: { value: repo.loadStock(), updatedAt: time.value } } };
    repo.ledger.archiveUnsyncedChanges(snapshot);
    // The archive lives OUTSIDE the kitchen document: a resetLocal wipe leaves it intact
    repo.resetLocal();
    expect(repo.ledger.unsyncedArchive()).toEqual(snapshot);
    expect(repo.ledger.unsyncedArchive()?.sections.stock).toBeDefined();
    // The user acknowledgment clears it explicitly (never automatic)
    repo.ledger.discardUnsyncedArchive();
    expect(repo.ledger.unsyncedArchive()).toBeNull();
  });
});
