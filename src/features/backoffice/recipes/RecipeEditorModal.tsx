import { useMemo, useState, type ReactNode } from 'react';
import { Eye, History, Sparkles, X } from 'lucide-react';
import {
  normalizeCategory,
  normalizeSteps,
  suggestRecipeCost,
  type CheckedField,
  type CuisineType,
  type Ingredient,
  type MealCategory,
  type Recipe,
} from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { ModalShell } from '@/shared/ui/ModalShell';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { RecipeDetailModal } from '@/features/recipes/components/RecipeDetailModal';
import { LocalizedField } from '@/features/backoffice/ui/LocalizedField';
import { NumberField } from '@/features/backoffice/ui/NumberField';
import { EditorLanguageProvider, LanguageTabs, type EditorLanguage } from '@/features/backoffice/ui/editorLanguage';
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor';
import { RecipeCategoryPicker } from './RecipeCategoryPicker';
import { RecipeStepsEditor } from './RecipeStepsEditor';
import { RecipeImageField, RecipeVideoField } from './RecipeMediaFields';
import { EditorSection, SectionNav, sectionDomId } from './RecipeEditorChrome';
import { localizedField, withLocalizedField } from '@/core/shared';
import { finalizeRecipeDraft, missingTranslations, recipeSectionStatus, type SectionId } from './recipeDraft';
import { useRecipeDraftAutosave } from './useRecipeDraftAutosave';

interface RecipeEditorModalProps {
  recipe: Recipe;
  /** A recipe being created (new or duplicated): its draft is kept under a shared key */
  isNew?: boolean;
  recipes: Recipe[];
  ingredients: Ingredient[];
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
  /** Parts sent back by the reviewer, with their notes (shown at the top of the form) */
  reviewNotes?: { label: string; note: string }[];
  reviewNotesTitle?: string;
}

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
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

/** Section that shows the field a validation error is about. */
const SECTION_OF: Partial<Record<CheckedField, SectionId>> = {
  name: 'infos',
  ingredients: 'ingredients',
  steps: 'steps',
  video: 'media',
};

const savedAtLabel = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

/**
 * Create / edit a recipe. Long form split in sections (shortcuts with their status), texts
 * written one language at a time (tabs with what is left to translate), save bar always
 * visible, errors shown on their field, unsaved changes kept as a draft on the device,
 * public preview, and a cost suggested from the ingredient prices.
 */
