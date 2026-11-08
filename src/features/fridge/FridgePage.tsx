import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { getUsedIngredientIds } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { FridgeSelector } from '@/features/fridge/components/FridgeSelector';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useRecipesHref } from '@/features/recipes/filterMemory';

export function FridgePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const recipesHref = useRecipesHref();
  const { recipes, ingredients, catalog } = useCatalog();
  const { fridge, pantry, kitchen } = useKitchen();
  // Ingredients used by at least one published recipe, directly or as a substitute
  const usedIngredientIds = useMemo(() => getUsedIngredientIds(recipes), [recipes]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl bg-card border border-line shadow-xs">
        <h1 className="text-lg sm:text-xl font-extrabold text-ink">{t.fridgeTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.fridgeSubtitle}</p>
      </div>

      <FridgeSelector
        allIngredients={ingredients}
        selectedIds={fridge}
        pantryIds={pantry}
        onTogglePantry={(id) => kitchen.togglePantryItem(id)}
        usedIngredientIds={usedIngredientIds}
        onToggleIngredient={(id) => kitchen.toggleFridgeItem(id)}
        onClearAll={() => kitchen.clearFridge()}
        onAddCustomIngredient={(name, category) =>
          kitchen.toggleFridgeItem(catalog.addCustomIngredient(name, category).id)
        }
        onSearchRecipes={() => navigate(recipesHref())}
      />
    </div>
  );
}
