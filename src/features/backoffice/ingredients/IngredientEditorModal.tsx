import { useState } from 'react';
import { ImageOff, X } from 'lucide-react';
import {
  findDuplicateIngredient,
  parseImageUrl,
  validateIngredient,
  type Ingredient,
  type IngredientCategory,
} from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { ModalShell } from '@/shared/ui/ModalShell';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { LocalizedField } from '@/features/backoffice/ui/LocalizedField';
import { useIngredientCategories } from './categories';

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';
const LABEL = 'text-[11px] font-bold text-slate-600 dark:text-slate-300';

/** Starting point of a new ingredient (the id is given when it is created). */
export const NEW_INGREDIENT: Ingredient = {
  id: '',
  name_fr: '',
  name_derja: '',
  name_ar: '',
  category: 'vegetables',
  unit_default: 'kg',
  price_min_tnd: 1,
  price_max_tnd: 2,
};

interface IngredientEditorModalProps {
  ingredient: Ingredient;
  /** Whole catalog, to warn about an ingredient that already exists */
  catalog: Ingredient[];
  /** Receives the validated ingredient (id '' for a new one) */
  onSave: (ingredient: Ingredient) => void;
  onClose: () => void;
}

const priceInput = (value: string) => (value.trim() === '' ? NaN : Number(value.replace(',', '.')));

/**
 * Create or edit an ingredient: names in the three languages, category, unit,
 * price range and optional photo link, with a live preview of how it looks.
 */
export function IngredientEditorModal({ ingredient, catalog, onSave, onClose }: IngredientEditorModalProps) {
  const { getIngredientName } = useLanguage();
  const categories = useIngredientCategories();
  const isNew = !ingredient.id;
  const [draft, setDraft] = useState<Ingredient>(ingredient);
  const [minText, setMinText] = useState(String(ingredient.price_min_tnd));
  const [maxText, setMaxText] = useState(String(ingredient.price_max_tnd));
  const [error, setError] = useState<string | null>(null);
  useCloseOnBack(true, onClose);
  const set = (patch: Partial<Ingredient>) => setDraft((d) => ({ ...d, ...patch }));

  const title = isNew ? 'Nouvel ingrédient' : `Modifier : ${ingredient.name_fr}`;
  const photo = parseImageUrl(draft.image_url);
  const preview: Ingredient = { ...draft, image_url: photo ?? undefined };
  // Two ingredients with the same French name would be impossible to tell apart in the recipes
  const duplicate = findDuplicateIngredient(draft.name_fr, catalog, ingredient.id || undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = validateIngredient({
      ...draft,
      price_min_tnd: priceInput(minText),
      price_max_tnd: priceInput(maxText),
    });
    if (!checked.ok) setError(checked.error);
    else if (duplicate) setError(`« ${duplicate.name_fr} » existe déjà dans le catalogue : modifiez-le plutôt.`);
    else onSave(checked.value);
  };

  return (
    <ModalShell>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xl bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-2xl text-ink"
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-ink truncate">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 shrink-0" aria-label="Fermer">
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
            invalid={!!duplicate}
          />
          {duplicate && (
            <p className="-mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              « {duplicate.name_fr} » existe déjà dans le catalogue.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL}>
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
            <label className={LABEL}>
              Unité d'achat
              <input
                type="text"
                value={draft.unit_default}
                onChange={(e) => set({ unit_default: e.target.value })}
                placeholder="kg, pièce, boîte..."
                className={INPUT}
                required
              />
            </label>
            <label className={LABEL}>
              Prix minimum (DT)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={minText}
                onChange={(e) => setMinText(e.target.value)}
                className={INPUT}
              />
            </label>
            <label className={LABEL}>
              Prix maximum (DT)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={maxText}
                onChange={(e) => setMaxText(e.target.value)}
                className={INPUT}
              />
            </label>
          </div>
          <p className="-mt-2 text-[11px] text-ink-muted">
            Les prix du marché changent : indiquez la fourchette habituelle pour une unité d'achat (même valeur deux
            fois pour un prix fixe).
          </p>

          <div className="space-y-2">
            <label className={`block ${LABEL}`}>
              Photo (lien https, facultatif)
              <input
                type="url"
                inputMode="url"
                value={draft.image_url ?? ''}
                onChange={(e) => set({ image_url: e.target.value })}
                placeholder="https://..."
                className={INPUT}
              />
            </label>
            {/* Live preview: exactly what the public screens will show */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-line">
              <IngredientThumb key={preview.image_url ?? 'none'} ingredient={preview} size="lg" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-ink truncate">{getIngredientName(draft) || 'Aperçu'}</p>
                <p className="text-[11px] text-ink-muted">
                  {photo
                    ? "Aperçu de la photo. Si l'image ne s'affiche pas, le lien est inaccessible : la pastille de la catégorie sera montrée à la place."
                    : 'Sans photo : pastille colorée de la catégorie.'}
                </p>
                {photo === null && (
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <ImageOff className="w-3.5 h-3.5" /> Lien invalide (adresse complète en https:// attendue)
                  </p>
                )}
                {draft.image_url && (
                  <button
                    type="button"
                    onClick={() => set({ image_url: '' })}
                    className="block text-[11px] font-semibold text-accent-text hover:underline"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
            >
              {isNew ? 'Ajouter au catalogue' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
