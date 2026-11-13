# 12 · Recherche : moteur et étude

## Ce qui est en place

Recherche **dans l'appareil** avec MiniSearch, derrière le port `SearchEngine` : hors ligne, sans
aucune lecture de la base, sur ordinateur comme sur téléphone.

| Couche    | Fichier                                                | Rôle                                                                                                      |
| --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Domaine   | `src/core/search/normalize.ts`                         | `normalizeSearchText` : règles communes à l'indexation et à la requête (arabe, derja latine, français)    |
| Domaine   | `src/core/search/documents.ts`                         | `recipeSearchDocument`, `ingredientSearchDocument` (toutes les langues et variantes), poids des champs    |
| Domaine   | `src/core/search/indexPlan.ts`                         | `planIndexUpdate` : seuls les éléments changés sont réindexés                                             |
| Port      | `src/application/ports.ts` : `SearchEngine`            | `rebuild`, `upsert`, `remove`, `search` (asynchrone : un moteur serveur pourra le remplacer)              |
| Store     | `src/application/search/CatalogSearch.ts`              | Index construits à la première recherche, puis suivent le catalogue ; `null` = repli sur le filtre simple |
| Adapters  | `infrastructure/minisearch/`, `infrastructure/memory/` | MiniSearch (production) ; mémoire (référence) ; contrat commun `contracts/searchEngine.contract.ts`       |
| Interface | `useSearchMatches` (`src/app/ContainerContext.tsx`)    | `/recettes`, `/suggestions` (via `searchMatches` des filtres) et recherche d'ingrédients du frigo         |

Comportement :

- **Champs et poids** : noms (×3), ingrédients de la recette (×1,5), descriptions (×1), dans **toutes**
  les langues et variantes (lues par préfixe : `name_*`, `description_*`).
- **Tous les mots** de la requête doivent être trouvés, chacun comme **début de mot** (« merg » →
  « merguez », jamais « sel » → « persil »), avec des **fautes** : aucune sous 5 lettres, 1 jusqu'à 8,
  2 au-delà (« kamounya » → « Kamounia »).
- **Classement** : `/recettes` est trié par pertinence pendant une recherche ; `/suggestions` garde
  l'ordre de chaque niveau du frigo.
- **Repli sans régression** : tant que le moteur n'a pas répondu (première frappe) ou s'il échoue,
  l'ancien filtre par nom s'applique ; les autres filtres (catégorie, budget, temps, sain) ne changent pas.
