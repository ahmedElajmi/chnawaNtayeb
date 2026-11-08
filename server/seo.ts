import type { Recipe, Ingredient } from '../src/core/catalog';
import { initialRecipes, initialIngredients, normalizeCategory } from '../src/core/catalog';
import { slugify } from '../src/core/shared';
import { recipePath as recipeAddress } from '../src/shared/paths';
import { getAdminFirestore } from './firebaseAdmin';

/**
 * Server-side SEO (the client router has one address per screen, see src/shared/paths.ts):
 * - every recipe has its own address /recette/<slug>
 * - the HTML sent for /, /recettes and /recette/<slug> already contains the
 *   right title, description, canonical URL, social cards, schema.org data
 *   and a readable version of the content (React replaces it once loaded)
 * - sitemap.xml lists every published recipe
 */

const CACHE_MS = 10 * 60 * 1000;
let cache: { at: number; recipes: Recipe[]; ingredients: Ingredient[] } | null = null;

/** Published catalog: Firestore when the server has admin access (admin edits included), built-in catalog otherwise. */
export async function getCatalog(): Promise<{ recipes: Recipe[]; ingredients: Ingredient[] }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  let recipes: Recipe[] = initialRecipes;
  let ingredients: Ingredient[] = initialIngredients;
  const db = getAdminFirestore();
  if (db) {
    try {
      const [rs, is] = await Promise.all([db.collection('recipes').get(), db.collection('ingredients').get()]);
      if (!rs.empty) recipes = rs.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id }));
      if (!is.empty) ingredients = is.docs.map((d) => ({ ...(d.data() as Ingredient), id: d.id }));
    } catch (e) {
      console.warn('[seo] Firestore indisponible, catalogue intégré utilisé :', (e as Error).message);
    }
  }
  recipes = recipes
    .filter((r) => r && r.is_published !== false && r.name_fr)
    .map((r) => ({ ...r, slug: r.slug || slugify(r.name_fr), category: normalizeCategory(r.category) }));
  cache = { at: Date.now(), recipes, ingredients };
  return cache;
}

export function recipePath(r: Pick<Recipe, 'slug'>): string {
  return recipeAddress(r.slug);
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON for a <script type="application/ld+json"> block (cannot close the script tag). */
function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length) + '…';
}

const COURSE_FR: Record<string, string> = { entree: 'Entrée', plat_principal: 'Plat principal', dessert: 'Dessert' };
const COURSE_PLURAL: Record<string, string> = {
  entree: 'Entrées',
  plat_principal: 'Plats principaux',
  dessert: 'Desserts',
};

function absoluteImage(r: Recipe, base: string): string {
  return r.image_url && r.image_url.startsWith('https://') ? r.image_url : `${base}/og-image.png`;
}

function ingredientLines(r: Recipe, ingredients: Ingredient[]): string[] {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  return r.ingredients.map((x) => {
    const name = byId.get(x.ingredient_id)?.name_fr ?? x.ingredient_id.replace(/^ing_/, '').replace(/_/g, ' ');
    return `${x.quantity_base} ${x.unit} ${name}${x.is_optional ? ' (facultatif)' : ''}`;
  });
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface SeoPage {
  status: number;
  title: string;
  description: string;
  canonical: string;
  ogType: 'website' | 'article';
  image: string;
  robots: string;
  jsonLd: string;
  body: string;
}

const SITE_NAME = 'Chnowa Ntayeb';
const HOME_TITLE = 'Chnowa Ntayeb - شنوة نطيب؟ | Recettes tunisiennes by Chef Souhed';
const HOME_DESCRIPTION =
  "Qu'est-ce qu'on cuisine aujourd'hui ? Plus de 100 recettes tunisiennes et du monde by Chef Souhed : idées repas avec ce qui reste dans votre frigo, menu de la semaine et liste de courses.";

function recipeLinks(recipes: Recipe[]): string {
  return (['plat_principal', 'entree', 'dessert'] as const)
    .map((c) => {
      const items = recipes.filter((r) => r.category === c);
      if (!items.length) return '';
      return `<section><h2>${COURSE_PLURAL[c]}</h2><ul>${items
        .map((r) => `<li><a href="${recipePath(r)}">${esc(r.name_fr)}</a></li>`)
        .join('')}</ul></section>`;
    })
    .join('');
}

function websiteLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: 'شنوة نطيب؟',
        url: `${base}/`,
        inLanguage: ['fr', 'ar'],
        publisher: { '@type': 'Person', name: 'Chef Souhed' },
      },
      {
        '@type': 'WebApplication',
        name: 'Chnowa Ntayeb (شنوة نطيب؟)',
        url: `${base}/`,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'All',
        description: HOME_DESCRIPTION,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TND' },
        author: { '@type': 'Person', name: 'Chef Souhed' },
      },
    ],
  };
}

