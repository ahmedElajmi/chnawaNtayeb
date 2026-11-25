# F1 — Frigo à entrées : modèle, synchronisation, migration (dossier fonctionnel, **v8**)

**Statut : version consolidée — orientations B-F1-1 à B-F1-6 retenues par le chef ; soumis à la
validation finale du dossier fonctionnel. Aucune implémentation, aucun commit, aucune migration
exécutée. Premier dossier fonctionnel prioritaire de la roadmap réorganisée** (doc
`reorientation-roadmap-carte-fonctionnelle.md`, AR-1 ✅ : l'expérience frigo/courses (E4) attend
ces fondations). Base de conception : **V12 § 8 « Le frigo : entrées souples — présence d'abord,
quantité quand elle est connue » (conception déjà validée — adoptée, non réinventée)**, complétée
de l'état réel du code vérifié pour ce dossier.

**Contexte réel retenu (chef)** : **l'application ne compte actuellement aucun client.** Aucun
protocole de compatibilité avec un parc d'anciennes versions clientes n'est nécessaire. Ce qui
doit être protégé : **les données éventuellement déjà présentes, les comptes de test, et la
synchronisation multi-appareils d'un même utilisateur.**

**Révisions** : v1 (proposition initiale) · v2 (distinction modèle/stockage ; réversibilité =
exigence démontrée ; scission `KitchenStore` ; volumes représentatifs ; couverture du cahier des
charges) · v3 (frontières F1/F2/F3 resserrées ; réservations hors modèle) · **v4** — orientations
retenues intégrées : **`StockEntry` + `location`** (frigo et placard unifiés, vues distinctes) ;
**liste configurable contrôlée par le core** pour les permanents ; **protocole de transition
simplifié vers la section `stock`** (aucune coexistence de versions clientes à maintenir) ;
**HLC retiré du modèle métier** (métadonnées de synchronisation) + test explicite
modification/suppression concurrentes ; **réservations confirmées hors F1 et hors colonnes SQL
proposées** ; **deux scénarios de retour arrière** (avant/après enrichissement) ; précisions
`location`, `unit`, `exhausted_at`, `expires_at`, entrées actives, bornes. · **v5** — corrections
ciblées : **cas critique de la synchronisation tardive d'un ancien format après migration** (§ 7
quater — stratégie sûre à définir au dossier d'exécution, jamais un choix arbitraire ici) ;
**sémantique de `permanent` précisée** (marqueur qualitatif de présence habituelle, pas un stock
physique quantifié — § 2.5, § 4.1) ; **vocabulaire corrigé : F1 gère la présence déclarée, pas la
disponibilité réelle** (présence simple / permanent actif = qualitativement présent / permanent
épuisé = temporairement déclaré absent — § 4.1) ; **précisions reportées au dossier d'exécution**
(§ 15). · **v6** — deux corrections ciblées : **type SQL d'`exhausted_at` non figé** (§ 8 —
déterminé au dossier d'exécution après arbitrage de la convention temporelle, cohérent entre
modèle TS, Firestore, colonne SQL et comparaisons métier) ; **commentaire du modèle `StockEntry`
corrigé** (§ 4 — une entrée = un élément physique ou un marqueur qualitatif `permanent`). ·
**v7** — derniers ajustements : **tombstones historiques intégrés au § 7 quater** (les tombstones
déjà présents dans les anciens `ElementSet` au moment de la migration — traitement, rapprochement
des opérations hors ligne, cohérence des suppressions multi-entrées, aucune suppression perdue
puis annulée involontairement ; tests couvrant les suppressions **antérieures** à la migration) ;
références de version actualisées (§ 4.5, § 14, § 15). · **v8** — derniers ajustements :
**références de version § 14 et § 15 portées à v7** (§ 4.5 conservé comme référence historique) ;
**convention temporelle du § 15.1 clarifiée** — chaque champ a une convention temporelle
explicite, cohérente avec sa sémantique et uniforme dans les quatre lieux (modèle TS, Firestore,
colonne SQL, comparaisons métier) ; **le même type n'est pas imposé aux deux champs**
(`expires_at` reste une date calendaire à la précision du jour ; `exhausted_at` sera défini au
dossier d'exécution selon sa sémantique réelle).

---

## 1. Objectif fonctionnel

Passer le stock personnel d'un **ensemble d'identifiants** (« je possède des tomates ») à des
**entrées physiques souples** (« un paquet de X, quantité connue ou non, péremption éventuelle,
permanent ou non ») sans jamais imposer la saisie de quantités et sans jamais faire d'une quantité
inconnue un zéro, un illimité ou un suffisant.

Ce que F1 livre : **le modèle, ses règles de validation, sa synchronisation offline-first
multi-appareils, sa migration et sa compatibilité SQL/Firestore** (préparation 6a) — **le modèle
seulement, pas les règles métier qui l'exploiteront** (disponibilité = F2, allocation et verdicts
= F3, § 4.3). Ce que F1 **ne fait pas** : aucune évolution du moteur (F3), aucune conversion
(F2), aucune refonte d'écran (E4) — l'app reste fonctionnelle à l'identique pendant le lot (§ 7).

## 2. Principes non négociables (V12 § 8 + instructions du chef)

1. **Utilisable sans jamais saisir une quantité** — deux modes cohabitent : **simple** (présence
   seule) et **avancé** (quantités quand elles sont connues).
2. **Quantité inconnue = vraie situation métier**, jamais une valeur artificielle (pas de
   999 999) : ni zéro, ni illimité, ni suffisante.
3. **Présence qualitative ≠ disponibilité quantitative vérifiée** — le moteur doit pouvoir
   distinguer les deux (la distinction devient exploitable en F2/F3 ; F1 la rend _représentable_).
4. **Une entrée ordinaire = un lot ou un élément physique** présent dans le frigo ou le placard ;
   plusieurs entrées du même ingrédient s'additionnent quand les unités sont compatibles
   (l'addition = lecture, règle F2 ; F1 garantit seulement qu'elle est représentable).
