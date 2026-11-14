import { withoutUndefined } from '@/core/shared';
import type { Versioned } from '@/core/sync';
import type { RemoteChanges, SharedCollectionSource, SharedCollectionWriter, WriteResult } from '@/application';
import { dataPoller } from './dataPoller';
import { deleteDoc, isEmptyCollection, putDoc, putDocs, replaceDocs, storedDoc, type HttpWriteResult } from './dataApi';

/**
 * HTTP adapter of a shared collection (recipes, ingredients, categories…): the source
 * follows the batched change feed through the page's shared poller, the writes go to the
 * data endpoints. The server stamps every revision, exactly like Firestore did — the
 * domain (SyncedCollectionStore, IndexedDB cache) is untouched.
 */

function writeResult(result: HttpWriteResult, name: string): WriteResult {
  return result.ok
    ? { ok: true }
    : { ok: false, error: result.error === 'err:write-refused' ? 'err:write-refused' : `err:${name}:unreachable` };
}

export function createHttpSharedCollection<T extends Versioned>(name: string) {
  const source: SharedCollectionSource = {
    follow(since, onChanges, onError) {
      dataPoller.follow(name, since, (changes) => onChanges(changes satisfies RemoteChanges), onError);
      return () => dataPoller.stop(name);
    },
  };

  const writer: SharedCollectionWriter<T> = {
    async put(item) {
      const result = await putDoc(name, item.id, storedDoc(item));
      if (result.ok) dataPoller.refresh();
      return writeResult(result, name);
    },

    async remove(id) {
      const result = await deleteDoc(name, id);
      if (result.ok) dataPoller.refresh();
      return writeResult(result, name);
    },

    async putAll(items) {
      const result = await putDocs(name, items.map(storedDoc));
      if (result.ok) dataPoller.refresh();
      return writeResult(result, name);
    },

    async replaceAll(items) {
      const result = await replaceDocs(
        name,
        items.map((i) => withoutUndefined(storedDoc(i)))
      );
      if (result.ok) dataPoller.refresh();
      return writeResult(result, name);
    },

    async isEmpty() {
      return isEmptyCollection(name);
    },
  };

  return { source, writer };
}
