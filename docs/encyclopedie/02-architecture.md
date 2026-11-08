# 02 · Architecture

Objectif : un code **modulaire, testable et sans duplication**, où l'on peut **changer de base
de données ou de backend** et **changer de framework d'interface** sans réécrire la logique métier,
et partager le même noyau avec une future application mobile.

## Architecture hexagonale (ports & adapters)

```
            ┌───────────────────────────────────────────────┐
            │                  UI (React)                    │  src/features, src/shared, src/app
            │  pages, composants, hooks d'affichage          │
            └───────────────▲───────────────────────────────┘
                            │ appelle / s'abonne
            ┌───────────────┴───────────────────────────────┐
            │                Application                     │  src/application
            │  stores observables + ports (interfaces)       │
            └───────▲───────────────────────────────▲───────┘
                    │ utilise                        │ implémentés par
            ┌───────┴────────────┐       ┌──────────┴────────────────┐
            │   Core (domaine)    │       │  Infrastructure (adapters) │  src/infrastructure
            │  TypeScript pur     │       │  localStorage, Firebase,   │
            │  src/core           │       │  API HTTP du serveur       │
            └────────────────────┘       └───────────────────────────┘
```

`src/app/container.ts` est la **racine de composition** : le seul fichier qui choisit quel
adapter implémente quel port.

## Règles de dépendances

| Couche                       | Peut importer                                       | Ne doit jamais importer                            |
| ---------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `src/core`                   | `src/core` uniquement                               | React, Firebase, `window`, `localStorage`, `fetch` |
| `src/application`            | `src/core`                                          | React, Firebase, composants                        |
| `src/infrastructure`         | `src/core`, `src/application` (ports)               | React, composants                                  |
| `src/features`, `src/shared` | `src/core`, `src/application`, `src/app` (contexte) | `src/infrastructure`, Firebase, SDK d'IA           |
| `src/app/container.ts`       | tout                                                | —                                                  |

Elles sont **vérifiées automatiquement** par `src/core/architecture.test.ts` : un import
interdit fait échouer `npm test`. Le même test impose qu'on importe un module de `core` par
son `index.ts` (`import { matchRecipes } from '@/core/matching'`), jamais par un fichier interne.

## Ce que ça permet

- **Changer de base de données** (quitter Firestore ou localStorage) : les ports ne nomment aucune base
  (garde : `architecture.test.ts`) ; chaque port de données a un test de contrat
  (`src/infrastructure/contracts/`) et une implémentation en mémoire de référence
  (`src/infrastructure/memory/`). Écrire un nouvel adapter
  pour le port concerné, le brancher dans `container.ts`. Ni le domaine ni l'interface ne changent.
- **Changer de framework d'interface** : domaine et stores sont en TypeScript pur ; un autre
  framework se branche sur `store.subscribe()` / `store.getState()`.
- **Application mobile** : `src/core` et `src/application` se réutilisent tels quels (par exemple
  avec React Native / Expo) ; il suffit de fournir des adapters mobiles (AsyncStorage…) et des
  écrans. L'étape naturelle est un monorepo `packages/core`, `apps/web`, `apps/mobile`.
- **Changer de fournisseur d'IA** (serveur) : implémenter `VisionProvider` (voir [08](08-serveur-api.md)).

## Arborescence

```
src/
  main.tsx                   Démarrage : service worker, historique, rendu
  core/                      Domaine métier pur (voir 03 et 04)
    shared/                  texte, YouTube, collections, ids, langue
    catalog/                 types, rôles, substitutions, catégories, migrations, seed/
    matching/                moteur « Warini chnowa ntayeb » + scénarios du chef
    planning/  grocery/  preferences/  theme/
  application/               Stores observables + ports (voir 05)
  infrastructure/            Adapters (voir 05)
    local/                   localStorage
    firebase/                Firestore, Firebase Auth
    http/                    API de notre serveur
  app/                       App, container, routes, layout/, providers/, navigation (voir 06)
  features/                  Un dossier par écran (voir 06 et 07)
  shared/                    paths, i18n/, hooks/, ui/
server.ts                    Point d'entrée serveur (voir 08)
server/                      app.ts, routes/, vision/, seo.ts, patronAuth.ts, firebaseAdmin.ts
scripts/                     diagnostics/ (rapport du moteur), build_brand.py (images)
docs/encyclopedie/           Cette documentation
```

## Principes SOLID appliqués

- **Responsabilité unique** : un module = un sujet. Le moteur de matching ne sait pas stocker,
  un store ne sait pas afficher, une page n'orchestre qu'un écran, un onglet du backoffice = un fichier.
- **Ouvert / fermé** : ajouter une base, un critère de tri, un filtre ou un fournisseur d'IA
  se fait en ajoutant du code, sans modifier l'existant.
- **Substitution de Liskov** : tout adapter respecte le contrat de son port (mêmes garanties, mêmes
  résultats `{ ok, error }`).
- **Ségrégation des interfaces** : des ports petits et ciblés (`CatalogRepository`,
  `KitchenRepository`, `ThemeRepository`, `VisionGateway`…) plutôt qu'un gros service.
- **Inversion des dépendances** : l'application dépend des ports ; les implémentations sont
  injectées par `container.ts` (et `server/app.ts` côté serveur).

## Règles de code

- **Pas de duplication** : une règle métier vit à un seul endroit dans `core/` et y est testée.
- **Fonctions du domaine pures** : pas d'horloge ni d'aléatoire cachés, on les injecte
  (`random`, `createId`, `today`).
- **Composants sans logique métier** : ils appellent le domaine ou un store.
- **Base de données d'abord** : les données partagées et les réglages vivent en base (Firestore) ;
  localStorage ne sert que de copie hors ligne ; un fichier JSON sert uniquement à exporter ou restaurer.
- **Toute nouvelle règle métier arrive avec ses tests** (`*.test.ts` à côté du fichier).
