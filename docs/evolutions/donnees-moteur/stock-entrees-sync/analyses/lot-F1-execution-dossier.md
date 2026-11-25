# F1 — Dossier d'exécution technique (lot F1, frigo à entrées) — **v6**

**Statut : VALIDÉ par le chef le 19/11/2026 (validation finale — dossier et périmètre
documentaire uniquement). Arbitrages E1, E2, E3, E6 validés et consignés au § 15 (même
date) ; E4 et E5 suivant les dispositions convenues ; compromis `resetLocal` accepté
(§ 6.3). Réalisation (journal § 18) : étape 1 (serveur) réalisée, validée et clôturée par le
chef (commits `e18f854`, `949cede`) ; étape 2 (client) réalisée sous autorisation explicite,
rapport présenté — en attente de validation avant l'étape 3 (observation et mesures).**

**Références** : dossier fonctionnel **F1 v8** (`lot-F1-frigo-entrees-dossier.md`, orientations
B-F1-1 à B-F1-6 retenues, non réouvertes) · annexe **« Analyse architecturale — identifiants
techniques et fonctionnels des modèles »** (`analyse-identifiants-techniques-fonctionnels.md`).

**Révision v2** : corrections obligatoires du chef intégrées — contrat `StockEnvelope` canonique
non ambigu (§ 4.2, toutes les combinaisons documentées) ; stratégie d'identifiants **vérifiée
dans le code** (§ 5) et conforme au principe id technique / code fonctionnel facultatif ;
**validations client/serveur partagées** (§ 4.5 — le serveur vérifie les invariants métier qu'il
peut contrôler, sans duplication ni liste statique) ; **démonstration de convergence
multi-appareils** complète (§ 9, 7 scénarios imposés) ; traitement des **tombstones
historiques** renforcé (§ 8) ; **comportement exact de `resetLocal`** documenté (§ 6.3) ; limites
traitées comme **hypothèses à mesurer** (§ 10 — jamais fixées sans mesure, jamais de troncature
silencieuse) ; catégories permanentes **vérifiées dans le catalogue réel** (§ 15-E6) ; rollback
et restauration strictement distingués et prouvés par tests (§ 13) ; arbitrages E1–E6
réexaminés avec recommandations (§ 15) ; analyse des identifiants des modèles existants et
impacts 6a (annexe).

