import { INGREDIENT_CATEGORIES, type IngredientCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { TranslationDictionary } from './translations';

const LABEL_KEYS: Record<IngredientCategory, keyof TranslationDictionary> = {
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

/** Ingredient categories with their label in the current language. */
export function useIngredientCategories(): [IngredientCategory, string][] {
  const { t } = useLanguage();
  return INGREDIENT_CATEGORIES.map((c) => [c, String(t[LABEL_KEYS[c]])]);
}
