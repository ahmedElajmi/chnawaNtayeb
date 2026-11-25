
## Annexe — V12 § 5 — RBAC et back-office

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 157-199), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 5. RBAC et back-office

**Limites actuelles vérifiées** : permissions limitées à `can_publish`/`can_manage`, pas
de RBAC par module × action, pas de tableau de bord réel, pas de recherche globale, pas
de tableaux avec actions groupées, identité visuelle = celle du site.

**Modèle de permissions** : actions `access, read, search, create, update, delete,
publish, export, manage` par **ressource**, périmètres `all` / `own` / `list`
(modélisés, activés à la demande). **Règles de résolution écrites et testées** : union
des rôles, **refus par défaut** (ressource ou action inconnue = refus), `manage` ⊃
autres actions sur la même ressource **sauf la ressource `roles`** (jamais déduite),
supprimer un contenu publié exige `delete` **et** `publish`, `export` exigé
explicitement, scope `own` = `updated_by` vérifié **par item côté serveur** (y compris
actions groupées), scope `list` relu à chaque contrôle, **anti-élévation** (on ne peut
accorder que ce qu'on détient), cache invalidé par `permissions_revision`, journal de
tout changement et refus. **Dernier super administrateur** : comptage et écriture dans
la même transaction, **avec un verrouillage ou contrôle transactionnel adapté** — une
simple transaction `READ COMMITTED` ne garantit pas seule l'invariant quand deux
administrateurs tentent simultanément de supprimer ou rétrograder les deux derniers
super administrateurs ; l'invariant est vérifié par un **test de concurrence réel** de
cette double opération.

**Interface** (maquettes validées comme prototypes de direction, qualité visuelle
finalisée en phase 2) : identité graphique distincte du site ; navigation repliable,
contexte clair, **menu construit depuis les permissions effectives** ; recherche
globale ; tableaux (filtres, tri, pagination, actions groupées) ; **tableau de bord à
widgets** réorganisables/masquables par rôle, filtres temporels, liens vers les listes,
états vides et erreurs traduits ; **diagrammes sans dépendance lourde** — composants
internes ou bibliothèque légère, **sur décision d'une étude comparative** (performance,
poids frontend, accessibilité, maintenance — plan de réalisation § 20) alimentés
**uniquement par les agrégats** ; prévisualisation
publique dans les **vrais composants** (4 langues × RTL × thème × mode × 320/375/tablet/
desktop × profil × campagne simulée, onglet SEO, bandeau « non publiée ») ; **parité
fonctionnelle mobile/desktop** : toutes les capacités autorisées par les permissions
sont accessibles depuis les deux environnements — recettes et ingrédients, validation
et publication, comptes, rôles et permissions, règles du moteur, **laboratoire
complet**, organisation éditoriale, campagnes et présentation, statistiques,
publicité, historique et restaurations, **y compris les opérations complexes**
(comparaisons de configurations, restaurations) — la présentation s'adapte
(tableaux vs cartes, formulaires tactiles, navigation), **jamais les capacités** ; vérifié par les critères
d'acceptation de chaque phase (§ 25) ; **conception UX menée en parallèle de la
conception technique du moteur, jamais après**.

