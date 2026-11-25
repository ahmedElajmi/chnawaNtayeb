# Lot T1 — Fiabilisation des campagnes de tests Firestore

**Statut : dossier v2 — corrections demandées par le chef intégrées (comptage du critère 2, justification du délai de 15 s, convention des futures suites émulateur). En attente de validation définitive. L'implémentation nécessitera une autorisation distincte.**

**Date :** 20 novembre 2026
**Branche :** `feature/datastore-contract` (17 commits locaux intacts)
**Autorisation de préparation :** accord du chef après revue du rapport comparatif final d'A3 (clôture A3 acquise et indépendante de ce lot).

---

## 1. Objet et périmètre

Le lot couvre **deux sujets uniquement**, isolés de la logique A2/A3 (qui reste close et intouchée) :

- **Sujet A — isolation des suites utilisant l'émulateur Firestore** : éviter les interférences
  croisées (effacements de collections et de compteurs) entre suites exécutées en parallèle ;
- **Sujet B — timeout du test concurrent** de `server/storage/contract.ts` : fixer un délai adapté
  aux durées réellement observées après la correction A3.

**Hors périmètre** : toute modification de la logique d'A2 ou d'A3 (`firestoreStore.ts`), tout
changement du moteur de tests au-delà de la configuration, toute autre anomalie d'infrastructure.

## 2. Diagnostic et causes établies (faits vérifiés dans le code et les campagnes)

### 2.1 Deux suites seulement touchent l'émulateur

`grep -rln FIRESTORE_EMULATOR_HOST server/ src/` → exactement deux fichiers de la suite :

1. `server/storage/firestoreStore.test.ts` (tests de contrat, 22 tests émulateur) ;
2. `server/routes/kitchenStockConvergence.test.ts` (convergence du stock, 5 tests émulateur).

Les autres occurrences sont des scripts de diagnostic temporaires (`scripts/diagnostics/tmp-*`),
hors suite.

### 2.2 Les deux suites partagent la même base et s'effacent mutuellement

- `firestoreStore.test.ts` **efface `SUITE_COLLECTIONS` avant chacun de ses 22 tests**
  (`wipeAll`, l. 50-64, via `ensureWiped` l. 64) : `recipes`, `ingredients`, `recipes_versions`,
  `recipes_workspace`, **`users`**, **`kitchen`**, `email_index`, `countries`, **`_sync_meta`**
  (l. 17-29). `_sync_meta` porte **les compteurs de révisions de toutes les collections**.
- `kitchenStockConvergence.test.ts` **efface `ingredients` et `kitchen` avant chacun de ses 5
  tests et au teardown** (l. 569-573, 576-582) — pas `_sync_meta`, pas `users`.

En campagne **parallèle** (`npm test` sans options, comportement par défaut de Vitest), les
workers s'exécutent **simultanément contre la même base d'émulateur** :

- l'effacement de `_sync_meta/kitchen` par le worker du contrat, pendant que la suite de
  convergence a déjà validé 18 (puis 5, puis 1) révisions de `kitchen` dans sa session, produit
  la trace observée **`next=1 is behind seed=18/5/1`** — le garde A3 refuse **bruyamment**, ce
  qui est exactement son comportement conçu (une base modifiée derrière une session ne doit
  jamais être continuée silencieusement) ;
- l'effacement de `users` produit les **401** observés (`pushStatuses:["401"]`) ;
- l'effacement concurrent de `kitchen/u1` pendant les six `transact` du test concurrent
  explique la **perte de mise à jour observée une fois** (sections perdues) et l'erreur
  **`3 INVALID_ARGUMENT: Transaction is invalid or closed`** observée dans la reproduction
  minimale à deux fichiers ;
- les **timeouts sous charge** (délai 5 s par défaut) s'expliquent par le va-et-vient
  effacement/rewrite du compteur partagé pendant la contention.

### 2.3 Aucun défaut d'adaptateur

Le même code est vert partout où l'interférence est impossible :

| Contexte                                                         | Résultat                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Isolement (fichiers un par un, à 30 s)                           | 22/22, 15/15, 6/6 répétitions du test concurrent                                       |
| Campagne séquentielle `--no-file-parallelism` (30 s)             | **1 101 / 0 échec / 8 skippés / 114 — 40 s**                                           |
| Sans émulateur                                                   | 1 074 / 0 / 35 / 114                                                                   |
| Test A3 dédié (`firestoreStore.attempt.test.ts`)                 | 10/10                                                                                  |
| Deux fichiers émulateur **en parallèle** (reproduction minimale) | 6 échecs + `sync_counter_corrupt` en boucle + 401 + `Transaction is invalid or closed` |
| Campagnes parallèles complètes (saines puis)                     | flouque : 1 timeout 5 s, 1 perte de mise à jour, 1 `sync_counter_corrupt` (scénario 6) |

