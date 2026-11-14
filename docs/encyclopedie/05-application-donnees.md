# 05 · Application et données

## Stores (`src/application`)

Un store est un petit conteneur d'état observable, **sans React** (`store.ts`) : `getState()`,
`subscribe(listener)`, et des méthodes métier qui enregistrent puis notifient. Côté React,
`useStore` (dans `src/app/ContainerContext.tsx`) s'abonne via `useSyncExternalStore`.

| Store                    | État                                                      | Rôle                                                                                    |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SyncedCollectionStore`  | éléments d'une collection partagée, copie lue, base lue   | **Mécanisme générique** de synchronisation incrémentale et en direct (voir plus bas)    |
| `CatalogStore`           | recettes, ingrédients, catalogue distant chargé ou non    | Assemble deux `SyncedCollectionStore` (recettes, ingrédients)                           |
| `KitchenStore`           | frigo, placard, favoris, menu, liste de courses           | Toutes les données de cuisine de l'utilisateur, enregistrées à chaque changement        |
| `KitchenSync`            | synchro en cours, sections en attente, dernier pull       | Pousse (anti-rebond 2 s) et tire (garde 60 s) la cuisine du compte vers `kitchen/{uid}` |
| `BackofficeSessionStore` | `checking` / `signed-in` / `signed-out`, statut cloud     | Session super admin, toujours confirmée par le serveur                                  |
| `MatchingSettingsStore`  | réglages du moteur, version, source                       | Base = référence, copie locale hors ligne, valeurs du code par défaut                   |
| `RecipeDrafts`           | (service) brouillons de l'éditeur de recette              | Garde, propose à nouveau et efface les modifications non enregistrées                   |
| `CatalogAdmin`           | (service) actions du backoffice sur le catalogue          | Affiche la modification tout de suite, l'écrit en base, sauvegarde / restauration       |
| `CatalogSearch`          | révision des index de recherche                           | Recherche texte sur la copie de l'appareil (voir [12 Recherche](12-recherche.md))       |
| `ReviewSettingsStore`    | workflows et rôles en vigueur, version, avertissements    | Réglages du workflow de validation : suivis en direct, chaque version gardée            |
| `ReviewStore<K>`         | copies de travail et où chacune en est (par type)         | Atelier d'un type : enregistrer, valider / renvoyer des cases, publier, retirer         |
| `TeamStore`              | membres de l'équipe, fiche du compte connecté             | Ajouter (par e-mail), changer le rôle, retirer ; droits recopiés pour les règles        |
| `CategoryStore`          | catégories d'un type (liste + arbre)                      | Enregistrer (validé par le core), réordonner, supprimer ; catégories d'origine ajoutées |
| `ReviewBoard`            | (service) recettes + ingrédients + contexte des contrôles | Regroupe les deux ateliers ; démarré seulement dans le backoffice                       |

Hooks d'accès : `useReview(kind)`, `useCategories(kind)`, `useTeam()`, `useReviewSettings()`, `useSearchMatches(kind, query)`, `useCatalog()`, `useKitchen()`, `useBackofficeSession()`, `useMatchingSettings()`, `useContainer()`.

## Ports (`src/application/ports.ts`)

| Port                         | Rôle                                                | Adapter actuel                                           |
| ---------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `SharedCollectionSource`     | Collection partagée suivie (delta incrémental)      | `infrastructure/http/sharedCollectionHttp`               |
| `SharedCollectionWriter<T>`  | Écritures (versionnées par le serveur, sans fusion) | `infrastructure/http/sharedCollectionHttp`               |
| `LocalCollectionCache<T>`    | Copie hors ligne d'une collection partagée          | `infrastructure/indexeddb/indexedDbCollectionCache`      |
| `KitchenRepository`          | Frigo, placard, favoris, menu, courses              | `infrastructure/local/localRepositories` (scopé par uid) |
| `KitchenSyncGateway`         | La cuisine du compte sur le serveur (pull/push)     | `infrastructure/http/kitchenSyncHttpGateway`             |
| `KitchenSyncLedger`          | Sections changées ici, horodatages, attentes        | `infrastructure/local/localRepositories`                 |
| `PreferencesRepository`      | Langue, thème, mode, placard                        | `infrastructure/local/localPreferences`                  |
| `ThemeRepository`            | Thèmes publiés (+ copie hors ligne), édition        | `infrastructure/http/themesHttp`                         |
| `MatchingSettingsRepository` | Réglages du moteur et leur historique               | `infrastructure/http/settingsRepositories`               |
| `MatchingSettingsCache`      | Copie hors ligne des réglages                       | `infrastructure/local/localMatchingSettingsCache`        |
| `UserAuthGateway`            | Sessions du site (invité, client, employé)          | `infrastructure/http/userAuthHttpGateway`                |
| `BackofficeSessionGateway`   | Connexion et session super admin                    | `infrastructure/http/backofficeSessionHttpGateway`       |
| `PollingSettingsGateway`     | Intervalle de polling configuré dans le backoffice  | `infrastructure/http/pollingSettingsGateway`             |
| `VisionGateway`              | Scan photo du frigo                                 | `infrastructure/http/visionHttpGateway`                  |
| `RecipeDraftRepository`      | Brouillons de recettes non enregistrés              | `infrastructure/local/localRecipeDrafts`                 |
| `SearchEngine`               | Recherche texte (recettes, ingrédients)             | `infrastructure/minisearch/miniSearchEngine`             |
| `ReviewWorkspaceWriter<K>`   | Atelier : copies de travail, publication atomique   | `infrastructure/http/reviewWorkspaceHttp`                |
| `ReviewSettingsRepository`   | Workflows et rôles, et leurs versions               | `infrastructure/http/settingsRepositories`               |
| `TeamRepository`             | Membres de l'équipe (`admins`)                      | `infrastructure/http/scenariosAndTeamHttp`               |
| `AccountDirectoryRepository` | Annuaire des comptes (paginé) + déverrouillage      | `infrastructure/http/accountDirectoryHttp`               |
| `AccountProfileRepository`   | Profil du compte connecté                           | `infrastructure/http/accountProfileHttpGateway`          |
| `PasswordPolicyGateway`      | Politique des mots de passe (page Sécurité)         | `infrastructure/http/passwordPolicyGateway`              |
| `AccountCreationGateway`     | Création d'un compte employé                        | `infrastructure/http/accountHttpGateway`                 |

Références et tests de contrat : `infrastructure/memory/memorySharedCollection` et `memoryCollectionCache`,
`infrastructure/contracts/sharedCollection.contract.ts` et `localCollectionCache.contract.ts` (passé aussi par
l'adapter IndexedDB, testé avec `fake-indexeddb`) ; atelier : `memoryReviewWorkspace` et
`reviewWorkspace.contract.ts`, réglages : `memoryReviewSettings`, comptes : `memoryAccount*`.

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

- Chaque écriture porte `revision` = **heure du serveur** (tampon posé par le serveur au moment du
  `put`), identique pour tous les appareils (aucun décalage d'horloge).
- Une suppression est une **marque** `{ deleted: true, revision }` : les autres appareils retirent l'élément.
- Au démarrage, l'appareil affiche sa copie (IndexedDB), puis envoie ses révisions au serveur
  (`POST /api/data/changes`, **une seule requête pour toutes les collections suivies**) : côté serveur,
  le **watermark** rend un client à jour gratuit (**0 lecture base**). Dans le cas contraire, une seule
  requête indexée par collection en retard renvoie le delta. Le navigateur **interroge toutes les
  60 s** (onglet visible), au retour sur l'onglet (`visibilitychange`/`focus`) et **immédiatement après
  chaque écriture** — une modification faite ailleurs arrive donc sans recharger la page.
- Le SDK Firebase n'existe plus dans le navigateur : le transport passe par `createHttpSharedCollection`
  (`src/infrastructure/http/sharedCollectionHttp.ts`) + un **poller partagé** (`dataPoller.ts`) ; le
  stockage reste derrière le contrat `DataStore` (Firestore côté serveur, SQL plus tard).
- Première visite, copie de plus de 30 jours ou « Récupérer depuis le serveur » : lecture complète
  (rattrapage page par page si le catalogue dépasse la limite par page).
- Toute donnée reçue est relue par le domaine (`parseStoredRecipes`, `parseStoredIngredients`) ; les
  éléments invalides sont ignorés. Une base vide ne remplace pas le catalogue intégré.
- Fonctions pures : `@/core/sync` (`applyChanges`, `latestRevision`, `isDeletionMarker`).
- Le même mécanisme sert à toute nouvelle collection partagée (thèmes, scénarios, textes du CMS) :
  un `SyncedCollectionStore` + `createHttpSharedCollection('<collection>')` + une copie IndexedDB.
- Réglages du moteur : un seul document suivi (`GET /api/settings/matching`, polling 60 s), une
  nouvelle version publiée s'applique tout de suite sur tous les appareils.
- Les pages SEO du serveur (`server/seo.ts`) se mettent à jour de la même façon (changements seulement,
  au plus toutes les 60 s).

Les règles Firestore (`firestore.rules`, tout refusé par défaut) restent déployées comme **second
filet** : la porte principale est désormais le serveur, qui décide des droits à chaque requête
(session super admin, ou session employé dont les droits viennent de `admins/{uid}` ; un visiteur
non prouvé ne lit que les collections publiques). Déploiement : voir [10 Exploitation](10-exploitation.md).

### Navigateur (copie hors ligne et données personnelles)

**IndexedDB** (base `chnowa`) : magasins `recipes` et `ingredients` (un enregistrement par élément, seuls
les éléments changés sont réécrits) et `meta` (révision la plus récente et date de chaque collection).
L'ancienne copie `localStorage` (`chnowa_recipes_v1`, `chnowa_ingredients_v1`, `chnowa_seed_version`) est
déplacée une fois dans IndexedDB puis effacée.

| Clé `localStorage`                                                                                    | Contenu                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chnowa_kitchen_<scope>_v1`                                                                           | **Document de cuisine scopé** (frigo, placard, favoris, menu, liste + horodatages et sections en attente) — `<scope>` = uid du compte, ou `local` pour un appareil sans compte |
| `chnowa_fridge_selected_v1`, `chnowa_favorites_v1`, `chnowa_weekly_plan_v1`, `chnowa_grocery_list_v1` | **Clés historiques** : lues une seule fois à la première ouverture d'un scope (migration en lecture, rien n'est supprimé), puis remplacées par le document scopé               |

