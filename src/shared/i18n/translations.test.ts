import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@/core/shared';
import { translations } from './translations';
import { DERJA_ARABIC } from './derjaArabic';

const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

/** Tunisian words that must never appear in the literary Arabic dictionary. */
const DERJA_MARKERS = [' باش ', 'شنوة', 'برشا', 'توّا', 'فيسع', 'ماكلة', 'كوجينة', 'فريجيدار', 'متاع'];

describe('interface dictionaries', () => {
  const reference = translations.fr;
  const keys = Object.keys(reference) as (keyof typeof reference)[];

  it('has a dictionary for every language of LANGUAGES', () => {
    for (const { code } of LANGUAGES) expect(translations[code], code).toBeDefined();
  });

  it.each(['derja', 'ar', 'derja_ar'] as const)('%s has every French key, never empty', (lang) => {
    for (const key of keys) {
      const value = translations[lang][key];
      expect(typeof value, `${lang}.${key}`).toBe('string');
      expect(value.trim(), `${lang}.${key}`).not.toBe('');
    }
  });

  it.each(['derja', 'ar', 'derja_ar'] as const)('%s keeps the placeholders of the French text', (lang) => {
    for (const key of keys) {
      expect(placeholders(translations[lang][key]), `${lang}.${key}`).toEqual(placeholders(reference[key]));
    }
  });

  it('writes derja in Arabic letters in full, never borrowed from the literary Arabic', () => {
    expect(translations.derja_ar).toBe(DERJA_ARABIC);
    expect(Object.keys(DERJA_ARABIC).sort()).toEqual([...keys].sort());
  });

  it('keeps the literary Arabic free of Tunisian words', () => {
    for (const key of keys) {
      const value = ` ${translations.ar[key]} `;
      for (const marker of DERJA_MARKERS) expect(value, `ar.${key} contains “${marker}”`).not.toContain(marker);
    }
  });
});
