import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Header } from '@/app/layout/Header';
import { BottomNav } from '@/app/layout/BottomNav';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { UserAccountModal } from '@/features/account/UserAccountModal';
import { UpdatePrompt } from '@/shared/ui/UpdatePrompt';
import { InstallBanner } from '@/shared/ui/InstallBanner';
import { OfflineIndicator } from '@/shared/ui/OfflineIndicator';
import { ScrollToTopButton } from '@/shared/ui/ScrollToTopButton';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { isPatronPath, PATHS } from '@/shared/paths';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { AppUser } from '@/application';
import { useContainer, useKitchen, usePatron } from './ContainerContext';
import { useGoHome, useHomeExitGuard } from './homeNavigation';

/** Frame shared by every screen: header, page content, footer, mobile tab bar and global dialogs. */
export function AppLayout() {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const { fridge } = useKitchen();
  const { status: patronStatus, patron } = usePatron();
  const { userAuth } = useContainer();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isBackoffice = isPatronPath(pathname);
  const [showExitHint, setShowExitHint] = useState(false);
  const [year] = useState(() => new Date().getFullYear());
  const exitHintTimer = useRef<number | undefined>(undefined);

  useHomeExitGuard(() => {
    setShowExitHint(true);
    window.clearTimeout(exitHintTimer.current);
    exitHintTimer.current = window.setTimeout(() => setShowExitHint(false), 2000);
  }, pathname);

  useEffect(() => userAuth.subscribe(setCurrentUser), [userAuth]);

  // Each new screen starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const isPatron = patronStatus === 'signed-in';
  const patronLogout = () => {
    patron.logout();
    if (isBackoffice) goHome();
  };

  useCloseOnBack(isUserModalOpen, () => setIsUserModalOpen(false));
  useCloseOnBack(isSettingsOpen, () => setIsSettingsOpen(false));

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors pb-24 md:pb-12 text-ink">
      <Header
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        isPatronAuthenticated={isPatron}
        onPatronLogout={patronLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Install invitation (not in the backoffice); also available in Settings › Application */}
      {!isBackoffice && <InstallBanner />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        <Outlet />
      </main>

      {!isBackoffice && (
        <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-line text-xs text-ink-muted">
            <div className="flex items-center gap-2.5">
              <img src="/mark.png" alt="" width={75} height={32} className="h-8 w-auto" />
              <div className="leading-tight">
                <p className="font-display font-extrabold text-sm text-ink">Chnowa Ntayeb?</p>
                <p>Elli 3andek fel frigo, na3mlou bih makla !</p>
              </div>
            </div>
            <p>
              <span className="font-semibold text-accent-text">by Chef Souhed</span> · © {year} Chnowa Ntayeb
            </p>
          </div>
        </footer>
      )}

      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onOpenPatronLogin={() => {
          setIsUserModalOpen(false);
          navigate(PATHS.patron);
        }}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isPatronAuthenticated={isPatron}
        onPatronLogout={patronLogout}
      />
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
