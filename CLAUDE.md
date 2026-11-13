# CLAUDE.md

Chnowa Ntayeb by Chef Souhed : PWA culinaire tunisienne (React 19 + Vite + Tailwind 4,
react-router 7, Express, Firebase). Documentation complète : `docs/encyclopedie/` (commencer par
`README.md`).

## Commandes

- `npm run dev` : serveur de développement (http://localhost:3000)
- `npm run check` : types + lint (oxlint) + formatage (Prettier) + tests (Vitest). **Doit passer avant tout commit.**
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`
- `npm run diagnose:matching` : rapport du moteur de suggestions sur des frigos types
- `npm run deploy:rules` (après `npm run firebase:login`) : déploie `firestore.rules`

## Réflexes de conception (chaque évolution, chaque brique)

Valables pour toutes les données et briques (recettes, ingrédients, thèmes, scénarios, réglages, planning,
courses, textes, comptes), pas seulement les recettes. Chaque plan dit en une ligne comment il respecte chaque point.

1. **Évolutif et performant** : la solution doit tenir avec des milliers d'éléments, puis bien plus. Coût en lectures
   de la base maîtrisé ; synchronisation incrémentale (`updated_at` + marques de suppression), jamais de relecture
   complète à chaque ouverture ; IndexedDB pour les gros volumes ; listes affichées par pages avec des **totaux
   justes** (compteurs calculés sur le résultat complet, jamais sur la page affichée) ; pas de calcul lourd ni de
   rendu d'une liste entière d'un coup.
2. **Organisé et maintenable** : architecture hexagonale respectée, une responsabilité par module, noms clairs.
3. **Factorisé, sans duplication** : un mécanisme générique réutilisé par toutes les collections plutôt qu'une
   copie par type de données.
4. **Sûr** : règles de la base au plus strict, toute donnée externe relue par le core, aucun secret côté client,
   pas d'injection (HTML, liens), droits patron vérifiés côté serveur et base.
5. **Agréable** : retour immédiat, états de chargement et d'erreur clairs, mobile 320 px, fenêtres qui se ferment
   comme attendu, aucune perte de saisie.

## Architecture (hexagonale) — règles à respecter

Détails : `docs/encyclopedie/02-architecture.md`. Vérifiées par `src/core/architecture.test.ts`.

- `src/core` : domaine en TypeScript **pur** (aucun React, Firebase, `window`, `localStorage`, `fetch`).
  Importer un module uniquement par son `index.ts` (`@/core/matching`), jamais un fichier interne.
- `src/application` : stores observables sans React + ports (`ports.ts`). N'importe que `src/core`.
- `src/infrastructure` : adapters (localStorage, Firebase, API HTTP). Jamais de React.
- `src/features`, `src/shared`, `src/app` : interface. **N'importent jamais `src/infrastructure` ni Firebase.**
- `src/app/container.ts` : le seul endroit qui relie ports et adapters.
- Serveur : `server/app.ts` reçoit ses dépendances ; l'IA passe par `VisionProvider`.

## Checklist de chaque évolution (obligatoire)

Toute évolution suit ce chemin, couche par couche ; ne pas sauter d'étape ni court-circuiter une couche.

1. **Règle métier / validation** → `src/core/<module>`, TypeScript pur, exportée par `index.ts`, avec son
   `*.test.ts` à côté. Horloge, aléatoire et ids injectés. Toute donnée externe (base, fichier importé)
   est relue par une fonction de validation du core (`resolveMatchingConfig`, `parseScenario`…) ; ce que le
   patron saisit est vérifié avant l'enregistrement (`validateRecipe`, `validateIngredient`).
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
   chaque ouverture (voir `docs/encyclopedie/05-application-donnees.md`).
4. **Spécificités de la base actuelle** (Firestore : règles `firestore.rules`, `npm run deploy:rules`,
   transactions, ordre, ids) → restent dans l'adapter et sa configuration, jamais dans le domaine,
   les stores ou l'interface.
5. **Interface** → `src/features/<écran>`, sans logique métier, n'importe jamais `src/infrastructure` ni
   un SDK de base, et ne nomme jamais la base dans ses textes ; fenêtres avec `ModalShell` + `useCloseOnBack` ;
   vérifiée à 375 px et 320 px ; textes dans toutes les langues et variantes (`LANGUAGES`), backoffice compris (il suit la langue courante).
6. **JSON** uniquement pour exporter / restaurer, jamais comme source de données de l'application.
7. **Documentation** : après chaque évolution, mettre à jour `docs/encyclopedie/` **et ce `CLAUDE.md`**
   (conventions, comportements à conserver, commandes) avec ce qui a changé, puis `npm run check` vert
   avant le commit.

### Changer de base de données

Aucun nom de base n'apparaît hors de `src/infrastructure` et `src/app/container.ts` (vérifié par
`src/core/architecture.test.ts`). Changer de base = écrire de nouveaux adapters dans
`src/infrastructure/<nouvelle-techno>/`, leur faire passer les tests de contrat, puis remplacer les
adapters dans `src/app/container.ts`. Domaine, stores et écrans ne changent pas.

## Conventions

- Pas de duplication : une règle métier vit à un seul endroit dans `src/core`, avec ses tests à côté (`*.test.ts`).
- Domaine pur : horloge, aléatoire et ids injectés.
- Composants sans logique métier ; un écran = un dossier dans `src/features`.
- **Base de données d'abord** : données partagées et réglages en Firestore ; localStorage seulement
  comme copie hors ligne ; fichiers JSON seulement pour exporter / restaurer.
- Moteur de matching : tout réglage passe par `MatchingConfig` + `resolveMatchingConfig` ; une
  suggestion jugée fausse devient d'abord un scénario du chef, créé dans /patron › Moteur (stocké
  en base, collection `matching_scenarios` ; aucune liste de scénarios dans le code).
- Nouvelle adresse : `src/shared/paths.ts` + `src/app/AppRoutes.tsx` + si elle est publique, sa page serveur dans
  `SCREENS` (`server/seo.ts`) : les robots qui ne lancent pas le JavaScript doivent voir son contenu (copie lisible
  dans `fallback`, masquée aux visiteurs, listes par pages de 100).
- Gestion du catalogue (ajout / modification d'ingrédients, de recettes, de prix) **réservée au patron**
  dans `/patron` : aucun formulaire de création dans l'interface publique.
- **Langues et variantes** : une seule liste, `LANGUAGES` (`@/core/shared`) : français (référence), arabe
  littéraire, derja en lettres latines (3, 7, 9), derja en lettres arabes (`derja_ar`) ; la derja est une
  variante de la famille arabe. Chaque entrée donne sens d'écriture, `lang`, tri et **ordre de repli**.
  Ajouter une langue ou une variante = une entrée dans `LANGUAGES` + ses textes d'interface (une variante
  ne liste que ce qui diffère de sa famille, ex. `src/shared/i18n/derjaArabic.ts`) : affichage, éditeurs,
  sauvegarde et recherche la prennent en compte sans autre changement.
- Textes affichés dans toutes les langues (`src/shared/i18n/translations.ts`). **Le backoffice suit la langue
  courante** comme le reste du site : contenu, onglet de saisie et libellés, lus dans
  `src/features/backoffice/i18n/backofficeTexts.ts` par `useBackofficeText()` (tout nouveau libellé du
  backoffice va dans ce dictionnaire, dans toutes les langues ; les panneaux pas encore passés restent en
  français).
- **Contenu multilingue** (noms, descriptions, étapes, astuce du chef, noms d'ingrédients) : champs
  `<champ>_<langue>` (`name_derja_ar`…), lus et écrits par `localizedField` / `withLocalizedField`
  (`@/core/shared`), jamais un triplet `{ fr: x.name_fr, … }` écrit à la main ; les variantes récentes sont
  facultatives (vides = absentes). Modifiable dans /patron dans toutes les langues et variantes avec
  `LocalizedField` (`src/features/backoffice/ui/`) ; affiché via
  `pickLocalized` (`@/core/shared`, à travers les aides de `LanguageContext` : `getRecipeName`,
  `getIngredientName`, `getSecondaryName`, `compareNames`), jamais `name_fr` affiché directement (backoffice
  compris) ni un ordre de langues codé en dur. Catégories : `useIngredientCategories` (`src/shared/i18n`).
  L'éditeur de recette s'ouvre sur l'onglet de la langue courante. Le français est la langue de référence
  (une langue vide → sa liste de repli, le français en dernier).
- **Workflow de validation** (`@/core/review`, plan : `docs/encyclopedie/14-refonte-backoffice.md`) :
  un nouveau type de contenu validé = ses parties (`parts.ts`) + ses contrôles (`rules.ts`) + son workflow
  par défaut ; une case de texte par langue (jamais une empreinte qui mélange les langues) ; tout
  workflow ou rôle lu de la base passe par `resolveWorkflow` / `resolveRoles`, tout workflow modifié par
  `validateWorkflow`. Atelier : `ReviewBoard` / `ReviewStore` (`src/application/review/`), collections
  `<collection>_workspace` et `<collection>_versions` ; une publication écrit version publique, copie de
  travail et version **dans la même transaction** ; toute écriture de l'atelier passe le `written_at` de
  la copie dont elle part (jamais d'écrasement silencieux). **Une recette n'est jamais écrite directement
  dans la collection publique** : l'éditeur enregistre dans l'atelier (`useReview('recipe').store.save`),
  la publication passe par la page de validation (`/patron/recettes/<id>`). **De même pour les
  ingrédients** (`useIngredientEditor`, `/patron/ingredients/<id>`). Rôles : une page du backoffice
  réservée à un droit le déclare (`requires` dans `BACKOFFICE_SECTIONS`) ; toute écriture publique
  passe par `canPublish()` dans `firestore.rules`, la gestion (workflows, rôles, équipe) par
  `canManage()` ; les droits d'un membre sont recopiés sur sa fiche `admins/{uid}`
  (`TeamStore.refreshRights` après chaque changement de rôle). Libellés de la validation :
  `backofficeTexts` (`review…`, `part…`, `state…`, `item…`, `filter…`, `rule…`).
- Étapes de préparation : modifiables dans l'éditeur de recette (`RecipeStepsEditor`), validées par
  `validateRecipe` (au moins une étape en français, renumérotées à l'enregistrement).
- **Fenêtres** : toujours via `ModalShell` (`src/shared/ui/ModalShell.tsx`, portail sur `<body>`), avec `onDismiss`
  **obligatoire** (clic en dehors et Échap ferment ; un éditeur demande avant de perdre une saisie,
  `useGuardedClose`) ; jamais de
  `fixed inset-0` directement dans une page (une page animée ou floutée le capture : fenêtre hors écran, écran
  gris). Une animation ne laisse aucune `transform` une fois finie.
- **Coût d'une recette = fourchette** calculée (`recipeCostRange`, via `getRecipeCost` / `useRecipeCost` qui
  la gardent en cache) et affichée avec `formatPriceRange` ; `estimated_cost_tnd` n'est qu'un secours.
- **Listes longues** : `usePagedList` + `ShowMore` (24 par page, suite au défilement) ; tout compteur utilise
  la liste complète (`total`), jamais le nombre affiché.
- **Prix d'ingrédient = fourchette** (`price_min_tnd` ≤ `price_max_tnd`, aides `src/core/catalog/pricing.ts`,
  coût des courses manquantes = `PriceRange`) ; affichage toujours via `formatPriceRange`
  (`src/shared/i18n/formatPrice.ts`). Un ancien `default_price_tnd` est converti à la lecture par
  `migrateIngredients` : ne plus l'utiliser.
- **Photo d'ingrédient** facultative (`image_url`, lien https saisi dans /patron, vérifié par
  `validateIngredient`) : toujours afficher un ingrédient avec `IngredientThumb` (`src/shared/ui/`), qui gère
  le cas sans photo (pastille de catégorie) et le lien cassé.
- Liens d'images et de vidéos saisis dans /patron : toujours avec un **aperçu en direct** de ce que verra
  le public (`RecipeMediaFields`, aperçu de l'éditeur d'ingrédient).
- **Formulaires du backoffice** (modèle : éditeur de recette) : choisir un ingrédient avec
  `IngredientSearch` (jamais une liste déroulante de tout le catalogue) ; nombres avec `NumberField`,
  unités avec `UnitInput` ; long formulaire = sections avec raccourcis + onglets de langue
  (`EditorLanguageProvider`) + barre d'enregistrement fixe ; erreurs de validation avec leur `field`,
  affichées sur le champ ; modifications non enregistrées gardées en brouillon (port
  `RecipeDraftRepository`) et confirmation avant de les perdre. Tout ce qui vient de l'extérieur est relu par
  `parseStoredRecipes` / `parseStoredIngredients`. Libellés : `useBackofficeText()`.
- **Pages du backoffice** : une adresse par page (`PATRON_PAGES` / `ENGINE_PAGES` + `patronPath()` dans
  `src/shared/paths.ts`) ; une nouvelle page = une entrée dans `BACKOFFICE_SECTIONS`
  (`src/features/backoffice/shell/sections.tsx`), jamais un onglet ajouté à la main. Messages avec
  `useNotify()`, éditeur de recette avec `useRecipeEditor()`, actions du catalogue avec `useAdmin()`.
  Refonte et workflow de validation : `docs/encyclopedie/14-refonte-backoffice.md`.
- **Sauvegarde JSON** : export = objets complets (toutes les langues et tous les champs) ; import toujours
  relu par `parseBackup` (`@/core/backup`). Tout nouveau champ d'une recette ou d'un ingrédient doit être
  conservé par `parseStoredRecipe` / `migrateIngredients` (test d'aller-retour dans `backup.test.ts`).
- Pas de nom affiché deux fois : un sous-titre dans une autre langue n'apparaît que s'il diffère du titre.
- Installation : toujours via `useInstallApp()` ; bandeau `InstallBanner` sous l'en-tête (dès la première page
  d'une visite, reste jusqu'à fermeture, revient à la visite suivante) + Réglages › Application. Application
  installée : aucune mention « installée », tout disparaît.
- Réglages en onglets courts (Affichage, Langue, Application) : un nouveau réglage va dans l'onglet qui lui
  correspond plutôt que d'allonger la fenêtre ; icône d'en-tête = roue dentée.
- En-tête mobile : la marque « Chnowa Ntayeb / by Chef Souhed » doit rester lisible ; en mode patron, le badge
  et « Quitter » sont dans Réglages › Application sur téléphone.
- Mobile : aucun élément ne doit élargir la page ; vérifier à 375 px et 320 px.
- **Recherche texte** : toujours via `useSearchMatches` (port `SearchEngine`, store `CatalogSearch`) ;
  normalisation unique `normalizeSearchText` (`@/core/search`), jamais un `toLowerCase().includes()` ;
  sans réponse du moteur, l'ancien filtre par nom sert de repli. Un nouveau champ texte localisé
  (`<champ>_<langue>`) est indexé automatiquement. Détails : `docs/encyclopedie/12-recherche.md`.
- Deux listes de recettes séparées : `/recettes` = catalogue complet (`browseRecipes`), `/suggestions`
  = propositions du frigo par niveau (`matchRecipes`) ; onglets entre les deux (`RecipeListTabs`).
- Comportements à conserver : filtres de recettes gardés entre les écrans (et entre les deux listes) ;
  récapitulatif des ingrédients choisis en haut du frigo ; « appuyez encore pour quitter » sur
  l'accueil ; retour ferme les fenêtres ouvertes (`useCloseOnBack`) ; bouton « haut de page »
  (`ScrollToTopButton`, dans `AppLayout`, au-dessus de la barre collante du frigo).
- Code et commentaires en anglais ; documentation en français.

## Git

Détails : `docs/encyclopedie/09-qualite-tests.md` (« Branches et versions »).

- `master` = production. **Jamais** de commit direct ni de PR vers `master`, sauf release ou hotfix.
- `develop` = branche d'intégration (branche par défaut sur GitHub), contient tous les développements validés.
  `master` et `develop` sont protégées : passage obligatoire par une PR.
- **Chaque nouvelle demande** part de `develop` à jour (`git checkout develop && git pull`) sur une nouvelle branche :
  `feature/<nom-court>` (évolution), `fix/<nom-court>` (correction), `docs/<nom>` ou `chore/<nom>`
  (documentation, outillage). Noms en anglais, en kebab-case (`feature/grocery-export`).
- `npm run check` vert, push, puis PR **vers `develop`** ; branche supprimée après fusion.
- Release : quand une version est validée, PR `develop` → `master`, puis tag annoté sur `master`
  (`git tag -a vX.Y.Z -m "..."` + `git push origin vX.Y.Z`) ; semver : majeur = rupture, mineur = features,
  patch = corrections.
- Hotfix urgent en production : `hotfix/<nom>` depuis `master`, PR vers `master`, tag patch, puis fusion de `master`
  dans `develop`.
- Messages de commit **en anglais**, courts, décrivant le changement. Pas de mention d'outil d'IA
  ni de ligne `Co-Authored-By`.
- Ne jamais commiter `.env` ni de compte de service.
