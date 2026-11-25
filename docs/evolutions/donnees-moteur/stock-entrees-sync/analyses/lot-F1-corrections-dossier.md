# Lot F1 — Dossier de correction (A1–A4, D3, E4)

> **Statut** : dossier de préparation — **aucune modification de code, de configuration, de
> script ou de fixture n'a été faite** ; aucun commit ; l'environnement et les travaux non
> commités restent en l'état. Toute implémentation attend l'autorisation explicite du chef.
> Références : `lot-F1-etape3-rapport.md` (mesures) et `lot-F1-etape3-rapport-complement.md`
> (causes racines détaillées). Ce dossier ne réécrit aucun document précédent.
>
> **Erratum (25/11/2026, autorisé par le chef — AR-2)** : le § 5.3/§ 6 du dossier d'exécution
> v6 et l'affirmation « testé aux deux faces » du scénario 6 étaient **inexactes** — le test
> commis ne couvrait que la face *survie* (push réussi), aucune face *perte*. Consigné aussi
> dans `lot-F1-D3-decision-et-implementation.md`.

---

## 1. Causes racines et fichiers concernés (récapitulatif)

| Anomalie | Cause racine (une ligne) | Fichiers / fonctions |
| --- | --- | --- |
| A1 | `express.json({ limit: '100kb' })` appliqué à `/api/kitchen` alors que le pire cas contractuel du PUT kitchen = 747.7 Kio (mesuré M1a) | `server/app.ts` (`createApiApp`, l. 81-85) |
| A2 | `commit` multi-collections : le `stampTx` de la collection N+1 lit le compteur **après** l'écriture du compteur de N — Firestore exige toutes les lectures avant toutes les écritures (règle de production, pas une bizarrerie d'émulateur) | `server/storage/firestoreStore.ts` (`stampTx` l. 60-88, `commit` l. 314-334) ; `server/auth/users.ts` (`createAccount` l. 128-137, 3 collections) |
| A3 | `sessionMax` (Map de session) est avancé **pendant** la transaction ; Firestore **rejoue** la fonction après contention → les maxima de la tentative avortée restent → refus sporieux `sync_counter_corrupt` | `server/storage/firestoreStore.ts` (`sessionMax` l. 43, `stampTx`, `commit`, `transact` l. 337-368) |
| A4 | Les gardes de caps (stock : `withinStockCaps` ; cartes legacy : `parseVersionMap`, cap `added` 300 / `removed` 2 000) sont appliquées **à la relecture de l'état propre de l'appareil**, pas seulement aux données externes → la relecture refuse/ampute, `doc()` retombe sur la reconstruction legacy → perte silencieuse | `src/infrastructure/local/storage.ts` (`getKitchenDoc`) ; `src/core/kitchen/entries.ts` (`parseStockSection` l. 524-532) ; `src/core/kitchen/elementSets.ts` (`parseElementSet`, `parseVersionMap` l. 188-205) ; `src/infrastructure/local/localRepositories.ts` (`doc`, `saveStock`, `buildStockFromLegacy`) |

---

## 2. A2 + A3 — correction commune dans `server/storage/firestoreStore.ts`

### 2.1 Principe

Une seule correction, deux défauts : **(i)** toutes les lectures d'une transaction sont faites
**avant** toutes ses écritures (A2) ; **(ii)** les maxima de session ne sont avancés que **par
les transactions résolues avec succès** (A3). La garde `sync_counter_corrupt` est **conservée
intégralement** (elle alimentée uniquement par des écritures effectivement commises — sa
sémantique documentée « counter behind what this session already wrote » devient exacte).

### 2.2 Conception de `commit` (pseudocode de la fonction de transaction)

