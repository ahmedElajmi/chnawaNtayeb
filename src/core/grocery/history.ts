import type { GroceryItem } from './types';
import { createId, type IdFactory } from '../shared/id';

/** A shopping list archived when it was completed (see the grocery history screens). */
export interface GroceryHistoryEntry {
  id: string;
  archived_at: string;
  comment?: string;
  items: GroceryItem[];
  planned_cost_min?: number;
  planned_cost_max?: number;
  spent_tnd?: number;
}

export interface GroceryHistoryInput {
  id?: string;
  archived_at?: string;
  comment?: string;
  items: GroceryItem[];
  planned_cost_min?: number;
  planned_cost_max?: number;
  spent_tnd?: number;
}

const MAX_ITEMS = 500;
const MAX_COMMENT_LENGTH = 300;

const isValidItem = (item: unknown): item is GroceryItem =>
  !!item &&
  typeof item === 'object' &&
  typeof (item as GroceryItem).id === 'string' &&
  typeof (item as GroceryItem).name === 'string' &&
  typeof (item as GroceryItem).unit === 'string' &&
  typeof (item as GroceryItem).category === 'string' &&
  typeof (item as GroceryItem).is_checked === 'boolean' &&
  Number.isFinite((item as GroceryItem).quantity) &&
  (item as GroceryItem).quantity >= 0;

/** A non-negative amount, or undefined when absent; garbage (non-finite, negative) is null. */
const sanitizeAmount = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return value;
};

const sanitizeComment = (comment: unknown): string | undefined | null => {
  if (comment === undefined || comment === null) return undefined;
  if (typeof comment !== 'string') return null;
  return comment.trim().slice(0, MAX_COMMENT_LENGTH) || undefined;
};

/**
 * Builds a history entry from untrusted input, capping what can be capped (500 items,
 * a 300-character comment) and returning null when the data is garbage (not an object,
 * invalid items, negative or non-finite amounts).
 */
export function createGroceryHistoryEntry(
  input: GroceryHistoryInput,
  newId: IdFactory = createId
): GroceryHistoryEntry | null {
  if (!input || typeof input !== 'object' || !Array.isArray(input.items)) return null;
  if (!input.items.every(isValidItem)) return null;

  const spent = sanitizeAmount(input.spent_tnd);
  const plannedMin = sanitizeAmount(input.planned_cost_min);
  const plannedMax = sanitizeAmount(input.planned_cost_max);
  if (spent === null || plannedMin === null || plannedMax === null) return null;

  const comment = sanitizeComment(input.comment);
  if (comment === null) return null;

  const archivedAt =
    typeof input.archived_at === 'string' && input.archived_at ? input.archived_at : new Date().toISOString();

  const entry: GroceryHistoryEntry = {
    id: typeof input.id === 'string' && input.id ? input.id : newId('grocery_history'),
    archived_at: archivedAt,
    items: input.items.slice(0, MAX_ITEMS),
  };
  if (comment) entry.comment = comment;
  if (plannedMin !== undefined) entry.planned_cost_min = plannedMin;
  if (plannedMax !== undefined) entry.planned_cost_max = plannedMax;
  if (spent !== undefined) entry.spent_tnd = spent;
  return entry;
}
