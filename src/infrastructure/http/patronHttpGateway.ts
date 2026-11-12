import type { PatronGateway } from '@/application';
import {
  ensurePatronCloudSession,
  getPatronToken,
  loginPatron,
  logoutPatron,
  verifyPatronSession,
} from '@/infrastructure/http/patronAuth';

/** Admin session checked by our server (/api/auth/*), with Firebase access for cloud edits. */
export const patronHttpGateway: PatronGateway = {
  login: loginPatron,
  hasStoredSession: () => Boolean(getPatronToken()),
  verifySession: () => verifyPatronSession(),
  connectCloud: () => ensurePatronCloudSession(),
  logout: () => logoutPatron(),
};
