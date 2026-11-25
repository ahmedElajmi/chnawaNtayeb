/**
 * Stock entries (lot F1): one typed business model of what the fridge and the pantry
 * contain — presence first, quantity when it is known. `StockEntry` is the business model
 * only: it knows neither storage nor synchronization (the HLC versions travel in the
 * `StockEnvelope` wrapper types below, a separate contract; the architecture guard keeps
 * both apart). See the F1 functional dossier § 4 and the execution dossier § 4–7.
 *
 * The canonical envelope union (§ 4.2 of the execution dossier) removes every ambiguity of
 * the older card shape: each entry id maps to ONE envelope whose state is decided by the
 * HLC comparison (`version` vs `removed`), never by the declared `state` field alone.
 */

import {
  ELEMENT_SET_LIMITS,
  RESERVED_SYNC_DEVICE,
  compareVersions,
  type ElementSet,
  type ElementVersion,
} from './elementSets';
import { withoutUndefined } from '../shared';

/** The two functional views of the app (B-F1-1 ✅): same model, distinct views. */
export type StockLocation = 'fridge' | 'pantry';
export const STOCK_LOCATIONS: readonly StockLocation[] = ['fridge', 'pantry'];

export type StockEntryOrigin = 'manual' | 'photo' | 'import';
export const STOCK_ORIGINS: readonly StockEntryOrigin[] = ['manual', 'photo', 'import'];

/**
 * One stock entry: either a physical item or lot, or a qualitative marker of habitual
 * presence (`permanent`). Absent optional fields mean "not known" — never zero, unlimited
 * or sufficient. No reservation field (B-F1-6 ✅); no HLC/sync field (§ 4 bis).
 */
export interface StockEntry {
  /** Stable, unique among the entries of one stock, immutable (§ 4.4). */
  id: string;
  /** Reference to the catalog's technical ingredient id (never a name or a mutable code). */
  ingredient_id: string;
  /** Where the item physically lives; the two functional views stay distinct. */
  location: StockLocation;
  /** Absent = presence only (« j'en possède ») — NEVER zero, unlimited or sufficient. */
  quantity?: number;
  /** Required together with `quantity`; stable reference to the unit registry. */
  unit?: string;
  /** ISO 8601 calendar date (day precision); its effects (DLC/DDM) are rules of F2. */
  expires_at?: string;
  /** Required together with `expires_at`. */
  expiry_type?: 'DLC' | 'DDM';
  /** Habitual presence marker; allowed only for the E6 categories. */
  permanent?: boolean;
  /** « je n'en ai plus » → present = temporarily exhausted; absent = active
   *  (reactivation = removing the date). Calendar date, E2 (validated 19/11/2026). */
  exhausted_at?: string;
  /** Required: the photo proposes, the user confirms. */
  origin: StockEntryOrigin;
  note?: string;
  /** ISO 8601 instant, set at creation. */
  added_at: string;
}

/** Minimal reference kept on a tombstone (§ 4.2.1 bis): identity of the deleted entry and
 *  its ingredient attachment — enough for the legacy projection aggregation. The business
 *  rules of `StockEntry` NEVER apply to a stub: it is never displayed, counted or exported
 *  as content, and `ingredient_id` is never checked against the catalog (a tombstone may
 *  reference an ingredient deleted from the catalog afterwards — rejecting it would destroy
 *  the tombstone and open a resurrection). */
export interface StockTombstoneStub {
  /** The deleted entry's id — always equal to the envelope key. */
  id: string;
  /** The ingredient the entry was attached to (projection aggregation key). */
  ingredient_id: string;
  /** Which view the entry belonged to. */
  location: StockLocation;
}

/** One entry as it travels: a typed, non-ambiguous union of the two canonical states. The
 *  semantic authority remains the HLC comparison; a declared `state` contradicting it is
 *  INVALID (rejected by the parser, § 4.2.4). */
export type StockEnvelope =
  | {
      state: 'active';
      /** The full business entry (validated per § 4.5). */
      entry: StockEntry;
      /** HLC version of the last event on the entry. */
      version: ElementVersion;
      /** A superseded deletion, kept when the entry was re-created after deletion
       *  (`version > removed`). Absent = never deleted. */
      removed?: ElementVersion;
    }
  | {
      state: 'tombstoned';
      /** Reference stub only — business data is gone (§ 4.2.1 bis). Absent only in the
       *  defensive legacy case of § 4.2.4 (no stub, non-decodable id): the tombstone still
       *  prevents the resurrection of its id but is excluded from the projection
       *  attribution (signalled anomaly). Nothing the conversion or a deletion produces. */
      stub?: StockTombstoneStub;
      /** HLC version of the deletion. */
      version: ElementVersion;
      /** Canonical equality: identical to `version` (ElementSet rule: exact tie = deleted). */
      removed: ElementVersion;
    };

/** The `stock` section: one envelope per entry id (unique per stock). */
export type StockSection = Record<string, StockEnvelope>;

/** A resolved ingredient reference handed in by the validation context. */
export interface IngredientRef {
  id: string;
  category: string;
}

/** The registry-dependent rules are passed in, never snapshotted in code (§ 4.5): the core
 *  owns the rules, the callers own the registries (one function shared by client and
 *  server, no static list to drift out of sync with the backoffice). */
