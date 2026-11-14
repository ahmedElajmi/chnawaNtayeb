import React, { useMemo, useState } from 'react';
import { Search, Plus, ShoppingBag } from 'lucide-react';
import type { Ingredient } from '@/core/catalog';
import type { GroceryItem } from '@/core/grocery';
import { AISLE_ORDER } from '@/core/grocery';
import { sortBySearchScore } from '@/core/search';
import { useSearchMatches, useUnitOptions } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { ingredientPriceRange } from '@/core/catalog';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { UnitInfo } from '@/shared/ui/UnitInfo';

/** Maximum suggestions rendered while typing (filtering happens on the whole catalog). */
const MAX_SUGGESTIONS = 20;

/** A search shorter than this shows nothing: too early to guess. */
const MIN_QUERY_LENGTH = 2;

/** Raw unit label (domain data, not translated) of the default custom article unit. */
const DEFAULT_CUSTOM_UNIT = 'pièce';

/** Select value of the "another unit" choice, resolved to a free-text unit. */
const OTHER_UNIT = '__other__';

/** Shape of the shared unit options delivered by the units wave (Agent D). */
type UnitOption = { label: string; kind: 'mass' | 'volume' | 'count' | 'other' };

interface GroceryIngredientPickerProps {
  /** Catalog ingredients to pick from */
  ingredients: Ingredient[];
  /** Items of the active list, to flag the suggestions that are already in it */
  listItems: GroceryItem[];
  /** Adds one catalog ingredient to the list (unit = its default unit; an existing line merges) */
  onAddIngredient: (ingredient: Ingredient) => void;
  /** Adds one free-text article with the chosen unit (custom item, no catalog entry) */
  onAddCustom: (name: string, unit: string) => void;
}

interface CustomArticleFormProps {
  /** Name of the article to create (the current search query) */
  name: string;
  unitOptions: UnitOption[];
  onAdd: (name: string, unit: string) => void;
}

/** Unit selector + free-text "other" unit, then the add action for a catalog-free article. */
const CustomArticleForm: React.FC<CustomArticleFormProps> = ({ name, unitOptions, onAdd }) => {
  const { t } = useLanguage();
  const [unit, setUnit] = useState(DEFAULT_CUSTOM_UNIT);
  const [otherUnit, setOtherUnit] = useState('');
  const effectiveUnit = unit === OTHER_UNIT ? otherUnit.trim() : unit;
  const canAdd = Boolean(effectiveUnit);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    onAdd(name, effectiveUnit);
    setUnit(DEFAULT_CUSTOM_UNIT);
    setOtherUnit('');
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label={t.customUnitUnitLabel}
          className="px-3 py-2 min-h-[40px] rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {unitOptions.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
          <option value={OTHER_UNIT}>{t.customUnitOther}</option>
        </select>
        {unit === OTHER_UNIT && (
          <input
            type="text"
            value={otherUnit}
            onChange={(e) => setOtherUnit(e.target.value)}
            placeholder={t.customUnitOtherPlaceholder}
            aria-label={t.customUnitUnitLabel}
            className="flex-1 min-w-[8rem] px-3 py-2 min-h-[40px] rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
        )}
        <button
          type="submit"
          disabled={!canAdd}
          className="inline-flex items-center gap-1 px-3.5 min-h-[40px] rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm active:scale-95 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          <span>{t.customUnitAddAsArticle}</span>
        </button>
      </div>
    </form>
  );
};

/**
 * Add form of the shopping list: type to search the catalog, click (or press Enter) a
 * suggestion to add it with its default unit. Suggestions are grouped by aisle, like the
 * list itself. Anything the catalog does not know becomes a custom article with a chosen
 * unit (the last row when there are results, the whole card when there are none).
 */
