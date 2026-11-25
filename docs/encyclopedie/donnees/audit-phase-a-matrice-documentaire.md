# Audit documentaire Phase A — livrable final v2.3

> **Statut : ÉTAPE A — audit et propositions uniquement.** Confirmation explicite : **aucune modification de fichier, aucun
> déplacement, aucune suppression, aucun test exécuté, aucune mesure, aucune opération Git modificatrice (commit, push, reset, merge, stash…) n'a été réalisée —
> les consultations Git (`status`, `ls-files`, lecture de HEAD) ont été strictement en lecture seule — et rien de tel
> n'est autorisé par ce document.** Les validations de l'Étape A n'ouvrent ni l'Étape B (rédaction/consolidation) ni l'Étape C
> (migration/nettoyage) ; chaque étape requiert une autorisation explicite et distincte du chef.
> Toute « SUPPRESSION ENVISAGEABLE » est une **proposition** soumise à arbitrage, jamais un fait.
>
> **Version v2.3** — remplace la v2.2 (même fichier). Corrections limitées, sur demande du chef : (1) § 2.4 — total d3
> réconcilié à **59 entrées** (le journal `vite-preview.log`, D-42, est comptabilisé séparément des 19 fichiers du
> harnais identiques à d4) ; (2) X-18 — **décompte unique et explicite** du périmètre non sécurisé, identique en § 4,
> § 2.8 et § 9. Aucune autre modification.
>
> **Version v2.2** — remplace la v2.1 (même fichier). Corrections intégrées sur demande du chef :
> (1) matrice **réellement une ligne par fichier, sans exception** (captures, SVG, marque, `cn/`, benchmark, harnesses, tests,
> scripts, répertoires) avec chemins exacts ; (2) inspections complémentaires réalisées — les deux harnesses de mesure sont
> désormais **lus intégralement**, la couverture des pages générées est **vérifiée fichier par fichier**, les dépendances
> externes de d4 sont **vérifiées** ; (3) classement D3/D4 corrigé — D3 **n'entre pas** dans `reference-visuelle/site/` ;
> (4) choix de la page d'accueil **non fermé** : réconciliation des sources sans arbitrage inventé ; (5) registre des décisions
> déplacé vers `docs/evolutions/_transverses/` ; (6) comptages corrigés (**76 captures**, pas 77 ; benchmark d4 = 19 fichiers
> numérotés un à un) ; (7) K-1…K-7 ajustés ; (8) niveaux de lecture sans rigidité de taille.
>
> **Corrections v2.2** : (1) comptages réconciliés (marque = **10** fichiers ; ressources des pages générées = **12** ;
> répartition exacte des 25 pages écrites à la main = **18 + 2 + 5**) ; (2) niveaux d'inspection distingués — /F décision
> définitive de classement, /P classement provisoire, /C complément requis, /T source temporaire ; (3) D3 = conservation
> temporaire pendant la consolidation puis consolidation des seules informations utiles (plus de choix « archive vs
> pivot ») ; (4) statuts de l'accueil clarifiés (validation de maquette ≠ livraison produit) ; (5) échelle de statuts
> F1/A1/B22-07 à 5 niveaux ; (6) formulation Git rectifiée (aucune opération modificatrice, consultations en lecture seule).

## Marqueurs utilisés dans tout le livrable

- **[V] vérifié** : fait constaté sur le disque ou dans les sources, avec la méthode d'inspection indiquée.
- **[P] proposé** : action ou classement soumis à l'arbitrage du chef (aucune exécution).
- **[I] incertain** : information contradictoire ou incomplète, explicitement signalée.
- **[D] décision attendue** : point nécessitant une décision du chef avant toute écriture (Étape B) ou migration (Étape C).

## Niveaux d'inspection et suffisance (légende de la matrice)

| Niveau | Signification |
|--------|---------------|
| **L1** | Lecture intégrale du fichier (tout le contenu, multi-passages si tronqué) |
| **L2** | Inspection structurelle complète : toutes les sections / sous-commandes / en-têtes / constantes + carte des dépendances |
| **L3** | Inspection par titres, marqueurs et comparaison de sources ; nature et rôle établis, contenu intégral non relu |
| **L4** | Attestation externe : manifest, `cmp`/`diff` fichier à fichier, comptage croisé |
| **L5** | Comptage seul (ressource regénérable par construction) |

| Suffixe | Signification |
|---------|---------------|
| **/F** | Inspection suffisante pour une **décision définitive de classement** (L1 intégrale, L2 structurelle complète, L4 attestation, L5 regénérable) — sans prétendre que le *contenu documentaire* d'un fichier non documentaire est « consolidé » |
| **/P** | Inspection suffisante pour un **classement provisoire** (L3 : nature + rôle) ; toute consolidation du contenu exigera en Étape B une lecture adaptée approfondie, les sources restant disponibles pendant le travail |
| **/C** | **Inspection complémentaire encore nécessaire** avant toute décision définitive |
| **/T** | Fichier conservé **comme source temporaire** (règle tmp-*, reproductibilité, traçage) : son contenu n'est **jamais** prétendu intégralement consolidé |

**Portée des suffixes** : le suffixe porte sur le *classement du fichier* ; la nature temporaire (Action « SOURCE
TEMPORAIRE ») et l'état de consolidation du contenu sont portés par les colonnes Statut/Action. **Aucune inspection L3 n'est
considérée comme suffisante pour une consolidation définitive.**

**Méthode.** Lecture intégrale (multi-passages) pour tout fichier textuel du périmètre de consolidation. Inspection adaptée —
structurelle, manifest, `cmp`, dépendances indirectes (imports, chemins relatifs, scripts de génération, ressources dynamiques,
références depuis les autres documents) — pour binaires, captures, archives, configurations et pages de maquette. Tailles en
octets (o), mesurées sur le disque. Les limites restantes sont déclarées au § 10.

---

## 1. Réconciliations d'inventaire (v2.1)

| ID | Objet | Ancien état / croyance | État vérifié (preuve) | Marqueur |
|----|-------|------------------------|------------------------|----------|
| R-1 | Contenu de `donnees/` | « 39 » ou « 31 fichiers » | **41 `.md` + `scenarios-initiaux.json` = 42 entrées** ; 24 suivis Git, 17 non suivis | [V] |
| R-2 | « Aucun commit » | FAUX | HEAD `cae4677` (`feature/datastore-contract`), **17 commits locaux non poussés**, ~20 fichiers non fusionnés vers `develop` — constaté par consultation Git **en lecture seule** | [V] |
| R-3 | A1 | « orientation seulement » | Implémentation **écrite mais non commitée** : `server/app.ts` (`KITCHEN_BODY_LIMIT = '3mb'`, l. 65) + `server/app.test.ts` (`A1_LIMIT_BYTES = 3_145_728`) | [V] |
| R-4 | Fichiers de code non suivis | partiellement inventoriés | **4 fichiers de test non suivis** : `server/routes/lotF1LegacyFixture.test.ts`, `server/routes/tmp-debug.test.ts`, `server/storage/firestoreStore.attempt.test.ts`, `server/storage/firestoreStore.order.test.ts` | [V] |
| R-5 | Traces du 21/11 | non documentées | `measure-lot-F1.ts` (57 166 o), `tmp-c2debug.ts` (8 539 o), `a1debug.test.ts` (3 755 o) **et `.vitest/json/output.json` (399 364 o : run du 21/11 — 385 suites, 1 107 passés, 0 échec, 8 en attente)** | [V] |
| R-6 | Contamination d3 | confirmée | `d3/benchmark/node_modules/` = **172 Mo** + `dist/` 2,0 Mo + `vite-preview.log` | [V] |
| R-7 | Captures D4 | « 77 » (v1 et v2.0) | **ERREUR CORRIGÉE : 76 captures** — 76 fichiers `.jpg` sur disque, 76 entrées dans `rapport-captures.json` (lu intégralement), 76 figures dans `captures.html` (comptage croisé 3/3) ; d4 = **167 fichiers** au total | [V] |
| R-8 | Couverture des captures | supposée complète | **Partielle et assumée** : 8 pages générées × 6 largeurs + variantes ar/sombre/états ; ni les pages d'étude ni les alternatives ne sont capturées | [V] |
| R-9 | Benchmark d3 vs d4 | supposés identiques | **19 fichiers sur 19 byte-identiques** (`cmp` fichier à fichier) ; seuls `node_modules/`, `dist/`, `vite-preview.log` existent en plus côté d3 | [V] |
| R-10 | Pages générées D4 | définies par `pages.mjs` | **Couverture vérifiée fichier par fichier : 19/19** contiennent le marqueur de génération et le schéma de blocs `id="page-schema"` ; **aucune page hors liste** ne porte le marqueur ; aucune particularité non tracée dans `pages.mjs` n'a été détectée | [V] |
| R-11 | Harnesses de mesure | inspection structurelle seulement (v2.0) | **`measure-lot-F1.ts` et `measure-a1-fullcaps.ts` désormais lus intégralement** (en-têtes, 11 sous-commandes, constantes de caps, scénarios, entrées, sorties, conventions) — voir § 2.7 G-01/G-02 | [V] |
| R-12 | Dépendances externes de d4 | non vérifiées (v2.0) | **Vérifiées : aucun** lien relatif sortant de `d4/` (aucun `../`, aucun lien vers `backoffice.html`, le zip ou un fichier d3) ; seules mentions **textuelles** : `diagrammes.html` § 5 donne le chemin de rejeu `mockups/d3/benchmark`, `registre.html` cite le motif `mockups/backoffice.html` | [V] |
| R-13 | Comptage pages D3 | audit : « 38 pages HTML » | **34 fichiers `.html` à la racine de `d3/`** (mesuré) + harnais 19 fichiers — l'écart de comptage de l'audit est non résolu (X-15), sans effet sur les actions proposées | [V]/[I] |

---

## 2. Matrice exhaustive — une ligne par fichier physique

Colonnes : **Ch**emin · taille · **Inspec** (niveau/suffixe) · **Rôle/contenu** · **Info unique** · **Dép** (→ sortantes, ← entrantes) · **Statut** · **Action** · **Destination** · **Contrôle**. Actions marquées [V]/[P]/[I]/[D].

### 2.1 Racine `docs/encyclopedie/` (19 fichiers, 580 486 o)

| # | Ch (o) | Inspec | Rôle | Info unique | Dép | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|-----|--------|--------|-------------|----------|
| A-01 | `README.md` 4 291 | L1/F | Point d'entrée de l'encyclopédie | Arbre actuel + conventions de lecture | ← tous | LIVRÉ, dépassé par l'audit | METTRE À JOUR [P] | `solution/` (réécrit en Étape C) | contenu repris dans l'index Niveau 0 |
| A-02 | `01-produit.md` 9 117 | L1/F | Produit, langues, parcours | Règles produit en vigueur | ← 07, 14 | LIVRÉ | CONSERVER [P] | `solution/` | digest comparé avant/après |
| A-03 | `02-architecture.md` 9 143 | L1/F | Architecture hexagonale | Règles gardées par `architecture.test.ts` | ← tous | LIVRÉ | CONSERVER [P] | `solution/` | idem |
| A-04 | `03-domaine.md` 24 160 | L1/F | Domaine (catalog, units, grocery, kitchen, categories, backup) | Règles métier en vigueur | → scenarios-initiaux | LIVRÉ | CONSERVER ; doublons remplacés par renvois [P] | `solution/` | § uniques jamais réécrits ailleurs |
| A-05 | `04-moteur-matching.md` 8 234 | L1/F | Moteur de matching | `MatchingConfig`, 13 scénarios de départ | → `scenarios-initiaux.json` | LIVRÉ | CONSERVER [P] | `solution/` | lien conservé |
| A-06 | `05-application-donnees.md` 33 793 | L1/F | Ports, stores, synchronisation | Contrats applicatifs en vigueur | ← F1 | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-07 | `06-interface.md` 20 840 | L1/F | Interface, modales, listes longues, langues | Conventions d'interface | ← D4 | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-08 | `07-backoffice.md` 28 064 | L1/F | Règles actuelles du back-office | Workflow de validation, éditeurs, unités | ← 14 | LIVRÉ | CONSERVER **séparé de 14** [P] | `solution/` | — |
| A-09 | `08-serveur-api.md` 25 995 | L1/F | Serveur, endpoints, limites | Contrats HTTP en vigueur | ← app.ts | LIVRÉ (à mettre à jour après commit A1/B22-07) | CONSERVER + METTRE À JOUR [P] | `solution/` | cohérence avec code vérifié |
| A-10 | `09-qualite-tests.md` 8 870 (**modifié**) | L1/F | Tests, Git, branches | Processus qualité | — | MODIFIÉ non commité (DT-04) | CONSERVER [D] (commit à arbitrer) | `solution/` | diff suivi |
| A-11 | `10-exploitation.md` 6 819 | L1/F | Exploitation, déploiement | Procédures | — | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-12 | `11-guides-pratiques.md` 5 131 | L1/F | Guides (changement de base…) | Procédures | ← 02 | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-13 | `12-recherche.md` 42 358 | L1/F | Recherche texte, `SearchEngine` | Conventions recherche | ← normalizeSearchText | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-14 | `13-comptes.md` 17 229 | L1/F | Comptes, niveaux, E.164, unicité | Contrats comptes | ← server/auth | LIVRÉ | CONSERVER [P] | `solution/` | — |
| A-15 | `14-refonte-backoffice.md` 16 756 | L1/F | Historique de conception + réalisation de la refonte | Traçabilité de la refonte (temps, arbitrages) | ← 07 | LIVRÉ — **ne pas fusionner avec 07** | CONSOLIDER : règles actuelles → 07 ; historique → dossier d'évolution [P] | `evolutions/backoffice/` | § historiques repris verbatim |
| A-16 | `15-catalogue-organise.md` 79 350 | L1/F (2 passages) | V12 — vision catalogue organisé | Vision validée, partiellement implémentée | ← 17 | **CIBLE ACCEPTÉE, non livrée** (exigence chef § 3.1) | **PAS dans `solution/`** ; extraire les règles déjà en vigueur vers 03/05/06/07 avec provenance [D] | `evolutions/` (statut « cible ») | provenance de chaque règle extraite citée |
| A-17 | `16-plan-directeur.md` 277 | L1/F | Pointeur obsolète vers 17 | Aucune | → 17 | OBSOLÈTE | SUPPRESSION ENVISAGEABLE [P] | — | aucun lien entrant (grep : aucun) |
| A-18 | `17-plan-de-realisation.md` 190 493 | L1/F (5 passages) | Plan de réalisation V12, lots, budget (§ 24 : 2 estimations indépendantes, **non validé**) | Plan de chantier + dépendances + budget | ← 15 | PLAN (futur), non livré | **PAS dans `solution/`** ; cible de planification [P] | `evolutions/` (statut « plan ») | § 24 conservé tel quel (projection non validée) |
| A-19 | `18-cms-experiences.md` 49 566 | L1/F (2 passages) | CMS expériences — architecture cible acceptée, **non implémentée** | Modèle de blocs, registre, FK composites aux VERSIONS | ← D4 | CIBLE ACCEPTÉE, non livrée | **PAS dans `solution/`** [P] | `evolutions/cms/` (statut « cible ») | § 6b.7a/7b, gardes symétriques repris |

