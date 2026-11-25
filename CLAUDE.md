# CLAUDE.md

Chnowa Ntayeb by Chef Souhed : PWA culinaire tunisienne (React 19 + Vite + Tailwind 4,
react-router 7, Express, Firebase). Documentation : `docs/index.md` (point d'entrée). Référence en vigueur : `docs/solution/` ; dossiers
d'évolution : `docs/evolutions/` (7 familles) ; état, rails, points ouverts et annexes :
`docs/roadmap.md` ; Documents historiques résiduels : `docs/encyclopedie/` (baseline de
performance protégé et audit v2.3) ; maquettes de référence : `docs/reference-visuelle/site/`.

## Commandes

- `npm run dev` : serveur de développement (http://localhost:3000)
- `npm run check` : types + lint (oxlint) + formatage (Prettier) + tests (Vitest). **Doit passer avant tout commit.**
- Vitest tourne en deux projets (`vite.config.ts`) : `emulator` (les suites Firestore, séquentielles —
  elles partagent la même base d'émulateur) et `unit` (le reste, parallèle). **Tout nouveau fichier de
  test qui touche `FIRESTORE_EMULATOR_HOST` est ajouté au `include` du projet `emulator` ET à l'`exclude`
  du projet `unit`, les deux à la fois.** Campagnes et commandes : `docs/solution/qualite-tests.md`.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`
- `npm run diagnose:matching` : rapport du moteur de suggestions sur des frigos types
- `npm run deploy:rules` (après `npm run firebase:login`) : déploie `firestore.rules`

## Réflexes de conception (chaque évolution, chaque brique)

Valables pour toutes les données et briques (recettes, ingrédients, thèmes, scénarios, réglages, planning,
courses, textes, comptes), pas seulement les recettes. Chaque plan dit en une ligne comment il respecte chaque point.

1. **Évolutif et performant** : tient avec des milliers d'éléments puis bien plus ; coût en lectures maîtrisé,
   synchronisation incrémentale (`updated_at` + marques de suppression), jamais de relecture complète à chaque
   ouverture ; IndexedDB pour les gros volumes ; listes par pages avec des **totaux justes** (compteurs sur le
   résultat complet, jamais sur la page affichée) ; pas de calcul lourd ni de rendu d'une liste entière d'un coup.
2. **Organisé et maintenable** : architecture hexagonale respectée, une responsabilité par module, noms clairs.
3. **Factorisé, sans duplication** : un mécanisme générique réutilisé par toutes les collections plutôt qu'une
   copie par type de données.
4. **Sûr** : règles de la base au plus strict, toute donnée externe relue par le core, aucun secret côté client,
   pas d'injection (HTML, liens), droits super admin vérifiés côté serveur et base.
5. **Agréable** : retour immédiat, états de chargement et d'erreur clairs, mobile 320 px, fenêtres qui se ferment
   comme attendu, aucune perte de saisie.

## Architecture (hexagonale) — règles à respecter

`src/core` (TypeScript **pur**, imports uniquement par `index.ts`) → `src/application` (ports + stores) →
`src/infrastructure` (adapters) → `src/features` / `src/shared` / `src/app` (interface, n'importe jamais
`src/infrastructure` ni Firebase) ; seuls `src/app/container.ts` et `server/app.ts` relient ports et adapters.
Détails et exemples : `docs/solution/architecture.md` (vérifiés par `src/core/architecture.test.ts`).

## Checklist de chaque évolution (obligatoire)

Toute évolution suit ce chemin, couche par couche ; ne pas sauter d'étape ni court-circuiter une couche.

1. **Règle métier / validation** → `src/core/<module>`, TypeScript pur, exportée par `index.ts`, avec son
   `*.test.ts` à côté. Horloge, aléatoire et ids injectés. Toute donnée externe (base, fichier importé)
   est relue par une fonction de validation du core (`resolveMatchingConfig`, `parseScenario`…) ; ce que le
   super admin saisit est vérifié avant l'enregistrement (`validateRecipe`, `validateIngredient`).
2. **Besoin du monde extérieur** → un **port** dans `src/application/ports.ts`, écrit avec les mots du
   domaine (aucun type, terme ou nom de base / SDK), + un **store** (ou service) dans `src/application`
   qui n'importe que `src/core`, testé avec de faux adapters.
3. **Implémentation** → un **adapter** par technologie dans `src/infrastructure/<techno>/` (base = source de
   vérité, localStorage = copie hors ligne seulement), branché **uniquement** dans `src/app/container.ts`,
   exposé par un hook dans `src/app/ContainerContext.tsx`. Chaque port de données a un **test de contrat**
   (`src/infrastructure/contracts/*.contract.ts`) que tout adapter doit passer, et une implémentation en
   mémoire (`src/infrastructure/memory/`) qui sert de référence. Un objet modifié est **écrit en entier,
   sans fusion** et sans `undefined` : un champ retiré (vidéo…) doit disparaître de la base, sinon il revient sur
   les autres appareils. **Données partagées = mécanisme commun** : `SyncedCollectionStore` + port
   `SharedCollectionSource` / `SharedCollectionWriter` (`revision` = heure serveur, suppression = marque
   `deleted`, suivi en direct) + copie IndexedDB (`LocalCollectionCache`) ; jamais de relecture complète à
   chaque ouverture (voir `docs/solution/donnees-sync.md`).
4. **Spécificités de la base actuelle** (Firestore : règles `firestore.rules`, `npm run deploy:rules`,
   transactions, ordre, ids) → restent dans l'adapter et sa configuration, jamais dans le domaine,
   les stores ou l'interface.
5. **Interface** → `src/features/<écran>`, sans logique métier, n'importe jamais `src/infrastructure` ni
   un SDK de base, et ne nomme jamais la base dans ses textes ; fenêtres avec `ModalShell` + `useCloseOnBack` ;
   vérifiée à 375 px et 320 px ; textes dans toutes les langues et variantes (`LANGUAGES`), backoffice compris (il suit la langue courante).
6. **JSON** uniquement pour exporter / restaurer, jamais comme source de données de l'application.
7. **Documentation** : après chaque évolution, mettre à jour le document concerné (`docs/solution/` ou `docs/evolutions/`), `docs/roadmap.md`
   lorsque l'état, les décisions ou les dépendances évoluent, et ce `CLAUDE.md` uniquement lorsque
   les conventions, règles de travail, procédures ou références générales changent ; exécuter les
   contrôles de validation prévus par le projet avant tout commit (`npm run check` uniquement si
   cette commande est définie et adaptée au périmètre modifié).

### Changer de base de données

Nouveaux adapters dans `src/infrastructure/<nouvelle-techno>/` qui passent les tests de contrat, branchés dans
`src/app/container.ts` : domaine, stores et écrans ne changent pas. Détails et exemples :
`docs/solution/guides.md` (§ « Changer de base de données »).

## Compatibilité permanente Firebase / SQL

**Contexte** : Firebase/Firestore reste le fournisseur de données actif. L'architecture est préparée pour une
**migration globale** vers SQL — **une famille de bases relationnelles, pas un moteur désigné** : le choix
du moteur définitif (PostgreSQL, MySQL, SQL Server, autre) est **différé** et exige une **décision
explicite** (besoins, coûts, hébergement, performances, contraintes techniques). Un seul fournisseur actif
à la fois, aucun mode hybride, **sans refonte des modèles métier ni réécriture des fonctionnalités**. Toute
nouvelle fonctionnalité, toute modification d'un modèle existant et toute évolution de la structure des
données sont donc conçues dès maintenant pour être compatibles avec les deux fournisseurs :

1. **Double compatibilité dès la conception** — avant toute modification d'un modèle, analyser son
   fonctionnement dans Firestore **et** dans une base relationnelle SQL ; ne pas introduire de structure ou
   de comportement qui ne fonctionnerait qu'avec l'un des deux, sauf nécessité technique justifiée et
   **isolée dans l'adaptateur concerné** ; ne jamais repousser cette réflexion à la phase de migration.
2. **Indépendance du métier vis-à-vis du stockage** — modèles, règles métier et services applicatifs ne
   dépendent ni d'un SDK Firebase, ni de Firestore, ni d'un moteur SQL ; les accès passent par les contrats
   et abstractions de stockage (`DataStore`, ports applicatifs) ; les différences propres à un fournisseur
   restent confinées dans son adaptateur.
3. **Sémantique des données** — chaque évolution examine explicitement : identifiants et stabilité,
   relations et références, dates/horodatages/fuseaux, valeurs nulles-absentes-par défaut, tableaux et
   structures imbriquées, suppressions logiques et physiques, révisions-versions-synchronisation,
   unicité et intégrité, index et besoins de recherche. **Sémantique identique sur les deux fournisseurs**,
   même si la représentation physique diffère.
4. **Transactions et cohérence** — toute opération impliquant plusieurs écritures est analysée sous l'angle
   des transactions Firestore **et** SQL ; ne jamais supposer qu'une garantie d'un fournisseur existe chez
   l'autre ; identifier les limites de taille, d'atomicité, de concurrence et d'isolation ; si une opération
   ne peut pas être reproduite avec les mêmes garanties, proposer une **solution portable avant de
   l'implémenter**.
5. **Requêtes et performances** — éviter les dépendances à des fonctionnalités spécifiques d'un moteur ;
   vérifier que recherches, filtres, tris, paginations et index nécessaires sont réalisables sur les deux ;
   ne pas déplacer un filtrage vers SQL ou Firestore sans analyser son équivalent ; performances
   acceptables sur le fournisseur actuel et volumes futurs anticipés.
6. **Tests de compatibilité** — toute évolution significative du contrat ou d'un modèle est couverte par des
   tests exécutables **sur les deux adaptateurs** ; harnais commun des tests de contrat (`DataStore`)
   lorsque pertinent — extensible à tout moteur SQL (PostgreSQL, MySQL, SQL Server, autre) **sans modifier
   le métier** ; les tests distinguent les **garanties communes du contrat** des **particularités de chaque
   adaptateur SQL**. **Un dialecte implémenté ou une compatibilité théorique n'est jamais une preuve de
   compatibilité** (statut réel : SQLite testé ; tout autre moteur — PostgreSQL, MySQL, SQL Server —
   non démontré tant que sa suite de tests pertinente n'est pas passée).
7. **Migrations et évolutions de schéma** — toute modification structurelle prévoit son impact sur les
   données existantes : transformations, valeurs par défaut, rétrocompatibilité, **retour arrière** ;
   adaptations prévues pour Firestore et SQL même si une seule migration physique est exécutée ; **jamais**
   de modification de structure sans stratégie de compatibilité et de migration **validée**.
8. **SQL est une famille, pas un moteur** — aucune cible SQL privilégiée dans l'architecture ; les
   fonctionnalités SQL **standard** et les structures relationnelles **portables** sont privilégiées ; toute
   fonctionnalité spécifique à un moteur est **isolée dans son adaptateur**, avec une solution de remplacement
   ou une limitation **clairement documentée** ; les différences de **types, JSON, index, transactions,
   contraintes, pagination, concurrence et migrations** sont analysées **pour chaque moteur concerné** ;
   le contrat et les modèles n'incorporent **aucun type, méthode ou comportement propre à un moteur**.
   8 bis. **Garantie commune des identifiants** — un identifiant de document est **non vide, unique par
   collection, immuable, ≤ 1500 octets**, ne contient **jamais `/`**, n'est **jamais `.` ni `..`**, et ne
   correspond **jamais au motif réservé Firestore `__.*__`** (deux underscores au début ET à la fin).
   Aucune autre restriction de jeu de caractères : les e-mails (`email_index`), les sous d'invités
   (`guest:`), les slugs, les ids à points uniquement (`...`) et à point initial (`.hidden`) restent
   légaux — **aucune donnée existante n'est exclue**. Les expressions régulières des endpoints
   (`/api/data/:name/:id`) restent des politiques d'interface, jamais des règles de contrat.
9. **Persistance SQL relationnelle — jamais « tout en JSON »** — la cible SQL repose sur une **véritable
   modélisation relationnelle** : tables dédiées aux domaines métier, colonnes typées, clés primaires et
   étrangères, relations explicites, contraintes d'intégrité et d'unicité, index adaptés aux requêtes et
   volumes — y compris pour le moteur de matching (configurations, règles, scénarios), les réglages, les
   recettes, les ingrédients, les comptes, le frigo et les listes de courses. **JSON reste réservé aux
   échanges API, aux imports/exports et aux sauvegardes — jamais substitut au relationnel pour la
   persistance** ; toute exception est présentée et **validée explicitement** avant implémentation. Cette
   règle ne transforme pas le modèle Firestore maintenant : la compatibilité est préparée **dans les deux
   sens**, et la migration prévoira la **transformation réelle** des documents en structures relationnelles
   (données, identifiants, relations, révisions, suppressions logiques et mécanismes de synchronisation
   conservés) — cohérent avec la V12 § 4 (« jamais tout en JSON dans SQL »).

**Exigence avant implémentation** — toute évolution significative d'un modèle présente cette analyse :

| Élément                 | Analyse attendue                                    |
| ----------------------- | --------------------------------------------------- |
| Modèle cible            | Structure et sémantique proposées                   |
| Compatibilité Firestore | Représentation, écritures, lectures, contraintes    |
| Compatibilité SQL       | Tables, relations, contraintes, index, transactions |
| Contrat de stockage     | Opérations nécessaires et garanties attendues       |
| Données existantes      | Impact et stratégie de transition                   |
| Tests                   | Vérifications sur les deux fournisseurs             |
| Limites                 | Différences ou compromis identifiés                 |

**Principe fondamental** : Firebase est le fournisseur actif mais ne dicte jamais seul la conception des
modèles ; SQL est la cible mais n'impose pas prématurément de complexité inutile. La solution reste
**cohérente, portable, maintenable et performante sur les deux**. Cette règle s'applique à tous les
développements futurs, y compris ceux qui ne font pas partie du chantier de migration SQL.

## Conventions

- Pas de duplication : une règle métier vit à un seul endroit dans `src/core`, avec ses tests à côté (`*.test.ts`).
- Domaine pur : horloge, aléatoire et ids injectés.
- Composants sans logique métier ; un écran = un dossier dans `src/features`.
- **Base de données d'abord** : données partagées et réglages dans le fournisseur actif (Firestore aujourd'hui — voir § « Compatibilité permanente Firebase / SQL ») ; localStorage seulement
  comme copie hors ligne ; fichiers JSON seulement pour exporter / restaurer.
- Moteur de matching : tout réglage passe par `MatchingConfig` + `resolveMatchingConfig` ; une
  suggestion jugée fausse devient d'abord un scénario du chef, créé dans /admin › Moteur (stocké
  en base, collection `matching_scenarios` ; aucune liste de scénarios dans le code).
- Nouvelle adresse : `src/shared/paths.ts` + `src/app/AppRoutes.tsx` + si elle est publique, sa page serveur dans
  `SCREENS` (`server/seo.ts`) : les robots qui ne lancent pas le JavaScript doivent voir son contenu (copie lisible
  dans `fallback`, masquée aux visiteurs, listes par pages de 100).
- Gestion du catalogue (ajout / modification d'ingrédients, de recettes, de prix) **réservée au super admin**
  dans `/admin` : aucun formulaire de création dans l'interface publique.
- **Langues et variantes** : une seule liste `LANGUAGES` (`@/core/shared`) — français (référence), arabe littéraire, derja latine (3, 7, 9), derja arabe (`derja_ar`) — et contenu multilingue en champs `<champ>_<langue>` lus via `pickLocalized` / `localizedField` ; le backoffice suit la langue courante. **Aucun texte affiché en dur** (JSX, `title`, `aria-label`, `confirm`…), backoffice et accès super admin compris ; une erreur d'infrastructure est un code que l'interface traduit. Détails et exemples : `docs/solution/produit.md` (§ Langues), `docs/solution/domaine.md` (§ shared), `docs/solution/interface.md` (§ Langues), `docs/solution/backoffice.md`.
- **Orientation multilingue validée (transitoire)** : à terme, registre centralisé des langues **en base** (ajout/activation/désactivation depuis le backoffice, sans modifier le schéma SQL, les composants ni les formulaires) et **tables de traduction relationnelles par entité réellement localisable** — jamais de JSON de persistance, d'EAV ni de table universelle de traductions ; les champs `<champ>_<langue>` embarqués et la liste `LANGUAGES` du core restent la convention **en vigueur** jusqu'à l'implémentation (ils deviennent transitoires). Référence : `docs/evolutions/experience-utilisateur/i18n-dynamique/evolution.md` ; l'adaptateur SQL de préparation en colonne `data` JSON est un écart architectural enregistré (voir point 9 du § Compatibilité permanente).
- **Workflow de validation** (`@/core/review`) : un contenu n'est **jamais écrit directement dans la collection publique** — l'éditeur enregistre dans l'atelier, la publication passe par la page de validation ; toute écriture de l'atelier passe le `written_at` de la copie dont elle part (jamais d'écrasement silencieux). Détails et exemples : `docs/solution/atelier-edition.md` et `docs/solution/backoffice.md`.
- **Catégories gérées** (`@/core/categories`, /admin › Catégories) : deux arbres en base, jamais une liste codée en dur hors des catégories d'origine des ingrédients ; une recette a plusieurs catégories, un ingrédient une seule ; le type de plat (`MealCategory`) reste un champ fixe à part. Détails et exemples : `docs/solution/domaine.md` (§ categories) et `docs/solution/backoffice.md`.
- **Public = validé seulement** : aucune recette intégrée au code n'est montrée au public (collection publique sans contenu de secours, serveur SEO compris) ; « Tout remettre à valider » (Données) retire tout du site jusqu'à la publication.
- Étapes de préparation : modifiables dans l'éditeur de recette (`RecipeStepsEditor`), validées par
  `validateRecipe` (au moins une étape en français, renumérotées à l'enregistrement).
- **Fenêtres** : toujours via `ModalShell` avec `onDismiss` **obligatoire** (clic en dehors et Échap ferment ; un éditeur demande avant de perdre une saisie) ; jamais de `fixed inset-0` directement dans une page, et une animation ne laisse aucune `transform` une fois finie. Détails et exemples : `docs/solution/interface.md`.
- **Prix et coûts en fourchette** (`src/core/catalog/pricing.ts`) : coût d'une recette calculé (`recipeCostRange`, via `getRecipeCost` / `useRecipeCost`), prix d'ingrédient `price_min_tnd` ≤ `price_max_tnd`, coût des courses manquantes = `PriceRange`, affichage toujours via `formatPriceRange` ; l'ancien `default_price_tnd` est converti à la lecture par `migrateIngredients` : ne plus l'utiliser. Détails : `docs/solution/domaine.md` (§ catalog).
- **Listes longues** : `usePagedList` + `ShowMore` (24 par page, suite au défilement) ; tout compteur utilise la liste complète (`total`), jamais le nombre affiché. Détails : `docs/solution/interface.md`.
- **Unités** (`@/core/units`) : masses et volumes se convertissent entre alias de la même famille (g ↔ kg, ml ↔ l), deux choses comptées différentes (pièce, botte, c.à.s) ne se mélangent jamais ; `addGroceryItems` **fusionne** dans une ligne existante un ajout en unité compatible (unités incompatibles = deux lignes) ; le registre des unités (`UnitInfo` avec `kind` obligatoire, /admin › Ingrédients › Unités) alimente la saisie (`useUnitOptions`, repli `BUILTIN_UNIT_OPTIONS`) et les descriptions — **aucune description par défaut dans le code**, une unité non configurée reste nue. Détails et exemples : `docs/solution/domaine.md` (§ units, § grocery), `docs/solution/donnees-sync.md` (synchronisation) et `docs/solution/backoffice.md`.
- **Courses** : plusieurs **listes nommées** (`GroceryList`, `@/core/grocery/lists.ts`), l'active affichée partout (getter de compat `kitchen.groceryList`) ; une section de sync unique `groceryLists` (`{ lists, activeId }`, dernier écrit gagnant) remplace les anciennes `groceryList` / `groceryMeta` (acceptées par le serveur, ignorées par le client) ; toute mutation passe par `KitchenStore` (`listId` facultatif) ; les ajouts depuis le frigo, la fiche recette ou le menu demandent la liste cible (`GroceryListChooserModal`) seulement quand l'utilisateur garde plusieurs listes. Détails : `docs/solution/interface.md` et `docs/solution/donnees-sync.md`.
- **Stock du frigo en entrées** (lot F1, `@/core/kitchen/entries`) : le frigo/placard persiste dans la section `stock` du document de cuisine (une enveloppe par entrée, id déterministe `st_<emplacement>_<ingrédient>`, tombstones HLC) ; les listes `fridge`/`pantry` ne sont qu'une projection de lecture (compatibilité des appareils anciens) ; un retrait ne vise qu'une seule entrée (cible déterministe, sinon la plus récente), le vidage d'un emplacement est une opération distincte, un ré-ajout crée une enveloppe nue ; la migration locale une fois utilise la même fonction du core que le serveur ; l'adoption du stock au pull se fait « pas plus ancien », les autres sections en « plus récent » strict ; plafonds dans `STOCK_LIMITS` du core, jamais de troncature silencieuse ; la sauvegarde inclut le stock. Détails : `docs/solution/donnees-sync.md` et `docs/evolutions/donnees-moteur/stock-entrees-sync/analyses/lot-F1-execution-dossier.md`.
- **Photo d'ingrédient** facultative (`image_url`, lien https saisi dans /admin, vérifié par
  `validateIngredient`) : toujours afficher un ingrédient avec `IngredientThumb` (`src/shared/ui/`), qui gère
  le cas sans photo (pastille de catégorie) et le lien cassé.
- Liens d'images et de vidéos saisis dans /admin : toujours avec un **aperçu en direct** de ce que verra
  le public (`RecipeMediaFields`, aperçu de l'éditeur d'ingrédient).
- **Formulaires du backoffice** (modèle : éditeur de recette) : `IngredientSearch` (jamais une liste déroulante de tout le catalogue), `NumberField`, `UnitInput`, sections + onglets de langue + barre d'enregistrement fixe, erreurs affichées sur leur champ, brouillon gardé (port `RecipeDraftRepository`) avec confirmation avant de le perdre. **Pages du backoffice** : une adresse par page (`BACKOFFICE_PAGES` / `ENGINE_PAGES` + `backofficePath()`), une nouvelle page = une entrée dans `BACKOFFICE_SECTIONS`, jamais un onglet ajouté à la main. **Sauvegarde JSON** : export = objets complets (toutes les langues et tous les champs), import toujours relu par `parseBackup`, tout nouveau champ conservé par `parseStoredRecipe` / `migrateIngredients` (test d'aller-retour dans `backup.test.ts`). Détails et exemples : `docs/solution/backoffice.md`, `docs/solution/domaine.md` (§ backup) et `docs/solution/atelier-edition.md`.
- Pas de nom affiché deux fois : un sous-titre dans une autre langue n'apparaît que s'il diffère du titre.
- Installation : toujours via `useInstallApp()` ; bandeau `InstallBanner` sous l'en-tête (dès la première page
  d'une visite, reste jusqu'à fermeture, revient à la visite suivante) + Réglages › Application. Application
  installée : aucune mention « installée », tout disparaît.
- Réglages en onglets courts (Affichage, Langue, Application) : un nouveau réglage va dans l'onglet qui lui
  correspond plutôt que d'allonger la fenêtre ; icône d'en-tête = roue dentée. **Affichage = mode seulement** :
  le thème est attribué par le backoffice, le client ne choisit que le mode (clair/sombre/système) ; le thème
  appliqué vient de `resolveTheme` (`@/application/theme`, pure) + défaut `src/app/themeConfig.ts`, complété à la
  lecture par `resolveThemeColors` ; le `themeId` des préférences n'est jamais source de sélection.
- **Identité de marque** : chaîne `src/app/brand.ts` (configuration transitoire) → `BrandMark` (props) ; aucune
  appellation en dur dans un composant du shell (garde `src/core/architecture.test.ts`) ; les 4 replis (logo absent,
  nom absent, ressource cassée, identité partielle) sont testés ; l'éditeur d'identité = lot CMS.
- En-tête mobile : la marque (identité résolue via `BrandMark`) doit rester lisible ; en mode super admin, le badge
  et « Quitter » sont dans Réglages › Application sur téléphone.
- Mobile : aucun élément ne doit élargir la page ; vérifier à 375 px et 320 px.
- **Comptes** : trois niveaux — client (formulaire), employé (créé par le super admin via le serveur, mot de passe temporaire), super admin (session serveur uniquement) ; téléphone **E.164** en un seul champ (`normalizePhone`) ; le champ `type` d'un profil vaut `client` ou `employee`, les variantes de clients sont des données ; aucun droit ne vient d'un e-mail écrit dans le code. **Création de compte atomique** : hash calculé avant toute écriture, puis `users/{uid}` + `auth/{uid}` + réservation `email_index/{email}` dans un seul `commit` gardé — l'unicité de l'adresse vient de la garde, jamais d'un seul pré-contrôle ; une suppression de compte devra libérer sa réservation. Détails et exemples : `docs/solution/comptes.md`.
- **Plateforme et SDK fournisseurs derrière des ports** (règle permanente) : `src/core` et `src/application` n'importent jamais un SDK fournisseur ni n'accèdent directement à la plateforme (`window`, `document`…) — la garde d'architecture le vérifie. Un SDK nécessaire vit dans un adaptateur d'`src/infrastructure` derrière un port remplaçable ; les API de l'hôte passent par le port `HostLifecycle` (adaptateur navigateur `src/infrastructure/host/`). Détails : `docs/solution/architecture.md`.
- **Composants des couches 1–2** (lot 2.6.2) : génériques dans `src/shared/ui` (aucun import du domaine),
  métier dans `src/features/<domaine>/components` (types du core uniquement, jamais de logique
  décisionnaire) ; un composant n'est extrait qu'avec un second consommateur réel. **Navigation
  découplée** : un composant générique n'importe jamais le routeur — il transmet `href` et rend un
  `<a href>` natif par défaut ; le consommateur React Router injecte un `LinkComponent` avec un
  adaptateur `href` → `to` dans son module (ex. `RecipeListTabs`). **Règle d'affichage du matching**
  : le moteur (`engine.ts`, `tiers.ts`) reste seul responsable du score et du tier ; `@/core/matching/display`
  ne fait que le mapping exhaustif tier → niveau d'affichage + **codes de raisons** ; la traduction est
  dans l'interface (`MatchingBadge`/`MatchReason`), jamais dans le core. **Un seul système de modales**
  : `Sheet` compose `ModalShell` + `useCloseOnBack`, jamais un second mécanisme. `EmptyState` : action
  exclusive (`href` ou `onClick`). `RecipeCard` : navigation par callback conservée (état `background`),
  coût en props, favori 44×44 px. Détails : `docs/solution/interface.md` (§ Composants partagés),
  `docs/solution/domaine.md` (§ matching).
- **Recherche texte** : toujours via `useSearchMatches` (port `SearchEngine`, store `CatalogSearch`) et la normalisation unique `normalizeSearchText` (`@/core/search`), jamais un `toLowerCase().includes()` ; sans réponse du moteur, l'ancien filtre par nom sert de repli. Détails et exemples : `docs/solution/recherche.md`.
- Deux listes de recettes séparées : `/recettes` = catalogue complet (`browseRecipes`), `/suggestions`
  = propositions du frigo par niveau (`matchRecipes`) ; onglets entre les deux (`RecipeListTabs`).
- Comportements à conserver : filtres de recettes gardés entre les écrans (et entre les deux listes) ;
  récapitulatif des ingrédients choisis en haut du frigo ; « appuyez encore pour quitter » sur
  l'accueil ; retour ferme les fenêtres ouvertes (`useCloseOnBack`) ; bouton « haut de page »
  (`ScrollToTopButton`, dans `AppLayout`, au-dessus de la barre collante du frigo).
- **URLs et endpoints tous en anglais** : les pages publiques sont `/`, `/fridge`, `/recipes`, `/recipe/:slug`,
  `/suggestions`, `/planner`, `/grocery`, `/admin` (l'ancienne adresse `/patron` redirige encore le temps d'une
  version) ; les endpoints du backoffice vivent sous **`/admin/api/*`**,
  les endpoints publics sous **`/api/*`** (`/api/vision/scan-fridge`, `/api/health`). **Aucune URL complète n'est
  écrite ailleurs que dans `src/shared/paths.ts`** (constantes `PATHS`, carte `LEGACY_PATHS` des adresses de
  l'époque française, qui répondent en **301** — pages et `/recette/:slug` — pour transférer le référencement) ;
  partout ailleurs, passer par `PATHS.*` / `recipePath()`.
- Code et commentaires en anglais ; documentation en français.

## Gestion des fichiers et éléments temporaires (règle permanente)

Ne jamais intégrer de fichiers temporaires, de scripts de diagnostic ponctuels, de fichiers de
reproduction, de données de test provisoires ou d'autres éléments temporaires dans les livrables,
les commits ou les branches destinés à être conservés.

Tout élément temporaire créé ou utilisé pendant une évolution doit :

1. Être clairement identifié comme temporaire dès sa création.
2. Rester isolé du code et des livrables permanents.
3. Être supprimé dès que son utilisation est terminée et que les vérifications nécessaires sont
   achevées.
4. Faire l'objet d'une vérification avant chaque finalisation : aucun fichier temporaire résiduel
   ne doit être intégré par erreur.

Cette règle concerne notamment les scripts de diagnostic, fichiers `tmp-*`, tests ponctuels de
reproduction, sorties générées, rapports provisoires et répertoires temporaires.

**Avant toute finalisation, staging ou commit**, vérifier explicitement :

- qu'aucun fichier temporaire ou résiduel n'est inclus ;
- que les fichiers temporaires dont l'utilisation est terminée ont été supprimés ;
- que les éléments conservés sont réellement nécessaires et destinés à faire partie du projet.

Si un élément temporaire doit exceptionnellement être conservé pour une raison justifiée, demander
une validation explicite avant de l'intégrer.

Cette règle s'applique à toutes les évolutions futures ; le périmètre d'autorisation de l'étape en
cours reste maître pour l'inventaire et la suppression des fichiers temporaires déjà présents dans
le dépôt.

## Campagnes de validation et preuves (règle permanente)

Chaque campagne de tests produit un **rapport distinct, daté et contextualisé** (état du code,
commande exécutée, environnement, résultat, exclusions éventuelles) ; une nouvelle campagne
**n'écrase jamais** une preuve antérieure (incident X-14 du 25/11/2026 : un rapport écrasé est
une preuve historique perdue). Les sorties brutes vivent dans `.vitest/audit-<objet>-<date>/`
(ignoré par Git) ; les preuves destinées à être conservées durablement sont archivées dans le
dossier `preuves/` de l'évolution concernée. Avant et après chaque campagne, vérifier
l'existence du rapport attendu.

## Organisation documentaire

- **Deux familles de documents** : `docs/solution/` = référence en vigueur (métier, architecture,
  interface…) ; `docs/evolutions/<famille>/<évolution>/` = dossier d'évolution (`evolution.md`
  autonome au squelette normalisé + `analyses/` verbatim avec provenance + `preuves/`). Un contenu
  n'existe qu'à un seul endroit : extraction avec provenance, jamais de copie sans transfert.
- **Création / fusion / scission** : un dossier d'évolution est créé pour un travail définissable
  (périmètre, dépendances, livrables) ; un travail insuffisamment défini reste une ligne de
  `roadmap.md` ; toute fusion/scission de dossiers est consignée dans la roadmap.
- **Statuts — 5 dimensions indépendantes, jamais linéaires ni extrapolées** : (1) décision acceptée ;
  (2) code présent (lecture directe du fichier dans l'arbre de travail ou l'arbre Git) ; (3) tests
  exécutés ; (4) code commité (commit identifié, vérifié) ; (5) fonctionnalité livrée et en vigueur
  (réservée à un environnement nommé et vérifié). Le push Git est une information de traçabilité
  supplémentaire (commit présent dans les refs distantes), jamais une dimension ni une livraison.
  **Un `git status` propre ne prouve pas l'absence de code** : le code peut être présent et commité ;
  inversement `git status` ne prouve jamais la présence d'un fichier.
- **Entretien documentaire** : mettre à jour le document métier ou technique concerné (`solution/` ou
  `evolutions/`) ; mettre à jour `roadmap.md` lorsque l'état, les décisions ou les dépendances
  évoluent ; mettre à jour `CLAUDE.md` uniquement lorsque les conventions, règles de travail,
  procédures ou références générales changent. Exécuter les contrôles de validation prévus par le
  projet avant tout commit ; utiliser `npm run check` uniquement si cette commande est définie et
  adaptée au périmètre modifié.
- **Qualification vérifiée avant écriture** : tout statut inscrit est appuyé par la preuve
  correspondante (lecture du fichier, exécution de tests, commit identifié, environnement vérifié) —
  jamais par déduction.
- **Traçabilité systématique des évolutions (règle permanente)** : chaque analyse importante, chaque
  constat technique significatif, chaque décision ou arbitrage est consigné **au fil des travaux**
  dans la documentation de l'évolution concernée (squelette normalisé du dossier) — jamais laissée
  uniquement dans la conversation. Sont conservés : les justifications des décisions, leurs
  conséquences, les dépendances, les points ouverts, les résultats **réels** des implémentations,
  tests et validations (statuts de l'échelle à 5 dimensions), et un état d'avancement fiable
  permettant de reprendre l'évolution ultérieurement sans perdre son contexte. Une décision ou une
  analyse qui n'existe que dans un échange n'est pas archivée : sa retranscription (avec provenance
  et statuts exacts) est un travail distinct à réaliser et à consigner ; aucune proposition n'est
  présentée comme une décision, aucune décision comme une implémentation, aucun test réussi comme
  la démonstration de toutes les garanties attendues.

## Git

Détails : `docs/solution/qualite-tests.md` (« Branches et versions »).

### Convention officielle des branches (validée par le chef)

Tous les noms de branches sont en **anglais**, explicites et significatifs, en kebab-case.

| Branche | Rôle |
|---|---|
| `master` | Branche de référence contenant les versions stables et validées du projet (production). **Décision du chef : `master` reste la branche de production — aucun renommage en `main`, aucune migration.** |
| `develop` | Branche centrale d'intégration des évolutions validées. |
| `release/<meaningful-name>` | Ensemble cohérent d'évolutions destiné à constituer un jalon du projet. |
| `feature/<meaningful-name>` | Développement d'une nouvelle fonctionnalité ou évolution technique. |
| `fix/<meaningful-name>` | Correction d'un bug identifié. |
| `docs/<meaningful-name>` | Travail documentaire indépendant (restructuration, évolution générale de la documentation). |

Exemples : `release/synchronization-foundation`, `feature/stock-sync`, `feature/datastore-contract`,
`feature/multi-device-sync`, `fix/recipe-quantity-validation`, `docs/structure`.

**Branches de travail**

- Les branches `feature/*`, `fix/*` et `docs/*` sont créées à partir de `develop` à jour
  (`git checkout develop && git pull`).
- Chaque branche doit avoir un **périmètre précis et une évolution identifiable** ; chaque branche
  est associée à une évolution documentée (`docs/evolutions/`).
- Une évolution n'est intégrée dans `develop` qu'après vérification de son périmètre, de ses tests,
  de sa documentation et de ses critères d'acceptation (`npm run check` vert, push, PR **vers
  `develop`** ; branche supprimée après fusion).
- **Stratégie de fusion des chaînes de commits préservées (règle permanente)** : quand des PR
  successives partagent une ascendance de commits conservés (chaîne linéaire découpée par
  évolution), la fusion doit **préserver les commits d'origine et leur relation d'ascendance** —
  **merge commit, systématiquement**. **« Squash and merge » et « Rebase and merge » sont
  interdits sur ces PR** : ils aplatissent ou réécrivent les commits et cassent la garantie
  selon laquelle chaque PR suivante ne présente que son propre segment. Avant chaque fusion,
  vérifier que la PR ne contient que son évolution et que son intégration préservera l'ascendance
  nécessaire à la PR suivante ; **chaque fusion fait l'objet d'un contrôle distinct**. Les PR
  isolées (une seule branche, ascendance déjà intégrée) restent libres de stratégie.
- `chore` est un **type de commit** (outillage, configuration sans évolution fonctionnelle),
  **pas une famille de branches officielle** : une branche de travail porte toujours un nom de
  famille (`feature/*`, `fix/*`, `docs/*`), même si ses commits utilisent le préfixe `chore:`.

**Branches release**

- Une branche `release/*` représente un **jalon cohérent** du projet ; elle est créée à partir de
  `develop`, après vérification du contenu qui sera intégré, et regroupe les évolutions retenues
  pour ce jalon.
- Une release crée depuis `develop` reprend les évolutions déjà présentes dans cette branche — ce
  n'est **pas** une sélection arbitraire ; si une release doit exclure des évolutions déjà
  intégrées dans `develop`, une stratégie spécifique est proposée et **validée avant toute
  opération**.
- Une release fait l'objet de contrôles d'intégration et de validation avant sa fusion dans
  `master` (PR obligatoire). Les corrections effectuées sur une release sont **réintégrées dans
  `develop`** pour éviter les divergences.
- Une release validée est fusionnée dans `master`, puis tag annoté sur `master`
  (`git tag -a vX.Y.Z -m "..."` + `git push origin vX.Y.Z`) ; semver : majeur = rupture,
  mineur = features, patch = corrections.

**Branche master**

- `master` est la référence de production ; **aucun développement courant** ne s'y effectue
  directement, **jamais** de commit direct ni de PR vers `master`, sauf release ou hotfix.
- `master` et `develop` sont protégées : passage obligatoire par une PR.
- (Décision du chef : le renommage antérieur `main` → `master` est définitif ; aucune migration
  `master` → `main` n'est prévue.)

**Branche develop**

- `develop` est la branche d'intégration (branche par défaut sur GitHub) et contient tous les
  développements validés.

**Traçabilité**

- Chaque branche est associée à une évolution documentée ; les merges sont traçables (PRs).
- Les décisions, résultats de tests, contrôles et validations importants sont consignés dans la
  documentation de l'évolution concernée — cette règle **complète** la règle documentaire de
  `CLAUDE.md` (traçabilité systématique des évolutions) ; elle ne la remplace pas.
- Hotfix urgent en production : `hotfix/<nom>` depuis `master`, PR vers `master`, tag patch, puis
  **réintégration obligatoire de `master` dans `develop`** pour éviter les divergences
  (exception conservée aux familles de branches de travail).
- Messages de commit **en anglais**, courts, décrivant le changement. Pas de mention d'outil d'IA
  ni de ligne `Co-Authored-By`.
- Ne jamais commiter `.env` ni de compte de service.
