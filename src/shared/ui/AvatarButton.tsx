import React from 'react';
import { UserRound } from 'lucide-react';

interface AvatarButtonProps {
  /** Accessible name (i18n) */
  label: string;
  /** Profile photo when the session provides one (none today) */
  src?: string;
  /** Initial derived from the session identity (signed-in user without photo) */
  initial?: string;
  /** Neutral profile icon for a guest session (D-26) */
  isGuest?: boolean;
  /** Mirrored on `aria-expanded` (panel opened from this button) */
  expanded: boolean;
  /** `id` of the panel, mirrored on `aria-controls` */
  panelId?: string;
  onClick: () => void;
  /** Lets the caller return the focus to the avatar when the panel closes */
  buttonRef?: React.Ref<HTMLButtonElement>;
}

/**
 * Header avatar (D-23): replaces the account button and the settings gear.
 * Opens the compact profile panel; the button knows neither the panel nor the
 * modals (labels and destinations live with the caller).
 * Touch target: 44×44 px (`h-11 w-11`), never smaller.
 */
export function AvatarButton({
  label,
  src,
  initial,
  isGuest,
  expanded,
  panelId,
  onClick,
  buttonRef,
}: AvatarButtonProps) {
  const hasIdentity = !!src || (!!initial && !isGuest);
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={panelId}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors outline-none focus-visible:ring-2 ring-focus-ring ring-offset-2 ring-offset-surface ${
        hasIdentity ? 'bg-brand text-on-brand hover:bg-brand-strong' : 'bg-tint text-ink-muted hover:text-ink'
      }`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : hasIdentity ? (
        <span className="text-sm font-bold uppercase" aria-hidden="true">
          {initial}
        </span>
      ) : (
        <UserRound className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
