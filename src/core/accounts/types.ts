/** Account types: the structural axis. Client features are universal; `employee` only adds staff rights. */
export type AccountType = 'client' | 'employee';

import type { Versioned } from '../sync';

/** A region of a country (a Tunisian governorate for TN), bilingual: derja falls back to the Arabic name. */
export interface Region {
  id: string;
  name_fr: string;
  name_ar: string;
}

/**
 * A country the app may serve, stored as countries/{isoCode} (shared collection, synced
 * offline like recipes and ingredients). The patron adds, edits and enables countries
 * without a deploy; the built-in seed covers the first launch.
 */
export interface CountryRecord extends Versioned {
  /** ISO 3166-1 alpha-2 */
  id: string;
  /** International dial code with the plus, e.g. '+216' */
  dial: string;
  /** Whether users may pick this country in the selectors right now */
  enabled: boolean;
  regions: Region[];
  /** Optional postal-code shape as a simple digit count hint, e.g. '4' for Tunisia */
  postal_digits?: number;
}

/**
 * Structured postal address, fully optional. Tunisia first (governorates as a closed list),
 * open to any country through the countries data. Any field empty = the whole block absent.
 */
export interface Address {
  /** Street, building, apartment */
  line: string;
  /** Region id from the country data (a Tunisian governorate id for TN) */
  region: string;
  city: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2, default 'TN' */
  country: string;
}

/**
 * Profile of any signed-in account (client or employee), stored as users/{uid}.
 * Field names follow the existing users documents (camelCase) to keep old profiles valid.
 */
export interface UserProfile {
  uid: string;
  type: AccountType;
  email?: string;
  displayName?: string;
  /** E.164 number (+21620123456); the dial code is part of the value, never a separate field */
  phone?: string;
  address?: Address;
  /** Preferred interface language, one of LANGUAGES ids */
  preferredLanguage?: string;
  isAnonymous: boolean;
  favorites?: string[];
  savedFridge?: string[];
  lastLogin?: string;
}

/** Input of the registration form (optional fields validated, not stored when empty). */
export interface RegistrationInput {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
  address?: Address;
  preferredLanguage?: string;
}

/** A field-level validation error, displayed on the input it belongs to. */
export interface FieldError {
  field: string;
  message: 'required' | 'email' | 'password-length' | 'phone' | 'address' | 'language' | 'name-length';
}
