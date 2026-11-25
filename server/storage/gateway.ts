import type { ChangeCursor, StorageChanges, SyncCursor } from './types';
import { collectionSpec, type CollectionAccess } from './collections';
import { deriveWatermark, watermarkOf } from './watermark';

/**
 * The batched change computation of the change feed: one call answers every collection the
 * client follows. The watermark makes an up-to-date client cost ZERO database queries; a
 * behind client costs one indexed query per late collection. A restart empties the
 * watermark: correctness never relies on it, only the shortcut does — the first poll
 * re-derives it from the revisions it read.
 */
export async function computeChanges(
  clientRevisions: Record<string, ChangeCursor>,
  identity: Pick<CollectionAccess, 'read'>,
  store: { changes(name: string, cursor: ChangeCursor, limit: number): Promise<StorageChanges> }
): Promise<Record<string, StorageChanges>> {
  const result: Record<string, StorageChanges> = {};
  // The client drives the list: only the collections it follows are queried, never the rest.
  for (const [name, sent] of Object.entries(clientRevisions)) {
    const spec = collectionSpec(name);
    if (!spec) continue;
    if (spec.read !== 'public' && (spec.read !== 'admin' || identity.read !== 'admin')) continue;
    const cursor: ChangeCursor =
      typeof sent === 'number'
        ? sent // legacy client: strict revision, exactly as before
        : typeof sent === 'object' && sent !== null && typeof (sent as SyncCursor).revision === 'number'
          ? sent
          : 0; // a malformed cursor is an unknown position: answer from the start
    const known = typeof cursor === 'number' ? cursor : cursor.revision;
    const watermark = watermarkOf(name);
    if (watermark !== null && known >= watermark) {
      // Fast path: the write path already raised the watermark past this client.
      continue;
    }
    const delta = await store.changes(name, cursor, spec.pageLimit);
    deriveWatermark(name, delta.revision);
    result[name] = delta;
  }
  return result;
}
