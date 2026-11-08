import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { DEFAULT_PANTRY_STAPLES } from '../preferences';
import { DEFAULT_MATCHING_CONFIG } from './config';
import { evaluateScenario, MATCHING_SCENARIOS } from './scenarios';

/** The chef's scenarios (scenarios.ts) must hold with the default engine settings. */
const env = {
  recipes: initialRecipes,
  ingredients: initialIngredients,
  defaultPantry: DEFAULT_PANTRY_STAPLES,
  config: DEFAULT_MATCHING_CONFIG,
};

describe('matching scenarios', () => {
  it.each(MATCHING_SCENARIOS.map((s) => [s.title, s] as const))('%s', (_title, scenario) => {
    expect(evaluateScenario(scenario, env).failures).toEqual([]);
  });

  it('a broken expectation is reported, not hidden', () => {
    const result = evaluateScenario(
      {
        id: 'x',
        title: 'x',
        fridge: ['ing_oeuf'],
        checks: [{ kind: 'first', recipeId: 'rec_inconnue', tier: 'ready' }],
      },
      env
    );
    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(1);
  });
});
