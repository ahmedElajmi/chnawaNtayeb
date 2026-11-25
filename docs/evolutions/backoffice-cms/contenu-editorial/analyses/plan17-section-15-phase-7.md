
## Annexe — Plan 17 § 17? Non — § 15 : Phase 7 (classification, éditorial, campagnes)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 360-369), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 15. Phase 7 — Classification, organisation éditoriale, présentation, campagnes

| Lot | Objectif & périmètre                                                                                                                                        | Existant                   | Dépend de | Livrables & critères                                                 | Risques / décisions            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------- | -------------------------------------------------------------------- | ------------------------------ |
| 7.1 | Axes et tags : racines d'arbres déclarées axes (`presentation`, `selection`), tags + `tag_ids`, migration `cuisine_type` vers un axe (champ écrit un temps) | C `categories`, M recettes | 6a.1      | Critère : zéro migration destructive des documents ; pages servées   | —                              |
| 7.2 | `RecipeSelection` : critères bornés, exécution adaptative (requête paginée / instantané / mémoire avec garde-fous), invalidation par signatures             | —                          | 7.1       | Critère : instantané jamais source de vérité ; totaux justes         | —                              |
| 7.3 | Groupes éditoriaux + collections : arborescence, MANUAL/DYNAMIC/HYBRID, contrôle d'affichage par nœud, slugs adressables ; écrans back-office (D6)          | —                          | 7.2 + D6  | Critère : pages de groupe et collections servées depuis instantanés  | —                              |
| 7.4 | Campagnes + sections d'affichage + éditeur de home (glisser-déposer, prévisualisation par profil), règles de visibilité (`off_period`)                      | C accueil actuel           | 7.3, 4.1  | Critère : l'accueil actuel reste le repli tant que rien n'est publié | 🚩 première campagne (Ramadan) |
| 7.5 | Prévisualisation publique complète : 4 langues × RTL × thèmes × modes × 320/375/tablet/desktop × profils × campagne simulée + onglet SEO                    | M 2.2                      | 7.4       | Critère : checklist de prévisualisation au vert                      | —                              |

