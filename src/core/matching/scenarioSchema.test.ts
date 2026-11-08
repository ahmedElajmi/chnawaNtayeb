import { describe, expect, it } from 'vitest';
import {
  emptyCheck,
  parseScenario,
  parseScenarioList,
  SCENARIO_CHECK_KINDS,
  scenarioIdFromTitle,
  validateScenario,
} from './scenarioSchema';
import type { MatchingScenario } from './scenarios';

const valid: MatchingScenario = {
  id: 'eggs-tomatoes',
  title: 'Œufs + tomates',
  fridge: ['ing_oeuf', 'ing_tomate'],
  checks: [{ kind: 'first', recipeId: 'rec_tastira', tier: 'almost' }],
};
const catalog = { recipeIds: ['rec_tastira'], ingredientIds: ['ing_oeuf', 'ing_tomate', 'ing_piment'] };

describe('parseScenario', () => {
  it('keeps a valid scenario unchanged', () => {
    expect(parseScenario(valid)).toEqual(valid);
  });

  it('rejects data that is not a scenario', () => {
    expect(parseScenario(null)).toBeNull();
    expect(parseScenario({ ...valid, id: 'bad id/with slash' })).toBeNull();
    expect(parseScenario({ ...valid, title: '  ' })).toBeNull();
  });

  it('cleans lists, drops unknown checks and unknown filter values', () => {
    const parsed = parseScenario({
      ...valid,
      fridge: ['ing_oeuf', 'ing_oeuf', 42, ' ing_tomate '],
      filters: { category: 'all', maxBudget: 12, unknown: true },
      checks: [
        { kind: 'first', recipeId: 'r', tier: 'nope' },
        { kind: 'hack' },
        { kind: 'minScore', recipeId: 'r', min: 250 },
        { kind: 'tier', recipeId: 'r', tiers: ['ready', 'absent', 'x'] },
      ],
    });
    expect(parsed).toEqual({
      ...valid,
      fridge: ['ing_oeuf', 'ing_tomate'],
      filters: { maxBudget: 12 },
      checks: [
        { kind: 'minScore', recipeId: 'r', min: 100 },
        { kind: 'tier', recipeId: 'r', tiers: ['ready', 'absent'] },
      ],
    });
  });

  it('keeps an empty pantry ("nothing at home")', () => {
    expect(parseScenario({ ...valid, pantry: [] })?.pantry).toEqual([]);
  });

  it('every new check survives a round trip', () => {
    for (const kind of SCENARIO_CHECK_KINDS) {
      const check = emptyCheck(kind);
      expect(parseScenario({ ...valid, checks: [check] })?.checks).toEqual([check]);
    }
  });
});

describe('parseScenarioList', () => {
  it('reads an export or a plain list and drops duplicates', () => {
    expect(parseScenarioList({ scenarios: [valid, valid, { id: 'x' }] })).toEqual([valid]);
    expect(parseScenarioList([valid])).toEqual([valid]);
    expect(parseScenarioList({ config: {} })).toBeNull();
  });
});

describe('validateScenario', () => {
  it('accepts a complete scenario', () => {
    expect(validateScenario(valid, catalog)).toEqual([]);
  });

  it('lists what is missing', () => {
    const errors = validateScenario({ id: 'x', title: '', fridge: [], checks: [] });
    expect(errors).toHaveLength(3);
  });

  it('flags incomplete checks and unknown catalog ids', () => {
    const errors = validateScenario(
      {
        ...valid,
        fridge: ['ing_oeuf', 'ing_disparu'],
        checks: [emptyCheck('top'), emptyCheck('contains'), { kind: 'first', recipeId: 'rec_disparue', tier: 'ready' }],
      },
      catalog
    );
    expect(errors).toEqual([
      'Ingrédient(s) inconnu(s) : ing_disparu.',
      'Vérification 1 : choisir une recette.',
      'Vérification 2 : choisir au moins une recette.',
      'Vérification 3 : recette inconnue (rec_disparue).',
    ]);
  });

  it('a substitution needs two different ingredients', () => {
    const check = {
      kind: 'substitution',
      recipeId: 'rec_tastira',
      ingredientId: 'ing_oeuf',
      substituteId: '',
      allowed: true,
    } as const;
    expect(validateScenario({ ...valid, checks: [{ ...check, substituteId: 'ing_oeuf' }] }, catalog)).toHaveLength(1);
    expect(validateScenario({ ...valid, checks: [{ ...check, substituteId: 'ing_piment' }] }, catalog)).toEqual([]);
  });
});

describe('scenarioIdFromTitle', () => {
  it('builds a valid readable id', () => {
    expect(scenarioIdFromTitle('Œufs + tomates : la tastira !', 'a1b2')).toBe('oeufs-tomates-la-tastira-a1b2');
    expect(scenarioIdFromTitle('!!!', '')).toBe('scenario');
  });
});
