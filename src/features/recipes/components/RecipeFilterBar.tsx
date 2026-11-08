import type { ReactNode } from 'react';
import { Heart, Leaf, Search } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useKitchen } from '@/app/ContainerContext';
import type { RecipeFilters } from '../recipeFilters';

export const chip = (active: boolean, on: string, off: string) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${active ? on : off}`;
export const CHIP_OFF = 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300';

interface RecipeFilterBarProps {
  filters: RecipeFilters;
  setFilters: (patch: Partial<RecipeFilters>) => void;
  /** Extra row at the bottom of the bar (the tier switcher of the suggestions) */
  children?: ReactNode;
}

/** Search, favorites, budget, time, course and healthy filters shared by the two recipe lists. */
export function RecipeFilterBar({ filters, setFilters, children }: RecipeFilterBarProps) {
  const { t } = useLanguage();
  const { favorites } = useKitchen();

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            placeholder="Rechercher par nom de plat (ojja, couscous, kafteji...)"
            aria-label="Rechercher une recette"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilters({ favoritesOnly: !filters.favoritesOnly })}
            aria-pressed={filters.favoritesOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              filters.favoritesOnly
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                : 'bg-card border-slate-200 dark:border-slate-700 text-slate-600'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-rose-500' : ''}`} />
            <span>Favoris ({favorites.length})</span>
          </button>

          <select
            value={filters.maxBudget ?? ''}
            onChange={(e) => setFilters({ maxBudget: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Budget maximum"
            className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-card border border-slate-200 dark:border-slate-700"
          >
            <option value="">Budget : Tous</option>
            {[5, 10, 15, 25].map((v) => (
              <option key={v} value={v}>
                &lt; {v} DT
              </option>
            ))}
          </select>

          <select
            value={filters.maxTime ?? ''}
            onChange={(e) => setFilters({ maxTime: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Temps maximum"
            className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-card border border-slate-200 dark:border-slate-700"
          >
            <option value="">Temps : Tous</option>
            {[15, 30, 45].map((v) => (
              <option key={v} value={v}>
                &lt; {v} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course (entrée / plat / dessert) and healthy filters */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
        {(
          [
            ['all', t.courseAll],
            ['entree', t.courseEntreePlural],
            ['plat_principal', t.courseMainPlural],
            ['dessert', t.courseDessertPlural],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilters({ course: id })}
            aria-pressed={filters.course === id}
            className={chip(filters.course === id, 'bg-brand text-on-brand shadow-xs', CHIP_OFF)}
          >
            {label}
          </button>
        ))}
        <span className="w-px h-5 bg-line mx-1 shrink-0" aria-hidden="true" />
        <button
          onClick={() => setFilters({ healthyOnly: !filters.healthyOnly })}
          aria-pressed={filters.healthyOnly}
          className={`inline-flex items-center gap-1 border ${chip(
            filters.healthyOnly,
            'bg-emerald-600 border-emerald-600 text-white',
            'bg-card border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300'
          )}`}
        >
          <Leaf className="w-3.5 h-3.5" />
          {t.healthyLabel}
        </button>
      </div>

      {children}
    </div>
  );
}
