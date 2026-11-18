import React from 'react';
import { renderInjectedLink, type LinkComponent } from '@/shared/ui/linkComponent';

interface ShelfProps {
  /** i18n title of the stall */
  title: string;
  /** Optional "see all" action rendered as a real link (SPA via the injected link) */
  action?: { href: string; label: string };
  linkComponent?: LinkComponent;
  children: React.ReactNode;
  className?: string;
}

/** Editorial stall (D4): heading + optional see-all link + horizontal content (a `Rail` inside). */
export const Shelf: React.FC<ShelfProps> = ({ title, action, linkComponent, children, className = '' }) => (
  <section className={className} aria-label={title}>
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="min-w-0 truncate font-display text-base font-extrabold text-ink sm:text-lg">{title}</h2>
      {action &&
        renderInjectedLink({
          href: action.href,
          linkComponent,
          native: {},
          className:
            'inline-flex min-h-[44px] shrink-0 items-center px-2 text-sm font-bold text-brand-text hover:underline',
          children: action.label,
        })}
    </div>
    {children}
  </section>
);
