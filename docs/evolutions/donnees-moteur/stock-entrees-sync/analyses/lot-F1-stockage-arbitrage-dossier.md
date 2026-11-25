# Lot F1 — Dossier d'arbitrage v4.10 (consolidé — clôture de la phase documentaire)

> **Version 4.10 — dernière harmonisation de la v4.9** : **monotonie du point de
> connaissance** — maximum des horodatages serveur des références effectivement confirmées
> pour l'appareil, **strictement monotone et jamais un recul** (confirmations retardées,
> concurrentes ou rejouées ; mises à jour atomiques ; idempotence des répétitions déjà
> traitées ; préservée lors des reprises après erreur) ; **deux parcours de confirmation
> explicites** dans la sortie du pull-only (ACK dédié / piggyback sur le push de
> réconciliation — **aucune confirmation ni acceptation partielle en cas d'échec**) ;
> **point de contact** mis à jour après un push entièrement accepté, un ACK dédié vérifié ou
> une requête piggyback vérifiée — **point de connaissance** n'avançant que lorsque la
> référence est effectivement confirmée (**définitions identiques §§ 1.2 et 8**) ; **états
> du registre** (`prepared`, `confirmed_received`, `abandoned`) et événement `transmitted`
> **non autoritatif**. Le choix
> de la lecture de réconciliation transactionnelle **n'est pas remis en cause** ; la cohérence
> entre le `state_ref`, le registre d'appareils et la garantie anti-résurrection est
> préservée. Décisions déjà prises **non rouvertes**, aucune nouvelle analyse générale.
> Statut : dossier documentaire et vérifications nécessaires à sa rédaction uniquement — aucun
> code/configuration/script/fixture/test modifié ou lancé, aucune campagne, aucun
> commit/push/merge/nettoyage, émulateur non arrêté, données existantes non modifiées.
> **Après revue de cette correction : clôture de la phase documentaire ; les vérifications
> techniques et arbitrages restants sont traités dans les lots d'exécution avec des
> autorisations distinctes.**

---

## 0. Décisions déjà validées (non rouvertes)

**Principes fonctionnels confirmés** : protection contre la résurrection automatique des
données supprimées ; suppression puis recréation volontaire du même ingrédient ; validité
locale et rétention indépendantes avec invariant de sécurité ; réconciliation générique avec
conservation des opérations ambiguës ; quarantaine récupérable ; contrat de synchronisation
déterministe ; option B et partitionnement dynamique ; configuration contrôlée des limites
depuis le backoffice. **Principe fonctionnel D3 validé** : causalité vérifiée par le serveur ;
aucune ancienne opération acceptée sur la seule base de son HLC. **Nouveau principe validé
(v4.6)** : **un état non reçu n'est jamais considéré comme un point de synchronisation
confirmé** ; la confirmation exige une preuve post-réception côté serveur ; la reprise est
idempotente, sans perte de données ni blocage permanent. **Exigence architecturale
transversale validée** : noyau commun de synchronisation et de réconciliation (§ 10). Plus :
D-V1..D-V6 ; constats A0-A4, D2-D5, M1a/M1b, M2-M5 (statuts de preuve conservés) ; A2/A3 =
corrections et tests de non-régression **prérequis d'exécution** ; grandfathering écarté ;
refus d'une rétention réduite **sans métriques suffisantes** ; α de A4 avec isolation par
compte.

---

## 1. D3 — garantie anti-résurrection côté serveur

### 1.1 Registre, jetons d'état et référence causale (fondements, v4.5 conservés)

- **Registre d'appareils** (`kitchen/{uid}/devices/…`, isolation structurelle) : identité
  **délivrée par le serveur** au premier contact, points estampés **à l'horloge du serveur**,
  version de protocole déclarée.
- **Jeton d'état (`state_ref`)** : `{ refId, appareil, horodatage serveur, révision de
  l'instantané servi }`, conservé dans le registre (fenêtre V + marge). Chaque opération en
  attente porte **`base_ref`** = le jeton de l'état effectivement reçu avant sa création (+
  base causale d'entité).
- À l'acceptation, `base_ref` doit résoudre à un jeton **confirmé reçu, émis à cette
  identité** et cohérent avec les affirmations causales. Premier contact ≠ fiabilisation ;
  identité perdue ≠ fiabilisation ; sans preuve suffisante → **réconciliation obligatoire**.
- **Version de protocole déclarée ≠ preuve** : les comportements sont vérifiés (G1-G5), les
  anciens comportements incompatibles sont **empêchés**.
- Garde-fous G1-G5 ; purge des tombstones par **acceptation serveur** — effective même contre
  un ancien client appelant directement l'API.

### 1.2 CORRECTION — confirmation de réception du `state_ref`

La transaction garantit la cohérence de l'instantané **et** l'enregistrement serveur du jeton,
mais **elle ne prouve pas que le client a reçu cet état** (ex. : réponse HTTP perdue après le
commit — le registre pourrait croire confirmé un état jamais reçu). Correction — les **états
d'une référence** :

**États de la référence** (les états du registre sont `prepared`, `confirmed_received` et
`abandoned` — « transmis » n'est **pas** un état du registre) :

| État | Définition | Statut |
| --- | --- | --- |
| `prepared` | Instantané cohérent composé par la transaction ; référence créée et enregistrée | **État du registre** — non confirmée : ne vaut ni point de synchronisation ni base causale |
| `transmitted` | Tentative de remise de la réponse au transport (instantané + référence remis au réseau) | **Événement de transport éventuel, non autoritatif** — jamais un état du registre, ne modifie **jamais** la validité ni la causalité ; une tentative de transmission n'est **jamais** une preuve de réception |
| `confirmed_received` | Réception **et enregistrement** prouvés par une requête authentifiée **postérieure à la réception** (ACK vérifié ou piggyback vérifié) | **Seul état faisant foi** — point de connaissance et base causale valide (G5) |
| `abandoned` | Référence `prepared` non confirmée dans le délai défini | **État du registre** — inutilisable comme base causale, purgée avec la fenêtre V + marge |

**Règle : seul un état `confirmed_received` vaut point de synchronisation pour la garantie de
validité et base causale valide.** Une référence `prepared` non confirmée — comme tout
événement `transmitted` — **ne compte jamais** ; la référence devient **`abandoned`** (purge
du registre dans la fenêtre V + marge) si elle n'est pas confirmée dans le délai.

**Mécanisme de confirmation — accusé de réception (recommandé par défaut)** :

1. Le serveur sert l'état (transaction : composition + enregistrement de la référence
   **préparée**) ;
2. L'appareil **enregistre localement** l'état et la référence dans un **commit local
   atomique** (la référence fait partie de l'état de synchronisation local, persistant, elle
   survit au redémarrage) ;
3. L'appareil envoie **`ack(refId)`** (ou porte la confirmation piggyback) ; le serveur
   **vérifie** l'identité de l'appareil, l'**existence** de la référence et la **cohérence**
   de la confirmation avec l'échange, puis l'**état** de la référence détermine le
   comportement :
   - référence **`prepared`** et à lui → **confirmation** : passage à
     **`confirmed_received`**, mise à jour du **point de connaissance** selon les **règles
     de monotonie** (ci-dessous) — au **maximum** de l'**horodatage serveur de l'instantané
     servi** et de la valeur courante ;
   - référence **`confirmed_received`** pour le **même appareil** → **succès idempotent**
     (aucune modification des points) — une répétition légitime d'ACK ou de piggyback ne doit
     **pas échouer** parce que la première confirmation a déjà réussi ;
   - référence **`abandoned`**, **inconnue** ou associée à une **autre identité** →
     **refus** (`unverifiable`) ;
4. La confirmation est **idempotente dans tous les cas légitimes**.

**Variante optimisée — piggyback (arbitrage)** : la confirmation **voyage sur la requête
suivante** (`lastReceivedRef` porté par le pull ou le push suivant) — sans requête dédiée, au
prix d'une latence de confirmation d'un cycle ; le push de réconciliation peut confirmer sa
base dans la même transaction (les opérations démontrent qu'elles ont été construites sur cet
état).

**Harmonisation des deux variantes — règle identique** : dans les deux cas, le **point de
connaissance n'avance que par la requête authentifiée qui confirme la référence** — l'`ack`
dédié dans la variante dédiée, la requête de confirmation piggyback dans la variante
optimisée. Dans les deux cas, le serveur **vérifie** : l'**identité** de l'appareil,
l'**existence** de la référence et la **cohérence** de la confirmation avec l'échange ;
l'**état** de la référence détermine ensuite le comportement (§ ci-dessus : confirmer /
succès idempotent / refuser). **Une simple déclaration du client ne suffit jamais.** Les deux
variantes préservent l'invariant : la confirmation n'arrive qu'après un échange authentifié
postérieur à la réception.

