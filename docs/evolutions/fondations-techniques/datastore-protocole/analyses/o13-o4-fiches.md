# O-13 et O-4 niveau A — enregistrements d'arbitrage et stabilisations

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 4520–4867 du fichier source). Contient :
> l'enregistrement O-13 (clôture architecturale, correction SC-O13-04 intégrée), la fiche O-4
> niveau A/B, l'enregistrement O-4 niveau A (SC-O4-A01…A06), puis les deux précisions intégrées
> (obligations fonctionnelles ≠ durées chiffrées ; la récupération d'archives n'est pas un
> arbitrage automatique). Les itérations intermédiaires (versions antérieures des mêmes fiches,
> consolidations remplacées) restent dans l'historique transmis et ne sont pas dupliquées ici.
> Aucun statut modifié, aucune complétion, aucune retranscription de source inaccessible. Le
> vocabulaire (base, SDK, termes conversationnels) reste celui des fiches d'origine — aucune
> norme de nommage du projet n'est appliquée rétroactivement.


# Enregistrement de l'arbitrage O-13 + fiche d'arbitrage O-4 (niveau A immédiat, niveau B après O-5)
**Exclusivement documentaire — aucune implémentation, aucun test, aucune mesure, aucune modification du projet, aucune opération Git. Aucun GO implicite.**

*Légende inchangée. O-13 passe en **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** avec la correction de SC-O13-04 intégrée ; le dossier O-4 est préparé en **deux niveaux** : A (architectural, arbitrable immédiatement) et B (opérationnel, après O-5).*

---

## PARTIE 1 — O-13 : registre mis à jour

### 1.1 Décisions enregistrées **[DÉCIDÉ — ARBITRAGE UTILISATEUR]**

| Point | Décision |
|---|---|
| **SC-O13-01** | **Séparation stricte des deux natures de preuve** : preuve positive (un effet a été appliqué — interdit sa réexécution) / preuve négative (aucun effet appliqué — contribue à ouvrir le cas 4 **uniquement si** exhaustivité des chemins + complétude/cohérence du journal témoin sont démontrées). **Aucune substitution** |
| **SC-O13-02** | **Palier 1 = preuves positives exclusivement**, à partir des enregistrements **présents et cohérents** dans le périmètre restauré. **L'absence d'un reçu, d'un enregistrement A6 ou d'un index dans ce périmètre ne constitue jamais une preuve d'absence** (d'effet **ni** de réservation). **Aucune résistance à la restauration présumée pour les preuves internes** au magasin principal |
| **SC-O13-03** | **Option C restreinte acceptée** : préinscription des **intentions de création de réservation Reg1** (condition (a)) + préinscription des **intentions d'effet métier protégées** (condition (b)). **Les opérations ordinaires restent hors du mécanisme** (contrainte de coût, SC-O3-01). **Les preuves ne sont pas garanties par cette décision** : exhaustivité des chemins, complétude du journal, liaison vérifiable aux commits restent **[À DÉMONTRER]**. **Les cinq événements Reg1 restent distincts** — aucun assimilé à un autre ; interruption entre préinscription et commit = **indéterminée** lorsque les preuves ne permettent pas de conclure |
| **SC-O13-04** | **Six conditions d'ouverture du cas 4, double preuve obligatoire (a) ET (b)**, pour la même identité `(device, epoch, opId)` — **avec la correction demandée intégrée** (§ 1.2) |
| **SC-O13-05** | **Autorité indisponible ⇒ refus des opérations protégées concernées** ; **aucun mode dégradé, best-effort ou contournement asynchrone** ne produit un effet sans préinscription ; **toute divergence, preuve inexploitable ou liaison invérifiable ⇒ fail-closed + réconciliation** ; **aucun nouveau code de refus sans arbitrage explicite et coordination avec la taxonomie** |

### 1.2 SC-O13-04 — condition 4 corrigée (intégrée)

La preuve (b) **établit l'absence de préinscription d'effet métier dans l'autorité externe**, sous réserve de l'exhaustivité des chemins et de la complétude/cohérence démontrées du journal. **Le périmètre restauré peut être examiné pour rechercher une preuve positive contradictoire, mais son absence ne constitue jamais une preuve d'absence d'effet.** Distinction en trois situations :

