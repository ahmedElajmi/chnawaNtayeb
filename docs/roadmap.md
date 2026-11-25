# Roadmap — Chnawa Ntayeb

> **Rôle strict** : synthèse de pilotage — état, rails, séquencement, décisions et renvois.
> **Jamais normative** : une règle métier vit dans son évolution ou dans `docs/solution/` ; cette page
> ne recopie pas les règles. Les décisions sans lot restent explicitement **incertaines**.
> Reconstruite à l'Étape C : registre des décisions, orientation produit et état projet dissous ici
> (couverture contrôlée) ; annexes verbatim en fin de document (sources transférées puis supprimées au nettoyage autorisé, contrôle de non-perte).

## 1. État du projet (au 21/11/2026)

Les chiffres ci-dessous sont le **constat daté du 21/11/2026** (commits, tests) ; ils ne décrivent
pas l'état du dépôt à la date de mise à jour de ce document. **Mise à jour de l'état Git et des
campagnes au 25/11/2026 (soir, clôture F1)** : voir la ligne « État de clôture F1 » ci-dessous.

- Branches locales (état au 25/11/2026) : `feature/datastore-contract` préservée (23 commits locaux au-dessus de `origin/develop`, branche historique) et `feature/stock-sync` — **14 commits locaux non poussés** (8 historiques F1 + 5 K-1/F1 + 1 formatage D2 `a1e4da8` ; X-18/X-19 : code K-1 commité, branche non poussée, aucune intégration dans `develop` ni livraison). **Un push n'est jamais assimilé à une livraison** ; aucun déploiement en production n'est réalisé ni revendiqué.
- **État de clôture F1 (25/11/2026, soir)** : les 4 PRs #57–#60 sont **fusionnées dans `develop`** (merge commits, `origin/develop` = `394fc0e` — la ligne ci-dessus décrit l'état **antérieur** à l'intégration, conservé pour la traçabilité) ; `master` = `3fb7b27`. **Clôture A4/D3** : les corrections AR-1 (option α) et AR-2 (P1) sont **implémentées et testées sur la branche `fix/stock-sync-integrity` (créée depuis `develop` @ `394fc0e`) — non commitées** (commit, PR vers `develop` et suppressions AR-4 sur autorisations distinctes). Campagnes du 25/11 : voie unitaire **1 112 passés / 8 ignorés / 0 échec — 114 fichiers** (après corrections) ; voie émulateur **54/54** (JDK 21 portable, réchauffage = condition de campagne — anomalie à froid **ouverte**, cause non élucidée) ; TypeScript **8 erreurs DT-01, aucune nouvelle**. **Intégration dans `develop` ≠ livraison en production** : rien n'est déployé, rien n'est revendiqué comme livré. Détail et preuves : `docs/evolutions/donnees-moteur/stock-entrees-sync/evolution.md` (rangée V1–V3) et son `preuves/`.
- Dernier run de tests consigné : **[BASELINE VÉRIFIÉE] 1 093 passés / 8 ignorés / 0 échec — 113 fichiers** (25/11, voie `unit` seule, `.vitest/json/output.json` — preuve de cette campagne uniquement). Le chiffre antérieur « 1 107 verts / 8 en attente » (21/11) est **[NON VÉRIFIÉ — preuve historique perdue]** (rapport écrasé le 25/11, non récupérable — K-1 X-14) et n'est plus cité comme référence démontrée.
- **Stock en entrées + sync cuisine** : fonctionnel et vérifié sur l'application exécutée depuis la branche de travail locale ; ne vaut ni intégration dans `develop`/`master`, ni déploiement. Détail : `docs/evolutions/donnees-moteur/stock-entrees-sync/evolution.md`.

### Réconciliation du vocabulaire CTA (X-05)

Autorité acquise (**D1**, plan-consolide § 8) : wording du niveau supérieur = « Tous les ingrédients semblent présents — quantités à vérifier » ; CTA = **« Voir la recette »** ; jamais « Passer en mode cuisine » présenté comme une garantie. Les maquettes D4 emploient parfois d'autres libellés : **la référence est D1** ; l'harmonisation des écrans se fait dans les lots UI (E2/E4…) sans modifier le moteur (`@/core/matching/display` = mapping tier → niveau d'affichage + codes de raisons ; traduction dans `MatchingBadge`/`MatchReason`).

## 2. Rails validés (ne pas rouvrir)

| Rail | Statut |
|------|--------|
| Stratégie SQLite/Firestore ; un seul fournisseur actif ; bascule = décision explicite distincte | acquise (ne pas rouvrir) |
| Séquence : conceptions 5a/5b/5c → F1 → F2 → F3 → préparation 6a → **1.5 (répétition générale, obligatoire)** → exécution 6a → 6b → 6c | acquise (voir § 4) |
| Phase 1 : 1.1–1.4 clôturés (`67cce86`, `22a6976`, `d860a68`) ; 1.5 reporté ; 1.6 reporté aux opérations de bascule | fait / reporté |
| Lots 2.6.0–2.6.2 clôturés (`2ec4a74`, `3f7565c`/`6107ab5`, `f8fc85b`) — commits locaux non poussés ; **E0 = fonctionnel sur la branche de travail, jamais qualifié « livré »** | fait |
| 2.6.3 (accueil) : dossier v2 corrigé, non validé, non implémenté (AR-6) | préparation |
| Porte mobile : M4 = hypothèse de travail (RN/Expo), décision par étude de faisabilité ; M5/T9 extraction différée | acquises |
| Orientation multilingue : registre des langues **en base** + tables de traduction relationnelles = cible ; champs `<champ>_<langue>` + `LANGUAGES` = convention en vigueur en attendant | cible |
| Section Budget (B1–B6) : principe validé (D14), exécution après 6a, périmètre arbitré avant réalisation | cible |
| 6a/6b/6c : migration définitive — uniquement après validation du lot 1.5 | cibles |
| Non-décisions confirmées (plan-consolide § 8) : stratégie SQLite/Firestore (ne pas rouvrir) ; « présence ≠ quantité suffisante » ; logique centralisée `src/core` sans toucher au modèle de stock ; architecture frontend 4 couches ; orientations mobile (cycle de vie injecté, garde étendue à `src/application`, monolithe modulaire, pas de natif ni d'extraction) ; séquence 1.5→6a→6b→6c ; « quantités jamais obligatoires » | font foi |

## 3. Carte des évolutions (22 dossiers) et chantiers sans dossier

**Dossiers** : `docs/evolutions/` — fondations-techniques (bascule-fournisseur, contrats-api) · donnees-moteur (stock-entrees-sync, conversions-disponibilite, substitutions, moteur-matching, catalogue-modeles) · consultation-catalogue (accueil, catalogue-suggestions, fiche-mode-cuisine, budget-recettes) · frigo-courses-planning (frigo-courses-ui, planning) · experience-utilisateur (comptes-invite, notifications, i18n-dynamique) · backoffice-cms (roles-permissions, cms-staged-online, contenu-editorial) · donnees-usage-monetisation (analytics, publicite, commerce-frontieres). Chaque dossier porte un `evolution.md` (squelette normalisé : objectifs, règles, décisions, architecture, dépendances, étapes, tests, preuves, état, provenance).

**Chantiers identifiés sans dossier (lignes de roadmap — règle « pas de dossiers presque vides »)** :

| Chantier | Décisions associées (statut) | Rattachement futur |
|---|---|---|
| Recommandations (phases 8.1/8.2) | conception différée | après 7.2 + 9.2 |
| Dette 2.7 (suivi permanent des conceptions) | — | lignes ci-dessous |
| Capacité hors-ligne (⤓, badge, file d'attente) | S11 OUVERTE 🚩 | à confirmer (D-07) |
| Onboarding / bienvenue | D9 acquise (favorable, hors routes publiques) | section de comptes-invite |
| Extension scan complet (E6) | scan existant en vigueur | à définir au dossier |
| E8 — expériences des sous-domaines F8 | **non défini** dans les sources | à définir |
| Détte de notes / autres S | S1–S10 ci-dessous | au dossier correspondant |

**Propositions S1–S12 (aucune décision sauf S12→D-16 ; la recommandation de lot de `propositions.html` est antérieure à D-28 et ne vaut pas décision)** :

| Id | Proposition | Statut |
|----|-------------|--------|
| S1 | « J'ai cuisiné ce plat » → retrait des ingrédients utilisés | OUVERTE 🚩 règle métier |
| S2 | Partage WhatsApp recette + liste | OUVERTE (rattachement incertain) |
| S3 | Recherche globale desktop + raccourci « / » | OUVERTE |
| S4 | Étal « À utiliser vite » (dates facultatives) | OUVERTE 🚩 donnée nouvelle (rattachement incertain) |
| S5 | Commandes vocales en mode cuisine | OUVERTE |
| S6 | Taille du texte A/A+/A++ dans le profil | OUVERTE |
| S7 | Tri des courses selon l'ordre du marché | OUVERTE |
| S8 | Couleur dominante calculée à l'import | OUVERTE |
| S9 | Polices auto-hébergées, 3 graisses, latin/arabe | OUVERTE (rattachement incertain) |
| S10 | Page « by chef Souhed » | OUVERTE |
| S11 | Badge « Hors ligne » + file d'attente | OUVERTE → capacité hors-ligne |
| S12 | Préférences alimentaires dès l'onboarding | OUVERTE → recoupe D-16 |

**Autres décisions sans lot identifié (statuts incertains conservés)** : D-12 (note communautaire, OUVERTE 🚩) · D-13 (stats profil : retirer « DT économisés », OUVERTE 🚩) · D-16/S12 (préférences alimentaires, OUVERTE 🚩) · D-24 (16 catégories issues de l'arbre /admin, OUVERTE 🚩) · D-15 (relecture native des traductions, OUVERTE 🚩) · D-18/D-19 (logo du chef / nom arabe, OUVERTE ⏳🚩) · D-21 (photos d'identité A ou B, OUVERTE 🚩) · D-10 (zones publicitaires exclues, OUVERTE 🚩) · X-01 (D-04 [I] — audit.html vs registre.html).

## 4. Séquencement et dépendances

Chaîne faisant foi (reorientation § 7 bis) :

> Conceptions **5a · 5b · 5c** (prérequis fonctionnels de conception) → réalisation **F1 → F2 → F3** (chaîne stricte) → **préparation 6a** (mapping, frigo préparé sans exécution) → **1.5** (répétition générale, obligatoire) → **exécution 6a** (migration) → **6b** → **6c**.

**6b — ce qui est couvert et ce qui reste** (clarification validée) :

| Tranche de 6b | Couverture |
|---|---|
| 6b.1 (stratégie d'allocation 🚩 choix) | **F3** |
| 6b.2 (étapes 0–2 : filtres, exact, précision) | **F2** |
| 6b.3–6b.5 (compatibilités/substitutions, allocation, verdicts) | **F3** |
| 6b.7a (sync double flux, hors ligne, tombstones) | **F1** — réalisé et vérifié localement |
| 6b.7b (évolution effective du modèle frigo, fournisseur actuel) | **réalisée en local sur le fournisseur actuel** (entrées = source de vérité, `ElementSet` = projection de lecture) ; transposition SQL **préparée mais non exécutée** — elle interviendra après la **revalidation de la synchronisation sur SQL**, laquelle dépend de l'**exécution de 6a** ; la transposition effective et sa vérification restent donc postérieures à ces prérequis ; jamais redéveloppée |
| **6b.6** (double exécution ancien/nouveau, mesures, seuil asynchrone) | reste à faire — **validation comparative** |
| **6b.8** (laboratoire D4) | reste à faire — **réalisation complémentaire** |
| Re-validation sync sur SQL + transposition/vérification frigo | post-6a — **précision 1 : la revalidation du sync sur SQL précède la transposition effective du modèle frigo** |
| Ancien / nouveau moteur | **précision 2 : l'ancien et le nouveau moteur restent exécutables jusqu'à la fin de la comparaison 6b.6 ; la bascule et le retrait relèvent de 6c** |
| Intégrations (cycle de vie 4.3, permissions `matching_settings`) | avec 6b.8 |

**Parallèles dès maintenant** : F4 (rien), F7 (léger, AR-5), préparation E1 (AR-6), F5 (décision de modèle au dossier). **Parallèles ensuite** : E2/E3/E5 après 2.6.2 (fait, bornes actuelles) ; E4 après F1/F2 (AR-1) ; E7 après F5+F6 ; F6 après F4 ; F8 après F4 (+D14) ; commerce conditionnel (porte 6–10).

## 5. Décisions sans dossier d'évolution (chantiers différés) — voir table § 3

Les décisions attachées à un lot vivent dans le `evolution.md` correspondant (§ 4 Décisions) :
D-01/D-25/D-22/D-23/D-05/D-10-partiel → accueil / interface · D-06 (favoris → E2) · D-08/D-17/D-27/D-28 → frigo-courses-ui et planning · D-20/D7 → notifications · D-33/D-02/D-03 → moteur-matching · AR-1…AR-6 → évolutions correspondantes · B-F1-1…6 → stock-entrees-sync · D1–D16, M4/M5/T9/M1 → évolutions correspondantes (D2/D13 → bascule et moteur ; D14/D11 → budget et E2 ; D15/D16 → contrats-api et i18n ; D12 pub → publicite).

## 6. Points ouverts transverses (inchangés, jamais arbitrés par la roadmap)

X-01 (D-04 [I]) · X-03 · X-04 · X-07 · X-12 · X-14 (preuve du run 21/11 non récupérable — baseline 25/11 en X-20 de K-1) · O-2 (verbatim ARB-07-O absent) · O-8 (P4/G1–G5 absents) · O-4 niveau B (dépend de O-5) · DT-05 (traces de session) · corpus chef F3 🚩 · AR-2 (persistance substitutions) · D-02/D-03 (règles métier) · périmètre D3 · baseline A.2 (emplacement de `lot-1.4-baseline-perf.md` **figé**) · **anomalie émulateur à froid (clôture F1, 25/11 — 401/timeouts sur le backend firestore de la convergence à froid, indépendante du code, cause non élucidée ; réchauffage = condition de campagne, pas une correction)** · **flake sporadique du test concurrent du contrat (sous charge, famille T1)** · **DT-01 : les 8 erreurs TypeScript restent gelées** · **B2-bis : formatage des documents volontairement formatables (autorisation distincte)**.

> **Clôtures du 25/11/2026** (retirées de cette liste, traces dans l'évolution) : **X-17** (troncature silencieuse — corrigé par A4, AR-1, sur `fix/stock-sync-integrity`, non commité) · **X-08** (en-têtes A3/T1 actualisés ; le rapport final T1 reste **non archivé** — point résiduel mineur conservé par l'évolution) · **X-18** (sécurisation Git) · **X-20** (campagne 25/11 + campagne des corrections).

### 6 bis. Arbitrages de session validés, traces non archivées (DT-05)

> **Retranscription** du **tableau de synthèse du § 6** de `registre-decisions.md` (comparaison
> ligne par ligne effectuée et **retranscription validée** ; le registre a ensuite été supprimé
> de son ancien emplacement lors du nettoyage autorisé, après cette validation). Cette retranscription **préserve les familles d'arbitrages, leurs références et
> leurs statuts** ; elle **ne constitue pas l'archivage exhaustif des traces de session** (dette
> DT-05 — les traces détaillées ne sont pas dans le dépôt ; leur retranscription intégrale
> exigera la trace de session validée, à fournir ou archiver). Conformément au registre, ces
> arbitrages ne sont **pas rouverts** (décisions acquises) ; le registre indiquait que leurs
> conclusions étaient intégrées aux arbitrages postérieurs (livrable v2.3) — cette correspondance
> n'est **pas démontrée famille par famille** dans la présente retranscription, qui est une copie
> de synthèse. Les distinctions **DÉCIDÉ / OUVERT / partiel** (O-4 niveau A vs niveau B, O-2,
> O-8) sont préservées strictement.

| Famille | Portée | Statut |
|---------|--------|--------|
| Session A | A-1…A-12 + I-1…I-19 + C-1…C-9 | **DÉCIDÉ** [DÉCIDÉ-A] |
| canon-prepare-v1 | P-1…P-7 | **DÉCIDÉ** |
| R-7a / R-7b, R-9 | réconciliations d'inventaire (captures 76, benchmark 19/19) | **DÉCIDÉ** |
| RECO (a)(b)(c) + O-12 | recommandations d'organisation documentaire | **DÉCIDÉ** |
| O-11, O-3, O-13 | arbitrage de points ouverts antérieurs | **DÉCIDÉ** |
| O-4 niveau A | arbitrage partiel (niveau B dépend de O-5, absent) | **DÉCIDÉ** (niveau A) / **OUVERT** (niveau B) |
| DC-1…DC-14 | préparation du canon documentaire | **DÉCIDÉ** |
| DC-2 (DC2-A01…A05) | arbitrage détaillé | **DÉCIDÉ** |
| DC-8 (DC8-A01…A08) | arbitrage détaillé | **DÉCIDÉ** |
| O-2 (final) | verbatim ARB-07-O absent du disque | **OUVERT** — bloque la retranscription L3, pas la consolidation L2 |
| O-8 | P4/G1–G5 absents du disque | **OUVERT** |

## 7. Annexes (transferts verbatim — sources transférées puis supprimées de leurs anciens emplacements après contrôle de non-perte)

Les annexes ci-dessous sont des transferts verbatim, section par section, des documents sources
(transférés verbatim, sources supprimées au nettoyage autorisé après contrôle de non-perte) : plan directeur V12
(`15-catalogue-organise.md`), plan de réalisation (`17-plan-de-realisation.md`),
reorientation de la roadmap (`reorientation-roadmap-carte-fonctionnelle.md`).
La table de correspondance couverture ↔ source figure dans le bilan de l'Étape C.

## Annexe — Plan directeur V12 — en-tête et cadrage

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 1-40), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

# 15 — Plan directeur et architecture plateforme (document unique, v12)

> **NATURE DU DOCUMENT (Étape B)** : document d'**orientation** (vision v12) — jamais une liste de
> règles en vigueur. Les règles encore en vigueur qu'il porte sont extraites avec provenance vers
> [04 Moteur de matching](solution/moteur-matching.md) (§ « Exigences permanentes du moteur ») et vers
> [09 Qualité & tests](solution/qualite-tests.md) (règles de réalisation, V12 § 31 cité) ; le § 4 est
> **supplanté** (arbitrage C1, voir ci-dessous). Le reste = cibles et roadmap — lire avec
> `docs/index.md` § 1 ; le registre (supprimé au nettoyage autorisé) : voir § 6 bis ci-dessus.
> Ce fichier a été supprimé de son ancien emplacement lors du nettoyage autorisé, après transfert
> de son contenu — couverture ligne à ligne complète (1037/1037) attestée au bilan C5 (destinations :
> annexe ci-après, extractions avec provenance, analyses verbatim).

Le **document de référence unique** : vue globale de toutes les modifications prévues par
domaine **et** la profondeur technique (moteur de matching, modèles, règles). Le moteur
Frigo ↔ Recettes est le **cœur fonctionnel** et la valeur différenciatrice : intelligent,
fiable, performant, paramétrable, administrable par des employés non techniques. Ses cinq
exigences sont indissociables : pertinence, fiabilité, performance, paramétrage métier,
expérience d'administration. **La précision prime sur le volume de suggestions** — mieux
vaut 8 recettes réellement réalisables que 30 dont plusieurs reposent sur des
correspondances erronées. Objectif d'échelle : 50 000 recettes et des centaines de règles
sans que l'administration ni la performance ne s'effondrent. **Utilisable sans jamais
saisir une seule quantité** — la quantité est une information complémentaire
facultative : deux modes de fonctionnement, **simple** (présence seule) et **avancé**
(quantités quand elles sont connues) (§ 8, § 12).

**Contraintes directrices** : budget zéro — **aucune fonctionnalité essentielle ne
dépend d'un service externe payant** (si un service externe devient indisponible ou
payant, les fonctionnalités principales continuent, en dégradation gracieuse : le scan
photo tombe sur la saisie manuelle) ; tout le contenu est préservé ; **aucune
modification du code, des modèles ou de la base sans validation explicite**.

**Préserver sans reconstruire** : la nouvelle architecture conserve les fonctionnalités
disponibles — elle ne supprime rien pour simplifier et ne repart de zéro sans raison.
Restent pleinement légitimes : modifier les implémentations limitées, remplacer les
mécanismes dépassés, refactoriser pour la qualité et la maintenabilité, regrouper ce
qui est dispersé, supprimer les dépendances inutiles et les mécanismes redondants,
faire évoluer les modèles quand c'est nécessaire. La priorité : **conserver le
comportement fonctionnel attendu** tout en améliorant profondément la qualité de
l'implémentation. La qualité du code n'est pas une phase ponctuelle : c'est une
**exigence permanente** de toutes les phases (§ 31).


## Annexe — Plan directeur V12 — PARTIE I : vue d'ensemble, architecture cible, inventaire

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 41-108), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE I — Vue d'ensemble

