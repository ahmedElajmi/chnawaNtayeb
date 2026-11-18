import type { HostLifecycle } from '@/application';

/**
 * Browser implementation of the HostLifecycle port: the only place where the page's
 * timers and visibility events are touched for the application layer (lot 2.6.0, T1).
 *
 * `visibilitychange` covers the tab going to the background and coming back — including a
 * restore from the back/forward cache, where the browser fires `visibilitychange`
 * (visible) when the page resumes. `pagehide` is the moment the page is being parked or
 * unloaded: it always means hidden, so the pending work is flushed immediately.
 */
export function createBrowserHostLifecycle(): HostLifecycle {
  return {
    defer(fn: () => void, ms: number): () => void {
      const id = window.setTimeout(fn, ms);
      return () => window.clearTimeout(id);
    },
    subscribeVisibility(onHidden: () => void, onVisible: () => void): () => void {
      const handle = () => (document.visibilityState === 'hidden' ? onHidden() : onVisible());
      document.addEventListener('visibilitychange', handle);
      window.addEventListener('pagehide', onHidden);
      return () => {
        document.removeEventListener('visibilitychange', handle);
        window.removeEventListener('pagehide', onHidden);
      };
    },
  };
}