| Situation | Conséquence |
|---|---|
| **Absence de préinscription externe vérifiable** | peut **contribuer** à établir la preuve négative (sous (α)+(β)) |
| **Absence d'une trace dans le magasin restauré** | **ne prouve rien à elle seule** |
| **Présence d'une preuve positive contradictoire** | **interdit l'ouverture du cas 4** |

Si l'une des deux preuves (a) ou (b) est **absente, ambiguë, incomplète ou invérifiable** ⇒ **cas 4 fermé : fail-closed et réconciliation**. **Interdictions confirmées** : réutilisation d'`opId`, transfert d'intention, usage d'un ordinal déjà distribué, **toute assimilation entre intention, réservation effective et commit confirmé**.

### 1.3 Clôture architecturale d'O-13 — enregistrée

**O-13 : clôture architecturale atteinte** après intégration des décisions et de la correction. **Explicitement non acquis** : garanties d'exhaustivité et de complétude **[À DÉMONTRER]** ; liaisons intention/préinscription/événement/commit **[À DÉMONTRER]** ; résistance à la restauration **[À DÉMONTRER]** ; cohérence avec la rétention et l'historique de purge — **dépendante d'O-4/P2** ; **le cas 4 ne sera pas utilisable en production avant les démonstrations requises**. **Aucune implémentation, test, mesure ou opération Git autorisé.**

**Effets sur les dépendances** : le chemin décisionnel **O-11 → O-3 → O-13 est désormais entièrement arbitr**é ; restent **O-4** (fiche ci-dessous), **O-2 final** (ARB-07), **DC-2/DC-8** (bloqueurs L2), **O-8** (source).

---

## PARTIE 2 — Fiche d'arbitrage O-4

**Niveau A — architectural : arbitrable immédiatement. Niveau B — opérationnel : après O-5 et démonstrations.** **P2 reste une condition indépendante et nécessaire aux deux niveaux** — une clôture d'epoch, un audit J4 ou un journal externe ne la remplacent jamais ; **M3** : P+A nécessaire au J4 avant compaction, jamais permission de compacter ; **la compaction des reçus nécessaires au `confirmedPrefix` reste interdite tant qu'une preuve équivalente n'est pas conçue et démontrée (avec A3 et la restauration L2.5)**.

### Niveau A — `SC-O4-A01…A06` **[à arbitrer — recommandations séparées des décisions]**

| Point | Proposition | Statut |
|---|---|---|
| **SC-O4-A01 — Artefacts et principes de conservation** | catégories : **Reg1** (post-clôture + conditions) ; **refs, `cls`, reçus** (liés à la consommation) ; **claims** (cycle de vie du device) ; **heads** (**permanents pendant l'epoch ouverte — A-8 [DÉCIDÉ]** ; **post-clôture : conservation longue [RECOMMANDÉ], jamais présentée comme arbitrée**) ; **enregistrements de clôture** (conservation à expliciter — [RECOMMANDÉ : longue]) ; **journal témoin** (**permanent [RECOMMANDÉ]** — sa purge détruirait l'autorité) ; **historique de purge** (**indépendant du périmètre de restauration [RECOMMANDÉ]**). **Aucune valeur numérique** | À arbitrer |
| **SC-O4-A02 — Conditions cumulatives de purge post-clôture** | (1) **clôture** (nécessaire — I-15) ; (2) durée applicable (niveau B) ; (3) **preuve-équivalence P2 — nécessaire indépendante** ; (4) **audit stable** quand applicable ; (5) **complétude/cohérence du journal démontrées** quand applicable (O-3/O-13 [DÉCIDÉ]) ; purge **autoritaire et vérifiable**, jamais par simple expiration | À arbitrer |
| **SC-O4-A03 — Purge physique et durabilité de l'historique** | suppression dure **sans trace : écartée** (divergence indétectable) ; suppression dure + **enregistrement de purge durable [RECOMMANDÉ]** ; tombstone en variante. **Trois durabilités** : historique **dans le même périmètre restauré** (garantie **limitée** — une restauration cohérente efface données et historique ensemble) ; **autorité indépendante** (purge potentiellement vérifiable, sous les autres conditions) ; **absent/incomplet/invérifiable** (**divergence ou indéterminé ⇒ fail-closed + réconciliation**). Aucune atomicité inter-magasins présumée | À arbitrer |
| **SC-O4-A04 — Couverture des devices (RECO (c) acquise)** | **exclusion des appareils à liveness insuffisante de la couverture de purge [DÉCIDÉ — ARBITRAGE UTILISATEUR]** ; principes structurels : couverture conservée pour les appareils fiables ; **purge conservatrice et/ou réconciliation — jamais moins sûre (I-14)** ; **réintégration après retour d'une liveness fiable, sans régression (I-14 non décroissante)** ; l'**application concrète du seuil** reste niveau B | À arbitrer (structure) |
| **SC-O4-A05 — Preuves nécessaires avant purge** | grille conditionnelle **par artefact** ; audit stable ; **cohérence journal/état/historique de purge (SC-O3-02 [DÉCIDÉ], purge-aware)** ; preuves de clôture ; preuve-équivalence P2 | À arbitrer |
| **SC-O4-A06 — Résurrection après restauration** | purge **enregistrée** ⇒ absence expliquée (pas une anomalie) ; restauration **antérieure à la purge** ⇒ état ⊋ attendu ⇒ **divergence ⇒ fail-closed + réconciliation** ; artefacts devant rester conservés manquants ⇒ divergence ; comparaison selon les règles de conservation effectivement décidées | À arbitrer — vérification **[À DÉMONTRER]** |

