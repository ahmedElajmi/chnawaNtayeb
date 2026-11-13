import type { Language } from '@/core/shared';

/**
 * Labels of the backoffice, in every language and variant (they follow the current language like the
 * rest of the site). Kept apart from the public dictionary: it is only downloaded with /patron.
 * A variant only lists what differs from its family (derja in Arabic letters = literary Arabic + these).
 * The pages not yet moved to this dictionary still show French labels.
 */
export interface BackofficeTexts {
  title: string;
  /** Navigation landmark and the mobile menu */
  navLabel: string;
  menu: string;
  closeMenu: string;
  logout: string;
  backToSite: string;

  statusOnline: string;
  statusOnlineDetail: string;
  statusLocal: string;
  statusLocalDetail: string;

  home: string;
  homeHint: string;
  recipes: string;
  recipesHint: string;
  ingredients: string;
  ingredientsHint: string;
  engine: string;
  engineHint: string;
  appearance: string;
  appearanceHint: string;
  data: string;
  dataHint: string;

  engineSimulator: string;
  engineScenarios: string;
  engineBoosts: string;
  engineSubstitutions: string;
  engineTuning: string;
  engineHistory: string;

  engineOnline: string;
  engineNoVersion: string;
  /** Shown while the settings come from the offline copy */
  engineFromCache: string;
  engineDraft: string;
  engineNotePlaceholder: string;
  enginePublish: string;
  enginePublishing: string;
  engineCancel: string;
  engineAcceptFailures: string;
  engineIdle: string;
  engineExport: string;
  engineImport: string;
  engineResetDraft: string;

  // Validation workflow
  reviewTitle: string;
  reviewResume: string;
  reviewValidated: string;
  reviewCompleteness: string;
  reviewApprove: string;
  reviewReject: string;
  reviewSendBack: string;
  reviewNotePlaceholder: string;
  reviewNext: string;
  reviewEdit: string;
  reviewPreview: string;
  reviewPublish: string;
  reviewPublishHint: string;
  reviewUnpublish: string;
  reviewOnlineVersion: string;
  reviewWorkVersion: string;
  reviewNothingOnline: string;
  reviewChecks: string;
  reviewNoChecks: string;
  reviewBlocking: string;
  reviewAdvice: string;
  reviewAllDone: string;
  reviewNotFound: string;
  reviewBack: string;
  reviewHistory: string;
  reviewStepLocked: string;
  reviewApproveReady: string;
  reviewCommon: string;
  reviewPart: string;
  reviewSelectCell: string;
  reviewChangedSinceValidation: string;
  reviewNoteFrom: string;
  reviewApproved: string;
  reviewSentBack: string;
  reviewPublished: string;
  reviewUnpublished: string;
  reviewEditorNotes: string;
  reviewSaved: string;
  reviewImportTitle: string;
  reviewImportHint: string;
  reviewImport: string;
  reviewImported: string;
  partIdentity: string;
  partMedia: string;
  partDetails: string;
  partSteps: string;
  partTip: string;
  stateIncomplete: string;
  stateReady: string;
  stateApproved: string;
  stateChanged: string;
  stateToFix: string;
  itemOnline: string;
  itemOnlinePending: string;
  itemToFix: string;
  itemPublishable: string;
  itemInReview: string;
  itemIncomplete: string;
  itemReady: string;
  filterAll: string;
  filterOnline: string;
  filterPending: string;
  filterToReview: string;
  filterToFix: string;
  filterIncomplete: string;
  ruleName: string;
  ruleDescription: string;
  rulePhoto: string;
  ruleVideo: string;
  ruleIngredients: string;
  ruleKeyIngredient: string;
  ruleKnownIngredients: string;
  rulePublishedIngredients: string;
  ruleTimes: string;
  ruleSteps: string;
  ruleTip: string;
}

