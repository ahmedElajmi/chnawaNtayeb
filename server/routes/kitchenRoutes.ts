import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  ELEMENT_SET_LIMITS,
  EMPTY_ELEMENT_SET,
  PERMANENT_STOCK_CATEGORIES,
  RESERVED_SYNC_DEVICE,
  SET_SECTIONS,
  TOMBSTONE_RETENTION_MS,
  compareVersions,
  convertLegacyElementSet,
  mergeElementSets,
  mergeLegacyCandidates,
  mergeStockSections,
  parseElementSet,
  parseStockSection,
  parseTombstoneRetentionMs,
  projectStockToLegacy,
  purgeStockTombstones,
  purgeTombstones,
  readStockSection,
  validateStockEntry,
  withinStockCaps,
  wrapLegacyList,
  type ElementSet,
  type StockSection,
  type StockEnvelope,
  type StockValidationContext,
} from '../../src/core/kitchen';
import { BUILTIN_UNIT_OPTIONS, parseStoredUnitInfo, unitLookupKey } from '../../src/core/units';
import { parseStoredIngredient } from '../../src/core/catalog';
import type { DataStore, WriteOp } from '../storage/types';
import type { BackofficeAuthConfig } from '../backofficeAuth';
import { verifyUserSessionToken } from '../auth/sessions';

/**
 * Personal kitchen data of one account (favorites, fridge, pantry, weekly menu, shopping
 * list, food preferences, and since lot F1 the typed stock of entries): one document per
 * uid in the server-only `kitchen` collection.
 *
 * Guests never sync (their uid is ephemeral); clients and employees authenticate with
 * their session token. The write happens inside one transaction (`DataStore.transact`):
 * the merge runs over the stored state as it is at commit time, so two devices pushing at
 * once can never overwrite what they did not see. The three set sections (favorites, fridge,
 * pantry) merge element by element (@/core/kitchen): adds and deletions both travel through
 * per-element versions, and a deleted element never comes back from a device that still held
 * it. The tombstones (the `removed` entries) are dropped once older than the retention
 * window (`KITCHEN_TOMBSTONE_RETENTION_MS`, default 90 days, 0 = never purge) — a device
 * that has not synced within that window resets itself, so the purge stays safe.
 * The other sections keep newest-write-wins. One push = one read + one write, nothing more.
 *
 * The `stock` section (lot F1, E1-a validated) travels as canonical envelopes per entry id
 * (§ 4.2 of the execution dossier). At every PUT, inside the transaction: the legacy
 * fridge/pantry cards are merged and CONVERTED into stock candidates by the shared core
 * function (deterministic ids, echoes of the projection ignored), the candidates merge into
 * the stock by HLC version (a bare legacy add never impoverishes a stored enriched entry),
 * the new or modified envelopes are validated against the live registries (units,
 * ingredients — cached 60 s, re-read without cache once before any refusal), and the stock
 * is finally PROJECTED back onto the legacy cards so an old client keeps seeing every
 * modification of the migrated ones. The reserved device id `server` inside a pushed stock
 * section is refused (400): it belongs to the projection alone.
 *
 * The same session rules guard the archived grocery-run snapshots (`kitchen_history`
 * collection, one document per uid + entry id, capped per uid).
 */

const KITCHEN = 'kitchen';
const KITCHEN_HISTORY = 'kitchen_history';
const KITCHEN_HISTORY_INDEX = 'kitchen_history_index';

/** Sections are capped so no account can grow an unbounded document. The set-section caps
 * come from the shared core limits (`added` is the visible list cap). */
const MAX = {
  sets: ELEMENT_SET_LIMITS.added,
  grocery: 500,
  planDays: 14,
  lists: 20,
  listName: 80,
  listId: 100,
  note: 300,
} as const;

/** The stock section's own bounds live in the shared core (STOCK_LIMITS): the route applies
 *  them through the same validators, it never invents a second set of caps. */

/**
 * Archived grocery-run snapshots: capped per account so no one can grow an unbounded
 * collection; the entry size itself stays bounded through the item count and the
 * comment / number field caps.
 */
const HISTORY = { entries: 50, items: 500, id: 100, comment: 300 } as const;

export interface KitchenSectionPayload {
  value: unknown;
  updated_at: number;
}

