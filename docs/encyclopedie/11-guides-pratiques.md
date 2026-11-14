# 11 · Guides pratiques

Chaque guide se termine par `npm run check`.

## Ajouter une recette au catalogue intégré

1. Ajouter la recette dans `src/core/catalog/seed/` (tunisienne, internationale ou dessert),
   avec un **rôle sur chaque ingrédient** (`key`, `secondary`, `staple`) et un `slug` unique.
2. Ajouter les ingrédients nouveaux dans `seed/initialIngredients.ts`.
3. Après le déploiement, « Envoyer vers le cloud » dans /admin la publie (la base est la référence).
4. Ajouter un scénario du chef si la recette doit sortir pour un frigo précis.

Une recette ajoutée depuis le backoffice n'a besoin d'aucune de ces étapes.

## Ajouter une collection partagée (ex. textes du CMS)

Un seul mécanisme pour toutes les données partagées (voir [05](05-application-donnees.md)) :

1. Domaine : le type (avec `revision?`) et sa fonction de lecture `parse…(raw: unknown[])` dans `src/core`.
2. Application : un `SyncedCollectionStore<T>` (rien à écrire, il est générique).
3. Infrastructure : `createFirestoreSharedCollection<T>('<collection>')` et une copie
   `createIndexedDbCollectionCache` (ajouter le nom dans `COLLECTIONS`, monter `DB_VERSION`).
4. `firestore.rules` : lecture, écriture super admin avec `isVersionedWrite`, schéma strict ; `npm run deploy:rules`.
5. Brancher dans `src/app/container.ts`, démarrer le suivi dans `App.tsx`.

## Ajouter un écran

1. Ajouter l'adresse dans `src/shared/paths.ts`.
2. Créer `src/features/<écran>/<Écran>Page.tsx` (et `components/` si besoin) ; lire les données
   avec `useCatalog()`, `useKitchen()`…, sans logique métier dans le composant.
3. Déclarer la route dans `src/app/AppRoutes.tsx` ; ajouter le lien dans `Header` et `BottomNav` si besoin.
4. Textes : ajouter les clés dans chaque langue de `src/shared/i18n/translations.ts` **et** dans
   `derjaArabic.ts` (derja en lettres arabes, obligatoire : le dictionnaire est complet, vérifié par
   `translations.test.ts`) ; l'arabe littéraire ne contient aucun mot de derja.
5. Vérifier l'affichage à 375 px et 320 px de large.
6. Une liste qui peut devenir longue : `usePagedList` + `ShowMore`, compteurs sur `total`.

## Ajouter une règle métier

1. Écrire la fonction pure dans le bon module de `src/core` et l'exporter par son `index.ts`.
2. Écrire ses tests à côté.
3. L'appeler depuis un store (`src/application`) ou une page.

## Changer de base de données (ex. quitter Firestore)

1. Choisir le ou les ports concernés dans `src/application/ports.ts`.
2. Écrire un adapter par port dans `src/infrastructure/<technologie>/`.
3. Les brancher dans `src/app/container.ts`. Rien d'autre ne change.
4. Tester l'adapter contre le contrat du port (mêmes résultats `{ ok, error }`).

## Ajouter un réglage au moteur de matching

1. Ajouter le champ dans `MatchingConfig` et sa valeur dans `DEFAULT_MATCHING_CONFIG` (`core/matching/config.ts`).
2. Le valider dans `resolveMatchingConfig` (valeur bornée, valeur par défaut si invalide) et le tester dans `config.test.ts`.
3. L'utiliser dans l'étape concernée (`scoring`, `tiers`, `ranking`…).
4. L'exposer dans l'onglet Moteur (`features/backoffice/matching/`).

## Ajouter un critère de tri

1. L'ajouter à `RANKING_CRITERIA` (`core/matching/config.ts`).
2. Écrire son comparateur dans `comparatorFor` (`core/matching/ranking.ts`).
3. Lui donner un libellé dans `RankingEditor.tsx`.

## Ajouter un filtre de recettes

1. Ajouter le champ dans `FilterOptions` et sa règle dans `predicates` (`core/matching/filters.ts`).
2. L'ajouter à `RecipeFilters` et à sa lecture/écriture dans l'adresse (`features/recipes/recipeFilters.ts`, + test).
3. L'afficher dans `features/recipes/components/RecipeFilterBar.tsx` (commune au catalogue et aux suggestions).

## Ajouter un scénario du chef

Dans /admin › Moteur › Scénarios du chef › Ajouter : un titre clair, le frigo, éventuellement un
placard ou des filtres, et les vérifications attendues. Il est enregistré en base et rejoué avec le
brouillon avant chaque publication. Un nouveau **type** de vérification se code dans
`core/matching/scenarios.ts` (évaluation), `scenarioSchema.ts` (lecture, validation, valeur par
défaut, tests) et `ScenarioEditorModal.tsx` (champs).

## Ajouter une langue

1. Ajouter la valeur à `Language` (`core/shared/language.ts`).
2. Ajouter le dictionnaire complet dans `translations.ts` (le typage signale les clés manquantes).
3. Ajouter les noms dans cette langue aux recettes, ingrédients et thèmes (modèle de données à étendre).

## Changer de fournisseur d'IA pour le scan photo

Voir [08 Serveur et API](08-serveur-api.md#scan-photo--changer-de-fournisseur-dia).
