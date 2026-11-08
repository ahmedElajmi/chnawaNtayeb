import { useState } from 'react';
import type { Ingredient, Recipe } from '@/core/catalog';
import type { WriteResult } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import { downloadTextFile } from '@/shared/ui/download';

export type Notify = (message: string, isError?: boolean) => void;

/**
 * Catalog actions of the backoffice: each one goes through the CatalogAdminGateway port,
 * refreshes the screens, and reports success or the cloud error.
 */
export function useCatalogAdmin(notify: Notify) {
  const { catalogAdmin, catalog, kitchen } = useContainer();
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = () => {
    catalog.reloadLocal();
    kitchen.reload();
  };
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
      refresh();
      report(result, success);
    },

    async deleteRecipe(recipe: Recipe) {
      if (!window.confirm(`Confirmer la suppression de "${recipe.name_fr}" ?`)) return;
      const result = await catalogAdmin.deleteRecipe(recipe.id);
      refresh();
      report(result, 'Recette supprimée');
    },

    async savePrices(ingredients: Ingredient[], prices: Record<string, number>) {
      let failure: WriteResult | null = null;
      for (const [id, price] of Object.entries(prices)) {
        const ingredient = ingredients.find((i) => i.id === id);
        if (!ingredient) continue;
        const result = await catalogAdmin.saveIngredient({ ...ingredient, default_price_tnd: price });
        if (!result.ok) failure = result;
      }
      refresh();
      report(failure ?? { ok: true }, 'Prix du marché mis à jour');
    },

    async addIngredient(data: Omit<Ingredient, 'id'>) {
      const created = catalogAdmin.createIngredient(data);
      const result = await catalogAdmin.saveIngredient(created);
      refresh();
      report(result, 'Nouvel ingrédient ajouté au catalogue');
    },

    pushAll: () =>
      whileSyncing(async () => report(await catalogAdmin.pushAll(), 'Recettes et ingrédients envoyés vers le cloud')),

    pullFromCloud: () =>
      whileSyncing(async () => {
        try {
          await catalogAdmin.pullFromCloud();
          refresh();
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
        refresh();
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
      if (catalogAdmin.importBackup(await file.text())) {
        refresh();
        notify('Données importées avec succès !');
      } else notify('Erreur lors de la lecture du fichier JSON.', true);
    },

    resetLocalToDefaults() {
      if (!window.confirm('Voulez-vous vraiment restaurer le catalogue de recettes tunisiennes par défaut ?')) return;
      catalogAdmin.resetLocalToDefaults();
      refresh();
      notify('Catalogue réinitialisé avec succès !');
    },
  };
}

export type CatalogAdminActions = ReturnType<typeof useCatalogAdmin>;
