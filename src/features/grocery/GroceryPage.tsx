import { useMemo } from 'react';
import { GroceryListView } from '@/features/grocery/components/GroceryListView';
import { GroceryHistoryPanel } from '@/features/grocery/components/GroceryHistoryPanel';
import { useCatalog, useKitchen } from '@/app/ContainerContext';

export function GroceryPage() {
  const { groceryList, groceryNote, grocerySpent, kitchen } = useKitchen();
  const { ingredients } = useCatalog();
  const ingredientsById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  return (
    <div className="space-y-6">
      <GroceryListView
        items={groceryList}
        note={groceryNote}
        spent={grocerySpent}
        ingredientsById={ingredientsById}
        onToggleItem={(id) => kitchen.toggleGroceryItem(id)}
        onRemoveItem={(id) => kitchen.removeGroceryItem(id)}
        onSetQuantity={(id, quantity) => kitchen.setGroceryItemQuantity(id, quantity)}
        onAddItem={(name, quantity, unit) => kitchen.addGroceryItems([{ name, quantity, unit }])}
        onSetNote={(note) => kitchen.setGroceryNote(note)}
        onSetSpent={(spent) => kitchen.setGrocerySpent(spent)}
        onClearList={() => kitchen.clearGroceryList()}
      />
      <GroceryHistoryPanel />
    </div>
  );
}
