
## Annexe — Plan 17 § 24 — Capacité « Budget » (B1–B6)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 673-910), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 24. Capacité « Budget » : estimation et exploitation du coût des recettes

**Proposition d'intégration — soumise à la validation du chef ; aucun lot de cette
section n'est exécuté et ils ne rejoignent le § 23 qu'après validation.**

### 24.1. Ce qui existe déjà (vérifié) — une évolution, pas une création

La V12 et le code actuel posent déjà l'essentiel : prix d'ingrédient en **fourchette**
(`price_min_tnd` ≤ `price_max_tnd`, migré depuis l'ancien champ unique) ; coût de
recette **calculé** (`recipeCostRange` via `getRecipeCost` / `useRecipeCost` dans
`src/core/catalog/pricing.ts`) ; **coût des ingrédients manquants selon le frigo** déjà
exprimé en `PriceRange` (listes de courses) ; affichage unique `formatPriceRange`.
La capacité demandée est donc une **extension structurée** de ce socle, avec trois
ajouts : l'estimation orientée frigo (dépenses supplémentaires), les critères budget
pour le catalogue et l'accueil, et la gestion de la fraîcheur/fiabilité des prix.

### 24.2. Principes non négociables

1. **Estimation indicative, jamais un prix garanti** : toujours une fourchette, jamais
   un chiffre unique ; toute estimation affiche sa nature (« estimation indicative »,
   traduite) et la date d'actualisation des prix utilisés.
2. **Le prix d'un ingrédient est toujours un intervalle, exprimé pour son unité de
   référence** (`price_unit`) — jamais un prix unitaire unique et jamais un prix sans
   unité ; toute conversion ou agrégation reste un calcul à partir de cet intervalle
   (les bornes sont propagées, jamais moyennées).
3. **Découplage strict du moteur de matching** : le coût vit dans un module core
   autonome ; le matching pourra **consommer** le coût comme un critère entrant, jamais
   l'inverse — le module de coût ne connaît ni le moteur, ni le frigo interne, ni
   l'interface (test d'architecture étendu).
4. **Quantités inconnues respectées** : une présence sans quantité n'est jamais
   convertie en « ingrédient gratuit » ni en « stock illimité » (§ 8 et § 12 de la V12).
5. **Budget zéro** : les prix sont saisis et maintenus **manuellement** par
   l'administration ; aucune source de prix payante obligatoire. Les sources externes
   futures passeront par un port facultatif — leur absence ne dégrade rien.
6. **Zéro refonte** : le socle existant (fourchettes, `formatPriceRange`,
   `useRecipeCost`) est conservé et étendu ; aucun remplacement.
7. **Zéro impact sur la saisie client** : le budget **lit** des données existantes
   (recettes, prix, frigo) et n'en exige jamais davantage — l'ajout d'un ingrédient
   au frigo ou d'une ligne à une recette est inchangé, **aucune quantité ne devient
   obligatoire**, aucune étape supplémentaire ; le budget enrichit l'affichage,
   jamais la saisie.

### 24.3. Modèle de données (extension, sans rupture)

- **Prix d'ingrédient** (extension de l'existant) : fourchette min/max conservée —
  **le prix est toujours un intervalle et se rapporte toujours à son unité de
  référence** — + **`price_unit` (unité de référence du prix — obligatoire : kg, g, l,
  ml, pièce, botte…)** + `price_updated_at` (date d'actualisation, obligatoire au
  calcul) + `price_source` (facultatif : saisi, catalogue, source externe) + indicateur de
  fraîcheur dérivé (à jour / ancien / obsolète selon seuils configurables). Prix
  indicatifs par nature. **Unités et conversions** : le calcul passe par le système
  d'unités V12 (`@/core/units`) — conversions **exactes** (familles), **approximatives
  déclarées** (densité, toujours marquées), **impossibles** (jamais inventées) ;
  **conditionnements** (« boîte de 400 g ») et **rendements** (« 1 botte ≈ 300 g net »)
  déclarés par ingrédient quand ils sont nécessaires — toute conversion non déclarée
  rend la ligne **non calculable**, jamais estimée au doigt mouillé.
