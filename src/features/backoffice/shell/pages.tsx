import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardCheck } from 'lucide-react';
import type { Recipe } from '@/core/catalog';
import { itemStatus } from '@/core/review';
import { useCatalog, usePatron, useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { patronPath, PATRON_PAGES } from '@/shared/paths';
import { DashboardTab } from '../dashboard/DashboardTab';
import { DataTab } from '../data/DataTab';
import { IngredientsTab } from '../ingredients/IngredientsTab';
import { RecipesTab, type RecipeRow } from '../recipes/RecipesTab';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
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
  const { entries, workflow, store } = useReview('recipe');
  const { getRecipeName } = useLanguage();
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
      })),
      ...recipes
        .filter((r) => !inWorkspace.has(r.id))
        .map((recipe) => ({
          recipe,
          status: recipe.is_published === false ? ('ready' as const) : ('online' as const),
        })),
    ];
  }, [entries, recipes]);

  const remove = async (recipe: Recipe) => {
    if (!entries.some((e) => e.copy.id === recipe.id)) return admin.deleteRecipe(recipe);
    if (!window.confirm(`Confirmer la suppression de "${getRecipeName(recipe)}" ?`)) return;
    const result = await store.discard(recipe.id);
    notify(result.ok ? 'Recette supprimée' : result.error, !result.ok);
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
  const { recipes, ingredients } = useCatalog();
  const admin = useAdmin();
  return <IngredientsTab ingredients={ingredients} recipes={recipes} admin={admin} />;
}

export function AppearancePage() {
  return <ThemeEditor onNotify={useNotify()} />;
}

/** First switch to the validation workflow: the recipes online get their work copy (see ReviewStore.importPublished). */
function ReviewImportCard() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { store } = useReview('recipe');
  const [busy, setBusy] = useState(false);
  return (
    <div className="p-5 rounded-2xl bg-card border border-line space-y-3">
      <h3 className="text-sm font-bold text-ink flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-brand-text" />
        {b.reviewImportTitle}
      </h3>
      <p className="text-xs text-ink-muted leading-relaxed">{b.reviewImportHint}</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await store.importPublished();
          setBusy(false);
          notify(result.ok ? format(b.reviewImported, { count: result.imported ?? 0 }) : result.error, !result.ok);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold disabled:opacity-50"
      >
        {b.reviewImport}
      </button>
    </div>
  );
}

export function DataPage() {
  const admin = useAdmin();
  const { cloudStatus } = usePatron();
  return (
    <div className="space-y-4">
      <ReviewImportCard />
      <DataTab admin={admin} cloudStatus={cloudStatus} />
    </div>
  );
}
