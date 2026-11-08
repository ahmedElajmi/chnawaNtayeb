import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '@/shared/paths';
import { useLatest } from '@/shared/hooks/useLatest';

/**
 * "Back" behaviour of the app (kept from the single-page version):
 * - the home screen is always the bottom of the app history: going home goes back to it
 *   instead of stacking a new entry, and an inner page opened from a link has home below it;
 * - on the home screen, "back" first shows "press again to exit"; a second press within
 *   EXIT_WINDOW_MS really leaves the app.
 *
 * react-router stores the position of each entry in `history.state.idx` (0 = first entry
 * of the app), which is what these helpers rely on.
 */

const EXIT_WINDOW_MS = 2000;
const GUARD_KEY = 'chnowaExitGuard';

type HistoryState = { idx?: number; [GUARD_KEY]?: boolean } | null;
const historyState = () => window.history.state as HistoryState;
const isHome = () => window.location.pathname === PATHS.home;
const onHomeGuard = () => isHome() && Boolean(historyState()?.[GUARD_KEY]);
const pushGuard = () => window.history.pushState({ ...historyState(), [GUARD_KEY]: true }, '');

/** Called once before the router starts: puts the home screen below an inner page opened directly. */
export function installHomeBelowDeepLink(): void {
  const { pathname, search, hash } = window.location;
  if (pathname === PATHS.home || historyState()?.idx != null) return; // home, or a reload inside the app
  window.history.replaceState({ usr: null, key: 'home', idx: 0 }, '', PATHS.home);
  window.history.pushState({ usr: null, key: 'entry', idx: 1 }, '', pathname + search + hash);
}

/** Goes back to the home screen at the bottom of the history (like the old tab bar). */
export function useGoHome(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = historyState()?.idx ?? 0;
    if (idx <= 0) {
      if (!isHome()) navigate(PATHS.home, { replace: true });
      return;
    }
    // Safety net: if extra entries made us land elsewhere, show home anyway
    window.addEventListener('popstate', () => !isHome() && navigate(PATHS.home, { replace: true }), { once: true });
    window.history.go(-idx);
  }, [navigate]);
}

/**
 * On the home screen, the first "back" press calls `onExitHint` instead of leaving.
 * `pathname` is the current address, so the guard is re-installed after each navigation.
 */
export function useHomeExitGuard(onExitHint: () => void, pathname: string): void {
  const onExitHintRef = useLatest(onExitHint);
  const lastBackAt = useRef(0);
  const wasOnGuard = useRef(false);

  // Each time the home screen is shown, a guard entry sits on top of it
  useEffect(() => {
    if (isHome() && !historyState()?.[GUARD_KEY]) pushGuard();
    wasOnGuard.current = onHomeGuard();
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      const guardPopped = wasOnGuard.current && isHome() && !historyState()?.[GUARD_KEY];
      wasOnGuard.current = onHomeGuard();
      if (!guardPopped) return;

      const now = Date.now();
      if (now - lastBackAt.current < EXIT_WINDOW_MS) {
        window.removeEventListener('popstate', onPopState);
        window.history.go(-((historyState()?.idx ?? 0) + 1)); // leave the app for real
        return;
      }
      lastBackAt.current = now;
      onExitHintRef.current();
      pushGuard();
      wasOnGuard.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onExitHintRef]);
}
