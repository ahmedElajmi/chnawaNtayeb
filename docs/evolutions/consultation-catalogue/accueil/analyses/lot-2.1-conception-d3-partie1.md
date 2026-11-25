# Lot 2.1 — Conception graphique et prototypage (D3 partie 1) : dossier de réalisation (à examiner avant tout développement)

**Statut** : dossier présenté — **en attente d'examen du chef** · **aucun développement lancé**
**Lot** : 2.1 (phase 2, plan § 6) · **Dépend de** : validation du plan (0.1 fait) — **prérequis réuni**
**Décisions 🚩 prévues par le plan** : 🚩 **validation de l'identité visuelle** + 🚩 **choix des solutions de diagrammes** — prises par le chef **sur les livrables du lot**, jamais d'avance.
**Périmètre** : **conception et maquettes uniquement — aucune implémentation définitive** ; les fonctionnalités et l'expérience existantes bornent les propositions (aucune régression des parcours en phases ultérieures).

---

## 1. Synthèse

- **L'état visuel existant est le point de départ, pas une page blanche** : le système de thèmes **existe déjà** comme donnée (`src/core/theme/builtinThemes.ts` — thèmes intégrés `classique` et `fkhar · Nabeul`, éditables en backoffice, jamais supprimables), avec un **vocabulaire de tokens complet** — **16 tokens de couleur** (brand, brandStrong, brandText, onBrand, accent, accentStrong, accentText, onAccent, highlight, surface, card, line, ink, inkMuted, heroFrom, heroTo), chacun décliné **clair et sombre** (les variantes sont des valeurs du même token, pas des tokens distincts) — plus **3 tokens structurels** (`displayFont`, `cardShape`, `pattern`). Les 16 tokens de couleur sont déjà exposés à Tailwind 4 comme variables CSS (`src/index.css`, `@theme`, une variable `--color-*` par token). La typographie est déjà bilingue : **Plus Jakarta Sans** (latin) + **Cairo** (arabe, `src/index.css:46–51`).
- **Les 4 langues et le RTL existent** dans le domaine (`src/core/shared/language.ts` — `fr` LTR, `ar` et `derja_ar` **RTL**, `derja` LTR, avec `htmlLang`, `collation` et chaînes de repli par langue) — les maquettes doivent s'appuyer sur ces constats, pas en inventer d'autres.
- **Aucune bibliothèque de diagrammes n'est présente** (recherche : zéro usage) — l'étude comparative part de zéro, avec une contrainte **d factualité : React 19.0.1 + Tailwind 4.3.3 + Vite** (compatibilité React 19 = critère éliminatoire, plusieurs bibliothèques populaires ont eu des problèmes 2.x/React 19).
- **Livrable du lot** : un **paquet de maquettes D3 navigable** (pages HTML autonomes, suivant le motif existant `docs/encyclopedie/mockups/backoffice.html`), examiné par le chef dans le navigateur — avec bascules thème clair/sombre, langue/RTL, largeurs 320/375/768/1280 — plus la fiche de tokens, la grille de composants et l'étude comparative des diagrammes avec prototypes exécutables.
- **Ce que le lot ne fait pas** : aucune implémentation dans l'application (aucun composant React intégré, aucune modification de `src/`), aucun choix définitif sans accord du chef, aucun travail des lots 2.2+ (navigation, tableaux) ni de D4–D6.

## 2. Rappel du lot (plan § 6, verbatim condensé)

> **Conception graphique + prototypage (D3 partie 1)** : direction visuelle (tokens proposés, typo, couleurs, espacement, rayons), maquettes de composants, thème clair/sombre, RTL, 4 langues ; **étude comparative des solutions de diagrammes** (composants internes vs bibliothèques existantes : performance, poids frontend, accessibilité, maintenance) + prototype — **conception et maquettes seulement, aucune implémentation définitive**.
> **Existant** : C conventions, M shell existant. **Critère** : 375/320 px, RTL et 4 langues vérifiés sur les maquettes. 🚩 validation identité visuelle + 🚩 choix diagrammes.

## 3. État vérifié du code — ce sur quoi la conception s'appuie

