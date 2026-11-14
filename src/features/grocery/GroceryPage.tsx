import { useMemo } from 'react';
import { GroceryListView } from '@/features/grocery/components/GroceryListView';
import { GroceryHistoryPanel } from '@/features/grocery/components/GroceryHistoryPanel';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

export function GroceryPage() {
  const { groceryList, groceryNote, grocerySpent, kitchen } = useKitchen();
  const { ingredients } = useCatalog();
  const { getIngredientName } = useLanguage();
  const ingredientsById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  return (
    <div className="space-y-6">
      <GroceryListView
        items={groceryList}
        note={groceryNote}
        spent={grocerySpent}
        ingredientsById={ingredientsById}
        ingredients={ingredients}
        onToggleItem={(id) => kitchen.toggleGroceryItem(id)}
        onRemoveItem={(id) => kitchen.removeGroceryItem(id)}
        onSetQuantity={(id, quantity) => kitchen.setGroceryItemQuantity(id, quantity)}
        onSetUnit={(id, unit) => kitchen.setGroceryItemUnit(id, unit)}
        onAddIngredient={(ingredient) =>
          kitchen.addGroceryItems([
            {
              ingredient_id: ingredient.id,
              name: getIngredientName(ingredient),
              quantity: 1,
              unit: ingredient.unit_default,
              category: ingredient.category,
            },
          ])
        }
        onAddCustom={(name) => kitchen.addGroceryItems([{ name, quantity: 1, unit: 'pièce' }])}
        onSetNote={(note) => kitchen.setGroceryNote(note)}
        onSetSpent={(spent) => kitchen.setGrocerySpent(spent)}
        onClearList={() => kitchen.clearGroceryList()}
      />
      <GroceryHistoryPanel />
    </div>
  );
}
