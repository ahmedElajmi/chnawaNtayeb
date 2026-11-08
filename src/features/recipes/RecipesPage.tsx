import { Heart, Leaf, Search } from 'lucide-react';
import { Link } from 'react-router';
import type { MatchingResult } from '@/core/matching';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useKitchen } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';
import { useRecipeFiltersInUrl, useRecipeMatches } from './hooks';
import type { RecipeFilters } from './recipeFilters';
import { RecipeGrid } from './RecipeGrid';

const chip = (active: boolean, on: string, off: string) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${active ? on : off}`;
const CHIP_OFF = 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300';

export function RecipesPage() {
  const { t } = useLanguage();
  const { favorites } = useKitchen();
  const [filters, setFilters] = useRecipeFiltersInUrl();
  const { ready, almost, ideas } = useRecipeMatches(filters);
  const total = ready.length + almost.length + ideas.length;

  const tiers: { id: RecipeFilters['tier']; title: string; desc: string; dot: string; list: MatchingResult[] }[] = [
    { id: 'ready', title: t.tierReadyTitle, desc: t.tierReadyDesc, dot: 'bg-brand', list: ready },
    { id: 'almost', title: t.tierAlmostTitle, desc: t.tierAlmostDesc, dot: 'bg-accent', list: almost },
    { id: 'ideas', title: t.tierIdeasTitle, desc: t.tierIdeasDesc, dot: 'bg-slate-400', list: ideas },
  ];
  const tierChipStyle: Record<RecipeFilters['tier'], [string, string]> = {
    all: ['bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900', CHIP_OFF],
    ready: ['bg-brand text-on-brand shadow-xs', 'bg-brand/10 text-brand-text'],
    almost: ['bg-accent text-on-accent shadow-xs', 'bg-accent/10 text-accent-text'],
    ideas: ['bg-slate-700 text-white', CHIP_OFF],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="sr-only">{t.navRecipes}</h1>

      {/* Filter bar */}
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

        {/* Tier switcher */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as const, title: 'Tous', count: total },
            ...tiers.map((x) => ({ ...x, count: x.list.length })),
          ].map(({ id, title, count }) => (
            <button
              key={id}
              onClick={() => setFilters({ tier: id })}
              aria-pressed={filters.tier === id}
              className={chip(filters.tier === id, ...tierChipStyle[id])}
            >
              {title} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Results by tier */}
      {total === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-slate-200 dark:border-slate-700 space-y-3">
          <p className="text-base font-bold text-ink">{t.noResultsTitle}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.noResultsDesc}</p>
          <Link
            to={PATHS.fridge}
            className="inline-block px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
          >
            {t.btnOpenFridge}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {tiers
            .filter((tier) => (filters.tier === 'all' || filters.tier === tier.id) && tier.list.length > 0)
            .map((tier) => (
              <section key={tier.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`} />
                  <h2 className="font-extrabold text-sm sm:text-base text-ink">
                    {tier.title} ({tier.list.length})
                  </h2>
                  <span className="text-xs text-slate-400">· {tier.desc}</span>
                </div>
                <RecipeGrid results={tier.list} />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
