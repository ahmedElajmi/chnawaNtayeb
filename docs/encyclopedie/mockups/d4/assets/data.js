/* =============================================================
   Chnawa Ntayeb — maquettes D4 (v4.4) : DONNÉES DE DÉMONSTRATION UNIQUES
   Une seule source pour tous les composants (comme le ferait le CMS / la
   base) : ingrédients, frigo, recettes, catégories, étals, planning.
   Aucun composant ne contient de données ; il reçoit des props et lit ici.
   Photos : temporaires (Wikimedia Commons).
   ============================================================= */
(function () {
  'use strict';
  var P = function (f, w) { return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f).replace(/'/g, '%27') + '?width=' + (w || 480); };

  /* Ingrédients référencés par les recettes (id → nom, catégorie d'origine, emoji de repli). */
  var ING = {
    tomates: ['Tomates', '🍅'], poivrons: ['Poivrons', '🫑'], oignons: ['Oignons', '🧅'], carottes: ['Carottes', '🥕'], ail: ['Ail', '🧄'],
    oeufs: ['Œufs', '🥚'], coriandre: ['Coriandre', '🌿'], huile: ['Huile d’olive', '🫒'], piment: ['Piment vert', '🌶️'], harissa: ['Harissa', '🥫'],
    merguez: ['Merguez', '🥩'], thon: ['Thon', '🐟'], semoule: ['Semoule', '🌾'], agneau: ['Agneau', '🥩'], poischiches: ['Pois chiches', '🫘'],
    courgettes: ['Courgettes', '🥒'], navets: ['Navets', '🥔'], painrassis: ['Pain rassis', '🍞'], cumin: ['Cumin', '🫙'], citron: ['Citron', '🍋'],
    brik: ['Feuilles de brik', '🫓'], persil: ['Persil', '🌿'], capres: ['Câpres', '🫙'], poulet: ['Poulet', '🍗'], concentre: ['Tomate concentrée', '🥫'],
    curcuma: ['Curcuma', '🫙'], fromage: ['Fromage râpé', '🧀'], beurre: ['Beurre', '🧈'], mloukhia: ['Poudre de mloukhia', '🫙'], boeuf: ['Bœuf', '🥩'],
    laurier: ['Laurier', '🌿'], tabel: ['Tabel', '🫙'], farine: ['Farine', '🌾'], levure: ['Levure', '🫙'], pdt: ['Pommes de terre', '🥔'],
    olives: ['Olives', '🫒'], bsissa: ['Bsissa', '🌾'], sucre: ['Sucre', '🍬'], dattes: ['Dattes', '🌴'], amandes: ['Amandes', '🌰'], lait: ['Lait', '🥛'],
    pateDattes: ['Pâte de dattes', '🌴'], fleur: ['Eau de fleur d’oranger', '🌸'], miel: ['Miel', '🍯'], cannelle: ['Cannelle', '🫙'],
    dorade: ['Dorade', '🐟'], frik: ['Frik', '🌾'], celeri: ['Céleri', '🥬'], concombre: ['Concombre', '🥒'],
  };

  /* Frigo canonique : 9 disponibles (piment sans quantité) + harissa épuisée. */
  var FRIDGE = {
    tomates: '2 kg', poivrons: '2', oignons: '5', carottes: '3', ail: '1 tête', oeufs: '6', coriandre: '1 botte', huile: '1 l', piment: null,
  };
  var OUT = ['harissa'];

  var CATS = [
    ['kosksi', 'Kosksi', 'Couscous aux légumes, kédid, Tunisie, 2020.jpg', '🍛'], ['ojja', 'Ojja', 'Ojja, Tunisia.JPG', '🥘'],
    ['marqa', 'Marqa', 'MarqaPoulet.jpg', '🍲'], ['tajines', 'Tajines', 'Tajine tunisien, 2019.jpg', '🥧'],
    ['soupes', 'Soupes et chorba', 'Chorba tunisienne شوربة تونسية.jpg', '🥣'], ['salades', 'Salades', 'Tunisian Salad.jpg', '🥗'],
    ['briks', 'Briks et feuilletés', 'Tunisian Briks.JPG', '🥟'], ['poissons', 'Poissons', 'Poisson grillé - Sayada - Tunisie.jpg', '🐟'],
    ['grillades', 'Grillades', 'Méchoui sardines sur Kanoun, Tunisie .jpg', '🔥'], ['mloukhia', 'Mloukhia et mijotés', 'Mloukhia 1.JPG', '🍲'],
    ['street', 'Street food', 'Fricassé, Tunisie, 19 mars 2020.jpg', '🥪'], ['pains', 'Pains et crêpes', 'Pain Tabouna, Lamta Tunisie, mai 2013.jpg', '🫓'],
    ['petitdej', 'Petit-déjeuner', 'Bsissa 02.JPG', '☕'], ['douceurs', 'Douceurs', 'Makroudh Pâtisserie tunisienne 01.jpg', '🥮'],
    ['beignets', 'Beignets', 'Bambalouni 07.JPG', '🍩'], ['rapide', 'Prêt en 30 min', 'Shakshuka Dish.jpg', '⏱'],
  ].map(function (c) { return { id: c[0], name: c[1], photo: P(c[2], 240), fallback: c[3] }; });

  /* Recettes : temps en minutes, prix par personne (fourchette, DT), plat = plat | entree | dessert. */
  var R = function (id, name, ar, photo, fb, prep, cook, diff, pmin, pmax, course, cats, tags, ing, extra) {
    var r = { id: id, name: name, name_ar: ar, photo: P(photo), photoLarge: P(photo, 1024), fallback: fb, prep: prep, cook: cook, time: prep + cook,
      difficulty: diff, priceMin: pmin, priceMax: pmax, course: course, cats: cats, tags: tags, ingredients: ing, servings: 4 };
    if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; });
    return r;
  };
  var RECIPES = [
    R('chakchouka', 'Chakchouka', 'شكشوكة', 'Shakshuka Dish.jpg', '🍳', 10, 20, 'facile', 1.6, 2.1, 'plat', ['ojja', 'rapide'], ['rapide', 'budget', 'vegetarien'], ['tomates', 'poivrons', 'oignons', 'ail', 'oeufs', 'huile']),
    R('ojja', 'Ojja merguez', 'عجة مرقاز', 'Ojja merguez photo1 عجة مرقاز.jpg', '🥘', 10, 25, 'facile', 3.4, 4.2, 'plat', ['ojja'], ['budget'], ['tomates', 'oignons', 'ail', 'oeufs', 'huile', 'piment', 'merguez', 'harissa'], { subs: { harissa: 'piment + ail' } }),
    R('mechouia', 'Salade mechouia', 'سلاطة مشوية', 'SaladeMechouia 2013.JPG', '🥗', 15, 20, 'facile', 2.1, 2.8, 'entree', ['salades'], ['budget', 'ramadan'], ['poivrons', 'tomates', 'piment', 'ail', 'huile', 'oeufs', 'thon']),
    R('kosksi', 'Kosksi aux légumes', 'كسكسي بالخضرة', 'Couscous aux légumes, kédid, Tunisie, 2020.jpg', '🍛', 30, 60, 'moyen', 4.2, 5.4, 'plat', ['kosksi'], ['vendredi', 'recevoir'], ['semoule', 'agneau', 'carottes', 'oignons', 'tomates', 'poischiches', 'courgettes', 'navets', 'harissa'], { subs: { agneau: 'poulet' } }),
    R('lablabi', 'Lablabi', 'لبلابي', 'Lablabi.jpg', '🍲', 15, 30, 'facile', 1.4, 1.9, 'plat', ['soupes', 'street'], ['budget', 'vegetarien'], ['poischiches', 'painrassis', 'cumin', 'harissa', 'ail', 'huile', 'oeufs', 'citron']),
    R('brik', 'Brik à l’œuf', 'بريك بالعظم', 'Tunisian Briks.JPG', '🥟', 15, 10, 'moyen', 1.6, 2.2, 'entree', ['briks', 'rapide'], ['rapide', 'ramadan'], ['brik', 'oeufs', 'thon', 'persil', 'capres', 'citron', 'huile']),
    R('marqa', 'Marqa au poulet', 'مرقة دجاج', 'MarqaPoulet.jpg', '🍲', 15, 40, 'facile', 3.1, 3.9, 'plat', ['marqa', 'mloukhia'], ['recevoir'], ['poulet', 'oignons', 'concentre', 'poischiches', 'curcuma', 'persil', 'huile']),
    R('malsouka', 'Tajine malsouka', 'طاجين ملسوقة', 'Tajine malsouka.JPG', '🥧', 25, 35, 'moyen', 2.9, 3.6, 'plat', ['tajines', 'briks'], ['recevoir', 'ramadan'], ['oeufs', 'poulet', 'fromage', 'brik', 'persil', 'oignons', 'beurre']),
    R('mloukhia', 'Mloukhia', 'ملوخية', 'Mloukhia 1.JPG', '🍲', 20, 180, 'moyen', 4.6, 5.8, 'plat', ['mloukhia'], ['vendredi', 'recevoir'], ['mloukhia', 'boeuf', 'huile', 'ail', 'laurier', 'tabel', 'cumin']),
    R('fricasse', 'Fricassé', 'فريكاسي', 'Fricassé, Tunisie, 19 mars 2020.jpg', '🥪', 90, 10, 'moyen', 1.2, 1.7, 'plat', ['street', 'pains'], ['budget'], ['farine', 'levure', 'thon', 'oeufs', 'pdt', 'olives', 'harissa', 'huile']),
    R('bsissa', 'Bsissa', 'بسيسة', 'Bsissa 02.JPG', '☕', 5, 0, 'facile', 0.8, 1.2, 'dessert', ['petitdej', 'rapide'], ['rapide', 'budget', 'ramadan', 'vegetarien'], ['bsissa', 'huile', 'sucre', 'dattes', 'amandes', 'lait']),
    R('makroudh', 'Makroudh', 'مقروض', 'Makroudh Pâtisserie tunisienne 01.jpg', '🥮', 60, 30, 'difficile', 1.0, 1.5, 'dessert', ['douceurs'], ['ramadan', 'recevoir', 'vegetarien'], ['semoule', 'pateDattes', 'huile', 'fleur', 'miel', 'cannelle']),
    R('poisson', 'Dorade grillée', 'حوت مشوي', 'Poisson grillé - Sayada - Tunisie.jpg', '🐟', 10, 20, 'facile', 6.5, 8.5, 'plat', ['poissons', 'grillades', 'rapide'], ['rapide', 'recevoir'], ['dorade', 'citron', 'ail', 'huile', 'persil', 'cumin']),
    R('chorba', 'Chorba frik', 'شربة فريك', 'Chorba tunisienne شوربة تونسية.jpg', '🥣', 15, 45, 'facile', 2.4, 3.0, 'entree', ['soupes'], ['ramadan', 'vendredi'], ['frik', 'agneau', 'concentre', 'oignons', 'celeri', 'poischiches', 'harissa', 'huile']),
    R('slata', 'Salade tunisienne', 'سلاطة تونسية', 'Tunisian Salad.jpg', '🥗', 15, 0, 'facile', 1.8, 2.4, 'entree', ['salades', 'rapide'], ['rapide', 'budget', 'ramadan'], ['tomates', 'concombre', 'oignons', 'poivrons', 'huile', 'thon', 'oeufs', 'olives', 'citron']),
  ];

  /* Étals (R1) = requêtes enregistrées, gérées dans /admin › Étals par le chef (le CMS les ordonne). */
  var SHELVES = [
    { id: 'frigo', title: 'Avec ce que j’ai', i18n: 'shelfFridge', query: { levels: ['ready', 'almost'] }, sort: 'match' },
    { id: 'rapide', title: 'Prêt en 30 min', i18n: 'shelfQuick', query: { maxTime: 30 }, sort: 'time' },
    { id: 'vendredi', title: 'Plats du vendredi', i18n: 'shelfFriday', query: { tag: 'vendredi' } },
    { id: 'budget', title: 'Petit budget (≤ 2,50 DT / pers.)', i18n: 'shelfBudget', query: { maxPrice: 2.5 }, sort: 'price' },
    { id: 'ramadan', title: 'Pour le Ramadan', i18n: 'shelfRamadan', query: { tag: 'ramadan' } },
    { id: 'recevoir', title: 'Pour recevoir', i18n: 'shelfGuests', query: { tag: 'recevoir' } },
    { id: 'douceurs', title: 'Douceurs et petit-déjeuner', i18n: 'shelfSweet', query: { course: 'dessert' } },
  ];

  /* Planning de la semaine (P1) : semaine du 3 mars, aujourd'hui = lundi. */
  var PLAN = {
    today: 0,
    days: ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'],
    meals: [
      { day: 0, slot: 1, recipe: 'ojja', servings: 4 },
      { day: 1, slot: 0, recipe: 'mechouia', servings: 2 },
      { day: 2, slot: 1, recipe: 'lablabi', servings: 4 },
      { day: 4, slot: 0, recipe: 'kosksi', servings: 6, note: 'Toute la famille' },
      { day: 5, slot: 1, recipe: 'chakchouka', servings: 3 },
    ],
  };


  /* ---------- v4.5 : données de tous les écrans (une seule source) ---------- */
  /* Prix indicatifs d'un achat (DT, fourchette) pour les ingrédients manquants. */
  var PRICE = { merguez: [7.2, 8.8], harissa: [1.5, 2.2], thon: [2.8, 3.5], poischiches: [1.4, 1.9], painrassis: [0.4, 0.6], cumin: [0.8, 1.2], citron: [0.9, 1.4],
    semoule: [1.6, 2.0], agneau: [18.8, 24.0], courgettes: [1.2, 1.6], navets: [0.8, 1.2] };

  /* Détail des recettes (quantités pour 4, étapes). Les recettes sans détail affichent « étapes à venir ». */
  var DETAILS = {
    ojja: {
      amounts: { tomates: '3', oignons: '1', ail: '3 gousses', oeufs: '4', huile: '3 c. à s.', piment: '2', merguez: '400 g', harissa: '1 c. à s.' },
      steps: [
        { t: 'Faites revenir l’oignon émincé et l’ail dans l’huile d’olive, 3 min.', ing: ['oignons', 'ail', 'huile'], timer: 180 },
        { t: 'Ajoutez les tomates râpées, la harissa et le piment. Laissez mijoter 10 min.', ing: ['tomates', 'harissa', 'piment'], timer: 600 },
        { t: 'Ajoutez la merguez coupée en tronçons, laissez cuire 8 min.', ing: ['merguez'], timer: 480, photo: 'Ojja, Tunisia.JPG' },
        { t: 'Cassez les œufs sur la sauce, couvrez 5 min à feu doux.', ing: ['oeufs'], timer: 300 },
        { t: 'Servez chaud avec du pain tabouna.', ing: [], timer: 0 },
      ],
    },
    /* v4.6 : échantillon représentatif — mijoté (kosksi, avec variante), entrée (mechouia, quantité à vérifier),
       dessert / petit-déjeuner express (bsissa), recette rapide (brik). Quantités pour 4 personnes. */
    kosksi: {
      amounts: { semoule: '500 g', agneau: '600 g', carottes: '3', oignons: '1', tomates: '2', poischiches: '150 g', courgettes: '2', navets: '2', harissa: '1 c. à s.' },
      steps: [
        { t: 'Faites revenir l’agneau en morceaux avec l’oignon émincé au fond du couscoussier, 8 min.', ing: ['agneau', 'oignons'], timer: 480 },
        { t: 'Ajoutez les tomates râpées, la harissa et 1,5 l d’eau, puis portez à ébullition.', ing: ['tomates', 'harissa'], timer: 0 },
        { t: 'Ajoutez les carottes, les navets et les pois chiches trempés la veille ; laissez mijoter 30 min.', ing: ['carottes', 'navets', 'poischiches'], timer: 1800 },
        { t: 'Mouillez la semoule et faites-la cuire à la vapeur au-dessus du bouillon, 20 min.', ing: ['semoule'], timer: 1200 },
        { t: 'Ajoutez les courgettes au bouillon pour les 15 dernières minutes.', ing: ['courgettes'], timer: 900 },
        { t: 'Arrosez la semoule de bouillon, disposez la viande et les légumes dessus, servez.', ing: [], timer: 0, photo: 'Couscous merguez, kedid, Tunisie 2021.jpg' },
      ],
    },
    mechouia: {
      amounts: { poivrons: '4', tomates: '3', piment: '2', ail: '2 gousses', huile: '4 c. à s.', oeufs: '2', thon: '1 boîte' },
      steps: [
        { t: 'Grillez poivrons, tomates et piments sur la flamme ou sous le gril, 20 min, en les retournant.', ing: ['poivrons', 'tomates', 'piment'], timer: 1200, photo: 'Préparation de la salade mechouia sur feu, Tunisie 2025 (01).jpg' },
        { t: 'Enfermez-les 10 min dans un saladier couvert, puis pelez-les et épépinez-les.', ing: [], timer: 600 },
        { t: 'Faites cuire les œufs durs 10 min.', ing: ['oeufs'], timer: 600 },
        { t: 'Hachez finement les légumes au couteau avec l’ail, salez.', ing: ['ail'], timer: 0 },
        { t: 'Arrosez d’huile d’olive, décorez d’œufs en quartiers et de thon émietté.', ing: ['huile', 'oeufs', 'thon'], timer: 0 },
      ],
    },
    bsissa: {
      amounts: { bsissa: '200 g', huile: '4 c. à s.', sucre: '3 c. à s.', dattes: '8', amandes: '40 g', lait: '2 verres' },
      steps: [
        { t: 'Versez la bsissa dans un bol et ajoutez le sucre.', ing: ['bsissa', 'sucre'], timer: 0 },
        { t: 'Ajoutez l’huile d’olive peu à peu en mélangeant, jusqu’à une pâte souple.', ing: ['huile'], timer: 0 },
        { t: 'Détendez avec le lait pour une version à boire, ou gardez la pâte à tartiner.', ing: ['lait'], timer: 0 },
        { t: 'Servez avec les dattes et les amandes.', ing: ['dattes', 'amandes'], timer: 0 },
      ],
    },
    brik: {
      amounts: { brik: '4 feuilles', oeufs: '4', thon: '1 boîte', persil: '½ botte', capres: '1 c. à s.', citron: '1', huile: 'pour la friture' },
      steps: [
        { t: 'Mélangez le thon émietté, le persil haché et les câpres.', ing: ['thon', 'persil', 'capres'], timer: 0 },
        { t: 'Posez une feuille, garnissez d’un quart de la farce et cassez un œuf au centre.', ing: ['brik', 'oeufs'], timer: 0 },
        { t: 'Repliez en triangle et faites frire 2 min par face dans l’huile bien chaude.', ing: ['huile'], timer: 120 },
        { t: 'Égouttez sur du papier et servez aussitôt avec un quartier de citron.', ing: ['citron'], timer: 0 },
      ],
    },
    chakchouka: {
      amounts: { tomates: '4', poivrons: '2', oignons: '1', ail: '2 gousses', oeufs: '4', huile: '3 c. à s.' },
      steps: [
        { t: 'Faites fondre l’oignon et les poivrons en lanières dans l’huile, 8 min.', ing: ['oignons', 'poivrons', 'huile'], timer: 480 },
        { t: 'Ajoutez l’ail et les tomates en dés, salez, mijotez 10 min.', ing: ['ail', 'tomates'], timer: 600 },
        { t: 'Creusez 4 puits, cassez-y les œufs, couvrez 5 min.', ing: ['oeufs'], timer: 300 },
        { t: 'Servez aussitôt, avec du pain.', ing: [], timer: 0 },
      ],
    },
  };

  /* Listes de courses : la liste active et ses articles (prix en fourchette, rayon, provenance). */
  var GROCERY = [
    { id: 'weekend', name: 'Week-end', active: true, items: [
      { id: 'g1', name: 'Harissa', qty: '1 pot', aisle: 'Épicerie', why: 'pour Ojja merguez · épuisée au frigo', price: [1.5, 2.2], done: false },
      { id: 'g2', name: 'Pois chiches', qty: '400 g', aisle: 'Épicerie', why: 'pour Lablabi (mercredi)', price: [1.4, 1.9], done: false },
      { id: 'g3', name: 'Citrons', qty: '3', aisle: 'Fruits et légumes', why: 'pour Lablabi (mercredi)', price: [0.9, 1.4], done: false },
      { id: 'g4', name: 'Pain tabouna', qty: '2', aisle: 'Boulangerie', why: 'ajouté par vous', price: [0.8, 1.2], done: false },
      { id: 'g5', name: 'Merguez', qty: '400 g', aisle: 'Boucherie', why: 'pour Ojja merguez', price: [7.2, 8.8], done: true },
      { id: 'g6', name: 'Thon', qty: '1 boîte', aisle: 'Épicerie', why: 'pour Salade mechouia', price: [2.8, 3.5], done: true },
    ] },
    { id: 'ramadan', name: 'Ramadan', active: false, items: [
      { id: 'r1', name: 'Dattes deglet nour', qty: '1 kg', aisle: 'Fruits et légumes', why: 'pour la rupture du jeûne', price: [9, 12], done: false },
      { id: 'r2', name: 'Frik', qty: '500 g', aisle: 'Épicerie', why: 'pour Chorba frik', price: [2.4, 3.2], done: false },
      { id: 'r3', name: 'Agneau', qty: '800 g', aisle: 'Boucherie', why: 'pour Chorba frik', price: [22, 27], done: false },
      { id: 'r4', name: 'Feuilles de brik', qty: '2 paquets', aisle: 'Épicerie', why: 'pour Brik à l’œuf', price: [2.4, 3], done: false },
      { id: 'r5', name: 'Thon', qty: '2 boîtes', aisle: 'Épicerie', why: 'pour Brik à l’œuf', price: [5.6, 7], done: false },
      { id: 'r6', name: 'Persil', qty: '2 bottes', aisle: 'Fruits et légumes', why: 'pour Brik et Chorba', price: [1, 1.6], done: false },
      { id: 'r7', name: 'Citrons', qty: '6', aisle: 'Fruits et légumes', why: 'pour Brik à l’œuf', price: [1.8, 2.8], done: false },
      { id: 'r8', name: 'Lait', qty: '2 l', aisle: 'Crèmerie', why: 'pour Bsissa', price: [2.7, 3.2], done: false },
      { id: 'r9', name: 'Bsissa', qty: '500 g', aisle: 'Épicerie', why: 'pour Bsissa', price: [3.5, 4.5], done: false },
      { id: 'r10', name: 'Amandes', qty: '200 g', aisle: 'Épicerie', why: 'pour Bsissa', price: [4, 5.2], done: false },
      { id: 'r11', name: 'Céleri', qty: '1 botte', aisle: 'Fruits et légumes', why: 'pour Chorba frik', price: [0.8, 1.2], done: false },
      { id: 'r12', name: 'Pois chiches', qty: '400 g', aisle: 'Épicerie', why: 'pour Chorba frik', price: [1.4, 1.9], done: false },
    ] },
  ];

  var FAVS = ['ojja', 'mechouia'];
  var OFFLINE = ['ojja', 'lablabi'];
  var HISTORY = [['ojja', 'todayLower', '18:24'], ['mechouia', 'yesterday', '19:02'], ['kosksi', 'saturday', '12:41'], ['chakchouka', 'friday', '20:10']]; /* [recette, jour (clé i18n), heure] */
  var USER = { name: 'Amine B.', initials: 'AB', phone: '+216 22 123 456', kind: 'Compte client', cooked: 23 };

  /* Grand frigo (64 disponibles + épuisés) : « cat:nom:quantité », quantité vide = sans quantité, « ! » = épuisé. */
  var BIG_FRIDGE = 'veg:Tomates:2 kg|veg:Poivrons:2|veg:Oignons:5|veg:Carottes:3|veg:Pommes de terre:2 kg|veg:Courgettes:4|veg:Aubergines:2|veg:Concombre:1|veg:Navets:3|veg:Potiron:1 kg|veg:Fenouil:|veg:Céleri:1 botte|veg:Petits pois:500 g|veg:Fèves:!|' +
    'fruit:Citrons:6|fruit:Oranges:1 kg|fruit:Pommes:4|fruit:Bananes:5|fruit:Dattes:500 g|fruit:Grenade:2|fruit:Raisins secs:|fruit:Fraises:!|' +
    'meat:Poulet:1,2 kg|meat:Agneau:800 g|meat:Merguez:400 g|meat:Viande hachée:500 g|meat:Kédid:|meat:Foie:!|' +
    'fish:Thon (boîte):3|fish:Sardines:500 g|fish:Crevettes:|' +
    'dairy:Œufs:6|dairy:Lait:1 l|dairy:Lben:1 l|dairy:Rigouta:250 g|dairy:Beurre:250 g|dairy:Fromage râpé:|dairy:Yaourts:4|' +
    'grocery:Semoule:1 kg|grocery:Pâtes:500 g|grocery:Riz:1 kg|grocery:Pois chiches:400 g|grocery:Lentilles:500 g|grocery:Huile d’olive:1 l|grocery:Tomate concentrée:2|grocery:Farine:1 kg|grocery:Sucre:1 kg|grocery:Feuilles de brik:10|grocery:Câpres:|grocery:Olives:200 g|grocery:Vinaigre:1 bouteille|' +
    'spice:Harissa:!|spice:Piment vert:|spice:Cumin:|spice:Carvi:|spice:Tabel:|spice:Curcuma:|spice:Paprika:|spice:Poivre noir:|spice:Sel:|spice:Cannelle:|' +
    'herb:Coriandre:1 botte|herb:Persil:1 botte|herb:Menthe:|herb:Thym:|herb:Ail:1 tête|' +
    'bread:Pain tabouna:2|bread:Mlewi:4';
  var FRIDGE_CATS = { veg: ['Légumes', '🥕'], fruit: ['Fruits', '🍋'], meat: ['Viandes', '🥩'], fish: ['Poissons', '🐟'], dairy: ['Laitiers et œufs', '🥚'],
    grocery: ['Épicerie', '🫙'], spice: ['Épices', '🌶️'], herb: ['Herbes', '🌿'], bread: ['Pains', '🫓'] };
  /* Petit frigo canonique, rangé par catégorie d'affichage. */
  var SMALL_FRIDGE_LAYOUT = { veg: ['tomates', 'poivrons', 'oignons', 'carottes'], dairy: ['oeufs'], grocery: ['huile'], spice: ['ail', 'coriandre', 'piment', 'harissa'] };

  /* Onboarding : ids d'ingrédients (noms traduits à l'affichage). */
  var ONBOARDING = [['catVeg', ['tomates', 'oignons', 'poivrons', 'carottes'], ['tomates']], ['catBase', ['oeufs', 'huile', 'semoule'], ['oeufs']], ['catSpices', ['piment', 'ail', 'coriandre', 'harissa'], ['piment']]];
  var SCAN = { photo: 'Open refrigerator with food at night.jpg', proposals: [
    { id: 'courgettes', emoji: '🥒', sure: true, on: true }, { id: 'citron', emoji: '🍋', sure: true, on: true },
    { id: 'concombre', emoji: '🥬', sure: false, on: true, alternatives: ['concombre', 'courgettes', 'poivrons', 'other'] },
    { id: 'tomates', emoji: '🍅', sure: true, on: false, dup: true } ] };
  var WELCOME = [
    { kind: 'hero', photo: 'Couscous aux légumes, kédid, Tunisie, 2020.jpg' },
    { kind: 'values', items: [['🧊', 'welcomeFridge', 'welcomeV1'], ['🍽️', 'welcomeSuggest', 'welcomeV2'], ['🛒', 'welcomeGrocery', 'welcomeV3']] },
    { kind: 'setup' } ];


  /* ---------- v4.6 : RÉSULTATS DE CORRESPONDANCE DÉCLARÉS (la maquette n'implémente pas le moteur) ----------
     Pour chaque recette, ce que le moteur de src/core renverrait pour le frigo de démonstration :
     have = présents avec quantité · verify = présents SANS quantité (à vérifier) · missing = absents ou épuisés ·
     subs = substitutions proposables (ingrédient manquant → ingrédients qui le remplacent).
     Les composants AFFICHENT ces résultats ; seule la règle d'affichage du niveau (D-02) est appliquée côté maquette. */
  var STATES = {
    chakchouka: { have: ['tomates', 'poivrons', 'oignons', 'ail', 'oeufs', 'huile'], verify: [], missing: [] },
    ojja: { have: ['tomates', 'oignons', 'ail', 'oeufs', 'huile'], verify: ['piment'], missing: ['merguez', 'harissa'], subs: {harissa: ['piment','ail']} },
    mechouia: { have: ['poivrons', 'tomates', 'ail', 'huile', 'oeufs'], verify: ['piment'], missing: ['thon'] },
    kosksi: { have: ['carottes', 'oignons', 'tomates'], verify: [], missing: ['semoule', 'agneau', 'poischiches', 'courgettes', 'navets', 'harissa'], subs: {agneau: ['poulet']} },
    lablabi: { have: ['ail', 'huile', 'oeufs'], verify: [], missing: ['poischiches', 'painrassis', 'cumin', 'harissa', 'citron'] },
    brik: { have: ['oeufs', 'huile'], verify: [], missing: ['brik', 'thon', 'persil', 'capres', 'citron'] },
    marqa: { have: ['oignons', 'huile'], verify: [], missing: ['poulet', 'concentre', 'poischiches', 'curcuma', 'persil'] },
    malsouka: { have: ['oeufs', 'oignons'], verify: [], missing: ['poulet', 'fromage', 'brik', 'persil', 'beurre'] },
    mloukhia: { have: ['huile', 'ail'], verify: [], missing: ['mloukhia', 'boeuf', 'laurier', 'tabel', 'cumin'] },
    fricasse: { have: ['oeufs', 'huile'], verify: [], missing: ['farine', 'levure', 'thon', 'pdt', 'olives', 'harissa'] },
    bsissa: { have: ['huile'], verify: [], missing: ['bsissa', 'sucre', 'dattes', 'amandes', 'lait'] },
    makroudh: { have: ['huile'], verify: [], missing: ['semoule', 'pateDattes', 'fleur', 'miel', 'cannelle'] },
    poisson: { have: ['ail', 'huile'], verify: [], missing: ['dorade', 'citron', 'persil', 'cumin'] },
    chorba: { have: ['oignons', 'huile'], verify: [], missing: ['frik', 'agneau', 'concentre', 'celeri', 'poischiches', 'harissa'] },
    slata: { have: ['tomates', 'oignons', 'poivrons', 'huile', 'oeufs'], verify: [], missing: ['concombre', 'thon', 'olives', 'citron'] },
  };
  /* Scénarios de test d'affichage (fiche recette et page scenarios.html) : surcharges déclarées, jamais calculées. */
  var SCENARIOS = {
    base: { label: 'Frigo de démonstration', states: {} },
    merguezOk: { label: 'Merguez achetée (seule la harissa manque)', states: { ojja: { have: ['tomates', 'oignons', 'ail', 'oeufs', 'huile', 'merguez'], verify: ['piment'], missing: ['harissa'], subs: { harissa: ['piment', 'ail'] } } } },
    pimentKnown: { label: 'Merguez achetée + quantité de piment connue', states: { ojja: { have: ['tomates', 'oignons', 'ail', 'oeufs', 'huile', 'merguez', 'piment'], verify: [], missing: ['harissa'], subs: { harissa: ['piment', 'ail'] } } } },
    noPiment: { label: 'Plus de piment (remplacement impossible)', states: { ojja: { have: ['tomates', 'oignons', 'ail', 'oeufs', 'huile'], verify: [], missing: ['piment', 'merguez', 'harissa'], subs: { harissa: ['piment', 'ail'] } } } },
  };

  /* Tests d'affichage (P0) : pour chaque cas, ce que l'écran DOIT montrer. Vérifiés en direct par scenarios.html. */
  var SCENARIO_TESTS = [
    { id: 'T1', recipe: 'ojja', scenario: 'base', accept: {}, label: 'Ojja, frigo de démonstration (harissa épuisée, piment sans quantité)', level: 'almost', missing: ['merguez', 'harissa'], verify: ['piment'], action: 'buy' },
    { id: 'T2', recipe: 'ojja', scenario: 'base', accept: { harissa: 'accepted' }, label: 'Substitution harissa → piment + ail ACCEPTÉE', level: 'almost', missing: ['merguez'], verify: ['piment'], action: 'buy' },
    { id: 'T3', recipe: 'ojja', scenario: 'base', accept: { harissa: 'refused' }, label: 'Substitution REFUSÉE', level: 'almost', missing: ['merguez', 'harissa'], verify: ['piment'], action: 'buy' },
    { id: 'T4', recipe: 'ojja', scenario: 'merguezOk', accept: {}, label: 'Merguez achetée, substitution pas encore choisie', level: 'almost', missing: ['harissa'], verify: ['piment'], action: 'buy' },
    { id: 'T5', recipe: 'ojja', scenario: 'merguezOk', accept: { harissa: 'accepted' }, label: 'Cas de référence : merguez achetée + substitution acceptée, piment sans quantité', level: 'almost', missing: [], verify: ['piment'], action: 'verify' },
    { id: 'T6', recipe: 'ojja', scenario: 'pimentKnown', accept: { harissa: 'accepted' }, label: 'Même cas, quantité de piment connue', level: 'ready', missing: [], verify: [], action: 'cook' },
    { id: 'T7', recipe: 'ojja', scenario: 'noPiment', accept: { harissa: 'accepted' }, label: 'Plus de piment : remplacement impossible (l’acceptation est ignorée)', level: 'almost', missing: ['piment', 'merguez', 'harissa'], verify: [], action: 'buy' },
    { id: 'T8', recipe: 'chakchouka', scenario: 'base', accept: {}, label: 'Chakchouka : tout présent, quantités connues', level: 'ready', missing: [], verify: [], action: 'cook' },
    { id: 'T9', recipe: 'mechouia', scenario: 'base', accept: {}, label: 'Salade mechouia : 1 manquant + piment à vérifier', level: 'almost', missing: ['thon'], verify: ['piment'], action: 'buy' },
  ];
  window.CN_DATA = { ING: ING, FRIDGE: FRIDGE, OUT: OUT, CATS: CATS, RECIPES: RECIPES, SHELVES: SHELVES, PLAN: PLAN, photo: P,
    PRICE: PRICE, DETAILS: DETAILS, GROCERY: GROCERY, FAVS: FAVS, OFFLINE: OFFLINE, HISTORY: HISTORY, USER: USER,
    BIG_FRIDGE: BIG_FRIDGE, STATES: STATES, SCENARIOS: SCENARIOS, SCENARIO_TESTS: SCENARIO_TESTS, FRIDGE_CATS: FRIDGE_CATS, SMALL_FRIDGE_LAYOUT: SMALL_FRIDGE_LAYOUT, ONBOARDING: ONBOARDING, SCAN: SCAN, WELCOME: WELCOME };
})();
