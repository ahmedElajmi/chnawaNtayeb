import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Ingredient } from '../types';
import { findByName } from '../services/textNormalize';
import { useCloseOnBack } from '../hooks/useBackNavigation';

const MAX_SIDE_PX = 1280;

/** Downscales the photo (phone pictures are often 5+ MB) to a JPEG of at most MAX_SIDE_PX. */
async function toCompressedDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image'));
      img.src = original;
    });
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return original;
  }
}

interface PhotoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableIngredients: Ingredient[];
  onAddIngredients: (ingredientIds: string[]) => void;
}

export const PhotoScannerModal: React.FC<PhotoScannerModalProps> = ({
  isOpen,
  onClose,
  availableIngredients,
  onAddIngredients,
}) => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<{ id?: string; name: string; checked: boolean }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useCloseOnBack(isOpen, onClose);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setImagePreview(await toCompressedDataUrl(file));
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/vision/scan-fridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imagePreview.match(/^data:(image\/[a-z+]+);/)?.[1] || selectedFile?.type || 'image/jpeg',
          // Gemini must answer with ids from this catalog (no fuzzy name guessing)
          catalog: availableIngredients.map((ing) => ({
            id: ing.id,
            name: ing.name_derja && ing.name_derja !== ing.name_fr ? `${ing.name_fr} (${ing.name_derja})` : ing.name_fr,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erreur d analyse');
      }

      // 1) id chosen by Gemini from our catalog, 2) normalized name matching as a fallback
      const rawList: { ingredient_id?: string | null; name_fr: string }[] = data.ingredients || [];
      const seen = new Set<string>();
      const matched: { id?: string; name: string; checked: boolean }[] = [];
      for (const det of rawList) {
        const found =
          availableIngredients.find((ing) => ing.id === det.ingredient_id) ?? findByName(det.name_fr, availableIngredients);
        const key = found ? found.id : `?${det.name_fr.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matched.push({ id: found?.id, name: found ? found.name_fr : det.name_fr, checked: !!found });
      }
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);

      if (matched.length === 0) {
        setErrorMsg('Aucun ingrédient spécifique n a été détecté sur cette photo. Essayez de photographier vos ingrédients de plus près.');
      } else {
        setDetectedItems(matched);
      }
    } catch (err: any) {
      console.warn('Scan fridge error:', err);
      setErrorMsg(err.message || "Impossible d'analyser l'image pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (index: number) => {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleConfirm = () => {
    const selectedIds = detectedItems
      .filter((item) => item.checked && item.id)
      .map((item) => item.id as string);

    if (selectedIds.length > 0) {
      onAddIngredients(selectedIds);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-line p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col text-ink">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand-text">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">
                {t.scannerTitle}
              </h3>
              <p className="text-xs text-slate-500">{t.scannerDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!imagePreview ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-brand/30 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-center">
              <Camera className="w-12 h-12 text-brand-text mb-3 stroke-[1.5px]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Photographiez votre frigo ou votre plan de travail
              </p>
              <p className="text-xs text-slate-500 max-w-xs mb-5">
                L'IA analysera les légumes, viandes, œufs, conserves et condiments visibles.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Take Photo button for mobile */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-semibold hover:bg-brand-strong transition shadow-sm active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.scannerCameraBtn}</span>
                </button>
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {/* Upload from Gallery button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.scannerUploadBtn}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-black flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Frigo scanné"
                  referrerPolicy="no-referrer"
                  className="max-h-56 w-full object-contain"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                    setDetectedItems([]);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detectedItems.length === 0 && !isLoading && (
                <button
                  onClick={handleAnalyze}
                  className="w-full py-3 rounded-xl bg-accent text-on-accent font-bold text-sm hover:bg-accent-strong transition flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lancer l'analyse par IA</span>
                </button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-brand-text animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t.scannerAnalyzing}
              </p>
              <p className="text-xs text-slate-500">
                Identification des aliments tunisiens en cours...
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Information</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {detectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.scannerDetected}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {detectedItems.map((item, idx) => item.id ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleItem(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                      item.checked
                        ? 'border-brand bg-brand/10 text-brand-text'
                        : 'border-slate-200 dark:border-slate-700 bg-card text-slate-600'
                    }`}
                  >
                    <span className="truncate pr-1">{item.name}</span>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                        item.checked ? 'bg-brand text-on-brand' : 'border border-slate-300'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                ) : (
                  // Not in the catalog: let the user map it to an ingredient, or ignore it
                  <label
                    key={idx}
                    className="col-span-2 flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-dashed border-line text-xs"
                  >
                    <span className="font-medium text-ink">« {item.name} »</span>
                    <span className="text-ink-muted">non reconnu, associer à :</span>
                    <select
                      defaultValue=""
                      onChange={(e) =>
                        setDetectedItems((prev) =>
                          prev.map((it, i) =>
                            i === idx && e.target.value
                              ? { id: e.target.value, name: availableIngredients.find((a) => a.id === e.target.value)?.name_fr || it.name, checked: true }
                              : it
                          )
                        )
                      }
                      className="flex-1 min-w-[140px] px-2 py-1 rounded-md bg-surface border border-line text-ink"
                    >
                      <option value="">Ignorer</option>
                      {[...availableIngredients]
                        .sort((a, b) => a.name_fr.localeCompare(b.name_fr, 'fr'))
                        .map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name_fr}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}
              </div>
              {suggestions.length > 0 && (
                <p className="text-[11px] text-ink-muted pt-1">
                  Idées de plats : {suggestions.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {detectedItems.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {t.boCancel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-md"
            >
              {t.scannerAddSelected} ({detectedItems.filter((i) => i.checked).length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
