import React from 'react';
import { Skeleton } from './Skeleton';

interface SkeletonListProps {
  /** Number of placeholders (a page of 24 is a lot: keep it small, this is a loading state) */
  count?: number;
  /** `cards` = media blocks of a card grid, `lines` = text bars of a dense list */
  variant?: 'cards' | 'lines';
  className?: string;
}

/** Shared loading list: composes the `Skeleton` building block; the caller owns the aria-busy state. */
export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 6, variant = 'cards', className = '' }) => (
  <div
    className={
      variant === 'cards'
        ? `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`
        : `flex flex-col gap-2 ${className}`
    }
  >
    {Array.from({ length: count }, (_, i) => (
      <Skeleton
        key={i}
        width={variant === 'cards' ? '100%' : '100%'}
        height={variant === 'cards' ? '12rem' : '1rem'}
        rounded={variant === 'cards' ? 'xl' : 'md'}
      />
    ))}
  </div>
);
