# Lot F1 — A1 : complément au rapport de mesure full-caps

> **Statut** : complément analytique demandé par le chef (clarifications avant arbitrage).
> **Aucune modification de code, de `server/app.ts`, de configuration Express, de cap métier
> ni de document de référence** ; aucun commit. Ce complément complète
> `lot-F1-A1-mesure-fullcaps.md` ; il ne le remplace pas. Une correction chiffrée du rapport
> lui-même est consignée au § 3 (les pourcentages de marge de la première version étaient
> sous-estimés ; le calcul exact est posé ici).

---

## 1. Les deux champs sans limite structurelle — analyse vérifiée au code

### 1.1 `preferences` (objet libre)

**Validation et normalisation actuelles.**

| Couche | Ce qui existe (vérifié) | Source |
| --- | --- | --- |
| Route serveur | `asPreferences` : accepte **tout objet non-tableau**, aucun contrôle de clés, de taille, de profondeur ou de contenu ; stocké **tel quel** (dernier-écrivain-gagnant) | `server/routes/kitchenRoutes.ts` (`asPreferences`) |
| Client (core) | `normalizePreferences` répare les champs connus (langue, `mode`, `themeId`…), contrôle `pantryStaples` par `Array.isArray` **seulement** — ni type des éléments, ni unicité, ni volume | `src/core/preferences/defaults.ts` |
| Forme | `pantryStaples: string[]`, défaut = 5 ids ; **aucune cap** sur le tableau | `src/core/preferences/types.ts` / `defaults.ts` |

**Limites réelles, indirectes (aujourd'hui).**

1. **Transport HTTP** : la limite `express.json` de la route (100 Kio actuellement, 3 Mio
   proposé) borne de fait la taille de `preferences` — c'est la seule borne "dure" actuelle.
2. **Écriture en base** : le document kitchen passe par le `DataStore` — la validation JSON
   récursive du contrat s'applique au write : types simples uniquement, `undefined`/`NaN`/
   circulaires refusés, **profondeur bornée à 32 niveaux** (`assertJsonSafe`,
   `server/storage/validation.ts`). Elle ne borne ni le volume ni le nombre de clés.
3. **Document Firestore** : la limite de 1 Mio par document borne le document `kitchen/{uid}`
   fusionné — jusqu'à l'option B (stockage partitionné, validée), l'une de ses motivations
   (M1b : 1 661,7 Kio > 1 Mio).
4. **Copie locale** : le quota `localStorage` du navigateur (~5 Mio par origine, partagé avec
   tout le reste) borne la copie hors ligne de fait — un dépassement provoque un échec
   d'écriture local, jamais une troncature silencieuse.

**Pourquoi aucune limite structurelle explicite.** `preferences` a été conçu comme un petit
objet de réglages **appartenant à l'application** (champs fixes connus : langue, portions,
mode, thème, filtre) ; la route ne revalide pas ce que le client a normalisé. `pantryStaples`
(liste des permanents) est arrivé avec F1 (orientation B-F1-2 : « liste configurable contrôlée
par le core ») — le plafond implicite retenu était le **catalogue lui-même** (≈ 700 ids),
sans borne écrite. C'est un écart de contrat hérité, pas une décision de laisser sans borne.

**Risques (après le fix A1 à 3 Mio).** Un client bogué ou malveillant peut pousser un objet
`preferences` d'environ 3 Mio : stocké tel quel, renvoyé à chaque `GET`, synchronisé sur
tous les appareils (amplification lecture/écriture), mémoire du document fusionné (store +
merge + projections legacy), épuisement du quota localStorage côté client (échecs de sync),
et — tant que l'option B n'est pas déployée — échec d'écriture Firestore au-delà de 1 Mio de
document fusionné. La couche anti-abus existante (authentification, rate limit de sync,
transaction, validation JSON au write) ne borne ni le volume ni la cardinalité de cet objet.

