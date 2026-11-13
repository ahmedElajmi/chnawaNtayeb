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

  // Queue, home, workflows, roles, team
  event_save: string;
  event_approve: string;
  event_reject: string;
  event_publish: string;
  event_unpublish: string;
  event_restore: string;
  event_import: string;
  reviewCancel: string;
  reviewVersions: string;
  reviewNoVersions: string;
  reviewRestore: string;
  reviewRestoreConfirm: string;
  reviewPricesSaved: string;
  partName: string;
  partPhoto: string;
  partCategory: string;
  partPrice: string;
  ruleCategory: string;
  rulePrice: string;
  filterNoPhoto: string;
  filterToTranslate: string;
  queueTitle: string;
  queueHint: string;
  queueGroupBy: string;
  queueByItem: string;
  queueByStep: string;
  queueByPart: string;
  queueByLanguage: string;
  queueByKind: string;
  queueByAuthor: string;
  queueCells: string;
  queueReview: string;
  queueBack: string;
  queueOpenItem: string;
  queueSeriesDone: string;
  queueEmpty: string;
  queueCountPending: string;
  queueCountItems: string;
  queueCountToFix: string;
  queueCountPublishable: string;
  todoTitle: string;
  todoNothing: string;
  todoReview: string;
  todoToFix: string;
  todoPublishable: string;
  todoRecipesToTranslate: string;
  todoRecipesWithoutPhoto: string;
  todoIngredientsUnitCheck: string;
  todoIngredientsWithoutPhoto: string;
  todoIngredientsUnused: string;
  workflowsTitle: string;
  workflowsHint: string;
  workflowsSteps: string;
  workflowsRoles: string;
  workflowsTeam: string;
  workflowsVersion: string;
  workflowsDefault: string;
  workflowsIdle: string;
  workflowsNote: string;
  workflowsSave: string;
  workflowsSaved: string;
  workflowsOpenVersion: string;
  workflowsImpact: string;
  workflowsNoImpact: string;
  workflowsOptions: string;
  workflowsSequential: string;
  workflowsBatch: string;
  workflowsPartial: string;
  workflowsAddStep: string;
  workflowsNewStep: string;
  workflowsMoveUp: string;
  workflowsMoveDown: string;
  workflowsDeleteStep: string;
  workflowsDeleteStepHint: string;
  workflowsNoCell: string;
  workflowsReviewers: string;
  workflowsCells: string;
  workflowsCellsHint: string;
  workflowsStepOf: string;
  workflowsNotReviewed: string;
  workflowsRequired: string;
  workflowsRuleOff: string;
  workflowsDefaultLevel: string;
  permEdit: string;
  permSubmit: string;
  permReview: string;
  permPublish: string;
  permManageWorkflows: string;
  permManageRoles: string;
  rolesMembers: string;
  rolesAdminHint: string;
  rolesDelete: string;
  rolesInUse: string;
  rolesLanguages: string;
  rolesLanguagesHint: string;
  rolesNewName: string;
  rolesAdd: string;
  teamHint: string;
  teamEmail: string;
  teamRole: string;
  teamAdd: string;
  teamAdded: string;
  teamUpdated: string;
  teamRemove: string;
  teamRemoved: string;
  teamEmpty: string;

  // Next action, completeness, reset
  event_reset: string;
  actionValidate: string;
  actionValidateChanges: string;
  actionPublish: string;
  actionFix: string;
  actionComplete: string;
  actionHint: string;
  completenessFull: string;
  completenessPercent: string;
  completenessMissing: string;
  completenessTitle: string;
  completenessHint: string;
  filterToEnrich: string;
  sortLabel: string;
  sortStatus: string;
  sortName: string;
  sortCompleteness: string;
  recipesListHint: string;
  ingredientsListHint: string;
  resetTitle: string;
  resetHint: string;
  resetButton: string;
  resetConfirm: string;
  resetDone: string;
  resetFailed: string;
  reviewOnlineNoCopy: string;

  // Lists
  searchRecipes: string;
  duplicateRecipe: string;
  searchIngredients: string;

  // Ingredient list
  ingFixedPrice: string;
  ingUnusedFilter: string;
  ingUnitCheck: string;
  allCategories: string;
  ingSavePrices: string;
  ingAdd: string;
  ingPriceHint: string;
  ingShown: string;
  ingUnit: string;
  ingUsedIn: string;
  ingNoRecipe: string;
  ingPriceMin: string;
  ingPriceMax: string;
  ingEdit: string;
  ingEditHint: string;
  confirmDeleteRecipe: string;
  recipeDeleted: string;
  todoRecipesToEnrich: string;

  // Categories
  close: string;
  cancel: string;
  save: string;
  categories: string;
  categoriesHint: string;
  catRecipesTab: string;
  catIngredientsTab: string;
  catRecipesHint: string;
  catIngredientsHint: string;
  catAdd: string;
  catNew: string;
  catEmpty: string;
  catExpand: string;
  catCollapse: string;
  catCountHint: string;
  catMissingNames: string;
  catMoveUp: string;
  catMoveDown: string;
  catAddChild: string;
  catEdit: string;
  catDelete: string;
  catDeleteConfirm: string;
  catDeleted: string;
  catSelect: string;
  catErrorId: string;
  catErrorName: string;
  catErrorNameTaken: string;
  catErrorParent: string;
  catErrorLoop: string;
  catErrorDepth: string;
  catBlockBuiltIn: string;
  catBlockChildren: string;
  catBlockInUse: string;
  catBlockDenied: string;
  catAssignFailed: string;
  catAssignedRecipes: string;
  catAssignedIngredients: string;
  catHoldsRecipes: string;
  catHoldsIngredients: string;
  catSubIncluded: string;
  catSearchRecipes: string;
  catSearchIngredients: string;
  catAddRecipes: string;
  catMoveIngredients: string;
  catAssignHint: string;
  catMoveHint: string;
  catRemoveFrom: string;
  catDiscard: string;
  catSaved: string;
  catSavedLocal: string;
  catName: string;
  catIcon: string;
  catParent: string;
  catNoParent: string;
  groupByCategory: string;
  groupLevel: string;
  noCategory: string;
  courseLabel: string;
  courseEntree: string;
  courseMain: string;
  courseDessert: string;
  recipeCategories: string;
  recipeCategoriesHint: string;
  recipeNoCategories: string;
  queueGroupCategory: string;
  groupToDo: string;
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
  reviewBack: 'Retour à la liste',
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

  event_save: 'Enregistré',
  event_approve: 'Validé',
  event_reject: 'Renvoyé',
  event_publish: 'Publié',
  event_unpublish: 'Retiré du site',
  event_restore: 'Version rétablie',
  event_import: 'Importé',
  reviewCancel: 'Annuler',
  reviewVersions: 'Versions publiées',
  reviewNoVersions: 'Aucune version publiée.',
  reviewRestore: 'Rétablir',
  reviewRestoreConfirm: 'Rétablir cette version et la publier de nouveau ?',
  reviewPricesSaved: '{count} prix enregistré(s) dans l’atelier : à valider avant publication.',
  partName: 'Nom',
  partPhoto: 'Photo',
  partCategory: 'Catégorie et unité',
  partPrice: 'Prix',
  ruleCategory: 'Catégorie et unité',
  rulePrice: 'Prix (min ≤ max)',
  filterNoPhoto: 'Sans photo',
  filterToTranslate: 'À traduire',
  queueTitle: 'À valider',
  queueHint: 'Tout ce qui attend ta validation, regroupé',
  queueGroupBy: 'Regrouper par',
  queueByItem: 'Élément',
  queueByStep: 'Étape',
  queueByPart: 'Partie',
  queueByLanguage: 'Langue',
  queueByKind: 'Type',
  queueByAuthor: 'Auteur',
  queueCells: '{count} partie(s)',
  queueReview: 'Relire',
  queueBack: 'Retour aux groupes',
  queueOpenItem: 'Ouvrir la fiche',
  queueSeriesDone: 'Série terminée.',
  queueEmpty: 'Rien n’attend ta validation.',
  queueCountPending: 'Parties à valider',
  queueCountItems: 'Éléments concernés',
  queueCountToFix: 'À corriger',
  queueCountPublishable: 'Prêts à publier',
  todoTitle: 'À faire',
  todoNothing: 'Rien à faire pour l’instant.',
  todoReview: 'Parties à valider',
  todoToFix: 'Éléments renvoyés à corriger',
  todoPublishable: 'Prêts à publier',
  todoRecipesToTranslate: 'Recettes à traduire',
  todoRecipesWithoutPhoto: 'Recettes sans photo',
  todoIngredientsUnitCheck: 'Ingrédients : unité ou prix à vérifier',
  todoIngredientsWithoutPhoto: 'Ingrédients sans photo',
  todoIngredientsUnused: 'Ingrédients dans aucune recette',
  workflowsTitle: 'Workflows',
  workflowsHint: 'Étapes de validation, rôles et équipe',
  workflowsSteps: 'Étapes',
  workflowsRoles: 'Rôles',
  workflowsTeam: 'Équipe',
  workflowsVersion: 'En vigueur : version {version}',
  workflowsDefault: 'En vigueur : réglages par défaut',
  workflowsIdle: 'Modifie une étape ou un rôle : l’effet sur les éléments en ligne s’affiche avant d’enregistrer.',
  workflowsNote: 'Note de version (ex. : derja obligatoire)',
  workflowsSave: 'Enregistrer',
  workflowsSaved: 'Workflows enregistrés : ils s’appliquent à toute l’équipe.',
  workflowsOpenVersion: 'Ouvrir dans le brouillon',
  workflowsImpact:
    '{count} élément(s) en ligne auraient des parties obligatoires non validées : ils restent en ligne, marqués à valider.',
  workflowsNoImpact: 'Aucun élément en ligne n’est touché par ces réglages.',
  workflowsOptions: 'Options',
  workflowsSequential:
    'Étapes dans l’ordre : une étape s’ouvre quand les parties obligatoires des précédentes sont validées',
  workflowsBatch: 'Validation groupée des parties prêtes (avec confirmation)',
  workflowsPartial: 'Publier sans attendre une langue facultative (elle garde sa version en ligne)',
  workflowsAddStep: 'Ajouter une étape',
  workflowsNewStep: 'Étape',
  workflowsMoveUp: 'Monter',
  workflowsMoveDown: 'Descendre',
  workflowsDeleteStep: 'Supprimer l’étape',
  workflowsDeleteStepHint:
    'Une étape avec une partie obligatoire ne peut pas être supprimée : déplace d’abord la partie.',
  workflowsNoCell: 'Aucune partie : choisis-en ci-dessous.',
  workflowsReviewers: 'Validée par :',
  workflowsCells: 'Parties à valider',
  workflowsCellsHint: 'Pour chaque partie × langue : son étape, et si elle est obligatoire pour publier.',
  workflowsStepOf: 'Étape de',
  workflowsNotReviewed: '— non validée',
  workflowsRequired: 'Obligatoire',
  workflowsRuleOff: 'désactivé',
  workflowsDefaultLevel: 'par défaut',
  permEdit: 'Modifier',
  permSubmit: 'Envoyer à la validation',
  permReview: 'Valider',
  permPublish: 'Publier',
  permManageWorkflows: 'Gérer les workflows',
  permManageRoles: 'Gérer les rôles et l’équipe',
  rolesMembers: '{count} membre(s)',
  rolesAdminHint: 'L’administrateur a tous les droits et ne peut pas être modifié.',
  rolesDelete: 'Supprimer le rôle',
  rolesInUse: 'Rôle donné à des membres : change d’abord leur rôle.',
  rolesLanguages: 'Limité aux langues :',
  rolesLanguagesHint:
    'Aucune case cochée : toutes les parties. Sinon, seulement les textes de ces langues (traducteur).',
  rolesNewName: 'Nom du nouveau rôle',
  rolesAdd: 'Ajouter un rôle',
  teamHint:
    'Un membre se connecte sur le site avec son propre compte, puis ouvre /patron : il travaille avec les droits de son rôle. Ajoute-le par l’adresse e-mail de son compte.',
  teamEmail: 'Adresse e-mail du compte',
  teamRole: 'Rôle',
  teamAdd: 'Ajouter',
  teamAdded: 'Membre ajouté.',
  teamUpdated: 'Rôle modifié.',
  teamRemove: 'Retirer',
  teamRemoved: 'Membre retiré.',
  teamEmpty: 'Aucun membre pour l’instant : seul le compte patron a accès.',
  event_reset: 'Remis à valider',
  actionValidate: 'Valider ({percent} %)',
  actionValidateChanges: 'Valider les changements',
  actionPublish: 'Publier',
  actionFix: 'Corriger',
  actionComplete: 'Compléter',
  actionHint: 'Ouvre la fiche : les parties à valider une à une, puis la publication.',
  completenessFull: 'Complète',
  completenessPercent: 'Données à {percent} %',
  completenessMissing: 'Manque : {list}',
  completenessTitle: 'Complétude des données',
  completenessHint: 'Tout ce qui peut être rempli (langues facultatives, vidéo, astuce…), même après validation.',
  filterToEnrich: 'À enrichir',
  sortLabel: 'Trier',
  sortStatus: 'Par statut',
  sortName: 'Par nom',
  sortCompleteness: 'Moins complètes d’abord',
  recipesListHint: 'Une recette n’est visible sur le site qu’une fois validée et publiée.',
  ingredientsListHint: 'Un ingrédient n’est visible sur le site qu’une fois validé et publié.',
  resetTitle: 'Remettre toutes les recettes à valider',
  resetHint:
    'Chaque recette repart de zéro : toutes ses parties sont à valider et elle est retirée du site jusqu’à sa publication. Le contenu et l’historique sont gardés.',
  resetButton: 'Tout remettre à valider',
  resetConfirm:
    '{count} recette(s) vont repasser « à valider » et seront retirées du site : le site n’affichera plus que les recettes que tu publieras. Continuer ?',
  resetDone: '{count} recette(s) remise(s) à valider, dont {offline} retirée(s) du site.',
  resetFailed: '{failed} recette(s) n’ont pas pu être traitées : relance pour les reprendre.',
  reviewOnlineNoCopy: 'En ligne et validée : rien à faire. Une modification passera par la validation.',
  searchRecipes: 'Rechercher une recette par nom…',
  duplicateRecipe: 'Dupliquer : nouvelle recette à partir de celle-ci',
  searchIngredients: 'Rechercher un ingrédient…',
  ingFixedPrice: 'Prix fixe (min = max)',
  ingUnusedFilter: 'Dans aucune recette',
  ingUnitCheck: 'Unité à vérifier',
  allCategories: 'Toutes catégories',
  ingSavePrices: 'Enregistrer les prix ({count})',
  ingAdd: 'Ajouter un ingrédient',
  ingPriceHint:
    'Prix du marché en fourchette (min – max) pour une unité d’achat. Noms, photo et catégorie : bouton crayon.',
  ingShown: '{shown} ingrédient(s) affiché(s) sur {total}',
  ingUnit: 'Unité : {unit}',
  ingUsedIn: '{count} recette(s)',
  ingNoRecipe: 'aucune recette',
  ingPriceMin: 'Prix minimum de {name} en DT',
  ingPriceMax: 'Prix maximum de {name} en DT',
  ingEdit: 'Modifier {name}',
  ingEditHint: 'Modifier les noms, l’unité, la catégorie et la photo',
  confirmDeleteRecipe: 'Supprimer définitivement « {name} » ?',
  recipeDeleted: 'Recette supprimée',
  todoRecipesToEnrich: 'Recettes aux données incomplètes (langues, vidéo, astuce…)',
  close: 'Fermer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  categories: 'Catégories',
  categoriesHint: 'Arbre des catégories et affectation',
  catRecipesTab: 'Recettes',
  catIngredientsTab: 'Ingrédients',
  catRecipesHint:
    'Une recette peut être dans plusieurs catégories, à n’importe quel niveau ; être dans « Chorba » la met aussi dans « Ramadan ». Le type de plat (entrée, plat, dessert) reste à part.',
  catIngredientsHint:
    'Chaque ingrédient est dans une seule catégorie. Les catégories d’origine se renomment et se déplacent, mais ne se suppriment pas.',
  catAdd: 'Nouvelle catégorie',
  catNew: 'Nouvelle catégorie',
  catEmpty: 'Aucune catégorie pour le moment.',
  catExpand: 'Déplier',
  catCollapse: 'Replier',
  catCountHint: '{own} directement, {total} avec les sous-catégories',
  catMissingNames: 'Nom à traduire dans ces langues',
  catMoveUp: 'Monter',
  catMoveDown: 'Descendre',
  catAddChild: 'Ajouter une sous-catégorie',
  catEdit: 'Modifier la catégorie',
  catDelete: 'Supprimer la catégorie',
  catDeleteConfirm: 'Supprimer la catégorie « {name} » ?',
  catDeleted: 'Catégorie supprimée.',
  catSelect: 'Choisis une catégorie pour voir et gérer ce qu’elle contient.',
  catErrorId: 'Identifiant invalide.',
  catErrorName: 'Le nom en français est obligatoire.',
  catErrorNameTaken: 'Une catégorie de même niveau porte déjà ce nom.',
  catErrorParent: 'La catégorie parente n’existe plus.',
  catErrorLoop: 'Une catégorie ne peut pas aller sous elle-même ni sous une de ses sous-catégories.',
  catErrorDepth: 'Trop de niveaux : 4 au maximum.',
  catBlockBuiltIn: 'Une catégorie d’origine ne se supprime pas (elle se renomme ou se déplace).',
  catBlockChildren: 'Déplace ou supprime d’abord ses sous-catégories.',
  catBlockInUse: 'Elle contient encore des éléments : retire-les ou déplace-les d’abord.',
  catBlockDenied: 'Ton rôle ne permet pas de modifier les catégories.',
  catAssignFailed: '{failed} élément(s) non mis à jour : réessaie.',
  catAssignedRecipes: '{count} recette(s) mise(s) à jour : la partie « Infos et ingrédients » est à valider.',
  catAssignedIngredients: '{count} ingrédient(s) déplacé(s) : leur catégorie est à valider.',
  catHoldsRecipes: '{count} recette(s) directement dans cette catégorie',
  catHoldsIngredients: '{count} ingrédient(s) dans cette catégorie',
  catSubIncluded: 'ses sous-catégories comptent aussi pour elle',
  catSearchRecipes: 'Chercher des recettes à ajouter…',
  catSearchIngredients: 'Chercher des ingrédients à déplacer ici…',
  catAddRecipes: 'Ajouter {count} recette(s)',
  catMoveIngredients: 'Déplacer {count} ingrédient(s) ici',
  catAssignHint:
    'L’ajout passe par l’atelier : seule la partie « Infos et ingrédients » de chaque recette revient à valider.',
  catMoveHint:
    'Un ingrédient n’a qu’une catégorie : le mettre ici le retire de l’ancienne. Sa partie « Catégorie et unité » revient à valider.',
  catRemoveFrom: 'Retirer {name} de cette catégorie',
  catDiscard: 'Abandonner les modifications de cette catégorie ?',
  catSaved: 'Catégorie enregistrée.',
  catSavedLocal: 'Enregistrée sur cet appareil seulement : la base n’a pas répondu.',
  catName: 'Nom',
  catIcon: 'Icône',
  catParent: 'Placée sous',
  catNoParent: '— Aucune (famille) —',
  groupByCategory: 'Regrouper par catégorie',
  groupLevel: 'Niveau',
  noCategory: 'Sans catégorie',
  courseLabel: 'Type de plat',
  courseEntree: 'Entrée (salades, soupes, brik…)',
  courseMain: 'Plat principal',
  courseDessert: 'Dessert',
  recipeCategories: 'Catégories',
  recipeCategoriesHint: 'Coche les catégories de la recette (une sous-catégorie suffit : ses parents suivent).',
  recipeNoCategories: 'Aucune catégorie : crée-les dans Catégories.',
  queueGroupCategory: 'Catégorie',
  groupToDo: '{count} à traiter',
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
  reviewBack: 'Arja3 lel liste',
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

  event_save: 'Tsajjel',
  event_approve: 'Tsadda9',
  event_reject: 'Traja3',
  event_publish: 'Tnachar',
  event_unpublish: 'Tna77a mel site',
  event_restore: 'Version traj3et',
  event_import: 'Tjeb',
  reviewCancel: 'Batel',
  reviewVersions: 'Les versions elli tnachrou',
  reviewNoVersions: 'Ma fammech version mnachra.',
  reviewRestore: 'Raja3ha',
  reviewRestoreConfirm: 'Traja3 el version hedhi w tonchorha marra okhra ?',
  reviewPricesSaved: '{count} soum tsajjel fel atelier : lazem yetsadda9 9bal ma yetnchar.',
  partName: 'Esm',
  partPhoto: 'Taswira',
  partCategory: 'Catégorie w unité',
  partPrice: 'Soum',
  ruleCategory: 'Catégorie w unité',
  rulePrice: 'Soum (min ≤ max)',
  filterNoPhoto: 'Bla taswira',
  filterToTranslate: 'Lazem tetarjem',
  queueTitle: 'Lel validation',
  queueHint: 'Kol chay yestanna validation mte3ek, mjamma3',
  queueGroupBy: 'Jamma3 7asb',
  queueByItem: 'Element',
  queueByStep: 'Mar7la',
  queueByPart: '9asm',
  queueByLanguage: 'Lougha',
  queueByKind: 'Naw3',
  queueByAuthor: 'Elli ktebha',
  queueCells: '{count} 9asm',
  queueReview: 'A9ra',
  queueBack: 'Arja3 lel groupes',
  queueOpenItem: '7ell el fiche',
  queueSeriesDone: 'Kammelt el série.',
  queueEmpty: 'Ma fammech chay yestanna validation mte3ek.',
  queueCountPending: 'Aqsem lel validation',
  queueCountItems: 'Elements',
  queueCountToFix: 'Lazem tetsala7',
  queueCountPublishable: 'Wejdin lel nachr',
  todoTitle: 'Chnowa ba9i',
  todoNothing: 'Ma fammech chay tawa.',
  todoReview: 'Aqsem lel validation',
  todoToFix: 'Elements traj3ou lel tasli7',
  todoPublishable: 'Wejdin lel nachr',
  todoRecipesToTranslate: 'Maklet lazem tetarjem',
  todoRecipesWithoutPhoto: 'Maklet bla taswira',
  todoIngredientsUnitCheck: 'Ingrédients : unité walla soum lazem yetchaf',
  todoIngredientsWithoutPhoto: 'Ingrédients bla taswira',
  todoIngredientsUnused: 'Ingrédients fi 7atta makla',
  workflowsTitle: 'Workflows',
  workflowsHint: 'Marahel el validation, roles w équipe',
  workflowsSteps: 'Marahel',
  workflowsRoles: 'Roles',
  workflowsTeam: 'Équipe',
  workflowsVersion: 'Tawa : version {version}',
  workflowsDefault: 'Tawa : réglages par défaut',
  workflowsIdle: 'Baddel mar7la walla role : chnowa yetbaddel 3al elements en ligne yodhher 9bal ma tsajjel.',
  workflowsNote: 'Note 3al version (mathalan : derja lazma)',
  workflowsSave: 'Sajjel',
  workflowsSaved: 'Tsajjlou : yetbaddlou 3al équipe lkol.',
  workflowsOpenVersion: '7ellha fel brouillon',
  workflowsImpact:
    '{count} element en ligne ywalli fihom aqsem lazmin mouch mtsadd9in : yo93dou en ligne, w lazem yetsadda9 3lihom.',
  workflowsNoImpact: 'Ma fammech element en ligne yetbaddel.',
  workflowsOptions: 'Options',
  workflowsSequential: 'Marahel bel tartib : mar7la tet7al ki el aqsem el lazmin elli 9balha yetsadda9 3lihom',
  workflowsBatch: 'Validation mjamma3a lel aqsem el wejdin (m3a ta2kid)',
  workflowsPartial: 'Onchor bla ma testanna lougha mouch lazma (to93od kif ma hiya en ligne)',
  workflowsAddStep: 'Zid mar7la',
  workflowsNewStep: 'Mar7la',
  workflowsMoveUp: 'Tla3',
  workflowsMoveDown: 'Hbet',
  workflowsDeleteStep: 'Fasakh el mar7la',
  workflowsDeleteStepHint: 'Mar7la fiha 9asm lazem ma tetfsa5ech : 7arrek el 9asm 9bal.',
  workflowsNoCell: 'Ma fammech 9asm : ikhtar men ta7t.',
  workflowsReviewers: 'Ysadda9 3liha :',
  workflowsCells: 'Aqsem lel validation',
  workflowsCellsHint: 'L kol 9asm × lougha : el mar7la mte3ou, w kenou lazem bech yetnchar.',
  workflowsStepOf: 'Mar7la mta3',
  workflowsNotReviewed: '— ma tetsadda9ech',
  workflowsRequired: 'Lazem',
  workflowsRuleOff: 'mtaffi',
  workflowsDefaultLevel: 'par défaut',
  permEdit: 'Baddel',
  permSubmit: 'Ab3ath lel validation',
  permReview: 'Sadda9',
  permPublish: 'Onchor',
  permManageWorkflows: 'Tsayyer el workflows',
  permManageRoles: 'Tsayyer el roles w el équipe',
  rolesMembers: '{count} membre',
  rolesAdminHint: 'El admin 3andou el 7ou9ou9 lkol w ma yetbaddelch.',
  rolesDelete: 'Fasakh el role',
  rolesInUse: 'Role 3and membres : baddel el role mte3hom 9bal.',
  rolesLanguages: 'Ken lel loughat :',
  rolesLanguagesHint: 'Ma fammech case : el aqsem lkol. Sinon, ken nsous el loughat hedhom (traducteur).',
  rolesNewName: 'Esm el role el jdid',
  rolesAdd: 'Zid role',
  teamHint:
    'Membre yodkhol lel site b compte mte3ou, ba3d y7ell /patron : yekhdem b 7ou9ou9 el role mte3ou. Zidou bel e-mail mta3 el compte mte3ou.',
  teamEmail: 'E-mail mta3 el compte',
  teamRole: 'Role',
  teamAdd: 'Zid',
  teamAdded: 'Membre tzed.',
  teamUpdated: 'Role tbaddel.',
  teamRemove: 'Na77i',
  teamRemoved: 'Membre tna77a.',
  teamEmpty: 'Ma fammech membre tawa : ken compte patron 3andou accès.',
  event_reset: 'Rja3 lel validation',
  actionValidate: 'Validi ({percent} %)',
  actionValidateChanges: 'Validi el tbdil',
  actionPublish: 'Onchor',
  actionFix: 'Sale7',
  actionComplete: 'Kammel',
  actionHint: 'Y7ell el fiche : el parties bech tvalidiha wa7da wa7da, ba3d tonchor.',
  completenessFull: 'Kemla',
  completenessPercent: 'Données {percent} %',
  completenessMissing: 'Na9es : {list}',
  completenessTitle: 'Kmel el données',
  completenessHint: 'Kol chay ynajem yet3abba (loughat ekhtiyariya, vidéo, astuce…), 7atta ba3d el validation.',
  filterToEnrich: 'Lezem tkammel',
  sortLabel: 'Rattab',
  sortStatus: 'Bel 7ala',
  sortName: 'Bel esm',
  sortCompleteness: 'Elli na9sin lowlin',
  recipesListHint: 'El makla ma tban fel site ken ba3d ma tetvalida w tetnchor.',
  ingredientsListHint: 'El ingrédient ma ybanech fel site ken ba3d ma yetvalida w yetnchor.',
  resetTitle: 'Rajja3 el maklet lkol lel validation',
  resetHint:
    'Kol makla tebda men jdid : el parties lkol lezem tetvalida w tetna7a mel site 7atta tetnchor. El contenu w el historique yob9aw.',
  resetButton: 'Rajja3 kol chay lel validation',
  resetConfirm:
    '{count} makla bech yarj3ou « lel validation » w yetna7aw mel site : el site ma ywarri ken el maklet elli tonchorha. Nkamlou ?',
  resetDone: '{count} makla rj3ou lel validation, menhom {offline} tna7aw mel site.',
  resetFailed: '{failed} makla ma t3addech : 3awed bech nkammlouhom.',
  reviewOnlineNoCopy: 'Fel ligne w validée : ma famma chay. Ay tbdil yet3adda bel validation.',
  searchRecipes: 'Lawwej 3la makla b esmha…',
  duplicateRecipe: 'Doubli : makla jdida men hedhi',
  searchIngredients: 'Lawwej 3la ingrédient…',
  ingFixedPrice: 'Soum thabet (min = max)',
  ingUnusedFilter: 'Fi 7atta makla',
  ingUnitCheck: 'Unité lezem tetchecka',
  allCategories: 'Kol el catégories',
  ingSavePrices: 'Sajjel el as3ar ({count})',
  ingAdd: 'Zid ingrédient',
  ingPriceHint: 'Soum el marché bin min w max l unité chra. Asami, taswira w catégorie : bouton el 9lam.',
  ingShown: '{shown} ingrédient men {total}',
  ingUnit: 'Unité : {unit}',
  ingUsedIn: '{count} makla',
  ingNoRecipe: '7atta makla',
  ingPriceMin: 'A9al soum l {name} bel dinar',
  ingPriceMax: 'Akther soum l {name} bel dinar',
  ingEdit: 'Baddel {name}',
  ingEditHint: 'Baddel el asami, el unité, el catégorie w el taswira',
  confirmDeleteRecipe: 'Tfasa5 « {name} » nihayan ?',
  recipeDeleted: 'El makla tfas5et',
  todoRecipesToEnrich: 'Maklet données mte3hom na9sin (loughat, vidéo, astuce…)',
  close: 'Sakker',
  cancel: 'Battel',
  save: 'Sajjel',
  categories: 'Catégories',
  categoriesHint: 'Chajrat el catégories w tawzi3',
  catRecipesTab: 'Maklet',
  catIngredientsTab: 'Ingrédients',
  catRecipesHint:
    'El makla tnajem tkoun fi barcha catégories, fi ay niveau ; fi « Chorba » ya3ni zeda fi « Ramadan ». Naw3 el makla (entrée, plat, dessert) 3la jnab.',
  catIngredientsHint:
    'Kol ingrédient fi catégorie wa7da. El catégories el asliya titbadel esmha w titna9el, ama ma titfasa5ch.',
  catAdd: 'Catégorie jdida',
  catNew: 'Catégorie jdida',
  catEmpty: 'Ma famma 7atta catégorie tawa.',
  catExpand: '7ell',
  catCollapse: 'Lamm',
  catCountHint: '{own} toul, {total} m3a el sous-catégories',
  catMissingNames: 'Esm lezem yetarjem fi el loughat hedhom',
  catMoveUp: 'Tla3',
  catMoveDown: 'Habbet',
  catAddChild: 'Zid sous-catégorie',
  catEdit: 'Baddel el catégorie',
  catDelete: 'Fasa5 el catégorie',
  catDeleteConfirm: 'Tfasa5 el catégorie « {name} » ?',
  catDeleted: 'El catégorie tfas5et.',
  catSelect: 'Ekhtar catégorie bech tchouf w tdabber chnowa fiha.',
  catErrorId: 'Identifiant mouch s7i7.',
  catErrorName: 'El esm bel fransawi lezem.',
  catErrorNameTaken: 'Famma catégorie fi nafs el niveau 3andha nafs el esm.',
  catErrorParent: 'El catégorie el oum ma 3adech mawjouda.',
  catErrorLoop: 'Catégorie ma tnajjemch temchi ta7t rou7ha wala ta7t wa7da men sous-catégories mte3ha.',
  catErrorDepth: 'Barcha niveaux : 4 akther 7aja.',
  catBlockBuiltIn: 'Catégorie asliya ma titfasa5ch (titbadel esmha wala titna9el).',
  catBlockChildren: 'Na99el wala fasa5 sous-catégories mte3ha lowel.',
  catBlockInUse: 'Mazel fiha 7wayej : na77ihom wala na99elhom lowel.',
  catBlockDenied: 'El role mte3ek ma ysa79ekch tbaddel el catégories.',
  catAssignFailed: '{failed} 7aja ma tbadlech : 3awed.',
  catAssignedRecipes: '{count} makla tbadlet : el partie « Ma3loumet w ingrédients » lezem tetvalida.',
  catAssignedIngredients: '{count} ingrédient tna9el : el catégorie mte3hom lezem tetvalida.',
  catHoldsRecipes: '{count} makla toul fi el catégorie hedhi',
  catHoldsIngredients: '{count} ingrédient fi el catégorie hedhi',
  catSubIncluded: 'el sous-catégories mte3ha ya7sbou zeda',
  catSearchRecipes: 'Lawwej 3la maklet bech tzidhom…',
  catSearchIngredients: 'Lawwej 3la ingrédients bech tna99elhom lehna…',
  catAddRecipes: 'Zid {count} makla',
  catMoveIngredients: 'Na99el {count} ingrédient lehna',
  catAssignHint:
    'El ajout yet3adda bel atelier : ken el partie « Ma3loumet w ingrédients » mta3 kol makla tarja3 lel validation.',
  catMoveHint:
    'El ingrédient 3andou catégorie wa7da : ki t7ottou lehna yetna7a mel 9dima. El partie « Catégorie w unité » tarja3 lel validation.',
  catRemoveFrom: 'Na77i {name} men el catégorie hedhi',
  catDiscard: 'Tbattel el tbdilat mta3 el catégorie hedhi ?',
  catSaved: 'El catégorie tsajlet.',
  catSavedLocal: 'Tsajlet 3al appareil hedha bark : el base ma jewbetch.',
  catName: 'Esm',
  catIcon: 'Icône',
  catParent: 'Ta7t',
  catNoParent: '— Ma famma chay (3ayla) —',
  groupByCategory: 'Jamma3 bel catégorie',
  groupLevel: 'Niveau',
  noCategory: 'Bla catégorie',
  courseLabel: 'Naw3 el makla',
  courseEntree: 'Entrée (slata, chorba, brik…)',
  courseMain: 'Plat principal',
  courseDessert: 'Dessert',
  recipeCategories: 'Catégories',
  recipeCategoriesHint: 'Cochi el catégories mta3 el makla (sous-catégorie tkaffi : el parents yetb3ouha).',
  recipeNoCategories: 'Ma famma 7atta catégorie : a3malhom fi Catégories.',
  queueGroupCategory: 'Catégorie',
  groupToDo: '{count} lezem yet3amlou',
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
  reviewBack: 'العودة إلى القائمة',
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

  event_save: 'حُفظ',
  event_approve: 'صودق عليه',
  event_reject: 'أُرجع',
  event_publish: 'نُشر',
  event_unpublish: 'سُحب من الموقع',
  event_restore: 'استُعيدت نسخة',
  event_import: 'استُورد',
  reviewCancel: 'إلغاء',
  reviewVersions: 'النسخ المنشورة',
  reviewNoVersions: 'لا توجد نسخة منشورة.',
  reviewRestore: 'استعادة',
  reviewRestoreConfirm: 'استعادة هذه النسخة ونشرها من جديد؟',
  reviewPricesSaved: 'حُفظ {count} سعر في الورشة: تجب المصادقة قبل النشر.',
  partName: 'الاسم',
  partPhoto: 'الصورة',
  partCategory: 'الصنف والوحدة',
  partPrice: 'السعر',
  ruleCategory: 'الصنف والوحدة',
  rulePrice: 'السعر (الأدنى ≤ الأقصى)',
  filterNoPhoto: 'بلا صورة',
  filterToTranslate: 'للترجمة',
  queueTitle: 'للمصادقة',
  queueHint: 'كل ما ينتظر مصادقتك، مجمّعًا',
  queueGroupBy: 'تجميع حسب',
  queueByItem: 'العنصر',
  queueByStep: 'المرحلة',
  queueByPart: 'الجزء',
  queueByLanguage: 'اللغة',
  queueByKind: 'النوع',
  queueByAuthor: 'الكاتب',
  queueCells: '{count} جزء',
  queueReview: 'مراجعة',
  queueBack: 'العودة إلى المجموعات',
  queueOpenItem: 'فتح البطاقة',
  queueSeriesDone: 'انتهت السلسلة.',
  queueEmpty: 'لا شيء ينتظر مصادقتك.',
  queueCountPending: 'أجزاء للمصادقة',
  queueCountItems: 'عناصر معنية',
  queueCountToFix: 'تحتاج تصحيحًا',
  queueCountPublishable: 'جاهزة للنشر',
  todoTitle: 'ما يجب فعله',
  todoNothing: 'لا شيء الآن.',
  todoReview: 'أجزاء للمصادقة',
  todoToFix: 'عناصر أُرجعت للتصحيح',
  todoPublishable: 'جاهزة للنشر',
  todoRecipesToTranslate: 'وصفات للترجمة',
  todoRecipesWithoutPhoto: 'وصفات بلا صورة',
  todoIngredientsUnitCheck: 'مكوّنات: وحدة أو سعر للتحقق',
  todoIngredientsWithoutPhoto: 'مكوّنات بلا صورة',
  todoIngredientsUnused: 'مكوّنات غير مستعملة في أي وصفة',
  workflowsTitle: 'مسارات المراجعة',
  workflowsHint: 'مراحل المراجعة والأدوار والفريق',
  workflowsSteps: 'المراحل',
  workflowsRoles: 'الأدوار',
  workflowsTeam: 'الفريق',
  workflowsVersion: 'المعتمد: الإصدار {version}',
  workflowsDefault: 'المعتمد: الإعدادات الافتراضية',
  workflowsIdle: 'عدّل مرحلة أو دورًا: يظهر الأثر على العناصر المنشورة قبل الحفظ.',
  workflowsNote: 'ملاحظة الإصدار (مثال: الدارجة إلزامية)',
  workflowsSave: 'حفظ',
  workflowsSaved: 'حُفظت المسارات: تنطبق على كل الفريق.',
  workflowsOpenVersion: 'فتح في المسودة',
  workflowsImpact: 'سيصبح لدى {count} عنصر منشور أجزاء إلزامية غير مصادق عليها: تبقى منشورة وتُعلَّم للمصادقة.',
  workflowsNoImpact: 'لا يتأثر أي عنصر منشور بهذه الإعدادات.',
  workflowsOptions: 'خيارات',
  workflowsSequential: 'مراحل مرتّبة: تُفتح المرحلة عند المصادقة على الأجزاء الإلزامية للمراحل السابقة',
  workflowsBatch: 'مصادقة جماعية على الأجزاء الجاهزة (مع تأكيد)',
  workflowsPartial: 'النشر دون انتظار لغة اختيارية (تحتفظ بنسختها المنشورة)',
  workflowsAddStep: 'إضافة مرحلة',
  workflowsNewStep: 'مرحلة',
  workflowsMoveUp: 'إلى الأعلى',
  workflowsMoveDown: 'إلى الأسفل',
  workflowsDeleteStep: 'حذف المرحلة',
  workflowsDeleteStepHint: 'لا يمكن حذف مرحلة فيها جزء إلزامي: انقل الجزء أولًا.',
  workflowsNoCell: 'لا يوجد جزء: اختر من الأسفل.',
  workflowsReviewers: 'يصادق عليها:',
  workflowsCells: 'الأجزاء للمصادقة',
  workflowsCellsHint: 'لكل جزء × لغة: مرحلته، وهل هو إلزامي للنشر.',
  workflowsStepOf: 'مرحلة',
  workflowsNotReviewed: '— بلا مصادقة',
  workflowsRequired: 'إلزامي',
  workflowsRuleOff: 'معطّل',
  workflowsDefaultLevel: 'افتراضي',
  permEdit: 'تعديل',
  permSubmit: 'إرسال للمصادقة',
  permReview: 'مصادقة',
  permPublish: 'نشر',
  permManageWorkflows: 'إدارة المسارات',
  permManageRoles: 'إدارة الأدوار والفريق',
  rolesMembers: '{count} عضو',
  rolesAdminHint: 'للمسؤول كل الصلاحيات ولا يمكن تعديله.',
  rolesDelete: 'حذف الدور',
  rolesInUse: 'دور مُسند لأعضاء: غيّر دورهم أولًا.',
  rolesLanguages: 'مقتصر على اللغات:',
  rolesLanguagesHint: 'دون اختيار: كل الأجزاء. وإلا فنصوص هذه اللغات فقط (مترجم).',
  rolesNewName: 'اسم الدور الجديد',
  rolesAdd: 'إضافة دور',
  teamHint:
    'يدخل العضو إلى الموقع بحسابه الخاص ثم يفتح /patron: يعمل بصلاحيات دوره. أضفه بعنوان البريد الإلكتروني لحسابه.',
  teamEmail: 'البريد الإلكتروني للحساب',
  teamRole: 'الدور',
  teamAdd: 'إضافة',
  teamAdded: 'أُضيف العضو.',
  teamUpdated: 'عُدّل الدور.',
  teamRemove: 'إزالة',
  teamRemoved: 'أُزيل العضو.',
  teamEmpty: 'لا أعضاء حاليًا: حساب المسؤول وحده له الوصول.',
  event_reset: 'أُعيد إلى المراجعة',
  actionValidate: 'مراجعة ({percent} %)',
  actionValidateChanges: 'مراجعة التعديلات',
  actionPublish: 'نشر',
  actionFix: 'تصحيح',
  actionComplete: 'إكمال',
  actionHint: 'يفتح البطاقة: الأجزاء المطلوب مراجعتها واحدًا تلو الآخر، ثم النشر.',
  completenessFull: 'مكتملة',
  completenessPercent: 'البيانات {percent} %',
  completenessMissing: 'ينقص: {list}',
  completenessTitle: 'اكتمال البيانات',
  completenessHint: 'كل ما يمكن تعبئته (اللغات الاختيارية، الفيديو، النصيحة…)، حتى بعد المراجعة.',
  filterToEnrich: 'للإثراء',
  sortLabel: 'ترتيب',
  sortStatus: 'حسب الحالة',
  sortName: 'حسب الاسم',
  sortCompleteness: 'الأقل اكتمالًا أولًا',
  recipesListHint: 'لا تظهر الوصفة على الموقع إلا بعد مراجعتها ونشرها.',
  ingredientsListHint: 'لا يظهر المكوّن على الموقع إلا بعد مراجعته ونشره.',
  resetTitle: 'إعادة كل الوصفات إلى المراجعة',
  resetHint: 'تبدأ كل وصفة من جديد: كل أجزائها تحتاج إلى مراجعة، وتُسحب من الموقع حتى نشرها. يُحتفظ بالمحتوى وبالسجل.',
  resetButton: 'إعادة الكل إلى المراجعة',
  resetConfirm: 'ستعود {count} وصفة إلى «للمراجعة» وتُسحب من الموقع: لن يعرض الموقع إلا الوصفات التي تنشرها. متابعة؟',
  resetDone: 'أُعيدت {count} وصفة إلى المراجعة، منها {offline} سُحبت من الموقع.',
  resetFailed: 'تعذّرت معالجة {failed} وصفة: أعد المحاولة لإكمالها.',
  reviewOnlineNoCopy: 'منشورة ومُراجَعة: لا شيء مطلوب. أي تعديل سيمرّ بالمراجعة.',
  searchRecipes: 'ابحث عن وصفة باسمها…',
  duplicateRecipe: 'تكرار: وصفة جديدة انطلاقًا من هذه',
  searchIngredients: 'ابحث عن مكوّن…',
  ingFixedPrice: 'سعر ثابت (الأدنى = الأعلى)',
  ingUnusedFilter: 'غير مستعمل في أي وصفة',
  ingUnitCheck: 'وحدة يجب التحقق منها',
  allCategories: 'كل الأصناف',
  ingSavePrices: 'حفظ الأسعار ({count})',
  ingAdd: 'إضافة مكوّن',
  ingPriceHint: 'سعر السوق كمجال (أدنى – أعلى) لوحدة شراء. الأسماء والصورة والصنف: زر القلم.',
  ingShown: '{shown} مكوّن معروض من {total}',
  ingUnit: 'الوحدة: {unit}',
  ingUsedIn: '{count} وصفة',
  ingNoRecipe: 'لا توجد وصفة',
  ingPriceMin: 'أدنى سعر لـ{name} بالدينار',
  ingPriceMax: 'أعلى سعر لـ{name} بالدينار',
  ingEdit: 'تعديل {name}',
  ingEditHint: 'تعديل الأسماء والوحدة والصنف والصورة',
  confirmDeleteRecipe: 'حذف «{name}» نهائيًا؟',
  recipeDeleted: 'حُذفت الوصفة',
  todoRecipesToEnrich: 'وصفات بياناتها غير مكتملة (اللغات، الفيديو، النصيحة…)',
  close: 'إغلاق',
  cancel: 'إلغاء',
  save: 'حفظ',
  categories: 'الأصناف',
  categoriesHint: 'شجرة الأصناف وتوزيع العناصر',
  catRecipesTab: 'الوصفات',
  catIngredientsTab: 'المكوّنات',
  catRecipesHint:
    'يمكن أن تكون الوصفة في عدة أصناف وعلى أي مستوى؛ وجودها في «شوربة» يضعها أيضًا في «رمضان». نوع الطبق (مقبلات، طبق رئيسي، حلويات) منفصل.',
  catIngredientsHint: 'كل مكوّن في صنف واحد. الأصناف الأصلية يمكن إعادة تسميتها ونقلها، لكن لا يمكن حذفها.',
  catAdd: 'صنف جديد',
  catNew: 'صنف جديد',
  catEmpty: 'لا توجد أصناف حاليًا.',
  catExpand: 'توسيع',
  catCollapse: 'طي',
  catCountHint: '{own} مباشرة، {total} مع الأصناف الفرعية',
  catMissingNames: 'اسم يجب ترجمته إلى هذه اللغات',
  catMoveUp: 'نقل إلى الأعلى',
  catMoveDown: 'نقل إلى الأسفل',
  catAddChild: 'إضافة صنف فرعي',
  catEdit: 'تعديل الصنف',
  catDelete: 'حذف الصنف',
  catDeleteConfirm: 'حذف الصنف «{name}»؟',
  catDeleted: 'حُذف الصنف.',
  catSelect: 'اختر صنفًا لعرض محتواه وإدارته.',
  catErrorId: 'معرّف غير صالح.',
  catErrorName: 'الاسم بالفرنسية إلزامي.',
  catErrorNameTaken: 'يوجد صنف في المستوى نفسه بهذا الاسم.',
  catErrorParent: 'الصنف الأب لم يعد موجودًا.',
  catErrorLoop: 'لا يمكن وضع صنف تحت نفسه أو تحت أحد أصنافه الفرعية.',
  catErrorDepth: 'مستويات كثيرة: 4 كحد أقصى.',
  catBlockBuiltIn: 'لا يُحذف صنف أصلي (يمكن إعادة تسميته أو نقله).',
  catBlockChildren: 'انقل أصنافه الفرعية أو احذفها أولًا.',
  catBlockInUse: 'ما زال يحتوي على عناصر: أزلها أو انقلها أولًا.',
  catBlockDenied: 'لا يسمح دورك بتعديل الأصناف.',
  catAssignFailed: 'تعذّر تحديث {failed} عنصر: أعد المحاولة.',
  catAssignedRecipes: 'حُدّثت {count} وصفة: جزء «المعلومات والمكوّنات» يحتاج إلى مراجعة.',
  catAssignedIngredients: 'نُقل {count} مكوّن: صنفها يحتاج إلى مراجعة.',
  catHoldsRecipes: '{count} وصفة مباشرة في هذا الصنف',
  catHoldsIngredients: '{count} مكوّن في هذا الصنف',
  catSubIncluded: 'أصنافه الفرعية تُحتسب له أيضًا',
  catSearchRecipes: 'ابحث عن وصفات لإضافتها…',
  catSearchIngredients: 'ابحث عن مكوّنات لنقلها إلى هنا…',
  catAddRecipes: 'إضافة {count} وصفة',
  catMoveIngredients: 'نقل {count} مكوّن إلى هنا',
  catAssignHint: 'تمرّ الإضافة بالورشة: يعود جزء «المعلومات والمكوّنات» فقط من كل وصفة إلى المراجعة.',
  catMoveHint: 'للمكوّن صنف واحد فقط: وضعه هنا يزيله من الصنف السابق. يعود جزء «الصنف والوحدة» إلى المراجعة.',
  catRemoveFrom: 'إزالة {name} من هذا الصنف',
  catDiscard: 'التخلّي عن تعديلات هذا الصنف؟',
  catSaved: 'حُفظ الصنف.',
  catSavedLocal: 'حُفظ على هذا الجهاز فقط: لم تستجب قاعدة البيانات.',
  catName: 'الاسم',
  catIcon: 'أيقونة',
  catParent: 'ضمن',
  catNoParent: '— لا شيء (عائلة) —',
  groupByCategory: 'التجميع حسب الصنف',
  groupLevel: 'المستوى',
  noCategory: 'بدون صنف',
  courseLabel: 'نوع الطبق',
  courseEntree: 'مقبلات (سلطات، شوربة، بريك…)',
  courseMain: 'طبق رئيسي',
  courseDessert: 'حلويات',
  recipeCategories: 'الأصناف',
  recipeCategoriesHint: 'حدّد أصناف الوصفة (يكفي صنف فرعي: تتبعه أصنافه الأم).',
  recipeNoCategories: 'لا توجد أصناف: أنشئها في «الأصناف».',
  queueGroupCategory: 'الصنف',
  groupToDo: '{count} قيد المعالجة',
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
  reviewBack: 'ارجع للقائمة',
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
  event_save: 'تسجّل',
  event_approve: 'تصدّق',
  event_reject: 'ترجّع',
  event_publish: 'تنشر',
  event_unpublish: 'تنحّى من الموقع',
  event_restore: 'نسخة ترجّعت',
  event_import: 'تجاب',
  reviewCancel: 'بطّل',
  reviewVersions: 'النسخ اللي تنشرو',
  reviewNoVersions: 'ما فمّاش نسخة منشورة.',
  reviewRestore: 'رجّعها',
  reviewRestoreConfirm: 'ترجّع النسخة هذي وتنشرها مرّة أخرى؟',
  reviewPricesSaved: '{count} سوم تسجّل في الورشة: لازم يتصدّق قبل ما يتنشر.',
  partName: 'الإسم',
  partPhoto: 'التصويرة',
  partPrice: 'السوم',
  rulePrice: 'السوم (الأدنى ≤ الأقصى)',
  filterNoPhoto: 'بلا تصويرة',
  filterToTranslate: 'لازم تترجم',
  queueTitle: 'للتصديق',
  queueHint: 'كل شي يستنّى تصديقك، مجمّع',
  queueGroupBy: 'جمّع حسب',
  queueByPart: 'القسم',
  queueByAuthor: 'اللي كتبها',
  queueCells: '{count} قسم',
  queueReview: 'اقرا',
  queueBack: 'ارجع للمجموعات',
  queueOpenItem: 'حلّ البطاقة',
  queueSeriesDone: 'كمّلت السلسلة.',
  queueEmpty: 'ما فمّا شي يستنّى تصديقك.',
  queueCountPending: 'أقسام للتصديق',
  queueCountItems: 'عناصر',
  queueCountToFix: 'لازم تتصلّح',
  queueCountPublishable: 'واجدين للنشر',
  todoTitle: 'شنوّة باقي',
  todoNothing: 'ما فمّا شي توّا.',
  todoReview: 'أقسام للتصديق',
  todoToFix: 'عناصر ترجّعت للتصليح',
  todoPublishable: 'واجدين للنشر',
  todoRecipesToTranslate: 'ماكلات لازم تترجم',
  todoRecipesWithoutPhoto: 'ماكلات بلا تصويرة',
  todoIngredientsUnitCheck: 'مكوّنات: وحدة ولا سوم لازم يتشاف',
  todoIngredientsWithoutPhoto: 'مكوّنات بلا تصويرة',
  todoIngredientsUnused: 'مكوّنات ما فيها حتّى ماكلة',
  workflowsVersion: 'توّا: الإصدار {version}',
  workflowsDefault: 'توّا: الإعدادات الافتراضية',
  workflowsIdle: 'بدّل مرحلة ولا دور: يبان شنوّة يتبدّل على العناصر المنشورة قبل ما تسجّل.',
  workflowsNote: 'ملاحظة الإصدار (مثلًا: الدارجة لازمة)',
  workflowsSave: 'سجّل',
  workflowsSaved: 'تسجّلو: يمشيو على الفريق الكل.',
  workflowsOpenVersion: 'حلّها في المسودّة',
  workflowsImpact: '{count} عنصر منشور يولّي فيهم أقسام لازمة موش متصدّقة: يقعدو منشورين ولازمهم تصديق.',
  workflowsNoImpact: 'حتّى عنصر منشور ما يتبدّل.',
  workflowsSequential: 'مراحل بالترتيب: المرحلة تتحلّ كي الأقسام اللازمة اللي قبلها يتصدّقو',
  workflowsBatch: 'تصديق مجمّع للأقسام الواجدين (مع تأكيد)',
  workflowsPartial: 'انشر بلا ما تستنّى لغة موش لازمة (تقعد كيف ما هي منشورة)',
  workflowsAddStep: 'زيد مرحلة',
  workflowsMoveUp: 'طلّع',
  workflowsMoveDown: 'هبّط',
  workflowsDeleteStep: 'فسّخ المرحلة',
  workflowsDeleteStepHint: 'مرحلة فيها قسم لازم ما تتفسخش: حرّك القسم قبل.',
  workflowsNoCell: 'ما فمّاش قسم: اختار من لوطا.',
  workflowsReviewers: 'يصدّق عليها:',
  workflowsCells: 'الأقسام للتصديق',
  workflowsCellsHint: 'لكل قسم × لغة: المرحلة متاعو، وكان لازم باش يتنشر.',
  workflowsNotReviewed: '— ما تتصدّقش',
  workflowsRequired: 'لازم',
  workflowsRuleOff: 'مطفي',
  permEdit: 'بدّل',
  permSubmit: 'ابعث للتصديق',
  permReview: 'صدّق',
  permPublish: 'انشر',
  permManageWorkflows: 'تصرّف في المسارات',
  permManageRoles: 'تصرّف في الأدوار والفريق',
  rolesAdminHint: 'المسؤول عندو الصلاحيات الكل وما يتبدّلش.',
  rolesDelete: 'فسّخ الدور',
  rolesInUse: 'دور عند أعضاء: بدّل دورهم قبل.',
  rolesLanguages: 'كان للغات:',
  rolesLanguagesHint: 'بلا اختيار: الأقسام الكل. وإلّا كان نصوص اللغات هاذم (مترجم).',
  rolesNewName: 'إسم الدور الجديد',
  rolesAdd: 'زيد دور',
  teamHint:
    'العضو يدخل للموقع بالحساب متاعو، وبعد يحلّ /patron: يخدم بصلاحيات الدور متاعو. زيدو بالإيمايل متاع الحساب.',
  teamEmail: 'الإيمايل متاع الحساب',
  teamAdd: 'زيد',
  teamAdded: 'العضو تزاد.',
  teamUpdated: 'الدور تبدّل.',
  teamRemove: 'نحّي',
  teamRemoved: 'العضو تنحّى.',
  teamEmpty: 'ما فمّاش أعضاء توّا: كان حساب الباترون عندو الدخول.',
  event_reset: 'رجع للمراجعة',
  actionValidate: 'صدّق ({percent} %)',
  actionValidateChanges: 'صدّق على التبديلات',
  actionPublish: 'انشر',
  actionFix: 'صلّح',
  actionComplete: 'كمّل',
  actionHint: 'يحلّ الفيش: الأجزاء اللي تصدّق عليها وحدة وحدة، بعد تنشر.',
  completenessFull: 'كاملة',
  completenessPercent: 'الداتا {percent} %',
  completenessMissing: 'ناقص: {list}',
  completenessTitle: 'كمال الداتا',
  completenessHint: 'كل شي ينجم يتعبّى (لغات اختيارية، فيديو، نصيحة…)، حتى بعد التصديق.',
  filterToEnrich: 'لازمها تتكمّل',
  sortLabel: 'رتّب',
  sortStatus: 'بالحالة',
  sortName: 'بالإسم',
  sortCompleteness: 'الناقصين الأوّلين',
  recipesListHint: 'الماكلة ما تبانش في السيت كان كي تتصدّق وتتنشر.',
  ingredientsListHint: 'المكوّن ما يبانش في السيت كان كي يتصدّق ويتنشر.',
  resetTitle: 'رجّع الماكلات الكل للتصديق',
  resetHint: 'كل ماكلة تبدى من جديد: الأجزاء الكل لازمها تتصدّق وتتنحّى من السيت حتى تتنشر. المحتوى والتاريخ يقعدو.',
  resetButton: 'رجّع كل شي للتصديق',
  resetConfirm: '{count} ماكلة باش يرجعو «للتصديق» ويتنحّاو من السيت: السيت ما يورّي كان الماكلات اللي تنشرها. نكمّلو؟',
  resetDone: '{count} ماكلة رجعو للتصديق، منهم {offline} تنحّاو من السيت.',
  resetFailed: '{failed} ماكلة ما تعدّاتش: عاود باش نكمّلوهم.',
  reviewOnlineNoCopy: 'منشورة ومتصدّقة: ما فمّا شي. أي تبديل يتعدّى بالتصديق.',
  searchRecipes: 'لوّج على ماكلة بإسمها…',
  duplicateRecipe: 'دوبلي: ماكلة جديدة من هذي',
  searchIngredients: 'لوّج على مكوّن…',
  ingFixedPrice: 'سوم ثابت (الأدنى = الأعلى)',
  ingUnusedFilter: 'في حتّى ماكلة',
  ingUnitCheck: 'الوحدة لازمها تتثبّت',
  allCategories: 'الأصناف الكل',
  ingSavePrices: 'سجّل الأسوام ({count})',
  ingAdd: 'زيد مكوّن',
  ingPriceHint: 'سوم السوق بين الأدنى والأعلى لوحدة شرا. الأسامي والتصويرة والصنف: بوتون القلم.',
  ingShown: '{shown} مكوّن من {total}',
  ingUnit: 'الوحدة: {unit}',
  ingUsedIn: '{count} ماكلة',
  ingNoRecipe: 'حتّى ماكلة',
  ingPriceMin: 'أقل سوم لـ{name} بالدينار',
  ingPriceMax: 'أكثر سوم لـ{name} بالدينار',
  ingEdit: 'بدّل {name}',
  ingEditHint: 'بدّل الأسامي والوحدة والصنف والتصويرة',
  confirmDeleteRecipe: 'تفسخ «{name}» نهائيًا؟',
  recipeDeleted: 'الماكلة تفسخت',
  todoRecipesToEnrich: 'ماكلات الداتا متاعهم ناقصة (لغات، فيديو، نصيحة…)',
  close: 'سكّر',
  cancel: 'بطّل',
  save: 'سجّل',
  categories: 'الأصناف',
  categoriesHint: 'شجرة الأصناف والتوزيع',
  catRecipesTab: 'الماكلات',
  catIngredientsTab: 'المكوّنات',
  catRecipesHint:
    'الماكلة تنجم تكون في برشا أصناف، في أي مستوى؛ في «شربة» يعني زادة في «رمضان». نوع الماكلة (مقبلات، طبق، حلو) وحدو.',
  catIngredientsHint: 'كل مكوّن في صنف واحد. الأصناف الأصليّة يتبدّل إسمها وتتنقل، أما ما تتفسخش.',
  catAdd: 'صنف جديد',
  catNew: 'صنف جديد',
  catEmpty: 'ما فمّا حتّى صنف توّا.',
  catExpand: 'حلّ',
  catCollapse: 'لمّ',
  catCountHint: '{own} طول، {total} مع الأصناف الصغار',
  catMissingNames: 'الإسم لازمو يتترجم للغات هاذم',
  catMoveUp: 'طلّع',
  catMoveDown: 'هبّط',
  catAddChild: 'زيد صنف صغير',
  catEdit: 'بدّل الصنف',
  catDelete: 'فسخ الصنف',
  catDeleteConfirm: 'تفسخ الصنف «{name}»؟',
  catDeleted: 'الصنف تفسخ.',
  catSelect: 'اختار صنف باش تشوف وتدبّر آش فيه.',
  catErrorId: 'المعرّف موش صحيح.',
  catErrorName: 'الإسم بالفرنساوي لازم.',
  catErrorNameTaken: 'فمّا صنف في نفس المستوى عندو نفس الإسم.',
  catErrorParent: 'الصنف الأم ما عادش موجود.',
  catErrorLoop: 'الصنف ما ينجمش يمشي تحت روحو ولا تحت صنف من الصغار متاعو.',
  catErrorDepth: 'برشا مستويات: 4 أكثر حاجة.',
  catBlockBuiltIn: 'الصنف الأصلي ما يتفسخش (يتبدّل إسمو ولا يتنقل).',
  catBlockChildren: 'نقّل ولا فسخ الأصناف الصغار متاعو الأوّل.',
  catBlockInUse: 'مازال فيه حوايج: نحّيهم ولا نقّلهم الأوّل.',
  catBlockDenied: 'الدور متاعك ما يسمحلكش تبدّل الأصناف.',
  catAssignFailed: '{failed} حاجة ما تبدّلتش: عاود.',
  catAssignedRecipes: '{count} ماكلة تبدّلت: جزء «المعلومات والمكوّنات» لازمو يتصدّق.',
  catAssignedIngredients: '{count} مكوّن تنقل: الصنف متاعهم لازمو يتصدّق.',
  catHoldsRecipes: '{count} ماكلة طول في الصنف هذا',
  catHoldsIngredients: '{count} مكوّن في الصنف هذا',
  catSubIncluded: 'الأصناف الصغار متاعو يتحسبو زادة',
  catSearchRecipes: 'لوّج على ماكلات باش تزيدهم…',
  catSearchIngredients: 'لوّج على مكوّنات باش تنقّلهم لهنا…',
  catAddRecipes: 'زيد {count} ماكلة',
  catMoveIngredients: 'نقّل {count} مكوّن لهنا',
  catAssignHint: 'الزيادة تتعدّى بالورشة: كان جزء «المعلومات والمكوّنات» متاع كل ماكلة يرجع للتصديق.',
  catMoveHint: 'المكوّن عندو صنف واحد: كي تحطّو هنا يتنحّى من القديم. جزء «الصنف والوحدة» يرجع للتصديق.',
  catRemoveFrom: 'نحّي {name} من الصنف هذا',
  catDiscard: 'تبطّل التبديلات متاع الصنف هذا؟',
  catSaved: 'الصنف تسجّل.',
  catSavedLocal: 'تسجّل على الجهاز هذا برك: القاعدة ما جاوبتش.',
  catName: 'الإسم',
  catIcon: 'أيقونة',
  catParent: 'تحت',
  catNoParent: '— حتّى شي (عايلة) —',
  groupByCategory: 'جمّع بالصنف',
  groupLevel: 'المستوى',
  noCategory: 'بلا صنف',
  courseLabel: 'نوع الماكلة',
  courseEntree: 'مقبلات (سلاطة، شربة، بريك…)',
  courseMain: 'الطبق الرئيسي',
  courseDessert: 'حلو',
  recipeCategories: 'الأصناف',
  recipeCategoriesHint: 'علّم على الأصناف متاع الماكلة (صنف صغير يكفي: الأمّهات يتبعوه).',
  recipeNoCategories: 'ما فمّا حتّى صنف: اعملهم في «الأصناف».',
  queueGroupCategory: 'الصنف',
  groupToDo: '{count} لازمهم يتعملو',
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
