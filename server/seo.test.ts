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
  isLegacyPath,
  legacyRedirect,
} from './seo';

const BASE = 'https://example.test';
const catalog: Catalog = { recipes: publishedRecipes(initialRecipes), ingredients: initialIngredients };
const PUBLIC = [
  '/',
  '/recipes',
  '/suggestions',
  '/fridge',
  '/planner',
  '/grocery',
  `/recipe/${catalog.recipes[0].slug}`,
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

  it('/fridge lists the ingredients by category with their price', () => {
    const p = page('/fridge');
    expect(p.body).toContain('Légumes');
    expect(p.body).toContain(initialIngredients[0].name_fr.replace(/'/g, '&#39;'));
    expect(p.body).toMatch(/\d+(\.\d)?( – \d+(\.\d)?)? DT \//);
    expect(p.robots).toContain('index');
    expect(p.canonical).toBe(`${BASE}/fridge`);
  });

  it('/suggestions lists the recipes and points to /recipes as the reference', () => {
    const p = page('/suggestions');
    expect(p.body).toContain(`href="/recipe/${catalog.recipes[0].slug}"`);
    expect(p.canonical).toBe(`${BASE}/recipes`);
  });

  it('personal screens are described but not indexed', () => {
    expect(page('/planner').robots).toBe('noindex, follow');
    expect(page('/grocery').robots).toBe('noindex, follow');
  });

  it('accepts a trailing slash and /index.html', () => {
    expect(page('/fridge/').canonical).toBe(`${BASE}/fridge`);
    expect(page('/index.html').canonical).toBe(`${BASE}/`);
  });

  it('leaves the other addresses to the app', () => {
    for (const path of ['/patron', '/api/health', '/assets/index.js', '/sw.js']) {
      expect(isSeoPath(path)).toBe(false);
      expect(resolvePage(path, BASE, catalog)).toBeNull();
    }
  });

  it('answers 404 for an unknown recipe', () => {
    const p = page('/recipe/n-existe-pas');
    expect(p.status).toBe(404);
    expect(p.robots).toBe('noindex, follow');
  });
});

describe('long lists split into pages', () => {
  const big = bigCatalog(LIST_PAGE_SIZE * 2 + 5);

  it('shows one page with the real total and a link to the next one', () => {
    const p = page('/recipes', big);
    expect(p.title).toContain(`(${LIST_PAGE_SIZE * 2 + 5})`);
    expect(p.body.match(/href="\/recipe\//g)).toHaveLength(LIST_PAGE_SIZE);
    expect(p.body).toContain('href="/recipes?page=2" rel="next"');
    expect(p.body).not.toContain('rel="prev"');
  });

  it('the last page links back and has its own address', () => {
    const p = page('/recipes', big, 3);
    expect(p.body.match(/href="\/recipe\//g)).toHaveLength(5);
    expect(p.body).toContain('href="/recipes?page=2" rel="prev"');
    expect(p.body).not.toContain('rel="next"');
    expect(p.canonical).toBe(`${BASE}/recipes?page=3`);
  });

  it('a page beyond the end is not found', () => {
    expect(page('/recipes', big, 4).status).toBe(404);
  });

  it('the home page links to the full list instead of showing everything', () => {
    const p = page('/', big);
    expect(p.body.match(/href="\/recipe\//g)).toHaveLength(LIST_PAGE_SIZE);
    expect(p.body).toContain(`Toutes les recettes (${LIST_PAGE_SIZE * 2 + 5})`);
  });

  it('a short list has no page links', () => {
    const short = { ...catalog, ingredients: initialIngredients.slice(0, 10) };
    expect(page('/fridge', short).body).not.toContain('aria-label="Pages"');
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
    const html = renderHtml(template, page('/fridge'));
    expect(html).toContain('<div id="root"><main class="seo-fallback">');
    expect(html).toContain(`<link rel="canonical" href="${BASE}/fridge" />`);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('escapes the content (no injection) and keeps "$" as is', () => {
    const r = { ...catalog.recipes[0], name_fr: '<script>alert(1)</script> $& $1' };
    const html = renderHtml(template, page(`/recipe/${r.slug}`, { ...catalog, recipes: [r] }));
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; $&amp; $1');
  });
});

describe('legacy public addresses', () => {
  it('redirects the French pages to their English replacement', () => {
    expect(legacyRedirect('/frigo')).toBe('/fridge');
    expect(legacyRedirect('/recettes')).toBe('/recipes');
    expect(legacyRedirect('/semaine')).toBe('/planner');
    expect(legacyRedirect('/courses')).toBe('/grocery');
    expect(legacyRedirect('/')).toBeNull();
    expect(legacyRedirect('/admin')).toBeNull();
  });

  it('redirects the French recipe addresses with their slug', () => {
    expect(legacyRedirect('/recette/ojja-merguez')).toBe('/recipe/ojja-merguez');
    expect(isLegacyPath('/recette/quoi-que-ce-soit')).toBe(true);
    expect(legacyRedirect('/recipe/ojja-merguez')).toBeNull();
  });
});

describe('sitemap', () => {
  it('lists the home, the lists, the fridge and every recipe', () => {
    const xml = sitemapXml(BASE, catalog);
    expect(xml).toContain(`<loc>${BASE}/fridge</loc>`);
    expect(xml).toContain(`<loc>${BASE}/recipe/${catalog.recipes[0].slug}</loc>`);
    expect(xml.match(/<url>/g)).toHaveLength(3 + catalog.recipes.length);
  });

  it('never lists a non-public or French-era URL', () => {
    const xml = sitemapXml(BASE, catalog);
    for (const forbidden of [
      '/patron',
      '/admin',
      '/api/',
      '/frigo',
      '/recettes',
      '/recette/',
      '/semaine',
      '/courses',
    ]) {
      expect(xml, forbidden).not.toContain(`<loc>${BASE}${forbidden}`);
    }
  });

  it('never lists an unpublished or broken recipe', () => {
    const catalog2 = {
      ...catalog,
      recipes: [
        ...catalog.recipes,
        { ...catalog.recipes[0], id: 'hidden', slug: 'cachee', is_published: false, name_fr: 'Cachée' },
        { ...catalog.recipes[0], id: 'broken', slug: 'sans-nom', is_published: true, name_fr: '' },
      ],
    } as typeof catalog;
    const xml = sitemapXml(BASE, catalog2);
    expect(xml).not.toContain('/recipe/cachee');
    expect(xml).not.toContain('/recipe/sans-nom');
  });
});
