# Lot F1 — Dossier d'exécution A3 : gestion de `sessionMax` lors des retries Firestore

> **Statut** : **clôturé le 20/11/2026** (mise à jour d'en-tête du 25/11, suivi X-08 : la clôture
> du 20/11 fait foi — v4 était la version finale intégrée). Précisions finales de v4 :
> **ordre strict des opérations dans `readStampTx`** (une estimation refusée ne contamine jamais
> les maxima de tentative) et **garanties explicites de l'absorption** (§ 3.4). La correction
> A2+A3 est **committée** (`d4d3d08`, 25/11) avec ses suites dédiées
> (`firestoreStore.attempt.test.ts` ×10, `firestoreStore.order.test.ts` ×8) et intégrée dans
> `develop` (PR #60). La validation émulateur de l'état commité reste [À DÉMONTRER] (JDK 21).
> v4 (dernière correction demandée par le chef) : **trois composantes d'état** — `seed`
> (historique validé au début de l'appel), **`attemptHighWater`** (maximum estimé au cours de
> **toutes** les exécutions du callback de cet appel, préservé entre retries) et `assigned`
> (estimations de l'**exécution courante**, réinitialisée à chaque retry). La rétrogradation
> **entre deux exécutions** est désormais détectée par `attemptHighWater` — le scénario du
> chef (estimation `2` abandonnée, compteur rabattu à `0`, relance estimant `1`) est
> **refusé** ; la ré-estimation identique après retry reste **acceptée** ; le double
> estampillage dans une même exécution reste **refusé** ; l'absence de faux positifs entre
> **appels indépendants concurrents** est démontrée (`attemptHighWater` est **propre à
> l'appel**). L'absorption au succès n'embarque **que les estimations validées de la dernière
> exécution** — `sessionWritten` reste strictement « maximum validé ». Décisions préservées
> (non rouvertes) : `sessionWritten` et la séparation validé/tentative, `seed` et `assigned`,
> la réinitialisation de `assigned` à chaque exécution, le traitement du conflit de `commit`,
> le regroupement des ops par collection, la séparation lecture/écriture d'A2, le périmètre
> limité à l'adaptateur Firestore. La validation de ce dossier **n'est pas** une autorisation
> d'implémentation. Fondé sur le code réellement présent après A2 (lot A2 validé et clôturé
> le 2026-11-20). Ne rouvre aucune décision validée (D-V1..D-V6, dossier v4.10). Ne commence
> ni A1 ni A4.

## 1. Le problème (anomalie A3, démontrée par la campagne A2)

**Échec actuel (campagne émulateur du 2026-11-20, l'unique échec restant après A2)** :

- **Test** : `server/storage/contract.ts` l. 233 — « serialises concurrent transacts on the
  same document: no read-merge-write loses a section » — six `transact` concurrents sur
  `kitchen/u1` (la forme exacte de deux appareils poussant des sections simultanément).
- **Erreur** : `sync_counter_corrupt` — « counter behind the observed maximum on kitchen:
  next=1 but this session already wrote 1 », levée à `readStampTx` (`firestoreStore.ts` l. 88)
  depuis `transact` (l. 389).

**Comportement actuel du code (après A2)** :

- `sessionMax` (l. 45) est une **Map partagée par tout le processus**, mutée **pendant** la
  tentative transactionnelle : `readStampTx` lit `sessionMax` (l. 83), refuse si
  `next <= observed` (l. 84-89) puis **avance `sessionMax` immédiatement** (l. 90) — avant
  que la transaction ait été validée ;
- sous contention, Firestore **abandonne** une tentative (conflit de lecture-écriture) et
  **relance** le callback de la même transaction ; l'estampillage d'une tentative
  **abandonnée** est resté dans `sessionMax` — la relance (et tout appel concurrent du même
  processus) lit un maximum qui ne correspond à **rien de validé** : `next` recalculé à
  partir de lectures fraîches est derrière → **refus erroné**. Le refus n'est pas un abandon
  Firestore : la transaction entière échoue au lieu d'être relancée.

**Conséquence** : toute contention réelle (plusieurs appareils poussant en même temps) peut
faire échouer un `put`/`commit`/`transact` avec un faux `sync_counter_corrupt` — une
corruption **jamais survenue** est signalée et l'opération est perdue au lieu d'être
relancée. Le mécanisme de sérialisation du compteur (conflit d'écriture + relance) fait
exactement son travail ; c'est l'état de session muté trop tôt qui le sabote.

## 2. Périmètre

**Dans le périmètre** :

- `server/storage/firestoreStore.ts` — **uniquement** la tenue des maxima :
  - `sessionMax` (l. 45) remplacé par les registres du § 3.1 ;
  - `readStampTx` (l. 65-93) : même calcul de `next` ; la garde reste un **refus bruyant
    avant toute écriture** (code et log inchangés), ancrée sur l'état de la tentative
    (paramètre) au lieu de la Map de session ;
  - `put` (l. 311), `remove` (l. 323), `commit` (l. 335), `transact` (l. 378) : création de
    l'état de tentative à l'appel, **réinitialisation de `assigned` à chaque exécution du
    callback** (§ 3.4), absorption **après** la résolution de `runTransaction` ;
  - commentaire d'en-tête mis à jour (sémantique « maximum validé »).

**Hors périmètre** :

- la **structure en deux phases d'A2** (lectures puis écritures) : intouchée — `readStampTx`
  reste une phase de lecture pure, `writeStampTx` (l. 96-99) inchangé ;
- le **contrat** `DataStore` (`server/storage/types.ts`), `server/auth/users.ts`, les autres
  adaptateurs (`memoryDataStore.ts`, `sqlStore.ts`, `relationalPilot.ts`), le domaine, les
  stores, l'interface : intacts ;
- **A1** (limite HTTP) et **A4 α** (quarantaine) : lots suivants, non commencés.

## 3. Solution proposée

### 3.1 État : un registre validé et trois composantes de tentative

1. **`sessionWritten`** — maximum **validé** par collection : la plus haute révision que ce
   processus a **effectivement commitée** (accusé de réception de `runTransaction`). Avancée
   **uniquement après le succès** (absorption, § 3.4), jamais pendant une tentative.
2. **`attemptMaxima`** — état **d'un appel** (`put`/`remove`/`commit`/`transact`),
   **trois composantes** :
   - **`seed`** : copie de `sessionWritten` à l'instant de l'appel — l'**historique validé**
     avant l'appel ; **traverse toutes les exécutions du callback** ;
   - **`attemptHighWater`** : maximum **estimé** au cours de **toutes les exécutions du
     callback de cet appel** — préservé **entre les retries** (c'est lui qui détecte une
     rétrogradation survenue entre deux exécutions) ; jamais absorbé dans
     `sessionWritten` (une estimation abandonnée n'est jamais validée) ;
   - **`assigned`** : les estimations de **l'exécution courante** — **réinitialisée au début
     de chaque exécution** du callback.
   L'état est créé **à chaque appel** et **jeté en cas d'échec** (une tentative abandonnée
   ne laisse **rien** dans `sessionWritten`).

### 3.2 Vérification du chemin de conflit de `commit` (vérifié contre le code réel)

Dans `commit` (l. 336-338), la garde (`guardValue`) est la **première instruction** de la
transaction ; le retour `{ ok: false, conflict: true }` précède donc **tout appel à
`readStampTx`** — au retour de conflit, la tentative ne contient **aucune estimation**
(seulement la copie `seed`, par construction ≤ `sessionWritten`) et l'absorption est un
**no-op** : `sessionWritten` n'avance pas. L'affirmation est **démontrée et testée**
(§ 5, cas 6) plutôt que supposée : un test assertionne qu'un conflit sans écriture ne
modifie pas `sessionWritten` (vérifié par la séquence attendue de l'appel suivant). Si une
évolution future dépliait la garde après l'estampillage, ce test échouerait et le
signalerait. La réinitialisation de `assigned` en tête de callback est **sans effet** sur ce
chemin (une Map vide reste vide).

### 3.3 Relances, estampillages — démonstration par chemin et comptage des appels

**Comptage des appels à `readStampTx` pour une même collection pendant UNE exécution du
callback** — vérifié contre le code réel :

| Chemin | Appels possibles par collection et par exécution | Justification dans le code |
| --- | --- | --- |
| `put` (l. 311-317) | **1** | un appel inconditionnel, seul site d'estampillage de la méthode |
| `remove` (l. 323-329) | **1** | un appel inconditionnel, seul site d'estampillage de la méthode |
| `transact` (l. 378-391) | **1** | un appel, dans l'unique bloc d'écriture `if (outcome.next && outcome.next !== current)` |
| `commit` (l. 341-348) | **1 par collection distincte**, quel que soit le nombre d'ops | les ops sont **regroupés par collection avant estampillage** : `if (!revisions.has(op.name)) revisions.set(op.name, await readStampTx(...))` — la mémoïsation interdit un second appel pour la même collection dans la même exécution |

**Conclusion : deux estampillages de la même collection dans une même exécution du callback
sont impossibles par construction** dans les quatre chemins. La garantie est **verrouillée
par un test structurel de non-régression** (§ 5, cas 8).

**Causes de relance, chemin par chemin** (la propriété « relance ⇒ compteur avancé » n'est
pas supposée) :

1. **Compteur modifié** → la relecture fraîche donne un compteur ≥ celui de l'exécution
   abandonnée → `next` **strictement supérieur** à l'estimation précédente.
2. **Document ou plage modifié(e) par une écriture passant par cet adaptateur** : toute
   écriture de cet adaptateur estampille aussi le compteur de sa collection dans la même
   transaction (`writeStampTx`) → conflit document ⇒ conflit compteur → cas 1. (Socle :
   collections écrites exclusivement via `DataStore` — règles deny-all côté client ; une
   écriture externe est précisément la corruption que la garde détecte.)
3. **Document de garde modifié** : dans le code actuel, l'unique usage d'une garde
   (`createAccount`) porte sur une collection **présente dans les ops** → cas 1. **Le
   contrat n'interdit pas une garde hors ops** : une relance peut alors survenir **sans
   qu'aucun compteur de la tentative n'ait avancé** — la nouvelle exécution recalcule
   **exactement la même estimation** (situation A).
4. **Abandon sans cause identifiable côté SDK** : ne peut pas être exclu a priori — même
   conséquence : situation A possible en général. Et une **rétrogradation externe peut
   survenir entre deux exécutions** (situation du chef : estimation `2` abandonnée, compteur
   rabattu, relance estimant `1`) — elle doit être **refusée**.

**Conclusion** : trois situations à distinguer, trois comportements — ré-estimation
identique après relance (A) **acceptée** ; rétrogradation entre exécutions **refusée** ;
deuxième estimation dans une même exécution (B) **impossible aujourd'hui et refusée par la
garde elle-même**.

### 3.4 Mécanique : garde à trois critères, `assigned` par exécution, `attemptHighWater` par appel

- `readStampTx(tx, name, attempt)` : calcul de `next` inchangé (compteur, sonde de repli) ;
  **`sessionWritten` n'est jamais lu pendant la tentative** — seule la copie `seed` compte ;
- **`assigned` est réinitialisée au début de CHAQUE exécution du callback** (première
  instruction de la transaction ; sans effet sur le chemin de conflit de `commit`, § 3.2) ;
- **Garde** (refus bruyant `sync_counter_corrupt` **avant toute écriture**, log et code
  inchangés) — **l'ordre des critères est significatif** :

| # | Situation | Comportement |
| --- | --- | --- |
| 1 | `next <= seed[name]` | **Refus** : le compteur frais est derrière l'**historique validé** (rollback externe avant l'appel, **borne incluse** : seed = 5, compteur rabattu à 4 → `next = 5 <= 5` → refus) |
| 2 | `next <= assigned[name]` | **Refus** : deuxième estimation dans la **même exécution** (situation B — jamais deux estampillages à la même révision dans une transaction) |
| 3 | `next < attemptHighWater[name]` | **Refus** : le compteur est repassé **derrière une estimation d'une exécution antérieure du même appel** — rétrogradation **entre deux retries** (scénario du chef) |
| 4 | `next == attemptHighWater[name]` (nouvelle exécution) | **Accepté** : ré-estimation **identique** après relance — l'estimation antérieure n'a **jamais été validée** (l'exécution qui l'a faite est abandonnée, rien n'a été écrit) ; si un concurrent a pris cette révision, l'écriture du compteur **entre en conflit** → nouvelle relance → estimation strictement supérieure |
| 5 | `next` supérieur aux maxima | **Accepté** : `assigned[name] = next` ; `attemptHighWater[name] = max(attemptHighWater, next)` |

**Ordre strict des opérations dans `readStampTx`** — une estimation refusée ne contamine
jamais les maxima de tentative :

1. **Calculer `next`** (compteur, ou sonde de repli si le compteur est absent) ;
2. **Vérifier les trois conditions de refus, dans l'ordre défini** : `seed` (critère 1),
   `assigned` (critère 2), `attemptHighWater` (critère 3) ;
3. **Si une condition est violée → lever `sync_counter_corrupt` immédiatement**, avant toute
   écriture et **sans modifier les maxima** (`assigned` et `attemptHighWater` restent en
   l'état ; la tentative sera jetée si l'appel échoue) ;
4. Si toutes les vérifications passent, **mettre à jour `assigned[name]`** (estimation de
   l'exécution courante) ;
5. **Mettre à jour `attemptHighWater[name]`** (maximum monotone de l'appel) ;
6. **Retourner la révision** (l'écriture du compteur suit en phase 2, via `writeStampTx`).

- **Absorption au succès** — quatre garanties explicites :
  - **seules** les valeurs de `assigned` de la **dernière exécution effectivement réussie**
    sont absorbées (celles effectivement écrites) ;
  - **`attemptHighWater` n'est jamais absorbé** (une estimation abandonnée n'est jamais
    validée) — **le `seed` non plus** (déjà contenu dans `sessionWritten`) ;
  - l'absorption **conserve le maximum** : `sessionWritten.set(name, max(sessionWritten,
    assigned[name]))` — jamais un recul ; `sessionWritten` garde sa sémantique stricte
    « maximum validé » ;
  - **aucun échec, abandon ou retour de conflit ne provoque d'absorption** : la tentative
    est jetée telle quelle — **y compris le retour `{ ok: false, conflict: true }` de
    `commit`** (§ 3.2 : `assigned` y est vide, l'absorption est un no-op de toute façon).
- Les quatre méthodes d'écriture suivent le même schéma :
  `const attempt = { seed: new Map(sessionWritten), highWater: new Map(), assigned: new Map() };
  const r = await runTransaction(tx => { attempt.assigned.clear(); ... }); absorb(attempt); return r;`
  (pour `commit`, la réinitialisation précède la garde — sans effet sur le chemin de
  conflit, § 3.2).

### 3.5 Pourquoi les quatre objectifs sont satisfaits simultanément

1. **Ré-estimation identique après retry acceptée** (objectif 1) : `assigned` est vide en
   début de nouvelle exécution ; si le compteur n'a pas avancé, `next == attemptHighWater`
   → critère 4 → accepté.
2. **Rétrogradation réelle refusée** (objectif 2) : derrière l'historique validé → critère 1
   (borne incluse) ; **entre deux exécutions du même appel** → critère 3 (`attemptHighWater`
   a préservé l'observation abandonnée — correction du point bloquant du chef : `seed` seul
   ne couvre pas les estimations des exécutions abandonnées) ; au sein d'une même
   exécution → critère 2.
3. **Aucune double attribution dans une même exécution** (objectif 3) : impossible par
   structure (§ 3.3) **et** refusé par le critère 2.
4. **Aucun faux positif entre appels indépendants concurrents** (objectif 4) :
   - `attemptHighWater` est **propre à l'appel** — les estimations d'un appel concurrent ne
     l'alimentent pas ; un appel ne peut donc jamais « voir » le maximum d'un autre ;
   - `seed` ne contient que des succès **antérieurs à l'appel** : les lectures Firestore
     étant fortement cohérentes et l'instantané établi après le début de l'appel, la lecture
     du compteur voit **au moins** le `seed` → `next ≥ seed + 1` → le critère 1 ne peut pas
     se déclencher sur un concurrent déjà validé ;
   - **instantané antérieur à un commit concurrent** (le cas visé par le chef) : une
     exécution lit un compteur **derrière** un succès concurrent → son estimation peut être
     ≤ la révision validée par l'autre appel — mais **le critère 1 ne la voit pas** (le
     concurrent n'est pas dans notre `seed`) et **le critère 3 non plus** (notre
     `attemptHighWater` est le nôtre) : l'estimation est acceptée, et l'écriture du compteur
     **entre en conflit** avec celle du concurrent (même document) → abandon → la relance
     relit un état plus frais → estimation strictement supérieure → succès. Deux appels ne
     peuvent **jamais** valider la même révision : toute écriture estampillée écrit aussi le
     compteur ;
   - un concurrent **en vol** pendant notre appel n'a rien absorbé (pas de `seed` nouveau) —
     symétrique du point précédent.
5. **Corruption réelle toujours refusée bruyamment** : rétrogradation externe (rollback
   physique) avant l'appel → critère 1 ; entre deux exécutions → critère 3 ; dans une même
   exécution → critère 2. Conséquence assumée : une rétrogradation détectée **échoue
   bruyamment** l'appel (aucune absorption — `sessionWritten` reste strictement « maximum
   validé ») et les appels suivants refusent à leur tour (leur `seed`/lecture fraîche
   re-détectent le compteur rabattu) : ne jamais continuer silencieusement sur une base
   rabattue.

### 3.6 Interaction avec A2 — frontière

A2 a scindé lecture/écriture ; A3 ne change **que la tenue des maxima** : même signature
interne élargie d'un paramètre, même ordre des lectures, mêmes écritures. Les **4 tests
d'ordre d'A2 restent verts sans modification** (leur double ne relance pas : une exécution
unique, `assigned` vidé en tête puis rempli — comportement inchangé). Le test actuellement
en échec (§ 1) est le **reproductible avant/après** d'A3.

## 4. Risques et compatibilité permanente Firebase / SQL

| Élément | Analyse |
| --- | --- |
| Modèle cible | **Aucun changement de modèle** — tenue interne des maxima de l'adaptateur |
| Compatibilité Firestore | Les écritures transactionnelles sont identiques ; s'appuie sur deux garants **documentés** du SDK : lectures fortement cohérentes, relance sur abandon avec relecture fraîche ; la sérialisation par conflit sur le compteur est inchangée ; les relances sans avancement du compteur sont tolérées par construction (critère 4) |
| Compatibilité SQL | `sqlStore` intouché ; contrat inchangé ; le harnais de contrats reste le garant commun (mémoire + SQL + Firestore émulateur) |
| Contrat de stockage | Aucune opération, signature ou sémantique d'échec modifiée (le retour de conflit de `commit` est inchangé, § 3.2) |
| Données existantes | Aucun impact — le registre est en mémoire, reconstruit par absorption à partir des succès |
| Tests | Harnais de contrats inchangé (le test en échec devient le reproductible) ; nouveaux tests de tentative (§ 5, cas 1-10) ; suites existantes vertes |
| Limites | Une rétrogradation détectée échoue bruyamment l'appel et les suivants (voulu) ; plusieurs processus serveur : chacun tient son propre registre — l'unicité globale repose sur la sérialisation du compteur, inchangée ; l'argument « toute écriture estampille son compteur » repose sur l'écriture exclusivement adaptateur-possédée des collections — toute écriture externe est la corruption que la garde détecte ; l'impossibilité d'un second estampillage par exécution est **structurelle et testée** (cas 8), et la garde la refuse de toute façon (critère 2) |

## 5. Tests

**Nouveau fichier `server/storage/firestoreStore.attempt.test.ts`** (créé seulement après
autorisation ; le fichier d'A2 reste **intouché**) — un double Firestore appliquant la règle
de production **et la relance** (abandon simulé entre deux exécutions du callback, relecture
fraîche — ou modifiée — entre les tentatives). Cas :

1. **Contention simulée entre appels concurrents** : deux écritures imbriquées, la première
   validée entre les deux exécutions de la seconde → la seconde **réussit à la relance** avec
   une révision **strictement supérieure**, révisions **distinctes**, **aucun faux
   `sync_counter_corrupt`** ;
2. **Situation A — retry avec compteur inchangé** : la première exécution lit le compteur à
   1 et estime `next = 2` ; l'abandon est provoqué par un **conflit sur un document autre
   que le compteur** (simulation délibérément adversariale) ; **le compteur reste à 1** → la
   relance recalcule `next = 2 == attemptHighWater` → **acceptée** (critère 4), l'écriture
   réussit, révision 2 validée, **aucun faux `sync_counter_corrupt`** ; variante : le
   compteur **avance** entre les exécutions → estimation strictement supérieure → succès
   aussi ;
3. **Tentative abandonnée sans état résiduel** : forcer l'échec de la première tentative d'un
   appel, puis un **appel ultérieur** distinct recalcule ses révisions depuis la base
   fraîche sans aucun refus erroné ;
4. **Rétrogradation réelle refusée bruyamment — trois niveaux** : (a) compteur rabattu
   derrière l'historique validé **avant l'appel** → refus par le critère 1, **borne
   incluse** (seed = maximum validé, compteur rabattu à maximum − 1) ; (b) **rétrogradation
   entre deux retries** (scénario du chef : estimation `2` abandonnée, compteur rabattu à
   `0`, relance estimant `1`) → refus par le **critère 3** — le § de la v3 qui attribuait
   cette détection au seul `seed` est corrigé ; (c) dans une même exécution → critère 2.
   Dans tous les cas : refus **avant toute écriture** (trace sans `set`) ;
5. **Absorption au succès seulement, validée seulement** : une transaction qui échoue ne
   change pas `sessionWritten` ; **une absorption n'embarque jamais `attemptHighWater`** —
   après un appel réussi, `sessionWritten` vaut exactement la plus haute révision
   effectivement écrite (l'appel suivant estime la séquence attendue, sans trou ni refus) ;
6. **Conflit de `commit` sans écriture** (§ 3.2) : garde violée → `{ ok: false,
   conflict: true }` → **assertion explicite** : `sessionWritten` n'a pas avancé — l'appel
   suivant, une fois la condition levée, estime la révision attendue **sans trou ni
   refus** ;
7. **Régressions des quatre méthodes** : `put`, `remove`, `commit` (y compris la forme
   `createAccount`), `transact` — révisions, ordre des lectures/écritures et atomicité
   inchangés (mêmes assertions de trace qu'A2) ;
8. **Situation B — non-régression structurelle du comptage des estampillages** : pour chacun
   des quatre chemins, la trace d'**une** exécution du callback montre **au plus une lecture
   de compteur par collection** ; `commit` avec **deux ops sur la même collection** →
   **exactement une lecture de compteur** et deux écritures de documents → **aucune
   attribution accidentelle de la même révision n'est possible dans une transaction** ;
9. **Appels indépendants concurrents dans le même processus — absence de faux positifs** :
   plusieurs appels imbriqués où un concurrent **valide une révision entre deux exécutions
   de l'autre** → l'appel en relance estime **plus haut** (ou identique, puis conflit de
   compteur → relance) → **succès, révisions distinctes, aucun refus erroné** ; variante
   « instantané antérieur à un commit concurrent » : l'estimation d'une exécution est
   **derrière** la révision d'un concurrent déjà validé → **acceptée puis sérialisée par le
   conflit de compteur** (§ 3.5, point 4) — jamais un `sync_counter_corrupt` ;
10. **Rétrogradation entre retries, puis reprise** (chaîne complète) : l'appel en échec
    (cas 4b) est **jeté sans absorption** ; après **correction de la base** (compteur
    restauré au-dessus de l'historique validé), un nouvel appel reprend et converge vers la
    séquence attendue (reprise après échec).

**Suites existantes** (aucune modification) :

- **Reproductible avant/après** : `server/storage/contract.ts` l. 233 — **en échec avant le
  correctif** (constaté par la campagne A2 du 2026-11-20), **vert après** ; **ce test ne
  présume pas couvrir à lui seul toutes les causes de relance** — les cas 2, 4, 8, 9 et 10
  du double (§ 5) forcent les relances sans avancement du compteur, les rétrogradations
  (trois niveaux), le comptage des estampillages et la concurrence entre appels, que la
  contention naturelle ne produit pas de façon déterministe ;
- sans émulateur : `npm test` — référence actuelle **1 064 passés / 0 échec / 35 skippés /
  113 fichiers** ;
- avec émulateur (commande autorisée du lot A2) : référence actuelle **1 090 / 1 échec (A3) /
  8 skippés / 113** — attendu après correctif : **l'échec A3 passe, 0 échec**, plus les
  nouveaux tests ;
- `npm run check` : la dette préexistante (fichiers non suivis de l'étape 3, hors périmètre)
  est attendue **inchangée** — aucun diagnostic sur les fichiers d'A3.

## 6. Critères d'acceptation

1. **Reproduction démontrée** : le test de `contract.ts` l. 233 est en échec avant le
   correctif (constat A2) et **passe après** ;
2. Les nouveaux tests de tentative (§ 5, cas 1-10) passent — **dont la situation A** (cas 2),
   **la rétrogradation entre deux retries** (cas 4b — le point bloquant du chef),
   **l'absence de faux positifs entre appels concurrents** (cas 9), **la situation B**
   (cas 8) et **l'assertion de non-avancement de `sessionWritten` au retour de conflit de
   `commit`** (cas 6) ;
3. Campagne **sans** émulateur : **0 échec** (référence + nouveaux tests, aucune régression) ;
4. Campagne **avec** émulateur : **0 échec** — l'unique échec restant du lot A2 est corrigé,
   aucun échec nouveau **non classé** ;
5. La protection `sync_counter_corrupt` est démontrée **conservée** (cas 4 : les trois
   niveaux de rétrogradation refusés bruyamment avant toute écriture) ;
6. `git diff` limité à `firestoreStore.ts` + le nouveau test + la documentation ;
7. Documentation à jour (dossier passé en « exécuté et validé ») ; **commits uniquement sur
   autorisation distincte** ;
8. Rapport livré : modifications précises (fichier, fonctions, lignes), résultats
   avant/après des campagnes, limites restantes (A1, A4 α, lot 1.5), environnement conservé.

## 7. Livrables et séquence (après validation PUIS autorisation)

1. Refactor `firestoreStore.ts` (§ 3) — aucun autre fichier de code modifié ;
2. `firestoreStore.attempt.test.ts` ;
3. `npm test` sans émulateur, campagne émulateur (même commande autorisée que pour A2, sur
   votre autorisation distincte), `npm run check` ;
4. mise à jour documentaire ;
5. rapport du lot ;
6. validation du chef du rapport → lot suivant (**A1**), autorisation distincte.

Aucun push, merge, nettoyage ou arrêt de l'émulateur — l'environnement (17 commits locaux,
travaux non commités, émulateur PID 52504 sur 8080/4000) est préservé.
