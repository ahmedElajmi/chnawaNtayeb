import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { WeeklyPlannerView } from '@/features/planner/components/WeeklyPlannerView';
import { GroceryListChooserModal } from '@/shared/ui/GroceryListChooserModal';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useOpenRecipe } from '@/features/recipes/hooks';
import { PATHS } from '@/shared/paths';

export function PlannerPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { recipes, ingredients } = useCatalog();
  const { weeklyPlan, groceryLists, kitchen } = useKitchen();
  const [chooserOpen, setChooserOpen] = useState(false);
  const openRecipe = useOpenRecipe();

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

  const generateInto = (listId: string) => {
    kitchen.generateGroceryListFromPlan(recipes, ingredients, undefined, listId);
    kitchen.setActiveGroceryList(listId);
    navigate(PATHS.grocery);
  };

  const handleGenerateGroceryList = () => {
    // One list (or none): same behavior as before, straight into the active list.
    if (groceryLists.length <= 1) {
      generateInto(kitchen.getState().activeGroceryListId);
    } else {
      setChooserOpen(true);
    }
  };

  const handleChooseList = (listId: string | null, newListName: string | null) => {
    setChooserOpen(false);
    if (newListName) {
      // The new list is created and made active; its id comes from the store.
      kitchen.createGroceryList(newListName);
      generateInto(kitchen.getState().activeGroceryListId);
    } else if (listId) {
      generateInto(listId);
    }
  };

  return (
    <>
      <WeeklyPlannerView
        plan={weeklyPlan}
        recipes={recipes}
        allIngredients={ingredients}
        onUpdatePlan={(plan) => kitchen.setWeeklyPlan(plan)}
        onGenerateGroceryList={handleGenerateGroceryList}
        onSelectRecipeDetail={openRecipe}
      />

      {/* Target shopping list, asked only when the user keeps several */}
      <GroceryListChooserModal
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        lists={listChoices}
        onChoose={handleChooseList}
        title={t.chooseListTitle}
      />
    </>
  );
}