**Deux points distincts dans le registre** :

| Point | Rôle | Mis à jour par |
| --- | --- | --- |
| **Point de contact confirmé** | Vivacité de l'appareil — G2 (validité) | Mis à jour après **un push entièrement accepté**, **un ACK dédié vérifié** ou **une requête piggyback vérifiée** |
| **Point de connaissance** | Fraîcheur de la connaissance de l'appareil ; **base causale valide (G5)** ; métriques de sécurité de purge (§ 8) | N'avance que lorsque la référence est **effectivement confirmée** (`confirmed_received`) — ACK dédié vérifié ou piggyback vérifié ; **jamais par une simple tentative** |

**Monotonie du point de connaissance** — le point correspond au **maximum des horodatages
serveur des références effectivement confirmées** pour l'appareil ; il est **strictement
monotone et ne recule jamais** :

- une confirmation **plus ancienne** (requête **retardée**, **concurrente** ou **rejouée** —
  exemple : l'appareil confirme la référence B, instantané de 11 h, **avant** la référence
  A, instantané de 10 h ; la confirmation ultérieure de A laisse le point à **11 h**) ne
  fait **jamais reculer** le point ;
- la mise à jour est **atomique et sûre en cas de confirmations concurrentes** — même
  transaction ou garde serveur, un seul résultat = le maximum (mécanisme propre à
  l'adaptateur) ;
- une **répétition déjà traitée** reste **idempotente** et **ne modifie aucun point** ;
- la monotonie est **préservée lors des reprises après erreur** (re-ack, retry, plantage,
  reprise du parcours piggyback) — **aucun chemin de reprise ne peut réestampiller le point
  vers le passé**.

**Scénarios de panne — tous couverts, idempotents, sans perte, sans blocage permanent** :

| Scénario | Comportement |
| --- | --- |
| **Réponse perdue après le commit serveur** | Référence préparée, **jamais confirmée** → abandonnée (purge du registre) ; l'appareil re-tire (état frais, nouvelle référence) — **aucun point de synchronisation confirmé n'a été enregistré** |
| **Client a reçu et enregistré, ack perdu** | La référence reste « en attente d'ack » dans le registre local (persistant) → **re-ack** (idempotent) ; ou un pull ultérieur re-sert un état frais (fusion idempotente par version) — aucune perte, aucun blocage |
| **Client a reçu, planté avant l'ack** | Idem — re-ack au redémarrage |
| **Client planté avant l'enregistrement local** | L'état n'a pas été reçu au sens utile → re-tir ; la référence préparée est abandonnée |
| **Client a reçu mais ne ré-échange jamais** | Réference préparée non confirmée : ses futures opérations portant cette base sont refusées (`unverifiable`) → réconciliation — sûr par défaut |
| **Réponse de push perdue** | Le push est **idempotent par version** (même fusion) → re-push ; côté serveur les données **sont** arrivées (fait serveur : point de contact estampé au succès du push) ; l'incertitude du client se résout par re-push ou par pull ; **push de réconciliation piggyback** : re-push sur une référence déjà `confirmed_received` pour le même appareil → **succès idempotent** (§ 1.2), opérations refusionnées à l'identique |

**Anti-résurrection préservée** : la garantie ne repose **jamais** sur la seule déclaration du
client — la confirmation prouve un échange post-réception, et **chaque opération reste
individuellement validée** (G3-G5) ; les métriques de purge comptent au **pire cas** tout
appareil dont l'état confirmé reçu n'est pas démontrable.

### 1.3 Lecture de réconciliation transactionnelle (v4.5 conservé, ajusté)

Deux chemins de lecture :

| Chemin | Quand | Mécanisme | Effet registre |
| --- | --- | --- | --- |
| **Lecture de réconciliation** (grade transactionnel) | Appareil expiré entrant en réconciliation ; demande explicite ; **phase 1 : tous les pulls** | Transaction : lecture de **toutes** les parties, composition, **création de la référence (état `prepared`)** dans la même transaction | Référence préparée ; la **confirmation** suit l'enregistrement local atomique — **ACK dédié ou piggyback vérifié**, selon la variante retenue (§ 1.2) |
| **Pull ordinaire** (chemin économique) | Optimisation ultérieure | Requête unique | Capability-gated, après démonstration des propriétés multi-partitions |

La cohérence de la lecture transactionnelle repose sur la **sémantique transactionnelle
documentée** de Firestore (le même garant dont dépend déjà toute écriture) — prérequis
**partagé avec A2**, sur la checklist doc-SDK, jamais présupposé. **Aucun blocage permanent** :
l'appareil expiré obtient toujours un état cohérent + une référence → il construit ses
opérations neuves → **confirmation** (ACK dédié ou piggyback vérifié) → **push de
réconciliation** (§ 1.4, deux parcours explicites). Le chemin
économique n'est jamais un prérequis de la sortie ; sa désactivation ne diffère qu'une
optimisation. Coût estimé : +1 écriture (préparation) + 1 petite écriture (confirmation) par
pull en phase 1 — à mesurer.

### 1.4 Sortie du mode pull-only — deux parcours explicites, sans réautorisation

**Début commun** : l'appareil expiré entre en réconciliation via la **lecture
transactionnelle** (§ 1.3 : état cohérent + référence `prepared`), puis **persiste
localement, de façon atomique**, l'état et la référence.

**Parcours ACK dédié :**
1. Persistance locale atomique de l'état et de la référence ;
2. Confirmation de la référence par **ACK dédié** (§ 1.2) → `confirmed_received`, point de
   connaissance estampillé ;
3. Résolution de la file : chaque entrée est **appliquée sous forme d'une opération neuve**
   (`base_ref` = la référence **confirmée**), **abandonnée** (confirmation explicite) ou
   reste **ambiguë** ;
4. **Push de réconciliation** et **validation individuelle des opérations** (G5) ; une
   opération refusée reste dans la file et l'appareil **reste en réconciliation**.

**Parcours piggyback sur le push de réconciliation :**
1. Persistance locale atomique de l'état et de la référence ;
2. **Préparation des opérations neuves** basées sur cette référence (`base_ref` = référence
   `prepared`) ;
3. Envoi du push avec **`lastReceivedRef`** ;
4. **Dans une même transaction serveur** : vérification de l'**identité**, de la
   **référence** et de sa **cohérence**, **confirmation de la référence**, puis **validation
   individuelle des opérations** ;
5. **Si une vérification échoue : aucune confirmation ni acceptation partielle** — la
   transaction est rejetée en bloc, la référence reste `prepared` et l'appareil **reste en
   réconciliation**.

Dans le parcours piggyback, la référence **ne devient une base causale utilisable qu'à
travers la validation transactionnelle du push** — elle n'est utilisable indépendamment en
aucun cas (tout autre usage d'une référence non confirmée est refusé : `unverifiable`).

**Sortie commune** : un push de réconciliation **entièrement accepté** estampe le **point de
contact** (transactionnel) → validité courante → le mode ordinaire reprend **naturellement**.
**Aucune réautorisation globale** ; les anciennes opérations ne sont **jamais poussées** ; un
appareil qui ne réconcilie pas reste pull-only indéfiniment, données et file préservées.

---

## 2. File de réconciliation — classification et réduction conditionnelle (consolidés, inchangés)

Classification : jamais vérifiable sur la seule supériorité de version — ordre des versions +
causalité (`base_ref` jeton **confirmé** lié à l'état réellement reçu) + fraîcheur de la
référence + validité d'appareil + horloge non invalide. Table des cas complète (v4.3 § 2.3).
Réapplication volontaire = opération neuve construite depuis l'état serveur courant, validée à
l'acceptation. **Réduction conditionnelle** : consolidation seulement si démontrée équivalente
(chaîne linéaire + surcharges intégrales + base causale la plus ancienne préservée) ; sinon
chaîne conservée — aucune intention perdue silencieusement.

---

## 3. A4 — quarantaine et cycle de vie par compte (consolidé, inchangé)

Quarantaine récupérable à travers sauvegarde/restauration/migration/évolution de format/
réinitialisation ; sauvegarde **préserve tout ou refuse avant toute mutation** ; procédure
destructive enrichie ; isolation par compte ; réinitialisation **préserve par défaut** file et
quarantaine ; déconnexion/changement de compte **conservent et isolent** ; suppression
volontaire = procédure complète.

---

## 4. Contrat de synchronisation — statuts déterministes (consolidé, ajusté)

Priorité `reconciliation_needed > refused > temporary_error > pending > ok` ; `overall` =
maximum par priorité ; statuts individuels push/pull/purge ; codes de refus serveur
(`stale-device`, `protocol-unsupported`, `stale-version`, `invalid-version`, `unverifiable`).
**Ajustement v4.6** : après un pull réussi et **enregistré mais non confirmé**, l'appareil est
en état `pending` (« état reçu, confirmation en attente ») — l'échec d'ack se manifeste comme
`temporary_error` (reprise automatique, idempotente) ; aucun état n'est jamais présenté comme
« synchronisé » tant que la chaîne pull → enregistrement → ack n'est pas complète.

---

## 5. A1 — chiffres réconciliés (v4.4 conservé, inchangé)

**498,1 Kio** = B1c, 2 000 tombstones seules (**mesure réelle**) ; **747,7 Kio** = 300 entrées
+ 2 000 tombstones (**mesure réelle**) ; **860,6 Kio** = 600 entrées (caps) + 2 000
tombstones (**mesure réelle**) ; **1 453,2 / 1 661,7 Kio** = **estimations Firestore** (M1b)
— dimension **document**, pas payload. Le chiffre « ≈ 1 731,8 Kio » (v4.2/v4.3) est **retiré**
(conflation des dimensions). Les mesures M1a portaient sur la **section stock seule** → la
mesure full-caps **toutes sections** reste à réaliser (prérequis de la valeur A1) ; la limite
HTTP = cette mesure × marge justifiée (arbitrage) ; le budget document reste gouverné par
l'estimateur.

---

## 6. Statut de chaque élément — principes validés, solutions proposées, arbitrages, garanties

**La validation d'un principe fonctionnel ne vaut pas approbation des détails de la solution
proposée.**

| Domaine | **Principe fonctionnel validé** | **Solution proposée (détails NON approuvés)** | **Arbitrages restants** | **Garanties à démontrer par les tests** |
| --- | --- | --- | --- | --- |
| **Causalité D3** | Causalité **vérifiée par le serveur** ; aucune ancienne opération acceptée sur la seule base de son HLC ; sans preuve → réconciliation | Mécanisme `state_ref` / `base_ref` | Format du jeton, rétention dans le registre, paramètres G1-G5, transitions | Vérification serveur des jetons ; ancien client direct ; sortie du pull-only |
| **Confirmation de réception (v4.6)** | **Un état non reçu n'est jamais un point de synchronisation confirmé** ; confirmation = preuve post-réception ; reprise idempotente sans perte ni blocage ; **une tentative de transmission n'est jamais une preuve de réception** ; **monotonie du point de connaissance** (maximum des horodatages confirmés, jamais un recul) | ACK dédié **ou** piggyback — dans les deux cas le point de connaissance n'avance que par la requête authentifiée qui confirme la référence, **après validation serveur** (identité, existence, cohérence ; l'état détermine le comportement : confirmer / succès idempotent / refuser) ; **deux parcours de sortie du pull-only** (§ 1.4) | **Ack dédié vs piggyback** ; délai d'abandon des références préparées ; purge du registre | Tous les scénarios de panne § 1.2 ; **validation serveur identique dans les deux variantes** ; **répétition légitime = succès idempotent, jamais un échec** ; `transmitted` jamais preuve de réception ; séparation point de contact / point de connaissance ; **deux parcours cohérents de bout en bout, aucune acceptation partielle en cas d'échec** ; **point de connaissance strictement monotone, jamais un recul** |
| **Validité / registre** | Validité vérifiée par le serveur ; pull-only des expirés ; purge par acceptation serveur | Registre, deux points (contact / connaissance), lecture de réconciliation transactionnelle | Paramètres V/R/M, M_min ; coût du chemin transactionnel (estimé) | Estampillage transactionnel multi-partitions (checklist doc-SDK, partagé avec A2) ; purge sous horloges décalées |
| **File de réconciliation** | Trois catégories ; ambiguës conservées ; réapplication = opération neuve ; aucune intention perdue | Table de classification ; conditions de réduction | Validation de la table et des conditions ; options de résolution | Chaque cas du tableau ; idempotence, reprise, re-classement |
| **Partitionnement** | Option B ; partitionnement dynamique ; sous-collections ; pas de correspondance un-à-un | Calcul p/N/débordement ; schéma physique | Bornes dérivées, N_max, marges | Instantanés ; concurrence multi-partitions ; capacité réelle ; débordement ; migrations/rollback ; collisions entre comptes |
| **A4** | Aucune perte silencieuse ; α ; quarantaine récupérable ; isolation par compte | Mécanisme de quarantaine | Détail de la récupération des malformations | Sauvegarde/restauration/migration/reset sans perte ; blocage des destructives |
| **Contrat de sync** | Priorité déterministe ; jamais de « synchronisé » trompeur | Forme à deux niveaux + codes de refus | Adoption formelle de la forme | Chaque chemin de `KitchenSync` ; combinaisons ; état `pending` post-pull |
| **Configuration BO** | Limites configurables, à chaud, historisées ; jamais de purge à la publication ; refus sans métriques | Fiches, invariant R ≥ V + M, simulation, audit | Périmètre phase 1 ; bornes d'usabilité | Validation globale ; simulation ; abaissement sans perte |

**Résultats déjà démontrés — qualifiés** : fusion par enveloppe idempotente et monotone ;
caps refusées sans écriture partielle (B1a-B1d) ; **émulateur Firestore : 19 passés / 8
échecs / 8 skippés sur 27 — les 8 échecs = A2/A3 : le chemin de production Firestore n'est pas
démontré tant qu'ils ne sont pas corrigés ; les tests existants ne sont pas généralisés.**

---

## 7. Configuration des limites depuis le backoffice (consolidé, inchangé)

Phase 1 : paramètres essentiels + invariant `R ≥ V + M` ; validation de cohérence globale
(refus expliqué et atomique) ; simulation avant publication (tombstones et appareils
concernés, **points de connaissance confirmés du registre**) ; audit/versionnement/retour
arrière compatible ; indicateurs minimaux. Jamais de troncature/suppression à l'abaissement,
jamais de purge à la publication, refus d'une rétention réduite sans métriques suffisantes.
Phase ultérieure : monitoring avancé.

---

## 8. Rétention — fiabilité du registre (mise à jour v4.6)

Le registre distingue **les états autoritatifs d'une référence** — `prepared` (créée par la
transaction) → `confirmed_received` (ACK ou piggyback **vérifié**) ou `abandoned` (non
confirmée dans la fenêtre) — et **deux points par appareil**. L'événement `transmitted`
(tentative de transport) est **non autoritatif** : il ne figure pas parmi les états du
registre et ne modifie **jamais** la validité ni la causalité — une tentative de transmission
n'est **jamais** une preuve de réception :

| Point | Signification | Usage |
| --- | --- | --- |
| **Point de contact confirmé** | Mis à jour après **un push entièrement accepté**, **un ACK dédié vérifié** ou **une requête piggyback vérifiée** | G2 — validité/vivacité de l'appareil |
| **Point de connaissance confirmé** | N'avance que lorsque la référence est **effectivement confirmée** (`confirmed_received`) — ACK dédié vérifié ou piggyback vérifié ; **strictement monotone** : maximum des horodatages serveur des références confirmées, **ne recule jamais** (§ 1.2) | G5 (base causale valide) ; **métriques de sécurité de purge** |

Traitement des cas : inconnu / ancien / métadonnées peu fiables / registre purgé → **au pire
cas sûr**. **Règle des transitions de rétention** : la simulation de sécurité d'une purge
repose **exclusivement sur les points de connaissance confirmés** ; tout appareil dont l'état
confirmé reçu n'est pas démontrable (jamais confirmé, ack en attente, métadonnées peu
fiables) compte au **pire cas** ; si les métriques ne permettent pas de démontrer qu'aucun
appareil ne perd la protection d'un tombstone purgé plus tôt, **la réduction est refusée** —
l'absence d'information n'est **jamais** une preuve que la purge est sûre. Références
préparées non confirmées : abandonnées dans la fenêtre V + marge, jamais utilisables comme
base causale.

