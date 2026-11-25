# Arbitrages utilisateur enregistrés — textes de décision verbatim

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 4253–4349, 4448–4519, 4600–4712 et
> 7029–7225 du fichier source). Textes de décision du chef : O-3 (SC-O3-01…05) ; O-13
> (SC-O13-01…05, avec la correction de SC-O13-04 demandée par le chef) ; O-4 niveau A
> (SC-O4-A01…A06) ; DC-2 (DC2-A01…A05) et DC-8 (DC8-A01…A08, avec les sujets volontairement non
> arbitrés). Aucun statut modifié, aucune complétion, aucune retranscription de source
> inaccessible. Le vocabulaire (base, SDK, termes conversationnels) reste celui des fiches
> d'origine — aucune norme de nommage du projet n'est appliquée rétroactivement.

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


---

**1. SC-O13-01 — Natures de preuve : ACCEPTÉ**

Je confirme la séparation stricte entre :
- preuve positive : un effet a été appliqué ; elle interdit sa réexécution ;
- preuve négative : aucun effet n'a été appliqué ; elle peut contribuer à ouvrir le cas 4 uniquement si l'exhaustivité des chemins et la complétude/cohérence du journal témoin sont démontrées.

Aucune substitution entre ces deux natures de preuve.

**2. SC-O13-02 — Périmètre du palier 1 : ACCEPTÉ**

Le palier 1 fournit exclusivement des preuves positives à partir des enregistrements présents et cohérents dans le périmètre restauré.

L'absence d'un reçu, d'un enregistrement A6 ou d'un index dans ce périmètre ne constitue jamais une preuve d'absence d'effet ou de réservation.

Aucune résistance à la restauration ne doit être présumée pour les preuves internes au magasin principal.

**3. SC-O13-03 — Classes pré-enregistrées : OPTION C RESTREINTE ACCEPTÉE**

Je retiens l'option C dans son périmètre minimal :
- préinscription des intentions de création de réservation Reg1, pour pouvoir établir la condition (a) ;
- préinscription des intentions d'effet métier protégées, pour pouvoir établir la condition (b).

Les opérations ordinaires qui ne nécessitent pas ces preuves restent hors de ce mécanisme, conformément à la contrainte de coût.

Cette décision ne signifie pas que les preuves sont déjà garanties : l'exhaustivité des chemins, la complétude du journal et la liaison vérifiable avec les commits restent à démontrer.

Je confirme également la distinction des cinq événements Reg1. Aucun ne doit être assimilé automatiquement à un autre. Une interruption entre préinscription et commit reste indéterminée lorsque les preuves disponibles ne permettent pas de conclure.

**4. SC-O13-04 — Conditions d'ouverture du cas 4 : ACCEPTÉ AVEC CORRECTION**

Je valide les six conditions et le principe de double preuve obligatoire (a) ET (b), pour la même identité logique `(device, epoch, opId)`.

Je demande toutefois de corriger la formulation de la condition 4 :

La preuve (b) doit établir l'absence de préinscription d'effet métier dans l'autorité externe, sous réserve de l'exhaustivité des chemins et de la complétude/cohérence démontrées du journal. Le périmètre restauré peut être examiné pour rechercher une éventuelle preuve positive contradictoire, mais son absence ne constitue jamais une preuve d'absence d'effet.

Il faut donc distinguer :
- l'absence de préinscription externe vérifiable, qui peut contribuer à établir la preuve négative ;
- l'absence d'une trace dans le magasin restauré, qui ne prouve rien à elle seule ;
- la présence d'une preuve positive contradictoire, qui interdit l'ouverture du cas 4.

Si l'une des deux preuves (a) ou (b) est absente, ambiguë, incomplète ou invérifiable, le cas 4 reste fermé : fail-closed et réconciliation.

Je confirme également les interdictions relatives à la réutilisation d'opId, au transfert d'intention, à l'utilisation d'un ordinal déjà distribué et à toute assimilation entre intention, réservation effective et commit confirmé.

