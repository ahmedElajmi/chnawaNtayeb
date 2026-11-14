import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import type { Ingredient } from '@/core/catalog';
import { sortBySearchScore } from '@/core/search';
import { useSearchMatches } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { ingredientPriceRange } from '@/core/catalog';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { UnitInfo } from '@/shared/ui/UnitInfo';

/** Maximum suggestions rendered while typing (filtering happens on the whole catalog). */
const MAX_SUGGESTIONS = 20;

interface GroceryIngredientPickerProps {
  /** Catalog ingredients to pick from */
  ingredients: Ingredient[];
  /** Adds one catalog ingredient to the list (unit = its default unit) */
  onAddIngredient: (ingredient: Ingredient) => void;
  /** Adds one free-text article to the list (custom item, "pièce") */
  onAddCustom: (name: string) => void;
}

/**
 * Add form of the shopping list: type to search the catalog, click (or press Enter) a
 * suggestion to add it with its default unit. A collapsed free-text field stays available
 * for anything that is not in the catalog.
 */
export const GroceryIngredientPicker: React.FC<GroceryIngredientPickerProps> = ({
  ingredients,
  onAddIngredient,
  onAddCustom,
}) => {
  const { t, getIngredientName, compareNames } = useLanguage();
  const categoryNames = useCategoryNames('ingredient');
  const [query, setQuery] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  // Search engine answer (typos, derja spellings, Arabic); until it answers, the simple name filter applies
  const searchMatches = useSearchMatches('ingredients', query);

  const matches = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    const kept = ingredients.filter((ing) => {
      if (searchMatches) return searchMatches.has(ing.id);
      return (
        ing.name_fr.toLowerCase().includes(q) ||
        ing.name_derja.toLowerCase().includes(q) ||
        ing.name_ar.toLowerCase().includes(q)
      );
    });
    const ranked = searchMatches
      ? sortBySearchScore(kept, (ing) => ing.id, searchMatches)
      : [...kept].sort((a, b) => compareNames(a, b));
    return ranked.slice(0, MAX_SUGGESTIONS);
  }, [ingredients, query, searchMatches, compareNames]);

  const addIngredient = (ing: Ingredient) => {
    onAddIngredient(ing);
    setQuery('');
  };

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name) return;
    onAddCustom(name);
    setCustomName('');
  };

  return (
    <div className="space-y-2">
      {/* Catalog search: suggestions appear as the user types */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches.length > 0) {
              e.preventDefault();
              addIngredient(matches[0]);
            } else if (e.key === 'Escape') {
              setQuery('');
            }
          }}
          placeholder={t.groceryPickerSearchPlaceholder}
          aria-label={t.groceryPickerSearchLabel}
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={matches.length > 0 ? 'grocery-ingredient-suggestions' : undefined}
          className="w-full ps-10 pe-4 py-2.5 min-h-[44px] rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand shadow-xs"
        />
      </div>

      {query.trim() && (
        <div
          id="grocery-ingredient-suggestions"
          className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs"
        >
          {matches.length === 0 ? (
            <p className="p-4 text-sm font-semibold text-slate-500 text-center">{t.groceryPickerNoResults}</p>
          ) : (
            <ul>
              {matches.map((ing) => {
                const name = getIngredientName(ing);
                const icon = categoryNames.tree.byId.get(ing.category)?.category?.icon ?? '🛍️';
                const range = ingredientPriceRange(ing);
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      onClick={() => addIngredient(ing)}
                      aria-label={t.groceryPickerAddItem.replace('{name}', name)}
                      className="w-full flex items-center gap-2.5 p-2.5 min-h-[44px] text-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <IngredientThumb ingredient={ing} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{name}</span>
                        <span className="block text-xs text-slate-500 truncate">
                          {icon} · <UnitInfo unit={ing.unit_default} />
                        </span>
                      </span>
                      {/* Price range of one purchase unit, when the backoffice set prices */}
                      {range.max > 0 && (
                        <span className="text-xs font-bold text-brand-text shrink-0">
                          {formatPriceRange(range, t.currency)}
                        </span>
                      )}
                      <Plus className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Free-text fallback, collapsed by default: anything the catalog does not know */}
      <div className="rounded-2xl bg-card border border-line shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setCustomOpen((open) => !open)}
          aria-expanded={customOpen}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
        >
          <ShoppingBag className="w-4 h-4 text-accent-text shrink-0" />
          <span className="flex-1 text-start">{t.groceryPickerCustomToggle}</span>
          {customOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>
        {customOpen && (
          <form onSubmit={addCustom} className="flex gap-2 p-2.5 pt-0">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t.addManualItem}
              aria-label={t.addManualItem}
              className="flex-1 min-w-0 px-3 py-2 min-h-[44px] rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              className="px-4 min-h-[44px] rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition flex items-center gap-1 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addBtn}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