const fr: BackofficeTexts = {
  title: 'Backoffice',
  navLabel: 'Sections du backoffice',
  menu: 'Menu',
  closeMenu: 'Fermer le menu',
  logout: 'Se déconnecter',
  backToSite: 'Retour au site',

  statusOnline: 'Publié pour tous',
  statusOnlineDetail: 'Tes modifications sont enregistrées en ligne et envoyées à tous les appareils.',
  statusLocal: 'Local seulement',
  statusLocalDetail:
    "Le serveur n'a pas pu relier ta session à la base de données (configuration du serveur absente ou invalide, voir la documentation d'exploitation). Tes modifications restent sur cet appareil et ne sont pas publiées.",

  home: 'Accueil',
  homeHint: 'Chiffres du catalogue et actions rapides',
  recipes: 'Recettes',
  recipesHint: 'Créer, modifier, publier les recettes',
  ingredients: 'Ingrédients',
  ingredientsHint: 'Noms, catégories, photos et prix du marché',
  engine: 'Moteur',
  engineHint: 'Réglages des suggestions « Warini chnowa ntayeb »',
  appearance: 'Apparence',
  appearanceHint: 'Thèmes de couleurs proposés au public',
  data: 'Données',
  dataHint: 'Sauvegarde, restauration et synchronisation',

  engineSimulator: 'Simulateur',
  engineScenarios: 'Scénarios',
  engineBoosts: 'Mises en avant',
  engineSubstitutions: 'Remplacements',
  engineTuning: 'Réglages',
  engineHistory: 'Historique',

  engineOnline: 'En ligne : version {version}',
  engineNoVersion: 'En ligne : réglages par défaut',
  engineFromCache: 'copie hors ligne',
  engineDraft: 'Brouillon non publié',
  engineNotePlaceholder: 'Note de version (ex. : plats de Ramadan en avant)',
  enginePublish: 'Publier',
  enginePublishing: 'Publication…',
  engineCancel: 'Annuler',
  engineAcceptFailures: 'Publier malgré {count} scénario(s) non respecté(s)',
  engineIdle: 'Modifie un réglage : le simulateur et les scénarios montrent l’effet avant publication.',
  engineExport: 'Exporter (JSON)',
  engineImport: 'Importer',
  engineResetDraft: 'Brouillon = défaut',

  reviewTitle: 'Validation',
  reviewResume: 'Reprendre',
  reviewValidated: '{percent} % validé',
  reviewCompleteness: 'Complétude {percent} %',
  reviewApprove: 'Valider',
  reviewReject: 'À corriger',
  reviewSendBack: 'Renvoyer',
  reviewNotePlaceholder: 'Ce qu’il faut corriger…',
  reviewNext: 'Suivant',
  reviewEdit: 'Modifier',
  reviewPreview: 'Aperçu public',
  reviewPublish: 'Publier',
  reviewPublishHint: 'Les parties validées seront publiées ; les autres gardent leur version en ligne.',
  reviewUnpublish: 'Retirer du site',
  reviewOnlineVersion: 'En ligne',
  reviewWorkVersion: 'Dans l’atelier',
  reviewNothingOnline: 'Pas encore en ligne',
  reviewChecks: 'Contrôles',
  reviewNoChecks: 'Aucun contrôle pour cette partie.',
  reviewBlocking: 'bloquant',
  reviewAdvice: 'conseillé',
  reviewAllDone: 'Tout est validé.',
  reviewNotFound: 'Recette introuvable.',
  reviewBack: 'Retour aux recettes',
  reviewHistory: 'Historique',
  reviewStepLocked: 'Valide d’abord les étapes précédentes.',
  reviewApproveReady: 'Valider les {count} parties prêtes',
  reviewCommon: 'Commune',
  reviewPart: 'Partie',
  reviewSelectCell: 'Choisis une case de la grille.',
  reviewChangedSinceValidation: 'Modifiée depuis sa validation : à valider de nouveau.',
  reviewNoteFrom: 'Note : {note}',
  reviewApproved: 'Partie validée.',
  reviewSentBack: 'Partie renvoyée avec ta note.',
  reviewPublished: 'Publié : visible par tous.',
  reviewUnpublished: 'Retiré du site (gardé dans l’atelier).',
  reviewEditorNotes: 'À corriger d’après la validation :',
  reviewSaved: 'Enregistré dans l’atelier : à valider avant publication.',
  reviewImportTitle: 'Workflow de validation',
  reviewImportHint:
    'Crée une copie dans l’atelier pour chaque recette : celles en ligne sont marquées validées, les brouillons quittent le site et restent dans l’atelier. Sans danger, à faire une fois.',
  reviewImport: 'Importer les recettes dans l’atelier',
  reviewImported: '{count} recette(s) ajoutée(s) à l’atelier.',
  partIdentity: 'Nom et description',
  partMedia: 'Médias',
  partDetails: 'Infos et ingrédients',
  partSteps: 'Étapes',
  partTip: 'Astuce du chef',
  stateIncomplete: 'À compléter',
  stateReady: 'Prête',
  stateApproved: 'Validée',
  stateChanged: 'Modifiée',
  stateToFix: 'À corriger',
  itemOnline: 'En ligne',
  itemOnlinePending: 'En ligne · modifs en attente',
  itemToFix: 'À corriger',
  itemPublishable: 'Prête à publier',
  itemInReview: 'En relecture',
  itemIncomplete: 'À compléter',
  itemReady: 'À valider',
  filterAll: 'Toutes',
  filterOnline: 'En ligne',
  filterPending: 'Modifs en attente',
  filterToReview: 'À valider',
  filterToFix: 'À corriger',
  filterIncomplete: 'À compléter',
  ruleName: 'Nom écrit',
  ruleDescription: 'Description écrite',
  rulePhoto: 'Photo valide (lien https)',
  ruleVideo: 'Vidéo YouTube',
  ruleIngredients: 'Au moins un ingrédient',
  ruleKeyIngredient: 'Un ingrédient clé',
  ruleKnownIngredients: 'Ingrédients du catalogue',
  rulePublishedIngredients: 'Ingrédients en ligne',
  ruleTimes: 'Temps et portions',
  ruleSteps: 'Étapes écrites (toutes traduites)',
  ruleTip: 'Astuce du chef',
};

