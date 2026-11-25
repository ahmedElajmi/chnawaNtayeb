
## Annexe — V12 § 6 — Catalogue des recettes

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 200-215), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE III — Catalogue culinaire

### 6. Catalogue des recettes

**Ne change pas** : workflow d'atelier, coûts en fourchette, slugs, SEO. **Change** :

1. Lignes d'ingrédient avec **id propre**, précision, préparation, lien aux étapes
   (§ 7.2) — plusieurs variantes du même générique = besoins indépendants.
2. `tag_ids` (tags éditoriaux : « recette de grand-mère »…).
3. `cuisine_type` (liste figée) glisse vers un axe ; le champ reste écrit un temps.
4. Éditeur renforcé : lignes indépendantes (réordonnancement, suppression), association
   ligne ↔ étapes, obligatoire/facultatif visible, choix générique/variante, **quantités
   conservées au changement de portions** (`scaleIngredients` garde chaque ligne,
   jamais fusionnées), détection de saisie non enregistrée ; l'indicateur de complétude
   **signale sans jamais bloquer** un brouillon.

