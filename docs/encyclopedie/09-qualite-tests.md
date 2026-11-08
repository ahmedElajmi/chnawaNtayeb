# 09 · Qualité et tests

## Commandes

| Commande                    | Rôle                                                    |
| --------------------------- | ------------------------------------------------------- |
| `npm run check`             | **Avant chaque commit** : types, lint, formatage, tests |
| `npm run typecheck`         | TypeScript (`tsc --noEmit`)                             |
| `npm run lint`              | oxlint (`.oxlintrc.json`)                               |
| `npm run format`            | Prettier, réécrit les fichiers (`.prettierrc.json`)     |
| `npm run format:check`      | Prettier, vérifie seulement                             |
| `npm test`                  | Vitest                                                  |
| `npm run diagnose:matching` | Rapport du moteur sur des frigos types                  |
| `npm run build`             | Build de production (Vite)                              |

## Tests (Vitest)

Les tests sont à côté du code (`*.test.ts`).

| Type                     | Exemples                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Règles métier            | `core/matching/engine.test.ts`, `core/planning/planner.test.ts`, `core/grocery/groceryList.test.ts` |
| Scénarios du chef        | `core/matching/scenarios.test.ts` (données dans `scenarios.ts`)                                     |
| Réglages du moteur       | `core/matching/config.test.ts` (validation, mises en avant datées, effets)                          |
| Catalogue intégré        | `core/catalog/seed/catalog.test.ts` (cohérence des recettes et ingrédients)                         |
| Stores                   | `application/matching/MatchingSettingsStore.test.ts` (avec de faux adapters)                        |
| Interface (logique pure) | `features/recipes/recipeFilters.test.ts`, `features/backoffice/recipes/recipeDraft.test.ts`         |
| Serveur                  | `server/vision/scanValidation.test.ts`                                                              |
| Architecture             | `core/architecture.test.ts` (règles d'imports entre couches)                                        |

Principes :

- Le domaine est pur : on le teste sans navigateur ni base.
- Les stores se testent avec de faux adapters qui implémentent les ports.
- Horloge, aléatoire et ids sont injectés pour des tests déterministes.
- Une suggestion jugée fausse dans l'application devient d'abord un scénario du chef.

## Lint

**oxlint** plutôt qu'ESLint : `typescript-eslint` ne prend pas encore en charge TypeScript 7,
utilisé par le projet. Extensions actives : TypeScript, React, React Hooks, imports, unicorn.

Règles désactivées volontairement (`.oxlintrc.json`) :

- `unicorn/no-array-sort`, `no-array-reverse` : les tableaux sont copiés avant tri ; `toSorted` demande ES2023 ;
- `react/exhaustive-effect-dependencies` : doublon de `react-hooks/exhaustive-deps` qui signale les déclencheurs voulus ;
- `unicorn/require-post-message-target-origin`, `prefer-add-event-listener` : faux positifs (service worker, `FileReader`) ;
- `consistent-function-scoping`, `no-underscore-dangle`, `no-unassigned-import`, `no-named-as-default` : style.

Une exception ponctuelle se fait sur la ligne concernée, avec la raison :
`// oxlint-disable-next-line <règle> -- raison`.

## Formatage

Prettier : apostrophes simples, lignes de 120 caractères. Ignorés : `dist`, `public`, `brand`,
`package-lock.json` (`.prettierignore`).

## Conventions

- **Code et commentaires** en anglais ; **textes affichés** en derja / français / arabe ;
  **documentation** en français.
- **Messages de commit** en anglais, courts, qui décrivent le changement.
- Un composant React = un fichier ; un onglet ou un écran = un dossier.
- Pas de `any` dans le nouveau code ; préférer des types précis et des unions.
- Accessibilité : boutons d'icône avec `aria-label`, `aria-pressed` sur les filtres, rôles `dialog`, `tab`.
