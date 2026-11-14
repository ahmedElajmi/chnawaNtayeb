import { describe, expect, it } from 'vitest';
import { clampPollLimit, clampPollingSeconds, injectAppConfig } from './appConfig';

describe('the injected server configuration', () => {
  it('injects a single safe inline script right after <head>', () => {
    const html = injectAppConfig('<html><head><title>t</title></head></html>', { pollingSeconds: 30 });
    expect(html).toContain('<head>');
    expect(html).toContain('window.__APP_CONFIG__={"pollingSeconds":30}');
    expect((html.match(/__APP_CONFIG__/g) ?? []).length).toBe(1);
  });

  it('clamps the interval to the configured bounds', () => {
    expect(clampPollingSeconds(1)).toBe(15);
    expect(clampPollingSeconds(5000)).toBe(600);
    expect(clampPollingSeconds('garbage')).toBe(60);
    const html = injectAppConfig('<html><head></head></html>', { pollingSeconds: 1 });
    expect(html).toContain('{"pollingSeconds":15}');
  });

  it('never lets a value break out of the inline script', () => {
    // A future text setting passes through the same serializer: `</script>` stays escaped
    const html = injectAppConfig('<html><head></head></html>', { pollingSeconds: 60 });
    expect(html).not.toContain('</script></script>');
    expect(html.endsWith('</html>')).toBe(true);
  });

  it('keeps working for a page without <head>', () => {
    const html = injectAppConfig('plain content', { pollingSeconds: 60 });
    expect(html.startsWith('<script>window.__APP_CONFIG__=')).toBe(true);
  });

  it('clamps the poll ceiling to its bounds', () => {
    expect(clampPollLimit(5)).toBe(30);
    expect(clampPollLimit(100000)).toBe(6000);
    expect(clampPollLimit(undefined)).toBe(300);
  });
});