| Élément                       | État vérifié (evidence)                                                                                                                                                                                                                                                                                                                                                                                                                            | Conséquence pour la conception                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Système de thèmes             | `builtinThemes.ts` : `classique` + `fkhar` intégrés ; chaque thème porte **light + dark** des **16 tokens de couleur** (`THEME_COLOR_KEYS` : brand, brandStrong, brandText, onBrand, accent, accentStrong, accentText, onAccent, highlight, surface, card, line, ink, inkMuted, heroFrom, heroTo) **+ 3 tokens structurels** (`displayFont`, `cardShape`, `pattern`) ; thèmes **données en base, éditables backoffice, intégrés non supprimables** | Les maquettes montrent l'identité **à travers le vocabulaire de tokens existant** ; toute extension du vocabulaire = évolution de modèle → signalée au chef (§ 6-1)           |
| Tokens consommés              | `src/index.css` (`@theme`) expose **16 variables CSS** (`--color-*`, une par token de couleur)                                                                                                                                                                                                                                                                                                                                                     | Les maquettes utilisent les mêmes noms de tokens → un choix validé se traduit sans traduction                                                                                 |
| Typographie                   | Plus Jakarta Sans (latin) + Cairo (arabe) déjà en place                                                                                                                                                                                                                                                                                                                                                                                            | La direction propose l'échelle/les graisses ; changer de famille = décision du chef (§ 6-2)                                                                                   |
| Langues / RTL                 | `LANGUAGES` : 4 langues, `dir: 'rtl'` pour `ar` et `derja_ar`, replis par langue                                                                                                                                                                                                                                                                                                                                                                   | Les maquettes intègrent les 4 langues et le RTL **pour ces codes exacts**                                                                                                     |
| Composants partagés existants | `src/shared/ui/` : ModalShell, IngredientThumb, ShowMore, ScrollToTopButton, InstallBanner, PasswordInput, PhoneInput, UnitInfo, OfflineIndicator, UpdatePrompt…                                                                                                                                                                                                                                                                                   | Le paquet de maquettes **couvre ces composants avec leurs états** — les conventions validées (fenêtres, retour arrière, listes longes) sont **préservées dans la conception** |
| Shell et navigation           | `src/app/layout/Header.tsx` + `BottomNav.tsx` ; en-tête mobile avec marque « Chnowa Ntayeb / by Chef Souhed » lisible ; badge super admin dans Réglages sur téléphone                                                                                                                                                                                                                                                                              | Comportements existants bornent les maquettes (§ 4-C1)                                                                                                                        |
| Écrans concernés              | `src/features/` : account, fridge, grocery, home, planner, recipes, suggestions, settings, backoffice                                                                                                                                                                                                                                                                                                                                              | Le paquet D3 partie 1 = **fondations + shell** (D3), pas les écrans complets (2.2 : navigation/tableaux/prévisualisation)                                                     |
| Motif de maquette existant    | `docs/encyclopedie/mockups/backoffice.html` (maquette autonome existante)                                                                                                                                                                                                                                                                                                                                                                          | Format de livraison repris et généralisé (§ 4-C3)                                                                                                                             |
| Diagrammes                    | **Aucune bibliothèque ni usage** ; React 19.0.1 / Tailwind 4.3.3 / Vite                                                                                                                                                                                                                                                                                                                                                                            | Étude contrainte par la compatibilité React 19 (§ 4-C4)                                                                                                                       |

## 4. Conception proposée — cinq chantiers

### C1 — État des lieux et garde-fous (l'existant ne régresse pas)

Inventaire visuel de ce qui **fonctionne aujourd'hui** et doit rester : parcours réels (frigo → suggestions → recette → courses), en-tête mobile avec marque lisible, barre collante du frigo, fenêtres `ModalShell` (clic extérieur + Échap, fermeture par retour), listes longes paginées (24/page, `ShowMore`), compteurs sur total juste, pastilles d'ingrédients sans photo, bandeau d'installation, réglages en onglets courts, backoffice en pages adressées. Ces conventions sont **des contraintes de conception**.

**Non-régression visuelle ≠ non-régression fonctionnelle — deux niveaux, jamais confondus** :

- **Lot 2.1 (ce lot)** : **documenter** les conventions fonctionnelles existantes et démontrer que les propositions graphiques **les respectent visuellement et dans leurs interactions simulées** — les maquettes HTML autonomes ne peuvent **pas** prouver la préservation des comportements réels de l'application ; **aucune convention n'est présentée comme fonctionnellement validée sur la seule base d'une maquette** ;
- **Lots d'implémentation ultérieurs** (2.8 et suivants) : vérifier la conservation **effective** des comportements par des **tests de non-régression fonctionnelle** (parcours réels, fenêtres, retours, listes longes) — c'est là, et seulement là, que la non-régression fonctionnelle est démontrée.

### C2 — Direction visuelle proposée (à examiner — rien de validé d'avance)

Une **proposition** organisée en fiche de tokens, construite sur le vocabulaire existant :

1. **Identité** : ce qui fait Chnawa Ntayeb — la cuisine tunisienne contemporaine par un chef ; les ancrages proposés (terracotta/fkhar, vert zébuglu classique, touches safran) restent **des options illustrées**, comparées côte à côte sur une même maquette ;
2. **Couleurs** : la palette proposée par rôle (brand / accent / highlight / surfaces / lignes / encres) en clair **et** sombre, avec ratios de contraste **WCAG AA mesurés et affichés** sur la fiche ;
3. **Typographie** : échelle (12→32 px), graisses, interlignage, chiffres tabulaires pour les prix ; familles actuelles (Plus Jakarta Sans + Cairo) par défaut, alternatives montrées côte à côte ;
4. **Espacements et rayons** : échelle 4/8/12/16/24/32, rayons (carte, bouton, champ, pastille), ombres (deux niveaux max), focus visible uniforme ;
5. **Tokens** : la fiche reprend **les 16 tokens de couleur existants + les 3 structurels** et propose les valeurs — tout token nouveau est **signalé comme extension du modèle** (conséquence § 6-1) ; les variantes clair/sombre restent des valeurs du même token (jamais comptées deux fois).

- Chaque proposition est **comparée** : au minimum deux directions contrastées (ex. « classique chaleureux » vs « contemporain sobre ») sur une maquette identique, pour un choix éclairé.

### C3 — Paquet de maquettes D3 (le livrable central)

**Pages HTML autonomes** sous `docs/encyclopedie/mockups/d3/`, navigables, avec bascules : thème (clair/sombre), langue (4, dont RTL réel pour `ar`/`derja_ar`), largeur (320/375/768/1280).

**Volume maîtrisé — matrice de couverture représentative (pas de catalogue exhaustif)** : les bascules sont des **contrôles sur chaque page**, jamais des pages en plus — il n'y a pas 10 pages × 4 langues × 4 largeurs × 2 thèmes. Chaque composant ne présente que **les états qui lui sont réellement applicables**. Couverture cible (~10 pages + 1 parcours navigable) :

