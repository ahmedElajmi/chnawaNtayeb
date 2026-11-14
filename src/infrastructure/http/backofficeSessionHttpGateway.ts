import type { BackofficeSessionGateway } from '@/application';
import {
  getBackofficeToken,
  loginBackoffice,
  logoutBackoffice,
  verifyBackofficeSession,
} from '@/infrastructure/http/backofficeAuth';

/** Admin session checked by our server: every data write carries this session. */
export const backofficeSessionHttpGateway: BackofficeSessionGateway = {
  login: loginBackoffice,
  hasStoredSession: () => Boolean(getBackofficeToken()),
  verifySession: () => verifyBackofficeSession(),
  connectCloud: async () => ((await verifyBackofficeSession()) ? 'connected' : 'local-only'),
  logout: () => logoutBackoffice(),
};
