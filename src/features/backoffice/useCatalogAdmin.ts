import { useState } from 'react';
import { validateIngredient, type Ingredient, type PriceRange, type Recipe } from '@/core/catalog';
import type { WriteResult } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { downloadTextFile } from '@/shared/ui/download';
import { format } from './i18n/backofficeTexts';
import { useBackofficeText } from './i18n/useBackofficeText';

export type Notify = (message: string, isError?: boolean) => void;

/**
 * Catalog actions of the backoffice: each one goes through the CatalogAdmin service (shown at once
 * on this device, then sent live to the others by the database) and reports success or the cloud error.
 */
export function useCatalogAdmin(notify: Notify) {
  const { catalogAdmin } = useContainer();
  const { getRecipeName, getIngredientName } = useLanguage();
  const b = useBackofficeText();
  const [isSyncing, setIsSyncing] = useState(false);

  const report = (result: WriteResult, success: string) => (result.ok ? notify(success) : notify(result.error, true));
  const whileSyncing = async (action: () => Promise<void>) => {
    setIsSyncing(true);
    try {
      await action();
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    cloudName: catalogAdmin.cloudName,

    async saveRecipe(recipe: Recipe, success?: string) {
      const result = await catalogAdmin.saveRecipe(recipe);
      report(result, success ?? b.panRecipeSaved);
    },

    async deleteRecipe(recipe: Recipe) {
      if (!window.confirm(format(b.confirmDeleteRecipe, { name: getRecipeName(recipe) }))) return;
      const result = await catalogAdmin.deleteRecipe(recipe.id);
      report(result, b.recipeDeleted);
    },

    /** Saves the edited price ranges; returns false (nothing saved) when one of them is not valid. */
    async savePrices(ingredients: Ingredient[], prices: Record<string, PriceRange>): Promise<boolean> {
      const updated: Ingredient[] = [];
      for (const [id, range] of Object.entries(prices)) {
        const ingredient = ingredients.find((i) => i.id === id);
        if (!ingredient) continue;
        const checked = validateIngredient({ ...ingredient, price_min_tnd: range.min, price_max_tnd: range.max });
        if (!checked.ok) {
          notify(`${getIngredientName(ingredient)} : ${checked.error}`, true);
          return false;
        }
        updated.push(checked.value);
      }
      let failure: WriteResult | null = null;
      for (const ingredient of updated) {
        const result = await catalogAdmin.saveIngredient(ingredient);
        if (!result.ok) failure = result;
      }
      report(failure ?? { ok: true }, b.panPricesUpdated);
      return true;
    },

    async saveIngredient(ingredient: Ingredient) {
      const result = await catalogAdmin.saveIngredient(ingredient);
      report(result, b.panIngredientSaved);
    },

    async addIngredient(data: Omit<Ingredient, 'id'>) {
      const created = catalogAdmin.createIngredient(data);
      const result = await catalogAdmin.saveIngredient(created);
      report(result, b.panIngredientAdded);
    },

    pushAll: () => whileSyncing(async () => report(await catalogAdmin.pushAll(), b.panPushed)),

    pullFromCloud: () =>
      whileSyncing(async () => {
        try {
          catalogAdmin.pullFromCloud();
          notify(b.panPulled);
        } catch {
          notify(b.panPullError, true);
        }
      }),

    resetCloudCatalog: (builtInCount: number) =>
      whileSyncing(async () => {
        const ok = window.confirm(format(b.panResetCloudConfirm, { count: builtInCount }));
        if (!ok) return;
        const result = await catalogAdmin.resetCloudCatalog();
        if (result.ok && result.stats) {
          const { recipes, ingredients, deleted } = result.stats;
          notify(format(b.panResetCloudDone, { recipes, ingredients, deleted }));
        } else report(result, '');
      }),

    downloadBackup() {
      downloadTextFile(
        `chnowa-ntayeb-backup-${new Date().toISOString().slice(0, 10)}.json`,
        catalogAdmin.exportBackup()
      );
      notify(b.panBackupDownloaded);
    },

    async importBackup(file: File) {
      const result = catalogAdmin.importBackup(await file.text());
      if (!result.ok) {
        notify(b.panBackupUnreadable, true);
        return;
      }
      const skipped = result.skipped ? format(b.panBackupSkipped, { count: result.skipped }) : '';
      notify(
        format(b.panBackupRestored, { recipes: result.recipes, ingredients: result.ingredients, skipped }),
        result.skipped > 0
      );
    },

    resetLocalToDefaults() {
      if (!window.confirm(b.panResetLocalConfirm)) return;
      catalogAdmin.resetLocalToDefaults();
      notify(b.panResetLocalDone);
    },
  };
}

export type CatalogAdminActions = ReturnType<typeof useCatalogAdmin>;