**Dépendances du niveau A** : O-11, O-3, O-13 **[DÉCIDÉ]** — toutes satisfaites ; DC-13 (retrait `cpv` couplé à la rétention — cohérence à intégrer) ; P2/M3/A3/L2.5. **Conditions de clôture du niveau A** : SC-O4-A01…A06 arbitrés + cohérence DC-13/P2 vérifiée.

### Niveau B — `SC-O4-B01…B05` **[OUVERT — après O-5 et démonstrations]**

| Point | Contenu |
|---|---|
| **SC-O4-B01** | **Valeurs numériques de durées** par artefact (Reg1, refs/`cls`/reçus, claims, heads post-clôture, enregistrements de clôture, journal, historique de purge) — arbitrées avec les **capacités physiques O-5** |
| **SC-O4-B02** | **Seuil d'insuffisance de liveness** : définition opérationnelle de l'application de `STALE_DEVICE_MS = 83 jours` [DÉCIDÉ historique] (mesure, moment du contrôle, périmètre) — **périmètre d'application à établir, pas une règle universelle** |
| **SC-O4-B03** | **Rétentions chiffrées** du journal témoin et de l'historique de purge (coût, O-5) |
| **SC-O4-B04** | **Validation par adaptateur** des opérations de purge et de leurs preuves (parité, capacité) — **[À DÉMONTRER]** |
| **SC-O4-B05** | **Vérification purge-histoire/état restauré** en conditions réelles — **[À DÉMONTRER, L5/L7]** |

**O-4 n'est pas prêt pour une purge effective tant que le niveau B n'est pas établi** — le niveau A ne vaut pas autorisation de purger.

---

## Synthèse de pilotage mise à jour

- **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** (ajouts) : **O-11, O-3 (SC-O3-01…05), O-13 (SC-O13-01…05)**.
- **Restent à arbitrer** : **O-4 niveau A (prêt, ci-dessus)** ; **O-2 final** (après ARB-07) ; **DC-2, DC-8** (après retranscription — **bloqueurs L2**) ; **O-4 niveau B** (après O-5) ; **O-8** (périmètre après source).
- **Reportables** : O-5, O-6, O-7, O-9, DC-7-bis (avant L3), P3.
- **Bloqueurs** : **L2 = DC-2 + DC-8** ; **L3 = O-2 final + pipeline ACK/abandon + DC-7-bis** ; **L6/L7 = démonstrations [À DÉMONTRER] + O-4 niveau B**.
- **Aucun statut [AUTORISÉ]/[EXÉCUTÉ]/[TESTÉ]** ; **aucune garantie déclarée acquise sans démonstration** ; **aucune intervention sur le dépôt** — livré exclusivement dans cette réponse.

**Prochaine étape immédiate** : votre arbitrage du **niveau A d'O-4 (SC-O4-A01…A06)** — la fiche est consolidée et prête ; le niveau B suivra après O-5.

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

# Enregistrement de l'arbitrage O-4 niveau A + clôture architecturale et pilotage mis à jour
**Exclusivement documentaire — aucune implémentation, aucun test, aucune mesure, aucune modification du projet, aucune opération Git, aucun démarrage de lot. Aucun GO implicite.**

---

## 1. Décisions enregistrées — `SC-O4-A01…A06 : [DÉCIDÉ — ARBITRAGE UTILISATEUR]`

