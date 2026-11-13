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
