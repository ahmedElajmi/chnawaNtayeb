# Fiche recette & mode cuisine (E3)

> Ids : E3 (reorientation § 6), ex-lot 2.6.5 · Famille : consultation-catalogue ·
> Statut : périmètre et arbitrages tracés ; **non commencé** ; partie persistée après F3 (AR-2) ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Fiche recette avec lignes expliquées et **mode cuisine** (minuteur, états, grandes polices) ;
affichage des substitutions (acceptée → « remplacé », remplaçants sans quantité → « à vérifier »,
refusée → à acheter) et de la partie persistée une fois F3 livré.

## 2. Contexte et état initial

La fiche actuelle existe (mise en page, coût en fourchette via `useRecipeCost`, médias) ; les
maquettes D4 (`recette.html`, `mode-cuisine.html`, `mode-cuisine-bsissa`) définissent la cible.
La correspondance affichée n'est jamais calculée à l'affichage (D-32).

## 3. Fonctionnalités et règles métier

- Fiche : lignes expliquées (disponible / manquant / substitué / « sous réserve »), verdicts avec
  ajustement de portions ; **aucune interface publique du moteur développée avant validation du
  paquet D2** (design : « Moteur rendu visible »).
- Mode cuisine : minuteur, états, commandes à une main,RTL — maquettes D4.
- Coût en fourchette toujours via `formatPriceRange` (en vigueur).
- Substitutions : conventions D-33 (font foi) ; persistance après AR-2.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D-33 | Conventions d'affichage des substitutions | ACQUISE |
| D-32 | Correspondance affichée, pas calculée | ACQUISE |
| AR-2 | Persistance des substitutions acceptées/refusées | OUVERTE ⏳ (dossier F3) |
| D-11 | Harmonisation des libellés (D1 font foi) | ACQUISE |

## 5. Architecture, contrats, modèles

Composants 2.6.2 + `MatchingBadge`/`MatchReason` ; minuteur et états du mode cuisine sans logique
métier (l'affichage consomme les verdicts du moteur, jamais recalculés) ; liens média vérifiés
(`validateRecipe`, aperçu en direct).

## 6. Dépendances

- **Prérequis** : 2.6.2 (fait) ; F3 pour la partie persistée (affichage des substitutions
  explicables dès les bornes actuelles).
- **Contrats partagés** : tiers/niveaux, substitutions (volet dédié `../../donnees-moteur/substitutions/`),
  coût des recettes.
- **Débloque** : harmonisation CTA de la fiche ; E4 (retours vers courses).

## 7. Contraintes sécurité/performance

Mobile 375/320 px ; mode cuisine lisible à bras (grande typo) ; aucune logique métier dans les
composants ; i18n 4 langues + RTL.

## 8. Étapes de réalisation et critères d'acceptation

Périmètre détaillé au dossier (maquettes D4 = référence). Critères : parité maquette, verdicts
jamais réinventés côté affichage, substitutions conformes D-33, RTL vérifié.

## 9. Stratégie de tests

Tests d'affichage (9 tests D-32), i18n, tests de composants.

## 10. Preuves disponibles

Maquettes : `docs/reference-visuelle/site/` (recette, mode-cuisine, captures). Aucune implémentation.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Périmètre tracé, non commencé. Ouvert : AR-2 (persistance — dossier F3). Dossier de préparation
E3 à produire avant code.

## 12. Provenance

Reorientation § 6 E3 · lot 2.6.5 (périmètre) · D-32/D-33 · registre dissous dans `docs/roadmap.md`.
Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
