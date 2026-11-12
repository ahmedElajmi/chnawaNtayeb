import React from 'react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  children: React.ReactNode;
  /** Called when the dimmed backdrop itself (not the panel) is clicked. */
  onBackdropClick?: () => void;
  /** Phone placement: centered (default, top-aligned when taller than the screen) or docked at the bottom. */
  mobile?: 'center' | 'bottom' | 'full';
  /** Extra classes for the backdrop (e.g. a darker tint). */
  backdropClassName?: string;
}

/**
 * Backdrop of every dialog. Rendered in a portal on <body> so that no animated
 * (transformed) or blurred ancestor can capture the `position: fixed` layer.
 * The panel is centered with auto margins: when it is taller than the screen
 * it starts at the top and the backdrop scrolls, so nothing is cut off.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  children,
  onBackdropClick,
  mobile = 'center',
  backdropClassName = 'bg-black/60',
}) => {
  const padding = mobile === 'center' ? 'p-4' : 'p-0 sm:p-4';
  const vertical = mobile === 'bottom' ? 'mt-auto sm:my-auto' : 'my-auto';
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain backdrop-blur-xs animate-fade-in ${padding} ${backdropClassName}`}
      onClick={(e) => {
        if (onBackdropClick && e.target === e.currentTarget) onBackdropClick();
      }}
    >
      <div
        className={`w-full flex justify-center ${vertical}`}
        onClick={(e) => {
          if (onBackdropClick && e.target === e.currentTarget) onBackdropClick();
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
