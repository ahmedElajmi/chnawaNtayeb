import type { Recipe, Ingredient } from '../src/core/catalog';
import {
  ingredientPriceRange,
  initialIngredients,
  normalizeCategory,
  parseStoredIngredients,
  parseStoredRecipes,
} from '../src/core/catalog';
import { isDeletionMarker, latestRevision } from '../src/core/sync';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { slugify } from '../src/core/shared';
import { LEGACY_PATHS, LEGACY_RECIPE_PREFIX, PATHS, recipePath as recipeAddress } from '../src/shared/paths';
import { translations } from '../src/shared/i18n/translations';
import {
  BUILT_IN_INGREDIENT_CATEGORIES,
  buildCategoryTree,
  parseStoredCategories,
  withBuiltInCategories,
  type ContentCategory,
} from '../src/core/categories';
import { formatPriceRange } from '../src/shared/i18n/formatPrice';
import { getAdminFirestore } from './firebaseAdmin';

/**
 * Server-side SEO (the client router has one address per screen, see src/shared/paths.ts):
 * - every public screen (/, /frigo, /recettes, /suggestions, /semaine, /courses) and every
 *   recipe (/recette/<slug>) is sent with its own title, description, canonical URL, social
 *   cards, schema.org data and a readable copy of its content, so robots that do not run
 *   JavaScript (AI assistants, many crawlers) see the catalog
 * - the readable copy is hidden from visitors (index.html: .seo-fallback) and replaced by React
 * - long lists are split into pages of LIST_PAGE_SIZE (?page=2...), with the real total
 * - sitemap.xml lists every published recipe
 */

/** How often the server asks the database for changes (only what changed is read). */
const REFRESH_MS = 60 * 1000;

/** Items per page in the readable copy of a list (robots follow the "next page" links). */
export const LIST_PAGE_SIZE = 100;

export interface Catalog {
  recipes: Recipe[];
  ingredients: Ingredient[];
  /** Ingredient categories (built-in ones when absent) */
  ingredientCategories?: ContentCategory[];
}

/** One collection kept in memory, updated incrementally like the devices (see src/core/sync). */
interface SyncedCollection<T> {
  items: Map<string, T>;
  revision: number | null;
}

let recipesCopy: SyncedCollection<Recipe> = { items: new Map(), revision: null };
let ingredientsCopy: SyncedCollection<Ingredient> = { items: new Map(), revision: null };
let ingredientCategoriesCopy: SyncedCollection<ContentCategory> = { items: new Map(), revision: null };
let cache: (Catalog & { at: number }) | null = null;

async function refresh<T extends { id: string; revision?: number }>(
  db: Firestore,
  name: string,
  copy: SyncedCollection<T>,
  read: (raw: unknown[]) => T[]
): Promise<SyncedCollection<T>> {
  const col = db.collection(name);
  const snap = await (copy.revision === null
    ? col.get()
    : col.where('revision', '>=', Timestamp.fromMillis(copy.revision)).get());
  const raw = snap.docs.map((d) => {
    const data = d.data();
    const revision = data.revision instanceof Timestamp ? data.revision.toMillis() : undefined;
    return { ...data, id: d.id, revision };
  });
  const items = copy.revision === null ? new Map<string, T>() : new Map(copy.items);
  const markers = raw.filter(isDeletionMarker);
  markers.forEach((m) => items.delete(m.id));
  const parsed = read(raw.filter((x) => !isDeletionMarker(x)));
  parsed.forEach((item) => items.set(item.id, item));
  return { items, revision: latestRevision([...parsed, ...markers], copy.revision ?? 0) };
}

/**
 * Published catalog, read from Firestore when the server has admin access. Recipes are only the
 * validated ones of the database (none without it: a recipe is never public before validation);
 * ingredients fall back to the built-in list.
 */
