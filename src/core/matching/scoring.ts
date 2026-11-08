import type { MatchingConfig } from './config';
import type { RecipeFacts } from './analysis';

/**
 * Score from 0 to 100: share of the recipe the user can cook with what they have.
 * Only key and secondary ingredients count (a key one weighs more); a replacement counts
 * a little less than the real thing; missing pantry staples only remove a few points.
 */
export function scoreRecipe(facts: RecipeFacts, { scoring }: Pick<MatchingConfig, 'scoring'>): number {
  let total = 0;
  let got = 0;
  for (const item of facts.items) {
    if (item.role === 'staple') continue;
    const weight = item.role === 'key' ? scoring.keyWeight : scoring.secondaryWeight;
    total += weight;
    if (item.status === 'available') got += weight;
    else if (item.status === 'substituted') got += weight * scoring.substituteFactor;
  }
  const coverage = total > 0 ? (got / total) * 100 : 100;
  const penalty = Math.min(scoring.maxStaplePenalty, facts.missingStaples.length * scoring.staplePenalty);
  return Math.max(0, Math.round(coverage - penalty));
}