---

## 9. Politique transversale des limites et indépendance du modèle logique (conservés)

Classification A-E, fiches de paramètre, validation de cohérence globale, simulation,
modification sans perte, versionnement/audit/retour arrière, surveillance phase 1 ; trois
niveaux d'indépendance, capabilités fournies par l'adaptateur, méthode commune par domaine,
pas d'abstraction universelle.

---

## 10. Exigence architecturale transversale : noyau commun de synchronisation et de réconciliation (consolidé, inchangé de fond)

**Une seule implémentation**, réutilisable sans duplication : identités/versions/causalité/
points de synchronisation (**dont la confirmation de réception § 1.2**) ; file, réconciliation,
quarantaine ; idempotence, reprise, statuts ; validité et anti-résurrection. Règles de fusion
et de classification **spécifiques et typées par domaine** (le noyau n'interprète pas le
métier) ; stockage indépendant (Firestore, PostgreSQL, SQLite, futur — adaptateurs au même
contrat fonctionnel) ; **socle commun de tests de conformité** + tests spécifiques par
adaptateur et par domaine ; F1 valide avec le stock, adoption progressive, **pas de migration
immédiate**, pas d'abstraction universelle complexe. Placement : règles pures dans `src/core`,
noyau dans `src/application`, adaptateurs dans `src/infrastructure`, composition dans
`src/app/container.ts`.

