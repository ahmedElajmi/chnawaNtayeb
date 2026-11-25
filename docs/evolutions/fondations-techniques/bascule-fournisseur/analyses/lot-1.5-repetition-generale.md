# Lot 1.5 — Répétition générale de la migration globale : dossier de réalisation (à examiner avant tout développement)

**Statut** : **dossier examiné — lot REPORTÉ après 5b/6a (décision du chef)** · **aucun développement lancé, aucun autorisé**
**Décision du chef** : le lot 1.5 **reste obligatoire** (procédure complète Firestore → SQL + retours arrière A et B) mais sera réalisé **sur des modèles stabilisés et représentatifs de l'architecture cible** — justification : ne pas répéter sur des modèles voués à évoluer puis refaire le travail. La phase 1 se poursuit sans lui (1.1–1.4 clôturés ; 1.6 reporté aux opérations de bascule). Ce dossier est **conservé comme référence** pour la reprise du lot ; sa mise à jour (périmètre sur modèles stabilisés) se fera à la reprise, avec examen du chef.
**Séquencement validé (correction du chef — la répétition doit précéder la migration définitive)** : 1) phase 5b — stabilisation et validation des modèles ; 2) **préparation de 6a** — définition et validation du mapping de migration correspondant aux modèles stabilisés ; 3) **lot 1.5** — répétition générale complète, comparaison et tests des retours arrière A et B ; 4) **phase 6a** — migration définitive, **uniquement après validation du lot 1.5** ; 5) **lot 1.6** — opérations liées à la bascule effective, selon son périmètre.
**Règle à formaliser à la validation du lot 1.5 (décision du chef, pas avant)** : chaque évolution du modèle de données sera évaluée au regard de ses conséquences sur la portabilité Firestore/SQL et sur les mécanismes de migration et de retour arrière. D'ici là, les évolutions continuent de respecter les principes déjà validés (portabilité, persistance SQL véritablement relationnelle, préservation des identifiants/relations/révisions/tombstones, aucune dépendance au fournisseur dans les règles métier).
**Lot** : 1.5 (phase 1, plan § 5) · **Dépend de** : 1.4 (**validé et clôturé**, commit `d860a68`)
**Décision 🚩 prévue par le plan** : **validation de la procédure** — la bascule en production reste une **décision explicite distincte, jamais automatique**. Le dossier ajoute **une décision de portée** (§ 7-1 : la transformation relationnelle pendant la répétition) à examiner avant développement.
**Réserve activée** : les **22 tests Firestore ignorés** (suite émulateur de 1.2) sont **exécutés dans ce lot** — c'était leur réserve annoncée.

---

## 1. Synthèse

- **Objectif** : démontrer, **hors production**, que la chaîne complète « Firestore → SQL → retour Firestore » ne perd ni n'écrase rien : export complet, transformation, import, **comparaison exhaustive zéro écart**, bascule, **retour arrière démontré dans les deux scénarios** (A : immédiat ; B : après usage réel de SQL, y compris un appareil hors ligne avec des modifications en attente), **mesure de la fenêtre de gel**. **Production intacte, aucune écriture en production** — toute la répétition tourne sur l'**émulateur Firestore** et un SQLite local.
- **Faits vérifiés qui structurent le lot** :
  1. la collection interne **`_sync_meta`** (compteurs de révisions Firestore, un document par collection, `firestoreStore.ts:35–36`) fait partie de la cartographie de migration — sans elle, la séquence de révisions redémarre ;
  2. le contrat `get` **cache les tombstones côté SQL** (`sqlStore.ts:225–228` : `row && !row.deleted ? … : null`) mais les expose sur Firestore et mémoire — l'export et la comparaison doivent donc lire **au niveau du stockage** (par adaptateur), **jamais via le contrat** ;
  3. l'endpoint existant `/api/data/:name/replace` **ré-estampille les révisions** (il passe par `put`, `dataRoutes.ts:209–233`) — **inutilisable** pour un import fidèle : l'import préserve les révisions d'origine et écrit au niveau du stockage, par adaptateur ;
  4. **aucun outil de migration n'existe** (rien dans `scripts/` en dehors des diagnostics et du benchmark de 1.4) — les outils du lot sont des livrables ;
  5. côté client, **aucune file d'écriture hors ligne pour les collections partagées** (`sharedCollectionHttp.ts` : les écritures partent en HTTP direct, une écriture hors ligne échoue et se relance) — le **frigo** conserve ses **sections en attente localement** et les pousse à la reconnexion (`KitchenSync.ts:23` : « a push that failed stays pending and is retried on the next trigger ») : le scénario B s'appuie sur cette mécanique exacte ;
  6. après un retour tardif, l'adaptateur estampe à **`max(horloge, maxImporté + 1)`** (décision 1.1 § 8) — la monotonie des révisions après retour arrière B est un critère testé, pas une supposition.
