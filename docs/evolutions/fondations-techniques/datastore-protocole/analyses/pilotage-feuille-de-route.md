# Pilotage de la synchronisation — rapport consolidé corrigé + feuille de route finale (corrigée)

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 4093–4349 du fichier source). Version de
> référence du pilotage du lot de synchronisation, avec la correction ciblée (séparation des
> prérequis par lot) et la feuille de route finale. Les itérations intermédiaires (versions
> antérieures des mêmes fiches, consolidations remplacées) restent dans l'historique transmis et
> ne sont pas dupliquées ici. Aucun statut modifié, aucune complétion, aucune retranscription de
> source inaccessible. Le vocabulaire (base, SDK, termes conversationnels) reste celui des fiches
> d'origine — aucune norme de nommage du projet n'est appliquée rétroactivement.


# Rapport consolidé corrigé — version de référence de pilotage de la synchronisation
**Exclusivement documentaire et analytique — aucun code, test, mesure, modification de fichier, opération Git, ni démarrage de lot. Aucun GO implicite.**

*Légende : **[DÉCIDÉ]** verrouillé · **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** · **[CONFIRMÉ]** · **[RECOMMANDÉ]** · **[OUVERT]** · **[BLOQUANT]** · **[À DÉMONTRER]** · **[AUTORISÉ]** · **[EXÉCUTÉ]** · **[TESTÉ]**. **Aucun statut [AUTORISÉ]/[EXÉCUTÉ]/[TESTÉ] n'existe à ce jour.** Les cinq chantiers ne sont pas repris depuis le début : ce rapport **corrige** le précédent (statuts O-11, événements Reg1, dépendance O-4/O-5, niveaux de clôture) et **conserve** tout le reste comme référence.*

---

## PARTIE A′ — O-11 : statut corrigé **[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

**Acceptées par vous** (reprises telles quelles, non rouverte) : succession monotone des epochs ; clôture explicite, définitive et irréversible ; **enregistrement de clôture dédié, create-only** (SC-O11-02) ; états `open` / `closed` / `indeterminate` avec **fail-closed en cas d'incertitude** (SC-O11-03) ; **périmètre de rotation account-wide** (SC-O11-04) ; **atomicité de la rotation dans le magasin principal**, garantie limitée à ce périmètre, démonstration par adaptateur (SC-O11-06) ; **sérialisation commune entre `prepare` et rotation** (SC-O11-07) ; **idempotence des rotations et gestion durable de leurs résultats** (SC-O11-08, principe) ; **clôture nécessaire, jamais suffisante pour autoriser une purge** (I-19). **Succession + enregistrement explicite** (SC-O11-01) arbitrée.

**Restent ouverts ou à démontrer, selon leur dépendance** : **SC-O11-05** (déclencheur exact de rotation — **[OUVERT]**, à traiter avec **ARB-07**) ; durées de conservation post-clôture (**O-4/P2**) ; **garanties après restauration** (SC-O11-09 — comportement défini, **résistance effective [À DÉMONTRER]**) ; mécanisme concret d'idempotence (identité de demande, persistance, transitions) et **toutes les démonstrations techniques [À DÉMONTRER]** — le principe arbitré ne vaut pas garantie démontrée. **Conséquences immédiates** : l'**activation d'O-12 est débloquée au niveau décisionnel** (la clôture est désormais définie) ; la **ligne 9 devient exerçable** dès l'implémentation (sous réserve des démonstrations) ; **O-3 et O-4 perdent leur blocage par O-11 au niveau décisionnel**.

---

## PARTIE B′ — O-13 : distinction explicite des cinq événements Reg1

**Statut inchangé** : **O-13 [OUVERT — BLOQUANT pour L6]** ; palier 1 arbitrable immédiatement (SC-O13-01/02) ; palier 2 **conditionné à l'arbitrage O-3** (SC-O13-03/04).

**Les cinq événements liés par le protocole — présence de l'un ne prouve jamais les autres** :

| # | Événement | Ce qu'il prouve seul | Ce qu'il ne prouve pas |
|---|---|---|---|
| 1 | **Intention de créer une réservation Reg1** | qu'une intention existe | ni la préinscription, ni l'allocation, ni la création, ni le commit |
| 2 | **Préinscription externe de cette intention** | qu'une tentative a été **engagée** auprès de l'autorité | **ni que Reg1 a été créé, ni que le `prepare` a été validé, ni que l'effet existe** |
| 3 | **Allocation de l'ordinal** | qu'un ordinal a été réservé dans le cadre de la transaction | **ni que le `prepare` a été validé** |
| 4 | **Création effective de la réservation Reg1** dans le magasin principal | qu'une réservation **existe** — **à ne pas confondre avec une simple intention de réservation** | ni que l'effet métier a eu lieu, ni la survie après restauration |
| 5 | **Confirmation effective du commit** | que l'unité transactionnelle a été validée | ni la survie après restauration |

