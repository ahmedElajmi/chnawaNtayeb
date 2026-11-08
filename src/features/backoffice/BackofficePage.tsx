import { useNavigate } from 'react-router';
import { usePatron } from '@/app/ContainerContext';
import { useGoHome } from '@/app/homeNavigation';
import { PATHS } from '@/shared/paths';
import { BackofficeView } from './BackofficeView';
import { PatronLoginModal } from './PatronLoginModal';

/**
 * /patron: admin backoffice. Loaded on demand (most visitors never download it).
 * Without a session verified by the server, only the login form is shown.
 */
export default function BackofficePage() {
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { status, patron } = usePatron();

  if (status === 'checking') return null;
  if (status === 'signed-out')
    return <PatronLoginModal isOpen onClose={() => navigate(PATHS.home, { replace: true })} />;

  return (
    <BackofficeView
      onLogout={() => {
        patron.logout();
        goHome();
      }}
    />
  );
}
