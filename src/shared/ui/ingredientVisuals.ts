import type { BuiltInIngredientCategory } from '@/core/catalog';

/** Visual identity of a category, used when an ingredient has no photo (display only). */
export interface CategoryVisual {
  emoji: string;
  /** Tailwind classes: soft gradient background + ring, light and dark */
  tile: string;
}

export const CATEGORY_VISUALS: Record<BuiltInIngredientCategory | string, CategoryVisual> = {
  vegetables: {
    emoji: '🥕',
    tile: 'from-emerald-50 to-lime-100 ring-emerald-200/70 dark:from-emerald-950/60 dark:to-lime-900/40 dark:ring-emerald-800/60',
  },
  fruits: {
    emoji: '🍊',
    tile: 'from-orange-50 to-amber-100 ring-orange-200/70 dark:from-orange-950/60 dark:to-amber-900/40 dark:ring-orange-800/60',
  },
  meats: {
    emoji: '🥩',
    tile: 'from-rose-50 to-red-100 ring-rose-200/70 dark:from-rose-950/60 dark:to-red-900/40 dark:ring-rose-800/60',
  },
  fish: {
    emoji: '🐟',
    tile: 'from-sky-50 to-cyan-100 ring-sky-200/70 dark:from-sky-950/60 dark:to-cyan-900/40 dark:ring-sky-800/60',
  },
  dairy_eggs: {
    emoji: '🥚',
    tile: 'from-amber-50 to-yellow-50 ring-amber-200/60 dark:from-stone-900 dark:to-amber-950/50 dark:ring-amber-900/60',
  },
  grains_pasta: {
    emoji: '🌾',
    tile: 'from-yellow-50 to-amber-100 ring-amber-200/70 dark:from-yellow-950/50 dark:to-amber-900/40 dark:ring-amber-800/60',
  },
  spices_condiments: {
    emoji: '🌶️',
    tile: 'from-red-50 to-orange-100 ring-red-200/70 dark:from-red-950/60 dark:to-orange-900/40 dark:ring-red-800/60',
  },
  canned_pantry: {
    emoji: '🥫',
    tile: 'from-slate-50 to-slate-200 ring-slate-200 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-700',
  },
  other: {
    emoji: '🧺',
    tile: 'from-stone-50 to-stone-100 ring-stone-200 dark:from-stone-800 dark:to-stone-900 dark:ring-stone-700',
  },
};
