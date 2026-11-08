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

## Conventions

- Pas de duplication : une règle métier vit à un seul endroit dans `src/core`, avec ses tests à côté (`*.test.ts`).
- Domaine pur : horloge, aléatoire et ids injectés.
- Composants sans logique métier ; un écran = un dossier dans `src/features`.
- **Base de données d'abord** : données partagées et réglages en Firestore ; localStorage seulement
  comme copie hors ligne ; fichiers JSON seulement pour exporter / restaurer.
- Moteur de matching : tout réglage passe par `MatchingConfig` + `resolveMatchingConfig` ; une
  suggestion jugée fausse devient d'abord un scénario dans `src/core/matching/scenarios.ts`.
- Nouvelle adresse : `src/shared/paths.ts` + `src/app/AppRoutes.tsx`.
- Gestion du catalogue (ajout / modification d'ingrédients, de recettes, de prix) **réservée au patron**
  dans `/patron` : aucun formulaire de création dans l'interface publique.
- Textes affichés dans les trois langues (`src/shared/i18n/translations.ts`) ; backoffice en français.
- Mobile : aucun élément ne doit élargir la page ; vérifier à 375 px et 320 px.
- Deux listes de recettes séparées : `/recettes` = catalogue complet (`browseRecipes`), `/suggestions`
  = propositions du frigo par niveau (`matchRecipes`) ; onglets entre les deux (`RecipeListTabs`).
- Comportements à conserver : filtres de recettes gardés entre les écrans (et entre les deux listes) ;
  récapitulatif des ingrédients choisis en haut du frigo ; « appuyez encore pour quitter » sur
  l'accueil ; retour ferme les fenêtres ouvertes (`useCloseOnBack`).
- Code et commentaires en anglais ; documentation en français.

## Git

- Messages de commit **en anglais**, courts, décrivant le changement. Pas de mention d'outil d'IA
  ni de ligne `Co-Authored-By`.
- Ne jamais commiter `.env` ni de compte de service.
