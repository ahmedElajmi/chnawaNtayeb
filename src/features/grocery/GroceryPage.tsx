import { useMemo } from 'react';
import { GroceryListView } from '@/features/grocery/components/GroceryListView';
import { useCatalog, useKitchen } from '@/app/ContainerContext';

export function GroceryPage() {
  const { groceryList, kitchen } = useKitchen();
  const { ingredients } = useCatalog();
  const ingredientsById = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  return (
    <GroceryListView
      items={groceryList}
      ingredientsById={ingredientsById}
      onToggleItem={(id) => kitchen.toggleGroceryItem(id)}
      onAddItem={(name, quantity, unit) => kitchen.addGroceryItems([{ name, quantity, unit }])}
      onClearChecked={() => kitchen.clearCheckedGroceryItems()}
    />
  );
}
