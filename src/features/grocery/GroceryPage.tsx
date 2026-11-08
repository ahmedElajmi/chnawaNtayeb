import { GroceryListView } from '@/features/grocery/components/GroceryListView';
import { useKitchen } from '@/app/ContainerContext';

export function GroceryPage() {
  const { groceryList, kitchen } = useKitchen();

  return (
    <GroceryListView
      items={groceryList}
      onToggleItem={(id) => kitchen.toggleGroceryItem(id)}
      onAddItem={(name, quantity, unit) => kitchen.addGroceryItems([{ name, quantity, unit }])}
      onClearChecked={() => kitchen.clearCheckedGroceryItems()}
    />
  );
}
