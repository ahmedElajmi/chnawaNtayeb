import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { RecipeDetailModal } from '@/features/recipes/components/RecipeDetailModal';
import type { NewGroceryItem } from '@/core/grocery';
import { useCatalog, useKitchen, useMatchingSettings } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { RecipeOverlayState } from './hooks';

/**
 * /recette/<slug>: the recipe opens on top of the screen it was opened from
 * (or on top of the recipe list when the address was opened directly).
 * Closing it goes back, so the phone's back button closes it too.
 */
export function RecipeDetailRoute({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { catalog, ingredients, remoteChecked } = useCatalog();
  const { fridge, pantry, favorites, groceryLists, kitchen } = useKitchen();
  const { config } = useMatchingSettings();
  const { getRecipeName } = useLanguage();
  const recipe = catalog.findPublishedBySlug(slug);
  const openedInApp = Boolean((location.state as RecipeOverlayState | null)?.background);

  useEffect(() => {
    if (!recipe) return;
    const previous = document.title;
    document.title = `${getRecipeName(recipe)} | Chnowa Ntayeb by Chef Souhed`;
    return () => {
      document.title = previous;
    };
  }, [recipe, getRecipeName]);

  // Unknown address: wait for the shared catalog (the recipe may be new), then show the list
  if (!recipe) return remoteChecked ? <Navigate to={PATHS.recipes} replace /> : null;

  const close = () => (openedInApp ? navigate(-1) : navigate(PATHS.recipes, { replace: true }));

  return (
    <RecipeDetailModal
      recipe={recipe}
      isOpen
      onClose={close}
      isFavorite={favorites.includes(recipe.id)}
      onToggleFavorite={(id) => kitchen.toggleFavorite(id)}
      allIngredients={ingredients}
      selectedFridgeIds={fridge}
      pantryIds={pantry}
      // Items carry ingredient_id and category so the grocery list merges them by ingredient
      // and shows them in their aisle; `category` rides along for the aisle grouping.
      // A new list is created (and made active) first, then the items go into it.
      onAddMissingToGrocery={(items, listId, newListName) => {
        if (newListName) {
          kitchen.createGroceryList(newListName);
          kitchen.addGroceryItems(items as NewGroceryItem[], kitchen.getState().activeGroceryListId);
        } else {
          kitchen.addGroceryItems(items as NewGroceryItem[], listId);
        }
        if (listId) kitchen.setActiveGroceryList(listId);
      }}
      groceryLists={groceryLists.map((list) => ({
        id: list.id,
        name: list.name,
        remainingCount: list.items.filter((item) => !item.is_checked).length,
      }))}
      matchingConfig={config}
    />
  );
}
