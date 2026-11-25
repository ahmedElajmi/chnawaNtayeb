# Proposition — projection du payload métier v1 (`prepare`)

> **Statut : [PROPOSITION — en attente d'arbitrage utilisateur].** Rien de ce fichier n'est
> arbitré. La direction générale (projection métier minimale issue du domaine réel, option 1) est
> retenue par le chef ; la présente fiche la détaillée pour arbitrage. **Aucune implémentation ne
> peut commencer sur une projection supposée** (DC2-A03). Préalable arbitré : DC2-A01…A05
> (`analyses/arbitrages-utilisateur.md`). Vocabulaire : les noms de champs sont des propositions ;
> ils seront figés par l'arbitrage.

## 1. Objet et périmètre

Projection v1 du **payload métier** du contrat `prepare` — la partie du contrat **bloquante** pour
la finalisation de DC-2 (liste des champs = dernier point de décision, livrable A). Périmètre v1 :
**une seule intention protégée**, la **création d'une réservation** (SC-O13-03, condition (a) —
préinscription des intentions de création de réservation Reg1). Les intentions d'**effet métier
protégé** (condition (b)) et tout autre `kind` sont **hors v1** ; leur ajout passera par un
nouveau `cpv` (§ 9).

Sources du domaine réel citées : `src/core/kitchen/entries.ts` (`STOCK_LIMITS`,
`isLegalEntryId`, `utf8Length`, validation `quantity`), `src/core/kitchen/elementSets.ts`
(`ELEMENT_SET_LIMITS`), CLAUDE.md § 8 bis (garantie commune des identifiants), règle faisant foi
« les quantités ne sont jamais obligatoires », règle « présence ≠ quantité suffisante ».

## 2. Champs du payload v1

**Enveloppe** : liste blanche stricte — tout champ inconnu est rejeté (`refusal_payload_invalid`,
DC8-A01 D5) ; `null` explicite interdit (DC-3) ; **l'omission est la représentation de
l'absence**. L'identité (`device`, `epoch`, `opId`) est **hors payload** (domaine α, DC2-A02) ;
`token` / `usageTag` / `consumer` restent hors payload (A-3/A-6, matrice DC2-A01 — aucune
contrainte nouvelle inventée). Un digest fourni par le client est interdit.

| Champ | Type exact | Obligatoire | Contraintes | Sémantique DC-5 |
|---|---|---|---|---|
| `kind` | chaîne | oui | valeur de l'ensemble fermé v1 = `{"reserve"}` ; comparaison stricte (aucune normalisation, aucune casse alternative) | scalaire |
| `lines` | tableau d'objets | oui | **1..N** ; ordre préservé (§ 4) ; plafonds structurels DC-6 s'appliquent | **liste ordonnée** (P-7) |
| `lines[].ingredient` | chaîne | oui | garantie commune des identifiants + borne projetée (§ 3) | scalaire |
| `lines[].unit` | chaîne | **facultatif** — couplage strict : présente **si et seulement si** `quantity` est présente (§ 2 bis) | id d'unité du registre (`UnitInfo`, `kind` mass/volume/count) ; ≤ 32 caractères (référence `STOCK_LIMITS.unit`) | scalaire |
| `lines[].quantity` | nombre | **non** | si présent : entier exact, **strictement positif**, bornes (§ 5) | scalaire |

Une ligne porte `quantity` et `unit` **ensemble ou absents ensemble** — contrat explicite :

- `ingredient` : **obligatoire** ;
- `quantity` : **facultatif** ;
- `unit` : **facultatif**, mais **présente obligatoirement lorsque `quantity` est présente** ;
- `quantity` et `unit` **présents ensemble ou absents ensemble** ;
- **`unit` sans `quantity` : refusé** (règle du domaine en vigueur, `entries.ts` l. 289–297 :
  « unit without quantity is meaningless — they are required together ») ;
- **une ligne sans `quantity` ni `unit` reste valide** et représente une réservation de
  **présence** (§ 8).