**5. SC-O13-05 — Indisponibilité et divergence : ACCEPTÉ**

L'autorité externe indisponible entraîne le refus des opérations protégées concernées. Aucun mode dégradé, best-effort ou contournement asynchrone ne doit permettre de produire un effet sans préinscription obligatoire.

Toute divergence, preuve inexploitable ou liaison invérifiable entraîne fail-closed et réconciliation.

Aucun nouveau code de refus ne doit être introduit sans arbitrage explicite et coordination avec la taxonomie existante.

**6. Statut et limites de l'arbitrage**

Les points SC-O13-01 à SC-O13-05 passent en :

`[DÉCIDÉ — ARBITRAGE UTILISATEUR]`

La clôture architecturale d'O-13 pourra être enregistrée après intégration de ces décisions et de la correction de SC-O13-04.

En revanche :
- les garanties d'exhaustivité et de complétude restent `[À DÉMONTRER]` ;
- les liaisons intention/préinscription/événement/commit restent `[À DÉMONTRER]` ;
- la résistance à la restauration reste `[À DÉMONTRER]` ;
- la cohérence avec la rétention et l'historique de purge reste dépendante d'O-4/P2 ;
- le cas 4 ne pourra pas être utilisé en production avant les démonstrations requises.

Aucune implémentation, aucun test, aucune mesure, aucune modification du projet ou opération Git n'est autorisé par cet arbitrage.

Après intégration, nous pourrons passer à l'arbitrage O-4 : niveau A architectural immédiatement, puis niveau B opérationnel après O-5.


---

Après analyse de la fiche O-4, je valide les recommandations des six points du niveau A, avec les précisions suivantes.

### 1. SC-O4-A01 — Artefacts et principes de conservation : ACCEPTÉ AVEC PRÉCISIONS

Je valide la grille des artefacts et les principes de conservation suivants :

- **Reg1** : conservation après clôture selon les conditions de purge et les durées qui seront arbitrées au niveau B.
- **Refs, `cls` et reçus** : conservation tant qu'ils sont nécessaires à la consommation, à la vérification des preuves ou au calcul du `confirmedPrefix`. La compaction des reçus nécessaires au `confirmedPrefix` reste interdite conformément à M3, tant qu'une preuve équivalente n'a pas été conçue et démontrée.
- **Claims** : conservation selon les besoins de vérification du cycle de vie des appareils et des opérations qui en dépendent.
- **Heads** : conservation permanente pendant l'epoch ouverte, conformément à A-8. Après clôture, conservation suffisamment longue pour les besoins de vérification et de réconciliation ; durée à arbitrer au niveau B.
- **Enregistrements de clôture** : conservation aussi longtemps qu'ils sont nécessaires à la vérification de l'historique des epochs et des opérations qui y sont rattachées.
- **Journal témoin** : conservation des événements nécessaires aux preuves positives, négatives, aux clôtures et aux vérifications de restauration. Sa suppression ne doit jamais rendre possible une fausse preuve d'absence.
- **Historique de purge** : conservation dans un périmètre indépendant de la restauration du magasin principal, aussi longtemps que nécessaire pour expliquer les suppressions et détecter les résurrections.

Précision importante : les expressions « conservation longue » et « permanente » désignent ici des obligations fonctionnelles de conservation, pas des durées chiffrées ni une décision de conservation éternelle de tous les enregistrements.

Les durées et modalités physiques restent à arbitrer au niveau B, en tenant compte d'O-5 et des contraintes de coût.

### 2. SC-O4-A02 — Conditions cumulatives de purge post-clôture : ACCEPTÉ

Je confirme les conditions cumulatives suivantes :

