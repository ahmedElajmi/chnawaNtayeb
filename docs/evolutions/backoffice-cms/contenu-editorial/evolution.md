# Contenu éditorial — étals, tags, organisation (7.1, F5)

> Ids : 7.1 (plan 17), F5 (modèle recette : étals) · Famille : backoffice-cms ·
> Statut : tracé ; **après F5** ; **non commencé** · Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Organisation éditoriale du contenu : étals, tags, groupes/collections, pages d'axe ; géré dans
`/admin` (arbres de catégories — deux arbres en base, une recette plusieurs catégories, un
ingrédient une seule ; type de plat `MealCategory` = champ fixe à part).

## 2. Contexte et état initial

Les catégories existent (arbres de recettes et d'ingrédients, `/admin/categories`, publication
directe par un compte qui peut publier) — en vigueur, renvoi `docs/solution/atelier-edition.md`.
L'organisation éditoriale cible (étals, tags, groupes) est conçue (V12 § 18–19, transférée verbatim
dans `analyses/`).

## 3. Fonctionnalités et règles métier

- Axes et tags : racines des arbres déclarées comme **axes** (`presentation: filter/group/both`,
  `selection: single/multiple`) ; **tags** (`tags` + `tag_ids`) ; filtrage « au plus une valeur par
  axe `single` » via `normalizeCategoryIds` ; pages publiques servées depuis les instantanés.
- Étals : l'étal « frigo » seul exploitable avant F5 (AR-4 — règle moteur réelle, aucune
  simulation codée en dur) ; étals éditoriaux/tags/collections après F5.
- Une recette a plusieurs catégories, un ingrédient une seule ; `MealCategory` champ fixe à part.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| AR-3 | Dates éditoriales de la recette (F5) — prérequis des étals datés | ACQUISE |
| AR-4 | Étal « frigo » réel ; éditorial attend F5 | ACQUISE |
| D-24 | 16 catégories affichées issues de l'arbre /admin | OUVERTE 🚩 |
| D-31 | Contenus encore en français (étapes, articles, ingrédients, listes, unités) = contenu CMS | OUVERTE 🚩 (lot de contenu) |

## 5. Architecture, contrats, modèles

Groupes éditoriaux (MANUAL/DYNAMIC/HYBRID, adressables par slug), collections (`RecipeSelection`
critères bornés, exécution adaptative avec garde-fous), invalidation par contenu **et** par
signatures de sélection ; un instantané = **optimisation de lecture, jamais une source de vérité**.
Compatible Firestore/SQL (sémantique identique). Conception : `analyses/v12-section-18-*.md`,
`v12-section-19-*.md`, `analyses/plan17-section-15-phase-7.md`.

## 6. Dépendances

- **Prérequis** : F5 (modèle recette : étals/datation) ; catégorie gérée (fait) ; permissions (3.x).
- **Contrats partagés** : catalogue-modeles (tags/axes), cms-staged-online (sections d'affichage),
  i18n-dynamique (contenus multilingues).
- **Débloque** : E7 (présentation, campagnes), pages publiques d'axe/groupe.

## 7. Contraintes sécurité/performance

Instantanés = optimisation de lecture ; totaux justes ; publication par droit vérifié (base) ;
mobile 375/320 px ; i18n.

## 8. Étapes de réalisation et critères d'acceptation

7.1 selon plan 17 § 15 (annexe), après F5. Critères : aucune simulation codée en dur, publication
contrôlée, parité mobile/desktop.

## 9. Stratégie de tests

Tests des arbres/axes (`normalizeCategoryIds`), tests d'instantanés (invalidation), i18n.

## 10. Preuves disponibles

Catégories en vigueur (code commité, tests). Conception : analyses/ verbatim. Aucune
implémentation 7.1.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Tracé, non commencé. Ouverts : D-24 (ordre/liste), D-31 (contenus à traduire — CMS).

## 12. Provenance

V12 § 18–19 + plan 17 § 15 (analyses/ verbatim) · AR-3/AR-4 · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
