import { describe, expect, it } from 'vitest';
import {
  hasImplausibleUnitPrice,
  parseMeasure,
  purchaseUnits,
  recipeCostRange,
  suggestRecipeCost,
} from './costEstimate';
import { initialIngredients } from './seed/initialIngredients';
import type { Ingredient } from './types';

const ing = (id: string, unit: string, min: number, max = min): Ingredient => ({
  id,
  name_fr: id,
  name_derja: id,
  name_ar: id,
  category: 'other',
  unit_default: unit,
  price_min_tnd: min,
  price_max_tnd: max,
});

describe('parseMeasure', () => {
  it('reads masses, volumes and counted units', () => {
    expect(parseMeasure('kg')).toEqual({ kind: 'mass', label: 'g', amount: 1000 });
    expect(parseMeasure('100 g')).toEqual({ kind: 'mass', label: 'g', amount: 100 });
    expect(parseMeasure('paquet (500g)')).toEqual({ kind: 'mass', label: 'g', amount: 500 });
    expect(parseMeasure('boîte (400 ml)')).toEqual({ kind: 'volume', label: 'ml', amount: 400 });
    expect(parseMeasure('L')).toEqual({ kind: 'volume', label: 'ml', amount: 1000 });
    expect(parseMeasure('pièces (durs)')).toEqual({ kind: 'count', label: 'pièce', amount: 1 });
    expect(parseMeasure('c.à.s / L')).toBeNull();
  });
});

describe('purchaseUnits', () => {
  it('converts within the same kind of unit only', () => {
    expect(purchaseUnits(250, 'g', 'kg')).toBe(0.25);
    expect(purchaseUnits(3, 'pièces', 'pièce')).toBe(3);
    expect(purchaseUnits(20, 'cl', 'L')).toBe(0.2);
    expect(purchaseUnits(2, 'c.à.s', 'kg')).toBeNull();
    expect(purchaseUnits(2, 'gousses', 'tête')).toBeNull();
  });
});

describe('suggestRecipeCost', () => {
  it('adds the priced ingredients and lists the others', () => {
    const byId = new Map(
      [ing('tomate', 'kg', 2, 3), ing('oeuf', 'pièce', 0.4), ing('huile', 'L', 10), ing('sel', 'kg', 1)].map((i) => [
        i.id,
        i,
      ])
    );
    const suggestion = suggestRecipeCost(
      {
        ingredients: [
          { ingredient_id: 'tomate', quantity_base: 500, unit: 'g' },
          { ingredient_id: 'oeuf', quantity_base: 4, unit: 'pièces' },
          { ingredient_id: 'huile', quantity_base: 3, unit: 'c.à.s' },
          { ingredient_id: 'sel', quantity_base: 1, unit: 'kg', is_optional: true },
          { ingredient_id: 'inconnu', quantity_base: 1, unit: 'kg' },
        ],
      },
      byId
    );
    expect(suggestion).toEqual({
      range: { min: 2.6, max: 3.1 },
      priced: 2,
      unpriced: ['huile', 'inconnu'],
      suspicious: [],
    });
  });
});

describe('recipeCostRange', () => {
  it('is computed from the ingredient price ranges', () => {
    const egg = { ...initialIngredients.find((i) => i.id === 'ing_oeuf')! };
    const byId = new Map([[egg.id, egg]]);
    const recipe = {
      estimated_cost_tnd: 99,
      ingredients: [{ ingredient_id: egg.id, quantity_base: 2, unit: egg.unit_default }],
    };
    const range = recipeCostRange(recipe, byId);
    expect(range.min).toBeCloseTo(2 * egg.price_min_tnd, 1);
    expect(range.max).toBeCloseTo(2 * egg.price_max_tnd, 1);
    expect(range.min).toBeLessThan(range.max);
  });

  it("falls back to the chef's estimate when nothing can be priced", () => {
    const recipe = { estimated_cost_tnd: 7, ingredients: [{ ingredient_id: 'unknown', quantity_base: 1, unit: 'kg' }] };
    expect(recipeCostRange(recipe, new Map())).toEqual({ min: 7, max: 7 });
  });
});

describe('recipeCostRange: inconsistent data never gives an absurd cost', () => {
  const shrimp = { ...initialIngredients.find((i) => i.id === 'ing_crevettes')!, unit_default: 'g' };
  const lemon = initialIngredients.find((i) => i.id === 'ing_citron')!;
  const byId = new Map([
    [shrimp.id, shrimp],
    [lemon.id, lemon],
  ]);

  it('leaves out an ingredient needing hundreds of purchase units (price given for the wrong unit)', () => {
    const recipe = {
      estimated_cost_tnd: 22,
      ingredients: [
        { ingredient_id: shrimp.id, quantity_base: 600, unit: 'g' },
        { ingredient_id: lemon.id, quantity_base: 1, unit: 'pièce' },
      ],
    };
    expect(suggestRecipeCost(recipe, byId)).toMatchObject({ unpriced: [shrimp.id], suspicious: [shrimp.id] });
    // The main ingredient is missing from the computation: the chef's estimate is shown instead
    expect(recipeCostRange(recipe, byId)).toEqual({ min: 22, max: 22 });
  });

  it("falls back to the chef's estimate when the computed cost is far above it", () => {
    const pricey = { ...lemon, price_min_tnd: 500, price_max_tnd: 600 };
    const recipe = {
      estimated_cost_tnd: 10,
      ingredients: [{ ingredient_id: lemon.id, quantity_base: 1, unit: 'pièce' }],
    };
    expect(recipeCostRange(recipe, new Map([[lemon.id, pricey]]))).toEqual({ min: 10, max: 10 });
  });
});

describe('hasImplausibleUnitPrice', () => {
  it('flags a pack price given for a single gram, not real purchase units', () => {
    expect(hasImplausibleUnitPrice({ unit_default: 'g', price_max_tnd: 3.6 })).toBe(true);
    expect(hasImplausibleUnitPrice({ unit_default: '100 g', price_max_tnd: 3.6 })).toBe(false);
    expect(hasImplausibleUnitPrice({ unit_default: 'kg', price_max_tnd: 66 })).toBe(false);
    expect(hasImplausibleUnitPrice({ unit_default: 'pièce', price_max_tnd: 40 })).toBe(false);
  });

  it('every built-in ingredient has a plausible unit price', () => {
    expect(initialIngredients.filter(hasImplausibleUnitPrice).map((i) => i.id)).toEqual([]);
  });

  it('an ingredient priced for the wrong unit is left out of the cost', () => {
    const butter = { ...initialIngredients.find((i) => i.id === 'ing_beurre')!, unit_default: 'g' };
    const recipe = {
      estimated_cost_tnd: 12,
      ingredients: [{ ingredient_id: butter.id, quantity_base: 30, unit: 'g' }],
    };
    expect(recipeCostRange(recipe, new Map([[butter.id, butter]]))).toEqual({ min: 12, max: 12 });
  });
});
