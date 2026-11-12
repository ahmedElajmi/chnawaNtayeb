import { normalizeText } from '../shared/text';

/**
 * Search text normalization: the same rules for indexed texts and for queries, whatever the engine.
 * Builds on `normalizeText` (lowercase, French accents, simple plurals) without changing it
 * (the fridge matching and `findByName` rely on it), then folds what users type differently:
 *
 * - Arabic: vowel marks (harakat), tatweel and Quranic marks removed; the alef / waw / yeh forms
 *   with hamza already lose it in `normalizeText` (NFD); ٱ → ا, ة → ه, ى → ي; Arabic digits → 0-9;
 *   the article and its common prefixes (ال، بال، وال، فال، كال، لل) are detached.
 * - Tunisian derja in Latin letters (and French, so that both stay comparable): arabizi digits inside
 *   a word (3 → a, 7 → h, 9 → k, 5 → kh, 2 dropped), q → k, ou / o → u, sh → ch, ph → f, and doubled
 *   letters collapsed: "3assida" ≈ "assida", "ma9rouna" ≈ "makrouna", "chakchouka" ≈ "chakchoka".
 */
export function normalizeSearchText(text: string): string {
  return searchTerms(text).join(' ');
}

/** Normalized words of a text (see `normalizeSearchText`). */
export function searchTerms(text: string): string[] {
  const base = normalizeText(text ?? '')
    .replace(ARABIC_MARKS, '')
    .replace(ARABIC_PUNCTUATION, ' ')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  return base
    .split(/\s+/)
    .map((word) => (ARABIC_LETTER.test(word) ? foldArabicWord(word) : foldLatinWord(word)))
    .filter(Boolean);
}

/** Harakat and other combining marks (U+064B–U+065F, U+0670, U+06D6–U+06ED) and tatweel (U+0640). */
const ARABIC_MARKS = /[ً-ٰٟۖ-ۭـ]/g;
/** Arabic comma, semicolon, question mark, percent / decimal signs, full stop. */
const ARABIC_PUNCTUATION = /[،؛؟٪-٭۔]/g;
const ARABIC_LETTER = /[؀-ۿ]/;
/** Article with the prefixes glued to it, longest first. */
const ARABIC_ARTICLE = /^(?:وال|بال|فال|كال|ال|لل)/;

function foldArabicWord(word: string): string {
  const folded = word.replace(/ٱ/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const withoutArticle = folded.replace(ARABIC_ARTICLE, '');
  return withoutArticle.length >= 2 ? withoutArticle : folded;
}

const ARABIZI: Record<string, string> = { '3': 'a', '7': 'h', '9': 'k', '5': 'kh', '2': '' };

function foldLatinWord(word: string): string {
  // Digits are only letters inside a word that has letters ("l7am"), never in "4" or "250"
  const lettered = /[a-z]/.test(word) ? word.replace(/[23579]/g, (d) => ARABIZI[d]) : word;
  return lettered
    .replace(/q/g, 'k')
    .replace(/sh/g, 'ch')
    .replace(/ph/g, 'f')
    .replace(/ou/g, 'u')
    .replace(/o/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
}
