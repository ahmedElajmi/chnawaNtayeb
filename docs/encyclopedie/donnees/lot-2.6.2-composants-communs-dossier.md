# Lot 2.6.2 — Composants communs & fondations (dossier d'exécution, v3 finale)

**Statut** : dossier **final** — arbitrages A-1 à A-6 **tous clôturés** (§ 6), faits du code existant
vérifiés (§ 7). Présenté pour revue finale ; **l'autorisation de développement est une décision
séparée**. Aucun développement, aucune modification de code, aucune nouvelle dépendance, aucun commit,
aucun changement de branche à ce stade. Déroulé après autorisation : implémentation + tests → rapport →
validation → (lot suivant).
**Références** : `plan-consolide-pre-implementation.md` (§ 3 « Architecture frontend » — couches 1–4,
garde-fous anti-extrêmes ; § 1.1 sémantique du matching et wording D1 ; annexe « Arbitrages du chef
pour le lot 2.6.2 ») · maquettes D4 `shell.html`, `accueil.html`, `registre.html`, `composants-cms.html`
(inventaire 59, référence des props — **pas des règles métier**) · `lot-2.6.1-identite-shell-dossier.md`

- rapports (shell clôturé, conventions tokens) · `orientation-multilingue-validee.md` · doc 06 interface
  (fenêtres, listes longues, langues) · doc 03 domaine (catalog, matching, prix).
  **Principes hérités (non renégociés)** : la logique métier ne vit jamais dans un composant ; une page
  est un assemblage ; la réutilisation se prouve — un composant n'est extrait que si un second
  consommateur existe ; les 59 composants D4 sont un inventaire, pas un plan de charge ; tokens
  uniquement ; textes i18n 4 langues ; RTL ; cibles ≥ 44 px ; 320 px ; zéro CLS ; aucune nouvelle
  dépendance ; **les maquettes D4 ne sont jamais présumées correspondre au comportement réel du code** ;
  **toutes les fonctionnalités existantes et tous les comportements actuels sont préservés**.

---

## 1. Objectifs du lot (périmètre strict)

