# canon-prepare-v1 — fiche v6 (consolidation finale) + fiche de clôture documentaire (version finale)

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 923–1075 et 1347–1484 du fichier source).
> La fiche v6 est la dernière consolidation avant l'arbitrage utilisateur ; la fiche de clôture
> (version finale) intègre les corrections 1 à 3 et la matrice consolidée. Les itérations
> intermédiaires (versions antérieures des mêmes fiches, consolidations remplacées) restent dans
> l'historique transmis et ne sont pas dupliquées ici. Aucun statut modifié, aucune complétion,
> aucune retranscription de source inaccessible. Le vocabulaire (base, SDK, termes
> conversationnels) reste celui des fiches d'origine — aucune norme de nommage du projet n'est
> appliquée rétroactivement.


# Fiche d'arbitrage — `canon-prepare-v1` — **v6 (version finale consolidée, prête pour arbitrage utilisateur)**
**Prérequis prioritaire du GO de L2 — documentaire uniquement**

*Périmètre strict : aucun code, test, fichier du dépôt, documentation du projet, script, benchmark, opération Git ou démarrage de lot. **Aucune décision prise à votre place ; aucune recommandation transformée en décision ; aucune propriété présentée comme démontrée.** Cette version finale **ne vaut ni arbitrage automatique des recommandations, ni autorisation d'implémentation, de test, de mesure, d'opération Git, ni démarrage d'un lot. Aucune intervention sur le dépôt n'est effectuée.***

**Légende** : **[DÉCIDÉ]** verrouillé · **[RECOMMANDÉ]** non arbitré · **[OUVERT]** arbitrage requis (DC-n) · **[BLOQUANT]** bloque le GO de L2 · **[À DÉMONTRER]** propriété future, jamais présumée.

**Verrouillés, non rouverts** : A-1…A-12, ARB-01, ARB-02, D6 strict, B22-07, I-1…I-18, C-1…C-9, tableau des comportements, clôture de Session A. **O-13 hors périmètre** de ce contrat (dépendance du cas 4 uniquement). **O-9, O-11/O-12, O-4, O-3** dans leurs périmètres.

**Limite de vérification** : la fiche de Session A et la spécification L2.2 (schéma de payload) existent uniquement dans la conversation ; leur texte verbatim n'est pas accessible dans cette session. **Prérequis documentaires distincts** : énumération verbatim des cinq situations d'A-12 (DC-8) et schéma de payload L2.2 (DC-2) — archives de conversation ou rédaction d'un dossier source, sous autorisation distincte.

**Corrections v5 → v6 (les seules)** : **(1)** réconciliation explicite unité atomique / budget d'écritures (§ A) ; **(2)** statut explicite de DC-9/DC-11/DC-12 par rapport au GO de L2 (§ E) ; **(3)** référence DC-4b corrigée vers le § C de la présente fiche.

---

## § A. Réconciliation unité transactionnelle / budget d'écritures [DÉMONSTRATION à partir des décisions verrouillées — aucune décision nouvelle]

**L'ambiguïté** : l'unité décrite comme « {Reg1, index, head, ref} » semble compter quatre artefacts, alors que le coût historique annoncé est de 3 écritures (4 au premier `prepare`).

**Démonstration à partir des textes verrouillés** :
- **A-8-bis [DÉCIDÉ-A]** : « Reg1 = un document/une ligne par intention, id **`idx~e{E}~{D%}~{opId}`** ; contenu : `opId`, ordinal, **empreinte** (immuable), binding durable vers le `refId` » ;
- **C-2 [DÉCIDÉ]** : « index d'intention (create-only : **empreinte**, ordinal, binding `refId`) ».

Les deux définitions décrivent **le même document physique** (`idx~e{E}~{D%}~{opId}`, même contenu). **L'entrée Reg1 et l'index d'intention sont donc le même document**, portant deux rôles : la **réservation** (create-only dans le registre Reg1) et l'**index d'intention** (empreinte/ordinal/binding). « Reg1 » désigne le **registre** (l'ensemble des entrées), « index » le **document** qui en constitue une entrée — pas deux écritures.

**Tableau de réconciliation** :