### 2.4 Clôture d'A3 (acquise)

Les 17 commits locaux et l'état de `firestoreStore.ts` (+113/−27, périmètres A2+A3 validés) sont
intacts. **Aucun critère du présent lot ne rouvre A2/A3** ; les correctifs sont confinés à la
configuration de tests et au délai d'un test.

## 3. Sujet A — solutions possibles

### Option A1 — sérialiser toute la campagne par commande (`--no-file-parallelism`)

- **Avantages** : zéro modification ; déjà documenté.
- **Inconvénients** : ne protège que si chacun pense à l'option — `npm test` sans options
  retombe sur l'interférence ; perd le parallélisme des **87 autres fichiers** (40 s au lieu de
  29 s aujourd'hui, mais coût croissant avec la suite) ; dépend d'une discipline humaine.

### Option A2 — un projet d'émulateur distinct par suite

Chaque suite émulateur fixe son propre `FIREBASE_PROJECT_ID` (l'émulateur crée les espaces de
noms à la demande) : les effacements d'une suite ne touchent jamais l'autre.

- **Avantages** : parallélisme complet conservé ; isolation par la donnée, pas par le temps.
- **Inconvénients** : modification de chaque fichier émulateur ; **convention silencieuse** —
  toute future suite émulateur qui oublie son id propre rétablit l'interférence sans signal ;
  deux suites martèlent quand même l'émulateur simultanément.

### Option A3 (recommandée) — scission Vitest en deux « projects » dans `vite.config.ts`

Vitest 5 (utilisé : 5.1.0) supporte les projets en configuration inline, chacun avec ses propres
options, dont `fileParallelism: false` :

```ts
test: {
  exclude: [...configDefaults.exclude, '**/.claude/**'],
  isolate: false,
  projects: [
    {
      test: {
        name: 'emulator',
        // Les deux seuls fichiers qui utilisent l'émulateur Firestore
        include: [
          'server/storage/firestoreStore.test.ts',
          'server/routes/kitchenStockConvergence.test.ts',
        ],
        // Une seule suite émulateur à la fois : elles partagent la même base
        fileParallelism: false,
      },
    },
    {
      test: {
        name: 'unit',
        include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        exclude: [
          ...configDefaults.exclude,
          '**/.claude/**',
          'server/storage/firestoreStore.test.ts',
          'server/routes/kitchenStockConvergence.test.ts',
        ],
      },
    },
  ],
},
```

- **Avantages** :
  - **déclaratif et définitif** — la propriété vitale (« les suites qui partagent l'émulateur ne
    se chevauchent pas ») vit à un seul endroit, vérifiée à chaque `npm test`, indépendante de la
    commande passée ;
  - le reste de la suite garde le parallélisme (deux « lanes » concurrentes : la lane émulateur
    sérielle, la lane unité parallèle) ;
  - aucun fichier de test modifié ;
  - les options racine (`exclude` des worktrees `.claude/**`, `isolate: false`) restent héritées
    par les deux projets.
- **Inconvénients** : configuration un peu plus longue (~15 lignes) ; toute future suite
  émulateur doit être ajoutée à la lane `emulator` (risque visible : si elle reste dans
  `unit`, elle redevient sujette à interférence — on l'atténue par un commentaire explicite
  dans la config et la documentation `09-qualite-tests.md`).

**Convention pour les futures suites émulateur (règle explicite)** : tout nouveau fichier de
test qui initialise un client Firestore (`FIRESTORE_EMULATOR_HOST`) doit **(a)** être ajouté
au `include` du project `emulator` et **(b)** être ajouté à l'`exclude` du project `unit` —
les deux à la fois. Cette règle sera **documentée dans `docs/encyclopedie/09-qualite-tests.md`
lors de l'implémentation**, avec le commentaire d'appoint dans la configuration elle-même.
Un garde-fou simple à retenir : _un fichier qui touche l'émulateur n'a qu'une maison — la
lane `emulator`_ ; l'oubli reste toutefois visible, car le garde A3 annonce bruyamment toute
interférence (`sync_counter_corrupt`) plutôt que de l'absorber.

### Option A4 — retirer `_sync_meta` du `wipeAll`

