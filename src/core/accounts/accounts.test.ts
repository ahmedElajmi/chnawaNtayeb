import { describe, expect, it } from 'vitest';
import { initialCountries } from './countriesSeed';
import {
  countryById,
  countryName,
  enabledCountries,
  normalizePhone,
  parseStoredCountries,
  parseStoredCountry,
  regionName,
  resolveUserProfile,
  validateAddress,
  validateProfileUpdate,
  validateRegistration,
} from './index';
import type { CountryRecord } from './index';

const tn = initialCountries.find((c) => c.id === 'TN') as CountryRecord;

describe('countries seed', () => {
  it('ships Tunisia enabled with its 24 governorates', () => {
    expect(tn.enabled).toBe(true);
    expect(tn.dial).toBe('+216');
    expect(tn.regions).toHaveLength(24);
    expect(tn.regions.map((r) => r.id)).toContain('tunis');
  });

  it('ships the other countries disabled and parseable', () => {
    expect(initialCountries.length).toBeGreaterThan(30);
    for (const country of initialCountries) expect(parseStoredCountry(country)).not.toBeNull();
    expect(initialCountries.filter((c) => c.enabled)).toHaveLength(1);
  });
});

describe('countries data', () => {
  it('rejects malformed countries and duplicates, keeps valid ones', () => {
    const countries = parseStoredCountries([
      tn,
      { id: 'ZZ', dial: '216', enabled: false, regions: [] }, // dial without plus
      { id: 'FR', dial: '+33', enabled: true, regions: [{ id: 'a', name_fr: '', name_ar: 'أ' }] }, // empty name
      { id: 'tn', dial: '+999', enabled: false, regions: [] }, // duplicate id
    ]);
    expect(countries.map((c) => c.id)).toEqual(['TN']);
  });

  it('resolves country and region names by language (derja falls back to Arabic)', () => {
    expect(countryName('TN', 'fr')).toBe('Tunisie');
    expect(countryName('TN', 'ar')).not.toBe('Tunisie');
    expect(countryName('TN', 'derja_ar')).toBe(countryName('TN', 'ar'));
    const tunis = tn.regions.find((r) => r.id === 'tunis')!;
    expect(regionName(tunis, 'fr')).toBe('Tunis');
    expect(regionName(tunis, 'ar')).toBe('تونس');
    expect(regionName(tunis, 'derja')).toBe('تونس');
  });

  it('finds enabled countries only', () => {
    const enabled = enabledCountries(initialCountries, 'fr');
    expect(enabled.map((c) => c.id)).toEqual(['TN']);
    expect(countryById(initialCountries, 'tn')?.id).toBe('TN');
    expect(countryById(initialCountries, 'ZZ')).toBeNull();
  });
});

describe('normalizePhone', () => {
  it('accepts valid international numbers and returns E.164', () => {
    expect(normalizePhone('+216 20 123 456')).toBe('+21620123456');
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
  });

  it('rejects missing dial codes, short or alphabetic values', () => {
    expect(normalizePhone('20123456')).toBeNull();
    expect(normalizePhone('+21620')).toBeNull();
    expect(normalizePhone('abcdefgh')).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });
});

describe('validateAddress', () => {
  const base = { line: '12 rue de la Mosquée', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' };

  it('accepts a full Tunisian address against the seed', () => {
    expect(validateAddress(base, initialCountries)).toEqual([]);
  });

  it('requires the region to exist in the country list', () => {
    expect(validateAddress({ ...base, region: 'nowhere' }, initialCountries)).toEqual([
      { field: 'address.region', message: 'address' },
    ]);
  });

  it('enforces the country postal digits (Tunisia: 4)', () => {
    expect(validateAddress({ ...base, postalCode: '10' }, initialCountries)).toEqual([
      { field: 'address.postalCode', message: 'address' },
    ]);
  });

  it('rejects an unknown country and accepts a generic one (open international)', () => {
    expect(validateAddress({ ...base, country: 'XX' }, initialCountries)).toEqual([
      { field: 'address.country', message: 'address' },
    ]);
    const generic = { line: 'Main Street 5', region: '', city: 'London', postalCode: 'SW1A 1AA', country: 'GB' };
    expect(validateAddress(generic, initialCountries)).toEqual([]);
  });
});

describe('validateRegistration', () => {
  const input = {
    email: 'amine@example.com',
    password: 'long-enough-1',
    displayName: 'Amine',
    phone: '+21620123456',
    preferredLanguage: 'derja',
  };

  it('accepts a complete valid form', () => {
    expect(validateRegistration(input, initialCountries, 8)).toEqual([]);
  });

  it('names the field of every problem', () => {
    const errors = validateRegistration(
      { email: 'not-an-email', password: 'short', displayName: '', phone: '20123456', preferredLanguage: 'de' },
      initialCountries,
      8
    );
    expect(errors.map((e) => e.field)).toEqual(['email', 'password', 'displayName', 'phone', 'preferredLanguage']);
  });

  it('accepts an optional empty address block and a full one', () => {
    expect(
      validateRegistration(
        { ...input, address: { line: '', region: '', city: '', postalCode: '', country: '' } },
        initialCountries,
        8
      )
    ).toEqual([]);
    expect(
      validateRegistration(
        { ...input, address: { line: 'Rue', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' } },
        initialCountries,
        8
      )
    ).toEqual([]);
  });
});

describe('resolveUserProfile', () => {
  it('defaults the type to client and keeps legacy camelCase documents', () => {
    const profile = resolveUserProfile({ uid: 'u1', email: 'a@b.co', isAnonymous: false });
    expect(profile).toMatchObject({ uid: 'u1', type: 'client', isAnonymous: false, email: 'a@b.co' });
  });

  it('normalizes the phone and drops an empty address', () => {
    const profile = resolveUserProfile({
      uid: 'u2',
      phone: '+216 20 123 456',
      address: { line: '', region: '', city: '', postalCode: '', country: '' },
    });
    expect(profile?.phone).toBe('+21620123456');
    expect(profile?.address).toBeUndefined();
    expect(profile?.type).toBe('client');
  });

  it('keeps an employee type and rejects unusable uids', () => {
    expect(resolveUserProfile({ uid: 'u3', type: 'employee' })?.type).toBe('employee');
    expect(resolveUserProfile({ uid: '', type: 'employee' })).toBeNull();
    expect(resolveUserProfile('not-an-object')).toBeNull();
  });
});

describe('validateProfileUpdate', () => {
  it('checks only the editable fields', () => {
    expect(validateProfileUpdate({ displayName: 'Amine' }, initialCountries)).toEqual([]);
    expect(validateProfileUpdate({ phone: 'bad' }, initialCountries)).toEqual([{ field: 'phone', message: 'phone' }]);
    expect(validateProfileUpdate({ preferredLanguage: 'de' }, initialCountries)).toEqual([
      { field: 'preferredLanguage', message: 'language' },
    ]);
  });

  it('clears the phone by passing an empty value', () => {
    expect(validateProfileUpdate({ phone: '' }, initialCountries)).toEqual([]);
  });
});
