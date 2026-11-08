import { describe, it, expect } from 'vitest';
import { matchRecipes, analyzeRecipe, browseRecipes } from './engine';
import { findByName, normalizeText } from '../shared/text';
import { inferRole } from '../catalog/roles';
import { initialRecipes } from '../catalog/seed/initialRecipes';
import { initialIngredients } from '../catalog/seed/initialIngredients';
import { DEFAULT_PANTRY_STAPLES } from '../preferences/defaults';
import type { MatchingResult } from './types';

const ctx = { pantryIds: DEFAULT_PANTRY_STAPLES, catalog: initialIngredients };
const ojja = initialRecipes.find((r) => r.id === 'rec_ojja_merguez')!;

const tierOf = (res: ReturnType<typeof matchRecipes>, id: string): MatchingResult['tier'] | 'absent' => {
  for (const tier of ['ready', 'almost', 'ideas'] as const) {
    if (res[tier].some((r) => r.recipe.id === id)) return tier;
  }
  return 'absent';
};

describe('matchRecipes – tiers', () => {
  it('never proposes the ojja merguez as "almost" when eggs and merguez are missing', () => {
    const pantryOnly = [
      'ing_oignon',
      'ing_ail',
      'ing_huile_olive',
      'ing_sel_poivre',
      'ing_tabel_karwiya',
      'ing_harissa',
      'ing_piment',
      'ing_tomate_concentree',
    ];
    const res = matchRecipes(initialRecipes, pantryOnly, undefined, ctx);
    expect(tierOf(res, 'rec_ojja_merguez')).toBe('absent');
  });

  it('eggs + merguez + tomatoes + peppers (with the default pantry) → ojja merguez is ready', () => {
    const res = matchRecipes(initialRecipes, ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_piment'], undefined, ctx);
    // tomate concentrée is substituted by fresh tomatoes
    expect(tierOf(res, 'rec_ojja_merguez')).toBe('ready');
    const result = res.ready.find((r) => r.recipe.id === 'rec_ojja_merguez')!;
    expect(result.substitutions).toEqual([{ ingredient_id: 'ing_tomate_concentree', substitute_id: 'ing_tomate' }]);
  });

  it('a missing key ingredient is "almost" only when it is the single purchase', () => {
    const fridge = ['ing_oeuf', 'ing_tomate', 'ing_piment']; // no merguez
    const res = matchRecipes(initialRecipes, fridge, undefined, ctx);
    for (const r of res.almost) if (r.missing_key.length > 0) expect(r.missing_ingredients).toHaveLength(1);
    // Only the merguez is missing: one purchase away
    expect(tierOf(res, 'rec_ojja_merguez')).toBe('almost');
    expect(res.almost.find((r) => r.recipe.id === 'rec_ojja_merguez')!.missing_ingredients).toEqual(['ing_merguez']);
  });

  it('missing salt or spices does not prevent a recipe from being ready', () => {
    const a = analyzeRecipe(ojja, ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_tomate_concentree', 'ing_piment'], {
      pantryIds: [],
      catalog: initialIngredients,
    });
    expect(a.missingKey).toEqual([]);
    expect(a.missingSecondary).toEqual([]);
    expect(a.missingStaples.length).toBeGreaterThan(0);
  });

  it('student fridge (eggs, tuna, pasta) only returns related recipes', () => {
    const res = matchRecipes(initialRecipes, ['ing_oeuf', 'ing_thon_boite', 'ing_pates'], undefined, ctx);
    const all = [...res.ready, ...res.almost, ...res.ideas];
    expect(all.length).toBeGreaterThan(0);
    // Couscous with lamb has no key ingredient in this fridge
    expect(tierOf(res, 'rec_couscous_allouch')).toBe('absent');
    for (const r of all) expect(r.fridge_used).toBeGreaterThan(0);
  });

  it('a substitute makes the key ingredient available (chorba frik with lamb instead of chicken)', () => {
    const res = matchRecipes(initialRecipes, ['ing_frik', 'ing_agneau'], undefined, ctx);
    const chorba = [...res.ready, ...res.almost, ...res.ideas].find((r) => r.recipe.id === 'rec_chorba_frik')!;
    expect(chorba).toBeDefined();
    expect(chorba.missing_key).toEqual([]);
    expect(chorba.substitutions).toContainEqual({ ingredient_id: 'ing_poulet', substitute_id: 'ing_agneau' });
  });

  it('empty fridge = browsing mode: every published recipe is listed as an idea', () => {
    const res = matchRecipes(initialRecipes, [], undefined, ctx);
    expect(res.ready).toHaveLength(0);
    expect(res.almost).toHaveLength(0);
    expect(res.ideas).toHaveLength(initialRecipes.filter((r) => r.is_published).length);
  });

  it('a name search still finds a recipe unrelated to the fridge', () => {
    const res = matchRecipes(initialRecipes, ['ing_concombre'], { searchQuery: 'couscous' }, ctx);
    expect(tierOf(res, 'rec_couscous_allouch')).toBe('ideas');
  });

  it('search ignores accents and case', () => {
    const res = matchRecipes(initialRecipes, [], { searchQuery: 'MAKAROUNA' }, ctx);
    expect(res.ideas.some((r) => r.recipe.id === 'rec_makarouna_salsa_djaj')).toBe(true);
  });

  it('ready recipes that use more of the fridge come first (anti-waste)', () => {
    const res = matchRecipes(
      initialRecipes,
      initialIngredients.map((i) => i.id),
      undefined,
      ctx
    );
    const used = res.ready.map((r) => r.fridge_used);
    expect(used).toEqual([...used].sort((a, b) => b - a));
  });
});