const asPlan = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.planDays && raw.every((d) => d && typeof d === 'object') ? raw : null;

const asGrocery = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.grocery && raw.every((i) => i && typeof i === 'object') ? raw : null;

const asPreferences = (raw: unknown): Record<string, unknown> | null =>
  raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;

/** Grocery metadata (legacy section, kept for one transition release): a free note and an
 *  optional spent amount (null = nothing spent yet). */
const asGroceryMeta = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const meta = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (meta.note !== undefined) {
    if (typeof meta.note !== 'string' || meta.note.length > MAX.note) return null;
    out.note = meta.note;
  }
  if (meta.spent_tnd !== undefined) {
    if (meta.spent_tnd !== null && (typeof meta.spent_tnd !== 'number' || !Number.isFinite(meta.spent_tnd))) {
      return null;
    }
    out.spent_tnd = meta.spent_tnd;
  }
  return out;
};

/**
 * The named shopping lists of the account, with the active one. Each list is capped like a
 * whole legacy list (500 items), its name is a trimmed non-empty string of at most 80
 * characters, its note is capped like the legacy groceryMeta note, and its spend is a finite
 * number or null. `activeId` must reference one of the lists.
 */
const asGroceryLists = (raw: unknown): { lists: Record<string, unknown>[]; activeId: string } | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const payload = raw as Record<string, unknown>;
  if (!Array.isArray(payload.lists) || payload.lists.length === 0 || payload.lists.length > MAX.lists) return null;
  const lists: Record<string, unknown>[] = [];
  for (const entry of payload.lists) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const list = entry as Record<string, unknown>;
    if (typeof list.id !== 'string' || list.id.length === 0 || list.id.length > MAX.listId) return null;
    if (typeof list.name !== 'string' || list.name.trim() === '' || list.name.trim().length > MAX.listName) {
      return null;
    }
    const items = asGrocery(list.items);
    if (items === null) return null;
    const validated: Record<string, unknown> = { id: list.id, name: list.name.trim(), items };
    if (list.note !== undefined) {
      if (typeof list.note !== 'string' || list.note.length > MAX.note) return null;
      validated.note = list.note;
    }
    if (list.spent_tnd !== undefined) {
      if (list.spent_tnd !== null && (typeof list.spent_tnd !== 'number' || !Number.isFinite(list.spent_tnd))) {
        return null;
      }
      validated.spent_tnd = list.spent_tnd;
    }
    lists.push(validated);
  }
  if (typeof payload.activeId !== 'string' || !lists.some((list) => list.id === payload.activeId)) return null;
  return { lists, activeId: payload.activeId };
};

/** The reserved server device id inside a PUSHED stock section is a violation of the server
 *  namespace (§ 7.5): no legitimate client can produce it (device ids always contain a dash)
 *  and a forged one gets a 400 without any write. In the legacy sections the same id is an
 *  echo of the projection — ignored at the conversion, never a business operation. */
function stockUsesReservedDevice(stock: StockSection): boolean {
  return Object.values(stock).some(
    (envelope) =>
      envelope.version.device === RESERVED_SYNC_DEVICE ||
      (envelope.removed && envelope.removed.device === RESERVED_SYNC_DEVICE)
  );
}

/** Validates one section the client sent; null when malformed (refused, never stored). */
function readSection(name: string, raw: unknown): KitchenSectionPayload | null {
  const section = raw as { value?: unknown; updated_at?: unknown } | null;
  if (!section || typeof section !== 'object') return null;
  const updatedAt = section.updated_at;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt <= 0) return null;
  const value = section.value;
  let validated: unknown;
  switch (name) {
    case 'favorites':
    case 'fridge':
    case 'pantry':
      // The set sections travel as element sets (added/removed versions per id); the plain
      // id lists written before that shape existed are wrapped on the fly (migration).
      validated = Array.isArray(value) ? wrapLegacyList(value, updatedAt) : parseElementSet(value);
      break;
    case 'stock':
      // Strict push validation (§ 4.2.4): every envelope must be valid and the caps must
      // hold — one invalid envelope refuses the whole push, nothing is partially applied.
      // The reserved device guard is the route's (§ 7.5.3), applied by the PUT handler.
      validated = readStockSection(value);
      break;
    case 'weeklyPlan':
      validated = asPlan(value);
      break;
    case 'groceryList':
      // Legacy single list, accepted for one transition release (ignored by the current client)
      validated = asGrocery(value);
      break;
    case 'groceryLists':
      validated = asGroceryLists(value);
      break;
    case 'preferences':
      validated = asPreferences(value);
      break;
    case 'groceryMeta':
      // Legacy metadata of the single list, accepted for one transition release
      validated = asGroceryMeta(value);
      break;
    default:
      return null;
  }
  if (validated === null || validated === undefined) return null;
  return { value: validated, updated_at: updatedAt };
}

