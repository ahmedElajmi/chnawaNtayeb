# 09 · Qualité et tests

## Commandes

| Commande                    | Rôle                                                    |
| --------------------------- | ------------------------------------------------------- |
| `npm run check`             | **Avant chaque commit** : types, lint, formatage, tests |
| `npm run typecheck`         | TypeScript (`tsc --noEmit`)                             |
| `npm run lint`              | oxlint (`.oxlintrc.json`)                               |
| `npm run format`            | Prettier, réécrit les fichiers (`.prettierrc.json`)     |
| `npm run format:check`      | Prettier, vérifie seulement                             |
| `npm test`                  | Vitest                                                  |
| `npm run diagnose:matching` | Rapport du moteur sur des frigos types                  |
| `npm run build`             | Build de production (Vite)                              |

## Tests (Vitest)

Les tests sont à côté du code (`*.test.ts`). La configuration Vitest vit dans le bloc
`test` de `vite.config.ts` : les worktrees Git créés sous `.claude/` (par des sessions d'agent)
sont exclus de la découverte (`exclude`) et l'isolation par worker est désactivée
(`isolate: false`, la suite ne teste que de la logique pure, ~6 s gagnées). Un worktree périmé
ne peut donc plus faire échouer `npm test`.

| Type                     | Exemples                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Règles métier            | `core/matching/engine.test.ts`, `core/planning/planner.test.ts`, `core/grocery/groceryList.test.ts`, `core/grocery/lists.test.ts` |
| Scénarios du chef        | `core/matching/scenarios.test.ts`, `scenarioSchema.test.ts` (données en base, rejouées en /admin)                                 |
| Réglages du moteur       | `core/matching/config.test.ts` (validation, mises en avant datées, effets)                                                        |
| Catalogue intégré        | `core/catalog/seed/catalog.test.ts` (cohérence des recettes et ingrédients)                                                       |
| Stores                   | `application/matching/MatchingSettingsStore.test.ts`, `MatchingScenariosStore.test.ts`                                            |
| Interface (logique pure) | `features/recipes/recipeFilters.test.ts`, `features/backoffice/recipes/recipeDraft.test.ts`                                       |
| Serveur                  | `server/vision/scanValidation.test.ts`                                                                                            |
| Architecture             | `core/architecture.test.ts` (règles d'imports entre couches)                                                                      |
| Contrats d'adapters      | `infrastructure/contracts/*.contract.ts`, joués par chaque adapter (ex. `memory/`)                                                |

Principes :

- Le domaine est pur : on le teste sans navigateur ni base.
- Les stores se testent avec de faux adapters qui implémentent les ports.
- Horloge, aléatoire et ids sont injectés pour des tests déterministes.
- Une suggestion jugée fausse dans l'application devient d'abord un scénario du chef (backoffice).

### Deux projets Vitest : `emulator` et `unit` (lot T1)

Les suites qui utilisent l'émulateur Firestore partagent **la même base** et effacent des
collections entre leurs tests ; exécutées en parallèle, elles s'interfèrent (compteurs de
révisions effacés, fausses corruptions `sync_counter_corrupt`, pertes de mise à jour). La
configuration Vitest les sépare donc en deux projets :

- **`emulator`** : les deux fichiers qui touchent `FIRESTORE_EMULATOR_HOST`
  (`server/storage/firestoreStore.test.ts`, `server/routes/kitchenStockConvergence.test.ts`),
  exécutés **séquentiellement** (`fileParallelism: false`) — une seule suite émulateur à la fois ;
- **`unit`** : tous les autres tests, avec le parallélisme conservé.

**Convention obligatoire** : tout nouveau fichier de test qui initialise un client Firestore
(`FIRESTORE_EMULATOR_HOST`) est ajouté **au `include` du projet `emulator` ET à l'`exclude` du
projet `unit` — les deux à la fois**. Un fichier qui touche l'émulateur n'a qu'une maison : la
lane `emulator`. Un oubli reste visible : le garde de révisions annonce bruyamment toute
interférence (`sync_counter_corrupt`) au lieu de l'absorber.

### Campagnes avec l'émulateur Firestore

L'émulateur écoute sur `127.0.0.1:8080` ; les tests chargent un certificat factice via le
préchargeur `scripts/diagnostics/tmp-admin-cert-preload.cjs` (Node refuse une PEM de test sans
lui) :

```bash
# Campagne complète (les deux projets tournent ensemble, suites émulateur sérialisées)
NODE_OPTIONS="--require ./scripts/diagnostics/tmp-admin-cert-preload.cjs" \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-chnawa-f1 npm test

# Campagne séquentielle de référence (tous les fichiers à la suite)
... npm test -- --testTimeout=30000 --no-file-parallelism

# Sans émulateur : les suites Firestore sont ignorées (describe.skipIf)
npm test
```

## Lint

**oxlint** plutôt qu'ESLint : `typescript-eslint` ne prend pas encore en charge TypeScript 7,
utilisé par le projet. Extensions actives : TypeScript, React, React Hooks, imports, unicorn.

Règles désactivées volontairement (`.oxlintrc.json`) :

- `unicorn/no-array-sort`, `no-array-reverse` : les tableaux sont copiés avant tri ; `toSorted` demande ES2023 ;
- `react/exhaustive-effect-dependencies` : doublon de `react-hooks/exhaustive-deps` qui signale les déclencheurs voulus ;
- `unicorn/require-post-message-target-origin`, `prefer-add-event-listener` : faux positifs (service worker, `FileReader`) ;
- `consistent-function-scoping`, `no-underscore-dangle`, `no-unassigned-import`, `no-named-as-default` : style.

Une exception ponctuelle se fait sur la ligne concernée, avec la raison :
`// oxlint-disable-next-line <règle> -- raison`.

## Formatage

Prettier : apostrophes simples, lignes de 120 caractères. Ignorés : `dist`, `public`, `brand`,
`package-lock.json` (`.prettierignore`).

## Conventions

- **Code et commentaires** en anglais ; **textes affichés** en derja / français / arabe ;
  **documentation** en français.
- **Messages de commit** en anglais, courts, qui décrivent le changement.
- Un composant React = un fichier ; un onglet ou un écran = un dossier.
- Pas de `any` dans le nouveau code ; préférer des types précis et des unions.
- Accessibilité : boutons d'icône avec `aria-label`, `aria-pressed` sur les filtres, rôles `dialog`, `tab`.

## Règles de réalisation et critères d'acceptation transversaux (extraits du plan de réalisation 17 — Étape B)

> **Provenance** : `17-plan-de-realisation.md` § 21 et § 22 — règles **engageantes** extraites ici
> avec leur section d'origine ; la source a été supprimée au nettoyage autorisé (le reste du document = roadmap, qui
> reste de l'orientation — voir `docs/index.md` § 1). Version consolidée de l'extraction en
> Étape B.

**Règles de réalisation (17 § 21, rappel engageant)** :

1. Aucun développement sur la seule base du plan directeur : avancement **lot par lot** —
   présentation → validation → réalisation → rapport → validation avant le lot suivant.
2. Chaque lot : périmètre exact, critères d'acceptation, **non-régression systématique**.
3. Qualité, sécurité, performance, maintenabilité et **budget zéro** exigés sur tous les lots ;
   nettoyage et refactorisation intégrés (V12 § 31).
4. Les fonctionnalités reportées (V12 § 29) et les phases commerciales 11–13 ne sont **jamais**
   développées par anticipation — seules leurs frontières sont posées.
5. Toute modification importante de modèles, de données ou de mécanismes de migration passe par une
   **présentation préalable** et une validation explicite.
6. Exigences confirmées par le chef, transversales à tous les lots : application moderne, simple,
   attractive, intuitive et performante ; **quantité jamais obligatoire** ; moteur intelligent,
   précis, rapide, explicable, facilement configurable (cœur différenciateur) ; laboratoire pour
   tester et simuler les règles avant publication ; **parité fonctionnelle mobile/desktop du
   back-office** ; maquettes validées avant l'implémentation des grands ensembles graphiques ;
   fonctionnalités existantes préservées sauf décision justifiée et validée.
7. **La simplicité ne se négocie pas** : la complexité technique ne doit jamais se traduire en
   complexité pour le client ou l'employé (ajout rapide au frigo, jamais de quantité obligatoire,
   reconnaissance photo sans correction d'une multitude d'informations, suggestions compréhensibles
   sans maîtriser le moteur ; côté employé : moteur configurable **sans compétences techniques**).
