# Lot F1 — Dossier d'exécution A2 : Firestore en deux phases (lecture avant écriture)

> **Statut** : proposé — **v2** — validé par le chef, implémentation exécutée le 2026-11-20
> (rapport livré ; campagne émulateur exécutée sur autorisation distincte le 2026-11-20 :
> 1 090 passés / **1 échec restant = A3** / 8 skippés / 113 fichiers — aucun échec A2).
> v2 : séparation explicite des démonstrations A2 (ordre légal dès la première tentative,
> atomicité — **aucun cas n'exige une relance**) et A3 (relances concurrentes,
> `sessionMax`, révisions après relance) ; harmonisation des critères d'acceptation.
> La validation de ce dossier **n'est pas** une autorisation d'implémentation : celle-ci sera
> donnée séparément et explicitement. Fondé exclusivement sur le code réellement présent
> (branche `feature/datastore-contract`, 17 commits locaux préservés). Ne rouvre aucune
> décision validée (D-V1..D-V6, v4.10).

## 1. Le problème (anomalie A2, rapport étape 3)

**Règle Firestore production** : à l'intérieur d'une transaction, **toutes les lectures
doivent précéder toutes les écritures**. Un `get` exécuté après un `set` dans la même
transaction fait échouer la tentative (et, après épuisement des relances du SDK, la
transaction entière).

**Code actuel** — `server/storage/firestoreStore.ts` :

- `stampTx` (l. 64-86) lit le compteur (`tx.get(counterRef)`, l. 65), **puis** écrit le
  compteur (`tx.set(counterRef, { next })`, l. 83). Pour une écriture d'une seule
  collection, la règle est respectée (lecture, puis écriture).
- `commit` (l. 316-341) **entrelace** lecture et écriture dès que le lot touche plusieurs
  collections : pour chaque opération, il appelle `stampTx` (lecture du compteur, l. 328)
  puis `tx.set` (l. 330-331) **avant** de passer à la collection suivante, dont `stampTx`
  relit un compteur **après** l'écriture de la précédente (l. 328 > l. 330) ;
- cas aggravant : compteur absent (base fraîche, import, rollback) — la sonde
  `tx.get(table(name).orderBy('revision','desc').limit(1))` (l. 67-69) est elle aussi une
  lecture, exécutée après les écritures des collections précédentes du même lot.

