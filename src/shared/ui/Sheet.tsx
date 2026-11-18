import React from 'react';
import { ModalShell } from './ModalShell';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';

interface SheetProps {
  open: boolean;
  /** Closes on backdrop click and on Escape (top of the shell stack); the caller keeps the trigger focus */
  onClose: () => void;
  /** i18n label of the dialog */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Bottom sheet on phone, centered panel on desktop — a composition of the existing mechanisms
 * (lot 2.6.2, decision of the chef): `ModalShell` (portal, Escape on the top of the stack, outside
 * click, `onDismiss` required) plus `useCloseOnBack` (back button closes the overlay). No second
 * modal system is created; scroll behavior stays the one of `ModalShell`.
 */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, label, children, className = '' }) => {
  // Phone back button closes the sheet instead of leaving the screen (hook called unconditionally)
  useCloseOnBack(open, onClose);
  if (!open) return null;
  return (
    <ModalShell onDismiss={onClose} mobile="bottom">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`w-full rounded-t-2xl border border-line bg-card p-4 shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-4 ${className}`}
      >
        {children}
      </section>
    </ModalShell>
  );
};
