import { describe, expect, it } from 'vitest';
import { hasAnyText, localizedField, pickLocalized, trimLocalized, withLocalizedField } from './localized';
import { isLanguage, LANGUAGE_CODES, LANGUAGES } from './language';

const text = { fr: 'Couscous', derja: 'Kosksi', ar: 'كسكسي' };

describe('pickLocalized', () => {
  it('returns the text of the requested language', () => {
    expect(pickLocalized('fr', text)).toBe('Couscous');
    expect(pickLocalized('derja', text)).toBe('Kosksi');
    expect(pickLocalized('ar', text)).toBe('كسكسي');
  });

  it('falls back to French when the requested language is empty', () => {
    expect(pickLocalized('derja', { ...text, derja: '  ' })).toBe('Couscous');
    expect(pickLocalized('ar', { ...text, ar: '' })).toBe('Couscous');
  });

  it('uses the remaining language when French is empty too', () => {
    expect(pickLocalized('fr', { fr: '', derja: 'Kosksi', ar: '' })).toBe('Kosksi');
    expect(pickLocalized('ar', { fr: '', derja: '', ar: '' })).toBe('');
  });
});

describe('language variants', () => {
  it('derja in Arabic letters falls back to Arabic, then derja in Latin letters, then French', () => {
    expect(pickLocalized('derja_ar', { ...text, derja_ar: 'كسكسي تونسي' })).toBe('كسكسي تونسي');
    expect(pickLocalized('derja_ar', text)).toBe('كسكسي');
    expect(pickLocalized('derja_ar', { ...text, ar: '' })).toBe('Kosksi');
    expect(pickLocalized('derja_ar', { fr: 'Couscous', derja: '', ar: '' })).toBe('Couscous');
  });

  it('a variant never changes what the other languages show when it is empty', () => {
    for (const lang of ['fr', 'derja', 'ar'] as const) expect(pickLocalized(lang, text)).toBe(text[lang]);
  });

  it('reads and writes a localized field on any object, variants included', () => {
    const recipe = { id: 'r', name_fr: 'Ojja', name_derja: 'Ojja', name_ar: 'عجة', name_derja_ar: 'عجّة' };
    expect(localizedField(recipe, 'name')).toEqual({ fr: 'Ojja', derja: 'Ojja', ar: 'عجة', derja_ar: 'عجّة' });
    expect(localizedField({ name_fr: 'X' }, 'name')).toEqual({ fr: 'X', derja: '', ar: '' });

    const written = withLocalizedField(recipe, 'name', { fr: ' Ojja ', derja: '', ar: 'عجة', derja_ar: ' ' }, true);
    expect(written).toEqual({ id: 'r', name_fr: 'Ojja', name_derja: '', name_ar: 'عجة' });
  });

  it('trims a text and leaves out empty variants', () => {
    expect(trimLocalized({ fr: ' a ', derja: 'b ', ar: '', derja_ar: '  ' })).toEqual({ fr: 'a', derja: 'b', ar: '' });
    expect(hasAnyText({ fr: '', derja: '', ar: '', derja_ar: 'x' })).toBe(true);
    expect(hasAnyText({ fr: ' ', derja: '', ar: '' })).toBe(false);
  });

  it('every language has a fallback list that ends with every other language', () => {
    for (const info of LANGUAGES) {
      expect(info.fallback[0]).toBe(info.code);
      expect([...info.fallback].sort()).toEqual([...LANGUAGE_CODES].sort());
    }
    expect(isLanguage('derja_ar')).toBe(true);
    expect(isLanguage('en')).toBe(false);
  });
});
