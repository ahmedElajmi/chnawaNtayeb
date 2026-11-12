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

export const CHECK_LABEL: Record<ScenarioCheckKind, string> = {
  first: 'Recette en tête d’un niveau',
  tier: 'Recette dans un niveau',
  contains: 'Recettes toutes dans un niveau',
  top: 'Recette parmi les N premières',
  noCourse: 'Aucun plat d’un type',
  toBuy: 'Ingrédients à acheter',
  fridgeUsed: 'Ingrédients du frigo utilisés',
  substitution: 'Remplacement d’ingrédient',
  minScore: 'Score minimum',
};

const TIER_LABEL: Record<MatchTier | 'absent', string> = {
  ready: 'Prête',
  almost: 'Presque prête',
  ideas: 'Idée',
  absent: 'Absente',
};
const TIERS: MatchTier[] = ['ready', 'almost', 'ideas'];
const COURSE_LABEL: Record<MealCategory, string> = { entree: 'Entrée', plat_principal: 'Plat', dessert: 'Dessert' };
const CUISINES: [CuisineType, string][] = [
  ['traditionnelle', 'Traditionnelle'],
  ['rapide', 'Rapide'],
  ['economique', 'Économique'],
  ['familiale', 'Familiale'],
  ['vegetarienne', 'Végétarienne'],
  ['internationale', 'Internationale'],
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
  return (
    <select
      className={`${cls.input} max-w-full`}
      value={value}
      onChange={(e) => onChange(e.target.value as MatchTier)}
      aria-label="Niveau"
    >
      {TIERS.map((t) => (
        <option key={t} value={t}>
          {TIER_LABEL[t]}
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
  const recipe =
    'recipeId' in check ? (
      <Field label="Recette">
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
          <Field label="En tête du niveau">
            <TierSelect value={check.tier} onChange={(tier) => onChange({ ...check, tier })} />
          </Field>
        </>
      );
    case 'tier':
      return (
        <>
          {recipe}
          <Field label="Niveau(x) accepté(s)">
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
                  {TIER_LABEL[t]}
                </label>
              ))}
            </div>
          </Field>
        </>
      );
    case 'contains':
      return (
        <>
          <Field label="Recettes">
            <RecipeChips
              ids={check.recipeIds}
              recipes={recipes}
              onChange={(recipeIds) => onChange({ ...check, recipeIds })}
            />
          </Field>
          <Field label="Toutes dans le niveau">
            <TierSelect value={check.tier} onChange={(tier) => onChange({ ...check, tier })} />
          </Field>
        </>
      );
    case 'top':
      return (
        <>
          {recipe}
          <Field label="Parmi les N premières suggestions (prêtes puis presque prêtes)">
            <NumberInput label="N" value={check.top} min={1} max={50} onChange={(top) => onChange({ ...check, top })} />
          </Field>
        </>
      );
    case 'noCourse':
      return (
        <Field label="Aucune suggestion de type">
          <select
            className={cls.input}
            value={check.course}
            aria-label="Type de plat"
            onChange={(e) => onChange({ ...check, course: e.target.value as MealCategory })}
          >
            {MEAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {COURSE_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'toBuy':
      return (
        <>
          {recipe}
          <Field label="Exactement ces ingrédients à acheter (vide = rien à acheter)">
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
          <Field label="Nombre d’ingrédients du frigo utilisés">
            <NumberInput
              label="Nombre"
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
          <Field label="Dans cette recette">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink">
              <IngredientSelect
                ingredients={ingredients}
                value={check.substituteId}
                placeholder="Remplaçant"
                onChange={(substituteId) => onChange({ ...check, substituteId })}
              />
              <select
                className={cls.input}
                value={check.allowed ? 'yes' : 'no'}
                aria-label="Autorisé"
                onChange={(e) => onChange({ ...check, allowed: e.target.value === 'yes' })}
              >
                <option value="yes">remplace</option>
                <option value="no">ne remplace pas</option>
              </select>
              <IngredientSelect
                ingredients={ingredients}
                value={check.ingredientId}
                placeholder="Ingrédient de la recette"
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
          <Field label="Score minimum (%)">
            <NumberInput
              label="Score"
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
  const [draft, setDraft] = useState<MatchingScenario>(scenario);
  const [newKind, setNewKind] = useState<ScenarioCheckKind>('first');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismiss = useGuardedClose(
    JSON.stringify(draft) !== JSON.stringify(scenario),
    onClose,
    'Abandonner les modifications de ce scénario ?'
  );
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
        aria-label={isNew ? 'Nouveau scénario' : `Modifier : ${scenario.title}`}
        className="w-full max-w-2xl min-w-0 bg-surface rounded-2xl border border-line p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
          <h3 className="font-extrabold text-base text-ink min-w-0 truncate">
            {isNew ? 'Nouveau scénario' : `Modifier : ${scenario.title}`}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1 shrink-0" aria-label="Fermer">
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

          <Field label="Titre (ce que l’on doit voir avec ce frigo)">
            <input
              value={draft.title}
              maxLength={200}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Ex. : Œufs + tomates : la tastira ne manque que de piment"
              className={`${cls.input} w-full`}
            />
          </Field>

          <Field label="Frigo">
            <IngredientChips
              ids={draft.fridge}
              ingredients={ingredients}
              onChange={(fridge) => set({ fridge })}
              addLabel="Ajouter au frigo…"
            />
          </Field>

          <Field label="Placard">
            <label className="inline-flex items-center gap-1.5 text-xs text-ink">
              <input
                type="checkbox"
                checked={draft.pantry !== undefined}
                onChange={(e) => set({ pantry: e.target.checked ? [] : undefined })}
              />
              Placard personnalisé (sinon : placard par défaut)
            </label>
            {draft.pantry !== undefined && (
              <IngredientChips
                ids={draft.pantry}
                ingredients={ingredients}
                onChange={(pantry) => set({ pantry })}
                addLabel="Ajouter au placard…"
              />
            )}
          </Field>

          <Field label="Filtres (optionnels)">
            <div className="flex flex-wrap gap-2">
              <select
                className={cls.input}
                value={filters.category ?? ''}
                aria-label="Type de plat"
                onChange={(e) => setFilter('category', e.target.value)}
              >
                <option value="">Tous les plats</option>
                {MEAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {COURSE_LABEL[c]}
                  </option>
                ))}
              </select>
              <select
                className={cls.input}
                value={filters.cuisineType ?? ''}
                aria-label="Cuisine"
                onChange={(e) => setFilter('cuisineType', e.target.value)}
              >
                <option value="">Toutes les cuisines</option>
                {CUISINES.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <div className="space-y-2">
            <p className={cls.label}>Vérifications</p>
            <ol className="space-y-2">
              {draft.checks.map((check, i) => (
                <li key={i} className="p-3 rounded-xl bg-card border border-line space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">
                      {i + 1}. {CHECK_LABEL[check.kind]}
                    </span>
                    <button
                      type="button"
                      className={cls.danger}
                      onClick={() => setChecks(draft.checks.filter((_, k) => k !== i))}
                    >
                      Retirer
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
                aria-label="Type de vérification"
                onChange={(e) => setNewKind(e.target.value as ScenarioCheckKind)}
              >
                {SCENARIO_CHECK_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {CHECK_LABEL[k]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${cls.secondary} inline-flex items-center gap-1`}
                onClick={() => setChecks([...draft.checks, emptyCheck(newKind)])}
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter la vérification
              </button>
            </div>
          </div>

          {/* Live result with the draft engine settings */}
          <div className="p-3 rounded-xl border border-line bg-card space-y-1 text-xs">
            {errors.length > 0 ? (
              <>
                <p className="font-bold text-ink">À compléter avant d’enregistrer :</p>
                <ul className="ml-4 list-disc text-ink-muted">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            ) : result.passed ? (
              <p className="flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Respecté avec les réglages du brouillon
              </p>
            ) : (
              <>
                <p className="flex items-center gap-1.5 font-bold text-rose-600">
                  <XCircle className="w-4 h-4 shrink-0" /> Non respecté avec les réglages du brouillon
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
            Annuler
          </button>
          <button
            type="button"
            className={cls.primary}
            disabled={saving || errors.length > 0}
            onClick={() => void save()}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
