import type { ReviewKind, WorkCopy } from '@/core/review';
import type { ReviewWorkspaceWriter, WorkspaceWriteResult, WriteResult } from '@/application';
import { dataHeaders, deleteDoc } from './dataApi';
import { createHttpSharedCollection } from './sharedCollectionHttp';

/**
 * Validation workflow through the server: the workspace copy is followed like any shared
 * collection, and the three writes of a publication (public item + work copy + version)
 * land in ONE atomic server commit, refused when the copy was written meanwhile — the
 * exact semantics the Firestore transaction used to provide.
 */

const KIND_OF = {
  recipe: { versionsName: 'recipes_versions' },
  ingredient: { versionsName: 'ingredients_versions' },
} as const;

function failure(status: number, conflict: boolean): WorkspaceWriteResult {
  if (conflict) return { ok: false, conflict: true, error: 'conflict' };
  return {
    ok: false,
    error:
      status === 403
        ? 'La base a refusé l’enregistrement (session sans droits suffisants).'
        : 'La base de données est injoignable : rien n’a été enregistré, réessaie plus tard.',
  };
}

async function commit(
  path: 'save' | 'publish' | 'unpublish' | 'import',
  body: Record<string, unknown>
): Promise<WorkspaceWriteResult> {
  try {
    const res = await fetch(`/admin/api/workspace/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...dataHeaders() },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; conflict?: boolean };
    if (res.ok && data.ok) return { ok: true };
    return failure(res.status, data.conflict === true);
  } catch {
    return failure(0, false);
  }
}

export function createHttpReviewWorkspace<K extends ReviewKind>(
  publicName: K extends 'recipe' ? 'recipes' : 'ingredients'
) {
  const kind: K = (publicName === 'recipes' ? 'recipe' : 'ingredient') as K;
  const versionsName = KIND_OF[kind].versionsName;
  const workspace = createHttpSharedCollection<WorkCopy<K>>(`${publicName}_workspace`);

  const writer: ReviewWorkspaceWriter<K> = {
    save: (copy, expected) => commit('save', { kind, copy: copy as unknown as Record<string, unknown>, expected }),

    importAll: async (copies) => {
      const result = await commit('import', {
        kind,
        copies: copies.map((c) => c as unknown as Record<string, unknown>),
      });
      if (!result.ok) return { ok: false as const, error: result.error };
      return { ok: true as const };
    },

    remove: (id) => deleteDoc(`${publicName}_workspace`, id) as unknown as Promise<WriteResult>,

    publish: (item, copy, version, expected) =>
      commit('publish', {
        kind,
        item: item as unknown as Record<string, unknown>,
        copy: copy as unknown as Record<string, unknown>,
        version: version as unknown as Record<string, unknown>,
        expected,
      }),

    unpublish: (copy, expected) =>
      commit('unpublish', { kind, copy: copy as unknown as Record<string, unknown>, expected }),

    listVersions: async (itemId) => {
      try {
        const res = await fetch(
          `/api/data/${versionsName}/where?field=item_id&value=${encodeURIComponent(itemId)}&limit=100`,
          { headers: dataHeaders() }
        );
        if (!res.ok) return [];
        const data = (await res.json()) as { items?: unknown[] };
        return data.items ?? [];
      } catch {
        return [];
      }
    },
  };

  return { source: workspace.source, writer };
}
