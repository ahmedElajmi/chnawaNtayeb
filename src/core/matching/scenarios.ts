import type { Ingredient, MealCategory, Recipe } from '../catalog/types';
import type { MatchingConfig } from './config';
import { analyzeRecipe, matchRecipes, type MatchResults } from './engine';
import type { FilterOptions } from './filters';
import type { MatchTier } from './types';

/**
 * Quality scenarios: "with this fridge, the user must see these dishes".
 * They describe a good suggestion for a Tunisian home cook. The chef manages them in the
 * backoffice (stored in the database) and replays them there before publishing new engine
 * settings. Stored data is read through `parseScenario` (scenarioSchema.ts).
 */

export type ScenarioCheck =
  /** The recipe is in this tier (or one of these tiers) */
  | { kind: 'tier'; recipeId: string; tiers: (MatchTier | 'absent')[] }
  /** The recipe is the first of this tier */
  | { kind: 'first'; recipeId: string; tier: MatchTier }
  /** The recipes are all in this tier */
  | { kind: 'contains'; recipeIds: string[]; tier: MatchTier }
  /** The recipe is among the first `top` suggestions (ready, then almost) */
  | { kind: 'top'; recipeId: string; top: number }
  /** No suggestion of this course */
  | { kind: 'noCourse'; course: MealCategory }
  /** Exactly these ingredients are left to buy for the recipe */
  | { kind: 'toBuy'; recipeId: string; ingredientIds: string[] }
  /** The recipe uses this many fridge ingredients */
  | { kind: 'fridgeUsed'; recipeId: string; count: number }
  /** In this recipe, `ingredientId` is (or is not) replaced by `substituteId` */
  | { kind: 'substitution'; recipeId: string; ingredientId: string; substituteId: string; allowed: boolean }
  /** The recipe score is at least `min` */
  | { kind: 'minScore'; recipeId: string; min: number };

export interface MatchingScenario {
  id: string;
  title: string;
  fridge: string[];
  /** Pantry used instead of the default one (e.g. [] for "nothing at home") */
  pantry?: string[];
  filters?: FilterOptions;
  checks: ScenarioCheck[];
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface ScenarioEnvironment {
  recipes: Recipe[];
  ingredients: Ingredient[];
  defaultPantry: string[];
  config: MatchingConfig;
  today?: string;
}

export interface ScenarioResult {
  scenario: MatchingScenario;
  passed: boolean;
  /** One readable message per failed check */
  failures: string[];
}

const TIERS: MatchTier[] = ['ready', 'almost', 'ideas'];
const idsOf = (res: MatchResults, tier: MatchTier) => res[tier].map((r) => r.recipe.id);
const tierOf = (res: MatchResults, id: string): MatchTier | 'absent' =>
  TIERS.find((t) => idsOf(res, t).includes(id)) ?? 'absent';
const findResult = (res: MatchResults, id: string) => TIERS.flatMap((t) => res[t]).find((r) => r.recipe.id === id);

export function evaluateScenario(scenario: MatchingScenario, env: ScenarioEnvironment): ScenarioResult {
  const ctx = {
    pantryIds: scenario.pantry ?? env.defaultPantry,
    catalog: env.ingredients,
    config: env.config,
    today: env.today,
  };
  const res = matchRecipes(env.recipes, scenario.fridge, scenario.filters, ctx);
  const recipe = (id: string) => env.recipes.find((r) => r.id === id);
  const failures: string[] = [];

  for (const check of scenario.checks) {
    switch (check.kind) {
      case 'tier': {
        const actual = tierOf(res, check.recipeId);
        if (!check.tiers.includes(actual))
          failures.push(`${check.recipeId} : ${actual} au lieu de ${check.tiers.join(' / ')}`);
        break;
      }
      case 'first': {
        const first = res[check.tier][0]?.recipe.id;
        if (first !== check.recipeId)
          failures.push(`${check.recipeId} n’est pas en tête de « ${check.tier} » (${first ?? 'vide'})`);
        break;
      }
      case 'contains': {
        const missing = check.recipeIds.filter((id) => !idsOf(res, check.tier).includes(id));
        if (missing.length) failures.push(`absentes de « ${check.tier} » : ${missing.join(', ')}`);
        break;
      }
      case 'top': {
        const top = [...idsOf(res, 'ready'), ...idsOf(res, 'almost')].slice(0, check.top);
        if (!top.includes(check.recipeId))
          failures.push(`${check.recipeId} hors des ${check.top} premières suggestions`);
        break;
      }
      case 'noCourse': {
        const wrong = TIERS.flatMap((t) => res[t]).filter((r) => r.recipe.category === check.course);
        if (wrong.length) failures.push(`${wrong.length} recette(s) « ${check.course} » proposée(s)`);
        break;
      }
      case 'toBuy': {
        const actual = findResult(res, check.recipeId)?.missing_ingredients ?? [];
        if (actual.join() !== check.ingredientIds.join())
          failures.push(`${check.recipeId} : à acheter ${actual.join(', ') || 'rien'}`);
        break;
      }
      case 'fridgeUsed': {
        const actual = findResult(res, check.recipeId)?.fridge_used;
        if (actual !== check.count)
          failures.push(`${check.recipeId} : ${actual ?? '?'} ingrédients du frigo au lieu de ${check.count}`);
        break;
      }
      case 'substitution': {
        const r = recipe(check.recipeId);
        const used = r
          ? analyzeRecipe(r, scenario.fridge, ctx).substitutions.some(
              (s) => s.ingredient_id === check.ingredientId && s.substitute_id === check.substituteId
            )
          : false;
        if (used !== check.allowed)
          failures.push(
            `${check.substituteId} ${check.allowed ? 'devrait' : 'ne devrait pas'} remplacer ${check.ingredientId}`
          );
        break;
      }
      case 'minScore': {
        const r = recipe(check.recipeId);
        const score = r ? analyzeRecipe(r, scenario.fridge, ctx).score : 0;
        if (score < check.min) failures.push(`${check.recipeId} : score ${score} < ${check.min}`);
        break;
      }
    }
  }
  return { scenario, passed: failures.length === 0, failures };
}

export function evaluateScenarios(env: ScenarioEnvironment, scenarios: MatchingScenario[]): ScenarioResult[] {
  return scenarios.map((s) => evaluateScenario(s, env));
}