**Interruption entre préinscription et commit** : traitée **conservativement et indéterminément** lorsque les preuves sont insuffisantes — réexécution interdite, réclamation d'absence interdite, fail-closed + réconciliation.

**SC-O13-03 (précisé)** : les **classes pré-enregistrées** doivent être **nommées explicitement** : **option B** = préinscription des **intentions d'effet métier** uniquement ; **option C (requalifiée)** = préinscription des **intentions de création de réservation Reg1** (événement 1→2, clé par `(device, epoch, opId)`) **+** intentions d'effet **+** clôtures. **Aucune propriété n'est garantie par l'adoption de l'option C** : les preuves par absence restent **conditionnées à la complétude du journal (β) et à la démonstration de l'exhaustivité des chemins d'exécution (α)**.

**SC-O13-04 (précisé)** — correspondance exacte preuve ↔ condition du cas 4 :

| Condition | Preuve requise | Classes d'événements pré-enregistrées nécessaires |
|---|---|---|
| **(a) Absence de réservation Reg1** | **absence de toute préinscription de réservation (événement 2) pour `(device, epoch, opId)`**, sous (α)+(β) démontrées ; et cohérence avec l'absence de réservation **effective** (événement 4) constatée par l'audit | **classe « intention de réservation » obligatoire** |
| **(b) Absence d'effet métier** | **absence de toute préinscription d'effet (événement 2, classe « effet »)** sous (α)+(β) ; et cohérence avec l'absence d'effet constatée (palier 1 : `cls`/reçus/A6) | **classe « intention d'effet » obligatoire** |

**La distinction entre (a) et (b) reste impérative** — jamais de substitution. **Le cas 4 reste fermé dès que l'une des deux preuves est absente, ambiguë ou invérifiable.** Les cinq états de preuve, la liaison intention↔commit (jeton), l'indisponibilité de l'autorité et la comparaison purge-aware restent inchangés.

---

## PARTIE C′ — O-4 : dépendance O-5 résolue par deux niveaux

**Contradiction levée** — O-4 se décompose en **deux niveaux** :

**A. Stabilisation architecturale d'O-4** — **clôble sans les valeurs numériques** :
- catégories d'artefacts (SC-O4-01, sans chiffres) ; principes de conservation (heads permanents pendant l'epoch ouverte — A-8 ; post-clôture **longue [RECOMMANDÉ]** ; journal **permanent [RECOMMANDÉ]** ; historique de purge **indépendant du périmètre restauré [RECOMMANDÉ]** — SC-O4-03) ; **conditions cumulatives de purge** (clôture + durée + **preuve-équivalence P2** + audit stable + complétude du journal — SC-O4-02) ; preuves nécessaires avant purge (SC-O4-05) ; règles d'exclusion des appareils (SC-O4-04 — RECO (c) acquise, modalités **structurelles** : exclusion, purge conservatrice/réconciliation, réintégration non décroissante) ; conséquences d'une preuve absente ou incohérente (SC-O4-03/06) ; purge physique **avec enregistrement de purge durable**.

**B. Finalisation opérationnelle** — **reste ouverte jusqu'à O-5 et aux démonstrations** :
- **valeurs numériques de durées** (tous artefacts) ; capacités physiques par adaptateur ; validations correspondantes ; seuil opérationnel d'application de `STALE_DEVICE_MS` (mesure, moment du contrôle) ; rétention chiffrée du journal et de l'historique de purge.

**Statut de clôture** : le **niveau A** peut être **arbitré et clos** indépendamment d'O-5 ; le **niveau B** reste **[OUVERT]** jusqu'à sa résolution — **O-4 n'est pas prêt pour une purge effective tant que le niveau B n'est pas établi**. **Aucune valeur existante (dont `STALE_DEVICE_MS`) n'est transformée en règle universelle.** P2 reste **condition indépendante et nécessaire** aux deux niveaux ; clôture, audit J4 ou journal externe ne la remplacent jamais.

**Dans le registre** : O-5 reste **reportable** (F.9) — il ne conditionne que le **niveau B**, plus la clôture architecturale ; la contradiction F.2/F.9/F.10 est ainsi levée.

