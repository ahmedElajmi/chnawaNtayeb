# Lot 1.4 — Matrice de capacités par moteur SQL (livrable technique)

**Statut** : livrée (lot 1.4, C2) · **statut par moteur explicite : « réellement testé » ≠ « analysé, non démontré »** — aucun moteur n'est déclaré compatible sans sa suite de contrat **et** sa suite de contention réellement exécutées (règle permanente `CLAUDE.md` § 8).
**Suites** : contrat `server/storage/contract.ts` (comportement) · contention `server/storage/contention.test.ts` (concurrence réelle) · performance `scripts/benchmarks/datastore-100k.ts` (baseline `lot-1.4-baseline-perf.md`).

## Vue d'ensemble

| Moteur                            | Statut                            | Contrat                               | Contention                                                 | Performance                    | Notes                                                                                             |
| --------------------------------- | --------------------------------- | ------------------------------------- | ---------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Mémoire (`memoryDataStore.ts`)    | **référence** — réellement testée | ✅ suite verte                        | ✅ suite verte (un adaptateur = un domaine de concurrence) | ✅ baseline enregistrée        | Blueprint que tout backend doit reproduire ; refusée en production                                |
| SQLite (better-sqlite3, via Knex) | **réellement testé**              | ✅ suite verte                        | ✅ suite verte (**deux connexions réelles parallèles**)    | ✅ baseline enregistrée (100k) | Adaptateur de test et run local (`DATA_STORE=sql`) ; la production reste la bascule globale (1.5) |
| PostgreSQL                        | **analysé, non démontré**         | écrit (branches Knex), jamais exécuté | ⛔ non exécuté                                             | ⛔ non mesuré                  | Suite conditionnelle prête (`TEST_SQL_CLIENT=pg TEST_SQL_DSN=…`)                                  |
| MySQL                             | **analysé, non démontré**         | écrit (branches Knex), jamais exécuté | ⛔ non exécuté                                             | ⛔ non mesuré                  | Idem (`TEST_SQL_CLIENT=mysql2`)                                                                   |
| SQL Server                        | **analysé, non démontré**         | écrit (branches Knex), jamais exécuté | ⛔ non exécuté                                             | ⛔ non mesuré                  | Idem (`TEST_SQL_CLIENT=mssql`)                                                                    |
| Tout autre moteur                 | —                                 | extensible sans modifier le métier    | —                                                          | —                              | nouveau fichier de test appelant les harnais existants                                            |

## SQLite — réellement testé (faits mesurés et vérifiés ce lot)

