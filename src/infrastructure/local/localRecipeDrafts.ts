import type { RecipeDraftRepository } from '@/application';

/** The part of the browser key-value storage this adapter needs (injected, so it can be tested). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const PREFIX = 'chnowa_recipe_draft_v1:';

/**
 * Recipe drafts in the device storage (offline copy only: drafts are personal to this
 * device and never shared). Storage errors (full, private mode) are ignored: a draft is
 * a convenience, the recipe itself is saved by the catalog.
 */
export function createLocalRecipeDrafts(store: () => KeyValueStore | undefined): RecipeDraftRepository {
  return {
    load(key) {
      try {
        const raw = store()?.getItem(PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed.savedAt === 'string' ? { recipe: parsed.recipe, savedAt: parsed.savedAt } : null;
      } catch {
        return null;
      }
    },
    save(key, draft) {
      try {
        store()?.setItem(PREFIX + key, JSON.stringify(draft));
      } catch {}
    },
    discard(key) {
      try {
        store()?.removeItem(PREFIX + key);
      } catch {}
    },
  };
}

export const localRecipeDrafts = createLocalRecipeDrafts(() =>
  typeof localStorage === 'undefined' ? undefined : localStorage
);
