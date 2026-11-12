import { describe, expect, it } from 'vitest';
import { pickLocalized } from './localized';

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
