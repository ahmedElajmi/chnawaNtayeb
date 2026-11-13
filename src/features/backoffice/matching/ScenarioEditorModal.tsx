import { useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Plus, X, XCircle } from 'lucide-react';
import { MEAL_CATEGORIES, type CuisineType, type Ingredient, type MealCategory, type Recipe } from '@/core/catalog';
import {
  emptyCheck,
  evaluateScenario,
  SCENARIO_CHECK_KINDS,
  validateScenario,
  type MatchingConfig,
  type MatchingScenario,
  type MatchTier,
  type ScenarioCheck,
  type ScenarioCheckKind,
} from '@/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '@/core/preferences';
import type { WriteResult } from '@/application';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { useGuardedClose } from '@/shared/hooks/useGuardedClose';
import { cls, IngredientChips, IngredientSelect, RecipeChips, RecipeSelect } from './ui';
import { ModalShell } from '@/shared/ui/ModalShell';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

export const checkLabels = (b: BackofficeTexts): Record<ScenarioCheckKind, string> => ({
  first: b.engCheckFirst,
  tier: b.engCheckTier,
  contains: b.engCheckContains,
  top: b.engCheckTop,
  noCourse: b.engCheckNoCourse,
  toBuy: b.engCheckToBuy,
  fridgeUsed: b.engCheckFridgeUsed,
  substitution: b.engCheckSubstitution,
  minScore: b.engCheckMinScore,
});

const tierLabels = (b: BackofficeTexts): Record<MatchTier | 'absent', string> => ({
  ready: b.engTierReady,
  almost: b.engTierAlmost,
  ideas: b.engTierIdea,
  absent: b.engTierAbsent,
});
const TIERS: MatchTier[] = ['ready', 'almost', 'ideas'];
const courseLabels = (b: BackofficeTexts): Record<MealCategory, string> => ({
  entree: b.engCourseStarter,
  plat_principal: b.engCourseMain,
  dessert: b.engCourseDessert,
});
const cuisines = (b: BackofficeTexts): [CuisineType, string][] => [
  ['traditionnelle', b.engCuisineTraditional],
  ['rapide', b.engCuisineQuick],
  ['economique', b.engCuisineBudget],
  ['familiale', b.engCuisineFamily],
  ['vegetarienne', b.engCuisineVegetarian],
  ['internationale', b.engCuisineInternational],
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className={cls.label}>{label}</p>
      {children}
    </div>
  );
}

