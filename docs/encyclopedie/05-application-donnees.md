# 05 · Application et données

## Stores (`src/application`)

Un store est un petit conteneur d'état observable, **sans React** (`store.ts`) : `getState()`,
`subscribe(listener)`, et des méthodes métier qui enregistrent puis notifient. Côté React,
`useStore` (dans `src/app/ContainerContext.tsx`) s'abonne via `useSyncExternalStore`.

| Store                   | État                                                      | Rôle                                                                                    |
| ----------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SyncedCollectionStore` | éléments d'une collection partagée, copie lue, base lue   | **Mécanisme générique** de synchronisation incrémentale et en direct (voir plus bas)    |
| `CatalogStore`          | recettes, ingrédients, catalogue distant chargé ou non    | Assemble deux `SyncedCollectionStore` (recettes, ingrédients)                           |
| `KitchenStore`          | frigo, placard, favoris, menu, liste de courses           | Toutes les données de cuisine de l'utilisateur, enregistrées à chaque changement        |
| `SuperAdminStore`       | `checking` / `signed-in` / `signed-out`, statut cloud     | Session super admin, toujours confirmée par le serveur                                  |
| `MatchingSettingsStore` | réglages du moteur, version, source                       | Base = référence, copie locale hors ligne, valeurs du code par défaut                   |
| `RecipeDrafts`          | (service) brouillons de l'éditeur de recette              | Garde, propose à nouveau et efface les modifications non enregistrées                   |
| `CatalogAdmin`          | (service) actions du backoffice sur le catalogue          | Affiche la modification tout de suite, l'écrit en base, sauvegarde / restauration       |
| `CatalogSearch`         | révision des index de recherche                           | Recherche texte sur la copie de l'appareil (voir [12 Recherche](12-recherche.md))       |
| `ReviewSettingsStore`   | workflows et rôles en vigueur, version, avertissements    | Réglages du workflow de validation : suivis en direct, chaque version gardée            |
| `ReviewStore<K>`        | copies de travail et où chacune en est (par type)         | Atelier d'un type : enregistrer, valider / renvoyer des cases, publier, retirer         |
| `TeamStore`             | membres de l'équipe, fiche du compte connecté             | Ajouter (par e-mail), changer le rôle, retirer ; droits recopiés pour les règles        |
| `CategoryStore`         | catégories d'un type (liste + arbre)                      | Enregistrer (validé par le core), réordonner, supprimer ; catégories d'origine ajoutées |
| `ReviewBoard`           | (service) recettes + ingrédients + contexte des contrôles | Regroupe les deux ateliers ; démarré seulement dans le backoffice                       |

Hooks d'accès : `useReview(kind)`, `useCategories(kind)`, `useTeam()`, `useReviewSettings()`, `useSearchMatches(kind, query)`, `useCatalog()`, `useKitchen()`, `useSuperAdmin()`, `useMatchingSettings()`, `useContainer()`.

## Ports (`src/application/ports.ts`)

| Port                         | Rôle                                                | Adapter actuel                                      |
| ---------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| `SharedCollectionSource`     | Collection partagée suivie en direct                | `infrastructure/firebase/firestoreSharedCollection` |
| `SharedCollectionWriter<T>`  | Écritures du super admin (versionnées, sans fusion) | `infrastructure/firebase/firestoreSharedCollection` |
| `LocalCollectionCache<T>`    | Copie hors ligne d'une collection partagée          | `infrastructure/indexeddb/indexedDbCollectionCache` |
| `KitchenRepository`          | Frigo, placard, favoris, menu, courses              | `infrastructure/local/localRepositories`            |
| `PreferencesRepository`      | Langue, thème, mode, placard                        | `infrastructure/local/localPreferences`             |
| `ThemeRepository`            | Thèmes publiés (+ copie hors ligne), édition        | `infrastructure/firebase/themes`                    |
| `MatchingSettingsRepository` | Réglages du moteur et leur historique               | `infrastructure/firebase/firestoreMatchingSettings` |
| `MatchingSettingsCache`      | Copie hors ligne des réglages                       | `infrastructure/local/localMatchingSettingsCache`   |
| `UserAuthGateway`            | Comptes visiteurs (invité, e-mail)                  | `infrastructure/firebase/userAuth`                  |
| `SuperAdminGateway`          | Connexion et session super admin                    | `infrastructure/http/adminHttpGateway`              |
| `VisionGateway`              | Scan photo du frigo                                 | `infrastructure/http/visionHttpGateway`             |
| `RecipeDraftRepository`      | Brouillons de recettes non enregistrés              | `infrastructure/local/localRecipeDrafts`            |
| `SearchEngine`               | Recherche texte (recettes, ingrédients)             | `infrastructure/minisearch/miniSearchEngine`        |
| `ReviewWorkspaceWriter<K>`   | Atelier : copies de travail, publication            | `infrastructure/firebase/firestoreReviewWorkspace`  |
| `ReviewSettingsRepository`   | Workflows et rôles, et leurs versions               | `infrastructure/firebase/firestoreReviewSettings`   |
| `TeamRepository`             | Membres de l'équipe (`admins`)                      | `infrastructure/firebase/firestoreTeam`             |

Références et tests de contrat : `infrastructure/memory/memorySharedCollection` et `memoryCollectionCache`,
`infrastructure/contracts/sharedCollection.contract.ts` et `localCollectionCache.contract.ts` (passé aussi par
l'adapter IndexedDB, testé avec `fake-indexeddb`) ; atelier : `memoryReviewWorkspace` et
`reviewWorkspace.contract.ts`, réglages : `memoryReviewSettings`.

Les écritures renvoient `WriteResult` : `{ ok: true }` ou `{ ok: false, error }` (message lisible).
Les adapters sont reliés aux ports dans `src/app/container.ts`, et nulle part ailleurs.

## Où sont les données

### Firestore (base partagée, source de vérité)

| Collection / document             | Contenu                                  | Lecture                           | Écriture                              |
| --------------------------------- | ---------------------------------------- | --------------------------------- | ------------------------------------- |
| `recipes/{id}`                    | Recettes                                 | publique                          | super admin                           |
| `ingredients/{id}`                | Ingrédients et prix                      | publique                          | super admin                           |
| `themes/{id}`                     | Thèmes créés dans le backoffice          | thèmes publiés : publique         | super admin (validés champ par champ) |
| `settings/matching`               | Réglages actifs du moteur                | publique                          | super admin                           |
| `matching_settings_versions/v<n>` | Historique des réglages (jamais modifié) | super admin                       | super admin (création seulement)      |
| `matching_scenarios/{id}`         | Scénarios du chef                        | super admin                       | super admin (enveloppe validée)       |
| `users/{uid}`                     | Profil d'un visiteur connecté            | lui-même, super admin             | lui-même (champs limités)             |
| `admins/{uid}`                    | Membres de l'équipe (rôle, droits)       | le membre lui-même, gestionnaires | gestionnaires (champs vérifiés)       |
| `recipes_workspace/{id}`          | Copies de travail des recettes (atelier) | super admin                       | super admin (enveloppe validée)       |
| `ingredients_workspace/{id}`      | Copies de travail des ingrédients        | super admin                       | super admin (enveloppe validée)       |
| `recipes_versions/{id}-{t}`       | Versions publiées d'une recette          | super admin                       | super admin (création seulement)      |
| `ingredients_versions/{id}-{t}`   | Versions publiées d'un ingrédient        | super admin                       | super admin (création seulement)      |
| `settings/review`                 | Workflows et rôles en vigueur            | super admin                       | super admin                           |
| `review_settings_versions/v<n>`   | Historique des workflows et rôles        | super admin                       | super admin (création seulement)      |

**Atelier du workflow de validation** (`ReviewBoard`, `src/application/review/`) : chaque type de contenu
a un atelier privé (`<collection>_workspace`), suivi par le même `SyncedCollectionStore` que le
catalogue (copie IndexedDB `recipes_workspace` / `ingredients_workspace`, base IndexedDB en version 2).
`ReviewStore` calcule sur l'appareil où en est chaque copie (`reviewSnapshot`), et garde le résultat
tant que la copie, le workflow et les ingrédients ne changent pas. Les droits du rôle sont vérifiés
avant chaque action (`canPerform`, `canReviewCell`). **Publier** écrit en une seule transaction la
version publique (cases validées, les autres reprises de la version en ligne), la copie de travail et
une version dans l'historique (`<collection>_versions`). Chaque écriture de l'atelier dit de quelle
copie elle part (`written_at`) : si quelqu'un a enregistré entre-temps, rien n'est écrit et le message
demande de recharger. `importPublished` fait le premier passage au workflow : ce qui est en ligne
devient une copie validée, une recette en brouillon passe dans l'atelier et quitte la collection
publique. Recettes et ingrédients passent par l'atelier (éditeurs, pages de validation : voir
[07](07-backoffice.md)). **Qui agit** (`ReviewBoard.actor()`, défini dans `container.ts`) : la session
super admin a le rôle administrateur ; sinon le compte connecté sur le site, s'il est membre de l'équipe
(`TeamStore`), agit avec son rôle ; sinon aucun droit. Une écriture refusée ou impossible (base injoignable, mode local) garde la
modification sur l'appareil (`local: true`, message d'erreur), comme le catalogue ; un conflit
(`written_at`) n'écrit rien.

**Écriture d'une recette ou d'un ingrédient** : le document est **remplacé en entier** (pas de
fusion), sans aucune valeur `undefined` (`withoutUndefined`, `@/core/shared` ; Firestore refuse
`undefined` et l'enregistrement restait sinon bloqué sur l'appareil du super admin). Un champ retiré par le
super admin (vidéo, « healthy », substitut…) disparaît donc aussi de la base et des autres appareils.

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

Les règles sont dans `firestore.rules` (tout est refusé par défaut). « Super admin » = session ouverte
par le serveur (jeton Firebase avec le droit `super admin`), compte propriétaire vérifié, ou uid listé
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

`sessionStorage` : `super_admin_session_token` (jeton de session super admin, 8 heures).

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
   (`matchingSettings.start()`), vérification d'une session super admin, thèmes publiés.
3. Chaque store notifie l'interface à chaque changement reçu, pendant toute la visite.

## Catégories et catalogue public

- `recipe_categories` et `ingredient_categories` : collections partagées (`SyncedCollectionStore`,
  copie IndexedDB, `DB_VERSION` 3), lues par tous, écrites par un compte qui peut publier
  (`CategoryStore`, branché dans `container.ts`, suivi dès l'ouverture de l'application). Les catégories
  d'origine sont ajoutées par le store, pas par la lecture (une modification reçue en direct ne les
  écrase pas).
- **Catalogue public = recettes validées seulement** : la collection publique des recettes n'a plus de
  contenu intégré de secours (`builtIn` vide) et une collection qui ne contient que des marques de
  suppression est vide (et non « base vide » : `SyncedCollectionStore.receive`). Le serveur (SEO) ne
  montre lui aussi que les recettes de la base.