- **Coût dérivé de recette** (donnée calculée, jamais source de vérité) : `cost_min`,
  `cost_max`, `cost_per_person_min/max`, `computed_at`, **empreinte des prix** utilisés
  (date de référence) — recalculée à la modification de la recette ou des prix de ses
  ingrédients (recalcul événementiel par lot, jamais dans la requête) ; colonnes
  indexables pour filtrer à 50 000 recettes.
- **Estimation contextuelle** (calculée à la demande, jamais stockée) — **deux
  estimations distinctes, chacune avec son propre statut et sa propre fiabilité**
  (noms définitifs fixés dans B1) :
  - **Coût de la recette** : `recipeCost { status, total?, per_person?, reliability }`
    — combien coûte la préparation complète de la recette ; il ne dépend que des
    données de la recette et des prix, **jamais du contenu du frigo** ;
  - **Dépenses supplémentaires** : `additionalCost { status, amount?, unknown_lines,
uncomputed_lines, reliability }` — combien il faut dépenser en tenant compte des
    ingrédients déjà présents dans le frigo (frigo × recette) ; `unknown_lines` =
    lignes couvertes en présence seule (coût non calculable) ; `uncomputed_lines` =
    lignes non calculées avec **leur raison** (prix absent, conversion impossible,
    quantité imprécise).

  `status` (dans les deux cas) : `'complete' | 'partial' | 'unavailable'` ;
  `reliability` = couverture des prix + fraîcheur. **Les deux statuts sont
  indépendants** : une quantité inconnue dans le frigo peut rendre les dépenses
  supplémentaires partielles ou indisponibles **sans empêcher d'afficher un coût de
  recette pourtant parfaitement calculable** (ex. : recette entre 15 et 18 DT, prix
  tous connus, tomates présentes dans le frigo sans quantité → coût total affichable,
  dépenses supplémentaires partielles).

### 24.4. Services et interfaces (couches existantes)

- **Core** (`src/core/budget`, TypeScript pur) : `estimateRecipeCost(recipe, prices,
quantities)` — fonction pure, horloge injectée, tests à côté ; réutilise les
  conversions d'unités ; **ne connaît ni le matching, ni React, ni le modèle interne
  du frigo** — il reçoit des **données normalisées** (besoins de la recette,
  disponibilités quantifiées, prix), jamais des objets frigo ou moteur.
