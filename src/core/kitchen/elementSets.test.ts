import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  isPresent,
  mergeElementSets,
  newestVersion,
  parseElementSet,
  parseTombstoneRetentionMs,
  presentIds,
  purgeTombstones,
  receiveVersion,
  tickClock,
  wrapLegacyList,
  type ElementSet,
  type ElementVersion,
} from './index';

const v = (physical: number, counter = 0, device = 'a'): ElementVersion => ({ physical, counter, device });
const set = (added: string[] = [], removed: string[] = [], at = 1_000, device = 'a'): ElementSet => ({
  added: Object.fromEntries(added.map((id) => [id, v(at, 0, device)])),
  removed: Object.fromEntries(removed.map((id) => [id, v(at, 0, device)])),
});

describe('compareVersions', () => {
  it('orders lexicographically: physical first, then counter, then device', () => {
    expect(compareVersions(v(100), v(200))).toBeLessThan(0);
    expect(compareVersions(v(100, 1), v(100, 2))).toBeLessThan(0);
    expect(compareVersions(v(100, 1, 'a'), v(100, 1, 'b'))).toBeLessThan(0);
    expect(compareVersions(v(100, 1, 'a'), v(100, 1, 'a'))).toBe(0);
    // a skewed clock cannot reorder: the later physical always wins
    expect(compareVersions(v(1_000_000, 0, 'slow'), v(2, 500, 'fast'))).toBeGreaterThan(0);
  });
});

describe('presence', () => {
  it('derives the visible list: added beats removed, an exact tie counts as removed', () => {
    const elements: ElementSet = {
      added: { r1: v(100), r2: v(200), r3: v(300) },
      removed: { r1: v(400), r3: v(300) },
    };
    expect(isPresent(elements, 'r1')).toBe(false); // removed after its add
    expect(isPresent(elements, 'r2')).toBe(true);
    expect(isPresent(elements, 'r3')).toBe(false); // exact tie = removed wins
    expect(isPresent(elements, 'ghost')).toBe(false); // never added
    expect(presentIds(elements)).toEqual(['r2']);
  });

  it('brings an element back when it is re-added after its removal', () => {
    const elements: ElementSet = {
      added: { r1: v(300) },
      removed: { r1: v(200) },
    };
    expect(isPresent(elements, 'r1')).toBe(true);
  });
});

describe('mergeElementSets', () => {
  it('unions both devices, keeping the newest version per entry, in any order', () => {
    const a: ElementSet = {
      added: { r1: v(100), r2: v(100, 0, 'a') },
      removed: { r3: v(150) },
    };
    const b: ElementSet = {
      added: { r1: v(90, 0, 'b'), r4: v(100, 0, 'b') },
      removed: { r3: v(150, 0, 'b') },
    };
    const ab = mergeElementSets(a, b);
    const ba = mergeElementSets(b, a);
    expect(ab).toEqual(ba); // commutative
    expect(ab.added['r1']).toEqual(v(100)); // a's newer add of r1 wins
    expect(ab.added['r4']).toEqual(v(100, 0, 'b'));
    expect(ab.removed['r3']).toEqual(v(150, 0, 'b')); // the device id departs the exact tie
  });

  it('propagates a deletion against a stale add: the tombstone keeps the element out', () => {
    // Device B still holds r1 (added at 100); device A removed it at 200
    const stale = set(['r1'], [], 100, 'b');
    const removed = set([], ['r1'], 200, 'a');
    const merged = mergeElementSets(stale, removed);
    expect(presentIds(merged)).toEqual([]); // the resurrection bug stays dead
  });
});

describe('clock', () => {
  it('ticks on wall-clock time and never goes backwards', () => {
    let clock = { physical: 0, counter: 0, device: 'a' };
    ({ clock } = tickClock(clock, 100));
    expect(clock).toEqual({ physical: 100, counter: 0, device: 'a' });
    ({ clock } = tickClock(clock, 100)); // same ms: counter rises
    expect(clock).toEqual({ physical: 100, counter: 1, device: 'a' });
    ({ clock } = tickClock(clock, 50)); // a skewed clock: physical held, counter rises
    expect(clock).toEqual({ physical: 100, counter: 2, device: 'a' });
    ({ clock } = tickClock(clock, 200));
    expect(clock).toEqual({ physical: 200, counter: 0, device: 'a' });
  });

  it('absorbs observed versions so a later local event outranks them', () => {
    let clock = { physical: 0, counter: 0, device: 'a' };
    ({ clock } = tickClock(clock, 100));
    clock = receiveVersion(clock, v(500, 3, 'b'));
    expect(clock).toEqual({ physical: 500, counter: 0, device: 'a' });
    ({ clock } = tickClock(clock, 400)); // local clock behind the observed one
    expect(clock).toEqual({ physical: 500, counter: 1, device: 'a' });
    clock = receiveVersion(clock, v(500, 3, 'b'));
    expect(clock).toEqual({ physical: 500, counter: 4, device: 'a' });
  });

  it('reports the newest version of a set', () => {
    const elements: ElementSet = { added: { a: v(100), b: v(300) }, removed: { c: v(200) } };
    expect(newestVersion(elements)).toEqual(v(300));
    expect(newestVersion({ added: {}, removed: {} })).toBeNull();
  });
});

