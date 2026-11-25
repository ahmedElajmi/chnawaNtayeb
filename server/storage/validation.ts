import type { CollectionName, WriteOp } from './types';

/**
 * The storage-level safety net every implementation applies before any write (shared so the
 * three backends can never diverge): documents must be JSON-safe recursively, ids must be
 * portable across Firestore and SQL, and a commit stays within its declared envelope.
 * The domain parsers (core) validate business shapes; this layer guarantees the transport
 * itself, uniformly, before anything reaches a provider.
 */

/** Firestore caps a document id at 1500 bytes; the contract adopts the intersection of families. */
export const MAX_ID_BYTES = 1500;
/** The guaranteed envelope of one `commit` (more ops = refuse before anything is written). */
export const MAX_COMMIT_OPS = 10;

/** A write the storage layer refuses before touching the provider (translated to HTTP 400). */
export class DocumentValidationError extends Error {
  constructor(
    public code: 'invalid_document' | 'invalid_id' | 'commit_too_large' | 'sync_counter_corrupt',
    detail: string
  ) {
    super(detail);
  }
}

const utf8 = (value: string): number => new TextEncoder().encode(value).length;

/**
 * The common id guarantee (Firestore ∩ SQL): non-empty, unique per collection (provider's
 * job), immutable (the contract never rewrites an id), ≤ 1500 bytes, never containing `/`,
 * never `.` or `..`, and never matching the reserved Firestore pattern `__.*__` (two
 * underscores at the start AND the end — the form Firestore keeps for itself). No charset
 * restriction beyond that: e-mails, `guest:` subs, slugs, dots-only ids (`...`) and
 * dot-initial ids (`.hidden`) all pass, so no existing data becomes unreachable.
 */
export function assertValidDocId(id: string): void {
  if (typeof id !== 'string' || id.length === 0) throw new DocumentValidationError('invalid_id', 'empty id');
  if (utf8(id) > MAX_ID_BYTES) throw new DocumentValidationError('invalid_id', 'id longer than 1500 bytes');
  if (id.includes('/')) throw new DocumentValidationError('invalid_id', "id contains '/'");
  if (id === '.' || id === '..') throw new DocumentValidationError('invalid_id', "id is '.' or '..'");
  if (/^__.*__$/.test(id)) throw new DocumentValidationError('invalid_id', "id matches the reserved pattern '__.*__'");
}

/**
 * JSON-safe recursively and uniformly, for every backend: strings, finite numbers, booleans,
 * null, plain arrays and plain objects only. `undefined` anywhere, `NaN`/±Infinity,
 * BigInt, functions, class instances, provider types (Date, Timestamp…) and circular
 * references are refused — the shapes SQL can store losslessly and every engine agrees on.
 */
export function assertJsonSafe(value: unknown, path = '$', depth = 0): void {
  if (depth > 32) throw new DocumentValidationError('invalid_document', `${path}: nested deeper than 32 levels`);
  if (value === null) return;
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return;
    case 'number':
      if (!Number.isFinite(value))
        throw new DocumentValidationError('invalid_document', `${path}: not a finite number`);
      return;
    case 'object': {
      if (Array.isArray(value)) {
        value.forEach((item, index) => assertJsonSafe(item, `${path}[${index}]`, depth + 1));
        return;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        throw new DocumentValidationError('invalid_document', `${path}: not a plain object`);
      }
      for (const [key, item] of Object.entries(value)) {
        if (item === undefined) throw new DocumentValidationError('invalid_document', `${path}.${key}: undefined`);
        assertJsonSafe(item, `${path}.${key}`, depth + 1);
      }
      return;
    }
    default:
      throw new DocumentValidationError('invalid_document', `${path}: ${typeof value} is not JSON-safe`);
  }
}

/** A whole document write: portable id + JSON-safe body (id and revision are storage-owned). */
export function assertWritable(name: CollectionName, id: string, doc: Record<string, unknown>): void {
  assertValidDocId(id);
  assertJsonSafe(doc);
  void name;
}

/**
 * The written shape of a document: `undefined` disappears, recursively (in objects it means
 * a removed field — per the contract a modified object is written whole, never merged, so a
 * removed field leaves the base; in arrays it becomes null, like JSON). Applied by every
 * backend before validation, so a domain that keeps an absent optional field as `undefined`
 * writes the same thing on every provider — the field is absent, nowhere an error.
 */
export function stripUndefined(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : stripUndefined(item, seen)));
  }
  if (value !== null && typeof value === 'object') {
    // Only plain objects are rewritten in place; anything else (Date, class instance,
    // circular reference) is left untouched for the validator to refuse loudly.
    const proto = Object.getPrototypeOf(value) as object | null;
    if ((proto !== Object.prototype && proto !== null) || seen.has(value)) return value;
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) out[key] = stripUndefined(item, seen);
    }
    return out;
  }
  return value;
}

/** The commit envelope: refused before anything is written, so a batch never lands half-way.
 *  Validation applies to the sanitized shape — `undefined` is a removed field, not an error. */
export function assertCommitEnvelope(ops: WriteOp[]): void {
  if (ops.length === 0) throw new DocumentValidationError('commit_too_large', 'empty commit');
  if (ops.length > MAX_COMMIT_OPS) {
    throw new DocumentValidationError('commit_too_large', `commit holds ${ops.length} ops (max ${MAX_COMMIT_OPS})`);
  }
  for (const op of ops) assertWritable(op.name, op.id, stripUndefined(op.doc) as Record<string, unknown>);
}