### 2.2 `docs/encyclopedie/donnees/` (41 `.md` + 1 `.json`)

| # | Ch (o) | Inspec | Rôle | Info unique | Dép | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|-----|--------|--------|-------------|----------|
| B-01 | `lot-1.1-cartographie.md` 44 222 | L1/F | Cartographie des besoins (lot 1.1) | Besoins tracés B-… | ← plan-consolide | HISTORIQUE (lot clôturé) | CONSOLIDER (K-3) [P] | `evolutions/socle-shell/analyses/` | besoins repris |
| B-02 | `lot-1.3-cadre-adaptateurs.md` 21 060 | L1/F | Cadre des adaptateurs (1.3) | Décisions d'adaptateurs | ← K-2 | HISTORIQUE | CONSOLIDER (K-2) [P] | `evolutions/bascule-fournisseur/analyses/` | — |
| B-03 | `lot-1.4-baseline-perf.md` 5 391 | L1/F | Baseline perf (1.4) | Chiffres de base | ← B-04 | HISTORIQUE | CONSOLIDER (K-2) [P] | `evolutions/bascule-fournisseur/annexes/` | chiffres repris |
| B-04 | `lot-1.4-matrice-capacites.md` 14 967 | L1/F | Matrice de capacités des fournisseurs | Tableau capacités | ← K-2 | HISTORIQUE | CONSOLIDER (K-2) [P] | `evolutions/bascule-fournisseur/analyses/` | — |
| B-05 | `lot-1.4-mecanismes-transversaux.md` 22 370 | L1/F | Mécanismes transversaux (1.4) | Décisions de mécanismes | ← K-2 | HISTORIQUE | CONSOLIDER (K-2) [P] | `evolutions/bascule-fournisseur/analyses/` | — |
| B-06 | `lot-1.5-repetition-generale.md` 23 467 | L1/F | Répétition générale (1.5) | Cadre de la répétition | ← K-2 | **REPORTÉ (obligatoire, actif)** | CONSERVER [P] | `evolutions/bascule-fournisseur/` | statut REPORTÉ explicite |
| B-07 | `lot-2.1-conception-d3-partie1.md` 52 104 | L1/F | Dossier du lot 2.1 (conception D3) | Décisions du lot, paquet d3, protocole benchmark | → mockups/d3 | HISTORIQUE (dossier) | CONSERVER COMME SOURCE TEMPORAIRE [P] | `evolutions/conception-ux/` | références d3 citées |
| B-08 | `lot-2.6.0-socle-dossier.md` 17 777 | L1/F | Dossier socle 2.6.0 | Décisions + anomalies d'échec de check (maquettes non suivies) | → d3/d4 | HISTORIQUE | CONSOLIDER (K-3) [P] | `evolutions/socle-shell/analyses/` | anomalies reprises |
| B-09 | `lot-2.6.0-socle-rapport.md` 13 393 | L1/F | Rapport socle 2.6.0 | Résultats, faits | ← B-08 | HISTORIQUE | CONSOLIDER (K-3) [P] | `evolutions/socle-shell/analyses/` | — |
| B-10 | `lot-2.6.1-identite-shell-dossier.md` 98 179 | L1/F | Dossier identité + shell (2.6.1) | Décisions d'identité, BrandMark | ← K-3 | HISTORIQUE | CONSOLIDER (K-3) [P] | `evolutions/socle-shell/analyses/` | — |
| B-11 | `lot-2.6.1a-identite-rapport.md` 20 671 | L1/F | Rapport 2.6.1a (identité) | Résultats + faits | ← B-10 | HISTORIQUE | CONSOLIDER (K-3) [P] | `evolutions/socle-shell/analyses/` | — |
| B-12 | `lot-2.6.1a-identite-rapport-complement.md` 15 321 | L1/F | Complément du rapport 2.6.1a | Corrections post-rapport | ← B-11 | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-13 | `lot-2.6.1b-shell-composants-dossier.md` 49 595 | L1/F | Dossier shell-composants (2.6.1b) | Contrats des composants shell | ← K-3 | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-14 | `lot-2.6.1b-shell-composants-rapport.md` 17 311 | L1/F | Rapport 2.6.1b | Résultats | ← B-13 | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-15 | `lot-2.6.1b-shell-composants-rapport-complement.md` 7 576 | L1/F | Complément du rapport 2.6.1b | Corrections post-rapport | ← B-14 | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-16 | `lot-2.6.2-composants-communs-dossier.md` 28 015 | L1/F | Dossier composants communs (2.6.2) | Règles 2.6.2, références plan-consolide | ← plan-consolide | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-17 | `lot-2.6.2-composants-communs-rapport.md` 16 546 | L1/F | Rapport 2.6.2 | Résultats | ← B-16 | HISTORIQUE | CONSOLIDER (K-3) [P] | idem | — |
| B-18 | `lot-2.6.2-composants-communs-rapport-consolide.md` 13 116 | L1/F | Rapport consolidé 2.6.2 | **Version faisant foi** du rapport | ← B-17 | HISTORIQUE (le consolidé prime) | CONSOLIDER (K-3), le consolidé prime [P] | idem | — |
| B-19 | `lot-2.6.3-home-page-dossier.md` 38 104 | L1/F | Dossier home page (2.6.3) | AR-6 : préparation documentaire uniquement | ← K-5 | **EN ATTENTE DE VALIDATION — traité séparément des lots livrés 2.6.0–2.6.2** | CONSERVER [P] | `evolutions/accueil/` | statut explicite maintenu |
| B-20 | `lot-F1-frigo-entrees-dossier.md` 65 667 | L1/F | Dossier frigo en entrées (F1 fonctionnel v8) | Contrats stock/entrées, `STOCK_LIMITS`, ids `st_*` | ← K-1 | **VALIDÉ (B-F1-1…6) — contrat accepté ; implémentation livrée (commits étapes 1–2), en vigueur** | CONSOLIDER (K-1 : rubrique « contrats en vigueur ») [P] | `evolutions/synchronisation-cuisine/` | contrats repris sans altération |
| B-21 | `lot-F1-stockage-arbitrage-dossier.md` 41 171 | L1/F | Arbitrage stockage F1 (v4.10) | Options A/B/C ; **§ 14.3 détails de solution NON approuvés** | ← K-1 | PHASE DOC CLOSE, détails non approuvés | CONSOLIDER (K-1) en signalant § 14.3 [P] | idem | mention non-approuvé conservée |
| B-22 | `lot-F1-execution-dossier.md` 142 541 | L1/F (5 passages) | Exécution F1 (v6) | Étapes, dépendances, gardes, FK aux VERSIONS | ← étape3, A1 | **VALIDÉ 19/11** (étapes 1–2 clôturées : `e18f854`, `949cede`, `d3529c4`→`cae4677`) | CONSOLIDER (K-1 : rubrique « travaux livrés et validés ») [P] | idem | — |
| B-23 | `lot-F1-etape3-observation-mesures-dossier.md` 63 258 | L1/F | Étape 3 : observation & mesures | Campagnes M1–M5, protocole | ← measure-lot-F1.ts | VALIDÉ (E1/E2/E3/E6) | CONSOLIDER (K-1 : preuves) [P] | idem `annexes/` | chiffres repris |
| B-24 | `lot-F1-etape3-rapport.md` 22 815 | L1/F | Étape 3 : rapport | Résultats de campagne | ← B-23 | VALIDÉ | CONSOLIDER (K-1 : preuves) [P] | idem | — |
| B-25 | `lot-F1-etape3-rapport-complement.md` 28 357 | L1/F | Complément du rapport étape 3 | Corrections post-rapport | ← B-24 | VALIDÉ | CONSOLIDER (K-1 : preuves) [P] | idem | — |
| B-26 | `lot-F1-corrections-dossier.md` 29 487 | L1/F | Dossier corrections F1 | **§ 6 supplanté par l'option B** | ← K-1 | PARTIELLEMENT SUPPLANTÉ | CONSOLIDER (K-1) avec marque de supplantation [P] | idem | § supplanté marqué, pas effacé |
| B-27 | `lot-F1-lot-A2-dossier.md` 14 140 | L1/F | Lot A2 (garde read-before-write) | Garde de transaction | ← H-09 | CLÔTURÉ 20/11 | CONSOLIDER (K-1 : travaux livrés) [P] | idem | — |
| B-28 | `lot-F1-lot-A3-dossier.md` 27 126 | L1/F | Lot A3 (attempts/retries) | Sémantique d'attempts ; **en-tête « en attente » à corriger** | ← H-08 | CLÔTURÉ 20/11 (en-tête à corriger) | CONSOLIDER (K-1) + METTRE À JOUR l'en-tête [P] | idem | correction signalée |
| B-29 | `lot-F1-lot-t1-dossier.md` 19 703 | L1/F | Lot T1 (7 campagnes, 37/37) | Campagnes T1 ; **rapport final non archivé en fichier** ; en-tête « en attente » | ← K-1 | CLÔTURÉ 20/11 (en-tête à corriger) | CONSOLIDER (K-1) ; retranscrire le rapport final T1 (« transmis par le chef ») verbatim en Étape B [D] | idem | retranscription intégrale |
| B-30 | `lot-F1-A1-dossier-implementation.md` 16 002 | L1/F | A1 : implémentation limite 3 Mio | Valeur 3 145 728 o, justification | ← H-01 | VALIDÉ (orientation) ; **code non commité → suivi ouvert** | CONSOLIDER (K-1 : suivi ouvert) [P] | idem | lien code cité |
| B-31 | `lot-F1-A1-mesure-fullcaps.md` 11 263 | L1/F | A1 : mesure full-caps C1/C2 | Payloads exacts en octets, C1/C2 indépendants | ← G-02 | PRÉUVE (mesure faite) | CONSOLIDER (K-1 : preuves) [P] | idem `annexes/` | payloads en octets conservés |
| B-32 | `lot-F1-A1-mesure-fullcaps-complement.md` 12 247 | L1/F | Complément de la mesure A1 (C3) | Bornes extrêmes (ids 1 000 o) | ← B-31 | PRÉUVE | CONSOLIDER (K-1 : preuves) [P] | idem | — |
| B-33 | `audit-preparation-implementation.md` 36 401 | L1/F | Audit de préparation (rails 2.6, D4) | État d'avancement, rail 2.6 | ← annexes | HISTORIQUE (audit) | CONSOLIDER (K-4) [P] | `evolutions/_transverses/analyses/` | — |
| B-34 | `audit-annexe-evolutivite-mobile.md` 27 771 | L1/F | Annexe audit : évolutivité mobile | Constats mobiles | ← B-33 | HISTORIQUE | CONSOLIDER (K-4) [P] | idem | — |
| B-35 | `audit-annexe-perimetre-architecture-frontend.md` 34 598 | L1/F | Annexe audit : périmètre frontend | Découpage frontend | ← B-33 | HISTORIQUE | CONSOLIDER (K-4) [P] | idem | — |
| B-36 | `analyse-identifiants-techniques-fonctionnels.md` 31 627 | L1/F | Analyse identifiants techniques/fonctionnels | Règles d'ids (email_index, guest:) | ← K-7 | RÉFÉRENCE PERMANENTE | CONSERVER (sans fusion) [P] | `solution/references/` | — |
| B-37 | `orientation-multilingue-validee.md` 27 034 | L1/F | Orientation multilingue validée | Orientation EN BASE **non implémentée** | ← K-5 | VALIDÉE mais **non implémentée** | **PAS dans `solution/`** ; décision en attente de réalisation [D] | `evolutions/_transverses/` | — |
| B-38 | `plan-consolide-pre-implementation.md` 87 112 | L1/F (3 passages) | Plan consolidé pré-implémentation | **§ 8 décisions D1–D16 = fait foi** ; registre vivant | ← tout | FAIT FOI (§ 8) | CONSERVER COMME SOURCE TEMPORAIRE ; K-5/K-6 reprennent les décisions avec provenance [P] | `evolutions/_transverses/` | décisions D1–D16 reprises intégrales |
| B-39 | `consolidation-vision-globale.md` 53 172 | L1/F | Consolidation v2.2 de la vision | État global, rails | ← B-38 | HISTORIQUE (consolidation) | CONSOLIDER (K-6) [P] | `evolutions/_transverses/` | — |
| B-40 | `reorientation-roadmap-carte-fonctionnelle.md` 66 915 | L1/F | Réorientation roadmap v3 (AR-1…AR-6) | Carte fonctionnelle, rails | ← K-5 | VALIDÉE (orientation) | CONSOLIDER (K-5) [P] | `evolutions/_transverses/` | — |
| B-41 | `audit-phase-a-matrice-documentaire.md` (ce fichier) | — | Livrable Étape A | — | ← tout | ACTIF | CONSERVER COMME SOURCE TEMPORAIRE [P] | `evolutions/_transverses/` | — |
| B-42 | `scenarios-initiaux.json` | L1/F | 13 scénarios de départ du moteur | Données initiales du matching | ← 04, 07 | DONNÉE DE RÉFÉRENCE | CONSERVER [P] | `solution/references/` | digest comparé |

### 2.3 Racine `docs/encyclopedie/mockups/` (3)

