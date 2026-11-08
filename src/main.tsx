import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare const __BUILD_ID__: string;

export const SW_UPDATE_EVENT = 'chnowa:sw-update';

// Register the PWA Service Worker (production only: in dev it would cache Vite modules)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(__BUILD_ID__)}`)
      .then((reg) => {
        const announce = (worker: ServiceWorker | null) => {
          if (worker && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT, { detail: worker }));
          }
        };
        // A new version may already be waiting (downloaded on a previous visit)
        announce(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed') announce(installing);
          });
        });
        // Check for updates when the app comes back to the foreground
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // Once the new worker takes control, reload to run the new version
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