1. L'epoch doit être effectivement et définitivement clôturée, conformément à O-11.
2. La durée de conservation applicable doit être écoulée ; sa valeur sera définie au niveau B.
3. La condition P2 doit être satisfaite indépendamment. Elle ne peut être remplacée ni par la clôture, ni par J4, ni par le journal témoin.
4. L'audit J4 requis doit être stable et concluant : P+A avant toute purge concernée, conformément à M1/M3.
5. Lorsque la purge dépend de preuves fournies par le journal témoin, sa complétude, sa cohérence et les liaisons nécessaires doivent être démontrées.
6. La purge doit être autoritaire, traçable et vérifiable.

Une simple expiration technique, un TTL ou une suppression déclenchée uniquement par l'âge d'un document ne constitue jamais une autorisation suffisante de purge.

En cas de preuve insuffisante, d'audit instable ou de résultat indéterminé : aucune purge ; fail-closed et réconciliation.

### 3. SC-O4-A03 — Purge physique et durabilité de l'historique : OPTION « SUPPRESSION DURE + HISTORIQUE DURABLE INDÉPENDANT » ACCEPTÉE

Je retiens la suppression physique des artefacts lorsque toutes les conditions de purge sont satisfaites, avec un enregistrement durable et vérifiable de la purge dans un périmètre indépendant de celui du magasin principal.

Je ne retiens pas la suppression dure sans trace.

Le tombstone reste une variante technique possible si un adaptateur ou une contrainte de stockage le justifie, mais il ne constitue pas une obligation architecturale universelle.

Précisions :
- Un historique conservé uniquement dans le même périmètre restaurable que les données supprimées ne fournit pas une indépendance suffisante contre une restauration cohérente.
- L'autorité indépendante doit permettre de distinguer une purge légitime d'une disparition inexpliquée.
- Une intention de purge ne doit jamais être assimilée à une purge effectivement terminée.
- En l'absence de confirmation durable et vérifiable, l'état de la purge reste indéterminé.
- Aucune atomicité inter-magasins n'est présumée.
- Une divergence ou un historique absent, incomplet ou inexploitable entraîne fail-closed et réconciliation.

La séquence technique garantissant ces propriétés restera à concevoir et à démontrer. Aucun mécanisme transactionnel inter-magasins n'est décidé implicitement ici.

### 4. SC-O4-A04 — Couverture des appareils : ACCEPTÉ

Je confirme la décision déjà arbitrée :

**Les appareils dont la liveness est insuffisante sont exclus de la couverture de purge.**

Je valide également les principes structurels :
- conserver la couverture des appareils dont la liveness est suffisamment fiable ;
- ne jamais rendre la purge moins sûre pour compenser l'absence de preuve ;
- privilégier une purge conservatrice ou une réconciliation lorsque la couverture est insuffisante ;
- permettre la réintégration d'un appareil après retour d'une liveness fiable, sans régression de la couverture déjà acquise.

Le seuil, le moment du contrôle et le périmètre précis d'application de `STALE_DEVICE_MS = 83 jours` restent à définir au niveau B. Cette valeur ne devient pas une règle universelle par le présent arbitrage.

### 5. SC-O4-A05 — Preuves nécessaires avant purge : ACCEPTÉ

Je valide une grille de preuves conditionnelle par catégorie d'artefact.

Avant chaque purge, les preuves nécessaires doivent permettre de vérifier, selon le cas :
- la clôture effective de l'epoch ;
- l'écoulement de la durée de conservation applicable ;
- la satisfaction indépendante de P2 ;
- la stabilité et la validité de l'audit J4 requis ;
- la couverture des appareils admissibles ;
- la cohérence entre journal témoin, état courant et historique de purge ;
- la justification de la suppression de chaque catégorie d'artefact.

Aucune règle globale simplifiée ne doit remplacer cette vérification par artefact.

La présence d'un audit J4 ou d'un enregistrement de purge ne suffit jamais, à elle seule, à autoriser une suppression.

### 6. SC-O4-A06 — Résurrection après restauration : ACCEPTÉ

Je confirme les règles suivantes :