1. **Règles d'affichage du matching en `src/core/matching/display.ts`** — **séparation stricte des
   responsabilités** (directive du chef, précisions finales intégrées) :
   - le **moteur existant** (`engine.ts`, `tiers.ts`) reste l'**unique** responsable du calcul du score
     et de la détermination des niveaux (`ready / almost / ideas`) ;
   - la couche d'affichage **consomme le tier déjà calculé par le moteur** et effectue **uniquement un
     mapping exhaustif** vers les **niveaux d'affichage explicites**
     (`'tous-presents' | 'presque' | 'a-decouvrir'`) — le **mapping entre les niveaux du moteur et
     ceux de l'affichage est exhaustif et vérifiable** (table d'équivalence complète, chaque tier
     mappé, testé) ;
   - **`engine.ts` et `tiers.ts` restent les seules sources de vérité** du calcul et de la
     détermination du tier — **aucun seuil n'est recalculé ni réévalué dans `display.ts`**, aucun
     calcul de matching n'est dupliqué, aucune deuxième source de vérité ;
   - **`MatchingConfig.tiers` n'est utilisé dans cette couche que si une véritable donnée de
     présentation le nécessite** — jamais pour reproduire le calcul du moteur ;
   - les **quantités inconnues** restent distinctes des ingrédients manquants (catégories « Présent /
     Manquant / Quantité inconnue » du plan § 1.1) ;
   - l'état futur « **quantité vérifiée suffisante** » (6b.7b) s'intègre **sans refonte** (discriminant
     factuel prévu dans les types, non branché) ;
   - le core retourne des **codes de raisons et des identifiants d'ingrédients** — **aucun texte
     traduit ni dépendance à la langue dans le core** (la traduction et la présentation des messages
     relèvent de l'interface) ;
   - bornes lues dans `MatchingConfig.tiers` (injectées, jamais codées en dur — D2 reste un arbitrage du
     lot 2.6.4).
2. **Couche 1 — UI générique** (`src/shared/ui/`, aucun import du domaine) : composants dont
   l'usage multi-écrans est démontré (table § 2). `Skeleton`, `ShowMore`, `ModalShell`, `OfflineIndicator`,
   `InstallBanner`, `IngredientThumb` **existent** — étendus seulement si un besoin réel apparaît,
   jamais réécrits.
3. **Couche 2 — métier réutilisables** (`src/features/<domaine>/components/`) : importent les **types**
   de `@/core/...`, jamais de logique décisionnaire ; navigation et actions **en props**.
4. **Découplage de navigation vérifié** par la garde d'architecture.
5. **Migration tokens dans les composants touchés** : `RecipeCard` (`bg-slate-100 dark:bg-slate-900`),
   `RecipeBadges` (palettes slate/emerald) passent aux variables — garde « zéro couleur en dur »
   ciblée, limitée aux fichiers du lot.
6. **Adoption progressive** : les composants partagés sont **adoptés par les écrans qui les
   consomment, à leur lot respectif** (2.6.3 accueil, 2.6.4 catalogue/suggestions, 2.6.5 fiche,
   2.6.6 frigo/courses, 2.6.7 planning, 2.6.8 secondaires). **Les écrans existants ne sont pas
   réécrits dans ce lot** ; **aucune variante ni composant sans consommateur réel** ; **toutes les
   fonctionnalités existantes et comportements actuels sont préservés**. Seuls les refactors en place
   listés au § 3 touchent du code existant, sans changement de comportement visible.

**Explicitement hors périmètre** : composition de la Home Page (2.6.3) ; vues catalogue R1/R2/R3 et
filtres F1/F2/F3 + état des filtres en store T5 (2.6.4 — arbitrage `recettes-filtres-alt.html`
🚩 Alt 1/Alt 2 vs D-28 conservé **pour 2.6.4**) ; `ListesManager` (2.6.6) ; `WeekStrip`/`PlanSummary`
(2.6.7) ; `NotifCenter`/`ScanFlow` (2.6.8) ; **`FridgePeek`** (confirmé : non créé en 2.6.2 ; sa
création reste prévue **au lot 2.6.3**, au niveau de la Home Page ; **mutualisation réévaluée dans le
lot 2.6.6 uniquement si un deuxième consommateur réel apparaît**) ; **variantes `compact`/`deck` de
`RecipeCard`** (à leur premier consommateur réel) ; toute nouvelle dépendance ; tout composant à usage
unique. **Traçabilité** : ces fonctionnalités restent listées dans le plan consolidé (annexe arbitrages
2.6.2) — rien n'est retiré de la roadmap.

---

## 2. Couche 1 — UI générique (`src/shared/ui/`), justifiée par la consommation

| Composant              | Rôle (référence D4)                                                                          | Consommateurs identifiés                                                                                                          | Notes                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `PageHeading`          | titre de page + sous-titre optionnel + actions à droite                                      | tous les écrans 2.6.3–2.6.8                                                                                                       | RTL symétrique, variante `compact`                                             |
| `EmptyState`           | état vide (icône, message i18n, action en prop)                                              | accueil états (2.6.3), suggestions (2.6.4), frigo/courses (2.6.6), favoris/historique (2.6.8)                                     | **contrat à action exclusive § 2-2**                                           |
| `SkeletonList`         | liste de squelettes (compose `Skeleton` existant)                                            | accueil (2.6.3), catalogue/suggestions (2.6.4)                                                                                    | nombre + forme en props                                                        |
| `Rail`                 | carrousel horizontal (défilement par quantités, pas par pixel)                               | CategoryRail, FavoritesStrip, Shelf, étals (2.6.3/2.6.4)                                                                          | pas de lib JS ; boutons ≥ 44 px ; RTL vérifié                                  |
| `Chips` + `ChipFilter` | pastilles de filtre rapide (sélection multiple, états)                                       | accueil (2.6.3), catalogue F3 (2.6.4)                                                                                             | boutons réels, `aria-pressed`, ≥ 44 px                                         |
| `Sheet`                | feuille basse mobile / centrée desktop — **sur les mécanismes existants** (§ 2-3)            | choix de liste, flux scan, onboarding (2.6.6/2.6.8) ; refactor possible de `GroceryListChooserModal` sans changer son API         | jamais `fixed inset-0` direct                                                  |
| `LinkTabs`             | navigation par **liens réels** : `LinkComponent` **injectable** (A-6 clôturé, contrat § 2-1) | refactor léger de `RecipeListTabs` (2 consommateurs actuels : `/recettes`, `/suggestions` — vérifié) + favoris/historique (2.6.8) | compteurs et mémoire de filtres restent des props (calculés par les écrans)    |
| `OfflineStrip`         | bandeau hors ligne réutilisable                                                              | écrans 2.6.5/2.6.6/2.6.8                                                                                                          | évolution mineure de `OfflineIndicator` (message en prop), pas une re-création |

Chacun : props typées, propriétés logiques RTL (aucun `left/right` codé), test rendu + interaction
(happy-dom), textes par clés i18n — **aucun texte affiché en dur**.

### 2-1. Contrat `LinkTabs` (A-1 + A-6 clôturés)

- **Indépendance de l'infrastructure de navigation** (décision finale du chef, **précision de
  compatibilité** ) :
  - `LinkTabs` reçoit un **`LinkComponent` injectable en propriété** ;
  - il rend par défaut un **lien HTML natif `<a href>`** ;
  - **le composant générique n'importe aucune dépendance au routeur** — il transmet toujours `href` ;
  - **incompatibilité résolue par un adaptateur fourni par le consommateur** : React Router `Link`
    attend `to` et non `href` — l'injection directe de `Link` ne fonctionnerait donc pas. Le
    consommateur React Router fournit un **adaptateur** qui transforme `href` en `to` (dans le module
    de l'écran ou de l'app, jamais dans le composant générique) ;
  - **la navigation SPA et le comportement actuel de `RecipeListTabs` sont préservés** ;
  - l'architecture décidée reste inchangée : `LinkTabs` indépendant de React Router, `<a href>` natif
    par défaut, adaptateur du côté consommateur.
