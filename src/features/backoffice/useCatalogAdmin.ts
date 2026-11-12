import { useState } from 'react';
import { validateIngredient, type Ingredient, type PriceRange, type Recipe } from '@/core/catalog';
import type { WriteResult } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import { downloadTextFile } from '@/shared/ui/download';

export type Notify = (message: string, isError?: boolean) => void;

/**
 * Catalog actions of the backoffice: each one goes through the CatalogAdmin service (shown at once
 * on this device, then sent live to the others by the database) and reports success or the cloud error.
 */
export function useCatalogAdmin(notify: Notify) {
  const { catalogAdmin } = useContainer();
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

    async saveRecipe(recipe: Recipe, success = 'Recette enregistrée et synchronisée') {
      const result = await catalogAdmin.saveRecipe(recipe);
      report(result, success);
    },

    async deleteRecipe(recipe: Recipe) {
      if (!window.confirm(`Confirmer la suppression de "${recipe.name_fr}" ?`)) return;
      const result = await catalogAdmin.deleteRecipe(recipe.id);
      report(result, 'Recette supprimée');
    },

    /** Saves the edited price ranges; returns false (nothing saved) when one of them is not valid. */
    async savePrices(ingredients: Ingredient[], prices: Record<string, PriceRange>): Promise<boolean> {
      const updated: Ingredient[] = [];
      for (const [id, range] of Object.entries(prices)) {
        const ingredient = ingredients.find((i) => i.id === id);
        if (!ingredient) continue;
        const checked = validateIngredient({ ...ingredient, price_min_tnd: range.min, price_max_tnd: range.max });
        if (!checked.ok) {
          notify(`${ingredient.name_fr} : ${checked.error}`, true);
          return false;
        }
        updated.push(checked.value);
      }
      let failure: WriteResult | null = null;
      for (const ingredient of updated) {
        const result = await catalogAdmin.saveIngredient(ingredient);
        if (!result.ok) failure = result;
      }
      report(failure ?? { ok: true }, 'Prix du marché mis à jour');
      return true;
    },

    async saveIngredient(ingredient: Ingredient) {
      const result = await catalogAdmin.saveIngredient(ingredient);
      report(result, 'Ingrédient enregistré et synchronisé');
    },

    async addIngredient(data: Omit<Ingredient, 'id'>) {
      const created = catalogAdmin.createIngredient(data);
      const result = await catalogAdmin.saveIngredient(created);
      report(result, 'Nouvel ingrédient ajouté au catalogue');
    },

    pushAll: () =>
      whileSyncing(async () => report(await catalogAdmin.pushAll(), 'Recettes et ingrédients envoyés vers le cloud')),

    pullFromCloud: () =>
      whileSyncing(async () => {
        try {
          catalogAdmin.pullFromCloud();
          notify('Recettes et ingrédients rechargés depuis le cloud');
        } catch {
          notify('Erreur lors de la récupération depuis le cloud.', true);
        }
      }),

    resetCloudCatalog: (builtInCount: number) =>
      whileSyncing(async () => {
        const ok = window.confirm(
          `Initialiser la base avec le catalogue intégré (${builtInCount} recettes) ?\n\n` +
            '- Les recettes et ingrédients du catalogue remplacent ceux du cloud.\n' +
            '- Les recettes et ingrédients du cloud absents du catalogue sont supprimés.\n\n' +
            'Pensez à télécharger une sauvegarde JSON avant.'
        );
        if (!ok) return;
        const result = await catalogAdmin.resetCloudCatalog();
        if (result.ok && result.stats) {
          const { recipes, ingredients, deleted } = result.stats;
          notify(
            `Base initialisée : ${recipes} recettes, ${ingredients} ingrédients, ${deleted} anciens éléments supprimés`
          );
        } else report(result, '');
      }),

    downloadBackup() {
      downloadTextFile(
        `chnowa-ntayeb-backup-${new Date().toISOString().slice(0, 10)}.json`,
        catalogAdmin.exportBackup()
      );
      notify('Sauvegarde JSON téléchargée !');
    },

    async importBackup(file: File) {
      const result = catalogAdmin.importBackup(await file.text());
      if (!result.ok) {
        notify("Ce fichier n'est pas une sauvegarde Chnowa Ntayeb lisible.", true);
        return;
      }
      const skipped = result.skipped ? ` ${result.skipped} élément(s) illisible(s) ignoré(s).` : '';
      notify(
        `Sauvegarde restaurée sur cet appareil : ${result.recipes} recettes, ${result.ingredients} ingrédients.${skipped} ` +
          'Utilisez « Envoyer vers le cloud » pour la publier.',
        result.skipped > 0
      );
    },

    resetLocalToDefaults() {
      if (!window.confirm('Voulez-vous vraiment restaurer le catalogue de recettes tunisiennes par défaut ?')) return;
      catalogAdmin.resetLocalToDefaults();
      notify('Catalogue réinitialisé avec succès !');
    },
  };
}

export type CatalogAdminActions = ReturnType<typeof useCatalogAdmin>;
