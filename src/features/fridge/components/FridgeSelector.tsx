import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Trash2, Check, ArrowRight, Package, X, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { Ingredient, STAPLE_INGREDIENT_IDS, ingredientPriceRange } from '@/core/catalog';
import type { NewGroceryItem } from '@/core/grocery';
import { sortBySearchScore } from '@/core/search';
import { categoryUsage, categoryWithDescendants } from '@/core/categories';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { useSearchMatches } from '@/app/ContainerContext';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { PhotoScannerModal } from '@/features/fridge/components/PhotoScannerModal';
import { AddToCartButton } from '@/features/fridge/components/AddToCartButton';
import confetti from 'canvas-confetti';

interface FridgeSelectorProps {
  allIngredients: Ingredient[];
  selectedIds: string[];
  pantryIds: string[];
  onTogglePantry: (id: string) => void;
  usedIngredientIds: Set<string>;
  onToggleIngredient: (id: string) => void;
  onClearAll: () => void;
  onSearchRecipes: () => void;
  /** Adds one ingredient to the shopping list (never touches the fridge) */
  onAddToGrocery: (item: NewGroceryItem) => void;
}

/** Selected ingredients shown before "show all" in the summary. */
const SELECTED_PREVIEW_COUNT = 12;

export const FridgeSelector: React.FC<FridgeSelectorProps> = ({
  allIngredients,
  selectedIds,
  pantryIds,
  onTogglePantry,
  usedIngredientIds,
  onToggleIngredient,
  onClearAll,
  onSearchRecipes,
  onAddToGrocery,
}) => {
  const { t, getIngredientName } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showAllSelected, setShowAllSelected] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pantrySet = useMemo(() => new Set(pantryIds), [pantryIds]);
  const selectedIngredients = useMemo(() => {
    const byId = new Map(allIngredients.map((i) => [i.id, i]));
    return selectedIds.map((id) => byId.get(id)).filter((i): i is Ingredient => !!i);
  }, [allIngredients, selectedIds]);
  const visibleSelected = showAllSelected ? selectedIngredients : selectedIngredients.slice(0, SELECTED_PREVIEW_COUNT);
  // Pantry candidates: usual staples + anything the user already put in the pantry
  const pantryCandidates = useMemo(
    () => allIngredients.filter((i) => STAPLE_INGREDIENT_IDS.has(i.id) || pantrySet.has(i.id)),
    [allIngredients, pantrySet]
  );

  // Managed categories (tree): the families first, then the sub-categories of the open one; only
  // the categories holding ingredients are offered
  const categoryNames = useCategoryNames('ingredient');
  const { tree } = categoryNames;
  const usage = useMemo(
    () =>
      categoryUsage(
        tree,
        allIngredients.map((i) => [i.category])
      ),
    [tree, allIngredients]
  );
  const offered = (ids: string[]) => ids.filter((id) => (usage.get(id)?.total ?? 0) > 0);
  const activePath = tree.byId.get(activeCategory)?.path ?? [];
  const categories = [
    { id: 'all', label: t.filterAll },
    ...offered(tree.roots.map((n) => n.category.id)).map((id) => ({ id, label: categoryNames.name(id) })),
  ];
  // Sub-categories under the open family (and under an open sub-category, its own)
  const subLevels = activePath
    .map((id) => offered(tree.byId.get(id)!.children.map((n) => n.category.id)))
    .filter((ids) => ids.length > 0);
  const inActive = useMemo(
    () => (activeCategory === 'all' ? null : categoryWithDescendants(tree, activeCategory)),
    [tree, activeCategory]
  );

  // Search engine answer (typos, derja spellings, Arabic); until it answers, the simple filter below applies
  const searchMatches = useSearchMatches('ingredients', searchQuery);

  const filteredIngredients = useMemo(() => {
    const kept = allIngredients.filter((ing) => {
      // Category filter
      if (inActive && !inActive.has(ing.category)) {
        return false;
      }
      if (searchMatches) return searchMatches.has(ing.id);
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          ing.name_fr.toLowerCase().includes(q) ||
          ing.name_derja.toLowerCase().includes(q) ||
          ing.name_ar.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
    return searchMatches ? sortBySearchScore(kept, (ing) => ing.id, searchMatches) : kept;
  }, [allIngredients, inActive, searchQuery, searchMatches]);

  const handleTriggerSearch = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2D5A27', '#C75128', '#D99B26'],
      });
    } catch {}
    onSearchRecipes();
  };

  return (
    <div className="w-full space-y-6">
      {/* Everything selected so far, at a glance (the grid below can be long) */}
      {selectedIngredients.length > 0 && (
        <section className="p-3 sm:p-4 rounded-2xl bg-card border border-line shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">
              {t.selectedIngredientsTitle}{' '}
              <span className="text-ink-muted font-semibold">({selectedIngredients.length})</span>
            </h2>
            <button
              onClick={onClearAll}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-accent-text transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t.clearSelection}</span>
            </button>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {visibleSelected.map((ing) => {
              const name = getIngredientName(ing);
              return (
                <li key={ing.id} className="max-w-full">
                  <button
                    type="button"
                    onClick={() => onToggleIngredient(ing.id)}
                    aria-label={`${t.removeIngredientLabel} ${name}`}
                    className="max-w-full inline-flex items-center gap-1.5 ps-1 pe-1.5 py-1 rounded-full bg-brand/10 border border-brand-text/40 text-brand-text text-xs font-semibold hover:bg-brand/20 transition"
                  >
                    <IngredientThumb ingredient={ing} size="xs" round />
                    <span className="truncate">{name}</span>
                    <X className="w-3 h-3 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedIngredients.length > SELECTED_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllSelected(!showAllSelected)}
              aria-expanded={showAllSelected}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-text hover:underline"
            >
              {showAllSelected
                ? t.showLessLabel
                : `${t.showAllLabel} (+${selectedIngredients.length - SELECTED_PREVIEW_COUNT})`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllSelected ? 'rotate-180' : ''}`} />
            </button>
          )}
        </section>
      )}

      {/* Top Controls & AI Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scan Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-strong text-white text-xs sm:text-sm font-bold shadow-md shadow-brand/20 hover:brightness-110 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="whitespace-nowrap">{t.btnScanPhoto}</span>
          </button>
        </div>
      </div>

      {/* Pantry: always-available items, never counted as missing */}
      <details
        className="group rounded-2xl bg-card border border-line"
        open={pantryIds.length === 0 ? true : undefined}
      >
        <summary className="flex items-center gap-2 p-3 sm:p-4 cursor-pointer list-none">
          <Package className="w-4 h-4 text-brand-text shrink-0" />
          <span className="text-sm font-bold text-ink">{t.pantryTitle}</span>
          <span className="text-xs text-ink-muted">({pantryIds.length})</span>
          <span className="ml-auto text-xs text-ink-muted group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-3 sm:px-4 pb-4 space-y-2">
          <p className="text-xs text-ink-muted">{t.pantryDesc}</p>
          <div className="flex flex-wrap gap-1.5">
            {pantryCandidates.map((ing) => {
              const on = pantrySet.has(ing.id);
              return (
                <button
                  key={ing.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onTogglePantry(ing.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                    on
                      ? 'bg-brand text-on-brand border-brand'
                      : 'bg-surface text-ink-muted border-line hover:border-brand'
                  }`}
                >
                  {on && <Check className="w-3 h-3" />}
                  {getIngredientName(ing)}
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* Category Pills (Functional Filter Buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id || activePath[0] === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                isSelected
                  ? 'bg-brand text-on-brand shadow-xs'
                  : 'bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      {subLevels.map((ids, level) => (
        <div
          key={activePath[level]}
          className="flex gap-1.5 overflow-x-auto no-scrollbar -mt-3 ps-2 border-s-2 border-brand/30"
        >
          {ids.map((id) => {
            const isSelected = activePath[level + 1] === id;
            return (
              <button
                key={id}
                onClick={() => setActiveCategory(isSelected ? activePath[level] : id)}
                aria-pressed={isSelected}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition ${
                  isSelected
                    ? 'bg-brand/15 text-brand-text border border-brand-text/40'
                    : 'bg-card text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {categoryNames.name(id)}
              </button>
            );
          })}
        </div>
      ))}

      {/* Ingredients Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {filteredIngredients.map((ing) => {
          const isChosen = selectedSet.has(ing.id);
          const inPantry = pantrySet.has(ing.id);
          const isUnused = !usedIngredientIds.has(ing.id);
          const name = getIngredientName(ing);

          return (
            <div
              key={ing.id}
              className={`group relative flex items-stretch rounded-xl border text-start transition min-h-[60px] min-w-0 ${
                isChosen
                  ? 'bg-brand/10 border-brand-text text-brand-text shadow-xs'
                  : 'bg-card border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
              }`}
              title={isUnused ? t.noRecipeYet : undefined}
            >
              {/* Fridge toggle: same behavior as before, on its own button */}
              <button
                type="button"
                onClick={() => onToggleIngredient(ing.id)}
                aria-pressed={isChosen}
                className={`flex flex-1 items-center gap-2.5 p-2 pe-1.5 text-start transition active:scale-97 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl ${
                  isUnused && !isChosen ? 'opacity-55' : ''
                }`}
              >
                <span className="relative shrink-0">
                  <IngredientThumb ingredient={ing} size="md" />
                  {/* Check mark pinned on the picture corner */}
                  <span
                    className={`absolute -top-1 -end-1 w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-card transition ${
                      isChosen
                        ? 'bg-brand text-on-brand scale-100'
                        : 'bg-card border border-slate-300 dark:border-slate-600 scale-90 group-hover:border-brand'
                    }`}
                  >
                    {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </span>

                <span className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold truncate">{name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {isUnused
                      ? t.noRecipeYet
                      : inPantry && !isChosen
                        ? t.inPantry
                        : `${formatPriceRange(ingredientPriceRange(ing), t.currency)} / ${ing.unit_default}`}
                  </span>
                </span>
              </button>

              {/* Shopping list: distinct trailing action, never toggles the fridge */}
              <AddToCartButton
                label={t.cartAddLabel.replace('{name}', name)}
                addedLabel={t.cartAddedLabel}
                onAdd={() =>
                  onAddToGrocery({
                    ingredient_id: ing.id,
                    name,
                    quantity: 1,
                    unit: ing.unit_default,
                    category: ing.category,
                  })
                }
              />
            </div>
          );
        })}
      </div>

      {/* Selected Items Floating Bar / Bottom CTA Banner */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-20 md:bottom-6 z-30 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-line shadow-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center font-extrabold text-xs">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-ink">
                {selectedIds.length} {t.selectedCount}
              </span>
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-500 hover:text-accent-text transition inline-flex items-center gap-1 text-left"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.clearSelection}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleTriggerSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-on-brand font-bold text-xs sm:text-sm hover:bg-brand-strong shadow-lg shadow-brand/25 active:scale-95 transition"
          >
            <span>{t.cookNowAction}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Photo Scanner Modal */}
      <PhotoScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        availableIngredients={allIngredients}
        onAddIngredients={(newIds) => {
          newIds.forEach((id) => {
            if (!selectedSet.has(id)) {
              onToggleIngredient(id);
            }
          });
        }}
      />
    </div>
  );
};
