# Annexe à l'audit — Évolutivité et préparation au mobile natif

**Objet** : évaluer le socle actuel de Chnawa Ntayeb au regard des deux exigences permanentes
du chef — (1) ne jamais enfermer l'application dans une technologie, (2) permettre plus tard une
application mobile native Android/iOS **réutilisant le cœur fonctionnel** — sans développement et
sans modification du code. **Le choix de la technologie mobile n'est pas pris ici** : il reste
soumis à une étude de faisabilité avant tout travail mobile (arbitrage M4).
**Compléments** : `audit-preparation-implementation.md` (audit + rail 2.6.x) et
`audit-annexe-perimetre-architecture-frontend.md` (périmètre complet + architecture composants).

---

## 1. Ce que le socle actuel facilite déjà (vérifié dans le code)

Le schéma cible du chef — **socle commun → backend commun → base commune → deux clients (web React,
mobile natif)** — est, en fait, **déjà la forme de l'architecture actuelle**. Éléments vérifiés :

| Élément                                                | État vérifié                                                                                                                                                                          | Valeur pour l'évolution / le mobile                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/core` — modèle métier et règles en TypeScript pur | Garde d'architecture `architecture.test.ts` : interdits React, Firebase, motion, lucide, **et** `window/document/localStorage/fetch` dans le cœur ; test maintenu à chaque `npm test` | Réutilisable **verbatim** par React, React Native et le serveur                                             |
| Le serveur consomme déjà le même cœur                  | `server/storage/collections.ts` importe les parseurs de `src/core` (catalog, matching, accounts, units, review, categories) — validation unique des deux côtés                        | Une seule source de vérité des règles ; un client mobile valide avec les mêmes fonctions                    |
| **Aucun SDK Firebase côté client**                     | `package.json` : uniquement `firebase-admin` (serveur) ; le garde teste l'absence côté cœur ; l'infrastructure client ne connaît que HTTP                                             | Le mobile n'a **rien à désinstaller** : il consomme la même API                                             |
| **Authentification par jetons signés (déjà Bearer)**   | `userSession.ts` : le serveur signe une session, l'appareil stocke le jeton et envoie `Authorization: Bearer …` — pas de cookies, pas d'OAuth SDK                                     | Pratiquement prêt pour un stockage sécurisé natif (keychain/keystore) : même en-tête, même serveur          |
| Synchronisation indépendante du fournisseur            | `KitchenSync` (pull/push par sections, ledger, dernier-écrit-gagnant) + `ElementSet` HLC + tombstones dans `src/core` ; protocole HTTP paginé par curseur                             | Le mobile rejoue exactement le même protocole ; la sémantique de conflit est déjà multi-appareils           |
| Collections partagées hors ligne par ports             | `SyncedCollectionStore` + port `LocalCollectionCache` (IndexedDB **adaptateur** web)                                                                                                  | Le mobile fournit son adaptateur (SQLite/AsyncStorage), aucune logique à réécrire                           |
| Moteur de matching pur et testé                        | `src/core/matching` sans React ni stockage ; config versionnée, scénarios                                                                                                             | Le besoin n°1 du chef : **le moteur ne sera jamais réimplémenté**                                           |
| Persistance personnelle derrière ports                 | `KitchenRepository`, `PreferencesRepository`, drafts → adaptateurs locaux injectés                                                                                                    | Adapter = écrire les ports natifs, pas réécrire le domaine                                                  |
| IA jamais côté client                                  | Vision = port serveur (`/api/vision/*`, Gemini côté serveur)                                                                                                                          | Le mobile appelle la même route ; aucune clé SDK embarquée                                                  |
| Recherche portable                                     | `SearchEngine` port ; MiniSearch = adaptateur JS sans DOM                                                                                                                             | Le mobile peut embarquer MiniSearch ou passer à un moteur serveur via le même port                          |
| Thèmes = données                                       | Modèle `AppTheme` (tokens) dans `src/core` ; rendu CSS = couche web                                                                                                                   | Le modèle est portable, le rendu reste propre à chaque plateforme                                           |
| Contrats côté serveur durcis                           | Phase 1 clôturée : `DataStore` Firestore/SQL/mémoire, bascule par variable, migration relationnelle préparée                                                                          | Changement de base ou d'hébergeur sans toucher aux clients ; le mobile hérite de la portabilité des données |
| 4 langues + RTL + formats                              | `LANGUAGES` + `LocalizedText` dans `src/core`                                                                                                                                         | Identiques sur mobile                                                                                       |

**Conclusion partielle** : la règle historique « le client n'importe jamais le SDK du fournisseur ;
tout passe par notre API » — déjà appliquée et gardée par des tests — est précisément ce qui rend
le socle mobile-ready aujourd'hui. Aucune refonte n'est nécessaire pour conserver cette capacité.

