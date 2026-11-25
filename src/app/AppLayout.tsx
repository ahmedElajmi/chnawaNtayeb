import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Settings, UserRound } from 'lucide-react';
import { Header } from '@/app/layout/Header';
import { BRAND } from '@/app/brand';
import { BrandMark } from '@/app/layout/BrandMark';
import { BottomNav } from '@/app/layout/BottomNav';
import { ProfilePanel, type ProfilePanelEntry } from '@/app/layout/ProfilePanel';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { UserAccountModal } from '@/features/account/UserAccountModal';
import { ModalShell } from '@/shared/ui/ModalShell';
import { UpdatePrompt } from '@/shared/ui/UpdatePrompt';
import { InstallBanner } from '@/shared/ui/InstallBanner';
import { SyncInviteBanner } from '@/shared/ui/SyncInviteBanner';
import { OfflineIndicator } from '@/shared/ui/OfflineIndicator';
import { ScrollToTopButton } from '@/shared/ui/ScrollToTopButton';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { isBackofficePath, PATHS } from '@/shared/paths';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { AppUser } from '@/application';
import { useContainer, useKitchen, useBackofficeSession } from './ContainerContext';
import { useGoHome, useHomeExitGuard } from './homeNavigation';

/** Frame shared by every screen: header, page content, footer, mobile tab bar and global dialogs. */
export function AppLayout() {
  const goHome = useGoHome();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const { fridge } = useKitchen();
  const { status: backofficeSessionStatus, backofficeSessionStore } = useBackofficeSession();
  const { userAuth, accountProfile, team, kitchenSync } = useContainer();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Compact profile panel (D-23): opened by the header avatar; state here because
  // the entries open the existing modals below
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    () => window.matchMedia?.('(min-width: 768px)').matches ?? true
  );
  const avatarRef = useRef<HTMLButtonElement>(null);
  const isBackoffice = isBackofficePath(pathname);
  const [showExitHint, setShowExitHint] = useState(false);
  const [year] = useState(() => new Date().getFullYear());
  const exitHintTimer = useRef<number | undefined>(undefined);

  useHomeExitGuard(() => {
    setShowExitHint(true);
    window.clearTimeout(exitHintTimer.current);
    exitHintTimer.current = window.setTimeout(() => setShowExitHint(false), 2000);
  }, pathname);

  // The profile and the team record of the signed-in account follow every sign-in / sign-out
  useEffect(
    () =>
      userAuth.subscribe((user) => {
        setCurrentUser(user);
        const uid = user && !user.isAnonymous ? user.uid : null;
        void accountProfile.identify(uid);
        void team.identify(uid);
      }),
    [userAuth, accountProfile, team]
  );

  // Each new screen starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Follow the viewport for the profile panel presentation (popover ↔ ModalShell)
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 768px)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setIsDesktopViewport(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isSuperAdmin = backofficeSessionStatus === 'signed-in';
  const backofficeLogout = () => {
    backofficeSessionStore.logout();
    if (isBackoffice) goHome();
  };

  useCloseOnBack(isUserModalOpen, () => setIsUserModalOpen(false));
  useCloseOnBack(isSettingsOpen, () => setIsSettingsOpen(false));
  useCloseOnBack(isProfileOpen, () => {
    setIsProfileOpen(false);
    avatarRef.current?.focus();
  });

  // Profile panel entries: existing destinations only (no invented screen).
  // A destination opens ON TOP of the panel (stacked overlays): the history
  // entries of useCloseOnBack then nest cleanly — closing the destination
  // returns to the open panel; dismissing the panel restores the avatar focus.
  const profilePanelEntries: ProfilePanelEntry[] = [
    {
      key: 'account',
      label: currentUser ? t.accountMine : t.accountSignIn,
      icon: <UserRound className="h-4.5 w-4.5" />,
      onSelect: () => setIsUserModalOpen(true),
    },
    {
      key: 'settings',
      label: t.settingsTitle,
      icon: <Settings className="h-4.5 w-4.5" />,
      onSelect: () => setIsSettingsOpen(true),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors pb-24 md:pb-12 text-ink">
      <Header
        currentUser={currentUser}
        isProfileOpen={isProfileOpen}
        onProfileToggle={() => setIsProfileOpen((open) => !open)}
        onProfileDismiss={() => {
          // while a destination modal covers the panel, dismissal (Escape on the
          // header or a click that reaches the document) must not unwind its history
          if (isUserModalOpen || isSettingsOpen) return;
          setIsProfileOpen(false);
          avatarRef.current?.focus();
        }}
        profilePanelEntries={profilePanelEntries}
        isDesktopViewport={isDesktopViewport}
        avatarRef={avatarRef}
        isBackofficeAuthenticated={isSuperAdmin}
        onBackofficeLogout={backofficeLogout}
      />
      {/* Install invitation (not in the backoffice); also available in Settings › Application */}
      {!isBackoffice && <InstallBanner />}
      {/* Account invitation once the device holds kitchen data (the sync is the value of an account) */}
      {!isBackoffice && (
        <SyncInviteBanner
          signedIn={currentUser !== null && !currentUser.isAnonymous}
          hasLocalData={kitchenSync.hasLocalData()}
          onOpenAccount={() => setIsUserModalOpen(true)}
        />
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        <Outlet />
      </main>
      {!isBackoffice && (
        <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-line text-xs text-ink-muted">
            <div className="flex items-center gap-2.5">
              <BrandMark brand={BRAND} markClass="sm:h-8" />
              <p className="leading-tight">{t.slogan}</p>
            </div>
            <p>
              <span className="font-semibold text-accent-text">{BRAND.signature}</span> · © {year} {BRAND.wordmark}
            </p>
          </div>
        </footer>
      )}
      <UserAccountModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} currentUser={currentUser} />{' '}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isBackofficeAuthenticated={isSuperAdmin}
        onBackofficeLogout={backofficeLogout}
      />
      {/* Profile panel on a phone: same composition in a ModalShell (never a second screen) */}
      {!isDesktopViewport && isProfileOpen && (
        <ModalShell
          mobile="center"
          onDismiss={() => {
            if (isUserModalOpen || isSettingsOpen) return;
            setIsProfileOpen(false);
            avatarRef.current?.focus();
          }}
        >
          <ProfilePanel id="profile-panel" label={t.profilePanelLabel} entries={profilePanelEntries} />
        </ModalShell>
      )}
      {/* "Press back again to exit" hint */}
      {showExitHint && (
        <div
          role="status"
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-ink text-surface text-xs font-semibold shadow-lg animate-fade-in"
        >
          {t.backAgainToExit}
        </div>
      )}
      {/* The fridge shows a sticky "see recipes" bar at the bottom once something is chosen */}
      <ScrollToTopButton label={t.scrollToTop} raised={pathname === PATHS.fridge && fridge.length > 0} />
      <UpdatePrompt />
      <OfflineIndicator />
      <BottomNav fridgeCount={fridge.length} />
    </div>
  );
}