export function RecipeEditorModal({
  recipe,
  isNew = false,
  recipes,
  ingredients,
  onSave,
  onClose,
  reviewNotes = [],
  reviewNotesTitle = '',
}: RecipeEditorModalProps) {
  const [draft, setDraft] = useState<Recipe>(recipe);
  const { language, getRecipeName, getIngredientName } = useLanguage();
  // The fields open in the language of the site (French stays required, see submit)
  const [lang, setLang] = useState<EditorLanguage>(language);
  const [error, setError] = useState<{ message: string; field?: CheckedField } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [preview, setPreview] = useState(false);
  const autosave = useRecipeDraftAutosave(recipe, isNew, draft);
  // The back button closes at once: the changes stay in the draft, offered again on reopening
  useCloseOnBack(true, onClose);
  useCloseOnBack(preview, () => setPreview(false));

  // Sections are found by id (see EditorSection) and scrolled into view
  const jump = (id: SectionId) =>
    document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const set = (patch: Partial<Recipe>) => setDraft((d) => ({ ...d, ...patch }));
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const status = recipeSectionStatus(draft, ingredients);
  const missing = missingTranslations(draft);
  const cost = suggestRecipeCost(draft, byId);
  const costTotal = draft.ingredients.filter((i) => !i.is_optional).length;
  // Middle of the range, to the half dinar
  const suggestedCost = Math.round(((cost.range.min + cost.range.max) / 2) * 2) / 2;
  const title = isNew
    ? getRecipeName(draft).trim()
      ? `Nouvelle recette : ${getRecipeName(draft)}`
      : 'Nouvelle recette'
    : `Modifier : ${getRecipeName(recipe)}`;

  const requestClose = () => (autosave.dirty ? setConfirmClose(true) : onClose());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = finalizeRecipeDraft(draft, recipes);
    if (checked.ok) {
      autosave.discard();
      onSave(checked.recipe);
      return;
    }
    setError({ message: checked.error, field: checked.field });
    // Required texts are the French ones
    if (checked.field === 'name' || checked.field === 'steps') setLang('fr');
    const section = checked.field && SECTION_OF[checked.field];
    if (section) window.setTimeout(() => jump(section), 50);
  };

  return (
    <ModalShell mobile="full" onDismiss={requestClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl bg-surface sm:rounded-2xl border border-line shadow-2xl h-dvh sm:h-auto sm:max-h-[92vh] flex flex-col text-ink"
      >
        <form onSubmit={submit} noValidate className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 pt-4 pb-3 border-b border-line">
            <h3 className="font-extrabold text-base text-ink truncate">{title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs font-bold text-ink hover:border-brand"
              >
                <Eye className="w-3.5 h-3.5" />
                Aperçu
              </button>
              <button
                type="button"
                onClick={requestClose}
                className="text-slate-400 hover:text-slate-600 p-1.5"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Shortcuts + language, always reachable */}
            <div className="sticky top-0 z-20 bg-surface border-b border-line px-4 sm:px-6 py-2.5 space-y-2">
              <SectionNav status={status} onJump={jump} />
              <LanguageTabs value={lang} onChange={setLang} missing={missing} />
            </div>

            <EditorLanguageProvider value={lang}>
              <div className="px-4 sm:px-6 py-4 space-y-8">
                {reviewNotes.length > 0 && (
                  <div
                    role="note"
                    className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 text-xs space-y-1"
                  >
                    <p className="font-bold">{reviewNotesTitle}</p>
                    <ul className="space-y-0.5">
                      {reviewNotes.map(({ label, note }) => (
                        <li key={label}>
                          <span className="font-semibold">{label}</span>
                          {note && ` : ${note}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {autosave.offer && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-brand/40 bg-brand/10 text-xs">
                    <History className="w-4 h-4 text-brand-text shrink-0" />
                    <p className="flex-1 text-ink">
                      Des modifications non enregistrées du <b>{savedAtLabel(autosave.offer.savedAt)}</b> ont été
                      gardées sur cet appareil.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const restored = autosave.acceptOffer();
                          if (restored) setDraft(restored);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand text-on-brand font-bold"
                      >
                        Reprendre
                      </button>
                      <button
                        type="button"
                        onClick={autosave.declineOffer}
                        className="px-3 py-1.5 rounded-lg border border-line font-semibold text-ink-muted"
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                )}

                <EditorSection id="infos" title="Infos">
                  <LocalizedField
                    label="Nom de la recette"
                    frenchRequired
                    invalid={error?.field === 'name'}
                    value={localizedField(draft, 'name')}
                    onChange={(v) => setDraft((d) => withLocalizedField(d, 'name', v))}
                  />
                  <LocalizedField
                    label="Description"
                    multiline
                    value={localizedField(draft, 'description')}
                    onChange={(v) => setDraft((d) => withLocalizedField(d, 'description', v))}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Préparation (min)">
                      <NumberField
                        value={draft.prep_time_minutes}
                        onChange={(prep_time_minutes) => set({ prep_time_minutes })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Cuisson (min)">
                      <NumberField
                        value={draft.cook_time_minutes}
                        onChange={(cook_time_minutes) => set({ cook_time_minutes })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Portions de base">
                      <NumberField
                        value={draft.base_servings}
                        fallback={4}
                        onChange={(base_servings) => set({ base_servings })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Coût estimé (DT)">
                      <NumberField
                        value={draft.estimated_cost_tnd}
                        onChange={(estimated_cost_tnd) => set({ estimated_cost_tnd })}
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  {cost.priced > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-card border border-line text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-accent-text shrink-0" />
                      <span className="flex-1 min-w-0 text-ink">
                        D'après les prix des ingrédients : <b>{formatPriceRange(cost.range, 'DT')}</b>{' '}
                        <span className="text-ink-muted">
                          ({cost.priced}/{costTotal} ingrédients chiffrés
                          {cost.unpriced.length > 0 && ' : cuillères, pincées… non comptées'})
                        </span>
                      </span>
                      {/* Only offered when most of the recipe is priced: a partial sum would mislead */}
                      {cost.priced * 2 >= costTotal ? (
                        <button
                          type="button"
                          onClick={() => set({ estimated_cost_tnd: suggestedCost })}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-accent/10 text-accent-text font-bold hover:bg-accent/20"
                        >
                          Utiliser {suggestedCost} DT
                        </button>
                      ) : (
                        <span className="text-ink-muted">Estimation partielle : à titre indicatif.</span>
                      )}
                    </div>
                  )}
                  {cost.suspicious.length > 0 && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Unité à vérifier (prix donné pour une autre unité, ex. « g » au lieu de « 100 g ») :{' '}
                      {cost.suspicious
                        .map((id) => {
                          const found = byId.get(id);
                          return found ? getIngredientName(found) : id;
                        })
                        .join(', ')}
                      . Le public voit l'estimation saisie tant que ce n'est pas corrigé (Ingrédients › Unité à
                      vérifier).
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <RecipeCategoryPicker
                    value={draft.category_ids ?? []}
                    onChange={(category_ids) => set({ category_ids })}
                  />
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
                        Léger, riche en légumes, peu de friture ou de sucre. Affiche le badge Healthy et l'inclut dans
                        les filtres et menus healthy.
                      </span>
                    </span>
                  </label>
                </EditorSection>

                <EditorSection id="media" title="Photo & vidéo">
                  <RecipeImageField
                    value={draft.image_url}
                    title={getRecipeName(draft)}
                    onChange={(image_url) => set({ image_url })}
                  />
                  <RecipeVideoField
                    value={draft.video_url ?? ''}
                    title={getRecipeName(draft)}
                    onChange={(video_url) => set({ video_url })}
                  />
                </EditorSection>

                <EditorSection
                  id="ingredients"
                  title={`Ingrédients (${draft.ingredients.length})`}
                  hint={`Quantités pour ${draft.base_servings} personnes. Le rôle guide les suggestions du frigo.`}
                >
                  <RecipeIngredientsEditor
                    items={draft.ingredients}
                    catalog={ingredients}
                    invalid={error?.field === 'ingredients'}
                    onChange={(items) => set({ ingredients: items })}
                  />
                </EditorSection>

                <EditorSection
                  id="steps"
                  title={`Étapes de préparation (${draft.steps.length})`}
                  hint="Au moins une étape en français ; elles sont renumérotées à l'enregistrement."
                >
                  <RecipeStepsEditor
                    steps={draft.steps}
                    invalid={error?.field === 'steps'}
                    onChange={(steps) => set({ steps })}
                  />
                </EditorSection>

                <EditorSection id="tip" title="Astuce du chef (facultative)">
                  <LocalizedField
                    label="Astuce"
                    multiline
                    value={draft.chef_tip ?? { fr: '', derja: '', ar: '' }}
                    onChange={(chef_tip) => set({ chef_tip })}
                    placeholder="Ex : Ne jamais battre les œufs dans une vraie ojja !"
                  />
                </EditorSection>
              </div>
            </EditorLanguageProvider>
          </div>

          {/* Save bar, always visible */}
          <div className="shrink-0 border-t border-line bg-surface px-4 sm:px-6 py-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {error && !confirmClose && (
              <button
                type="button"
                role="alert"
                onClick={() => {
                  const section = error.field && SECTION_OF[error.field];
                  if (section) jump(section);
                }}
                className="w-full text-left p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold"
              >
                {error.message} <span className="underline">Voir</span>
              </button>
            )}
            {confirmClose ? (
              <div className="space-y-2">
                <p className="text-xs text-ink">
                  <b>Modifications non enregistrées.</b> Si vous fermez, elles restent en brouillon sur cet appareil et
                  vous seront proposées à la prochaine ouverture.
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      autosave.discard();
                      onClose();
                    }}
                    className="me-auto px-3 py-2 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Abandonner les modifications
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl border border-line text-xs font-semibold text-ink"
                  >
                    Fermer (brouillon gardé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClose(false)}
                    className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
                  >
                    Continuer l'édition
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                {autosave.dirty && (
                  <span className="me-auto text-[11px] text-ink-muted">Brouillon gardé sur cet appareil</span>
                )}
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Public preview of the draft, exactly as the recipe sheet shows it */}
      {preview && (
        <RecipeDetailModal
          recipe={{ ...draft, steps: normalizeSteps(draft.steps) }}
          isOpen
          onClose={() => setPreview(false)}
          isFavorite={false}
          onToggleFavorite={() => {}}
          allIngredients={ingredients}
          selectedFridgeIds={[]}
          pantryIds={[]}
          onAddMissingToGrocery={() => {}}
        />
      )}
    </ModalShell>
  );
}
