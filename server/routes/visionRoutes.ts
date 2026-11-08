import express from 'express';
import rateLimit from 'express-rate-limit';
import type { VisionProvider } from '../vision/visionProvider';
import { parseCatalog, parseScanImage, sanitizeScan } from '../vision/scanValidation';

export const VISION_PATH = '/api/vision/scan-fridge';

/** POST /api/vision/scan-fridge: ingredients recognized on a photo. `provider` is null when no AI is configured. */
export function visionRoutes(provider: VisionProvider | null): express.Router {
  const router = express.Router();

  // Each scan costs a paid AI call: 10 scans per IP per hour
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Trop de scans pour le moment. Réessayez dans une heure.' },
  });

  router.post(VISION_PATH, limiter, express.json({ limit: '6mb' }), async (req, res) => {
    const { imageBase64, mimeType, catalog: rawCatalog } = req.body ?? {};
    const checked = parseScanImage(imageBase64, mimeType ?? 'image/jpeg');
    if (!checked.ok) return res.status(checked.status).json({ error: checked.error, message: checked.message });
    if (!provider) {
      return res
        .status(503)
        .json({ error: 'not_configured', message: 'Le scanner photo n est pas disponible pour le moment.' });
    }
    try {
      const catalog = parseCatalog(rawCatalog);
      const scan = sanitizeScan(await provider.scanFridge(checked.image, catalog), catalog);
      return res.json({ success: true, ...scan });
    } catch (error) {
      // Details stay in the server logs; the client gets a generic message
      console.error('Error scanning fridge image:', error);
      return res.status(500).json({ error: 'vision_failed', message: 'Impossible d analyser l image pour le moment.' });
    }
  });

  return router;
}