export function homePage(base: string, recipes: Recipe[], path: '/' | '/recettes'): SeoPage {
  const isList = path === '/recettes';
  const title = isList ? `Toutes les recettes (${recipes.length}) | ${SITE_NAME} by Chef Souhed` : HOME_TITLE;
  const description = isList
    ? `${recipes.length} recettes tunisiennes et internationales expliquées pas à pas by Chef Souhed : entrées, plats principaux et desserts, avec temps, budget et astuces.`
    : HOME_DESCRIPTION;
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: recipes.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}${recipePath(r)}`,
      name: r.name_fr,
    })),
  };
  const body = `<main class="seo-fallback">
<h1>${isList ? 'Toutes les recettes Chnowa Ntayeb' : 'Chnowa Ntayeb ? Qu\u2019est-ce qu\u2019on cuisine aujourd\u2019hui ?'}</h1>
<p>${esc(description)}</p>
<nav aria-label="Recettes">${recipeLinks(recipes)}</nav>
</main>`;
  return {
    status: 200,
    title,
    description,
    canonical: `${base}${path}`,
    ogType: 'website',
    image: `${base}/og-image.png`,
    robots: 'index, follow, max-image-preview:large',
    jsonLd: jsonLd(websiteLd(base)) + (isList ? jsonLd(list) : ''),
    body,
  };
}

export function recipePage(base: string, r: Recipe, recipes: Recipe[], ingredients: Ingredient[]): SeoPage {
  const total = r.prep_time_minutes + r.cook_time_minutes;
  const course = COURSE_FR[r.category] ?? 'Plat principal';
  const title = `${r.name_fr} : recette ${r.cuisine_type === 'internationale' ? 'facile' : 'tunisienne'} pas à pas | ${SITE_NAME}`;
  const description = truncate(
    `${total} min · ${r.base_servings} pers. · ≈ ${r.estimated_cost_tnd} DT · by Chef Souhed. ${r.description_fr}`,
    160
  );
  const lines = ingredientLines(r, ingredients);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.name_fr,
    alternateName: [r.name_derja, r.name_ar].filter(Boolean),
    description: r.description_fr,
    image: [absoluteImage(r, base)],
    author: { '@type': 'Person', name: 'Chef Souhed' },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${base}/logo.png` } },
    prepTime: `PT${r.prep_time_minutes}M`,
    cookTime: `PT${r.cook_time_minutes}M`,
    totalTime: `PT${total}M`,
    recipeYield: `${r.base_servings} portions`,
    recipeCategory: course,
    recipeCuisine: r.cuisine_type === 'internationale' ? 'Internationale' : 'Tunisienne',
    keywords: [
      r.name_fr,
      r.name_derja,
      course,
      r.cuisine_type === 'internationale' ? 'cuisine du monde' : 'cuisine tunisienne',
      r.is_healthy ? 'healthy' : '',
    ]
      .filter(Boolean)
      .join(', '),
    recipeIngredient: lines,
    recipeInstructions: r.steps.map((s) => ({ '@type': 'HowToStep', position: s.step_number, text: s.instruction_fr })),
    inLanguage: 'fr',
    url: `${base}${recipePath(r)}`,
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Recettes', item: `${base}/recettes` },
      { '@type': 'ListItem', position: 3, name: r.name_fr, item: `${base}${recipePath(r)}` },
    ],
  };
  const related = recipes.filter((x) => x.id !== r.id && x.category === r.category).slice(0, 8);
  const body = `<main class="seo-fallback">
<nav aria-label="Fil d'Ariane"><a href="/">${SITE_NAME}</a> › <a href="/recettes">Recettes</a> › ${esc(r.name_fr)}</nav>
<article>
<h1>${esc(r.name_fr)}</h1>
<p lang="ar" dir="rtl">${esc(r.name_ar)}</p>
<p>${esc(r.description_fr)}</p>
<ul>
<li>${course}</li>
<li>Préparation : ${r.prep_time_minutes} min, cuisson : ${r.cook_time_minutes} min</li>
<li>${r.base_servings} personnes, budget ≈ ${esc(String(r.estimated_cost_tnd))} DT</li>
</ul>
<h2>Ingrédients</h2>
<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
<h2>Préparation</h2>
<ol>${r.steps.map((s) => `<li>${esc(s.instruction_fr)}</li>`).join('')}</ol>
<h2>L'astuce de Chef Souhed</h2>
<p>${esc(r.chef_tip.fr)}</p>
</article>
${related.length ? `<aside><h2>À découvrir aussi</h2><ul>${related.map((x) => `<li><a href="${recipePath(x)}">${esc(x.name_fr)}</a></li>`).join('')}</ul></aside>` : ''}
</main>`;
  return {
    status: 200,
    title,
    description,
    canonical: `${base}${recipePath(r)}`,
    ogType: 'article',
    image: absoluteImage(r, base),
    robots: 'index, follow, max-image-preview:large',
    jsonLd: jsonLd(ld) + jsonLd(breadcrumb),
    body,
  };
}

