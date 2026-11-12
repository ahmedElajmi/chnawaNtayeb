import {
  CatalogStore,
  KitchenStore,
  MatchingScenariosStore,
  MatchingSettingsStore,
  PatronStore,
  RecipeDrafts,
} from '@/application';
import { localCatalogRepository, localKitchenRepository } from '@/infrastructure/local/localRepositories';
import { localMatchingSettingsCache } from '@/infrastructure/local/localMatchingSettingsCache';
import { localPreferences } from '@/infrastructure/local/localPreferences';
import { localRecipeDrafts } from '@/infrastructure/local/localRecipeDrafts';
import { firestoreCatalogSource } from '@/infrastructure/firebase/firestoreCatalogSource';
import { firestoreCatalogAdmin } from '@/infrastructure/firebase/catalogSync';
import { firestoreMatchingScenarios } from '@/infrastructure/firebase/firestoreMatchingScenarios';
import { firestoreMatchingSettings } from '@/infrastructure/firebase/firestoreMatchingSettings';
import { firestoreThemeRepository } from '@/infrastructure/firebase/themes';
import { firebaseUserAuth } from '@/infrastructure/firebase/userAuth';
import { patronHttpGateway } from '@/infrastructure/http/patronHttpGateway';
import { visionHttpGateway } from '@/infrastructure/http/visionHttpGateway';

/**
 * Composition root: the only place that knows which adapter implements which port.
 * To change backend (e.g. leave Firestore), write new adapters and swap them here.
 */
export function createContainer() {
  return {
    // Stores (state shared by the screens)
    catalog: new CatalogStore(localCatalogRepository, firestoreCatalogSource),
    kitchen: new KitchenStore(localKitchenRepository),
    patron: new PatronStore(patronHttpGateway),
    matchingSettings: new MatchingSettingsStore(firestoreMatchingSettings, localMatchingSettingsCache),
    matchingScenarios: new MatchingScenariosStore(firestoreMatchingScenarios, {
      randomSuffix: () => crypto.randomUUID().slice(0, 6),
      now: () => new Date().toISOString(),
    }),
    // Services (ports used directly by a screen)
    preferences: localPreferences,
    themes: firestoreThemeRepository,
    userAuth: firebaseUserAuth,
    catalogAdmin: firestoreCatalogAdmin,
    vision: visionHttpGateway,
    recipeDrafts: new RecipeDrafts(localRecipeDrafts, () => new Date().toISOString()),
  };
}

export type Container = ReturnType<typeof createContainer>;
