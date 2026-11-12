import { describe, expect, it } from 'vitest';
import { addPriceRanges, ingredientPriceRange, isFixedPrice, roundPriceRange, ZERO_PRICE } from './pricing';

describe('pricing', () => {
  it('reads the range of an ingredient', () => {
    expect(ingredientPriceRange({ price_min_tnd: 2, price_max_tnd: 3.5 })).toEqual({ min: 2, max: 3.5 });
  });

  it('adds ranges bound by bound, starting from zero', () => {
    const total = [
      { min: 1.2, max: 2 },
      { min: 0.5, max: 0.5 },
    ].reduce(addPriceRanges, ZERO_PRICE);
    expect(roundPriceRange(total)).toEqual({ min: 1.7, max: 2.5 });
  });

  it('rounds to the tenth and detects a single price', () => {
    expect(roundPriceRange({ min: 1.04, max: 2.06 })).toEqual({ min: 1, max: 2.1 });
    expect(isFixedPrice({ min: 3, max: 3.01 })).toBe(true);
    expect(isFixedPrice({ min: 3, max: 4 })).toBe(false);
  });
});
