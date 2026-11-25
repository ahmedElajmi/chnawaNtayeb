# DC-2 / DC-8 — fiche consolidée corrigée pour validation finale (dernier état)

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 7660–7829 du fichier source). Fiche
> consolidée DC-2/DC-8 **intégrant les arbitrages déjà rendus** — les textes de décision verbatim
> (DC2-A01…A05, DC8-A01…A08 : lignes 7029–7225 de la source) sont transférés dans
> `arbitrages-utilisateur.md` ; les lignes 7226–7659 de la source correspondent aux étapes
> intermédiaires remplacées (consolidation « arbitrages intégrés », fiche « stabilisée
> définitive »). Aucun statut modifié, aucune complétion, aucune retranscription de source
> inaccessible. Le vocabulaire (base, SDK, termes conversationnels) reste celui des fiches
> d'origine — aucune norme de nommage du projet n'est appliquée rétroactivement.


# Fiche consolidée DC-2 / DC-8 — corrigée pour validation finale
**Exclusivement documentaire. Aucune réouverture des décisions DC-2/DC-8 ni des arbitrages antérieurs. Aucun code ou test, aucune modification du dépôt, aucune opération Git, aucun démarrage de lot, aucun GO L1/L2/L2.5, aucune purge. J'attends votre autorisation explicite avant toute autre action.**

---

## PARTIE A — DC-2 (corrigée)

### A.1 Matrice des champs `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` (DC2-A01, cohérence epoch intégrée)

| Champ | Règles |
|---|---|
| `device` | obligatoire ; composante DEVICE_RAW (A-3/A-6) |
| `epoch` | **disponibilité obligatoire au serveur** — voir règle unifiée A.1bis |
| `opId` | obligatoire ; **règles `[DÉCIDÉ]` (A-5)** : CSPRNG ≥ 128 bits, Base64URL sans padding, persistance locale avant transmission, même `opId` pour les retries, identité `(device, epoch, opId)` |
| `token` / `usageTag` / `consumer` | obligations A-3/A-6 — aucune nouvelle contrainte |
| `digest` client | **interdit** — calculé par le serveur (DC-7) |
| **payload métier** | **présent dès la v1** — projection minimale et explicite **à finaliser avant implémentation** (DC2-A03) |
| champs inconnus | rejetés (whitelist stricte) |
| `null` explicite | interdit (DC-3) ; **l'omission est la représentation de l'absence** |

Hors domaine canonique : métadonnées de transport, métadonnées serveur, documents persistés.

### A.1bis Règle unifiée sur l'epoch (correction 1 intégrée — contradiction levée)

1. **L'epoch d'origine fait obligatoirement partie de l'identité `(device, epoch, opId)`** ;
2. Elle **doit être disponible au serveur pour chaque intention, y compris lors d'un retry** ;
3. Le **serveur détermine indépendamment l'epoch active du compte** ;
4. Le serveur **compare** les deux et **refuse toute réinterprétation inter-epochs** (O-11/O-13) ;
5. Le client **ne peut jamais imposer l'epoch active**.

**Représentation HTTP** : elle doit **garantir la disponibilité de l'epoch d'origine**. Si elle est transmise **indirectement par un mécanisme de transport, ce mécanisme doit être explicitement défini** dans la projection. **À défaut, l'epoch est obligatoire dans la requête.** Les formulations « champ obligatoire » et « présence facultative » ne coexistent plus : la disponibilité est obligatoire ; seule la modalité de transmission (directe dans la requête, ou indirecte par un mécanisme explicitement défini) reste une **précision à finaliser** dans la projection DC-2.

### A.2 R-7b — option α `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` (DC2-A02) + invariant `cpv`

- **Digest = SHA-256 du payload métier canonique uniquement** → Base64URL sans padding (R-7a) ; identité vérifiée séparément ;
- Liste exacte des champs du payload et **octets d'entrée définis explicitement dans la projection avant implémentation** — jamais déduits ni inventés.

