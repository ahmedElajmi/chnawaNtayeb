import type { PublishedVersion, ReviewItems, ReviewKind, WorkCopy } from '@/core/review';
import type { ReviewWorkspaceWriter, SharedCollectionSource, WorkspaceWriteResult } from '@/application';
import { createMemorySharedCollection } from './memorySharedCollection';

/**
 * Workspace of one kind of content held in memory: reference implementation of
 * ReviewWorkspaceWriter (the behaviour every database adapter must reproduce), used by tests.
 * The public collection is a memory shared collection too, so a publication can be observed.
 */
export function createMemoryReviewWorkspace<K extends ReviewKind>() {
  const workspace = createMemorySharedCollection<WorkCopy<K>>();
  const published = createMemorySharedCollection<ReviewItems[K]>();
  /** written_at of every stored work copy (absent = no copy) */
  const marks = new Map<string, number>();
  const versions: PublishedVersion<K>[] = [];

  const conflict: WorkspaceWriteResult = { ok: false, conflict: true, error: 'conflict' };
  const unchanged = (id: string, expected: number | null) => (marks.get(id) ?? null) === expected;
  const store = async (copy: WorkCopy<K>) => {
    await workspace.writer.put(structuredClone(copy));
    marks.set(copy.id, copy.written_at);
  };

  const writer: ReviewWorkspaceWriter<K> = {
    async save(copy, expected) {
      if (!unchanged(copy.id, expected)) return conflict;
      await store(copy);
      return { ok: true };
    },
    async importAll(copies) {
      const fresh = copies.filter((c) => !marks.has(c.id));
      for (const copy of fresh) await store(copy);
      return { ok: true, imported: fresh.length };
    },
    async remove(id) {
      await workspace.writer.remove(id);
      marks.delete(id);
      return { ok: true };
    },
    async publish(item, copy, version, expected) {
      if (!unchanged(copy.id, expected)) return conflict;
      await published.writer.put(structuredClone(item));
      await store(copy);
      versions.push(structuredClone(version));
      return { ok: true };
    },
    async unpublish(copy, expected) {
      if (!unchanged(copy.id, expected)) return conflict;
      await published.writer.remove(copy.id);
      await store(copy);
      return { ok: true };
    },
    async listVersions(itemId) {
      return structuredClone(versions.filter((v) => v.item_id === itemId));
    },
  };

  const source: SharedCollectionSource = workspace.source;
  return { source, writer, published };
}
