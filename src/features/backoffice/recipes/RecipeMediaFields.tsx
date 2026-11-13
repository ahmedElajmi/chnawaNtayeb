import { useState } from 'react';
import { ImageOff, Loader2, Trash2 } from 'lucide-react';
import { parseYouTubeId } from '@/core/shared';
import { RecipeVideo } from '@/features/recipes/components/RecipeVideo';
import { useBackofficeText } from '../i18n/useBackofficeText';

const INPUT_BASE = 'w-full px-3 py-2 text-xs rounded-lg bg-card border mt-1';
const LABEL = 'text-[11px] font-bold text-slate-600 dark:text-slate-300';

type PhotoStatus = 'loading' | 'ok' | 'error';

/** Recipe photo link with a live preview framed like the recipe cards (same ratio, same fallback). */
export function RecipeImageField({
  value,
  title,
  onChange,
}: {
  value: string;
  title: string;
  onChange: (value: string) => void;
}) {
  const b = useBackofficeText();
  const url = value.trim();
  // Status is remembered per link: a new link starts loading again
  const [status, setStatus] = useState<{ url: string; state: PhotoStatus }>({ url: '', state: 'loading' });
  const state: PhotoStatus = status.url === url ? status.state : 'loading';

  return (
    <div className="space-y-2">
      <label className={`block ${LABEL}`}>
        {b.edPhotoLabel}
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          aria-invalid={!!url && state === 'error'}
          className={`${INPUT_BASE} ${url && state === 'error' ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
        />
      </label>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Same frame as a recipe card */}
        <div className="relative w-full sm:w-56 shrink-0 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 ring-1 ring-line">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-accent/15 to-highlight/20 flex items-center justify-center">
            <img src="/mark.png" alt="" width={94} height={40} className="h-8 w-auto opacity-80" />
          </div>
          {url && state !== 'error' && (
            <img
              key={url}
              src={url}
              alt={b.edPhotoAlt}
              referrerPolicy="no-referrer"
              onLoad={() => setStatus({ url, state: 'ok' })}
              onError={() => setStatus({ url, state: 'error' })}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-xs font-extrabold text-white truncate">{title || b.edRecipeName}</p>
          </div>
          {url && state === 'loading' && (
            <span className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </span>
          )}
        </div>

        <div className="space-y-1.5 min-w-0">
          <p
            className={`text-[11px] ${url && state === 'error' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-ink-muted'}`}
          >
            {!url
              ? b.edNoPhoto
              : state === 'error'
                ? b.edPhotoError
                : state === 'loading'
                  ? b.edPhotoLoading
                  : b.edPhotoOk}
          </p>
          {url && state === 'error' && <ImageOff className="w-4 h-4 text-rose-500" aria-hidden="true" />}
          {url && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-text hover:underline"
            >
              <Trash2 className="w-3 h-3" /> {b.edRemovePhoto}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** YouTube link with a live, playable preview (the very player shown in the recipe sheet). */
export function RecipeVideoField({
  value,
  title,
  onChange,
}: {
  value: string;
  title: string;
  onChange: (value: string) => void;
}) {
  const b = useBackofficeText();
  const videoId = parseYouTubeId(value);
  const invalid = value.trim() !== '' && !videoId;
  return (
    <div className="space-y-2">
      <label className={`block ${LABEL}`}>
        {b.edVideoLabel}
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={b.edVideoPlaceholder}
          aria-invalid={invalid}
          className={`${INPUT_BASE} ${invalid ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
        />
      </label>
      <p className={`text-[10px] ${invalid ? 'text-rose-600 font-semibold' : 'text-ink-muted'}`}>
        {invalid ? b.edVideoInvalid : videoId ? b.edVideoOk : b.edVideoEmpty}
      </p>
      {videoId && (
        <div className="space-y-1.5">
          {/* key: a new video starts on its thumbnail again */}
          <RecipeVideo key={videoId} url={value} title={title || b.edPreview} className="max-w-md" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-text hover:underline"
          >
            <Trash2 className="w-3 h-3" /> {b.edRemoveVideo}
          </button>
        </div>
      )}
    </div>
  );
}