8. **Le moteur reste indépendant de l'interface** — le cœur ne dépend ni de React, ni de la base,
   ni du back-office : le back-office **configure, simule et publie**, le moteur **applique les
   règles** ; séparation **vérifiable par les tests** (test d'architecture existant, maintenu).
9. **Les quantités ne compliquent jamais l'expérience client** : ingrédient saisissable sans
   quantité ; la reconnaissance photo n'invente **jamais** une quantité ; une quantité inconnue
   n'est jamais assimilée à illimitée ; le moteur distingue le certain du « à vérifier » ; les
   épices et permanents restent des présences habituelles, pas des stocks illimités. **Testé dans
   les scénarios du moteur et du laboratoire**.
10. **Le laboratoire doit permettre de comprendre les résultats** — pourquoi une recette est
    proposée ou rejetée, ingrédients bloquants, règle influente, effet d'une modification de
    configuration, raison d'un refus de publication (critères fonctionnels 6b.8).
11. **Exigence permanente : performances et exploitabilité** — examiner à chaque proposition le
    temps de réponse (p95/p99), CPU/mémoire, poids des bundles et des pages, nombre de requêtes et
    d'accès à la base, efficacité du cache et risques d'invalidation, comportement avec volumes et
    utilisateurs croissants, coûts d'infrastructure et complexité d'exploitation ; signaler
    **avant validation** tout choix rendant l'application lourde, lente, coûteuse ou difficile à
    exploiter, avec alternatives et compromis ; **aucune promesse de performance sans mesures**.

**Critères d'acceptation transversaux (17 § 22)** — font partie des critères des lots concernés,
rappelés dans chaque mini-rapport :

| Sujet | Vérification à garantir | Lot(s) concerné(s) |
|-------|-------------------------|--------------------|
| Migration | sauvegarde exploitable, retour arrière et **contrôle d'intégrité avant/après** | 1.5, 6a.1–6a.3, 6b.7b |
| Double exécution du moteur | même entrée et contexte → résultats comparables ; **divergences identifiées et explicables** | 6b.6 |
| Configuration du moteur | validation des paramètres, défauts, limites, **détection des configurations incohérentes** | 4.3, 5c.4, 6b.8 |
| Publication | **aucune configuration non validée publiée accidentellement** | 4.3, 6b.8 |
| Restauration | crée une **nouvelle version traçable**, sans effacer l'historique | 4.3, 6b.8 |
| Permissions | **contrôle côté serveur**, pas uniquement masquage des boutons | 3.2, 3.3, 6b.8 |
| Mode hors ligne | préservation des modifications locales, tombstones, sync et **résolution des conflits** | 6b.7a, 6b.7b |
| Performance | mesures **reproductibles** sur corpus représentatif, p95/p99, **comparaison avec la référence** | 1.4, 5a.3, 6b.6 |
| Sécurité | vérification des accès API, rôles, données et **opérations sensibles** | 3.x, chaque lot serveur |
| Mobile | **parité fonctionnelle réelle** du back-office, pas seulement responsive | chaque lot d'interface |
| Budget | **aucun service payant indispensable** au fonctionnement normal | tous (V12 budget zéro) |
| Chaîne de publication | publication par **génération** cohérente : garde optimiste à l'activation (initialisation explicite incluse), reprise après interruption, dépendances vérifiées, **une activation par publication logique (jamais de découpage automatique)**, **slugs résolus par l'index de la génération active**, **références des versions historiques couvertes avant tout retrait de composant**, autorisation vérifiée **dans la transaction de mutation** avec protocole de verrouillage commun, **redirections 301 pointant l'identité de page et résolues par la génération active** | 4.3, 4.6, 7.3, 7.4 |
| Groupes & rôles | domaines verrouillés **en base** (FK composites + CHECK), dernier super admin, invalidation ciblée des permissions, **contrôle transactionnel avant toute mutation autorisée** | 3.1–3.5, 4.3 |

## Branches et versions

| Branche                     | Rôle                                                       | Part de   | Fusionnée dans                |
| --------------------------- | ---------------------------------------------------------- | --------- | ----------------------------- |
| `master`                    | Production. Protégée, aucun commit direct.                 | —         | —                             |
| `develop`                   | Intégration des développements validés. Branche par défaut | `master`  | `master` (release)            |
| `feature/<nom>`             | Nouvelle fonctionnalité                                    | `develop` | `develop` (PR)                |
| `fix/<nom>`                 | Correction                                                 | `develop` | `develop` (PR)                |
| `docs/<nom>`, `chore/<nom>` | Documentation, outillage                                   | `develop` | `develop` (PR)                |
| `hotfix/<nom>`              | Correction urgente en production                           | `master`  | `master` (PR), puis `develop` |

Nouvelle demande :

```bash
git checkout develop && git pull
git checkout -b feature/nom-court
# ... développement ...
npm run check
git push -u origin feature/nom-court
gh pr create --base develop
```

La branche est supprimée après la fusion. `master` et `develop` sont protégées sur GitHub : tout passe par une PR.

**Release** : quand une version est validée, PR `develop` → `master`, puis tag annoté sur `master` :

```bash
git checkout master && git pull
git tag -a v2.1.0 -m "Release 2.1.0"
git push origin v2.1.0
```

Numérotation semver : majeur = changement incompatible, mineur = nouvelles fonctionnalités, patch = corrections.
Un hotfix produit une version patch et est ensuite reporté dans `develop` (fusion de `master` dans `develop`).
La branche de production s'appelait `main` jusqu'au 12/11/2026 (renommée `master`).

## Annexe — V12 § 30 — Méthodologie de réalisation et de validation

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 919-940), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE VII — Méthodologie, qualité et vérifications

