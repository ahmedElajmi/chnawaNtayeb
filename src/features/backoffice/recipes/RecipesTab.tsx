import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { recipeNeedsTranslation, type Recipe } from '@/core/catalog';
import type { ContentCompleteness, ItemStatus, ReviewSnapshot, WorkflowDefinition } from '@/core/review';
import { normalizeText, parseYouTubeId } from '@/core/shared';
import { useLanguage } from '@/app/providers/LanguageContext';
import { getRecipeCost, useCatalog } from '@/app/ContainerContext';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { LIST_FILTER_PARAM, patronPath, PATRON_PAGES } from '@/shared/paths';
import { ShowMore } from '@/shared/ui/ShowMore';
import { RecipeBadges } from '@/features/recipes/components/RecipeBadges';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { CompletenessMeter, NextActionLink, SegmentedProgress, StatusBadge } from '../review/reviewUi';

/** A recipe of the list: its work copy (or the version online when it has none) and where it stands. */
export interface RecipeRow {
  recipe: Recipe;
  status: ItemStatus;
  /** Absent for a recipe online that never went through the workspace */
  snapshot?: ReviewSnapshot;
  /** How complete its data is, validated or not */
  completeness: ContentCompleteness;
}

type Filter =
  'all' | 'online' | 'pending' | 'review' | 'to_fix' | 'incomplete' | 'to-enrich' | 'no-photo' | 'to-translate';

const FILTERS: { id: Filter; label: (b: BackofficeTexts) => string; match: (row: RecipeRow) => boolean }[] = [
  { id: 'all', label: (b) => b.filterAll, match: () => true },
  {
    id: 'review',
    label: (b) => b.filterToReview,
    match: ({ status: s }) => s === 'ready' || s === 'in_review' || s === 'publishable',
  },
  { id: 'to_fix', label: (b) => b.filterToFix, match: ({ status }) => status === 'to_fix' },
  { id: 'incomplete', label: (b) => b.filterIncomplete, match: ({ status }) => status === 'incomplete' },
  { id: 'pending', label: (b) => b.filterPending, match: ({ status }) => status === 'online_pending' },
  { id: 'online', label: (b) => b.filterOnline, match: ({ status: s }) => s === 'online' || s === 'online_pending' },
  { id: 'to-enrich', label: (b) => b.filterToEnrich, match: ({ completeness }) => completeness.percent < 100 },
  { id: 'no-photo', label: (b) => b.filterNoPhoto, match: ({ recipe }) => !recipe.image_url?.trim() },
  { id: 'to-translate', label: (b) => b.filterToTranslate, match: ({ recipe }) => recipeNeedsTranslation(recipe) },
];

type Sort = 'status' | 'name' | 'completeness';

/** What needs the reviewer first: sent back, incomplete, waiting, changes online, then online. */
const STATUS_ORDER: Record<ItemStatus, number> = {
  to_fix: 0,
  incomplete: 1,
  publishable: 2,
  in_review: 3,
  ready: 4,
  online_pending: 5,
  online: 6,
};

const CHIP = 'shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition';

interface RecipesTabProps {
  rows: RecipeRow[];
  workflow: WorkflowDefinition;
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  /** Opens the editor on a copy of the recipe (new, unpublished) */
  onDuplicateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
}

/**
 * Recipes of the backoffice: online ones and those in the validation workspace, with their status, a
 * small progress bar, and filters whose counts are taken on the whole list. Publishing goes through
 * the validation page of each recipe.
 */
