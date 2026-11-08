import { DayPlan, MealCategory, MealSlot, MealType, Recipe } from '../types';
import { normalizeCategory } from './mealCourse';

/** Slot key of a meal for each course. */
export const SLOT_KEY: Record<MealCategory, keyof MealSlot> = {
  entree: 'entree_id',
  plat_principal: 'plat_id',
  dessert: 'dessert_id',
};

export const MEAL_TYPES: MealType[] = ['lunch', 'dinner'];

/** A meal is valid only with a main course. An empty meal (nothing planned) is not an error. */
export function isMealEmpty(slot: MealSlot | undefined): boolean {
  return !slot?.plat_id && !slot?.entree_id && !slot?.dessert_id;
}

export function isMealComplete(slot: MealSlot | undefined): boolean {
  return !!slot?.plat_id;
}

/** Meals that have a starter or dessert but no main course (should never happen through the UI). */
export function countMealsWithoutMain(plan: DayPlan[]): number {
  return plan.reduce(
    (n, day) => n + MEAL_TYPES.filter((m) => !isMealEmpty(day[m]) && !isMealComplete(day[m])).length,
    0
  );
}

export function countEmptyMeals(plan: DayPlan[]): number {
  return plan.reduce((n, day) => n + MEAL_TYPES.filter((m) => isMealEmpty(day[m])).length, 0);
}

/** Every recipe of the menu (starter, main, dessert), in order, duplicates kept (used for quantities). */
export function collectRecipeIds(plan: DayPlan[]): string[] {
  return plan.flatMap((day) =>
    MEAL_TYPES.flatMap((m) => [day[m]?.entree_id, day[m]?.plat_id, day[m]?.dessert_id]).filter(
      (id): id is string => !!id
    )
  );
}

export interface GenerateOptions {
  withEntree: boolean;
  withDessert: boolean;
  healthyOnly: boolean;
  /** Injected for deterministic tests */
  random?: () => number;
}

export interface GenerateResult {
  plan: DayPlan[];
  /** Courses for which there were not enough healthy recipes (all recipes were used instead) */
  healthyFallback: MealCategory[];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds a week menu: every meal gets a main course (never a starter or a
 * dessert in its place). Starters/desserts are added only when requested.
 * Recipes are not repeated before the whole pool has been used.
 */
export function generateWeekPlan(recipes: Recipe[], days: DayPlan[], options: GenerateOptions): GenerateResult {
  const random = options.random ?? Math.random;
  const published = recipes.filter((r) => r.is_published);
  const healthyFallback: MealCategory[] = [];

  const poolFor = (course: MealCategory): Recipe[] => {
    const all = published.filter((r) => normalizeCategory(r.category) === course);
    if (!options.healthyOnly) return all;
    const healthy = all.filter((r) => r.is_healthy);
    if (healthy.length === 0 && all.length > 0) {
      healthyFallback.push(course);
      return all;
    }
    return healthy;
  };

  // Cycles through a shuffled pool, reshuffling once exhausted
  const picker = (course: MealCategory) => {
    const pool = poolFor(course);
    let queue: Recipe[] = [];
    return (): string | undefined => {
      if (pool.length === 0) return undefined;
      if (queue.length === 0) queue = shuffle(pool, random);
      return queue.shift()!.id;
    };
  };

  const nextPlat = picker('plat_principal');
  const nextEntree = options.withEntree ? picker('entree') : () => undefined;
  const nextDessert = options.withDessert ? picker('dessert') : () => undefined;

  const plan = days.map((day) => {
    const meal = (): MealSlot => {
      const plat_id = nextPlat();
      if (!plat_id) return {}; // no main course available at all: leave the meal empty
      const slot: MealSlot = { plat_id };
      const entree_id = nextEntree();
      const dessert_id = nextDessert();
      if (entree_id) slot.entree_id = entree_id;
      if (dessert_id) slot.dessert_id = dessert_id;
      return slot;
    };
    return { ...day, lunch: meal(), dinner: meal() };
  });

  return { plan, healthyFallback };
}

/** Assigns a recipe to a slot, respecting "no starter/dessert without a main course". */
export function assignToSlot(slot: MealSlot, course: MealCategory, recipeId: string): MealSlot {
  if (course !== 'plat_principal' && !slot.plat_id) return slot;
  return { ...slot, [SLOT_KEY[course]]: recipeId };
}

/** Removing the main course removes the whole meal. */
export function removeFromSlot(slot: MealSlot, course: MealCategory): MealSlot {
  if (course === 'plat_principal') return {};
  const next = { ...slot };
  delete next[SLOT_KEY[course]];
  return next;
}

// ---------------------------------------------------------------------------
// Migration of the v1 format (one recipe per meal: lunch_recipe_id / dinner_recipe_id)
// ---------------------------------------------------------------------------

type LegacyDayPlan = Omit<DayPlan, 'lunch' | 'dinner'> & {
  lunch?: MealSlot;
  dinner?: MealSlot;
  lunch_recipe_id?: string;
  dinner_recipe_id?: string;
};

function legacyToSlot(recipeId: string | undefined, recipes: Recipe[]): MealSlot {
  if (!recipeId) return {};
  const recipe = recipes.find((r) => r.id === recipeId);
  const course = recipe ? normalizeCategory(recipe.category) : 'plat_principal';
  // An old starter/dessert keeps its place; the main course stays empty and is flagged in the UI
  return { [SLOT_KEY[course]]: recipeId };
}

export function migrateDayPlan(day: LegacyDayPlan, recipes: Recipe[]): DayPlan {
  const { lunch_recipe_id, dinner_recipe_id, ...rest } = day;
  return {
    ...rest,
    lunch: day.lunch ?? legacyToSlot(lunch_recipe_id, recipes),
    dinner: day.dinner ?? legacyToSlot(dinner_recipe_id, recipes),
  };
}
