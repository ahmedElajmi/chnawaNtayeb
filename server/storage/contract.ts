import { expect, describe, it } from 'vitest';
import type { DataStore } from './types';

/**
 * The behaviour every DataStore implementation (memory, Firestore, SQL…) must have.
 * A new backend runs this suite in its own test file — if it passes, the routes and
 * the future client need no change at all.
 */
export function describeDataStore(name: string, create: () => DataStore): void {
  describe(`DataStore (${name})`, () => {
    it('writes and reads back whole documents, revisions increasing', async () => {
      const store = create();
      const r1 = await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const r2 = await store.put('recipes', 'r1', { name_fr: 'Ojja aux Merguez' });
      expect(r2).toBeGreaterThan(r1);
      const changes = await store.changes('recipes', 0, 100);
      expect(changes.items).toHaveLength(1);
      expect(changes.items[0]).toMatchObject({ id: 'r1', name_fr: 'Ojja aux Merguez' });
      expect(changes.revision).toBe(r2);
    });

    it('answers a change query with only what is newer than the given revision', async () => {
      const store = create();
      const r1 = await store.put('ingredients', 'i1', { name_fr: 'Tomate' });
      await store.put('ingredients', 'i2', { name_fr: 'Oignon' });
      const changes = await store.changes('ingredients', r1, 100);
      expect(changes.items.map((d) => d.id)).toEqual(['i2']);
    });

    it('bounds a catch-up by the limit and lets the client continue from the returned revision', async () => {
      const store = create();
      for (let i = 1; i <= 5; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
      const page1 = await store.changes('recipes', 0, 3);
      expect(page1.items).toHaveLength(3);
      const page2 = await store.changes('recipes', page1.revision, 3);
      expect(page2.items).toHaveLength(2);
      const nothing = await store.changes('recipes', page2.revision, 3);
      expect(nothing.items).toHaveLength(0);
      expect(nothing.revision).toBe(page2.revision);
    });

    it('publishes deletions as markers the change query returns through removedIds', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const removeRevision = await store.remove('recipes', 'r1');
      const changes = await store.changes('recipes', 0, 100);
      expect(changes.removedIds).toEqual(['r1']);
      expect(changes.items).toHaveLength(0);
      expect(changes.revision).toBe(removeRevision);
      // a rewrite clears the marker
      await store.put('recipes', 'r1', { name_fr: 'Ojja de retour' });
      const back = await store.changes('recipes', removeRevision, 100);
      expect(back.removedIds).toEqual([]);
      expect(back.items.map((d) => d.id)).toEqual(['r1']);
    });

    it('keeps collections apart', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      await store.put('ingredients', 'i1', { name_fr: 'Tomate' });
      expect((await store.changes('recipes', 0, 100)).items.map((d) => d.id)).toEqual(['r1']);
      expect((await store.changes('ingredients', 0, 100)).items.map((d) => d.id)).toEqual(['i1']);
      expect(await store.maxRevision('countries')).toBe(0);
    });

    it('reports the newest revision of a collection', async () => {
      const store = create();
      expect(await store.maxRevision('recipes')).toBe(0);
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const r2 = await store.put('recipes', 'r2', { name_fr: 'Kafteji' });
      expect(await store.maxRevision('recipes')).toBe(r2);
    });

    it('flags a bounded catch-up with `more` so the client catches up at once', async () => {
      const store = create();
      for (let i = 1; i <= 5; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
      const page1 = await store.changes('recipes', 0, 3);
      expect(page1.more).toBe(true);
      const page2 = await store.changes('recipes', page1.revision, 3);
      expect(page2.more).toBe(false);
    });

    it('answers equality queries with every matching document', async () => {
      const store = create();
      await store.put('recipes_versions', 'v1', { item_id: 'r1', version: 1 });
      await store.put('recipes_versions', 'v2', { item_id: 'r1', version: 2 });
      await store.put('recipes_versions', 'v3', { item_id: 'r2', version: 1 });
      const found = await store.findWhere('recipes_versions', 'item_id', 'r1', 10);
      expect(found.map((d) => d.id).sort()).toEqual(['v1', 'v2']);
      expect(await store.findWhere('recipes_versions', 'item_id', 'ghost', 10)).toEqual([]);
    });

    it('pages a filtered listing with an exact total and a cursor', async () => {
      const store = create();
      await store.put('users', 'u1', { email: 'a@b.co', type: 'client' });
      await store.put('users', 'u2', { email: 'b@b.co', type: 'client' });
      await store.put('users', 'u3', { email: 'c@b.co', type: 'employee' });
      const clients = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 10 });
      expect(clients.total).toBe(2);
      expect(clients.items.map((d) => d.id).sort()).toEqual(['u1', 'u2']);
      const first = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 1 });
      expect(first.items).toHaveLength(1);
      expect(first.nextCursor).toBe(first.items[0].id);
      const next = await store.page('users', {
        where: { field: 'type', value: 'client' },
        limit: 10,
        after: first.nextCursor,
      });
      expect(next.items.map((d) => d.id)).toEqual(['u2']);
      const search = await store.page('users', { prefix: { field: 'email', value: 'b' }, limit: 10 });
      expect(search.total).toBe(1);
      expect(search.items.map((d) => d.id)).toEqual(['u2']);
    });

    it('lists every id, deletion markers included', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      await store.put('recipes', 'r2', { name_fr: 'Kafteji' });
      await store.remove('recipes', 'r2');
      expect((await store.ids('recipes')).sort()).toEqual(['r1', 'r2']);
    });

    it('writes a batch atomically and fails the whole batch on a failed guard', async () => {
      const store = create();
      await store.put('recipes_workspace', 'r1', { written_at: 10, content: { name_fr: 'Brouillon' } });
      const ok = await store.commit(
        [
          { name: 'recipes', id: 'r1', doc: { name_fr: 'Publiée' } },
          { name: 'recipes_versions', id: 'r1-v1', doc: { version: 1 } },
          { name: 'recipes_workspace', id: 'r1', doc: { written_at: 11, content: { name_fr: 'Publiée' } } },
        ],
        { name: 'recipes_workspace', id: 'r1', field: 'written_at', expected: 10 }
      );
      expect(ok.ok).toBe(true);
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Publiée' });

      const conflict = await store.commit([{ name: 'recipes', id: 'r1', doc: { name_fr: 'Écrasée' } }], {
        name: 'recipes_workspace',
        id: 'r1',
        field: 'written_at',
        expected: 10,
      });
      expect(conflict).toEqual({ ok: false, conflict: true });
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Publiée' });

      // A missing guard document counts as `expected: null` (first publication)
      const fresh = await store.commit([{ name: 'recipes_workspace', id: 'r9', doc: { written_at: 1 } }], {
        name: 'recipes_workspace',
        id: 'r9',
        field: 'written_at',
        expected: null,
      });
      expect(fresh.ok).toBe(true);
    });

    it('claims an absent guarded document exactly once: the second claimer conflicts and writes nothing', async () => {
      const store = create();
      // The same shape the account creation uses: profile + credentials + e-mail reservation
      const guard = { name: 'email_index', id: 'a@b.co', field: 'taken', expected: null };
      const first = await store.commit(
        [
          { name: 'users', id: 'u1', doc: { email: 'a@b.co' } },
          { name: 'email_index', id: 'a@b.co', doc: { uid: 'u1', taken: 1 } },
        ],
        guard
      );
      expect(first.ok).toBe(true);
      // A second registration of the same address: the reservation is taken, nothing is written
      const second = await store.commit(
        [
          { name: 'users', id: 'u2', doc: { email: 'a@b.co' } },
          { name: 'email_index', id: 'a@b.co', doc: { uid: 'u2', taken: 1 } },
        ],
        guard
      );
      expect(second).toEqual({ ok: false, conflict: true });
      expect(await store.get('users', 'u2')).toBeNull();
      expect(await store.get('email_index', 'a@b.co')).toMatchObject({ uid: 'u1' });
      // A deleted reservation frees the address
      await store.remove('email_index', 'a@b.co');
      const freed = await store.commit([{ name: 'email_index', id: 'a@b.co', doc: { uid: 'u2', taken: 1 } }], guard);
      expect(freed.ok).toBe(true);
    });

    it('transacts a read-merge-write: the operation sees the stored document and the write is atomic', async () => {
      const store = create();
      // First transact on an absent document: current is null
      const created = await store.transact('kitchen', 'u1', (current) => {
        expect(current).toBeNull();
        return { next: { sections: { favorites: { updated_at: 10, value: ['r1'] } } }, result: 'created' };
      });
      expect(created).toBe('created');
      const stored = await store.get('kitchen', 'u1');
      expect(stored).toMatchObject({ sections: { favorites: { updated_at: 10, value: ['r1'] } } });
      // `id` and `revision` are owned by the storage layer: never inside the document
      expect(stored && 'revision' in (stored.sections as Record<string, unknown>)).toBe(false);

      // Second transact: the operation receives the stored document as it is
      await store.transact('kitchen', 'u1', (current) => {
        const doc = current as Record<string, unknown>;
        const sections = doc.sections as Record<string, unknown>;
        return {
          next: { ...doc, sections: { ...sections, pantry: { updated_at: 20, value: ['i1'] } } },
          result: null,
        };
      });
      expect(await store.get('kitchen', 'u1')).toMatchObject({
        sections: { favorites: { updated_at: 10, value: ['r1'] }, pantry: { updated_at: 20, value: ['i1'] } },
      });

      // Returning the current reference writes nothing (no revision bump)
      const before = (await store.get('kitchen', 'u1'))!.revision as number;
      await store.transact('kitchen', 'u1', (current) => ({ next: current, result: 'untouched' }));
      expect((await store.get('kitchen', 'u1'))!.revision as number).toBe(before);

      // A deleted document counts as an absent one: the next transact recreates it
      await store.remove('kitchen', 'u1');
      const recreated = await store.transact('kitchen', 'u1', (current) => ({
        next: current === null ? { sections: {} } : current,
        result: current,
      }));
      expect(recreated).toBeNull();
      expect(await store.get('kitchen', 'u1')).toMatchObject({ sections: {} });
    });

    it('serialises concurrent transacts on the same document: no read-merge-write loses a section', async () => {
      const store = create();
      // The same shape two devices pushing different sections at once produce: each transact
      // merges its own section over whatever the previous one wrote
      const pushes = ['favorites', 'fridge', 'pantry', 'weeklyPlan', 'groceryList', 'groceryMeta'].map((section, i) =>
        store.transact('kitchen', 'u1', (current) => {
          const sections = (current?.sections as Record<string, unknown> | undefined) ?? {};
          return {
            next: { ...current, sections: { ...sections, [section]: { updated_at: 100 + i, value: [section] } } },
            result: section,
          };
        })
      );
      const results = await Promise.all(pushes);
      expect(results).toHaveLength(6);
      const merged = (await store.get('kitchen', 'u1'))!.sections as Record<string, unknown>;
      expect(Object.keys(merged).sort()).toEqual([
        'favorites',
        'fridge',
        'groceryList',
        'groceryMeta',
        'pantry',
        'weeklyPlan',
      ]);
    });
  });
}
