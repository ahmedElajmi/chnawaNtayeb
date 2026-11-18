import React from 'react';
import { renderInjectedLink, type LinkComponent } from './linkComponent';

/**
 * Action of an empty state: exclusive and explicit on purpose — either a navigation (`href`,
 * rendered as a real link) or an in-place action (`onClick`, rendered as a real button).
 * The discriminated union makes "both at once" impossible to compile.
 */
export type EmptyStateAction =
  { kind: 'link'; href: string; label: string } | { kind: 'button'; label: string; onClick: () => void };

interface EmptyStateProps {
  /** Icon component (lucide), rendered silently */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: EmptyStateAction;
  /** Injected by the React Router consumer (adapted `href` → `to`) to preserve SPA navigation */
  linkComponent?: LinkComponent;
  className?: string;
}

/** Shared empty state: icon, message and one explicit action. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  linkComponent,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}>
    {Icon && <Icon className="h-10 w-10 text-ink-muted" aria-hidden="true" />}
    <p className="font-display text-base font-bold text-ink">{title}</p>
    {message && <p className="max-w-sm text-sm text-ink-muted">{message}</p>}
    {action &&
      (action.kind === 'link' ? (
        renderInjectedLink({
          href: action.href,
          linkComponent,
          native: {},
          className:
            'mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition hover:bg-brand-strong',
          children: action.label,
        })
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition hover:bg-brand-strong"
        >
          {action.label}
        </button>
      ))}
  </div>
);