export interface StockValidationContext {
  /** Is this unit known (labels normalized, case/space-insensitive)? */
  isKnownUnit: (unit: string) => boolean;
  /** Category ids allowed to carry `permanent: true` (§ 15-E6). */
  permanentCategories: ReadonlySet<string>;
  /** The ingredient with its category; null = the id is known to be absent. */
  getIngredient: (ingredientId: string) => IngredientRef | null;
}

/** Volume bounds — starting hypotheses of § 10, confirmed or adjusted by MEASURE during the
 *  lot (E4), never fixed without one. Exceeding a bound is an explicit refusal, never a
 *  silent truncation. */
export const STOCK_LIMITS = {
  /** Active entries per location (aligned with the legacy `added` cap). */
  entries: 300,
  /** Tombstones of the whole stock (aligned with the legacy `removed` cap). */
  tombstones: 2000,
  /** Characters of one entry id (§ 5: the worst escaped id stays under the common
   *  1 500-byte guarantee; real `ing_*` ids are never escaped). */
  id: 1000,
  /** Characters of `note` (same bound as the server's existing note cap). */
  note: 300,
  /** Characters of `unit`. */
  unit: 32,
  /** Upper bound of a finite, positive quantity (anti-abuse). */
  quantity: 1_000_000,
} as const;

/** Categories allowed to carry `permanent: true` (§ 15-E6, validated by the chef on
 *  19/11/2026): built-in category ids the backoffice may rename or move but NEVER delete,
 *  so the list stays durable without a registry mechanism. Extension = one line here. */
export const PERMANENT_STOCK_CATEGORIES: readonly string[] = ['spices_condiments', 'grains_pasta', 'canned_pantry'];

/* ------------------------------------------------------------------ */
/* Common identifier guarantees (CLAUDE.md § 8 bis, dossier § 4.4/§ 5)  */
/* ------------------------------------------------------------------ */

const RESERVED_ID = /^__.*__$/;
/** The shared guarantee: never `/`, never `.` or `..` alone, never the reserved
 *  `__…__` pattern, never empty. No other character restriction (e-mails, `guest:` ids,
 *  slugs and dotted ids stay legal). */
export function isLegalEntryId(id: string): boolean {
  if (id.length === 0) return false;
  if (id.includes('/')) return false;
  if (id === '.' || id === '..') return false;
  if (RESERVED_ID.test(id)) return false;
  return true;
}

/** UTF-8 byte length, computed from code points (pure TypeScript, no platform API): the
 *  1 500-byte common guarantee, checked without `TextEncoder` so the same code runs in the
 *  browser and on the server. */
