import {
  collection,
  getCountFromServer,
  getDocs,
  limit as fsLimit,
  query,
  startAfter,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { resolveUserProfile, type AccountSummary } from '@/core/accounts';
import type { AccountDirectoryPage, AccountDirectoryQuery, AccountDirectoryRepository } from '@/application';
import { db, handleFirestoreError, OperationType } from './client';

const USERS = collection(db, 'users');

function summarize(raw: DocumentData): AccountSummary | null {
  const profile = resolveUserProfile(raw);
  if (!profile) return null;
  return {
    uid: profile.uid,
    type: profile.type,
    email: profile.email,
    displayName: profile.displayName,
    phone: profile.phone,
    isAnonymous: profile.isAnonymous,
    lastLogin: profile.lastLogin,
  };
}

function buildQuery({ type, search, limit, cursor }: AccountDirectoryQuery): Query {
  let q: Query = USERS;
  // Equality filter + the implicit document-id order: no composite index to maintain.
  if (type !== 'all') q = query(q, where('type', '==', type));
  if (search) {
    // Range filter on the e-mail; with a search the type filter is dropped (no index pairing).
    q = query(USERS, where('email', '>=', search.toLowerCase()), where('email', '<=', `${search.toLowerCase()}\uf8ff`));
  }
  q = query(q, fsLimit(limit));
  if (cursor && !search) q = query(q, startAfter(cursor));
  return q;
}

/**
 * Directory of every account, for managers only (the rules refuse `list` to the others).
 * Paged by document id with an exact total (count); a search returns one page of e-mail
 * prefixes without pagination.
 */
export const firestoreAccountDirectory: AccountDirectoryRepository = {
  async list(query: AccountDirectoryQuery): Promise<AccountDirectoryPage> {
    try {
      const shaped = buildQuery(query);
      const snap = await getDocs(shaped);
      const items = snap.docs.map((d) => summarize(d.data())).filter((v): v is AccountSummary => v !== null);
      const countSnap = await getCountFromServer(shaped);
      const total = countSnap.data().count;
      const last = snap.docs[snap.docs.length - 1];
      return { items, total, nextCursor: !query.search && last ? last.id : null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
      return { items: [], total: 0, nextCursor: null };
    }
  },
};
