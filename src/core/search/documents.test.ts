import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { ingredientSearchDocument, recipeSearchDocument, sortBySearchScore, toSearchMatches } from './documents';
import { planIndexUpdate } from './indexPlan';
import { normalizeSearchText } from './normalize';

const byId = new Map(initialIngredients.map((i) => [i.id, i]));

describe('recipeSearchDocument', () => {
  const recipe = initialRecipes[0];
  const doc = recipeSearchDocument(recipe, byId);

  it('indexes the names of the three languages, normalized', () => {
    expect(doc.id).toBe(recipe.id);
    for (const name of [recipe.name_fr, recipe.name_derja, recipe.name_ar]) {
      expect(doc.name).toContain(normalizeSearchText(name));
    }
  });

  it('indexes the names of its ingredients and its descriptions', () => {
    const first = byId.get(recipe.ingredients[0].ingredient_id)!;
    expect(doc.related).toContain(normalizeSearchText(first.name_fr));
    expect(doc.details).toContain(normalizeSearchText(recipe.description_fr).split(' ')[0]);
  });

  it('also indexes a language variant added later (e.g. derja in Arabic letters)', () => {
    const withVariant = { ...recipe, name_derja_ar: 'عجة بالمرقاز' };
    expect(recipeSearchDocument(withVariant, byId).name).toContain(normalizeSearchText('عجة'));
  });

  it('ignores an ingredient that is no longer in the catalog', () => {
    const orphan = { ...recipe, ingredients: [{ ingredient_id: 'gone', quantity_base: 1, unit: 'g' }] };
    expect(recipeSearchDocument(orphan, byId).related).toBe('');
  });
});

describe('ingredientSearchDocument', () => {
  it('indexes the names of the three languages', () => {
    const ingredient = initialIngredients[0];
    const doc = ingredientSearchDocument(ingredient);
    expect(doc.name).toContain(normalizeSearchText(ingredient.name_fr));
    expect(doc.related).toBe('');
  });
});

describe('sortBySearchScore', () => {
  it('puts the best score first and keeps the order otherwise', () => {
    const items = ['a', 'b', 'c', 'd'];
    const matches = toSearchMatches([
      { id: 'c', score: 5 },
      { id: 'b', score: 1 },
      { id: 'd', score: 1 },
    ]);
    expect(sortBySearchScore(items, (x) => x, matches)).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('planIndexUpdate', () => {
  it('adds new items, replaces changed ones and removes the missing ones', () => {
    const a = { id: 'a' };
    const b = { id: 'b' };
    const indexed = new Map([
      ['a', a],
      ['b', b],
      ['c', { id: 'c' }],
    ]);
    const b2 = { id: 'b' };
    const d = { id: 'd' };
    expect(planIndexUpdate(indexed, [a, b2, d])).toEqual({ upsert: [b2, d], remove: ['c'] });
  });

  it('has nothing to do when nothing changed', () => {
    const a = { id: 'a' };
    expect(planIndexUpdate(new Map([['a', a]]), [a])).toEqual({ upsert: [], remove: [] });
  });
});
