// Themes

/** Every value is a #RRGGBB hex color (validated, see ./validation.ts) */
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
}

export const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
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
];

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
