# 05 · Application et données

## Stores (`src/application`)

Un store est un petit conteneur d'état observable, **sans React** (`store.ts`) : `getState()`,
`subscribe(listener)`, et des méthodes métier qui enregistrent puis notifient. Côté React,
`useStore` (dans `src/app/ContainerContext.tsx`) s'abonne via `useSyncExternalStore`.

| Store                   | État                                                   | Rôle                                                                             |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `CatalogStore`          | recettes, ingrédients, catalogue distant chargé ou non | Copie locale d'abord, puis catalogue partagé (modifié seulement par le patron)   |
| `KitchenStore`          | frigo, placard, favoris, menu, liste de courses        | Toutes les données de cuisine de l'utilisateur, enregistrées à chaque changement |
| `PatronStore`           | `checking` / `signed-in` / `signed-out`, statut cloud  | Session patron, toujours confirmée par le serveur                                |
| `MatchingSettingsStore` | réglages du moteur, version, source                    | Base = référence, copie locale hors ligne, valeurs du code par défaut            |

Hooks d'accès : `useCatalog()`, `useKitchen()`, `usePatron()`, `useMatchingSettings()`, `useContainer()`.

## Ports (`src/application/ports.ts`)

| Port                         | Rôle                                             | Adapter actuel                                      |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `CatalogRepository`          | Copie du catalogue sur l'appareil                | `infrastructure/local/localRepositories`            |
| `RemoteCatalogSource`        | Catalogue partagé                                | `infrastructure/firebase/firestoreCatalogSource`    |
| `KitchenRepository`          | Frigo, placard, favoris, menu, courses           | `infrastructure/local/localRepositories`            |
| `PreferencesRepository`      | Langue, thème, mode, placard                     | `infrastructure/local/localPreferences`             |
| `ThemeRepository`            | Thèmes publiés (+ copie hors ligne), édition     | `infrastructure/firebase/themes`                    |
| `MatchingSettingsRepository` | Réglages du moteur et leur historique            | `infrastructure/firebase/firestoreMatchingSettings` |
| `MatchingSettingsCache`      | Copie hors ligne des réglages                    | `infrastructure/local/localMatchingSettingsCache`   |
| `CatalogAdminGateway`        | Écritures du backoffice, sauvegarde/restauration | `infrastructure/firebase/catalogSync`               |
| `UserAuthGateway`            | Comptes visiteurs (invité, e-mail)               | `infrastructure/firebase/userAuth`                  |
| `PatronGateway`              | Connexion et session patron                      | `infrastructure/http/patronHttpGateway`             |
| `VisionGateway`              | Scan photo du frigo                              | `infrastructure/http/visionHttpGateway`             |

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

Les règles sont dans `firestore.rules` (tout est refusé par défaut). « Patron » = session ouverte
par le serveur (jeton Firebase avec le droit `patron`), compte propriétaire vérifié, ou uid listé
dans `admins`. Déploiement : voir [10 Exploitation](10-exploitation.md).

### Navigateur (copie hors ligne et données personnelles)

| Clé `localStorage`                           | Contenu                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `chnowa_recipes_v1`, `chnowa_ingredients_v1` | Copie du catalogue                                                               |
| `chnowa_seed_version`                        | Version du catalogue intégré déjà appliquée                                      |
| `chnowa_fridge_selected_v1`                  | Frigo                                                                            |
| `chnowa_favorites_v1`                        | Favoris                                                                          |
| `chnowa_weekly_plan_v1`                      | Menu de la semaine                                                               |
| `chnowa_grocery_list_v1`                     | Liste de courses                                                                 |
| `chnowa_preferences_v1`                      | Langue, mode, thème, placard                                                     |
| `chnowa_themes_v1`                           | Copie des thèmes publiés                                                         |
| `chnowa_active_theme_vars_v1`                | Couleurs du thème actif, lues par `index.html` avant le démarrage (pas de flash) |
| `chnowa_matching_settings_cache_v1`          | Copie des réglages du moteur                                                     |

`sessionStorage` : `patron_session_token` (jeton de session patron, 8 heures).

### Fichiers JSON

Uniquement pour **exporter** (sauvegarde) et **restaurer** : catalogue complet (onglet Données)
et réglages du moteur (onglet Moteur). Aucune donnée n'est enregistrée dans un fichier par l'application.

## Chargement au démarrage (`src/app/App.tsx`)

1. Les stores sont créés avec la copie locale : l'application s'affiche tout de suite, même hors ligne.
2. En parallèle : synchronisation du catalogue partagé, vérification d'une session patron
   existante, chargement des réglages du moteur et des thèmes publiés.
3. Chaque store notifie l'interface quand ses données arrivent.
