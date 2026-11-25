import { describe, expect, it } from 'vitest';
import { AppTheme, EXTENDED_THEME_COLOR_KEYS, BASE_THEME_COLOR_KEYS, THEME_COLOR_KEYS, ThemeColors } from './types';
import { CLASSIQUE_THEME, FKHAR_THEME, ZITOUNA_THEME } from './builtinThemes';
import {
  colorsToCssVars,
  contrastRatio,
  isValidTheme,
  mixHex,
  pickThemeFields,
  resolveThemeColors,
} from './validation';

/** Old-style theme: only the 16 base colors, as themes were written before the extension. */
const PALETTE: Record<string, string> = Object.fromEntries(
  BASE_THEME_COLOR_KEYS.map((k) => [k, CLASSIQUE_THEME.light[k]])
);
const OLD_THEME = (overrides: Partial<Record<keyof ThemeColors, string>> = {}): AppTheme => ({
  id: 'old',
  name_fr: 'Old',
  name_derja: 'Old',
  name_ar: 'قديم',
  light: Object.fromEntries(
    BASE_THEME_COLOR_KEYS.map((k) => [k, overrides[k] ?? PALETTE[k]])
  ) as unknown as ThemeColors,
  dark: Object.fromEntries(BASE_THEME_COLOR_KEYS.map((k) => [k, overrides[k] ?? PALETTE[k]])) as unknown as ThemeColors,
  displayFont: 'plus-jakarta',
  cardShape: 'rounded',
  pattern: 'none',
  is_published: true,
});

describe('theme types: additive extension (A2)', () => {
  it('keeps the 16 base colors and adds exactly the 12 extended colors', () => {
    expect(BASE_THEME_COLOR_KEYS).toHaveLength(16);
    expect(EXTENDED_THEME_COLOR_KEYS).toHaveLength(12);
    expect(THEME_COLOR_KEYS).toHaveLength(28);
  });

  it('built-in themes resolve to a complete palette in both modes', () => {
    for (const theme of [CLASSIQUE_THEME, FKHAR_THEME, ZITOUNA_THEME]) {
      for (const mode of ['light', 'dark'] as const) {
        const colors = resolveThemeColors(theme[mode]);
        for (const key of THEME_COLOR_KEYS) {
          expect(colors[key], `${theme.id}/${mode}/${key}`).toBeDefined();
        }
      }
    }
  });
});

describe('parseTheme: additive migration at read time', () => {
  it('accepts an old theme without the extended colors at validation time', () => {
    const old = OLD_THEME();
    expect(isValidTheme(old)).toBe(true);
    // The old document stays as-is: extended keys stay absent (never written
    // destructively), completion happens in resolveThemeColors at read time.
    for (const key of EXTENDED_THEME_COLOR_KEYS) {
      expect(old.light[key]).toBeUndefined();
    }
  });

  it('rejects an old theme whose base colors are invalid', () => {
    const bad = OLD_THEME({ brand: 'not-a-color' });
    expect(isValidTheme(bad as unknown as AppTheme)).toBe(false);
  });

  it('accepts a theme that defines some extended colors, validating them', () => {
    const partial = OLD_THEME();
    partial.light.danger = '#B4233C';
    expect(isValidTheme(partial as unknown as AppTheme)).toBe(true);
    const invalid = OLD_THEME();
    invalid.light.danger = 'red';
    expect(isValidTheme(invalid as unknown as AppTheme)).toBe(false);
  });

  it('still validates a complete modern theme', () => {
    expect(isValidTheme(ZITOUNA_THEME)).toBe(true);
  });
});

describe('pickThemeFields: defined colors only', () => {
  it('drops undefined extended keys instead of writing undefined (object written whole)', () => {
    const picked = pickThemeFields(OLD_THEME());
    expect(picked.light.danger).toBeUndefined();
    expect(Object.keys(picked.light)).toHaveLength(16);
  });

  it('keeps defined extended keys', () => {
    const withDanger = OLD_THEME();
    withDanger.light.danger = '#B4233C';
    const picked = pickThemeFields(withDanger as unknown as AppTheme);
    expect(picked.light.danger).toBe('#B4233C');
  });
});

