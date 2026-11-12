import { describe, expect, it } from 'vitest';
import { normalizeText } from '../shared/text';
import { normalizeSearchText, searchTerms } from './normalize';

const same = (a: string, b: string) => expect(normalizeSearchText(a)).toBe(normalizeSearchText(b));

describe('normalizeSearchText', () => {
  it('keeps the French rules of normalizeText (case, accents, ligatures, plurals)', () => {
    same('Œufs', 'oeuf');
    same('Pâtes', 'pate');
    same('Pommes de terre', 'pomme de terre');
  });

  it('removes Arabic vowel marks and tatweel', () => {
    same('كُسْكُسِي', 'كسكسي');
    same('كســكسي', 'كسكسي');
  });

  it('folds the alef, teh marbuta and alef maksura forms', () => {
    same('أرز', 'ارز');
    same('إجاص', 'اجاص');
    same('آش', 'اش');
    same('كمونية', 'كمونيه');
    same('حلوى', 'حلوي');
  });

  it('detaches the Arabic article and its glued prefixes', () => {
    same('بالدجاج', 'دجاج');
    same('والطماطم', 'طماطم');
    same('الحوت', 'حوت');
    // A word that is only the article plus one letter stays as it is
    expect(normalizeSearchText('الف')).toBe('الف');
  });

  it('understands derja written with arabizi digits', () => {
    same('3assida', 'assida');
    same('l7am', 'lham');
    same('ma9rouna', 'makrouna');
    same('5obz', 'khobz');
  });

  it('accepts the usual spelling variants of derja in Latin letters', () => {
    same('chakchouka', 'chakchoka');
    same('kousksi', 'koskssi');
    same('shorba', 'chorba');
    same('qadid', 'kadid');
  });

  it('never turns a plain number into letters', () => {
    expect(searchTerms('4 personnes 250 g')).toEqual(['4', 'persune', '250', 'g']);
  });

  it('gives separate words, without empty ones', () => {
    expect(searchTerms('  Ojja ,  merguez ! ')).toEqual(['uja', 'merguez']);
    expect(searchTerms('')).toEqual([]);
  });

  it('does not change normalizeText (used by the fridge matching)', () => {
    expect(normalizeText('Œufs')).toBe('oeuf');
    expect(normalizeText('كُسْكُسِي')).not.toBe(normalizeSearchText('كسكسي'));
  });
});
