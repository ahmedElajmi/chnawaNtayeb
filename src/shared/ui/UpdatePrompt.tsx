import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

declare const __BUILD_ID__: string;

const SW_UPDATE_EVENT = 'chnowa:sw-update'; // dispatched by main.tsx
/** Remembers the build the user accepted, so a stale reload does not re-announce it. */
const ACCEPTED_KEY = 'chnowa_sw_accepted_build';
/** Safety net of the activation: past it, the banner offers a retry (never a blind reload). */
const ACTIVATION_TIMEOUT_MS = 30_000;

interface UpdateDetail {
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

/**
 * "New version available" banner: the user decides when to reload. The click sends
 * SKIP_WAITING to the waiting worker and the page reloads only once that worker actually
 * controls it (controllerchange, handled in main.tsx) — a stuck activation shows a retry
 * message, never a blind reload, and the previous version stays fully usable. The accepted
 * build is never announced again (a stale reload race); a later, different build still is.
 */
export const UpdatePrompt: React.FC = () => {
  const { t } = useLanguage();
  const [update, setUpdate] = useState<UpdateDetail | null>(null);
  const [phase, setPhase] = useState<'idle' | 'activating' | 'failed'>('idle');
  const acceptedRef = useRef<string | null>(sessionStorage.getItem(ACCEPTED_KEY));

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<UpdateDetail>).detail;
      if (!detail?.worker) return;
      if (acceptedRef.current && acceptedRef.current === detail.worker.scriptURL) return;
      // A different build than the accepted one (or none accepted): announce it
      acceptedRef.current = null;
      sessionStorage.removeItem(ACCEPTED_KEY);
      setPhase('idle');
      setUpdate(detail);
    };
    window.addEventListener(SW_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(SW_UPDATE_EVENT, onUpdate);
  }, []);

  // The accepted build now controls the page: clear the marker so a later version is announced
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (controller && acceptedRef.current && acceptedRef.current === controller.scriptURL) {
      acceptedRef.current = null;
      sessionStorage.removeItem(ACCEPTED_KEY);
    }
  }, []);

  const activate = useCallback((worker: ServiceWorker) => {
    acceptedRef.current = worker.scriptURL;
    sessionStorage.setItem(ACCEPTED_KEY, worker.scriptURL);
    setPhase('activating');
    // The new worker activates and claims the page, then controllerchange reloads (main.tsx).
    // The timeout never reloads: a stuck activation offers a retry instead.
    const fail = window.setTimeout(() => {
      setPhase((p) => (p === 'activating' ? 'failed' : p));
    }, ACTIVATION_TIMEOUT_MS);
    navigator.serviceWorker.addEventListener('controllerchange', () => window.clearTimeout(fail), { once: true });
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  if (!update) return null;

  const currentBuild = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '';
  const newBuild = update.newBuild || buildOf(update.worker.scriptURL);

  return (
    <div
      role="status"
      className="fixed bottom-24 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex flex-col gap-2 p-3 rounded-2xl bg-card border border-line shadow-xl animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <RefreshCw className={`w-5 h-5 text-brand-text shrink-0 ${phase === 'activating' ? 'animate-spin' : ''}`} />
        <span className="flex-1 text-xs font-semibold text-ink">{t.updateAvailable}</span>
      </div>
      {/* Build ids: a diagnostic aid while versions follow each other (hidden when unreadable) */}
      {currentBuild && newBuild && currentBuild !== newBuild && (
        <p className="text-[11px] text-ink-muted px-8">
          {t.updateBuilds.replace('{from}', currentBuild).replace('{to}', newBuild)}
        </p>
      )}
      {phase === 'failed' && <p className="text-[11px] text-ink-muted">{t.updateFailed}</p>}
      <div className="flex items-center justify-end gap-2">
        {phase === 'activating' && <span className="text-xs text-ink-muted">{t.updateActivating}</span>}
        {phase === 'failed' && (
          <button
            onClick={() => activate(update.worker)}
            className="px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong"
          >
            {t.updateRetry}
          </button>
        )}
        {phase !== 'failed' && (
          <button
            onClick={() => activate(update.worker)}
            disabled={phase === 'activating'}
            className="px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong disabled:opacity-60"
          >
            {t.updateReload}
          </button>
        )}
      </div>
    </div>
  );
};
