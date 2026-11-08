import React, { useEffect } from 'react';
import { X, Sun, Moon, MonitorSmartphone, Palette, Globe } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Language } from '@/core/shared';
import { ThemeMode } from '@/core/preferences';
import { ThemePreviewCard } from '@/features/settings/ThemePreviewCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage, getThemeName } = useLanguage();
  const { themes, activeTheme, mode, resolvedMode, setMode, setThemeId, isPreviewing } = useTheme();

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

  const languages: { id: Language; label: string }[] = [
    { id: 'derja', label: 'Derja' },
    { id: 'fr', label: 'Français' },
    { id: 'ar', label: 'العربية' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-line text-ink shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-card border-b border-line">
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

        <div className="p-5 space-y-6">
          {/* Display mode */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t.settingsMode}</h3>
            <div
              role="radiogroup"
              aria-label={t.settingsMode}
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-line"
            >
              {modes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => setMode(id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
                    mode === id ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Themes */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <Palette className="w-3.5 h-3.5" />
              {t.settingsTheme}
            </h3>
            {isPreviewing && <p className="text-xs text-accent-text">Aperçu d'un thème en cours (backoffice).</p>}
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

          {/* Language */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <Globe className="w-3.5 h-3.5" />
              {t.settingsLanguage}
            </h3>
            <div
              role="radiogroup"
              aria-label={t.settingsLanguage}
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface border border-line"
            >
              {languages.map(({ id, label }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={language === id}
                  onClick={() => setLanguage(id)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${
                    language === id ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <p className="flex items-center justify-center gap-2 pt-2 text-xs text-ink-muted">
            <img src="/mark.png" alt="" width={47} height={20} className="h-5 w-auto" />
            <span>
              Chnowa Ntayeb? · <span className="font-semibold text-accent-text">by Chef Souhed</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
