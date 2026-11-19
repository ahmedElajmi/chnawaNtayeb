import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { compareVersions, mergeElementSets, type ElementSet, type ElementVersion } from './elementSets';
import {
  ISO_CALENDAR_DATE,
  PERMANENT_STOCK_CATEGORIES,
  STOCK_LIMITS,
  STOCK_LOCATIONS,
  checkStockEntryStructure,
  convertLegacyElementSet,
  decodePresenceEntryId,
  envelopeState,
  entryIdWithinBounds,
  isCalendarDate,
  isDecodablePresenceEntryId,
  mergeLegacyCandidates,
  mergeStockSections,
  parseStockSection,
  parseStockTombstoneStub,
  presenceEntryId,
  projectStockToLegacy,
  purgeStockTombstones,
  readStockSection,
  stubOfTombstone,
  stockDerivedPresence,
  stockSectionCounts,
  utf8Length,
  validateStockEntry,
  withinStockCaps,
  type StockEntry,
  type StockEnvelope,
  type StockSection,
  type StockValidationContext,
} from './index';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ver = (physical: number, device = 'd1', counter = 0): ElementVersion => ({ physical, counter, device });

const entry = (overrides: Partial<StockEntry> = {}): StockEntry => ({
  id: 'st_fridge_ing1',
  ingredient_id: 'ing1',
  location: 'fridge',
  origin: 'manual',
  added_at: '2026-01-01T10:00:00Z',
  ...overrides,
});

/** The live registries of the tests: every unit known, every ingredient in 'vegetables'
 *  except the ones listed as unknown; the permanent category list is the core constant. */
const makeCtx = (overrides: Partial<StockValidationContext> = {}): StockValidationContext => ({
  isKnownUnit: () => true,
  permanentCategories: new Set(PERMANENT_STOCK_CATEGORIES),
  getIngredient: () => ({ id: 'ing1', category: 'vegetables' }),
  ...overrides,
});

const active = (
  overrides: Partial<StockEntry> & { id?: string },
  version: ElementVersion,
  removed?: ElementVersion
): StockEnvelope => ({
  state: 'active',
  entry: entry(overrides as Partial<StockEntry>),
  version,
  ...(removed ? { removed } : {}),
});

const tomb = (
  key: string,
  ingredientId: string,
  location: 'fridge' | 'pantry',
  version: ElementVersion
): StockEnvelope => ({
  state: 'tombstoned',
  stub: { id: key, ingredient_id: ingredientId, location },
  version,
  removed: version,
});

/* ------------------------------------------------------------------ */
/* § 4.5 — validation: structural rules (no registry)                   */
/* ------------------------------------------------------------------ */

describe('checkStockEntryStructure (structural rules, no registry)', () => {
  it('accepts a bare presence entry (no quantity: presence only)', () => {
    expect(checkStockEntryStructure(entry())).toBeNull();
  });

  it('accepts a quantity with its unit, positive, finite, bounded', () => {
    expect(checkStockEntryStructure(entry({ quantity: 250, unit: 'g' }))).toBeNull();
  });

  it('requires quantity and unit together', () => {
    expect(checkStockEntryStructure(entry({ quantity: 2 }))).toBe('unit');
    expect(checkStockEntryStructure(entry({ unit: 'kg' }))).toBe('unit');
  });

  it('refuses a zero, negative, infinite or oversized quantity', () => {
    expect(checkStockEntryStructure(entry({ quantity: 0, unit: 'g' }))).toBe('quantity');
    expect(checkStockEntryStructure(entry({ quantity: -1, unit: 'g' }))).toBe('quantity');
    expect(checkStockEntryStructure(entry({ quantity: Number.POSITIVE_INFINITY, unit: 'g' }))).toBe('quantity');
    expect(checkStockEntryStructure(entry({ quantity: STOCK_LIMITS.quantity + 1, unit: 'g' }))).toBe('quantity');
  });

  it('requires expiry_type with expires_at (and only then)', () => {
    expect(checkStockEntryStructure(entry({ expires_at: '2026-02-01' }))).toBe('expiry');
    expect(checkStockEntryStructure(entry({ expiry_type: 'DLC' }))).toBe('expiry');
    expect(checkStockEntryStructure(entry({ expires_at: '2026-02-01', expiry_type: 'DDM' }))).toBeNull();
  });

  it('refuses an expiry date with a time or a timezone (day precision only)', () => {
    expect(checkStockEntryStructure(entry({ expires_at: '2026-02-01T00:00:00Z', expiry_type: 'DLC' }))).toBe('expiry');
  });

  it('forbids quantity, unit or expiry on a permanent entry', () => {
    expect(checkStockEntryStructure(entry({ permanent: true, quantity: 1, unit: 'g' }))).toBe('permanent');
    expect(checkStockEntryStructure(entry({ permanent: true, expires_at: '2026-02-01', expiry_type: 'DLC' }))).toBe(
      'permanent'
    );
    expect(checkStockEntryStructure(entry({ permanent: true }))).toBeNull();
  });

  it('requires exhausted_at to be a calendar date and to imply permanent', () => {
    expect(checkStockEntryStructure(entry({ exhausted_at: '2026-01-15' }))).toBe('exhausted-at');
    expect(checkStockEntryStructure(entry({ permanent: true, exhausted_at: '2026-01-15' }))).toBeNull();
    expect(checkStockEntryStructure(entry({ permanent: true, exhausted_at: '2026-01-15T10:00:00Z' }))).toBe(
      'exhausted-at'
    );
  });

  it('validates the common identifier guarantee on the entry id', () => {
    expect(checkStockEntryStructure(entry({ id: '' }))).toBe('entry-id');
    expect(checkStockEntryStructure(entry({ id: 'a/b' }))).toBe('entry-id');
    expect(checkStockEntryStructure(entry({ id: '.' }))).toBe('entry-id');
    expect(checkStockEntryStructure(entry({ id: '..' }))).toBe('entry-id');
    expect(checkStockEntryStructure(entry({ id: '__x__' }))).toBe('entry-id');
    // The executed length bound (§ 5, v5): no truncation, an explicit refusal
    expect(checkStockEntryStructure(entry({ id: 'a'.repeat(STOCK_LIMITS.id + 1) }))).toBe('entry-id');
    // Dotted, guest-style and long-but-bounded ids stay legal (no other restriction)
    expect(checkStockEntryStructure(entry({ id: '...hidden' }))).toBeNull();
    expect(checkStockEntryStructure(entry({ id: 'guest:abc' }))).toBeNull();
    expect(checkStockEntryStructure(entry({ id: 'a'.repeat(STOCK_LIMITS.id) }))).toBeNull();
  });

  it('enforces the 1 500-byte guarantee on multibyte ids', () => {
    const multibyte = 'é'.repeat(750); // 1 500 bytes, 750 characters
    expect(utf8Length(multibyte)).toBe(1500);
    expect(entryIdWithinBounds(multibyte)).toBe(true);
    expect(entryIdWithinBounds('é'.repeat(751))).toBe(false);
  });

  it('requires a location, an origin among three and a valid added_at', () => {
    expect(checkStockEntryStructure(entry({ location: 'freezer' as never }))).toBe('location');
    expect(checkStockEntryStructure(entry({ origin: 'photo' }))).toBeNull();
    expect(checkStockEntryStructure(entry({ origin: 'import' }))).toBeNull();
    expect(checkStockEntryStructure(entry({ origin: 'generated' as never }))).toBe('origin');
    expect(checkStockEntryStructure(entry({ added_at: 'not-a-date' }))).toBe('added-at');
    expect(checkStockEntryStructure(entry({ added_at: '2026-01-01' }))).toBe('added-at');
  });

  it('caps the note length', () => {
    expect(checkStockEntryStructure(entry({ note: 'x'.repeat(STOCK_LIMITS.note) }))).toBeNull();
    expect(checkStockEntryStructure(entry({ note: 'x'.repeat(STOCK_LIMITS.note + 1) }))).toBe('note');
  });
});