### 30. Méthodologie de réalisation et de validation

**Avant toute modification du code** : finaliser le plan directeur consolidé (fait —
ce document) ; vérifier que toutes les fonctionnalités existantes sont prises en compte
(§ 3) ; identifier les décisions architecturales ouvertes (§ 28) ; définir précisément
les objectifs, le périmètre et les critères d'acceptation de chaque phase ; identifier
les dépendances entre phases ; définir tests, stratégies de migration et de retour
arrière.

**Boucle de chaque phase** : audit de l'existant concerné → composants à
**conserver / modifier / remplacer / supprimer** → architecture cible → stratégie
d'implémentation → développement progressif → **nettoyage et refactorisation des
composants concernés (§ 31)** → tests des fonctionnalités existantes et nouvelles →
performance et sécurité → **tests du back-office sur mobile et desktop** →
documentation des résultats et des réserves → validation avant la phase suivante quand
prévu.

**Aucune modification du code sur la seule base de ce document** : les phases et leurs
spécifications sont validées avant leur exécution.


## Annexe — V12 § 31 — Qualité du code : exigence permanente

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 941-973), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 31. Qualité du code : exigence permanente

Règle transversale pour **toutes** les phases — pas une phase ponctuelle de nettoyage.
Objectif : un code de niveau professionnel, structuré au niveau attendu d'un
architecte logiciel expérimenté.

