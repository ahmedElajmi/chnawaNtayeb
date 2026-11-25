---
domaine: fondations-techniques (datastore et protocole de préparation)
niveau: dossier d'évolution (1 + 2)
nature: evolution.md — corpus décisionnel du protocole de préparation des opérations protégées
statut: archivage documentaire du 25/11/2026 — décisionnel clos ; implémentation non lancée ; aucun GO de lot (L1 à L7) donné
autorité: analyses/ — fiches retranscrites verbatim depuis l'historique conversationnel transmis (arbitrages utilisateur, canon-prepare-v1, pilotage, O-13/O-4, DC-2/DC-8, livrables A–D, bilan de mission) ; aucune source inaccessible retranscrite
compléments: analyses/ — **compilation de fragments Session A** (fiche originale inaccessible, jamais reconstituée) et **deux fiches d'analyse/proposition nouvelles, explicitement non verbatim** (projection du payload v1 ; représentation HTTP de l'epoch et cadrage L1 — statut [PROPOSITION] en tête de chacune, rien d'arbitré dans leur contenu détaillé)
---

# Protocole de préparation des opérations protégées (`datastore-protocole`)

> **Nature de ce dossier** : archivage du corpus décisionnel du **protocole de préparation** (contrat
> `prepare`, empreinte, Reg1, epochs, journal témoin, preuves). Tout le contenu décisionnel a vécu
> **uniquement dans une conversation** ; il est retranscrit ici conformément à la règle de
> traçabilité de `CLAUDE.md`. **Ce dossier ne décrit aucun code existant** : aucune implémentation
> du protocole n'existe dans l'arbre, aucun test, aucune mesure. **Aucun GO d'implémentation
> (L1 à L7) n'a été donné** : chaque lancement de lot restera une décision explicite et distincte.
>
> **Statuts conservés verbatim** : `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` · `[DÉCIDÉ]` ·
> `[DÉCIDÉ — PRINCIPE]` · `[DÉCIDÉ — PRÉCISION DE PORTÉE]` · `[CONFIRMÉ]` · `[RECOMMANDÉ]` ·
> `[POINT OUVERT]` · `[BLOQUANT]` · `[À DÉMONTRER]`. Aucune recommandation n'est présentée comme
> une décision ; aucune décision comme une implémentation ; aucune garantie comme démontrée.

## 1. Fiche de contexte