export const GroceryIngredientPicker: React.FC<GroceryIngredientPickerProps> = ({
  ingredients,
  listItems,
  onAddIngredient,
  onAddCustom,
}) => {
  const { t, getIngredientName, compareNames } = useLanguage();
  const categoryNames = useCategoryNames('ingredient');
  const [query, setQuery] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  // Search engine answer (typos, derja spellings, Arabic); until it answers, the simple name filter applies
  const searchMatches = useSearchMatches('ingredients', query);

  // Unit choices of the custom article (shared units wave); "pièce" is always the default
  const catalogUnits = useUnitOptions();
  const unitOptions = useMemo(() => {
    const options = catalogUnits.map(({ label, kind }) => ({ label, kind }));
    if (!options.some((option) => option.label === DEFAULT_CUSTOM_UNIT)) {
      options.unshift({ label: DEFAULT_CUSTOM_UNIT, kind: 'count' });
    }
    return options;
  }, [catalogUnits]);

  const matches = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return [];
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

  // Suggestions grouped per aisle, ordered as a store walk (custom categories after)
  const groups = useMemo(() => {
    const byCategory = new Map<string, Ingredient[]>();
    for (const ing of matches) {
      const group = byCategory.get(ing.category);
      if (group) group.push(ing);
      else byCategory.set(ing.category, [ing]);
    }
    return Array.from(byCategory.entries())
      .sort(([a], [b]) => {
        const rankDiff = AISLE_ORDER.indexOf(a) - AISLE_ORDER.indexOf(b);
        return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
      })
      .map(([category, groupItems]) => ({ category, items: groupItems }));
  }, [matches]);

  // Suggestions already in the active list get a badge; adding one again merges the lines
  const inList = useMemo(() => {
    const ids = new Set(listItems.map((item) => item.ingredient_id).filter(Boolean));
    const names = new Set(listItems.map((item) => item.name.trim().toLowerCase()));
    return (ing: Ingredient) => ids.has(ing.id) || names.has(getIngredientName(ing).trim().toLowerCase());
  }, [listItems, getIngredientName]);

  const addIngredient = (ing: Ingredient) => {
    onAddIngredient(ing);
    setQuery('');
  };

  const addCustom = (name: string, unit: string) => {
    onAddCustom(name, unit);
    setQuery('');
    setCustomOpen(false);
  };

  const showSuggestions = query.trim().length >= MIN_QUERY_LENGTH;
  const trimmedQuery = query.trim();

  return (
    <div className="space-y-2">
      {/* Catalog search: suggestions appear as the user types (from 2 characters) */}
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

      {showSuggestions &&
        (matches.length === 0 ? (
          /* Nothing in the catalog: the query becomes a custom article, with its unit */
          <div className="rounded-2xl bg-card border border-line shadow-xs p-3.5 space-y-3">
            <p className="text-sm font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent-text shrink-0" />
              <span>{t.customUnitTitle.replace('{query}', trimmedQuery)}</span>
            </p>
            <CustomArticleForm name={trimmedQuery} unitOptions={unitOptions} onAdd={addCustom} />
          </div>
        ) : (
          <div
            id="grocery-ingredient-suggestions"
            className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs"
          >
            <ul>
              {groups.map((group) => {
                const icon = categoryNames.tree.byId.get(group.category)?.category?.icon ?? '🛍️';
                const label = categoryNames.name(group.category) || group.category;
                return (
                  <li key={group.category}>
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <span aria-hidden="true">{icon}</span>
                      {label}
                    </p>
                    <ul>
                      {group.items.map((ing) => {
                        const name = getIngredientName(ing);
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
                                  <UnitInfo unit={ing.unit_default} />
                                </span>
                              </span>
                              {inList(ing) && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 text-[10px] font-bold shrink-0">
                                  {t.suggInList}
                                </span>
                              )}
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
                  </li>
                );
              })}
            </ul>
            {/* Always-visible last row: add the query itself as a custom article */}
            <div className="p-2.5">
              {customOpen ? (
                <CustomArticleForm name={trimmedQuery} unitOptions={unitOptions} onAdd={addCustom} />
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <Plus className="w-4 h-4 text-accent-text shrink-0" />
                  <span className="text-start">{t.customUnitRow.replace('{query}', trimmedQuery)}</span>
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};