export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < REFRESH_MS) return cache;
  let recipes: Recipe[] = [];
  let ingredients: Ingredient[] = initialIngredients;
  let ingredientCategories: ContentCategory[] = [...BUILT_IN_INGREDIENT_CATEGORIES];
  const db = getAdminFirestore();
  if (db) {
    try {
      [recipesCopy, ingredientsCopy, ingredientCategoriesCopy] = await Promise.all([
        refresh(db, 'recipes', recipesCopy, parseStoredRecipes),
        refresh(db, 'ingredients', ingredientsCopy, parseStoredIngredients),
        refresh(db, 'ingredient_categories', ingredientCategoriesCopy, parseStoredCategories),
      ]);
      recipes = [...recipesCopy.items.values()];
      if (ingredientsCopy.items.size) ingredients = [...ingredientsCopy.items.values()];
      ingredientCategories = withBuiltInCategories(
        [...ingredientCategoriesCopy.items.values()],
        BUILT_IN_INGREDIENT_CATEGORIES
      );
    } catch (e) {
      console.warn('[seo] Firestore indisponible :', (e as Error).message);
      if (cache) return cache;
    }
  }
  cache = { at: Date.now(), recipes: publishedRecipes(recipes), ingredients, ingredientCategories };
  return cache;
}

/** Published recipes only, each with its address and a known course. */
export function publishedRecipes(recipes: Recipe[]): Recipe[] {
  return recipes
    .filter((r) => r && r.is_published !== false && r.name_fr)
    .map((r) => ({ ...r, slug: r.slug || slugify(r.name_fr), category: normalizeCategory(r.category) }));
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

/** The readable copy: hidden from visitors by index.html (.seo-fallback), replaced by React. */
function fallback(content: string): string {
  return `<main class="seo-fallback">\n${content}\n</main>`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length) + '…';
}

const FR = translations.fr;

const COURSE_ORDER = ['plat_principal', 'entree', 'dessert'] as const;
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
// Paging (readable copy of long lists)
// ---------------------------------------------------------------------------

interface ListPage<T> {
  items: T[];
  /** Position of the first item in the whole list (0-based) */
  offset: number;
  page: number;
  pages: number;
  total: number;
}

/** One page of a list; null when the page does not exist. */
export function pageOf<T>(all: T[], page: number, size = LIST_PAGE_SIZE): ListPage<T> | null {
  const pages = Math.max(1, Math.ceil(all.length / size));
  if (!Number.isInteger(page) || page < 1 || page > pages) return null;
  const offset = (page - 1) * size;
  return { items: all.slice(offset, offset + size), offset, page, pages, total: all.length };
}

/** "?page=n" query value → page number (anything else is the first page). */
export function parsePageNumber(value: unknown): number {
  return typeof value === 'string' && /^\d{1,6}$/.test(value) ? Number(value) : 1;
}

