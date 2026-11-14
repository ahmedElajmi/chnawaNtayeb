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
| `/admin/*`       | `features/backoffice/BackofficePage.tsx`   |

Une adresse inconnue renvoie à l'accueil ; l'ancienne adresse `#super admin` renvoie à `/admin`. Les pages du
backoffice (`/admin/recettes`, `/admin/moteur/scenarios`…) sont déclarées par son registre des sections
(voir [07](07-backoffice.md)) ; une adresse inconnue sous `/admin` renvoie à `/admin`.

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
  « Tout effacer », repli au-delà de 12 avec « Tout voir »). Pas d'ajout d'ingrédient : réservé au super admin.
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
- **Fermer une fenêtre** : `ModalShell` exige `onDismiss` (propriété obligatoire), appelé par un clic en
  dehors de la fenêtre et par Échap (seule la fenêtre du dessus se ferme). Les fenêtres simples passent
  leur `onClose` ; un éditeur passe une fonction qui demande avant de perdre une saisie
  (`useGuardedClose`, ou la confirmation de l'éditeur de recette) ; `null` seulement pour une fenêtre
  qui ne doit pas se fermer ainsi (le scan photo pendant l'analyse).
- **Listes longues** (`shared/hooks/usePagedList.ts`, `shared/ui/ShowMore.tsx`) : les listes de
  recettes, du catalogue et du backoffice n'affichent que les premières pages (24 éléments), la suite
  arrive en défilant ou avec « Voir plus ». Tout compteur (onglets, niveaux, filtres, « 24 sur 312 »)
  vient de la liste complète (`total`), jamais du nombre affiché. Une nouvelle recherche ou de nouveaux
  filtres repartent du début ; une mise à jour en direct ne change pas la page affichée.
- **Bouton « haut de page »** (`shared/ui/ScrollToTopButton.tsx`, monté une fois dans `AppLayout`) :
  apparaît après 1,5 hauteur d'écran de défilement (`shared/hooks/useScrolledPast.ts`), remonte en
  douceur (instantané si l'appareil demande moins d'animations). En bas à droite, au-dessus de la barre
  d'onglets ; remonté au-dessus de la barre « voir les recettes » du frigo quand des ingrédients sont
  choisis. Libellé traduit (`scrollToTop`).
- **Vignette d'ingrédient** (`shared/ui/IngredientThumb.tsx`) : toute image d'ingrédient passe par ce
  composant. Avec photo : image recadrée, chargée à la demande ; si le lien ne répond pas, bascule sur
  la pastille. Sans photo : pastille en dégradé de la couleur de la catégorie avec son emoji
  (`shared/ui/ingredientVisuals.ts`, clair et sombre). Même taille dans les deux cas : une grille reste
  régulière quel que soit le nombre de photos. Tailles `xs` (pastilles du récapitulatif), `sm` (fiche
  recette, liste de courses), `md` (grille du frigo, backoffice), `lg` (aperçu du backoffice).
  Utilisée dans : grille et récapitulatif du frigo, ingrédients disponibles / manquants de la fiche
  recette, liste de courses (article libre = pastille sac, article acheté en gris).
- **Prix en fourchette** : `formatPriceRange(range, t.currency)` (`shared/i18n/formatPrice.ts`) affiche
  « 2.5 DT » ou « 2.5 – 4 DT » (« د.ت » en arabe). Sous chaque ingrédient de la grille du frigo
  (« 2 – 3 DT / kg ») et dans le coût des courses manquantes (`groceryCost`, cartes et fiche recette).
- **Unité affichée** (`shared/ui/UnitInfo.tsx`) : le libellé de l'unité, et quand le backoffice
  décrit cette unité (collection partagée `units`, recherche insensible à la casse et aux espaces via
  `useUnitDescription`), une icône d'info avec l'infobulle traduite dans la langue courante
  (survol, focus, ou appui qui bascule). Sans description configurée, l'unité reste nue : **aucune
  description par défaut dans le code**. Utilisée sur les lignes de /courses, les suggestions du
  formulaire d'ajout et les manquants de la fiche recette.
- **Liste de courses : trois points d'entrée**, tous passés par `addGroceryItems` (fusion des lignes
  en unités compatibles, voir [03](03-domaine.md#grocery--liste-de-courses)) :
  - `/courses` : le formulaire d'ajout est un **choix d'ingrédient du catalogue**
    (`GroceryIngredientPicker`) — recherche via le moteur (`useSearchMatches`, repli filtre par nom),
    20 suggestions au plus, vignette, fourchette de prix et unité (`UnitInfo`) ; un panneau replié
    « article libre » garde la saisie hors catalogue (marqué `is_custom`, rayon « autre »). Chaque
    ligne montre son unité et, pour une masse ou un volume avec plusieurs alias (g, kg, gr / ml, cl,
    dl, l), un sélecteur qui la convertit (`KitchenStore.setGroceryItemUnit`) ; les choses comptées
    et les unités brutes restent un simple libellé.
  - **Frigo** : chaque carte d'ingrédient a un **bouton panier distinct** (`AddToCartButton`) qui
    ajoute l'ingrédient à la liste (avec son `ingredient_id`, son unité par défaut et sa catégorie)
    sans jamais cocher le frigo ; l'en-tête de /frigo porte une **pastille du nombre d'articles** de
    la liste (`GroceryListChip`), lien vers /courses.
  - **Fiche recette** : les ingrédients manquants sont **sélectionnables** (`MissingIngredientsPicker`,
    tout coché par défaut, « Tout sélectionner / Tout désélectionner »), le bouton dit combien sont
    choisis (« Ajouter la sélection (n) ») ; chaque article envoyé porte `ingredient_id` et
    `category`, pour fusionner avec la même ligne et tomber dans le bon rayon.
- **Animation `fade-in`** (`src/index.css`) : elle ne laisse aucune transformation une fois finie
  (`backwards`, état final `transform: none`). Toute nouvelle animation doit faire de même.

## Langues (`shared/i18n/translations.ts`)

Un dictionnaire typé par langue (`derja`, `derja_ar`, `fr`, `ar`), chacun écrit en entier : la derja en
lettres arabes (`derjaArabic.ts`) est de la derja tunisienne, jamais empruntée à l'arabe littéraire, et
l'arabe (`ar`) est de l'arabe littéraire sans aucun mot de derja (باش، شنوة، فريجيدار…). Vérifié par
`translations.test.ts` : toutes les clés du français présentes et non vides dans chaque langue, mêmes
`{marques}`, aucun mot de derja dans `ar`. Aucun texte affiché en dur dans les écrans publics (accueil,
en-tête, compte, accès super admin, Réglages) : tout passe par `t`. Les erreurs de connexion (visiteur et super admin)
arrivent de l'infrastructure sous forme de **codes** (`UserAuthError`, `BackofficeLoginError` dans
`src/application/ports.ts`) que l'écran traduit. Sélecteurs (en-tête,
Réglages › Langue) : Derja, دارجة, Français, العربية الفصحى (`SELECTOR_ORDER`). `useLanguage()` fournit `t` (les textes),
`language`, `setLanguage`, et des aides (`getRecipeName`, `getIngredientName`, `getRecipeDesc`,
`getStepText`, `getChefTip`, `getSecondaryName`, `compareNames`) qui passent toutes par `pickLocalized` du
domaine : texte de la langue choisie, sinon sa liste de repli (`LANGUAGES`) ; `getLocalized(item, champ)`
lit n'importe quel champ localisé. Aucun écran ne code un ordre de langues en dur,
ni n'affiche `name_fr` directement (backoffice compris : listes, recherche d'ingrédients, moteur, thèmes,
messages) ; les tris de noms suivent la langue (`compareNames`) ; les catégories d'ingrédients viennent
de `useIngredientCategories` (`shared/i18n`). Les phrases avec des mots en gras passent par `BoldText`
(`**gras**`, jamais de HTML). Sous le titre d'une
recette, les noms dans les autres langues ne sont affichés que s'ils diffèrent du titre (pas de nom
en double). L'arabe et la دارجة passent la page de droite à gauche (`dir` et `lang` viennent de `LANGUAGES`).

