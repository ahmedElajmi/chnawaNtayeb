import { Link } from 'react-router';
import type { MatchingResult } from '@/core/matching';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useKitchen } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';
import { useRecipeCatalog, useRecipeFiltersInUrl, useRecipeMatches } from '@/features/recipes/hooks';
import type { RecipeFilters } from '@/features/recipes/recipeFilters';
import { CHIP_OFF, chip, RecipeFilterBar } from '@/features/recipes/components/RecipeFilterBar';
import { RecipeListTabs } from '@/features/recipes/components/RecipeListTabs';
import { RecipeGrid } from '@/features/recipes/RecipeGrid';
import { RecipeCategoryBrowser } from '@/features/recipes/components/RecipeCategoryBrowser';

/** Recipes suggested for the fridge, grouped by tier (ready / almost / ideas). */
export function SuggestionsPage() {
  const { t } = useLanguage();
  const { fridge } = useKitchen();
  const [filters, setFilters] = useRecipeFiltersInUrl(PATHS.suggestions);
  const catalog = useRecipeCatalog(filters);
  const { ready, almost, ideas } = useRecipeMatches(filters);
  const fridgeIsEmpty = fridge.length === 0;
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

  const emptyState = (title: string, desc: string) => (
    <div className="p-12 text-center rounded-2xl bg-card border border-slate-200 dark:border-slate-700 space-y-3">
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">{desc}</p>
      <Link to={PATHS.fridge} className="inline-block px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold">
        {t.btnOpenFridge}
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="sr-only">{t.recipesSuggestionsTab}</h1>
      <RecipeListTabs
        active={PATHS.suggestions}
        catalogCount={catalog.length}
        suggestionsCount={fridgeIsEmpty ? null : total}
      />

      {fridgeIsEmpty ? (
        emptyState(t.suggestionsEmptyTitle, t.suggestionsEmptyDesc)
      ) : (
        <>
          <RecipeFilterBar filters={filters} setFilters={setFilters}>
            {/* Tier switcher */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {[
                { id: 'all' as const, title: t.filterAll, count: total },
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
          </RecipeFilterBar>
          <RecipeCategoryBrowser filters={filters} setFilters={setFilters} />

          {total === 0 ? (
            emptyState(t.noResultsTitle, t.noResultsDesc)
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
                    <RecipeGrid results={tier.list} resetKey={`${tier.id}:${JSON.stringify(filters)}`} />
                  </section>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
