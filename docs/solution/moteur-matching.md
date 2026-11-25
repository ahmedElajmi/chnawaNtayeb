# 04 · Moteur de matching « Warini chnowa ntayeb »

Question à laquelle il répond : **avec ce que j'ai, qu'est-ce que je peux cuisiner ?**
Code : `src/core/matching/`, en TypeScript pur, entièrement testé.

## Étapes

```
recettes ─▶ filters ─▶ analysis ─▶ scoring ─▶ tiers ─▶ ranking ─▶ prêtes / presque prêtes / idées
                          ▲                                 ▲
                   frigo + placard                 réglages (config.ts)
```

| Fichier             | Rôle                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `filters.ts`        | Filtres de l'utilisateur : publiée, catégorie, cuisine, healthy, budget, temps, recherche                    |
| `analysis.ts`       | Pour chaque ingrédient non facultatif : disponible, remplacé ou manquant                                     |
| `scoring.ts`        | Score de 0 à 100                                                                                             |
| `tiers.ts`          | Niveau : prête, presque prête, idée, ou non affichée                                                         |
| `ranking.ts`        | Ordre dans chaque niveau, par une liste de critères                                                          |
| `config.ts`         | Tous les réglages, en JSON validé                                                                            |
| `engine.ts`         | Enchaîne les étapes : `matchRecipes` (suggestions), `browseRecipes` (catalogue), `analyzeRecipe` (une fiche) |
| `scenarios.ts`      | Scénarios du chef : types et évaluation                                                                      |
| `scenarioSchema.ts` | Validation des scénarios lus en base ou importés (`parseScenario`, `validateScenario`)                       |

## Disponibilité (`analysis.ts`)

Un ingrédient est **disponible** s'il est dans le frigo ou le placard ; sinon il peut être
**remplacé** par une substitution applicable (voir [03](domaine.md)) ; sinon il est **manquant**.
Les ingrédients facultatifs sont ignorés.