function TierSelect({ value, onChange }: { value: MatchTier; onChange: (t: MatchTier) => void }) {
  const b = useBackofficeText();
  const tierLabel = tierLabels(b);
  return (
    <select
      className={`${cls.input} max-w-full`}
      value={value}
      onChange={(e) => onChange(e.target.value as MatchTier)}
      aria-label={b.engTier}
    >
      {TIERS.map((t) => (
        <option key={t} value={t}>
          {tierLabel[t]}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={value}
      aria-label={label}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
      }}
      className={`${cls.input} w-20`}
    />
  );
}

/** Fields of one check, depending on its kind. */
function CheckFields({
  check,
  recipes,
  ingredients,
  onChange,
}: {
  check: ScenarioCheck;
  recipes: Recipe[];
  ingredients: Ingredient[];
  onChange: (c: ScenarioCheck) => void;
}) {
  const b = useBackofficeText();
  const tierLabel = tierLabels(b);
  const courseLabel = courseLabels(b);
  const recipe =
    'recipeId' in check ? (
      <Field label={b.engRecipe}>
        <RecipeSelect
          recipes={recipes}
          value={check.recipeId}
          onChange={(recipeId) => onChange({ ...check, recipeId })}
        />
      </Field>
    ) : null;

  switch (check.kind) {
    case 'first':
      return (
        <>
          {recipe}
          <Field label={b.engFirstOfTier}>
            <TierSelect value={check.tier} onChange={(tier) => onChange({ ...check, tier })} />
          </Field>
        </>
      );
    case 'tier':
      return (
        <>
          {recipe}
          <Field label={b.engAcceptedTiers}>
            <div className="flex flex-wrap gap-3 text-xs text-ink">
              {([...TIERS, 'absent'] as const).map((t) => (
                <label key={t} className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={check.tiers.includes(t)}
                    onChange={(e) =>
                      onChange({
                        ...check,
                        tiers: e.target.checked ? [...check.tiers, t] : check.tiers.filter((x) => x !== t),
                      })
                    }
                  />
                  {tierLabel[t]}
                </label>
              ))}
            </div>
          </Field>
        </>
      );
    case 'contains':
      return (
        <>
          <Field label={b.engRecipes}>
            <RecipeChips
              ids={check.recipeIds}
              recipes={recipes}
              onChange={(recipeIds) => onChange({ ...check, recipeIds })}
            />
          </Field>
          <Field label={b.engAllInTier}>
            <TierSelect value={check.tier} onChange={(tier) => onChange({ ...check, tier })} />
          </Field>
        </>
      );
    case 'top':
      return (
        <>
          {recipe}
          <Field label={b.engTopN}>
            <NumberInput label="N" value={check.top} min={1} max={50} onChange={(top) => onChange({ ...check, top })} />
          </Field>
        </>
      );
    case 'noCourse':
      return (
        <Field label={b.engNoSuggestionOfType}>
          <select
            className={cls.input}
            value={check.course}
            aria-label={b.engCourseType}
            onChange={(e) => onChange({ ...check, course: e.target.value as MealCategory })}
          >
            {MEAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {courseLabel[c]}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'toBuy':
      return (
        <>
          {recipe}
          <Field label={b.engExactlyToBuy}>
            <IngredientChips
              ids={check.ingredientIds}
              ingredients={ingredients}
              onChange={(ingredientIds) => onChange({ ...check, ingredientIds })}
            />
          </Field>
        </>
      );
    case 'fridgeUsed':
      return (
        <>
          {recipe}
          <Field label={b.engFridgeUsedCount}>
            <NumberInput
              label={b.engNumber}
              value={check.count}
              min={0}
              max={100}
              onChange={(count) => onChange({ ...check, count })}
            />
          </Field>
        </>
      );
    case 'substitution':
      return (
        <>
          {recipe}
          <Field label={b.engInThisRecipe}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink">
              <IngredientSelect
                ingredients={ingredients}
                value={check.substituteId}
                placeholder={b.engSubstitute}
                onChange={(substituteId) => onChange({ ...check, substituteId })}
              />
              <select
                className={cls.input}
                value={check.allowed ? 'yes' : 'no'}
                aria-label={b.engAllowed}
                onChange={(e) => onChange({ ...check, allowed: e.target.value === 'yes' })}
              >
                <option value="yes">{b.engReplaces}</option>
                <option value="no">{b.engDoesNotReplace}</option>
              </select>
              <IngredientSelect
                ingredients={ingredients}
                value={check.ingredientId}
                placeholder={b.engRecipeIngredient}
                onChange={(ingredientId) => onChange({ ...check, ingredientId })}
              />
            </div>
          </Field>
        </>
      );
    case 'minScore':
      return (
        <>
          {recipe}
          <Field label={b.engMinScorePercent}>
            <NumberInput
              label={b.engScore}
              value={check.min}
              min={0}
              max={100}
              onChange={(min) => onChange({ ...check, min })}
            />
          </Field>
        </>
      );
  }
}

/**
 * Creates or edits a chef's scenario. The result is replayed live with the draft settings,
 * and saving is only possible once the scenario is complete.
 */
export function ScenarioEditorModal({
  scenario,
  isNew,
  recipes,
  ingredients,
  config,
  onSave,
  onClose,
}: {
  scenario: MatchingScenario;
  isNew: boolean;
  recipes: Recipe[];
  ingredients: Ingredient[];
  config: MatchingConfig;
  onSave: (scenario: MatchingScenario) => Promise<WriteResult>;
  onClose: () => void;
}) {
  useCloseOnBack(true, onClose);
  const b = useBackofficeText();
  const checkLabel = checkLabels(b);
  const courseLabel = courseLabels(b);
  const [draft, setDraft] = useState<MatchingScenario>(scenario);
  const [newKind, setNewKind] = useState<ScenarioCheckKind>('first');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismiss = useGuardedClose(JSON.stringify(draft) !== JSON.stringify(scenario), onClose, b.engDiscardScenario);
  const set = (patch: Partial<MatchingScenario>) => setDraft((d) => ({ ...d, ...patch }));
  const setChecks = (checks: ScenarioCheck[]) => set({ checks });

  const catalog = useMemo(
    () => ({ recipeIds: recipes.map((r) => r.id), ingredientIds: ingredients.map((i) => i.id) }),
    [recipes, ingredients]
  );
  const errors = useMemo(() => validateScenario(draft, catalog), [draft, catalog]);
  const result = useMemo(
    () => evaluateScenario(draft, { recipes, ingredients, defaultPantry: DEFAULT_PANTRY_STAPLES, config }),
    [draft, recipes, ingredients, config]
  );

  const save = async () => {
    if (errors.length) return;
    setSaving(true);
    const res = await onSave(draft);
    setSaving(false);
    if (res.ok) onClose();
    else setError(res.error);
  };

  const filters = draft.filters ?? {};
  const setFilter = (key: 'category' | 'cuisineType', value: string) => {
    const next = { ...filters, [key]: value || undefined };
    set({ filters: Object.values(next).some((v) => v !== undefined) ? next : undefined });
  };

  return (
    <ModalShell onDismiss={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? b.engNewScenario : format(b.engEditTitle, { title: scenario.title })}
        className="w-full max-w-2xl min-w-0 bg-surface rounded-2xl border border-line p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
          <h3 className="font-extrabold text-base text-ink min-w-0 truncate">
            {isNew ? b.engNewScenario : format(b.engEditTitle, { title: scenario.title })}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1 shrink-0" aria-label={b.close}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not a <form>: the chip buttons of the shared editors must not submit it */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4 min-w-0">
          {error && (
            <p
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold"
            >
              {error}
            </p>
          )}

          <Field label={b.engScenarioTitleField}>
            <input
              value={draft.title}
              maxLength={200}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={b.engScenarioTitlePlaceholder}
              className={`${cls.input} w-full`}
            />
          </Field>

          <Field label={b.engFridge}>
            <IngredientChips
              ids={draft.fridge}
              ingredients={ingredients}
              onChange={(fridge) => set({ fridge })}
              addLabel={b.engAddToFridge}
            />
          </Field>

          <Field label={b.engPantry}>
            <label className="inline-flex items-center gap-1.5 text-xs text-ink">
              <input
                type="checkbox"
                checked={draft.pantry !== undefined}
                onChange={(e) => set({ pantry: e.target.checked ? [] : undefined })}
              />
              {b.engCustomPantry}
            </label>
            {draft.pantry !== undefined && (
              <IngredientChips
                ids={draft.pantry}
                ingredients={ingredients}
                onChange={(pantry) => set({ pantry })}
                addLabel={b.engAddToPantry}
              />
            )}
          </Field>

          <Field label={b.engFilters}>
            <div className="flex flex-wrap gap-2">
              <select
                className={cls.input}
                value={filters.category ?? ''}
                aria-label={b.engCourseType}
                onChange={(e) => setFilter('category', e.target.value)}
              >
                <option value="">{b.engAllCourses}</option>
                {MEAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {courseLabel[c]}
                  </option>
                ))}
              </select>
              <select
                className={cls.input}
                value={filters.cuisineType ?? ''}
                aria-label={b.engCuisine}
                onChange={(e) => setFilter('cuisineType', e.target.value)}
              >
                <option value="">{b.engAllCuisines}</option>
                {cuisines(b).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <div className="space-y-2">
            <p className={cls.label}>{b.engChecks}</p>
            <ol className="space-y-2">
              {draft.checks.map((check, i) => (
                <li key={i} className="p-3 rounded-xl bg-card border border-line space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">
                      {i + 1}. {checkLabel[check.kind]}
                    </span>
                    <button
                      type="button"
                      className={cls.danger}
                      onClick={() => setChecks(draft.checks.filter((_, k) => k !== i))}
                    >
                      {b.engRemove}
                    </button>
                  </div>
                  <CheckFields
                    check={check}
                    recipes={recipes}
                    ingredients={ingredients}
                    onChange={(c) => setChecks(draft.checks.map((x, k) => (k === i ? c : x)))}
                  />
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${cls.input} max-w-full`}
                value={newKind}
                aria-label={b.engCheckType}
                onChange={(e) => setNewKind(e.target.value as ScenarioCheckKind)}
              >
                {SCENARIO_CHECK_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {checkLabel[k]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${cls.secondary} inline-flex items-center gap-1`}
                onClick={() => setChecks([...draft.checks, emptyCheck(newKind)])}
              >
                <Plus className="w-3.5 h-3.5" /> {b.engAddCheck}
              </button>
            </div>
          </div>

          {/* Live result with the draft engine settings */}
          <div className="p-3 rounded-xl border border-line bg-card space-y-1 text-xs">
            {errors.length > 0 ? (
              <>
                <p className="font-bold text-ink">{b.engToComplete}</p>
                <ul className="ml-4 list-disc text-ink-muted">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            ) : result.passed ? (
              <p className="flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {b.engPassedWithDraft}
              </p>
            ) : (
              <>
                <p className="flex items-center gap-1.5 font-bold text-rose-600">
                  <XCircle className="w-4 h-4 shrink-0" /> {b.engFailedWithDraft}
                </p>
                <ul className="ml-6 list-disc text-ink-muted">
                  {result.failures.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line">
          <button type="button" className={cls.secondary} onClick={onClose}>
            {b.cancel}
          </button>
          <button
            type="button"
            className={cls.primary}
            disabled={saving || errors.length > 0}
            onClick={() => void save()}
          >
            {saving ? b.engSaving : b.save}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
