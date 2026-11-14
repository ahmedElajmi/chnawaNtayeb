# 03 · Domaine métier (`src/core`)

TypeScript pur, sans React ni Firebase ni navigateur. Chaque module expose son API dans `index.ts`.

## `catalog` : recettes et ingrédients

**Types** (`catalog/types.ts`)

- `Ingredient` : id (`ing_tomate`), trois noms, catégorie (`vegetables`, `meats`, `fish`,
  `dairy_eggs`, `grains_pasta`, `spices_condiments`, `canned_pantry`, `fruits`, `other`),
  unité d'achat, **fourchette de prix** d'une unité d'achat en DT (`price_min_tnd` ≤ `price_max_tnd` :
  les prix du marché varient ; même valeur deux fois = prix fixe) et **photo** facultative (`image_url`,
  lien https).
- `PriceRange` : `{ min, max }` en DT. Aides (`catalog/pricing.ts`, testé) : `ingredientPriceRange`,
  `addPriceRanges`, `roundPriceRange` (au dixième), `isFixedPrice`, `ZERO_PRICE`.
- `Recipe` : id, `slug` (adresse `/recette/<slug>`), trois noms et descriptions, image, temps de
  préparation et cuisson, portions de base, coût estimé, catégorie (`entree`, `plat_principal`,
  `dessert`), type de cuisine, difficulté, ingrédients, étapes, astuce du chef, `is_published`,
  `is_healthy`, `video_url` (YouTube, facultatif).
- `RecipeIngredient` : ingrédient, quantité pour les portions de base, unité, `is_optional`,
  **rôle** (`key`, `secondary`, `staple`) et substitutions propres à la recette.

**Rôles** (`catalog/roles.ts`) : chaque ingrédient d'une recette a un rôle explicite. Pour les
données anciennes ou saisies sans rôle, `inferRole` le déduit : épices et condiments → `staple`,
viandes, poissons, pâtes, riz, semoule, frik… → `key`, le reste → `secondary`.

**Substitutions** (`catalog/substitutions.ts`) : des règles de données « X peut être remplacé par Y »,
avec contexte :

