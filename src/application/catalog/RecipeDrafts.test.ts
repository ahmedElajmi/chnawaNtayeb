import { describe, expect, it } from 'vitest';
import { initialRecipes } from '@/core/catalog';
import type { RecipeDraftRepository, StoredRecipeDraft } from '../ports';
import { RecipeDrafts } from './RecipeDrafts';

function fakeRepo(initial: Record<string, StoredRecipeDraft> = {}) {
  const rows = { ...initial };
  const repo: RecipeDraftRepository = {
    load: (key) => rows[key] ?? null,
    save: (key, draft) => {
      rows[key] = draft;
    },
    discard: (key) => {
      delete rows[key];
    },
  };
  return { repo, rows };
}

const recipe = initialRecipes[0];
const now = () => '2026-11-12T20:00:00.000Z';

describe('RecipeDrafts', () => {
  it('keeps a draft with its time and gives it back', () => {
    const { repo } = fakeRepo();
    const drafts = new RecipeDrafts(repo, now);
    drafts.keep(recipe.id, { ...recipe, name_fr: 'Ojja modifiée' });
    expect(drafts.restore(recipe.id)).toEqual({
      recipe: { ...recipe, name_fr: 'Ojja modifiée' },
      savedAt: '2026-11-12T20:00:00.000Z',
    });
  });

  it('throws away a stored draft that is not a recipe any more', () => {
    const { repo, rows } = fakeRepo({ x: { recipe: { id: 'x' }, savedAt: 'then' } });
    expect(new RecipeDrafts(repo, now).restore('x')).toBeNull();
    expect(rows.x).toBeUndefined();
  });

  it('discards a draft', () => {
    const { repo } = fakeRepo();
    const drafts = new RecipeDrafts(repo, now);
    drafts.keep('new', recipe);
    drafts.discard('new');
    expect(drafts.restore('new')).toBeNull();
  });
});
