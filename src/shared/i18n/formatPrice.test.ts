import { describe, expect, it } from 'vitest';
import { formatPriceRange } from './formatPrice';

describe('formatPriceRange', () => {
  it('shows one price when min and max are equal, a range otherwise', () => {
    expect(formatPriceRange({ min: 2.5, max: 2.5 }, 'DT')).toBe('2.5 DT');
    expect(formatPriceRange({ min: 2, max: 3.46 }, 'DT')).toBe('2 – 3.5 DT');
    expect(formatPriceRange({ min: 1, max: 2 }, 'د.ت')).toBe('1 – 2 د.ت');
  });
});
