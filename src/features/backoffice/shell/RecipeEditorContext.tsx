import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { Recipe } from '@/core/catalog';
import { useCatalog, useReview } from '@/app/ContainerContext';
import { superAdminPath, SUPER_ADMIN_PAGES } from '@/shared/paths';
import { RecipeEditorModal } from '../recipes/RecipeEditorModal';
import { duplicateRecipeDraft, newRecipeDraft } from '../recipes/recipeDraft';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { cellLabel } from '../review/reviewUi';
import { useNotify } from './NotifyContext';

interface RecipeEditorActions {
  addRecipe: () => void;
  editRecipe: (recipe: Recipe) => void;
  /** Opens the editor on a copy of the recipe (new, unpublished) */
  duplicateRecipe: (recipe: Recipe) => void;
}

const RecipeEditorContext = createContext<RecipeEditorActions | null>(null);

/**
 * The recipe editor, opened from any backoffice page (home, recipe list, validation). Saving goes to
 * the validation workspace: nothing reaches the public before it is validated and published.
 */
export function RecipeEditorProvider({ children }: { children: ReactNode }) {
  const { recipes, ingredients } = useCatalog();
  const { entries, store } = useReview('recipe');
  const notify = useNotify();
  const navigate = useNavigate();
  const b = useBackofficeText();
  const [editing, setEditing] = useState<{ recipe: Recipe; isNew: boolean } | null>(null);

  const actions = useMemo<RecipeEditorActions>(
    () => ({
      addRecipe: () => setEditing({ recipe: newRecipeDraft(), isNew: true }),
      // The work copy is what the team edits (the version online when there is none yet)
      editRecipe: (recipe) => setEditing({ recipe, isNew: false }),
      duplicateRecipe: (recipe) => setEditing({ recipe: duplicateRecipeDraft(recipe), isNew: true }),
    }),
    []
  );

  const editingEntry = editing && entries.find((e) => e.copy.id === editing.recipe.id);
  const reviewNotes = editingEntry
    ? Object.entries(editingEntry.snapshot.cells)
        .filter(([, c]) => c.state === 'to_fix')
        .map(([cell]) => ({ label: cellLabel(b, 'recipe', cell), note: editingEntry.copy.decisions[cell]?.note ?? '' }))
    : [];
  // Addresses and slugs are unique among recipes online and in the workspace
  const known = useMemo(
    () => [...recipes, ...entries.map((e) => e.copy.content).filter((c) => !recipes.some((r) => r.id === c.id))],
    [recipes, entries]
  );

  return (
    <RecipeEditorContext.Provider value={actions}>
      {children}
      {editing && (
        <RecipeEditorModal
          recipe={editing.recipe}
          isNew={editing.isNew}
          recipes={known}
          ingredients={ingredients}
          reviewNotes={reviewNotes}
          reviewNotesTitle={b.reviewEditorNotes}
          onClose={() => setEditing(null)}
          onSave={async (recipe) => {
            setEditing(null);
            const result = await store.save(recipe);
            notify(result.ok ? b.reviewSaved : result.error, !result.ok);
            if (result.ok || result.local) navigate(superAdminPath(SUPER_ADMIN_PAGES.recipes, recipe.id));
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
