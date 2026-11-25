# Catalogue & suggestions (E2)

> Ids : E2 (reorientation § 6), phases 7 · Famille : consultation-catalogue ·
> Statut : périmètre et arbitrages tracés ; **non commencé** ; favoris = section d'E2 (D-06) ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Écrans de liste du catalogue : mosaïque/déck recettes, filtres, suggestions du frigo par niveau,
**3ᵉ onglet Favoris** (D-06 — dans Recettes, barre basse inchangée), recherche. Dépend du moteur
pour l'affichage (codes de raisons, niveaux) et, pour les étals éditoriaux, de F5 (AR-4).

## 2. Contexte et état initial

Les listes existent (catalogue complet `/recettes` vs suggestions `/suggestions`, onglets
`RecipeListTabs`, filtres conservés entre écrans) ; les composants 2.6.2 sont livrés. Les maquettes
D4 (`suggestions.html`, `favoris.html`, `recettes-filtres-alt.html`) définissent la cible.

## 3. Fonctionnalités et règles métier

- Suggestions avec explications du moteur (niveaux, ingrédients disponibles/manquants/substitués,
  « sous réserve ») — wording D1 (font foi) : « Tous les ingrédients semblent présents — quantités
  à vérifier », CTA « Voir la recette ».
- Favoris : 3ᵉ onglet (D-06, APPLIQUÉE-D4 🚩 — ♥ favori ≠ ⤓ hors ligne : D-07 OUVERTE 🚩).
- Étal « frigo » exploité (règle moteur réelle) ; étals éditoriaux/tags/collections attendent F5 —
  **aucune simulation codée en dur** (AR-4).
- Listes longes : `usePagedList` + `ShowMore` (24/page), totaux justes ; recherche via
  `useSearchMatches` (renvoi `docs/solution/recherche.md`, `docs/solution/interface.md`).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D-06 | Favoris : 3ᵉ onglet dans Recettes | APPLIQUÉE-D4 🚩 |
| D-07 | ♥ favori ≠ ⤓ hors ligne ; pas de 3ᵉ notion « sauvegardé » | OUVERTE 🚩 |
| D-28 | R1/R2/R3/F1/F2/F3 retenus (R4, P2 non retenus) | ACQUISE (chef) |
| D-11 | Libellé « Semaine » (« Jom3a » / « الأسبوع ») — wording final des écrans | ACQUISE (D11) ; harmonisation des libellés dans les lots UI |
| AR-4 | Étal « frigo » réel ; éditorial attend F5 | ACQUISE |
| D-24 | 16 catégories affichées issues de l'arbre /admin | OUVERTE 🚩 |
| D-32 | Correspondance affichée, pas calculée | ACQUISE |

## 5. Architecture, contrats, modèles

Composants 2.6.2 (`RecipeCard` navigation par callback/état background, `RecipeListTabs`,
`EmptyState`), `MatchingBadge`/`MatchReason` (codes du core, traduction dans l'interface) ;
navigation découplée (jamais le routeur dans un composant générique) — renvoi
`docs/solution/interface.md`.

## 6. Dépendances

- **Prérequis** : 2.6.2 (fait) ; moteur pour l'affichage (codes/niveaux en vigueur) ; F5 pour les
  étals éditoriaux (démarrable sans F5 avec l'étal frigo seul — AR-4).
- **Contrats partagés** : tiers/niveaux d'affichage du moteur, catégories gérées, favoris.
- **Débloque** : E3 (fiche), harmonisation CTA.
- Ne change pas : filtres conservés entre écrans et entre les deux listes.

## 7. Contraintes sécurité/performance

Totaux justes sur la liste complète ; pas de rendu d'une liste entière d'un coup ; 375 px et
320 px ; aucune mention de la base dans les textes.

## 8. Étapes de réalisation et critères d'acceptation

Périmètre détaillé au dossier (maquettes D4 = référence) : onglet favoris, variantes de filtres
(recettes-filtres-alt), harmonisation des libellés D1. Critères : parité maquette/implémentation
vérifiée à 375/320 px, 4 langues, RTL ; totaux justes ; aucun libellé en dur.

## 9. Stratégie de tests

Tests d'affichage (9 tests D-32), tests de composants (44×44 favori), i18n 4 langues.

## 10. Preuves disponibles

Maquettes : `docs/reference-visuelle/site/` (suggestions, favoris, recettes-filtres-alt).
Aucune implémentation.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Périmètre tracé, non commencé. Ouverts : D-06/D-07 (à confirmer à l'implémentation), D-24, harmonisation
CTA. Dossier de préparation E2 à produire avant code.

## 12. Provenance

Reorientation § 6 E2 · D-06/D-07/D-28/D-32 (audit D4 § 11) · AR-4 · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
