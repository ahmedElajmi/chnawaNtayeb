import {
  CatalogAdmin,
  CatalogSearch,
  CatalogStore,
  KitchenStore,
  MatchingScenariosStore,
  MatchingSettingsStore,
  PatronStore,
  RecipeDrafts,
  ReviewBoard,
  ReviewSettingsStore,
  TeamStore,
  SyncedCollectionStore,
} from '@/application';
import { ADMIN_ROLE_ID, DEFAULT_ROLES, parseWorkCopies, type RoleDefinition, type WorkCopy } from '@/core/review';
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
import { createFirestoreReviewWorkspace } from '@/infrastructure/firebase/firestoreReviewWorkspace';
import { firestoreReviewSettings } from '@/infrastructure/firebase/firestoreReviewSettings';
import { firestoreTeam } from '@/infrastructure/firebase/firestoreTeam';
import { firebaseUserAuth } from '@/infrastructure/firebase/userAuth';
import { patronHttpGateway } from '@/infrastructure/http/patronHttpGateway';
import { visionHttpGateway } from '@/infrastructure/http/visionHttpGateway';
import { createMiniSearchEngine } from '@/infrastructure/minisearch/miniSearchEngine';

/** Rights of an account that is neither the patron nor a member of the team. */
const NO_RIGHTS: RoleDefinition = { id: 'none', label: {}, permissions: [] };

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

  // Validation workflow: private workspaces (admin only, started from the backoffice)
  const recipesWorkspace = createFirestoreReviewWorkspace<'recipe'>('recipes');
  const ingredientsWorkspace = createFirestoreReviewWorkspace<'ingredient'>('ingredients');
  const patron = new PatronStore(patronHttpGateway, () => catalogAdmin.seedIfEmpty());
  const reviewSettings = new ReviewSettingsStore(firestoreReviewSettings);
  const team = new TeamStore(firestoreTeam, { now, roles: () => reviewSettings.getState().settings.roles });
  const adminRole = DEFAULT_ROLES.find((r) => r.id === ADMIN_ROLE_ID)!;
  const review = new ReviewBoard({
    settings: reviewSettings,
    catalog,
    recipes: {
      workspace: new SyncedCollectionStore<WorkCopy<'recipe'>>({
        source: recipesWorkspace.source,
        cache: createIndexedDbCollectionCache<WorkCopy<'recipe'>>('recipes_workspace'),
        read: parseWorkCopies('recipe'),
        builtIn: () => [],
        now,
        fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
      }),
      writer: recipesWorkspace.writer,
    },
    ingredients: {
      workspace: new SyncedCollectionStore<WorkCopy<'ingredient'>>({
        source: ingredientsWorkspace.source,
        cache: createIndexedDbCollectionCache<WorkCopy<'ingredient'>>('ingredients_workspace'),
        read: parseWorkCopies('ingredient'),
        builtIn: () => [],
        now,
        fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
      }),
      writer: ingredientsWorkspace.writer,
    },
    // The patron session is the admin; a team member acts with the role given by the admin
    actor: () => {
      if (patron.getState().status === 'signed-in') return { id: 'patron', role: adminRole };
      const me = team.getState().me;
      const role = team.myRole();
      return me && role ? { id: me.email || me.uid, role } : { id: 'nobody', role: NO_RIGHTS };
    },
    now,
  });
  const kitchen = new KitchenStore(localKitchenRepository);
  const catalogAdmin = new CatalogAdmin(catalog, firestoreRecipes.writer, firestoreIngredients.writer, kitchen, {
    cloudName: firestoreCloudName,
    newId: createId,
    nowIso: () => new Date().toISOString(),
  });

  return {
    // Stores (state shared by the screens)
    catalog,
    // Text search on the device copy of the catalog (swap the engines here, e.g. for a server one)
    search: new CatalogSearch(catalog, { recipes: createMiniSearchEngine(), ingredients: createMiniSearchEngine() }),
    kitchen,
    patron,
    team,
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
    // Validation workflow (workspaces, workflows, roles): followed only in the backoffice
    review,
    vision: visionHttpGateway,
    recipeDrafts: new RecipeDrafts(localRecipeDrafts, () => new Date().toISOString()),
  };
}

export type Container = ReturnType<typeof createContainer>;
