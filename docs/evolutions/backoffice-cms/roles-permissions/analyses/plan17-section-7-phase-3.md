
## Annexe — Plan 17 § 7 — Phase 3 (rôles et permissions)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 215-224), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 7. Phase 3 — Rôles et permissions

| Lot | Objectif & périmètre                                                                                                                                                                                             | Existant                 | Dépend de | Livrables & critères                                                                   | Risques / décisions  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | -------------------------------------------------------------------------------------- | -------------------- |
| 3.1 | `src/core/permissions` : résolution, union, refus par défaut, anti-élévation, scopes (`all`/`own`/`list` par item côté serveur)                                                                                  | —                        | 2.3       | Tests unitaires complets (chaque règle de résolution) ; critère : cas inconnus refusés | —                    |
| 3.2 | Vérification serveur systématique + journal des changements **et refus** + invalidation par `permissions_revision` + **dernier super admin** (verrouillage + test de concurrence de la double suppression)       | M `identity.ts`          | 3.1       | Tests de concurrence ; critère : invariant tenu en double opération                    | —                    |
| 3.3 | Écran Équipe & rôles + fiche des droits effectifs (permission, rôle à l'origine, périmètre, historique) + confirmations des actions sensibles — implémenté **sur les fondations effectivement réalisées en 2.8** | M pages admin existantes | 3.2 + 2.8 | Page branchée ; critère : toute action tracée, parité mobile                           | —                    |
| 3.4 | Menu et widgets branchés sur les permissions effectives (fondations implémentées en 2.8)                                                                                                                         | M 2.8                    | 3.2 + 2.8 | Critère : menu = intersection des permissions                                          | —                    |
| 3.5 | Migration des rôles existants vers le nouveau modèle + **retrait de `can_publish`/`can_manage`** après usage vérifié                                                                                             | S anciens champs         | 3.2       | Migration réversible ; critère : aucune permission perdue (comparaison avant/après)    | 🚩 bascule des rôles |

