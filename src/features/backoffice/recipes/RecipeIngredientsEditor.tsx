import { useMemo, useState } from 'react';
import { Plus, Repeat, Trash2, X } from 'lucide-react';
import { Ingredient, IngredientRole, RecipeIngredient, getRole } from '@/core/catalog';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { useLanguage } from '@/app/providers/LanguageContext';
import { IngredientSearch } from '@/features/backoffice/ui/IngredientSearch';
import { NumberField } from '@/features/backoffice/ui/NumberField';
import { UnitInput } from '@/features/backoffice/ui/UnitInput';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

const roles = (b: BackofficeTexts): { role: IngredientRole; label: string; hint: string; on: string }[] => [
  {
    role: 'key',
    label: b.edRoleKey,
    hint: b.edRoleKeyHint,
    on: 'bg-accent text-on-accent border-accent',
  },
  {
    role: 'secondary',
    label: b.edRoleSecondary,
    hint: b.edRoleSecondaryHint,
    on: 'bg-brand text-on-brand border-brand',
  },
  {
    role: 'staple',
    label: b.edRoleStaple,
    hint: b.edRoleStapleHint,
    on: 'bg-slate-600 text-white border-slate-600',
  },
];

const FIELD = 'w-full min-w-0 px-2 py-1.5 text-xs rounded-md bg-surface border border-line text-ink';

interface RecipeIngredientsEditorProps {
  items: RecipeIngredient[];
  catalog: Ingredient[];
  onChange: (items: RecipeIngredient[]) => void;
  /** Highlighted after a failed save ("add at least one ingredient") */
  invalid?: boolean;
}

