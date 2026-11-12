import { describe, expect, it } from 'vitest';
import { browseRecipes, matchRecipes } from './engine';
import { initialRecipes } from '../catalog/seed/initialRecipes';
import { initialIngredients } from '../catalog/seed/initialIngredients';
import { DEFAULT_PANTRY_STAPLES } from '../preferences/defaults';

// The catalog may grow to thousands of recipes: the engine runs on the phone at every change
// of the fridge, so it must stay fast on a large catalog (generous limit for slow CI machines).
const BIG = 5000;
const bigCatalog = Array.from({ length: BIG }, (_, i) => {
  const base = initialRecipes[i % initialRecipes.length];
  return { ...base, id: `${base.id}_${i}`, slug: `${base.slug}-${i}` };
});
const ctx = { pantryIds: DEFAULT_PANTRY_STAPLES, catalog: initialIngredients };
const fridge = ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment', 'ing_merguez', 'ing_pomme_terre'];

describe('engine on a large catalog', () => {
  it(`matches and browses ${BIG} recipes quickly`, () => {
    const start = performance.now();
    const matches = matchRecipes(bigCatalog, fridge, undefined, ctx);
    const all = browseRecipes(bigCatalog, fridge, undefined, ctx);
    const elapsed = performance.now() - start;
    expect(all.length).toBeGreaterThan(BIG / 2);
    expect(matches.ready.length + matches.almost.length + matches.ideas.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(3000);
  });
});
