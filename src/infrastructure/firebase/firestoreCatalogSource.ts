import type { RemoteCatalogSource } from '@/application';
import { syncIngredientsFromFirestore, syncRecipesFromFirestore } from '@/infrastructure/firebase/catalogSync';

/** Shared catalog read from Firestore (also refreshes the local copy). */
export const firestoreCatalogSource: RemoteCatalogSource = {
  fetchRecipes: () => syncRecipesFromFirestore(),
  fetchIngredients: () => syncIngredientsFromFirestore(),
};
