# Lot F1 — Mesure A1 : payload PUT /api/kitchen full-caps (toutes sections à capacités maximales)

> **Statut** : rapport de mesure — soumis à l'arbitrage du chef. **Aucune modification de code
> ou de configuration A1 n'a été appliquée** : la limite de production reste 100 Kio
> (`express.json` sur `/api/kitchen`, `server/app.ts`) ; le serveur de mesure relève la sienne
> à 5 Mio (convention de l'étape 3) pour laisser la validation métier répondre. Aucun commit.
> Prérequis exigé par le dossier d'arbitrage v4.10 (§ 5 : « la mesure full-caps **toutes
> sections** reste à réaliser (prérequis de la valeur A1) » ; § 14.5, prérequis 3).
> Harnais : `scripts/diagnostics/measure-a1-fullcaps.ts` (nouveau, non commité, conservé).

---

## 1. Ce qui a été mesuré, et comment

### 1.1 Caps relevées dans le code (sources, le jour de la mesure)

| Section | Caps | Source |
| --- | --- | --- |
| `favorites` / `fridge` / `pantry` (sets legacy) | `added` ≤ 300 éléments · `removed` ≤ 2 000 · id ≤ 200 caractères · device ≤ 64 | `ELEMENT_SET_LIMITS` (`src/core/kitchen/elementSets.ts`) + `MAX.sets` (`server/routes/kitchenRoutes.ts`) |
| `stock` | 300 entrées **par emplacement** (= 600) · 2 000 tombstones (stock entier) · id ≤ 1 000 · note ≤ 300 · unit ≤ 32 · quantité ≤ 1 000 000 | `STOCK_LIMITS` (`src/core/kitchen/entries.ts`) |
| `groceryLists` | 20 listes × 500 articles chacune · nom ≤ 80 · note ≤ 300 | `MAX` (`kitchenRoutes`) |
| `groceryList` (legacy) | 500 articles | `MAX.grocery` |
| `weeklyPlan` | 14 jours | `MAX.planDays` |
| `groceryMeta` (legacy) | note ≤ 300 | `MAX.note` |
| `preferences` | **aucune cap structurelle** — objet libre (constat, § 4) | `asPreferences` (`kitchenRoutes`) |

### 1.2 Données

