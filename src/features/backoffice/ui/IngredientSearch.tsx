import { useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Ingredient } from '@/core/catalog';
import { normalizeText } from '@/core/shared';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useIngredientCategories } from '@/shared/i18n/useIngredientCategories';

const MAX_RESULTS = 30;

interface IngredientSearchProps {
  ingredients: Ingredient[];
  onSelect: (ingredient: Ingredient) => void;
  /** Ingredients that cannot be chosen (already in the list) */
  exclude?: Iterable<string>;
  placeholder?: string;
  autoFocus?: boolean;
  /** Escape or leaving the field without choosing */
  onCancel?: () => void;
  className?: string;
}

/**
 * Type a few letters ("tom", "tmatem", "طماطم") to find an ingredient by any of its
 * three names; arrows + Enter or a tap to choose. Shows the ingredient picture and category.
 */
export function IngredientSearch({
  ingredients,
  onSelect,
  exclude = [],
  placeholder = 'Chercher un ingrédient…',
  autoFocus = false,
  onCancel,
  className = '',
}: IngredientSearchProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(autoFocus);
  const [active, setActive] = useState(0);
  const categoryLabel = new Map(useIngredientCategories());
  const { getIngredientName, getSecondaryName, compareNames } = useLanguage();

  const results = useMemo(() => {
    const excluded = new Set(exclude);
    const q = normalizeText(query.trim());
    const names = (i: Ingredient) => [i.name_fr, i.name_derja, i.name_ar].map((n) => normalizeText(n ?? ''));
    return ingredients
      .filter((i) => !excluded.has(i.id) && (!q || names(i).some((n) => n.includes(q))))
      .map((i) => ({ i, starts: q && names(i).some((n) => n.startsWith(q)) ? 0 : 1 }))
      .sort((a, b) => a.starts - b.starts || compareNames(a.i, b.i))
      .slice(0, MAX_RESULTS)
      .map((r) => r.i);
  }, [ingredients, exclude, query, compareNames]);

  const choose = (ingredient: Ingredient) => {
    onSelect(ingredient);
    setQuery('');
    setActive(0);
  };

  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- opened on purpose by the chef ("change" / "add")
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          onCancel?.();
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (open && results[active]) choose(results[active]);
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
            onCancel?.();
          }
        }}
        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface border border-slate-200 dark:border-slate-700 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-card border border-line shadow-xl py-1"
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-[11px] text-ink-muted">
              Aucun ingrédient trouvé. Ajoutez-le d'abord dans l'onglet Ingrédients.
            </li>
          )}
          {results.map((ingredient, index) => (
            <li
              key={ingredient.id}
              id={`${listId}-${ingredient.id}`}
              role="option"
              aria-selected={index === active}
              // mousedown: chosen before the field loses the focus
              onMouseDown={(e) => {
                e.preventDefault();
                choose(ingredient);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer ${index === active ? 'bg-brand/10' : ''}`}
            >
              <IngredientThumb ingredient={ingredient} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink truncate">{getIngredientName(ingredient)}</span>
                <span className="block text-[10px] text-ink-muted truncate">
                  {[getSecondaryName(ingredient), categoryLabel.get(ingredient.category)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="text-[10px] text-ink-muted shrink-0">{ingredient.unit_default}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
