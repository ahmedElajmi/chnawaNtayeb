import { isFixedPrice, roundPriceRange, type PriceRange } from '@/core/catalog';

const amount = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** "2.5 DT" for a single price, "2.5 – 4 DT" for a range (currency from the translations). */
export function formatPriceRange(range: PriceRange, currency: string): string {
  const r = roundPriceRange(range);
  return isFixedPrice(r) ? `${amount(r.min)} ${currency}` : `${amount(r.min)} – ${amount(r.max)} ${currency}`;
}
