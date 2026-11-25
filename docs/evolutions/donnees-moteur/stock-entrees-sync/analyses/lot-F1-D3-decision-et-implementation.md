# Lot F1 — D3 : décision et implémentation (appareil muet > 83 j, option P1)

> **Statut** : décision **AR-2 du chef (25/11/2026) — option P1, sous garde-fou** : un appareil
> dont le dernier échange réussi date de plus de `STALE_DEVICE_MS` (83 j) **ne pousse plus** ses
> modifications pendantes avant la réinitialisation de son état ; la fenêtre de résurrection
> (tombstone purgé + ajout hors ligne du même ingrédient) est **fermée**. Garde-fou impératif du
> chef : **aucune perte silencieuse** des modifications refusées. Implémenté le 25/11/2026 sur
> `fix/stock-sync-integrity`, **non commité** (commit et PR sur autorisations distinctes).

## 1. La décision et ses conséquences (acceptées)

- **P1** : dans `recover()` (et dans `pushNow()`, pour couvrir tous les déclencheurs —
  debounce, visibilité, redémarrage), un appareil muet **ne pousse jamais** son `pending` :
  il va directement au pull, qui réinitialise l'état et réadopte le document serveur.
- **Comportement antérieur corrigé** : l'ordre « push avant reset » laissait passer les
  modifications pendantes — y compris les versions > 90 j, dont la tombstone était purgée
  immédiatement après acceptation (fenêtre de résurrection, `lot-F1-corrections-dossier.md` § 5).
- **Perte large acceptée (compromis § 6.3, désormais strict)** : toutes les modifications hors
  ligne d'un appareil muet ne sont **pas synchronisées** — mais elles ne sont **plus perdues
  silencieusement** (voir § 2).

## 2. Le garde-fou « zéro perte silencieuse » (exigence du chef)

Avant toute réinitialisation d'un appareil muet portant des modifications pendantes, le
synchroniseur **archive** le snapshot exact de ce qui aurait été poussé :

