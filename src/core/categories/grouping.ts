import { expandCategories, type CategoryTree } from './tree';

export interface CategoryUsage {
  /** Items placed directly in this category */
  own: number;
  /** Items in this category or below it (each counted once) */
  total: number;
}

/** How many items each category holds, counted once on the whole list. */
export function categoryUsage(tree: CategoryTree, items: Iterable<readonly string[]>): Map<string, CategoryUsage> {
  const usage = new Map<string, CategoryUsage>();
  const at = (id: string) => usage.get(id) ?? usage.set(id, { own: 0, total: 0 }).get(id)!;
  for (const ids of items) {
    for (const id of new Set(ids)) if (tree.byId.has(id)) at(id).own += 1;
    for (const id of expandCategories(tree, ids)) at(id).total += 1;
  }
  return usage;
}

export interface CategoryGroup<T> {
  /** Category of the group; null for the items in no known category */
  id: string | null;
  items: T[];
}

/**
 * Items grouped by category, at a level of the tree (1 = families only): an item placed deeper
 * counts in its ancestor of that level; an item in several categories appears in each of its groups,
 * once per group. Groups follow the order of the tree, the items in no category come last.
 */
export function groupByCategory<T>(
  items: readonly T[],
  categoriesOf: (item: T) => readonly string[],
  tree: CategoryTree,
  level = 1
): CategoryGroup<T>[] {
  const groups = new Map<string, T[]>();
  const none: T[] = [];
  for (const item of items) {
    const keys = new Set<string>();
    for (const id of categoriesOf(item)) {
      const path = tree.byId.get(id)?.path;
      if (path) keys.add(path[Math.min(level, path.length) - 1]);
    }
    if (keys.size === 0) none.push(item);
    for (const key of keys) (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
  }
  const ordered: CategoryGroup<T>[] = tree.ordered
    .filter((n) => groups.has(n.category.id))
    .map((n) => ({ id: n.category.id, items: groups.get(n.category.id)! }));
  return none.length ? [...ordered, { id: null, items: none }] : ordered;
}
