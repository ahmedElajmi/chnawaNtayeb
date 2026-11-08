import type { IngredientRole, MealCategory, RecipeIngredient } from './types';

/**
 * Which ingredient can replace which, and when.
 * Plain data (JSON): the default rules below can be overridden by the admin
 * (matching settings), without touching the code.
 */
export interface SubstitutionRule {
  /** Ingredient asked for by the recipe */
  ingredient: string;
  /** Ingredients that can replace it, best first */
  substitutes: string[];
  /** The replacement does not work for these courses (e.g. olive oil instead of butter in a dessert) */
  notForCourses?: MealCategory[];
  /** The replacement does not work when the ingredient *is* the dish (e.g. fresh tomatoes of a salad) */
  notWhenKey?: boolean;
}

/** Context of a recipe ingredient, used to decide if a rule applies. */
export interface SubstitutionContext {
  course: MealCategory;
  role: IngredientRole;
}

/** Rules where every ingredient of the group can replace every other one. */
function mutual(ids: string[], options: Omit<SubstitutionRule, 'ingredient' | 'substitutes'> = {}): SubstitutionRule[] {
  return ids.map((ingredient) => ({ ingredient, substitutes: ids.filter((id) => id !== ingredient), ...options }));
}

export const DEFAULT_SUBSTITUTION_RULES: SubstitutionRule[] = [
  // Fresh tomatoes always replace tomato paste; paste replaces tomatoes only in a cooked sauce
  { ingredient: 'ing_tomate_concentree', substitutes: ['ing_tomate'] },
  { ingredient: 'ing_tomate', substitutes: ['ing_tomate_concentree'], notWhenKey: true },
  ...mutual(['ing_boeuf', 'ing_agneau', 'ing_viande_hachee']),
  ...mutual(['ing_harissa', 'ing_piment_moulu']),
  ...mutual(['ing_persil', 'ing_coriandre']),
  ...mutual(['ing_fromage_rape', 'ing_ricotta'], { notWhenKey: true }),
  // Butter → olive oil is fine for a savoury dish, never for a cake
  { ingredient: 'ing_beurre', substitutes: ['ing_huile_olive'], notForCourses: ['dessert'] },
  { ingredient: 'ing_huile_olive', substitutes: ['ing_beurre'] },
];

function applies(rule: SubstitutionRule, context?: SubstitutionContext): boolean {
  if (!context) return true;
  if (rule.notForCourses?.includes(context.course)) return false;
  if (rule.notWhenKey && context.role === 'key') return false;
  return true;
}

/**
 * Possible replacements of a recipe ingredient, best first: the ones chosen for this recipe,
 * then the general rules that apply in this context (all of them when no context is given).
 */
export function getSubstitutes(
  item: RecipeIngredient,
  context?: SubstitutionContext,
  rules: SubstitutionRule[] = DEFAULT_SUBSTITUTION_RULES
): string[] {
  const general = rules
    .filter((r) => r.ingredient === item.ingredient_id && applies(r, context))
    .flatMap((r) => r.substitutes);
  return Array.from(new Set([...(item.substitutes ?? []), ...general])).filter((id) => id !== item.ingredient_id);
}