| # | Ch (o) | Inspec | Rôle | Info unique | Dép | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|-----|--------|--------|-------------|----------|
| C-01 | `backoffice.html` 99 391 | L2/F (sections lues : Bonjour, Recettes, indicateurs, Rôle Éditeur, Chorba frik, Fonctionnalités, **Laboratoire — scénario « Salade et variantes de tomate »**) | Maquette HTML autonome du back-office (« Chnowa Ntayeb — Maquettes back-office ») | **Maquette autonome distincte de D4** — motif cité par le registre D3 (« pages HTML autonomes ») ; la section « Laboratoire » contient un scénario de matching pré-`scenarios-initiaux` | ← registre d3 (mention textuelle) ; aucune page d4 ne la référence | ARCHIVE — source historique du motif, **pas une ressource de rendu de la référence D4** | CONSERVER, **hors `reference-visuelle/site/`** [P] | `evolutions/backoffice/analyses/` (maquette autonome) | la section « Laboratoire » vérifiée à la relecture avant tout déplacement |
| C-02 | `minify.cjs` 374 | L1/F | Génère `min.html` à partir de `backoffice.html` (sortie `min.html` **absente du disque**) | Aucune | → backoffice.html | OUTIL PONCTUEL ; **aucune référence dans le dépôt** (grep exhaustif) | SUPPRESSION ENVISAGEABLE [P] | — | grep dépôt entier : 0 usage ; sortie absente |
| C-03 | `chnawa-ntayeb-maquettes-d4.zip` 3 735 103 | L4/F (listing) | Archive D4 obsolète (antérieure au d4 courant) | Aucune (doublon) | ← d4 courant | OBSOLÈTE | SUPPRESSION ENVISAGEABLE [P] | — | listing de l'archive comparé au d4 courant avant toute suppression |

### 2.4 `mockups/d3/` (34 pages + 2 assets + 1 outil + harnais 19 fichiers + 1 journal + 2 répertoires = 59 entrées)

> D3 = **source historique d'analyse du lot 2.1**, pas une référence visuelle **ni une archive documentaire permanente**.
> Traitement retenu (consigne du chef) : **conservation temporaire pendant le travail de consolidation** — les sources
> restent disponibles pour éviter toute perte prématurée ; en Étape B, les **informations encore utiles** de D3 (registre
> pré-audit, état « avant corrections » des écrans, étude diagrammes) sont **reprises dans le dossier de conception UX** ou
> dans les analyses temporaires nécessaires ; en Étape C, les **éléments sans utilité documentaire restante** sont
> identifiés fichier par fichier comme **candidats à exclusion ou suppression** (contrôle de non-perte associé,
> autorisation distincte requise). **Aucune suppression physique n'est autorisée à ce stade.** Le contenu des pages n'est
> **pas** prétendu consolidé : leur inspection L3 porte le classement provisoire (/P).

| # | Ch (o) | Inspec | Rôle | Info unique | Dép | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|-----|--------|--------|-------------|----------|
| D-01 | `d3/index.html` 12 076 | L2/F (sections : pages complètes, composants, vérification, études) | Index du paquet D3 | Navigation D3 + état des offres du lot | → 34 pages | SOURCE HISTORIQUE | CONSERVER COMME SOURCE TEMPORAIRE [P] | `evolutions/conception-ux/analyses/d3/` | liens internes vérifiés |
| D-02 | `d3/accueil.html` 16 079 | L3/P | Accueil A « éditorial » | État avant corrections ; **variante historique non retenue** (voir § 6) | → d3.css, d3.js | SOURCE HISTORIQUE | idem [P] | idem | état couvert par audit C-08, E-07, N-05 |
| D-03 | `d3/accueil-b.html` 14 141 | L3/P | Accueil B « tableau de bord » | État avant corrections ; **variante historique non retenue** (voir § 6) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-08, A-10 |
| D-04 | `d3/frigo.html` 14 598 | L3/P | Frigo D3 | État avant E-01…E-03 | idem | SOURCE HISTORIQUE | idem [P] | idem | audit E-01/02/03 |
| D-05 | `d3/suggestions.html` 11 069 | L3/P | Suggestions D3 | Défaut C-04 (« Prête » à tort) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-04, E-09 |
| D-06 | `d3/recette.html` 12 945 | L3/P | Fiche « Ojja merguez » D3 | Incohérence 8/9 vs 6 lignes (C-01) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-01 |
| D-07 | `d3/mode-cuisine.html` 6 284 | L3/P | Mode cuisine D3 | Sortie « danger », minuteur décoratif (E-04) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit E-04, A-09 |
| D-08 | `d3/courses.html` 10 140 | L3/P | Listes de courses D3 | 3 totaux contradictoires (C-02) ; `</p>` orphelin (A-02) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-02, A-02 |
| D-09 | `d3/liste-detail.html` 9 766 | L3/P | Détail « Week-end » D3 | Doublon d'écran (C-07) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-07 |
| D-10 | `d3/planning.html` 8 474 | L3/P | Menu de la semaine D3 | Jours derja décalés (L-01) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit L-01 |
| D-11 | `d3/favoris.html` 7 600 | L3/P | Favoris D3 | Favori/hors ligne non distingués (F-01) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit F-01 |
| D-12 | `d3/notifications.html` 9 343 | L3/P | Notifications D3 | « Tout marquer comme lu » vidait la liste (F-04) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit F-04 |
| D-13 | `d3/historique.html` 7 576 | L3/P | Historique D3 | — | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-14 | `d3/profil.html` 12 157 | L3/P | Profil et réglages D3 | « 7 favoris » vs 2 affichés (C-06) ; « 128 DT économisés » (D-13) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit C-06, D-13 |
| D-15 | `d3/bienvenue.html` 6 334 | L3/P | Bienvenue D3 | Sélecteur langue sans label (X-06) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit X-06 |
| D-16 | `d3/onboarding.html` 5 321 | L3/P | Onboarding frigo D3 | — | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-17 | `d3/scan.html` 7 020 | L3/P | Photo du frigo D3 | Correction = décocher seulement (M-04) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit M-04 |
| D-18 | `d3/recherche.html` 11 304 | L3/P | Recherche D3 | Prix uniques (P-05), double Kosksi (A-07) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit P-05, A-07 |
| D-19 | `d3/fondations.html` 15 726 | L3/P | Fondations (tokens, contrastes) | 16 tokens + sémantiques, état D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | pendant d4 E-26 |
| D-20 | `d3/boutons.html` 6 092 | L3/P | Boutons | État D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-21 | `d3/champs.html` 4 878 | L3/P | Champs de saisie | FK clair 2,43:1 (X-01) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit X-01 |
| D-22 | `d3/modale.html` 5 414 | L3/P | Fenêtre ModalShell | État D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-23 | `d3/listes.html` 8 129 | L3/P | Listes | Corbeille emoji 🗑 (X-05) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit X-05 |
| D-24 | `d3/pastilles.html` 6 978 | L3/P | Pastilles d'ingrédient | Couleur seule (X-03) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit X-03 |
| D-25 | `d3/bandeaux.html` 4 551 | L3/P | Bandeaux | État D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-26 | `d3/onglets.html` 6 324 | L3/P | Onglets et recherche | État D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-27 | `d3/shell.html` 6 692 | L3/P | Shell | En-têtes recopiés dans 22 pages (N-01) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit N-01 |
| D-28 | `d3/composants.html` 26 647 | L3/P | Registre de 15 familles de composants (D3) | Inventaire D3 des familles, complété par audit § 9 | idem | SOURCE HISTORIQUE | idem [P] | idem | pendant d4 E-35 |
| D-29 | `d3/parcours.html` 19 907 | L3/P | Parcours UX (D3) | Parcours avant réécriture (supplantés par audit § 8) | idem | SOURCE HISTORIQUE | idem [P] | idem | index d4 le note |
| D-30 | `d3/responsive.html` 16 441 | L3/P | Vérification responsive (iframes) | ~70 iframes d'un coup (Q-02) ; 390/1024 absents | → pages (iframes) | SOURCE HISTORIQUE | idem [P] | idem | audit Q-02 |
| D-31 | `d3/medias.html` 8 352 | L3/P | Photos et médias (D3) | Direction photo « plats dominants », état D3 | idem | SOURCE HISTORIQUE | idem [P] | idem | pendant d4 E-39 |
| D-32 | `d3/publicite.html` 13 156 | L3/P | Emplacements publicitaires (D3) | Étiquette fausse 300×250 (A-06) | idem | SOURCE HISTORIQUE | idem [P] | idem | audit A-06 |
| D-33 | `d3/diagrammes.html` 11 482 | L2/F (pendant d4 lu L1 + `cmp` structurel) | Étude comparative diagrammes (D3) | mesures v1 INVALIDES ; version D4 = même contenu avec libellés corrigés | → benchmark | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-34 | `d3/registre.html` 17 184 | L2/F (sections + comparaison avec d4 : **d4 = d3 + § v4**, diff vérifié) | Registre des décisions du lot 2.1 (pré-audit) | **État du registre avant l'audit** (titres « Chnowa », ligne orthographe « à trancher » périmée) | ← audit d4 | SOURCE HISTORIQUE | idem [P] | idem | supplantation par d4 vérifiée |
| D-35 | `d3/assets/d3.css` 49 538 | L2/F (sections) | Styles D3 (819 l.) | Base des tokens (sections 1–14) | ← toutes pages d3 | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-36 | `d3/assets/d3.js` 43 192 | L2/F (blocs) | Comportements D3 (606 l.) | Bascules, i18n, shell (état D3) | ← toutes pages d3 | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-37 | `d3/tools/contrast-check.mjs` 3 298 | L1/F | Vérification contrastes A/B/FK (54 couples) | Jeu D3 de couples (supplanté par le jeu D4 à 58) | ← fondations | OUTIL D3 | idem [P] | idem | pendant d4 E-… tools |
| D-38 | `d3/benchmark/README.md` 1 630 | L1/F | Mode d'emploi du harnais | **Mention `entries.js` absent du paquet réel** (X-13) ; exclusion node_modules/dist prescrite | → src | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-39 | `d3/benchmark/package.json` 653 | L1/F | Dépendances épinglées | React 19.0.1, 6 candidats | → package-lock | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-40 | `d3/benchmark/package-lock.json` 94 783 | L4/F (`cmp` = identique à d4) | Verrou des versions | Aucune | ← D-39 | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-41 | `d3/benchmark/vite.config.mjs` 736 | L1/F | 6 entrées de build | Config build | → src | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-42 | `d3/benchmark/vite-preview.log` 164 | L1/F | Journal d'un `vite preview` (port 4183) | Aucune | — | OBSOLÈTE (audit A-08 : « exclus de D4 ») | SUPPRESSION ENVISAGEABLE [P] | — | — |
| D-43 | `d3/benchmark/interne.html` 1 699 | L4/F (`cmp` identique d4) | Page auto-mesurante « interne » (`?bench=1`) | — | → src | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-44 | `d3/benchmark/recharts.html` 1 622 | L4/F (idem) | Page auto-mesurante Recharts | — | idem | idem | idem [P] | idem | — |
| D-45 | `d3/benchmark/chartjs.html` 1 634 | L4/F (idem) | Page auto-mesurante Chart.js | — | idem | idem | idem [P] | idem | — |
| D-46 | `d3/benchmark/visx.html` 1 607 | L4/F (idem) | Page auto-mesurante visx | — | idem | idem | idem [P] | idem | — |
| D-47 | `d3/benchmark/apexcharts.html` 1 620 | L4/F (idem) | Page auto-mesurante ApexCharts | — | idem | idem | idem [P] | idem | — |
| D-48 | `d3/benchmark/echarts.html` 1 620 | L4/F (idem) | Page auto-mesurante ECharts | — | idem | idem | idem [P] | idem | — |
| D-49 | `d3/benchmark/src/data.js` 1 676 | L3/P (`cmp` identique d4) | Corpus déterministe (2 variantes) | Données du harnais | ← pages | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-50 | `d3/benchmark/src/bench.js` 4 530 | L3/P (protocole v2 documenté dans README + diagrammes, tous deux L1) | Protocole v2 (montage à froid, warm-up, médiane paire, React épinglé 19.0.1) | **Code du protocole corrigé — mesures d'exécution à reprendre** | ← pages | SOURCE HISTORIQUE | idem [P] | idem | — |
| D-51 | `d3/benchmark/src/page.js` 1 526 | L3/P (`cmp` identique) | Habillage de page du harnais | — | ← pages | idem | idem [P] | idem | — |
| D-52 | `d3/benchmark/src/interne.jsx` 4 702 | L3/P (`cmp` identique) | Implémentation « interne » (SVG maison) | — | ← interne.html | idem | idem [P] | idem | — |
| D-53 | `d3/benchmark/src/recharts.jsx` 3 833 | L3/P (`cmp` identique) | Implémentation Recharts | — | idem | idem | idem [P] | idem | — |
| D-54 | `d3/benchmark/src/chartjs.jsx` 3 988 | L3/P (`cmp` identique) | Implémentation Chart.js | — | idem | idem | idem [P] | idem | — |
| D-55 | `d3/benchmark/src/visx.jsx` 4 543 | L3/P (`cmp` identique) | Implémentation visx | — | idem | idem | idem [P] | idem | — |
| D-56 | `d3/benchmark/src/apexcharts.jsx` 3 806 | L3/P (`cmp` identique) | Implémentation ApexCharts | — | idem | idem | idem [P] | idem | — |
| D-57 | `d3/benchmark/src/echarts.jsx` 4 480 | L3/P (`cmp` identique) | Implémentation ECharts | — | idem | idem | idem [P] | idem | — |
| D-58 | `d3/benchmark/node_modules/` 172 Mo | L5/F | Dépendances installées | Aucune (regénérable `npm install`) | — | REGÉNÉRABLE | SUPPRESSION ENVISAGEABLE [P] | — | le README du harnais prescrit lui-même la suppression |
| D-59 | `d3/benchmark/dist/` 2,0 Mo | L5/F | Builds de production | Poids mesurés, **déjà consignés dans diagrammes.html § 2** | — | REGÉNÉRABLE | SUPPRESSION ENVISAGEABLE [P] | — | poids consignés en amont |

### 2.5 `mockups/d4/` (167 fichiers — référence visuelle centrale)

#### 2.5.1 Pages générées (19) — couverture vérifiée fichier par fichier (R-10)

Chaque fichier : L1 **via sa source** (`tools/pages.mjs`, lu intégralement) **+ vérification de couverture** (marqueur de
génération + schéma de blocs présents, aucune page hors liste, aucune particularité non tracée) → /F.

