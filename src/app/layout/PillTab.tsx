import React from 'react';
import { Link } from 'react-router';

interface PillTabProps {
  href: string;
  /** i18n label */
  label: string;
  active: boolean;
}

/**
 * Desktop navigation pill (D-22): a real navigation link — `href` in props,
 * state signal `aria-current="page"` on the active one only. The `tablist`
 * model (`role="tab"`) is deliberately not used: these links navigate, they
 * do not switch panels.
 */
export function PillTab({ href, label, active }: PillTabProps) {
  return (
    <Link
      to={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 ring-focus-ring ${
        active ? 'bg-tint text-brand-text' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
}