const derja: BackofficeTexts = {
  title: 'Backoffice',
  navLabel: 'Aqsem el backoffice',
  menu: 'Menu',
  closeMenu: 'Sakker el menu',
  logout: 'Okhrej',
  backToSite: 'Arja3 lel site',

  statusOnline: 'Mnachour lel kol',
  statusOnlineDetail: 'Tabdilatek tetsajjel en ligne w temchi l kol el appareils.',
  statusLocal: 'Ken 3al appareil hedha',
  statusLocalDetail:
    "El serveur ma najjamch yerbot session mte3ek bel base de données (configuration mta3 el serveur na9sa walla ghalta, chouf documentation d'exploitation). Tabdilatek yo93dou 3al appareil hedha w ma yetnachrouch.",

  home: 'El bidaya',
  homeHint: 'Ar9am el catalogue w actions sri3a',
  recipes: 'El maklet',
  recipesHint: 'Zid, baddel w onchor el maklet',
  ingredients: 'El ingrédients',
  ingredientsHint: 'Asami, catégories, tsawer w aswem el souq',
  engine: 'El moteur',
  engineHint: 'Réglages mta3 el suggestions « Warini chnowa ntayeb »',
  appearance: 'El chkel',
  appearanceHint: 'Thèmes mta3 el alwen lel public',
  data: 'El données',
  dataHint: 'Sauvegarde, restauration w synchronisation',

  engineSimulator: 'Simulateur',
  engineScenarios: 'Scénarios',
  engineBoosts: 'Mises en avant',
  engineSubstitutions: 'Tabdilat',
  engineTuning: 'Réglages',
  engineHistory: 'Historique',

  engineOnline: 'En ligne : version {version}',
  engineNoVersion: 'En ligne : réglages par défaut',
  engineFromCache: 'copie 3al appareil',
  engineDraft: 'Brouillon mouch mnachour',
  engineNotePlaceholder: 'Note 3al version (mathalan : maklet Ramdhan l9oddem)',
  enginePublish: 'Onchor',
  enginePublishing: 'Ya9ra fel publication…',
  engineCancel: 'Batel',
  engineAcceptFailures: 'Onchor m3a {count} scénario(s) mouch mrespectyin',
  engineIdle: 'Baddel réglage : el simulateur w el scénarios ywarrik chnowa yetbaddel 9bal ma tonchor.',
  engineExport: 'Exporti (JSON)',
  engineImport: 'Importi',
  engineResetDraft: 'Brouillon = par défaut',

  reviewTitle: 'Validation',
  reviewResume: 'Kammel',
  reviewValidated: '{percent} % validé',
  reviewCompleteness: 'Kmel {percent} %',
  reviewApprove: 'Sadda9',
  reviewReject: 'Lazem tetsala7',
  reviewSendBack: 'Raja3ha',
  reviewNotePlaceholder: 'Chnowa lazem yetsala7…',
  reviewNext: 'Elli ba3dou',
  reviewEdit: 'Baddel',
  reviewPreview: 'Chnowa ychouf el public',
  reviewPublish: 'Onchor',
  reviewPublishHint: 'El aqsem elli tsadda9 3lihom yetnachrou ; el ba9i yo93od kif ma howa en ligne.',
  reviewUnpublish: 'Na77iha mel site',
  reviewOnlineVersion: 'En ligne',
  reviewWorkVersion: 'Fel atelier',
  reviewNothingOnline: 'Mazelet mouch en ligne',
  reviewChecks: 'Contrôles',
  reviewNoChecks: 'Ma fammech contrôle lel 9asm hedha.',
  reviewBlocking: 'ylazem',
  reviewAdvice: 'mostahsen',
  reviewAllDone: 'Kol chay tsadda9.',
  reviewNotFound: 'El makla mouch mawjouda.',
  reviewBack: 'Arja3 lel maklet',
  reviewHistory: 'Historique',
  reviewStepLocked: 'Sadda9 9bal 3al marahel elli 9balha.',
  reviewApproveReady: 'Sadda9 3al {count} aqsem el wejdin',
  reviewCommon: 'Mouchtarka',
  reviewPart: '9asm',
  reviewSelectCell: 'Ikhtar case mel grille.',
  reviewChangedSinceValidation: 'Tbaddlet ba3d ma tsadda9 3liha : lazem tetsadda9 marra okhra.',
  reviewNoteFrom: 'Mlahdha : {note}',
  reviewApproved: '9asm tsadda9.',
  reviewSentBack: '9asm traja3 m3a el mlahdha.',
  reviewPublished: 'Tnachret : el kol ychoufha.',
  reviewUnpublished: 'Tna77at mel site (9a3da fel atelier).',
  reviewEditorNotes: 'Lazem tetsala7 7asb el validation :',
  reviewSaved: 'Tsajjel fel atelier : lazem yetsadda9 9bal ma yetnchar.',
  reviewImportTitle: 'Workflow mta3 el validation',
  reviewImportHint:
    'Ya3mel copie fel atelier l kol makla : elli en ligne tetsadda9, el brouillons yokhrjou mel site w yo93dou fel atelier. Ma fih 7ata khatar, marra wa7da.',
  reviewImport: 'Importi el maklet lel atelier',
  reviewImported: '{count} makla tzadet lel atelier.',
  partIdentity: 'Esm w wasf',
  partMedia: 'Tsawer w vidéo',
  partDetails: 'Ma3loumet w ingrédients',
  partSteps: 'El marahel',
  partTip: 'Nasi7a mta3 el chef',
  stateIncomplete: 'Lazem tetkammel',
  stateReady: 'Wejda',
  stateApproved: 'Tsadda9',
  stateChanged: 'Tbaddlet',
  stateToFix: 'Lazem tetsala7',
  itemOnline: 'En ligne',
  itemOnlinePending: 'En ligne · tabdilat testanna',
  itemToFix: 'Lazem tetsala7',
  itemPublishable: 'Wejda lel nachr',
  itemInReview: 'Fel mouraja3a',
  itemIncomplete: 'Lazem tetkammel',
  itemReady: 'Testanna validation',
  filterAll: 'El kol',
  filterOnline: 'En ligne',
  filterPending: 'Tabdilat testanna',
  filterToReview: 'Lel validation',
  filterToFix: 'Lazem tetsala7',
  filterIncomplete: 'Lazem tetkammel',
  ruleName: 'Esm mektoub',
  ruleDescription: 'Wasf mektoub',
  rulePhoto: 'Taswira s7i7a (lien https)',
  ruleVideo: 'Vidéo YouTube',
  ruleIngredients: 'Ingrédient wa7ed 3al a9al',
  ruleKeyIngredient: 'Ingrédient asesi',
  ruleKnownIngredients: 'Ingrédients mel catalogue',
  rulePublishedIngredients: 'Ingrédients en ligne',
  ruleTimes: 'Wa9t w 9asmet',
  ruleSteps: 'Marahel mektoubin (kol chay mtarjem)',
  ruleTip: 'Nasi7a mta3 el chef',
};