| Page de maquette                                                       | États représentés (applicables uniquement)                                                                                            | Bascules actives sur la page                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Fondations (palette, typo, échelles, rayons, focus, icônes, pastilles) | Couleurs en clair/sombre côte à côte, échelle typographique complète, focus visible                                                   | clair/sombre · 4 langues · 320/375/768/1280              |
| Boutons                                                                | repos, focus clavier, actif, désactivé, chargement ; variantes principal/secondaire/danger                                            | clair/sombre · fr + ar (RTL) · 375/1280                  |
| Champs de saisie                                                       | repos, focus, erreur (+ message), aide, désactivé, saisie en cours                                                                    | clair/sombre · fr + derja_ar · 375/1280                  |
| Fenêtre `ModalShell`                                                   | ouverte, erreur de saisie à perdre                                                                                                    | clair/sombre · fr · 375/768                              |
| Listes                                                                 | vide, chargement (squelette), erreur, hors-ligne, paginée + suite au défilement                                                       | clair/sombre · fr + ar · 320/375/1280                    |
| Pastilles d'ingrédient                                                 | avec photo, sans photo, lien cassé                                                                                                    | clair/sombre · fr + ar · 375                             |
| Bandeaux                                                               | installation, hors-ligne, mise à jour                                                                                                 | clair/sombre · fr + ar · 320/375                         |
| Onglets réglages + recherche d'ingrédient (suggestions)                | onglet actif/inactif, suggestions affichées                                                                                           | clair/sombre · 4 langues · 375/1280                      |
| Shell                                                                  | en-tête (marque lisible à 320 px), navigation basse mobile, squelette desktop, badge + sortie super admin dans Réglages sur téléphone | 320/375/768/1280 · fr + ar                               |
| Parcours fonctionnel (frigo → suggestions → recette → courses)         | démo navigable à **interactions simulées**                                                                                            | 375 px · fr (parcours) + ar (même parcours, passage RTL) |

Total : **10 pages de maquettes + 1 parcours navigable** — chaque invariant (320/375 px sans élargissement, RTL complet, 4 langues, clair/sombre sans zone non couverte) est vérifié là où il est pertinent, pas partout.

**Parcours fonctionnel proportionné** : le parcours frigo → suggestions → recette → courses reste une **démonstration visuelle navigable** — **interactions simulées** (sélection, ajout, navigation) sur des **données factices figées** dans la page : **aucune logique métier réelle, aucune connexion aux services de l'application, aucune reconstruction de fonctionnalités** ; les écrans complets restent dans les lots ultérieurs (D1/D2 : 2.6).

**Vérifications intégrées à chaque page** : 320/375 px sans élargissement, RTL complet (miroirs, chiffres, prix, champs téléphone), les 4 langues avec textes réels (pas du lorem), clair/sombre sans zone non couverte.

- Chaque page affiche **en en-tête** la checklist de validation qu'elle démontre (états couverts, tailles, RTL).

**Accessibilité vérifiée sur les maquettes** (en complément des contrastes WCAG AA) : **focus clavier visible** sur tous les composants interactifs, **navigation clavier** démontrée (ordre de tabulation logique, pas de piège), **libellés et associations** (champ↔étiquette, bouton↔action explicite), **messages d'erreur liés à leur champ** et compréhensibles sans couleur seule, **états interactifs distincts** (hover desktop, actif, focus, désactivé) y compris au clavier, **alternatives textuelles** pour les pastilles d'ingrédient et toute image informative.

### C4 — Étude comparative des diagrammes + prototypes

**Besoin cible** (phases 7 et 9) : graphiques d'analytics et d'éditorial — barres, lignes/aires, anneaux, éventuellement barres empilées ; volumes modestes (séries temporelles de trafic, comptages) ; intégration au design system (tokens clair/sombre), RTL, accessibilité.

**Candidats comparés** (fiche de comparaison factuelle, chaque colonne sourcée — versions et compat React 19 vérifiées à l'instant de l'étude) :

1. **Composants internes** (SVG/React maison sur les tokens) — poids minimal, contrôle total, coût de maintenance interne, accessibilité à construire ;
2. **Recharts 3** (React natif, très répandu) ;
3. **Chart.js 4 + react-chartjs-2** (canvas, léger) ;
4. **visx** (modulaire, D3 bas niveau, poids à la carte) ;
5. **ECharts** et **ApexCharts** (complets, plus lourds) — comparés pour montrer pourquoi ils sont écartés ou retenus.

**Critères pondérés** (la pondération est soumise au chef) : poids frontend (bundle gzip mesuré sur un import réel), performance (rendu 1k–10k points, animation), **compat React 19** (éliminatoire), accessibilité (clavier, ARIA, alternatives texte, contrastes), RTL et thème clair/sombre, maintenance (activité, types TS, adhésion React/Vite), licence, courbe d'apprentissage.

**Protocole de benchmark — comparaison objective et mesurée** :

1. **Versions et compatibilité React 19 vérifiées à l'instant de l'étude** (registre npm, `peerDependencies`, journal des versions) — un candidat incompatible est **écarté avant toute mesure** ;
2. **Poids mesuré sur un build de production Vite** (minifié + gzip, **tree-shaking réel**) : chaque candidat est importé de la même manière dans le **même petit projet de démonstration** ; le poids rapporté est le **delta** vs la baseline sans bibliothèque, pas la taille nominale annoncée ;
3. **Mêmes graphiques et mêmes données** : un corpus de données factices **fixe et versionné dans la page** (trois types de graphiques : barres, lignes/aires, anneaux) ;
4. **Mêmes conditions, plusieurs exécutions** : même machine, même navigateur, même fenêtre ; **5 exécutions par candidat** par mesure ; **médianes et dispersion (min/max) rapportées** — jamais une valeur isolée ;
5. **Mesures de performance** (par corpus de **200, 1 000 et 5 000 points**, mêmes graphiques, mêmes données, conditions identiques pour tous les candidats) :
   - **temps de rendu initial** (première peinture complète du graphique) ;
   - **temps de mise à jour des données** (remplacement complet du jeu de données, même volume) ;
   - **réactivité lors d'une interaction représentative** (survol/légende ou filtre — mesurée sur l'interaction commune la plus riche supportée par tous) ;
   - **limites ou dégradations observées à 5 000 points** (latence constatée, animation désactivée par le candidat, dégradation visuelle) — décrites factuellement.
     Le protocole reste **simple, reproductible et identique pour tous les candidats** — **aucun laboratoire de benchmark complexe** : les pages de démonstration intègrent leur propre mesure (script de bench déclenchable, résultats affichés sur la page), exécutées dans le même navigateur, en 5 passages ;