| Objet logique | Réalisation physique | Écritures |
|---|---|---|
| Réservation Reg1 (create-only) | = le document d'index `idx~…` lui-même (A-8-bis) | **1** (comptée une fois) |
| Index d'intention (empreinte, ordinal, binding) | = **le même document** `idx~…` (C-2 : contenu identique) | — (même écriture) |
| Head (`head~e{E}~{D%}`, CAS `nextOrdinal`) | document head | **1** |
| Ref (create-only, binding) | document ref | **1** |
| Claim `(account, deviceId)` — **premier `prepare` seulement** | entrée de claim, **même unité atomique** (A-9) | **+1** |
| **Total régime normal** | | **3** |
| **Total premier `prepare`** | | **4** |

**Conclusion** : le décompte historique **3/4 est correct** ; la contradiction apparente venait d'une lecture de « Reg1 » et « index » comme artefacts physiques distincts. **L'unité transactionnelle logique reste {Reg1, index, head, ref}** — réalisée par **trois écritures physiques** (quatre avec le claim). **Aucun coût n'a été modifié pour faire disparaître la contradiction ; aucune décision d'architecture n'a été changée.** Réserve honnête : si vous aviez l'intention que la réservation Reg1 soit un document **physiquement distinct** de l'index, le budget deviendrait 4/5 — lecture **incompatible avec les coûts arbitrés** (tableau § 6 de la fiche Session A, jamais contesté) ; la lecture ci-dessus est la seule cohérente avec les décisions verrouillées, et le futur dossier d'exécution L2 devra reposer sur cette correspondance. **DC-14 s'appuie sur ce budget réconcilié.**

---

## § B. Squelette d'algorithme [RECOMMANDÉ]

1. Admission : cap entrant avant tout travail ; clés dupliquées détectées après décodage des échappements, avant réduction à un objet ordinaire ; Unicode bien formé ; `null` interdit ; `-0` rejeté par analyse de valeur.
2. Schéma : liste blanche stricte ; champ inconnu ⇒ `refusal_payload_invalid` ; bornes métier par schéma.
3. Normalisation par champ, selon la sémantique déclarée (ensemble / liste / multiensemble).
4. Sérialisation canonique : profil JCS restreint (clés triées UTF-16, échappement minimal, sortie UTF-8) ; contrôle du cap canonique.
5. Empreinte : SHA-256 des octets canoniques → Base64URL sans padding (43), calculée **par le serveur**, hors transaction.
6. Stockage : empreinte dans l'entrée Reg1 (create-only), immuable, avec `cpv` enregistré immuable — unité transactionnelle logique **{Reg1, index, head, ref}**, réalisée par **trois écritures physiques** (§ A) ; au premier `prepare`, le claim A-9 participe à cette unité (4).
7. Reprise (ligne 1) : re-canonicalisation avec le `cpv` **enregistré**, re-empreinte, comparaison ; équivalence ssi égalité.
8. Échec : comportement typé (DC-8, DC-6) ; indéterminé ⇒ fail-closed (I-12, I-16).

---

## § C. Règles techniques du profil [RECOMMANDÉ — section de référence pour DC-1 et DC-4b]

