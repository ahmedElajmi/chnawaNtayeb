# Lot 1.4 — Mécanismes transversaux : dossier de réalisation (à examiner avant tout développement)

**Statut** : **validé par le chef — lot 1.4 clôturé** (bilan validé ; décisions enregistrées : aucun seuil de performance pour l'instant — la baseline 100k reste la référence initiale, seuils à définir quand moteur SQL et environnement cible seront connus ; SQLite reste le seul moteur réellement testé, pg/MySQL/MSSQL « analysés, non démontrés », pas de tests supplémentaires sans raison concrète ; compromis `synchronous=NORMAL` maintenu, à réexaminer à la décision de bascule)
**Lot** : 1.4 (phase 1, plan § 5) · **Dépend de** : 1.3 (**validé et clôturé**, commit `22a6976`)
**Décisions** : micro-arbitrages 1–3 validés par le chef (rejeu ≤ 3 après la tentative initiale ; tests de moteurs conditionnels à la disponibilité d'une instance, aucun moteur privilégié ; baseline p95 d'abord, seuils ensuite) · **Décision 🚩 maintenue** : les **seuils de performance** (décision explicite après lecture de la baseline).

---

## 1. Synthèse

- **Ce qui existe déjà** (hérité de 1.2–1.3) : le harnais de contrat partagé couvre déjà la concurrence **sur un document** (transacts concurrents fusionnés sans perte — `contract.ts:234`), les gardes conditionnelles (course perdue propre — `contract.ts:145,164`), le **curseur de sync `(revision, id)` avec départage par id** (reprise exacte d'un groupe d'égalités — `contract.ts:261–299`) et un **benchmark de fumée** borné généreusement (`perfSmoke.test.ts`, N = 1 000 — son commentaire renvoie explicitement les seuils par moteur à ce lot).
- **Ce qui manque** (cœur du lot 1.4) : la contention **réelle par moteur** (processus distincts / connexions concurrentes, pas seulement un `Promise.all` sur le même adaptateur), la **matrice de capacités par moteur SQL** publiée, la **stratégie de verrouillage des révisions par moteur** (le commentaire de `stamp` dans `sqlStore.ts:110–114` la renvoie à ce lot), l'**alignement du budget de rejeu** sur le plan (« rejeu ≤ 3 » — le code SQLite rejeue actuellement jusqu'à **10** fois) et le **harnais de performance sur base de référence 100k** avec la **baseline p95 enregistrée**.
- **Deux curseurs au contrat** (`types.ts`) : le **curseur de sync `(revision, id)`** (change feed — 1.2) et le **curseur de répertoire** (`DirectoryQuery.after`, id seul — pagination annuaire). Le premier est testé **sous contention** ; le second est régi par la garantie **G-DIR** précisée à la demande du chef (cohérence **par requête**, § 4-C4 — aucun mécanisme nouveau).
- **Aucun moteur SQL supplémentaire n'est déclaré compatible dans ce lot** sans sa suite réellement exécutée : la matrice distingue toujours « SQLite réellement testé » de « analysé / non démontré » (règle permanente `CLAUDE.md` § 8).
- **Ce que le lot 1.4 ne fait pas** : aucune migration de production, aucun changement de modèle, aucun nouveau endpoint, aucune décision du moteur SQL définitif (reportée, décision explicite séparée).

## 2. Rappel du lot (plan § 5, verbatim condensé)

