# 05 · Application et données

## Stores (`src/application`)

Un store est un petit conteneur d'état observable, **sans React** (`store.ts`) : `getState()`,
`subscribe(listener)`, et des méthodes métier qui enregistrent puis notifient. Côté React,
`useStore` (dans `src/app/ContainerContext.tsx`) s'abonne via `useSyncExternalStore`.

| Store                   | État                                                    | Rôle                                                                                 |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `SyncedCollectionStore` | éléments d'une collection partagée, copie lue, base lue | **Mécanisme générique** de synchronisation incrémentale et en direct (voir plus bas) |
| `CatalogStore`          | recettes, ingrédients, catalogue distant chargé ou non  | Assemble deux `SyncedCollectionStore` (recettes, ingrédients)                        |
| `KitchenStore`          | frigo, placard, favoris, menu, liste de courses         | Toutes les données de cuisine de l'utilisateur, enregistrées à chaque changement     |
| `PatronStore`           | `checking` / `signed-in` / `signed-out`, statut cloud   | Session patron, toujours confirmée par le serveur                                    |
| `MatchingSettingsStore` | réglages du moteur, version, source                     | Base = référence, copie locale hors ligne, valeurs du code par défaut                |
| `RecipeDrafts`          | (service) brouillons de l'éditeur de recette            | Garde, propose à nouveau et efface les modifications non enregistrées                |
| `CatalogAdmin`          | (service) actions du backoffice sur le catalogue        | Affiche la modification tout de suite, l'écrit en base, sauvegarde / restauration    |

Hooks d'accès : `useCatalog()`, `useKitchen()`, `usePatron()`, `useMatchingSettings()`, `useContainer()`.

## Ports (`src/application/ports.ts`)

| Port                         | Rôle                                           | Adapter actuel                                      |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `SharedCollectionSource`     | Collection partagée suivie en direct           | `infrastructure/firebase/firestoreSharedCollection` |
| `SharedCollectionWriter<T>`  | Écritures du patron (versionnées, sans fusion) | `infrastructure/firebase/firestoreSharedCollection` |
| `LocalCollectionCache<T>`    | Copie hors ligne d'une collection partagée     | `infrastructure/indexeddb/indexedDbCollectionCache` |
| `KitchenRepository`          | Frigo, placard, favoris, menu, courses         | `infrastructure/local/localRepositories`            |
| `PreferencesRepository`      | Langue, thème, mode, placard                   | `infrastructure/local/localPreferences`             |
| `ThemeRepository`            | Thèmes publiés (+ copie hors ligne), édition   | `infrastructure/firebase/themes`                    |
| `MatchingSettingsRepository` | Réglages du moteur et leur historique          | `infrastructure/firebase/firestoreMatchingSettings` |
| `MatchingSettingsCache`      | Copie hors ligne des réglages                  | `infrastructure/local/localMatchingSettingsCache`   |
| `UserAuthGateway`            | Comptes visiteurs (invité, e-mail)             | `infrastructure/firebase/userAuth`                  |
| `PatronGateway`              | Connexion et session patron                    | `infrastructure/http/patronHttpGateway`             |
| `VisionGateway`              | Scan photo du frigo                            | `infrastructure/http/visionHttpGateway`             |
| `RecipeDraftRepository`      | Brouillons de recettes non enregistrés         | `infrastructure/local/localRecipeDrafts`            |

