import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { renderInjectedLink, type LinkComponent } from './linkComponent';

export interface LinkTabItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Count shown after the label; `null` = no count, the hint replaces it */
  count?: number | null;
  hint?: string;
  active: boolean;
}

interface LinkTabsProps {
  items: LinkTabItem[];
  /** i18n label of the navigation */
  ariaLabel: string;
  /**
   * Injected by the React Router consumer: an adapter that maps `href` → `to` (the generic
   * component never imports the router and always passes `href`; default = native `<a href>`).
   */
  linkComponent?: LinkComponent;
  /** Honored only by the injected router link (history replace, like the consumer needs) */
  replace?: boolean;
  className?: string;
}

/**
 * Navigation by real links (A-1/A-6): real links, `href` in props, `aria-current="page"` on the
 * active one — never a `tablist` model, never a router import.
 */
export const LinkTabs: React.FC<LinkTabsProps> = ({ items, ariaLabel, linkComponent, replace, className = '' }) => (
  <nav
    className={`flex gap-1 rounded-2xl border border-line bg-card p-1 shadow-xs ${className}`}
    aria-label={ariaLabel}
  >
    {items.map(({ href, label, icon: Icon, count, hint, active }) => (
      <React.Fragment key={href}>
        {renderInjectedLink({
          href,
          linkComponent,
          replace,
          'aria-current': active ? 'page' : undefined,
          native: {},
          className: `flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm ${
            active ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-muted hover:bg-surface'
          }`,
          children: (
            <>
              {Icon && <Icon className="hidden h-4 w-4 shrink-0 min-[360px]:block" aria-hidden="true" />}
              <span className="truncate">{label}</span>
              {count === null && hint ? (
                <span className={`hidden truncate min-[400px]:inline ${active ? 'opacity-90' : 'opacity-70'}`}>
                  · {hint}
                </span>
              ) : (
                count !== null &&
                count !== undefined && (
                  <span className={`shrink-0 ${active ? 'opacity-90' : 'opacity-70'}`}>({count})</span>
                )
              )}
            </>
          ),
        })}
      </React.Fragment>
    ))}
  </nav>
);
