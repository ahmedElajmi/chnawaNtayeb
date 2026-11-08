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