6. **Accessibilité réelle vérifiée sur le prototype** : navigation clavier (tabulation, focus visible), rôles et **libellés ARIA**, **alternative textuelle** pour chaque graphique (table de données ou description), contrastes des libellés — l'accessibilité du prototype est un critère, pas une promesse de documentation ;
7. **Proportion aux besoins** : les besoins de l'application sont modestes (analytics, volumes limités) ; une solution surdimensionnée au regard de ces besoins est **signalée comme telle**. Priorités : **poids frontend, accessibilité, facilité de maintenance** avant la richesse de fonctionnalités.

### C5 — Livrables et critères de validation (ce que le chef valide)

| Livrable                            | Critère de validation concret                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fiche de tokens (clair + sombre)    | Contrastes AA affichés et mesurés ; vocabulaire existant respecté ; extensions signalées                                                                                                                                                                                                                                                                                                                                                         |
| Deux directions visuelles comparées | Lisibilité immédiate de l'information, identité reconnaissable, choix possible en connaissance de cause                                                                                                                                                                                                                                                                                                                                          |
| Paquet de maquettes D3              | **Matrice de couverture respectée** (~10 pages + 1 parcours navigable ; états applicables uniquement) ; **375/320 px** sans élargissement ; **RTL** réel pour `ar`/`derja_ar` ; **4 langues** avec textes réels ; parcours navigable à interactions simulées (aucune logique réelle) ; conventions existantes préservées ; **accessibilité vérifiée** (focus clavier, navigation, libellés, erreurs, états interactifs, alternatives textuelles) |
| Étude comparative diagrammes        | **Protocole de benchmark respecté** : versions et compat React 19 vérifiées ; poids mesuré sur build Vite de production après tree-shaking (delta vs baseline) ; mêmes graphiques et données ; mêmes conditions, 5 exécutions, **médianes + dispersion** ; accessibilité réelle du prototype (clavier, ARIA, alternatives textuelles) ; options surdimensionnées signalées ; **aucun choix avant votre 🚩**                                      |
| Registre des décisions              | Chaque proposition porte son statut : proposée / à arbitrer / validée — rien d'implicite                                                                                                                                                                                                                                                                                                                                                         |

## 5. Analyse de non-régression explicite

| Existant                            | Risque                                                                                                        | Garde                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Fonctionnalités et parcours actuels | Une conception « jolie » qui casse des conventions validées (fenêtres, retour, listes longes, marque lisible) | C1 : conventions = contraintes ; démonstration sur les maquettes                                                          |
| Système de thèmes en base (données) | Une fiche de tokens qui renomme ou supprime des tokens existants                                              | Vocabulaire existant conservé ; extensions signalées (§ 6-1)                                                              |
| Typographie bilingue                | Une famille qui dégrade le rendu arabe (Cairo)                                                                | Alternatives comparées sur du texte arabe réel, jamais du lorem                                                           |
| Aucun code de `src/`                | Dérapage vers l'implémentation                                                                                | Périmètre : `docs/encyclopedie/mockups/d3/` + documents — zéro modification de l'application, vérifiable par `git status` |

## 6. Micro-arbitrages proposés (à valider avec le dossier)

