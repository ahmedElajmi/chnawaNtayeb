# Encyclopédie de Chnowa Ntayeb

Documentation complète du projet : ce que fait l'application, comment le code est organisé,
comment chaque partie fonctionne, et comment la faire évoluer.

## Sommaire

| #   | Page                                                | Contenu                                                                  |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| 01  | [Produit](01-produit.md)                            | L'application, ses écrans, ses utilisateurs, le vocabulaire              |
| 02  | [Architecture](02-architecture.md)                  | Couches, règles de dépendances, arborescence, principes SOLID            |
| 03  | [Domaine métier](03-domaine.md)                     | `src/core` : catalogue, rôles, substitutions, menu, courses, thèmes      |
| 04  | [Moteur de matching](04-moteur-matching.md)         | « Warini chnowa ntayeb » : étapes, réglages, scénarios du chef           |
| 05  | [Application et données](05-application-donnees.md) | Stores, ports, adapters, où et comment les données sont stockées         |
| 06  | [Interface](06-interface.md)                        | Routes, navigation, bouton retour, langues, thèmes, PWA, mobile          |
| 07  | [Backoffice patron](07-backoffice.md)               | `/patron` : accès, onglets, onglet Moteur, publication                   |
| 08  | [Serveur et API](08-serveur-api.md)                 | Express, routes, sécurité, scan photo (IA), SEO                          |
| 09  | [Qualité et tests](09-qualite-tests.md)             | Scripts, types de tests, lint, formatage, conventions                    |
| 10  | [Exploitation](10-exploitation.md)                  | Variables d'environnement, lancement, déploiement, Firebase, dépannage   |
| 11  | [Guides pratiques](11-guides-pratiques.md)          | Recettes pas à pas : ajouter un écran, un plat, un adapter, un scénario… |
| 12  | [Recherche](12-recherche.md)                        | Moteur de recherche (MiniSearch), étude des moteurs, lectures de la base |
| 13  | [Comptes](13-comptes.md)                            | Clients, employés, patron, profils, téléphone/adresse, pays, employés    |
| 14  | [Refonte du backoffice](14-refonte-backoffice.md)   | Plan : nouveau /patron, workflow de validation, workflows configurables  |

## Démarrage rapide

```bash
npm install
```

```bash
npm run dev
```

L'application tourne sur http://localhost:3000. Avant chaque commit :

```bash
npm run check
```

## Par où commencer

- **Découvrir le projet** : [01 Produit](01-produit.md) puis [02 Architecture](02-architecture.md).
- **Modifier les suggestions de recettes** : [04 Moteur de matching](04-moteur-matching.md).
- **Ajouter une fonctionnalité** : [11 Guides pratiques](11-guides-pratiques.md).
- **Mettre en production** : [10 Exploitation](10-exploitation.md).
- **Branches, PR et versions** : [09 Qualité et tests](09-qualite-tests.md#branches-et-versions).
