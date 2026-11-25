# Lot 2.6.3 — Accueil C « personnel d'abord, éditorial ensuite » (dossier d'exécution, **v2**)

**Statut : dossier **corrigé et prêt pour présentation** — v2 intégrant les corrections A–F du
chef (AR-6). **Validation fonctionnelle encore attendue ; aucune implémentation autorisée à ce
stade ; même après validation du dossier, le développement nécessitera une autorisation distincte
et explicite.** Aucun commit. Références : D4 validé
(D-01 composition C, 6 états ; D-25 carrousel ; D-28 conventions), lots 2.6.1/2.6.2 clôturés,
V12 (moteur), réorientation de la roadmap (doc `reorientation-roadmap-carte-fonctionnelle.md`,
arbitrages AR-1…AR-6). Maquette de référence : **`accueil-c.html`** ; les accueils A/B restent
archivés (clos par D-01). Les données fictives de D4 restent des références UX/UI, **jamais des
règles métier automatiquement validées**.

**Révisions** : v1 (proposition initiale) · **v2** — corrections A–F du chef : distinction
état initial/chargement (A), retrait de « Nouveau du chef » sans règle fiable (B), **retrait des
emplacements publicitaires du lot** (C), état « frigo rempli sans suggestion » (D), stabilité
visuelle au chargement (E), les six états D4 explicités comme états de machine (F).

---

## 1. Périmètre précis et exclusions

### 1.1 Dans le périmètre

1. **Accueil composition C** en remplacement de la page actuelle (`HomePage` : héros statique +
   raccourcis + niveau « prête » seul), avec **les 6 états D4** comme machine d'états explicite (§ 3).
2. **Héros adaptatif** à quatre variantes (promesse, invitation, idée du soir, repas prévu) et un
   **état de chargement neutre** (§ 3.0-A) — jamais de promesse ou d'invitation tant que les
   données ne sont pas réellement connues.
3. **Aperçu frigo** (fridge-peek) sur données réelles du `KitchenStore` (compte — limitation
   quantités assumée, § 4.2).
4. **Étal « Avec ce que j'ai »** (ready + almost du moteur, ordre moteur) avec composants 2.6.2,
   **et l'état « rempli sans suggestion »** (§ 3.1-D).
5. **Bandeau favoris** (lecture seule des favoris existants — les fonctions ♥/⤓ restent au 2.6.8/E6).
6. **Carte « courses en cours »** (liste active réelle) — état `grocery` défini (§ 3.2).
7. **Rail de catégories** (arbre géré en base, jamais codé en dur) → liens filtres `/recipes`.
8. **Stabilité visuelle** : squelettes à hauteur réservée, apparitions sans décalage, CLS vérifié
   mobile **et** desktop (§ 4.6, critères § 8).
