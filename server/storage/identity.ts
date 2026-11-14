import type express from 'express';
import { readBearerToken, verifySessionToken, type SuperAdminConfig } from '../superAdminAuth';
import { verifyEmployeeToken } from '../firebaseAdmin';

/**
 * What a caller of the data endpoints may do. The super-admin session grants everything; an
 * employee proves themselves with their Firebase identity token, and their rights come
 * from the team record. A visitor without proof is read-only on the public collections.
 */
export interface Identity {
  /** The super-admin session itself */
  owner: boolean;
  canPublish: boolean;
  canManage: boolean;
}

const VISITOR: Identity = { owner: false, canPublish: false, canManage: false };

export async function resolveIdentity(req: express.Request, superAdminConfig: SuperAdminConfig): Promise<Identity> {
  const token = readBearerToken(req.headers.authorization);
  if (token && superAdminConfig.ok) {
    const session = verifySessionToken(token, superAdminConfig.secret);
    if (session) return { owner: true, canPublish: true, canManage: true };
  }
  if (token) {
    const employee = await verifyEmployeeToken(token);
    if (employee) return { owner: false, canPublish: employee.canPublish, canManage: employee.canManage };
  }
  return VISITOR;
}
