# 06 · Interface

React 19, Vite, Tailwind CSS 4, react-router 7, icônes lucide-react.

## Organisation

| Dossier                     | Contenu                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `src/app/App.tsx`           | Fournisseurs (conteneur, langue, thème) et routeur                             |
| `src/app/AppRoutes.tsx`     | Routes ; recette par-dessus l'écran d'origine ; backoffice chargé à la demande |
| `src/app/AppLayout.tsx`     | En-tête, contenu, pied de page, barre du bas, fenêtres compte et réglages      |
| `src/app/layout/`           | `Header`, `BottomNav`                                                          |
| `src/app/providers/`        | `LanguageContext`, `ThemeContext`                                              |
| `src/app/homeNavigation.ts` | Accueil en bas de l'historique, « appuyez encore pour quitter »                |
| `src/features/<écran>/`     | Page de l'écran + ses composants                                               |
| `src/shared/`               | `paths.ts`, `i18n/translations.ts`, `hooks/`, `ui/`                            |

## Routes

Toutes les adresses sont définies dans `src/shared/paths.ts` (aussi utilisé par le serveur pour le SEO).

| Adresse          | Page                                       |
| ---------------- | ------------------------------------------ |
| `/`              | `features/home/HomePage.tsx`               |
| `/frigo`         | `features/fridge/FridgePage.tsx`           |
| `/recettes`      | `features/recipes/RecipesPage.tsx`         |
| `/suggestions`   | `features/suggestions/SuggestionsPage.tsx` |
| `/recette/:slug` | `features/recipes/RecipeDetailRoute.tsx`   |
| `/semaine`       | `features/planner/PlannerPage.tsx`         |
| `/courses`       | `features/grocery/GroceryPage.tsx`         |
| `/patron`        | `features/backoffice/BackofficePage.tsx`   |

Une adresse inconnue renvoie à l'accueil ; l'ancienne adresse `#patron` renvoie à `/patron`.

## Comportements de navigation

- **Filtres de recettes dans l'adresse** : `?q=&budget=&temps=&cuisine=&plat=&healthy=1&niveau=&favoris=1`
  (`features/recipes/recipeFilters.ts`). Une recherche se partage et survit au rechargement.
- **Deux listes de recettes** : `/recettes` (catalogue complet, `useRecipeCatalog`) et
  `/suggestions` (niveaux du frigo, `useRecipeMatches`), reliées par les onglets `RecipeListTabs`.
  La barre de filtres est commune (`recipes/components/RecipeFilterBar.tsx`) ; le filtre de niveau
  (`niveau`) n'existe que sur les suggestions. L'onglet « Recettes » du menu reste actif sur les deux.
- **Filtres conservés entre les écrans** : tout lien vers une liste reprend les derniers filtres
  (`useRecipesHref(PATHS.recipes | PATHS.suggestions)`) ; un raccourci de l'accueil ne change que
  son propre filtre (`filterMemory.ts`). Le bouton du frigo et « Voir tout » de l'accueil mènent
  aux suggestions, les autres liens au catalogue.
- **Récapitulatif du frigo** : en haut de `/frigo`, les ingrédients choisis (retrait d'un clic,
  « Tout effacer », repli au-delà de 12 avec « Tout voir »). Pas d'ajout d'ingrédient : réservé au patron.
- **Fiche recette par-dessus l'écran d'origine** : ouvrir une recette garde l'écran derrière ;
  retour la ferme. Une adresse ouverte directement s'affiche par-dessus la liste.
- **Accueil en bas de l'historique** : aller à l'accueil revient au début de l'historique ; une
  page ouverte depuis un lien a l'accueil en dessous.
- **« Appuyez encore pour quitter »** : sur l'accueil, le premier retour affiche le message, un
  second dans les 2 secondes quitte l'application.
- **Fenêtres et bouton retour** : `useCloseOnBack(isOpen, onClose)` (`shared/hooks/useCloseOnBack.ts`)
  ajoute une entrée d'historique tant qu'une fenêtre est ouverte : retour la ferme au lieu de changer d'écran.