describe('parseElementSet', () => {
  it('reads the stored shape and rejects anything malformed', () => {
    expect(parseElementSet({ added: { r1: v(100) }, removed: {} })).toEqual({ added: { r1: v(100) }, removed: {} });
    expect(parseElementSet(null)).toBeNull();
    expect(parseElementSet([v(100)])).toBeNull();
    expect(parseElementSet({ added: 'nope', removed: {} })).toBeNull();
    expect(parseElementSet({ added: { r1: { physical: -1, counter: 0, device: 'a' } }, removed: {} })).toBeNull();
    expect(parseElementSet({ added: { r1: { physical: 100, counter: 0.5, device: 'a' } }, removed: {} })).toBeNull();
    expect(parseElementSet({ added: { '': v(100) }, removed: {} })).toBeNull();
    expect(parseElementSet({ added: { r1: { physical: 100, counter: 0, device: '' } }, removed: {} })).toBeNull();
  });

  it('trims beyond the caps instead of refusing (the oldest versions go first)', () => {
    const added = Object.fromEntries(Array.from({ length: 350 }, (_, i) => [`r${i}`, v(1_000 + i)]));
    const parsed = parseElementSet({ added, removed: {} });
    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed!.added)).toHaveLength(300);
    expect(parsed!.added['r349']).toBeDefined(); // the newest kept
    expect(parsed!.added['r0']).toBeUndefined(); // the oldest dropped
  });
});

describe('wrapLegacyList', () => {
  it('wraps a pre-migration id list as tombstone-less additions', () => {
    const wrapped = wrapLegacyList(['r1', 'r2'], 5_000);
    expect(wrapped).toEqual({
      added: { r1: v(5_000, 0, 'legacy'), r2: v(5_000, 0, 'legacy') },
      removed: {},
    });
    expect(presentIds(wrapped!)).toEqual(['r1', 'r2']);
    expect(wrapLegacyList('nope', 1)).toBeNull();
    expect(wrapLegacyList(['ok', 42], 1)).toBeNull();
    expect(
      wrapLegacyList(
        Array.from({ length: 301 }, (_, i) => `r${i}`),
        1
      )
    ).toBeNull();
  });
});

describe('purgeTombstones', () => {
  it('drops only the tombstones older than the retention window', () => {
    const elements: ElementSet = {
      added: { r1: v(1_000), r2: v(5_000) },
      removed: { old: v(1_000), fresh: v(9_500) },
    };
    const purged = purgeTombstones(elements, 1_000, 10_000);
    expect(Object.keys(purged.removed)).toEqual(['fresh']);
    expect(purged.added).toEqual(elements.added); // additions are never touched
  });

  it('never purges when the retention is disabled (0)', () => {
    const elements = set([], ['old'], 1);
    expect(purgeTombstones(elements, 0, 1_000_000)).toEqual(elements);
  });
});

describe('parseTombstoneRetentionMs', () => {
  const DAY = 24 * 60 * 60 * 1000;
  it('reads a positive retention, 0 = disabled, and falls back on anything else', () => {
    expect(parseTombstoneRetentionMs(undefined)).toBeNull(); // not set
    expect(parseTombstoneRetentionMs('')).toBeNull();
    expect(parseTombstoneRetentionMs('0')).toBe(0);
    expect(parseTombstoneRetentionMs(String(90 * DAY))).toBe(90 * DAY);
    expect(parseTombstoneRetentionMs('  ')).toBeNull();
    expect(parseTombstoneRetentionMs('-5')).toBeNull();
    expect(parseTombstoneRetentionMs('abc')).toBeNull();
    expect(parseTombstoneRetentionMs('3.5')).toBeNull();
    expect(parseTombstoneRetentionMs(String(3_600_000))).toBeNull(); // less than a day
  });
});
