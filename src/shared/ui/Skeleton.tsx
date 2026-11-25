import React from 'react';

export interface SkeletonProps {
  /** Any CSS width (defaults to the full width of the parent) */
  width?: string;
  /** Any CSS height (defaults to a text line) */
  height?: string;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const ROUNDED: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-2xl',
  full: 'rounded-full',
};

/**
 * Loading placeholder (motif D4): a silent pulsing block on the `line` token.
 * No text and no business logic: the caller composes cards from several blocks
 * and sets `aria-busy` on its own container.
 */
export function Skeleton({ width = '100%', height = '1rem', rounded = 'lg', className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`bg-line animate-pulse ${ROUNDED[rounded]} ${className}`}
    />
  );
}
