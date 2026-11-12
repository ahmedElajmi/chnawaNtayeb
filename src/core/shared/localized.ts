import { LANGUAGE_CODES, languageInfo, type Language } from './language';

/**
 * A text written in every content language. French, derja (Latin letters) and Arabic always exist
 * (possibly empty); newer variants (derja in Arabic letters) are optional.
 */
export type LocalizedText = { fr: string; derja: string; ar: string } & Partial<Record<Language, string>>;

/**
 * Text to display in the requested language. When that language is empty, the languages of its
 * fallback list are tried in order (see LANGUAGES); French is always among them.
 */
export function pickLocalized(language: Language, text: Partial<Record<Language, string>>): string {
  for (const lang of languageInfo(language).fallback) {
    const value = text[lang]?.trim();
    if (value) return value;
  }
  return '';
}

/** Languages whose texts are always stored, even empty (the others are left out when empty). */
const ALWAYS_STORED: readonly Language[] = ['fr', 'derja', 'ar'];

/**
 * Localized field of an object, read from its `<field>_<language>` properties
 * (`localizedField(recipe, 'name')` → `{ fr: recipe.name_fr, derja: …, ar: …, derja_ar: … }`).
 */
export function localizedField(item: object, field: string): LocalizedText {
  const source = item as Record<string, unknown>;
  const text: Partial<Record<Language, string>> = {};
  for (const lang of LANGUAGE_CODES) {
    const value = source[`${field}_${lang}`];
    if (typeof value === 'string') text[lang] = value;
    else if (ALWAYS_STORED.includes(lang)) text[lang] = '';
  }
  return text as LocalizedText;
}

/**
 * Copy of `item` with a localized field written back to its `<field>_<language>` properties.
 * Texts are trimmed when `trim` is set; an empty optional variant is removed (not stored empty).
 */
export function withLocalizedField<T extends object>(item: T, field: string, text: LocalizedText, trim = false): T {
  const next = { ...item } as Record<string, unknown>;
  for (const lang of LANGUAGE_CODES) {
    const key = `${field}_${lang}`;
    const raw = text[lang] ?? '';
    const value = trim ? raw.trim() : raw;
    if (value || ALWAYS_STORED.includes(lang)) next[key] = value;
    else delete next[key];
  }
  return next as T;
}

/** Same text with every language trimmed; empty optional variants left out. */
export function trimLocalized(text: Partial<Record<Language, string>>): LocalizedText {
  const result: Partial<Record<Language, string>> = {};
  for (const lang of LANGUAGE_CODES) {
    const value = (text[lang] ?? '').trim();
    if (value || ALWAYS_STORED.includes(lang)) result[lang] = value;
  }
  return result as LocalizedText;
}

/** True when the text has something written in at least one language. */
export const hasAnyText = (text: Partial<Record<Language, string>>): boolean =>
  LANGUAGE_CODES.some((lang) => !!text[lang]?.trim());
