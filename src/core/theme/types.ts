// Themes

/**
 * Every value is a #RRGGBB hex color (validated, see ./validation.ts).
 * The 16 base colors are required in every theme; the 12 semantic and
 * utility colors are optional in stored documents (themes written before
 * this extension are completed at read time by `resolveThemeColors`,
 * see ./validation.ts) — reading an old theme never yields `undefined`.
 */
export interface ThemeColors {
  brand: string; // Primary color (buttons, active states)
  brandStrong: string; // Hover / pressed primary
  brandText: string; // Primary color used as text, readable on `surface`/`card`
  onBrand: string; // Text on top of `brand`
  accent: string; // Call-to-action color
  accentStrong: string; // Hover / pressed accent
  accentText: string; // Accent used as text, readable on `surface`/`card`
  onAccent: string; // Text on top of `accent`
  highlight: string; // Small decorative touches (badges, stars)
  surface: string; // Page background
  card: string; // Cards, panels, modals
  line: string; // Borders
  ink: string; // Main text
  inkMuted: string; // Secondary text
  heroFrom: string; // Home hero gradient start
  heroTo: string; // Home hero gradient end
  // --- Optional extension (filled by `resolveThemeColors` when missing) ---
  tint?: string; // Soft tinted background (warm bands, active pills)
  lineStrong?: string; // "Useful" borders, >= 3:1 against `card`
  focusRing?: string; // Visible focus ring on `card`
  danger?: string; // Solid danger background
  dangerStrong?: string; // Hover / pressed danger
  dangerText?: string; // Danger used as text
  success?: string; // Solid success background
  successText?: string; // Success used as text
  warning?: string; // Solid warning background
  warningText?: string; // Warning used as text
  info?: string; // Solid info background
  infoText?: string; // Info used as text
}

/** The 16 required base colors (present in every stored theme). */
export const BASE_THEME_COLOR_KEYS = [
  'brand',
  'brandStrong',
  'brandText',
  'onBrand',
  'accent',
  'accentStrong',
  'accentText',
  'onAccent',
  'highlight',
  'surface',
  'card',
  'line',
  'ink',
  'inkMuted',
  'heroFrom',
  'heroTo',
] as const;

export type BaseThemeColorKey = (typeof BASE_THEME_COLOR_KEYS)[number];

/** The 12 optional semantic and utility colors (D4 extension, validated as A2). */
export const EXTENDED_THEME_COLOR_KEYS = [
  'tint',
  'lineStrong',
  'focusRing',
  'danger',
  'dangerStrong',
  'dangerText',
  'success',
  'successText',
  'warning',
  'warningText',
  'info',
  'infoText',
] as const;

export type ExtendedThemeColorKey = (typeof EXTENDED_THEME_COLOR_KEYS)[number];

export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [...BASE_THEME_COLOR_KEYS, ...EXTENDED_THEME_COLOR_KEYS];

export const DISPLAY_FONTS = ['plus-jakarta', 'fraunces', 'reem-kufi', 'cairo', 'playfair', 'baloo'] as const;
export type DisplayFont = (typeof DISPLAY_FONTS)[number];

export const CARD_SHAPES = ['rounded', 'arch', 'square'] as const;
export type CardShape = (typeof CARD_SHAPES)[number];

export const THEME_PATTERNS = ['none', 'zellige', 'dots', 'waves'] as const;
export type ThemePattern = (typeof THEME_PATTERNS)[number];

export interface AppTheme {
  id: string;
  name_fr: string;
  name_derja: string;
  name_ar: string;
  light: ThemeColors;
  dark: ThemeColors;
  displayFont: DisplayFont;
  cardShape: CardShape;
  pattern: ThemePattern;
  is_published: boolean;
  is_builtin?: boolean;
  updated_at?: string;
}
