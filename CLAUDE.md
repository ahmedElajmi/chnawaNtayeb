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
Détails et exemples : `docs/encyclopedie/02-architecture.md` (vérifiés par `src/core/architecture.test.ts`).

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

Nouveaux adapters dans `src/infrastructure/<nouvelle-techno>/` qui passent les tests de contrat, branchés dans
`src/app/container.ts` : domaine, stores et écrans ne changent pas. Détails et exemples :
`docs/encyclopedie/11-guides-pratiques.md` (§ « Changer de base de données »).

## Conventions

- Pas de duplication : une règle métier vit à un seul endroit dans `src/core`, avec ses tests à côté (`*.test.ts`).
- Domaine pur : horloge, aléatoire et ids injectés.
- Composants sans logique métier ; un écran = un dossier dans `src/features`.
- **Base de données d'abord** : données partagées et réglages en Firestore ; localStorage seulement
  comme copie hors ligne ; fichiers JSON seulement pour exporter / restaurer.
- Moteur de matching : tout réglage passe par `MatchingConfig` + `resolveMatchingConfig` ; une
  suggestion jugée fausse devient d'abord un scénario du chef, créé dans /admin › Moteur (stocké
  en base, collection `matching_scenarios` ; aucune liste de scénarios dans le code).
- Nouvelle adresse : `src/shared/paths.ts` + `src/app/AppRoutes.tsx` + si elle est publique, sa page serveur dans
  `SCREENS` (`server/seo.ts`) : les robots qui ne lancent pas le JavaScript doivent voir son contenu (copie lisible
  dans `fallback`, masquée aux visiteurs, listes par pages de 100).
- Gestion du catalogue (ajout / modification d'ingrédients, de recettes, de prix) **réservée au super admin**
  dans `/admin` : aucun formulaire de création dans l'interface publique.
- **Langues et variantes** : une seule liste `LANGUAGES` (`@/core/shared`) — français (référence), arabe littéraire, derja latine (3, 7, 9), derja arabe (`derja_ar`) — et contenu multilingue en champs `<champ>_<langue>` lus via `pickLocalized` / `localizedField` ; le backoffice suit la langue courante. **Aucun texte affiché en dur** (JSX, `title`, `aria-label`, `confirm`…), backoffice et accès super admin compris ; une erreur d'infrastructure est un code que l'interface traduit. Détails et exemples : `docs/encyclopedie/01-produit.md` (§ Langues), `03-domaine.md` (§ shared), `06-interface.md` (§ Langues), `07-backoffice.md`.
- **Workflow de validation** (`@/core/review`) : un contenu n'est **jamais écrit directement dans la collection publique** — l'éditeur enregistre dans l'atelier, la publication passe par la page de validation ; toute écriture de l'atelier passe le `written_at` de la copie dont elle part (jamais d'écrasement silencieux). Détails et exemples : `docs/encyclopedie/14-refonte-backoffice.md` et `07-backoffice.md`.
- **Catégories gérées** (`@/core/categories`, /admin › Catégories) : deux arbres en base, jamais une liste codée en dur hors des catégories d'origine des ingrédients ; une recette a plusieurs catégories, un ingrédient une seule ; le type de plat (`MealCategory`) reste un champ fixe à part. Détails et exemples : `docs/encyclopedie/03-domaine.md` (§ categories) et `07-backoffice.md`.
- **Public = validé seulement** : aucune recette intégrée au code n'est montrée au public (collection publique sans contenu de secours, serveur SEO compris) ; « Tout remettre à valider » (Données) retire tout du site jusqu'à la publication.
- Étapes de préparation : modifiables dans l'éditeur de recette (`RecipeStepsEditor`), validées par
  `validateRecipe` (au moins une étape en français, renumérotées à l'enregistrement).
- **Fenêtres** : toujours via `ModalShell` avec `onDismiss` **obligatoire** (clic en dehors et Échap ferment ; un éditeur demande avant de perdre une saisie) ; jamais de `fixed inset-0` directement dans une page, et une animation ne laisse aucune `transform` une fois finie. Détails et exemples : `docs/encyclopedie/06-interface.md`.
- **Prix et coûts en fourchette** (`src/core/catalog/pricing.ts`) : coût d'une recette calculé (`recipeCostRange`, via `getRecipeCost` / `useRecipeCost`), prix d'ingrédient `price_min_tnd` ≤ `price_max_tnd`, coût des courses manquantes = `PriceRange`, affichage toujours via `formatPriceRange` ; l'ancien `default_price_tnd` est converti à la lecture par `migrateIngredients` : ne plus l'utiliser. Détails : `docs/encyclopedie/03-domaine.md` (§ catalog).
- **Listes longues** : `usePagedList` + `ShowMore` (24 par page, suite au défilement) ; tout compteur utilise la liste complète (`total`), jamais le nombre affiché. Détails : `docs/encyclopedie/06-interface.md`.
- **Unités** (`@/core/units`) : masses et volumes se convertissent entre alias de la même famille (g ↔ kg, ml ↔ l), deux choses comptées différentes (pièce, botte, c.à.s) ne se mélangent jamais ; `addGroceryItems` **fusionne** dans une ligne existante un ajout en unité compatible (unités incompatibles = deux lignes) ; le registre des unités (`UnitInfo` avec `kind` obligatoire, /admin › Ingrédients › Unités) alimente la saisie (`useUnitOptions`, repli `BUILTIN_UNIT_OPTIONS`) et les descriptions — **aucune description par défaut dans le code**, une unité non configurée reste nue. Détails et exemples : `docs/encyclopedie/03-domaine.md` (§ units, § grocery), `05-application-donnees.md` (synchronisation) et `07-backoffice.md`.
- **Courses** : plusieurs **listes nommées** (`GroceryList`, `@/core/grocery/lists.ts`), l'active affichée partout (getter de compat `kitchen.groceryList`) ; une section de sync unique `groceryLists` (`{ lists, activeId }`, dernier écrit gagnant) remplace les anciennes `groceryList` / `groceryMeta` (acceptées par le serveur, ignorées par le client) ; toute mutation passe par `KitchenStore` (`listId` facultatif) ; les ajouts depuis le frigo, la fiche recette ou le menu demandent la liste cible (`GroceryListChooserModal`) seulement quand l'utilisateur garde plusieurs listes. Détails : `docs/encyclopedie/06-interface.md` et `05-application-donnees.md`.
- **Photo d'ingrédient** facultative (`image_url`, lien https saisi dans /admin, vérifié par
  `validateIngredient`) : toujours afficher un ingrédient avec `IngredientThumb` (`src/shared/ui/`), qui gère
  le cas sans photo (pastille de catégorie) et le lien cassé.
- Liens d'images et de vidéos saisis dans /admin : toujours avec un **aperçu en direct** de ce que verra
  le public (`RecipeMediaFields`, aperçu de l'éditeur d'ingrédient).
- **Formulaires du backoffice** (modèle : éditeur de recette) : `IngredientSearch` (jamais une liste déroulante de tout le catalogue), `NumberField`, `UnitInput`, sections + onglets de langue + barre d'enregistrement fixe, erreurs affichées sur leur champ, brouillon gardé (port `RecipeDraftRepository`) avec confirmation avant de le perdre. **Pages du backoffice** : une adresse par page (`BACKOFFICE_PAGES` / `ENGINE_PAGES` + `backofficePath()`), une nouvelle page = une entrée dans `BACKOFFICE_SECTIONS`, jamais un onglet ajouté à la main. **Sauvegarde JSON** : export = objets complets (toutes les langues et tous les champs), import toujours relu par `parseBackup`, tout nouveau champ conservé par `parseStoredRecipe` / `migrateIngredients` (test d'aller-retour dans `backup.test.ts`). Détails et exemples : `docs/encyclopedie/07-backoffice.md`, `03-domaine.md` (§ backup) et `14-refonte-backoffice.md`.
- Pas de nom affiché deux fois : un sous-titre dans une autre langue n'apparaît que s'il diffère du titre.
- Installation : toujours via `useInstallApp()` ; bandeau `InstallBanner` sous l'en-tête (dès la première page
  d'une visite, reste jusqu'à fermeture, revient à la visite suivante) + Réglages › Application. Application
  installée : aucune mention « installée », tout disparaît.