- Une purge effectivement réalisée et vérifiable dans l'historique indépendant explique la disparition de l'artefact concerné ; elle ne constitue pas en elle-même une anomalie.
- Une restauration antérieure à une purge déjà confirmée peut réintroduire des artefacts qui ne devraient plus être présents. Cette situation constitue une divergence à détecter.
- Les artefacts qui auraient dû être conservés, mais qui sont absents sans justification vérifiable, constituent également une divergence.
- Une divergence entraîne fail-closed et réconciliation avant toute reprise des opérations qui dépendent des preuves concernées.
- Aucune résurrection ne doit être considérée comme légitime au seul motif que l'artefact est présent dans un magasin restauré.
- La comparaison doit tenir compte des règles de conservation effectivement arbitrées, de l'historique indépendant des purges et des preuves de clôture.

Les mécanismes concrets de détection, de réconciliation et de résistance à la restauration restent à démontrer.

### 7. Statut et clôture du niveau A

Je confirme les six arbitrages :

`SC-O4-A01…A06 : [DÉCIDÉ — ARBITRAGE UTILISATEUR]`

Le niveau A pourra être déclaré en clôture architecturale après intégration de ces décisions et vérification de leur cohérence avec :
- DC-13, notamment le retrait de `cpv` couplé à la rétention des entrées Reg1 ;
- P2 et M3, sans affaiblissement de la conservation des preuves nécessaires au `confirmedPrefix` ;
- A3 et les exigences de restauration L2.5 ;
- O-3 et O-13, notamment l'indépendance du journal témoin et la distinction entre preuve positive et preuve négative.

Le niveau B reste ouvert et dépend d'O-5 et des démonstrations nécessaires. Il devra notamment fixer les durées, les seuils opérationnels, les capacités physiques et la validation par adaptateur.

**Limite impérative :** la clôture architecturale du niveau A ne constitue ni une autorisation de purge, ni une autorisation d'implémentation ou de test. Aucune purge effective ne sera considérée comme autorisée tant que le niveau B et les validations techniques requises ne seront pas établis.

Aucune implémentation, aucun test, aucune mesure, aucune modification du projet, aucune opération Git et aucun démarrage de lot ne sont autorisés par cet arbitrage.


---

# 1. DC-2 — Arbitrages acceptés

### DC2-A01 — Matrice des champs
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

J'accepte le principe de la matrice proposée, avec les précisions suivantes :

- `device` : obligatoire.
- `epoch` : obligatoire, mais sa valeur de référence est déterminée et contrôlée par le serveur à partir de l'état du compte authentifié. Le client ne peut pas imposer arbitrairement l'epoch active.
- `opId` : obligatoire, conformément à A-5 :
  - CSPRNG avec au moins 128 bits d'entropie ;
  - Base64URL sans padding ;
  - persistance locale dès la création de l'intention, avant transmission ;
  - même `opId` pour les retries d'une même intention ;
  - identité `(device, epoch, opId)`.
- `token`, `usageTag` et `consumer` : conserver les obligations définies par A-3/A-6 et la matrice. Ne pas inventer de nouvelles contraintes.
- Digest fourni par le client : interdit. Le digest est calculé par le serveur.
- Payload métier : présent dès la v1, avec une projection minimale et explicite à finaliser avant implémentation.
- Champs inconnus : rejetés.
- `null` explicite : interdit conformément à DC-3 ; l'omission reste la représentation de l'absence.

Les métadonnées de transport, métadonnées serveur et documents persistés ne font pas partie du domaine canonique du payload métier.

### DC2-A02 — R-7b
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Je choisis l'option α :

Le digest est calculé à partir du payload métier canonique uniquement, avec SHA-256 puis encodage Base64URL sans padding, conformément à R-7a.

L'identité `(device, epoch, opId)` est vérifiée séparément. Il n'est donc pas nécessaire de la réintroduire dans le digest.

Attention : la liste exacte des champs du payload et les octets d'entrée doivent être explicitement définis dans la projection DC-2 avant implémentation. Ne pas les déduire ou les inventer.

