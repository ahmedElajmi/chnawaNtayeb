import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { normalizeCategory, type CuisineType, type Ingredient, type MealCategory, type Recipe } from '@/core/catalog';
import { parseYouTubeId, youTubeThumbnail } from '@/core/shared';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor';
import { RecipeStepsEditor } from './RecipeStepsEditor';
import { finalizeRecipeDraft } from './recipeDraft';
import { LocalizedField } from '@/features/backoffice/ui/LocalizedField';
import { ModalShell } from '@/shared/ui/ModalShell';

interface RecipeEditorModalProps {
  recipe: Recipe;
  recipes: Recipe[];
  ingredients: Ingredient[];
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
}

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

const CUISINES: [CuisineType, string][] = [
  ['traditionnelle', 'Traditionnelle'],
  ['rapide', 'Rapide'],
  ['economique', 'Économique'],
  ['familiale', 'Familiale'],
  ['vegetarienne', 'Végétarienne'],
  ['internationale', 'Internationale'],
];

function VideoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const videoId = parseYouTubeId(value);
  const invalid = value.trim() !== '' && !videoId;
  return (
    <Field label="Vidéo de préparation (lien YouTube, optionnel)" htmlFor="recipe-video">
      <div className="flex gap-3 mt-1 items-start">
        <div className="flex-1 min-w-0">
          <input
            id="recipe-video"
            type="url"
            inputMode="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… ou https://youtu.be/…"
            aria-invalid={invalid}
            className={`w-full px-3 py-2 text-xs rounded-lg bg-card border ${invalid ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
          />
          <p className={`text-[10px] mt-1 ${invalid ? 'text-rose-600 font-semibold' : 'text-ink-muted'}`}>
            {invalid
              ? 'Lien non reconnu : utilisez un lien youtube.com, youtu.be ou shorts.'
              : videoId
                ? "Vidéo reconnue : elle s'affichera dans la fiche de la recette."
                : "Laissez vide si la recette n'a pas de vidéo : rien ne sera affiché."}
          </p>
        </div>
        {videoId && (
          <div className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-900 ring-1 ring-line">
            <img
              src={youTubeThumbnail(videoId)}
              alt="Aperçu de la vidéo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-accent text-xs">
                ▶
              </span>
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Retirer la vidéo"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] leading-none"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </Field>
  );
}

/**
 * Create / edit a recipe: names, description, preparation steps and chef tip in the three languages,
 * times, price, image, video, course, ingredients with their role.
 */
export function RecipeEditorModal({ recipe, recipes, ingredients, onSave, onClose }: RecipeEditorModalProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Recipe>(recipe);
  const [error, setError] = useState<string | null>(null);
  useCloseOnBack(true, onClose);
  const set = (patch: Partial<Recipe>) => setDraft((d) => ({ ...d, ...patch }));
  const number = (value: string, fallback = 0) => (Number.isFinite(parseFloat(value)) ? parseFloat(value) : fallback);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = finalizeRecipeDraft(draft, recipes);
    if (checked.ok) onSave(checked.recipe);
    else setError(checked.error);
  };

  return (
    <ModalShell>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={draft.name_fr || t.boAddRecipe}
        className="w-full max-w-2xl bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-ink">
            {recipe.name_fr ? `Modifier : ${recipe.name_fr}` : t.boAddRecipe}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <p
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold"
            >
              {error}
            </p>
          )}
          <LocalizedField
            label="Nom de la recette"
            frenchRequired
            value={{ fr: draft.name_fr, derja: draft.name_derja, ar: draft.name_ar }}
            onChange={(v) => set({ name_fr: v.fr, name_derja: v.derja, name_ar: v.ar })}
          />

          <LocalizedField
            label="Description"
            multiline
            value={{ fr: draft.description_fr, derja: draft.description_derja, ar: draft.description_ar }}
            onChange={(v) => set({ description_fr: v.fr, description_derja: v.derja, description_ar: v.ar })}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Préparation (min)">
              <input
                type="number"
                value={draft.prep_time_minutes}
                onChange={(e) => set({ prep_time_minutes: number(e.target.value) })}
                className={INPUT}
              />
            </Field>
            <Field label="Cuisson (min)">
              <input
                type="number"
                value={draft.cook_time_minutes}
                onChange={(e) => set({ cook_time_minutes: number(e.target.value) })}
                className={INPUT}
              />
            </Field>
            <Field label="Prix estimé (DT)">
              <input
                type="number"
                step="0.5"
                value={draft.estimated_cost_tnd}
                onChange={(e) => set({ estimated_cost_tnd: number(e.target.value) })}
                className={INPUT}
              />
            </Field>
            <Field label="Portions base">
              <input
                type="number"
                value={draft.base_servings}
                onChange={(e) => set({ base_servings: number(e.target.value, 4) })}
                className={INPUT}
              />
            </Field>
          </div>

          <Field label="URL de l'image">
            <input
              type="text"
              value={draft.image_url}
              onChange={(e) => set({ image_url: e.target.value })}
              className={INPUT}
            />
          </Field>

          <VideoField value={draft.video_url ?? ''} onChange={(video_url) => set({ video_url })} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select
                value={normalizeCategory(draft.category)}
                onChange={(e) => set({ category: e.target.value as MealCategory })}
                className={INPUT}
              >
                <option value="entree">Entrée (salades, soupes, brik…)</option>
                <option value="plat_principal">Plat principal</option>
                <option value="dessert">Dessert</option>
              </select>
              <p className="text-[10px] text-ink-muted mt-1">
                « Express » est ajouté automatiquement si la recette prend 20 min ou moins.
              </p>
            </Field>
            <Field label="Type de cuisine">
              <select
                value={draft.cuisine_type}
                onChange={(e) => set({ cuisine_type: e.target.value as CuisineType })}
                className={INPUT}
              >
                {CUISINES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex items-start gap-2 p-3 rounded-xl bg-card border border-line cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft.is_healthy}
              onChange={(e) => set({ is_healthy: e.target.checked })}
              className="accent-brand w-4 h-4 mt-0.5"
            />
            <span className="text-xs">
              <span className="font-bold text-ink">Plat équilibré / healthy</span>
              <span className="block text-ink-muted">
                Léger, riche en légumes, peu de friture ou de sucre. Affiche le badge Healthy et l'inclut dans les
                filtres et menus healthy.
              </span>
            </span>
          </label>

          <RecipeIngredientsEditor
            items={draft.ingredients}
            catalog={ingredients}
            onChange={(items) => set({ ingredients: items })}
          />

          <RecipeStepsEditor steps={draft.steps} onChange={(steps) => set({ steps })} />

          <LocalizedField
            label="Astuce du Chef Tounsi (optionnelle)"
            multiline
            value={draft.chef_tip ?? { fr: '', derja: '', ar: '' }}
            onChange={(chef_tip) => set({ chef_tip })}
            placeholder="Ex : Ne jamais battre les œufs dans une vraie ojja !"
          />

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
