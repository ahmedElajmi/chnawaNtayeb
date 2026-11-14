import type express from 'express';
import { readBearerToken, verifySessionToken, type BackofficeAuthConfig } from '../backofficeAuth';
import { verifyEmployeeRights } from '../firebaseAdmin';
import { verifyUserSessionToken } from '../auth/sessions';

/**
 * What a caller of the data endpoints may do. The super-admin session grants everything; an
 * employee proves themselves with their server session, and their rights come from the team
 * record. A visitor without proof is read-only on the public collections.
 */
export interface Identity {
  /** The super-admin session itself */
  owner: boolean;
  canPublish: boolean;
  canManage: boolean;
}

const VISITOR: Identity = { owner: false, canPublish: false, canManage: false };

export async function resolveIdentity(
  req: express.Request,
  backofficeAuthConfig: BackofficeAuthConfig
): Promise<Identity> {
  const token = readBearerToken(req.headers.authorization);
  if (token && backofficeAuthConfig.ok) {
    const session = verifySessionToken(token, backofficeAuthConfig.secret);
    if (session) return { owner: true, canPublish: true, canManage: true };
  }
  if (token) {
    // Employee accounts created through the storage contract carry a server session
    const userSession = verifyUserSessionToken(token, backofficeAuthConfig.ok ? backofficeAuthConfig.secret : '');
    if (userSession?.kind === 'employee') {
      const rights = await verifyEmployeeRights(userSession.sub);
      if (!rights) return VISITOR;
      return { owner: false, canPublish: rights.can_publish === true, canManage: rights.can_manage === true };
    }
    // Clients and guests write nothing through /api/data
  }
  return VISITOR;
}
