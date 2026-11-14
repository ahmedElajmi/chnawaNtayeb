import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useContainer, useBackofficeSession, useTeam } from '@/app/ContainerContext';
import { useGoHome } from '@/app/homeNavigation';
import { PATHS, BACKOFFICE_PAGES } from '@/shared/paths';
import { BackofficeLoginModal } from './BackofficeLoginModal';
import { BackofficeLayout, SubPagesOutlet, useAllowedSections } from './shell/BackofficeLayout';
import { NotifyProvider } from './shell/NotifyContext';
import { RecipeEditorProvider } from './shell/RecipeEditorContext';
import { IngredientEditorProvider } from './shell/IngredientEditorContext';

/**
 * /super-admin/*: admin backoffice. Loaded on demand (most visitors never download it).
 * Without a session verified by the server, only the login form is shown, unless the account signed
 * in on the site is a member of the team (it then works with the rights of its role).
 * Every page has its own address, declared by the section registry (shell/sections.tsx).
 */
export default function BackofficePage() {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { status, backofficeSessionStore } = useBackofficeSession();
  const { userAuth } = useContainer();
  const { me, meStatus, team } = useTeam();
  // Pages the role cannot use have no route (their address leads back to /super-admin)
  const sections = useAllowedSections();
  // The account signed in on the site may be a member of the team
  useEffect(
    () => userAuth.subscribe((user) => void team.identify(user && !user.isAnonymous ? user.uid : null)),
    [userAuth, team]
  );

  if (status === 'checking' || (status === 'signed-out' && meStatus === 'checking')) return null;
  if (status === 'signed-out' && !me)
    return <BackofficeLoginModal isOpen onClose={() => navigate(PATHS.home, { replace: true })} />;

  const logout = () => {
    if (status === 'signed-in') backofficeSessionStore.logout();
    else void userAuth.logout();
    goHome();
  };

  return (
    <NotifyProvider>
      <RecipeEditorProvider>
        <IngredientEditorProvider>
          <Routes>
            <Route element={<BackofficeLayout onLogout={logout} />}>
              {sections.map((section) => {
                if (section.page === BACKOFFICE_PAGES.home) return <Route key="home" index element={section.element} />;
                if (!section.subPages)
                  return [
                    <Route key={section.page} path={section.page} element={section.element} />,
                    ...(section.routes ?? []).map((r) => (
                      <Route key={`${section.page}/${r.path}`} path={`${section.page}/${r.path}`} element={r.element} />
                    )),
                  ];
                return (
                  <Route key={section.page} path={section.page} element={<SubPagesOutlet section={section} />}>
                    <Route index element={<Navigate to={section.subPages[0].page} replace />} />
                    {section.subPages.map((sub) => (
                      <Route key={sub.page} path={sub.page} element={sub.element} />
                    ))}
                  </Route>
                );
              })}
              <Route path="*" element={<Navigate to={PATHS.backoffice} replace />} />
            </Route>
          </Routes>
        </IngredientEditorProvider>
      </RecipeEditorProvider>
    </NotifyProvider>
  );
}
