import type { Language } from '@/core/shared';

/**
 * Labels of one area of the backoffice, written in full in every language and variant: the French
 * object sets the keys, the compiler refuses a translation that misses one. Derja in Arabic letters
 * is written out like the others (never borrowed from literary Arabic, a different language).
 */
export function defineTexts<T extends Record<string, string>>(
  fr: T,
  others: Record<Exclude<Language, 'fr'>, { [K in keyof T]: string }>
): Record<Language, T> {
  return { fr, ...others } as Record<Language, T>;
}
