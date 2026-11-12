import type { RecipeDraftRepository, StoredRecipeDraft } from '@/application';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Recipe drafts kept in memory: reference implementation of the port (see its contract test). */
export function createMemoryRecipeDrafts(): RecipeDraftRepository {
  const rows = new Map<string, StoredRecipeDraft>();
  return {
    load: (key) => {
      const row = rows.get(key);
      return row ? copy(row) : null;
    },
    save: (key, draft) => void rows.set(key, copy(draft)),
    discard: (key) => void rows.delete(key),
  };
}
