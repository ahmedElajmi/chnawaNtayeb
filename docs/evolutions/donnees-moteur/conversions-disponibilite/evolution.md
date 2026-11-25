# Conversions & disponibilité (F2)

> Ids : F2 (≈ 5c.3 + 6b.2 + 6b.7b), phases 5c/6b · Famille : donnees-moteur ·
> Statut : conception validée, **implémentation non commencée** ; chaîne F1 → **F2** → F3 ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Règles de conversion des quantités (exact / approchée marquée / impossible), disponibilité réelle
des ingrédients et gestion des produits épuisés ; la « quantité vérifiée ». Rend le moteur honnête :
un verdict n'est jamais appuyé sur une quantité inconnue ou une conversion douteuse.

## 2. Contexte et état initial

Le moteur actuel ignore quantités et unités (frigo = ensemble d'ids) et ne connaît que 3 statuts.
La conception de remplacement est écrite (V12 § 11–12, transférée verbatim dans
`moteur-matching/analyses/v12-partie-4-moteur.md`) ; les modèles d'entrées du frigo sont livrés
(F1).

## 3. Fonctionnalités et règles métier

- Conversions **entre alias de la même famille** uniquement (g ↔ kg, ml ↔ l) ; deux choses comptées
  différentes (pièce, botte, c.à.s) ne se mélangent jamais — règle en vigueur `@/core/units`,
  renvoi `docs/solution/domaine.md` (§ units).
- Conversion **exacte / approximative marquée / impossible** — la réponse approximative apparaît
  explicitement dans le verdict, jamais silencieuse.
- Épuisement : une entrée `permanent` épuisée temporairement n'est pas « disponible ».
- « Quantité vérifiée » : présence seule = disponible sans quantité ; quantité connue = vérifiable ;
  jamais de quantité inventée par le scan.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| B-F1-2 (recoupe) | `permanent` réservé aux ingrédients de base et épices, liste contrôlée par le core | ACQUISE (stock-entrees-sync) |
| D2 | Bornes des niveaux : constantes configurables, bornes actuelles maintenues ; réévaluation seulement avec le corpus 5a | ACQUISE |
| Non-décision | « quantités jamais obligatoires » — font foi | confirmée |

## 5. Architecture, contrats, modèles

Règles de conversion derrière le registre d'unités (`@/core/units`, `UnitInfo` avec `kind`
obligatoire, /admin › Ingrédients › Unités) ; conversions consommées par l'allocation du moteur
(6b.4) ; les entrées du frigo (F1) fournissent quantités facultatives et DLC. Aucun changement de
schéma hors entrées (F1).

## 6. Dépendances

- **Prérequis** : F1 (entrées livrées) — chaîne stricte F1 → F2 → F3.
- **Contrats partagés** : registre d'unités, enveloppes d'entrées, mémoïsation des conversions
  (6b.2), index par ingrédient/variante.
- **Débloque** : F3 (allocation), E4 (frigo & courses UI honnêtes).
- **6b.7b** : la transposition du modèle frigo sur le fournisseur migré se fait **après** la
  revalidation du sync sur SQL (précision 6b — revalidation sync SQL **précède** la transposition).

## 7. Contraintes sécurité/performance

Conversions memoïsées hors boucle ; p95 en deçà des budgets intermédiaires (6b.2) ; aucune
dérive vers un moteur SQL spécifique (règles portables Firestore/SQL).

## 8. Étapes de réalisation et critères d'acceptation

1. Règles core de conversion/disponibilité, testées (tables de vérité).
2. Intégration 6b.2 (étapes 0–2 : filtres, exact, précision, mémoïsation).
Critères : conversion impossible jamais silencieuse ; « sous réserve » jamais appuyé sur une
quantité inconnue ; p95 dans les budgets.

## 9. Stratégie de tests

Tables de vérité (unités × familles), tests de verdict, tests anti-double-consommation (avec F3),
harnais de mesure (5a.3).

## 10. Preuves disponibles

Aucune implémentation. Conception : `moteur-matching/analyses/v12-partie-4-moteur.md` (V12 § 11–12),
`plan17-section-11-phase-5c.md`.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, non commencée. Démarre après F1 (fait) — F2 est la fondations suivante. Bornes
finales à réévaluer avec le corpus 5a (D2).

## 12. Provenance

V12 § 11–12 (analyses de moteur-matching) · plan 17 § 11 (5c) · reorientation F2 · registre
dissous dans `docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
