/**
 * Text normalization used to compare ingredient / recipe names coming from
 * users or from Gemini with the catalog:
 *   "Œufs" → "oeuf", "Pommes de terre" → "pomme de terre", "Pâtes" → "pate"
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9؀-ۿ\s]/g, ' ') // keep latin, digits, arabic
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .join(' ');
}

function singularize(word: string): string {
  if (word.length <= 3 || /[؀-ۿ]/.test(word)) return word;
  if (word.endsWith('aux')) return `${word.slice(0, -3)}al`;
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  return word;
}

/** Splits catalog names like "Piment vert / Poivron" or "Pois chiches (secs ou cuits)" into alternatives. */
export function nameVariants(name: string): string[] {
  const withoutParens = name.replace(/\([^)]*\)/g, ' ');
  const parts = withoutParens.split(/[/&,]| ou /i).map((p) => normalizeText(p)).filter(Boolean);
  const full = normalizeText(withoutParens);
  return Array.from(new Set([full, ...parts]));
}

export interface NamedItem {
  id: string;
  name_fr: string;
  name_derja?: string;
  name_ar?: string;
}

/**
 * Finds the catalog item matching a free-text name.
 * Exact normalized match first, then whole-word containment; never a random
 * substring (so "sel" does not match "persil").
 */
export function findByName<T extends NamedItem>(query: string, items: T[]): T | undefined {
  const q = normalizeText(query);
  if (!q) return undefined;

  const variantsOf = (item: T) =>
    [item.name_fr, item.name_derja, item.name_ar].filter(Boolean).flatMap((n) => nameVariants(n as string));

  const exact = items.find((item) => variantsOf(item).includes(q));
  if (exact) return exact;

  const containsWords = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `);

  // 1) A catalog name containing the query: the shortest wins ("tomate" → "Tomate", not "Tomate concentrée")
  let wider: { item: T; length: number } | undefined;
  // 2) The query containing a catalog name: the longest wins ("huile d olive" → "Huile d'olive", not "Olives")
  let narrower: { item: T; length: number } | undefined;
  for (const item of items) {
    for (const v of variantsOf(item)) {
      if (containsWords(v, q)) {
        if (!wider || v.length < wider.length) wider = { item, length: v.length };
      } else if (containsWords(q, v)) {
        if (!narrower || v.length > narrower.length) narrower = { item, length: v.length };
      }
    }
  }
  return (wider ?? narrower)?.item;
}

/** URL slug from a French name: "Kamounia au bœuf" -> "kamounia-au-boeuf" */
export function slugify(text: string): string {
  return text
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'oe')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
