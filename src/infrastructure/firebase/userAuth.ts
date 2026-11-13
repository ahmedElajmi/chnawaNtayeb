import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { AccountProfileRepository, AppUser, UserAuthError, UserAuthGateway } from '@/application';
import { normalizePhone, resolveUserProfile, type RegistrationInput, type UserProfile } from '@/core/accounts';
import { auth, db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

export const MIN_PASSWORD_LENGTH = 8;

/** Turns Firebase error codes into the domain codes the interface translates. */
export function authErrorCode(err: unknown): UserAuthError {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-credentials':
    case 'auth/user-not-found':
      return 'invalid-credentials';
    case 'auth/email-already-in-use':
      return 'email-in-use';
    case 'auth/weak-password':
      return 'weak-password';
    case 'auth/invalid-email':
      return 'invalid-email';
    case 'auth/too-many-requests':
      return 'too-many-attempts';
    case 'auth/network-request-failed':
      return 'network';
    case 'auth/operation-not-allowed':
      return 'disabled';
    default:
      return 'unknown';
  }
}

/**
 * The whole profile document, written in one go (no merge: a cleared field disappears).
 * Field names follow the existing users documents; the rules whitelist them.
 */
function toDocument(profile: UserProfile): Record<string, unknown> {
  const document: Record<string, unknown> = {
    uid: profile.uid,
    type: profile.type,
    isAnonymous: profile.isAnonymous,
  };
  if (profile.email) document.email = profile.email;
  if (profile.displayName) document.displayName = profile.displayName;
  if (profile.phone) document.phone = profile.phone;
  if (profile.address) document.address = profile.address;
  if (profile.preferredLanguage) document.preferredLanguage = profile.preferredLanguage;
  if (profile.favorites) document.favorites = profile.favorites;
  if (profile.savedFridge) document.savedFridge = profile.savedFridge;
  if (profile.lastLogin) document.lastLogin = profile.lastLogin;
  return document;
}

function profileFor(user: FirebaseUser, isAnonymous: boolean, input?: RegistrationInput): UserProfile {
  return {
    uid: user.uid,
    type: 'client',
    ...(user.email ? { email: user.email } : {}),
    displayName:
      input?.displayName?.trim() || (isAnonymous ? 'Invité Gourmand' : (user.email || '').split('@')[0].slice(0, 60)),
    ...(input?.phone ? { phone: normalizePhone(input.phone) ?? undefined } : {}),
    ...(input?.address ? { address: input.address } : {}),
    ...(input?.preferredLanguage ? { preferredLanguage: input.preferredLanguage } : {}),
    isAnonymous,
    lastLogin: new Date().toISOString(),
  };
}

/** Signs the profile in on every sign-in: lastLogin follows the visits, favorites survive (merge). */
async function syncLoginProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

export async function loginAsGuest(): Promise<FirebaseUser> {
  const cred = await signInAnonymously(auth);
  await syncLoginProfile(profileFor(cred.user, true));
  return cred.user;
}

/** Signs in an existing account only. A wrong password never creates an account. */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  await syncLoginProfile(profileFor(cred.user, false));
  return cred.user;
}

/** Explicit account creation (separate button in the UI): profile fields are part of the form. */
export async function registerAccount(input: RegistrationInput): Promise<FirebaseUser> {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
  }
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await syncLoginProfile(profileFor(cred.user, false, input));
  return cred.user;
}

/** Changes the password, re-checking the current one (re-authentication first). */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw Object.assign(new Error('no-user'), { code: 'auth/user-not-found' });
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
  }
  await updatePassword(user, newPassword);
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

const toAppUser = (user: FirebaseUser): AppUser => ({
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
  isAnonymous: user.isAnonymous,
});

/** Visitor accounts with Firebase Authentication (port UserAuthGateway). */
export const firebaseUserAuth: UserAuthGateway = {
  minPasswordLength: MIN_PASSWORD_LENGTH,
  subscribe: (listener) => subscribeToAuth((user) => listener(user ? toAppUser(user) : null)),
  loginAsGuest: async () => void (await loginAsGuest()),
  loginWithEmail: async (email, password) => void (await loginWithEmail(email, password)),
  register: async (input) => void (await registerAccount(input)),
  logout: logoutUser,
  errorCode: authErrorCode,
  isPatronAccount: (user) => user.uid === 'patron-admin',
  changePassword,
};

/** Profile of the signed-in account: reads are revalidated by the core, writes are complete. */
export const firebaseAccountProfile: AccountProfileRepository = {
  read: async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return resolveUserProfile(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },
  write: async (profile) => {
    try {
      await setDoc(doc(db, 'users', profile.uid), toDocument(profile));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
      return false;
    }
  },
};
