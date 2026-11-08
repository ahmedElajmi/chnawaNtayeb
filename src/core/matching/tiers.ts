import type { MatchingConfig } from './config';
import type { RecipeFacts } from './analysis';
import type { MatchTier } from './types';

export interface TierSituation {
  /** Nothing in the fridge: browsing mode, every recipe is an idea */
  fridgeIsEmpty: boolean;
  /** The user searched a dish by name: unrelated recipes are still shown */
  isSearching: boolean;
}

/**
 * - ready: nothing to buy, and the recipe uses the fridge;
 * - almost: one or two purchases (a missing key ingredient only when it is the single purchase);
 * - ideas: related to the fridge (at least one key ingredient available; for a recipe without
 *   key ingredient, several fridge ingredients);
 * - null: unrelated, not shown (unless searched by name).
 */
export function classifyRecipe(
  facts: RecipeFacts,
  situation: TierSituation,
  { tiers }: Pick<MatchingConfig, 'tiers'>
): MatchTier | null {
  if (situation.fridgeIsEmpty) return 'ideas';

  const toBuy = facts.missingKey.length + facts.missingSecondary.length;
  const usesFridge = facts.fridgeUsed > 0;

  if (usesFridge && toBuy === 0) return 'ready';
  if (
    usesFridge &&
    toBuy <= tiers.almostMaxToBuy &&
    facts.missingKey.length <= tiers.almostMaxMissingKey &&
    (facts.missingKey.length === 0 || toBuy <= tiers.almostMaxToBuyWhenKeyMissing)
  ) {
    return 'almost';
  }
  // A dish whose key ingredients are all missing is not an idea for this fridge
  if (usesFridge && facts.keyAvailable > 0) return 'ideas';
  if (facts.keyTotal === 0 && facts.fridgeUsed >= tiers.ideasMinFridgeUsedWithoutKey) return 'ideas';
  return situation.isSearching ? 'ideas' : null;
}
