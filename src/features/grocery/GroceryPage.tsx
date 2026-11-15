import { useMemo } from 'react';
import { GroceryListView } from '@/features/grocery/components/GroceryListView';
import { GroceryHistoryPanel } from '@/features/grocery/components/GroceryHistoryPanel';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

export function GroceryPage() {
  const { groceryLists, kitchen } = useKitchen();
  const { ingredients } = useCatalog();
  const { getIngredientName } = useLanguage();
  const ingredientsById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const activeList = kitchen.activeGroceryList();

  return (
    <div className="space-y-6">
      <GroceryListView
        lists={groceryLists}
        activeList={activeList}
        ingredientsById={ingredientsById}
        ingredients={ingredients}
        onSwitchList={(id) => kitchen.setActiveGroceryList(id)}
        onCreateList={(name) => kitchen.createGroceryList(name)}
        onRenameList={(name) => kitchen.renameGroceryList(activeList.id, name)}
        onDuplicateList={() => kitchen.duplicateGroceryList(activeList.id)}
        onDeleteList={() => kitchen.deleteGroceryList(activeList.id)}
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
        onAddCustom={(name, unit) => kitchen.addGroceryItems([{ name, quantity: 1, unit, is_custom: true }])}
        onSetNote={(note) => kitchen.setGroceryNote(note)}
        onSetSpent={(spent) => kitchen.setGrocerySpent(spent)}
        onClearList={() => kitchen.clearGroceryList()}
      />
      <GroceryHistoryPanel />
    </div>
  );
}