Toute violation ⇒ `refusal_payload_invalid` (code existant — mapping DC8-A01 D6b, contrainte du
contrat DC-1/DC-2).

## 3. Identifiants `ingredient` et `unit` — formats et limites

- `ingredient` : garantie commune (CLAUDE.md § 8 bis, `isLegalEntryId`) — non vide, jamais `/`,
  jamais `.` ou `..` seul, jamais le motif réservé `__…__`, **aucune autre restriction de jeu de
  caractères** (e-mails, `guest:` et slugs restent légaux — aucune donnée existante exclue) ;
  bornes de longueur projetées : ≤ 1 500 octets UTF-8 et ≤ 1 000 caractères (références § 3 bis).
- **Mapping des violations de `ingredient` — corrigé selon DC8-A02** : `ingredient` est un
  **champ métier du payload** ; sa non-conformité ou son hors-borne relève du contrat DC-1/DC-2
  ⇒ **`refusal_payload_invalid`**. **A-6 n'est pas étendu aux identifiants métier par analogie** :
  `refusal_id_noncanonical` reste réservé aux **composantes d'identité** (`device`, `epoch`,
  `opId` — hors payload, transportées à part) lorsque ce mapping est applicable (DC8-A02). Si une
  future décision traitait l'identifiant métier comme composante d'identité, ce serait un
  arbitrage séparé, jamais une extension implicite.
- `unit` : ≤ 32 caractères (`STOCK_LIMITS.unit`) ; la référence au registre des unités
  (`UnitInfo`, `kind` mass/volume/count) est une contrainte **d'application** (exécution) — deux
  unités de familles différentes ne se convertissent jamais (règle units en vigueur) ;
  l'unité inconnue du registre est un refus **d'application**, jamais une normalisation de
  canonisation ; la canonisation n'applique **aucune** conversion ni normalisation d'unité.

### 3 bis. Références exactes des bornes d'identifiants (vérifiées dans le code en vigueur)

| Borne | Référence effective | Statut de l'application au payload |
|---|---|---|
| ≤ 1 500 octets UTF-8 | CLAUDE.md § 8 bis (« garantie commune des identifiants ») ; `src/core/kitchen/entries.ts`, fonction `utf8Length` (« the 1 500-byte common guarantee, checked without `TextEncoder` ») | garantie commune **[CONFIRMÉE]** dans le code en vigueur — son application au champ `ingredient` du payload est **[NOUVELLE PROPOSITION]** (elle régit aujourd'hui les ids d'entrée du stock) |
| ≤ 1 000 caractères | `src/core/kitchen/entries.ts`, `STOCK_LIMITS.id` (« Characters of one entry id — the worst escaped id stays under the common 1 500-byte guarantee ») | borne **exécutée pour les ids d'entrée** — son extension au champ `ingredient` est **[NOUVELLE PROPOSITION]** |
| ≤ 32 caractères (unit) | `src/core/kitchen/entries.ts`, `STOCK_LIMITS.unit` | idem — **[NOUVELLE PROPOSITION]** |

Ces bornes sont **vérifiables dans les sources disponibles** (code cité, relu aujourd'hui) ;
ce qui reste à arbitrer n'est pas leur valeur mais **leur application** aux champs métier du
payload — jamais présentée comme une retranscription historique.

## 4. Lignes — ordre, doublons, nombre

- **Ordre** : `lines` est une **liste ordonnée** au sens P-7 — l'ordre de déclaration est
  préservé, **jamais trié, jamais dédupliqué, jamais normalisé** ; il participe à l'empreinte.
  Sémantique métier de l'ordre (ex. priorité d'allocation en F3) : **hors périmètre du protocole**
  — le protocole garantit que deux payloads d'ordres différents portent des empreintes
  différentes, rien de plus.