1. **Vocabulaire de tokens** : recommandation — **réutiliser les 16 tokens de couleur + 3 structurels existants** comme base de la fiche (ajouter au maximum des tokens d'échelle : espacement, rayons, ombres, focus) ; tout ajout au modèle `AppTheme` sera présenté comme **extension de modèle**, sachant que la règle d'analyse d'impact (portabilité/migration) se formalise à la validation du lot 1.5 — elle s'appliquera d'ici là selon les principes déjà validés.
2. **Format de livraison des maquettes** : recommandation — **pages HTML autonomes** (motif `backoffice.html` existant) avec bascules intégrées, plutôt que des captures figées : le chef navigue, change de langue/thème/largeur, et valide ce qu'il voit.
3. **Familles typographiques** : recommandation — conserver Plus Jakarta Sans + Cairo (déjà en place, déjà payées en poids), la proposition porte sur l'échelle et les graisses ; tout changement de famille reste une décision du chef sur comparaison.
4. **Pondération des critères diagrammes** : proposition soumise au chef avec le tableau (aucun choix de bibliothèque avant son 🚩).

## 7. Ce que le lot 2.1 ne fait pas (rappels validés, non discutés)

- **Aucune implémentation définitive** dans l'application — **aucune modification de `src/`**, aucune intégration React/Tailwind, aucune modification d'`AppTheme` (les tokens proposés restent une fiche de conception), aucun choix définitif de bibliothèque de diagrammes — tout est maquette et prototype autonome ;
- **Aucun développement avant validation explicite du dossier** : le lot démarre uniquement sur votre accord après intégration des corrections ;
- **Aucune validation d'avance** : identité visuelle et choix des diagrammes = 🚩 du chef **sur les livrables** ;
- **Aucun travail D3 partie 2** (navigation, tableaux, prévisualisation — lot 2.2), ni D4 (laboratoire), ni D5 (éditeurs), ni D1/D2 (app client, moteur visible) — **les écrans complets restent dans les lots ultérieurs** ; le parcours fonctionnel des maquettes est une **démonstration simulée**, jamais une reconstruction ;
- Aucun travail de la phase 5a (traité séparément avec vos cas métier) ;
- Aucune mise à jour de la documentation générale — les livrables du lot suffisent (règle permanente du plan § 1).

## 8. Méthode et preuves

- Lectures intégrales : `src/core/theme/builtinThemes.ts` et `src/core/theme/types.ts` (**16 tokens de couleur** dans `THEME_COLOR_KEYS`, chacun en variantes clair/sombre ; **3 tokens structurels** : `displayFont`, `cardShape`, `pattern` ; 6 polices d'affichage disponibles), `src/core/shared/language.ts` (4 langues, dir/collation/replis), `src/index.css` (16 variables CSS `--color-*` exposées par `@theme`, polices, RTL), inventaire `src/shared/ui/` (14 composants), `src/app/layout/` (Header, BottomNav), liste des écrans `src/features/`, maquette existante `docs/encyclopedie/mockups/backoffice.html`.
- Recherches : aucune bibliothèque de diagrammes présente ; versions verrouillées (React 19.0.1, Tailwind 4.3.3) — la compat React 19 est un critère éliminatoire de l'étude.
- Conventions préservées citées depuis `CLAUDE.md` et le plan (§ 3 : critères de validation UX — parcours réels, simplicité, états complets, compréhension immédiate, fluidité, responsive, cohérence mobile/desktop).

## 9. Résultats exécutés (benchmark et maquettes — réalisés après validation du lancement)

### 9.1 Poids mesuré (build Vite de production, minifié + gzip, tree-shaking réel)

Baseline « interne » (React 19 seul, mêmes pages) = **70,9 kB gzip** ; le poids rapporté est le delta du bundle total
chargé par page (entrée + chunks partagés) :

| Candidat                       | gzip total | delta vs interne |
| ------------------------------ | ---------- | ---------------- |
| Interne (SVG maison)           | 70,9 kB    | — (base)         |
| visx (@visx/scale/shape/…)     | 87,6 kB    | **+16,7 kB**     |
| Chart.js 4 (+ react-chartjs-2) | 127,9 kB   | +57,0 kB         |
| Recharts 3                     | 182,7 kB   | +111,8 kB        |
| ApexCharts 4                   | 224,3 kB   | +153,4 kB        |
| ECharts 6                      | 250,6 kB   | +179,7 kB        |

Les 6 candidats ont été installés et buildés sans erreur (Vite 7, React 19.3.1) — compat React 19 vérifiée par le
build réel, pas par la documentation.

### 9.2 Performance d'exécution — protocole v1 INVALIDE, mesures à reprendre (protocole v2)

L'audit UX/UI a identifié des défauts rendant les mesures v1 non fiables : « mise à jour » mesurée sur le même jeu de
données (no-op), « rendu initial » mesuré sur des graphiques déjà montés, interaction qui recalculait aussi les
lignes et les anneaux, warm-up exclu pour le seul rendu, médiane erronée en effectif pair, React du harnais non
aligné sur l'application. **Les conclusions de performance v1 (y compris l'élimination d'ApexCharts) sont
retirées** — aucun choix de bibliothèque ne s'appuie dessus. Le tableau v1 conservé ci-dessous n'a qu'une valeur
d'archive :

| Candidat   | 200 pts (rendu · maj · inter.)     | 1 000 pts                             | 5 000 pts                                 |
| ---------- | ---------------------------------- | ------------------------------------- | ----------------------------------------- |
| Interne    | 16,9 · 16,7 · 16,8                 | 16,7 · 16,9 · 16,8                    | 16,7 · 16,7 · 16,6                        |
| Recharts   | 16,7 · 16,8 · 16,7                 | 16,7 · 16,6 · 16,6                    | 16,8 · 16,7 · **31,5** (25,3–39,7)        |
| Chart.js 4 | 16,9 · 16,7 · 16,8                 | 16,5 · 16,7 · 16,6                    | 16,9 · 16,6 · 17,4 (16,9–20,2)            |
| visx       | 16,6 · 16,7 · 16,7                 | 16,8 · 16,4 · 16,9                    | 16,7 · 16,7 · 16,8                        |
| ApexCharts | 16,5 · 16,3 · **52,5** (42,9–56,3) | 17,7 · 16,6 · **110,7** (105,6–125,2) | 16,7 · 16,6 · **1 055,3** (997,5–1 064,5) |
| ECharts    | 16,5 · 16,6 · 16,7                 | 16,7 · 16,6 · 16,7                    | 16,8 · 16,7 · 16,7                        |

Le harnais a été corrigé dans son code (protocole v2, `benchmark/src/bench.js`) : montage à froid à chaque « rendu
initial » (clé React), mise à jour = alternance de deux jeux de données réels (`makeData(n, variant)`), interaction
isolée sur les barres (lignes/anneaux mémoïsés), warm-up pour les trois opérations, médiane pair corrigée, React
épinglé à 19.0.1 (version de l'application). **Les mesures v2 n'ont pas encore pu être exécutées** : au moment de la
correction, l'installation et le build étaient refusés par la couche de revue de l'environnement. Reprendre :
`npm install && npx vite build && npx vite preview`, chaque page avec `?bench=1`, puis mettre à jour
`diagrammes.html` et ce dossier.

### 9.3 Livrables produits (aucune modification de `src/`, vérifiable par `git status`)

- **Paquet de maquettes** `docs/encyclopedie/mockups/d3/` : `index.html`, `fondations.html` (tokens + contrastes AA
  calculés en direct), `boutons.html`, `champs.html`, `modale.html`, `listes.html`, `pastilles.html`, `bandeaux.html`,
  `onglets.html`, `shell.html`, `parcours.html` (frigo → suggestions → recette → courses, simulé), `registre.html`,
  `responsive.html` (vraies fenêtres par iframes 320/375/768), `diagrammes.html` (étude comparative),
  `assets/d3.css` + `assets/d3.js` (bascules direction A/B/FK, clair/sombre, langues limitées aux contenus
  traduits, textes = chaînes i18n réelles ; interactions simulées : fenêtre, recherche clavier, onglets, pagination).
- **Harnais de benchmark** `docs/encyclopedie/mockups/d3/benchmark/` : 6 pages identiques (interne, recharts, chartjs,
  visx, apexcharts, echarts), `src/data.js` (corpus déterministe, deux variantes), `src/bench.js` (protocole v2 :
  montage à froid, vraie mise à jour, interaction isolée, warm-up complet, médiane pair corrigée), `src/page.js`,
  `vite.config.mjs` (6 entrées). Rejouer : `npm install && npx vite build && npx vite preview`, chaque page avec
  `?bench=1`.
- Corrections de harnais faites pendant l'exécution (n'affectent que le harnais) : démarrage robuste après
  l'hydratation, minuteur compatible onglet en arrière-plan, mesure intra-runner (fin du frame suivant), table
  d'alternative textuelle injectée dans sa zone dédiée (l'ancien placement provoquait un démontage React silencieux
  — les premières mesures, invalides, ont été reprises intégralement après correction).

## 10. Corrections après l'audit UX/UI (deuxième version du paquet)

Bloquants traités : vraies fenêtres responsive (iframes, nouvelle page `responsive.html`, sélecteur « Cadre »
étiqueté « aperçu resserré ») ; polices réelles chargées (Google Fonts, mêmes familles que l'app, Fraunces incluse
pour fkhar) ; tokens sémantiques séparés de l'accent (danger/succès/avertissement/information — une action
destructive reste rouge dans toutes les directions et modes) ; contrastes étendus et corrigés (boutons repos +
survol, erreurs, bordures utiles ≥ 3:1, anneaux de focus) ; parcours de matching rendu cohérent et explicite
(4 recettes annoncées et affichées, Prête à cuisiner / Presque prête / À découvrir, quantité inconnue signalée) ;
trois niveaux étiquetés (illustré / simulé / réel) et interactions simulées réellement implémentées (Échap + clic
extérieur + focus de la fenêtre, clavier de la recherche et des onglets, pagination réelle).

