# Lot F1 — Rapport de clôture du chantier (V3)

> **Date** : 25/11/2026. **Branche de travail** : `fix/stock-sync-integrity` (depuis `develop`
> @ `394fc0e`). **Statut** : travaux V1–V2 exécutés et validés, **non commités** — commit, PR et
> fusion attendent les autorisations distinctes du chef (convention des branches : PR vers
> `develop`, **merge commit obligatoire**). **Distinction permanente** : intégré dans `develop` ≠
> livré en production — le déploiement sur le serveur du chef est une décision distincte, jamais
> réalisée ni revendiquée dans ce périmètre.

## 1. Ce que la clôture apporte (récapitulatif des sous-chantiers)

| Sous-chantier | Décision | Réalisation | Statut |
| --- | --- | --- | --- |
| SC-1 — A4 / X-17 | AR-1 : **option α** (préservation intégrale) | `parseStockSectionUnbounded` / `parseElementSetUnbounded` (core), relecture de l'état propre et restauration de sauvegarde non bornées, admission serveur/adoption inchangée, garde mémoire d'import `BACKUP_IMPORT_MAX_CHARS = 33 554 432` (limite de 33 554 432 **unités de code UTF-16** = 64 Mio dans une représentation UTF-16 **théorique** à deux octets par unité — borne de longueur logique, pas une mesure de la mémoire réelle ni de la taille UTF-8 ; sémantique documentée et démontrée par test) ; **revue du 25/11 au soir** : invariant serveur documenté dans `kitchenRoutes.ts` (A4-b), test d'intégration d'import ajouté (`CatalogAdmin.test.ts` — refus sans aucune écriture, A4-a) | **Implémenté + testé** (9 tests) `[VALIDÉ voie unitaire]` |
| SC-2 — D3 | AR-2 : **P1 sous garde-fou zéro perte silencieuse** | `isStaleDevice` (règle unique du core) ; un appareil muet > 83 j ne pousse jamais son `pending` (`pushNow` + `recover`) ; archive `UnsyncedOfflineChanges` avant le reset ; état explicite `offlineChangesArchived` + `unsyncedArchive()` + `discardUnsyncedArchive()` ; erratum § 6.3 consigné ; scénario 6 réécrit (autorisation explicite). **Revue du 25/11 au soir — défaut D3-a corrigé (bloquant)** : un échec de persistance de l'archive **annule le reset** (modifications locales intactes, drapeau jamais faux, échec explicite, retry sans aucun push) ; **D3-b corrigé** : le signal d'archive est restauré au démarrage depuis l'archive persistée | **Implémenté + testé** (6 tests unit + scénario 6 × 3 backends) `[VALIDÉ]` |
| SC-3 — Validation émulateur | AR-3 : JDK 21 portable installé (`~/tools/jdk21`, isolé) | **Voie emulator : 54/54, 0 échec** — première démonstration des 4 suites sur l'état commité+corrigé ; campagne complète `npm test` : **1 161 passés / 8 ignorés / 0 échec** (2ᵉ exécution) | `[VALIDÉ]` — fin du `[À DÉMONTRER]` historique |
| SC-4 — Campagne unitaire finale | — | Voie unitaire après corrections : **1 112 passés / 8 ignorés / 0 échec — 114 fichiers** (baseline 1 093 + 19 nouveaux, zéro régression) | `[VALIDÉ]` |
| SC-5 — X-08 | — | En-têtes A3 et T1 actualisés (clôture du 20/11 fait foi) ; rapport T1 final : non archivé, attesté par les logs (constat consigné) | `[VALIDÉ]` (le texte du chef reste attendu pour archivage) |
| SC-6 — Politique de preuves | AR-6 `[DÉCIDÉ]` | Règle permanente inscrite dans `CLAUDE.md` (§ « Campagnes de validation et preuves ») + appliquée (rapports datés distincts dans `.vitest/audit-*`) | `[VALIDÉ]` |
| SC-7/SC-8 — Temporaires | AR-4 `[DÉCIDÉ sous conditions]` | Inventaire complet consigné (14 fichiers, tailles, fonctions) ; **clarification : `gdir-repro.ts` est suivi historiquement (lot 1.4)**, hors nettoyage ; `a1debug.test.ts` : assertion déjà couverte par le test committé (vérifié, consigné) — aucune suppression exécutée (après V2, sous autorisation distincte) | `[À FAIRE — suppression après V2]` |
| SC-9 — 413/epoch | AR-5 `[DÉCIDÉ]` | Suivi clôturé dans `evolution.md` (limite 3 Mio, marges C1/C2, C3 = 413 assumé, epoch jamais retenue ni implémentée) | `[VALIDÉ]` |
| SC-10 — Signalement UI | — | Hors F1 (évolution d'interface séparée, demandable) — l'état `offlineChangesArchived` est déjà exposé au store | `[HORS F1]` |
| SC-11 — `entries.js` | — | Divergence documentée, hors F1 (restructuration) | `[NOTÉ]` |
| SC-12 — F3 (réservations, substitutions) | — | Différés par décision actée | `[DIFFÉRÉ]` |

## 2. Validation intégrale (campagnes du 25/11, preuves datées)

- **Voie unitaire** : 1 107 / 8 / 0 — 113 fichiers (baseline post-fusion 1 093 + 14 nouveaux) —
  `preuves/lot-F1-A4-D3-campagne-V1-V2-2026-11-25.md` § 2, log `vitest-unit-20261125-2125.log`.
- **Voie unitaire APRÈS les corrections de revue (25/11, ~22 h 40)** : **1 112 / 8 / 0 — 114
  fichiers** (5 tests nouveaux : D3-a, D3-b, sémantique UTF-16, 2 × CatalogAdmin ; zéro
  régression) — log `vitest-unit-corrections-20261125-2240.log` ; convergence émulateur
  reconfirmée **15/15** sous réchauffage (`convergence-corrections-20261125-2245.log`). La
  campagne complète `npm test` n'a pas été relancée : les corrections ne touchent que des
  chemins couverts par ces deux campagnes (les 3 autres suites émulateur testent des
  adaptateurs non modifiés) — une relance complète reste exigible avant la release.
- **Voie emulator (JDK 21, première démonstration)** : 54 / 54 — 4 suites
  (`firestoreStore.test` 25, `attempt` A2, `order` A3, `kitchenStockConvergence` 15 : 5
  scénarios × 3 backends) — log `vitest-emulator-20261125-2148.log`.
- **`npm test` complet** : 1 161 / 8 / 0 — 117 fichiers (2ᵉ exécution ; 1ʳᵉ exécution : 4 échecs
  — 3 = assertion trop stricte du scénario 6, corrigée dans le test ; 1 = flake sporadique du
  test concurrent du contrat, famille d'interférence T1 documentée, non reproductible, non lié
  à A4/D3) — logs `vitest-full-20261125-2145.log` / `-2150.log`.
- **Vérifications complémentaires post-rapport (25/11, ~22 h)** : typecheck reconfirmé à 8 erreurs
  après correction du typage du scénario 6 (`kitchenStockConvergence.test.ts` l. 516 — cast
  neutre à l'exécution) ; suite kitchen : 56/56 ; convergence sur émulateur réchauffé avec le
  code final : **54/54, 0 échec** (`emulator-final-green-20261125-2215.log`).
- **TypeScript** : exactement les 8 erreurs DT-01, aucune nouvelle (avant et après).
- **Lint** : 4 erreurs, toutes dans des temporaires non commités ; 0 dans le périmètre.
- **`npm run check`** : s'arrête au typecheck sur DT-01 (état historique classé, jamais corrigé
  opportunistement) ; format:check sale sur les documents volontairement formatables (B2-bis
  reporté) + temporaires — conforme à l'état documenté.

## 3. Critères de clôture (§ 8 du dossier consolidé) — état réel

1. A4 : relecture intacte (2 601), B1a–B1d verts, adoption refusée, backup aller-retour vert → **`[VALIDÉ]`**.
2. D3 : décidé, implémenté = documentation, erratum consigné, test face perte présent, scénario 6 réécrit et vert → **`[VALIDÉ]`**.
3. Voie emulator : 4 suites, 0 échec, sur l'état final, rapport daté → **`[VALIDÉ]`**.
4. Voie unitaire + `npm test` : 0 échec → **`[VALIDÉ]`**.
5. DT-01 : 8 erreurs exactes, aucune nouvelle → **`[CONFIRMÉ]`**.
6. `npm run check` : écarts documentés et volontaires → **`[DOCUMENTÉ]`**.
7. X-08 clos (en-têtes + statut rapport T1), X-17/X-18/X-19/X-20 actualisés → **`[VALIDÉ]`**.
8. Cycle de vie des temporaires : **décidé (AR-4), exécution des suppressions après V2 — `[À FAIRE]`**.
9. Commits + PR : **`[À FAIRE]`** (autorisations distinctes).

## 4. Échelle des statuts — position exacte du chantier

- Niveau 1 (décision) : AR-1 à AR-6 acceptées par le chef.
- Niveau 2 (code présent) : A4 + D3 dans l'arbre de `fix/stock-sync-integrity`, **non commités**.
- Niveau 3 (tests exécutés) : les campagnes ci-dessus, preuves datées.
- Niveau 4 (committé) : **pas encore** — commits à autoriser (le reste de F1 — étapes 1–2, T1,
  A1, A2/A3, B22-07, D2, docs 7–8 — est commité et intégré dans `develop` @ `394fc0e`).
- Niveau 5 (livré) : intégré dans `develop` pour la partie déjà commitée ; **jamais livré en
  production** ; les corrections A4/D3 ne sont même pas encore commitées.

## 5. Risques résiduels et observations

| Risque / observation | Criticité | Suivi |
| --- | --- | --- |
| Émulateur Firestore **à froid** : la suite convergence échoue de manière déterministe sur son backend firestore (1 PUT reçoit un 401, puis 4 timeouts) — **vérifié indépendamment du code** (fichier à l'état HEAD, sans A4/D3, testé via `git stash` : échec identique 2 exécutions sur 3 à froid) ; memory et sqlite passent toujours. Cause non élucidée (état de boot de l'émulateur). **Le réchauffage (lancer d'abord la suite contrat) est une condition de la campagne réussie, pas une correction de l'anomalie** — run final sous cette condition : 54/54 (`emulator-final-green-20261125-2215.log`) | Moyenne (bloque la démonstration à froid, aucune perte) | Requalification séparée (infrastructure de test, hors périmètre A4/D3) ; condition de campagne documentée dans le rapport de `preuves/` |
| Flake sporadique du test concurrent du contrat en campagne complète sous charge (1 échec sur 2 exécutions ; `3 INVALID_ARGUMENT: Transaction is invalid or closed`, 11,58 s ; jamais le plafond 15 s) | Moyenne (test flaky, pas de perte) | Requalifier lors des prochaines campagnes ; éventuel décalage de la voie emulator hors charge — **jamais masqué par un seuil relâché** |
| Push de migration `groceryLists` post-reset (liste par défaut fraîche écrase les listes serveur, dernier-écrit-gagnant) — **comportement antérieur inchangé par P1** | Faible (déjà documenté comme mécanisme de migration) | Constat consigné ; évolution séparée si le chef la souhaite |
| L'archive des modifications non synchronisées n'est pas incluse dans l'export de sauvegarde, et son affichage UI n'existe pas encore | Faible | Demandables séparément (SC-10 et export) |
| Suppressions AR-4 non exécutées | Faible | Après V2, inventaire déjà consigné, autorisation distincte |
| Rapport final T1 jamais archivé comme fichier | Faible (X-08, consigné) | Le texte du chef, s'il est fourni, sera archivé |

## 6. Suite attendue (propositions, sans exécution)

1. Autorisation de **commit** des travaux A4/D3 (un lot cohérent : fix A4 + fix D3 + tests + docs, ou deux commits séparés A4 puis D3 — recommandation : **deux commits** `fix(kitchen): read the device's own stock state without the admission caps (lot F1 A4)` et `fix(kitchen): a stale device archives its refused offline changes before the reset (lot F1 D3)`, plus le lot documentaire).
2. Autorisation de **push** de `fix/stock-sync-integrity` puis **PR vers `develop`** (merge commit).
3. Exécution des **suppressions AR-4** (inventaire déjà consigné) sous autorisation.
4. Mise à jour `docs/roadmap.md` à la clôture effective (après fusion).
5. Release `release/synchronization-foundation` (étape ⑨ du plan X-19) — validations complètes refaites sur l'état release.

---

## 7. Intégration réelle dans `develop` (25/11/2026, nuit) — clôture effective

| Élément | Valeur |
| --- | --- |
| Branche poussée | `fix/stock-sync-integrity` → `origin/fix/stock-sync-integrity` @ `a8896f4` |
| Commits (5, ordre du manifeste réconcilié) | `9b6a5cd` fix A4/D3 (14 fichiers) · `090818d` test scénario 6 (1) · `edaaa62` invariant serveur (1) · `9b878e5` docs (11) · `a8896f4` preuve pré-fusion (1) — **28 fichiers au total** |
| PR | **#61** (`fix/stock-sync-integrity` → `develop`), 5 commits vérifiés, 28 fichiers, aucun fichier temporaire ni historique, `mergeable: MERGEABLE`, aucun contrôle automatique configuré |
| **Merge commit** | **`bbb0fcf8481d8e88e26bc608b139b20cbf4f742b`** — parents `394fc0e` + `a8896f4`, **merge commit obligatoire** (aucun squash, aucun rebase) |
| État de `develop` | `origin/develop` = **`bbb0fcf`** ; les 5 commits intégrés **SHAs identiques** (historique préservé, graphe vérifié) |
| État de `master` | `3fb7b27` — **inchangé** (aucune fusion vers `master`, aucune release, aucun déploiement) |
| Qualification pré-fusion | `preuves/lot-F1-prefusion-commits-2026-11-25.md` — unitaire **1 112 / 8 / 0 — 114 fichiers** ; émulateur **53/54** (seul échec = flake contractuel sporadique connu, vert isolé 25/25) ; convergence **15/15** sous réchauffage ; typecheck **8 erreurs DT-01 exactes** |
| Anomalies conservées comme suivi indépendant | (1) émulateur Firestore à froid — **ouverte** ; (2) flake du test contractuel concurrent — **non résolu, surveillé** ; (3) DT-01 — dette gelée ; (4) suppressions AR-4 — à faire sous autorisation |
| Statut final du chantier | Niveaux 1–4 atteints (décision, code, tests, **committé et intégré dans `develop`**) ; niveau 5 (livraison en production) **non atteint et non revendiqué** — la release et le déploiement restent des décisions distinctes |
