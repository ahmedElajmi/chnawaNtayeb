// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { BRAND } from '@/app/brand';
import { BrandMark } from './BrandMark';

function render(ui: React.ReactElement): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return { root, container };
}

describe('BrandMark: resolved identity with the four fallback cases', () => {
  it('renders the full lockup: symbol + wordmark + signature (and tagline)', () => {
    const { container, root } = render(<BrandMark brand={BRAND} tagline={BRAND.tagline} />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/mark.png');
    expect(container.textContent).toContain('Chnawa Ntayeb');
    expect(container.textContent).toContain('by chef Souhed');
    expect(container.textContent).toContain('شنوة نطيب؟');
    act(() => root.unmount());
  });

  it('case 3 — broken image: falls back to text only and traces the anomaly in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container, root } = render(<BrandMark brand={BRAND} />);
    const img = container.querySelector('img')!;
    act(() => img.dispatchEvent(new Event('error')));
    expect(container.querySelector('img')).toBeNull(); // no broken display
    expect(container.textContent).toContain('Chnawa Ntayeb'); // text-only lockup
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    act(() => root.unmount());
  });

  it('case 2 — no wordmark: symbol only, never an invented name', () => {
    const { container, root } = render(<BrandMark brand={{ ...BRAND, wordmark: '' }} />);
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.textContent!.trim()).toBe('');
    act(() => root.unmount());
  });

  it('case 2 bis — no symbol and no wordmark: neutral (nothing rendered)', () => {
    const { container, root } = render(<BrandMark brand={{ ...BRAND, markSrc: '', wordmark: '' }} />);
    expect(container.innerHTML).toBe('');
    act(() => root.unmount());
  });

  it('case 1 — no symbol available: the resolved name is shown as text', () => {
    const { container, root } = render(<BrandMark brand={{ ...BRAND, markSrc: '' }} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Chnawa Ntayeb');
    act(() => root.unmount());
  });

  it('case 4 — partial identity: only the available elements are shown', () => {
    const { container, root } = render(<BrandMark brand={{ markSrc: '', wordmark: 'Chnawa Ntayeb', signature: '' }} />);
    expect(container.textContent).toContain('Chnawa Ntayeb');
    expect(container.textContent).not.toContain('by chef Souhed');
    act(() => root.unmount());
  });
});