### Synchronisation personnelle de la cuisine (comptes clients)

Le frigo, le placard, les favoris, le menu de la semaine, la liste de courses et les préférences
alimentaires d'un **compte client ou employé** sont conservés sur le serveur : un document par uid
dans la collection server-only `kitchen`, lu et écrit par `GET/PUT /api/kitchen` (session Bearer,
jamais les invités). Côté client, le moteur `KitchenSync` (`src/application/kitchen/KitchenSync.ts`)
travaille **local-first** : l'appareil écrit et affiche toujours depuis sa copie (le localStorage
reste le cache hors ligne), la synchronisation est un fond de carte invisible.

**Budget d'appels verrouillé** (aucune requête périodique, aucune boucle de retry) :

- Push : **anti-rebond de 2 s** qui se réarme (une rafale de modifications = une requête), et
  **envoi immédiat** du tampon quand la page passe en arrière-plan (`visibilitychange`/`pagehide`).
  Une écriture = 1 lecture + 1 écriture du document serveur (fusion nouveau-gagne-par-section).
- Pull : au démarrage, à la connexion et au retour sur l'onglet, avec une **garde de 60 s**
  entre deux pulls automatiques (≤ 3 lectures/heure même pour un utilisateur très actif).
- Rattrapage : les sections marquées « en attente » (flag persisté dans le document scopé)
  sont envoyées **au démarrage suivant** — un crash, une coupure réseau ou un onglet tué ne
  perdent rien ; un push en échec reste en attente et repart au déclencheur suivant seulement.