function pageAddress(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

function pagerNav(path: string, list: ListPage<unknown>): string {
  if (list.pages <= 1) return '';
  const prev = list.page > 1 ? `<a href="${pageAddress(path, list.page - 1)}" rel="prev">Page précédente</a> · ` : '';
  const next =
    list.page < list.pages ? ` · <a href="${pageAddress(path, list.page + 1)}" rel="next">Page suivante</a>` : '';
  return `<nav aria-label="Pages">${prev}Page ${list.page} sur ${list.pages}${next}</nav>`;
}

function pageSuffix(list: ListPage<unknown>): string {
  return list.page > 1 ? ` (page ${list.page})` : '';
}

/** Groups the items in the given order of groups (empty groups left out). */
function grouped<T, K extends string>(items: T[], order: readonly K[], key: (item: T) => K): [K, T[]][] {
  return order.map((k) => [k, items.filter((x) => key(x) === k)] as [K, T[]]).filter(([, xs]) => xs.length > 0);
}

/** Recipes in the order the readable copy lists them (by course, catalog order inside). */
function recipesByCourse(recipes: Recipe[]): Recipe[] {
  return grouped(recipes, COURSE_ORDER, (r) => r.category as (typeof COURSE_ORDER)[number]).flatMap(([, xs]) => xs);
}

function recipeLinks(recipes: Recipe[]): string {
  return grouped(recipes, COURSE_ORDER, (r) => r.category as (typeof COURSE_ORDER)[number])
    .map(
      ([c, items]) =>
        `<section><h2>${COURSE_PLURAL[c]}</h2><ul>${items
          .map((r) => `<li><a href="${recipePath(r)}">${esc(r.name_fr)}</a></li>`)
          .join('')}</ul></section>`
    )
    .join('');
}

function recipeItemList(base: string, list: ListPage<Recipe>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: list.total,
    itemListElement: list.items.map((r, i) => ({
      '@type': 'ListItem',
      position: list.offset + i + 1,
      url: `${base}${recipePath(r)}`,
      name: r.name_fr,
    })),
  };
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

interface PageContext {
  base: string;
  catalog: Catalog;
  /** Requested page of a list (1 = first) */
  page: number;
}

const SITE_NAME = 'Chnowa Ntayeb';
const INDEX = 'index, follow, max-image-preview:large';
const NO_INDEX = 'noindex, follow';
const HOME_TITLE = 'Chnowa Ntayeb - شنوة نطيب؟ | Recettes tunisiennes by Chef Souhed';
const HOME_DESCRIPTION =
  "Qu'est-ce qu'on cuisine aujourd'hui ? Plus de 100 recettes tunisiennes et du monde by Chef Souhed : idées repas avec ce qui reste dans votre frigo, menu de la semaine et liste de courses.";

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

function websitePage(
  base: string,
  fields: Partial<SeoPage> & Pick<SeoPage, 'title' | 'description' | 'canonical' | 'body'>
): SeoPage {
  return {
    status: 200,
    ogType: 'website',
    image: `${base}/og-image.png`,
    robots: INDEX,
    jsonLd: jsonLd(websiteLd(base)),
    ...fields,
  };
}

function homePage({ base, catalog }: PageContext): SeoPage {
  const list = pageOf(recipesByCourse(catalog.recipes), 1)!;
  const more = list.pages > 1 ? `<p><a href="${PATHS.recipes}">Toutes les recettes (${list.total})</a></p>` : '';
  return websitePage(base, {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical: `${base}/`,
    body: fallback(`<h1>Chnowa Ntayeb ? Qu\u2019est-ce qu\u2019on cuisine aujourd\u2019hui ?</h1>
<p>${esc(HOME_DESCRIPTION)}</p>
<p><a href="${PATHS.fridge}">Choisir les ingrédients de mon frigo</a> · <a href="${PATHS.recipes}">Toutes les recettes</a></p>
<nav aria-label="Recettes">${recipeLinks(list.items)}</nav>
${more}`),
  });
}

function recipesPage({ base, catalog, page }: PageContext): SeoPage | null {
  const list = pageOf(recipesByCourse(catalog.recipes), page);
  if (!list) return null;
  const description = `${list.total} recettes tunisiennes et internationales expliquées pas à pas by Chef Souhed : entrées, plats principaux et desserts, avec temps, budget et astuces.`;
  return websitePage(base, {
    title: `Toutes les recettes (${list.total})${pageSuffix(list)} | ${SITE_NAME} by Chef Souhed`,
    description,
    canonical: `${base}${pageAddress(PATHS.recipes, list.page)}`,
    jsonLd: jsonLd(websiteLd(base)) + jsonLd(recipeItemList(base, list)),
    body: fallback(`<h1>Toutes les recettes Chnowa Ntayeb</h1>
<p>${esc(description)}</p>
<nav aria-label="Recettes">${recipeLinks(list.items)}</nav>
${pagerNav(PATHS.recipes, list)}`),
  });
}

/** Same recipes as /recettes until the visitor fills the fridge: the catalog page is the reference. */
function suggestionsPage({ base, catalog, page }: PageContext): SeoPage | null {
  const list = pageOf(recipesByCourse(catalog.recipes), page);
  if (!list) return null;
  const description =
    'Idées de recettes tunisiennes et du monde à partir des ingrédients de votre frigo, classées selon ce qui vous manque, by Chef Souhed.';
  return websitePage(base, {
    title: `Idées de recettes avec votre frigo${pageSuffix(list)} | ${SITE_NAME}`,
    description,
    canonical: `${base}${pageAddress(PATHS.recipes, list.page)}`,
    body: fallback(`<h1>Que cuisiner avec ce qu’il y a dans votre frigo ?</h1>
<p>${esc(description)} <a href="${PATHS.fridge}">Choisissez vos ingrédients</a> pour voir les recettes possibles.</p>
<nav aria-label="Recettes">${recipeLinks(list.items)}</nav>
${pagerNav(PATHS.suggestions, list)}`),
  });
}

function ingredientLine(i: Ingredient): string {
  const ar = i.name_ar && i.name_ar !== i.name_fr ? ` <span lang="ar" dir="rtl">${esc(i.name_ar)}</span>` : '';
  const price = formatPriceRange(ingredientPriceRange(i), FR.currency);
  return `<li>${esc(i.name_fr)}${ar} : ${esc(price)} / ${esc(i.unit_default)}</li>`;
}

function fridgePage({ base, catalog, page }: PageContext): SeoPage | null {
  // Ingredients by family of the managed categories (tree order), alphabetical inside
  const tree = buildCategoryTree(catalog.ingredientCategories ?? BUILT_IN_INGREDIENT_CATEGORIES);
  const families = tree.roots.map((n) => n.category.id);
  const familyOf = (i: Ingredient) => tree.byId.get(i.category)?.path[0] ?? 'other';
  const familyName = (id: string) => tree.byId.get(id)?.category.name_fr ?? id;
  const sorted = grouped(catalog.ingredients, families, familyOf).flatMap(([, xs]) =>
    [...xs].sort((a, b) => a.name_fr.localeCompare(b.name_fr, 'fr'))
  );
  const list = pageOf(sorted, page);
  if (!list) return null;
  const description = `Choisissez parmi ${list.total} ingrédients ce que vous avez dans votre frigo : Chnowa Ntayeb vous propose les recettes tunisiennes possibles, avec le prix indicatif de chaque ingrédient.`;
  const sections = grouped(list.items, families, familyOf)
    .map(
      ([c, items]) => `<section><h2>${esc(familyName(c))}</h2><ul>${items.map(ingredientLine).join('')}</ul></section>`
    )
    .join('');
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ingrédients',
    numberOfItems: list.total,
    itemListElement: list.items.map((i, n) => ({
      '@type': 'ListItem',
      position: list.offset + n + 1,
      name: i.name_fr,
    })),
  };
  return websitePage(base, {
    title: `Mon frigo : ${list.total} ingrédients${pageSuffix(list)} | ${SITE_NAME}`,
    description,
    canonical: `${base}${pageAddress(PATHS.fridge, list.page)}`,
    jsonLd: jsonLd(websiteLd(base)) + jsonLd(itemList),
    body: fallback(`<h1>Qu’avez-vous dans votre frigo ?</h1>
<p>${esc(description)}</p>
<nav aria-label="Ingrédients">${sections}</nav>
${pagerNav(PATHS.fridge, list)}
<p><a href="${PATHS.recipes}">Voir toutes les recettes</a></p>`),
  });
}

