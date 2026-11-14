import type { GroceryItem } from './types';

export interface GroceryShareOptions {
  /** Currency label, reserved for a future cost line in the message */
  currency?: string;
  /** First line of the message ("Courses de la semaine" by default) */
  title?: string;
  /** Optional note shown under the title */
  comment?: string;
  /** Prefix of already-bought items (default "✅"); empty string hides them from the message */
  checkedLabel?: string;
}

/** Formats a quantity without trailing zeros: 1.5, 8, 0.25... */
function formatQuantity(quantity: number): string {
  const rounded = Math.round(quantity * 100) / 100;
  return String(rounded);
}

/**
 * WhatsApp-ready text of a shopping list: a title, an optional comment, then one
 * section per aisle with its items ("☐ name (quantity unit)"). Checked items keep
 * their place with the checked prefix so the list stays ordered as a store walk.
 */
export function buildGroceryShareText(
  groups: { category: string; items: GroceryItem[] }[],
  options: GroceryShareOptions = {}
): string {
  const title = options.title ?? 'Courses';
  const checkedLabel = options.checkedLabel === undefined ? '✅' : options.checkedLabel;
  const lines: string[] = [title];

  if (options.comment) lines.push(options.comment);

  for (const group of groups) {
    lines.push('', group.category);
    for (const item of group.items) {
      const prefix = item.is_checked ? checkedLabel : '☐';
      if (!prefix) continue; // empty checked label: bought items are left out
      const amount = `${formatQuantity(item.quantity)} ${item.unit}`.trim();
      lines.push(`${prefix} ${item.name} (${amount})`);
    }
  }

  return lines.join('\n');
}
