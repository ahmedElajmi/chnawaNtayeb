import type { Versioned } from '../sync';

/** What a list of categories sorts: recipes (several categories each) or ingredients (one each). */
export type CategoryKind = 'recipe' | 'ingredient';
export const CATEGORY_KINDS: readonly CategoryKind[] = ['recipe', 'ingredient'];

/**
 * A category managed in the backoffice, in a tree of any depth ("Occasions › Ramadan › Chorba").
 * Its name is a localized field (`name_<language>`, read with localizedField). Items keep the id of
 * their category, so moving a branch never touches them.
 */
export interface ContentCategory extends Versioned {
  /** Parent category; null for a root (a family of categories) */
  parent_id: string | null;
  name_fr: string;
  name_derja: string;
  name_ar: string;
  name_derja_ar?: string;
  /** Position among its siblings */
  order: number;
  /** Emoji shown with the name (and on an ingredient without photo) */
  icon?: string;
  /** Built in the code: can be renamed, moved and reordered, never deleted */
  built_in?: boolean;
}

/** Deepest level shown and edited (1 = roots). */
export const MAX_CATEGORY_DEPTH = 4;

/** Allowed characters of a category id (also checked by the database rules). */
export const CATEGORY_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;