| # | Ch (o) | Rôle | Info unique | Dép | Statut | Action | Destination | Contrôle |
|---|--------|------|-------------|-----|--------|--------|-------------|----------|
| E-01 | `d4/accueil-c.html` 6 387 | **Accueil C — représentant de la composition C validée comme choix de conception (D-01, D-30)**, 6 états | Schéma de blocs de l'accueil C | → assets/cn/* | **RÉFÉRENCE D4 DE L'ACCUEIL — maquette validée, PAS implémentée ni livrée dans l'application** (§ 6) | CONSERVER [P] | `reference-visuelle/site/` | preuves D-01 § 11+§ 13 ; validation de maquette ≠ livraison produit |
| E-02 | `d4/suggestions.html` 3 972 | Suggestions (niveaux calculés 1/2/12, pub après dernier niveau — D-10) | Ordre pub D-10 | idem | PROPOSÉE (D-10 à arbitrer) | CONSERVER [P] | idem | — |
| E-03 | `d4/recette.html` 4 591 | Fiche recette unique (`?id=`), 4 scénarios de démo | T2/T5/T6/T7 référencés | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-04 | `d4/mode-cuisine.html` 2 206 | Mode cuisine (composant `cook-mode`) | — | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-05 | `d4/frigo.html` 3 487 | Frigo (bascule 9/64, un seul composant d'inventaire) | D-27 | idem | PROPOSÉE, appliquée (D-27) | CONSERVER [P] | idem | — |
| E-06 | `d4/courses.html` 2 839 | Courses (liste active) | D-08 | idem | PROPOSÉE, appliquée (D-08) | CONSERVER [P] | idem | — |
| E-07 | `d4/liste-detail.html` 2 587 | Mes listes (gérer) | D-08 | idem | idem | CONSERVER [P] | idem | — |
| E-08 | `d4/favoris.html` 3 711 | Favoris (♥ vs ⤓) | D-07 (2 notions) | idem | PROPOSÉE (D-07) | CONSERVER [P] | idem | — |
| E-09 | `d4/historique.html` 3 062 | Historique (4 langues) | — | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-10 | `d4/notifications.html` 2 662 | Notifications (mobile) ; panneau desktop v4.1 | D-20 ✅ | idem | VALIDÉE (D-20) | CONSERVER [P] | idem | — |
| E-11 | `d4/profil.html` 2 852 | Profil à la place de Réglages (D-23) | Implication CLAUDE.md « roue dentée » notée | idem | VALIDÉE (D-23) | CONSERVER [P] | idem | — |
| E-12 | `d4/scan.html` 2 586 | Scan en flux (6 étapes) | — | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-13 | `d4/connexion.html` 2 440 | Connexion/création (invité D-26) | E.164 | idem | PROPOSÉE, appliquée (D-26) | CONSERVER [P] | idem | — |
| E-14 | `d4/bienvenue.html` 2 268 | Bienvenue (langue+thème appliqués) | — | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-15 | `d4/onboarding.html` 3 133 | Onboarding frigo (≥ 3 conseillés) | — | idem | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-16 | `d4/recherche.html` 3 705 | Page Recettes : R1 étals, R2 mosaïque, R3 « Ce soir je mange… », F1/F2/F3 | **Variante validée (D-28)**, référence des filtres | idem | VALIDÉE (D-28) | CONSERVER [P] | idem | — |
| E-17 | `d4/planning.html` 3 531 | Menu de la semaine (P1+P3, résumé calculé) | **D-29 règles métier à confirmer** | idem | À ARBITRER (D-29) | CONSERVER [P] | idem | — |
| E-18 | `d4/carrousel.html` 3 480 | Carrousel (.rail) : 2 cas | D-25 ✅ | idem | VALIDÉE (D-25) | CONSERVER [P] | idem | — |
| E-19 | `d4/scenarios.html` 5 411 | 9 tests d'affichage du matching (T1–T9) | **D-32 ✅ / D-33 ✅ ; vocabulaire CTA à réconcilier** (X-05) | idem | VALIDÉE (D-32/D-33) | CONSERVER [P] | idem | réconciliation en K-6 |

#### 2.5.2 Pages écrites à la main (25) — dépendances vérifiées fichier par fichier (§ 3.2)

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|--------|--------|-------------|----------|
| E-20 | `d4/audit.html` 76 187 | L1/F | Rapport d'audit complet : verdict, constats C-01…A-10, direction, parcours, design system, validation réelle, **§ 11 tableau des 33 décisions (généré par script)**, itérations v4.1…v4.6 | **Autorité des statuts D-01…D-33** (10 ✅ ici, dont D-04 — voir X-01) | AUTORITÉ DES DÉCISIONS | CONSERVER [P] | `reference-visuelle/site/` | tableau § 11 = source calculée |
| E-21 | `d4/registre.html` 32 584 | L1/F | Registre des décisions (historique D3 + § v4 D-01…D-33) | Historique par décision ; **D-04 « 🚩 à confirmer » ici** (9 ✅) | AUTORITÉ (histo) | CONSERVER [P] | idem | contradiction D-04 maintenue (X-01) |
| E-22 | `d4/index.html` 13 512 | L1/F | Index du paquet (v4.6) | Navigation + états v4.1→v4.6 ; compte « 33 dont 24 ouvertes » (cohérent registre) | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-23 | `d4/accueil.html` 16 867 | L3/P | Accueil A — **variante historique non retenue pour la composition C** (D-01/D-30) | — | VARIANTE HISTORIQUE (§ 6) | CONSERVER [P] | idem | jamais présentée comme référence définitive |
| E-24 | `d4/accueil-b.html` 14 555 | L3/P | Accueil B — **variante historique non retenue pour la composition C** (D-01/D-30) | — | VARIANTE HISTORIQUE (§ 6) | CONSERVER [P] | idem | jamais présentée comme référence définitive |
| E-25 | `d4/recettes-filtres-alt.html` 9 020 | L1/F | **v4.7** — Alt 1 « Feuille d'abord », Alt 2 « Phrase seule », comparées à la variante validée ; même état `CN.filters` | **DÉCISION OUVERTE NON TRACÉE** (« à arbitrer — hors décision D-28 », aucun D-34) | À ARBITRER (v4.7) | CONSERVER [P] | idem | jamais présentée comme référence définitive |
| E-26 | `d4/captures.html` 24 120 | L2/F (galerie + tableau des mesures comparé au manifest, comptage 76/76/76) | Galerie des **76 captures** + mesures | Vérification finale v4.6 | PRÉUVE | CONSERVER [P] | idem | cohérence manifest vérifiée |
| E-27 | `d4/composants-cms.html` 6 098 | L1/F | Bibliothèque « prête pour le CMS » : contrat d'un composant (nom kebab-case, props typées, données par id, textes par clé, état partagé, imbrication, implémentation React = `X.tsx` avec mêmes props) | **Contrat CMS côté maquette** (couple avec 18) | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-28 | `d4/identite.html` 27 643 | L1/F (2 passages) | Identité de marque : 2 pistes de logo, déclinaisons, do/dont, **palette C exacte** (paprika #b84d1a, olive #5a7d23, safran #f2a516, terre cuite #6e2a10, semoule #fdf6ec, miel #fdebd3, café #2a1d14, cramoisi #b4233c), typographie, direction photo, **§ 7 commande complète des fichiers de marque**, voix | Palette + commande + règles du logo | PROPOSITION (D-04 : statut contradictoire, X-01) | CONSERVER [P] | idem | statut D-04 à trancher [D] |
| E-29 | `d4/propositions.html` 15 394 | L1/F | **v4.3** — R1–R4, F1–F3, P1–P3 + **S1–S12** (12 améliorations) | R1/F1/F3/P1/P3 retenus (D-28) ; **S1–S12 sans statut dans le registre (sauf S12→D-16)** | PARTIELLEMENT ARBITRÉ ; S1–S12 OUVERTS | CONSERVER [P] | idem | statuts S1–S12 à tracer [D] |
| E-30 | `d4/publicite.html` 13 198 | L1/F | Catalogue des formats pub (320×100, 728×90, 970×250, 300×250, 160×600, 300×600), layouts, config par emplacement, § 6 points ouverts | Emplacements et règles pub (D-10 à arbitrer) | À ARBITRER (D-10) | CONSERVER [P] | idem | — |
| E-31 | `d4/diagrammes.html` 11 483 | L1/F | Étude comparative des 6 candidats : compat React 19, **poids mesurés** (interne 70,9 ; visx +16,7 ; Chart.js +57,0 ; Recharts +111,8 ; ApexCharts +153,4 ; ECharts +179,7 kB gzip), perf v1 invalidée → v2 à reprendre, accessibilité, **aucune décision de bibliothèque** | **Seules mesures de poids valides** ; chemin de rejeu documenté = `d3/benchmark` (R-12) | HISTORIQUE + MESURES VALIDES | CONSERVER [P] | idem | — |
| E-32 | `d4/fondations.html` 15 728 | L3/P | Fondations (tokens, contrastes AA) | Section 15 = D4 | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-33 | `d4/boutons.html` 6 094 | L3/P | Boutons (ghost, sm, cuisine, block) | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-34 | `d4/champs.html` 4 883 | L3/P | Champs | FK corrigé #9a8763 (X-01 audit) | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-35 | `d4/modale.html` 5 416 | L3/P | Fenêtre ModalShell | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-36 | `d4/listes.html` 8 134 | L3/P | Listes | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-37 | `d4/pastilles.html` 7 023 | L3/P | Pastilles (unknown/out ajoutés) | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-38 | `d4/bandeaux.html` 4 553 | L3/P | Bandeaux | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-39 | `d4/onglets.html` 6 325 | L3/P | Onglets et recherche | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-40 | `d4/shell.html` 6 767 | L3/P | Shell | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-41 | `d4/composants.html` 26 741 | L3/P | Registre des composants (15 familles, D3) | Complété par audit § 9 | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-42 | `d4/parcours.html` 19 912 | L3/P | Parcours UX (démo D3) | Supplanté par audit § 8 (index le note) | ARCHIVE | CONSERVER [P] | idem | — |
| E-43 | `d4/responsive.html` 25 324 | L3/P | Vérification responsive (6 largeurs, iframes) | — | OUTIL DE REVUE | CONSERVER [P] | idem | — |
| E-44 | `d4/medias.html` 8 462 | L3/P (5 sections) | Photos et médias : emplacements, ratios, repli, shimmer, budget | Règles média D4 | RÉFÉRENCE | CONSERVER [P] | idem | — |

#### 2.5.3 Assets runtime (5), marque (10) et LISEZMOI.md

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|--------|--------|-------------|----------|
| E-45 | `d4/LISEZMOI.md` 5 158 | L1/F | Mode d'emploi du paquet (génération, composants) | — | RÉFÉRENCE (à mettre à jour) | METTRE À JOUR [P] | `reference-visuelle/site/` | pointer le nouvel arbre en Étape C |
| E-46 | `d4/assets/app.css` 80 001 | L2/F (sections 1–15) | Styles maquettes (ex-d3.css + section 15 D4) | Section 15 = D4 | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-47 | `d4/assets/app.js` 91 570 | L2/F (blocs) | Comportements maquettes (ex-d3.js + v4) | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-48 | `d4/assets/components.css` 13 616 | L2/F | Styles par composant (tokens uniquement) | — | ← components.js | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-49 | `d4/assets/components.js` 63 620 | L2/F | **Registre des 59 composants** (props documentées, rendu, état partagé) — « ce qu'enregistrera le moteur CMS » | Modèle = préfiguration CMS | RÉFÉRENCE (D-30 ✅) | CONSERVER [P] | idem | — |
| E-50 | `d4/assets/data.js` 27 189 | L2/F | **Source unique de données** (15 recettes, 16 catégories, 7 étals, frigo, planning, STATES, SCENARIOS) | Jeu de données canonique | RÉFÉRENCE (D-30 ✅) | CONSERVER [P] | idem | — |
| E-51 | `d4/assets/brand/MARKS.json` 823 | L1/F | Symboles MARK (tajine, bulle) en path SVG paramétré | Sources des pistes de logo | PROPOSITION (emplacements, D-18 ⏳) | CONSERVER [P] | idem | — |
| E-52 | `d4/assets/brand/favicon.svg` 587 | L4/F | Favicon (utilisé par toutes les pages) | — | RÉFÉRENCE DE RENDU | CONSERVER [P] | idem | — |
| E-53 | `d4/assets/brand/icon-512.svg` 757 | L4/F | Icône application (coins arrondis) | — | idem | CONSERVER [P] | idem | — |
| E-54 | `d4/assets/brand/icon-maskable-512.svg` 757 | L4/F | Icône maskable (zone sûre 80 %) | — | idem | CONSERVER [P] | idem | — |
| E-55 | `d4/assets/brand/logo-horizontal.svg` 848 | L4/F | Logo horizontal (en-têtes) | — | idem | CONSERVER [P] | idem | — |
| E-56 | `d4/assets/brand/logo-horizontal-dark.svg` 848 | L4/F | Logo horizontal négatif | — | idem | CONSERVER [P] | idem | — |
| E-57 | `d4/assets/brand/logo-stacked.svg` 916 | L4/F | Logo empilé (bienvenue, chargement) | — | idem | CONSERVER [P] | idem | — |
| E-58 | `d4/assets/brand/mark-bulle.svg` 487 | L4/F | Piste 2 « Bulle-bol » | Piste non recommandée | PROPOSITION | CONSERVER [P] | idem | — |
| E-59 | `d4/assets/brand/mark-tajine.svg` 489 | L4/F | Piste 1 « Tajine ? » (recommandée, emplacement) | — | PROPOSITION | CONSERVER [P] | idem | — |
| E-60 | `d4/assets/brand/mark-tajine-mono.svg` 489 | L4/F | Symbole une couleur | — | PROPOSITION | CONSERVER [P] | idem | — |
| E-61 | `d4/assets/cn/i18n.js` 25 701 | L3/P | **Chaînes des composants en 4 langues + noms d'ingrédients/catégories en arabe** | **Un seul fichier à faire relire par un locuteur natif** (D-15) ; contenus restants = D-31 | RÉFÉRENCE (contenu à relire) | CONSERVER [P] | idem | relecture native avant implémentation (D-15) |
| E-62 | `d4/assets/cn/common.js` 11 080 | L3/P | Composants communs (shell, toasts, état partagé) | — | RÉFÉRENCE | CONSERVER [P] | idem | — |
| E-63 | `d4/assets/cn/home.js` 9 755 | L3/P | Composants accueil (6 états) | — | idem | CONSERVER [P] | idem | — |
| E-64 | `d4/assets/cn/fridge.js` 15 457 | L3/P | Composants frigo (9/64, épuisé, Annuler) | — | idem | CONSERVER [P] | idem | — |
| E-65 | `d4/assets/cn/recipe.js` 32 739 | L3/P | Composants recette + matching affiché (CN.match, CN.ctaKind) | Règles d'affichage D-33 codées | idem | CONSERVER [P] | idem | — |
| E-66 | `d4/assets/cn/flows.js` 16 578 | L3/P | Flux (scan, bienvenue, onboarding) | — | idem | CONSERVER [P] | idem | — |
| E-67 | `d4/assets/cn/account.js` 34 530 | L3/P | Compte/invité/profil/listes | D-26, D-08 | idem | CONSERVER [P] | idem | — |

#### 2.5.4 Outils (4) — utilité durable démontrée

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|--------|--------|-------------|----------|
| E-68 | `d4/tools/pages.mjs` 13 392 | L1/F | **Définition des 19 pages** (métadonnées + blocs `{c, props, show}`) — « ce qu'enregistrera le moteur CMS » | Schémas de blocs = données d'entrée du futur CMS | OUTIL DURABLE | CONSERVER [P] | `reference-visuelle/site/` | source de vérification des pages générées |
| E-69 | `d4/tools/generate-pages.mjs` 5 883 | L1/F | Générateur des 19 pages ; **carte exacte des scripts chargés par page** (data.js, components.js, cn/*, app.js) | Carte de dépendances | OUTIL DURABLE | CONSERVER [P] | idem | — |
| E-70 | `d4/tools/capture.mjs` 5 557 | L1/F | Captures réelles (Edge headless, DevTools) : **76 travaux** (8 pages × 6 largeurs, ar, sombre, états) | Reproductibilité des preuves | OUTIL DURABLE | CONSERVER [P] | idem | — |
| E-71 | `d4/tools/contrast-check.mjs` 4 725 | L1/F | Contrastes AA : **58 couples** (A, B, FK, C × clair/sombre) | 58/58 conformes | OUTIL DURABLE | CONSERVER [P] | idem | — |

#### 2.5.5 Captures (77 entrées : 76 `.jpg` + 1 manifest) — valeur : **preuve utile**, pas ressource de rendu

Inspection : L4/F pour chaque capture (attestation par le manifest lu intégralement + comptage croisé disque/manifest/galerie
3×76 + `capture.mjs` lu : les mesures over/broken/empty sont prises **dans la page** au moment de la capture). Le décodage
individuel des JPEG n'est pas requis pour statuer : leur valeur déclarée est **visuelle et mesurée**, le manifest en est
l'inventaire de contrôle ; aucune information textuelle unique n'est possible dans un JPEG. Classement proposé : **preuves
utiles** (vérification exécutée), conservées avec la galerie ; **pas des ressources de rendu** de la référence.

| # | Ch | Inspec | Preuve portée par la capture | Dép | Statut | Action | Destination | Contrôle |
|---|----|--------|------------------------------|-----|--------|--------|-------------|----------|
| E-72 | `d4/captures/accueil-c_320.jpg` | L4/F | Rendu réel accueil-c à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-73 | `d4/captures/accueil-c_375.jpg` | L4/F | Rendu réel accueil-c à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-74 | `d4/captures/accueil-c_390.jpg` | L4/F | Rendu réel accueil-c à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-75 | `d4/captures/accueil-c_768.jpg` | L4/F | Rendu réel accueil-c à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-76 | `d4/captures/accueil-c_1024.jpg` | L4/F | Rendu réel accueil-c à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-77 | `d4/captures/accueil-c_1280.jpg` | L4/F | Rendu réel accueil-c à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-78 | `d4/captures/frigo_320.jpg` | L4/F | Rendu réel frigo à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-79 | `d4/captures/frigo_375.jpg` | L4/F | Rendu réel frigo à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-80 | `d4/captures/frigo_390.jpg` | L4/F | Rendu réel frigo à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-81 | `d4/captures/frigo_768.jpg` | L4/F | Rendu réel frigo à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-82 | `d4/captures/frigo_1024.jpg` | L4/F | Rendu réel frigo à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-83 | `d4/captures/frigo_1280.jpg` | L4/F | Rendu réel frigo à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-84 | `d4/captures/suggestions_320.jpg` | L4/F | Rendu réel suggestions à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-85 | `d4/captures/suggestions_375.jpg` | L4/F | Rendu réel suggestions à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-86 | `d4/captures/suggestions_390.jpg` | L4/F | Rendu réel suggestions à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-87 | `d4/captures/suggestions_768.jpg` | L4/F | Rendu réel suggestions à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-88 | `d4/captures/suggestions_1024.jpg` | L4/F | Rendu réel suggestions à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-89 | `d4/captures/suggestions_1280.jpg` | L4/F | Rendu réel suggestions à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-90 | `d4/captures/recette_320.jpg` | L4/F | Rendu réel recette à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-91 | `d4/captures/recette_375.jpg` | L4/F | Rendu réel recette à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-92 | `d4/captures/recette_390.jpg` | L4/F | Rendu réel recette à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-93 | `d4/captures/recette_768.jpg` | L4/F | Rendu réel recette à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-94 | `d4/captures/recette_1024.jpg` | L4/F | Rendu réel recette à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-95 | `d4/captures/recette_1280.jpg` | L4/F | Rendu réel recette à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-96 | `d4/captures/mode-cuisine_320.jpg` | L4/F | Rendu réel mode-cuisine à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-97 | `d4/captures/mode-cuisine_375.jpg` | L4/F | Rendu réel mode-cuisine à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-98 | `d4/captures/mode-cuisine_390.jpg` | L4/F | Rendu réel mode-cuisine à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-99 | `d4/captures/mode-cuisine_768.jpg` | L4/F | Rendu réel mode-cuisine à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-100 | `d4/captures/mode-cuisine_1024.jpg` | L4/F | Rendu réel mode-cuisine à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-101 | `d4/captures/mode-cuisine_1280.jpg` | L4/F | Rendu réel mode-cuisine à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-102 | `d4/captures/courses_320.jpg` | L4/F | Rendu réel courses à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-103 | `d4/captures/courses_375.jpg` | L4/F | Rendu réel courses à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-104 | `d4/captures/courses_390.jpg` | L4/F | Rendu réel courses à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-105 | `d4/captures/courses_768.jpg` | L4/F | Rendu réel courses à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-106 | `d4/captures/courses_1024.jpg` | L4/F | Rendu réel courses à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-107 | `d4/captures/courses_1280.jpg` | L4/F | Rendu réel courses à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-108 | `d4/captures/planning_320.jpg` | L4/F | Rendu réel planning à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-109 | `d4/captures/planning_375.jpg` | L4/F | Rendu réel planning à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-110 | `d4/captures/planning_390.jpg` | L4/F | Rendu réel planning à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-111 | `d4/captures/planning_768.jpg` | L4/F | Rendu réel planning à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-112 | `d4/captures/planning_1024.jpg` | L4/F | Rendu réel planning à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-113 | `d4/captures/planning_1280.jpg` | L4/F | Rendu réel planning à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-114 | `d4/captures/notifications_320.jpg` | L4/F | Rendu réel notifications à 320 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-115 | `d4/captures/notifications_375.jpg` | L4/F | Rendu réel notifications à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-116 | `d4/captures/notifications_390.jpg` | L4/F | Rendu réel notifications à 390 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-117 | `d4/captures/notifications_768.jpg` | L4/F | Rendu réel notifications à 768 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-118 | `d4/captures/notifications_1024.jpg` | L4/F | Rendu réel notifications à 1024 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-119 | `d4/captures/notifications_1280.jpg` | L4/F | Rendu réel notifications à 1280 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-120 | `d4/captures/accueil-c_375_ar.jpg` | L4/F | RTL réel (ar) accueil-c à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-121 | `d4/captures/frigo_375_ar.jpg` | L4/F | RTL réel (ar) frigo à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-122 | `d4/captures/suggestions_375_ar.jpg` | L4/F | RTL réel (ar) suggestions à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-123 | `d4/captures/recette_375_ar.jpg` | L4/F | RTL réel (ar) recette à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-124 | `d4/captures/mode-cuisine_375_ar.jpg` | L4/F | RTL réel (ar) mode-cuisine à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-125 | `d4/captures/courses_375_ar.jpg` | L4/F | RTL réel (ar) courses à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-126 | `d4/captures/planning_375_ar.jpg` | L4/F | RTL réel (ar) planning à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-127 | `d4/captures/notifications_375_ar.jpg` | L4/F | RTL réel (ar) notifications à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-128 | `d4/captures/accueil-c_375_sombre.jpg` | L4/F | Mode sombre accueil-c à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-129 | `d4/captures/frigo_375_sombre.jpg` | L4/F | Mode sombre frigo à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-130 | `d4/captures/suggestions_375_sombre.jpg` | L4/F | Mode sombre suggestions à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-131 | `d4/captures/recette_375_sombre.jpg` | L4/F | Mode sombre recette à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-132 | `d4/captures/mode-cuisine_375_sombre.jpg` | L4/F | Mode sombre mode-cuisine à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-133 | `d4/captures/courses_375_sombre.jpg` | L4/F | Mode sombre courses à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-134 | `d4/captures/planning_375_sombre.jpg` | L4/F | Mode sombre planning à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-135 | `d4/captures/notifications_375_sombre.jpg` | L4/F | Mode sombre notifications à 375 px · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-136 | `d4/captures/accueil-c_1280_ar_sombre.jpg` | L4/F | RTL + sombre desktop (accueil-c) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-137 | `d4/captures/etat_accueil-nouveau_375.jpg` | L4/F | État « nouveau » de l’accueil · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-138 | `d4/captures/etat_accueil-frigo-vide_375.jpg` | L4/F | État « frigo vide » de l’accueil · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-139 | `d4/captures/etat_accueil-planning_375.jpg` | L4/F | État « planning » de l’accueil · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-140 | `d4/captures/etat_frigo-64_375.jpg` | L4/F | Frigo à 64 ingrédients (375 px) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-141 | `d4/captures/etat_frigo-64_1280.jpg` | L4/F | Frigo à 64 ingrédients (1280 px) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-142 | `d4/captures/etat_recette-sans-etapes_375.jpg` | L4/F | Fiche sans étapes (Marqa) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-143 | `d4/captures/etat_profil-invite_375.jpg` | L4/F | Profil invité · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-144 | `d4/captures/etat_favoris_375.jpg` | L4/F | Favoris (♥ / ⤓) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-145 | `d4/captures/scenarios_1280.jpg` | L4/F | Tests d’affichage du matching (9 tests) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-146 | `d4/captures/recette-kosksi_390.jpg` | L4/F | Fiche Kosksi (recette complète n° 2) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-147 | `d4/captures/mode-cuisine-bsissa_375.jpg` | L4/F | Mode cuisine Bsissa (recette complète n° 3) · over=0 broken=0 empty=0 (manifest) | ← captures.html | PRÉUVE | CONSERVER [P] | site/captures/ | manifest |
| E-148 | `d4/captures/rapport-captures.json` 10 432 | L1/F | **Manifest : 76 entrées** (name, w, over, broken, dir, blocks, empty) — toutes 0/0/0 | ← capture.mjs ; ← captures.html | PRÉUVE (données) | CONSERVER [P] | site/captures/ | source du contrôle de cohérence |

#### 2.5.6 Harnais benchmark copié dans d4 (19 fichiers) — identité 19/19 vérifiée (`cmp` fichier à fichier)

> Proposition (exigence chef § 6.7) : **une seule copie de référence du harnais**. Deux options, décision attendue [D] :
> (a) conserver le harnais **dans le dossier d'évolution** `evolutions/conception-ux/analyses/benchmark/` en le prenant depuis
> la copie **d4** (propre, sans contamination) et supprimer la copie d3 comme redondante — alors mettre à jour en Étape B le
> chemin de rejeu cité par `diagrammes.html` § 5 (qui pointe aujourd'hui sur `d3/benchmark`) ;
> (b) conserver la copie d3 (chemin documenté) débarassée de `node_modules/`, `dist/`, `vite-preview.log` et supprimer la copie d4.
> Aucune des deux copies n'est une ressource de rendu de la référence visuelle.

| # | Ch (o) | Inspec | Rôle | Info unique | Action | Contrôle |
|---|--------|--------|------|-------------|--------|----------|
| E-149 | `d4/benchmark/README.md` 1 630 | L4/F (`cmp` = d3) | Mode d'emploi | Aucune (miroir) | CONSERVER [P] (une seule copie, § 2.5.6) | — |
| E-150 | `d4/benchmark/package.json` 653 | L4/F | Dépendances épinglées | — | idem | — |
| E-151 | `d4/benchmark/package-lock.json` 94 783 | L4/F | Verrou des versions | — | idem | — |
| E-152 | `d4/benchmark/vite.config.mjs` 736 | L4/F | 6 entrées de build | — | idem | — |
| E-153 | `d4/benchmark/interne.html` 1 699 | L4/F | Page auto-mesurante « interne » | — | idem | — |
| E-154 | `d4/benchmark/recharts.html` 1 622 | L4/F | Page auto-mesurante Recharts | — | idem | — |
| E-155 | `d4/benchmark/chartjs.html` 1 634 | L4/F | Page auto-mesurante Chart.js | — | idem | — |
| E-156 | `d4/benchmark/visx.html` 1 607 | L4/F | Page auto-mesurante visx | — | idem | — |
| E-157 | `d4/benchmark/apexcharts.html` 1 620 | L4/F | Page auto-mesurante ApexCharts | — | idem | — |
| E-158 | `d4/benchmark/echarts.html` 1 620 | L4/F | Page auto-mesurante ECharts | — | idem | — |
| E-159 | `d4/benchmark/src/data.js` 1 676 | L4/F | Corpus déterministe | — | idem | — |
| E-160 | `d4/benchmark/src/bench.js` 4 530 | L4/F | Protocole v2 | Code corrigé, mesures à reprendre | idem | — |
| E-161 | `d4/benchmark/src/page.js` 1 526 | L4/F | Habillage de page | — | idem | — |
| E-162 | `d4/benchmark/src/interne.jsx` 4 702 | L4/F | Implémentation interne | — | idem | — |
| E-163 | `d4/benchmark/src/recharts.jsx` 3 833 | L4/F | Implémentation Recharts | — | idem | — |
| E-164 | `d4/benchmark/src/chartjs.jsx` 3 988 | L4/F | Implémentation Chart.js | — | idem | — |
| E-165 | `d4/benchmark/src/visx.jsx` 4 543 | L4/F | Implémentation visx | — | idem | — |
| E-166 | `d4/benchmark/src/apexcharts.jsx` 3 806 | L4/F | Implémentation ApexCharts | — | idem | — |
| E-167 | `d4/benchmark/src/echarts.jsx` 4 480 | L4/F | Implémentation ECharts | — | idem | — |

### 2.6 Racine du dépôt — artefacts et traces (9)

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|--------|--------|-------------|----------|
| F-01 | `CLAUDE.md` 29 966 (**modifié**) | L1/F | Instructions du dépôt | Conventions en vigueur | MODIFIÉ non commité | CONSERVER [D] (commit à arbitrer) | — | diff suivi |
| F-02 | `vite.config.ts` (**modifié**) | L2/F | Config Vitest (projets emulator/unit) | — | MODIFIÉ non commité | CONSERVER [D] | — | diff suivi |
| F-03 | `docs/encyclopedie/09-qualite-tests.md` 8 870 (**modifié**) | L1/F | — | — | MODIFIÉ non commité | CONSERVER [D] | — | diff suivi |
| F-04 | `a1debug.test.ts` 3 755 | L1/F | Test de debug A1 : « merge caps refusal keeps its reason » (700 ingrédients, 2 pushes de 300) | Hypothèse vérifiée : le refus de caps conserve sa raison | TEMPORAIRE (debug 21/11) | CONSERVER COMME SOURCE TEMPORAIRE /T ; SUPPRESSION ENVISAGEABLE après traçage [P] | `evolutions/synchronisation-cuisine/annexes/` (trace) | contenu décrit dans la consolidation |
| F-05 | `.vitest/json/output.json` 399 364 | L2/F (en-tête + échantillons) | **Rapport vitest JSON du run du 21/11 23:13 : 385 suites, 1 107 passés, 0 échec, 8 en attente** | Trace machine du « 1 107 tests verts » ; liste exacte des suites | PRÉUVE (21/11) | CONSERVER COMME SOURCE TEMPORAIRE /T ; extraction de la liste des 8 en attente proposée en Étape B [D] ; SUPPRESSION ENVISAGEABLE ensuite [P] | `evolutions/synchronisation-cuisine/annexes/` | compteur 1 107 recoupé |
| F-06 | `emulator-out.log` 1 705 | L1/F | Démarrage d'émulateur **échoué** (port 8080 pris, hub 4401, UI 4001) | Aucune (incident local) | TEMPORAIRE | SUPPRESSION ENVISAGEABLE [P] | — | — |
| F-07 | `d4-3001.log` 1 113 | L1/F | Journal dev 3001 pendant la revue D4 (`page reload public/__preset.html`) | `public/__preset.html` **n'existe plus** (fichier transient vérifié absent) | TEMPORAIRE | SUPPRESSION ENVISAGEABLE [P] | — | — |
| F-08 | `d4-3003.log` 987 | L1/F | Journal dev 3003 (idem) | idem | TEMPORAIRE | SUPPRESSION ENVISAGEABLE [P] | — | — |
| F-09 | `firestore-debug.log` 0 | L5/F | Vide | Aucune | VIDE | SUPPRESSION ENVISAGEABLE [P] | — | — |

### 2.7 `scripts/diagnostics/` (17 fichiers : 5 suivis, 12 non suivis)

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Destination | Contrôle |
|---|--------|--------|------|-------------|--------|--------|-------------|----------|
| G-01 | `measure-lot-F1.ts` 57 166 | **L1/F** (lu intégralement en 4 passages : en-tête, constantes, 11 sous-commandes `sizes · projection · load · fusion · sync · caps · b2 · isolation · backup · d1 · d3`, corps des campagnes) | Harness des campagnes M1a/M1b (tailles JSON + estimation Firestore avec règles officielles et **marquage des types non pris en charge**), M2 (fusion tombstones 500/2 000 + comparaison SET 2 000), M3 (chargement local pire cas), M4 (projection), M5 (push/pull isolés + C2/C3/C5 multi-appareils, face fonctionnelle 3 cycles + face performance par barrière), B1a–B1d (caps une à une puis combinées, refus 400 + document intact + **client pending**), B2 (convergence 2 appareils à volume max), B4 (isolation comptes, uid forgé ignoré, projections par compte), D4 (cycle export→import→sync entre 2 appareils + compat ancien backup), D1 (conversion legacy via le vrai serveur, cas § 7.1 + écho ignoré), D3 (appareil périmé > 83 j, scénario 6) | **Conventions** : SQLite %TEMP%, limites levées à 5 Mio (le constat 413 n'est jamais corrigé ici), `syncLimit: 100_000`, port 3001 sinon éphémère, 2 séries × 50 avec warm-up, médiane nearest-rank ; **code de détection de l'anomalie de troncature silencieuse** (perte de `st_fridge_ing0299` constatée) ; scénario D1 exact (ajouts/retraits variés, écho device `server` ignoré) | PRÉUVE (outil des campagnes) | CONSERVER COMME SOURCE TEMPORAIRE /T (reproductibilité) [P] | `evolutions/synchronisation-cuisine/annexes/preuves/` | sous-commandes ↔ campagnes des dossiers recoupées |
| G-02 | `measure-a1-fullcaps.ts` 19 542 | **L1/F** (lu intégralement en 3 passages) | Harness A1 full-caps : **CAPS constants** (sets 300+2 000, id 200, device 64, stock 300/empl. + 2 000 tombes, id stock 1 000, note 300, plan 14 j, courses 20×500, listName 80) ; **C1** projection-cohérente (`projectStockToLegacy`), **C2** sections indépendantes, **C3** champs aux bornes (ids allongés distincts, jamais tronqués) ; 2 exécutions pour reproductibilité + gzip niv. 6 ; contrôle d'acceptation par les vraies routes (limite relevée 5 Mio, jamais modifiée en production) | **Trouvailles non retranscrites ailleurs** : `preferences` acceptée par la route comme objet libre, `pantryStaples` SANS cap mesurée au volume catalogue (700), unit bornée à 32 mais non atteignable (registre), ids de stock 1 000 o admissibles jamais observés — « un dossier d'arbitrage devra noter ces champs sans cap » | PRÉUVE | CONSERVER COMME SOURCE TEMPORAIRE /T [P] | idem | — |
| G-03 | `gdir-repro-413.ts` 6 008 | L1/F | Reproduction du 413 : 100 Ko de production sur /api/kitchen vs pushes 50→300 | Constat 413 (motif de la limite dédiée A1) | PRÉUVE | CONSERVER COMME SOURCE TEMPORAIRE /T [P] | idem | — |
| G-04 | `seed-lot-F1.ts` 1 535 | L1/F | Seed jetable du registre (700 ingrédients, catégories permanentes) | — | TEMPORAIRE | SUPPRESSION ENVISAGEABLE après traçage [P] | idem | — |
| G-05 | `tmp-401debug.ts` 3 516 | L1/F | Repro 401 PUT /api/kitchen sur émulateur, hors vitest (étape 3) | Trace de debug du 401 | TEMPORAIRE /T | CONSERVER COMME SOURCE TEMPORAIRE ; SUPPRESSION ENVISAGEABLE après traçage dans le dossier étape 3 [P] | idem | règle tmp-* |
| G-06 | `tmp-a2-emulator-run.cjs` 671 | L1/F | Runner de la campagne A2 sur émulateur (env en process) | — | TEMPORAIRE | idem [P] | idem | — |
| G-07 | `tmp-admin-cert-preload.cjs` 1 142 | L1/F | Shim Node 26 : clé de service-account factice acceptée pour l'émulateur uniquement | **Contour d'incompatibilité Node 26 / PEM strict** (savoir-faire à tracer avant toute suppression) | TEMPORAIRE (documenté « diagnostics-only ») | idem [P] | idem | — |
| G-08 | `tmp-c2debug.ts` 8 539 | L2/C (en-tête + structure ; **corps non lu — inspection complémentaire requise avant toute décision de suppression**) | Debug C2 (21/11) | Trace du chantier C2 — contenu non encore établi | TEMPORAIRE /T | CONSERVER COMME SOURCE TEMPORAIRE /T [P] ; inspection complémentaire en Étape B avant statut final | idem | règle tmp-* |
| G-09 | `tmp-createaccount-debug.ts` 1 329 | L1/F | Appel direct `createAccount` sur l'émulateur (erreur brute) | — | TEMPORAIRE | idem [P] | idem | — |
| G-10 | `tmp-mergedebug.ts` 1 744 | L1/F | `mergeStockSections` : la tombe locale garde-t-elle l'enveloppe distante ? | — | TEMPORAIRE | idem [P] | idem | — |
| G-11 | `tmp-parsedebug.ts` 1 022 | L1/F | `parseStockSection` refuse 301 entrées ? (repro) | — | TEMPORAIRE | idem [P] | idem | — |
| G-12 | `tmp-toggle-debug.ts` 3 544 | L1/F | Repro locale : 600 actifs + 2 000 tombes, toggle d'un ingrédient, perte de `st_fridge_ing0299` sans serveur (`LOT_F1_TRACE=1`) | **Trace de l'anomalie de perte d'enveloppe** | TEMPORAIRE /T | idem [P] | idem | — |
| G-13 | `gdir-repro.ts` 1 668 (suivi) | L1/F | Repro générique GDIR | — | SUIVI | CONSERVER [P] | — | — |
| G-14 | `matching-report.ts` 3 318 (suivi) | L1/F | Rapport `diagnose:matching` | — | SUIVI | CONSERVER [P] | — | — |
| G-15 | `seed-lot262.ts` 5 327 (suivi) | L1/F | Seed lot 2.6.2 | — | SUIVI | CONSERVER [P] | — | — |
| G-16 | `sqlite-contention-diag.ts` 1 783 (suivi) | L1/F | Diagnostic contention SQL | — | SUIVI | CONSERVER [P] | — | — |
| G-17 | `sqlite-throughput-diag.ts` 2 192 (suivi) | L1/F | Diagnostic débit SQL | — | SUIVI | CONSERVER [P] | — | — |

### 2.8 Code et tests non commités (22 fichiers H-01…H-22 — partie code/tests du périmètre X-18, qui en compte 35 : voir § 4)

> Ces fichiers ne sont pas des documents de consolidation : leur inspection (en-têtes, constantes, passages connus des lots)
> suffit à les classer pour l'**arbitrage de sécurisation Git**, qui reste une décision du chef, séparée de la validation de
> cet audit. Aucun commit, push, sauvegarde ou nettoyage n'est autorisé par ce livrable.
> **Échelle exigée (K-1, § 7)** : décision/contrat accepté ≠ code présent dans l'arbre ≠ tests exécutés ≠ code commité ≠
> livré et en vigueur ; ces fichiers sont du « code présent, non sécurisé » — jamais qualifiés de livrés.

| # | Ch (o) | Inspec | Rôle | Info unique | Statut | Action | Contrôle |
|---|--------|--------|------|-------------|--------|--------|----------|
| H-01 | `server/app.ts` 7 009 (**modifié**) | L2/F | `KITCHEN_BODY_LIMIT = '3mb'` sur /api/kitchen | Implémentation A1 | ÉCRIT, NON COMMITÉ | CONSERVER [D] (arbitrage commit — risque n° 1 de perte) | diff git |
| H-02 | `server/app.test.ts` 22 393 (**modifié**) | L2/F | Tests A1 (3 145 728 o) | — | idem | idem [D] | idem |
| H-03 | `server/protocolVersion.ts` 4 144 (**non suivi**) | L2/F | `SUPPORTED_PROTOCOL_VERSIONS = ['1']`, classification fail-closed | Implémentation B22-07/D16 | idem | idem [D] | idem |
| H-04 | `server/protocolVersion.test.ts` 3 954 (**non suivi**) | L2/F | Tests parsing/classification | — | idem | idem [D] | idem |
| H-05 | `server/storage/contract.ts` 24 353 (**modifié**) | L2/F | Harness `describeDataStore` (contrat commun tout backend) | Contrat DataStore exécutable | idem | idem [D] | idem |
| H-06 | `server/storage/firestoreStore.ts` (**modifié**) | L2/F | Adaptateur Firestore | — | idem | idem [D] | idem |
| H-07 | `server/storage/firestoreStore.test.ts` 2 697 (**modifié**) | L2/F | Suite contrat sur émulateur (skip propre si indisponible) | — | idem | idem [D] | idem |
| H-08 | `server/storage/firestoreStore.attempt.test.ts` 20 477 (**non suivi**) | L2/F | Fake retry complet (A3) : seed/highWater/assigned, validation de lecture au commit | Sémantique d'attempts exécutable | NON SUIVI — risque de perte | idem [D] | idem |
| H-09 | `server/storage/firestoreStore.order.test.ts` 9 620 (**non suivi**) | L2/F | Garde read-before-write production (A2) | Règle de transaction exécutable | idem | idem [D] | idem |
| H-10 | `server/routes/kitchenRoutes.ts` 40 217 (**modifié**) | L2/F | Caps, limites, protocole | — | idem | idem [D] | idem |
| H-11 | `server/routes/kitchenRoutes.test.ts` 15 349 (**modifié**) | L2/F | Tests routes | — | idem | idem [D] | idem |
| H-12 | `server/routes/kitchenRoutes.stock.test.ts` 24 007 (**modifié**) | L2/F | Tests stock/caps | — | idem | idem [D] | idem |
| H-13 | `server/routes/kitchenHistory.test.ts` 16 696 (**modifié**) | L2/F | Tests historique | — | idem | idem [D] | idem |
| H-14 | `server/routes/kitchenProtocolGate.test.ts` 7 396 (**non suivi**) | L2/F | Tests du garde de protocole (fail-closed B22-07/D16 ; gate entre `syncLimiter` et les handlers GET/PUT ; requête non authentifiée jamais classée) | — | idem | idem [D] | idem |
| H-15 | `server/routes/kitchenStockConvergence.test.ts` 23 707 (**modifié**) | L2/F | Tests de convergence multi-appareils (SQLite + émulateur + KitchenStore/KitchenSync) | — | idem | idem [D] | idem |
| H-16 | `server/routes/lotF1LegacyFixture.test.ts` 9 047 (**non suivi**) | L2/F | Fixture D2 : repli exact du chemin de données de l'ancien client (`parseElementSet → mergeElementSets → presentIds`, dernier état pré-F1 = `f6cd2ed`) ; périmètre honnête déclaré : chemin de données, pas l'exécutable historique | Preuve « sans perte ni résurrection » | idem | idem [D] | idem |
| H-17 | `server/routes/tmp-debug.test.ts` 510 (**non suivi**) | L1/F | Placeholder temporaire (it.skip) — suppression bloquée par l'outillage de revue, documentée dans le rapport étape 2 | Aucune (placeholder) | TEMPORAIRE (pending deletion) | SUPPRESSION ENVISAGEABLE [P] — seul fichier dont la suppression est déjà demandée par le rapport | — |
| H-18 | `src/application/kitchen/KitchenSync.ts` 14 672 (**modifié**) | L2/F | Moteur de sync (push avant pull, `STALE_DEVICE_MS` 83 j) | — | idem | CONSERVER [D] | diff git |
| H-19 | `src/application/kitchen/KitchenSync.test.ts` 37 662 (**modifié**) | L2/F | Tests du moteur | — | idem | idem [D] | idem |
| H-20 | `src/application/ports.ts` 24 640 (**modifié**) | L2/F | Ports applicatifs | — | idem | idem [D] | idem |
| H-21 | `src/infrastructure/http/kitchenSyncHttpGateway.ts` 3 934 (**modifié**) | L2/F | Passerelle HTTP sync | — | idem | idem [D] | idem |
| H-22 | `src/infrastructure/http/kitchenSyncHttpGateway.test.ts` 6 368 (**modifié**) | L2/F | Tests passerelle | — | idem | idem [D] | idem |

---

## 3. Dépendances directes et indirectes (vérifiées)

### 3.1 Graphe documentaire principal

```
plan-consolide-pre-implementation.md (§ 8 D1–D16 = fait foi)
   ← lot-2.6.2-(dossier|rapport|rapport-consolide), audit-preparation, consolidation-vision, 14, 15
lot-F1-* (10 dossiers)  ←→  measure-lot-F1.ts / measure-a1-fullcaps.ts / gdir-repro-413.ts / seed-lot-F1.ts
   ← server/* (kitchenRoutes, app.ts, protocolVersion, contract, attempt/order/fixture tests), src/KitchenSync*
lot-2.1-conception-d3  ←→  mockups/d3 + benchmark  →  mockups/d4 (copie améliorée, 34→44 pages)
   ← audit-preparation, audit-annexe-perimetre, consolidation-vision, 15, lot-2.6.0
mockups/d4 : audit.html § 11 (autorité des statuts D-01…D-33) ← registre.html (historique), index.html (navigation)
   19 pages générées ← tools/pages.mjs + tools/generate-pages.mjs ← assets/{data.js, components.js, cn/*}
   76 captures ← tools/capture.mjs ; captures.html ← manifest rapport-captures.json
docs racine 04 et 07  →  donnees/scenarios-initiaux.json
```

### 3.2 Dépendances indirectes vérifiées [V]

- **Pages générées → ressources (12, carte lue dans `generate-pages.mjs`)** : 2 feuilles de style (`assets/app.css`,
  `assets/components.css`) et 10 scripts (`assets/data.js`, `assets/components.js`,
  `assets/cn/{i18n,common,home,fridge,recipe,flows,account}.js`, `assets/app.js`) — toute migration d4 doit conserver
  ces 12 ressources.
- **Pages écrites à la main → scripts (répartition exacte vérifiée page par page, 25 = 18 + 2 + 5)** :
  **18 pages** chargent `app.css` + `app.js` seuls (accueil, accueil-b, bandeaux, boutons, champs, composants, fondations,
  identite, listes, medias, modale, onglets, parcours, pastilles, propositions, publicite, responsive, shell) ;
  **2 pages** utilisent le runtime composants complet (`app.css` + `components.css` + `app.js` + `components.js` +
  `data.js` + les 7 `cn/*`) : `composants-cms.html`, `recettes-filtres-alt.html` ;
  **5 pages** sont statiques (`app.css` seul, aucun JS) : `audit.html`, `captures.html`, `diagrammes.html`, `index.html`,
  `registre.html`.
- **captures.html → 76 .jpg** : la galerie référence chaque capture par son nom exact ; le manifest porte les mesures.
  Supprimer une capture casse la galerie ; le manifest suffit comme inventaire de contrôle.
- **Références externes de d4** (R-12) : **aucun** lien relatif sortant de `d4/` (aucun `../`, aucun lien vers `backoffice.html`,
  le zip ou un fichier d3) ; seules mentions **textuelles** : `diagrammes.html` § 5 (chemin de rejeu `mockups/d3/benchmark`),
  `registre.html` (motif `mockups/backoffice.html`). Une absence de référence directe n'a pas été tenue pour preuve d'inutilité :
  `minify.cjs` a été lu et rattaché à `backoffice.html` (sortie `min.html` absente du disque), et les journaux d4-3001/3003
  mentionnent `public/__preset.html` — fichier vérifié **absent** aujourd'hui (transient de dev).
- **d3/benchmark ↔ d4/benchmark** : 19/19 fichiers byte-identiques (`cmp` fichier à fichier) — la redondance est vérifiée,
  pas supposée ; proposition d'unicité de copie au § 2.5.6 [D].
- **d3/registre ↔ d4/registre** : d4 = d3 + section § v4 (comparaison des sections) — la supplantation du registre D3 est
  vérifiée, l'état pré-audit reste l'information unique de la version D3.
- **docs racine → mockups** : 15, audit-preparation, audit-annexe-perimetre, consolidation-vision, lot-2.1, lot-2.6.0 citent
  `mockups/d3` et/ou `d4` — tout déplacement doit mettre à jour ces chemins (Étape C).
- **scenarios-initiaux.json** : référencé par 04 et 07 comme liste de départ du moteur — la destination conserve ce rôle.

---

## 4. Contradictions, incertitudes et points ouverts (recalculés)

| ID | Sujet | Constat précis (provenance) | Impact | Statut / décision |
|----|-------|------------------------------|--------|--------------------|
| X-01 | **Statut de D-04 (identité visuelle C « Zitouna »)** | `audit.html` § 11 : « ✅ validée (chef) — C retenue comme thème par défaut » (10 ✅ au total) ; `registre.html` § v4 : « 🚩 à confirmer » (9 ✅) ; même date 17/11 | Le thème par défaut des maquettes est **incertain** ; la consolidation n'écrira qu'après arbitrage | CONTRADICTOIRE [I] — **[D]** |
| X-02 | Comptage des décisions D4 | verdict audit.html + index.html : « 9 validées / 24 ouvertes » (= registre, D-04 non ✅) ; tableau § 11 : 10 ✅ (D-04 ✅). Divergence **localisée à D-04 uniquement** ; recalculé : 33 décisions, 9 ou 10 validées selon la source, 24 ou 23 autres | Le registre des décisions portera les deux lectures jusqu'à X-01 | Résolu par la résolution de X-01 [D] |
| X-03 | **v4.7 — recettes-filtres-alt.html** | Page v4.7 « à arbitrer — hors décision D-28 » ; **aucun D-34 dans le registre** | Alt 1 / Alt 2 jamais arbitrées ; l'alternative ne doit jamais être présentée comme référence | OUVERTE [D] |
| X-04 | S1–S12 (propositions.html) | 12 améliorations ; seul S12 → D-16 ; recommandation de lot (R1+F3+P2+Ramadan+S1,S2,S8,S9) **antérieure** à l'arbitrage D-28 (P2 non retenu) | 11 propositions sans statut ; la recommandation de la page n'est pas une décision | OUVERT [D] |
| X-05 | Vocabulaire des actions (CTA) | `pages.mjs`/`scenarios.html` : « Vérifier puis cuisiner », « Passer en mode cuisine », « jamais “prête” » (T5/T6) ; vocabulaire moteur du plan-consolide différent | Réconciliation terminologique lors de K-6, jamais reconstruite par supposition | À RÉCONCILIER [D] |
| X-06 | D-18 (logo) | registre : « ⏳ fourni par le chef » ; audit § 14 (v4.2) : « Logo fourni par le chef » ; identite.html : « le logo définitif sera fourni » (emplacements) | Les SVG de `assets/brand/` restent des emplacements tant que non confirmé | INCERTAIN [I] — [D] |
| X-07 | P1′ (priorités D3) | priorisation P1′ jamais tracée (constat v1, inchangé) | D3 reste ouvert | OUVERT [D] |
| X-08 | Rapport final T1 | 7 campagnes, 37/37 : jamais archivé en fichier ; en-têtes A3/T1 « en attente » à corriger | Retranscription verbatim (« transmis par le chef ») en Étape B + correction d'en-têtes | À COMPLÉTER [D] |
| X-09 | V12 § 4 | supplanté par C1 (analyse-identifiants) | marquer « supplanté » en consolidation | TRAITÉ EN B [P] |
| X-10 | lot-F1-corrections § 6 | supplanté par l'option B (stockage v4.10) | idem | TRAITÉ EN B [P] |
| X-11 | O-2 final / O-8 / O-4 Level B | ARB-07-O absent ; P4/G1–G5 absent ; valeurs Level B attendent O-5 | hors périmètre Étape A ; rappelés pour l'agenda | OUVERT |
| X-12 | Reg1 et l'index | relation exacte et budget **non établis** (Reg1 ≠ index — ancienne simplification retirée) | rester explicitement OUVERT ; aucune reconstruction par supposition | OUVERT [I] |
| X-13 | benchmark README | mentionne `entries.js` absent du paquet réel | corriger en Étape B ou noter comme incohérence | MINEUR [P] |
| X-14 | 8 tests « en attente » du run 21/11 | `output.json` : 8 pending non identifiés un à un (dont le placeholder `tmp-debug.test.ts`) | identification en Étape B (extraction depuis output.json) | À IDENTIFIER [P] |
| X-15 | Comptage « 38 pages HTML » de l'audit D3 | disque : **34** pages d3 | sans effet sur les actions proposées ; corrigé dans ce livrable | CORRIGÉ [V] |
| X-16 | « 77 captures » (v1 et v2.0) | disque + manifest + galerie : **76** | corrigé dans ce livrable (R-7) | CORRIGÉ [V] |
| X-17 | Suivi ouvert F1 : troncature silencieuse | l'anomalie mesurée (perte de `st_fridge_ing0299` au refus de caps, code G-01/G-12) n'a **aucun correctif autorisé** | suivi ouvert, traité dans K-1 rubrique « suivis » | OUVERT [I] |
| X-18 | Suivi ouvert F1 : commit des travaux | **Décompte unique du périmètre non sécurisé** : **35 fichiers de code/tests** — 22 de § 2.8 (H-01…H-22 : 15 modifiés + 7 non suivis) + 12 non suivis de `scripts/diagnostics/` (G-01…G-12) + 1 `a1debug.test.ts` (F-04) ; **19 documents** — 2 modifiés (`CLAUDE.md`, `09-qualite-tests.md`) + 17 non suivis de `donnees/` (R-1, dont ce livrable) ; **1 configuration** (`vite.config.ts`, modifié) ; **1 répertoire de preuve** (`.vitest/`, contenant `output.json` F-05) — soit **55 fichiers + 1 répertoire** (re-vérifié par `git status` en lecture seule pour la v2.3) | sécurisation Git — décision séparée de cet audit | OUVERT [D] |

---

## 5. Classement corrigé D3 / D4 / backoffice (exigences du chef)

1. **`docs/reference-visuelle/site/` = référence visuelle D4 uniquement.** Y entrent : les **44 pages d4**, les 5 assets
   runtime, les 10 fichiers de marque, les 4 outils (utilité durable démontrée), la galerie + les **76 captures classées
   preuve utile** et le manifest. **N'y entrent ni D3, ni `backoffice.html`, ni le harnais benchmark** (copie unique
   proposée dans le dossier d'évolution, § 2.5.6).
2. **D3 = source historique d'analyse** du lot 2.1, **pas une archive documentaire permanente ni une seconde référence
   visuelle**. Traitement retenu (consigne du chef) : **conservation temporaire pendant la consolidation** (sources
   disponibles, aucune perte prématurée, aucune suppression physique à ce stade) ; en Étape B, **reprise des informations
   encore utiles** dans le dossier de conception UX ou dans les analyses temporaires nécessaires (registre pré-audit,
   états « avant corrections », étude diagrammes) ; en Étape C, identification fichier par fichier des **candidats à
   exclusion ou suppression** (éléments sans utilité documentaire restante), après contrôle de non-perte. Les informations
   uniques sont identifiées **individuellement** (§ 2.4) ; la copie D4 n'est jamais présentée comme preuve suffisante de
   redondance. [P]
3. **`backoffice.html`** : maquette autonome distincte (99 Ko, sections propres, scénario « Laboratoire » pré-
   `scenarios-initiaux`), **non mélangée à la référence D4** → `evolutions/backoffice/analyses/` [P]. `minify.cjs` : outil
   ponctuel sans usage ni sortie — SUPPRESSION ENVISAGEABLE [P].
4. **Registre des décisions → `docs/evolutions/_transverses/registre-decisions.md`** (pas dans `solution/` : il porte des
   décisions ouvertes, des propositions, des cibles non implémentées, des abandons). Rôle strictement **centralisateur de
   statuts et de renvois** : une ligne par décision (id stable, statut `ACQUISE / OUVERTE / A ARBITRER / ABANDONNÉE /
   PROPOSITION / CIBLE`, autorité = document d'autorité, preuve éventuelle). Il ne devient **jamais** une seconde
   documentation normative : le contenu complet d'une règle reste dans son document de référence. Les documents de
   `solution/` référencent les décisions qui fondent les règles en vigueur, sans importer les arbitrages futurs.

---

## 6. Statut de la page d'accueil D4 (validation de maquette ≠ livraison produit)

**Ce qui est vérifié [V]** — preuves exactes, autorité et portée :

| Source | Ce qu'elle dit | Autorité |
|--------|----------------|----------|
| `audit.html` § 11 (tableau généré par script, D-01) | « Composition C “personnel d'abord, éditorial ensuite” **retenue par le chef (17/11/2026)**, avec 6 états » — statut **✅ validée (chef)** | tableau des décisions, source calculée |
| `registre.html` § v4 (D-01) | même texte, statut **✅ validée (chef)** | registre |
| `audit.html` § 13 (v4.1) | « **Accueil C validé (D-01)** ; l'éditorial passe sur une bande “miel” pour réchauffer le bas de page » | journal d'itération |
| `index.html` d4 | « Accueil C — composition retenue ✅ (6 états) » ; « Accueil A — **archive (non retenu)** » ; « Accueil B — **archive (non retenu)** » | navigation du paquet |
| `audit.html` § 11 (D-30, ✅ validée « faite ») | « Restent en HTML : les pages d'étude D3 et **les accueils A / B archivés** » | décision D-30 |

**Portée et limites [V]** : D-01 porte le **choix de conception** (composition C) et la **validation de la composition**
(6 états), au niveau des maquettes. Elle ne constitue **ni** une implémentation dans l'application (aucun code n'existe),
**ni** un statut de fonctionnalité livrée : **validation de maquette ≠ livraison produit**. Les étiquettes « archive
(non retenu) » de `index.html` et la mention D-30 « accueils A / B archivés » portent l'organisation du paquet, en
cohérence avec le choix de conception.

**Classement retenu (distinction confirmée par le chef, v2.2)** :

| Page | Statut | Marqueur |
|------|--------|----------|
| `d4/accueil-c.html` | **représentant de la composition C dans la référence visuelle D4** — composition validée comme choix de conception (D-01) ; **non implémentée, non livrée** dans l'application | [V] maquette / [I] implémentation |
| `d4/accueil.html` | **variante historique non retenue** pour cette composition (cohérent D-01/D-30) | [V] |
| `d4/accueil-b.html` | **variante historique non retenue** pour cette composition (cohérent D-01/D-30) | [V] |
| `d4/recettes-filtres-alt.html` | **alternative non arbitrée** (v4.7, X-03) — jamais présentée comme référence définitive | [D] |

Le jour où la composition C sera implémentée dans l'application, son statut passera à « livrée » **avec** la preuve du
commit correspondant — jamais par extrapolation documentaire.

---

## 7. Consolidations K-1…K-7 ajustées

Principes maintenus : une évolution = un **sujet fonctionnel cohérent** (pas un numéro de lot) ; `dossier.md` principal +
`analyses/` si nécessaire + `annexes/` si les preuves le justifient ; analyses temporaires regroupées par sujet, conclusions
intégrées au dossier ; preuves volumineuses à la demande ; `_transverses/` pour les sujets réellement transverses ;
**datastore regroupé par thèmes techniques cohérents, sans découpage artificiel ARB/DC** ; décisions acceptées non
implémentées restent dans les évolutions ; règles en vigueur intégrées aux documents de solution concernés avec provenance.

| ID | Sujet | Contenu cible | Distinctions exigées | Provenance | Destination |
|----|-------|---------------|----------------------|------------|-------------|
| K-1 | **Synchronisation cuisine / frigo** | `dossier.md` (fiche + contrats) + `annexes/preuves/` | **Échelle de statuts à 5 niveaux (exigence chef § 5)** : **(1) décision ou contrat accepté** — stock en entrées (B-F1-1…6), caps, ids `st_*`, gardes A2/A3, protocole B22-07 : acceptés et validés documentairement ; **(2) code présent dans l'arbre de travail, NON commité/non suivi** — A1 (`app.ts`), B22-07 (`protocolVersion`), gardes/tests A2/A3 : règle acceptée mais **pas encore livrée**, signalée séparément comme non sécurisée (X-18) ; **(3) tests historiques exécutés** — étape 3, campagnes A2/A3/T1, run du 21/11 (1 107 verts) ; **(4) code commité** — étapes 1–2 F1 (`e18f854`, `949cede`, `d3529c4`→`cae4677`) ; **(5) fonctionnalité réellement livrée et en vigueur** — uniquement le stock en entrées implémenté et commité. **(Suivis ouverts)** : commit des travaux (X-18), limite HTTP de production vs sync (constat 413, arbitrage payload/epoch), rapport final T1 non archivé (X-08), en-têtes A3/T1, correctif de l'anomalie de troncature jamais autorisé (X-17). **Règle : la présence d'un code non commité ou non suivi ne qualifie jamais une règle de « contrat livré et en vigueur » ; aucune validation documentaire ou architecturale n'est transformée en validation de livraison.** | B-20…B-32, G-01…G-04, F-04/F-05, H-01…H-22 | `evolutions/synchronisation-cuisine/` |
| K-2 | **Bascule fournisseur (DataStore)** | `dossier.md` + `analyses/` + `annexes/` | contrats (contract.ts, matrice capacités, mécanismes transversaux), protocole B22-07 ; lot 1.5 reporté = suivi actif, jamais fondu dans l'historique | B-02…B-06, B-38 (partie bascule), H-03…H-05 | `evolutions/bascule-fournisseur/` |
| K-3 | **Socle & shell** | `dossier.md` + `analyses/` | **2.6.0–2.6.2 = livrés** (le rapport consolidé 2.6.2 prime) ; **2.6.3 = dossier en attente de validation (AR-6)**, traité **séparément**, jamais regroupé avec les lots livrés ; lot 1.1 (besoins) et baseline 1.4 rattachés comme analyses d'origine | B-01, B-03, B-08…B-18 ; B-19 à part | `evolutions/socle-shell/` ; B-19 → `evolutions/accueil/` |
| K-4 | **Audits** | un document « audits consolidés » (conclusions + renvois annexes) | informatif, jamais normatif | B-33…B-35 | `evolutions/_transverses/analyses/` |
| K-5 | **Décisions produit & roadmap** | document d'**orientation** : rails, statuts des lots, renvois au registre | **jamais de duplication des règles de domaine** ; orientation et statut uniquement ; 2.6.3 (AR-6) et orientation multilingue = cibles explicites | B-19, B-37, B-38 (§ 8), B-40 | `evolutions/_transverses/` |
| K-6 | **État du projet** | document « état » court (rails, versions, livré vs décidé) + **réconciliation du vocabulaire CTA (X-05)** explicitement tracée | renvois uniquement ; aucune règle recopiée | B-39, X-05 | `evolutions/_transverses/` |
| K-7 | **Références permanentes** | analyse-identifiants + scenarios-initiaux.json, **sans fusion** | — | B-36, B-42 | `solution/references/` |
| — | **Registre des décisions** | une ligne par décision (tous les ids : D-01…D-33, D1–D16, AR-1…AR-6, B-F1-x, A-x, DC-x, O-x, S1–S12, I-x, C-x), statuts, autorités, renvois | centralisateur de statuts, **jamais** normatif ; placé dans les évolutions (§ 5.4) | E-20 (§ 11), E-21, B-38 | `evolutions/_transverses/registre-decisions.md` |

---

## 8. Architecture documentaire par niveaux (principe validé, sans rigidité)

| Niveau | Quoi | Où | Règle d'usage |
|--------|------|----|----------------|
| 0 | **Index général** : organisation, domaines, table de routage tâche→documents, règles de consultation | `docs/index.md` | chargé en premier par tout agent ; pointé par CLAUDE.md |
| 1 | **Fiches de contexte de domaine** | `docs/solution/fiches/<domaine>.md` | chargée quand la tâche touche le domaine |
| 2 | **Règles et contrats de référence** | `docs/solution/regles/<domaine>.md` | chargé pour toute modification du domaine |
| 3 | **Preuves et historique** | `docs/evolutions/<fonctionnalité>/{analyses,annexes}/` | chargé UNIQUEMENT si la tâche le requiert |

- Les tailles annoncées en v2.0 (≤ 200 lignes / ≤ 100 lignes…) sont des **objectifs indicatifs, pas des contraintes** :
  aucun document n'est fragmenté artificiellement pour respecter une cible [P].
- Métadonnées : 6 champs simples, réellement utiles au routage (domaine, niveau, nature, statut, autorité, compléments) —
  aucun champ décoratif ; un document sans besoin de routage peut s'en passer [P].
- Aucune règle dupliquée : une source de référence par règle, renvois ailleurs ; **le registre ne remplace jamais le
  document faisant autorité**.
- Le § 9 de la v2.0 (estimations de gain) reste **explicitement une projection non mesurée** ; aucune mesure n'est demandée
  ni exécutée à ce stade. Les chiffres « actuel » (octets réels mesurés) et « cible » (proposition) restent valables tels
  quels ; leur interprétation en tokens reste ≈ octets ÷ 3,8, plage 3,5–4,2, **projection**.

---

## 9. Points encore ouverts — synthèse finale (impact + décision attendue)

| # | Point | Impact | Décision attendue |
|---|-------|--------|--------------------|
| 1 | X-18 — commit des travaux non sécurisés (décompte unique § 4 : **35 code/tests + 19 documents + 1 configuration + 1 répertoire de preuve**) | **Perte possible du seul exemplaire de B22-07, A2/A3 fixtures, A1, tests F1, des dossiers F1 non commités et de ce livrable** | arbitrage de sécurisation Git, **séparé** de la validation de cet audit |
| 2 | X-01/X-02 — statut de D-04 | thème par défaut des maquettes incertain (9 vs 10 ✅) | arbitrage : audit.html ou registre.html fait foi |
| 3 | X-03 — Alt 1/Alt 2 des filtres (v4.7, sans décision tracée) | composition de la page Recettes ; l'alternative ne devient jamais une référence | arbitrage ou création de la décision |
| 4 | X-04 — statuts de S1–S12 | 11 améliorations sans statut | arbitrage un à un |
| 5 | X-05 — vocabulaire CTA maquette ↔ moteur | cohérence de la consolidation K-6 | réconciliation en Étape B (tracée) |
| 6 | X-06 — logo fourni ou emplacements | statut de `assets/brand/` | confirmation |
| 7 | § 2.5.6 — unicité de la copie du benchmark | une copie à conserver, l'autre SUPPRESSION ENVISAGEABLE | choix (a) copie d4 + mise à jour du chemin de rejeu, ou (b) copie d3 débarassée |
| 8 | X-08 — rapport final T1 + en-têtes A3/T1 | complétude des preuves K-1 | retranscription en Étape B (texte « transmis par le chef » à fournir) |
| 9 | X-14 — identification des 8 tests en attente du run 21/11 | clôture du compte « 1 107 verts » | extraction en Étape B depuis output.json |
| 10 | X-07 — P1′ non tracée | priorisation D3 | arbitrage |
| 11 | X-12 — relation Reg1/index et budget | documentation des mécanismes de préparation | rester ouvert jusqu'à établissement |
| 12 | D3 (priorités P1′/P1/P2/P3) — hors audit | agenda produit | arbitrage reporté |
| 13 | D3 — consolidation des informations utiles (Étape B) puis candidats à exclusion (Étape C) | périmètre et poids de la consolidation UX | conservation temporaire acquise ; périmètre final fixé pendant l'Étape B |
| 14 | Choix des consolidations K-1…K-7 et de l'architecture par niveaux | Étape B | validation de ce livrable, puis autorisation distincte de l'Étape B |

---

## 10. Périmètre négatif — limites de méthode déclarées (v2.2)

1. **Captures .jpg (76)** : binaires, non décodées individuellement ; inspection par le manifest intégral + comptage croisé
   disque/manifest/galerie (3×76) + `capture.mjs` lu (les mesures sont prises dans la page). Suffixe /F justifié : la valeur
   déclarée des captures est visuelle et mesurée ; le manifest est l'inventaire de contrôle.
2. **node_modules / dist (d3/benchmark)** : L5 comptage/taille ; regénérables par construction (le README du harnais prescrit
   leur absence du livrable).
3. **Pages d3 (31 non pivot)** : L3/P — **classement provisoire** (maintien temporaire statué) ; la **consolidation de
   leurs informations utiles** exigera en Étape B une lecture adaptée approfondie (sources disponibles pendant le travail) ;
   une suppression éventuelle exigerait, fichier par fichier, le contrôle de non-perte associé (Étape C, jamais avant).
4. **Pages d4 dérivées de D3 (fondations, boutons, champs, modale, listes, pastilles, bandeaux, onglets, shell, composants,
   parcours, responsive, medias, accueil, accueil-b)** : L3/P — **classement provisoire** ; leur statut (référence, outil de
   revue, variante historique non retenue) est porté par les décisions D-01/D-30 et la distinction du § 6, pas par une
   relecture de contenu ; aucun contenu de ces pages n'entre dans la consolidation.
5. **Fichiers de code et tests (§ 2.8)** : L2/F (en-têtes, constantes, passages connus des lots) — suffisante pour
   l'arbitrage de sécurisation Git ; ce ne sont pas des documents de consolidation.
6. **`tmp-c2debug.ts`** : L2/C — corps non lu ; **inspection complémentaire requise** avant tout statut de suppression
   (règle tmp-*).
7. Aucun fichier du périmètre n'a été jugé sur son seul nom, sa taille ou son en-tête : chaque action repose sur
   l'inspection déclarée ici ou sur une dépendance vérifiée (§ 3). Aucune mention « lecture intégrale » n'est portée par un
   fichier qui n'a reçu qu'une inspection structurelle ou par sections.

**Confirmation finale [V]** : **aucune opération Git modificatrice** (commit, push, reset, merge, stash, rebase, checkout
destructeur…) n'a été réalisée ; les consultations Git (`git status`, `git ls-files`, lecture de HEAD) ont été strictement
**en lecture seule** (re-consultée pour la v2.3 afin de vérifier le décompte X-18). Aucune modification de fichier (hors ce livrable lui-même), aucune exécution de test, aucune mesure,
aucun changement de code, aucun déplacement, renommage ou suppression n'a été réalisé. L'Étape B n'est pas commencée ; elle
attend la vérification de cohérence finale de ce livrable, puis la décision séparée du chef sur la clôture de l'Étape A et
l'autorisation de l'Étape B.
