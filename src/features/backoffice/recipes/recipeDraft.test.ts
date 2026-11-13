import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '@/core/catalog';
import {
  duplicateRecipeDraft,
  finalizeRecipeDraft,
  isDraftChanged,
  missingTranslations,
  newRecipeDraft,
  recipeSectionStatus,
  uniqueSlug,
} from './recipeDraft';

/** A new recipe with the minimum the chef must write: a French name and one French step. */
const filled = (name_fr: string) => ({
  ...newRecipeDraft(1),
  name_fr,
  steps: [{ step_number: 1, instruction_fr: 'Cuire.', instruction_derja: '', instruction_ar: '' }],
});

describe('recipe editor rules', () => {
  it('generates a unique readable address', () => {
    const existing = [
      { id: 'a', slug: 'ojja-merguez' },
      { id: 'b', slug: 'ojja-merguez-2' },
    ];
    expect(uniqueSlug('Ojja Merguez', 'new', existing)).toBe('ojja-merguez-3');
    expect(uniqueSlug('Ojja Merguez', 'a', existing)).toBe('ojja-merguez'); // its own address
  });

  it('requires a French name', () => {
    expect(finalizeRecipeDraft(newRecipeDraft(1), [])).toEqual({
      ok: false,
      field: 'name',
      error: { code: 'nameRequired' },
    });
  });

  it('rejects a video link that is not YouTube, keeps none when empty', () => {
    const draft = filled('Lablabi');
    expect(finalizeRecipeDraft({ ...draft, video_url: 'https://vimeo.com/1' }, []).ok).toBe(false);
    const saved = finalizeRecipeDraft({ ...draft, video_url: '  ' }, []);
    expect(saved.ok && 'video_url' in saved.recipe).toBe(false);
  });

  it('stores a clean YouTube link and an address for a new recipe', () => {
    const saved = finalizeRecipeDraft({ ...filled('Lablabi'), video_url: 'https://youtu.be/dQw4w9WgXcQ' }, []);
    expect(saved.ok && saved.recipe.slug).toBe('lablabi');
    expect(saved.ok && saved.recipe.video_url).toContain('dQw4w9WgXcQ');
  });

  it('requires a written preparation step and numbers the steps in order', () => {
    expect(finalizeRecipeDraft({ ...newRecipeDraft(1), name_fr: 'Lablabi' }, []).ok).toBe(false);
    const saved = finalizeRecipeDraft(
      {
        ...filled('Lablabi'),
        steps: [
          { step_number: 7, instruction_fr: 'Tremper', instruction_derja: 'Na9a3', instruction_ar: 'انقع' },
          { step_number: 3, instruction_fr: '', instruction_derja: '', instruction_ar: '' },
          { step_number: 1, instruction_fr: 'Cuire', instruction_derja: '', instruction_ar: '' },
        ],
      },
      []
    );
    expect(saved.ok && saved.recipe.steps.map((s) => [s.step_number, s.instruction_fr])).toEqual([
      [1, 'Tremper'],
      [2, 'Cuire'],
    ]);
  });
});

describe('editor helpers', () => {
  const recipe = initialRecipes[0];

  it('detects changes', () => {
    expect(isDraftChanged(recipe, { ...recipe })).toBe(false);
    expect(isDraftChanged(recipe, { ...recipe, prep_time_minutes: recipe.prep_time_minutes + 1 })).toBe(true);
  });

  it('duplicates a recipe as a new unpublished one', () => {
    const copy = duplicateRecipeDraft(recipe, 42);
    expect(copy).toMatchObject({ id: 'custom_rec_42', slug: '', is_published: false });
    expect(copy.name_fr).toBe(`${recipe.name_fr} (copie)`);
    expect(copy.ingredients).toEqual(recipe.ingredients);
    expect(copy.ingredients).not.toBe(recipe.ingredients);
  });

  it('counts the French texts left to translate', () => {
    const draft = {
      ...filled('Ojja'),
      name_derja: 'Ojja',
      steps: [
        { step_number: 1, instruction_fr: 'Cuire.', instruction_derja: 'Tayyeb.', instruction_ar: '' },
        { step_number: 2, instruction_fr: 'Servir.', instruction_derja: '', instruction_ar: '' },
      ],
    };
    expect(missingTranslations(draft)).toEqual({ derja: 1, ar: 3, derja_ar: 3 });
  });

  it('tells which sections are complete', () => {
    const draft = newRecipeDraft(1);
    expect(recipeSectionStatus(draft, initialIngredients)).toEqual({
      infos: 'todo',
      media: 'done',
      ingredients: 'done',
      steps: 'todo',
      tip: 'optional',
    });
    const noKey = {
      ...filled('X'),
      ingredients: [{ ingredient_id: 'ing_sel_poivre', quantity_base: 1, unit: 'pincée' }],
    };
    expect(recipeSectionStatus(noKey, initialIngredients)).toMatchObject({ infos: 'done', ingredients: 'warn' });
  });
});