describe('ingredient roles', () => {
  it('infers roles for recipes without explicit roles', () => {
    expect(inferRole('ing_sel_poivre', initialIngredients)).toBe('staple');
    expect(inferRole('ing_poulet', initialIngredients)).toBe('key');
    expect(inferRole('ing_frik', initialIngredients)).toBe('key');
    expect(inferRole('ing_carotte', initialIngredients)).toBe('secondary');
  });

  it('every built-in recipe has at least one key ingredient', () => {
    for (const r of initialRecipes) {
      expect(
        r.ingredients.some((i) => i.role === 'key'),
        r.id
      ).toBe(true);
    }
  });
});

describe('text normalization (photo scanner / search)', () => {
  it('normalizes ligatures, accents and plurals', () => {
    expect(normalizeText('Œufs')).toBe('oeuf');
    expect(normalizeText('Pommes de terre')).toBe('pomme de terre');
    expect(normalizeText('Pâtes')).toBe('pate');
  });

  it.each([
    ['Oeuf', 'ing_oeuf'],
    ['Œufs', 'ing_oeuf'],
    ['Pommes de terre', 'ing_pomme_de_terre'],
    ['tomates', 'ing_tomate'],
    ['Tomate concentrée', 'ing_tomate_concentree'],
    ['Poivron', 'ing_piment'],
    ["Huile d'olive", 'ing_huile_olive'],
    ['Pois chiches', 'ing_pois_chiches'],
    ['Fromage râpé', 'ing_fromage_rape'],
    ['Tmatem', 'ing_tomate'],
  ])('"%s" → %s', (query, expected) => {
    expect(findByName(query, initialIngredients)?.id).toBe(expected);
  });

  it('does not match random substrings ("sel" is not "persil")', () => {
    expect(findByName('sel', initialIngredients)?.id).not.toBe('ing_persil');
  });

  it('returns nothing for unknown items', () => {
    expect(findByName('Kiwi', initialIngredients)).toBeUndefined();
  });
});

describe('browseRecipes – full catalog', () => {
  const published = initialRecipes.filter((r) => r.is_published);

  it('keeps every published recipe, even those unrelated to the fridge', () => {
    const list = browseRecipes(initialRecipes, ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_piment'], undefined, ctx);
    expect(list).toHaveLength(published.length);
    expect(new Set(list.map((r) => r.recipe.id)).size).toBe(published.length);
  });

  it('lists the fridge suggestions first, in the same order as matchRecipes', () => {
    const fridge = ['ing_oeuf', 'ing_merguez', 'ing_tomate', 'ing_piment'];
    const res = matchRecipes(initialRecipes, fridge, undefined, ctx);
    const suggested = [...res.ready, ...res.almost, ...res.ideas].map((r) => r.recipe.id);
    const list = browseRecipes(initialRecipes, fridge, undefined, ctx);
    expect(list.slice(0, suggested.length).map((r) => r.recipe.id)).toEqual(suggested);
  });

  it('applies the filters', () => {
    const list = browseRecipes(initialRecipes, [], { category: 'dessert' }, ctx);
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThan(published.length);
  });
});
