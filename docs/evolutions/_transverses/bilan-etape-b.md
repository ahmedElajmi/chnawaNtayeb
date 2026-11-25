---
domaine: transverse
niveau: bilan (1)
nature: bilan global de l'Étape B + proposition de plan d'Étape C
statut: livrable final de l'Étape B (consolidation documentaire, autorisation du chef)
autorité: livrable v2.3 (audit Phase A) + décisions du registre + sources préservées
---

# Bilan global de l'Étape B — consolidation documentaire

> Exécutée en lots complets, sans échange intermédiaire, sur l'autorisation explicite du chef.
> **Aucune opération Git modificatrice ; aucune modification de code, de test ou de comportement ;
> aucun déplacement, renommage ou suppression physique ; aucune opération d'Étape C.** Les sources
> restent toutes à leurs emplacements actuels (dossier.md les citent avec leur chemin réel).

## 1. Livrables produits (par lot)

| Lot | Livrable | Contenu |
|-----|----------|---------|
| 1 | `docs/evolutions/_transverses/registre-decisions.md` | Centralisateur de statuts : D-01…D-33 (D4), D1–D16 + M4/M5-T9/M1-T4, AR-1…AR-6, B-F1-1…6, S1–S12, arbitrages de session validés non archivés (DT-05, trace retranscription à prévoir). **Jamais normatif** |
| 2 | `docs/evolutions/synchronisation-cuisine/dossier.md` + `annexes/preuves.md` | K-1 complet : contrats en vigueur, échelle de statuts à 5 niveaux, preuves exactes retranscrites (constantes `STOCK_LIMITS`/`ELEMENT_SET_LIMITS`, rétention 90 j/83 j, codes de refus serveur, B22-07, campagnes, fullcaps, causes racines A2/A3/A4, X-17), suivis ouverts |
| 3 | `docs/evolutions/bascule-fournisseur/dossier.md` | K-2 : contrats DataStore (curseurs, rejeu ≤ 3, `DATA_STORE`, ports), matrice de capacités (SQLite réellement testé ≠ analysé), baseline 100k, lot 1.5 reporté obligatoire avec son périmètre complet |
| 4 | `docs/evolutions/socle-shell/dossier.md` + `docs/evolutions/accueil/dossier.md` | K-3 : lots 2.6.0–2.6.2 clôturés (rapport consolidé fait foi, correctif du crash tracé) ; 2.6.3 **séparé** (AR-6, dossier v2 prêt, non validé) |
| 5 | `docs/evolutions/_transverses/analyses/audits-consolides.md`, `orientation-produit.md`, `etat-projet.md`, `docs/solution/references/LISEZMOI.md`, `docs/index.md` | K-4/K-5/K-6/K-7 + index général (niveau 0, routage, organisation cible, règles de consultation) |
| 6 | Extractions avec provenance + marquages supplanté | `04-moteur-matching.md` ← V12 (précision prime, 5 exigences, deux modes, § 10/11/13/14/15/16/17) ; `09-qualite-tests.md` ← plan 17 § 21/22 ; banner **SUPPLANTÉ** sur V12 § 4 (arbitrage C1 — SQL hybride par domaine ≠ adaptateur générique livré) ; banner **SUPPLANTÉ** sur `lot-F1-corrections-dossier.md` § 6 (plafond ~628 tombes → option B : 2 000 préservées) ; notes « NATURE DU DOCUMENT » en tête de 15/17/18 |

## 2. Sources utilisées et traçabilité

Toutes les sources citées dans les dossiers portent leur **chemin réel actuel** (préservé) :
`docs/encyclopedie/donnees/` (41 .md + JSON), `docs/encyclopedie/01…18`, maquettes
`mockups/d4/audit.html` + `registre.html` + `propositions.html`, code vérifié **en lecture seule**
(`src/core/kitchen/*`, `src/application/kitchen/*`, `server/storage/*`, `server/protocolVersion.ts`,
`server/app.ts`), consultations Git **en lecture seule** (`git status`, HEAD). Le livrable d'audit
v2.3 reste la matrice de référence des sources.

## 3. Informations conservées vs non reprises (justification)

- **Consolidées** : toutes les règles, contrats, bornes, codes de refus, décisions, statuts,
  mesures clés, causes racines, suivis ouverts (cf. table § 1).
- **Non dupliquées volontairement** : les corps intégraux des dossiers sources (≈ 430 Ko pour F1
  seul, 87 Ko pour les lots 1.3–1.5, 190 Ko pour le plan 17). Justification : principe « une seule
  source de référence par règle » + sources préservées jusqu'à l'Étape C (contrôle de non-perte
  avant toute suppression) ; la consolidation porte les règles et statuts, pas des copies.
- **Non retranscrites** : les traces de session antérieures non archivées (DT-05) — contenues dans
  les arbitrages postérieurs, listées au registre § 6 avec le statut exact ; le rapport final T1
  (X-08) — **texte à fournir par le chef** (voir § 5).
- **Écartés comme non faits** : les codes `refusal_*` issus de traces non archivées — non
  vérifiables dans le code actuel, marqués [I] dans le dossier K-1 (jamais présentés comme en
  vigueur).