export function utf8Length(id: string): number {
  let bytes = 0;
  for (const ch of id) {
    const code = ch.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/** The executed length bound (§ 5, v5): structural rule of an entry and of a stub. */
export function entryIdWithinBounds(id: string): boolean {
  return id.length <= STOCK_LIMITS.id && utf8Length(id) <= 1500;
}

/* ------------------------------------------------------------------ */
/* Deterministic presence-entry ids (§ 5) — injective over all Unicode  */
/* ------------------------------------------------------------------ */

const SAFE_TAIL = /^[A-Za-z0-9_-]+$/;
const ESCAPE_MARKER = '.';
const HEX_WIDTH = 6; // every code point (up to U+10FFFF) fits in 6 hex digits

/**
 * Deterministic presence-entry id: `st_<location>_<tail>`. Injective over ALL Unicode
 * strings — the two tail families are disjoint (raw tails never contain the escape marker
 * and never match the reserved pattern; escaped tails contain the marker or are reserved),
 * every code point escapes to a fixed-width 6-hex token, so distinct sources always give
 * distinct ids and `decode ∘ encode` is the identity. Empty sources are refused explicitly;
 * a result beyond the id bound is refused by `entryIdWithinBounds` at validation — never
 * truncated, never silently replaced.
 */
export function presenceEntryId(location: StockLocation, ingredientId: string): string {
  if (ingredientId.length === 0) {
    throw new Error('presenceEntryId: empty ingredient id');
  }
  const escape = (id: string): string => {
    let out = '';
    // CODE POINTS (`for...of`), and each WHOLE code point escapes: two astral characters
    // sharing a high surrogate (U+1F600 vs U+1F601) never produce the same token.
    for (const ch of id) {
      out += SAFE_TAIL.test(ch) ? ch : ESCAPE_MARKER + (ch.codePointAt(0) ?? 0).toString(16).padStart(HEX_WIDTH, '0');
    }
    return out;
  };
  const tail = SAFE_TAIL.test(ingredientId) && !RESERVED_ID.test(ingredientId) ? ingredientId : escape(ingredientId);
  return `st_${location}_${tail}`;
}

/** Round-trip decoder — contract: `decode(location, encode(location, id)) === id` for every
 *  source id. Not a validator: ids reaching this function were produced by
 *  `presenceEntryId`; the section parser validates ids independently. */
export function decodePresenceEntryId(location: StockLocation, entryId: string): string {
  const prefix = `st_${location}_`;
  if (!entryId.startsWith(prefix)) throw new Error('decodePresenceEntryId: wrong prefix');
  const tail = entryId.slice(prefix.length);
  let out = '';
  for (let i = 0; i < tail.length;) {
    if (tail[i] === ESCAPE_MARKER) {
      // Fixed-width token: the marker is always followed by exactly 6 hex digits.
      out += String.fromCodePoint(parseInt(tail.slice(i + 1, i + 1 + HEX_WIDTH), 16));
      i += 1 + HEX_WIDTH;
    } else {
      out += tail[i];
      i += 1;
    }
  }
  return out;
}

/** True when the id is a decodable deterministic presence id of this location. */
export function isDecodablePresenceEntryId(location: StockLocation, entryId: string): boolean {
  if (!entryId.startsWith(`st_${location}_`)) return false;
  const tail = entryId.slice(`st_${location}_`.length);
  for (let i = 0; i < tail.length; i++) {
    if (tail[i] === ESCAPE_MARKER) {
      const hex = tail.slice(i + 1, i + 1 + HEX_WIDTH);
      if (hex.length !== HEX_WIDTH || !/^[0-9a-f]{6}$/.test(hex)) return false;
      i += HEX_WIDTH;
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Dates (§ 4.5)                                                       */
/* ------------------------------------------------------------------ */

/** ISO 8601 calendar date, day precision (E2: no time, no timezone). The calendar check
 *  refuses rollovers (2026-02-30 is not a date, Date.parse alone would accept it). */
export const ISO_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isCalendarDate = (value: string): boolean => {
  if (!ISO_CALENDAR_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/** ISO 8601 instant the clients actually write (date + time, optional fraction and zone). */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const isIsoInstant = (value: string): boolean => ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));

/* ------------------------------------------------------------------ */
/* Structural entry rules (no registry) + registry rules (§ 4.5)        */
/* ------------------------------------------------------------------ */

/** Structural check of a business entry (every rule that needs no registry). Returns the
 *  error code when invalid, null when the entry passes. Executed by the parser (reads),
 *  by `validateStockEntry` (writes) and therefore by both the client and the server. */
export function checkStockEntryStructure(entry: StockEntry): string | null {
  if (typeof entry.id !== 'string' || !isLegalEntryId(entry.id) || !entryIdWithinBounds(entry.id)) return 'entry-id';
  if (
    typeof entry.ingredient_id !== 'string' ||
    entry.ingredient_id.length === 0 ||
    entry.ingredient_id.length > ELEMENT_SET_LIMITS.id
  ) {
    return 'ingredient-id';
  }
  if (entry.location !== 'fridge' && entry.location !== 'pantry') return 'location';
  if (!STOCK_ORIGINS.includes(entry.origin)) return 'origin';
  if (typeof entry.added_at !== 'string' || !isIsoInstant(entry.added_at)) return 'added-at';
  if (entry.quantity !== undefined) {
    if (typeof entry.quantity !== 'number' || !Number.isFinite(entry.quantity) || entry.quantity <= 0)
      return 'quantity';
    if (entry.quantity > STOCK_LIMITS.quantity) return 'quantity';
    if (typeof entry.unit !== 'string' || entry.unit.trim().length === 0 || entry.unit.length > STOCK_LIMITS.unit) {
      return 'unit';
    }
  } else if (entry.unit !== undefined) {
    return 'unit'; // unit without quantity is meaningless (they are required together)
  }
  if (entry.expires_at !== undefined) {
    if (typeof entry.expires_at !== 'string' || !isCalendarDate(entry.expires_at)) return 'expiry';
    if (entry.expiry_type !== 'DLC' && entry.expiry_type !== 'DDM') return 'expiry';
  } else if (entry.expiry_type !== undefined) {
    return 'expiry';
  }
  if (entry.permanent !== undefined && typeof entry.permanent !== 'boolean') return 'permanent';
  if (entry.permanent === true) {
    // A habitual stock carries neither quantity nor expiry (§ 4.2)
    if (entry.quantity !== undefined || entry.unit !== undefined) return 'permanent';
    if (entry.expires_at !== undefined || entry.expiry_type !== undefined) return 'permanent';
  }
  if (entry.exhausted_at !== undefined) {
    if (typeof entry.exhausted_at !== 'string' || !isCalendarDate(entry.exhausted_at)) return 'exhausted-at';
    if (entry.permanent !== true) return 'exhausted-at'; // exhausted_at ⇒ permanent
  }
  if (entry.note !== undefined) {
    if (typeof entry.note !== 'string' || entry.note.length > STOCK_LIMITS.note) return 'note';
  }
  return null;
}

/**
 * Every business rule of a stock entry (§ 4.5), written once and shared by the client
 * (live registries) and the server (cached registries, re-read without cache before a
 * refusal). Structural rules run on every envelope; registry rules (unit known, ingredient
 * exists, permanent category) apply to the new or modified envelopes of a push — the
 * already-stored ones were validated when written. Returns the normalized entry (no
 * `undefined` field ever travels: a cleared field is absent).
 */
export function validateStockEntry(entry: StockEntry, ctx: StockValidationContext): Checked<StockEntry> {
  const structural = checkStockEntryStructure(entry);
  if (structural) return { ok: false, error: structural };
  const ingredient = ctx.getIngredient(entry.ingredient_id);
  if (!ingredient) return { ok: false, error: 'unknown-ingredient' };
  if (entry.unit !== undefined && !ctx.isKnownUnit(entry.unit)) return { ok: false, error: 'unknown-unit' };
  if (entry.permanent === true && !ctx.permanentCategories.has(ingredient.category)) {
    return { ok: false, error: 'permanent-category' };
  }
  return { ok: true, value: withoutUndefined(entry) };
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

/** Structural validation of a tombstone stub (§ 4.2.1 bis) — structure ONLY: never the
 *  business rules of `StockEntry`, never a registry or a catalog reference (an ingredient
 *  deleted from the catalog between-whiles stays a legal stub reference). */
export function parseStockTombstoneStub(raw: unknown): StockTombstoneStub | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { id?: unknown; ingredient_id?: unknown; location?: unknown };
  if (typeof shape.id !== 'string' || !isLegalEntryId(shape.id) || !entryIdWithinBounds(shape.id)) return null;
  if (typeof shape.ingredient_id !== 'string' || shape.ingredient_id.length === 0) return null;
  if (shape.location !== 'fridge' && shape.location !== 'pantry') return null;
  // Extra business fields in a stub are ignored (tolerant parsing, § 4.2.4)
  return { id: shape.id, ingredient_id: shape.ingredient_id, location: shape.location };
}

/* ------------------------------------------------------------------ */
/* Canonical envelope state and parsing (§ 4.2, § 4.2.4)                */
/* ------------------------------------------------------------------ */

export type CanonicalState = 'active' | 'tombstoned' | 'invalid';

const parseEnvelopeVersion = (raw: unknown): ElementVersion | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { physical?: unknown; counter?: unknown; device?: unknown };
  if (typeof shape.physical !== 'number' || !Number.isFinite(shape.physical) || shape.physical <= 0) return null;
  if (typeof shape.counter !== 'number' || !Number.isInteger(shape.counter) || shape.counter < 0) return null;
  if (typeof shape.device !== 'string' || shape.device.length === 0) return null;
  return { physical: shape.physical, counter: shape.counter, device: shape.device };
};

const sameVersion = (a: ElementVersion, b: ElementVersion): boolean =>
  a.physical === b.physical && a.counter === b.counter && a.device === b.device;

/**
 * The canonical state of an envelope, ALWAYS decided by comparing `version` and `removed`
 * (the HLC comparison stays the semantic authority). `invalid` covers the impossible
 * shapes: no complete `entry` and no `stub`, a declared state contradicting the
 * comparison, a tombstone whose `removed` differs from `version`, or a malformed version.
 */
export function envelopeState(raw: unknown): CanonicalState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'invalid';
  const shape = raw as { state?: unknown; entry?: unknown; stub?: unknown; version?: unknown; removed?: unknown };
  const version = parseEnvelopeVersion(shape.version);
  if (!version) return 'invalid';
  const removed = shape.removed === undefined ? null : parseEnvelopeVersion(shape.removed);
  if (shape.removed !== undefined && !removed) return 'invalid';
  const hasEntry = shape.entry !== undefined && typeof shape.entry === 'object' && shape.entry !== null;
  const hasStub = shape.stub !== undefined;

  if (hasStub && !hasEntry) {
    // Canonical tombstone: `removed` required and identical to `version`
    if (!removed || !sameVersion(removed, version)) return 'invalid';
    if (shape.state !== undefined && shape.state !== 'tombstoned') return 'invalid';
    return 'tombstoned';
  }
  if (!hasEntry && !hasStub) {
    // A shape with no entry and no stub can only be a tombstone whose business data was
    // stripped: the canonical equality `removed == version` is required (the parser then
    // re-derives the stub from a decodable key, or keeps it defensively — § 4.2.4).
    if (!removed || !sameVersion(removed, version)) return 'invalid';
    if (shape.state !== undefined && shape.state !== 'tombstoned') return 'invalid';
    return 'tombstoned';
  }
  if (hasEntry && !hasStub) {
    if (!removed) {
      if (shape.state !== undefined && shape.state !== 'active') return 'invalid';
      return 'active';
    }
    // `entry` present with a `removed`: re-creation when version > removed,
    // otherwise the deletion won (the merge canonicalizes it to a stub tombstone)
    const comparison = compareVersions(version, removed);
    if (comparison > 0) {
      if (shape.state !== undefined && shape.state !== 'active') return 'invalid';
      return 'active';
    }
    if (shape.state !== undefined && shape.state !== 'tombstoned') return 'invalid';
    return 'tombstoned';
  }
  return 'invalid';
}

const parseEnvelopeEntry = (raw: unknown): StockEntry | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entry = raw as Record<string, unknown>;
  const present = (value: unknown): boolean => value !== undefined && value !== null;
  const candidate: StockEntry = {
    id: entry.id,
    ingredient_id: entry.ingredient_id,
    location: entry.location,
    origin: entry.origin,
    added_at: entry.added_at,
  } as StockEntry;
  if (present(entry.quantity)) candidate.quantity = entry.quantity as number;
  if (present(entry.unit)) candidate.unit = entry.unit as string;
  if (present(entry.expires_at)) candidate.expires_at = entry.expires_at as string;
  if (present(entry.expiry_type)) candidate.expiry_type = entry.expiry_type as 'DLC' | 'DDM';
  if (present(entry.permanent)) candidate.permanent = entry.permanent as boolean;
  if (present(entry.exhausted_at)) candidate.exhausted_at = entry.exhausted_at as string;
  if (present(entry.note)) candidate.note = entry.note as string;
  return checkStockEntryStructure(candidate) === null ? candidate : null;
};

/** Builds one canonical envelope from already-valid parts (never half-formed). */
export const activeEnvelope = (
  entry: StockEntry,
  version: ElementVersion,
  removed?: ElementVersion
): StockEnvelope => ({ state: 'active', entry, version, ...(removed ? { removed } : {}) });

export const tombstoneEnvelope = (stub: StockTombstoneStub, version: ElementVersion): StockEnvelope => ({
  state: 'tombstoned',
  stub,
  version,
  removed: version,
});

/** The ACTIVE bare-presence envelope of the deterministic key, at the given version:
 *  created by a toggle or a legacy conversion (no invented quantity; `added_at` = the
 *  version's own date). */
export const presenceEnvelope = (
  location: StockLocation,
  ingredientId: string,
  version: ElementVersion
): StockEnvelope =>
  activeEnvelope(
    {
      id: presenceEntryId(location, ingredientId),
      ingredient_id: ingredientId,
      location,
      origin: 'manual',
      added_at: isoFromPhysical(version.physical),
    },
    version
  );

const isoFromPhysical = (physical: number): string => new Date(physical).toISOString();

/** The canonical tombstone branch of the envelope union. */
export type StockTombstoneEnvelope = Extract<StockEnvelope, { state: 'tombstoned' }>;

/** The stub of a tombstone, derived when possible (§ 4.2.1 bis): the stub travels with the
 *  tombstone; when absent, a deterministic id (`st_<location>_<ingredient>`) is re-derived
 *  EXACTLY from the key — nothing invented, the key IS the data. Returns null for the
 *  defensive case (no stub, non-decodable id): the tombstone stays valid but is excluded
 *  from the projection attribution (signalled anomaly). */
export function stubOfTombstone(envelope: StockTombstoneEnvelope, key: string): StockTombstoneStub | null {
  if (envelope.stub) return envelope.stub;
  for (const location of STOCK_LOCATIONS) {
    if (isDecodablePresenceEntryId(location, key)) {
      return { id: key, ingredient_id: decodePresenceEntryId(location, key), location };
    }
  }
  return null;
}

function parseStockEnvelope(key: string, raw: unknown): StockEnvelope | null {
  const state = envelopeState(raw);
  if (state === 'invalid') return null;
  const shape = raw as { entry?: unknown; stub?: unknown; version?: unknown; removed?: unknown };
  const version = parseEnvelopeVersion(shape.version) as ElementVersion;
  if (state === 'active') {
    const entry = parseEnvelopeEntry(shape.entry);
    // Identity invariant (post-validation guarantee): the entry's id IS the key
    if (!entry || entry.id !== key) return null;
    return activeEnvelope(entry, version, shape.removed as ElementVersion | undefined);
  }
  // Tombstone: the canonical stub travels with it; when absent, a decodable key re-derives
  // it later (§ 4.2.1 bis) and a non-decodable key stays a valid stub-less tombstone
  if (shape.stub !== undefined) {
    const stub = parseStockTombstoneStub(shape.stub);
    if (!stub || stub.id !== key) return null;
    return { state: 'tombstoned', stub, version, removed: shape.removed as ElementVersion };
  }
  return { state: 'tombstoned', version, removed: shape.removed as ElementVersion };
}

/** Tolerant per-envelope read of a raw section: one malformed envelope is dropped, the
 *  valid envelopes of the same section are kept (read tolerance, never a `undefined`
 *  toward the display). The section itself is refused (null) when it is not a plain object.
 *  Shared by the bounded and unbounded readers — the volume policy is applied by the
 *  caller, never here. */
function parseStockEnvelopes(raw: unknown): StockSection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const stock: StockSection = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const envelope = parseStockEnvelope(key, value);
    if (envelope) stock[key] = envelope;
  }
  return stock;
}

