import React from 'react';
import { Circle } from 'lucide-react';
import type { Ingredient } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { UnitInfo } from '@/shared/ui/UnitInfo';

/** One missing ingredient row the user can tick before adding to the grocery list. */
export interface MissingIngredientRow {
  /** Stable selection key (the catalog ingredient id of the recipe line) */
  id: string;
  /** Catalog ingredient, when it still exists (drives the thumb and the aisle) */
  ing: Ingredient | undefined;
  /** Display name, already localized by the parent */
  name: string;
  quantity: number;
  unit: string;
  isKey: boolean;
}

interface MissingIngredientsPickerProps {
  items: MissingIngredientRow[];
  /** Row ids the user unticked (everything is selected by default) */
  deselectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

/**
 * The missing ingredients of a recipe, each one selectable so the user picks
 * what goes to the grocery list (all of them are ticked by default).
 * Pure display: selection state lives in the parent.
 */
export const MissingIngredientsPicker: React.FC<MissingIngredientsPickerProps> = ({
  items,
  deselectedIds,
  onToggle,
  onSelectAll,
  onSelectNone,
}) => {
  const { t } = useLanguage();
  const selectedCount = items.filter((item) => !deselectedIds.has(item.id)).length;

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold text-accent-text flex items-center gap-1.5">
          <Circle className="w-3.5 h-3.5" />
          <span>
            {t.missingIngredients} ({items.length})
          </span>
        </p>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={selectedCount === items.length}
            className="min-h-[40px] px-2 rounded-lg text-xs font-bold text-accent-text hover:bg-accent/10 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {t.missingSelectAll}
          </button>
          <button
            type="button"
            onClick={onSelectNone}
            disabled={selectedCount === 0}
            className="min-h-[40px] px-2 rounded-lg text-xs font-bold text-ink-muted hover:bg-card disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {t.missingSelectNone}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item) => {
          const checked = !deselectedIds.has(item.id);
          return (
            <label
              key={item.id}
              className={`flex items-center justify-between gap-2 p-1.5 pe-2.5 min-h-[40px] rounded-xl border text-xs cursor-pointer transition ${
                checked ? 'bg-accent/10 border-accent/20' : 'bg-card border-line opacity-60'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="w-4 h-4 accent-accent shrink-0 cursor-pointer"
                />
                {item.ing && <IngredientThumb ingredient={item.ing} size="sm" />}
                <span className="font-medium text-slate-800 dark:text-slate-200 min-w-0">
                  {item.name}
                  {item.isKey && (
                    <span className="ms-1.5 px-1.5 py-0.5 rounded bg-accent text-on-accent text-[9px] font-bold uppercase">
                      {t.keyIngredientBadge}
                    </span>
                  )}
                </span>
              </span>
              <span className="font-bold text-accent-text shrink-0">
                {item.quantity} <UnitInfo unit={item.unit} />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
