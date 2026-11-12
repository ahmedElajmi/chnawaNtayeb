import { describe, expect, it } from 'vitest';
import type { SearchEngine } from '@/application';
import { normalizeSearchText, type SearchDocument } from '@/core/search';

const doc = (id: string, name: string, related = '', details = ''): SearchDocument => ({
  id,
  name: normalizeSearchText(name),
  related: normalizeSearchText(related),
  details: normalizeSearchText(details),
});

const ids = async (engine: SearchEngine, query: string) =>
  (await engine.search(normalizeSearchText(query))).map((h) => h.id);

/**
 * Behaviour every search engine adapter must have, whatever the technology.
 * A new adapter runs this suite in its own test file:
 *   describeSearchEngine('my engine', () => createMyEngine());
 */
export function describeSearchEngine(name: string, create: () => SearchEngine) {
  describe(`SearchEngine contract: ${name}`, () => {
    const catalog = [
      doc('kamounia', 'Kamounia au bœuf', 'boeuf cumin', 'Ragoût de foie au cumin'),
      doc('ojja', 'Ojja merguez', 'oeuf merguez tomate', 'Œufs pochés dans une sauce tomate'),
      doc('persil', 'Salade de persil', 'persil citron'),
      doc('couscous', 'Couscous au poisson / كسكسي بالحوت', 'poisson semoule'),
    ];

    it('finds an item by a word of its name, in any language', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      expect(await ids(engine, 'kamounia')).toEqual(['kamounia']);
      expect(await ids(engine, 'كسكسي')).toEqual(['couscous']);
      expect(await ids(engine, 'حوت')).toEqual(['couscous']);
    });

    it('finds a word from its beginning, never from the middle', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      expect(await ids(engine, 'merg')).toEqual(['ojja']);
      expect(await ids(engine, 'sel')).toEqual([]);
    });

    it('needs every word of the query', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      expect(await ids(engine, 'tomate merguez')).toEqual(['ojja']);
      expect(await ids(engine, 'merguez poisson')).toEqual([]);
    });

    it('ranks an item named after the query before one that only uses it', async () => {
      const engine = create();
      await engine.rebuild([doc('salade', 'Salade de persil', 'persil'), doc('kefta', 'Kefta', 'persil boeuf')]);
      expect((await ids(engine, 'persil'))[0]).toBe('salade');
    });

    it('finds nothing for an empty query', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      expect(await engine.search('')).toEqual([]);
    });

    it('replaces an item without keeping the words of its old version', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      await engine.upsert([doc('ojja', 'Ojja crevettes', 'crevette')]);
      expect(await ids(engine, 'merguez')).toEqual([]);
      expect(await ids(engine, 'crevettes')).toEqual(['ojja']);
    });

    it('adds and removes items', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      await engine.upsert([doc('brik', 'Brik à l’œuf')]);
      await engine.remove(['kamounia', 'unknown']);
      expect(await ids(engine, 'brik')).toEqual(['brik']);
      expect(await ids(engine, 'kamounia')).toEqual([]);
    });

    it('forgets everything on rebuild', async () => {
      const engine = create();
      await engine.rebuild(catalog);
      await engine.rebuild([doc('brik', 'Brik')]);
      expect(await ids(engine, 'kamounia')).toEqual([]);
      expect(await ids(engine, 'brik')).toEqual(['brik']);
    });
  });
}
