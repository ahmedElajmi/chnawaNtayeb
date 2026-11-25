/* Chnawa Ntayeb — composants CMS (v4.5) · famille FRIGO.
   UN composant d'inventaire pour un petit frigo (9) comme pour un grand (64) : la recherche, le tri, la mosaïque et
   « Voir les N autres » apparaissent quand le volume le justifie (seuil = prop). Données : data.js. */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data, T = CN.T;
  /* Noms des rayons du frigo par langue (derja, ar, derja_ar). */
  var CAT_I18N = { veg: ['Khodhra', 'خضروات', 'خضرة'], fruit: ['Ghalla', 'غلال', 'غلّة'], meat: ['L7am', 'لحوم', 'لحم'], fish: ['7out', 'أسماك', 'حوت'], dairy: ['7lib w 3dham', 'ألبان وبيض', 'حليب وعظم'],
    grocery: ['Episserie', 'بقالة', 'عطرية'], spice: ['Bharat', 'توابل', 'بهارات'], herb: ['Na3na3 w ma3dnous', 'أعشاب', 'نعناع ومعدنوس'], bread: ['Khobz', 'خبز', 'خبز'] };
  var catLabel = function (k) { var i = { derja: 0, ar: 1, derja_ar: 2 }[h.lang()]; return i == null ? D.FRIDGE_CATS[k][0] : CAT_I18N[k][i]; };
  var html = document.documentElement;
  var C = D.FRIDGE_CATS;
  var ICON_EDIT = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>';
  var ICON_DEL = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

  /* Construit la liste à afficher selon la taille de démonstration (html[data-fridge]) ou la prop « size ». */
  var load = function (size) {
    if (size === 'big') return D.BIG_FRIDGE.split('|').map(function (x, i) { var p = x.split(':'); return { cat: p[0], name: p[1], qty: p[2] === '!' ? null : (p[2] || ''), out: p[2] === '!', i: i }; });
    var out = [], i = 0;
    Object.keys(D.SMALL_FRIDGE_LAYOUT).forEach(function (cat) {
      D.SMALL_FRIDGE_LAYOUT[cat].forEach(function (id) {
        var isOut = D.OUT.indexOf(id) !== -1, q = D.FRIDGE[id];
        out.push({ cat: cat, id: id, name: h.ingName(id), qty: isOut ? null : (q === null ? '' : q + (/^\d+$/.test(q || '') ? ' pièce' + (+q > 1 ? 's' : '') : '')), out: isOut, i: i++ });
      });
    });
    return out;
  };

  CN.define('fridge-add', {
    title: 'Ajouter au frigo', desc: 'Recherche dans le catalogue (aucune quantité demandée) + bouton photo (désactivé hors ligne). Un seul parcours photo : scan.html.',
    props: [], usedIn: ['frigo', 'onboarding'], example: {}, i18nRender: true,
    render: function () {
      return '<div class="row" style="margin-top:var(--sp-3);gap:var(--sp-2);flex-wrap:nowrap;align-items:stretch"><div class="search" style="max-width:none;flex:1"><div class="box"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input type="search" data-i18n="addIngredient" data-i18n-attr="placeholder" placeholder="' + esc(T('addIngredient')) + '" aria-label="' + esc(T('addIngredient')) + '" /></div>' +
        '<div class="suggestions" aria-label="' + esc(T('inYourFridge')) + '" style="display:none"><div class="sug"><span class="thumb" style="width:28px;height:28px;font-size:13px" aria-hidden="true">🥒</span>' + esc(h.ingName('courgettes')) + '<span class="tag">' + esc(catLabel('veg')) + '</span></div><div class="sug"><span class="thumb" style="width:28px;height:28px;font-size:13px" aria-hidden="true">🍋</span>' + esc(h.ingName('citron')) + '<span class="tag">' + esc(catLabel('fruit')) + '</span></div></div></div>' +
        '<a class="btn btn-secondary needs-net" href="scan.html" aria-label="' + esc(T('addByPhoto')) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></a></div>';
    },
  });

  CN.define('fridge-inventory', {
    title: 'Inventaire du frigo', desc: 'Récapitulatif juste (compté sur tout le frigo), états avec quantité / sans quantité / épuisé, modification en feuille (quantité facultative, « Je n’en ai plus »), retrait avec « Annuler ». Au-delà du seuil : recherche dans le frigo, catégories en carrousel avec nombres, Liste / Mosaïque, tri, 8 par catégorie puis « Voir les N autres ».',
    props: [['size', 'small | big | demo', 'demo', 'jeu de données (demo = bascule de la pastille)'], ['toolsFrom', 'nombre', '12', 'seuil d’apparition des outils']],
    usedIn: ['frigo', 'onboarding (aperçu)'], example: { size: 'small' }, demoRender: true, i18nRender: true,
    render: function (p, el) {
      var size = p.size === 'demo' || !p.size ? (html.getAttribute('data-fridge') || 'small') : p.size;
      if (el._size !== size) { el._size = size; el._items = load(size); el._st = { q: '', cat: 'all', view: 'list', sort: 'cat', open: {}, removed: {} }; }
      var st = el._st, items = el._items.filter(function (x) { return !st.removed[x.i]; }), avail = items.filter(function (x) { return !x.out; });
      var tools = items.length >= (p.toolsFrom || 12);
      var head = '<section class="card" style="padding:var(--sp-3)" aria-label="' + esc(T('myFridge')) + '"><div class="row" style="justify-content:space-between"><b>' + esc(T('ingAvailN', { n: avail.length })) + '</b>' +
        '<a class="btn btn-primary btn-sm" href="suggestions.html" data-i18n="openSuggestions"></a></div><div class="legend" style="margin-top:8px">' +
        '<span class="ing have">✓ ' + esc(T('withQtyN', { n: avail.filter(function (x) { return x.qty; }).length })) + '</span><span class="ing unknown">○ ' + esc(T('noQtyN', { n: avail.filter(function (x) { return !x.qty; }).length })) + '</span>' +
        '<span class="ing out">— ' + esc(T('outN', { n: items.filter(function (x) { return x.out; }).length })) + '</span></div></section>';
      var bar = '';
      if (tools) {
        var chip = function (id, label, n) { return '<button type="button" class="chip" data-cat="' + id + '" aria-pressed="' + (st.cat === id) + '">' + label + ' <span class="num" style="opacity:.75">' + n + '</span></button>'; };
        bar = '<div class="bf-tools"><div class="search" style="max-width:none;flex:1"><div class="box"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" data-q value="' + esc(st.q) + '" placeholder="' + esc(T('searchFridge')) + '" aria-label="' + esc(T('searchFridge')) + '" /></div></div>' +
          '<span class="seg" role="group" aria-label="' + esc(T('display')) + '"><button type="button" data-view="list" aria-pressed="' + (st.view === 'list') + '">' + tk('viewList') + '</button><button type="button" data-view="grid" aria-pressed="' + (st.view === 'grid') + '">' + tk('viewGrid') + '</button></span>' +
          '<label class="sr-only" for="' + (el._sid || (el._sid = 'fs' + Math.random().toString(36).slice(2, 6))) + '">' + esc(T('sortBy')) + '</label><select id="' + el._sid + '" class="select" data-sort style="width:auto;min-height:44px">' +
          [['cat', 'sortCat'], ['az', 'sortAz'], ['recent', 'sortRecent'], ['unknown', 'sortUnknown']].map(function (o) { return '<option value="' + o[0] + '"' + (st.sort === o[0] ? ' selected' : '') + '>' + esc(T(o[1])) + '</option>'; }).join('') + '</select></div>' +
          h.rail('catégories du frigo', chip('all', esc(T('all')), avail.length) + Object.keys(C).map(function (k) { return chip(k, C[k][1] + ' ' + esc(catLabel(k)), avail.filter(function (x) { return x.cat === k; }).length); }).join(''));
      }
      var list = items.filter(function (x) { return (st.cat === 'all' || x.cat === st.cat) && (!st.q || norm(x.name).indexOf(norm(st.q)) !== -1); });
      var byOut = function (a, b) { return a.out - b.out; };
      if (st.sort === 'az') list.sort(function (a, b) { return byOut(a, b) || a.name.localeCompare(b.name, 'fr'); });
      else if (st.sort === 'recent') list.sort(function (a, b) { return byOut(a, b) || b.i - a.i; });
      else if (st.sort === 'unknown') list.sort(function (a, b) { return byOut(a, b) || (!!a.qty - !!b.qty); });
      var count = tools && (st.q || st.cat !== 'all') ? '<p class="muted" aria-live="polite" style="font-size:13px;margin:4px 0 0">' + esc(T('nOfM', { n: list.filter(function (x) { return !x.out; }).length, m: avail.length })) + '</p>' : '';
      if (!list.length) return head + bar + count + '<div class="state-note" style="margin-top:12px"><span class="icon" aria-hidden="true">🔍</span>' + esc(T('notInMyFridge', { x: st.q })) + '</div>';
      var row = function (x) {
        var q = x.out ? '<span class="ing out" style="font-size:11px;padding:1px 8px" data-i18n="outOfStock">' + esc(T('outOfStock')) + '</span>' : x.qty ? '<span class="qty-txt num">' + esc(x.qty) + '</span>' : '<span class="ing unknown" style="font-size:11px;padding:1px 8px" data-i18n="quantityUnknown">' + esc(T('quantityUnknown')) + '</span>';
        if (st.view === 'grid') return '<button type="button" class="bf-tile' + (x.out ? ' is-out' : '') + '" data-edit="' + x.i + '"><span class="bf-emo" aria-hidden="true">' + C[x.cat][1] + '</span><b>' + esc(x.id ? h.ingName(x.id) : x.name) + '</b>' + q + '</button>';
        var act = x.out ? '<button type="button" class="btn btn-ghost btn-sm" data-back="' + x.i + '" data-i18n="iHaveAgain">' + esc(T('iHaveAgain')) + '</button>' :
          (x.qty ? '<button type="button" class="icon-btn" data-edit="' + x.i + '" aria-label="' + esc(T('editX', { x: x.name })) + '">' + ICON_EDIT + '</button>' : '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + x.i + '" data-i18n="addQty">' + esc(T('addQty')) + '</button>') +
          '<button type="button" class="icon-btn" data-del="' + x.i + '" aria-label="' + esc(T('removeX', { x: x.name })) + '">' + ICON_DEL + '</button>';
        return '<div class="list-item fridge-row' + (x.out ? ' is-out' : '') + '"><span class="thumb" style="width:40px;height:40px;font-size:18px" aria-hidden="true">' + ((D.ING[x.id] || [])[1] || C[x.cat][1]) + '</span><div class="grow"><span class="title" style="font-size:14px">' + esc(x.id ? h.ingName(x.id) : x.name) + '</span><br />' + q + '</div><div class="row-actions">' + act + '</div></div>';
      };
      var groups = st.sort === 'cat' ? Object.keys(C).map(function (k) { return [k, list.filter(function (x) { return x.cat === k; }).sort(byOut)]; }).filter(function (g) { return g[1].length; }) : [['', list]];
      var body = groups.map(function (g) {
        var k = g[0], arr = g[1], limit = !tools || st.open[k] || st.q ? arr.length : 8, rest = arr.length - limit;
        var inner = st.view === 'grid' ? '<div class="bf-grid">' + arr.slice(0, limit).map(row).join('') + '</div>' : '<div class="card" style="padding-block:2px">' + arr.slice(0, limit).map(row).join('') + '</div>';
        var hd = k ? '<div class="section-head" style="margin-top:var(--sp-4)"><div><h2 style="font-size:16px">' + C[k][1] + ' ' + esc(catLabel(k)) + ' <span class="muted num" style="font-size:13px">' + arr.filter(function (x) { return !x.out; }).length + '</span></h2></div></div>' : '<div style="height:12px"></div>';
        return hd + inner + (rest > 0 ? '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:6px" data-more="' + k + '">' + esc(T('seeOthersN', { n: rest })) + '</button>' : '');
      }).join('');
      return head + bar + count + body;
    },
    mount: function (el) {
      var st = el._st, redraw = function () { el._cnDraw(); };
      var q = el.querySelector('[data-q]'); if (q) q.addEventListener('input', function () { st.q = q.value.trim(); redraw(); var n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
      var so = el.querySelector('[data-sort]'); if (so) so.addEventListener('change', function () { st.sort = so.value; redraw(); });
      el.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { st.view = b.dataset.view; redraw(); }); });
      el.querySelectorAll('[data-cat]').forEach(function (b) { b.addEventListener('click', function () { st.cat = b.dataset.cat; redraw(); }); });
      el.querySelectorAll('[data-more]').forEach(function (b) { b.addEventListener('click', function () { st.open[b.dataset.more] = true; redraw(); }); });
      el.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { var it = el._items[+b.dataset.back]; it.out = false; it.qty = ''; redraw(); window.D4.snack(T('backAvailable', { x: it.name })); }); });
      el.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () { var i = +b.dataset.del, it = el._items[i]; st.removed[i] = true; redraw(); window.D4.snack(it.name + ' — ' + window.D4.t('removed'), function () { delete st.removed[i]; redraw(); }); });
      });
      el.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openEdit(el, el._items[+b.dataset.edit], b); }); });
    },
  });

  /* Feuille de modification : quantité ET unité facultatives ; « Je ne sais pas » ; « Je n'en ai plus » (épuisé). */
  var openEdit = function (el, it, opener) {
    var ov = document.createElement('div'); ov.className = 'sheet-overlay';
    var num = parseFloat((it.qty || '').replace(',', '.')) || '';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fe-t"><div class="grab" aria-hidden="true"></div><h2 id="fe-t" style="margin-top:0">' + esc(it.name) + '</h2>' +
      '<div class="form-row" style="max-width:none"><label for="fe-q">' + esc(T('qtyOptional')) + '</label><div class="row" style="flex-wrap:nowrap"><input id="fe-q" class="select" inputmode="decimal" value="' + num + '" style="flex:1" />' +
      '<select class="select" aria-label="' + esc(T('unit')) + '" style="flex:1"><option>pièce(s)</option><option>kg</option><option>g</option><option>l</option><option>botte</option></select></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" style="align-self:flex-start" data-clear>' + esc(T('dontKnow')) + '</button></div>' +
      '<div class="row" style="margin-top:var(--sp-4);flex-wrap:nowrap"><button type="button" class="btn btn-secondary" style="flex:1" data-out>' + esc(window.D4.t('iHaveNoMore')) + '</button><button type="button" class="btn btn-primary" style="flex:1" data-save>' + esc(window.D4.t('boSave')) + '</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); document.removeEventListener('keydown', onKey); if (document.body.contains(opener)) opener.focus(); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-clear]').addEventListener('click', function () { ov.querySelector('#fe-q').value = ''; });
    ov.querySelector('[data-out]').addEventListener('click', function () { it.out = true; it.qty = null; close(); el._cnDraw(); window.D4.snack(T('markedOut', { x: it.name })); });
    ov.querySelector('[data-save]').addEventListener('click', function () { var v = ov.querySelector('#fe-q').value.trim(); it.qty = v ? v + ' ' + ov.querySelector('select').value : ''; close(); el._cnDraw(); });
    ov.querySelector('#fe-q').focus();
  };
})();
