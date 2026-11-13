import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { withoutUndefined } from '@/core/shared';
import type { TeamRepository, WriteResult } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

/**
 * Firestore layout (see firestore.rules):
 *   admins/<uid>   a member of the team: role + the rights the rules read (can_publish, can_manage)
 *   users/<uid>    profile of an account signed in on the site (its e-mail is how a member is found)
 */
const ADMINS = collection(db, 'admins');
const USERS = collection(db, 'users');

function failure(error: unknown, path: string): WriteResult {
  const info = handleFirestoreError(error, OperationType.WRITE, path);
  return {
    ok: false,
    error: /permission|insufficient/i.test(info.error)
      ? 'La base a refusé l’enregistrement (droits insuffisants, ou règles Firestore non déployées).'
      : 'La base de données est injoignable, réessaie plus tard.',
  };
}

export const firestoreTeam: TeamRepository = {
  follow(onChange, onError) {
    return onSnapshot(
      ADMINS,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), uid: d.id }))),
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admins');
        onError();
      }
    );
  },

  async getMember(uid) {
    const snap = await getDoc(doc(ADMINS, uid));
    return snap.exists() ? { ...snap.data(), uid } : null;
  },

  async findAccountByEmail(email) {
    const snap = await getDocs(query(USERS, where('email', '==', email), limit(1)));
    const found = snap.docs[0];
    return found ? { uid: found.id, email } : null;
  },

  async put(member) {
    try {
      const { uid, ...data } = member;
      await setDoc(doc(ADMINS, uid), withoutUndefined(data));
      return { ok: true };
    } catch (error) {
      return failure(error, `admins/${member.uid}`);
    }
  },

  async remove(uid) {
    try {
      await deleteDoc(doc(ADMINS, uid));
      return { ok: true };
    } catch (error) {
      return failure(error, `admins/${uid}`);
    }
  },
};