Le protocole de préparation protège les **opérations protégées** du magasin de données (ex. :
création d'une réservation Reg1) contre les effets partiels, les doubles exécutions et les
résurrections après restauration. Il repose sur : une **identité d'intention** `(device, epoch,
opId)`, un **payload métier canonisé** portant une empreinte calculée par le serveur, une
**préinscription** dans une **autorité externe** (journal témoin) avant tout effet, et des
**états de preuve** strictement séparés (positif / négatif / indéterminé ⇒ fail-closed et
réconciliation). Les **opérations ordinaires restent hors du mécanisme** (SC-O13-03, contrainte
de coût, SC-O3-01).

Périmètre de ce dossier : les décisions, spécifications, dépendances, points ouverts et
démonstrations restant à réaliser. La **synchronisation cuisine existante** (stock en entrées,
portée de version B22-07) est un autre dossier : `donnees-moteur/stock-entrees-sync/` (K-1).

## 2. Décisions verrouillées (jamais rouvertes)

| Famille | Contenu | Statut | Autorité |
|---|---|---|---|
| **Session A** | A-1…A-12 (identifiants, `consId`, head, plafond 10¹⁵, `opId`, taxonomie) · invariants I-1…I-19 · conditions C-1…C-9 | **[DÉCIDÉ-A]** — fiche originale inaccessible ; synthèse en `roadmap.md` § 6 bis ; fragments confirmés en `analyses/session-a-fragments-confirmes.md` | retranscription roadmap + citations des fiches ; `registre-decisions.md` a été **supprimé lors du nettoyage autorisé** — la synthèse `roadmap.md` § 6 bis sert de repère documentaire pour les éléments Session A disponibles et **ne restitue pas le contenu intégral du registre** ; les informations verbatim manquantes restent manquantes (§ 7, DT-05) |
| **canon-prepare-v1** | DC-1…DC-14, profil de canonisation P-1…P-7, plafonds DC-6, unité transactionnelle, budget d'écritures | **[DÉCIDÉ]** | `analyses/canon-prepare-v1-cloture.md` |
| **Fonction du digest** | R-7a (SHA-256 → Base64URL sans padding, 43) ; R-7b **option α** (payload métier canonique seul) | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** | `analyses/arbitrages-utilisateur.md` (DC2-A02) |
| **R-9** (re-canonisation avec le `cpv` enregistré à la reprise) | méthode technique de vérification d'équivalence | **[RECOMMANDÉ]** — **jamais** devenu une décision | `analyses/canon-prepare-v1-cloture.md`, livrable A |
| **O-3** (journal témoin) | SC-O3-01…05 : indépendance, cinq états de preuve, refus sans autorité, complétude jamais présumée, périmètre account-wide | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** | `analyses/arbitrages-utilisateur.md` |
| **O-11** (epochs) | SC-O11-01…09 + I-19 : fermeture irréversible, états, rotation | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** | `roadmap.md` § 6 bis (trace de session retranscrite) |
| **O-13** (preuves) | SC-O13-01…05 : séparation preuve positive/négative, palier 1 = preuves positives, préinscriptions (option C restreinte), cas 4 = double preuve (a)+(b), fail-closed | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]**, clôture architecturale enregistrée | `analyses/o13-o4-fiches.md` |
| **O-4 niveau A** (rétention) | SC-O4-A01…A06 + deux précisions intégrées (obligations fonctionnelles ≠ durées chiffrées ; récupération d'archives ≠ arbitrage automatique) | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** ; **niveau B [OUVERT]** après O-5 | `analyses/o13-o4-fiches.md` |
| **DC-2** (contrat de préparation) | DC2-A01…A05 : matrice des champs, R-7b α, payload métier présent dès v1, serveur autorité de l'epoch, portée du plafond | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** ; **la liste exacte des champs du payload reste [POINT OUVERT]** | `analyses/arbitrages-utilisateur.md`, `analyses/dc2-dc8-fiche-definitive.md` ; chaîne de provenance : propositions de remplacement (`analyses/mission-recuperation-bilan.md` § 5–6 — **propositions historiques, arbitrées depuis**) → arbitrages utilisateur (DC2-A01…A05, DC8-A01…A08) → intégration dans `analyses/dc2-dc8-fiche-definitive.md` |
| **DC-8** (couverture des situations détectables) | DC8-A01…A08 : matrice des refus, mappings, fingerprint différent, ordre de priorité | **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** | idem |
| **Arbitrages antérieurs** | RECO (a)(b)(c) + O-12 · ARB-01/ARB-02 · P2/M1/M3 · D6 strict · B22-07 (côté cuisine : implémenté, renvoi K-1) | **[DÉCIDÉ]** | `roadmap.md` § 6 bis ; K-1 |
| **Volontairement non arbitrés** | unicité globale de `opId` entre devices (non requise) ; plafond supplémentaire de longueur de `opId` (non requis) ; politique générale de retry (hors périmètre DC-2/DC-8) | **[POINT OUVERT — non requis]**, à conserver tels quels | `analyses/arbitrages-utilisateur.md` (§ 3) |

**Qualification corrigée (VOLET 1, fait foi)** : l'**injectivité** du profil de canonisation
n'est **pas** une garantie acquise — les règles P-1…P-7 sont décidées, leur conformité
d'implémentation est **à tester**, le déterminisme est **à démontrer par tests**, et la propriété
d'injectivité éventuelle reste un **[POINT OUVERT]** exigeant domaine et relation d'équivalence
explicites (notamment pour les sémantiques `set`, `list`, `multiset`) et une justification
formelle. Voir `analyses/livrables-abcd.md` (bloc 4).

## 3. Règles du contrat déjà décidées (principes, sans implémentation)

1. **Liste blanche stricte** : un champ inconnu du payload est rejeté (`refusal_payload_invalid`) ;
   `null` explicite interdit (DC-3) — l'omission est la représentation de l'absence.
2. **Digest serveur seul** (DC-7, DC2-A01) : le client ne fournit jamais de digest ; calcul hors
   transaction ; SHA-256 des octets UTF-8 de la sérialisation canonique, Base64URL sans padding
   (43) ; le digest ne couvre **que** le payload métier (α) — l'identité `(device, epoch, opId)`
   est hors du domaine du digest et vérifiée séparément.
3. **Plafonds** (DC-6) : entrée 256 KiB, canonique 512 KiB, profondeur 64, 100 000 nœuds ;
   le plafond 10¹⁵ (A-4) reste confiné au champ auquel il s'applique (DC2-A05) — cible à
   confirmer (§ 7).
4. **Échec typé** (DC8-A01…A08) : codes existants uniquement ; toute incohérence d'état détectée
   ⇒ fail-closed et réconciliation, indépendamment de l'ordre de priorité.
5. **Identité** : `opId` CSPRNG ≥ 128 bits d'entropie, Base64URL sans padding, persisté localement
   dès la création de l'intention, identique aux retries ; l'epoch d'origine fait partie de
   l'identité, disponible au serveur à chaque requête ; le serveur détermine l'epoch active et
   refuse toute réinterprétation inter-epoch (DC2-A04).
6. **Budget d'écritures** : Reg1 ≡ index (3 écritures nominales, 4 à la première préparation,
   DC-14/A-9) — la **mesure réelle** de ce budget reste **[À DÉMONTRER]**.
7. **`cpv` et immuabilité** (DC-13) : le fingerprint et le `cpv` d'une entrée Reg1 sont immuables
   (create-only) ; toute évolution de canonisation = nouveau `cpv` ; une intention conservée reste
   vérifiable avec le `cpv` qui l'a créée, jamais recalculée silencieusement.

## 4. Architecture (niveau décision — aucun mécanisme implémenté)

- **Unité transactionnelle** : `{index, head, ref}` (+ claim) — Reg1 en create-only, head suivi de
  `nextOrdinal`, fermeture d'epoch séparée (O-11/O-12).
- **Journal témoin** (O-3) : autorité append-only **indépendante** du périmètre de restauration du
  magasin principal ; préinscription **avant** l'effet ; refus des opérations protégées si elle est
  indisponible (aucun mode dégradé, aucun contournement asynchrone). **Le fournisseur, le stockage
  et l'architecture physique de cette autorité ne sont pas arbitrés** (précision SC-O3-01) —
  l'ancrage cryptographique est un complément, jamais un substitut.
- **Palier 1 d'O-13** : préinscription des intentions de **création de réservation Reg1**
  (condition (a)) et des intentions d'**effet métier protégé** (condition (b)) ; les opérations
  ordinaires restent hors du mécanisme.
- **Preuves** (O-13) : preuve positive ≠ preuve négative, aucune substitution ; l'absence d'une
  trace dans le périmètre restauré **ne prouve jamais une absence** ; le cas 4 (reprise d'une
  intention dont l'état est indéterminé) exige la double preuve (a) **et** (b) et reste **non
  utilisable en production avant les démonstrations requises**.

## 5. Garanties restant à démontrer — `[À DÉMONTRER]`

**Les principes d'O-3, O-13 et des audits J4 sont décidés ; leurs garanties techniques ne sont
démontrées par aucune exécution à ce jour.** Liste (matrice complète : `analyses/livrables-abcd.md`,
matrice D) :

- déterminisme de la canonisation et du digest, conformité P-1…P-7 testée, reproductibilité
  inter-versions (`cpv`) et inter-adaptateurs ;
- budget d'écritures 3/4 mesuré ; atomicité des opérations protégées (aucune écriture partielle,
  aucune double réservation) sous concurrence ;
- fermeture irréversible et rotation atomique des epochs (sérialisation prepare/rotation par
  adaptateur) ;
- journal témoin : exhaustivité des chemins, complétude, durabilité, cohérence, auto-détection de
  divergence, liaison vérifiable intention ↔ préinscription ↔ événement ↔ commit ;
- preuves O-13 (positives, négatives, cas 4) ; résistance à la restauration ; prévention des
  résurrections (purge-aware, O-4 niveau A) ;
- audits J4 (light/deep, P+A, exhaustivité, pagination à totaux justes, stabilité) ;
- parité des adaptateurs (harnais de contrat commun, extensible à tout moteur SQL sans modifier
  le métier) ; monotonie de la liveness (I-14) et exclusion des appareils muets de la purge.

Aucune de ces garanties n'est déclarée acquise tant que les scénarios correspondants n'ont pas été
exécutés avec les preuves attendues.

## 6. Dépendances et conditions de GO (aucun GO donné)

Séquencement faisant foi (`analyses/pilotage-feuille-de-route.md`, feuille de route finale corrigée) :

| Lot | Prérequis de GO (tous distincts et explicites) |
|---|---|
| **L1** | périmètre **explicitement arrêté par le chef** (proposition C.3 en § 7) ; GO + **gel DT-01** (8 erreurs TypeScript préexistantes archivées verbatim, jamais corrigées pendant le lot) ; **aucun prérequis documentaire** |
| **L2** | GO L1 exécuté ; **projection du payload métier v1 arbitrée** (`analyses/proposition-projection-payload-v1.md`) ; DC-2/DC-8 acquis ; **limité à DC-2 + DC-8 + contrats acquis, sans O-2 ni O-8** |
| **L3** | O-2 final (verbatim ARB-07-O — source absente) ; pipeline ACK/abandon consolidé ; DC-7-bis |
| **L4** | après L3 |
| **L5** | démonstrations (matrice D) ; O-4 niveau B établi avant toute purge effective |
| **Clôture d'implémentation puis validation technique finale** | après L5 |

Dépendances documentaires avant implémentation : transcriptions manquantes (ordre exact des
composantes de `consId`, caractères échappés, contenu verbatim du head, formulation exacte de la
sémantique `list`, cible du plafond 10¹⁵, tableau complet des codes de refus) — signalées
explicitement avant toute implémentation qui en dépend ; aucune complétion par supposition.

## 7. Points ouverts

| Point | État |
|---|---|
| **Liste exacte des champs du payload métier v1** | `[POINT OUVERT — BLOQUANT pour la finalisation de DC-2]` — **[PROPOSITION]** soumise : `analyses/proposition-projection-payload-v1.md` |
| **Modalité HTTP de l'epoch d'origine** | direction **`X-Kitchen-Epoch` retenue sous conditions** par le chef ; spécification détaillée en `analyses/propositions-epoch-http-et-l1.md` — la vérification concrète du transit du proxy Render reste à faire (repli : corps de requête, décision documentée) |
| **Périmètre de L1** | principe **approuvé** (canonisation + digest, hors projection, hors identité) ; cadrage détaillé en `analyses/propositions-epoch-http-et-l1.md` **et** en `analyses/livrables-abcd.md` § C (C.3/C.4 — livrable C) — maintenu au statut de **proposition**, **pas un GO** |
| **Cible du plafond A-4 (10¹⁵)** | aucune source accessible ne nomme le champ ; proposition argumentée (application à `quantity`) dans la fiche de projection — arbitrage requis |
| **Codes de refus résiduels** (D6a, D13, fingerprint différent) | à choisir à l'implémentation après relecture du tableau §4 de Session A ; aucun code inventé sans arbitrage |
| **Injectivité du profil de canonisation** | `[POINT OUVERT]` — définition du domaine, relation d'équivalence (set/list/multiset) et justification formelle |
| **O-2 final** | `[OUVERT — BLOQUÉ SOURCE]` — verbatim ARB-07-O absent du disque ; bloque la retranscription L3, pas la consolidation L2 |
| **O-8** | `[OUVERT — BLOQUÉ SOURCE]` — P4/G1–G5 absents du disque ; périmètre à déterminer après source, non bloquant L2 par défaut |
| **O-4 niveau B** | `[OUVERT — après O-5]` — durées, seuils de liveness (`STALE_DEVICE_MS` = 83 j : périmètre d'application à établir, pas une règle universelle), rétentions chiffrées, validation par adaptateur ; **le niveau A ne vaut pas autorisation de purge** |
| **O-5, O-6, O-7, O-9, DC-7-bis, P3** | `[REPORTÉS]` — leurs décisions restent ouvertes ; DC-7-bis avant L3 |
| **DT-05** | traces de session antérieures non archivées ; le tableau `roadmap.md` § 6 bis est une retranscription de synthèse, pas l'archivage exhaustif |
| **Transcriptions manquantes** | ordre exact `consId`, caractères échappés, contenu du head, formulation `list`, cible 10¹⁵, tableau complet des codes — `[CONFIRMÉ]` pour les règles générales, détails non retranscrits, jamais reconstitués |

## 8. État d'avancement (au 25/11/2026)

- **Décisionnel** : clos — Session A, canon-prepare-v1, O-3, O-11, O-12, O-13, O-4 niveau A,
  DC-2, DC-8, R-7a/R-7b α arbitrés ; **rien de rouvert**.
- **Revue documentaire du corpus (25/11/2026)** : **[VALIDÉ — REVUE DOCUMENTAIRE]** — placement
  du dossier approuvé (`fondations-techniques/datastore-protocole/`) ; fiches de propositions
  C.1/C.2/C.3 affinées et revues positives (mapping DC8-A02 pour `ingredient` — champ métier ⇒
  `refusal_payload_invalid`, A-6 jamais étendu par analogie ; trois statuts séparés du plafond
  A-4 : plafond+entier exact `[CONFIRMÉ]`, cible `[POINT OUVERT]`, application à `quantity`
  `[NOUVELLE PROPOSITION]` ; epoch zéro légale ; vecteurs débordement (`1e999`) et
  sous-débordement (`1e-999`) distingués, zéro réellement représenté admis) ; plan de
  sécurisation Git corrigé et validé sur le principe (commits 1–7 **sans GO**). **Exigence
  technique enregistrée pour L1** (à couvrir par les vecteurs et critères de validation L1) :
  détection du sous-débordement **à partir du littéral numérique d'origine**, jamais depuis la
  seule valeur de `JSON.parse` — rejet du littéral non nul fondant en zéro ; admission de
  `0`/`0.0`/`0e0` ; rejet de `-0` (P-3) ; nombres **subnormaux encore représentables jamais
  rejetés abusivement**. **Aucune autorisation nouvelle** : aucun staging/commit/push, aucune
  suppression, aucun correctif lint ou formatage, aucun test ou mesure, aucune implémentation,
  **aucun GO L1 à L7** ; les arbitrages C.1/C.2/C.3 et les autorisations Git des commits 1–8
  restent des décisions séparées du chef.
- **Implémentation** : **aucune** — aucun lot L1 à L7 lancé, aucun GO donné ; le protocole global
  n'est **pas** implémenté, y compris par la portée de version B22-07 (qui est une autre
  évolution, K-1).
- **Corpus** : archivé le 25/11/2026 depuis la conversation transmise ; versions finales
  retranscrites verbatim, itérations intermédiaires restées dans la source ; en-têtes de
  provenance et bornes sources conservés (contrôles d'intégrité réalisés lors de la revue).
- **Lien avec les évolutions en vigueur** : K-1 (synchronisation cuisine, B22-07) et K-2 (contrats
  DataStore) vivent dans les dossiers voisins ; ce dossier en est le prolongement décisionnel.

## 9. Provenance

- Historique conversationnel transmis par le chef (`historiqe.md`, 9 191 lignes), retranscrit le
  25/11/2026 — chaque fichier d'`analyses/` porte les lignes sources exactes dans son en-tête.
- La partie de cet historique consacrée à l'étude et à la structuration de la documentation est
  **hors périmètre** (chantier finalisé depuis) : ni reprise, ni retranscription ici.
- **Chronologie des instantanés pré-arbitrage** : les mentions « DC-2/DC-8 restent à arbitrer » dans les fiches historiques (`canon-prepare-v1-cloture.md`, `o13-o4-fiches.md`, `mission-recuperation-bilan.md`) correspondent à leur **état au moment de chaque fiche** — l'arbitrage DC-2/DC-8 a été rendu **après** elles (source, lignes 7029–7225). L'état actuel des décisions fait foi en § 2 ; aucun passage historique n'est modifié.
- **Recouvrements de provenance (légitimes)** : deux fiches citent des passages sources communs — pilotage 4093–4349 contient la plage de l'arbitrage O-3 4253–4349 ; fiches O-13/O-4 4520–4867 contiennent la plage de l'arbitrage O-4 4600–4712. Références à des passages sources communs, **pas des duplications accidentelles**.
- **Règle de travail** (CLAUDE.md, traçabilité systématique) : toute nouvelle analyse, décision ou
  arbitrage de cette évolution est consigné au fil des travaux dans ce dossier, avec ses statuts
  exacts, ses justifications, ses conséquences, ses dépendances et ses points ouverts.
