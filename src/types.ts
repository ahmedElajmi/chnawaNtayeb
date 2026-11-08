export type Language = 'derja' | 'fr' | 'ar';

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
  default_price_tnd: number; // Price per standard unit in DT
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
  role?: IngredientRole; // inferred when missing (see services/ingredientRoles.ts)
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

/** Course of a dish. Old values (express, kaskrout, soupe) are converted by services/mealCourse.ts */
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

export type MatchTier = 'ready' | 'almost' | 'ideas';

export interface Substitution {
  ingredient_id: string; // what the recipe asks for
  substitute_id: string; // what the user has instead
}

export interface MatchingResult {
  recipe: Recipe;
  score: number; // 0 to 100, weighted by ingredient role
  matched_ingredients: string[]; // ingredient IDs available (fridge, pantry or substitute)
  missing_ingredients: string[]; // key + secondary ingredients to buy (key first)
  missing_key: string[]; // subset of missing_ingredients that are key ingredients
  missing_staples: string[]; // staples not in fridge/pantry (informative only)
  substitutions: Substitution[];
  missing_cost_tnd: number; // rough cost of missing_ingredients
  fridge_used: number; // how many fridge items (not pantry) the recipe uses
  tier: MatchTier;
}

/** One meal of the weekly menu: the main course is mandatory, starter and dessert are optional. */
export interface MealSlot {
  plat_id?: string;
  entree_id?: string;
  dessert_id?: string;
}

export type MealType = 'lunch' | 'dinner';

export interface DayPlan {
  day_id: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  day_name_fr: string;
  day_name_derja: string;
  day_name_ar: string;
  lunch: MealSlot;
  dinner: MealSlot;
}

export interface GroceryItem {
  id: string;
  ingredient_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  is_checked: boolean;
  is_custom?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: Language;
  default_servings: number;
  mode: ThemeMode;
  themeId: string;
  /** Ingredients considered always available at home (salt, oil, spices...) */
  pantryStaples: string[];
  dietary_filter?: 'all' | 'veggie' | 'economical' | 'quick';
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

/** Every value is a #RRGGBB hex color (validated, see services/themeValidation.ts) */
export interface ThemeColors {
  brand: string; // Primary color (buttons, active states)
  brandStrong: string; // Hover / pressed primary
  brandText: string; // Primary color used as text, readable on `surface`/`card`
  onBrand: string; // Text on top of `brand`
  accent: string; // Call-to-action color
  accentStrong: string; // Hover / pressed accent
  accentText: string; // Accent used as text, readable on `surface`/`card`
  onAccent: string; // Text on top of `accent`
  highlight: string; // Small decorative touches (badges, stars)
  surface: string; // Page background
  card: string; // Cards, panels, modals
  line: string; // Borders
  ink: string; // Main text
  inkMuted: string; // Secondary text
  heroFrom: string; // Home hero gradient start
  heroTo: string; // Home hero gradient end
}

export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
  'brand',
  'brandStrong',
  'brandText',
  'onBrand',
  'accent',
  'accentStrong',
  'accentText',
  'onAccent',
  'highlight',
  'surface',
  'card',
  'line',
  'ink',
  'inkMuted',
  'heroFrom',
  'heroTo',
];

export const DISPLAY_FONTS = ['plus-jakarta', 'fraunces', 'reem-kufi', 'cairo', 'playfair', 'baloo'] as const;
export type DisplayFont = (typeof DISPLAY_FONTS)[number];

export const CARD_SHAPES = ['rounded', 'arch', 'square'] as const;
export type CardShape = (typeof CARD_SHAPES)[number];

export const THEME_PATTERNS = ['none', 'zellige', 'dots', 'waves'] as const;
export type ThemePattern = (typeof THEME_PATTERNS)[number];

export interface AppTheme {
  id: string;
  name_fr: string;
  name_derja: string;
  name_ar: string;
  light: ThemeColors;
  dark: ThemeColors;
  displayFont: DisplayFont;
  cardShape: CardShape;
  pattern: ThemePattern;
  is_published: boolean;
  is_builtin?: boolean;
  updated_at?: string;
}
