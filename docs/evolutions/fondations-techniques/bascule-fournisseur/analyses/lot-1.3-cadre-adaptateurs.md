# Lot 1.3 — Cadre d'adaptateurs : dossier de réalisation (à examiner avant tout développement)

**Statut** : **validé par le chef — lot 1.3 clôturé** (décisions : dossier validé + 4 micro-arbitrages acceptés ; consignes : scripts de développement passés à `DATA_STORE=memory`, comportement de repli du premier chargement SEO conservé et documenté)
**Lot** : 1.3 (phase 1, plan § 5 — « Cadre d'adaptateurs ») · **Dépend de** : 1.2 (clôturé, commit `67cce86`)
**Périmètre** : présentation et examen uniquement. Ce dossier suit la méthode du lot 1.1 : chaque affirmation cite son evidence (fichier + ligne vérifiés dans le dépôt).

---

## 1. Synthèse

- **Ce qui existe déjà** (hérité des lots 1.1–1.2) : l'adaptateur SQL générique Knex (`sqlStore.ts`, 389 l., une table par collection du registre + `ensureSchema` idempotent, index `(revision, id)`), l'implémentation mémoire de référence, le harnais de contrat partagé (`contract.ts`, `describeDataStore`, 407 l.), le pilote relationnel du domaine Identity (`relationalPilot.ts`, harnais uniquement) et le benchmark de fumée. **Tests de contrat déjà verts sur memory + SQLite** (clôture 1.2).
- **Ce qui manque** (cœur du lot 1.3) : trois coutures Firestore à couper et une à garder —
  1. `server/seo.ts` (637 l.) **lit Firestore directement** et **duplique la synchronisation incrémentale** (observation 4 de la cartographie 1.1) ;
  2. `verifyEmployeeRights` **lit `admins/{uid}` directement** via le SDK dans `firebaseAdmin.ts`, consommé par `identity.ts` hors du contrat ;
  3. la **sélection du fournisseur** dans `server/app.ts` est aujourd'hui implicite (`LOCAL_MEMORY_STORE=1` ou présence du compte de service), pas la variable unique `DATA_STORE=firestore|sql|memory` validée en 1.1 § 8.
- **Critère mesurable du plan** : « zéro import du SDK Firebase hors `firebaseAdmin.ts` + `firestoreStore.ts` (recherche + test) » — **une seule violation existe aujourd'hui** : `server/seo.ts:10` importe `firebase-admin/firestore`. C'est le filet principal du lot.
- **Aucune décision 🚩 n'est prévue par le plan pour ce lot** ; le dossier propose 4 micro-arbitrages d'implémentation (§ 7) à valider en même temps que le dossier.
- **Ce que le lot 1.3 ne fait pas** : aucune migration de production, aucune implémentation relationnelle par domaine (reportée à la bascule — arbitrage n° 5 du dossier 1.2), aucun moteur SQL au-delà de SQLite, aucune évolution de modèle, aucun changement côté client.

## 2. Rappel du lot (plan § 5, verbatim condensé)

> **Cadre d'adaptateurs** : adaptateur SQL (Knex) **générique** (une table par collection du registre — `ensureSchema`), couvrant **toutes les collections sans répartition par domaine** (un seul fournisseur actif) + implémentations en mémoire de référence + harnais réutilisable de tests de contrat (memory / SQLite / extensible à tout moteur SQL sans modifier le métier) ; branchement uniquement dans `src/app/container.ts` et `server/app.ts` ; **résorption des derniers couplages Firestore** : `seo.ts` branché sur son port, `verifyEmployeeRights` via le contrat, sélection centrale du fournisseur dans `server/app.ts`. **Statut** : harnais de contrat et environnement de test — la production SQL visera l'implémentation relationnelle par domaine (arbitrage n° 5 du dossier 1.2).
> **Critères** : tests de contrat passés sur **memory et SQLite** (+ tout moteur ajouté via le harnais) ; écriture complète sans fusion, pas de `undefined` ; **zéro import du SDK Firebase hors `firebaseAdmin.ts` + `firestoreStore.ts`** (recherche + test).

## 3. État vérifié du code — tableau d'écart

| Composant                                     | Existant | État vérifié (evidence)                                                                                                                                                                                                                                                                                        | Reste à faire en 1.3                                                                                                   |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Adaptateur SQL générique (`sqlStore.ts`)      | C        | Knex, une table par collection du registre, `ensureSchema` idempotent couvrant les 22 collections, index `(revision, id)` (`sqlStore.ts:375–389`) ; en-tête « NOT wired yet » ; testé sur SQLite (`sqlStore.test.ts` → `describeDataStore`) ; jamais branché en production (artefact de test — arbitrage n° 5) | Rien (consolidé en 1.2) — le branchement local de test via `DATA_STORE=sql` est le seul ajouter                        |
| Mémoire de référence (`memoryDataStore.ts`)   | C        | Harnais vert ; **refusée en production** (garde `app.ts:56–61`)                                                                                                                                                                                                                                                | Rien — la garde est réécrite telle quelle dans la nouvelle sélection                                                   |
| Harnais de contrat (`contract.ts`)            | C        | `describeDataStore` partagé, passé par memory, SQLite et le pilote relationnel ; suite Firestore émulateur = les 22 tests ignorés de 1.2, réserve pour la répétition générale 1.5                                                                                                                              | Rien — étendre seulement si un comportement de branchement le justifie                                                 |
| Validation « écriture complète sans fusion »  | C        | `validation.ts` (`stripUndefined`, validation récursive du JSON, enveloppe `commit` ≤ 10 opérations) appliquée par les trois adaptateurs                                                                                                                                                                       | Rien                                                                                                                   |
| Pilote relationnel (`relationalPilot.ts`)     | C        | Domaine Identity (`users`, `auth`, `email_index`) en colonnes typées + tables de liaison, harnais uniquement (`relationalPilot.test.ts`)                                                                                                                                                                       | Rien — il démontre la voie de la production SQL, il n'est pas branché                                                  |
| Sélection du fournisseur (`server/app.ts:52`) | M        | Aujourd'hui : `LOCAL_MEMORY_STORE=1` XOR `getAdminFirestore()` non nul → Firestore ; sinon `dataStore = null` (endpoints dégradés) ; **pas de `DATA_STORE`** (recherche : zéro occurrence)                                                                                                                     | **C1** — variable unique `DATA_STORE=firestore\|sql\|memory`, décision validée 1.1 § 8, un seul fournisseur actif      |
| `server/seo.ts`                               | M        | **Import SDK direct** (`seo.ts:10`) + lectures `db.collection()` sur `recipes`, `ingredients`, `ingredient_categories` (`seo.ts:65,92`) + copie incrémentale maison avec son propre suivi de révision (`refresh`, `seo.ts:57–83`) + cache 60 s                                                                 | **C2** — brancher sur un port de lecture alimenté par le contrat ; supprimer la synchronisation dupliquée              |
| Droits employé (`firebaseAdmin.ts:56`)        | M        | `verifyEmployeeRights(uid)` lit `admins/{uid}` via le SDK ; consommé par `identity.ts:3` (import direct de `../firebaseAdmin`)                                                                                                                                                                                 | **C3** — port `EmployeeRightsVerifier` implémenté via le contrat ; `identity.ts` n'importe plus `firebaseAdmin`        |
| Garde « zéro SDK Firebase »                   | —        | **Inexistante** : seul `src/core/architecture.test.ts` garde le cœur et l'infrastructure cliente ; rien côté `server/`                                                                                                                                                                                         | **C4** — garde statique (recherche + test) : `firebase-admin` uniquement dans `firebaseAdmin.ts` + `firestoreStore.ts` |
| Côté client (`src/app/container.ts`)          | C        | Aucun SDK, tout passe par les ports et l'HTTP ; commentaire `container.ts:68` (« To change backend … swap them here ») ; garde d'architecture existante                                                                                                                                                        | Rien — vérification seulement (aucun écran, aucune donnée cliente modifiée)                                            |

## 4. Conception proposée — cinq chantiers

### C1 — Sélection centrale du fournisseur (`server/app.ts`)

- **Variable unique** `DATA_STORE=firestore|sql|memory` (architecture validée 1.1 § 8 : un seul fournisseur actif, aucune répartition, aucun routeur) ; défaut `firestore`.
- `memory` : refusée en production — la garde existante (`app.ts:56–61`) est conservée à l'identique, le message d'erreur compris.
- `sql` : **mode local/test uniquement** à ce stade — crée l'instance Knex depuis la configuration d'environnement, appelle `ensureSchema` au démarrage (idempotent, `sqlStore.ts:375`), passe le store au contrat. Aucune écriture en production : la bascule réelle reste l'opération globale validée en 1.5 puis soumise à décision explicite.
- `firestore` : comportement actuel inchangé, y compris le cas « pas de compte de service » (`dataStore = null` → endpoints dégradés, `countriesProvider` renvoie une liste vide) — ce comportement observable est **préservé**.
- Le câblage des routes (`.use(...)`) ne change pas : toutes les routes reçoivent déjà `DataStore`.

### C2 — Résorption du couplage de `seo.ts` : port `PublishedCatalogSource`

- **Port de lecture seule** (côté serveur — le port vit dans `server/storage/`, pas dans `src/application` qui est l'application cliente) : `changes(name, since, limit)` borné aux **trois collections publiques** (`recipes`, `ingredients`, `ingredient_categories`). Port **étroit** : aucune écriture exposée au rendu SEO (recommandation, § 7-1).
- Le lecteur du catalogue consomme le contrat : boucle de pagination par le curseur composite `(revision, id)` (frontière inclusive entre polls, consommation **idempotente** — exigence 1.2), marqueurs de suppression appliqués via `removedIds`, puis parseurs du cœur inchangés (`parseStoredRecipes`, `parseStoredIngredients`, `parseStoredCategories`) et `withBuiltInCategories` / repli ingrédients intégrés conservés.
- **La copie incrémentale maison de `seo.ts` (`refresh`, son suivi de révision Firestore en Timestamp) est supprimée** : le contrat est désormais la seule autorité de pagination (1.2). Le rendu des pages servées, le sitemap et le cache 60 s (`REFRESH_MS`, `seo.ts:36`) restent identiques.
- Le comportement « Firestore indisponible » (repli sur le cache existant, `seo.ts:96–99`) est réécrit tel quel sur l'erreur du contrat.
- Les tests existants (`seo.test.ts`) doivent rester verts **sans modification de leurs attentes** — c'est le critère de non-régression du rendu.

### C3 — Résorption du couplage des droits employé : port `EmployeeRightsVerifier`

- **Port** : `(uid: string) => Promise<{ can_publish: unknown; can_manage: unknown } | null>` — même forme de retour qu'aujourd'hui (`firebaseAdmin.ts:56–63`), aucune sémantique nouvelle.
- **Adaptateur** au-dessus du contrat : `get('admins', uid)` ; la lecture renvoie `null` si le document est absent — comportement identique à l'actuel (`member.exists ? data : null`).
- `identity.ts` n'importe plus `../firebaseAdmin` : `resolveIdentity` devient une **fabrique** paramétrée par le vérificateur, câblée une seule fois dans `server/app.ts` ; les trois consommateurs (`dataRoutes`, `adminDataRoutes`, `auth/routes`) reçoivent le résolveur déjà câblé, leurs signatures publiques restent stables.
- Résultat observable attendu : autorisations strictement identiques (super admin, employé, visiteur) — vérifié par les tests de routes existants, sans en changer les attentes.
- `firebaseAdmin.ts` garde exactement son rôle d'après 1.1 § 5 : **le seul fichier (avec `firestoreStore.ts`) qui connaît le SDK** — initialisation + compte de service ; il ne porte plus d'accès de données.

### C4 — Garde statique « zéro SDK Firebase » (critère du plan : recherche + test)

- **Recherche** initiale (fait, § 3) : imports `firebase-admin` hors fichiers autorisés = `server/seo.ts` uniquement. Après C2 : **zéro**.
- **Test** de garde (style `architecture.test.ts`) : balaie les imports de `server/**` en production de code et échoue si `firebase-admin/*` ou `firebase/*` apparaît hors `server/firebaseAdmin.ts` et `server/storage/firestoreStore.ts`. Portée des **fichiers de test** : micro-arbitrage (§ 7-4) — la suite émulateur (`firestoreStore.test.ts`) importe le SDK par construction.
- La garde documente la règle permanente du plan (1.3) et prépare le retrait total du SDK à la bascule (ex-lot 1.6, fusionné au nettoyage post-bascule).

### C5 — Cadre d'adaptateurs consolidé (le « statut » du lot)

- Le **cadre** livré en 1.3 est : harnais de contrat réutilisable + mémoire de référence + adaptateur SQLite + garde statique + sélection centrale — **l'environnement de test de tout futur adaptateur**, pas une production SQL.
- La **production SQL** reste l'implémentation **relationnelle par domaine** (arbitrage n° 5, dossier 1.2) : transformation à la bascule, jamais les tables uniformes de `sqlStore.ts` — rappel affiché dans le dossier et dans l'en-tête du fichier (déjà présent).
- Tout moteur SQL futur passe le même harnais **avant** d'être déclaré compatible (règle permanente `CLAUDE.md` § 8) : la seule opération nécessaire est un nouveau fichier de test appelant `describeDataStore` — **aucune modification du métier**, démontré par SQLite.

## 5. Analyse de non-régression explicite

| Fonctionnalité existante impactée              | Risque de régression                                                                               | Tests nécessaires (sans changer leurs attentes)                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Pages servées SEO + sitemap (rendu public)     | Le lecteur du catalogue change d'implémentation : curseur, marqueurs, repli                        | `seo.test.ts` au vert sans modification ; vérification manuelle du rendu d'une fiche recette et du sitemap   |
| Autorisations des endpoints (3 identités)      | Le chemin de vérification des droits change de fournisseur                                         | Tests de `dataRoutes` / `adminDataRoutes` / `auth` au vert ; cas employé `can_publish` / `can_manage` / null |
| Démarrage du serveur                           | La sélection du store change (variable unique) ; cas « pas de compte de service » et garde mémoire | Test de fabrique : `DATA_STORE` absent → Firestore ; `memory` en production → refus ; `sql` → `ensureSchema` |
| Endpoints de données (comportement observable) | Aucun changement attendu (mêmes adaptateurs derrière le contrat)                                   | Suites de contrat memory + SQLite au vert (exigées par le plan)                                              |
| Comportements préservés 1.2                    | Séquence de révisions strictement croissante, curseur composite, enveloppe `commit`                | Couverts par le harnais existant — aucune attente modifiée                                                   |

Aucune fonctionnalité existante n'est supprimée ou dégradée dans ce lot ; les adaptations sont les deux coutures et la sélection explicitement prévues par le plan (1.1 § 5, « Portée des évolutions 1.2–1.3 »).

## 6. Livrables & critères d'acceptation

1. `DATA_STORE=firestore|sql|memory` implémentée dans `server/app.ts` (un seul fournisseur actif ; `sql` local/test avec `ensureSchema` ; `memory` refusée en production).
2. `server/seo.ts` : zéro import SDK, lecteur du catalogue via le port alimenté par le contrat, synchronisation maison supprimée, rendu identique.
3. `verifyEmployeeRights` consommé via le port, implémenté sur le contrat ; `identity.ts` sans import de `firebaseAdmin`.
4. Test de garde statique au vert : **zéro import du SDK Firebase hors `firebaseAdmin.ts` + `firestoreStore.ts`** (production de code).
5. Suites de contrat **memory + SQLite** au vert ; écriture complète sans fusion, pas de `undefined` (harnais existant, exigé par le plan).
6. `npm run check` vert (types + lint + formatage + tests), benchmark de fumée inchangé.

## 7. Micro-arbitrages proposés (à valider avec le dossier — aucune décision 🚩 prévue par le plan)

1. **Port du catalogue SEO** : port **étroit** en lecture seule (`changes` borné aux 3 collections publiques) — recommandé — plutôt que passage du `DataStore` complet (exposerait des écritures au rendu SEO). Le port vit côté serveur (`server/storage/`), l'application cliente n'est pas concernée.
2. **Sort du `LOCAL_MEMORY_STORE`** : recommandation — remplacé par `DATA_STORE=memory` **sans alias de compatibilité** (variable interne de développement, aucun déploiement ne la porte ; vérifier avant implémentation qu'aucune documentation d'exploitation ne la cite, sinon alias le temps d'une version).
3. **Configuration de l'option `sql`** : recommandation — une seule variable `SQLITE_PATH` pour le mode local (better-sqlite3, même pilote que le harnais) ; toute connexion à un autre moteur attend le lot 1.4 (matrice de capacités par moteur).
4. **Portée de la garde statique** : recommandation — fichiers de production uniquement (`server/**` hors `*.test.ts`) ; les fichiers de test gardent leurs imports SDK (suite émulateur, réserve 1.5). La recherche manuelle couvre quand même tout le dépôt à chaque lot.

## 8. Ce que le lot 1.3 ne fait pas (rappels validés, non discutés)

- **Aucune migration de production** ; aucune écriture SQL en production ; la bascule reste globale, unique, soumise à décision explicite (1.5 puis 6a).
- **Aucune implémentation relationnelle par domaine** au-delà du pilote Identity déjà livré (arbitrage n° 5) ; les modèles évoluent après la bascule, directement sur SQL (5b/6a).
- **Aucun moteur SQL supplémentaire** : SQLite reste le seul réellement testé ; tout autre moteur est non démontré tant que sa suite n'est pas passée.
- **Aucun changement de modèle, de modèle métier, d'écran ou d'endpoint HTTP observable** ; aucune documentation générale (`docs/encyclopedie/`, `CLAUDE.md`) mise à jour à ce stade — uniquement à la demande du chef, en fin de release (plan § 1). Ce dossier est le livrable technique du lot.

## 9. Méthode et preuves

- Lectures intégrales : `server/app.ts` (90 l.), `server/storage/identity.ts` (40 l.), `server/firebaseAdmin.ts` (63 l.), extraits de `server/seo.ts` (637 l., imports + lecteur + cache), `server/storage/sqlStore.ts` (`ensureSchema`, en-tête), `contract.ts`, `relationalPilot.ts` (en-tête), `perfSmoke.test.ts`.
- **Recherches exhaustives** : imports `firebase-admin`/`firebase` dans `server/**` hors tests (`firebaseAdmin.ts`, `firestoreStore.ts`, `seo.ts` — unique violation) ; variable `DATA_STORE` (zéro occurrence) ; `resolveIdentity` consommé par 3 fichiers de routes ; `ensureSchema` / `describeDataStore` / `relationalPilot` (usages listés) ; `src/app/container.ts` (aucun SDK).
- État de tests repose sur la clôture du lot 1.2 (784 tests verts, 22 Firestore ignorés proprement — réserve 1.5), constatée par le chef.
