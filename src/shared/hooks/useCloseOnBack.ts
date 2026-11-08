import { useEffect } from 'react';
import { useLatest } from './useLatest';

/**
 * Phone "back" button for overlays (modals, sheets).
 *
 * Screens have their own address (react-router), so going back between screens is
 * native. An overlay has no address: while it is open we add one history entry for
 * it, so pressing back closes the overlay instead of leaving the screen.
 */

const OVERLAY_KEY = 'chnowaOverlay';
let lastId = 0;

interface OpenOverlay {
  id: number;
  close: () => void;
  closedByBack: boolean;
}

const open: OpenOverlay[] = [];

const currentDepth = (): number => {
  const state = window.history.state as Record<string, unknown> | null;
  return typeof state?.[OVERLAY_KEY] === 'number' ? (state[OVERLAY_KEY] as number) : 0;
};

function handlePopState() {
  // Every overlay whose entry is no longer the current one was closed by "back"
  const depth = currentDepth();
  for (let i = open.length - 1; i >= 0 && open[i].id > depth; i--) {
    open[i].closedByBack = true;
    open[i].close();
  }
}

/** Registers an overlay so the back button closes it instead of leaving the screen. */
export function useCloseOnBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useLatest(onClose);

  useEffect(() => {
    if (!isOpen) return;
    const overlay: OpenOverlay = { id: ++lastId, close: () => onCloseRef.current(), closedByBack: false };
    if (open.length === 0) window.addEventListener('popstate', handlePopState);
    open.push(overlay);
    // Same address, extra entry: the router sees no navigation
    window.history.pushState({ ...window.history.state, [OVERLAY_KEY]: overlay.id }, '');

    return () => {
      open.splice(open.indexOf(overlay), 1);
      if (open.length === 0) window.removeEventListener('popstate', handlePopState);
      // Closed from the UI (button, backdrop): remove its history entry so "back" is not wasted
      if (!overlay.closedByBack && currentDepth() === overlay.id) window.history.back();
    };
  }, [isOpen, onCloseRef]);
}
