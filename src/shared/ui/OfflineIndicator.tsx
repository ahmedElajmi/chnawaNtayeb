import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Statut réseau"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 flex items-center gap-2.5 rounded-xl bg-accent text-on-accent px-4 py-2.5 shadow-xl text-xs font-medium border border-white/20 animate-fade-in"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-white" />
      <span>{t.offlineNotice}</span>
    </aside>
  );
};