**Révision v3** — corrections ciblées de la revue v2 (aucune réouverture des orientations) :
**génération d'identifiants rendue réellement injective** (§ 5 — la collision signalée par le
chef sur la v2 est réelle : `a/` encodé en Base64URL donnait `YS8`, conservé tel quel pour un
id sûr `YS8` ; encodage pur TypeScript sans `Buffer`, compatible navigateur et serveur ; refus
contrôlé au-delà de la limite, jamais de troncature ; **tests de collision entre familles**
imposés) ; **égalité exacte de versions HLC traitée** (§ 4.2.2 bis — contenus identiques =
idempotent, contenus différents = règle déterministe et commutative, testée) ;
**compatibilité bidirectionnelle legacy ↔ stock** pendant la fenêtre (§ 7.4 — projection
serveur du stock vers les sections legacy, deux scénarios de convergence ajoutés § 9.8–9.9,
rollback A fondé sur des sections legacy **à jour**) ; **fin de la fenêtre de transition
fondée sur un critère d'activité, pas sur la seule durée** (§ 11) ; **contexte de validation
complété** (§ 4.5 — existence de l'ingrédient, séparation structurel/registre, politique
d'invalidation des caches) ; **compromis `resetLocal` présenté comme acceptation fonctionnelle
explicite** (§ 6.3) ; annexe identifiants : unités (libellé ≠ identifiant canonique — décision
6a) et identités de connexion (F4) précisées, sans élargir F1. Les arbitrages E1–E6 restent
**soumis à validation** — aucun considéré approuvé.

**Révision v4** — corrections bloquantes de la revue v3 (aucune réouverture des orientations
stabilisées) : **injectivité des ids déterministes corrigée définitivement** (§ 5 — la faille
signalée est réelle : itération par points de code mêlée à une extraction par code unité
`charCodeAt` ; deux caractères hors BMP partageant le même surrogate haut produisaient le
même échappement ; encodage par **point de code entier** sur 6 chiffres hexadécimaux à
largeur fixe, décodeur d'aller-retour, refus explicites — id vide et dépassement de cap —,
tests Unicode hors BMP, caractères combinants, collisions croisées entre familles) ;
**conversion des anciennes cartes `ElementSet` définie cas par cas** (§ 7.1 et § 8 — fonction
pure `convertLegacyElementSet`, cinq cas, **une seule enveloppe par id déterministe**,
versions HLC préservées, protection des entrées enrichies, tests imposés : migration
rejouée, sync tardive, ajout plus récent et plus ancien qu'une suppression, aucune
résurrection) ; **agrégation stock → legacy définie** (§ 7.4 — `projectStockToLegacy(stock,
location)` agrège les enveloppes par `ingredient_id`, sept cas imposés, règle de versions
démontrée cas par cas, re-positionnement synthétique déterministe, borné et justifié —
jamais un choix arbitraire) ; **égalité de versions HLC précisée par combinaison** (§ 4.2.2
bis — doublon supprimé ; ACTIVE/TOMBSTONED à versions égales = la suppression gagne
**toujours**, la règle lexicographique est cantonnée à ACTIVE/ACTIVE) ; **validation sur le
chemin de fusion** (§ 4.5 — une candidate gagnante est validée avant de remplacer une
enveloppe valide, une donnée malformée ne gagne jamais une fusion). **Acquis v3 confirmés
par la revue** : séparation `StockEntry`/`StockEnvelope`, validation métier partagée
client/serveur, distinction règles structurelles/registres, cache de registres avec
relecture avant refus, comportement réel de `resetLocal` (perte des opérations pendantes
assumée), transition fondée sur l'activité observée, distinction rollback avant
enrichissement / restauration après enrichissement, aucun changement du moteur de matching
et des écrans, principe id technique / code fonctionnel facultatif, décision unités
reportée à 6a, identités de connexion reportées à F4. Les arbitrages E1–E6 restent
**soumis à la validation du chef** — aucun considéré approuvé (§ 15). Les points non
démontrables par le dossier seul sont listés au § 17 (inspection ou mesure pendant le lot).

**Révision v5** — deux corrections bloquantes de la revue v4 (aucune autre réouverture) :
**boucle de rétroconversion des versions synthétiques fermée** (§ 7.4 — le cycle complet
client → serveur → client → serveur est analysé pas à pas avec le code de sync réel
(`KitchenSync` pousse la carte entière) ; la version synthétique porte `device: 'server'`, id
**réservé** ; la conversion legacy→stock **reconnaît l'écho** (`device: 'server'`) et l'ignore
— jamais une opération métier, jamais une réactivation ; démonstration du scénario exact du
chef : l'entrée déterministe supprimée **reste TOMBSTONED** à chaque cycle, point fixe ;
tests multi-cycles, multi-appareils et hors ligne) ; **métadonnées de tombstone définies**
(§ 4.2.1 bis — forme canonique complétée par un **stub de référence**
`{ id, ingredient_id, location }` : la projection agrège par ingrédient **y compris les
enveloppes supprimées**, le rattachement est conservé sans garder l'entrée complète ; stub
écrit à la suppression et à la conversion historique **à partir de la clé legacy réelle**,
jamais reconstruit ; **aucune version d'ajout n'est nécessaire** — le cas absent de la
projection n'écrit que `removed`, correction d'une affirmation erronée de la v4 qui supposait
la version d'ajout conservée dans la tombstone canonique) ; point documentaire : l'annexe
référence désormais la v5 et **la borne de longueur d'id est une règle exécutée**
(`validateStockEntry`, client et serveur) et non une simple mention (§ 5). Le § 7.1 est
réécrit intégralement (cinq cas + stub + reconnaissance d'écho) — une réécriture prévue en
v4 n'avait pas été appliquée, l'écart est corrigé.

**Révision v6** — trois clarifications de la revue v5 (aucune autre réouverture) :
**contrat typé des enveloppes** (§ 4.2 — type distinct `StockTombstoneStub` et **union
discriminée** `StockEnvelope` par `state` : `active` (entrée complète) / `tombstoned`
(stub seul) ; l'autorité sémantique reste la comparaison HLC — un `state` déclaré qui la
contredit = INVALIDE ; validations propres à chaque état ; les règles métier d'une
`StockEntry` complète ne s'appliquent **jamais** au stub) ; **règles de fusion des
tombstones harmonisées** (§ 4.2.2 et 4.2.2 bis — la tombstone gagnante emporte son stub ;
versions de suppression différentes = stub du gagnant ; versions égales + stubs identiques =
idempotent ; versions égales + stubs différents = départage lexicographique sur le stub
sérialisé ; propriétés commutative, associative et idempotente démontrées par tests) ;
**réservation `device: 'server'` sécurisée et vérifiée** (§ 7.4 cycle + nouveau contrat
§ 7.5 — `storage.deviceId()` = UUID/repli, **disjoint de `server` et `legacy` par
construction**, vérifié dans le code ; garde de route : `device: 'server'` dans une section
stock = 400 ; dans une section legacy = écho ignoré, aucun effet métier ; usurpation sans
effet : le pire cas d'un client forgeron est un no-op ; une vraie modification n'est jamais
ignorée — le deviceId d'un appareil réel ne peut pas être `server` par construction).
Traçabilité des tests ajoutée (§ 12 : aucun test exécuté à ce stade documentaire — chaque
entrée classée « nouveau » ou « extension d'un test existant »).

**Complément post-validation (chef, intégré à la v6 — la v6 reste la version validée)** :
invariant d'intégrité de l'identité — `entry.id === clé` (ACTIVE) et `stub.id === clé`
(TOMBSTONED), rejet avant stockage/fusion sans écrasement, respecté par conversion,
migration, export/import et restauration (§ 4.2, § 4.2.4, § 7.1, § 13, § 12, § 16).

---

## 1. Périmètre exact

**Dans le périmètre (F1 v8)** :

1. Modèle métier `StockEntry` (core pur) + enveloppes de synchronisation (HLC + tombstones)
   distinctes du modèle.
2. Section serveur **`stock`** (additive) du document kitchen par compte.
3. Migration des anciennes sections `fridge`/`pantry` vers `stock`, **id-préservée, sans
   quantité inventée**, avec traitement des tombstones historiques et des appareils hors ligne.
4. Présence dérivée **exactement égale au comportement actuel** : `KitchenStore` conserve
   `fridge: string[]` et `pantry: string[]` dérivés du stock.
5. Compatibilité Firestore (section document) + **conception** de la cible SQL `fridge_entries`
   (clé primaire composite `(account_id, id)` — annexe identifiants § 6.1) ; la transformation
   relationnelle reste 6a, non exécutée dans ce lot.
6. Sauvegarde JSON : les entrées intègrent export/import + aller-retour testé.
7. Tests : core, convergence multi-appareils (§ 9), migration, restauration, contrats
   mémoire/SQLite/émulateur Firestore, mesures de performance.

**Hors périmètre (intouchables)** :

- `src/core/matching/**` — **aucun diff** (garde vérifiée à chaque commit) ; le moteur continue
  de consommer des ids via `fridgeSuggestions(recipes, fridge, options, ctx)` et
  `ctx.pantryIds` (`src/core/matching/analysis.ts`).
- Écrans (`src/features/**`) : **aucun changement d'interface** ; `FridgeSelector` continue
  d'appeler `toggleFridgeItem` / `togglePantryItem` avec un id d'ingrédient.
- Aucune réservation, aucune allocation (B-F1-6 ✅), aucune règle de disponibilité (F2/F3).
- Aucune transformation relationnelle exécutée ; **aucune refonte générale des modèles**
  (l'analyse d'identifiants de l'annexe ne modifie aucun modèle existant).
- Aucun changement des autres sections kitchen, de `kitchen_history`, des routes d'auth.

## 2. État réel du code vérifié (base de toutes les décisions)

| Élément vérifié                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Preuve                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ElementSet` = deux cartes de versions HLC (`added`/`removed`), présence dérivée (`added > removed`, **égalité exacte = supprimé**), fusion commutative, purge au-delà de la rétention, remise à zéro de l'appareil muet (`STALE_DEVICE_MS` = 90 j − 7 j de marge)                                                                                                                                                                                                                                                                                         | `src/core/kitchen/elementSets.ts`                                         |
| Caps existantes : 300 présents / 2 000 tombstones / id ≤ 200 / device ≤ 64 ; `wrapLegacyList` enveloppe les listes plates (migration d'ancien format à la réception, déjà testée côté serveur)                                                                                                                                                                                                                                                                                                                                                             | `ELEMENT_SET_LIMITS`, `readSection` + `kitchenRoutes.test.ts`             |
| `KitchenSync` : push debouncé 2 s de la **carte entière** de la section, flush au `hidden`, pull ≤ 1/min, **ledger générique** (sections pendantes + heures), `applyRemote` fusionne seulement si plus récent, `resetLocal` de l'appareil muet **après** un pull réussi                                                                                                                                                                                                                                                                                    | `src/application/kitchen/KitchenSync.ts`                                  |
| Serveur : `PUT /api/kitchen` en **une transaction** — fusion par section **au moment du commit** (deux appareils simultanés ne s'écrasent jamais) ; ensembles fusionnés élément par élément + purge ; le reste dernier-écrit-gagnant ; caps par section ; refus 400 sans écriture                                                                                                                                                                                                                                                                          | `server/routes/kitchenRoutes.ts`                                          |
| Stockage local : un document par scope (`chnowa_kitchen_<uid>_v1` / `_local_v1`) : listes, `elements` (cartes HLC), `deviceClock`, `pending`, `sections`, `lastSyncedAt` ; le diff local → versions existe (`withListChange` : avant/après → `tickClock`)                                                                                                                                                                                                                                                                                                  | `src/infrastructure/local/{storage,localRepositories}.ts`                 |
| **`resetLocal` exactement** : appelé uniquement dans `pullNow` après un pull réussi, si `lastSyncedAt` est plus vieux que `STALE_DEVICE_MS` ; écrit un document vide **en conservant `deviceClock` et `lastSyncedAt`** ; la liste `pending` est **effacée** (les opérations locales non synchronisées d'un appareil muet depuis > 83 j sont perdues — compromis documenté du mécanisme existant, protection contre la résurrection) ; puis `applyRemote` adopte le document frais ; l'appareil n'émet jamais une version plus vieille qu'une qu'il a émise | `KitchenSync.pullNow` + `localRepositories.resetLocal`                    |
| Identifiants d'ingrédients **vérifiés** : 118 ids built-in `ing_` + `[a-z0-9_]` ≤ 22 caractères, sans doublon ; créations backoffice `createId('custom_ing')` ; **aucune validation d'id côté `validateIngredient`** (l'id est donné à la création) — la conversion doit donc **vérifier** le jeu de caractères plutôt que le supposer (§ 5)                                                                                                                                                                                                               | `initialIngredients.ts`, `CatalogAdmin.createIngredient`, `validation.ts` |
| Catégories d'ingrédients : built-in `vegetables, fruits, meats, fish, dairy_eggs, grains_pasta, spices_condiments, canned_pantry, other` — **renommables, déplaçables, jamais supprimables** (`built_in: true`) ; catégories backoffice dynamiques (`CATEGORY_ID_PATTERN = /^[a-z0-9_-]{1,64}$/`)                                                                                                                                                                                                                                                          | `src/core/categories/{builtIn,types}.ts`                                  |
| Unités : registre partagé (`units`), id dérivé du libellé (`UNIT_ID_PATTERN = /^[a-z0-9_-]{1,64}$/`) ou `createId('unit')` ; lecture insensible casse/espaces (`unitLookupKey`) ; les unités configurées vivent **en base** (invisibles du serveur sans lecture)                                                                                                                                                                                                                                                                                           | `src/core/units/info.ts`, `CatalogAdmin`                                  |
| Unicité d'email : **garantie transactionnelle existante** (`commit` + garde `email_index`, `expected: null`) — le mécanisme à réutiliser pour toute unicité serveur ; normalisation trim + minuscules à la création ; téléphone normalisé E.164, **non unique** (aucune règle décidée)                                                                                                                                                                                                                                                                     | `server/auth/users.ts`, `src/core/accounts/validation.ts`                 |
| Sauvegarde JSON : sections listées explicitement, anciens backups importables (conversion à l'import, motif `backup.test.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                              | `src/core/backup/backup.ts`                                               |
| Le serveur **importe déjà `src/core`** (kitchen, accounts) — les règles de validation du core sont réutilisables côté serveur **sans duplication** (§ 4.5)                                                                                                                                                                                                                                                                                                                                                                                                 | `server/routes/kitchenRoutes.ts`, `server/auth/users.ts`                  |

## 3. Fichiers, modules et composants concernés (rôle actuel → évolution)

| Zone               | Fichier (rôle actuel)                                                                                  | Évolution F1                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Core (nouveau)** | `src/core/kitchen/entries.ts` — inexistant                                                             | **Créé** : `StockEntry`, contrat `StockEnvelope`/`StockSection` (§ 4.2), validation complète **partagée client/serveur** (§ 4.5), projection de présence, fusion d'enveloppes, ids déterministes (§ 5) |
| Core (tests)       | `src/core/kitchen/entries.test.ts` — inexistant                                                        | **Créé** : chaque règle, **toutes les combinaisons d'enveloppes**, fusion (issues), conversion aller-retour, ids déterministes (cas inhabituels inclus)                                                |
| Core (export)      | `src/core/kitchen/index.ts`                                                                            | + `export * from './entries'`                                                                                                                                                                          |
| Application        | `src/application/kitchen/stock.ts` (inexistant) + `KitchenStore.ts`                                    | **Module noyau entrées** consommé par `KitchenStore` : toggles réimplémentés sur le stock, `fridge`/`pantry` dérivés — **signatures et comportement publics inchangés**                                |
| Application (sync) | `KitchenSync.ts`                                                                                       | + section `stock` (envoi quand pendante, fusion à la réception) — ledger générique inchangé                                                                                                            |
| Ports              | `src/application/ports.ts`                                                                             | `KitchenRepository` + `loadStock()` / `mergeStock()` ; `RemoteKitchenDocument` + `stock`                                                                                                               |
| Infrastructure     | `localRepositories.ts`, `storage.ts`, `kitchenSyncHttpGateway.ts`                                      | cartes d'enveloppes dans le doc local, migration locale `ensureStockState`, `stock` ajouté à la liste de sections de la passerelle                                                                     |
| Serveur            | `kitchenRoutes.ts`                                                                                     | cas `stock` dans `readSection` (validation **core partagée** + caps), fusion d'enveloppes dans `mergeSections`, conversion transactionnelle legacy (§ 7), purge                                        |
| Sauvegarde         | `src/core/backup/backup.ts` (+ tests)                                                                  | `stock` dans export/import, conversion des anciens backups, aller-retour testé                                                                                                                         |
| **Non touchés**    | `src/core/matching/**`, `src/features/**`, `kitchen_history`, autres sections, auth, modèles existants | — (l'annexe identifiants ne modifie aucun modèle existant)                                                                                                                                             |

Estimation : ~13 fichiers (2–3 créés, le reste évolués), aucune dépendance nouvelle, aucune
route nouvelle, aucune collection Firestore nouvelle.

## 4. Contrats entre modèle métier, adaptateurs et synchronisation

### 4.1 Modèle métier (core pur)

`StockEntry` = le type du dossier F1 v8 § 4 (sans aucun champ de stockage ni de sync). La
projection de présence dérivée (§ 7 ter du dossier F1) est une fonction pure du core. **Selon le
principe d'identifiants du chef (§ 3) : `StockEntry.id` est l'identifiant technique,
`ingredient_id` référence l'identifiant technique de l'ingrédient, aucun code fonctionnel
supplémentaire n'est créé** (annexe identifiants § 4).

### 4.2 Contrat canonique `StockEnvelope` (non ambigu, toutes les combinaisons documentées)

```ts
/** Minimal reference kept on a tombstone (§ 4.2.1 bis): the deleted entry's identity
    and its ingredient attachment — enough for the legacy projection aggregation.
    The business rules of StockEntry NEVER apply to a stub (§ 4.5); it is never
    displayed, counted, or exported as content. */
export interface StockTombstoneStub {
  /** The deleted entry's id (the envelope key itself). */
  id: string;
  /** The ingredient the entry was attached to (projection aggregation key). */
  ingredient_id: string;
  /** Which view the entry belonged to. */
  location: 'fridge' | 'pantry';
}

/** One stock entry as it travels: a typed, non-ambiguous union of the two canonical
    states (v6). The `state` field exists for typing and persistence clarity; the
    semantic authority remains the HLC comparison (§ 4.2.1) — a declared state that
    contradicts the comparison is INVALIDE (rejected by the parser). Never stored
    inside StockEntry (architecture guard). */
export type StockEnvelope =
  | {
      state: 'active';
      /** The full business entry (validated per § 4.5). */
      entry: StockEntry;
      /** HLC version of the last event on the entry. */
      version: ElementVersion;
      /** A superseded deletion, kept when the entry was re-created after deletion
          (version > removed). Absent = never deleted. */
      removed?: ElementVersion;
    }
  | {
      state: 'tombstoned';
      /** Reference stub only — business data is gone (§ 4.2.1 bis). */
      stub: StockTombstoneStub;
      /** HLC version of the deletion. */
      version: ElementVersion;
      /** Canonical equality: identical to `version` (ElementSet rule: exact tie = deleted). */
      removed: ElementVersion;
    };
/** The `stock` section: one envelope per entry id (unique per stock). */
export type StockSection = Record<string, StockEnvelope>;
```

**Invariant d'intégrité de l'identité (garantie du chef, complément post-validation)** :
l'identité de l'enveloppe est **la clé de la carte `StockSection`** — pour toute enveloppe
ACTIVE `envelope.entry.id === clé`, pour toute enveloppe TOMBSTONED
`envelope.stub.id === clé` ; toute incohérence (identité ≠ clé) est **INVALIDE** et rejetée
**avant stockage ou fusion** (parser, § 4.2.4) — une candidate incohérente perd toujours la
fusion (§ 4.5), l'enveloppe valide déjà stockée n'est **jamais** écrasée ; les conversions
(§ 7.1), la migration locale (§ 7.2), la projection (§ 7.4), l'export/import et la
restauration (§ 13) produisent des enveloppes respectant cet invariant — **testé
systématiquement** (§ 12, § 16).

**4.2.1 Les deux états canoniques** — le contrat définit une fonction pure
`envelopeState(env): 'active' | 'tombstoned'`, décision **toujours** prise en comparant
`version` et `removed` (jamais en se fiant au seul champ déclaré `state`) ; un `state`
déclaré qui **contredit** la comparaison rend l'enveloppe **INVALIDE** (rejetée par le
parser) — le typage décrit la donnée, la comparaison HLC reste l'autorité sémantique :

| #   | `entry`                                          | `removed`  | Comparaison HLC (`version` vs `removed`) | État canonique | Contrat                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------ | ---------- | ---------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | présent                                          | absent     | —                                        | **ACTIVE**     | l'état normal ; `{ state: 'active', entry, version }` (`removed` absent) ; `entry` complet et valide selon § 4.5                                                                                                                                                                                                                                                                                                                                                             |
| 2   | présent                                          | présent    | `version > removed`                      | **ACTIVE**     | **recréation après suppression** (ré-ajout légitime, HLC plus récent) — la suppression antérieure est conservée comme _superseded_ ; c'est la seule forme de « résurrection », volontaire et versionnée                                                                                                                                                                                                                                                                      |
| 3   | présent                                          | présent    | `version ≤ removed`                      | **TOMBSTONED** | l'entrée a été supprimée après sa dernière modification ; la fusion la convertit en **forme canonique** (stub extrait de l'entrée, § 4.2.1 bis) — **jamais persistée en l'état** (état intermédiaire de fusion uniquement)                                                                                                                                                                                                                                                   |
| 4   | stub de référence                                | présent    | (indifférent)                            | **TOMBSTONED** | **forme canonique d'une tombstone** : `{ state: 'tombstoned', stub, version, removed }` avec `removed == version` (égalité exacte = supprimé, règle `ElementSet`) — produite par la conversion d'anciennes tombstones (§ 7) et par toute suppression (l'écriture de la suppression remplace l'enveloppe par cette forme : payload réduit, **rattachement ingrédient conservé**, § 4.2.1 bis) ; `stub.ingredient_id`/`location` alimentent l'agrégation de projection (§ 7.4) |
| 5   | ni `entry` complet ni `stub`                     | quelconque | quelconque                               | **INVALIDE**   | forme ne satisfaisant aucune branche de l'union — rejeté par le parser (jamais stocké, jamais affiché)                                                                                                                                                                                                                                                                                                                                                                       |
| 6   | `state` déclaré contredit par la comparaison HLC | quelconque | quelconque                               | **INVALIDE**   | rejeté par le parser — la comparaison reste l'autorité sémantique (garantie conservée des v4/v5)                                                                                                                                                                                                                                                                                                                                                                             |

**4.2.1 bis — Métadonnées de tombstone et validation propre du stub (demandé par le chef,
v5 — typé en v6)** : la projection legacy (§ 7.4) agrège par `ingredient_id` **y compris les
enveloppes supprimées** — une tombstone doit rester **rattachée à son ingrédient et à son
emplacement** sans conserver l'entrée complète (payload). Forme canonique (type
`StockTombstoneStub`, § 4.2) :

```
{ state: 'tombstoned', stub: { id, ingredient_id, location }, version: r, removed: r }
```

- **pourquoi ces trois champs** : `ingredient_id` + `location` = l'agrégation de projection
  (§ 7.4) ; `id` = l'identité de la tombstone elle-même (cohérence d'enveloppe — égal à la
  clé de la carte) ;
- **rattachement garanti** : les ids `createId('stock')` ne sont **pas** décodables — le
  stub porté à la suppression est la seule source ; pour les ids déterministes
  (`st_<loc>_<ingrédient>`), le **décodeur § 5** permet une **re-dérivation exacte et
  déterministe du stub** si celui-ci manque (l'id encode littéralement l'emplacement et
  l'ingrédient — aucune invention, la clé EST la donnée) ;
- **stub écrit à la suppression et à la conversion historique** (§ 7.1) **à partir de la
  clé réelle**, jamais deviné ni reconstruit ; quantités, dates, notes et `origin` sont
  **abandonnés** (l'entrée est supprimée ; les données enrichies ne reviennent que par un
  re-ajout) ; le stub n'est **jamais affiché, ni compté, ni exporté comme contenu**
  (l'export le porte comme métadonnée de tombstone, aller-retour testé) ;
- **validation propre du stub (≠ règles métier d'une `StockEntry`)** — règles
  **structurelles seulement** : `id` non vide, sans les motifs interdits (garantie commune
  Firestore/SQL), ≤ cap (§ 10) ; `ingredient_id` non vide ; `location` ∈ {'fridge',
  'pantry'} ; **aucune règle de registre ni de référence sur le stub** (en particulier
  `ingredient_id` n'est **pas** vérifié contre le catalogue : une tombstone peut référencer
  un ingrédient supprimé du catalogue entre-temps — la rejeter détruirait la tombstone et
  ouvrirait une résurrection) ; les règles métier (`validateStockEntry`) s'appliquent
  **exclusivement** à l'`entry` complète de l'état `active` ;
- **versions — rien n'est inventé** : la tombstone ne porte que la version de suppression
  réelle ; **aucune version d'ajout n'est nécessaire** (le cas absent de la projection
  n'écrit que `removed`, § 7.4 — correction v5 : la v4 supposait à tort la version d'ajout
  conservée dans la tombstone canonique) ;
- **fusion des métadonnées (suppressions concurrentes, multi-appareils)** : le stub dépend
  uniquement de l'entrée — deux tombstones de la même entrée portent le **même stub** ; la
  fusion garde la tombstone la plus récente **et son stub** (§ 4.2.2) ; versions égales +
  stubs différents (anomalie) = départage déterministe sur le stub sérialisé (§ 4.2.2 bis),
  signalé ;
- **tombstone sans stub et id non décodable** : cas défensif (impossible en pratique) —
  l'enveloppe reste **valide comme tombstone** (elle empêche la résurrection de son id)
  mais est **exclue de l'attribution de projection** (anomalie signalée, jamais silencieuse).

**4.2.2 Gestion des deux états concurrents (fusion — `mergeStockSections`, core, commutative,
testée)** — par id, les deux enveloppes se réconcilient par version HLC :

| Enveloppe locale | Enveloppe distante | Résolution (ordre HLC total existant)                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACTIVE (v1)      | ACTIVE (v2)        | la version **la plus récente** emporte, **écriture entière** (sans fusion de champs ni `undefined` — convention du projet)                                                                                                                                                                                                                    |
| ACTIVE (v)       | TOMBSTONED (r)     | `v > r` → ACTIVE (modification postérieure à la suppression) ; `v ≤ r` → TOMBSTONED (égalité exacte = supprimé, règle `ElementSet`)                                                                                                                                                                                                           |
| TOMBSTONED (r1)  | TOMBSTONED (r2)    | la tombstone **la plus récente gagne entièrement** (`version`, `removed` **et son stub**) — l'entrée reste supprimée, sa date de suppression est à jour, **le stub voyage avec la gagnante** ; à versions égales : stubs identiques ⇒ idempotent, stubs différents (anomalie) ⇒ départage lexicographique sur le stub sérialisé (§ 4.2.2 bis) |

**4.2.2 ter — Propriétés de la fusion et sélection du stub (précisé en v6)** : la fusion des
enveloppes est **commutative, associative et idempotente** — le résultat d'une fusion de N
enveloppes est identique quel que soit leur ordre d'arrivée et leur regroupement, et fusionner
deux fois ne change rien (démontré par tests, tombstones incluses). **Sélection du stub** :

1. versions de suppression **différentes** : la tombstone gagnante (la plus récente) emporte
   son stub — en fonctionnement normal les deux stubs sont **identiques** (ils ne dépendent
   que de l'entrée : id, ingredient_id, location — aucune information perdue) ;
2. versions égales + stubs **identiques** : **idempotence** (l'enveloppe est inchangée) ;
3. versions égales + stubs **différents** (anomalie de données) : **départage déterministe et
   commutatif** — le stub sérialisé lexicographiquement plus petit gagne, **l'issue est
   identique dans les deux ordres de fusion**, l'anomalie est signalée au rapport (jamais
   silencieuse) — testé ;

**4.2.2 bis — Égalité exacte de versions, par combinaison (cas demandé par le chef, précisé
en v4)** : en fonctionnement normal, deux enveloppes de **contenus différents** ne peuvent
pas porter la même version HLC — les versions d'un même appareil sont strictement
croissantes (`tickClock` : compteur jamais réutilisé) et deux appareils différents ne
partagent jamais un `deviceId` ; le même contenu porté par la même version est donc le cas
normal **idempotent**. Le contrat couvre néanmoins l'anomalie (donnée corrompue ou
artisanale), **combinaison par combinaison** :

| Combinaison à versions égales        | Résolution                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ACTIVE / ACTIVE, mêmes contenus      | **idempotence** — l'enveloppe est inchangée, la fusion répétée converge vers le même état (testé)                                                                                                                                                                                    |
| ACTIVE / ACTIVE, contenus différents | **départage déterministe et commutatif** : la forme canonique sérialisée de l'`entry` la lexicographiquement plus petite gagne — testé **dans les deux ordres de fusion** (l'issue est identique) ; traité comme une **anomalie de données** signalée au rapport, jamais silencieuse |
| ACTIVE / TOMBSTONED                  | **la suppression gagne toujours** (règle `ElementSet` : égalité exacte = supprimé) — **la règle lexicographique ne s'applique jamais ici** : une entrée ACTIVE ne peut jamais gagner contre une suppression à version égale (testé)                                                  |
| TOMBSTONED / TOMBSTONED              | **tombstone canonique** conservée (`{ state: 'tombstoned', stub, version, removed }`) — mêmes versions + stub identique ⇒ idempotent (testé) ; stubs différents (anomalie) ⇒ départage déterministe (stub sérialisé le plus petit gagne), signalé (testé)                            |

Le départage lexicographique est donc **cantonné aux cas ACTIVE/ACTIVE et tombstones à stubs
différents** ; l'ordre HLC total
reste le critère de décision partout ailleurs. Le test du cas ACTIVE/ACTIVE à contenus
différents documente son impossibilité en fonctionnement normal.

**4.2.3 Conservation et purge** : les tombstones sont ce qui empêche la résurrection — elles
restent jusqu'à la fenêtre de rétention (`TOMBSTONE_RETENTION_MS`, 90 j par défaut,
`KITCHEN_TOMBSTONE_RETENTION_MS` configurable, `0` = jamais purger — mécanisme existant
réutilisé) puis les enveloppes `TOMBSTONED` au-delà de la fenêtre disparaissent entièrement. Un
appareil muet au-delà de `STALE_DEVICE_MS` (83 j) se remet à zéro **avant** de pouvoir
ressusciter (§ 6.3). La purge ne touche jamais une enveloppe ACTIVE.

**4.2.4 Parser** (`parseStockSection`) : lit toute donnée externe (serveur, stockage local) ;
validation **par état** de l'union (§ 4.2) et rejet des états INVALIDES (#5, #6)
**enveloppe par enveloppe** (une enveloppe malformée est ignorée, les valides de la même
section sont conservées — lecture tolérante, jamais de `undefined` vers l'affichage, motif
`ccfa18e`) :

- **`state: 'active'`** : `entry` **complet** requis (les règles structurelles de § 4.5
  s'appliquent au parse ; les règles de registre/référence à l'écriture/fusion) ; `removed`
  facultatif, et s'il est présent `version > removed` est exigé (sinon INVALIDE #6) ;
- **`state: 'tombstoned'`** : `stub` **typé** requis (règles structurelles du stub,
  § 4.2.1 bis — jamais les règles métier d'une `StockEntry`) ; `removed` requis et
  `removed == version` exigé (égalité canonique, sinon INVALIDE) ; un champ métier
  supplémentaire dans le stub est ignoré (parsing tolérant) ;
- **`state` absent ou autre valeur** : enveloppe non conforme à l'union → INVALIDE (#5) ;
- **dérivation défensive du stub** : une tombstone sans stub mais à id déterministe
  décodable est acceptée, le stub est **re-dérivé exactement** de la clé (§ 4.2.1 bis) ;
  sans stub et non décodable : acceptée comme tombstone (elle empêche la résurrection de
  son id), **exclue de l'attribution de projection**, anomalie signalée ;
- **cohérence identité (garantie du chef, post-validation)** : `entry.id === clé` (ACTIVE)
  et `stub.id === clé` (TOMBSTONED) — une enveloppe dont l'identité contredit sa clé est
  **INVALIDE**, rejetée enveloppe par enveloppe (les valides de la même section sont
  conservées, jamais écrasées) ;
- les caps (§ 10) sont appliqués : au-delà, le
  refus est **explicite** (push refusé 400 côté serveur, écriture locale refusée par le core) —
  **jamais de troncature silencieuse**.

### 4.3 Ports (mots du domaine, aucun terme de stockage)

- `KitchenRepository` **+** `loadStock(): StockSection`, `mergeStock(remote: StockSection)`.
  Les signatures existantes restent (`saveFridge`/`savePantry` deviennent des différences
  liste→enveloppes, § 6) ; `resetLocal` vide aussi le stock (§ 6.3).
- `RemoteKitchenDocument` **+** `stock?: RemoteKitchenSection<StockSection>` — ledger et
  passerelle HTTP restent génériques (une section de plus dans la liste).

### 4.4 Adaptateurs et branchement

Local (`localRepositories.ts` + `storage.ts`) : `stock?: StockSection` dans le document par
scope ; HTTP (`kitchenSyncHttpGateway.ts`) : `stock` dans la liste de `asDocument` ; serveur :
validation + fusion + conversion (§ 7) — la collection `kitchen` ne change pas (son parser
accepte un objet `sections` validé par la route). `container.ts` ne change pas. La garde
d'architecture vérifie : core pur, pas de SDK, pas de plateforme, aucune notion de
stockage/section/HLC dans le type métier.

### 4.5 Validations client/serveur partagées (sans duplication, sans liste statique)

**Décision** : une **seule** fonction de validation, dans le core, consommée par le client et
le serveur (le serveur importe déjà `src/core` — § 2) :

```ts
/** Every business rule of a stock entry (dossier F1 § 4.2), written once.
    The registries and business references that may evolve from the backoffice are
    passed in — the core owns the rules, the callers own the registries (no static
    snapshot in code, no duplicated rule client-side vs server-side). */
export interface StockValidationContext {
  /** Registry-dependent: is this unit known (labels normalized, case/space-insensitive)? */
  isKnownUnit: (unit: string) => boolean;
  /** Registry-dependent: category ids allowed to carry `permanent: true` (§ 15-E6) */
  permanentCategories: ReadonlySet<string>;
  /** Business reference: the ingredient, with its category (null = unknown id) */
  getIngredient: (ingredientId: string) => { id: string; category: string } | null;
}
export function validateStockEntry(entry: StockEntry, ctx: StockValidationContext): Checked<StockEntry>;
```

**Répartition explicite des règles** (demandée par le chef) :

- **règles purement structurelles** (aucun registre) : forme et champs requis, cohérence
  `quantity`↔`unit` (présence solidaire), quantité strictement positive et finie, cohérence
  `expires_at`↔`expiry_type` (DLC/DDM), incompatibilité `permanent`↔(quantité ou péremption),
  cohérence `exhausted_at` (⇒ `permanent`, réactivation = suppression de la date), validité de
  l'id d'entrée (§ 5, **borne de longueur incluse — règle exécutée, voir § 5**),
  **cohérence `id`↔clé de la carte (§ 4.2 — `entry.id === clé` / `stub.id === clé`)**,
  bornes de
  taille — **exécutées par le serveur sur toute enveloppe** ;
- **règles dépendant d'un registre ou d'une référence** : unité connue, catégorie autorisée
  pour les permanents, **existence de l'ingrédient** (via `getIngredient`) — exécutées côté
  client à l'écriture avec les registres vivants, côté serveur **sur les enveloppes nouvelles
  ou modifiées du push** (les autres sont déjà validées et stockées) ; le serveur vérifie aussi
  la catégorie réelle de l'ingrédient référencé (règle « permanent » appliquée sur la donnée
  à jour du catalogue, pas sur celle de l'entrée).

- **Client** : `isKnownUnit` = registre vivant (unités built-in du core **+** unités configurées
  du catalogue chargé) ; `permanentCategories` = la constante du core (§ 15-E6) ;
  `getIngredient` = le catalogue chargé. Règle complète à l'écriture, erreurs affichées sur
  leur champ.
- **Serveur** : la **même** fonction vérifie les règles structurelles sur toute enveloppe et
  les règles de registre/référence sur les enveloppes nouvelles ou modifiées. Les registres
  sont lus **dans la transaction avec un cache en mémoire versionné** (§ 4.5 bis) ; coût
  typique de 1 à 3 lectures par push, borné par les caps — mesuré au § 10.
- **Cache de registres : politique d'invalidation (demandée par le chef)** — un cache périmé
  ne doit ni rejeter une unité ou un ingrédient récemment créés, ni accepter indéfiniment une
  référence supprimée :
  1. les registres (unités, ingrédients) sont mis en cache **avec un TTL court** (60 s,
     hypothèse confirmée par mesure § 10) ;
  2. **en cas d'échec d'une règle de référence, le serveur relit sans cache une fois** avant de
     refuser : une unité ou un ingrédient créé depuis moins d'un TTL n'est jamais rejeté à
     tort (le « double contrôle » élimine les faux rejets) ;
  3. la fenêtre résiduelle (une référence **supprimée** acceptée au plus TTL) est documentée
     et inoffensive : elle accepte temporairement une écriture qui visait une donnée qui
     existait encore il y a peu, sans corruption (le stock référence l'id, jamais la donnée) ;
  4. tout refus est **non destructif** : 400 avec le motif, la section déjà stockée est
     intacte, le client peut réessayer après résolution — récupération documentée.
- **Aucune divergence** : le serveur n'applique pas « moins » que le client — il applique la
  même fonction du core ; il n'en applique pas « plus » non plus (aucune règle propre au
  serveur hors les caps de payload, qui protègent l'infrastructure et non le métier).
- **Aucune liste statique fragile** : la liste des catégories permanentes est la constante du
  core limitée aux ids **built-in non supprimables** (§ 15-E6 — vérifiés dans le catalogue
  réel) ; toute extension future (autoriser une catégorie créée au backoffice) se fait dans le
  core (une ligne), jamais par un snapshot de données à la mode.
- **Validation sur le chemin de fusion (demandée par le chef, v4)** — une donnée malformée ne
  gagne **jamais** une fusion grâce à sa version HLC ou au départage lexicographique :
  1. **ordre imposé** : parse (enveloppe par enveloppe, § 4.2.4) → règles structurelles →
     règles de registre/référence (enveloppes nouvelles ou modifiées) → **seules les
     enveloppes validées entrent dans `mergeStockSections`** ;
  2. une enveloppe candidate susceptible de **gagner** une fusion (version plus récente ou
     départage à versions égales) est donc **validée avant** de pouvoir remplacer une
     enveloppe valide — une candidate invalide est rejetée (400 serveur / refus local non
     destructif) et l'enveloppe valide déjà stockée reste en place ;
  3. les enveloppes **historiques déjà stockées** ne sont pas re-validées à chaque push (elles
     l'ont été à l'écriture ; les re-valider toutes imposerait des lectures de registres
     inutiles) — le parse continue d'écarter une forme INVALIDE à la lecture (tolérance
     enveloppe par enveloppe, motif `ccfa18e`) ; une enveloppe stockée invalide (ne devrait
     jamais exister) ne peut pas gagner : la prochaine candidate valide la remplace ;
  4. le **départage à versions égales** (§ 4.2.2 bis) n'est appliqué qu'entre **deux enveloppes
     validées** — jamais entre une valide et une invalide (l'invalide perd toujours).

## 5. Identifiants : stratégie **vérifiée**, génération, unicité

**Vérification exigée par le chef, faite dans le code (§ 2)** :

- les ids d'ingrédients **existants** sont tous `ing_` + `[a-z0-9_]`, ≤ 22 caractères, sans
  doublon (118 built-in vérifiés) ; les créations backoffice produisent
  `custom_ing_<ts36>_<rand4>` (même famille) ;
- **mais** aucun validateur n'impose ce jeu de caractères (`validateIngredient` ne contrôle pas
  l'id) : la stratégie ne le **suppose** pas, elle le **vérifie** à chaque génération
  déterministe ;
- caractères interdits pour un id d'entrée (garantie commune Firestore/SQL) : jamais `/`,
  jamais `.` ou `..` seuls, jamais `__.*__`, non vide, ≤ 1 500 octets.

**Génération déterministe (migrations et reprises) — injective, sans `Buffer`, navigateur et
serveur** :

```ts
/** Deterministic presence-entry id (§ 7 quater of the functional dossier).
    Injective over ALL Unicode strings — the proof below matches this exact algorithm.
    Pure TypeScript (no Buffer, no btoa, no platform API): identical result in the
    browser and on the server; migration replays are reproducible on both sides.
    Empty source ids and results beyond the section cap (§ 10) are refused explicitly —
    never truncated, never silently replaced. */
const SAFE_TAIL = /^[A-Za-z0-9_-]+$/;
const RESERVED = /^__.*__$/;
const ESCAPE_MARKER = '.';
const HEX_WIDTH = 6; // every code point (up to U+10FFFF) fits in 6 hex digits

export function presenceEntryId(location: 'fridge' | 'pantry', ingredientId: string): string {
  if (ingredientId.length === 0) {
    // Explicit refusal: an empty source would produce a bare `st_<location>_` id.
    throw new Error('presenceEntryId: empty ingredient id');
  }
  // Iterate CODE POINTS (`for...of`) and escape each WHOLE code point. This fixes the
  // v3 flaw the chef flagged: `[...id]` (code points) mixed with `charCodeAt(0)` (the
  // first UTF-16 code unit only) let two astral characters sharing a high surrogate
  // (e.g. U+1F600 and U+1F601) escape identically. Here the full code point is escaped.
  const escape = (id: string): string => {
    let out = '';
    for (const ch of id) {
      out += SAFE_TAIL.test(ch) ? ch : ESCAPE_MARKER + ch.codePointAt(0)!.toString(16).padStart(HEX_WIDTH, '0');
    }
    return out;
  };
  const tail = SAFE_TAIL.test(ingredientId) && !RESERVED.test(ingredientId) ? ingredientId : escape(ingredientId);
  return `st_${location}_${tail}`;
}

/** Round-trip decoder — contract: decode(location, encode(location, id)) === id for
    every source id. Pure TypeScript (String.fromCodePoint), browser and server.
    Not a validator: ids reaching this function were produced by `presenceEntryId`;
    the section parser validates ids independently (§ 4.2.4). */
export function decodePresenceEntryId(location: 'fridge' | 'pantry', entryId: string): string {
  const prefix = `st_${location}_`;
  if (!entryId.startsWith(prefix)) throw new Error('decodePresenceEntryId: wrong prefix');
  const tail = entryId.slice(prefix.length);
  let out = '';
  for (let i = 0; i < tail.length;) {
    if (tail[i] === ESCAPE_MARKER) {
      // Fixed-width token: the marker is always followed by exactly 6 hex digits.
      out += String.fromCodePoint(parseInt(tail.slice(i + 1, i + 1 + HEX_WIDTH), 16));
      i += 1 + HEX_WIDTH;
    } else {
      out += tail[i];
      i += 1;
    }
  }
  return out;
}
```

- **Injectivité : la preuve correspond exactement à l'algorithme ci-dessus (jamais seulement
  théorique)** — la faille signalée par le chef sur la v3 est réelle : `[...id]` parcourt des
  **points de code** tandis que `charCodeAt(0)` ne lit que le **premier code unit UTF-16** —
  deux caractères hors BMP partageant le même surrogate haut (`😀` U+1F600 et `😁` U+1F601,
  surrogate haut `D83D`) produisaient le même échappement. Correction : l'itération et
  l'extraction utilisent **toutes deux le point de code** (`for...of` + `codePointAt(0)`) et
  l'échappement couvre le **point de code entier** sur 6 chiffres hexadécimaux à largeur
  fixe (jusqu'à U+10FFFF) — deux points de code distincts donnent toujours deux jetons
  distincts. L'injectivité repose sur la **disjonction des deux familles de tails** :
  - branche **raw** (charset sûr, non réservé) : le tail ne contient jamais `.` (le charset
    l'exclut) et ne correspond jamais au motif réservé `__.*__` ;
  - branche **échappée** : soit le tail contient au moins un `.` (un caractère hors charset
    existait — or `.` est hors du charset sûr, un tel tail ne peut donc égaler aucun tail
    raw), soit le tail est un id **réservé** (`__x__` : tous ses caractères sont dans le
    charset sûr, l'échappement ne le modifie pas — mais la branche raw l'exclut, donc aucun
    tail raw ne peut l'égaler) ; dans les deux cas, aucun tail échappé n'égale un tail raw ;
  - **décodage unique** : dans un tail échappé, tout `.` est suivi d'exactement 6 chiffres
    hexadécimaux (largeur fixe) — l'analyse caractère par caractère est sans ambiguïté ;
    `decodePresenceEntryId` vérifie le contrat `decode ∘ encode = identité` sur tout id
    source (testé) ;
  - **l'exemple du chef est résolu** : `YS8` (sûr) → `st_fridge_YS8` ; `a/` (échappé) →
    `st_fridge_a.00002f` — distincts ; `a/1` → `st_fridge_a.00002f1`, distinct de `a_1` ;
  - le préfixe `st_` empêche toute correspondance au motif `__.*__` et exclut `/` ; le
    préfixe `st_` + l'emplacement séparent frigo et placard ; les entrées créées hors
    migration utilisent `createId('stock')` (`stock_<ts36>_<rand4>`) — préfixe distinct,
    aucune collision possible avec `st_`.
- **Refus explicites (exigés par le chef, v4)** : id source **vide** → refus (jamais un id
  tronqué du type `st_fridge_`) ; id résultat dépassant la cap (§ 10) → refus explicite avec
  le motif — **aucune troncature, aucune perte silencieuse**.
- **Application réelle de la borne de longueur (demande du chef, v5)** : la borne n'est pas
  une simple mention documentaire — elle est une **règle structurelle de
  `validateStockEntry`** (§ 4.5), donc **exécutée par le client à chaque écriture et par le
  serveur à chaque push** (refus 400) ; la conversion et la migration vérifient la borne
  **avant toute écriture** (refus explicite) ; `presenceEntryId` reste pure (aucune borne
  codée en dur dans la génération — le commentaire du code renvoie au point d'application
  unique, la validation) ; un id trop long n'entre donc **jamais** dans le stock.
- **Tests imposés (démonstration exigée, pas une affirmation)** — le jeu de test inclut :
  **plusieurs caractères Unicode hors BMP partageant le même surrogate haut** (le cas exact de
  la faille v3, ex. `😀` U+1F600 vs `😁` U+1F601), **accents et caractères combinants** (`e` +
  U+0301 vs `é` U+00E9 : deux points de code distincts → deux ids distincts), caractères
  interdits (`/`, `.`, `__…__`), paires adversariales **croisées entre familles** (`YS8` vs
  `a/`, `a_1` vs `a/1`, et variantes), chaînes longues et **dépassements de cap** (refus
  testé), **id vide** (refus testé), **aller-retour encodage/décodage à l'identique** sur tout
  le jeu, injectivité exhaustive sur le jeu (aucune paire distincte → même id),
  reproductibilité client/serveur (même fonction, mêmes résultats), test source excluant
  `Buffer` et `process` de ce module.
- **Compatibilité navigateur/serveur** : aucun `Buffer`, aucun `btoa`, aucun API de
  plateforme — TypeScript pur (`String.fromCodePoint`, ES2015) ; même résultat des deux
  côtés, y compris pour les reprises de migration (reproductibilité exigée) ; un test source
  exclut explicitement `Buffer` et `process` de ce module.
- **Identifiants trop longs : refus contrôlé, jamais de troncature** — l'échappement par
  point de code coûte 7 caractères par caractère hors charset ; pire cas d'un id source de
  190 caractères tous hors charset ≈ 190 × 7 + 10 = **1 340 octets** — sous la garantie
  commune (1 500) mais **au-dessus de la cap pratique** (hypothèse ≤ 1 000, § 10 : le refus
  explicite s'applique dès ≈ 141 caractères tous hors charset) ; **les ids réels** (`ing_*`
  ≤ 22 caractères, tous dans le charset sûr) ne sont **jamais échappés** et donnent des ids
  ≤ 38 caractères ; la cap est confirmée par mesure (§ 10).
- **Conformité au principe d'identifiants (§ 3 du chef)** : l'entrée embarque l'`ingredient_id`
  **technique** (immuable — renommer un ingrédient ne change jamais son id), jamais un nom ni
  un code métier modifiable ; `StockEntry.id` reste l'identifiant technique de l'entrée et
  n'est jamais réécrit ; conséquence documentée : l'emplacement fait partie de l'id
  (immuable) — déplacer une entrée du frigo vers le placard (futur E4) = suppression +
  recréation, aucune action de déplacement n'existe en F1.
- **Unicité** : par stock/compte (clé de la carte `StockSection` ; en SQL : PK composite
  `(account_id, id)` — annexe § 6.1). Le niveau de garantie d'`createId` est le même que
  celui des ids de listes et d'items existants (même mécanisme éprouvé).

## 6. Présence dérivée et comportement actuel préservé

**6.1 Projection** (dossier F1 § 7 ter, implémentée telle quelle) : alimentent la présence
dérivée les enveloppes ACTIVE **sauf les permanents temporairement épuisés** ; un permanent
actif est présent ; **les péremptions dépassées n'y sont pas appliquées** (règles F2) ;
`location` sépare les deux vues. Test d'équivalence : pour des données migrées,
`derivedPresence(entries, 'fridge') == ancien fridge`, idem placard.

**6.2 Comportements de l'interface actuelle, conservés à l'identique** :

- `toggleFridgeItem(id)` / `togglePantryItem(id)` (signatures inchangées) : id absent →
  **création d'une entrée de présence** (id déterministe `st_<loc>_<id>`, présence seule,
  `origin: 'manual'`, `added_at` = maintenant) ; id présent → **suppression logique**
  (enveloppe remplacée par sa forme canonique TOMBSTONED, § 4.2.1 #4). Le diff avant/après
  réutilise la mécanique `withListChange` vérifiée.
- `clearFridge()` : vidage **explicite et global** (≠ le retrait d'un seul ingrédient) :
  tombstones de **toutes** les entrées de l'emplacement ; vue identique.
- `useKitchen()` expose toujours `fridge: string[]` / `pantry: string[]` dérivés —
  `useMatchingInputs`, suggestions, recherche et courses ne voient aucune différence.
- Invités (scope `local`) : stock hors ligne, jamais synchronisé (inchangé).

**6.3 Retrait multi-entrées et `resetLocal` exact** :

- **Retrait d'un ingrédient avec plusieurs entrées** (§ 15-E3) : le toggle cible d'abord
  l'**entrée de présence déterministe** ; sinon l'entrée **la plus récente** (`added_at` max,
  départage par id) ; un retrait répété supprime la suivante — **jamais toutes**. Cohérent
  avec l'interface actuelle : un toggle = un retrait d'une entrée (l'ingrédient peut rester
  « présent » si d'autres entrées subsistent — comportement du contrat, testé, bien que rare
  en F1 car aucune UI ne crée d'entrées supplémentaires avant E4).
- **`resetLocal` (comportement exact, exigé par le chef)** : appelé **uniquement** dans
  `pullNow`, **après** un pull réussi, et seulement si `lastSyncedAt` est plus vieux que
  `STALE_DEVICE_MS` (83 j). Ordre : pull → `resetLocal` (écrit un document vide **en
  conservant `deviceClock` et `lastSyncedAt`**) → `applyRemote(document frais)` →
  `recordSynced`. La liste `pending` est **effacée** : les opérations locales non
  synchronisées d'un appareil muet depuis plus de 83 jours sont **perdues**. F1 étend ce
  comportement au stock (le document vide ne porte plus de `stock` ; l'horloge HLC conservée
  — l'appareil n'émet jamais une version plus vieille qu'une qu'il a émise). Ce cas fait
  partie des tests de convergence (§ 9, scénario 6) et n'est pas traité comme un simple
  scénario « tout le monde est connecté ».
- **Compromis fonctionnel explicite (demandé par le chef) — perte acceptée, pas une
  conséquence technique automatique** : la perte des opérations en attente d'un appareil muet
  est un **risque assumé** présenté comme tel : (i) c'est le **comportement historique** de
  l'application, déjà en production pour les sections actuelles ; (ii) F1 le **maintient tel
  quel** (aucun changement de politique, aucune régression) ; (iii) l'alternative (tenter un
  push de dernière chance avant réinitialisation, ou prévenir l'utilisateur) serait une
  évolution de politique de sync **hors périmètre F1**, demandable séparément. Le test du
  scénario 6 vérifie **les deux faces** : aucune résurrection d'une donnée supprimée **et**
  la perte documentée des opérations pendantes (le test énonce le compromis, il ne le
  déguise pas). **Statut du compromis : accepté par le chef** lors des arbitrages
  précédents (confirmé à la revue v3, rappelé à la validation du dossier v6) — le
  comportement historique convenu est conservé, les tests correspondants restent
  obligatoires, **aucune nouvelle validation de cet arbitrage n'est nécessaire**.

## 7. Migration des anciennes sections — protocole exécutable

**Stratégie (E1) : conversion contrôlée côté serveur (option (a) du dossier F1)**, complétée
par une conversion locale symétrique — le precedent `wrapLegacyList` (acceptation d'un ancien
format à la réception, déjà testé) et la fusion transactionnelle au commit le rendent sûr ;
l'option (b) (rejet + resynchronisation) exigerait un chemin de récupération client inédit sans
avantage ici (détail des conséquences au § 15-E1).

### 7.1 Côté serveur (point unique de conversion)

À **chaque** `PUT /api/kitchen`, dans la transaction existante, avant la fusion :

1. Si le document stocké ou la requête contient des sections legacy `fridge`/`pantry` (cartes
   `ElementSet` ou listes plates enveloppées par `wrapLegacyList`) **et** la fenêtre de
   transition est ouverte (§ 11) — **conversion par la fonction pure du core
   `convertLegacyElementSet(set, location)`** : un id d'ingrédient peut figurer dans les deux
   cartes (`added` **et** `removed` — ajouté, supprimé, parfois ré-ajouté) ; la conversion
   produit **une seule enveloppe candidate par id déterministe `st_<loc>_<id>`** (§ 5),
   jamais deux enveloppes concurrentes, en respectant strictement la sémantique HLC existante :
   - `added` seul (pas de `removed`) → **ACTIVE** : `version` = la version d'ajout reprise
     telle quelle ; `entry` = présence seule (`location` selon la section, `origin: 'manual'`,
     `added_at` = date de la version) ;
   - `removed` seul (pas de `added`) → **TOMBSTONED canonique avec stub** (§ 4.2.1 bis) :
     `{ state: 'tombstoned', stub: { id, ingredient_id, location }, version: r, removed: r }`
     — le stub est écrit **à partir de la clé réelle des cartes legacy** (l'id d'ingrédient
     est connu de la conversion), jamais deviné ni reconstruit ;
   - `added > removed` → **ACTIVE** avec la version d'ajout (la plus récente des deux
     événements) ;
   - `removed > added` → **TOMBSTONED** (forme canonique avec stub, version de suppression) ;
   - `removed == added` → **TOMBSTONED** (égalité exacte = supprimé, règle `ElementSet`) ;
   - **reconnaissance d'écho (v5)** : toute version portant `device: 'server'` rencontrée
     dans les cartes poussées est un **écho de projection** (§ 7.4), jamais une opération
     métier — elle est **ignorée** par la conversion (aucune enveloppe créée, modifiée ou
     réactivée par un écho) ;
   - **fusion des candidats dans le stock** (règles § 4.2.2, enveloppe par enveloppe), avec
     une protection explicite : un candidat **ACTIVE de présence nue** issu du legacy ne
     remplace **jamais** les données métier d'une enveloppe stockée déjà ACTIVE (une entrée
     enrichie n'est jamais appauvrie par un re-ajout legacy) — ses données sont conservées et
     la version avance au **max** des deux (le re-ajout legacy est enregistré comme événement,
     jamais comme un écrasement des données) ; un candidat **TOMBSTONED** suit les règles
     standard (une suppression legacy plus récente qu'une entrée stockée la supprime ; une
     modification stock plus récente survit) ;
   - les enveloppes produites passent la **même validation core partagée** (§ 4.5), y
     compris l'**invariant d'identité** (`entry.id`/`stub.id` **égaux à leur clé
     déterministe**, § 4.2) ;
2. Fusionner les sections entrantes (stock par enveloppe ; legacy fusionnée comme aujourd'hui) ;
3. **Projeter le stock vers les sections legacy** (compatibilité bidirectionnelle, § 7.4) ;
4. Purger les tombstones au-delà de la rétention (mécanisme existant).

Idempotence et convergence : quel que soit l'ordre et le nombre de pushes legacy, les mêmes ids
produisent les mêmes enveloppes et les versions se comparent par HLC (tests § 12).

### 7.2 Côté client (chaque appareil, au premier chargement après mise à jour)

`ensureStockState(d)` (motif `ensureElementState` existant) : sans section `stock` mais avec
des éléments/listes `fridge`/`pantry` → construire les enveloppes avec **la même fonction de
conversion du core** (§ 7.1, cinq cas), **les mêmes ids déterministes** et les versions
locales reprises telles quelles, marquer `stock` pendante,
**garder** les anciennes sections/éléments intacts (retour arrière A). Un appareil migré et la
conversion serveur convergent (mêmes ids, mêmes versions).

### 7.3 Déroulement des opérations (quand le développement sera autorisé)

1. **Déployer le serveur** : la route accepte `stock` (additive) et convertit le legacy à
   chaque push — les clients actuels ne voient aucun changement.
2. **Déployer le client** : conversion locale + lecture/écriture de `stock` ; UI et moteur
   identiques (projection = ancien comportement).
3. **Observation et mesures** (§ 10) sur les données de test.
4. **Lot de dette séparé** (validé séparément) : suppression des sections legacy et du code de
   conversion, après la fenêtre de transition (§ 11) et une sauvegarde de sécurité.

### 7.4 Compatibilité bidirectionnelle legacy ↔ stock pendant la fenêtre (demandée par le chef)

**Le problème corrigé** : la v2 ne décrivait que `ancien client → legacy → conversion → stock`
; or pendant la coexistence des versions, un ancien appareil ne lit que les sections legacy —
si un nouvel appareil modifie uniquement `stock`, l'ancien appareil ne voit rien, et les
sections legacy deviennent une copie périmée (ce qui viderait le rollback A de son sens).

**Décision : projection serveur du stock vers les sections legacy** (étape 3 du § 7.1) — à
chaque `PUT`, **après** la conversion legacy→stock et la fusion de `stock`, le serveur
**régénère les deux sections legacy depuis l'état courant du stock** :

**Agrégation imposée (correction v4)** : `StockSection` est indexée par **id d'entrée**,
`ElementSet` par **id d'ingrédient** — plusieurs entrées du même ingrédient et du même
emplacement ne peuvent pas être projetées indépendamment. `projectStockToLegacy(stock,
location)` (fonction pure du core, testée) **agrège d'abord les enveloppes par
`entry.ingredient_id`** puis produit, par ingrédient, **une** ligne dans chacune des deux
cartes legacy. Règle de présence : **l'ingrédient est présent dans la section legacy projetée
si et seulement si au moins une de ses entrées est ACTIVE** — l'ancien appareil continue de
voir l'ingrédient présent tant qu'une entrée ACTIVE existe (invariant convenu).

**Règle de versions** (les versions sont des objets HLC `ElementVersion`, comparés
lexicographiquement ; elles sont transportées telles quelles, sauf le re-positionnement
décrit ci-dessous) — pour chaque ingrédient X de l'emplacement, avec `A` = enveloppes ACTIVE
de X et `T` = enveloppes TOMBSTONED de X :

- **X présent** (`A` non vide) : carte `added[X]` = la version **max** des entrées ACTIVE ;
  carte `removed[X]` = la version **max** des tombstones de `T` (absente si `T` est vide).
  Si `removed[X]` existe et est **≥** `added[X]` (horloges décalées entre appareils : la
  suppression d'une entrée peut porter une version HLC supérieure à l'ajout, plus ancien,
  d'une **autre** entrée encore ACTIVE), la projection **re-positionne** la présence :
  `added[X]` = version synthétique serveur **strictement supérieure** à `removed[X]` —
  `{ physical: removed.physical, counter: removed.counter + 1, device: 'server' }`
  (`server` = id d'appareil **réservé**, jamais émis par un client — inspection § 17). Ce
  re-positionnement est **déterministe et pur** (aucune horloge appelée, deux exécutions sur
  le même stock produisent les mêmes cartes) ;
- **X absent** (`A` vide, `T` non vide) : carte `removed[X]` = la version **max** des
  tombstones de `T` ; carte `added[X]` : **non écrite** (pas d'`added` = absent, règle
  `ElementSet`) — **aucune version n'est inventée ni reconstruite** : la projection n'a pas
  besoin de la version d'ajout d'origine (correction v5 : la v4 supposait à tort cette
  version conservée dans la tombstone canonique — elle ne l'est pas, et elle n'est pas
  nécessaire) ; un appareil legacy qui possède encore sa propre `added` locale la conserve à
  la fusion — s'il la voit gagner (HLC), son push suivant est un **ré-ajout légitime**
  (sémantique `ElementSet` existante, garantie 5 du § 8), jamais une résurrection induite
  par la projection ;
- X sans aucune entrée dans cet emplacement : **absent des deux cartes**.

**Démonstration exigée — les sept cas imposés (table de tests § 12)** :

| Cas                                                                         | Résultat attendu de la projection                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Plusieurs entrées ACTIVE du même ingrédient                              | présent ; `added` = max des versions ACTIVE                                                                                                                                                                                                                                                                                                                             |
| 2. Une entrée ACTIVE + une TOMBSTONED                                       | présent (au moins une ACTIVE) ; `removed` = tombstone ; re-positionnement seulement si elle domine                                                                                                                                                                                                                                                                      |
| 3. Suppression de l'entrée de présence déterministe, une autre reste ACTIVE | la tombstone est enregistrée dans le stock ; la présence **persiste** (l'autre entrée) — conséquence documentée de E3 (« retrait = une entrée, jamais toutes ») : l'ancien appareil qui avait masqué l'ingrédient le revoit présent à la sync suivante ; aucune donnée perdue (la tombstone reste, l'entrée déterministe ne peut revenir que par un re-ajout explicite) |
| 4. Suppression de la dernière entrée ACTIVE                                 | absent ; `removed` seul écrit (pas d'`added`) — **aucune résurrection**                                                                                                                                                                                                                                                                                                 |
| 5. Nouvel ajout après suppression complète                                  | re-ajout = nouvelle version HLC postérieure (ou re-positionnement si horloge décalée) → présent ; la tombstone d'origine reste dans le stock                                                                                                                                                                                                                            |
| 6. Syncs legacy et stock concurrentes                                       | ordre fixe dans la transaction (§ 7.1) : conversion legacy→stock **d'abord**, fusion, **puis** projection — une écriture legacy plus récente est absorbée par le stock avant d'être re-projetée, jamais écrasée                                                                                                                                                         |
| 7. Versions HLC cohérentes avec les règles `ElementSet`                     | versions transportées telles quelles ; **seule exception documentée** : le re-positionnement synthétique du cas présent dominé — jamais écrit dans le stock, déterministe, borné (`counter + 1` sur le physical de la tombstone dominante), **et jamais rétroconverti** (reconnaissance d'écho, cycle ci-dessous)                                                       |

**Pourquoi le re-positionnement n'est pas un choix arbitraire de « version maximale »** :
sans lui, la sémantique LWW d'`ElementSet` (une seule paire `added`/`removed` par
ingrédient) ferait apparaître **absent** un ingrédient que le stock dit **présent** (au
moins une entrée ACTIVE) — la projection violerait l'invariant convenu. Avec lui :
(i) le cas **absent** ne re-positionne **jamais** (`removed ≥ added` y est garanti par
construction — aucune suppression légitime n'est annulée, aucune résurrection possible) ;
(ii) le cas **présent** ne re-positionne que lorsque le stock affirme la présence (≥ 1 entrée
ACTIVE) — la présence réaffirmée correspond toujours à une donnée réellement active du
stock ; (iii) la sémantique des suppressions et des ré-ajouts du **stock** n'est pas touchée
(le re-positionnement n'existe que dans les cartes legacy projetées).

**Cycle complet et rétroconversion — pourquoi la version synthétique ne peut jamais redevenir
une opération métier (demandé par le chef, v5)** :

Le scénario de boucle signalé par le chef est réel et doit être traité explicitement : un
appareil legacy fusionne la projection (qui peut porter une version synthétique `added`,
device `server`), puis **pousse ses cartes entières** (`KitchenSync` pousse la carte entière,
code vérifié § 2) — au `PUT` suivant, la conversion legacy→stock verrait une `added`
supérieure à la tombstone et pourrait **réactiver une entrée supprimée**. Le protocole
l'empêche par **reconnaissance d'écho** :

1. **Marquage** : la version synthétique est le **seul** artefact que le serveur écrit dans
   les sections legacy avec `device: 'server'` (`RESERVED_SYNC_DEVICE`, contrat complet
   § 7.5) — id d'appareil **réservé et disjoint des ids réels par construction**
   (`storage.deviceId()` = UUID/repli, vérifié) ;
2. **Reconnaissance à la conversion (§ 7.1)** : toute version portant `device: 'server'`
   rencontrée dans une section legacy poussée est un **écho de projection**, pas une
   opération métier — elle est **ignorée** : elle ne crée, ne modifie et ne réactive aucune
   enveloppe ; elle ne porte **aucune information que le stock n'a pas déjà** (elle a été
   **dérivée** du stock au cycle précédent) ;
3. **Démonstration du cycle complet** (le scénario exact du chef, exécuté pas à pas) :
   - stock : entrée déterministe D de X **TOMBSTONED** (r), autre entrée E de X **ACTIVE**
     (v_a ≤ r, horloge décalée) → présence stock = présente (≥ 1 ACTIVE) ;
   - projection : `added[X]` = synthétique > r, `removed[X]` = r → la section legacy voit X
     présent ;
   - appareil legacy : fusionne (X présent localement), pousse ses cartes au cycle suivant ;
   - conversion : la version synthétique est reconnue comme écho et **ignorée** — la
     candidate ACTIVE issue de l'écho n'existe pas ; D **reste TOMBSTONED** ; E reste
     ACTIVE ;
   - projection : même sortie qu'au cycle précédent — **point fixe** ;
   - **aucun cycle ne réactive D** ; les cycles suivants sont identiques (tests
     multi-cycles § 12) ;
4. **Cas absent** : la projection n'y écrit **jamais** de version synthétique (règle de
   versions ci-dessus) — un écho ne peut donc pas exister pour un ingrédient absent du
   stock, donc **aucune rétroconversion ne peut ressusciter quoi que ce soit** ;
5. **Séparation écho / vraie modification** : une vraie modification legacy porte le
   `deviceId` de l'appareil émetteur (jamais `server`) et est convertie normalement ; l'écho
   porte `server` et est ignoré ; les deux peuvent coexister dans la même carte poussée —
   la vraie modification est convertie, l'écho ignoré (mutuellement exclusifs par `device`,
   testé) ;
6. **Appareil hors ligne** : un appareil legacy peut conserver un écho hors ligne puis le
   pousser des semaines plus tard — la reconnaissance ne dépend que du `device` de la
   version (**stable dans la donnée**), donc l'écho reste ignoré quel que soit le délai ;
   la modification réelle éventuelle du même appareil (versions à son propre `deviceId`)
   est convertie normalement.

**Conséquence sur les cartes stockées** : les sections legacy servies par le serveur portent
l'écho (`device: 'server'`) — assumé et documenté : elles sont une **représentation dérivée**
du stock pendant la fenêtre ; seules les versions à `deviceId` client sont des opérations
métier.

### 7.5 Réservation `device: 'server'` — contrat vérifiable (demandé par le chef, v6)

Une simple mention « réservé » ne suffit pas : la garantie doit être assurée par le mécanisme
réel. Le contrat, adossé au code vérifié :

1. **Génération des `deviceId` clients — vérifiée dans le code (fait, pas hypothèse)** :
   `storage.deviceId()` (`src/infrastructure/local/storage.ts`) retourne
   `crypto.randomUUID()` ou, en repli, `<Date.now().toString(36)>-<random36>` — les deux
   formes **contiennent un tiret et excèdent 6 caractères** : elles ne peuvent **jamais**
   égaler la chaîne littérale `server` (ni `legacy`, émis par `wrapLegacyList`) —
   **disjonction par construction**, pas par convention. L'argument du tiret est
   structurel : tout id réel généré par ce code contient `-` ; `server` n'en contient pas.
2. **Constante unique** : `RESERVED_SYNC_DEVICE = 'server'` définie **une fois** dans le
   module de sync du core (`elementSets.ts`, voisin de `TOMBSTONE_RETENTION_MS`) — la garde
   de route (§ 7.5.3), la conversion (§ 7.1), la projection (§ 7.4) et les tests référencent
   **la même constante** (aucune chaîne dispersée).
3. **Garde de route (server, chaque `PUT`)** : toute version portant
   `device === RESERVED_SYNC_DEVICE` dans la section **`stock`** d'un push → **400** sans
   écriture (violation d'espace de noms serveur). Aucun client légitime ne peut être bloqué
   (son deviceId ne peut pas être `server`, point 1) ; un client forgeron ne peut ni injecter
   ni supprimer (refus non destructif, § 4.5).
4. **Conversion (section legacy)** : `device === 'server'` → **écho ignoré** (aucun effet
   métier, ni création ni suppression — § 7.4) ; **tout autre `device`** → opération métier
   convertie normalement. Les deux traitements sont mutuellement exclusifs par valeur.
5. **Usurpation — analyse imposée** : un client qui envoie `device: 'server'` obtient :
   en `stock` → refus 400 ; en legacy → son opération est traitée comme écho (no-op). Le
   **pire cas d'un forgeron est donc un no-op** — il ne peut pas faire ignorer la
   modification d'un autre appareil (les versions d'un appareil réel portent son propre id,
   jamais `server`) ni créer/effacer quoi que ce soit.
6. **Vraie modification jamais ignorée** : une modification réelle porte le `deviceId` de
   l'appareil émetteur, généré par `storage.deviceId()` — **ne peut pas être `server`**
   (point 1). Le mécanisme d'écho ne peut donc jamais masquer une opération utilisateur.
   L'override `options.deviceId` de `localRepositories` n'est utilisé que par les tests (le
   conteneur n'en passe pas) — vérifié, et couvert par un test de non-régression.
7. **Données anciennes** : les données pré-F1 ne peuvent pas contenir `server` (la
   projection n'existait pas) ; défensivement, la même règle s'applique (`stock` → 400,
   legacy → ignoré) — le pire cas reste un no-op, jamais une opération métier fabriquée.
8. **`parseVersion` reste générique** (device = chaîne non vide ≤ 64, code existant) — la
   réservation est un **contrat de route/conversion** (points 3–4), testé à ce niveau ; le
   parser du core reste réutilisable sans politique serveur incrustée.
9. **Tests imposés** : motif de génération (`deviceId()` jamais égal à `server` ni
   `legacy`, forme avec tiret) ; garde de route (`stock` + `device: 'server'` → 400, aucun
   écrit) ; écho ignoré en legacy (déjà § 12.2, étendu) ; projection n'émet `server` que
   pour les versions synthétiques ; usurpation (forgeron → no-op, vérifié dans les deux
   sections) ; non-régression de l'override de test.

- **Aucune résurrection, aucun écrasement** : la projection écrit les tombstones de stock
  dans les `removed` legacy (les appareils legacy voient les suppressions) ; les versions
  poussées par un ancien appareil ont **déjà été converties dans le stock** à l'étape 1 (avant
  la projection) — une modification legacy plus récente n'est jamais écrasée par la
  projection, elle est d'abord absorbée par le stock puis re-projetée ; un ancien appareil
  qui fusionne la section projetée applique les règles `ElementSet` existantes (dernier HLC
  par élément, égalité = absent).
- **Cohérence démontrée dans les deux sens** (scénarios § 9.8–9.9) et **tests de projection
  dans les deux sens** (§ 12) : modification d'un appareil **migré** → visible par un appareil
  **legacy** (via la projection) ; modification d'un appareil **legacy** → visible par un
  appareil **migré** (via la conversion) ; les anciens et les nouveaux appareils convergent
  vers le même état. Le revenir au code d'avant (rollback A, § 13) s'appuie sur des sections
  legacy **continûment à jour**, plus jamais sur une copie figée.
- **Coût** : deux sections legacy réécrites à chaque push pendant la fenêtre — inclus dans le
  protocole de mesure (§ 10, taille du document complet et coût du push de transition).
- **Côté client local** : le document local d'un appareil migré garde aussi ses anciennes
  listes `fridge`/`pantry` synchronisées avec le stock dérivé (la projection est identique,
  purement locale) — l'appareil reste cohérent avec lui-même et le retour au code d'avant est
  fonctionnel à tout moment de la fenêtre.

## 8. Tombstones historiques et suppressions historiques (garanties § 7 quater)

| Garantie (dossier F1)                                                   | Réponse d'exécution                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Tombstones existants pendant la migration                            | Conversion **des deux cartes** par `convertLegacyElementSet` (§ 7.1, cinq cas : `added` seul, `removed` seul, `added > removed`, `removed ≥ added`, égalité = supprimé) — **une seule enveloppe par id déterministe**, versions reprises telles quelles, ordre HLC conservé ; **stub de tombstone écrit à partir de la clé legacy réelle** (§ 4.2.1 bis), jamais reconstruit |
| 2. Rapprochement des opérations hors ligne de l'ancien format           | Ids déterministes (§ 5, vérifiés) : toute opération legacy (stockée ou poussée plus tard) est fusionnée dans la **même** enveloppe via les règles § 4.2.2 — un ajout ancien (HLC ≤ tombstone) ne ressuscite pas, un ajout plus récent est un ré-ajout légitime                                                                                                               |
| 3. Suppressions cohérentes avec plusieurs entrées du même ingrédient    | L'ancienne suppression marque **l'enveloppe de présence déterministe** uniquement ; les autres entrées (autres ids) ne sont ni effacées ni annulées par elle (fusion par enveloppe, § 4.2.2) ; la présence persiste tant qu'une entrée ACTIVE existe (§ 7.4, cas 3)                                                                                                          |
| 4. Aucune ancienne suppression perdue puis annulée par une sync tardive | Versions transportées verbatim ; fusion `version` vs `removed` selon l'ordre HLC total ; purge seulement après la rétention ; un appareil muet > rétention se réinitialise **avant** de pouvoir ressusciter (§ 6.3)                                                                                                                                                          |
| 5. Tests des suppressions **antérieures** à la migration                | Jeu de test : compte legacy avec tombstones préexistantes → migration → sync tardive legacy : un ajout **ancien** (HLC ≤ tombstone) ne ressuscite pas ; un ajout **HLC plus récent** = ré-ajout légitime (comportement `ElementSet` documenté et conservé)                                                                                                                   |

## 9. Convergence multi-appareils — démonstration imposée (9 scénarios)

Exécutés sur **mémoire, SQLite et émulateur Firestore**, au niveau serveur (`kitchenRoutes`)
**et** client (`KitchenSync` avec passerelles fictives) ; chaque scénario est écrit avec son
résultat attendu, la convergence doit être **déterministe** (le même ordre de pushes produit
toujours le même état) :

1. **Ajout sur un ancien appareil (legacy), synchronisé après la migration** → converti à la
   réception, enveloppe fusionnée par version HLC, l'ajout est visible sur les appareils
   migrés ; id déterministe identique à celui qu'aurait produit l'appareil migré.
2. **Suppression sur un ancien appareil, synchronisée après la migration** → tombstone
   canonique écrite, l'entrée disparaît partout, **aucune résurrection** ; si d'autres
   entrées du même ingrédient restent ACTIVE, la présence persiste (§ 7.4, cas 3 —
   conséquence documentée de E3, testée).
3. **Modification concurrente d'une même entrée** (deux appareils, hors ligne chacun) → la
   version HLC la plus récente gagne, écriture entière ; les deux appareils convergent vers le
   même contenu après leurs syncs respectives, quel que soit l'ordre.
4. **Suppression concurrente avec modification** → l'opération à la version HLC la plus
   récente gagne (les deux issues testées, égalité exacte = supprimé).
5. **Suppression suivie d'une synchronisation tardive** → la tombstone se propage ; un ajout
   antérieur à la suppression (HLC plus vieux) reste supprimé sur tous les appareils.
6. **Réinitialisation d'un appareil devenu obsolète** (> `STALE_DEVICE_MS`) → `resetLocal`
   selon le comportement exact du § 6.3 (pending effacé — compromis documenté), réadoption du
   document serveur, l'appareil ne ressuscite rien ; son `deviceClock` conservé.
7. **Créations et suppressions sur plusieurs appareils simultanément** → ids déterministes
   convergents, fusion par enveloppe au commit (transaction serveur), état final identique
   pour tous les appareils et pour tout ordre de réception (tests d'ordre inversé inclus).
8. **Modification sur un appareil migré, ancien appareil legacy synchronise ensuite** → la
   projection serveur **agrégée** (§ 7.4) a mis à jour les sections legacy : l'appareil legacy
   voit la modification (via ses règles `ElementSet` existantes), ni écrasement ni
   résurrection — sens `stock → legacy` démontré.
9. **Modification sur un appareil legacy, appareil migré synchronise ensuite** → la conversion
   serveur (§ 7.1) a absorbé la modification dans le stock : l'appareil migré la voit (via la
   fusion d'enveloppes), ni écrasement ni résurrection — sens `legacy → stock` démontré. Le
   scénario 9 est exécuté **après** le 8 dans le même jeu de test : les deux appareils
   convergent vers le même état final quel que soit l'ordre de leurs pushes.

**Garanties transverses exigées** : aucune perte de données (hors le compromis **accepté**
documenté de l'appareil muet > 83 j, § 6.3), aucune résurrection d'une
entrée supprimée, aucun écrasement injustifié d'une modification plus récente, convergence
déterministe, **cohérence ancien ↔ nouveau dans les deux sens pendant toute la fenêtre** ;
**plusieurs cycles successifs de synchronisation** (projection → pull → push → conversion →
projection, au moins trois cycles complets sur les scénarios concernés) convergent vers un
**point fixe stable** ; un **écho de projection** (`device: 'server'`) n'est jamais converti
en opération métier (§ 7.4), y compris après un délai hors ligne.

## 10. Limites de volume et mesures de performance — **hypothèses à confirmer, jamais fixées sans mesure**

**Statut** : les valeurs ci-dessous sont des **hypothèses de départ** (alignées sur les caps
existantes), à confirmer ou ajuster **par mesure** avant validation finale des caps
(E4). Dépassement = refus **explicite** (400 côté serveur, erreur côté client avec
récupération : l'entrée refusée reste locale et signalée, la section déjà stockée n'est pas
corrompue) — **jamais de troncature silencieuse**.

| Hypothèse                         | Valeur de départ        | À vérifier par mesure                                                                                                                                                                                                                                                                          |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrées présentes par emplacement | 300                     | payload, fusion, projection                                                                                                                                                                                                                                                                    |
| Tombstones `stock` (total)        | 2 000                   | coût de fusion des tombstones (le pire cas du merge)                                                                                                                                                                                                                                           |
| Longueur d'un id d'entrée         | ≤ 1 000                 | vérifié statiquement (§ 5 : échappement par point de code, pire cas ≈ 1 340 octets pour 190 caractères tous hors charset — sous la garantie commune 1 500, au-dessus de la cap pratique : refus explicite au-delà ; les ids réels `ing_*`, ≤ 22 caractères tous sûrs, ne sont jamais échappés) |
| Longueur de `note`                | ≤ 300                   | = `MAX.note` serveur existant                                                                                                                                                                                                                                                                  |
| Longueur d'`unit`                 | ≤ 32                    | motif du registre                                                                                                                                                                                                                                                                              |
| `quantity`                        | 0 < q ≤ 1 000 000, fini | borne anti-abus                                                                                                                                                                                                                                                                                |

**Protocole de mesure** (exécuté dans le lot, serveur isolé 3001 + seed jetable
`scripts/diagnostics/seed-lot-F1.ts`, motif `seed-lot262.ts`) :

1. **taille du document kitchen complet** (pas seulement `stock`) à 100 / 300 / 600 entrées +
   500 / 2 000 tombstones (tombstones **avec stub** § 4.2.1 bis — plus petit qu'une entrée
   complète, mesuré), sections existantes réelles incluses — comparée à la limite
   Firestore 1 Mo ;
2. **coût de fusion des tombstones** : `PUT` avec 500 puis 2 000 tombstones (SQLite et
   émulateur) ;
3. **chargement local sur mobile** : durée de lecture + parse du document local (le pire cas
   du localStorage, appareil bas de gamme simulé) ;
4. **coût de la projection `fridge`/`pantry`** : durée de `derivedPresence` à 300 / 600
   entrées (doit rester négligeable devant une image, ordre de grandeur < 1 ms) ;
5. **coût de synchronisation** : durée d'un push (validation références + registres incluses)
   et d'un pull à volume maximum ;
6. **comparaison au comportement actuel et à la baseline 1.4** (`lot-1.4-baseline-perf.md`) :
   critère = fusion `stock` ≤ 2× le coût d'une section ensemble de même cardinal ; au-delà →
   ajustement des caps justifié par les mesures, jamais par intuition.

## 11. Fenêtre de transition

- Les sections legacy restent **écrites et maintenues à jour** pendant la fenêtre : par les
  appareils legacy (leurs pushes) **et par la projection serveur** (§ 7.4) pour les
  modifications des appareils migrés.
- **Fin de la fenêtre : critère d'activité, pas la seule durée (demandé par le chef)** — le
  fait qu'un appareil muet depuis plus de 83 jours se réinitialise ne prouve pas que les
  anciens clients ont disparu : un ancien client qui synchronise régulièrement actualise son
  `lastSyncedAt` et peut pousser l'ancien format bien après 90 jours. La fermeture de la
  période de transition exige donc **toutes** les conditions suivantes :
  1. **durée minimale ≥ 90 j** (rétention tombstones) après le déploiement client ;
  2. **zéro push legacy observé** pendant une période d'observation continue (30 j proposés) :
     le serveur compte les `PUT /api/kitchen` contenant des sections legacy `fridge`/`pantry`
     (mesure passive, aucune donnée client conservée) — tant que ce compteur n'est pas nul,
     un client compatible ancien format peut encore écrire et **la suppression du
     convertisseur est interdite** ;
  3. **preuve documentée** des deux conditions (journal des mesures) jointe au lot de dette ;
  4. **sauvegarde de sécurité** avant toute suppression du mécanisme.
     La durée de 90 jours reste un **minimum** — jamais une preuve suffisante à elle seule.
- La **suppression du mécanisme de compatibilité** (sections legacy + conversion + projection)
  est un **lot distinct**, avec ses propres critères d'acceptation (conditions 1–4 ci-dessus),
  sa propre validation du chef, et une procédure documentée (jamais automatique).

## 12. Tests (couverture complète)

**Traçabilité (demande du chef, v6)** : à ce stade **documentaire, aucun test n'a été
exécuté** — chaque entrée ci-dessous est classée **« nouveau »** ou **« extension d'un test
existant »** (ex. suites `kitchenRoutes.test.ts`, test `wrapLegacyList` déjà en place côté
serveur, suites DataStore) ; l'exécution réelle et ses résultats sont consignés au rapport
du lot, jamais présumés.

1. **Core** (`entries.test.ts`, **nouveau**) : chaque règle de validation (§ 4.5,
   structurelles et de registre séparées, **fusion : une candidate gagnante est validée
   avant de remplacer une enveloppe valide**) ; **contrat typé de l'union** (§ 4.2 :
   chaque branche acceptée, les six lignes de la table § 4.2.1 dont les INVALIDES #5–#6 —
   `state` contredit par la comparaison = rejeté, `removed ≠ version` en tombstoned =
   rejeté, champ métier superflu dans un stub = ignoré) ; **validation propre du stub**
   (§ 4.2.1 bis : structurelle seulement, **jamais les règles métier ni les registres** —
   un stub référençant un ingrédient absent du catalogue est accepté) ; fusion (§ 4.2.2, les
   quatre issues, égalité exacte = supprimé) **+ égalité de versions HLC par combinaison**
   (§ 4.2.2 bis) ; **propriétés de fusion** (§ 4.2.2 ter : commutative, associative,
   idempotente — N enveloppes, tout ordre et regroupement, tombstones incluses) ; parser
   (rejet enveloppe par enveloppe, jamais de `undefined`) ; **ids déterministes injectifs**
   (§ 5 : paires croisées entre familles dont `YS8` vs `a/`, **caractères Unicode hors BMP
   partageant le même surrogate haut**, accents et caractères combinants, `/`, `.`,
   `__…__`, chaînes longues, **id vide refusé**, refus explicite au-delà de la cap,
   **aller-retour décodage**, reproductibilité client/serveur, test source sans
   `Buffer`/`process`) ; projection de présence ; purge (tombstones expirées seulement) ;
   **conversion legacy (§ 7.1) : les cinq cas, migration rejouée (idempotence), sync legacy
   tardive, ajout plus récent et plus ancien qu'une suppression, aucune résurrection, entrées
   enrichies jamais appauvries, stub de tombstone écrit depuis la clé legacy réelle** ;
   **projection stock → legacy (§ 7.4) : les sept cas d'agrégation, équivalence croisée des
   présences, convergence dans les deux sens, re-positionnement déterministe (deux exécutions
   identiques), cas absent = `removed` seul** ; **invariant d'identité** (§ 4.2 :
   ACTIVE `entry.id === clé`, TOMBSTONED `stub.id === clé` ; incohérence = INVALIDE rejeté
   sans écrasement ; **respecté par la conversion, la migration locale, l'export/import et
   la restauration**) ; **tombstones (§ 4.2.1 bis) : stub conservé
   par la tombstone gagnante (versions différentes), stub stable en fusion (versions égales
   ⇒ idempotent, stubs différents ⇒ départage sur stub signalé), re-dérivation du stub par
   décodage d'id, tombstone sans stub non décodable = exclue de l'attribution + anomalie,
   plusieurs entrées du même ingrédient (suppressions partielles puis totales, conflits
   entre appareils)** ; aller-retour conversion (scénario A).
2. **Convergence multi-appareils** (§ 9) : les **9 scénarios** sur les trois stores, au niveau
   serveur et client, ordres inversés inclus — dont la **compatibilité bidirectionnelle**
   legacy ↔ stock (8–9) et le **compromis `resetLocal`** dans ses deux faces (6) ; **au
   moins trois cycles complets de synchronisation** (projection → pull → push → conversion →
   projection) sur les scénarios 8–9, convergence vers un **point fixe** ; **reconnaissance
   d'écho** : une version `device: 'server'` dans un push legacy n'est jamais convertie
   (jamais de réactivation), y compris poussée après un long délai hors ligne, et coexistant
   avec une vraie modification (convertie) dans la même carte ; **réservation sécurisée**
   (§ 7.5 : génération disjointe — `deviceId()` jamais égal à `server` ni `legacy`, forme
   avec tiret ; garde de route : `device: 'server'` dans la section stock d'un push =
   **400 sans écriture** ; usurpation = no-op dans les deux sections, jamais d'injection ni
   de suppression ; projection n'émet `server` que pour les versions synthétiques ;
   non-régression de l'override de test `options.deviceId`) — **extension** de
   `kitchenRoutes.test.ts` + **nouveau** test de génération.
3. **Migration et tombstones historiques** (§ 8) : conversion des **cinq cas** des deux
   cartes (`added` et `removed`, § 7.1), **une seule enveloppe par id déterministe**,
   conservation de l'ordre HLC, cohérence des suppressions après conversion, absence de
   résurrection après sync tardive, cohérence multi-entrées, idempotence (migration rejouée
   et deux pushes legacy quelconques convergent), **comportement `resetLocal`** (§ 6.3) testé
   explicitement.
4. **Contrats et adaptateurs** : `localRepositories.test.ts` (diff → enveloppes, migration
   locale, rejet du malformé, **enveloppes typées persistées/relues**), `kitchenRoutes.test.ts`
   (validation core partagée + registres en cache avec **relecture sans cache avant refus de
   référence**, caps, fusion transactionnelle, conversion legacy, **projection legacy à
   chaque push, une candidate invalide ne gagne jamais une fusion (rejet non destructif)**,
   refus 400 sans écriture, **garde `RESERVED_SYNC_DEVICE` en stock**),
   `firestoreStore.test.ts` / `sqlStore.test.ts` (suites DataStore vertes sans changement).
5. **Sauvegarde et restauration** (§ 13) : export avec `stock` (quantités, dates, notes
   incluses), import d'un ancien backup (conversion), aller-retour, **cohérence après
   restauration et resynchronisation multi-appareils**.
6. **Non-régression** : `npm run check` intégral ; garde d'architecture verte ; démonstration
   navigateur (frigo/placard ajout/retrait avant/après migration, 4 langues × clair/sombre,
   375 px et 320 px, serveur isolé 3001 + seed jetable, serveur arrêté après usage).
7. **Mesures** : protocole § 10, résultats consignés au rapport du lot (caps confirmées ou
   ajustées avec justification).

## 13. Rollback et sauvegardes — deux stratégies strictement distinguées, prouvées par tests

- **A — avant enrichissement** : pendant la fenêtre, les sections legacy ne sont pas seulement
  conservées — elles sont **maintenues à jour** par la projection serveur (§ 7.4) et par la
  projection locale (§ 7.2) : un revert du code (client ou serveur) trouve des sections legacy
  **représentant l'état courant du stock**. Le rollback A est néanmoins **prouvé par tests**,
  pas simplement affirmé : (i) test aller-retour **entrées → ids → entrées** (équivalence
  stricte des deux projections, par emplacement) sur l'état courant du stock ; (ii) test de
  **cohérence des sections legacy projetées** : la présence dérivée des sections legacy
  régénérées == la présence dérivée du stock (test d'équivalence croisée, les deux sens) ;
  (iii) test fonctionnel d'un revert (l'ancien code lit les sections legacy à jour et se
  comporte comme avant). **Procédure de retour à l'ancien code** : la projection maintenant
  les sections à jour en continu, aucun rattrapage n'est nécessaire ; si la projection avait
  été désactivée (fin de fenêtre atteinte), une **régénération one-shot des sections legacy
  depuis le stock** (la même fonction pure `projectStockToLegacy`) est exécutée et vérifiée
  **avant** le revert — jamais l'inverse.
- **B — après enrichissement** (quantités, dates, notes saisies) : la conversion inverse
  **perdrait** des données — le retour passe **exclusivement** par la **sauvegarde/restauration
  complète** : export JSON (avec `stock`, informations enrichies incluses) **avant** toute
  exécution réelle, **test de restauration vérifiant le contenu enrichi complet**, puis
  **cohérence après restauration et resynchronisation multi-appareils** (les autres appareils
  adoptent l'état restauré, aucun conflit résiduel). La compatibilité des anciens backups
  (sans `stock`) est testée (conversion à l'import) ; **l'export et la restauration
  respectent l'invariant d'identité `id == clé`** (§ 4.2) — testé.
- **Serveur** : la section `stock` est additive — un revert serveur laisse les documents
  intacts (section ignorée par l'ancien code, comme les sections legacy existantes).

## 14. Risques résiduels et protections

| Risque                                                                 | Protection                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double conversion divergente (client et serveur)                       | Ids déterministes injectifs (§ 5) + versions transportées verbatim + fusion commutative testée (idempotence prouvée)                                                                                                                                                                                                                         |
| Écrasement d'une entrée enrichie par la conversion                     | La conversion n'écrit `entry` que sur une enveloppe nue ; fusion par version HLC, écriture entière                                                                                                                                                                                                                                           |
| Enveloppe ambiguë ou incohérente (état non décidé)                     | Contrat canonique § 4.2 : l'état est **toujours** calculé par comparaison de versions ; les états INVALIDES sont rejetés, jamais stockés                                                                                                                                                                                                     |
| Donnée malformée gagnant une fusion par sa version HLC ou le départage | Validation sur le chemin de fusion (§ 4.5) : une candidate gagnante est validée **avant** de remplacer une enveloppe valide ; rejet non destructif — testé                                                                                                                                                                                   |
| Projection agrégée divergente (plusieurs entrées du même ingrédient)   | Agrégation imposée par `projectStockToLegacy` (§ 7.4, sept cas testés) ; invariant « ≥ 1 ACTIVE ⇒ présent » démontré dans les deux sens                                                                                                                                                                                                      |
| Re-positionnement synthétique de version (§ 7.4)                       | Déterministe et pur (`counter + 1` sur la tombstone dominante, device `server` réservé) ; jamais écrit dans le stock ; **jamais rétroconverti** (reconnaissance d'écho à la conversion, § 7.4 — testé sur cycles successifs, multi-appareils et hors ligne) ; cas absent jamais re-positionné (aucune suppression annulée) — inspection § 17 |
| Perte du rattachement ingrédient d'une tombstone                       | **Stub minimal conservé** dans la forme canonique (§ 4.2.1 bis) ; relecture défensive par décodeur d'id déterministe ; sinon exclusion d'attribution + anomalie signalée — testé (partiel, total, conflits)                                                                                                                                  |
| Re-ajout legacy appauvrissant une entrée enrichie                      | Règle de conversion § 7.1 : la présence nue legacy conserve les données métier d'une enveloppe ACTIVE stockée, version = max — testé                                                                                                                                                                                                         |
| Payload du document kitchen                                            | Caps = hypothèses mesurées (§ 10), purge tombstones, comparaison à la baseline 1.4 avant déploiement                                                                                                                                                                                                                                         |
| Divergence de validation client/serveur                                | Une seule fonction du core partagée (§ 4.5) ; registres évolutifs passés en paramètre, jamais dupliqués                                                                                                                                                                                                                                      |
| Liste statique de catégories désynchronisée du backoffice              | Constante du core limitée aux ids **built-in jamais supprimables** (§ 15-E6) ; extension = une ligne dans le core                                                                                                                                                                                                                            |
| Perte des opérations d'un appareil muet > 83 j                         | **Compromis accepté par le chef** (§ 6.3) : comportement historique convenu maintenu tel quel, testé dans les deux faces (§ 9.6) — **aucune nouvelle validation nécessaire** ; évolution de politique possible séparément                                                                                                                    |
| Ancien client ne voyant pas les modifications des appareils migrés     | Projection serveur bidirectionnelle (§ 7.4) + scénarios de convergence 8–9 (§ 9) ; rollback A fondé sur des sections legacy à jour                                                                                                                                                                                                           |
| Cache de registres serveur périmé                                      | TTL court + **relecture sans cache avant tout refus de référence** (jamais de faux rejet d'une unité/ingrédient récents) ; fenêtre résiduelle bornée et documentée (§ 4.5)                                                                                                                                                                   |
| Usurpation de `device: 'server'` par un client                         | Génération des `deviceId` disjointe **par construction** (UUID/repli avec tiret — vérifiée, § 7.5.1) ; garde de route : `stock` + `server` = 400 ; legacy : écho ignoré = no-op — le pire cas d'un forgeron ne crée ni n'efface rien ; une vraie modification (deviceId réel) n'est jamais ignorée — testé (§ 12.2)                          |
| Régression UI/moteur                                                   | Projection figée (test d'équivalence), signatures inchangées, aucun diff `src/core/matching`, `npm run check` + parcours navigateur                                                                                                                                                                                                          |
| Migration exécutée prématurément                                       | Déroulement en 4 étapes (§ 7.3), chaque étape validée ; aucune exécution avant l'autorisation de développement                                                                                                                                                                                                                               |

## 15. Arbitrages E1–E6 — **statut : E1, E2, E3, E6 validées par le chef le 19/11/2026 ;

E4 et E5 suivant les dispositions convenues (mesure / lot de dette)**

Les quatre arbitrages nécessitant une décision préalable à l'implémentation ont été **validés
explicitement par le chef le 19/11/2026** (options recommandées du dossier, approuvées telles
quelles) ; les lignes correspondantes sont marquées **VALIDÉ**. E4 et E5 ne demandent aucune
décision préalable : E4 se tranche **par la mesure** pendant le lot, E5 à la **fermeture de
la fenêtre** (lot de dette séparé). Aucune autre décision stabilisée n'est modifiée.

| Arbitrage                                                                              | Recommandation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justification (liée au code réel)                                                                                                                                                                                                      | Alternative et conséquences                                                                                                                                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E1** — migration : conversion contrôlée **(a)** vs rejet + resynchronisation **(b)** | **VALIDÉ (19/11/2026) : (a)**, avec la compatibilité bidirectionnelle (§ 7.4) et les 9 scénarios de convergence (§ 9) comme **critères obligatoires de validation du lot**                                                                                                                                                                                                                                                                                                                                                                | La transaction de fusion au commit et le precedent `wrapLegacyList` (ancien format accepté et enveloppé à la réception, testé) rendent la conversion fiable ; le sens inverse (`stock → legacy`) est couvert par la projection serveur | (b) : chemin de récupération client inédit (détecter le rejet, convertir l'état local, rejouer les opérations pendantes dans le nouveau format) — plus de code, plus de risques, même garanties finales |
| **E2** — temporalité d'`exhausted_at`                                                  | **VALIDÉ (19/11/2026) : date calendaire ISO 8601 (`YYYY-MM-DD`)** — le jour d'épuisement, **sans heure ni fuseau horaire** ; distincte des horodatages techniques et des versions HLC ; décision uniforme aux quatre lieux : TS `string` (date), Firestore chaîne ISO, SQL `DATE`, comparaisons au jour calendaire ; **sans obligation de type partagé avec `expires_at`** (qui reste une date au jour — même convention de fait, mais chaque champ porte sa convention explicite)                                                        | Le « je n'en ai plus » de l'utilisateur est un événement journalier ; aucune UI ne demande l'heure ; `TIMESTAMP` n'apporte rien et compliquerait les comparaisons et le SQL                                                            | Instant horodaté : utile seulement si un jour l'UI demande « depuis quand, à l'heure près » — évolution ciblée possible plus tard (colonne SQL `TIMESTAMP` en 6a, convention documentée)                |
| **E3** — retrait multi-entrées                                                         | **VALIDÉ (19/11/2026) : règle déterministe** — cible = **entrée de présence déterministe** si elle existe, sinon **l'entrée la plus récente** (`added_at` max, **départage stable par identifiant**) ; chaque action retire **une seule** entrée ; retrait répété = suivante ; **jamais toutes** ; `clearFridge` conserve son rôle distinct de **vidage global**                                                                                                                                                                          | Un toggle de l'interface actuelle = un retrait (cohérence avec `toggleInList`) ; aucune UI multi-entrées avant E4, donc le comportement est du contrat + tests, pas un parcours visible                                                | Choix utilisateur à chaque retrait : exigerait une UI (hors périmètre F1)                                                                                                                               |
| **E4** — caps de volume                                                                | **Dispositions convenues — aucune décision préalable requise** : **hypothèses de départ uniquement** (§ 10) ; confirmées ou ajustées **après mesure** (document complet, fusion tombstones, chargement mobile, projection, sync), comparées à la baseline 1.4                                                                                                                                                                                                                                                                             | Le chef exige des mesures, pas des valeurs fixées — le dossier ne fixe rien                                                                                                                                                            | Caps arbitrairement larges : payload et fusion non mesurés (risque Firestore 1 Mo)                                                                                                                      |
| **E5** — fenêtre de transition                                                         | **Dispositions convenues — décision à la fermeture de la fenêtre (lot de dette séparé)** : durée minimum ≥ 90 j + critère d'activité (§ 11 : zéro push legacy observé sur 30 j, preuve documentée, sauvegarde) ; suppression du mécanisme en **lot distinct** avec ses propres critères d'acceptation                                                                                                                                                                                                                                     | La durée seule ne prouve rien : un ancien client synchronisant régulièrement pousse l'ancien format au-delà de 90 j (§ 11)                                                                                                             | Fenêtre courte : un appareil longuement hors ligne pousse un format que le serveur ne convertit plus                                                                                                    |
| **E6** — catégories permanentes                                                        | **VALIDÉ (19/11/2026) : la liste `spices_condiments`, `grains_pasta`, `canned_pantry`** — les trois ids **existent** dans `BUILT_IN_INGREDIENT_CATEGORIES` et sont **renommables/déplaçables mais jamais supprimables** (vérifié) ; **les autres catégories ne sont pas éligibles par défaut** ; toute extension (autoriser une catégorie créée au backoffice) = une ligne dans le core, **sans mécanisme générique ni snapshot** ; **le caractère `permanent` reste une présence habituelle qualitative, jamais une quantité illimitée** | Répond à V12 (« ingrédients de base et épices ») ; la contrainte « jamais supprimable » rend la liste durablement cohérente avec le backoffice ; aucun coût de registre supplémentaire                                                 | Liste config en base : mécanisme générique inutile aujourd'hui (aucun besoin réel d'autoriser une catégorie dynamique) — introduite seulement si le chef le demande                                     |

## 16. Critères d'acceptation mesurables

1. Toutes les validations du core passent ; **aucune quantité n'est obligatoire dans
   l'interface F1** — la saisie de quantité n'est **jamais imposée** à l'utilisateur ; le
   fonctionnement **en présence seule** reste intégralement opérationnel ; le modèle conserve
   la **quantité facultative** (saisissable, jamais exigée) ; le frigo « présence seule »
   fonctionne à l'identique.
2. Le contrat d'enveloppe est entièrement testé (union typée § 4.2 : chaque branche acceptée,
   **INVALIDES #5–#6 rejetés** dont `state` contredit par la comparaison HLC ; quatre issues
   de fusion ; **égalité de versions HLC par combinaison : ACTIVE/ACTIVE idempotent ou
   départage déterministe, ACTIVE/TOMBSTONED = la suppression gagne toujours,
   TOMBSTONED/TOMBSTONED = tombstone canonique (stub de la gagnante, idempotent à versions
   égales et stubs identiques, départage sur stub sinon)** ; **fusion commutative,
   associative et idempotente démontrée (§ 4.2.2 ter)** ; purge, parser par état ;
   **invariant d'identité `id == clé` respecté de bout en bout (conversion, migration,
   export/import, restauration)** ;
   **validation propre du stub (structurelle, jamais métier ni registres)**) — aucun état
   ambigu, aucun cas non traité ; **une candidate invalide ne gagne jamais une fusion**
   (validée avant de remplacer une enveloppe
   valide, rejet non destructif).
3. Les **9 scénarios de convergence** (§ 9) passent sur les trois stores, niveau serveur et
   client, **y compris la compatibilité bidirectionnelle legacy ↔ stock (8–9)** ; les cinq
   garanties tombstones (§ 8) et la **conversion legacy en cinq cas (§ 7.1)** démontrées,
   suppressions antérieures incluses ; **projection agrégée : les sept cas du § 7.4,
   présence legacy == présence stock dans les deux sens** ; **cycles successifs → point
   fixe ; écho `device: 'server'` jamais rétroconverti (y compris hors ligne long)** ;
   **réservation `server` sécurisée (§ 7.5 : génération disjointe vérifiée, garde de route
   400, usurpation = no-op)** ; **tombstones : stub conservé et agrégation fidèle (partiel,
   total, conflits)** ;
   `resetLocal` conforme au § 6.3 **avec le compromis accepté et testé dans ses deux faces**
   (aucune nouvelle validation nécessaire).
4. La migration est id-préservée, idempotente, convergente ; équivalence de présence dérivée
   vérifiée ; **cohérence ancien ↔ nouveau démontrée dans les deux sens** (projection § 7.4) ;
   scénarios A et B démontrés **par tests** (conversion inverse aller-retour **sur l'état
   courant**, restauration enrichie + resynchronisation, **sections legacy projetées
   équivalentes au stock**) ; import des anciens backups fonctionnel.
5. Les validations client/serveur proviennent d'**une seule** fonction du core (aucune
   duplication) ; le serveur vérifie les invariants métier listés au § 4.5 (règles structurelles
   sur toute enveloppe, règles de registre/référence sur les enveloppes modifiées, **existence
   de l'ingrédient via le contexte**) ; registres évolutifs sans liste statique, **cache avec
   relecture sans cache avant refus** (jamais de faux rejet d'une donnée récente).
6. Les ids d'entrée sont déterministes, **injectifs sur tout Unicode — prouvés par tests
   incluant les caractères hors BMP partageant le même surrogate haut, les caractères
   combinants, et les collisions croisées entre familles (`YS8` vs `a/`)** ; aller-retour
   décodage vérifié ; sans `Buffer` (test source), refus explicites (**id vide**, dépassement
   de cap), jamais de troncature ; `StockEntry` conforme au principe id technique / pas de
   code fonctionnel (annexe).
7. Aucun diff `src/core/matching` ; `useMatchingInputs` et les écrans inchangés ; deux vues
   distinctes conservées.
8. Caps confirmées ou ajustées **par mesure** (protocole § 10, résultats consignés, comparés à
   la baseline 1.4) ; refus explicites, jamais de troncature silencieuse.
   8 bis. La fermeture de la fenêtre de transition respecte le **critère d'activité** (§ 11 :
   durée minimum + zéro push legacy observé + preuve documentée + sauvegarde) — jamais la durée
   seule.
9. `npm run check` vert ; garde d'architecture verte (core pur, pas de SDK, pas de plateforme,
   aucune notion de stockage/sync dans les types métier) ; démonstration navigateur 8
   configurations.
10. Docs à jour (`03-domaine.md` § kitchen, `05-application-donnees.md` § sync, CLAUDE.md)
    avant le commit final du lot.
11. **Chaque commit séparé et atomique** (core → application/ports → infrastructure → serveur →
    sync → backup → migration/mesures → docs), `npm run check` vert avant chaque commit,
    branche courante, **sans push ni merge sans autorisation**.

## 17. Points restant à démontrer par inspection ou mesure pendant le lot (honnêteté de rapport)

Ces points ne sont **pas** démontrés par le dossier seul ; chacun est une vérification
obligatoire du lot (inspection du code ou mesure), consignée au rapport — aucun n'est un
gabari, tous ont une issue binaire vérifiable :

1. **Réservation de l'id d'appareil `server`** — **mise à jour v6** : la disjonction est
   **désormais vérifiée dans le code** (`storage.deviceId()` = `crypto.randomUUID()` ou
   repli `<ts36>-<random>`, jamais la chaîne `server` — § 7.5.1) ; ce qui reste à faire
   pendant le lot est le **branchement contractuel** (constante, garde de route, règle
   d'ignore) avec ses tests imposés — voir point 6 ci-dessous, plus aucune découverte
   inconnue ;
2. **Interaction caps/purge d'`ElementSet` avec les cartes projetées** : `parseVersionMap`
   dépose les versions les plus vieilles au-delà des caps — vérifier qu'une présence projetée
   ne peut pas disparaître par ce dépôt (ordre de grandeur : 300 présents / 2 000 tombstones,
   mesures § 10) ;
3. **Comportement d'un client legacy réel** face aux cartes projetées : test d'intégration
   exécutant l'ancien code sur les sections régénérées (§ 13, test iii) ;
4. **Taille du document kitchen complet à caps max** (risque Firestore 1 Mo) : mesure § 10,
   comparaison à la baseline 1.4, avant tout déploiement ;
5. **Tombstones sans stub et id non décodable** (cas défensif, impossible en pratique) :
   vérifier le chemin d'exclusion d'attribution de projection + anomalie signalée
   (§ 4.2.1 bis, § 4.2.4) ;
6. **Branchement de la garde `RESERVED_SYNC_DEVICE`** (§ 7.5) : la **génération disjointe
   est déjà vérifiée dans le code** (`storage.deviceId()` = UUID/repli avec tiret) ; ce qui
   reste à brancher pendant le lot = la constante du core, la garde de route (stock = 400)
   et la règle d'ignore en conversion — chacune avec son test imposé (§ 12.2) ; l'issue est
   binaire et ne comporte plus de découverte inconnue.

## 18. Journal de réalisation (consigné au fil du lot, sans rouvrir les décisions validées)

### Étape 1 — Serveur (réalisée, validée et clôturée par le chef)

Contrat `src/core/kitchen/entries.ts` (80 tests), section `stock` dans `server/routes/kitchenRoutes.ts`
(conversion E1-a transactionnelle, projection legacy à chaque push, registres en cache 60 s +
relecture sans cache avant refus, garde `RESERVED_SYNC_DEVICE`), 13 tests de route dédiés,
2 tests étendus. Commits `e18f854` (core) et `949cede` (serveur). `npm run check` vert :
1 017 tests / 29 skippés.

### Étape 2 — Client (réalisée sous autorisation explicite, rapport en attente de validation)

**Périmètre réalisé** (§ 7.3, point 2) :

1. **Core client** : les fonctions pures du lot rejoignent `entries.ts` — `stockRemovalTarget`
   (E3 : entrée de présence déterministe d'abord, sinon `added_at` le plus récent, départage
   stable par id), `tombstonedFromEntry` (stub écrit depuis l'entrée réelle),
   `tombstoneStockLocation` (vidage explicite global ≠ retrait E3), `presenceEnvelope`
   (enveloppe de présence nue, `added_at` = date de la version). +8 tests core.
2. **Migration locale `ensureStockState`** (`localRepositories.ts`) : un document sans section
   `stock` mais avec des données legacy fridge/pantry est converti une fois avec la MÊME
   fonction du core que le serveur (`convertLegacyElementSet`, mêmes ids déterministes,
   versions locales reprises telles quelles), marquée pendante (`stock`) et sauvegardée
   aussitôt ; les anciennes sections/éléments restent intacts (retour arrière A).
3. **`KitchenRepository`** : `loadStock` / `saveStock` (restauration de sauvegarde) /
   `mergeStock` (adoption serveur) / `clearStockLocation` (vidage explicite) ; `saveFridge` /
   `savePantry` deviennent des différences liste → enveloppes (ajout = recréation de la
   présence déterministe nue ; retrait = tombstone de l'entrée visée par E3, une seule par
   action) ; `loadFridge` / `loadPantry` dérivent du stock ; projection locale purement
   locale (éléments + listes + horodatages de sections) ; `mergeElementSet` fridge/pantry
   convertit aussi la carte legacy adoptée du serveur en stock (§ 7.2, convergence des deux
   conversions).
4. **`KitchenStore`** : signatures et comportements publics inchangés (toggle, clearFridge) ;
   l'état est relu du dépôt après chaque écriture (la présence recomputée fait autorité) ;
   `stock()` / `setStock` / `mergeStock` pour la sauvegarde et la sync.
5. **`KitchenSync`** : la section `stock` voyage comme section à part entière (push quand
   pendante, adoption à la lecture, horodatage de section) ; l'adoption du stock se fait
   « pas plus ancien » (fusion idempotente — voir décision D2 ci-dessous).
6. **Adaptateurs** : le passage HTTP liste `stock` ; les stores serveur (mémoire, SQLite,
   Firestore) ne changent PAS — le stock voyage dans le document kitchen générique.
7. **Convergence multi-appareils** : nouvelle suite `server/routes/kitchenStockConvergence.test.ts`
   — deux appareils réels (KitchenStore + KitchenSync + dépôt local par appareil) contre les
   routes réelles sur les stores mémoire et SQLite : scénarios 1, 8 (legacy ⇄ nouveau),
   2/3/7 (convergence indépendante de l'ordre), 4/5 (tombstone + ré-ajout nue), opérations
   hors ligne jamais perdues, scénario 6 (appareil périmé : reset + réadoption, horloge HLC
   conservée) ; la variante Firestore (émulateur) est la même suite, sautée proprement sans
   émulateur.
8. **`resetLocal`** : le stock est vidé avec le document (§ 6.3, horloge conservée), deux
   faces testées (au niveau local et au niveau convergence).
9. **Sauvegardes** : `createBackup` exporte le stock complet (enveloppes) ; `parseBackup`
   le relit enveloppe par enveloppe (invariant d'identité appliqué par le parser, enveloppe
   malformée ignorée, stock non-objet compté `skipped`) ; les anciens backups restent
   compatibles ; `CatalogAdmin` exporte/importe le stock. +2 tests.

**Décisions d'implémentation — VALIDÉES par le chef (avec conditions de vérification)** :

- **D1 — E3 au niveau du dépôt local** : la différence des listes visibles est appliquée au
  stock DANS l'adaptateur local (`saveFridge`/`savePantry`), l'état du store est relu après
  l'écriture ; avec plusieurs entrées pour un même ingrédient, le retrait d'un toggle
  n'en supprime qu'une (l'ingrédient peut rester visible — comportement du contrat, testé).
- **D2 — adoption du stock « pas plus ancien »** : la réponse à un push peut porter les
  enveloppes d'un AUTRE appareil à l'intérieur de notre propre horodatage de section (pushes
  concurrents) ; l'adoption stricte « plus récent » ferait perdre ces enveloppes pour de
  bon côté client. Le stock est donc adopté quand il n'est pas plus ancien que ce que
  l'appareil détient ; la fusion est idempotente, l'adoption se fait sous `suspend()`
  (aucune marque pendante, aucun écho). Les autres sections gardent le comportement
  historique strict « plus récent ».
- **D3 — horodatage de la section stock côté serveur** (correctif du code de l'étape 1,
  découvert par les tests d'étape 2) : la section stock créée/rewritée par la conversion
  legacy ou la projection seule était horodatée à 0 ; or le serveur refuse toute section
  poussée avec `updated_at ≤ 0` — le push suivant du client était donc refusé pour toujours.
  La section stock écrite par conversion/projection est désormais horodatée à l'horloge de
  la requête ; le client, de son côté, n'envoie jamais un horodatage de section à 0
  (0 = « jamais écrite » → horloge courante). Les 13 tests de route de l'étape 1 passent
  inchangés.

**Vérifications explicites exigées avec la validation D1–D3 et tests correspondants** :

- **D1** : un retrait ne vise qu'une entrée, l'ingrédient reste visible tant qu'une autre
  entrée active existe (`localRepositories.test.ts` — le cas à deux entrées, deux retraits) ;
  `clearFridge` global distinct (`KitchenStore.test.ts` + `localRepositories.test.ts`) ;
  relecture du dépôt après chaque écriture (`KitchenStore.test.ts`).
- **D2** : adoption à l'égalité sans écho ni marque pendante, rejet d'un état réellement
  plus ancien (`KitchenSync.test.ts`, test dédié « adopts a remote stock not older… ») ;
  idempotence (`kitchenStockConvergence.test.ts` — stocks strictement égaux sur les deux
  appareils, mémoire et SQLite) ; comportement des autres sections inchangé (1 017 tests
  préexistants + « ignores an older remote section »).
- **D3** : cycle complet conversion → projection → push client suivant accepté
  (`kitchenRoutes.stock.test.ts`, test dédié « D3 — a converted or projected stock section… ») ;
  le client n'envoie jamais d'horodatage 0 (`KitchenSync.test.ts`, test dédié « never pushes
  a stock section stamped 0… »).

**Chiffres** : `npm run check` vert — 1 058 tests passés / 35 skippés (skips : 29 préexistants

- 5 tests de convergence Firestore sans émulateur + 1 fichier temporaire de mise au point,
  `saut` en attente de suppression) / 110 fichiers + 1 suite sans test. Décompte : **41 tests
  nouveaux** (core +8, dépôt local +13, store +5, sauvegarde +2, convergence +10, sync +2,
  routes stock +1) ; faux repos étendus dans `KitchenSync.test.ts` et `KitchenStore.test.ts`
  (0 test nouveau en plus, 1 assertion tournée vers la section stock) ; **1 017 tests
  préexistants inchangés et verts**. Note de réconciliation (demandée par le chef) : le
  rapport initial annonçait 38 nouveaux pour 1 055 attendus — le 1 056e était le test du
  fichier temporaire `tmp-debug.test.ts` (compté à tort hors décompte) ; depuis neutralisé en
  `saut`, il n'entre plus dans les passés. Zéro diff
  dans `src/features`, `src/app`, `src/core/matching`, `server/storage`. Aucune donnée réelle
  touchée (tests isolés, serveurs de test jetables, émulateur non requis pour l'exécution).
