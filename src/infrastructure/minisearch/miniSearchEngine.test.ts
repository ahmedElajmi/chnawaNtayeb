import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '@/core/catalog';
import { normalizeSearchText, recipeSearchDocument } from '@/core/search';
import { describeSearchEngine } from '../contracts/searchEngine.contract';
import { allowedTypos, createMiniSearchEngine } from './miniSearchEngine';

describeSearchEngine('MiniSearch', () => createMiniSearchEngine());

describe('MiniSearch engine on the built-in catalog', () => {
  const byId = new Map(initialIngredients.map((i) => [i.id, i]));
  const setup = async () => {
    const engine = createMiniSearchEngine();
    await engine.rebuild(initialRecipes.map((r) => recipeSearchDocument(r, byId)));
    const names = async (query: string) => {
      const hits = await engine.search(normalizeSearchText(query));
      return hits.map((h) => initialRecipes.find((r) => r.id === h.id)!.name_fr);
    };
    return names;
  };

  it('accepts typos in longer words', async () => {
    const names = await setup();
    const exact = await names('kamounia');
    expect(exact.length).toBeGreaterThan(0);
    expect((await names('kamounya'))[0]).toBe(exact[0]);
  });

  it('accepts derja spellings and Arabic with vowel marks', async () => {
    const names = await setup();
    expect((await names('chakchoka')).some((n) => /chakchouka/i.test(n))).toBe(true);
    const plain = await names('كسكسي');
    if (plain.length) expect(await names('كُسْكُسِي')).toEqual(plain);
  });

  it('allows no typo in short words, then one, then two', () => {
    expect([allowedTypos('ueuf'), allowedTypos('kamunia'), allowedTypos('chakchuka')]).toEqual([0, 1, 2]);
  });
});
