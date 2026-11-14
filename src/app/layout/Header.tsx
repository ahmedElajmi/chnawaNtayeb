import React, { useState } from 'react';
import { NavLink, useMatch, useNavigate } from 'react-router';
import { Settings, Globe, User, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { languageInfo, SELECTOR_ORDER, type Language } from '@/core/shared';
import type { AppUser } from '@/application';
import { PATHS } from '@/shared/paths';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { useGoHome } from '@/app/homeNavigation';

interface HeaderProps {
  currentUser: AppUser | null;
  onOpenUserModal: () => void;
  isSuperAdminAuthenticated: boolean;
  onSuperAdminLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenUserModal,
  isSuperAdminAuthenticated,
  onSuperAdminLogout,
  onOpenSettings,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const recipesHref = useRecipesHref();
  const onSuggestions = useMatch(PATHS.suggestions) !== null;
  const goHome = useGoHome();
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) {
      setLogoClicks(0);
      navigate(PATHS.superAdmin);
    } else {
      goHome();
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-line transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Wordmark (with discrete 3-clicks superAdmin trigger) */}
        <button
          onClick={handleLogoClick}
          title={`Chnowa Ntayeb (${t.logoSuperAdminHint})`}
          className="flex items-center gap-2 sm:gap-2.5 text-left group min-w-0"
        >
          <img
            src="/mark.png"
            alt=""
            width={94}
            height={40}
            className="h-8 sm:h-10 w-auto shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-display text-[15px] min-[360px]:text-base sm:text-xl font-extrabold tracking-tight text-ink truncate">
              Chnowa Ntayeb
            </span>
            <span className="text-[10px] text-accent-text font-bold tracking-wide -mt-0.5 truncate">
              <span className="hidden sm:inline">شنوة نطيب؟ · </span>by Chef Souhed
            </span>
          </div>
        </button>

        {/* Zone 2: Public Navigation Links (Backoffice strictly removed) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {(
            [
              [PATHS.fridge, t.navFridge],
              [recipesHref(), t.navRecipes],
              [PATHS.planner, t.navWeekly],
              [PATHS.grocery, t.navGrocery],
            ] as const
          ).map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive || (label === t.navRecipes && onSuggestions)
                    ? 'text-brand-text font-bold border-b-2 border-brand-text'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* SuperAdmin badge and logout (from sm up; on phones they live in Settings so the brand stays readable) */}
          {isSuperAdminAuthenticated && (
            <div className="hidden sm:flex items-center gap-1.5">
              <NavLink
                to={PATHS.superAdmin}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition shadow-xs ${
                    isActive
                      ? 'bg-accent text-on-accent'
                      : 'bg-accent/10 text-accent-text dark:bg-accent/20 hover:bg-accent hover:text-on-accent'
                  }`
                }
                title={t.superAdminOpenBackoffice}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.superAdminBadge}</span>
              </NavLink>
              <button
                onClick={onSuperAdminLogout}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold px-1"
                title={t.superAdminLogout}
              >
                {t.superAdminQuit}
              </button>
            </div>
          )}

          {/* User Account / Profile Button */}
          <button
            onClick={onOpenUserModal}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
              currentUser
                ? 'bg-brand/10 border-brand/30 text-brand-text'
                : 'bg-card border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
            title={currentUser ? t.accountMine : t.accountSignIn}
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {currentUser
                ? currentUser.isAnonymous
                  ? t.accountGuest
                  : currentUser.email?.split('@')[0] || t.accountLabel
                : t.accountLabel}
            </span>
          </button>

          {/* Language Selector (desktop; also available in Settings) */}
          <div className="relative hidden sm:inline-flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2 pointer-events-none text-slate-500" />
            <select
              value={language}
              onChange={handleLangChange}
              aria-label={t.languageSelectLabel}
              className="appearance-none pl-7 pr-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            >
              {SELECTOR_ORDER.map((code) => (
                <option key={code} value={code}>
                  {languageInfo(code).selectorLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Settings (display, language, app install, superAdmin) */}
          <button
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            title={t.settingsTitle}
            className="p-2 rounded-lg text-ink-muted hover:text-brand-text hover:bg-brand/10 transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
      <div className="pattern-band" aria-hidden="true" />
    </header>
  );
};
