import type { Language } from '../shared/language';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: Language;
  default_servings: number;
  mode: ThemeMode;
  themeId: string;
  /** Ingredients considered always available at home (salt, oil, spices...) */
  pantryStaples: string[];
  dietary_filter?: 'all' | 'veggie' | 'economical' | 'quick';
}
