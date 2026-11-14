import type { Versioned } from '../sync';

/**
 * A unit label explained for the visitors ("c.à.s" → "Cuillère à soupe (environ 15 ml)"),
 * managed by the super admin in the backoffice (shared `units` collection, followed like the
 * catalog). Its description is a localized field (`description_<language>`, read with
 * localizedField): French is the reference, derja and Arabic are always stored (possibly empty),
 * derja in Arabic letters is optional. The front office shows it only for the units configured
 * here: no description is ever written in the code.
 */
export interface UnitInfo extends Versioned {
  /** Unit label exactly as written on ingredients and items (e.g. "kg", "c.à.s") */
  label: string;
  description_fr: string;
  description_derja: string;
  description_ar: string;
  description_derja_ar?: string;
}

/** Allowed characters of a unit id (also checked by the database rules). */
export const UNIT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

/** Lookup key of a unit label or id: case, spacing and trim are ignored ("KG" = "kg"). */
export const unitLookupKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const lookupKey = unitLookupKey;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const text = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * Builds the id of a unit from its label (slugified, trimmed): accents are dropped and every
 * other character becomes "-" ("c.à.s" → "c-a-s", "100 g" → "100-g"). Empty when nothing usable
 * remains; the caller then asks for an id.
 */
export function unitIdFromLabel(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return UNIT_ID_PATTERN.test(slug) ? slug : '';
}

/**
 * A unit description read from outside (database, device copy): id, label and French
 * description are required; deletion markers are left out.
 */
export function parseStoredUnitInfo(raw: unknown): UnitInfo | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || !UNIT_ID_PATTERN.test(raw.id)) return null;
  if (raw.deleted === true) return null;
  const label = text(raw.label).trim();
  if (!label) return null;
  const description_fr = text(raw.description_fr).trim();
  if (!description_fr) return null;
  const unit: UnitInfo = {
    id: raw.id,
    label,
    description_fr,
    description_derja: text(raw.description_derja),
    description_ar: text(raw.description_ar),
  };
  if (text(raw.description_derja_ar).trim()) unit.description_derja_ar = text(raw.description_derja_ar);
  if (typeof raw.revision === 'number') unit.revision = raw.revision;
  return unit;
}

/** Unit descriptions from outside, invalid ones left out. */
export const parseStoredUnitInfos = (list: readonly unknown[]): UnitInfo[] =>
  list.flatMap((raw) => {
    const unit = parseStoredUnitInfo(raw);
    return unit ? [unit] : [];
  });

/**
 * Index of the unit descriptions by label and id (case/trim-insensitive): the front office
 * asks it for the unit written on an ingredient or an item.
 */
export function unitDescriptionIndex(units: readonly UnitInfo[]): ReadonlyMap<string, UnitInfo> {
  const index = new Map<string, UnitInfo>();
  for (const unit of units) {
    index.set(lookupKey(unit.label), unit);
    index.set(lookupKey(unit.id), unit);
  }
  return index;
}

export type UnitInfoProblem = 'id-invalid' | 'label-required' | 'label-taken' | 'description-required';

export interface UnitInfoError {
  field: 'id' | 'label' | 'description';
  problem: UnitInfoProblem;
}

/**
 * Checks a unit description before it is saved, against the others: id, label and French
 * description required, label (or id) not already described. Lookup keys are compared, so
 * "kg " and "KG" are the same label.
 */
export function validateUnitInfo(candidate: UnitInfo, all: readonly UnitInfo[]): UnitInfoError[] {
  const errors: UnitInfoError[] = [];
  if (!UNIT_ID_PATTERN.test(candidate.id)) errors.push({ field: 'id', problem: 'id-invalid' });
  if (!candidate.label.trim()) errors.push({ field: 'label', problem: 'label-required' });
  if (!candidate.description_fr.trim()) errors.push({ field: 'description', problem: 'description-required' });
  const key = lookupKey(candidate.label || candidate.id);
  const others = all.filter((u) => u.id !== candidate.id && !u.deleted);
  if (key && others.some((u) => lookupKey(u.label) === key || lookupKey(u.id) === key))
    errors.push({ field: 'label', problem: 'label-taken' });
  return errors;
}