| Point | Décision (précisions intégrées) |
|---|---|
| **SC-O4-A01** | **Reg1** : conservation après clôture selon conditions/durées du **niveau B** · **Refs, `cls`, reçus** : conservation tant que nécessaires à la consommation, aux preuves ou au **`confirmedPrefix`** — **compaction des reçus du `confirmedPrefix` interdite conformément à M3 tant qu'une preuve équivalente n'est pas conçue et démontrée** · **Claims** : selon les besoins de vérification du cycle de vie des appareils · **Heads** : **permanents pendant l'epoch ouverte (A-8)** ; post-clôture : conservation **suffisamment longue** pour vérification et réconciliation, durée au **niveau B** · **Enregistrements de clôture** : aussi longtemps que nécessaire à la vérification de l'historique des epochs · **Journal témoin** : conservation des événements nécessaires aux preuves positives, négatives, aux clôtures et aux vérifications de restauration — **sa suppression ne doit jamais rendre possible une fausse preuve d'absence** · **Historique de purge** : **périmètre indépendant de la restauration du magasin principal**, conservé aussi longtemps que nécessaire pour expliquer les suppressions et détecter les résurrections. **Précision intégrée** : « conservation longue » / « permanente » = **obligations fonctionnelles de conservation** — **ni durées chiffrées, ni conservation éternelle de tous les enregistrements** ; durées et modalités physiques au **niveau B** (O-5, coûts) |
| **SC-O4-A02** | **Six conditions cumulatives** : (1) epoch **effectivement et définitivement clôturée** (O-11) ; (2) durée applicable écoulée (valeur niveau B) ; (3) **P2 satisfaite indépendamment — remplaçable ni par la clôture, ni par J4, ni par le journal témoin** ; (4) **audit J4 stable et concluant — P+A avant toute purge concernée, conformément à M1/M3** ; (5) lorsque la purge dépend du journal témoin : **complétude, cohérence et liaisons démontrées** ; (6) purge **autorisitaire, traçable et vérifiable**. **Une simple expiration technique, un TTL ou une suppression déclenchée par l'âge d'un document ne constituent jamais une autorisation suffisante de purge.** Preuve insuffisante, audit instable ou résultat indéterminé ⇒ **aucune purge ; fail-closed et réconciliation** |
| **SC-O4-A03** | **Suppression dure + enregistrement durable et vérifiable de la purge dans un périmètre indépendant du magasin principal** — **suppression dure sans trace : non retenue** ; **tombstone = variante technique possible** si un adaptateur ou une contrainte le justifie, **pas d'obligation architecturale universelle**. Précisions : historique dans le seul périmètre restaurable = **indépendance insuffisante** face à une restauration cohérente ; l'autorité indépendante doit **distinguer purge légitime et disparition inexpliquée** ; **une intention de purge ≠ une purge effectivement terminée** ; sans confirmation durable et vérifiable ⇒ **état de purge indéterminé** ; **aucune atomicité inter-magasins présumée** ; divergence ou historique absent/incomplet/inexploitable ⇒ **fail-closed + réconciliation**. **La séquence technique reste à concevoir et démontrer** — aucun mécanisme transactionnel inter-magasins décidé implicitement |
| **SC-O4-A04** | **Exclusion des appareils à liveness insuffisante de la couverture de purge [DÉCIDÉ — ARBITRAGE UTILISATEUR, réconfirmée]** + principes structurels : couverture conservée pour les appareils fiables ; **jamais de purge moins sûre** ; purge conservatrice ou réconciliation en couverture insuffisante ; **réintégration sans régression de la couverture acquise**. **Seuil, moment du contrôle et périmètre d'application de `STALE_DEVICE_MS = 83 jours` : niveau B — la valeur ne devient pas une règle universelle** |
| **SC-O4-A05** | **Grille de preuves conditionnelle par catégorie d'artefact** : clôture effective ; durée écoulée ; **P2 satisfaite indépendamment** ; audit J4 stable et valide ; couverture des appareils admissibles ; **cohérence journal témoin / état courant / historique de purge** ; justification de la suppression **de chaque catégorie**. **Aucune règle globale simplifiée ne remplace cette vérification par artefact** ; **un audit J4 ou un enregistrement de purge ne suffit jamais, à lui seul, à autoriser une suppression** |
| **SC-O4-A06** | Purge réalisée et vérifiable dans l'historique indépendant ⇒ disparition **expliquée, pas une anomalie** ; restauration antérieure à une purge confirmée ⇒ **divergence à détecter** ; artefacts devant être conservés mais absents sans justification vérifiable ⇒ **divergence** ; divergence ⇒ **fail-closed + réconciliation avant toute reprise des opérations dépendant des preuves concernées** ; **aucune résurrection légitime au seul motif de la présence dans un magasin restauré** ; comparaison selon les règles arbitrées, l'historique indépendant et les preuves de clôture. **Mécanismes concrets de détection, réconciliation et résistance : à démontrer [À DÉMONTRER]** |

