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

| Adresse          | Page                                     |
| ---------------- | ---------------------------------------- |
| `/`              | `features/home/HomePage.tsx`             |
| `/frigo`         | `features/fridge/FridgePage.tsx`         |
| `/recettes`      | `features/recipes/RecipesPage.tsx`       |
| `/recette/:slug` | `features/recipes/RecipeDetailRoute.tsx` |
| `/semaine`       | `features/planner/PlannerPage.tsx`       |
| `/courses`       | `features/grocery/GroceryPage.tsx`       |
| `/patron`        | `features/backoffice/BackofficePage.tsx` |

Une adresse inconnue renvoie à l'accueil ; l'ancienne adresse `#patron` renvoie à `/patron`.

## Comportements de navigation

- **Filtres de recettes dans l'adresse** : `?q=&budget=&temps=&cuisine=&plat=&healthy=1&niveau=&favoris=1`
  (`features/recipes/recipeFilters.ts`). Une recherche se partage et survit au rechargement.
- **Filtres conservés entre les écrans** : tout lien vers la liste reprend les derniers filtres ;
  un raccourci de l'accueil ne change que son propre filtre (`filterMemory.ts`).
- **Fiche recette par-dessus l'écran d'origine** : ouvrir une recette garde l'écran derrière ;
  retour la ferme. Une adresse ouverte directement s'affiche par-dessus la liste.
- **Accueil en bas de l'historique** : aller à l'accueil revient au début de l'historique ; une
  page ouverte depuis un lien a l'accueil en dessous.
- **« Appuyez encore pour quitter »** : sur l'accueil, le premier retour affiche le message, un
  second dans les 2 secondes quitte l'application.
- **Fenêtres et bouton retour** : `useCloseOnBack(isOpen, onClose)` (`shared/hooks/useCloseOnBack.ts`)
  ajoute une entrée d'historique tant qu'une fenêtre est ouverte : retour la ferme au lieu de changer d'écran.

## Langues (`shared/i18n/translations.ts`)

Un dictionnaire typé par langue (`derja`, `fr`, `ar`). `useLanguage()` fournit `t` (les textes),
`language`, `setLanguage`, et des aides (`getRecipeName`, `getIngredientName`…). L'arabe passe la
page de droite à gauche. Les textes du backoffice sont en français.

## Thèmes (`app/providers/ThemeContext.tsx`)

Thèmes intégrés + thèmes publiés par le patron, mode clair / sombre / système. Le thème actif est
appliqué en variables CSS sur `<html>` ; une copie est enregistrée pour que `index.html` l'applique
avant le démarrage (pas de flash). Aperçu en direct depuis l'éditeur de thèmes et les réglages.

## PWA

- `public/manifest.json` : nom, icônes, couleurs.
- `public/sw.js` : pages en réseau d'abord (copie hors ligne sinon), fichiers en cache mis à jour
  en arrière-plan, un cache par version déployée.
- `shared/ui/UpdatePrompt.tsx` : bandeau « nouvelle version » qui active le nouveau service worker.
- `shared/ui/PWAInstallButton.tsx` : installation (guide pour iOS).
- `shared/ui/OfflineIndicator.tsx` : indicateur hors ligne.

## Mobile

- Barre d'onglets en bas sur téléphone, liens dans l'en-tête sur ordinateur.
- **Aucun élément ne doit élargir la page** : l'en-tête se resserre (nom tronqué, bouton
  d'installation réduit à l'icône sous 640 px) ; les rangées de filtres défilent dans leur propre
  conteneur ; filet de sécurité `overflow-x: clip` sur `html` et `body` (`src/index.css`).
- Vérifier à 375 px et 320 px de large avant de livrer un écran.
