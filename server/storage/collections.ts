import { parseStoredCategory } from '../../src/core/categories';
import { parseStoredCountry, resolveUserProfile } from '../../src/core/accounts';
import { parseScenario } from '../../src/core/matching';
import { parseStoredIngredient, parseStoredRecipe } from '../../src/core/catalog';
import { parseStoredUnitInfo } from '../../src/core/units';
import { parseTeamMember, parseWorkCopy, type ReviewKind } from '../../src/core/review';
import type { ParseDoc } from './types';

/**
 * The registry every collection must be declared in to exist for the storage layer.
 * It is also the source of truth of the future SQL conversion (one table per entry)
 * and of the import script — a collection missing here does not exist anywhere.
 */

export type CollectionAccess = {
  /**
   * Who may read the change feed: 'public' (every visitor), 'admin' (proved managers) or
   * 'server' (never served by the data endpoints: used by the server itself, converted too).
   */
  read: 'public' | 'admin' | 'server';
  /** Who may write: 'publisher', 'manager', or 'server' (never through the endpoints) */
  write: 'publisher' | 'manager' | 'server';
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

/** Password credentials: only the PHC string, its algorithm and the lockout counters. */
const authParser: ParseDoc = (raw) => {
  const d = raw as Record<string, unknown>;
  return typeof d.password_phc === 'string' && d.password_phc.startsWith('$') ? { ...d } : null;
};

/** Team members keep their raw shape (uid, e-mail, role, rights the rules read). */
const adminsParser: ParseDoc = (raw) => (parseTeamMember(raw) ? (raw as Record<string, unknown>) : null);

/** Historical snapshots and themes keep their raw shape: the domain reads them back itself. */
const rawDoc: ParseDoc = (raw) => (raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : null);

/** Personal kitchen document: carries its uid; the sections are validated by /api/kitchen before any write. */
const kitchenParser: ParseDoc = (raw) => {
  const d = raw as Record<string, unknown>;
  return d &&
    typeof d === 'object' &&
    typeof d.uid === 'string' &&
    typeof d.sections === 'object' &&
    d.sections !== null
    ? { ...d }
    : null;
};

/** Archived grocery-run snapshot: one per uid + entry id; fields are validated by /api/kitchen/history. */
const kitchenHistoryParser: ParseDoc = (raw) => {
  const d = raw as Record<string, unknown>;
  return d && typeof d === 'object' && typeof d.uid === 'string' && typeof d.entry_id === 'string' ? { ...d } : null;
};

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
  // Unit descriptions ("c.à.s" → "Cuillère à soupe…"): public read, publisher write; the id is
  // the slugified unit label (unitIdFromLabel, checked by UNIT_ID_PATTERN)
  units: {
    name: 'units',
    read: 'public',
    write: 'publisher',
    pageLimit: 300,
    parse: (r) => parseStoredUnitInfo(r) as Record<string, unknown> | null,
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
  // Themes: visitors read the published ones through /api/themes (published filter); the drafts
  // and the writes stay manager-side, so the change feed never leaks a draft.
  themes: { name: 'themes', read: 'admin', write: 'publisher', pageLimit: 300, parse: rawDoc },
  // Version histories: written only by the atomic commit of the workflow (write 'server'),
  // read by the backoffice.
  recipes_versions: { name: 'recipes_versions', read: 'admin', write: 'server', pageLimit: 300, parse: rawDoc },
  ingredients_versions: {
    name: 'ingredients_versions',
    read: 'admin',
    write: 'server',
    pageLimit: 300,
    parse: rawDoc,
  },
  matching_settings_versions: {
    name: 'matching_settings_versions',
    read: 'admin',
    write: 'server',
    pageLimit: 300,
    parse: rawDoc,
  },
  review_settings_versions: {
    name: 'review_settings_versions',
    read: 'admin',
    write: 'server',
    pageLimit: 300,
    parse: rawDoc,
  },
  admins: { name: 'admins', read: 'admin', write: 'manager', pageLimit: 300, parse: adminsParser },
  // Server-only collections: never served by the data endpoints, still converted to SQL.
  users: {
    name: 'users',
    read: 'server',
    write: 'server',
    pageLimit: 0,
    parse: (r) =>
      resolveUserProfile(r)
        ? { ...(r as Record<string, unknown>), id: String((r as Record<string, unknown>).uid ?? '') }
        : null,
  },
  auth: { name: 'auth', read: 'server', write: 'server', pageLimit: 0, parse: authParser },
  settings: { name: 'settings', read: 'server', write: 'server', pageLimit: 0, parse: null as unknown as ParseDoc },
  // The personal kitchen data of one account (fridge, favorites, menu, shopping list):
  // one document per uid, written only by /api/kitchen after a session check.
  kitchen: { name: 'kitchen', read: 'server', write: 'server', pageLimit: 0, parse: kitchenParser },
  // Archived grocery-run snapshots of one account: written only by /api/kitchen/history
  // after a session check, one document per uid + entry id, capped per uid by the route.
  kitchen_history: {
    name: 'kitchen_history',
    read: 'server',
    write: 'server',
    pageLimit: 0,
    parse: kitchenHistoryParser,
  },
} as const satisfies Record<string, CollectionSpec>;

export function collectionSpec(name: string): CollectionSpec | null {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, name) ? (COLLECTIONS[name] ?? null) : null;
}
