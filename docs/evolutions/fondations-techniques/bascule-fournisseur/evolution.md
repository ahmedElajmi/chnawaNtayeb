---
domaine: bascule-fournisseur
niveau: dossier d'évolution (2 + 3)
nature: dossier.md — contrats DataStore, matrice de capacités, migration
statut: consolidé Étape B ; sources transférées dans `analyses/` (Étape C) puis supprimées de leurs anciens emplacements au nettoyage autorisé, après contrôle de non-perte
autorité: analyses/ (dossiers lot-1.3/1.4/1.5 transférés, Étape C) + code vérifié au 21/11/2026
compléments: analyses/ — voir § 6
---

# K-2 — Bascule fournisseur (DataStore) : dossier consolidé

> Consolidation Étape B. **Sources transférées** dans `analyses/` (Étape C), puis supprimées de
> leurs anciens emplacements au nettoyage autorisé, après contrôle de non-perte. **Échelle de statuts** appliquée comme pour K-1 : décision acceptée ≠ code présent
> non commité ≠ tests exécutés ≠ code commité ≠ livré.

## 1. Fiche de contexte

L'architecture isole le stockage derrière le contrat `DataStore` (source de vérité) et des ports
applicatifs ; un seul fournisseur actif à la fois (Firestore aujourd'hui), jamais de mode hybride.
La cible SQL est **une famille de bases relationnelles, pas un moteur désigné** : le choix du moteur
définitif (PostgreSQL, MySQL, SQL Server, autre) est **différé** et exige une décision explicite.
Règle permanente (CLAUDE.md) : sémantique identique sur les deux fournisseurs ; **un dialecte
implémenté ou une compatibilité théorique n'est jamais une preuve de compatibilité** ; JSON réservé
aux échanges/imports/exports, jamais substitut au relationnel.

## 2. Contrats et mécanismes en vigueur

| Contrat | Règle | Autorité |
|---------|-------|----------|
| Harnais de contrat exécutable | `describeDataStore` (`server/storage/contract.ts`) : comportement commun à tout backend — concurrence sur un document (transacts concurrents fusionnés sans perte), gardes conditionnelles (course perdue propre), curseur de sync `(revision, id)` avec départage par id, curseur de répertoire `DirectoryQuery.after` | code (modifié, non commité — X-18) ; lots 1.2–1.4 |
| Curseurs | Sync = change feed `(revision, id)` (reprise exacte d'un groupe d'égalités), testé **sous contention** ; répertoire = garantie **par requête** (G-DIR, précisée à la demande du chef — aucun mécanisme nouveau) | `lot-1.4-mecanismes-transversaux.md` § 1, § 4-C4 |
| Écritures | Objet modifié = **écrit en entier, sans fusion, sans `undefined`** ; `revision` = heure serveur ; suppression = marque `deleted` (tombstone) ; rejeu ≤ **3** après la tentative initiale, au-delà = **erreur de stockage explicite** (contention anormale = signal, pas boucle silencieuse) | lots 1.2–1.4 (micro-arbitrages validés) |
| Sélection du fournisseur | Variable unique `DATA_STORE=firestore\|sql\|memory` dans `server/app.ts` (remplace `LOCAL_MEMORY_STORE`, sans alias de compatibilité — variable interne de développement) ; mode SQL local : une seule variable `SQLITE_PATH` (better-sqlite3) | `lot-1.3-cadre-adaptateurs.md` § 2, § 7 (validés) |
| Couplages résorbés | `zéro import du SDK Firebase hors firebaseAdmin.ts + firestoreStore.ts` (critère mesurable) ; `seo.ts` branché sur un **port étroit en lecture seule** (changes borné aux 3 collections publiques) ; `verifyEmployeeRights` via le contrat ; garde statique sur `server/**` hors `*.test.ts` (les tests gardent leurs imports SDK — réserve 1.5) | lot 1.3 (micro-arbitrages validés) |
| Verrouillage des révisions | Stratégie par moteur posée au lot 1.4 (le commentaire de `stamp` dans `sqlStore.ts` la renvoyait à ce lot) ; SQLite : WAL + `synchronous = NORMAL` (compromis maintenu, **à réexaminer à la décision de bascule**) | lot 1.4 |
| Protocole de version B22-07 | `X-Kitchen-Protocol-Version`, fail-closed, `SUPPORTED_PROTOCOL_VERSIONS = ['1']` — détail complet dans `docs/evolutions/donnees-moteur/stock-entrees-sync/` (K-1) | `server/protocolVersion.ts` (non suivi — X-18) |

## 3. Matrice de capacités par moteur SQL

Source : `lot-1.4-matrice-capacites.md` (livrée, C2). **Statut par moteur explicite : « réellement
testé » ≠ « analysé, non démontré »** — aucun moteur n'est déclaré compatible sans sa suite de
contrat **et** sa suite de contention réellement exécutées.

| Moteur | Statut | Notes |
|--------|--------|-------|
| Mémoire (`memoryDataStore.ts`) | **référence** — réellement testée | blueprint que tout backend doit reproduire ; refusée en production |
| SQLite (better-sqlite3 via Knex) | **réellement testé** (contrat ✅ + contention ✅ deux connexions réelles + baseline 100k ✅) | adaptateur de test et run local (`DATA_STORE=sql`) ; la production reste la bascule globale (1.5) |
| PostgreSQL / MySQL / SQL Server | **analysés, non démontrés** (suites écrites, jamais exécutées) | exécution **conditionnelle à la disponibilité d'une instance** (`TEST_SQL_CLIENT=pg|mysql2|mssql`) — aucun moteur privilégié, choix du moteur définitif différé |
| Tout autre moteur | extensible sans modifier le métier | nouveau fichier de test appelant les harnais existants |

SQLite (faits vérifiés) : `id` TEXT (clé primaire) · document en colonne `data` JSON/TEXT ·
`revision` INTEGER (index) · `updated_at` TEXT · `deleted` 0/1 · `ensureSchema` idempotent ·
requêtes d'égalité par `json_extract` (artefact de test, uniforme `id/data/revision`).
⚠️ **Écart architectural enregistré** : la persistance en colonne `data` JSON est une préparation,
pas le relationnel définitif — la cible exige des tables dédiées par domaine (règle CLAUDE.md § 9).

## 4. Baseline de performance (livrée — seuils non fixés)

Source : `lot-1.4-baseline-perf.md`. Corpus 100 000 documents (~600 o chacun, révisions 1..N sans
trou, page de 300). Outil reproductible : `scripts/benchmarks/datastore-100k.ts` (semis hors mesure,
écritures mesurées par le vrai contrat). Résultats (Windows local, Node v26.13.0, SQLite 3.54.1 via
better-sqlite3 13.1.1, knex 3.3.0 — mesuré deux fois) :

- Rattrapage complet paginé de 100 000 documents (chemin critique du protocole de sync) : **< 0,5 s** ; une page de 300 ≈ 1–2 ms.
- Écritures unitaires : **< 0,5 ms au p95** (WAL + `synchronous = NORMAL`) ; max isolé ~10 ms (attendrissement ponctuel du verrou, sans effet p95).
- Polls (profil réel du poller backoffice) : ~1 ms au p95.
- La variante mémoire confirme que le coût est porté par la couche de persistance, pas par le change feed.

**Seuils de performance : non fixés** — décision 🚩 du chef après lecture (micro-arbitrage 3
validé : mesure d'abord, seuils ensuite ; recoupe D13 : « seuils à partir de mesures réelles
reproductibles »).

## 5. Lot 1.5 — répétition générale (REPORTÉ, **obligatoire**)

Source : `lot-1.5-repetition-generale.md`. Décision du chef : le lot **reste obligatoire**
(procédure complète Firestore → SQL + retours arrière A et B) mais sera réalisé **sur des modèles
stabilisés et représentatifs de l'architecture cible**. Séquencement validé : **5b** (stabilisation
des modèles) → **préparation 6a** (mapping de migration) → **1.5** (répétition générale complète,
comparaison exhaustive zéro écart, retours arrière A [immédiat] et B [après usage réel de SQL, y
compris un appareil hors ligne avec écritures en attente], mesure de la fenêtre de gel) → **6a**
(migration définitive, uniquement après validation du 1.5) → **1.6** (opérations de bascule).
La bascule en production reste une **décision explicite distincte, jamais automatique**.
**Réserve activée** : les 22 tests Firestore ignorés (suite émulateur de 1.2) sont exécutés dans ce lot.
Faits structurants vérifiés : collection interne `_sync_meta` (compteurs de révisions) fait partie de
la cartographie ; le contrat `get` **cache** les tombstones côté SQL mais les expose sur
Firestore/mémoire (l'export et la comparaison lisent **au niveau du stockage**, jamais via le
contrat) ; `/api/data/:name/replace` ré-estampe les révisions (**inutilisable** pour un import
fidèle — l'import préserve les révisions d'origine) ; aucun outil de migration n'existe encore ;
après un retour tardif, l'adaptateur estampe à `max(horloge, maxImporté + 1)` (monotonie testée).
Règle à formaliser **à la validation du 1.5** : chaque évolution de modèle sera évaluée au regard de
la portabilité Firestore/SQL et des retours arrière.

