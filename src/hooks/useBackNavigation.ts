import { useEffect, useRef } from 'react';

/**
 * Android / browser "back" handling for the PWA.
 *
 * Without this, the app has a single history entry, so the phone's back
 * button leaves (closes) the PWA immediately. We keep one "guard" entry on
 * top of the history: pressing back pops it, we handle the press in-app,
 * then push the guard again. Order of handling:
 *   1. close the top-most open overlay (modal, sheet...)
 *   2. otherwise let the app navigate back (previous tab)
 *   3. otherwise (home screen) show "press again to exit"; a second press
 *      within EXIT_WINDOW_MS really leaves the app.
 */

const EXIT_WINDOW_MS = 2000;
const GUARD_STATE = { chnowaGuard: true };

// Stack of close callbacks of the overlays currently open (last = top-most)
const overlayClosers: Array<{ close: () => void }> = [];

/** Registers an overlay so the back button closes it instead of leaving the screen. */
export function useCloseOnBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const entry = { close: () => onCloseRef.current() };
    overlayClosers.push(entry);
    return () => {
      const idx = overlayClosers.indexOf(entry);
      if (idx >= 0) overlayClosers.splice(idx, 1);
    };
  }, [isOpen]);
}

function pushGuard() {
  window.history.pushState(GUARD_STATE, '', window.location.href);
}

interface BackNavigationOptions {
  /** Called when no overlay is open. Return true if the app navigated back (e.g. previous tab). */
  onBack: () => boolean;
  /** Called on the first back press on the home screen. */
  onExitHint: () => void;
}

export function useBackNavigation({ onBack, onExitHint }: BackNavigationOptions) {
  const onBackRef = useRef(onBack);
  const onExitHintRef = useRef(onExitHint);
  onBackRef.current = onBack;
  onExitHintRef.current = onExitHint;

  useEffect(() => {
    let lastBackAt = 0;
    let exiting = false;

    if (!window.history.state?.chnowaGuard) pushGuard();

    const handlePopState = () => {
      if (exiting) return;
      // The guard entry was just popped: decide what "back" means right now
      const top = overlayClosers[overlayClosers.length - 1];
      if (top) {
        top.close();
        pushGuard();
        return;
      }
      if (onBackRef.current()) {
        pushGuard();
        return;
      }
      const now = Date.now();
      if (now - lastBackAt < EXIT_WINDOW_MS) {
        exiting = true;
        window.history.back(); // leave the app for real
        return;
      }
      lastBackAt = now;
      onExitHintRef.current();
      pushGuard();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
