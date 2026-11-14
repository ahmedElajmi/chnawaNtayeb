import type { GroceryItem } from './types';

/**
 * Store walk order for the built-in ingredient categories (see ../catalog/types):
 * fresh produce first, then the counter (meats, fish, dairy), dry goods, and
 * "other" always last. Custom (backoffice) categories are appended after the list.
 */
export const AISLE_ORDER: readonly string[] = [
  'vegetables',
  'fruits',
  'meats',
  'fish',
  'dairy_eggs',
  'grains_pasta',
  'spices_condiments',
  'canned_pantry',
  'other',
];

const aisleRank = (category: string): number => {
  const index = AISLE_ORDER.indexOf(category);
  // Unknown (custom) categories come after every built-in aisle, 'other' included
  return index === -1 ? AISLE_ORDER.length : index;
};

/**
 * Groups shopping items per aisle, ordered as a store walk (AISLE_ORDER), unknown
 * categories after. Checked items are kept as-is; empty aisles are not listed.
 */
export function groupByAisle(items: GroceryItem[]): { category: string; items: GroceryItem[] }[] {
  const groups = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const group = groups.get(item.category);
    if (group) group.push(item);
    else groups.set(item.category, [item]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const rankDiff = aisleRank(a) - aisleRank(b);
      // Alphabetical tie-break so custom categories stay deterministic
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    })
    .map(([category, groupItems]) => ({ category, items: groupItems }));
}
