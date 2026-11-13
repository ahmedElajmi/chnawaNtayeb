import { normalizeText } from '../shared';
import { buildCategoryTree, categoryWithDescendants, type CategoryTree } from './tree';
import { CATEGORY_ID_PATTERN, MAX_CATEGORY_DEPTH, type ContentCategory } from './types';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const text = (v: unknown) => (typeof v === 'string' ? v : '');

/** Reads a category coming from outside (database, device copy, backup); null when unusable. */
export function parseStoredCategory(raw: unknown): ContentCategory | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || !CATEGORY_ID_PATTERN.test(raw.id)) return null;
  if (raw.deleted === true) return null;
  const name_fr = text(raw.name_fr).trim();
  if (!name_fr) return null;
  const category: ContentCategory = {
    id: raw.id,
    parent_id: typeof raw.parent_id === 'string' && raw.parent_id !== raw.id ? raw.parent_id : null,
    name_fr,
    name_derja: text(raw.name_derja),
    name_ar: text(raw.name_ar),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : 0,
  };
  if (text(raw.name_derja_ar).trim()) category.name_derja_ar = text(raw.name_derja_ar);
  if (text(raw.icon).trim()) category.icon = text(raw.icon).trim().slice(0, 8);
  if (raw.built_in === true) category.built_in = true;
  if (typeof raw.revision === 'number') category.revision = raw.revision;
  return category;
}

export const parseStoredCategories = (list: readonly unknown[]): ContentCategory[] =>
  list.flatMap((raw) => {
    const category = parseStoredCategory(raw);
    return category ? [category] : [];
  });

/**
 * The stored categories completed by the built-in ones: a built-in category edited by the admin is
 * stored like any other, the others come from the code.
 */
export function withBuiltInCategories(
  stored: readonly ContentCategory[],
  builtIn: readonly ContentCategory[]
): ContentCategory[] {
  const ids = new Set(stored.map((c) => c.id));
  return [
    ...stored.map((c) => (builtIn.some((b) => b.id === c.id) ? { ...c, built_in: true } : c)),
    ...builtIn.filter((c) => !ids.has(c.id)),
  ];
}

export type CategoryProblem =
  'id-invalid' | 'name-required' | 'name-taken' | 'parent-unknown' | 'parent-loop' | 'too-deep';

export interface CategoryError {
  field: 'id' | 'name' | 'parent';
  problem: CategoryProblem;
}

/** Levels below a category (0 for a leaf). */
function heightOf(tree: CategoryTree, id: string): number {
  const node = tree.byId.get(id);
  if (!node || node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map((c) => heightOf(tree, c.category.id)));
}

/**
 * Checks a category before it is saved, against the others: id, French name (unique among its
 * siblings), parent that exists and is not the category or one of its descendants, depth of the
 * whole branch within MAX_CATEGORY_DEPTH.
 */
export function validateCategory(candidate: ContentCategory, all: readonly ContentCategory[]): CategoryError[] {
  const errors: CategoryError[] = [];
  if (!CATEGORY_ID_PATTERN.test(candidate.id)) errors.push({ field: 'id', problem: 'id-invalid' });
  const name = normalizeText(candidate.name_fr.trim());
  if (!name) errors.push({ field: 'name', problem: 'name-required' });
  const others = all.filter((c) => c.id !== candidate.id && !c.deleted);
  const tree = buildCategoryTree([...others, candidate]);
  if (
    name &&
    others.some(
      (c) => (c.parent_id ?? null) === (candidate.parent_id ?? null) && normalizeText(c.name_fr.trim()) === name
    )
  )
    errors.push({ field: 'name', problem: 'name-taken' });
  if (candidate.parent_id) {
    if (!others.some((c) => c.id === candidate.parent_id)) errors.push({ field: 'parent', problem: 'parent-unknown' });
    else {
      const before = buildCategoryTree(all.filter((c) => !c.deleted));
      if (categoryWithDescendants(before, candidate.id).has(candidate.parent_id))
        errors.push({ field: 'parent', problem: 'parent-loop' });
      else {
        const parentDepth = tree.byId.get(candidate.parent_id)?.depth ?? 0;
        if (parentDepth + 1 + heightOf(before, candidate.id) > MAX_CATEGORY_DEPTH)
          errors.push({ field: 'parent', problem: 'too-deep' });
      }
    }
  }
  return errors;
}

/** Why a category cannot be deleted. */
export type DeletionBlocker = 'built-in' | 'has-children' | 'in-use';
/** Why a change of categories was refused (the account's rights included). */
export type CategoryWriteBlocker = DeletionBlocker | 'denied';

/** Why a category cannot be deleted (null when it can). */
export function deletionBlocker(
  tree: CategoryTree,
  id: string,
  usage: ReadonlyMap<string, { own: number; total: number }>
): DeletionBlocker | null {
  const node = tree.byId.get(id);
  if (!node) return null;
  if (node.category.built_in) return 'built-in';
  if (node.children.length > 0) return 'has-children';
  if ((usage.get(id)?.own ?? 0) > 0) return 'in-use';
  return null;
}

/** Ids a category can be moved under: any category but itself and its descendants, within the depth. */
export function possibleParents(tree: CategoryTree, id: string | null): string[] {
  const excluded = id ? categoryWithDescendants(tree, id) : new Set<string>();
  const height = id ? heightOf(tree, id) : 0;
  return tree.ordered
    .filter((n) => !excluded.has(n.category.id) && n.depth + 1 + height <= MAX_CATEGORY_DEPTH)
    .map((n) => n.category.id);
}
