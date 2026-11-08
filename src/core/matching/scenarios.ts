import type { Ingredient, MealCategory, Recipe } from '../catalog/types';
import type { MatchingConfig } from './config';
import { analyzeRecipe, matchRecipes, type MatchResults } from './engine';
import type { FilterOptions } from './filters';
import type { MatchTier } from './types';

/**
 * Quality scenarios: "with this fridge, the user must see these dishes".
 * They describe a good suggestion for a Tunisian home cook. They run as automated tests
 * (scenarios.test.ts) AND in the backoffice, before the admin publishes new engine settings.
 * To be reviewed and completed by the chef.
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

export const MATCHING_SCENARIOS: MatchingScenario[] = [
  {
    id: 'eggs-tomatoes',
    title: 'Œufs + tomates : la tastira ne manque que de piment',
    fridge: ['ing_oeuf', 'ing_tomate'],
    checks: [{ kind: 'first', recipeId: 'rec_tn_08_tastira_tunisienne', tier: 'almost' }],
  },
  {
    id: 'eggs-tomatoes-onion-pepper',
    title: 'Œufs, tomates, oignon, piment : tastira prête, chakchouka et méchouia à une course',
    fridge: ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment'],
    checks: [
      { kind: 'tier', recipeId: 'rec_tn_08_tastira_tunisienne', tiers: ['ready'] },
      { kind: 'contains', recipeIds: ['rec_chakchouka_bsal', 'rec_slata_mechouia'], tier: 'almost' },
    ],
  },
  {
    id: 'ojja-merguez',
    title: 'Merguez, œufs, tomates, piment : l’ojja merguez en premier',
    fridge: ['ing_merguez', 'ing_oeuf', 'ing_tomate', 'ing_piment'],
    checks: [
      { kind: 'first', recipeId: 'rec_ojja_merguez', tier: 'ready' },
      {
        kind: 'substitution',
        recipeId: 'rec_ojja_merguez',
        ingredientId: 'ing_tomate_concentree',
        substituteId: 'ing_tomate',
        allowed: true,
      },
    ],
  },
  {
    id: 'couscous-basket',
    title: 'Panier couscous complet : le couscous au poulet en premier',
    fridge: [
      'ing_semoule_couscous',
      'ing_poulet',
      'ing_pois_chiches',
      'ing_carotte',
      'ing_pomme_de_terre',
      'ing_courgette',
      'ing_piment',
      'ing_oignon',
    ],
    checks: [{ kind: 'first', recipeId: 'rec_tn_19_couscous_au_poulet', tier: 'ready' }],
  },
  {
    id: 'chicken-potatoes',
    title: 'Poulet, pommes de terre, oignon : les poulets rôtis ne manquent que d’un citron',
    fridge: ['ing_poulet', 'ing_pomme_de_terre', 'ing_oignon'],
    checks: [
      {
        kind: 'contains',
        recipeIds: ['rec_tn_39_poulet_roti_aux_epices_tunis', 'rec_int_06_poulet_roti_aux_herbes'],
        tier: 'almost',
      },
    ],
  },
  {
    id: 'kaskrout',
    title: 'Pain, thon, œufs : le kaskrout en tête',
    fridge: ['ing_pain_baguette', 'ing_thon_boite', 'ing_oeuf'],
    checks: [{ kind: 'top', recipeId: 'rec_kaskrout_tounsi', top: 2 }],
  },
  {
    id: 'rice-milk',
    title: 'Riz + lait : le riz au lait est proposé',
    fridge: ['ing_riz', 'ing_lait'],
    checks: [{ kind: 'top', recipeId: 'rec_tn_50_riz_au_lait_a_la_fleur_d_ora', top: 3 }],
  },
  {
    id: 'cake-without-butter',
    title: 'Œufs, farine, lait, sucre : pas de pancakes « prêts » à l’huile d’olive',
    fridge: ['ing_oeuf', 'ing_farine', 'ing_lait', 'ing_sucre'],
    filters: { category: 'dessert' },
    checks: [
      { kind: 'tier', recipeId: 'rec_int_42_pancakes_moelleux', tiers: ['almost'] },
      { kind: 'toBuy', recipeId: 'rec_int_42_pancakes_moelleux', ingredientIds: ['ing_beurre'] },
    ],
  },
  {
    id: 'salad-needs-fresh-tomatoes',
    title: 'Le concentré ne remplace pas les tomates fraîches d’une salade',
    fridge: ['ing_concombre', 'ing_tomate_concentree'],
    checks: [
      {
        kind: 'substitution',
        recipeId: 'rec_slata_tounsia',
        ingredientId: 'ing_tomate',
        substituteId: 'ing_tomate_concentree',
        allowed: false,
      },
    ],
  },
  {
    id: 'two-keys-missing',
    title: 'Ojja merguez sans œufs ni merguez : jamais « presque prête »',
    fridge: ['ing_tomate', 'ing_piment', 'ing_oignon'],
    checks: [{ kind: 'tier', recipeId: 'rec_ojja_merguez', tiers: ['ideas', 'absent'] }],
  },
  {
    id: 'pasta-no-dessert',
    title: 'Seulement des pâtes : aucun dessert proposé',
    fridge: ['ing_pates'],
    checks: [{ kind: 'noCourse', course: 'dessert' }],
  },
  {
    id: 'fridge-counted-once',
    title: 'Chaque ingrédient du frigo est compté une seule fois',
    fridge: ['ing_oeuf', 'ing_tomate'],
    checks: [{ kind: 'fridgeUsed', recipeId: 'rec_ojja_merguez', count: 2 }],
  },
  {
    id: 'spices-weigh-little',
    title: 'Sans épices à la maison, le score reste élevé',
    fridge: ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_tomate_concentree', 'ing_piment'],
    pantry: [],
    checks: [{ kind: 'minScore', recipeId: 'rec_ojja_merguez', min: 90 }],
  },
];

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

export function evaluateScenarios(env: ScenarioEnvironment, scenarios = MATCHING_SCENARIOS): ScenarioResult[] {
  return scenarios.map((s) => evaluateScenario(s, env));
}
