import {
  CatalogAdmin,
  CatalogStore,
  KitchenStore,
  MatchingScenariosStore,
  MatchingSettingsStore,
  PatronStore,
  RecipeDrafts,
  SyncedCollectionStore,
} from '@/application';
import {
  initialIngredients,
  initialRecipes,
  parseStoredIngredients,
  parseStoredRecipes,
  type Ingredient,
  type Recipe,
} from '@/core/catalog';
import { createId } from '@/core/shared';
import { localKitchenRepository } from '@/infrastructure/local/localRepositories';
import { localMatchingSettingsCache } from '@/infrastructure/local/localMatchingSettingsCache';
import { localPreferences } from '@/infrastructure/local/localPreferences';
import { localRecipeDrafts } from '@/infrastructure/local/localRecipeDrafts';
import { storage } from '@/infrastructure/local/storage';
import { createIndexedDbCollectionCache } from '@/infrastructure/indexeddb/indexedDbCollectionCache';
import { firestoreCloudName, firestoreIngredients, firestoreRecipes } from '@/infrastructure/firebase/firestoreCatalog';
import { firestoreMatchingScenarios } from '@/infrastructure/firebase/firestoreMatchingScenarios';
import { firestoreMatchingSettings } from '@/infrastructure/firebase/firestoreMatchingSettings';
import { firestoreThemeRepository } from '@/infrastructure/firebase/themes';
import { firebaseUserAuth } from '@/infrastructure/firebase/userAuth';
import { patronHttpGateway } from '@/infrastructure/http/patronHttpGateway';
import { visionHttpGateway } from '@/infrastructure/http/visionHttpGateway';

/** A device copy older than this is read again in full (deletion markers may have been purged). */
const FULL_REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

const legacyCatalog = (kind: 'recipes' | 'ingredients') => ({
  read: () => storage.readLegacyCatalog(kind),
  forget: () => storage.forgetLegacyCatalog(kind),
});

/**
 * Composition root: the only place that knows which adapter implements which port.
 * To change backend (e.g. leave Firestore), write new adapters and swap them here.
 */
export function createContainer() {
  const now = () => Date.now();
  const recipes = new SyncedCollectionStore<Recipe>({
    source: firestoreRecipes.source,
    cache: createIndexedDbCollectionCache<Recipe>('recipes', { legacy: legacyCatalog('recipes') }),
    read: parseStoredRecipes,
    builtIn: () => initialRecipes,
    now,
    fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
  });
  const ingredients = new SyncedCollectionStore<Ingredient>({
    source: firestoreIngredients.source,
    cache: createIndexedDbCollectionCache<Ingredient>('ingredients', { legacy: legacyCatalog('ingredients') }),
    read: parseStoredIngredients,
    builtIn: () => initialIngredients,
    now,
    fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
  });
  const catalog = new CatalogStore(recipes, ingredients);
  const kitchen = new KitchenStore(localKitchenRepository);
  const catalogAdmin = new CatalogAdmin(catalog, firestoreRecipes.writer, firestoreIngredients.writer, kitchen, {
    cloudName: firestoreCloudName,
    newId: createId,
    nowIso: () => new Date().toISOString(),
  });

  return {
    // Stores (state shared by the screens)
    catalog,
    kitchen,
    patron: new PatronStore(patronHttpGateway, () => catalogAdmin.seedIfEmpty()),
    matchingSettings: new MatchingSettingsStore(firestoreMatchingSettings, localMatchingSettingsCache),
    matchingScenarios: new MatchingScenariosStore(firestoreMatchingScenarios, {
      randomSuffix: () => crypto.randomUUID().slice(0, 6),
      now: () => new Date().toISOString(),
    }),
    // Services (ports used directly by a screen)
    preferences: localPreferences,
    themes: firestoreThemeRepository,
    userAuth: firebaseUserAuth,
    catalogAdmin,
    vision: visionHttpGateway,
    recipeDrafts: new RecipeDrafts(localRecipeDrafts, () => new Date().toISOString()),
  };
}

export type Container = ReturnType<typeof createContainer>;
