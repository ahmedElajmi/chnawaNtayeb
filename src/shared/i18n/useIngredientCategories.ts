import { INGREDIENT_CATEGORIES, type IngredientCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { CATEGORY_LABEL_KEYS } from './categoryLabels';

/** Ingredient categories with their label in the current language. */
export function useIngredientCategories(): [IngredientCategory, string][] {
  const { t } = useLanguage();
  return INGREDIENT_CATEGORIES.map((c) => [c, String(t[CATEGORY_LABEL_KEYS[c]])]);
}
