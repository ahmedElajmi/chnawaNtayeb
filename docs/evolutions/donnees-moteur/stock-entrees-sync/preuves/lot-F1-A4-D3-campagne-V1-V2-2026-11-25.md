# Campagnes V1–V2 de la clôture F1 — A4 (option α) et D3 (option P1)

> **Date** : 25/11/2026 (soir). **Branche** : `fix/stock-sync-integrity` (créée depuis `develop`
> @ `394fc0e`). **État du code** : A4 + D3 implémentés, **non commités** (dossier de travail de
> la branche). **Décisions** : AR-1 (α), AR-2 (P1), AR-3 (JDK 21), AR-6 (cette politique).
> **Statuts** : exécutions réelles ci-dessous — aucune valeur non exécutée n'est présentée comme
> validée. Preuves brutes : `.vitest/audit-v1-cloture-f1-2026-11-25/` (rapports datés distincts,
> jamais d'écrasement).

## 1. Environnement

| Élément | Valeur |
| --- | --- |
| Node / Vitest | Vitest 5, deux projects (`unit` parallèle, `emulator` sériel — T1) |
| JDK | **JDK 21 portable installé le 25/11 (AR-3)** : `~/tools/jdk21/jdk-21.0.13.1+2` (Temurin 21.0.13.1+2, installation isolée hors dépôt, aucun changement système ; `JAVA_HOME` fixé par commande, jamais global). L'installation ne vaut **aucune validation** |
| Émulateur Firestore | jar local `~/.cache/firebase/emulators/cloud-firestore-emulator-v1.19.8.jar`, `--host=127.0.0.1 --port=8080`, démarré avec le JDK 21 portable — **fonctionne** (première exécution sous JDK 21 ; les campagnes antérieures utilisaient le JDK 18 avec le jar direct) |
| Variables de campagne | `NODE_OPTIONS="--require ./scripts/diagnostics/tmp-admin-cert-preload.cjs"` + `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1` (convention T1 § 7, forme 2) |

## 2. Résultats

| # | Campagne | Commande | Résultat | Log brut |
| --- | --- | --- | --- | --- |
| 1 | V1 — unitaire après implémentation A4+D3 | `npx vitest run --project unit` | **1 107 passés / 8 ignorés / 0 échec — 113 fichiers** (baseline du 25/11 : 1 093 + **14 tests nouveaux A4/D3**, zéro régression) | `vitest-unit-20261125-2125.log` |
| 2 | V1 — TypeScript | `npx tsc --noEmit` | **exactement 8 erreurs = DT-01** (4× `measure-lot-F1.ts`, 3× `measure-a1-fullcaps.ts`, 1× `lotF1LegacyFixture.test.ts` l. 192), **aucune nouvelle** | `typecheck-20261125-2126.log` |
| 3 | V1 — lint (état documenté) | `npm run lint` | 4 erreurs + avertissements, **tous dans `scripts/diagnostics/`** (temporaires non commités) ; 0 erreur dans le code du périmètre | `lint-20261125-2129.log` |
| 4 | **V2 — voie emulator complète (première exécution sous JDK 21)** | `npx vitest run --project emulator` | **54 passés / 0 échec** — contrat 25 (dont `serialises concurrent transacts`), attempt A2, order A3, convergence 5 scénarios × 3 backends (memory, sqlite, firestore), **scénario 6 réécrit P1 vert** | `vitest-emulator-20261125-2148.log` |
| 5 | V2 — campagne complète parallèle (2ᵉ exécution) | `npm test` (les deux voies) | **1 161 passés / 8 ignorés / 0 échec — 1 169 tests, 117 fichiers** (1 107 unit + 54 emulator) | `vitest-full-20261125-2150.log` |
| 6 | V2 — `npm run check` | `npm run check` | **s'arrête au typecheck (exit 1) sur les 8 erreurs DT-01 gelées** — comportement attendu et documenté (aucune correction opportuniste ; le check complet n'est pas vert tant que DT-01 vit, état historique classé) | `check-20261125-2152.log` |

**Première campagne complète (avant la 2ᵉ)** : `vitest-full-20261125-2145.log` — 4 échecs :
le scénario 6 réécrit ×3 backends (assertion trop stricte du test : comptait tous les pushes
y compris le push de **migration `groceryLists` post-reset**, comportement antérieur documenté
et inchangé par P1 — corrigé le test, jamais le code) et 1 échec **sporadique** du test
concurrent du contrat (`serialises concurrent transacts`, 11,58 s, `3 INVALID_ARGUMENT:
Transaction is invalid or closed`) — **famille d'interférence connue du lot T1 sous charge
pleine** (les deux voies tournent en parallèle) ; **non reproductible** (campagne 5 : 0 échec ;
suite contrat isolée : 25/25). Requalifiée `[OBSERVÉE — sporadique, préexistante, hors
périmètre A4/D3]` ; à surveiller lors des prochaines campagnes complètes.

