import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { RotateCcw } from 'lucide-react';
import type { Ingredient, Recipe } from '@/core/catalog';
import { itemStatus } from '@/core/review';
import { useCatalog, useSuperAdmin, useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { superAdminPath, SUPER_ADMIN_PAGES } from '@/shared/paths';
import { DashboardTab } from '../dashboard/DashboardTab';
import { DataTab } from '../data/DataTab';
import { IngredientsTab, type IngredientInfo } from '../ingredients/IngredientsTab';
import { RecipesTab, type RecipeRow } from '../recipes/RecipesTab';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { ThemeEditor } from '../themes/ThemeEditor';
import { useNotify } from './NotifyContext';
import { useRecipeEditor } from './RecipeEditorContext';
import { useIngredientEditor } from './IngredientEditorContext';
import { useAdmin } from './useAdmin';
import { TodoList } from '../review/TodoList';

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
    <div className="space-y-4">
      <TodoList />
      <DashboardTab
        recipes={recipes}
        ingredients={ingredients}
        onAddRecipe={addRecipe}
        onOpenIngredients={() => navigate(superAdminPath(SUPER_ADMIN_PAGES.ingredients))}
        onDownloadBackup={admin.downloadBackup}
      />
    </div>
  );
}

export function RecipesPage() {
  const { recipes } = useCatalog();
  const { entries, workflow, store } = useReview('recipe');
  const { getRecipeName } = useLanguage();
  const b = useBackofficeText();
  const notify = useNotify();
  const admin = useAdmin();
  const { addRecipe, editRecipe, duplicateRecipe } = useRecipeEditor();

  // Work copies first (what the team edits), then the recipes online that never went through the workspace
  const rows = useMemo<RecipeRow[]>(() => {
    const inWorkspace = new Set(entries.map((e) => e.copy.id));
    return [
      ...entries.map((e) => ({
        recipe: e.copy.content,
        snapshot: e.snapshot,
        status: itemStatus(e.snapshot, e.online, e.pending),
        completeness: store.completeness(e.copy.content),
      })),
      ...recipes
        .filter((r) => !inWorkspace.has(r.id))
        .map((recipe) => ({
          recipe,
          status: recipe.is_published === false ? ('ready' as const) : ('online' as const),
          completeness: store.completeness(recipe),
        })),
    ];
    // The workflow changes the completeness checks
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, recipes, store, workflow]);

  const remove = async (recipe: Recipe) => {
    if (!entries.some((e) => e.copy.id === recipe.id)) return admin.deleteRecipe(recipe);
    if (!window.confirm(format(b.confirmDeleteRecipe, { name: getRecipeName(recipe) }))) return;
    const result = await store.discard(recipe.id);
    notify(result.ok ? b.recipeDeleted : result.error, !result.ok);
  };

  return (
    <RecipesTab
      rows={rows}
      workflow={workflow}
      onAddRecipe={addRecipe}
      onEditRecipe={editRecipe}
      onDuplicateRecipe={duplicateRecipe}
      onDeleteRecipe={remove}
    />
  );
}

export function IngredientsPage() {
  const { recipes } = useCatalog();
  const { entries, store, workflow } = useReview('ingredient');
  const { ingredients } = useIngredientEditor();
  const infoOf = useMemo(() => {
    const byId = new Map(entries.map((e) => [e.copy.id, e]));
    return (ingredient: Ingredient): IngredientInfo => {
      const entry = byId.get(ingredient.id);
      return {
        status: entry ? itemStatus(entry.snapshot, entry.online, entry.pending) : 'online',
        snapshot: entry?.snapshot,
        completeness: store.completeness(ingredient),
      };
    };
    // The workflow changes the completeness checks
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, store, workflow]);
  return <IngredientsTab ingredients={ingredients} recipes={recipes} infoOf={infoOf} />;
}

export function AppearancePage() {
  return <ThemeEditor onNotify={useNotify()} />;
}

/** Sends every recipe back to review and takes them off the site (see ReviewStore.resetAllForReview). */
function ReviewResetCard() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { store, entries } = useReview('recipe');
  const { recipes } = useCatalog();
  const [progress, setProgress] = useState<string | null>(null);
  const busy = progress !== null;
  const count = new Set([...entries.map((e) => e.copy.id), ...recipes.map((r) => r.id)]).size;
  return (
    <div className="p-5 rounded-2xl bg-card border border-line space-y-3">
      <h3 className="text-sm font-bold text-ink flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-brand-text" />
        {b.resetTitle}
      </h3>
      <p className="text-xs text-ink-muted leading-relaxed">{b.resetHint}</p>
      <button
        type="button"
        disabled={busy || count === 0}
        onClick={async () => {
          if (!window.confirm(format(b.resetConfirm, { count }))) return;
          setProgress('…');
          const result = await store.resetAllForReview((done, total) => setProgress(`${done} / ${total}`));
          setProgress(null);
          if (!('reset' in result)) return notify(result.ok ? '' : result.error, true);
          notify(
            result.failed
              ? format(b.resetFailed, { failed: result.failed })
              : format(b.resetDone, { count: result.reset, offline: result.unpublished ?? 0 }),
            !!result.failed
          );
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold disabled:opacity-50"
      >
        {b.resetButton}
        {progress && <span className="tabular-nums opacity-90">({progress})</span>}
      </button>
    </div>
  );
}

export function DataPage() {
  const admin = useAdmin();
  const { cloudStatus } = useSuperAdmin();
  return (
    <div className="space-y-4">
      <ReviewResetCard />
      <DataTab admin={admin} cloudStatus={cloudStatus} />
    </div>
  );
}
