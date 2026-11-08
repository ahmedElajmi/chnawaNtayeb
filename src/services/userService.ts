import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

/**
 * Fields a user may write on their own profile (enforced by firestore.rules).
 * There is deliberately no `role`: admin rights never come from a document
 * the user can edit.
 */
export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  favorites?: string[];
  savedFridge?: string[];
  lastLogin?: string;
}

export const ADMIN_EMAIL = 'ahmedlajmi123@gmail.com';
export const MIN_PASSWORD_LENGTH = 8;

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
  return null;
}

export async function syncUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

/** Turns Firebase error codes into messages a user understands. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email. Connecte-toi plutôt.';
    case 'auth/weak-password':
      return `Mot de passe trop faible (${MIN_PASSWORD_LENGTH} caractères minimum).`;
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessaie dans quelques minutes.';
    case 'auth/network-request-failed':
      return 'Connexion internet indisponible.';
    case 'auth/operation-not-allowed':
      return 'Ce mode de connexion est désactivé pour le moment.';
    default:
      return 'Une erreur est survenue. Réessaie.';
  }
}

function profileFor(user: FirebaseUser, isAnonymous: boolean): UserProfile {
  return {
    uid: user.uid,
    ...(user.email ? { email: user.email } : {}),
    displayName: isAnonymous ? 'Invité Gourmand' : (user.email || '').split('@')[0].slice(0, 60),
    isAnonymous,
    lastLogin: new Date().toISOString(),
  };
}

export async function loginAsGuest(): Promise<FirebaseUser> {
  const cred = await signInAnonymously(auth);
  await syncUserProfile(profileFor(cred.user, true));
  return cred.user;
}

/** Signs in an existing account only. A wrong password never creates an account. */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  await syncUserProfile(profileFor(cred.user, false));
  return cred.user;
}

/** Explicit account creation (separate button in the UI). */
export async function registerWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  if (pass.length < MIN_PASSWORD_LENGTH) {
    throw Object.assign(new Error('weak'), { code: 'auth/weak-password' });
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  await syncUserProfile(profileFor(cred.user, false));
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
