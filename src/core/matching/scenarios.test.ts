import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { DEFAULT_PANTRY_STAPLES } from '../preferences';
import { DEFAULT_MATCHING_CONFIG } from './config';
import { evaluateScenario, evaluateScenarios, type MatchingScenario, type ScenarioCheck } from './scenarios';

/**
 * The chef's scenarios live in the database (backoffice). These tests only check that each kind
 * of verification is evaluated correctly, on the built-in catalog with the default settings.
 */
const env = {
  recipes: initialRecipes,
  ingredients: initialIngredients,
  defaultPantry: DEFAULT_PANTRY_STAPLES,
  config: DEFAULT_MATCHING_CONFIG,
};

const OJJA_FRIDGE = ['ing_merguez', 'ing_oeuf', 'ing_tomate', 'ing_piment'];

const scenario = (fridge: string[], checks: ScenarioCheck[], extra: Partial<MatchingScenario> = {}) =>
  evaluateScenario({ id: 'test', title: 'test', fridge, checks, ...extra }, env);

describe('evaluateScenario', () => {
  it.each<[string, string[], ScenarioCheck, ScenarioCheck, Partial<MatchingScenario>?]>([
    [
      'first',
      OJJA_FRIDGE,
      { kind: 'first', recipeId: 'rec_ojja_merguez', tier: 'ready' },
      { kind: 'first', recipeId: 'rec_ojja_merguez', tier: 'almost' },
    ],
    [
      'tier',
      ['ing_tomate', 'ing_piment', 'ing_oignon'],
      { kind: 'tier', recipeId: 'rec_ojja_merguez', tiers: ['ideas', 'absent'] },
      { kind: 'tier', recipeId: 'rec_ojja_merguez', tiers: ['ready'] },
    ],
    [
      'contains',
      ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment'],
      { kind: 'contains', recipeIds: ['rec_chakchouka_bsal', 'rec_slata_mechouia'], tier: 'almost' },
      { kind: 'contains', recipeIds: ['rec_chakchouka_bsal'], tier: 'ready' },
    ],
    [
      'top',
      ['ing_pain_baguette', 'ing_thon_boite', 'ing_oeuf'],
      { kind: 'top', recipeId: 'rec_kaskrout_tounsi', top: 2 },
      { kind: 'top', recipeId: 'rec_ojja_merguez', top: 1 },
    ],
    [
      'noCourse',
      ['ing_pates'],
      { kind: 'noCourse', course: 'dessert' },
      { kind: 'noCourse', course: 'plat_principal' },
    ],
    [
      'toBuy',
      ['ing_oeuf', 'ing_farine', 'ing_lait', 'ing_sucre'],
      { kind: 'toBuy', recipeId: 'rec_int_42_pancakes_moelleux', ingredientIds: ['ing_beurre'] },
      { kind: 'toBuy', recipeId: 'rec_int_42_pancakes_moelleux', ingredientIds: [] },
      { filters: { category: 'dessert' } },
    ],
    [
      'fridgeUsed',
      ['ing_oeuf', 'ing_tomate'],
      { kind: 'fridgeUsed', recipeId: 'rec_ojja_merguez', count: 2 },
      { kind: 'fridgeUsed', recipeId: 'rec_ojja_merguez', count: 3 },
    ],
    [
      'substitution',
      OJJA_FRIDGE,
      {
        kind: 'substitution',
        recipeId: 'rec_ojja_merguez',
        ingredientId: 'ing_tomate_concentree',
        substituteId: 'ing_tomate',
        allowed: true,
      },
      {
        kind: 'substitution',
        recipeId: 'rec_ojja_merguez',
        ingredientId: 'ing_tomate_concentree',
        substituteId: 'ing_tomate',
        allowed: false,
      },
    ],
    [
      'minScore',
      ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_tomate_concentree', 'ing_piment'],
      { kind: 'minScore', recipeId: 'rec_ojja_merguez', min: 90 },
      { kind: 'minScore', recipeId: 'rec_inconnue', min: 1 },
      { pantry: [] },
    ],
  ])('%s: passes when true, reports a failure otherwise', (_kind, fridge, ok, ko, extra) => {
    expect(scenario(fridge, [ok], extra).failures).toEqual([]);
    const broken = scenario(fridge, [ok, ko], extra);
    expect(broken.passed).toBe(false);
    expect(broken.failures).toHaveLength(1);
  });

  it('a custom pantry replaces the default one', () => {
    const check: ScenarioCheck = { kind: 'minScore', recipeId: 'rec_ojja_merguez', min: 95 };
    const fridge = OJJA_FRIDGE;
    expect(scenario(fridge, [check]).passed).toBe(true);
    expect(scenario(fridge, [check], { pantry: [] }).passed).toBe(false);
  });

  it('evaluateScenarios replays every given scenario', () => {
    const list: MatchingScenario[] = [
      { id: 'a', title: 'a', fridge: ['ing_pates'], checks: [{ kind: 'noCourse', course: 'dessert' }] },
      { id: 'b', title: 'b', fridge: ['ing_oeuf'], checks: [{ kind: 'first', recipeId: 'x', tier: 'ready' }] },
    ];
    expect(evaluateScenarios(env, list).map((r) => r.passed)).toEqual([true, false]);
  });
});
