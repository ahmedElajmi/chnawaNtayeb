import {
  CatalogAdmin,
  CatalogSearch,
  CatalogStore,
  CategoryStore,
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
import { AccountDirectoryStore, AccountProfileStore, CountriesStore } from '@/application';
import { ADMIN_ROLE_ID, DEFAULT_ROLES, parseWorkCopies, type RoleDefinition, type WorkCopy } from '@/core/review';
import {
  initialIngredients,
  parseStoredIngredients,
  parseStoredRecipes,
  type Ingredient,
  type Recipe,
} from '@/core/catalog';
import { createId } from '@/core/shared';
import { BUILT_IN_CATEGORIES, parseStoredCategories, type CategoryKind, type ContentCategory } from '@/core/categories';
import { initialCountries, parseStoredCountries, type CountryRecord } from '@/core/accounts';
import { localKitchenRepository } from '@/infrastructure/local/localRepositories';
import { localMatchingSettingsCache } from '@/infrastructure/local/localMatchingSettingsCache';
import { localPreferences } from '@/infrastructure/local/localPreferences';
import { localRecipeDrafts } from '@/infrastructure/local/localRecipeDrafts';
import { storage } from '@/infrastructure/local/storage';
import { createIndexedDbCollectionCache } from '@/infrastructure/indexeddb/indexedDbCollectionCache';
import {
  firestoreCloudName,
  firestoreCountries,
  firestoreIngredientCategories,
  firestoreIngredients,
  firestoreRecipeCategories,
  firestoreRecipes,
} from '@/infrastructure/firebase/firestoreCatalog';
import { firestoreMatchingScenarios } from '@/infrastructure/firebase/firestoreMatchingScenarios';
import { firestoreMatchingSettings } from '@/infrastructure/firebase/firestoreMatchingSettings';
import { firestoreThemeRepository } from '@/infrastructure/firebase/themes';
import { createFirestoreReviewWorkspace } from '@/infrastructure/firebase/firestoreReviewWorkspace';
import { firestoreReviewSettings } from '@/infrastructure/firebase/firestoreReviewSettings';
import { firestoreTeam } from '@/infrastructure/firebase/firestoreTeam';
import { firestoreAccountDirectory } from '@/infrastructure/firebase/firestoreAccountDirectory';
import { firebaseAccountProfile, firebaseUserAuth } from '@/infrastructure/firebase/userAuth';
import { accountHttpGateway } from '@/infrastructure/http/accountHttpGateway';
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
    // Only validated recipes are public: nothing is shown before the database answers
    builtIn: () => [],
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
  // Categories: public, followed like the catalog; edited by an account allowed to publish
  const canPublish = () => review.actor().role.permissions.includes('publish');
  const categoryStore = (
    kind: CategoryKind,
    adapter: typeof firestoreRecipeCategories,
    name: 'recipe_categories' | 'ingredient_categories'
  ) =>
    new CategoryStore(
      new SyncedCollectionStore<ContentCategory>({
        source: adapter.source,
        cache: createIndexedDbCollectionCache<ContentCategory>(name),
        read: parseStoredCategories,
        builtIn: () => [],
        now,
        fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
      }),
      adapter.writer,
      canPublish,
      BUILT_IN_CATEGORIES[kind]
    );
  // Countries: public, followed like the catalog; enabled/edited by an account allowed to publish
  const countriesCollection = new SyncedCollectionStore<CountryRecord>({
    source: firestoreCountries.source,
    cache: createIndexedDbCollectionCache<CountryRecord>('countries'),
    read: parseStoredCountries,
    builtIn: () => initialCountries,
    now,
    fullRefreshAfterMs: FULL_REFRESH_AFTER_MS,
  });
  const countries = new CountriesStore(countriesCollection, firestoreCountries.writer, canPublish);
  const accountProfile = new AccountProfileStore(firebaseAccountProfile, () => countries.getState().countries);
  const accountDirectory = new AccountDirectoryStore(firestoreAccountDirectory);

  const categories = {
    recipe: categoryStore('recipe', firestoreRecipeCategories, 'recipe_categories'),
    ingredient: categoryStore('ingredient', firestoreIngredientCategories, 'ingredient_categories'),
  };
  const kitchen = new KitchenStore(localKitchenRepository);
  const catalogAdmin = new CatalogAdmin(catalog, firestoreRecipes.writer, firestoreIngredients.writer, kitchen, {
    cloudName: firestoreCloudName,
    newId: createId,
    nowIso: () => new Date().toISOString(),
  });

  return {
    // Stores (state shared by the screens)
    catalog,
    categories,
    // Text search on the device copy of the catalog (swap the engines here, e.g. for a server one)
    search: new CatalogSearch(catalog, { recipes: createMiniSearchEngine(), ingredients: createMiniSearchEngine() }),
    kitchen,
    patron,
    team,
    countries,
    accountProfile,
    accountDirectory,
    matchingSettings: new MatchingSettingsStore(firestoreMatchingSettings, localMatchingSettingsCache),
    matchingScenarios: new MatchingScenariosStore(firestoreMatchingScenarios, {
      randomSuffix: () => crypto.randomUUID().slice(0, 6),
      now: () => new Date().toISOString(),
    }),
    // Services (ports used directly by a screen)
    preferences: localPreferences,
    themes: firestoreThemeRepository,
    userAuth: firebaseUserAuth,
    accountCreation: accountHttpGateway,
    catalogAdmin,
    // Validation workflow (workspaces, workflows, roles): followed only in the backoffice
    review,
    vision: visionHttpGateway,
    recipeDrafts: new RecipeDrafts(localRecipeDrafts, () => new Date().toISOString()),
  };
}

export type Container = ReturnType<typeof createContainer>;