---

## 2. Vérification de cohérence (demandée, effectuée)

| Référence | Vérification |
|---|---|
| **DC-13** (option A : disponibilité `cpv` couplée à la rétention) | **Cohérent** — le retrait d'une implémentation `cpv` reste couplé à la rétention des entrées Reg1 ; les durées de rétention Reg1 (niveau B) détermineront les points de retrait, sans jamais laisser une entrée conservée sans implémentation disponible |
| **P2 / M3** | **Cohérent** — P2 maintenue condition **indépendante et nécessaire** (SC-O4-A02 cond. 3) ; P+A stable avant toute purge concernée (cond. 4, M1/M3) ; **conservation des reçus du `confirmedPrefix` non affaiblie** (SC-O4-A01 — compaction interdite jusqu'à preuve équivalente conçue et démontrée) |
| **A3 / exigences de restauration L2.5** | **Cohérent** — la conception de la preuve équivalente pour la compaction des reçus reste ouverte **avec A3 et la restauration L2.5** (aucune conception introduite implicitement) ; l'indépendance de l'historique de purge (SC-O4-A03) est alignée sur le principe de preuve résistante à la restauration |
| **O-3 / O-13** | **Cohérent** — indépendance du journal témoin et de l'historique de purge respectée ; distinction preuve positive / preuve négative préservée (la suppression du journal ne peut jamais créer une fausse preuve d'absence — SC-O4-A01) ; purge-aware comparison (SC-O3-02 [DÉCIDÉ]) alimentée par l'historique indépendant (SC-O4-A03) |
| **O-11 / I-15 / I-19** | **Cohérent** — clôture nécessaire, jamais suffisante ; purge après conditions cumulatives uniquement |

**Contradiction détectée : aucune.** **Clôture architecturale du niveau A d'O-4 : enregistrée.**

---

## 3. Limites et statut — rappelés tels qu'arbitrés

- **La clôture architecturale du niveau A ne constitue ni une autorisation de purge, ni une autorisation d'implémentation ou de test** ;
- **Aucune purge effective n'est considérée comme autorisée tant que le niveau B et les validations techniques requises ne sont pas établis** ;
- **Niveau B [OUVERT]** : durées chiffrées, seuil opérationnel `STALE_DEVICE_MS`, capacités physiques (**O-5**), validation par adaptateur — **[À DÉMONTRER]** ;
- Séquence technique de la purge vérifiable, détection de résurrection, résistance à la restauration : **[À DÉMONTRER]** ;
- **Aucun statut [AUTORISÉ]/[EXÉCUTÉ]/[TESTÉ]** ; aucune intervention sur le dépôt.

---

## 4. Pilotage mis à jour

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]** (cumul) : A-1…A-12 · I-1…I-18 (+I-19) · C-1…C-9 · DC-1…DC-14 (compléments DC-2/DC-5/DC-8 sur sources) · **R-7a, O-12, RECO (a)(b)(c), O-11, O-3 (SC-O3-01…05), O-13 (SC-O13-01…05), O-4 niveau A (SC-O4-A01…A06)** · budget 3/4 (démonstration [À DÉMONTRER]).

**Restent à arbitrer** :
1. **O-4 niveau B** — **[OUVERT]**, après **O-5** (capacités physiques) et démonstrations ;
2. **O-2 final** — **[BLOQUÉ — source ARB-07]** ;
3. **DC-2 (champs + R-7b + déclarations DC-5)** et **DC-8 (couverture)** — **[BLOQUÉ — sources SCH-1…9 / A-12] — les deux bloqueurs du GO de L2** ;
4. **O-8** — **[BLOQUÉ — source P4/G1–G5]** (périmètre à déterminer ; non bloquant L2 par défaut).

