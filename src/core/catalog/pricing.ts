import type { Ingredient, PriceRange } from './types';

export const ZERO_PRICE: PriceRange = { min: 0, max: 0 };

/** Price range of one purchase unit of an ingredient. */
export function ingredientPriceRange(ingredient: Pick<Ingredient, 'price_min_tnd' | 'price_max_tnd'>): PriceRange {
  return { min: ingredient.price_min_tnd, max: ingredient.price_max_tnd };
}

export function addPriceRanges(a: PriceRange, b: PriceRange): PriceRange {
  return { min: a.min + b.min, max: a.max + b.max };
}

/** Rounded to the tenth of a dinar (what the screens display). */
export function roundPriceRange(range: PriceRange): PriceRange {
  const round = (n: number) => Math.round(n * 10) / 10;
  return { min: round(range.min), max: round(range.max) };
}

/** True when the range is a single price (min and max equal once rounded). */
export function isFixedPrice(range: PriceRange): boolean {
  const r = roundPriceRange(range);
  return r.min === r.max;
}