| Exigence du chef | Mise en œuvre |
| --- | --- |
| Préserver les modifications refusées | `UnsyncedOfflineChanges` (`ports.ts`) : `{ archivedAt, sections }` — le payload exact (`pendingSections`), écrit dans une **clé de stockage séparée** `chnowa_kitchen_unsynced_<scope>_v1` (elle **survit** au `resetLocal`, qui n'écrit que le document de cuisine) |
| Traitement pendant le reset | archive **avant** `resetLocal` (dans `pullNow`, uniquement sur le chemin « appareil muet + pull réussi ») — un pull échoué ne modifie rien (comportement inchangé) |
| Pas de réémission automatique | rien ne relit l'archive à des fins d'envoi ; le `pending` est effacé par le reset ; la réadoption est celle du serveur seul |
| État explicite | `KitchenSyncState.offlineChangesArchived` (booléen, réinitialisé au changement de compte) + `KitchenSync.unsyncedArchive()` (lecture) + `KitchenSync.discardUnsyncedArchive()` (acquittement utilisateur) |
| Jamais présenté comme synchronisé | l'archive n'a **jamais** de statut « confirmé » ; son nom, sa doc et son exposition disent « modifications non synchronisées » |

Port étendu : `KitchenSyncLedger.unsyncedArchive() / archiveUnsyncedChanges() /
discardUnsyncedArchive()` (ports.ts) ; implémentation navigateur dans `storage.ts` +
`localRepositories.ts` ; règle unique dans le core : `isStaleDevice(lastSyncedAt, now)`
(`elementSets.ts`, à côté de `STALE_DEVICE_MS` — un seul endroit).

**Signal UI** : l'état et la lecture de l'archive sont exposés au store de sync ; l'**affichage**
à l'utilisateur (bandeau, liste des modifications non synchronisées) reste l'évolution
d'interface séparée (SC-10), hors F1 — la décision AR-2 demande l'« état explicite », fourni ici.

## 2 bis. Corrections demandées par la revue pré-commit (25/11 au soir, autorisées)

La revue pré-commit a identifié deux défauts (D3-a, D3-b) ; le chef a demandé leur correction
avant intégration. Les deux sont corrigés, testés, et documentés ici (statuts réels).

| Défaut | Correction appliquée | Test qui le démontre |
| --- | --- | --- |
| **D3-a** : `saveKitchenUnsynced` avalait tout échec (quota) — le drapeau passait à `true` et le `resetLocal` effaçait des modifications dont l'archive n'était **pas persistée** (perte silencieuse, contraire à AR-2) | **BLOQUANT corrigé** : `saveKitchenUnsynced` retourne un booléen de succès ; le port `archiveUnsyncedChanges` retourne `boolean` (persisté ou non) ; `archiveRefusedPending()` retourne `boolean` (true = effacement sûr) ; **`offlineChangesArchived` ne passe à `true` qu'après confirmation de persistance** ; et dans `pullNow`, **un échec de sauvegarde ABORT le reset** — l'état local reste intact, le `pending` reste, l'échec est explicite (`failed: true`), l'appareil reste muet et une pull ultérieur retente toute la séquence | `KitchenSync.test.ts` « a FAILED archive save ABORTS the reset » : stockage en échec → favoris locaux **intacts** (`kept` + `r2`), rien d'archivé, drapeau `false`, `failed: true` ; puis stockage réparé → archive, reset, réadoption, **aucun push n'a jamais eu lieu** |
| **D3-b** : `offlineChangesArchived` était un état de session (`false` au constructeur) — après rechargement, l'archive persistait mais le signal disparaissait | Au `start()` (et au changement de compte, pour le scope entrant), le drapeau est **restauré depuis l'archive persistée** (`unsyncedArchive() !== null`) — sans nouvelle synchronisation, sans réémission | `KitchenSync.test.ts` « the archive signal is RESTORED on start-up » : un moteur reconstruit sur les mêmes dépendances retrouve le drapeau `true` et le garde après les timers, **sans aucun push** |

**Garantie renforcée (AR-2)** : aucune modification locale n'est plus jamais effacée si son
archive n'a pas été **confirmée persistée** — l'échec de sauvegarde annule le reset au lieu de
deperdurer la perte.

## 3. Erratum § 6.3 consigné

L'affirmation du dossier d'exécution v6 (« le test du scénario 6 vérifie les deux faces ») était
inexacte — seule la face *survie* était testée. **Erratum inscrit au § 6.3** de
`lot-F1-execution-dossier.md` (autorisation explicite du chef), avec renvoi au présent dossier
et à `lot-F1-corrections-dossier.md` § 5.

## 4. Tests

### Voie unitaire (exécutés le 25/11 — réussis)

| Test | Critère |
| --- | --- |
| `KitchenSync.test.ts` — appareil muet avec `pending` | **0 push** (garde dans `pushNow` et `recover`) ; `pending` conservé jusqu'au pull ; archive **avant** le reset contenant la section (`favorites` avec l'ajout hors ligne) ; réadoption du serveur ; `pending = 0` ; `offlineChangesArchived = true` ; **aucune réémission** (timers supplémentaires = 0 push) ; `discardUnsyncedArchive()` vide l'archive et l'état |
| Appareil muet + pull **échoué** | rien d'effacé, rien d'archivé, `pending` conservé (retry), état `failed` |
| Appareil muet **sans** `pending` | réadoption normale, **aucune** archive |
| Appareil **non** muet | push normal inchangé (la garde ne mord qu'au-delà de la marge) |
| `localRepositories.test.ts` | l'archive survit au `resetLocal` (clé séparée) et se vide par acquittement explicite |

### Convergence (émulateur — `[À DÉMONTRER]` en V2)

Le **scénario 6 est réécrit** (`kitchenStockConvergence.test.ts`, autorisation explicite du
chef) : B revient après la marge → **0 push** ; B converge vers l'état serveur **sans** son
ajout hors ligne (`['ing2','ing3']`) ; archive présente avec l'enveloppe `ing1` ;
`offlineChangesArchived = true` ; face B (l'horloge HLC survit au reset) : le re-togglage
manuel de `ing1` **atterrit** (l'appareil n'est jamais verrouillé) et converge.

## 5. Fichiers touchés

`src/core/kitchen/elementSets.ts` (`isStaleDevice`), `src/application/ports.ts`,
`src/application/kitchen/KitchenSync.ts` + `KitchenSync.test.ts`,
`src/infrastructure/local/storage.ts` + `localRepositories.ts` + `localRepositories.test.ts`,
`server/routes/kitchenStockConvergence.test.ts`, docs (erratum § 6.3, présent dossier).

## 6. Restes

- Campagne émulateur sur l'état final (JDK 21) : **exécutée** le 25/11 — 54/54, 0 échec
  (`preuves/lot-F1-A4-D3-campagne-V1-V2-2026-11-25.md`), reconfirmée après les corrections
  D3-a/D3-b (convergence 15/15, réchauffage = condition de campagne).
- Affichage UI de l'archive : évolution séparée (SC-10).
- L'archive n'est pas incluse dans l'export de sauvegarde (hors périmètre de la décision ;
  demandable si le chef la souhaite).