**Limites structurelles raisonnables proposées (séparées d'A1 — § 2).**

### 1.2 Nom des articles de liste de courses

**Validation et normalisation actuelles.**

| Couche | Ce qui existe (vérifié) | Source |
| --- | --- | --- |
| Route serveur | `asGrocery` : valide **le nombre** d'articles (≤ 500 par liste) et le fait que ce sont des objets — **aucun contrôle des champs** (ni `name`, ni `quantity`, ni `id`, ni `unit`) ; stockés tels quels | `server/routes/kitchenRoutes.ts` (`asGrocery`, `asGroceryLists`) |
| Client (core) | `addGroceryItems` : le nom saisi est stocké **tel quel** (`name: item.name` — `normalizeName` sert uniquement au rapprochement de doublons) ; `quantity` accepte tout fini ≥ 0 ; aucun cap sur `name` ni sur l'id d'article | `src/core/grocery/groceryList.ts` |
| Champs voisins bornés | nom de **liste** ≤ 80, note de liste ≤ 300, id de liste ≤ 100, **comptages** : 20 listes × 500 articles | `MAX` (`kitchenRoutes`) |

**Limites réelles, indirectes.** Mêmes quatre couches que `preferences` (transport, validation
JSON du `DataStore` — profondeur 32, document Firestore 1 Mio, quota localStorage). Aucune
borne de taille sur `name` ni sur `quantity` n'existe dans le contrat.

**Pourquoi aucune limite structurelle explicite.** Historiquement, les articles venaient du
**catalogue** (noms d'ingrédients, courts et bornés de fait) ; les articles libres
(`is_custom`, saisie texte) sont venus plus tard sans cap. La cap métier pertinente a été
posée sur le **comptage** (500 par liste), pas sur la taille des champs.

**Risques.** Avec 20 listes × 500 articles, la section `groceryLists` est déjà le **dominant
du payload à caps** (1 334 245 octets = 54,8 % de C1) : des noms longs multiplient ce volume
(C3 illustre 300 caractères par nom → +144,6 Kio sur la seule liste legacy). Un objet `name`
de plusieurs dizaines de Kio par article est admissible aujourd'hui : amplification mémoire
et de sync identique à `preferences`.

### 1.3 Distinction des trois couches de protection (demandée)

| Couche | Rôle | État actuel |
| --- | --- | --- |
| **Limite de transport HTTP** (périmètre A1) | Protéger le processus des corps surdimensionnés ; s'applique **avant** toute validation ; un 413 n'est **jamais** un verdict métier | 100 Kio sur `/api/kitchen` (constat A1) ; 5 Mio sur vision et `/api/data` ; 100 Kio ailleurs ; valeur à arbitrer |
| **Limites métier et structurelles** | Borne l'**état légal** ; refus 400, rien d'écrit | Complètes sur les comptages (`MAX`, `STOCK_LIMITS`, `ELEMENT_SET_LIMITS` — non modifiées par A1) ; **lacune sur `preferences` et `name`/`quantity` d'article** (les deux champs échappent à cette couche) |
| **Protections contre payloads excessifs/malveillants** | Défense en profondeur | Authentification + jeton de session obligatoires ; rate limit de sync (`syncLimit`) ; une lecture + une écriture par push dans une transaction ; validation JSON récursive du `DataStore` au write (types simples, profondeur ≤ 32) ; quotas client (localStorage) ; limite document Firestore 1 Mio (jusqu'à l'option B) |

---

## 2. Recommandations de limites structurelles — présentées SÉPARÉMENT d'A1

**Ces bornes ne sont PAS des corrections A1** : elles sont une évolution de **contrat**
(`MAX` + validateurs de route + normalisation client, tests à côté), qui exige son propre
dossier, sa validation et son autorisation. Elles sont proposées ici pour décision
ultérieure, **aucune appliquée** :

| Champ | Borne proposée | Justification | Impact fonctionnel attendu |
| --- | --- | --- | --- |
| `preferences` | Registre **fermé de clés** (language, default_servings, mode, themeId, pantryStaples, dietary_filter) + taille totale sérialisée ≤ **16 Kio** + profondeur ≤ 2 | Aligné sur la convention du projet (« registre fermé ») ; un objet de réglages légitime dépasse rarement quelques Kio | Aucun usage réel affecté (les clés inconnues seraient refusées — comportement à définir : refus 400 ou écartement, au dossier) |
| `pantryStaples` | ≤ **300** ids, chaque id chaîne non vide ≤ 64 | Au-dessus de tout usage réel (catalogue = 700, la liste est une sélection) ; cohérent avec les caps par collection du projet | Aucun usage réel affecté |
| Article de liste `name` | ≤ **200** caractères | Aligné sur `ELEMENT_SET_LIMITS.id` ; les noms réels (catalogue + saisie libre) sont courts | Aucun usage réel affecté |
| Article `quantity` | fini, 0 ≤ q ≤ **1 000 000** | Aligné sur `STOCK_LIMITS.quantity` | Aucun usage réel affecté |
| Article `id` | ≤ **100** (comme `MAX.listId`) | Cohérence | Aucun usage réel affecté |

Alternative assumée : **ne rien ajouter** et laisser ces deux champs bornés par le transport
seulement (3 Mio) — cohérent avec l'état du projet (aucun client réel), au prix d'une
dette contractuelle documentée. Le choix appartient au chef, dans un dossier distinct.

---

## 3. Calcul exact de la marge de l'option « 3 Mio »

| Grandeur | Valeur exacte | Source |
| --- | --- | --- |
| Valeur de `limit: '3mb'` dans body-parser (`bytes`) | **3 145 728 octets** (= 3 × 1 048 576 = 3 Mio, vérifié : `bytes('3mb')` → 3 145 728) | exécuté le jour du complément |
| Payload maximal légitime mesuré (C1, accepté HTTP 200) | **2 435 950 octets** | rapport A1 § 2 |
| **Marge exacte (C1)** | 3 145 728 − 2 435 950 = **709 778 octets**, soit **+29,13 %** | calcul |
| Marge sur C2 (2 567 965 octets, refus métier) | 577 763 octets = **+22,50 %** | calcul |
| C3 (9 585 094 octets) | **> 3 145 728 → HTTP 413** (garde-fou transport, cas dégénéré jamais observé) | rapport A1 § 2 |

**Correction de la première version du rapport** : les pourcentages « ≈ +23 % » (C1) et
« ≈ +18 % » (C2) étaient **sous-estimés** ; les valeurs exactes sont **+29,13 %** et
**+22,50 %**. La ligne correspondante de la consolidation (L4, bloc A1) devra être corrigée
en conséquence **avec votre accord** (document de référence).

**Comportement attendu au-delà de la limite.** `express.json` (body-parser) rejette le corps
**avant** tout gestionnaire de route : **HTTP 413**, rien n'est lu en mémoire au-delà de la
cap, rien n'est écrit, aucun verdict métier n'est produit. Côté client : la section reste en
attente (`pending`), l'état local intact, reprise au prochain déclencheur (comportement
existant, testé) — la franchise connue « aucun message UI pour un échec de sync » reste
hors périmètre (demandable séparément).

**Tests nécessaires à l'implémentation** (fichiers commités — modification soumise à
l'autorisation d'implémentation distincte) :

