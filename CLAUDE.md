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
   sans fusion** : un champ retiré (vidéo…) doit disparaître de la base, sinon il revient sur les autres appareils.
4. **Spécificités de la base actuelle** (Firestore : règles `firestore.rules`, `npm run deploy:rules`,
   transactions, ordre, ids) → restent dans l'adapter et sa configuration, jamais dans le domaine,
   les stores ou l'interface.
5. **Interface** → `src/features/<écran>`, sans logique métier, n'importe jamais `src/infrastructure` ni
   un SDK de base, et ne nomme jamais la base dans ses textes ; fenêtres avec `ModalShell` + `useCloseOnBack` ;
   vérifiée à 375 px et 320 px ; textes publics dans les trois langues, backoffice en français.
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
- Nouvelle adresse : `src/shared/paths.ts` + `src/app/AppRoutes.tsx`.
- Gestion du catalogue (ajout / modification d'ingrédients, de recettes, de prix) **réservée au patron**
  dans `/patron` : aucun formulaire de création dans l'interface publique.
- Textes affichés dans les trois langues (`src/shared/i18n/translations.ts`) ; backoffice en français.
- **Contenu multilingue** (noms, descriptions, étapes, astuce du chef, noms d'ingrédients) : modifiable dans
  /patron dans les trois langues avec `LocalizedField` (`src/features/backoffice/ui/`) ; affiché via
  `pickLocalized` (`@/core/shared`, à travers les aides de `LanguageContext`), jamais avec un ordre de
  langues codé en dur. Le français est la langue de référence (derja / arabe vide → français).
- Étapes de préparation : modifiables dans l'éditeur de recette (`RecipeStepsEditor`), validées par
  `validateRecipe` (au moins une étape en français, renumérotées à l'enregistrement).
- **Fenêtres** : toujours via `ModalShell` (`src/shared/ui/ModalShell.tsx`, portail sur `<body>`) ; jamais de
  `fixed inset-0` directement dans une page (une page animée ou floutée le capture : fenêtre hors écran, écran
  gris). Une animation ne laisse aucune `transform` une fois finie.
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
  `RecipeDraftRepository`) et confirmation avant de les perdre. Libellés du backoffice en français en dur
  (pas `t.bo…`, qui suit la langue du site).
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
- Deux listes de recettes séparées : `/recettes` = catalogue complet (`browseRecipes`), `/suggestions`
  = propositions du frigo par niveau (`matchRecipes`) ; onglets entre les deux (`RecipeListTabs`).
- Comportements à conserver : filtres de recettes gardés entre les écrans (et entre les deux listes) ;
  récapitulatif des ingrédients choisis en haut du frigo ; « appuyez encore pour quitter » sur
  l'accueil ; retour ferme les fenêtres ouvertes (`useCloseOnBack`) ; bouton « haut de page »
  (`ScrollToTopButton`, dans `AppLayout`, au-dessus de la barre collante du frigo).
- Code et commentaires en anglais ; documentation en français.

## Git

Détails : `docs/encyclopedie/09-qualite-tests.md` (« Branches et versions »).

- `main` = production. **Jamais** de commit direct ni de PR vers `main`, sauf release ou hotfix.
- `develop` = branche d'intégration (branche par défaut sur GitHub), contient tous les développements validés.
  `main` et `develop` sont protégées : passage obligatoire par une PR.
- **Chaque nouvelle demande** part de `develop` à jour (`git checkout develop && git pull`) sur une nouvelle branche :
  `feature/<nom-court>` (évolution), `fix/<nom-court>` (correction), `docs/<nom>` ou `chore/<nom>`
  (documentation, outillage). Noms en anglais, en kebab-case (`feature/grocery-export`).
- `npm run check` vert, push, puis PR **vers `develop`** ; branche supprimée après fusion.
- Release : quand une version est validée, PR `develop` → `main`, puis tag annoté sur `main`
  (`git tag -a vX.Y.Z -m "..."` + `git push origin vX.Y.Z`) ; semver : majeur = rupture, mineur = features,
  patch = corrections.
- Hotfix urgent en production : `hotfix/<nom>` depuis `main`, PR vers `main`, tag patch, puis fusion de `main`
  dans `develop`.
- Messages de commit **en anglais**, courts, décrivant le changement. Pas de mention d'outil d'IA
  ni de ligne `Co-Authored-By`.
- Ne jamais commiter `.env` ni de compte de service.