- **Mises à jour en direct** : une recette modifiée par le patron est réindexée seule ; un ingrédient
  modifié réindexe les recettes (leurs mots contiennent les noms d'ingrédients).

Changer de moteur (Orama, moteur serveur…) : écrire un adapter qui passe
`contracts/searchEngine.contract.ts`, puis le brancher dans `src/app/container.ts`.

## Étude

> **Statut : étude réalisée avant l'implémentation ci-dessus.** Cette page compare des moteurs de recherche
> gratuits et rapides pour un catalogue qui peut atteindre des milliers de recettes et d'ingrédients
> en trois langues, propose un moteur et un plan d'intégration, puis une stratégie pour lire la base le
> moins possible (navigation, recherche, filtres gérés par le patron). Faits vérifiés le 12/11/2026
> (sources en fin de page).

## Ce qui existe aujourd'hui

| Où                                                                            | Comment                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/shared/text.ts` : `normalizeText`                                   | minuscules, `œ` → `oe`, accents latins retirés, ponctuation retirée, pluriel français simple (`-s`, `-x`, `-aux`)                                       |
| `src/core/shared/text.ts` : `nameVariants`, `findByName`                      | variantes d'un nom (`/`, `ou`, parenthèses) ; mot entier, jamais une sous-chaîne au hasard (« sel » ≠ « persil »)                                       |
| `src/core/matching/filters.ts` (`searchQuery`)                                | `normalizeText(nom).includes(requête)` sur `name_fr`, `name_derja`, `name_ar`, recette par recette                                                      |
| `src/features/fridge/components/FridgeSelector.tsx`                           | `toLowerCase().includes()` : **n'utilise pas** `normalizeText` (« oeuf » ne trouve pas « Œufs »)                                                        |
| Synchronisation (`application/sync`, `firebase/firestoreSharedCollection.ts`) | incrémentale et en direct (`revision`, marques de suppression), copie IndexedDB : la recherche travaille déjà sur des données à jour, sans lire la base |

Limites :

- **Aucune tolérance aux fautes** : « kamounya », « chakchouka » / « chakchoka », « agnau » ne trouvent rien.
- **Arabe non normalisé** : les harakat (U+064B–U+0652) sont dans la plage gardée par `normalizeText`,
  donc « كُسْكُسِي » ≠ « كسكسي » ; de même « أ / إ / آ » ≠ « ا », « ة » ≠ « ه », « ى » ≠ « ي », tatweel « ـ » gardé.
- **Derja en lettres latines** : aucune règle pour les graphies multiples (« 3jja » / « ojja »,
  « ch » / « sh », « ou » / « u », chiffres arabizi `3`, `7`, `9`, `5`).
- **Pas de classement** : une recette correspond ou non ; aucun score, aucune recherche dans les
  descriptions ni dans les ingrédients d'une recette.
- **Coût linéaire** : chaque frappe renormalise trois noms par recette (30 000 appels à 10 000 recettes).

## Contraintes du projet

- **PWA hors ligne** : la recherche doit marcher sans réseau, sur la copie locale du catalogue.
- **Render, offre gratuite** : 0,1 CPU, 512 Mo de RAM, **aucun disque persistant**, mise en veille après
  15 min sans trafic (≈ 1 min de réveil), 750 h par mois ; pas de service privé ni de worker gratuit.
  Un moteur serveur hébergé à côté de l'API perdrait son index à chaque redémarrage.
- **Trois langues** : français, derja en lettres latines (aucun moteur ne la connaît), arabe.
- **Architecture hexagonale** : le moteur est un détail d'infrastructure, derrière un port.
- **Base d'abord** : le catalogue reste dans la base ; l'index est une donnée **dérivée**, reconstructible.

## Comparatif

### Coût, licence, hébergement

| Moteur               | Licence                                                     | Où il tourne                  | Coût / offre gratuite                                                                         | Sur Render gratuit                                                               |
| -------------------- | ----------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Orama** 3.1        | Apache-2.0                                                  | navigateur ou Node (JS pur)   | gratuit (bibliothèque) ; Orama Cloud : offre à l'usage, pas d'offre gratuite affichée         | sans objet (dans le client)                                                      |
| **MiniSearch** 7.2   | MIT                                                         | navigateur ou Node (JS pur)   | gratuit                                                                                       | sans objet (dans le client)                                                      |
| **Meilisearch** 1.56 | MIT (édition communautaire) + BUSL-1.1 (édition entreprise) | serveur Rust, LMDB sur disque | auto-hébergé gratuit ; Cloud à partir de 20 $/mois (1 Go RAM), essai 14 jours                 | **non** : pas de disque persistant, index perdu à chaque veille                  |
| **Typesense** 30.2   | GPL-3.0 (serveur)                                           | serveur C++, index en RAM     | auto-hébergé gratuit ; Typesense Cloud à partir de 0,5 Go RAM (prix non affiché publiquement) | **non** : RAM ≈ 2 à 3 × les champs indexés, partagée avec Express, pas de disque |
| **Algolia**          | propriétaire (clients MIT)                                  | SaaS                          | offre « Free » : 10 000 recherches/mois, 50 000 enregistrements, 1 Go                         | sans objet (SaaS)                                                                |
| **Solr** 10.1        | Apache-2.0                                                  | serveur Java (JVM, Java 21+)  | auto-hébergé gratuit uniquement                                                               | **non** : une JVM ne tient pas dans 512 Mo partagés à 0,1 CPU                    |

Algolia gratuit : 10 000 requêtes par mois ≈ 330 par jour. Une recherche « à la frappe » consomme une
requête par touche : quelques dizaines d'utilisateurs actifs suffisent à dépasser le quota.

### Langues

| Moteur      | Français                                                             | Arabe                                                                                                     | Derja latine         | Fautes de frappe                                                        |
| ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| Orama       | accents retirés ; racinisation via `@orama/stemmers/french`          | tokenizer `arabic` + `@orama/stemmers/arabic` ; **les harakat coupent les mots** (vérifié, voir plus bas) | rien (règles à nous) | `tolerance` (Levenshtein borné, préfixe = 0), **0 par défaut**          |
| MiniSearch  | rien d'intégré : `processTerm` personnalisé (accents, racinisation)  | rien d'intégré : `processTerm` personnalisé ; harakat non retirés (vérifié)                               | rien (règles à nous) | `fuzzy: 0.2` (distance = 20 % de la longueur), `prefix: true`           |
| Meilisearch | minuscules, accents retirés ; pas de racinisation documentée         | tokenizer Charabia : article « ال » séparé, normalisation des signes diacritiques                         | rien                 | 1 faute dès 5 lettres, 2 dès 9 ; faute sur la 1ʳᵉ lettre comptée double |
| Typesense   | `locale` par champ, `stem: true` (Snowball), dictionnaire de racines | `locale` par champ ; prise en charge de `ar` et des harakat non confirmée dans la doc                     | rien                 | `num_typos` 2, 1 faute dès 4 lettres, 2 dès 7, préfixe par défaut       |
| Algolia     | pluriels « bons », mots vides (désactivés par défaut)                | harakat ignorés par défaut ; pluriels « basiques »                                                        | rien                 | jusqu'à 2 fautes, préfixe par défaut                                    |
| Solr        | `FrenchLightStemFilter`, `ElisionFilter` (l', d')                    | `ArabicNormalizationFilter` (harakat, tatweel, formes d'alef, ة → ه, ى → ي) + `ArabicStemFilter`          | rien                 | requêtes floues (`~`), à configurer                                     |

Constat : **aucun moteur ne connaît la derja**, et même les meilleurs pour l'arabe (Solr, Algolia) ne
gèrent pas l'arabizi. Les règles de normalisation doivent donc vivre **chez nous, dans `src/core`**,
appliquées identiquement à l'indexation et à la requête, quel que soit le moteur. Les fonctions
linguistiques intégrées d'un moteur deviennent un bonus, pas un critère décisif.

### Hors ligne, poids, mises à jour

| Moteur      | Hors ligne                   | Poids dans le bundle (min + gzip)                    | Mises à jour incrémentales                                             | Sauvegarde de l'index                                              |
| ----------- | ---------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Orama       | **oui**                      | 24,4 ko (+ racinisateurs importés langue par langue) | `insert`, `update`, `remove`, `insertMultiple`                         | `save` / `load` ; `@orama/plugin-data-persistence` (JSON, binaire) |
| MiniSearch  | **oui**                      | **5,7 ko**                                           | `add`, `replace`, `discard(id)`, `vacuum` (nettoyage en tâche de fond) | `toJSON` / `loadJSON` / `loadJSONAsync` (mêmes options requises)   |
| Meilisearch | non (repli local nécessaire) | client 8,4 ko                                        | API documents (ajout / suppression par lots, asynchrone)               | sur le serveur                                                     |
| Typesense   | non (repli local nécessaire) | client 35,6 ko                                       | API documents (`upsert`, suppression)                                  | sur le serveur                                                     |
| Algolia     | non (repli local nécessaire) | client 22,3 ko ; InstantSearch 40,8 ko               | `saveObjects`, `deleteObjects`                                         | chez Algolia                                                       |
| Solr        | non (repli local nécessaire) | aucun client imposé (HTTP)                           | ajout / suppression + commit                                           | sur le serveur                                                     |

### Construction de l'index : mesures

Aucun des projets ne publie de mesures comparables. Mesures faites pour cette étude (Node 26 sur le PC
de développement, données synthétiques : nom en trois langues + description française d'une
quarantaine de mots par document, 1 000 documents insérés par lot). Un téléphone milieu de gamme est
**3 à 5 fois plus lent** : les chiffres sont des ordres de grandeur.

| Documents | Orama : construction | Orama : mémoire\* | Orama : index sérialisé | MiniSearch : construction | MiniSearch : mémoire | MiniSearch : index sérialisé |
| --------: | -------------------: | ----------------: | ----------------------: | ------------------------: | -------------------: | ---------------------------: |
|     1 000 |               130 ms |           ≈ 22 Mo |                  1,4 Mo |                     69 ms |                 2 Mo |                       0,3 Mo |
|    10 000 |                ≈ 1 s |           ≈ 53 Mo |                   15 Mo |                    470 ms |                18 Mo |                         3 Mo |
|   100 000 |                ≈ 4 s |          ≈ 350 Mo |                  154 Mo |                     4,7 s |               177 Mo |                        32 Mo |

\* Orama garde aussi une copie des documents dans son index (et la mesure inclut le chargement du
module) ; MiniSearch ne garde que l'index si `storeFields` est vide.

Une requête floue (« kamounia agnau ») prend 10 à 25 ms à 1 000 et 10 000 documents, 140 ms
(MiniSearch) à 440 ms (Orama) à 100 000.

Conclusions :

- **1 000 à 10 000** recettes + ingrédients (l'horizon réaliste) : les deux moteurs du navigateur
  suffisent ; reconstruire l'index au démarrage, en tâche de fond, est acceptable.
- **100 000** : hors de portée d'un téléphone (plusieurs secondes, des centaines de Mo) et d'un
  catalogue complet téléchargé hors ligne. C'est le moment de passer à un moteur serveur.
- Les index sérialisés sont trop gros pour `localStorage` (≈ 5 Mo) : s'il faut les garder, ce sera
  dans IndexedDB, comme **cache** reconstructible, jamais comme source de données.

### Le piège des harakat (vérifié)

Deux recettes indexées, « كُسْكُسِي بِالدَّجَاج » (avec harakat) et « كسكسي بالدجاج » (sans) :

| Requête     | Orama (tokenizer `arabic`) | MiniSearch (défaut) |
| ----------- | -------------------------- | ------------------- |
| `كسكسي`     | seulement la 2ᵉ            | seulement la 2ᵉ     |
| `كُسْكُسِي` | les deux (par morceaux)    | —                   |

Le tokenizer arabe d'Orama ne garde que les lettres « أ-ي » : les harakat servent de séparateurs et
coupent les mots en morceaux. D'où la règle : **retirer les harakat avant de donner le texte au moteur**.

## Recommandation

1. **Maintenant : un moteur dans le navigateur, derrière un port.** C'est le seul choix qui coche à la
   fois gratuit, hors ligne, compatible Render gratuit et rapide jusqu'à ~10 000 documents.
2. **Moteur conseillé pour la v1 : MiniSearch**, de préférence à Orama (qui était la piste de départ) :
   - les fonctions linguistiques d'Orama (racinisation française et arabe) ne couvrent pas la derja et
     coupent l'arabe vocalisé : la normalisation doit de toute façon être écrite et testée dans `src/core` ;
   - à fonctions égales, MiniSearch est **4 fois plus léger** (5,7 ko contre 24,4 ko), consomme **2 à 3
     fois moins de mémoire** et produit un index sérialisé **5 fois plus petit** ;
   - API de mise à jour simple (`add` / `replace` / `discard`), tolérance aux fautes et préfixe intégrés,
     licence MIT, aucune dépendance.

   Orama reste le second choix, à essayer si la racinisation française intégrée apporte un vrai gain :
   grâce au port, l'essai se limite à un deuxième adapter qui passe le même test de contrat.

3. **Plus tard (au-delà de ~20 000 documents, ou recherche partagée côté serveur) : Meilisearch**.
   Meilleur compromis serveur (tolérance aux fautes réglée d'office, arabe pris en charge, MIT pour
   l'édition communautaire), mais **pas sur Render gratuit** : Meilisearch Cloud (20 $/mois) ou un petit
   serveur avec disque. Typesense est une alternative équivalente ; Algolia est exclu par son quota
   gratuit et son coût, Solr par son poids (JVM) et sa maintenance. Le moteur serveur s'ajoute **sans
   retirer** le moteur local, qui reste le repli hors ligne.

## Plan d'intégration (checklist de `CLAUDE.md`)

Branche `feature/recipe-search` depuis `develop` à jour.

### 1. Domaine : `src/core/search` (TypeScript pur, testé)

- `normalizeSearchText(text)` : part de `normalizeText` et ajoute
  - arabe : retrait des harakat et du tatweel, `أ إ آ` → `ا`, `ة` → `ه`, `ى` → `ي`, préfixes `ال`, `وال`,
    `بال` détachés ;
  - derja latine : table de graphies (`3` → `a`, `7` → `h`, `9` → `q`, `5` → `kh`, `sh` → `ch`,
    `ou` → `u`…), à valider avec le chef.
    Une seule règle, utilisée à l'indexation **et** à la requête, quel que soit le moteur.
    `normalizeText` existant n'est pas modifié (le matching du frigo en dépend) ; `normalizeSearchText`
    l'étend.
- `toSearchDocument(recipe)` : les champs cherchés et leur poids (nom > ingrédients > description),
  toutes langues, déjà normalisés. Même chose pour les ingrédients (`toIngredientSearchDocument`).
- `SearchOptions` (limite, tolérance, préfixe) avec une fonction `resolveSearchOptions` (même
  principe que `resolveMatchingConfig`).
- Les filtres (catégorie, budget, temps, sain) restent dans `createRecipeFilter` : le moteur ne fait
  que le texte et renvoie des ids classés, le core applique les filtres ensuite.
- Tests : harakat, alef, arabizi, pluriels, « sel » ≠ « persil » (comme `findByName`).

### 2. Port et store : `src/application`

Dans `ports.ts`, avec les mots du domaine :

```ts
/** Full-text search over the catalog. Implementations may run on the device or on a server. */
export interface RecipeSearchEngine {
  /** Replaces the whole index (first load, full sync). */
  rebuild(documents: RecipeSearchDocument[]): Promise<void>;
  /** Adds or replaces documents (incremental sync, chef edits). */
  upsert(documents: RecipeSearchDocument[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
  /** Ids ranked by relevance; the query is already normalized by the core. */
  search(query: string, options: SearchOptions): Promise<RecipeSearchHit[]>;
}
```

Asynchrone dès le départ, pour qu'un moteur serveur puisse le remplacer sans toucher aux appelants.
Un `SearchStore` (ou service) écoute `CatalogStore`, transforme les recettes en documents par le core,
appelle `rebuild` / `upsert` / `remove`, et expose l'état (`indexing`, `ready`) et les résultats. Testé
avec un faux moteur en mémoire. Les ingrédients suivent le même schéma (`IngredientSearchEngine`), pour
le frigo et `IngredientSearch` du backoffice.

### 3. Adapters : `src/infrastructure`

- `src/infrastructure/memory/memoryRecipeSearch.ts` : référence (parcours simple, sans fautes), utile aux tests.
- `src/infrastructure/contracts/recipeSearchEngine.contract.ts` : ce que tout moteur doit garantir
  (`upsert` remplace, `remove` retire, un document modifié ne garde aucun ancien terme, mot entier, ordre
  stable à score égal…).
- `src/infrastructure/minisearch/minisearchRecipeSearch.ts` : l'adapter MiniSearch, qui passe le contrat.
  Construction dans un **Web Worker** au-delà de quelques milliers de documents, pour ne pas figer l'écran.
- Optionnel : cache de l'index sérialisé dans IndexedDB, clé = révision la plus récente du catalogue ; reconstruit si
  absent ou périmé.
- Branché uniquement dans `src/app/container.ts`, exposé par un hook dans `ContainerContext.tsx`.

### 4. Spécificités de la base

- **Mises à jour en direct** : le `SyncedCollectionStore` du catalogue applique déjà les changements
  reçus (`applyChanges`). Le store de recherche suit ces changements : réponse complète (`complete`,
  première visite) → `rebuild` ; élément changé → `upsert` ; marque de suppression ou élément retiré →
  `remove`. Aucune lecture de la base en plus : l'index suit la copie de l'appareil.
- Moteur serveur (plus tard) : l'indexation suit les écritures du patron côté serveur (`server/`), et un
  adapter HTTP implémente `RecipeSearchEngine` ; le moteur local reste le repli hors ligne.

### 5. Interface

- La recherche de `/recettes`, `/suggestions` et du frigo passe par le hook : fin du `toLowerCase()` de
  `FridgeSelector`. Requête avec un léger délai (≈ 150 ms) ; filtres gardés entre les écrans comme
  aujourd'hui.
- Message « aucun résultat » et éventuelle suggestion (« vouliez-vous dire… ») dans les trois langues ;
  vérifié à 375 px et 320 px ; aucun nom de moteur dans les textes.

### 6. JSON

L'index n'est jamais exporté ni importé : il se reconstruit à partir du catalogue (la sauvegarde JSON
ne change pas).

### 7. Documentation et vérification

Mettre à jour cette page (statut « implémenté »), `05-application-donnees.md` (port et adapter),
`03-domaine.md` (`core/search`) et `CLAUDE.md` (convention : toute recherche texte passe par le port ;
normalisation dans `normalizeSearchText`) ; `npm run check` vert ; mesurer sur un vrai téléphone avec le
catalogue réel avant la PR.

## Sans régression

### Chaque limite et sa solution

| Limite d'aujourd'hui                | Exemple                                       | Solution                                                                  |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Aucune tolérance aux fautes         | « kamounya » ne trouve rien                   | Le moteur accepte 1 ou 2 fautes selon la longueur du mot                  |
| Arabe vocalisé                      | « كُسْكُسِي » ≠ « كسكسي »                     | `normalizeSearchText` retire les harakat, unifie `أ إ آ` → `ا`, `ة` → `ه` |
| Derja en lettres latines            | « 3jja » ≠ « ojja », « sh » ≠ « ch »          | Table d'équivalences dans `normalizeSearchText`, validée avec le chef     |
| Le frigo ignore la normalisation    | « oeuf » ne trouve pas « Œufs »               | Le frigo passe par la même recherche que les recettes                     |
| Pas de classement                   | Résultats dans l'ordre du catalogue           | Score du moteur : nom > ingrédients > description                         |
| Coût linéaire sur un gros catalogue | Chaque frappe renormalise toutes les recettes | Index construit une fois, puis mis à jour par `upsert` / `remove`         |

### Les règles à suivre pendant l'implémentation

1. **`normalizeText` n'est pas modifié.** Le matching du frigo, le scan photo et `findByName` en
   dépendent. `normalizeSearchText` l'appelle puis ajoute les règles arabes et derja : le comportement
   actuel ne bouge pas.
2. **Le comportement actuel est figé par des tests avant tout changement** (tests de caractérisation) :
   « sel » ne trouve pas « persil », « oeuf » trouve « Œufs », les filtres (catégorie, budget, temps,
   sain) renvoient les mêmes recettes qu'avant. Un test cassé bloque `npm run check`, donc le commit.
3. **Premier adapter = le code d'aujourd'hui.** Le port `RecipeSearchEngine` arrive d'abord avec
   l'adapter en mémoire, qui reproduit exactement le `includes` actuel. L'application est branchée dessus
   et doit donner les mêmes résultats. Ensuite seulement, MiniSearch le remplace dans `container.ts`
   (une ligne, réversible).
4. **Un seul test de contrat pour tous les moteurs.** L'adapter en mémoire, MiniSearch et plus tard un
   moteur serveur passent le même `recipeSearchEngine.contract.ts` (un document supprimé ne ressort plus,
   un nom modifié ne garde pas l'ancien terme, mot entier…).
5. **Les filtres ne bougent pas.** Le moteur ne traite que le texte et renvoie des ids classés ;
   `createRecipeFilter` reste la seule règle pour catégorie, budget, temps et sain.
6. **Repli tant que l'index n'est pas prêt.** Au démarrage, pendant la construction ou en cas d'erreur
   du moteur, la recherche actuelle répond : jamais d'écran vide.
7. **Comparaison avant fusion.** Un script de diagnostic (sur le modèle de `npm run diagnose:matching`)
   lance une liste de recherches types sur le vrai catalogue avec l'ancienne et la nouvelle recherche et
   affiche les différences ; chaque différence doit être voulue.
8. **Petites PR, une par étape** : normalisation, puis port + adapter en mémoire, puis MiniSearch, puis
   l'interface. Chacune est testable et réversible seule.

## Moins d'appels à la base : catalogue, navigation, filtres

Objectif : la navigation, la recherche et les filtres ne lisent **jamais** la base ; la base n'est lue
que pour ce qui a changé. Tout reste géré depuis `/patron`.

### Ce qui est déjà en place (`develop`)

La synchronisation incrémentale et en direct décrite dans
[05 Application et données](05-application-donnees.md#synchronisation-incrémentale-et-en-direct-toutes-les-collections-partagées)
couvre déjà l'essentiel :

- chaque écriture porte `revision` = heure du serveur ; une suppression est une marque `deleted` ;
- au démarrage, l'appareil affiche sa copie IndexedDB puis ne demande que `revision >=` la plus récente
  qu'il connaît, et reste abonné : une modification du patron arrive sur les appareils connectés en
  quelques secondes, pour une lecture par appareil ;
- les pages SEO du serveur se mettent à jour de la même façon (au plus toutes les 60 s) ;
- navigation, fiche recette, recherche et filtres travaillent sur la copie de l'appareil : **aucune
  lecture**. À conserver.

### Ce qui coûte encore

| Cas                                                                           | Lectures                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Première visite**, copie de plus de 30 jours, « Récupérer depuis le cloud » | **toute** la collection, marques de suppression comprises                                               |
| Ouverture sans changement                                                     | ≈ 1 à 2 par collection (minimum facturé par requête, `>=`)                                              |
| Modification du patron                                                        | 1 par appareil connecté et par élément modifié                                                          |
| Thèmes et scénarios                                                           | encore l'ancien chargement complet (petits volumes, à migrer)                                           |
| Marques de suppression                                                        | jamais purgées : elles s'ajoutent aux lectures complètes                                                |
| Réveil du serveur Render (SEO)                                                | **toute** la collection, à chaque réveil (évité par le moniteur UptimeRobot, voir `10-exploitation.md`) |

Le quota gratuit de Firestore est de **50 000 lectures par jour**. Exemple : 2 000 recettes + 500
ingrédients, 300 visites par jour dont 30 nouveaux appareils, 20 éléments modifiés par jour, 10 réveils
du serveur.

| Situation                                             | Lectures par jour (exemple) |
| ----------------------------------------------------- | --------------------------: |
| Avant la synchronisation incrémentale                 |                   ≈ 750 000 |
| `develop` aujourd'hui                                 |                   ≈ 106 000 |
| `develop` + fichier de démarrage (étape 1 ci-dessous) |                     ≈ 9 000 |

Les postes restants sont les **premières lectures complètes** : nouveaux appareils (30 × 2 500) et
réveils du serveur (10 × 2 500). Ils comptent peu tant que le catalogue est petit, mais dépassent le
quota dès quelques milliers d'éléments.

### Étape 1 : fichier de démarrage du catalogue

Idée : une première visite (et un réveil du serveur) ne lit plus la base élément par élément ; elle
télécharge **un seul fichier** qui contient le catalogue publié, puis ne demande à la base que ce qui a
changé depuis ce fichier.

Trois façons de faire, comparées :

| Option                                                    | Lectures d'une première visite        | Point de départ à jour…                 | Remarques                                                                                     |
| --------------------------------------------------------- | ------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| A. Lecture complète (aujourd'hui)                         | 2 500 (une par élément)               | toujours                                | simple, mais coûte cher en lectures                                                           |
| B. Copie compacte **dans la base** (2 ou 3 documents)     | 2 à 3 + changements depuis la copie   | à la dernière publication du patron     | 100 % Firestore ; documents limités à 1 Mo chacun                                             |
| **C. Fichier JSON de démarrage servi avec l'application** | **0** + changements depuis le fichier | au dernier déploiement (ou publication) | une requête HTTP, compressé, mis en cache par le navigateur ; sert aussi au serveur au réveil |

**Recommandée : C**, avec A comme repli.

- **Fabrication** : au build (`npm run build`), un script lit le catalogue avec le compte de service
  (une seule lecture complète par déploiement) et écrit `dist/catalog/start.<empreinte>.json` :
  recettes, ingrédients (et plus tard étiquettes) et la **révision la plus récente** qu'il contient. Il
  se met à jour **tout seul à chaque déploiement** : aucun nouveau bouton n'est nécessaire, et les
  modifications faites entre deux déploiements arrivent de toute façon par la synchronisation en direct.
  Option ultérieure, seulement si l'écart devient grand : une action « Mettre à jour le fichier de
  démarrage » dans `/patron` › Données (section « Base de données en ligne », à côté d'« Envoyer vers le
  cloud »), qui relance un déploiement Render (« deploy hook », à vérifier).
- **Première visite** (ou copie de plus de 30 jours, ou navigateur sans IndexedDB) : l'application
  télécharge le fichier, le **relit par le domaine** (`parseStoredRecipes` / `parseStoredIngredients`,
  éléments invalides ignorés), le range dans IndexedDB avec sa révision, puis suit `revision >=` celle du
  fichier : seulement les changements faits depuis le déploiement.
- **Serveur** : au réveil, `server/seo.ts` part du même fichier (déjà sur son disque, puisqu'il est dans
  `dist/`) au lieu de tout relire : un réveil ne coûte plus que les changements.
- **Taille** (mesurée sur le catalogue intégré : ≈ 4,3 ko par recette, ≈ 0,2 ko par ingrédient ;
  compression gzip ÷ 4, brotli ÷ 5) : 2 000 recettes + 500 ingrédients ≈ 8,7 Mo bruts, **≈ 2 Mo
  compressés**, une fois par appareil. Compression à activer côté serveur (fichier pré-compressé `.br` /
  `.gz`, ou middleware). Au-delà de ~10 000 recettes : découper par langue, ou « liste légère + détail à
  la demande ».
- **Place dans l'architecture** : nouveau port `CatalogStartSource` (« point de départ du catalogue »,
  mots du domaine) avec un adapter HTTP dans `src/infrastructure/http/`, branché dans `container.ts` ;
  le `SyncedCollectionStore` l'utilise quand il n'a pas de copie, puis suit les changements comme
  aujourd'hui. Le port `SharedCollectionSource` et son test de contrat ne changent pas.
- **Règle JSON de `CLAUDE.md`** : aujourd'hui « JSON seulement pour exporter / restaurer ». Ce fichier
  respecte l'esprit de la règle (la base reste la source de vérité ; le fichier est **dérivé**,
  régénéré, jamais modifié à la main, toujours relu par le domaine et toujours complété par la base),
  mais la règle devra le mentionner explicitement lors de l'implémentation.
- **Repli** : fichier absent (build sans compte de service), illisible ou incohérent → lecture complète
  d'aujourd'hui (option A).
- Au passage : purger les marques de suppression plus anciennes que le dernier fichier et que la limite de
  30 jours (plus aucun appareil ne peut en avoir besoin).
- Écarté : les « bundles » Firestore (même idée, mais format propre à Firestore et fichier à héberger
  quand même) et un catalogue servi par l'API du serveur depuis sa mémoire (perdue à chaque veille).

### Étape 2 : catégories en filtres, gérées par le patron

- Nouveau concept du domaine : l'**étiquette** (`RecipeTag`) : nom dans les trois langues, **groupe**
  (« Occasion », « Saison », « Régime »… le groupe devient une famille de filtres), ordre, publiée ou non.
  Une recette porte `tag_ids`. Validation par `validateRecipeTag` ; `parseStoredRecipe` et `parseBackup`
  conservent les étiquettes (test d'aller-retour).
- Stockage : une collection partagée de plus, avec le mécanisme générique existant
  (`SyncedCollectionStore` + `createFirestoreSharedCollection('recipe_tags')` + copie IndexedDB) : suivie
  en direct, relue seulement quand elle change.
- `/patron` : onglet « Étiquettes » (création, traduction avec `LocalizedField`, ordre, masquage) ; choix
  des étiquettes dans l'éditeur de recette ; suppression d'une étiquette utilisée refusée ou confirmée
  avec le nombre de recettes concernées.
- Public : la barre de filtres est **générée** depuis les étiquettes publiées, avec le nombre de recettes
  par filtre calculé sur la copie de l'appareil (`countFacets` dans le core) : **zéro lecture**. Dans un
  groupe, les choix s'additionnent (OU) ; entre groupes, ils se combinent (ET). Un filtre = une ligne de
  plus dans `createRecipeFilter`, qui reste la seule règle.

### Navigateur d'ordinateur (pas seulement le téléphone)

Tout ce qui est proposé fonctionne à l'identique dans un navigateur d'ordinateur (Chrome, Edge, Firefox,
Safari) :

- **IndexedDB, Web Worker, abonnement en direct, MiniSearch** : disponibles dans tous les navigateurs
  récents, ordinateur compris ; l'espace accordé à IndexedDB y est en général plus grand que sur
  téléphone. Les mesures de l'étude ont été faites sur un PC : c'est le cas le plus rapide.
- **Navigation privée ou stockage bloqué** : si IndexedDB est indisponible, l'application garde le
  catalogue en mémoire pour la visite. Grâce au fichier de démarrage, ce cas ne coûte qu'un
  téléchargement, pas 2 500 lectures.
- **Installation** : la PWA s'installe aussi sur ordinateur (Chrome, Edge) ; sinon elle s'utilise comme
  un site normal, avec la même copie hors ligne.
- **Interface** : recherche et filtres par étiquettes pensés aussi pour grand écran (filtres en colonne
  latérale ou en barre au-dessus de la grille, raccourci clavier pour la recherche). À vérifier à
  1280 px en plus de 375 px et 320 px.

### Sans régression

- **Rien n'est retiré** : les filtres actuels (plat / entrée / dessert, utilisés aussi par le moteur
  « Warini » et le menu ; type de cuisine ; sain ; budget ; temps) restent tels quels. Les étiquettes
  s'ajoutent à côté. Faire de `cuisine_type` une étiquette serait une décision séparée, avec
  conversion à la lecture par `migrateRecipes`.
- **Le pire cas = le comportement actuel** : sans fichier de démarrage, ou en cas d'erreur, la lecture
  complète d'aujourd'hui. Une base vide ne remplace toujours pas le catalogue intégré.
- **Contrats** : `sharedCollection.contract.ts` et `localCollectionCache.contract.ts` doivent passer sans
  modification ; le nouveau port `CatalogStartSource` a son test de contrat et une implémentation en
  mémoire ; le store est testé avec et sans fichier, fichier périmé ou invalide.
- **Tests du core** : `countFacets`, filtres par étiquette, validation des étiquettes ; tests de
  caractérisation des filtres actuels avant tout changement.
- **Ordre des PR** : 1) étiquettes (utile tout de suite, indépendante) ; 2) fichier de démarrage (client et
  serveur) ; 3) thèmes et scénarios sur le mécanisme générique. Chacune mesure
  le nombre de lectures avant / après (console Firebase, onglet Utilisation).

## Sources

- Render, offre gratuite : https://render.com/docs/free ; ressources : https://render.com/docs/compute-plans
- Orama : licence et version https://registry.npmjs.org/@orama/orama/latest ; poids
  https://bundlephobia.com/package/@orama/orama@3.1.18 ; langues du tokenizer
  https://github.com/oramasearch/orama/blob/main/packages/orama/src/components/tokenizer/languages.ts ;
  racinisateurs https://github.com/oramasearch/orama/tree/main/packages/stemmers ; tolérance
  https://github.com/oramasearch/orama/blob/main/packages/orama/src/components/levenshtein.ts ;
  persistance https://github.com/oramasearch/orama/tree/main/packages/plugin-data-persistence ; tarifs
  https://www.orama.com/pricing
- MiniSearch : documentation https://lucaong.github.io/minisearch/ ; API
  https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html ; licence et version
  https://registry.npmjs.org/minisearch/latest ; poids https://bundlephobia.com/package/minisearch@7.2.0
- Meilisearch : licence https://github.com/meilisearch/meilisearch/blob/main/LICENSE ; tarifs
  https://www.meilisearch.com/pricing ; stockage et RAM https://www.meilisearch.com/docs/learn/engine/storage ;
  langues https://www.meilisearch.com/docs/learn/resources/language ; fautes de frappe
  https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance_settings
- Typesense : licence https://github.com/typesense/typesense/blob/v30/LICENSE.txt ; ressources
  https://typesense.org/docs/guide/system-requirements.html ; collections (locale, stem)
  https://typesense.org/docs/30.2/api/collections.html ; recherche (fautes)
  https://typesense.org/docs/30.2/api/search.html ; tarifs https://cloud.typesense.org/pricing
- Algolia : tarifs https://www.algolia.com/pricing ; langues
  https://www.algolia.com/doc/guides/managing-results/optimize-search-results/handling-natural-languages-nlp/in-depth/supported-languages/ ;
  normalisation (harakat)
  https://www.algolia.com/doc/guides/managing-results/optimize-search-results/handling-natural-languages-nlp/in-depth/normalization/ ;
  fautes https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance/
- Solr : versions https://solr.apache.org/downloads.html ; prérequis
  https://solr.apache.org/guide/solr/latest/deployment-guide/system-requirements.html ; analyse par langue
  https://solr.apache.org/guide/solr/latest/indexing-guide/language-analysis.html ; normaliseur arabe
  https://lucene.apache.org/core/9_0_0/analysis/common/org/apache/lucene/analysis/ar/ArabicNormalizer.html

- Firestore : quota gratuit https://firebase.google.com/docs/firestore/quotas ; facturation (lecture
  minimale par requête) https://firebase.google.com/docs/firestore/pricing ; bundles
  https://firebase.google.com/docs/firestore/bundles

Points non confirmés par une source officielle : offre gratuite et prix actuels d'Orama Cloud et de
Typesense Cloud ; prise en charge explicite de `ar` / `fr` et des harakat par Typesense ; absence de
racinisation dans Meilisearch.