/** The outcome of the stock-aware merge: ok with the next sections, or a refusal reason
 *  (non-destructive — the caller answers 400 and nothing was written). */
type SectionMergeResult =
  { ok: true; sections: Record<string, KitchenSectionPayload> } | { ok: false; reason: string; detail?: string };

/** Registry snapshot handed to the shared validation (§ 4.5): the core owns the rules, the
 *  server owns the registries (units of the registry + the built-in ones, ingredient
 *  categories read by id). Values: category string, null = known absent, undefined = not
 *  fetched yet (a cache miss resolved by the outer re-read, never a silent acceptance). */
interface RegistrySnapshot {
  units: ReadonlySet<string>;
  ingredients: Map<string, string | null>;
}

const makeValidationContext = (snapshot: RegistrySnapshot): StockValidationContext => ({
  isKnownUnit: (unit) => snapshot.units.has(unitLookupKey(unit)),
  permanentCategories: new Set(PERMANENT_STOCK_CATEGORIES),
  getIngredient: (id) => {
    const category = snapshot.ingredients.get(id);
    return category ? { id, category } : null;
  },
});

/** True when the envelope is unchanged against the stored one (already validated when
 *  written): the registry rules are re-checked only on new or modified envelopes, so an
 *  old client re-pushing its whole card never re-triggers catalog reads for nothing. */
const envelopeUnchanged = (stored: StockEnvelope | undefined, envelope: StockEnvelope): boolean => {
  if (!stored || stored.state !== envelope.state) return false;
  if (compareVersions(stored.version, envelope.version) !== 0) return false;
  const storedEntry = stored.state === 'active' ? stored.entry : null;
  const pushedEntry = envelope.state === 'active' ? envelope.entry : null;
  return JSON.stringify(storedEntry) === JSON.stringify(pushedEntry);
};

/**
 * Per-section merge inside the transaction, extended to the `stock` section (lot F1 § 7.1,
 * E1-a): the stored and pushed legacy cards are merged first, converted into stock
 * candidates by the shared core function (one deterministic envelope per ingredient id,
 * echoes of the projection ignored), the candidates are merged into the stock by HLC
 * version with the bare-presence protection, the new or modified envelopes are validated
 * against the registry snapshot, the tombstones are purged, and the stock is finally
 * PROJECTED back onto the legacy cards — an old device keeps seeing every modification of
 * the migrated ones (§ 7.4). Without any stock, the legacy sections merge like today.
 *
 * Pure: the registry snapshot is preloaded outside, the clock is passed in — a contended
 * backend can re-run the operation over the fresh state reproducibly.
 */
