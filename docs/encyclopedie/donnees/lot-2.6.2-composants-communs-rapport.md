# Rapport — Lot 2.6.2 « Composants communs & fondations »

**Statut** : implémentation **terminée, vérifiée** — rapport remis au chef. **Aucun commit, aucune
fusion, aucun lot démarré** — attente de la validation explicite du chef (le commit suivra son
autorisation, comme pour les lots précédents).
**Dossier d'exécution** : `lot-2.6.2-composants-communs-dossier.md` (v3 finale, validé) ; décision
d'autorisation de développement reçue du chef. Périmètre respecté : aucun fichier hors lot modifié
(§ 7), `engine.ts`/`tiers.ts` et les écrans **non touchés**, aucune dépendance ajoutée
(`package.json` inchangé).

---

## 1. Ce qui a été livré

### Core — règles d'affichage du matching (§ 1 du dossier)

- **`src/core/matching/display.ts`** (+ `display.test.ts`, exporté par `@/core/matching`) :
  - **séparation stricte** : le moteur (`engine.ts`, `tiers.ts`) reste la seule source de vérité du
    score et du tier ; `display.ts` **consomme le tier déjà calculé** et effectue **uniquement le
    mapping exhaustif** vers des niveaux d'affichage explicites (`all-present`/`almost`/`ideas`) ;
  - **aucun seuil recalculé ou réévalué**, aucune duplication ; `MatchingConfig.tiers` n'y est pas
    utilisé ;
  - retourne des **codes de raisons** (`missing-key`, `missing-secondary`, `substitution`,
    `unknown-quantity`, `missing-cost`) et des **identifiants d'ingrédients** — **aucun texte, aucune
    dépendance à la langue dans le core** (vérifié par test : aucune lettre accentuée dans les
    charges utiles) ;
  - les quantités inconnues restent distinctes des manquants (raison `unknown-quantity` systématique
    pour `all-present` — état actuel du modèle) ; l'état « quantité vérifiée suffisante » (6b.7b) se
    branchera **sans refonte** ;
  - action principale = `view-recipe` (CTA « Voir la recette » — **jamais** « Passer en mode
    cuisine »), `add-missing` en action secondaire quand il y a des manquants, `explore` pour
    `ideas`.
