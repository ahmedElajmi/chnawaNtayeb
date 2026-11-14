import { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { catalogHealth } from '@/core/catalog';
import { useReview } from '@/app/ContainerContext';
import { LIST_FILTER_PARAM, backofficePath, BACKOFFICE_PAGES, type BackofficePageId } from '@/shared/paths';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useIngredientEditor } from '../shell/IngredientEditorContext';
import { useReviewQueue } from './useReviewQueue';
import { useTeamRecipes } from './useTeamRecipes';

interface Todo {
  label: string;
  count: number;
  page: BackofficePageId;
  /** Filter given to the list (`?filtre=`) or grouping of the queue (`?groupe=`) */
  query?: string;
  /** Something that blocks or waits for the reviewer (shown first, in colour) */
  urgent?: boolean;
}

/**
 * "To do" on the backoffice home: what waits for the reviewer, then what is missing in the catalog
 * (counted on the whole lists by the domain), each line opening the filtered list.
 */
export function TodoList() {
  const b = useBackofficeText();
  const { store, workflow } = useReview('recipe');
  const recipes = useTeamRecipes();
  const { ingredients } = useIngredientEditor();
  const { counts } = useReviewQueue();
  const health = useMemo(() => catalogHealth(recipes, ingredients), [recipes, ingredients]);
  const toEnrich = useMemo(
    () => recipes.filter((r) => store.completeness(r).percent < 100).length,
    // The workflow changes the completeness checks
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [recipes, store, workflow]
  );

  const todos: Todo[] = [
    {
      label: format(b.todoReview, { count: counts.pending }),
      count: counts.pending,
      page: BACKOFFICE_PAGES.review,
      urgent: true,
    },
    {
      label: b.todoToFix,
      count: counts.toFix,
      page: BACKOFFICE_PAGES.recipes,
      query: `${LIST_FILTER_PARAM}=to_fix`,
      urgent: true,
    },
    {
      label: b.todoPublishable,
      count: counts.publishable,
      page: BACKOFFICE_PAGES.recipes,
      query: `${LIST_FILTER_PARAM}=review`,
      urgent: true,
    },
    {
      label: b.todoRecipesToEnrich,
      count: toEnrich,
      page: BACKOFFICE_PAGES.recipes,
      query: `${LIST_FILTER_PARAM}=to-enrich`,
    },
    {
      label: b.todoRecipesToTranslate,
      count: health.recipesToTranslate,
      page: BACKOFFICE_PAGES.recipes,
      query: `${LIST_FILTER_PARAM}=to-translate`,
    },
    {
      label: b.todoRecipesWithoutPhoto,
      count: health.recipesWithoutPhoto,
      page: BACKOFFICE_PAGES.recipes,
      query: `${LIST_FILTER_PARAM}=no-photo`,
    },
    {
      label: b.todoIngredientsUnitCheck,
      count: health.ingredientsUnitCheck,
      page: BACKOFFICE_PAGES.ingredients,
      query: `${LIST_FILTER_PARAM}=unit-check`,
    },
    {
      label: b.todoIngredientsWithoutPhoto,
      count: health.ingredientsWithoutPhoto,
      page: BACKOFFICE_PAGES.ingredients,
      query: `${LIST_FILTER_PARAM}=no-photo`,
    },
    {
      label: b.todoIngredientsUnused,
      count: health.ingredientsUnused,
      page: BACKOFFICE_PAGES.ingredients,
      query: `${LIST_FILTER_PARAM}=unused`,
    },
  ].filter((t) => t.count > 0);

  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-card border border-line space-y-2">
      <h2 className="text-sm font-extrabold">{b.todoTitle}</h2>
      {todos.length === 0 ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{b.todoNothing}</p>
      ) : (
        <ul className="divide-y divide-line">
          {todos.map((t) => (
            <li key={t.label}>
              <Link
                to={`${backofficePath(t.page)}${t.query ? `?${t.query}` : ''}`}
                className="flex items-center gap-3 py-2.5 text-sm hover:text-brand-text"
              >
                <span
                  className={`min-w-9 text-center px-2 py-0.5 rounded-full text-xs font-extrabold tabular-nums ${
                    t.urgent ? 'bg-brand text-on-brand' : 'bg-slate-100 dark:bg-slate-800 text-ink'
                  }`}
                >
                  {t.count}
                </span>
                <span className="flex-1 min-w-0">{t.label}</span>
                <ChevronRight className="w-4 h-4 text-ink-muted rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
