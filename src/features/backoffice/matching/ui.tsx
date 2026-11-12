import type { ReactNode } from 'react';
import type { Ingredient, Recipe } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';

/** Shared look of the "Moteur" tab. */
export const cls = {
  input: 'px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink',
  primary:
    'px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-surface transition disabled:opacity-50',
  danger: 'px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40',
  label: 'text-[11px] font-semibold text-ink-muted',
};

export function Section({
  title,
  hint,
  actions,
  children,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-card border border-line space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-ink">{title}</h3>
          {hint && <p className="text-xs text-ink-muted mt-0.5">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function IngredientSelect({
  ingredients,
  value,
  onChange,
  placeholder = 'Choisir un ingrédient',
  exclude = [],
}: {
  ingredients: Ingredient[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const { getIngredientName, compareNames } = useLanguage();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${cls.input} max-w-full`}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {ingredients
        .filter((i) => !exclude.includes(i.id) || i.id === value)
        .sort(compareNames)
        .map((i) => (
          <option key={i.id} value={i.id}>
            {getIngredientName(i)}
          </option>
        ))}
    </select>
  );
}

export function RecipeSelect({
  recipes,
  value,
  onChange,
  placeholder = 'Choisir une recette',
  exclude = [],
}: {
  recipes: Recipe[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const { getRecipeName, compareNames } = useLanguage();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${cls.input} max-w-full`}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {recipes
        .filter((r) => !exclude.includes(r.id) || r.id === value)
        .sort(compareNames)
        .map((r) => (
          <option key={r.id} value={r.id}>
            {getRecipeName(r)}
          </option>
        ))}
    </select>
  );
}

/** Ingredient chips with a remove button, plus a select to add one. */
export function IngredientChips({
  ids,
  ingredients,
  onChange,
  addLabel = 'Ajouter…',
}: {
  ids: string[];
  ingredients: Ingredient[];
  onChange: (ids: string[]) => void;
  addLabel?: string;
}) {
  const { getIngredientName } = useLanguage();
  const name = (id: string) => {
    const found = ingredients.find((i) => i.id === id);
    return found ? getIngredientName(found) : id;
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-brand/10 text-brand-text text-[11px] font-semibold"
        >
          {name(id)}
          <button
            onClick={() => onChange(ids.filter((x) => x !== id))}
            aria-label={`Retirer ${name(id)}`}
            className="px-1 hover:text-rose-600"
          >
            ×
          </button>
        </span>
      ))}
      <IngredientSelect
        ingredients={ingredients}
        value=""
        exclude={ids}
        placeholder={addLabel}
        onChange={(id) => id && onChange([...ids, id])}
      />
    </div>
  );
}

/** Recipe chips with a remove button, plus a select to add one. */
export function RecipeChips({
  ids,
  recipes,
  onChange,
}: {
  ids: string[];
  recipes: Recipe[];
  onChange: (ids: string[]) => void;
}) {
  const { getRecipeName } = useLanguage();
  const name = (id: string) => {
    const found = recipes.find((r) => r.id === id);
    return found ? getRecipeName(found) : id;
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      {ids.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-accent/10 text-accent-text text-[11px] font-semibold max-w-full"
        >
          <span className="truncate">{name(id)}</span>
          <button
            onClick={() => onChange(ids.filter((x) => x !== id))}
            aria-label={`Retirer ${name(id)}`}
            className="px-1 hover:text-rose-600"
          >
            ×
          </button>
        </span>
      ))}
      <RecipeSelect
        recipes={recipes}
        value=""
        exclude={ids}
        placeholder="Ajouter une recette…"
        onChange={(id) => id && onChange([...ids, id])}
      />
    </div>
  );
}