/**
 * Reads a `stock` section coming from OUTSIDE the device (server payload, server-adoption
 * path): TOLERANT per envelope and bounded — the section is refused (null) when a volume
 * cap is exceeded (explicit refusal, never a silent truncation — § 4.2.4). The admission
 * policy stays the reference protection for external data.
 */
export function parseStockSection(raw: unknown): StockSection | null {
  const stock = parseStockEnvelopes(raw);
  return stock && withinStockCaps(stock) ? stock : null;
}

/**
 * Reads a `stock` section that THIS device persisted itself (own stored document, backup
 * restore — lot F1 A4, chef decision AR-1 option α): the volume bounds are an ADMISSION
 * policy (the server refuses an out-of-caps push; the client refuses an out-of-caps server
 * adoption), NOT a filter of the device's own state. Re-reading or restoring what the user
 * already holds must never silently drop entries: the whole section is read as persisted
 * (malformed envelopes are still dropped individually — corruption handling, unchanged).
 * The explicit refusal keeps happening at the sources that own it (server caps B1a–B1d,
 * `mergeStock` adoption), so a large local state simply stays pending instead of vanishing.
 */
export function parseStockSectionUnbounded(raw: unknown): StockSection | null {
  return parseStockEnvelopes(raw);
}

/**
 * Strict read of a `stock` section pushed by a client: EVERY envelope must be valid (a
 * push is never partially applied — one invalid envelope refuses the whole push with a
 * 400, non-destructive) and the caps must hold. Null when refused.
 */