## 4. Contradictions détectées et traitement

| Contradiction | Traitement |
|---------------|------------|
| X-01 (D-04 ✅ vs 🚩) | maintenue [I] dans le registre § 1/§ 2 — arbitrage attendu (audit.html ou registre.html fait foi) ; **aucune validation de thème n'est déduite** |
| V12 § 4 vs réalisation (SQL hybride par domaine vs adaptateur générique) | arbitrage C1 appliqué : § 4 marqué SUPPLANTÉ, texte conservé, cible préservée dans K-2 |
| lot-F1-corrections § 6 (plafond ~628 tombes) vs orientation A1 (option B, 2 000 préservées) | arbitrage option B appliqué : conclusion marquée SUPPLANTÉE, mesures conservées |
| D3 étape 3 (dossier v4.2 vs rapport) | déjà résolue par le complément du 19/11 — tracée dans K-1 |
| En-têtes de dossiers antérieurs à la clôture (2.6.0, 2.6.2, A3, T1) | signalés [I] dans les dossiers K-1/K-3 ; mise à jour proposée en Étape C (fait foi = trace de session validée) |
| Doublons | recherchés avant chaque extraction (couverture 01–14 vérifiée par recherche ciblée) ; aucune règle copiée en double — renvois utilisés |

## 5. Points ouverts (aucun n'a bloqué un lot) et points isolés nécessitant le chef

**Ouverts, suivis au registre / livrable v2.3 § 9** : D-04/X-01 · S1–S11 · D-18/D-19 (logo) ·
D-10 (pub) · X-03 (filtres Alt) · AR-2 (persistance substitutions, F3) · seuils de perf (🚩,
baseline posée) · choix du moteur SQL définitif (différé, décision explicite) · champ
`preferences`/`pantryStaples` sans cap (arbitrage dédié attendu — fullcaps complément) · X-17
(correctif jamais autorisé) · X-14 (8 tests en attente à identifier) · O-2 final / O-8 (verbatims
absents du disque) · O-4 niveau B.

**Isolés — arbitrage ou apport du chef nécessaires (recommandations argumentées, aucune décision
prise)** :

1. **X-18 — sécurisation Git (recommandation forte)** : 35 code/tests + 19 documents + 1 config +
   1 répertoire de preuve n'existent que sur ce disque ; le seul exemplaire de B22-07, des gardes
   A2/A3, du code A1 et des harnais est en risque. Recommandation : un commit de sécurisation
   **décidé et exécuté séparément** par le chef (opération Git modificatrice — hors Étape B).
2. **X-08 — rapport final T1** : la retranscription verbatim demandée par l'audit exige le texte
   « transmis par le chef », non archivé sur disque ; à fournir pour compléter
   `evolutions/synchronisation-cuisine/annexes/`.
3. **Trace de session (DT-05)** : la retranscription intégrale des arbitrages de session
   (Session A, canon-prepare, RECO, O-*, DC-*) exige la trace validée ; le registre les tient
   d'ores et déjà par familles et statuts.
4. **En-têtes de dossiers (2.6.0, 2.6.2, A3, T1)** : mise à jour proposée en Étape C avec le
   reclassement (aucune modification de source en Étape B).

## 6. Contrôles effectués et résultats

- **Cohérence des renvois** : chaque dossier cite ses sources par chemin réel ; vérification par
  recherche après écriture (aucun renvoi mort introduit).
- **Traçabilité** : provenance (document + section) portée par chaque règle extraite (V12 § n,
  plan 17 § n) et par chaque décision (autorité nommée).
- **Doublons** : couverture existante de 01–14 vérifiée avant extraction ; `05-application-donnees`
  couvrait déjà le stock en entrées (aucune extraction redondante vers 05) ; `03-domaine` couvrait
  déjà les mécanismes d'unités (renvoi depuis l'extraction 04).
- **Statuts** : aucune fonctionnalité présentée comme implémentée/livrée sans preuve (échelle à
  5 niveaux appliquée dans K-1, rappelée dans K-2/K-3) ; validations de maquettes systématiquement
  distinguées des livraisons produit.
- **Aucune réouverture de décision** : [DÉCIDÉ] jamais rouverts ; points ouverts restés ouverts.
- **Périmètre** : `git status` inchangé hors création des documents listés § 1 (aucune
  modification d'un fichier source préexistant hormis les **bannières documentaires** de Lot 6 —
  textes sources intégralement conservés).

## 7. Proposition de plan d'exécution pour l'Étape C (à autoriser séparément — rien n'est lancé)

