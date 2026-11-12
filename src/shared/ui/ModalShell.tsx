import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLatest } from '@/shared/hooks/useLatest';

interface ModalShellProps {
  children: React.ReactNode;
  /**
   * Required on purpose: closes the dialog on a click outside the panel or on Escape.
   * A dialog with unsaved input passes a function that asks before losing it.
   * `null` only for a dialog that must not be dismissed this way (say why at the call site).
   */
  onDismiss: (() => void) | null;
  /** Phone placement: centered (default, top-aligned when taller than the screen) or docked at the bottom. */
  mobile?: 'center' | 'bottom' | 'full';
  /** Extra classes for the backdrop (e.g. a darker tint). */
  backdropClassName?: string;
}

/** Open dialogs, innermost last: Escape only closes the one on top. */
const openShells: symbol[] = [];

/**
 * Backdrop of every dialog. Rendered in a portal on <body> so that no animated
 * (transformed) or blurred ancestor can capture the `position: fixed` layer.
 * The panel is centered with auto margins: when it is taller than the screen
 * it starts at the top and the backdrop scrolls, so nothing is cut off.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  children,
  onDismiss,
  mobile = 'center',
  backdropClassName = 'bg-black/60',
}) => {
  const dismissRef = useLatest(onDismiss);

  useEffect(() => {
    const id = Symbol('modal');
    openShells.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openShells[openShells.length - 1] !== id) return;
      const dismiss = dismissRef.current;
      if (dismiss) {
        e.stopPropagation();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      openShells.splice(openShells.indexOf(id), 1);
      window.removeEventListener('keydown', onKey);
    };
  }, [dismissRef]);

  const onOutside = (e: React.MouseEvent) => {
    if (onDismiss && e.target === e.currentTarget) onDismiss();
  };
  const padding = mobile === 'center' ? 'p-4' : 'p-0 sm:p-4';
  const vertical = mobile === 'bottom' ? 'mt-auto sm:my-auto' : 'my-auto';
  return createPortal(
    <div
      data-testid="modal-backdrop"
      className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain backdrop-blur-xs animate-fade-in ${padding} ${backdropClassName}`}
      onClick={onOutside}
    >
      <div className={`w-full flex justify-center ${vertical}`} onClick={onOutside}>
        {children}
      </div>
    </div>,
    document.body
  );
};