**Attendu** : supprimer le code mort, les fonctions inutilisées, les mécanismes
abandonnés et les dépendances devenues inutiles ; éliminer les duplications ;
factoriser les traitements communs **au bon niveau, sans abstraction artificielle** ;
respecter strictement les responsabilités de chaque module et couche ; éviter les
composants volumineux et les fonctions surchargées à responsabilités multiples ;
contrats clairs entre domaines ; réutilisation et composition plutôt que duplication ;
séparation des responsabilités, cohésion, faible couplage ; **pas de dépendances
circulaires ni d'accès directs au stockage** ; noms explicites, types cohérents,
constantes centralisées quand pertinent ; erreurs, validations et cas limites traités ;
standards de sécurité ; **tests pertinents pour sécuriser chaque refactorisation** ;
commentaires obsolètes supprimés, décisions architecturales réellement utiles
documentées.

**Deux extrêmes évités** : conserver du mauvais code par peur de toucher à l'existant ;
refactoriser massivement sans justification au risque de casser du fonctionnel. Chaque
nettoyage est **justifié, testé et progressif**.

**Prudence avant toute suppression** : distinguer le code réellement inutilisé du code
utilisé **indirectement, dynamiquement ou par configuration** (registres, URLs,
sérialisation, instantanés) — vérifié par recherche d'usage puis par les tests, avant
de retirer quoi que ce soit.

