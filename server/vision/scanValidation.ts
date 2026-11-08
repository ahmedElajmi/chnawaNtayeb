import { UNKNOWN_INGREDIENT_ID, type CatalogEntry, type FridgeScan, type ScanImage } from './visionProvider';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const CATALOG_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export type ImageCheck = { ok: true; image: ScanImage } | { ok: false; status: number; error: string; message: string };

/** Checks the photo sent by the client (type, encoding, size). */
export function parseScanImage(imageBase64: unknown, mimeType: unknown = 'image/jpeg'): ImageCheck {
  if (typeof imageBase64 !== 'string' || !imageBase64) {
    return { ok: false, status: 400, error: 'bad_request', message: 'Image manquante.' };
  }
  if (typeof mimeType !== 'string' || !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return { ok: false, status: 415, error: 'unsupported_type', message: 'Format accepté : JPEG, PNG ou WebP.' };
  }
  const base64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(base64) || Math.floor((base64.length * 3) / 4) > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, error: 'image_too_large', message: 'Image trop lourde (4 Mo maximum).' };
  }
  return { ok: true, image: { mimeType, base64 } };
}

/** Validates the ingredient catalog sent by the client (ids + display names only). */
export function parseCatalog(raw: unknown): CatalogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: CatalogEntry[] = [];
  for (const item of raw.slice(0, 300)) {
    if (!item || typeof item !== 'object') continue;
    const { id, name } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !CATALOG_ID_RE.test(id) || id === UNKNOWN_INGREDIENT_ID) continue;
    if (typeof name !== 'string' || !name.trim() || name.length > 80) continue;
    // Names are only data for the prompt: strip line breaks so they cannot add instructions
    out.push({ id, name: name.replace(/[\r\n]+/g, ' ').trim() });
  }
  return out;
}

/** Never trusts the model: keeps known ids only, limits sizes and lengths. */
export function sanitizeScan(raw: unknown, catalog: CatalogEntry[]): FridgeScan {
  const parsed = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const validIds = new Set(catalog.map((c) => c.id));
  const detected = Array.isArray(parsed.detected_ingredients) ? parsed.detected_ingredients : [];
  const dishes = Array.isArray(parsed.dish_suggestions) ? parsed.dish_suggestions : [];
  return {
    ingredients: detected
      .filter(
        (d): d is Record<string, unknown> =>
          !!d && typeof d === 'object' && typeof (d as Record<string, unknown>).name_fr === 'string'
      )
      .slice(0, 40)
      .map((d) => ({
        ingredient_id: typeof d.ingredient_id === 'string' && validIds.has(d.ingredient_id) ? d.ingredient_id : null,
        name_fr: String(d.name_fr).slice(0, 80),
        confidence: d.confidence === 'haute' ? 'haute' : 'moyenne',
      })),
    suggestions: dishes
      .filter((s): s is string => typeof s === 'string')
      .slice(0, 3)
      .map((s) => s.slice(0, 80)),
  };
}
