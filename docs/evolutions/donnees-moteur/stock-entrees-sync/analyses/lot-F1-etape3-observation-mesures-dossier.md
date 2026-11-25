# F1 — Dossier d'exécution de l'étape 3 — Observation et mesures — **v4.2**

**Statut : PROPOSÉ v4.2 — deux ajustements méthodologiques intégrés (concurrency C2/C3/C5 :
cycles fonctionnels vs mesures ≥ 50 × 2 séries + barrière de synchronisation dans le
dispositif de test ; débit agrégé par base neutralisé). En attente de validation définitive.**
Aucune implémentation lancée : ce dossier décrit ce que l'étape 3 fera, avec
quoi, et quels critères valideront chaque campagne. L'implémentation (scripts de mesure + fixture de test + exécutions) ne commencera qu'après une **autorisation distincte**.
Aucune donnée réelle n'est touchée ; les 17 commits locaux de la branche ne sont pas poussés.

**Références** : dossier d'exécution F1 **v6 validé** (§ 7.3 déroulement, § 9 convergence,
§ 10 protocole de mesure, § 11 fenêtre, § 13 rollback, § 17 points à démontrer) · baseline
**1.4** (`lot-1.4-baseline-perf.md`, méthode et chiffres) · suite de convergence
`server/routes/kitchenStockConvergence.test.ts` (mémoire + SQLite exécutés à l'étape 2 ;
**Firestore = 5 tests sautés, non validés** — l'émulateur les exécutera ici).

**Révision v4 (corrections demandées par le chef, aucune décision validée rouverte, périmètre
et critères d'acceptation de la v3 conservés)** :
(1) **M1b** : l'estimation de taille Firestore couvre **tous les types de valeurs réellement
présents** dans le document kitchen (chaînes, nombres, booléens, dates, tableaux, objets
imbriqués, noms de champs, chemin réel du document, tout autre type utilisé par le modèle) ;
un type non pris en charge est **signalé explicitement** par le script, qui ne présente jamais
une estimation incomplète comme complète ; l'estimation reste **indicative** (ni validation
émulateur ni garantie de production) ; (2) **§ 4.4** : les chiffres génériques de débit
(« 1 écriture/s par document », « 1 000–2 000 opérations/s par base ») sont **retirés** en tant
qu'affirmations ; ils ne reviendront au rapport que si la page officielle actuelle les justifie
dans notre contexte ; le risque réel décrit est la **contention et le hotspot sur un même
document**, et le fait que l'anti-rebond de 2 s est **par appareil, pas par compte** —
plusieurs appareils du même compte peuvent écrire le même document kitchen en concurrence ;
(3) **B4 — isolation entre comptes** : contrôle ciblé de deux comptes distincts à cuisines
indépendantes (aucun croisement de lecture/écriture, sauvegardes et projections limitées au
bon compte, convergence normale entre appareils du même compte), avec la vérification que
l'identité du propriétaire est déterminée **côté serveur** à partir de l'authentification,
jamais acceptée d'un identifiant transmis par le client — comptes et données exclusivement
fictifs sur serveur isolé ; (4) **B1** : chaque cap est testée **séparément** (frigo 300/301e,
pantry 300/301e, tombstones 2 000/2 001e) plus l'état **combiné**, chacun avec la checklist
complète du refus.

**Révision v4.1 (trois ajustements ciblés, aucune décision validée rouverte, périmètre et
critères d'acceptation de la v4 conservés)** : (1) le § 4.4 ne retient **aucun plafond
universel fixe de débit par document** — la documentation officielle indique que le débit
maximal dépend notamment de la fréquence d'écriture, de la contention et des index affectés ;
le rapport cite les recommandations officielles applicables **sans les transformer en plafond
chiffré** ; (2) la limite de 1 Mio est qualifiée de « limite stricte de taille totale du
document **suivie spécifiquement dans cette campagne** » — elle n'est plus présentée comme
la seule contrainte stricte existant dans Firestore ; (3) les **scénarios concurrents de
M5** sont rendus reproductibles (§ 4.3 bis) : niveaux **2 / 3 / 5 appareils simulés** du même
compte, 3 cycles chacun, déclenchement défini, résultats consignés (p50/p95/max, erreurs et
refus, convergence finale, contention observée) — scénarios de mesure uniquement, ni seuils
de capacité ni garanties de performance.

**Révision v4.2 (deux ajustements méthodologiques, aucune décision validée rouverte, toutes
les autres dispositions de la v4.1 conservées)** : (1) **§ 4.3 bis** — les niveaux C2/C3/C5
distinguent désormais la **face fonctionnelle** (3 cycles complets : convergence et
idempotence) de la **face performance** (**≥ 50 mesures de push par niveau**, pour **chacune
des deux séries indépendantes**) ; le déclenchement repose sur une **barrière de
synchronisation dans le dispositif de test** (les pushs partent dans une même fenêtre, sans
dépendre de l'anti-rebond, **sans modifier le code de production**) ; les résultats consignés
incluent le **nombre de requêtes effectivement simultanées** et les **requêtes sérialisées
avec leurs attentes** ; (2) **§ 4.4** — le débit agrégé par base : **aucune valeur générique
n'est retenue comme référence de capacité** ; les recommandations officielles applicables
seront relues et datées à l'exécution, distinguées des mesures locales, **sans prétendre
démontrer la capacité de production à partir de l'émulateur**.

---

## 0. Objet et non-objectifs

**Objet** : fermer les points que l'étape 2 n'a pas pu ou n'aurait pas dû trancher sans
observation — (1) la convergence Firestore sur émulateur, (2) l'intégrité aux caps et
l'isolation entre comptes, (3) les mesures de performance qui tranchent l'arbitrage **E4**,
(4) les scénarios de migration et de compatibilité exécutés en conditions réalistes, (5) la
traçabilité (rapport de mesures, anomalies, décision E4 documentée).

**Non-objectifs** : pas d'audit général de l'application ; pas de code métier modifié ; pas de
migration exécutée ; pas de seuil de performance général de la couche données (celui-ci reste
la décision 🚩 du chef, hors F1) ; pas de théorie — **tout chiffre annoncé sera mesuré et daté,
tout chiffre non mesuré sera marqué « non mesuré »** ; **aucune connexion à une production
réelle** (Firebase ou autre) pendant cette étape.

## 1. Prérequis et environnement

| Prérequis            | Détail                                                                                                                                                                                                                  | Statut                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Branche              | `feature/datastore-contract`, 17 commits locaux (`d3529c4` … `cae4677`), **jamais poussés**                                                                                                                             | en place                          |
| Node + tsx           | même poste que la baseline 1.4 (Node v26, tsx 4.x, better-sqlite3 13.x) — les conditions seront re-consignées au rapport                                                                                                | en place                          |
| Firestore Emulator   | `npx firebase-tools@14 emulators:start --only firestore --project demo-chnawa-f1` (gratuit, local, port 8080 par défaut) ; les suites lisent `FIRESTORE_EMULATOR_HOST` + `FIREBASE_PROJECT_ID`                          | à lancer au moment de la campagne |
| Serveur isolé        | `PORT=3001 DATA_STORE=sql SQLITE_PATH=<%TEMP%>/lot-f1-etape3.sqlite npx tsx server.ts` + seed jetable — **le port 3000 du chef n'est jamais approché**                                                                  | à lancer au moment de la campagne |
| Fichiers jetables    | SQLite et seed **dans `%TEMP%`**, supprimés après usage ; l'émulateur ne garde rien de précieux (les suites nettoient `ingredients` + `kitchen` elles-mêmes)                                                            | procédure § 7                     |
| Scripts de mesure    | **à créer** (autorisés avec l'implémentation, hors `src/` et `server/`) : `scripts/diagnostics/seed-lot-F1.ts` (motif `seed-lot262.ts`) et `scripts/diagnostics/measure-lot-F1.ts` (protocole § 4)                      | nouveaux                          |
| Fixtures de test     | **à créer** (autorisées avec l'implémentation, fichiers de test seuls dans `server/routes/`, **aucune modification du code de production**) : la fixture D2 (§ 5.1) et la fixture B4 d'isolation entre comptes (§ 3-B4) | nouveaux, tests seuls             |
| Aucune donnée réelle | comptes et données **exclusivement fictifs**, émulateur local uniquement                                                                                                                                                | contrainte permanente             |

**Règle de blocage** : si une campagne révèle un bug concret et démontré, on **suspend** la
campagne, on consigne la reproduction et on revient vers le chef — pas de correctif sans
autorisation, pas de redéfinition des décisions validées (§ 15 du dossier F1).

## 2. Campagne A — Convergence Firestore (émulateur)

**Ce que l'étape 2 n'a pas validé** : les 5 tests de convergence exécutés sur mémoire et SQLite
ont été **sautés** pour le store Firestore (émulateur absent).

**Limites de l'émulateur — énoncées d'emblée** (documentation officielle Firebase) : l'émulateur
ne reproduit pas **tous** les comportements transactionnels de la production et n'applique pas
**toutes** les limites de production, dont certaines limites de taille. La campagne est donc
structurée pour ne jamais reposer sur ce que l'émulateur ne garantit pas :

1. **Intégration et convergence** (cette campagne) : validées **sur l'émulateur** — la suite
   exerce le vrai adaptateur Firestore (`createFirestoreStore`), le vrai chemin de
   validation/fusion des routes et la transaction applicative `DataStore.transact` ; ce que
   l'émulateur prouve ici est que **notre code** se comporte de la même façon sur le troisième
   store, pas que Firestore production se comporte comme l'émulateur ;
2. **Taille des documents** (campagne C, M1a/M1b) : mesurée et estimée **localement** — la
   taille exacte du payload JSON (M1a) et l'estimation selon les règles officielles Firestore
   (M1b, tous types du modèle couverts — § 4.3), avec une **marge de sécurité explicite sous
   1 Mio** ; aucune dépend à une application d'une limite par l'émulateur ;
3. **Limites officielles non appliquées par l'émulateur** (§ 4.4) : relecture des limites
   documentées par Firebase pertinentes pour notre usage, qualifiées strictes ou
   contextuelles, confrontées aux mesures locales ;
4. **Performances** : les durées mesurées sur l'émulateur **ne représentent pas** celles de la
   production (latence et débit différents) — elles servent à comparer les stores entre eux
   dans les mêmes conditions locales, jamais à promettre des performances de production.

**Commande** (émulateur lancé au préalable) :

```
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1 \
  npx vitest run server/routes/kitchenStockConvergence.test.ts server/storage/firestoreStore.test.ts
```

Puis, avec l'émulateur toujours lancé, `npm run check` intégral (les 5 sautés passent, le
décompte attendu passe de 1 058 à 1 063 passés / 30 skippés).

**Scénarios exécutés et résultats attendus** (les mêmes assertions que sur mémoire et SQLite) :

| Test (suite convergence)       | Scénarios F1 § 9  | Résultat attendu sur l'émulateur                                                   |
| ------------------------------ | ----------------- | ---------------------------------------------------------------------------------- |
| legacy ⇄ nouveau convergent    | 1, 8              | conversion legacy → stock, projection à jour, rien ne ressuscite                   |
| deux nouveaux appareils        | 2, 3, 7           | stocks **strictement égaux** après pulls croisés, quel que soit l'ordre            |
| tombstone + ré-ajout           | 4, 5              | la suppression voyage, le ré-ajout est une enveloppe **nue**                       |
| opérations hors ligne          | conflit           | les deux appareils convergent, rien de pendante, aucune perte                      |
| appareil périmé                | 6                 | reset + réadoption du serveur, changement hors ligne conservé, horloge HLC intacte |
| suite `firestoreStore.test.ts` | contrat DataStore | verte sur l'émulateur                                                              |

**Critères d'acceptation A** :

1. les 5 tests de convergence + la suite de contrat passent **sans modification du code** ;
2. les résultats sont **fonctionnellement identiques** à ceux de mémoire et SQLite (mêmes
   assertions, mêmes valeurs attendues — pas d'écart de sémantique constaté) ;
3. le rapport consigne : version de l'émulateur, durée de la suite, éventuels écarts observés
   (avec reproduction), le nouveau décompte `npm run check`, **et le rappel explicite que ces
   résultats valident l'intégration de notre code sur le store Firestore, pas les
   caractéristiques de la production**.

**Si l'émulateur est indisponible** : la campagne A est signalée « non exécutée » et **la
clôture de F1 ne peut pas être prononcée** (critère § 16-3 du dossier F1 : les 9 scénarios sur
les trois stores).

## 3. Campagne B — Intégrité des données : caps, refus et isolation

**Portée des caps, d'après le code réel** (`STOCK_LIMITS`, `src/core/kitchen/entries.ts`) :

- **300 entrées actives par emplacement** (`entries`) : le plafond s'applique **séparément**
  au frigo et au placard (le contrôle porte sur `counts.active.fridge` **et**
  `counts.active.pantry` chacun ≤ 300) ;
- **2 000 tombstones au total** (`tombstones`, commentaire du code : « Tombstones of the whole
  stock ») : plafond **global**, les deux emplacements confondus — **pas** 2 000 par
  emplacement.

**Ce que le refus garantit** (vérifié dans le code et par les tests existants) : le dépassement
d'une cap entraîne le **refus intégral du push** —

- **aucune section n'est partiellement écrite** : la fusion est transactionnelle
  (`DataStore.transact`, § 4.5 du dossier F1) ; une candidate invalide ou un dépassement est
  refusé **avant** toute écriture du document fusionné ;
- **les données précédentes restent intactes** : le document stocké n'est pas modifié (test
  existant « nothing is written » pour le refus 400) ;
- **côté client, les modifications refusées restent pendantes et ne sont pas perdues** : un
  push en échec garde ses sections en attente et repart au déclencheur suivant (test existant
  « keeps the change pending when a push fails, and retries on the next trigger ») — jamais de
  troncature silencieuse ni de perte.

### B1 — chaque limite testée séparément, puis l'état combiné

| Scénario               | Remplissage                                                                                                    | Dépassement testé                                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B1a — Frigo**        | 300 entrées actives **acceptées** au frigo (placard libre)                                                     | la **301e entrée frigo est refusée**                                                                                                                                                                                                                             |
| **B1b — Pantry**       | 300 entrées actives **acceptées** au placard (frigo libre)                                                     | la **301e entrée pantry est refusée**                                                                                                                                                                                                                            |
| **B1c — Tombstones**   | 2 000 tombstones **acceptées** (total du stock, les deux emplacements confondus)                               | la **2 001e tombstone est refusée**                                                                                                                                                                                                                              |
| **B1d — État combiné** | plusieurs limites atteintes **simultanément** (ex. 300 au frigo + 300 au pantry + tombstones proches de 2 000) | le fonctionnement vérifié quand **plusieurs limites** sont simultanément atteintes : le refus reste intégral ; le rapport consigne quelle cap est signalée et dans quel ordre (ordre observé de la validation), sans la présenter comme une garantie de priorité |

**Pour chaque dépassement (B1a–B1d), la checklist complète** :

1. **refus de l'ensemble de la modification** (pas seulement de la ligne en trop) ;
2. **aucune écriture partielle** (aucune section du document fusionné n'est écrite) ;
3. **données précédentes intactes** (le document stocké avant le push refusé est relit et
   identique) ;
4. **modifications locales toujours en attente de synchronisation** (le client garde ses
   sections pendantes et les repart au déclencheur suivant — rien de perdu) ;
5. **aucune perte ni résurrection d'entrée** (aucune enveloppe disparaît, aucune entrée
   supprimée ne revient).

### B2 / B3 — convergence aux caps et cas défensif

- **B2 — convergence aux caps** : deux appareils synchronisent **à volume maximum** (ce que
  les tests unitaires n'exercent pas) — le résultat converge et reste idempotent sur trois
  cycles complets ;
- **B3 — tombstones sans stub non décodable** (point § 17-5, cas défensif) : vérifier le
  chemin d'exclusion d'attribution de projection et l'anomalie signalée (inspection du code +
  test existant, consigné).

### B4 — isolation entre comptes (contrôle ciblé)

**Exigence fonctionnelle vérifiée** : chaque client possède **son propre stock**. Fixture de
test isolée (§ 1), **comptes et données exclusivement fictifs sur le serveur isolé**, aucun
accès à des données de production :

1. deux comptes **distincts** (A et B), deux cuisines **indépendantes** : le compte A possède
   le stock A, le compte B le stock B ;
2. **A ne peut ni lire ni modifier le stock de B** (la lecture et l'écriture de A ne montrent
   et n'affectent que le document de A) et **B ne peut ni lire ni modifier le stock de A** —
   symétriquement ;
3. **les sauvegardes, restaurations et projections historiques `fridge`/`pantry` restent
   limitées au bon compte** : l'export de A ne contient que le stock A, une restauration de A
   n'écrit que chez A, les cartes legacy projetées de chaque compte ne portent que son propre
   stock ;
4. **plusieurs appareils d'un même compte continuent à converger normalement** (déjà couvert
   par la suite de convergence, re-vérifié dans ce contexte à deux comptes) ;
5. **l'identité du propriétaire est déterminée côté serveur à partir de l'authentification** —
   vérifié dans le code : les routes kitchen résolvent la session depuis l'en-tête Bearer
   (`verifyUserSessionToken`) et adressent le document par `session.sub` (l'uid de session) ;
   **aucun identifiant de propriétaire transmis par le client n'est accepté** — la fixture
   confirme qu'un client authentifié comme A ne peut atteindre le document de B par aucun
   champ de requête, et qu'un jeton invalide ou étranger ne lit ni n'écrit rien.

**Critères d'acceptation B** : chaque garantie du tableau « preuves automatisées » est **verte
et citée** au rapport (suite, nom de test, décompte) ; les observations B1a–B1d, B2, B3 et
**B4** sont consignées avec les chiffres et preuves mesurés ; **tout écart** (présence
projetée manquante, écriture partielle, non-convergence, **fuite de stock entre comptes**,
identité acceptée depuis le client) = anomalie bloquante, suspendue pour décision du chef.

**Preuves automatisées existantes** (à relire et relancer, sans les modifier) :

| Garantie                                                             | Où elle est déjà testée                                                                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caps appliquées sur le stock fusionné, dépassement = refus explicite | `kitchenRoutes.stock.test.ts` « the caps are applied on the merged stock (explicit refusal, never a truncation) »                                   |
| Refus intégral (enveloppe invalide, quantité sans unité)             | « a quantity without its unit (or an invalid envelope) refuses the whole push, nothing partially applied »                                          |
| Aucune perte / résurrection / écrasement d'une modification valide   | suite de convergence (les 5 scénarios, les trois stores) + propriétés de fusion du core (commutative, associative, idempotente — `entries.test.ts`) |
| Idempotence et convergence après synchronisations répétées           | « three full cycles of projection → legacy push back → conversion converge to a fixed point » + convergence 2/3/7                                   |
| Purge des tombstones au-delà de la rétention (90 j)                  | « the stock tombstones are purged beyond the retention window »                                                                                     |
| Modification refusée restée pendante côté client                     | `KitchenSync.test.ts` « keeps the change pending when a push fails, and retries on the next trigger »                                               |
| Garde du dispositif réservé `server`, refus 400 sans écriture        | « the reserved device id in a pushed stock section is refused with a 400 and nothing is written »                                                   |

## 4. Campagne C — Performances (tranche l'arbitrage E4)

### 4.1 Corpus

Le **document kitchen réel** (sections existantes incluses : favoris, menu, listes nommées,
préférences) + stock à **100 / 300 / 600 entrées** et **500 / 2 000 tombstones** (tombstones
avec stub, § 4.2.1 bis du dossier F1 — leur forme est plus petite, mesurée).

### 4.2 Méthode commune (reproductibilité)

| Élément                                         | Règle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Répétitions                                     | **≥ 50 échantillons** par point mesuré au niveau route (M2, M5) ; **≥ 1 000 échantillons** pour les fonctions pures (M4) ; **≥ 20 chargements** pour M3 ; les tailles (M1a/M1b) sont des mesures ou estimations exactes, non statistiques                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Échauffements                                   | **5 exécutions échauffées et jetées** avant chaque série (chargement des modules, caches de registres alimentés, pages SQLite chaude)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Exécutions complètes                            | **deux séries indépendantes** par mesure (comme la baseline 1.4 mesurée deux fois) ; les deux résultats sont consignés côte à côte                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Conditions d'exécution                          | même poste que la baseline 1.4 ; aucune charge parallèle ; serveur isolé sur 127.0.0.1 ; fichier SQLite dans `%TEMP%` (SSD) ; ports libres ; versions (Node, tsx, better-sqlite3, knex, émulateur) et horodatages consignés au rapport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| p50 / p95 / max                                 | **méthode du rang le plus proche**, calculée par série et sur les deux séries confondues — la même méthode que la baseline 1.4 (comparaison directe possible)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Décomposition traitement / stockage / transfert | trois niveaux mesurés **séparément** : (a) les **fonctions pures du core** (validation, fusion, projection) en micro-benchmark direct ; (b) les **adaptateurs de store** directement (`put`/`get` du même document : mémoire vs SQLite) — la différence de durée entre les deux adaptateurs est un **écart comparatif observé**, pas le coût pur de persistance : elle peut intégrer d'autres coûts propres aux adaptateurs (sérialisation, verrou d'écriture…), et l'isolation précise du coût disque exigerait une instrumentation spécifique, **hors périmètre** ; (c) l'**aller-retour HTTP complet** en boucle locale (sérialisation + transfert inclus). Sans instrumentation du code (exclue — aucune modification), la part de transfert est bornée par la taille du payload (M1a) et le débit de boucle locale mesuré une fois ; la décomposition dérivée est consignée avec ses bornes, jamais présentée comme un chronométrage interne exact |
| Taille sérialisée                               | **M1a** : le **JSON exact de la valeur du document** que l'écriture porte (celui que le client pousse et que l'adaptateur stocke — pour SQLite, la colonne `data`), compté en **octets UTF-8** par sérialisation locale du document fusionné complet ; la représentation interne de l'émulateur n'est pas l'unité de mesure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 4.3 Mesures

| #   | Mesure (protocole § 10 du dossier F1)                                                                                                                                                                                                                                      | Comment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Critère                                                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1a | **Taille du payload JSON** : octets UTF-8 du document sérialisé complet, à 100 / 300 / 600 entrées + 500 / 2 000 tombstones                                                                                                                                                | sérialisation locale du document fusionné (méthode § 4.2) ; sert au **volume transféré** par push/pull (§ 4.5) et aux comparaisons entre représentations                                                                                                                                                                                                                                                                                                                                                                                                                            | valeur exacte consignée ; comparée au document actuel sans stock                                                                                                                                                                                                                                                   |
| M1b | **Taille estimée selon les règles Firestore** : estimation locale du coût de stockage du document, en suivant les **règles officielles de calcul de taille Firestore**                                                                                                     | le calcul couvre **tous les types de valeurs réellement présents** dans le document kitchen — chaînes, nombres, booléens, dates, **tableaux et objets imbriqués**, les **noms de tous les champs**, le **chemin réel du document** (collection + id), et **tout autre type effectivement utilisé par le modèle** ; **si un type n'est pas pris en charge par le calcul, le script le signale explicitement** et l'estimation est livrée comme **incomplète et signalée**, jamais présentée comme complète ; la référence officielle est citée et re-consignée à la date d'exécution | M1b comparé à la limite officielle de **1 Mio** avec la **marge de sécurité proposée** (objectif indicatif : rester **sous ~80 %** de la limite, à confirmer avec la décision E4) ; **cette estimation est indicative** — **ni une validation par l'émulateur, ni une garantie de la taille réelle en production** |
| M2  | **Coût de fusion des tombstones** : PUT avec 500 puis 2 000 tombstones                                                                                                                                                                                                     | via les vraies routes (SQLite, puis émulateur à titre comparatif)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | fusion `stock` ≤ **2×** le coût d'une section ensemble de même cardinal (critère § 10-6)                                                                                                                                                                                                                           |
| M3  | **Chargement local** : lecture + parse du document local au pire cas                                                                                                                                                                                                       | le localStorage réel du navigateur, appareil modeste **simulé** (throttling CPU documenté — jamais présenté comme un appareil réel)                                                                                                                                                                                                                                                                                                                                                                                                                                                 | coût rapporté et situé dans le démarrage ; indicateur observé                                                                                                                                                                                                                                                      |
| M4  | **Coût de la projection** `fridge`/`pantry` (présence dérivée) à 300 / 600 entrées                                                                                                                                                                                         | fonction pure du core, micro-benchmark (§ 4.2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **indicateur observé** : l'ordre de grandeur attendu reste < 1 ms ; si la mesure dépasse, elle est rapportée et justifiée — jamais traitée comme exigence arbitraire sans le support de la baseline                                                                                                                |
| M5  | **Coût de synchronisation** : un push complet (validation références + registres incluses) et un pull à volume maximum ; **y compris des pushes concurrents de plusieurs appareils du même compte** selon les niveaux du § 4.3 bis (mesure du risque de contention, § 4.4) | serveur isolé 3001, SQLite ; l'émulateur à titre comparatif                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | p95 documenté ; la baseline 1.4 (put unitaire p95 0,39–0,47 ms) sert de **repère contextuel uniquement** — un push complet embarque validation de références, registres, fusion et projection et n'est **pas directement comparable** à une écriture unitaire                                                      |
| M6  | **Comparaison baseline 1.4** : reprise des chiffres 1.4 (rattrapage, écriture, poll) au même format                                                                                                                                                                        | relecture du livrable 1.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | tableau commun, écarts justifiés                                                                                                                                                                                                                                                                                   |

### 4.3 bis — Scénarios concurrents de M5 (contention sur le même document)

Trois niveaux de concurrence, uniquement des **scénarios de mesure** : ils ne constituent
**ni des seuils de capacité, ni des garanties de performance**.

**Deux faces distinctes, conformes au protocole général (§ 4.2)** :

- **Cycles fonctionnels** : **3 cycles complets** de synchronisation par niveau — ils
  vérifient la **convergence et l'idempotence** (stocks strictement égaux, rien de pendante,
  aucune perte), pas la performance ;
- **Mesures de performance** : **≥ 50 mesures de push par niveau de concurrence (C2, C3,
  C5)**, pour **chacune des deux séries indépendantes** (méthode § 4.2 : échauffements,
  p50/p95/max au rang le plus proche).

**Déclenchement contrôlé des requêtes** : un décalage de 500 ms entre appareils ne garantit
pas que les requêtes HTTP soient réellement concurrentes (l'anti-rebond de 2 s peut les
étaler). Les mesures de performance reposent donc sur un **déclenchement contrôlé dans le
dispositif de test** : une **barrière de synchronisation** fait partir les pushs des appareils
dans une **même fenêtre** — sans dépendre de l'anti-rebond — **sans modifier le comportement
du code de production** (la barrière vit dans le harnais de test, le code des routes et des
stores est inchangé).

| Niveau | Appareils simulés (même compte) | Face fonctionnelle                            | Face performance                                                |
| ------ | ------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| C2     | 2                               | 3 cycles complets (convergence + idempotence) | ≥ 50 pushes mesurés × 2 séries, soumis ensemble via la barrière |
| C3     | 3                               | idem                                          | idem                                                            |
| C5     | 5                               | idem                                          | idem                                                            |

**Résultats à consigner pour chaque niveau** :

1. **nombre de requêtes effectivement simultanées** (constaté, pas supposé — la barrière le
   mesure) ;
2. **p50, p95 et maximum** des aller-retours de push (même méthode que le reste du
   protocole) ;
3. **requêtes sérialisées et éventuelles attentes** (combien de pushes ont attendu la fin
   d'une autre transaction sur le même document, et combien de temps) ;
4. **erreurs HTTP et refus applicatifs** (avec leurs raisons) ;
5. **convergence finale et absence de perte de données** (stocks strictement égaux sur tous
   les appareils du compte, rien de pendante, aucune enveloppe perdue ou ressuscitée).

### 4.4 Limites Firebase — strictes vs dépendantes du contexte

Les valeurs citées au rapport proviendront de la **page officielle des limites Firestore, relue
et datée à l'exécution** ; ce dossier n'affirme **aucun chiffre générique de débit** :

| Limite                                    | Nature                                                                                                                                                                                                       | Traitement dans cette étape                                                                                                                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Taille maximale d'un document : 1 Mio** | **limite stricte** imposée par Firestore (au-delà, l'écriture échoue)                                                                                                                                        | traitée par M1a/M1b + marge de sécurité (objectif indicatif ~80 %) — la limite stricte de taille totale du document **suivie spécifiquement dans cette campagne**                                                                                                                                                    |
| **Débit d'écriture par document**         | **aucun plafond universel fixe n'est retenu dans ce dossier** : la documentation officielle indique que le débit maximal dépend notamment de la fréquence d'écriture, de la contention et des index affectés | le risque de contention sur le document Kitchen est évalué par M5 au moyen des scénarios concurrents reproductibles (§ 4.3 bis) ; le rapport cite les **recommandations officielles applicables**, relues et datées à l'exécution, **sans les transformer en plafond chiffré**, et les compare à nos mesures locales |
| **Débit d'écriture agrégé par base**      | **aucune valeur générique n'est retenue comme référence de capacité pour notre application** ; les recommandations officielles applicables seront relues et datées au moment de l'exécution                  | le rapport distinguera ces recommandations des mesures locales et **ne prétendra pas démontrer la capacité de production à partir de l'émulateur** ; il conclut uniquement à partir de nos mesures locales                                                                                                           |

**Contention et hotspot sur un même document — risque décrit tel quel** : un compte = un
seul document kitchen ; **plusieurs appareils du même compte** peuvent déclencher des pushs
dans la même fenêtre : chaque push est une transaction (`DataStore.transact`) qui se
sérialise sur le même document — en concurrence, les latences s'additionnent et le backend
peut répondre lentement ou refuser. **L'anti-rebond de 2 s est par appareil : il réduit le
rythme de chaque appareil mais ne garantit pas l'absence de contention** quand plusieurs
appareils d'un même compte écrivent le même document kitchen. Ce risque est **mesuré, pas
supposé** : M5 inclut les scénarios concurrents reproductibles du § 4.3 bis (les
latences consignées) ; la suite de convergence prouve déjà que la concurrence ne perd
aucune donnée (fusion idempotente). Le rapport cite les **recommandations officielles
applicables** — sans les transformer en plafond chiffré — et les compare à nos mesures
locales.

### 4.5 Analyse mobile / connexions lentes

Déduite des mesures uniquement — octets transférés par push/pull à volume max (M1a, M5), coût
de parse local (M3). Tout risque est formulé comme « risque observé à X ms / Y Ko » avec
l'hypothèse de réseau énoncée, **jamais comme une performance théorique** ; les débits de la
production sont traités au § 4.4 (recommandations officielles applicables à relire, contexte énoncé), pas inventés.

**Issue E4 (décision du chef après lecture)** : le rapport propose, chiffres à l'appui,
**confirmer** les caps (300 par emplacement / 2 000 globales) ou les **ajuster** (dans un sens
ou l'autre, avec le chiffrage du coût et du refus explicite) — jamais une troncature
silencieuse en compensation.

## 5. Campagne D — Migration et compatibilité

| #   | Vérification                                                                                                                                               | Support                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Résultat attendu                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Conversion legacy et projection en conditions réalistes (anciennes données réelles simulées : cartes `added`/`removed` variées, deux emplacements)         | seed jetable sur le serveur isolé 3001 + tests existants relus (§ 7.1 cinq cas, § 7.4 sept cas)                                                                                                                                                                                                                                                                                                                                                                      | conversion identique client/serveur (mêmes ids, versions), projection à jour                                                                                                                                                                                      |
| D2  | **Comportement d'un client legacy réel** face aux cartes projetées (point § 17-3, pas encore exécuté) — **exécutable sans modifier le code de production** | **fixture de test isolée** (nouveau fichier dans `server/routes/`, autorisé avec l'implémentation) — **référence exacte du chemin legacy** : § 5.1                                                                                                                                                                                                                                                                                                                   | l'ancien chemin de lecture montre la présence attendue sur les sections régénérées et l'ancienne écriture est convertie par le serveur sans perte ni résurrection (rollback A, preuve (iii) § 13) — **aucune fonction de production modifiée, aucune UI touchée** |
| D3  | Appareil revenant après une longue période hors ligne (> 83 j = `STALE_DEVICE_MS`)                                                                         | tests existants (`KitchenSync.test.ts` « resets a device… », convergence 6) relus + vérification sur l'émulateur                                                                                                                                                                                                                                                                                                                                                     | reset + réadoption du serveur ; le changement hors ligne est perdu **conformément au compromis accepté § 6.3** (aucune nouvelle validation demandée) ; horloge conservée                                                                                          |
| D4  | Sauvegardes : ancien backup (sans `stock`) et nouveau (avec)                                                                                               | tests existants (`backup.test.ts`, aller-retour, `skipped`) + **un cycle manuel complet sur le serveur isolé, entre deux appareils** : **export** (appareil A, sauvegarde avec stock) → **import/restauration** (appareil B) → **synchronisation** : B pousse son état restauré, A tire et adopte — cohérence finale vérifiée des deux côtés ; le cycle inclut aussi l'import d'un **ancien** backup sans `stock` ; **restera dans le périmètre du bon compte** (B4) | contenu enrichi complet après restauration ; les deux appareils convergent ; anciens backups compatibles                                                                                                                                                          |
| D5  | Rollbacks A et B cohérents                                                                                                                                 | A : les sections legacy restent maintenues à jour par les projections (tests (i)/(ii) existants + D2) ; B : le retour passe par la sauvegarde (D4) — **aucun revert réellement exécuté**, la procédure est relue et citée                                                                                                                                                                                                                                            | procédures § 13 relues, préconditions vérifiées, statut consigné                                                                                                                                                                                                  |

### 5.1 D2 — référence exacte du chemin legacy rejoué

Le code historique est **directement disponible**, pas reconstitué de mémoire :

- **Fichier historique** : `src/infrastructure/local/localRepositories.ts` dans son état
  d'avant le lot F1 — commit **`f6cd2ed`** (« propagate deletions between devices with
  per-element versions »), le dernier état du fichier avant les modifications client du lot
  (`992039f`) ;
- **Fonctions exactes utilisées par l'ancien client pour lire les cartes `fridge` et
  `pantry`** : `parseElementSet` (relecture tolérante de la carte reçue), `mergeElementSets`
  (fusion avec l'état local) puis `presentIds` (ids visibles) — toutes trois dans
  `src/core/kitchen/elementSets.ts`, **inchangées depuis** et toujours utilisées par le code
  courant (favoris, conversion serveur) ; l'ancien `loadFridge`/`loadPantry` renvoyait la
  liste visible dérivée de ces fonctions (`f6cd2ed`, lignes `loadFridge` / `mergeElementSet`) ;
- **Ce que la fixture rejoue, exactement** : sur les sections `fridge`/`pantry` **projetées**
  produites par les vraies routes du serveur isolé, elle applique la même chaîne
  `parseElementSet → mergeElementSets → presentIds` (état local vide ou antérieur) et obtient
  les listes que l'ancien client **affichait** ; elle pousse ensuite la carte complète comme
  l'ancien client le faisait (le serveur la convertit) ;
- **Honnêteté de portée** : la reproduction est **exacte pour le chemin de lecture** (les
  mêmes fonctions, la même chaîne d'appels — ce ne sont pas des équivalents approximatifs) ;
  elle ne rejoue pas l'exécutable complet de l'ancien client (UI, écrans) — le rapport énonce
  cette limite : c'est le **chemin de données** de l'ancien client qui est vérifié, pas le
  binaire historique. La source utilisée est le commit `f6cd2ed` (cité au rapport avec son
  hash).

**Démonstration navigateur** (frigo/placard ajout/retrait avant/après migration, 4 langues ×
clair/sombre, 375 px et 320 px, sur le serveur isolé 3001) : **vérification de non-régression
uniquement** — elle ne déclenche **aucune retouche de l'interface** dans le cadre de F1 ; tout
écart constaté = anomalie signalée, pas une correction de ci de là.

**Critères d'acceptation D** : chaque ligne est close par une preuve citée (test + décompte,
ou observation documentée) ; D2 est le seul point § 17 restant exécutable ici — s'il révèle
un écart, anomalie bloquante suspendue pour décision.

## 6. Exploitabilité et traçabilité

**Rapport de l'étape 3** (`lot-F1-etape3-rapport.md`, à créer après exécution) :

1. conditions d'exécution réelles (versions, émulateur, horodatages, durées) ;
2. par campagne : commandes lancées, **résultats mesurés** (tableaux p50/p95/max, M1a/M1b,
   décomposition traitement/stockage/transfert avec ses bornes et la nature comparative de
   l'écart mémoire/SQLite), preuves citées (suite + test + décompte exact), anomalies
   éventuelles (gravité, reproduction, proposition) ;
3. **proposition E4** (caps confirmées ou ajustées) soumise à la décision du chef — jamais
   appliquée sans validation ;
4. état final : `npm run check` vert avec l'émulateur, décompte complet ;
5. ce qui reste non mesuré ou non exécutable ici, explicitement listé — dont le rappel que
   **les durées mesurées sur l'émulateur ne représentent pas la production**, que
   **l'estimation M1b est indicative** (ni validation émulateur, ni garantie de production),
   et que **les recommandations officielles de débit citées sont relues à la date d'exécution**.

**Distinction des niveaux de preuve** (demandée par le chef) :

- **Tests automatisés** : tout ce qui est exécutable par `npm test` / vitest (suites
  existantes relues et relancées, émulateur inclus, fixtures D2 et B4) — preuve reproductible ;
- **Mesures locales** : scripts de mesure jetables (§ 1, § 4) sur serveur isolé 3001,
  SQLite `%TEMP%`, émulateur — chiffres datés, conditions consignées, simulation du mobile
  **signalée comme simulation** ; **validité** : comparaison des stores entre eux et
  confirmation de l'intégration de notre code — **pas** une prédiction des performances de
  production ;
- **Vérifications sur un environnement réel** : **aucune n'est demandée pour cette étape** —
  ce que l'émulateur ne garantit pas (comportements transactionnels complets, limites de
  production dont certaines limites de taille) est couvert par la mesure locale (M1a) et
  l'estimation d'après les règles officielles avec marge (M1b), plus la relecture des limites
  documentées (§ 4.4), pas par une connexion à la production ; les seuils généraux de la
  couche données restent la décision 🚩 du chef (hors F1), avec la garde anti-dérive
  `perfSmoke` déjà en place à chaque `npm test`.

## 7. Séquence d'exécution (après autorisation) et livrables

1. **Préparation** : lancer l'émulateur ; créer les deux scripts de diagnostic et les
   fixtures D2 + B4 (seuls fichiers nouveaux, hors code de production) ; lancer le serveur
   isolé 3001 (seed jetable).
2. **Campagne A** (convergence Firestore) → `npm run check` intégral avec émulateur.
3. **Campagne B** (caps B1a–B1d, convergence B2, cas défensif B3, **isolation B4**) →
   observations consignées.
4. **Campagne C** (mesures M1a/M1b, M2–M6 + § 4.4) → tableaux + proposition E4.
5. **Campagne D** (migration et compatibilité) → D1–D5 clos ; démonstration navigateur de
   non-régression sur le serveur isolé, serveur arrêté après usage.
6. **Rapport** présenté au chef → validation → (sur autorisation distincte) commit des
   scripts de mesure + fixtures + rapport + mise à jour `docs/encyclopedie` et `CLAUDE.md`
   — jamais de push ni de merge.
7. **Nettoyage** : fichiers `%TEMP%` supprimés, émulateur arrêté, `tmp-debug.test.ts` toujours
   hors commit (sa suppression reste en attente d'une commande directe).

**Critères de clôture de F1** (rappel § 16 du dossier validé) : les 9 scénarios sur les trois
stores (A), les caps tranchées par mesure (B + C, décision E4 du chef), les points § 17-2/3/5
clos (B/D), l'isolation entre comptes démontrée (B4), `npm run check` vert, docs à jour —
sans aucune donnée réelle touchée, sans connexion à une production.
