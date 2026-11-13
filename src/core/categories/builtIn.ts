import type { CategoryKind, ContentCategory } from './types';

const builtIn = (
  id: string,
  order: number,
  icon: string,
  names: { fr: string; derja: string; ar: string; derja_ar: string }
): ContentCategory => ({
  id,
  parent_id: null,
  name_fr: names.fr,
  name_derja: names.derja,
  name_ar: names.ar,
  name_derja_ar: names.derja_ar,
  order,
  icon,
  built_in: true,
});

/**
 * Ingredient categories every ingredient was sorted in before categories were managed: same ids
 * (nothing to migrate), renamable and movable in the backoffice, never deleted.
 */
export const BUILT_IN_INGREDIENT_CATEGORIES: readonly ContentCategory[] = [
  builtIn('vegetables', 10, '🥕', { fr: 'Légumes', derja: 'Khdhra', ar: 'خضروات', derja_ar: 'خضرة' }),
  builtIn('fruits', 20, '🍊', { fr: 'Fruits', derja: 'Ghallah', ar: 'فواكه', derja_ar: 'غلّة' }),
  builtIn('meats', 30, '🥩', {
    fr: 'Viandes & Volailles',
    derja: 'L7am w Djaj',
    ar: 'لحوم ودواجن',
    derja_ar: 'لحم ودجاج',
  }),
  builtIn('fish', 40, '🐟', {
    fr: 'Poissons & Fruits de mer',
    derja: '7out w Fawakeh Ba7r',
    ar: 'أسماك وثمار البحر',
    derja_ar: 'حوت وفواكه بحر',
  }),
  builtIn('dairy_eggs', 50, '🥚', {
    fr: 'Produits laitiers & Œufs',
    derja: '3dham w 7libiyat',
    ar: 'ألبان وبيض',
    derja_ar: 'عظم وحليبيات',
  }),
  builtIn('grains_pasta', 60, '🌾', {
    fr: 'Féculents, Pâtes & Céréales',
    derja: 'Ma9rouna w 3jin',
    ar: 'نشويات ومعكرونة وحبوب',
    derja_ar: 'مقرونة وعجين',
  }),
  builtIn('spices_condiments', 70, '🌶️', {
    fr: 'Épices, Harissa & Condiments',
    derja: 'Fé7at w Hrisa',
    ar: 'توابل وهريسة',
    derja_ar: 'فواح وهريسة',
  }),
  builtIn('canned_pantry', 80, '🥫', {
    fr: 'Conserves & Épicerie',
    derja: 'Conserves w Mo2na',
    ar: 'معلّبات ومؤونة',
    derja_ar: 'كونسارف وعولة',
  }),
  builtIn('other', 90, '🧺', {
    fr: 'Autres ingrédients',
    derja: '7weyej okhra',
    ar: 'مكوّنات أخرى',
    derja_ar: 'حويّج أخرين',
  }),
];

/** Category of an ingredient whose category is unknown. */
export const FALLBACK_INGREDIENT_CATEGORY = 'other';

/** Recipe categories all come from the backoffice. */
export const BUILT_IN_RECIPE_CATEGORIES: readonly ContentCategory[] = [];

export const BUILT_IN_CATEGORIES: Record<CategoryKind, readonly ContentCategory[]> = {
  recipe: BUILT_IN_RECIPE_CATEGORIES,
  ingredient: BUILT_IN_INGREDIENT_CATEGORIES,
};