**Conflits entre appareils, par section** : favoris, frigo et placard fusionnent en **union** (le commentaire et le montant dépensé de la liste voyagent dans la section `groceryMeta`, dernier écrit gagnant)
(les ensembles grossissent, jamais de perte) ; menu, liste et préférences prennent **le dernier
écrit gagnant** (horodatage client porté par chaque section). Le serveur applique la même règle
(`server/routes/kitchenRoutes.ts`), donc deux appareils peuvent pousser dans n'importe quel ordre
et convergent. La sync des préférences exclut le placard (qui a sa propre section) et inversement
le push des préférences n'embarque pas `pantryStaples`.

**Scopage par uid** : la clé locale porte l'uid (`chnowa_kitchen_<uid>_v1`) ; à la connexion d'un
compte différent, l'appareil recharge les données de ce compte. **Migration montante** : à la
première ouverture d'un scope, les anciennes clés non scopées sont lues une fois et comptent
comme des changements locaux (elles partent vers le cloud au premier push). Les **invités** restent
100 % locaux (uid éphémère, rien à synchroniser) ; un bandeau discret (`SyncInviteBanner`)
propose la création de compte quand l'appareil détient des données de cuisine sans compte.
| `chnowa_preferences_v1` | Langue, mode, thème, placard |
| `chnowa_themes_v1` | Copie des thèmes publiés |
| `chnowa_active_theme_vars_v1` | Couleurs du thème actif, lues par `index.html` avant le démarrage (pas de flash) |
| `chnowa_matching_settings_cache_v1` | Copie des réglages du moteur |
| `chnowa_recipe_draft_v1:<id>` / `:new` | Brouillon de l'éditeur de recette (personnel à l'appareil, jamais partagé) |

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

### Bascule SQL (préparée dans PR E, pas encore branchée)

Le stockage reste Firestore ; l'implémentation SQL du contrat existe et passe **la même suite de
contrat** sur SQLite ( knex + `better-sqlite3` en local) :

- `server/storage/sqlStore.ts` : `createSqlStore(knex)` — une **table par collection du registre**
  (`id` clé primaire · `data` JSON : le document sans son id · `revision` ms · `updated_at` · `deleted`),
  documents stockés tels quels (les parseurs du core ne changent pas). Les requêtes par champ JSON
  gèrent les dialectes ciblés (Postgres `->>`, MySQL `json_extract`, SQL Server `JSON_VALUE`,
  SQLite `json_extract`). Non branché : `server/app.ts` garde Firestore jusqu'à la bascule.
- `ensureSchema(knex)` : crée les tables (idempotent).
- `scripts/sql/import-json.ts` : importe un fichier `{ "collection": [ { "id", ...document } ] }`
  dans les tables — c'est le format que produira l'export (différé).
- Bascule prévue : créer l'instance Knex (`DATA_STORE`/`SQL_CONNECTION`), `ensureSchema()`, remplacer
  `createFirestoreStore` par `createSqlStore` dans `server/app.ts`, importer le dump. Les hachés
  argon2 de `auth` suivent avec les comptes : aucun client ne perd son mot de passe.