- `notForCourses` : pas pour certaines catégories (l'huile d'olive ne remplace pas le beurre d'un dessert) ;
- `notWhenKey` : pas quand l'ingrédient est l'ingrédient principal (le concentré ne remplace pas
  les tomates fraîches d'une salade, mais oui dans une sauce).

Les substitutions propres à une recette (`RecipeIngredient.substitutes`) passent avant les règles
générales. Les règles par défaut sont dans `DEFAULT_SUBSTITUTION_RULES` ; le super admin peut les
modifier (voir [04](04-moteur-matching.md)).

**Validation** (`catalog/validation.ts`, testé) : règles appliquées avant d'enregistrer ce que le
super admin a saisi.

- `validateRecipe` : nom français obligatoire, au moins un ingrédient, au moins une étape écrite en
  français. Les étapes vides sont retirées, les autres renumérotées de 1 à n (`normalizeSteps`), les
  textes nettoyés. Derja et arabe peuvent rester vides : l'affichage reprend alors le français.
- Chaque refus porte le champ concerné (`field` : `name`, `ingredients`, `steps`, `video`, `price`,
  `unit`, `photo`) : l'éditeur montre l'erreur sur ce champ et défile jusqu'à lui.
- `parseStoredRecipe` : relit une recette venue de l'extérieur (brouillon gardé sur l'appareil,
  fichier de sauvegarde) ; `null` si ce n'est pas une recette (textes, nombres, listes d'ingrédients et
  d'étapes vérifiés).
- `validateIngredient` : nom français et unité obligatoires, `0 ≤ prix min ≤ prix max`, photo vide
  (champ retiré) ou lien `https://` complet (`parseImageUrl`) ; un nom derja ou arabe vide prend le
  nom français.

**Coût suggéré** (`catalog/costEstimate.ts`, testé) : `suggestRecipeCost` additionne, pour chaque
ingrédient non facultatif, (quantité convertie en unités d'achat) × (fourchette de prix). Les unités
sont lues par `parseMeasure` (désormais dans `@/core/units`, réexporté ici) : masses (g, kg, « 100 g »,
« paquet (500g) »), volumes (ml, cl, L, « boîte (400 ml) ») et unités comptées (pièce = pièces,
botte…) ; une parenthèse sans quantité est un commentaire (« pièces (durs) »). Une quantité dans une
autre sorte d'unité (cuillères d'un ingrédient vendu au kg) n'est pas comptée et listée dans
`unpriced` : la suggestion dit combien d'ingrédients sont chiffrés.

**Utilisation** (`catalog/usage.ts`, testé) : `countIngredientUsage` (nombre de recettes par
ingrédient, remplaçants compris) et `findDuplicateIngredient` (même nom français, casse et accents
ignorés).

**Santé du catalogue** (`catalog/health.ts`, testé) : `catalogHealth` compte sur les listes entières ce
qui reste à faire (recettes à traduire ou sans photo, ingrédients sans photo, à l'unité douteuse, dans
aucune recette) ; `recipeNeedsTranslation` / `ingredientNeedsTranslation` (un texte écrit en français
mais vide dans une autre langue ou variante).

**Catégories** (`catalog/course.ts`) : `normalizeCategory` convertit les anciennes valeurs
(`express`, `kaskrout`, `soupe`) vers les trois catégories ; `isExpress` = 20 minutes ou moins.

**Catalogue intégré et migrations** (`catalog/seed/`, `catalog/migrations.ts`)

- Le catalogue livré avec l'application : 119 recettes (tunisiennes, internationales, desserts)
  et leurs ingrédients. Un test (`seed/catalog.test.ts`) vérifie sa cohérence.
- Le catalogue intégré n'est affiché que tant que la base n'a pas répondu (ou si elle est vide) : la base
  est la source de vérité. Pour publier une recette ajoutée au catalogue intégré : « Envoyer vers le
  cloud » dans /admin. (`SEED_VERSION` / `mergeMissingById` ne servent plus à la copie de l'appareil.)
- Toute donnée venue de l'extérieur (base, copie de l'appareil, sauvegarde JSON) est relue par
  `parseStoredRecipe(s)` / `parseStoredIngredient(s)` (`catalog/validation.ts`) : forme vérifiée,
  éléments invalides ignorés, puis mise à jour (`migrateRecipes`, `migrateIngredient`).
- `migrateIngredient(s)` : l'ancien prix unique `default_price_tnd` devient une fourchette, une
  fourchette inversée est remise dans l'ordre, une photo vide est retirée. **Prix de marché** : chaque
  ingrédient intégré a une vraie fourchette (environ −15 % / +20 % autour de l'ancien prix unique) ; un
  ingrédient intégré encore à prix unique compris dans cette fourchette la reçoit à la lecture, un prix
  fixé par le super admin hors de la fourchette est gardé. Rien à faire dans la base : la conversion se fait
  à la lecture, puis le document est réécrit au prochain enregistrement par le super admin.
- **Coût d'une recette** (`catalog/costEstimate.ts`) : `recipeCostRange` = somme des fourchettes de prix
  des ingrédients (quantité convertie dans l'unité d'achat, ingrédients facultatifs exclus) ;
  l'estimation saisie par le super admin (`estimated_cost_tnd`) ne sert que si aucun ingrédient n'est chiffrable.
  Affiché partout avec `formatPriceRange` (carte, fiche, partage, menu, backoffice) ; calculé une fois par
  version de recette et de liste d'ingrédients (`getRecipeCost`, `src/app/ContainerContext.tsx`).

## `sync` : synchronisation des collections partagées

`Versioned` (`id`, `revision`, `deleted`), `applyChanges` (applique en une passe les éléments changés,
les marques de suppression et les ids retirés, sans modifier la liste reçue), `latestRevision`,
`isDeletionMarker`, `withoutDeleted`. Testé, y compris sur 20 000 éléments. Voir
[05 Application et données](05-application-donnees.md).

## `review` : workflow de validation du contenu

Règles pures du workflow de validation (plan complet : [14](14-refonte-backoffice.md)). Utilisées par
l'atelier (`ReviewBoard`, voir [05](05-application-donnees.md)) ; les écrans viennent ensuite.

- `parts.ts` : les **parties** de chaque type de contenu (`REVIEW_KINDS` : recette, ingrédient) et la
  **grille** partie × langue (`reviewCells`). Une partie de texte a une case par langue ou variante
  (`steps:derja`, colonnes tirées de `LANGUAGES`), les autres une seule case (`media`, `details`,
  `price`). `cellHashes` donne l'**empreinte** de chaque case : une case ne lit que ses données (la case
  « Étapes × Derja » ne lit que les textes derja des étapes). Modifier une langue ne change donc que la
  case de cette langue, et ajouter une étape vide ne change pas les autres langues. `copyCell` reprend une
  case depuis la version en ligne (publication partielle).
- `hash.ts` : `contentHash` (JSON aux clés triées, deux passes FNV-1a).
- `rules.ts` : les **contrôles qualité** de chaque partie (`reviewRules`), avec un niveau par défaut
  (bloquant, conseillé) que le workflow peut changer ou désactiver ; `checkCell`. Recette : nom,
  description, photo, vidéo (conseillé), ingrédients connus et publiés, ingrédient clé, temps et portions,
  étapes (en français au moins une ; dans une autre langue autant qu'en français), astuce (conseillé).
  Ingrédient : nom, catégorie et unité, prix, photo (conseillé).
- `decisions.ts` : la **décision** du validateur sur une case (`approved` / `rejected` + note), liée à
  l'empreinte de ce qu'il a vu ; `cellState` en tire l'état : `incomplete`, `ready`, `approved`,
  `changed` (validée puis modifiée), `to_fix` (renvoyée, pas encore modifiée) ; `parseCellDecisions`
  relit ce qui vient de la base.
- `workflow.ts` : `WorkflowDefinition` (étapes et leurs cases, cases obligatoires, niveau des contrôles,
  étapes ordonnées ou libres, validation groupée, publication partielle des langues) ;
  `defaultWorkflow` (recette : nom et description, médias, infos et ingrédients, étapes, astuce, puis
  une étape par langue) ; `resolveWorkflow` relit un document de la base (l'inconnu est ignoré avec un
  avertissement, le nom français reste toujours obligatoire) ; `validateWorkflow` refuse un workflow
  incohérent avant son enregistrement.
- `roles.ts` : rôles et droits (`canPerform`, `canReviewCell`) ; l'administrateur a tous les droits et
  `resolveRoles` le remet toujours ; un rôle peut être limité à des langues (traducteur).
- `progress.ts` : `reviewSnapshot` (état de chaque case, pourcentage de validation, complétude,
  publiable, étape en cours, case où reprendre), `isStepOpen` (étapes ordonnées), `pendingCells`,
  `batchApprovableCells`, `composePublication` (version à publier : cases validées, les autres reprises
  de la version en ligne).
- `queue.ts` : file « À valider » (`groupQueue` par élément, étape, partie, langue, type ou auteur, avec
  des totaux sur toute la file ; `queueCounts`) et `workflowImpact` (éléments en ligne qu'un nouveau
  workflow rendrait à revalider).
- `workCopy.ts` : la **copie de travail** (`WorkCopy` : contenu, décisions par case, empreintes de la
  version en ligne, historique borné à 50 événements, `written_at` posé à chaque écriture pour refuser
  une modification qui ne part pas de la copie enregistrée) ; `parseWorkCopy` (contenu relu par
  `parseStoredRecipe` / `parseStoredIngredient`), `workCopyFromPublished` (élément déjà en ligne : toutes
  ses cases validées), `newWorkCopy`, `hasPendingChanges`, `PublishedVersion` et `parsePublishedVersion`.
- `settings.ts` : `ReviewSettings` (workflows de chaque type + rôles, un seul document),
  `resolveReviewSettings` (toujours utilisable, avec ce qui a été réparé), `validateReviewSettings`.

- `team.ts` : `TeamMember` (rôle + `can_publish` / `can_manage`, les deux droits que les règles de la
  base lisent, recopiés depuis le rôle), `memberRights`, `membersToRefresh`, `roleOfMember` (le rôle
  administrateur ne se donne jamais à un membre), `parseTeamMember`.
- `progress.ts` donne aussi `itemStatus` (statut affiché dans les listes) et `incompleteRequired`.

- `progress.ts` : `contentCompleteness` = complétude des **données**, distincte de la validation : toutes
  les cases (langues facultatives comprises) et tous les contrôles non désactivés (conseils compris) ;
  renvoie le pourcentage et la liste de ce qui manque. « Ingrédients en ligne » n'en fait pas partie.
- `workCopy.ts` : `workCopyForReview` (aucune décision, plus rien en ligne, événement `reset`).
- La case « Infos et ingrédients » d'une recette contient aussi ses catégories gérées (`category_ids`) :
  un workflow déjà enregistré en base n'a donc pas à connaître une nouvelle case.

## `categories` : catégories gérées

- `ContentCategory` : `parent_id` (null = famille), nom localisé (`name_<langue>`), `order` parmi ses
  sœurs, `icon`, `built_in`. Ids `^[a-z0-9_-]{1,64}$`.
- `buildCategoryTree` : arbre construit une fois (racines, `byId`, ordre, profondeur, chemin) ; un
  parent inconnu ou une boucle → la catégorie devient une racine (rien n'est perdu).
- `categoryWithAncestors`, `categoryWithDescendants`, `expandCategories`, `categoryPath`.
- `validateCategory` (nom français, unique parmi les sœurs, parent existant, pas de boucle, profondeur
  de toute la branche ≤ `MAX_CATEGORY_DEPTH`), `deletionBlocker`, `possibleParents`.
- `categoryUsage` (propres / avec les sous-catégories, chaque élément compté une fois),
  `groupByCategory` (à un niveau donné ; un élément dans chacun de ses groupes ; « sans catégorie » en
  dernier).
- `parseStoredCategories`, `withBuiltInCategories` (catégories d'origine complétées par la base),
  `BUILT_IN_INGREDIENT_CATEGORIES`.
- Côté catalogue : `Recipe.category_ids` (normalisé par `normalizeCategoryIds`), `Ingredient.category`
  = id d'une catégorie (une valeur illisible devient `other`). `MealCategory` reste le type de plat.
- Moteur : `FilterOptions.categoryIds` (une catégorie et ses sous-catégories) ; `fridgeSuggestions`
  (aucune suggestion quand le frigo est vide : toutes les listes comptent de la même façon).

## `search` : recherche texte

`normalizeSearchText` / `searchTerms` (s'appuie sur `normalizeText` sans le modifier : harakat, tatweel,
formes d'alef, ة, ى, article arabe ; derja latine : chiffres arabizi 3 / 7 / 9 / 5 / 2, q → k, ou / o → u,
sh → ch, lettres doublées), `recipeSearchDocument` / `ingredientSearchDocument` (toutes les langues et
variantes via `localizedValues`), `SEARCH_FIELD_WEIGHTS`, `sortBySearchScore`, `planIndexUpdate`.
Voir [12 Recherche](12-recherche.md).

## `matching` : le moteur de suggestions

Voir la page dédiée [04 Moteur de matching](04-moteur-matching.md).

## `planning` : menu de la semaine

- `DayPlan` : un jour, un déjeuner et un dîner ; chaque repas (`MealSlot`) a un plat principal
  obligatoire, une entrée et un dessert facultatifs.
- `generateWeekPlan` : menu automatique (avec ou sans entrées/desserts, healthy ou non), sans
  répéter une recette avant d'avoir utilisé toutes les autres ; aléatoire injectable pour les tests.
- `assignToSlot` / `removeFromSlot` : pas d'entrée ni de dessert sans plat ; retirer le plat vide le repas.
- `migrateDayPlan` : convertit l'ancien format (une recette par repas).
- `DEFAULT_WEEKLY_PLAN` : menu proposé à un nouvel utilisateur.

## `units` : unités et leurs descriptions

- **Unités comparables** (`units/units.ts`, testé) : `parseMeasure` lit une unité (masse g / kg / gr,
  volume ml / cl / dl / l / litre(s), quantité entre parenthèses « paquet (500g) », chose comptée
  « pièce », « botte », « c.à.s »…). `getUnitFamily` donne la famille (masse, volume, comptée) ;
  `getCompatibleUnits` les alias de la même famille (les choses comptées restent seules : pièce ≠
  botte) ; `areUnitsCompatible` dit si deux quantités peuvent s'additionner (casse, espaces et
  pluriels français ignorés ; une unité incomparable ne vaut qu'elle-même, écrite pareil) ;
  `convertQuantity` convertit une quantité (1500 g → 1,5 kg, arrondi à 3 décimales) ou rend `null`.
- **Descriptions** (`units/info.ts`, testé) : `UnitInfo` (`label`, **`kind`** — ce que mesure
  l'unité : `mass`, `volume`, `count` ou `other` (`UNIT_KINDS`) —, `description_fr` obligatoire,
  `description_derja` / `description_ar` toujours stockées, `description_derja_ar` facultative,
  `revision`). L'id est le **libellé slugifié** (`unitIdFromLabel` : « c.à.s » → `c-a-s`,
  `UNIT_ID_PATTERN`), la clé de recherche ignore casse et espaces (`unitLookupKey`).
  `parseStoredUnitInfo(s)` relit ce qui vient de l'extérieur (id, libellé et description française
  obligatoires, marques de suppression écartées) : un document ancien sans `kind` est **réparé à la
  lecture** — `inferUnitKind` le déduit du libellé comme le moteur le lit (« kg » → masse, « ml » →
  volume, « botte » → comptée, « c.à.s / bol » → `other`). `validateUnitInfo` vérifie une saisie du
  backoffice (libellé unique, kind valide, description française requise), `unitDescriptionIndex`
  indexe par libellé et id. **Aucune description par défaut dans le code** : une unité absente de la
  base reste affichée nue.
- **Unités proposées à la saisie** : `BUILTIN_UNIT_OPTIONS` — les 17 unités courantes (g, kg, ml, cl,
  L, pièce, c.à.s, c.à.c, pincée, gousses, botte, boîte, sachet, paquet, tranche, feuilles, verre),
  chacune avec son kind déduit — et `unitOptionsFromInfos`, qui classe un registre (masse et volume
  d'abord : elles convertissent, puis libellé). Le registre du backoffice fait foi ; les unités
  intégrées servent de repli quand il est encore vide (voir
  [05 Application et données](05-application-donnees.md), `CatalogStore.unitOptions()`).

## `grocery` : listes de courses

- **Listes nommées** (`grocery/lists.ts`, testé) : `GroceryList` (`id`, `name`, `items`, `note`
  libre, `spent_tnd` — montant réellement dépensé, null tant que non saisi). La cuisine peut garder
  **plusieurs listes de courses**. `createGroceryList` (nom tronqué à 80 caractères ; un nom vide
  tombe sur `DEFAULT_GROCERY_LIST_NAME` « Mes courses »), `renameGroceryList`, `deleteGroceryList`
  (jamais la dernière : il reste toujours au moins une liste ; la liste active supprimée cède à la
  première restante), `duplicateGroceryList` (copie profonde des articles, ids neufs, tout décoché,
  note gardée, dépense remise à zéro : une liste pour refaire les courses) et `groceryListFromItems`
  (recrée une liste depuis des articles bruts, sans toucher l'historique : dupliquer une course
  archivée). L'ordre des listes n'est **jamais retrié** : la nouvelle va à la fin, chaque mutation ne
  touche que sa liste ; `resolveActiveGroceryListId` ramène à la première liste quand l'id actif
  n'existe plus (suppression, sync, migration).
- `buildGroceryListFromPlan` : tous les ingrédients des plats du menu, quantités additionnées par ingrédient.
- `addGroceryItems` : un article qui retrouve une ligne existante — **même ingrédient**
  (`ingredient_id`) ou même nom pour un article libre — dans une **unité compatible** (g avec kg,
  ml avec l…) y est **fusionné** : la quantité est convertie dans l'unité de la ligne, additionnée,
  et la ligne est **décochée** (quelque chose à acheter vient d'être ajouté). La ligne garde son id,
  son nom, son unité, sa catégorie et son drapeau « article libre ». Unités incompatibles (500 g et
  2 pièces) ou deux choses comptées différentes (tête et gousse d'ail) : **deux lignes**. Un article
  du catalogue porte `ingredient_id` et `category` (bon rayon, plus `is_custom`) ; un article libre
  reste `is_custom`.
- `changeGroceryItemUnit` : passe un article à une autre unité compatible (g → kg, ml → l), quantité
  convertie ; `null` — liste intacte — si l'article n'existe pas ou si l'unité est incompatible.
- `toggleGroceryItem`, `clearCheckedGroceryItems` : fonctions pures (ids injectables).

## `preferences`

`UserPreferences` (langue, portions, mode clair/sombre/système, thème, placard), valeurs par défaut
(`DEFAULT_PREFERENCES`, placard par défaut `DEFAULT_PANTRY_STAPLES`) et `normalizePreferences`
qui répare les préférences anciennes ou invalides.

## `theme` : thèmes visuels

- `AppTheme` : couleurs claires et sombres (16 couleurs `#RRGGBB`), police d'affichage, forme
  des cartes, motif décoratif, publication.
- Thèmes intégrés : **Classique** (par défaut) et **Fkhar**.
- `validation.ts` : validation stricte (aucune CSS ni URL arbitraire), contraste des couleurs,
  registre des polices, conversion en variables CSS.

## `backup` : fichiers de sauvegarde

`parseBackup` (testé) relit un fichier exporté par le backoffice. Chaque section passe par les règles
du domaine : recettes (`parseStoredRecipe` puis `migrateRecipes` : rôles, catégories, **les trois
langues des noms, descriptions, étapes et astuces conservées**), ingrédients (forme vérifiée puis
`migrateIngredients` : ancien prix unique → fourchette, photo), menu, favoris, liste de courses. Les
éléments invalides sont ignorés et comptés (`skipped`) ; `null` si le fichier n'est pas une sauvegarde.

## `shared`

- `text.ts` : `normalizeText` (minuscules, sans accents, singulier : « Œufs » → « oeuf »),
  `findByName` (recherche d'ingrédient par nom, utilisée par le scan photo), `slugify`.
- `youtube.ts` : reconnaissance et nettoyage des liens YouTube (miniature, lecteur intégré).
- `collections.ts` : `toggleInList`, `upsertById`.
- `id.ts` : `createId(prefix)`.
- `language.ts` : `Language` (`fr`, `ar`, `derja`, `derja_ar`) et `LANGUAGES`, la seule liste des
  langues et variantes (famille, sens d'écriture, `lang`, tri, ordre de repli, langue obligatoire),
  `SELECTOR_ORDER`, `EDITING_ORDER`, `isLanguage`.
- `localized.ts` : `LocalizedText` (`fr`, `derja`, `ar` + variantes facultatives), `pickLocalized(language,
text)` (langue choisie, sinon sa liste de repli), `localizedField` / `withLocalizedField` (champs
  `<champ>_<langue>` d'un objet), `trimLocalized`, `hasAnyText`. C'est la seule
  règle de choix de langue : l'interface l'utilise pour tous les textes du catalogue (noms,
  descriptions, étapes, astuce du chef).
