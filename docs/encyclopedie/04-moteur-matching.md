# 04 · Moteur de matching « Warini chnowa ntayeb »

Question à laquelle il répond : **avec ce que j'ai, qu'est-ce que je peux cuisiner ?**
Code : `src/core/matching/`, en TypeScript pur, entièrement testé.

## Étapes

```
recettes ─▶ filters ─▶ analysis ─▶ scoring ─▶ tiers ─▶ ranking ─▶ prêtes / presque prêtes / idées
                          ▲                                 ▲
                   frigo + placard                 réglages (config.ts)
```

| Fichier        | Rôle                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| `filters.ts`   | Filtres de l'utilisateur : publiée, catégorie, cuisine, healthy, budget, temps, recherche                    |
| `analysis.ts`  | Pour chaque ingrédient non facultatif : disponible, remplacé ou manquant                                     |
| `scoring.ts`   | Score de 0 à 100                                                                                             |
| `tiers.ts`     | Niveau : prête, presque prête, idée, ou non affichée                                                         |
| `ranking.ts`   | Ordre dans chaque niveau, par une liste de critères                                                          |
| `config.ts`    | Tous les réglages, en JSON validé                                                                            |
| `engine.ts`    | Enchaîne les étapes : `matchRecipes` (suggestions), `browseRecipes` (catalogue), `analyzeRecipe` (une fiche) |
| `scenarios.ts` | Scénarios du chef et leur évaluation                                                                         |

## Disponibilité (`analysis.ts`)

Un ingrédient est **disponible** s'il est dans le frigo ou le placard ; sinon il peut être
**remplacé** par une substitution applicable (voir [03](03-domaine.md)) ; sinon il est **manquant**.
Les ingrédients facultatifs sont ignorés.

Résultats utiles : ingrédients à acheter (clés puis secondaires), épices manquantes (informatif),
remplacements utilisés, nombre d'**ingrédients distincts du frigo utilisés**, et coût d'achat des
ingrédients manquants (une unité d'achat chacun : 1 kg, 1 paquet…).

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

| Critère      | Sens                                   | Par défaut dans              |
| ------------ | -------------------------------------- | ---------------------------- |
| `boost`      | Recettes mises en avant par le patron  | tous les niveaux, en premier |
| `fridgeUsed` | Utilise le plus d'ingrédients du frigo | prêtes (anti-gaspillage)     |
| `toBuy`      | Le moins d'achats                      | presque prêtes               |
| `missingKey` | Le moins de clés manquantes            | presque prêtes               |
| `score`      | Meilleur score                         | tous                         |
| `time`       | Le plus rapide                         | tous                         |
| `cost`       | Le moins cher                          | prêtes                       |

Une mise en avant a un poids de 1 à 10 et une date de fin facultative ; le jour courant est
injecté (`today`), ce qui rend le tri testable.

## Réglages (`config.ts`)

`MatchingConfig` contient `scoring`, `tiers`, `ranking`, `recipeBoosts` et `substitutions`.
`DEFAULT_MATCHING_CONFIG` est la référence. `resolveMatchingConfig(données)` fusionne des réglages
stockés (partiels, anciens ou modifiés à la main) avec les valeurs par défaut, borne les nombres
et ignore ce qui est invalide : **il ne lève jamais d'erreur**, une mauvaise valeur ne peut pas
casser l'application.

Les réglages actifs sont stockés en base et modifiables depuis l'onglet **Moteur** du backoffice
(voir [07](07-backoffice.md) et [05](05-application-donnees.md)).

## Scénarios du chef (`scenarios.ts`)

Des règles de qualité écrites comme des données : « avec ce frigo (et ce placard), cette recette
doit être en tête des prêtes », « aucun dessert ne doit être proposé », « le concentré ne doit pas
remplacer les tomates d'une salade »… Types de vérification : `tier`, `first`, `contains`, `top`,
`noCourse`, `toBuy`, `fridgeUsed`, `substitution`, `minScore`.

Ils sont rejoués :

- par les tests (`scenarios.test.ts`) avec les réglages par défaut ;
- dans le backoffice avec le brouillon de réglages, avant toute publication.

**À relire et compléter par le chef** : ajouter un scénario chaque fois qu'une suggestion paraît fausse.

## Diagnostic

```bash
npm run diagnose:matching
```

Rapport sur des frigos types (œufs + tomates, poulet + pommes de terre, pâtes + thon…) :
nombre de recettes par niveau, les premières de chaque niveau, ce qu'il manque.

## Faire évoluer le moteur

- Ajuster un comportement : d'abord un scénario qui décrit le résultat attendu, puis le réglage
  (backoffice) ou le code.
- Ajouter un critère de tri ou un filtre : voir [11 Guides pratiques](11-guides-pratiques.md).
