import type { PreferencesRepository } from '@/application';
import { storage } from '@/infrastructure/local/storage';

/** Preferences of this device (language, theme, pantry). */
export const localPreferences: PreferencesRepository = {
  load: () => storage.getPreferences(),
  save: (patch) => void storage.savePreferences(patch),
};