P-1 : clés dupliquées détectées **après décodage des échappements des noms de propriétés, avant réduction à un objet ordinaire** (`a` = `\u0061` ⇒ refus) ; séquences UTF-8 invalides et noms/valeurs Unicode invalides (surrogates isolés échappés inclus) ⇒ rejet.
**P-2 / DC-4b (règles numériques — référence de la synthèse)** : grammaire JSON ≠ valeur admise ; débordement vers `Infinity` (ex. `1e999`) ⇒ rejet ; **sous-débordement détecté sur le littéral, avant/pendant la conversion** — zéro réellement représenté admis, littéral non nul sous-débordant vers zéro rejeté ; `-0` rejeté **par analyse de la valeur**, toutes formes lexicales ; limites métier du schéma indépendantes de A-4 ; l'équivalence de deux littéraux mappant le même double reste une équivalence intentionnelle admise (§ D) et ne couvre jamais une valeur hors domaine.
P-3 (`-0`) · P-4 (champs inconnus rejetés) · P-5 (pas de NFC implicite ; surrogates isolés rejetés) · P-6a/b/c/d (clés d'objets triées UTF-16 ; comparateur d'éléments d'ensemble distinct et explicite — UTF-16 vs octets UTF-8 à arbitrer ; égalité = octets canoniques ; déduplication par sémantique déclarée, jamais générique) · **P-7 (tableaux ordonnés — jamais triés ni dédupliqués — inclus explicitement dans le périmètre de DC-1)**.

---

## § D. Injectivité — statut (inchangé de la v5)

**Définition contractuelle (inchangée)** : « Deux valeurs sémantiques normalisées distinctes, admises par le schéma, produisent des octets canoniques distincts. » — **Vérification expérimentale** : tests de propriétés + corpus hostile sur les valeurs admises, pour rechercher des collisions de canonicalisation et vérifier les cas couverts (y compris équivalences intentionnelles : ordres de clés/ensembles, doublons d'ensembles, représentations numériques équivalentes admises ⇒ même empreinte). **Garantie contractuelle recherchée** : deux valeurs sémantiques normalisées distinctes et admises ⇒ octets canoniques distincts. **Limite** : les tests ne constituent pas une démonstration mathématique exhaustive sur l'ensemble potentiellement infini des valeurs admises. **SHA-256** : résistance aux collisions = hypothèse cryptographique documentée, **non démontrée par les tests**.

---

## § E. DC-9, DC-11, DC-12 — statut explicite par rapport au GO de L2

**Classification : confirmations de portée, non bloquantes pour le GO de L2.** Justification : dans les trois cas, le **défaut arbitré gouverne déjà** — DC-9 (définition stricte de `refusal_prefix_divergence`, A-12 [DÉCIDÉ-A]) ; DC-11 (rôle du head borné par I-4 [DÉCIDÉ], la clôture relevant d'O-11/O-12) ; DC-12 (queues verbatim régies par A-1/A-2/A-3/A-6 et C-1 [DÉCIDÉ]). **Aucune décision de canon-prepare-v1 ne dépend de leur confirmation** ; aucune n'est une décision déjà prise — elles restent **[RECOMMANDÉ]**, et leur absence de confirmation ne change aucun défaut arbitré. **Nuance honnête** : leur confirmation **avant L2 est recommandée** (hygiène documentaire — elle élimine toute ambiguïté résiduelle dans les contrats L2, notamment le risque de résurgence de l'extension « toute inégalité du préfixe » pour DC-9), mais leur non-confirmation **ne bloque pas le GO**. Elles n'apparaissent donc **pas** dans la liste bloquante (§ G).

---

## § F. Points stabilisés — inchangés de la v5

R-1…R-9 [RECOMMANDÉ] · VP-1/DC-14 (validation/canonicalisation avant transaction ; contrôles atomiques — claim, head CAS, réservation **Reg1**, index, ref — dans la transaction ; budget **3/4 réconcilié § A**) · VP-2/DC-11 (head = progression seulement ; clôture = O-11/O-12) · VP-4/DC-9 · VP-5/DC-10 (empreinte en Reg1 seul ; aucun prérequis Reg2) · VP-6/DC-12 · **DC-2** (table partielle § 4 de la v5 inchangée, persistance conforme à § A ; champ exclu ≠ non validé ; divergence de champ exclu persisté ⇒ **indéterminé ⇒ fail-closed tant que DC-8 est ouvert** ; schéma L2.2 verbatim = prérequis de l'arbitrage) · **DC-6** (quatre **propositions** : cap entrant 256 KiO, cap canonique 512 KiO, profondeur 64, nœuds 100 000 — caps en octets et limites structurelles distingués ; mémoire = objectif à mesurer [À DÉMONTRER] ; `refusal_cap_exceeded` : application documentée recommandée, confirmée explicitement, aucune modification implicite d'A-12) · **DC-13 [OUVERT]** — (A) disponibilité complète alignée sur la rétention [RECOMMANDÉ] / (B) fenêtrée / (C) fenêtrée + refus typé dédié, impacts idempotence exposés, sans décision anticipée ; rétention = O-4 · **DC-7** (contrat API, avant L2 — digest client non accepté recommandé) · **DC-7-bis** (deux domaines de digest, avant L3 ; O-9 ouvert) · critères de validation et scénarios de tests (tous [À DÉMONTRER] ou hypothèses documentées).

---

## § G. Synthèse des arbitrages à rendre

### Avant L2 — [BLOQUANT]

| DC | Question | Recommandation | Prérequis / dépendance |
|---|---|---|---|
| DC-1 | Profil JCS restreint, **P-1…P-7 inclus** (§ C) | (a) JCS restreint | — |
| **DC-2** | Projection d'empreinte réelle, champ par champ | (a) whitelist stricte, inconnus rejetés | **Schéma L2.2 verbatim [prérequis de l'arbitrage]** |
| DC-3 | `null` | (a) interdit | — |
| DC-4 | Tris (clés UTF-16 JCS ; éléments d'ensemble UTF-16 vs octets), pas de NFC, surrogates rejetés | (a) UTF-16 | — |
| DC-4b | Numériques : double + JCS ; `Infinity` rejeté ; sous-débordement détecté sur le littéral ; `-0` rejeté par analyse de valeur | (a) + rejets | **§ C de la présente fiche [référence corrigée]** |
| DC-5 | Déduplication par sémantique déclarée | (a) par déclaration du schéma | Déclarations = schéma L2.2 |
| DC-6 | Quatre paramètres (caps + limites structurelles) + code de refus | Valeurs proposées ; `refusal_cap_exceeded` documenté, confirmé explicitement | Vérification verbatim A-12 souhaitable |
| **DC-7** | Contrat API — digest client | **Non accepté** (serveur seul, C-2) | — |
| **DC-8** | **[OUVERT]** — couverture de l'inégalité d'empreinte par l'énumération A-12 | Application documentée si couverture confirmée ; sinon 9ᵉ code dédié | **Énumération A-12 verbatim [prérequis de clôture]** |
| DC-10 | Rôle de Reg2 | (a) Reg1 seul | — |
| **DC-13** | Cycle de vie `cpv` (A/B/C) | **(A)** | Rétention = O-4 ; **ouvert, sans décision anticipée** |
| DC-14 | Validation avant transaction ; atomiques dans la transaction ; budget **3/4 réconcilié** | Oui | **§ A** |

**Confirmations de portée — non bloquantes pour le GO de L2 (§ E)** : DC-9, DC-11, DC-12 — recommandation « Oui » chacune ; confirmation avant L2 recommandée, non exigée.

**Différables** : DC-7-bis (avant L3) · O-5 (avant L5).

### Dépendances bloquantes consolidées

Le GO de L2 est bloqué par **DC-1…DC-7, DC-8, DC-10, DC-13, DC-14**, par **deux prérequis documentaires** (énumération verbatim A-12 ; schéma de payload L2.2), et par le point **O-12** (code de refus d'epoch clôturée — prérequis L2 **déjà suivi dans Session A § 8**, non re-décidé ici). O-13, O-9, O-11, O-4, O-3 restent dans leurs périmètres.

---

**Statut de cette v6** : **version finale consolidée, prête pour votre arbitrage** — sans arbitrage automatique des recommandations, sans transformation de recommandation en décision, sans garantie présentée comme démontrée, sans extension de périmètre ni nouvelle proposition architecturale. **Elle ne vaut ni autorisation d'implémentation, de test, de mesure, d'opération Git, ni démarrage d'un lot ; aucune intervention sur le dépôt n'a été effectuée** — livrée exclusivement dans cette réponse.

J'accepte les recommandations formulées dans la fiche canon-prepare-v1 v6 pour les arbitrages.

Les décisions suivantes sont donc désormais considérées comme [DÉCIDÉ — ARBITRAGE UTILISATEUR] :

- DC-1 : profil JCS restreint couvrant P-1 à P-7.
- DC-3 : `null` interdit.
- DC-4 : tri UTF-16 ; absence de normalisation NFC implicite ; rejet des surrogates isolés.
- DC-4b : IEEE-754 binary64 + JCS ; rejet d'Infinity, du sous-débordement non nul vers zéro et de toutes les formes de -0.
- DC-5 : normalisation et déduplication selon la sémantique explicitement déclarée par champ (ensemble, liste ou multiensemble).
- DC-6 : cap entrant de 256 KiB, cap canonique de 512 KiB, profondeur maximale de 64 et 100 000 nœuds maximum. Application documentée du code existant `refusal_cap_exceeded`. Aucune modification implicite de la taxonomie A-12.
- DC-7 : digest client non accepté ; calcul de l'empreinte par le serveur uniquement.
- DC-10 : Reg1 seul ; aucun rôle de Reg2 dans ce contrat.
- DC-13 : option A retenue, disponibilité complète de `cpv` alignée sur la rétention.
- DC-14 : validation/canonicalisation avant transaction ; unité atomique et budget 3/4 conformément à la réconciliation du § A de la v6.

Je confirme également les recommandations suivantes :
- DC-9 : oui.
- DC-11 : oui.
- DC-12 : oui.

Ces trois confirmations restent non bloquantes pour le GO de L2, conformément à la v6.

### Points encore ouverts

**DC-2 :**
La direction whitelist stricte est acceptée, avec rejet des champs inconnus. Toutefois, l'arbitrage complet de la projection champ par champ reste bloqué jusqu'à fourniture du schéma L2.2 verbatim. Ne pas inventer les champs ou leur sémantique.

**DC-8 :**
La règle conditionnelle est acceptée : réutiliser un refus existant si la couverture A-12 est effectivement établie ; sinon, soumettre explicitement la création d'un code dédié à arbitrage. La clôture de DC-8 attend l'énumération verbatim des cinq situations A-12. D'ici là, fail-closed et aucun nouveau code implicite.

### Consignes de consolidation

1. Mettre à jour la matrice des arbitrages en distinguant les décisions prises, les points ouverts et les prérequis documentaires.
2. Ne pas rouvrir les décisions historiques verrouillées.
3. Ne pas transformer les propriétés [À DÉMONTRER] en garanties acquises.
4. Maintenir O-12 comme prérequis L2 distinct, conformément à Session A.
5. Ne pas considérer ces arbitrages comme une autorisation d'implémentation.

Je demande une fiche de clôture documentaire des arbitrages déjà décidés, avec les deux blocages DC-2 et DC-8 clairement isolés.

**Périmètre inchangé : aucune modification du dépôt, aucun code, test, mesure, opération Git ou démarrage de L1, L2, L2.5 ou L5.**

# Fiche de clôture documentaire — arbitrages `canon-prepare-v1` — **version finale**
**Documentaire uniquement — aucune modification du dépôt, aucun code, test, mesure, opération Git ou démarrage de L1, L2, L2.5 ou L5**

*Légende : **[DÉCIDÉ — ARBITRAGE UTILISATEUR]** · **[DÉCIDÉ]** verrouillé (Session A + historiques) · **[CONFIRMÉ]** non bloquant · **[RECOMMANDÉ]** non arbitré · **[OUVERT]** · **[BLOQUANT]** · **[À DÉMONTRER]** propriété future, jamais présumée. Correction intégrée : **qualification de DT-01 au § 6** (seule modification). Tout le reste est inchangé de la version consolidée corrigée.*

---

## § 1. Décisions rendues — [DÉCIDÉ — ARBITRAGE UTILISATEUR]

**DC-1** profil JCS restreint couvrant P-1 à P-7 (clés dupliquées après décodage des échappements ; numériques ; `-0` ; champs inconnus ; Unicode/NFC ; tris et égalités ; tableaux ordonnés jamais triés ni dédupliqués) · **DC-3** `null` interdit (absence = champ omis) · **DC-4** tri UTF-16, absence de normalisation NFC implicite, rejet des surrogates isolés · **DC-4b** IEEE-754 binary64 + JCS ; rejet d'`Infinity`, du sous-débordement non nul vers zéro (détection sur le littéral) et de toutes les formes de `-0` (par analyse de valeur) · **DC-5** normalisation et déduplication selon la sémantique explicitement déclarée par champ (ensemble / liste / multiensemble) · **DC-6** cap entrant 256 KiB, cap canonique 512 KiB, profondeur maximale 64, 100 000 nœuds maximum ; **application documentée du code existant `refusal_cap_exceeded`**, aucune modification implicite de la taxonomie A-12 · **DC-7** digest client non accepté ; empreinte calculée par le serveur uniquement · **DC-10** Reg1 seul, aucun rôle de Reg2 · **DC-13** option A — disponibilité complète de `cpv` alignée sur la rétention, idempotence préservée pour toute entrée conservée (articulation rétention = O-4) · **DC-14** validation/canonicalisation avant transaction ; unité atomique et **budget 3/4 conformes à la réconciliation du § A de la v6**.

**Statut du budget 3/4** : **décision documentaire réconciliée [DÉCIDÉ]** (3 écritures physiques en régime normal — le document `idx~…` portant réservation Reg1 et index d'intention ; head ; ref — **4 au premier `prepare`** avec claim A-9 dans la même unité) ; sa **démonstration effective — conformité opérationnelle, parité entre adaptateurs, coûts réels — reste [À DÉMONTRER]** en L2/L5. La réconciliation architecturale n'est jamais présentée comme une preuve expérimentale.

**Portée de l'acceptation (statuts vérifiés, corrigés et validés)** : **R-7** (application du format SHA-256 → Base64URL 43 à l'empreinte du payload) = **[RECOMMANDÉ]** — arbitrage explicite requis, joignable à la clôture DC-2 ; **R-9** (mécanisme de re-canonicalisation avec le `cpv` enregistré) = **[RECOMMANDÉ]**, son **principe restant [DÉCIDÉ] via C-2** ; **R-2** = conséquence de la direction DC-2 acceptée, application champ par champ ouverte avec DC-2. La famille **DIGEST = 43 des identifiants reste [DÉCIDÉ-A]**.

---

## § 2. Confirmations enregistrées — [CONFIRMÉ, non bloquantes]

**DC-9** (portée arbitraire stricte de `refusal_prefix_divergence` inchangée) · **DC-11** (head = progression de `nextOrdinal` seulement ; clôture d'epoch = O-11/O-12) · **DC-12** (queues verbatim strictement préservées — A-1/A-2/A-3/A-6, C-1).

---

## § 3. Points ouverts — isolés

**DC-2 [OUVERT — BLOQUANT]** : direction **whitelist stricte, rejet des champs inconnus** décidée ; **projection champ par champ toujours bloquée par la fourniture du schéma L2.2 verbatim** — aucun champ ni sémantique inventés ; la table partielle (§ 4 de la v6 : `opId`, identité device/token) reste la seule base disponible. **R-7-format est joignable à cette clôture.**

**DC-8 [OUVERT — BLOQUANT]** : **règle conditionnelle décidée** (réutiliser un refus existant si la couverture A-12 est établie ; sinon code dédié soumis à arbitrage explicite) ; **clôture toujours bloquée par l'énumération verbatim des cinq situations d'A-12** ; **d'ici là : fail-closed, aucun nouveau code implicite** — la divergence d'empreinte et celle d'un champ exclu persisté (qui en dépend) restent indéterminées ⇒ fail-closed (I-12).

**Régime des prérequis documentaires** (commun aux deux, régime O-8) : archives de conversation ou rédaction d'un dossier source, sous **autorisation distincte**.

---

## § 4. Préserve sans modification

Tous les arbitrages DC et confirmations ci-dessus · **O-12** comme **prérequis L2 distinct** (Session A § 8) · **O-13** hors périmètre de ce contrat (dépendance du cas 4) · **O-4, O-3, O-8, O-9, O-11** dans leurs périmètres · **DC-7-bis** différé avant L3 (deux domaines de digest ; `digestCapture` ; O-9 ouvert) · **O-5** différé avant L5 · propriétés **[À DÉMONTRER]** (injectivité contractuelle, équivalences intentionnelles, corpus hostile, coûts 3/4 réels, mémoire, parité adaptateurs, déterminisme multi-plateforme) et **hypothèse cryptographique SHA-256** jamais transformées en garanties acquises · décisions historiques A-1…A-12, ARB-01/02, D6 strict, B22-07, I-1…I-18, C-1…C-9 verrouillées.

---

## § 5. Trois [RECO] de Session A — statuts et dépendances (validés)

| RECO | Objet | Dépendance | Bloque le GO de L2 ? |
|---|---|---|---|
| (a) Comportement provisoire de la ligne 1 | Branche « index retrouvé, équivalence invérifiable » | **L2 — branche ligne 1 uniquement** ; I-16 [DÉCIDÉ] impose déjà le fail-closed | **Non** — défaut arbitré gouverne ; validation recommandée pour enregistrer la décision de branche |
| (b) Liveness d'abandon facultative/auxiliaire | Coût et caractère auxiliaire de l'abandon (C-3/X2) | **Avant L3** (pipeline abandon/ACK) | **Non** |
| (c) Exclusion de purge des appareils à liveness insuffisante | Couverture de purge conservatrice (I-14, `STALE_DEVICE_MS`) | **O-4 / Session D, avant L7** | **Non** |

---

## § 6. Dépendances — GO de L1 / GO de L2 (qualification DT-01 corrigée)

**Prérequis documentaires bloquant le GO de L2** :
1. **DC-2 complet** — schéma L2.2 verbatim ;
2. **DC-8** — énumération A-12 verbatim ;
3. **O-12** — prérequis L2 **distinct** (Session A § 8).

**Baseline DT-01 — rétablissement du rattachement historique** : la baseline DT-01 correspond au **relevé des huit erreurs TypeScript préexistantes** (`tsc --noEmit`), **à figer au GO de L1, selon le périmètre déjà convenu** — elle **n'est pas un bloqueur autonome du GO de L2** et ne le devient pas sans justification architecturale nouvelle. **Distinction explicite** : la **fixation de la baseline** avant les travaux concernés (acte de relevé, au GO de L1) n'est **pas** la **correction** des huit erreurs, qui reste une **intervention distincte nécessitant sa propre autorisation** — le relevé des huit erreurs est conservé comme **dette préexistante, sans élargissement du périmètre de correction**.

**Trois [RECO]** : **non bloquantes globalement pour L2**, avec leurs dépendances respectives (§ 5).

---

## § 7. Contrôle de cohérence (effectué)

Tous les arbitrages DC et confirmations préservés dans les termes arbitrés ✓ · R-7 [RECOMMANDÉ], R-9 [RECOMMANDÉ] avec principe C-2 [DÉCIDÉ] ✓ · budget 3/4 [DÉCIDÉ] avec démonstration [À DÉMONTRER] ✓ · DC-2/DC-8 isolés, fail-closed transitoire, aucun code implicite ✓ · **DT-01 rétablie à son rattachement historique (GO de L1), retirée des bloqueurs L2, fixer-baseline ≠ corriger-erreurs, périmètre de correction non élargi** ✓ · O-12 maintenu prérequis L2 distinct ✓ · trois RECO non bloquantes globalement, dépendances inchangées ✓ · propriétés futures et hypothèse SHA-256 inchangées ✓ · **contradiction introduite par cette correction : aucune détectée**.

---

## § 8. Verdict — clôture stabilisée

**La clôture documentaire de `canon-prepare-v1` est stabilisée sous cette version finale.** Dix décisions [DÉCIDÉ — ARBITRAGE UTILISATEUR], trois confirmations [CONFIRMÉ], deux ouvertures isolées (DC-2, DC-8) bloquées chacune par un prérequis documentaire précis, un point résiduel **R-7 [RECOMMANDÉ]** joignable à la clôture de DC-2, **DT-01 rétablie à son rattachement historique au GO de L1**, et les trois RECO requalifiées vers leurs dépendances réelles. **Prochaines actions possibles, à votre seule initiative et sous autorisations distinctes** : fournir les deux textes verbatim (archives de conversation ou rédaction d'un dossier source) pour clore **DC-2** (et avec lui **R-7-format**) et **DC-8** ; arbitrer **O-12** ; le cas échéant, **figer la baseline DT-01 au GO de L1** et accorder le démarrage de L1. **Conformément à votre règle de clôture, aucune nouvelle revue générale n'est engagée ; aucune décision verrouillée n'est rouverte.** **Cette clôture ne vaut aucune autorisation d'implémentation, de test, de mesure, d'opération Git, ni de démarrage de L1, L2, L2.5 ou L5** — livrée exclusivement dans cette réponse, sans aucune intervention sur le dépôt.

Je valide cette version finale comme clôture documentaire stabilisée des arbitrages `canon-prepare-v1`.

La qualification des décisions, confirmations, recommandations, points ouverts et dépendances est acceptée dans les termes présentés.

Aucune nouvelle revue générale n'est demandée. Les décisions verrouillées ne doivent pas être rouvertes sans contradiction matérielle ou demande explicite de ma part.

Les seuls points restant à traiter sont ceux explicitement identifiés dans la fiche, selon leurs dépendances et sous autorisations distinctes : DC-2, DC-8, O-12, les recommandations encore non arbitrées et la baseline DT-01 au GO de L1.

Cette validation ne constitue aucune autorisation d'implémentation, de test, de mesure, d'opération Git ou de démarrage de L1, L2, L2.5 ou L5.

La fiche est désormais la référence documentaire de clôture pour `canon-prepare-v1`.

**Validation enregistrée — clôture documentaire de `canon-prepare-v1` stabilisée.**

La version finale de cette conversation est désormais la **référence documentaire de clôture** pour le contrat. Aucune intervention n'a été faite sur le dépôt, et aucune boucle de revue générale n'est engagée ; toute réouverture ne sera justifiée que par une contradiction matérielle ou votre demande explicite.

**État consolidé** :
- **Rendus et verrouillés** : DC-1, DC-3, DC-4, DC-4b, DC-5, DC-6, DC-7, DC-10, DC-13, DC-14 [DÉCIDÉ — ARBITRAGE UTILISATEUR], avec le budget 3/4 réconcilié [DÉCIDÉ] et sa démonstration effective [À DÉMONTRER] ; confirmations DC-9, DC-11, DC-12 [CONFIRMÉ, non bloquantes] ; R-7 [RECOMMANDÉ, joignable à la clôture DC-2] et R-9 [RECOMMANDÉ, principe C-2 déjà DÉCIDÉ].
- **Ouverts, isolés, chacun bloqué par un prérequis documentaire précis** : **DC-2** (projection champ par champ — schéma L2.2 verbatim) et **DC-8** (couverture par l'énumération A-12 verbatim), en régime transitoire fail-closed, aucun code implicite.
- **Restants, hors périmètre de ce contrat** : **O-12** (prérequis L2 distinct), les trois **RECO** requalifiées (branche ligne 1 / avant L3 / O-4 avant L7), **O-13, O-4, O-3, O-8, O-9, O-11** et la **baseline DT-01** à son rattachement historique — figer au **GO de L1**, distincte de la correction des huit erreurs, qui reste une intervention séparée sous sa propre autorisation.
- **Aucune autorisation ouverte** : cette validation ne vaut ni implémentation, ni test, ni mesure, ni opération Git, ni démarrage de L1, L2, L2.5 ou L5.

Les prochaines actions possibles restent à votre seule initiative, chacune sous autorisation distincte : fournir les deux textes verbatim (archives de conversation ou rédaction d'un dossier source) pour clore DC-2 et DC-8, arbitrer O-12 et les RECO restantes, puis, le cas échéant, figer la baseline DT-01 et accorder le GO de L1. En attendant, rien n'est engagé.

La clôture documentaire de `canon-prepare-v1` est stabilisée.

Je souhaite maintenant avancer en parallèle sur plusieurs chantiers documentaires indépendants afin de réduire les délais, sans démarrer prématurément les lots d'implémentation.

Organise le travail en quatre chantiers :

**CHANTIER A — DC-2 + R-7**
- Retrouver le schéma L2.2 verbatim.
- Préparer la projection whitelistée champ par champ.
- Identifier les éléments restant à arbitrer pour DC-2.
- Préparer l'arbitrage explicite de R-7 sur le format de l'empreinte du payload.
- Ne rien inventer si la source est indisponible.

**CHANTIER B — DC-8**
- Retrouver l'énumération exacte des cinq situations A-12.
- Construire une matrice de correspondance entre ces situations et DC-8.
- Déterminer si un refus existant couvre effectivement chaque situation.
- Ne proposer aucun nouveau code sans arbitrage explicite.

**CHANTIER C — O-12 + recommandations Session A**
- Préparer la fiche d'arbitrage O-12 concernant une epoch clôturée.
- Présenter les trois RECO encore en attente : comportement provisoire de la ligne 1, liveness d'abandon, exclusion des appareils à liveness insuffisante de la couverture de purge.
- Distinguer les décisions déjà imposées par les règles existantes des choix qui nécessitent réellement mon arbitrage.

**CHANTIER D — Registre des dépendances futures**
- Consolider O-2, O-3, O-4, O-5, O-8, O-9, O-11 et O-13.
- Pour chaque point : objet, statut, dépendances, lot concerné, caractère bloquant, décision attendue et prérequis.
- Identifier les dépendances croisées et les éventuels conflits de séquencement.
- Ne pas rouvrir les décisions déjà verrouillées.

**Règles communes**
1. Les quatre chantiers peuvent avancer simultanément lorsqu'ils ne dépendent pas d'une source ou d'une décision d'un autre chantier.
2. Chaque chantier doit distinguer les éléments retrouvés verbatim, les éléments déduits, les recommandations et les véritables points ouverts.
3. Aucun arbitrage ne doit être considéré comme rendu sans mon accord explicite.
4. Ne pas multiplier les versions intermédiaires : restituer un rapport consolidé par chantier, puis une synthèse transversale des dépendances.
5. Ne pas attendre artificiellement qu'un chantier soit terminé pour avancer sur les autres.
6. Si une source historique est introuvable, signaler précisément la lacune et proposer un dossier source distinct, sans le rédiger sans autorisation.

**Périmètre impératif : documentaire uniquement.** Aucune modification du dépôt, aucun code, test, mesure, opération Git ou démarrage de L1, L2, L2.5 ou L5.

L'objectif est de préparer simultanément les prochains arbitrages et de disposer d'une vision complète des dépendances avant de décider des autorisations d'exécution.