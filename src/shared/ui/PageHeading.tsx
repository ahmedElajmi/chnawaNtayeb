import React from 'react';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  /** Right-side actions (buttons, links); stacked below on narrow screens */
  actions?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/** Shared heading of a screen: title, optional subtitle and actions (logical RTL classes only). */
export const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  actions,
  compact = false,
  className = '',
}) => (
  <header className={`flex flex-wrap items-end justify-between gap-2 ${compact ? 'mb-3' : 'mb-5'} ${className}`}>
    <div className="min-w-0 flex-1">
      <h1 className={`font-display font-extrabold text-ink ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);