export function readStockSection(raw: unknown): StockSection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const stock: StockSection = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const envelope = parseStockEnvelope(key, value);
    if (!envelope) return null;
    stock[key] = envelope;
  }
  return withinStockCaps(stock) ? stock : null;
}

/** Volume counts of a section (§ 10): active entries per location and total tombstones. */
export function stockSectionCounts(stock: StockSection): {
  active: Record<StockLocation, number>;
  tombstones: number;
} {
  const active: Record<StockLocation, number> = { fridge: 0, pantry: 0 };
  let tombstones = 0;
  for (const envelope of Object.values(stock)) {
    if (envelope.state === 'active') active[envelope.entry.location] += 1;
    else tombstones += 1;
  }
  return { active, tombstones };
}

/** True when the section respects every volume bound (§ 10). */
export function withinStockCaps(stock: StockSection): boolean {
  const counts = stockSectionCounts(stock);
  return (
    counts.active.fridge <= STOCK_LIMITS.entries &&
    counts.active.pantry <= STOCK_LIMITS.entries &&
    counts.tombstones <= STOCK_LIMITS.tombstones
  );
}

/* ------------------------------------------------------------------ */
/* Merge (§ 4.2.2, § 4.2.2 bis, § 4.2.2 ter)                            */
/* ------------------------------------------------------------------ */

