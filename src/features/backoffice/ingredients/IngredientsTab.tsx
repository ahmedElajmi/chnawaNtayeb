import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Pencil, Plus, Search } from 'lucide-react';
import {
  countIngredientUsage,
  hasImplausibleUnitPrice,
  type Ingredient,
  type PriceRange,
  type Recipe,
} from '@/core/catalog';
import { normalizeText } from '@/core/shared';
import type { ContentCompleteness, ItemStatus, ReviewSnapshot } from '@/core/review';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { LIST_FILTER_PARAM, patronPath, PATRON_PAGES } from '@/shared/paths';
import { useLanguage } from '@/app/providers/LanguageContext';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { ShowMore } from '@/shared/ui/ShowMore';
import { useIngredientCategories } from '@/shared/i18n/useIngredientCategories';
import { CompletenessMeter, NextActionLink, StatusBadge } from '../review/reviewUi';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useIngredientEditor } from '../shell/IngredientEditorContext';

const PRICE_INPUT =
  'w-16 px-2 py-1 text-xs font-bold text-right rounded-lg bg-surface border border-slate-200 dark:border-slate-700';

type QuickFilter = 'all' | 'to-enrich' | 'no-photo' | 'fixed-price' | 'unused' | 'unit-check';

const QUICK_FILTERS: { id: QuickFilter; label: (b: BackofficeTexts) => string }[] = [
  { id: 'all', label: (b) => b.filterAll },
  { id: 'to-enrich', label: (b) => b.filterToEnrich },
  { id: 'no-photo', label: (b) => b.filterNoPhoto },
  { id: 'fixed-price', label: (b) => b.ingFixedPrice },
  { id: 'unused', label: (b) => b.ingUnusedFilter },
  { id: 'unit-check', label: (b) => b.ingUnitCheck },
];

const CHIP = 'shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition';

/** Where an ingredient stands: validation status, and how complete its data is. */
export interface IngredientInfo {
  status: ItemStatus;
  snapshot?: ReviewSnapshot;
  completeness: ContentCompleteness;
}

interface IngredientListProps {
  /** Ingredients as the team sees them (work copy, else the version online) */
  ingredients: Ingredient[];
  recipes: Recipe[];
  infoOf: (ingredient: Ingredient) => IngredientInfo;
}