- **Le lot est un lot d'outils, de procédure et de démonstration** — pas une migration réelle, pas une écriture en production, pas d'évolution de modèle.

## 2. Rappel du lot (plan § 5, verbatim condensé)

> **Répétition générale de la migration globale — hors production** : procédure complète exécutée sur environnement de test — **sauvegarde complète**, import, **comparaison exhaustive zéro écart**, restauration obligatoire, bascule, **retour arrière démontré dans les deux scénarios (A : immédiat ; B : après usage réel de SQL — écritures, révisions, comptes, droits, hors ligne, marqueurs de suppression)**, mesure de la **fenêtre de gel** ; **production intacte, aucune écriture en production**.
> **Existant** : M `identity.ts`, C comptes atomiques. **Critères** : procédure validée et mesurée ; restauration testée ; comparaison Firestore/SQL zéro écart ; retours arrière A et B **démontrés**. 🚩 **Validation de la procédure** — bascule en production = décision séparée.

## 3. État vérifié du code — tableau d'écart

| Élément                                     | État                   | Evidence                                                                                                                                                                                                       | Reste à faire en 1.5                                                                                                                                                |
| ------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export complet Firestore                    | —                      | **Inexistant** — le seul chemin de lecture complet est `changes(name, 0, pageLimit)` + `ids()` + `get()` au contrat, qui perd les tombstones côté SQL et ignore `_sync_meta`                                   | **C1** — outil d'export au niveau du stockage (22 collections + `_sync_meta`, tombstones, révisions)                                                                |
| Import fidèle (révisions préservées)        | —                      | `/replace` ré-estampille (`put`) ; `put` génère toujours une révision neuve                                                                                                                                    | **C1** — import par adaptateur : écriture directe des révisions d'origine (Firestore : Timestamp + compteur `_sync_meta` ; SQL : INSERT avec la révision d'origine) |
| Comparaison exhaustive                      | —                      | Inexistante                                                                                                                                                                                                    | **C1** — comparateur : ensemble d'ids, contenu champ par champ, révision, tombstones, compteurs — zéro écart exigé                                                  |
| Cible SQL de la répétition                  | C                      | `sqlStore.ts` (harnais générique, 22 tables) + pilote relationnel Identity (`relationalPilot.ts`, `users`/`auth`/`email_index` en colonnes typées)                                                             | **C2** — décision de portée (§ 7-1)                                                                                                                                 |
| Suite émulateur Firestore                   | C (réserve)            | 22 tests `describe.skipIf(!emulatorReady)` dans `firestoreStore.test.ts`                                                                                                                                       | **C5** — exécutés dans ce lot                                                                                                                                       |
| Reprise client après bascule                | C                      | Curseur de sync `(revision, id)` + cache IndexedDB (`SyncedCollectionStore`, relecture complète après 30 jours hors ligne) ; frigo : sections en attente locales, push en reconnexion (`KitchenSync.ts:23,78`) | **C4** — démonstration scénario B avec un client réel sur les endpoints                                                                                             |
| Monotonie des révisions après retour tardif | Décidée, non démontrée | 1.1 § 8 : `max(horloge, maxImporté + 1)`                                                                                                                                                                       | **C4** — démontrée par le scénario B (écritures post-retour continuent la séquence)                                                                                 |
| Fenêtre de gel                              | —                      | Inexistante                                                                                                                                                                                                    | **C3** — mesurée pendant la répétition                                                                                                                              |