export function RecipesTab({
  rows,
  workflow,
  onAddRecipe,
  onEditRecipe,
  onDuplicateRecipe,
  onDeleteRecipe,
}: RecipesTabProps) {
  const { t, getRecipeName, getSecondaryName, compareNames } = useLanguage();
  const b = useBackofficeText();
  const { ingredients } = useCatalog();
  const [search, setSearch] = useState('');
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => {
    const asked = params.get(LIST_FILTER_PARAM);
    return FILTERS.some((f) => f.id === asked) ? (asked as Filter) : 'all';
  });
  const q = normalizeText(search.trim());
  const searched = useMemo(
    () =>
      q
        ? rows.filter(({ recipe: r }) =>
            [r.name_fr, r.name_derja, r.name_ar, r.name_derja_ar ?? ''].some((n) => normalizeText(n).includes(q))
          )
        : rows,
    [rows, q]
  );
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, searched.filter(f.match).length])),
    [searched]
  ) as Record<Filter, number>;
  const current = FILTERS.find((f) => f.id === filter)!;
  const [sort, setSort] = useState<Sort>('status');
  const filtered = useMemo(() => {
    const list = searched.filter(current.match);
    const byName = (x: RecipeRow, y: RecipeRow) => compareNames(x.recipe, y.recipe);
    if (sort === 'name') return [...list].sort(byName);
    if (sort === 'completeness')
      return [...list].sort((x, y) => x.completeness.percent - y.completeness.percent || byName(x, y));
    return [...list].sort((x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || byName(x, y));
  }, [searched, current, sort, compareNames]);
  const page = usePagedList(filtered, `${q}|${filter}|${sort}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={b.searchRecipes}
            aria-label={b.searchRecipes}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
        </div>
        <button
          onClick={onAddRecipe}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.boAddRecipe}</span>
        </button>
      </div>

      <p className="text-[11px] text-ink-muted">{b.recipesListHint}</p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="group">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`${CHIP} ${
              filter === f.id
                ? 'bg-brand text-on-brand border-brand'
                : 'bg-card border-line text-ink hover:border-brand'
            }`}
          >
            {f.label(b)} <span className="tabular-nums opacity-80">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[11px] text-ink-muted">
        {b.sortLabel}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="px-2 py-1 rounded-lg bg-card border border-line text-xs text-ink"
        >
          <option value="status">{b.sortStatus}</option>
          <option value="name">{b.sortName}</option>
          <option value="completeness">{b.sortCompleteness}</option>
        </select>
      </label>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
        {page.visible.map(({ recipe: r, status, snapshot, completeness }) => (
          <div
            key={r.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={getRecipeName(r)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <img src="/mark.png" alt="" className="w-full h-full object-contain p-1.5 opacity-70" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                  <Link
                    to={patronPath(PATRON_PAGES.recipes, r.id)}
                    className="text-sm font-bold text-ink hover:text-brand-text hover:underline"
                  >
                    {getRecipeName(r)}
                  </Link>
                  {getSecondaryName(r) && (
                    <span className="text-xs text-accent-text font-semibold">({getSecondaryName(r)})</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <StatusBadge status={status} />
                  <RecipeBadges recipe={r} />
                  {parseYouTubeId(r.video_url) && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      ▶ {t.videoBadge}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{r.prep_time_minutes + r.cook_time_minutes} min</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatPriceRange(getRecipeCost(r, ingredients), 'DT')}
                  </span>
                  {snapshot && (
                    <>
                      <span>·</span>
                      <SegmentedProgress kind="recipe" snapshot={snapshot} workflow={workflow} compact />
                      <span className="tabular-nums">{snapshot.percent} %</span>
                    </>
                  )}
                </div>
                <div className="mt-1 max-w-full">
                  <CompletenessMeter kind="recipe" result={completeness} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <NextActionLink kind="recipe" id={r.id} status={status} snapshot={snapshot} />
              <button
                onClick={() => onEditRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title={t.boEditRecipe}
                aria-label={t.boEditRecipe}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDuplicateRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title={b.duplicateRecipe}
                aria-label={`${b.duplicateRecipe} · ${getRecipeName(r)}`}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500"
                title={t.boDeleteRecipe}
                aria-label={t.boDeleteRecipe}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ShowMore
        list={page}
        progressLabel={(shown, total) => format(t.listProgress, { shown, total })}
        buttonLabel={t.listShowMore}
      />
    </div>
  );
}