- Réglages en onglets courts (Affichage, Langue, Application) : un nouveau réglage va dans l'onglet qui lui
  correspond plutôt que d'allonger la fenêtre ; icône d'en-tête = roue dentée.
- En-tête mobile : la marque « Chnowa Ntayeb / by Chef Souhed » doit rester lisible ; en mode super admin, le badge
  et « Quitter » sont dans Réglages › Application sur téléphone.
- Mobile : aucun élément ne doit élargir la page ; vérifier à 375 px et 320 px.
- **Comptes** : trois niveaux — client (formulaire), employé (créé par le super admin via le serveur, mot de passe temporaire), super admin (session serveur uniquement) ; téléphone **E.164** en un seul champ (`normalizePhone`) ; le champ `type` d'un profil vaut `client` ou `employee`, les variantes de clients sont des données ; aucun droit ne vient d'un e-mail écrit dans le code. **Création de compte atomique** : hash calculé avant toute écriture, puis `users/{uid}` + `auth/{uid}` + réservation `email_index/{email}` dans un seul `commit` gardé — l'unicité de l'adresse vient de la garde, jamais d'un seul pré-contrôle ; une suppression de compte devra libérer sa réservation. Détails et exemples : `docs/encyclopedie/13-comptes.md`.
- **Recherche texte** : toujours via `useSearchMatches` (port `SearchEngine`, store `CatalogSearch`) et la normalisation unique `normalizeSearchText` (`@/core/search`), jamais un `toLowerCase().includes()` ; sans réponse du moteur, l'ancien filtre par nom sert de repli. Détails et exemples : `docs/encyclopedie/12-recherche.md`.
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