describe('resolveThemeColors: derived fallbacks (pure)', () => {
  it('completes an old theme in both modes, never returning undefined', () => {
    const resolved = resolveThemeColors(OLD_THEME().light);
    for (const key of THEME_COLOR_KEYS) {
      expect(resolved[key], key).toBeDefined();
    }
    expect(resolved.danger).toBe('#C0392B');
    expect(resolved.focusRing).toBe(OLD_THEME().light.brand);
  });

  it('does not mutate the input object', () => {
    const input = OLD_THEME().light;
    const before = { ...input };
    resolveThemeColors(input);
    expect(input).toEqual(before);
  });

  it('keeps colors explicitly defined by the theme', () => {
    const withDanger = OLD_THEME();
    withDanger.light.danger = '#B4233C';
    const resolved = resolveThemeColors(withDanger.light);
    expect(resolved.danger).toBe('#B4233C');
  });

  it('derives a tint from the card background', () => {
    const resolved = resolveThemeColors(OLD_THEME().light);
    expect(resolved.tint).toMatch(/^#[0-9A-F]{6}$/i);
    expect(resolved.tint).not.toBe(OLD_THEME().light.card);
  });

  it('derives lineStrong with at least 3:1 contrast against the card', () => {
    // A very light line on a white card: lineStrong must be darkened until >= 3:1.
    const resolved = resolveThemeColors(OLD_THEME({ line: '#F2F2F2', card: '#FFFFFF', ink: '#222222' }).light);
    expect(contrastRatio(resolved.lineStrong as string, OLD_THEME().light.card)).toBeGreaterThanOrEqual(3);
  });
});

describe('colorsToCssVars', () => {
  it('emits the extended variables on a complete theme', () => {
    const vars = colorsToCssVars(resolveThemeColors(ZITOUNA_THEME.light));
    expect(vars['--color-brand']).toBe('#B84D1A');
    expect(vars['--color-tint']).toBeDefined();
    expect(vars['--color-line-strong']).toBe(ZITOUNA_THEME.light.lineStrong);
    expect(vars['--color-danger-text']).toBe(ZITOUNA_THEME.light.dangerText);
  });

  it('skips undefined keys on an old theme (no undefined in CSS)', () => {
    const vars = colorsToCssVars(OLD_THEME().light);
    expect(Object.keys(vars)).toHaveLength(16);
  });
});

describe('mixHex', () => {
  it('mixes two hex colors', () => {
    expect(mixHex('#FFFFFF', '#000000', 0.5)).toBe('#808080');
    expect(mixHex('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
  });

  it('returns the first color unchanged when the other is invalid', () => {
    expect(mixHex('#123456', 'nope', 0.5)).toBe('#123456');
  });
});

describe('built-in themes: AA contrast on the pairs really used (report)', () => {
  const pairs: [keyof ThemeColors, keyof ThemeColors, string][] = [
    ['ink', 'surface', 'texte sur fond'],
    ['ink', 'card', 'texte sur carte'],
    ['inkMuted', 'card', 'texte secondaire sur carte'],
    ['brandText', 'card', 'marque (texte) sur carte'],
    ['accentText', 'card', 'accent (texte) sur carte'],
    ['onBrand', 'brand', 'texte sur bouton principal'],
    ['onAccent', 'accent', "texte sur bouton d'action"],
    ['dangerText', 'card', 'danger (texte) sur carte'],
    ['successText', 'card', 'success (texte) sur carte'],
    ['warningText', 'card', 'warning (texte) sur carte'],
    ['infoText', 'card', 'info (texte) sur carte'],
    ['lineStrong', 'card', 'bordure utile sur carte'],
  ];

  it('Zitouna clair : chaque paire atteint le seuil attendu', () => {
    const light = resolveThemeColors(ZITOUNA_THEME.light);
    const ratios: string[] = [];
    for (const [fg, bg, label] of pairs) {
      const ratio = contrastRatio(light[fg] as string, light[bg] as string);
      ratios.push(`${label}=${ratio.toFixed(2)}`);
      if (bg === 'card' && fg === 'lineStrong') continue;
      expect(ratio, `${label} (${light[fg]} sur ${light[bg]})`).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratios.join(' · ')).toContain('danger');
  });

  it('Zitouna clair : bordure utile >= 3:1 sur carte', () => {
    const light = resolveThemeColors(ZITOUNA_THEME.light);
    expect(contrastRatio(light.lineStrong as string, light.card)).toBeGreaterThanOrEqual(3);
  });

  it('Zitouna sombre : chaque paire texte/fond atteint 4.5:1, bordure utile >= 3:1', () => {
    const dark = resolveThemeColors(ZITOUNA_THEME.dark);
    for (const [fg, bg, label] of pairs) {
      if (fg === 'lineStrong') {
        expect(contrastRatio(dark.lineStrong as string, dark.card), label).toBeGreaterThanOrEqual(3);
        continue;
      }
      expect(
        contrastRatio(dark[fg] as string, dark[bg] as string),
        `${label} (${dark[fg]} sur ${dark[bg]})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