Références et tests de contrat : `infrastructure/memory/memorySharedCollection` et `memoryCollectionCache`,
`infrastructure/contracts/sharedCollection.contract.ts` et `localCollectionCache.contract.ts` (passé aussi par
l'adapter IndexedDB, testé avec `fake-indexeddb`).

Les écritures renvoient `WriteResult` : `{ ok: true }` ou `{ ok: false, error }` (message lisible).
Les adapters sont reliés aux ports dans `src/app/container.ts`, et nulle part ailleurs.

## Où sont les données

### Firestore (base partagée, source de vérité)

| Collection / document             | Contenu                                  | Lecture                   | Écriture                         |
| --------------------------------- | ---------------------------------------- | ------------------------- | -------------------------------- |
| `recipes/{id}`                    | Recettes                                 | publique                  | patron                           |
| `ingredients/{id}`                | Ingrédients et prix                      | publique                  | patron                           |
| `themes/{id}`                     | Thèmes créés dans le backoffice          | thèmes publiés : publique | patron (validés champ par champ) |
| `settings/matching`               | Réglages actifs du moteur                | publique                  | patron                           |
| `matching_settings_versions/v<n>` | Historique des réglages (jamais modifié) | patron                    | patron (création seulement)      |
| `matching_scenarios/{id}`         | Scénarios du chef                        | patron                    | patron (enveloppe validée)       |
| `users/{uid}`                     | Profil d'un visiteur connecté            | lui-même, patron          | lui-même (champs limités)        |
| `admins/{uid}`                    | Comptes administrateurs supplémentaires  | patron                    | patron                           |

**Écriture d'une recette ou d'un ingrédient** : le document est **remplacé en entier** (pas de
fusion), sans aucune valeur `undefined` (`withoutUndefined`, `@/core/shared` ; Firestore refuse
`undefined` et l'enregistrement restait sinon bloqué sur l'appareil du patron). Un champ retiré par le
patron (vidéo, « healthy », substitut…) disparaît donc aussi de la base et des autres appareils.

### Synchronisation incrémentale et en direct (toutes les collections partagées)

Prévue pour des milliers d'éléments, sans relire toute la base à chaque ouverture :

- Chaque écriture porte `revision` = **heure du serveur** (`serverTimestamp`), identique pour tous les
  appareils (aucun décalage d'horloge). `firestore.rules` l'exige (`revision == request.time`).
- Une suppression est une **marque** `{ deleted: true, revision }` : les autres appareils retirent l'élément.
- Au démarrage, l'appareil affiche sa copie (IndexedDB), puis ne demande que `revision >= la plus récente
qu'il connaît` : sans changement, **aucun document lu**. Il reste ensuite abonné (`onSnapshot`) : une
  modification faite sur un appareil arrive sur les autres en quelques secondes, sans recharger, et ne
  coûte qu'une lecture par appareil connecté.
- Première visite, copie de plus de 30 jours ou « Récupérer depuis le cloud » : lecture complète.
- Toute donnée reçue est relue par le domaine (`parseStoredRecipes`, `parseStoredIngredients`) ; les
  éléments invalides sont ignorés. Une base vide ne remplace pas le catalogue intégré.
- Fonctions pures : `@/core/sync` (`applyChanges`, `latestRevision`, `isDeletionMarker`).
- Le même mécanisme sert à toute nouvelle collection partagée (thèmes, scénarios, textes du CMS) :
  un `SyncedCollectionStore` + `createFirestoreSharedCollection('<collection>')` + une copie IndexedDB.
  Les thèmes et les scénarios utilisent encore leur ancien chargement (petits volumes) : à migrer.
- Réglages du moteur : un seul document suivi en direct (`followActive`), une nouvelle version publiée
  s'applique tout de suite sur tous les appareils.
- Les pages SEO du serveur (`server/seo.ts`) se mettent à jour de la même façon (changements seulement,
  au plus toutes les 60 s).

Les règles sont dans `firestore.rules` (tout est refusé par défaut). « Patron » = session ouverte
par le serveur (jeton Firebase avec le droit `patron`), compte propriétaire vérifié, ou uid listé
dans `admins`. Déploiement : voir [10 Exploitation](10-exploitation.md).

### Navigateur (copie hors ligne et données personnelles)

**IndexedDB** (base `chnowa`) : magasins `recipes` et `ingredients` (un enregistrement par élément, seuls
les éléments changés sont réécrits) et `meta` (révision la plus récente et date de chaque collection).
L'ancienne copie `localStorage` (`chnowa_recipes_v1`, `chnowa_ingredients_v1`, `chnowa_seed_version`) est
déplacée une fois dans IndexedDB puis effacée.

| Clé `localStorage`                     | Contenu                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `chnowa_fridge_selected_v1`            | Frigo                                                                            |
| `chnowa_favorites_v1`                  | Favoris                                                                          |
| `chnowa_weekly_plan_v1`                | Menu de la semaine                                                               |
| `chnowa_grocery_list_v1`               | Liste de courses                                                                 |
| `chnowa_preferences_v1`                | Langue, mode, thème, placard                                                     |
| `chnowa_themes_v1`                     | Copie des thèmes publiés                                                         |
| `chnowa_active_theme_vars_v1`          | Couleurs du thème actif, lues par `index.html` avant le démarrage (pas de flash) |
| `chnowa_matching_settings_cache_v1`    | Copie des réglages du moteur                                                     |
| `chnowa_recipe_draft_v1:<id>` / `:new` | Brouillon de l'éditeur de recette (personnel à l'appareil, jamais partagé)       |

`sessionStorage` : `patron_session_token` (jeton de session patron, 8 heures).

### Fichiers JSON

Uniquement pour **exporter** (sauvegarde) et **restaurer** : catalogue complet (onglet Données)
et réglages du moteur (onglet Moteur). Aucune donnée n'est enregistrée dans un fichier par l'application.

La sauvegarde contient les objets complets : recettes (toutes les langues et variantes des noms, descriptions, étapes et
astuce ; photo, vidéo, healthy, rôles, remplaçants), ingrédients (toutes les langues et variantes, fourchette de prix,
photo), menu, favoris, liste de courses. La restauration relit tout par `parseBackup` (domaine) : les
éléments invalides sont ignorés et comptés, les anciennes sauvegardes sont mises à jour (prix unique →
fourchette, rôles). Elle s'applique **sur l'appareil** ; « Envoyer vers le cloud » la publie ensuite.
Les brouillons de l'éditeur ne font pas partie de la sauvegarde.

## Chargement au démarrage (`src/app/App.tsx`)

1. Les stores affichent le catalogue intégré, puis la copie de l'appareil (IndexedDB) dès qu'elle est lue :
   l'application s'affiche tout de suite, même hors ligne.
2. En parallèle : suivi en direct du catalogue (`catalog.start()`) et des réglages du moteur
   (`matchingSettings.start()`), vérification d'une session patron, thèmes publiés.
3. Chaque store notifie l'interface à chaque changement reçu, pendant toute la visite.
