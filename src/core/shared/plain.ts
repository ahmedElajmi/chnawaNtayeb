/**
 * Copy of a value without any `undefined` (object keys removed, array entries dropped).
 * Databases refuse `undefined`, and an optional field that was cleared must simply be absent.
 */
export function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.filter((v) => v !== undefined).map(withoutUndefined) as T;
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) if (v !== undefined) out[key] = withoutUndefined(v);
    return out as T;
  }
  return value;
}
