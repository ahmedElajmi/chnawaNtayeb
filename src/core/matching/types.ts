import type { PriceRange, Recipe } from '../catalog/types';

export type MatchTier = 'ready' | 'almost' | 'ideas';

export interface Substitution {
  ingredient_id: string; // what the recipe asks for
  substitute_id: string; // what the user has instead
}

export interface MatchingResult {
  recipe: Recipe;
  score: number; // 0 to 100, weighted by ingredient role
  matched_ingredients: string[]; // ingredient IDs available (fridge, pantry or substitute)
  missing_ingredients: string[]; // key + secondary ingredients to buy (key first)
  missing_key: string[]; // subset of missing_ingredients that are key ingredients
  missing_staples: string[]; // staples not in fridge/pantry (informative only)
  substitutions: Substitution[];
  missing_cost: PriceRange; // rough cost range of missing_ingredients (DT)
  fridge_used: number; // how many fridge items (not pantry) the recipe uses
  tier: MatchTier;
}