R-9 reste `[RECOMMANDÉ]`, et ne devient pas une décision du seul fait de cet arbitrage.

### DC2-A03 — Payload métier v1
[ DÉCIDÉ — PRINCIPE ]

Je décide que le payload métier doit exister dès la v1 afin de permettre une véritable vérification d'équivalence des intentions.

Sa projection exacte reste à formaliser à partir du schéma disponible. Elle doit rester minimale et ne contenir que les informations nécessaires à l'intention protégée.

Aucune implémentation ne doit commencer sur la base d'une projection supposée.

### DC2-A04 — Provenance de l'epoch
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Le serveur est l'autorité pour déterminer l'epoch active du compte.

Il doit vérifier que l'intention appartient à l'epoch concernée. Une intention créée dans une ancienne epoch ne doit jamais être réinterprétée dans une nouvelle epoch.

Cette règle est cohérente avec O-11 et O-13.

### DC2-A05 — Plafond numérique A-4
[ DÉCIDÉ — PRÉCISION DE PORTÉE ]

Le plafond `10^15` et les contraintes d'entier exact sont conservés pour le champ auquel A-4 s'applique.

Ne pas étendre automatiquement cette limite à `epoch`, `ordinal` ou à d'autres champs sans confirmation documentaire de la cible exacte.

# 2. DC-8 — Arbitrages acceptés

### DC8-A01 — Matrice des refus
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

J'accepte la matrice B.1 avec les précisions suivantes.

- D1 — Dépassement de la limite d'entrée : `refusal_cap_exceeded`.
- D2 — Structure JSON invalide : `refusal_payload_invalid`.
- D4 — Identifiant non canonique ou dépassement des limites A-6 : `refusal_id_noncanonical`.
- D5 — Champ inconnu ou digest client fourni : `refusal_payload_invalid`.
- D6a — Champ obligatoire manquant : appliquer le mapping selon la nature du champ, sans créer de code arbitraire.
- D6b — Contrainte métier non respectée : `refusal_payload_invalid` uniquement si elle relève bien des règles DC-1/DC-3/DC-4/DC-6 ; les erreurs d'identité restent soumises à A-6.
- D7 — Dépassement des limites structurelles DC-6 : `refusal_cap_exceeded`.
- D8 — Epoch définitivement fermée : `refusal_epoch_closed`.
- D9 — État indéterminé : fail-closed et réconciliation, sans nouveau code implicite.

### DC8-A02 — Champs obligatoires manquants
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

La réponse dépend de la nature du champ :

- composante d'identité manquante ou invalide : appliquer A-6 et `refusal_id_noncanonical` lorsque ce mapping est applicable ;
- champ métier obligatoire manquant : `refusal_payload_invalid` si la situation relève du contrat DC-1/DC-2 ;
- métadonnée attendue du serveur absente : traiter comme anomalie de construction ou d'état selon son origine, et non automatiquement comme une erreur client.

Si la taxonomie ne permet pas de confirmer un mapping, conserver le point ouvert plutôt que d'inventer un code.

### DC8-A03 — D11 : classification terminale opposée
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Je retiens la distinction suivante :

- erreur de requête démontrée : appliquer le refus adapté si sa sémantique est établie ;
- contradiction entre états ou documents persistés : fail-closed et réconciliation ;
- preuve insuffisante : fail-closed.

Ne pas assimiler automatiquement une incohérence de stockage à `refusal_payload_invalid`.

Cette règle est une nouvelle décision DC-8 et ne doit pas être présentée comme une récupération certaine du contenu historique A-12.

### DC8-A04 — D12 : index contenu/association incompatible
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Une incompatibilité entre index, association et documents persistés est traitée comme une incohérence d'état :

- aucune nouvelle exécution ;
- fail-closed ;
- réconciliation ;
- aucun nouveau code de refus implicite.

Il ne faut pas masquer cette situation comme une simple erreur de payload.

