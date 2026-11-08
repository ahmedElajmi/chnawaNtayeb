import { MEAL_CATEGORIES, type MealCategory } from '../catalog/types';
import type { FilterOptions } from './filters';
import type { MatchingScenario, ScenarioCheck } from './scenarios';
import type { MatchTier } from './types';

/**
 * Scenarios are edited in the backoffice and stored in the database: everything read back
 * (database, imported file) goes through `parseScenario`, and the editor uses `validateScenario`.
 */

export const SCENARIO_LIMITS = { title: 200, ingredients: 100, pantry: 300, checks: 30 } as const;

export type ScenarioCheckKind = ScenarioCheck['kind'];

export const SCENARIO_CHECK_KINDS: ScenarioCheckKind[] = [
  'first',
  'tier',
  'contains',
  'top',
  'noCourse',
  'toBuy',
  'fridgeUsed',
  'substitution',
  'minScore',
];

const TIERS: MatchTier[] = ['ready', 'almost', 'ideas'];
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/** A new check of this kind, with neutral values for the editor. */
export function emptyCheck(kind: ScenarioCheckKind): ScenarioCheck {
  switch (kind) {
    case 'tier':
      return { kind, recipeId: '', tiers: ['ready'] };
    case 'first':
      return { kind, recipeId: '', tier: 'ready' };
    case 'contains':
      return { kind, recipeIds: [], tier: 'almost' };
    case 'top':
      return { kind, recipeId: '', top: 3 };
    case 'noCourse':
      return { kind, course: 'dessert' };
    case 'toBuy':
      return { kind, recipeId: '', ingredientIds: [] };
    case 'fridgeUsed':
      return { kind, recipeId: '', count: 1 };
    case 'substitution':
      return { kind, recipeId: '', ingredientId: '', substituteId: '', allowed: true };
    case 'minScore':
      return { kind, recipeId: '', min: 80 };
  }
}

/** Readable id built from the title; `suffix` is injected (random) so the domain stays pure. */
export function scenarioIdFromTitle(title: string, suffix: string): string {
  const slug = title
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  const cleanSuffix = suffix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  return [slug || 'scenario', cleanSuffix].filter(Boolean).join('-');
}

// ---------------------------------------------------------------------------
// Parsing (untrusted data)
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const ids = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? [...new Set(v.map(str).filter(Boolean))].slice(0, max) : [];
const int = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null;
const isTier = (v: unknown): v is MatchTier => TIERS.includes(v as MatchTier);
const isCourse = (v: unknown): v is MealCategory => MEAL_CATEGORIES.includes(v as MealCategory);

function parseCheck(raw: unknown): ScenarioCheck | null {
  if (!isRecord(raw)) return null;
  const recipeId = str(raw.recipeId);
  switch (raw.kind) {
    case 'tier': {
      const tiers = Array.isArray(raw.tiers)
        ? [...new Set(raw.tiers.filter((t): t is MatchTier | 'absent' => isTier(t) || t === 'absent'))]
        : [];
      return tiers.length ? { kind: 'tier', recipeId, tiers } : null;
    }
    case 'first':
      return isTier(raw.tier) ? { kind: 'first', recipeId, tier: raw.tier } : null;
    case 'contains':
      return isTier(raw.tier)
        ? { kind: 'contains', recipeIds: ids(raw.recipeIds, SCENARIO_LIMITS.ingredients), tier: raw.tier }
        : null;
    case 'top': {
      const top = int(raw.top, 1, 50);
      return top === null ? null : { kind: 'top', recipeId, top };
    }
    case 'noCourse':
      return isCourse(raw.course) ? { kind: 'noCourse', course: raw.course } : null;
    case 'toBuy':
      return { kind: 'toBuy', recipeId, ingredientIds: ids(raw.ingredientIds, SCENARIO_LIMITS.ingredients) };
    case 'fridgeUsed': {
      const count = int(raw.count, 0, SCENARIO_LIMITS.ingredients);
      return count === null ? null : { kind: 'fridgeUsed', recipeId, count };
    }
    case 'substitution':
      return typeof raw.allowed === 'boolean'
        ? {
            kind: 'substitution',
            recipeId,
            ingredientId: str(raw.ingredientId),
            substituteId: str(raw.substituteId),
            allowed: raw.allowed,
          }
        : null;
    case 'minScore': {
      const min = int(raw.min, 0, 100);
      return min === null ? null : { kind: 'minScore', recipeId, min };
    }
    default:
      return null;
  }
}

function parseFilters(raw: unknown): FilterOptions | undefined {
  if (!isRecord(raw)) return undefined;
  const filters: FilterOptions = {};
  const category = str(raw.category);
  const cuisineType = str(raw.cuisineType);
  const budget = int(raw.maxBudget, 0, 10000);
  const time = int(raw.maxTotalTime, 0, 10000);
  if (category && category !== 'all') filters.category = category;
  if (cuisineType && cuisineType !== 'all') filters.cuisineType = cuisineType;
  if (budget) filters.maxBudget = budget;
  if (time) filters.maxTotalTime = time;
  if (raw.healthyOnly === true) filters.healthyOnly = true;
  return Object.keys(filters).length ? filters : undefined;
}

