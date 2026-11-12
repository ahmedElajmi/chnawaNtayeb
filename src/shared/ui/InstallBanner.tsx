import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useInstallApp } from './PWAInstallButton';

/**
 * Invitation to install the app, at the top of the screen. Shown from the first page of a visit while
 * the app is not installed and the browser can install it; it stays across pages until closed.
 * Closing hides it for this visit only (it comes back next time); Settings › Application keeps the
 * install action available.
 */
export const InstallBanner: React.FC = () => {
  const { t } = useLanguage();
  const { canInstall, isSupported, start, guide } = useInstallApp();
  const [closed, setClosed] = useState(false);

  if (!canInstall) return null;

  return (
    <>
      {isSupported && !closed && (
        <div role="region" aria-label={t.pwaInstall} className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-brand/10 border border-brand/25 animate-fade-in">
            <span className="w-8 h-8 rounded-xl bg-brand text-on-brand flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="flex-1 min-w-0 text-xs sm:text-sm text-ink">{t.pwaInstallDesc}</p>
              <button
                onClick={start}
                className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong active:scale-95 transition"
              >
                {t.pwaInstall}
              </button>
            </div>
            <button
              onClick={() => setClosed(true)}
              aria-label={t.settingsClose}
              title={t.settingsClose}
              className="p-1 -m-1 rounded-lg text-ink-muted hover:text-ink hover:bg-brand/10 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {guide}
    </>
  );
};
