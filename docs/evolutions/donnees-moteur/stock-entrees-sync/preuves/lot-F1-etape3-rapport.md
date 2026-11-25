# Lot F1 — Étape 3 — Rapport d'observation et de mesures

> **Statut** : exécution réalisée le 2026-11-19 (voir § 1), sur la branche `feature/datastore-contract`,
> dans le périmètre autorisé par le chef (dossier v4.2 validé, autorisation d'exécution distincte).
> **Aucun code de production n'a été modifié** ; aucun commit n'a été créé ; aucune donnée réelle
> n'a été touchée ; le serveur du chef (port 3000) n'a jamais été approché (tout a tourné en
> in-process ou sur un port éphémère, SQLite jetable dans `%TEMP%`).
> **Ce rapport est soumis à validation** avant toute clôture du lot F1 ; les commits attendront
> une autorisation distincte.
> **Complément du 2026-11-19** (revue du chef) : `lot-F1-etape3-rapport-complement.md` — D3
> précisé (§ 1), M5 complété (§ 2), analyse A1–A4, comparaison E4 et priorisation.

---

## 1. Environnement et reproductibilité

| Élément | Valeur |
| --- | --- |
| Node | v26.13.0 |
| firebase-tools | 14.27.0 (émulateur Firestore, `--project demo-chnawa-f1`, ports 8080/4000) |
| Java | 18 (firebase-tools avertit : JDK 21+ requis prochainement) |
| Adaptateur de mesure | `scripts/diagnostics/measure-lot-F1.ts` (créé pour l'étape 3, non commité) |
| Seed | `scripts/diagnostics/seed-lot-F1.ts` (700 ingrédients, SQLite jetable, non commité) |
| Serveur isolé | routes réelles Express en in-process (`bootRoutes`), SQLite `%TEMP%/lot-f1-*.sqlite` |
| Fixtures de test | `server/routes/lotF1LegacyFixture.test.ts` (D2, non commité, 2 tests) |
| Date des règles officielles | `firebase.google.com/docs/firestore/quotas` et `/docs/firestore/storage-size`, **relu le 2026-11-19** : document limité à **1 Mio = 1 048 576 octets** |

Chaque section du harnais est reproductible individuellement :
`npx tsx scripts/diagnostics/measure-lot-F1.ts <sizes|projection|load|fusion|sync|caps|b2|isolation|backup|d1|d3>`.
La variante « localStorage réel » de M3 : `NODE_OPTIONS="--localstorage-file %TEMP%/lot-f1-ls.json"`.
Les mesures annoncées ci-dessous sont **celles des exécutions datées du jour du rapport** ; deux
séries indépendantes par point (protocole § 4.2), p50/p95/max au rang le plus proche.

---

## 2. Décompte des tests

| Situation | Passés | Échecs | Skippés | Fichiers |
| --- | --- | --- | --- | --- |
| Référence étape 2 (sans émulateur, sans fixture) | 1 058 | 0 | 35 | 111 |
| Sans émulateur, avec la fixture D2 (non committée) — **vérifié stable sur 4 tirages** | **1 060** | 0 | 35 | 112 |
| Avec émulateur + préchargeur d'identifiants (voir § 3-A0) | **1 079** | **8** | **8** | 112 (inclut la fixture D2, +2 tests) |

- Le dossier attendait **1 063 passés / 30 skippés**. **Ce chiffre n'est PAS atteint** : les 27
  tests émulateur (22 `firestoreStore.test.ts` + 5 convergence) s'exécutent bien, mais **8 échouent**
  (19 passés). Les 8 échecs se ramènent à **deux défauts réels de l'adaptateur Firestore** (§ 3-A2
  et § 3-A3) — **jamais présentés comme validés**, ils ne l'ont jamais été avant cette campagne.
- Un tirage intermédiaire de la suite sans émulateur a montré 5 échecs transitoires (contension
  de ports juste après l'arrêt de l'émulateur) ; les 4 tirages suivants sont stables à
  **1 060 / 0 échec / 35 / 112**.

---

## 3. Anomalies découvertes (aucune corrigée sans autorisation)

### A0 — Environnement : clé PEM factice refusée par Node 26 (bloque l'émulateur hors contournement)

Les suites émulateur commises initialisent firebase-admin avec `cert({ privateKey: 'x' })`.
Les versions antérieures acceptaient ce qui n'est pas une vraie clé ; le parseur PEM strict de
Node 26 refuse (`error:1E08010C:DECODER routines::unsupported`) et `beforeAll` échoue. Pour
**mesurer** (pas pour masquer), un préchargeur jetable
`scripts/diagnostics/tmp-admin-cert-preload.cjs` (non commité) fait valider une clé factice par
le parseur — l'émulateur ne signe rien. **Les chemins à vraies credentials de production ne sont
pas affectés** ; le shim ne valide pas le chemin de credentials réelles (limite consignée § 9).

### A1 — Limite de production 100 Kio sur `/api/kitchen` : refus 413 à volume réaliste (sérieux)

`server/app.ts:81-85` applique `express.json({ limit: '100kb' })` à `/api/kitchen` (seuls
`VISION_PATH` et `/api/data/*` passent en 5 Mio). Reproduction sur les vraies routes
(`scripts/diagnostics/gdir-repro-413.ts`) :

| Charge | Taille du corps | Réponse |
| --- | --- | --- |
| 300 entrées enrichies (cap B1a) | 93.2 Kio | HTTP 200 |
| 2 000 tombstones (cap B1c) | 498.1 Kio | **HTTP 413** (rejeté par le body parser, avant l'authentification) |

Conséquence : **les caps du serveur (B1c/B1d) ne sont pas atteignables en production** — un état
légal selon `STOCK_LIMITS` est rejeté par la couche HTTP avant toute validation métier. Le
harnais de mesure relève volontairement la limite à 5 Mio (`express.json({ limit: '5mb' })`) pour
pouvoir mesurer les caps ; cet écart harnais/production est assumé et signalé partout.

### A2 — Adaptateur Firestore : `commit` multi-collections viole la règle « lectures avant écritures » (sérieux, production Firestore incluse)

Sur l'émulateur, **tout `commit` touchant plusieurs collections échoue** :
`Firestore transactions require all reads to be executed before all writes`. Cause exacte :
`server/storage/firestoreStore.ts` — `stampTx` écrit le compteur (`tx.set(counterRef…)`) **puis**,
pour la collection suivante du même commit, relit un compteur (`tx.get`) — une lecture après
écriture dans la même transaction, ce que Firestore interdit **en production comme sur
l'émulateur** (règle documentée, pas une bizarrerie de l'émulateur).

Impact direct mesuré : `createAccount` (users.ts:134) commet `users/{uid}` + `auth/{uid}` +
`email_index/{email}` — **la création de compte échoue** sur le fournisseur Firestore (les 5
tests de convergence émulateur échouent en cascade par un 401 à l'enregistrement). Idem pour le
test de contrat « writes a batch atomically… » (3 collections) et « claims an absent guarded
document… ». Les adaptateurs SQLite et mémoire ne subissent pas cette règle — c'est pourquoi les
suites passaient jusqu'ici. **Correctif interdit sans autorisation.**

### A3 — Adaptateur Firestore : compteur de session non annulé sur rejeu de transaction (concurrence)

`sessionMax` (firestoreStore.ts) n'est pas restauré quand une transaction est re-jouée après
contention : la relecture du compteur peut renvoyer une valeur **inférieure ou égale** à celle
déjà observée par la tentative avortée → levée déterministe de `sync_counter_corrupt`
(« counter behind the observed maximum ») au test de contrat
« serialises concurrent transacts on the same document » (6 `transact` concurrents, émulateur).
Le mécanisme de garde est sain ; c'est l'état de session qui ne suit pas les rejeux. **Correctif
interdit sans autorisation.**

### A4 — Client : l'état en attente au-delà des caps est tronqué par la relecture locale (perte silencieuse)

Scénario (harnais `caps`) : un appareil adopte l'état combiné B1d (600 actives + 2 000
tombstones) puis ajoute **une** entrée frigo (modification légale en local, push refusé 400 par
le serveur, section restée en attente — conforme). **Mais** à la relecture suivante du document
local : `parseStockSection` refuse **la section entière** (301 > cap 300 via `withinStockCaps`)
et la relecture de la carte legacy projetée (`parseElementSet`, cap `ELEMENT_SET_LIMITS.added`
= 300) **écarte la version la plus ancienne** ; `doc()` retombe alors sur la reconstruction
legacy (`buildStockFromLegacy`). Résultat observé, reproductible :

- l'entrée ajoutée est conservée (l'appareil la rejouera) ;
- **l'entrée adoptée la plus ancienne (`st_fridge_ing0299`) disparaît silencieusement** de l'état
  visible — à l'encontre du principe « refus explicite, jamais troncature silencieuse ».

