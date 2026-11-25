
## Annexe — Plan 17 § 11 — Phase 5c (règles de matching, conception)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 253-262), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 11. Phase 5c — Règles de matching (conception)

| Lot  | Objectif & périmètre                                                                                                                                                                         | Existant                  | Dépend de  | Livrables & critères                                                                | Risques / décisions               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| 5c.1 | Compatibilités : modèle (demande ↔ réponse, contexte facultatif), champs guidés, index règle → ingrédients, alertes de règles obsolètes                                                      | C réglages                | 5b.2       | Spécification + tests prévus ; critère : validation admin explicite                 | —                                 |
| 5c.2 | Substitutions : priorité déterministe (recette > technique > catégorie > générale), exceptions, héritage explicite/désactivable, prudence sur recette non évaluée, conflits de même priorité | C `SubstitutionRule`      | 5c.1       | Spécification + tests (exemple mloukhia) ; critère : l'exception précise prévaut    | —                                 |
| 5c.3 | Conversions : exacte / approximative (densité déclarée, plafonnée) / impossible ; conversions de variantes ; jamais de poids standard pour « pièce »                                         | C `@/core/units`          | 5b.2       | Spécification + table de cas ; critère : approximative toujours marquée             | 🚩 densités à saisir avec le chef |
| 5c.4 | Paramétrage à deux niveaux : profils, garde-fous (jamais approximation→exact, jamais substitution non déclarée, bornes `resolveMatchingConfig`), registre des capacités                      | C `resolveMatchingConfig` | 5c.1–5c.3  | Spécification + garde-fous testés ; critère : bornes incompressibles                | —                                 |
| 5c.5 | **Sémantique des verdicts** : conditions déterministes et priorité (forme puis quantités), « sous réserve » indépendant, portions réduites (3 faisabilités, non-linéarité signalée)          | —                         | 5c.2, 5c.3 | Spécification + tests (exemples V12 § 12) ; critère : chaque verdict a sa condition | 🚩 validation de la sémantique    |