---

## 11. Tests d'acceptation (v4.5 § 11 conservé, complété)

**Complément v4.6 — confirmation de réception** :

- **Réponse perdue après le commit** : la référence préparée n'est **jamais** confirmée, est
  abandonnée dans la fenêtre ; l'appareil re-tire ; aucun point de synchronisation confirmé
  enregistré ;
- **Ack perdu** : re-ack idempotent au redémarrage (référence persistée localement) ; ou
  re-pull (fusion idempotente) — aucune perte, aucun blocage ;
- **Plantage avant ack** / **avant enregistrement local** : re-ack / re-tir ;
- **Ack réussi** : la référence devient base causale valide (G5) et point de connaissance ;
  **répétition légitime** (ack ou piggyback sur une référence déjà `confirmed_received` pour
  le même appareil) → **succès idempotent, aucun échec, aucune modification des points** ;
  référence `abandoned`, inconnue ou d'une autre identité → refus ;
- **Séparation des deux points** : le **contact** avance après **un push entièrement
  accepté**, **un ACK dédié vérifié** ou **une requête piggyback vérifiée** ; la
  **connaissance** n'avance que lorsque la référence est effectivement **confirmée** — sous
  le parcours piggyback, la même transaction de push peut faire les deux (contact +
  confirmation), **atomiquement** ;
