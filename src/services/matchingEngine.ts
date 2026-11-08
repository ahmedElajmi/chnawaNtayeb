import { Recipe, MatchingResult, Ingredient, IngredientRole, Substitution } from '../types';
import { getRole, getSubstitutes } from './ingredientRoles';
import { normalizeText } from './textNormalize';
import { normalizeCategory } from './mealCourse';

export interface FilterOptions {
  maxBudget?: number; // In Dinars (DT)
  maxTotalTime?: number; // In minutes
  category?: string; // 'all' or MealCategory
  cuisineType?: string; // 'all' or CuisineType
  searchQuery?: string;
  healthyOnly?: boolean;
}

export interface MatchContext {
  /** Ingredients always available at home (salt, oil...), from the user's preferences */
  pantryIds?: string[];
  /** Ingredient catalog, used for role inference and missing cost */
  catalog?: Ingredient[];
}

/** Weight of each role in the score: missing salt must not weigh like missing merguez. */
export const ROLE_WEIGHTS: Record<IngredientRole, number> = { key: 3, secondary: 1, staple: 0.25 };
/** A substitute is good, but not as good as the real thing. */
export const SUBSTITUTE_FACTOR = 0.8;
/** "Almost ready" = every key ingredient available and at most this many secondary ones to buy. */
export const MAX_MISSING_FOR_ALMOST = 2;

export interface RecipeAnalysis {
  score: number;
  matched: string[];
  missingKey: string[];
  missingSecondary: string[];
  missingStaples: string[];
  substitutions: Substitution[];
  keyAvailable: number;
  keyTotal: number;
  fridgeUsed: number;
  missingCost: number;
}

/** Detailed availability of one recipe's ingredients (also used by the recipe detail screen). */
export function analyzeRecipe(recipe: Recipe, fridgeIds: Iterable<string>, ctx: MatchContext = {}): RecipeAnalysis {
  const fridge = new Set(fridgeIds);
  const pantry = new Set(ctx.pantryIds ?? []);
  const has = (id: string) => fridge.has(id) || pantry.has(id);

  let total = 0;
  let got = 0;
  const result: RecipeAnalysis = {
    score: 0,
    matched: [],
    missingKey: [],
    missingSecondary: [],
    missingStaples: [],
    substitutions: [],
    keyAvailable: 0,
    keyTotal: 0,
    fridgeUsed: 0,
    missingCost: 0,
  };

  for (const item of recipe.ingredients) {
    if (item.is_optional) continue;
    const role = getRole(item, ctx.catalog);
    const weight = ROLE_WEIGHTS[role];
    total += weight;
    if (role === 'key') result.keyTotal++;

    if (has(item.ingredient_id)) {
      got += weight;
      result.matched.push(item.ingredient_id);
      if (fridge.has(item.ingredient_id)) result.fridgeUsed++;
      if (role === 'key') result.keyAvailable++;
      continue;
    }

    const substitute = getSubstitutes(item).find(has);
    if (substitute) {
      got += weight * SUBSTITUTE_FACTOR;
      result.matched.push(item.ingredient_id);
      result.substitutions.push({ ingredient_id: item.ingredient_id, substitute_id: substitute });
      if (fridge.has(substitute)) result.fridgeUsed++;
      if (role === 'key') result.keyAvailable++;
      continue;
    }

    if (role === 'key') result.missingKey.push(item.ingredient_id);
    else if (role === 'secondary') result.missingSecondary.push(item.ingredient_id);
    else result.missingStaples.push(item.ingredient_id);

    if (role !== 'staple') {
      const price = ctx.catalog?.find((i) => i.id === item.ingredient_id)?.default_price_tnd ?? 0;
      result.missingCost += price;
    }
  }

  result.score = total > 0 ? Math.round((got / total) * 100) : 100;
  result.missingCost = Math.round(result.missingCost * 10) / 10;
  return result;
}