**Conséquence production** : `createAccount` (`server/auth/users.ts`, l. 134-142) commite
`users` + `auth` + `email_index` **dans un seul `commit` atomique** (garantie d'unicité de
l'adresse par la garde `email_index`, jamais par un pré-contrôle). En production, la
deuxième lecture de compteur survient après la première écriture → tentative refusée,
relances toutes identiques, **échec définitif : toute création de compte échoue**.

**Pourquoi les tests passent** : l'**émulateur** Firestore ne sanctionne pas l'ordre
lecture/écriture ; les suites (`firestoreStore.test.ts`, `identity.test.ts`,
`contention.test.ts`, `users.test.ts`) passent donc sur l'émulateur alors que la production
échouerait. L'écart n'est visible qu'en production — c'est le caractère grave de A2.

**Principe respecté** : la correction est un **refus explicite du comportement invalide**
(l'adaptateur cesse d'émettre une transaction illégale), pas une troncature ni un
contournement silencieux ; l'atomicité du `commit` et la garantie de la garde sont
**préservées à l'identique**.

## 2. Périmètre

**Dans le périmètre** :

- `server/storage/firestoreStore.ts` — **uniquement** le mécanisme d'estampillage et le
  `commit` multi-collections :
  - `stampTx` (l. 64-86) scindé en une **phase de lecture** (compteur + sonde de repli,
    calcul de `next`, contrôle `sync_counter_corrupt`, `sessionMax` — sémantique inchangée)
    et une **phase d'écriture** (`tx.set` du compteur) ;
  - `commit` (l. 316-341) restructuré en **deux phases** : toutes les lectures d'abord
    (garde + compteurs + sondes des collections touchées), toutes les écritures ensuite
    (compteurs, puis documents) ;
  - `put` (l. 299-304), `remove` (l. 307-312), `transact` (l. 344-369) : appel des deux
    demi-fonctions dans le même ordre qu'aujourd'hui (lecture puis écriture) — **aucun
    changement de comportement**, une seule collection reste dans l'ordre légal.

**Hors périmètre** :

- le **contrat** `DataStore` (`server/storage/types.ts`) : signature, `CommitResult`,
  sémantique de la garde — inchangés ;
- `server/auth/users.ts` : aucun changement — `createAccount` continue d'appeler
  `store.commit` tel quel (c'est l'adaptateur qui devient légal) ;
- les autres adaptateurs (`memoryDataStore.ts`, `sqlStore.ts`, `relationalPilot.ts`) :
  intacts ;
- le **domaine**, les **stores applicatifs**, l'**interface** : intacts ;
- **A3** (gestion de l'état lors des retries — `sessionMax` avancé pendant la tentative) :
  lot **suivant**, non traité ici (§ 4).

## 3. Solution proposée

### 3.1 Principe

Dans `runTransaction`, **toutes les lectures de la phase 1 précèdent toute écriture de la
phase 2**. La concurrence reste arbitralisée par Firestore : les documents compteurs sont
toujours écrits (`tx.set`) dans la transaction, donc deux commiteurs concurrents touchant
les mêmes compteurs se sérialisent par contention — les relances refont la phase 1 avec des
lectures fraîches. Les révisions restent **séquentielles, distinctes et assignées par
l'adaptateur** — les garanties actuelles de `stampTx` sont conservées.

### 3.2 Refactor précis

`stampTx` devient deux fonctions :

1. **`readStampTx(tx, name): Promise<number>`** — toute la partie lecture :
   `tx.get(counterRef(name))` ; si le compteur est absent, la **sonde** de repli
   (`tx.get(table(name).orderBy('revision','desc').limit(1))`) ; calcul de `next` ;
   contrôle `next <= sessionMax` → `sync_counter_corrupt` (garde **conservée**, refus
   bruyant inchangé) ; `sessionMax.set(name, next)` — **sémantique identique à
   aujourd'hui** (le déplacement de `sessionMax` au succès est l'affaire de A3, § 4).
2. **`writeStampTx(tx, name, revision)`** — `tx.set(counterRef(name), { next: revision })`.

Appels :

- `put` / `remove` / `transact` : `readStampTx` puis `writeStampTx` — ordre strictement
  identique à l'actuel (lecture, puis écritures) ;
- `commit` :
  1. **Phase de lecture** : garde (`guardValue`, l. 322 — inchangé, première lecture), puis
     pour chaque collection touchée **dans l'ordre de première apparition** dans `ops` :
     `readStampTx` — y compris la sonde en cas de compteur absent. **Aucune écriture n'a
     encore eu lieu.**
  2. **Phase d'écriture** : pour chaque collection, `writeStampTx` (compteur), puis les
     `tx.set` des documents de cette collection avec la révision partagée (une révision par
     collection, tous ses `ops` ensemble — inchangé, l. 327-333) ;
  3. le `catch` et le repli `guardViolated` (l. 334-340) sont inchangés (lecture hors
     transaction, après l'échec).

### 3.3 Invariants préservés

- **Atomicité** : un `commit` reste un seul `runTransaction` — tout ou rien ;
- **Garde d'unicité** : la garde est lue **avant** toute écriture (elle l'est déjà) — deux
  inscriptions concurrentes de la même adresse ne peuvent pas toutes deux la passer ;
- **Révisions** : séquentielles par collection, partagées par collection au sein d'un lot,
  assignées par l'adaptateur (horloge jamais utilisée) — le change feed et ses groupes de
  curseur ne voient **aucune différence** ;
- **`sync_counter_corrupt`** : la protection est **conservée** (décision du chef) — seul
  l'instant où `sessionMax` est mis à jour dans la tentative reste celui d'aujourd'hui (A3
  le déplacera au succès de la tentative) ;
- **Refus, jamais de troncature** : aucun chemin nouveau ne supprime ou limite une écriture.

## 4. Interaction avec A3 — frontière explicite

`sessionMax` est avancé **pendant** la tentative (l. 82) : sur une relance Firestore, la
tentative suivante observe un `next` derrière le maximum déjà enregistré → faux
`sync_counter_corrupt`. C'est **A3**, lot suivant, qui corrige cela (Map locale par
tentative, avance au succès — garde conservée).

- A2 **ne change pas** la sémantique de `sessionMax` : le même code, appelé depuis la phase
  de lecture ;
- sur l'émulateur, la contention est rare : les suites actuelles ne révèlent pas A3 — elles
  ne le masquent pas davantage après A2 ;
- **le dossier A2 ne contient aucun cas de test exigeant une relance** : la contention
  complète (relance concurrente, absence de faux `sync_counter_corrupt`, révisions correctes
  après relance) est démontrée en **A3**, une fois sa correction en place ;
- le dossier A3 reprendra cette frontière et les tests de contention (relances simulées)
  la démontreront.

## 5. Risques et compatibilité permanente Firebase / SQL

