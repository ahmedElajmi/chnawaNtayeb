import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AppTheme, BUILTIN_THEMES, CLASSIQUE_THEME, colorsToCssVars, FONT_REGISTRY } from '@/core/theme';
import { ThemeMode } from '@/core/preferences';
import { useContainer } from '@/app/ContainerContext';

interface ThemeContextType {
  /** Built-in themes + themes published by the admin */
  themes: AppTheme[];
  activeTheme: AppTheme;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setThemeId: (id: string) => void;
  /** Temporarily applies a theme to the whole app (backoffice "try it" button). `null` stops the preview. */
  setPreviewTheme: (theme: AppTheme | null) => void;
  isPreviewing: boolean;
  refreshThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function ensureFontLoaded(href: string | null) {
  if (!href) return;
  const id = `theme-font-${btoa(href).slice(0, 24)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, themes: themeRepository } = useContainer();
  const [mode, setModeState] = useState<ThemeMode>(() => preferences.load().mode);
  const [themeId, setThemeIdState] = useState<string>(() => preferences.load().themeId);
  const [remoteThemes, setRemoteThemes] = useState<AppTheme[]>(() => themeRepository.cached());
  const [previewTheme, setPreviewTheme] = useState<AppTheme | null>(null);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemDark);

  // Follow the OS setting while in "system" mode
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const refreshThemes = useCallback(async () => {
    const list = await themeRepository.fetchPublished();
    setRemoteThemes(list);
  }, [themeRepository]);

  // Published themes, loaded once at start (the offline copy is shown meanwhile)
  useEffect(() => {
    let cancelled = false;
    themeRepository
      .fetchPublished()
      .then((list) => !cancelled && setRemoteThemes(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [themeRepository]);

  const themes = useMemo(() => {
    const builtinIds = new Set(BUILTIN_THEMES.map((t) => t.id));
    return [...BUILTIN_THEMES, ...remoteThemes.filter((t) => t.is_published && !builtinIds.has(t.id))];
  }, [remoteThemes]);

  // Unknown or unpublished theme → fall back to Classique
  const selectedTheme = themes.find((t) => t.id === themeId) ?? CLASSIQUE_THEME;
  const activeTheme = previewTheme ?? selectedTheme;
  const resolvedMode: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  // Apply the theme to <html> before paint
  useLayoutEffect(() => {
    const root = document.documentElement;
    const colors = resolvedMode === 'dark' ? activeTheme.dark : activeTheme.light;
    const vars = colorsToCssVars(colors);
    const font = FONT_REGISTRY[activeTheme.displayFont] ?? FONT_REGISTRY['plus-jakarta'];
    vars['--font-display'] = font.family;

    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.classList.toggle('dark', resolvedMode === 'dark');
    root.style.colorScheme = resolvedMode;
    root.dataset.cardShape = activeTheme.cardShape;
    root.dataset.pattern = activeTheme.pattern;
    ensureFontLoaded(font.href);

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.surface);

    if (!previewTheme) {
      themeRepository.saveActiveSnapshot({
        dark: resolvedMode === 'dark',
        vars,
        cardShape: activeTheme.cardShape,
        pattern: activeTheme.pattern,
      });
    }
  }, [activeTheme, resolvedMode, previewTheme, themeRepository]);

  const setMode = (next: ThemeMode) => {
    preferences.save({ mode: next });
    setModeState(next);
  };

  const setThemeId = (id: string) => {
    preferences.save({ themeId: id });
    setThemeIdState(id);
  };

  return (
    <ThemeContext.Provider
      value={{
        themes,
        activeTheme,
        mode,
        resolvedMode,
        setMode,
        setThemeId,
        setPreviewTheme,
        isPreviewing: !!previewTheme,
        refreshThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