- **Doublons** : deux lignes identiques **sont conservées** et produisent une empreinte distincte
  d'une ligne unique (la déduplication générique est interdite — DC-5 : « aucune déduplication
  générique ») ; le **raccordement en une seule réservation** ou en deux est une décision
  **d'application** (F3), jamais une normalisation de canonisation.
- **Nombre de lignes** : **aucune borne de comptage dédiée en v1** — **[RECOMMANDATION]**, jamais
  une décision. **Justification techniquement exacte** : DC-6 est une limite **structurelle en
  octets et en nœuds** (entrée 256 KiB, canonique 512 KiB, profondeur 64, 100 000 nœuds) — elle
  ne borne **pas** le nombre de lignes par un compteur dédié ; le nombre maximal de lignes
  effectivement admissibles **dépend de la taille minimale réelle d'une ligne** (un objet à
  trois champs et identifiants courts est de l'ordre de quelques dizaines d'octets — mais ce
  calcul n'est **pas démontré** et ne saurait servir de plafond). Ajouter un compteur dédié
  créerait une seconde limite à documenter, tester et maintenir sans contrainte technique
  démontrée. **Conséquences opérationnelles assumées** : un payload volumineux est rejeté par
  les plafonds d'octets avec `refusal_cap_exceeded` (message moins précis qu'un compteur dédié) ;
  une **limite métier au nombre de lignes peut exister à l'exécution** (par ex. reprise de
  `ELEMENT_SET_LIMITS.added` = 300) — couche d'application, jamais confondue avec le contrat de
  canonisation. Une borne de comptage dédiée au canon ne serait introduite que par un nouveau
  `cpv`, si une contrainte technique réelle et documentée l'exige — jamais par inventaire
  anticipé.

## 5. `quantity` — représentation, précision, bornes

| Contrainte | Proposition | Référence |
|---|---|---|
| présence | **facultatif** — la quantité n'est **jamais obligatoire** (décision faisant foi, jamais remise en cause par le schéma) | règles produit en vigueur |
| type | nombre JSON dont la valeur est un **entier exact** ; toute fraction (`.5`, exponentielle non entière) ⇒ `refusal_payload_invalid` | P-2 (grammaire JSON, double IEEE-754) |
| signe | **strictement positif** — `0` et négatif ⇒ `refusal_payload_invalid` | `entries.ts` l. 290 (`entry.quantity <= 0` refusé) |
| plafond de canonisation | **10¹⁵ si A-4 est arbitré sur ce champ** (§ 7) | A-4 / DC2-A05 |
| plafond d'application | ≤ 1 000 000 (`STOCK_LIMITS.quantity`) — contrôle **d'exécution**, jamais dans la canonisation | K-1 (contrat en vigueur) |
| précision | 10¹⁵ < 2⁵³ − 1 ≈ 9,007 × 10¹⁵ : tout entier admissible est représentable **exactement** en double ; l'injectivité est définie **sur la valeur analysée** (deux littéraux distincts de même valeur ⇒ même empreinte — documenté, testé, P-2) | fiche canon-prepare-v1 v6 |

**Règles métier sur les quantités déjà en vigueur** (citées, jamais inventées) : la quantité
n'est **jamais obligatoire** (règle produit faisant foi) ; la **présence ne prouve pas la
quantité suffisante** (non-décision faisant foi — la réservation de présence ne garantit rien
sur les quantités) ; une quantité déclarée est un entier **strictement positif** borné à
l'application (`STOCK_LIMITS.quantity` = 1 000 000, K-1) ; **jamais de troncature silencieuse** —
tout dépassement est un refus explicite.

**Absente ≠ zéro** : une **absence** est légale et signifie une réservation de **présence**
(§ 8) ; un **zéro explicite** est une valeur déclarée que le domaine en vigueur **interdit**
(quantité strictement positive) ⇒ refus typé, jamais interprété comme une absence. La distinction
est donc : absence = légal (présence) ; `0` = illégal (refus) ; l'empreinte distingue les deux
(l'omission n'est pas une valeur — omission = absence, DC-3).

