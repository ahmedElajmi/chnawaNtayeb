# Livrables A–D des quatre missions — versions corrigées et consolidations

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 7959–8293, 8488–8576, 8716–8803 et
> 9018–9057 du fichier source). Bloc 1 : livrables A (spécification DC-2 v1), B (matrice de
> traçabilité), C (cadrage L1), D (matrice préparatoire des démonstrations L2) + consolidation
> finale. Blocs 2–4 : corrections du VOLET 1 (dépendances idempotence/payload, qualification de
> l'injectivité, précisions B, cadrage L1/DT-01, matrice D) — la dernière consolidation (bloc 4)
> fait foi sur les deltas. Aucun statut modifié, aucune complétion, aucune retranscription de
> source inaccessible. Le vocabulaire (base, SDK, termes conversationnels) reste celui des fiches
> d'origine — aucune norme de nommage du projet n'est appliquée rétroactivement.

## A.1 Sources identifiées

| Source | Contenu | Statut |
|---|---|---|
| Arbitrages DC2-A01…A05, DC8-A01…A08 (cette conversation) | base de la spécification | `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` |
| A-3, A-5, A-6 (Session A) | `consId`, `opId`, head, `refusal_id_noncanonical` | règles `[DÉCIDÉ]` ; **détails de transcription partiels** |
| canon-prepare-v1 (DC-1…DC-14) | profil P-1…P-7, plafonds, budget | `[DÉCIDÉ]` |
| R-7a / R-7b (option α) / R-9 | fonction, domaine, méthode | `[DÉCIDÉ]` / `[DÉCIDÉ — α]` / `[RECOMMANDÉ]` |
| Schéma de payload existant dans le dépôt | **aucun schéma de payload accessible** (vérifié ; le schéma L2.2/SCH reste absent) | `[POINT OUVERT]` |

## A.2 Projection du payload v1

**Constat structurel** : DC2-A03 `[DÉCIDÉ — PRINCIPE]` impose un payload métier présent dès la v1, minimal, **à formaliser à partir du schéma disponible** — or **aucun schéma accessible**. **Aucun champ métier n'est inventé** (consigne expresse). La spécification fournit donc le **cadre complet** de la projection ; la **liste des champs reste le point de décision restant** :

**Règles que toute projection devra respecter** `[DÉCIDÉ]` :
1. chaque champ déclaré : nom, type, obligatoire/facultatif, contraintes, **sémantique DC-5 explicite** pour tout champ composite (scalaire/set/list/multiset/tableau ordonné P-7) ;
2. champs inconnus : **rejetés** ; `null` explicite : **interdit** (DC-3) ; **l'omission est la représentation de l'absence** ;
3. `digest` client : **interdit** ; identité (`device`, `opId`, `epoch` d'origine) : **hors payload** (domaine α) ;
4. plafonds DC-6 : entrée 256 KiB, canonique 512 KiB, profondeur 64, 100 000 nœuds ;
5. payload **minimal** : seules les informations nécessaires à l'intention protégée ;
6. **aucune implémentation sur une projection supposée**.

**Projection exacte des champs** : `[POINT OUVERT]` — **[BLOQUANT] pour la finalisation de la fiche de projection uniquement** (voir D.2 de la consolidation) ; non bloquant pour le reste de la spécification.

## A.3 Représentation de l'epoch d'origine dans le transport HTTP

**Règle unifiée** `[DÉCIDÉ]` (A.1bis de la fiche stabilisée) :
- l'epoch d'origine fait **obligatoirement partie de l'identité** `(device, epoch, opId)` ;
- elle doit être **disponible au serveur pour chaque intention, y compris lors d'un retry** ;
- le serveur détermine **indépendamment** l'epoch active du compte (DC2-A04) ;
- le serveur **compare** les deux et **refuse toute réinterprétation d'une ancienne intention dans une nouvelle epoch** ;
- le client **ne peut jamais imposer** l'epoch active.

**Modalité de transmission** : directe dans la requête (obligatoire) **ou** indirecte par un mécanisme de transport **explicitement défini** — **précision à finaliser** `[POINT OUVERT]` ; la disponibilité obligatoire ne dépend pas de cette modalité.

## A.4 Octets exacts du digest SHA-256

| Élément | Spécification | Statut |
|---|---|---|
| Domaine | **payload métier canonique uniquement** (option α) — identité exclue | `[DÉCIDÉ]` (DC2-A02) |
| Entrée | octets UTF-8 de la **sérialisation canonique** produite par l'**implémentation `cpv` associée à l'intention** — les octets exacts sont **totalement déterminés dès que la projection des champs est fixée** | dépend de A.2 |
| Fonction | SHA-256 | `[DÉCIDÉ]` (R-7a) |
| Encodage | Base64URL sans padding, 43 caractères | `[DÉCIDÉ]` (R-7a) |
| `cpv` / DC-13 | disponibilité de l'implémentation de canonisation **couplée à la rétention** des entrées Reg1 qui la référencent ; **invariant de reproductibilité** : toute vérification ultérieure reproduit le même domaine canonique avec la version associée ; une évolution de canonisation ne rend jamais impossible la vérification d'une intention conservée | `[DÉCIDÉ]` (DC-13) |
| R-9 (re-canonisation avec `cpv` enregistré) | méthode technique recommandée | `[RECOMMANDÉ]` — **jamais `[DÉCIDÉ]`** |

## A.5 Vérification du digest — reprises et opérations idempotentes

| Situation | Procédure spécifiée |
|---|---|
| Première préparation | canonicalisation (version courante) → digest → Reg1 create-only avec fingerprint immuable + `cpv` référencé (DC-13) ; préinscriptions SC-O13-03 si création protégée |
| Retry / observation idempotente (ligne 1) | recherche par identité ; Reg1 présent et cohérent ⇒ **re-canonicalisation du payload reçu avec la version de canonisation de l'entrée stockée** → digest recalculé ⇒ comparaison au fingerprint ; égalité **et** cohérence index/Reg1/head/ref/classification ⇒ observation idempotente ; sinon **aucune observation présumée** |
| Égalité des digests | **vérification cryptographique fondée sur la résistance aux collisions de SHA-256** — **pas une preuve mathématique absolue** d'identité des payloads |
| Version de canonisation indisponible pour une intention conservée | violation de l'invariant DC-13 ⇒ **fail-closed + réconciliation** (jamais de vérification dégradée) |
| Reg1 présent, fingerprint différent | **DC8-A05** : aucune nouvelle exécution ; défaut **fail-closed + réconciliation** tant que non qualifiée |
| Reprise cas 4 | conditions O-13 inchangées (double preuve (a)+(b), garanties de complétude/exhaustivité) — **non utilisable en production avant démonstrations** `[À DÉMONTRER]` |

## A.6 Décisions acquises et précisions restantes

**Acquises** : matrice des champs (hors liste payload), whitelist, `null`/omission, digest serveur, epoch (A.3), octets (A.4 structure), idempotence (A.5), plafonds, canonisation P-1…P-7, `opId` A-5. **Restantes** : liste des champs payload `[POINT OUVERT — BLOQUANT pour la projection]` ; modalité HTTP de l'epoch ; codes résiduels (§4) ; cible 10¹⁵.

## A.7 Cohérence — vérifiée

A-3 (`consId`, plafonds, verbatim) ✓ · A-5 (`opId` complet) ✓ · A-6 (`refusal_id_noncanonical`, head) ✓ · DC-1 (P-1…P-7, injectivité sur valeur parsée) ✓ · DC-3 (null) ✓ · DC-4/DC-4b (tri UTF-16, nombres) ✓ · DC-5 (sémantiques par champ) ✓ · DC-6 (plafonds) ✓ · DC-7 (serveur seul) ✓ · DC-13 (`cpv`/rétention/reproductibilité) ✓. **Aucune contradiction détectée.**

---

# LIVRABLE B — Matrice de traçabilité des précisions documentaires restantes

*Aucune tentative d'archives relancée ; aucun contenu historique reconstruit ; arbitrages inchangés.*

| # | Élément | Source accessible | Contenu confirmé | Statut | Dépendances | Manquant | Conséquences pour les lots |
|---|---|---|---|---|---|---|---|
| B1 | **A-3 — `consId`** | fiches/arbitrages conversationnels | séparateur `~` ; échappement `%` ; **ordre fixe des composantes** ; `consumer` verbatim (dernière composante) ; décodage strict ; plafonds UTF-8 (96/64/16/400/43) ; aucune normalisation | `[DÉCIDÉ]` — détail de transcription partiel | encodage `consId` (L2) | **valeur exacte de l'ordre** et **jeu de caractères échappés** non transcrits — *décision générale et ordre fixe restent décidés* | implémentation de l'encodage/décodage ; signaler la précision avant implémentation |
| B2 | **A-6 — head** | idem | id `head~e{E}~{D%}` ; suivi de `nextOrdinal` uniquement ; fermeture d'epoch séparée (O-11/O-12) ; `refusal_id_noncanonical` défini | `[DÉCIDÉ]` | écriture head, progression ordinals | **contenu verbatim du head** non transcrit | implémentation du head ; idem |
| B3 | **DC-5 — sémantiques** | idem | dédup/normalisation par sémantique **explicitement déclarée** ; tableau ordonné P-7 jamais trié/dédupliqué ; `set`/`multiset` principes décidés | `[DÉCIDÉ]` | canonisation (L2) | **formulation exacte de `list`** non transmise ; **aucune déduplication générique** | implémentation de la canonisation ; la déclaration par champ dépend de la projection payload |
| B4 | **A-4 — plafond 10¹⁵** | idem | plafond numérique + contrainte d'entier exact existent | `[CONFIRMÉ]` ; **portée : `[DÉCIDÉ — PRÉCISION DE PORTÉE]`** (DC2-A05 : non étendu sans confirmation) | application du plafond | **cible exacte du champ** (epoch ? ordinal ? autre ?) | toute application à `epoch`/`ordinal` exige cette confirmation |
| B5 | **Session A §4 — codes de refus** | idem | 4 noms confirmés : `refusal_payload_invalid`, `refusal_cap_exceeded`, `refusal_epoch_closed`, `refusal_capacity` (fragment) ; ordre de priorité contractuel pour causes détectables (C-2) ; **tableau 9 lignes = référentiel unique** | codes `[CONFIRMÉ]` ; autres noms **`[POINT OUVERT]`** | DC8-A01…A08 ; D6a résiduel, D13, fingerprint différent | **noms des autres codes** et leurs conditions d'usage | choisir les codes résiduels à l'implémentation ; arbitrage séparé si un code dédié s'avère nécessaire |
| B6 | **`refusal_capacity`** | idem (fragment [C2]) | existence au commit confirmée | `[CONFIRMÉ]` | D14 | **conditions exactes d'émission ; garanties de rollback ; distinction refus certain / résultat indéterminé** — la distinction conceptuelle est conservée, la sémantique historique non | comportement au commit ; règles de retry (hors périmètre) |

**Constat global B** : aucune information manquante ne bloque un arbitrage — **toutes** concernent des détails de transcription ou des confirmations à opérer **avant les implémentations qui en dépendent** ; signalées explicitement (consigne).

---

# LIVRABLE C — Dossier de cadrage L1

## C.1 Définition historique — recherche

- **Documents du dépôt accessibles** (`17-plan-de-realisation.md`, `plan-consolide-pre-implementation.md`) : **aucune occurrence de `L1`/`DT-01`** (grep ciblé) — la définition opérationnelle de L1 **n'existe pas dans les sources du projet accessibles** ;
- **Source accessible réelle** : le **rapport de pilotage** (artefact conversationnel) — fragments confirmés : « L1 : **aucun prérequis documentaire** ; GO + **gel DT-01** ; **L1 précède L2** ».

## C.2 Ce qui est confirmé de L1

| Élément | Statut |
|---|---|
| L1 = premier lot d'implémentation, **antérieur et distinct de L2** | `[CONFIRMÉ]` (rapport de pilotage) |
| **Aucun prérequis documentaire** pour lancer L1 | `[CONFIRMÉ]` |
| **GO explicite du chef = condition** (jamais implicite) + **gel DT-01 au GO** (commande typecheck de référence identifiée au GO, sortie verbatim, **aucune correction des 8 erreurs pendant L1**) | `[DÉCIDÉ]` (procédure DT-01) |
| Objectif, périmètre opérationnel, livrables, critères d'acceptation historiques | **`[POINT OUVERT]` — définition non accessible** ; **L1 n'est pas inventé** |

## C.3 Prérequis, interactions, risques, exclusions

- **Avant L1** : uniquement le GO explicite ; **aucun lot ou décision terminés exigés** (source confirmée) ; les arbitrages DC-2/DC-8 **ne créent pas de prérequis L1** (ils en constituent la base contextuelle) ;
- **Interactions DC-2/DC-8** : aucune contradiction ; le gel DT-01 ne doit pas masquer des défauts introduits par le travail L1 lui-même (contrôle : typecheck au GO ≠ typecheck en fin de L1 sur les fichiers touchés) `[NOUVELLE PROPOSITION — règle de contrôle]` ;
- **Risques** : périmètre non défini ⇒ risque de dérive de périmètre et de chevauchement avec L2 ; corrections DT-01 tentées par opportunisme ⇒ violation de la procédure ;
- **Exclusions** : tout ce qui relève de L2 (protocole de préparation, DC-2/DC-8), des démonstrations (L5+), des arbitrages clos.

## C.4 DT-01 séparément

| Élément | Statut |
|---|---|
| **8 erreurs TypeScript préexistantes** | `[CONFIRMÉ]` (rapport de pilotage) |
| **Localisation** | **non relevée par conception** — relevée **verbatim au GO de L1** (procédure DT-01 `[DÉCIDÉ]`) ; aucune exécution de typecheck n'a été faite dans cette mission (ni test ni mesure autorisée) |
| Corrections | **intervention distincte, jamais un bloqueur de L2** `[DÉCIDÉ]` |
| Corrections appartenant réellement à L1 | `[POINT OUVERT]` — par défaut **aucune** ; seulement si une contradiction matérielle avec le travail L1 est établie |

## C.5 Proposition de cadrage (définition historique absente)

**`[NOUVELLE PROPOSITION]` — soumise à votre validation** : L1 = **lot d'implémentation initial sans prérequis documentaire**, antérieur à L2, dont le périmètre opérationnel doit être **explicitement arrêté par vous** avant tout GO ; critères d'acceptation proposés : `npm run check` vert (hors erreurs DT-01 gelées), aucune regression de tests existants, zéro dette DT-04 (travail commité), périmètre respecté sans empiètement L2. **Recommandation : clarification supplémentaire du périmètre avant tout lancement — ne pas lancer L1 sans périmètre explicite** `[RECOMMANDÉ]`.

---

# LIVRABLE D — Matrice préparatoire des démonstrations L2

*Aucun test ni démonstration exécuté. Garanties architecturales ≠ validations techniques. « Lot » = rattachement proposé d'après le rapport de pilotage ; attributions incertaines marquées `~`.*

| # | Garantie | Décision | Comportement attendu | Scénarios (normaux / échec / concurrence / restauration) | Preuves attendues | Critères d'acceptation | Dépendances | Impossible à démontrer maintenant | Lot |
|---|---|---|---|---|---|---|---|---|---|
| D-1 | **Canonisation** : déterminisme du domaine, P-1…P-7, plafonds DC-6 | DC-1, DC-4b, DC-6 | même payload + même `cpv` ⇒ même forme canonique ; rejets DC-3/DC-4b | N : vecteurs conformes · É : null, doublons, Infinity/-0, plafonds · C : n/a · R : n/a | tests de canonisation, vecteurs de référence | 100 % des rejets P-1…P-7 ; injectivité sur valeur parsée | projection payload | injectivité mathématique (jamais testable) | **L2** |
| D-2 | **Digest** : déterminisme, conformité R-7a, reproductibilité inter-versions | R-7a, R-7b α, DC-13 | même forme canonique ⇒ même digest 43 ; reproductibilité avec le `cpv` de l'intention | N : reprise/observation idempotente · É : version indisponible ⇒ fail-closed · C : n/a · R : re-canonisation si R-9 retenu | tests de digest, reproductibilité entre versions/adaptateurs | zéro divergence de digest à `cpv` égal | projection payload, `cpv` | résistance aux collisions (hypothèse cryptographique) | **L2** |
| D-3 | **Budget 3/4** : Reg1 ≡ index, claim-once | DC-14, A-9 | 3 écritures nominal, 4 à la première préparation | N : préparation · É : échec ⇒ unité annulée · C : claim concurrent | mesure d'écriture en transaction | correspondance au budget | adaptateur | rien d'autre | **L2** |
| D-4 | **Atomicité des opérations protégées** : {Reg1, index, head, ref} + claim | DC-14, Session A | tout ou rien par intention ; pas d'effet partiel | N : commit · É : échec transactionnel ⇒ annulation certaine / résultat inconnu ⇒ fail-closed · C : préparations concurrentes de la même intention ⇒ une seule réservation · R : incohérence post-restauration ⇒ divergence | tests de transaction, scénarios de concurrence | aucune écriture partielle ; aucune double réservation | adaptateur (transactions réelles) | — | **L2** |
| D-5 | **Fermeture irréversible + états d'epoch** | O-11 (SC-O11-01…04, 06…09) | open/closed/indeterminate ; fail-closed sur indeterminate ; `refusal_epoch_closed` | N : rotation normale · É : epoch fermée ⇒ refus ; indeterminate ⇒ fail-closed · C : rotations concurrentes (SC-O11-08) · R : restauration ⇒ indeterminate | tests d'état, scénarios de rotation | aucun refus de type indéterminé traité comme métier ; irréversibilité constatée | — | idempotence **complète** des rotations (mécanisme [À DÉMONTRER]) | **L2/L4 ~** |
| D-6 | **Rotation atomique dans le stockage principal** (périmètre scoped) | O-11 SC-O11-06/07 | 4 propriétés de sérialisation prepare/rotation | N · É · C : préparations pendant rotation | tests de sérialisation par adaptateur | parité par adaptateur | adaptateur | atomicité inter-magasins (jamais présumée) | **L2/L4 ~** |
| D-7 | **Autorité externe (journal témoin)** : indépendance, préinscription avant effet, refus sans autorité | O-3 SC-O3-01/03, O-13 | préinscription des intentions protégées ; indisponibilité ⇒ refus temporaire | N · É : autorité absente ⇒ refus, divergence ⇒ fail-closed · C · R : journal ⊋ état restauré ⇒ détection | tests d'indépendance, scénarios de divergence | aucune opération protégée sans autorité ; aucune preuve négative d'indisponibilité | choix d'infrastructure (niveau B/SC-O3-01) | **exhaustivité, complétude, durabilité, auto-détection de divergence** `[À DÉMONTRER]` | **L2/L6 ~** |
| D-8 | **Preuves O-13** : positives (palier 1) / négatives / cas 4 | O-13 SC-O13-01…05 | palier 1 = preuves positives dans le périmètre restauré ; cas 4 = double preuve (a)+(b) | N · É : preuve incomplète ⇒ cas 4 fermé · C · R : absence dans périmètre restauré ne prouve rien | scénarios de preuve | cas 4 fermé sur toute preuve incomplète | D-7 + démonstrations d'exhaustivité | cas 4 **non utilisable en production avant démonstrations** | **L5/L6 ~** |
| D-9 | **Restauration** : divergence, résurrection, purge-aware | O-4 niveau A, SC-O3-02, SC-O13-02 | purge enregistrée explique l'absence ; restauration antérieure ⇒ divergence ⇒ fail-closed | N · É : résurrection ⇒ fail-closed · C · R : cœur du sujet | comparaison état/historique | aucune résurrection acceptée sans explication vérifiable | O-4 niveau B (valeurs) | résistance à la restauration `[À DÉMONTRER]` | **L5/L7** |
| D-10 | **Audits J4** : light/deep, P+A, exhaustivité, pagination à totaux justes, stabilité | ARB-02, P2/M1/M3 | audit stable et concluant ; P+A avant toute purge concernée | N · É : audit instable ⇒ aucune purge · C · R | procédure J4 (C-D1…C-D8) | audits reproductibles ; pagination correcte | définitions détaillées J4 (historique partiel — Livrable B) | preuve-équivalence P2 **jamais substituée** | **L5** (J4 C-D1…C-D8) |
| D-11 | **Parité des adaptateurs** | contrat de stockage, tests de contrat | mêmes garanties sur chaque adaptateur | tests de contrat communs | suites passées sur chaque adaptateur | harnais extensible à tout moteur SQL sans modifier le métier | adaptateurs | compatibilité **démontrée** des autres moteurs SQL (statut réel : SQLite ; PostgreSQL/MySQL/SQL Server **non démontrés**) | **L2/L5** |
| D-12 | **Sync/liveness** : monotonie I-14, exclusion RECO (c) | I-14, RECO (b)(c), O-4 A04 | liveness jamais décroissante ; exclusion des devices à liveness insuffisante de la purge | N · É · C · R : réintégration sans régression | tests de sync | aucune régression de liveness | O-4 niveau B (seuil) | — | **L4** |

**Lecture** : les lignes D-1…D-4, D-11 constituent le **cœur démontrable dès L2** ; D-5…D-8 dépendent de l'exécution et de démonstrations d'exhaustivité ; D-9/D-10 relèvent de **lots ultérieurs** (L5/L7) ; **aucune garantie n'est déclarée techniquement validée avant démonstration effective**.

---

# CONSOLIDATION FINALE DES QUATRE MISSIONS

**1. Livrables** : A — fiche de spécification DC-2 v1 (cadre complet, projection payload = seul point de décision restant) · B — matrice de traçabilité (6 éléments, aucune décision rouverte, précisions signalées) · C — dossier de cadrage L1 (définition historique **absente des sources accessibles** ; fragments confirmés via le rapport de pilotage ; proposition de cadrage soumise) · D — matrice préparatoire des démonstrations L2 (12 lignes, rattachements par lot).

**2. Dépendances entre missions** : A ← B (A-3/A-6/DC-5/A-4/§4 alimentent la projection et les détails) ; D ← A (D-1/D-2) et ← B (codes §4 pour les refus résiduels) ; C indépendant ; B indépendant.

**3. Contradictions** : **aucune** détectée entre les quatre livrables ni avec les arbitrages clos.

**4. Décisions préservées** : Session A (A-1…A-12, invariants, taxonomie, ligne 1) · canon-prepare-v1 (DC-1…DC-14, P-1…P-7) · R-7a/R-7b α/R-9 recommandé · O-3/O-11/O-12/O-13 · O-4 niveau A · RECO (a)(b)(c) · ARB-01/ARB-02 · P2/M1/M3 · D6 strict. **Rien de rouvert.**

**5. Nouveaux arbitrages nécessaires** : (i) **liste exacte des champs du payload métier v1** — source historique absente, champs non inventables : soit vous fournissez le schéma, soit vous définissez explicitement les champs, soit vous demandez une proposition de projection (nouvelle, non historique) `[BLOQUANT pour la finalisation de la fiche de projection uniquement]` ; (ii) **modalité HTTP de l'epoch d'origine** (directe ou mécanisme indirect défini) — à décider avec (i) ; (iii) **périmètre explicite de L1** (proposition C.5 `[NOUVELLE PROPOSITION]`) ; (iv) **codes résiduels** après relecture du tableau §4 (D6a non couvert, D13 si aucun code existant, refus spécifique fingerprint différent le cas échéant).

**6. Bloqueurs réels et impact** : **L1** : aucun bloqueur documentaire — seul le **périmètre** doit être arrêté avant GO `[BLOQUANT au GO]` ; **L2** : niveau décisionnel **dégagé** (DC-2/DC-8 arbitrés) ; la **projection payload** est le seul préalable documentaire d'implémentation ; les éléments B (transcriptions) bloquent des **détails d'implémentation**, pas des arbitrages.

**7. Ordre de priorité recommandé** : ① votre arbitrage de la projection payload + modalité epoch (débloque la spécification finale) ; ② validation du périmètre L1 (proposition C.5) ; ③ transcription-confirmations B au fil des besoins d'implémentation ; ④ exploitation de la matrice D au dossier d'exécution de L2 — **après GO L1 et exécution de L1**.

**8. Clôturables immédiatement au niveau documentaire** : la spécification DC-2 (tout sauf la projection), la matrice B, la matrice D (préparatoire), le cadre L1 (hors périmètre).

**9. Nécessitent encore une démonstration technique** : déterminismes canonisation/digest, conformité expérimentale, reproductibilité inter-versions/adaptateurs, budget 3/4, atomicité, rotations, journal témoin (exhaustivité/complétude/durabilité/divergence), preuves O-13/cas 4, restauration/résurrection, audits J4, parité adaptateurs, liveness — **`[À DÉMONTRER]`**, jamais présumées.

**10. Recommandation finale** : **aucun lot déclenché**. Prochaines étapes proposées : vos décisions explicites sur (i) et (iii) ci-dessus, puis — si vous le décidez distinctement — GO L1 avec gel DT-01, puis GO L2 une fois la projection finalisée. **Aucune autorisation d'exécution ne découle de cette demande ; tout futur GO L1/L2 sera votre décision explicite distincte. Aucune intervention sur le dépôt.**

Je souhaite poursuivre deux travaux en parallèle, avec deux objectifs complémentaires :

1. Finaliser la revue des quatre missions documentaires présentées dans ton dernier rapport.
2. Engager dès maintenant l'audit et la réorganisation globale de la documentation du projet selon la nouvelle organisation fonctionnelle que nous avons définie.

Les deux travaux sont exclusivement documentaires et préparatoires. Ils doivent être menés en parallèle, sans attendre la clôture de l'un pour commencer l'autre.

# VOLET 1 — Revue et consolidation des quatre missions précédentes

Reprends les livrables A, B, C et D ainsi que leur consolidation finale.

L'objectif est de corriger les imprécisions, de clarifier les dépendances et de produire une version consolidée fiable, sans rouvrir les arbitrages déjà acceptés.

## 1. Livrable A — Spécification DC-2

Conserver les arbitrages DC-2/DC-8 et les décisions déjà validées.

Revoir néanmoins les points suivants :

**A.1 — Projection payload**
- Maintenir l'absence de schéma métier accessible comme constat.
- Ne pas inventer les champs.
- Distinguer le cadre de projection déjà décidé de la liste exacte des champs encore à formaliser.
- Préciser exactement quelles parties de l'implémentation dépendent de cette projection.

**A.2 — Epoch**
- Conserver les trois notions distinctes : epoch d'origine, epoch active déterminée par le serveur et comparaison entre les deux.
- La disponibilité de l'epoch d'origine au serveur reste obligatoire pour chaque intention et retry.
- La modalité HTTP doit être définie avant l'implémentation concernée.
- Ne pas laisser entendre que le client peut choisir l'epoch active.

**A.3 — Digest et canonisation**
- Conserver SHA-256, Base64URL sans padding et les 43 caractères.
- Conserver le domaine de calcul limité au payload métier canonique.
- Conserver le lien entre `cpv` et DC-13.
- Bien distinguer déterminisme de canonisation, déterminisme du digest et résistance cryptographique aux collisions.
- Une égalité de digest repose sur l'hypothèse cryptographique de résistance aux collisions ; elle ne constitue pas une preuve mathématique absolue d'identité des payloads.

**A.4 — Reprise et idempotence**
- Vérifier que la cohérence index/Reg1/head/ref/classification est bien présentée comme une condition supplémentaire à la comparaison du digest.
- Maintenir le fail-closed en cas de preuve insuffisante.
- Ne pas transformer R-9, qui reste `[RECOMMANDÉ]`, en décision obligatoire.
- Maintenir les conditions O-13 pour le cas 4.

**A.5 — Critère d'injectivité**
La formulation « injectivité sur valeur parsée » présente dans A.7 et D-1 doit être corrigée.

Ne pas présenter l'injectivité mathématique comme un critère que les tests pourraient démontrer expérimentalement.

Distinguer :
- conformité aux règles du profil JCS restreint ;
- déterminisme de la représentation canonique ;
- conformité des vecteurs de référence ;
- comportement sur les cas limites ;
- résistance aux collisions de SHA-256, qui est une propriété cryptographique attendue et non une propriété démontrable par une campagne de tests.

Ne pas supprimer les exigences de conformité sous prétexte que l'injectivité mathématique n'est pas testable.

## 2. Livrable B — Précisions documentaires

Reprendre les six éléments B1 à B6.

Pour chaque élément :
- distinguer la règle déjà décidée de son détail de transcription manquant ;
- préciser les fonctionnalités qui dépendent réellement de ce détail ;
- ne pas inventer une valeur manquante ;
- ne pas rouvrir les décisions déjà arbitrées.

Points d'attention particuliers :

**A-3** : l'ordre exact des composantes et le jeu des caractères échappés restent à retrouver ou à faire confirmer. Ne pas inventer leur contenu.

**A-6** : conserver ce qui est confirmé concernant le head et `nextOrdinal`, sans compléter son contenu physique par supposition.

**DC-5** : conserver les règles décidées pour les tableaux ordonnés, sets et multisets. Ne pas inventer la formulation manquante concernant `list`.

**A-4** : ne pas étendre le plafond 10¹⁵ à l'epoch ou à l'ordinal sans preuve que ces champs sont bien la cible historique de cette règle.

**Session A §4** : vérifier précisément la provenance de chaque code et de chaque règle de priorité.

La mention « tableau de neuf lignes = référentiel unique » doit être justifiée par une source accessible et identifiable. Si le tableau complet n'est pas accessible, signaler cette limite. Ne pas présenter un fragment ou une reconstruction comme la transcription historique complète.

**`refusal_capacity`** : conserver le caractère ouvert de ses conditions exactes d'émission, de ses garanties de rollback et de la distinction entre refus certain et résultat indéterminé.

## 3. Livrable C — L1 et DT-01

Conserver les faits établis :
- L1 précède L2.
- L1 est distinct de L2.
- Le GO doit être explicite.
- DT-01 doit être gelé au GO.
- Les huit erreurs TypeScript préexistantes ne doivent pas être corrigées opportunément pendant L1.
- Les corrections éventuelles relèvent d'un traitement distinct, sauf décision explicite ultérieure.

En revanche, ne pas transformer la proposition C.5 en décision.

Le périmètre opérationnel historique de L1 reste absent des sources accessibles. Il faut donc le présenter comme non défini, et non le compléter par supposition.

Revoir également les critères proposés :
- `npm run check` vert hors erreurs DT-01 ;
- absence de régression ;
- zéro dette DT-04 ;
- travail commité.

Ces critères ne sont pas tous acquis.

En particulier :
- DT-04 ne doit pas être transformé en obligation de clôture de L1 ;
- aucun commit ni aucune opération Git ne sont autorisés par cette mission ;
- le contrôle de non-régression du travail L1 doit être distingué du gel initial DT-01 ;
- une vérification finale peut être proposée pour détecter les nouvelles erreurs introduites par L1, sans corriger les huit erreurs préexistantes.

Présenter les critères d'acceptation L1 comme une proposition à arbitrer, et non comme un contrat déjà validé.

Ne pas demander de GO L1 dans le cadre de ce travail.

## 4. Livrable D — Matrice des démonstrations L2

Conserver la matrice comme document préparatoire.

Revoir :
- les critères d'acceptation ;
- les preuves réellement nécessaires ;
- les dépendances entre démonstrations ;
- les garanties qui nécessitent une infrastructure ou un adaptateur non encore choisi ;
- les démonstrations qui dépendent de L2 et celles qui relèvent d'évolutions ultérieures.

Les rattachements aux lots L2/L4/L5/L6/L7 marqués `~` ne doivent pas devenir des attributions officielles.

Présenter ces rattachements comme hypothèses de travail à confirmer à partir du véritable plan de réalisation.

Ne pas confondre :
- spécification d'une garantie ;
- préparation d'un scénario de démonstration ;
- implémentation ;
- test exécuté ;
- démonstration réussie ;
- validation technique.

Aucune garantie ne doit être déclarée validée sans preuve réelle.

## 5. Consolidation du volet 1

Produire une version corrigée des quatre livrables et de leur consolidation.

Elle doit notamment distinguer :
- les décisions définitivement acquises ;
- les précisions documentaires manquantes ;
- les propositions nouvelles ;
- les véritables prérequis de chaque implémentation ;
- les démonstrations techniques restant à réaliser ;
- les dépendances confirmées et les dépendances simplement supposées.

Ne pas rouvrir DC-2/DC-8 ni les autres arbitrages clos sans contradiction matérielle démontrée.

Ne pas déclencher L1, L2 ou un autre lot.

---


---

# Réponse consolidée — VOLET 1 (revue des quatre missions) + VOLET 2 (audit et réorganisation documentaire)
**Exclusivement documentaire et préparatoire — aucun code modifié, aucun test exécuté, aucune mesure, aucune modification ou création de fichier dans le dépôt, aucune suppression ou migration de document, aucune opération Git, aucun démarrage de lot (L1, L2, L2.5 ou autre), aucune purge, aucune autorisation d'implémentation déduite.**

---

# VOLET 1 — Version corrigée des quatre livrables

## 1. Livrable A — Spécification DC-2 (corrigé)

### A.1 Projection payload
- **Constat maintenu** : aucun schéma métier accessible dans le dépôt (vérifié) ; le schéma L2.2/SCH reste absent des sources accessibles `[POINT OUVERT]` ;
- **Aucun champ inventé** ;
- **Cadre de projection `[DÉCIDÉ]`** (whitelist, `null` interdit/omission = absence, digest client interdit, payload minimal, plafonds DC-6, sémantique DC-5 déclarée par champ) **distinct de la liste exacte des champs `[POINT OUVERT — BLOQUANT pour la finalisation de la projection uniquement]`** ;
- **Parties de l'implémentation dépendant de cette projection** (précision demandée) : ① validation des champs et mapping D6a (nature du champ : métier / identité / métadonnée) ; ② **octets d'entrée exacts du digest** ; ③ déclarations DC-5 par champ composite ; ④ représentation HTTP de l'epoch d'origine ; ⑤ construction des vecteurs de référence de canonisation. Tout le reste de la spécification (règles de canonisation, codes, idempotence, fail-closed) **n'en dépend pas**.

### A.2 Epoch — trois notions distinctes (inchangé)
1. **Epoch d'origine** de l'intention (identité, stable aux retries) ; 2. **Epoch active** déterminée **exclusivement par le serveur** ; 3. **Comparaison serveur** et refus de toute réinterprétation inter-epochs. **Disponibilité obligatoire au serveur pour chaque intention et retry** ; la **modalité HTTP doit être définie avant l'implémentation concernée** (directe ou mécanisme indirect explicitement défini) `[POINT OUVERT]` ; le client **ne peut jamais choisir l'epoch active**.

### A.3 Digest et canonisation (inchangé, reformulé)
SHA-256 · Base64URL sans padding · 43 caractères `[DÉCIDÉ]` · domaine = **payload métier canonique uniquement** · lien `cpv`/DC-13 (reproductibilité avec la version de canonisation de l'intention, disponibilité couplée à la rétention). **Distinction maintenue** : déterminisme de la canonisation ≠ déterminisme du digest ≠ **résistance cryptographique aux collisions** (hypothèse attendue, non démontrable par tests) ; **une égalité de digest repose sur cette hypothèse et ne constitue pas une preuve mathématique absolue d'identité des payloads**.

### A.4 Reprise et idempotence (précision intégrée)
La **cohérence index/Reg1/head/ref/classification est une condition supplémentaire** à la comparaison du recalcul de digest — les deux sont **cumulatives** pour l'observation idempotente (ligne 1) ; **preuve insuffisante ⇒ fail-closed** (aucune observation présumée) ; **R-9 reste `[RECOMMANDÉ]`**, jamais obligatoire ; **conditions O-13 du cas 4 maintenues** (double preuve (a)+(b), garanties de complétude/exhaustivité ; non utilisable en production avant démonstrations).

### A.5 Critère d'injectivité — corrigé (remplace « injectivité sur valeur parsée » comme critère de test)

| Critère | Statut |
|---|---|
| **Conformité aux règles du profil JCS restreint** (P-1…P-7) | critère testable `[À DÉMONTRER]` |
| **Déterminisme de la représentation canonique** | critère testable `[À DÉMONTRER]` |
| **Conformité des vecteurs de référence** | critère testable `[À DÉMONTRER]` |
| **Comportement sur les cas limites** (doublons, échappements, surrogates, Infinity/-0, null, plafonds) | critère testable `[À DÉMONTRER]` |
| **Résistance aux collisions de SHA-256** | **propriété cryptographique attendue — jamais une propriété démontrable par une campagne de tests** |
| « Injectivité sur valeur parsée » | **propriété de conception conférée par les règles du profil restreint** (`[DÉCIDÉ]` en tant que conception, DC-1) — **jamais présentée comme un critère que des tests démontreraient** |

**Aucune exigence de conformité n'est supprimée** sous prétexte que l'injectivité mathématique n'est pas testable — seuls les critères de *démonstration* sont rectifiés.

## 2. Livrable B — précisions documentaires (corrigé)

Pour chaque élément : **règle décidée** ≠ **détail de transcription manquant** ≠ **fonctionnalités dépendantes**.

| # | Règle déjà décidée `[DÉCIDÉ]` | Détail de transcription manquant | Fonctionnalités qui en dépendent réellement |
|---|---|---|---|
| **B1 — A-3** | séparateur `~` ; échappement `%` ; **ordre fixe des composantes** ; `consumer` verbatim ; décodage strict ; plafonds UTF-8 ; aucune normalisation | **l'ordre exact des composantes et le jeu des caractères échappés restent à retrouver ou à faire confirmer — leur contenu n'est pas inventé** | encodage/décodage `consId` (sérialisation des ids physiques) |
| **B2 — A-6** | id `head~e{E}~{D%}` ; suivi de `nextOrdinal` uniquement ; fermeture d'epoch séparée ; `refusal_id_noncanonical` | contenu physique du head **non complété par supposition** | écriture/lecture du head, progression des ordinals |
| **B3 — DC-5** | tableaux ordonnés (P-7) jamais triés/dédupliqués ; `set`/`multiset` : principes décidés ; sémantique déclarée par champ | formulation exacte de `list` **non inventée** | canonisation des champs composites ; déclarations de la projection payload |
| **B4 — A-4** | plafond 10¹⁵ + entier exact existent ; **portée : non étendu à `epoch`/`ordinal` sans preuve que ces champs sont la cible historique** | cible exacte du champ | toute application du plafond |
| **B5 — Session A §4** | 4 noms de codes confirmés par des **fragments identifiables dans les arbitrages de cette conversation** (`refusal_payload_invalid`, `refusal_cap_exceeded`, `refusal_epoch_closed`, `refusal_capacity`) | **la mention « tableau de neuf lignes = référentiel unique » provient du résumé conversationnel** — le **tableau complet n'est pas accessible** ; **limite signalée : aucun fragment n'est présenté comme la transcription historique complète** ; la provenance de chaque code est tracée à son fragment | choix des codes résiduels (D6a, D13, fingerprint différent) |
| **B6 — `refusal_capacity`** | existence au commit confirmée (fragment [C2]) | **conditions exactes d'émission, garanties de rollback, distinction refus certain / résultat indéterminé — restent ouverts** | comportement au commit (D14) ; politique de retry (hors périmètre) |

## 3. Livrable C — L1 et DT-01 (corrigé)

**Faits établis conservés** `[CONFIRMÉ]`/`[DÉCIDÉ]` : L1 précède L2 · L1 distinct de L2 · GO explicite obligatoire · gel DT-01 au GO (commande de référence identifiée au GO, sortie verbatim, aucune correction) · les 8 erreurs TypeScript préexistantes ne sont pas corrigées opportunément pendant L1 · corrections = traitement distinct, sauf décision explicite ultérieure.

**Corrections appliquées** :
- **C.5 reste `[NOUVELLE PROPOSITION]`** — jamais une décision ; le **périmètre opérationnel historique de L1 est présenté comme non défini** dans les sources accessibles, **non complété par supposition** ;
- **Critères d'acceptation L1 = proposition à arbitrer** (jamais un contrat validé), révisés :
  1. `npm run check` vert **hors erreurs DT-01 gelées** — *proposition* ;
  2. **contrôle final de non-régression du travail L1, distingué du gel initial DT-01** : détection des **nouvelles** erreurs introduites par L1, **sans corriger les 8 préexistantes** — *proposition* ;
  3. périmètre respecté, sans empiètement L2 — *proposition* ;
  4. ~~« zéro dette DT-04 »~~ **retiré comme obligation de clôture de L1** — DT-04 est un registre de dettes transversal, pas une condition du lot ; **aucun commit ni aucune opération Git n'est autorisé par cette mission**.

**Aucun GO L1 n'est demandé dans ce travail.**

## 4. Livrable D — matrice des démonstrations L2 (corrigé)

- **Statut** : document **préparatoire** — jamais un dossier de validation ;
- **Rattachements `L2/L4/L5/L6/L7` marqués `~` = hypothèses de travail**, à confirmer à partir du **véritable plan de réalisation** (`17-plan-de-realisation.md`, à consulter lors de l'arbitrage) — **pas des attributions officielles** ;
- **Critères d'acceptation D-1 rectifiés** conformément à A.5 (conformité au profil, déterminisme, vecteurs, cas limites — l'injectivité mathématique n'est pas un critère de test ; résistance aux collisions = hypothèse cryptographique) ;
- **Chaîne de statuts distinguée explicitement** : spécification d'une garantie → préparation d'un scénario de démonstration → implémentation → test exécuté → démonstration réussie → validation technique. **Aucune garantie n'est déclarée validée sans preuve réelle** — la matrice en est au stade *spécification/préparation* ;
- **Dépendances d'infrastructure non choisies signalées** : D-7 (journal témoin — infrastructure non choisie, principe seulement, SC-O3-01) ; D-9 (valeurs O-4 niveau B) ; D-5/D-6 (idempotence complète des rotations `[À DÉMONTRER]`) ;
- **Preuves réellement nécessaires** reprises par ligne : tests de canonisation/digest, vecteurs, scénarios de concurrence, scénarios de restauration, mesures de budget 3/4, suites de contrat par adaptateur.

## 5. Consolidation du volet 1 (corrigée)

| Catégorie | Contenu |
|---|---|
| **Décisions définitivement acquises** | DC2-A01…A05 · DC8-A01…A08 · A-3…A-6 (règles générales) · A-5 (opId) · DC-1…DC-14 · R-7a/R-7b α · O-3/O-11/O-12/O-13 · O-4 niveau A · RECO (a)(b)(c) · ARB-02 · P2/M1/M3 |
| **Précisions documentaires manquantes** | B1–B6 (transcriptions) + projection payload + modalité HTTP epoch + tableau §4 complet |
| **Propositions nouvelles** | cadrage L1 (C.5) · critères d'acceptation L1 · règle de contrôle typecheck L1 (gel ≠ régression) |
| **Vrais prérequis d'implémentation** | DC-2 : projection payload (+ ses 5 dépendances A.1) · DC-8 : codes résiduels §4 · D-7 : choix d'infrastructure du journal · D-9 : O-4 niveau B |
| **Démonstrations restant à réaliser** | D-1…D-12 (matrice D), jamais présumées |
| **Dépendances confirmées** | A ← B ; D ← A, B ; L1 → L2 (ordre) ; DC-13 → rétention Reg1 |
| **Dépendances simplement supposées** | rattachements de lots `~` de la matrice D (à confirmer via 17-plan-de-realisation.md) ; contenu historique L1 |

**Aucun arbitrage rouvert ; L1/L2 non déclenchés.**

---


---

# VOLET 1 — Dernières corrections des quatre livrables

## 1. DC-2 : corriger une contradiction sur les dépendances du payload

Dans A.1, tu indiques que la projection payload est bloquante uniquement pour certaines parties de l'implémentation et que l'idempotence n'en dépend pas.

Cette formulation n'est pas correcte.

La vérification d'une observation idempotente repose notamment sur :
- la connaissance du payload métier ;
- sa canonicalisation avec le `cpv` applicable ;
- le recalcul du digest ;
- la comparaison avec le fingerprint enregistré ;
- la cohérence cumulative de l'index, Reg1, head, ref et classification.

La projection exacte est donc nécessaire à la vérification effective de l'équivalence du contenu et à l'implémentation complète de cette partie de l'idempotence.

Corrige la matrice des dépendances en distinguant :
- les règles architecturales déjà définies indépendamment des champs ;
- les spécifications dont le principe est décidé mais dont l'application concrète dépend de la projection ;
- les implémentations qui ne peuvent pas être finalisées sans cette projection.

Ne présente pas l'idempotence comme entièrement indépendante du payload.

Vérifie également la formulation selon laquelle les octets du digest seraient totalement déterminés dès que les champs sont connus : les règles de sérialisation canonique, la version `cpv` et l'encodage doivent rester explicitement pris en compte.

## 2. DC-1 : ne pas surqualifier l'injectivité

La formulation actuelle indique que l'injectivité sur valeur parsée serait une propriété de conception conférée par le profil DC-1.

Je ne souhaite pas que cette affirmation soit considérée comme démontrée simplement parce que les règles P-1 à P-7 ont été définies.

Il faut distinguer :
- les règles du profil décidées ;
- la conformité de leur implémentation, qui devra être testée ;
- le déterminisme de la représentation canonique ;
- l'éventuelle propriété d'injectivité, qui nécessite une définition précise du domaine et de l'équivalence des valeurs, ainsi qu'une justification formelle.

Attention notamment aux sémantiques `set`, `list` et `multiset` : il faut préciser sur quelles valeurs et quelle relation d'équivalence porte une éventuelle propriété d'injectivité.

Ne transforme pas une propriété mathématique non démontrée en garantie acquise.

Les décisions DC-1 ne sont pas rouvertes. Il s'agit uniquement de corriger la qualification de cette propriété.

## 3. Livrable B : préserver la distinction entre règles et précisions manquantes

La présentation actuelle est globalement satisfaisante.

Maintiens les règles A-3, A-4, A-6 et DC-5 déjà décidées.

Les détails historiques manquants doivent rester explicitement identifiés :
- ordre exact des composantes de `consId` ;
- caractères exacts concernés par l'échappement ;
- contenu physique complet du head ;
- formulation exacte de la sémantique `list` ;
- cible historique du plafond 10¹⁵ ;
- tableau complet des codes de refus.

Ne complète aucun de ces éléments par supposition et ne relance pas les recherches d'archives déjà effectuées.

Pour le tableau des neuf lignes, conserve la distinction entre ce qui est confirmé par les fragments disponibles et ce qui n'a pas pu être vérifié dans sa source complète.

## 4. L1 et DT-01

Le cadrage corrigé est acceptable comme proposition de travail, mais pas comme définition historique de L1.

Conserve :
- les huit erreurs préexistantes ;
- leur gel au GO ;
- l'absence de correction opportuniste pendant L1 ;
- le contrôle distinct des nouvelles erreurs éventuellement introduites par L1.

Ne transforme pas les critères proposés en critères d'acceptation définitifs.

Aucune obligation de commit, de clôture DT-04 ou de correction générale de la dette ne doit être introduite dans L1.

Le périmètre de L1 devra être défini séparément avant tout GO.

## 5. Matrice D — démonstrations

Conserve-la comme matrice préparatoire.

Les rattachements de lots marqués `~` restent hypothétiques. Ils ne doivent pas devenir des dépendances officielles sans vérification du plan de réalisation.

Ne déclare aucune garantie démontrée avant l'exécution des scénarios et l'obtention des preuves correspondantes.

# VOLET 2 — Approfondir l'audit documentaire


---

# Consolidation finale — VOLET 1 (livrables corrigés) + VOLET 2 (audit approfondi)
**Exclusivement documentaire et préparatoire — aucune modification, création, déplacement ou suppression de fichier, aucun changement de code/test/configuration, aucun test ou mesure, aucune opération Git, aucun démarrage de lot, aucune purge, aucune migration. Aucun arbitrage rouvert ; aucune recherche d'archives relancée.**

---

# VOLET 1 — Livrables corrigés

## 1. DC-2 — matrice des dépendances du payload (corrigée)

| Catégorie | Contenu |
|---|---|
| **(a) Règles architecturales définies indépendamment des champs** | whitelist stricte / rejet des champs inconnus ; `null` interdit, omission = absence ; digest serveur seul (DC-7) ; plafonds DC-6 ; profil P-1…P-7 ; fail-closed / réconciliation ; codes et ordre de priorité DC8-A08 ; trois notions d'epoch ; format R-7a |
| **(b) Spécifications décidées en principe, application concrète dépendant de la projection** | **la vérification effective de l'équivalence du contenu — donc l'implémentation complète de l'observation idempotente** (elle repose sur : connaissance du payload métier ; canonicalisation avec le `cpv` applicable ; recalcul du digest ; comparaison au fingerprint enregistré ; **cohérence cumulative** index/Reg1/head/ref/classification) ; déclarations DC-5 par champ ; mapping D6a selon la nature du champ ; représentation HTTP de l'epoch d'origine ; vecteurs de référence |
| **(c) Implémentations non finalisables sans la projection** | validateur des champs payload ; domaine du canoniseur ; calcul du digest ; procédure complète de vérification d'équivalence (idempotence de contenu) ; vecteurs de canonisation |

**Correction de la formulation A.1** : l'idempotence **n'est plus présentée comme indépendante du payload** — ses *règles* le sont (catégorie a), son *application complète* ne l'est pas (b, c). **Octets du digest — formulation rectifiée** : les octets exacts résultent de **quatre éléments conjoints**, jamais de la seule liste des champs : ① la liste des champs du payload ; ② les **règles de sérialisation canonique** (P-1…P-7) ; ③ la **version `cpv` applicable** ; ④ l'**encodage** (UTF-8 du canonique → SHA-256 → Base64URL sans padding).

## 2. DC-1 — qualification de l'injectivité (corrigée, décision non rouverte)

| Niveau | Statut |
|---|---|
| Règles du profil P-1…P-7 | `[DÉCIDÉ]` |
| **Conformité de leur implémentation** | **à tester** `[À DÉMONTRER]` — jamais acquise du seul fait que les règles sont définies |
| **Déterminisme de la représentation canonique** | propriété du contrat, à démontrer par tests |
| **Propriété d'injectivité éventuelle** | **`[POINT OUVERT]`** — nécessite : une **définition précise du domaine**, une **relation d'équivalence des valeurs explicite** (notamment pour les sémantiques `set`, `list`, `multiset` : sur **quelles valeurs** et selon **quelle relation d'équivalence** la propriété porterait), et une **justification formelle** — **jamais transformée en garantie acquise** |

## 3. Livrable B — inchangé dans sa structure (validée)

Règles A-3/A-4/A-6/DC-5 décidées conservées ; détails manquants explicitement identifiés (ordre `consId`, caractères échappés, contenu physique du head, formulation `list`, cible 10¹⁵, tableau des codes) — **aucun complété par supposition, aucune recherche relancée**. **B5 précisé** : fragments confirmés identifiables (4 noms de codes + ordre de priorité contractuel C-2) ≠ **tableau complet non vérifié dans sa source** — la mention « tableau de neuf lignes » provient du résumé conversationnel et n'est **pas** une transcription historique complète.

## 4. L1 / DT-01 — cadrage = proposition de travail (pas définition historique)

Conservés : 8 erreurs préexistantes ; gel au GO ; absence de correction opportuniste pendant L1 ; **contrôle distinct des nouvelles erreurs éventuellement introduites par L1** (sans corriger les 8). **Critères = propositions à arbitrer, jamais définitifs** ; **aucune obligation de commit, de clôture DT-04 ou de correction générale de la dette dans L1** ; **le périmètre de L1 sera défini séparément avant tout GO**.

## 5. Matrice D — inchangée dans son statut

Préparatoire ; rattachements `~` = **hypothèses à confirmer par le plan de réalisation** (jamais des dépendances officielles) ; **aucune garantie déclarée démontrée** avant exécution des scénarios et obtention des preuves.

---