import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '@/core/catalog';
import {
  defaultReviewSettings,
  hasPendingChanges,
  HISTORY_LIMIT,
  newWorkCopy,
  parsePublishedVersion,
  parseWorkCopies,
  parseWorkCopy,
  resolveReviewSettings,
  validateReviewSettings,
  withEvent,
  workCopyFromPublished,
} from './index';

const recipe = initialRecipes[0];

describe('work copies', () => {
  it('reads a stored copy back and refuses a broken one', () => {
    const copy = workCopyFromPublished('recipe', recipe, 'admin', 5);
    const raw = JSON.parse(JSON.stringify({ ...copy, extra: 1 }));
    expect(parseWorkCopy('recipe', raw)).toEqual(copy);
    expect(parseWorkCopy('ingredient', raw)).toBeNull();
    expect(parseWorkCopy('recipe', { ...raw, content: { ...raw.content, id: 'other' } })).toBeNull();
    expect(parseWorkCopy('recipe', { ...raw, content: null })).toBeNull();
    expect(parseWorkCopies('recipe')([raw, 'x', null])).toHaveLength(1);
  });

  it('keeps a bounded history, newest first', () => {
    let history = newWorkCopy('recipe', recipe, 'a', 1).history;
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) history = withEvent(history, { action: 'save', by: 'a', at: i + 2 });
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].at).toBe(HISTORY_LIMIT + 11);
  });

  it('knows whether the copy differs from the version online', () => {
    const online = workCopyFromPublished('recipe', recipe, 'admin', 1);
    expect(hasPendingChanges(online)).toBe(false);
    expect(hasPendingChanges({ ...online, content: { ...recipe, name_ar: 'جديد' } })).toBe(true);
    expect(hasPendingChanges(newWorkCopy('ingredient', initialIngredients[0], 'a', 1))).toBe(true);
  });

  it('reads a published version back', () => {
    const v = { id: 'r-1', item_id: recipe.id, kind: 'recipe', content: recipe, published_at: 1, published_by: 'a' };
    expect(parsePublishedVersion('recipe', v)?.content.id).toBe(recipe.id);
    expect(parsePublishedVersion('recipe', { ...v, item_id: 'nope' })).toBeNull();
  });
});

describe('review settings', () => {
  it('uses the defaults for anything missing and keeps them valid', () => {
    const { settings, warnings } = resolveReviewSettings(null);
    expect(settings).toEqual(defaultReviewSettings());
    expect(warnings).toEqual([]);
    expect(validateReviewSettings(settings)).toEqual([]);
  });

  it('reports what was repaired, per kind', () => {
    const { settings, warnings } = resolveReviewSettings({
      workflows: { recipe: { requiredCells: ['media'] } },
      roles: [{ id: 'editor', label: { fr: 'Rédacteur' }, permissions: ['edit'] }],
    });
    expect(settings.workflows.recipe.requiredCells[0]).toBe('identity:fr');
    expect(warnings.some((w) => w.startsWith('recipe : '))).toBe(true);
    expect(settings.roles.map((r) => r.id)).toEqual(['admin', 'editor']);
  });
});
