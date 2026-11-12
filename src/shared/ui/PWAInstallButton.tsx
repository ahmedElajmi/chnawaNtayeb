import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone, Monitor, WifiOff } from 'lucide-react';
import { usePWAInstall } from '@/shared/hooks/usePWAInstall';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { ModalShell } from './ModalShell';

/** Step-by-step guide, for browsers that cannot install with one tap (iOS Safari, Firefox...). */
export const InstallGuideModal: React.FC<{ isIOS: boolean; onClose: () => void }> = ({ isIOS, onClose }) => {
  const { t } = useLanguage();
  return (
    <ModalShell onDismiss={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 sm:p-6 shadow-2xl text-ink max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">{t.pwaInstall}</h3>
              <p className="text-xs text-slate-500">
                Chnowa Ntayeb (شنوة نطيب؟)
                <span className="block text-[11px] font-semibold text-accent-text">by Chef Souhed</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline & Performance Advantage Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
          <WifiOff className="w-4 h-4 shrink-0 text-brand-text mt-0.5" />
          <div>
            <p className="font-bold">Mode Hors-Ligne & Accès Instantané</p>
            <p className="mt-0.5 opacity-90">
              Le Service Worker dédié met en cache vos recettes et listes de courses pour fonctionner même sans 4G ou
              Wi-Fi.
            </p>
          </div>
        </div>

        {/* Steps according to device / platform */}
        <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          {isIOS ? (
            /* iOS Instructions */
            <div className="space-y-2.5">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Installation sur iPhone & iPad (Safari) :
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700">
                <Share className="w-5 h-5 text-brand-text shrink-0 mt-0.5" />
                <span>
                  1. Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (l'icône avec la flèche vers le
                  haut).
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700">
                <PlusSquare className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
                <span>
                  2. Faites défiler le menu et sélectionnez <strong>Sur l'écran d'accueil</strong>.
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  3. Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra sur votre écran !
                </span>
              </div>
            </div>
          ) : (
            /* Android / Desktop Instructions */
            <div className="space-y-2.5">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Installation sur Android & Ordinateur :
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700">
                <Smartphone className="w-5 h-5 text-brand-text shrink-0 mt-0.5" />
                <span>
                  <strong>Sur Android (Chrome) :</strong> Appuyez sur les trois points verticaux <strong>(⋮)</strong> en
                  haut à droite, puis sélectionnez <strong>« Installer l'application »</strong> ou{' '}
                  <strong>« Ajouter à l'écran d'accueil »</strong>.
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700">
                <Monitor className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
                <span>
                  <strong>Sur PC / Mac (Chrome / Edge) :</strong> Cliquez sur l'icône d'installation{' '}
                  <strong>(⊕)</strong> située à droite de la barre d'adresse web.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Close Button */}
        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-brand text-on-brand font-bold text-sm hover:bg-brand-strong transition-colors"
          >
            C'est compris !
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

/**
 * Install flow shared by the banner, Settings and the home page button:
 * the browser's own install prompt when it offers one, the guide otherwise.
 * `canInstall` is false once the app is installed (nothing is shown then).
 */
export function useInstallApp() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  useCloseOnBack(guideOpen, () => setGuideOpen(false));

  const start = async () => {
    if (isInstallable && (await install())) return;
    setGuideOpen(true);
  };

  return {
    canInstall: !isInstalled,
    /** The browser can really install from here (one-tap prompt, or iOS "Add to Home Screen") */
    isSupported: isInstallable || isIOS,
    start,
    guide: guideOpen ? <InstallGuideModal isIOS={isIOS} onClose={() => setGuideOpen(false)} /> : null,
  };
}

interface PWAInstallButtonProps {
  compact?: boolean;
  variant?: 'primary' | 'secondary';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false, variant = 'secondary' }) => {
  const { t } = useLanguage();
  const { canInstall, start, guide } = useInstallApp();

  // Already installed: nothing to show (no "installed" badge anywhere)
  if (!canInstall) return null;

  return (
    <>
      <button
        onClick={start}
        title={t.pwaInstall}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
          variant === 'primary'
            ? 'bg-brand text-on-brand hover:bg-brand-strong px-4 py-2.5 text-xs sm:text-sm shadow-brand/25'
            : 'bg-card border border-slate-300 dark:border-slate-700 text-ink hover:border-brand px-3.5 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="whitespace-nowrap">{compact ? 'Installer' : t.pwaInstall}</span>
      </button>
      {guide}
    </>
  );
};
