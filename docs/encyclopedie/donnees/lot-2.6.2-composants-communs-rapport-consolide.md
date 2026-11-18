# Rapport consolidé — Lot 2.6.2 « Composants communs & fondations » (v2, remplace la 1ʳᵉ version)

**Statut** : implémentation **terminée, vérifiée, complétée** (correctif du défaut de retour inclus,
vérifications navigateur étendues) — rapport remis au chef. **Aucun commit, aucune fusion, aucun push,
aucun lot démarré** — attente de la validation explicite du chef.
**Sources** : dossier d'exécution v3 validé (`lot-2.6.2-composants-communs-dossier.md`) + demande
complémentaire du chef (correctif distinct + vérifications restantes). Le contenu de la 1ʳᵉ version
du rapport reste valable ; ce document le complète et le corrige (§ 3, mesures refaites).

---

## 1. Corrections effectuées

### 1.1 Correctif **distinct du lot** : crash au retour vers `/recipes` (traçabilité séparée)

**Constat** : liste → fiche → retour → écran vide, `TypeError: Cannot read properties of undefined
(reading 'trim')` dans `unitLookupKey` (`src/core/units/info.ts`). Reproduit proprement (chargement
frais, aucun artefact HMR) ; **constaté également sur HEAD** — préexistant, hors périmètre du lot.

**Cause racine identifiée** (pile de composants React capturée via un `onUncaughtError` diagnostique
temporaire, retiré après) : `UnitInfo` → `MissingIngredientsPicker` → `RecipeDetailModal` →
`RecipeDetailRoute`. La chaîne : les données externes (copie d'appareil IndexedDB, exports, anciennes
versions) peuvent contenir des lignes d'ingrédient **sans `unit`** ; `parseStoredRecipe` (la lecture
du domaine exigée par la règle « toute donnée externe est relue par le core ») vérifiait
`ingredient_id` + `quantity_base` mais **n'exigeait ni ne complétait `unit`** — un `undefined` atteignait
alors l'affichage des unités. Prouvé en inspectant la copie d'appareil du navigateur de test : la
recette y est stockée **sans `unit`** tandis que le serveur les a.

**Correctif à la source (pas de contournement)** — `src/core/catalog/validation.ts` :
`parseStoredRecipe` garantit désormais **une unité par ligne d'ingrédient** :