Catalogue factice de **700 ingrédients** (mêmes formes d'identifiants que le harnais de
l'étape 3 : `perm0…perm7`, `ing0008…ing0699`) ; articles de liste, recettes (`rec0000…`), ids
d'entrée de stock dérivés par la fonction du core `presenceEntryId` (≈ 20 caractères). Trois
configurations, toutes aux **comptages maximaux** :

| Config | Définition | Nature |
| --- | --- | --- |
| **C1 — projection-cohérent** | stock aux caps (600 entrées enrichies + 2 000 tombstones), legacy fridge/pantry = **projection serveur** de ce stock (fonction du core `projectStockToLegacy`), favoris 300+2 000, courses 20 × 500, plan 14 j, groceryList 500, meta, préférences (700 staples) | **pire cas réaliste d'un client légitime** — état accepté (HTTP 200) |
| **C2 — sections indépendantes** | C1 mais legacy fridge **et** pantry portent chacun leurs propres caps (300 ajoutés + 2 000 retraits) indépendamment du stock | pire cas contractuel **en comptages** ; la limite transport s'applique **avant** toute validation métier, donc les octets comptent même si l'état fusionné serait refusé par les caps du stock |
| **C3 — champs aux bornes** | C2 plus chaque champ dont la cap est atteignable par un client : note de stock 300 caractères (× 600), ids de favoris 200 caractères, device 64 caractères, ids d'enveloppe de stock à la borne `STOCK_LIMITS.id` (1 000 caractères — **admissibles au contrat, jamais observés en pratique**) | **borne extrême contractuelle** — sensibilité, pas cas d'usage |

Deux champs restent réalistes dans toutes les configurations, avec justification :

- **`unit`** : vérifiée par le registre — une unité de 32 caractères serait refusée comme
  inconnue ; la borne `unit` n'est **pas** atteignable par un client légitime (mesurée « pièce »).
- **Champs sans cap contractuelle** (nom d'article de liste, `preferences.pantryStaples`) :
  laissés réalistes dans C1/C2 ; C3 illustre le nom d'article à 300 caractères **comme
  illustration, jamais comme garantie** — l'absence de cap est un constat à traiter en
  arbitrage (§ 4).

### 1.3 Conditions de mesure

- Node **v26.13.0**, `tsx`, sérialisation `JSON.stringify` mesurée par
  `Buffer.byteLength(..., 'utf8')` ; gzip informational (`gzipSync`, niveau 6).
- **Deux exécutions indépendantes par configuration** — octets identiques
  (**reproductibilité : OUI pour les trois configurations**).
- Vérification d'acceptation : routes **réelles** Express in-process, store mémoire, registre
  préchargé (700 ingrédients), compte créé par les vraies routes d'authentification,
  `PUT /api/kitchen` réel — **limite du serveur de mesure relevée à 5 Mio** (convention
  étape 3) ; **jamais le serveur du chef (port 3000), jamais de données réelles, aucun
  commit**.

## 2. Résultats (mesures du jour, reproductibles)

| Config | Payload JSON | gzip (niveau 6) | Acceptation par les routes réelles (limite relevée) |
| --- | --- | --- | --- |
| **C1** — projection-cohérent (légitime) | **2 435 950 octets = 2 378,9 Kio = 2,32 Mio** | 156,9 Kio | **HTTP 200 — accepté** |
| **C2** — sections indépendantes (comptages) | **2 567 965 octets = 2 507,8 Kio = 2,45 Mio** | 166,9 Kio | HTTP 400 (`stock-caps`) — refusé **par la validation métier** (les tombstones legacy indépendantes dépassent la cap du stock après fusion) |
| **C3** — champs aux bornes (extrême) | **9 585 094 octets = 9 360,4 Kio = 9,14 Mio** | 198,0 Kio | HTTP 413 — dépasse **même la limite de mesure** de 5 Mio (le corps est rejeté avant toute validation) |

### Répartition par section (config C1, décroissante)

| Section | Octets | Part |
| --- | --- | --- |
| `groceryLists` (20 × 500 articles) | 1 334 245 | **54,8 %** |
| `stock` (600 entrées + 2 000 tombstones) | 702 600 | 28,8 % |
| `favorites` (300 + 2 000) | 151 874 | 6,2 % |
| `fridge` (legacy, projection) | 151 855 | 6,2 % |
| `groceryList` (legacy, 500) | 66 678 | 2,7 % |
| `pantry` (legacy, projection) | 19 872 | 0,8 % |
| `preferences` (700 staples) | 7 148 | 0,3 % |
| `weeklyPlan` (14 jours) | 1 579 | 0,1 % |
| `groceryMeta` | 94 | < 0,1 % |

### Rapprochement avec les mesures antérieures

Les chiffres M1a antérieurs (747,7 / 860,6 Kio) comprenaient toutes les sections **mais une
seule liste de courses de 30 articles**. Le document full-caps révèle que le **dominant
n'est pas le stock mais les listes de courses** (54,8 % du payload à caps) : 20 listes ×
500 articles = 10 000 articles ≈ 1,3 Mio. Le pire cas légitime est donc **≈ 3,2 fois** le
chiffrage précédent (2 378,9 vs 747,7 Kio).

## 3. Limites rencontrées

1. **C2/C3 refusés par la validation métier** (`stock-caps`) : un PUT indépendant aux caps
   legacy dépasse la cap de tombstones du stock après fusion. Les octets restent pertinents
   pour le transport (la limite s'applique avant validation), mais l'état final n'est pas
   stockable — le pire cas **légitime et stockable** est C1.
2. **C3 dépasse la limite de mesure elle-même** (9,14 Mio > 5 Mio → 413) : la borne extrême
   contractuelle n'est couverte par **aucune** limite existante ou proposée (5 Mio compris).
3. **Champs sans cap** : `preferences` est acceptée comme objet libre par la route ; le nom
   d'un article de liste n'a pas de cap. Un état de 2 Mio pourrait être fabriqué par ces
   champs seuls. Constat consigné ; toute décision de borne sur ces champs est une évolution
   de contrat distincte, non entreprise ici.
4. `unit` à la borne (32 caractères) **non atteignable** (registre) — exclus de la borne.

## 4. Options soumises à l'arbitrage (aucune appliquée)

La décision attendue porte sur trois paramètres : **marge**, **valeur de la limite HTTP**,
**solution technique**. Base de chiffrage : pire cas légitime **C1 = 2 435 950 octets**
(2,32 Mio). Les pourcentages exacts sont calculés au complément
(`lot-F1-A1-mesure-fullcaps-complement.md` § 3) ; la première version de ce tableau
les sous-estimait — corrigée.

| Option | Description | Avantages | Inconvénients / conséquences |
| --- | --- | --- | --- |
| **1 — Limite dédiée 3 Mio** (recommandation) | Constante nommée pour `/api/kitchen` (une branche dans le sélecteur existant de `server/app.ts`) | Couvre **tout cas légitime mesuré** (C1 2,32 Mio avec **+29,13 %** de marge ; C2 2,45 Mio à **+22,50 %** — chiffrage exact au complément) ; surface d'acceptation bornée (3 Mio vs 5 Mio) ; minimal, testable (200 légal / 413 au-delà / caps métier restent des 400) | Ne couvre pas C3 (9,14 Mio — cas dégénéré au-dessus de tout raisonnable) : refus transport assumé comme garde-fou ; jamais observé en pratique |
| **1 bis — Limite dédiée 4 Mio** | Idem, marge ≈ **+72,1 %** (4 194 304 − 2 435 950 = 1 758 354 octets) | Marge plus confortable face à l'incertitude des champs sans cap (preferences, noms d'articles) | Surface d'acceptation 4 Mio par requête par client ; écart transport/contrat (C3) inchangé |
| **2 — Réutiliser `bigJson` (5 Mio)** | Aucune nouvelle constante | Simplicité absolue | Surface de 5 Mio sur **chaque** requête kitchen ; **C3 non couvert quand même** (9,14 > 5) ; ne résout pas mieux que l'option 1 |
| **3 — Compression du corps (client gzip + décompression serveur)** | Le client compresse (C1 = **156,9 Kio** gzip) ; une limite dédiée ~250–300 Kio suffirait | Limite transport **~10× plus petite** ; coût CPU modéré (gzip niveau 6 sur 2,3 Mio) | **Nouveau mécanisme** client + serveur (encodage, négociation, tests, adaptation future native) ; express.json ne décompresse pas nativement ; complexité durable pour un pire cas rare |
| **4 — Réduire les caps concernées** (ids de stock ≤ valeur réaliste, borne sur `preferences`/noms d'articles, réévaluation des 20 × 500 listes) | Évolution de **contrat** (`STOCK_LIMITS`, `MAX`), pas seulement transport | Resserre l'espace contractuel (C3 cesse d'exister) ; cohérence transport/contrat | Modifie des caps validées (option B, capacité 2 000 tombstones conservée) → décision structurante distincte ; plus lourd que la demande A1 |

**Remarque d'honnêteté** : quelle que soit l'option, la **capacité cible de 2 000 tombstones
et l'option B (stockage partitionné) restent préservées** ; la limite HTTP n'est qu'un
garde-fou transport au-dessus de tout état légitime, les caps métier (`withinStockCaps`,
B1a–B1d) restant la protection de référence.

## 5. Ce que cette mesure ne prouve pas

- Aucune validation sur **Firestore en production** (option B, lot 1.5) — l'acceptation
  HTTP 200 a été obtenue sur store mémoire, routes réelles.
- Aucun correctif A1 n'est appliqué ni proposé sous forme de code : la valeur, la marge et
  la solution restent **à l'arbitrage du chef** (arbitrage v4.10 § 14.3, point 6).
- Le harnais et ce rapport sont des artefacts de mesure non commités, conservés en l'état.

## 6. Recommandation technique (soumise, non appliquée)

**Option 1 — limite dédiée 3 Mio** : elle couvre le pire cas légitime mesuré avec une marge
honnête (~+23 %), reste cinq fois plus petite que la surface `bigJson`, se limite à une
constante nommée + une branche + des tests (200 légal > 100 Kio, 413 au-delà, caps métier
inchangées en 400), et documente explicitement la borne non couverte (C3) comme refus de
garde-fou. La marge et la valeur restent la décision du chef.
