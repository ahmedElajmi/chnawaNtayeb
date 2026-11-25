---
domaine: synchronisation-cuisine
niveau: preuve (3)
nature: annexes/preuves.md — constantes exactes, campagnes, payloads mesurés
statut: retranscription de sécurité Étape B (code porteur non commité — X-18)
autorité: code vérifié en lecture seule (21/11/2026) + dossiers F1 validés
---

# Annexe preuves — K-1 synchronisation cuisine

## 1. Constantes exactes (code vérifié, lecture seule)

`src/core/kitchen/entries.ts` l. 127-141 (`STOCK_LIMITS`) :

| Constante | Valeur | Note du code |
|-----------|--------|--------------|
| `entries` | **300** par emplacement | alignée sur la cap legacy `added` |
| `tombstones` | **2 000** (stock entier) | alignée sur la cap legacy `removed` |
| `id` | **1 000** caractères | le pire cas échappé reste sous la garantie commune de 1 500 octets ; les vrais ids `ing_*` ne sont jamais échappés |
| `note` | **300** | même borne que la cap note existante du serveur |
| `unit` | **32** | — |
| `quantity` | **1 000 000** | borne supérieure anti-abus d'une quantité finie positive |

`src/core/kitchen/elementSets.ts` (`ELEMENT_SET_LIMITS`, rétention) :

