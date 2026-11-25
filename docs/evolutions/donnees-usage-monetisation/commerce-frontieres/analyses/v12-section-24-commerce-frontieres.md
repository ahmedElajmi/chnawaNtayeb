
## Annexe — V12 § 24 — Commerce : frontières seulement

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 789-801), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 24. Commerce, abonnements, restaurants : frontières seulement

Aucune collection créée avant les phases 11–13, et après une porte de passage (succès
des phases 6–10). Règles de frontière : rien de commercial dans le catalogue culinaire
ni dans les listes de courses ; le mapping ingrédient ↔ produit est **saisi et validé
par l'administration, jamais automatique** ; la conversion `ShoppingList → Cart` est une
fonction pure qui produit des propositions validées ligne par ligne (conditionnements,
surplus, substitutions proposées) — la liste n'est jamais remplacée ; une commande
conserve un **instantané** produit/offre/prix ; sous-commandes multi-vendeurs possibles
(ports paiement/livraison, aucun fournisseur imposé) ; `Dish` ≠ `Recipe`, `FoodProvider`,
`RestaurantLocation`, `Menu`, `DishOffer`, `Order`, `Fulfillment`. Le parcours A
(courses autonomes) reste exactement le comportement actuel.

