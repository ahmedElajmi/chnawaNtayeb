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
import { languageInfo, localizedField, withLocalizedField, type Language } from '@/core/shared';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import {
  finalizeRecipeDraft,
  missingTranslations,
  recipeSectionStatus,
  type RecipeDraftError,
  type SectionId,
} from './recipeDraft';
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

const cuisines = (b: BackofficeTexts): [CuisineType, string][] => [
  ['traditionnelle', b.edCuisineTraditional],
  ['rapide', b.edCuisineFast],
  ['economique', b.edCuisineBudget],
  ['familiale', b.edCuisineFamily],
  ['vegetarienne', b.edCuisineVegetarian],
  ['internationale', b.edCuisineInternational],
];

/** Message of a refused save, in the current language. */
function errorMessage(error: RecipeDraftError, b: BackofficeTexts): string {
  switch (error.code) {
    case 'nameRequired':
      return b.edErrRecipeName;
    case 'noIngredient':
      return b.edErrNoIngredient;
    case 'noStep':
      return b.edErrNoStep;
    case 'stepNotFrench':
      return format(b.edErrStepFrench, { step: error.step });
    case 'invalidVideo':
      return b.edErrVideo;
  }
}

/** Section that shows the field a validation error is about. */
const SECTION_OF: Partial<Record<CheckedField, SectionId>> = {
  name: 'infos',
  ingredients: 'ingredients',
  steps: 'steps',
  video: 'media',
};