- **Fond des fenêtres** : toute fenêtre passe par `shared/ui/ModalShell.tsx`. Il affiche le fond grisé
  dans un portail sur `<body>`, hors de la page. Une page animée (`animate-fade-in`) ou floutée
  (l'en-tête) capturerait sinon le `position: fixed` : le fond couvrait toute la hauteur de la page
  et la fenêtre s'ouvrait hors de l'écran (écran gris du scan photo). La fenêtre est centrée tant
  qu'elle tient dans l'écran ; plus haute, elle commence en haut et le fond défile, rien n'est coupé.
  Variantes : `mobile="bottom"` (Réglages, collée en bas sur téléphone), `mobile="full"` (fiche
  recette en plein écran sur téléphone, son contenu défile à l'intérieur).
- **Animation `fade-in`** (`src/index.css`) : elle ne laisse aucune transformation une fois finie
  (`backwards`, état final `transform: none`). Toute nouvelle animation doit faire de même.

## Langues (`shared/i18n/translations.ts`)

Un dictionnaire typé par langue (`derja`, `fr`, `ar`). `useLanguage()` fournit `t` (les textes),
`language`, `setLanguage`, et des aides (`getRecipeName`, `getIngredientName`, `getRecipeDesc`,
`getStepText`, `getChefTip`) qui passent toutes par `pickLocalized` du domaine : texte de la langue
choisie, sinon le français. Aucun écran ne code un ordre de langues en dur. Sous le titre d'une
recette, les noms dans les autres langues ne sont affichés que s'ils diffèrent du titre (pas de nom
en double). L'arabe passe la page de droite à gauche. Les textes du backoffice sont en français.

## Thèmes (`app/providers/ThemeContext.tsx`)

Thèmes intégrés + thèmes publiés par le patron, mode clair / sombre / système. Le thème actif est
appliqué en variables CSS sur `<html>` ; une copie est enregistrée pour que `index.html` l'applique
avant le démarrage (pas de flash). Aperçu en direct depuis l'éditeur de thèmes et les réglages.

## PWA

- `public/manifest.json` : nom, icônes, couleurs.
- `public/sw.js` : pages en réseau d'abord (copie hors ligne sinon), fichiers en cache mis à jour
  en arrière-plan, un cache par version déployée.
- `shared/ui/UpdatePrompt.tsx` : bandeau « nouvelle version » qui active le nouveau service worker.
- **Installation** : tant que l'application n'est pas installée, trois points d'entrée, tous basés sur
  `useInstallApp()` (`shared/ui/PWAInstallButton.tsx`) : la proposition d'installation du navigateur
  quand il en offre une, sinon le guide pas à pas (`InstallGuideModal`, iOS et autres navigateurs).
  - **Bandeau** (`shared/ui/InstallBanner.tsx`, sous l'en-tête, pas dans `/patron`) : affiché dès la
    première page d'une visite si le navigateur sait installer l'application (proposition disponible, ou
    iPhone / iPad). Il reste d'une page à l'autre jusqu'à ce que le visiteur le ferme (✕) ; fermé, il ne
    revient qu'à la visite suivante (rien n'est enregistré).
  - **Réglages › Application** : bouton « Installer l'application », toujours disponible tant que
    l'application n'est pas installée.
  - Bouton de l'accueil (`PWAInstallButton`).
  - Une fois l'application installée, tout disparaît : aucun badge ni texte « installée ».
  - L'état d'installation est partagé (`shared/hooks/usePWAInstall.ts`) : le navigateur n'envoie la
    proposition qu'une fois, au chargement ; elle est gardée pour les composants affichés plus tard.
- `shared/ui/OfflineIndicator.tsx` : indicateur hors ligne.

## Réglages (`features/settings/SettingsModal.tsx`)

Ouverts par la roue dentée de l'en-tête. Trois onglets courts, pour que chacun tienne sur un écran de
téléphone :

| Onglet      | Contenu                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------- |
| Affichage   | Mode clair / sombre / automatique, choix du thème                                             |
| Langue      | Derja, Français, العربية                                                                      |
| Application | Installer l'application (si pas installée) ; section Patron (backoffice, quitter) si connecté |

L'onglet Application n'existe que s'il a quelque chose à proposer.

## Mobile

- Barre d'onglets en bas sur téléphone, liens dans l'en-tête sur ordinateur.
- **Aucun élément ne doit élargir la page** : l'en-tête se resserre (logo et titre plus petits ; plus
  de bouton d'installation dans l'en-tête, remplacé par le bandeau) ; en mode patron, le badge
  « Patron » et « Quitter » ne sont dans l'en-tête qu'à partir de 640 px : sur téléphone ils sont dans
  Réglages › Application, pour que « Chnowa Ntayeb / by Chef Souhed » reste lisible ; les rangées de filtres défilent dans leur propre
  conteneur ; filet de sécurité `overflow-x: clip` sur `html` et `body` (`src/index.css`).
- Vérifier à 375 px et 320 px de large avant de livrer un écran.