Le mécanisme « en attente » fonctionne (pending = 1, push 400, retry), mais l'état local qui le
porte n'est pas garanti au-delà des caps. Repro local pur : `scripts/diagnostics/tmp-toggle-debug.ts`.
**Correctif interdit sans autorisation.**

---

## 4. Campagne A — convergence et contrat sur l'émulateur

| Point | Résultat |
| --- | --- |
| Suite SQLite de convergence (`kitchenStockConvergence.test.ts`) | **10/10 passées** (déjà comptées dans la référence) |
| Suite émulateur (22 + 5 tests) | **19 passées / 8 échouées** — les échecs sont les défauts A2/A3 (§ 3), pas des surprises de données |
| Décompte complet avec émulateur | **1 079 passés / 8 échecs / 8 skippés / 112 fichiers** (attendu dossier : 1 063/30 — **non atteint**) |

---

## 5. Campagne B — caps, convergence aux caps, cas défensif, isolation

**B1 — chaque limite, puis l'état combiné** (harnais `caps`, serveur isolé SQLite) :

| Observation | Résultat |
| --- | --- |
| 300 entrées frigo acceptées | OUI |
| 301e entrée frigo | HTTP 400 · document précédent intact · aucune écriture partielle |
| 300 entrées placard (frigo plein en même temps) acceptées | OUI |
| 301e entrée placard | HTTP 400 · document précédent intact · aucune écriture partielle |
| 2 000 tombstones acceptées | OUI |
| 2 001e tombstone | HTTP 400 · document précédent intact · aucune écriture partielle |
| État combiné B1d (300 + 300 + 1 800) accepté | OUI |
| Dépassement combiné (301e frigo) | HTTP 400 · document précédent intact · aucune écriture partielle |
| Modification refusée restée en attente (client) | pending = `['stock']`, push 400 — **mais voir A4** (troncature locale de la relecture) |

