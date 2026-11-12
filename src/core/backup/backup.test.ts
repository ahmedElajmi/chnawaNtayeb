import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { createBackup, parseBackup } from './backup';

const recipe = initialRecipes[0];

describe('parseBackup', () => {
  it('refuses what is not a backup', () => {
    expect(parseBackup(null)).toBeNull();
    expect(parseBackup({ hello: 'world' })).toBeNull();
  });

  it('keeps every language, photo and price range through an export / import round trip', () => {
    const edited = {
      ...recipe,
      name_derja: 'Ojja derja',
      name_ar: 'عجة',
      steps: [{ step_number: 1, instruction_fr: 'Cuire.', instruction_derja: 'Tayyeb.', instruction_ar: 'اطبخ.' }],
      chef_tip: { fr: 'Astuce', derja: 'Nasi7a', ar: 'نصيحة' },
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
    const ingredient = { ...initialIngredients[0], price_min_tnd: 2, price_max_tnd: 3, image_url: 'https://a.b/c.jpg' };
    const file = JSON.parse(
      JSON.stringify({
        recipes: [edited],
        ingredients: [ingredient],
        favorites: [recipe.id],
        grocery_list: [
          { id: 'g1', name: 'Tomate', quantity: 1, unit: 'kg', category: 'vegetables', is_checked: false },
        ],
      })
    );
    expect(parseBackup(file)).toEqual({
      recipes: [edited],
      ingredients: [ingredient],
      favorites: [recipe.id],
      groceryList: [{ id: 'g1', name: 'Tomate', quantity: 1, unit: 'kg', category: 'vegetables', is_checked: false }],
      skipped: 0,
    });
  });

  it('brings old entries up to date and skips broken ones', () => {
    const { price_min_tnd: _min, price_max_tnd: _max, ...oldIngredient } = initialIngredients[0];
    const parsed = parseBackup({
      recipes: [recipe, { id: 'broken' }],
      ingredients: [{ ...oldIngredient, default_price_tnd: 2.5 }, { id: 'x' }],
      favorites: ['a', 3],
      grocery_list: [{ name: 'no id' }],
    });
    expect(parsed?.recipes).toHaveLength(1);
    expect(parsed?.ingredients?.[0]).toMatchObject({ price_min_tnd: 2.5, price_max_tnd: 2.5 });
    expect(parsed?.ingredients).toHaveLength(1);
    expect(parsed?.favorites).toEqual(['a']);
    expect(parsed?.groceryList).toEqual([]);
    expect(parsed?.skipped).toBe(4);
  });
});

describe('createBackup', () => {
  it('writes complete objects that parseBackup reads back, without sync revisions', () => {
    const recipes = [{ ...recipe, revision: 123 }];
    const ingredients = [{ ...initialIngredients[0], revision: 456 }];
    const file = createBackup(
      { recipes, ingredients, weeklyPlan: [], favorites: [recipe.id], groceryList: [] },
      '2026-11-12T10:00:00.000Z'
    );
    expect(file.exported_at).toBe('2026-11-12T10:00:00.000Z');
    expect(JSON.stringify(file)).not.toContain('revision');
    const back = parseBackup(JSON.parse(JSON.stringify(file)));
    expect(back?.recipes).toEqual([recipe]);
    expect(back?.ingredients).toEqual([initialIngredients[0]]);
    expect(back?.favorites).toEqual([recipe.id]);
  });
});