**Pragmatisme** : chaque abstraction, chaque module, chaque mécanisme doit avoir une
**justification concrète** — une architecture experte mais pragmatique, performante et
adaptée aux moyens réels du projet. La sur-ingénierie est traitée comme un risque à
part entière (§ 27) et vérifiée en revue de chaque phase.


## Annexe — V12 § 32 — Contrôle de la consolidation (checklist de la revue)

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 974-1037), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 32. Contrôle de la consolidation (checklist de la revue)

| Exigence de la revue                                        | Réponse dans ce document                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Le moteur répond aux problèmes identifiés dans l'existant   | Table limite → réponse, § 9                                       |
| Substitutions contextuelles et exceptions correctes         | § 7.5 et § 10 (priorité, prudence, exemple de référence)          |
| Règles métier configurables quand les capacités existent    | § 13 (deux niveaux d'évolution, liste configurable)               |
| Simulations valident les règles avant publication           | § 14 (laboratoire, portes de publication)                         |
| Asynchrone seulement quand utile, seuil mesuré              | § 14 et § 15 (protocole, jamais arbitraire)                       |
| Parité fonctionnelle mobile/desktop du back-office          | § 5 (nouveauté v8 — présentation adaptée, capacités équivalentes) |
| Évolutions anticipées sans implémentation prématurée        | § 21 (couture entitlement), § 24 (frontières commerce)            |
| Nettoyage et factorisation intégrés à toutes les phases     | § 30–31 (boucle de phase, exigence permanente)                    |
| Performance, sécurité, fiabilité, maintenabilité = critères | § 25 (critères consolidés de chaque phase)                        |

**Contradiction résolue dans cette version** : la v7 limitait la comparaison de
configurations du laboratoire au desktop ; la **parité fonctionnelle mobile/desktop**
est maintenant la règle — la comparaison reste une vue conçue pour l'écran large,
**accessible et utilisable sur mobile** avec une présentation adaptée. Implication :
itération de conception mobile du laboratoire ajoutée à la phase 2 (consignée dans ses
critères de passage).

**Corrections intégrées dans la v9** (revue de la v8) : réservation quantitative +
`expiry_type` dans le frigo (§ 8) ; héritage explicite des règles génériques (§ 7.5) ;
`substitutes` subordonné aux règles centrales (§ 7.3) ; pertinence avant vitesse —
pas d'arrêt anticipé prématuré, comparaison à l'exécution de référence (§ 15) ;
fiabilité des tâches asynchrones persistantes (§ 14) ; invariant du dernier super
administrateur sous verrouillage + test de concurrence (§ 5) ; portions réduites
arbitrées et intégrées (§ 12) ; environnement de mesure précisé, conflits de règles de
même priorité définis, fusion avec prévisualisation + confirmation, modalités
d'analytics précisées, parité vérifiée aussi pour les opérations complexes (§ 5, § 10,
§ 7.4, § 22).

**Corrections intégrées dans la v10** (revue de la V9) : **quantité jamais
obligatoire** — deux modes simple/avancé, la présence seule suffit et ne bloque jamais
une recette pour insuffisance (§ 8, § 12) ; qualificatif « sous réserve de vérifier la
quantité de X » (§ 12) ; **ingrédients de base du placard** en stock permanent déclaré
une fois, réservé aux bases et épices (§ 8) ; réservation facultative, quantitative ou
entrée entière sans quantité inventée (§ 8) ; **origine obligatoire** des entrées
(manuel, photo, import), la présence détectée par photo vaut disponibilité (§ 8, § 17) ;
états du stock distingués du niveau de ligne (§ 12) ; corpus étendu aux frigos sans
quantités et au stock permanent (§ 16).

**Clarifications intégrées dans la v11** (revue de la V10) : **présence seule et
stock partagé** — plusieurs lignes du même ingrédient sans quantité connue portent une
incertitude **conjointe** explicite, jamais une faisabilité vérifiée (§ 12, § 16) ;
**suggestions individuelles** — chaque recette évaluée comme si le stock lui était
dédié, limite expliquée à l'utilisateur, allocation globale réservée à la
planification future (§ 12, § 29) ; **stock permanent** — présence habituelle, jamais
illimitée, état temporairement épuisé + réactivation en un geste sans quantités (§ 8) ;
**détection photo** — l'IA propose, seul l'utilisateur confirme ce qui entre dans le
frigo (§ 8, § 17). Vérifié : aucune contradiction avec les verdicts (§ 12), le corpus
(§ 16), les règles du frigo (§ 8) ni la roadmap (§ 25).

