import { activeBoosts, type MatchingConfig, type RankingCriterion } from './config';
import type { MatchingResult, MatchTier } from './types';

type Comparator = (a: MatchingResult, b: MatchingResult) => number;
type BoostLookup = (recipeId: string) => number;

const totalTime = (r: MatchingResult) => r.recipe.prep_time_minutes + r.recipe.cook_time_minutes;

/** One comparator per criterion (negative = `a` first). */
function comparatorFor(criterion: RankingCriterion, boost: BoostLookup): Comparator {
  switch (criterion) {
    case 'boost':
      return (a, b) => boost(b.recipe.id) - boost(a.recipe.id);
    case 'fridgeUsed':
      return (a, b) => b.fridge_used - a.fridge_used;
    case 'score':
      return (a, b) => b.score - a.score;
    case 'toBuy':
      return (a, b) => a.missing_ingredients.length - b.missing_ingredients.length;
    case 'missingKey':
      return (a, b) => a.missing_key.length - b.missing_key.length;
    case 'time':
      return (a, b) => totalTime(a) - totalTime(b);
    case 'cost':
      return (a, b) => a.recipe.estimated_cost_tnd - b.recipe.estimated_cost_tnd;
  }
}

/**
 * Sorts the recipes of a tier with the criteria configured for it (then by name).
 * `today` (YYYY-MM-DD) decides which highlights are still active.
 */
export function rankTier(
  results: MatchingResult[],
  tier: MatchTier,
  config: Pick<MatchingConfig, 'ranking' | 'recipeBoosts'>,
  today: string
): MatchingResult[] {
  const boosts = activeBoosts(config, today);
  const boost: BoostLookup = (id) => boosts.get(id) ?? 0;
  const comparators = config.ranking[tier].map((c) => comparatorFor(c, boost));
  return [...results].sort((a, b) => {
    for (const compare of comparators) {
      const diff = compare(a, b);
      if (diff !== 0) return diff;
    }
    return a.recipe.name_fr.localeCompare(b.recipe.name_fr);
  });
}
