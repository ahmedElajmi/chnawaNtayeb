/* Chnawa Ntayeb — maquettes D4 (v4.5) : DÉFINITION DES PAGES (ce qu'enregistrera le moteur CMS).
   Une page = métadonnées (titre, navigation, habillage) + liste ordonnée de blocs { c, props, show? }.
   Générer les fichiers HTML : node tools/generate-pages.mjs */
const anno = (text) => ({ c: 'note', props: { text } });
const HOME_ON = ['filled', 'favs', 'planning', 'grocery'];
const show = (list) => ({ attr: 'data-home-state', in: list });

export const PAGES = [
  {
    file: 'accueil-c.html', title: 'Accueil', nav: 'home', wide: true, adRail: true,
    demo: [{ label: 'Utilisateur', attr: 'data-home-state', def: 'filled', values: [['new', 'Nouveau'], ['empty', 'Frigo vide'], ['filled', 'Frigo rempli'], ['favs', '+ Favoris'], ['planning', '+ Planning'], ['grocery', '+ Courses']] }],
    blocks: [
      { c: 'install-banner' }, { c: 'offline-strip' },
      { c: 'home-greeting', show: show(['empty', ...HOME_ON]) },
      { c: 'home-hero' },
      { c: 'grocery-progress', show: show(['grocery']) },
      { c: 'fridge-peek', show: show(HOME_ON) },
      { c: 'guest-card', props: { compact: true, dismissible: true, leadKey: 'guestLeadHome' }, show: show(HOME_ON) },
      { c: 'shelf', props: { shelf: 'frigo' }, show: show(HOME_ON) },
      { c: 'favorites-strip', show: show(['favs']) },
      { c: 'ad-slot', props: { id: 'home_between_1', format: 'rect' }, show: show(['empty', ...HOME_ON]) },
      { c: 'warm-band', props: { blocks: [
        { c: 'category-rail', props: { mode: 'link', titleKey: 'byCategory' } },
        { c: 'recipe-rail', props: { ids: ['brik', 'malsouka'], eyebrow: 'by chef Souhed', titleKey: 'chefNews' } },
      ] } },
      anno('**Accueil C (validé), entièrement en blocs.** Le héros choisit seul : promesse (nouveau), invitation (frigo vide), idée du soir (première recette prête du moteur) ou repas prévu (planning). Les blocs « catégories » et « étal » sont les mêmes que sur la page Recettes.'),
    ],
  },
  {
    file: 'suggestions.html', title: 'Mes suggestions', nav: 'recipes', wide: true,
    blocks: [
      { c: 'offline-strip' }, { c: 'page-heading', props: { titleKey: 'recipesSuggestionsTab' } },
      { c: 'link-tabs', props: { current: 'suggestions.html', tabs: [{ labelKey: 'recipesAllTab', href: 'recherche.html' }, { labelKey: 'recipesSuggestionsTab', href: 'suggestions.html' }, { labelKey: 'favTitle', href: 'favoris.html' }] } },
      { c: 'fridge-peek', props: { variant: 'recap' } }, { c: 'how-ranked' },
      { c: 'level-section', props: { level: 'ready', limit: 4 } },
      { c: 'level-section', props: { level: 'almost', limit: 4 } },
      { c: 'level-section', props: { level: 'discover', limit: 2 } },
      { c: 'ad-slot', props: { id: 'suggestions_after_levels', format: 'infeed' } },
      anno('Niveaux et nombres **calculés** par le moteur de démonstration depuis data.js (1 / 2 / 12). Publicité placée **après** le dernier niveau (recommandation D-10).'),
    ],
  },
  {
    file: 'recette.html', title: 'Recette', nav: 'recipes', back: 'suggestions.html', bottomPad: 140,
    demo: [{ label: 'Scénario', attr: 'data-scenario', def: 'base', values: [['base', 'Frigo démo'], ['merguezOk', 'Merguez achetée'], ['pimentKnown', 'Piment connu'], ['noPiment', 'Plus de piment']] }],
    headerActions: '<button class="icon-btn" data-fav aria-pressed="true" aria-label="Retirer des favoris" data-i18n="favRemove" data-i18n-attr="aria-label"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9c-1.8-3.2.4-7 4-7 2.2 0 3.6 1.2 6 3.6C14.4 6.2 15.8 5 18 5c3.6 0 5.8 3.8 4 7-2.5 4.4-10 9-10 9z"/></svg></button>',
    blocks: [
      { c: 'offline-strip' }, { c: 'recipe-hero' }, { c: 'recipe-facts' }, { c: 'recipe-status' }, { c: 'recipe-actions' },
      { c: 'tabs', props: { tabs: [{ labelKey: 'ingredients', c: 'recipe-ingredients' }, { labelKey: 'steps', c: 'recipe-steps' }] } },
      { c: 'ad-slot', props: { id: 'recipe_after_content_1', format: 'infeed' } },
      { c: 'recipe-cta' },
      anno('**Une seule page pour toutes les recettes** : recette.html?id=… (essayez ?id=chakchouka, ?id=kosksi, ?id=brik). Les cartes de tout le site y mènent.'),
    ],
  },
  { file: 'mode-cuisine.html', title: 'Mode cuisine', chrome: 'none', blocks: [{ c: 'cook-mode' }] },
  {
    file: 'frigo.html', title: 'Mon Frigo', nav: 'fridge', bottomPad: 120,
    demo: [{ label: 'Frigo', attr: 'data-fridge', def: 'small', hash: { big: 'big' }, values: [['small', '9 ingrédients'], ['big', '64 ingrédients']] }],
    blocks: [
      { c: 'offline-strip' }, { c: 'page-heading', props: { titleKey: 'fridgeTitle' } }, { c: 'fridge-add' }, { c: 'fridge-inventory', props: { size: 'demo' } },
      anno('**Un seul composant d’inventaire** pour 9 comme pour 64 ingrédients : recherche, catégories, Liste / Mosaïque, tri et « Voir les N autres » apparaissent au-delà de 12 éléments.'),
    ],
  },
  {
    file: 'courses.html', title: 'Courses', nav: 'grocery', bottomPad: 150,
    blocks: [{ c: 'offline-strip' }, { c: 'page-heading', props: { titleKey: 'groceryTitle' } }, { c: 'grocery-list' }, { c: 'grocery-add' },
      anno('Progression et budget **calculés** depuis la liste (data.js) ; cocher une ligne met tout à jour.')],
  },
  { file: 'liste-detail.html', title: 'Mes listes', nav: 'grocery', back: 'courses.html', blocks: [{ c: 'page-heading', props: { titleKey: 'myLists' } }, { c: 'lists-manager' }] },
  {
    file: 'favoris.html', title: 'Favoris', nav: 'recipes', wide: true,
    blocks: [
      { c: 'page-heading', props: { titleKey: 'favTitle' } },
      { c: 'link-tabs', props: { current: 'favoris.html', tabs: [{ labelKey: 'recipesAllTab', href: 'recherche.html' }, { labelKey: 'recipesSuggestionsTab', href: 'suggestions.html' }, { labelKey: 'favTitle', href: 'favoris.html' }] } },
      { c: 'guest-card', props: { compact: true, leadKey: 'guestLeadFavs' } },
      { c: 'tabs', props: { tabs: [{ labelKey: 'favTitle', c: 'recipe-collection', props: { source: 'favs' } }, { labelKey: 'favOffline', c: 'recipe-collection', props: { source: 'offline' } }] } },
      anno('Deux notions distinctes : ♥ favori (collection) et ⤓ gardée hors ligne (téléchargée). Une recette peut être les deux (Ojja).'),
    ],
  },
  { file: 'historique.html', title: 'Historique', nav: 'recipes', back: 'profil.html', blocks: [{ c: 'page-heading', props: { titleKey: 'history', lead: { fr: 'Recettes consultées récemment — gardées sur cet appareil, effaçables.', derja: 'El maklet elli chofthom — mkhabbyin fel appareil, tnajem tfaskhhom.', ar: 'الوصفات التي شاهدتها مؤخراً — محفوظة على هذا الجهاز وقابلة للمسح.', derja_ar: 'الماكلات اللي شفتهم — مخبّيين في الجهاز، تنجم تفسخهم.' } } }, { c: 'history-list' }] },
  { file: 'notifications.html', title: 'Notifications', back: 'accueil-c.html', blocks: [{ c: 'notif-center' }, anno('**Mobile** : écran dédié. **Desktop** : la cloche ouvre un panneau (même source, même rendu) avec « Voir toutes » qui mène ici.')] },
  {
    file: 'profil.html', title: 'Profil', back: 'accueil-c.html',
    blocks: [{ c: 'profile-header' }, { c: 'profile-stats' }, { c: 'profile-menu' }, { c: 'profile-settings' }, { c: 'food-prefs' }, { c: 'account-actions' },
      anno('Profil à la place de Réglages (D-23). Invité : en-tête remplacé par l’invitation, chiffres et compte masqués, réglages gardés.')],
  },
  { file: 'scan.html', title: 'Photo du frigo', chrome: 'flow', flowTitleKey: 'scanTitle', close: 'frigo.html', narrow: 560, blocks: [{ c: 'scan-flow' }] },
  { file: 'connexion.html', title: 'Connexion', back: 'accueil-c.html', blocks: [{ c: 'auth-form' }] },
  { file: 'bienvenue.html', title: 'Bienvenue', chrome: 'bare', blocks: [{ c: 'welcome-flow' }] },
  { file: 'onboarding.html', title: 'Remplir mon frigo', chrome: 'flow', back: 'bienvenue.html', blocks: [{ c: 'page-heading', props: { titleKey: 'onbTitle', lead: { fr: 'Ajoutez ce que vous avez déjà — c’est ce qui rend les suggestions utiles.', derja: 'Zid elli 3andek — hedha elli ykhalli el ekhtiyarat behyin.', ar: 'أضف ما لديك — هذا ما يجعل الاقتراحات مفيدة.', derja_ar: 'زيد اللي عندك — هذا اللي يخلّي الاقتراحات باهية.' } } }, { c: 'fridge-onboarding' }] },
  {
    file: 'recherche.html', title: 'Recettes', nav: 'recipes', wide: true,
    blocks: [
      { c: 'page-heading', props: { titleKey: 'navRecipes' } },
      { c: 'link-tabs', props: { current: 'recherche.html', tabs: [{ labelKey: 'recipesAllTab', href: 'recherche.html' }, { labelKey: 'recipesSuggestionsTab', href: 'suggestions.html' }, { labelKey: 'favTitle', href: 'favoris.html' }] } },
      { c: 'search-box' }, { c: 'filter-sentence' },
      { c: 'panel', props: { titleKey: 'useWhat', c: 'ingredient-filter', collapsedOnMobile: true } },
      { c: 'quick-filters' }, { c: 'active-filters' },
      { c: 'category-rail', props: { mode: 'filter', titleKey: 'byCategory' } },
      { c: 'recipe-views', props: { view: 'shelves' } },
      anno('F1 (phrase), F2 (ingrédients) et F3 (puces + feuille) écrivent dans **le même état** ; R1 / R2 / R3 affichent le même résultat.'),
    ],
  },
  {
    file: 'planning.html', title: 'Menu de la semaine', nav: 'planning', wide: true,
    blocks: [
      { c: 'page-heading', props: { titleKey: 'planningTitle', lead: { fr: 'Semaine du 3 au 9 mars · glissez un repas vers un autre créneau (ordinateur) ou utilisez « ⋮ › Déplacer ».', derja: 'Jom3a men 3 l 9 mars · jor el makla l blasa okhra walla esta3mel « ⋮ › Baddel blasa ».', ar: 'أسبوع 3 إلى 9 مارس · اسحب وجبة إلى موعد آخر أو استخدم «⋮ › نقل».', derja_ar: 'جمعة من 3 ل 9 مارس · جرّ الماكلة لبلاصة أخرى ولّا استعمل «⋮ › بدّل البلاصة».' } } },
      { c: 'plan-tools' }, { c: 'week-strip' }, { c: 'plan-summary' }, { c: 'shelf', props: { shelf: 'frigo' } },
      anno('P1 + P3. Résumé **calculé** : 5 repas · 11 achats · 37,40 – 48,40 DT. 🚩 Ramadan, restes et portions = règles métier à confirmer (D-29).'),
    ],
  },
  {
    file: 'carrousel.html', title: 'Carrousel horizontal', wide: true,
    blocks: [
      { c: 'page-heading', props: { title: 'Composant · carrousel horizontal (.rail)', lead: 'Défilement au doigt sur mobile ; flèches au milieu des bords sur desktop, seulement s’il reste du contenu caché.' } },
      { c: 'note', props: { text: '**Cas 1 · avec défilement** — 16 catégories puis 7 recettes.' } },
      { c: 'category-rail', props: { mode: 'link', title: '16 catégories' } },
      { c: 'recipe-rail', props: { ids: ['chakchouka', 'ojja', 'mechouia', 'kosksi', 'lablabi', 'marqa', 'brik'], title: '7 recettes' } },
      { c: 'note', props: { text: '**Cas 2 · sans défilement** — 5 catégories : aucune flèche sur desktop.' } },
      { c: 'category-rail', props: { mode: 'link', title: '5 catégories', limit: 5 } },
    ],
  },
  {
    file: 'scenarios.html', title: 'Scénarios de correspondance', wide: true,
    blocks: [
      { c: 'page-heading', props: { title: 'Scénarios de correspondance (tests d’affichage)', lead: 'La maquette n’implémente pas le moteur : elle affiche des résultats déclarés (data.js). Cette page vérifie que score, niveau, statut et action principale restent cohérents, y compris avec une substitution acceptée ou refusée, un ingrédient épuisé et une quantité inconnue.' } },
      { c: 'scenario-tests' },
      { c: 'note', props: { text: '**T2 · substitution acceptée** — il reste la merguez à acheter ; le piment reste à vérifier.' } },
      { c: 'recipe-status', props: { recipe: 'ojja', scenario: 'base', accept: {"harissa":"accepted"} } },
      { c: 'recipe-cta', props: { recipe: 'ojja', scenario: 'base', accept: {"harissa":"accepted"}, inline: true } },
      { c: 'note', props: { text: '**T5 · cas de référence** — plus rien à acheter, mais le piment n’a pas de quantité : jamais « prête », action « Vérifier puis cuisiner ».' } },
      { c: 'recipe-status', props: { recipe: 'ojja', scenario: 'merguezOk', accept: {"harissa":"accepted"} } },
      { c: 'recipe-cta', props: { recipe: 'ojja', scenario: 'merguezOk', accept: {"harissa":"accepted"}, inline: true } },
      { c: 'note', props: { text: '**T6 · quantité de piment connue** — tout est là : « Prête à cuisiner », action « Passer en mode cuisine ».' } },
      { c: 'recipe-status', props: { recipe: 'ojja', scenario: 'pimentKnown', accept: {"harissa":"accepted"} } },
      { c: 'recipe-cta', props: { recipe: 'ojja', scenario: 'pimentKnown', accept: {"harissa":"accepted"}, inline: true } },
      { c: 'note', props: { text: '**T7 · plus de piment** — le remplacement est impossible : la harissa reste à acheter.' } },
      { c: 'recipe-status', props: { recipe: 'ojja', scenario: 'noPiment', accept: {"harissa":"accepted"} } },
      { c: 'recipe-cta', props: { recipe: 'ojja', scenario: 'noPiment', accept: {"harissa":"accepted"}, inline: true } },
      { c: 'recipe-ingredients', props: { recipe: 'ojja', scenario: 'merguezOk', accept: { harissa: 'accepted' } } },
    ],
  },
];
