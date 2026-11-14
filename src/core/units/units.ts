/** A unit understood as an amount of mass (g), volume (ml) or of a counted thing ("pièce", "botte"...). */
export interface Measure {
  kind: 'mass' | 'volume' | 'count';
  /** For counted things: the singular word, so "pièces" and "pièce" match */
  label: string;
  amount: number;
}

export type UnitFamily = Measure['kind'];

const MASS: Record<string, number> = { g: 1, gr: 1, kg: 1000 };
const VOLUME: Record<string, number> = { ml: 1, cl: 10, dl: 100, l: 1000, litre: 1000, litres: 1000 };

/** Readable aliases offered to the user for each comparable family. */
const MASS_UNITS = ['g', 'kg', 'gr'];
const VOLUME_UNITS = ['ml', 'cl', 'dl', 'l'];

const singular = (word: string) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word);

const normalizeRaw = (unit: string) => unit.trim().toLowerCase();

const round = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

/**
 * Reads a unit such as "kg", "100 g", "paquet (500g)", "boîte (400 ml)", "pièces (durs)".
 * A quantity in brackets wins ("paquet (500g)" = 500 g); other brackets are only comments.
 * Returns null when the unit cannot be compared ("c.à.s / L").
 */
export function parseMeasure(unit: string): Measure | null {
  const text = unit.trim().toLowerCase().replace(',', '.');
  if (!text || text.includes('/')) return null;
  const bracket = /\(([^)]*)\)/.exec(text)?.[1];
  // Only a bracket holding a quantity changes the unit ("(500g)"), not a comment ("(durs)")
  const fromBracket = bracket && /\d/.test(bracket) ? parseAmount(bracket) : null;
  if (fromBracket) return fromBracket;
  const main = text.replace(/\([^)]*\)/g, '').trim();
  return parseAmount(main) ?? (main ? { kind: 'count', label: singular(main.split(/\s+/)[0]), amount: 1 } : null);
}

function parseAmount(text: string): Measure | null {
  const m = /^(\d+(?:\.\d+)?)?\s*([a-zà-ÿ.]+)$/.exec(text.trim());
  if (!m) return null;
  const amount = m[1] ? parseFloat(m[1]) : 1;
  const word = m[2];
  if (word in MASS) return { kind: 'mass', label: 'g', amount: amount * MASS[word] };
  if (word in VOLUME) return { kind: 'volume', label: 'ml', amount: amount * VOLUME[word] };
  return m[1] ? null : { kind: 'count', label: singular(word), amount };
}

/** The family of a unit: mass (g, kg, gr), volume (ml, cl, dl, l) or a counted thing. Units that
 *  cannot be compared ("c.à.s / bol") count as counted things too. */
export function getUnitFamily(unit: string): UnitFamily {
  return parseMeasure(unit)?.kind ?? 'count';
}

/**
 * The units the user may switch to: every alias of the same family for mass and volume
 * ("kg" -> g, kg, gr; "l" -> ml, cl, dl, l), only the same counted thing for the rest
 * ("pièces" -> "pièce"): two different count units (pièce and botte) never mix.
 */
export function getCompatibleUnits(unit: string): string[] {
  const measure = parseMeasure(unit);
  if (!measure) {
    const raw = normalizeRaw(unit);
    return raw ? [raw] : [];
  }
  if (measure.kind === 'mass') return [...MASS_UNITS];
  if (measure.kind === 'volume') return [...VOLUME_UNITS];
  return [measure.label];
}

/**
 * True when two quantities may be added or a quantity converted from one unit to the other:
 * same family for mass and volume, the very same counted thing for the rest. Case, spacing
 * and French plurals are ignored ("pièces" and "pièce" are the same unit).
 */
export function areUnitsCompatible(a: string, b: string): boolean {
  const source = parseMeasure(a);
  const target = parseMeasure(b);
  if (!source || !target) {
    // Units that cannot be compared only match themselves, written the same way
    const raw = normalizeRaw(a);
    return raw !== '' && raw === normalizeRaw(b);
  }
  if (source.kind !== target.kind) return false;
  if (source.kind === 'count') return source.label === target.label;
  return true;
}

/**
 * A quantity converted from one unit to another (1500 g -> 1.5 kg), rounded to 3 decimals.
 * Returns null when the units are not compatible or unknown ("c.à.s" -> "kg"); units that
 * cannot be compared only convert to themselves, unchanged.
 */
export function convertQuantity(quantity: number, from: string, to: string): number | null {
  if (!Number.isFinite(quantity)) return null;
  const source = parseMeasure(from);
  const target = parseMeasure(to);
  if (!source || !target) {
    const raw = normalizeRaw(from);
    return raw !== '' && raw === normalizeRaw(to) ? quantity : null;
  }
  if (source.kind !== target.kind) return null;
  if (source.kind === 'count' && source.label !== target.label) return null;
  if (source.amount === target.amount) return quantity;
  return round((quantity * source.amount) / target.amount, 3);
}
