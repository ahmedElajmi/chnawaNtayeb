import type { FridgeScanResult, VisionGateway } from '@/application';

/** Fridge photo recognition by our server (/api/vision/scan-fridge, AI provider chosen server side). */
export const visionHttpGateway: VisionGateway = {
  async scanFridge(image, catalog): Promise<FridgeScanResult> {
    const res = await fetch('/api/vision/scan-fridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: image.dataUrl, mimeType: image.mimeType, catalog }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'Erreur d’analyse');
    return {
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    };
  },
};
