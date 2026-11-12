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
générales. Les règles par défaut sont dans `DEFAULT_SUBSTITUTION_RULES` ; le patron peut les
modifier (voir [04](04-moteur-matching.md)).

**Validation** (`catalog/validation.ts`, testé) : règles appliquées avant d'enregistrer ce que le
patron a saisi.

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
sont lues par `parseMeasure` : masses (g, kg, « 100 g », « paquet (500g) »), volumes (ml, cl, L,
« boîte (400 ml) ») et unités comptées (pièce = pièces, botte…) ; une parenthèse sans quantité est un
commentaire (« pièces (durs) »). Une quantité dans une autre sorte d'unité (cuillères d'un ingrédient
vendu au kg) n'est pas comptée et listée dans `unpriced` : la suggestion dit combien d'ingrédients
sont chiffrés.

**Utilisation** (`catalog/usage.ts`, testé) : `countIngredientUsage` (nombre de recettes par
ingrédient, remplaçants compris) et `findDuplicateIngredient` (même nom français, casse et accents
ignorés).

**Catégories** (`catalog/course.ts`) : `normalizeCategory` convertit les anciennes valeurs
(`express`, `kaskrout`, `soupe`) vers les trois catégories ; `isExpress` = 20 minutes ou moins.

**Catalogue intégré et migrations** (`catalog/seed/`, `catalog/migrations.ts`)

- Le catalogue livré avec l'application : 119 recettes (tunisiennes, internationales, desserts)
  et leurs ingrédients. Un test (`seed/catalog.test.ts`) vérifie sa cohérence.
- Le catalogue intégré n'est affiché que tant que la base n'a pas répondu (ou si elle est vide) : la base
  est la source de vérité. Pour publier une recette ajoutée au catalogue intégré : « Envoyer vers le
  cloud » dans /patron. (`SEED_VERSION` / `mergeMissingById` ne servent plus à la copie de l'appareil.)
- Toute donnée venue de l'extérieur (base, copie de l'appareil, sauvegarde JSON) est relue par
  `parseStoredRecipe(s)` / `parseStoredIngredient(s)` (`catalog/validation.ts`) : forme vérifiée,
  éléments invalides ignorés, puis mise à jour (`migrateRecipes`, `migrateIngredient`).
- `migrateIngredient(s)` : l'ancien prix unique `default_price_tnd` devient une fourchette, une
  fourchette inversée est remise dans l'ordre, une photo vide est retirée. **Prix de marché** : chaque
  ingrédient intégré a une vraie fourchette (environ −15 % / +20 % autour de l'ancien prix unique) ; un
  ingrédient intégré encore à prix unique compris dans cette fourchette la reçoit à la lecture, un prix
  fixé par le patron hors de la fourchette est gardé. Rien à faire dans la base : la conversion se fait
  à la lecture, puis le document est réécrit au prochain enregistrement par le patron.
- **Coût d'une recette** (`catalog/costEstimate.ts`) : `recipeCostRange` = somme des fourchettes de prix
  des ingrédients (quantité convertie dans l'unité d'achat, ingrédients facultatifs exclus) ;
  l'estimation saisie par le patron (`estimated_cost_tnd`) ne sert que si aucun ingrédient n'est chiffrable.
  Affiché partout avec `formatPriceRange` (carte, fiche, partage, menu, backoffice) ; calculé une fois par
  version de recette et de liste d'ingrédients (`getRecipeCost`, `src/app/ContainerContext.tsx`).

## `sync` : synchronisation des collections partagées

`Versioned` (`id`, `revision`, `deleted`), `applyChanges` (applique en une passe les éléments changés,
les marques de suppression et les ids retirés, sans modifier la liste reçue), `latestRevision`,
`isDeletionMarker`, `withoutDeleted`. Testé, y compris sur 20 000 éléments. Voir
[05 Application et données](05-application-donnees.md).

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

## `grocery` : liste de courses

- `buildGroceryListFromPlan` : tous les ingrédients des plats du menu, quantités additionnées par ingrédient.
- `addGroceryItems`, `toggleGroceryItem`, `clearCheckedGroceryItems` : fonctions pures (ids injectables).

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
- `language.ts` : `Language` (`derja`, `fr`, `ar`).
- `localized.ts` : `LocalizedText` (`{ fr, derja, ar }`) et `pickLocalized(language, text)`, qui
  rend le texte de la langue choisie, sinon le français, sinon la langue restante. C'est la seule
  règle de choix de langue : l'interface l'utilise pour tous les textes du catalogue (noms,
  descriptions, étapes, astuce du chef).
