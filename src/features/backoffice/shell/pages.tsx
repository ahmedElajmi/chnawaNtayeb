import { useNavigate } from 'react-router';
import { useCatalog, usePatron } from '@/app/ContainerContext';
import { patronPath, PATRON_PAGES } from '@/shared/paths';
import { DashboardTab } from '../dashboard/DashboardTab';
import { DataTab } from '../data/DataTab';
import { IngredientsTab } from '../ingredients/IngredientsTab';
import { RecipesTab } from '../recipes/RecipesTab';
import { ThemeEditor } from '../themes/ThemeEditor';
import { useNotify } from './NotifyContext';
import { useRecipeEditor } from './RecipeEditorContext';
import { useAdmin } from './useAdmin';

/*
 * Backoffice pages: each one gathers what its panel needs from the shared context (catalog,
 * messages, recipe editor) so the panels themselves are moved, not rewritten.
 */

export function HomePage() {
  const navigate = useNavigate();
  const { recipes, ingredients } = useCatalog();
  const admin = useAdmin();
  const { addRecipe } = useRecipeEditor();
  return (
    <DashboardTab
      recipes={recipes}
      ingredients={ingredients}
      onAddRecipe={addRecipe}
      onOpenIngredients={() => navigate(patronPath(PATRON_PAGES.ingredients))}
      onDownloadBackup={admin.downloadBackup}
    />
  );
}

export function RecipesPage() {
  const { recipes } = useCatalog();
  const admin = useAdmin();
  const { addRecipe, editRecipe, duplicateRecipe } = useRecipeEditor();
  return (
    <RecipesTab
      recipes={recipes}
      admin={admin}
      onAddRecipe={addRecipe}
      onEditRecipe={editRecipe}
      onDuplicateRecipe={duplicateRecipe}
    />
  );
}

export function IngredientsPage() {
  const { recipes, ingredients } = useCatalog();
  const admin = useAdmin();
  return <IngredientsTab ingredients={ingredients} recipes={recipes} admin={admin} />;
}

export function AppearancePage() {
  return <ThemeEditor onNotify={useNotify()} />;
}

export function DataPage() {
  const admin = useAdmin();
  const { cloudStatus } = usePatron();
  return <DataTab admin={admin} cloudStatus={cloudStatus} />;
}