- **Insuffisant, rejetée** : les effacements de `users` (401) et de `kitchen`/`kitchen/u1`
  (perte de mise à jour, `Transaction is invalid or closed`) subsistent ; le compteur effacé
  n'est qu'une des manifestations.

**Recommandation : option A3.** Simple, fiable, maintenable ; aucun mécanisme de gestion des
workers au-delà de la configuration Vitest.

## 4. Sujet B — timeout du test concurrent

### 4.1 Données de durée (post-A3, émulateur sain, sans interférence)

| Exécution                          | Durée du test                     |
| ---------------------------------- | --------------------------------- |
| Répétitions isolées (×6)           | 4,1 – 11,2 s                      |
| Fichier complet isolé (22/22)      | ≈ 12 s (95 % du temps du fichier) |
| Campagne séquentielle (1 101 / 0)  | included, aucune exception        |
| Sous interférence (hors périmètre) | 17,7 s ; timeout 5 s              |

La contention réelle (six `transact` sérialisés avec revalidation de lecture, chaque conflit
relançant une tentative) prend naturellement **plusieurs secondes** ; le délai par défaut de
5 s est **structurellement trop court** depuis la correction A3 (qui rend les relances réelles
et correctes au lieu d'un faux échec immédiat).

Le maximum observé en conditions saines est **≈ 12 s** ; le délai proposé de 15 s constitue
donc une **marge d'environ 25 %** au-dessus de cette durée mesurée — marge proportionnée,
qui reste très en dessous des 30 s utilisés pour l'investigation.

### 4.2 Proposition

**Délai explicite de 15 000 ms sur ce seul test**, dans `server/storage/contract.ts` (l. 233) :

```ts
it('serialises concurrent transacts on the same document: no read-merge-write loses a section',
  async () => { ... },
  15_000,
);
```

Justification :

- marge d'environ **24 à 25 %** au-dessus des 12,1 s observées en conditions saines :
  proportionnée à la mesure, pas arbitraire ;
- **la moitié des 30 s utilisés pendant l'investigation** : un blocage persistant est détecté
  nettement plus tôt qu'avec le délai d'investigation, au lieu d'être masqué ;
- le délai **global de 5 s reste inchangé** pour tous les autres tests : toute régression qui
  ralentirait la suite ailleurs continue d'échouer vite ;
- portée : `contract.ts` est partagé par tous les adaptateurs (`describeDataStore`) — le plafond
  de 15 s s'applique donc aussi aux instances mémoire/SQL du même test, qui durent des
  millisecondes : sans effet sur elles, et protection pour les futurs adaptateurs ;
- **watchpoint sans changement** : le `afterAll` de `kitchenStockConvergence.test.ts` (l. 340,
  `hookTimeout` 10 s) a dépassé uniquement sous interférence ; la sérialisation du sujet A
  l'élimine ; aucun ajustement de hook prévu dans ce lot.

## 5. Fichiers à modifier (après autorisation distincte)

| Fichier                                 | Changement                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                        | scission en deux projects (lane `emulator` sérielle / lane `unit` parallèle) — ~15 lignes, section `test` uniquement |
| `server/storage/contract.ts`            | délai explicite 15 000 ms sur le test concurrent (l. 233) — une ligne                                                |
| `docs/encyclopedie/09-qualite-tests.md` | documentation des commandes de campagne et de la règle d'ajout d'une future suite émulateur à la lane `emulator`     |
| `CLAUDE.md`                             | mise à jour des conventions de campagne si le chef l'estime utile (§ Git/qualité)                                    |

**Intouchés** : `server/storage/firestoreStore.ts` (A2+A3), tous les autres tests,
`scripts/diagnostics/*`.

## 6. Scénarios de tests et critères d'acceptation

1. **Campagne complète parallèle avec émulateur** (commande exacte du § 7, forme 2) :
   **0 échec**, dont 22 tests contrat + 5 convergence + 10 tests A3 verts — **reproductible sur
   ≥ 3 exécutions consécutives** (le cas qui échouait de façon flouque) ;
2. **Co-exécution des deux fichiers émulateur** (§ 7, forme 3) — la reproduction minimale de
   l'interférence : **0 échec, 27 tests verts / 10 skippés** (22 contrat + 5 convergence ; les
   10 tests hors émulateur de la convergence restent ignorés, et les **10 tests A3 dédiés**
   sont vérifiés séparément par la forme 2 du § 7 et par le critère 1), aucune trace
   `sync_counter_corrupt`, aucun 401 ;
