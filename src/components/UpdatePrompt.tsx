import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SW_UPDATE_EVENT = 'chnowa:sw-update'; // dispatched by main.tsx

/** "New version available" banner: activates the waiting service worker on demand. */
export const UpdatePrompt: React.FC = () => {
  const { t } = useLanguage();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => setWaitingWorker((e as CustomEvent<ServiceWorker>).detail);
    window.addEventListener(SW_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(SW_UPDATE_EVENT, onUpdate);
  }, []);

  if (!waitingWorker) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex items-center gap-3 p-3 rounded-2xl bg-card border border-line shadow-xl animate-fade-in"
    >
      <RefreshCw className="w-5 h-5 text-brand-text shrink-0" />
      <span className="flex-1 text-xs font-semibold text-ink">{t.updateAvailable}</span>
      <button
        onClick={() => {
          setWaitingWorker(null);
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          // main.tsx reloads on "controllerchange"; reload anyway if the switch does not happen
          window.setTimeout(() => window.location.reload(), 3000);
        }}
        className="px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong"
      >
        {t.updateReload}
      </button>
    </div>
  );
};
