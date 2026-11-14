import type { BackofficeSessionGateway } from '@/application';
import {
  ensureBackofficeCloudSession,
  getBackofficeToken,
  loginBackoffice,
  logoutBackoffice,
  verifyBackofficeSession,
} from '@/infrastructure/http/backofficeAuth';

/** Admin session checked by our server (/api/auth/*), with Firebase access for cloud edits. */
export const backofficeSessionHttpGateway: BackofficeSessionGateway = {
  login: loginBackoffice,
  hasStoredSession: () => Boolean(getBackofficeToken()),
  verifySession: () => verifyBackofficeSession(),
  connectCloud: () => ensureBackofficeCloudSession(),
  logout: () => logoutBackoffice(),
};
