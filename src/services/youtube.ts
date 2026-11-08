/**
 * YouTube helpers for recipe videos.
 *
 * Only the 11-character video id is trusted: thumbnails and the embedded
 * player URL are always rebuilt from it, never taken from the stored link.
 */

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

/**
 * Accepts the usual YouTube links and returns the video id, or null:
 *   https://www.youtube.com/watch?v=ID   https://youtu.be/ID
 *   https://www.youtube.com/shorts/ID    https://www.youtube.com/embed/ID
 *   https://m.youtube.com/watch?v=ID&t=42s   a bare ID
 */
export function parseYouTubeId(input: string | undefined | null): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  if (VIDEO_ID_RE.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  let candidate: string | null = null;
  if (url.hostname.toLowerCase() === 'youtu.be') {
    candidate = url.pathname.split('/')[1] ?? null;
  } else if (url.pathname === '/watch') {
    candidate = url.searchParams.get('v');
  } else {
    const match = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(url.pathname);
    candidate = match ? match[1] : null;
  }
  return candidate && VIDEO_ID_RE.test(candidate) ? candidate : null;
}

/** Start time in seconds from `t=90`, `t=1m30s` or `start=90`, if present. */
export function parseYouTubeStart(input: string | undefined | null): number | null {
  try {
    const url = new URL((input ?? '').trim());
    const t = url.searchParams.get('t') ?? url.searchParams.get('start');
    if (!t) return null;
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    if (!m || !m[0]) return null;
    return (parseInt(m[1] || '0', 10) * 3600) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
  } catch {
    return null;
  }
}

/** High quality thumbnail (always exists). `maxres` is sharper but missing on some videos. */
export function youTubeThumbnail(id: string, quality: 'maxres' | 'hq' = 'hq'): string {
  return `https://i.ytimg.com/vi/${id}/${quality === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`;
}

/** Privacy-enhanced player (no tracking cookies until the user plays). */
export function youTubeEmbedUrl(id: string, start?: number | null): string {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' });
  if (start && start > 0) params.set('start', String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Normalized link stored in the recipe (or undefined when the field is empty / invalid). */
export function normalizeYouTubeUrl(input: string | undefined | null): string | undefined {
  const id = parseYouTubeId(input);
  if (!id) return undefined;
  const start = parseYouTubeStart(input);
  return start ? `${youTubeWatchUrl(id)}&t=${start}s` : youTubeWatchUrl(id);
}