Importants traités : direction B reformulée (ardoise + safran, réellement distincte) + référence FK (thème fkhar
existant) sur chaque bascule ; vraies photos (Wikimedia Commons, repli propre si un lien casse — vérification
navigateur à faire lors de la revue) ; cibles tactiles ≥ 44 px, champs 16 px, propriétés logiques RTL,
`prefers-reduced-motion`, état jamais porté par la couleur seule ; états vides distincts par cas d'usage avec
actions ; page listes affiche de vrais éléments (24 + 24 chargés sur « Afficher la suite », compteur total juste).

Signalements restants pour la décision du chef (🚩) : orthographe de la marque — l'application affiche
« Chnowa Ntayeb / by Chef Souhed » (index.html, métadonnées) alors que l'audit porte « Chnawa Ntayeb / by chef
Souhed » ; les maquettes suivent l'audit, mais une seule graphie doit être retenue (l'app l'impose en base et en
SEO — changement = décision produit, jamais silencieuse).

## 11. Troisième itération : pages complètes, registre fonctionnel, parcours UX

À la demande du chef (examen du livrable D3), le paquet est complété sans reprise à zéro :

- **Pages complètes** (`accueil`, `recherche`, `frigo`, `suggestions`, `recette`, `mode-cuisine`, `courses`,
  `profil`) : même shell (en-tête marque + navigation), mêmes composants, données cohérentes avec le parcours
  (frigo de 9 ingrédients ; Salade mechouia 5/5 · Ojja merguez 8/9 · Kosksi 6/9 · Lablabi 6/10). Les écrans sont
  liés entre eux (liens de navigation simulés) et portent les états importants (vide/chargement/erreur/hors-ligne
  sur listes ; « à vérifier » partout où la présence sans quantité intervient).
- **Registre fonctionnel** (`composants.html`) : cartes de recettes (variantes image/sans photo/squelette/horizontale/
  avec correspondance), lignes et sélecteurs d'ingrédients, recherche avec suggestions (clavier), filtres (chips +
  panneau feuille/colonne), indicateur de correspondance (anneau + niveau + jetons disponible/manquant/substitué/
  à vérifier), steppers de quantité + unités, barres de progression, navigation (basse mobile / latérale desktop),
  toasts et confirmations, états transversaux. Fondations inchangées (tokens, boutons, champs).
- **Responsive réel étendu** : les 8 pages s'adaptent par media queries réelles (grilles 2→3→4 colonnes, panneau de
  filtres feuille→colonne, navigation basse mobile → colonne latérale à ≥ 1024 px) — `responsive.html` présente
  chaque page en iframes 320 / 375 / 768 / 1280.
