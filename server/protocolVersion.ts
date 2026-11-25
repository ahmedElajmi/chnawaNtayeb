/**
 * Application protocol version gate (lot B22-07, D16 fail-closed).
 *
 * Every kitchen sync request declares its protocol version through
 * `X-Kitchen-Protocol-Version`. Writes are refused when the declared version is not
 * supported; tolerated reads carry `X-Kitchen-Protocol-Status: reconciliation-required`
 * — a per-request server signal, never a device registry nor a durable proof.
 * An unauthenticated request is never classified here: the handlers keep answering 401
 * exactly as before (the gate reuses `sessionOf` and skips the version for them).
 *
 * The initial supported version is `1`; the evolution policy of the supported set
 * (minimum version, widening) stays open (arbitration P3) — this module only reads the
 * list, it never grows it. Compatibility is the explicit list, never an order: a lower
 * version that is not listed stays refused.
 */

export const PROTOCOL_VERSION_HEADER = 'X-Kitchen-Protocol-Version';
export const PROTOCOL_STATUS_HEADER = 'X-Kitchen-Protocol-Status';
export const PROTOCOL_STATUS_RECONCILIATION_REQUIRED = 'reconciliation-required';

/** B22-07 initial value — NOT the P3 decision: the set evolution stays open. */
export const SUPPORTED_PROTOCOL_VERSIONS = ['1'];

const MAX_COMPONENTS = 3;
const MAX_COMPONENT_DIGITS = 6;
const MAX_HEADER_LENGTH = 32;
const VERSION_PATTERN = /^[0-9]+(\.[0-9]+)*$/;

/** A parsed, normalized version: integer components, leading zeros dropped. */
export type ParsedProtocolVersion = number[];

/** Null for any malformed, over-bounded declaration (answers 400). */
export function parseProtocolVersion(raw: string): ParsedProtocolVersion | null {
  if (raw.length === 0 || raw.length > MAX_HEADER_LENGTH) return null;
  if (!VERSION_PATTERN.test(raw)) return null;
  const parts = raw.split('.');
  if (parts.length > MAX_COMPONENTS) return null;
  if (parts.some((part) => part.length > MAX_COMPONENT_DIGITS)) return null;
  return parts.map((part) => Number.parseInt(part, 10));
}

/** Numeric, component-wise comparison; missing components count as 0. Never lexical. */
export function compareProtocolVersions(a: ParsedProtocolVersion, b: ParsedProtocolVersion): number {
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

export type ProtocolVersionOutcome =
  | { status: 'supported' }
  | { status: 'older-unsupported' }
  | { status: 'later-unsupported' }
  | { status: 'absent' }
  | { status: 'invalid' };

/**
 * Classifies the declared version of one request. A duplicate or comma-joined header is
 * malformed (never silently resolved to the first value). A well-formed unknown version
 * is older or later than the supported set; membership — not order — decides compatibility.
 * `declared` arrives as `req.headers` gives it (a repeated header becomes a joined string
 * or an array): anything that is not exactly one plain string is malformed.
 */
export function classifyProtocolVersion(
  declared: string | string[] | undefined,
  rawHeaders: readonly string[]
): ProtocolVersionOutcome {
  const lowered = PROTOCOL_VERSION_HEADER.toLowerCase();
  let occurrences = 0;
  for (let index = 0; index < rawHeaders.length; index += 2) {
    if (rawHeaders[index]?.toLowerCase() === lowered) occurrences += 1;
  }
  if (occurrences > 1 || Array.isArray(declared)) return { status: 'invalid' };
  if (declared === undefined) return { status: 'absent' };
  if (declared.includes(',')) return { status: 'invalid' };
  const parsed = parseProtocolVersion(declared);
  if (!parsed) return { status: 'invalid' };
  const supported = SUPPORTED_PROTOCOL_VERSIONS.map((entry) => parseProtocolVersion(entry)).filter(
    (entry): entry is ParsedProtocolVersion => entry !== null
  );
  if (supported.some((entry) => compareProtocolVersions(entry, parsed) === 0)) return { status: 'supported' };
  if (supported.some((entry) => compareProtocolVersions(entry, parsed) > 0)) return { status: 'older-unsupported' };
  return { status: 'later-unsupported' };
}