### 1. Synoptique des modifications par domaine

| #   | Domaine                            | État actuel (vérifié dans le code) | Modifications                                                                          | Phase |
| --- | ---------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| 1   | Recettes                           | Riche, validé par atelier          | Lignes identifiées, précision, tag_ids                                                 | 5b–6a |
| 2   | Ingrédients                        | Plat                               | Hiérarchie de variantes, précisions, conversions, fusions avec opération compensatoire | 5b–6a |
| 3   | Moteur de matching                 | Présence d'ids, sans quantités     | Reconstruit : frigo quantifié, allocation des stocks, niveaux, verdicts, explicabilité | 5a–6c |
| 4   | Classification                     | Arbre de catégories                | Axes, tags, migration `cuisine_type`                                                   | 6     |
| 5   | Organisation éditoriale            | Aucune                             | Groupes, collections, sélections, instantanés                                          | 6     |
| 6   | Présentation et campagnes          | Home codée                         | Sections, campagnes, prévisualisation                                                  | 7     |
| 7   | Back-office                        | Permissions limitées               | Refonte : identité, RBAC, widgets, diagrammes, laboratoire                             | 2–3   |
| 8   | Plateforme                         | Réglages moteur + thèmes           | Fonctionnalités, règles, entitlements-dons, audit                                      | 4     |
| 9   | Données                            | Firestore derrière `DataStore`     | Contrats par domaine, SQL hybride, migration                                           | 1     |
| 10  | Analytics                          | Aucune                             | Événements groupés, agrégats, minimisation                                             | 9     |
| 11  | Publicité                          | Aucune                             | Régie interne, décision serveur, entitlement prioritaire                               | 10    |
| 12  | Commerce, abonnements, restaurants | Aucune                             | **Frontières seulement** — rien de créé                                                | 11–13 |

### 2. Architecture cible : domaines et dépendances

Monolithe **modulaire** (la couche hexagonale actuelle) : quinze domaines aux frontières
explicites, un seul déploiement, extraction ultérieure possible par contrat.

```
Core Platform (règles, fonctionnalités, droits, localisation, audit)
   │
   ├── Identity & Access ─── Feature Management ─── Entitlements
   │
   ├── CATALOGUE CULINAIRE (le cœur actuel et futur)
   │     ├── Recipe Catalog
   │     ├── Ingredient Catalog (+ variantes, substitutions, unités)
   │     ├── Classification & Taxonomy
   │     ├── Content Organization (groupes, collections, campagnes, sections)
   │     ├── Selection Engine ──→ Recommendation Engine
   │     └── (sert de contexte à) → Advertising → Analytics
   │
   ├── COMMERCE ALIMENTAIRE (futur, frontières posées dès maintenant)
   │     ├── Product Commerce · Food Ordering · Partner Integrations
   │     └── Restaurants & plats préparés (Dish ≠ Recipe)
```

Dépendances assumées (les seules) : le Commerce **lit** le catalogue culinaire via ses
contrats et ne l'écrit jamais ; la Recommandation et la Publicité consomment du
**contexte**, jamais la structure interne d'un autre domaine ; l'Analytics est écrit par
tous, lu par le backoffice.

### 3. Inventaire de l'existant → domaine, et ce qui ne change PAS

| Fonctionnalité actuelle                                 | Domaine cible                   | Risque                                    |
| ------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| Recettes, atelier, validation, versions                 | Recipe Catalog                  | Faible                                    |
| Ingrédients, unités, prix min/max                       | Ingredient Catalog              | Moyen (variantes)                         |
| Catégories recettes / ingrédients                       | Classification                  | Faible                                    |
| Substitutions + réglages moteur                         | Ingredient Catalog / Selection  | Faible (modèle contextuel conservé)       |
| Frigo, kitchen sync                                     | Ingredient Catalog / Selection  | **Moyen** (entrées quantifiées)           |
| Listes de courses multiples, rayons, budget             | Ingredient Catalog (parcours A) | Faible — déjà sans dépendance commerciale |
| Recherche locale (MiniSearch)                           | Selection Engine                | Faible                                    |
| Comptes atomiques, équipe, rôles                        | Identity & Access               | Faible                                    |
| Thèmes, pays, PWA, sauvegarde JSON, SEO/SSR, scan photo | Core Platform / Interface       | Faible à nul                              |

**Préservations (aucune régression)** : atelier et validation cellule par cellule et
versions immuables ; publication de contenu validé seulement ; comptes (client /
employé / super admin, création atomique) ; frigo et hors-ligne ; recherche locale ;
listes de courses nommées et fusion par unité compatible ; rayons ; budget ; PWA et
installation ; thèmes ; sauvegarde / restauration JSON ; SEO serveur ; les 4 langues et
leur système ; coûts en fourchette ; accueil actuel en repli ; scan photo facultatif.


## Annexe — Plan directeur V12 — § 25 : Roadmap (phases 0–13)

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 802-844), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE VI — Réalisation

### 25. Roadmap (phases 0–13)

Les fondations 1–4, puis la séquence moteur/ingrédients — la **conception UX du
back-office et du laboratoire avance en parallèle** de la conception technique du
moteur, jamais après :

| Phase | Contenu                                                                                                 | Condition de passage                                               |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0     | Audit (fait, maintenu à jour)                                                                           | Inventaire convergent                                              |
| 1     | Contrats métier + indépendance fournisseur + SQL (mécanismes ; migration définitive reportée à 6a, § 4) | Contrats sur SQLite et Postgres, migration répétée en base de test |
| 2     | Fondations back-office, design system, **RBAC conçu**, écrans du laboratoire conçus (mobile et desktop) | Maquettes validées, résolution testée                              |
| 3     | Rôles et permissions implémentés                                                                        | Vérification serveur + journal + invalidation                      |
| 4     | Fonctionnalités, règles versionnées, localisation, audit                                                | Tables de vérité testées, bundle résolu                            |
| 5a    | Audit du moteur (fait) + **corpus constitué, mesuré sur le moteur actuel**                              | Métriques de départ publiées                                       |
| 5b    | Conception : Ingredient/RecipeIngredient/Fridge (décision § 7.1, sync § 8), écrans du laboratoire       | Modèles + contrats du sync + maquettes validées                    |
| 5c    | Conception des règles : compatibilités, substitutions, conversions, paramétrage à deux niveaux          | Bornes et garde-fous testés                                        |
| 6a    | Migration des données (hiérarchie, lignes, frigo → entrées ; aperçu avant application)                  | Réversible, comparée                                               |
| 6b    | Moteur par étapes + **double exécution ancien/nouveau sur le corpus**                                   | Zéro faux positif en strict, budgets tenus                         |
| 6c    | Validation métier, bascule contrôlée, retrait de l'ancien moteur                                        | Repli possible tant que non basculé                                |
| 7     | Présentation, campagnes, prévisualisation complète                                                      | Aperçu 4 langues × 2 modes × 3 appareils × profils                 |
| 8     | Recommandations                                                                                         | Dédoublonnage et exclusions testés                                 |
| 9     | Analytics                                                                                               | Agrégats quotidiens, confidentialité vérifiée                      |
| 10    | Publicité                                                                                               | Réconciliation nocturne, rapports sans traces personnelles         |
| 11    | Catalogue commercial (mapping validé humainement)                                                       | Mapping 100 % validé                                               |
| 12    | Paniers et commandes (conversion contrôlée, multi-vendeurs, instantanés)                                | Parcours A inchangé (non-régression dédiée)                        |
| 13    | Restaurants et plats préparés, puis abonnements (si besoin confirmé)                                    | —                                                                  |