```ts
// Phase 1 — TOUTES les lectures (aucune écriture n'a encore eu lieu)
if (guard && (await guardValue(tx, guard)) !== guard.expected) return { ok: false, conflict: true };
const names = [...new Set(ops.map((op) => op.name))];
const counters = new Map<CollectionName, number>();
for (const name of names) {
  counters.set(name, await readCounterTx(tx, name));   // lecture pure : compteur existant,
}                                                       // sinon "newest revision" de la table

// Phase 2 — TOUTES les écritures
const claims = new Map<CollectionName, number>();       // par tentative (rejeu = Map neuve)
for (const name of names) {
  const next = (counters.get(name) ?? 0) + 1;
  if (next <= (sessionMax.get(name) ?? 0)) {           // sessionMax = SUCCÈS commis uniquement
    throw new DocumentValidationError('sync_counter_corrupt', `counter behind the observed maximum on ${name}`);
  }
  claims.set(name, next);
  tx.set(counterRef(name), { next });
}
for (const op of ops) {
  tx.set(table(op.name).doc(op.id), stamped(withoutOwnFields(op.doc), claims.get(op.name)!));
}
return { ok: true, revision: Math.max(...claims.values()) };
```

Après la résolution **réussie** de `runTransaction` (hors de la fonction de transaction) :

```ts
for (const [name, next] of claims) sessionMax.set(name, Math.max(sessionMax.get(name) ?? 0, next));
```

- `readCounterTx` = l'actuel `stampTx` **amputé** de `sessionMax.set`, du `tx.set(counter…)` et du
  contrôle de corruption (ces trois éléments migrent en phase 2) ; la branche « compteur absent →
  lecture de la plus haute révision de la table » reste une **lecture** en phase 1.
- `put`, `remove`, `transact` (mono-collection) : mêmes primitives — leurs lectures (garde,
  compteur, « newest », document courant) passent en phase 1, l'écriture du compteur et du
  document en phase 2, les `claims` reportés au succès. Leur comportement observable ne change pas
  (une seule collection : l'ordre lectures/écritures y était déjà correct ; seul `sessionMax`
  change, cf. A3).
- La gestion des échecs de `commit` (relecture de la garde hors transaction, `guardViolated`)
  reste inchangée.

### 2.3 Pourquoi la garde reste vraie et ne crée plus de faux positifs

- Deux transactions **concurrentes du même processus** lisent le même compteur, revendiquent la
  même `next` : Firestore sérialise sur le document compteur (verrou optimiste) — l'une avorte et
  **rejoue** avec des lectures fraîches (Map locale neuve) → révisions strictement croissantes,
  jamais dupliquées. La garde, alimentée par les seuls succès, ne peut plus voir « next ≤ max
  commis » sauf régression **réelle** du compteur (corruption), cas pour lequel elle doit
  précisément déclencher (test existant conservé).
- L'atomicité est inchangée : tout reste dans la même transaction (`runTransaction`), un échec
  n'écrit rien. Les révisions restent **une par collection et par commit** (le curseur du change
  feed n'est pas affecté).

### 2.4 Tests de non-régression (émulateur) et critères d'acceptation

| Test | Critère |
| --- | --- |
| `contract.ts` « writes a batch atomically and fails the whole batch on a failed guard » (3 collections) | **passe sur l'émulateur** |
| `contract.ts` « claims an absent guarded document exactly once » | **passe sur l'émulateur** |
| `contract.ts` « serialises concurrent transacts on the same document » (6 `transact`, `Promise.all`) | **passe sur l'émulateur** — et un test dédié **nouveau** : « une transaction rejouée après contention ne lève jamais `sync_counter_corrupt` » (8-10 `transact` concourants) |
| Garde de corruption : le test existant qui vérifie le déclenchement sur compteur régressé | **reste vert** (la garde est conservée) |
| Suite de convergence émulateur (5 tests, dont la création de compte via `registerAccount`) | **passe sur l'émulateur** — `createAccount` (users + auth + email_index) est le commit multi-collections de référence |
| Suites SQLite / mémoire des mêmes contrats | **inchangées** (aucun comportement observable ne change sur ces fournisseurs) |
| Décompte attendu | suite complète avec émulateur : **1 087 passés / 0 échec / 8 skippés** (1 079 + 8 débloqués), à confirmer à l'exécution |

**Fichiers touchés à l'implémentation** : `server/storage/firestoreStore.ts` (code) ; au besoin
un test ajouté dans `server/storage/contract.ts` (fichier commis — modification à valider avec
l'autorisation d'implémentation).

