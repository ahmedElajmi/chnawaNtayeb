import { describe, expect, it } from 'vitest';
import { AppTheme, BUILTIN_THEMES, ZITOUNA_THEME, resolveThemeColors, THEME_COLOR_KEYS } from '@/core/theme';
import { resolveTheme } from './resolveTheme';

const published: AppTheme = {
  id: 'custom',
  name_fr: 'Custom',
  name_derja: 'Custom',
  name_ar: 'مخصص',
  light: resolveThemeColors(ZITOUNA_THEME.light),
  dark: resolveThemeColors(ZITOUNA_THEME.dark),
  displayFont: 'fraunces',
  cardShape: 'rounded',
  pattern: 'none',
  is_published: true,
};

describe('resolveTheme: backoffice-only selection (client never picks a theme)', () => {
  it('applies the configured default when no theme is requested', () => {
    expect(resolveTheme(BUILTIN_THEMES, null, 'zitouna').id).toBe('zitouna');
  });

  it('applies a requested theme found in the list, never replaced by the default', () => {
    const themes = [ZITOUNA_THEME, published];
    expect(resolveTheme(themes, 'custom', 'zitouna').id).toBe('custom');
    expect(resolveTheme(themes, 'zitouna', 'zitouna').id).toBe('zitouna');
  });

  it('falls back to the configured default only when the requested theme is unavailable', () => {
    expect(resolveTheme(BUILTIN_THEMES, 'gone', 'zitouna').id).toBe('zitouna');
  });

  it('does not honor an unpublished theme (never shown to visitors)', () => {
    const themes = [ZITOUNA_THEME, { ...published, is_published: false }];
    expect(resolveTheme(themes, 'custom', 'zitouna').id).toBe('zitouna');
  });

  it('never reads storage or the network itself (pure function over given data)', () => {
    // Signature contract: data in, theme out. No loader, no promise, no I/O.
    expect(resolveTheme.length).toBe(3);
    const result = resolveTheme(BUILTIN_THEMES, null, 'zitouna');
    expect(typeof result).toBe('object');
  });

  it('the resolved theme colors are complete (old theme extended at read time)', () => {
    const old = BUILTIN_THEMES.find((t) => t.id === 'classique')!;
    const resolved = resolveTheme([old], null, 'classique');
    for (const key of THEME_COLOR_KEYS) {
      expect(resolveThemeColors(resolved.light)[key], key).toBeDefined();
    }
  });
});
