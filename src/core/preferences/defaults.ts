import { isLanguage } from '../shared/language';
import type { UserPreferences } from './types';
import { DEFAULT_THEME_ID } from '../theme/builtinThemes';

/** Ingredients most Tunisian kitchens always have. Editable by the user from the fridge screen. */
export const DEFAULT_PANTRY_STAPLES = [
  'ing_sel_poivre',
  'ing_huile_olive',
  'ing_tabel_karwiya',
  'ing_harissa',
  'ing_ail',
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'derja',
  default_servings: 4,
  mode: 'system',
  themeId: DEFAULT_THEME_ID,
  pantryStaples: DEFAULT_PANTRY_STAPLES,
  dietary_filter: 'all',
};

/** Repairs preferences read from storage (old formats, missing or invalid fields). */
export function normalizePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFERENCES;
  const parsed = { ...(raw as Record<string, unknown>) };
  // v1 stored `theme: 'light' | 'dark'` instead of `mode`
  if (!parsed.mode && (parsed.theme === 'light' || parsed.theme === 'dark')) parsed.mode = parsed.theme;
  delete parsed.theme;
  const prefs = { ...DEFAULT_PREFERENCES, ...parsed } as UserPreferences;
  if (!Array.isArray(prefs.pantryStaples)) prefs.pantryStaples = DEFAULT_PANTRY_STAPLES;
  if (!['light', 'dark', 'system'].includes(prefs.mode)) prefs.mode = 'system';
  if (typeof prefs.themeId !== 'string') prefs.themeId = DEFAULT_THEME_ID;
  if (!isLanguage(prefs.language)) prefs.language = DEFAULT_PREFERENCES.language;
  return prefs;
}
