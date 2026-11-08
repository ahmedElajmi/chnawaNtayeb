/** Returns a new list with `value` added, or removed if it was already there. */
export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

/** Replaces the item with the same id, or adds it (at the end, or at the start with `prepend`). */
export function upsertById<T extends { id: string }>(list: readonly T[], item: T, prepend = false): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index >= 0) return list.map((x, i) => (i === index ? item : x));
  return prepend ? [item, ...list] : [...list, item];
}