## 4. Conception proposée — six chantiers

### C1 — Outils de migration (`scripts/migration/`, hors de l'application)

Trois outils opérateurs, **lire/écrire au niveau du stockage** (jamais via le contrat — cf. tombstones et révisions) :

1. **`export-firestore.ts`** : export canonique complet — les 22 collections du registre + `_sync_meta`, chaque document avec son id, sa révision (convertie Timestamp → entier millisecondes), son contenu exact et son état de tombstone ; format JSON par collection (format d'échange autorisé — JSON reste réservé aux échanges/exports/sauvegardes, règle permanente).
2. **`import-sql.ts`** : reconstruction exacte dans la cible SQL — révisions d'origine écrites telles quelles (INSERT direct, la séquence repart à `max+1` — mécanisme vérifié en 1.4), tombstones incluses, compteurs reconstruits.
3. **`import-firestore.ts`** : reconstruction exacte dans Firestore (cible du retour arrière) — révisions en Timestamp, documents de `_sync_meta` écrits au max importé.
4. **`compare.ts`** : comparaison exhaustive **zéro écart** entre deux exports : ensemble d'ids identique par collection, contenu champ par champ, révision égale, tombstones égales, `_sync_meta` égale ; tout écart = échec nominatif (collection, id, champ).

- **Garde de sécurité** : chaque outil **refuse de tourner sur la production** — il exige l'environnement émulateur (`FIRESTORE_EMULATOR_HOST`) ou un chemin SQLite local, et **refuse les identifiants Firestore réels** (aucune lecture ni écriture de production, même accidentelle).

### C2 — Cible de la répétition (🚩 décision de portée, § 7-1)

Le dossier distingue **la mécanique** (export/import/comparaison/bascule/retour) de **la transformation relationnelle** (documents → tables par domaine). Deux options :

- **Option A (recommandée)** : la répétition valide la **mécanique complète** sur les 22 collections via le harnais générique (`sqlStore`, tables uniformes — artefact de test assumé, décision 1.1 § 8), **et** démontre la **transformation relationnelle par domaine sur Identity** en étendant le pilote existant (`users`/`auth`/`email_index` → colonnes typées, tables de liaison, unicité e-mail) dans la même procédure ; la **spécification relationnelle par domaine** (tables, colonnes, clés, contraintes, index pour les 22 collections) est livrée comme document du lot, son implémentation complète restant attachée à la préparation de la bascule (arbitrage n° 5 du lot 1.2). _Justification_ : les modèles évoluent en 5b/6a — une implémentation relationnelle complète maintenant serait à refaire après l'évolution des modèles (double travail) ; la répétition doit valider la **procédure** et la **réversibilité**, pas figer un schéma destiné à changer.
- **Option B** : implémentation relationnelle complète des 22 collections incluse dans 1.5 — la répétition démontrerait alors exactement la transformation de production, au prix d'un périmètre beaucoup plus large et d'un travail à refaire après 5b/6a.

### C3 — Procédure de bascule et fenêtre de gel (runbook livré)

Procédure exécutée et **chronométrée** sur l'environnement de répétition :

1. **Sauvegarde complète** de l'état initial (export Firestore — la « restauration obligatoire » du plan est un retour à cette sauvegarde, testé) ;
2. **gel des écritures** (arrêt de l'application de répétition — le gel est la fenêtre mesurée) ;
3. export → import → **comparaison zéro écart** → **bascule** (la sélection du fournisseur passe à SQL) → dégel ;
4. la fenêtre mesurée = gel → dégel, sur le corpus de répétition ; **limite documentée** : le corpus de production sera plus grand — la fenêtre réelle s'estimera par extrapolation (coût de l'export/import mesuré en volume, cf. baseline 1.4) et sera mesurée à nouveau sur des données de taille réelle **avant** la décision de bascule.

- **Production intacte** : l'émulateur Firestore et un SQLite local uniquement ; aucun accès à la production, vérifié par la garde des outils (C1).

### C4 — Retours arrière A et B (démonstrations, pas des descriptions)

**Scénario A — retour immédiat** : après bascule et **aucune écriture SQL**, retour vers Firestore : export SQL → import Firestore → comparaison avec la sauvegarde initiale → **zéro écart** (la sauvegarde est la référence).

**Scénario B — retour après usage réel de SQL** (plusieurs « jours » simulés par un volume d'opérations réel) :

1. usage réel via les **endpoints** de l'application de répétition (jamais d'écritures directes) : publications de recettes (commits atelier + versions), créations de **comptes** (`users`+`auth`+`email_index` atomiques), modifications de **droits** d'employés, réglages publiés, **tombstones** (suppressions publiées), écritures frigo via `transact` ;
2. un **client réel** (navigateur sur l'app de répétition) a synchronisé : son cache IndexedDB porte des révisions de l'ère SQL ; un **appareil hors ligne** a des **sections frigo en attente** non poussées ;
3. **retour arrière** : gel → export SQL (révisions de l'ère SQL) → import Firestore → comparaison Firestore↔SQL zéro écart → dégel ;
4. **vérifications de non-perte** : chaque document écrit sous SQL est retrouvé **identique** dans Firestore ; les tombstones sont restaurées ; les **compteurs** continuent après le max importé (**monotonie** — une nouvelle écriture reçoit `max(…, maxImporté + 1)`, vérifié par test) ; le **client synchronisé** retrouve son curseur valide (le change feed ne lui redélivre rien de perdu) ; l'**appareil hors ligne** pousse ses sections en attente à la reconnexion et la fusion `transact` ne perd ni n'écrase aucune section (aucune donnée perdue ou écrasée lors du retour arrière — exigence du chef) ;
5. les comptes créés sous SQL se reconnectent (hash PHC, sessions serveur) ; les droits d'employé restent exacts.

### C5 — Activation de la réserve : la suite émulateur Firestore

Les **22 tests ignorés** passent dans ce lot (l'environnement de répétition est précisément l'émulateur). Ils se joignent aux suites de contrat et de contention déjà vertes pour couvrir l'adaptateur Firestore dans les mêmes conditions que la répétition. La variable `firestoreStore.test.ts` reste telle quelle — simplement exécutée.

### C6 — Livrable de procédure et limites

- **Runbook** opérateur pas-à-pas (commandes exactes, vérifications, points d'arrêt) — document livrable dans `docs/encyclopedie/donnees/`.
- **Critères de réussite** explicites : zéro écart (avant bascule, après bascule, après chaque retour arrière) ; aucune écriture en production ; monotonie des révisions démontrée ; fenêtre de gel mesurée ; restauration testée ; l'application de répétition fonctionne de bout en bout après chaque étape.
- **Limites documentées d'avance** : corpus de répétition plus petit que la production (fenêtre extrapolée) ; la transformation relationnelle complète n'est pas dans la répétition (si option A) ; le scénario B simule « plusieurs jours » par un volume d'opérations, pas par le calendrier.

## 5. Analyse de non-régression explicite

| Fonctionnalité existante          | Risque                                                                                          | Tests                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Production                        | Les outils de migration pourraient pointer la production                                        | **Garde dans les outils** (refus hors émulateur/SQLite local) + aucune variable de production dans les scripts ; test de la garde |
| Application serveur               | Les outils sont hors de l'application (`scripts/migration/`) — aucune modification de `server/` | Suites existantes au vert sans modification d'attente                                                                             |
| Suites de contrat/contention/perf | Les outils ne touchent pas la couche storage                                                    | `npm run check` vert, baseline 1.4 inchangée                                                                                      |
| Tests émulateur (réserve)         | Leur activation peut révéler des écarts d'adaptateur                                            | **Exécutés dans ce lot** — tout écart est corrigé dans l'adaptateur (périmètre du lot), sans changement du contrat                |

Aucune fonctionnalité existante n'est supprimée ou dégradée ; le lot ajoute des outils et une procédure.

## 6. Livrables & critères d'acceptation

1. Outils `scripts/migration/` (export Firestore, import SQL, import Firestore, comparateur) avec **garde anti-production**, testés.
2. **Comparaison exhaustive zéro écart** démontrée : sauvegarde ↔ SQL après import, SQL ↔ Firestore après retour arrière A **et** B.
3. **Retour arrière A et B démontrés** (usage réel via endpoints, tombstones, comptes, droits, client synchronisé, appareil hors ligne avec sections frigo en attente) — aucune donnée perdue ou écrasée.
4. **Monotonie des révisions** après retour B démontrée par test.
5. **Fenêtre de gel mesurée** et enregistrée (avec la limite d'extrapolation documentée).
6. **Restauration testée** (retour à la sauvegarde initiale).
7. **22 tests émulateur au vert** (réserve activée).
8. **Runbook** de la procédure + **spécification relationnelle par domaine** (option A).
9. `npm run check` vert ; **la bascule en production n'est PAS faite** — elle reste une décision explicite distincte (🚩 du plan).

## 7. Décisions et arbitrages soumis au chef

1. **🚩 Portée de la transformation relationnelle (C2)** — **option A recommandée** : mécanique complète sur le harnais + transformation relationnelle démontrée sur Identity + spécification par domaine livrée ; l'implémentation relationnelle complète reste attachée à la préparation de la bascule (arbitrage n° 5 du lot 1.2). L'option B (transformation complète incluse) élargit fortement le lot et sera à refaire après l'évolution des modèles (5b/6a).
2. **Corpus de la répétition** : données de test réalistes créées sur l'émulateur (catalogue réduit + comptes + frigos), jamais un export de production — la production n'est jamais lue. À confirmer.
3. **Format de l'export** : JSON canonique par collection (document d'échange, règle permanente) — hors de l'application, jamais une source de données applicative. À confirmer.
4. **Simulation du scénario B** : « plusieurs jours » simulés par un volume d'opérations représentatif (publications, comptes, révisions avancées, tombstones) — à confirmer.

## 8. Ce que le lot 1.5 ne fait pas (rappels validés, non discutés)

- **Aucune bascule en production**, aucune écriture ni lecture en production (la bascule reste l'opération globale soumise à décision explicite, jamais automatique).
- **Aucune évolution de modèle** (5b/6a) — les modèles logiques actuels sont transportés tels quels.
- **Aucun changement du contrat `DataStore`, des endpoints ou de l'interface** — les outils vivent dans `scripts/migration/`, hors de l'application.
- **Aucun choix du moteur SQL définitif** (décision reportée, 1.4).
- Aucune mise à jour de la documentation générale (`docs/encyclopedie/`, `CLAUDE.md`) — uniquement les livrables techniques du lot.

## 9. Méthode et preuves

- Lectures intégrales : `server/storage/firestoreStore.ts` (compteur `_sync_meta` :35–36, tombstones visibles par `get`), `server/storage/sqlStore.ts` (`get` :225–228 — tombstones masquées ; séquence repart à `max+1`, mécanisme vérifié en 1.4), `server/storage/memoryDataStore.ts`, `server/routes/dataRoutes.ts` (`/replace` :209–233 — ré-estampille), `src/infrastructure/http/sharedCollectionHttp.ts` (écritures HTTP directes, pas de file hors ligne), `src/application/kitchen/KitchenSync.ts` (sections en attente locales, push à la reconnexion :23,78), `src/infrastructure/indexeddb/` (cache client, curseurs).
- Recherche : aucun outil de migration existant (`scripts/` : diagnostics 1.4, benchmark 1.4, build scripts) ; les 22 tests émulateur (`firestoreStore.test.ts:57`).
- Décisions antérieures appliquées : 1.1 § 8 (monotonie `max(horloge, maxImporté+1)`, restauration obligatoire, deux scénarios de retour), arbitrage n° 5 du lot 1.2 (transformation relationnelle à la bascule), clôtures 1.2–1.4.