## 2. Dépendances ou choix actuels qui pourraient limiter à moyen/long terme

| #      | Constat (vérifié)                                                                                                                      | Limite                                                                                                                                                          | Gravité                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **L1** | `KitchenSync` (couche `src/application`) utilise directement `window`/`document` (`visibilitychange`, `pagehide`, `window.setTimeout`) | Couplage plateforme dans une couche censée être neutre ; le mobile a un cycle de vie différent (arrière-plan, foreground)                                       | Moyenne — petite refactorisation       |
| **L2** | Les **~19 adaptateurs HTTP** codent en dur leurs chemins `/api/...` et dupliquent des types d'échange avec le serveur                  | Pas de contrat centralisé : une évolution d'API doit être retrouvée à la main des deux côtés (et un jour trois : web, mobile, serveur)                          | Moyenne — contrats non centralisés     |
| **L3** | La garde d'architecture couvre `src/core` **mais pas `src/application`**                                                               | Des couplages plateforme peuvent s'y glisser silencieusement (L1 en est la preuve)                                                                              | Moyenne                                |
| **L4** | La couche web contient des comportements spécifiques au navigateur (service worker, `pagehide`, bannière install, bandeau hors ligne)  | Normal et souhaitable — mais ils doivent rester dans la couche web, jamais remonter                                                                             | Faible — règle à écrire                |
| **L5** | L'état des filtres de recettes vit uniquement dans l'URL (`recipeFilters.ts`)                                                          | L'URL est une projection web ; le mobile n'a pas d'URL — l'état doit vivre dans un store, l'URL n'en devient qu'un miroir                                       | Faible — à traiter au lot 2.6.4        |
| **L6** | Back-office : `react-router` utilisé aussi dans des composants réutilisables                                                           | Un composant réutilisable ne doit pas connaître la navigation : il reçoit des cibles/gestionnaires en props (le motif D4 le fait déjà via `href`)               | Faible — règle à écrire                |
| **L7** | Notifications prévues « locales » (A17) sans port pour le push futur                                                                   | Le push natif (FCM/APNs) exigera un port ; si l'affichage consomme directement des timers locaux, l'ajout sera plus coûteux                                     | Faible — façonner le port maintenant   |
| **L8** | Endpoints non versionnés (`/api/...`) avec compatibilité ascendante de fait (négociation par la réponse en 1.2)                        | Un client mobile publié sur les stores vit plus longtemps qu'une page web : une rupture d'API casse des installs non re-mises à jour                            | Moyenne — politique de version à fixer |
| **L9** | Monolithe mono-app (src + server) ; pas de paquets séparés                                                                             | Extraire `core/application/contracts` en paquets d'espace de travail sera nécessaire **au moment du mobile** ; reportable à coût ≈ 0 **si** L1/L3 sont corrigés | Faible — report assumé                 |

**Verrous propriétaires écartés** : aucune dépendance à un service payant dans le socle
(Gemini est un port facultatif côté serveur ; MiniSearch, Argon2, Knex, better-sqlite3 sont des
bibliothèques standard ; l'hébergement reste un Node.js unique). Le seul point d'attention
récurrent reste l'**hébergeur** (un seul serveur Node) : c'est un choix assumé, remplaçable
containerisation ou serveur managé — aucun couplage SDK.

## 3. Adaptations architecturales nécessaires (petites, à faire tôt)

| #      | Adaptation                                                                                                                                                                                                            | Coût estimé                          | Où l'intégrer                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| **T1** | Injecter le cycle de vie de la page dans `KitchenSync` (port `AppLifecycle` : visibility/pause + planificateur de timers), retirer `window`/`document` de `src/application`                                           | ~½ jour                              | **Lot 2.6.0** (ci-dessous)         |
| **T2** | Étendre la garde d'architecture à `src/application` : ni SDK, ni `window/document/localStorage/fetch` non injectés (exceptions listées explicitement le cas échéant)                                                  | Trivial (le test existe, il s'étend) | **Lot 2.6.0**                      |
| **T3** | Centraliser les **contrats API** : un module unique (chemins des endpoints + types d'échange) importé par les adaptateurs HTTP client **et** référencé côté serveur pour vérification ; base de tests de contrat HTTP | 1–2 jours                            | **Lot 2.6.0** (ou lot dédié court) |
| **T4** | Écrire la **règle permanente** « l'application n'importe jamais un SDK fournisseur ; toute donnée passe par notre API versionnée » (CLAUDE.md + test)                                                                 | Rédaction                            | Avec T2                            |
| **T5** | État des filtres dans un store applicatif ; l'URL devient une projection web (2.6.4)                                                                                                                                  | Intégré au lot                       | 2.6.4                              |
| **T6** | Règle composants : jamais de `react-router` dans un composant réutilisable (hrefs/handlers en props) — motif D4 déjà conforme                                                                                         | Règle + revue                        | 2.6.1/2.6.2                        |
| **T7** | Notifications : définir le **port** (source locale maintenant, push natif possible plus tard) et faire consommer ce port par l'affichage                                                                              | Façonnage léger                      | 2.6.8 (avec A17)                   |
| **T8** | Politique de **versionnement d'API** : compatibilité ascendante documentée par endpoint ; préfixe de version uniquement à la première rupture ; le lot « mobile » figera le contrat v1                                | Décision + doc                       | Arbitrage M6                       |
| **T9** | Extration en paquets d'espace de travail (`packages/core`, `packages/application`, `packages/api-contracts`)                                                                                                          | Reporté                              | Porte mobile (M5)                  |

**Ce qu'il ne faut PAS faire maintenant** : construire des composants multi-plateformes
(React Native Web partout), abstraire le style, préparer des stubs natifs, ou extraire les
paquets dès aujourd'hui. La réutilisation pertinente est celle du **socle** (cœur + protocole +
API), pas celle de l'interface — conformément à la distinction du chef.