## 6. Codes de refus applicables — existants confirmés, aucun code nouveau

La projection n'introduit **aucun code de refus** ; elle rattache chaque situation aux codes
**déjà confirmés** du corpus (livrable B, B5 ; arbitrages DC8-A01/A02) — **distinction respectée** :
identité ⇒ A-6 ; champ métier ⇒ `refusal_payload_invalid` lorsque la violation relève de
DC-1/DC-2 :

| Situation (projection v1) | Code applicable | Source du code |
|---|---|---|
| champ inconnu, champ interdit, `null` explicite | `refusal_payload_invalid` | Session A § 4 (nom confirmé), DC8-A01 D5 |
| structure JSON invalide, clé dupliquée, surrogate isolé, `-0` | `refusal_payload_invalid` | DC8-A01 D2 ; P-1/P-3/P-5 |
| **`ingredient` non conforme ou hors bornes (champ métier)** | **`refusal_payload_invalid`** (DC8-A02 : champ métier, violation relevant de DC-1/DC-2 — **pas** `refusal_id_noncanonical`, jamais étendu par analogie) | DC8-A01 D6b, DC8-A02 |
| `unit` sans `quantity`, `quantity ≤ 0`, fraction sur `quantity` (contraintes métier du contrat) | `refusal_payload_invalid` | règle du domaine en vigueur (`entries.ts` l. 289–297) ; DC8-A01 D6b |
| plafonds structurels DC-6 (octets, profondeur, nœuds) | `refusal_cap_exceeded` | Session A § 4 (nom confirmé), DC8-A01 D1/D7 |
| champ métier obligatoire manquant (`kind`, `lines`, `ingredient` ; `quantity`/`unit` requis ensemble) | mapping **par nature du champ** (DC8-A02 : `refusal_payload_invalid` pour un champ métier) — **D6a sans code arbitraire** | DC8-A01 D6a, DC8-A02 |
| composante d'identité manquante ou invalide (`device`, `epoch`, `opId` — hors payload) | A-6 et `refusal_id_noncanonical` **lorsque ce mapping est applicable** | DC8-A02 |
| situation non couverte par un code dont la sémantique est établie | **point ouvert conservé** — jamais de code inventé (DC8-A02) | DC8-A02 |

Le plafond d'application `STOCK_LIMITS` (10⁶) et l'unité inconnue du registre sont des refus
d'**exécution** (couche métier, en vigueur dans K-1), jamais des refus de canonisation — les
deux couches restent séparées (DC-1 : bornes métier par schéma, jamais de cap canonique
additionnel).

## 7. Cible du plafond A-4 (10¹⁵) — statuts séparés