- **Orchestration** (service applicatif, `src/application`) : le calcul contextuel des
  **dépenses supplémentaires** est orchestré par un service qui **normalise** les
  entrées de frigo (présence seule → quantité inconnue déclarée, réservations,
  péremptions, sémantique V12 § 8 et § 12) puis transmet les données normalisées au
  module Budget — le découplage est vérifiable par les tests (test d'architecture).
- **Port** (`src/application`) : `IngredientPriceProvider` (lecture des prix) ;
  `PriceSource` **port facultatif** documenté pour une source externe future (aucune
  implémentation au départ, aucun service requis) ; store applicatif pour l'estimation
  contextuelle.
- **Interface client** : fiche recette (coût total, par personne, dépenses
  supplémentaires selon frigo, lignes « à vérifier ») ; suggestions et listes affichent
  les fourchettes via `formatPriceRange` (inchangé).
- **Back-office** : gestion des prix enrichie (fourchettes, unité, date
  d'actualisation, mise à jour groupée par famille) + paramètres des rubriques budget
  (seuils, activation) — simple, sans compétence technique.

**Fiabilité du recalcul** : recalcul **ciblé** des recettes impactées (via l'index
recette → ingrédients) ; journal et **reprise** des recalculs interrompus ou échoués ;
**aucun coût dérivé obsolète affiché ni utilisé** (empreinte des prix vérifiée à
l'affichage — le contrôle détecte **immédiatement** l'obsolescence **sans déclencher
aucun recalcul synchrone** : le recalcul est **exclusivement asynchrone et ciblé**,
jamais dans la requête utilisateur — si l'empreinte est plus ancienne que les prix
courants, le coût périmé est **masqué** et le recalcul asynchrone ciblé est déclenché)
et **exclu des résultats budgétaires**
(filtres et rubriques) jusqu'à son recalcul — une recette à coût dérivé périmé ne
peut pas apparaître dans une rubrique « moins de X DT » établie sur des données
antérieures à la modification de prix ; **traçabilité des mises à jour groupées**
(journal : qui, quand, périmètre) ; **devise et arrondis gérés centralisément** (TND,
réglages définis une seule fois, jamais répartis dans le code).

### 24.5. Exploitation : accueil et catalogue (dans les mécanismes prévus)

- **Filtres catalogue** : coût min/max, **par personne ou total** — nouveaux critères
  du `browseRecipes` existant, indexés sur les colonnes dérivées (totaux justes).
  **Deux régimes distingués** : **budget garanti** (par défaut — la borne **supérieure**
  de la fourchette est comparée au seuil : une rubrique « moins de 5 DT/personne »
  n'affiche que des recettes dont le coût peut réellement rester sous le seuil) et
  **budget potentiellement compatible** (optionnel, explicite — la borne inférieure
  est comparée, libellé adapté « à partir de X DT »). **Cohérence budgétaire** :
  une recette dont le coût dérivé est **obsolète** (prix modifiés, recalcul pas
  encore exécuté) est **exclue des résultats budgétaires** (filtres et rubriques)
  jusqu'à son recalcul ciblé (§ 24.4) — jamais présentée dans une rubrique
  « moins de X DT » sur des données périmées. **Règles d'admission par régime**
  (le seuil de couverture ne transforme **jamais** une estimation partielle en
  garantie budgétaire) :

  | Situation              | Budget garanti                       | Budget potentiellement compatible                                            |
  | ---------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
  | Coût complet et à jour | Autorisé si borne supérieure ≤ seuil | Autorisé si borne inférieure ≤ seuil                                         |
  | Coût partiel           | **Exclu**                            | Éventuellement autorisé, avec **mention explicite** « estimation partielle » |
  | Coût obsolète (§ 24.4) | **Exclu**                            | **Exclu**                                                                    |
  | Coût indisponible      | **Exclu**                            | **Exclu**                                                                    |

- **Accueil** : rubriques « recettes à moins de X DT/personne », « repas familiaux à
  moins de X DT au total » = des `RecipeSelection` (critères budget) exposées via
  **`DisplaySection`** (V12 § 20) — donc **activables/désactivables, ordonnables et
  paramétrables depuis le back-office**, avec l'accueil actuel en repli ; seuils par
  défaut (5 / 10 / 50 DT) modifiables.
- **« Rapport qualité/prix »** — **rubrique facultative isolée dans un lot distinct
  (B6)** : combinaison configurable (ex. coût bas × signaux de qualité existants :
  favoris, popularité agrégée § 22 V12), définition à arbitrer, aucun algorithme
  caché ; elle **ne bloque pas le reste de B5** — activée après les agrégats de
  popularité de la phase 9 (lot 9.2), désactivable comme toute `DisplaySection`.

### 24.6. Sémantique du calculable — jamais « toujours calculable »

Quatre causes indépendantes peuvent empêcher de calculer une ligne ou l'ensemble :

1. **Quantité inconnue ou imprécise dans la recette** (ligne non quantifiée,
   unité sans conversion déclarée) ;
2. **Quantité inconnue dans le frigo** (présence seule, stock permanent) — la ligne
   est couverte qualitativement, son coût supplémentaire est indéterminé ;
3. **Prix absent ou obsolète** de l'ingrédient concerné ;
4. **Conversion impossible** (unité du prix ↔ unité de la recette sans conversion
   déclarée).

Résultat en trois états — **appliqué indépendamment à chacune des deux estimations
(coût de la recette, dépenses supplémentaires)**, avec **explication et niveau de
fiabilité explicites** :

- **complete** : tous les coûts calculés, prix à jour — affiché comme
  **« Estimation totale indicative »** ;
- **partial** : total et/ou dépenses supplémentaires calculés sur une **sous-partie**
  des lignes — **toujours libellé « Estimation partielle — certains ingrédients ne
  sont pas inclus »**, même quand le seuil de couverture est atteint ; chaque ligne
  non calculée est **listée avec sa raison** (ex. « tomates : prix non renseigné »),
  jamais une moyenne silencieuse ;
- **unavailable** : rien de fiable à afficher — **aucun montant montré**, avec
  l'explication de ce qui manque.

Les **dépenses supplémentaires** ne sont calculées que sur les lignes **manquantes
certaines** ou **insuffisantes connues** ; une ligne couverte en **présence seule**
va dans `unknown_lines` : « à vérifier — coût non inclus », jamais convertie en
économie ni en coût zéro. Même logique que le qualificatif « sous réserve » du moteur,
**sans le coupler**.

### 24.7. Fiabilité et affichage

- Quatre niveaux de fiabilité affichables : prix complets et à jour · incomplets ·
  anciens (dates dépassant les seuils) · non calculable — toujours traduits.
- Aucun affichage public tant que la couverture des prix de la recette est en dessous
  d'un seuil configuré (paramètre back-office). **Comportement sous le seuil** : le
  coût chiffré (total, par personne, dépenses supplémentaires) est **masqué** ; les
  ingrédients dont le prix manque restent **identifiables** (liste des lignes non
  calculées avec leur raison) ; le client voit une **explication explicite et
  traduite** (« estimation indisponible — prix manquant pour : … ») — **jamais un
  montant partiel présenté comme le coût de la recette**.
- **Formule de couverture des prix — définie dans B1** : la couverture peut se
  compter par nombre de lignes ou être pondérée par la quantité ou la contribution
  estimée au coût (résultats potentiellement très différents — 8 ingrédients sur 10
  chiffrés = 80 % par lignes, mais l'ingrédient principal peut manquer de prix) ;
  B1 définit la formule retenue, ses limites et son comportement quand des quantités
  sont inconnues, avec ses tests — l'objectif : **une recette ne doit jamais afficher
  une bonne couverture alors que son ingrédient principal n'a aucun prix
  renseigné**.
- Cohérence : une estimation ne s'affiche jamais comme un prix de vente ni un
  engagement — libellé « estimation indicative » partout, 4 langues, RTL.

### 24.8. Lots proposés (à valider avant toute exécution)

| Lot                                                      | Contenu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dépend de                                                                                                                                  | Livrables & critères                                                                                                                                                                                                                                                                                                                                                                                             | Taille |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **B1 — Spécification du coût**                           | Modèle (§ 24.3–24.7), principes, seuils de fraîcheur, **formule de couverture des prix et son comportement avec quantités inconnues**, cas limites (quantités inconnues, prix obsolètes, conversions impossibles), décisions § 24.9                                                                                                                                                                                                                                                                                                                                                                   | V12 + validation de cette section                                                                                                          | Spécification signée + jeu de tests prévu ; critère : chaque principe a son test, la formule de couverture est définie et testée                                                                                                                                                                                                                                                                                 | S      |
| **B2 — Core Budget (pur)**                               | `src/core/budget` (`estimateRecipeCost` sur données normalisées), port `IngredientPriceProvider`, unités/conversions/conditionnements ; **indépendance vérifiée : aucune dépendance frigo/matching/React (test d'architecture)**                                                                                                                                                                                                                                                                                                                                                                      | B1                                                                                                                                         | Tests unitaires complets (fourchettes, quantités inconnues, prix absents, conversions) ; critère : jamais de chiffre unique, unknown_lines/uncomputed_lines explicites ; **découplé du stockage**                                                                                                                                                                                                                | M      |
| **B3 — Intégration stockage & coût dérivé**              | Prix enrichis (unité, dates, fraîcheur), coût dérivé + recalcul fiable (§ 24.4), indexation pour filtres ; branché sur les contrats et données migrées                                                                                                                                                                                                                                                                                                                                                                                                                                                | B2 + 5b.2 + 6a.1 + 6a.3 (migration et source de vérité des recettes/ingrédients stabilisées — **frigo indépendant, séquence 6b.7a/6b.7b**) | Critère : recalcul ciblé testé (modification de prix) et **exclusivement asynchrone** (aucune requête utilisateur ne déclenche de calcul lourd), reprise après interruption, aucun coût obsolète affiché **ni utilisé dans les filtres ou rubriques budgétaires** (exclusion jusqu'à recalcul, § 24.4–24.5), traçabilité des mises à jour groupées, devise/arrondis centralisés ; non-régression `getRecipeCost` | M      |
| **B4 — Gestion back-office des prix & paramètres**       | Écrans prix (fourchettes, unité, date, fraîcheur, mise à jour groupée) + paramètres des rubriques budget (seuils, activation, régime garanti/potentiel) — **maquettes incluses dans le paquet D5 (§ 3)** ; **réutilise les mécanismes génériques existants, jamais un second système de configuration** : règles et conditions d'activation (4.1), activation/désactivation et règles d'accès (4.2), cycle de vie des configurations — brouillon, prévisualisation, publication, historique, restauration (4.3) — **les paramètres budgétaires sont testables et prévisualisables avant publication** | B3 + 2.8 (fondations) + D5 validé (maquettes prix/budget comprises) + 4.1 + 4.2 + 4.3 (mécanismes réutilisés)                              | Critère : gestion simple sans compétence technique, parité mobile, audit des modifications de prix, **paramètres publiés uniquement via le cycle de vie 4.3**                                                                                                                                                                                                                                                    | S      |
| **B5 — Estimation client & exploitation**                | Affichages client (fiche : total, par personne, dépenses supplémentaires, unknown_lines) ; filtres min/max (personne/total) ; rubriques budget en `RecipeSelection` + `DisplaySection` — **sans la rubrique « rapport qualité/prix » (lot B6 distinct)**                                                                                                                                                                                                                                                                                                                                              | B2 + B3 + B4 + D1/D2 validées (affichages) + 7.2 + 7.4 + D6 validé (accueil)                                                               | Critère : totaux justes, bornes supérieures par défaut pour les rubriques publiques, coûts dérivés obsolètes exclus des résultats budgétaires, **estimations partielles exclues du régime garanti et mentionnées explicitement en régime potentiel (§ 24.5)**, rubriques activables/désactivables depuis le back-office, accueil actuel en repli, parité mobile                                                  | M      |
| **B6 — Rubrique « rapport qualité/prix » (facultative)** | `RecipeSelection` combinant coût et signaux de qualité (favoris, popularité agrégée), exposée en `DisplaySection` activable/désactivable — livrée **après B5, sans le bloquer**                                                                                                                                                                                                                                                                                                                                                                                                                       | B5 + 9.2 (agrégats de popularité) + 🚩 définition arbitérée (§ 24.9)                                                                       | Critère : définition documentée, aucun algorithme caché, rubrique désactivable depuis le back-office                                                                                                                                                                                                                                                                                                             | S      |

### 24.9. Décisions à arbitrer (🚩)

1. Définition du **« meilleur rapport qualité/prix »** (quels signaux, quel poids) —
   arbitrage au moment de **B6** (lot facultatif distinct), après que les agrégats de
   popularité existent (phase 9, lot 9.2) ; **ne bloque pas B5**, qui livre coûts,
   filtres et rubriques budget sans cette rubrique.
2. **Seuils de fraîcheur des prix** (à jour / ancien / obsolète), **seuil de
   couverture minimal** avant affichage public et **formule de couverture des prix**
   (par nombre de lignes ou pondérée par la contribution estimée au coût,
   comportement avec quantités inconnues) — définis et testés avec le chef dans B1.
3. Responsabilité de la **mise à jour des prix** (qui, quand, rappel back-office ?).
4. Libellés et présentation des fourchettes (règle « pas de chiffre unique » à
   décliner visuellement avec D1/D2).

### 24.10. Ce que cette capacité ne fait pas

Elle ne touche pas au moteur de matching (aucun couplage), ne supprime rien de
l'existant, n'introduit aucune dépendance payante, ne transforme pas les prix en
promesse, et ne crée aucune collection commerciale — le mapping ingrédient ↔ produit
resterait une affaire de commerce (phases 11–13 conditionnelles), pas du budget.