## 4. Architecture cible proposée

```
                    SOCLE COMMUN (TypeScript pur — déjà existant)
        ┌──────────────────────────────────────────────────────────┐
        │  src/core : modèle métier, règles, moteur de matching,    │
        │             ElementSets + HLC, unités, i18n, validation   │
        │  src/application : ports + stores (SyncedCollectionStore, │
        │             KitchenStore, KitchenSync, CatalogSearch…)    │
        │  contrats API : chemins + types d'échange (T3)            │
        └───────────────────────────┬──────────────────────────────┘
                                    │
                    BACKEND COMMUN (Express + DataStore — déjà existant)
        ┌───────────────────────────┴──────────────────────────────┐
        │  server/ : API (/api/*, /admin/api/*), sessions Bearer,   │
        │  DataStore Firestore|SQL|memory, vision serveur, SEO      │
        └───────────────────────────┬──────────────────────────────┘
                                    │
                        Base de données commune (provider au choix)
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
      APPLICATION WEB (React)                  APPLICATION MOBILE (hypothèse RN/Expo)
      PWA actuelle + rail 2.6.x                Même src/core + src/application,
      adaptateurs : IndexedDB, SW,             autres adaptateurs : stockage sécurisé,
      URL = projection des états               SQLite/AsyncStorage, push, caméra native,
      (composants et pages web)                navigation native, cycle de vie natif
```

- **Le mobile réutilise** : modèle métier, règles, moteur + configurations, services applicatifs
  (stores), contrats API, authentification Bearer, synchronisation (pull/push + HLC), validation,
  recherche (adaptateur), i18n.
- **Le mobile réécrit** : l'interface (navigation, gestes, composants natifs), les adaptateurs de
  persistance, le cycle de vie, les capacités natives (stockage sécurisé, push, caméra,
  synchronisation en arrière-plan) — **derrière les mêmes ports**.
- **Le web garde** : PWA, service worker, URL/SEO, install, thèmes CSS.

## 5. Conséquences sur l'existant

| Domaine                        | Conséquence                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend (rail 2.6.x)**      | Aucune remise en cause ; deux règles ajoutées (T5, T6) et le socle partagé (2.6.0). Les composants réutilisables restent du web ; seuls le cœur et les stores sont « partagés »                                                               |
| **DataStore**                  | Aucun changement de séquence : Firestore actif, bascule SQL reste derrière 1.5/6a (décision explicite). Le mobile **augmente la valeur** de la portabilité déjà construite — sans la modifier                                                 |
| **Firestore / SQL**            | Inchangés ; le registre de collections reste la source de la conversion relationnelle. Le client mobile n'y accède jamais directement (règle T4)                                                                                              |
| **API**                        | Centralisation des contrats (T3) + politique de version (T8) ; compatibilité ascendante maintenue par négociation (déjà démontré en 1.2 pour le curseur)                                                                                      |
| **Synchronisation hors ligne** | Protocole déjà indépendant du navigateur ; le web garde le SW (cache shell), le mobile aura son stockage + background sync via port natif — la sémantique (HLC, tombstones, dernier-écrit-gagnant, réservations) est identique et déjà testée |
| **Authentification**           | Mécanisme déjà conforme (jetons signés Bearer) ; le mobile remplacera localStorage par un stockage sécurisé — aucun changement serveur nécessaire                                                                                             |
| **Sécurité**                   | Les limites de débit et la vérification serveur systématique profitent aux deux clients ; revoir CORS/attaches uniquement à l'ouverture du mobile                                                                                             |

## 6. Surcoûts et compromis