> **Mécanismes transversaux** : transactions (**rejeu ≤ 3**, rollback, classes de conflit), concurrence, contraintes, deux curseurs — **curseur de sync `(revision, id)` avec départage par id, testé sous contention** (les révisions égales d'un `commit` Firestore ne font jamais perdre un document) ; **matrice de capacités par moteur SQL** (SQLite testé ; tout autre moteur analysé — types, JSON, index, transactions, contraintes, pagination, concurrence, migrations — et testé **avant** d'être déclaré compatible ; les garanties ne sont pas identiques : SQLite sérialise les écritures, `READ COMMITTED` ne s'y applique pas pareil — **les classes de conflit et les attentes des tests sont adaptées par moteur**, documentées et testées réellement sur chaque moteur) ; **harnais de performance sur base de référence 100k**.
> **Critères** : suite de tests concurrence/contraintes **par moteur**, matrice de capacités publiée ; **p95 mesuré enregistré comme baseline**. 🚩 **Seuils de perf de la couche données**.

## 3. État vérifié du code — tableau d'écart

| Mécanisme                       | Existant | État vérifié (evidence)                                                                                                                                                                                                                                                    | Reste à faire en 1.4                                                                                                                                                 |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transactions — rejeu            | M        | `sqlStore.transact` : comparaison-et-échange sur la révision dans une transaction + boucle de rejeu `attempt < 10` (`sqlStore.ts`, bloc `transact`) ; Firestore : `runTransaction`, rejeux internes du SDK ; mémoire : passage synchrone unique, atomique par construction | **Aligner le budget sur le plan (rejeu ≤ 3)** — micro-arbitrage 1 ; classes de conflit nommées et documentées par moteur                                             |
| Transactions — rollback         | C        | Le rejeu SQLite repart de l'état relu (`knex.transaction` annule tout à l'exception levée) ; testé par la suite de contrat (garde perdue n'écrit rien)                                                                                                                     | Vérifier le rollback **par moteur réel** (candidat non-SQLite) dans la suite de contention                                                                           |
| Classes de conflit              | C        | SQLite : `TransactConflict` (CAS perdu), `isWriteConflict` (BUSY/LOCK/40001/40P01/1205 + messages), `isUniqueViolation` (SQLITE_CONSTRAINT/23505/2601/2627) — motifs codés pour SQLite **et** codes génériques pg/mssql                                                    | Adapter et **tester réellement** ces classes par moteur (les messages/motifs diffèrent) ; documenter dans la matrice                                                 |
| Verrouillage des révisions      | —        | `stamp` = `max(revision)+1` dans la transaction d'écriture ; commentaire : « SQLite serialises writers; **other engines get their own locking strategy in lot 1.4** » (`sqlStore.ts:110–114`) — SQLite a déjà `BEGIN IMMEDIATE` documenté dans le plan § 5 (1.2)           | Stratégie par moteur isolée dans l'adaptateur : SQLite `BEGIN IMMEDIATE`, moteurs à verrou de ligne `SELECT … FOR UPDATE` — matrice et tests                         |
| Curseur de sync sous contention | C        | Reprise exacte d'un groupe d'égalités testée sur adaptateurs (`contract.ts:261–299`) ; cas défavorables 1.2 (égalités intra-commit en ordre défavorable, frontières de pagination) au harnais                                                                              | Contention **réelle par moteur** : écritures concurrentes pendant un rattrapage, sur vraies connexions parallèles (pas le même processus séquentiel)                 |
| Curseur de répertoire           | C        | `DirectoryQuery.after` (id seul), total juste (`page`) — testé au harnais sans concurrence ; mémoire : `findIndex(after)+1` (redémarre si le document curseur est supprimé) ; SQL : `id > after` strict ; Firestore : `startAfter(__name__)`                               | **G-DIR** (§ 4-C4) : garantie par requête, testée sous écritures concurrentes ; **alignement mémoire** sur `id > after` strict (interne, sans changement du contrat) |
| Contraintes                     | C        | Clé primaire (insertion pure perdue proprement), garde `email_index` au harnais ; index `(revision, id)` créé par `ensureSchema`                                                                                                                                           | Vérifier l'équivalent **par moteur** (violations, codes, messages) — table de la matrice                                                                             |
| Matrice de capacités            | —        | **Inexistante** : les branches pg/mysql2/mssql de `sqlStore` (`jsonField`) sont écrites mais **jamais exécutées**                                                                                                                                                          | **C2** — document livrable publiée (§ 4)                                                                                                                             |
| Harnais de performance          | M        | `perfSmoke.test.ts` : rattrapage complet N = 1 000, bornes murales généreuses (15 s), mémoire + SQLite — détecte la dérive algorithmique, pas la latence absolue                                                                                                           | **C5** — harnais 100k, p95 **enregistré comme baseline** ; seuils = 🚩 décision du chef                                                                              |

## 4. Conception proposée — cinq chantiers

### C1 — Suite de concurrence et de contraintes **par moteur**

- Nouveau harnais de contention, **séparé du harnais de contrat** (celui-ci reste la référence comportementale, inchangé) : plusieurs **connexions réelles** vers le même fichier/serveur, écritures concurrentes pendant un rattrapage, transacts concurrents sur le même document, gardes revendiquées simultanément, clé primaire disputée, curseurs consultés pendant des écritures.
- Les attentes sont **adaptées par moteur** (plan § 5) : SQLite sérialise les écritures (les révisions égales d'un groupe restent groupe) ; sur un moteur à verrou de ligne, le même scénario produit les mêmes garanties **contractuelles** (aucun document perdu, révisions strictement croissantes) avec des classes de conflit différentes — la suite vérifie les garanties du contrat, pas le mécanisme interne.
- **Exécution** : SQLite (mémoire + fichier) toujours exécutée ; tout autre moteur **exécute la même suite** quand une instance est fournie (micro-arbitrage 2, exécution conditionnelle type émulateur — absente = ignorée proprement, comptée comme réserve, jamais « compatible » tant que verte non démontrée).

### C2 — Matrice de capacités par moteur (livrable publié)

Document en `docs/encyclopedie/donnees/` (comme la cartographie 1.1), **ligne par moteur**, colonnes du plan : **types, JSON, index, transactions, contraintes, pagination, concurrence, migrations** — plus la ligne « classes de conflit observées » et « stratégie de verrouillage des révisions ». Statut explicite par moteur : **réellement testé** (suite verte exécutée) / **analysé, non démontré**. La matrice est écrite pour SQLite au fil du lot (elle est le livrable, pas une note), et **n'attribue jamais la compatibilité** à un moteur sans suite verte.

### C3 — Discipline des transactions (rejeu ≤ 3, rollback, classes de conflit)

- Budget de rejeu aligné sur le plan (micro-arbitrage 1) : après épuisement, l'erreur est **une erreur de stockage propre** que l'interface traduit — jamais un échec silencieux ni une écriture partielle.
- Les classes de conflit deviennent des **valeurs nommées et documentées** (CAS perdu, verrou/serialization perdu, unicité perdue) partagées par les adaptateurs SQL ; les motifs par moteur restent dans l'adaptateur.
- Le rollback est vérifié par test : un lot qui échoue **au milieu** ne laisse **aucune** trace (garde, clé primaire, erreur opération).

### C4 — Les deux curseurs sous contention réelle

**Curseur de sync `(revision, id)`** — scénarios testés par moteur : **rattrapage pendant des écritures concurrentes** (aucun document perdu, aucune révision sautée), **égalités intra-commit** en ordre défavorable, frontière inclusive entre polls, consommation idempotente (relire la même page ne change rien).

**Curseur de répertoire — garantie précisée G-DIR (clarification demandée par le chef, intégrée)** :

La garantie retenue est **la cohérence par requête** — l'état au moment de chaque appel — et **non** un instantané stable pendant toute la pagination. Ce choix suit la recommandation du chef : **aucun mécanisme nouveau** (pas de snapshot, pas de curseur élaboré), la garantie est définie, testée, et tient sur les trois adaptateurs actuels avec un seul alignement interne de l'adaptateur mémoire (voir ci-dessous). Une garantie « stable pendant toute la pagination » exigerait un instantané — un mécanisme que Firestore n'offre pas sans relecture complète ou curseur de snapshot persisté, c'est-à-dire exactement la complexité que le plan interdit d'introduire dans le contrat.

1. **Cohérence par requête — forme réaliste (correction demandée par le chef, intégrée)** : chaque appel `page` effectue **deux lectures distinctes** — les items (les `limit` premiers documents **après** le curseur, dans **l'ordre par id**) et le compte du total. Les items correspondent à **l'état observé lors de leur lecture** ; le total correspond à **l'état observé lors du calcul du compte**. Les deux opérations sont **cohérentes individuellement**, mais **aucun instantané commun n'est promis** : une écriture entre les deux lectures peut faire que le total et les items ne décrivent pas exactement le même état — chacun est pourtant juste. Le contrat ne promet donc pas ce que les adaptateurs (SQL, Firestore — deux requêtes séparées) ne fournissent pas ; aucune transaction de lecture ni mécanisme de snapshot n'est ajouté.
2. **Pagination sans doublon, indépendante de la survie du curseur** : le curseur est **strictement** `id > after` sur **tout** adaptateur — un document délivré une fois ne l'est jamais deux fois, même si le document curseur est supprimé ou réécrit entre deux pages. Alignement interne requis : l'adaptateur mémoire retrouve aujourd'hui le curseur par `findIndex` et **repart du début** si le document curseur a été supprimé entre les pages (`memoryDataStore.page`, `findIndex(…)+1` → `-1+1 = 0`) ; il passe au même `id > after` strict que SQL et Firestore — un changement **interne** à l'adaptateur, **aucun changement du contrat**.
3. **Pas de garantie d'instantané (documentée)** : un document écrit entre deux pages peut rejoindre une page suivante (id > after) ; les totaux des pages suivantes peuvent bouger ; un document supprimé entre deux pages cesse simplement d'apparaître. C'est assumé : l'annuaire du backoffice réémet ses pages et le change feed porte l'état vivant — la stabilité est le rôle du curseur de sync, pas de la pagination d'annuaire.

**Propriétés testées sous écritures concurrentes (par moteur)** : T1 aucun id délivré deux fois au fil d'une pagination ; T2 pages id-ordonnées et strictement après le curseur précédent ; T3 total exact **à l'instant de son calcul** (les items et le total sont justes chacun à l'instant de sa propre lecture — aucun instantané commun promis) ; T4 poursuite après suppression du document curseur (jamais de redémarrage, jamais de page vide définitive) ; T5 drainage terminé quand les écritures s'arrêtent (chaque document survivant dont l'id suit le premier curseur finit par apparaître exactement une fois).

**Cas Firestore** : la contention réelle reste couverte par la suite émulateur (**réserve 1.5** — inchangée ; le lot 1.4 n'ouvre pas cette exécution).

### C5 — Harnais de performance 100k + baseline p95 (🚩 seuils = décision du chef)

- Base de référence **100 000 documents** (générée, jamais commitée), opérations mesurées : **rattrapage complet paginé** (le chemin critique du protocole de sync), écriture continue (débit `put`/`commit`), **p95** par opération (horloge process, plusieurs passes, valeurs médianes).
- La **baseline mesurée est enregistrée** (fichier livrable dans `docs/encyclopedie/donnees/`, avec machine, version du moteur, forme du corpus) — critère du plan.
- Les **seuils** (ce qui déclenche une alerte ou bloque une release) restent la **décision 🚩 du chef** : le dossier propose de décider **après** lecture de la baseline, pas avant (micro-arbitrage 3). Le benchmark de fumée existant reste tel quel (garde anti-dérive algorithmique).

## 5. Analyse de non-régression explicite

| Fonctionnalité existante impactée          | Risque                                                                 | Tests nécessaires (sans changer leurs attentes)                                         |
| ------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Suites de contrat (memory, SQLite, pilote) | Le budget de rejeu change (10 → plan) ; pragmas de verrouillage SQLite | Suites au vert sans modification — la contention contractuelle déjà couverte doit tenir |
| Création de compte atomique (garde e-mail) | La classe « unicité perdue » change de représentation                  | Tests de garde existants au vert ; contention réelle ajoutée en C1                      |
| Fusion du frigo (`transact`)               | Rejeux sous contention réelle                                          | Test de concurrence du harnais au vert + scénario multi-connexions en C1                |
| Protocole de sync (curseur composite)      | Aucun changement du contrat ; seuls les tests changent                 | Suites 1.2 au vert, sans modification                                                   |
| Benchmark de fumée                         | Inchangé (garde anti-dérive)                                           | Au vert                                                                                 |

Aucune fonctionnalité existante n'est supprimée ou dégradée ; les changements sont internes à l'adaptateur SQL et à ses tests (périmètre du plan : « — » à la colonne Existant).

## 6. Livrables & critères d'acceptation

1. Suite de concurrence/contraintes **par moteur** verte sur **memory + SQLite** (+ tout moteur réellement exercé) ; adaptée par moteur, documentée.
2. **Matrice de capacités par moteur publiée** (statut « réellement testé » distinct de « analysé »).
3. Rejeu ≤ 3 après la tentative initiale, rollback vérifié, classes de conflit nommées et documentées par moteur.
4. **G-DIR** testée sous contention (cinq propriétés T1–T5), alignement mémoire sur `id > after` strict, sans changement du contrat.
5. **Baseline p95 enregistrée** (100k) ; seuils de performance : **décision 🚩 du chef** après mesure.
6. `npm run check` vert ; les 22 tests Firestore émulateur restent ignorés proprement (réserve 1.5).

## 7. Micro-arbitrages (décision du chef — **validés**)

1. **Budget de rejeu — validé** : 3 rejeux après la tentative initiale (le plan dit « rejeu ≤ 3 » ; le code SQLite rejeue actuellement jusqu'à 10 fois, `attempt < 10`) ; au-delà, **erreur de stockage explicite** (contention anormale = signal, pas boucle silencieuse).
2. **Exécution des moteurs non-SQLite — validé** : suite **conditionnelle à la disponibilité d'une instance** (variables d'environnement de test, ignorée proprement quand absente — même motif que la suite émulateur Firestore). SQLite seul s'exécute systématiquement. **Aucun moteur privilégié** : le choix du moteur définitif reste différé.
3. **Baseline de performance — validé** : enregistrée d'abord (fichier livrable + script), **seuils décidés ensuite** par le chef (🚩) sur des chiffres réels.
4. **Curseur de répertoire — clarification intégrée (§ 4-C4)** : garantie **par requête** (G-DIR), **aucun mécanisme nouveau** ; un seul alignement interne de l'adaptateur mémoire (`id > after` strict, comme SQL et Firestore), sans changement du contrat métier.

## 8. Ce que le lot 1.4 ne fait pas (rappels validés, non discutés)

- **Aucune déclaration de compatibilité** pour PostgreSQL, MySQL, SQL Server ou tout autre moteur sans suite verte réellement exécutée (statuts : SQLite réellement testé ; le reste non démontré).
- **Aucun choix du moteur définitif** (décision explicite séparée, toujours différée) ; aucune migration de production ; la bascule reste l'opération globale validée en 1.5 puis soumise à décision.
- **Aucun changement** du contrat `DataStore`, des modèles, des endpoints ou de l'interface ; aucune exécution de la suite Firestore émulateur (réserve 1.5) ; aucune documentation générale mise à jour (livrables techniques du lot seulement).

## 9. Méthode et preuves

- Lectures intégrales : `server/storage/sqlStore.ts` (transact, classes de conflit, `stamp` et son commentaire renvoyant la stratégie de verrouillage à 1.4, `page` avec `id > after` strict et compte frais), `server/storage/firestoreStore.ts` (transact, compteur dans la transaction, `page` par `__name__` + `startAfter`), `server/storage/memoryDataStore.ts` (transact synchrone, `page` avec `findIndex(after)+1` — l'alignement G-DIR identifié), `server/storage/contract.ts` (concurrence, gardes, curseurs), `server/storage/perfSmoke.test.ts` (bornes et commentaire renvoyant les seuils à 1.4), `server/storage/types.ts` (les deux curseurs).
- Recherche : `attempt < 10` (budget actuel), branches `pg/mysql2/mssql` jamais exécutées, aucune matrice existante (aucun document de capacités dans le dépôt).
- État de tests repose sur la clôture du lot 1.3 (804 tests verts + 22 ignorés, commit `22a6976`).
