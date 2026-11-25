import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { Globe, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { BRAND } from '@/app/brand';
import { BrandMark } from '@/app/layout/BrandMark';
import { PillTab } from '@/app/layout/PillTab';
import { ProfilePanel, type ProfilePanelEntry } from '@/app/layout/ProfilePanel';
import { AvatarButton } from '@/shared/ui/AvatarButton';
import { languageInfo, SELECTOR_ORDER, type Language } from '@/core/shared';
import type { AppUser } from '@/application';
import { PATHS } from '@/shared/paths';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { useGoHome } from '@/app/homeNavigation';

interface HeaderProps {
  currentUser: AppUser | null;
  /** Compact profile panel (D-23); state lives with the layout, entries are existing destinations */
  isProfileOpen: boolean;
  onProfileToggle: () => void;
  /** Escape / click outside (desktop) or ModalShell dismiss (mobile): the layout restores the focus */
  onProfileDismiss: () => void;
  profilePanelEntries: ProfilePanelEntry[];
  /** Desktop presents the panel as a popover; mobile presents it in a ModalShell */
  isDesktopViewport: boolean;
  /** Shared ref so the layout can restore the focus to the avatar when the panel closes */
  avatarRef: React.RefObject<HTMLButtonElement | null>;
  isBackofficeAuthenticated: boolean;
  onBackofficeLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isProfileOpen,
  onProfileToggle,
  onProfileDismiss,
  profilePanelEntries,
  isDesktopViewport,
  avatarRef,
  isBackofficeAuthenticated,
  onBackofficeLogout,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const recipesHref = useRecipesHref();
  const goHome = useGoHome();
  const [logoClicks, setLogoClicks] = useState(0);
  const profileAreaRef = useRef<HTMLDivElement>(null);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) {
      // Discreet staff channel: three clicks on the brand open the backoffice (never advertised)
      setLogoClicks(0);
      navigate(PATHS.backoffice);
    } else {
      goHome();
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  // Desktop popover behaviors: Escape and click outside close the panel
  // (the mobile presentation gets them from ModalShell).
  useEffect(() => {
    if (!isProfileOpen || !isDesktopViewport) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onProfileDismiss();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (profileAreaRef.current && e.target instanceof Node && !profileAreaRef.current.contains(e.target)) {
        onProfileDismiss();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [isProfileOpen, isDesktopViewport, onProfileDismiss]);

  const avatarInitial = currentUser && !currentUser.isAnonymous ? (currentUser.email?.[0] ?? undefined) : undefined;

  const desktopPills = (
    [
      [PATHS.fridge, t.navFridge, pathname === PATHS.fridge],
      [recipesHref(), t.navRecipes, pathname === PATHS.recipes || pathname === PATHS.suggestions],
      [PATHS.planner, t.navWeekly, pathname === PATHS.planner],
      [PATHS.grocery, t.navGrocery, pathname === PATHS.grocery],
    ] as const
  ).map(([to, label, active]) => <PillTab key={to} href={to} label={label} active={active} />);

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-line transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Wordmark (3-click staff trigger, never advertised to clients) */}
        <BrandMark brand={BRAND} tagline={BRAND.tagline} onClick={handleLogoClick} />

        {/* Zone 2: Public Navigation Pills (Backoffice strictly removed) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">{desktopPills}</nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* SuperAdmin badge and logout (from sm up; on phones they live in Settings so the brand stays readable) */}
          {isBackofficeAuthenticated && (
            <div className="hidden sm:flex items-center gap-1">
              <NavLink
                to={PATHS.backoffice}
                title={t.backofficeOpen}
                className="inline-flex min-h-[44px] items-center rounded-lg outline-none focus-visible:ring-2 ring-focus-ring"
              >
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition shadow-xs bg-accent/10 text-accent-text dark:bg-accent/20 hover:bg-accent hover:text-on-accent">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.backofficeBadge}</span>
                </span>
              </NavLink>
              <button
                onClick={onBackofficeLogout}
                className="inline-flex min-h-[44px] items-center px-2 text-[11px] font-semibold text-danger-text hover:text-danger-strong transition-colors outline-none focus-visible:ring-2 ring-focus-ring rounded-lg"
                title={t.backofficeLogout}
              >
                {t.backofficeQuit}
              </button>
            </div>
          )}

          {/* Language Selector (desktop; also available in Settings) */}
          <div className="relative hidden sm:inline-flex h-11 items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2 pointer-events-none text-ink-muted" aria-hidden="true" />
            <select
              value={language}
              onChange={handleLangChange}
              aria-label={t.languageSelectLabel}
              className="h-11 appearance-none pl-7 pr-3.5 text-xs font-semibold rounded-lg bg-card border border-line hover:border-line-strong text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring cursor-pointer"
            >
              {SELECTOR_ORDER.map((code) => (
                <option key={code} value={code}>
                  {languageInfo(code).selectorLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar → compact profile panel (D-23): replaces the account button and the settings gear */}
          <div ref={profileAreaRef} className="relative flex items-center">
            <AvatarButton
              buttonRef={avatarRef}
              label={t.avatarLabel}
              src={undefined}
              initial={avatarInitial}
              isGuest={currentUser?.isAnonymous ?? false}
              expanded={isProfileOpen}
              panelId="profile-panel"
              onClick={onProfileToggle}
            />
            {isProfileOpen && isDesktopViewport && (
              <ProfilePanel
                id="profile-panel"
                label={t.profilePanelLabel}
                entries={profilePanelEntries}
                className="absolute end-0 top-full mt-2 z-50 w-56"
              />
            )}
          </div>
        </div>
      </div>
      <div className="pattern-band" aria-hidden="true" />
    </header>
  );
};