/* ------------------------------------------------------------------ */
/* § 4.5 — validation: registry rules (context passed in, no snapshot)  */
/* ------------------------------------------------------------------ */

describe('validateStockEntry (registry rules via the context)', () => {
  it('refuses an ingredient the context does not know', () => {
    const result = validateStockEntry(entry(), makeCtx({ getIngredient: () => null }));
    expect(result).toEqual({ ok: false, error: 'unknown-ingredient' });
  });

  it('refuses a unit the context does not know', () => {
    const result = validateStockEntry(
      entry({ quantity: 2, unit: 'sacks' }),
      makeCtx({ isKnownUnit: (unit) => unit !== 'sacks' })
    );
    expect(result).toEqual({ ok: false, error: 'unknown-unit' });
  });

  it('allows permanent only for the configured categories (E6, real category of the catalog)', () => {
    const ok = validateStockEntry(
      entry({ permanent: true }),
      makeCtx({ getIngredient: () => ({ id: 'ing1', category: 'canned_pantry' }) })
    );
    expect(ok).toEqual({ ok: true, value: { ...entry(), permanent: true } });
    const refused = validateStockEntry(
      entry({ permanent: true }),
      makeCtx({ getIngredient: () => ({ id: 'ing1', category: 'vegetables' }) })
    );
    expect(refused).toEqual({ ok: false, error: 'permanent-category' });
  });

  it('never applies the business rules to a stub (an ingredient absent from the catalog is legal)', () => {
    // parseStockTombstoneStub knows no registry at all: a deleted catalog ingredient stays legal
    expect(parseStockTombstoneStub({ id: 'st_fridge_gone', ingredient_id: 'gone', location: 'fridge' })).toEqual({
      id: 'st_fridge_gone',
      ingredient_id: 'gone',
      location: 'fridge',
    });
  });

  it('normalizes the entry: a cleared field is absent, never undefined', () => {
    const raw = { ...entry({ quantity: 3, unit: 'g' }), note: undefined };
    const result = validateStockEntry(raw, makeCtx());
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.value)).not.toContain('note');
  });
});

/* ------------------------------------------------------------------ */
/* § 4.2 / § 4.2.1 — the typed union and its six rows                   */
/* ------------------------------------------------------------------ */

describe('envelopeState (canonical union, HLC comparison is the authority)', () => {
  it('row 1: entry, no removed → ACTIVE', () => {
    expect(envelopeState({ state: 'active', entry: entry(), version: ver(100) })).toBe('active');
  });

  it('row 2: entry + removed, version > removed → ACTIVE (re-creation)', () => {
    expect(envelopeState({ state: 'active', entry: entry(), version: ver(200), removed: ver(100) })).toBe('active');
  });

  it('row 3: entry + removed, version ≤ removed → TOMBSTONED (merge canonicalizes)', () => {
    expect(envelopeState({ entry: entry(), version: ver(100), removed: ver(100) })).toBe('tombstoned');
    expect(envelopeState({ entry: entry(), version: ver(50), removed: ver(100) })).toBe('tombstoned');
  });

  it('row 4: stub + removed == version → canonical TOMBSTONED', () => {
    expect(
      envelopeState({
        state: 'tombstoned',
        stub: { id: 'k', ingredient_id: 'ing1', location: 'fridge' },
        version: ver(100),
        removed: ver(100),
      })
    ).toBe('tombstoned');
  });

  it('row 5: neither a complete entry nor a stub, and no canonical removal → INVALID', () => {
    expect(envelopeState({ version: ver(100) })).toBe('invalid');
    expect(envelopeState({ state: 'active', version: ver(100) })).toBe('invalid');
    // A shape with no entry and no stub but a canonical removal is a stripped tombstone
    expect(envelopeState({ state: 'tombstoned', version: ver(100), removed: ver(100) })).toBe('tombstoned');
    // ...but a non-canonical removal or a contradictory declared state stays INVALID
    expect(envelopeState({ state: 'tombstoned', version: ver(200), removed: ver(100) })).toBe('invalid');
    expect(envelopeState({ state: 'active', version: ver(100), removed: ver(100) })).toBe('invalid');
  });

  it('row 6: a declared state contradicted by the comparison is INVALID', () => {
    expect(envelopeState({ state: 'active', entry: entry(), version: ver(100), removed: ver(100) })).toBe('invalid');
    expect(
      envelopeState({
        state: 'active',
        stub: { id: 'k', ingredient_id: 'ing1', location: 'fridge' },
        version: ver(100),
        removed: ver(100),
      })
    ).toBe('invalid');
    expect(envelopeState({ state: 'tombstoned', entry: entry(), version: ver(200), removed: ver(100) })).toBe(
      'invalid'
    );
  });

  it('a tombstone whose removed differs from its version is INVALID', () => {
    expect(
      envelopeState({
        state: 'tombstoned',
        stub: { id: 'k', ingredient_id: 'ing1', location: 'fridge' },
        version: ver(200),
        removed: ver(100),
      })
    ).toBe('invalid');
  });

  it('a malformed version is INVALID', () => {
    expect(envelopeState({ state: 'active', entry: entry(), version: { physical: 0, counter: 0, device: 'd' } })).toBe(
      'invalid'
    );
    expect(
      envelopeState({ state: 'active', entry: entry(), version: { physical: 10, counter: -1, device: 'd' } })
    ).toBe('invalid');
    expect(envelopeState({ state: 'active', entry: entry(), version: { physical: 10, counter: 0, device: '' } })).toBe(
      'invalid'
    );
  });
});

