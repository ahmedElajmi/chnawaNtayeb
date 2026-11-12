# 12 · Recherche : étude des moteurs

> **Statut : étude, rien n'est encore implémenté.** Cette page compare des moteurs de recherche
> gratuits et rapides pour un catalogue qui peut atteindre des milliers de recettes et d'ingrédients
> en trois langues, puis propose un moteur et un plan d'intégration. L'implémentation se fera sur sa
> propre branche (`feature/recipe-search`). Faits vérifiés le 12/11/2026 (sources en fin de page).

## Ce qui existe aujourd'hui

| Où                                                         | Comment                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/core/shared/text.ts` : `normalizeText`                | minuscules, `œ` → `oe`, accents latins retirés, ponctuation retirée, pluriel français simple (`-s`, `-x`, `-aux`) |
| `src/core/shared/text.ts` : `nameVariants`, `findByName`   | variantes d'un nom (`/`, `ou`, parenthèses) ; mot entier, jamais une sous-chaîne au hasard (« sel » ≠ « persil ») |
| `src/core/matching/filters.ts` (`searchQuery`)             | `normalizeText(nom).includes(requête)` sur `name_fr`, `name_derja`, `name_ar`, recette par recette                |
| `src/features/fridge/components/FridgeSelector.tsx`        | `toLowerCase().includes()` : **n'utilise pas** `normalizeText` (« oeuf » ne trouve pas « Œufs »)                  |
| Synchronisation (`infrastructure/firebase/catalogSync.ts`) | relecture **complète** des collections `recipes` et `ingredients` ; aucun `updated_at` sur les recettes           |

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
- Optionnel : cache de l'index sérialisé dans IndexedDB, clé = version du catalogue ; reconstruit si
  absent ou périmé.
- Branché uniquement dans `src/app/container.ts`, exposé par un hook dans `ContainerContext.tsx`.

### 4. Spécificités de la base

- **Mises à jour en direct** : aujourd'hui la synchronisation relit tout, donc `rebuild`. Quand la
  synchronisation incrémentale par `updated_at` existera, l'adapter Firestore renverra seulement les
  documents modifiés → `upsert`. Une suppression n'apparaît pas dans une requête `updated_at > x` :
  il faudra une **marque de suppression** (`deleted_at`) ou une liste d'ids, côté adapter, pour appeler
  `remove`. Ces détails restent dans l'adapter Firestore, jamais dans le port ni le moteur.
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

Points non confirmés par une source officielle : offre gratuite et prix actuels d'Orama Cloud et de
Typesense Cloud ; prise en charge explicite de `ar` / `fr` et des harakat par Typesense ; absence de
racinisation dans Meilisearch.