---

## PARTIE D′ — O-2 (inchangé) et PARTIE E′ — sources (inchangées)

**O-2** : **[BLOQUÉ — source ARB-07]** pour son arbitrage final ; grille SC-O2-01…05 provisoire, **aucune propriété de `opId` transposée automatiquement** ; lien O-11 (nonce à travers une rotation) désormais traité **sur la base d'un O-11 décidé** (un nonce ne contourne jamais `refusal_epoch_closed`). **Avant L3.**

**Sources (DC-2, DC-8, O-8)** : inchangées — SCH-1…9/L2.2, cinq situations A-12, P4/G1–G5 **introuvables sur le disque** ; ce qui manque précisément et les conséquences sur les lots sont inchangés ; **une seule autorisation d'archives, quatre retranscriptions distinctes, non rédigées sans autorisation explicite** ; **GO L2 bloqué par DC-2 et DC-8** ; O-8 **[BLOQUÉ — source]**.

---

## PARTIE F′ — Synthèse globale corrigée

**F.1 Arbitrages déjà validés** : A-1…A-12, ARB-01/02, D6 strict, B22-07, I-1…I-18, C-1…C-9, tableau des comportements, DC-1…DC-14 (compléments DC-2/DC-5/DC-8 ouverts sur sources), **R-7a, O-12, RECO (a)(b)(c), budget 3/4, et désormais O-11 (SC-O11-01…04, 06…09 + I-19)**.

**F.2 Arbitrages restant à effectuer** : **O-3 (SC-O3-01…05)** — immédiat ; **O-13 (SC-O13-01…05)** — palier 1 immédiat, palier 2 après O-3 ; **O-4 niveau A** — immédiat après O-3 ; **O-4 niveau B** — après O-5 + démonstrations ; **O-2 (SC-O2-01…05)** — final après ARB-07 ; **DC-2 (champs + R-7b + déclarations DC-5)** et **DC-8** — après retranscription.

**F.3 Dépendances** : O-11 **[DÉCIDÉ]** → O-3 (clôtures journalisées), activation O-12 débloquée (décisionnel) ; O-3 → O-13 (palier 2) et O-4 (finalisation) ; O-13 ↔ O-4 (rétention du journal, comparaison purge-aware, preuves (a)/(b)) ; O-4 niveau B ← O-5 ; O-2 ← ARB-07 + O-11 ; DC-8 ↔ taxonomie (O-12) ; codes de refus éventuels en coordination, jamais implicites.

**F.4 Blocages documentaires** : quatre sources — **une autorisation d'archives, quatre retranscriptions distinctes**.

**F.5 Garanties à démontrer** **[À DÉMONTRER]** : inchangées ((α)(β), liaisons, correspondances purge, résurrections, preuves (a)/(b), injectivité sur domaine défini, déterminisme, parité adaptateurs, coûts 3/4 réels, nonce, ligne 9, résistances J4/C-D1…C-D8, PostgreSQL [N2]) — **plus la démonstration par adaptateur de l'atomicité/sérialisation de rotation désormais arbitrée**.

**F.6 Travaux d'implémentation** (tous non autorisés) : L1 (fige DT-01 au GO), L2 (prepare), L3 (ACK/abandon, nonce, DC-7-bis), L4 (sync, liveness), L5 (démonstrations J4, C-D1…C-D8).

**F.7 Campagnes de tests et critères d'acceptation** : inchangés (tests de contrat, scénarios fail-closed, propriétés de canonicalisation, deux projets Vitest, `npm run check` vert, démonstrations F.5 passées, DT-01 respectée).

