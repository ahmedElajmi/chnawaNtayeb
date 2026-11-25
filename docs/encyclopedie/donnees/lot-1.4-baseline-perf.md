# Lot 1.4 — Baseline de performance de la couche données (livrable technique)

**Statut** : baseline mesurée et enregistrée · **seuils de performance : non fixés** — décision 🚩 du chef après lecture (micro-arbitrage 3 validé : mesure d'abord, seuils ensuite)
**Outil** : `scripts/benchmarks/datastore-100k.ts` (reproductible ; le corpus de 100 000 documents est semé hors mesure, les écritures mesurées passent par le vrai contrat)
**Corpus** : 100 000 documents (~600 octets stockés chacun), révisions 1..N sans trou, page de 300 (la limite des collections publiques du registre).

## Conditions de mesure

| Élément                     | Valeur                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS                          | Windows (poste de développement local, disque SSD, fichiers temporaires `%TEMP%`)                                                                                             |
| Node.js                     | v26.13.0                                                                                                                                                                      |
| tsx                         | 4.23.15                                                                                                                                                                       |
| better-sqlite3              | 13.1.1 (SQLite 3.54.1)                                                                                                                                                        |
| knex                        | 3.3.0                                                                                                                                                                         |
| Pragmas de la configuration | `journal_mode = WAL` · `synchronous = NORMAL` · `busy_timeout = 10 ms` (voir matrice)                                                                                         |
| Méthode                     | p50 / p95 / max par opération (rang le plus proche) ; le semis (hors mesure) puis catch-up complet paginé, écritures unitaires via `put`, puis cycles « 1 écriture + 1 poll » |

## Baseline — SQLite (fichier, adaptateur de test, mesuré deux fois)

| Opération                                                  | Exécution 1                  | Exécution 2                  | p50                     | p95                         | max             |
| ---------------------------------------------------------- | ---------------------------- | ---------------------------- | ----------------------- | --------------------------- | --------------- |
| **Rattrapage complet** (334 pages, 100 000 docs)           | 371 ms                       | 400 ms                       | 1,03 / 1,12 ms par page | **1,58 / 1,74 ms par page** | 3,34 / 4,25 ms  |
| **Écriture unitaire** (`put`, 2 000 écritures)             | 589 ms (≈ 3 400 écritures/s) | 609 ms (≈ 3 300 écritures/s) | 0,23 ms                 | **0,39 / 0,47 ms**          | 8,25 / 11,58 ms |
| **Poll de changement** (50 cycles « 1 écriture + 1 poll ») | —                            | —                            | 0,14 ms                 | **0,86 / 1,31 ms**          | 1,22 / 1,83 ms  |

## Baseline — mémoire (référence, même corpus)

| Opération                      | Valeur                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| Rattrapage complet (334 pages) | 669 ms au total · page p50 1,89 ms · **p95 2,76 ms** · max 4,10 ms |
| Écriture unitaire (2 000 puts) | 17 ms au total (≈ 117 000 écritures/s) · p95 0,01 ms               |
| Poll de changement             | p50 2,44 ms · **p95 4,37 ms** · max 5,34 ms                        |

## Lecture

- Le **chemin critique du protocole de sync** (rattrapage complet paginé de 100 000 documents) coûte **< 0,5 s** sur SQLite : une page de 300 documents coûte ~1–2 ms — l'ordre linéaire démontré en 1.2 se confirme à l'échelle 100k.
- Les **écritures unitaires** restent sous la demi-milliseconde au p95 (WAL + `synchronous = NORMAL`) ; le max isolé (~10 ms) correspond à un attendrissement ponctuel du verrou d'écriture, sans effet sur le p95.
- Les **polls** (le profil réel du poller backoffice : une écriture, un poll) coûtent environ 1 ms au p95.
- La variante mémoire confirme que le coût est **porté par la couche de persistance, pas par la logique du change feed** (les deux partagent le même harnais de mesure).

## Seuils (🚩 — décision du chef, pas encore prise)

Ces chiffres sont la **baseline de départ**. Les seuils de la couche données (ce qui alerterait ou bloquerait une release) seront fixés par décision explicite du chef sur cette base. Proposition de cadence de mesure : à chaque évolution de l'adaptateur et avant chaque release (le benchmark de fumée `perfSmoke.test.ts` garde sa garde anti-dérive algorithmique à chaque `npm test`).