const serialized = (value: unknown): string => JSON.stringify(value);

/** The deterministic total order of two valid envelopes of the same key at equal
 *  versions: the serialized entry first (§ 4.2.2 bis — the lexicographically smaller entry
 *  wins), then the serialized superseded `removed` (absent = empty). Commutative and
 *  associative: the result is a function of the pair, never of the merge order. */
const envelopeOrderKey = (envelope: StockEnvelope): string =>
  envelope.state === 'active'
    ? `${serialized(envelope.entry)}|${envelope.removed ? serialized(envelope.removed) : ''}`
    : `${serialized(envelope.stub ?? '')}|${serialized(envelope.removed)}`;

/**
 * Merges two stock sections: per id, the envelopes reconcile by HLC version (commutative,
 * associative, idempotent — demonstrated by tests, tombstones included). Whole writes
 * only: a winning envelope replaces the loser entirely, no field fusion, no `undefined`.
 * Every input envelope must already be valid (parsed and, for the merge path, validated):
 * an invalid candidate never reaches this function and can never win (§ 4.5).
 */
export function mergeStockSections(a: StockSection, b: StockSection): StockSection {
  const merged: StockSection = { ...a };
  for (const [key, incoming] of Object.entries(b)) {
    const current = merged[key];
    merged[key] = current ? mergeTwoEnvelopes(current, incoming) : incoming;
  }
  return merged;
}

function mergeTwoEnvelopes(a: StockEnvelope, b: StockEnvelope): StockEnvelope {
  if (a.state === 'active' && b.state === 'active') {
    const comparison = compareVersions(a.version, b.version);
    if (comparison > 0) return a;
    if (comparison < 0) return b;
    // Equal versions: identical order keys = idempotence; otherwise a deterministic,
    // commutative tie-break (a data anomaly, signalled in the report, never silent).
    // An exact tie NEVER lets an active envelope win against a deletion — but both are
    // active here, so the lexicographic rule applies (§ 4.2.2 bis).
    return envelopeOrderKey(a) <= envelopeOrderKey(b) ? a : b;
  }
  if (a.state === 'tombstoned' && b.state === 'tombstoned') {
    const comparison = compareVersions(a.version, b.version);
    if (comparison > 0) return a;
    if (comparison < 0) return b;
    // Equal deletion versions: identical stubs = idempotence; different stubs (anomaly) =
    // deterministic tie-break on the serialized stub (absent = empty string, § 4.2.2 ter)
    return envelopeOrderKey(a) <= envelopeOrderKey(b) ? a : b;
  }
  // active vs tombstoned: the HLC comparison decides; an exact tie = deleted (the
  // suppression always wins, the lexicographic rule never applies here)
  const active = a.state === 'active' ? a : b;
  const tombstone = a.state === 'tombstoned' ? a : b;
  return compareVersions(active.version, tombstone.version) > 0 ? active : tombstone;
}

/**
 * Drops the tombstones older than the retention duration (ms); 0 or less = never purge.
 * The purge never touches an ACTIVE envelope (§ 4.2.3).
 */
