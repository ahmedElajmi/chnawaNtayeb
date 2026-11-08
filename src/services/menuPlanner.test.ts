import { describe, it, expect } from 'vitest';
import {
  generateWeekPlan,
  collectRecipeIds,
  migrateDayPlan,
  assignToSlot,
  removeFromSlot,
  countMealsWithoutMain,
} from './menuPlanner';
import { normalizeCategory, isExpress } from './mealCourse';
import { matchRecipes } from './matchingEngine';
import { initialRecipes } from '../data/initialRecipes';
import { defaultWeeklyPlan } from './storage';
import { DayPlan, Recipe } from '../types';

const byId = new Map(initialRecipes.map((r) => [r.id, r]));
const courseOf = (id?: string) => (id ? byId.get(id)?.category : undefined);

// Deterministic pseudo-random generator
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const allMeals = (plan: DayPlan[]) => plan.flatMap((d) => [d.lunch, d.dinner]);

describe('courses', () => {
  it('normalizes old categories', () => {
    expect(normalizeCategory('soupe')).toBe('entree');
    expect(normalizeCategory('entree')).toBe('entree');
    expect(normalizeCategory('kaskrout')).toBe('plat_principal');
    expect(normalizeCategory('express')).toBe('plat_principal');
    expect(normalizeCategory('dessert')).toBe('dessert');
    expect(normalizeCategory(undefined)).toBe('plat_principal');
  });

  it('every built-in recipe uses one of the 3 courses', () => {
    for (const r of initialRecipes) expect(['entree', 'plat_principal', 'dessert']).toContain(r.category);
  });

  it('the catalog has starters, mains, desserts and healthy dishes', () => {
    expect(initialRecipes.filter((r) => r.category === 'dessert').length).toBeGreaterThanOrEqual(4);
    expect(initialRecipes.filter((r) => r.category === 'entree').length).toBeGreaterThanOrEqual(4);
    expect(initialRecipes.filter((r) => r.is_healthy).length).toBeGreaterThanOrEqual(7);
  });

  it('express is a time label', () => {
    expect(isExpress({ prep_time_minutes: 10, cook_time_minutes: 10 })).toBe(true);
    expect(isExpress({ prep_time_minutes: 15, cook_time_minutes: 10 })).toBe(false);
  });
});

describe('generateWeekPlan', () => {
  it('always fills the main course, only with main dishes', () => {
    const { plan } = generateWeekPlan(initialRecipes, defaultWeeklyPlan, {
      withEntree: false,
      withDessert: false,
      healthyOnly: false,
      random: seeded(),
    });
    for (const meal of allMeals(plan)) {
      expect(courseOf(meal.plat_id)).toBe('plat_principal');
      expect(meal.entree_id).toBeUndefined();
      expect(meal.dessert_id).toBeUndefined();
    }
  });

  it('adds starters and desserts of the right course when asked', () => {
    const { plan } = generateWeekPlan(initialRecipes, defaultWeeklyPlan, {
      withEntree: true,
      withDessert: true,
      healthyOnly: false,
      random: seeded(7),
    });
    for (const meal of allMeals(plan)) {
      expect(courseOf(meal.plat_id)).toBe('plat_principal');
      expect(courseOf(meal.entree_id)).toBe('entree');
      expect(courseOf(meal.dessert_id)).toBe('dessert');
    }
  });

  it('does not repeat a main course before every main dish has been used', () => {
    const { plan } = generateWeekPlan(initialRecipes, defaultWeeklyPlan, {
      withEntree: false,
      withDessert: false,
      healthyOnly: false,
      random: seeded(3),
    });
    const mains = initialRecipes.filter((r) => r.category === 'plat_principal').length;
    const firstMains = allMeals(plan).slice(0, mains).map((m) => m.plat_id);
    expect(new Set(firstMains).size).toBe(firstMains.length);
  });

  it('healthy menu only uses healthy recipes', () => {
    const { plan, healthyFallback } = generateWeekPlan(initialRecipes, defaultWeeklyPlan, {
      withEntree: true,
      withDessert: true,
      healthyOnly: true,
      random: seeded(11),
    });
    expect(healthyFallback).toEqual([]);
    for (const id of collectRecipeIds(plan)) expect(byId.get(id)?.is_healthy).toBe(true);
  });

  it('falls back to all recipes when a course has no healthy dish', () => {
    const noHealthyDessert: Recipe[] = initialRecipes.map((r) =>
      r.category === 'dessert' ? { ...r, is_healthy: false } : r
    );
    const { plan, healthyFallback } = generateWeekPlan(noHealthyDessert, defaultWeeklyPlan, {
      withEntree: false,
      withDessert: true,
      healthyOnly: true,
      random: seeded(5),
    });
    expect(healthyFallback).toEqual(['dessert']);
    for (const meal of allMeals(plan)) expect(courseOf(meal.dessert_id)).toBe('dessert');
  });

  it('leaves meals empty (never a starter alone) when there is no main dish', () => {
    const onlyStarters = initialRecipes.filter((r) => r.category === 'entree');
    const { plan } = generateWeekPlan(onlyStarters, defaultWeeklyPlan, {
      withEntree: true,
      withDessert: false,
      healthyOnly: false,
    });
    for (const meal of allMeals(plan)) expect(meal).toEqual({});
  });
});