const ar: BackofficeTexts = {
  title: 'لوحة الإدارة',
  navLabel: 'أقسام لوحة الإدارة',
  menu: 'القائمة',
  closeMenu: 'إغلاق القائمة',
  logout: 'تسجيل الخروج',
  backToSite: 'العودة إلى الموقع',

  statusOnline: 'منشور للجميع',
  statusOnlineDetail: 'تُحفظ تعديلاتك على الإنترنت وتُرسل إلى جميع الأجهزة.',
  statusLocal: 'على هذا الجهاز فقط',
  statusLocalDetail:
    'تعذّر على الخادم ربط جلستك بقاعدة البيانات (إعدادات الخادم غائبة أو غير صالحة، راجع وثائق التشغيل). تبقى تعديلاتك على هذا الجهاز ولا تُنشر.',

  home: 'الرئيسية',
  homeHint: 'أرقام الفهرس وإجراءات سريعة',
  recipes: 'الوصفات',
  recipesHint: 'إنشاء الوصفات وتعديلها ونشرها',
  ingredients: 'المكوّنات',
  ingredientsHint: 'الأسماء والأصناف والصور وأسعار السوق',
  engine: 'المحرّك',
  engineHint: 'إعدادات الاقتراحات « وريني شنوة نطيّب »',
  appearance: 'المظهر',
  appearanceHint: 'سمات الألوان المقترحة على الجمهور',
  data: 'البيانات',
  dataHint: 'النسخ الاحتياطي والاستعادة والمزامنة',

  engineSimulator: 'المحاكي',
  engineScenarios: 'السيناريوهات',
  engineBoosts: 'الإبراز',
  engineSubstitutions: 'البدائل',
  engineTuning: 'الإعدادات',
  engineHistory: 'السجلّ',

  engineOnline: 'المنشور: الإصدار {version}',
  engineNoVersion: 'المنشور: الإعدادات الافتراضية',
  engineFromCache: 'نسخة محفوظة على الجهاز',
  engineDraft: 'مسودة غير منشورة',
  engineNotePlaceholder: 'ملاحظة الإصدار (مثال: إبراز أطباق رمضان)',
  enginePublish: 'نشر',
  enginePublishing: 'جارٍ النشر…',
  engineCancel: 'إلغاء',
  engineAcceptFailures: 'النشر رغم {count} سيناريو غير محترم',
  engineIdle: 'غيّر إعدادًا: يعرض المحاكي والسيناريوهات الأثر قبل النشر.',
  engineExport: 'تصدير (JSON)',
  engineImport: 'استيراد',
  engineResetDraft: 'المسودة = الافتراضي',

  reviewTitle: 'المراجعة',
  reviewResume: 'متابعة',
  reviewValidated: '{percent} % تمت المصادقة عليه',
  reviewCompleteness: 'الاكتمال {percent} %',
  reviewApprove: 'مصادقة',
  reviewReject: 'يحتاج تصحيحًا',
  reviewSendBack: 'إرجاع',
  reviewNotePlaceholder: 'ما الذي يجب تصحيحه…',
  reviewNext: 'التالي',
  reviewEdit: 'تعديل',
  reviewPreview: 'معاينة للعموم',
  reviewPublish: 'نشر',
  reviewPublishHint: 'تُنشر الأجزاء المصادق عليها، وتحتفظ البقية بنسختها المنشورة.',
  reviewUnpublish: 'سحب من الموقع',
  reviewOnlineVersion: 'المنشور',
  reviewWorkVersion: 'في الورشة',
  reviewNothingOnline: 'غير منشور بعد',
  reviewChecks: 'عمليات التحقق',
  reviewNoChecks: 'لا توجد عمليات تحقق لهذا الجزء.',
  reviewBlocking: 'إلزامي',
  reviewAdvice: 'مستحسن',
  reviewAllDone: 'تمت المصادقة على كل شيء.',
  reviewNotFound: 'الوصفة غير موجودة.',
  reviewBack: 'العودة إلى الوصفات',
  reviewHistory: 'السجلّ',
  reviewStepLocked: 'صادق أولًا على المراحل السابقة.',
  reviewApproveReady: 'المصادقة على {count} أجزاء جاهزة',
  reviewCommon: 'مشتركة',
  reviewPart: 'الجزء',
  reviewSelectCell: 'اختر خانة من الجدول.',
  reviewChangedSinceValidation: 'عُدّلت بعد المصادقة عليها: تحتاج مصادقة جديدة.',
  reviewNoteFrom: 'ملاحظة: {note}',
  reviewApproved: 'تمت المصادقة على الجزء.',
  reviewSentBack: 'أُرجع الجزء مع ملاحظتك.',
  reviewPublished: 'نُشر: مرئي للجميع.',
  reviewUnpublished: 'سُحب من الموقع (محفوظ في الورشة).',
  reviewEditorNotes: 'يجب تصحيحه حسب المراجعة:',
  reviewSaved: 'حُفظ في الورشة: تجب المصادقة قبل النشر.',
  reviewImportTitle: 'مسار المراجعة',
  reviewImportHint:
    'ينشئ نسخة في الورشة لكل وصفة: المنشورة تُعتبر مصادقًا عليها، والمسودات تُسحب من الموقع وتبقى في الورشة. آمن، يكفي مرة واحدة.',
  reviewImport: 'استيراد الوصفات إلى الورشة',
  reviewImported: 'أُضيفت {count} وصفة إلى الورشة.',
  partIdentity: 'الاسم والوصف',
  partMedia: 'الصور والفيديو',
  partDetails: 'المعلومات والمكوّنات',
  partSteps: 'المراحل',
  partTip: 'نصيحة الطاهي',
  stateIncomplete: 'غير مكتمل',
  stateReady: 'جاهز',
  stateApproved: 'مصادق عليه',
  stateChanged: 'معدّل',
  stateToFix: 'يحتاج تصحيحًا',
  itemOnline: 'منشور',
  itemOnlinePending: 'منشور · تعديلات في الانتظار',
  itemToFix: 'يحتاج تصحيحًا',
  itemPublishable: 'جاهز للنشر',
  itemInReview: 'قيد المراجعة',
  itemIncomplete: 'غير مكتمل',
  itemReady: 'في انتظار المصادقة',
  filterAll: 'الكل',
  filterOnline: 'المنشورة',
  filterPending: 'تعديلات في الانتظار',
  filterToReview: 'للمصادقة',
  filterToFix: 'تحتاج تصحيحًا',
  filterIncomplete: 'غير مكتملة',
  ruleName: 'الاسم مكتوب',
  ruleDescription: 'الوصف مكتوب',
  rulePhoto: 'صورة صالحة (رابط https)',
  ruleVideo: 'فيديو يوتيوب',
  ruleIngredients: 'مكوّن واحد على الأقل',
  ruleKeyIngredient: 'مكوّن أساسي',
  ruleKnownIngredients: 'مكوّنات من الفهرس',
  rulePublishedIngredients: 'مكوّنات منشورة',
  ruleTimes: 'الوقت والحصص',
  ruleSteps: 'المراحل مكتوبة (ومترجمة كلها)',
  ruleTip: 'نصيحة الطاهي',
};

