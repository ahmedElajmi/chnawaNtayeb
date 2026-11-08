import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';
import { AppTheme, isValidTheme, pickThemeFields, validateTheme } from '@/core/theme';
import type { ThemeRepository, WriteResult } from '@/application';
import { storage } from '@/infrastructure/local/storage';

const COLLECTION = 'themes';

/**
 * Public read: only published themes (matches firestore.rules).
 * Admin read (`includeDrafts`): every theme, used by the backoffice editor.
 */
export async function fetchThemesFromFirestore(includeDrafts = false): Promise<AppTheme[] | null> {
  try {
    const ref = collection(db, COLLECTION);
    const snap = await getDocs(includeDrafts ? ref : query(ref, where('is_published', '==', true)));
    const themes: AppTheme[] = [];
    snap.forEach((d) => {
      const candidate = { ...d.data(), id: d.id };
      // Never trust stored data blindly: an invalid theme is ignored, not applied
      if (isValidTheme(candidate)) themes.push(pickThemeFields(candidate));
    });
    return themes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return null;
  }
}

/** Loads published themes and refreshes the offline cache. Falls back to the cache when offline. */
export async function syncPublishedThemes(): Promise<AppTheme[]> {
  const remote = await fetchThemesFromFirestore(false);
  if (remote) {
    storage.saveCachedThemes(remote);
    return remote;
  }
  return storage.getCachedThemes();
}

type CloudWriteResult = WriteResult;

function friendlyError(raw: string): string {
  return /permission|insufficient/i.test(raw)
    ? 'le cloud a refusé l écriture (session patron non reliée à Firebase : vérifie FIREBASE_SERVICE_ACCOUNT et les règles Firestore).'
    : 'le cloud est injoignable, réessaie plus tard.';
}

export async function saveThemeToFirestore(theme: AppTheme): Promise<CloudWriteResult> {
  const errors = validateTheme(theme);
  if (errors.length > 0) return { ok: false, error: errors.join(' · ') };
  if (theme.is_builtin) return { ok: false, error: 'Les thèmes intégrés ne peuvent pas être modifiés.' };

  const clean = { ...pickThemeFields(theme), updated_at: new Date().toISOString() };
  const { id, ...data } = clean;
  try {
    await setDoc(doc(db, COLLECTION, id), data);
    return { ok: true };
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.WRITE, `${COLLECTION}/${id}`);
    return { ok: false, error: friendlyError(info.error) };
  }
}

export async function deleteThemeFromFirestore(themeId: string): Promise<CloudWriteResult> {
  try {
    await deleteDoc(doc(db, COLLECTION, themeId));
    return { ok: true };
  } catch (error) {
    const info = handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${themeId}`);
    return { ok: false, error: friendlyError(info.error) };
  }
}

/** Themes published in Firestore, with an offline copy on the device (port ThemeRepository). */
export const firestoreThemeRepository: ThemeRepository = {
  cached: () => storage.getCachedThemes(),
  fetchPublished: syncPublishedThemes,
  fetchAll: () => fetchThemesFromFirestore(true),
  save: saveThemeToFirestore,
  remove: deleteThemeFromFirestore,
  saveActiveSnapshot: (snapshot) => storage.saveActiveThemeSnapshot(snapshot),
};