**Nouvelle observation d'infrastructure — émulateur Firestore À FROID (25/11, ~22 h)** : sur
**instance émulateur fraîchement démarrée**, la suite convergence échoue de manière
**déterministe sur son backend firestore** (1 PUT legacy reçoit un **401**, puis 4 timeouts de
5 s) — **vérifié indépendamment du code** : le fichier à l'état HEAD (sans A4/D3, testé par
`git stash`) échoue identiquement (2 exécutions sur 3 à froid ; la 1ʳᵉ passée) ; memory et
sqlite passent toujours ; la suite contrat seule passe toujours. **Cause non élucidée** (état de boot de l'émulateur) ; le réchauffage est une **CONDITION de la campagne réussie** — il n'est **pas une correction de l'anomalie à froid**, qui reste ouverte et à requalifier séparément (infrastructure de test, hors périmètre A4/D3) — jamais masquée par un contournement silencieux.

## 3. Exclusions et non-exécutés

- Les **8 ignorés** : 1 × `tmp-debug.test.ts` (placeholder voie A) + 7 × scénarios SQL gated
  (`TEST_SQL_CLIENT`/`TEST_SQL_DSN` absents) — inchangés.
- PostgreSQL/MySQL/SQL Server : non exécutés (aucun moteur configuré) — SQLite seul démontré.
- Déploiement production : hors périmètre (jamais revendiqué).

## 4. Preuves de code (correspondance test ↔ implémentation)

- A4 : `parseStockSectionUnbounded` / `parseElementSetUnbounded` (core) + garde
  `BACKUP_IMPORT_MAX_CHARS` ; tests `entries.test.ts`, `elementSets.test.ts`,
  `localRepositories.test.ts`, `backup.test.ts` (14 nouveaux, tous verts).
- D3 : `isStaleDevice` (core) + gardes dans `pushNow`/`recover` + archive
  `UnsyncedOfflineChanges` avant reset + état `offlineChangesArchived` ; tests
  `KitchenSync.test.ts` (4 nouveaux) et scénario 6 de `kitchenStockConvergence.test.ts`
  (réécrit, autorisation AR-2 explicite).

---

## 5. Campagne des corrections pré-commit (25/11/2026, ~22 h 35 — section distincte, aucune preuve antérieure modifiée)

> **Contexte** : revue pré-commit du chef — corrections autorisées D3-a (bloquante : échec de
> sauvegarde de l'archive), D3-b (signal restauré au démarrage), A4-a (test d'intégration de
> l'import), A4 (unité de la limite documentée + test), A4-b (invariant serveur documenté,
> comportement inchangé). **Logs** : `vitest-unit-corrections-20261125-2240.log`,
> `convergence-corrections-20261125-2245.log` (même dossier `.vitest/audit-v1-cloture-f1-2026-11-25/`).

| Campagne | Commande | Résultat | Log |
| --- | --- | --- | --- |
| Suites ciblées (KitchenSync, CatalogAdmin, backup, entries, elementSets, localRepositories) | `npx vitest run --project unit <fichiers>` | **173 passés / 0 échec — 6 fichiers** | (sortie console) |
| TypeScript après corrections | `npx tsc --noEmit` | **exactement les 8 erreurs DT-01, aucune nouvelle** | (sortie console) |
| **Voie unitaire complète** | `npx vitest run --project unit` | **1 112 passés / 8 ignorés / 0 échec — 114 fichiers** (1 107 + 5 tests nouveaux : 2 × KitchenSync D3-a/b, 1 × sémantique UTF-16, 2 × CatalogAdmin ; zéro régression) | `vitest-unit-corrections-20261125-2240.log` |
| **Convergence (émulateur, réchauffé — condition de campagne, pas une correction)** | réchauffage `firestoreStore.test` (25/25) puis `kitchenStockConvergence.test` | **15 passés / 0 échec** — les chemins modifiés de `pullNow`/`start()` vérifiés sur les 3 backends | `convergence-corrections-20261125-2245.log` |

**Choix de périmètre expliqué** : la campagne complète `npm test` n'a **pas** été relancée —
les corrections touchent uniquement des chemins couverts par la voie unitaire complète
(relancée intégralement, 114 fichiers) et par la suite convergence (relancée, 15/15) ; les
trois autres suites émulateur (`firestoreStore.test`, `attempt`, `order`) testent des
adaptateurs de stockage **non modifiés**. Une relance complète n'apportait aucune garantie
supplémentaire ; elle reste exigible avant la release.

**Nouvelles garanties démontrées** : (1) un échec de persistance de l'archive **annule le
reset** — modifications locales intactes, drapeau jamais faux, échec explicite, retry ultérieur
complet sans aucun push (D3-a) ; (2) le signal d'archive est restauré au démarrage depuis
l'archive persistée, sans nouvelle synchronisation et sans réémission (D3-b) ; (3) l'import
d'un fichier surdimensionné refuse **avant tout effet** : catalogue strictement inchangé,
aucune écriture cuisine (A4-a) ; (4) la sémantique de la garde (unités UTF-16 = borne de **longueur logique** ; 64 Mio uniquement dans une représentation UTF-16 théorique à 2 octets/unité — pas une mesure de la mémoire réelle ni de la taille UTF-8) est démontrée par test (A4).
