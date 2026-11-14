import type { SuperAdminGateway } from '@/application';
import {
  ensureSuperAdminCloudSession,
  getSuperAdminToken,
  loginSuperAdmin,
  logoutSuperAdmin,
  verifySuperAdminSession,
} from '@/infrastructure/http/superAdminAuth';

/** Admin session checked by our server (/api/auth/*), with Firebase access for cloud edits. */
export const superAdminHttpGateway: SuperAdminGateway = {
  login: loginSuperAdmin,
  hasStoredSession: () => Boolean(getSuperAdminToken()),
  verifySession: () => verifySuperAdminSession(),
  connectCloud: () => ensureSuperAdminCloudSession(),
  logout: () => logoutSuperAdmin(),
};