- **Piggyback** (si retenu) : la confirmation sur la requête suivante — **validation serveur
  identique à l'ACK** (identité, état de la référence, cohérence) ; le push de réconciliation
  confirme sa base dans la même transaction après vérification ;
- **Parcours complet piggyback sur le push de réconciliation** : push portant une référence
  `prepared` → **confirmation et validation des opérations dans la même transaction** →
  **répétition de la requête après perte de réponse** (référence déjà `confirmed_received`
  pour le même appareil → succès idempotent ; opérations refusionnées à l'identique par
  version) → **aucune confirmation ni acceptation partielle en cas d'échec de vérification**
  (transaction rejetée en bloc, référence reste `prepared`, appareil reste en réconciliation)
  → **convergence correcte après reprise** ; la référence n'a jamais été une base causale
  utilisable hors de la validation transactionnelle du push ;
- **Monotonie du point de connaissance** : **deux références confirmées dans l'ordre
  inverse** de leur création (B, instantané de 11 h, confirmée avant A, instantané de
  10 h) → le point **reste à 11 h et ne recule jamais** ; **confirmations concurrentes** →
  mise à jour atomique, un seul résultat = le **maximum** ; **répétition après
  confirmation** → le point **ne change pas** (idempotence) ; **après une reprise ou une
  erreur** (re-ack, retry, plantage, reprise piggyback) → le point **ne recule jamais** ;