export function notFoundPage(base: string, recipes: Recipe[]): SeoPage {
  return {
    ...homePage(base, recipes, '/'),
    status: 404,
    title: `Recette introuvable | ${SITE_NAME}`,
    robots: 'noindex, follow',
    canonical: `${base}/`,
  };
}

/** Resolves the SEO page for a path, or null when the path is not a public page (left to the SPA as is). */
export async function resolvePage(path: string, base: string): Promise<SeoPage | null> {
  const { recipes, ingredients } = await getCatalog();
  if (path === '/' || path === '/index.html') return homePage(base, recipes, '/');
  if (path === '/recettes' || path === '/recettes/') return homePage(base, recipes, '/recettes');
  const m = path.match(/^\/recette\/([a-z0-9-]+)\/?$/);
  if (m) {
    const r = recipes.find((x) => x.slug === m[1]);
    return r ? recipePage(base, r, recipes, ingredients) : notFoundPage(base, recipes);
  }
  if (path.startsWith('/recette/')) return notFoundPage(base, recipes);
  return null;
}

/** Injects the page's head tags and readable content into the index.html template. */
export function renderHtml(template: string, page: SeoPage): string {
  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${page.robots}" />`,
    `<link rel="canonical" href="${esc(page.canonical)}" />`,
    `<meta property="og:type" content="${page.ogType}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(page.canonical)}" />`,
    `<meta property="og:image" content="${esc(page.image)}" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(page.image)}" />`,
    page.jsonLd,
  ].join('\n    ');
  let html = template
    // Remove the static defaults (the page values replace them)
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="(description|robots|twitter:title|twitter:description|twitter:image)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:(type|title|description|url|image)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<!-- SEO:JSONLD -->[\s\S]*?<!-- \/SEO:JSONLD -->\s*/i, '');
  html = html.replace(/(<meta charset="UTF-8" \/>)/i, `$1\n    ${head}`);
  html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
  return html;
}

export async function sitemapXml(base: string): Promise<string> {
  const { recipes } = await getCatalog();
  const urls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}/recettes`, priority: '0.9', changefreq: 'daily' },
    ...recipes.map((r) => ({ loc: `${base}${recipePath(r)}`, priority: '0.8', changefreq: 'monthly' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
}