Chaque phase passe les critères consolidés : `npm run check` **+** tests unitaires (y
compris tables de vérité et valeurs inconnues) **+** tests de contrat (memory, SQLite,
Postgres) **+** non-régression des fonctionnalités préservées **+** tests de sécurité
(refus par défaut, revérification serveur, anti-élévation, dernier super admin, limites
de débit) **+** performance et sécurité vérifiées quand la phase l'exige **+** **parité
fonctionnelle mobile/desktop du back-office vérifiée** **+** nettoyage et
refactorisation des composants concernés effectués et testés (§ 31) **+**
documentation des résultats, des réserves et sauvegarde testée. **La décomposition en
lots de travaux, les dépendances, les maquettes à valider et les points de contrôle
détaillés vivent dans le plan de réalisation (`17-plan-de-realisation.md`).**
Les maquettes (`docs/encyclopedie/mockups/backoffice.html`) sont des prototypes de
direction, pas une référence pixel-perfect — les écrans réels affichent les données
réelles et des états vides traduits.


## Annexe — Plan directeur V12 — § 26 : Impact code prévu

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 845-861), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 26. Impact code prévu (vue synthétique)

| Livrable                                                                                            | Type                       | Phase             |
| --------------------------------------------------------------------------------------------------- | -------------------------- | ----------------- |
| `src/core/rules` (registre, évaluateur, tables de vérité)                                           | nouveau                    | 4                 |
| `src/core/features` (fonctionnalités, bundle résolu)                                                | nouveau                    | 4                 |
| `src/core/permissions` (RBAC, résolution, anti-élévation)                                           | nouveau                    | 2–3               |
| `src/core/ingredients` (hiérarchie, précisions, conversions)                                        | évolution de `catalog`     | 5b–6a             |
| `src/core/matching` (frigo à entrées souples, allocation, niveaux, verdicts, piste)                 | refonte interne            | 5a–6c             |
| `src/core/selection` (`RecipeSelection`, exécution adaptative)                                      | nouveau                    | 6                 |
| `src/core/showcase` (campagnes, sections, visibilité)                                               | nouveau                    | 7                 |
| `src/core/commerce` (frontières : mapping, conversion liste → panier)                               | stub documenté             | —                 |
| `src/shared/ui/charts` (si composants internes retenus)                                             | nouveau                    | 2                 |
| Ports + stores + adapters + contrats par domaine                                                    | application/infrastructure | 1                 |
| Pages backoffice : Équipe & rôles, Fonctionnalités, Laboratoire, Organisation, Publicité, Analytics | interface                  | 2–3, 6–10         |
| Règles de base + registre serveur des nouvelles collections                                         | infrastructure             | au fil des phases |


## Annexe — Plan directeur V12 — § 27 : Risques transversaux

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 862-880), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 27. Risques transversaux

1. **Migration des données** (ingrédients → hiérarchie, frigo → entrées) : le risque
   n°1 — contenu par réversibilité, aperçu avant application et double exécution du
   moteur.
2. **Double consommation de stock** : couverte par l'allocation déterministe et ses
   tests dédiés.
3. **Sur-dimensionnement** : rien de commercial ni publicitaire avant les portes de
   passage ; les frontières suffisent.
4. **Complexité du paramétrage** : contenue par les deux niveaux et les garde-fous.
5. **Performance** : contenue par les budgets et les tests de charge en critère de
   phase.
6. **Budget zéro** : aucune brique n'exige un service payant ; les portes futures
   (paiement, scan photo, recherche hébergée à 50 000 recettes) restent facultatives
   derrière des ports.
7. **Sur-ingénierie** : chaque abstraction, module et mécanisme doit avoir une
   justification concrète ; une architecture experte mais **pragmatique**, adaptée aux
   moyens réels du projet — vérifié en revue de chaque phase.


## Annexe — Plan directeur V12 — § 28 : Décisions ouvertes (statuts de la revue)

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 881-908), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 28. Décisions ouvertes (statuts de la revue)

| Décision                                               | Statut                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle ingrédients (une entité + `variant_of` ou deux) | Ouverte — phase 5b, audit + tests comparatifs                                                                                                                   |
| Synchronisation du frigo                               | **Orientation validée** — étendre le CRDT si les tests de concurrence le valident                                                                               |
| Matching générique/variante                            | **Principe validé** — la précision demandée par la recette prime                                                                                                |
| Conversions dans les courses                           | **Orientation validée** — conditionnements distincts quand la nature diffère (conditionnement commercial ≠ variante culinaire)                                  |
| Profondeur de la hiérarchie                            | 3 recommandés, pas de limite artificielle si les besoins le justifient — confirmé en 5b                                                                         |
| Seuils de fiabilité                                    | **Validé** — définis depuis le corpus, jamais arbitrairement                                                                                                    |
| DLC / DDM                                              | **Arbitré** — un champ `expires_at` accompagné de `expiry_type: 'DLC' \| 'DDM'` (§ 8)                                                                           |
| Réservation du stock                                   | **Arbitré (précisé v12)** — deux modes **exclusifs** : quantitative (`reserved_quantity`) quand la quantité est connue, entrée entière (`reserved`) sinon (§ 8) |
| Héritage des règles génériques                         | **Arbitré** — explicite, configurable, désactivable ; une règle de variante remplace ou restreint la règle du générique (§ 7.5)                                 |
| Portions réduites                                      | **Arbitré** — intégrée au nouveau moteur ; trois faisabilités distinguées, recette originale jamais modifiée (§ 12)                                             |
| Saisie des quantités                                   | **Arbitré (v10)** — **jamais obligatoire** ; mode simple (présence seule) et mode avancé (quantités) (§ 8, § 12)                                                |
| Ingrédients de base (placard)                          | **Arbitré (v10, précisé v11)** — présence habituelle (jamais illimitée), épuisé temporaire + réactivation en un geste, sans quantités (§ 8)                     |
| Présence seule entre plusieurs lignes                  | **Précisé (v11)** — stock inconnu partagé : incertitude conjointe explicite, jamais une faisabilité vérifiée (§ 12)                                             |
| Suggestions individuelles                              | **Précisé (v11)** — évaluation par recette, limite expliquée à l'utilisateur ; allocation globale réservée à la planification future (§ 12, § 29)               |
| Détection photo                                        | **Précisé (v11)** — l'IA **propose**, seul l'utilisateur **confirme** ce qui entre dans le frigo (§ 8, § 17)                                                    |
| Stock permanent + entrées physiques                    | **Précisé (v12)** — les entrées physiques portent les quantités ; le permanent reste qualitatif, rien n'est réinventé à l'épuisement (§ 8)                      |
| Verdicts après achat / partiellement                   | **Précisé (v12)** — conditions et priorité déterministes : forme d'abord, puis quantités ; « sous réserve » indépendant du verdict (§ 12)                       |
| Séquençage de la migration SQL                         | **Précisé (v12)** — phase 1 = mécanismes ; migration définitive des données métier en 6a, après stabilisation des modèles (§ 4)                                 |
| Simulation globale asynchrone                          | **À mesurer** — gestion persistante des tâches (§ 14), bascule déterminée par des mesures réelles (§ 15), tranchée en 6b                                        |
| Périmètre mobile du laboratoire                        | **Résolu (v8)** — parité fonctionnelle mobile/desktop, présentation adaptée                                                                                     |
| Analytics                                              | **Validé** — liste fermée d'événements, collecte, consentement et rétention documentés (§ 22)                                                                   |
| Maquettes                                              | **Validé** — prototypes actuels comme direction, finalisation des écrans en phase 2                                                                             |
| Plan directeur                                         | **Validé sous réserves** — la V12 intègre les clarifications de la revue ; vérification finale avant définition de la phase 0/1                                 |


## Annexe — Plan directeur V12 — § 29 : Volontairement pas implémenté

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 909-918), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 29. Volontairement pas implémenté

Réservations automatiques menu ↔ frigo (marqueur manuel d'abord, lien automatique avec
le menu plus tard), **planification des repas avec allocation globale du stock entre
plusieurs recettes préparées ensemble** (les suggestions restent individuelles,
§ 12 ; la planification future réutilisera la même fonction d'allocation), détection
de péremption par photo, apprentissage automatique des règles, IA décisionnaire,
commerce et commandes, abonnements, ciblage publicitaire individuel, extraction de
services.


## Annexe — Plan de réalisation — en-tête, principes de découpage

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 1-44), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

# 17 — Plan de réalisation : phases, lots, dépendances et validations

Feuille de route opérationnelle qui découpe la **V12** (`15-catalogue-organise.md`,
référence de travail validée) en **lots indépendamment réalisables et validables**.
Ce document est soumis à **examen et validation avant tout développement**.

# 17 — Plan de réalisation

> **NATURE DU DOCUMENT (Étape B)** : document d'**orientation** (roadmap et découpage par
> phases — jamais des règles en vigueur). Exception : les **règles de réalisation et critères
> d'acceptation transversaux** (§ 21, § 22) sont des règles engageantes **extraites avec
> provenance** vers [09 Qualité & tests](solution/qualite-tests.md). Les statuts de lots à jour sont
> rails : `roadmap.md` § 2 ; arbitrages de session : § 6 bis ; orientation-produit et registre
> supprimés au nettoyage autorisé après transfert de leur contenu.

## 1. Principes de découpage

- Un **lot** est un bloc de travail avec un périmètre exact, des livrables, des critères
  d'acceptation et une **validation explicite** avant de considérer la suite.
- Convention « existant » : **C** conserver · **M** modifier · **R** remplacer ·
  **S** supprimer · **—** rien à faire. Toute suppression est précédée de l'analyse
  d'usage (direct, indirect, dynamique, par configuration — § 31 de la V12).
- **Aucun lot ne commence sur la seule base du plan directeur** : les lots
  d'implémentation front-end attendent la **validation de leurs maquettes** ; les lots
  de conception des modèles attendent la validation de leur spécification.
- Les lots marqués **🚩** exigent une décision ou une validation du chef avant de
  démarrer.
- Tailles : **S** ≤ quelques jours · **M** une à deux semaines · **L** plusieurs
  semaines (complexité, pas un calendrier contractuel).
- Exigences permanentes, citées par défaut dans les critères de chaque lot :
  `npm run check` vert · non-régression des fonctionnalités préservées (V12 § 3) ·
  parité fonctionnelle mobile/desktop du back-office · tests de sécurité pertinents ·
  nettoyage et refactorisation des composants concernés (V12 § 31) · budget zéro.
- **Documentation** : `docs/encyclopedie/` et `CLAUDE.md` **ne sont pas mis à jour à
  chaque lot ou développement** — ils le sont **uniquement à la demande du chef, en fin
  de release**. Cela n'empêche pas les **livrables techniques indispensables** de
  chaque lot : spécifications, rapports de tests, décisions d'architecture, résultats
  de migration, etc. **Aucune documentation générale redondante** n'est créée à chaque
  intervention.
- **Non-régression explicite par lot** : chaque présentation d'approche identifie les
  **fonctionnalités existantes impactées**, les **risques de régression** et les
  **tests nécessaires** ; aucune fonctionnalité existante n'est supprimée ou dégradée
  sans justification et **validation préalable**.


## Annexe — Plan de réalisation — § 2 : Vue synthétique de la roadmap

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 45-71), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 2. Vue synthétique de la roadmap

