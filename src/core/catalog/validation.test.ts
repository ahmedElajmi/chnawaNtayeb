import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from './index';
import {
  normalizeSteps,
  parseImageUrl,
  parseStoredIngredient,
  parseStoredRecipe,
  validateIngredient,
  validateRecipe,
} from './validation';

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
      field: 'steps',
      error: expect.stringContaining('étape 2'),
    });
    expect(validateRecipe({ ...recipe, ingredients: [] })).toMatchObject({ field: 'ingredients' });
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

  it('requires a French name, a unit and a valid price range', () => {
    expect(validateIngredient({ ...ing, name_fr: '' }).ok).toBe(false);
    expect(validateIngredient({ ...ing, unit_default: ' ' }).ok).toBe(false);
    expect(validateIngredient({ ...ing, price_min_tnd: -1 }).ok).toBe(false);
    expect(validateIngredient({ ...ing, price_min_tnd: 3, price_max_tnd: 2 })).toEqual({
      ok: false,
      field: 'price',
      error: expect.stringContaining('maximum'),
    });
    expect(validateIngredient({ ...ing, price_min_tnd: 2, price_max_tnd: 3 }).ok).toBe(true);
  });

  it('accepts an https photo, removes an empty one and refuses other links', () => {
    const withPhoto = validateIngredient({ ...ing, image_url: ' https://cdn.example.com/tomate.jpg ' });
    expect(withPhoto.ok && withPhoto.value.image_url).toBe('https://cdn.example.com/tomate.jpg');
    const cleared = validateIngredient({ ...ing, image_url: '  ' });
    expect(cleared.ok && 'image_url' in cleared.value).toBe(false);
    expect(validateIngredient({ ...ing, image_url: 'http://example.com/a.jpg' }).ok).toBe(false);
    expect(validateIngredient({ ...ing, image_url: 'tomate.jpg' }).ok).toBe(false);
  });

  it('uses the French name when derja or Arabic is empty', () => {
    const checked = validateIngredient({ ...ing, name_fr: 'Tomate', name_derja: '', name_ar: ' ' });
    expect(checked.ok && [checked.value.name_derja, checked.value.name_ar]).toEqual(['Tomate', 'Tomate']);
  });
});

describe('parseImageUrl', () => {
  it('returns undefined for empty, null for invalid and the link otherwise', () => {
    expect(parseImageUrl('')).toBeUndefined();
    expect(parseImageUrl('javascript:alert(1)')).toBeNull();
    expect(parseImageUrl('https://localhost/a.png')).toBeNull();
    expect(parseImageUrl('https://images.unsplash.com/photo-1?w=200')).toBe(
      'https://images.unsplash.com/photo-1?w=200'
    );
  });
});

describe('parseStoredRecipe', () => {
  it('accepts a stored recipe and refuses anything else', () => {
    expect(parseStoredRecipe(JSON.parse(JSON.stringify(recipe)))).toEqual(recipe);
    expect(parseStoredRecipe(null)).toBeNull();
    expect(parseStoredRecipe({ ...recipe, ingredients: 'x' })).toBeNull();
    expect(parseStoredRecipe({ ...recipe, steps: [{}] })).toBeNull();
    expect(parseStoredRecipe({ ...recipe, base_servings: '4' })).toBeNull();
  });
});

describe('validateRecipe: cleared optional fields', () => {
  it('removes keys left undefined by the editor (the database refuses them)', () => {
    const edited = {
      ...recipe,
      video_url: undefined,
      ingredients: recipe.ingredients.map((i) => ({
        ...i,
        role: undefined,
        is_optional: undefined,
        substitutes: undefined,
      })),
    };
    const checked = validateRecipe(edited);
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect('video_url' in checked.value).toBe(false);
    const item = checked.value.ingredients[0];
    expect(['role', 'is_optional', 'substitutes'].some((k) => k in item)).toBe(false);
  });
});

describe('parseStoredIngredient', () => {
  it('reads a valid ingredient and refuses a broken one', () => {
    expect(parseStoredIngredient({ ...initialIngredients[0] })).toEqual(initialIngredients[0]);
    expect(parseStoredIngredient({ id: 'x', name_fr: 'X', unit_default: 'kg', category: 'nope' })).toBeNull();
    expect(parseStoredIngredient({ id: 'x', deleted: true })).toBeNull();
  });
});
