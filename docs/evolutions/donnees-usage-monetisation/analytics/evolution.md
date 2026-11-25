# Analytics (9.x)

> Ids : phase 9, F8 · Famille : donnees-usage-monetisation ·
> Statut : **conception validée** (V12 § 22) ; différée ; **non commencée** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Collecte, exploitation et **mesure des données d'usage** : événements groupés, agrégats,
minimisation. Ce n'est pas un chantier d'IA ; il sert le tri « populaire », les recommandations
différées et l'audience agrégée de la publicité (contrat documenté).

## 2. Contexte et état initial

Aucune collecte existante. Le benchmark des bibliothèques de **diagrammes** (poids/rendu, lot 2.1)
— utilisé pour les widgets du backoffice — est conservé dans
`docs/reference-visuelle/site/benchmark/` (**renvoi de provenance** : ce harnais n'est pas une
preuve d'analytics).

## 3. Fonctionnalités et règles métier

Événements groupés (pas d'écriture par événement), agrégats quotidiens, **minimisation**
(confidentialité vérifiée, aucune donnée personnelle dans les rapports), widgets backoffice
alimentés par les agrégats. Conception intégrale transférée verbatim :
`analyses/v12-section-22-analytics.md`.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| Conception § 22 (V12) | événements groupés + agrégats + minimisation | validée (conception) |
| Porte | après F4 (+ widgets), phase 9 | différée |

## 5. Architecture, contrats, modèles

Écritures groupées (budget d'écritures maîtrisé), agrégats en données (compatible Firestore/SQL,
sémantique identique), lecture par pages ; aucun SDK d'analytics tiers sans décision explicite.

## 6. Dépendances

- **Prérequis** : F4 (profils), permissions ; phase 9 différée.
- **Contrat partagé (avec publicite)** : audience agrégée, sans traces personnelles.
- **Débloque** : recommandations (différées), widgets « populaire ».

## 7. Contraintes sécurité/performance

Minimisation et confidentialité vérifiées ; aucune donnée personnelle dans les rapports ; coût en
lectures/écritures maîtrisé ; compatible SQL (agrégats relationnels).

## 8. Étapes de réalisation et critères d'acceptation

Selon V12 § 22 (annexe) : schéma d'événements, collecte groupée, agrégats nocturnes, widgets.
Critère de phase : agrégats quotidiens, confidentialité vérifiée.

## 9. Stratégie de tests

Tests d'agrégats (tables de vérité), tests de confidentialité, compatibilité double fournisseur.

## 10. Preuves disponibles

Aucune implémentation. Conception : `analyses/v12-section-22-analytics.md` (verbatim).

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, différée. Rien à arbitrer ici ; le chantier démarre après F4.

## 12. Provenance

V12 § 22 (annexe verbatim) · plan 17 § 16 (roadmap, phases 8–10) · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