## 6. Statuts (échelle à 5 niveaux) et sources

| Élément | Niveau | Preuve |
|---------|--------|--------|
| Cadre d'adaptateurs (1.3) validé et clôturé | **4. code commité** | commit `22a6976` (cité par 1.4) ; 1.2 = `67cce86` ; 1.4 = `d860a68` |
| Matrice + baseline (1.4) livrées | **4. code commité** | commit `d860a68` |
| Harnais de contrat courant (`contract.ts` modifié) | **2. code présent, non commité** | `git status` lecture seule (X-18) |
| Suites de contrat exécutées (memory + SQLite) | **3. tests exécutés** | lots 1.2–1.4 |
| Lot 1.5 | **REPORTÉ, obligatoire** | dossier conservé comme référence |
| Choix du moteur définitif, seuils de perf, bascule production | **OUVERTS** (décisions distinctes du chef) | 🚩 |

**Terminologie (précision du chef)** : les commits des lots 1.1–1.4 (`67cce86`, `22a6976`,
`d860a68`) sont **locaux, non poussés** vers le dépôt distant (17 commits en attente, X-18) ;
**aucun déploiement en production** n'est en cause dans ce périmètre — un push n'est jamais
assimilé à une livraison (voir `../../donnees-moteur/stock-entrees-sync/evolution.md` § 2).

**Sources transférées** : `lot-1.3-cadre-adaptateurs.md`, `lot-1.4-matrice-capacites.md`,
`lot-1.4-mecanismes-transversaux.md`, `lot-1.5-repetition-generale.md` — quatre documents, corps
intégraux dans `analyses/` de ce dossier (présence vérifiée), consultables ; anciens emplacements
supprimés au nettoyage autorisé, après contrôle de non-perte ; les règles et contraintes utiles
sont consolidées ci-dessus. **`lot-1.4-baseline-perf.md` n'est pas transférée** : elle reste
protégée à son emplacement initial (`docs/encyclopedie/donnees/`, arbitrage A.2). Le livrable v2.3
(`docs/encyclopedie/donnees/audit-phase-a-matrice-documentaire.md`) avait classé ces quatre
documents « CONSERVER COMME SOURCE → destinations Étape C » : ce classement **a été exécuté pour
eux** ; la baseline protégée n'est pas concernée.
