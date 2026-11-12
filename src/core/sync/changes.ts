/**
 * Incremental synchronization of a shared collection (recipes, ingredients...).
 * Each stored item carries a `revision` (increasing number set by the database on every
 * write) so a device only asks for what changed since the newest revision it knows.
 * A deletion is published as a marker (`deleted: true`) so other devices learn about it.
 */
export interface Versioned {
  id: string;
  /** Set by the database on every write; absent on items saved before synchronization existed */
  revision?: number;
  /** Deletion marker: the item was removed by the admin */
  deleted?: boolean;
}

/** What changed in a collection: items written (or marked deleted) and ids removed outright. */
export interface CollectionChanges<T extends Versioned> {
  items: T[];
  removedIds: string[];
}

/** Newest revision among the items (0 when none has one). */
export function latestRevision(items: readonly Versioned[], since = 0): number {
  let max = since;
  for (const item of items) if (typeof item.revision === 'number' && item.revision > max) max = item.revision;
  return max;
}

/**
 * Applies changes to a list in a single pass: changed items replace the current ones in
 * place, new ones are appended, deletion markers and removed ids disappear. The order of
 * untouched items is kept and the input list is not modified.
 */
export function applyChanges<T extends Versioned>(current: readonly T[], changes: CollectionChanges<T>): T[] {
  if (changes.items.length === 0 && changes.removedIds.length === 0) return current as T[];
  const changed = new Map<string, T>();
  for (const item of changes.items) changed.set(item.id, item);
  const removed = new Set(changes.removedIds);
  const next: T[] = [];
  for (const item of current) {
    if (removed.has(item.id)) continue;
    const update = changed.get(item.id);
    if (update) {
      changed.delete(item.id);
      if (!update.deleted) next.push(update);
    } else next.push(item);
  }
  for (const item of changed.values()) if (!item.deleted && !removed.has(item.id)) next.push(item);
  return next;
}

/** Items still visible (deletion markers left out). */
export function withoutDeleted<T extends Versioned>(items: readonly T[]): T[] {
  return items.filter((item) => !item.deleted);
}

/** A raw stored entry that is only a deletion marker (no content to read). */
export function isDeletionMarker(raw: unknown): raw is Versioned & { deleted: true } {
  return typeof raw === 'object' && raw !== null && (raw as Versioned).deleted === true;
}
