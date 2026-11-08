import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, DocumentReference } from 'firebase/firestore';
import { db, firebaseProjectId, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';
import { type Recipe, type Ingredient, initialRecipes, initialIngredients, migrateRecipes } from '@/core/catalog';
import type { CatalogAdminGateway, CatalogInitStats, WriteResult } from '@/application';
import { storage } from '@/infrastructure/local/storage';

type CloudWriteResult = WriteResult;

function writeError(error: unknown, op: OperationType, path: string): CloudWriteResult {
  const info = handleFirestoreError(error, op, path);
  const denied = /permission|insufficient/i.test(info.error);
  return {
    ok: false,
    error: denied
      ? 'Enregistré sur cet appareil seulement : le cloud a refusé l écriture (session patron non reliée à Firebase).'
      : 'Enregistré sur cet appareil seulement : le cloud est injoignable.',
  };
}

export async function syncRecipesFromFirestore(): Promise<Recipe[]> {
  try {
    const colRef = collection(db, 'recipes');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      let remoteRecipes: Recipe[] = [];
      snapshot.forEach((d) => {
        remoteRecipes.push({ id: d.id, ...d.data() } as Recipe);
      });
      // Cloud recipes created before roles / 3 courses / healthy existed are brought up to date
      remoteRecipes = migrateRecipes(remoteRecipes);
      storage.saveRecipes(remoteRecipes);
      return remoteRecipes;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'recipes');
  }
  return storage.getRecipes();
}

export async function saveRecipeToFirestore(recipe: Recipe): Promise<CloudWriteResult> {
  // Always save locally first for instant feedback and offline support
  storage.saveRecipe(recipe);

  try {
    const docRef = doc(db, 'recipes', recipe.id);
    await setDoc(docRef, recipe, { merge: true });
    return { ok: true };
  } catch (error) {
    return writeError(error, OperationType.WRITE, `recipes/${recipe.id}`);
  }
}

export async function deleteRecipeFromFirestore(recipeId: string): Promise<CloudWriteResult> {
  storage.deleteRecipe(recipeId);

  try {
    const docRef = doc(db, 'recipes', recipeId);
    await deleteDoc(docRef);
    return { ok: true };
  } catch (error) {
    return writeError(error, OperationType.DELETE, `recipes/${recipeId}`);
  }
}

export async function syncIngredientsFromFirestore(): Promise<Ingredient[]> {
  try {
    const colRef = collection(db, 'ingredients');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const remoteIngredients: Ingredient[] = [];
      snapshot.forEach((d) => {
        remoteIngredients.push({ id: d.id, ...d.data() } as Ingredient);
      });
      storage.saveIngredients(remoteIngredients);
      return remoteIngredients;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ingredients');
  }
  return storage.getIngredients();
}

export async function saveIngredientToFirestore(ing: Ingredient): Promise<CloudWriteResult> {
  const current = storage.getIngredients();
  const index = current.findIndex((i) => i.id === ing.id);
  if (index >= 0) current[index] = ing;
  else current.push(ing);
  storage.saveIngredients(current);

  try {
    const docRef = doc(db, 'ingredients', ing.id);
    await setDoc(docRef, ing, { merge: true });
    return { ok: true };
  } catch (error) {
    return writeError(error, OperationType.WRITE, `ingredients/${ing.id}`);
  }
}

// Pushes every local recipe and ingredient to Firestore (admin only).
export async function pushAllToFirestore(): Promise<CloudWriteResult> {
  try {
    for (const rec of storage.getRecipes()) {
      await setDoc(doc(db, 'recipes', rec.id), rec, { merge: true });
    }
    for (const ing of storage.getIngredients()) {
      await setDoc(doc(db, 'ingredients', ing.id), ing, { merge: true });
    }
    return { ok: true };
  } catch (error) {
    return writeError(error, OperationType.WRITE, 'recipes|ingredients');
  }
}

type CatalogInitResult = CatalogInitStats;

/**
 * Replaces the cloud catalog with the built-in one (admin only): every built-in
 * recipe and ingredient is written in full, and cloud documents that are not
 * part of the built-in catalog are deleted. The local copy is reset too.
 */
export async function initializeCloudCatalog(): Promise<CloudWriteResult & { stats?: CatalogInitResult }> {
  storage.resetCatalog();
  try {
    const ops: { ref: DocumentReference; data?: object }[] = [];
    const recipeIds = new Set(initialRecipes.map((r) => r.id));
    const ingredientIds = new Set(initialIngredients.map((i) => i.id));
    let deleted = 0;
    for (const d of (await getDocs(collection(db, 'recipes'))).docs) {
      if (!recipeIds.has(d.id)) {
        ops.push({ ref: d.ref });
        deleted++;
      }
    }
    for (const d of (await getDocs(collection(db, 'ingredients'))).docs) {
      if (!ingredientIds.has(d.id)) {
        ops.push({ ref: d.ref });
        deleted++;
      }
    }
    for (const r of initialRecipes) ops.push({ ref: doc(db, 'recipes', r.id), data: r });
    for (const i of initialIngredients) ops.push({ ref: doc(db, 'ingredients', i.id), data: i });

    // Firestore batches are limited to 500 operations
    for (let k = 0; k < ops.length; k += 400) {
      const batch = writeBatch(db);
      for (const op of ops.slice(k, k + 400)) {
        if (op.data) batch.set(op.ref, JSON.parse(JSON.stringify(op.data)));
        else batch.delete(op.ref);
      }
      await batch.commit();
    }
    return { ok: true, stats: { recipes: initialRecipes.length, ingredients: initialIngredients.length, deleted } };
  } catch (error) {
    return writeError(error, OperationType.WRITE, 'recipes|ingredients');
  }
}

// Seed initial recipes and ingredients to Firestore if the collections are empty
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const recipesSnap = await getDocs(collection(db, 'recipes'));
    if (recipesSnap.empty) {
      console.log('[Firestore] Seeding initial Tunisian recipes to cloud database...');
      for (const rec of storage.getRecipes()) {
        await setDoc(doc(db, 'recipes', rec.id), rec);
      }
    }
    const ingredientsSnap = await getDocs(collection(db, 'ingredients'));
    if (ingredientsSnap.empty) {
      for (const ing of storage.getIngredients()) {
        await setDoc(doc(db, 'ingredients', ing.id), ing);
      }
    }
  } catch (error) {
    console.warn('[Firestore] Seed skipped or deferred:', error);
  }
}

/** Catalog administration for the backoffice (port CatalogAdminGateway). */
export const firestoreCatalogAdmin: CatalogAdminGateway = {
  cloudName: firebaseProjectId,
  saveRecipe: saveRecipeToFirestore,
  deleteRecipe: deleteRecipeFromFirestore,
  saveIngredient: saveIngredientToFirestore,
  createIngredient: (data) => storage.addCustomIngredient(data),
  pushAll: pushAllToFirestore,
  resetCloudCatalog: initializeCloudCatalog,
  pullFromCloud: async () => {
    await syncRecipesFromFirestore();
    await syncIngredientsFromFirestore();
  },
  exportBackup: () => storage.exportFullBackup(),
  importBackup: (json) => storage.importFullBackup(json),
  resetLocalToDefaults: () => storage.resetToDefaults(),
};