5. **Une entrée `permanent` = un marqueur qualitatif de présence habituelle** d'un ingrédient —
   **elle ne représente pas un stock physique quantifié** (V12) : elle signifie que l'utilisateur
   considère habituellement disposer de cet ingrédient, **sans garantir une quantité disponible**.
   Réservé aux ingrédients de base et épices (liste contrôlée par le core, B-F1-2 ✅) ; deux états
   simples : **actif (qualitativement présent) / temporairement épuisé (temporairement déclaré
   absent)**, réactivation en un geste — **F1 porte l'information (actif/épuisé), les règles
   métier restent F2/F3**.
6. **Réservations : hors modèle F1** (B-F1-6 ✅, § 4.3) — réexamen en F3 (allocation), lien
   planning éventuel en E5 ; aucun champ sans fonctionnalité qui le consomme ; tout ajout
   ultérieur sera arbitré **et testé dans le lot concerné** (jamais considéré automatiquement sans
   impact).
7. **Proportionnalité** : modèle d'un seul domaine, pas de moteur générique de gestion de stocks,
   pas de champ « au cas où » ; pas de complexité de compatibilité au-delà du besoin réel
   (aucun parc de clients existant).

## 3. État actuel vérifié (base de la migration)

| Élément                                                                                                                                                                                                                                                                                       | Vérifié                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Frigo, placard, favoris = **ensembles à versions HLC** (`ElementSet` : `added`/`removed` par `(physical, counter, deviceId)`, présence dérivée, tombstones = suppression propagée, purge serveur 90 j + remise à zéro de l'appareil périmé)                                                   | `src/core/kitchen/elementSets.ts`                                |
| Sync kitchen par sections : ensembles fusionnés pour `favorites/fridge/pantry`, **dernier écrit gagnant** pour menu/listes/préférences ; push debouncé 2 s, pull au démarrage/connexion/visibilité (≤ 1/min), échec = reste en attente, rien ne se perd ; les invités ne synchronisent jamais | `src/application/kitchen/KitchenSync.ts`                         |
| Serveur : document kitchen par compte, sections validées, même règle de fusion                                                                                                                                                                                                                | `server/routes/kitchenRoutes.ts`                                 |
| Moteur : consomme des **ids** (frigo + placard via `useMatchingInputs`) — présence seule, sans quantité                                                                                                                                                                                       | `src/features/recipes/hooks.ts`, `src/core/matching/analysis.ts` |
| UI actuelle : ajoute/retire des ids ; deux vues distinctes (frigo / placard)                                                                                                                                                                                                                  | `src/features/fridge/`                                           |
| Limites/bornes ensembles : 300 présents, 2 000 tombstones, id ≤ 200, device ≤ 64                                                                                                                                                                                                              | `ELEMENT_SET_LIMITS`, `TOMBSTONE_RETENTION_MS`                   |

## 4. Modèle métier (V12 § 8 adopté — **réservations exceptées**, B-F1-6 ✅)

```ts
/** One stock entry representing either:
 *  - a physical item or lot;
 *  - a qualitative marker of habitual presence (permanent).
 *
 *  Presence first, quantity when it is known.
 *  Business model only: no storage or synchronization details
 *  (fridge OR pantry — B-F1-1 ✅ ; HLC lives in the sync envelope, § 6). */
export interface StockEntry {
  id: string; // stable, unique among entries (§ 4.4)
  ingredient_id: string; // référence catalogue (générique ou variante — jamais fusionnée)
  /** Where the item physically lives; the two functional views of the app stay distinct */
  location: 'fridge' | 'pantry'; // required (B-F1-1 ✅)
  /** Absent = presence only (« j'en possède ») — NEVER zero, unlimited or sufficient */
  quantity?: number;
  unit?: string; // required together with quantity — stable reference to the
  // unit registry (@/core/units), NOT a free display label
  /** Péremption : DLC dépassée = indisponible ; DDM dépassée = déclassé, pas supprimé
      (règles métier = F2 ; F1 stocke et affiche l'information) */
  expires_at?: string; // ISO 8601 date (day precision, see § 4.5)
  expiry_type?: 'DLC' | 'DDM'; // required together with expires_at
  permanent?: boolean; // stock habituel (catégories autorisées par le core, B-F1-2 ✅)
  exhausted_at?: string; // « je n'en ai plus » → present = temporairement épuisé ;
  // absent = actif (réactivation = suppression de la date, § 4.5)
  origin: 'manual' | 'photo' | 'import'; // obligatoire — la photo propose, l'utilisateur confirme
  note?: string;
  added_at: string; // ISO 8601, à la création
}
/** ⚠️ Aucun champ de réservation dans le modèle F1 (B-F1-6 ✅) — ni ici, ni dans la cible SQL
    (§ 8). Un besoin réel futur sera arbitré et testé dans le lot concerné (F3/E5). */
/** ⚠️ Aucune métadonnée HLC/sync dans ce type — enveloppe de synchronisation distincte (§ 6). */
```

### 4.1 Sémantique (V12 § 8, résumée — texte de référence = V12)

| Situation                                        | Ce que le stock dit (vocabulaire : **présence déclarée**, pas disponibilité réelle)                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Présence seule (sans quantité)                   | ingrédient **déclaré présent / possédé** — jamais illimité ni suffisant ; la disponibilité réelle = F2/F3                                                                                      |
| Quantité renseignée                              | présence déclarée + vérification quantitative **possible** (F2/F3)                                                                                                                             |
| Permanent actif                                  | ingrédient **qualitativement présent** (marqueur de présence habituelle) — jamais une quantité ; **F1 ne modélise que l'information** (actif/épuisé) ; les règles métier sont **F2/F3**        |
| Permanent épuisé                                 | ingrédient **temporairement déclaré absent** (réactivable en un geste) ; son traitement par le moteur = F2/F3                                                                                  |
| Permanent + entrées physiques du même ingrédient | les entrées physiques portent la seule réalité quantitative ; le marqueur permanent couvre qualitativement le reste ; si l'entrée physique disparaît, **rien n'est réinventé**                 |
| Péremption saisie (DLC/DDM)                      | **information stockée et affichée** — ses **effets** (indisponible / déclassé) sont des règles **F2** ; F1 ne promet aucune disponibilité                                                      |
| Plusieurs entrées du même ingrédient             | conservées séparément ; s'additionnent à la lecture quand les unités sont compatibles (lecture = F2)                                                                                           |
| Réservation                                      | **hors modèle F1** — B-F1-6 ✅ (réexamen F3/E5)                                                                                                                                                |
| `location`                                       | ni « fridge » ni « pantry » ne change la sémantique de possession — c'est une information d'organisation ; le moteur actuel traite les deux comme possédés (préservation du comportement, § 7) |

### 4.2 Règles de validation (core pur, testées — `src/core/kitchen/entries.ts`)

- `location` **requis**, valeur `'fridge' | 'pantry'` (B-F1-1 ✅).
- `quantity` connu ⇒ `unit` requis (et réciproquement) ; **`unit` validée contre le registre
  existant `@/core/units`** (référence stable, pas un simple libellé) ; quantité > 0 finie.
- `expires_at` ⇒ `expiry_type` requis (`'DLC' | 'DDM'`) ; **date ISO 8601 à la précision du jour**
  (§ 4.5).
- `permanent` interdit avec `quantity`/`expires_at` (un stock habituel ne porte pas ces notions) ;
  `exhausted_at` ⇒ `permanent: true` ; **`permanent: true` autorisé seulement si la catégorie de
  l'ingrédient figure dans la liste configurée** (B-F1-2 ✅, règle contrôlée dans le core — jamais
  seulement dans l'interface).
- `origin` obligatoire parmi les trois valeurs ; `added_at` ISO valide.
- **Id d'entrée** : non vide, unique par stock, immuable, ≤ 1 500 octets, jamais `/`, jamais
  `.`/`..`, jamais le motif réservé `__.*__` (garantie commune Firestore/SQL — CLAUDE.md § 8 bis).
- Tolérance à la lecture : toute entrée stockée est relue par le core (parser validant) ; une
  entrée incomplète est **réparée ou rejetée sans jamais produire un `undefined` vers l'affichage**
  (motif éprouvé : correctif `ccfa18e`).

### 4.3 Frontières F1 — ce que F1 ne décide pas

- **Règles de conversion et de disponibilité réelle** (y compris l'épuisement des permanents,
  DLC/DDM dépassées, l'addition multi-entrées) = **F2** (V12 § 11).
- **Consommation des quantités par le moteur** (allocation, double consommation, verdicts de
  faisabilité) = **F3** (V12 § 12).
- **🚩 B-F1-6 ✅ — Réservations hors F1** : aucun champ dans le modèle ni dans la cible SQL ; la
  nécessité sera **réexaminée en F3** (allocation des ingrédients) ; le lien éventuel aux créneaux
  du planning sera traité **en E5**. Si un besoin réel le justifie, l'ajout sera **arbitré et
  testé dans le lot concerné** (l'ajout d'un champ est additive, mais son impact n'est jamais
  considéré automatiquement nul).
- **Lien réservation ↔ créneau planning** : non modélisé (découle de B-F1-6).
- **Stabilisation pour 6a** : ce sont les **structures de données et contrats** (modèle d'entrées,
  ports, format de section, validation) qui doivent être **stabilisés et validés** pour la
  migration relationnelle — **pas l'achèvement des fonctionnalités métier/UX de F1–F3** (chef,
  roadmap § 7 bis) ; 6a intervient quand le modèle et les contrats concernés sont suffisamment
  stabilisés et validés, avec les étapes de préparation et la répétition générale 1.5 prévues.

### 4.4 Identifiants

Stable, unique par stock, immuable, non vide, ≤ 1 500 octets, jamais `/`, jamais `.`/`..`, jamais
`__.*__` (garantie commune) ; schéma concret (préfixe générateur) fixé au dossier d'exécution.

### 4.5 Précisions demandées par le chef (v4 — conservées en v6/v7)

| Champ                                  | Décision proposée                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`location`**                         | présent dans le modèle (§ 4), la validation (§ 4.2), les contrats de synchronisation (§ 6) et la cible SQL `fridge_entries` (§ 8) ; **les deux vues fonctionnelles restent distinctes dans l'app** (l'UI d'aujourd'hui distingue frigo/placard — E4 la conserve)                                                                             |
| **`unit`**                             | référence stable au registre `@/core/units` (validée au moment de l'écriture), jamais un libellé libre d'affichage — un alias du registre est accepté (conversions intra-famille existantes) ; une unité inconnue = refus d'écriture (erreur explicite)                                                                                      |
| **`exhausted_at`**                     | **réactivation = suppression de la date** (la valeur absente = actif) — représentation explicite et minimale ; un geste unique remet l'entrée active ; son **format (date ou instant)** est tranché au dossier d'exécution (§ 15.1, convention cohérente) ; le geste de réactivation dans l'UI = E4, pas F1                                  |
| **`expires_at`**                       | **ISO 8601 à la précision du jour** (DLC/DDM sont des dates calendaires, pas des instants) ; interprétation : « dépassée » = jour strictement antérieur au jour courant ; la comparaison utilise le jour calendaire (sans heure) — les **effets** (DLC = indisponible, DDM = déclassé) sont des règles **F2** ; F1 stocke, valide et affiche |
| **Entrées actives (présence dérivée)** | voir § 7 (projection définie précisément)                                                                                                                                                                                                                                                                                                    |
| **Bornes**                             | valeurs définitives établies à partir de mesures dans le **dossier d'exécution** (B-F1-4 ✅) ; dépassement = erreur explicite, **jamais de troncature silencieuse**                                                                                                                                                                          |

### 4 bis. Modèle métier et représentation dans le stockage (distinction obligatoire)

Le modèle métier **ne connaît pas son stockage** — exigence d'architecture, pas une convenience :

1. **Entités métier** : `StockEntry` et ses règles (§ 4.2) vivent dans `src/core/kitchen`,
   TypeScript pur, sans aucun type, champ ou terme de stockage **ni de protocole de sync** (pas de
   « section », pas de « document », pas de révision serveur ni de HLC dans le type) — gardé par
   la garde d'architecture.
2. **Représentation actuelle étudiée, non imposée** : la forme « section `stock` du document
   kitchen » (enveloppes HLC/tombstones) est **une** représentation candidate, évaluée pour sa
   compatibilité offline — elle ne fixe ni les champs du modèle, ni ses relations, ni son
   évolution future.
3. **Représentation 6a conçue en parallèle** : la table relationnelle cible (`fridge_entries`,
   § 8) est spécifiée dès ce dossier pour que la migration définitive soit une transformation
   mécanique — le modèle doit survivre aux deux représentations **sans refonte**.
4. **Couplage limité à un point** : le passage modèle ↔ représentation vit dans
   `src/application` (ports + adaptateurs), unique lieu autorisé ; une évolution de stockage
   future ne change que l'adaptateur (règle « changer de base de données »).
5. **Aucune contrainte de stockage dans le métier** : si une limite du mécanisme kitchen actuel
   empêchait une évolution du modèle, la réponse serait l'évolution de l'**adaptateur** — jamais
   l'appauvrissement du modèle.

## 5. Arbitrages — orientations retenues par le chef (✅)

| Arbitrage     | Orientation retenue                                                                                                                                                                                                                                                                                          | Où dans ce dossier   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| **B-F1-1 ✅** | **Unifier frigo et placard** : modèle commun `StockEntry` avec `location: 'fridge' \| 'pantry'` (nommage recommandé par le chef — `FridgeEntry` était restrictif) ; vues fonctionnelles distinctes conservées                                                                                                | § 4, § 4.2, § 6, § 8 |
| **B-F1-2 ✅** | **Catégories permanentes** : liste **configurable, contrôlée par le core** (jamais l'interface seule) ; liste initiale définie au **dossier d'exécution** ; évoluable **sans migration SQL** ; aucune liste figée qui bloquerait le catalogue futur ; statut réservé aux ingrédients de base et épices (V12) | § 2.5, § 4.2, § 8    |
| **B-F1-3 ✅** | **Section serveur `stock` additive** avec **protocole de transition simplifié** (§ 7) — aucun parc de versions clientes à maintenir (aucun client)                                                                                                                                                           | § 7                  |
| **B-F1-4 ✅** | Bornes = **valeurs mesurées au dossier d'exécution**, jamais de troncature silencieuse                                                                                                                                                                                                                       | § 4.5, § 11          |
| **B-F1-5 ✅** | **`KitchenStore` : évolution ciblée** (noyau entrées isolé dans un module d'application dédié, consommé par le store existant), **pas de refonte générale** ; scission complète réévaluée quand un second domaine grossit réellement                                                                         | § 9 bis              |
| **B-F1-6 ✅** | **Réservations hors F1** : réexamen en **F3** (allocation), lien planning en **E5** ; ni modèle ni colonnes SQL ; tout ajout futur = arbitré et testé dans le lot concerné                                                                                                                                   | § 4.3, § 8           |

## 6. Synchronisation offline-first — le métier séparé du protocole

**Séparation exigée (chef, v4)** :

1. **Modèle métier indépendant** : `StockEntry` (§ 4) ne connaît ni le stockage, ni les
   révisions, ni le protocole de synchronisation — aucun champ HLC dans le type métier.
2. **Enveloppe de synchronisation distincte** : chaque entrée est portée par une **enveloppe**
   qui contient sa **version HLC** (`(physical, counter, deviceId)` — le même `ElementVersion`
   existant) et son état de suppression (**tombstone**). L'enveloppe est le fait du mécanisme de
   sync (`src/core/kitchen` pour la logique d'horloge/fusion, adaptateurs pour la représentation).
3. **Tombstones** : les suppressions restent le mécanisme de propagation des suppressions
   (mécanisme existant, inchangé).
4. **Adaptateur unique** : un adaptateur est responsable de la représentation (section `stock` du
   document kitchen aujourd'hui, tables relationnelles en 6a) et du dialogue de synchronisation —
   le **core métier ne connaît ni l'un ni l'autre** ; les règles actuelles de `KitchenSync`
   (push debouncé 2 s, pull minuté, échec = attente, invités hors sync, remise à zéro de
   l'appareil périmé sous la fenêtre de rétention) **ne changent pas**.

**Matrice de tests imposée (aucune opération ne se perd silencieusement ; la résolution est écrite
dans le contrat et testée cas par cas)** :

1. ajout hors ligne sur deux appareils du même ingrédient → deux entrées ;
2. modification simultanée d'une quantité → dernier HLC gagne, l'entrée est **écrite en entier**
   (sans fusion de champs ni `undefined` — convention du projet) ;
3. suppression sur un appareil pendant que l'autre est hors ligne → tombstone propagée ;
4. **modification d'une entrée sur un appareil pendant qu'un autre la supprime hors ligne** —
   **résolution définie dans le contrat** : l'opération portant la **version HLC la plus élevée**
   gagne (ordre total existant) — si la modification (nouvelle version) est postérieure à la
   suppression, l'entrée **survit modifiée** ; si la suppression est postérieure, elle **reste
   supprimée** ; le cas d'égalité exact compte comme supprimé (règle `ElementSet` existante) —
   **test explicite des deux issues** ;
5. deux entrées du même ingrédient → conservées séparément ;
6. rejeu répété d'une même opération → idempotent ;
7. modification pendant une synchronisation → jamais perdue (repoussée au prochain trigger) ;
8. fusion puis purge des anciennes enveloppes → safe (règle existante de remise à zéro de
   l'appareil n'ayant pas synchronisé dans la fenêtre de rétention).

**Tests multi-appareils imposés pour la transition (protocole § 7)** : plusieurs appareils du même
utilisateur ; un appareil **hors ligne pendant la migration** ; une **synchronisation tardive**
d'un appareil ; conflits entre ajouts, modifications et suppressions ; **absence de perte ou de
résurrection involontaire** de données — **scénario détaillé au § 7 quater**.

## 7. Migration des données existantes — protocole simplifié et scénarios de retour arrière

**Contexte retenu** : aucun client — pas de coexistence de versions clientes à développer ;
protégés : données éventuellement déjà présentes, comptes de test, appareils d'un même
utilisateur.

**Protocole de transition vers la section `stock` (B-F1-3 ✅)** :

1. Lire les anciennes sections `fridge` et `pantry` (ensembles d'ids).
2. Convertir chaque identifiant présent en une entrée `StockEntry` — **sans quantité inventée**
   (présence seule, `origin: 'manual'`).
3. Affecter le bon emplacement : `location: 'fridge'` ou `'pantry'` selon la section d'origine.
4. **Préserver les identifiants des ingrédients** (`ingredient_id = id actuel` — références
   recettes, courses, moteur, recherche inchangées).
5. **Vérifier** que toutes les données ont été correctement migrées (test d'équivalence : l'id-set
   dérivé des entrées == l'ancien ensemble, frigo et placard séparément).
6. **Conserver temporairement les anciennes données** pour un retour arrière contrôlé (§ 7 bis).
7. **Ne supprimer les anciennes sections qu'après validation de la migration**, selon une
   procédure documentée (lot de dette, après observation de la transition).

### 7 bis. Réversibilité — deux scénarios explicites (jamais de « réversibilité complète » abusive)

| Scénario                     | Situation                                                                                           | Retour arrière possible                                                                                                                                                                                                                                                                                                  | Tests                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A — avant enrichissement** | les entrées ne portent que des informations équivalentes aux anciens ids (présence seule, location) | **conversion inverse** vers les ensembles d'ids possible **sans perte** (l'ancienne section conservée en est la référence)                                                                                                                                                                                               | test aller-retour entrées → ids → entrées, équivalence stricte des deux projections                                                                                      |
| **B — après enrichissement** | les entrées portent des quantités, unités, DLC/DDM, notes…                                          | la conversion inverse vers de simples ids **perdrait des données** — **elle n'est pas la stratégie de retour arrière** ; le retour passe par la **sauvegarde/restauration** (backup complet avant migration, test de restauration après migration) ou toute stratégie qui **préserve toutes les informations enrichies** | test de **restauration** (backup → vérification du contenu enrichi complet) ; le dossier d'implémentation écrit la stratégie B et ses tests avant toute exécution réelle |

**Règle d'honnêteté** : la conversion inverse vers des identifiants est présentée comme
**réversibilité du scénario A seulement** — jamais comme une réversibilité complète si elle
entraîne une perte d'informations. La migration est **exigée** id-préservée, additive et
réversible — **démontrée** par les tests (§ 10) ; aucun de ces points n'est un acquis.

**Sauvegarde JSON** : le format backup intègre les entrées (aller-retour testé, comme
`backup.test.ts`) ; les anciennes sauvegardes (ids) restent importables (conversion à l'import).

### 7 ter. Projection « présence dérivée » — comportement actuel préservé exactement

La présence dérivée (ce que le moteur actuel consomme — **aucun changement du moteur**) est
définie précisément :

- **Une entrée alimente la présence dérivée si et seulement si** : elle n'est pas supprimée
  (tombstone), **et elle n'est pas un permanent temporairement épuisé** (`permanent: true` avec
  `exhausted_at` présent — l'utilisateur l'a **temporairement déclarée absente**).
- **Un permanent actif** (sans `exhausted_at`) **est présent** (ingrédient qualitativement
  présent — conforme V12 — sans jamais représenter une quantité).
- **Les DLC/DDM dépassées ne sont PAS appliquées dans la projection** — une entrée dont la
  péremption est dépassée reste « présente » dans cette projection : appliquer les effets de
  péremption serait commencer les **règles de disponibilité de F2**, ce que F1 ne fait pas. Le
  comportement observable du moteur pendant F1 est donc **identique à aujourd'hui** pour toutes
  les données migrées (test d'équivalence du § 7).
- **`location` n'affecte pas la projection** : frigo et placard alimentent la même présence
  dérivée, exactement comme les deux ensembles actuels (`fridge` + `pantry` → `useMatchingInputs`).
- Test d'équivalence : pour des données migrées, `derivedPresence(entries) == oldIds(fridge) ∪
oldIds(pantry)` — vérifié séparément par emplacement (les vues UI restent distinctes).

### 7 quater. 🚩 Cas critique — synchronisation tardive d'un ancien format après la migration

**Le scénario** : un appareil reste **hors ligne pendant la migration** du compte vers la section
`stock`. Il conserve encore localement les anciennes sections `fridge`/`pantry` (ensembles d'ids)
— **et éventuellement des opérations locales non synchronisées** : ajouts, modifications,
suppressions effectués pendant son absence. À son retour en ligne, il peut tenter de
synchroniser ses anciennes données — avec trois risques : **perte de données**, **résurrection
d'éléments supprimés**, **écrasement des nouvelles données migrées**.

**Décision de conception reportée au dossier d'exécution (aucun choix arbitraire ici)** : le
dossier d'exécution examinera le **fonctionnement réel** de `KitchenSync` et des routes
`kitchenRoutes` (déclencheurs, forme des pushes, règle de fusion appliquée par le serveur), puis
définira et testera **une stratégie sûre**, parmi :

- **(a) conversion contrôlée** des anciennes écritures vers le nouveau modèle, **si elle est
  fiable** (l'appareil reconvertit localement ses anciennes sections avant le push, ou le serveur
  convertit à la réception) — conditions de fiabilité à démontrer (identifiants des opérations,
  horloges, absence d'ambiguïté d'ajout/suppression) ;
- **(b) rejet explicite de l'ancien format** avec récupération et resynchronisation sécurisées
  (l'appareil reçoit la section `stock` à jour, convertit ses données locales, rejoue ses
  opérations pendantes **dans le nouveau format** selon les mêmes règles de fusion HLC — le cas
  échéant par une migration locale de son propre état avant l'envoi).

**Garanties exigées quelle que soit l'option** : aucune opération locale non synchronisée ne se
perd ; aucun élément supprimé ne ressuscite (tombstones respectées) ; les données migrées du
compte ne sont pas écrasées par les anciennes sections ; le résultat converge vers le même état
que si l'appareil avait été en ligne pendant la migration (ou vers un état documenté, cohérent,
sans perte).

**Tombstones historiques (tombstones déjà présents dans les anciens `ElementSet` au moment de la
migration)** : la conversion des seuls ingrédients **actuellement présents** (étape 2 du protocole
§ 7) ne suffit pas nécessairement à préserver le contexte de synchronisation de l'ancien modèle —
un ingrédient retiré **avant** la migration porte encore une tombstone dans les anciens ensembles,
qui protège sa suppression contre une résurrection lors d'une synchronisation tardive. Le dossier
d'exécution devra **démontrer** :

1. **comment les tombstones existants sont traités pendant la migration** (reportés dans le
   nouveau mécanisme de sync, reconverties, ou remplacées par une garantie équivalente — au choix
   documenté, jamais implicite) ;
2. **comment les opérations hors ligne de l'ancien format sont rapprochées des nouvelles entrées
   `StockEntry`** (correspondance ancien id ↔ entrée, notamment pour les opérations pendantes) ;
3. **comment les suppressions restent cohérentes lorsqu'il existe plusieurs entrées du même
   ingrédient** (une ancienne suppression de l'ingrédient ne doit ni effacer d'autres entrées
   légitimes, ni être annulée par leur présence) ;
4. **qu'une ancienne suppression ne peut pas être perdue puis annulée involontairement par une
   synchronisation tardive** (aucune résurrection) ;
5. **que les tests couvrent les suppressions antérieures à la migration**, en plus des
   suppressions effectuées pendant la migration (scénario ci-dessus).

Aucune stratégie n'est choisie arbitrairement ici : le dossier d'exécution examinera le
fonctionnement réel de `ElementSet`, `KitchenSync` et `kitchenRoutes`, puis documentera **une
solution fiable et testée**.

**Scénario de test multi-appareils imposé** : _migration du compte pendant qu'un appareil est hors
ligne, cet appareil ayant effectué hors ligne des ajouts, des modifications et des suppressions_
— vérifier, après sa synchronisation tardive : conservation de ses ajouts, application correcte de
ses modifications, propagation de ses suppressions, absence d'écrasement des données migrées,
aucune résurrection. Test exécuté sur les trois stores (mémoire/SQLite/émulateur). **Le jeu de
migration inclut également des tombstones préexistantes** (ingrédients retirés avant la
migration) : leur suppression reste effective après synchronisation tardive (aucune résurrection,
garantie 5 ci-dessus).

**Le cas est une exigence de la matrice de transition (§ 6) — sa non-prise en compte est
bloquante pour l'exécution du lot.**

## 8. Compatibilité Firestore / SQL et préparation de 6a

Analyse exigée par la règle permanente « double compatibilité dès la conception » :

| Élément                     | Analyse                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modèle cible**            | entrées physiques dans le document kitchen du compte (section `stock`) ; types TS purs du core, **sans métadonnée de sync** (§ 6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Compatibilité Firestore** | section `stock` du document kitchen (validation serveur additive) ; versions HLC dans l'enveloppe de sync, révision document serveur (mécanismes existants)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Compatibilité SQL**       | table relationnelle dédiée **`fridge_entries`** (nom conservé pour la table même si l'entité est `StockEntry` — le nom de table documente la cible historique ; alternative `stock_entries` proposée au dossier d'exécution) : `id PK`, `account FK`, `ingredient_id FK`, **`location` CHECK ('fridge','pantry')**, `quantity DECIMAL`, `unit` (référence registre), `expires_at DATE`, `expiry_type CHECK ('DLC','DDM')`, `permanent BOOLEAN`, `exhausted_at` (**type différé** : `DATE` ou `TIMESTAMP` selon la convention temporelle arbitée au dossier d'exécution, § 15.1 — harmonisé entre modèle TS, représentation Firestore, colonne SQL et comparaisons métier), `origin CHECK`, `note`, `added_at` — colonnes de sync (HLC, tombstone) **séparées** des colonnes métier ; **jamais une colonne JSON substitut** ; **aucune colonne `reserved…`** (B-F1-6 ✅) |
| **Contrat de stockage**     | réutilisation du mécanisme kitchen existant (sections + enveloppes HLC) ; pas de port nouveau, la forme des sections évolue (section additive `stock`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Données existantes**      | migration § 7 (protocole simplifié, ids préservés, aucune quantité inventée, scénarios A/B du § 7 bis)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Tests**                   | mêmes comportements sur mémoire/SQLite/Firestore-émulateur (harnais de contrat existant) ; matrice sync § 6 sur les trois                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Limites**                 | bornes § 4.5/§ 11 ; purge tombstones (fenêtre 90 j inchangée)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**La transformation relationnelle définitive reste 6a, lorsque les structures et contrats
concernés sont stabilisés et validés (pas l'achèvement de toutes les fonctionnalités F1–F3), après
la répétition générale 1.5** — séquence validée ; F1 conçoit le modèle pour que 6a soit une
transformation mécanique (colonnes listées ci-dessus).

## 9. Impacts fichiers et architecture (estimation) — dont scission de `KitchenStore`

### 9 bis. `KitchenStore` : évolution ciblée (B-F1-5 ✅), pas de refonte générale

F1 ajoute ses sections dans le store existant (mécanisme éprouvé), en isolant le **noyau entrées**
(lecture/validation/présence dérivée) dans un module d'application dédié (type `StockStore`,
module `kitchen/stock`) consommé par `KitchenStore` ; la scission complète par domaine se
réévalue au fil des lots quand un second domaine grossit réellement (convention « extraction au
second consommateur »). Aucune refonte générale n'est engagée.

| Zone            | Fichiers                                                                                                                                                                        | Type      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Core            | `src/core/kitchen/entries.ts` (modèle `StockEntry` + validations + projection) + `entries.test.ts` ; enveloppes HLC côté `elementSets`/sync (métadonnées, hors modèle)          | nouveaux  |
| Application     | module dédié entrées + `KitchenStore` (présence dérivée `fridge: string[]` conservée — compatibilité totale UI/moteur pendant la transition) ; `KitchenSync` : nouvelle section | évolution |
| Ports           | `KitchenRepository` (persistance locale des entrées), `RemoteKitchenSections` (section `stock`)                                                                                 | évolution |
| Infrastructure  | adaptateur local + mémoire de référence ; tests de contrat                                                                                                                      | évolution |
| Serveur         | `kitchenRoutes` : validation de la section `stock` (additive)                                                                                                                   | évolution |
| Sauvegarde      | `src/core/backup` : entrées dans l'export/import + aller-retour testé                                                                                                           | évolution |
| **Non touchés** | `src/core/matching/*` (moteur, conversions, allocation), écrans (`src/features/fridge`, `grocery`, `planner`, `recipes`) — aucun changement d'interface                         | —         |

Estimation : ~8–12 fichiers, aucune dépendance nouvelle, aucune migration de schéma base
Firestore (section document), aucune URL/endpoint nouveau.

## 10. Tests (stratégie)

1. **Core** : validations § 4.2 (chaque règle + états incohérents refusés, `location` requis,
   `unit` validée contre le registre, permanents limités aux catégories autorisées), projection
   § 7 ter (permanents actifs/épuisés, péremptions ignorées dans la projection), réparation à la
   lecture (pas de `undefined`).
2. **Sync** : matrice § 6 (8 cas, **dont le test explicite modification/suppression concurrentes**
   avec les deux issues) sur **mémoire, SQLite et émulateur Firestore** (harnais existant ;
   skippé proprement si l'émulateur est absent — jamais un faux vert) + tests multi-appareils de
   la transition (§ 6) **dont le scénario critique § 7 quater** : migration pendant qu'un appareil
   est hors ligne avec ajouts, modifications et suppressions non synchronisés — vérification
   complète de la convergence (critère 2 bis).
3. **Contrats** : persistance locale (entrées) et section serveur — harnais de contrat commun,
   implémentation mémoire comme référence.
4. **Migration** : protocole § 7 (7 étapes), équivalence de présence dérivée (§ 7 ter),
   **scénario A** (conversion inverse sans perte) et **scénario B** (restauration qui préserve
   l'enrichissement), import backup ancien format, plan de retour arrière documenté.
5. **Non-régression** : `npm run check` intégral — moteur, UI, suggestions, courses, planning
   **inchangés de comportement** (la présence dérivée est identique) ; démonstration navigateur
   (frigo/placard ajout/retrait avant/après migration sur serveur isolé 3001 + seed jetable).

## 11. Critères d'acceptation mesurables

1. Les entrées existent, validées par le core ; **aucune saisie de quantité n'est requise
   nulle part** — un frigo « présence seule » fonctionne à l'identique d'aujourd'hui.
2. La matrice sync § 6 passe sur les trois stores ; **aucune opération ne se perd
   silencieusement** ; le conflit modification/suppression a les **deux issues testées**.
   2 bis. Le **scénario § 7 quater** passe : migration pendant qu'un appareil est hors ligne (avec
   ajouts, modifications, suppressions non synchronisés, **et tombstones préexistantes**) — ses
   ajouts sont conservés, ses modifications appliquées, ses suppressions propagées, les données
   migrées **non écrasées**, aucune résurrection (y compris des suppressions **antérieures** à la
   migration) ; la stratégie retenue (conversion contrôlée ou rejet explicite de l'ancien
   format) est documentée et démontrée par ce test.
3. La migration (§ 7) est : id-préservée, conforme au protocole simplifié, scénarios A/B
   démontrés ; les utilisateurs existants ne voient **aucun changement** d'interface ni de
   suggestions ; les données de test et la sync multi-appareils sont protégées.
4. Le moteur ne change pas (aucun diff `src/core/matching`) ; la présence dérivée est égale à
   l'ancien ensemble d'ids (test d'équivalence, § 7 ter) — **les permanents épuisés en sont
   exclus, les péremptions n'y sont pas appliquées** (règles F2).
5. Compatibilité Firestore **et** SQL démontrée par les tests de contrat ; les colonnes
   relationnelles 6a sont listées (§ 8) — **jamais de JSON substitut**, **aucune colonne
   `reserved…`**.
6. **`location`** présent dans modèle, validation, contrats et cible SQL ; **deux vues
   fonctionnelles distinctes** conservées.
7. Bornes explicites avec erreurs claires (jamais de troncature silencieuse) ; valeurs mesurées
   au dossier d'exécution.
8. `npm run check` vert ; garde d'architecture verte (core pur, pas de SDK, pas de plateforme —
   **y compris : aucune notion de stockage ni de protocole de sync dans les types métier**, § 6).
9. **Performances sur volumes représentatifs** : mesures (sync + lectures) avec un jeu de taille
   réaliste (ex. 100–300 entrées, dont plusieurs entrées du même ingrédient, tombstones réels),
   comparées à la baseline 1.4 ; mesurées, jamais présupposées.
10. **Test de restauration après migration** : restaurer une sauvegarde et vérifier le
    aller-retour complet, y compris les informations enrichies (scénario B).
11. Docs à jour (03-domaine § kitchen, 05-application-donnees § sync, CLAUDE.md si convention).

## 12. Risques

| Risque                                                    | Maîtrise                                                                                                                                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Divergence de sémantique entre V12 et implémentation      | le dossier **cite** V12 § 8 et chaque règle y renvoie ; écarts = arbitrages tracés (réservations = seul écart, décidé par le chef)                                                  |
| Volume des entrées vs ids (perf sync)                     | bornes mesurées (B-F1-4), push debouncé inchangé, **mesures sur volumes représentatifs** (critère 9) — baseline 1.4 comme référence                                                 |
| Transition multi-appareils                                | protocole simplifié § 7 + tests imposés (§ 6) : appareil hors ligne pendant la migration, sync tardive, conflits, aucune perte/résurrection                                         |
| Sync tardive d'un ancien format après migration           | **§ 7 quater** : stratégie sûre définie et testée au dossier d'exécution (examens réels de `KitchenSync`/`kitchenRoutes`) ; scénario de test imposé ; cas bloquant pour l'exécution |
| Tentation d'implémenter l'UI des quantités « en passant » | périmètre strict : aucune interface nouvelle (E4 est le consommateur)                                                                                                               |
| Migration irréversible par accident                       | **deux scénarios de retour arrière définis** (§ 7 bis) ; test de restauration (critère 10) ; sauvegarde avant toute exécution réelle ; plan écrit dans le dossier d'implémentation  |
| Couplage modèle/sync ou modèle/stockage                   | garde d'architecture (§ 4, § 6) : le métier ne connaît ni HLC, ni sections, ni tables ; revue à chaque rapport                                                                      |
| Projection qui dériverait vers des règles F2              | projection figée au § 7 ter (péremptions non appliquées, permanents épuisés exclus) — testée                                                                                        |

## 13. Ce que ce dossier demande au chef

1. **Validation finale du dossier fonctionnel F1 consolidé** (orientations B-F1-1 à B-F1-6
   intégrées conformément à votre revue).
2. Confirmation que le **dossier d'exécution** (liste initiale des catégories permanentes, bornes
   mesurées, schéma d'id, nom définitif de table SQL, stratégie de retour arrière B) sera préparé
   séparément avec sa propre validation — la validation de ce dossier fonctionnel ne constitue pas
   une autorisation de développement.

## 14. Couverture du cahier des charges du chef (revue v7)

| Exigence du chef                                                                           | Couvert par                                                                                           |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `StockEntry` + `location` (modèle, validation, contrats, SQL, vues distinctes)             | § 4, § 4.2, § 6, § 8, critère 6                                                                       |
| Quantités facultatives — aucune saisie obligatoire                                         | § 2.1, § 4.1, critère 1                                                                               |
| Présence connue ≠ quantité connue                                                          | § 2.3, § 4.1, § 4.3 (exploitation = F2/F3)                                                            |
| `unit` = référence stable au registre                                                      | § 4.2, § 8 (colonne dédiée)                                                                           |
| DLC/DDM facultatives + format/interprétation                                               | § 4, § 4.5 (ISO 8601 jour)                                                                            |
| Permanents + épuisement temporaire (infos F1, règles F2/F3)                                | § 2.5, § 4.1, B-F1-2, § 7 ter                                                                         |
| `exhausted_at` — réactivation explicite                                                    | § 4.5                                                                                                 |
| Réservations hors F1 (modèle **et** colonnes SQL)                                          | § 4.3 B-F1-6 ✅, § 8 (aucune colonne), § 11 critère 5                                                 |
| Moteur non modifié prématurément                                                           | § 7 ter, § 9 (aucun diff moteur), critère 4                                                           |
| HLC hors du modèle métier (enveloppe + adaptateur)                                         | § 6                                                                                                   |
| Sync : conflits, révisions, suppressions ; test modification/suppression concurrentes      | § 6 (cas 2 et 4)                                                                                      |
| Migration id-préservée + protocole simplifié (7 étapes)                                    | § 7                                                                                                   |
| Scénarios de retour arrière A/B (jamais de « réversibilité complète » abusive)             | § 7 bis, critère 10                                                                                   |
| Multi-appareils / hors ligne pendant migration / sync tardive / pertes                     | § 6 (tests de transition) + **§ 7 quater (cas critique, stratégie à définir au dossier d'exécution)** |
| Firestore + préparation 6a (stabilisation structures/contrats)                             | § 8                                                                                                   |
| Performances, volumes représentatifs, bornes mesurées                                      | § 10.2, critère 9, § 4.5                                                                              |
| Risques, critères, retour arrière                                                          | § 12, § 11                                                                                            |
| `KitchenStore` : évolution ciblée, pas de refonte                                          | § 9 bis (B-F1-5 ✅)                                                                                   |
| Modèle métier indépendant du stockage                                                      | § 4/§ 4 bis (garde d'architecture, critère 8)                                                         |
| Projection = comportement actuel exact (permanents épuisés, péremptions)                   | § 7 ter (critère 4)                                                                                   |
| Sémantique `permanent` : marqueur qualitatif, pas un stock physique quantifié              | § 2.5, § 4.1                                                                                          |
| Vocabulaire : présence déclarée ≠ disponibilité réelle (F1 ne promet pas la disponibilité) | § 4.1, § 4.3, § 7 ter                                                                                 |
| Précisions reportées au dossier d'exécution (sans alourdir ce dossier)                     | § 15                                                                                                  |
| Périmètre strict de F1 (aucun parcours nouveau, aucun redesign UI)                         | § 1, § 4.3, § 9 (écrans non touchés)                                                                  |

## 15. Précisions reportées au dossier d'exécution (v7)

Liste des points que le **dossier d'exécution** devra définir précisément — cités ici sans les
trancher, pour ne pas alourdir le dossier fonctionnel :

1. **Format de `exhausted_at`** : date (jour calendaire) ou instant (horodatage) — à trancher au
   dossier d'exécution selon sa **sémantique réelle**. **Chaque champ porte une convention
   temporelle explicite, cohérente avec sa sémantique, appliquée uniformément dans les quatre
   lieux : le modèle TypeScript, la représentation Firestore, la colonne SQL (§ 8 — type
   volontairement non figé : `DATE` ou `TIMESTAMP`) et les comparaisons et règles métier
   concernées.** Le même type n'est pas obligatoirement imposé aux deux champs : `expires_at`
   reste une **date calendaire à la précision du jour** (§ 4.5), `exhausted_at` sera défini selon
   sa sémantique propre — aucune exigence de type partagé entre les deux.
2. **Comportement de l'interface actuelle, conservé** : ajout d'un ingrédient déjà présent →
   **création d'une entrée de présence** (sans écraser les entrées existantes) ; retrait →
   **suppression logique appropriée** (tombstone) — détailler le geste exact côté UI/mécanisme.
3. **Retrait avec plusieurs entrées du même ingrédient et même emplacement** : le retrait **ne
   supprime pas arbitrairement toutes les entrées** — définir la cible du retrait (la plus
   récente ? la plus ancienne ? choix utilisateur ?) et son comportement répété, avec tests.
4. **Longueur maximale de `note`** (valeur mesurée, erreur explicite en cas de dépassement —
   jamais de troncature silencieuse).
5. **Stratégie de génération des identifiants** d'entrée (schéma concret) et **périmètre
   d'unicité** (par stock/compte), conformes aux garanties communes Firestore/SQL (§ 4.4).
6. **Liste initiale des catégories autorisant `permanent`**, contrôlée par le core (B-F1-2 ✅) —
   contenu initial et mécanisme d'évolution sans migration SQL.
7. **Limites de volume retenues** (nombre d'entrées, taille `note`, enveloppes de sync),
   **confirmées par des mesures représentatives** (B-F1-4 ✅).
8. **Stratégie de la synchronisation tardive d'un ancien format** (§ 7 quater, tombstones
   historiques inclus) — examens réels de `ElementSet`, `KitchenSync` et `kitchenRoutes`, option
   (a) ou (b), traitement des tombstones préexistantes, et ses tests.
