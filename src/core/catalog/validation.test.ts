import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from './index';
import { normalizeSteps, validateIngredient, validateRecipe } from './validation';

const recipe = initialRecipes[0];
const step = (fr: string, derja = '', ar = '') => ({
  step_number: 99,
  instruction_fr: fr,
  instruction_derja: derja,
  instruction_ar: ar,
});

describe('normalizeSteps', () => {
  it('drops empty steps and renumbers the others', () => {
    const steps = normalizeSteps([step(' Couper '), step('', ' ', ''), step('Cuire', 'Tayyeb')]);
    expect(steps).toEqual([
      { step_number: 1, instruction_fr: 'Couper', instruction_derja: '', instruction_ar: '' },
      { step_number: 2, instruction_fr: 'Cuire', instruction_derja: 'Tayyeb', instruction_ar: '' },
    ]);
  });
});

describe('validateRecipe', () => {
  it('accepts every built-in recipe unchanged in content', () => {
    for (const r of initialRecipes) {
      const checked = validateRecipe(r);
      expect(checked.ok && checked.value.steps.length).toBe(r.steps.length);
    }
  });

  it('requires a French name, an ingredient and a French step', () => {
    expect(validateRecipe({ ...recipe, name_fr: ' ' }).ok).toBe(false);
    expect(validateRecipe({ ...recipe, ingredients: [] }).ok).toBe(false);
    expect(validateRecipe({ ...recipe, steps: [step('')] }).ok).toBe(false);
    expect(validateRecipe({ ...recipe, steps: [step('Couper'), step('', 'Tayyeb')] })).toEqual({
      ok: false,
      error: expect.stringContaining('étape 2'),
    });
  });

  it('keeps the edited steps in every language, numbered in order', () => {
    const checked = validateRecipe({ ...recipe, steps: [step('B', 'b', 'ب'), step('A', 'a', 'أ')] });
    expect(checked.ok && checked.value.steps.map((s) => [s.step_number, s.instruction_fr, s.instruction_ar])).toEqual([
      [1, 'B', 'ب'],
      [2, 'A', 'أ'],
    ]);
  });
});

describe('validateIngredient', () => {
  const ing = initialIngredients[0];

  it('requires a French name, a unit and a positive price', () => {
    expect(validateIngredient({ ...ing, name_fr: '' }).ok).toBe(false);
    expect(validateIngredient({ ...ing, unit_default: ' ' }).ok).toBe(false);
    expect(validateIngredient({ ...ing, default_price_tnd: -1 }).ok).toBe(false);
  });

  it('uses the French name when derja or Arabic is empty', () => {
    const checked = validateIngredient({ ...ing, name_fr: 'Tomate', name_derja: '', name_ar: ' ' });
    expect(checked.ok && [checked.value.name_derja, checked.value.name_ar]).toEqual(['Tomate', 'Tomate']);
  });
});
