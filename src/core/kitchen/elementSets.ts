/**
 * Multi-device element sets for the three kitchen sections that behave as sets
 * (favorites, fridge, pantry).
 *
 * A plain list of ids cannot carry a deletion: an absent id means "never added" as much
 * as "removed", which is why a union merge made deletions impossible to propagate between
 * devices (a removed element came back from any device that still held it).
 *
 * Instead, each element carries its own **hybrid logical clock** version —
 * `(physical ms, counter, deviceId)`, compared lexicographically:
 * - mostly wall-clock order: an edit made offline keeps its place against remote events;
 * - a total order: the counter splits events of the same device, the device id splits devices;
 * - safe against skewed clocks: a device never issues a version older than one it observed.
 *
 * The stored shape keeps only the two version maps (`added`, `removed`); the visible id list
 * is derived — an element is present when its `added` version beats its `removed` version
 * (`compare > 0`; an exact tie counts as removed). The `removed` entries are the tombstones:
 * they are what carries a deletion to the other devices, so they are kept here. The server
 * drops the ones older than its retention window, and a device that has not synced within
 * that window resets itself and re-adopts the server document — together the two rules make
 * the purge safe (a device able to resurrect an element is wiped before the tombstone is).
 */

/** One hybrid logical clock version: compare lexicographically (physical, counter, device). */
export interface ElementVersion {
  /** Client wall-clock in ms at issue time (the HLC physical part) */
  physical: number;
  /** Events issued at the same physical ms by the same device (the HLC counter) */
  counter: number;
  /** Stable per-installation id: departs devices that issue the same (physical, counter) */
  device: string;
}

/** One set section as stored: the two version maps; presence is derived from them. */
export interface ElementSet {
  added: Record<string, ElementVersion>;
  removed: Record<string, ElementVersion>;
}

/** This device's clock state: never goes backwards (absorbs every version it observes). */
export interface DeviceClock extends ElementVersion {}

/** The three sections that behave as sets (the rest of the kitchen syncs newest-write-wins). */
export const SET_SECTIONS = ['favorites', 'fridge', 'pantry'] as const;
export type SetSectionName = (typeof SET_SECTIONS)[number];

/** Bounds of one element set (same spirit as the server's per-section caps). */
export const ELEMENT_SET_LIMITS = {
  /** Elements that can be present at once (the visible list cap) */
  added: 300,
  /** Tombstones kept per section (lifetime deletions within the retention window) */
  removed: 2000,
  /** One element id */
  id: 200,
  /** One device id */
  device: 64,
} as const;

/** Default server retention of the tombstones (90 days), and the device reset margin under it. */
export const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
/** A device that has not synced for this long resets itself before the server purges (7 days of
 * clock-skew margin under the retention): a device that could resurrect an element is wiped first. */
export const STALE_DEVICE_MS = TOMBSTONE_RETENTION_MS - 7 * 24 * 60 * 60 * 1000;

/** The server-reserved device id inside sync versions (lot F1 § 7.5): only the server's own
 *  legacy projection writes it, so a version carrying it in a pushed map is an ECHO of the
 *  projection — never a business operation. Real device ids always contain a dash
 *  (`crypto.randomUUID()` or the `<ts36>-<random>` fallback of `storage.deviceId()`), so they
 *  can never equal this literal: the disjointness is structural, not conventional. */
export const RESERVED_SYNC_DEVICE = 'server';

export const EMPTY_ELEMENT_SET: ElementSet = { added: {}, removed: {} };

const EMPTY_SET = (): ElementSet => ({ added: {}, removed: {} });

/** Lexicographic comparison of two versions: < 0, 0, or > 0. */
export function compareVersions(a: ElementVersion, b: ElementVersion): number {
  if (a.physical !== b.physical) return a.physical - b.physical;
  if (a.counter !== b.counter) return a.counter - b.counter;
  if (a.device === b.device) return 0;
  return a.device < b.device ? -1 : 1;
}

/** True when the element is present: it has an `added` version newer than its `removed` one. */
export function isPresent(set: ElementSet, id: string): boolean {
  const added = set.added[id];
  if (!added) return false;
  const removed = set.removed[id];
  return !removed || compareVersions(added, removed) > 0;
}

/** The visible id list, derived from the two maps (insertion order of the `added` map). */
export function presentIds(set: ElementSet): string[] {
  return Object.keys(set.added).filter((id) => isPresent(set, id));
}

/** Merges two element sets: per map, per id, the newest version wins (commutative). */
export function mergeElementSets(a: ElementSet, b: ElementSet): ElementSet {
  const merged = EMPTY_SET();
  for (const [id, version] of Object.entries(a.added)) merged.added[id] = version;
  for (const [id, version] of Object.entries(b.added)) {
    const current = merged.added[id];
    if (!current || compareVersions(version, current) > 0) merged.added[id] = version;
  }
  for (const [id, version] of Object.entries(a.removed)) merged.removed[id] = version;
  for (const [id, version] of Object.entries(b.removed)) {
    const current = merged.removed[id];
    if (!current || compareVersions(version, current) > 0) merged.removed[id] = version;
  }
  return merged;
}