- **`transmitted` jamais autoritatif** : une tentative de transmission (même répétée) ne
  modifie jamais la validité ni la causalité ; seul un ACK ou un piggyback vérifié fait foi ;
- **Métriques de purge** : un appareil dont l'état confirmé reçu n'est pas démontrable compte
  au pire cas ; réduction de rétention refusée sans métriques suffisantes ;
- **Contrat** : pull enregistré non confirmé → `pending` ; échec d'ack → `temporary_error`
  (reprise idempotente) ; jamais « synchronisé » avant la chaîne complète.

Conservés de v4.3-v4.5 : lecture de réconciliation transactionnelle (jeton préparé dans la
transaction) ; aucun blocage permanent ; jetons/référence causale (nouvelle identité, identité
perdue, `unverifiable`) ; sortie du pull-only sans réautorisation ; version de protocole
déclarée interceptée par G5 ; réduction conditionnelle de file ; chiffres A1 (repro rejoué,
498,1 Kio → 200 ; mesure full-caps toutes sections) ; garde-fous contre un ancien client
direct ; registre (perdu/inconnu/peu fiable) ; classification complète ; purge par
acceptation serveur sous horloges décalées ; cycle de vie par compte ; transition de rétention
; recréation avant/après purge ; retours 91/120/150 j ; concurrence ; conservation ;
configuration ; stockage (isolation, capacité/débordement, cohérence Firestore/SQLite/
PostgreSQL) ; A2/A3/A4/contrat/mesures/B2 ; **Campagne A émulateur : 0 échec**.

