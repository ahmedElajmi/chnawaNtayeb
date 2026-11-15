import { createRoot } from 'react-dom/client';
import App from '@/app/App.tsx';
import { nextUpdateCheckDelayMs } from '@/core/update';
import { installHomeBelowDeepLink } from './app/homeNavigation';
import './index.css';

declare const __BUILD_ID__: string;

export const SW_UPDATE_EVENT = 'chnowa:sw-update';

/** Detail of the update event: the latest waiting worker and the build it carries. */
export interface SwUpdateDetail {
  worker: ServiceWorker;
  /** Build id of the new version (from the worker's script URL), '' when unreadable. */
  newBuild: string;
}

/** The build id embedded in a worker's script URL (`/sw.js?v=<build>`), '' when unreadable. */
const buildOf = (scriptURL: string): string => {
  try {
    return new URL(scriptURL, window.location.href).searchParams.get('v') ?? '';
  } catch {
    return '';
  }
};

// Register the PWA Service Worker (production only: in dev it would cache Vite modules)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(__BUILD_ID__)}`)
      .then((reg) => {
        // The event always carries the LATEST waiting worker: a newer install replaces
        // the previous one, the banner must never point at a superseded worker
        const announceLatestWaiting = () => {
          const worker = reg.waiting;
          if (!worker || !navigator.serviceWorker.controller) return;
          const detail: SwUpdateDetail = { worker, newBuild: buildOf(worker.scriptURL) };
          window.dispatchEvent(new CustomEvent<SwUpdateDetail>(SW_UPDATE_EVENT, { detail }));
        };

        // A new version may already be waiting (downloaded on a previous visit)
        announceLatestWaiting();
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            // installed: this one (or a newer one) now waits; redundant: it was superseded
            // by a newer install — in both cases re-read the current waiting worker
            if (installing.state === 'installed' || installing.state === 'redundant') {
              announceLatestWaiting();
            }
          });
        });

        // Single scheduler of the update checks (opening, foreground return and back-online
        // checks go through the same path): immediate when triggered by an event, otherwise
        // the adaptive rhythm (tight while versions are found, relaxed up to one hour),
        // and never in the background (suspended timers would only drift the schedule).
        let roundsWithoutUpdate = 0;
        let timer: number | undefined;
        let checking = false;

        const runCheck = (): Promise<void> =>
          reg.update().then(
            () => {
              // Only a genuinely waiting worker proves a version was found
              roundsWithoutUpdate = reg.waiting ? 0 : roundsWithoutUpdate + 1;
            },
            () => undefined // a failed check just waits for the next scheduled one
          );

        const planNext = (): void => {
          if (timer !== undefined) window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            timer = undefined;
            if (document.visibilityState !== 'visible') {
              planNext(); // re-arm: the foreground and online events cover the wake-up
              return;
            }
            if (checking) return; // an immediate check is already running
            checking = true;
            void runCheck().finally(() => {
              checking = false;
              planNext();
            });
          }, nextUpdateCheckDelayMs(roundsWithoutUpdate));
        };

        const checkNow = (): void => {
          if (document.visibilityState !== 'visible' || checking) return;
          checking = true;
          void runCheck().finally(() => {
            checking = false;
            planNext();
          });
        };

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkNow();
        });
        window.addEventListener('online', checkNow);
        planNext();
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // Reload ONLY when the new worker actually controls the page (after the user accepted
    // the update): one reload per page, the previous version stays usable until then.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

installHomeBelowDeepLink();
createRoot(document.getElementById('root')!).render(<App />);
