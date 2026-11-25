/* =============================================================
   Chnawa Ntayeb — maquettes D4 (base D3, audit UX/UI du 17/11/2026) : bascules et interactions
   Direction (A/B/FK) · Mode (clair/sombre) · Langue (limitée au contenu
   réellement traduit de chaque page, attribut data-langs sur <html>) ·
   Largeur (resserrement du cadre — les VRAIES fenêtres sont dans
   responsive.html).
   Interactions SIMULÉES implémentées ici (niveau « simulé », distinct
   du comportement fonctionnel réel qui sera testé en 2.8+) :
   - ModalShell : ouverture, Échap, clic extérieur, retour du focus ;
   - recherche : flèches + Entrée + Échap (combobox ARIA) ;
   - onglets : navigation clavier ARIA (flèches, Home/End) ;
   - pagination : « Afficher la suite » charge de vrais éléments de démo.
   Textes : chaînes RÉELLES de l'application (src/shared/i18n).
   Fichier de démonstration — aucun impact sur src/.
   ============================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var LANGS = {
    fr: { label: 'Français', dir: 'ltr', htmlLang: 'fr' },
    derja: { label: 'Derja', dir: 'ltr', htmlLang: 'ar-TN' },
    ar: { label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
    derja_ar: { label: 'دارجة', dir: 'rtl', htmlLang: 'aeb' },
  };

  /* Chaînes réelles de l'application (src/shared/i18n/translations.ts + derjaArabic.ts). */
  var I18N = {
    navHome: { fr: 'Accueil', derja: 'El Accueil', ar: 'الرئيسية', derja_ar: 'الأكاي' },
    navFridge: { fr: 'Mon Frigo', derja: 'El Frigo', ar: 'ثلاجتي', derja_ar: 'الفريجيدار' },
    navRecipes: { fr: 'Recettes', derja: 'Maklet', ar: 'الوصفات', derja_ar: 'ماكلات' },
    navWeekly: { fr: 'Menu Semaine', derja: 'Menu Jom3a', ar: 'قائمة الأسبوع', derja_ar: 'منيو الجمعة' },
    navGrocery: { fr: 'Courses', derja: 'Qadhya', ar: 'المشتريات', derja_ar: 'قضية' },
    fridgeTitle: {
      fr: "Qu'avez-vous dans le frigo ?",
      derja: 'Chnowa 3andi fel frigo ?',
      ar: 'ماذا يوجد في ثلاجتك؟',
      derja_ar: 'شنوة عندي في الفريجيدار ؟',
    },
    groceryTitle: {
      fr: 'Liste de Courses (Qadhya)',
      derja: 'Liste el Qadhya',
      ar: 'قائمة المشتريات',
      derja_ar: 'ليستة القضية',
    },
    searchPlaceholder: {
      fr: 'Rechercher un ingrédient (tomates, œufs, oignons...)',
      derja: 'Lawwej 3la ingrédient (tmatem, 3dham, batata...)',
      ar: 'ابحث عن مكوّن (طماطم، بيض، بصل...)',
      derja_ar: 'لوّج على مكوّن (طماطم، عظم، بطاطا...)',
    },
    recipesAllTab: {
      fr: 'Toutes les recettes',
      derja: 'Maklet el kol',
      ar: 'كل الوصفات',
      derja_ar: 'الماكلات الكل',
    },
    recipesSuggestionsTab: {
      fr: 'Mes suggestions',
      derja: 'Ekhtiyarati',
      ar: 'اقتراحاتي',
      derja_ar: 'اختياراتي',
    },
    selectedIngredientsTitle: {
      fr: 'Mon frigo',
      derja: 'Frigo mte3i',
      ar: 'ثلاجتي',
      derja_ar: 'الفريجيدار متاعي',
    },
    emptySlot: { fr: 'Aucun plat choisi', derja: 'Mazelt fergha', ar: 'لم يُختر أي طبق', derja_ar: 'مازالت فارغة' },
    emptyGrocery: {
      fr: 'Votre liste de courses est vide. Ajoutez des recettes au menu pour la remplir !',
      derja: 'Liste fergha ! Zid maklet mel planning walla zid bi yeddek.',
      ar: 'قائمة مشترياتك فارغة. أضف وصفات إلى قائمة الأسبوع لملئها!',
      derja_ar: 'الليستة فارغة ! زيّد ماكلة من المنيو ولا زيدها بيدك.',
    },
    offlineNotice: {
      fr: 'Mode Hors-Ligne activé — Les recettes sauvegardées restent accessibles sans connexion !',
      derja: 'Khaddem Hors-Ligne — el maklet elli msajla tekhdem sans connexion !',
      ar: 'وضع عدم الاتصال مفعل — الوصفات المحفوظة متوفرة دائماً!',
      derja_ar: 'خدّام من غير كونكسيون — الماكلات المسجّلة تخدم من غير إنترنت !',
    },
    errorNetwork: {
      fr: 'Connexion internet indisponible.',
      derja: 'Ma famech connexion internet.',
      ar: 'الاتصال بالإنترنت غير متوفر.',
      derja_ar: 'ما فمّاش كونكسيون إنترنت.',
    },
    updateAvailable: {
      fr: 'Nouvelle version disponible',
      derja: 'Version jdida mawjouda',
      ar: 'يتوفر إصدار جديد',
      derja_ar: 'فرسيون جديدة موجودة',
    },
    addToFavorites: {
      fr: 'Ajouter aux favoris',
      derja: 'Zidha fel Favoris',
      ar: 'أضف إلى المفضلة',
      derja_ar: 'زيدها للمفضّلة',
    },
    boSave: { fr: 'Enregistrer les modifications', derja: '3addi w Sajjel', ar: 'حفظ التغييرات', derja_ar: 'سجّل' },
    boCancel: { fr: 'Annuler', derja: 'Batel', ar: 'إلغاء', derja_ar: 'بطّل' },
    settingsClose: { fr: 'Fermer', derja: 'Sakker', ar: 'إغلاق', derja_ar: 'سكّر' },
    /* Chaînes de démonstration des champs (traduites pour la maquette ; en production elles
       viennent de src/shared/i18n — les libellés métier sont traduits dans l'app réelle). */
    fieldRecipeLabel: { fr: 'Nom de la recette', derja: 'Esma mte3 el makla', ar: 'اسم الوصفة', derja_ar: 'اسمة متاع الماكلة' },
    fieldHelpVisible: { fr: 'Visible par le public après publication.', derja: 'Tban lel public ba3d el publication.', ar: 'يظهر للجمهور بعد النشر.', derja_ar: 'تبان للناس بعد النشر.' },
    fieldQty: { fr: 'Quantité', derja: 'Qadd', ar: 'الكمية', derja_ar: 'قدّ' },
    fieldQtyError: { fr: 'La quantité doit être positive.', derja: 'El qadd lezmha positive.', ar: 'يجب أن تكون الكمية موجبة.', derja_ar: 'القدّ لازمو موجب.' },
    fieldTel: { fr: 'Téléphone (E.164)', derja: 'Telephone (E.164)', ar: 'الهاتف (E.164)', derja_ar: 'التليفون (E.164)' },
    fieldTelHelp: { fr: 'Le numéro reste LTR même quand la page est RTL.', derja: 'El number yod5ol LTR hatta ki el page RTL.', ar: 'يظهر الرقم من اليسار حتى مع اتجاه اليمين.', derja_ar: 'النمرة توفقى LTR حتى كي الصفحة RTL.' },
    /* Chaînes des pages complètes (démonstration ; en production elles viennent de src/shared/i18n). */
    heroTagline: { fr: "Qu'est-ce qu'on cuisine aujourd'hui ?", derja: 'Chnowa netaybou lyoum ?', ar: 'ماذا نطبخ اليوم؟', derja_ar: 'شنوة نطيبو اليوم؟' }, /* v4 [L-04] : « ar » était en derja */
    heroCta: { fr: 'Voir mes suggestions', derja: 'Chouf ekhtiyarati', ar: 'شاهد اقتراحاتي', derja_ar: 'شوف اختياراتي' },
    secSuggest: { fr: 'Suggestions pour votre frigo', derja: 'Sugjestions mte3 el frigo', ar: 'اقتراحات ثلاجتك', derja_ar: 'اقتراحات متاع الفريجيدار' },
    secNew: { fr: 'Nouveautés du chef', derja: 'Jdid mte3 el chef', ar: 'جديد الشيف', derja_ar: 'جديد متاع الشيف' },
    secCats: { fr: 'Par catégorie', derja: 'Bil category', ar: 'حسب الفئة', derja_ar: 'بالكيطيغوري' },
    searchRecipePh: { fr: 'Rechercher une recette (ojja, couscous…)', derja: 'Lawwej 3la makla (ojja, kosksi…)', ar: 'ابحث عن وصفة (أجّة، كسكسي…)', derja_ar: 'لوّج على ماكلة (أجّة، كسكسي…)' },
    filters: { fr: 'Filtres', derja: 'Filtres', ar: 'مرشّحات', derja_ar: 'فيلترات' },
    sortBy: { fr: 'Trier', derja: 'Rattib', ar: 'ترتيب', derja_ar: 'رتّب' },
    fCat: { fr: 'Catégorie', derja: 'Category', ar: 'الفئة', derja_ar: 'الكيطيغوري' },
    fDuration: { fr: 'Durée', derja: 'Wa9t', ar: 'الوقت', derja_ar: 'الوقت' },
    fPrice: { fr: 'Prix', derja: 'Prix', ar: 'السعر', derja_ar: 'الثمن' },
    sortPop: { fr: 'Populaires', derja: 'Machhoura', ar: 'الأكثر رواجاً', derja_ar: 'المشهورة' },
    sortFast: { fr: 'Les plus rapides', derja: 'El asra3', ar: 'الأسرع', derja_ar: 'الأسرع' },
    sortCheap: { fr: 'Les moins chères', derja: 'Erkhas', ar: 'الأرخص', derja_ar: 'الأرخص' },
    resultsCount: { fr: '128 recettes · 24 affichées', derja: '128 maklet · 24 mbayna', ar: '128 وصفة · 24 معروضة', derja_ar: '128 ماكلة · 24 مبيّنة' },
    addIngredient: { fr: 'Ajouter un ingrédient', derja: 'Zid ingridyen', ar: 'أضف مكوّناً', derja_ar: 'زيد مكوّن' },
    removeIng: { fr: 'Retirer', derja: 'Na77i', ar: 'إزالة', derja_ar: 'نحّي' },
    presence: { fr: 'Présence (stock)', derja: 'Presence (stock)', ar: 'توفّر (مخزون)', derja_ar: 'توفّر (ستوك)' },
    qtyVerify: { fr: 'Quantité à vérifier', derja: 'Qadd tetvérifi', ar: 'كمية يجب التحقق منها', derja_ar: 'قدّ لازم تتثبّت' },
    catVeg: { fr: 'Légumes', derja: '3odhma', ar: 'خضروات', derja_ar: 'خضرة' },
    catMeat: { fr: 'Viandes', derja: 'L7am', ar: 'لحوم', derja_ar: 'لحوم' },
    catSpices: { fr: 'Épices', derja: 'Bharat', ar: 'توابل', derja_ar: 'بهارات' },
    catBase: { fr: 'Base', derja: 'Base', ar: 'أساسيات', derja_ar: 'أساسيات' },
    readyToCook: { fr: 'Prête à cuisiner', derja: 'Wajda lel tayeb', ar: 'جاهزة للطهي', derja_ar: 'واجدة للطب' },
    almostReady: { fr: 'Presque prête', derja: 'Qrib wajda', ar: 'شبه جاهزة', derja_ar: 'قريبة واجدة' },
    toDiscover: { fr: 'À découvrir', derja: 'Bech tetkechef', ar: 'لاكتشاف', derja_ar: 'باش تكتشفها' },
    haveIng: { fr: 'Dans votre frigo', derja: 'Fel frigo mte3ek', ar: 'في ثلاجتك', derja_ar: 'في الفريجيدار متاعك' },
    needBuy: { fr: 'À acheter', derja: 'Bech techri', ar: 'للشراء', derja_ar: 'باش تشري' },
    substituted: { fr: 'Substitué', derja: 'Mbadel', ar: 'مُستبدل', derja_ar: 'مبدّل' },
    ingredients: { fr: 'Ingrédients', derja: 'Ingridyenat', ar: 'المكوّنات', derja_ar: 'المكوّنات' },
    steps: { fr: 'Étapes', derja: 'Drojet', ar: 'الخطوات', derja_ar: 'الدروجات' },
    subs: { fr: 'Substitutions', derja: 'Tbadil', ar: 'البدائل', derja_ar: 'التبديل' },
    cookNow: { fr: 'Cuisiner maintenant', derja: 'Tayeb taw', ar: 'اطبخ الآن', derja_ar: 'اطبخ توّا' },
    addMissing: { fr: 'Ajouter les manquants à la liste', derja: 'Zid el na9sa lil liste', ar: 'أضف الناقص إلى القائمة', derja_ar: 'زيد الناقصة للّيستة' },
    servings: { fr: '4 personnes', derja: '4 ness', ar: '4 أشخاص', derja_ar: '4 ناس' },
    cookExit: { fr: 'Quitter le mode cuisine', derja: 'Okraj mel mode tayeb', ar: 'إنهاء وضع الطهي', derja_ar: 'اخرج من وضع الطب' },
    cookPrev: { fr: 'Précédent', derja: 'Le9bel', ar: 'السابق', derja_ar: 'اللي فات' },
    cookNext: { fr: 'Suivant', derja: 'Ba3d', ar: 'التالي', derja_ar: 'اللي بعد' },
    cookTimer: { fr: 'Lancer le minuteur', derja: 'Khaddem el minutur', ar: 'شغّل المؤقّت', derja_ar: 'خدم المنوطر' },
    stepLbl: { fr: 'Étape', derja: 'Droga', ar: 'خطوة', derja_ar: 'دروغة' },
    ofLbl: { fr: 'sur', derja: 'men', ar: 'من', derja_ar: 'من' },
    newList: { fr: 'Nouvelle liste', derja: 'Liste jdida', ar: 'قائمة جديدة', derja_ar: 'ليستة جديدة' },
    estCost: { fr: 'Coût estimé', derja: 'Tawaqqo3 el thaman', ar: 'التكلفة التقديرية', derja_ar: 'التمن التقديري' },
    addItem: { fr: 'Ajouter un article', derja: 'Zid mada', ar: 'أضف عنصراً', derja_ar: 'زيد مادة' },
    settings: { fr: 'Réglages', derja: 'Reglages', ar: 'الإعدادات', derja_ar: 'الإعدادات' },
    prefs: { fr: 'Préférences', derja: 'Tafadhilat', ar: 'التفضيلات', derja_ar: 'التفضيلات' },
    myStats: { fr: 'Mes statistiques', derja: 'Statistiques mte3i', ar: 'إحصائياتي', derja_ar: 'ستاتيستيك متاعي' },
    displayName: { fr: 'Nom affiché', derja: 'Esma mbojjra', ar: 'الاسم المعروض', derja_ar: 'الاسمة المبيّنة' },
    /* Version 3 — pages repensées, pub, reconnaissance photo, planning. */
    secDiscover: { fr: 'Découvrir la cuisine tunisienne', derja: 'Iktechef el tabkh et-tounsi', ar: 'اكتشف المطبخ التونسي', derja_ar: 'اكتشف الطبخ التونسي' },
    secFridgeCta: { fr: 'De votre frigo, aujourd’hui', derja: 'Mel frigo mte3ek, lyoum', ar: 'من ثلاجتك، اليوم', derja_ar: 'من الفريجيدار متاعك، اليوم' },
    seeAll: { fr: 'Tout voir', derja: 'Chouf el kol', ar: 'عرض الكل', derja_ar: 'شوف الكل' },
    catKosksi: { fr: 'Kosksi', derja: 'Kosksi', ar: 'كسكسي', derja_ar: 'كسكسي' },
    catOjja: { fr: 'Ojja', derja: 'Ojja', ar: 'أجّة', derja_ar: 'أجّة' },
    catMarqa: { fr: 'Marqa', derja: 'Marqa', ar: 'مرقة', derja_ar: 'مرقة' },
    catSalade: { fr: 'Salades', derja: 'Saladat', ar: 'سلطات', derja_ar: 'سلاطات' },
    catDouceurs: { fr: 'Douceurs', derja: '7louet', ar: 'حلويات', derja_ar: 'حلويات' },
    catPain: { fr: 'Pains et crêpes', derja: 'Khobz w Tlifa', ar: 'خبز وفطائر', derja_ar: 'خبز وطليفة' },
    adLabel: { fr: 'Publicité', derja: 'Reklam', ar: 'إعلان', derja_ar: 'ريكلام' },
    adDemo: { fr: 'Emplacement réservé — 100 px', derja: 'Blasa 7ajza — 100 px', ar: 'مساحة محجوزة — 100 بكسل', derja_ar: 'بلاصة محجوزة — 100 بكسل' },
    adsToggle: { fr: 'Pub', derja: 'Reklam', ar: 'إعلان', derja_ar: 'ريكلام' },
    demoToggle: { fr: 'Démo', derja: 'Démo', ar: 'تجريبي', derja_ar: 'ديمو' },
    favAdd: { fr: 'Ajouter aux favoris', derja: 'Zidha lil favoris', ar: 'أضف إلى المفضلة', derja_ar: 'زيدو للمفضلة' },
    favRemove: { fr: 'Retirer des favoris', derja: 'Na77i mel favoris', ar: 'أزل من المفضلة', derja_ar: 'نحي من المفضلة' },
    ratingLabel: { fr: 'Note de la communauté', derja: 'Not mte3 el jame3a', ar: 'تقييم المجتمع', derja_ar: 'نوت متاع الجماعة' },
    recognizeTitle: { fr: 'Photo de mon frigo', derja: 'Tissura mte3 el frigo', ar: 'صورة ثلاجتي', derja_ar: 'تصورة متاع الفريجيدار' },
    recognizeLead: { fr: 'L’analyse propose ces ingrédients — vous confirmez avant tout ajout.', derja: 'El ta7lil qal 3la hedhom — ekked 9bal ma tzid.', ar: 'التحليل يقترح هذه المكونات — أكّد قبل أي إضافة.', derja_ar: 'التحليل قال على هذم — اكّد قبل ما تزيد.' },
    recognizeConfirm: { fr: 'Ajouter au frigo', derja: 'Zid lil frigo', ar: 'أضف إلى الثلاجة', derja_ar: 'زيد للفريجيدار' },
    recognizeCancel: { fr: 'Annuler', derja: 'Batel', ar: 'إلغاء', derja_ar: 'بطّل' },
    confidence: { fr: 'confiance', derja: 'ya9in', ar: 'الثقة', derja_ar: 'ياقين' },
    planningTitle: { fr: 'Menu de la semaine', derja: 'Menu mte3 el jom3a', ar: 'قائمة الأسبوع', derja_ar: 'مينو متاع الجمعة' },
    planningStub: { fr: 'Écran non maquetté dans ce lot — la navigation reste réelle.', derja: 'Ecran mazelt mch msawer — el navigation 7a9i9iya.', ar: 'شاشة غير مصمّمة في هذه الدفعة — التنقّل حقيقي.', derja_ar: 'إيكران مازال مش مصوّر — النڤيݣاسيون حقيقية.' },
    crumbsHome: { fr: 'Accueil', derja: 'Accueil', ar: 'الرئيسية', derja_ar: 'الأكاي' },
    crumbsRecipes: { fr: 'Recettes', derja: 'Maklet', ar: 'الوصفات', derja_ar: 'ماكلات' },
    stepPhotos: { fr: 'Étapes avec photo', derja: 'Drojet b tissura', ar: 'خطوات بالصورة', derja_ar: 'دروجات بالتصورة' },
    dishCount: { fr: 'plats', derja: 'maklat', ar: 'طبق', derja_ar: 'ماكلة' },
    myFridge: { fr: 'Mon frigo', derja: 'Frigo mte3i', ar: 'ثلاجتي', derja_ar: 'الفريجيدار متاعي' },
    openSuggestions: { fr: 'Voir mes suggestions', derja: 'Chouf sugjestions mte3i', ar: 'شاهد اقتراحاتي', derja_ar: 'شوف اقتراحاتي' },
    /* Écrans complémentaires (bienvenue, onboarding, scan, favoris, planning, notifications, historique). */
    welcomeStart: { fr: 'Commencer', derja: 'Ebda', ar: 'ابدأ', derja_ar: 'ابدا' },
    welcomeSkip: { fr: 'Passer l’introduction', derja: 'Na77i l’introduction', ar: 'تخطَّ المقدمة', derja_ar: 'نحّي المقدمة' },
    onbTitle: { fr: 'Remplissez votre frigo', derja: '3ammar el frigo mte3ek', ar: 'املأ ثلاجتك', derja_ar: 'عمّر الفريجيدار متاعك' },
    onbLead: { fr: 'Ajoutez ce que vous avez déjà — c’est ce qui rend les suggestions utiles.', derja: 'Zid elli 3andek — howa elli ywajed el sugjestions.', ar: 'أضف ما لديك — هذا ما يجعل الاقتراحات مفيدة.', derja_ar: 'زيد اللي عندك — هذا اللي يوفّر الاقتراحات.' },
    onbStep1: { fr: 'Ajoutez vos ingrédients', derja: 'Zid ingridyenat mte3ek', ar: 'أضف مكوّناتك', derja_ar: 'زيد مكوّنات متاعك' },
    onbStep2: { fr: 'Ou prenez une photo du frigo', derja: 'Wala sur el frigo', ar: 'أو صوّر ثلاجتك', derja_ar: 'ولّا صوّر الفريجيدار' },
    onbFinish: { fr: 'Voir mes suggestions', derja: 'Chouf sugjestions mte3i', ar: 'شاهد اقتراحاتي', derja_ar: 'شوف اقتراحاتي' },
    scanTitle: { fr: 'Photo du frigo', derja: 'Tissura mte3 el frigo', ar: 'صورة الثلاجة', derja_ar: 'تصورة الفريجيدار' },
    scanAnalyzing: { fr: 'Analyse en cours…', derja: 'Ta7lil mtejjel…', ar: 'التحليل جارٍ…', derja_ar: 'التحليل ماجر…' },
    scanCapture: { fr: 'Prendre la photo', derja: 'Sawwar', ar: 'التقط الصورة', derja_ar: 'صوّر' },
    scanCorrection: { fr: 'Corriger les propositions', derja: 'Saj7el el i9tirahet', ar: 'صحّح الاقتراحات', derja_ar: 'صحّح الاقتراحات' },
    favTitle: { fr: 'Favoris', derja: 'El Favoris', ar: 'المفضلة', derja_ar: 'المفضلة' },
    favEmpty: { fr: 'Aucun favori pour l’instant — touchez le cœur d’une recette.', derja: 'Mazelt famech favoris — ensse7 3al 9alb.', ar: 'لا مفضلة بعد — اضغط على القلب في أي وصفة.', derja_ar: 'مازال ما فمّاش مفضلة — انسّي على القلب.' },
    savedOffline: { fr: 'Sauvegardé hors-ligne', derja: 'Msajel sans connexion', ar: 'محفوظ للاستخدام دون اتصال', derja_ar: 'مسجّل بلا كونكسيون' },
    listDetail: { fr: 'Détail de la liste', derja: 'Tafasil el liste', ar: 'تفاصيل القائمة', derja_ar: 'تفاصيل الليستة' },
    progressLabel: { fr: 'Progression des achats', derja: 'Tqaddom el chra', ar: 'تقدم الشراء', derja_ar: 'تقدّم الشرا' },
    planGen: { fr: 'Remplir la semaine', derja: '3ammar el jom3a', ar: 'املأ الأسبوع', derja_ar: 'عمّر الجمعة' },
    planToList: { fr: 'Créer la liste de courses', derja: 'Snade3 liste el qadhya', ar: 'أنشئ قائمة المشتريات', derja_ar: 'أنشئ ليستة القضية' },
    slotMidi: { fr: 'Midi', derja: 'El vesh', ar: 'الغداء', derja_ar: 'الفش' },
    slotSoir: { fr: 'Soir', derja: 'El 3shiya', ar: 'العشاء', derja_ar: 'العشية' },
    notifTitle: { fr: 'Notifications et rappels', derja: 'Notifikasyon w Tet9addat', ar: 'الإشعارات والتذكيرات', derja_ar: 'النوتيفيكاسيون والتذكيرات' },
    notifRemind: { fr: 'Rappel de cuisson', derja: 'Tet9adda mte3 el tayeb', ar: 'تذكير بالطهي', derja_ar: 'تذكير بالطب' },
    history: { fr: 'Historique', derja: 'Tarikh', ar: 'السجل', derja_ar: 'التاريخ' },
    foodPrefs: { fr: 'Préférences alimentaires', derja: 'Tafadhilat el makla', ar: 'التفضيلات الغذائية', derja_ar: 'التفضيلات الغذائية' },
    foodPrefsStub: { fr: 'Fonctionnalité à confirmer (🚩 registre) — exclurait certains plats des suggestions.', derja: 'Bech tetekkeded (🚩) — tna77i ba3d el maklat mel sugjestions.', ar: 'ميزة يجب تأكيدها (🚩) — تستبعد بعض الأطباق من الاقتراحات.', derja_ar: 'ميزة لازم تتأكّد (🚩) — تستبعد بعض الماكلات من الاقتراحات.' },
    /* Accueil v4 : actions rapides, prochain repas, états personnalisés. */
    qaCook: { fr: 'Que puis-je cuisiner ?', derja: 'Chnowa ntayeb ?', ar: 'ماذا يمكنني أن أطبخ؟', derja_ar: 'شنوة نطيب؟' },
    qaAdd: { fr: 'Ajouter au frigo', derja: 'Zid lil frigo', ar: 'أضف إلى الثلاجة', derja_ar: 'زيد للفريجيدار' },
    qaScan: { fr: 'Scanner mes ingrédients', derja: 'Scanner ingrédienti', ar: 'امسح مكوّناتي', derja_ar: 'سكانير مكوّناتي' },
    qaGrocery: { fr: 'Mes courses', derja: 'Qadhya mte3i', ar: 'مشترياتي', derja_ar: 'قضيتي' },
    nextMeal: { fr: 'Prochain repas prévu', derja: 'El mekla el jéya', ar: 'الوجبة القادمة', derja_ar: 'الماكلة الجاية' },
    cookTonight: { fr: 'Cuisiner ce soir', derja: 'Tayeb el 3shiya', ar: 'اطبخ هذا المساء', derja_ar: 'اطبخ العشية' },
    heroEmpty: { fr: 'Videz votre sac, remplissez votre frigo', derja: 'Farregh el sac, 3ammar el frigo', ar: 'أفرغ سلتك واملأ ثلاجتك', derja_ar: 'فرّغ الساك، عمّر الفريجيدار' },
    heroEmptyCta: { fr: 'Ajouter mes ingrédients', derja: 'Zid ingridyenat mte3i', ar: 'أضف مكوّناتي', derja_ar: 'زيد مكوّناتي' },
    favAgain: { fr: 'Vos favoris', derja: 'Favoris mte3ek', ar: 'مفضلاتك', derja_ar: 'مفضلات متاعك' },
    groceryOngoing: { fr: 'Liste « Week-end » en cours — 2 sur 6 achetés', derja: 'Liste Week-end fel wast — 2 men 6', ar: 'قائمة «Week-end» جارية — 2 من 6', derja_ar: 'ليستة «Week-end» في الوسط — 2 من 6' },
    emptyHomeLead: { fr: 'Dites-nous ce que vous avez, le chef s’occupe du reste.', derja: '9olli elli 3andek, el chef ykammel.', ar: 'أخبرنا بما لديك، والشيف يتكفل بالباقي.', derja_ar: 'قولي اللي عندك، الشيف يكمّل.' },
    /* Notifications intégrées. */
    notifBell: { fr: 'Notifications', derja: 'Notifikasyon', ar: 'الإشعارات', derja_ar: 'النوتيفيكاسيون' },
    notifToday: { fr: 'Aujourd’hui', derja: 'Lyoum', ar: 'اليوم', derja_ar: 'اليوم' },
    notifEarlier: { fr: 'Plus tôt', derja: '9bal', ar: 'أقدم', derja_ar: 'أقدم' },
    notifMarkAll: { fr: 'Tout marquer comme lu', derja: 'Marke7 el kol ka9ri', ar: 'وضع الكل كمقروء', derja_ar: 'علّم الكل مقروء' },
    notifNewRecipe: { fr: 'Nouvelle recette du chef', derja: 'Recette jdida mel chef', ar: 'وصفة جديدة من الشيف', derja_ar: 'وصفة جديدة من الشيف' },
    notifUpdate: { fr: 'Mise à jour installée', derja: 'Mise à jour installi', ar: 'تم تثبيت التحديث', derja_ar: 'التحديث تنصّب' },
    notifResume: { fr: 'Reprendre', derja: 'Kammel', ar: 'استئناف', derja_ar: 'كمّل' },
    notifSee: { fr: 'Voir', derja: 'Chouf', ar: 'عرض', derja_ar: 'شوف' },
    notifSettings: { fr: 'Réglages des rappels', derja: 'Reglages tet9addat', ar: 'إعدادات التذكيرات', derja_ar: 'إعدادات التذكيرات' },
    notifChef: { fr: 'Nouveautés du chef', derja: 'Jdid el chef', ar: 'جديد الشيف', derja_ar: 'جديد الشيف' },
    notifEmpty: { fr: 'Aucune notification — tout est à jour.', derja: 'Famech notifikasyon — el kol bak.', ar: 'لا إشعارات — كل شيء محدّث.', derja_ar: 'ما فمّاش نوتيفيكاسيون — الكل باك.' },
    /* Écrans complémentaires : chrome traduit (les textes descriptifs restent français, signalés). */
    welcomeValue: { fr: 'Trois écrans, un quotidien', derja: '3 ecran, youm kte3', ar: 'ثلاث شاشات، يومك', derja_ar: 'ثلاثة إكرانات، يومك' },
    welcomeSetup: { fr: 'À vous de choisir', derja: 'Enti tekhtar', ar: 'الاختيار لك', derja_ar: 'الاختيار ليّك' },
    welcomeLang: { fr: 'Langue', derja: 'Logha', ar: 'اللغة', derja_ar: 'اللوغة' },
    welcomeTheme: { fr: 'Thème', derja: 'Theme', ar: 'المظهر', derja_ar: 'التيم' },
    welcomeAccount: { fr: 'Compte (plus tard possible)', derja: 'Compte (ba3d ok)', ar: 'الحساب (يمكن لاحقاً)', derja_ar: 'الحساب (من بعد ممكن)' },
    welcomeFinish: { fr: 'Remplir mon frigo →', derja: '3ammar frigo →', ar: 'املأ ثلاجتي ←', derja_ar: 'عمّر الفريجيدار ←' },
    welcomeFridge: { fr: 'Votre frigo', derja: 'Frigo mte3ek', ar: 'ثلاجتك', derja_ar: 'الفريجيدار متاعك' },
    welcomeSuggest: { fr: 'Des suggestions honnêtes', derja: 'Sugjestions sa7i7a', ar: 'اقتراحات صادقة', derja_ar: 'اقتراحات صحيحة' },
    welcomeGrocery: { fr: 'Les courses qui suivent', derja: 'Qadhya ba3dha', ar: 'المشتريات تتبعها', derja_ar: 'القضية تبعها' },
    nextLabel: { fr: 'Suivant', derja: 'Ba3d', ar: 'التالي', derja_ar: 'اللي بعد' },
    scanRetake: { fr: 'Reprendre la photo', derja: 'Eed el tissura', ar: 'أعد التقاط الصورة', derja_ar: 'عيّد التصورة' },
    /* v4 [L-01] : en D3 les jours derja étaient décalés (lundi = « tlet », mardi = « arbda »…). */
    dayMon: { fr: 'Lundi 3', derja: 'Nhar ethnin 3', ar: 'الاثنين 3', derja_ar: 'نهار الاثنين 3' },
    dayTue: { fr: 'Mardi 4', derja: 'Nhar thleth 4', ar: 'الثلاثاء 4', derja_ar: 'نهار الثلاثاء 4' },
    dayWed: { fr: 'Mercredi 5', derja: 'Nhar larb3a 5', ar: 'الأربعاء 5', derja_ar: 'نهار الأربعاء 5' },
    dayThu: { fr: 'Jeudi 6', derja: 'Nhar lekhmis 6', ar: 'الخميس 6', derja_ar: 'نهار الخميس 6' },
    dayFri: { fr: 'Vendredi 7', derja: 'Nhar ejjom3a 7', ar: 'الجمعة 7', derja_ar: 'نهار الجمعة 7' },
    daySat: { fr: 'Samedi 8', derja: 'Nhar essebt 8', ar: 'السبت 8', derja_ar: 'نهار السبت 8' },
    daySun: { fr: 'Dimanche 9', derja: 'Nhar la7ad 9', ar: 'الأحد 9', derja_ar: 'نهار الأحد 9' },
    planBudget: { fr: 'Ce que la semaine coûte', derja: 'Chnowa tekla el jom3a', ar: 'تكلفة الأسبوع', derja_ar: 'الجمعة بكم' },
    favOffline: { fr: 'Hors-ligne', derja: 'Sans connexion', ar: 'بدون اتصال', derja_ar: 'بلا كونكسيون' },
    listRename: { fr: 'Renommer la liste', derja: 'Beddel esm el liste', ar: 'أعد تسمية القائمة', derja_ar: 'بدّل اسمة متاع الليستة' },
    listClear: { fr: 'Vider les articles cochés', derja: 'Farregh el ma77ud', ar: 'أفرغ المحددّات', derja_ar: 'فرّغ المعلّمين' },
    listDelete: { fr: 'Supprimer la liste', derja: 'Na77i el liste', ar: 'احذف القائمة', derja_ar: 'نحّي الليستة' },
    backToRecipe: { fr: 'Retour à la recette d’origine', derja: 'Arja3 lil recette', ar: 'عودة إلى الوصفة', derja_ar: 'رجوع للوصفة' },

    /* ---------- v4 : chaînes ajoutées par l'audit (relecture native derja demandée — décision D-15) ---------- */
    notifBellN: { fr: 'Notifications, {n} non lues', derja: 'Notifikasyon, {n} jdod', ar: 'الإشعارات، {n} غير مقروءة', derja_ar: 'النوتيفيكاسيون، {n} جدد' },
    back: { fr: 'Retour', derja: 'Arja3', ar: 'رجوع', derja_ar: 'ارجع' },
    greetEvening: { fr: 'Bonsoir ! On cuisine quoi ce soir ?', derja: 'Mse l5ir ! Chnowa ntaybou el lila ?', ar: 'مساء الخير! ماذا نطبخ الليلة؟', derja_ar: 'مسا الخير ! شنوة نطيبو الليلة ؟' },
    greetNew: { fr: 'Avec ce que vous avez au frigo, qu’est-ce qu’on cuisine ?', derja: 'Elli 3andek fel frigo, chnowa tnajem tayeb ?', ar: 'بما في ثلاجتك، ماذا يمكنك أن تطبخ؟', derja_ar: 'اللي عندك في الفريجيدار، شنوة تنجم تطيب ؟' },
    newLead: { fr: 'Dites ce que vous avez, Chnawa Ntayeb vous montre ce que vous pouvez cuisiner — et ce qu’il manque.', derja: '9olli chnowa 3andek, w nwarrik chnowa tnajem tayeb — w chnowa na9es.', ar: 'أخبرنا بما لديك، ونريك ما يمكنك طبخه وما الذي ينقصك.', derja_ar: 'قولّي شنوة عندك، ونورّيك شنوة تنجم تطيب — وشنوة ناقص.' },
    newStep1: { fr: 'Ajoutez 3 ingrédients ou plus', derja: 'Zid 3 ingridyenat walla akthar', ar: 'أضف 3 مكوّنات أو أكثر', derja_ar: 'زيد 3 مكوّنات ولّا أكثر' },
    newStep2: { fr: 'Découvrez ce que vous pouvez cuisiner', derja: 'Chouf chnowa tnajem tayeb', ar: 'اكتشف ما يمكنك طبخه', derja_ar: 'شوف شنوة تنجم تطيب' },
    newStep3: { fr: 'Le manquant part dans votre liste de courses', derja: 'El na9es yemchi lil liste mta3 el qadhya', ar: 'ما ينقص يُضاف إلى قائمة المشتريات', derja_ar: 'الناقص يمشي لليستة القضية' },
    startFridge: { fr: 'Remplir mon frigo', derja: '3ammar el frigo', ar: 'املأ ثلاجتي', derja_ar: 'عمّر الفريجيدار' },
    orScan: { fr: 'Prendre une photo', derja: 'Sawwar el frigo', ar: 'التقط صورة', derja_ar: 'صوّر الفريجيدار' },
    orBrowse: { fr: 'Parcourir les recettes', derja: 'Chouf el maklet', ar: 'تصفّح الوصفات', derja_ar: 'شوف الماكلات' },
    fridgeNow: { fr: 'Votre frigo', derja: 'Frigo mte3ek', ar: 'ثلاجتك', derja_ar: 'الفريجيدار متاعك' },
    edit: { fr: 'Modifier', derja: 'Baddel', ar: 'تعديل', derja_ar: 'بدّل' },
    readyNow: { fr: 'Prête à cuisiner', derja: 'Wajda lel tayeb', ar: 'جاهزة للطهي', derja_ar: 'واجدة للطيب' },
    tonightPick: { fr: 'Notre idée pour ce soir', derja: 'Fikretna lel lila', ar: 'فكرتنا لهذه الليلة', derja_ar: 'فكرتنا لليلة' },
    seeRecipe: { fr: 'Voir la recette', derja: 'Chouf el recette', ar: 'عرض الوصفة', derja_ar: 'شوف الوصفة' },
    continueTitle: { fr: 'Reprendre', derja: 'Kammel', ar: 'متابعة', derja_ar: 'كمّل' },
    plannedTonight: { fr: 'Prévu ce soir', derja: 'Mbarmej el lila', ar: 'مخطّط له الليلة', derja_ar: 'مبرمج الليلة' },
    groceryInProgress: { fr: 'Courses en cours', derja: 'Qadhya mazelet', ar: 'مشتريات جارية', derja_ar: 'قضية مازالت' },
    fridgeEmptyTitle: { fr: 'Votre frigo est vide', derja: 'El frigo mte3ek fergh', ar: 'ثلاجتك فارغة', derja_ar: 'الفريجيدار متاعك فارغ' },
    fridgeEmptyLead: { fr: 'Ajoutez quelques ingrédients pour voir ce que vous pouvez cuisiner. En attendant, laissez-vous inspirer.', derja: 'Zid chwaya ingridyenat bech tchouf chnowa tnajem tayeb. W fel wa9t hedha, chouf el afkar.', ar: 'أضف بعض المكوّنات لترى ما يمكنك طبخه. وفي الأثناء، استلهم من هذه الأفكار.', derja_ar: 'زيد شوية مكوّنات باش تشوف شنوة تنجم تطيب. وفي الأثناء، شوف الأفكار.' },
    inspiration: { fr: 'Pour vous inspirer', derja: 'Afkar lik', ar: 'للإلهام', derja_ar: 'أفكار ليك' },
    quantityUnknown: { fr: 'Quantité non renseignée', derja: 'Qadd mouch m3arrof', ar: 'الكمية غير محدّدة', derja_ar: 'القدّ موش معروف' },
    outOfStock: { fr: 'Épuisé', derja: 'Kmel', ar: 'نفد', derja_ar: 'كمل' },
    iHaveNoMore: { fr: 'Je n’en ai plus', derja: 'Ma 3adech 3andi', ar: 'لم يعد لدي', derja_ar: 'ما عادش عندي' },
    iHaveAgain: { fr: 'J’en ai de nouveau', derja: 'Rja3 3andi', ar: 'عاد متوفّراً', derja_ar: 'رجع عندي' },
    undo: { fr: 'Annuler', derja: 'Batel', ar: 'تراجع', derja_ar: 'بطّل' },
    removed: { fr: 'retiré du frigo', derja: 'tna77a mel frigo', ar: 'أُزيل من الثلاجة', derja_ar: 'تنحّى من الفريجيدار' },
    addQty: { fr: 'Ajouter une quantité', derja: 'Zid el qadd', ar: 'أضف الكمية', derja_ar: 'زيد القدّ' },
    toVerify: { fr: 'à vérifier', derja: 'thabbet', ar: 'للتحقق', derja_ar: 'ثبّت' },
    toBuy: { fr: 'à acheter', derja: 'techri', ar: 'للشراء', derja_ar: 'تشري' },
    prepTime: { fr: 'Préparation', derja: 'Tahdhir', ar: 'التحضير', derja_ar: 'التحضير' },
    cookTime: { fr: 'Cuisson', derja: 'Tayb', ar: 'الطهي', derja_ar: 'الطيب' },
    difficulty: { fr: 'Difficulté', derja: 'Su3ouba', ar: 'الصعوبة', derja_ar: 'الصعوبة' },
    easy: { fr: 'Facile', derja: 'Sahla', ar: 'سهلة', derja_ar: 'ساهلة' },
    portions: { fr: 'Portions', derja: 'Ness', ar: 'الحصص', derja_ar: 'ناس' },
    cookStart: { fr: 'Passer en mode cuisine', derja: 'Ebda tayeb', ar: 'ابدأ وضع الطهي', derja_ar: 'ابدا اطيب' },
    addMissingN: { fr: 'Ajouter les {n} manquants à ma liste', derja: 'Zid el {n} na9sin lil liste', ar: 'أضف الـ{n} الناقصة إلى قائمتي', derja_ar: 'زيد ال{n} الناقصين لليستة' },
    addMissing1: { fr: 'Ajouter le manquant à ma liste', derja: 'Zid el na9es lil liste', ar: 'أضف الناقص إلى قائمتي', derja_ar: 'زيد الناقص لليستة' },
    ideasN: { fr: '{n} idées', derja: '{n} afkar', ar: '{n} أفكار', derja_ar: '{n} أفكار' },
    allInFridge: { fr: 'tout est dans votre frigo', derja: 'kol chay fel frigo', ar: 'كل شيء في ثلاجتك', derja_ar: 'كل شي في الفريجيدار' },
    addToPlan: { fr: 'Planifier', derja: 'Barmej', ar: 'خطّط', derja_ar: 'برمج' },
    saveOffline: { fr: 'Garder hors ligne', derja: 'Khabbiha bla connexion', ar: 'احفظ بدون اتصال', derja_ar: 'خبّيها بلا كونكسيون' },
    stepIngredients: { fr: 'Pour cette étape', derja: 'Lel droga hedhi', ar: 'لهذه الخطوة', derja_ar: 'للدروجة هذي' },
    allIngredients: { fr: 'Tous les ingrédients', derja: 'El ingridyenat el kol', ar: 'كل المكوّنات', derja_ar: 'المكوّنات الكل' },
    finish: { fr: 'Terminer', derja: 'Kammel', ar: 'إنهاء', derja_ar: 'كمّل' },
    done: { fr: 'Bon appétit !', derja: 'Bechfa !', ar: 'بالهناء والشفاء!', derja_ar: 'بالشفاء !' },
    timerStart: { fr: 'Démarrer', derja: 'Ebda', ar: 'ابدأ', derja_ar: 'ابدا' },
    timerPause: { fr: 'Pause', derja: 'Wa9ef', ar: 'إيقاف مؤقت', derja_ar: 'وقّف' },
    stepOf: { fr: 'Étape {i} sur {n}', derja: 'Droga {i} men {n}', ar: 'الخطوة {i} من {n}', derja_ar: 'الدروجة {i} من {n}' },
    netOffline: { fr: 'Hors ligne — vos données restent sur l’appareil et seront synchronisées au retour du réseau.', derja: 'Bla connexion — el données mte3ek mkhabbyin w yetsynchronisaw ki tarja3 el connexion.', ar: 'بدون اتصال — تبقى بياناتك على الجهاز وتُزامَن عند عودة الشبكة.', derja_ar: 'بلا كونكسيون — الداتا متاعك مخبّية وتتزامن كي ترجع الكونكسيون.' },
    markRead: { fr: 'Tout marquer comme lu', derja: 'Marke7 el kol ka9ri', ar: 'وضع الكل كمقروء', derja_ar: 'علّم الكل مقروء' },
  };

  /* Interpolation {n}/{i} : data-i18n-n, data-i18n-i sur l'élément. */
  var fmt = function (s, el) {
    return s.replace(/\{(\w)\}/g, function (m, k) { var v = el && el.getAttribute('data-i18n-' + k); return v == null ? m : v; });
  };
  var t = function (key, vars) {
    var e = I18N[key] || (window.CN_I18N || {})[key] || {}; var s = e[lang] || e.fr || key;
    return s.replace(/\{(\w)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  };

  var lang = 'fr';
  var applyLang = function () {
    var meta = LANGS[lang] || LANGS.fr;
    html.setAttribute('lang', meta.htmlLang);
    html.setAttribute('dir', meta.dir);
    html.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var entry = I18N[key] || (window.CN_I18N || {})[key];
      if (entry && entry[lang]) {
        if (el.hasAttribute('data-i18n-attr')) {
          el.setAttribute(el.getAttribute('data-i18n-attr'), fmt(entry[lang], el));
        } else {
          el.textContent = fmt(entry[lang], el);
        }
      }
    });
    document.querySelectorAll('.lang-ctl').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    document.dispatchEvent(new CustomEvent('d4:lang', { detail: lang }));
  };

  /* Langues disponibles : limitées à ce que la page traduit réellement (data-langs sur <html>). */
  var setupLangs = function () {
    var allowed = (html.getAttribute('data-langs') || 'fr').split(',').map(function (s) { return s.trim(); });
    document.querySelectorAll('.lang-ctl').forEach(function (b) {
      if (allowed.indexOf(b.dataset.lang) === -1) b.style.display = 'none';
    });
    var grp = document.querySelector('[data-lang-group]');
    if (grp && allowed.length < 2) grp.insertAdjacentHTML(
      'beforeend',
      '<span class="chip-check" style="font-size:10px">démonstration en français — l\'application réelle traduit tous ces textes</span>'
    );
  };

  /* ---------- Interactions simulées ---------- */

  /* ModalShell : Échap + clic extérieur + retour du focus (niveau « simulé »). */
  var lastFocus = null;
  var openModal = function (src) {
    lastFocus = src;
    var ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">' +
      '<h3 id="demo-modal-title">Fenêtre de démonstration</h3>' +
      '<p class="muted">Échap ou clic en dehors ferment la fenêtre. ' +
      'Avec une saisie en cours, l\'application demande une confirmation (niveau réel : lots 2.8+).</p>' +
      '<div class="foot">' +
      '<button type="button" class="btn btn-secondary" data-modal-close>Annuler</button>' +
      '<button type="button" class="btn btn-primary" data-modal-close>Continuer</button>' +
      '</div></div>';
    var close = function () {
      ov.remove();
      document.removeEventListener('keydown', onKey);
      if (lastFocus) lastFocus.focus();
    };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelectorAll('[data-modal-close]').forEach(function (b) { b.addEventListener('click', close); });
    document.body.appendChild(ov);
    var first = ov.querySelector('.btn');
    if (first) first.focus();
  };

  /* Recherche : combobox ARIA + flèches + Entrée + Échap (niveau « simulé »). */
  var setupSearch = function () {
    document.querySelectorAll('.search').forEach(function (s) {
      var input = s.querySelector('input');
      var list = s.querySelector('.suggestions');
      if (!input || !list) return;
      list.setAttribute('role', 'listbox');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-controls', list.id || (list.id = 'sug-' + Math.random().toString(36).slice(2)));
      var items = Array.prototype.slice.call(list.querySelectorAll('.sug'));
      items.forEach(function (it, i) {
        it.setAttribute('role', 'option');
        it.id = list.id + '-opt-' + i;
        it.setAttribute('aria-selected', 'false');
      });
      var idx = -1;
      var setActive = function (i) {
        idx = i;
        items.forEach(function (it, j) { it.setAttribute('aria-selected', String(j === i)); });
        input.setAttribute('aria-activedescendant', i >= 0 ? items[i].id : '');
        if (i >= 0) items[i].scrollIntoView({ block: 'nearest' });
      };
      var closeList = function () { list.style.display = 'none'; input.setAttribute('aria-expanded', 'false'); setActive(-1); };
      var openList = function () { list.style.display = ''; input.setAttribute('aria-expanded', 'true'); };
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); openList(); setActive(Math.min(idx + 1, items.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(idx - 1, 0)); }
        else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); input.value = items[idx].textContent.trim(); closeList(); }
        else if (e.key === 'Escape') { closeList(); }
      });
      input.addEventListener('focus', openList);
      items.forEach(function (it) {
        it.addEventListener('click', function () { input.value = it.textContent.trim(); closeList(); });
      });
    });
  };

  /* Onglets : navigation clavier ARIA (flèches + Home/End) + panneaux (niveau « simulé »). */
  var setupTabs = function () {
    document.querySelectorAll('[role="tablist"]').forEach(function (tablist) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('.tab'));
      tabs.forEach(function (t) {
        if (!t.id) t.id = 'tab-' + Math.random().toString(36).slice(2);
        t.setAttribute('aria-controls', t.getAttribute('data-panel') || '');
        var panel = document.getElementById(t.getAttribute('data-panel'));
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', t.id);
          panel.hidden = t.getAttribute('aria-selected') !== 'true';
        }
        t.addEventListener('click', function () { select(t); });
      });
      var select = function (tab) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          var p = document.getElementById(t.getAttribute('data-panel'));
          if (p) p.hidden = !on;
        });
        tab.focus();
      };
      tablist.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next); }
      });
      tabs.forEach(function (t) { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    });
  };

  /* Pagination de démonstration : « Afficher la suite » charge de vrais éléments. */
  var setupPager = function () {
    var btn = document.querySelector('[data-load-more]');
    if (!btn) return;
    var listEl = document.getElementById(btn.getAttribute('data-list') || '');
    if (!listEl) return;
    var titles = ['Ojja merguez', 'Lablabi', 'Couscous au poisson', 'Brik à l\'œuf', 'Kafteji', 'Tajine kafteji', 'Slisk mendacin', 'Dough tunisien', 'Marqa jout', 'Kamounia', 'Chorba frik', 'Masfouf'];
    var page = 0;
    btn.addEventListener('click', function () {
      page++;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 24; i++) {
        var n = page * 24 + i;
        var li = document.createElement('div');
        li.className = 'list-item';
        li.innerHTML =
          '<div class="thumb"><span aria-hidden="true">' + ['🍲', '🥘', '🫕', '🍛', '🍜'][n % 5] + '</span></div>' +
          '<div class="grow"><span class="title">' + titles[n % titles.length] + ' #' + (n + 1) + '</span><br>' +
          '<span class="muted" style="font-size:12px">Recette de démonstration</span></div>' +
          '<span class="chip-check">24/page</span>';
        frag.appendChild(li);
      }
      listEl.appendChild(frag);
      if ((page + 1) * 24 >= 48) { btn.disabled = true; btn.textContent = 'Tout est affiché (démonstration : 2 pages sur 128 en réel)'; }
    });
  };

  /* Steppers de quantité ([data-qty] : boutons +/- et champ). */
  var setupQty = function () {
    document.querySelectorAll('[data-qty]').forEach(function (q) {
      var input = q.querySelector('input');
      if (!input) return;
      var step = parseFloat(q.getAttribute('data-qty')) || 1;
      var minus = q.querySelector('[data-qty-minus]');
      var plus = q.querySelector('[data-qty-plus]');
      if (minus) minus.addEventListener('click', function () { input.value = Math.max(0, (parseFloat(input.value) || 0) - step); });
      if (plus) plus.addEventListener('click', function () { input.value = ((parseFloat(input.value) || 0) + step); });
    });
  };

  /* Cases de courses : cochée = article barré (état non porté par la couleur seule). */
  var setupChecks = function () {
    document.querySelectorAll('.gitem input[type=checkbox]').forEach(function (cb) {
      var apply = function () { cb.closest('.gitem').classList.toggle('done', cb.checked); };
      cb.addEventListener('change', apply);
      apply();
    });
  };

  /* Photos : placeholder shimmer tant que l'image n'est pas prête, repli (tuile
     dégradée + emoji du plat) si le lien casse — jamais une photo d'ingrédient
     pour illustrer un plat. */
  var setupPhotos = function () {
    document.querySelectorAll('.ph img, .rcard img, .cat-card img').forEach(function (img) {
      img.classList.add('ph-skel');
      img.addEventListener('load', function () { img.classList.remove('ph-skel'); });
      img.addEventListener('error', function () {
        var host = img.closest('.ph') || img.parentElement;
        if (host) host.classList.add('broken');
        img.classList.remove('ph-skel');
      });
      if (img.complete && img.naturalWidth > 0) img.classList.remove('ph-skel');
      if (img.complete && img.naturalWidth === 0) {
        var host2 = img.closest('.ph') || img.parentElement;
        if (host2) host2.classList.add('broken');
        img.classList.remove('ph-skel');
      }
    });
  };

  /* Favoris (aria-pressed + libellé traduit) et évaluation (lecture seule ici). */
  var setupFav = function () {
    document.querySelectorAll('[data-fav]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        var key = on ? 'favRemove' : 'favAdd';
        b.setAttribute('data-i18n', key);
        if (b.hasAttribute('aria-label')) b.setAttribute('aria-label', (I18N[key] || {})[lang] || '');
        var txt = b.querySelector('.fav-text');
        if (txt) txt.textContent = (I18N[key] || {})[lang] || '';
      });
    });
  };

  /* Publicité : bascule de démonstration « pub on/off » (html[data-ads]) —
     off replie tous les slots (zéro espace réservé), comme sans annonceur. */
  var setupAds = function () {
    document.querySelectorAll('.ads-ctl').forEach(function (b) {
      b.addEventListener('click', function () {
        var off = html.getAttribute('data-ads') !== 'off';
        html.setAttribute('data-ads', off ? 'off' : 'on');
        document.querySelectorAll('.ads-ctl').forEach(function (x) {
          x.setAttribute('aria-pressed', String(!off));
        });
      });
    });
  };

  /* Reconnaissance photo : cocher/décocher les propositions avant confirmation. */
  var setupRecognize = function () {
    var list = document.querySelector('[data-recognize]');
    if (!list) return;
    list.querySelectorAll('.rec-item input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.rec-item').classList.toggle('rejected', !cb.checked);
      });
    });
  };

  /* Barre de démonstration : bouton « Démo » qui replie les commandes. */
  /* v4 [A-01] : la pastille Démo est REPLIÉE par défaut sous 1024 px (elle couvrait tout l'écran
     mobile) ; ajout des bascules Notes (annotations de conception), Réseau (hors ligne simulé)
     et de la direction C (proposition) sur toutes les pages qui ont déjà une bascule Direction. */
  var setupDemoBar = function () {
    var bar = document.querySelector('.controls');
    if (!bar) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'demo-toggle';
    btn.textContent = '⚙ Démo';
    var startCollapsed = window.innerWidth < 1024;
    bar.classList.toggle('collapsed', startCollapsed);
    btn.setAttribute('aria-expanded', String(!startCollapsed));
    btn.addEventListener('click', function () {
      var collapsed = bar.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', String(!collapsed));
    });
    bar.insertBefore(btn, bar.firstChild);
    var lastDir = bar.querySelector('.dir-ctl[data-dir="FK"]');
    if (lastDir && !bar.querySelector('.dir-ctl[data-dir="C"]')) {
      lastDir.insertAdjacentHTML('afterend', '<button class="ctl dir-ctl" data-dir="C" aria-pressed="false" title="Proposition v4 — à arbitrer">C 🚩</button>');
    }
    /* La bascule Direction reflète la direction réelle de la page (C par défaut depuis v4.1). */
    bar.querySelectorAll('.dir-ctl').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.dir === html.getAttribute('data-dir'))); });
    var extra = document.createElement('div');
    extra.className = 'grp';
    extra.innerHTML = '<span class="lbl">Notes</span><button class="ctl anno-ctl" aria-pressed="true">On</button>' +
      '<span class="lbl">Réseau</span><button class="ctl net-ctl" aria-pressed="false">Hors ligne</button>';
    var index = bar.querySelector('a[href*="index.html"]');
    bar.insertBefore(extra, index || null);
    extra.querySelector('.anno-ctl').addEventListener('click', function (e) {
      var off = html.getAttribute('data-anno') !== 'off';
      html.setAttribute('data-anno', off ? 'off' : 'on');
      e.currentTarget.setAttribute('aria-pressed', String(!off));
      e.currentTarget.textContent = off ? 'Off' : 'On';
    });
    extra.querySelector('.net-ctl').addEventListener('click', function (e) {
      var offline = html.getAttribute('data-net') !== 'offline';
      html.setAttribute('data-net', offline ? 'offline' : 'online');
      e.currentTarget.setAttribute('aria-pressed', String(offline));
    });
  };

  /* Barre éphémère avec « Annuler » (remplace les fenêtres de confirmation des retraits réversibles). */
  var snackTimer = null;
  var snack = function (msg, onUndo, undoLabel) {
    var el = document.getElementById('d4-snack');
    if (!el) {
      el = document.createElement('div');
      el.id = 'd4-snack'; el.className = 'snackbar'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="grow"></span>' + (onUndo ? '<button type="button"></button>' : '');
    el.querySelector('.grow').textContent = msg;
    if (onUndo) {
      var b = el.querySelector('button');
      b.textContent = undoLabel || t('undo');
      b.addEventListener('click', function () { onUndo(); el.hidden = true; });
    }
    el.hidden = false;
    clearTimeout(snackTimer);
    snackTimer = setTimeout(function () { el.hidden = true; }, 6000);
  };
  var translate = function (root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n'), entry = I18N[key] || (window.CN_I18N || {})[key];
      if (!entry || !entry[lang]) return;
      if (el.hasAttribute('data-i18n-attr')) el.setAttribute(el.getAttribute('data-i18n-attr'), fmt(entry[lang], el));
      else el.textContent = fmt(entry[lang], el);
    });
  };
  window.D4 = { t: t, snack: snack, lang: function () { return lang; }, translate: translate,
    /* Après un nouveau rendu d'un composant : carrousels + traduction du sous-arbre. */
    refresh: function (root) { if (typeof setupRails === 'function') setupRails(); translate(root); } };

  /* Barre de contrôles commune. */
  var bind = function () {
    document.querySelectorAll('.dir-ctl').forEach(function (b) {
      b.addEventListener('click', function () {
        html.setAttribute('data-dir', b.dataset.dir);
        document.querySelectorAll('.dir-ctl').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    document.querySelectorAll('.mode-ctl').forEach(function (b) {
      b.addEventListener('click', function () {
        html.setAttribute('data-mode', b.dataset.mode);
        document.querySelectorAll('.mode-ctl').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    document.querySelectorAll('.lang-ctl').forEach(function (b) {
      b.addEventListener('click', function () { lang = b.dataset.lang; applyLang(); });
    });
    /* États personnalisés de l'accueil (démo) : frigo vide / rempli / planning. */
    document.querySelectorAll('.state-ctl').forEach(function (b) {
      b.addEventListener('click', function () {
        html.setAttribute('data-home-state', b.dataset.state);
        document.querySelectorAll('.state-ctl').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x.dataset.state === html.getAttribute('data-home-state')));
        });
      });
    });
    document.querySelectorAll('.width-ctl').forEach(function (b) {
      b.addEventListener('click', function () {
        var frame = document.querySelector('.frame');
        if (frame) {
          frame.dataset.w = b.dataset.w;
          document.querySelectorAll('.width-ctl').forEach(function (x) {
            x.setAttribute('aria-pressed', String(x.dataset.w === frame.dataset.w));
          });
        }
      });
    });
    document.querySelectorAll('[data-modal-open]').forEach(function (b) {
      b.addEventListener('click', function () { openModal(b); });
    });
    /* Synchronisation initiale des contrôles de largeur avec l'état réel du cadre. */
    var frame = document.querySelector('.frame');
    if (frame) {
      document.querySelectorAll('.width-ctl').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.w === frame.dataset.w));
      });
    }
  };

  /* v4 [N-01] : en-tête + navigation (basse mobile, latérale ≥ 1024 px) générés depuis UNE définition,
     au lieu d'être recopiés dans chaque page (les anciennes pages D3 gardent leur balisage).
     <header data-shell="topbar" data-back="x.html"> … actions propres à la page … </header>
     <nav data-shell="side" data-current="fridge"></nav>  <nav data-shell="bottom" data-current="fridge"></nav> */
  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6"/>',
    fridge: '<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M5 10h14M9 5.5v2M9 13v3.5"/>',
    recipes: '<path d="M6 3v8a3 3 0 0 0 6 0V3M9 11v10M17 3c-1.5 1-2 3-2 5 0 2 1 3 2 3s2-1 2-3c0-2-.5-4-2-5zM17 11v10"/>',
    planning: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    grocery: '<path d="M5 8h14l-1.5 12h-11zM8 8V6a4 4 0 0 1 8 0v2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5l1.7 2.4 2.8-.7.7 2.8 2.4 1.7-1.3 2.6 1.3 2.6-2.4 1.7-.7 2.8-2.8-.7L12 21.5l-1.7-2.4-2.8.7-.7-2.8-2.4-1.7 1.3-2.6-1.3-2.6 2.4-1.7.7-2.8 2.8.7z"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10.5 20a1.8 1.8 0 0 0 3 0"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    heart: '<path d="M12 21s-7.5-4.6-10-9c-1.8-3.2.4-7 4-7 2.2 0 3.6 1.2 6 3.6C14.4 6.2 15.8 5 18 5c3.6 0 5.8 3.8 4 7-2.5 4.4-10 9-10 9z"/>',
  };
  var svg = function (name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; };
  window.D4_ICON = svg;
  var NAV = [
    { id: 'home', href: 'accueil-c.html', key: 'navHome' },
    { id: 'fridge', href: 'frigo.html', key: 'navFridge', badge: '9', badgeLabel: '9 ingrédients disponibles' },
    { id: 'recipes', href: 'recherche.html', key: 'navRecipes' },
    { id: 'planning', href: 'planning.html', key: 'navWeekly' },
    { id: 'grocery', href: 'courses.html', key: 'navGrocery' },
  ];
  var BRAND = '<span class="brand brand-display">Chnawa Ntayeb<small>by chef Souhed</small></span>';
  var setupShell = function () {
    document.querySelectorAll('[data-shell]').forEach(function (el) {
      var kind = el.getAttribute('data-shell'), cur = el.getAttribute('data-current');
      var link = function (n) {
        return '<a class="nav" href="' + n.href + '"' + (n.id === cur ? ' aria-current="page"' : '') + '>' + svg(n.id) +
          '<span data-i18n="' + n.key + '"></span>' + (n.badge ? '<span class="badge"><span aria-hidden="true">' + n.badge + '</span><span class="sr-only">' + n.badgeLabel + '</span></span>' : '') + '</a>';
      };
      if (kind === 'bottom') { el.className = 'bottomnav'; el.setAttribute('aria-label', 'Navigation principale'); el.innerHTML = NAV.map(link).join(''); }
      if (kind === 'side') {
        el.className = 'side-nav'; el.setAttribute('aria-label', 'Navigation principale');
        el.innerHTML = '<div class="brand-block">' + BRAND + '</div>' + NAV.map(link).join('') +
          link({ id: 'settings', href: 'profil.html', key: 'settings' });
      }
      if (kind === 'topbar') {
        var own = el.innerHTML; var back = el.getAttribute('data-back');
        el.className = 'topbar';
        el.innerHTML = (back ? '<a class="icon-btn" href="' + back + '" aria-label="Retour" data-i18n="back" data-i18n-attr="aria-label">' + svg('back', 'flip-rtl') + '</a>' : '') +
          '<span class="brand-slot">' + BRAND + '</span><span class="spacer"></span>' + own +
          '<a class="icon-btn" href="notifications.html" aria-label="Notifications, 2 non lues" data-i18n="notifBellN" data-i18n-n="2" data-i18n-attr="aria-label">' + svg('bell') + '<span class="bell-badge" aria-hidden="true">2</span></a>' +
          '<a class="icon-btn" href="profil.html" aria-label="Réglages" data-i18n="settings" data-i18n-attr="aria-label">' + svg('settings') + '</a>';
      }
    });
  };

  /* ---------- v4.1 : marque (logo) + notifications ----------
     Logo « Tajine ? » (piste 1, à valider — D-18) injecté dans toute marque .brand, favicon SVG.
     Notifications : UNE source de données (NOTIFS) et UN rendu (renderNotifs) pour le panneau
     déroulant desktop (≥ 1024 px, sous la cloche, « Voir toutes » en bas) et l'écran mobile
     (notifications.html). État lu / non lu gardé pour la session (sessionStorage, repli mémoire). */
  var MARK = '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 47h52c0 4.4-3.6 8-8 8H14c-4.4 0-8-3.6-8-8z" fill="var(--logo-base)"/><path d="M11 45.5c6-3.5 13-11.5 18-23.5h6c5 12 12 20 18 23.5z" fill="var(--logo-lid)"/><circle cx="32" cy="20" r="3.2" fill="var(--logo-q)"/><path d="M27 9.5C27 6.3 29.3 4 32 4s5 2.1 5 5c0 2.4-1.6 3.4-3 4.2-1.1.6-2 1.3-2 2.3" fill="none" stroke="var(--logo-q)" stroke-width="3.2" stroke-linecap="round"/></svg>';
  var setupBrand = function () {
    document.querySelectorAll('.brand').forEach(function (b) {
      if (b.querySelector('.logo-mark')) return;
      var words = document.createElement('span'); words.className = 'brand-words';
      while (b.firstChild) words.appendChild(b.firstChild);
      b.appendChild(words); b.insertAdjacentHTML('afterbegin', MARK);
    });
    if (!document.querySelector('link[rel="icon"]')) {
      var l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml'; l.href = 'assets/brand/favicon.svg';
      document.head.appendChild(l);
    }
  };

  var NICON = {
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    cart: '<path d="M5 8h14l-1.5 12h-11zM8 8V6a4 4 0 0 1 8 0v2"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z"/>',
    plan: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    save: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    update: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  };
  var L4 = function (fr, derja, ar, derja_ar) { return { fr: fr, derja: derja, ar: ar, derja_ar: derja_ar }; };
  var NOTIFS = [
    { id: 'n1', unread: true, day: 'today', icon: 'timer', tone: 'warning-text',
      title: L4('Minuteur terminé', 'El minuteur kmel', 'انتهى المؤقّت', 'المنوطر كمل'),
      text: L4('Ojja merguez · étape 3', 'Ojja merguez · droga 3', 'عجة مرقاز · الخطوة 3', 'عجة مرقاز · الدروجة 3'),
      time: L4('il y a 5 min', 'men 5 d9aye9', 'منذ 5 دقائق', 'من 5 دقايق'),
      action: { href: 'mode-cuisine.html#step3', label: L4('Reprendre', 'Kammel', 'استئناف', 'كمّل') } },
    { id: 'n2', unread: true, day: 'today', icon: 'cart', tone: 'brand-text',
      title: L4('Ce soir : Ojja merguez', 'El lila : Ojja merguez', 'الليلة: عجة مرقاز', 'الليلة: عجة مرقاز'),
      text: L4('2 ingrédients à acheter (merguez, harissa)', '2 ingridyenat techrihom (merguez, harissa)', 'مكوّنان للشراء (مرقاز، هريسة)', 'زوز حاجات تشريهم (مرقاز، هريسة)'),
      time: L4('il y a 2 h', 'men 2 swaye3', 'منذ ساعتين', 'من ساعتين'),
      action: { href: 'courses.html', label: L4('Voir la liste', 'Chouf el liste', 'عرض القائمة', 'شوف الليستة') } },
    { id: 'n3', unread: false, day: 'earlier', icon: 'star', tone: 'accent-text',
      title: L4('Nouvelle recette du chef', 'Recette jdida mel chef', 'وصفة جديدة من الشيف', 'وصفة جديدة من الشاف'),
      text: L4('Brik à l’œuf — prête en 25 min', 'Brik bel 3dham — 25 d9i9a', 'بريك بالبيض — 25 دقيقة', 'بريك بالعظم — 25 دقيقة'),
      time: L4('hier', 'lbere7', 'أمس', 'البارح'),
      action: { href: 'recette.html', label: L4('Voir', 'Chouf', 'عرض', 'شوف') } },
    { id: 'n4', unread: false, day: 'earlier', icon: 'plan', tone: 'info-text',
      title: L4('Votre semaine est prête', 'El jom3a mte3ek wajda', 'أسبوعك جاهز', 'الجمعة متاعك واجدة'),
      text: L4('5 repas prévus · courses estimées 37,40 – 48,40 DT', '5 maklet mbarmjin · qadhya 37,40 – 48,40 DT', '5 وجبات مخطّطة · مشتريات 37,40 – 48,40 د.ت', '5 ماكلات مبرمجة · قضية 37,40 – 48,40 د.ت'),
      time: L4('dimanche', 'el a7ad', 'الأحد', 'الأحد'),
      action: { href: 'planning.html', label: L4('Voir', 'Chouf', 'عرض', 'شوف') } },
    { id: 'n5', unread: false, day: 'earlier', icon: 'save', tone: 'info-text',
      title: L4('Disponible hors ligne', 'Mawjouda bla connexion', 'متاحة دون اتصال', 'موجودة بلا كونكسيون'),
      text: L4('Lablabi est gardée sur cet appareil', 'Lablabi mkhabbya fel téléphone', 'اللبلابي محفوظ على هذا الجهاز', 'اللبلابي مخبّي في التليفون'),
      time: L4('samedi', 'essebt', 'السبت', 'السبت'),
      action: { href: 'favoris.html', label: L4('Voir', 'Chouf', 'عرض', 'شوف') } },
    { id: 'n6', unread: false, day: 'earlier', icon: 'update', tone: 'ink-muted',
      title: L4('Mise à jour installée', 'Mise à jour tnasbet', 'تم تثبيت التحديث', 'التحديث تنصّب'),
      text: L4('Version 1.2.0 · rien à faire de votre côté', 'Version 1.2.0 · ma 3andek chay ta3mlou', 'الإصدار 1.2.0 · لا شيء عليك فعله', 'فرسيون 1.2.0 · ما عندك شي تعملو'),
      time: L4('il y a 4 jours', 'men 4 iyyem', 'منذ 4 أيام', 'من 4 أيّام'), action: null },
  ];
  var readStore = (function () {
    var mem = {};
    return {
      get: function () { try { return JSON.parse(sessionStorage.getItem('d4-notif-read') || '{}'); } catch (e) { return mem; } },
      set: function (v) { mem = v; try { sessionStorage.setItem('d4-notif-read', JSON.stringify(v)); } catch (e) { /* mode privé : mémoire seule */ } },
    };
  })();
  var isUnread = function (n) { return n.unread && !readStore.get()[n.id]; };
  var unreadCount = function () { return NOTIFS.filter(isUnread).length; };
  var pick = function (o) { return o[lang] || o.fr; };
  var NT = {
    title: L4('Notifications', 'Notifikasyon', 'الإشعارات', 'النوتيفيكاسيون'),
    today: L4('Aujourd’hui', 'Lyoum', 'اليوم', 'اليوم'),
    earlier: L4('Plus tôt', '9bal', 'سابقاً', 'قبل'),
    markAll: L4('Tout marquer comme lu', 'Marke7 el kol ka9ri', 'تعليم الكل كمقروء', 'علّم الكل مقروء'),
    seeAll: L4('Voir toutes les notifications', 'Chouf el notifikasyon el kol', 'عرض كل الإشعارات', 'شوف النوتيفيكاسيون الكل'),
    empty: L4('Aucune notification non lue.', 'Famech notifikasyon jdida.', 'لا إشعارات غير مقروءة.', 'ما فمّاش نوتيفيكاسيون جديدة.'),
    unread: L4('non lue', 'jdida', 'غير مقروء', 'جديدة'),
    settings: L4('Réglages des notifications', 'Reglages notifikasyon', 'إعدادات الإشعارات', 'إعدادات النوتيفيكاسيون'),
  };

  /* Rendu commun : opts.limit (panneau), opts.filter 'unread' (écran), opts.compact. */
  var renderNotifs = function (box, opts) {
    opts = opts || {};
    var list = NOTIFS.filter(function (n) { return opts.filter !== 'unread' || isUnread(n); });
    var shown = opts.limit ? list.slice(0, opts.limit) : list;
    if (!shown.length) { box.innerHTML = '<div class="state-note" style="border:none"><span class="icon" aria-hidden="true">🔔</span>' + pick(NT.empty) + '</div>'; return; }
    var html = '', day = null;
    shown.forEach(function (n) {
      if (n.day !== day) { day = n.day; html += '<p class="notif-day">' + pick(NT[day]) + '</p>'; }
      var u = isUnread(n);
      html += '<div class="notif-row' + (u ? ' is-unread' : '') + '" data-id="' + n.id + '">' +
        '<span class="notif-ic" style="color:var(--' + n.tone + ')" aria-hidden="true"><svg viewBox="0 0 24 24">' + NICON[n.icon] + '</svg></span>' +
        '<span class="grow"><a class="notif-title" href="' + (n.action ? n.action.href : 'notifications.html') + '">' + pick(n.title) + '</a>' +
        (u ? '<span class="sr-only"> (' + pick(NT.unread) + ')</span>' : '') +
        '<span class="notif-text">' + pick(n.text) + '</span><span class="notif-time">' + pick(n.time) + '</span></span>' +
        (u ? '<span class="notif-dot" aria-hidden="true"></span>' : '') +
        (n.action && !opts.compact ? '<a class="btn btn-secondary btn-sm" href="' + n.action.href + '" tabindex="-1" aria-hidden="true">' + pick(n.action.label) + '</a>' : '') +
        '</div>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.notif-row a').forEach(function (a) {
      a.addEventListener('click', function () { var id = a.closest('.notif-row').getAttribute('data-id'); var r = readStore.get(); r[id] = true; readStore.set(r); });
    });
  };
  var syncBadges = function () {
    var n = unreadCount();
    document.querySelectorAll('a[href="notifications.html"].icon-btn, .icon-btn[data-notif-bell]').forEach(function (b) {
      var badge = b.querySelector('.bell-badge');
      if (n && !badge) { b.insertAdjacentHTML('beforeend', '<span class="bell-badge" aria-hidden="true"></span>'); badge = b.querySelector('.bell-badge'); }
      if (badge) { if (n) badge.textContent = n; else badge.remove(); }
      b.setAttribute('data-i18n-n', String(n));
      b.setAttribute('aria-label', n ? t('notifBellN', { n: n }) : pick(NT.title));
    });
  };
  var markAllRead = function () {
    var r = readStore.get(); NOTIFS.forEach(function (n) { r[n.id] = true; }); readStore.set(r);
    syncBadges(); document.dispatchEvent(new CustomEvent('d4:notifs'));
  };

  /* Panneau déroulant desktop (≥ 1024 px) : ancré sous la cloche, 5 dernières, « Voir toutes » en bas.
     Sous 1024 px la cloche reste un lien vers l'écran dédié (comportement mobile prévu). */
  var desktop = window.matchMedia('(min-width: 1024px)');
  var pop = null, popBell = null;
  var closePop = function (focusBack) {
    if (!pop) return; pop.remove(); pop = null;
    if (popBell) { popBell.setAttribute('aria-expanded', 'false'); if (focusBack) popBell.focus(); }
  };
  var placePop = function () {
    if (!pop || !popBell) return;
    var r = popBell.getBoundingClientRect(), rtl = html.getAttribute('dir') === 'rtl';
    pop.style.top = (r.bottom + 8) + 'px';
    if (rtl) { pop.style.left = Math.max(8, r.left) + 'px'; pop.style.right = 'auto'; }
    else { pop.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; pop.style.left = 'auto'; }
  };
  var openPop = function (bell) {
    if (typeof closeProfile === 'function') closeProfile(false);
    popBell = bell;
    pop = document.createElement('div');
    pop.className = 'notif-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', pick(NT.title));
    var draw = function () {
      pop.innerHTML = '<div class="notif-pop-head"><b>' + pick(NT.title) + '</b>' +
        (unreadCount() ? '<button type="button" class="btn btn-ghost btn-sm" data-mark-all>' + pick(NT.markAll) + '</button>' : '') + '</div>' +
        '<div class="notif-pop-body"></div>' +
        '<a class="notif-pop-foot" href="notifications.html">' + pick(NT.seeAll) + ' (' + NOTIFS.length + ')</a>';
      renderNotifs(pop.querySelector('.notif-pop-body'), { limit: 5, compact: true });
      var m = pop.querySelector('[data-mark-all]');
      if (m) m.addEventListener('click', function () { markAllRead(); draw(); pop.querySelector('.notif-pop-foot').focus(); });
    };
    draw();
    document.body.appendChild(pop); placePop();
    bell.setAttribute('aria-expanded', 'true');
    var first = pop.querySelector('.notif-title'); if (first) first.focus();
  };
  var setupNotifs = function () {
    document.querySelectorAll('a[href="notifications.html"].icon-btn').forEach(function (bell) {
      bell.setAttribute('aria-haspopup', 'dialog'); bell.setAttribute('aria-expanded', 'false');
      bell.addEventListener('click', function (e) {
        if (!desktop.matches) return; /* mobile : écran dédié */
        e.preventDefault(); e.stopPropagation();
        if (pop) closePop(true); else openPop(bell);
      });
    });
    document.addEventListener('click', function (e) { if (pop && !pop.contains(e.target)) closePop(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) closePop(true); });
    window.addEventListener('resize', function () { if (pop && !desktop.matches) closePop(false); else placePop(); });
    document.addEventListener('d4:lang', function () { syncBadges(); if (pop) { var b = popBell; closePop(false); openPop(b); } });
    syncBadges();
  };
  window.D4_NOTIFS = { render: renderNotifs, markAllRead: markAllRead, unreadCount: unreadCount, all: NOTIFS, labels: NT, pick: pick };

  /* ---------- v4.2 : navigation desktop en barre haute + profil ----------
     ≥ 1024 px : la colonne latérale disparaît ; l'en-tête porte logo · navigation en pastilles · cloche · profil.
     La roue dentée devient l'avatar du profil : panneau déroulant sur desktop, écran dédié (profil.html) sur mobile.
     Appliqué aussi aux en-têtes statiques des pages D3 (une seule définition, NAV). */
  var PAGE_SECTION = { 'accueil': 'home', 'accueil-b': 'home', 'accueil-c': 'home', 'frigo': 'fridge', 'onboarding': 'fridge', 'scan': 'fridge',
    'recherche': 'recipes', 'suggestions': 'recipes', 'recette': 'recipes', 'favoris': 'recipes', 'historique': 'recipes', 'mode-cuisine': 'recipes',
    'planning': 'planning', 'courses': 'grocery', 'liste-detail': 'grocery' };
  var currentSection = function () {
    var f = (location.pathname.split('/').pop() || '').replace('.html', '');
    return PAGE_SECTION[f] || '';
  };
  var USER = { name: 'Amine B.', initials: 'AB', kind: L4('Compte client', 'Compte client', 'حساب عميل', 'كونت كليون') };
  var PT = {
    profile: L4('Mon profil', 'Profil mte3i', 'ملفي الشخصي', 'البروفيل متاعي'),
    favs: L4('Mes favoris', 'Favoris mte3i', 'مفضّلاتي', 'المفضلة متاعي'),
    history: L4('Historique', 'Tarikh', 'السجل', 'التاريخ'),
    lists: L4('Mes listes de courses', 'Listet el qadhya', 'قوائم مشترياتي', 'ليستات القضية'),
    notifPrefs: L4('Notifications', 'Notifikasyon', 'الإشعارات', 'النوتيفيكاسيون'),
    theme: L4('Thème', 'Theme', 'المظهر', 'التيم'),
    light: L4('Clair', 'Fete7', 'فاتح', 'فاتح'), dark: L4('Sombre', 'Ghame9', 'داكن', 'غامق'),
    language: L4('Langue', 'Logha', 'اللغة', 'اللوغة'),
    allSettings: L4('Tous les réglages', 'Reglages el kol', 'كل الإعدادات', 'الإعدادات الكل'),
    logout: L4('Se déconnecter', 'Okhrej', 'تسجيل الخروج', 'اخرج'),
    account: L4('Profil et réglages', 'Profil w reglages', 'الملف والإعدادات', 'البروفيل والإعدادات'),
  };
  var avatarHtml = '<span class="avatar" aria-hidden="true">' + USER.initials + '</span>';
  var setupHeader = function () {
    document.querySelectorAll('.topbar').forEach(function (bar) {
      /* 1. avatar du profil à la place de la roue dentée */
      var gear = bar.querySelector('a.icon-btn[href="profil.html"]');
      if (gear) {
        gear.innerHTML = avatarHtml;
        gear.classList.add('profile-btn');
        gear.removeAttribute('data-i18n');
        gear.setAttribute('aria-label', pick(PT.account) + ' — ' + USER.name);
      }
      /* 2. navigation en pastilles (affichée ≥ 1024 px) */
      if (!bar.querySelector('.top-nav')) {
        var cur = currentSection();
        var nav = document.createElement('nav');
        nav.className = 'top-nav'; nav.setAttribute('aria-label', 'Navigation principale');
        nav.innerHTML = NAV.map(function (n) {
          return '<a class="tn" href="' + n.href + '"' + (n.id === cur ? ' aria-current="page"' : '') + '>' + svg(n.id) +
            '<span data-i18n="' + n.key + '"></span>' + (n.badge ? '<span class="tn-badge"><span aria-hidden="true">' + n.badge + '</span><span class="sr-only">' + n.badgeLabel + '</span></span>' : '') + '</a>';
        }).join('');
        var spacer = bar.querySelector('.spacer');
        if (spacer) bar.insertBefore(nav, spacer); else bar.appendChild(nav);
      }
    });
    /* La colonne latérale statique des pages D3 est retirée du flux sur desktop (CSS), la barre haute la remplace. */
  };

  /* Panneau de profil (desktop) : identité, raccourcis, thème et langue rapides, tous les réglages, déconnexion. */
  var ppop = null, pbtn = null;
  var closeProfile = function (focusBack) {
    if (!ppop) return; ppop.remove(); ppop = null;
    if (pbtn) { pbtn.setAttribute('aria-expanded', 'false'); if (focusBack) pbtn.focus(); }
  };
  var openProfile = function (btn) {
    closePop(false);
    pbtn = btn; ppop = document.createElement('div');
    ppop.className = 'notif-pop profile-pop'; ppop.setAttribute('role', 'dialog'); ppop.setAttribute('aria-label', pick(PT.account));
    var mode = html.getAttribute('data-mode');
    var item = function (href, icon, label, extra) { return '<a class="pp-item" href="' + href + '"><span class="notif-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + icon + '</svg></span><span class="grow">' + label + '</span>' + (extra || '') + '</a>'; };
    ppop.innerHTML =
      '<a class="pp-head" href="profil.html">' + avatarHtml.replace('avatar"', 'avatar avatar-lg"') + '<span class="grow"><b>' + USER.name + '</b><span class="muted">' + pick(USER.kind) + ' · ' + pick(PT.profile) + '</span></span></a>' +
      '<div class="pp-list">' +
        item('favoris.html', ICONS.heart, pick(PT.favs), '<span class="pp-count">2</span>') +
        item('historique.html', NICON.timer, pick(PT.history)) +
        item('liste-detail.html', NICON.cart, pick(PT.lists), '<span class="pp-count">2</span>') +
        item('notifications.html', ICONS.bell, pick(PT.notifPrefs), unreadCount() ? '<span class="pp-count is-hot">' + unreadCount() + '</span>' : '') +
      '</div>' +
      '<div class="pp-quick">' +
        '<div class="pp-row"><span>' + pick(PT.theme) + '</span><span class="seg" role="group" aria-label="' + pick(PT.theme) + '">' +
          '<button type="button" data-pp-mode="light" aria-pressed="' + (mode === 'light') + '">' + pick(PT.light) + '</button>' +
          '<button type="button" data-pp-mode="dark" aria-pressed="' + (mode === 'dark') + '">' + pick(PT.dark) + '</button></span></div>' +
        '<div class="pp-row"><label for="pp-lang">' + pick(PT.language) + '</label><select id="pp-lang" class="select" style="width:auto;min-height:40px">' +
          ['fr', 'derja', 'ar', 'derja_ar'].map(function (k) { return '<option value="' + k + '"' + (k === lang ? ' selected' : '') + '>' + LANGS[k].label + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="pp-foot"><a href="profil.html">' + pick(PT.allSettings) + '</a><button type="button" class="pp-logout">' + pick(PT.logout) + '</button></div>';
    if (html.getAttribute('data-auth') === 'guest') {
      ppop.querySelector('.pp-head').remove(); ppop.querySelector('.pp-list').remove();
      ppop.querySelector('.pp-logout').remove();
      ppop.insertAdjacentHTML('afterbegin', guestPanel());
    }
    document.body.appendChild(ppop);
    var r = btn.getBoundingClientRect(), rtl = html.getAttribute('dir') === 'rtl';
    ppop.style.top = (r.bottom + 8) + 'px';
    if (rtl) { ppop.style.left = Math.max(8, r.left) + 'px'; } else { ppop.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; }
    btn.setAttribute('aria-expanded', 'true');
    ppop.querySelectorAll('[data-pp-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        /* pas de clic simulé sur la pastille Démo : il fermait le panneau (clic « extérieur ») */
        html.setAttribute('data-mode', b.dataset.ppMode);
        document.querySelectorAll('.mode-ctl').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.mode === b.dataset.ppMode)); });
        b.parentNode.querySelectorAll('[data-pp-mode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    ppop.querySelector('#pp-lang').addEventListener('change', function (e) {
      lang = e.target.value; applyLang(); var b = pbtn; closeProfile(false); openProfile(b);
    });
    var lo = ppop.querySelector('.pp-logout');
    if (lo) lo.addEventListener('click', function () { closeProfile(true); setAuth('guest'); labelProfileBtns(); document.querySelectorAll('.auth-ctl').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === 'guest')); }); document.dispatchEvent(new CustomEvent('d4:auth')); snack(t('loggedOut')); });
    (ppop.querySelector('a.pp-head') || ppop.querySelector('a')).focus();
  };
  var setupProfile = function () {
    document.querySelectorAll('a.profile-btn').forEach(function (btn) {
      btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function (e) {
        if (!desktop.matches) return; /* mobile : écran dédié profil.html */
        e.preventDefault(); e.stopPropagation();
        if (ppop) closeProfile(true); else openProfile(btn);
      });
    });
    document.addEventListener('click', function (e) { if (ppop && !ppop.contains(e.target)) closeProfile(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ppop) closeProfile(true); });
    window.addEventListener('resize', function () { if (ppop && !desktop.matches) closeProfile(false); });
  };

  /* ---------- v4.2 : carrousel horizontal générique (.rail) ----------
     Mobile / tactile : défilement au doigt, aucune flèche. Desktop (pointeur fin) : flèches rondes centrées
     verticalement sur les bords, affichées SEULEMENT s'il y a du contenu caché de ce côté ; si tout tient,
     aucune flèche (cas « sans défilement »). RTL : sens inversé. Aucune bibliothèque. */
  var setupRails = function () {
    document.querySelectorAll('[data-rail]').forEach(function (rail) {
      var track = rail.querySelector('.rail-track');
      if (!track || rail.querySelector('.rail-btn')) return;
      var label = rail.getAttribute('data-rail') || 'éléments';
      rail.insertAdjacentHTML('afterbegin', '<button type="button" class="rail-btn prev" aria-label="Défiler vers les ' + label + ' précédents" tabindex="-1">' + svg('back', 'flip-rtl') + '</button>');
      rail.insertAdjacentHTML('beforeend', '<button type="button" class="rail-btn next" aria-label="Défiler vers les ' + label + ' suivants" tabindex="-1"><svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>');
      var prev = rail.querySelector('.rail-btn.prev'), next = rail.querySelector('.rail-btn.next');
      var update = function () {
        var max = track.scrollWidth - track.clientWidth;
        var pos = Math.abs(track.scrollLeft); /* Chromium/Firefox : scrollLeft négatif en RTL */
        var over = max > 2;
        rail.classList.toggle('is-scrollable', over);
        prev.hidden = !over || pos < 4;
        next.hidden = !over || pos > max - 4;
        rail.classList.toggle('fade-start', over && pos >= 4);
        rail.classList.toggle('fade-end', over && pos <= max - 4);
      };
      var go = function (dir) {
        var sign = html.getAttribute('dir') === 'rtl' ? -1 : 1;
        track.scrollBy({ left: dir * sign * Math.max(160, track.clientWidth * 0.85), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      };
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      track.addEventListener('scroll', update, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(update).observe(track);
      window.addEventListener('resize', update); /* aussi quand le contenu change (catégories générées) */
      document.addEventListener('d4:lang', function () { setTimeout(update, 0); });
      track.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', update); });
      update();
    });
  };

  /* ---------- v4.3 : variantes de navigation desktop + état « invité » (non connecté) ----------
     html[data-navstyle] : pills (barre haute à pastilles, retenue) · edito (deux niveaux + recherche) · dock (dock flottant).
     html[data-auth] : user (connecté) · guest (sans compte : données sur l'appareil seulement).
     Les deux sont mémorisés pour la session de démonstration (sessionStorage, repli sans). */
  var demoState = function (key, attr, fallback) {
    var v = fallback; try { v = sessionStorage.getItem(key) || fallback; } catch (e) { /* mode privé */ }
    html.setAttribute(attr, v);
    return function (nv) { html.setAttribute(attr, nv); try { sessionStorage.setItem(key, nv); } catch (e) { /* rien */ } };
  };
  var setNavStyle = demoState('d4-nav', 'data-navstyle', 'pills');
  var setAuth = demoState('d4-auth', 'data-auth', 'user');
  var GT = {
    guestTitle: L4('Vous n’êtes pas connecté', 'Mazelt ma dkhaltech', 'لم تسجّل الدخول', 'مازلت ما دخلتش'),
    guestLead: L4('Votre frigo, vos favoris et vos listes restent sur cet appareil. Un compte les retrouve sur tous vos appareils.', 'El frigo w el favoris w el listet yob9aw fel téléphone hedha. B compte tal9ahom fi ay appareil.', 'تبقى ثلاجتك ومفضّلاتك وقوائمك على هذا الجهاز. الحساب يتيحها على كل أجهزتك.', 'الفريجيدار والمفضلة والليستات يبقاو في التليفون هذا. بالكونت تلقاهم في أي جهاز.'),
    login: L4('Se connecter', 'Odkhel', 'تسجيل الدخول', 'ادخل'),
    signup: L4('Créer un compte', 'A3mel compte', 'إنشاء حساب', 'اعمل كونت'),
    onDevice: L4('sur cet appareil', 'fel appareil hedha', 'على هذا الجهاز', 'في الجهاز هذا'),
    search: L4('Rechercher une recette, un ingrédient…', 'Lawwej 3la makla walla ingrédient…', 'ابحث عن وصفة أو مكوّن…', 'لوّج على ماكلة ولّا مكوّن…'),
    guestProfile: L4('Profil (invité)', 'Profil (invité)', 'الملف (زائر)', 'البروفيل (زائر)'),
  };
  var GUEST_ICON = '<span class="avatar avatar-guest" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></span>';
  var labelProfileBtns = function () {
    document.querySelectorAll('a.profile-btn').forEach(function (b) {
      b.setAttribute('aria-label', html.getAttribute('data-auth') === 'guest' ? pick(GT.guestProfile) : pick(PT.account) + ' — ' + USER.name);
    });
  };
  var setupHeaderV43 = function () {
    document.querySelectorAll('.topbar').forEach(function (bar) {
      var p = bar.querySelector('a.profile-btn');
      if (p && !p.querySelector('.avatar-guest')) p.insertAdjacentHTML('beforeend', GUEST_ICON);
      if (p && !bar.querySelector('.login-btn')) p.insertAdjacentHTML('beforebegin', '<a class="btn btn-primary btn-sm login-btn" href="connexion.html">' + pick(GT.login) + '</a>');
      var nav = bar.querySelector('.top-nav');
      if (nav && !bar.querySelector('.top-search')) nav.insertAdjacentHTML('beforebegin', '<a class="top-search" href="recherche.html"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>' + pick(GT.search) + '</span></a>');
    });
    labelProfileBtns();
    document.addEventListener('d4:lang', function () {
      labelProfileBtns();
      document.querySelectorAll('.login-btn').forEach(function (b) { b.textContent = pick(GT.login); });
      document.querySelectorAll('.top-search span').forEach(function (s) { s.textContent = pick(GT.search); });
    });
  };
  /* Contenu du panneau pour un invité : promesse claire, deux actions, réglages rapides gardés. */
  var guestPanel = function () {
    return '<div class="pp-head" style="display:block"><b>' + pick(GT.guestTitle) + '</b><span class="muted" style="display:block;margin-top:4px">' + pick(GT.guestLead) + '</span>' +
      '<div class="row" style="margin-top:12px;flex-wrap:nowrap"><a class="btn btn-primary btn-sm" style="flex:1" href="connexion.html">' + pick(GT.login) + '</a><a class="btn btn-secondary btn-sm" style="flex:1" href="connexion.html#signup">' + pick(GT.signup) + '</a></div></div>' +
      '<div class="pp-list">' +
        '<a class="pp-item" href="favoris.html"><span class="notif-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONS.heart + '</svg></span><span class="grow">' + pick(PT.favs) + ' <span class="muted" style="font-weight:600">· ' + pick(GT.onDevice) + '</span></span><span class="pp-count">2</span></a>' +
        '<a class="pp-item" href="historique.html"><span class="notif-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + NICON.timer + '</svg></span><span class="grow">' + pick(PT.history) + '</span></a>' +
      '</div>';
  };
  var addDemoControlsV43 = function () {
    var bar = document.querySelector('.controls'); if (!bar) return;
    var g = document.createElement('div'); g.className = 'grp'; g.style.flexWrap = 'wrap';
    g.innerHTML = '<span class="lbl">Compte</span><button class="ctl auth-ctl" data-v="user">Connecté</button><button class="ctl auth-ctl" data-v="guest">Invité</button>' +
      '<span class="lbl">Nav desktop</span><button class="ctl nav-ctl" data-v="pills">Pastilles</button><button class="ctl nav-ctl" data-v="edito">Éditorial</button><button class="ctl nav-ctl" data-v="dock">Dock</button>';
    var index = bar.querySelector('a[href*="index.html"]'); bar.insertBefore(g, index || null);
    var sync = function () {
      g.querySelectorAll('.auth-ctl').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === html.getAttribute('data-auth'))); });
      g.querySelectorAll('.nav-ctl').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === html.getAttribute('data-navstyle'))); });
    };
    g.querySelectorAll('.auth-ctl').forEach(function (b) { b.addEventListener('click', function () { setAuth(b.dataset.v); closeProfile(false); labelProfileBtns(); sync(); document.dispatchEvent(new CustomEvent('d4:auth')); }); });
    g.querySelectorAll('.nav-ctl').forEach(function (b) { b.addEventListener('click', function () { setNavStyle(b.dataset.v); sync(); window.dispatchEvent(new Event('resize')); }); });
    sync();
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupShell();
    setupBrand();
    setupHeader();
    setupHeaderV43();
    setupNotifs();
    setupProfile();
    setupRails();
    setupDemoBar();
    addDemoControlsV43();
    setupLangs();
    /* Paramètres d'adresse de démonstration (captures, revues) : ?lang=ar&mode=dark&auth=guest&nav=edito */
    (function () { var qp = new URLSearchParams(location.search);
      if (qp.get('lang') && LANGS[qp.get('lang')]) lang = qp.get('lang');
      if (qp.get('mode')) html.setAttribute('data-mode', qp.get('mode') === 'dark' ? 'dark' : 'light');
      if (qp.get('auth')) html.setAttribute('data-auth', qp.get('auth') === 'guest' ? 'guest' : 'user');
      if (qp.get('nav')) html.setAttribute('data-navstyle', qp.get('nav')); })();
    applyLang();
    bind();
    setupSearch();
    setupTabs();
    setupPager();
    setupQty();
    setupChecks();
    setupPhotos();
    setupFav();
    setupAds();
    setupRecognize();
    /* En mode embed (iframe responsive.html) : masquer la barre de contrôle. */
    if (new URLSearchParams(location.search).get('embed') === '1') {
      var c = document.querySelector('.controls');
      if (c) c.style.display = 'none';
    }
  });
})();