**État de la couche décisionnelle** : **tous les sujets structurants sont arbitrés à l'exception de ceux bloqués par des sources (O-2 final, DC-2, DC-8, O-8) et du niveau B d'O-4 (O-5).** Le chemin décisionnel restant est donc **entièrement concentré sur la récupération d'archives**.

**Prochaine étape immédiate possible, à votre initiative** : **l'autorisation d'archives** (retranscriptions distinctes L2.2, A-12, ARB-07, P4/G1–G5 — préparées, non rédigées sans votre accord), qui débloque simultanément DC-2, DC-8, O-2 final et O-8 — soit **la totalité des arbitrages restants avant le GO de L2**. Alternativement, tout sujet reportable (O-5, O-6, O-7, O-9, DC-7-bis, P3) reste différé sans affecter le chemin critique.

**Contrôle final** : décisions intégrées avec vos précisions ✓ · cohérence DC-13/P2/M3/A3-L2.5/O-3/O-13 vérifiée ✓ · niveau B ouvert, purge non autorisée ✓ · **aucun GO implicite ; aucune intervention sur le dépôt — livré exclusivement dans cette réponse.**

La consolidation O-4 niveau A est validée.

Je confirme :
- les six arbitrages SC-O4-A01 à A06 ;
- la clôture architecturale du niveau A ;
- la cohérence avec DC-13, P2/M3, A3/L2.5, O-3/O-13 et O-11 ;
- le maintien du niveau B en statut [OUVERT] ;
- l'absence de toute autorisation de purge, d'implémentation, de test, de mesure ou d'opération Git.

Merci d'intégrer deux précisions au registre :

**1. Journal témoin et historique de purge**

Le journal témoin et l'historique de purge doivent tous deux être indépendants du périmètre de restauration du magasin principal.

Cependant, leur mutualisation physique ou leur séparation en infrastructures distinctes ne sont pas arbitrées. Il ne faut présumer ni qu'ils utilisent nécessairement le même stockage, ni qu'ils doivent nécessairement utiliser deux stockages différents.

Leur conception devra démontrer séparément les garanties de complétude, de cohérence, de durabilité et de vérification attendues.

**2. Effet de la récupération des archives sur les arbitrages**

La récupération des archives autorise leur retranscription et leur analyse, mais ne vaut pas arbitrage automatique.

Les dépendances restent distinctes :
- L2.2 : finalisation de DC-2 ;
- A-12 : vérification de la couverture nécessaire à DC-8 ;
- ARB-07 : finalisation d'O-2 ;
- P4/G1–G5 : détermination du périmètre d'O-8.

DC-2 et DC-8 restent les deux bloqueurs documentaires de L2. O-2 et O-8 ne deviennent pas pour autant des prérequis de L2.

Aucune modification des décisions déjà arbitrées n'est demandée.

Après intégration de ces précisions, je considère le dossier O-4 niveau A stabilisé. Nous pourrons alors traiter la récupération documentaire des archives sans rouvrir les arbitrages clos.

Rappel : cette validation reste exclusivement documentaire. Aucun GO, démarrage de lot, implémentation, test, mesure, modification du dépôt ou opération Git n'est autorisé.

# Intégration des deux précisions au registre — O-4 niveau A stabilisé
**Exclusivement documentaire — aucun GO, démarrage de lot, implémentation, test, mesure, modification du dépôt ou opération Git.**

---

## 1. Précision 1 intégrée — Journal témoin et historique de purge : indépendance commune, infrastructure non arbitrée

**Règle enregistrée** : le **journal témoin** et l'**historique de purge** sont **tous deux indépendants du périmètre de restauration du magasin principal** — c'est la seule exigence arbitrée à leur égard.

**Ce qui n'est PAS arbitré** :
- **La mutualisation physique** (même stockage) — **non présumée** ;
- **La séparation en infrastructures distinctes** (deux stockages) — **non exigée** ;
- Tout choix de fournisseur, de technologie ou d'architecture physique (SC-O3-01 : principe uniquement).

