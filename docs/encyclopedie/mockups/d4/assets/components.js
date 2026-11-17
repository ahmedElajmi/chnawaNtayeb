/* =============================================================
   Chnawa Ntayeb — maquettes D4 (v4.4) : REGISTRE DE COMPOSANTS
   Pensé pour un futur moteur CMS : une page = une liste de blocs
   { c: "nom-du-composant", props: { … } } ; un composant = une
   définition unique (meta + render + mount), réutilisable à n'importe
   quel emplacement, sans duplication. Deux façons de placer un bloc :
     1. <div data-c="shelf" data-props='{"shelf":"rapide"}'></div>
     2. <script type="application/json" id="page-schema">{"blocks":[…]}</script>
        + <main data-page-root></main>
   Données : assets/data.js (source unique). État partagé : CN.filters
   (tous les filtres F1/F2/F3 écrivent au même endroit), CN.plan, CN.ui.
   Chargé AVANT assets/app.js (qui pose ensuite carrousels et traductions).
   ============================================================= */
(function () {
  'use strict';
  var D = window.CN_DATA;
  var html = document.documentElement;
  var lang = function () { return (window.D4 && window.D4.lang()) || 'fr'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return n.toFixed(2).replace('.', ','); };
  var L4 = function (fr, derja, ar, derja_ar) { return { fr: fr, derja: derja, ar: ar, derja_ar: derja_ar }; };
  var pick = function (o) { return o[lang()] || o.fr; };

  /* ---------- Chaînes des composants (4 langues ; derja à relire — D-15) ---------- */
  window.CN_I18N = {
    viewShelves: L4('Étals', 'Ftâyer', 'رفوف', 'رفوف'),
    viewMosaic: L4('Mosaïque', 'Mosaïque', 'فسيفساء', 'موزاييك'),
    viewDeck: L4('Ce soir je mange…', 'El lila nekel…', 'الليلة سآكل…', 'الليلة ناكل…'),
    shelfFridge: L4('Avec ce que j’ai', 'B elli 3andi', 'بما لديّ', 'باللي عندي'),
    shelfQuick: L4('Prêt en 30 min', 'Wajed f 30 d', 'جاهز في 30 دقيقة', 'واجد في 30 دقيقة'),
    shelfFriday: L4('Plats du vendredi', 'Maklet ejjom3a', 'أطباق الجمعة', 'ماكلة الجمعة'),
    shelfBudget: L4('Petit budget', 'Rkhis', 'ميزانية صغيرة', 'رخيص'),
    shelfRamadan: L4('Pour le Ramadan', 'Lel Ramdhan', 'لرمضان', 'لرمضان'),
    shelfGuests: L4('Pour recevoir', 'Ki tji el 3ayla', 'لاستقبال الضيوف', 'كي تجي العايلة'),
    shelfSweet: L4('Douceurs et petit-déjeuner', '7lou w fter', 'حلويات وفطور', 'حلو وفطور'),
    seeAll: L4('Tout voir', 'Chouf el kol', 'عرض الكل', 'شوف الكل'),
    filters: L4('Filtres', 'Filtres', 'المرشّحات', 'فيلترات'),
    resetAll: L4('Tout effacer', 'Fasakh el kol', 'مسح الكل', 'فسّخ الكل'),
    withMine: L4('Avec mon frigo', 'B frigo mte3i', 'بثلاجتي', 'بالفريجيدار متاعي'),
    quick30: L4('≤ 30 min', '≤ 30 d', '≤ 30 د', '≤ 30 د'),
    cheap3: L4('≤ 3 DT', '≤ 3 DT', '≤ 3 د.ت', '≤ 3 د.ت'),
    veggie: L4('Végétarien', 'Bla l7am', 'نباتي', 'بلا لحم'),
    friday: L4('Vendredi', 'Jom3a', 'الجمعة', 'الجمعة'),
    withIng: L4('Avec', 'B', 'مع', 'ب'),
    withoutIng: L4('Sans', 'Bla', 'بدون', 'بلا'),
    addIng: L4('+ Ajouter', '+ Zid', '+ أضف', '+ زيد'),
    noResult: L4('Aucune recette ne correspond.', 'Famech makla kif ma t7eb.', 'لا توجد وصفة مطابقة.', 'ما فمّاش ماكلة كيما تحب.'),
    notTonight: L4('Pas ce soir', 'Mouch el lila', 'ليس الليلة', 'موش الليلة'),
    tempting: L4('Ça me tente', 'Ye3jebni', 'تعجبني', 'يعجبني'),
    seeRecipe: L4('Voir la recette', 'Chouf el recette', 'عرض الوصفة', 'شوف الوصفة'),
    myPicks: L4('Vos envies du soir', 'Elli 3ajbouk', 'اختياراتك لليلة', 'اللي عجبوك'),
    slotLunch: L4('Midi', 'Fter', 'الغداء', 'فطور'),
    slotDinner: L4('Soir', '3cha', 'العشاء', 'عشاء'),
    slotIftar: L4('Iftar', 'Ftour', 'الإفطار', 'فطور رمضان'),
    slotShour: L4('Shour', 'S7our', 'السحور', 'سحور'),
    ramadanMode: L4('Mode Ramadan', 'Mode Ramdhan', 'وضع رمضان', 'مود رمضان'),
    copyWeek: L4('Copier la semaine dernière', 'Copier el jom3a elli fatet', 'نسخ الأسبوع الماضي', 'كوبي الجمعة اللي فاتت'),
    shareWa: L4('Partager sur WhatsApp', 'Partagi 3al WhatsApp', 'مشاركة عبر واتساب', 'بارتاجي على واتساب'),
    makeList: L4('Créer la liste de courses', 'A3mel liste el qadhya', 'إنشاء قائمة المشتريات', 'اعمل ليستة القضية'),
    add: L4('Ajouter', 'Zid', 'إضافة', 'زيد'),
    today: L4('Aujourd’hui', 'Lyoum', 'اليوم', 'اليوم'),
    cookDouble: L4('Cuisiner double (restes demain)', 'Tayeb double (fadhla ghodwa)', 'اطبخ الضعف (بقايا للغد)', 'طيب دوبل (فضلة غدوة)'),
    leftovers: L4('Restes', 'Fadhla', 'بقايا', 'فضلة'),
    move: L4('Déplacer', 'Baddel blasa', 'نقل', 'بدّل البلاصة'),
    remove: L4('Retirer', 'Na77i', 'إزالة', 'نحّي'),
    notePh: L4('Note du jour (ex. chez ma mère)', 'Note (mathalan 3and ommi)', 'ملاحظة اليوم', 'نوتة (مثلاً عند أمي)'),
    ideasFridge: L4('Idées avec votre frigo', 'Afkar b frigo mte3ek', 'أفكار بثلاجتك', 'أفكار بالفريجيدار متاعك'),
    recipesN: L4('{n} recettes', '{n} maklet', '{n} وصفة', '{n} ماكلة'),
    recipes1: L4('1 recette', 'makla wa7da', 'وصفة واحدة', 'ماكلة وحدة'),
  };
  var T = function (k, vars) { if (!window.CN_I18N[k] && window.D4) return window.D4.t(k, vars); var s = pick(window.CN_I18N[k] || { fr: k }); return s.replace(/\{(\w)\}/g, function (m, v) { return vars && vars[v] != null ? vars[v] : m; }); };
  var tk = function (k) { return '<span data-i18n="' + k + '">' + esc(T(k)) + '</span>'; };

  /* ---------- Correspondance : AFFICHAGE de résultats déclarés (v4.6) ----------
     La maquette n'implémente PAS le moteur de matching : elle affiche les résultats déclarés dans data.js
     (STATES, surchargés par un scénario de test SCENARIOS via html[data-scenario] ou la prop « scenario »).
     Seules deux règles d'affichage sont appliquées ici, partout de la même façon :
       1. une substitution acceptée retire l'ingrédient des manquants, et ses remplaçants sans quantité
          deviennent « à vérifier » ; elle n'est proposée que si tous ses remplaçants sont présents ;
       2. niveau affiché (convention D-02) : Prête = 0 manquant ET 0 à vérifier ; Presque = 1 à 3 manquants
          ou au moins une quantité à vérifier ; À découvrir = 4 manquants ou plus.
     Résultat : score, niveau, liste d'ingrédients, statut et action principale ne peuvent plus diverger. */
  var byId = {}; D.RECIPES.forEach(function (r) { byId[r.id] = r; });
  var available = function (id) { return Object.prototype.hasOwnProperty.call(D.FRIDGE, id) && D.OUT.indexOf(id) === -1; };
  var scenarioId = function () { return html.getAttribute('data-scenario') || 'base'; };
  var stateOf = function (r, scen) { var sc = D.SCENARIOS[scen || scenarioId()] || D.SCENARIOS.base; return (sc.states || {})[r.id] || D.STATES[r.id]; };
  var displayLevel = function (nMissing, nVerify) { return !nMissing && !nVerify ? 'ready' : nMissing <= 3 ? 'almost' : 'discover'; };
  var accepted = {}; /* { idRecette: { idIngrédient: 'accepted' | 'refused' } } — choix de l'utilisateur pour CETTE préparation */
  var match = function (r, opt) {
    opt = opt || {};
    var st = stateOf(r, opt.scenario), acc = opt.accept || accepted[r.id] || {};
    var present = st.have.concat(st.verify), verify = st.verify.slice(), subs = {};
    Object.keys(st.subs || {}).forEach(function (id) {
      if (st.missing.indexOf(id) === -1) return;
      var by = st.subs[id];
      subs[id] = { by: by, possible: by.every(function (x) { return present.indexOf(x) !== -1; }), state: acc[id] || 'proposed' };
    });
    var replaced = Object.keys(subs).filter(function (id) { return subs[id].possible && subs[id].state === 'accepted'; });
    replaced.forEach(function (id) { subs[id].by.forEach(function (x) { if (st.verify.indexOf(x) !== -1 && verify.indexOf(x) === -1) verify.push(x); }); });
    var missing = st.missing.filter(function (id) { return replaced.indexOf(id) === -1; });
    var total = r.ingredients.length;
    return { have: total - missing.length, total: total, haveIds: st.have, verify: verify, missing: missing, replaced: replaced, subs: subs,
      substitutable: missing.filter(function (id) { return subs[id] && subs[id].possible && subs[id].state === 'proposed'; }),
      level: displayLevel(missing.length, verify.length) };
  };
  var LEVEL_ORDER = { ready: 0, almost: 1, discover: 2 };
  var isAr = function () { return lang() === 'ar' || lang() === 'derja_ar'; };
  var ingName = function (id) { return isAr() && window.CN_ING_AR && window.CN_ING_AR[id] ? window.CN_ING_AR[id] : (D.ING[id] || [id])[0]; };
  /* Nom de catégorie par langue (champs <champ>_<langue> du CMS). */
  var catName = function (c) { var t = (window.CN_CAT_I18N || {})[c.id], k = { derja: 0, ar: 1, derja_ar: 2 }[lang()]; return t && k != null ? t[k] : c.name; };
  var rName = function (r) { return (lang() === 'ar' || lang() === 'derja_ar') && r.name_ar ? r.name_ar : r.name; };

  /* ---------- État partagé des filtres (F1, F2, F3 écrivent tous ici) ---------- */
  var listeners = [];
  var FILTER0 = { q: '', course: 'any', maxTime: null, servings: 4, fridge: false, maxPrice: null, veg: false, tag: null, cats: [], include: [], exclude: [] };
  var CN = window.CN = {
    data: D, match: match, byId: byId, esc: esc, T: T, accepted: accepted, displayLevel: displayLevel, stateOf: stateOf,
    filters: JSON.parse(JSON.stringify(FILTER0)),
    ui: { view: 'shelves', liked: [] },
    components: {},
    on: function (fn) { listeners.push(fn); },
    set: function (patch) { Object.keys(patch).forEach(function (k) { CN.filters[k] = patch[k]; }); listeners.forEach(function (fn) { fn(); }); },
    reset: function () { CN.filters = JSON.parse(JSON.stringify(FILTER0)); listeners.forEach(function (fn) { fn(); }); },
    activeCount: function () {
      var f = CN.filters, n = 0;
      if (f.course !== 'any') n++; if (f.maxTime) n++; if (f.fridge) n++; if (f.maxPrice) n++; if (f.veg) n++; if (f.tag) n++;
      return n + f.cats.length + f.include.length + f.exclude.length;
    },
  };
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  /* query = filtres d'un étal ; f = filtres de l'utilisateur ; les deux se combinent. */
  CN.results = function (query, override) {
    var f = override ? Object.assign({}, CN.filters, override) : CN.filters; query = query || {};
    return D.RECIPES.filter(function (r) {
      var m = match(r);
      if (query.levels && query.levels.indexOf(m.level) === -1) return false;
      if (query.maxTime && r.time > query.maxTime) return false;
      if (query.maxPrice && r.priceMin > query.maxPrice) return false;
      if (query.tag && r.tags.indexOf(query.tag) === -1) return false;
      if (query.course && r.course !== query.course) return false;
      if (f.q && norm(r.name + ' ' + r.name_ar + ' ' + r.ingredients.map(ingName).join(' ')).indexOf(norm(f.q)) === -1) return false;
      if (f.course !== 'any' && r.course !== f.course) return false;
      if (f.maxTime && r.time > f.maxTime) return false;
      if (f.maxPrice && r.priceMin > f.maxPrice) return false;
      if (f.fridge && m.level === 'discover') return false;
      if (f.veg && r.tags.indexOf('vegetarien') === -1) return false;
      if (f.tag && r.tags.indexOf(f.tag) === -1) return false;
      if (f.cats.length && !f.cats.some(function (c) { return r.cats.indexOf(c) !== -1; })) return false;
      if (f.include.length && !f.include.every(function (i) { return r.ingredients.indexOf(i) !== -1; })) return false;
      if (f.exclude.some(function (i) { return r.ingredients.indexOf(i) !== -1; })) return false;
      return true;
    }).sort(function (a, b) {
      var ma = match(a), mb = match(b);
      return LEVEL_ORDER[ma.level] - LEVEL_ORDER[mb.level] || (mb.have / mb.total) - (ma.have / ma.total) || a.time - b.time;
    });
  };

  /* ---------- Registre ---------- */
  /* define(nom, { title, desc, props:[[nom, type, défaut, description]], usedIn:[], example:{}, render(props, el), mount(el, props) }) */
  CN.define = function (name, def) { def.name = name; CN.components[name] = def; };
  CN.mountEl = function (el) {
    var name = el.getAttribute('data-c'), def = CN.components[name];
    if (!def) { el.innerHTML = '<p class="anno">Composant inconnu : ' + esc(name) + '</p>'; return; }
    var props = {}; try { props = JSON.parse(el.getAttribute('data-props') || '{}'); } catch (e) { props = {}; }
    el.classList.add('cn-' + name);
    var draw = function () { el.innerHTML = def.render(props, el); if (def.mount) def.mount(el, props, draw); CN.mountAll(el); /* blocs imbriqués (conteneurs) */ };
    el._cnDraw = function () { draw(); if (window.D4) window.D4.refresh(el); };
    draw();
    if (def.reactive) CN.on(el._cnDraw);
    document.addEventListener('d4:lang', function () { if (def.i18nRender) el._cnDraw(); });
  };
  CN.mountAll = function (root) { (root || document).querySelectorAll('[data-c]').forEach(function (el) { if (!el._cnDraw) CN.mountEl(el); }); };
  /* Une page CMS : schéma JSON → blocs dans l'ordre. */
  CN.renderPage = function () {
    var sc = document.getElementById('page-schema'), root = document.querySelector('[data-page-root]');
    if (!sc || !root) return;
    var schema = JSON.parse(sc.textContent);
    root.innerHTML = schema.blocks.map(function (b) {
      var show = b.show ? ' data-show-attr="' + esc(b.show.attr) + '" data-show-in="' + esc(b.show['in'].join(' ')) + '"' : '';
      return '<div data-c="' + esc(b.c) + '" data-props="' + esc(JSON.stringify(b.props || {})) + '"' + (b.id ? ' id="' + esc(b.id) + '"' : '') + show + '></div>';
    }).join('');
    CN.applyShow();
  };

  /* Visibilité des blocs selon un état (ex. data-home-state, data-auth) : un bloc, plusieurs emplacements / états. */
  CN.applyShow = function () {
    document.querySelectorAll('[data-show-attr]').forEach(function (el) {
      var v = html.getAttribute(el.getAttribute('data-show-attr')) || '';
      el.hidden = el.getAttribute('data-show-in').split(' ').indexOf(v) === -1;
    });
  };
  /* Commandes de démonstration génériques : <button class="ctl demo-attr" data-attr="data-x" data-v="…"> (générées depuis le schéma). */
  CN.bindDemo = function () {
    document.querySelectorAll('.demo-attr').forEach(function (b) {
      var sync = function () { document.querySelectorAll('.demo-attr[data-attr="' + b.dataset.attr + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(html.getAttribute(x.dataset.attr) === x.dataset.v)); }); };
      b.addEventListener('click', function () {
        html.setAttribute(b.dataset.attr, b.dataset.v); sync(); CN.applyShow();
        document.dispatchEvent(new CustomEvent('cn:demo', { detail: b.dataset.attr }));
        document.querySelectorAll('[data-c]').forEach(function (el) { var d = CN.components[el.getAttribute('data-c')]; if (d && d.demoRender && el._cnDraw) el._cnDraw(); });
        window.dispatchEvent(new Event('resize'));
      });
      sync();
    });
  };

  /* ================================================================
     COMPOSANTS
     ================================================================ */

  /* --- Carte de recette (4 variantes) --- */
  var reasonHtml = function (r, m) {
    if (m.level === 'ready') return '✓ <b>' + esc(T('allThere')) + '</b>';
    var parts = [];
    if (m.missing.length) parts.push('🛒 <b>' + (m.missing.length <= 2 ? m.missing.map(function (id) { return ingName(id) + (m.substitutable.indexOf(id) !== -1 ? ' (🔁)' : ''); }).join(', ') : m.missing.length + ' ' + T('toBuyN')) + '</b>');
    if (m.verify.length) parts.push('? ' + m.verify.map(ingName).join(', ').toLowerCase());
    return parts.join(' · ');
  };
  var card = function (r, variant) {
    var m = match(r), cls = { ready: 'ok', almost: 'warn', discover: 'disc' }[m.level];
    var badge = '<span class="match-badge ' + cls + '"><span class="num">' + m.have + ' / ' + m.total + '</span></span>';
    var img = '<div class="ph" data-fallback="' + r.fallback + '"><img src="' + (variant === 'featured' || variant === 'deck' ? r.photoLarge : r.photo) + '" alt="' + esc(r.name) + '" width="480" height="360" loading="lazy" /></div>';
    var meta = '<span class="num">' + r.time + ' min</span> · ' + esc(T({ facile: 'easy', moyen: 'medium', difficile: 'hard' }[r.difficulty]).toLowerCase()) + ' · <span class="num">' + money(r.priceMin) + ' – ' + money(r.priceMax) + ' DT</span>';
    if (variant === 'featured') return '<a class="rcard featured cn-feat" href="recette.html?id=' + r.id + '">' + badge + img + '<span class="overlay-title">' + esc(rName(r)) + '<span class="cn-feat-meta">' + meta + '</span><span class="cn-feat-reason">' + reasonHtml(r, m) + '</span></span></a>';
    if (variant === 'compact') return '<a class="cn-row" href="recette.html?id=' + r.id + '"><span class="cn-row-ph ph" data-fallback="' + r.fallback + '"><img src="' + r.photo + '" alt="" width="64" height="64" loading="lazy" /></span><span class="grow"><b>' + esc(rName(r)) + '</b><span class="reason">' + meta + '</span></span>' + badge.replace('match-badge', 'match-badge cn-inline') + '</a>';
    return '<a class="rcard" href="recette.html?id=' + r.id + '">' + badge + img + '<div class="rbody"><span class="rtitle">' + esc(rName(r)) + '</span><span class="rmeta">' + meta + '</span><span class="reason">' + reasonHtml(r, m) + '</span></div></a>';
  };
  CN.card = card;
  CN.define('recipe-card', {
    title: 'Carte de recette', desc: 'Photo, niveau de correspondance, temps, difficulté, prix en fourchette et raison de la proposition (manquants nommés, quantité à vérifier).',
    props: [['recipe', 'id de recette', 'ojja', 'recette affichée'], ['variant', 'grid | featured | compact', 'grid', 'grille, grande carte superposée (mosaïque), ligne compacte']],
    usedIn: ['étals', 'mosaïque', 'carrousels de l’accueil', 'favoris', 'résultats'], example: { recipe: 'ojja', variant: 'grid' }, i18nRender: true,
    render: function (p) { var r = byId[p.recipe || 'ojja']; return r ? card(r, p.variant || 'grid') : ''; },
  });

  /* --- En-tête de section --- */
  var head = function (eyebrow, title, linkHtml, extra) {
    return '<div class="section-head"><div>' + (eyebrow ? '<span class="eyebrow">' + eyebrow + '</span>' : '') + '<h2>' + title + (extra || '') + '</h2></div>' + (linkHtml || '') + '</div>';
  };
  CN.define('section-head', {
    title: 'En-tête de section', desc: 'Surtitre, titre, lien « Tout voir ».',
    props: [['eyebrow', 'texte', '', 'surtitre'], ['title', 'texte', '', 'titre'], ['href', 'url', '', 'lien « Tout voir »']],
    usedIn: ['toutes les sections'], example: { eyebrow: 'by chef Souhed', title: 'Nouveautés du chef', href: 'recherche.html' },
    render: function (p) { return head(esc(p.eyebrow || ''), esc(p.title || ''), p.href ? '<a class="more" href="' + esc(p.href) + '">' + tk('seeAll') + '</a>' : ''); },
  });

  /* --- Carrousel de catégories (réutilise .rail) --- */
  var rail = function (label, inner) { return '<div class="rail" data-rail="' + esc(label) + '"><div class="rail-track" tabindex="0" role="region" aria-label="' + esc(label) + '">' + inner + '</div></div>'; };
  CN.rail = rail;
  CN.define('category-rail', {
    title: 'Carrousel de catégories', desc: 'Les catégories gérées dans /admin › Catégories, en cercles photo ; un clic filtre les recettes (mode « filter ») ou ouvre la page Recettes (mode « link »).',
    props: [['mode', 'link | filter', 'link', 'lien vers Recettes ou filtre en place'], ['title', 'texte', 'Par catégorie', 'titre (vide = sans en-tête)'], ['limit', 'nombre', '16', 'nombre de catégories']],
    usedIn: ['accueil', 'page Recettes', 'carrousel.html'], example: { mode: 'link', limit: 8 }, reactive: true, i18nRender: true,
    render: function (p) {
      var cats = D.CATS.slice(0, p.limit || 16), on = CN.filters.cats;
      var items = cats.map(function (c) {
        var pressed = p.mode === 'filter' ? ' aria-pressed="' + (on.indexOf(c.id) !== -1) + '"' : '';
        var tag = p.mode === 'filter' ? 'button type="button" data-cat="' + c.id + '"' : 'a href="recherche.html"';
        return '<' + tag + ' class="cat-card"' + pressed + '><span class="ph" data-fallback="' + c.fallback + '"><img src="' + c.photo + '" alt="" width="104" height="104" loading="lazy" /></span><span>' + esc(catName(c)) + '</span></' + tag.split(' ')[0] + '>';
      }).join('');
      return (p.title === '' ? '' : head(tk('secDiscover'), p.titleKey ? tk(p.titleKey) : esc(loc(p.title) || T('byCategory')), p.mode === 'filter' ? '' : '<a class="more" href="recherche.html">' + tk('seeAll') + '</a>')) + rail('catégories', items);
    },
    mount: function (el, p) {
      if (p.mode !== 'filter') return;
      el.querySelectorAll('[data-cat]').forEach(function (b) {
        b.addEventListener('click', function () {
          var c = b.dataset.cat, cats = CN.filters.cats.slice(), i = cats.indexOf(c);
          if (i === -1) cats.push(c); else cats.splice(i, 1);
          CN.set({ cats: cats });
        });
      });
    },
  });

  /* --- R1 : un étal --- */
  var shelfHtml = function (s) {
    var list = CN.results(s.query);
    if (!list.length) return '';
    var count = '<span class="muted num" style="font-size:13px;font-weight:700;margin-inline-start:8px">' + list.length + '</span>';
    return '<section class="cn-shelf">' + head('', s.i18n ? tk(s.i18n) : esc(s.title), '<button type="button" class="more cn-linkbtn" data-shelf-all="' + s.id + '">' + tk('seeAll') + '</button>', count) +
      rail(s.title, list.map(function (r) { return card(r, 'grid'); }).join('')) + '</section>';
  };
  CN.define('shelf', {
    title: 'Étal (R1)', desc: 'Une requête enregistrée par le chef (« Prêt en 30 min », « Plats du vendredi »…) affichée en carrousel ; combinée aux filtres de l’utilisateur ; masquée si vide. « Tout voir » applique la requête et passe en mosaïque.',
    props: [['shelf', 'id d’étal (data.js › SHELVES)', 'rapide', 'requête enregistrée']],
    usedIn: ['page Recettes (vue Étals)', 'accueil', 'pages thématiques du CMS'], example: { shelf: 'rapide' }, reactive: true, i18nRender: true,
    render: function (p) { var s = D.SHELVES.filter(function (x) { return x.id === p.shelf; })[0]; return s ? shelfHtml(s) : ''; },
    mount: function (el) { bindShelfAll(el); },
  });
  var bindShelfAll = function (el) {
    el.querySelectorAll('[data-shelf-all]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = D.SHELVES.filter(function (x) { return x.id === b.dataset.shelfAll; })[0], q = s.query, patch = {};
        if (q.maxTime) patch.maxTime = q.maxTime; if (q.maxPrice) patch.maxPrice = q.maxPrice; if (q.tag) patch.tag = q.tag;
        if (q.levels) patch.fridge = true; if (q.course) patch.course = q.course;
        CN.ui.view = 'mosaic'; CN.set(patch);
        var top = document.querySelector('.cn-recipe-views'); if (top) top.scrollIntoView({ block: 'start' });
      });
    });
  };

  /* --- R2 : mosaïque éditoriale (pagination 12 par 12, total juste) --- */
  var mosaicHtml = function (limit) {
    var list = CN.results();
    if (!list.length) return emptyHtml();
    var shown = list.slice(0, limit);
    return '<div class="cn-mosaic">' + shown.map(function (r, i) { return card(r, i === 0 ? 'featured' : 'grid'); }).join('') + '</div>' +
      (list.length > limit ? '<button type="button" class="btn btn-secondary btn-block" data-more style="margin-top:12px">' + esc(T('moreN', { n: list.length - limit })) + '</button>' : '');
  };
  var emptyHtml = function () { return '<div class="state-note" style="margin-top:12px"><span class="icon" aria-hidden="true">🍽️</span>' + tk('noResult') + '<div class="row" style="justify-content:center"><button type="button" class="btn btn-secondary btn-sm" data-reset>' + tk('resetAll') + '</button></div></div>'; };
  var bindReset = function (el) { el.querySelectorAll('[data-reset]').forEach(function (b) { b.addEventListener('click', function () { CN.reset(); }); }); };

  /* --- R3 : « Ce soir je mange… » (une carte à la fois ; boutons, clavier, glisser) --- */
  var deck = { i: 0 };
  var deckHtml = function () {
    var list = CN.results();
    if (!list.length) return emptyHtml();
    if (deck.i >= list.length) return '<div class="state-note"><span class="icon" aria-hidden="true">🎉</span>' + tk('allSeen') + ' <div class="row" style="justify-content:center"><button class="btn btn-secondary btn-sm" data-deck-restart>' + tk('restart') + '</button></div></div>' + likedHtml();
    var r = list[deck.i], m = match(r), next = list.slice(deck.i + 1, deck.i + 3);
    return '<div class="cn-deck" tabindex="0" aria-label="' + esc(rName(r)) + ' — ' + esc(T('deckOf', { i: deck.i + 1, n: list.length })) + '">' +
      next.reverse().map(function (n, k) { return '<div class="cn-deck-back" style="--k:' + (next.length - k) + '"><img src="' + n.photo + '" alt="" width="480" height="360" loading="lazy" /></div>'; }).join('') +
      '<article class="cn-deck-card" data-deck-card><div class="ph" data-fallback="' + r.fallback + '"><img src="' + r.photoLarge + '" alt="' + esc(r.name) + '" width="1024" height="768" /></div>' +
      '<div class="cn-deck-body"><span class="match-badge ' + { ready: 'ok', almost: 'warn', discover: 'disc' }[m.level] + '" style="position:static"><span class="num">' + m.have + ' / ' + m.total + '</span></span>' +
      '<h3>' + esc(rName(r)) + '</h3><p class="reason" style="font-size:14px">' + reasonHtml(r, m) + '</p><p class="muted" style="margin:0;font-size:13px"><span class="num">' + r.time + ' min</span> · ' + esc(T({ facile: 'easy', moyen: 'medium', difficile: 'hard' }[r.difficulty]).toLowerCase()) + ' · <span class="num">' + money(r.priceMin) + ' – ' + money(r.priceMax) + ' DT</span> ' + tk('perPers') + '</p></div></article></div>' +
      '<div class="cn-deck-actions"><button type="button" class="cn-round" data-deck="no" aria-label="' + esc(T('notTonight')) + '">✕</button>' +
      '<a class="btn btn-secondary" href="recette.html?id=' + r.id + '">' + tk('seeRecipe') + '</a>' +
      '<button type="button" class="cn-round cn-yes" data-deck="yes" aria-label="' + esc(T('tempting')) + '">♥</button></div>' +
      '<p class="muted" style="text-align:center;font-size:12px;margin:6px 0 0"><span class="num">' + (deck.i + 1) + ' / ' + list.length + '</span> · ← ' + esc(T('notTonight')) + ' · → ' + esc(T('tempting')) + '</p>' + likedHtml();
  };
  var likedHtml = function () {
    if (!CN.ui.liked.length) return '';
    return head('', tk('myPicks'), '<a class="more" href="planning.html">' + tk('planIt') + '</a>', ' <span class="num muted" style="font-size:13px">' + CN.ui.liked.length + '</span>') +
      '<div class="cn-liked">' + CN.ui.liked.map(function (id) { return card(byId[id], 'compact'); }).join('') + '</div>';
  };
  var bindDeck = function (el, redraw) {
    var decide = function (yes) {
      var list = CN.results(), r = list[deck.i]; if (!r) return;
      var c = el.querySelector('[data-deck-card]');
      if (yes && CN.ui.liked.indexOf(r.id) === -1) CN.ui.liked.push(r.id);
      var go = function () { deck.i++; redraw(); var d = el.querySelector('.cn-deck'); if (d) d.focus(); };
      if (c && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { c.classList.add(yes ? 'out-yes' : 'out-no'); setTimeout(go, 180); } else go();
    };
    el.querySelectorAll('[data-deck]').forEach(function (b) { b.addEventListener('click', function () { decide(b.dataset.deck === 'yes'); }); });
    var d = el.querySelector('.cn-deck');
    if (d) {
      d.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); decide(true); } if (e.key === 'ArrowLeft') { e.preventDefault(); decide(false); } });
      var c = d.querySelector('[data-deck-card]'), x0 = null;
      c.addEventListener('pointerdown', function (e) { x0 = e.clientX; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', function (e) { if (x0 === null) return; var dx = e.clientX - x0; c.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 20 + 'deg)'; });
      c.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; c.style.transform = ''; if (Math.abs(dx) > 90) decide(dx > 0); });
    }
    var rs = el.querySelector('[data-deck-restart]'); if (rs) rs.addEventListener('click', function () { deck.i = 0; redraw(); });
  };

  /* --- Explorateur de recettes : bascule Étals (R1) / Mosaïque (R2) / Ce soir (R3) --- */
  CN.define('recipe-views', {
    title: 'Explorateur de recettes (R1 · R2 · R3)', desc: 'Trois façons de parcourir LE MÊME résultat filtré : étals thématiques, mosaïque éditoriale, une recette à la fois. Le choix est mémorisé pour la session.',
    props: [['view', 'shelves | mosaic | deck', 'shelves', 'vue de départ'], ['shelves', 'liste d’id d’étals', 'tous', 'étals affichés et leur ordre (CMS)']],
    usedIn: ['page Recettes', 'page Suggestions (vue « Ce soir »)'], example: { view: 'shelves', shelves: ['frigo', 'rapide'] }, reactive: true, i18nRender: true,
    render: function (p, el) {
      if (!el._view) { var saved = null; try { saved = sessionStorage.getItem('cn-view'); } catch (e) { /* rien */ } el._view = saved || p.view || 'shelves'; }
      if (CN.ui.view !== el._view && CN.ui._forced) { el._view = CN.ui.view; }
      var v = CN.ui.view = el._view, n = CN.results().length;
      var tabs = ['shelves', 'mosaic', 'deck'].map(function (k) {
        var key = { shelves: 'viewShelves', mosaic: 'viewMosaic', deck: 'viewDeck' }[k];
        return '<button type="button" data-view-set="' + k + '" aria-pressed="' + (k === v) + '">' + tk(key) + '</button>';
      }).join('');
      var body;
      if (v === 'shelves') {
        var ids = p.shelves || D.SHELVES.map(function (s) { return s.id; });
        body = ids.map(function (id) { var s = D.SHELVES.filter(function (x) { return x.id === id; })[0]; return s ? shelfHtml(s) : ''; }).join('') || emptyHtml();
      } else if (v === 'mosaic') body = mosaicHtml(el._limit || 12);
      else body = deckHtml();
      return '<div class="cn-views-bar"><span class="seg cn-seg" role="group" aria-label="Affichage des recettes">' + tabs + '</span>' +
        '<span class="muted num" aria-live="polite" style="font-weight:700;font-size:14px">' + esc(n === 1 ? T('recipes1') : T('recipesN', { n: n })) + '</span></div>' + body;
    },
    mount: function (el, p, redraw) {
      el.querySelectorAll('[data-view-set]').forEach(function (b) {
        b.addEventListener('click', function () { el._view = CN.ui.view = b.dataset.viewSet; try { sessionStorage.setItem('cn-view', el._view); } catch (e) { /* rien */ } deck.i = 0; el._cnDraw(); });
      });
      bindShelfAll(el); bindReset(el);
      var more = el.querySelector('[data-more]'); if (more) more.addEventListener('click', function () { el._limit = (el._limit || 12) + 12; el._cnDraw(); });
      if (CN.ui.view === 'deck') bindDeck(el, el._cnDraw || redraw);
      CN.ui._forced = false;
    },
  });
  /* Un « Tout voir » d'étal force la vue mosaïque de l'explorateur. */
  var _set = CN.set; CN.set = function (patch) { if (CN.ui.view === 'mosaic') { CN.ui._forced = true; document.querySelectorAll('.cn-recipe-views').forEach(function (el) { el._view = 'mosaic'; }); } deck.i = 0; _set(patch); };

  /* --- Conteneur repliable : n'importe quel bloc dans un <details> (réutilisable par le CMS) --- */
  CN.define('panel', {
    title: 'Panneau repliable (conteneur)', i18nRender: true, desc: 'Enveloppe n’importe quel composant avec un titre ; replié par défaut sur mobile si demandé. Permet au CMS d’imbriquer des blocs sans nouveau code.',
    props: [['title', 'texte', '', 'titre du panneau'], ['c', 'nom de composant', '', 'composant enveloppé'], ['props', 'objet', '{}', 'props du composant enveloppé'], ['collapsedOnMobile', 'booléen', 'false', 'replié sous 768 px']],
    usedIn: ['page Recettes (F2)', 'fiche recette (substitutions)', 'tout emplacement CMS'], example: { title: 'Je veux utiliser…', c: 'ingredient-filter' },
    render: function (p) {
      var open = !(p.collapsedOnMobile && window.innerWidth < 768);
      return '<details class="card cn-panel"' + (open ? ' open' : '') + '><summary>' + (p.titleKey ? tk(p.titleKey) : esc(loc(p.title) || '')) + '</summary><div data-c="' + esc(p.c) + '" data-props="' + esc(JSON.stringify(p.props || {})) + '"></div></details>';
    },
  });

  /* --- Recherche --- */
  CN.define('search-box', {
    title: 'Champ de recherche', desc: 'Recherche plein texte (nom, nom arabe, ingrédients ; accents ignorés). Écrit dans l’état partagé des filtres.',
    props: [['placeholder', 'texte', 'Rechercher une recette (ojja, couscous…)', 'texte d’aide']],
    usedIn: ['page Recettes', 'en-tête (variante Éditorial)'], example: {},
    render: function (p) {
      return '<div class="search" style="max-width:none"><div class="box"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input type="search" value="' + esc(CN.filters.q) + '" data-i18n="searchRecipePh" data-i18n-attr="placeholder" placeholder="' + esc(p.placeholder || 'Rechercher une recette (ojja, couscous…)') + '" aria-label="Rechercher une recette" /></div></div>';
    },
    mount: function (el) { var i = el.querySelector('input'), tmr; i.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { CN.set({ q: i.value.trim() }); }, 180); }); },
  });

  /* --- F1 : la phrase à compléter --- */
  var SENT = {
    tpl: L4('Je veux {course} {time} pour {servings}, {fridge}, {price}.', 'Nheb {course} {time} l {servings}, {fridge}, {price}.', 'أريد {course} {time} لـ {servings}، {fridge}، {price}.', 'نحب {course} {time} لـ {servings}، {fridge}، {price}.'),
    course: { any: L4('n’importe quel plat', 'ay makla', 'أيّ طبق', 'أي ماكلة'), plat: L4('un plat', 'makla', 'طبقاً رئيسياً', 'ماكلة'), entree: L4('une entrée', 'entrée', 'مقبّلات', 'مقبّلات'), dessert: L4('un dessert', '7lou', 'حلوى', 'حلو') },
    time: { '': L4('sans limite de temps', 'bla wa9t', 'دون حدّ للوقت', 'بلا وقت'), '15': L4('express (≤ 15 min)', 'fissa3 (≤ 15 d)', 'سريعاً جداً (≤ 15 د)', 'فيسع (≤ 15 د)'), '30': L4('rapide (≤ 30 min)', 'sahla (≤ 30 d)', 'سريعاً (≤ 30 د)', 'ساهلة (≤ 30 د)'), '60': L4('en moins d’une heure', 'f a9al men sa3a', 'في أقل من ساعة', 'في أقل من ساعة') },
    servings: { '2': L4('2 personnes', '2 ness', 'شخصين', 'زوز ناس'), '4': L4('4 personnes', '4 ness', '4 أشخاص', '4 ناس'), '6': L4('6 personnes', '6 ness', '6 أشخاص', '6 ناس'), '8': L4('8 personnes', '8 ness', '8 أشخاص', '8 ناس') },
    fridge: { 'true': L4('avec ce que j’ai', 'b elli 3andi', 'بما لديّ', 'باللي عندي'), 'false': L4('même s’il faut acheter', '7atta kan nechri', 'حتى لو اشتريت', 'حتى كان نشري') },
    price: { '': L4('quel que soit le prix', 'bel soum elli ykoun', 'بأي سعر', 'بالسوم اللي يكون'), '2': L4('à moins de 2 DT par personne', 'a9al men 2 DT lel wa7ed', 'بأقل من 2 د.ت للشخص', 'أقل من 2 د.ت للواحد'), '3': L4('à moins de 3 DT par personne', 'a9al men 3 DT lel wa7ed', 'بأقل من 3 د.ت للشخص', 'أقل من 3 د.ت للواحد'), '5': L4('à moins de 5 DT par personne', 'a9al men 5 DT lel wa7ed', 'بأقل من 5 د.ت للشخص', 'أقل من 5 د.ت للواحد') },
  };
  var sentVal = function (k) { var f = CN.filters; return k === 'course' ? f.course : k === 'time' ? String(f.maxTime || '') : k === 'servings' ? String(f.servings) : k === 'fridge' ? String(f.fridge) : String(f.maxPrice || ''); };
  CN.define('filter-sentence', {
    title: 'Filtre en phrase (F1)', desc: 'Les filtres se lisent comme une phrase ; chaque mot souligné ouvre un petit choix. Une phrase modèle par langue (ordre des mots et RTL respectés). Le nombre de personnes adapte les quantités, il ne filtre pas.',
    props: [['compact', 'booléen', 'false', 'version sans cadre (dans une feuille)']],
    usedIn: ['page Recettes (en tête)', 'accueil (proposition)', 'feuille de filtres'], example: {}, reactive: true, i18nRender: true,
    render: function (p) {
      var tpl = pick(SENT.tpl);
      var body = esc(tpl).replace(/\{(\w+)\}/g, function (m, k) {
        var v = sentVal(k), lab = pick(SENT[k][v] || SENT[k][Object.keys(SENT[k])[0]]);
        return '<span class="cn-word-wrap"><button type="button" class="cn-word" data-word="' + k + '" aria-haspopup="listbox" aria-expanded="false">' + esc(lab) + '</button></span>';
      });
      return '<div class="cn-sentence' + (p.compact ? ' compact' : '') + '"><p>' + body + '</p></div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-word]').forEach(function (w) {
        w.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = el.querySelector('.cn-pop'); if (open) { open.remove(); el.querySelectorAll('[aria-expanded="true"]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); if (open._for === w) return; }
          var k = w.dataset.word, cur = sentVal(k);
          var pop = document.createElement('div'); pop.className = 'cn-pop'; pop.setAttribute('role', 'listbox'); pop._for = w;
          pop.innerHTML = Object.keys(SENT[k]).map(function (v) { return '<button type="button" role="option" aria-selected="' + (v === cur) + '" data-v="' + v + '">' + esc(pick(SENT[k][v])) + '</button>'; }).join('');
          w.parentNode.appendChild(pop); w.setAttribute('aria-expanded', 'true');
          pop.querySelector('[aria-selected="true"]').focus();
          pop.addEventListener('keydown', function (ev) {
            var opts = [].slice.call(pop.querySelectorAll('button')), i = opts.indexOf(document.activeElement);
            if (ev.key === 'ArrowDown') { ev.preventDefault(); opts[Math.min(i + 1, opts.length - 1)].focus(); }
            if (ev.key === 'ArrowUp') { ev.preventDefault(); opts[Math.max(i - 1, 0)].focus(); }
            if (ev.key === 'Escape') { pop.remove(); w.setAttribute('aria-expanded', 'false'); w.focus(); }
          });
          pop.querySelectorAll('[data-v]').forEach(function (o) {
            o.addEventListener('click', function () {
              var v = o.dataset.v, patch = {};
              if (k === 'course') patch.course = v; if (k === 'time') patch.maxTime = v ? +v : null; if (k === 'servings') patch.servings = +v;
              if (k === 'fridge') patch.fridge = v === 'true'; if (k === 'price') patch.maxPrice = v ? +v : null;
              CN.set(patch);
              var again = document.querySelector('.cn-filter-sentence [data-word="' + k + '"]'); if (again) again.focus();
            });
          });
        });
      });
      document.addEventListener('click', function () { var o = el.querySelector('.cn-pop'); if (o) { o.remove(); el.querySelectorAll('[aria-expanded="true"]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); } });
    },
  });

  /* --- F2 : « Je veux utiliser… » (inclure / exclure des ingrédients) --- */
  CN.define('ingredient-filter', {
    title: 'Filtre par ingrédients (F2)', desc: 'Inclure des ingrédients (proposés depuis le frigo d’abord) et en exclure. Chaque puce se retire d’un geste.',
    props: [['suggest', 'nombre', '6', 'ingrédients du frigo proposés']],
    usedIn: ['page Recettes', 'feuille de filtres', 'frigo (« que faire avec… »)'], example: {}, reactive: true,
    render: function (p) {
      var f = CN.filters, fridgeIds = Object.keys(D.FRIDGE).filter(available);
      var chip = function (id, kind) { return '<button type="button" class="chip cn-ing-on ' + kind + '" data-rm="' + kind + ':' + id + '" aria-label="' + esc(T('removeX', { x: ingName(id) })) + '">' + (kind === 'inc' ? '✓ ' : '✕ ') + esc(ingName(id)) + ' <span aria-hidden="true">×</span></button>'; };
      var sugg = fridgeIds.filter(function (id) { return f.include.indexOf(id) === -1; }).slice(0, p.suggest || 6)
        .map(function (id) { return '<button type="button" class="chip cn-ing-sugg" data-add="inc:' + id + '">' + esc((D.ING[id] || [])[1] || '') + ' ' + esc(ingName(id)) + '</button>'; }).join('');
      var opts = function (kind) {
        return '<select class="select cn-add" data-add-sel="' + kind + '" aria-label="' + esc(T(kind === 'inc' ? 'addIncl' : 'addExcl')) + '"><option value="">' + esc(T('addIng')) + '</option>' +
          Object.keys(D.ING).sort(function (a, b) { return ingName(a).localeCompare(ingName(b), 'fr'); }).map(function (id) { return '<option value="' + id + '">' + esc(ingName(id)) + '</option>'; }).join('') + '</select>';
      };
      return '<div class="cn-ingf"><div class="cn-ingf-row"><b>' + tk('withIng') + '</b><div class="chips">' + f.include.map(function (id) { return chip(id, 'inc'); }).join('') + opts('inc') + '</div></div>' +
        (sugg ? '<div class="cn-ingf-row"><span class="muted" style="font-size:12px;font-weight:700">' + esc(T('inYourFridge')) + '</span><div class="chips">' + sugg + '</div></div>' : '') +
        '<div class="cn-ingf-row"><b>' + tk('withoutIng') + '</b><div class="chips">' + f.exclude.map(function (id) { return chip(id, 'exc'); }).join('') + opts('exc') + '</div></div></div>';
    },
    mount: function (el) {
      var upd = function (kind, id, add) {
        var key = kind === 'inc' ? 'include' : 'exclude', arr = CN.filters[key].slice(), i = arr.indexOf(id);
        if (add && i === -1) arr.push(id); if (!add && i !== -1) arr.splice(i, 1);
        var patch = {}; patch[key] = arr;
        var other = kind === 'inc' ? 'exclude' : 'include'; if (add) { patch[other] = CN.filters[other].filter(function (x) { return x !== id; }); }
        CN.set(patch);
      };
      el.querySelectorAll('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { var s = b.dataset.rm.split(':'); upd(s[0], s[1], false); }); });
      el.querySelectorAll('[data-add]').forEach(function (b) { b.addEventListener('click', function () { var s = b.dataset.add.split(':'); upd(s[0], s[1], true); }); });
      el.querySelectorAll('[data-add-sel]').forEach(function (s) { s.addEventListener('change', function () { if (s.value) upd(s.dataset.addSel, s.value, true); }); });
    },
  });

  /* --- F3 : puces rapides (avec nombre de résultats) + feuille complète --- */
  var QUICK = [
    ['withMine', { fridge: true }, function (f) { return f.fridge; }],
    ['quick30', { maxTime: 30 }, function (f) { return f.maxTime === 30; }],
    ['cheap3', { maxPrice: 3 }, function (f) { return f.maxPrice === 3; }],
    ['veggie', { veg: true }, function (f) { return f.veg; }],
    ['friday', { tag: 'vendredi' }, function (f) { return f.tag === 'vendredi'; }],
  ];
  var OFF = { fridge: false, maxTime: null, maxPrice: null, veg: false, tag: null };
  CN.define('quick-filters', {
    title: 'Puces de filtres rapides (F3)', desc: 'Les filtres fréquents, chacun avec le nombre de recettes qu’il donnerait ; « Filtres » ouvre la feuille complète (mobile : en bas ; desktop : centrée). Collant en haut de page.',
    props: [['sticky', 'booléen', 'true', 'reste visible au défilement']],
    usedIn: ['page Recettes', 'Suggestions', 'Favoris'], example: { sticky: false }, reactive: true, i18nRender: true,
    render: function (p) {
      var chips = QUICK.map(function (q, i) {
        var on = q[2](CN.filters), patch = {}; Object.keys(q[1]).forEach(function (k) { patch[k] = on ? OFF[k] : q[1][k]; });
        var n = CN.results(null, patch).length;
        return '<button type="button" class="chip" data-quick="' + i + '" aria-pressed="' + on + '">' + tk(q[0]) + ' <span class="num cn-n">' + n + '</span></button>';
      }).join('');
      var k = CN.activeCount();
      return '<div class="cn-quick' + (p.sticky === false ? '' : ' sticky') + '">' + rail('filtres rapides', '<button type="button" class="chip cn-open-sheet" aria-haspopup="dialog">⚙ ' + tk('filters') + (k ? ' <span class="cn-k num">' + k + '</span>' : '') + '</button>' + chips) + '</div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-quick]').forEach(function (b) {
        b.addEventListener('click', function () { var q = QUICK[+b.dataset.quick], on = q[2](CN.filters), patch = {}; Object.keys(q[1]).forEach(function (k) { patch[k] = on ? OFF[k] : q[1][k]; }); CN.set(patch); });
      });
      el.querySelector('.cn-open-sheet').addEventListener('click', function (e) { openSheet(e.currentTarget); });
    },
  });
  var openSheet = function (opener) {
    var ov = document.createElement('div'); ov.className = 'sheet-overlay';
    ov.innerHTML = '<div class="sheet cn-sheet" role="dialog" aria-modal="true" aria-labelledby="cn-sheet-t"><div class="grab" aria-hidden="true"></div>' +
      '<div class="row" style="justify-content:space-between"><h2 id="cn-sheet-t" style="margin:0">' + esc(T('filters')) + '</h2><button type="button" class="icon-btn" data-close aria-label="' + esc(T('close')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div data-c="filter-sentence" data-props=\'{"compact":true}\'></div>' +
      '<h3>' + esc(T('categories')) + '</h3><div data-c="category-rail" data-props=\'{"mode":"filter","title":""}\'></div>' +
      '<h3>' + esc(T('ingredientsWord')) + '</h3><div data-c="ingredient-filter"></div>' +
      '<div class="cn-sheet-foot"><button type="button" class="btn btn-ghost" data-reset-sheet>' + esc(T('resetAll')) + '</button><button type="button" class="btn btn-primary" data-close data-see></button></div></div>';
    document.body.appendChild(ov);
    CN.mountAll(ov); if (window.D4) window.D4.refresh(ov);
    var see = ov.querySelector('[data-see]'), upd = function () { see.textContent = T('seeNRecipes', { n: CN.results().length }); };
    upd(); CN.on(upd);
    var close = function () { ov.remove(); var i = listeners.indexOf(upd); if (i !== -1) listeners.splice(i, 1); ['filter-sentence', 'category-rail', 'ingredient-filter'].forEach(function () {}); if (opener) { var o = document.querySelector('.cn-open-sheet'); if (o) o.focus(); } };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    ov.querySelector('[data-reset-sheet]').addEventListener('click', function () { CN.reset(); });
    document.addEventListener('keydown', function esc2(e) { if (e.key === 'Escape' && document.body.contains(ov)) { close(); document.removeEventListener('keydown', esc2); } });
    ov.querySelector('[data-close]').focus();
  };
  CN.openFilterSheet = openSheet;

  /* --- Résumé des filtres actifs (puces retirables) --- */
  CN.define('active-filters', {
    title: 'Filtres actifs', desc: 'Rappelle chaque filtre actif sous forme de puce retirable + « Tout effacer ». Rien si aucun filtre.',
    props: [], usedIn: ['page Recettes'], example: {}, reactive: true,
    render: function () {
      var f = CN.filters, out = [];
      if (f.q) out.push(['q', '« ' + esc(f.q) + ' »']);
      if (f.course !== 'any') out.push(['course', esc(pick(SENT.course[f.course]))]);
      if (f.maxTime) out.push(['maxTime', '≤ ' + f.maxTime + ' min']);
      if (f.maxPrice) out.push(['maxPrice', '≤ ' + f.maxPrice + ' DT']);
      if (f.fridge) out.push(['fridge', esc(T('withMine'))]);
      if (f.veg) out.push(['veg', esc(T('veggie'))]);
      if (f.tag) out.push(['tag', esc(T({ vendredi: 'tagFriday', ramadan: 'tagRamadan' }[f.tag] || f.tag))]);
      f.cats.forEach(function (c) { var cat = D.CATS.filter(function (x) { return x.id === c; })[0]; out.push(['cat:' + c, esc(cat ? catName(cat) : c)]); });
      f.include.forEach(function (i) { out.push(['inc:' + i, '✓ ' + esc(ingName(i))]); });
      f.exclude.forEach(function (i) { out.push(['exc:' + i, '✕ ' + esc(ingName(i))]); });
      if (!out.length) return '';
      return '<div class="chips cn-active">' + out.map(function (o) { return '<button type="button" class="chip cn-ing-on" data-off="' + o[0] + '">' + o[1] + ' <span aria-hidden="true">×</span><span class="sr-only"> (' + esc(T('remove')) + ')</span></button>'; }).join('') +
        '<button type="button" class="btn btn-ghost btn-sm" data-reset>' + tk('resetAll') + '</button></div>';
    },
    mount: function (el) {
      bindReset(el);
      el.querySelectorAll('[data-off]').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.off, p = {};
          if (k.indexOf(':') !== -1) { var s = k.split(':'), key = { cat: 'cats', inc: 'include', exc: 'exclude' }[s[0]]; p[key] = CN.filters[key].filter(function (x) { return x !== s[1]; }); }
          else p[k] = k === 'course' ? 'any' : k === 'q' ? '' : FILTER0[k];
          CN.set(p);
        });
      });
    },
  });

  /* ================================================================
     PLANNING (P1 bande des jours + P3 options)
     ================================================================ */
  var PRICE = D.PRICE;
  var plan = CN.plan = { ramadan: false, meals: JSON.parse(JSON.stringify(D.PLAN.meals)), notes: { 4: 'Toute la famille' } };
  var planListeners = [];
  var planChanged = function () { planListeners.forEach(function (fn) { fn(); }); };
  CN.onPlan = function (fn) { planListeners.push(fn); };
  var slotLabels = function () { return plan.ramadan ? ['slotIftar', 'slotShour'] : ['slotLunch', 'slotDinner']; };
  var mealAt = function (d, s) { return plan.meals.filter(function (m) { return m.day === d && m.slot === s; })[0]; };
  var summary = function () {
    var items = {}, meals = plan.meals.filter(function (m) { return !m.leftover; });
    meals.forEach(function (m) { match(byId[m.recipe]).missing.forEach(function (id) { items[id] = true; }); });
    var ids = Object.keys(items), lo = 0, hi = 0;
    ids.forEach(function (id) { var p = PRICE[id] || [1, 1.5]; lo += p[0]; hi += p[1]; });
    return { meals: plan.meals.length, items: ids.length, ids: ids, lo: lo, hi: hi };
  };
  CN.planSummary = summary;
  var mealHtml = function (m) {
    var r = byId[m.recipe], mm = match(r), miss = m.leftover ? 0 : mm.missing.length;
    return '<div class="cn-meal" draggable="true" data-meal="' + m.day + ':' + m.slot + '">' +
      '<span class="cn-meal-ph ph" data-fallback="' + r.fallback + '"><img src="' + r.photo + '" alt="" width="56" height="56" loading="lazy" /></span>' +
      '<span class="grow"><a href="recette.html" class="cn-meal-t">' + (m.leftover ? '<span class="flag" style="margin-inline-end:4px">' + esc(T('leftovers')) + '</span>' : '') + esc(rName(r)) + '</a>' +
      '<span class="reason">' + esc(m.leftover ? T('nothingToBuy') : miss ? '🛒 ' + T('nToBuy', { n: miss }) : '✓ ' + T('allHere')) + '</span>' +
      (m.leftover ? '' : '<span class="servings cn-serv"><button type="button" data-serv="-1" aria-label="' + esc(T('lessPortion')) + '">−</button><b class="num">' + m.servings + '</b><button type="button" data-serv="1" aria-label="' + esc(T('morePortion')) + '">+</button></span>') + '</span>' +
      '<details class="cn-meal-menu"><summary class="icon-btn" aria-label="' + esc(T('mealActions')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg></summary><div class="dropdown-menu">' +
      (m.leftover ? '' : '<button type="button" class="menu-item" data-act="double">' + esc(T('cookDouble')) + '</button>') +
      '<label class="menu-item" style="gap:6px">' + esc(T('move')) + ' <select class="select" data-act="move" style="min-height:44px;padding:2px 6px;width:auto"><option value="">…</option>' +
      D.PLAN.days.map(function (dk, d) { return [0, 1].map(function (s) { return '<option value="' + d + ':' + s + '">' + esc(window.D4 ? window.D4.t(dk) : dk) + ' · ' + esc(T(slotLabels()[s])) + '</option>'; }).join(''); }).join('') + '</select></label>' +
      '<button type="button" class="menu-item danger" data-act="remove">' + esc(T('remove')) + '</button></div></details></div>';
  };
  CN.define('week-strip', {
    title: 'Semaine en bande de jours (P1)', desc: 'Les 7 jours en carrousel, aujourd’hui repéré et amené à l’écran ; deux créneaux par jour (Midi / Soir, ou Iftar / Shour en mode Ramadan) ; portions, restes, déplacement (glisser-déposer sur desktop, menu « Déplacer » partout), note du jour ; un créneau vide propose des idées du frigo.',
    props: [['startToday', 'booléen', 'true', 'faire défiler jusqu’à aujourd’hui']],
    usedIn: ['Menu de la semaine', 'accueil (aperçu de la semaine — proposition)'], example: {}, i18nRender: true,
    render: function () {
      var labels = slotLabels();
      var days = D.PLAN.days.map(function (dk, d) {
        var slots = [0, 1].map(function (s) {
          var m = mealAt(d, s);
          return '<div class="cn-slot" data-slot="' + d + ':' + s + '"><span class="cn-slot-l">' + tk(labels[s]) + '</span>' +
            (m ? mealHtml(m) : '<button type="button" class="cn-add-slot" data-add-slot="' + d + ':' + s + '">+ ' + esc(T('add')) + '</button>') + '</div>';
        }).join('');
        return '<article class="cn-day' + (d === D.PLAN.today ? ' is-today' : '') + '" aria-label="' + esc(window.D4 ? window.D4.t(dk) : dk) + '">' +
          '<header><b data-i18n="' + dk + '"></b>' + (d === D.PLAN.today ? '<span class="flag fav" style="margin-inline-start:auto">' + esc(T('today')) + '</span>' : '') + '</header>' + slots +
          '<input class="cn-note" data-note="' + d + '" value="' + esc(plan.notes[d] || '') + '" placeholder="' + esc(T('notePh')) + '" aria-label="' + esc(T('notePh')) + '" /></article>';
      }).join('');
      return rail('jours de la semaine', days);
    },
    mount: function (el) {
      var redraw = function () { el._cnDraw(); };
      el.querySelectorAll('[data-serv]').forEach(function (b) { b.addEventListener('click', function () {
        var k = b.closest('[data-meal]').dataset.meal.split(':'), m = mealAt(+k[0], +k[1]); m.servings = Math.max(1, m.servings + +b.dataset.serv); planChanged(); redraw(); }); });
      el.querySelectorAll('[data-act]').forEach(function (b) {
        var k = b.closest('[data-meal]').dataset.meal.split(':'), m = mealAt(+k[0], +k[1]);
        var ev = b.tagName === 'SELECT' ? 'change' : 'click';
        b.addEventListener(ev, function () {
          var act = b.dataset.act;
          if (act === 'remove') { var i = plan.meals.indexOf(m); plan.meals.splice(i, 1); planChanged(); redraw(); window.D4.snack(T('removedFromPlan', { x: rName(byId[m.recipe]) }), function () { plan.meals.splice(i, 0, m); planChanged(); redraw(); }); }
          if (act === 'double') {
            var nd = m.slot === 1 ? m.day + 1 : m.day, ns = m.slot === 1 ? 0 : 1;
            if (nd > 6) { window.D4.snack(T('noNextDay')); return; }
            if (mealAt(nd, ns)) { window.D4.snack(T('nextSlotTaken')); return; }
            m.servings *= 2; plan.meals.push({ day: nd, slot: ns, recipe: m.recipe, servings: m.servings / 2, leftover: true }); planChanged(); redraw();
          }
          if (act === 'move' && b.value) { var t = b.value.split(':'), other = mealAt(+t[0], +t[1]); if (other) { other.day = m.day; other.slot = m.slot; } m.day = +t[0]; m.slot = +t[1]; planChanged(); redraw(); }
        });
      });
      /* Glisser-déposer (desktop, souris) — le menu « Déplacer » reste l'alternative clavier / tactile. */
      el.querySelectorAll('[data-meal]').forEach(function (n) { n.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', n.dataset.meal); n.classList.add('dragging'); }); });
      el.querySelectorAll('[data-slot]').forEach(function (s) {
        s.addEventListener('dragover', function (e) { e.preventDefault(); s.classList.add('drop'); });
        s.addEventListener('dragleave', function () { s.classList.remove('drop'); });
        s.addEventListener('drop', function (e) {
          e.preventDefault(); var from = e.dataTransfer.getData('text/plain').split(':'), to = s.dataset.slot.split(':');
          var m = mealAt(+from[0], +from[1]), other = mealAt(+to[0], +to[1]); if (!m) return;
          if (other) { other.day = m.day; other.slot = m.slot; } m.day = +to[0]; m.slot = +to[1]; planChanged(); redraw();
        });
      });
      el.querySelectorAll('[data-add-slot]').forEach(function (b) { b.addEventListener('click', function () { openAddSheet(b.dataset.addSlot.split(':').map(Number), b, redraw); }); });
      el.querySelectorAll('[data-note]').forEach(function (i) { i.addEventListener('change', function () { plan.notes[i.dataset.note] = i.value; }); });
      if (!el._scrolled) { el._scrolled = true; var t = el.querySelector('.is-today'); if (t && t.scrollIntoView) setTimeout(function () { var tr = el.querySelector('.rail-track'); if (tr) tr.scrollLeft = 0; }, 0); }
    },
  });
  var openAddSheet = function (ds, opener, redraw) {
    var ideas = D.RECIPES.filter(function (r) { var m = match(r); return plan.ramadan ? r.tags.indexOf('ramadan') !== -1 : m.level !== 'discover'; }).slice(0, 4);
    var ov = document.createElement('div'); ov.className = 'sheet-overlay';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(T('ideasFridge')) + '"><div class="grab" aria-hidden="true"></div><h2 style="margin-top:0">' + esc(plan.ramadan ? T('shelfRamadan') : T('ideasFridge')) + '</h2>' +
      '<div class="cn-liked">' + ideas.map(function (r) { return '<button type="button" class="cn-pick" data-pick="' + r.id + '">' + card(r, 'compact').replace(/^<a [^>]*>/, '').replace(/<\/a>$/, '') + '</button>'; }).join('') + '</div>' +
      '<a class="btn btn-ghost btn-block" href="recherche.html" style="margin-top:12px">' + esc(T('searchAll')) + '</a></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); if (opener && document.body.contains(opener)) opener.focus(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    ov.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { plan.meals.push({ day: ds[0], slot: ds[1], recipe: b.dataset.pick, servings: 4 }); ov.remove(); planChanged(); redraw(); }); });
    ov.querySelector('[data-pick]').focus();
  };
  CN.define('plan-tools', {
    title: 'Options du planning (P3)', desc: 'Mode Ramadan (Iftar / Shour, idées de saison), copier la semaine précédente, partager le menu sur WhatsApp (lien de partage, rien n’est envoyé sans l’utilisateur).',
    props: [], usedIn: ['Menu de la semaine'], example: {}, i18nRender: true,
    render: function () {
      var s = summary(), text = T('waHeader') + ' — Chnawa Ntayeb\n' + D.PLAN.days.map(function (dk, d) {
        var ms = [0, 1].map(function (sl) { var m = mealAt(d, sl); return m ? T(slotLabels()[sl]) + ' : ' + rName(byId[m.recipe]) : null; }).filter(Boolean);
        return ms.length ? (window.D4 ? window.D4.t(dk) : dk) + ' — ' + ms.join(', ') : null;
      }).filter(Boolean).join('\n') + '\n' + T('waGroceries', { i: s.items, c: money(s.lo) + ' – ' + money(s.hi) + ' DT' });
      return '<div class="cn-tools"><label class="row" style="gap:8px;font-weight:700"><span class="switch"><input type="checkbox" data-ramadan ' + (plan.ramadan ? 'checked' : '') + ' aria-label="' + esc(T('ramadanMode')) + '" /><span class="track"></span></span>🌙 ' + tk('ramadanMode') + '</label>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-copy>' + tk('copyWeek') + '</button>' +
        '<a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text) + '">' + tk('shareWa') + '</a></div>';
    },
    mount: function (el) {
      el.querySelector('[data-ramadan]').addEventListener('change', function (e) { plan.ramadan = e.target.checked; planChanged(); document.querySelectorAll('.cn-week-strip').forEach(function (w) { w._cnDraw(); }); el._cnDraw(); });
      el.querySelector('[data-copy]').addEventListener('click', function () {
        var before = JSON.parse(JSON.stringify(plan.meals));
        plan.meals = [{ day: 0, slot: 1, recipe: 'chorba', servings: 4 }, { day: 1, slot: 1, recipe: 'chakchouka', servings: 4 }, { day: 3, slot: 0, recipe: 'marqa', servings: 4 }, { day: 4, slot: 0, recipe: 'kosksi', servings: 6 }, { day: 6, slot: 1, recipe: 'brik', servings: 4 }];
        planChanged(); document.querySelectorAll('.cn-week-strip').forEach(function (w) { w._cnDraw(); });
        window.D4.snack(T('weekCopied'), function () { plan.meals = before; planChanged(); document.querySelectorAll('.cn-week-strip').forEach(function (w) { w._cnDraw(); }); });
      });
      if (!el._planBound) { el._planBound = true; CN.onPlan(function () { el._cnDraw && el._cnDraw(); }); }
    },
  });
  CN.define('plan-summary', {
    title: 'Résumé de la semaine', desc: 'Repas prévus, articles à acheter (sans doublon, restes exclus), coût en fourchette, création de la liste. Barre collante en bas sur mobile.',
    props: [], usedIn: ['Menu de la semaine', 'accueil (état planning)'], example: {},
    render: function () {
      var s = summary();
      return '<div class="cn-plan-sum"><b class="num">' + esc(T('planSummary', { m: s.meals, i: s.items, c: money(s.lo) + ' – ' + money(s.hi) + ' DT' })) + '</b>' +
        '<a class="btn btn-primary" href="courses.html">' + tk('makeList') + '</a></div>';
    },
    mount: function (el) { if (!el._planBound) { el._planBound = true; CN.onPlan(function () { el._cnDraw && el._cnDraw(); }); } },
  });

  /* Texte de prop : chaîne ou champ par langue { fr, derja, ar, derja_ar } (convention <champ>_<langue>). */
  var loc = function (v) { return v && typeof v === 'object' ? pick(v) : v; };
  CN.h = { esc: esc, T: T, tk: tk, card: card, rail: rail, head: head, money: money, pick: pick, L4: L4, ingName: ingName, rName: rName, catName: catName, loc: loc,
    reasonHtml: reasonHtml, available: available, lang: lang, emptyHtml: emptyHtml };

  /* ---------- Démarrage : schéma de page puis blocs ---------- */
  document.addEventListener('DOMContentLoaded', function () { CN.renderPage(); CN.mountAll(); CN.bindDemo(); CN.applyShow(); });
})();