## Thèmes (`app/providers/ThemeContext.tsx`)

Thèmes intégrés + thèmes publiés par le super admin, mode clair / sombre / système. Le thème actif est
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
  - **Bandeau** (`shared/ui/InstallBanner.tsx`, sous l'en-tête, pas dans `/admin`) : affiché dès la
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

| Onglet      | Contenu                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Affichage   | Mode clair / sombre / automatique, choix du thème                                                  |
| Langue      | Derja, Français, العربية                                                                           |
| Application | Installer l'application (si pas installée) ; section Super admin (backoffice, quitter) si connecté |

L'onglet Application n'existe que s'il a quelque chose à proposer.

## Mobile

- Barre d'onglets en bas sur téléphone, liens dans l'en-tête sur ordinateur.
- **Aucun élément ne doit élargir la page** : l'en-tête se resserre (logo et titre plus petits ; plus
  de bouton d'installation dans l'en-tête, remplacé par le bandeau) ; en mode super admin, le badge
  « Super admin » et « Quitter » ne sont dans l'en-tête qu'à partir de 640 px : sur téléphone ils sont dans
  Réglages › Application, pour que « Chnowa Ntayeb / by Chef Souhed » reste lisible ; les rangées de filtres défilent dans leur propre
  conteneur ; filet de sécurité `overflow-x: clip` sur `html` et `body` (`src/index.css`).
- Vérifier à 375 px et 320 px de large avant de livrer un écran.