Cette règle est également une nouvelle décision DC-8, pas une reconstitution de la fiche A-12 manquante.

### DC8-A05 — Fingerprint différent
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Même identité `(device, epoch, opId)` avec fingerprint différent : aucune nouvelle exécution.

Par défaut, fail-closed et réconciliation tant que la situation n'est pas qualifiée.

Un refus spécifique ne peut être utilisé que si la réutilisation abusive de l'identité est effectivement établie et si le code correspondant existe dans la taxonomie validée.

### DC8-A06 — Ordinal déjà réservé
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Si un ordinal est déjà réservé et que l'état constaté révèle une incohérence, appliquer fail-closed et réconciliation.

Ne pas inventer de code spécifique. Distinguer une réservation cohérente d'une contradiction de persistance.

### DC8-A07 — Autorité externe indisponible
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

Une autorité externe nécessaire à une opération protégée étant indisponible :

- refuser temporairement l'opération ;
- aucun mode dégradé ;
- aucun contournement best-effort ;
- aucune exécution asynchrone permettant de contourner l'exigence de preuve ;
- aucune preuve négative déduite de l'indisponibilité.

Réutiliser un code existant uniquement si sa sémantique correspond effectivement. Sinon, conserver le code à arbitrer séparément.

Cette décision respecte O-3 et O-13.

### DC8-A08 — Ordre de priorité
[ DÉCIDÉ — ARBITRAGE UTILISATEUR ]

J'accepte l'ordre B.4 :

1. Limites d'entrée.
2. Parsing et structure.
3. Validation des champs et identifiants.
4. Canonisation.
5. Vérification de l'état de l'epoch.
6. Disponibilité de l'autorité externe.
7. Transaction et commit.

Règle transversale prioritaire : toute incohérence d'état détectée à n'importe quelle étape entraîne un fail-closed, indépendamment de cet ordre.

# 3. Sujets qui restent volontairement non arbitrés

Merci de conserver explicitement les points suivants :

- Unicité globale de `opId` entre devices : non décidée et non requise.
- Plafond supplémentaire de longueur de `opId` : non décidé et non requis en l'absence de contrainte technique démontrée.
- Politique générale de retry : hors périmètre DC-2/DC-8.
- R-9 : reste une recommandation.
- Codes historiques dont la sémantique exacte n'est pas retrouvée : ne pas les reconstruire par supposition.
- Détails de transcription A-3/A-6/DC-5 : conserver les décisions déjà validées sans les rouvrir. Les précisions documentaires manquantes doivent être signalées avant toute implémentation qui en dépend.
- Projection exacte des champs du payload métier : à formaliser avant implémentation.

# 4. Consignes de consolidation et limites d'autorisation

Merci de produire une fiche consolidée DC-2/DC-8 qui :

1. Intègre tous les arbitrages ci-dessus.
2. Distingue les décisions antérieures, les nouveaux arbitrages utilisateur, les recommandations conservées et les points ouverts.
3. Maintient la traçabilité avec A-3, A-4, A-5, A-6, DC-1 à DC-14, R-7a/R-7b, O-3, O-11 et O-13.
4. Identifie les éventuelles dépendances documentaires encore nécessaires avant implémentation.
5. Ne présente pas les deux fragments historiques A-12 comme une récupération complète de la fiche originale.
6. Ne transforme pas une règle de sécurité en nouveau code de refus sans arbitrage explicite.

**Important : cette validation concerne uniquement les arbitrages architecturaux et documentaires DC-2/DC-8.**

Elle ne constitue aucune autorisation :
- d'implémenter ;
- de modifier le code, les tests ou la documentation du dépôt ;
- de lancer des tests ou mesures ;
- d'effectuer des opérations Git ;
- de démarrer L1, L2, L2.5 ou un autre lot ;
- de considérer L2 comme prêt ou autorisé.

Après consolidation, présente-moi le résultat pour revue finale. Attends mon autorisation explicite avant toute autre action.