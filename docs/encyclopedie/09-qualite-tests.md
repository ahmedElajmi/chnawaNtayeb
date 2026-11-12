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
| Scénarios du chef        | `core/matching/scenarios.test.ts`, `scenarioSchema.test.ts` (données en base, rejouées en /patron)  |
| Réglages du moteur       | `core/matching/config.test.ts` (validation, mises en avant datées, effets)                          |
| Catalogue intégré        | `core/catalog/seed/catalog.test.ts` (cohérence des recettes et ingrédients)                         |
| Stores                   | `application/matching/MatchingSettingsStore.test.ts`, `MatchingScenariosStore.test.ts`              |
| Interface (logique pure) | `features/recipes/recipeFilters.test.ts`, `features/backoffice/recipes/recipeDraft.test.ts`         |
| Serveur                  | `server/vision/scanValidation.test.ts`                                                              |
| Architecture             | `core/architecture.test.ts` (règles d'imports entre couches)                                        |
| Contrats d'adapters      | `infrastructure/contracts/*.contract.ts`, joués par chaque adapter (ex. `memory/`)                  |

Principes :

- Le domaine est pur : on le teste sans navigateur ni base.
- Les stores se testent avec de faux adapters qui implémentent les ports.
- Horloge, aléatoire et ids sont injectés pour des tests déterministes.
- Une suggestion jugée fausse dans l'application devient d'abord un scénario du chef (backoffice).

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

## Branches et versions

| Branche                     | Rôle                                                       | Part de   | Fusionnée dans              |
| --------------------------- | ---------------------------------------------------------- | --------- | --------------------------- |
| `main`                      | Production. Protégée, aucun commit direct.                 | —         | —                           |
| `develop`                   | Intégration des développements validés. Branche par défaut | `main`    | `main` (release)            |
| `feature/<nom>`             | Nouvelle fonctionnalité                                    | `develop` | `develop` (PR)              |
| `fix/<nom>`                 | Correction                                                 | `develop` | `develop` (PR)              |
| `docs/<nom>`, `chore/<nom>` | Documentation, outillage                                   | `develop` | `develop` (PR)              |
| `hotfix/<nom>`              | Correction urgente en production                           | `main`    | `main` (PR), puis `develop` |

Nouvelle demande :

```bash
git checkout develop && git pull
git checkout -b feature/nom-court
# ... développement ...
npm run check
git push -u origin feature/nom-court
gh pr create --base develop
```

La branche est supprimée après la fusion. `main` et `develop` sont protégées sur GitHub : tout passe par une PR.

**Release** : quand une version est validée, PR `develop` → `main`, puis tag annoté sur `main` :

```bash
git checkout main && git pull
git tag -a v2.1.0 -m "Release 2.1.0"
git push origin v2.1.0
```

Numérotation semver : majeur = changement incompatible, mineur = nouvelles fonctionnalités, patch = corrections.
Un hotfix produit une version patch et est ensuite reporté dans `develop` (fusion de `main` dans `develop`).