function passesFilters(recipe: Recipe, filters?: FilterOptions): boolean {
  if (!recipe.is_published) return false;
  if (filters?.category && filters.category !== 'all' && normalizeCategory(recipe.category) !== filters.category) return false;
  if (filters?.healthyOnly && !recipe.is_healthy) return false;
  if (filters?.cuisineType && filters.cuisineType !== 'all' && recipe.cuisine_type !== filters.cuisineType) return false;
  if (filters?.maxBudget && recipe.estimated_cost_tnd > filters.maxBudget) return false;
  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  if (filters?.maxTotalTime && totalTime > filters.maxTotalTime) return false;
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = normalizeText(filters.searchQuery);
    const names = [recipe.name_fr, recipe.name_derja, recipe.name_ar].map(normalizeText);
    if (!names.some((n) => n.includes(q))) return false;
  }
  return true;
}

export function matchRecipes(
  recipes: Recipe[],
  selectedIngredientIds: string[],
  filters?: FilterOptions,
  ctx: MatchContext = {}
): {
  ready: MatchingResult[];
  almost: MatchingResult[];
  ideas: MatchingResult[];
  totalMatches: number;
} {
  const fridgeIsEmpty = selectedIngredientIds.length === 0;
  const isSearching = !!filters?.searchQuery?.trim();
  const results: MatchingResult[] = [];

  for (const recipe of recipes) {
    if (!passesFilters(recipe, filters)) continue;

    const a = analyzeRecipe(recipe, selectedIngredientIds, ctx);
    const missingToBuy = [...a.missingKey, ...a.missingSecondary];

    let tier: MatchingResult['tier'] | null;
    if (fridgeIsEmpty) {
      // Nothing selected yet: browsing mode, every recipe is an idea
      tier = 'ideas';
    } else if (missingToBuy.length === 0) {
      tier = 'ready';
    } else if (a.missingKey.length === 0 && a.missingSecondary.length <= MAX_MISSING_FOR_ALMOST) {
      tier = 'almost';
    } else if (a.keyAvailable > 0 || (a.keyTotal === 0 && a.fridgeUsed > 0)) {
      tier = 'ideas';
    } else {
      // Not a single key ingredient: unrelated to the fridge, unless the user searched for it by name
      tier = isSearching ? 'ideas' : null;
    }
    if (!tier) continue;

    results.push({
      recipe,
      score: a.score,
      matched_ingredients: a.matched,
      missing_ingredients: missingToBuy,
      missing_key: a.missingKey,
      missing_staples: a.missingStaples,
      substitutions: a.substitutions,
      missing_cost_tnd: a.missingCost,
      fridge_used: a.fridgeUsed,
      tier,
    });
  }

  // Best score first; on a tie, prefer recipes that use more of the fridge, then quicker, then cheaper
  const sorter = (x: MatchingResult, y: MatchingResult) => {
    if (y.score !== x.score) return y.score - x.score;
    if (y.fridge_used !== x.fridge_used) return y.fridge_used - x.fridge_used;
    const timeX = x.recipe.prep_time_minutes + x.recipe.cook_time_minutes;
    const timeY = y.recipe.prep_time_minutes + y.recipe.cook_time_minutes;
    if (timeX !== timeY) return timeX - timeY;
    return x.recipe.estimated_cost_tnd - y.recipe.estimated_cost_tnd;
  };

  return {
    ready: results.filter((r) => r.tier === 'ready').sort(sorter),
    almost: results.filter((r) => r.tier === 'almost').sort(sorter),
    ideas: results.filter((r) => r.tier === 'ideas').sort(sorter),
    totalMatches: results.length,
  };
}

export function scaleIngredients(
  recipe: Recipe,
  targetServings: number
): { ingredient_id: string; quantity: number; unit: string; is_optional?: boolean }[] {
  const ratio = Math.max(1, targetServings) / Math.max(1, recipe.base_servings);

  return recipe.ingredients.map((item) => {
    const rawQty = item.quantity_base * ratio;
    // Format quantity cleanly (round to 1 decimal place or whole number)
    const rounded = rawQty >= 10 ? Math.round(rawQty) : Math.round(rawQty * 10) / 10;
    return {
      ingredient_id: item.ingredient_id,
      quantity: rounded,
      unit: item.unit,
      is_optional: item.is_optional,
    };
  });
}