- **Parcours UX** (`parcours.html`, 4 parcours prioritaires) : frigo → suggestions → recette (interactif) ;
  recette → mode cuisine (démo interactive complète sur mode-cuisine.html) ; manquants → liste de courses
  (choix de liste, fusion d'unités, budget) ; recherche → filtres → détail. Cas limites notés sous chaque parcours.
- **i18n** : ~45 chaînes de démonstration des pages complètes traduites (fr · derja · ar · derja_ar), RTL réel
  (`dir` + propriétés logiques) ; en production les libellés métier viennent de `src/shared/i18n`.
- **Marque** : « Chnawa Ntayeb / by chef Souhed » conformément à la consigne (ⓘ divergence avec l'app actuelle
  « Chnowa Ntayeb / by Chef Souhed » — à trancher, voir § 10).

Nouveaux choix de conception soumis au chef (registre, 🚩) : navigation desktop (colonne latérale vs alternatives) ;
ordre des sections de l'accueil (suggestions d'abord vs nouveautés) ; forme de l'indicateur de correspondance
(anneau vs barre de points) ; comportement produit du mode cuisine ; périmètre des suggestions de recettes.

## 12. Quatrième itération : refonte visuelle, navigation v3, photos, publicité

Nouvelle demande du chef : expériences plus différenciées, navigation mobile complète, emplacements photo et
publicité, registre exhaustif. Conservé : tokens, sémantique, thèmes, harnais, pages d'audit. Refaits :

- **Refonte visuelle des 4 écrans centraux** (accueil, frigo, suggestions, recette) : composition
  « photo-forward » (héros 16:9/21:9 avec titre superposé, carte vedette 16:10, grilles photo 4:3, catégories
  en cercles), titres de sections (sur-titre + titre + « Tout voir »), fil d'ariane, barres d'action collantes.
  Les directions A/B/FK restent comparables sur des pages complètes (tokens + motifs + typographies d'affichage,
  Fraunces pour FK).
- **Navigation v3** : barre basse 5 destinations réelles (dont planning.html, stub honnête : « écran non
  maquetté dans ce lot »), badge frigo, `aria-current`, retour en tête, actions secondaires en en-tête ;
  fenêtres en feuille basse sur mobile / centrées ≥ 768 px ; tiroir latéral (courses, desktop) ; **mode cuisine
  à navigation minimale dédiée** (barre de sortie + compteur, aucune nav basse, aucune publicité) ; desktop :
  colonne latérale ≥ 1024 px (🚩).
