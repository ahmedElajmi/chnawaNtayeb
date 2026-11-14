import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUsedIngredientIds } from '@/core/catalog';
import type { NewGroceryItem } from '@/core/grocery';
import { useLanguage } from '@/app/providers/LanguageContext';
import { FridgeSelector } from '@/features/fridge/components/FridgeSelector';
import { GroceryListChip } from '@/features/fridge/components/GroceryListChip';
import { GroceryListChooserModal } from '@/shared/ui/GroceryListChooserModal';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { PATHS } from '@/shared/paths';

/** An ingredient waiting for its target list while the chooser is open. */
interface PendingAdd {
  item: NewGroceryItem;
  onDone: () => void;
}

export function FridgePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const suggestionsHref = useRecipesHref(PATHS.suggestions);
  const { recipes, ingredients } = useCatalog();
  const { fridge, pantry, groceryLists, kitchen } = useKitchen();
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  // Ingredients used by at least one published recipe, directly or as a substitute
  const usedIngredientIds = useMemo(() => getUsedIngredientIds(recipes), [recipes]);

  // Remaining counts for the chooser, computed on the full lists
  const listChoices = useMemo(
    () =>
      groceryLists.map((list) => ({
        id: list.id,
        name: list.name,
        remainingCount: list.items.filter((item) => !item.is_checked).length,
      })),
    [groceryLists]
  );

  const addToList = (item: NewGroceryItem, listId: string) => {
    kitchen.addGroceryItems([item], listId);
    kitchen.setActiveGroceryList(listId);
  };

  const handleAddToGrocery = (item: NewGroceryItem, onDone: () => void) => {
    // One list (or none): same behavior as before, straight into the active list.
    if (groceryLists.length <= 1) {
      kitchen.addGroceryItems([item]);
      onDone();
    } else {
      setPendingAdd({ item, onDone });
    }
  };

  const handleChooseList = (listId: string | null, newListName: string | null) => {
    const pending = pendingAdd;
    setPendingAdd(null);
    if (!pending) return;
    if (newListName) {
      // The new list is created and made active; its id comes from the store.
      kitchen.createGroceryList(newListName);
      addToList(pending.item, kitchen.getState().activeGroceryListId);
    } else if (listId) {
      addToList(pending.item, listId);
    } else {
      return; // window dismissed without a choice: nothing added, no confirmation
    }
    pending.onDone();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-card border border-line shadow-xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-ink">{t.fridgeTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.fridgeSubtitle}</p>
        </div>
        <GroceryListChip />
      </div>

      <FridgeSelector
        allIngredients={ingredients}
        selectedIds={fridge}
        pantryIds={pantry}
        onTogglePantry={(id) => kitchen.togglePantryItem(id)}
        usedIngredientIds={usedIngredientIds}
        onToggleIngredient={(id) => kitchen.toggleFridgeItem(id)}
        onClearAll={() => kitchen.clearFridge()}
        onSearchRecipes={() => navigate(suggestionsHref())}
        onAddToGrocery={handleAddToGrocery}
      />

      {/* Target shopping list, asked only when the user keeps several */}
      <GroceryListChooserModal
        open={pendingAdd !== null}
        onClose={() => setPendingAdd(null)}
        lists={listChoices}
        onChoose={handleChooseList}
        title={t.chooseListTitle}
      />
    </div>
  );
}
