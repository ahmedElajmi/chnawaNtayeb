import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { isLanguage } from '../shared';
import type { Address, CountryRecord, FieldError, RegistrationInput, UserProfile } from './types';
import { countryById } from './countries';

/** Maximum lengths, mirrored in the database rules. */
const MAX_NAME = 60;
const MAX_LINE = 120;
const MAX_CITY = 60;

/**
 * Normalizes a phone input into E.164 ('+21620123456') or returns null. The dial code is
 * part of the value: the UI composes it, the core validates the whole number through
 * libphonenumber-js (per-country rules), never a hand-rolled length map.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed);
  return parsed && parsed.isValid() ? parsed.number : null;
}

/** Whether the value looks like an email (same shape the team module accepts). */
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Reads the address block: absent or empty fields collapse into an absent block. */
function readAddress(raw: Address | undefined): Address | null {
  if (!raw || typeof raw !== 'object') return null;
  const line = (raw.line ?? '').trim();
  const region = (raw.region ?? '').trim();
  const city = (raw.city ?? '').trim();
  const postalCode = (raw.postalCode ?? '').trim();
  const country = (raw.country ?? '').trim().toUpperCase();
  if (!line && !region && !city && !postalCode && !country) return null;
  return { line, region, city, postalCode, country: country || 'TN' };
}

/** Controls and URLs never belong in a profile text field. */
function cleanText(value: string): string {
  const withoutUrls = value.replace(/https?:\/\/\S+/gi, ' ');
  // Control characters and line breaks never belong in a name or an address line
  return [...withoutUrls]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return (code > 31 || ch === ' ') && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates the address against the countries the patron enabled: the region must exist in
 * the country's list (when it has one), the postal code follows the country's digit count
 * or a generic 3-10 alphanumerics. Returns the field errors found (empty = valid).
 */
export function validateAddress(address: Address | null, countries: readonly CountryRecord[]): FieldError[] {
  if (!address) return [];
  const errors: FieldError[] = [];
  const country = countryById(countries, address.country) ?? (address.country === 'TN' ? null : undefined);
  if (country === undefined) {
    errors.push({ field: 'address.country', message: 'address' });
    return errors;
  }
  if (address.line.length < 3 || address.line.length > MAX_LINE) {
    errors.push({ field: 'address.line', message: 'address' });
  }
  if (!address.city || address.city.length > MAX_CITY) {
    errors.push({ field: 'address.city', message: 'address' });
  }
  if (country) {
    // The region is optional; when given it must exist in the country's list.
    if (address.region && !country.regions.some((r) => r.id === address.region)) {
      errors.push({ field: 'address.region', message: 'address' });
    }
    const postal = address.postalCode;
    const ok = country.postal_digits
      ? new RegExp(`^\\d{${country.postal_digits}}$`).test(postal)
      : /^[a-zA-Z0-9 -]{3,10}$/.test(postal);
    if (!ok) errors.push({ field: 'address.postalCode', message: 'address' });
  } else if (!/^\d{4}$/.test(address.postalCode)) {
    // Tunisia without any country record: the default four digits
    errors.push({ field: 'address.postalCode', message: 'address' });
  }
  return errors;
}

/** Full registration check: every error names its field so the form can mark the input. */
export function validateRegistration(
  input: RegistrationInput,
  countries: readonly CountryRecord[],
  minPasswordLength: number
): FieldError[] {
  const errors: FieldError[] = [];
  if (!isEmail(input.email)) errors.push({ field: 'email', message: 'email' });
  if (typeof input.password !== 'string' || input.password.length < minPasswordLength) {
    errors.push({ field: 'password', message: 'password-length' });
  }
  if (input.displayName !== undefined) {
    const name = cleanText(input.displayName);
    if (!name || name.length > MAX_NAME) errors.push({ field: 'displayName', message: 'name-length' });
  }
  if (input.phone !== undefined && input.phone.trim() && !normalizePhone(input.phone)) {
    errors.push({ field: 'phone', message: 'phone' });
  }
  const address = readAddress(input.address);
  if (address) errors.push(...validateAddress(address, countries));
  if (input.preferredLanguage !== undefined && !isLanguage(input.preferredLanguage)) {
    errors.push({ field: 'preferredLanguage', message: 'language' });
  }
  return errors;
}

/**
 * Reads any stored profile (old camelCase documents, current ones, partial data) and
 * rebuilds a clean UserProfile: absent type means client, an empty address collapses,
 * malformed values are dropped. Never throws; returns null only when the uid is unusable.
 */
export function resolveUserProfile(raw: unknown): UserProfile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Record<string, unknown>;
  const uid = typeof d.uid === 'string' ? d.uid : '';
  if (!uid || uid.length > 128) return null;
  const type = d.type === 'employee' ? 'employee' : 'client';
  const profile: UserProfile = { uid, type, isAnonymous: d.isAnonymous === true };
  if (typeof d.email === 'string' && d.email) profile.email = d.email;
  if (typeof d.displayName === 'string' && d.displayName) profile.displayName = cleanText(d.displayName);
  const phone = typeof d.phone === 'string' ? normalizePhone(d.phone) : null;
  if (phone) profile.phone = phone;
  if (typeof d.preferredLanguage === 'string' && isLanguage(d.preferredLanguage)) {
    profile.preferredLanguage = d.preferredLanguage;
  }
  const address = readAddress(d.address as Address | undefined);
  if (address) profile.address = address;
  if (Array.isArray(d.favorites)) profile.favorites = d.favorites.filter((v) => typeof v === 'string');
  if (Array.isArray(d.savedFridge)) profile.savedFridge = d.savedFridge.filter((v) => typeof v === 'string');
  if (typeof d.lastLogin === 'string' && d.lastLogin) profile.lastLogin = d.lastLogin;
  return profile;
}

/** Profile update from the client: only the fields a user may edit, revalidated. */
export function validateProfileUpdate(
  patch: Pick<RegistrationInput, 'displayName' | 'phone' | 'address' | 'preferredLanguage'>,
  countries: readonly CountryRecord[]
): FieldError[] {
  const errors: FieldError[] = [];
  if (patch.displayName !== undefined) {
    const name = cleanText(patch.displayName);
    if (!name || name.length > MAX_NAME) errors.push({ field: 'displayName', message: 'name-length' });
  }
  if (patch.phone !== undefined && patch.phone.trim() && !normalizePhone(patch.phone)) {
    errors.push({ field: 'phone', message: 'phone' });
  }
  const address = readAddress(patch.address);
  if (address) errors.push(...validateAddress(address, countries));
  if (patch.preferredLanguage !== undefined && !isLanguage(patch.preferredLanguage)) {
    errors.push({ field: 'preferredLanguage', message: 'language' });
  }
  return errors;
}
