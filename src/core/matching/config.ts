import { DEFAULT_SUBSTITUTION_RULES, type SubstitutionRule } from '../catalog/substitutions';
import type { MatchTier } from './types';

/**
 * Every setting of the matching engine, as plain JSON.
 * The defaults below are the reference behaviour (checked by the engine tests and by the
 * chef's scenarios replayed in the backoffice);
 * the admin can override any part of it (stored settings are merged with the defaults
 * and validated by `resolveMatchingConfig`, so a bad value can never break the engine).
 */

/** Criteria used to order the recipes of a tier, applied one after the other. */
export const RANKING_CRITERIA = ['boost', 'fridgeUsed', 'score', 'toBuy', 'missingKey', 'time', 'cost'] as const;
export type RankingCriterion = (typeof RANKING_CRITERIA)[number];

/** A recipe highlighted by the admin (recipe of the day, season, Ramadan...). */
export interface RecipeBoost {
  recipeId: string;
  /** Higher comes first (1–10) */
  weight: number;
  /** Last day of the highlight (YYYY-MM-DD), none = no end */
  until?: string;
}

export interface MatchingConfig {
  scoring: {
    /** Weight of a key / secondary ingredient in the score (pantry staples do not count). */
    keyWeight: number;
    secondaryWeight: number;
    /** A substitute counts this fraction of the real ingredient (0–1). */
    substituteFactor: number;
    /** Points removed for each missing pantry staple (salt, spices...), up to `maxStaplePenalty`. */
    staplePenalty: number;
    maxStaplePenalty: number;
  };
  tiers: {
    /** "Almost ready": at most this many ingredients to buy... */
    almostMaxToBuy: number;
    /** ...including at most this many key ingredients... */
    almostMaxMissingKey: number;
    /** ...and when a key ingredient is missing, at most this many purchases in total. */
    almostMaxToBuyWhenKeyMissing: number;
    /** A recipe that has no key ingredient is an "idea" from this many fridge ingredients. */
    ideasMinFridgeUsedWithoutKey: number;
  };
  /** Order of the recipes inside each tier. */
  ranking: Record<MatchTier, RankingCriterion[]>;
  /** Recipes highlighted by the admin. Used by the `boost` ranking criterion. */
  recipeBoosts: RecipeBoost[];
  substitutions: SubstitutionRule[];
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  scoring: { keyWeight: 3, secondaryWeight: 1, substituteFactor: 0.8, staplePenalty: 2, maxStaplePenalty: 10 },
  tiers: {
    almostMaxToBuy: 2,
    almostMaxMissingKey: 1,
    almostMaxToBuyWhenKeyMissing: 1,
    ideasMinFridgeUsedWithoutKey: 2,
  },
  ranking: {
    // Ready: use as much of the fridge as possible (anti-waste)
    ready: ['boost', 'fridgeUsed', 'score', 'time', 'cost'],
    // Almost: the fewest purchases first
    almost: ['boost', 'toBuy', 'missingKey', 'score', 'fridgeUsed', 'time'],
    ideas: ['boost', 'score', 'fridgeUsed', 'time'],
  },
  recipeBoosts: [],
  substitutions: DEFAULT_SUBSTITUTION_RULES,
};

// ---------------------------------------------------------------------------
// Validation of stored settings
// ---------------------------------------------------------------------------

type Partial2<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };
export type MatchingConfigInput = Partial2<MatchingConfig>;

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function number(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function numbers<T extends Record<string, number>>(input: unknown, defaults: T, min: number, max: number): T {
  const source = isObject(input) ? input : {};
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, number(source[key], fallback, min, max)])
  ) as T;
}

function ranking(value: unknown, fallback: RankingCriterion[]): RankingCriterion[] {
  if (!Array.isArray(value)) return fallback;
  const valid = value.filter((c): c is RankingCriterion => RANKING_CRITERIA.includes(c as RankingCriterion));
  return valid.length ? Array.from(new Set(valid)) : fallback;
}

function substitutionRules(value: unknown): SubstitutionRule[] {
  if (!Array.isArray(value)) return DEFAULT_MATCHING_CONFIG.substitutions;
  return value.filter(
    (r): r is SubstitutionRule =>
      isObject(r) &&
      typeof r.ingredient === 'string' &&
      Array.isArray(r.substitutes) &&
      r.substitutes.every((s) => typeof s === 'string')
  );
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function recipeBoosts(value: unknown): RecipeBoost[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((b): RecipeBoost[] => {
    if (!isObject(b) || typeof b.recipeId !== 'string' || !b.recipeId) return [];
    const boost: RecipeBoost = { recipeId: b.recipeId, weight: number(b.weight, 1, 1, 10) };
    if (typeof b.until === 'string' && DAY_RE.test(b.until)) boost.until = b.until;
    return [boost];
  });
}

/** Active highlights on a given day (YYYY-MM-DD): recipe id → weight. */
export function activeBoosts(config: Pick<MatchingConfig, 'recipeBoosts'>, today: string): Map<string, number> {
  return new Map(config.recipeBoosts.filter((b) => !b.until || b.until >= today).map((b) => [b.recipeId, b.weight]));
}

/** Merges stored (possibly partial, old or hand-edited) settings with the defaults. Never throws. */
export function resolveMatchingConfig(input?: unknown): MatchingConfig {
  if (!isObject(input)) return DEFAULT_MATCHING_CONFIG;
  const d = DEFAULT_MATCHING_CONFIG;
  const scoring = numbers(input.scoring, d.scoring, 0, 100);
  scoring.substituteFactor = Math.min(1, scoring.substituteFactor);
  const rankingInput = isObject(input.ranking) ? input.ranking : {};
  return {
    scoring,
    tiers: numbers(input.tiers, d.tiers, 0, 10),
    ranking: {
      ready: ranking(rankingInput.ready, d.ranking.ready),
      almost: ranking(rankingInput.almost, d.ranking.almost),
      ideas: ranking(rankingInput.ideas, d.ranking.ideas),
    },
    recipeBoosts: recipeBoosts(input.recipeBoosts),
    substitutions: substitutionRules(input.substitutions),
  };
}