| # | Opération | Garde de non-perte |
|---|-----------|--------------------|
| 1 | **Sécurisation Git** (au préalable, décision du chef) : commit des travaux non sécurisés (X-18) + push selon convention (`develop` cible) | — |
| 2 | **Reclassement physique des sources** : `mockups/d4/` (167 fichiers) → `docs/reference-visuelle/site/` ; d3 → `docs/evolutions/conception-ux/analyses/d3/` ; `backoffice.html` → `docs/evolutions/backoffice/analyses/` ; docs de `donnees/` → `docs/evolutions/<sujet>/analyses/` ou `_transverses/` ; références K-7 → `docs/solution/references/` | comparaison byte-à-byte avant/après déplacement ; `docs/index.md` et les dossiers mis à jour en même temps |
| 3 | **Consolidation UX** : reprise des informations utiles de d3 dans le dossier de conception UX ; identification fichier par fichier des **candidats à exclusion** (d3, minify.cjs, zip D4, tmp-*) | liste de suppression soumise à arbitrage ; règle tmp-* : aucune suppression avant traçage dans un dossier |
| 4 | **Mise à jour des en-têtes** de dossiers (2.6.0, 2.6.2, A3, T1) sur la foi des traces validées | — |
| 5 | **Suppressions physiques** (en fin, autorisation par liste) : uniquement après contrôle de non-perte écrit dans un dossier ; zip D4 obsolète, minify.cjs, logs temporaires (F-06…F-09), `tmp-debug.test.ts` (déjà demandé par le rapport étape 2) | contrôle de non-perte par fichier, justification enregistrée |
| 6 | **Retour arrière** : restauration possible de l'arbre documentaire antérieur (les fichiers conservés au cours de l'Étape B rendent chaque étape réversible) | — |

**Ce plan ne comporte aucune opération exécutée** : il est soumis à l'autorisation distincte du
chef, conformément au régime d'autorisation (fin de l'Étape B ≠ début de l'Étape C).

## 8. Passe de vérification finale (demande du chef — clarifications documentaires uniquement)

### 8.1 Clarification des cinq niveaux de statut (K-1)

`docs/evolutions/synchronisation-cuisine/dossier.md` (§ échelle + § 2) : les trois distances sont
désormais explicites — **code commité (local)** ≠ **code poussé vers le dépôt distant** ≠
**fonctionnalité déployée/livrée en production** ; un push n'est jamais assimilé à une livraison.
Statut du stock en entrées **inchangé** (niveau 5, implémentation commitée des étapes 1–2, en
vigueur sur la branche de travail validée) ; précision ajoutée : **ni push** (17 commits locaux,
X-18), **ni déploiement en production** (jamais réalisé ni revendiqué). Même précision ajoutée,
pour la cohérence, dans `bascule-fournisseur/dossier.md` § 6, `socle-shell/dossier.md` § 1 et
`_transverses/etat-projet.md` § 2. Le livrable d'audit v2.3 reste inchangé (trace historique).

### 8.2 Vérification des cinq opérations du lot 6

| # | Opération | Contrôle | Résultat |
|---|-----------|----------|----------|
| 1 | Extraction → `04-moteur-matching.md` | en-tête de provenance (« 15-catalogue-organise.md ») présent ; témoin verbatim « précision prime » présent dans la source ET l'extraction | ✅ |
| 2 | Extraction → `09-qualite-tests.md` | en-tête de provenance (« 17-plan-de-realisation.md ») présent ; témoin verbatim « La simplicité ne se négocie pas » présent dans la source ET l'extraction | ✅ |
| 3 | Marquage V12 § 4 (banner SUPPLANTÉ, arbitrage C1) + note « NATURE DU DOCUMENT » en tête de 15 | banner présent (1 occurrence) ; textes d'origine conservés (témoins : « jamais « tout en JSON dans SQL » », « Migration en 7 étapes » toujours présents) | ✅ |
| 4 | Marquage `lot-F1-corrections-dossier.md` § 6 (CONCLUSION SUPPLANTÉE, option B) | banner présent ; § 6 conservé tel quel (témoin « 628 tombstones » toujours présent) — fichier **non suivi**, vérification par témoins plutôt que par diff | ✅ |
| 5 | Notes « NATURE DU DOCUMENT » en tête de 17 et 18 | présentes (1 occurrence chacune) | ✅ |

**Non-perte vérifiée** : `git diff --numstat` sur les 5 fichiers suivis = **216 lignes ajoutées,
0 supprimées** (04 : 79/0 · 09 : 101/0 · 15 : 17/0 · 17 : 9/0 · 18 : 10/0).
**Aucune duplication** : les contenus extraits ne figurent dans **aucun** dossier d'évolution
(recherche sur les témoins — vide attendu, obtenu).

### 8.3 Points ouverts — maintien

X-01 (registre § 1 : D-04 reste [I], arbitrage attendu), X-08 (rapport final T1, texte à fournir),
X-14 (8 tests en attente, non identifiés), X-17 (correctif jamais autorisé), X-18 (décision de
sécurisation du chef — recommandation seule, aucune exécution) : **aucun arbitré**. Décisions
acquises inchangées ; registre des décisions : aucune modification après écriture initiale.

### 8.4 Absence d'opérations d'Étape C

`git diff --name-status` : **aucune suppression (D) ni renommage (R)** ; aucun déplacement de
fichier ; aucun nettoyage ni reclassement physique ; `mockups/d3/`, `mockups/d4/`, zip D4,
`minify.cjs`, tmp-* : tous à leur emplacement d'origine. Aucune opération Git modificatrice. Le
plan § 7 reste **non exécuté** et attend une autorisation distincte.