**Invariant de reproductibilité de la canonisation** : le digest initial est calculé selon la **version de canonisation associée à l'intention** ; toute vérification ultérieure doit pouvoir **reproduire le même domaine canonique avec cette version** ; **une évolution de la canonisation ne rend jamais impossible la vérification d'une intention encore conservée** ; la **disponibilité de l'implémentation `cpv` respecte DC-13** (couplage à la rétention des entrées Reg1 qui la référencent). **Distinction maintenue** : garantie de reproductibilité = DC-13 `[DÉCIDÉ]` ; méthode technique = **R-9, qui reste `[RECOMMANDÉ]`**.

### A.3 Payload métier v1 `[DÉCIDÉ — PRINCIPE]` (DC2-A03) — inchangé

Projection à formaliser à partir du schéma disponible, minimale ; **aucune implémentation sur une projection supposée**.

### A.4 Provenance de l'epoch `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` (DC2-A04) — reformulée par A.1bis

Serveur = autorité de l'epoch active ; vérification d'appartenance ; aucune réinterprétation inter-epochs.

### A.5 Plafond numérique A-4 `[DÉCIDÉ — PRÉCISION DE PORTÉE]` (DC2-A05) — inchangé

`10^15` et contraintes d'entier exact conservés pour le champ auquel A-4 s'applique ; pas d'extension automatique sans confirmation documentaire de la cible.

### A.6 DC-5 (inchangée) · A.7 Garanties non interchangeables (inchangées)

Identité (désigne ; ne prouve ni équivalence ni absence de réservation) ≠ digest (vérification cryptographique de l'équivalence du payload métier canonique, selon la version de canonisation associée — **vérification fondée sur la résistance aux collisions, pas une preuve mathématique d'identité des payloads**, voir D.3) ≠ fingerprint immuable (retrouve la preuve enregistrée). **Aucune observation idempotente sans vérification effective de l'équivalence.**

---

## PARTIE B — DC-8 (corrigée)

### B.1 Matrice des refus `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` (DC8-A01…A08)

| ID | Situation | Code / comportement |
|---|---|---|
| D1 | Dépassement limite d'entrée | `refusal_cap_exceeded` |
| D2 | Structure JSON invalide | `refusal_payload_invalid` |
| D4 | Identifiant non canonique / limites A-6 | `refusal_id_noncanonical` |
| D5 | Champ inconnu ou digest client | `refusal_payload_invalid` |
| D6a | Champ obligatoire manquant | mapping selon la nature (B.2) — aucun code arbitraire |
| D6b | Contrainte métier | `refusal_payload_invalid` uniquement si relevant de DC-1/DC-3/DC-4/DC-6 ; identité ⇒ A-6 |
| D7 | Limites structurelles DC-6 | `refusal_cap_exceeded` |
| D8 | Epoch définitivement fermée | `refusal_epoch_closed` (activable, O-11/O-12) |
| D9 | État indéterminé | **fail-closed + réconciliation, sans nouveau code implicite** |
| D10 | Conflits d'identité/unicité | selon B.3 |
| D11 | Classification terminale opposée | DC8-A03 (B.4) |
| D12 | Index contenu/association incompatible | DC8-A04 (B.4) |
| D13 | Autorité externe indisponible | DC8-A07 (B.5) |
| D14 | Échec transactionnel / capacité | B.6 |

### B.2 D6a — inchangé (DC8-A02)

Identité ⇒ A-6 / `refusal_id_noncanonical` si applicable ; champ métier ⇒ `refusal_payload_invalid` si relevant de DC-1/DC-2 ; **métadonnée serveur absente ⇒ anomalie de construction ou d'état selon son origine, jamais automatiquement une erreur client** ; mapping non confirmable ⇒ point ouvert, aucun code inventé.

### B.3 D10 — inchangé (DC8-A05/A06)

Reg1 absent — jamais un simple constat (I-18) : ① première préparation légitime (create-only ; préinscriptions SC-O13-03 ; interruption préinscription→commit = **indéterminée, sans exécution automatique**) ; ② reprise après interruption/restauration ; ③ **cas 4** (double preuve (a)+(b), garanties de complétude/exhaustivité). **Retries d'une même intention : même `opId` `[DÉCIDÉ]` (A-5)** ; politique générale de retry **hors périmètre**. Reg1 présent et cohérent ⇒ observation idempotente seulement si équivalence effectivement vérifiée (digest recalculé = fingerprint, version de canonisation de l'intention) **et** cohérence index/Reg1/head/ref/classification ; sinon aucune observation présumée. **Fingerprint différent** : aucune nouvelle exécution ; **par défaut fail-closed + réconciliation tant que non qualifiée** ; refus spécifique uniquement si réutilisation abusive **effectivement établie** et code **existant dans la taxonomie validée**. **Ordinal déjà réservé** : incohérence constatée ⇒ fail-closed + réconciliation ; aucun code inventé ; distinction réservation cohérente / contradiction de persistance. **Incohérence index/Reg1/head/ref/classification** ⇒ indéterminé → fail-closed + réconciliation.

