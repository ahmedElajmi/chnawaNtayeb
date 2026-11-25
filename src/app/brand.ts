/**
 * TRANSITIONAL brand configuration — the current default identity (D-05).
 * These values are NOT business constants: the future backoffice (CMS) will
 * replace this source entirely with a resolved identity loaded from storage.
 * Consumers never hardcode the brand: they render an identity already resolved
 * in props (BrandMark), so the source can change without touching them.
 */

/** A resolved brand identity (plain strings, replaceable by the future CMS). */
export interface BrandConfig {
  /** Symbol image (https, public asset); empty → wordmark-only lockup. */
  markSrc: string;
  /** Main wordmark; empty → symbol only (or neutral when no symbol either). */
  wordmark: string;
  /** Signature line under the wordmark; empty → hidden. */
  signature: string;
  /** Optional derja tagline before the signature (header lockup). */
  tagline?: string;
}

export const BRAND: BrandConfig = {
  markSrc: '/mark.png',
  wordmark: 'Chnawa Ntayeb',
  signature: 'by chef Souhed',
  tagline: 'شنوة نطيب؟',
};