function mergeSections(
  stored: Record<string, KitchenSectionPayload> | undefined,
  incoming: Record<string, KitchenSectionPayload>,
  retentionMs: number,
  now: number,
  snapshot: RegistrySnapshot
): SectionMergeResult {
  const merged: Record<string, KitchenSectionPayload> = { ...stored };
  const legacyLocations = ['fridge', 'pantry'] as const;

  // 1. The legacy cards merge element by element (stored ⊕ incoming), like today.
  const legacySets: Partial<Record<'fridge' | 'pantry', ElementSet>> = {};
  for (const location of legacyLocations) {
    const storedSection = merged[location];
    const storedSet = storedSection ? readStoredSet(storedSection.value, storedSection.updated_at) : EMPTY_ELEMENT_SET;
    const incomingSection = incoming[location];
    const incomingSet = incomingSection ? (incomingSection.value as ElementSet) : EMPTY_ELEMENT_SET;
    legacySets[location] = mergeElementSets(storedSet, incomingSet);
  }

  // 2. Conversion legacy → stock candidates (echoes recognized and ignored, § 7.1).
  const candidates: StockSection = {};
  for (const location of legacyLocations) {
    Object.assign(candidates, convertLegacyElementSet(legacySets[location]!, location));
  }

  // 3. The stock merges: stored ⊕ incoming, then the legacy candidates (bare-presence
  //    protection inside), then the tombstone purge (§ 4.2.3).
  const storedStock = stored?.stock ? (parseStockSection(stored.stock.value) ?? {}) : {};
  const incomingStock = incoming.stock ? (incoming.stock.value as StockSection) : {};
  let stock = mergeStockSections(storedStock, incomingStock);
  stock = mergeLegacyCandidates(stock, candidates);
  stock = purgeStockTombstones(stock, retentionMs, now);
  if (!withinStockCaps(stock)) return { ok: false, reason: 'stock-caps' };

  // 4. Registry validation (§ 4.5) of the new or modified envelopes only: the incoming
  //    stock envelopes and the candidates that would change something. An ACTIVE envelope
  //    failing a registry rule refuses the whole push (400, nothing written) — a candidate
  //    that would win a fusion is always validated BEFORE replacing a valid envelope.
  for (const source of [incomingStock, candidates]) {
    for (const [key, envelope] of Object.entries(source)) {
      if (envelopeUnchanged(storedStock[key], envelope)) continue;
      if (envelope.state !== 'active') continue; // a tombstone carries no business rule
      const check = validateStockEntry(envelope.entry, makeValidationContext(snapshot));
      if (!check.ok) return { ok: false, reason: check.error, detail: key };
    }
  }

  // 5. The other sections merge like before: element by element for favorites,
  //    newest-write-wins for the rest. fridge/pantry are handled below (absorbed or
  //    re-projected from the stock).
  for (const [name, section] of Object.entries(incoming)) {
    if (name === 'stock' || (legacyLocations as readonly string[]).includes(name)) continue;
    const current = merged[name];
    if ((SET_SECTIONS as readonly string[]).includes(name)) {
      const storedSet = current ? readStoredSet(current.value, current.updated_at) : EMPTY_ELEMENT_SET;
      merged[name] = {
        value: purgeTombstones(mergeElementSets(storedSet, section.value as ElementSet), retentionMs, now),
        updated_at: Math.max(current?.updated_at ?? 0, section.updated_at),
      };
    } else if (!current || section.updated_at > (current.updated_at ?? 0)) {
      merged[name] = section;
    }
  }

  // 6. The legacy sections: with a stock, the server REGENERATES them from the current
  //    stock (§ 7.4) — the aggregated projection keeps an old device up to date and the
  //    rollback A meaningful. Without any stock, the merged legacy cards are stored as
  //    before (identical behavior to the pre-F1 server). The stock section itself is
  //    stored whenever it holds something or the push carried one.
  const hasStock = Object.keys(stock).length > 0;
  if (hasStock || incoming.stock || stored?.stock) {
    // The stock section is (re)written whenever it holds something, the push carried one,
    // or one is stored: a purge that empties it must be reflected, never left stale.
    merged.stock = {
      value: stock,
      updated_at: Math.max(stored?.stock?.updated_at ?? 0, incoming.stock?.updated_at ?? 0),
    };
  }
  for (const location of legacyLocations) {
    if (hasStock) {
      const current = merged[location];
      merged[location] = {
        value: projectStockToLegacy(stock, location),
        updated_at: Math.max(
          current?.updated_at ?? 0,
          incoming[location]?.updated_at ?? 0,
          incoming.stock?.updated_at ?? 0
        ),
      };
    } else if (incoming[location]) {
      const current = merged[location];
      merged[location] = {
        value: legacySets[location]!,
        updated_at: Math.max(current?.updated_at ?? 0, incoming[location]!.updated_at),
      };
    }
  }
  return { ok: true, sections: merged };
}

/** A stored set section read back: element set through the core parser, legacy list wrapped. */
function readStoredSet(value: unknown, updatedAt: number): ElementSet {
  const parsed = Array.isArray(value) ? wrapLegacyList(value, updatedAt) : parseElementSet(value);
  return parsed ?? EMPTY_ELEMENT_SET;
}