**Ce que leur conception devra démontrer séparément** — **[À DÉMONTRER]**, quelle que soit l'organisation physique retenue :
1. **Complétude** des événements attendus (journal : (α) exhaustivité des chemins ; historique de purge : toutes les purges effectuées y sont enregistrées) ;
2. **Cohérence** de la lecture et de l'audit ;
3. **Durabilité** après restauration du magasin principal ;
4. **Vérification** : détection de leurs propres divergences (journal ⊋ état restauré ; historique de purge cohérent avec l'état observé) ;
5. **Non-dégradation mutuelle** : si les deux sont mutualisés, la conception doit démontrer que **la rétention de l'un ne détruit pas les preuves de l'autre** (une purge du journal ne peut jamais créer une fausse preuve d'absence — SC-O4-A01 ; une perte de l'historique de purge ne peut jamais faire passer une disparition pour une purge légitime — SC-O4-A03).

**Rattachements inchangés** : rétentions chiffrées au **niveau B** (O-5) ; fonction de conservation (SC-O4-A01) et durabilité tri-cas (SC-O4-A03) inchangées.

---

## 2. Précision 2 intégrée — Récupération d'archives ≠ arbitrage automatique

**Règle enregistrée** : l'autorisation d'archives **autorise la retranscription et l'analyse** — **elle ne vaut pas arbitrage automatique**. Chaque dossier retranscrit sera **analysé, puis soumis à votre arbitrage explicite**.

**Dépendances distinctes — inchangées** :

| Source retranscrite | Sert à | Statut après retranscription |
|---|---|---|
| **L2.2 / SCH-1…9** | **Finalisation de DC-2** (+ R-7b, déclarations DC-5) | grille complétée → **votre arbitrage DC-2** |
| **A-12 (cinq situations)** | **Vérification de la couverture nécessaire à DC-8** | correspondance tranchée → **votre arbitrage DC-8** (application documentée ou code dédié) |
| **ARB-07** | **Finalisation d'O-2** | grille finalisée → **votre arbitrage O-2 final** |
| **P4/G1–G5** | **Détermination du périmètre d'O-8** (ou constat de nécessité de reformulation) | périmètre établi → **votre arbitrage O-8** |

**Statuts de bloqueurs inchangés** : **DC-2 et DC-8 restent les deux bloqueurs documentaires de L2** ; **O-2 et O-8 ne deviennent pas des prérequis de L2** (F.2/F.3 du rapport de pilotage — L3 pour O-2, piste indépendante pour O-8).

---

## 3. O-4 niveau A — stabilisé

**Statut enregistré : clôture architecturale confirmée** — les six arbitrages SC-O4-A01…A06 **[DÉCIDÉ — ARBITRAGE UTILISATEUR]**, cohérence DC-13/P2-M3/A3-L2.5/O-3-O-13/O-11 vérifiée, **niveau B [OUVERT]** (durées chiffrées, seuil `STALE_DEVICE_MS`, capacités O-5, validation par adaptateur — **[À DÉMONTRER]**), **aucune purge effective autorisée tant que le niveau B et les validations ne sont pas établis**.

---

## 4. État consolidé du pilotage

**[DÉCIDÉ — ARBITRAGE UTILISATEUR]** : R-7a · O-12 · RECO (a)(b)(c) · O-11 (SC-O11-01…04, 06…09 + I-19) · O-3 (SC-O3-01…05) · O-13 (SC-O13-01…05) · **O-4 niveau A (SC-O4-A01…A06)** · DC-1…DC-14 (compléments sur sources).

**Restent à arbitrer** : **O-4 niveau B** (après O-5) · **O-2 final** (après ARB-07) · **DC-2, DC-8** (après retranscription — **bloqueurs L2**) · **O-8** (périmètre après source).

**Restent [À DÉMONTRER]** : (α)(β), liaisons, correspondances purge, résurrections, preuves (a)/(b), garanties séparées journal/historique de purge, idempotence des rotations (mécanisme), parité adaptateurs, résistances L5, PostgreSQL [N2]. **Aucun statut [AUTORISÉ]/[EXÉCUTÉ]/[TESTÉ].**

**Prochaine étape possible** : le **traitement de récupération documentaire des archives** — sous réserve de votre autorisation explicite de retranscription ; les arbitrages clos ne seront pas rouverts, et aucune retranscription ne sera rédigée ni aucun arbitrage rendu sans votre décision.

**Contrôle** : mutualisation/séparation non arbitrées, garanties séparées à démontrer ✓ · récupération ≠ arbitrage, dépendances distinctes, O-2/O-8 non prérequis L2 ✓ · O-4 niveau A stabilisé ✓ · **aucune décision rouverte ; contradiction introduite : aucune.** Livré exclusivement dans cette réponse — **aucune intervention sur le dépôt.**