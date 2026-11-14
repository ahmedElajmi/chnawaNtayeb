import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

/**
 * Server-side Firebase access: the Admin SDK reads and writes Firestore behind the
 * storage contract. No Firebase Auth is involved anywhere — accounts live in the
 * `users` + `auth` collections, sessions are signed by this server.
 *
 * Needs FIREBASE_SERVICE_ACCOUNT: the service-account JSON downloaded from
 * Firebase console → Project settings → Service accounts. It can be given as
 * raw JSON or base64-encoded JSON. Never commit this value.
 */

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
  // Same database as the old web client (firebase-applet-config.json), whether it is "(default)" or a named one
  return adminApp ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)') : null;
}

export function isFirebaseAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/**
 * Reads the team rights of an account (admins/{uid}): used by the data endpoints to
 * authorize an employee carrying a server session.
 */
export async function verifyEmployeeRights(
  uid: string
): Promise<{ can_publish?: unknown; can_manage?: unknown } | null> {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  const member = await getFirestore(adminApp).collection('admins').doc(uid).get();
  return member.exists ? (member.data() as Record<string, unknown>) : null;
}
