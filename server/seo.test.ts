import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes, type Recipe } from '../src/core/catalog';
import {
  LIST_PAGE_SIZE,
  isSeoPath,
  pageOf,
  parsePageNumber,
  publishedRecipes,
  renderHtml,
  resolvePage,
  sitemapXml,
  type Catalog,
} from './seo';

const BASE = 'https://example.test';
const catalog: Catalog = { recipes: publishedRecipes(initialRecipes), ingredients: initialIngredients };
const PUBLIC = [
  '/',
  '/recettes',
  '/suggestions',
  '/frigo',
  '/semaine',
  '/courses',
  `/recette/${catalog.recipes[0].slug}`,
];

/** A catalog of n recipes (copies of the built-in ones with their own address). */
function bigCatalog(n: number): Catalog {
  const recipes: Recipe[] = Array.from({ length: n }, (_, i) => {
    const r = initialRecipes[i % initialRecipes.length];
    return { ...r, id: `r${i}`, slug: `recette-${i}`, name_fr: `Recette ${i}`, is_published: true };
  });
  return { recipes: publishedRecipes(recipes), ingredients: initialIngredients };
}

const page = (path: string, c = catalog, n = 1) => resolvePage(path, BASE, c, n)!;

describe('server pages for robots', () => {
  it.each(PUBLIC)('%s is rendered, inside the hidden readable copy', (path) => {
    expect(isSeoPath(path)).toBe(true);
    const p = page(path);
    expect(p.status).toBe(200);
    // index.html hides .seo-fallback from visitors: every page must use it
    expect(p.body.startsWith('<main class="seo-fallback">')).toBe(true);
    expect(p.body.endsWith('</main>')).toBe(true);
    expect(p.title).not.toBe('');
  });

  it('/frigo lists the ingredients by category with their price', () => {
    const p = page('/frigo');
    expect(p.body).toContain('Légumes');
    expect(p.body).toContain(initialIngredients[0].name_fr.replace(/'/g, '&#39;'));
    expect(p.body).toMatch(/\d+(\.\d)?( – \d+(\.\d)?)? DT \//);
    expect(p.robots).toContain('index');
    expect(p.canonical).toBe(`${BASE}/frigo`);
  });

  it('/suggestions lists the recipes and points to /recettes as the reference', () => {
    const p = page('/suggestions');
    expect(p.body).toContain(`href="/recette/${catalog.recipes[0].slug}"`);
    expect(p.canonical).toBe(`${BASE}/recettes`);
  });

  it('personal screens are described but not indexed', () => {
    expect(page('/semaine').robots).toBe('noindex, follow');
    expect(page('/courses').robots).toBe('noindex, follow');
  });

  it('accepts a trailing slash and /index.html', () => {
    expect(page('/frigo/').canonical).toBe(`${BASE}/frigo`);
    expect(page('/index.html').canonical).toBe(`${BASE}/`);
  });

  it('leaves the other addresses to the app', () => {
    for (const path of ['/patron', '/api/health', '/assets/index.js', '/sw.js']) {
      expect(isSeoPath(path)).toBe(false);
      expect(resolvePage(path, BASE, catalog)).toBeNull();
    }
  });

  it('answers 404 for an unknown recipe', () => {
    const p = page('/recette/n-existe-pas');
    expect(p.status).toBe(404);
    expect(p.robots).toBe('noindex, follow');
  });
});

describe('long lists split into pages', () => {
  const big = bigCatalog(LIST_PAGE_SIZE * 2 + 5);

  it('shows one page with the real total and a link to the next one', () => {
    const p = page('/recettes', big);
    expect(p.title).toContain(`(${LIST_PAGE_SIZE * 2 + 5})`);
    expect(p.body.match(/href="\/recette\//g)).toHaveLength(LIST_PAGE_SIZE);
    expect(p.body).toContain('href="/recettes?page=2" rel="next"');
    expect(p.body).not.toContain('rel="prev"');
  });

  it('the last page links back and has its own address', () => {
    const p = page('/recettes', big, 3);
    expect(p.body.match(/href="\/recette\//g)).toHaveLength(5);
    expect(p.body).toContain('href="/recettes?page=2" rel="prev"');
    expect(p.body).not.toContain('rel="next"');
    expect(p.canonical).toBe(`${BASE}/recettes?page=3`);
  });

  it('a page beyond the end is not found', () => {
    expect(page('/recettes', big, 4).status).toBe(404);
  });

  it('the home page links to the full list instead of showing everything', () => {
    const p = page('/', big);
    expect(p.body.match(/href="\/recette\//g)).toHaveLength(LIST_PAGE_SIZE);
    expect(p.body).toContain(`Toutes les recettes (${LIST_PAGE_SIZE * 2 + 5})`);
  });

  it('a short list has no page links', () => {
    const short = { ...catalog, ingredients: initialIngredients.slice(0, 10) };
    expect(page('/frigo', short).body).not.toContain('aria-label="Pages"');
  });

  it('pageOf and parsePageNumber', () => {
    expect(pageOf([1, 2, 3], 2, 2)).toEqual({ items: [3], offset: 2, page: 2, pages: 2, total: 3 });
    expect(pageOf([], 1)?.pages).toBe(1);
    expect(pageOf([1], 0)).toBeNull();
    expect(parsePageNumber('3')).toBe(3);
    expect(parsePageNumber('abc')).toBe(1);
    expect(parsePageNumber(['2'])).toBe(1);
    expect(parsePageNumber(undefined)).toBe(1);
  });
});

describe('renderHtml', () => {
  const template =
    '<html><head><meta charset="UTF-8" /><title>x</title><link rel="canonical" href="/" /></head><body><div id="root"></div></body></html>';

  it('fills #root and the head', () => {
    const html = renderHtml(template, page('/frigo'));
    expect(html).toContain('<div id="root"><main class="seo-fallback">');
    expect(html).toContain(`<link rel="canonical" href="${BASE}/frigo" />`);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('escapes the content (no injection) and keeps "$" as is', () => {
    const r = { ...catalog.recipes[0], name_fr: '<script>alert(1)</script> $& $1' };
    const html = renderHtml(template, page(`/recette/${r.slug}`, { ...catalog, recipes: [r] }));
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; $&amp; $1');
  });
});

describe('sitemap', () => {
  it('lists the home, the lists, the fridge and every recipe', () => {
    const xml = sitemapXml(BASE, catalog);
    expect(xml).toContain(`<loc>${BASE}/frigo</loc>`);
    expect(xml).toContain(`<loc>${BASE}/recette/${catalog.recipes[0].slug}</loc>`);
    expect(xml.match(/<url>/g)).toHaveLength(3 + catalog.recipes.length);
  });
});