| Élément | Analyse |
| --- | --- |
| Modèle cible | **Aucun changement de modèle** — restructuration interne de l'adaptateur |
| Compatibilité Firestore | La transaction redevient légale en production (toutes lectures avant toutes écritures) ; sémantique transactionnelle documentée du SDK inchangée ; les relances conservent leur comportement |
| Compatibilité SQL | `sqlStore` intouché ; le contrat `DataStore` est inchangé — le harnais de contrats reste le garant commun ; aucune structure nouvelle à migrer |
| Contrat de stockage | Aucune opération nouvelle ; `commit` garde sa signature, sa sémantique d'échec (`ok/conflict`) et sa garantie de garde |
| Données existantes | Aucun impact — ni structure, ni contenu, ni révisions |
| Tests | Harnais de contrats (`server/storage/contract.ts`) sur Firestore (émulateur) + mémoire + SQL : inchangés et verts ; nouveau test d'ordre (§ 6) ; suites existantes vertes |
| Limites | La relance Firestore conserve le comportement A3 (hors périmètre) ; sur production, la démonstration complète reste celle du lot 1.5 (l'émulateur est un outil de caractérisation, jamais une preuve production) |

## 6. Tests

**Nouveau test — garde d'ordre lecture/écriture** (créé seulement après autorisation,
`server/storage/firestoreStore.order.test.ts`) : un double minimal du `Firestore` Admin SDK
(`runTransaction` + `collection().doc()`) qui **applique la règle de production** — toute
lecture suivant une écriture dans la même tentative fait échouer celle-ci, exactement comme
Firestore le fait. **Chaque cas s'exécute sur une seule tentative : aucun cas n'exige de
relance** (les relances concurrentes et les révisions après relance relèvent de A3, § 4).
Cas :

1. `commit` multi-collections **forme exacte de `createAccount`** (`users` + `auth` +
   `email_index`, garde `email_index/{email}` `taken = null`) → passe sans violer l'ordre ;
2. même forme avec **compteur absent** pour une collection (chemin de la sonde) → l'ordre
   reste légal ;
3. régressions : `put`, `remove`, `transact` mono-collection → ordre inchangé, révisions
   identiques ;
4. **trace d'opérations** : le double enregistre la séquence des `get`/`set` de chaque
   tentative et l'assertion vérifie, pour chaque appel (`commit`, `put`, `remove`,
   `transact`) : **toutes les lectures précèdent la première écriture** ; la **garde** est
   lue **avant** toute écriture ; les documents d'une collection portent **une révision
   partagée** ;
5. **atomicité** : échec simulé en **phase d'écriture** (le double rejette la tentative
   entière) → **aucun document ni compteur persisté** (tout ou rien, même garant que
   Firestore).

**Suites existantes** (aucune modification) :

- sans émulateur : `npm test` — référence **1 060 passés / 0 échec / 35 skippés / 112
  fichiers** (stable sur 4 tirages) ;
- avec émulateur (`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`,
  `FIREBASE_PROJECT_ID=demo-chnawa-f1`, `NODE_OPTIONS` avec le préchargeur jeton,
  `node node_modules/vitest/vitest.mjs`) : référence actuelle **1 079 / 8 échecs / 8
  skippés / 112**. Après A2 : les échecs attribuables à A2 passent ; les échecs restants
  sont **classés un par un** dans le rapport (A3 ou autre) — le critère est « aucun échec
  nouveau, aucun échec non classé ».

**Qualité** : `npm run check` vert avant tout livrable.

## 7. Critères d'acceptation

1. Le test d'ordre (§ 6) passe : la forme `createAccount` est **légale dès la première
   tentative**, y compris avec compteurs absents — et **l'atomicité** est démontrée ;
   **aucun critère A2 n'exige une relance Firestore** ;
2. `npm test` sans émulateur : **1 060 / 0 échec / 35 skippés / 112** (aucune régression
   propre à A2) ;
3. campagne émulateur : **aucun échec nouveau ni régression propre à A2** ; les échecs
   éventuels liés à `sessionMax` (faux `sync_counter_corrupt` sur relance) sont
   **identifiés et documentés comme A3** dans le rapport — lot suivant, non corrigé ici ;
4. `npm run check` vert ;
5. harnais de contrats inchangé et vert sur les trois adaptateurs (Firestore émulateur,
   mémoire, SQL) ;
6. `git diff --stat` montre uniquement les fichiers du périmètre (§ 2) + le nouveau test +
   la documentation ;
7. documentation mise à jour (`docs/encyclopedie/donnees/` — le présent dossier passe en
   « exécuté et validé » ; note dans l'encyclopédie si une convention change) — **commits
   uniquement sur autorisation distincte** ;
8. rapport livré : modifications précises (fichier, fonction, lignes), résultats de toutes
   les suites avant/après, limites restantes (A3, lot 1.5), environnement conservé.

## 8. Livrables et séquence (après validation PUIS autorisation)

1. Refactor `firestoreStore.ts` (§ 3.2) — aucun autre fichier de code modifié ;
2. test d'ordre `firestoreStore.order.test.ts` ;
3. `npm test` sans émulateur, `npm run check`, campagne émulateur ;
4. mise à jour documentaire ;
5. rapport du lot ;
6. validation du chef du rapport → lot suivant (**A3**), autorisation distincte.

Aucun push, merge, nettoyage ou arrêt de l'émulateur — l'environnement (17 commits locaux,
travaux non commités, émulateur PID 52504 sur 8080/4000) est préservé.
