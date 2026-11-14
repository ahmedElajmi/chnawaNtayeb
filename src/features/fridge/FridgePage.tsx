import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { getUsedIngredientIds } from '@/core/catalog';
import type { NewGroceryItem } from '@/core/grocery';
import { useLanguage } from '@/app/providers/LanguageContext';
import { FridgeSelector } from '@/features/fridge/components/FridgeSelector';
import { GroceryListChip } from '@/features/fridge/components/GroceryListChip';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useRecipesHref } from '@/features/recipes/filterMemory';
import { PATHS } from '@/shared/paths';

export function FridgePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const suggestionsHref = useRecipesHref(PATHS.suggestions);
  const { recipes, ingredients } = useCatalog();
  const { fridge, pantry, kitchen } = useKitchen();
  // Ingredients used by at least one published recipe, directly or as a substitute
  const usedIngredientIds = useMemo(() => getUsedIngredientIds(recipes), [recipes]);

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
        onAddToGrocery={(item: NewGroceryItem) => kitchen.addGroceryItems([item])}
      />
    </div>
  );
}