| Dimension                | Constat vérifié                                                                                                                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types                    | `id` TEXT (clé primaire) · `data` JSON (colonne JSON/TEXT du moteur) · `revision` INTEGER (index) · `updated_at` TEXT · `deleted` 0/1 — `ensureSchema` idempotent                                                                                                                              |
| JSON                     | Document stocké en colonne `data` ; requêtes d'égalité par `json_extract` (artefact de test, uniforme `id/data/revision`)                                                                                                                                                                      |
| Index                    | Index `(revision, id)` — l'ordre du contrat nativement indexable                                                                                                                                                                                                                               |
| Transactions             | `BEGIN`/`COMMIT` par Knex ; **rollback vérifié par test** (lot interrompu = zéro trace, séquence sans trou)                                                                                                                                                                                    |
| Contraintes              | Clé primaire disputée = `SQLITE_CONSTRAINT` (classe `unique_lost`) ; gardes conditionnelles au harnais                                                                                                                                                                                         |
| Pagination               | `ORDER BY revision, id` + limite souple (groupe d'égalités jamais coupé)                                                                                                                                                                                                                       |
| Concurrence              | **WAL** (les lecteurs ne bloquent jamais l'écrivain) · `synchronous = NORMAL` (pas de fsync par commit — une coupure secteur peut perdre les derniers commits ; survit à un crash d'application) · `busy_timeout = 10 ms` · **budget de rejeu partagé (3 rejeux, yield entre les tentatives)** |
| Révisions (verrouillage) | La révision est calculée **par l'instruction elle-même** (`MAX(revision)+1` évalué dans l'INSERT/UPDATE, au moment de la prise du verrou) — un écrivain concurrent ne peut jamais lire un maximum périmé ; le CAS sur la révision protège `transact`                                           |
| Classes de conflit       | `lock_lost` (SQLITE_BUSY, upgrade WAL refusé d'office — règle anti-deadlock de SQLite) · `unique_lost` (SQLITE_CONSTRAINT) · `cas_lost` (comparaison-et-échange perdu) — motifs dans l'adaptateur, vocabulaire partagé (`conflicts.ts`)                                                        |
| Migrations               | `ensureSchema` (Knex schema), idempotent, appelé au démarrage                                                                                                                                                                                                                                  |
| Performance              | Baseline enregistrée : rattrapage 100k < 0,5 s ; put p95 < 0,5 ms (voir `lot-1.4-baseline-perf.md`)                                                                                                                                                                                            |

**Découverte clé du lot (documentée ici et dans `conflicts.ts`)** : l'attente `busy` de better-sqlite3 est **synchrone** — elle bloque tout l'event loop, y compris le détenteur du verrou qui doit committer ; une longue attente créerait un deadlock garanti dans un processus unique. La configuration retenue (attente courte + budget de rejeu avec yield) résout la contention sans bloquer ; c'est la forme adaptée au moteur de l'exigence du plan (« les attentes des tests sont adaptées par moteur »).

## PostgreSQL — analysé, non démontré

| Dimension    | Analyse (à vérifier par la suite exécutée avant toute déclaration)                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types        | `id` TEXT PRIMARY KEY · `data` JSONB (binaire, indexable via GIN si besoin) · `revision` BIGINT · `updated_at` · `deleted` BOOLEAN                                                                                           |
| JSON         | Égalité par `data->>'field'` (branche déjà écrite dans l'adaptateur)                                                                                                                                                         |
| Transactions | MVCC, `READ COMMITTED` par défaut — **ne garantit pas** la sérialisation des écritures : la stratégie de verrouillage des révisions doit être **`SELECT … FOR UPDATE`** (verrou de ligne, plan § 1.4) ou une séquence dédiée |
| Contraintes  | Clé primaire ; codes `23505` (unicité) déjà dans le classifieur                                                                                                                                                              |
| Concurrence  | Codes `40001` (serialisation) et `40P01` (deadlock) déjà dans le classifieur ; contended write = ré-exécution au niveau d'isolation                                                                                          |
| Pagination   | `ORDER BY revision, id LIMIT n` — identique, index requis sur `(revision, id)`                                                                                                                                               |
| Migrations   | `ensureSchema` (Knex schema) — dialecte pg                                                                                                                                                                                   |
| À démontrer  | Suites contrat + contention vertes sur une instance réelle ; validation du verrou de révision (`FOR UPDATE`) ; baseline p95                                                                                                  |

## MySQL — analysé, non démontré

| Dimension    | Analyse                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types        | `id` VARCHAR(1500+) PRIMARY KEY (attention : utf8mb4, la limite d'index 3072 octets borne la clé) · `data` JSON · `revision` BIGINT · `deleted` TINYINT |
| JSON         | `JSON_UNQUOTE(JSON_EXTRACT(data, '$.field'))` (branche écrite)                                                                                          |
| Transactions | InnoDB, `REPEATABLE READ` par défaut ; verrou de ligne `FOR UPDATE` pour la révision                                                                    |
| Contraintes  | Clé primaire ; unicité = code `1062`, message « Duplicate entry » — couvert par le motif message du classifieur (à vérifier réellement)                 |
| Concurrence  | `1205` (lock wait timeout) dans le classifieur ; timeout de verrou configurable (`innodb_lock_wait_timeout`)                                            |
| Pagination   | `ORDER BY revision, id LIMIT` — index obligatoire                                                                                                       |
| Migrations   | `ensureSchema` (Knex)                                                                                                                                   |
| À démontrer  | Suites réelles + stratégie de révision + baseline                                                                                                       |

## SQL Server — analysé, non démontré

| Dimension    | Analyse                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types        | `id` NVARCHAR(1500) PRIMARY KEY · `data` NVARCHAR(MAX) + `JSON_VALUE` (branche écrite ; l'index JSON exige des colonnes calculées persistées — à concevoir si nécessaire) · `revision` BIGINT |
| JSON         | `JSON_VALUE(data, '$.field')`                                                                                                                                                                 |
| Transactions | Verrouillage par défaut ; `WITH (UPDLOCK, ROWLOCK)` pour la révision ; niveaux d'isolation différents (READ COMMITTED avec versioning selon config)                                           |
| Contraintes  | Codes `2627`/`2601` (unicité) dans le classifieur                                                                                                                                             |
| Concurrence  | `1205` (deadlock victim) dans le classifieur                                                                                                                                                  |
| Pagination   | `ORDER BY revision, id OFFSET/FETCH` — vérifier le plan et l'index                                                                                                                            |
| Migrations   | `ensureSchema` (Knex)                                                                                                                                                                         |
| À démontrer  | Suites réelles + stratégie de révision + baseline (colonne calculée pour l'index si le filtre JSON devient critique)                                                                          |

## Rappels permanents

- **SQL est une famille, pas un moteur** : le choix du moteur définitif reste **différé** et exige une **décision explicite** ; cette matrice ne préjuge de rien.
- JSON en colonne `data` est **l'artefact de test** du harnais générique (`sqlStore.ts`, en-tête du fichier) — la **production SQL** visera l'**implémentation relationnelle par domaine** (arbitrage n° 5 du lot 1.2 : transformation relationnelle à la bascule). La matrice décrit le harnais, pas la cible de production.
- Tout moteur ajouté : mêmes suites (contrat + contention), même baseline — **vert avant déclaration**.