/* ------------------------------------------------------------------ */
/* § 4.2.4 — parsers (tolerant read, strict push, identity invariant)   */
/* ------------------------------------------------------------------ */

describe('parseStockSection (tolerant read) and readStockSection (strict push)', () => {
  it('keeps the valid envelopes of a section that also holds malformed ones', () => {
    const parsed = parseStockSection({
      st_fridge_ing1: active({ id: 'st_fridge_ing1' }, ver(100)),
      broken: { state: 'active', version: ver(5) }, // no entry
      st_fridge_ing9: active({ id: 'other-id' }, ver(5)), // identity ≠ key
    });
    expect(parsed && Object.keys(parsed)).toEqual(['st_fridge_ing1']);
  });

  it('refuses a whole section over a cap (explicit refusal, never a truncation)', () => {
    const over: StockSection = {};
    for (let i = 0; i <= STOCK_LIMITS.entries; i++) {
      over[`st_fridge_i${i}`] = active({ id: `st_fridge_i${i}`, ingredient_id: `i${i}` }, ver(100 + i));
    }
    expect(parseStockSection(over)).toBeNull();
    expect(readStockSection(over)).toBeNull();
  });

  it('counts the tombstones of the whole stock against their cap', () => {
    const stock: StockSection = {};
    for (let i = 0; i <= STOCK_LIMITS.tombstones; i++) {
      const key = `st_fridge_t${i}`;
      stock[key] = tomb(key, `t${i}`, 'fridge', ver(100 + i));
    }
    expect(withinStockCaps(stock)).toBe(false);
    expect(stockSectionCounts(stock).tombstones).toBe(STOCK_LIMITS.tombstones + 1);
  });

  it('the strict read refuses the whole push when one envelope is invalid', () => {
    const mixed = {
      st_fridge_ing1: active({ id: 'st_fridge_ing1' }, ver(100)),
      bad: {
        state: 'tombstoned',
        stub: { id: 'bad', ingredient_id: 'x', location: 'pantry' },
        version: ver(9),
        removed: ver(5),
      },
    };
    expect(readStockSection(mixed)).toBeNull();
    expect(Object.keys(parseStockSection(mixed) ?? {})).toEqual(['st_fridge_ing1']);
  });

  it('ignores an extra business field in a stub (tolerant parsing)', () => {
    const parsed = parseStockSection({
      st_fridge_ing3: {
        state: 'tombstoned',
        stub: { id: 'st_fridge_ing3', ingredient_id: 'ing3', location: 'fridge', quantity: 4, origin: 'manual' },
        version: ver(10),
        removed: ver(10),
      },
    });
    expect(parsed?.st_fridge_ing3).toEqual({
      state: 'tombstoned',
      stub: { id: 'st_fridge_ing3', ingredient_id: 'ing3', location: 'fridge' },
      version: ver(10),
      removed: ver(10),
    });
  });

  it('derives the stub of a stub-less tombstone from a decodable deterministic id', () => {
    const key = presenceEntryId('pantry', 'ing7');
    const parsed = parseStockSection({ [key]: { state: 'tombstoned', version: ver(10), removed: ver(10) } });
    expect(parsed?.[key]).toEqual({ state: 'tombstoned', version: ver(10), removed: ver(10) });
    expect(stubOfTombstone(parsed![key] as never, key)).toEqual({
      id: key,
      ingredient_id: 'ing7',
      location: 'pantry',
    });
  });

  it('keeps a stub-less tombstone with a non-decodable id (defensive case, excluded from attribution)', () => {
    const key = 'stock_lq3x9k_4f2a'; // createId shape: never decodable
    const parsed = parseStockSection({ [key]: { state: 'tombstoned', version: ver(10), removed: ver(10) } });
    expect(parsed?.[key]).toEqual({ state: 'tombstoned', version: ver(10), removed: ver(10) });
    expect(stubOfTombstone(parsed![key] as never, key)).toBeNull();
  });

  it('refuses an entry whose id contradicts its key (identity invariant)', () => {
    const strict = readStockSection({ st_fridge_ing1: active({ id: 'st_fridge_ing2' }, ver(100)) });
    expect(strict).toBeNull();
    expect(
      readStockSection({
        key: {
          state: 'tombstoned',
          stub: { id: 'other', ingredient_id: 'x', location: 'fridge' },
          version: ver(1),
          removed: ver(1),
        },
      })
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* § 4.2.2 / bis / ter — merge: four issues and the equal-version table  */
/* ------------------------------------------------------------------ */

describe('mergeStockSections (commutative, associative, idempotent)', () => {
  const A = ver(100, 'a');
  const B = ver(200, 'b');
  const key = 'st_fridge_ing1';
  const enriched = entry({ id: key, quantity: 250, unit: 'g', note: 'fraîche' });
  const bare = entry({ id: key });

  it('ACTIVE vs ACTIVE: the newest version wins, whole write', () => {
    const merged = mergeStockSections(
      { [key]: active({ id: key }, A) },
      { [key]: { state: 'active', entry: enriched, version: B } }
    );
    expect(merged[key]).toEqual({ state: 'active', entry: enriched, version: B });
  });

  it('ACTIVE vs TOMBSTONED: the HLC comparison decides, an exact tie = deleted', () => {
    const deleted = tomb(key, 'ing1', 'fridge', B);
    expect(mergeStockSections({ [key]: active({ id: key }, A) }, { [key]: deleted })[key]).toEqual(deleted);
    expect(
      mergeStockSections({ [key]: active({ id: key }, B) }, { [key]: tomb(key, 'ing1', 'fridge', A) })[key]
    ).toEqual(active({ id: key }, B));
    // Exact tie: the deletion always wins (the lexicographic rule never applies here)
    expect(
      mergeStockSections({ [key]: active({ id: key }, A) }, { [key]: tomb(key, 'ing1', 'fridge', A) })[key]
    ).toEqual(tomb(key, 'ing1', 'fridge', A));
  });

  it('TOMBSTONED vs TOMBSTONED: the newest wins with its stub', () => {
    const older = tomb(key, 'ing1', 'fridge', A);
    const newer = {
      state: 'tombstoned' as const,
      stub: { id: key, ingredient_id: 'other', location: 'fridge' as const },
      version: B,
      removed: B,
    };
    const merged = mergeStockSections({ [key]: older }, { [key]: newer });
    expect(merged[key]).toEqual(newer);
  });

  it('equal versions: identical contents = idempotence', () => {
    const left = { [key]: active({ id: key }, A) };
    const right = { [key]: active({ id: key }, A) };
    expect(mergeStockSections(left, right)).toEqual(left);
    expect(mergeStockSections(right, left)).toEqual(left);
  });

  it('equal versions, different ACTIVE contents: deterministic commutative tie-break', () => {
    const left = { [key]: { state: 'active' as const, entry: bare, version: A } };
    const right = { [key]: { state: 'active' as const, entry: enriched, version: A } };
    const ab = mergeStockSections(left, right);
    const ba = mergeStockSections(right, left);
    expect(ab).toEqual(ba); // the same issue in both orders
    // The lexicographically smaller serialized entry wins (commutative)
    const winner = JSON.stringify(bare) <= JSON.stringify(enriched) ? bare : enriched;
    expect((ab[key] as { entry: StockEntry }).entry).toEqual(winner);
  });

  it('equal versions, ACTIVE vs TOMBSTONED: the deletion always wins in both orders', () => {
    const left = { [key]: active({ id: key }, A) };
    const right = { [key]: tomb(key, 'ing1', 'fridge', A) };
    expect(mergeStockSections(left, right)).toEqual(right);
    expect(mergeStockSections(right, left)).toEqual(right);
  });

  it('equal versions, different tombstone stubs: deterministic tie-break on the serialized stub', () => {
    const left = { [key]: tomb(key, 'ing1', 'fridge', A) };
    const right = {
      [key]: {
        state: 'tombstoned' as const,
        stub: { id: key, ingredient_id: 'zzz', location: 'fridge' as const },
        version: A,
        removed: A,
      },
    };
    expect(mergeStockSections(left, right)).toEqual(mergeStockSections(right, left));
  });

  it('equal versions, one stub absent and one present: the smaller serialized stub wins', () => {
    const left = { [key]: tomb(key, 'ing1', 'fridge', A) };
    const right = { [key]: { state: 'tombstoned' as const, version: A, removed: A } };
    expect(mergeStockSections(left, right)).toEqual(mergeStockSections(right, left));
  });

  it('properties: commutative, associative and idempotent over N envelopes, tombstones included', () => {
    const envelopes: Array<[string, StockEnvelope]> = [
      ['st_fridge_a', active({ id: 'st_fridge_a', ingredient_id: 'a' }, ver(100, 'a'))],
      ['st_fridge_a', tomb('st_fridge_a', 'a', 'fridge', ver(150, 'b'))],
      ['st_fridge_a', active({ id: 'st_fridge_a', ingredient_id: 'a', quantity: 2, unit: 'g' }, ver(300, 'c'))],
      ['st_fridge_b', active({ id: 'st_fridge_b', ingredient_id: 'b' }, ver(120, 'a'))],
      ['st_fridge_b', tomb('st_fridge_b', 'b', 'fridge', ver(110, 'b'))],
      ['st_pantry_c', tomb('st_pantry_c', 'c', 'pantry', ver(90, 'a'))],
      ['st_pantry_c', tomb('st_pantry_c', 'c', 'pantry', ver(95, 'b'))],
    ];
    const sections = envelopes.map(([entryKey, env]) => ({ [entryKey]: env }) as StockSection);
    const mergeAll = (list: StockSection[]): StockSection => list.reduce((acc, s) => mergeStockSections(acc, s), {});
    // Commutativity: every permutation converges to the same state
    const permutations = [
      sections,
      [...sections].reverse(),
      [sections[2], sections[0], sections[4], sections[1], sections[6], sections[3], sections[5]],
    ];
    const references = permutations.map(mergeAll);
    expect(references[1]).toEqual(references[0]);
    expect(references[2]).toEqual(references[0]);
    // Associativity: any grouping gives the same result
    const grouped = mergeStockSections(mergeStockSections(sections[0], sections[1]), mergeAll(sections.slice(2)));
    expect(grouped).toEqual(references[0]);
    // Idempotence
    expect(mergeStockSections(references[0], references[0])).toEqual(references[0]);
  });
});

/* ------------------------------------------------------------------ */
/* § 4.2.3 — purge                                                      */
/* ------------------------------------------------------------------ */

describe('purgeStockTombstones', () => {
  it('drops only the expired tombstones, never an ACTIVE envelope', () => {
    const now = 1_000_000_000_000;
    const retention = 90 * 24 * 60 * 60 * 1000;
    const stock: StockSection = {
      old: tomb('old', 'a', 'fridge', ver(now - retention - 1)),
      fresh: tomb('fresh', 'b', 'fridge', ver(now - retention + 1)),
      kept: active({ id: 'kept', ingredient_id: 'c' }, ver(now - retention - 1)),
    };
    const purged = purgeStockTombstones(stock, retention, now);
    expect(Object.keys(purged).sort()).toEqual(['fresh', 'kept']);
    expect(purgeStockTombstones(stock, 0, now)).toEqual(stock); // 0 = never purge
    expect(purgeStockTombstones(stock, retention, now)).toEqual(purged); // idempotent
  });
});

/* ------------------------------------------------------------------ */
/* § 6.1 — derived presence                                             */
/* ------------------------------------------------------------------ */

describe('stockDerivedPresence (presence first, permanent exhausted excluded)', () => {
  it('lists the ACTIVE ingredient ids of the location, deduplicated, other location excluded', () => {
    const stock: StockSection = {
      st_fridge_a1: active({ id: 'st_fridge_a1', ingredient_id: 'a' }, ver(100)),
      st_fridge_a2: active({ id: 'st_fridge_a2', ingredient_id: 'a', quantity: 1, unit: 'g' }, ver(101)),
      st_fridge_gone: tomb('st_fridge_gone', 'g', 'fridge', ver(102)),
      st_pantry_p: active({ id: 'st_pantry_p', ingredient_id: 'p', location: 'pantry' }, ver(103)),
    };
    expect(stockDerivedPresence(stock, 'fridge')).toEqual(['a']);
    expect(stockDerivedPresence(stock, 'pantry')).toEqual(['p']);
  });

  it('a permanently exhausted marker is not present; an active permanent is', () => {
    const stock: StockSection = {
      st_fridge_pe: active(
        { id: 'st_fridge_pe', ingredient_id: 'pe', permanent: true, exhausted_at: '2026-01-01' },
        ver(100)
      ),
      st_fridge_pa: active({ id: 'st_fridge_pa', ingredient_id: 'pa', permanent: true }, ver(101)),
    };
    expect(stockDerivedPresence(stock, 'fridge')).toEqual(['pa']);
  });
});

/* ------------------------------------------------------------------ */
/* § 5 — deterministic ids: injectivity, round-trip, explicit refusals   */
/* ------------------------------------------------------------------ */

describe('presenceEntryId / decodePresenceEntryId (injective over all Unicode)', () => {
  const SOURCES = [
    'YS8',
    'a/',
    'a_1',
    'a/1',
    'ing_123',
    '.hidden',
    '__reserved__',
    'guest:abc',
    'e\u0301', // e + combining acute
    'é', // U+00E9 (precomposed)
    '😀', // U+1F600
    '😁', // U+1F601 — SAME high surrogate as 😀 (the exact v3 flaw)
    'a😀b',
    '𝕏', // U+1D54F
    'ab/𝕏_',
    '...dots...',
    '',
  ];

  it('refuses an empty source explicitly (never a bare st_<location>_ id)', () => {
    expect(() => presenceEntryId('fridge', '')).toThrow();
  });

  it('produces distinct ids for every distinct pair of sources (injectivity, both locations)', () => {
    for (const location of STOCK_LOCATIONS) {
      const ids = SOURCES.filter((s) => s.length > 0).map((s) => presenceEntryId(location, s));
      expect(new Set(ids).size).toBe(ids.length);
      // The astral pair sharing its high surrogate is resolved by code points
      expect(presenceEntryId(location, '😀')).not.toBe(presenceEntryId(location, '😁'));
      // Combining vs precomposed are distinct code points → distinct ids
      expect(presenceEntryId(location, 'e\u0301')).not.toBe(presenceEntryId(location, 'é'));
      // Cross-family adversarial pairs (the chef's examples)
      expect(presenceEntryId(location, 'YS8')).toBe(`${location === 'fridge' ? 'st_fridge' : 'st_pantry'}_YS8`);
      expect(presenceEntryId(location, 'a/')).not.toBe(presenceEntryId(location, 'YS8'));
      expect(presenceEntryId(location, 'a_1')).not.toBe(presenceEntryId(location, 'a/1'));
      // The reserved pattern is escaped by branch choice: its raw form can never be reached
      // (the raw branch excludes reserved ids), which is exactly what keeps injectivity
      expect(presenceEntryId(location, '__x__')).toBe(`${location === 'fridge' ? 'st_fridge' : 'st_pantry'}___x__`);
      expect(presenceEntryId(location, 'a/b').includes('/')).toBe(false);
    }
  });

  it('round-trips every source id exactly (decode ∘ encode = identity)', () => {
    for (const location of STOCK_LOCATIONS) {
      for (const source of SOURCES) {
        if (source.length === 0) continue;
        const id = presenceEntryId(location, source);
        expect(decodePresenceEntryId(location, id)).toBe(source);
        expect(isDecodablePresenceEntryId(location, id)).toBe(true);
      }
    }
  });

  it('is deterministic: the same source always gives the same id (migration replay)', () => {
    expect(presenceEntryId('fridge', 'ing_9')).toBe(presenceEntryId('fridge', 'ing_9'));
  });

  it('never produces an id over the executed bound (worst case ≈ 1 340 bytes under 1 500)', () => {
    const worst = 'é'.repeat(190); // every character escapes: 190 × 7 + prefix
    const id = presenceEntryId('fridge', worst);
    expect(utf8Length(id)).toBeLessThanOrEqual(1500);
    expect(decodePresenceEntryId('fridge', id)).toBe(worst);
    // A source that WOULD exceed the bound is refused by validation before any write
    const beyond = 'é'.repeat(300);
    expect(entryIdWithinBounds(presenceEntryId('fridge', beyond))).toBe(false);
  });

  it('the decoder refuses a wrong prefix; malformed tokens fail isDecodable, not the decoder', () => {
    expect(() => decodePresenceEntryId('fridge', 'st_pantry_ing1')).toThrow();
    // The decoder is not a validator (ids reaching it were produced by presenceEntryId):
    // the malformed-token check lives in isDecodablePresenceEntryId
    expect(isDecodablePresenceEntryId('fridge', 'st_fridge_x.0g')).toBe(false);
    expect(isDecodablePresenceEntryId('fridge', 'st_fridge_ing1')).toBe(true);
  });

  it('the module source holds no Buffer and no process (browser/server parity)', () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, 'entries.ts'), 'utf8');
    expect(source.includes('Buffer')).toBe(false);
    expect(/\bprocess\b/.test(source)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* § 7.1 — legacy conversion: five cases, echo recognition, stub        */
/* ------------------------------------------------------------------ */

describe('convertLegacyElementSet (five cases, one envelope per deterministic id)', () => {
  it('added alone → ACTIVE bare presence, version kept as is, added_at from the version', () => {
    const set: ElementSet = { added: { ing1: ver(1_700_000_000_000, 'legacy') }, removed: {} };
    const candidates = convertLegacyElementSet(set, 'fridge');
    const key = presenceEntryId('fridge', 'ing1');
    expect(candidates[key]).toEqual({
      state: 'active',
      entry: {
        id: key,
        ingredient_id: 'ing1',
        location: 'fridge',
        origin: 'manual',
        added_at: new Date(1_700_000_000_000).toISOString(),
      },
      version: ver(1_700_000_000_000, 'legacy'),
    });
  });

  it('removed alone → canonical tombstone with the stub written from the real legacy key', () => {
    const set: ElementSet = { added: {}, removed: { ing1: ver(1_700_000_000_000) } };
    const candidates = convertLegacyElementSet(set, 'pantry');
    const key = presenceEntryId('pantry', 'ing1');
    expect(candidates[key]).toEqual({
      state: 'tombstoned',
      stub: { id: key, ingredient_id: 'ing1', location: 'pantry' },
      version: ver(1_700_000_000_000),
      removed: ver(1_700_000_000_000),
    });
  });

  it('added > removed → ACTIVE with the add version and the superseded deletion', () => {
    const set: ElementSet = { added: { ing1: ver(200) }, removed: { ing1: ver(100) } };
    const candidates = convertLegacyElementSet(set, 'fridge');
    const key = presenceEntryId('fridge', 'ing1');
    expect(candidates[key]).toEqual({
      state: 'active',
      entry: {
        id: key,
        ingredient_id: 'ing1',
        location: 'fridge',
        origin: 'manual',
        added_at: new Date(200).toISOString(),
      },
      version: ver(200),
      removed: ver(100),
    });
  });

  it('removed > added, and an exact tie: TOMBSTONED (exact tie = deleted)', () => {
    for (const [addedAt, removedAt] of [
      [100, 200],
      [150, 150],
    ]) {
      const set: ElementSet = { added: { ing1: ver(addedAt) }, removed: { ing1: ver(removedAt) } };
      const candidates = convertLegacyElementSet(set, 'fridge');
      const key = presenceEntryId('fridge', 'ing1');
      expect(candidates[key]).toEqual({
        state: 'tombstoned',
        stub: { id: key, ingredient_id: 'ing1', location: 'fridge' },
        version: ver(removedAt),
        removed: ver(removedAt),
      });
    }
  });

  it('an id present in both cards produces exactly ONE envelope (never two concurrent)', () => {
    const set: ElementSet = { added: { ing1: ver(200) }, removed: { ing1: ver(100) } };
    expect(Object.keys(convertLegacyElementSet(set, 'fridge'))).toHaveLength(1);
  });

  it('an echo of the projection (reserved device) is ignored: it creates, modifies and reactivates nothing', () => {
    // The chef's exact cycle: a tombstoned deterministic entry D, another ACTIVE entry E,
    // the projection re-positions added with a synthetic version — the legacy device pushes
    // it back: the conversion must NOT reactivate D.
    const dKey = presenceEntryId('fridge', 'd');
    const eKey = presenceEntryId('fridge', 'e');
    const stock: StockSection = {
      [dKey]: tomb(dKey, 'd', 'fridge', ver(400, 'd1')),
      [eKey]: active({ id: eKey, ingredient_id: 'e' }, ver(300, 'd2')),
    };
    const projected = projectStockToLegacy(stock, 'fridge'); // synthetic added for d and e
    const pushedBack = mergeElementSets(projected, { added: {}, removed: {} });
    const candidates = convertLegacyElementSet(pushedBack, 'fridge');
    // The echo never created a re-activation candidate; the REAL deletion version (400,
    // device d1) converts alone into the same tombstone the stock already holds (idempotent)
    expect(candidates[dKey]).toEqual(tomb(dKey, 'd', 'fridge', ver(400, 'd1')));
    // E's projected add carries its REAL version (no tombstone dominates it, no synthetic
    // was issued): its re-conversion is legitimate and idempotent on merge
    expect(candidates[eKey]).toEqual({
      state: 'active',
      entry: {
        id: eKey,
        ingredient_id: 'e',
        location: 'fridge',
        origin: 'manual',
        added_at: new Date(300).toISOString(),
      },
      version: ver(300, 'd2'),
    });
    expect(Object.keys(candidates).sort()).toEqual([dKey, eKey].sort());
    const merged = mergeLegacyCandidates(stock, candidates);
    expect((merged[dKey] as StockEnvelope).state).toBe('tombstoned'); // D never comes back
    expect((merged[eKey] as StockEnvelope).state).toBe('active');
    expect(projectStockToLegacy(merged, 'fridge')).toEqual(projected); // fixed point
  });

  it('a real modification coexisting with an echo in the same card is converted normally', () => {
    const synthetic = { physical: 500, counter: 1, device: 'server' };
    const set: ElementSet = { added: { real: ver(600, 'real'), echoed: synthetic }, removed: {} };
    const candidates = convertLegacyElementSet(set, 'fridge');
    expect(Object.keys(candidates)).toEqual([presenceEntryId('fridge', 'real')]);
  });

  it('a long-offline device pushing an old echo still gets it ignored (the rule depends only on the device)', () => {
    const oldEcho = { physical: 1_000, counter: 0, device: 'server' };
    const set: ElementSet = { added: { stale: oldEcho, fresh: ver(900, 'legacy') }, removed: {} };
    const candidates = convertLegacyElementSet(set, 'fridge');
    expect(Object.keys(candidates)).toEqual([presenceEntryId('fridge', 'fresh')]);
  });

  it('replaying the conversion is idempotent (the same card gives the same candidates)', () => {
    const set: ElementSet = { added: { ing1: ver(200) }, removed: { ing2: ver(150), ing1: ver(100) } };
    expect(convertLegacyElementSet(set, 'fridge')).toEqual(convertLegacyElementSet(set, 'fridge'));
  });
});

/* ------------------------------------------------------------------ */
/* § 7.1 — legacy candidates protection (an enriched entry never impoverished) */
/* ------------------------------------------------------------------ */

describe('mergeLegacyCandidates (bare presence never overwrites business data)', () => {
  const key = presenceEntryId('fridge', 'ing1');

  it('a bare legacy add keeps the stored enriched entry and only advances the version', () => {
    const enriched = entry({ id: key, quantity: 250, unit: 'g', note: 'fraîche' });
    const stored: StockSection = { [key]: { state: 'active', entry: enriched, version: ver(100) } };
    const candidates = convertLegacyElementSet({ added: { ing1: ver(300, 'legacy') }, removed: {} }, 'fridge');
    const merged = mergeLegacyCandidates(stored, candidates);
    expect(merged[key]).toEqual({ state: 'active', entry: enriched, version: ver(300, 'legacy') });
  });

  it('a legacy add older than the stored version changes nothing (idempotent)', () => {
    const enriched = entry({ id: key, quantity: 250, unit: 'g' });
    const stored: StockSection = { [key]: { state: 'active', entry: enriched, version: ver(300) } };
    const candidates = convertLegacyElementSet({ added: { ing1: ver(100, 'legacy') }, removed: {} }, 'fridge');
    expect(mergeLegacyCandidates(stored, candidates)).toEqual(stored);
  });

  it('a bare candidate creates the envelope when nothing is stored', () => {
    const candidates = convertLegacyElementSet({ added: { ing1: ver(300, 'legacy') }, removed: {} }, 'fridge');
    const merged = mergeLegacyCandidates({}, candidates);
    expect(merged[key]).toEqual(candidates[key]);
  });

  it('a tombstone candidate follows the standard rules (a legacy deletion can delete, a newer stock edit survives)', () => {
    const enriched = entry({ id: key, quantity: 250, unit: 'g' });
    // Legacy deletion newer than the stored entry: it deletes
    const deletion = convertLegacyElementSet({ added: {}, removed: { ing1: ver(400, 'legacy') } }, 'fridge');
    expect(
      mergeLegacyCandidates({ [key]: { state: 'active', entry: enriched, version: ver(100) } }, deletion)[key]
    ).toEqual(deletion[key]);
    // Stock edit newer than the legacy deletion: it survives
    const survivor = mergeLegacyCandidates(
      { [key]: { state: 'active', entry: enriched, version: ver(500) } },
      deletion
    );
    expect(survivor[key]).toEqual({ state: 'active', entry: enriched, version: ver(500) });
  });

  it('a legacy deletion of the deterministic presence entry leaves other ACTIVE entries of the same ingredient untouched', () => {
    const presenceKey = presenceEntryId('fridge', 'ing1');
    const otherKey = 'stock_manual1_ab12'; // a non-deterministic id of the same ingredient
    const stock: StockSection = {
      [presenceKey]: tomb(presenceKey, 'ing1', 'fridge', ver(400, 'legacy')),
      [otherKey]: active({ id: otherKey, ingredient_id: 'ing1' }, ver(300)),
    };
    expect(stockDerivedPresence(stock, 'fridge')).toEqual(['ing1']); // presence persists (E3, § 7.4 case 3)
  });
});

/* ------------------------------------------------------------------ */
/* § 7.4 — reverse projection: the seven imposed cases                  */
/* ------------------------------------------------------------------ */

describe('projectStockToLegacy (aggregation by ingredient, seven cases)', () => {
  it('case 1: several ACTIVE entries of the same ingredient → present, added = max of the ACTIVE versions', () => {
    const key1 = presenceEntryId('fridge', 'a');
    const key2 = 'stock_manual1_ab12';
    const stock: StockSection = {
      [key1]: active({ id: key1, ingredient_id: 'a' }, ver(100)),
      [key2]: active({ id: key2, ingredient_id: 'a', quantity: 2, unit: 'g' }, ver(300)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(projected.added.a).toEqual(ver(300));
    expect(projected.removed.a).toBeUndefined();
    // Deterministic: two runs, same result
    expect(projectStockToLegacy(stock, 'fridge')).toEqual(projected);
  });

  it('case 2: one ACTIVE + one TOMBSTONED → present; removed = the tombstone; re-positioning only when it dominates', () => {
    const key1 = presenceEntryId('fridge', 'a');
    const key2 = 'stock_manual1_ab12';
    const stock: StockSection = {
      [key1]: active({ id: key1, ingredient_id: 'a' }, ver(100)),
      [key2]: tomb(key2, 'a', 'fridge', ver(50)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(projected.added.a).toEqual(ver(100));
    expect(projected.removed.a).toEqual(ver(50));
    // The tombstone dominates (skewed clocks): the presence is re-positioned
    const dominating: StockSection = { ...stock, [key2]: tomb(key2, 'a', 'fridge', ver(200)) };
    const repositioned = projectStockToLegacy(dominating, 'fridge');
    expect(repositioned.added.a).toEqual({ physical: 200, counter: 1, device: 'server' });
    expect(repositioned.removed.a).toEqual(ver(200));
  });

  it('case 3: the deterministic presence entry deleted, another entry stays ACTIVE → presence persists', () => {
    const key = presenceEntryId('fridge', 'a');
    const otherKey = 'stock_manual1_ab12';
    const stock: StockSection = {
      [key]: tomb(key, 'a', 'fridge', ver(400)),
      [otherKey]: active({ id: otherKey, ingredient_id: 'a' }, ver(300)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(projected.added.a).toEqual({ physical: 400, counter: 1, device: 'server' });
    expect(projected.removed.a).toEqual(ver(400));
  });

  it('case 4: the last ACTIVE entry deleted → absent, removed alone written, no added invented', () => {
    const key = presenceEntryId('fridge', 'a');
    const stock: StockSection = { [key]: tomb(key, 'a', 'fridge', ver(400)) };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(projected.added).toEqual({});
    expect(projected.removed.a).toEqual(ver(400));
  });

  it('case 5: a new add after a complete deletion → present again, the original tombstone stays in the stock', () => {
    const key = presenceEntryId('fridge', 'a');
    const stock: StockSection = {
      [key]: active({ id: key, ingredient_id: 'a' }, ver(500)),
      [`${key}x`]: tomb(`${key}x`, 'a', 'fridge', ver(400)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(projected.added.a).toEqual(ver(500));
    expect(projected.removed.a).toEqual(ver(400));
  });

  it('case 6 (order): conversion first, then merge, then projection — an incoming legacy write is absorbed, never overwritten', () => {
    // Server flow under test: legacy merged ⊕ stored legacy → conversion → merge into stock → projection
    const key = presenceEntryId('fridge', 'a');
    const storedStock: StockSection = { [key]: active({ id: key, ingredient_id: 'a' }, ver(100)) };
    const storedLegacy: ElementSet = { added: { a: ver(100, 'old') }, removed: {} };
    const incomingLegacy: ElementSet = { added: { a: ver(300, 'old') }, removed: {} }; // a legacy re-add
    const mergedLegacy = mergeElementSets(storedLegacy, incomingLegacy);
    const stock = mergeLegacyCandidates(storedStock, convertLegacyElementSet(mergedLegacy, 'fridge'));
    const projected = projectStockToLegacy(stock, 'fridge');
    // The bare legacy re-add advanced the version but never impoverished the entry
    expect((stock[key] as { entry: StockEntry }).entry.ingredient_id).toBe('a');
    expect((stock[key] as { version: ElementVersion }).version).toEqual(ver(300, 'old'));
    expect(projected.added.a).toEqual(ver(300, 'old'));
  });

  it('case 7: the projected versions follow the ElementSet rules; only the re-positioning is synthetic', () => {
    const key = presenceEntryId('fridge', 'a');
    const stock: StockSection = {
      [key]: active({ id: key, ingredient_id: 'a' }, ver(300)),
      [`${key}t`]: tomb(`${key}t`, 'a', 'fridge', ver(200)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    // No synthetic version when the tombstone does not dominate
    expect(Object.values(projected.added).every((v) => v.device !== 'server')).toBe(true);
    expect(projectStockToLegacy(stock, 'fridge')).toEqual(projected); // pure: two runs identical
  });

  it('the projected presence equals the derived stock presence, both ways, both locations', () => {
    const stock: StockSection = {
      [presenceEntryId('fridge', 'a')]: active({ id: presenceEntryId('fridge', 'a'), ingredient_id: 'a' }, ver(100)),
      [presenceEntryId('pantry', 'b')]: active(
        { id: presenceEntryId('pantry', 'b'), ingredient_id: 'b', location: 'pantry' },
        ver(110)
      ),
      [presenceEntryId('pantry', 'c')]: tomb(presenceEntryId('pantry', 'c'), 'c', 'pantry', ver(120)),
      stock_manual1_ab12: active({ id: 'stock_manual1_ab12', ingredient_id: 'a', quantity: 2, unit: 'g' }, ver(130)),
    };
    for (const location of STOCK_LOCATIONS) {
      const projected = projectStockToLegacy(stock, location);
      const legacyPresence = Object.keys(projected.added).filter((id) => {
        const removed = projected.removed[id];
        return !removed || compareVersions(projected.added[id], removed) > 0;
      });
      expect(legacyPresence.sort()).toEqual(stockDerivedPresence(stock, location).sort());
    }
  });

  it('a defensive stub-less tombstone with a non-decodable id is excluded from the attribution (anomaly, never silent)', () => {
    const stock: StockSection = {
      stock_lq3x9k_4f2a: { state: 'tombstoned', version: ver(100), removed: ver(100) },
      [presenceEntryId('fridge', 'b')]: active({ id: presenceEntryId('fridge', 'b'), ingredient_id: 'b' }, ver(110)),
    };
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(Object.keys(projected.removed)).toEqual([]); // no ingredient could be attributed
    expect(Object.keys(projected.added)).toEqual(['b']);
  });

  it('respects the legacy caps by construction (the projected maps fit within the element-set bounds)', () => {
    const stock: StockSection = {};
    for (let i = 0; i < STOCK_LIMITS.entries; i++) {
      const key = presenceEntryId('fridge', `i${i}`);
      stock[key] = active({ id: key, ingredient_id: `i${i}` }, ver(100 + i));
    }
    const projected = projectStockToLegacy(stock, 'fridge');
    expect(Object.keys(projected.added)).toHaveLength(STOCK_LIMITS.entries);
  });
});

/* ------------------------------------------------------------------ */
/* Full cycle: projection → push back → conversion → projection (fixed point) */
/* ------------------------------------------------------------------ */

describe('the complete legacy cycle converges to a fixed point (§ 7.4)', () => {
  it('three cycles never reactivate a deleted entry and converge', () => {
    const dKey = presenceEntryId('fridge', 'd');
    const eKey = presenceEntryId('fridge', 'e');
    let stock: StockSection = {
      [dKey]: tomb(dKey, 'd', 'fridge', ver(400, 'd1')),
      [eKey]: active({ id: eKey, ingredient_id: 'e' }, ver(300, 'd2')),
    };
    let legacy: ElementSet = { added: {}, removed: {} };
    for (let cycle = 0; cycle < 3; cycle++) {
      // The server projects the stock onto the legacy cards
      legacy = projectStockToLegacy(stock, 'fridge');
      expect((stock[dKey] as StockEnvelope).state).toBe('tombstoned'); // D never comes back
      // A legacy device merges the projection and pushes its whole card back
      const pushedBack = mergeElementSets(legacy, { added: {}, removed: {} });
      // The server converts (echoes ignored) and merges into the stock
      const candidates = convertLegacyElementSet(pushedBack, 'fridge');
      stock = mergeLegacyCandidates(stock, candidates);
      expect((stock[dKey] as StockEnvelope).state).toBe('tombstoned');
      expect((stock[eKey] as StockEnvelope).state).toBe('active');
      // The next projection is identical: fixed point
      expect(projectStockToLegacy(stock, 'fridge')).toEqual(legacy);
    }
  });

  it('a real legacy modification during the cycle is converted and survives the projection', () => {
    const dKey = presenceEntryId('fridge', 'd');
    let stock: StockSection = { [dKey]: tomb(dKey, 'd', 'fridge', ver(400, 'd1')) };
    for (let cycle = 0; cycle < 3; cycle++) {
      const legacy = projectStockToLegacy(stock, 'fridge');
      // The legacy device adds a real ingredient (its own device id, never 'server')
      const pushedBack = mergeElementSets(legacy, { added: { real: ver(600 + cycle, 'real-device') }, removed: {} });
      const candidates = convertLegacyElementSet(pushedBack, 'fridge');
      stock = mergeLegacyCandidates(stock, candidates);
      expect((stock[presenceEntryId('fridge', 'real')] as StockEnvelope).state).toBe('active');
      expect((stock[dKey] as StockEnvelope).state).toBe('tombstoned');
    }
  });
});

/* ------------------------------------------------------------------ */
/* Calendar dates (E2)                                                  */
/* ------------------------------------------------------------------ */

describe('isCalendarDate (E2: YYYY-MM-DD, no time, no timezone)', () => {
  it('accepts a plain calendar date and refuses instants', () => {
    expect(isCalendarDate('2026-01-15')).toBe(true);
    expect(ISO_CALENDAR_DATE.test('2026-01-15T10:00:00Z')).toBe(false);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('2026-1-5')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Identity invariant across every mechanism (post-validation guarantee) */
/* ------------------------------------------------------------------ */

describe('the identity invariant id == key holds through every mechanism', () => {
  it('conversion, projection and merge outputs always satisfy it', () => {
    const set: ElementSet = { added: { a: ver(100), b: ver(110) }, removed: { c: ver(120) } };
    const candidates = convertLegacyElementSet(set, 'fridge');
    for (const [key, envelope] of Object.entries(candidates)) {
      const identity = envelope.state === 'active' ? envelope.entry.id : envelope.stub?.id;
      expect(identity).toBe(key);
    }
    let stock: StockSection = mergeLegacyCandidates({}, candidates);
    stock = mergeStockSections(stock, {
      [presenceEntryId('fridge', 'z')]: active({ id: presenceEntryId('fridge', 'z'), ingredient_id: 'z' }, ver(200)),
    });
    for (const [key, envelope] of Object.entries(stock)) {
      const identity = envelope.state === 'active' ? envelope.entry.id : envelope.stub?.id;
      expect(identity).toBe(key);
    }
  });
});