/** Clean scenario, or null when the data is not a scenario (no valid id or title). */
export function parseScenario(raw: unknown): MatchingScenario | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const title = str(raw.title).slice(0, SCENARIO_LIMITS.title);
  if (!ID_PATTERN.test(id) || !title) return null;
  const scenario: MatchingScenario = {
    id,
    title,
    fridge: ids(raw.fridge, SCENARIO_LIMITS.ingredients),
    checks: (Array.isArray(raw.checks) ? raw.checks : [])
      .map(parseCheck)
      .filter((c): c is ScenarioCheck => c !== null)
      .slice(0, SCENARIO_LIMITS.checks),
  };
  if (Array.isArray(raw.pantry)) scenario.pantry = ids(raw.pantry, SCENARIO_LIMITS.pantry);
  const filters = parseFilters(raw.filters);
  if (filters) scenario.filters = filters;
  return scenario;
}

/** Scenario list from an export (`{ scenarios: [...] }`) or a plain array; null when it is neither. */
export function parseScenarioList(raw: unknown): MatchingScenario[] | null {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.scenarios) ? raw.scenarios : null;
  if (!list) return null;
  const seen = new Set<string>();
  return list
    .map(parseScenario)
    .filter((s): s is MatchingScenario => s !== null && !seen.has(s.id) && !!seen.add(s.id));
}

// ---------------------------------------------------------------------------
// Validation (editor)
// ---------------------------------------------------------------------------

export interface ScenarioCatalog {
  recipeIds: string[];
  ingredientIds: string[];
}

function checkErrors(check: ScenarioCheck, n: number, catalog?: ScenarioCatalog): string[] {
  const errors: string[] = [];
  const at = `Vérification ${n}`;
  const knownRecipe = (id: string) => !catalog || catalog.recipeIds.includes(id);
  const knownIngredient = (id: string) => !catalog || catalog.ingredientIds.includes(id);
  const needRecipe = (id: string) => {
    if (!id) errors.push(`${at} : choisir une recette.`);
    else if (!knownRecipe(id)) errors.push(`${at} : recette inconnue (${id}).`);
  };
  const needIngredients = (list: string[]) => {
    const unknown = list.filter((id) => !knownIngredient(id));
    if (unknown.length) errors.push(`${at} : ingrédient(s) inconnu(s) (${unknown.join(', ')}).`);
  };

  switch (check.kind) {
    case 'contains':
      if (!check.recipeIds.length) errors.push(`${at} : choisir au moins une recette.`);
      check.recipeIds
        .filter((id) => !knownRecipe(id))
        .forEach((id) => errors.push(`${at} : recette inconnue (${id}).`));
      break;
    case 'noCourse':
      break;
    case 'tier':
      needRecipe(check.recipeId);
      if (!check.tiers.length) errors.push(`${at} : choisir au moins un niveau.`);
      break;
    case 'toBuy':
      needRecipe(check.recipeId);
      needIngredients(check.ingredientIds);
      break;
    case 'substitution':
      needRecipe(check.recipeId);
      if (!check.ingredientId || !check.substituteId) errors.push(`${at} : choisir l’ingrédient et son remplaçant.`);
      else if (check.ingredientId === check.substituteId)
        errors.push(`${at} : l’ingrédient et son remplaçant doivent être différents.`);
      needIngredients([check.ingredientId, check.substituteId].filter(Boolean));
      break;
    default:
      needRecipe(check.recipeId);
  }
  return errors;
}

/** Readable problems that prevent saving the scenario (empty list = valid). */
export function validateScenario(scenario: MatchingScenario, catalog?: ScenarioCatalog): string[] {
  const errors: string[] = [];
  if (!scenario.title.trim()) errors.push('Donner un titre au scénario.');
  if (scenario.title.length > SCENARIO_LIMITS.title)
    errors.push(`Titre trop long (${SCENARIO_LIMITS.title} caractères maximum).`);
  if (!scenario.fridge.length) errors.push('Mettre au moins un ingrédient dans le frigo.');
  if (scenario.fridge.length > SCENARIO_LIMITS.ingredients) errors.push('Trop d’ingrédients dans le frigo.');
  if (catalog) {
    const unknown = [...scenario.fridge, ...(scenario.pantry ?? [])].filter(
      (id) => !catalog.ingredientIds.includes(id)
    );
    if (unknown.length) errors.push(`Ingrédient(s) inconnu(s) : ${unknown.join(', ')}.`);
  }
  if (!scenario.checks.length) errors.push('Ajouter au moins une vérification.');
  if (scenario.checks.length > SCENARIO_LIMITS.checks)
    errors.push(`Trop de vérifications (${SCENARIO_LIMITS.checks} maximum).`);
  scenario.checks.forEach((c, i) => errors.push(...checkErrors(c, i + 1, catalog)));
  return errors;
}
