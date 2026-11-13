import { useLanguage } from '@/app/providers/LanguageContext';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';
import { useRecipeCatalog, useRecipeFiltersInUrl, useRecipeMatches } from './hooks';
import { RecipeFilterBar } from './components/RecipeFilterBar';
import { RecipeListTabs } from './components/RecipeListTabs';
import { RecipeCategoryBrowser } from './components/RecipeCategoryBrowser';
import { RecipeGrid } from './RecipeGrid';
import { DEFAULT_RECIPE_FILTERS } from './recipeFilters';

/** The whole recipe catalog, with filters (recipes that fit the fridge come first). */
export function RecipesPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useRecipeFiltersInUrl(PATHS.recipes);
  const catalog = useRecipeCatalog(filters);
  const { ready, almost, ideas } = useRecipeMatches(filters);
  const { fridge } = useKitchen();
  const { recipes, remoteChecked } = useCatalog();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="sr-only">{t.recipesAllTab}</h1>
      <RecipeListTabs
        active={PATHS.recipes}
        catalogCount={catalog.length}
        suggestionsCount={fridge.length === 0 ? null : ready.length + almost.length + ideas.length}
      />
      <RecipeFilterBar filters={filters} setFilters={setFilters} />
      <RecipeCategoryBrowser filters={filters} setFilters={setFilters} />

      {recipes.length === 0 && !remoteChecked ? (
        <div className="h-40 rounded-2xl bg-card border border-line animate-pulse" aria-busy="true" />
      ) : recipes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-base font-bold text-ink">{t.catalogSoonTitle}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.catalogSoonDesc}</p>
        </div>
      ) : catalog.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-slate-200 dark:border-slate-700 space-y-3">
          <p className="text-base font-bold text-ink">{t.catalogEmptyTitle}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.catalogEmptyDesc}</p>
          <button
            onClick={() => setFilters({ ...DEFAULT_RECIPE_FILTERS })}
            className="inline-block px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
          >
            {t.resetFiltersLabel}
          </button>
        </div>
      ) : (
        <RecipeGrid results={catalog} resetKey={JSON.stringify(filters)} />
      )}
    </div>
  );
}
