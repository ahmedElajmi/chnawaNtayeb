import { beforeEach, describe, expect, it } from 'vitest';
import { initialRecipes } from '@/core/catalog';
import type { RecipeDraftRepository } from '@/application';

/**
 * Behaviour every RecipeDraftRepository adapter must have, whatever the storage.
 * A new adapter runs this suite in its own test file:
 *   describeRecipeDraftRepository('my adapter', () => createMyAdapter());
 */
export function describeRecipeDraftRepository(name: string, create: () => RecipeDraftRepository) {
  describe(`RecipeDraftRepository contract: ${name}`, () => {
    let repo: RecipeDraftRepository;
    beforeEach(() => {
      repo = create();
    });

    it('has no draft at first', () => {
      expect(repo.load('new')).toBeNull();
    });

    it('gives back what was saved, per key, as a copy', () => {
      const draft = { recipe: initialRecipes[0], savedAt: '2026-11-12T20:00:00.000Z' };
      repo.save('a', draft);
      repo.save('b', { ...draft, savedAt: 'later' });
      expect(repo.load('a')).toEqual(draft);
      expect(repo.load('a')).not.toBe(draft);
      expect(repo.load('b')?.savedAt).toBe('later');
    });

    it('replaces a draft and discards it', () => {
      repo.save('a', { recipe: initialRecipes[0], savedAt: '1' });
      repo.save('a', { recipe: initialRecipes[1], savedAt: '2' });
      expect(repo.load('a')).toEqual({ recipe: initialRecipes[1], savedAt: '2' });
      repo.discard('a');
      repo.discard('missing');
      expect(repo.load('a')).toBeNull();
    });
  });
}