9. **Responsive 320/375/768/1280, 4 langues, RTL/LTR, clair/sombre**, cibles ≥ 44 px.
10. **Performance** : LCP/CLS mesurés, **0 requête nouvelle** (les collections sont déjà
    synchronisées au démarrage de l'app).

### 1.2 Exclusions (jamais perdues — lots prévus)

| Exclu de 2.6.3                                                    | Lot prévu                                                                                                                                                | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Emplacements publicitaires** (v1 les plaçait sur l'accueil)     | feature pub 10.x (F8/E7)                                                                                                                                 | **retrait au v2 (décision du chef)** : aucun emplacement vide visible, aucun espace réservé inutile, aucune colonne vide desktop, aucun service externe ; l'accueil est structurellement prêt à insérer un bloc futur (composition par props), mais **aucun composant pub n'est construit dans ce lot** — premier consommateur réel = lot pub (convention « extraction au premier consommateur »). Les arbitrages D-10/D-12 restent ouverts dans leur lot |
| **« Nouveau du chef »** (v1 : recette à plus forte `revision`)    | F5 (dates éditoriales réelles : création/dernière modification/première publication/dernière publication — AR-3) ou sélection éditoriale manuelle réelle | **retrait au v2 (décision du chef)** : une recette récemment _modifiée_ n'est pas une nouveauté ; `revision` = information technique, jamais une date éditoriale ; **mieux vaut ne pas afficher la section que présenter une information trompeuse**                                                                                                                                                                                                      |
| Carte invité « connexion » (D-26)                                 | 2.6.8/E6                                                                                                                                                 | D-26 est **🚩 non validée**                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Onboarding / bienvenue                                            | 2.6.8/E6                                                                                                                                                 | l'état `new` est couvert provisoirement (§ 4.1)                                                                                                                                                                                                                                                                                                                                                                                                           |
| Fonctions favoris (♥/⤓, onglet, hors ligne)                       | 2.6.8/E6 (D-06/D-07)                                                                                                                                     | l'accueil **lit** `KitchenStore.favorites`                                                                                                                                                                                                                                                                                                                                                                                                                |
| Étals sauvegardés du chef (requêtes enregistrées, /admin › Étals) | F5 + 7.1                                                                                                                                                 | seul l'étal « frigo » (règle moteur réelle) est ici                                                                                                                                                                                                                                                                                                                                                                                                       |
| Bande planning P1, outils P3                                      | 2.6.7/E5 (D-29 🚩)                                                                                                                                       | l'accueil **lit** `weeklyPlan` pour le prochain repas                                                                                                                                                                                                                                                                                                                                                                                                     |
| Personnalisation backoffice (thèmes, layouts, campagnes, ciblage) | lot CMS                                                                                                                                                  | préparé structurellement (§ 6), aucune dépendance                                                                                                                                                                                                                                                                                                                                                                                                         |
| Notifications (cloche + centre)                                   | 2.6.8/E6 (D-20 ✅)                                                                                                                                       | l'en-tête shell 2.6.1 est déjà en place                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Scan, mode cuisine, historique                                    | 2.6.5/2.6.8                                                                                                                                              | —                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Layouts alternatifs de page (CMS § 3.3)                           | lot CMS                                                                                                                                                  | la composition actuelle est **le** layout par défaut                                                                                                                                                                                                                                                                                                                                                                                                      |
| SEO de l'accueil                                                  | —                                                                                                                                                        | aucun changement : `/` garde son repli lisible serveur existant                                                                                                                                                                                                                                                                                                                                                                                           |

## 2. Analyse des références D4

`accueil-c.html` est entièrement en **blocs** (schéma de page + composants D4) — démonstration du
futur CMS, **pas une donnée de production**. Ce que D4 fixe (validé) : **D-01 ✅** (composition C,
6 états `new/empty/filled/favs/planning/grocery`, « bascule par état de la session, aucun calcul
lourd à l'ouverture » — convention D-02) ; note accueil-c : « le héros choisit seul : promesse
(nouveau), invitation (frigo vide), idée du soir (première recette prête du moteur) ou repas prévu
(planning) » ; **D-25 ✅** (Rail) ; **D-28 ✅** (conventions de correspondance) ; **D-10**
(« pas de pub entre les niveaux de suggestions » — reste ouvert dans le lot pub).

Ce que D4 **ne valide pas** (données fictives) : compteurs de démonstration, « 8 avec quantité /
1 sans quantité » (les quantités du frigo n'existent pas avant F1), recettes choisies par ids
fixes, formats d'annonces. Chaque bloc reçoit donc ici **une règle réelle** (§ 4).

## 3. Description fonctionnelle — états, blocs, charges

### 3.0 Machine d'états (core pur, données réelles, jamais mémorisée)

**Les 6 états D4 sont conservés comme états de machine** (`src/core/home/state.ts`, horloge
injectée, testée) — **progressifs** (cumulatifs), conformément à la démonstration D4 où « + Favoris
», « + Planning », « + Courses » s'ajoutent à un frigo rempli :

```
Base      : new (aucune donnée du tout) | empty (frigo et placard vides) | filled (au moins un ingrédient)
Additifs  : hasFavs (favoris ≥ 1) · hasPlanning (un repas à venir existe) · hasGrocery (liste active
            avec articles non cochés)
État affiché = base + additifs actifs (ex. « planning » = filled + hasPlanning + hasFavs…)
```

**Entrées** (déjà synchronisées au démarrage) : `KitchenStore` (frigo, placard, favoris,
`weeklyPlan`, listes), `CatalogStore` (recettes publiées), résultat du moteur (déjà indexé —
convention D-02 : aucun calcul lourd à l'ouverture), préférences, connexion. **Sortie** :
l'état affiché + les données de chaque bloc ; re-calcul réactif à chaque mutation, jamais
mémorisé dans une préférence (sauf le drapeau `new`, § 4.1).

### 3.0-A **Distinction obligatoire des quatre situations initiales** (correction A)

L'accueil ne déduit **jamais** un état de données qu'il n'a pas encore lues :

| Situation                                                                                                        | Signal                        | Rendu                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Stores pas encore chargés** (catalogue/cuisine en cours de synchronisation)                                 | état de chargement des stores | **chargement neutre** : squelettes (`SkeletonList`) à hauteur réservée, héros squelette sans CTA — **jamais** la promesse, **jamais** l'invitation à remplir |
| **2. Chargés, aucune donnée du tout** (frigo vide, aucune liste, plan vide, premier usage)                       | machine d'états               | **`new`** : héros promesse                                                                                                                                   |
| **3. Chargés, données réellement absentes** (frigo vide — y compris un utilisateur qui a tout retiré)            | machine d'états               | **`empty`** : héros invitation « remplir le frigo »                                                                                                          |
| **4. Chargés, données présentes mais aucune suggestion possible** (frigo non vide, moteur : 0 ready et 0 almost) | résultat moteur réel          | **état « rempli sans suggestion »** (§ 3.1-D) — jamais une section vide, jamais un résultat inventé                                                          |

La règle « chargé » vient des états de disponibilité des stores existants (le même signal qui
alimente déjà les squelettes du catalogue) — **aucun nouveau mécanisme**. Le drapeau `new` reste
local (§ 4.1) et n'est posé qu'**après** le premier chargement complet.

### 3.1 Blocs (composition C, ordre vertical mobile ; desktop = même colonne élargie)

1. **`home-greeting`** (salutation + badge marque) : i18n 4 langues, aucun contenu CMS.
2. **`home-hero`** (4 variantes + chargement neutre, § 4.1) : photo réelle de la recette mise en
   avant (idée du soir / repas prévu) via composant photo existant (tokens scrim 2.6.2), repli
   dégradé Zitouna sans photo ; cible LCP (§ 8) ; dimensions fixes (CLS 0).
3. **`grocery-progress`** (état grocery) : liste active — « N articles à acheter », lien courses.
4. **`fridge-peek`** (filled+) : compte frigo + placard, CTA ajouter (lien frigo). Pas de détail
   quantités avant F1 (limitation assumée, § 4.2).
5. **`shelf` « Avec ce que j'ai »** (filled+) : `Rail` + `RecipeCard` (grille) + `MatchingBadge`
   (codes core 2.6.2), ready puis almost (§ 4.3), « Tout voir » → `/suggestions` ; **sinon état
   « rempli sans suggestion »** (D ci-dessous).
6. **`favorites-strip`** (hasFavs) : `Rail` de `RecipeCard` (grille, convention variante `compact`
   réévaluée à son premier besoin réel — E2), « Tout voir » → favoris filtrés
   (`favoritesOnly` existe).
7. **`warm-band`** éditorial : **`category-rail` seulement** (mode lien, arbre géré) — le
   « Nouveau du chef » est retiré du lot (v2).
8. **InstallBanner / OfflineIndicator** : déjà globaux dans `AppLayout` — inchangés.

**Aucun emplacement publicitaire** dans ce lot (v2, § 1.2).

### 3.1-D État « frigo rempli sans suggestion » (correction D)

Quand le frigo/placard contient des ingrédients mais que le moteur renvoie **0 ready et 0 almost**
(résultat réel, jamais recalculé dans l'interface) : la section affiche un bloc explicatif —
situation nommée honnêtement (les recettes proposées dépendent de ce que contient le frigo),
**action pertinente unique** : « Découvrir les recettes » → `/recipes` (le catalogue reste
utilisable) + rappel discret « Modifier le frigo » → frigo. **Aucun faux résultat, aucun seuil
recalculé, aucune invention** — le texte est traduit dans les 4 langues et ne promet rien
(wording à valider avec les traductions au dossier d'implémentation).

### 3.2 Correspondance états ↔ héros ↔ sections (correction F — explicite)

| État affiché                                           | Héros                                                                                                                  | Sections visibles                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **new** (chargé, aucune donnée)                        | **promesse** (identité, sans photo)                                                                                    | catégories (rail) — les sections personnelles sont absentes, remplacées par le héros        |
| **empty** (frigo/placard vides, autre donnée possible) | **invitation** (CTA frigo)                                                                                             | catégories ; `new`→`empty` ne change que le héros et le texte d'invitation                  |
| **filled**                                             | **idée du soir** (première recette _ready_ du moteur) ; sans ready : sous-titre compte de suggestions, CTA suggestions | fridge-peek, étal frigo (ou état D), favoris si hasFavs, courses si hasGrocery, catégories  |
| **favs** (filled + favoris)                            | inchangé (idée du soir)                                                                                                | **bandeau favoris visible** — `favs` reste un état de la machine (never « simple section ») |
| **planning** (filled + repas à venir)                  | **repas prévu** (nom, créneau, temps, CTA fiche avec `background`)                                                     | inchangé + héros planning                                                                   |
| **grocery** (filled + liste active non vide)           | inchangé                                                                                                               | **carte courses visible** (« N articles à acheter » → `/grocery`)                           |

Le `grocery` a une expérience définie : la carte porte le **nombre d'articles à acheter** de la
liste active réelle (et non le total), le lien ouvre la liste active. La hiérarchie du héros est :
**planning > idée du soir (ready existe) > invitation (empty) > promesse (new)** — un seul choix,
sans empilement (D4 : « le héros choisit seul »).

### 3.3 États transversaux par bloc

- **Chargement** (situation 1) : squelettes par section à **hauteur réservée identique** au
  contenu final (correction E) ; le héros squelette occupe la même hauteur que la variante
  finale ; aucune apparition qui déplace le contenu.
- **Données indisponibles / erreur** : source vide à cause d'un échec (hors ligne, catalogue
  absent) → `EmptyState` (2.6.2) avec action unique ; jamais d'erreur brute, jamais de crash.
- **Hors ligne** : bandeau global `OfflineIndicator` (message en prop) ; l'accueil reste rendu
  avec les données locales (IndexedDB).
- **Vide** : chaque bande est conditionnelle — l'accueil ne montre jamais un bloc vide inutile.

## 4. Règles métier réelles et arbitrages restants

### 4.1 🚩 A-1 — État « nouveau » sans onboarding (arbitrage soumis à votre décision)

**Question fonctionnelle à trancher** : sans onboarding (prévu à E6), comment distinguer un
utilisateur qui ouvre l'app pour la **première fois** d'un utilisateur qui a délibérément vidé son
frigo — alors qu'aucune donnée ne permet aujourd'hui de faire la différence ?

**Options et conséquences** :

| Option                                                                                               | Comportement                                                  | Conséquences UX          | Conséquences techniques |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------ | ----------------------- |
| **(a) proposée — drapeau local** « déjà vu l'accueil » (posé après le premier chargement             |
| complet, situation 2 seulement)                                                                      | première visite → héros **promesse** ; toute visite suivante  |
| avec un frigo vide → héros **invitation**                                                            | la promesse (« bienvenue, découvrez ») n'est vue qu'une       |
| fois — un utilisateur qui vide son frigo retombe sur l'invitation adaptée, jamais sur un message     |
| de bienvenue incongru ; l'utilisateur qui efface son stockage local revoit la promesse (comportement |
| cohérent : son « état » local a été réinitialisé)                                                    | un drapeau local par appareil, posé via le port               |
| de préférences existant — jamais synchronisé (pas d'impact base, compatible Firestore/SQL sans       |
| transformation) ; remplacé proprement par l'onboarding réel à E6 (le drapeau devient superflu,       |
| suppression triviale)                                                                                |
| **(b) retirer `new` du lot**                                                                         | pas de variante promesse tant que l'onboarding n'existe pas — |
| uniquement invitation (frigo vide) et rempli                                                         | plus simple, zéro ambiguïté ; mais la toute                   |
| première impression de l'app sur l'écran stratégique est un message « votre frigo est vide » plutôt  |
| que la promesse de marque                                                                            | rien à construire ; variante promesse livrée à E6             |
| (c) reporter tout le héros à E6                                                                      | aucune variante adaptative avant E6                           | l'accueil reste le héros |
| statique actuel — le lot perd son cœur UX                                                            | report massif du lot                                          |

**Recommandation argumentée (a)** : la promesse est l'accueil d'un **premier contact**, pas l'état
« frigo vide » ; la distinguer une fois a une valeur UX réelle sur l'écran le plus vu, et son coût
technique est minimal (un drapeau local, un test) ; l'option (b) est défendable si vous préférez
zéro donnée locale nouvelle ; (c) viderait le lot de sa raison d'être. **A-1 reste soumis à votre
décision — cette note documentaire ne le valide pas.**

### 4.2 Aperçu frigo sans quantités (F1 pas encore livré)

Le frigo réel est une liste d'**ids** (les entrées arrivent avec F1). D4 montre « 8 avec
quantité / 1 sans quantité » — **non implémentable honnêtement**. **Règle retenue** : le compte
des ingrédients (frigo + placard) + CTA ; les détails viendront avec F1/E4 par évolution du
même bloc. Aucune invention de données.

### 4.3 Étal « Avec ce que j'ai » — exactement le moteur

Source unique : `useRecipeMatches` (moteur indexé) — **ready puis almost**, ordre du moteur,
**3 cartes max** + « Tout voir ». Badges/raisons via `MatchingBadge`/codes `@/core/matching`
(2.6.2) ; **aucun seuil recalculé** (séparation stricte). Frigo vide → section absente (états
new/empty la remplacent). Frigo non vide et 0 ready/0 almost → état D (§ 3.1-D). Le wording D1
(« …quantités à vérifier ») s'affiche via les codes existants ; le détail par raison reste E2.

### 4.4 Prochain repas (héros « repas prévu »)

Règle pure dans le core (horloge injectée, testée) : premier repas **à venir** du `weeklyPlan` —
créneaux restants du jour, sinon premier créneau des jours suivants ; plat principal prioritaire,
entrée/dessert si pas de plat ; plan vide → variante « idée du soir ». Les outils P3 restent E5.

### 4.5 Cartes de l'accueil — réutilisation stricte

`RecipeCard` variante `grid` + **variante `featured` ajoutée à son premier consommateur** : avec
le retrait de « Nouveau du chef » (v2), **plus aucun consommateur `featured` reste dans ce lot**
— la variante est **reportée à son premier consommateur réel** (E2 ou E7), conformément à la
convention A-4 du lot 2.6.2. Callback `onSelectRecipe` conservé (convention `background`).
Favoris du bandeau : lecture `KitchenStore.favorites` dans l'ordre enregistré.

### 4.6 Stabilité visuelle pendant le chargement (correction E)

1. Chaque section déclare sa **hauteur réservée** (squelette = hauteur du contenu typique,
   mesurée à la revue) ; le passage squelette → contenu ne déplace rien en dessous.
2. Le héros est rendu **immédiatement** dans sa variante « chargement neutre » (hauteur fixe),
   les variantes finales occupent la même hauteur (photo dimensionnée `width/height`).
3. Les images non héros sont `lazy` + dimensionnées ; aucune fonte de composition dynamique
   (pas de bloc qui « apparaît » en poussant le contenu).
4. Vérification CLS par section (mobile + desktop), incl. le passage offline/offline→en ligne,
   critère mesurable § 8.

### 4.7 Sémantique et compatibilité fournisseurs (règle permanente)

Aucun nouveau modèle ni champ : le lot **lit** les collections existantes. Le drapeau « déjà vu
l'accueil » (option A-1a) est une préférence locale par appareil — compatible Firestore/SQL sans
transformation. Aucun tableau imbriqué, aucune écriture multi-documents.

## 5. Parcours et interactions

- **Arrivée** (lien, marque-page, retour d'onglet) : page rendue immédiatement en état de
  chargement neutre, puis l'état réel — sans reflow (hauteurs réservées).
- **Retour** : ouvrir une fiche depuis un bloc → `/recipe/:slug` avec état `background` → retour
  = accueil intact (convention 2.6.1b, testée).
- **CTA du héros** : promesse/invitation → frigo ; idée du soir/repas prévu → fiche.
- **« Tout voir »** étal → `/suggestions` (filtres mémorisés) ; favoris → `/recipes`
  `favoritesOnly` ; catégories → `/recipes?categorie=…` ; courses → `/grocery` (liste active).
- **Clavier** : éléments natifs, focus visible, cibles ≥ 44 px (favori `RecipeCard` conforme).
- **Fenêtres** : aucune modale nouvelle (`Sheet` reste sans consommateur — validation reportée à
  son adoption).

## 6. Architecture proposée

- **`src/core/home/state.ts`** (+ `state.test.ts`) : machine d'états (base + additifs, § 3.0),
  règles « prochain repas », « chargé vs données absentes » (drapeaux de disponibilité passés en
  entrée), état « rempli sans suggestion » — TypeScript pur, horloge injectée, exportée par
  `src/core/index.ts`.
- **`src/application`** : **aucun port nouveau** — le lot lit `CatalogStore`, `CategoryStore`,
  `KitchenStore`, préférences, connexion (drapeau local via le port de préférences existant).
- **`src/features/home/`** : orchestrateur **mince** (`HomeOrchestrator` : lit les stores +
  disponibilités, calcule l'état via le core, passe des props) + blocs **sans logique métier** :
  `HomeHero` (variantes + chargement), `FridgePeek`, `GroceryProgress`, `HomeShelf` (étal ou état
  D), `FavoritesStrip`, `HomeCategoryRail` (wrap de `CategoryRail` 2.6.2). Blocs = props typées —
  préparation aux **layouts CMS** (réassemblables) et au **natif** (règles dans le core).
- **`AdSlot` : non construit dans ce lot** (v2) — premier consommateur = lot pub ; l'insertion
  future d'un bloc pub est une composition de plus (aucune refonte).
- **Garde d'architecture** : le lot s'enregistre (couleur en dur interdite, imports core par
  index, features sans infrastructure/Firebase).

### 6.1 Impacts fichiers (estimation révisée)

| Zone                | Fichiers                                                                                                                      | Type                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Core                | `src/core/home/state.ts` + test ; `src/core/index.ts`                                                                         | nouveaux + 1 export    |
| Features home       | `HomePage.tsx` → orchestrateur ; `components/*` (~7 + tests)                                                                  | réécriture/nouveaux    |
| Shared              | `translations.ts`, `derjaArabic.ts` (~22 clés × 4 langues, état D inclus)                                                     | i18n                   |
| App                 | `AppRoutes.tsx` (route `/` → orchestrateur, **après** vérifications) ; garde                                                  | 2 fichiers             |
| Réutilisation 2.6.2 | `Rail`, `EmptyState`, `SkeletonList`, `RecipeCard` (grid), `MatchingBadge`, `CategoryRail`, `OfflineIndicator`, `PageHeading` | aucune duplication     |
| Legacy              | l'actuel `HomePage` **resté en place pendant le lot** (repli) ; retiré au commit final après validation du rapport            | supprimé en fin de lot |

Estimation : ~12–15 fichiers de code + i18n, **aucun port nouveau, aucune dépendance ajoutée,
aucun composant pub**.

## 7. Tests (stratégie)

- **Core** : `state.test.ts` — chaque situation initiale (1–4, § 3.0-A), base + additifs (les 6
  états D4), hiérarchie du héros, prochain repas (aujourd'hui restant / jours suivants / plan
  vide), état « rempli sans suggestion », horloge injectée ; **séparation matching** respectée.
- **Composants** (happy-dom, style projet) : chaque bloc (variantes héros, étal ready/almost,
  état D, peek, favoris, courses, catégories) avec faux stores ; garde architecture mise à jour.
- **Navigateur** (protocole 2.6.2, serveur isolé 3001 + seed jetable) : matrice
  320/375/768/1280 × 4 langues × clair/sombre (débordement/chevauchement/cibles ≥ 44) ; les états
  réalisés par jeux de données de seed distincts ; situations initiales 1–4 démontrées ; parcours
  fiche → retour (`background`) ; hors ligne ; LCP/CLS (§ 8) ; capture si l'outil le permet,
  sinon mesures calculées (méthode documentée).
- **Non-régression** : `/suggestions`, `/recipes`, frigo, courses, planning inchangés ; l'ancien
  accueil reste le repli tant que les critères ne sont pas verts.

## 8. Critères d'acceptation mesurables

1. Les **6 états D4** et les **4 situations initiales** s'affichent correctement (démonstration
   par seed, un état = un jeu de données) ; **jamais** de promesse/invitation pendant un
   chargement ; aucune donnée fictive en dur.
2. **État « rempli sans suggestion »** : message honnête + actions réelles, jamais une section
   vide ou un résultat inventé (testé en seed avec un frigo sans correspondance).
3. **Zéro CLS** à l'arrivée, à l'apparition de chaque section et au passage hors ligne/en ligne
   (mobile **et** desktop) ; hauteurs réservées vérifiées section par section.
4. **LCP** : mesuré avant/après (conditions identiques, 3 mesures à chaud après 1 échauffement,
   médianes comparées, bruit documenté — pas de promesse statistique) ; photo héros `eager` +
   `fetchpriority=high`, tout le reste `lazy` ; le héros sans photo reste candidat LCP.
5. **Requêtes** : **0 requête nouvelle** à l'ouverture ; étal ≤ 3 cartes, favoris ≤ 5,
   catégories ≤ 8 — jamais la liste complète des recettes rendue.
6. Matrice responsive/langues/modes **sans défaut** (0 < 44 px, 0 chevauchement, 0 débordement).
7. Interactions : fiche→retour, CTA, « Tout voir », filtres catégorie, courses — fonctionnels ;
   état `background` vérifié.
8. `npm run check` vert (tests nouveaux inclus) ; garde d'architecture verte.
9. Docs mises à jour (06-interface, plan consolidé, CLAUDE.md si convention) ; **aucun commit sans
   autorisation du chef**.

## 9. Risques et dépendances

| Risque                                                    | Maîtrise                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Régression LCP (héros photo)                              | photo `eager` unique, dimensions fixes, mesure avant/après ; repli dégradé sans photo                                   |
| Quantités frigo absentes (F1 en préparation)              | aperçu limité au compte (§ 4.2), évolutif sans refonte                                                                  |
| État initial mal détecté (situation 1 confondue avec 2/3) | règle « chargé » issue des disponibilités de stores existantes, testée dans le core ; démonstration navigateur par seed |
| « Nouveau » sans onboarding                               | arbitrage A-1 (drapeau local provisoire, remplacé à E6)                                                                 |
| Dépendance CMS prématurée                                 | blocs = props typées, orchestrateur = composition ; aucun import CMS                                                    |
| Divergence maquette/règles                                | chaque bloc reçoit une règle réelle (§ 4) ; D4 = référence UI seulement                                                 |
| Peinture masquée (LCP non rapporté)                       | même limite que 2.6.2 : consignée honnêtement, mesure avec aperçu visible si possible                                   |

**Dépendances** : aucune externe ; lecture seule des données existantes — **aucune dépendance à
F1/F2/F3** (l'état D couvre le frigo sans correspondance) ; les arbitrages A-1 + validation des
traductions restent à trancher au dossier d'implémentation.

---

## Annexe — décisions déjà arrêtées (non re-ouvertes)

D-01 (composition C, 6 états) ✅ · D-25 (Rail) ✅ · D-28 (conventions) ✅ · A-4 du 2.6.2
(adoption aux consommateurs, `featured` reporté faute de consommateur réel) · séparation
moteur/affichage (2.6.2) · « public = validé seulement » · `PATHS.*` · i18n 4 langues sans texte
en dur · catégories gérées en base · Firebase/SQL double compatibilité (lecture seule) ·
**v2 : retrait des pubs (décision du chef) et retrait de « Nouveau du chef » sans règle fiable
(AR-3/AR-6)** — la section reviendra à F5 (dates réelles) ou avec une sélection éditoriale
réelle ; les conteneurs pub reviendront avec le lot pub 10.x (règles D-10/D-12 ouvertes là).