describe('meal slots', () => {
  it('a starter cannot be added before the main course', () => {
    expect(assignToSlot({}, 'entree', 'rec_slata_tounsia')).toEqual({});
    expect(assignToSlot({ plat_id: 'rec_kafteji' }, 'entree', 'rec_slata_tounsia')).toEqual({
      plat_id: 'rec_kafteji',
      entree_id: 'rec_slata_tounsia',
    });
  });

  it('removing the main course removes the whole meal', () => {
    const slot = { plat_id: 'rec_kafteji', entree_id: 'rec_slata_tounsia', dessert_id: 'rec_mhalbiya' };
    expect(removeFromSlot(slot, 'plat_principal')).toEqual({});
    expect(removeFromSlot(slot, 'dessert')).toEqual({ plat_id: 'rec_kafteji', entree_id: 'rec_slata_tounsia' });
  });

  it('the default menu always has a main course', () => {
    expect(countMealsWithoutMain(defaultWeeklyPlan)).toBe(0);
    for (const meal of allMeals(defaultWeeklyPlan)) expect(courseOf(meal.plat_id)).toBe('plat_principal');
  });
});

describe('migration of v1 menus', () => {
  const legacy = {
    day_id: 'mon',
    day_name_fr: 'Lundi',
    day_name_derja: 'El Ethnin',
    day_name_ar: 'الإثنين',
    lunch_recipe_id: 'rec_ojja_merguez',
    dinner_recipe_id: 'rec_slata_tounsia',
  } as unknown as DayPlan;

  it('a main dish goes to the main course slot, a starter to the starter slot', () => {
    const day = migrateDayPlan(legacy, initialRecipes);
    expect(day.lunch).toEqual({ plat_id: 'rec_ojja_merguez' });
    expect(day.dinner).toEqual({ entree_id: 'rec_slata_tounsia' });
    expect('lunch_recipe_id' in day).toBe(false);
    // The dinner is flagged: it has a starter but no main course
    expect(countMealsWithoutMain([day])).toBe(1);
  });

  it('a v2 day is left untouched', () => {
    const day = defaultWeeklyPlan[0];
    expect(migrateDayPlan(day, initialRecipes)).toEqual(day);
  });
});

describe('grocery list and filters', () => {
  it('collects starter, main and dessert of every meal', () => {
    const ids = collectRecipeIds([
      { ...defaultWeeklyPlan[0], lunch: { plat_id: 'a', entree_id: 'b', dessert_id: 'c' }, dinner: { plat_id: 'd' } },
    ]);
    expect(ids.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('healthy filter and course filter in the recipe browser', () => {
    const healthy = matchRecipes(initialRecipes, [], { healthyOnly: true });
    expect(healthy.ideas.length).toBeGreaterThan(0);
    for (const r of healthy.ideas) expect(r.recipe.is_healthy).toBe(true);

    const desserts = matchRecipes(initialRecipes, [], { category: 'dessert' });
    expect(desserts.ideas.length).toBe(initialRecipes.filter((r) => r.category === 'dessert').length);
    for (const r of desserts.ideas) expect(r.recipe.category).toBe('dessert');
  });
});
