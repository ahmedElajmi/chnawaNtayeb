import type { Ingredient, Recipe } from '../catalog/types';
import type { DayPlan } from '../planning/types';
import type { GroceryItem } from './types';
import { collectRecipeIds } from '../planning/planner';
import { createId, type IdFactory } from '../shared/id';

export interface NewGroceryItem {
  name: string;
  quantity?: number;
  unit?: string;
}

/**
 * Shopping list for a whole weekly menu: every ingredient of every planned dish
 * (starter, main course, dessert), quantities summed by ingredient name.
 */
export function buildGroceryListFromPlan(
  plan: DayPlan[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  newId: IdFactory = createId
): GroceryItem[] {
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const byName = new Map<string, Omit<GroceryItem, 'id' | 'is_checked'>>();

  for (const recipeId of collectRecipeIds(plan)) {
    const recipe = recipeById.get(recipeId);
    if (!recipe) continue;
    for (const item of recipe.ingredients) {
      const ingredient = ingredientById.get(item.ingredient_id);
      const name = ingredient ? ingredient.name_fr : item.ingredient_id;
      const current = byName.get(name);
      if (current) current.quantity += item.quantity_base;
      else
        byName.set(name, {
          name,
          quantity: item.quantity_base,
          unit: item.unit,
          category: ingredient ? ingredient.category : 'other',
        });
    }
  }

  return Array.from(byName.values()).map((item) => ({
    ...item,
    id: newId('grocery'),
    quantity: Math.round(item.quantity * 10) / 10,
    is_checked: false,
  }));
}

export function addGroceryItems(
  list: GroceryItem[],
  items: NewGroceryItem[],
  newId: IdFactory = createId
): GroceryItem[] {
  return [
    ...list,
    ...items.map((item): GroceryItem => ({
      id: newId('grocery'),
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? 'pièce',
      category: 'other',
      is_checked: false,
      is_custom: true,
    })),
  ];
}

export function toggleGroceryItem(list: GroceryItem[], id: string): GroceryItem[] {
  return list.map((item) => (item.id === id ? { ...item, is_checked: !item.is_checked } : item));
}

export function clearCheckedGroceryItems(list: GroceryItem[]): GroceryItem[] {
  return list.filter((item) => !item.is_checked);
}
