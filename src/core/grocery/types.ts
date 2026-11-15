import type { IngredientCategory } from '../catalog/types';

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

/** One named shopping list of the user's kitchen (there may be several). */
export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  /** Free note attached to this list (synced with it). */
  note: string;
  /** Amount actually spent on this run, entered by the user (null = not entered yet). */
  spent_tnd: number | null;
}