/** Derja in Arabic letters: only what differs from literary Arabic. To be reviewed by a native speaker. */
const derjaArabic: Partial<BackofficeTexts> = {
  logout: 'اخرج',
  backToSite: 'ارجع للموقع',
  statusOnline: 'منشور للكل',
  statusOnlineDetail: 'تبديلاتك تتسجّل أونلاين وتمشي لكل الأجهزة.',
  statusLocal: 'كان على الجهاز هذا',
  home: 'البداية',
  recipes: 'الماكلات',
  recipesHint: 'زيد، بدّل وانشر الماكلات',
  ingredients: 'المكوّنات',
  ingredientsHint: 'الأسامي، الأصناف، التصاور وأسوام السوق',
  appearance: 'الشكل',
  engineSubstitutions: 'التبديلات',
  engineDraft: 'مسودّة موش منشورة',
  enginePublish: 'انشر',
  engineCancel: 'بطّل',
  reviewResume: 'كمّل',
  reviewValidated: '{percent} % متصادق عليه',
  reviewCompleteness: 'الكمال {percent} %',
  reviewApprove: 'صدّق',
  reviewReject: 'لازم تتصلّح',
  reviewSendBack: 'رجّعها',
  reviewNotePlaceholder: 'شنوّة لازم يتصلّح…',
  reviewNext: 'اللي بعدو',
  reviewEdit: 'بدّل',
  reviewPreview: 'شنوّة يشوف العموم',
  reviewPublish: 'انشر',
  reviewPublishHint: 'الأقسام المصدّقة تتنشر، والباقي يقعد كيف ما هو منشور.',
  reviewUnpublish: 'نحّيها من الموقع',
  reviewNothingOnline: 'مازالت موش منشورة',
  reviewChecks: 'التثبّت',
  reviewNoChecks: 'ما فمّاش تثبّت للقسم هذا.',
  reviewBlocking: 'يلزم',
  reviewAllDone: 'كل شي تصدّق.',
  reviewNotFound: 'الماكلة موش موجودة.',
  reviewBack: 'ارجع للماكلات',
  reviewHistory: 'التاريخ',
  reviewStepLocked: 'صدّق قبل على المراحل اللي قبلها.',
  reviewApproveReady: 'صدّق على {count} أقسام واجدين',
  reviewPart: 'القسم',
  reviewSelectCell: 'اختار خانة من الجدول.',
  reviewChangedSinceValidation: 'تبدّلت بعد ما تصدّقت: لازمها تصديق جديد.',
  reviewApproved: 'القسم تصدّق.',
  reviewSentBack: 'القسم ترجّع مع الملاحظة.',
  reviewPublished: 'تنشرت: الكل يشوفها.',
  reviewUnpublished: 'تنحّات من الموقع (قاعدة في الورشة).',
  reviewEditorNotes: 'لازم يتصلّح حسب المراجعة:',
  reviewSaved: 'تسجّل في الورشة: لازم يتصدّق قبل ما يتنشر.',
  reviewImportHint:
    'يعمل نسخة في الورشة لكل ماكلة: المنشورة تتصدّق، والمسودّات تخرج من الموقع وتقعد في الورشة. ما فيهاش خطر، مرّة برك.',
  reviewImport: 'جيب الماكلات للورشة',
  reviewImported: '{count} ماكلة تزادت للورشة.',
  partIdentity: 'الإسم والوصف',
  partMedia: 'التصاور والفيديو',
  partTip: 'نصيحة الشاف',
  stateIncomplete: 'لازم تتكمّل',
  stateReady: 'واجدة',
  stateApproved: 'متصدّقة',
  stateChanged: 'تبدّلت',
  stateToFix: 'لازم تتصلّح',
  itemOnline: 'منشورة',
  itemOnlinePending: 'منشورة · تبديلات تستنّى',
  itemToFix: 'لازم تتصلّح',
  itemPublishable: 'واجدة للنشر',
  itemInReview: 'في المراجعة',
  itemIncomplete: 'لازم تتكمّل',
  itemReady: 'تستنّى التصديق',
  filterPending: 'تبديلات تستنّى',
  filterToReview: 'للتصديق',
  filterToFix: 'لازم تتصلّح',
  filterIncomplete: 'لازم تتكمّل',
  ruleName: 'الإسم مكتوب',
  rulePhoto: 'تصويرة صحيحة (رابط https)',
  ruleKnownIngredients: 'مكوّنات من الكتالوغ',
  ruleSteps: 'المراحل مكتوبة (ومترجمة الكل)',
  ruleTip: 'نصيحة الشاف',
};

const BASE = { fr, derja, ar } satisfies Record<Exclude<Language, 'derja_ar'>, BackofficeTexts>;

export const BACKOFFICE_TEXTS: Record<Language, BackofficeTexts> = {
  ...BASE,
  derja_ar: { ...BASE.ar, ...derjaArabic },
};

/** Replaces `{name}` placeholders: format(b.engineOnline, { version: 3 }). */
export function format(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
