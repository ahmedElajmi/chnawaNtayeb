import { beforeEach, describe, expect, it } from 'vitest';
import { parseScenario, type MatchingScenario } from '@/core/matching';
import type { MatchingScenarioRepository } from '@/application';

/**
 * Behaviour every MatchingScenarioRepository adapter must have, whatever the database.
 * A new adapter (another database, an API...) runs this suite in its own test file:
 *   describeMatchingScenarioRepository('my adapter', () => createMyAdapter());
 */

const scenario = (id: string, title = `Scénario ${id}`): MatchingScenario => ({
  id,
  title,
  fridge: ['ing_oeuf', 'ing_tomate'],
  pantry: [],
  filters: { category: 'dessert' },
  checks: [
    { kind: 'first', recipeId: 'rec_x', tier: 'ready' },
    { kind: 'tier', recipeId: 'rec_x', tiers: ['almost', 'absent'] },
  ],
});

const read = async (repo: MatchingScenarioRepository) => {
  const raw = await repo.list();
  expect(raw).not.toBeNull();
  return (raw ?? []).map(parseScenario);
};

export function describeMatchingScenarioRepository(
  name: string,
  create: () => MatchingScenarioRepository | Promise<MatchingScenarioRepository>
) {
  describe(`MatchingScenarioRepository contract: ${name}`, () => {
    let repo: MatchingScenarioRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await repo.list()).toEqual([]);
    });

    it('stores a scenario without losing anything, and reads it back with its id', async () => {
      expect(await repo.save(scenario('a'))).toEqual({ ok: true });
      expect(await read(repo)).toEqual([scenario('a')]);
    });

    it('keeps the creation order, and an update keeps the place of the scenario', async () => {
      await repo.save(scenario('b'));
      await repo.save(scenario('a'));
      await repo.save(scenario('b', 'Titre modifié'));
      expect((await read(repo)).map((s) => s?.title)).toEqual(['Titre modifié', 'Scénario a']);
    });

    it('removes one scenario (removing an unknown id is not an error)', async () => {
      await repo.save(scenario('a'));
      await repo.save(scenario('b'));
      expect(await repo.remove('a')).toEqual({ ok: true });
      expect(await repo.remove('unknown')).toEqual({ ok: true });
      expect((await read(repo)).map((s) => s?.id)).toEqual(['b']);
    });

    it('replaceAll restores exactly the given list, in its order', async () => {
      await repo.save(scenario('old'));
      await repo.save(scenario('b'));
      expect(await repo.replaceAll([scenario('c'), scenario('b', 'B restauré'), scenario('a')])).toEqual({ ok: true });
      expect((await read(repo)).map((s) => `${s?.id}:${s?.title}`)).toEqual([
        'c:Scénario c',
        'b:B restauré',
        'a:Scénario a',
      ]);
      expect(await repo.replaceAll([])).toEqual({ ok: true });
      expect(await repo.list()).toEqual([]);
    });

    it('returns copies: changing a read value does not change the stored data', async () => {
      await repo.save(scenario('a'));
      const [first] = (await repo.list()) as MatchingScenario[];
      first.fridge.push('ing_hack');
      expect(await read(repo)).toEqual([scenario('a')]);
    });
  });
}