| Constante | Valeur |
|-----------|--------|
| `added` | 300 (éléments présents simultanément, par section) |
| `removed` | 2 000 (tombstones par section, dans la fenêtre de rétention) |
| `id` | 200 caractères |
| `device` | 64 caractères |
| `SET_SECTIONS` | `['favorites', 'fridge', 'pantry']` |
| `TOMBSTONE_RETENTION_MS` | 90 × 24 × 60 × 60 × 1000 = **90 jours** |
| `STALE_DEVICE_MS` | rétention − 7 jours = **83 jours** (marge de décalage d'horloge) |
| `RESERVED_SYNC_DEVICE` | `'server'` — disjonction structurelle avec les vrais ids d'appareils (tiret toujours présent) |

`server/storage/validation.ts` l. 19 — codes de refus du serveur :
`'invalid_document' | 'invalid_id' | 'commit_too_large' | 'sync_counter_corrupt'`.

`server/protocolVersion.ts` (B22-07, **non suivi** — X-18) :
`PROTOCOL_VERSION_HEADER = 'X-Kitchen-Protocol-Version'` ·
`PROTOCOL_STATUS_HEADER = 'X-Kitchen-Protocol-Status'` ·
`PROTOCOL_STATUS_RECONCILIATION_REQUIRED = 'reconciliation-required'` ·
`SUPPORTED_PROTOCOL_VERSIONS = ['1']` (évolution du jeu de versions **ouverte**, arbitrage P3) ·
version : composants entiers ≤ 3, ≤ 6 chiffres chacun, en-tête ≤ 32, motif `^[0-9]+(\.[0-9]+)*$` ·
fail-closed : version non supportée = écriture refusée ; lecture tolérée signalée
`reconciliation-required` ; requête non authentifiée jamais classée ici (les handlers répondent 401).

`server/app.ts` l. 65 (**modifié, non commité** — A1) :
`KITCHEN_BODY_LIMIT = '3mb'` = **3 145 728 octets** ; `A1_LIMIT_BYTES = 3_145_728`.
Limite de production historique sur `/api/kitchen` : **100 Kio** (cause racine du constat 413).

## 2. Mesures et campagnes (rapports validés/soumis)

| Campagne | Résultat clé | Source |
|----------|--------------|--------|
| M1a (tailles JSON + estimation Firestore) | pire cas contractuel du PUT kitchen = **747,7 Kio** | `lot-F1-etape3-rapport.md` § mesures |
| M1b (tombstones) | 300 entrées + 500 tombes = 531,8 Kio ; 300 + 2 000 = **1 453,2 Kio** ; 600 + 2 000 = 1 661,7 Kio ; **coût par tombstone ≈ 0,6143 Kio** ; base 600 entrées ≈ **433,1 Kio** ; budget Firestore 1 Mio = 1 024 Kio, marge 20 % = 819,2 Kio → **plafond défendable ≈ 628 tombstones** (calcul E4 corrigé) | `lot-F1-corrections-dossier.md` § 6 |
| M2 / M3 / M4 / M5 | fusion tombstones 500/2 000 (SET 2 000) · chargement local pire cas · projection · push/pull isolés + C2/C3/C5 multi-appareils | étape 3 |
| B1a–B1d, B2, B4 | caps une à une puis combinées (refus 400 + document intact + client pending) · convergence 2 appareils à volume max · isolation comptes | étape 3 |
| D1, D3, D4 | conversion legacy via le vrai serveur · appareil périmé > 83 j (perte des pendings documentée, aucune résurrection) · cycle export→import→sync | étape 3 |
| Fullcaps A1 | **C1 = 2 435 950 octets, HTTP 200** (toutes sections à caps maximales, projection cohérente) ; marges exactes **C1 +29,13 %, C2 +22,50 %** vs `'3mb'` | `lot-F1-A1-mesure-fullcaps*.md` |
| A2 (émulateur, 20/11) | 1 090 passés / 1 échec restant = A3 / 8 skippés / 113 fichiers — aucun échec A2 | `lot-F1-lot-A2-dossier.md` |
| Run du 21/11 | **385 suites, 1 107 passés, 0 échec, 8 en attente** (`a1debug.test.ts` inclus) | `.vitest/json/output.json` (399 364 o, F-05) |

## 3. Trouvailles sans cap structurel (fullcaps complément — non retranscrites ailleurs)

- `preferences` : acceptée par la route comme **objet libre** (aucune cap structurelle vérifiée).
- `pantryStaples` : **sans cap mesurée** au volume catalogue (700 ingrédients).
- `unit` : bornée à 32 mais borne **non atteignable** dans le registre réel.
- Ids de stock de 1 000 o admissibles, jamais observés.
- Consigne de l'arbitrage : « un dossier d'arbitrage devra noter ces champs sans cap » — **restent ouverts**.

## 4. Anomalie de troncature silencieuse (X-17 — correctif jamais autorisé)

Perte constatée de `st_fridge_ing0299` sans serveur (`tmp-toggle-debug.ts`, `LOT_F1_TRACE=1`) :
600 actifs + 2 000 tombes, toggle d'un ingrédient. Cause racine **A4** : les gardes de caps
(`withinStockCaps`, `parseVersionMap` : added 300 / removed 2 000) sont appliquées **à la relecture
de l'état propre de l'appareil** et pas seulement aux données externes ; la relecture refuse/ampute,
`doc()` retombe sur la reconstruction legacy → perte silencieuse. Fichiers :
`src/infrastructure/local/storage.ts` (`getKitchenDoc`), `src/core/kitchen/entries.ts`
(`parseStockSection` l. 524-532), `src/core/kitchen/elementSets.ts` (`parseVersionMap` l. 188-205),
`src/infrastructure/local/localRepositories.ts` (`doc`, `saveStock`, `buildStockFromLegacy`).
Le code de détection vit dans `scripts/diagnostics/measure-lot-F1.ts` (sous-commandes de campagnes).

## 5. Causes racines A2 / A3 (corrections validées et clôturées 20/11)

- **A2** : dans un `commit` multi-collections, le `stampTx` de la collection N+1 lit le compteur
  **après** l'écriture du compteur de N — Firestore production exige toutes les lectures avant
  toutes les écritures. Correction : lecture-before-write dans `readStampTx`.
- **A3** : `sessionMax` avancé **pendant** la transaction ; Firestore rejoue le callback après
  contention → les maxima de la tentative avortée restent → refus sporieux `sync_counter_corrupt`.
  Correction validée : trois composantes d'état — `seed` / `attemptHighWater` / `assigned` ;
  une estimation refusée ne contamine jamais les maxima de tentative ; l'absorption au succès
  n'embarque que les estimations validées de la dernière exécution.

## 6. Reproductibilité

Les harnais restent en place (non commités) : `scripts/diagnostics/measure-lot-F1.ts` (11
sous-commandes `sizes · projection · load · fusion · sync · caps · b2 · isolation · backup · d1 · d3` ;
conventions : SQLite `%TEMP%`, limites relevées à 5 Mio dans le harnais seulement — jamais en
production, `syncLimit: 100_000`, port 3001 sinon éphémère, 2 séries × 50 avec warm-up, médiane
nearest-rank) et `scripts/diagnostics/measure-a1-fullcaps.ts` (2 exécutions pour reproductibilité,
gzip niveau 6, contrôle d'acceptation par les vraies routes).
