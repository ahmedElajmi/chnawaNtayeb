import React from 'react';
import type { PriceRange as PriceRangeData } from '@/core/catalog';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { useLanguage } from '@/app/providers/LanguageContext';

interface PriceRangeProps {
  range: PriceRangeData;
  className?: string;
}

/** Shared display of a price range, always through `formatPriceRange` (currency from the language). */
export const PriceRange: React.FC<PriceRangeProps> = ({ range, className = '' }) => {
  const { t } = useLanguage();
  return <span className={`font-bold text-accent-text ${className}`}>{formatPriceRange(range, t.currency)}</span>;
};
