import React, { useEffect, useRef } from 'react';

export interface ProfilePanelEntry {
  key: string;
  /** i18n label */
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface ProfilePanelProps {
  /** `id` targeted by the avatar's `aria-controls` */
  id?: string;
  /** Accessible name of the panel (i18n) — it is a group of actions, never a `menu` */
  label: string;
  /** Existing destinations only (account modal, settings modal) — no invented screen */
  entries: ProfilePanelEntry[];
  className?: string;
}

/**
 * Compact profile panel (D-23): pure composition — the Escape / click-outside
 * behaviors are wired by the caller (desktop popover) or by ModalShell (mobile).
 * The focus starts on the first entry; returning it to the avatar is the
 * caller's job on close.
 */
export function ProfilePanel({ id, label, entries, className = '' }: ProfilePanelProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      className={`rounded-2xl border border-line bg-card p-1.5 shadow-lg ${className}`}
    >
      {entries.map((entry, index) => (
        <button
          key={entry.key}
          ref={index === 0 ? firstRef : undefined}
          type="button"
          onClick={entry.onSelect}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-start text-sm font-semibold text-ink outline-none transition-colors hover:bg-tint hover:text-brand-text focus-visible:ring-2 ring-focus-ring"
        >
          <span aria-hidden="true" className="shrink-0 text-ink-muted">
            {entry.icon}
          </span>
          <span className="truncate">{entry.label}</span>
        </button>
      ))}
    </div>
  );
}
