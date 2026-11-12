import type { Ingredient, Recipe } from '../catalog/types';
import { DEFAULT_MATCHING_CONFIG, type MatchingConfig } from './config';
import { analyzeAvailability, createAvailability, type RecipeFacts } from './analysis';
import { scoreRecipe } from './scoring';
import { classifyRecipe } from './tiers';
import { rankTier } from './ranking';
import { createRecipeFilter, type FilterOptions } from './filters';
import type { MatchingResult } from './types';

/**
 * "Warini chnowa ntayeb": which recipes can I cook with my fridge?
 *
 * Pipeline, one module per step (each one tested and replaceable):
 *   filters.ts   → keep the recipes matching the user's filters
 *   analysis.ts  → for each recipe: available / replaced / missing ingredients
 *   scoring.ts   → score from 0 to 100
 *   tiers.ts     → ready / almost / ideas (or not shown)
 *   ranking.ts   → order inside each tier
 * Every threshold and weight comes from `MatchingConfig` (config.ts), editable by the admin.
 */

export interface MatchContext {
  /** Ingredients always available at home (salt, oil...), from the user's preferences */
  pantryIds?: string[];
  /** Ingredient catalog (role inference, missing cost) */
  catalog?: Ingredient[];
  /** Engine settings; the defaults when absent */
  config?: MatchingConfig;
  /** Current day (YYYY-MM-DD) for dated highlights; today when absent */
  today?: string;
}

export interface RecipeAnalysis extends RecipeFacts {
  score: number;
}

export interface MatchResults {
  ready: MatchingResult[];
  almost: MatchingResult[];
  ideas: MatchingResult[];
  totalMatches: number;
}

const indexCatalog = (catalog: Ingredient[] = []) => new Map(catalog.map((i) => [i.id, i]));

/** Detailed availability and score of one recipe (also used by the recipe screen). */
export function analyzeRecipe(recipe: Recipe, fridgeIds: Iterable<string>, ctx: MatchContext = {}): RecipeAnalysis {
  const config = ctx.config ?? DEFAULT_MATCHING_CONFIG;
  const facts = analyzeAvailability(
    recipe,
    createAvailability(fridgeIds, ctx.pantryIds),
    indexCatalog(ctx.catalog),
    config
  );
  return { ...facts, score: scoreRecipe(facts, config) };
}

interface Analyzed {
  related: MatchingResult[];
  /** Recipes kept by the filters but unrelated to the fridge (classified as no tier) */
  unrelated: MatchingResult[];
  config: MatchingConfig;
  today: string;
}

function analyzeAll(
  recipes: Recipe[],
  fridgeIds: string[],
  filters: FilterOptions | undefined,
  ctx: MatchContext
): Analyzed {
  const config = ctx.config ?? DEFAULT_MATCHING_CONFIG;
  const availability = createAvailability(fridgeIds, ctx.pantryIds);
  const ingredientsById = indexCatalog(ctx.catalog);
  const keep = createRecipeFilter(filters);
  const situation = { fridgeIsEmpty: fridgeIds.length === 0, isSearching: !!filters?.searchQuery?.trim() };

  const related: MatchingResult[] = [];
  const unrelated: MatchingResult[] = [];
  for (const recipe of recipes) {
    if (!keep(recipe)) continue;
    const facts = analyzeAvailability(recipe, availability, ingredientsById, config);
    const tier = classifyRecipe(facts, situation, config);
    (tier ? related : unrelated).push({
      recipe,
      score: scoreRecipe(facts, config),
      matched_ingredients: facts.matched,
      missing_ingredients: [...facts.missingKey, ...facts.missingSecondary],
      missing_key: facts.missingKey,
      missing_staples: facts.missingStaples,
      substitutions: facts.substitutions,
      missing_cost: facts.missingCost,
      fridge_used: facts.fridgeUsed,
      tier: tier ?? 'ideas',
    });
  }
  return { related, unrelated, config, today: ctx.today ?? new Date().toISOString().slice(0, 10) };
}

/** Suggestions for the fridge: only the recipes related to it, grouped by tier. */
export function matchRecipes(
  recipes: Recipe[],
  fridgeIds: string[],
  filters?: FilterOptions,
  ctx: MatchContext = {}
): MatchResults {
  const { related, config, today } = analyzeAll(recipes, fridgeIds, filters, ctx);
  const byTier = (tier: MatchingResult['tier']) =>
    rankTier(
      related.filter((r) => r.tier === tier),
      tier,
      config,
      today
    );
  return { ready: byTier('ready'), almost: byTier('almost'), ideas: byTier('ideas'), totalMatches: related.length };
}

/**
 * The whole catalog (with the filters applied), each recipe analyzed against the fridge:
 * the fridge suggestions first (ready → almost → ideas), then every other recipe.
 * Unrelated recipes are returned with the "ideas" tier.
 */
export function browseRecipes(
  recipes: Recipe[],
  fridgeIds: string[],
  filters?: FilterOptions,
  ctx: MatchContext = {}
): MatchingResult[] {
  const { related, unrelated, config, today } = analyzeAll(recipes, fridgeIds, filters, ctx);
  const tiers: MatchingResult['tier'][] = ['ready', 'almost', 'ideas'];
  return [
    ...tiers.flatMap((tier) =>
      rankTier(
        related.filter((r) => r.tier === tier),
        tier,
        config,
        today
      )
    ),
    ...rankTier(unrelated, 'ideas', config, today),
  ];
}
