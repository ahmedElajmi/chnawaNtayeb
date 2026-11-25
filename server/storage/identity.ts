import type express from 'express';
import { readBearerToken, verifySessionToken, type BackofficeAuthConfig } from '../backofficeAuth';
import { verifyUserSessionToken } from '../auth/sessions';
import type { DataStore } from './types';

/**
 * Identity of a caller of the data endpoints. The super-admin session grants everything; an
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

/** The team rights of one employee account (the `admins` record), null when absent. */
export type EmployeeRights = { can_publish?: unknown; can_manage?: unknown } | null;

/** Port: how the server reads the rights of an employee. Implemented over the storage
 * contract (contractEmployeeRights); the storage technology never leaks past this type. */
export type EmployeeRightsVerifier = (uid: string) => Promise<EmployeeRights>;

/** Adapter of the rights port over the storage contract: reads `admins/{uid}` exactly like
 * the direct Firestore read it replaces — null when the storage is absent or the member
 * does not exist, the record otherwise. Storage errors propagate (the caller turns them
 * into endpoint failures, as before). */
export function contractEmployeeRights(store: DataStore | null): EmployeeRightsVerifier {
  return async (uid) => (store ? ((await store.get('admins', uid)) as EmployeeRights) : null);
}

/** A bound identity resolver: one route call, one Identity. */
export type IdentityResolver = (req: express.Request) => Promise<Identity>;

/** Binds the session checks with the rights port once, at startup (server/app.ts); the
 * routes receive the bound resolver and never see the rights source. */
export function createIdentityResolver(
  backofficeAuthConfig: BackofficeAuthConfig,
  verifyEmployeeRights: EmployeeRightsVerifier
): IdentityResolver {
  return async function resolveIdentity(req) {
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
  };
}
