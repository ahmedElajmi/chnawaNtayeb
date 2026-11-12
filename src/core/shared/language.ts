/**
 * Languages of the app and of the content. Variants of a language family (derja in Latin letters,
 * derja in Arabic letters, literary Arabic) are languages of their own, grouped by `family`.
 * Adding a language or a variant = one entry in LANGUAGES (+ its interface texts); localized fields
 * are named `<field>_<code>` (`name_derja_ar`) and are found from this list everywhere.
 */
export type Language = 'fr' | 'ar' | 'derja' | 'derja_ar';

export type LanguageFamily = 'fr' | 'ar';

export interface LanguageInfo {
  code: Language;
  family: LanguageFamily;
  /** Name in the language itself (selectors) */
  label: string;
  /** Short name (tabs, buttons) */
  short: string;
  /** Name in the language selectors (with what tells the variants apart) */
  selectorLabel: string;
  /** Name of the family / variant for the backoffice ("Derja (lettres latines)") */
  description: string;
  dir: 'ltr' | 'rtl';
  /** BCP 47 tag for the `lang` attribute */
  htmlLang: string;
  /** Collation locale (alphabetical order) */
  collation: string;
  /** Languages tried, in order, when a text is empty in this one */
  fallback: readonly Language[];
  /** Every item must have a text in this language (the others are optional and fall back) */
  required?: boolean;
}

export const LANGUAGES: readonly LanguageInfo[] = [
  {
    code: 'fr',
    family: 'fr',
    label: 'Français',
    short: 'FR',
    selectorLabel: '🇫🇷 Français',
    description: 'Français (langue de référence)',
    dir: 'ltr',
    htmlLang: 'fr',
    collation: 'fr',
    fallback: ['fr', 'derja', 'ar', 'derja_ar'],
    required: true,
  },
  {
    code: 'ar',
    family: 'ar',
    label: 'العربية',
    short: 'عربي',
    selectorLabel: 'العربية الفصحى',
    description: 'Arabe littéraire',
    dir: 'rtl',
    htmlLang: 'ar',
    collation: 'ar',
    fallback: ['ar', 'derja_ar', 'fr', 'derja'],
  },
  {
    code: 'derja',
    family: 'ar',
    label: 'Derja',
    short: 'Derja',
    selectorLabel: '🇹🇳 Derja (3, 7, 9)',
    description: 'Derja en lettres latines (3, 7, 9)',
    dir: 'ltr',
    htmlLang: 'ar-TN',
    collation: 'fr',
    fallback: ['derja', 'fr', 'ar', 'derja_ar'],
  },
  {
    code: 'derja_ar',
    family: 'ar',
    label: 'دارجة',
    short: 'دارجة',
    selectorLabel: '🇹🇳 دارجة',
    description: 'Derja en lettres arabes',
    dir: 'rtl',
    htmlLang: 'aeb',
    collation: 'ar',
    fallback: ['derja_ar', 'ar', 'derja', 'fr'],
  },
];

export const LANGUAGE_CODES: readonly Language[] = LANGUAGES.map((l) => l.code);

/** Reference language: required everywhere, the last fallback of every other one. */
export const REFERENCE_LANGUAGE: Language = 'fr';

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function languageInfo(code: Language): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Order of the language selectors: Tunisian first (derja is the default language of the app). */
export const SELECTOR_ORDER: readonly Language[] = ['derja', 'derja_ar', 'fr', 'ar'];

/** Order in which a form shows the languages to write: the reference first, then each family's variants. */
export const EDITING_ORDER: readonly Language[] = ['fr', 'derja', 'derja_ar', 'ar'];
