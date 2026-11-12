import { describe, expect, it } from 'vitest';
import { finalizeRecipeDraft, newRecipeDraft, uniqueSlug } from './recipeDraft';

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
      error: expect.stringContaining('obligatoire'),
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