const savedAtLabel = (iso: string, language: Language) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(languageInfo(language).htmlLang, { dateStyle: 'short', timeStyle: 'short' });
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
  const b = useBackofficeText();
  // The fields open in the language of the site (French stays required, see submit)
  const [lang, setLang] = useState<EditorLanguage>(language);
  const [error, setError] = useState<{ reason: RecipeDraftError; field?: CheckedField } | null>(null);
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
      ? format(b.edNewRecipeNamed, { name: getRecipeName(draft) })
      : b.edNewRecipe
    : format(b.edEditNamed, { name: getRecipeName(recipe) });

  const requestClose = () => (autosave.dirty ? setConfirmClose(true) : onClose());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = finalizeRecipeDraft(draft, recipes);
    if (checked.ok) {
      autosave.discard();
      onSave(checked.recipe);
      return;
    }
    setError({ reason: checked.error, field: checked.field });
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
                {b.edPreview}
              </button>
              <button
                type="button"
                onClick={requestClose}
                className="text-slate-400 hover:text-slate-600 p-1.5"
                aria-label={b.close}
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
                      {(() => {
                        const [before, after = ''] = b.edDraftOffer.split('{date}');
                        return (
                          <>
                            {before}
                            <b>{savedAtLabel(autosave.offer.savedAt, language)}</b>
                            {after}
                          </>
                        );
                      })()}
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
                        {b.edResume}
                      </button>
                      <button
                        type="button"
                        onClick={autosave.declineOffer}
                        className="px-3 py-1.5 rounded-lg border border-line font-semibold text-ink-muted"
                      >
                        {b.edIgnore}
                      </button>
                    </div>
                  </div>
                )}

                <EditorSection id="infos" title={b.edSectionInfos}>
                  <LocalizedField
                    label={b.edRecipeName}
                    frenchRequired
                    invalid={error?.field === 'name'}
                    value={localizedField(draft, 'name')}
                    onChange={(v) => setDraft((d) => withLocalizedField(d, 'name', v))}
                  />
                  <LocalizedField
                    label={b.edDescription}
                    multiline
                    value={localizedField(draft, 'description')}
                    onChange={(v) => setDraft((d) => withLocalizedField(d, 'description', v))}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label={b.edPrepTime}>
                      <NumberField
                        value={draft.prep_time_minutes}
                        onChange={(prep_time_minutes) => set({ prep_time_minutes })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label={b.edCookTime}>
                      <NumberField
                        value={draft.cook_time_minutes}
                        onChange={(cook_time_minutes) => set({ cook_time_minutes })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label={b.edBaseServings}>
                      <NumberField
                        value={draft.base_servings}
                        fallback={4}
                        onChange={(base_servings) => set({ base_servings })}
                        className={INPUT}
                      />
                    </Field>
                    <Field label={b.edEstimatedCost}>
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
                        {b.edCostFromPrices} <b>{formatPriceRange(cost.range, 'DT')}</b>{' '}
                        <span className="text-ink-muted">
                          ({format(b.edCostPriced, { priced: cost.priced, total: costTotal })}
                          {cost.unpriced.length > 0 && ` : ${b.edCostUnpriced}`})
                        </span>
                      </span>
                      {/* Only offered when most of the recipe is priced: a partial sum would mislead */}
                      {cost.priced * 2 >= costTotal ? (
                        <button
                          type="button"
                          onClick={() => set({ estimated_cost_tnd: suggestedCost })}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-accent/10 text-accent-text font-bold hover:bg-accent/20"
                        >
                          {format(b.edUseCost, { cost: suggestedCost })}
                        </button>
                      ) : (
                        <span className="text-ink-muted">{b.edCostPartial}</span>
                      )}
                    </div>
                  )}
                  {cost.suspicious.length > 0 && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      {format(b.edCostSuspicious, {
                        names: cost.suspicious
                          .map((id) => {
                            const found = byId.get(id);
                            return found ? getIngredientName(found) : id;
                          })
                          .join(', '),
                      })}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={b.courseLabel}>
                      <select
                        value={normalizeCategory(draft.category)}
                        onChange={(e) => set({ category: e.target.value as MealCategory })}
                        className={INPUT}
                      >
                        <option value="entree">{b.courseEntree}</option>
                        <option value="plat_principal">{b.courseMain}</option>
                        <option value="dessert">{b.courseDessert}</option>
                      </select>
                      <p className="text-[10px] text-ink-muted mt-1">{b.edExpressHint}</p>
                    </Field>
                    <Field label={b.edCuisineType}>
                      <select
                        value={draft.cuisine_type}
                        onChange={(e) => set({ cuisine_type: e.target.value as CuisineType })}
                        className={INPUT}
                      >
                        {cuisines(b).map(([value, label]) => (
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
                      <span className="font-bold text-ink">{b.edHealthy}</span>
                      <span className="block text-ink-muted">{b.edHealthyHint}</span>
                    </span>
                  </label>
                </EditorSection>

                <EditorSection id="media" title={b.edSectionMedia}>
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
                  title={format(b.edIngredientsTitle, { count: draft.ingredients.length })}
                  hint={format(b.edIngredientsHint, { count: draft.base_servings })}
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
                  title={format(b.edStepsTitle, { count: draft.steps.length })}
                  hint={b.edStepsHint}
                >
                  <RecipeStepsEditor
                    steps={draft.steps}
                    invalid={error?.field === 'steps'}
                    onChange={(steps) => set({ steps })}
                  />
                </EditorSection>

                <EditorSection id="tip" title={b.edTipTitle}>
                  <LocalizedField
                    label={b.edTip}
                    multiline
                    value={draft.chef_tip ?? { fr: '', derja: '', ar: '' }}
                    onChange={(chef_tip) => set({ chef_tip })}
                    placeholder={b.edTipPlaceholder}
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
                {errorMessage(error.reason, b)} <span className="underline">{b.edSeeError}</span>
              </button>
            )}
            {confirmClose ? (
              <div className="space-y-2">
                <p className="text-xs text-ink">
                  <b>{b.edUnsavedTitle}</b> {b.edUnsavedText}
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
                    {b.edDiscardChanges}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl border border-line text-xs font-semibold text-ink"
                  >
                    {b.edCloseKeepDraft}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClose(false)}
                    className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
                  >
                    {b.edKeepEditing}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3">
                {autosave.dirty && <span className="me-auto text-[11px] text-ink-muted">{b.edDraftKept}</span>}
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                >
                  {b.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
                >
                  {b.save}
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
