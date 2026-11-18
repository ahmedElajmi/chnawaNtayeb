import type { PriceRange } from '../catalog/types';
import type { MatchingResult, MatchTier } from './types';

/**
 * Display rules of the matching engine: how to *present* a `MatchingResult`.
 *
 * Separation of responsibilities (directive du chef, lot 2.6.2):
 *   engine.ts / tiers.ts  → the ONLY sources of truth: score and tier computation;
 *   display.ts            → consumes an already computed tier and maps it, exhaustively, to an
 *                           explicit display level, reason codes and a suggested action type.
 * No threshold is recomputed here, no engine calculation is duplicated, no second source of truth:
 * `MatchingConfig.tiers` is never used to reproduce the engine. Reason codes and ingredient IDs are
 * returned; translation and presentation belong to the interface — no text and no language here.
 */

export type DisplayLevel = 'all-present' | 'almost' | 'ideas';

export type DisplayReasonCode =
  'missing-key' | 'missing-secondary' | 'substitution' | 'unknown-quantity' | 'missing-cost';

export type DisplayAction = 'view-recipe' | 'add-missing' | 'explore';

export interface DisplayReason {
  code: DisplayReasonCode;
  /** Ingredient IDs the reason is about (empty when the reason carries no ingredient) */
  ingredientIds: string[];
  /** What is used instead (code `substitution`) */
  substituteId?: string;
  /** Cost range of the missing purchases (code `missing-cost`) */
  cost?: PriceRange;
}

export interface DisplaySummary {
  level: DisplayLevel;
  /** Ordered: missing key first, then missing secondary, substitution, unknown quantity, cost */
  reasons: DisplayReason[];
  action: DisplayAction;
  /** The add-to-list suggestion, only when the recipe has missing purchases */
  secondaryAction?: 'add-missing';
}

/**
 * Exhaustive mapping tier → display level. The wording nuance lives in the interface (i18n):
 * `all-present` never means "ready to cook now" — quantities are still to be checked (D1).
 */
export function displayLevel(tier: MatchTier): DisplayLevel {
  switch (tier) {
    case 'ready':
      return 'all-present';
    case 'almost':
      return 'almost';
    case 'ideas':
      return 'ideas';
  }
}

/**
 * Today the stock model has no quantities (sequence 6b.7a/6b.7b): every present ingredient has an
 * unknown quantity. The `unknown-quantity` reason is therefore systematic for `all-present`; the
 * future "verified quantity" state will branch per item without any refactor.
 */
export function displaySummary(
  result: Pick<
    MatchingResult,
    'tier' | 'matched_ingredients' | 'missing_key' | 'missing_ingredients' | 'substitutions' | 'missing_cost'
  >
): DisplaySummary {
  const level = displayLevel(result.tier);
  const keySet = new Set(result.missing_key);
  const secondary = result.missing_ingredients.filter((id) => !keySet.has(id));
  const reasons: DisplayReason[] = [];

  if (result.missing_key.length > 0) {
    reasons.push({ code: 'missing-key', ingredientIds: result.missing_key });
  }
  if (secondary.length > 0) {
    reasons.push({ code: 'missing-secondary', ingredientIds: secondary });
  }
  for (const sub of result.substitutions) {
    reasons.push({ code: 'substitution', ingredientIds: [sub.ingredient_id], substituteId: sub.substitute_id });
  }
  if (level === 'all-present' && result.matched_ingredients.length > 0) {
    reasons.push({ code: 'unknown-quantity', ingredientIds: result.matched_ingredients });
  }
  if (result.missing_ingredients.length > 0) {
    reasons.push({ code: 'missing-cost', ingredientIds: [], cost: result.missing_cost });
  }

  const action: DisplayAction = level === 'ideas' ? 'explore' : 'view-recipe';
  const secondaryAction =
    level !== 'ideas' && result.missing_ingredients.length > 0 ? ('add-missing' as const) : undefined;
  return { level, reasons, action, secondaryAction };
}