| Phase | Thème                                                                     | Lots      | Peut démarrer après                                                                                                      | Porte de validation                                                                                                                                                                                                   | Taille |
| ----- | ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0     | Audit (fait)                                                              | 0.1       | —                                                                                                                        | —                                                                                                                                                                                                                     | fait   |
| 1     | Contrats métier + indépendance fournisseur + SQL                          | 1.1–1.6   | V12 + ce plan                                                                                                            | **G1** : contrats verts sur SQLite (+ tout moteur SQL retenu, testé via le harnais)                                                                                                                                   | L      |
| 2     | Design system, fondations back-office, conception RBAC & laboratoire      | 2.1–2.8   | dès la validation de ce plan (0.1 déjà fait) — **dépendances par lot, pas par phase**                                    | **G2** : maquettes validées, spécifications signées                                                                                                                                                                   | L      |
| 3     | Rôles et permissions                                                      | 3.1–3.5   | 3.1–3.2 après 2.3 validé ; 3.3–3.4 après 3.2 + 2.8 ; 3.5 après 3.2                                                       | **G3** : RBAC vérifié serveur + journal                                                                                                                                                                               | M      |
| 4     | Plateforme (règles, fonctionnalités, configs, dons)                       | 4.1–4.6   | 4.1/4.3 dès validation du plan ; 4.4 après 2.8 ; 4.2/4.5 après 3.x ; 4.6 après 4.3 (échine transversale — amendement 18) | **G4** : tables de vérité testées, bundle résolu                                                                                                                                                                      | L      |
| 5a    | Corpus et mesures de référence                                            | 5a.1–5a.3 | dès la validation de ce plan (prérequis : cas métier du chef + moteur actuel — **sans attendre la phase 1**)             | **G5a** : métriques de départ livrées (baseline versionnée)                                                                                                                                                           | M      |
| 5b    | Modèles ingrédients/recette/frigo — conception                            | 5b.1–5b.5 | 5a.1 (5b.3 attend 5b.2 : modèle d'entrée stabilisé)                                                                      | **G5b** : modèles + sync + maquettes validés                                                                                                                                                                          | L      |
| 5c    | Règles de matching — conception                                           | 5c.1–5c.5 | 5b.2 (début de 5b suffit pour 5c.1–5c.3)                                                                                 | **G5c** : bornes, garde-fous et sémantique testés                                                                                                                                                                     | M      |
| 6a    | Bascule globale du fournisseur + évolution des modèles (sur SQL)          | 6a.1–6a.4 | 5b.5 + 1.2 + 1.3 + 1.4 (frigo : préparation dès 5b.3, évolution du modèle après 6b.7b — § 12)                            | **G6a** : réversible, comparée — 🚩 bascule en production sur décision explicite                                                                                                                                      | L      |
| 6b    | Moteur par étapes + double exécution + sync + laboratoire                 | 6b.1–6b.8 | 5c.5 + 6a.1 (6b.7a/7b s'appuient sur 5b.3 + 6a.1)                                                                        | **G6b** : zéro faux positif en strict **sur le corpus validé**, mesures complémentaires, budgets tenus, sync validé (6b.7a) ; **évolution du modèle frigo exécutée seulement si 6b.7b autorisé** — jamais automatique | L      |
| 6c    | Validation métier, bascule, retrait                                       | 6c.1–6c.3 | 6b.6 + 6b.7b + D1/D2 validées                                                                                            | **G6c** : moteur nouveau seul en production                                                                                                                                                                           | M      |
| 7     | Classification, éditorial, présentation, campagnes                        | 7.1–7.5   | 6c.3                                                                                                                     | **G7** : aperçu complet validé                                                                                                                                                                                        | L      |
| 8     | Recommandations                                                           | 8.1–8.2   | 8.1 après 7.2 + 9.2 ; 8.2 après 8.1                                                                                      | **G8** : dédoublonnage testé                                                                                                                                                                                          | S/M    |
| 9     | Analytics                                                                 | 9.1–9.4   | 4.x                                                                                                                      | **G9** : agrégats et confidentialité vérifiés                                                                                                                                                                         | M      |
| 10    | Publicité                                                                 | 10.1–10.5 | 10.1–10.2 après 4.1 + 4.5 ; 10.3 après 10.1 ; 10.4 après 10.2 + 10.3 + 7.4 + D6 ; 10.5 après 10.2 + 7.4 + D6             | **G10** : réconciliation et confidentialité                                                                                                                                                                           | M      |
| 11    | Catalogue commercial — **perspective conditionnelle**                     | 11.1–11.2 | **décision explicite du chef + besoin confirmé**                                                                         | **G11** : mapping 100 % validé                                                                                                                                                                                        | M      |
| 12    | Paniers et commandes — **perspective conditionnelle**                     | 12.1–12.3 | décision explicite + G11                                                                                                 | **G12** : parcours A inchangé                                                                                                                                                                                         | L      |
| 13    | Restaurants, plats préparés, abonnements — **perspective conditionnelle** | 13.1–13.2 | décision explicite + besoin confirmé + G12                                                                               | —                                                                                                                                                                                                                     | L      |

**Capacité Budget (§ 24)** : proposée et **non validée** — elle n'apparaît pas dans
cette table ; ses lots (B1–B6) ne rejoignent la roadmap et le § 23 qu'après
validation de la section § 24 par le chef.


## Annexe — Plan de réalisation — § 3 : Plan de conception graphique

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 72-118), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 3. Plan de conception graphique (avant toute implémentation front-end)

La conception est un **travail à part entière**, jamais une finition. Chaque paquet
gagne des maquettes représentatives : parcours principaux, états (vide, chargement,
erreur, hors-ligne, saisie en cours), adaptations **mobile / tablette / desktop**,
**4 langues dont RTL**, thème clair/sombre — examinées, ajustées et **validées
explicitement par le chef** avant le développement des écrans correspondants.

**Critères de validation UX** (exigés pour chaque paquet) : les maquettes démontrent
les **parcours réels** de bout en bout, la **simplicité d'utilisation** (prise en main
immédiate, **rapidité** d'accomplissement des tâches clés, y compris pour des
utilisateurs peu habitués), les **états complets** des écrans (y compris états
particuliers : hors-ligne, saisie en cours, erreurs), la **compréhension immédiate des
informations** (le contenu se lit sans déchiffrage — explications du moteur comprises
en un coup d'œil), la **fluidité** perçue, la **responsive** et la **cohérence
mobile/desktop**. Pour D1/D2 : une **validation des parcours auprès de quelques
utilisateurs représentatifs** (3 à 5, test modéré léger : tâches clés sans aide,
chronométrées, questions de compréhension) avant implémentation.

**Séparation moteur / interface** : le développement du moteur (6b) avance
**indépendamment** des maquettes D2 ; mais **aucune interface publique** exposant le
moteur (suggestions, explications, verdicts) n'est implémentée avant la **validation
de D2** — le moteur peut être prêt avant son affichage, jamais l'inverse.

**Parité mobile — opérations complexes incluses** : la parité fonctionnelle du
back-office concerne aussi le **laboratoire et les simulations**, les **éditeurs** de
recette et d'ingrédient, la **gestion des rôles** et des **configurations**, les
comparaisons et les restaurations — **l'interface peut être adaptée, aucune
fonctionnalité n'est absente sur mobile**.

**Frigo client — simplicité non négociable** : aucune quantité obligatoire, ajout
rapide par saisie ou photo, confirmation des ingrédients reconnus, gestion simple des
épices et ingrédients permanents. Le frigo **n'est jamais transformé en outil complexe
de gestion de stock** — toute fonction de frigo est jugée à l'aune de cette exigence.

| Paquet                                    | Contenu des maquettes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Valide les lots                                                                       | Priorité                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| **D1 — Identité & app client**            | Identité visuelle moderne/simple/élégante (typo, couleurs, iconographie, composants) ; accueil, recherche, **frigo très simple** (ajout rapide sans quantités : saisie ou photo, confirmation des ingrédients reconnus, placard/épices gérés simplement), suggestions avec explications du moteur, détail recette, courses, réglages ; états et RTL                                                                                                                                                                                                                                          | front-end client des lots 6b–7 et au-delà ; l'app existante reste servie en attendant | 1re vague               |
| **D2 — Moteur rendu visible**             | Cartes de suggestion valorisant l'intelligence : ingrédients disponibles / manquants / substitués, « sous réserve », substitutions expliquées, verdicts avec ajustement de portions ; fiche recette avec lignes expliquées. **Aucune interface publique du moteur n'est développée avant validation de ce paquet**                                                                                                                                                                                                                                                                           | 6b–6c (interface publique du moteur — le moteur lui-même avance indépendamment)       | 1re vague               |
| **D3 — Back-office fondations**           | Shell, navigation repliable, tableau de bord widgets, tableaux, formulaires, prévisualisation publique ; version mobile de tout                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 2.2, 3.3, 3.4                                                                         | 1re vague               |
| **D4 — Laboratoire**                      | 3 vues, comparaison de configurations (mobile inclus), bibliothèque de scénarios, simulation globale, portes de publication, résumé des conséquences                                                                                                                                                                                                                                                                                                                                                                                                                                         | 5b.4, puis impl labo                                                                  | avec 5b                 |
| **D5 — Éditeurs & données**               | Éditeur de recette renforcé, éditeur d'ingrédient + variantes, gestion du frigo admin, fusion avec prévisualisation, écran de migration avec aperçu, **gestion des prix (fourchettes, unité de référence, date d'actualisation, fraîcheur, mise à jour groupée) et paramètres des rubriques budget (seuils, activation, régime)** — **implémentation : 6a.4 (éditeurs métier), 6a.2 (écrans de migration) et B4 (prix & paramètres budgétaires, si § 24 validé) ; la gestion administrative du frigo n'autorise jamais sa migration effective, qui respecte la séquence 6b.7a/6b.7b (§ 12)** | 6a.2, 6a.4 ; B4 (si § 24 validé)                                                      | avec 5b–6a ; B4 avec B3 |
| **D6 — Editorial, campagnes, stats, pub** | Organisation éditoriale, éditeur de home, campagnes, analytics (diagrammes), publicité                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 7.x, 9.x, 10.x                                                                        | avec 7+                 |

Chaque paquet est **examiné et ajusté** avant validation ; une validation vaut pour le
parcours et les états présentés, pas pour un rendu pixel définitif.


## Annexe — Plan de réalisation — § 4 : Phase 0 (audit)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 119-124), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 4. Phase 0 — Audit (fait, maintenu à jour)

| Lot | Objectif & périmètre                                                                                                                                       | Existant | Livrables & critères                                                                                              | Risques / décisions |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
| 0.1 | Inventaire vérifié du code (moteur, données, comptes, collections, touchpoints Firestore, scan photo) — fait en V12, **maintenu à jour** pendant le projet | —        | Table de la V12 § 3 + faits vérifiés (§ 4–9) ; critère : toute affirmation d'existant est vérifiable dans le code | —                   |


## Annexe — Plan de réalisation — § 6 : Phase 2 (fait)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 195-214), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 6. Phase 2 — Design system, fondations back-office, conceptions

Objectif : **concevoir** l'identité visuelle du back-office (et D1/D2 pour le client),
concevoir RBAC et laboratoire **avant** de les implémenter, et cartographier la dette
technique. **La conception graphique et le prototypage sont séparés de
l'implémentation technique** : les tokens définitifs, composants et intégrations ne
sont développés qu'**après validation des maquettes et de l'identité visuelle**
(lot 2.8).

| Lot | Objectif & périmètre                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Existant                                     | Dépend de                                              | Livrables & critères                                                                                          | Risques / décisions                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 2.1 | **Conception graphique + prototypage (D3 partie 1)** : direction visuelle (tokens proposés, typo, couleurs, espacement, rayons), maquettes de composants, thème clair/sombre, RTL, 4 langues ; **étude comparative des solutions de diagrammes** (composants internes vs bibliothèques existantes : performance, poids frontend, accessibilité, maintenance) + prototype — **conception et maquettes seulement, aucune implémentation définitive**                                                                                          | C conventions, M shell existant              | validation du plan (0.1 déjà fait)                     | Paquet de maquettes D3 validé ; critère : 375/320 px, RTL et 4 langues vérifiés sur les maquettes             | 🚩 validation de l'identité visuelle + 🚩 choix des diagrammes |
| 2.2 | **Conception + maquettes (D3 partie 2) — aucune implémentation définitive** : navigation repliable, contexte, menu construit depuis les permissions, recherche globale, tableaux avec actions groupées, prévisualisation publique (contexts)                                                                                                                                                                                                                                                                                                | C `ModalShell`, `useCloseOnBack`, C patterns | 2.1                                                    | Maquettes validées ; critère : tous les états et les 2 tailles mobiles couverts                               | 🚩 validation des maquettes                                    |
| 2.3 | **Conception RBAC** : modèle ressource × action × périmètre, règles de résolution (union, refus par défaut, `manage` sans `roles`, anti-élévation, scopes par item), cache `permissions_revision`, dernier super admin (verrouillage)                                                                                                                                                                                                                                                                                                       | C modèle de comptes                          | indépendant                                            | Spécification signée + jeu de tests de résolution écrit ; critère : chaque règle a son test prévu             | 🚩 validation du modèle                                        |
| 2.4 | **Conception du laboratoire (D4)** : 3 vues, comparaison de configurations (mobile inclus), bibliothèque, simulation globale asynchrone, portes de publication, résumé des conséquences, correspondances acceptées/refusées                                                                                                                                                                                                                                                                                                                 | C simulateur existant                        | 2.1                                                    | Maquettes validées (desktop + mobile) ; critère : vue technique inclut allocation, conversions, règles, temps | 🚩 validation des maquettes                                    |
| 2.5 | Tableau de bord widgets (réorganisables/masquables par rôle, filtres temporels, états vides) — design — **implémenté en 2.8**                                                                                                                                                                                                                                                                                                                                                                                                               | —                                            | 2.1                                                    | Maquettes validées                                                                                            | —                                                              |
| 2.6 | **D1/D2 (client)** : identité visuelle de l'app client + parcours (accueil, recherche, frigo, suggestions avec explications du moteur, détail recette, courses, réglages, scan photo) + états + RTL                                                                                                                                                                                                                                                                                                                                         | C app existante                              | validation du plan (peut avancer en parallèle de tout) | Maquettes validées ; l'app actuelle continue de tourner                                                       | 🚩 validation de l'identité visuelle client                    |
| 2.7 | **Audit de dette technique** : code mort candidats, duplications, composants surchargés, dépendances inutiles — avec vérification d'usage (direct/indirect/dynamique/config)                                                                                                                                                                                                                                                                                                                                                                | —                                            | indépendant                                            | Plan de nettoyage intégré aux lots suivants ; critère : chaque candidat a son verdict usage                   | —                                                              |
| 2.8 | **Implémentation des fondations du back-office (D3)** — **au-delà des tokens et composants graphiques** : shell, layout, navigation repliable, composants communs, recherche globale, tableaux, prévisualisation publique ; **inclut l'implémentation du tableau de bord conçu en 2.5** (widgets, états vides ; branchement sur les permissions effectives en 3.4) — **démarre uniquement après validation des maquettes D3, du tableau de bord (2.5) et de l'identité visuelle** ; cohérence avec les décisions de 2.1 (diagrammes inclus) | —                                            | 2.1 validé + 2.2 validé + 2.5 validé (tableau de bord) | Fondations implémentées ; critère : mêmes critères que les maquettes (375/320 px, RTL, 4 langues, 2 thèmes)   | —                                                              |


## Annexe — Plan de réalisation — § 16 : Phases 8–10

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 370-384), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 16. Phases 8–10 — Recommandations, analytics, publicité

