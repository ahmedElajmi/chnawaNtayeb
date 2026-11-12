import type { Ingredient, Recipe } from '@/core/catalog';
import { createFirestoreSharedCollection } from './firestoreSharedCollection';
import { firebaseProjectId } from './client';

/** The shared catalog in Firestore: two collections followed incrementally (see firestoreSharedCollection). */
export const firestoreRecipes = createFirestoreSharedCollection<Recipe>('recipes');
export const firestoreIngredients = createFirestoreSharedCollection<Ingredient>('ingredients');
export const firestoreCloudName = firebaseProjectId;