export function purgeStockTombstones(stock: StockSection, retentionMs: number, nowMs: number): StockSection {
  if (retentionMs <= 0) return stock;
  const cutoff = nowMs - retentionMs;
  const next: StockSection = {};
  let changed = false;
  for (const [key, envelope] of Object.entries(stock)) {
    if (envelope.state === 'tombstoned' && envelope.version.physical <= cutoff) {
      changed = true;
      continue;
    }
    next[key] = envelope;
  }
  return changed ? next : stock;
}

/* ------------------------------------------------------------------ */
/* Derived presence (§ 6.1)                                             */
/* ------------------------------------------------------------------ */

/** The ingredient ids whose presence is derived at this location: the ACTIVE envelopes
 *  except the permanently exhausted ones (`permanent` + `exhausted_at`). The expired
 *  DLC/DDM effects are rules of F2 and are NOT applied here. Deduplicated in the map's
 *  insertion order — the same list the legacy section would derive. */
export function stockDerivedPresence(stock: StockSection, location: StockLocation): string[] {
  const seen = new Set<string>();
  for (const envelope of Object.values(stock)) {
    if (envelope.state !== 'active' || envelope.entry.location !== location) continue;
    if (envelope.entry.permanent === true && envelope.entry.exhausted_at !== undefined) continue;
    seen.add(envelope.entry.ingredient_id);
  }
  return [...seen];
}

/**
 * The entry ONE removal action targets (E3, validated 19/11/2026): the deterministic
 * presence entry first; otherwise the ACTIVE entry of the ingredient with the newest
 * `added_at`, ties broken by the lexicographically smallest id (stable). Null when the
 * ingredient holds no ACTIVE entry at this location (the next action then creates one).
 */
export function stockRemovalTarget(stock: StockSection, location: StockLocation, ingredientId: string): string | null {
  const deterministic = presenceEntryId(location, ingredientId);
  const at = stock[deterministic];
  if (at?.state === 'active' && at.entry.location === location) return deterministic;
  let target: { key: string; addedAt: string } | null = null;
  for (const [key, envelope] of Object.entries(stock)) {
    if (envelope.state !== 'active') continue;
    const candidate = envelope.entry;
    if (candidate.location !== location || candidate.ingredient_id !== ingredientId) continue;
    if (!target || candidate.added_at > target.addedAt || (candidate.added_at === target.addedAt && key < target.key)) {
      target = { key, addedAt: candidate.added_at };
    }
  }
  return target?.key ?? null;
}

/** The canonical tombstone that replaces one ACTIVE envelope at a deletion (the stub is
 *  written from the real entry — never guessed, § 4.2.1 bis). */
export function tombstonedFromEntry(envelope: StockEnvelope, version: ElementVersion): StockEnvelope {
  if (envelope.state !== 'active') return envelope;
  return tombstoneEnvelope(
    { id: envelope.entry.id, ingredient_id: envelope.entry.ingredient_id, location: envelope.entry.location },
    version
  );
}

/**
 * Tombstones EVERY ACTIVE envelope of one location with the given version: the explicit
 * global clear (`clearFridge`/`clearPantry`), distinct from a single removal (E3). Pure:
 * the version is injected, the same stock always gives the same result. Returns the same
 * reference when the location holds nothing active.
 */
export function tombstoneStockLocation(
  stock: StockSection,
  location: StockLocation,
  version: ElementVersion
): StockSection {
  let changed = false;
  const next: StockSection = {};
  for (const [key, envelope] of Object.entries(stock)) {
    if (envelope.state === 'active' && envelope.entry.location === location) {
      changed = true;
      next[key] = tombstonedFromEntry(envelope, version);
      continue;
    }
    next[key] = envelope;
  }
  return changed ? next : stock;
}

/* ------------------------------------------------------------------ */
/* Legacy conversion (§ 7.1) and reverse projection (§ 7.4)             */
/* ------------------------------------------------------------------ */

/** The bare-presence entry a legacy add converts into: no invented quantity, no invented
 *  date — `added_at` is the version's own date (§ 7.1). */
const barePresenceEntry = (
  id: string,
  ingredientId: string,
  location: StockLocation,
  physical: number
): StockEntry => ({ id, ingredient_id: ingredientId, location, origin: 'manual', added_at: isoFromPhysical(physical) });

/**
 * Converts one legacy element set (an old client's fridge or pantry card) into the stock
 * candidates: ONE deterministic envelope per ingredient id (`st_<location>_<id>`, § 5),
 * never two concurrent envelopes, the legacy versions carried verbatim (§ 7.1):
 * - `added` alone → ACTIVE (version = the add, kept as is);
 * - `removed` alone → canonical tombstone with the stub written from the REAL legacy key;
 * - `added > removed` → ACTIVE with the add version (the deletion travels as superseded);
 * - `removed > added` or an exact tie → tombstone (exact tie = deleted, ElementSet rule).
 *
 * Echo recognition: every version carrying the reserved device id is an echo of the
 * legacy projection, never a business operation — it is ignored (it creates, modifies and
 * reactivates nothing). A real modification (any other device id) converts normally; both
 * can coexist in the same card. Idempotent: replaying the conversion of the same card
 * produces the same candidates.
 */