### B.4 D11 / D12 — inchangés (DC8-A03/A04)

D11 : erreur de requête démontrée ⇒ refus adapté si sémantique établie ; contradiction d'états persistés ⇒ fail-closed + réconciliation ; preuve insuffisante ⇒ fail-closed. D12 : incohérence d'état ⇒ aucune nouvelle exécution ; fail-closed ; réconciliation ; aucun code implicite. *Nouvelles décisions DC-8, jamais reconstitution d'A-12.*

### B.5 D13 — **portée de l'interdiction précisée** (correction 2 intégrée, DC8-A07)

Autorité externe requise indisponible ⇒ **refus temporaire de l'opération** ; **aucun mode dégradé ; aucun contournement best-effort ; aucune preuve négative déduite de l'indisponibilité**. Formulation exacte retenue : **« Aucune exécution asynchrone permettant de contourner l'exigence de preuve ou de poursuivre une opération protégée sans l'autorité requise. »** — Cette interdiction **ne s'étend pas par extension** à des mécanismes asynchrones qui **respecteraient intégralement les garanties O-3/O-13** (ceux-ci restent soumis aux mêmes exigences de preuve et d'autorité). Réutilisation d'un code existant seulement si la sémantique correspond effectivement ; **sinon code à arbitrer séparément**.

### B.6 D14 — inchangé

`refusal_capacity` : existence `[CONFIRMÉ]` ; conditions exactes d'émission et garanties de rollback `[POINT OUVERT]` ; rollback certain ≠ résultat inconnu (⇒ fail-closed + réconciliation).

### B.7 Ordre de priorité `[DÉCIDÉ — ARBITRAGE UTILISATEUR]` (DC8-A08) — inchangé

1→7 comme arbitrée ; **règle transversale prioritaire : toute incohérence d'état détectée à toute étape ⇒ fail-closed, indépendamment de cet ordre.**

---

## PARTIE C — Traçabilité — inchangée