---

## 12. Proportionnalité (mise à jour)

La confirmation de réception ajoute **un petit échange par pull** (ack dédié ou piggyback) et
**deux points** par appareil dans le registre — elle remplace une hypothèse invisible
(« le client a reçu ») par une preuve vérifiable, exactement là où la garantie
anti-résurrection en dépend. Aucun mécanisme théorique supplémentaire ; le noyau commun
concentre la complexité en un endroit testé. Solution compréhensible, performante, testable,
maintenable.

---

## 13. Ordre d'exécution recommandé (après arbitrages)

1. **A2+A3** (prérequis) → **A1** (mesure full-caps toutes sections puis limite) → **A4 α**
   (quarantaine + cycle de vie par compte).
2. **Noyau commun** (file, réconciliation, statuts, validité, **confirmation de réception** —
   socle de tests de conformité) → **registre d'appareils + jetons d'état + ack + garde-fous
   serveur** (purge par acceptation serveur) — après A2.
3. **Adaptateur partitionné** (sous-collections, calcul dynamique, débordement, tests de
   contrat) → **infrastructure de configuration** (invariant R ≥ V + M, simulation, audit).
4. **Stock : première adoption du noyau** (classification, réduction conditionnelle, sortie du
   pull-only) → **contrat de sync déterministe**.
5. **Migration paresseuse + rollbacks** → **mesures** (sizes par partition, M1a full-caps
   toutes sections) → **B2 à 2 000** → **Campagne A émulateur (0 échec)** → rapport → commits
   sur autorisation distincte → démonstration, nettoyage, portage documentaire.

---

## 14. Synthèse finale

### 14.1 Principes fonctionnels validés par le chef (acquises — indépendamment des solutions)

1. D-V1..D-V6 et les principes fonctionnels confirmés (§ 0).
2. **Causalité vérifiée par le serveur** ; aucune ancienne opération acceptée sur la seule
   base de son HLC ; sans preuve suffisante → réconciliation.
3. Validité vérifiée par le serveur ; pull-only des appareils expirés ou à protocole
   incompatible ; purge par **acceptation serveur** ; **aucun blocage permanent**.
4. **Un état non reçu n'est jamais un point de synchronisation confirmé** ; la confirmation
   exige une **preuve post-réception côté serveur** ; **une tentative de transmission n'est
   jamais une preuve de réception** ; la reprise est **idempotente, sans perte de données ni
   blocage permanent** ; distinction **point de contact / point de connaissance**.
