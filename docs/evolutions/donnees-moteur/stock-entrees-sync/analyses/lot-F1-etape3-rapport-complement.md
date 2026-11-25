# Lot F1 — Étape 3 — Complément au rapport (revue du chef du 2026-11-19)

> Document d'**analyse uniquement** : aucune modification de code, de configuration, de script ou
> de fixture ; aucun commit ; aucune campagne relancée ; l'émulateur et l'environnement restent
> en l'état. Ce complément complète `lot-F1-etape3-rapport.md` ; il corrige un point du rapport
> (D3, § 1) et fournit l'analyse demandée (A1–A4, E4, priorisation).

---

## 1. D3 — contradiction identifiée entre le dossier v4.2 (§ 6.3) et le rapport

### Ce que dit le dossier (§ 6.3 du dossier d'exécution, compromis accepté)

« Ordre : **pull → resetLocal** (écrit un document vide **en conservant `deviceClock` et
`lastSyncedAt`**) → `applyRemote` → `recordSynced`. La liste `pending` est **effacée** : les
opérations locales non synchronisées d'un appareil muet depuis plus de 83 jours sont
**perdues**. » — et : « Le test du scénario 6 vérifie **les deux faces** : aucune résurrection
d'une donnée supprimée **et** la perte documentée des opérations pendantes (le test énonce le
compromis, il ne le déguise pas). »

### Ce que fait réellement le code (vérifié à la lecture)

`src/application/kitchen/KitchenSync.ts` :

- `recover()` (l. 240-244) : **`pushNow()` est appelé AVANT `pullNow()`** quand des sections sont
  en attente (« sends the sections pending from a previous run at start-up, before pulling »,
  testé `KitchenSync.test.ts:679`) ;
- `pullNow()` (l. 214-238) : après un pull réussi, si `lastSyncedAt` est plus vieux que
  `STALE_DEVICE_MS` → `resetLocal()` **puis** `applyRemote(doc)`.

Conséquence exacte, deux cas :

| Cas au retour d'un appareil muet > 83 j | Résultat de la modification hors ligne |
| --- | --- |
| Le push de rattrapage **réussit** (l'appareil est en ligne, la version HLC est acceptée) | La modification **survit** : elle est poussée avant le reset, puis réadoptée depuis le serveur |
| Le push de rattrapage **échoue** (appareil encore hors ligne au retour, ou push refusé — par exemple par les caps, cf. A4) | `pending` est **effacée par le reset** → la modification est **perdue** — c'est le compromis § 6.3 |

### Ce que couvre réellement le test cité

Le test du scénario 6 commis (`server/routes/kitchenStockConvergence.test.ts:466`, SQLite et
mémoire, intitulé « a device that synced too long ago recovers **without losing** its offline
change ») vérifie **uniquement la face « survie »** : l'appareil revient **en ligne**, le push de
rattrapage réussit, la modification est réadoptée. **Aucun test commis n'asserte la face
« perte »** (retour avec push en échec → pending effacée). Les tests `KitchenSync.test.ts:842`
(reset + réadoption) et `:860` (« wipes nothing when the pull fails ») ne couvrent pas ce cas
non plus. L'affirmation du dossier (« le test du scénario 6 vérifie les deux faces ») est donc
**inexacte pour la face perte**.

### Le comportement effectivement mesuré (harnais `d3`, SQLite, daté)

Mon harnais D3 a rejoué le scénario de survie (identique au test commis) : changement hors ligne
**conservé**, horloge conservée. Il n'a **pas** exercé le cas de perte (push en échec au retour).
Le rapport de l'étape 3 présentait ce résultat comme la réponse complète à D3 — **c'était
excessif** ; la ligne D3 du rapport est corrigée (voir ci-dessous).

### Proposition (aucun changement silencieux de la décision validée)

1. **Le compromis § 6.3 n'est ni rouvert ni modifié** : la perte des opérations pendantes dont le
   push échoue reste acceptée, et le cas de survie (push réussi avant reset) est un
   comportement **plus favorable** que le texte du compromis, déjà commis et validé par ses
   tests — il n'est pas une nouvelle politique.
2. **Correction du rapport d'étape 3** (faite, ligne D3) : le résultat mesuré est explicitement
   limité à la face « survie » ; la face « perte » est décrite comme non exercée.
3. **Erratum proposé au dossier d'exécution § 6.3** (décision du chef) : remplacer l'affirmation
   « le test du scénario 6 vérifie les deux faces » par la description exacte ci-dessus, et — si
   le chef l'accepte — **ajouter un test** assertant la face perte (appareil muet > 83 j, push de
   rattrapage en échec, pending effacée, données locales remplacées par le serveur) afin que le
   compromis soit réellement testé comme le dossier le prétend. Ce test serait un fichier de test
   commis — il requiert une autorisation distincte.

