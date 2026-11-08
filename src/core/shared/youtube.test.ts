import { describe, it, expect } from 'vitest';
import { parseYouTubeId, parseYouTubeStart, normalizeYouTubeUrl, youTubeEmbedUrl, youTubeThumbnail } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s`,
    `https://m.youtube.com/watch?feature=share&v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc123`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `www.youtube.com/watch?v=${ID}`,
    `  ${ID}  `,
  ])('%s', (url) => {
    expect(parseYouTubeId(url)).toBe(ID);
  });

  it.each([
    '',
    undefined,
    'pas une url',
    'https://vimeo.com/123456',
    `https://evil.com/watch?v=${ID}`,
    `https://youtube.com.evil.com/watch?v=${ID}`,
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/channel/UC123',
    `javascript:alert(1)//${ID}`,
  ])('rejects %s', (url) => {
    expect(parseYouTubeId(url as string)).toBeNull();
  });
});

describe('start time and normalization', () => {
  it('reads t= in seconds or 1m30s format', () => {
    expect(parseYouTubeStart(`https://youtu.be/${ID}?t=90`)).toBe(90);
    expect(parseYouTubeStart(`https://www.youtube.com/watch?v=${ID}&t=1m30s`)).toBe(90);
    expect(parseYouTubeStart(`https://youtu.be/${ID}`)).toBeNull();
  });

  it('stores a clean watch URL (tracking parameters dropped)', () => {
    expect(normalizeYouTubeUrl(`https://youtu.be/${ID}?si=tracking`)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(normalizeYouTubeUrl(`https://youtu.be/${ID}?t=75`)).toBe(`https://www.youtube.com/watch?v=${ID}&t=75s`);
    expect(normalizeYouTubeUrl('https://vimeo.com/1')).toBeUndefined();
    expect(normalizeYouTubeUrl('')).toBeUndefined();
  });

  it('builds thumbnail and privacy-enhanced embed URLs from the id only', () => {
    expect(youTubeThumbnail(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
    expect(youTubeThumbnail(ID, 'maxres')).toBe(`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
    const embed = youTubeEmbedUrl(ID, 90);
    expect(embed.startsWith(`https://www.youtube-nocookie.com/embed/${ID}?`)).toBe(true);
    expect(embed).toContain('start=90');
    expect(embed).toContain('autoplay=1');
  });
});