- **i18n** : 12 clés nouvelles × 4 langues (`translations.ts` + `derjaArabic.ts`) ; wording D1
  **« Tous les ingrédients semblent présents — quantités à vérifier »** + CTA « Voir la recette »
  conservé dans chaque langue (l'arabe littéral vérifié sans mot de derja par le test existant).

### Couche 1 — UI générique (`src/shared/ui/`) — 7 composants + types

| Composant                        | Contrat livré                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageHeading`                    | titre (`h1`), sous-titre, actions, variante `compact`                                                                                                                                             |
| `EmptyState`                     | **action exclusive** : union discriminée `kind: 'link' \| 'button'` — les deux simultanés impossibles à compiler ; lien natif par défaut, `LinkComponent` injectable (SPA préservée)              |
| `SkeletonList`                   | compose `Skeleton` (variantes `cards`/`lines`)                                                                                                                                                    |
| `Rail`                           | carrousel sans librairie, défilement **par quantités**, flèches ≥ 44 px **uniquement si le contenu déborde**, classes logiques RTL                                                                |
| `Chips` + `ChipFilter`           | boutons réels `aria-pressed`, cibles ≥ 44 px                                                                                                                                                      |
| `Sheet`                          | **composition** de `ModalShell` (Échap au sommet de la pile, clic extérieur, portail, `mobile='bottom'`) + `useCloseOnBack` — **aucun second système de modales**, scroll = celui de `ModalShell` |
| `LinkTabs` + `linkComponent.tsx` | liens réels, `href` en props, `aria-current="page"`, **jamais** `tablist`, **jamais d'import du routeur** ; `<a href>` natif par défaut, `LinkComponent` injectable                               |
| (`OfflineStrip`)                 | évolution de `OfflineIndicator` : message en prop (repli `t.offlineNotice`), classes logiques RTL                                                                                                 |

### Couche 2 — métier réutilisables

- **`MatchingBadge` + `MatchReason`** (`features/recipes/components/`) : consomment les **codes** du
  core, portent **toute la traduction** (séparateur de noms selon la famille : `,` ou `،`) ;
  styles par niveau **tokens uniquement**.
- **`PriceRange`**, **`CategoryRail`**, **`Shelf`** (`features/catalog/components/`, dossier nouveau) :
  fourchette via `formatPriceRange` ; tuiles catégories sur le `Rail` partagé (photo ou initiale
  `tint`, lien réel) ; étal éditorial (titre + « tout voir » + contenu).
- **`RecipeCard`** (variante `grid` **seule** — décision du chef) :
  - **navigation par callback conservée** (`useOpenRecipe`, état `background`) ;
  - **coût en props** (`getRecipeCost` appelé par `RecipeGrid` — le composant n'importe plus le
    contexte applicatif) ;
  - **favori 44×44 px** (cercle visuel 32 px inchangé, cible réelle agrandie) ;
  - **migration tokens** : `slate-*` → `bg-line`/`text-ink-muted`/`bg-card`… ; badges `emerald` →
    `success` ; overlays photo → **tokens fixes `--color-scrim`/`--color-on-scrim`** (ajoutés à
    `@theme`, indépendants du thème comme une photo) ; classes physiques `left/right` → `start/end`
    (RTL) ; `text-left` → `text-start`.
- **`RecipeBadges`** : palette `slate`/`emerald` → tokens (`bg-line`/`text-ink`,
  `bg-success/10 text-success-text`).
- **`RecipeListTabs`** → consomme `LinkTabs` via **adaptateur `RouterLinkAdapter`** (`href`→`to`,
  `replace`) dans son module ; `RecipeGrid` passe le coût en props.

### Garde d'architecture (extension dans `architecture.test.ts`)

- Les composants génériques du lot (`shared/ui/*`) **n'importent jamais le routeur** (l'adaptateur
  `RecipeListTabs` est le seul importeur documenté) ;
- **zéro couleur en dur** dans les 16 fichiers du lot (garde positive, regex partagée avec 2.6.1b) —
  validée après correction de `OfflineIndicator` (`border-white/20 text-white` → `border-on-accent/20`
  sur fond `bg-accent`, `left/right` → `start/end`).

---

## 2. Tests automatisés (`npm run check` **vert**)

**923 tests / 29 skippés / 106 fichiers** (baseline 886 → **+37**) :

- `display.test.ts` (7) : mapping exhaustif tier→niveau (chaque tier mappé), ordre des raisons,
  `unknown-quantity` systématique pour `all-present`, `view-recipe`/`add-missing`/`explore`,
  **core sans texte** ;
- composants (30) : `PageHeading` (3), `EmptyState` (5, union discriminée + SPA injectée),
  `Sheet` (3 + 3 `SkeletonList`, portails, Échap/clic extérieur via `ModalShell`), `LinkTabs` (4,
  liens natifs sans attribut `replace`, adaptateur recevant `href`), `Rail`/`ChipFilter` (2),
  catalog (9 : `PriceRange`, `MatchingBadge`/`MatchReason` fr + ar, `Shelf`, `CategoryRail`) ;
- architecture : garde routeur + garde palette du lot ;
- régressions : 0 (toute la suite existante reste verte, `translations.test.ts` inclus).

---

## 3. Vérifications navigateur réellement effectuées

Serveur **isolé** port 3001 (`DATA_STORE=sql` sur un fichier SQLite **jetable** de test, seed
`scripts/diagnostics/seed-lot262.ts` : 4 recettes + 7 ingrédients avec unités — **aucune donnée
réelle, port 3000 du chef intact**) ; harnais iframe à largeur exacte (supprimé après vérification).

### 3.1 Comparaison avant/après `RecipeCard` + `RecipeListTabs` (§ 5-2-3 et 5-2-4 du dossier)

Méthode : fichiers HEAD (« avant ») placés sur disque → mesures calculées → restauration du lot
(« après ») → mêmes mesures (l'outil de capture d'écran a échoué deux fois — timeout — la comparaison
a donc été faite **par valeurs calculées**, plus précises ; les deux états mesurés en réel) :

| Métrique                                    | Avant (HEAD)                | Après (lot)                 | Verdict                                        |
| ------------------------------------------- | --------------------------- | --------------------------- | ---------------------------------------------- |
| Cercle favori : centre, taille, fond, rayon | (310, 26), 32 px, identique | (310, 26), 32 px, identique | **inchangé** (cible réelle 44×44, non visible) |
| Onglets : couleurs actif/inactif, fond      | identiques                  | identiques                  | **inchangé**                                   |
| Hauteur de pastille d'onglet                | 32 px                       | **44 px**                   | correction voulue du dossier (cible ≥ 44)      |
| Fond média / badges                         | `slate-100` (gris fixe)     | token `bg-line` du thème    | **migration tokens voulue** (suit le thème)    |
| Couleurs méta/titre                         | identiques                  | identiques                  | inchangé                                       |

### 3.2 Navigation et retour à la liste (`RecipeCard`, état `background`)

Vérifié **en réel** (clic titre → `/recipe/:slug` → **état `background` présent dans l'historique**
→ retour → URL `/recipes`) : l'ouverture, l'état de fond et le retour fonctionnent.
**Écart honnête important** : après ce retour, l'application **se démonte** (écran vide) avec
`TypeError: ... 'trim'` dans `unitLookupKey` (`src/core/units/info.ts`) via `UnitInfo` →
`CatalogStore.unitDescriptionOf`. **Ce défaut existe à l'identique sur HEAD** (vérifié : mêmes
symptômes, mêmes étapes, même seed) — il est **préexistant, hors du périmètre du lot** (aucun fichier
du lot n'est dans la pile d'erreur) et aucune régression du lot. Il est probablement déclenché par le
jeu de données de test (unités), mais il constitue un crash réel d'application **à traiter** :
**décision demandée au chef** (correction hors lot — par exemple un garde dans
`useUnitDescription`/`UnitInfo` — dans un lot ou un hotfix dédié). Une fois **garde appliquée par
diagnostic temporaire** (patch jetable, retiré), le flux complet réussit : 4 cartes rendues après le
retour — ce qui confirme que le reste du chemin (retour + liste) est sain.

### 3.3 Cibles tactiles ≥ 44 px, chevauchements, débordements (composants du lot)

Mesurés sur `/recipes` (cibles du lot = onglets `LinkTabs` + favori `RecipeCard`) :

| Viewport | Cibles du lot | < 44 px | Chevauchements | Débordement horizontal |
| -------- | ------------- | ------- | -------------- | ---------------------- |
| 320 px   | 4             | **0**   | **0**          | **0**                  |
| 375 px   | 6             | **0**   | **0**          | **0**                  |
| 768 px   | 6             | **0**   | **0**          | **0**                  |

(Cibles **hors lot** observées < 44 px sur `/recipes` : boutons de la barre de filtres existante et
bandeau d'installation — préexistants, non touchés, à corriger dans leurs propres lots.)

### 3.4 Langues, RTL, mode sombre (4 langues × clair/sombre, 320 px)

| Langue   | dir     | Cartes | Onglets traduits | Favori en RTL                        | Débordement |
| -------- | ------- | ------ | ---------------- | ------------------------------------ | ----------- |
| fr       | ltr     | 4      | ✓                | à droite                             | 0           |
| ar       | **rtl** | 4      | ✓                | **à gauche (logique `start/end` ✓)** | 0           |
| derja    | ltr     | 4      | ✓                | à droite                             | 0           |
| derja_ar | **rtl** | 4      | ✓                | **à gauche**                         | 0           |

Mode sombre : classe `dark` appliquée, carte sur fond sombre, 0 débordement. `/suggestions` :
onglets avec `aria-current` correct, état vide affiché, 0 débordement.

### 3.5 Performances — mesures réelles conservées (§ 5-2-2 du dossier)

LCP à chaud ×3 par état, page `/recipes`, 1280 px (onglet de vérification masqué — l'environnement
rapporte quand même le LCP ; **mesures bruitées** : dérive ascendante visible _dans un même état_) :

| État         | LCP (ms)          | Médiane  | CLS           |
| ------------ | ----------------- | -------- | ------------- |
| Avant (HEAD) | 796 · 1192 · 1584 | **1192** | 0 · 0 · 0,011 |
| Après (lot)  | 1044 · 1108 · 884 | **1044** | 0 · 0 · 0     |

Médiane après **<** médiane avant (**−148 ms**) : **aucun signe de dégradation**. **Limites honnêtes** :
3 mesures à chaud = **première vérification, pas une garantie statistique** (dossier § 5-2) ; les
valeurs absolues sont bruitées (dérive d'environnement observée dans les deux séries, CLS 0,011 isolé
— probablement le bandeau d'installation, hors lot) ; conditions identiques avant/après (même
serveur, même seed, même page, cache à chaud).

---

## 4. Écarts et points non vérifiés (transparence)

1. **Capture d'écran** : l'outil de capture a échoué (2 timeouts) — la comparaison avant/après a été
   faite par **mesures calculées** (plus précises) ; aucune capture jointe.
2. **CLS de `Sheet`** : `Sheet` n'a **pas encore de consommateur d'écran** (adoption aux lots
   consommateurs, A-4) — son comportement est vérifié par tests happy-dom (Échap, clic extérieur,
   portail) ; la vérification CLS réelle de son ouverture se fera à sa première adoption (2.6.3+).
3. **Composants non adoptés** (`PageHeading`, `EmptyState`, `SkeletonList`, `Rail`, `Chips`,
   `MatchingBadge`, `PriceRange`, `CategoryRail`, `Shelf`) : vérifiés par leurs tests ; leur
   vérification en conditions réelles d'écran suivra leur adoption (aucun écran réécrit, A-4).
4. **Wording D1 sur `/suggestions`** : les cartes de la liste affichent encore les libellés de tier
   actuels (`readyBadge`…) — l'adoption des nouveaux badges se fera au lot 2.6.4 (le lot 2.6.2 livre
   la règle et les composants, sans réécrire les écrans).
5. **Défaut préexistant hors lot** (§ 3.2) : crash `unitLookupKey` après retour depuis une fiche —
   **décision du chef demandée**.
6. LCP/CLS : bruit d'environnement documenté (§ 3.5) ; pas de mesure en conditions « visibles »
   (l'onglet de vérification reste masqué dans cet environnement).

## 5. Périmètre Git (diff non commité)

**Modifiés (10)** : `src/core/architecture.test.ts`, `src/core/matching/index.ts`,
`src/features/recipes/{RecipeGrid.tsx, components/{RecipeCard,RecipeBadges,RecipeListTabs}.tsx}`,
`src/index.css`, `src/shared/i18n/{translations.ts,derjaArabic.ts}`,
`src/shared/ui/OfflineIndicator.tsx` — plus les documents (`plan-consolide`, `06-interface.md`,
`03-domaine.md`, `CLAUDE.md`, dossier 2.6.2).
**Nouveaux (code)** : `src/core/matching/{display.ts,display.test.ts}`,
`src/shared/ui/{PageHeading,EmptyState,SkeletonList,Rail,Chips,Sheet,LinkTabs,linkComponent}.tsx(x)`
(+ tests), `src/features/recipes/components/MatchingBadge.tsx`,
`src/features/catalog/components/{PriceRange,Shelf,CategoryRail}.tsx` (+ `catalog.test.tsx`).
**Jetables** : `scripts/diagnostics/seed-lot262.ts` (seed de vérification, conservé comme outil),
harnais `public/__shell-harness.html` (supprimé après vérification), serveur 3001 **arrêté**,
`package.json` **inchangé** (aucune dépendance).

## 6. Critères de clôture du dossier (§ 5-2-6)

1. core display + tests ✓ 2. couche 1 + tests ✓ 3. couche 2 + tests ✓ 4. `RecipeCard` `grid`
   réfactoré sans régression visible ✓ (§ 3.1) 5. tokens dans les fichiers du lot ✓ (garde verte)
2. matrice navigateur réelle ✓ (§ 3.3–3.4, écarts § 4 documentés) 7. docs à jour ✓ (06, 03, CLAUDE.md,
   plan consolidé) 8. `npm run check` vert ✓ — **commit en attente de l'autorisation explicite du chef**.

**Arrêt** : rapport remis — aucun commit, aucune fusion, aucun push, aucun lot suivant.