/** ISO 8601 shapes the client actually sends (date + time, optional fraction and zone). */
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const timestampOf = (archivedAt: string): number => {
  const parsed = Date.parse(archivedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const archivedTimestamp = (doc: Record<string, unknown>): number => timestampOf(String(doc.archived_at ?? ''));

/**
 * Validates one archived grocery-run entry; null when malformed (refused, never stored).
 * The known fields are capped, everything else the client stored stays untouched.
 */
function readHistoryEntry(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entry = raw as Record<string, unknown>;
  if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > HISTORY.id) return null;
  if (
    typeof entry.archived_at !== 'string' ||
    !ISO_LIKE.test(entry.archived_at) ||
    Number.isNaN(Date.parse(entry.archived_at))
  ) {
    return null;
  }
  if (!Array.isArray(entry.items) || entry.items.length > HISTORY.items) return null;
  if (!entry.items.every((item) => item && typeof item === 'object' && !Array.isArray(item))) return null;
  if (entry.comment !== undefined && (typeof entry.comment !== 'string' || entry.comment.length > HISTORY.comment)) {
    return null;
  }
  for (const field of ['planned_cost_min', 'planned_cost_max', 'spent_tnd']) {
    const value = entry[field];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  }
  return { ...entry };
}

/** One entry of the per-account index: the id and the date it was archived (the eviction key). */
interface HistoryIndexEntry {
  id: string;
  archived_at: string;
}

/** The deterministic eviction order: archived_at first, then the id (an exact tie must not
 * depend on the arrival order). The index is stored oldest first. */
const olderFirst = (a: HistoryIndexEntry, b: HistoryIndexEntry): number => {
  const byDate = timestampOf(a.archived_at) - timestampOf(b.archived_at);
  if (byDate !== 0) return byDate;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/**
 * Reads the per-account index written by this route only. Null when absent or unreadable:
 * the caller rebuilds it from the stored entries instead of trusting a malformed one. The
 * index carries no authorization — the session check and the entry documents stay the guards.
 */
function readHistoryIndex(raw: unknown): { seq: number; entries: HistoryIndexEntry[] } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { seq?: unknown; entries?: unknown };
  if (typeof shape.seq !== 'number' || !Number.isInteger(shape.seq) || shape.seq < 0) return null;
  if (!Array.isArray(shape.entries) || shape.entries.length > HISTORY.entries) return null;
  const entries: HistoryIndexEntry[] = [];
  const seen = new Set<string>();
  for (const item of shape.entries) {
    const e = item as { id?: unknown; archived_at?: unknown };
    if (typeof e.id !== 'string' || e.id.length === 0 || e.id.length > HISTORY.id) return null;
    if (typeof e.archived_at !== 'string' || !ISO_LIKE.test(e.archived_at) || Number.isNaN(Date.parse(e.archived_at))) {
      return null;
    }
    if (seen.has(e.id)) return null;
    seen.add(e.id);
    entries.push({ id: e.id, archived_at: e.archived_at });
  }
  return { seq: shape.seq, entries };
}

/** Drops the wrapper fields the storage layer adds so the client sees its entry back. */
function stripHistoryWrapper(doc: Record<string, unknown>): Record<string, unknown> {
  const entry = { ...doc };
  const entryId = typeof entry.entry_id === 'string' ? entry.entry_id : undefined;
  delete entry.uid;
  delete entry.entry_id;
  delete entry.id; // the storage id (`uid:entry_id`) must not shadow the entry's own id
  delete entry.revision;
  delete entry.deleted;
  if (entryId !== undefined) entry.id = entryId;
  return entry;
}

export function kitchenRoutes(
  adminConfig: BackofficeAuthConfig,
  store: DataStore | null,
  options: { syncLimit?: number } = {}
): express.Router {
  const router = express.Router();

  // Legitimate sync stays far below this ceiling (a debounced push every couple of seconds
  // at the very worst); it only stops an abusive client from burning database reads.
  const syncLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: options.syncLimit ?? 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  /** Tombstone retention (ms), from the environment or the 90-day default; 0 = never purge. */
  const parsedRetention = parseTombstoneRetentionMs(process.env.KITCHEN_TOMBSTONE_RETENTION_MS);
  if (process.env.KITCHEN_TOMBSTONE_RETENTION_MS && parsedRetention === null) {
    console.warn(
      `Ignoring invalid KITCHEN_TOMBSTONE_RETENTION_MS (${process.env.KITCHEN_TOMBSTONE_RETENTION_MS}); using the 90-day default`
    );
  }
  const retentionMs = parsedRetention ?? TOMBSTONE_RETENTION_MS;

  const sessionOf = (req: express.Request) => {
    const header = req.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!adminConfig.ok || !token) return null;
    const session = verifyUserSessionToken(token, adminConfig.secret);
    // Guests keep their kitchen on the device: their uid is ephemeral, there is nothing to sync
    return session && (session.kind === 'client' || session.kind === 'employee') ? session : null;
  };
  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });

  // ---- Registry cache (§ 4.5): the stock validation needs the live registries, read with a
  // short TTL (60 s, confirmed by measure § 10) and ALWAYS re-read without cache once before
  // a reference refusal — a unit or an ingredient created less than a TTL ago is never
  // rejected by mistake (the residual window of an accepted-then-deleted reference is
  // documented and harmless: the stock references the id, never the data).
  const REGISTRY_TTL_MS = 60_000;

  let unitsCache: { at: number; units: Set<string> } | null = null;
  const loadUnits = async (bypassCache: boolean): Promise<ReadonlySet<string>> => {
    if (!bypassCache && unitsCache && Date.now() - unitsCache.at < REGISTRY_TTL_MS) return unitsCache.units;
    const units = new Set(BUILTIN_UNIT_OPTIONS.map((option) => unitLookupKey(option.label)));
    const page = await store!.page('units', { where: null, prefix: null, after: null, limit: 300 });
    for (const doc of page.items) {
      const info = parseStoredUnitInfo(doc);
      if (info) {
        units.add(unitLookupKey(info.label));
        units.add(unitLookupKey(info.id));
      }
    }
    unitsCache = { at: Date.now(), units };
    return units;
  };

  let ingredientsCache: { at: number; byId: Map<string, string | null> } = { at: 0, byId: new Map() };
  const ingredientCategoryOf = async (id: string, bypassCache = false): Promise<string | null> => {
    if (Date.now() - ingredientsCache.at >= REGISTRY_TTL_MS) ingredientsCache = { at: Date.now(), byId: new Map() };
    const cached = ingredientsCache.byId.get(id);
    if (cached !== undefined && !bypassCache) return cached;
    const doc = await store!.get('ingredients', id);
    const ingredient = doc && doc.deleted !== true ? parseStoredIngredient(doc) : null;
    const category = ingredient ? ingredient.category : null;
    ingredientsCache.byId.set(id, category);
    return category;
  };

  router.get('/api/kitchen', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const doc = await store.get(KITCHEN, session.sub);
    return res.json({ ok: true, doc: doc && doc.deleted !== true ? doc : null });
  });

  router.put('/api/kitchen', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.sections || typeof body.sections !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid-input' });
    }
    const incoming: Record<string, KitchenSectionPayload> = {};
    for (const [name, raw] of Object.entries(body.sections as Record<string, unknown>)) {
      const section = readSection(name, raw);
      if (!section) return res.status(400).json({ ok: false, error: 'invalid-input' });
      // Route-level guard (§ 7.5.3): the reserved server device id inside a pushed stock
      // section is a namespace violation — 400 without any write, non-destructive.
      if (name === 'stock' && stockUsesReservedDevice(section.value as StockSection)) {
        return res.status(400).json({ ok: false, error: 'invalid-input', reason: 'reserved-device' });
      }
      incoming[name] = section;
    }
    // The read-merge-write is one transaction: a concurrent push can never be overwritten by
    // a merge computed from a state it had not seen (the operation is pure, a contended
    // backend re-runs it over the fresh state). `now` is computed once: the re-runs of the
    // operation (a contended backend) must stay reproducible.
    const now = Date.now();
    const updatedAt = new Date().toISOString();

    // Preload the registry snapshot for every ingredient id the merge may validate: the
    // incoming stock envelopes and the legacy candidates of the pre-read state (a raced
    // write adding an unseen id is resolved by the cache-less re-read below, § 4.5).
    const ingredientIds = new Set<string>();
    const incomingStock = incoming.stock ? (incoming.stock.value as StockSection) : undefined;
    if (incomingStock) {
      for (const envelope of Object.values(incomingStock)) {
        if (envelope.state === 'active') ingredientIds.add(envelope.entry.ingredient_id);
      }
    }
    const preDoc = await store.get(KITCHEN, session.sub);
    const preSections =
      preDoc && preDoc.deleted !== true ? (preDoc.sections as Record<string, KitchenSectionPayload>) : undefined;
    for (const location of ['fridge', 'pantry'] as const) {
      const storedSection = preSections?.[location];
      const storedSet = storedSection
        ? readStoredSet(storedSection.value, storedSection.updated_at)
        : EMPTY_ELEMENT_SET;
      const incomingSet = incoming[location] ? (incoming[location].value as ElementSet) : EMPTY_ELEMENT_SET;
      const mergedLegacy = mergeElementSets(storedSet, incomingSet);
      for (const id of [...Object.keys(mergedLegacy.added), ...Object.keys(mergedLegacy.removed)]) {
        ingredientIds.add(id);
      }
    }
    const ingredients = new Map<string, string | null>();
    for (const id of ingredientIds) ingredients.set(id, await ingredientCategoryOf(id));

    // Two attempts at most: on a reference failure the server re-reads the failing
    // registry data WITHOUT cache once, then retries; a persistent refusal answers 400
    // without any write (non-destructive, § 4.5).
    let failure: { reason: string; detail?: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const units = await loadUnits(attempt > 0);
      const snapshot: RegistrySnapshot = { units, ingredients };
      const result = await store.transact(KITCHEN, session.sub, (current) => {
        const storedSections = current ? (current.sections as Record<string, KitchenSectionPayload>) : undefined;
        const merged = mergeSections(storedSections, incoming, retentionMs, now, snapshot);
        return {
          next: merged.ok ? { uid: session.sub, sections: merged.sections, updated_at: updatedAt } : (current ?? null),
          result: merged,
        };
      });
      if (result.ok) {
        return res.json({ ok: true, doc: { uid: session.sub, sections: result.sections } });
      }
      failure = result;
      const retryable = ['unknown-ingredient', 'unknown-unit', 'permanent-category'];
      if (!retryable.includes(result.reason)) break;
      // A reference failure may come from a stale registry cache: re-read the failing
      // references without cache, then retry once (§ 4.5). A still-unknown reference is
      // refused on the second attempt (the re-read already happened).
      if (result.reason === 'unknown-unit') await loadUnits(true);
      else {
        const key = result.detail ?? '';
        const envelope = incomingStock?.[key];
        const id =
          envelope && envelope.state === 'active'
            ? envelope.entry.ingredient_id
            : key.replace(/^st_(fridge|pantry)_/, '');
        if (!id) break;
        const category = await ingredientCategoryOf(id, true);
        if (category === null && !ingredients.has(id)) break; // genuinely unknown: refuse
        ingredients.set(id, category);
      }
    }
    return res.status(400).json({
      ok: false,
      error: 'invalid-input',
      reason: failure?.reason,
      ...(failure?.detail ? { detail: failure.detail } : {}),
    });
  });

  // Archived grocery-run snapshots: one document per uid + entry id, at most HISTORY.entries
  // per account. The per-account index (seq + entry ids and dates, oldest first) is updated in
  // the SAME commit as the entry writes, under the `seq` guard: the read-merge-write is atomic,
  // the cap is exact, and the eviction of the oldest entry (by archived_at, then id) can never
  // drift apart from the index. A contended commit (a concurrent archive) is retried from the
  // fresh index — the operations are rebuilt every attempt, never replayed as-is.
  const historyAttemptLimit = 4;

  /** Reads the account's index, rebuilding it from the stored entries when absent (a legacy
   * account) or unreadable: deterministic (archived_at then id), the HISTORY.entries newest kept
   * and the surplus evicted in the same commit. Guard expectation: null for a fresh index. */
  const historyIndexFor = async (
    uid: string
  ): Promise<{ expected: number | null; seq: number; entries: HistoryIndexEntry[]; surplus: string[] }> => {
    const index = readHistoryIndex(await store!.get(KITCHEN_HISTORY_INDEX, uid));
    if (index) return { expected: index.seq, seq: index.seq, entries: index.entries, surplus: [] };
    const docs = await store!.findWhere(KITCHEN_HISTORY, 'uid', uid, HISTORY.entries * 2);
    const all = docs
      .filter((d) => d.deleted !== true && typeof d.entry_id === 'string')
      .map((d) => ({ id: d.entry_id as string, archived_at: String(d.archived_at ?? '') }))
      .filter((e) => ISO_LIKE.test(e.archived_at) && !Number.isNaN(Date.parse(e.archived_at)))
      .map((e) => ({ id: String(e.id), archived_at: e.archived_at }))
      .sort(olderFirst); // oldest first
    const surplus = all.slice(0, Math.max(0, all.length - HISTORY.entries)).map((e) => e.id);
    return { expected: null, seq: 0, entries: all.slice(Math.max(0, all.length - HISTORY.entries)), surplus };
  };

  router.post('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const entry = readHistoryEntry(body.entry);
    if (!entry) return res.status(400).json({ ok: false, error: 'invalid-input' });
    const storageId = `${session.sub}:${entry.id}`;
    for (let attempt = 0; ; attempt++) {
      const { expected, seq, entries, surplus } = await historyIndexFor(session.sub);
      // Re-archiving the same id replaces the entry in place: no duplicate, no eviction
      // (a retry HTTP or a double click converges to the same state).
      const sameId = entries.some((e) => e.id === entry.id);
      const next = [
        ...entries.filter((e) => e.id !== entry.id),
        { id: String(entry.id), archived_at: String(entry.archived_at) },
      ].sort(olderFirst);
      const ops: WriteOp[] = [
        { name: KITCHEN_HISTORY, id: storageId, doc: { uid: session.sub, entry_id: entry.id, ...entry } },
      ];
      if (!sameId && next.length > HISTORY.entries) {
        // The oldest entry (deterministic order) leaves: its deletion marker is part of the
        // same commit as the new entry and the index update — nothing can drift apart.
        const evicted = next.shift()!;
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${evicted.id}`, doc: { deleted: true } });
      }
      for (const id of surplus) {
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${id}`, doc: { deleted: true } });
      }
      ops.push({
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        doc: { uid: session.sub, seq: seq + 1, entries: next },
      });
      const result = await store.commit(ops, {
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        field: 'seq',
        expected,
      });
      if (result.ok) return res.json({ ok: true });
      // Another archive committed first: re-read the index and rebuild everything
      if (attempt + 1 >= historyAttemptLimit) return unavailable(res);
      await new Promise((resolve) => setTimeout(resolve, 80 * 2 ** attempt + Math.floor(Math.random() * 80)));
    }
  });

  router.get('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    // The per-account index travels in the same query (no entry_id): one extra slot, filtered
    const docs = await store.findWhere(KITCHEN_HISTORY, 'uid', session.sub, HISTORY.entries + 1);
    const entries = docs
      .filter((d) => d.deleted !== true && typeof d.entry_id === 'string')
      .sort((a, b) => archivedTimestamp(b) - archivedTimestamp(a))
      .map(stripHistoryWrapper);
    return res.json({ ok: true, entries });
  });

  router.delete('/api/kitchen/history/:id', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const id = req.params.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > HISTORY.id) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    const storageId = `${session.sub}:${id}`;
    const doc = await store.get(KITCHEN_HISTORY, storageId);
    if (!doc || doc.deleted === true || doc.uid !== session.sub || doc.entry_id !== id) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    for (let attempt = 0; ; attempt++) {
      const { expected, seq, entries, surplus } = await historyIndexFor(session.sub);
      const ops: WriteOp[] = [{ name: KITCHEN_HISTORY, id: storageId, doc: { deleted: true } }];
      for (const evicted of surplus) {
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${evicted}`, doc: { deleted: true } });
      }
      ops.push({
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        doc: { uid: session.sub, seq: seq + 1, entries: entries.filter((e) => e.id !== id) },
      });
      const result = await store.commit(ops, {
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        field: 'seq',
        expected,
      });
      if (result.ok) return res.json({ ok: true });
      if (attempt + 1 >= historyAttemptLimit) return unavailable(res);
      await new Promise((resolve) => setTimeout(resolve, 80 * 2 ** attempt + Math.floor(Math.random() * 80)));
    }
  });

  return router;
}
