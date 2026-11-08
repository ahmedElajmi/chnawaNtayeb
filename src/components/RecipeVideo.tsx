import React, { useState } from 'react';
import { Play, ExternalLink, Clapperboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseYouTubeId, parseYouTubeStart, youTubeEmbedUrl, youTubeThumbnail, youTubeWatchUrl } from '../services/youtube';

interface RecipeVideoProps {
  url?: string;
  title: string;
  className?: string;
}

/**
 * "How to cook it" video.
 * - Renders nothing when there is no (valid) YouTube link.
 * - Shows the YouTube thumbnail first; the player (youtube-nocookie) is only
 *   loaded when the user presses play: faster page, no tracking before that.
 */
export const RecipeVideo: React.FC<RecipeVideoProps> = ({ url, title, className = '' }) => {
  const { t } = useLanguage();
  const id = parseYouTubeId(url);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumb, setThumb] = useState<'maxres' | 'hq' | 'none'>('maxres');

  if (!id) return null;

  return (
    <section className={`space-y-2 ${className}`} aria-label={t.videoTitle}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-accent-text" />
          <span>{t.videoTitle}</span>
        </h3>
        <a
          href={youTubeWatchUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-brand-text"
        >
          {t.videoOpenYoutube}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-lg ring-1 ring-black/10">
        {isPlaying ? (
          <iframe
            src={youTubeEmbedUrl(id, parseYouTubeStart(url))}
            title={`${t.videoTitle} : ${title}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`${t.videoWatch} : ${title}`}
            className="group absolute inset-0 w-full h-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/60"
          >
            {thumb !== 'none' ? (
              <img
                src={youTubeThumbnail(id, thumb === 'maxres' ? 'maxres' : 'hq')}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                // maxres does not exist for every video: YouTube then returns a 120px grey placeholder
                onLoad={(e) => {
                  if (thumb === 'maxres' && e.currentTarget.naturalWidth <= 120) setThumb('hq');
                }}
                onError={() => setThumb(thumb === 'maxres' ? 'hq' : 'none')}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-hero-from to-hero-to" />
            )}

            {/* Readability scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />

            {/* Play button */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-accent shadow-2xl ring-8 ring-white/20 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
              </span>
            </span>

            {/* Caption */}
            <span className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-white/75">
                  {t.videoTitle}
                </span>
                <span className="block font-display text-sm sm:text-base font-extrabold text-white truncate">{title}</span>
              </span>
              <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-[11px] font-semibold text-white">
                <Play className="w-3 h-3 fill-current" />
                {t.videoWatch}
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