function IngredientList({ ingredients, recipes, infoOf }: IngredientListProps) {
  const b = useBackofficeText();
  const { t, getIngredientName, getSecondaryName, compareNames } = useLanguage();
  const { addIngredient, editIngredient, savePrices } = useIngredientEditor();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [params] = useSearchParams();
  const [quick, setQuick] = useState<QuickFilter>(() => {
    const asked = params.get(LIST_FILTER_PARAM);
    return QUICK_FILTERS.some((f) => f.id === asked) ? (asked as QuickFilter) : 'all';
  });
  const usage = useMemo(() => countIngredientUsage(recipes), [recipes]);
  const [prices, setPrices] = useState<Record<string, PriceRange>>({});
  const categories = useIngredientCategories();
  const categoryLabel = new Map(categories);
  const q = normalizeText(search.trim());
  const matchesQuick: Record<QuickFilter, (i: Ingredient) => boolean> = {
    all: () => true,
    'to-enrich': (i) => infoOf(i).completeness.percent < 100,
    'no-photo': (i) => !i.image_url,
    'fixed-price': (i) => i.price_min_tnd === i.price_max_tnd,
    unused: (i) => !usage.get(i.id),
    // Price that cannot be for one such unit (e.g. "g" with a pack price): costs ignore it until fixed
    'unit-check': (i) => hasImplausibleUnitPrice(i),
  };
  const filtered = ingredients
    .filter((i) => category === 'all' || i.category === category)
    .filter(matchesQuick[quick])
    .filter(
      (i) => !q || [i.name_fr, i.name_derja, i.name_ar, i.name_derja_ar ?? ''].some((n) => normalizeText(n).includes(q))
    )
    .sort(compareNames);
  const page = usePagedList(filtered, `${q}|${category}|${quick}`);
  const countOf = (f: QuickFilter) => ingredients.filter(matchesQuick[f]).length;
  const edited = Object.keys(prices).length;
  const rangeOf = (ing: Ingredient): PriceRange => prices[ing.id] ?? { min: ing.price_min_tnd, max: ing.price_max_tnd };
  const setBound = (ing: Ingredient, bound: keyof PriceRange, raw: string) => {
    const value = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(value)) return;
    setPrices((p) => ({ ...p, [ing.id]: { ...rangeOf(ing), [bound]: value } }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={b.searchIngredients}
            aria-label={b.searchIngredients}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
        </div>
        <div className="flex gap-2">
          {edited > 0 && (
            <button
              onClick={async () => {
                if (await savePrices(ingredients, prices)) setPrices({});
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-accent text-on-accent text-xs sm:text-sm font-bold hover:bg-accent-strong transition shadow-md"
            >
              {format(b.ingSavePrices, { count: edited })}
            </button>
          )}
          <button
            onClick={addIngredient}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {b.ingAdd}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-ink-muted">
        {b.ingredientsListHint} {b.ingPriceHint}
      </p>

      {/* What is left to complete, then categories */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={quick === id}
            onClick={() => setQuick(id)}
            className={`${CHIP} ${quick === id ? 'bg-accent text-on-accent border-accent' : 'bg-card border-line text-ink-muted hover:text-ink'}`}
          >
            {label(b)} ({countOf(id)})
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {[['all', b.allCategories] as const, ...categories].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={category === id}
            onClick={() => setCategory(id)}
            className={`${CHIP} ${category === id ? 'bg-brand text-on-brand border-brand' : 'bg-card border-line text-ink-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink-muted" aria-live="polite">
        {format(b.ingShown, { shown: filtered.length, total: ingredients.length })}
      </p>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
        {page.visible.map((ing) => {
          const range = rangeOf(ing);
          const invalid = range.min < 0 || range.max < range.min;
          const info = infoOf(ing);
          const name = getIngredientName(ing);
          return (
            <div
              key={ing.id}
              className="p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <div className="flex items-center gap-3 min-w-[11rem] flex-1">
                <IngredientThumb ingredient={ing} size="md" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-ink truncate">
                    <Link
                      to={patronPath(PATRON_PAGES.ingredients, ing.id)}
                      className="hover:text-brand-text hover:underline"
                    >
                      {name}
                    </Link>
                    {getSecondaryName(ing) && (
                      <span className="text-xs text-accent-text font-semibold ms-1.5">({getSecondaryName(ing)})</span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={info.status} />
                    <CompletenessMeter kind="ingredient" result={info.completeness} />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {categoryLabel.get(ing.category) ?? ing.category} · {format(b.ingUnit, { unit: ing.unit_default })}{' '}
                    · {usage.get(ing.id) ? format(b.ingUsedIn, { count: usage.get(ing.id)! }) : b.ingNoRecipe}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ms-auto">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={range.min}
                  onChange={(e) => setBound(ing, 'min', e.target.value)}
                  aria-label={format(b.ingPriceMin, { name })}
                  aria-invalid={invalid}
                  className={`${PRICE_INPUT} ${invalid ? 'border-rose-400 dark:border-rose-500' : ''}`}
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={range.max}
                  onChange={(e) => setBound(ing, 'max', e.target.value)}
                  aria-label={format(b.ingPriceMax, { name })}
                  aria-invalid={invalid}
                  className={`${PRICE_INPUT} ${invalid ? 'border-rose-400 dark:border-rose-500' : ''}`}
                />
                <span className="text-xs font-bold text-slate-500">{t.currency}</span>
                <span className="ms-1">
                  <NextActionLink kind="ingredient" id={ing.id} status={info.status} snapshot={info.snapshot} />
                </span>
                <button
                  type="button"
                  onClick={() => editIngredient(ing)}
                  aria-label={format(b.ingEdit, { name })}
                  title={b.ingEditHint}
                  className="ms-1 p-1.5 rounded-lg text-ink-muted hover:text-brand-text hover:bg-brand/10"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <ShowMore
        list={page}
        progressLabel={(shown, total) => format(t.listProgress, { shown, total })}
        buttonLabel={t.listShowMore}
      />
    </div>
  );
}

export function IngredientsTab(props: IngredientListProps) {
  return <IngredientList {...props} />;
}