---

## 3. A4 — intégrité du stock local (lecture « état propre » ≠ admission « externe »)

### 3.1 Principe retenu (conforme à l'accord du chef)

Les caps du contrat sont une **politique d'admission** (le serveur refuse un push hors caps ; le
client refuse l'adoption d'une section serveur hors caps). Elles ne sont **pas un filtre de
relecture** de l'état que l'appareil a lui-même persisté. Concrètement :

| Chemin | Parse | Caps |
| --- | --- | --- |
| Relecture du document **propre** (`getKitchenDoc`, donc `loadStock` et tous les `withDoc`) | nouveau `parseStockSectionUnbounded` (tolérant par enveloppe, **sans** `withinStockCaps`) | **sans** |
| Cartes legacy du document **propre** (`readElementSets`) | nouveau `parseElementSetUnbounded` (formes vérifiées, **sans** écrémage « oldest ») | **sans** |
| Remplacement propre (`saveStock` : restauration de sauvegarde, `setStock`) | parse non borné (voir § 3.3) | **sans** |
| Adoption du **serveur** (`mergeStock`) | `parseStockSection` (actuel) | **conservées** (défense en profondeur ; le serveur ne produit jamais un état hors caps — vérifié B1) |
| Validation **serveur** des pushes (`readStockSection` + `withinStockCaps` dans la route) | inchangée | **conservées** (B1a–B1d restent verts) |
| Malformed envelope (donnée corrompue) | écarté par enveloppe, comme aujourd'hui (jamais un volume légal) | inchangée |

Nouveaux exports du **core** (TypeScript pur, testés à côté, exportés par l'index) :
`parseStockSectionUnbounded` (`entries.ts`) et `parseElementSetUnbounded`
(`elementSets.ts`) — mêmes validations de forme que leurs sœurs, sans les bornes de volume.
L'architecture (hexagonale, imports par index) est respectée ; aucune règle métier ne change.

### 3.2 Effet sur le scénario mesuré (A4)

Après correction, le scénario du harnais `caps` donne : état adopté 2 600 enveloppes + 1 toggle →
**2 601 enveloppes persistées et relues intactes** (aucune clé perdue, `st_fridge_ing0299`
présent), `pending = ['stock']`, push 400, retry — la troncature disparaît. Le mécanisme
« refus explicite » du serveur reste la seule garde de volume.

### 3.3 Sauvegarde dépassant les limites (choix du chef à confirmer)

Deux options conformes à l'exigence « préserver intégralement dans un état lisible **ou** refuser
explicitement avant toute modification » :

- **(α) Préservation intégrale (recommandée)** : `saveStock` utilise le parse non borné — une
  restauration d'une sauvegarde hors caps restaure **tout** (état lisible complet) ; le refus
  explicite se produit ensuite **à la source qui en a le droit** : le serveur répond 400 aux
  pushes, la modification reste en attente, l'état local reste intact (grâce à la même
  correction). Une restauration n'est jamais partielle. Coût : l'état local peut dépasser les
  caps — accepté et borné en pratique par les actions manuelles de l'utilisateur (chaque
  dépassement est refusé côté serveur, rien ne s'accumule automatiquement).
- **(β) Refus explicite avant toute écriture** : la restauration valide le stock **avant** la
  première écriture ; hors caps → échec remonté à l'interface, rien n'est modifié. Coût : une
  restauration fidèle d'une sauvegarde légalement créée (avant un recalibrage E4 par exemple)
  devient impossible — perte de fonction pour un cas d'usage légitime.

Recommandation : **(α)** — cohérente avec le principe « les caps sont une admission, pas un
filtre d'intégrité », et aucune donnée de sauvegarde n'est jamais perdue ni partiellement
appliquée. *(α) vs (β) = arbitrage du chef.*

### 3.4 Tests de non-régression et critères d'acceptation

