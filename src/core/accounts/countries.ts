import type { Language } from '../shared';
import type { CountryRecord, Region } from './types';

/** Country names follow the governorate rule set by the chef: French in French, Arabic script otherwise. */
const COUNTRY_LOCALE: Record<Language, string> = { fr: 'fr', ar: 'ar', derja: 'ar', derja_ar: 'ar' };

let displayNames: Intl.DisplayNames | null = null;
let displayNamesLocale = '';

/** Country display name in the current language (native Intl, no translation table to maintain). */
export function countryName(code: string, language: Language): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  const locale = COUNTRY_LOCALE[language] ?? 'fr';
  if (!displayNames || displayNamesLocale !== locale) {
    displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    displayNamesLocale = locale;
  }
  try {
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Region display name: French for the French UI, the Arabic name for every Arabic-script variant. */
export function regionName(region: Region, language: Language): string {
  return language === 'fr' ? region.name_fr : region.name_ar;
}

/** Flag emoji of an ISO code, computed from the Unicode regional indicators (no data to maintain). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Whether this value is a well-formed dial code ('+216', '+1'...). */
function isDial(value: unknown): value is string {
  return typeof value === 'string' && /^\+[1-9]\d{0,3}$/.test(value);
}

function parseRegion(raw: unknown, seen: Set<string>): Region | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !/^[a-z0-9_-]{1,40}$/.test(r.id) || seen.has(r.id)) return null;
  if (typeof r.name_fr !== 'string' || !r.name_fr.trim() || r.name_fr.length > 80) return null;
  if (typeof r.name_ar !== 'string' || !r.name_ar.trim() || r.name_ar.length > 80) return null;
  seen.add(r.id);
  return { id: r.id, name_fr: r.name_fr.trim(), name_ar: r.name_ar.trim() };
}

/**
 * Reads a country coming from the database, a JSON import or a form: anything malformed
 * is dropped rather than trusted (same revalidation rule as recipes and ingredients).
 */
export function parseStoredCountry(raw: unknown): CountryRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== 'string' || !/^[A-Za-z]{2}$/.test(d.id)) return null;
  if (!isDial(d.dial)) return null;
  if (typeof d.enabled !== 'boolean') return null;
  if (!Array.isArray(d.regions) || d.regions.length > 500) return null;
  const seen = new Set<string>();
  const regions: Region[] = [];
  for (const rawRegion of d.regions) {
    const region = parseRegion(rawRegion, seen);
    if (!region) return null;
    regions.push(region);
  }
  const country: CountryRecord = {
    id: d.id.toUpperCase(),
    dial: d.dial,
    enabled: d.enabled,
    regions,
  };
  if (
    typeof d.postal_digits === 'number' &&
    Number.isInteger(d.postal_digits) &&
    d.postal_digits > 0 &&
    d.postal_digits <= 10
  ) {
    country.postal_digits = d.postal_digits;
  }
  return country;
}

/** Parses a whole list, skipping invalid entries (never throws). */
export function parseStoredCountries(raw: unknown): CountryRecord[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const countries: CountryRecord[] = [];
  for (const item of raw) {
    const country = parseStoredCountry(item);
    if (!country || seen.has(country.id)) continue;
    seen.add(country.id);
    countries.push(country);
  }
  return countries;
}

/** Countries users may currently pick in the selectors, sorted by display name. */
export function enabledCountries(countries: readonly CountryRecord[], language: Language): CountryRecord[] {
  return countries
    .filter((c) => c.enabled && !c.deleted)
    .sort((a, b) => countryName(a.id, language).localeCompare(countryName(b.id, language)));
}

export function countryById(countries: readonly CountryRecord[], id: string): CountryRecord | null {
  const upper = id.toUpperCase();
  return countries.find((c) => c.id === upper && !c.deleted) ?? null;
}