---

## 2. M5 — complément des mesures concurrentes (données déjà enregistrées)

Valeurs issues de l'exécution finale datée (aucune campagne relancée) :

| Niveau | Échantillons par série | Max série 1 | Max série 2 |
| --- | --- | --- | --- |
| C2 (2 appareils) | 50 / 50 | 23.54 ms | 28.73 ms |
| C3 (3 appareils) | 51 / 51 | 32.43 ms | 33.25 ms |
| C5 (5 appareils) | 50 / 50 | 52.27 ms | 75.75 ms |

(p50/p95 déjà consignés au rapport § 6. Le p95 de C5 série 2, 74.58 ms, provient du même régime
que le max — des attentes de sérialisation lorsque les 5 pushes se chevauchent.)

**Durées d'attente transactionnelle : NON enregistrées.** Le harnais mesure le temps total
« toggle → settled » (barrière de synchronisation, aucune latence forfaitaire) et le nombre de
pushes réellement simultanés (max constaté), mais **il ne décompose pas** ce temps en
traitement / attente de sérialisation côté serveur / attente de la barrière. Obtenir cette
décomposition exigerait un instrument du harnais (horodatage par étape dans la boucle de settle)
— **non réalisé, reporté** : cette donnée n'a jamais été collectée, elle n'est donc pas annoncée.

---

## 3. Analyse des anomalies A1–A4 (cause racine, risques, corrections, tests, recommandation)

### A1 — Limite HTTP de 100 Kio incompatible avec les caps du contrat

**Cause racine confirmée.** `server/app.ts:81-85` : un `express.json({ limit: '100kb' })`
(`smallJson`) est appliqué à **toutes** les routes sauf `VISION_PATH` et `/api/data/*` ;
`/api/kitchen` y tombe. Or le contrat autorise un état de stock que le push dépasse largement :
2 000 tombstones seules = **498.1 Kio** (mesuré, HTTP 413), 300 entrées enrichies = 93.2 Kio
(HTTP 200, à la limite), document complet au pire cas contractuel = **747.7 Kio** (M1a).

