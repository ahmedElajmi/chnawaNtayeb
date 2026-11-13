import type { ContentCategory } from './types';

/** A category placed in its tree. */
export interface CategoryNode {
  category: ContentCategory;
  parent: CategoryNode | null;
  children: CategoryNode[];
  /** 1 for a root */
  depth: number;
  /** Ids from the root down to this category (itself included) */
  path: string[];
}

export interface CategoryTree {
  roots: CategoryNode[];
  byId: ReadonlyMap<string, CategoryNode>;
  /** Every node, parents before children, siblings in order */
  ordered: CategoryNode[];
}

const bySiblingOrder = (a: CategoryNode, b: CategoryNode) =>
  a.category.order - b.category.order || a.category.name_fr.localeCompare(b.category.name_fr);

/**
 * Builds the tree once (lists, filters and counts read it). A category whose parent is unknown
 * (deleted elsewhere) or that would close a loop is shown as a root: nothing is lost.
 */
export function buildCategoryTree(list: readonly ContentCategory[]): CategoryTree {
  const known = new Map(list.filter((c) => !c.deleted).map((c) => [c.id, c]));
  // A parent chain that comes back to the category itself is a loop: that category becomes a root
  const parentOf = (c: ContentCategory): string | null => {
    if (!c.parent_id || !known.has(c.parent_id)) return null;
    const seen = new Set([c.id]);
    for (let p = known.get(c.parent_id); p; p = p.parent_id ? known.get(p.parent_id) : undefined) {
      if (seen.has(p.id)) return null;
      seen.add(p.id);
    }
    return c.parent_id;
  };
  const nodes = new Map<string, CategoryNode>();
  for (const category of known.values())
    nodes.set(category.id, { category, parent: null, children: [], depth: 1, path: [] });
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parentId = parentOf(node.category);
    const parent = parentId ? nodes.get(parentId)! : null;
    node.parent = parent;
    (parent ? parent.children : roots).push(node);
  }
  const ordered: CategoryNode[] = [];
  const visit = (node: CategoryNode, parentPath: string[]) => {
    node.path = [...parentPath, node.category.id];
    node.depth = node.path.length;
    node.children.sort(bySiblingOrder);
    ordered.push(node);
    node.children.forEach((child) => visit(child, node.path));
  };
  roots.sort(bySiblingOrder).forEach((root) => visit(root, []));
  return { roots, byId: nodes, ordered };
}

/** The category and its ancestors (an item in "Chorba" is also in "Ramadan" and "Occasions"). */
export function categoryWithAncestors(tree: CategoryTree, id: string): string[] {
  return tree.byId.get(id)?.path ?? [];
}

/** The category and everything below it. */
export function categoryWithDescendants(tree: CategoryTree, id: string): Set<string> {
  const result = new Set<string>();
  const visit = (node: CategoryNode) => {
    result.add(node.category.id);
    node.children.forEach(visit);
  };
  const node = tree.byId.get(id);
  if (node) visit(node);
  return result;
}

/** Ids of the categories an item belongs to, ancestors included, without duplicates. */
export function expandCategories(tree: CategoryTree, ids: readonly string[]): Set<string> {
  const result = new Set<string>();
  for (const id of ids) for (const x of categoryWithAncestors(tree, id)) result.add(x);
  return result;
}

/** Names of a category and its ancestors ("Occasions › Ramadan"), with the given name reader. */
export function categoryPath(tree: CategoryTree, id: string, name: (c: ContentCategory) => string): string[] {
  return categoryWithAncestors(tree, id).map((x) => name(tree.byId.get(x)!.category));
}