| Lot  | Objectif & périmètre                                                                                                                                                                                                                                              | Existant                 | Dépend de              | Livrables & critères                                            | Risques / décisions             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------- | --------------------------------------------------------------- | ------------------------------- |
| 8.1  | Recommandations : dédoublonnage, exclusions (récemment vues), agrégats de popularité                                                                                                                                                                              | —                        | 7.2, 9.2               | Critère : tests de dédoublonnage et exclusions                  | —                               |
| 8.2  | Mixage recherche / matching / recommandation cohérent (contextes distincts conservés)                                                                                                                                                                             | C recherche MiniSearch   | 8.1                    | Critère : frigo vide = navigation, jamais matching sans matière | —                               |
| 9.1  | Liste fermée d'événements + envoi par lots échantillonnés + consentement (Réglages › Confidentialité)                                                                                                                                                             | —                        | 4.1                    | Critère : aucune donnée identifiable ou ré-identifiable         | 🚩 liste d'événements à valider |
| 9.2  | Agrégats quotidiens serveur + purge bruts 30 j + rétention documentée                                                                                                                                                                                             | —                        | 9.1                    | Critère : rétention et champs publiés dans Confidentialité      | —                               |
| 9.3  | Widgets et diagrammes alimentés par les agrégats uniquement (D6)                                                                                                                                                                                                  | C `src/shared/ui/charts` | 9.2 + D6               | Critère : parité mobile, RTL, 4 langues                         | —                               |
| 10.1 | Décision publicitaire serveur : préfiltrage indexé → règles → fréquence (comptée à la décision) → classement                                                                                                                                                      | —                        | 4.1, 4.5               | Critère : le client ne voit jamais ciblage/budget               | 🚩 règles d'affichage initiales |
| 10.2 | Idempotence `event_id`, audience agrégée, jeton signé, réconciliation nocturne                                                                                                                                                                                    | —                        | 10.1                   | Critère : rapports sans traces personnelles                     | —                               |
| 10.3 | Entitlement `no_ads` **prioritaire** sur toute règle d'affichage (zone masquée, jamais allégée)                                                                                                                                                                   | C 4.5                    | 10.1                   | Critère : test prioritaire automatique                          | —                               |
| 10.4 | « Sponsorisé » obligatoire, traduit (4 langues) ; régie interne sans SDK tiers — **intégration dans les espaces éditoriaux : attend 7.4 et les maquettes D6** — **aucun affichage publicitaire avant que la priorité `no_ads` (10.3) soit implémentée et testée** | —                        | 10.2 + 10.3 + 7.4 + D6 | Critère : budget zéro respecté                                  | —                               |
| 10.5 | Écran Publicité du back-office (D6) : campagnes, budgets, rapport agrégé — attend aussi **7.4**                                                                                                                                                                   | —                        | 10.2 + 7.4 + D6        | Critère : parité mobile                                         | —                               |


## Annexe — Plan de réalisation — § 18 : Parallélisation et ordre d'exécution

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 403-447), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 18. Parallélisation et ordre d'exécution optimisé

**Fil conducteur séquentiel (ordre imposé, rail technique uniquement)** :
0.1 → 1.1 → 1.2 → 1.3/1.4 → 1.5 → **G1** → 3.1–3.5 (2.3 et 2.8 requis selon les lots)
→ 4.1–4.5 → 5b → 5c →
6a → 6b → 6c → 7 → (8, 9, 10) → portes commerce (conditionnelles).

**Le fil conducteur ne représente que le rail technique principal** : les prérequis de
conception et de design (2.3 conception RBAC, 2.8 fondations implémentées, maquettes
validées D1–D6) restent exigés selon les **dépendances propres à chaque lot** (tableaux
§ 5–17) — un lot ne démarre jamais sur la seule position dans le fil.

**Rails parallèles recommandés** (sans rupture de dépendances) :

- **Design** (2.1 → 2.2/2.4/2.5 ; 2.6 D1/D2 ; 2.7 dette) dès la validation de ce plan —
  le design n'attend pas la couche données.
- **5a (corpus)** dès la validation de ce plan (prérequis : cas métier du chef,
  moteur actuel) — **sans attendre la fin des travaux techniques de la phase 1** ;
  il nourrit toutes les décisions 5b/5c/6b.
- **9.x** peut démarrer après 4.x (parallèle à 7) ; **publicité** : 10.1–10.2 après
  4.1 + 4.5, **10.3** après 10.1, **10.4** après 10.2 + 10.3 + 7.4 + D6, **10.5** après
  10.2 + 7.4 + D6 — cf. synthèse de la phase 10.
- **2.3 (conception RBAC)** avant 3 : peut avancer pendant 1.x.
- **5b.1** (modèle ingrédients) démarre dès 5a.1 ; **5b.3** (prototype CRDT)
  attend la validation de la **spécification d'entrée stabilisée (5b.2)** — le
  prototype de sync s'appuie sur le modèle d'entrée, pas l'inverse.
- **Budget (§ 24, si la section est validée)** : B1–B2 dès la validation de la
  section (core pur, indépendant du moteur) ; B3 après 6a.1 + 6a.3 (migration des
  recettes et ingrédients **et source de vérité stabilisée**) ; B4 après B3 + D5
  (maquettes prix/budget incluses dans D5, § 3) + 4.1/4.2/4.3 (mécanismes de
  configuration réutilisés, jamais un second système) ; B5 après 7.2 + 7.4 ;
  B6 (facultatif) après 9.2 — rail parallèle qui ne
  modifie ni le fil séquentiel ni le moteur.

**Ordre justifié** : les contrats d'abord (toute couche ultérieure s'y branche), la
plateforme (4) avant le moteur (le laboratoire et le cycle de vie de configuration en
réutilisent les mécanismes), le corpus avant toute conception de modèle (les décisions
5b/5c sont arbitrées sur mesures), la **bascule globale du fournisseur** après la
répétition générale (1.5) et sur **décision explicite** (transformation relationnelle,
sémantique inchangée), l'**évolution des modèles ensuite, sur SQL** — chaque
transformation appliquée une seule fois (anti-double-migration, V12 § 4) —, le sync du
frigo **avant** son évolution de modèle (§ 12). La colonne vertébrale du fil séquentiel reste ; les vraies dépendances
techniques et fonctionnelles sont **par lot** (tableaux § 5–17) — aucune phase entière
ne bloque un lot indépendant.


## Annexe — Plan de réalisation — § 20 : Sujets nécessitant une étude ou un prototype

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 480-492), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 20. Sujets nécessitant une étude ou un prototype avant implémentation

| Sujet                                                  | Lot    | Méthode                                                                                                                                                           | Décision attendue                        |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Modèle ingrédients (une entité + `variant_of` vs deux) | 5b.1   | Prototype exécutable sur un sous-ensemble du corpus + critères mesurables                                                                                         | Arbitrage n°1 (V12 § 28)                 |
| Extension CRDT du frigo aux entrées                    | 5b.3   | Prototype du sync + harnais de simulation des 7 cas de conflit                                                                                                    | Arbitrage n°2 : CRDT si tests verts      |
| Stratégie d'allocation des stocks                      | 6b.1   | Comparaison de stratégies sur le corpus (double consommation, partage en présence seule) ; critères mesurables et départages définis avant le choix               | Choix déterministe documenté             |
| Diagrammes : interne vs bibliothèque                   | 2.1    | **Étude comparative** (composants internes vs bibliothèques existantes : performance, poids frontend, accessibilité, maintenance) + prototype sur données réelles | Choix argumenté puis validation visuelle |
| Cycle de vie générique des configurations              | 4.3    | Spécification + maquette avant implémentation multi-domaines                                                                                                      | Validation du mécanisme commun           |
| Perf des listes paginées à 100k                        | 1.4    | Harnais de mesure p95/p99                                                                                                                                         | Baseline + seuils                        |
| Seuil asynchrone du laboratoire                        | 6b.6   | Mesures sur le corpus avec le protocole V12 § 15                                                                                                                  | Valeur en 6b                             |
| Moteur rendu visible côté client                       | 2.6/D2 | Maquettes + test d'utilisation (prise en main immédiate)                                                                                                          | Validation des explications affichées    |


## Annexe — Plan de réalisation — § 23 : Récapitulatif des dépendances (table de référence unique)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 577-672), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 23. Récapitulatif des dépendances (table de référence unique)

Table de référence pour l'exécution : en cas d'écart entre un texte et ce tableau, le
tableau et les tableaux détaillés § 5–17 font foi.

| Lot   | Dépend de                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| 0.1   | — (fait, maintenu à jour)                                                                                           |
| 1.1   | —                                                                                                                   |
| 1.2   | 1.1                                                                                                                 |
| 1.3   | 1.2                                                                                                                 |
| 1.4   | 1.3                                                                                                                 |
| 1.5   | **reporté** : après 5b + préparation du mapping 6a, **avant la migration 6a** + 1.4 + 🚩 validation de la procédure |
| 1.6   | reporté — après la bascule globale (nettoyage post-bascule)                                                         |
| 2.1   | validation du plan                                                                                                  |
| 2.2   | 2.1 (périmètre étendu : écrans CMS — amendement 18)                                                                 |
| 2.3   | — (périmètre étendu : rôles exclusivement par groupes, domaines verrouillés — amendement 18)                        |
| 2.4   | 2.1 (périmètre étendu : simulation groupes/segments/personas — amendement 18)                                       |
| 2.5   | 2.1                                                                                                                 |
| 2.6   | validation du plan                                                                                                  |
| 2.7   | —                                                                                                                   |
| 2.8   | 2.1 validé + 2.2 validé + 2.5 validé (maquettes D3 + tableau de bord)                                               |
| 3.1   | 2.3 validé                                                                                                          |
| 3.2   | 3.1                                                                                                                 |
| 3.3   | 3.2 + 2.8 (écran « Groupes & rôles » — amendement 18)                                                               |
| 3.4   | 3.2 + 2.8                                                                                                           |
| 3.5   | 3.2 (migration vers groupes et rôles initiaux — amendement 18)                                                      |
| 4.1   | validation du plan                                                                                                  |
| 4.2   | 4.1 + 3.2                                                                                                           |
| 4.3   | 4.1 (périmètre étendu : échine transversale Staged/Online — amendement 18)                                          |
| 4.4   | 2.8                                                                                                                 |
| 4.5   | 3.2                                                                                                                 |
| 4.6   | 4.3 (migration de l'atelier `@/core/review` vers l'échine — amendement 18, tests de non-régression dédiés)          |
| 5a.1  | validation du plan + cas métier du chef                                                                             |
| 5a.2  | 5a.1                                                                                                                |
| 5a.3  | 5a.1                                                                                                                |
| 5b.1  | 5a.1                                                                                                                |
| 5b.2  | 5b.1                                                                                                                |
| 5b.3  | 5b.2                                                                                                                |
| 5b.4  | 2.4 + 5b.2 + D4 validé                                                                                              |
| 5b.5  | 5b.2                                                                                                                |
| 5c.1  | 5b.2                                                                                                                |
| 5c.2  | 5c.1                                                                                                                |
| 5c.3  | 5b.2                                                                                                                |
| 5c.4  | 5c.1–5c.3                                                                                                           |
| 5c.5  | 5c.2 + 5c.3                                                                                                         |
| 6a.1  | recettes/ingrédients : 5b.5 + 1.2 + 1.3 + 1.4 ; préparation frigo : 5b.3 + 5b.5 + 1.2 + 1.3 + 1.4                   |
| 6a.2  | 6a.1 + D5 validé                                                                                                    |
| 6a.3  | 6a.1 + procédure validée en 1.5 — bascule globale : gel + export complet + retour arrière symétrique (§ 12)         |
| 6a.4  | 5b.2 + D5 validé                                                                                                    |
| 6b.1  | 5c.5                                                                                                                |
| 6b.2  | 5b.2 + 5c.5                                                                                                         |
| 6b.3  | 5c.1 + 5c.2                                                                                                         |
| 6b.4  | 6b.1 + 6b.3                                                                                                         |
| 6b.5  | 5c.5 + 6b.4                                                                                                         |
| 6b.6  | 6b.5 + 5a.2 + 5a.3                                                                                                  |
| 6b.7a | 5b.3 + 6a.1                                                                                                         |
| 6b.7b | 6b.7a validé + 🚩 accord du chef                                                                                    |
| 6b.8  | 2.8 + 3.1 + 3.2 + 5b.4 + D4 validé + 4.3 + 6b.6                                                                     |
| 6c.1  | 6b.6 (démarrage) ; conclusions finales en laboratoire : 6b.8                                                        |
| 6c.2  | 6b.6 + 6b.7b + 6c.1 + D1/D2 validées                                                                                |
| 6c.3  | 6c.2                                                                                                                |
| 7.1   | 6a.1                                                                                                                |
| 7.2   | 7.1                                                                                                                 |
| 7.3   | 7.2 + D6 validé (périmètre étendu : pages CMS, composants, médias, messages — amendement 18)                        |
| 7.4   | 7.3 + 4.1 (périmètre étendu : expériences, thèmes éditoriaux, ciblage groupes/segments — amendement 18)             |
| 7.5   | 7.4 + 2.8                                                                                                           |
| 8.1   | 7.2 + 9.2                                                                                                           |
| 8.2   | 8.1                                                                                                                 |
| 9.1   | 4.1                                                                                                                 |
| 9.2   | 9.1 (extension : agrégats exposés comme faits de ciblage indexés — amendement 18)                                   |
| 9.3   | 9.2 + D6 validé                                                                                                     |
| 10.1  | 4.1 + 4.5                                                                                                           |
| 10.2  | 10.1                                                                                                                |
| 10.3  | 10.1                                                                                                                |
| 10.4  | 10.2 + 10.3 + 7.4 + D6 validé                                                                                       |
| 10.5  | 10.2 + 7.4 + D6 validé                                                                                              |
| 11.1  | 🚩 décision explicite du chef + porte de passage (succès 6–10)                                                      |
| 11.2  | 11.1                                                                                                                |
| 12.1  | 11.2                                                                                                                |
| 12.2  | 12.1                                                                                                                |
| 12.3  | 12.2                                                                                                                |
| 13.1  | 12.1–12.3                                                                                                           |
| 13.2  | 12.1–12.3 + 🚩 besoin confirmé                                                                                      |