A-3, A-4 (portée), A-5, A-6, DC-1/DC-2/DC-3/DC-4/DC-6, DC-7, **DC-13** (invariant de reproductibilité), R-7a/**R-7b (α)**, R-9 `[RECOMMANDÉ]`, O-3/O-11/O-12/O-13, Session A (ligne 1, I-17, I-18), SC-O3-02/03, SC-O13-02/03/04/05. **Aucune règle de sécurité transformée en code sans arbitrage explicite.**

---

## PARTIE D — Clôture documentaire (corrigée)

### D.1 Décisions arbitrées `[DÉCIDÉ]`

DC2-A01…A05 · DC8-A01…A08 · décisions antérieures inchangées.

### D.2 Précisions documentaires encore nécessaires (avant implémentation qui en dépend)

1. **Projection exacte du payload métier** — et, en découlant : **octets d'entrée exacts du digest** (DC2-A02) et **représentation HTTP de l'epoch d'origine** (transmission directe obligatoire ou mécanisme indirect explicitement défini — A.1bis) ;
2. **Table Session A § 4 (noms des codes)** — pour les codes résiduels (D6a non couvert, D13 si aucun code existant ne correspond, refus spécifique fingerprint différent le cas échéant) ;
3. Détails de transcription A-3/A-6/DC-5 — **décisions validées conservées, précisions à signaler avant implémentation dépendante** ;
4. Cible exacte du plafond A-4 (10¹⁵) avant toute application à un champ.

### D.3 Garanties techniques `[À DÉMONTRER]` — **corrigé (correction 3)**

La mention « injectivité du digest » est remplacée par **quatre propriétés distinctes** :

| Propriété | Nature | Statut |
|---|---|---|
| **Déterminisme de la canonisation** | un même payload métier, interprété selon le même `cpv`, produit la même représentation canonique | garantie du contrat, **[À DÉMONTRER]** par les tests de canonisation |
| **Déterminisme du digest** | une même représentation canonique produit le même digest SHA-256 | garantie du contrat, **[À DÉMONTRER]** par les tests de digest |
| **Résistance aux collisions de SHA-256** | propriété **cryptographique attendue** de SHA-256 — **ne peut pas être démontrée par une simple campagne de tests** | hypothèse cryptographique documentée (SHA-256 n'est **pas** injectif) |
| **Conformité expérimentale** | vecteurs de référence, tests de canonisation, tests de digest, **vérification de reproductibilité entre versions et adaptateurs** | campagne de tests **[À DÉMONTRER]** |

**Formulation corrigée** : l'égalité des digests n'est **pas** une preuve mathématique absolue de l'identité des payloads — elle constitue une **vérification cryptographique fondée sur la résistance aux collisions de SHA-256**. Cette correction **ne modifie pas l'arbitrage R-7b** (option α reste `[DÉCIDÉ]`) ni le statut de **R-9 (`[RECOMMANDÉ]`)**. Les autres garanties `[À DÉMONTRER]` restent inchangées : exhaustivité/complétude de l'autorité externe, liaisons intention/préinscription/événement/commit, résistances aux restaurations, parité adaptateurs.

### D.4 Sujets volontairement non arbitrés (hors périmètre) — inchangés

Unicité globale d'`opId` (non décidée, non requise) · plafond de longueur d'`opId` (non décidé, non requis) · politique générale de retry (hors périmètre) · R-9 `[RECOMMANDÉ]` · codes historiques non reconstruits.

### D.5 État de clôture (constat, pas de GO)

**DC-2 et DC-8 sont arbitrés au niveau décisionnel** — les deux bloqueurs documentaires du GO de L2 sont levés à ce niveau. **Cela ne conclut pas que toutes les spécifications d'implémentation sont achevées** : la projection du payload métier (D.2.1) reste un préalable documentaire avant toute implémentation, et les garanties techniques (D.3) restent à démontrer. **Aucun GO L1/L2/L2.5 n'est déduit** ; L1 reste antérieur et distinct (instruction séparée + gel DT-01) ; O-2 et O-8 ne sont pas des prérequis L2.

---

**Fiche consolidée corrigée présentée pour votre validation finale.** Les trois corrections sont intégrées : règle unifiée sur l'epoch (disponibilité obligatoire au serveur, modalité de transmission à finaliser — plus aucune contradiction « obligatoire/facultative ») ; portée exacte de l'interdiction asynchrone de D13 (formulation verbatim, sans extension aux mécanismes respectant O-3/O-13) ; D.3 remplacé par les quatre propriétés distinctes (déterminismes, résistance aux collisions, conformité expérimentale) sans modifier R-7b ni R-9. **Aucune autre action n'est engagée — j'attends votre autorisation explicite. Aucune intervention sur le dépôt ; aucun GO déduit.**

Nous souhaitons accélérer la préparation de la suite du projet Chnawa Ntayeb en lançant quatre missions documentaires parallèles et indépendantes.

**IMPORTANT — PÉRIMÈTRE STRICT**

Ces missions sont exclusivement documentaires et préparatoires.

Aucune autorisation n'est accordée pour :
- modifier ou créer des fichiers dans le dépôt ;
- modifier le code, les tests ou la documentation du projet ;
- exécuter des tests ou des mesures ;
- effectuer des opérations Git ;
- démarrer L1, L2, L2.5 ou un autre lot ;
- effectuer une purge ou une migration ;
- considérer qu'un livrable documentaire vaut autorisation d'exécution.

Les arbitrages utilisateur déjà acceptés sont acquis. Ne pas les rouvrir sans contradiction matérielle démontrée.

Pour chaque information, distinguer clairement :
[DÉCIDÉ], [CONFIRMÉ], [RECOMMANDÉ], [NOUVELLE PROPOSITION], [POINT OUVERT], [BLOQUANT], [À DÉMONTRER].

Ne jamais inventer une décision historique manquante ni présenter une proposition nouvelle comme une décision déjà prise.