**B2 — convergence à volume maximum** (état B1d, marge de 200 tombstones) : deux appareils,
**3 cycles complets** (retrait/ré-ajout d'entrées existantes uniquement, aucune cap dépassée) →
**convergence stricte OUI** (stocks strictement égaux), état final 600 actives / 1 803
tombstones, idempotent.

**B3 — tombstone sans stub non décodable** : cas défensif couvert par les tests existants
cités — `src/core/kitchen/entries.test.ts:376` (« keeps a stub-less tombstone with a
non-decodable id — excluded from attribution ») et `:1045` (« … anomaly, never silent ») :
aucune attribution inventée, l'anomalie est signalée, jamais silencieuse.

**B4 — isolation entre comptes** (harnais `isolation`, comptes fictifs) : A lit/écrit uniquement
son stock A, B uniquement le sien ; l'écriture de A n'a pas touché le document de B ; un champ
`uid` forgé dans le corps est **ignoré** (HTTP 200, document de B inchangé) ; un jeton forgé
obtient **401 sans aucune lecture** ; les projections legacy restent limitées au bon compte ;
deux appareils du même compte convergent toujours. L'identité du propriétaire est résolue côté
serveur depuis le Bearer (`verifyUserSessionToken` → `session.sub`), aucun uid client accepté.

---

## 6. Campagne C — performances (tranche l'arbitrage E4)

**M1a / M1b — taille du document complet** (payload JSON réel ; estimation Firestore suivant les
règles officielles relues le 2026-11-19 ; **aucun type non pris en charge signalé** :
l'estimation couvre tous les types du modèle, y compris tableaux et objets imbriqués) :

| Config (entrées frigo+placard / tombstones) | M1a (payload) | M1b (estimation Firestore) | Part du 1 Mio |
| --- | --- | --- | --- |
| 100 + 500 | 202.1 Kio | 392.7 Kio | 38.4 % |
| 300 + 500 | 277.4 Kio | 531.8 Kio | 51.9 % |
| 300 + 2 000 | 747.7 Kio | 1 453.2 Kio | **141.9 %** |
| 600 + 2 000 (= état caps B1d plein + tombstones à cap) | 860.6 Kio | **1 661.7 Kio** | **162.3 %** |

> **Constat E4 majeur** : **l'état maximal que les caps actuelles autorisent dépasse la limite
> du 1 Mio Firestore** (1 661.7 Kio estimés = 162.3 %) — même sans placard (141.9 %). En
> production Firestore, un tel document serait refusé par le fournisseur. L'estimation est
> **indicative** (ni validation émulateur de la taille réelle, ni garantie production), mais le
> dépassement est si large (~60 %) qu'il n'est pas imputable à la marge d'erreur du modèle.
> Le document inclut les projections legacy, favoris (50), planning (7 j), courses (30 articles)
> et préférences (20 bases du placard) — le pire cas complet du modèle.

**M2 — coût de fusion des tombstones** (PUT réels, SQLite, 2 séries de 50) :
500 tombstones p50 21.43 / 17.19 ms · 2 000 tombstones p50 50.86 / 51.11 ms ; comparable à une
section ensemble de même cardinalité (2 000 versions de favoris : p50 40.82 / 41.79 ms). Aucun
décrochage propre au stock.

**M3 — chargement local** (document de 747.8 Kio, 2 séries de 20) : localStorage **réel**
(`--localstorage-file`) p50 3.46 / 3.30 ms · p95 4.98 / 4.84 ms ; en repli Map-backed
(pipeline identique, lecture = accès objet) p50 2.53 / 2.41 ms.

**M4 — projection / présence dérivée** (fonctions pures, 1 000 échantillons) :
présence dérivée 300 entrées p50 0.04 ms (max 1.17) · 600 entrées p50 0.08 ms (max 0.98) ;
carte legacy projetée 300 p50 0.07 ms (max 0.58) · 600 p50 0.12 ms (max 0.73). **Indicateur
observé << 1 ms au p50, quelques ms au max** — cohérent avec le repère contextuel du lot 1.4
(put unitaire p95 0.39–0.47 ms), jamais présenté comme une caractéristique universelle.

**M5 — push/pull isolés** (2 séries de 50, SQLite in-process) :
push complet (300 entrées enrichies) p50 10.34 / 10.08 ms (p95 12.44 / 12.07) ;
pull (document complet à volume max) p50 2.19 / 2.19 ms (p95 4.16 / 3.70).

**Niveaux de concurrence C2/C3/C5** (2, 3 et 5 appareils simulés, même compte, deux faces) :

| Niveau | Face fonctionnelle (3 cycles) | Face performance (≥ 50 pushes × 2 séries) | Convergence après pushes concurrents |
| --- | --- | --- | --- |
| C2 (2 appareils) | convergence OK (stocks strictement égaux) | simultanéité max constatée 2/2 · p50 19.40 / 18.48 ms · p95 22.63 / 28.01 | OK |
| C3 (3 appareils) | convergence OK | simultanéité 3/3 · p50 26.77 / 27.00 ms · p95 31.76 / 31.40 | OK |
| C5 (5 appareils) | convergence OK | simultanéité 5/5 · p50 43.33 / 43.74 ms · p95 51.42 / 74.58 | OK |

Le dispositif impose une **barrière de synchronisation** (aucun décalage forfaitaire de 500 ms) ;
les résultats incluent les exécutions réellement simultanées et les sérialisations/attentes. Le
débit est rapporté **par base et par exécution**, « aucune valeur générique n'est retenue comme
référence de capacité » (§ 4.3 bis) ; les recommandations officielles de débit seront relues et
datées **à la mise en production**, jamais transformées ici en plafond chiffré (§ 4.4).

---

## 7. Campagne D — migration et compatibilité

| Point | Résultat |
| --- | --- |
| D1 — conversion legacy réaliste via le vrai serveur (cas § 7.1 : `added` seul, `removed` seul, `removed` > `added`, `added` > `removed`, `removed` == `added`, **écho `device:'server'` ignoré** ; deux emplacements) | **conversion identique client/serveur** (mêmes ids déterministes, mêmes versions, comparaison avec la même fonction core) · écho ignoré · **projection à jour** · sections legacy régénérées conformes |
| D2 — comportement d'un client legacy réel | fixture `server/routes/lotF1LegacyFixture.test.ts` : la chaîne historique exacte `parseElementSet → mergeElementSets → presentIds` (commit `f6cd2ed`, fonctions inchangées de `src/core/kitchen/elementSets.ts`) lue sur les sections **projetées** par les vraies routes : présence exacte (frigo `[ing1]`, placard `[ing3]`), la tombstone du serveur **empêche la résurrection** d'un élément présent localement ; l'écriture pleine carte de l'ancien client est convertie sans perte ni résurrection (ids déterministes `st_fridge_*`). 2/2 passés. Limite consignée : le **chemin de données** de l'ancien client est vérifié, pas le binaire historique (UI non rejouée) |
| D3 — appareil revenant après > 83 jours (`STALE_DEVICE_MS`) | **mesuré : la face « survie » uniquement** (scénario 6 : le push de rattrapage réussit au retour en ligne) — changement hors ligne conservé, horloge conservée, conflit par enveloppe selon le compromis § 6.3 ; **la face « perte » (push de rattrapage en échec au retour → pending effacée par le reset) n'a pas été exercée** : aucune mesure, aucune annonce. Voir le complément § 1 (contradiction identifiée avec le texte du dossier § 6.3 sur ce que couvre le test commis ; erratum proposé, décision du chef) |
| D4 — sauvegardes, deux appareils | export → import/restauration (`parseBackup`) → synchronisation : **8 enveloppes relues, stocks strictement identiques** ; ancien backup sans stock relu compatible (champ stock absent) |
| D5 — rollbacks A et B | **relus, non exécutés** : A = les sections legacy restent maintenues par les projections (tests (i)/(ii) existants + D2 ci-dessus) ; B = le retour passe par la sauvegarde (D4) ; procédures § 13 du dossier d'exécution, préconditions vérifiées, statut consigné |
| Démonstration navigateur (non-régression frigo/placard, 4 langues × clair/sombre, 375/320 px, serveur isolé 3001) | **NON EXÉCUTÉE** : le lancement du serveur de démonstration a été refusé par l'outillage de revue automatique. Requiert une commande directe du chef ou une autorisation explicite — aucun écart d'interface ne peut donc être constaté dans cette campagne |

---

## 8. Proposition E4 — chiffrage soumis à la décision du chef

Faits mesurés (estimation M1b, indicative — voir § 6) :

- Intersection linéaire observée : ~0.61 Kio par tombstone, ~0.70 Kio par entrée placard, base
  ~0.22 Kio (300 frigo) / ~0.43 Kio (600 entrées) — interpolation entre les points mesurés
  300+500 (531.8 Kio) et 300+2 000 (1 453.2 Kio).
- **Avec les caps actuelles (300 + 300 + 2 000)** : 1 661.7 Kio = **162.3 % du 1 Mio** → au-delà
  de la limite du fournisseur Firestore actif.
- Pour rester **sous 100 %** du 1 Mio avec 600 entrées : tombstones ≤ ~1 000 (point calculé à
  l'interpolation ; aucune garantie de la valeur exacte en production).
- Pour rester **sous ~80 %** (objectif indicatif du dossier, § 4.3-M1b) avec 600 entrées :
  tombstones ≤ ~650 ; avec 300 entrées : tombstones ≤ ~500 (point mesuré : 51.9 % à 500).

Options (jamais de troncature silencieuse en compensation) :

1. **Confirmer 300/2 000** — cohérent avec la cap legacy `removed` (2 000) et la rétention de
   90 jours, mais l'état maximal est **refusé par le fournisseur** (1 661.7 Kio) et, en l'état,
   **par la couche HTTP** (A1) : la combinaison actuelle n'est pas déployable en production
   Firestore. Ne peut être retenu qu'avec un mécanisme supplémentaire (par exemple un
   fractionnement du document) — hors périmètre F1, décision du chef.
2. **Ajuster la cap tombstones à ~650** (garde ~80 % avec 600 entrées) — coût : au-delà de 650
   suppressions sur 90 jours, le refus explicite 400 s'applique (comportement déjà testé) ;
   l'utilisateur doit purger (par exemple via « vider un emplacement », opération distincte
   validée E3). Aucune perte de données actives ; les caps d'entrées (300/emplacement) restent
   inchangées.
3. **Ajuster la rétention** (90 jours → plus court) pour que le compteur se vide seul — modifie
   la fenêtre de résurrection entre appareils (garantie anti-résurrection couverte par la marge
   `STALE_DEVICE_MS`), à arbitrer avec le risque de changement perdu « plus ancien que la
   rétention ».

Le choix, y compris l'option « modifier les deux » (ex. 650 + rétention inchangée), est soumis
à la décision du chef ; toute retouche de `STOCK_LIMITS` sera précédée d'une mise à jour des
tests de caps (B1) et de la documentation.

---

## 9. Limites de portée (honnêteté de mesure)

- **Émulateur** : il ne reproduit pas tous les comportements transactionnels ni toutes les
  limites de production ; les résultats émulateur (§ 4, A2/A3) portent sur des règles **qui sont
  aussi des règles de production documentées** (ordre lectures/écritures en transaction), mais
  **aucun test n'a été exécuté sur une production réelle** — aucune connexion demandée.
- **M1b est une estimation** suivant les règles officielles (re-datées au rapport) : elle n'est
  ni une validation émulateur de la taille réelle, ni une garantie de la taille de production ;
  le dépassement constaté (~60 % au-dessus de la limite) est toutefois hors marge d'erreur.
- **Le harnais relève la limite HTTP à 5 Mio** (`express.json({ limit: '5mb' })`) ; la
  production applique 100 Kio (A1) — tous les chiffres de caps sont donc des caps **du
  mécanisme**, pas des caps atteignables en production en l'état.
- Le **préchargeur d'identifiants** (A0) fait mesurer l'émulateur sur Node 26 ; il ne valide pas
  le chemin de credentials réelles.
- La **démonstration navigateur** n'a pas tourné (§ 7) : aucun constat d'interface dans ce
  rapport.
- Les temps mesurés sont **locaux, in-process, SQLite jetable** : ni réseau, ni Firestore
  distant, ni production — chaque valeur est un « risque observé à X ms », jamais une
  performance théorique.

---

## 10. Reste à faire, décisions demandées

1. **Validation de ce rapport par le chef** (aucune clôture de F1 avant).
2. **Décision E4** (§ 8) : caps confirmées ou ajustées.
3. **Arbitrage sur les anomalies** : A1 (limite HTTP), A2/A3 (adaptateur Firestore — la
   création de compte échoue sur le fournisseur Firestore), A4 (troncature locale de l'état en
   attente). Aucun correctif sans autorisation ; A2 est le plus urgent si la production
   Firestore est censée gérer des comptes.
4. **Démonstration navigateur** : autoriser le lancement du serveur isolé (port 3001) ou la
   dérouler sous commande directe.
5. **Commits** : les artefacts de l'étape 3 (harnais de mesure, seed, fixture D2, rapport) et la
   suppression des scripts temporaires attendent une autorisation distincte — rien n'a été
   commité.
6. Nettoyage final après décision : fichiers `%TEMP%` (SQLite jetables, localStorage de mesure),
   **émulateur Firestore encore en cours d'exécution (PID 52504, ports 8080/4000)** — son arrêt a
   été refusé par l'outillage (arrêt de processus interdit) : à arrêter par le chef ou sur
   autorisation explicite —, scripts temporaires (`tmp-*.ts`, `tmp-admin-cert-preload.cjs`,
   `gdir-repro-413.ts` — la repro 413 est conservée pour la reproduction, à décider) supprimés
   ou commités selon le souhait du chef ; `server/routes/tmp-debug.test.ts` reste hors commit
   (suppression toujours bloquée par l'outillage).
