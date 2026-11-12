import { parseStoredRecipe, type Recipe } from '@/core/catalog';
import type { RecipeDraftRepository } from '../ports';

/** Key of the draft of a recipe that does not exist yet. */
export const NEW_RECIPE_DRAFT_KEY = 'new';

export interface RestoredRecipeDraft {
  recipe: Recipe;
  savedAt: string;
}

/**
 * Unsaved edits of the recipe editor: kept while the chef types, offered again when
 * the same recipe is reopened, dropped once the recipe is saved or the chef discards them.
 * A stored draft that is no longer a valid recipe is thrown away.
 */
export class RecipeDrafts {
  constructor(
    private readonly repo: RecipeDraftRepository,
    private readonly now: () => string
  ) {}

  restore(key: string): RestoredRecipeDraft | null {
    const stored = this.repo.load(key);
    if (!stored) return null;
    const recipe = parseStoredRecipe(stored.recipe);
    if (!recipe) {
      this.repo.discard(key);
      return null;
    }
    return { recipe, savedAt: stored.savedAt };
  }

  keep(key: string, recipe: Recipe): void {
    this.repo.save(key, { recipe, savedAt: this.now() });
  }

  discard(key: string): void {
    this.repo.discard(key);
  }
}
