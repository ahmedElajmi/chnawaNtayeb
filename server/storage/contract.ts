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
  });
}
