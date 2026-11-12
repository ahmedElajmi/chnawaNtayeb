/**
 * What to change in a search index so that it reflects `items`, knowing the items it was last
 * built from. Items are immutable: an item that changed is a new object, so comparing references
 * is enough (and costs nothing for thousands of items).
 */
export interface IndexPlan<T> {
  upsert: T[];
  remove: string[];
}

export function planIndexUpdate<T extends { id: string }>(
  indexed: ReadonlyMap<string, T>,
  items: readonly T[]
): IndexPlan<T> {
  const seen = new Set<string>();
  const upsert: T[] = [];
  for (const item of items) {
    seen.add(item.id);
    if (indexed.get(item.id) !== item) upsert.push(item);
  }
  const remove = [...indexed.keys()].filter((id) => !seen.has(id));
  return { upsert, remove };
}
