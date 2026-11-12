import type { IngredientCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';

/** Ingredient categories with their label, for the backoffice selects. */
export function useIngredientCategories(): [IngredientCategory, string][] {
  const { t } = useLanguage();
  return [
    ['vegetables', t.catVegetables],
    ['fruits', t.catFruits],
    ['meats', t.catMeats],
    ['fish', t.catFish],
    ['dairy_eggs', t.catDairyEggs],
    ['grains_pasta', t.catGrainsPasta],
    ['spices_condiments', t.catSpicesCondiments],
    ['canned_pantry', t.catCannedPantry],
    ['other', t.catOther],
  ];
}