export function convertLegacyElementSet(set: ElementSet, location: StockLocation): StockSection {
  const candidates: StockSection = {};
  const ids = new Set([...Object.keys(set.added), ...Object.keys(set.removed)]);
  for (const ingredientId of ids) {
    const added = set.added[ingredientId];
    const removed = set.removed[ingredientId];
    const addedIsEcho = added?.device === RESERVED_SYNC_DEVICE;
    const removedIsEcho = removed?.device === RESERVED_SYNC_DEVICE;
    const key = presenceEntryId(location, ingredientId);
    const stub = { id: key, ingredient_id: ingredientId, location };
    if (addedIsEcho) {
      // The echo added nothing: a real deletion converts alone
      if (removed && !removedIsEcho) candidates[key] = tombstoneEnvelope(stub, removed);
      continue;
    }
    if (!added) {
      if (removed && !removedIsEcho) candidates[key] = tombstoneEnvelope(stub, removed);
      continue;
    }
    if (!removed || removedIsEcho) {
      candidates[key] = activeEnvelope(barePresenceEntry(key, ingredientId, location, added.physical), added);
      continue;
    }
    const comparison = compareVersions(added, removed);
    if (comparison > 0) {
      candidates[key] = activeEnvelope(barePresenceEntry(key, ingredientId, location, added.physical), added, removed);
    } else {
      // removed > added, or an exact tie (deleted)
      candidates[key] = tombstoneEnvelope(stub, removed);
    }
  }
  return candidates;
}

/**
 * Merges legacy conversion candidates into the stock with the explicit protection of
 * § 7.1: a bare-presence ACTIVE candidate coming from the legacy NEVER replaces the
 * business data of an already-ACTIVE stored envelope (an enriched entry is never
 * impoverished by a legacy re-add) — the stored entry is kept and the version advances to
 * the max of the two (the legacy re-add is recorded as an event, never as an overwrite).
 * TOMBSTONED candidates follow the standard merge rules.
 */
export function mergeLegacyCandidates(stock: StockSection, candidates: StockSection): StockSection {
  const merged: StockSection = { ...stock };
  for (const [key, candidate] of Object.entries(candidates)) {
    const stored = merged[key];
    if (!stored) {
      merged[key] = candidate;
      continue;
    }
    if (candidate.state === 'active' && stored.state === 'active') {
      const version = compareVersions(stored.version, candidate.version) >= 0 ? stored.version : candidate.version;
      merged[key] = version === stored.version ? stored : { ...stored, version };
      continue;
    }
    merged[key] = mergeTwoEnvelopes(stored, candidate);
  }
  return merged;
}

/**
 * Projects the stock back onto the legacy element-set cards (§ 7.4, bidirectional
 * compatibility during the transition window): the server regenerates the fridge and the
 * pantry at every push from the current stock, so an old device keeps seeing every
 * modification of the migrated devices. Aggregation by `ingredient_id` (imposed): the
 * stock is indexed by entry id, the legacy cards by ingredient id. An ingredient is
 * present in the projected card if and only if at least ONE of its entries is ACTIVE.
 *
 * Version rule (§ 7.4): present → `added` = max of the ACTIVE versions, `removed` = max of
 * the tombstones (absent when none); when that `removed` dominates the `added` (skewed
 * clocks), the presence is re-positioned with a synthetic server version STRICTLY greater
 * than the tombstone — deterministic and pure (no clock is called). Absent → `removed`
 * alone is written, no `added` is invented. The synthetic version (reserved device id) is
 * never written into the stock and is recognized as an echo at the next conversion — the
 * full cycle converges to a fixed point (§ 7.4, demonstrated).
 */
export function projectStockToLegacy(stock: StockSection, location: StockLocation): ElementSet {
  const added: Record<string, ElementVersion> = {};
  const removed: Record<string, ElementVersion> = {};
  const active = new Map<string, ElementVersion>();
  const deleted = new Map<string, ElementVersion>();
  for (const [key, envelope] of Object.entries(stock)) {
    if (envelope.state === 'active') {
      if (envelope.entry.location !== location) continue;
      const ingredientId = envelope.entry.ingredient_id;
      const current = active.get(ingredientId);
      active.set(ingredientId, !current || compareVersions(envelope.version, current) > 0 ? envelope.version : current);
    } else {
      // The stub carries the ingredient attachment; the defensive stub-less case is
      // excluded from the attribution (signalled anomaly, never silent — § 4.2.1 bis)
      const stub = stubOfTombstone(envelope, key);
      if (!stub || stub.location !== location) continue;
      const current = deleted.get(stub.ingredient_id);
      deleted.set(
        stub.ingredient_id,
        !current || compareVersions(envelope.version, current) > 0 ? envelope.version : current
      );
    }
  }
  for (const [ingredientId, version] of active) {
    const tombstone = deleted.get(ingredientId);
    if (tombstone) removed[ingredientId] = tombstone;
    added[ingredientId] =
      tombstone && compareVersions(tombstone, version) >= 0
        ? // Re-positioning: a synthetic version strictly greater than the dominant tombstone
          { physical: tombstone.physical, counter: tombstone.counter + 1, device: RESERVED_SYNC_DEVICE }
        : version;
  }
  for (const [ingredientId, version] of deleted) {
    if (!active.has(ingredientId)) removed[ingredientId] = version; // no `added`: absent, nothing invented
  }
  return { added, removed };
}