| Élément | Statut | Source |
|---|---|---|
| **Plafond 10¹⁵ + contrainte d'entier exact** | **[CONFIRMÉ]** | Session A — livrable B (B4) |
| **Cible historique du champ** (auquel A-4 s'applique) | **[POINT OUVERT]** — aucune source accessible ne la nomme | livrable B (B4) |
| **Application à `lines[].quantity`** | **[NOUVELLE PROPOSITION]** — recommandée par l'assistant, soumise à l'arbitrage explicite du chef, **jamais présentée comme acquise** | présente fiche |

**Portée déjà arbitrée** (DC2-A05 `[DÉCIDÉ — PRÉCISION DE PORTÉE]`) : le plafond et l'entier
exact sont conservés « pour le champ auquel A-4 s'applique » et **ne sont pas étendus** à
`epoch`/`ordinal` sans confirmation documentaire de la cible.

**Justification de la proposition** (pour arbitrage) : (i) `quantity` serait l'unique champ
numérique libre du payload v1 ; (ii) même famille « quantité métier » ; (iii) 10¹⁵ < 2⁵³ − 1 :
garantit l'entier exact en double (sujet P-2) ; (iv) `epoch`/`ordinal` sont des compteurs de
protocole (A-6/DC-6), hors champ métier.

**Deux plafonds maintenus séparément, jamais confondus** : le plafond de **canonisation**
(10¹⁵ si arbitrée) s'applique au canon du payload ; le plafond **métier d'application**
(`STOCK_LIMITS.quantity` = 1 000 000) s'applique à l'exécution (K-1) — le canon est plus large,
l'exécution plus stricte, aucune couche ne remplace l'autre. **Alternative assumable** : ne pas
appliquer A-4 en v1 (point ouvert maintenu ; la quantité reste bornée par les contrôles
d'application). La confirmation de cette cible **est l'arbitrage demandé**, rien n'est figé avant.

## 8. Réservation sans quantité — conséquences métier

- Une ligne sans `quantity` **et sans `unit`** déclare une réservation de **présence** : le même
  modèle que l'entrée nue en vigueur (« bare-presence », jamais de quantité inventée —
  `entries.ts` l. 458, 728) ; une ligne avec `unit` mais sans `quantity` est **refusée** (règle
  en vigueur citée ci-dessus — « required together »), jamais interprétée comme une présence.
- L'empreinte porte l'absence **comme une absence** (omission = absence, DC-3) : deux intentions,
  l'une avec quantité, l'autre sans, portent des empreintes différentes — jamais réinterprétées
  l'une dans l'autre.
- L'interprétation d'allocation d'une réservation de présence (combien réserver lorsque la
  quantité n'est pas déclarée ; lien avec « présence ≠ quantité suffisante ») relève du **dossier
  F3** (recoupe B-F1-6, réexamen des réservations) — **le protocole de préparation ne décide pas
  cette sémantique** ; il garantit seulement que l'intention conservée est vérifiable telle
  qu'elle a été créée.

## 9. Portée de `kind = "reserve"` et périmètre v1

**Restriction de v1 à la création de réservation Reg1 — conséquences explicites :**

- **Intentions couvertes en v1** : uniquement les intentions de **création de réservation**
  (préinscription + création Reg1 — SC-O13-03, condition (a)). Un seul `kind` : `"reserve"`.
- **Intentions explicitement exclues de v1** : les intentions d'**effet métier protégé**
  (condition (b) de SC-O13-03) ; les **opérations ordinaires** (hors mécanisme, même décision) ;
  la **reprise du cas 4** (interdite en production avant les démonstrations O-13) ; toute
  rotation/clôture d'epoch (O-11, autre mécanisme).
- **Raison de la limitation** : la condition (a) est la classe pré-enregistrée **déjà nommée**
  par SC-O13-03 (option C restreinte, arbitrée) ; la condition (b) exige le **choix des classes
  pré-enregistrées** d'effets protégés, arbitrage séparé — restreindre v1 à (a) évite d'arbitrer
  la couverture des effets par supposition et permet de démontrer le contrat sur une seule
  intention.
- **Évolution** : tout ajout de `kind` (dont les classes d'effet de la condition (b)) ou tout
  changement de structure = **nouveau `cpv`** (DC-13) : les Reg1 existantes restent vérifiables
  avec le `cpv` qui les a créées, jamais recalculées silencieusement ; l'évolution est un
  arbitrage explicite, coordonné avec la taxonomie (aucun code de refus implicite).

## 10. Conséquences pour DC-2 — ce qui se débloque

Une fois la projection arbitrée : la liste des champs est figée ; le domaine du canoniseur, les
octets du digest (**quatre éléments conjoints** : champs, P-1…P-7, `cpv`, encodage UTF-8 →
SHA-256 → Base64URL 43) et les vecteurs de canonisation deviennent entièrement déterminés ; la
fiche de spécification DC-2 peut être finalisée ; **L2 reste conditionné à son GO** (aucun GO
donné). **Critères de validation de cette fiche** : liste blanche exhaustive et testable ;
sémantique DC-5 déclarée pour chaque champ ; absence ≠ zéro distinguée par l'empreinte ; aucune
règle métier inventée au-delà des références citées ; quantités jamais obligatoires respectées.
