# Budget — coût des recettes (B1–B6, D14)

> Ids : capacité « Budget » (plan 17 § 24), phases après 6a · Famille : consultation-catalogue ·
> Statut : **principe validé (D14)** ; exécution après 6a ; périmètre arbitré avant réalisation ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Estimation et exploitation du **coût réel** des recettes à partir des prix du catalogue (B1–B6) :
coût d'une recette, coût d'un menu, pilotage par le chef. Conception intégrale transférée verbatim
dans `analyses/plan17-section-24-budget.md` (plan 17 § 24).

## 2. Contexte et état initial

Les **prix et coûts en fourchette** sont déjà en vigueur (`src/core/catalog/pricing.ts`) :
`recipeCostRange` via `getRecipeCost`/`useRecipeCost`, coût des courses manquantes = `PriceRange`,
affichage via `formatPriceRange` (renvoi `docs/solution/domaine.md`). Le § 24 (B1–B6) étend la
capacité (seuils, activation, régime, mise à jour groupée des prix).

## 3. Fonctionnalités et règles métier

B1–B6 détaillés dans l'annexe transférée (seuils, activation, régime, paramètres des rubriques,
prix à date d'actualisation et fraîcheur, mise à jour groupée — D5 : éditeurs). Rien du § 24 n'est
implémenté : la conception est la référence, son exécution suit 6a.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D14 | Section Budget : principe validé, exécution après 6a, périmètre arbitré avant réalisation | ACQUISE |
| D5 | Gestion des prix (fourchettes, unité de référence, date d'actualisation, fraîcheur, mise à jour groupée) — implémentation B4 (si § 24 validé) | ACQUISE (conception) |

## 5. Architecture, contrats, modèles

Calculs de coût dans le core (`pricing.ts` en vigueur), extension B1–B6 derrière les mêmes principes
(pure, injectée, compatible Firestore/SQL) ; paramètres des rubriques dans les réglages backoffice.

## 6. Dépendances

- **Prérequis** : 6a (prix migrés et fiables) ; périmètre arbitré (D14) avant réalisation.
- **Contrats partagés** : prix d'ingrédients (catalogue), courses (coût des manquants).
- **Débloque** : F8 (budget dans la carte fonctionnelle), widgets backoffice éventuels.

## 7. Contraintes sécurité/performance

Coûts calculés sans lecture complète du catalogue (totaux justes) ; fourchettes jamais affichées
brutes ; mobile 375/320 px.

## 8. Étapes de réalisation et critères d'acceptation

Selon § 24 (annexe) : B1–B6 séquencés, périmètre arbitré au préalable, après 6a. Critères : cohérence
des fourchettes, non-régression de l'affichage actuel.

## 9. Stratégie de tests

Tests du core (calculs), tests d'affichage (`formatPriceRange`), non-régression des coûts actuels.

## 10. Preuves disponibles

En vigueur : pricing fourchette (code commité, tests). Conception § 24 : `analyses/plan17-section-24-budget.md`.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Prix/coûts en fourchette : en vigueur (niveau : fonctionnel sur branche de travail, code commité
local). B1–B6 : principe validé, non commencés. Ouvert : périmètre exact à arbitrer au dossier.

## 12. Provenance

Plan 17 § 24 (annexe verbatim) · D14/D5 (registre dissous dans `docs/roadmap.md`). Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