/** Ingredient list of a recipe, with the role and substitutes used by the matching engine. */
export function RecipeIngredientsEditor({ items, catalog, onChange, invalid = false }: RecipeIngredientsEditorProps) {
  const { getIngredientName } = useLanguage();
  const b = useBackofficeText();
  const roleOptions = roles(b);
  const byId = useMemo(() => new Map(catalog.map((i) => [i.id, i])), [catalog]);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [addingSubstituteTo, setAddingSubstituteTo] = useState<number | null>(null);
  const used = items.map((i) => i.ingredient_id);

  const update = (index: number, patch: Partial<RecipeIngredient>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const add = (ingredient: Ingredient) =>
    onChange([
      ...items,
      {
        ingredient_id: ingredient.id,
        quantity_base: 1,
        unit: ingredient.unit_default,
        role: getRole({ ingredient_id: ingredient.id, quantity_base: 1, unit: '' }, catalog),
      },
    ]);

  // Another ingredient on the same line: its role is inferred again, and its unit follows
  // unless the chef had typed a unit of their own
  const replace = (index: number, ingredient: Ingredient) => {
    const item = items[index];
    const previous = byId.get(item.ingredient_id);
    const keepUnit = item.unit && previous && item.unit !== previous.unit_default;
    update(index, {
      ingredient_id: ingredient.id,
      role: undefined,
      unit: keepUnit ? item.unit : ingredient.unit_default,
      substitutes: item.substitutes?.filter((s) => s !== ingredient.id),
    });
    setReplacing(null);
  };

  const keyCount = items.filter((i) => !i.is_optional && getRole(i, catalog) === 'key').length;

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p
          className={`text-[11px] ${invalid ? 'text-rose-600 font-semibold' : 'text-ink-muted'}`}
          role={invalid ? 'alert' : undefined}
        >
          {b.edNoIngredient}
        </p>
      )}
      {items.length > 0 && keyCount === 0 && (
        <p className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-200">
          {b.edNoKeyIngredient}
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item, index) => {
          const ingredient = byId.get(item.ingredient_id);
          const role = getRole(item, catalog);
          const substitutes = item.substitutes ?? [];
          return (
            <li
              key={`${item.ingredient_id}-${index}`}
              className={`p-2.5 rounded-xl bg-card border space-y-2 ${role === 'key' ? 'border-accent/50' : 'border-line'} ${
                item.is_optional ? 'opacity-75' : ''
              }`}
            >
              {/* Ingredient (tap to change) + remove */}
              <div className="flex items-center gap-2.5">
                {ingredient ? (
                  <IngredientThumb ingredient={ingredient} size="md" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 shrink-0" />
                )}
                {replacing === index ? (
                  <IngredientSearch
                    ingredients={catalog}
                    exclude={used}
                    autoFocus
                    placeholder={b.edReplaceWith}
                    onSelect={(i) => replace(index, i)}
                    onCancel={() => setReplacing(null)}
                    className="flex-1"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplacing(index)}
                    title={b.edChangeIngredient}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="block text-sm font-bold text-ink truncate">
                      {ingredient
                        ? getIngredientName(ingredient)
                        : format(b.edUnknownIngredient, { id: item.ingredient_id })}
                    </span>
                    <span className="block text-[10px] text-ink-muted">{b.edTapToChange}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  aria-label={
                    ingredient ? format(b.edRemoveNamed, { name: getIngredientName(ingredient) }) : b.edRemoveIngredient
                  }
                  className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quantity, unit, optional */}
              <div className="flex flex-wrap items-center gap-2">
                <NumberField
                  value={item.quantity_base}
                  onChange={(quantity_base) => update(index, { quantity_base })}
                  aria-label={b.edQuantity}
                  className={`${FIELD} !w-20`}
                />
                <UnitInput
                  value={item.unit}
                  onChange={(unit) => update(index, { unit })}
                  maxLength={20}
                  aria-label={b.edUnit}
                  className={`${FIELD} !w-28`}
                />
                <label className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!item.is_optional}
                    onChange={(e) => update(index, { is_optional: e.target.checked || undefined })}
                    className="accent-brand w-4 h-4"
                  />
                  {b.edOptional}
                </label>
              </div>

              {/* Role */}
              <div role="radiogroup" aria-label={b.edRoleInRecipe} className="grid grid-cols-3 gap-1">
                {roleOptions.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    role="radio"
                    aria-checked={role === r.role}
                    title={r.hint}
                    onClick={() => update(index, { role: r.role })}
                    className={`px-1.5 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                      role === r.role ? r.on : 'bg-surface border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-muted -mt-1">{roleOptions.find((r) => r.role === role)?.hint}</p>

              {/* Recipe-specific substitutes */}
              <div className="flex flex-wrap items-center gap-1.5">
                {substitutes.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted">
                    <Repeat className="w-3 h-3" /> {b.edReplaceableBy}
                  </span>
                )}
                {substitutes.map((id) => {
                  const sub = byId.get(id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 ps-0.5 pe-1 py-0.5 rounded-full bg-brand/10 text-brand-text text-[11px] font-semibold max-w-full"
                    >
                      {sub && <IngredientThumb ingredient={sub} size="xs" round />}
                      <span className="truncate">{sub ? getIngredientName(sub) : id}</span>
                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            substitutes: substitutes.filter((s) => s !== id).length
                              ? substitutes.filter((s) => s !== id)
                              : undefined,
                          })
                        }
                        aria-label={format(b.edRemoveSubstitute, { name: sub ? getIngredientName(sub) : id })}
                        className="p-0.5 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {addingSubstituteTo === index ? (
                  <IngredientSearch
                    ingredients={catalog}
                    exclude={[item.ingredient_id, ...substitutes]}
                    autoFocus
                    placeholder={b.edSubstitutePlaceholder}
                    onSelect={(i) => {
                      update(index, { substitutes: [...substitutes, i.id] });
                      setAddingSubstituteTo(null);
                    }}
                    onCancel={() => setAddingSubstituteTo(null)}
                    className="w-full sm:w-56"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingSubstituteTo(index)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-text hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    {substitutes.length ? b.edOtherSubstitute : b.edAddSubstitute}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <IngredientSearch
        ingredients={catalog}
        exclude={used}
        onSelect={add}
        placeholder={b.edAddIngredientPlaceholder}
      />
    </div>
  );
}
