import { describe, expect, it } from 'vitest';
import type { ReviewWorkspaceWriter, SharedCollectionSource } from '@/application';
import { initialRecipes, type Recipe } from '@/core/catalog';
import { newWorkCopy, type PublishedVersion, type WorkCopy } from '@/core/review';

/**
 * Behaviour every workspace adapter must have, whatever the database. A new adapter runs this suite
 * in its own test file: describeReviewWorkspace('my database', () => createMyAdapter()).
 * `published` is the public collection the adapter writes to when it publishes.
 */
export function describeReviewWorkspace(
  name: string,
  create: () => {
    source: SharedCollectionSource;
    writer: ReviewWorkspaceWriter<'recipe'>;
    published: { source: SharedCollectionSource };
  }
) {
  const recipe: Recipe = structuredClone(initialRecipes[0]);
  const copyAt = (at: number, content = recipe): WorkCopy<'recipe'> => ({
    ...newWorkCopy('recipe', content, 'admin', at),
    written_at: at,
  });
  const read = (source: SharedCollectionSource) => {
    const items: Record<string, unknown>[] = [];
    const stop = source.follow(
      null,
      (c) => items.push(...(c.items as Record<string, unknown>[])),
      () => {}
    );
    stop();
    // Last write of each id wins
    return new Map(items.map((i) => [i.id as string, i]));
  };
  const version = (at: number): PublishedVersion<'recipe'> => ({
    id: `${recipe.id}-${at}`,
    item_id: recipe.id,
    kind: 'recipe',
    content: recipe,
    published_at: at,
    published_by: 'admin',
  });

  describe(`ReviewWorkspace contract: ${name}`, () => {
    it('creates a work copy only when none exists', async () => {
      const { source, writer } = create();
      expect(await writer.save(copyAt(1), null)).toEqual({ ok: true });
      expect((await writer.save(copyAt(2), null)).conflict).toBe(true);
      const stored = read(source).get(recipe.id) as unknown as WorkCopy<'recipe'>;
      expect(stored.written_at).toBe(1);
      expect(stored.revision).toBeTypeOf('number');
    });

    it('refuses a change that does not start from the stored copy (no lost update)', async () => {
      const { writer } = create();
      await writer.save(copyAt(1), null);
      expect(await writer.save(copyAt(2), 1)).toEqual({ ok: true });
      const late = await writer.save(copyAt(3), 1);
      expect(late.ok).toBe(false);
      expect(late.conflict).toBe(true);
    });

    it('publishes the item, the work copy and a version together', async () => {
      const { source, writer, published } = create();
      await writer.save(copyAt(1), null);
      const online = { ...recipe, name_fr: 'En ligne', is_published: true };
      expect(await writer.publish(online, copyAt(2), version(2), 1)).toEqual({ ok: true });
      expect((read(published.source).get(recipe.id) as unknown as Recipe).name_fr).toBe('En ligne');
      expect((read(source).get(recipe.id) as unknown as WorkCopy).written_at).toBe(2);
      const versions = (await writer.listVersions(recipe.id)) as PublishedVersion[];
      expect(versions.map((v) => v.id)).toEqual([`${recipe.id}-2`]);
      expect(await writer.listVersions('other')).toEqual([]);
    });

    it('writes nothing when a publication conflicts', async () => {
      const { writer, published } = create();
      await writer.save(copyAt(1), null);
      const result = await writer.publish(recipe, copyAt(2), version(2), 99);
      expect(result.conflict).toBe(true);
      expect(read(published.source).has(recipe.id)).toBe(false);
      expect(await writer.listVersions(recipe.id)).toEqual([]);
    });

    it('takes an item offline with a deletion marker and keeps its work copy', async () => {
      const { source, writer, published } = create();
      await writer.save(copyAt(1), null);
      await writer.publish(recipe, copyAt(2), version(2), 1);
      expect(await writer.unpublish(copyAt(3), 2)).toEqual({ ok: true });
      expect(read(published.source).get(recipe.id)).toMatchObject({ id: recipe.id, deleted: true });
      expect((read(source).get(recipe.id) as unknown as WorkCopy).written_at).toBe(3);
    });

    it('imports only the items not in the workspace yet', async () => {
      const { writer } = create();
      await writer.save(copyAt(5), null);
      const other = { ...recipe, id: 'other' };
      const result = await writer.importAll([copyAt(1), { ...copyAt(1, other), id: 'other' }]);
      expect(result).toEqual({ ok: true, imported: 1 });
      // The existing copy was not overwritten
      expect((await writer.save(copyAt(6), 5)).ok).toBe(true);
    });

    it('removes a work copy (a new one can then be created)', async () => {
      const { writer } = create();
      await writer.save(copyAt(1), null);
      expect(await writer.remove(recipe.id)).toEqual({ ok: true });
      expect((await writer.save(copyAt(2), null)).ok).toBe(true);
    });
  });
}
