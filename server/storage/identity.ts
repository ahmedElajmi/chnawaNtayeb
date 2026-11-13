import type express from 'express';
import { readBearerToken, verifySessionToken, type AdminConfig } from '../patronAuth';
import { verifyEmployeeToken } from '../firebaseAdmin';

/**
 * What a caller of the data endpoints may do. The patron session grants everything; an
 * employee proves themselves with their Firebase identity token, and their rights come
 * from the team record. A visitor without proof is read-only on the public collections.
 */
export interface Identity {
  /** The patron session itself */
  owner: boolean;
  canPublish: boolean;
  canManage: boolean;
}

const VISITOR: Identity = { owner: false, canPublish: false, canManage: false };

export async function resolveIdentity(req: express.Request, adminConfig: AdminConfig): Promise<Identity> {
  const token = readBearerToken(req.headers.authorization);
  if (token && adminConfig.ok) {
    const session = verifySessionToken(token, adminConfig.secret);
    if (session) return { owner: true, canPublish: true, canManage: true };
  }
  if (token) {
    const employee = await verifyEmployeeToken(token);
    if (employee) return { owner: false, canPublish: employee.canPublish, canManage: employee.canManage };
  }
  return VISITOR;
}