Résultats utiles : ingrédients à acheter (clés puis secondaires), épices manquantes (informatif),
remplacements utilisés, nombre d'**ingrédients distincts du frigo utilisés**, et coût d'achat des
ingrédients manquants (une unité d'achat chacun : 1 kg, 1 paquet…), en **fourchette** :
`missingCost` / `missing_cost` = `PriceRange` (somme des prix min et des prix max, arrondie au
dixième). Affiché « ≈ 3 – 6 DT de courses » ; le tri par coût utilise toujours le coût estimé de la
recette (`estimated_cost_tnd`).

## Score (`scoring.ts`)

Part de la recette couverte, pondérée : un ingrédient clé pèse `keyWeight` (3), un secondaire
`secondaryWeight` (1), un remplacement compte `substituteFactor` (80 %). Les épices ne comptent
pas dans cette part ; chaque épice manquante retire `staplePenalty` points (2), au plus
`maxStaplePenalty` (10).

## Niveaux (`tiers.ts`)

| Niveau        | Condition                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prête         | Rien à acheter, et la recette utilise au moins un ingrédient du frigo                                                                                          |
| Presque prête | Au plus `almostMaxToBuy` (2) achats, dont au plus `almostMaxMissingKey` (1) clé ; si une clé manque, au plus `almostMaxToBuyWhenKeyMissing` (1) achat au total |
| Idée          | Au moins un ingrédient clé disponible et un ingrédient du frigo utilisé                                                                                        |
| Non affichée  | Aucun ingrédient clé disponible (sauf recherche par nom)                                                                                                       |

Frigo vide : toutes les recettes sont des idées (mode découverte).

`matchRecipes` ne renvoie que les recettes classées (écran `/suggestions`). `browseRecipes` analyse
les mêmes recettes filtrées mais les garde toutes (écran `/recettes`) : d'abord les prêtes, presque
prêtes et idées dans l'ordre de `matchRecipes`, puis les recettes « non affichées », triées avec les
critères des idées et marquées `ideas`.

## Ordre (`ranking.ts`)

Chaque niveau a sa liste de critères, appliqués l'un après l'autre en cas d'égalité, puis le nom :

| Critère      | Sens                                       | Par défaut dans              |
| ------------ | ------------------------------------------ | ---------------------------- |
| `boost`      | Recettes mises en avant par le super admin | tous les niveaux, en premier |
| `fridgeUsed` | Utilise le plus d'ingrédients du frigo     | prêtes (anti-gaspillage)     |
| `toBuy`      | Le moins d'achats                          | presque prêtes               |
| `missingKey` | Le moins de clés manquantes                | presque prêtes               |
| `score`      | Meilleur score                             | tous                         |
| `time`       | Le plus rapide                             | tous                         |
| `cost`       | Le moins cher                              | prêtes                       |

Une mise en avant a un poids de 1 à 10 et une date de fin facultative ; le jour courant est
injecté (`today`), ce qui rend le tri testable.

## Réglages (`config.ts`)

`MatchingConfig` contient `scoring`, `tiers`, `ranking`, `recipeBoosts` et `substitutions`.
`DEFAULT_MATCHING_CONFIG` est la référence. `resolveMatchingConfig(données)` fusionne des réglages
stockés (partiels, anciens ou modifiés à la main) avec les valeurs par défaut, borne les nombres
et ignore ce qui est invalide : **il ne lève jamais d'erreur**, une mauvaise valeur ne peut pas
casser l'application.

Les réglages actifs sont stockés en base et modifiables depuis l'onglet **Moteur** du backoffice
(voir [07](backoffice.md) et [05](donnees-sync.md)).

## Scénarios du chef (`scenarios.ts`, `scenarioSchema.ts`)

Des règles de qualité écrites comme des données : « avec ce frigo (et ce placard), cette recette
doit être en tête des prêtes », « aucun dessert ne doit être proposé », « le concentré ne doit pas
remplacer les tomates d'une salade »… Types de vérification : `tier`, `first`, `contains`, `top`,
`noCourse`, `toBuy`, `fridgeUsed`, `substitution`, `minScore`.

Les scénarios sont des **données en base** (collection `matching_scenarios`), gérés par le super admin dans
/admin › Moteur › Scénarios du chef : ajout, modification, test, suppression, export / import JSON.
Le code ne contient plus aucune liste de scénarios : il fournit les types, l'évaluation
(`evaluateScenario`) et la validation (`parseScenario` pour toute donnée lue, `validateScenario`
pour le formulaire). Les tests (`scenarios.test.ts`, `scenarioSchema.test.ts`) vérifient chaque type
de vérification, pas une liste figée.

Ils sont rejoués dans le backoffice avec le brouillon de réglages, avant toute publication.
La liste de départ (13 scénarios) est dans `docs/solution/references/scenarios-initiaux.json`,
à importer une fois depuis le backoffice.

**À relire et compléter par le chef** : ajouter un scénario chaque fois qu'une suggestion paraît fausse.

## Diagnostic

```bash
npm run diagnose:matching
```

Rapport sur des frigos types (œufs + tomates, poulet + pommes de terre, pâtes + thon…) :
nombre de recettes par niveau, les premières de chaque niveau, ce qu'il manque.

## Exigences permanentes du moteur (extraites du plan directeur V12 — Étape B)

> **Provenance** : `15-catalogue-organise.md` (plan directeur v12) — document d'orientation dont
> les règles encore en vigueur sont extraites ici avec leur section d'origine ; la source a été
> supprimée au nettoyage autorisé. Extraction consolidée en Étape B.

**Précision prime sur le volume** (préambule V12) : mieux vaut 8 recettes réellement réalisables
que 30 dont plusieurs reposent sur des correspondances erronées. Cinq exigences **indissociables** :
pertinence, fiabilité, performance, paramétrage métier, expérience d'administration. Objectif
d'échelle : 50 000 recettes et des centaines de règles sans effondrement de l'administration ni de
la performance. **Utilisable sans jamais saisir une seule quantité** — deux modes, **simple**
(présence seule) et **avancé** (quantités quand elles sont connues) ; la quantité est toujours
facultative (V12 § 8, § 12).

**Trois notions séparées** (V12 § 10, testé) : *hiérarchie* (organisation du catalogue, `variant_of`)
ne déduit **jamais** une équivalence ; *compatibilité* = règle explicite validée par l'admin
(demande ↔ réponse, contexte facultatif) ; *substitution* = remplacement culinaire autorisé sous
conditions (`SubstitutionRule`, étendu aux variantes). Règle absolue : **aucune équivalence déduite
du seul parent** (posséder du concentré ≠ posséder des tomates cerises).

**Priorité déterministe des substitutions** (V12 § 10, testé) : 1. règle spécifique à la recette
(y compris exception d'interdiction) → 2. technique culinaire / type de préparation → 3. catégorie de
recette → 4. règle générale ingrédient → ingrédient. Conflits de même priorité : comportement
déterministe et défini (ordre stable documenté), règles concurrentes **signalées** au laboratoire.
**Prudence** : sans contexte évaluable, **pas d'acceptation automatique** — la ligne tombe en
`incertain`.

**Conversions** (V12 § 11) : exacte (familles d'unités, variantes « boîte de 400 g » ↔ 400 g) ·
approximative connue (densité déclarée, **toujours marquée**, plafonnée par la tolérance) ·
impossible ou inconnue (c.à.s ↔ g sans densité, « pièce » ↔ masse sans poids moyen déclaré : **jamais
de poids standard supposé**) → ligne **incertaine**, jamais satisfaite au doigt mouillé. Mécanismes :
voir [03 § units](domaine.md).

**Paramétrage à deux niveaux** (V12 § 13) : employé formé = préréglages Strict / Équilibré /
Flexible + éditeur visuel de règles par champs guidés (**jamais en JSON**), chaque règle affiche
pourquoi elle a été créée (note obligatoire) et quelles recettes elle affecte (index règle →
recettes) ; administrateur habilité = seuils, pondérations, facteurs, tolérances avec indicateur de
risque ; une nouvelle capacité technique est développée **une seule fois**, puis configurable à vie
sans code. **Garde-fous** : une configuration ne peut jamais transformer une approximation en exact,
autoriser une substitution non déclarée, dépasser les bornes de `resolveMatchingConfig`, ni rendre
le moteur plus permissif que les règles déclarées. Paramétrable = **borné, validé, versionné et
simulé** — jamais arbitraire.

**Performance : exigence architecturale** (V12 § 15) : budgets mesurables par volume (312 × 60 :
< 50 ms mobile milieu de gamme ; 10 000 × 60 : < 600 ms ; 50 000 × 60 : évaluation paresseuse
obligatoire, < 3 s — < 60 µs par recette), une régression de performance fait échouer la phase comme
un test faux. **Pertinence avant vitesse** : le moteur n'arrête **jamais** l'analyse au seul motif
qu'il a trouvé assez de recettes réalisables ; l'arrêt anticipé n'intervient que **démontré** ;
chaque optimisation est comparée à une exécution de référence complète. Techniques imposées : index
par ingrédient et variante, préparation hors boucle, mémoïsation des conversions, évaluation
paresseuse, recalcul incrémental via l'index règle → recettes, caches explicites, recherche et
matching **séparés** (frigo vide = navigation, jamais un matching sans matière). Protocole annoncé,
jamais promis : environnement précis, p95/p99, frigo fixe, frigo modifié pendant une simulation testé.

**Fiabilité** (V12 § 16) : corpus = scénarios du chef étendus, résultat attendu par cas (y compris
« non évaluable ») — cas imposés : variantes, quantités insuffisantes, unités incompatibles,
conversions approximatives, substitutions interdites/conditionnelles, doublons, péremption proche,
double demande sur une même entrée, informations insuffisantes, **frigo sans aucune quantité**,
mélange quantifié/présence seule, **stock permanent déclaré puis épuisé**, **plusieurs lignes du
même ingrédient en présence seule**. Métriques séparées : **faux positifs (priorité absolue)**, faux
négatifs, précision des quantités, pertinence du classement, part des non évaluables, temps.
Objectif avant bascule : **zéro faux positif sur le corpus en profil strict** ; seuils « équilibré »
fixés avec le chef. Aucun taux nul promis — la prudence est structurelle.

**IA générative : jamais décideuse, jamais payante par défaut** (V12 § 17) : le moteur est
**déterministe** (même catalogue + frigo + config = même résultat, testé). L'IA n'est pas une
dépendance du plan ; le scan photo (Gemini, port `VisionProvider`) est facultatif — sans clé, le
scanner est désactivé et la plateforme reste complète. L'IA peut **assister** (proposer règles,
mappings, variantes) : chaque proposition passe par l'atelier et la validation humaine. Le scan
reconnaît la **présence**, jamais une quantité avec certitude ; seuls les ingrédients **confirmés
par l'utilisateur** sont ajoutés au frigo.

**Laboratoire** (V12 § 14 — écran `/admin › Moteur`, voir [07](backoffice.md)) : il doit
permettre de **comprendre** les résultats, pas seulement les afficher — pourquoi une recette est
proposée ou rejetée, quels ingrédients sont bloquants, quelle règle a influencé le résultat, ce qui
change entre deux configurations, quelles recettes sont impactées par une modification, pourquoi une
configuration ne peut pas être publiée (critères fonctionnels 6b.8). Il mesure le **coût par règle**
pour repérer celles qui dégradent le moteur.

## Faire évoluer le moteur

- Ajuster un comportement : d'abord un scénario qui décrit le résultat attendu, puis le réglage
  (backoffice) ou le code.
- Ajouter un critère de tri ou un filtre : voir [11 Guides pratiques](guides.md).