**F.8 Dettes et limitations** : DT-01…DT-08 inchangées ; limitations inchangées (ligne 9 désormais exerçable dès implémentation ; preuves d'absence conditionnelles ; J4/PostgreSQL [N2]).

**F.9 Sujets reportables** : O-5 (niveau B d'O-4 seulement), O-6, O-7, O-9, DC-7-bis (avant L3), P3, extension option C si B retenue.

**F.10 Trois clôtures distinctes — conditions objectives** :
1. **Clôture architecturale** : décisions structurantes arbitrées (**y compris O-4 niveau A ; les valeurs du niveau B peuvent être traitées dans un chantier ultérieur sans compromettre l'architecture**) ; dépendances identifiées ; **aucune ambiguïté majeure dans les contrats** ; **points techniques non démontrés explicitement recensés** (inventaire F.5).
2. **Clôture d'implémentation** : travaux **autorisés** réalisés ; contrats implémentés ; **tests correspondants passés** ; dettes et écarts traités selon les critères convenus (DT-01…DT-08).
3. **Validation technique finale** : démonstrations de sécurité et de cohérence réalisées ; scénarios fail-closed validés ; **parité des adaptateurs concernés démontrée** ; **preuves de restauration et de purge vérifiées** ; **aucune garantie déclarée acquise sans résultat technique correspondant [TESTÉ]**.

**Prérequis du lot actuel vs évolutions reportables** : le lot de synchronisation exige les clôtures 1 et 2 (architecturale + implémentation) et **la validation technique des éléments de son périmètre** ; les évolutions reportables (F.9) n'en font pas partie.

---

## Feuille de route actualisée (respect des dépendances)

1. **Immédiat, sans source** : arbitrage **O-3 (SC-O3-01…05)** ; arbitrage **O-13 palier 1 (SC-O13-01/02)** ; arbitrage **O-4 niveau A (SC-O4-01…06, structurel)** — dans cet ordre (O-13 palier 2 et SC-O4-02/03 complets suivent O-3) ;
2. **Immédiat, en parallèle** : O-2 provisoire tenu à jour ; registre des sources préparé ;
3. **Autorisation d'archives** → retranscriptions (L2.2, A-12, ARB-07, P4/G1–G5) → **DC-2 (avec R-7b), DC-8, O-2 final, O-8** → **GO L2** ;
4. **Au GO L1** (instruction distincte) : fige DT-01 ;
5. **Après GO L2** : L2→L3→L4 (autorisations distinctes), puis L5 (démonstrations) → **clôture d'implémentation** → **validation technique finale**.

**Contrôles** : O-11 au statut **[DÉCIDÉ — ARBITRAGE UTILISATEUR]**, démonstrations restées [À DÉMONTRER] ✓ · cinq événements Reg1 distingués, préinscription ≠ création ≠ commit, options B/C conditionnelles à (α)+(β) ✓ · O-4 scindé niveau A (clôturable sans O-5) / niveau B (ouvert) ✓ · trois clôtures redéfinies, prérequis du lot ≠ évolutions reportables ✓ · O-3/O-13/O-4/O-2/DC-2/DC-8/O-8 statuts inchangés ✓ · décisions antérieures préservées ✓ · **aucune garantie déclarée acquise sans démonstration ; contradiction introduite : aucune détectée.** Livré exclusivement dans cette réponse — **aucune intervention sur le dépôt ; aucun GO ne découle de ce rapport.**

# Correction ciblée — séparation des prérequis par lot (F.2, F.3, F.6, feuille de route)
**Exclusivement documentaire — aucun code, test, mesure, fichier, opération Git, ni démarrage de lot. Aucun GO implicite.**

*Cette correction **remplace** les sections F.2, F.3, F.6 et la feuille de route du rapport de référence ; tout le reste est conservé tel quel.*

---

## F.2 (corrigé) — Arbitrages restant à effectuer, par lot et par type de prérequis

**Trois types de prérequis, jamais mélangés** : **documentaires** (sources à récupérer) · **architecturaux** (décisions/arbitrages à rendre) · **opérationnels** (fige de baseline, autorisations d'exécution, valeurs).

| Lot / sujet | Prérequis **documentaires** | Prérequis **architecturaux** | Prérequis **opérationnels** |
|---|---|---|---|
| **L1** | **Aucun** — tous les arbitrages d'identifiants et de contrats sont rendus (A-1…A-12, canon-prepare-v1, Session A) | contrats spécifiés, aucune ambiguïté majeure | **fige DT-01 à son GO** (`typecheck` du projet, sortie verbatim) ; **instruction de GO** (autorisation distincte) ; correction des 8 erreurs = intervention séparée |
| **L2** | **DC-2 complet** (SCH-1…9) et **DC-8** (cinq situations A-12) — **les deux seuls bloqueurs documentaires** | **contrats `canon-prepare-v1` stabilisés** — **acquis** (DC-1…DC-14, O-11 décidé) ; scénarios fail-closed définis | GO L1 réalisé (L1 précède L2) ; autorisations d'exécution ; baseline DT-01 en place |
| **L3** | **ARB-07** (récupération + analyse) pour la finalisation d'**O-2** | **O-2 finalisé** ; pipeline ACK/abandon consolidé ; **DC-7-bis** arbitré ; consommation A6 ; coordination taxonomie (codes éventuels) | autorisation du lot |
| **O-8** | **P4/G1–G5** (récupération ou constat de reformulation) | **périmètre d'O-8 à déterminer** — inde déterminable avant la source | — |
| **L6 / L7** | — | **O-3 arbitré** → **O-13 (palier 2) arbitré** ; **O-4 niveau A arbitré** | **O-4 niveau B** (valeurs, après **O-5**) ; démonstrations L5 |

**O-11** : **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** — n'apparaît plus comme arbitrage restant.

## F.3 (corrigé) — Dépendances entre mécanismes

- **L1 → L2** : séquence d'exécution (L1 précède L2) — **aucune dépendance documentaire de L2 vers L1** au-delà de la baseline.
- **L2** : dépend **uniquement** de DC-2 + DC-8 (documentaire) et des contrats canon-prepare-v1 (architectural, **acquis**). **O-2 et O-8 ne sont pas prérequis de L2** : aucune dépendance directe démontrée — le nonce relève du domaine ACK/session (consommé à L3 selon ARB-07) et le périmètre d'O-8 (P4/G1–G5) n'est pas connecté au chemin `prepare` ; **aucun blocage artificiel n'est ajouté**.
- **L3** : dépend d'**O-2 final** (documentaire ARB-07 + arbitrage), du pipeline ACK/abandon et de **DC-7-bis** (architecturaux).
- **O-3** → **O-13 (palier 2)** et **O-4 (finalisation)** : inchangé ; O-11 **[DÉCIDÉ]** débloque décisionnellement O-3, O-4 et l'activation d'O-12.
- **O-4** : niveau A indépendant d'**O-5** ; niveau B ← O-5 ; cohérence avec O-13 (rétention du journal, comparaison purge-aware).
- **Taxonomie** : tout code de refus nouveau (indisponibilité, rejeu) en coordination avec DC-8/O-12, jamais implicite.

## F.6 (corrigé) — Travaux d'implémentation, avec prérequis par lot

| Lot | Prérequis **documentaires** | Prérequis **architecturaux** | Prérequis **opérationnels** |
|---|---|---|---|
| **L1** | aucun | contrats prêts | GO + fige DT-01 |
| **L2** | DC-2, DC-8 | canon-prepare-v1 stabilisé (**acquis**) | L1 réalisé ; autorisation |
| **L3** | ARB-07 | O-2 final, pipeline ACK/abandon, DC-7-bis | autorisation |
| **L4** | — | sync/liveness contrats (I-14) | L3 réalisé ; autorisation |
| **L5** | — | périmètres de démonstration figés | implémentations réalisées ; exécution des démonstrations |
| **O-8** | P4/G1–G5 | périmètre à déterminer **après source** | — |

## Feuille de route finale (corrigée)

1. **Immédiat, sans source** : arbitrage **O-3 (SC-O3-01…05)** ; **O-13 palier 1 (SC-O13-01/02)** ; **O-4 niveau A (SC-O4-01…06, structurel)** — dans cet ordre (palier 2 et SC-O4-02/03 complets suivent O-3) ;
2. **En parallèle, indépendant** : O-2 provisoire tenu à jour ; **O-8 : récupération P4/G1–G5, détermination de son périmètre — sans statut de blocage pour L2 par défaut** ;
3. **Autorisation d'archives** → retranscriptions (L2.2, A-12, ARB-07, P4/G1–G5) → **DC-2 (avec R-7b) et DC-8** (débloquent **L2**) ; **ARB-07** → **O-2 final** (prérequis **L3**) ;
4. **GO L1** (instruction distincte) + fige DT-01 → exécution L1 → **GO L2** (dès DC-2/DC-8 arbitrés) ;
5. **L3** après O-2 final + pipeline consolidé → **L4** → **L5** (démonstrations) → clôture d'implémentation → validation technique finale.

**Contrôles** : prérequis documentaires/architecturaux/opérationnels distingués par lot ✓ · L2 limité à DC-2 + DC-8 + contrats acquis, **sans O-2 ni O-8** ✓ · L1 précède L2, DT-01 figé à son GO ✓ · L3 prérequis explicités (O-2/ARB-07, ACK/abandon, DC-7-bis) ✓ · **O-8 non déclaré bloquant L2 par défaut** — périmètre à déterminer après source ✓ · aucune décision rouverte, contradiction introduite : aucune ✓. Livré exclusivement dans cette réponse — **aucune intervention sur le dépôt ; aucun GO ne découle de cette correction.**

Le rapport corrigé est prêt à servir de **référence de pilotage**. La prochaine étape immédiate est l'**arbitrage O-3 (SC-O3-01…05)** — la fiche est consolidée et prête dans la Partie A du rapport ; les autres chantiers n'attendent plus rien.

Après analyse de la fiche O-3 et de ses dépendances, je valide les recommandations d'arbitrage suivantes.

### 1. SC-O3-01 — Autorité externe

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

J'accepte le principe d'un journal témoin append-only indépendant du périmètre de restauration du magasin principal.

Ses fonctions doivent couvrir :
- les preuves positives liées aux commits ;
- la préinscription des opérations protégées avant leurs effets ;
- la détection des divergences après restauration ;
- la conservation des événements de clôture nécessaires à la vérification des epochs.

L'ancrage cryptographique reste un complément et non un substitut à cette autorité.

Précision : cette décision porte sur le principe d'indépendance et les garanties attendues. Elle ne choisit pas encore le fournisseur, le stockage ou l'architecture physique.

Il faut également tenir compte des contraintes de coût du projet. Les opérations nécessitant une preuve d'absence doivent utiliser cette autorité, sans imposer automatiquement son utilisation à toutes les opérations ordinaires qui n'en dépendent pas.

### 2. SC-O3-02 — Régime des preuves

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

J'accepte les cinq états de preuve et leurs conséquences :

1. Aucune préinscription : l'absence ne peut être prouvée que si l'exhaustivité des chemins et la complétude du journal sont démontrées.
2. Préinscription sans effet confirmé : ne prouve pas l'effet et interdit une réexécution automatique.
3. Effet réalisé sans achèvement confirmé : état indéterminé.
4. Préinscription et achèvement liés de manière vérifiable au commit : preuve positive.
5. Incohérence ou preuve inexploitable : fail-closed et réconciliation.

Je confirme également les distinctions suivantes :
- preuve historique et présence actuelle ;
- purge légitime et divergence ;
- intention et exécution effective ;
- réservation Reg1 et effet métier.

La comparaison avec l'état restauré devra tenir compte des purges légitimes, conformément aux règles O-4/P2.

### 3. SC-O3-03 — Indisponibilité de l'autorité

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

J'accepte le refus des opérations protégées lorsque l'autorité est indisponible.

Aucun mode dégradé, best-effort ou contournement asynchrone ne doit permettre de produire un effet sans la préinscription obligatoire.

La distinction entre refus temporaire et refus métier définitif doit être conservée.

Aucun nouveau code de refus ne doit être introduit implicitement : toute évolution de la taxonomie doit être arbitrée.

### 4. SC-O3-04 — Complétude et cohérence

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

J'accepte que la complétude du journal constitue une condition obligatoire de toute preuve d'absence.

L'append-only ne suffit pas à démontrer cette complétude.

Il faudra démontrer :
- que tous les chemins concernés passent obligatoirement par la préinscription ;
- que les événements attendus ne peuvent pas être omis ;
- que le journal est durable et cohérent ;
- que ses propres divergences peuvent être détectées ;
- que la liaison entre intention, événement et commit est vérifiable.

Tant que ces propriétés ne sont pas démontrées, l'absence d'une trace ne constitue jamais une preuve d'absence.

Toutes ces propriétés restent [À DÉMONTRER].

### 5. SC-O3-05 — Périmètre epochs × devices

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

J'accepte le périmètre logique account-wide recommandé pour maintenir la cohérence des epochs et des appareils d'un même compte.

Cette décision ne signifie pas qu'un stockage physique monolithique est obligatoire.

Le déclenchement d'une rotation par un appareil seul reste soumis aux décisions dépendant d'ARB-07.

### 6. Conditions de clôture d'O-3

Je considère les cinq arbitrages SC-O3-01 à SC-O3-05 comme acceptés au niveau architectural.

En revanche :
- aucune garantie de complétude n'est considérée comme démontrée ;
- aucune atomicité entre magasins distincts n'est présumée ;
- les mécanismes de liaison intention/commit restent à démontrer ;
- la durabilité après restauration reste à démontrer ;
- les modalités de rétention du journal restent liées à O-4/P2 ;
- aucune implémentation ni aucun test n'est autorisé par ces arbitrages.

Merci de mettre à jour le registre des décisions et le dossier O-3, puis de préparer l'arbitrage consolidé suivant : O-13, en intégrant les décisions désormais prises sur O-3.

Cette demande est exclusivement documentaire. Aucun code, test, mesure, fichier du projet, opération Git ou démarrage de lot n'est autorisé.