**Lots Budget (§ 24 — proposés, non exécutés, à ajouter après validation du chef) :**

| Lot                                   | Dépend de                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| B1                                    | validation de la section § 24                                                       |
| B2 (Core Budget, pur)                 | B1                                                                                  |
| B3 (intégration stockage)             | B2 + 5b.2 + 6a.1 + 6a.3 (recettes/ingrédients migrées, source de vérité stabilisée) |
| B4 (back-office prix + paramètres)    | B3 + 2.8 + D5 validé + 4.1 + 4.2 + 4.3 (mécanismes réutilisés)                      |
| B5 (estimation client & exploitation) | B2 + B3 + B4 + D1/D2 validées + 7.2 + 7.4 + D6 validé                               |
| B6 (rapport qualité/prix, facultatif) | B5 + 9.2 + 🚩 définition arbitérée                                                  |


## Annexe — Reorientation — § 0 : Arbitrages du chef (revue v1, font foi)

> **Transfert verbatim** de `docs/encyclopedie/donnees/reorientation-roadmap-carte-fonctionnelle.md` (lignes 14-30), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 0. Arbitrages du chef (revue de la v1 — font foi)

| #                  | Décision                                                                                                                                                                                                                                                                                                         | Conséquence tracée                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **AR-1 ✅**        | E4 (frigo & courses UI) **après F1 et F2** — jamais l'interface définitive sur le modèle à ids                                                                                                                                                                                                                   | ordre § 6 mis à jour                                                                                |
| **AR-2 ⏳ ouvert** | Persistance des substitutions acceptées/refusées : arbitrage **differé au dossier F3** — le dossier comparera temporaire vs persistant, portée (recette/utilisateur/consultation), annulation, multi-appareils, comportement hors ligne ; **l'option (c) ne est pas retenue par avance**                         | F3 élargi ; E3 n'implémente la partie persistée qu'après F3                                         |
| **AR-3 ✅**        | Dates éditoriales de la recette à F5 — distinction **création / dernière modification / première publication / dernière publication** ; `revision` reste une information **technique** de versionnement, jamais une date éditoriale ; migration additive, compatible Firestore et SQL                            | F5 précise les champs réellement nécessaires (nouveautés, catalogue, éditorial) sans donnée inutile |
| **AR-4 ✅**        | E2 exploite ce qui est réel (étal « frigo » du moteur) ; **étals éditoriaux, tags, collections attendent F5** ; aucune simulation codée en dur                                                                                                                                                                   | E2 re-découpé (déjà proposé)                                                                        |
| **AR-5 ✅**        | T3 = lot **F7 dédié à périmètre léger et justifié** — le dossier devra démontrer : problèmes concrets actuels, duplications/incohérences réelles, bénéfices web + natif, fichiers et modifications, risques de dépendances circulaires, compatibilité avec les API existantes, tests de contrat et critères      | pas de refactorisation cosmétique                                                                   |
| **AR-6 ✗**         | **E1 en préparation documentaire uniquement** — dossier 2.6.3 **corrigé et prêt pour présentation** ; **validation fonctionnelle encore attendue** ; **aucune implémentation autorisée à ce stade** ; même après validation du dossier, le développement nécessitera une **autorisation distincte et explicite** | dossier E1 v2 livré ; cycle de validation inchangé                                                  |

Méthode d'étiquetage (honnêteté de rapport) : **complet** = implémenté + testé + intégré au
parcours réel · **partiel** = une partie utile et testée, l'écart cible documenté · **simulé** =
préparé côté interface sans modèle ni règles métier réelles · **manquant** = rien dans le code.

---


## Annexe — Reorientation — § 1–5 : cartographie de l'existant, état, dépendances, risques

> **Transfert verbatim** de `docs/encyclopedie/donnees/reorientation-roadmap-carte-fonctionnelle.md` (lignes 31-185), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 1. Cartographie de l'existant — modèles de données (réels, vérifiés au code)

### 1.1 Modèles présents et sains

| Modèle                                                                                                                                                                                                                                                                                              | Où                                                                                                   | État                                                           | Vérification          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- |
| **Recette** (`Recipe`) : titre ×4 langues, temps, portions, catégories multiples (`category_ids`), lignes d'ingrédient (`quantity_base` pour base_servings + `unit` requis + rôle clé/secondaire/basique + `substitutes`), étapes ×4 langues, média (photo/vidéo https), `is_published`, `revision` | `src/core/catalog/types.ts`                                                                          | complet pour le moteur v1                                      | ✅                    |
| **Ingrédient** : nom ×4, catégorie (chaîne — arbre géré), `unit_default`, **prix en fourchette** (`price_min_tnd ≤ price_max_tnd`), photo optionnelle                                                                                                                                               | `src/core/catalog/types.ts`                                                                          | complet                                                        | ✅                    |
| **Catégories** : deux arbres en base (ingrédients / recettes), un ingrédient = une catégorie, recette = plusieurs ; `IngredientCategory = string` (extensible, pas une enum figée)                                                                                                                  | `src/core/categories`, `src/core/catalog/types.ts:14`                                                | complet                                                        | ✅                    |
| **Unités** : registre en base (`UnitInfo` + `kind` obligatoire) + conversions intégrées masses/volumes entre alias ; comptées jamais mélangées                                                                                                                                                      | `src/core/units`                                                                                     | complet pour v1 ; conversions inter-familles = 5c.3            | ✅ / ⏳               |
| **Kitchen** (frigo **ids seuls**, placard, favoris = ids, `weeklyPlan: DayPlan[]` (créneaux lunch/dinner → ids), listes de courses nommées + active + `spent_tnd`)                                                                                                                                  | `src/application/kitchen/KitchenStore.ts`, `src/core/planning/types.ts`, `src/core/grocery/types.ts` | fonctionnel ; **limites § 2**                                  | ◐                     |
| **Comptes** : client/employé/super admin, téléphone E.164, création **atomique** (users + auth + réservation e-mail dans un seul `commit`), pays, profils (variants = données)                                                                                                                      | `src/core/accounts`, `server/auth`, `server/routes/accountRoutes.ts`                                 | complet côté serveur                                           | ✅                    |
| **Atelier de validation** (review) : copie de travail, `written_at`, file, publication contrôlée — le public ne voit que le validé                                                                                                                                                                  | `src/core/review`, `src/features/backoffice`                                                         | complet                                                        | ✅                    |
| **Synchronisation** : `Versioned` + `revision` serveur, marqueurs de suppression, curseur composite, flux de changements paginé, HLC/conflits ; copie IndexedDB hors ligne                                                                                                                          | `src/core/sync`, `server/storage/*`, `src/application/sync`                                          | complet, contract-testé (≈20 comportements × 3 stores)         | ✅                    |
| **Contrat `DataStore`** : SQLite (knex) + mémoire + émulateur Firestore ; réservation e-mail, `transact` sous contention, enveloppe ≤ 10 ops, garanties identifiants                                                                                                                                | `server/storage/contract.ts`                                                                         | complet ; **relations du domaine = 6a (par séquence validée)** | ✅ / ⏳               |
| **Recherche** : normalisation unique + plan d'index + MiniSearch côté client, repli filtre nom                                                                                                                                                                                                      | `src/core/search`, `src/infrastructure/minisearch`                                                   | complet pour la recherche simple                               | ✅                    |
| **Thèmes** : 3 thèmes + candidat, variantes clair/sombre, résolution pure (`resolveTheme`), attribution = backoffice (le client choisit le mode seulement) ; **affectation serveur = port à venir (CMS)**                                                                                           | `src/core/theme`, `src/application/theme`                                                            | complet côté client                                            | ✅ / ⏳ (affectation) |
| **Préférences** : langue (4, via `LANGUAGES` + champs `<champ>_<langue>` — registre centralisé en base = orientation validée **future**), mode, drapeaux                                                                                                                                            | `src/core/preferences`                                                                               | complet                                                        | ✅                    |
| **Sauvegarde/restauration JSON** (utilisateur), aller-retour testé                                                                                                                                                                                                                                  | `src/core/backup`                                                                                    | complet                                                        | ✅                    |
| **SEO serveur** : repli lisible par page publique + 301 legacy ; **le serveur importe `src/core`** (mêmes règles, pas de duplication)                                                                                                                                                               | `server/seo.ts` (imports `../src/core/*` vérifiés)                                                   | complet                                                        | ✅                    |
| **Plateforme** : cycle de vie injecté (`HostLifecycle`), garde d'architecture (core + application, SDK fournisseurs derrière ports), mise à jour de l'app (`update`)                                                                                                                                | `src/infrastructure/host`, `src/core/architecture.test.ts`, `src/core/update`                        | complet                                                        | ✅                    |

### 1.2 Modèles incomplets ou insuffisants (limites réelles, à corriger dans leurs lots)