- unité stockée valide → conservée ;
- unité absente → **celle du catalogue intégré** quand l'ingrédient y figure (`unit_default`), sinon
  **chaîne vide** (quantité affichée nue, **rien n'est inventé**) ;
- conséquence : un `undefined` ne peut plus sortir du parser — y compris pour les copies d'appareil
  périmées (vérifié en réel : le flux complet réussit **avec le cache périmé encore en place**).
  **Périmètre du correctif** : `validation.ts` + `validation.test.ts` **uniquement** — aucun fichier du
  lot 2.6.2 touché pour ce correctif, aucun changement du périmètre fonctionnel du lot. À commit
  séparé du lot (proposition : `fix(catalog): every stored recipe ingredient line carries a unit`,
  lot 2.6.2 ensuite).
  **Tests de non-régression** (2 nouveaux dans `validation.test.ts`) : unité stockée conservée ;
  unité absente → repli catalogue intégré ou `''` ; type `string` garanti.
  **Vérification du parcours complet (réel)** : `/recipes` → clic titre → `/recipe/:slug` avec
  **état `background`** présent dans l'historique → retour → `/recipes` avec **4 cartes rendues, racine
  OK, 0 erreur** ; le contexte de navigation (surcouche + retour à la liste) est préservé.

### 1.2 Aucune autre correction

Le reste du diff est celui validé au § 1 du dossier v3 (core display, couches 1–2, tokens) —
**inchangé**. Diagnostics temporaires (patch `main.tsx`, gardes) **tous retirés** (`git diff HEAD`
sur ces fichiers = 0).

## 2. Tests automatisés exécutés

`npm run check` **intégral vert** : types + lint oxlint + Prettier + **924 tests / 29 skippés**
(106 fichiers ; baseline du lot 886 → **+38**, dont 2 tests du correctif). Tests de non-régression du
correctif verts ; suite complète sans régression (architecture, i18n, contrats).

## 3. Vérifications navigateur réellement exécutées

Serveur isolé 3001 (`DATA_STORE=sql`, SQLite jetable `scripts/diagnostics/seed-lot262.ts` : 4
recettes + 7 ingrédients) ; harnais supprimé après usage ; **port 3000 du chef intact**.

| Vérification                                                                                                   | Étendue réelle                                                         | Résultat                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cibles ≥ 44 px du lot** (`LinkTabs` via `RecipeListTabs`, favori `RecipeCard`)                               | **320, 375, 768, 1280 px**                                             | **0 cible < 44 px, 0 chevauchement, 0 débordement horizontal** à chaque viewport                                                                                          |
| **4 langues × clair/sombre** (fr, ar, derja, derja_ar × 2 modes = **8 configurations**, vérifiées une par une) | 1280 px                                                                | chaque config : 4 cartes rendues, `dir` correct (RTL en ar/derja_ar), 0 cible < 44, 0 chevauchement, 0 débordement, racine OK                                             |
| **RTL effectif** (favori `start/end` logique)                                                                  | ar/derja_ar vérifiés                                                   | le favori passe bien de droite à gauche en RTL                                                                                                                            |
| **375/768 px** (harnais iframe à largeur exacte)                                                               | /recipes                                                               | 0 cible < 44, 0 chevauchement, 0 débordement                                                                                                                              |
| **Comparaison avant/après `RecipeCard`/`RecipeListTabs`**                                                      | HEAD ↔ lot, mesures calculées (positions, tailles, couleurs, arrondis) | cercle favori **identique** (32 px visuel, cible réelle 44) ; couleurs d'onglets identiques ; pastille 32 → **44 px** (voulue) ; fonds `slate` → tokens du thème (voulus) |
| **Parcours liste → fiche → retour**                                                                            | après le correctif, **avec copie d'appareil périmée encore en place**  | ouverture ✓, `background` ✓, retour ✓ (4 cartes, 0 erreur)                                                                                                                |
| **CLS**                                                                                                        | /recipes, toutes les mesures                                           | **0** (un 0,011 isolé observé une fois côté HEAD, probablement le bandeau d'installation — hors lot)                                                                      |
| **LCP**                                                                                                        | /recipes, paire avant/après (1ʳᵉ série) + tentative de refonte         | refonte **inconcluante** : l'environnement a cessé de rapporter le LCP sur les chargements suivants (onglet de vérification masqué, peinture non produite — § 5)          |

**Méthode de capture** : l'outil de capture d'écran de l'environnement a échoué **à chaque
tentative** (2 onglets × 2 timeouts chacun) — la comparaison visuelle a été faite **par mesures
calculées** (positions/tailles/couleurs au pixel, plus précises qu'une lecture d'image) ; le
« si possible » de la demande est donc traité par la méthode disponible.

## 4. Résultats observés

1. **Correctif** : le crash au retour est **corrigé à la source** ; le parcours complet fonctionne,
   y compris avec une copie d'appareil ancienne (le parser répare à la lecture).
2. **Lot 2.6.2** : aucun changement visible de `RecipeCard`/`RecipeListTabs` hors les évolutions
   voulues (cible 44 px, tokens) ; navigation/favoris/coût/langues sans régression ; 0 régression
   d'architecture ou fonctionnelle dans toute la suite.
3. **Performance** : **aucune amélioration démontrée, aucune dégradation démontrée** — les seules
   mesures LCP complètes disponibles (1ʳᵉ série) donnaient médiane avant 1192 ms / après 1044 ms
   **avec un bruit d'environnement élevé** (dérive ascendante intra-série) : elles ne soutiennent
   **aucune conclusion** au-delà de « aucun signe de dégradation » ; la refonte prévue n'a pas pu
   être complétée (§ 5). Le CLS, mesuré de façon fiable, est **0 partout**.
4. Suite complète : **924 tests verts**.

## 5. Points non vérifiés (et raison)

1. **LCP refait dans des conditions stabilisées** : l'environnement de vérification a cessé de
   rapporter les entrées LCP (peinture non produite en onglet masqué, intermittent) après la 1ʳᵉ
   série — refonte impossible dans cet état ; à refaire dans un navigateur visible (proposition :
   mesure par le chef ou lors d'une session avec aperçu ouvert). Le CLS, lui, est fiable et vert.
2. **Capture d'écran avant/après** : outil indisponible (§ 3) — remplacée par des mesures calculées.
3. **`Sheet` en navigateur réel (CLS à l'ouverture/fermeture)** : `Sheet` n'a **pas de consommateur
   d'écran** — conformément à l'instruction du chef (ne pas créer d'usage artificiel), la validation
   navigateur de `Sheet` est **reportée au lot qui l'adopte** (2.6.3+) ; elle est déjà couverte par
   ses tests (Échap, clic extérieur, portail, `useCloseOnBack`).
4. **Composants sans consommateur** (`PageHeading`, `EmptyState`, `SkeletonList`, `Rail`, `Chips`,
   `MatchingBadge`, `PriceRange`, `CategoryRail`, `Shelf`) : idem — tests verts, validation
   navigateur à l'adoption.
5. **Wording D1 affiché sur `/suggestions`** : à l'adoption du lot 2.6.4 (le lot livre la règle et
   les composants, sans réécrire les écrans).

## 6. Anomalies préexistantes découvertes (hors lot)

1. **Corrigé dans ce cycle (à la demande du chef, correctif distinct)** : crash au retour
   (`unitLookupKey`/`UnitInfo`) — § 1.1.
2. **Restées ouvertes, signalées** :
   - cibles < 44 px **hors lot** sur `/recipes` (barre de filtres existante, bandeau d'installation)
     — à corriger dans leurs lots propres (filtres = 2.6.4) ;
   - le repli « Ingrédient » s'affiche dans la fiche quand le catalogue d'ingrédients n'est pas
     encore chargé (comportement défensif existant, observé avec l'environnement de test jetable) ;
   - la remise à zéro des révisions de ma base de test jetable masque la resynchronisation du
     cache client (artefact de banc d'essai, sans effet sur les données réelles).

## 7. Fichiers modifiés et impacts sur le périmètre

**Lot 2.6.2 (code modifié, 9)** : `src/core/architecture.test.ts`, `src/core/matching/index.ts`,
`src/features/recipes/RecipeGrid.tsx`,
`src/features/recipes/components/{RecipeCard,RecipeBadges,RecipeListTabs}.tsx`, `src/index.css`,
`src/shared/i18n/{translations,derjaArabic}.ts`, `src/shared/ui/OfflineIndicator.tsx`.
**Lot 2.6.2 (nouveaux, code)** : `src/core/matching/{display,display.test}.ts`,
`src/shared/ui/{PageHeading,EmptyState,SkeletonList,Rail,Chips,Sheet,LinkTabs,linkComponent}.tsx(x)`
(+ tests), `src/features/recipes/components/MatchingBadge.tsx`,
`src/features/catalog/components/{PriceRange,Shelf,CategoryRail}.tsx` (+ `catalog.test.tsx`).
**Correctif distinct (2)** : `src/core/catalog/validation.ts` + `validation.test.ts`.
**Outil de vérification (jetable, conservé)** : `scripts/diagnostics/seed-lot262.ts`.
**Documents** : `plan-consolide` (statut + annexe arbitrages), `06-interface.md` (§ Composants
partagés), `03-domaine.md` (§ matching display + § lecture données externes), `CLAUDE.md`
(conventions couches 1–2), dossiers et rapports du lot.
**Hors périmètre** : `engine.ts`, `tiers.ts`, les écrans, `package.json` — **inchangés**.

## 8. Critères de clôture du dossier (§ 5-2-6) — état final

1. core display + tests ✓ 2. couche 1 + tests ✓ 3. couche 2 + tests ✓ 4. `RecipeCard` `grid` sans
   régression visible ✓ 5. tokens dans les fichiers du lot ✓ 6. matrice navigateur réelle ✓ (§ 3,
   limites § 5 documentées) 7. docs à jour ✓ 8. `npm run check` vert ✓ — **commit en attente de
   l'autorisation explicite du chef** (proposition : deux commits — le correctif d'abord, puis le lot).

**Arrêt** : rapport consolidé remis — aucun commit, aucune fusion, aucun push, aucun lot suivant.
