export type IngredientCategory =
  | 'vegetables'
  | 'fruits'
  | 'meats'
  | 'fish'
  | 'dairy_eggs'
  | 'grains_pasta'
  | 'spices_condiments'
  | 'canned_pantry'
  | 'other';

export interface Ingredient {
  id: string;
  name_fr: string;
  name_derja: string;
  name_ar: string;
  category: IngredientCategory;
  icon?: string;
  unit_default: string;
  /** Market prices vary: lowest and highest price of one purchase unit, in DT (min <= max) */
  price_min_tnd: number;
  price_max_tnd: number;
  /** Optional photo (https link set by the chef); a category visual is shown when absent */
  image_url?: string;
}

/** Lowest and highest amount in DT */
export interface PriceRange {
  min: number;
  max: number;
}

/**
 * How much an ingredient matters for a recipe (used by the matching engine):
 * - key: the dish does not exist without it (merguez in an ojja merguez, frik in a chorba frik)
 * - secondary: needed, but the dish still makes sense if you buy 1 or 2 of them
 * - staple: salt, oil, spices... never blocks a recipe
 */
export type IngredientRole = 'key' | 'secondary' | 'staple';

export interface RecipeIngredient {
  ingredient_id: string;
  quantity_base: number; // For base_servings (e.g. 4 people)
  unit: string;
  is_optional?: boolean;
  role?: IngredientRole; // inferred when missing (see ./roles.ts)
  substitutes?: string[]; // ingredient ids that can replace this one in this recipe
}

export interface RecipeStep {
  step_number: number;
  instruction_fr: string;
  instruction_derja: string;
  instruction_ar: string;
}

export interface ChefTip {
  fr: string;
  derja: string;
  ar: string;
}

/** Course of a dish. Old values (express, kaskrout, soupe) are converted by ./course.ts */
export type MealCategory = 'entree' | 'plat_principal' | 'dessert';
export const MEAL_CATEGORIES: MealCategory[] = ['entree', 'plat_principal', 'dessert'];
export type CuisineType = 'traditionnelle' | 'rapide' | 'economique' | 'vegetarienne' | 'familiale' | 'internationale';
export type Difficulty = 'facile' | 'moyen' | 'avance';

export interface Recipe {
  id: string;
  slug: string;
  name_fr: string;
  name_derja: string;
  name_ar: string;
  description_fr: string;
  description_derja: string;
  description_ar: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  base_servings: number;
  estimated_cost_tnd: number;
  category: MealCategory;
  cuisine_type: CuisineType;
  difficulty: Difficulty;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  chef_tip: ChefTip;
  is_published: boolean;
  /** Balanced / light dish, set by the admin ("Healthy" badge and filters) */
  is_healthy?: boolean;
  /** Optional YouTube link showing how to cook the dish (nothing is displayed when absent or invalid) */
  video_url?: string;
}
