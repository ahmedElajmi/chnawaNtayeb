import type { Ingredient, Recipe } from '@/core/catalog';
import type { ContentCategory } from '@/core/categories';
import { createFirestoreSharedCollection } from './firestoreSharedCollection';
import { firebaseProjectId } from './client';

/** The shared catalog in Firestore: two collections followed incrementally (see firestoreSharedCollection). */
export const firestoreRecipes = createFirestoreSharedCollection<Recipe>('recipes');
export const firestoreIngredients = createFirestoreSharedCollection<Ingredient>('ingredients');
/** Categories managed in the backoffice (one collection per kind of content). */
export const firestoreRecipeCategories = createFirestoreSharedCollection<ContentCategory>('recipe_categories');
export const firestoreIngredientCategories = createFirestoreSharedCollection<ContentCategory>('ingredient_categories');
export const firestoreCloudName = firebaseProjectId;