5. Réconciliation générique (trois catégories, ambiguës conservées, réapplication = opération
   neuve construite depuis l'état serveur courant) ; réduction de file seulement si démontrée
   équivalente ; aucune intention perdue silencieusement.
6. α de A4 ; quarantaine récupérable ; isolation par compte.
7. Priorité déterministe du contrat de synchronisation.
8. Option B et partitionnement dynamique ; sous-collections ; pas de correspondance un-à-un ;
   rollbacks applicatif/physique distingués.
9. Configuration BO (à chaud, historisées, refus avant publication, jamais de purge à la
   publication, refus sans métriques) ; grandfathering écarté.
10. **Noyau commun de synchronisation et de réconciliation** (§ 10).

### 14.2 Solutions proposées (détails NON approuvés — arbitrage requis)

1. Mécanisme **`state_ref` / `base_ref`** avec les **états du registre** — `prepared`,
   `confirmed_received`, `abandoned` (état **terminal** d'une référence non confirmée) —
   et l'événement `transmitted` (transport **non autoritatif**, **jamais un état du
   registre**) ; confirmation par **accusé de réception** ou par **piggyback vérifié** ;
   **point de connaissance strictement monotone** (maximum des horodatages des références
   confirmées, **jamais un recul**, même après reprise).
2. **Ack dédié** (recommandé) vs **piggyback** (confirmation sur la requête suivante —
   validation serveur identique) ; **les deux parcours de sortie du pull-only** (§ 1.4) ;
   délai d'abandon des références préparées ; purge du registre.
3. Paramétrage des **garde-fous G1-G5** et codes de refus.
4. **Lecture de réconciliation transactionnelle** en phase 1 (tous les pulls transactionnels)
   — recommandée, alternative à arbitrer.
5. Table de classification et conditions de réduction de la file.
6. Fiches de paramètres, invariant R ≥ V + M, simulation, audit, périmètre phase 1.
7. Détails de la quarantaine.

### 14.3 Arbitrages encore nécessaires

1. Valeurs **V = 90 j, R = 120 j, M = 30 j** et **M_min**.
2. **Ack dédié vs piggyback** ; délai d'abandon des références préparées ; rétention des
   jetons dans le registre.
3. Format des jetons et paramétrage exact de **G1-G5**.
4. **Option de phase 1 pour les pulls** : transactionnels (recommandée) vs économiques sans
   estampillage (friction documentée).
5. Table de classification et conditions de réduction.
6. **A1** : marge et limite dérivée de la mesure full-caps toutes sections.
7. Gardes d'usabilité (C ≥ 100, entrées ≥ 20, rétention ≤ 365 j).
8. Périmètre phase 1 du backoffice.
9. Réécriture du test validé du scénario 6 — autorisation distincte.
10. Portage documentaire — autorisation distincte.

### 14.4 Garanties à démontrer pendant l'implémentation (jamais acquises avant leurs tests)

1. Cohérence multi-partitions **dans une transaction** (checklist doc-SDK, partagée avec A2) ;
   instantanés par requête unique ; concurrence multi-partitions du SDK.
2. Capacité réelle par partition, débordement, changement du nombre de partitions.
3. Absence de perte en migration et rollback.
4. Effectivité de G1-G5 et de la référence causale contre un ancien client direct ; **sortie
   du pull-only sans réautorisation — les deux parcours (ACK dédié / piggyback sur le push)
   cohérents de bout en bout, aucune confirmation ni acceptation partielle en cas d'échec** ;
   aucun blocage permanent.
5. **Confirmation de réception** : tous les scénarios de panne § 1.2 (réponse perdue, ack
   perdu, plantage avant ack, plantage avant enregistrement) — un état non reçu n'est jamais
   confirmé ; idempotence de l'ack — **répétition légitime = succès idempotent, jamais un
   échec** ; **validation serveur identique dans les deux variantes (ack dédié / piggyback)**
   ; `transmitted` jamais preuve de réception ; séparation contact/connaissance.
6. Idempotence de la réconciliation (rejeu, interruption, re-classement, réduction
   conditionnelle) ; réutilisabilité du noyau.
7. Fermeture de la résurrection automatique (recréation volontaire OK, ancienne opération
   jamais réintroduite).
8. Purge par acceptation serveur sous horloges client décalées ; métriques de purge fondées
   sur les points de connaissance confirmés.
9. Sauvegarde/restauration/migration/réinitialisation sans perte de quarantaines et de file.
10. **Le chemin de production Firestore complet** : campagne précédente 19/27 tests émulateur
    passés (8 échecs = A2/A3) — **0 échec** exigé après corrections.
11. Mesure full-caps **toutes sections** puis limite HTTP dérivée.

### 14.5 Prérequis techniques

1. **A2** (deux phases) — prérequis du commit multi-documents, du registre, des jetons, de la
   réconciliation.
2. **A3** (état par tentative, garde conservée) — prérequis des retries multi-documents.
3. **Mesure M1a full-caps toutes sections** — prérequis de la valeur A1 et des capacités
   dérivées de la chaîne HTTP.
4. **Checklist doc-SDK** (sémantique transactionnelle multi-partitions, deadline, requête
   unique) — prérequis de § 6 et § 1.3.
5. **Harnais de contrat étendu** (adaptateur partitionné, registre, jetons, ack,
   classification, conformité du noyau) — prérequis de toute exécution.
6. Environnement : 17 commits locaux et travaux non commités préservés (consigne).

---

**Fin du dossier v4.10 — clôture de la phase documentaire proposée.** La confirmation de
réception (point bloquant de la v4.5) est traitée avec la distinction exacte : les **états
autoritatifs du registre** sont `prepared`, `confirmed_received` et `abandoned` (état
**terminal** d'une référence non confirmée) ; **`transmitted` est un événement de transport
non autoritatif, jamais un état du registre** — une tentative de transmission n'est jamais
une preuve de réception. L'ack **idempotent** (répétition légitime = succès idempotent) et la
séparation contact/connaissance préservent la cohérence entre le `state_ref`, le registre
d'appareils et la garantie anti-résurrection, **dans les deux parcours explicites de sortie
du pull-only** (ACK dédié / piggyback sur le push de réconciliation), cohérents de bout en
bout et **sans acceptation partielle en cas d'échec** ; le **point de connaissance est
strictement monotone** — maximum des horodatages des références confirmées, **jamais un
recul**, même après reprise. Les vérifications techniques et arbitrages restants sont traités
dans les **lots d'exécution avec des autorisations distinctes** (ordre § 13). **Aucune
implémentation ne commence sans votre revue de ce dossier et une autorisation distincte.**
