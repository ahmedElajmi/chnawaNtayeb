/**
 * Fridge photo recognition, independent of the AI vendor.
 * Implementations: geminiVisionProvider.ts. To use another model, write a new provider
 * implementing `VisionProvider` and select it in server/app.ts.
 */

/** Ingredient of the app catalog, sent with the photo so the AI answers with known ids. */
export interface CatalogEntry {
  id: string;
  name: string;
}

export interface DetectedIngredient {
  /** Catalog id, or null when the ingredient is not in the catalog */
  ingredient_id: string | null;
  name_fr: string;
  confidence: 'haute' | 'moyenne';
}

export interface FridgeScan {
  ingredients: DetectedIngredient[];
  /** 2 or 3 Tunisian dishes that could be cooked */
  suggestions: string[];
}

export interface ScanImage {
  mimeType: string;
  /** Raw base64 (no data: prefix) */
  base64: string;
}

export interface VisionProvider {
  /** Raw answer of the model; always cleaned with `sanitizeScan` before being returned */
  scanFridge(image: ScanImage, catalog: CatalogEntry[]): Promise<unknown>;
}

/** Id the model must use for an ingredient that is not in the catalog. */
export const UNKNOWN_INGREDIENT_ID = 'other';
