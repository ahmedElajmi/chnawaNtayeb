import type { IngredientCategory } from '@/core/catalog';
import type { TranslationDictionary } from './translations';

/** Translation key of each ingredient category label (screens and server pages share it). */
export const CATEGORY_LABEL_KEYS: Record<IngredientCategory, keyof TranslationDictionary> = {
  vegetables: 'catVegetables',
  fruits: 'catFruits',
  meats: 'catMeats',
  fish: 'catFish',
  dairy_eggs: 'catDairyEggs',
  grains_pasta: 'catGrainsPasta',
  spices_condiments: 'catSpicesCondiments',
  canned_pantry: 'catCannedPantry',
  other: 'catOther',
};