| Test | Critère |
| --- | --- |
| Push légitime > 100 Kio (B1c : 498,1 Kio, et idéalement un corps ~2,3 Mio de forme C1) | **HTTP 200**, état stocké, `GET` retourne les sections |
| Corps synthétique > 3 145 728 octets (hors de tout état légal) | **HTTP 413**, rien de traité |
| Bornes exactes | juste sous la limite avec un corps légal → 200 ; à la limite + 1 → 413 |
| Caps métier B1a–B1d | **restent des 400** — le changement de transport ne transforme jamais un refus métier |
| Autres endpoints | inchangés : 100 Kio (petits JSON), 5 Mio (vision, `/api/data/*`) |
| Reproductibilité | deux exécutions, mêmes résultats |

---

## 4. Recommandation finale et conséquences

**Recommandation** : **option 1 — limite dédiée `/api/kitchen` = `3mb` (3 145 728 octets)**,
une constante nommée avec le chiffrage cité en commentaire, appliquée **uniquement** par une
branche du sélecteur existant de `server/app.ts` (aucun élargissement des autres endpoints).

**Conséquences** :

- Couvre **tout état légitime mesuré** (C1 à +29,13 %, C2 à +22,50 %) ; la capacité cible de
  2 000 tombstones et l'option B (stockage partitionné) restent **intégralement préservées** ;
  aucune cap métier n'est modifiée.
- Ne couvre pas C3 (9,14 Mio) : refus transport assumé comme garde-fou, documenté, jamais
  observé en pratique.
- L'écart résiduel « champs sans cap structurelle » (`preferences`, `name`/`quantity`
  d'article) reste ouvert : il relève d'un **dossier de contrat distinct** (§ 2), pas d'A1.
- Dès votre arbitrage, l'implémentation (une constante + une branche + les tests du § 3)
  attendra votre **autorisation d'implémentation distincte** ; les fichiers de test sont
  commités — leur modification sera listée explicitement dans la demande.
