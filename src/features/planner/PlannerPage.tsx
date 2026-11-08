import { useNavigate } from 'react-router';
import { WeeklyPlannerView } from '@/features/planner/components/WeeklyPlannerView';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useOpenRecipe } from '@/features/recipes/hooks';
import { PATHS } from '@/shared/paths';

export function PlannerPage() {
  const navigate = useNavigate();
  const { recipes, ingredients } = useCatalog();
  const { weeklyPlan, kitchen } = useKitchen();
  const openRecipe = useOpenRecipe();

  return (
    <WeeklyPlannerView
      plan={weeklyPlan}
      recipes={recipes}
      allIngredients={ingredients}
      onUpdatePlan={(plan) => kitchen.setWeeklyPlan(plan)}
      onGenerateGroceryList={() => {
        kitchen.generateGroceryListFromPlan(recipes, ingredients);
        navigate(PATHS.grocery);
      }}
      onSelectRecipeDetail={openRecipe}
    />
  );
}
