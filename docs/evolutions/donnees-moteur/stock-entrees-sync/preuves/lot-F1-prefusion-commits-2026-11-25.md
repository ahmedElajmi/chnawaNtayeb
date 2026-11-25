# Campagne pré-fusion des commits de clôture F1 (25/11/2026, ~22 h–23 h 15)

> **Objet** : qualification pré-fusion sur l'**arbre committé** `fix/stock-sync-integrity` @
> **`9b878e5`** (4 commits depuis `develop` @ `394fc0e`). **Logs bruts** :
> `.vitest/audit-premerge-f1-2026-11-25/` (dossier daté distinct — aucune preuve antérieure
> modifiée). **Aucune correction de code effectuée** ; aucune campagne antérieure relancée sans
> justification.

## 1. Intégrité Git (contrôlée avant toute exécution)

- HEAD = `fix/stock-sync-integrity` @ **`9b878e5`** ; chaîne linéaire :
  `394fc0e` → `9b6a5cd` (fix A4/D3, 14 fichiers) → `090818d` (test scénario 6, 1) →
  `edaaa62` (invariant serveur, 1) → `9b878e5` (docs, 11).
- Base = `develop` @ `394fc0e` ; `develop` = `394fc0e`, `master` = `3fb7b27`,
  `origin/develop` = `394fc0e`, `origin/master` = `3fb7b27` — **inchangées**.
- Working tree **propre** (0 modifié, index vide) ; **14 fichiers historiques non suivis
  intacts** ; `.vitest/json/output.json` md5 `f31021ba…` inchangé.

## 2. Résultats

| Campagne | Commande | Résultat | Log |
| --- | --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | **exactement les 8 erreurs DT-01** (4× `measure-lot-F1.ts`, 3× `measure-a1-fullcaps.ts`, 1× `lotF1LegacyFixture.test.ts` l. 192), **aucune nouvelle** | `typecheck-20261125-2158.log` |
| Voie unitaire complète | `npx vitest run --project unit` | **1 112 passés / 8 ignorés / 0 échec — 114 fichiers** (identique à la campagne des corrections : l'arbre committé = l'arbre validé) | `vitest-unit-20261125-2200.log` |
| Convergence **À FROID** (émulateur fraîchement démarré) | suite convergence seule | **5 échecs / 10 passés** — **1 × 401 sur un PUT legacy + 4 timeouts** : reproduction **exacte** de l'anomalie à froid sur l'arbre committé (indépendante du code, déjà vérifiée à HEAD) | `convergence-cold-20261125-2205.log` |
| Réchauffage (suite contrat) | `firestoreStore.test.ts` | **25 passés** — **condition de la campagne réussie, pas une correction de l'anomalie à froid** | (sortie console) |
| **Voie émulateur complète (4 suites)** | `npx vitest run --project emulator` | **53 passés / 1 échec — 54 tests, 4 fichiers** : convergence **15/15 dont le scénario 6 (archivage P1) passé**, attempt 10/10, order 4/4 ; **1 échec = le test concurrent du contrat** (`serialises concurrent transacts`, `3 INVALID_ARGUMENT: Transaction is invalid or closed`, 8,7 s) — **famille d'interférence T1 connue, sporadique** | `vitest-emulator-20261125-2210.log` |
| Relance ciblée du contrat seul (justifiée : confirmer l'intermittence) | suite contrat seule | **25 passés / 0 échec** — intermittence confirmée (échoue sous charge pleine, vert isolé) | `contrat-rerun-20261125-2310.log` |

## 3. Anomalies — statuts conservés

1. **DT-01** : les 8 erreurs TypeScript — **dette préexistante, non corrigée** ; `npm run check`
   reste en échec dessus (jamais présenté comme vert).
2. **Émulateur Firestore à froid** : **ouverte, non résolue** — reproduite à l'identique sur
   l'arbre committé (401 + timeouts, backend firestore de la convergence, 5 échecs) ; le
   réchauffage est une **condition de campagne**, jamais présenté comme une correction ; cause
   non élucidée, requalification d'infrastructure séparée demandée.
3. **Test contractuel concurrent sporadique** : reproduit **une nouvelle fois** sous charge
   pleine (54 tests en parallèle des deux suites), **vert isolé** (25/25) ; **non reproduit lors
   de certaines campagnes, non considéré comme définitivement résolu** — à surveiller à chaque
   campagne complète (jamais masqué par un seuil relâché).
4. **Aucune nouvelle anomalie** constatée sur le périmètre A4/D3 dans les campagnes de cette
   qualification.

## 4. Verdict

**Pré-fusion validée sous réserves** : l'arbre committé `9b878e5` reproduit exactement les
résultats des campagnes validées (unitaire 1 112/8/0, émulateur 53/54 avec l'unique échec = le
flake connu, vert isolé ; TypeScript = DT-01 exactement), le scénario 6 (archivage des
modifications hors ligne d'un appareil muet) est vert sur les 3 backends. Réserves : flake
sporadique du test concurrent (ouvert, à surveiller), anomalie à froid de l'émulateur (ouverte,
condition de campagne), dette DT-01 (documentée). Le push et la PR vers `develop` restent
soumis à une autorisation distincte du chef.
