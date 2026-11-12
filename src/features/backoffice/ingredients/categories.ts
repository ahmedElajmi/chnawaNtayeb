import type { IngredientCategory } from '@/core/catalog';

/** Ingredient categories with their French label (the backoffice is written in French). */
const CATEGORIES: [IngredientCategory, string][] = [
  ['vegetables', 'Légumes'],
  ['fruits', 'Fruits'],
  ['meats', 'Viandes'],
  ['fish', 'Poissons'],
  ['dairy_eggs', 'Laitiers & œufs'],
  ['grains_pasta', 'Féculents & pâtes'],
  ['spices_condiments', 'Épices & condiments'],
  ['canned_pantry', 'Conserves & épicerie'],
  ['other', 'Autres'],
];

export function useIngredientCategories(): [IngredientCategory, string][] {
  return CATEGORIES;
}
