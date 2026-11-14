import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

/**
 * Bridges the /super-admin login with Firebase:
 * after a successful super-admin login, the server mints a Firebase custom token
 * carrying the `superAdmin: true` claim. The browser signs in with it, and the
 * Firestore rules (isAdmin) accept writes from that identity.
 *
 * Needs FIREBASE_SERVICE_ACCOUNT: the service-account JSON downloaded from
 * Firebase console → Project settings → Service accounts. It can be given as
 * raw JSON or base64-encoded JSON. Never commit this value.
 */

export const SUPER_ADMIN_FIREBASE_UID = 'super-admin';

let app: App | null | undefined;

function loadServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getAdminApp(): App | null {
  if (app !== undefined) return app;
  const account = loadServiceAccount();
  if (!account) {
    app = null;
    return app;
  }
  app = getApps()[0] ?? initializeApp({ credential: cert(account as any) });
  return app;
}

/** Firestore with admin rights, or null when the service account is not configured. */
export function getAdminFirestore(): Firestore | null {
  const adminApp = getAdminApp();
  // Same database as the web client (firebase-applet-config.json), whether it is "(default)" or a named one
  return adminApp ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)') : null;
}

export function isFirebaseAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/** Returns a Firebase custom token for the super-admin, or null when the service account is not configured. */
export async function createSuperAdminFirebaseToken(): Promise<string | null> {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  return getAuth(adminApp).createCustomToken(SUPER_ADMIN_FIREBASE_UID, { superAdmin: true });
}

export interface EmployeeRights {
  uid: string;
  canPublish: boolean;
  canManage: boolean;
}

/**
 * Verifies an employee's Firebase identity token (the browser still signs in with Firebase
 * Auth during the transition) and reads their rights from the team record.
 * Null when the token is invalid, not an employee, or when Firebase is not configured.
 */
export async function verifyEmployeeToken(idToken: string): Promise<EmployeeRights | null> {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    if (decoded.superAdmin == true) return null; // the superAdmin session is not an employee token
    const uid = decoded.uid;
    const member = await getFirestore(adminApp).collection('admins').doc(uid).get();
    const rights = member.data();
    if (!rights) return null;
    return {
      uid,
      canPublish: rights.can_publish === true,
      canManage: rights.can_manage === true,
    };
  } catch {
    return null;
  }
}

export type CreateUserResult =
  | { ok: true; uid: string; temporaryPassword: string }
  | { ok: false; reason: 'not-configured' | 'email-in-use' | 'invalid-email' | 'unknown' };

/**
 * Creates an employee account with a temporary password (the employee changes it at first
 * sign-in). Done server-side only: the browser never creates an account it could promote.
 */
export async function createEmployeeAccount(email: string, displayName: string): Promise<CreateUserResult> {
  const adminApp = getAdminApp();
  if (!adminApp) return { ok: false, reason: 'not-configured' };
  // 4 random groups of 3 characters: strong enough for a first login, readable over the phone
  const temporaryPassword = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 5)).join('-');
  try {
    const user = await getAuth(adminApp).createUser({
      email,
      password: temporaryPassword,
      displayName: displayName.slice(0, 60),
      emailVerified: false,
    });
    return { ok: true, uid: user.uid, temporaryPassword };
  } catch (err) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? '';
    if (code === 'auth/email-already-exists') return { ok: false, reason: 'email-in-use' };
    if (code === 'auth/invalid-email') return { ok: false, reason: 'invalid-email' };
    console.error('[accounts] createUser failed:', err);
    return { ok: false, reason: 'unknown' };
  }
}
