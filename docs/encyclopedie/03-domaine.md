# 03 · Domaine métier (`src/core`)

TypeScript pur, sans React ni Firebase ni navigateur. Chaque module expose son API dans `index.ts`.

## `catalog` : recettes et ingrédients

**Types** (`catalog/types.ts`)

- `Ingredient` : id (`ing_tomate`), trois noms, catégorie (`vegetables`, `meats`, `fish`,
  `dairy_eggs`, `grains_pasta`, `spices_condiments`, `canned_pantry`, `fruits`, `other`),
  unité d'achat et prix d'une unité d'achat en DT (`default_price_tnd`).
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

**Catégories** (`catalog/course.ts`) : `normalizeCategory` convertit les anciennes valeurs
(`express`, `kaskrout`, `soupe`) vers les trois catégories ; `isExpress` = 20 minutes ou moins.

**Catalogue intégré et migrations** (`catalog/seed/`, `catalog/migrations.ts`)

- Le catalogue livré avec l'application : 119 recettes (tunisiennes, internationales, desserts)
  et leurs ingrédients. Un test (`seed/catalog.test.ts`) vérifie sa cohérence.
- `SEED_VERSION` : à augmenter quand le catalogue intégré change. Au prochain lancement, les
  utilisateurs reçoivent les nouvelles recettes et les rôles manquants, sans perdre les
  modifications du patron (`migrateRecipes`, `mergeMissingById`).

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

## `shared`

- `text.ts` : `normalizeText` (minuscules, sans accents, singulier : « Œufs » → « oeuf »),
  `findByName` (recherche d'ingrédient par nom, utilisée par le scan photo), `slugify`.
- `youtube.ts` : reconnaissance et nettoyage des liens YouTube (miniature, lecteur intégré).
- `collections.ts` : `toggleInList`, `upsertById`.
- `id.ts` : `createId(prefix)`.
- `language.ts` : `Language` (`derja`, `fr`, `ar`).
