
## Annexe — V12 § 4 — Indépendance du fournisseur de données (bannière SUPPLANTÉ C1 incluse)

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 109-156), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE II — Fondations techniques

### 4. Indépendance du fournisseur de données

> ⚠️ **SUPPLANTÉ (arbitrage C1, session validée — non archivée sur disque, DT-05)** : la
> **réalisation** a divergé de cette section — l'adaptateur SQL livré est **générique** (une table
> par collection du registre, `ensureSchema`, harnais de contrat commun), pas le SQL hybride « par
> domaine » décrit ici, qui reste la **cible de production** (arbitrage n° 5 du dossier 1.2,
> réalisée à la bascule). Les mécanismes réellement en vigueur (curseurs, rejeu ≤ 3,
> `DATA_STORE`, ports) font foi dans `docs/evolutions/bascule-fournisseur/dossier.md` (K-2) et
> dans les lots 1.2–1.4 clôturés. Texte conservé tel quel ci-dessous (aucune information perdue).

**État vérifié** : le client n'a **aucun** SDK Firebase (gardé par un test
d'architecture), sans Firebase Auth (comptes `users` + `auth`, sessions signées par le
serveur) ; registre serveur des collections avec niveaux d'accès (`public`/`admin`/
`server`) ; `DataStore` avec implémentation SQL (Knex : Postgres, MySQL, SQL Server,
SQLite) existante, non branchée ; restants à découper : `server/app.ts`,
`server/seo.ts`, `server/storage/identity.ts`, `server/firebaseAdmin.ts`, `deploy:rules`.

- **Contrats par domaine** (`RecipeRepository`, `IngredientRepository`,
  `UserRepository`, `EditorialRepository`, `AdRepository`, `AnalyticsRepository`…) :
  `search(criteria) → PaginatedResult` avec **curseur opaque**, `count(criteria)` pour
  les totaux justes, **contrat transactionnel** `runInTransaction` (`READ COMMITTED`,
  classe `conflict` distincte, rejoue ≤ 3 pour opérations pures, rollback total).
  Services applicatifs pour les opérations multi-repositories (la création atomique de
  compte se transpose telle quelle).
- **SQL hybride, défini entité par entité** : relationnel strict pour `users`, `admins`,
  `roles`, entitlements, taxonomies, relations, événements ; hybride pour recettes et
  ingrédients (colonnes typées pour statut, temps, coûts, noms localisés — JSON pour
  étapes/ingrédients relus par les parsers inchangés) ; JSON + colonnes de pilotage pour
  groupes/campagnes/sections ; **jamais « tout en JSON dans SQL »**.
- **Deux curseurs** : sync `(revision, id)` (départage par id, journal) et listes
  publiques `(clé_de_tri, id)` (ordre stable dans une page).
- **Tests au-delà de la parité fonctionnelle** : concurrence, contraintes, migrations de
  schéma, performance sur base de référence (100 000 recettes).
- **Migration en 7 étapes** : sauvegarde complète → validation volumes/relations →
  import test + comparaison → **test de restauration obligatoire** → bascule lecture
  puis écriture (Firestore maintenu en lecture seule) → retour arrière seuillé →
  clôture après une semaine d'exploitation comparée.
- **Séquençage anti-double-migration** : la phase 1 valide les **contrats, adaptateurs
  et mécanismes SQL** (tests de contrat sur SQLite et Postgres, transactions,
  curseurs, concurrence) et ne migre que les domaines **stables** (identité, comptes,
  audit) ; la **migration définitive des données métier** (recettes, ingrédients,
  frigo) n'est engagée **qu'une fois les modèles cibles stabilisés** (fin de 5b) et
  intervient en phase 6a, avec le changement de modèles — **éviter deux migrations
  successives des mêmes données**. Firestore reste la source de vérité jusqu'à la
  bascule de la phase 6a.

