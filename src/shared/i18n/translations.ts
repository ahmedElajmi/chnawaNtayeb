import type { Language } from '@/core/shared';
import { DERJA_ARABIC } from './derjaArabic';

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
  pwaOfflineTitle: string;
  pwaOfflineText: string;
  // Kitchen sync invitation
  syncInviteTitle: string;
  syncInviteText: string;
  syncInviteAction: string;
  syncInviteDismiss: string;
  pwaIosTitle: string;
  pwaIosStep1: string;
  pwaIosStep2: string;
  pwaIosStep3: string;
  pwaOtherTitle: string;
  pwaAndroidStep: string;
  pwaDesktopStep: string;
  pwaGotIt: string;
  scannerIntroTitle: string;
  scannerIntroText: string;
  scannerImageAlt: string;
  scannerAnalyzeBtn: string;
  scannerNothingFound: string;
  scannerFailed: string;
  scannerUnknownMapTo: string;
  scannerIgnore: string;
  scannerDishIdeas: string;
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
  settingsTabDisplay: string;
  settingsTabApp: string;
  themeActive: string;
  backAgainToExit: string;
  scrollToTop: string;
  currency: string;
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
  listProgress: string;
  listShowMore: string;
  showLessLabel: string;
  removeIngredientLabel: string;
  suggestionsEmptyTitle: string;
  suggestionsEmptyDesc: string;
  fillFridgeHint: string;
  catalogSoonTitle: string;
  catalogSoonDesc: string;
  categoriesTitle: string;
  allCategoriesCrumb: string;
  catalogEmptyTitle: string;
  catalogEmptyDesc: string;
  resetFiltersLabel: string;
  // Public screens: home, header, account, super admin access, recipe and list labels
  minutesValue: string;
  servingsShort: string;
  homeBadge: string;
  homeRecipeCount: string;
  homeDiscoverRecipes: string;
  shortcutExpressTitle: string;
  shortcutExpressDesc: string;
  shortcutBudgetDesc: string;
  shortcutTraditionTitle: string;
  shortcutTraditionDesc: string;
  shortcutWeekDesc: string;
  homeReadyCount: string;
  homeSeeAll: string;
  homeReadyEmpty: string;
  homeFillFridge: string;
  backofficeBadge: string;
  backofficeOpen: string;
  backofficeLogout: string;
  backofficeQuit: string;
  backofficeExitMode: string;
  themePreviewNote: string;
  languageSelectLabel: string;
  networkStatusLabel: string;
  accountLabel: string;
  accountMine: string;
  accountSpace: string;
  accountSynced: string;
  accountSaveFavorites: string;
  accountStatus: string;
  accountConnected: string;
  accountIdentifier: string;
  accountBackofficeSession: string;
  accountGuestName: string;
  accountGuest: string;
  accountRole: string;
  accountRoleAdmin: string;
  accountRoleUser: string;
  accountActiveNote: string;
  accountSignIn: string;
  accountSignOut: string;
  accountCreate: string;
  accountCreateMine: string;
  accountEmail: string;
  accountEmailPlaceholder: string;
  accountPassword: string;
  accountPasswordMin: string;
  accountOr: string;
  accountGuestContinue: string;
  accountName: string;
  accountNamePlaceholder: string;
  accountPhone: string;
  accountPhoneOptional: string;
  accountAddressAdd: string;
  accountAddressTitle: string;
  accountAddressLine: string;
  accountAddressRegion: string;
  accountAddressCity: string;
  accountAddressPostal: string;
  accountPreferredLanguage: string;
  accountProfileTitle: string;
  accountEditProfile: string;
  accountSaved: string;
  accountChangePassword: string;
  accountCurrentPassword: string;
  accountNewPassword: string;
  accountPasswordChanged: string;
  accountPasswordConfirm: string;
  accountPasswordMismatch: string;
  accountPasswordShow: string;
  accountPasswordHide: string;
  accountPasswordRuleDigit: string;
  accountPasswordRuleUpper: string;
  accountPasswordRuleSpecial: string;
  passwordStrengthWeak: string;
  passwordStrengthFair: string;
  passwordStrengthGood: string;
  passwordStrengthStrong: string;
  accountGuestBanner: string;
  accountRoleEmployee: string;
  accountFieldRequired: string;
  accountFieldPhone: string;
  accountFieldAddress: string;
  accountFieldLanguage: string;
  accountProfileUnavailable: string;
  authErrorInvalidCredentials: string;
  authErrorEmailInUse: string;
  authErrorWeakPassword: string;
  authErrorInvalidEmail: string;
  authErrorDisabled: string;
  authErrorLocked: string;
  authErrorUnknown: string;
  errorNetwork: string;
  errorTooManyAttempts: string;
  backofficeLoginTitle: string;
  backofficeLoginSubtitle: string;
  backofficeLoginUsername: string;
  backofficeLoginSubmit: string;
  backofficeErrorUnreachable: string;
  backofficeErrorInvalid: string;
  backofficeErrorUnavailable: string;
  readyBadge: string;
  missingCountBadge: string;
  mealIdea: string;
  keyIngredientBadge: string;
  pantryReminder: string;
  ingredientFallback: string;
  addMissingToGrocery: string;
  missingAddedToast: string;
  recipeAddMissingSelected: string;
  missingSelectAll: string;
  missingSelectNone: string;
  shareRecipeHeading: string;
  shareMoreIdeas: string;
  shareSentFrom: string;
  groceryGenerated: string;
  searchRecipePlaceholder: string;
  searchRecipeLabel: string;
  favoritesCount: string;
  maxBudgetLabel: string;
  maxTimeLabel: string;
  budgetAny: string;
  timeAny: string;
  // Grocery list: aisles, note, budget, lifecycle and print
  groceryAisles: string;
  groceryNote: string;
  groceryQuantity: string;
  groceryDeleteItem: string;
  groceryPrint: string;
  groceryPlanned: string;
  groceryReal: string;
  grocerySpentPlaceholder: string;
  groceryListDone: string;
  groceryCloseWeek: string;
  groceryContinueEditing: string;
  groceryWeekClosed: string;
  groceryArchive: string;
  groceryArchiveConfirm: string;
  groceryArchived: string;
  groceryArchiveError: string;
  groceryDeleteAll: string;
  groceryDeleteAllConfirm: string;
  grocerySignInHint: string;
  // Grocery add form: catalog ingredient picker and free-text fallback
  groceryPickerSearchLabel: string;
  groceryPickerSearchPlaceholder: string;
  groceryPickerNoResults: string;
  groceryPickerAddItem: string;
  groceryUnitSelectLabel: string;
  // Grocery history panel
  groceryHistoryTitle: string;
  groceryHistoryEmpty: string;
  groceryHistoryCount: string;
  groceryHistoryDeleteConfirm: string;
  groceryHistoryLoadError: string;
  groceryExportExcel: string;
  groceryXlsxDate: string;
  groceryXlsxComment: string;
  groceryXlsxItems: string;
  groceryXlsxPlanned: string;
  groceryXlsxActual: string;
  groceryXlsxGap: string;
  groceryXlsxTotal: string;
  // Weekly planner: planned budget of the week
  planBudgetLabel: string;
  // Unit description tooltip (shared `units` collection)
  unitInfoAria: string;
  // Adding an ingredient to the shopping list from the fridge cards + header chip
  cartAddLabel: string;
  cartAddedLabel: string;
  groceryBadgeLabel: string;
  // Choosing the target shopping list before an add (modal shown when several lists exist)
  chooseListTitle: string;
  chooseListRemaining: string;
  chooseListNewList: string;
  chooseListNamePlaceholder: string;
  chooseListCreate: string;
  // Named shopping lists: switcher, actions on the active list, duplicate from history
  listsSwitchLabel: string;
  listsRemaining: string;
  listsRename: string;
  listsNew: string;
  listsDuplicate: string;
  listsDelete: string;
  listsDeleteConfirm: string;
  listsFromHistory: string;
  listsFromHistoryName: string;
  listsFromHistoryToast: string;
  // Named shopping lists: inline create / rename editor
  listEditorNameLabel: string;
  listEditorNewPlaceholder: string;
  listEditorCreate: string;
  listEditorSave: string;
  listEditorCancel: string;
  // Grocery suggestions: item already present in the active list
  suggInList: string;
  // Grocery custom article: unit choice for anything outside the catalog
  customUnitTitle: string;
  customUnitAddAsArticle: string;
  customUnitRow: string;
  customUnitUnitLabel: string;
  customUnitOther: string;
  customUnitOtherPlaceholder: string;
}

