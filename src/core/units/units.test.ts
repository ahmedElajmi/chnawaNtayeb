import { describe, expect, it } from 'vitest';
import { areUnitsCompatible, convertQuantity, getCompatibleUnits, getUnitFamily } from './units';

describe('getUnitFamily', () => {
  it('recognizes mass, volume and counted units', () => {
    expect(getUnitFamily('kg')).toBe('mass');
    expect(getUnitFamily('g')).toBe('mass');
    expect(getUnitFamily('gr')).toBe('mass');
    expect(getUnitFamily('ml')).toBe('volume');
    expect(getUnitFamily('l')).toBe('volume');
    expect(getUnitFamily('litre')).toBe('volume');
    expect(getUnitFamily('pièce')).toBe('count');
    expect(getUnitFamily('botte')).toBe('count');
    expect(getUnitFamily('c.à.s')).toBe('count');
  });

  it('ignores case, spacing and French plurals', () => {
    expect(getUnitFamily(' KG ')).toBe('mass');
    expect(getUnitFamily('Kg')).toBe('mass');
    expect(getUnitFamily('Pièces')).toBe('count');
    expect(getUnitFamily('  litre ')).toBe('volume');
  });

  it('counts unknown or uncomparable units as counted things', () => {
    expect(getUnitFamily('c.à.s / bol')).toBe('count');
    expect(getUnitFamily('gousses')).toBe('count');
    expect(getUnitFamily('')).toBe('count');
  });
});

describe('getCompatibleUnits', () => {
  it('offers every alias of the same mass family', () => {
    expect(getCompatibleUnits('kg')).toEqual(['g', 'kg', 'gr']);
    expect(getCompatibleUnits('g')).toEqual(['g', 'kg', 'gr']);
    expect(getCompatibleUnits('gr')).toEqual(['g', 'kg', 'gr']);
  });

  it('offers every alias of the same volume family', () => {
    expect(getCompatibleUnits('l')).toEqual(['ml', 'cl', 'dl', 'l']);
    expect(getCompatibleUnits('ml')).toEqual(['ml', 'cl', 'dl', 'l']);
    expect(getCompatibleUnits('litres')).toEqual(['ml', 'cl', 'dl', 'l']);
  });

  it('offers only the singular label of a counted unit', () => {
    expect(getCompatibleUnits('pièces')).toEqual(['pièce']);
    expect(getCompatibleUnits('pièce')).toEqual(['pièce']);
    expect(getCompatibleUnits('botte')).toEqual(['botte']);
    // Existing parseMeasure behavior: the plural "s" is stripped on this written label too
    expect(getCompatibleUnits('c.à.s')).toEqual(['c.à.']);
  });

  it('offers only identity for units that cannot be compared', () => {
    expect(getCompatibleUnits('c.à.s / bol')).toEqual(['c.à.s / bol']);
    expect(getCompatibleUnits('')).toEqual([]);
  });
});

describe('areUnitsCompatible', () => {
  it('accepts units of the same family', () => {
    expect(areUnitsCompatible('g', 'kg')).toBe(true);
    expect(areUnitsCompatible('kg', 'gr')).toBe(true);
    expect(areUnitsCompatible('ml', 'l')).toBe(true);
    expect(areUnitsCompatible('dl', 'cl')).toBe(true);
  });

  it('rejects units of different families', () => {
    expect(areUnitsCompatible('g', 'ml')).toBe(false);
    expect(areUnitsCompatible('kg', 'pièce')).toBe(false);
    expect(areUnitsCompatible('l', 'g')).toBe(false);
  });

  it('accepts only the same counted thing', () => {
    expect(areUnitsCompatible('pièces', 'pièce')).toBe(true);
    expect(areUnitsCompatible('Pièces', 'pièce')).toBe(true);
    expect(areUnitsCompatible('pièce', 'botte')).toBe(false);
    expect(areUnitsCompatible('c.à.s', 'c.à.s')).toBe(true);
    expect(areUnitsCompatible('gousse', 'tête')).toBe(false);
  });

  it('accepts identity for units that cannot be compared, nothing else', () => {
    expect(areUnitsCompatible('c.à.s / bol', 'c.à.s / bol')).toBe(true);
    expect(areUnitsCompatible('c.à.s / bol', 'c.à.s / BOL')).toBe(true);
    expect(areUnitsCompatible('c.à.s / bol', 'kg')).toBe(false);
    expect(areUnitsCompatible('', 'kg')).toBe(false);
    expect(areUnitsCompatible('', '')).toBe(false);
  });

  it('reads a quantity in brackets as its unit', () => {
    expect(areUnitsCompatible('paquet (500g)', 'kg')).toBe(true);
    expect(areUnitsCompatible('boîte (400 ml)', 'l')).toBe(true);
  });
});

describe('convertQuantity', () => {
  it('converts within the mass family', () => {
    expect(convertQuantity(1500, 'g', 'kg')).toBe(1.5);
    expect(convertQuantity(0.5, 'kg', 'g')).toBe(500);
    expect(convertQuantity(1000, 'gr', 'kg')).toBe(1);
    expect(convertQuantity(1234, 'g', 'kg')).toBe(1.234);
  });

  it('converts within the volume family', () => {
    expect(convertQuantity(250, 'ml', 'l')).toBe(0.25);
    expect(convertQuantity(1, 'l', 'ml')).toBe(1000);
    expect(convertQuantity(20, 'cl', 'l')).toBe(0.2);
    expect(convertQuantity(1, 'litres', 'l')).toBe(1);
  });

  it('rounds to at most 3 decimals', () => {
    expect(convertQuantity(1, 'g', 'kg')).toBe(0.001);
    expect(convertQuantity(1234567, 'g', 'kg')).toBe(1234.567);
    expect(convertQuantity(1, 'ml', 'l')).toBe(0.001);
  });

  it('keeps the quantity unchanged for the same unit, whatever its writing', () => {
    expect(convertQuantity(3, 'pièces', 'pièce')).toBe(3);
    expect(convertQuantity(2, 'kg', 'Kg')).toBe(2);
    expect(convertQuantity(123.456789, 'g', 'g')).toBe(123.456789);
    expect(convertQuantity(2, 'botte', 'botte')).toBe(2);
    expect(convertQuantity(2, 'c.à.s / bol', 'c.à.s / bol')).toBe(2);
  });

  it('returns null for incompatible or unknown units', () => {
    expect(convertQuantity(500, 'g', 'ml')).toBeNull();
    expect(convertQuantity(2, 'kg', 'pièce')).toBeNull();
    expect(convertQuantity(2, 'pièce', 'botte')).toBeNull();
    expect(convertQuantity(2, 'c.à.s', 'kg')).toBeNull();
    expect(convertQuantity(2, 'c.à.s / bol', 'kg')).toBeNull();
    expect(convertQuantity(2, 'c.à.s / bol', 'gousse')).toBeNull();
    expect(convertQuantity(2, '', 'kg')).toBeNull();
  });

  it('returns null for a quantity that is not a finite number', () => {
    expect(convertQuantity(NaN, 'g', 'kg')).toBeNull();
    expect(convertQuantity(Infinity, 'g', 'kg')).toBeNull();
  });
});
