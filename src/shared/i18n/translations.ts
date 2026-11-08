import { Language } from '@/core/shared';

export interface TranslationDictionary {
  appName: string;
  slogan: string;
  tagline: string;
  // Navigation
  navHome: string;
  navFridge: string;
  navRecipes: string;
  navWeekly: string;
  navGrocery: string;
  navBackoffice: string;
  // Hero & Search
  heroTitle: string;
  heroSubtitle: string;
  btnFindMeal: string;
  btnOpenFridge: string;
  btnScanPhoto: string;
  quickIdeas: string;
  // Fridge Selector
  fridgeTitle: string;
  fridgeSubtitle: string;
  searchPlaceholder: string;
  selectedCount: string;
  clearSelection: string;
  addBtn: string;
  cookNowAction: string;
  // Categories
  catVegetables: string;
  catFruits: string;
  catMeats: string;
  catFish: string;
  catDairyEggs: string;
  catGrainsPasta: string;
  catSpicesCondiments: string;
  catCannedPantry: string;
  catOther: string;
  // Match Tiers
  tierReadyTitle: string;
  tierReadyDesc: string;
  tierAlmostTitle: string;
  tierAlmostDesc: string;
  tierIdeasTitle: string;
  tierIdeasDesc: string;
  // Filters
  filterAll: string;
  filterBudget: string;
  filterTime: string;
  filterType: string;
  filterCuisine: string;
  under5DT: string;
  between5and10DT: string;
  between10and20DT: string;
  over20DT: string;
  under15Min: string;
  under30Min: string;
  under45Min: string;
  over45Min: string;
  // Recipe Detail
  servings: string;
  person: string;
  persons: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  costEstimate: string;
  ingredientsTitle: string;
  availableIngredients: string;
  missingIngredients: string;
  stepsTitle: string;
  chefTipTitle: string;
  shareWhatsApp: string;
  addToFavorites: string;
  removeFromFavorites: string;
  favoriteAddedToast: string;
  // Weekly Planner
  weeklyTitle: string;
  weeklySubtitle: string;
  lunch: string;
  dinner: string;
  generateWeekPlan: string;
  generateGroceryList: string;
  emptySlot: string;
  chooseDish: string;
  // Grocery List
  groceryTitle: string;
  grocerySubtitle: string;
  itemsToBuy: string;
  itemsBought: string;
  addManualItem: string;
  clearChecked: string;
  shareGroceryWhatsApp: string;
  emptyGrocery: string;
  // Backoffice
  boTitle: string;
  boSubtitle: string;
  boTabDashboard: string;
  boTabRecipes: string;
  boTabIngredients: string;
  boTabData: string;
  boAddRecipe: string;
  boEditRecipe: string;
  boDeleteRecipe: string;
  boTotalRecipes: string;
  boActiveRecipes: string;
  boAvgCost: string;
  boMarketPrices: string;
  boExportData: string;
  boImportData: string;
  boResetDefault: string;
  boConfirmDelete: string;
  boSave: string;
  boCancel: string;
  // Scanner Modal
  scannerTitle: string;
  scannerDesc: string;
  scannerCameraBtn: string;
  scannerUploadBtn: string;
  scannerAnalyzing: string;
  scannerDetected: string;
  scannerAddSelected: string;
  scannerErrorKey: string;
  // PWA & Common
  pwaInstall: string;
  pwaInstallIOS: string;
  pwaInstallDesc: string;
  offlineNotice: string;
  noResultsTitle: string;
  noResultsDesc: string;
  settingsTitle: string;
  settingsTheme: string;
  settingsMode: string;
  modeLight: string;
  modeDark: string;
  modeSystem: string;
  settingsLanguage: string;
  settingsClose: string;
  themeActive: string;
  backAgainToExit: string;
  pantryTitle: string;
  pantryDesc: string;
  inPantry: string;
  noRecipeYet: string;
  missingKeyLabel: string;
  missingLabel: string;
  withSubstitute: string;
  insteadOf: string;
  groceryCost: string;
  updateAvailable: string;
  updateReload: string;
  courseAll: string;
  courseEntree: string;
  courseMain: string;
  courseDessert: string;
  courseEntreePlural: string;
  courseMainPlural: string;
  courseDessertPlural: string;
  mandatory: string;
  addCourse: string;
  healthyLabel: string;
  healthyOnly: string;
  expressLabel: string;
  mealsWithoutMain: string;
  emptyMeals: string;
  optWithEntree: string;
  optWithDessert: string;
  optHealthy: string;
  removeMealConfirm: string;
  healthyFallback: string;
  chooseCourse: string;
  noRecipeForCourse: string;
  planGenerated: string;
  quickHealthyTitle: string;
  quickHealthyDesc: string;
  removeLabel: string;
  replaceLabel: string;
  videoTitle: string;
  videoWatch: string;
  videoOpenYoutube: string;
  videoBadge: string;
  recipesAllTab: string;
  recipesSuggestionsTab: string;
  selectedIngredientsTitle: string;
  showAllLabel: string;
  showLessLabel: string;
  removeIngredientLabel: string;
  suggestionsEmptyTitle: string;
  suggestionsEmptyDesc: string;
  catalogEmptyTitle: string;
  catalogEmptyDesc: string;
  resetFiltersLabel: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  derja: {
    appName: 'Chnowa Ntayeb',
    slogan: 'Elli 3andek fel frigo, na3mlou bih makla !',
    tagline: 'Chnowa ntayeb el youm ?',
    navHome: 'El Accueil',
    navFridge: 'El Frigo',
    navRecipes: 'Maklet',
    navWeekly: 'Menu Jom3a',
    navGrocery: 'Qadhya',
    navBackoffice: 'Backoffice',
    heroTitle: 'Chnowa ntayeb el youm ?',
    heroSubtitle:
      'Ekhtar elli 3andek fel koujina w chouf a7sen maklet tounsiya tnejjem ttayebhom f a9al men 30 thanya !',
    btnFindMeal: 'Lawajli 3la makla',
    btnOpenFridge: '7ell el frigo mte3i',
    btnScanPhoto: 'Sawar el frigo bel AI',
    quickIdeas: 'Afkar mta3 fisa3',
    fridgeTitle: 'Chnowa 3andi fel frigo ?',
    fridgeSubtitle: "Ekliki 3la l'ingrédients elli 7adhra 3andek fel dar :",
    searchPlaceholder: 'Lawwej 3la ingrédient (tmatem, 3dham, batata...)',
    selectedCount: 'ingrédient ekhtarthom',
    clearSelection: 'Fasakh el kol',
    addBtn: 'Zid',
    cookNowAction: ' ورّيني شنوة نطيب !',
    catVegetables: 'Khdhra',
    catFruits: 'Ghallah',
    catMeats: 'L7am w Djaj',
    catFish: '7out w Fawakeh Ba7r',
    catDairyEggs: '3dham w 7libiyat',
    catGrainsPasta: 'Ma9rouna w 3jin',
    catSpicesCondiments: 'Fé7at w Hrisa',
    catCannedPantry: 'Conserves w Mo2na',
    catOther: '7weyej okhra',
    tierReadyTitle: 'Njem ntayebha tawa !',
    tierReadyDesc: '3andek el ingrédients el kol el lezma f dar',
    tierAlmostTitle: 'Naqsek ken chwaya',
    tierAlmostDesc: "Yenqsek 7aja walla thnin d'appoint",
    tierIdeasTitle: 'Afkar okhra behya',
    tierIdeasDesc: 'Maklet bnina tnejjem tefker feha',
    filterAll: 'El kol',
    filterBudget: 'Budget',
    filterTime: 'Waqt',
    filterType: 'Naw3 el makla',
    filterCuisine: 'Style',
    under5DT: 'A9al men 5 DT',
    between5and10DT: 'Bin 5 w 10 DT',
    between10and20DT: 'Bin 10 w 20 DT',
    over20DT: 'Akther men 20 DT',
    under15Min: 'Fisa3 (< 15 min)',
    under30Min: '< 30 min',
    under45Min: '< 45 min',
    over45Min: 'Tayyeb 3la ra7tek',
    servings: 'Mta3 9adésh men we7ed',
    person: 'we7ed',
    persons: '3bed',
    prepTime: 'Ta7dhir',
    cookTime: 'Tatyib',
    totalTime: 'El waqt el kol',
    costEstimate: 'Soum ta9ribi',
    ingredientsTitle: 'El Mawkounat (Ingrédients)',
    availableIngredients: '3andek fel dar',
    missingIngredients: 'Naqsek',
    stepsTitle: 'Tari9et el khedma',
    chefTipTitle: 'Nasi7et Chef Souhed',
    shareWhatsApp: 'Eb3ath 3la WhatsApp',
    addToFavorites: 'Zidha fel Favoris',
    removeFromFavorites: 'Na7i mel Favoris',
    favoriteAddedToast: 'Tzedet fel favoris mte3ek !',
    weeklyTitle: 'Menu el Joumou3a',
    weeklySubtitle: 'Barmej makletik l koll Youm men ghir 7ira',
    lunch: 'Ftour nos nhar',
    dinner: 'El 3cha',
    generateWeekPlan: 'Généri programme auto',
    generateGroceryList: 'A3melli liste mta3 qadhya',
    emptySlot: 'Mazelt fergha',
    chooseDish: 'Ekhtar makla',
    groceryTitle: 'Liste el Qadhya',
    grocerySubtitle: 'Elli lezmek techrih mel 7anout walla el souq',
    itemsToBuy: 'Lezmek techri',
    itemsBought: 'Chrithom',
    addManualItem: 'Zid 7aja lil 9adhya...',
    clearChecked: 'Fasakh elli chrithom',
    shareGroceryWhatsApp: 'Eb3ath el qadhya 3la WhatsApp',
    emptyGrocery: 'Liste fergha ! Zid maklet mel planning walla zid bi yeddek.',
    boTitle: 'Espace Idara & Backoffice',
    boSubtitle: 'Tasyeer el maklet, el ingrédients w aswem el souq',
    boTabDashboard: 'Tableau de bord',
    boTabRecipes: 'El Maklet',
    boTabIngredients: 'El Ingrédients w Aswem',
    boTabData: 'Sauvegarde & Import',
    boAddRecipe: 'Zid Makla jdida',
    boEditRecipe: 'Baddel el Makla',
    boDeleteRecipe: 'Fasakh',
    boTotalRecipes: 'Total el maklet',
    boActiveRecipes: 'Maklet mnachra',
    boAvgCost: 'Moyenne soum el s7an (DT)',
    boMarketPrices: 'Aswem el souq f tounes',
    boExportData: 'Exporti el données (JSON)',
    boImportData: 'Importi données',
    boResetDefault: 'Raja3 el maklet mta3 el asel',
    boConfirmDelete: 'Met2aked theb tfasakh hedhi ?',
    boSave: '3addi w Sajjel',
    boCancel: 'Batel',
    scannerTitle: 'Sawar el frigo bel AI',
    scannerDesc: '7ott taswira mta3 el frigo mte3ek, el AI bech ytalla3 el ingrédients fisa3',
    scannerCameraBtn: 'Kapturi bel caméra',
    scannerUploadBtn: 'Televersi taswira',
    scannerAnalyzing: '9a3ed ychouf fel frigo...',
    scannerDetected: 'Ingrédients l9inehom :',
    scannerAddSelected: 'Zidhom lil Frigo',
    scannerErrorKey: 'Lezem t7ott clé Gemini fel secrets bech tekhdem el caméra AI.',
    pwaInstall: "Installi l'application",
    pwaInstallIOS: 'Installi 3la iPhone',
    pwaInstallDesc: 'Installi Chnowa Ntayeb 3la talifounek bech testa3melha f ay waqt 7atta hors-ligne !',
    offlineNotice: 'Khaddem Hors-Ligne — el maklet elli msajla tekhdem sans connexion !',
    noResultsTitle: 'Ma l9inéch makla tfe9 100%',
    noResultsDesc: 'Zid chwaya ingrédients mel frigo walla chouf el recettes elli naqshin 7aja barka !',
    settingsTitle: 'Réglages',
    settingsTheme: 'Thème',
    settingsMode: 'Lewn',
    modeLight: 'Nhar',
    modeDark: 'Lil',
    modeSystem: 'Auto',
    settingsLanguage: 'Lougha',
    settingsClose: 'Sakker',
    themeActive: 'Mékhtar',
    backAgainToExit: 'Enzel marra okhra bech tokhrej',
    pantryTitle: 'Placard mte3ek',
    pantryDesc: 'Elli dima 3andek fel dar (mel7, zit, twabel...). Ma tet7sebch na9sa.',
    inPantry: 'Fel placard',
    noRecipeYet: 'Mafamech recette tawa',
    missingKeyLabel: 'Na9es el asesi',
    missingLabel: 'Na9sek',
    withSubstitute: 'b',
    insteadOf: 'fi blasset',
    groceryCost: '~{n} DT 9adhya',
    updateAvailable: 'Version jdida mawjouda',
    updateReload: 'Rechargi',
    courseAll: 'Kol chay',
    courseEntree: 'Entrée',
    courseMain: 'Plat principal',
    courseDessert: '7lowa',
    courseEntreePlural: 'Entréet',
    courseMainPlural: 'Plats',
    courseDessertPlural: '7lowiyet',
    mandatory: 'Lazem',
    addCourse: '+ {course}',
    healthyLabel: 'Healthy',
    healthyOnly: 'Ken healthy',
    expressLabel: 'Express',
    mealsWithoutMain: '{n} makla men ghir plat principal',
    emptyMeals: '{n} makla mazelet fergha',
    optWithEntree: '+ entréet',
    optWithDessert: '+ 7lowiyet',
    optHealthy: 'Menu healthy',
    removeMealConfirm: 'Tna77i el plat principal? El makla el kol (entrée w 7lowa) tetna77a.',
    healthyFallback: 'Mafamech recettes healthy l: {list}. 7attina recettes okhrin.',
    chooseCourse: 'Ekhtar {course}',
    noRecipeForCourse: 'Mafamech recette mta3 el naw3 hedha.',
    planGenerated: 'El menu tsna3 !',
    quickHealthyTitle: 'Makla healthy',
    quickHealthyDesc: 'Khfif w mitwazen',
    removeLabel: 'Na77i',
    replaceLabel: 'Baddel',
    videoTitle: 'Vidéo el tayyib',
    videoWatch: 'Chouf el vidéo',
    videoOpenYoutube: 'Fta7 3la YouTube',
    videoBadge: 'Vidéo',
    recipesAllTab: 'Maklet el kol',
    recipesSuggestionsTab: 'Ekhtiyarati',
    selectedIngredientsTitle: 'Frigo mte3i',
    showAllLabel: 'Warini el kol',
    showLessLabel: 'Na9es',
    removeIngredientLabel: 'Na7i',
    suggestionsEmptyTitle: 'El frigo fera8',
    suggestionsEmptyDesc: 'Ekhtar chwaya ingrédients bech nwarrik chnowa tnajem ttayeb.',
    catalogEmptyTitle: 'Ma fama 7atta makla b had el filtres',
    catalogEmptyDesc: 'Na7i filtre walla badel el recherche.',
    resetFiltersLabel: 'Fasakh el filtres',
  },
  fr: {
    appName: 'Chnowa Ntayeb',
    slogan: 'Avec ce que tu as dans le frigo, on prépare un bon plat !',
    tagline: "Qu'est-ce qu'on cuisine aujourd'hui ?",
    navHome: 'Accueil',
    navFridge: 'Mon Frigo',
    navRecipes: 'Recettes',
    navWeekly: 'Menu Semaine',
    navGrocery: 'Courses',
    navBackoffice: 'Backoffice',
    heroTitle: "Qu'est-ce qu'on cuisine aujourd'hui ?",
    heroSubtitle:
      'Sélectionnez vos ingrédients et découvrez instantanément les meilleures recettes tunisiennes réalisables en moins de 30 secondes !',
    btnFindMeal: 'Trouve-moi une recette',
    btnOpenFridge: 'Ouvrir mon frigo',
    btnScanPhoto: "Scanner le frigo avec l'IA",
    quickIdeas: 'Idées rapides du jour',
    fridgeTitle: "Qu'avez-vous dans le frigo ?",
    fridgeSubtitle: 'Cochez les ingrédients disponibles dans votre cuisine :',
    searchPlaceholder: 'Rechercher un ingrédient (tomates, œufs, oignons...)',
    selectedCount: 'ingrédients sélectionnés',
    clearSelection: 'Tout effacer',
    addBtn: 'Ajouter',
    cookNowAction: 'Trouver mes recettes !',
    catVegetables: 'Légumes',
    catFruits: 'Fruits',
    catMeats: 'Viandes & Volailles',
    catFish: 'Poissons & Fruits de mer',
    catDairyEggs: 'Produits laitiers & Œufs',
    catGrainsPasta: 'Féculents, Pâtes & Céréales',
    catSpicesCondiments: 'Épices, Harissa & Condiments',
    catCannedPantry: 'Conserves & Épicerie',
    catOther: 'Autres ingrédients',
    tierReadyTitle: 'Je peux cuisiner tout de suite !',
    tierReadyDesc: 'Vous avez 100% des ingrédients requis chez vous',
    tierAlmostTitle: 'Il ne vous manque presque rien',
    tierAlmostDesc: "1 ou 2 ingrédients d'appoint à acheter au coin de la rue",
    tierIdeasTitle: 'Autres idées inspirantes',
    tierIdeasDesc: 'Plats traditionnels ou économiques à découvrir',
    filterAll: 'Tout afficher',
    filterBudget: 'Budget',
    filterTime: 'Temps',
    filterType: 'Type de repas',
    filterCuisine: 'Catégorie',
    under5DT: 'Moins de 5 DT',
    between5and10DT: '5 à 10 DT',
    between10and20DT: '10 à 20 DT',
    over20DT: 'Plus de 20 DT',
    under15Min: 'Express (< 15 min)',
    under30Min: '< 30 min',
    under45Min: '< 45 min',
    over45Min: 'Mijoté (> 45 min)',
    servings: 'Nombre de personnes',
    person: 'personne',
    persons: 'personnes',
    prepTime: 'Préparation',
    cookTime: 'Cuisson',
    totalTime: 'Temps total',
    costEstimate: 'Coût estimé',
    ingredientsTitle: 'Ingrédients requis',
    availableIngredients: 'Disponible chez vous',
    missingIngredients: 'À acheter',
    stepsTitle: 'Étapes de préparation',
    chefTipTitle: "L'astuce de Chef Souhed",
    shareWhatsApp: 'Partager sur WhatsApp',
    addToFavorites: 'Ajouter aux favoris',
    removeFromFavorites: 'Retirer des favoris',
    favoriteAddedToast: 'Recette ajoutée aux favoris !',
    weeklyTitle: 'Menu de la Semaine',
    weeklySubtitle: 'Planifiez vos déjeuners et dîners pour éviter le gaspillage',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    generateWeekPlan: 'Générer le planning auto',
    generateGroceryList: 'Générer la liste de courses',
    emptySlot: 'Aucun plat choisi',
    chooseDish: 'Choisir un plat',
    groceryTitle: 'Liste de Courses (Qadhya)',
    grocerySubtitle: 'Les ingrédients manquants consolidés pour le marché',
    itemsToBuy: 'À acheter',
    itemsBought: 'Déjà acheté',
    addManualItem: 'Ajouter un article (ex: pain, eau)...',
    clearChecked: 'Effacer les articles achetés',
    shareGroceryWhatsApp: 'Partager la liste sur WhatsApp',
    emptyGrocery: 'Votre liste de courses est vide. Ajoutez des recettes au menu pour la remplir !',
    boTitle: "Backoffice d'Administration",
    boSubtitle: 'Gestion des recettes, ingrédients et cours des prix en Tunisie',
    boTabDashboard: 'Tableau de bord',
    boTabRecipes: 'Recettes',
    boTabIngredients: 'Ingrédients & Prix',
    boTabData: 'Sauvegardes & Données',
    boAddRecipe: 'Nouvelle Recette',
    boEditRecipe: 'Modifier la Recette',
    boDeleteRecipe: 'Supprimer',
    boTotalRecipes: 'Total recettes',
    boActiveRecipes: 'Recettes publiées',
    boAvgCost: 'Coût moyen estimé (DT)',
    boMarketPrices: 'Prix indicatifs du marché (DT)',
    boExportData: 'Exporter les données (JSON)',
    boImportData: 'Importer des données',
    boResetDefault: "Restaurer le catalogue d'origine",
    boConfirmDelete: 'Êtes-vous sûr de vouloir supprimer cette recette ?',
    boSave: 'Enregistrer les modifications',
    boCancel: 'Annuler',
    scannerTitle: 'Scanner de Frigo par IA',
    scannerDesc: 'Prenez une photo de votre frigo : notre IA détecte les aliments visibles.',
    scannerCameraBtn: 'Prendre une photo',
    scannerUploadBtn: 'Importer une image',
    scannerAnalyzing: 'Analyse des ingrédients en cours...',
    scannerDetected: 'Ingrédients détectés :',
    scannerAddSelected: 'Ajouter au frigo',
    scannerErrorKey: 'Clé API Gemini requise pour la reconnaissance visuelle.',
    pwaInstall: "Installer l'application",
    pwaInstallIOS: 'Installer sur iPhone',
    pwaInstallDesc: "Installez Chnowa Ntayeb sur votre écran d'accueil pour un accès instantané et hors-ligne !",
    offlineNotice: 'Mode Hors-Ligne activé — Les recettes sauvegardées restent accessibles sans connexion !',
    noResultsTitle: 'Aucune recette 100% complète',
    noResultsDesc:
      'Ajoutez quelques ingrédients supplémentaires ou consultez les recettes où il manque 1 seul produit !',
    settingsTitle: 'Réglages',
    settingsTheme: 'Thème',
    settingsMode: 'Affichage',
    modeLight: 'Clair',
    modeDark: 'Sombre',
    modeSystem: 'Auto',
    settingsLanguage: 'Langue',
    settingsClose: 'Fermer',
    themeActive: 'Actif',
    backAgainToExit: 'Appuie encore une fois pour quitter',
    pantryTitle: 'Mon placard de base',
    pantryDesc: 'Ce que tu as toujours à la maison (sel, huile, épices…). Jamais compté comme manquant.',
    inPantry: 'Au placard',
    noRecipeYet: "Aucune recette pour l'instant",
    missingKeyLabel: "Manque l'essentiel",
    missingLabel: 'Il te manque',
    withSubstitute: 'avec',
    insteadOf: 'au lieu de',
    groceryCost: '~{n} DT de courses',
    updateAvailable: 'Nouvelle version disponible',
    updateReload: 'Recharger',
    courseAll: 'Tous',
    courseEntree: 'Entrée',
    courseMain: 'Plat principal',
    courseDessert: 'Dessert',
    courseEntreePlural: 'Entrées',
    courseMainPlural: 'Plats',
    courseDessertPlural: 'Desserts',
    mandatory: 'Obligatoire',
    addCourse: '+ {course}',
    healthyLabel: 'Healthy',
    healthyOnly: 'Healthy seulement',
    expressLabel: 'Express',
    mealsWithoutMain: '{n} repas sans plat principal',
    emptyMeals: '{n} repas pas encore planifiés',
    optWithEntree: '+ entrées',
    optWithDessert: '+ desserts',
    optHealthy: 'Menu healthy',
    removeMealConfirm: 'Retirer le plat principal ? Tout le repas (entrée et dessert) sera retiré.',
    healthyFallback: "Pas assez de recettes healthy pour : {list}. D'autres recettes ont été utilisées.",
    chooseCourse: 'Choisir : {course}',
    noRecipeForCourse: "Aucune recette de ce type pour l'instant.",
    planGenerated: 'Menu de la semaine généré',
    quickHealthyTitle: 'Healthy',
    quickHealthyDesc: 'Léger et équilibré',
    removeLabel: 'Retirer',
    replaceLabel: 'Changer',
    videoTitle: 'Vidéo de préparation',
    videoWatch: 'Regarder',
    videoOpenYoutube: 'Ouvrir sur YouTube',
    videoBadge: 'Vidéo',
    recipesAllTab: 'Toutes les recettes',
    recipesSuggestionsTab: 'Mes suggestions',
    selectedIngredientsTitle: 'Mon frigo',
    showAllLabel: 'Tout voir',
    showLessLabel: 'Réduire',
    removeIngredientLabel: 'Retirer',
    suggestionsEmptyTitle: 'Votre frigo est vide',
    suggestionsEmptyDesc: 'Sélectionnez quelques ingrédients pour voir les recettes que vous pouvez cuisiner.',
    catalogEmptyTitle: 'Aucune recette ne correspond à ces filtres',
    catalogEmptyDesc: 'Retirez un filtre ou modifiez la recherche.',
    resetFiltersLabel: 'Effacer les filtres',
  },
  ar: {
    appName: 'شنوة نطيب؟',
    slogan: 'اللي عندك في الفريجيدار نعملو بيه ماكلة بنينة!',
    tagline: 'شنوة نطيب اليوم؟',
    navHome: 'الرئيسية',
    navFridge: 'الفريجيدار',
    navRecipes: 'الوصفات',
    navWeekly: 'قائمة الجمعة',
    navGrocery: 'القضية',
    navBackoffice: 'الإدارة',
    heroTitle: 'شنوة نطيب اليوم؟',
    heroSubtitle: 'اختار المكونات اللي متوفرة عندك في الدار وتعرف على أشهى المأكولات التونسية في أقل من 30 ثانية!',
    btnFindMeal: 'دبّرلي في ماكلة',
    btnOpenFridge: 'حلّ الفريجيدار',
    btnScanPhoto: 'صوّر الفريجيدار بالذكاء الاصطناعي',
    quickIdeas: 'أفكار سريعة لليوم',
    fridgeTitle: 'شنوة عندك في الفريجيدار؟',
    fridgeSubtitle: 'انزل على المكونات اللي حاضرة عندك في الكوجينة:',
    searchPlaceholder: 'لوّج على مكوّن (طماطم، عظام، بطاطا...)',
    selectedCount: 'مكوّنات مختارة',
    clearSelection: 'فسّخ الكل',
    addBtn: 'زيد',
    cookNowAction: 'ورّيني شنوة نطيب !',
    catVegetables: 'خضرة',
    catFruits: 'غلال',
    catMeats: 'لحم ودجاج',
    catFish: 'حوت وغلال البحر',
    catDairyEggs: 'عظام ومشتقات الحليب',
    catGrainsPasta: 'مقرونة وحبوب وعجين',
    catSpicesCondiments: 'فاحات وهريسة',
    catCannedPantry: 'معلبات ومونة',
    catOther: 'حاجات أخرى',
    tierReadyTitle: 'نجم نطيبها توّا !',
    tierReadyDesc: 'عندك كامل المكونات الأساسية في الدار',
    tierAlmostTitle: 'ناقصك كان شوية',
    tierAlmostDesc: 'ينقصك مكوّن أو اثنين فقط من الحانوت',
    tierIdeasTitle: 'أفكار أخرى ممتازة',
    tierIdeasDesc: 'أطباق تونسية تقليدية أو اقتصادية تستحق التجربة',
    filterAll: 'الكل',
    filterBudget: 'الميزانية',
    filterTime: 'الوقت',
    filterType: 'نوع الوجبة',
    filterCuisine: 'النمط',
    under5DT: 'أقل من 5 د.ت',
    between5and10DT: 'بين 5 و 10 د.ت',
    between10and20DT: 'بين 10 و 20 د.ت',
    over20DT: 'أكثر من 20 د.ت',
    under15Min: 'فيسع (< 15 دقيقة)',
    under30Min: '< 30 دقيقة',
    under45Min: '< 45 دقيقة',
    over45Min: 'طيّاب على نار هادية',
    servings: 'عدد الأشخاص',
    person: 'شخص',
    persons: 'أشخاص',
    prepTime: 'التحضير',
    cookTime: 'الطهي',
    totalTime: 'الوقت الجملي',
    costEstimate: 'السوم التقديري',
    ingredientsTitle: 'المكونات المطلوبة',
    availableIngredients: 'متوفر عندك',
    missingIngredients: 'لازمك تشريه',
    stepsTitle: 'طريقة التحضير خطوة بخطوة',
    chefTipTitle: 'نصيحة Chef Souhed',
    shareWhatsApp: 'ابعث على واتساب',
    addToFavorites: 'زيد في المفضلة',
    removeFromFavorites: 'نحّي من المفضلة',
    favoriteAddedToast: 'تمت الإضافة إلى المفضلة!',
    weeklyTitle: 'برنامج الجمعة',
    weeklySubtitle: 'نظّم فطوراتك وعشاءاتك على 7 أيام واقضي على الحيرة',
    lunch: 'فطور نصف النهار',
    dinner: 'العشاء',
    generateWeekPlan: 'توليد برنامج أوتوماتيكي',
    generateGroceryList: 'حضّر قائمة القضية',
    emptySlot: 'فارغة حالياً',
    chooseDish: 'اختار طبق',
    groceryTitle: 'قائمة القضية',
    grocerySubtitle: 'المكونات الناقصة مجمّعة حسب الأقسام للذهاب للسوق',
    itemsToBuy: 'لازمك تشريه',
    itemsBought: 'شريتو',
    addManualItem: 'زيد حاجة للقضية (خبز، ماء...)...',
    clearChecked: 'امسح اللي شريتو',
    shareGroceryWhatsApp: 'شارك القضية على واتساب',
    emptyGrocery: 'القائمة فارغة! زيد وجبات في البرنامج لتوليد القضية.',
    boTitle: 'فضاء الإدارة والتحكم (Backoffice)',
    boSubtitle: 'إدارة الوصفات، المكونات وأسعار السوق التونسية',
    boTabDashboard: 'لوحة القيادة',
    boTabRecipes: 'إدارة الأطباق',
    boTabIngredients: 'المكونات والأسعار',
    boTabData: 'النسخ الاحتياطي',
    boAddRecipe: 'إضافة وصفة جديدة',
    boEditRecipe: 'تعديل الوصفة',
    boDeleteRecipe: 'حذف',
    boTotalRecipes: 'مجموع الوصفات',
    boActiveRecipes: 'الوصفات المنشورة',
    boAvgCost: 'معدل كلفة الصحن (د.ت)',
    boMarketPrices: 'أسعار السوق التقديرية',
    boExportData: 'تصدير البيانات (JSON)',
    boImportData: 'استيراد بيانات',
    boResetDefault: 'استعادة الوصفات الأصلية',
    boConfirmDelete: 'هل أنت متأكد من حذف هذه الوصفة؟',
    boSave: 'حفظ التغييرات',
    boCancel: 'إلغاء',
    scannerTitle: 'تصوير الفريجيدار بالذكاء الاصطناعي',
    scannerDesc: 'صوّر الفريجيدار وسيقوم الذكاء الاصطناعي باكتشاف المكونات آلياً.',
    scannerCameraBtn: 'التقاط صورة',
    scannerUploadBtn: 'رفع صورة',
    scannerAnalyzing: 'جاري فحص المكونات...',
    scannerDetected: 'المكونات المكتشفة:',
    scannerAddSelected: 'أضف إلى الفريجيدار',
    scannerErrorKey: 'مفتاح Gemini API مطلوب لتشغيل ميزة الكاميرا.',
    pwaInstall: 'تثبيت التطبيق',
    pwaInstallIOS: 'تثبيت على آيفون',
    pwaInstallDesc: 'ثبّت التطبيق على هاتفك للاستخدام السريع والعمل حتى دون إنترنت!',
    offlineNotice: 'وضع عدم الاتصال مفعل — الوصفات المحفوظة متوفرة دائماً!',
    noResultsTitle: 'لم نجد وصفة مطابقة 100%',
    noResultsDesc: 'أضف المزيد من المكونات أو تصفّح الوصفات التي ينقصها مكوّن واحد فقط!',
    settingsTitle: 'الإعدادات',
    settingsTheme: 'المظهر',
    settingsMode: 'العرض',
    modeLight: 'فاتح',
    modeDark: 'داكن',
    modeSystem: 'تلقائي',
    settingsLanguage: 'اللغة',
    settingsClose: 'إغلاق',
    themeActive: 'مُفعّل',
    backAgainToExit: 'اضغط مرة أخرى للخروج',
    pantryTitle: 'مؤونتي الأساسية',
    pantryDesc: 'ما هو متوفر دائماً في البيت (ملح، زيت، توابل...). لا يُحسب ناقصاً أبداً.',
    inPantry: 'في المؤونة',
    noRecipeYet: 'لا توجد وصفة حالياً',
    missingKeyLabel: 'ينقص الأساسي',
    missingLabel: 'ينقصك',
    withSubstitute: 'بـ',
    insteadOf: 'بدلاً من',
    groceryCost: '~{n} د.ت مشتريات',
    updateAvailable: 'يتوفر إصدار جديد',
    updateReload: 'تحديث',
    courseAll: 'الكل',
    courseEntree: 'مقبلات',
    courseMain: 'طبق رئيسي',
    courseDessert: 'تحلية',
    courseEntreePlural: 'مقبلات',
    courseMainPlural: 'أطباق رئيسية',
    courseDessertPlural: 'تحليات',
    mandatory: 'إجباري',
    addCourse: '+ {course}',
    healthyLabel: 'صحي',
    healthyOnly: 'الصحي فقط',
    expressLabel: 'سريع',
    mealsWithoutMain: '{n} وجبة بدون طبق رئيسي',
    emptyMeals: '{n} وجبة غير مخططة بعد',
    optWithEntree: '+ مقبلات',
    optWithDessert: '+ تحليات',
    optHealthy: 'قائمة صحية',
    removeMealConfirm: 'حذف الطبق الرئيسي؟ ستُحذف الوجبة كاملة (المقبلات والتحلية).',
    healthyFallback: 'لا توجد وصفات صحية كافية لـ: {list}. تم استعمال وصفات أخرى.',
    chooseCourse: 'اختر: {course}',
    noRecipeForCourse: 'لا توجد وصفة من هذا النوع حالياً.',
    planGenerated: 'تم إنشاء قائمة الأسبوع',
    quickHealthyTitle: 'أكل صحي',
    quickHealthyDesc: 'خفيف ومتوازن',
    removeLabel: 'حذف',
    replaceLabel: 'تغيير',
    videoTitle: 'فيديو التحضير',
    videoWatch: 'شاهد',
    videoOpenYoutube: 'افتح على يوتيوب',
    videoBadge: 'فيديو',
    recipesAllTab: 'كل الوصفات',
    recipesSuggestionsTab: 'اقتراحاتي',
    selectedIngredientsTitle: 'شنوة عندي في الفريجيدار',
    showAllLabel: 'ورّيني الكل',
    showLessLabel: 'نقّص',
    removeIngredientLabel: 'نحّي',
    suggestionsEmptyTitle: 'الفريجيدار فارغ',
    suggestionsEmptyDesc: 'اختار شوية مكوّنات باش نورّيك شنوة تنجم تطيب.',
    catalogEmptyTitle: 'ما فماش وصفة بهالفلاتر',
    catalogEmptyDesc: 'نحّي فلتر ولا بدّل البحث.',
    resetFiltersLabel: 'فسّخ الفلاتر',
  },
};