| Limite                                                                                                                                                                                         | Fait vérifié                   | Fonctionnalités bloquées                                                                                                                      | Lot de correction                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Frigo sans quantités** : `fridge: string[]` (ids), pas d'entrées (quantité, DLC/DDM, réservation, permanent, épuisé)                                                                         | `KitchenStore.ts:26`           | « quantité vérifiée », épuisé réel, allocations, portions réduites, résumés honnêtes                                                          | **F1/F2** (5b.3, 6b.7a/7b — séquence validée) |
| **Planning sans portions ni note** : `DayPlan` = jours + créneaux → ids ; ni servings par repas, ni note du jour                                                                               | `src/core/planning/types.ts`   | outils P3 (D-29 🚩)                                                                                                                           | décision D6 puis extension modèle             |
| **Recette sans dates éditoriales** (ni auteur) : seul `revision` (bump technique à chaque écriture) — jamais une date éditoriale (AR-3)                                                        | `src/core/catalog/types.ts`    | nouveautés honnêtes — la section « Nouveau du chef » est **retirée d'E1** tant qu'aucune règle fiable n'existe (dossier v2), étals, analytics | **F5** (prochaine évolution modèle recette)   |
| **Substitution « acceptée/refusée » sans état persistant** : le moteur propose des substitutions ; l'acceptation (D4 : `accept {…}`) n'a pas de modèle côté client (lecture seule aujourd'hui) | `MatchingResult.substitutions` | fiche 2.6.5 (acceptée/refusée persistée), allocations 6b                                                                                      | **F3** (décision de modèle 5c)                |
| **Courses sans état « dans le panier »** ni distinction écran courses/gestion des listes (D-08/D5 validés, pas implémentés)                                                                    | `src/core/grocery/types.ts`    | 2.6.6 (courses)                                                                                                                               | **E4** (UI, après F1/F2)                      |
| **Pub / notifications / analytics / recommandations / CMS / entitlements** : aucun modèle                                                                                                      | —                              | lots F6/F8, 9.x, 10.x                                                                                                                         | ⏳ (feuille de route conservée)               |

### 1.3 Contraintes qui pourraient limiter l'extensibilité (signalées, non rouvertes)

1. **`sqlStore` = « une table par collection »** (id · document JSON · révision) — **écart
   architectural enregistré**, la transformation relationnelle (FK, CHECK, colonnes typées, index
   par domaine) est le lot **6a**, après la stabilisation des modèles 5b (séquence
   anti-double-migration validée — on ne la rouvre pas). Pilotage relationnel existant :
   `server/storage/relationalPilot.ts`.
2. **Kitchen = document à sections** côté serveur (`kitchenRoutes`) — cohérent avec le sync
   actuel ; **ce n'est pas une contrainte du modèle métier** : les entités de F1 sont définies
   dans le core indépendamment de leur représentation (sections kitchen aujourd'hui, tables
   relationnelles dédiées en 6a — le dossier F1 distingue explicitement modèle et stockage).
3. **Conversions d'unités limitées aux familles** (masse↔masse, volume↔volume, compté séparé) —
   les conversions exacte/approximative/impossible inter-familles attendent 5c.3 (déjà prévu).
4. `parseStoredRecipe` répare à la lecture les copies anciennes (correctif `ccfa18e`) — motif
   « validation tolérante + réparation prouvée » à réutiliser pour toute évolution de format.

## 2. État des fonctionnalités

### 2.1 Complètes

Catalogue + backoffice super admin (recettes, ingrédients, catégories, unités, prix en fourchette)
· atelier de validation et publication (public = validé seulement) · moteur v1 (score, tiers,
config, scénarios du chef, simulateur `diagnose:matching`) · mapping d'affichage niveaux/raisons
(`@/core/matching/display`, lot 2.6.2) · frigo/placard/favoris/plan/listes locaux + synchronisés
(offline-first, révisions, tombstones) · création atomique de comptes + sessions + rôles ·
recherche catalogue · thèmes (client = mode) + identité via `brand.ts` (transitoire) · sauvegarde/
restauration · SEO serveur · PWA (install, offline copy, hors ligne affiché) · shell responsive
4 langues + RTL (lots 2.6.0/2.6.1 clôturés).

### 2.2 Partielles (écart cible documenté au plan consolidé)

| Fonctionnalité | Ce qui existe                                                      | Ce qui manque                                                                                                                                              |
| -------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suggestions    | 3 tiers réels (moteur), onglets, filtres mémorisés                 | raisons affichées à l'écran (codes prêts, écrans pas adoptés — 2.6.4), wording D1 appliqué (fait en core, adoption écrans), bornes définitives (corpus 5a) |
| Fiche recette  | fiche + détail + ingrédients manquants, coût en fourchette, médias | 4 infos D4 complètes, substitution acceptée/refusée (attend modèle F3), mode cuisine complet                                                               |
| Frigo          | ajout/retrait/quantité « à vérifier », résumé, sync                | entrées avec quantités/DLC (F1), épuisé réel (F2), mosaïque 64+, annulation (D-17)                                                                         |
| Courses        | listes nommées, fusion d'unités, budget, partage                   | mode « dans le panier », séparation courses/gestion (D-08)                                                                                                 |
| Planning       | table complète, génération, coût calculé (`planCostRange`)         | bande P1, résumé calculé écran, P3 (D6 🚩)                                                                                                                 |
| Scan           | scan → propositions → validation partielle                         | 6 états complets, corrections, erreurs, hors ligne (2.6.8)                                                                                                 |
| Accueil        | héros statique + raccourcis + niveau « prête »                     | composition C + 6 états (dossier 2.6.3 prêt)                                                                                                               |
| Backoffice     | éditeurs + atelier + catégories + unités + identité                | fondations D3 (shell backoffice, tableaux), RBAC groupes (2 permissions aujourd'hui), étals                                                                |

### 2.3 Simulées / préparées uniquement côté interface

Aucune fonctionnalité **active** n'est simulée avec des données factices (convention respectée :
« public = validé seulement », aucun contenu codé en dur). Sont **préparées sans modèle** :
conteneurs pub (dossier 2.6.3 : conteneurs repliés, aucune régie), port notifications (T7,
à venir), identité évolutive (`brand.ts` transitoire, consommée par `BrandMark`), étals de
l'accueil (D4 en référence ; la seule règle réelle prévue = étal « frigo »).

### 2.4 Manquantes (feuille de route conservée — différer ≠ abandonner)

Mode cuisine pas-à-pas · onboarding/bienvenue · invité/panneau (D-26 🚩) · notifications ·
historique de consultation (données serveur ✓, UI ✗) · étals/tags/collections éditoriales ·
recommandations · analytics · pub décision serveur · budget B1–B6 (principe D14 🚩) · CMS
(pages, médias, campagnes, home editor, ciblage) · RBAC groupes/entitlements · commerce (§ 24,
frontières seules) · backlog assumé V12 § 29.

## 3. Conserver / faire évoluer / refactoriser / remplacer

| Élément                                                                                                           | Verdict                                                                                  | Justification                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Mécanisme de synchronisation (révisions, tombstones, curseurs, HLC, conflits) + contrat `DataStore` + adaptateurs | **Conserver**                                                                            | contract-testé sur 3 stores, capable de porter les évolutions (entrées de frigo incluses) ; séquence 1.5→6a→6b→6c validée |
| Architecture hexagonale + garde (core pur, application sans plateforme, infra libre)                              | **Conserver**                                                                            | vérifiée par test, prouve sa valeur (correctifs isolés : `ccfa18e`)                                                       |
| Moteur + config + scénarios + `display`                                                                           | **Conserver** (bornes = constantes configurables)                                        | D2 : réévaluation mesurée avec le corpus, jamais devinée                                                                  |
| Atelier de validation, comptes atomiques, recherche, i18n, thèmes, unités                                         | **Conserver**                                                                            | sains, testés, extensibles (multilingue en base = évolution prévue sans refonte)                                          |
| Modèle frigo (ids)                                                                                                | **Remplacer** par le modèle à entrées (5b.3) — **prévu et séquencé**                     | la présence seule bloque quantités vérifiées/épuisé/allocations ; migration id-préservée + retour arrière exigés          |
| Fiche « substitution acceptée/refusée »                                                                           | **Faire évoluer** (décision de modèle à F3)                                              | sans état persistant, l'écran 2.6.5 serait à refaire                                                                      |
| Contrats API (~19 fichiers serveur, T3/D15 validé favorablement)                                                  | **Refactoriser** (centralisation légère, sans dépendances circulaires, tests de contrat) | valeur immédiate client/serveur + préparation native                                                                      |
| `sqlStore` JSON par collection                                                                                    | **Faire évoluer → 6a** (déjà planifié)                                                   | écart enregistré ; après stabilisation 5b, transformation relationnelle par domaine                                       |
| Accueil actuel (`HomePage` statique)                                                                              | **Remplacer** par composition C (2.6.3, dossier prêt)                                    | déjà validé par D-01 ; l'ancien reste en repli pendant le lot                                                             |
| `KitchenStore` (store unique qui grossit)                                                                         | **Faire évoluer** (scission par domaine quand les entrées arriveront — F1)               | éviter un god-store à mesure que le modèle s'étoffe                                                                       |
| `RecipeCard`/composants 2.6.2                                                                                     | **Faire évoluer** (variantes à leurs consommateurs — convention déjà tracée)             | pas de sur-généralisation                                                                                                 |
| Planning (`DayPlan`)                                                                                              | **Faire évoluer** si D6 ✅ (portions par repas, note)                                    | extension additive, migration légère                                                                                      |

**Aucun remplacement non planifié n'est requis.** Le principe « qualité > conservatoire » s'applique
déjà au deux endroits prévus (modèle frigo, accueil) et à la refactorisation T3 ; tout autre
reconstruction devra être justifiée lot par lot, comme demandé.

## 4. Cartographie des dépendances (fonctionnel ↔ technique)

```
Entrées de frigo (quantités/DLC) ─► Conversions/épuisé ─► Allocation & verdicts (6b)
        │                                            ─► Suggestions honnêtes + fiche (substitution persistée)
        │                                            ─► Frigo UI finale, courses reliées, résumés planning
        │
Corpus du chef (fourniture 🚩) ─► Bornes mesurées (5a) ─► niveaux définitifs
        │
Comptes/RBAC groupes ─► Invité/panneau (D8) ─► Notifications (D7), pub (10.x), analytics (9.x)
        │                    ─► CMS (rôles, atelier Staged/Online 4.3)
        │
Étals/tags/collections + recette (created_at) ─► Catalogue R1 ─► Home éditoriale, campagnes (7.4)
        │
CMS fondations (médias + champs éditoriaux + langues en base) ─► éditeur d'identité, home editor, thèmes affectés serveur
        │
Contrats API centralisés (T3) + politique /v1 (D16) ─► prérequis publication native
```

- **Sync offline** : porte déjà tout le kitchen (frigo/placard/favoris/plan/listes) ; les entrées
  de frigo hériteront du mécanisme (édition hors ligne, révisions, tombstones) — la sémantique des
  conflits sur quantités éditées hors ligne est à préciser au dossier F1 (HLC déjà en place).
- **Contrats API** : T3 touche ~19 fichiers serveur — aucun écran bloqué, mais **prérequis** à la
  porte mobile et recommandé tôt (F7).

## 5. Risques de blocage et migrations nécessaires

| #   | Risque                                                                                                   | Impact                                                                     | Réponse proposée                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Construire le frigo UI (2.6.6) deux fois** : aujourd'hui sans quantités, puis re-faire quand F1 arrive | double travail, retours arrière — le risque central de l'ancienne séquence | **repositionner 2.6.6 après F1/F2** (arbitrage AR-1)                                                                                                                                                           |
| R2  | Fiche 2.6.5 : substitution « acceptée/refusée » sans modèle → écran jetable                              | rework du composant + tests                                                | découper E3 ; la partie persistée après F3 (AR-2)                                                                                                                                                              |
| R3  | Étals R1 (2.6.4) sans modèle d'étal (7.1)                                                                | UI à refaire                                                               | livrer uniquement l'étal « frigo » (règle moteur réelle) ; étals éditoriaux après F5 (AR-4)                                                                                                                    |
| R4  | Accueil : nouveautés sans règle fiable                                                                   | information trompeuse si calculée                                          | **risque levé (dossier E1 v2)** : aucune section « Nouveau du chef » tant qu'il n'existe ni dates éditoriales (F5, AR-3) ni sélection éditoriale réelle — jamais une nouveauté calculée sur une date technique |
| R5  | Migration frigo ids → entrées                                                                            | données utilisateur réelles                                                | exigences : préservation des ids, migration additive, repli arrière, tests aller-retour (convention déjà appliquée au prix default_price_tnd)                                                                  |
| R6  | Migration SQL 6a                                                                                         | provider actuel + cible                                                    | séquence validée inchangée : répétition générale 1.5 → 6a après 5b — aucune bascule sans validation                                                                                                            |
| R7  | Contrats API éparpillés avant native                                                                     | coûts de compatibilité                                                     | T3 en F7 (léger), politique D16 avant publication                                                                                                                                                              |
| R8  | Dépendances « fourniture chef » (corpus 5a, photos, logo)                                                | F3, E-editorial                                                            | lots frontend non dépendants continuent en parallèle                                                                                                                                                           |

**Migrations requises à terme** : F1 (frigo → entrées, additive) · extensions planning (si D6) ·
recette `created_at` (additive) · étals/tags/collections (collections nouvelles) · RBAC groupes ·
registre des langues + tables de traduction (orientation multilingue validée — sans date) ·
6a transformation relationnelle (après 5b, séquence validée) · 1.5 répétition générale avant bascule.


## Annexe — Reorientation — § 6 + § 7 bis + § 7 : nouvelle roadmap et dépendances (tables intégrales)

> **Transfert verbatim** de `docs/encyclopedie/donnees/reorientation-roadmap-carte-fonctionnelle.md` (lignes 186-274), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 6. Proposition de nouvelle roadmap (rails métier + expérience, séquencés par dépendances)

Deux rails parallèles : **F = Fondations fonctionnelles** (modèle, règles, persistance) et
**E = Expérience** (écrans qui les exploitent). Un lot E ne démarre que si ses fondations existent
ou s'il lit uniquement des données déjà réelles. Le cycle par lot reste inchangé :
dossier → validation chef → implémentation → tests/mesures → rapport → validation → commit autorisé.

### Rail F — fondations fonctionnelles

| Lot                                                                                    | Objectif fonctionnel                                                                                                                                                                                                                                                                                                                                                                                                  | Modèles concernés                                    | Évolutions / règles                                                                                                                                                                               | Persistance & architecture                                                                                                                                                                                                                          | Dépend de                                                          | Débloque                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **F1 · Frigo à entrées** (≈ 5b.2/5b.3 + 6b.7a)                                         | le stock exprime les quantités (facultatives), DLC/DDM, permanents — **F1 = modèle + préparation** : entrées typées indépendantes des représentations (kitchen/SQL), informations nécessaires aux permanents et à leur épuisement temporaire **sans anticiper leurs règles métier** ; **réservations non ajoutées automatiquement au modèle** — utilité réelle et lot d'arbitrage à déterminer (B-F1-6 du dossier F1) | frigo (ids → entrées), sync                          | quantités jamais obligatoires (décision confirmée) ; **modèle métier typé indépendant du stockage** — sa représentation (sections kitchen, tables 6a) est une décision de stockage, pas du modèle | **migration id-préservée : additive + réversible = exigences à démontrer par tests** (stratégie, compat anciennes données, retour arrière, conservation des données, tests de restauration) ; scission ciblée de `KitchenStore` examinée au dossier | rien (préparation documentaire commencée — dossier détaillé livré) | F2, F3, E4, E5 résumés                                |
| **F2 · Conversions & disponibilité** (≈ 5c.3 + 6b.2 + 6b.7b)                           | **règles de conversion** (exact/approché/impossible), **règles de disponibilité réelle** et **gestion des produits épuisés** ; « quantité vérifiée »                                                                                                                                                                                                                                                                  | unités, entrées de frigo                             | conversions entre familles derrière règles core ; verdict « sous réserve »                                                                                                                        | aucun changement de schéma hors entrées (F1)                                                                                                                                                                                                        | F1                                                                 | moteur honnête, E4                                    |
| **F3 · Moteur : corpus, substitutions réelles, allocation** (5a + 5c.1/2 + 6b)         | **allocation des ingrédients**, **verdicts de faisabilité** et **persistance des substitutions acceptées** (AR-2 ouvert) ; substitutions priorité/exceptions/héritage + explicabilité                                                                                                                                                                                                                                 | recettes (substitutes), nouveau modèle d'acceptation | bornes mesurées sur le **corpus du chef** (fourniture 🚩) ; scénarios stockés                                                                                                                     | décision de persistance de l'acceptation (session vs profil — à arbitrer au dossier) ; 6a reçoit les modèles stabilisés                                                                                                                             | F1, F2 ; corpus chef                                               | E3 complet, E4, résumés planning                      |
| **F4 · Comptes & accès** (2.3→3.x + modèle D8)                                         | invité/connexion/profil ; RBAC groupes & rôles (anti-élévation)                                                                                                                                                                                                                                                                                                                                                       | comptes, profils, groupes                            | parcours invité (D-26) validés au dossier ; différences invité/connecté                                                                                                                           | collections nouvelles (groupes) ; règles Firestore                                                                                                                                                                                                  | rien (parallèle)                                                   | E6, F6                                                |
| **F5 · Catalogue éditorial** (7.1 + extensions recette)                                | étals (requêtes enregistrées), tags/axes, collections ; **dates éditoriales** : `created_at` (création initiale), `updated_at` (dernière modification, indépendamment de la publication), `first_published_at` / `last_published_at` (publications effectives) — seuls les champs réellement nécessaires ; le dossier définira le comportement dépublication → nouvelle publication                                   | recettes, étals, tags                                | étals = requêtes validées en base (jamais codées en dur) ; règles de publication                                                                                                                  | collections nouvelles + migration additive recette (**additivité/réversibilité démontrées par tests**)                                                                                                                                              | décision de modèle au dossier (parallèle)                          | E2 (étals R1), E1 (section nouveautés définitive), F6 |
| **F6 · CMS fondations** (2.2/2.3/4.1/4.3)                                              | fondations D3 backoffice ; noyau de règles/entitlements ; échine Staged/Online                                                                                                                                                                                                                                                                                                                                        | contenu éditorial, médias, règles                    | éditeur d'identité, médias, publication contrôlée                                                                                                                                                 | collections CMS ; auth backoffice étendue (F4)                                                                                                                                                                                                      | F4                                                                 | 7.3/7.4 (campagnes, home editor), E7                  |
| **F7 · Transversal produit** (T3 + D16 + D13)                                          | contrats API centralisés **limités aux problèmes concrets identifiés**, politique /v1, seuils perf mesurés                                                                                                                                                                                                                                                                                                            | DTO/erreurs/auth                                     | centralisation sans dépendances circulaires + tests de contrat — **pas de refactorisation générale** : la préparation native ne justifie pas de réécrire des contrats qui fonctionnent            | aucun modèle nouveau                                                                                                                                                                                                                                | rien (léger, parallèle)                                            | porte native, robustesse client/serveur               |
| **F8 · Produit différés** (9.x analytics · 10.x pub · B1–B6 budget · D7 notifications) | décision serveur pub, événements fermés, coût, rappels                                                                                                                                                                                                                                                                                                                                                                | à définir par dossier                                | chaque sous-domaine garde son arbitrage (D7/D12/D14)                                                                                                                                              | selon dossier                                                                                                                                                                                                                                       | F4 (+ D14 pour budget)                                             | E8                                                    |

### Rail E — expérience (exploite les fondations)

| Lot                                                                              | Contenu                                                                                                                                                      | Dépend de                                                                                                                                                                                                                       | Changement vs ancienne séquence                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **E0 · fait**                                                                    | 2.6.0 socle + 2.6.1 identité/shell + 2.6.2 composants (clôturés)                                                                                             | —                                                                                                                                                                                                                               | —                                                                    |
| **E1 · Accueil C** (ex-2.6.3, dossier v2 corrigé)                                | composition C, 6 états, héros adaptatif, étal « frigo » + état « sans suggestion », **aucune section nouveautés, aucun emplacement pub** (décisions du chef) | **préparation documentaire uniquement** — dossier corrigé → présentation → validation ; la validation du dossier **ne constitue pas** une autorisation de développement : une autorisation distincte sera requise avant le code | corrections A–F intégrées (v2) ; arbitrage A-1 à trancher            |
| **E2 · Catalogue & suggestions** (ex-2.6.4)                                      | R2 mosaïque, R3 deck, filtres F1–F3, T5 (filtres en store), raisons affichées (codes 2.6.2), étal « frigo » partagé ; bornes = constantes actuelles          | 2.6.2 ; **étals R1 éditoriaux → après F5**                                                                                                                                                                                      | re-découpé : la partie étals éditoriaux sort du lot (R3)             |
| **E3 · Fiche recette & mode cuisine** (ex-2.6.5)                                 | fiche 4 infos + 3 états, portions, médias, mode cuisine pas-à-pas + minuteur                                                                                 | 2.6.2 ; **substitution persistée → après F3**                                                                                                                                                                                   | re-découpé (R2)                                                      |
| **E4 · Frigo & courses** (ex-2.6.6)                                              | frigo sur entrées réelles (quantités/DLC/épuisé/annulation D-17), mosaïque 64+, courses « dans le panier » + gestion des listes (D-08)                       | **F1 + F2**                                                                                                                                                                                                                     | **repositionné après les fondations — le changement principal** (R1) |
| **E5 · Planning** (ex-2.6.7)                                                     | bande P1 + résumé calculé (via `planCostRange`), lien courses ; P3 seulement si D6 ✅                                                                        | 2.6.2 ; P3 → modèle étendu (D6)                                                                                                                                                                                                 | inchangé sauf P3 conditionnel (déjà tracé)                           |
| **E6 · Comptes, invité, notifications, historique, scan, onboarding** (ex-2.6.8) | profil/panneau (D-23 ✅), invité/connexion (D8/D-26), notifications (D7 ✅ périmètre minimal, port T7), historique UI, scan complet, bienvenue               | **F4** (+ D9 pour l'onboarding)                                                                                                                                                                                                 | inchangé dans l'ordre relatif, maintenant explicitement après F4     |
| **E7 · Expériences éditoriales**                                                 | contenus éditoriaux réels (étals, campagnes, home éditeur, thèmes affectés serveur, identité CMS)                                                            | F5 + F6                                                                                                                                                                                                                         | nouveau libellé des anciens 7.x côté écrans                          |

**Séquencement de préparation (priorités du chef, revue v2) — exécution parallèle possible pour les travaux indépendants** :

1. **F1 — Frigo à entrées** : premier dossier fonctionnel prioritaire (dossier détaillé livré en v2) ;
2. **F7 — Contrats API** : dossier léger à périmètre justifié ;
3. **F4 — Comptes et accès** : dossier évolutions comptes + RBAC ;
4. **E1 — Accueil** : préparation documentaire uniquement — dossier 2.6.3 **corrigé et prêt pour présentation**, validation fonctionnelle attendue ; **validation ≠ autorisation de développement** (même après validation, une autorisation distincte et explicite sera requise avant le code) ;
5. **F2 — Conversions et disponibilité** : dossier dépendant de F1 ;
6. **F3 — Moteur et substitutions** : dossier dépendant de F1, F2 et du corpus du chef (fourniture 🚩) ; arbitrage AR-2 tranché dans ce dossier ;
7. **E2, E3, E4** : écrans adaptés aux fonctionnalités réellement disponibles (E4 = **après F1/F2**, AR-1 ✅) ;
8. **E5, E6, F5, F6, E7, F8** : selon les dépendances et arbitrages correspondants.

Cet ordre est une **priorité de préparation et de dépendances**, pas une terminaison séquentielle
obligatoire. La séquence de migration validée est conservée : stabilisation des modèles
(F1–F3) → répétition générale **1.5** → migration relationnelle définitive **6a** — non remise en
question.

## 7 bis. Cohérence vérifiée des dépendances F1 → F2 → F3 → 6a

- **F1** (modèle + sync + migration ids→entrées sur le fournisseur actif) **ne modifie pas le
  moteur** : le moteur continue de consommer une **présence dérivée** des entrées (comportement
  identique à aujourd'hui, wording D1 inchangé) — zéro rework moteur avant F3.
- **F2** (conversions, épuisé réel, « quantité vérifiée ») lit les entrées de F1 ; aucune
  nouvelle migration.
- **F3** (allocation, verdicts, substitution persistée — **AR-2 encore ouvert, à traiter dans son dossier**) consomme F1+F2 ; la **stabilisation** visée = **structures de données et contrats nécessaires à la migration validés** — **pas l'achèvement de toutes les fonctionnalités métier et UX de F1–F3**. Dès que le modèle et les contrats concernés sont suffisamment stabilisés et validés, la répétition générale **1.5** puis la transformation relationnelle **6a** (tables typées pour les entrées de frigo et le reste du kitchen, séquence anti-double-migration validée — aucune bascule avant 6a) peuvent intervenir, conformément aux étapes de préparation prévues.
- Aucune des trois étapes ne touche au fournisseur de vérité (Firestore reste actif jusqu'à la
  bascule 6a).
- **Réversibilité et additivité des migrations F1/F2/F3 ne sont pas des garanties présupposées :
  ce sont des exigences à démontrer dans chaque dossier** — chaque dossier précisera : la
  stratégie de migration, la compatibilité avec les anciennes données, les mécanismes de retour
  arrière, la conservation des données utilisateur, et les tests de migration **et de
  restauration**. Un dossier qui ne démontre pas ces points n'est pas présentable à la validation.

## 7. Correspondance anciens lots ↔ nouveaux lots (traçabilité complète)

| Ancien                                                           | Nouveau                                                                                                    | Traçabilité                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.6.0 Socle, 2.6.1a/b Identité & shell, 2.6.2 Composants communs | **E0 — fait** (commits `2ec4a74`, `3f7565c`/`6107ab5`, `f8fc85b`/`60d3e88`, lot 2.6.2 `ccfa18e`/`9634a24`) | rien n'est perdu ; les conventions (couches 1–2, arbitrages A-1…A-6) s'appliquent à toute la suite                                                                                                       |
| 2.6.3 Accueil C                                                  | **E1 — dossier corrigé, prêt pour présentation** (AR-6)                                                    | dossier v2 (`lot-2.6.3-home-page-dossier.md`) : validation fonctionnelle attendue ; **aucune implémentation autorisée** ; même après validation, développement = **autorisation distincte et explicite** |
| 2.6.4 Catalogue & suggestions                                    | **E2** (partie étals éditoriaux → après F5)                                                                | les composants prévus (`FilterSentence`, `IngredientFilter`, `QuickFilters`, `ActiveFilters`, `RecipeViews`) restent au lot                                                                              |
| 2.6.5 Fiche & mode cuisine                                       | **E3** (substitution persistée → après F3)                                                                 | les arbitrages D-02 (wording, CTA) s'appliquent tels quels                                                                                                                                               |
| 2.6.6 Frigo & courses                                            | **E4** — déplacé après F1/F2                                                                               | `ListesManager`, D-08, D-27 restent au lot ; l'écart « épuisé réel » disparaît (les fondations précèdent)                                                                                                |
| 2.6.7 Planning                                                   | **E5**                                                                                                     | `WeekStrip`/`PlanSummary`, D-29/D6 inchangés                                                                                                                                                             |
| 2.6.8 Secondaires & comptes                                      | **E6**                                                                                                     | D-23/D-26/D-20/D7/D9 inchangés ; notifications port T7 inchangé                                                                                                                                          |
| 5a corpus                                                        | **F3** (fourniture chef 🚩 inchangée)                                                                      | bornes D2 réévaluées là, pas ailleurs                                                                                                                                                                    |
| 5b/5c                                                            | **F1/F2/F3**                                                                                               | mêmes contenus V12 ; montés en priorité — c'est le cœur de la réorientation                                                                                                                              |
| 1.5 répétition générale                                          | inchangé, **avant 6a**                                                                                     | séquence validée non rouverte                                                                                                                                                                            |
| 6a/6b/6c                                                         | **F1–F3 (+ 6a conservé après 5b)**                                                                         | la transformation relationnelle reste après la stabilisation des modèles                                                                                                                                 |
| 7.1 étals/tags/collections                                       | **F5**                                                                                                     | règles d'étals en base                                                                                                                                                                                   |
| 7.3/7.4 CMS                                                      | **F6 + E7**                                                                                                | pages, médias, expériences, campagnes, home editor                                                                                                                                                       |
| 2.2/2.3/2.7/3.x/4.1/4.3/4.5/4.6                                  | **F4/F6** (dette 2.7 = lot permanent, non reprogrammée)                                                    | RBAC, noyau de règles, atelier Staged/Online                                                                                                                                                             |
| 8.1/8.2 recommandations                                          | **F8/E7**                                                                                                  | après 7.2 + 9.2 (inchangé)                                                                                                                                                                               |
| 9.x analytics, 10.x pub, B1–B6 budget                            | **F8**                                                                                                     | chaque sous-domaine avec son arbitrage (D12/D14)                                                                                                                                                         |
| 11–13 commerce, V12 § 29                                         | **⏳ inchangé**                                                                                            | porte de passage ; backlog assumé                                                                                                                                                                        |
| T3/T5/T7/T8/T9                                                   | **F7 / E2 / E6 / F7 / porte mobile**                                                                       | positions inchangées sauf T3 explicité en lot propre                                                                                                                                                     |
| D1–D16 arbitrages                                                | **inchangés** — chaque décision reste liée à son lot (§ 6 plan consolidé)                                  | aucun arbitrage rouvert par cette réorganisation                                                                                                                                                         |


## Annexe — Reorientation — § 8–9 : arbitrages v2 et ce qui ne change pas

> **Transfert verbatim** de `docs/encyclopedie/donnees/reorientation-roadmap-carte-fonctionnelle.md` (lignes 275-295), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 8. Arbitrages — état après revue du chef (v2)

| #        | Arbitrage                                      | Décision                                                                                                                                                                                                                                                                                                                                       |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AR-1** | Ordre frigo : fondations d'abord ou UI d'abord | **✅ Option (a) validée** — E4 après F1 et F2 ; jamais l'interface définitive sur le modèle à ids                                                                                                                                                                                                                                              |
| **AR-2** | Substitution « acceptée/refusée » : modèle     | **⏳ Ouvert jusqu'au dossier F3** — le dossier comparera (a) temporaire/session, (b) persisté, (c) persisté + synchronisé, sur les questions : nature temporaire ou persistante, portée (recette/utilisateur/consultation), annulation/modification, multi-appareils, hors ligne ; **aucune option retenue par avance**                        |
| **AR-3** | Dates éditoriales de la recette                | **✅ Principe validé** — évolution du modèle à F5 ; distinguer création / dernière modification / première publication / dernière publication ; `revision` = information technique seulement ; migration additive, compatible Firestore **et** SQL ; champs limités aux besoins réels (nouveautés, catalogue, éditorial, usages futurs)        |
| **AR-4** | Étals R1 dans E2                               | **✅ Option (a) validée** — E2 exploite le réel (étal « frigo ») ; étals éditoriaux/tags/collections attendent F5 ; aucune simulation codée en dur                                                                                                                                                                                             |
| **AR-5** | T3 (contrats API) en lot propre F7             | **✅ Validé à périmètre léger et justifié** — le dossier F7 devra démontrer problèmes concrets, duplications/incohérences réelles, bénéfices web + natif, fichiers et modifications, risques de dépendances circulaires, compatibilité avec les API existantes, tests de contrat et critères d'acceptation ; pas de refactorisation cosmétique |
| **AR-6** | Démarrage immédiat d'E1                        | **✗ Refusé en l'état** — le dossier 2.6.3 est corrigé (corrections A–F, dossier v2) avant validation ; la validation de la stratégie ne constitue pas une autorisation de développement                                                                                                                                                        |

## 9. Ce qui ne change pas

- Cycle de travail par lot (dossier → validation → implémentation → rapport → validation → commit
  autorisé) · `npm run check` vert à chaque commit · 4 langues + RTL · cibles 44 px · zéro
  dépendance payante · honnêteté des mesures.
- Toutes les décisions validées (§ 8 plan consolidé : wording D1, bornes actuelles, D-23, D-25,
  D-28, D-04/D-05/D-11, SQLite/Firestore, séquence 1.5→6a→6b→6c, « quantités jamais obligatoires »,
  architecture frontend 4 couches, orientations mobile) — **aucune n'est rouverte**.
- Toute fonctionnalité reportée reste tracée (§ 2.4 + plan consolidé § 2) — la réorganisation ne
  supprime rien de la feuille de route.
