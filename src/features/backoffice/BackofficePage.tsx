import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { usePatron } from '@/app/ContainerContext';
import { useGoHome } from '@/app/homeNavigation';
import { PATHS, PATRON_PAGES } from '@/shared/paths';
import { PatronLoginModal } from './PatronLoginModal';
import { BackofficeLayout, SubPagesOutlet } from './shell/BackofficeLayout';
import { NotifyProvider } from './shell/NotifyContext';
import { RecipeEditorProvider } from './shell/RecipeEditorContext';
import { BACKOFFICE_SECTIONS } from './shell/sections';

/**
 * /patron/*: admin backoffice. Loaded on demand (most visitors never download it).
 * Without a session verified by the server, only the login form is shown.
 * Every page has its own address, declared by the section registry (shell/sections.tsx).
 */
export default function BackofficePage() {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { status, patron } = usePatron();

  if (status === 'checking') return null;
  if (status === 'signed-out')
    return <PatronLoginModal isOpen onClose={() => navigate(PATHS.home, { replace: true })} />;

  const logout = () => {
    patron.logout();
    goHome();
  };

  return (
    <NotifyProvider>
      <RecipeEditorProvider>
        <Routes>
          <Route element={<BackofficeLayout onLogout={logout} />}>
            {BACKOFFICE_SECTIONS.map((section) => {
              if (section.page === PATRON_PAGES.home) return <Route key="home" index element={section.element} />;
              if (!section.subPages) return <Route key={section.page} path={section.page} element={section.element} />;
              return (
                <Route key={section.page} path={section.page} element={<SubPagesOutlet section={section} />}>
                  <Route index element={<Navigate to={section.subPages[0].page} replace />} />
                  {section.subPages.map((sub) => (
                    <Route key={sub.page} path={sub.page} element={sub.element} />
                  ))}
                </Route>
              );
            })}
            <Route path="*" element={<Navigate to={PATHS.patron} replace />} />
          </Route>
        </Routes>
      </RecipeEditorProvider>
    </NotifyProvider>
  );
}