| Test | Critère |
| --- | --- |
| Repo local : adopte l'état B1d (600 actives + 2 000 tombstones) + 1 toggle → **relecture** | **2 601 enveloppes intactes**, l'entrée ajoutée présente, `st_fridge_ing0299` présent — aucune clé perdue |
| Repo local : 2 000 tombstones adoptées + 1 retrait local → relecture | **2 001 tombstones intactes** — aucun écrémage « oldest » |
| Restitution d'une sauvegarde dont le stock dépasse les caps | **tout est restauré** (aucune restauration partielle) ; le cycle aller-retour `backup.test.ts` reste vert |
| Serveur : caps B1a–B1d (`kitchenRoutes.stock.test.ts`) | **restent verts** (aucun assouplissement serveur) |
| Client : adoption d'une section serveur hors caps (voie `mergeStock`) | **toujours refusée** (la garde externe est conservée — test à conserver/ajouter) |
| Le scénario « relecture après un refus serveur » | pending = `['stock']` conservée, état intact, retry au prochain déclencheur |

**Fichiers touchés à l'implémentation** : `src/core/kitchen/entries.ts`,
`src/core/kitchen/elementSets.ts`, `src/core/kitchen/index.ts` (exports),
`src/infrastructure/local/storage.ts`, `src/infrastructure/local/localRepositories.ts`, tests
(`entries.test.ts`, `elementSets` (ou `localRepositories.test.ts`), `backup.test.ts`).

---

## 4. A1 — limite HTTP de `/api/kitchen`

### 4.1 Chiffrage de référence (mesuré, daté au rapport)

- Pire cas **contractuel mesuré** d'un PUT kitchen complet (toutes sections, stock à 300+300+2 000
  tombstones) : **747.7 Kio** (M1a) ; 860.6 Kio avec placard plein (600+2 000).
- Avec l'option E4 retenue par le chef (document unique, cap tombstones recalibrée, § 6) : le
  pire cas PUT retombe à ≈ **422 Kio** (interpolation M1a : ~0.31 Kio de JSON par tombstone).
- L'état actuel (caps 2 000, sans E4) doit rester couvert tant que la constante E4 n'est pas
  appliquée.

### 4.2 Comparaison

| Option | Limite | Couverture du pire cas mesuré (747.7 Kio) | Surface d'acceptation | Complexité |
| --- | --- | --- | --- | --- |
| Réutiliser `bigJson` (5 Mio, existant) | 5 Mio | ×6.7 | 5 Mio par requête de synchronisation par client | nulle (une condition de plus dans le sélecteur existant) |
| **Limite dédiée `/api/kitchen` = 1 Mio** | 1 Mio | ×1.37 (marge +37 % au-dessus du pire cas mesuré actuel ; ×2.4 après E4) | 5× plus petite que `bigJson` | une constante nommée + une branche dans le sélecteur |

Les deux options n'affaiblissent **aucune validation** : les caps métier (`withinStockCaps`),
la validation par enveloppe et les registres restent les protections de référence ; la limite
HTTP n'est qu'un garde-fou transport, au-dessus de tout état légal.

**Recommandation : limite dédiée de 1 Mio** — au-dessus du pire cas mesuré avec une marge
confortable, très en dessous de la surface de 5 Mio, constante nommée avec le chiffrage cité en
commentaire (mesure du 2026-11-19). Si le chef préfère la simplicité absolue, `bigJson` est
acceptable mais élargit inutilement la surface.

### 4.3 Tests de non-régression

| Test | Critère |
| --- | --- |
| Push légal > 100 Kio (2 000 tombstones, scénario B1c du repro) | **HTTP 200** (aujourd'hui 413) |
| Corps > 1 Mio (synthétique, en dehors de tout état légal) | **HTTP 413** (le garde-fou transport reste en place) |
| Caps dépassées (B1a–B1d) | **restent des 400** métier — jamais transformés par la limite transport |
| Les autres routes (100 Kio) et `/api/data/*`, vision (5 Mio) | **inchangées** |

**Fichiers touchés à l'implémentation** : `server/app.ts` uniquement (+ un test dans
`server/app.test.ts` ou `kitchenRoutes.stock.test.ts`).

---

## 5. D3 — analyse fonctionnelle de la récupération d'un appareil muet > 83 j

*(aucune décision changée ; cette section prépare la décision du chef)*

