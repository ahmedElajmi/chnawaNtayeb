import { parseStoredCategory } from '../../src/core/categories';
import { parseStoredCountry } from '../../src/core/accounts';
import { parseScenario } from '../../src/core/matching';
import { parseStoredIngredient, parseStoredRecipe } from '../../src/core/catalog';
import { parseTeamMember, parseWorkCopy, type ReviewKind } from '../../src/core/review';
import type { ParseDoc } from './types';

/**
 * The registry every collection must be declared in to exist for the storage layer.
 * It is also the source of truth of the future SQL conversion (one table per entry)
 * and of the import script — a collection missing here does not exist anywhere.
 */

export type CollectionAccess = {
  /** Who may read the change feed */
  read: 'public' | 'admin';
  /** Who may write */
  write: 'publisher' | 'manager';
  /** Maximum documents returned per change query (catch-up continues page by page) */
  pageLimit: number;
};

export interface CollectionSpec extends CollectionAccess {
  name: string;
  /** Revalidates a document coming from outside; null = dropped, never stored */
  parse: ParseDoc;
}

const workCopies =
  (kind: ReviewKind): ParseDoc =>
  (raw) =>
    parseWorkCopy(kind, raw) as Record<string, unknown> | null;

/** Team members keep their raw shape (uid, e-mail, role, rights the rules read). */
const adminsParser: ParseDoc = (raw) => (parseTeamMember(raw) ? (raw as Record<string, unknown>) : null);

export const COLLECTIONS: Readonly<Record<string, CollectionSpec>> = {
  recipes: {
    name: 'recipes',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredRecipe(r) as Record<string, unknown> | null,
  },
  ingredients: {
    name: 'ingredients',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredIngredient(r) as Record<string, unknown> | null,
  },
  recipe_categories: {
    name: 'recipe_categories',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredCategory(r) as Record<string, unknown> | null,
  },
  ingredient_categories: {
    name: 'ingredient_categories',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredCategory(r) as Record<string, unknown> | null,
  },
  countries: {
    name: 'countries',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredCountry(r) as Record<string, unknown> | null,
  },
  recipes_workspace: {
    name: 'recipes_workspace',
    read: 'admin',
    write: 'publisher',
    pageLimit: 300,
    parse: workCopies('recipe'),
  },
  ingredients_workspace: {
    name: 'ingredients_workspace',
    read: 'admin',
    write: 'publisher',
    pageLimit: 300,
    parse: workCopies('ingredient'),
  },
  matching_scenarios: {
    name: 'matching_scenarios',
    read: 'admin',
    write: 'manager',
    pageLimit: 300,
    parse: (r) => parseScenario(r) as Record<string, unknown> | null,
  },
  admins: { name: 'admins', read: 'admin', write: 'manager', pageLimit: 300, parse: adminsParser },
} as const satisfies Record<string, CollectionSpec>;

export function collectionSpec(name: string): CollectionSpec | null {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, name) ? (COLLECTIONS[name] ?? null) : null;
}

/** Collections a given access level may read from the change feed. */
export function readableCollections(read: CollectionAccess['read']): string[] {
  return Object.values(COLLECTIONS)
    .filter((c) => (read === 'admin' ? true : c.read === 'public'))
    .map((c) => c.name);
}
