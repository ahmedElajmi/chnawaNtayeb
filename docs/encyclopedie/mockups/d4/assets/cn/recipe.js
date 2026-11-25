/* Chnawa Ntayeb — composants CMS (v4.6) · familles SUGGESTIONS, FICHE RECETTE, MODE CUISINE.
   La fiche lit la recette dans l'adresse (recette.html?id=…) et le scénario de test (html[data-scenario] ou prop).
   Correspondance : CN.match() AFFICHE les résultats déclarés (data.js) — aucun moteur dans la maquette. */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data, T = CN.T, L4 = h.L4;
  Object.assign(window.CN_I18N, {
    seeOthersN: L4('Voir les {n} autres', 'Chouf el {n} lokhrin', 'عرض الـ{n} الأخرى', 'شوف ال{n} لوخرين'),
    howTitle: L4('Comment ces recettes sont classées ?', 'Kifech maklet hedhom mrattbin ?', 'كيف تُرتَّب هذه الوصفات؟', 'كيفاش الماكلات هاذم مرتبين ؟'),
    how1: L4('Prête à cuisiner : vous avez tout, en quantité connue.', 'Wajda : 3andek kol chay, bel qadd.', 'جاهزة للطهي: لديك كل شيء بكمية معروفة.', 'واجدة : عندك كل شي بالقدّ.'),
    how2: L4('Presque prête : il manque 1 à 3 ingrédients, ou une quantité est à vérifier.', 'Qrib wajda : na9es 1 l 3, walla qadd lezmou yetthabbet.', 'شبه جاهزة: ينقص من 1 إلى 3 مكوّنات، أو كمية يجب التحقق منها.', 'قريبة واجدة : ناقص من 1 ل 3، ولّا قدّ لازمو يتثبّت.'),
    how3: L4('À découvrir : il manque 4 ingrédients ou plus.', 'Bech tetkechef : na9es 4 walla akthar.', 'للاكتشاف: ينقص 4 مكوّنات أو أكثر.', 'باش تكتشفها : ناقص 4 ولّا أكثر.'),
    how4: L4('Un ingrédient sans quantité compte comme présent, jamais comme suffisant.', 'Ingrédient bla qadd y7seb mawjoud, ama mouch kafi.', 'المكوّن بلا كمية يُحسب موجوداً، لا كافياً.', 'المكوّن بلا قدّ يتحسب موجود، موش كافي.'),
    perPers: L4('/ pers.', '/ wa7ed', '/ للشخص', '/ للواحد'),
    allThere: L4('Tout est dans votre frigo', 'Kol chay fel frigo', 'كل شيء في ثلاجتك', 'كل شي في الفريجيدار'),
    toBuyN: L4('à acheter', 'techri', 'للشراء', 'تشري'),
    statusReady: L4('Tout est dans votre frigo, en quantité connue. Vous pouvez commencer.', 'Kol chay 3andek bel qadd. Tnajem tabda.', 'كل شيء في ثلاجتك بكمية معروفة. يمكنك البدء.', 'كل شي عندك بالقدّ. تنجم تبدا.'),
    statusHave: L4('Vous avez {h} ingrédients sur {t}.', '3andek {h} men {t}.', 'لديك {h} مكوّنات من {t}.', 'عندك {h} من {t}.'),
    statusMissing: L4('Il manque : {x}.', 'Na9es : {x}.', 'ينقص: {x}.', 'ناقص : {x}.'),
    statusNone: L4('Plus rien à acheter.', 'Ma fama chay techrih.', 'لا شيء للشراء.', 'ما فمّا شي تشريه.'),
    statusVerify: L4('Quantité non renseignée : {x} — vérifiez qu’il vous en reste assez.', 'Qadd mouch m3arrof : {x} — thabbet elli 3andek yekfi.', 'كمية غير محدّدة: {x} — تحقّق أن لديك ما يكفي.', 'قدّ موش معروف : {x} — ثبّت اللي عندك يكفي.'),
    statusReplaced: L4('Remplacé pour cette préparation : {x}.', 'Tbaddel lel tabkha hedhi : {x}.', 'استُبدل لهذا التحضير: {x}.', 'تبدّل للطبخة هاذي : {x}.'),
    verifyThenCook: L4('Vérifier puis cuisiner', 'Thabbet w tayeb', 'تحقّق ثم اطبخ', 'ثبّت وطيّب'),
    verifyBefore: L4('À vérifier avant de commencer : {x}', 'Thabbet 9bal ma tabda : {x}', 'تحقّق قبل البدء: {x}', 'ثبّت قبل ما تبدا : {x}'),
    inFridge: L4('dans le frigo : {x}', 'fel frigo : {x}', 'في الثلاجة: {x}', 'في الفريجيدار : {x}'),
    inFridgeUnknown: L4('dans le frigo : quantité non renseignée', 'fel frigo : qadd mouch m3arrof', 'في الثلاجة: الكمية غير محدّدة', 'في الفريجيدار : القدّ موش معروف'),
    inFridgeYes: L4('dans le frigo', 'fel frigo', 'في الثلاجة', 'في الفريجيدار'),
    notInFridge: L4('pas dans le frigo', 'mouch fel frigo', 'ليس في الثلاجة', 'موش في الفريجيدار'),
    outInFridge: L4('épuisé dans votre frigo', 'kmel fel frigo', 'نفد من ثلاجتك', 'كمل في الفريجيدار'),
    replacedTag: L4('remplacé', 'tbaddel', 'مُستبدل', 'تبدّل'),
    subBy: L4('Remplaçable par {x} (vous les avez)', 'Tnajem tbaddlou b {x} (3andek)', 'يمكن استبداله بـ{x} (متوفّر لديك)', 'تنجم تبدّلو ب{x} (عندك)'),
    subByMissing: L4('Se remplace par {x}, mais il vous en manque', 'Ytbaddel b {x}, ama na9sek', 'يُستبدل بـ{x}، لكن ينقصك', 'يتبدّل ب{x}، أما ناقصك'),
    useSub: L4('Utiliser le remplacement', 'Esta3mel el badil', 'استخدم البديل', 'استعمل البديل'),
    refuseSub: L4('Non merci', 'La, ya3tik essa7a', 'لا، شكراً', 'لا، يعطيك الصحة'),
    subChosen: L4('Remplacement choisi', 'El badil mekhtar', 'تم اختيار البديل', 'البديل مختار'),
    subRefused: L4('Remplacement refusé', 'El badil mrfoudh', 'تم رفض البديل', 'البديل مرفوض'),
    subSnack: L4('{x} remplacé pour cette préparation.', '{x} tbaddel lel tabkha hedhi.', 'تم استبدال {x} لهذا التحضير.', '{x} تبدّل للطبخة هاذي.'),
    qtyFor: L4('Quantités pour', 'El qadd l', 'الكميات لـ', 'القدّ ل'),
    persN: L4('{n} pers.', '{n} ness', '{n} أشخاص', '{n} ناس'),
    lessPortion: L4('Une portion de moins', 'Portion a9al', 'حصة أقل', 'بورسيون أقل'),
    morePortion: L4('Une portion de plus', 'Portion zeyda', 'حصة إضافية', 'بورسيون زايدة'),
    stepsSoon: L4('Les étapes de cette recette arrivent bientôt.', 'Drojet el makla hedhi jeyin.', 'خطوات هذه الوصفة قريباً.', 'دروجات الماكلة هاذي جايين.'),
    offlineSaved: L4('Gardée hors ligne sur cet appareil.', 'Mkhabbya bla connexion fel téléphone.', 'محفوظة دون اتصال على هذا الجهاز.', 'مخبّية بلا كونكسيون في التليفون.'),
    offlineRemoved: L4('Retirée du hors ligne.', 'Tna77at mel hors ligne.', 'أُزيلت من وضع عدم الاتصال.', 'تنحّات من بلا كونكسيون.'),
    timerDone: L4('Minuteur terminé — étape {i}', 'El minuteur kmel — droga {i}', 'انتهى المؤقّت — الخطوة {i}', 'المنوطر كمل — الدروجة {i}'),
    plannedBuyN: L4('Voir les {n} achats', 'Chouf el {n} chriyet', 'عرض {n} مشتريات', 'شوف ال{n} شريات'),
    medium: L4('Moyen', 'Mtwasta', 'متوسطة', 'متوسطة'),
    hard: L4('Difficile', 'S3iba', 'صعبة', 'صعيبة'),
    ingredientsN: L4('{n} ingrédients', '{n} ingridyenat', '{n} مكوّنات', '{n} مكوّنات'),
  });
  var LEVEL = { ready: ['ok', 'readyToCook', '✓'], almost: ['warn', 'almostReady', '◐'], discover: ['disc', 'toDiscover', '○'] };
  var currentId = function (p) { var q = new URLSearchParams(location.search).get('id'); return (q && CN.byId[q]) ? q : (p && p.recipe) || 'ojja'; };
  CN.currentRecipe = function (p) { return CN.byId[currentId(p)]; };
  var NOFILTER = { q: '', course: 'any', maxTime: null, fridge: false, maxPrice: null, veg: false, tag: null, cats: [], include: [], exclude: [] };
  var list = function (ids) { return ids.map(h.ingName).join(', ').toLowerCase(); };
  /* Vue de correspondance d'un composant : scénario et acceptations éventuellement fixés par props (page scenarios.html). */
  var view = function (r, p) { return CN.match(r, { scenario: p && p.scenario, accept: p && p.accept }); };

  /* ---------- Suggestions ---------- */
  CN.define('level-section', {
    title: 'Niveau de suggestions', desc: 'Une section par niveau (Prête / Presque / À découvrir) avec son nombre réel ; au-delà de « limit », « Voir les N autres ».',
    props: [['level', 'ready | almost | discover', 'ready', 'niveau'], ['limit', 'nombre', '4', 'cartes affichées']],
    usedIn: ['Mes suggestions'], example: { level: 'almost', limit: 2 }, i18nRender: true, demoRender: true,
    render: function (p) {
      var lv = LEVEL[p.level || 'ready'], all = CN.results(null, NOFILTER).filter(function (r) { return CN.match(r).level === (p.level || 'ready'); });
      if (!all.length) return '';
      var shown = all.slice(0, p.limit || 4), rest = all.length - shown.length;
      return '<div class="section-head"><div><span class="eyebrow" style="color:var(--' + { ok: 'success', warn: 'warning', disc: 'info' }[lv[0]] + '-text)">' + lv[2] + ' ' + esc(all.length === 1 ? T('recipes1') : T('recipesN', { n: all.length })) + '</span><h2>' + tk(lv[1]) + '</h2></div></div>' +
        '<div class="rgrid">' + shown.map(function (r) { return h.card(r, 'grid'); }).join('') + '</div>' +
        (rest > 0 ? '<a class="btn btn-secondary btn-block" style="margin-top:var(--sp-3)" href="recherche.html">' + esc(T('seeOthersN', { n: rest })) + '</a>' : '');
    },
  });
  CN.define('how-ranked', {
    title: 'Comment c’est classé', desc: 'Explication repliée, en langage courant, des trois niveaux et de la règle « présent ≠ suffisant ».',
    props: [], usedIn: ['Mes suggestions', 'aide'], example: {}, i18nRender: true,
    render: function () {
      return '<details class="card" style="margin-top:var(--sp-3);padding:var(--sp-3)"><summary style="font-weight:800;cursor:pointer;min-height:28px">' + tk('howTitle') + '</summary><ul style="margin:8px 0 0;padding-inline-start:20px;font-size:14px;display:grid;gap:4px">' +
        ['how1', 'how2', 'how3', 'how4'].map(function (k) { return '<li>' + tk(k) + '</li>'; }).join('') + '</ul></details>';
    },
  });

  /* ---------- Fiche recette ---------- */
  var rl = [];
  var rchanged = function () { rl.forEach(function (fn) { fn(); }); };
  var listen = function (el) { if (!el._b) { el._b = 1; rl.push(function () { el._cnDraw(); }); } };
  var setSub = function (r, id, v) { var a = CN.accepted[r.id] || (CN.accepted[r.id] = {}); if (v) a[id] = v; else delete a[id]; rchanged(); };
  /* Un changement de scénario de démonstration remet les choix à zéro. */
  document.addEventListener('cn:demo', function (e) { if (e.detail === 'data-scenario') { Object.keys(CN.accepted).forEach(function (k) { delete CN.accepted[k]; }); rchanged(); } });

  CN.define('recipe-hero', {
    title: 'En-tête photo de recette', desc: 'Photo du plat terminé (16:9, 21:9 sur grand écran), niveau et score (suivent les substitutions acceptées), nom (et nom arabe), prix par personne en fourchette.',
    props: [['recipe', 'id (sinon ?id= de l’adresse)', 'ojja', 'recette']], usedIn: ['fiche recette'], example: { recipe: 'chakchouka' }, i18nRender: true, demoRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), m = view(r, p), lv = LEVEL[m.level];
      return '<nav class="crumbs" aria-label="Fil d’ariane"><a href="accueil-c.html" data-i18n="crumbsHome"></a><span class="sep" aria-hidden="true">›</span><a href="recherche.html" data-i18n="crumbsRecipes"></a><span class="sep" aria-hidden="true">›</span><span aria-current="page">' + esc(h.rName(r)) + '</span></nav>' +
        '<section class="hero-photo" aria-labelledby="r-title"><div class="ph" data-fallback="' + r.fallback + '"><img src="' + r.photoLarge + '" alt="' + esc(r.name) + '" width="1024" height="576" loading="eager" fetchpriority="high" /></div>' +
        '<div class="hp-body"><span class="match-badge ' + lv[0] + '" style="position:static;display:inline-flex;margin-bottom:6px">' + tk(lv[1]) + '&nbsp;·&nbsp;<span class="num">' + m.have + ' / ' + m.total + '</span></span>' +
        '<h1 class="hp-title" id="r-title">' + esc(h.rName(r)) + '</h1><p class="hp-sub">' + esc(r.name_ar) + ' · <span class="num">' + h.money(r.priceMin) + ' – ' + h.money(r.priceMax) + ' DT</span> ' + tk('perPers') + '</p></div></section>';
    },
    mount: function (el) { listen(el); },
  });
  CN.define('recipe-facts', {
    title: 'Informations de préparation', desc: 'Préparation, cuisson, difficulté, portions — lisibles sans ouvrir d’onglet.',
    props: [['recipe', 'id', 'ojja', 'recette']], usedIn: ['fiche recette', 'mode cuisine (aperçu)'], example: { recipe: 'kosksi' }, i18nRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), dk = { facile: 'easy', moyen: 'medium', difficile: 'hard' }[r.difficulty];
      return '<div class="meta-grid" style="margin-top:var(--sp-3)"><div><b class="num">' + r.prep + ' min</b><span data-i18n="prepTime"></span></div><div><b class="num">' + r.cook + ' min</b><span data-i18n="cookTime"></span></div>' +
        '<div><b>' + tk(dk) + '</b><span data-i18n="difficulty"></span></div><div><b class="num">' + r.servings + '</b><span data-i18n="portions"></span></div></div>';
    },
  });
  CN.define('recipe-status', {
    title: 'Situation par rapport au frigo', desc: 'Phrase honnête : présents, manquants, remplacés (substitution acceptée), à vérifier ; légende sans couleur seule. Jamais « prête » tant qu’une quantité est incertaine.',
    props: [['recipe', 'id', 'ojja', 'recette'], ['scenario', 'id de scénario', '', 'surcharge de test'], ['accept', 'objet', '', 'acceptations fixées (test)']], usedIn: ['fiche recette', 'scenarios.html'], example: { recipe: 'ojja' }, i18nRender: true, demoRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), m = view(r, p);
      var txt = m.level === 'ready' ? '<b>' + esc(T('statusReady')) + '</b>' :
        '<b>' + esc(T('statusHave', { h: m.have - m.replaced.length, t: m.total })) + '</b> ' + esc(m.missing.length ? T('statusMissing', { x: list(m.missing) }) : T('statusNone')) +
        (m.replaced.length ? ' ' + esc(T('statusReplaced', { x: list(m.replaced) })) : '') + (m.verify.length ? ' ' + esc(T('statusVerify', { x: list(m.verify) })) : '');
      var nHave = m.total - m.missing.length - m.replaced.length - m.verify.length;
      return '<div class="status-box' + (m.level === 'ready' ? ' ok' : '') + '" style="margin-top:var(--sp-3)" role="status">' + txt + '<div class="legend" style="margin-top:8px">' +
        '<span class="ing have">✓ ' + nHave + ' <span data-i18n="haveIng"></span></span>' + (m.replaced.length ? '<span class="ing sub">🔁 ' + m.replaced.length + ' ' + tk('replacedTag') + '</span>' : '') +
        (m.verify.length ? '<span class="ing verify">? ' + m.verify.length + ' <span data-i18n="toVerify"></span></span>' : '') + (m.missing.length ? '<span class="ing miss">🛒 ' + m.missing.length + ' <span data-i18n="toBuy"></span></span>' : '') + '</div></div>';
    },
    mount: function (el) { listen(el); },
  });
  CN.define('recipe-actions', {
    title: 'Actions secondaires de recette', desc: 'Planifier, garder hors ligne (téléchargement, distinct du favori).',
    props: [['recipe', 'id', 'ojja', 'recette']], usedIn: ['fiche recette'], example: {}, i18nRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), off = D.OFFLINE.indexOf(r.id) !== -1;
      return '<div class="row" style="margin-top:var(--sp-3);gap:var(--sp-2)"><a class="btn btn-secondary btn-sm" href="planning.html"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg><span data-i18n="addToPlan"></span></a>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-off aria-pressed="' + off + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg><span data-i18n="saveOffline"></span>' + (off ? ' ✓' : '') + '</button></div>';
    },
    mount: function (el, p) { el.querySelector('[data-off]').addEventListener('click', function () { var r = CN.currentRecipe(p), i = D.OFFLINE.indexOf(r.id); if (i === -1) D.OFFLINE.push(r.id); else D.OFFLINE.splice(i, 1); el._cnDraw(); window.D4.snack(T(i === -1 ? 'offlineSaved' : 'offlineRemoved')); }); },
  });
  /* Quantités recalculées : ce qui se compte (pièces, gousses, œufs) est arrondi à l'unité supérieure, le reste au dixième. */
  var scale = function (amount, k) {
    var countable = /^\d+(\s*(gousses?|pièces?|feuilles?|boîtes?))?$/.test(amount.trim());
    return amount.replace(/^(\d+(?:[.,]\d+)?)/, function (n) {
      var v = parseFloat(n.replace(',', '.')) * k;
      return countable ? String(Math.ceil(v - 1e-9)) : (Math.round(v * 10) / 10).toString().replace('.', ',');
    });
  };
  var servingsOf = {};
  CN.define('recipe-ingredients', {
    title: 'Ingrédients de recette', desc: 'Portions modifiables, état de chaque ingrédient lu dans la même vue que le statut (disponible, à vérifier, à acheter + prix, remplacé), substitution acceptée ou refusée explicitement.',
    props: [['recipe', 'id', 'ojja', 'recette'], ['scenario', 'id de scénario', '', 'surcharge de test'], ['accept', 'objet', '', 'acceptations fixées (test)']],
    usedIn: ['fiche recette', 'feuille « tous les ingrédients » du mode cuisine', 'scenarios.html'], example: { recipe: 'ojja' }, i18nRender: true, demoRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), m = view(r, p), det = D.DETAILS[r.id] || { amounts: {} }, sv = servingsOf[r.id] || r.servings, k = sv / r.servings, fixed = !!p.accept;
      var rows = r.ingredients.map(function (id) {
        var amt = det.amounts[id] ? scale(det.amounts[id], k) : '', sub = m.subs[id], isMiss = m.missing.indexOf(id) !== -1, isRep = m.replaced.indexOf(id) !== -1, isVer = m.verify.indexOf(id) !== -1;
        var where = isRep || isMiss ? (D.OUT.indexOf(id) !== -1 ? T('outInFridge') : T('notInFridge')) + (D.PRICE[id] && isMiss ? ' · ' + h.money(D.PRICE[id][0]) + ' – ' + h.money(D.PRICE[id][1]) + ' DT' : '') :
          isVer ? T('inFridgeUnknown') : (D.FRIDGE[id] ? T('inFridge', { x: D.FRIDGE[id] }) : T('inFridgeYes'));
        var state = isRep ? '<span class="ing sub">🔁 ' + tk('replacedTag') + '</span>' : isMiss ? '<span class="ing miss">🛒 <span data-i18n="toBuy"></span></span>' : isVer ? '<span class="ing verify">? <span data-i18n="toVerify"></span></span>' : '<span class="ing have"><span aria-hidden="true">✓</span><span class="sr-only" data-i18n="haveIng"></span></span>';
        var subHtml = '';
        if (sub) {
          if (!sub.possible) subHtml = '<span class="sub-note">🔁 ' + esc(T('subByMissing', { x: list(sub.by) })) + '</span>';
          else if (sub.state === 'accepted') subHtml = '<span class="sub-note">🔁 ' + esc(T('subChosen')) + ' : ' + esc(list(sub.by)) + '</span>' + (fixed ? '' : '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:6px" data-sub-reset="' + id + '">' + tk('undo') + '</button>');
          else if (sub.state === 'refused') subHtml = '<span class="sub-note" style="color:var(--ink-muted)">' + esc(T('subRefused')) + '</span>' + (fixed ? '' : '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:6px" data-sub-reset="' + id + '">' + tk('undo') + '</button>');
          else subHtml = '<span class="sub-note">🔁 ' + esc(T('subBy', { x: list(sub.by) })) + '</span>' + (fixed ? '' : '<div class="row" style="gap:6px;margin-top:6px"><button type="button" class="btn btn-secondary btn-sm" data-sub="' + id + '">' + tk('useSub') + '</button><button type="button" class="btn btn-ghost btn-sm" data-sub-no="' + id + '">' + tk('refuseSub') + '</button></div>');
        }
        return '<div class="ri"><span class="thumb" aria-hidden="true">' + ((D.ING[id] || [])[1] || '•') + '</span><div class="grow"><b>' + esc(h.ingName(id)) + '</b><br /><span class="muted" style="font-size:12px">' + esc(where) + '</span>' + subHtml + '</div><span class="amt num">' + esc(amt) + '</span>' + state + '</div>';
      }).join('');
      return '<div class="row" style="justify-content:space-between;margin:var(--sp-2) 0"><span class="muted" style="font-size:13px;font-weight:700">' + tk('qtyFor') + '</span><span class="servings"><button type="button" data-sv="-1" aria-label="' + esc(T('lessPortion')) + '">−</button><b class="num" aria-live="polite">' + esc(T('persN', { n: sv })) + '</b><button type="button" data-sv="1" aria-label="' + esc(T('morePortion')) + '">+</button></span></div>' +
        '<div class="card" style="padding-block:var(--sp-1)">' + rows + '</div>';
    },
    mount: function (el, p) {
      listen(el);
      var r = CN.currentRecipe(p);
      el.querySelectorAll('[data-sv]').forEach(function (b) { b.addEventListener('click', function () { servingsOf[r.id] = Math.max(1, (servingsOf[r.id] || r.servings) + +b.dataset.sv); el._cnDraw(); }); });
      el.querySelectorAll('[data-sub]').forEach(function (b) { b.addEventListener('click', function () { var id = b.dataset.sub; setSub(r, id, 'accepted'); window.D4.snack(T('subSnack', { x: h.ingName(id) }), function () { setSub(r, id, null); }); }); });
      el.querySelectorAll('[data-sub-no]').forEach(function (b) { b.addEventListener('click', function () { setSub(r, b.dataset.subNo, 'refused'); }); });
      el.querySelectorAll('[data-sub-reset]').forEach(function (b) { b.addEventListener('click', function () { setSub(r, b.dataset.subReset, null); }); });
    },
  });
  CN.define('recipe-steps', {
    title: 'Étapes de recette', desc: 'Étapes numérotées, durées en gras, photo seulement si elle aide ; message si la recette n’a pas encore ses étapes.',
    props: [['recipe', 'id', 'ojja', 'recette']], usedIn: ['fiche recette'], example: { recipe: 'chakchouka' }, i18nRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), det = D.DETAILS[r.id];
      if (!det) return '<div class="state-note"><span class="icon" aria-hidden="true">📝</span>' + tk('stepsSoon') + '</div>';
      return '<ol class="card" style="padding-inline-start:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-3);margin:var(--sp-2) 0 0">' + det.steps.map(function (s) {
        return '<li>' + esc(s.t).replace(/(\d+ min)/, '<b>$1</b>') + (s.photo ? '<div class="ph r169" style="margin-top:8px;border-radius:var(--radius-field)" data-fallback="🍳"><img src="' + D.photo(s.photo, 720) + '" alt="" width="720" height="405" loading="lazy" /></div>' : '') + '</li>';
      }).join('') + '</ol>';
    },
  });
  CN.define('recipe-cta', {
    title: 'Barre d’action de recette (collante)', desc: 'Lit la même vue que le statut : manquants → « Ajouter les N manquants » d’abord ; plus de manquant mais une quantité incertaine → « Vérifier puis cuisiner » + rappel de ce qu’il faut vérifier ; prête → « Passer en mode cuisine ».',
    props: [['recipe', 'id', 'ojja', 'recette'], ['scenario', 'id de scénario', '', 'surcharge de test'], ['accept', 'objet', '', 'acceptations fixées (test)'], ['inline', 'booléen', 'false', 'non collant (page de tests)']],
    usedIn: ['fiche recette', 'scenarios.html'], example: { recipe: 'chakchouka', inline: true }, i18nRender: true, demoRender: true,
    render: function (p) {
      var r = CN.currentRecipe(p), m = view(r, p), href = 'mode-cuisine.html?id=' + r.id;
      var btns, note = '', kind = CN.ctaKind(m);
      if (kind === 'buy') btns = '<a class="btn btn-primary" href="courses.html" style="flex:3" data-i18n="' + (m.missing.length === 1 ? 'addMissing1' : 'addMissingN') + '" data-i18n-n="' + m.missing.length + '">' + esc(T(m.missing.length === 1 ? 'addMissing1' : 'addMissingN', { n: m.missing.length })) + '</a><a class="btn btn-secondary" href="' + href + '" style="flex:2" data-i18n="cookStart"></a>';
      else if (kind === 'verify') { btns = '<a class="btn btn-primary" href="' + href + '" style="flex:1">' + tk('verifyThenCook') + '</a>'; note = '<p class="cn-cta-note" role="note">? ' + esc(T('verifyBefore', { x: list(m.verify) })) + '</p>'; }
      else btns = '<a class="btn btn-primary" href="' + href + '" style="flex:1" data-i18n="cookStart"></a>';
      return '<div class="' + (p.inline ? '' : 'cta-dock') + '" style="margin-top:var(--sp-3)"><div style="background:var(--card);border:1px solid var(--line);border-radius:var(--radius-card);box-shadow:var(--shadow-2);padding:var(--sp-2)">' + note + '<div class="row" style="flex-wrap:nowrap">' + btns + '</div></div></div>';
    },
    mount: function (el) { listen(el); },
  });

  /* Action principale selon la vue : acheter d'abord s'il manque quelque chose ; sinon vérifier s'il reste une
     quantité incertaine ; sinon cuisiner. Utilisée par la barre d'action ET par les tests (une seule règle). */
  CN.ctaKind = function (m) { return m.missing.length ? 'buy' : m.verify.length ? 'verify' : 'cook'; };

  CN.define('scenario-tests', {
    title: 'Tests d’affichage de la correspondance (maquette)', desc: 'Pour chaque scénario déclaré (data.js › SCENARIO_TESTS) : attendu écrit à la main vs affiché par les composants (niveau, manquants, à vérifier, action principale). Sert de recette de validation, pas de moteur.',
    props: [], usedIn: ['scenarios.html'], example: {}, i18nRender: true,
    render: function () {
      var ok = 0, rows = D.SCENARIO_TESTS.map(function (t) {
        var m = CN.match(CN.byId[t.recipe], { scenario: t.scenario, accept: t.accept }), kind = CN.ctaKind(m);
        var same = function (a, b) { return a.slice().sort().join() === b.slice().sort().join(); };
        var pass = m.level === t.level && same(m.missing, t.missing) && same(m.verify, t.verify) && kind === t.action;
        if (pass) ok++;
        var cell = function (exp, got) { return '<td>' + esc(exp) + (exp === got ? '' : '<br /><b style="color:var(--danger-text)">≠ ' + esc(got) + '</b>') + '</td>'; };
        return '<tr><td><b>' + t.id + '</b></td><td>' + esc(t.label) + '</td>' + cell(t.level, m.level) + cell(t.missing.join(', ') || '—', m.missing.join(', ') || '—') +
          cell(t.verify.join(', ') || '—', m.verify.join(', ') || '—') + cell(t.action, kind) + '<td style="font-weight:800;color:var(--' + (pass ? 'success' : 'danger') + '-text)">' + (pass ? '✓' : '✗') + '</td></tr>';
      }).join('');
      return '<p class="muted" style="font-weight:800" data-tests-result="' + ok + '/' + D.SCENARIO_TESTS.length + '">' + ok + ' / ' + D.SCENARIO_TESTS.length + ' scénarios conformes</p>' +
        '<div style="overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--card)"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th>#</th><th>Scénario</th><th>Niveau</th><th>Manquants</th><th>À vérifier</th><th>Action</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    },
  });

  /* ---------- Mode cuisine ---------- */
  CN.define('cook-mode', {
    title: 'Mode cuisine', desc: 'Plein écran sans navigation ni publicité : une étape, progression, ingrédients de l’étape, minuteur, feuille « tous les ingrédients », sortie neutre ; reprise à l’étape via #stepN (notification).',
    props: [['recipe', 'id (sinon ?id=)', 'ojja', 'recette']], usedIn: ['mode-cuisine.html'], example: { recipe: 'chakchouka' }, i18nRender: true,
    render: function (p, el) {
      var r = CN.currentRecipe(p), det = D.DETAILS[r.id];
      if (!det) return '<div class="state-note">' + tk('stepsSoon') + '</div>';
      if (el._i == null) el._i = Math.min(Math.max(parseInt((location.hash.match(/step(\d)/) || [])[1] || '1', 10) - 1, 0), det.steps.length - 1);
      var i = el._i, s = det.steps[i], n = det.steps.length, T = window.D4 ? window.D4.t : function (k) { return k; };
      var ing = s.ing.length ? s.ing.map(function (id) { return '<li>' + esc(h.ingName(id)) + (det.amounts[id] ? ' · ' + esc(det.amounts[id]) : '') + '</li>'; }).join('') : '<li>—</li>';
      var fmt = function (x) { var m = Math.floor(x / 60), q = x % 60; return (m < 10 ? '0' : '') + m + ':' + (q < 10 ? '0' : '') + q; };
      return '<header class="cook-topbar"><a class="icon-btn" href="recette.html?id=' + r.id + '" aria-label="Quitter le mode cuisine" data-i18n="cookExit" data-i18n-attr="aria-label"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></a><b style="font-size:15px">' + esc(h.rName(r)) + '</b><button type="button" class="btn btn-ghost btn-sm" data-all data-i18n="allIngredients"></button></header>' +
        '<main class="page-main" style="max-width:640px"><div class="cook"><div><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (i + 1) + '" aria-label="Progression de la préparation"><div style="width:' + ((i + 1) / n * 100) + '%"></div></div>' +
        '<p class="progress-label" aria-live="polite">' + esc(T('stepOf', { i: i + 1, n: n })) + '</p></div>' +
        '<section class="card" aria-live="polite"><p class="steptext" style="margin-top:0">' + esc(s.t) + '</p><p class="muted" style="font-size:12px;font-weight:800;margin:0 0 6px" data-i18n="stepIngredients"></p><ul class="cook-ings">' + ing + '</ul></section>' +
        (s.timer ? '<section class="card" aria-label="Minuteur"><div class="row" style="justify-content:space-between"><span class="timer-display" data-tv>' + fmt(el._left != null && el._ti === i ? el._left : s.timer) + '</span><button type="button" class="btn btn-secondary" data-timer>' + esc(T(el._tick ? 'timerPause' : 'timerStart')) + '</button></div></section>' : '') +
        (s.photo ? '<div class="cook-photo ph r169" data-fallback="🍳"><img src="' + D.photo(s.photo, 720) + '" alt="Étape ' + (i + 1) + '" width="720" height="405" loading="lazy" /></div>' : '') +
        '<div class="row" style="margin-top:auto;flex-wrap:nowrap"><button type="button" class="btn btn-secondary" style="flex:1" data-prev' + (i === 0 ? ' disabled' : '') + '><svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' + esc(T('cookPrev')) + '</button>' +
        '<button type="button" class="btn btn-primary" style="flex:2" data-next>' + esc(el._done ? T('done') : i === n - 1 ? T('finish') + ' ✓' : T('cookNext')) + '</button></div></div></main>';
    },
    mount: function (el, p) {
      var r = CN.currentRecipe(p), det = D.DETAILS[r.id]; if (!det) return;
      var go = function (d) { clearInterval(el._tick); el._tick = null; el._left = null; el._i += d; el._cnDraw(); window.scrollTo(0, 0); };
      var pv = el.querySelector('[data-prev]'); if (pv) pv.addEventListener('click', function () { if (el._i > 0) go(-1); });
      el.querySelector('[data-next]').addEventListener('click', function () { if (el._i < det.steps.length - 1) go(1); else { el._done = true; el._cnDraw(); } });
      var tb = el.querySelector('[data-timer]');
      if (tb) tb.addEventListener('click', function () {
        var s = det.steps[el._i];
        if (el._tick) { clearInterval(el._tick); el._tick = null; el._cnDraw(); return; }
        if (el._left == null || el._ti !== el._i) { el._left = s.timer; el._ti = el._i; }
        el._tick = setInterval(function () {
          el._left = Math.max(0, el._left - 1); var tv = el.querySelector('[data-tv]'); if (tv) tv.textContent = (Math.floor(el._left / 60) < 10 ? '0' : '') + Math.floor(el._left / 60) + ':' + (el._left % 60 < 10 ? '0' : '') + el._left % 60;
          if (!el._left) { clearInterval(el._tick); el._tick = null; el._cnDraw(); window.D4.snack(T('timerDone', { i: el._i + 1 })); }
        }, 1000);
        tb.textContent = window.D4.t('timerPause');
      });
      el.querySelector('[data-all]').addEventListener('click', function (e) {
        var opener = e.currentTarget, ov = document.createElement('div'); ov.className = 'sheet-overlay';
        ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(T('allIngredients')) + '"><div class="grab" aria-hidden="true"></div><div data-c="recipe-ingredients" data-props=\'{"recipe":"' + r.id + '"}\'></div><button type="button" class="btn btn-secondary btn-block" style="margin-top:12px" data-close>' + esc(window.D4.t('settingsClose')) + '</button></div>';
        document.body.appendChild(ov); CN.mountAll(ov); window.D4.refresh(ov);
        var close = function () { ov.remove(); opener.focus(); };
        ov.addEventListener('click', function (ev) { if (ev.target === ov) close(); });
        ov.querySelector('[data-close]').addEventListener('click', close);
        document.addEventListener('keydown', function k(ev) { if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
        ov.querySelector('[data-close]').focus();
      });
    },
  });
})();
