
## Annexe — Plan 17 § 17 — Phases 11–13 (commerce)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 385-402), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 17. Phases 11–13 — Commerce : perspectives conditionnelles

**Ces phases restent des perspectives conditionnelles** : leur réalisation exige une
**décision explicite du chef** et un **besoin confirmé**, après une porte de passage
(succès validé des phases 6–10). **Aucun développement anticipé** : aucune collection,
aucun schéma, aucun stub codé au-delà de la documentation des frontières (V12 § 24).
Frontières V12 § 24 inchangées.

| Lot  | Objectif & périmètre                                                                                                                                                           | Dépend de              | Livrables & critères                                                   | Risques / décisions                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 11.1 | Écran de mapping ingrédient ↔ produit (saisi et validé humainement, jamais automatique) + catalogue produits/offres                                                            | validation du chef     | Critère : mapping 100 % validé avant suite                             | 🚩 porte de passage                                    |
| 11.2 | Fournisseurs, conditionnements, prix (instantanés)                                                                                                                             | 11.1                   | Critère : rien de commercial dans le catalogue culinaire ni les listes | —                                                      |
| 12.1 | Conversion `ShoppingList → Cart` : fonction pure, propositions validées ligne par ligne (conditionnements, surplus, substitutions proposées) — la liste n'est jamais remplacée | 11.2                   | Critère : **parcours A inchangé** (non-régression dédiée)              | 🚩 comportement de conversion                          |
| 12.2 | Paniers et commandes : instantané produit/offre/prix, statuts                                                                                                                  | 12.1                   | Critère : cohérence des instantanés                                    | 🚩 ports paiement/livraison (aucun fournisseur imposé) |
| 12.3 | Sous-commandes multi-vendeurs (ports, sans infrastructure imposée)                                                                                                             | 12.2                   | Critère : budget zéro respecté                                         | —                                                      |
| 13.1 | Restaurants & plats préparés : `Dish` ≠ `Recipe`, `FoodProvider`, `RestaurantLocation`, `Menu`, `DishOffer`                                                                    | 12.x                   | Critère : réutilisation du catalogue, jamais de doublon de recette     | —                                                      |
| 13.2 | Abonnements (si besoin confirmé) : sur la couture entitlement, **sans refondre la gestion des accès**                                                                          | 12.x + besoin confirmé | Critère : aucun type codé ; sources tracked                            | 🚩 confirmation du besoin                              |

