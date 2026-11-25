# Référence visuelle D4 — Chnawa Ntayeb (by chef Souhed)

> **Déplacement Étape C** : transféré de `docs/encyclopedie/mockups/d4/` (structure et chemins relatifs préservés, 167 fichiers vérifiés par hash).

Maquettes UX/UI issues de l'audit du 17/11/2026 (rapport : `audit.html`, décisions : `registre.html`).
Le paquet est autonome : D3 (archivé hors dépôt) n'est plus référencé. Les données et comportements simulés
sont démonstratifs : les règles métier restent celles de `src/core` (moteur et scénarios).

## Ouvrir

Servir le dossier `mockups/` avec n'importe quel serveur statique, puis ouvrir `d4/index.html`.
La pastille « ⚙ Démo » de chaque page bascule direction, mode, langue (RTL réel), compte (connecté / invité),
style de navigation desktop, réseau (hors ligne), notes de conception, publicité et les états propres à la page.

## Architecture : pages = blocs de composants (prêt pour un moteur CMS)

| Fichier | Rôle |
| --- | --- |
| `assets/data.js` | **Source unique** des données de démonstration (recettes, catégories, étals, frigo, planning, courses, favoris, historique, utilisateur, scan, bienvenue). |
| `assets/components.js` | Noyau : registre `CN.define`, montage `data-c`, rendu d'un schéma de page, état partagé des filtres et du planning, correspondance frigo ↔ recette ; composants recettes, filtres et planning. |
| `assets/cn/i18n.js` | **Toutes les chaînes des composants** en 4 langues + noms d’ingrédients et de catégories en écriture arabe (à faire relire — D-15). |
| `assets/cn/*.js` | Familles de composants : `common` (titres, onglets, notes, bandeaux, conteneurs), `home`, `fridge`, `recipe` (suggestions, fiche, mode cuisine), `flows` (scan, bienvenue, onboarding, connexion), `account` (courses, collections, notifications, profil). |
| `assets/components.css` | Styles par composant (préfixe `.cn-`), tokens de `app.css` uniquement. |
| `assets/app.css`, `assets/app.js` | Fondations : tokens des 4 directions, shell (en-tête, navigations, panneaux notifications et profil), i18n, carrousel, pastille Démo. |
| `tools/pages.mjs` | **Définition de toutes les pages** : métadonnées + liste ordonnée de blocs `{ c, props, show? }`. |
| `tools/generate-pages.mjs` | Génère les fichiers HTML des pages (`node tools/generate-pages.mjs`). Ne pas modifier ces fichiers à la main. |
| `composants-cms.html` | Catalogue **généré depuis le registre** : props, emplacements, bloc JSON, aperçu réel de chaque composant. |

### Ajouter ou modifier

- **Un composant** : `CN.define('nom', { title, desc, props: [[nom, type, défaut, rôle]], usedIn, example, render(props, el), mount(el, props) })`
  dans la famille qui convient ; il apparaît automatiquement dans le catalogue. Aucune donnée ni texte en dur : props, `data.js`, clés i18n.
- **Une page** : une entrée dans `tools/pages.mjs`, puis `node tools/generate-pages.mjs`.
- **Un emplacement de plus pour un composant existant** : ajouter un bloc `{ c, props }` — aucun code nouveau.
- **Un bloc dans un autre** : conteneurs `panel`, `tabs`, `warm-band`.
- **Un bloc selon un état** : `"show": { "attr": "data-home-state", "in": ["filled"] }`.

### Passage à l'application (React)

Chaque composant devient un fichier `src/features/…/<Nom>.tsx` avec les mêmes props ; le registre devient une table
`{ nom → composant }` utilisée par le rendu des pages enregistrées par le CMS ; `data.js` est remplacé par les stores
et ports existants (`src/application`). Les règles de matching de la maquette (`CN.match`) sont **illustratives** :
la référence reste `src/core` (moteur de matching et ses scénarios).

## Pages de documentation (non converties)

`fondations`, `boutons`, `champs`, `modale`, `listes`, `pastilles`, `bandeaux`, `onglets`, `shell`, `composants`,
`medias`, `publicite`, `parcours`, `responsive` restent des pages d'étude D3. `accueil.html` (A) et
`accueil-b.html` (B) sont archivées : la composition C a été retenue.

## Artefacts non versionnés

Hors dépôt (reproductibles ou étude D3) : `captures/` (75 JPG + rapport — commandes ci-dessous), `benchmark/`
 et `diagrammes.html` (étude de graphiques D3, sans dépendance D4), archives ZIP. Les pages HTML de ce dossier
sont générées par `tools/generate-pages.mjs` : ne jamais les modifier à la main.

## Correspondance (matching) : affichée, pas calculée

La maquette n'implémente pas le moteur. `data.js › STATES` déclare, pour chaque recette, ce que le moteur renverrait
(présents, à vérifier, manquants, substitutions possibles) ; `SCENARIOS` les surcharge pour les tests ; `SCENARIO_TESTS`
écrit à la main ce que l'écran doit afficher. `CN.match()` (vue) et `CN.ctaKind()` (action principale) sont les deux seules
règles d'affichage, utilisées partout. Vérification : `scenarios.html` (attendu vs affiché, en direct).

## Captures réelles

`node tools/capture.mjs http://localhost:4310/d4 captures "<chemin de msedge.exe ou chrome.exe>" <dossier de profil temporaire>`
— navigateur headless avec un profil jetable, fenêtre émulée par le protocole DevTools ; galerie : `captures.html`.
Paramètres d'adresse de démonstration : `?lang=ar&mode=dark&auth=guest&nav=edito`, `recette.html?id=kosksi`,
`accueil-c.html#state=empty`, `frigo.html#big`.
