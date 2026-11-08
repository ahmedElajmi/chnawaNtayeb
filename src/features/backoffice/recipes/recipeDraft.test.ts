import { describe, expect, it } from 'vitest';
import { finalizeRecipeDraft, newRecipeDraft, uniqueSlug } from './recipeDraft';

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
    const draft = { ...newRecipeDraft(1), name_fr: 'Lablabi' };
    expect(finalizeRecipeDraft({ ...draft, video_url: 'https://vimeo.com/1' }, []).ok).toBe(false);
    const saved = finalizeRecipeDraft({ ...draft, video_url: '  ' }, []);
    expect(saved.ok && 'video_url' in saved.recipe).toBe(false);
  });

  it('stores a clean YouTube link and an address for a new recipe', () => {
    const saved = finalizeRecipeDraft(
      { ...newRecipeDraft(1), name_fr: 'Lablabi', video_url: 'https://youtu.be/dQw4w9WgXcQ' },
      []
    );
    expect(saved.ok && saved.recipe.slug).toBe('lablabi');
    expect(saved.ok && saved.recipe.video_url).toContain('dQw4w9WgXcQ');
  });
});
