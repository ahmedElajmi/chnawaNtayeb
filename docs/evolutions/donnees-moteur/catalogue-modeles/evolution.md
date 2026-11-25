# Modèles du catalogue (F1-adjacent, 5b, F5)

> Ids : 5b (conception modèles), F5 (modèle recette : dates éditoriales), décision § 7.1 (variantes) ·
> Famille : donnees-moteur · Statut : conception validée ; **décision § 7.1 différée à 5b** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Stabilisation des modèles métier du catalogue avant la migration : ingrédients (hiérarchie de
variantes), lignes de recette identifiées (précision, préparation, lien aux étapes, `tag_ids`),
frigo à entrées (volet dédié : `../stock-entrees-sync/`), dates éditoriales de la recette (F5).

## 2. Contexte et état initial

Modèles actuels vérifiés au code (reorientation § 1) : `Ingredient` plat, recettes riches validées
par l'atelier, frigo à ids (avant F1). La conception est écrite (V12 § 6–7, transférée verbatim dans
`analyses/v12-section-6-catalogue-recettes.md` et `v12-section-7-catalogue-ingredients.md`).

## 3. Fonctionnalités et règles métier

- Lignes d'ingrédient avec **id propre** : plusieurs variantes du même générique = besoins
  indépendants ; réordonnancement, suppression, association ligne ↔ étapes ; obligatoire/facultatif
  visible ; **quantités conservées au changement de portions** (`scaleIngredients` garde chaque
  ligne, jamais fusionnées) ; indicateur de complétude qui **signale sans jamais bloquer**.
- `tag_ids` (tags éditoriaux) ; `cuisine_type` glisse vers un axe (le champ reste écrit un temps).
- Rien ne change : workflow d'atelier, coûts en fourchette, slugs, SEO (renvoi
  `docs/solution/domaine.md`).
- Prix en fourchette (`price_min_tnd` ≤ `price_max_tnd`) — en vigueur, renvoi `docs/solution/domaine.md`.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| § 7.1 | Hiérarchie de variantes : « une entité + `variant_of` » **ou** deux entités — décision à la phase 5b sur critères mesurables (matching, courses, conversions, migration des références, requêtes « variantes de », clarté des substitutions) ; la simplicité ne prime pas sur la précision métier ; profondeur bornée à 3 configurable, cycles refusés | OUVERTE ⏳ (décision à 5b) |
| AR-3 | Dates éditoriales de la recette à F5 (création, dernière modification, première publication, dernière publication) ; `revision` = technique, **jamais** une date éditoriale ; migration additive compatible Firestore et SQL | ACQUISE |
| D-24 | 16 catégories affichées issues de l'arbre /admin (jamais codées en dur) | OUVERTE 🚩 |
| Non-décision | « présence ≠ quantité suffisante » — font foi | confirmée |

## 5. Architecture, contrats, modèles

Modèles métier typés **indépendants du stockage** (la représentation — sections kitchen, tables 6a —
est une décision de stockage, jamais du modèle) ; validation par `validateRecipe` /
`validateIngredient` (core) ; compatibilité double Firestore/SQL exigée pour toute évolution de
modèle (sémantique identique : identifiants, relations, dates, valeurs absentes, suppressions
logiques, révisions).

## 6. Dépendances

- **Prérequis** : conception 5b validée ; décision § 7.1 au dossier.
- **Contrats partagés** : frigo à entrées (stock-entrees-sync), unités (`@/core/units`),
  substitutions (héritage générique/variante), moteur (matching variantes/génériques).
- **Débloque** : F2/F3 (modèles stabilisés), 6a (mapping), E2/E3 (affichage), F5 (E7 : étals éditoriaux).

## 7. Contraintes sécurité/performance

Aucune donnée externe sans relecture du core ; migration additive (AR-3) ; volumes et index
anticipés (requêtes « variantes de », recherche) — réalisables sur les deux fournisseurs.

## 8. Étapes de réalisation et critères d'acceptation

1. Arbitrage § 7.1 sur critères mesurables (matrice comparative au dossier).
2. Modèles stabilisés : lignes identifiées, `tag_ids`, axe `cuisine_type`, dates éditoriales (AR-3).
3. Validation : critère de la phase 5b — modèles + contrats du sync + maquettes validées.

## 9. Stratégie de tests

Tests de validation core (aller-retour sauvegarde JSON inclus), tests de contrat des représentations,
compatibilité double fournisseur (harnais commun).

## 10. Preuves disponibles

Conception : `analyses/v12-section-6-catalogue-recettes.md`, `v12-section-7-catalogue-ingredients.md`,
`analyses/plan17-section-10-phase-5b.md`. Aucune implémentation.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, non commencée. Ouverts : § 7.1 (décision à 5b), D-24 (liste/ordre des
catégories affichées). La décision § 7.1 conditionne le mapping 6a.

## 12. Provenance

V12 § 6–7 (analyses/ verbatim) · plan 17 § 10 (5b) · AR-3 · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
