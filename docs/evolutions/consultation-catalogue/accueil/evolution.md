---
domaine: accueil
niveau: dossier d'évolution (2)
nature: dossier.md — lot 2.6.3 (E1) en attente de validation (AR-6)
statut: consolidé Étape B — sources transférées puis supprimées au nettoyage autorisé
autorité: lot-2.6.3-home-page-dossier.md (v2, corrections A–F) + registre des décisions (AR-6, D-01)
---

# K-3bis — Accueil (lot 2.6.3 / E1) : dossier consolidé

> **Séparé des lots livrés** (consolidés dans `solution/interface.md` § Socle) : le lot 2.6.3 n'est **ni validé
> fonctionnellement ni implémenté**. Rangé ici conformément
> à la règle « jamais regroupé avec les lots livrés » (livrable v2.3 § 7, K-3).

## 1. Statut

- **AR-6 (ACQUIS)** : E1 en **préparation documentaire uniquement** — dossier **v2 corrigé et prêt
  pour présentation** (corrections A–F du chef intégrées) ; **validation fonctionnelle encore
  attendue** ; même après validation du dossier, le développement nécessitera une **autorisation
  distincte et explicite**. Aucun commit.
- Base de conception validée : **D-01** (composition C « personnel d'abord, éditorial ensuite »,
  6 états — validation de maquette ≠ livraison produit) · D-25 (carrousel `.rail`) · D-28
  (conventions recettes/filtres/planning). Maquette de référence : **`accueil-c.html`** (représentant
  de la composition C dans la référence D4) ; les accueils A/B restent **variantes historiques non
  retenues** (closes par D-01/D-30).

## 2. Corrections A–F intégrées (v2)

| # | Correction |
|---|------------|
| A | Distinction état initial / chargement |
| B | **Retrait de « Nouveau du chef »** tant qu'aucune règle fiable n'existe (recoupe AR-3 : jamais de nouveauté calculée sur une date technique — `revision` n'est pas une date éditoriale) |
| C | **Retrait des emplacements publicitaires du lot** |
| D | État « frigo rempli sans suggestion » |
| E | Stabilité visuelle au chargement |
| F | Les six états D4 explicités comme **états de machine** |

## 3. Règles permanentes rappelées par le dossier

- Les **données fictives de D4** restent des références UX/UI, **jamais des règles métier
  automatiquement validées**.
- Aucune section « Nouveau du chef » sans dates éditoriales fiables (F5, AR-3) ni sélection
  éditoriale réelle.
- L'implémentation future devra respecter la composition C validée (D-01) et les six états,
  avec preuve de commit pour tout statut « livré ».

## 4. Sources

`lot-2.6.3-home-page-dossier.md` (v2, transféré dans `analyses/`, Étape C) ·
reorientation (AR-1…AR-6) → transférée dans `roadmap.md` (annexes) · `audit.html` →
`docs/reference-visuelle/site/audit.html` § 11 (D-01, D-25, D-28) · registre → `roadmap.md` § 6 bis.
