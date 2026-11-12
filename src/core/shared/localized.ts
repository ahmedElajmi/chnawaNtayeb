import type { Language } from './language';

/** A text written in the three content languages. */
export interface LocalizedText {
  fr: string;
  derja: string;
  ar: string;
}

/** Order in which languages are tried when the requested one has no text. */
const FALLBACK: Record<Language, Language[]> = {
  derja: ['derja', 'fr', 'ar'],
  fr: ['fr', 'derja', 'ar'],
  ar: ['ar', 'fr', 'derja'],
};

/**
 * Text to display in the requested language. When that language is empty,
 * falls back to French (the reference language), then to the remaining one.
 */
export function pickLocalized(language: Language, text: LocalizedText): string {
  for (const lang of FALLBACK[language]) {
    const value = text[lang]?.trim();
    if (value) return value;
  }
  return '';
}
