/* Chnawa Ntayeb — composants CMS (v4.6) · famille PARCOURS : scan photo, bienvenue, onboarding du frigo, connexion.
   Tous les textes passent par des clés (assets/cn/i18n.js) ; noms d'ingrédients via h.ingName (écriture arabe en ar / derja_ar). */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data, T = CN.T;
  var ICON_CAM = '<svg viewBox="0 0 24 24" style="width:56px;height:56px;stroke:#fff;stroke-width:1.6;fill:none"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  CN.define('scan-flow', {
    title: 'Parcours photo du frigo', desc: 'Photo (appareil natif) → analyse → propositions corrigibles (liste, oubli, doublon décoché, confiance en mots, aucune quantité) → confirmation ; états d’erreur et hors ligne.',
    props: [], usedIn: ['scan.html', 'onboarding (raccourci)'], example: {}, i18nRender: true,
    render: function (p, el) {
      var s = el._s || (el._s = 1), S = D.SCAN;
      var dots = ['stPhoto', 'stAnalysis', 'stProposals', 'stConfirm'].map(function (k, i) { return '<span role="listitem" aria-label="' + esc(T(k)) + '"' + (i === s - 1 ? ' aria-current="step"' : '') + '></span>'; }).join('');
      var head = '<div class="row" style="justify-content:space-between"><div class="onb-dots" role="list" aria-label="' + esc(T('scanSteps')) + '">' + dots + '</div><span class="step-count num">' + s + ' / 4</span></div>';
      if (s === 1) return head + '<section class="scan-state"><div class="offline-strip" role="status" style="text-align:start"><span aria-hidden="true">⚡</span><span>' + tk('scanOffline') + ' <a href="frigo.html" data-i18n="addIngredient"></a></span></div>' +
        '<div class="scan-frame ph" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--hero-from),var(--hero-to))" aria-hidden="true">' + ICON_CAM + '</div>' +
        '<p style="font-size:14px">' + tk('scanTip') + '</p>' +
        '<label class="btn btn-primary btn-block needs-net" style="cursor:pointer"><input type="file" accept="image/*" capture="environment" class="sr-only" data-go="2" /><span data-i18n="scanCapture"></span></label>' +
        '<button type="button" class="btn btn-secondary btn-block needs-net" style="margin-top:var(--sp-2)" data-go="2">' + tk('chooseExisting') + '</button></section>';
      if (s === 2) return head + '<section class="scan-state"><div class="scan-frame ph r43"><span class="skeleton" style="position:absolute;inset:0;display:block"></span></div><p class="page-title" data-i18n="scanAnalyzing" aria-live="polite"></p><button type="button" class="btn btn-ghost" data-go="1" data-i18n="recognizeCancel"></button></section>';
      if (s === 3) {
        var rows = S.proposals.map(function (x, i) {
          var name = x.alternatives ? '<select class="select" aria-label="' + esc(T('fixProposal')) + '" style="flex:1;min-width:140px;min-height:44px">' + x.alternatives.map(function (a) { return '<option>' + esc(a === 'other' ? T('addForgotten') : h.ingName(a)) + (a === x.id ? ' ?' : '') + '</option>'; }).join('') + '</select>' :
            '<span>' + esc(h.ingName(x.id)) + (x.dup ? ' <span class="muted" style="font-size:12px">· ' + esc(T('alreadyIn')) + '</span>' : '') + '</span>';
          return '<label class="rec-item' + (x.on ? '' : ' rejected') + '" style="flex-wrap:wrap"><input type="checkbox"' + (x.on ? ' checked' : '') + ' data-p="' + i + '" /><span class="thumb" style="width:32px;height:32px;font-size:15px" aria-hidden="true">' + x.emoji + '</span>' + name + '<span class="conf">' + esc(T(x.sure ? 'confSure' : 'confCheck')) + '</span></label>';
        }).join('');
        var n = S.proposals.filter(function (x) { return x.on; }).length;
        return head + '<section class="scan-state" style="text-align:start"><h2 class="page-title" data-i18n="scanCorrection"></h2><p class="page-lead" data-i18n="recognizeLead"></p><div class="recognize">' +
          '<div class="rec-photo ph" data-fallback="📸"><img src="' + D.photo(S.photo, 720) + '" alt="' + esc(T('yourFridgePhoto')) + '" width="720" height="540" loading="lazy" /></div><div style="display:grid;gap:6px">' + rows + '</div>' +
          '<div class="search" style="max-width:none"><div class="box"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><input type="search" placeholder="' + esc(T('addForgotten')) + '" aria-label="' + esc(T('addForgotten')) + '" /></div></div>' +
          '<div class="row" style="flex-wrap:nowrap"><button type="button" class="btn btn-secondary" data-go="1" data-i18n="scanRetake"></button><button type="button" class="btn btn-primary" style="flex:1" data-go="4">' + esc(T('addNIng', { n: n })) + '</button></div></div></section>';
      }
      var added = S.proposals.filter(function (x) { return x.on; });
      return head + '<section class="scan-state"><div class="toast" style="justify-content:center" role="status">' + esc(T('nAdded', { n: added.length })) + '</div><p style="font-size:14px">' + tk('addedNoQty') + '</p>' +
        '<div class="row"><a class="btn btn-secondary" href="frigo.html" data-i18n="myFridge"></a><a class="btn btn-primary" href="suggestions.html" style="flex:1" data-i18n="openSuggestions"></a></div></section>' +
        '<section class="card" style="margin-top:var(--sp-5)"><b>' + tk('altStates') + '</b><div class="state-note" style="margin-top:8px"><span class="icon" aria-hidden="true">🔍</span>' + tk('nothingFound') + '</div>' +
        '<div class="state-note" style="margin-top:8px"><span class="icon" aria-hidden="true">⚡</span>' + tk('analysisFailed') + '</div></section>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-go]').forEach(function (b) {
        b.addEventListener(b.tagName === 'INPUT' ? 'change' : 'click', function () {
          el._s = +b.dataset.go; el._cnDraw(); window.scrollTo(0, 0);
          if (el._s === 2) setTimeout(function () { if (el._s === 2) { el._s = 3; el._cnDraw(); } }, 1500);
        });
      });
      el.querySelectorAll('[data-p]').forEach(function (c) { c.addEventListener('change', function () { D.SCAN.proposals[+c.dataset.p].on = c.checked; el._cnDraw(); }); });
    },
  });

  CN.define('welcome-flow', {
    title: 'Bienvenue (3 écrans)', desc: 'Marque + promesse → valeur → réglages (langue et thème appliqués aussitôt, compte facultatif). Sans navigation ni publicité.',
    props: [], usedIn: ['bienvenue.html'], example: {}, i18nRender: true,
    render: function (p, el) {
      var i = el._i || 0, W = D.WELCOME[i], body, mode = document.documentElement.getAttribute('data-mode');
      var dots = D.WELCOME.map(function (x, k) { return '<span role="listitem" aria-label="' + esc(T('stepN', { n: k + 1 })) + '"' + (k === i ? ' aria-current="step"' : '') + '></span>'; }).join('');
      if (W.kind === 'hero') body = '<section><div class="hero-photo"><div class="ph r43" data-fallback="🥘"><img src="' + D.photo(W.photo, 720) + '" alt="" width="720" height="540" loading="eager" /></div></div><h1 class="page-title brand-display" style="font-size:28px;text-align:center;margin-top:var(--sp-4)">Chnawa Ntayeb</h1><p style="text-align:center;margin:0;font-weight:700">by chef Souhed</p><p class="page-lead" style="text-align:center;font-size:16px;margin-top:var(--sp-2)" data-i18n="newLead"></p></section>';
      else if (W.kind === 'values') body = '<section class="card"><h2 style="margin-top:0" data-i18n="welcomeValue"></h2>' + W.items.map(function (v) { return '<div class="list-item"><span class="thumb" aria-hidden="true">' + v[0] + '</span><div class="grow"><span class="title" data-i18n="' + v[1] + '"></span><br /><span class="muted" style="font-size:12px">' + tk(v[2]) + '</span></div></div>'; }).join('') + '</section>';
      else body = '<section class="card"><h2 style="margin-top:0" data-i18n="welcomeSetup"></h2><div class="form-row"><label for="w-lang" data-i18n="welcomeLang"></label><select class="select" id="w-lang">' +
        [['fr', 'Français'], ['derja', 'Derja'], ['ar', 'العربية'], ['derja_ar', 'دارجة']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === h.lang() ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="form-row" style="margin-top:var(--sp-3)"><span style="font-weight:700;font-size:14px" id="w-theme" data-i18n="welcomeTheme"></span><div class="chips" role="group" aria-labelledby="w-theme"><button type="button" class="chip" data-mode="light" aria-pressed="' + (mode !== 'dark') + '">' + tk('light') + '</button><button type="button" class="chip" data-mode="dark" aria-pressed="' + (mode === 'dark') + '">' + tk('dark') + '</button></div></div>' +
        '<div class="form-row" style="margin-top:var(--sp-3)"><span style="font-weight:700;font-size:14px" data-i18n="welcomeAccount"></span><div class="row"><a class="btn btn-secondary" href="connexion.html#signup">' + tk('signup') + '</a><a class="btn btn-secondary" href="connexion.html">' + tk('login') + '</a></div></div></section>';
      return '<div style="display:flex;flex-direction:column;gap:var(--sp-4);min-height:70vh;justify-content:center"><div class="onb-dots" role="list" aria-label="' + esc(T('introSteps')) + '">' + dots + '</div>' + body + '</div>' +
        '<div style="padding:var(--sp-3) 0"><button type="button" class="btn btn-primary btn-block" data-next data-i18n="' + (i === D.WELCOME.length - 1 ? 'welcomeFinish' : 'nextLabel') + '"></button><button type="button" class="btn btn-secondary btn-block" style="margin-top:var(--sp-2)" data-skip data-i18n="welcomeSkip"></button></div>';
    },
    mount: function (el) {
      el.querySelector('[data-next]').addEventListener('click', function () { if ((el._i || 0) < D.WELCOME.length - 1) { el._i = (el._i || 0) + 1; el._cnDraw(); } else location.href = 'onboarding.html'; });
      el.querySelector('[data-skip]').addEventListener('click', function () { location.href = 'onboarding.html'; });
      var sl = el.querySelector('#w-lang'); if (sl) sl.addEventListener('change', function () { var b = document.querySelector('.lang-ctl[data-lang="' + sl.value + '"]'); if (b) b.click(); });
      el.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { document.documentElement.setAttribute('data-mode', b.dataset.mode); el.querySelectorAll('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    },
  });

  CN.define('fridge-onboarding', {
    title: 'Remplir son frigo (onboarding)', desc: 'Puces par catégorie (sélection réelle, coche visible), raccourci photo, compteur ; aucune quantité demandée.',
    props: [], usedIn: ['onboarding.html'], example: {}, i18nRender: true,
    render: function (p, el) {
      if (!el._sel) { el._sel = {}; D.ONBOARDING.forEach(function (g) { g[2].forEach(function (n) { el._sel[n] = true; }); }); }
      var n = Object.keys(el._sel).filter(function (k) { return el._sel[k]; }).length;
      return '<section class="card" style="padding-inline:var(--sp-3)"><h2 style="margin-top:0;font-size:15px" data-i18n="onbStep1"></h2>' + D.ONBOARDING.map(function (g) {
        return '<div class="section-head" style="margin:var(--sp-2) 0 var(--sp-1)"><div><span class="eyebrow" data-i18n="' + g[0] + '"></span></div></div><div class="chips">' + g[1].map(function (x) { return '<button type="button" class="chip" data-x="' + x + '" aria-pressed="' + !!el._sel[x] + '">' + esc(h.ingName(x)) + '</button>'; }).join('') + '</div>';
      }).join('') + '<p class="help" style="margin-top:var(--sp-3)">' + tk('noQtyAsked') + '</p></section>' +
        '<section class="card" style="margin-top:var(--sp-3);display:flex;align-items:center;gap:var(--sp-3)"><span class="thumb" aria-hidden="true">📸</span><div class="grow"><span class="title" data-i18n="onbStep2"></span><br /><span class="muted" style="font-size:12px">' + tk('welcomeHint') + '</span></div><a class="btn btn-secondary needs-net" href="scan.html" data-i18n="scanCapture"></a></section>' +
        '<div class="row" style="margin-top:var(--sp-3)"><span class="muted num" style="font-size:13px;align-self:center" aria-live="polite">' + esc(T('nChosen', { n: n })) + '</span><a class="btn btn-primary" href="suggestions.html" style="flex:1" data-i18n="onbFinish"></a></div>';
    },
    mount: function (el) { el.querySelectorAll('[data-x]').forEach(function (b) { b.addEventListener('click', function () { el._sel[b.dataset.x] = !el._sel[b.dataset.x]; el._cnDraw(); var nb = el.querySelector('[data-x="' + b.dataset.x + '"]'); if (nb) nb.focus(); }); }); },
  });

  CN.define('auth-form', {
    title: 'Connexion / création de compte', desc: 'Compte facultatif : téléphone E.164, mot de passe, reprise des données de l’appareil ; « Continuer sans compte ». Vrais onglets ARIA (même page). Désactivé hors ligne.',
    props: [['start', 'login | signup', 'login', 'onglet initial (#signup dans l’adresse)']], usedIn: ['connexion.html', 'panneau invité'], example: {}, i18nRender: true,
    render: function (p, el) {
      var tab = el._t || (location.hash === '#signup' ? 'signup' : p.start || 'login');
      var field = function (id, key, type, ac, extra) { return '<div class="form-row" style="max-width:none;margin-top:var(--sp-3)"><label for="' + id + '">' + tk(key) + '</label><input id="' + id + '" class="select" type="' + type + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + (type === 'tel' ? ' inputmode="tel" placeholder="+216 22 123 456" dir="ltr"' : '') + ' />' + (extra || '') + '</div>'; };
      var login = '<h1 class="page-title" style="margin-top:0">' + tk('welcomeBack') + '</h1>' + field('l-tel', 'phone', 'tel', 'tel') + field('l-pw', 'password', 'password', 'current-password') +
        '<a href="#" style="display:inline-block;margin-top:8px;font-weight:700;font-size:14px">' + tk('forgot') + '</a><button type="button" class="btn btn-primary btn-block needs-net" style="margin-top:var(--sp-4)" data-auth="user">' + tk('login') + '</button>';
      var signup = '<h1 class="page-title" style="margin-top:0">' + tk('createYourAccount') + '</h1>' + field('s-name', 'firstName', 'text', 'given-name') + field('s-tel', 'phone', 'tel', 'tel', '<span class="help">' + tk('e164') + '</span>') + field('s-pw', 'password', 'password', 'new-password') +
        '<label class="check" style="margin-top:8px"><input type="checkbox" checked /> ' + tk('keepLocal') + '</label><button type="button" class="btn btn-primary btn-block needs-net" style="margin-top:var(--sp-3)" data-auth="user">' + tk('createMyAccount') + '</button>';
      var t = function (k, key) { return '<button type="button" class="tab" role="tab" id="at-' + k + '" aria-controls="ap-' + k + '" aria-selected="' + (tab === k) + '" tabindex="' + (tab === k ? 0 : -1) + '" data-tab="' + k + '">' + tk(key) + '</button>'; };
      return '<div style="max-width:440px;margin-inline:auto"><div class="tabs" role="tablist" aria-label="' + esc(T('account')) + '">' + t('login', 'login') + t('signup', 'signup') + '</div>' +
        '<section class="card" role="tabpanel" id="ap-' + tab + '" aria-labelledby="at-' + tab + '" style="padding:var(--sp-5) var(--sp-4)">' + (tab === 'login' ? login : signup) + '</section>' +
        '<ul style="display:grid;gap:8px;margin:var(--sp-4) 0 0;padding:0;list-style:none;font-size:14px"><li>✓ ' + tk('why1') + '</li><li>✓ ' + tk('why2') + '</li><li>✓ ' + tk('why3') + '</li></ul>' +
        '<a class="btn btn-ghost btn-block" style="margin-top:var(--sp-4)" href="accueil-c.html" data-auth="guest">' + tk('continueGuest') + '</a></div>';
    },
    mount: function (el) {
      var tabs = [].slice.call(el.querySelectorAll('[data-tab]'));
      var go = function (k) { el._t = k; el._cnDraw(); var nt = el.querySelector('[data-tab="' + k + '"]'); if (nt) nt.focus(); };
      tabs.forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.tab); }); });
      el.querySelector('[role="tablist"]').addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(el._t === 'signup' || (!el._t && location.hash === '#signup') ? 'login' : 'signup'); } });
      el.querySelectorAll('[data-auth]').forEach(function (b) { b.addEventListener('click', function () { try { sessionStorage.setItem('d4-auth', b.dataset.auth); } catch (e) { /* mode privé */ } if (b.tagName === 'BUTTON') location.href = 'accueil-c.html'; }); });
    },
  });
})();