/**
 * Interface texts of every language and variant, each one written in full: derja in Arabic letters
 * (`derjaArabic.ts`) is Tunisian derja, never literary Arabic, and the literary Arabic holds no derja
 * word (checked by `translations.test.ts`).
 */
export const translations = {
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
    cookNowAction: 'Warrini chnowa ntayeb !',
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
    pwaOfflineTitle: 'Yekhdem bla internet w yet7al fisa3',
    pwaOfflineText: 'El application ta7fadh el recettes w lista mta3 el 9adhya bech tekhdem 7atta bla 4G walla Wi-Fi.',
    syncInviteTitle: 'El makla mte3ek ma3ak fel 4all',
    syncInviteText:
      'A3mel compte bech tal9a el favoris, el frigo, el menu w el lista mta3 el qadhya 3ala kol appareil.',
    syncInviteAction: 'A3mel compte',
    syncInviteDismiss: 'Ba3d',
    pwaIosTitle: 'Installation 3al iPhone w iPad (Safari) :',
    pwaIosStep1: '1. Enzel 3la **Partager** louta fi Safari (el icône elli fiha flèche tetla3).',
    pwaIosStep2: '2. Habbet fel menu w ekhtar **Sur l’écran d’accueil**.',
    pwaIosStep3: '3. Enzel 3la **Ajouter** el fou9 3al imin. El icône tetla3 3al écran mte3ek !',
    pwaOtherTitle: 'Installation 3al Android w el ordinateur :',
    pwaAndroidStep:
      '**Android (Chrome) :** enzel 3al tlath n9at **(⋮)** el fou9, ba3d ekhtar **« Installer l’application »** walla **« Ajouter à l’écran d’accueil »**.',
    pwaDesktopStep:
      '**PC / Mac (Chrome / Edge) :** enzel 3al icône d’installation **(⊕)** 3al imin mta3 barre d’adresse.',
    pwaGotIt: 'Fhemt !',
    scannerIntroTitle: 'Sawar el frigo walla el tawla mte3 el koujina',
    scannerIntroText: 'El AI bech ychouf el khodhra, el lham, el 3dham, el conserves w el bharat elli bayna.',
    scannerImageAlt: 'Taswira mta3 el frigo',
    scannerAnalyzeBtn: 'Ballech el analyse bel AI',
    scannerNothingFound: 'Ma l9ina 7atta ingrédient fel taswira. Sawar el ingrédients mte3ek mel 9rib.',
    scannerFailed: 'Ma najjamnech n7allou el taswira tawa. 3awed ba3d chwaya.',
    scannerUnknownMapTo: 'ma 3raftouch, 9arnou b :',
    scannerIgnore: 'Khalli',
    scannerDishIdeas: 'Afkar mta3 makla :',
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
    settingsTabDisplay: 'Chakl',
    settingsTabApp: "L'application",
    themeActive: 'Mékhtar',
    backAgainToExit: 'Enzel marra okhra bech tokhrej',
    scrollToTop: 'Erja3 lfou9',
    currency: 'DT',
    pantryTitle: 'Placard mte3ek',
    pantryDesc: 'Elli dima 3andek fel dar (mel7, zit, twabel...). Ma tet7sebch na9sa.',
    inPantry: 'Fel placard',
    noRecipeYet: 'Mafamech recette tawa',
    missingKeyLabel: 'Na9es el asesi',
    missingLabel: 'Na9sek',
    withSubstitute: 'b',
    insteadOf: 'fi blasset',
    groceryCost: '≈ {n} 9adhya',
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
    listProgress: '{shown} men {total}',
    listShowMore: 'Warrini akther',
    showLessLabel: 'Na9es',
    removeIngredientLabel: 'Na7i',
    suggestionsEmptyTitle: 'El frigo fera8',
    suggestionsEmptyDesc: 'Ekhtar chwaya ingrédients bech nwarrik chnowa tnajem ttayeb.',
    fillFridgeHint: '3abbi el frigo',
    catalogSoonTitle: 'El maklet jeyin',
    categoriesTitle: 'Catégories',
    allCategoriesCrumb: 'El kol',
    catalogSoonDesc: 'Chef Souhed y7adher fihom w ychouf fihom wa7da wa7da. Arja3 ba3d chwaya !',
    catalogEmptyTitle: 'Ma fama 7atta makla b had el filtres',
    catalogEmptyDesc: 'Na7i filtre walla badel el recherche.',
    resetFiltersLabel: 'Fasakh el filtres',
    minutesValue: '{n} min',
    servingsShort: '{n} 3bed',
    homeBadge: 'Makla tounsiya 100% bleche',
    homeRecipeCount: '{n} makla',
    homeDiscoverRecipes: 'Ekteshef el maklet',
    shortcutExpressTitle: 'Maklet fisa3',
    shortcutExpressDesc: '< 15 min tatyib',
    shortcutBudgetDesc: 'Rkhis w lel étudiants',
    shortcutTraditionTitle: 'Makla 3arbi',
    shortcutTraditionDesc: 'Kosksi, rouz, tajine...',
    shortcutWeekDesc: 'Planning bla tabdhir',
    homeReadyCount: '{n} makla tnejjem ttayebha tawa bel frigo mte3ek',
    homeSeeAll: 'Warrini el kol ({n})',
    homeReadyEmpty:
      'Ekhtar chwaya ingrédients (3dham, tmatem, hrissa...) bech tchouf el maklet elli tnejjem ttayebhom tawa !',
    homeFillFridge: '3abbi el frigo mte3i',
    backofficeBadge: 'Super admin',
    backofficeOpen: 'Odkhel lel backoffice',
    backofficeLogout: 'Okhrej mel compte super admin',
    backofficeQuit: 'Okhrej',
    backofficeExitMode: 'Okhrej mel mode super admin',
    themePreviewNote: 'Thème fi west el aperçu (backoffice).',
    languageSelectLabel: 'Ekhtar el lougha',
    networkStatusLabel: '7alet el réseau',
    accountLabel: 'Compte',
    accountMine: 'Compte mte3i',
    accountSpace: 'Espace mte3ek',
    accountSynced: 'Msajjel m3a compte mte3ek',
    accountSaveFavorites: 'Sajjel el favoris mte3ek',
    accountStatus: 'El 7ala :',
    accountConnected: 'Connecté',
    accountIdentifier: 'El identifiant :',
    accountBackofficeSession: 'Session super admin',
    accountGuestName: 'Dhif y7eb el makla',
    accountGuest: 'Dhif',
    accountRole: 'Dawr :',
    accountRoleAdmin: 'Super admin',
    accountRoleUser: 'Utilisateur',
    accountActiveNote:
      'Compte mte3ek khaddem. El favoris, el frigo w menu el jom3a yo93dou msajlin 3al appareil hedha.',
    accountSignIn: 'Odkhel',
    accountSignOut: 'Okhrej',
    accountCreate: 'A3mel compte',
    accountCreateMine: 'A3mel compte mte3i',
    accountEmail: 'Email',
    accountEmailPlaceholder: 'email-mte3ek@exemple.com',
    accountPassword: 'Mot de passe',
    accountPasswordMin: '{n} 7orouf 3al a9al.',
    accountOr: 'Walla',
    accountGuestContinue: 'Kammel b clic wa7ed (dhif)',
    accountName: 'Esmek',
    accountNamePlaceholder: 'Esmek el kamel',
    accountPhone: 'Telifoun',
    accountPhoneOptional: '(fakultatif)',
    accountAddressAdd: 'Zid 3ounwen',
    accountAddressTitle: '3ounwen',
    accountAddressLine: 'Zenka, 3imara…',
    accountAddressRegion: 'Wilaya',
    accountAddressCity: 'Bled',
    accountAddressPostal: 'Code postal',
    accountPreferredLanguage: 'Loughet l affichage',
    accountProfileTitle: 'Profil mte3i',
    accountEditProfile: 'Beddel profil',
    accountSaved: 'Tsajjel !',
    accountChangePassword: 'Beddel mot de passe',
    accountCurrentPassword: 'Mot de passe el 9dim',
    accountNewPassword: 'Mot de passe el jdid',
    accountPasswordChanged: 'Mot de passe etbeddel !',
    accountPasswordConfirm: '3awed el mot de passe',
    accountPasswordMismatch: 'El mot de passe mouch kif kif.',
    accountPasswordShow: 'Warri el mot de passe',
    accountPasswordHide: '5ebbi el mot de passe',
    accountPasswordRuleDigit: 'Ra9m wa7ed 3ala l9al',
    accountPasswordRuleUpper: '7arf kabir wa7ed 3ala l9al',
    accountPasswordRuleSpecial: 'Ramz speciale wa7ed 3ala l9al',
    passwordStrengthWeak: 'Dh3if',
    passwordStrengthFair: 'Wesit',
    passwordStrengthGood: 'Behi',
    passwordStrengthStrong: 'Barcha 9wi',
    accountGuestBanner: 'Data mte3ek to93od 3al appareil hedha : a3mel compte bech tal9aha 3la kol écran.',
    accountRoleEmployee: 'F l équipe',
    accountFieldRequired: 'Champ lazem',
    accountFieldPhone: 'Rakm ghalet',
    accountFieldAddress: '3ounwen ghalet',
    accountFieldLanguage: 'Lougha ma3roufach',
    accountProfileUnavailable: 'Profil matnajemch tet9ra tawa',
    authErrorInvalidCredentials: 'Email walla mot de passe ghalet.',
    authErrorEmailInUse: 'Famma deja compte b el email hedha. Odkhel bih khir.',
    authErrorWeakPassword: 'Mot de passe dh3if barcha ({n} 7orouf 3al a9al).',
    authErrorInvalidEmail: 'Email ghalet.',
    authErrorDisabled: 'El tari9a hedhi mta3 el dokhoul msakra tawa.',
    authErrorLocked: 'El compte tesakkar ba3d barcha mo7awlet. 3awed ba3d chwaya wala ithilna.',
    authErrorUnknown: 'Famma ghalta. 3awed.',
    errorNetwork: 'Ma famech connexion internet.',
    errorTooManyAttempts: 'Barcha mo7awlet. 3awed ba3d chwaya d9aye9.',
    backofficeLoginTitle: 'Dokhoul el super admin',
    backofficeLoginSubtitle: 'Idara m2ammna (/super admin)',
    backofficeLoginUsername: 'Identifiant super-user',
    backofficeLoginSubmit: '7ell el backoffice',
    backofficeErrorUnreachable: 'Ma najjamnech nwasslou lel serveur. Thabbet fel connexion.',
    backofficeErrorInvalid: 'Identifiant walla mot de passe ghalet.',
    backofficeErrorUnavailable: 'Dokhoul el super admin mouch mawjoud tawa.',
    readyBadge: '100% 7adher !',
    missingCountBadge: '{n} na9es',
    mealIdea: 'Fekra makla',
    keyIngredientBadge: 'asesi',
    pantryReminder: 'Ma tensech :',
    ingredientFallback: 'Ingrédient',
    addMissingToGrocery: 'Zid elli naqsek lel qadhya',
    missingAddedToast: 'El ingrédients elli naqsin tzedou lel liste mta3 el qadhya !',
    recipeAddMissingSelected: 'Zid elli khtarithom ({n})',
    missingSelectAll: 'Khtar el kol',
    missingSelectNone: 'Na7i el khtara 3al kol',
    shareRecipeHeading: 'Makla mel Chnowa Ntayeb',
    shareMoreIdeas: 'Ekteshef afkar okhrin 3la Chnowa Ntayeb !',
    shareSentFrom: 'Teb3ath men',
    groceryGenerated: 'Liste el qadhya tsna3et !',
    searchRecipePlaceholder: 'Lawwej 3la makla (ojja, kosksi, kafteji...)',
    searchRecipeLabel: 'Lawwej 3la makla',
    favoritesCount: 'Favoris ({n})',
    maxBudgetLabel: 'Akther budget',
    maxTimeLabel: 'Akther waqt',
    budgetAny: 'Budget : el kol',
    timeAny: 'Waqt : el kol',
    groceryAisles: 'Rayons el 7anout',
    groceryNote: 'Note lel liste (qadhya Carrefour sebt...)',
    groceryQuantity: '9addésh',
    groceryDeleteItem: 'Na7i mel liste',
    groceryPrint: 'Imprimi',
    groceryPlanned: 'Prévu',
    groceryReal: 'Elli khlast',
    grocerySpentPlaceholder: '9addésh khlast ? (DT)',
    groceryListDone: 'El liste kammlet ✓',
    groceryCloseWeek: 'Sakker el jom3a',
    groceryContinueEditing: 'Nkemmel el liste',
    groceryWeekClosed: 'El jom3a tesakret ! A3mel liste jdid mel menu.',
    groceryArchive: 'Arkhevi',
    groceryArchiveConfirm: 'Tarkhevi el liste fi el historique mta3 el qadhya ?',
    groceryArchived: 'El liste tarkhevet fel historique !',
    groceryArchiveError: 'Ma najjamnech narkhevi el liste. 3awed.',
    groceryDeleteAll: 'Fasakh el liste el kol',
    groceryDeleteAllConfirm: 'Tfasakh el {n} articles ? Définitif — mouch arkhevi.',
    grocerySignInHint: 'Odkhel (walla a3mel compte) bech tarkhevi el qadhya w tal9a el historique.',
    groceryPickerSearchLabel: 'Lawwej 3la ingrédient bech tzidou lel liste',
    groceryPickerSearchPlaceholder: 'Lawwej 3la ingrédient (tmatem, 3adhher...)...',
    groceryPickerNoResults: 'Mafamech ingrédient hakka',
    groceryPickerAddItem: 'Zid {name} lel liste',
    groceryUnitSelectLabel: 'Beddel l’unité ta3 {name}',
    groceryHistoryTitle: 'Historique el qadhya',
    groceryHistoryEmpty: 'Mafamech chnowa tarkhef tawa. Sakker jom3a bech tal9aha hné.',
    groceryHistoryCount: '{n} articles',
    groceryHistoryDeleteConfirm: 'Tfasakh el qadhya hedhi mel historique ?',
    groceryHistoryLoadError: 'Ma najjamnech njib el historique. 3awed ba3d chwaya.',
    groceryExportExcel: 'Exporti Excel',
    groceryXlsxDate: 'Date',
    groceryXlsxComment: 'Note',
    groceryXlsxItems: 'Articles',
    groceryXlsxPlanned: 'Prévu',
    groceryXlsxActual: 'Elli khlast',
    groceryXlsxGap: 'Far9',
    groceryXlsxTotal: 'Total',
    planBudgetLabel: 'Budget el jom3a el prévu : {n}',
    unitInfoAria: 'Ma3loumet 3al unité {unit}',
    cartAddLabel: 'Zid {name} lel liste mta3 courses',
    cartAddedLabel: 'Tzad lel liste mta3 courses',
    groceryBadgeLabel: 'Liste mta3 courses ({count})',
    chooseListTitle: 'Ekhtar el liste mta3 el qadhya',
    chooseListRemaining: 'Ba9i {n}',
    chooseListNewList: 'Liste jdida',
    chooseListNamePlaceholder: 'Sma mta3 el liste jdida',
    chooseListCreate: 'A3mel',
    listsSwitchLabel: 'Beddel el liste mta3 qadhya',
    listsRemaining: '{n} ba9yin',
    listsRename: 'Beddel isem el liste',
    listsNew: 'Liste jdida',
    listsDuplicate: 'Na9el el liste (copie)',
    listsDelete: 'Fasakh el liste',
    listsDeleteConfirm: 'Tfasakh el liste « {name} » ? Définitif.',
    listsFromHistory: '3awed a3mel el liste hedhi',
    listsFromHistoryName: 'Liste el qadhya',
    listsFromHistoryToast: 'Liste jdida tsné3et mel historique !',
    listEditorNameLabel: 'Isem el liste',
    listEditorNewPlaceholder: 'Isem el liste el jdida',
    listEditorCreate: 'Snou3',
    listEditorSave: 'Enregistri',
    listEditorCancel: 'Batel',
    suggInList: 'déjà fel liste',
    customUnitTitle: '« {query} » mouch fel catalogue',
    customUnitAddAsArticle: 'Zidou article',
    customUnitRow: 'Zid « {query} » article',
    customUnitUnitLabel: 'Unité mta3 l’article',
    customUnitOther: 'okhra…',
    customUnitOtherPlaceholder: 'Unité 7orra (boccal, filet...)',
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
    pwaOfflineTitle: 'Mode hors ligne et accès instantané',
    pwaOfflineText: 'L’application garde vos recettes et listes de courses pour fonctionner même sans 4G ni Wi-Fi.',
    syncInviteTitle: 'Vos données vous suivent partout',
    syncInviteText:
      'Créez un compte pour retrouver vos favoris, votre frigo, votre menu et votre liste de courses sur tous vos appareils.',
    syncInviteAction: 'Créer un compte',
    syncInviteDismiss: 'Plus tard',
    pwaIosTitle: 'Installation sur iPhone et iPad (Safari) :',
    pwaIosStep1: '1. Appuyez sur **Partager** en bas de Safari (l’icône avec la flèche vers le haut).',
    pwaIosStep2: '2. Faites défiler le menu et choisissez **Sur l’écran d’accueil**.',
    pwaIosStep3: '3. Appuyez sur **Ajouter** en haut à droite. L’icône apparaît sur votre écran !',
    pwaOtherTitle: 'Installation sur Android et ordinateur :',
    pwaAndroidStep:
      '**Android (Chrome) :** appuyez sur les trois points **(⋮)** en haut à droite, puis choisissez **« Installer l’application »** ou **« Ajouter à l’écran d’accueil »**.',
    pwaDesktopStep:
      '**PC / Mac (Chrome / Edge) :** cliquez sur l’icône d’installation **(⊕)** à droite de la barre d’adresse.',
    pwaGotIt: 'C’est compris !',
    scannerIntroTitle: 'Photographiez votre frigo ou votre plan de travail',
    scannerIntroText: 'L’IA analysera les légumes, viandes, œufs, conserves et condiments visibles.',
    scannerImageAlt: 'Frigo scanné',
    scannerAnalyzeBtn: 'Lancer l’analyse par IA',
    scannerNothingFound:
      'Aucun ingrédient n’a été détecté sur cette photo. Photographiez vos ingrédients de plus près.',
    scannerFailed: 'Impossible d’analyser l’image pour le moment.',
    scannerUnknownMapTo: 'non reconnu, associer à :',
    scannerIgnore: 'Ignorer',
    scannerDishIdeas: 'Idées de plats :',
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
    settingsTabDisplay: 'Affichage',
    settingsTabApp: 'Application',
    themeActive: 'Actif',
    backAgainToExit: 'Appuie encore une fois pour quitter',
    scrollToTop: 'Revenir en haut',
    currency: 'DT',
    pantryTitle: 'Mon placard de base',
    pantryDesc: 'Ce que tu as toujours à la maison (sel, huile, épices…). Jamais compté comme manquant.',
    inPantry: 'Au placard',
    noRecipeYet: "Aucune recette pour l'instant",
    missingKeyLabel: "Manque l'essentiel",
    missingLabel: 'Il te manque',
    withSubstitute: 'avec',
    insteadOf: 'au lieu de',
    groceryCost: '≈ {n} de courses',
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
    listProgress: '{shown} sur {total}',
    listShowMore: 'Voir plus',
    showLessLabel: 'Réduire',
    removeIngredientLabel: 'Retirer',
    suggestionsEmptyTitle: 'Votre frigo est vide',
    suggestionsEmptyDesc: 'Sélectionnez quelques ingrédients pour voir les recettes que vous pouvez cuisiner.',
    fillFridgeHint: 'remplir le frigo',
    catalogSoonTitle: 'Les recettes arrivent',
    categoriesTitle: 'Catégories',
    allCategoriesCrumb: 'Toutes',
    catalogSoonDesc: 'Chef Souhed les prépare et les vérifie une à une. Revenez bientôt !',
    catalogEmptyTitle: 'Aucune recette ne correspond à ces filtres',
    catalogEmptyDesc: 'Retirez un filtre ou modifiez la recherche.',
    resetFiltersLabel: 'Effacer les filtres',
    minutesValue: '{n} min',
    servingsShort: '{n} pers.',
    homeBadge: 'Cuisine tunisienne 100 % gratuite',
    homeRecipeCount: '{n} recettes',
    homeDiscoverRecipes: 'Découvrir les recettes',
    shortcutExpressTitle: 'Plats express',
    shortcutExpressDesc: '< 15 min de cuisson',
    shortcutBudgetDesc: 'Économique & étudiant',
    shortcutTraditionTitle: 'Tradition tounsi',
    shortcutTraditionDesc: 'Couscous, rouz, tajine...',
    shortcutWeekDesc: 'Planning anti-gaspillage',
    homeReadyCount: '{n} recettes réalisables immédiatement avec votre frigo',
    homeSeeAll: 'Voir tout ({n})',
    homeReadyEmpty:
      'Cochez quelques ingrédients de base (œufs, tomates, harissa...) pour découvrir vos recettes prêtes à cuisiner !',
    homeFillFridge: 'Remplir mon frigo',
    backofficeBadge: 'Super admin',
    backofficeOpen: 'Accéder au backoffice super admin',
    backofficeLogout: 'Déconnexion super admin',
    backofficeQuit: 'Quitter',
    backofficeExitMode: 'Quitter le mode super admin',
    themePreviewNote: 'Aperçu d’un thème en cours (backoffice).',
    languageSelectLabel: 'Choisir la langue',
    networkStatusLabel: 'Statut réseau',
    accountLabel: 'Compte',
    accountMine: 'Mon compte',
    accountSpace: 'Espace utilisateur',
    accountSynced: 'Synchronisé avec votre compte',
    accountSaveFavorites: 'Sauvegardez vos favoris',
    accountStatus: 'Statut :',
    accountConnected: 'Connecté',
    accountIdentifier: 'Identifiant :',
    accountBackofficeSession: 'Session super admin',
    accountGuestName: 'Invité gourmand',
    accountGuest: 'Invité',
    accountRole: 'Rôle :',
    accountRoleAdmin: 'Super admin',
    accountRoleUser: 'Utilisateur',
    accountActiveNote:
      'Ton compte est actif. Tes favoris, ton frigo et ton menu de la semaine restent enregistrés sur cet appareil.',
    accountSignIn: 'Se connecter',
    accountSignOut: 'Se déconnecter',
    accountCreate: 'Créer un compte',
    accountCreateMine: 'Créer mon compte',
    accountEmail: 'E-mail',
    accountEmailPlaceholder: 'votre-email@exemple.com',
    accountPassword: 'Mot de passe',
    accountPasswordMin: '{n} caractères minimum.',
    accountOr: 'Ou',
    accountGuestContinue: 'Continuer en 1 clic (invité)',
    accountName: 'Nom affiché',
    accountNamePlaceholder: 'Votre nom complet',
    accountPhone: 'Téléphone',
    accountPhoneOptional: '(facultatif)',
    accountAddressAdd: 'Ajouter une adresse',
    accountAddressTitle: 'Adresse',
    accountAddressLine: 'Rue, immeuble, appartement…',
    accountAddressRegion: 'Gouvernorat',
    accountAddressCity: 'Ville',
    accountAddressPostal: 'Code postal',
    accountPreferredLanguage: 'Langue préférée',
    accountProfileTitle: 'Mon profil',
    accountEditProfile: 'Modifier mon profil',
    accountSaved: 'Enregistré !',
    accountChangePassword: 'Changer le mot de passe',
    accountCurrentPassword: 'Mot de passe actuel',
    accountNewPassword: 'Nouveau mot de passe',
    accountPasswordChanged: 'Mot de passe modifié !',
    accountPasswordConfirm: 'Confirmer le mot de passe',
    accountPasswordMismatch: 'Les deux mots de passe ne correspondent pas.',
    accountPasswordShow: 'Afficher le mot de passe',
    accountPasswordHide: 'Masquer le mot de passe',
    accountPasswordRuleDigit: 'Au moins un chiffre',
    accountPasswordRuleUpper: 'Au moins une majuscule',
    accountPasswordRuleSpecial: 'Au moins un caractère spécial',
    passwordStrengthWeak: 'Faible',
    passwordStrengthFair: 'Moyen',
    passwordStrengthGood: 'Bon',
    passwordStrengthStrong: 'Très fort',
    accountGuestBanner:
      'Tes données restent sur cet appareil : crée ton compte pour les retrouver sur tous tes écrans.',
    accountRoleEmployee: 'Équipe',
    accountFieldRequired: 'Champ requis',
    accountFieldPhone: 'Numéro invalide',
    accountFieldAddress: 'Adresse invalide',
    accountFieldLanguage: 'Langue inconnue',
    accountProfileUnavailable: 'Profil illisible pour le moment',
    authErrorInvalidCredentials: 'E-mail ou mot de passe incorrect.',
    authErrorEmailInUse: 'Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.',
    authErrorWeakPassword: 'Mot de passe trop faible ({n} caractères minimum).',
    authErrorInvalidEmail: 'Adresse e-mail invalide.',
    authErrorDisabled: 'Ce mode de connexion est désactivé pour le moment.',
    authErrorLocked: 'Compte bloqué après trop d’essais. Réessaie plus tard ou contacte-nous.',
    authErrorUnknown: 'Une erreur est survenue. Réessaie.',
    errorNetwork: 'Connexion internet indisponible.',
    errorTooManyAttempts: 'Trop de tentatives. Réessaie dans quelques minutes.',
    backofficeLoginTitle: 'Accès super admin',
    backofficeLoginSubtitle: 'Administration sécurisée (/super admin)',
    backofficeLoginUsername: 'Identifiant super-user',
    backofficeLoginSubmit: 'Déverrouiller le backoffice',
    backofficeErrorUnreachable: 'Serveur injoignable. Vérifiez votre connexion.',
    backofficeErrorInvalid: 'Identifiant ou mot de passe incorrect.',
    backofficeErrorUnavailable: 'Accès super admin indisponible pour le moment.',
    readyBadge: '100 % prêt !',
    missingCountBadge: '{n} manquant(s)',
    mealIdea: 'Idée repas',
    keyIngredientBadge: 'clé',
    pantryReminder: 'Pense aussi à :',
    ingredientFallback: 'Ingrédient',
    addMissingToGrocery: 'Ajouter les manquants aux courses',
    missingAddedToast: 'Les ingrédients manquants ont été ajoutés à votre liste de courses !',
    recipeAddMissingSelected: 'Ajouter la sélection ({n})',
    missingSelectAll: 'Tout sélectionner',
    missingSelectNone: 'Tout désélectionner',
    shareRecipeHeading: 'Recette Chnowa Ntayeb',
    shareMoreIdeas: 'Découvre plus d’idées repas sur Chnowa Ntayeb !',
    shareSentFrom: 'Envoyé depuis',
    groceryGenerated: 'Liste de courses générée !',
    searchRecipePlaceholder: 'Rechercher par nom de plat (ojja, couscous, kafteji...)',
    searchRecipeLabel: 'Rechercher une recette',
    favoritesCount: 'Favoris ({n})',
    maxBudgetLabel: 'Budget maximum',
    maxTimeLabel: 'Temps maximum',
    budgetAny: 'Budget : tous',
    timeAny: 'Temps : tous',
    groceryAisles: 'Rayons',
    groceryNote: 'Une note pour la liste (courses Carrefour samedi...)',
    groceryQuantity: 'Quantité',
    groceryDeleteItem: "Supprimer l'article",
    groceryPrint: 'Imprimer',
    groceryPlanned: 'Prévu',
    groceryReal: 'Réel',
    grocerySpentPlaceholder: 'Montant dépensé (DT)...',
    groceryListDone: 'Liste terminée ✓',
    groceryCloseWeek: 'Clôturer la semaine',
    groceryContinueEditing: 'Continuer à modifier',
    groceryWeekClosed: 'Semaine clôturée ! Génère ta prochaine liste depuis le menu.',
    groceryArchive: 'Archiver',
    groceryArchiveConfirm: 'Archiver cette liste dans l’historique des courses ?',
    groceryArchived: 'Liste archivée dans l’historique !',
    groceryArchiveError: 'Impossible d’archiver la liste. Réessaie.',
    groceryDeleteAll: 'Supprimer toute la liste',
    groceryDeleteAllConfirm: 'Supprimer les {n} articles ? Définitif — non archivé.',
    grocerySignInHint: 'Connecte-toi (ou crée un compte) pour archiver tes courses et retrouver l’historique.',
    groceryPickerSearchLabel: 'Chercher un ingrédient à ajouter à la liste',
    groceryPickerSearchPlaceholder: 'Chercher un ingrédient (tomates, menthe)...',
    groceryPickerNoResults: 'Aucun ingrédient trouvé',
    groceryPickerAddItem: 'Ajouter {name} à la liste',
    groceryUnitSelectLabel: 'Changer l’unité de {name}',
    groceryHistoryTitle: 'Historique des courses',
    groceryHistoryEmpty: 'Pas encore de liste archivée. Clôture une semaine pour la retrouver ici.',
    groceryHistoryCount: '{n} articles',
    groceryHistoryDeleteConfirm: 'Supprimer cette course de l’historique ?',
    groceryHistoryLoadError: 'Impossible de charger l’historique. Réessaie plus tard.',
    groceryExportExcel: 'Exporter Excel',
    groceryXlsxDate: 'Date',
    groceryXlsxComment: 'Note',
    groceryXlsxItems: 'Articles',
    groceryXlsxPlanned: 'Prévu',
    groceryXlsxActual: 'Réel',
    groceryXlsxGap: 'Écart',
    groceryXlsxTotal: 'Total',
    planBudgetLabel: 'Budget prévu de la semaine : {n}',
    unitInfoAria: 'Description de l’unité {unit}',
    cartAddLabel: 'Ajouter {name} à la liste de courses',
    cartAddedLabel: 'Ajouté à la liste de courses',
    groceryBadgeLabel: 'Liste de courses ({count})',
    chooseListTitle: 'Ajouter à quelle liste de courses ?',
    chooseListRemaining: '{n} restants',
    chooseListNewList: 'Nouvelle liste',
    chooseListNamePlaceholder: 'Nom de la nouvelle liste',
    chooseListCreate: 'Créer',
    listsSwitchLabel: 'Changer de liste de courses',
    listsRemaining: '{n} restants',
    listsRename: 'Renommer la liste',
    listsNew: 'Nouvelle liste',
    listsDuplicate: 'Dupliquer la liste',
    listsDelete: 'Supprimer la liste',
    listsDeleteConfirm: 'Supprimer définitivement la liste « {name} » ?',
    listsFromHistory: 'Recréer cette liste',
    listsFromHistoryName: 'Mes courses',
    listsFromHistoryToast: 'Nouvelle liste créée à partir de cette course !',
    listEditorNameLabel: 'Nom de la liste',
    listEditorNewPlaceholder: 'Nom de la nouvelle liste',
    listEditorCreate: 'Créer',
    listEditorSave: 'Enregistrer',
    listEditorCancel: 'Annuler',
    suggInList: 'déjà dans la liste',
    customUnitTitle: '« {query} » n’est pas dans le catalogue',
    customUnitAddAsArticle: 'Ajouter comme article',
    customUnitRow: 'Ajouter « {query} » comme article',
    customUnitUnitLabel: 'Unité de l’article',
    customUnitOther: 'autre…',
    customUnitOtherPlaceholder: 'Unité libre (bocal, filet...)',
  },
  ar: {
    appName: 'Chnowa Ntayeb',
    slogan: 'بما في ثلاجتك، نحضّر لك طبقًا شهيًّا!',
    tagline: 'ماذا نطبخ اليوم؟',
    navHome: 'الرئيسية',
    navFridge: 'ثلاجتي',
    navRecipes: 'الوصفات',
    navWeekly: 'قائمة الأسبوع',
    navGrocery: 'المشتريات',
    navBackoffice: 'الإدارة',
    heroTitle: 'ماذا نطبخ اليوم؟',
    heroSubtitle: 'اختر المكوّنات المتوفرة لديك واكتشف فورًا أشهى الأطباق التونسية في أقل من 30 ثانية!',
    btnFindMeal: 'اقترح عليّ وصفة',
    btnOpenFridge: 'افتح ثلاجتي',
    btnScanPhoto: 'صوّر الثلاجة بالذكاء الاصطناعي',
    quickIdeas: 'أفكار سريعة لليوم',
    fridgeTitle: 'ماذا يوجد في ثلاجتك؟',
    fridgeSubtitle: 'حدّد المكوّنات المتوفرة في مطبخك:',
    searchPlaceholder: 'ابحث عن مكوّن (طماطم، بيض، بصل...)',
    selectedCount: 'مكوّنات مختارة',
    clearSelection: 'مسح الكل',
    addBtn: 'إضافة',
    cookNowAction: 'اعثر على وصفاتي!',
    tierReadyTitle: 'يمكنني الطهي الآن!',
    tierReadyDesc: 'لديك كل المكوّنات المطلوبة في البيت',
    tierAlmostTitle: 'لا ينقصك إلا القليل',
    tierAlmostDesc: 'ينقصك مكوّن أو اثنان فقط تشتريهما من أقرب متجر',
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
    under15Min: 'سريع (< 15 دقيقة)',
    under30Min: '< 30 دقيقة',
    under45Min: '< 45 دقيقة',
    over45Min: 'طهي على نار هادئة (> 45 دقيقة)',
    servings: 'عدد الأشخاص',
    person: 'شخص',
    persons: 'أشخاص',
    prepTime: 'التحضير',
    cookTime: 'الطهي',
    totalTime: 'الوقت الجملي',
    costEstimate: 'التكلفة التقديرية',
    ingredientsTitle: 'المكونات المطلوبة',
    availableIngredients: 'متوفر عندك',
    missingIngredients: 'للشراء',
    stepsTitle: 'طريقة التحضير خطوة بخطوة',
    chefTipTitle: 'نصيحة Chef Souhed',
    shareWhatsApp: 'شارك على واتساب',
    addToFavorites: 'أضف إلى المفضلة',
    removeFromFavorites: 'أزل من المفضلة',
    favoriteAddedToast: 'تمت الإضافة إلى المفضلة!',
    weeklyTitle: 'قائمة الأسبوع',
    weeklySubtitle: 'خطّط لوجبات الغداء والعشاء لتجنّب التبذير',
    lunch: 'الغداء',
    dinner: 'العشاء',
    generateWeekPlan: 'إنشاء برنامج تلقائي',
    generateGroceryList: 'إنشاء قائمة المشتريات',
    emptySlot: 'لم يُختر أي طبق',
    chooseDish: 'اختر طبقًا',
    groceryTitle: 'قائمة المشتريات',
    grocerySubtitle: 'المكوّنات الناقصة مجمّعة للتسوّق',
    itemsToBuy: 'للشراء',
    itemsBought: 'تم شراؤه',
    addManualItem: 'أضف منتجًا (خبز، ماء...)...',
    clearChecked: 'امسح ما تم شراؤه',
    shareGroceryWhatsApp: 'شارك القائمة على واتساب',
    emptyGrocery: 'قائمة مشترياتك فارغة. أضف وصفات إلى قائمة الأسبوع لملئها!',
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
    scannerTitle: 'تصوير الثلاجة بالذكاء الاصطناعي',
    scannerDesc: 'صوّر ثلاجتك وسيكتشف الذكاء الاصطناعي المكوّنات الظاهرة.',
    scannerCameraBtn: 'التقاط صورة',
    scannerUploadBtn: 'رفع صورة',
    scannerAnalyzing: 'جاري فحص المكونات...',
    scannerDetected: 'المكونات المكتشفة:',
    scannerAddSelected: 'أضف إلى الثلاجة',
    scannerErrorKey: 'مفتاح Gemini API مطلوب لتشغيل ميزة الكاميرا.',
    pwaOfflineTitle: 'يعمل دون إنترنت ويفتح فوراً',
    pwaOfflineText: 'يحتفظ التطبيق بوصفاتك وقوائم مشترياتك ليعمل حتى دون 4G أو Wi-Fi.',
    syncInviteTitle: 'بياناتك ترافقك في كل مكان',
    syncInviteText: 'أنشئ حسابًا لتجد مفضّلاتك وثلاجتك وقائمتك الأسبوعية وقائمة مشترياتك على كل أجهزتك.',
    syncInviteAction: 'أنشئ حسابًا',
    syncInviteDismiss: 'لاحقًا',
    pwaIosTitle: 'التثبيت على iPhone وiPad (Safari):',
    pwaIosStep1: '1. اضغط على **مشاركة** أسفل Safari (الأيقونة ذات السهم المتجه للأعلى).',
    pwaIosStep2: '2. مرّر القائمة واختر **إضافة إلى الشاشة الرئيسية**.',
    pwaIosStep3: '3. اضغط على **إضافة** في الأعلى. ستظهر الأيقونة على شاشتك!',
    pwaOtherTitle: 'التثبيت على Android والحاسوب:',
    pwaAndroidStep:
      '**Android (Chrome):** اضغط على النقاط الثلاث **(⋮)** في الأعلى، ثم اختر **« تثبيت التطبيق »** أو **« إضافة إلى الشاشة الرئيسية »**.',
    pwaDesktopStep: '**PC / Mac (Chrome / Edge):** انقر على أيقونة التثبيت **(⊕)** بجانب شريط العنوان.',
    pwaGotIt: 'فهمت!',
    scannerIntroTitle: 'صوّر ثلاجتك أو طاولة المطبخ',
    scannerIntroText: 'سيحلّل الذكاء الاصطناعي الخضر واللحوم والبيض والمعلّبات والتوابل الظاهرة.',
    scannerImageAlt: 'صورة الثلاجة',
    scannerAnalyzeBtn: 'ابدأ التحليل بالذكاء الاصطناعي',
    scannerNothingFound: 'لم يتم اكتشاف أي مكوّن في هذه الصورة. صوّر مكوّناتك من مسافة أقرب.',
    scannerFailed: 'تعذّر تحليل الصورة حالياً. حاول لاحقاً.',
    scannerUnknownMapTo: 'غير معروف، اربطه بـ:',
    scannerIgnore: 'تجاهل',
    scannerDishIdeas: 'أفكار أطباق:',
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
    settingsTabDisplay: 'العرض',
    settingsTabApp: 'التطبيق',
    themeActive: 'مُفعّل',
    backAgainToExit: 'اضغط مرة أخرى للخروج',
    scrollToTop: 'العودة إلى الأعلى',
    currency: 'د.ت',
    pantryTitle: 'مؤونتي الأساسية',
    pantryDesc: 'ما هو متوفر دائماً في البيت (ملح، زيت، توابل...). لا يُحسب ناقصاً أبداً.',
    inPantry: 'في المؤونة',
    noRecipeYet: 'لا توجد وصفة حالياً',
    missingKeyLabel: 'ينقص الأساسي',
    missingLabel: 'ينقصك',
    withSubstitute: 'بـ',
    insteadOf: 'بدلاً من',
    groceryCost: '≈ {n} مشتريات',
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
    selectedIngredientsTitle: 'ثلاجتي',
    showAllLabel: 'عرض الكل',
    listProgress: '{shown} من {total}',
    listShowMore: 'عرض المزيد',
    showLessLabel: 'عرض أقل',
    removeIngredientLabel: 'إزالة',
    suggestionsEmptyTitle: 'ثلاجتك فارغة',
    suggestionsEmptyDesc: 'اختر بعض المكوّنات لنريك ما يمكنك طهيه.',
    fillFridgeHint: 'املأ الثلاجة',
    catalogSoonTitle: 'الوصفات قادمة',
    categoriesTitle: 'الأصناف',
    allCategoriesCrumb: 'الكل',
    catalogSoonDesc: 'يُعدّها Chef Souhed ويراجعها واحدة تلو الأخرى. عُد قريبًا!',
    catalogEmptyTitle: 'لا توجد وصفة تطابق هذه المرشّحات',
    catalogEmptyDesc: 'أزل مرشّحًا أو عدّل البحث.',
    resetFiltersLabel: 'مسح المرشّحات',
    minutesValue: '{n} دقيقة',
    servingsShort: '{n} أشخاص',
    homeBadge: 'مطبخ تونسي مجاني 100%',
    homeRecipeCount: '{n} وصفة',
    homeDiscoverRecipes: 'اكتشف الوصفات',
    shortcutExpressTitle: 'أطباق سريعة',
    shortcutExpressDesc: 'طهي في أقل من 15 دقيقة',
    shortcutBudgetDesc: 'اقتصادي ومناسب للطلبة',
    shortcutTraditionTitle: 'المطبخ التقليدي',
    shortcutTraditionDesc: 'كسكسي، أرز، طاجين...',
    shortcutWeekDesc: 'تخطيط يحدّ من التبذير',
    homeReadyCount: '{n} وصفة يمكنك إعدادها فورًا بما في ثلاجتك',
    homeSeeAll: 'عرض الكل ({n})',
    homeReadyEmpty: 'اختر بعض المكوّنات الأساسية (بيض، طماطم، هريسة...) لتكتشف الوصفات الجاهزة للطهي!',
    homeFillFridge: 'املأ ثلاجتي',
    backofficeBadge: 'المدير',
    backofficeOpen: 'الدخول إلى لوحة الإدارة',
    backofficeLogout: 'تسجيل خروج المدير',
    backofficeQuit: 'خروج',
    backofficeExitMode: 'الخروج من وضع المدير',
    themePreviewNote: 'معاينة سمة جارية من لوحة الإدارة.',
    languageSelectLabel: 'اختر اللغة',
    networkStatusLabel: 'حالة الشبكة',
    accountLabel: 'الحساب',
    accountMine: 'حسابي',
    accountSpace: 'فضاء المستخدم',
    accountSynced: 'متزامن مع حسابك',
    accountSaveFavorites: 'احفظ وصفاتك المفضّلة',
    accountStatus: 'الحالة:',
    accountConnected: 'متصل',
    accountIdentifier: 'المعرّف:',
    accountBackofficeSession: 'جلسة المدير',
    accountGuestName: 'ضيف ذوّاق',
    accountGuest: 'ضيف',
    accountRole: 'الدور:',
    accountRoleAdmin: 'مدير عام',
    accountRoleUser: 'مستخدم',
    accountActiveNote: 'حسابك نشط. تبقى مفضّلاتك وثلاجتك وقائمة الأسبوع محفوظة على هذا الجهاز.',
    accountSignIn: 'تسجيل الدخول',
    accountSignOut: 'تسجيل الخروج',
    accountCreate: 'إنشاء حساب',
    accountCreateMine: 'إنشاء حسابي',
    accountEmail: 'البريد الإلكتروني',
    accountEmailPlaceholder: 'name@example.com',
    accountPassword: 'كلمة المرور',
    accountPasswordMin: '{n} أحرف على الأقل.',
    accountOr: 'أو',
    accountGuestContinue: 'المتابعة بنقرة واحدة (ضيف)',
    accountName: 'الاسم المعروض',
    accountNamePlaceholder: 'اسمك الكامل',
    accountPhone: 'الهاتف',
    accountPhoneOptional: '(اختياري)',
    accountAddressAdd: 'إضافة عنوان',
    accountAddressTitle: 'العنوان',
    accountAddressLine: 'الشارع، العمارة، الشقة…',
    accountAddressRegion: 'الولاية',
    accountAddressCity: 'المدينة',
    accountAddressPostal: 'الرمز البريدي',
    accountPreferredLanguage: 'لغة العرض المفضلة',
    accountProfileTitle: 'ملفي الشخصي',
    accountEditProfile: 'تعديل ملفي',
    accountSaved: 'تم الحفظ!',
    accountChangePassword: 'تغيير كلمة المرور',
    accountCurrentPassword: 'كلمة المرور الحالية',
    accountNewPassword: 'كلمة المرور الجديدة',
    accountPasswordChanged: 'تم تغيير كلمة المرور!',
    accountPasswordConfirm: 'تأكيد كلمة المرور',
    accountPasswordMismatch: 'كلمتا المرور غير متطابقتين.',
    accountPasswordShow: 'إظهار كلمة المرور',
    accountPasswordHide: 'إخفاء كلمة المرور',
    accountPasswordRuleDigit: 'رقم واحد على الأقل',
    accountPasswordRuleUpper: 'حرف كبير واحد على الأقل',
    accountPasswordRuleSpecial: 'رمز خاص واحد على الأقل',
    passwordStrengthWeak: 'ضعيفة',
    passwordStrengthFair: 'متوسطة',
    passwordStrengthGood: 'جيدة',
    passwordStrengthStrong: 'قوية جدًا',
    accountGuestBanner: 'بياناتك تبقى على هذا الجهاز : أنشئ حسابك لتجدها على كل شاشاتك.',
    accountRoleEmployee: 'الفريق',
    accountFieldRequired: 'حقل مطلوب',
    accountFieldPhone: 'رقم غير صالح',
    accountFieldAddress: 'عنوان غير صالح',
    accountFieldLanguage: 'لغة غير معروفة',
    accountProfileUnavailable: 'تعذّرت قراءة الملف الآن',
    authErrorInvalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    authErrorEmailInUse: 'يوجد حساب بهذا البريد الإلكتروني. سجّل الدخول بدلًا من ذلك.',
    authErrorWeakPassword: 'كلمة المرور ضعيفة جدًا ({n} أحرف على الأقل).',
    authErrorInvalidEmail: 'عنوان البريد الإلكتروني غير صالح.',
    authErrorDisabled: 'طريقة تسجيل الدخول هذه معطّلة حاليًا.',
    authErrorLocked: 'تم قفل الحساب بعد محاولات كثيرة. أعد المحاولة لاحقًا أو تواصل معنا.',
    authErrorUnknown: 'حدث خطأ. أعد المحاولة.',
    errorNetwork: 'الاتصال بالإنترنت غير متوفر.',
    errorTooManyAttempts: 'محاولات كثيرة جدًا. أعد المحاولة بعد بضع دقائق.',
    backofficeLoginTitle: 'دخول المدير',
    backofficeLoginSubtitle: 'إدارة آمنة (/super admin)',
    backofficeLoginUsername: 'اسم المستخدم المسؤول',
    backofficeLoginSubmit: 'فتح لوحة الإدارة',
    backofficeErrorUnreachable: 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك.',
    backofficeErrorInvalid: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    backofficeErrorUnavailable: 'دخول المدير غير متاح حاليًا.',
    readyBadge: 'جاهز 100%!',
    missingCountBadge: 'ينقص {n}',
    mealIdea: 'فكرة وجبة',
    keyIngredientBadge: 'أساسي',
    pantryReminder: 'لا تنسَ أيضًا:',
    ingredientFallback: 'مكوّن',
    addMissingToGrocery: 'أضف الناقص إلى قائمة المشتريات',
    missingAddedToast: 'أُضيفت المكوّنات الناقصة إلى قائمة مشترياتك!',
    recipeAddMissingSelected: 'أضف المحدد ({n})',
    missingSelectAll: 'تحديد الكل',
    missingSelectNone: 'إلغاء تحديد الكل',
    shareRecipeHeading: 'وصفة من Chnowa Ntayeb',
    shareMoreIdeas: 'اكتشف المزيد من أفكار الوجبات على Chnowa Ntayeb!',
    shareSentFrom: 'أُرسلت من',
    groceryGenerated: 'تم إنشاء قائمة المشتريات!',
    searchRecipePlaceholder: 'ابحث باسم الطبق (عجة، كسكسي، كفتاجي...)',
    searchRecipeLabel: 'ابحث عن وصفة',
    favoritesCount: 'المفضّلة ({n})',
    maxBudgetLabel: 'الميزانية القصوى',
    maxTimeLabel: 'أقصى وقت',
    budgetAny: 'الميزانية: الكل',
    timeAny: 'الوقت: الكل',
    groceryAisles: 'أقسام المتجر',
    groceryNote: 'ملاحظة للقائمة (مشتريات السبت...)',
    groceryQuantity: 'الكمية',
    groceryDeleteItem: 'حذف المنتج',
    groceryPrint: 'طباعة',
    groceryPlanned: 'المتوقّع',
    groceryReal: 'الفعلي',
    grocerySpentPlaceholder: 'المبلغ المدفوع (د.ت)...',
    groceryListDone: 'اكتملت القائمة ✓',
    groceryCloseWeek: 'إغلاق الأسبوع',
    groceryContinueEditing: 'متابعة التعديل',
    groceryWeekClosed: 'أُغلق الأسبوع! أنشئ قائمتك القادمة من القائمة.',
    groceryArchive: 'أرشفة',
    groceryArchiveConfirm: 'أرشفة هذه القائمة في سجل المشتريات؟',
    groceryArchived: 'أُرشفت القائمة في السجل!',
    groceryArchiveError: 'تعذّرت أرشفة القائمة. أعد المحاولة.',
    groceryDeleteAll: 'حذف القائمة كلها',
    groceryDeleteAllConfirm: 'حذف {n} منتجات؟ نهائي — بدون أرشفة.',
    grocerySignInHint: 'سجّل الدخول (أو أنشئ حسابًا) لأرشفة مشترياتك والاطلاع على السجل.',
    groceryPickerSearchLabel: 'ابحث عن مكوّن لإضافته إلى القائمة',
    groceryPickerSearchPlaceholder: 'ابحث عن مكوّن (طماطم، نعناع)...',
    groceryPickerNoResults: 'لا يوجد مكوّن مطابق',
    groceryPickerAddItem: 'أضف {name} إلى القائمة',
    groceryUnitSelectLabel: 'تغيير وحدة {name}',
    groceryHistoryTitle: 'سجل المشتريات',
    groceryHistoryEmpty: 'لا توجد قائمة مؤرشفة بعد. أغلق أسبوعًا لتجدها هنا.',
    groceryHistoryCount: '{n} منتجات',
    groceryHistoryDeleteConfirm: 'حذف هذه المشتريات من السجل؟',
    groceryHistoryLoadError: 'تعذّر تحميل السجل. أعد المحاولة لاحقًا.',
    groceryExportExcel: 'تصدير إلى Excel',
    groceryXlsxDate: 'التاريخ',
    groceryXlsxComment: 'الملاحظة',
    groceryXlsxItems: 'المنتجات',
    groceryXlsxPlanned: 'المتوقّع',
    groceryXlsxActual: 'الفعلي',
    groceryXlsxGap: 'الفرق',
    groceryXlsxTotal: 'المجموع',
    planBudgetLabel: 'الميزانية المتوقعة للأسبوع: {n}',
    unitInfoAria: 'وصف الوحدة {unit}',
    cartAddLabel: 'أضف {name} إلى قائمة التسوق',
    cartAddedLabel: 'تمت الإضافة إلى قائمة التسوق',
    groceryBadgeLabel: 'قائمة التسوق ({count})',
    chooseListTitle: 'إلى أي قائمة مشتريات تريد الإضافة؟',
    chooseListRemaining: 'بقيت {n}',
    chooseListNewList: 'قائمة جديدة',
    chooseListNamePlaceholder: 'اسم القائمة الجديدة',
    chooseListCreate: 'إنشاء',
    listsSwitchLabel: 'التبديل بين قوائم التسوق',
    listsRemaining: '{n} متبقية',
    listsRename: 'إعادة تسمية القائمة',
    listsNew: 'قائمة جديدة',
    listsDuplicate: 'نسخ القائمة',
    listsDelete: 'حذف القائمة',
    listsDeleteConfirm: 'حذف قائمة « {name} » نهائيًا؟',
    listsFromHistory: 'إعادة إنشاء هذه القائمة',
    listsFromHistoryName: 'قائمة المشتريات',
    listsFromHistoryToast: 'أُنشئت قائمة جديدة من هذه المشتريات!',
    listEditorNameLabel: 'اسم القائمة',
    listEditorNewPlaceholder: 'اسم القائمة الجديدة',
    listEditorCreate: 'إنشاء',
    listEditorSave: 'حفظ',
    listEditorCancel: 'إلغاء',
    suggInList: 'موجود في القائمة',
    customUnitTitle: '« {query} » غير موجود في الكتالوج',
    customUnitAddAsArticle: 'إضافة كمنتج',
    customUnitRow: 'أضف « {query} » كمنتج',
    customUnitUnitLabel: 'وحدة المنتج',
    customUnitOther: 'أخرى…',
    customUnitOtherPlaceholder: 'وحدة حرّة (علبة، كيس...)',
  },
  derja_ar: DERJA_ARABIC,
} satisfies Record<Language, TranslationDictionary>;
