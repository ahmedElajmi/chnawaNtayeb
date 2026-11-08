import {
  AppTheme,
  ThemeColors,
  THEME_COLOR_KEYS,
  DISPLAY_FONTS,
  CARD_SHAPES,
  THEME_PATTERNS,
  DisplayFont,
} from './types';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}

/**
 * Fixed font registry. Theme documents only store the font *id*; the URL and
 * CSS family always come from this table, never from the database.
 */
export const FONT_REGISTRY: Record<DisplayFont, { label: string; family: string; href: string | null }> = {
  'plus-jakarta': {
    label: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', system-ui, sans-serif",
    href: null, // already loaded in index.html
  },
  fraunces: {
    label: 'Fraunces',
    family: "'Fraunces', Georgia, serif",
    href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap',
  },
  'reem-kufi': {
    label: 'Reem Kufi',
    family: "'Reem Kufi', 'Cairo', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;700&display=swap',
  },
  cairo: {
    label: 'Cairo',
    family: "'Cairo', system-ui, sans-serif",
    href: null, // already loaded in index.html
  },
  playfair: {
    label: 'Playfair Display',
    family: "'Playfair Display', Georgia, serif",
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap',
  },
  baloo: {
    label: 'Baloo Bhaijaan 2',
    family: "'Baloo Bhaijaan 2', system-ui, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@600;800&display=swap',
  },
};

function isValidColors(value: unknown): value is ThemeColors {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return THEME_COLOR_KEYS.every((k) => isHexColor(obj[k]));
}

function isShortText(value: unknown, max = 60): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/** Returns a list of human readable problems (empty list = valid theme). */
export function validateTheme(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['Thème invalide'];
  const t = value as Record<string, unknown>;
  if (typeof t.id !== 'string' || !ID_RE.test(t.id)) errors.push('Identifiant invalide');
  if (!isShortText(t.name_fr)) errors.push('Nom français requis (60 caractères max)');
  if (!isShortText(t.name_derja)) errors.push('Nom derja requis (60 caractères max)');
  if (!isShortText(t.name_ar)) errors.push('Nom arabe requis (60 caractères max)');
  if (!isValidColors(t.light)) errors.push('Couleurs du mode clair invalides (format #RRGGBB)');
  if (!isValidColors(t.dark)) errors.push('Couleurs du mode sombre invalides (format #RRGGBB)');
  if (!DISPLAY_FONTS.includes(t.displayFont as DisplayFont)) errors.push('Police inconnue');
  if (!CARD_SHAPES.includes(t.cardShape as (typeof CARD_SHAPES)[number])) errors.push('Forme de carte inconnue');
  if (!THEME_PATTERNS.includes(t.pattern as (typeof THEME_PATTERNS)[number])) errors.push('Motif inconnu');
  if (typeof t.is_published !== 'boolean') errors.push('Statut de publication invalide');
  return errors;
}

export function isValidTheme(value: unknown): value is AppTheme {
  return validateTheme(value).length === 0;
}

/** Keeps only the known fields of a theme (drops anything unexpected coming from storage). */
export function pickThemeFields(theme: AppTheme): AppTheme {
  const pickColors = (c: ThemeColors) =>
    Object.fromEntries(THEME_COLOR_KEYS.map((k) => [k, c[k].toUpperCase()])) as unknown as ThemeColors;
  return {
    id: theme.id,
    name_fr: theme.name_fr.trim(),
    name_derja: theme.name_derja.trim(),
    name_ar: theme.name_ar.trim(),
    light: pickColors(theme.light),
    dark: pickColors(theme.dark),
    displayFont: theme.displayFont,
    cardShape: theme.cardShape,
    pattern: theme.pattern,
    is_published: theme.is_published,
    ...(theme.updated_at ? { updated_at: theme.updated_at } : {}),
  };
}

// ---------------------------------------------------------------------------
// CSS variables
// ---------------------------------------------------------------------------

const toKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Maps theme colors to the Tailwind `@theme` variables declared in index.css. */
export function colorsToCssVars(colors: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of THEME_COLOR_KEYS) {
    vars[`--color-${toKebab(key)}`] = colors[key];
  }
  return vars;
}

// ---------------------------------------------------------------------------
// WCAG contrast helpers (used by the theme editor)
// ---------------------------------------------------------------------------

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string): number {
  if (!isHexColor(a) || !isHexColor(b)) return 1;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pairs of colors that must stay readable, with a French label for the editor. */
export const CONTRAST_PAIRS: { fg: keyof ThemeColors; bg: keyof ThemeColors; label: string }[] = [
  { fg: 'ink', bg: 'surface', label: 'Texte sur fond de page' },
  { fg: 'ink', bg: 'card', label: 'Texte sur carte' },
  { fg: 'inkMuted', bg: 'card', label: 'Texte secondaire sur carte' },
  { fg: 'brandText', bg: 'card', label: 'Couleur principale (texte) sur carte' },
  { fg: 'accentText', bg: 'card', label: 'Accent (texte) sur carte' },
  { fg: 'onBrand', bg: 'brand', label: 'Texte sur bouton principal' },
  { fg: 'onAccent', bg: 'accent', label: "Texte sur bouton d'action" },
];
