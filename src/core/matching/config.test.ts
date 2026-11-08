import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { DEFAULT_PANTRY_STAPLES } from '../preferences';
import { DEFAULT_MATCHING_CONFIG, resolveMatchingConfig } from './config';
import { matchRecipes } from './engine';

const run = (fridge: string[], config = DEFAULT_MATCHING_CONFIG) =>
  matchRecipes(initialRecipes, fridge, undefined, {
    pantryIds: DEFAULT_PANTRY_STAPLES,
    catalog: initialIngredients,
    config,
  });

describe('resolveMatchingConfig (settings stored by the admin)', () => {
  it('returns the defaults for missing or broken settings', () => {
    expect(resolveMatchingConfig(undefined)).toEqual(DEFAULT_MATCHING_CONFIG);
    expect(resolveMatchingConfig('not an object')).toEqual(DEFAULT_MATCHING_CONFIG);
    expect(resolveMatchingConfig({})).toEqual(DEFAULT_MATCHING_CONFIG);
  });

  it('keeps valid values, clamps out-of-range ones and ignores unknown ones', () => {
    const config = resolveMatchingConfig({
      scoring: { keyWeight: 5, substituteFactor: 3, staplePenalty: 'a lot' },
      tiers: { almostMaxToBuy: 99 },
      ranking: { ready: ['score', 'unknown', 'score'] },
      recipeBoosts: [
        { recipeId: 'rec_kafteji', weight: 50, until: '2026-12-31' },
        { recipeId: 3 },
        { recipeId: 'rec_a', until: 'demain' },
      ],
      substitutions: [{ ingredient: 'ing_a', substitutes: ['ing_b'] }, { ingredient: 3 }],
    });
    expect(config.scoring.keyWeight).toBe(5);
    expect(config.scoring.substituteFactor).toBe(1);
    expect(config.scoring.staplePenalty).toBe(DEFAULT_MATCHING_CONFIG.scoring.staplePenalty);
    expect(config.tiers.almostMaxToBuy).toBe(10);
    expect(config.ranking.ready).toEqual(['score']);
    expect(config.ranking.almost).toEqual(DEFAULT_MATCHING_CONFIG.ranking.almost);
    expect(config.recipeBoosts).toEqual([
      { recipeId: 'rec_kafteji', weight: 10, until: '2026-12-31' },
      { recipeId: 'rec_a', weight: 1 },
    ]);
    expect(config.substitutions).toEqual([{ ingredient: 'ing_a', substitutes: ['ing_b'] }]);
  });
});

describe('settings change the suggestions without changing the code', () => {
  it('a boosted recipe comes first in its tier', () => {
    const fridge = ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment'];
    const lastAlmost = run(fridge).almost.at(-1)!.recipe.id;
    const boosted = run(fridge, { ...DEFAULT_MATCHING_CONFIG, recipeBoosts: [{ recipeId: lastAlmost, weight: 1 }] });
    expect(boosted.almost[0].recipe.id).toBe(lastAlmost);
  });

  it('a highlight stops after its last day', () => {
    const fridge = ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment'];
    const lastAlmost = run(fridge).almost.at(-1)!.recipe.id;
    const config = {
      ...DEFAULT_MATCHING_CONFIG,
      recipeBoosts: [{ recipeId: lastAlmost, weight: 5, until: '2026-01-31' }],
    };
    const on = (today: string) =>
      matchRecipes(initialRecipes, fridge, undefined, {
        pantryIds: DEFAULT_PANTRY_STAPLES,
        catalog: initialIngredients,
        config,
        today,
      });
    expect(on('2026-01-31').almost[0].recipe.id).toBe(lastAlmost);
    expect(on('2026-02-01').almost[0].recipe.id).not.toBe(lastAlmost);
  });

  it('a stricter "almost" setting moves recipes to ideas', () => {
    const fridge = ['ing_oeuf', 'ing_tomate'];
    const strict = { ...DEFAULT_MATCHING_CONFIG, tiers: { ...DEFAULT_MATCHING_CONFIG.tiers, almostMaxMissingKey: 0 } };
    expect(run(fridge, strict).almost.every((r) => r.missing_key.length === 0)).toBe(true);
  });

  it('substitution rules come from the settings', () => {
    const fridge = ['ing_oeuf', 'ing_farine', 'ing_lait', 'ing_sucre'];
    const pancakes = (config = DEFAULT_MATCHING_CONFIG) =>
      [...run(fridge, config).ready, ...run(fridge, config).almost].find(
        (r) => r.recipe.id === 'rec_int_42_pancakes_moelleux'
      )!;
    expect(pancakes().tier).toBe('almost');
    const butterFromOil = {
      ...DEFAULT_MATCHING_CONFIG,
      substitutions: [{ ingredient: 'ing_beurre', substitutes: ['ing_huile_olive'] }],
    };
    expect(pancakes(butterFromOil).tier).toBe('ready');
  });
});
