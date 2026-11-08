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

export function matchRecipes(
  recipes: Recipe[],
  fridgeIds: string[],
  filters?: FilterOptions,
  ctx: MatchContext = {}
): MatchResults {
  const config = ctx.config ?? DEFAULT_MATCHING_CONFIG;
  const availability = createAvailability(fridgeIds, ctx.pantryIds);
  const ingredientsById = indexCatalog(ctx.catalog);
  const keep = createRecipeFilter(filters);
  const situation = { fridgeIsEmpty: fridgeIds.length === 0, isSearching: !!filters?.searchQuery?.trim() };

  const results: MatchingResult[] = [];
  for (const recipe of recipes) {
    if (!keep(recipe)) continue;
    const facts = analyzeAvailability(recipe, availability, ingredientsById, config);
    const tier = classifyRecipe(facts, situation, config);
    if (!tier) continue;
    results.push({
      recipe,
      score: scoreRecipe(facts, config),
      matched_ingredients: facts.matched,
      missing_ingredients: [...facts.missingKey, ...facts.missingSecondary],
      missing_key: facts.missingKey,
      missing_staples: facts.missingStaples,
      substitutions: facts.substitutions,
      missing_cost_tnd: facts.missingCost,
      fridge_used: facts.fridgeUsed,
      tier,
    });
  }

  const today = ctx.today ?? new Date().toISOString().slice(0, 10);
  const byTier = (tier: MatchingResult['tier']) =>
    rankTier(
      results.filter((r) => r.tier === tier),
      tier,
      config,
      today
    );
  return { ready: byTier('ready'), almost: byTier('almost'), ideas: byTier('ideas'), totalMatches: results.length };
}
