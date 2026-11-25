/* Chnawa Ntayeb — composants CMS (v4.5) · famille COMMUNE : titres, onglets, notes, bandeaux, conteneurs.
   Chaque composant : défini une fois, placé par { c, props } ; aucune donnée en dur (data.js). */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data;
  /* Texte de note : **gras** autorisé, tout le reste échappé (pas d'injection HTML depuis le CMS). */
  var md = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); };
  CN.h.md = md;
  var label = function (p, k, t) { return p[k] ? tk(p[k]) : esc(h.loc(p[t]) || ''); };
  var T = CN.T;

  CN.define('page-heading', {
    title: 'Titre de page', desc: 'Titre (clé de traduction ou texte) et phrase d’introduction facultative.',
    props: [['titleKey', 'clé i18n', '', 'titre traduit'], ['title', 'texte', '', 'titre libre'], ['lead', 'texte', '', 'introduction']],
    usedIn: ['toutes les pages'], example: { title: 'Menu de la semaine', lead: 'Semaine du 3 au 9 mars' }, i18nRender: true,
    render: function (p) { return '<h1 class="page-title">' + label(p, 'titleKey', 'title') + '</h1>' + (p.lead ? '<p class="page-lead">' + md(h.loc(p.lead)) + '</p>' : ''); },
  });
  /* v4.6 : des liens vers d'autres pages ne sont PAS des onglets ARIA : navigation classique + aria-current="page".
     Le modèle tablist / tab est réservé au composant « tabs » (contenu changé sur la même page). */
  CN.define('link-tabs', {
    title: 'Navigation entre pages sœurs', desc: 'Liens présentés comme des onglets (Toutes / Mes suggestions / Favoris) ; sémantique de navigation : <nav>, liens, aria-current="page" sur la page active, focus visible.',
    props: [['tabs', 'liste {labelKey, href}', '[]', 'liens'], ['current', 'href', '', 'page active'], ['labelKey', 'clé i18n', 'navRecipes', 'nom de la navigation (lecteurs d’écran)']],
    usedIn: ['Recettes', 'Suggestions', 'Favoris'], example: { tabs: [{ labelKey: 'recipesAllTab', href: 'recherche.html' }, { labelKey: 'recipesSuggestionsTab', href: 'suggestions.html' }, { labelKey: 'favTitle', href: 'favoris.html' }], current: 'favoris.html' }, i18nRender: true,
    render: function (p) {
      return '<nav class="tabs link-tabs" aria-label="' + esc(CN.T(p.labelKey || 'navRecipes')) + '">' + (p.tabs || []).map(function (t) {
        return '<a class="tab" href="' + esc(t.href) + '"' + (t.href === p.current ? ' aria-current="page"' : '') + '>' + tk(t.labelKey) + '</a>';
      }).join('') + '</nav>';
    },
  });
  CN.define('note', {
    title: 'Note de conception', desc: 'Annotation de maquette (masquable par « Notes ») : jamais un texte du produit. Le CMS ne la publie pas.',
    props: [['text', 'texte (**gras**)', '', 'contenu']], usedIn: ['toutes les maquettes'], example: { text: '**Exemple** de note.' },
    render: function (p) { return '<p class="anno">' + md(p.text || '') + '</p>'; },
  });
  CN.define('offline-strip', {
    title: 'Bandeau hors ligne', desc: 'Visible seulement hors ligne : les données restent sur l’appareil et se synchronisent au retour du réseau.',
    props: [], usedIn: ['toutes les pages de données'], example: {},
    render: function () { return '<div class="offline-strip" role="status"><span aria-hidden="true">⚡</span><span data-i18n="netOffline"></span></div>'; },
  });
  CN.define('install-banner', {
    title: 'Bandeau d’installation', desc: 'Proposé sous l’en-tête (convention InstallBanner), fermable ; absent si l’application est installée.',
    props: [], usedIn: ['accueil'], example: {}, i18nRender: true,
    render: function () {
      return '<div class="banner banner-install"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg><span style="flex:1">' + tk('installLead') + '</span>' +
        '<button type="button" class="btn btn-secondary">' + tk('install') + '</button><button type="button" class="icon-btn" data-close aria-label="' + esc(T('close')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
    },
    mount: function (el) { el.querySelector('[data-close]').addEventListener('click', function () { el.remove(); }); },
  });
  CN.define('guest-card', {
    title: 'Invitation à se connecter', desc: 'Affichée aux seuls invités ; explique où sont gardées les données ; fermable si « dismissible ».',
    props: [['lead', 'texte', '', 'message'], ['compact', 'booléen', 'false', 'une ligne'], ['dismissible', 'booléen', 'false', 'bouton « plus tard »']],
    usedIn: ['accueil', 'profil', 'favoris'], example: { leadKey: 'guestLeadFavs' }, i18nRender: true,
    render: function (p) {
      var lead = p.leadKey ? esc(T(p.leadKey)) : md(h.loc(p.lead) || '');
      if (p.compact) return '<div class="card" data-auth-only="guest" style="margin-top:var(--sp-3);display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-3)"><span class="grow" style="font-size:14px">' + lead + '</span><a class="btn btn-secondary btn-sm" href="connexion.html#signup">' + tk('signup') + '</a>' +
        (p.dismissible ? '<button type="button" class="icon-btn" data-close aria-label="' + esc(T('later')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '') + '</div>';
      return '<section class="card" data-auth-only="guest" style="background:var(--tint,var(--surface));border-color:transparent;padding:var(--sp-4)"><b style="font-size:16px">' + tk('guestTitle') + '</b><p style="font-size:14px;margin:4px 0 var(--sp-3)">' + lead + '</p>' +
        '<div class="row" style="flex-wrap:nowrap"><a class="btn btn-primary btn-sm" style="flex:1" href="connexion.html">' + tk('login') + '</a><a class="btn btn-secondary btn-sm" style="flex:1" href="connexion.html#signup">' + tk('signup') + '</a></div></section>';
    },
    mount: function (el) { var c = el.querySelector('[data-close]'); if (c) c.addEventListener('click', function () { el.remove(); }); },
  });
  CN.define('ad-slot', {
    title: 'Emplacement publicitaire', desc: 'Place réservée (aucun décalage), libellé permanent, replié sans annonce ou si la pub est coupée. Jamais en mode cuisine, formulaires, onboarding.',
    props: [['id', 'identifiant', '', 'emplacement (configuration par emplacement)'], ['format', 'rect | infeed | v300', 'infeed', 'format']],
    usedIn: ['accueil', 'suggestions (après le dernier niveau)', 'fiche recette'], example: { id: 'demo', format: 'infeed' }, i18nRender: true,
    render: function (p) {
      var f = p.format || 'infeed', box = { rect: '300 × 250', infeed: '320 × 100 / 728 × 90', v300: '300 × 600' }[f] + ' — ' + esc(T({ rect: 'adRect', infeed: 'adInfeed', v300: 'adSide' }[f]));
      return '<div class="adslot adslot--' + f + '" data-ad-id="' + esc(p.id || '') + '" role="complementary" aria-label="Publicité"><span class="adslot-label" data-i18n="adLabel">Publicité</span><span class="adslot-box">' + box + '</span></div>';
    },
  });
  CN.define('link-button', {
    title: 'Bouton-lien', desc: 'Action vers une autre page (principale, secondaire ou discrète).',
    props: [['labelKey', 'clé i18n', '', 'libellé traduit'], ['label', 'texte', '', 'libellé'], ['href', 'url', '', 'destination'], ['variant', 'primary | secondary | ghost', 'secondary', 'style'], ['block', 'booléen', 'false', 'pleine largeur']],
    usedIn: ['suggestions', 'onboarding', 'fin de parcours'], example: { label: 'Voir les 10 autres', href: 'recherche.html', block: true },
    render: function (p) { return '<a class="btn btn-' + (p.variant || 'secondary') + (p.block ? ' btn-block' : '') + '" style="margin-top:var(--sp-3)" href="' + esc(p.href || '#') + '">' + label(p, 'labelKey', 'label') + '</a>'; },
  });
  /* Onglets de contenu : chaque onglet contient un bloc (imbrication CMS). */
  CN.define('tabs', {
    title: 'Onglets de contenu (conteneur)', desc: 'Plusieurs blocs dans des onglets ARIA (flèches du clavier) ; chaque onglet porte un composant et ses props.',
    props: [['tabs', 'liste {labelKey|label, c, props}', '[]', 'onglets et blocs']],
    usedIn: ['fiche recette (ingrédients / étapes)', 'favoris (favoris / hors ligne)'], example: { tabs: [{ label: 'Étal', c: 'shelf', props: { shelf: 'rapide' } }, { label: 'Catégories', c: 'category-rail', props: { title: '' } }] },
    render: function (p, el) {
      var id = el._tid || (el._tid = 't' + Math.random().toString(36).slice(2, 7));
      return '<div class="tabs" role="tablist" aria-label="' + esc(T(p.labelKey || 'content')) + '">' + p.tabs.map(function (t, i) {
        return '<button type="button" class="tab" role="tab" id="' + id + i + '" aria-selected="' + (i === 0) + '" aria-controls="' + id + 'p' + i + '" data-panel="' + id + 'p' + i + '">' + (t.labelKey ? tk(t.labelKey) : esc(t.label)) + (t.count ? ' <span class="num">(' + esc(t.count) + ')</span>' : '') + '</button>';
      }).join('') + '</div>' + p.tabs.map(function (t, i) {
        return '<div id="' + id + 'p' + i + '" role="tabpanel" aria-labelledby="' + id + i + '" tabindex="0"' + (i ? ' hidden' : '') + '><div data-c="' + esc(t.c) + '" data-props="' + esc(JSON.stringify(t.props || {})) + '"></div></div>';
      }).join('');
    },
    mount: function (el) {
      var tabs = [].slice.call(el.querySelectorAll('[role="tab"]'));
      var sel = function (t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.dataset.panel).hidden = !on; }); t.focus(); window.dispatchEvent(new Event('resize')); };
      tabs.forEach(function (t, i) { t.tabIndex = i ? -1 : 0; t.addEventListener('click', function () { sel(t); }); });
      el.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement); if (i < 0) return;
        var n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
        if (n) { e.preventDefault(); sel(n); }
      });
    },
  });
  CN.define('recipe-rail', {
    title: 'Carrousel de recettes choisies', desc: 'Une sélection éditoriale de recettes (par id) en carrousel — ex. « Nouveautés du chef ».',
    props: [['ids', 'liste d’id', '[]', 'recettes'], ['title', 'texte', '', 'titre'], ['eyebrow', 'texte', '', 'surtitre']],
    usedIn: ['accueil (nouveautés du chef)', 'pages thématiques'], example: { ids: ['brik', 'malsouka'], eyebrow: 'by chef Souhed', title: 'Nouveautés du chef' }, i18nRender: true,
    render: function (p) {
      var list = (p.ids || []).map(function (id) { return CN.byId[id]; }).filter(Boolean);
      var title = p.titleKey ? tk(p.titleKey) : esc(h.loc(p.title) || '');
      return (title ? h.head(esc(h.loc(p.eyebrow) || ''), title, '<a class="more" href="recherche.html">' + tk('seeAll') + '</a>') : '') + h.rail(h.loc(p.title) || 'recettes', list.map(function (r) { return h.card(r, 'grid'); }).join(''));
    },
  });
})();