1. **Lot 2.6.0 (T1+T2+T3)** : ~2–3 jours — le seul surcoût immédiat ; il évite de traîner des
   couplages plateforme dans une couche censée être neutre, et donne un contrat API unique
   (utile dès maintenant pour les tests serveur/client).
2. **Discipline continue** : la garde d'architecture étendue peut refuser des raccourcis
   pratiques (un `window.setTimeout` commode) — c'est voulu ; le coût est faible et la
   justification existe.
3. **Report assumé** (M5, M6) : extraire les paquets et figer le contrat v1 n'apporte rien avant
   qu'un deuxième client existe ; le coût du report est ≈ 0 grâce aux gardes (L1/L3 corrigées).
4. **Ce que le report ne rendra pas plus cher** : le moteur, les règles, la sync, les comptes, les
   contrats HTTP restent réutilisables tels quels — le seul travail mobile sera l'interface et
   les adaptateurs natifs.
5. **Risque à ne pas créer** : ne pas transformer l'application web en couche « abstraite »
   supplémentaire (aucun gain prouvé avant un deuxième client).

## 7. Recommandations intégrées aux lots (sans rouvrir les décisions validées)

| Lot                                        | Intégration                                                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.6.0 — Socle partagé (nouveau, court)** | T1 (cycle de vie injecté dans KitchenSync) · T2 (garde d'architecture étendue à `src/application`) · T3 (contrats API centralisés) · T4 (règle permanente écrite) — précède 2.6.1 |
| 2.6.1 / 2.6.2                              | T6 (composants sans router) ; rappel : règles d'affichage du matching dans `src/core` (A1)                                                                                        |
| 2.6.4                                      | T5 (état des filtres en store, URL = projection)                                                                                                                                  |
| 2.6.8                                      | T7 (port notifications, compatible push futur) ; jeton de session déjà Bearer — note : le mobile utilisera un stockage sécurisé (aucun changement serveur)                        |
| 3.x (comptes)                              | Aucun changement : le mécanisme token est déjà le bon ; la révocation/expiry reste côté serveur                                                                                   |
| 6a / 6b / 6c                               | Inchangés — la portabilité construite en phase 1 est exactement ce que le mobile exploitera                                                                                       |
| Porte mobile (future)                      | Étude de faisabilité (M4) : RN/Expo vs alternatives, monorepo (T9), contrat v1 (T8), capacités natives                                                                            |

## 8. Choix nécessitant votre arbitrage

| #      | Décision                                                                                                                                   | Options et recommandation                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1** | Règle permanente « jamais de SDK fournisseur côté client ; toute donnée via notre API » + garde d'architecture étendue à `src/application` | Recommandé : l'adopter maintenant (elle est déjà de facto vraie)                                                                                                              |
| **M2** | Centraliser les contrats API (T3) dans un module partagé client/serveur                                                                    | Recommandé : petit lot immédiat, valeur réelle dès aujourd'hui                                                                                                                |
| **M3** | Injecter le cycle de vie dans `KitchenSync` (T1) et étendre la garde (T2)                                                                  | Recommandé : dans le lot 2.6.0                                                                                                                                                |
| **M4** | Technologie mobile                                                                                                                         | **Non arrêtée** — React Native/Expo = hypothèse de travail ; décision après étude de faisabilité, au moment où l'application mobile devient un besoin réel (aucun code avant) |
| **M5** | Extraction en paquets (`packages/…`)                                                                                                       | Recommandé : **reportée** à la porte mobile — les gardes T1/T2 la rendent quasi gratuite plus tard                                                                            |
| **M6** | Politique de versionnement des endpoints (`/api/v1` à la première rupture ?)                                                               | Recommandé : documenter la compatibilité ascendante maintenant, préfixer à la première rupture — décision légère à prendre                                                    |
| **M7** | Port notifications compatible push (T7)                                                                                                    | Recommandé : façonner le port en 2.6.8 ; le push natif (FCM/APNs) reste hors périmètre jusqu'à la porte mobile                                                                |
| **M8** | Emplacement du lot « Socle partagé »                                                                                                       | Recommandé : **2.6.0** avant 2.6.1 ; alternative : intégrer T1–T3 dans 2.6.1 (moins de formalisme, même contenu)                                                              |

---

## 9. Synthèse

Le socle actuel est **déjà conforme au schéma cible** : cœur métier pur partagé (et réellement
consommé par le serveur), zéro SDK fournisseur côté client, authentification par jetons Bearer,
synchronisation multi-appareils indépendante du fournisseur, contrats de données durcis et
portables. Les limites identifiées sont petites et locales (`window` dans `KitchenSync`, contrats
API éparpillés, garde limitée au cœur) — trois adaptations courtes (2.6.0) suffisent, et le reste
est un report organisé derrière la porte mobile. Aucune décision validée n'est remise en cause ;
les arbitrages M1–M8 attendent votre choix, et aucun développement n'est lancé.
