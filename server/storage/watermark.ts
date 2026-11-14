import type { CollectionName } from './types';

/**
 * In-memory watermark: the newest revision per collection, known without touching the
 * database. It is ONLY a fast-path optimisation — correctness never relies on it:
 * a poll whose client revisions are below an unknown watermark simply skips the shortcut
 * and computes the real delta, then re-derives the watermark from what it read.
 * A server restart empties this map: at most one heavier poll per client, then free again.
 */
const known = new Map<CollectionName, number>();

/** The remembered watermark, or null when unknown (never a wrong value). */
export function watermarkOf(name: CollectionName): number | null {
  return known.has(name) ? (known.get(name) as number) : null;
}

/** The write path itself raises the watermark: no database call needed to know it moved. */
export function raiseWatermark(name: CollectionName, revision: number): void {
  const current = known.get(name) ?? 0;
  if (revision > current) known.set(name, revision);
}

/** A change query re-derives the watermark from the highest revision it saw. */
export function deriveWatermark(name: CollectionName, revision: number): void {
  raiseWatermark(name, revision);
}

/** Testing helper: forget everything (simulates a restart). */
export function resetWatermarks(): void {
  known.clear();
}
