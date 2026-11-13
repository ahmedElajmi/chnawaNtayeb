import type { CategoryTree } from '@/core/categories';
import { CATEGORY_VISUALS, type CategoryVisual } from './ingredientVisuals';

/**
 * Look of an ingredient category: its own colours when it is built in, else those of its nearest
 * built-in ancestor ("Volaille" under "Viandes"), else "other"; its own emoji when it has one.
 */
export function ingredientVisualOf(tree: CategoryTree, category: string): CategoryVisual {
  const path = tree.byId.get(category)?.path ?? [category];
  const builtIn = [...path].reverse().find((id) => id in CATEGORY_VISUALS);
  const base = CATEGORY_VISUALS[builtIn ?? 'other'];
  const icon = tree.byId.get(category)?.category.icon;
  return icon ? { ...base, emoji: icon } : base;
}