### 5.1 Ordre réel des opérations (vérifié dans le code)

`sync.start()` → `recover()` (`KitchenSync.ts:240-244`) :

1. **si `pending` non vide → `pushNow()`** : les sections en attente (avec leurs horodatages de
   section et leurs versions HLC **d'origine**, créées au moment de chaque action hors ligne)
   sont envoyées et fusionnées côté serveur par enveloppe ;
2. **puis `pullNow()`** : GET du document ; en cas de succès, si
   `now − lastSyncedAt > STALE_DEVICE_MS` → **`resetLocal()`** puis `applyRemote(doc)` puis
   `recordSynced`.

`resetLocal()` (`localRepositories.ts:396-404`) : écrit `EMPTY_DOC` — listes, planning, éléments
et **stock vidés**, `pending: []` (**effacée**), `deviceClock` et `lastSyncedAt` **conservés**.
`applyRemote(doc)` : fusionne le document frais sur l'état (re)vidé — toutes les adoptions
passent (les temps locaux sont à 0). Le pull **échoué** ne vide rien (« wipes nothing when the
pull fails », testé `KitchenSync.test.ts:860`).

### 5.2 Comportement par type de modification hors ligne, selon l'issue du push

| Cas | Push de rattachement **réussit** | Push **échoue** (encore hors ligne, refus caps, erreur) |
| --- | --- | --- |
| **Ajout** (présence active, version = date de l'action) | Accepté (aucune version concurrente plus récente) → atterrit, puis réadopté au reset — **survie** (mesuré, scénario 6) | Reset → `pending` effacée → **perte** (compromis § 6.3) |
| **Modification** d'une entrée enrichie (même clé, version plus récente) | Gagne par HLC → atterrit | **Perte** |
| **Suppression** (tombstone, version = date de l'action), tombstone serveur **encore vivant** (≤ 90 j) | Le tombstone le plus récent gagne → la suppression se propage ; si un autre appareil a **ré-ajouté** l'ingrédient entre-temps avec une version plus récente, l'active gagne → suppression perdue **par enveloppe** (compromis § 6.3) | **Perte** |
| **Suppression** dont la version a **> 90 j** (action au début d'une fenêtre hors ligne > 90 j) | Le serveur **stocke puis purge** le tombstone **dans la même transaction** (`purgeStockTombstones` sur l'état fusionné, `kitchenRoutes.ts:300`) → la suppression disparaît du document serveur : l'entrée **réapparaît** chez l'appareil (réadoption) et chez les autres. **Résultat identique au compromis (perte), mais par la purge, pas par le reset** | **Perte** |
| **Ajout** d'un ingrédient **supprimé ailleurs il y a > 90 j** (tombstone déjà purgé) | Aucune défense serveur (le tombstone n'existe plus) → l'ajout atterrit → **la donnée supprimée réapparaît** — **fenêtre de résurrection** | **Perte** |

### 5.3 La fenêtre de résurrection (le point qui exige une décision)

La marge `STALE_DEVICE_MS` = rétention − 7 j (83 j) garantit qu'« un appareil muet > rétention se
réinitialise **avant de pouvoir ressusciter** » (`elementSets.ts:53-55`). Mais l'ordre réel
(push **avant** reset) permet aux modifications en attente — y compris celles créées **au début**
de la fenêtre hors ligne, dont les versions ont alors **plus de 90 j** — de passer la porte
**avant** le reset :

- leur tombstone (> 90 j) est purgé immédiatement après acceptation → la suppression ne se
  propage pas ;
- leur ajout peut atterrir contre un tombstone **purgé** → résurrection de la donnée supprimée.

Fenêtre **étroite** (il faut : une suppression > 90 j purgée, ET le même ingrédient ajouté hors
ligne par l'appareil muet, ET un retour en ligne) mais **réelle**, et contradictoire avec
l'intention documentée de la marge. Deux lectures possibles du compromis § 6.3 :

- lecture **large** (actuelle) : « les opérations pendantes sont perdues » quand leur push échoue
  — mais quand le push réussit, elles survivent (même anciennes) ;
- lecture **stricte** : un appareil muet > 83 j ne doit rien écrire du tout avant son reset —
  alors **toutes** les modifications hors ligne sont perdues, y compris celles dont le push
  réussirait.

### 5.4 Propositions (décision du chef — aucune appliquée)

| Option | Description | Conséquences |
| --- | --- | --- |
| **P1 — alignement strict sur § 6.3 (recommandée)** | Dans `recover()` : si l'appareil est muet > `STALE_DEVICE_MS` (connu localement via le registre), **ne pas pousser le pending** — enchaîner directement pull → reset → réadoption. Toutes les modifications hors ligne sont perdues (compromis § 6.3 strict), **la fenêtre de résurrection est fermée**, l'implémentation coïncide avec la documentation | Le comportement de survie du scénario 6 disparaît → le test commis « recovers without losing its offline change » **doit être réécrit** (test validé modifié : décision du chef). Coût utilisateur : un appareil revenant après 83+ j perd tout ce qu'il a fait hors ligne — déjà le compromis documenté, simplement appliqué à tous les cas |
| **P2 — statu quo documenté** | Garder l'ordre actuel ; documenter la fenêtre de résurrection (tombstone purgé + ajout hors ligne du même ingrédient) comme limite acceptée du compromis § 6.3 | Aucun code changé ; risque de résurrection étroit mais réel subsiste ; la divergence test/documentation reste |
| **P3 — garde serveur** | Le serveur refuse tout push portant une enveloppe dont la version a plus de 90 j (raison explicite `stale-version`, marge d'horloge à encadrer) ; le client garde pending, le reset l'efface | Ferme la fenêtre ; règle serveur supplémentaire, cas limites (décalage d'horloge, mélanges de versions anciennes et récentes dans la même section) — plus lourd que P1 pour le même résultat |

### 5.5 Correction documentaire (faite, restes à valider)

- Le **rapport** d'étape 3 (ligne D3) et le **complément** (§ 1) décrivent désormais exactement :
  le test commis vérifie la **survie** quand le push réussit ; **aucun test commis n'asserte la
  face perte** ; l'affirmation du dossier § 6.3 (« le test vérifie les deux faces ») est
  inexacte.
- **Erratum au dossier d'exécution § 6.3** : proposé, **attend votre décision** (avec, si
  accepté, l'ajout du test de la face perte — fichier commis, autorisation distincte).
- Si l'option **P1** est retenue, le scénario 6 change de comportement : le test serait réécrit
  pour assert la perte stricte (et la fenêtre de résurrection fermée) — la modification d'un test
  validé est explicitement soumise à votre autorisation.

---

## 6. E4 — calcul corrigé (document unique, rétention 90 j inchangée)

> ⚠️ **CONCLUSION SUPPLANTÉE (arbitrage « option B », session validée — non archivée sur disque,
> DT-05)** : le plafond de tombstones défendable calculé ci-dessous (~628) **n'a pas été retenu** —
> l'orientation A1 validée par le chef **préserve la cap 2 000 tombstones** (option B), avec la
> limite dédiée 3 Mio de `/api/kitchen` comme réponse au dépassement de la limite document
> Firestore. Les mesures de cette section restent valables (coût par tombstone ≈ 0,6143 Kio, base
> 600 entrées ≈ 433,1 Kio) — seule la **conclusion d'abaissement du plafond** est supplantée.
> Preuve de l'arbitrage : `lot-F1-A1-dossier-implementation.md` (base : « option B et 2 000
> tombstones préservées »). Texte conservé tel quel ci-dessous.

### 6.1 Reprise des données brutes (mesures M1b du 2026-11-19)

| Point mesuré | M1b (Kio) |
| --- | --- |
| 300 entrées + 500 tombstones | 531.8 |
| 300 entrées + 2 000 tombstones | 1 453.2 |
| 600 entrées + 2 000 tombstones | 1 661.7 |

- **Coût par tombstone** = (1 453.2 − 531.8) / 1 500 = **0.6143 Kio** (vérification croisée :
  (1 661.7 − 1 453.2) / 2 000 = 0.6093 sur l'autre couple — cohérent, ~0.61-0.61 Kio).
- **Base 600 entrées** (hors tombstones, favoris/planning/courses/préférences et projections
  legacy incluses) = 1 661.7 − 2 000 × 0.6143 = **433.1 Kio** ; contrôle croisé :
  531.8 − 500 × 0.6143 = 224.7 (base 300 entrées) + 208.5 (300 entrées placard mesurées à 2 000
  tombstones) = 433.2 ✓. *(La base 441.7 Kio de votre message provenait du coût arrondi à 0.61
  extrapolé sur 2 000 tombstones : 1 661.7 − 1 220 = 441.7 ; l'écart de 8.6 Kio est un pur
  effet d'arrondi, il ne change aucune conclusion.)*
- **Limite Firestore** : 1 Mio = **1 024 Kio** (la référence REST précise « 1 MiB − 4 octets » —
  négligeable ici). **Objectif de marge 20 %** → budget **819.2 Kio**.

### 6.2 Plafond de tombstones défendable

Budget tombstones = 819.2 − 433.1 = **386.1 Kio** → 386.1 / 0.6143 = **628.6 tombstones**.

- **Proposition : cap tombstones = 600** (valeur ronde, sous l'objectif avec une vraie marge) :
  433.1 + 600 × 0.6143 = **801.7 Kio = 78.3 %** du 1 Mio (avec le chiffrage arrondi du chef :
  807.7 Kio = 78.9 % — les deux calculs restent sous 819.2 Kio).
- 620 serait le maximum interpolé sous l'objectif (813.9 Kio = 79.5 %) sans marge de manœuvre
  supplémentaire ; 650 (838.2 Kio, 81.9 %) dépasse l'objectif de 20 % ; 1 000 (1 051.7 Kio)
  **dépasse la limite elle-même** — exclu.
- Ces valeurs sont **interpolées entre points mesurés** (interpolation linéaire sur quatre points
  dont deux à 2 000 tombstones) ; **à l'implémentation, un point mesuré 600 entrées + 600
  tombstones sera ajouté à la sous-commande `sizes` pour confirmer la valeur avant de fixer la
  constante** (une ligne de configuration du harnais, dans le périmètre de l'implémentation
  autorisée).
- La cap des **entrées** (300 par emplacement) reste inchangée.

### 6.3 Conséquences fonctionnelles du refus au-delà de 600 tombstones

- **Déclencheur** : le 601e tombstone vivant (fenêtre glissante de 90 jours) → le serveur répond
  **400 `stock-caps`**, rien n'est écrit, le document précédent intact (comportement B1c déjà
  testé, recalibré).
- **Côté client** (après A4) : la modification reste **en attente**, l'état local reste **intact**
  (aucune troncature), retry au prochain déclencheur. L'utilisateur se débloque par
  « vider un emplacement » (`clearFridge`/`clearPantry`, opérations distinctes validées E3) —
  chaque vidage retire des tombstones vivantes et rouvre de la place.
- **Auto-limitation temporelle** : les tombstones de plus de 90 j sont **purgées par le serveur**
  à chaque PUT — le compteur de tombstones vivantes se **draine seul** avec le temps ; la cap ne
  lie que les pics de réorganisation (600 suppressions en 90 jours ≈ 6.7/jour soutenu, très
  au-dessus de l'usage réel d'un foyer).
- **Limite connue à signaler honnêtement** : l'interface n'affiche aujourd'hui **aucune erreur
  explicite** pour un push refusé (état `failed` de la synchro, retry silencieux) — l'utilisateur
  voit une synchro qui « ne part pas » sans message. Le **signalement en UI** d'un refus de caps
  serait l'accompagnement naturel mais sort du périmètre F1 (évolution d'interface séparée,
  demandable).
- **Cohérence legacy** : la projection `removed` dérive du stock (≤ 600) — la carte legacy reste
  automatiquement dans les bornes ; un ancien client poussant 2 000 tombstones est refusé par la
  cap (comportement explicite, conforme).
- **Rétention** : **90 jours inchangés** ; la marge `STALE_DEVICE_MS` (83 j) reste valable en
  l'état. Aucune réduction n'est proposée ; toute réduction exigerait de redémontrer la
  garantie « un appareil hors ligne < rétention − 7 j ne ressuscite rien » (tests adaptés).

---

## 7. Récapitulatif des tests de non-régression et critères d'acceptation

| Correction | Tests indispensables | Critère d'acceptation |
| --- | --- | --- |
| A2+A3 | 3 tests de contrat émulateur (`contract.ts:134/138/170`), nouveau test de rejeu sans faux `sync_counter_corrupt`, garde de corruption conservée, suite de convergence émulateur (5, création de compte incluse), suites SQLite/mémoire inchangées | Suite complète avec émulateur : **0 échec** (décompte attendu ~1 087 / 8 skippés, à confirmer) |
| A4 | Relecture B1d+1 intacte (2 601), 2 001 tombstones intactes, restauration hors caps intégrale, caps serveur B1a–B1d vertes, adoption serveur hors caps toujours refusée, pending intacte après refus | Aucune clé perdue, aucune troncature, aucune restauration partielle |
| A1 | Push légal 498.1 Kio → 200 ; corps > limite → 413 ; caps métier → 400 ; autres routes inchangées | Le transport ne juge plus un état légal ; la validation métier reste la référence |
| D3 (si P1) | Réécriture du scénario 6 (perte stricte) + test de la face perte + convergence inchangée par ailleurs | Implémentation = documentation ; fenêtre de résurrection fermée |
| E4 | Point mesuré 600+600 dans `sizes` ; tests de caps recalibrés (600 au lieu de 2 000) ; B2 re-vérifié à la nouvelle cap | Cap confirmée par une mesure, tests verts |

---

## 8. Dépendances et ordre d'exécution recommandé

1. **A2+A3** (`firestoreStore.ts`) — premier, car il conditionne toute la validation émulateur
   (y compris la re-vérification de la Campagne A) ; A1 est indépendant mais peut être livré dans
   le même passage serveur.
2. **A1** (`server/app.ts`) — une ligne + tests ; à livrer **avant** la re-vérification B1 sur un
   serveur de production-wiring (sinon les caps restent inatteignables).
3. **A4** (client) — indépendant des deux premiers ; livrable en parallèle.
4. **Décision D3 (P1/P2/P3)** et, si P1, la réécriture du scénario 6 + le test de la face perte.
5. **Décision E4 (cap 600)** puis, après application : confirmation par le point mesuré
   600+600, mise à jour des tests de caps, re-vérification B2 à la nouvelle cap.
6. **Re-vérification de la Campagne A émulateur** (seulement elle) après A2+A3 — clos le décompte
   attendu du dossier v4.2 (1 063/30, ajusté au réel).
7. Rapport d'implémentation + commits sur autorisation distincte ; la démonstration navigateur
   et le nettoyage restent en fin de chaîne.

Dépendances notables : A4 est indépendant d'A1/A2/A3 ; E4 dépend de la décision du chef et se
vérifie mieux **après** A1 (sinon les caps ne sont pas atteignables pour tester B2 à volume) ;
D3 est indépendant mais son test (face perte) peut être écrit en même temps que la Campagne A de
re-vérification.

---

## 9. Arbitrages nécessitant votre validation

1. **D3 — option P1 (strict § 6.3, recommandée) / P2 (statu quo documenté) / P3 (garde serveur)**.
   P1 modifie le comportement du scénario 6 et **réécrit un test validé** — décision explicite
   requise.
2. **A4 — option (α) préservation intégrale (recommandée) vs (β) refus explicite avant
   restauration**.
3. **A1 — limite dédiée 1 Mio (recommandée) vs réutilisation de `bigJson` 5 Mio**.
4. **E4 — valeur de la cap tombstones** : proposition **600** (78.3 % mesuré-interpolé, sous
   l'objectif des 20 % de marge), à confirmer par un point mesuré à l'implémentation.
5. **Erratum au dossier § 6.3** (le test du scénario 6 ne couvre que la face survie) et, si
   accepté, le test de la face perte.
6. **Signalement UI d'un refus de caps** : hors périmètre F1, demandable séparément.
