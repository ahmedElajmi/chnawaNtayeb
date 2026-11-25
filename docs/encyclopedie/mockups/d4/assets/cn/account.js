/* Chnawa Ntayeb — composants CMS (v4.5) · familles COURSES, COLLECTIONS (favoris, hors ligne, historique),
   NOTIFICATIONS, PROFIL. Données : data.js (listes, favoris, historique, utilisateur) ; notifications : app.js. */
(function () {
  'use strict';
  var CN = window.CN, h = CN.h, esc = h.esc, tk = h.tk, D = CN.data, T = CN.T, L4 = h.L4;
  var money = h.money, html = document.documentElement;
  var chevron = '<svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true" style="color:var(--ink-muted)"><path d="M9 6l6 6-6 6"/></svg>';

  /* ---------- Courses (v4.6 : opérations réellement interactives, état partagé entre les écrans) ----------
     Une seule source : D.GROCERY, gardée pour la session de démonstration (sessionStorage, repli mémoire) afin que
     « Courses », « Mes listes » et l'accueil montrent la même chose. */
  Object.assign(window.CN_I18N, {
    remainEst: L4('Reste à acheter (estimation)', 'Elli b9a (ta9diri)', 'المتبقي للشراء (تقديري)', 'اللي بقى (تقديري)'),
    listTotal: L4('Total de la liste', 'Majmou3 el liste', 'مجموع القائمة', 'المجموع متاع الليستة'),
    inCartN: L4('Dans le panier ({n})', 'Fel panier ({n})', 'في السلة ({n})', 'في السلّة ({n})'),
    allInCart: L4('Tout est dans le panier.', 'Kol chay fel panier.', 'كل شيء في السلة.', 'كل شي في السلّة.'),
    manageLists: L4('Gérer les listes', 'Organizi el listet', 'إدارة القوائم', 'نظّم الليستات'),
    activeList: L4('Liste active', 'El liste el active', 'القائمة النشطة', 'الليستة النشطة'),
    listEmpty: L4('Cette liste est vide. Ajoutez un article ci-dessous ou depuis une recette.', 'El liste fergha. Zid mada louta walla men recette.', 'هذه القائمة فارغة. أضف عنصراً بالأسفل أو من وصفة.', 'الليستة فارغة. زيد حاجة لوطة ولّا من وصفة.'),
    noLists: L4('Aucune liste pour l’instant.', 'Mazelt famech liste.', 'لا توجد قوائم بعد.', 'مازال ما فمّاش ليستة.'),
    addedBy: L4('ajouté par vous', 'zedtou enti', 'أضفته أنت', 'زدتو انت'),
    itemAdded: L4('« {x} » ajouté à la liste.', '« {x} » tzed lel liste.', 'أُضيف «{x}» إلى القائمة.', '«{x}» تزاد لليستة.'),
    itemExists: L4('« {x} » est déjà dans la liste.', '« {x} » deja fel liste.', '«{x}» موجود في القائمة.', '«{x}» ديجا في الليستة.'),
    itemRemoved: L4('« {x} » retiré de la liste.', '« {x} » tna77a mel liste.', 'أُزيل «{x}» من القائمة.', '«{x}» تنحّى من الليستة.'),
    removeItem: L4('Retirer {x}', 'Na77i {x}', 'إزالة {x}', 'نحّي {x}'),
    boughtN: L4('{d} / {n} achetés', '{d} / {n} techrew', '{d} / {n} تم شراؤها', '{d} / {n} تشراو'),
    active: L4('active', 'active', 'نشطة', 'نشطة'),
    open: L4('Ouvrir', 'Ouvri', 'فتح', 'حلّ'),
    makeActive: L4('Rendre active', 'Rodha active', 'اجعلها نشطة', 'ردّها نشطة'),
    activeChanged: L4('« {x} » est maintenant la liste active.', '« {x} » wallet el liste el active.', '«{x}» هي القائمة النشطة الآن.', '«{x}» ولّات الليستة النشطة.'),
    rename: L4('Renommer', 'Baddel esm', 'إعادة التسمية', 'بدّل الاسم'),
    clearChecked: L4('Vider les cochés', 'Na77i el m3allmin', 'حذف المحدَّد', 'نحّي المعلّمين'),
    clearedN: L4('{n} article(s) acheté(s) retiré(s).', '{n} mada tna77aw.', 'أُزيل {n} عنصر مشترى.', '{n} حاجة تنحّاو.'),
    nothingChecked: L4('Aucun article coché.', 'Famech 7atta mada m3allma.', 'لا يوجد عنصر محدد.', 'ما فمّا حتى حاجة معلّمة.'),
    delete: L4('Supprimer', 'Fasakh', 'حذف', 'فسّخ'),
    cancel: L4('Annuler', 'Batel', 'إلغاء', 'بطّل'),
    save: L4('Enregistrer', 'Sajjel', 'حفظ', 'سجّل'),
    create: L4('Créer', 'A3mel', 'إنشاء', 'اعمل'),
    listName: L4('Nom de la liste', 'Esm el liste', 'اسم القائمة', 'اسم الليستة'),
    nameRequired: L4('Donnez un nom à la liste.', 'A3ti esm lel liste.', 'أدخل اسماً للقائمة.', 'اعطي اسم لليستة.'),
    nameTaken: L4('Une liste porte déjà ce nom.', 'Fama liste b nafs el esm.', 'توجد قائمة بهذا الاسم.', 'فمّا ليستة بنفس الاسم.'),
    deleteListQ: L4('Supprimer la liste « {x} » ?', 'Tfasakh el liste « {x} » ?', 'حذف القائمة «{x}»؟', 'تفسّخ الليستة «{x}» ؟'),
    deleteListLead: L4('Ses {n} article(s) seront perdus. Cette action est définitive.', 'El {n} mada yemchiw. Ma tnajemch traja3ha.', 'ستُفقد عناصرها الـ{n}. هذا الإجراء نهائي.', 'ال{n} حاجة يمشيو. ما تنجمش ترجّعها.'),
    listDeleted: L4('Liste « {x} » supprimée.', 'El liste « {x} » tfaskhet.', 'حُذفت القائمة «{x}».', 'الليستة «{x}» تفسخت.'),
    listCreated: L4('Liste « {x} » créée et rendue active.', 'El liste « {x} » t3amlet w wallet active.', 'أُنشئت القائمة «{x}» وأصبحت نشطة.', 'الليستة «{x}» تعملت وولّات نشطة.'),
    addItemCta: L4('Ajouter', 'Zid', 'إضافة', 'زيد'),
  });
  (function restore() { try { var saved = sessionStorage.getItem('cn-grocery'); if (saved) { D.GROCERY.length = 0; JSON.parse(saved).forEach(function (l) { D.GROCERY.push(l); }); } } catch (e) { /* mode privé : mémoire seule */ } })();
  var gl = [];
  var gChanged = function () { try { sessionStorage.setItem('cn-grocery', JSON.stringify(D.GROCERY)); } catch (e) { /* rien */ } gl.forEach(function (fn) { fn(); }); };
  CN.onGrocery = function (fn) { gl.push(fn); };
  var gListen = function (el) { if (!el._g) { el._g = 1; gl.push(function () { if (document.body.contains(el)) el._cnDraw(); }); } };
  var active = function () { return D.GROCERY.filter(function (l) { return l.active; })[0] || D.GROCERY[0]; };
  var sum = function (arr, k) { return arr.reduce(function (a, i) { return a + (i.price ? i.price[k] : 0); }, 0); };
  var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
  /* Fenêtre de confirmation (ModalShell) : Échap / clic extérieur annulent, focus rendu à l'ouvreur. */
  var confirmBox = function (title, lead, okLabel, onOk, opener) {
    var ov = document.createElement('div'); ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cb-t" aria-describedby="cb-d"><h3 id="cb-t">' + esc(title) + '</h3><p id="cb-d" class="muted" style="margin:0">' + esc(lead) + '</p>' +
      '<div class="foot"><button type="button" class="btn btn-secondary" data-no>' + esc(T('cancel')) + '</button><button type="button" class="btn btn-danger" data-yes>' + esc(okLabel) + '</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); document.removeEventListener('keydown', onKey); if (opener && document.body.contains(opener)) opener.focus(); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-no]').addEventListener('click', close);
    ov.querySelector('[data-yes]').addEventListener('click', function () { close(); onOk(); });
    ov.querySelector('[data-no]').focus();
  };
  CN.confirmBox = confirmBox;

  CN.define('grocery-list', {
    title: 'Liste de courses active', desc: 'Changer de liste, progression (calculée sur la liste complète) ≠ budget (reste / total en fourchette), rayons, ligne entière cliquable, retrait d’un article avec « Annuler », « Dans le panier » replié, liste vide.',
    props: [], usedIn: ['courses.html', 'accueil (aperçu)'], example: {}, i18nRender: true,
    render: function () {
      var l = active();
      if (!l) return '<div class="state-note"><span class="icon" aria-hidden="true">🛒</span>' + tk('noLists') + '<div class="row" style="justify-content:center"><a class="btn btn-primary btn-sm" href="liste-detail.html">' + tk('newList') + '</a></div></div>';
      var done = l.items.filter(function (i) { return i.done; }), todo = l.items.filter(function (i) { return !i.done; });
      var item = function (i) {
        return '<div class="gitem' + (i.done ? ' done' : '') + '"><label class="gitem-main"><input type="checkbox" class="gcheck" data-g="' + i.id + '"' + (i.done ? ' checked' : '') + ' /><span class="grow"><span class="gname" style="font-weight:700">' + esc(i.name) + '</span><br /><span class="gmeta">' + (i.qty ? '<span class="num">' + esc(i.qty) + '</span> · ' : '') + esc(i.why || T('addedBy')) + '</span></span>' +
          '<span class="price-hint num">' + (i.price ? h.money(i.price[0]) + ' – ' + h.money(i.price[1]) : '—') + '</span></label><button type="button" class="icon-btn" data-rm="' + i.id + '" aria-label="' + esc(T('removeItem', { x: i.name })) + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
      };
      var aisles = []; todo.forEach(function (i) { if (aisles.indexOf(i.aisle) === -1) aisles.push(i.aisle); });
      var head = '<div class="row" style="justify-content:space-between;gap:var(--sp-2)"><div class="chips" role="group" aria-label="' + esc(T('activeList')) + '">' + D.GROCERY.map(function (x) { return '<button type="button" class="chip" data-list="' + x.id + '" aria-pressed="' + (x === l) + '">' + esc(x.name) + ' <span class="num" style="font-weight:600">· ' + x.items.length + '</span></button>'; }).join('') + '</div><a class="btn btn-ghost btn-sm" href="liste-detail.html">' + tk('manageLists') + '</a></div>';
      if (!l.items.length) return head + '<div class="state-note" style="margin-top:var(--sp-3)"><span class="icon" aria-hidden="true">🛒</span>' + tk('listEmpty') + '</div>';
      return head + '<section class="card" style="margin-top:var(--sp-3);padding:var(--sp-3)"><div class="row" style="justify-content:space-between"><b data-i18n="progressLabel"></b><b class="num">' + done.length + ' / ' + l.items.length + '</b></div>' +
        '<div class="buy-progress" style="margin-top:6px" role="progressbar" aria-valuemin="0" aria-valuemax="' + l.items.length + '" aria-valuenow="' + done.length + '" aria-label="' + esc(T('progressLabel')) + '"><div style="width:' + Math.round(done.length / l.items.length * 100) + '%"></div></div>' +
        '<div style="margin-top:var(--sp-2)"><div class="budget-line"><span>' + tk('remainEst') + '</span><b class="num">' + h.money(sum(todo, 0)) + ' – ' + h.money(sum(todo, 1)) + ' DT</b></div><div class="budget-line muted"><span>' + tk('listTotal') + '</span><span class="num">' + h.money(sum(l.items, 0)) + ' – ' + h.money(sum(l.items, 1)) + ' DT</span></div></div></section>' +
        '<div class="card" style="margin-top:var(--sp-3);padding-block:var(--sp-1)">' + (todo.length ? aisles.map(function (a) { return '<p class="aisle-title">' + esc(a) + '</p>' + todo.filter(function (i) { return i.aisle === a; }).map(item).join(''); }).join('') : '<div class="state-note" style="border:none">🎉 ' + tk('allInCart') + '</div>') + '</div>' +
        (done.length ? '<details class="card" style="margin-top:var(--sp-3);padding:var(--sp-3)" open><summary style="font-weight:800;cursor:pointer">' + esc(T('inCartN', { n: done.length })) + '</summary>' + done.map(item).join('') + '</details>' : '');
    },
    mount: function (el) {
      gListen(el);
      el.querySelectorAll('[data-g]').forEach(function (c) { c.addEventListener('change', function () { active().items.filter(function (i) { return i.id === c.dataset.g; })[0].done = c.checked; gChanged(); }); });
      el.querySelectorAll('[data-list]').forEach(function (b) { b.addEventListener('click', function () { D.GROCERY.forEach(function (x) { x.active = x.id === b.dataset.list; }); gChanged(); }); });
      el.querySelectorAll('[data-rm]').forEach(function (b) {
        b.addEventListener('click', function () {
          var l = active(), idx = -1; l.items.forEach(function (x, k) { if (x.id === b.dataset.rm) idx = k; });
          var it = l.items.splice(idx, 1)[0]; gChanged();
          window.D4.snack(T('itemRemoved', { x: it.name }), function () { l.items.splice(idx, 0, it); gChanged(); });
        });
      });
    },
  });
  CN.define('grocery-add', {
    title: 'Ajouter un article (au pouce)', desc: 'Champ collé en bas : ajoute à la liste active ; un article déjà présent n’est pas doublé (convention de fusion addGroceryItems) ; champ vide ignoré.',
    props: [], usedIn: ['courses.html'], example: {}, i18nRender: true,
    render: function () { return '<div class="cta-dock"><form class="search cn-add-form" style="max-width:none"><div class="box" style="box-shadow:var(--shadow-2)"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><input type="text" data-i18n="addItem" data-i18n-attr="placeholder" placeholder="' + esc(T('addItem')) + '" aria-label="' + esc(T('addItem')) + '" enterkeyhint="done" autocomplete="off" /><button type="submit" class="btn btn-primary btn-sm">' + tk('addItemCta') + '</button></div></form></div>'; },
    mount: function (el) {
      el.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = el.querySelector('input'), name = inp.value.trim(), l = active(); if (!name || !l) { inp.focus(); return; }
        var ex = l.items.filter(function (i) { return norm(i.name) === norm(name); })[0];
        if (ex) { if (ex.done) { ex.done = false; gChanged(); } window.D4.snack(T('itemExists', { x: ex.name })); }
        else { l.items.unshift({ id: 'u' + Date.now(), name: name.charAt(0).toUpperCase() + name.slice(1), qty: '', aisle: 'Ajouté par vous', why: '', price: null, done: false }); gChanged(); window.D4.snack(T('itemAdded', { x: name })); }
        inp.value = ''; inp.focus();
      });
    },
  });
  CN.define('lists-manager', {
    title: 'Gérer les listes', desc: 'Toutes les listes (progression, reste à acheter) : créer (nom obligatoire, unique), renommer en place, rendre active, vider les cochés (« Annuler »), supprimer (confirmation : irréversible), état vide.',
    props: [], usedIn: ['liste-detail.html'], example: {}, i18nRender: true,
    render: function (p, el) {
      var editing = el._edit, form = function (id, val, err) {
        return '<form class="cn-list-form" data-form="' + id + '"><label class="sr-only" for="lf-' + id + '">' + esc(T('listName')) + '</label><div class="row" style="flex-wrap:nowrap;gap:6px"><input id="lf-' + id + '" class="select" value="' + esc(val) + '" placeholder="' + esc(T('listName')) + '"' + (err ? ' aria-invalid="true" aria-describedby="lfe-' + id + '"' : '') + ' style="flex:1" />' +
          '<button type="submit" class="btn btn-primary btn-sm">' + esc(T(id === 'new' ? 'create' : 'save')) + '</button><button type="button" class="btn btn-ghost btn-sm" data-cancel>' + esc(T('cancel')) + '</button></div>' + (err ? '<p class="error" id="lfe-' + id + '" style="color:var(--danger-text);font-weight:700;font-size:13px;margin:4px 0 0">⚠ ' + esc(err) + '</p>' : '') + '</form>';
      };
      var cards = D.GROCERY.map(function (l) {
        var n = l.items.length, d = l.items.filter(function (i) { return i.done; }).length, todo = l.items.filter(function (i) { return !i.done; });
        var title = editing === l.id ? form(l.id, el._val != null ? el._val : l.name, el._err) : '<b>' + esc(l.name) + '</b>' + (l.active ? ' <span class="flag">' + tk('active') + '</span>' : '');
        return '<section class="card" style="margin-top:var(--sp-3);padding:var(--sp-3)"><div class="grow">' + title + '<br /><span class="muted" style="font-size:12px"><span class="num">' + esc(T('boughtN', { d: d, n: n })) + '</span> · ' + esc(T('remainEst')) + ' <span class="num">' + h.money(sum(todo, 0)) + ' – ' + h.money(sum(todo, 1)) + ' DT</span></span>' +
          '<div class="buy-progress" style="margin-top:6px"><div style="width:' + (n ? Math.round(d / n * 100) : 0) + '%"></div></div></div>' +
          '<div class="row" style="margin-top:var(--sp-2);gap:6px">' + (l.active ? '<a class="btn btn-secondary btn-sm" href="courses.html">' + tk('open') + '</a>' : '<button type="button" class="btn btn-secondary btn-sm" data-act="' + l.id + '">' + tk('makeActive') + '</button>') +
          '<button type="button" class="btn btn-ghost btn-sm" data-ren="' + l.id + '">' + tk('rename') + '</button><button type="button" class="btn btn-ghost btn-sm" data-clear="' + l.id + '">' + tk('clearChecked') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger-text)" data-del="' + l.id + '">' + tk('delete') + '</button></div></section>';
      }).join('');
      return (D.GROCERY.length ? cards : '<div class="state-note" style="margin-top:var(--sp-3)"><span class="icon" aria-hidden="true">🛒</span>' + tk('noLists') + '</div>') +
        '<div style="margin-top:var(--sp-4)">' + (editing === 'new' ? form('new', el._val || '', el._err) : '<button type="button" class="btn btn-primary btn-block" data-new>+ ' + tk('newList') + '</button>') + '</div>';
    },
    mount: function (el) {
      gListen(el);
      var redraw = function () { el._cnDraw(); var i = el.querySelector('.cn-list-form input'); if (i) i.focus(); };
      var find = function (id) { return D.GROCERY.filter(function (x) { return x.id === id; })[0]; };
      var b = el.querySelector('[data-new]'); if (b) b.addEventListener('click', function () { el._edit = 'new'; el._val = ''; el._err = null; redraw(); });
      el.querySelectorAll('[data-ren]').forEach(function (x) { x.addEventListener('click', function () { el._edit = x.dataset.ren; el._val = null; el._err = null; redraw(); }); });
      el.querySelectorAll('[data-act]').forEach(function (x) { x.addEventListener('click', function () { D.GROCERY.forEach(function (l) { l.active = l.id === x.dataset.act; }); gChanged(); window.D4.snack(T('activeChanged', { x: find(x.dataset.act).name })); }); });
      el.querySelectorAll('[data-clear]').forEach(function (x) {
        x.addEventListener('click', function () {
          var l = find(x.dataset.clear), before = l.items.slice(), n = l.items.filter(function (i) { return i.done; }).length;
          if (!n) { window.D4.snack(T('nothingChecked')); return; }
          l.items = l.items.filter(function (i) { return !i.done; }); gChanged();
          window.D4.snack(T('clearedN', { n: n }), function () { l.items = before; gChanged(); });
        });
      });
      el.querySelectorAll('[data-del]').forEach(function (x) {
        x.addEventListener('click', function () {
          var l = find(x.dataset.del);
          confirmBox(T('deleteListQ', { x: l.name }), T('deleteListLead', { n: l.items.length }), T('delete'), function () {
            var wasActive = l.active; D.GROCERY.splice(D.GROCERY.indexOf(l), 1);
            if (wasActive && D.GROCERY[0]) D.GROCERY[0].active = true;
            gChanged(); window.D4.snack(T('listDeleted', { x: l.name }));
          }, x);
        });
      });
      var f = el.querySelector('.cn-list-form');
      if (f) {
        var inp = f.querySelector('input');
        f.addEventListener('submit', function (e) {
          e.preventDefault(); var v = inp.value.trim(), id = f.dataset.form;
          var taken = D.GROCERY.some(function (l) { return l.id !== id && norm(l.name) === norm(v); });
          if (!v || taken) { el._val = v; el._err = T(!v ? 'nameRequired' : 'nameTaken'); redraw(); return; }
          if (id === 'new') { D.GROCERY.forEach(function (l) { l.active = false; }); D.GROCERY.push({ id: 'l' + Date.now(), name: v, active: true, items: [] }); window.D4.snack(T('listCreated', { x: v })); }
          else find(id).name = v;
          el._edit = null; el._err = null; gChanged();
        });
        f.querySelector('[data-cancel]').addEventListener('click', function () { el._edit = null; el._err = null; el._cnDraw(); });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { el._edit = null; el._err = null; el._cnDraw(); } });
      }
    },
  });

  /* ---------- Collections ---------- */
  var HEART = '<path d="M12 21s-7.5-4.6-10-9c-1.8-3.2.4-7 4-7 2.2 0 3.6 1.2 6 3.6C14.4 6.2 15.8 5 18 5c3.6 0 5.8 3.8 4 7-2.5 4.4-10 9-10 9z"/>';
  var chevron = '<svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true" style="color:var(--ink-muted)"><path d="M9 6l6 6-6 6"/></svg>';
  var sec = function (key) { return '<p style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-muted);margin:var(--sp-5) 4px var(--sp-2)">' + tk(key) + '</p>'; };
  CN.define('recipe-collection', {
    title: 'Collection de recettes', desc: 'Favoris ou recettes gardées hors ligne, avec leurs repères (♥ / ⤓) et le score du jour (jamais figé) ; état vide propre à chaque collection.',
    props: [['source', 'favs | offline', 'favs', 'collection']], usedIn: ['favoris.html', 'profil', 'accueil'], example: { source: 'offline' }, i18nRender: true,
    render: function (p) {
      var ids = p.source === 'offline' ? D.OFFLINE : D.FAVS;
      if (!ids.length) return '<div class="state-note"><span class="icon" aria-hidden="true">' + (p.source === 'offline' ? '⤓' : '🤍') + '</span>' + tk(p.source === 'offline' ? 'offlineEmpty' : 'favEmpty') + '</div>';
      return '<div class="rgrid">' + ids.map(function (id) {
        var r = CN.byId[id], c = h.card(r, 'grid'), flags = '<span class="flag-row">' + (D.FAVS.indexOf(id) !== -1 ? '<span class="flag fav"><svg viewBox="0 0 24 24" aria-hidden="true">' + HEART + '</svg>' + tk('flagFav') + '</span>' : '') +
          (D.OFFLINE.indexOf(id) !== -1 ? '<span class="flag off"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>' + tk('flagOff') + '</span>' : '') + '</span>';
        return c.replace('<span class="reason">', flags + '<span class="reason">');
      }).join('') + '</div>';
    },
  });
  CN.define('history-list', {
    title: 'Historique des consultations', desc: 'Recettes vues récemment (local, effaçable), favori depuis la ligne, effacement avec « Annuler ».',
    props: [], usedIn: ['historique.html'], example: {}, i18nRender: true,
    render: function (p, el) {
      if (el._cleared) return '<div class="state-note">' + tk('historyCleared') + '</div>';
      return '<div class="card" style="padding-inline:var(--sp-3)">' + D.HISTORY.map(function (x) {
        var r = CN.byId[x[0]], fav = D.FAVS.indexOf(r.id) !== -1;
        return '<div class="list-item"><a class="cn-row-ph ph" href="recette.html?id=' + r.id + '" data-fallback="' + r.fallback + '" aria-hidden="true" tabindex="-1"><img src="' + r.photo + '" alt="" width="56" height="56" loading="lazy" /></a><div class="grow"><a class="title" href="recette.html?id=' + r.id + '" style="color:var(--ink)">' + esc(h.rName(r)) + '</a><br /><span class="hist-date">' + esc(T(x[1])) + ' · <span class="num">' + esc(x[2]) + '</span></span></div>' +
          '<button type="button" class="fav-mini" data-fav-id="' + r.id + '" aria-pressed="' + fav + '" aria-label="' + esc(T(fav ? 'favRemoveX' : 'favAddX', { x: h.rName(r) })) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + HEART + '</svg></button></div>';
      }).join('') + '</div><button type="button" class="btn btn-secondary" style="margin-top:var(--sp-3)" data-clear>' + tk('clearHistory') + '</button>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-fav-id]').forEach(function (b) { b.addEventListener('click', function () { var id = b.dataset.favId, i = D.FAVS.indexOf(id); if (i === -1) D.FAVS.push(id); else D.FAVS.splice(i, 1); el._cnDraw(); var nb = el.querySelector('[data-fav-id="' + id + '"]'); if (nb) nb.focus(); }); });
      var c = el.querySelector('[data-clear]'); if (c) c.addEventListener('click', function () { el._cleared = true; el._cnDraw(); window.D4.snack(T('historyCleared'), function () { el._cleared = false; el._cnDraw(); }); });
    },
  });

  /* ---------- Notifications (écran mobile ; le panneau desktop utilise le même rendu) ---------- */
  CN.define('notif-center', {
    title: 'Centre de notifications', desc: 'Filtre Toutes / Non lues (boutons à état, même liste), « Tout marquer comme lu » (sans vider la liste), lignes cliquables vers le bon écran, réglages par catégorie. Même source et même rendu que le panneau desktop.',
    props: [], usedIn: ['notifications.html (mobile)', 'panneau sous la cloche (desktop)'], example: {}, i18nRender: true,
    render: function (p, el) {
      var N = window.D4_NOTIFS, f = el._f || 'all', u = N ? N.unreadCount() : 0;
      var prefs = [['pTimer', 'pTimerD', true], ['pMeal', 'pMealD', true], ['pChef', 'pChefD', false], ['pUpdate', 'pUpdateD', true]];
      return '<div class="row" style="justify-content:space-between;align-items:center"><h1 class="page-title" data-i18n="notifBell">Notifications</h1><button type="button" class="btn btn-ghost btn-sm" data-markall' + (u ? '' : ' disabled') + ' data-i18n="markRead"></button></div>' +
        '<span class="seg" role="group" aria-label="' + esc(T('filterNotifs')) + '" style="margin-bottom:var(--sp-3)"><button type="button" aria-pressed="' + (f === 'all') + '" data-f="all">' + tk('filterAll') + '</button><button type="button" aria-pressed="' + (f === 'unread') + '" data-f="unread">' + tk('filterUnread') + (u ? ' <span class="num">(' + u + ')</span>' : '') + '</button></span>' +
        '<section class="card" style="padding:4px" data-list aria-live="polite"></section>' +
        '<section class="card" style="margin-top:var(--sp-4);padding-inline:var(--sp-3)" id="prefs"><h2 style="margin-top:0;font-size:16px">' + tk('notifPrefs') + '</h2>' + prefs.map(function (x) {
          return '<div class="list-item"><span class="grow"><span class="title">' + tk(x[0]) + '</span><br /><span class="muted" style="font-size:12px">' + tk(x[1]) + '</span></span><span class="switch"><input type="checkbox"' + (x[2] ? ' checked' : '') + ' aria-label="' + esc(T(x[0])) + '" /><span class="track"></span></span></div>';
        }).join('') + '</section>';
    },
    mount: function (el) {
      var list = el.querySelector('[data-list]');
      if (window.D4_NOTIFS) window.D4_NOTIFS.render(list, { filter: el._f || 'all' });
      el.querySelectorAll('[data-f]').forEach(function (b) { b.addEventListener('click', function () { el._f = b.dataset.f; el._cnDraw(); var nb = el.querySelector('[data-f="' + el._f + '"]'); if (nb) nb.focus(); }); });
      el.querySelector('[data-markall]').addEventListener('click', function () { window.D4_NOTIFS.markAllRead(); el._cnDraw(); window.D4.snack(T('allReadSnack')); });
      if (!el._b) { el._b = 1; document.addEventListener('d4:notifs', function () { el._cnDraw(); }); }
    },
  });

  /* ---------- Profil ---------- */
  CN.define('profile-header', {
    title: 'En-tête de profil', desc: 'Connecté : avatar, nom, type de compte, téléphone (LTR). Invité : invitation à se connecter (données sur l’appareil).',
    props: [], usedIn: ['profil.html', 'panneau de profil'], example: {}, i18nRender: true,
    render: function () {
      var u = D.USER;
      return '<div data-c="guest-card" data-props=\'{"leadKey":"guestLeadProfile"}\'></div>' +
        '<section data-auth-only="user" style="display:flex;align-items:center;gap:14px;padding:var(--sp-4);border-radius:var(--radius-card);background:var(--tint,var(--surface))"><span class="avatar avatar-lg" aria-hidden="true">' + esc(u.initials) + '</span>' +
        '<span class="grow"><b style="font-size:19px;display:block">' + esc(u.name) + '</b><span class="muted" style="font-size:13px">' + tk('clientAccount') + ' · <span class="num">' + esc(u.phone) + '</span></span></span><button type="button" class="btn btn-secondary btn-sm" data-i18n="edit"></button></section>';
    },
  });
  CN.define('profile-stats', {
    title: 'Chiffres du profil', desc: 'Favoris, recettes cuisinées (suppose un suivi — D-13), ingrédients du frigo. Masqué pour un invité.',
    props: [], usedIn: ['profil.html'], example: {}, i18nRender: true,
    render: function () {
      var cell = function (n, k) { return '<div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center"><b class="num" style="font-size:20px;display:block">' + n + '</b><span style="font-size:12px;color:var(--ink-muted);font-weight:700">' + tk(k) + '</span></div>'; };
      return '<div data-auth-only="user" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:var(--sp-3)">' + cell(D.FAVS.length, 'statFavs') + cell(D.USER.cooked, 'statCooked') + cell(Object.keys(D.FRIDGE).filter(h.available).length, 'statFridge') + '</div>';
    },
  });
  var menuItem = function (href, icon, key, count) { return '<a class="pp-item" href="' + href + '"><span class="notif-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + icon + '</svg></span><span class="grow">' + tk(key) + '</span>' + (count != null ? '<span class="pp-count">' + count + '</span>' : '') + chevron + '</a>'; };
  CN.define('profile-menu', {
    title: 'Mes recettes (menu du profil)', desc: 'Raccourcis vers favoris, hors ligne, historique, listes — compteurs depuis les données.',
    props: [], usedIn: ['profil.html', 'panneau de profil (desktop)'], example: {}, i18nRender: true,
    render: function () {
      return sec('myRecipes') + '<div class="card" style="padding:4px 6px">' + menuItem('favoris.html', HEART, 'favTitle', D.FAVS.length) +
        menuItem('favoris.html', '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', 'keptOffline', D.OFFLINE.length) +
        menuItem('historique.html', '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/>', 'history') +
        menuItem('liste-detail.html', '<path d="M5 8h14l-1.5 12h-11zM8 8V6a4 4 0 0 1 8 0v2"/>', 'myLists', D.GROCERY.length) + '</div>';
    },
  });
  CN.define('profile-settings', {
    title: 'Réglages (profil)', desc: 'Thème, langue (appliqués aussitôt), notifications, installation. Gardés pour un invité.',
    props: [], usedIn: ['profil.html'], example: {}, i18nRender: true,
    render: function () {
      var mode = html.getAttribute('data-mode');
      return sec('settings') + '<div class="card" style="padding:4px var(--sp-3)">' +
        '<div class="pp-row"><span>' + tk('theme') + '</span><span class="seg" role="group" aria-label="' + esc(T('theme')) + '"><button type="button" data-m="light" aria-pressed="' + (mode !== 'dark') + '">' + tk('light') + '</button><button type="button" data-m="dark" aria-pressed="' + (mode === 'dark') + '">' + tk('dark') + '</button></span></div>' +
        '<div class="pp-row" style="border-top:1px solid var(--line)"><label for="p-lang">' + tk('language') + '</label><select id="p-lang" class="select" style="width:auto;min-height:44px">' + [['fr', 'Français'], ['derja', 'Derja'], ['ar', 'العربية'], ['derja_ar', 'دارجة']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === h.lang() ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
        '<a class="pp-item" href="notifications.html#prefs" style="border-top:1px solid var(--line);border-radius:0;padding-inline:0"><span class="grow">' + tk('notifications') + '</span>' + chevron + '</a>' +
        '<div class="pp-row" style="border-top:1px solid var(--line)"><span>' + tk('installApp') + '</span><button type="button" class="btn btn-secondary btn-sm">' + tk('install') + '</button></div></div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-m]').forEach(function (b) { b.addEventListener('click', function () { html.setAttribute('data-mode', b.dataset.m); document.querySelectorAll('.mode-ctl').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.mode === b.dataset.m)); }); el._cnDraw(); }); });
      el.querySelector('#p-lang').addEventListener('change', function (e) { var b = document.querySelector('.lang-ctl[data-lang="' + e.target.value + '"]'); if (b) b.click(); });
    },
  });
  CN.define('food-prefs', {
    title: 'Préférences alimentaires', desc: 'Exclusions appliquées aux suggestions et au menu (fonction à confirmer — D-16).', props: [], usedIn: ['profil.html', 'onboarding (proposition S12)'], example: {}, i18nRender: true,
    render: function () { return sec('foodPrefs') + '<div class="card" style="padding:4px var(--sp-3)"><div class="list-item"><span class="grow"><span class="title">' + tk('noPork') + '</span><br /><span class="muted" style="font-size:12px">' + tk('noPorkD') + '</span></span><span class="switch"><input type="checkbox" aria-label="' + esc(T('noPork')) + '" /><span class="track"></span></span></div></div>'; },
  });
  CN.define('account-actions', {
    title: 'Compte', desc: 'Déconnexion, suppression (confirmation : irréversible). Masqué pour un invité.', props: [], usedIn: ['profil.html'], example: {}, i18nRender: true,
    render: function () { return '<div data-auth-only="user">' + sec('account') + '<div class="card" style="padding:4px 6px"><button type="button" class="pp-item" data-logout style="width:100%;border:none;background:none;font:inherit;font-weight:700;text-align:start"><span class="grow">' + tk('logout') + '</span></button><button type="button" class="pp-item" data-del style="width:100%;border:none;background:none;font:inherit;font-weight:700;text-align:start;color:var(--danger-text);border-top:1px solid var(--line);border-radius:0"><span class="grow">' + tk('deleteAccount') + '</span></button></div></div>'; },
    mount: function (el) {
      el.querySelector('[data-logout]').addEventListener('click', function () { var b = document.querySelector('.auth-ctl[data-v="guest"]'); if (b) b.click(); else html.setAttribute('data-auth', 'guest'); window.D4.snack(T('loggedOut')); });
      el.querySelector('[data-del]').addEventListener('click', function (e) { CN.confirmBox(T('deleteAccountQ'), T('deleteAccountLead'), T('delete'), function () { window.D4.snack(T('accountDeleted')); }, e.currentTarget); });
    },
  });
})();
