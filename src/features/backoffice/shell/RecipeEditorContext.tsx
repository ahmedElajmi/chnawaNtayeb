import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Recipe } from '@/core/catalog';
import { useCatalog } from '@/app/ContainerContext';
import { RecipeEditorModal } from '../recipes/RecipeEditorModal';
import { duplicateRecipeDraft, newRecipeDraft } from '../recipes/recipeDraft';
import { useAdmin } from './useAdmin';

interface RecipeEditorActions {
  addRecipe: () => void;
  editRecipe: (recipe: Recipe) => void;
  /** Opens the editor on a copy of the recipe (new, unpublished) */
  duplicateRecipe: (recipe: Recipe) => void;
}

const RecipeEditorContext = createContext<RecipeEditorActions | null>(null);

/** The recipe editor, opened from any backoffice page (home, recipe list, later the review queue). */
export function RecipeEditorProvider({ children }: { children: ReactNode }) {
  const { recipes, ingredients } = useCatalog();
  const admin = useAdmin();
  const [editing, setEditing] = useState<{ recipe: Recipe; isNew: boolean } | null>(null);

  const actions = useMemo<RecipeEditorActions>(
    () => ({
      addRecipe: () => setEditing({ recipe: newRecipeDraft(), isNew: true }),
      editRecipe: (recipe) => setEditing({ recipe, isNew: false }),
      duplicateRecipe: (recipe) => setEditing({ recipe: duplicateRecipeDraft(recipe), isNew: true }),
    }),
    []
  );

  return (
    <RecipeEditorContext.Provider value={actions}>
      {children}
      {editing && (
        <RecipeEditorModal
          recipe={editing.recipe}
          isNew={editing.isNew}
          recipes={recipes}
          ingredients={ingredients}
          onClose={() => setEditing(null)}
          onSave={async (recipe) => {
            setEditing(null);
            await admin.saveRecipe(recipe);
          }}
        />
      )}
    </RecipeEditorContext.Provider>
  );
}

export function useRecipeEditor(): RecipeEditorActions {
  const actions = useContext(RecipeEditorContext);
  if (!actions) throw new Error('useRecipeEditor must be used inside RecipeEditorProvider');
  return actions;
}