**Clarifications intégrées dans la v12** (revue de la V11) : **cohérence des
réservations** — la contradiction § 8 / § 28 corrigée : deux modes **mutuellement
exclusifs** avec validations anti-états incohérents (§ 8, § 28) ; **permanent +
entrées physiques** — les entrées physiques portent les quantités, le permanent reste
qualitatif, rien n'est réinventé à l'épuisement ou la suppression (§ 8) ; **verdicts
« après achat » / « partiellement réalisable »** — conditions et priorité
déterministes (forme d'abord, puis quantités), exemples, « sous réserve » déclaré
indépendant du verdict principal (§ 12) ; **séquençage de la migration SQL** — phase 1
valide mécanismes et domaines stables, migration définitive des données métier
reportée à 6a après stabilisation des modèles, Firestore reste source de vérité
jusqu'à la bascule (§ 4, § 25).

## Annexe — Plan 17 § 19 — Points de contrôle et validation

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 448-479), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 19. Points de contrôle et validation

| Point           | Quand                        | Contenu de la validation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V0**          | immédiat                     | Validation de **ce plan de réalisation** — **ne déclenche aucun développement automatique** : chaque lot démarre après sa présentation et sa validation                                                                                                                                                                                                                                                                                                                                                                                           |
| **G1**          | fin phase 1                  | Contrats verts sur SQLite (+ tout moteur SQL retenu, testé via le harnais) ; cartographie validée ; **aucune bascule en production en phase 1** (la bascule globale reste une décision explicite future)                                                                                                                                                                                                                                                                                                                                          |
| **G-D1..D3**    | fin des paquets de maquettes | Identité visuelle + parcours client + back-office **validés** (ajustements demandés si besoin)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **G2/G3/G4**    | fins phases 2–4              | Spécifications signées ; RBAC vérifié ; bundle résolu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **G5a**         | fin 5a                       | Métriques de départ livrées (rapport de baseline versionné) ; cas métier fournis par le chef                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **G5b/G5c**     | fins 5b–5c                   | **Décisions ouvertes n°1 et n°2 arbitrées** ; modèles, sync, sémantique des verdicts validés                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **G6a**         | fin 6a                       | Migration réversible, comparée, restauration testée                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **G6b**         | fin 6b                       | Zéro faux positif en strict **sur le corpus validé** (+ faux négatifs, pertinence, non évaluables, p95/p99) ; budgets tenus ; **seuil asynchrone mesuré**. **Deux validations distinctes** : validation **technique** du sync (6b.7a : concurrence + parité) et validation de l'**évolution du modèle frigo** (6b.7b, après accord explicite du chef) — G6b valide l'ensemble moteur + sync, évolution comprise **seulement si 6b.7b a été autorisé et exécuté** ; l'atteinte de la porte **ne déclenche jamais automatiquement** cette évolution |
| **G6c**         | fin 6c                       | Bascule validée par le chef ; ancien moteur retiré proprement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **G7–G10**      | fins 7–10                    | Parité mobile vérifiée ; confidentialité et réconciliation vérifiées                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **G-Gate**      | avant 11                     | Porte de passage commerce (succès 6–10 + décision du chef)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Transversal** | chaque lot                   | `npm run check`, non-régression, parité mobile/desktop, nettoyage effectué (la mise à jour des docs attend la fin de release, à la demande du chef)                                                                                                                                                                                                                                                                                                                                                                                               |

Chaque lot se termine par un **mini-rapport** : livrables, résultats de tests,
réserves, nettoyage effectué — base de la validation de passage au lot suivant.

**Cycle obligatoire de chaque lot** (la validation globale du plan ne vaut jamais
autorisation automatique de développer les lots suivants) :

1. présentation détaillée de l'approche du lot ;
2. périmètre et fichiers/composants concernés ;
3. impacts et risques (dont fonctionnalités existantes impactées et tests de
   non-régression) ;
4. livrables et critères d'acceptation ;
5. **validation explicite avant réalisation** ;
6. rapport de réalisation et résultats des tests ;
7. validation avant le lot suivant.