**Fichiers/fonctions concernés.** `server/app.ts` (`createApiApp`, lignes 81-85, répartition
`smallJson`/`bigJson`) ; aucun code métier ; `kitchenRoutes.ts` ne peut rien y faire (le rejet
arrive avant l'authentification).

**Risque fonctionnel et utilisateur.** Un utilisateur dont le stock légal dépasse ~100 Kio
(quasi garanti au-delà de ~300 éléments ou avec des notes enrichies) voit **toute
synchronisation refusée en 413** avant même l'authentification : modifications bloquées en
pending (retard des autres appareils), aucune donnée corrompue, mais la fonction est inutilisable
à volume réaliste. Les caps B1c/B1d sont **inatteignables en production**.

**Corrections possibles.**
- (a) **Appliquer `bigJson` (5 Mio, constante existante) à `/api/kitchen`** : une ligne, aligne
  la couche transport sur le pire cas contractuel (747.7 Kio) avec une large marge. Conséquence :
  la surface de charge utile par requête augmente — le `syncLimiter` (déjà en place) et la
  validation stricte des sections (qui refuse tout dépassement de caps) restent les vraies
  gardes ; la limite 5 Mio n'est qu'un garde-fou transport, jamais un plafond métier.
- (b) Limite dédiée intermédiaire (ex. 1 Mio) pour `/api/kitchen` : plus serrée, mais crée une
  troisième constante et devra être recalculée à chaque évolution du contrat (fragile).
- (c) Synchronisation fragmentée (push par tranches) : rework du protocole client/serveur — hors
  proportion pour F1.

**Tests de non-régression indispensables.** Un test `server/app.test.ts` ou `kitchenRoutes` : un
push légal > 100 Kio (2 000 tombstones, scénario B1c) aboutit en **200** ; les tests de caps
existants (`kitchenRoutes.stock.test.ts`) ; un test que les **rejets métier** (caps dépassées)
restent des **400** (la limite transport ne doit jamais transformer un refus métier).

**Recommandation.** Option (a) : la plus simple, la plus fidèle au contrat, réutilise une
constante existante ; le plafond reste au-dessus de tout état légal et la validation métier garde
le dernier mot.

### A2 — Lecture après écriture dans la transaction Firestore (`stampTx`)

**Cause racine confirmée.** `server/storage/firestoreStore.ts` : dans `commit` (l. 314-334), la
boucle appelle `stampTx(tx, op.name)` **pour chaque nouvelle collection** ; `stampTx`
(l. 60-88) lit le compteur (`tx.get(counterRef(name))`, et, si absent, relit la table) puis
**écrit** `tx.set(counterRef…)` — le `stampTx` de la collection suivante lit donc **après** une
écriture de la même transaction. Firestore (règle de production documentée, pas une bizarrerie de
l'émulateur) refuse : « all reads must be executed before all writes ».
`createAccount` (`server/auth/users.ts:128-137`) commet `users` + `auth` + `email_index` → la
création de compte **échoue** sur le fournisseur Firestore (les 5 tests de convergence émulateur
échouent en cascade par un 401 à l'enregistrement, mesuré).

**Fichiers/fonctions concernés.** `server/storage/firestoreStore.ts` : `stampTx` (l. 60-88),
`commit` (l. 314-334) ; `server/auth/users.ts` (`createAccount`, l. 128-137) comme premier
consommateur multi-collections ; les tests de contrat `server/storage/contract.ts:134, 138-168,
170-247` (les 3 tests émulateur échoués) et la suite de convergence émulateur.

**Risque fonctionnel et utilisateur.** Sur le fournisseur **actif** (Firestore) : aucun compte
ne peut être créé (clients comme employés), donc aucune synchronisation multi-appareils, aucun
frigo partagé ; les écritures mono-collection (catalogue, recettes) passent, ce qui rend le
défaut invisible tant qu'on ne crée pas de compte. C'est un blocage fonctionnel majeur **latent**
(le chemin n'avait jamais été exécuté sur émulateur avant cette campagne).

**Corrections possibles.**
- (a) **Réordonner `commit` en deux phases** : phase 1 = **toutes les lectures** (garde,
  compteurs de chaque collection touchée, y compris les « newest-lookups » des compteurs
  absents), phase 2 = **toutes les écritures** (compteurs puis documents). L'atomicité du commit
  est conservée (tout reste dans la même transaction) ; la sérialisation par compteur reste
  identique ; le contrôle `sync_counter_corrupt` est conservé tel quel. Conséquence : le nombre
  de lectures par transaction augmente légèrement (aucune lecture supplémentaire en réalité :
  ce sont les mêmes, seulement anticipées) ; le code de `commit` est réorganisé, `put`/`remove`/
  `transact` (mono-collection, lectures déjà avant écritures) ne changent pas.
- (b) Transactions séparées par collection : **rejetée** — elle casserait l'atomicité du commit
  (un demi-commit lors d'un échec) et la garde d'unicité e-mail.
- (c) Compteurs hors transaction (incrément atomique Firestore) : **rejetée** — les révisions
  ne seraient plus contiguës par commit (le curseur du change feed exige une révision unique
  partagée par toutes les opérations d'un commit).

**Tests de non-régression indispensables.** Les 3 tests de contrat qui échouent sur l'émulateur
(`contract.ts:134` batch atomique + garde, `:138+` claim unique, `:170+` transacts concurrents)
doivent passer **sur l'émulateur** ; la suite de convergence émulateur (5 tests) doit passer ;
les suites SQLite/mémoire des mêmes contrats doivent rester identiques (aucun changement de
comportement observable) ; un test dédié « un commit multi-collections réussit sur Firestore »
(le cas `createAccount` couvert par la suite d'auth sur émulateur si elle existe).

**Recommandation.** Option (a), **indispensable avant toute clôture de F1** : c'est le fournisseur
actif, le défaut bloque la fonctionnalité comptes dans son ensemble, et la correction est
localement bornée (un réordonnancement dans `commit`).

### A3 — `sessionMax` non restauré lors des rejeux de transaction

**Cause racine confirmée.** `server/storage/firestoreStore.ts` : `sessionMax` (l. 43) est une
`Map` **de session**, mise à jour par `stampTx` (l. 85) **pendant** la transaction. Firestore
**rejoue** la fonction de transaction après contention ; les `sessionMax.set` de la tentative
avortée **restent en place**. À la relecture, le compteur frais peut renvoyer une valeur
`next <= observed` → levée déterministe de `sync_counter_corrupt`
(« counter behind the observed maximum ») — mesurée sur le test de contrat
« serialises concurrent transacts » (6 `transact` concourants, `Promise.all`, émulateur).

**Fichiers/fonctions concernés.** `server/storage/firestoreStore.ts` : `sessionMax` (l. 43),
`stampTx` (l. 60-88), `commit` (l. 314-334), `transact` (l. 337-368). **La garde
`sync_counter_corrupt` elle-même est saine et reste** (contrainte du chef respectée) : c'est
l'alimentation de la garde qui est fausse après un rejeu.

**Risque fonctionnel et utilisateur.** Sur Firestore en production, deux `PUT /api/kitchen`
concurrents du **même processus serveur** (cas normal d'un serveur Express multi-requêtes)
peuvent faire rejouer une transaction → refus sporieux `sync_counter_corrupt` → le client reçoit
une erreur 500 (ou un refus durable selon le code de la route) alors qu'aucune corruption
n'existe. Fenêtre : uniquement les transactions **re-jouées** après contention dans le **même**
processus (les autres processus ont leur propre `sessionMax`). Probabilité faible mais réelle
dès que deux appareils poussent en même temps.

**Corrections possibles.**
- (a) **Différer l'avancement de `sessionMax` au succès de la transaction** : à l'intérieur de la
  fonction de transaction, accumuler les revendications dans une **Map locale** (par tentative) ;
  n'écrire dans `sessionMax` que lorsque `runTransaction` **résout** (succès), en fusionnant les
  maxima. À chaque rejeu, la Map locale repart à vide et les lectures sont fraîches. La garde
  reste alimentée par les **succès** de la session : « le compteur est derrière ce que cette
  session a **effectivement écrit** » — exactement la sémantique voulue, sans faux positifs.
  Conséquence : deux transactions concurrentes du même processus peuvent transitoirement viser
  la même révision — l'une des deux avorte sur la contention du document compteur et rejoue avec
  une lecture fraîche (comportement Firestore standard), donc aucune révision dupliquée n'est
  **écrite**.
- (b) Supprimer la garde : **rejeté** (contrainte du chef ; la garde est une protection de
  cohérence utile).
- (c) Sérialiser les transactions de la session par un mutex applicatif : **rejeté** — cela
  change le modèle de concurrence et masquerait le problème au lieu de le corriger.

**Tests de non-régression indispensables.** Le test de contrat « serialises concurrent transacts »
doit passer **sur l'émulateur** ; un test dédié « une transaction rejouée après contention ne
produit jamais `sync_counter_corrupt` » (6-10 `transact` concourants sur émulateur) ; un test
que la garde **déclenche toujours** en cas de vraie corruption (compteur régressé) — le test
existant doit rester vert ; suites SQLite/mémoire inchangées.

**Recommandation.** Option (a), **indispensable** et à traiter **dans le même passage** que A2
(même fichier, mêmes tests) : les deux défauts bloquent la validation émulateur de
l'adaptateur Firestore.

### A4 — Perte silencieuse d'entrées adoptées lorsque la section locale dépasse les caps

**Cause racine confirmée.** Trois garde-fous de **lecture** appliquent les caps **à l'état de
l'appareil lui-même**, pas seulement aux données externes :

1. `src/infrastructure/local/storage.ts` — `getKitchenDoc` : `parseStockSection(doc.stock)`
   (core `entries.ts:524-532`) applique `withinStockCaps` à la section **persistée par
   l'appareil** → 301 frigo actives ⇒ **toute la section refusée** (`stock: undefined`) ;
2. `src/core/kitchen/elementSets.ts` — `parseElementSet` → `parseVersionMap`
   (l. 188-205) : la carte `added` au-delà de 300 (**cap `ELEMENT_SET_LIMITS.added`**)
   **écarte les versions les plus anciennes** — sur les données de l'appareil, pas sur une
   entrée externe ;
3. `src/infrastructure/local/localRepositories.ts` — `doc()` (l. 115-138) : stock refusé +
   éléments legacy présents ⇒ `buildStockFromLegacy` **reconstruit** le stock depuis les cartes
   amputées et **l'enregistre** — la perte devient permanente.

Scénario mesuré (harnais `caps`, et repro local pur `tmp-toggle-debug.ts`) : appareil ayant
adopté l'état B1d (600 actives + 2 000 tombstones) + **un** toggle local → en mémoire 2 601
enveloppes (correct, en attente) → **à la relecture suivante, `st_fridge_ing0299` a disparu** ;
l'entrée ajoutée, elle, survit (elle sera rejouée). Extension du même défaut : une
**restauration de sauvegarde** d'un état au-delà des caps passe par `setStock` → `saveStock` →
même `parseStockSection` refusé → « nothing stored » — **silencieux** pour l'appelant.

**Fichiers/fonctions concernés.** `src/core/kitchen/entries.ts` (`parseStockSection`,
`withinStockCaps`) ; `src/core/kitchen/elementSets.ts` (`parseElementSet`, `parseVersionMap`) ;
`src/infrastructure/local/storage.ts` (`getKitchenDoc`) ; `src/infrastructure/local/
localRepositories.ts` (`doc`, `buildStockFromLegacy`, `saveStock`, `mergeStock`).

**Risque fonctionnel et utilisateur.** **Perte de données de stock déjà synchronisées** — le cas
que le chef déclare inacceptable. Déclencheur réaliste : un appareil à la cap qui ajoute un
élément pendant que la modification attend le refus serveur, ou qui reçoit/restaure un état
au-delà des caps. L'utilisateur ne voit rien : l'entrée disparaît de la liste au rechargement.
La modification en attente, elle, reste rejouable — l'état se **stabilise** en tronqué.

**Corrections possibles.**
- (a) **Distinction lecture « état propre » / admission « données externes »** :
  - pour la relecture du **document de l'appareil** (`getKitchenDoc`) : un parse **tolérant par
    enveloppe SANS la garde de caps** (les caps restent une admission serveur et une garde de
    saisie, jamais un filtre de relecture) — une enveloppe individuellement invalide reste
    écartée (donnée malformée, jamais un volume légal) ;
  - pour la carte legacy du **document propre** : même principe (pas d'écrémage « oldest » à la
    relecture) — la projection étant régénérée à chaque écriture depuis le stock, la carte
    persistée n'est qu'une copie de secours (rollback A) ;
  - les chemins **externes** conservent les caps tels quels : validation serveur des pushes
    (B1a–B1d inchangés), `mergeStock` (adoption du serveur — le serveur ne peut pas produire un
    état hors caps, la garde y reste une deuxième ligne de défense), `parseBackup`/import.
  - Conséquence : un état local hors caps **persiste et reste lisible** (c'est la condition du
    fonctionnement « en attente ») ; la mémoire reste bornée en pratique car l'état hors caps ne
    peut croître que d'un ajout manuel isolé, refusé ensuite par le serveur.
- (b) Refuser l'ajout au niveau du magasin/UI quand la cap est atteinte (refus explicite côté
  client, plus d'état « en attente » au-delà des caps) : cohérent avec « refus explicite », mais
  change la sémantique validée (l'état en attente au-delà des caps est précisément le scénario
  B1-client) et punit l'utilisateur pour l'état venu d'un **autre** appareil — décision du chef.
- (c) Garder les caps à la lecture mais rendre la perte **bruyante** (anomalie signalée dans l'UI)
  : ne satisfait pas l'exigence « aucune donnée déjà synchronisée ne doit disparaître » — rejeté.

**Tests de non-régression indispensables.** (i) repo local : `saveStock` de l'état B1d + toggle
→ relecture → **2 601 enveloppes intactes**, l'entrée ajoutée présente, aucune clé perdue ;
(ii) le refus serveur des caps reste vert (B1a–B1d, `kitchenRoutes.stock.test.ts`) ; (iii) la
garde sur les **données externes** reste verte (un push hors caps du client est refusé côté
serveur ; une adoption serveur passe) ; (iv) restauration d'une sauvegarde au-delà des caps :
les enveloppes sont relues (ou un refus **explicite** remonte à l'appelant — à trancher avec la
correction) ; (v) le cas « perte » de D3 (§ 1) si le chef accepte le test proposé.

**Recommandation.** Option (a), **indispensable avant la clôture de F1** : c'est la seule qui
préserve à la fois les caps du contrat (côté admission) et l'intégrité de l'état local (côté
lecture), sans changer la sémantique validée du pending.

---

## 4. E4 — comparaison des deux orientations

Hypothèses de chiffrage : estimation M1b (indicative, règles officielles re-datées) ; base
mesurée ≈ 0.61 Kio/tombstone, 0.70 Kio/entrée placard, 0.22 Kio (300 frigo) / 0.43 Kio (600
entrées) hors tombstones.

### Option 1 — Document unique, caps et/ou rétention recalculés

- **Performances** : push ≤ ~500-750 Kio (M1a mesuré), p50 mesuré 10-11 ms local — inchangé par
  la cap. Aucun changement de protocole.
- **Limites Firestore** : sous 1 Mio avec marge si tombstones ≤ ~650 (600 entrées, ~80 %) ou
  ≤ ~1 000 (~100 %) ; **A1 et A2/A3 restent obligatoires** (limite HTTP, transactions) — la cap
  seule ne rend pas l'état maximal déployable.
- **Complexité** : minimale — une constante (`STOCK_LIMITS.tombstones`) + tests de caps + doc.
  Aucune migration de données (les états existants sont en dessous).
- **UX** : au-delà de 650 suppressions/90 j (≈ 7/jour), refus explicite 400 ; l'utilisateur purge
  via « vider un emplacement » (opération distincte E3, déjà validée). Pour le public visé
  (foyer, courses), 7 suppressions/jour pendant 90 jours est très généreux.
- **Hors ligne** : inchangé (un document, une section, une file pending) — le scénario B2
  (convergence à volume max) reste valable avec la nouvelle cap.
- **Tombstones HLC / anti-résurrection** : sémantique intacte ; **rétention 90 j conservée** → la
  marge `STALE_DEVICE_MS` (83 j) reste valable ; la purge serveur vide naturellement le compteur
  (les tombstones > 90 j ne comptent plus), ce qui borne l'usure du plafond.
- **Réduction de la rétention : non proposée** — toute réduction R exigerait de démontrer que la
  garantie « un appareil hors ligne < R−7 j ne ressuscite rien » tient (marge `STALE_DEVICE_MS`
  recalculée, tests de convergence adaptés). Le levier utile est la **cap**, pas la rétention ;
  je recommande de conserver 90 j tel quel.

### Option 2 — Plusieurs documents / partitions (stock actif / tombstones, ou par emplacement)

- **Performances** : chaque document < 1 Mio quel que soit le volume ; push plus petits (seule la
  partition touchée) ; pull = plusieurs lectures (latence cumulée, encore modeste en local ; non
  mesurée — aucune annonce chiffrée).
- **Limites Firestore** : la limite du 1 Mio disparaît structurellement ; mais le commit devient
  **multi-collections** (le problème A2 s'étend, il doit être corrigé de toute façon) et la
  révision unique par commit (le change feed) doit être repensée par partition.
- **Complexité** : **élevée** — nouvelles collections au contrat, `KitchenSync` et le registre
  local à reprendre (pending/révision par partition, barrière de convergence), cache local et
  sauvegarde à étendre, migration des documents existants, tests de contrat et de convergence à
  réécrire. SQL compatible (plusieurs tables), mais c'est un chantier de synchro complet.
- **UX** : transparent pour l'utilisateur si l'abstraction reste dans les adaptateurs… mais la
  machine à états (un document, une file, une révision) doit être repensée : risque de
  régression élevé sur la fonctionnalité la plus sensible du lot.
- **Hors ligne** : les opérations hors ligne d'un même geste (retrait = tombstone + mise à jour
  d'entrée) peuvent toucher deux partitions — l'atomicité d'un geste doit être garantie par le
  même commit multi-collections (dépendant d'A2) ; un échec entre partitions crée des états
  visibles incohérents si le protocole n'est pas repensé avec soin.
- **Tombstones HLC / anti-résurrection** : les tombstones doivent rester **fusionnables
  atomiquement** avec les entrées qu'elles gardent ; une partition séparée exige que le merge
  par enveloppe voie les deux partitions ensemble, sinon une suppression et sa résurrection
  peuvent être ordonnées différemment selon l'appareil. Faisable (même transaction, deux
  collections), mais c'est une refonte de la garantie la plus délicate du lot, à re-tester de
  fond en comble (les tests de convergence existants ne couvrent plus ce montage).

### Appréciation

**Option 1 recommandée** pour la clôture de F1 : la marge mesurée (162 % à la cap actuelle)
se corrige par une seule constante, sans toucher au modèle, à la synchronisation, aux
tombstones ni à la rétention ; l'option 2 résout le même problème au prix d'une refonte de la
synchronisation, injustifiée tant que la cap recalibrée (≈ 650-1 000 tombstones selon la marge
retenue) couvre l'usage réel. L'option 2 reste **demandable séparément** si un jour les volumes
réels (mesurés en production) la justifient — elle serait alors un lot à part entière avec son
dossier et sa validation.

---

## 5. Priorisation proposée

### Corrections indispensables avant la clôture de F1 (dans cet ordre)

1. **A2 + A3** (`firestoreStore.ts`, un seul passage de correction, mêmes tests) — le fournisseur
   actif ne peut ni créer de compte ni encaisser la concurrence ; sans cela, rien de ce qui
   dépend de Firestore n'est déployable, et la Campagne A reste incomplète.
2. **A4** (lecture « état propre » sans garde de caps) — perte silencieuse de données déjà
   synchronisées, déclarée inacceptable.
3. **A1** (limite HTTP de `/api/kitchen` alignée sur le contrat) — sans elle, les caps restent
   inatteignables et A4/pending n'ont pas de sens en production.
4. **Décision E4** (cap tombstones recalibrée — option 1, § 4) à prendre **après** les
   corrections, puis mise à jour des tests de caps et de la documentation.
5. **Re-exécution de la Campagne A émulateur** après A2/A3 (et seulement elle, pas toute la
   campagne) pour clos le décompte attendu (1 063/30).

### Arbitrages qui nécessitent votre validation

- **E4** : la valeur retenue (~650 avec marge 80 %, ~1 000 sans marge, ou autre) — et
  l'orientation (option 1 vs 2).
- **A4** : l'approche (a) « lecture état propre sans caps » vs (b) « refus explicite côté
  client » — la (a) est ma recommandation.
- **A1** : la valeur de la limite transport (5 Mio existante vs 1 Mio dédiée).
- **D3** : l'erratum au dossier § 6.3 et, si accepté, l'ajout du **test de la face perte**
  (fichier commis — autorisation distincte).
- **Éventuelle réduction de la rétention** : non proposée ; ne serait examinée qu'avec la
  démonstration demandée (marge `STALE_DEVICE_MS` recalculée + tests), ce qui n'est pas le cas.

### Vérifications qui peuvent être reportées

- La **démonstration navigateur** (non-régression 4 langues × clair/sombre, 375/320 px) —
  bloquée par l'outillage, reportée après les corrections (l'interface ne changera pas).
- La **décomposition des attentes transactionnelles** de M5 (§ 2) — instrumentation du harnais,
  jamais collectée, sans impact sur les décisions ci-dessus.
- Le **nettoyage** (émulateur PID 52504, fichiers `%TEMP%`, scripts temporaires `tmp-*`,
  `gdir-repro-413.ts`, suppression de `server/routes/tmp-debug.test.ts`) — après la clôture, sur
  autorisation.
- Le **packaging des commits** de l'étape 3 (harnais, seed, fixture D2, rapport + complément) —
  après validation des corrections et de l'ordre ci-dessus.