/** The newest version among a set's maps (null when it holds none). */
export function newestVersion(set: ElementSet): ElementVersion | null {
  let newest: ElementVersion | null = null;
  for (const version of [...Object.values(set.added), ...Object.values(set.removed)]) {
    if (!newest || compareVersions(version, newest) > 0) newest = version;
  }
  return newest;
}

/** One local event: the clock ticks (never backwards) and issues the version to record. */
export function tickClock(clock: DeviceClock, nowMs: number): { clock: DeviceClock; version: ElementVersion } {
  const physical = nowMs > clock.physical ? nowMs : clock.physical;
  const counter = physical === clock.physical ? clock.counter + 1 : 0;
  const next = { physical, counter, device: clock.device };
  return { clock: next, version: next };
}

/** Absorbs a version observed from another device: this device's clock stays ahead of it. */
export function receiveVersion(clock: DeviceClock, remote: ElementVersion): DeviceClock {
  if (remote.physical > clock.physical) return { physical: remote.physical, counter: 0, device: clock.device };
  if (remote.physical < clock.physical) return clock;
  return { physical: clock.physical, counter: Math.max(clock.counter, remote.counter) + 1, device: clock.device };
}

/**
 * Reads one set section coming from outside this code (server payload, stored document).
 * Accepts the current shape ({ added, removed }) and rejects anything malformed. When a map
 * goes over its cap, the oldest versions are dropped (bounded storage, a push is never refused).
 */
export function parseElementSet(raw: unknown): ElementSet | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { added?: unknown; removed?: unknown };
  const added = parseVersionMap(shape.added, ELEMENT_SET_LIMITS.added);
  const removed = parseVersionMap(shape.removed, ELEMENT_SET_LIMITS.removed);
  return added === null || removed === null ? null : { added, removed };
}

/**
 * Wraps a legacy plain id list (the shape stored before element sets existed) into a set:
 * every id counts as added at the given physical time, issued by a `legacy` device —
 * tombstone-less, so a pre-migration deletion may reappear once per device (documented).
 */
export function wrapLegacyList(ids: unknown, physical: number): ElementSet | null {
  if (!Array.isArray(ids) || ids.length > ELEMENT_SET_LIMITS.added) return null;
  if (!ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= ELEMENT_SET_LIMITS.id)) return null;
  const added: Record<string, ElementVersion> = {};
  for (const id of ids) added[id] = { physical, counter: 0, device: 'legacy' };
  return { added, removed: {} };
}

/** Drops the tombstones older than the retention duration (ms); 0 or less = never purge. */
export function purgeTombstones(set: ElementSet, retentionMs: number, nowMs: number): ElementSet {
  if (retentionMs <= 0) return set;
  const cutoff = nowMs - retentionMs;
  const removed: Record<string, ElementVersion> = {};
  for (const [id, version] of Object.entries(set.removed)) {
    if (version.physical > cutoff) removed[id] = version;
  }
  return { added: set.added, removed };
}

/**
 * Reads the server tombstone retention from the environment (ms). Null when unset or wrong:
 * an invalid value falls back to the default instead of silently disabling the purge.
 * `0` means "never purge" (the escape hatch; the device reset margin follows the default).
 */
export function parseTombstoneRetentionMs(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || !Number.isFinite(value)) return null;
  if (value === 0) return 0;
  return value >= 24 * 60 * 60 * 1000 ? value : null;
}

/** Per-id map of versions: shape-checked, capped (the oldest versions dropped beyond the cap). */
function parseVersionMap(raw: unknown, cap: number): Record<string, ElementVersion> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  const map: Record<string, ElementVersion> = {};
  for (const [id, value] of entries) {
    if (id.length === 0 || id.length > ELEMENT_SET_LIMITS.id) return null;
    const version = parseVersion(value);
    if (!version) return null;
    map[id] = version;
  }
  if (entries.length <= cap) return map;
  // Over the cap: keep the newest versions (bounded, deterministic, never refuses a push)
  return Object.fromEntries(
    Object.entries(map)
      .sort(([, a], [, b]) => compareVersions(b, a))
      .slice(0, cap)
  );
}

function parseVersion(raw: unknown): ElementVersion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { physical?: unknown; counter?: unknown; device?: unknown };
  if (typeof shape.physical !== 'number' || !Number.isFinite(shape.physical) || shape.physical <= 0) return null;
  if (typeof shape.counter !== 'number' || !Number.isInteger(shape.counter) || shape.counter < 0) return null;
  if (
    typeof shape.device !== 'string' ||
    shape.device.length === 0 ||
    shape.device.length > ELEMENT_SET_LIMITS.device
  ) {
    return null;
  }
  return { physical: shape.physical, counter: shape.counter, device: shape.device };
}