/** Screens whose content is personal (kept on the device): described, not indexed. */
function personalPage(path: string, title: string, description: string) {
  return ({ base }: PageContext): SeoPage =>
    websitePage(base, {
      title: `${title} | ${SITE_NAME}`,
      description,
      canonical: `${base}${path}`,
      robots: NO_INDEX,
      body: fallback(`<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${PATHS.fridge}">Mon frigo</a> · <a href="${PATHS.recipes}">Toutes les recettes</a></p>`),
    });
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
  const body =
    fallback(`<nav aria-label="Fil d'Ariane"><a href="/">${SITE_NAME}</a> › <a href="/recettes">Recettes</a> › ${esc(r.name_fr)}</nav>
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
${related.length ? `<aside><h2>À découvrir aussi</h2><ul>${related.map((x) => `<li><a href="${recipePath(x)}">${esc(x.name_fr)}</a></li>`).join('')}</ul></aside>` : ''}`);
  return {
    status: 200,
    title,
    description,
    canonical: `${base}${recipePath(r)}`,
    ogType: 'article',
    image: absoluteImage(r, base),
    robots: INDEX,
    jsonLd: jsonLd(ld) + jsonLd(breadcrumb),
    body,
  };
}

export function notFoundPage(base: string, catalog: Catalog): SeoPage {
  return {
    ...homePage({ base, catalog, page: 1 }),
    status: 404,
    title: `Page introuvable | ${SITE_NAME}`,
    robots: NO_INDEX,
    canonical: `${base}/`,
  };
}