3. **Campagne séquentielle** (§ 7, forme 4) : inchangée — 1 101 / 0 / 8 ;
4. **Sans émulateur** (§ 7, forme 5) : inchangé — 1 074 / 0 / 35, les deux fichiers émulateur
   ignorés (`describe.skipIf`) ; `npm run check` reste au vert sur les fichiers du lot
   (la dette préexistante hors périmètre reste classée) ;
5. **Le test concurrent** passe avec son plafond explicite de 15 s (jamais dépassé en sain ;
   toute exécution > 15 s devient un échec explicite, signalant un vrai problème).

## 7. Commandes exactes des campagnes finales

```bash
# (1) Lancement de l'émulateur (si nécessaire — configuration actuelle conservée)
cd ~/.cache/firebase/emulators && java -Duser.language=en -jar \
  cloud-firestore-emulator-v1.19.8.jar --host=127.0.0.1 --port=8080 &

# (2) Campagne complète parallèle avec émulateur — doit donner 0 échec
NODE_OPTIONS="--require ./scripts/diagnostics/tmp-admin-cert-preload.cjs" \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1 npm test

# (3) Co-exécution des deux fichiers émulateur (l'ancien cas d'interférence) — 0 échec
NODE_OPTIONS="--require ./scripts/diagnostics/tmp-admin-cert-preload.cjs" \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1 \
npm test -- server/routes/kitchenStockConvergence.test.ts server/storage/firestoreStore.test.ts

# (4) Campagne séquentielle de référence — 1 101 / 0 / 8
NODE_OPTIONS="--require ./scripts/diagnostics/tmp-admin-cert-preload.cjs" \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1 \
npm test -- --testTimeout=30000 --no-file-parallelism

# (5) Sans émulateur — 1 074 / 0 / 35
npm test

# (6) Vérification qualité
npm run check
```

## 8. Risques de régression et mitigations

| Risque                                                              | Mitigation                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un fichier de test exécuté deux fois (matché par les deux projects) | les deux fichiers émulateur sont explicitement exclus du project `unit` ; vérifié par les totaux des critères (1 109 tests au total, comme aujourd'hui)                                                                                                                                                          |
| Perte de l'exclusion des worktrees `.claude/**`                     | l'option racine `exclude` reste héritée par les deux projects ; les critères (1)-(5) la vérifient (aucun fichier des worktrees ne doit apparaître)                                                                                                                                                               |
| Flags CLI (`--testTimeout`, `--no-file-parallelism`) plus appliqués | Vitest 5 applique les options CLI à tous les projects ; vérifié par les formes (2) et (4)                                                                                                                                                                                                                        |
| Future suite émulateur oubliée dans la lane `emulator`              | règle explicite (§ 3, option A3) : ajout au `include` du project `emulator` **et** à l'`exclude` du project `unit`, les deux à la fois ; commentaire dans la config + documentation dans `09-qualite-tests.md` à l'implémentation ; le symptôme (interférence) reste visible et le garde A3 l'annonce bruyamment |
| Comportement des adaptateurs mémoire/SQL du test concurrent         | plafond 15 s inoffensif pour eux (millisecondes) ; critère (5)                                                                                                                                                                                                                                                   |
| Émulateur et environnements                                         | aucune action sur l'émulateur dans l'implémentation ; les campagnes utilisent la configuration actuelle                                                                                                                                                                                                          |

## 9. Garanties de préservation

- **A2/A3 intacts** : aucune modification de `server/storage/firestoreStore.ts`, du test A3
  dédié (`firestoreStore.attempt.test.ts`), du test A2 (`firestoreStore.order.test.ts`) ni de
  tout autre test existant — seul `contract.ts` reçoit une ligne de délai, sans toucher à la
  logique du test ;
- **17 commits locaux intacts**, aucun commit/push/merge sans autorisation distincte ;
- **aucun nettoyage de fichiers**, aucune suppression (les scripts `tmp-*` restent exclus des
  commits comme convenu) ;
- l'émulateur n'est ni arrêté ni reconfiguré par le lot.

## 10. Conclusion

La recommandation est **l'option A3 (scission Vitest en deux projects, lane émulateur sérielle)
combinée au délai explicite de 15 s du test concurrent** : deux changements confinés
(`vite.config.ts`, `contract.ts`), déclaratifs, mesurés par les données de campagne, qui rendent
`npm test` fiable **dans toutes les formes** — parallèle, séquentielle, complète ou ciblée —
sans mécanisme supplémentaire et sans toucher à la logique A2/A3.
