# Dossier de réalisation — Lot 2.6.0 « Socle » (rapport étape 0 inclus)

**Statut : PROPOSÉ — aucune modification de code avant validation du chef.**
Ce dossier suit le cycle obligatoire : présentation → validation → réalisation → rapport → validation.
Il couvre l'étape 0 demandée (vérifications préalables) puis le périmètre du lot 2.6.0.

---

## Partie A — Rapport d'étape 0

### A.1 `npm run check` — résultat documenté (exécuté le jour de l'ouverture)

| Étape                      | Résultat | Détail                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck` (tsc --noEmit) | ✅ vert  | —                                                                                                                                                                                                                                                                                                                                                                            |
| `lint` (oxlint)            | ❌ échec | **Uniquement des fichiers des maquettes** `docs/encyclopedie/mockups/d3/` et `d4/` (benchmark JSX et assets de démonstration : variables inutilisées, réassignations de démo graphique). Le seul signal hors maquettes est un _warning_ préexistant `KitchenSync.test.ts:106` (no-shadow, non bloquant). Le typecheck vert prouve que le code applicatif et serveur est sain |
| `format:check` (prettier)  | ❌ échec | Mêmes fichiers de maquettes + les 2 documents d'audit récents (`audit-preparation-implementation.md`, `plan-consolide-pre-implementation.md`) — espaces de tableaux uniquement                                                                                                                                                                                               |
| `test` (vitest)            | ✅ vert  | **91 fichiers, 822 tests passés, 29 ignorés** (suite émulateur Firestore proprement skippée sans émulateur ; aucun échec)                                                                                                                                                                                                                                                    |

**Cause** : `.oxlintrc.json` et `.prettierignore` n'excluent pas les maquettes (`docs/encyclopedie/mockups/`), qui ne sont pas du code d'application et n'ont jamais été destinées à passer lint/format.
**Correctif proposé** (config uniquement, aucune ligne de code) : ajouter `docs/**` aux
`ignorePatterns` d'oxlint ; ajouter `docs/encyclopedie/mockups` à `.prettierignore` (la
documentation `.md` reste, elle, formatée par Prettier comme le reste de l'encyclopédie) ;
passer `prettier --write` sur les documents d'audit/plan récents.

### A.2 État Git et modifications non intégrées

- Branche courante : `feature/datastore-contract` (à jour avec origin).
- `develop` est resté au PR #44 (liste de courses depuis le catalogue) : **les 17 commits de cette
  branche — y compris les lots 1.1–1.4 (DataStore, adaptateurs, mécanismes transversaux, baseline)
  et les corrections comptes/sync/PWA — ne sont ni fusionnés dans `develop`, ni dans `master`**.
- Fichiers non suivis (8 entrées) : `docs/encyclopedie/mockups/d3/`, `d4/`,
  `chnawa-ntayeb-maquettes-d4.zip`, et 5 documents (`audit-preparation-implementation.md`,
  `audit-annexe-perimetre-architecture-frontend.md`, `audit-annexe-evolutivite-mobile.md`,
  `lot-2.1-conception-d3-partie1.md`, `plan-consolide-pre-implementation.md`).
- Aucune modification de code en attente (`src/` et `server/` propres).

**Proposition d'intégration** (à valider, aucun commit sans autorisation) :

| Élément                          | Proposition                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `mockups/d3/` + `mockups/d4/`    | **Committer** — référence UX/UI validée, dossier d'audit 2.1 et D4 ; `benchmark/node_modules` déjà exclu par le `.gitignore` global |
| `chnawa-ntayeb-maquettes-d4.zip` | **Exclure** — artefact dérivé et reproductible depuis `d4/` ; ajout d'une ligne `docs/encyclopedie/mockups/*.zip` au `.gitignore`   |
| 5 documents d'audit/plan         | **Committer** après passage Prettier                                                                                                |
| Config lint/format (A.1)         | **Committer** avec le lot (elle rend `npm run check` vert, prérequis de tout commit)                                                |

Séquencement proposé : 1 commit « docs: commit D3/D4 mockups and audit documents with lint/format config for docs » (ou deux si préféré : config d'abord, contenu ensuite).

### A.3 Présent dans le code / couvert par les tests / déployé

| Niveau                         | État                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Présent dans le code (branche) | Phase 1 complète (DataStore + adaptateurs + mécanismes transversaux + baseline 100k), corrections comptes atomiques/sync/PWA, architecture CMS documentée, application v1 complète (catalogue, frigo, courses, planning, comptes, recherche, back-office, SEO, PWA)                                                      |
| Couvert par les tests          | 822 tests verts : cœur métier, moteur, sync (faux adapters), contrat DataStore sur SQLite/mémoire, contention, application, écrans. Suite émulateur Firestore : 29 ignorés sans émulateur (jamais un faux vert)                                                                                                          |
| Déployé en production          | **Non pour la phase 1** : `feature/datastore-contract` n'est pas fusionnée ; `develop`/`master` tournent sans les lots 1.x. L'application publique en production est la version antérieure. Le déploiement réel des serveurs n'est pas vérifiable depuis l'environnement d'audit — à confirmer par le chef si nécessaire |

### A.4 Blocages avant le premier lot

- **Aucun blocage technique** : `npm run check` et la suite de tests s'exécutent ; les seules
  opérations restées indisponibles pendant l'audit (certaines commandes de la couche de revue de
  l'environnement) sont sans effet sur le lot.
- Dépendance externe : fusion de la branche vers `develop` (PR) — recommandée **après** le lot
  2.6.0, pour embarquer les correctifs de config (A.1) dans la même revue. À décider par le chef.

---

## Partie B — Dossier de réalisation du lot 2.6.0

### B.1 Objectif

Poser les fondations d'architecture validées (T1, T2, T4) : rendre `src/application` indépendante
des API navigateur, l'asseoir dans la garde d'architecture, et écrire la règle « SDK fournisseur
isolé derrière port ». **Aucun changement visible, aucun changement métier, aucune migration de
données.** C'est le lot le plus petit possible, condition d'entrée propre de la rail client.

### B.2 Périmètre exact

| #   | Contenu                                                         | Vise                                                                          |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | **T1** — injection du cycle de vie de l'hôte dans `KitchenSync` | Supprimer les derniers `window`/`document` de `src/application`               |
| 2   | **T2** — extension de la garde d'architecture                   | Interdire les globals navigateur dans `src/application` (imports déjà gardés) |
| 3   | **T4** — règle « SDK fournisseur isolé derrière port »          | Écrite dans la garde + la documentation                                       |
| 4   | Hygiène étape 0                                                 | Config lint/format (A.1) + intégration Git (A.2)                              |

**Hors périmètre** : T3 (voir B.8 — lot dédié), toute évolution d'interface, tout modèle de
données, tout seuil ou borne du moteur, tout lot 2.6.x suivant.

### B.3 Modifications envisagées, fichier par fichier

**T1 — port + adaptateur**

1. `src/application/ports.ts` : nouveau port `HostLifecycle` (vocabulaire du domaine, aucun type
   DOM) —
   - `defer(fn, ms): () => void` (temporisateur annulable — remplace `window.setTimeout/clearTimeout`) ;
   - `subscribeVisibility(onHidden, onVisible): () => void` (remplace `visibilitychange` + `pagehide`) ;
   - `isHidden(): boolean` (remplace `document.visibilityState`).
2. `src/infrastructure/host/browserHostLifecycle.ts` : adaptateur navigateur (unique endroit où
   `window`/`document` restent légaux pour ce besoin), imlémentant exactement les déclencheurs
   actuels (`visibilitychange`, `pagehide`, `visibilityState`).
3. `src/application/kitchen/KitchenSync.ts` : `KitchenSyncDeps` gagne `host: HostLifecycle` ; les
   7 points d'usage (`document.addEventListener/removeEventListener` ×2, `window.addEventListener`
   ×2, `window.setTimeout/clearTimeout` ×3, `document.visibilityState`) passent par le port.
   **Comportement identique** : débouche push 2 s, flush à la mise en arrière-plan, pull au retour
   de visibilité (plafond 60 s), timers annulés à `stop()` et au changement de compte.
4. `src/app/container.ts` : câblage unique de l'adaptateur (seul endroit autorisé).

**T2 — garde** 5. `src/core/architecture.test.ts` : la vérification « browser APIs » actuelle (limitée à
`src/core`) est étendue aux fichiers sources de `src/application`, avec le même jeu
`FORBIDDEN_GLOBALS` ; les adaptateurs d'infrastructure restent explicitement exemptés
(description du test le précise). Passe vert **grâce à T1** — ordre d'implémentation : T1 → T2.

**T4 — règle** 6. La règle est écrite une fois et vérifiable : extension de la description des tests de garde
(aucun SDK fournisseur direct dans `src/core`/`src/application` — un SDK nécessaire vit dans
`src/infrastructure/<techno>/`, derrière un port, remplaçable) + mention dans
`docs/encyclopedie/02-architecture.md` et la ligne correspondante de `CLAUDE.md`.

**Hygiène** 7. `.oxlintrc.json` (+ `docs/**`), `.prettierignore` (+ `docs/encyclopedie/mockups`),
`.gitignore` (+ `docs/encyclopedie/mockups/*.zip`), Prettier sur les documents d'audit. 8. Au passage (fichier touché par T1) : suppression du _warning_ no-shadow de
`KitchenSync.test.ts:106`.

### B.4 Fichiers et couches concernés

| Couche               | Fichiers                                                                                                | Nature           |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ---------------- |
| `src/application`    | `ports.ts`, `kitchen/KitchenSync.ts`                                                                    | port + injection |
| `src/infrastructure` | `host/browserHostLifecycle.ts` (nouveau)                                                                | adaptateur       |
| `src/app`            | `container.ts`                                                                                          | câblage          |
| tests                | `architecture.test.ts`, `KitchenSync.test.ts`                                                           | garde + harnais  |
| config/docs          | `.oxlintrc.json`, `.prettierignore`, `.gitignore`, `02-architecture.md`, `CLAUDE.md`, documents d'audit | hygiène + règle  |

`src/core` : **non touché**. `server/` : **non touché**. Aucune dépendance npm nouvelle.

### B.5 Dépendances et impacts

- T2 dépend de T1 (ordre interne) ; le lot ne dépend d'aucun autre.
- Impacts fonctionnels : **aucun** — mêmes déclencheurs, mêmes durées, mêmes garde-fous de scope
  (les protections anti-réponses périmées existantes sont conservées telles quelles).
- Impacts tests : le harnais `KitchenSync.test.ts` remplace `vi.stubGlobal('window'/'document')`
  par un faux `HostLifecycle` injecté — plus déterministe (timers contrôlés manuellement) et
  conforme à la nouvelle garde.

### B.6 Tests et scénarios de non-régression

1. Nouveaux/renforcés : garde d'architecture sur `src/application` (T2) ; tests `KitchenSync`
   réécrits sur le port injecté — conservés : flush à l'arrière-plan, pull plafonné au retour,
   annulation des timers à `stop()`/changement de compte, anti-réponses périmées.
2. Suite complète verte (822+ tests).
3. Vérifications manuelles post-lot (serveur de dev) : démarrage, connexion → sync du frigo,
   modification → push ~2 s, mise en arrière-plan → flush, retour → pull ; hors ligne → échec
   silencieux gardé en attente, retry au retour. Tableau de vérification coché dans le rapport.
4. `npm run check` intégralement vert (y compris lint/format après A.1).

### B.7 Critères d'acceptation

1. `src/application` ne contient plus aucun usage direct de `window`/`document` — vérifié par la
   garde (test au vert), pas seulement par convention.
2. Le comportement de synchronisation est inchangé (tests + vérification manuelle).
3. `npm run check` vert de bout en bout, documenté.
4. La règle T4 est écrite (garde + docs) et lisible.
5. État Git intégré selon A.2 (maquettes + documents commités, zip exclu).
6. Rapport de lot remis (réalisé, tests, mesures si utile, écarts éventuels) avant validation.

### B.8 T3 (contrats API) : recommandation — **lot dédié juste après 2.6.0, pas dans 2.6.0**

Justification concrète :

1. **Aucun consommateur n'en a besoin avant les écrans** : le shell 2.6.1 consomme les stores de
   `src/application`, pas les adaptateurs HTTP ; un refactoring sans changement pilotant serait
   un risque sans bénéfice immédiat.
2. **Attribution de la non-régression** : 2.6.0 contient déjà une extension de garde + une
   injection ; y ajouter la migration de ~19 adaptateurs HTTP brouillerait l'analyse de tout
   incident éventuel (même semaine, mêmes préoccupations transversales).
3. **Le cycle § 19 s'applique mieux à un lot dédié** : T3 mérite ses propres tests de contrat HTTP
   par domaine, son propre rapport, son propre retour arrière.

**Périmètre prévu (dossier séparé)** : module `src/infrastructure/http/contracts` (types DTO,
codes d'erreur normalisés, chemins d'endpoints centralisés, en-têtes d'authentification), sans
aucune dépendance inverse (pas de dépendance circulaire), migration **par domaine** (auth, sync,
collections, admin) chacune avec son test de contrat HTTP, aucun changement de comportement.
Fait dès que vous validez — avant ou en parallèle de 2.6.1, au choix.

### B.9 Risques et retour arrière

| Risque                                                             | Maîtrise                                                                         | Retour arrière                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Câblage du `HostLifecycle` incorrect (déclencheurs de sync perdus) | Harnais sur faux port + vérification manuelle B.6.3                              | 1 commit unique, revert sans effet de bord (pas de données ni de schéma) |
| Prettier reformate plus que prévu les documents                    | Diff relisible, tableaux inchangés sur le fond                                   | Revert du commit docs                                                    |
| Exclusion lint `docs/**` trop large                                | Justifiée : les maquettes ne sont pas du code d'app ; les `.md` restent formatés | Ajustement de l'ignore dans un commit suivant                            |

### B.10 Prochaine étape (après validation)

Implémentation dans l'ordre T1 → T2 → T4 → hygiène, `npm run check` vert, rapport de lot, puis —
sur votre validation — dossier du lot suivant (2.6.1 Identité & shell, avec le choix visuel de la
direction C soumis séparément, ou 2.6.0 bis Contrats API si vous préférez l'anticiper).
