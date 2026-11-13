/**
 * Fingerprint of a value: the same content always gives the same short text, whatever the order of
 * its object keys. Used to know whether a reviewed part of an item changed since its validation.
 * Two 32-bit FNV-1a passes (different seeds) keep accidental collisions out of reach for this use.
 */
export function contentHash(value: unknown): string {
  const text = stableStringify(value);
  return fnv1a(text, 0x811c9dc5) + fnv1a(text, 0x01000193 ^ 0x5bd1e995);
}

/** JSON with object keys sorted (and `undefined` left out), so equal contents give equal texts. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function fnv1a(text: string, seed: number): string {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