/** Public screens rendered by the server (a new public address gets its builder here). */
const SCREENS: Record<string, (ctx: PageContext) => SeoPage | null> = {
  [PATHS.home]: homePage,
  [PATHS.recipes]: recipesPage,
  [PATHS.suggestions]: suggestionsPage,
  [PATHS.fridge]: fridgePage,
  [PATHS.planner]: personalPage(
    PATHS.planner,
    'Menu de la semaine',
    'Préparez votre menu de la semaine avec les recettes tunisiennes de Chef Souhed : entrée, plat et dessert pour chaque jour, selon votre budget.'
  ),
  [PATHS.grocery]: personalPage(
    PATHS.grocery,
    'Liste de courses',
    'La liste de courses de votre menu de la semaine, avec le prix indicatif des ingrédients qui vous manquent.'
  ),
};

const RECIPE_PATH = new RegExp('^' + PATHS.recipe.replace(':slug', '([^/]+)') + '$');

/** Address without trailing slash ("/index.html" is the home page). */
function normalizePath(path: string): string {
  if (path === '/index.html') return PATHS.home;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** True when the server renders this address (decided before reading the catalog). */
export function isSeoPath(path: string): boolean {
  const p = normalizePath(path);
  return isLegacyPath(p) || p in SCREENS || p.startsWith(PATHS.recipe.replace(':slug', ''));
}

/** The page for a public address, or null when the address is left to the app (/patron, files...). */
export function resolvePage(path: string, base: string, catalog: Catalog, page = 1): SeoPage | null {
  const p = normalizePath(path);
  const screen = SCREENS[p];
  if (screen) return screen({ base, catalog, page }) ?? notFoundPage(base, catalog);
  const m = p.match(RECIPE_PATH);
  if (m) {
    const r = catalog.recipes.find((x) => x.slug === m[1]);
    return r ? recipePage(base, r, catalog.recipes, catalog.ingredients) : notFoundPage(base, catalog);
  }
  if (p.startsWith(PATHS.recipe.replace(':slug', '')) || isLegacyPath(p)) return notFoundPage(base, catalog);
  return null;
}

/**
 * Public addresses before the English rename: answered with a permanent redirect so the
 * SEO earned on the French paths transfers to the English ones.
 */
export function isLegacyPath(path: string): boolean {
  const p = normalizePath(path);
  return p in LEGACY_PATHS || p.startsWith(LEGACY_RECIPE_PREFIX);
}

/** 301 target of a legacy address (slug and query preserved), null when it is not legacy. */
export function legacyRedirect(path: string): string | null {
  const p = normalizePath(path);
  // Exact page match first: '/recettes' starts with '/recette' too
  const exact = LEGACY_PATHS[p];
  if (exact) return exact;
  if (p.startsWith(LEGACY_RECIPE_PREFIX + '/') || p === LEGACY_RECIPE_PREFIX) {
    return PATHS.recipe.replace(':slug', p.slice(LEGACY_RECIPE_PREFIX.length + 1) || '');
  }
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
  // Functions as replacement: "$" in the content must stay as is
  html = html.replace(/(<meta charset="UTF-8" \/>)/i, (tag) => `${tag}\n    ${head}`);
  html = html.replace('<div id="root"></div>', () => `<div id="root">${page.body}</div>`);
  return html;
}

export function sitemapXml(base: string, catalog: Catalog): string {
  // Only ever public URLs: the published recipes, defensively re-filtered whatever the caller passed.
  const urls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}${PATHS.recipes}`, priority: '0.9', changefreq: 'daily' },
    { loc: `${base}${PATHS.fridge}`, priority: '0.7', changefreq: 'weekly' },
    ...publishedRecipes(catalog.recipes).map((r) => ({
      loc: `${base}${recipePath(r)}`,
      priority: '0.8',
      changefreq: 'monthly',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
}
