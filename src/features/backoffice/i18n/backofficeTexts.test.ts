import { describe, expect, it } from 'vitest';
import { LANGUAGE_CODES } from '@/core/shared';
import { BACKOFFICE_TEXTS, format } from './backofficeTexts';

describe('backoffice texts', () => {
  it('has every label in every language and variant', () => {
    const keys = Object.keys(BACKOFFICE_TEXTS.fr);
    for (const lang of LANGUAGE_CODES) {
      for (const key of keys) {
        const text = BACKOFFICE_TEXTS[lang][key as keyof typeof BACKOFFICE_TEXTS.fr];
        expect(text?.trim(), `${lang}.${key}`).toBeTruthy();
      }
    }
  });

  it('keeps the placeholders of the French label in every translation', () => {
    for (const lang of LANGUAGE_CODES) {
      for (const [key, text] of Object.entries(BACKOFFICE_TEXTS.fr)) {
        const placeholders = text.match(/\{\w+\}/g) ?? [];
        const translated = BACKOFFICE_TEXTS[lang][key as keyof typeof BACKOFFICE_TEXTS.fr];
        for (const p of placeholders) expect(translated, `${lang}.${key}`).toContain(p);
      }
    }
  });

  it('fills placeholders and leaves unknown ones', () => {
    expect(format('Version {version} de {who}', { version: 3 })).toBe('Version 3 de {who}');
  });
});
