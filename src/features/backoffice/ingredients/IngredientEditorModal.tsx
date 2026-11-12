import { useState } from 'react';
import { X } from 'lucide-react';
import { validateIngredient, type Ingredient, type IngredientCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { ModalShell } from '@/shared/ui/ModalShell';
import { LocalizedField } from '@/features/backoffice/ui/LocalizedField';
import { useIngredientCategories } from './categories';

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';

interface IngredientEditorModalProps {
  ingredient: Ingredient;
  onSave: (ingredient: Ingredient) => void;
  onClose: () => void;
}

/** Edit an existing ingredient: names in the three languages, category, unit and price. */
export function IngredientEditorModal({ ingredient, onSave, onClose }: IngredientEditorModalProps) {
  const { t } = useLanguage();
  const categories = useIngredientCategories();
  const [draft, setDraft] = useState<Ingredient>(ingredient);
  const [error, setError] = useState<string | null>(null);
  useCloseOnBack(true, onClose);
  const set = (patch: Partial<Ingredient>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = validateIngredient(draft);
    if (checked.ok) onSave(checked.value);
    else setError(checked.error);
  };

  return (
    <ModalShell>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Modifier : ${ingredient.name_fr}`}
        className="w-full max-w-xl bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-2xl text-ink"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-ink">Modifier : {ingredient.name_fr}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="pt-4 space-y-4">
          {error && (
            <p
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold"
            >
              {error}
            </p>
          )}
          <LocalizedField
            label="Nom de l'ingrédient"
            frenchRequired
            value={{ fr: draft.name_fr, derja: draft.name_derja, ar: draft.name_ar }}
            onChange={(v) => set({ name_fr: v.fr, name_derja: v.derja, name_ar: v.ar })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Catégorie
              <select
                value={draft.category}
                onChange={(e) => set({ category: e.target.value as IngredientCategory })}
                className={INPUT}
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Unité
              <input
                type="text"
                value={draft.unit_default}
                onChange={(e) => set({ unit_default: e.target.value })}
                className={INPUT}
                required
              />
            </label>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Prix unitaire (DT)
              <input
                type="number"
                step="0.1"
                min="0"
                value={draft.default_price_tnd}
                onChange={(e) => set({ default_price_tnd: parseFloat(e.target.value) || 0 })}
                className={INPUT}
              />
            </label>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {t.boCancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
            >
              {t.boSave}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
