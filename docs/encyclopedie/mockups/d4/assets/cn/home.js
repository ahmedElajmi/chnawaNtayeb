/* Chnawa Ntayeb — composants CMS (v4.5) · famille ACCUEIL. L'état d'accueil (nouveau, frigo vide, rempli, favoris,
   planning, courses) vient de html[data-home-state] (données de session en réel) ; aucun calcul lourd à l'ouverture. */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data, T = CN.T;
  var state = function () { return document.documentElement.getAttribute('data-home-state') || 'filled'; };
  var heroPhoto = function (src, alt) { return '<div class="ph" data-fallback="🍽️"><img src="' + src + '" alt="' + esc(alt) + '" width="1024" height="576" loading="eager" fetchpriority="high" /></div>'; };

  CN.define('home-greeting', {
    title: 'Salutation', desc: 'Phrase d’accueil selon le moment de la journée (traduite).', props: [], usedIn: ['accueil'], example: {},
    render: function () { return '<div class="home-greet"><h1 data-i18n="greetEvening"></h1></div>'; },
  });

  CN.define('home-hero', {
    title: 'Héros d’accueil (selon la situation)', desc: 'Nouveau : promesse + 3 étapes. Frigo vide : invitation. Frigo rempli : UNE idée pour ce soir (première recette prête, sinon presque prête) avec sa raison. Planning : le repas prévu remplace l’idée. Photo dominante.',
    props: [], usedIn: ['accueil'], example: {}, demoRender: true, i18nRender: true,
    render: function () {
      var st = state();
      if (st === 'new') {
        var k = D.RECIPES.filter(function (r) { return r.id === 'kosksi'; })[0];
        return '<section class="hero-photo" aria-labelledby="hh-t">' + heroPhoto(k.photoLarge, 'Kosksi aux légumes') + '<div class="hp-body"><span class="hp-kicker">by chef Souhed</span><h1 class="hp-title" id="hh-t" data-i18n="greetNew"></h1><p class="hp-sub" data-i18n="newLead"></p></div></section>' +
          '<section class="card" style="margin-top:var(--sp-3)"><ol class="steps-mini" style="margin-top:0"><li data-i18n="newStep1"></li><li data-i18n="newStep2"></li><li data-i18n="newStep3"></li></ol>' +
          '<div class="row" style="margin-top:var(--sp-3)"><a class="btn btn-primary" style="flex:2" href="onboarding.html" data-i18n="startFridge"></a><a class="btn btn-secondary needs-net" style="flex:1" href="scan.html" data-i18n="orScan"></a></div>' +
          '<a class="more" href="recherche.html" style="display:inline-block;margin-top:var(--sp-2);font-weight:700" data-i18n="orBrowse"></a></section>';
      }
      if (st === 'empty') {
        return '<section class="card" style="padding:var(--sp-4)"><b style="font-size:17px" data-i18n="fridgeEmptyTitle"></b><p class="muted" style="margin:4px 0 var(--sp-3);font-size:14px" data-i18n="fridgeEmptyLead"></p>' +
          '<div class="row"><a class="btn btn-primary" style="flex:2" href="frigo.html" data-i18n="heroEmptyCta"></a><a class="btn btn-secondary needs-net" style="flex:1" href="scan.html" data-i18n="orScan"></a></div></section>';
      }
      if (st === 'planning') {
        var pm = D.PLAN.meals.filter(function (m) { return m.day === D.PLAN.today; }).sort(function (a, b) { return b.slot - a.slot; })[0], r = CN.byId[pm.recipe], m = CN.match(r);
        return '<section class="hero-photo" aria-labelledby="hh-t">' + heroPhoto(r.photoLarge, r.name) + '<div class="hp-body"><span class="hp-kicker" data-i18n="plannedTonight"></span><h2 class="hp-title" id="hh-t">' + esc(h.rName(r)) + '</h2>' +
          '<p class="hp-sub"><span class="num">' + m.have + ' / ' + m.total + '</span> · ' + h.reasonHtml(r, m) + '</p><div class="hp-actions"><a class="btn btn-primary" href="courses.html" data-i18n="plannedBuyN" data-i18n-n="' + m.missing.length + '">' + esc(CN.T('plannedBuyN', { n: m.missing.length })) + '</a><a class="btn btn-secondary btn-on-photo" href="recette.html?id=' + r.id + '" data-i18n="seeRecipe"></a></div></div></section>';
      }
      var all = CN.results(null, { q: '', course: 'any', maxTime: null, fridge: false, maxPrice: null, veg: false, tag: null, cats: [], include: [], exclude: [] });
      var pick = all.filter(function (r) { return CN.match(r).level === 'ready'; })[0] || all[0];
      var idea = all.filter(function (r) { return CN.match(r).level !== 'discover'; }).length;
      return '<section class="hero-photo" aria-labelledby="hh-t">' + heroPhoto(pick.photoLarge, pick.name) + '<div class="hp-body"><span class="hp-kicker" data-i18n="tonightPick"></span><h2 class="hp-title" id="hh-t">' + esc(h.rName(pick)) + '</h2>' +
        '<p class="hp-sub">' + h.reasonHtml(pick, CN.match(pick)) + ' · <span class="num">' + pick.time + ' min</span></p><div class="hp-actions"><a class="btn btn-primary" href="recette.html?id=' + pick.id + '" data-i18n="seeRecipe"></a>' +
        '<a class="btn btn-secondary btn-on-photo" href="suggestions.html" data-i18n="ideasN" data-i18n-n="' + all.length + '"></a></div></div></section>' +
        '<p class="anno" style="margin-top:6px">Idée du soir = première recette « prête » (sinon « presque ») du moteur ; ' + idea + ' idées réalisables, ' + all.length + ' au total.</p>';
    },
  });

  CN.define('fridge-peek', {
    title: 'Le frigo d’un coup d’œil', desc: 'Pastilles des ingrédients disponibles (sans quantité en pointillé) + ajouter / photo. Variante « recap » avec « Modifier » (suggestions).',
    props: [['variant', 'home | recap', 'home', 'actions affichées']], usedIn: ['accueil', 'suggestions'], example: { variant: 'recap' }, i18nRender: true,
    render: function (p) {
      var ids = Object.keys(D.FRIDGE).filter(h.available);
      var pills = ids.map(function (id) { return '<span class="pill' + (D.FRIDGE[id] === null ? ' unknown' : '') + '">' + esc(h.ingName(id)) + (D.FRIDGE[id] === null ? ' ?' : '') + '</span>'; }).join('');
      var actions = p.variant === 'recap' ? '<a class="btn btn-secondary btn-sm" href="frigo.html" data-i18n="edit"></a>' :
        '<a class="btn btn-secondary btn-sm" href="frigo.html" aria-label="' + esc(T('addToFridge')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></a><a class="btn btn-secondary btn-sm needs-net" href="scan.html" aria-label="' + esc(T('addByPhoto')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></a>';
      return '<section class="card fridge-peek" style="margin-top:var(--sp-3);padding:var(--sp-3)" aria-label="' + esc(T('fridgeNow')) + '"><div class="grow" style="min-width:0">' +
        (p.variant === 'recap' ? '<b>' + esc(T('fromYourN', { n: ids.length })) + '</b>' : '<span class="muted" style="font-size:11px;font-weight:800;text-transform:uppercase"><span data-i18n="fridgeNow"></span> · <span class="num">' + ids.length + '</span></span>') +
        '<div class="pills" style="margin-top:6px">' + pills + '</div></div>' + actions + '</section>';
    },
  });

  CN.define('grocery-progress', {
    title: 'Courses en cours (reprendre)', desc: 'Progression de la liste active ; mène à la liste.', props: [], usedIn: ['accueil (état courses)'], example: {}, i18nRender: true,
    render: function () {
      var l = D.GROCERY.filter(function (x) { return x.active; })[0]; if (!l || !l.items.length) return '';
      var done = l.items.filter(function (i) { return i.done; }).length;
      return '<a class="card continue-card" href="courses.html" style="margin-top:var(--sp-3)"><span class="qa-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1.5 12h-11zM8 8V6a4 4 0 0 1 8 0v2"/></svg></span>' +
        '<span class="grow"><span class="muted" style="font-size:11px;font-weight:800;text-transform:uppercase" data-i18n="groceryInProgress"></span><br /><b>' + esc(l.name) + ' · <span class="num">' + esc(T('boughtShort', { d: done, n: l.items.length })) + '</span></b>' +
        '<span class="buy-progress" style="display:block;margin-top:6px"><span style="display:block;height:100%;width:' + Math.round(done / l.items.length * 100) + '%;background:var(--brand)"></span></span></span>' +
        '<svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>';
    },
  });

  CN.define('favorites-strip', {
    title: 'Favoris (carrousel compact)', desc: 'Les recettes favorites en cartes horizontales, avec leur score du jour.', props: [], usedIn: ['accueil (état favoris)'], example: {}, i18nRender: true,
    render: function () {
      var cards = D.FAVS.map(function (id) { var r = CN.byId[id], m = CN.match(r);
        return '<a class="rcard horizontal" href="recette.html?id=' + r.id + '"><div class="ph" data-fallback="' + r.fallback + '"><img src="' + r.photo + '" alt="" width="88" height="88" loading="lazy" /></div><div class="rbody"><span class="rtitle">' + esc(h.rName(r)) + '</span><span class="reason"><span class="num">' + m.have + ' / ' + m.total + '</span></span></div></a>'; }).join('');
      return h.head(tk('favAgain'), tk('yourFavs'), '<a class="more" href="favoris.html">' + tk('seeAll') + '</a>') + '<div class="rail" data-rail="favoris"><div class="rail-track fav-strip" tabindex="0" role="region" aria-label="' + esc(T('favAgain')) + '">' + cards + '</div></div>';
    },
  });

  CN.define('warm-band', {
    title: 'Bande chaleureuse (conteneur)', desc: 'Fond « miel » qui regroupe plusieurs blocs (ex. la découverte culinaire).',
    props: [['blocks', 'liste de blocs { c, props }', '[]', 'contenu']], usedIn: ['accueil'], example: { blocks: [{ c: 'category-rail', props: { limit: 6 } }] },
    render: function (p) { return '<section class="warm-band">' + (p.blocks || []).map(function (b) { return '<div data-c="' + esc(b.c) + '" data-props="' + esc(JSON.stringify(b.props || {})) + '"></div>'; }).join('') + '</section>'; },
  });
})();
