# Substitutions (F3 — volet substitutions)

> Ids : F3 (5c.1/5c.2 + 6b.3), phases 5c/6b · Famille : donnees-moteur ·
> Statut : conception validée ; **AR-2 ouvert** (persistance) ; corpus chef 🚩 ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Substitutions **réelles** : priorité, exceptions, héritage explicite, prudence, explicabilité.
Séparation stricte des trois notions : **hiérarchie ≠ compatibilité ≠ substitution** (V12 § 10).
La fiche (E3) affiche substitutions expliquées et, après F3, la partie **persistée**
(acceptée/refusée).

## 2. Contexte et état initial

Le moteur actuel propose des substitutions contextuelles sans état persistant : l'acceptation
(`accept {…}`) n'a pas de modèle côté client (lecture seule). La conception cible est écrite
(V12 § 10, transférée dans `moteur-matching/analyses/v12-partie-4-moteur.md`).

## 3. Fonctionnalités et règles métier

- Priorité : une exception précise prévaut sur une règle générale (critère testé : « mloukhia
  refusée » alors que la famille est compatible).
- Héritage explicite entre générique et variante ; profondeur bornée à 3 (configurable).
- Affichage : acceptée → « remplacé » ; remplaçants sans quantité → « à vérifier » ; refusée → à
  acheter ; **jamais « prête » si quantité incertaine** (D-33, conforme au chef).
- La correspondance affichée n'est jamais calculée à l'affichage (D-32).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| AR-2 | Persistance des substitutions acceptées/refusées : arbitrage **différé au dossier F3** (temporaire vs persistant, portée, annulation, multi-appareils, hors ligne) ; l'option (c) n'est pas retenue par avance | OUVERTE ⏳ — recoupe D-33 |
| D-33 | Affichage des substitutions conforme au chef | ACQUISE |
| D-32 | Correspondance affichée, pas calculée ; `STATES`/`SCENARIOS` dans `data.js` (maquette) | ACQUISE |
| D-03 | Ingrédients de base jamais comptés comme suffisants ; option « placard » | OUVERTE 🚩 (rejoint le moteur) |
| D-02 | Recette sans manquant mais quantité à vérifier : classement « Presque prête » + mention « ? à vérifier » recommandé | OUVERTE 🚩 |

## 5. Architecture, contrats, modèles

Règles de substitution dans `src/core` (compatibilités, exceptions, héritage) — scénarios du chef
stockés en base (`matching_scenarios`, jamais une liste codée en dur) ; la persistance de
l'acceptation (si AR-2 le retient) est un modèle indépendant du stockage, compatible Firestore et
SQL (sémantique identique, révisions/suppressions logiques conservées).

## 6. Dépendances

- **Prérequis** : F1, F2 (chaîne stricte) ; corpus du chef (5a) pour les bornes mesurées.
- **Contrats partagés** : hiérarchie de variantes (catalogue-modeles, décision 5b), conversions
  (F2), allocations (6b.4).
- **Débloque** : E3 complet (fiche-mode-cuisine : partie persistée après F3), E4, résumés planning.
- **6b.7b** : revalidation sync SQL avant transposition du modèle frigo (précision 6b).

## 7. Contraintes sécurité/performance

Index règle → recettes pour le recalcul incrémental ; budgets V12 § 15 ; aucune donnée externe
sans relecture par le core (scénarios importés validés).

## 8. Étapes de réalisation et critères d'acceptation

1. Corpus du chef constitué et mesuré (5a.1/5a.2) — **fourniture 🚩**.
2. Règles core (compatibilités + substitutions : priorité, exceptions, héritage, prudence) —
   critère : mloukhia refusée, exception précise prévaut.
3. Décision AR-2 au dossier, puis modèle de persistance si validé.
4. Intégration 6b.3 (étapes 3–4) avec tests du corpus de règles.

## 9. Stratégie de tests

Tests du corpus de règles ; tests de sémantique complète (6b.5 avec F3/allocation) ; double
exécution 6b.6 (zéro faux positif en strict **sur le corpus validé**).

## 10. Preuves disponibles

Aucune implémentation. Conception : `moteur-matching/analyses/v12-partie-4-moteur.md` (V12 § 10),
`plan17-section-11-phase-5c.md`.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, non commencée. Ouverts : AR-2 (arbitrage au dossier F3), corpus chef 🚩
(prérequis de réalisation, pas un arbitrage documentaire), D-02/D-03 (règles métier).

## 12. Provenance

V12 § 10 + plan 17 § 11 (analyses de moteur-matching) · AR-2 (reorientation) · D-32/D-33 (audit D4
§ 11, registre dissous dans `docs/roadmap.md`). Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
