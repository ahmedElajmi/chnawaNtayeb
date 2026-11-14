import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  X,
  Sun,
  Moon,
  MonitorSmartphone,
  Palette,
  Globe,
  ShieldCheck,
  LogOut,
  Download,
  Smartphone,
} from 'lucide-react';
import { PATHS } from '@/shared/paths';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { languageInfo, SELECTOR_ORDER, type Language } from '@/core/shared';
import { ThemeMode } from '@/core/preferences';
import { ThemePreviewCard } from '@/features/settings/ThemePreviewCard';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useInstallApp } from '@/shared/ui/PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When the super-admin is signed in: shortcut to the backoffice and logout (the phone header has no room for them). */
  isSuperAdminAuthenticated?: boolean;
  onSuperAdminLogout?: () => void;
}

type SettingsTab = 'display' | 'language' | 'app';

const SEGMENTED = 'grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-line';
const segment = (active: boolean) =>
  `flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
    active ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-muted hover:text-ink'
  }`;
const HEADING = 'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted';

/** Settings, in short tabs: Display (mode, theme), Language, Application (install, super-admin). */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSuperAdminAuthenticated = false,
  onSuperAdminLogout,
}) => {
  const { t, language, setLanguage, getThemeName } = useLanguage();
  const { themes, activeTheme, mode, resolvedMode, setMode, setThemeId, isPreviewing } = useTheme();
  const install = useInstallApp();
  const [tab, setTab] = useState<SettingsTab>('display');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modes: { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'light', label: t.modeLight, icon: Sun },
    { id: 'dark', label: t.modeDark, icon: Moon },
    { id: 'system', label: t.modeSystem, icon: MonitorSmartphone },
  ];

  const languages: { id: Language; label: string }[] = SELECTOR_ORDER.map((id) => ({
    id,
    label: languageInfo(id).selectorLabel,
  }));

  // The Application tab only exists when it has something to offer (nothing once installed, unless super-admin)
  const hasAppTab = install.canInstall || isSuperAdminAuthenticated;
  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'display', label: t.settingsTabDisplay, icon: Palette },
    { id: 'language', label: t.settingsLanguage, icon: Globe },
    ...(hasAppTab ? [{ id: 'app' as const, label: t.settingsTabApp, icon: Smartphone }] : []),
  ];
  const current = tab === 'app' && !hasAppTab ? 'display' : tab;

  return (
    <>
      <ModalShell mobile="bottom" onDismiss={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-line text-ink shadow-2xl"
        >
          <div className="sticky top-0 z-10 bg-card border-b border-line">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 id="settings-title" className="font-display text-lg font-extrabold">
                {t.settingsTitle}
              </h2>
              <button
                onClick={onClose}
                aria-label={t.settingsClose}
                className="p-1.5 rounded-lg text-ink-muted hover:bg-brand/10 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div role="tablist" aria-label={t.settingsTitle} className="flex px-3">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  id={`settings-tab-${id}`}
                  aria-selected={current === id}
                  aria-controls="settings-panel"
                  onClick={() => setTab(id)}
                  className={`flex-auto min-w-0 inline-flex items-center justify-center gap-1.5 px-1.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                    current === id ? 'border-brand text-brand-text' : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            id="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${current}`}
            className="p-5 space-y-6"
          >
            {current === 'display' && (
              <>
                <section className="space-y-2">
                  <h3 className={HEADING}>{t.settingsMode}</h3>
                  <div role="radiogroup" aria-label={t.settingsMode} className={SEGMENTED}>
                    {modes.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        role="radio"
                        aria-checked={mode === id}
                        onClick={() => setMode(id)}
                        className={segment(mode === id)}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className={HEADING}>{t.settingsTheme}</h3>
                  {isPreviewing && <p className="text-xs text-accent-text">{t.themePreviewNote}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map((theme) => (
                      <ThemePreviewCard
                        key={theme.id}
                        theme={theme}
                        name={getThemeName(theme)}
                        dark={resolvedMode === 'dark'}
                        isActive={activeTheme.id === theme.id}
                        activeLabel={t.themeActive}
                        onSelect={() => setThemeId(theme.id)}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}

            {current === 'language' && (
              <section className="space-y-2">
                <h3 className={HEADING}>{t.settingsLanguage}</h3>
                <div role="radiogroup" aria-label={t.settingsLanguage} className="grid grid-cols-1 gap-2">
                  {languages.map(({ id, label }) => (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={language === id}
                      onClick={() => setLanguage(id)}
                      className={`py-3 rounded-xl text-sm font-semibold border transition ${
                        language === id
                          ? 'bg-brand text-on-brand border-brand shadow-xs'
                          : 'bg-surface border-line text-ink hover:border-brand/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {current === 'app' && (
              <>
                {install.canInstall && (
                  <section className="space-y-2">
                    <h3 className={HEADING}>{t.pwaInstall}</h3>
                    <p className="text-sm text-ink-muted">{t.pwaInstallDesc}</p>
                    <button
                      onClick={install.start}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-on-brand text-sm font-bold hover:bg-brand-strong transition"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      {t.pwaInstall}
                    </button>
                  </section>
                )}

                {/* SuperAdmin session. On phones the header has no room for these buttons. */}
                {isSuperAdminAuthenticated && (
                  <section className="space-y-2">
                    <h3 className={HEADING}>{t.superAdminBadge}</h3>
                    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                      <Link
                        to={PATHS.superAdmin}
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold bg-accent text-on-accent hover:bg-accent-strong transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {t.navBackoffice}
                      </Link>
                      <button
                        onClick={() => {
                          onClose();
                          onSuperAdminLogout?.();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border border-line text-ink-muted hover:text-rose-600 hover:border-rose-300 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.superAdminExitMode}
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}

            <p className="flex items-center justify-center gap-2 pt-2 text-xs text-ink-muted">
              <img src="/mark.png" alt="" width={47} height={20} className="h-5 w-auto" />
              <span>
                Chnowa Ntayeb? · <span className="font-semibold text-accent-text">by Chef Souhed</span>
              </span>
            </p>
          </div>
        </div>
      </ModalShell>
      {install.guide}
    </>
  );
};