- **Props** : `items: { href: string; label: string; icon?: ComponentType; count?: number | null;
hint?: string; active: boolean }[]`, `ariaLabel: string`, `linkComponent?: LinkComponent` — tout
  libellé, icône, compteur et indice arrivent en props (le consommateur actuel `RecipeListTabs`
  construit les `href` via `useRecipesHref`, qui **reste** dans son module — la mémoire de filtres
  n'entre pas dans le composant partagé).
- **Rendu** : `<nav aria-label>` + liens réels ; actif = `aria-current="page"` + style validé
  (`bg-brand`/`on-brand` actuel conservé pour `RecipeListTabs` — **aucun changement visible**) ;
  jamais `role="tab"`.

### 2-2. Contrat `EmptyState` (demande du chef)

Action **exclusive et explicite** — jamais les deux, jamais d'ambiguïté :

- `action: { kind: 'link'; href: string; label: string }` **ou**
  `{ kind: 'button'; label: string; onClick: () => void }` — une **union discriminée TypeScript**
  (`kind`) rend les deux simultanés impossibles à compiler ;
- l'union est rendue en lien réel (`href` sémantique) ou en bouton réel — jamais les deux éléments ;
- **navigation SPA préservée** : le consommateur React Router **injecte le même `LinkComponent`
  (avec son adaptateur `href`→`to`)** à `EmptyState` que le reste de l'écran — vérification
  obligatoire avant implémentation qu'une action « lien » vers une autre page **ne provoque aucune
  régression de navigation SPA** (rechargement complet interdit) ;
- icône, message, titre en props (i18n côté écran) ; RTL symétrique.

### 2-3. Contrat `Sheet` — un seul système de modales (directive du chef)

`Sheet` est une **composition des mécanismes existants** (vérifiés dans le code § 7-3) — **aucun
deuxième système de modales** :

- rendu **sur `ModalShell`** (`mobile='bottom'` déjà prévu pour une feuille basse) — Échap ferme
  l'overlay au sommet de la pile `openShells`, clic extérieur, portail sur `<body>` ;
- **`useCloseOnBack`** pour le bouton Retour (pile d'overlays + entrée d'historique, nettoyage exact
  déjà implémenté) ;
- **restauration du focus** et **empilement** suivent les conventions éprouvées du shell 2.6.1b
  (restauration vers le déclencheur, destinations empilées) ;
- **gestion du scroll** : comportement actuel de `ModalShell` conservé (backdrop défilant,
  `overscroll-contain`) ; toute extension (verrou du fond) se fait **dans `ModalShell`**, partagée par
  toutes les fenêtres — jamais doublée dans `Sheet` ;
- accessibilité : `role="dialog"`/étiquette comme les fenêtres existantes ; cibles ≥ 44 px ; 320 px ;
  RTL.
- **Vérification explicite avant implémentation** : comparer le comportement réel de `ModalShell` +
  `useCloseOnBack` avec ce que D4 montre dans `shell.html`/`modale.html` — **le code fait foi**, la
  maquette ne présume rien.

## 3. Couche 2 — composants métier réutilisables

### 3.1 `RecipeCard` — stabilisation de la variante `grid` uniquement (décision du chef, précisée)

- **Lot 2.6.2** : la variante **`grid` seule** est stabilisée et réfactorée en place — **mêmes
  consommateurs** (`RecipeGrid`, seul consommateur, utilisé par `RecipesPage`, `SuggestionsPage` et
  `HomePage`), **comportement visible inchangé** ; les variantes **`featured`** naît avec son premier
  consommateur réel (Home Page, 2.6.3) et **`compact`** avec le sien (lot de l'écran qui en aura
  besoin) — **aucune variante sans consommateur concret** ; la variante `deck` (R3) reste au lot 2.6.4.
- **Navigation actuelle conservée (A-2 précisé)** : **la navigation par callback est conservée, en
  particulier le comportement `background`** (`useOpenRecipe` navigue avec `RecipeOverlayState` — la
  fiche s'ouvre en surcouche de la liste et le retour y revient avec le contexte) ; **cette
  fonctionnalité n'est pas remplacée par un simple `href`**. Le motif « lien = href » reste la règle
  pour les composants dont la navigation est un simple chemin (`LinkTabs`, `PillTab`) ; le cas
  `RecipeOverlayState` est documenté dans le rapport comme comportement à ne pas perdre.
- **Vérifications obligatoires** : comparaison **avant/après du rendu sur les trois écrans
  consommateurs** (`RecipesPage`, `SuggestionsPage`, `HomePage`) **et vérification du comportement de
  navigation et du retour à la liste** (ouverture fiche, retour, contexte de liste préservé).
- **Favoris** : `isFavorite`/`onToggleFavorite` en props (inchangé) ; cible ≥ 44 px.
- **Coût** : le composant reçoit la fourchette de coût **en props** — `getRecipeCost` (importé
  aujourd'hui du contexte applicatif) est appelé par `RecipeGrid` et passé en prop : le composant
  n'importe plus `ContainerContext` (frontière couche 2/3 propre, comportement inchangé).
- **Migration tokens** : fonds `slate` → tokens ; labels/`aria-label` i18n ; zéro CLS (dimensions de
  média fixes, déjà `aspect-4/3`).

### 3.2 Badges de correspondance — la règle core consommée

- **`MatchingBadge`** : niveau de correspondance affiché (couleur/étiquette issues de la règle core,
  jamais recalculées dans le composant) ; **`MatchReason`** : rendu des **codes de raisons + ids
  d'ingrédients** reçus en props — la **traduction et la présentation sont ici** (interface), pas dans
  le core.
- Consommateurs : `/suggestions` (2.6.4), accueil aperçu frigo (2.6.3), fiche recette (2.6.5).
- Wording D1 (A-3 clôturé, § 6-1) ; libellés de niveaux = clés i18n nouvelles (4 langues) ajoutées
  dans `translations.ts` + `derjaArabic.ts`.

### 3.3 Autres composants métier (multi-écrans prouvés)

- **`PriceRange`** (`src/features/catalog/components/` — nouveau dossier) : affichage d'une fourchette
  de prix via `formatPriceRange` existant — cartes (2.6.3/2.6.4), courses coût manquant (2.6.6),
  fiche (2.6.5).
- **`CategoryRail`** : étal horizontal de catégories (`Rail` + vignettes `IngredientThumb`) — accueil
  (2.6.3), catalogue (2.6.4).
- **`Shelf`** : étal éditorial réutilisable (titre, action, enfants) — accueil (2.6.3), étals du
  catalogue R1 (2.6.4).

**Ne sont PAS extraits maintenant** (usage unique à ce stade — ils naîtront locaux à leur écran et
seront montés en couche 2 à leur deuxième consommateur) : `FridgePeek` (confirmé exclu, § 1),
`GroceryProgress`, `NotifCenter`, `ListsManager`, `ScanFlow`, `WeekStrip`, `PlanSummary`, `HistoryList`,
`FavoritesStrip`.

## 4. Migration tokens et conventions transverses

- Couleurs en dur des fichiers du lot → variables (`--color-*` du `@theme`, étendues en 2.6.1b) ;
  garde « zéro couleur en dur » **limitée aux fichiers du lot** (positive + négative, comme 2.6.1b).
- Langues : chaque nouveau texte existe dans les 4 variantes (`translations.ts` + `derjaArabic.ts`) ;
  backoffice non concerné (aucun écran backoffice dans ce lot).
- Wording D1 (A-3, clôturé) : **« Tous les ingrédients semblent présents — quantités à vérifier »** ;
  CTA **« Voir la recette »** ; les traductions dans les quatre langues conservent la nuance
  (« semblent », « à vérifier ») et **ne garantissent jamais** que la recette est immédiatement
  réalisable — vérification de chaque traduction (arabe littéral, derja latine, derja arabe) avant
  implémentation.

## 5. Périmètre exact, fichiers, tests et critères d'acceptation

### 5-1. Fichiers prévus

**Nouveaux (avec leur `*.test.ts(x)` à côté)** :

- `src/core/matching/display.ts` (+ test : table d'équivalence exhaustive tiers → niveau d'affichage,
  codes de raisons, action ; config injectée ; aucun texte) ;
- `src/shared/ui/` : `PageHeading`, `EmptyState` (union discriminée), `SkeletonList`, `Rail`,
  `Chips`+`ChipFilter`, `Sheet` (sur `ModalShell`+`useCloseOnBack`), `LinkTabs` (`LinkComponent`
  injectable) ;
- `src/features/recipes/components/` : `MatchingBadge`, `MatchReason` ;
- `src/features/catalog/components/` (dossier nouveau) : `PriceRange` ;
- `src/features/catalog/components/` : `CategoryRail`, `Shelf` (`Rail` partagé).

**Modifiés (refactor en place, comportement visible inchangé)** :

- `src/features/recipes/components/RecipeCard.tsx` (variante `grid` : navigation par callback avec
  état `background` conservée, coût en props, tokens) ;
- `src/features/recipes/components/RecipeBadges.tsx` (tokens) ;
- `src/features/recipes/components/RecipeListTabs.tsx` (consomme `LinkTabs`, injecte `Link`) ;
- `src/features/recipes/RecipeGrid.tsx` (passe le coût en props à `RecipeCard`) ;
- `src/shared/ui/OfflineIndicator.tsx` (message en prop, repli `t.offlineNotice`) ;
- `src/shared/i18n/translations.ts` + `derjaArabic.ts` (clés i18n des niveaux/raisons/action, 4 langues) ;
- `src/core/architecture.test.ts` si la garde doit couvrir l'injection `LinkComponent` (vérification,
  extension possible).

**Jamais touchés** : le moteur (`engine.ts`, `tiers.ts`), les écrans (`RecipesPage`, `SuggestionsPage`,
`HomePage` sauf pas de changement du tout — la comparaison avant/après est faite **sans modifier les
écrans**), les fenêtres existantes, toute dépendance.

### 5-2. Critères d'acceptation (obligatoires, comme 2.6.1b)

1. `npm run check` vert — **un test par composant** (rendu, états, interaction, accessibilité, contrat
   `EmptyState` vérifié par l'union discriminée) ; règle core : **mapping exhaustif vérifiable**
   (chaque tier mappé, cas limites, config de test — aucun seuil en dur, aucun texte).
2. **Navigateur réel** (serveur isolé, 4 langues, RTL inclus, clair/sombre ; 320/375/768/1280) :
   cibles **≥ 44×44 px sans chevauchement**, aucun débordement horizontal, contrastes AA des états
   nouveaux ;
   - **LCP : comparaison avant/après dans des conditions identiques** sur les écrans concernés —
     **mesures réelles conservées** (valeurs enregistrées dans le rapport, jamais un simple « tests
     verts ») ; **trois mesures à chaud constituent une première vérification** et ne sont **pas
     présentées comme une garantie statistique d'absence de régression** (comparaison des médianes,
     écarts documentés) ;
   - **CLS vérifié sur les pages et interactions concernées**, notamment **l'ouverture de `Sheet`**
     (et fermeture), sur les écrans de test — valeur réelle 0 attendue et enregistrée.
3. **`RecipeCard` `grid`** : comparaison **avant/après sur les trois écrans consommateurs**
   (`RecipesPage`, `SuggestionsPage`, `HomePage`) — **aucun changement visible** ; **navigation
   (ouverture fiche) et retour à la liste vérifiés** (contexte `background` préservé) ;
   favoris/coût/langues sans régression.
4. **`RecipeListTabs` après refactor `LinkTabs`** : **aucun changement visible** (liens, compteur,
   indice frigo vide, mémoire de filtres) ; navigation SPA préservée via `Link` injecté.
5. Garde d'architecture vérifiée : couches 1–2 sans import du routeur (le composant partagé
   `LinkTabs` n'importe jamais le routeur — l'injection le prouve), core `display` sans texte ni
   dépendance de langue, `Sheet` sans second système de modales.
6. Critères de clôture numérotés : (1) core display + tests ; (2) couche 1 livrée + tests ;
   (3) couche 2 livrée + tests ; (4) `RecipeCard` `grid` réfactoré sans régression visible ;
   (5) tokens dans les fichiers du lot ; (6) matrice navigateur réelle verte ; (7) docs
   `encyclopedie/` + `CLAUDE.md` à jour ; (8) `npm run check` vert, commit sur **autorisation
   explicite** du chef.
7. Rapport du lot au format 2.6.1b (tableau de vérifications, mesures réelles, écarts honnêtes) —
   arrêt après rapport ; commit et lot suivant uniquement sur autorisation du chef.

## 6. Arbitrages — tous clôturés

| Réf.         | Décision du chef (finale)                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1          | **`LinkTabs`** : vrais liens, `href` en props, `aria-current="page"`, pas de `tablist`                                                                                                                                                                                  |
| A-6          | **`LinkComponent` injectable en prop** ; défaut = lien natif `<a href>` ; les écrans React Router injectent `Link` (SPA préservée) ; **aucune import du routeur dans le composant générique** — composant réutilisable et indépendant de l'infrastructure de navigation |
| A-2          | **Navigation par callback conservée** (comportement `background` préservé, contexte de navigation intact) ; **pas de remplacement par un simple `href`** ; comparaison avant/après sur les 3 écrans + retour à la liste vérifié                                         |
| A-3          | Wording D1 = **base** : « Tous les ingrédients semblent présents — quantités à vérifier » ; CTA « Voir la recette » ; traductions 4 langues qui **ne garantissent jamais** la réalisabilité immédiate                                                                   |
| A-4          | Adoption des composants **aux lots consommateurs uniquement** ; aucune migration générale des écrans existants dans 2.6.2                                                                                                                                               |
| A-5          | **`FridgePeek` non créé en 2.6.2** (confirmé) — création prévue **au lot 2.6.3** (Home Page) ; mutualisation réévaluée **au lot 2.6.6 uniquement si un deuxième consommateur réel apparaît**                                                                            |
| Variantes    | `RecipeCard` : **`grid` seule** stabilisée en 2.6.2 ; `featured` créée à son premier consommateur (2.6.3) ; `compact` à son premier besoin ; **aucune variante sans consommateur réel**                                                                                 |
| `Sheet`      | Validé **sous réserve** : réutilise `ModalShell` + `useCloseOnBack` (Échap, clic extérieur, focus, scroll, empilement, mobile/desktop, accessibilité) — **aucun second système de modales**                                                                             |
| `EmptyState` | Contrat explicite : navigation (`href`) **ou** action (`onClick`), jamais les deux ni ambigu                                                                                                                                                                            |

**Points encore ouverts — hors lot 2.6.2 (aucun ne bloque ce lot)** : D2 bornes des niveaux
(constantes au 2.6.4, décision 5c) ; arbitrage filtres `recettes-filtres-alt.html` 🚩 Alt 1/Alt 2 vs
D-28 (2.6.4) ; arbitrages multilingues A1–A4 et B1–B3 (dossiers CMS / migration SQL / i18n dynamique) ;
T5 état des filtres en store (2.6.4).

## 7. Faits du code existant vérifiés (avant figeage des contrats — demande du chef)

1. **`RecipeCard`** : un seul consommateur, `RecipeGrid` (utilisé par `RecipesPage`, `SuggestionsPage`,
   `HomePage`) ; interactions = ouverture (callback `onSelectRecipe` → `useOpenRecipe` → navigation
   avec **état `background`** préservant la pile retour et le contexte de liste), favoris
   (`kitchen.toggleFavorite`), coût via `getRecipeCost` **importé du contexte applicatif** (à passer en
   props), badges `RecipeBadges` (couleurs en dur à migrer). Aucun comportement présumé depuis les
   maquettes.
2. **`RecipeListTabs`** : liens réels (`Link`), `aria-current`, compteur et indice frigo vide, `href`
   via `useRecipesHref` (mémoire de filtres) — **2 consommateurs** (`RecipesPage`, `SuggestionsPage`) ;
   son refactor vers `LinkTabs` garde tout ce comportement en props, sans changement visible, SPA
   préservée par l'injection de `Link`.
3. **`ModalShell`** : portail sur `<body>`, pile `openShells` (Échap ferme le sommet), `onDismiss`
   obligatoire, clic extérieur, placements `center/bottom/full`, backdrop défilant
   (`overscroll-contain`) — `Sheet` s'appuie exactement là-dessus. **`useCloseOnBack`** : pile
   d'overlays + entrée d'historique par `pushState`, nettoyage exact à la fermeture (mécanismes
   éprouvés du 2.6.1b).
4. **`OfflineIndicator`** : `navigator.onLine` + écouteurs, message via `t.offlineNotice` — évolution
   (message en prop) sans re-création.

## 8. Documentation prévue en fin de lot

`docs/encyclopedie/06-interface.md` (§ composants partagés), `03-domaine.md` (§ matching — séparation
moteur/display et mapping), `plan-consolide` (statut ligne 2.6.2 + annexe arbitrages),
`CLAUDE.md` (conventions couches 1–2 : lien = `href` en props + `LinkComponent` injectable, règle core
consommée, pas de logique métier dans les composants, un seul système de modales) ; rapport du lot
dans `docs/encyclopedie/donnees/`.
