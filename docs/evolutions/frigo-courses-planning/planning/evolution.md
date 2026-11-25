# Planning (E5)

> Ids : E5 (reorientation § 6), ex-lot 2.6.7 · Famille : frigo-courses-planning ·
> Statut : périmètre et arbitrages tracés ; **non commencé** ; P3 conditionnel (D6) ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Planning hebdomadaire de repas : modèle `DayPlan`, résumés, lien vers courses, règles P3
facultatives (Ramadan, cuisiner double, portions, note du jour).

## 2. Contexte et état initial

Le planning existe (résumé, courses) ; la maquette `planning.html` définit la cible. Le modèle
`DayPlan` est à concevoir au dossier.

## 3. Fonctionnalités et règles métier

- P1 : remplissage manuel du planning (prioritaire — « P1 seul livré si P3 non confirmé », D6).
- P3 (règles métier — D-29/D6) : remplissage automatique, Ramadan, cuisiner double, portions,
  note du jour — **dossier fonctionnel détaillé obligatoire avant intégration** ; montré en
  maquette, jamais considéré validé par la maquette (validation de maquette ≠ livraison produit).
- Résumés planning alimentés par le moteur (F3) ; ajout des courses depuis le planning.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D6 | Outils planning P3 comme règles métier — dossier détaillé obligatoire ; P1 prioritaire | OUVERTE (dossier exigé) |
| D-29 | Règles du planning P3 (Ramadan, double, portions, note) | OUVERTE 🚩 (rejoint D6) |
| D-09 | Remplissage automatique : non validée, le manuel suffit au MVP | OUVERTE 🚩 (rejoint D-29/D6) |
| D-28 | P1, P3 retenus (P2 non retenu) | ACQUISE |

## 5. Architecture, contrats, modèles

Modèle `DayPlan` (à concevoir au dossier) typé indépendant du stockage, compatible Firestore/SQL ;
planning et courses partagent le mécanisme d'ajout (`GroceryListChooserModal`).

## 6. Dépendances

- **Prérequis** : 2.6.2 (fait) ; moteur pour les résumés (F3) ; P3 après son dossier (D6).
- **Contrats partagés** : recettes, courses, frigo.
- **Débloque** : P3 (si validé) ; lien planning → courses.

## 7. Contraintes sécurité/performance

Mobile 375/320 px ; fenêtres via `ModalShell` ; i18n 4 langues + RTL ; totaux justes.

## 8. Étapes de réalisation et critères d'acceptation

1. P1 (manuel) — séquencé avec E4/E2 ; P3 soumis à dossier fonctionnel détaillé (D6) et arbitrage.
Critères : parité maquette, résumés honnêtes, aucune règle métier inventée depuis la maquette.

## 9. Stratégie de tests

Tests du modèle `DayPlan`, tests d'affichage des résumés, i18n.

## 10. Preuves disponibles

Maquettes D4 (planning + captures). Aucune implémentation E5.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Périmètre tracé, non commencé. Ouverts : D6/D-29/D-09 (dossier P3 exigé avant intégration).

## 12. Provenance

Reorientation § 6 E5 · D6/D-28/D-29 (registre dissous dans `docs/roadmap.md`). Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
