// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AppTheme, CLASSIQUE_THEME, resolveThemeColors, THEME_COLOR_KEYS } from '@/core/theme';
import type { UserPreferences } from '@/core/preferences';
import { ThemeProvider, useTheme } from './ThemeContext';

// Fake container: preferences in memory + an in-memory theme repository.
const prefs: UserPreferences = {
  language: 'fr',
  default_servings: 4,
  mode: 'dark',
  themeId: '', // even set, device preferences never select the theme (tested below)
  pantryStaples: [],
  dietary_filter: 'all',
};

const snapshotWrites: unknown[] = [];
const themeRepository = {
  cached: () => [] as AppTheme[],
  fetchPublished: () => Promise.resolve([] as AppTheme[]),
  fetchAll: () => Promise.resolve([] as AppTheme[] | null),
  save: () => Promise.resolve({ at: 0 }),
  remove: () => Promise.resolve({ at: 0 }),
  saveActiveSnapshot: (snapshot: unknown) => snapshotWrites.push(snapshot),
};

vi.mock('@/app/ContainerContext', () => ({
  useContainer: () => ({
    preferences: { load: () => prefs, save: (p: Partial<UserPreferences>) => Object.assign(prefs, p) },
    themes: themeRepository,
  }),
}));

/** Consumer exercising the context API. */
const ModeButton = ({ next }: { next: 'light' | 'dark' }) => {
  const { setMode } = useTheme();
  return <button onClick={() => setMode(next)}>set-{next}</button>;
};

const PreviewToggle = () => {
  const { setPreviewTheme, isPreviewing } = useTheme();
  return <button onClick={() => setPreviewTheme(isPreviewing ? null : CLASSIQUE_THEME)}>preview</button>;
};

function render(children: React.ReactNode): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<ThemeProvider>{children}</ThemeProvider>));
  return { root, container };
}

const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name);

// React act() environment (no testing-library here: direct DOM assertions)
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  prefs.mode = 'dark'; // tests share the in-memory preferences: reset the mode
  snapshotWrites.length = 0;
  document.documentElement.style.cssText = '';
  document.documentElement.className = '';
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('ThemeProvider: guarantees § 7.2 (no flash, mode kept, no reload)', () => {
  it('applies the resolved theme (Zitouna) with the complete palette, synchronously before paint', () => {
    render(<div />);
    expect(cssVar('--color-brand')).toBe('#F08A4B'); // Zitouna dark brand (mode = dark)
    expect(cssVar('--color-surface')).toBe('#1A120C');
    for (const key of THEME_COLOR_KEYS) {
      const varName = `--color-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
      expect(cssVar(varName), varName).not.toBe('');
    }
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('a themeId in the device preferences is ignored: the backoffice default is applied', () => {
    prefs.themeId = 'classique';
    render(<div />);
    expect(cssVar('--color-brand')).toBe('#F08A4B'); // Zitouna, not Classique
    prefs.themeId = '';
  });

  it('switching the mode updates the colors with no navigation event', () => {
    const { container } = render(<ModeButton next="light" />);
    expect(cssVar('--color-surface')).toBe('#1A120C');
    act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(cssVar('--color-surface')).toBe('#FDF6EC'); // light applied
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(prefs.mode).toBe('light'); // mode is the only thing saved on the device
  });

  it('a backoffice preview applies its colors, keeps the mode, and stops cleanly', () => {
    const hrefBefore = location.href;
    const { container } = render(<PreviewToggle />);
    expect(cssVar('--color-brand')).toBe('#F08A4B'); // assigned theme before preview
    act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(cssVar('--color-brand')).toBe('#2D5A27'); // Classique previewed
    expect(document.documentElement.classList.contains('dark')).toBe(true); // mode preserved
    // The only snapshot saved so far is the one from the initial render (assigned theme);
    // a preview never writes a snapshot.
    expect((snapshotWrites[0] as { vars: Record<string, string> }).vars['--color-brand']).toBe('#F08A4B');
    expect(snapshotWrites.length).toBe(1);
    // Stop the preview: the assigned theme comes back, without reload
    act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(cssVar('--color-brand')).toBe('#F08A4B');
    expect(location.href).toBe(hrefBefore); // no reload happened
  });

  it('saves the offline snapshot with the resolved theme (it carries the theme, never a preference)', () => {
    render(<div />);
    expect(snapshotWrites.length).toBeGreaterThan(0);
    const snapshot = snapshotWrites[0] as { dark: boolean; vars: Record<string, string> };
    expect(snapshot.dark).toBe(true);
    expect(snapshot.vars['--color-brand']).toBe('#F08A4B');
    expect(snapshot.vars['--color-line-strong']).toBeDefined(); // extended palette included
  });

  it('the resolved colors of the assigned theme are complete (fallbacks filled)', () => {
    const complete = resolveThemeColors({ ...CLASSIQUE_THEME.light }); // an old-theme-shaped palette
    expect(complete.danger).toBe('#C0392B');
  });
});