- **Photos et médias** (`medias.html`) : tableau des 11 emplacements (ratio, source demandée, recadrage,
  responsive), repli = tuile dégradée + emoji du plat (jamais une photo d'ingrédient pour un plat — correction
  appliquée à recherche.html qui montrait une photo de merguez sur une carte d'Ojja), placeholder shimmer sans
  CLS (`aspect-ratio`), `loading="lazy"`, AVIF/WebP, poids cibles. Photos de démonstration : Wikimedia Commons,
  URL à re-vérifier dans le navigateur (blocage d'exécution persistant).
- **Publicité** (`publicite.html`) : 5 emplacements + 1 option desktop (identifiants `data-ad-id`, positions,
  formats 320×100 / 728×90 / 970×250, espace réservé fixe anti-CLS, repli total sans annonce ou désactivé,
  jamais en mode cuisine ni dans les formulaires, label « Publicité » permanent). Bascule de démonstration
  « pub on/off » dans la barre de démo. 🚩 à arbitrer (nombre, pertinence grocery_footer_1, billboard).
- **Registre complet** (`composants.html`, 14 familles) : formulaires (checkbox, radio, switch, select, textarea,
  numériques), navigation (basse, latérale, onglets, pagination, breadcrumb), menus (dropdown, contextuel,
  popover), fenêtres (modale, confirmation, drawer, feuille basse), recherche (autocomplete, historique),
  recettes (cartes, favoris, partage, évaluation), ingrédients (sélecteurs, quantités, unités, substitutions),
  frigo (états dont stock épuisé), préparation, courses (budget), médias (sélection + reconnaissance), feedback,
  système (PWA, mise à jour, sync, hors-ligne), publicité. Chaque entrée : rôle · variantes · états ·
  interactions · responsive · pages.
- **Parcours 5** ajouté : photo → propositions de reconnaissance (avec confiance) → confirmation utilisateur →
  ajout au frigo (rien d'automatique) + cas limites.
- **Barre de démonstration flottante repliable** (« Démo ») : les commandes n'encombrent plus la page ; mode
  `?embed=1` pour les iframes. ~20 nouvelles chaînes traduites (fr · derja · ar · derja_ar), RTL vérifié par
  propriétés logiques (interrupteur inclus).
- **Correctifs d'audit** : destinations de navigation toutes réelles ; photo d'ingrédient retirée des cartes de
  plat ; registre aligné sur les composants réellement démontrés ; i18n des nouvelles chaînes ; cibles tactiles
  ≥ 44 px conservées.

## 13. Cinquième itération : publicité verticale/horizontale, écrans complémentaires

À la demande du chef (compléments après la version 3) :

- **Publicité — deux orientations étudiées** (`publicite.html` réécrite) : formats horizontaux (320×100 flux
  mobile ; 728×90 après contenu tablette/desktop ; 970×250 grand desktop en option) et verticaux (160×600 et
  300×600 en **colonne latérale desktop uniquement**, ≥ 1024 px) ; rectangle 300×250 utilisable sur mobile
  **entre deux sections**. Trois maquettes de layout (mobile 320 px, tablette 768 px, desktop avec rail latéral).
  Règles : jamais rétrécie/agrandie, colonne absente avant 1024 px, contenu jamais écrasé, repli total sans
  annonce, **configuration par emplacement** (bascules indépendantes en § 5), label « Publicité » permanent,
  aucune pub en mode cuisine/onboarding/formulaires. 🚩 : formats définitifs, fusion home_inline_1/
  home_between_1, activation de la colonne latérale.
- **Écrans complémentaires** : `bienvenue.html` (introduction 3 écrans, langue/thème/compte optionnel, sans nav
  ni pub), `onboarding.html` (remplissage guidé du frigo, chips par catégorie + raccourci photo), `scan.html`
  (flux complet photo → analyse → propositions corrigibles avec confiance → confirmation), `favoris.html`
  (grille + onglet hors-ligne + état vide), `liste-detail.html` (progression par rayons, modification, budget,
  menu contextuel), `planning.html` **complet** (7 jours × midi/soir, suggestions, budget hebdo, génération de
  liste), `notifications.html` (rappels + réglages), `historique.html` (consultations récentes + favoris).
  Vérification anti-doublon : scan existed partiellement (frigo + parcours 5) — l'écran dédié ajoute la capture
  et l'analyse ; détail de liste = gestion (courses.html = vue d'ensemble) ; préférences alimentaires et gestion
  des médias intégrées au profil (fonctionnalité 🚩, pas d'écran séparé).
- **Continuité des parcours** : parcours 6 (bienvenue → onboarding → suggestions) et parcours 7 (recette →
  favori/planning → liste) ajoutés à `parcours.html` (7 parcours) ; liens croisés sur les nouveaux écrans.
- **i18n** : ~25 nouvelles chaînes traduites (fr · derja · ar · derja_ar) ; les textes purement descriptifs des
  nouveaux écrans restent en français avec mention explicite (à traduire via `src/shared/i18n` en implémentation).
- **Responsive** : nouveaux écrans ajoutés à `responsive.html` (planning 7 colonnes ≥ 1024 px, favoris, liste,
  notifications, historique, scan, bienvenue) ; plan-grid 1/2/7 colonnes.

## 14. Sixième itération : consolidation P1/P2 (après revue D3)

Consolidation demandée par le chef, sans nouvelle phase de conception :

- **Accueil — deux propositions comparables** (🚩 choix) : A « Éditorial » (`accueil.html`) — héros plein-cadre,
  4 actions rapides (« Que puis-je cuisiner ? », « Ajouter au frigo », « Scanner mes ingrédients »,
  « Mes courses »), cartes de correspondance dominantes (badge + jetons ✓/🛒 + prix), rail pub desktop ;
  B « Tableau de bord » (`accueil-b.html`) — carte de situation (anneau + jetons), prochain repas, 3 grandes
  cartes, moins de sections. **Personnalisation par état** sur les deux : frigo vide (invitation à remplir),
  rempli (suggestions), planning (prochain repas + favoris + liste en cours) — bascule légère, aucun calcul
  lourd (bascule `data-home-state`, matching restant indexé).
- **Cohérence du matching** : jeu de données figé et appliqué partout — Salade mechouia 5/5 (Prête) ;
  Ojja merguez 8/9 dont piment « à vérifier » (Presque, 1 à acheter) ; Kosksi 5/9, 4 à acheter (À découvrir) ;
  Lablabi 6/10, 4 à acheter + substitution proposée (À découvrir). Règles affichées sur suggestions.html :
  Prête = 0 manquant et 0 à vérifier ; Presque = 1 à 3 manquants réels ; À découvrir = 4+ ; une quantité
  inconnue compte comme présente, jamais comme suffisante. Frigo aligné (9 ingrédients : 7 quantités connues,
  1 à vérifier, 1 stock).
- **Notifications consolidées** : cloche + badge dans les en-têtes des pages principales ; page réorganisée
  (Aujourd'hui / Plus tôt), lues vs non-lues (fond + point + graisse — jamais la couleur seule),
  « Tout marquer comme lu » interactif montrant l'état vide, actions contextuelles, catégories désactivables.
- **Multilingue** : chrome des écrans complémentaires traduit (bienvenue, onboarding, scan, planning, favoris,
  liste, notifications) ; les textes descriptifs restent français avec **mention explicite** de la traduction
  partielle sur chaque page ; bienvenue propose uniquement le sélecteur FR (pas de promesse de traduction
  complète).
- **Publicité** : ajout des démonstrations 320×100 et 970×250 (`adslot--wide`, ≥ 1200 px uniquement),
  colonne latérale 160×600 sur la recherche (`search_side_1`), conditions d'affichage vérifiables dans
  publicite.html.
- **Parcours** : parcours 8 (notification → écran fonctionnel) ; cas limites détaillés (reprise après
  interruption, notification de préparation terminée, hors-ligne, permission refusée). Le remplissage
  automatique du planning reste explicitement une proposition 🚩, le fonctionnement manuel est la référence.
- **Nettoyage** : `benchmark/README.md` ajouté (reproduction du harnais, React 19.0.1, protocole v2) ;
  `node_modules/` et `dist/` exclus du livrable final (voir § 15 pour l'état d'exécution).
- **Marque** : « Chnawa Ntayeb / by chef Souhed » définitive (registre : décision fermée, aucune variante).

## 15. Restes à exécuter (blocage d'exécution de l'environnement)

La couche de revue de l'environnement refuse toujours les commandes destructives/de réseau (`rm`, zip,
serveur local, navigateur) au moment de cette itération. En conséquence :

1. `benchmark/node_modules/` et `benchmark/dist/` n'ont pas pu être supprimés du répertoire de travail —
   à exclure à la constitution du ZIP (commande documentée dans `benchmark/README.md`).
2. Le ZIP D4 n'a pas pu être généré (outil d'archivage refusé) — à produire avec la même exclusion.
3. Les captures navigateur réelles (pages principales + 3 états de l'accueil) n'ont pas pu être prises —
   vérification statique uniquement ; les URLs Wikimedia Commons restent à valider visuellement.
4. Prettier non exécuté.
