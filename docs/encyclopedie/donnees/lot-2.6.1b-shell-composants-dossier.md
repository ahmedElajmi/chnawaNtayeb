# Lot 2.6.1b — Composants du shell & adoption des variables (dossier d'exécution)

**Statut** : dossier remis au chef pour revue et validation explicite — **aucun développement, aucune dépendance, aucune modification de code avant validation**.
**Références** : `lot-2.6.1-identite-shell-dossier.md` (§ 10-1b, périmètre de référence) · `lot-2.6.1a-identite-rapport.md` + complément (état de départ, cibles tactiles reportées) · maquettes D4 `shell.html`, `registre.html` (pastille d'onglet actif fond `--tint`, avatar/panneau, squelettes) · décisions validées D-22, D-23, D-05, D-26 (appliquée en D4 pour l'invité), D-11.
**Principes hérités (non renégociés)** : composants réutilisables sans généralisation excessive ; identité **entièrement configurable** (aucun « Chnawa Ntayeb » / « by chef Souhed » figé) ; thème résolu centralement par `ThemeProvider` ; aucune logique métier inventée depuis les maquettes ; préservation des fonctionnalités existantes et des performances (N1–N8).

---

## 1. Objectifs du sous-lot (périmètre strict)

1. **Composants du shell** : `Skeleton` et `AvatarButton` **partagés** (`src/shared/ui/`) ; `PillTab` **local** à `src/app/layout/` ; `BrandMark` (déjà créé en 2.6.1a, à props) **exploité tel quel** — aucune re-création.
2. **Navigation desktop à pastilles** (D-22, validée) : la nav d'en-tête passe des liens inline aux pastilles (`PillTab`), l'onglet actif sur fond `--tint`.
3. **Avatar/panneau compact** (D-23, validée) : l'avatar remplace la roue dentée **et** le bouton Compte ; ouverture d'un **panneau compact** (profil, réglages) — destinations existantes uniquement.
4. **Correction obligatoire des cibles tactiles** de l'en-tête < 44 px (constatées en 2.6.1a, reportées ici par décision du chef).
5. **Adoption complète des variables de thème dans le shell** : zéro couleur codée en dur résiduelle à la clôture (le nettoyage entamé en 2.6.1a se conclut ici).
6. **Squelettes de chargement partagés** : `Skeleton` remplace l'`animate-pulse` ad-hoc de `RecipesPage` (l'indicateur `animate-pulse` de `DataTab` est un état « en direct », pas un squelette — inchangé).
7. **Tests automatisés (A5, happy-dom déjà installé) + vérifications réelles navigateur** (320/375/768/1280, 4 langues, RTL, clair/sombre).

**Explicitement hors périmètre** : cloche/notifications (2.6.8), accueil C (2.6.2), écrans favoris/historique dédiés (absents aujourd'hui — le panneau ne crée **aucun** nouvel écran ni lien mort), éditeur de thèmes, assignation de thèmes, layouts alternatifs (lot CMS), toute nouvelle dépendance.

---

## 2. Composants — contrats

### 2.1 `Skeleton` (partagé, `src/shared/ui/Skeleton.tsx`)

- **Rôle** : indicateur de chargement visuel générique (repris du motif D4 `shell.html`) ; **sans logique métier**, sans import routeur/Firebase/infrastructure.
- **Props typées** : `width?: string`, `height?: string`, `rounded?: 'md' | 'lg' | 'xl' | 'full'`, `className?: string` — la composition reste à l'appelant (une carte = plusieurs `Skeleton`).
- **Rendu** : bloc `aria-hidden` avec `animate-pulse` sur fond `bg-line` (token) — ** aucune couleur en dur** ; l'appelant pose `aria-busy` sur son conteneur.
- **États/RTL/langues** : sans texte (aucune traduction requise) ; symétrique en RTL.
- **Adoption** : `RecipesPage` (l'état « catalogue en cours » : une carte squelette structurée au lieu d'un bloc vide) ; **un seul consommateur partagé** suffit — toute généralisation attendra un deuxième usage.
- **Tests** : rendu + variante arrondi (happy-dom, léger).

### 2.2 `AvatarButton` (partagé, `src/shared/ui/AvatarButton.tsx`)

- **Rôle** : bouton avatar de l'en-tête (D-23) — remplace la roue dentée **et** le bouton Compte ; ouvre le panneau compact via `onClick` (le composant ne connaît ni la modale ni le panneau : `href`s et libellés **en props**).
- **Props typées** : `label: string` (i18n, `aria-label`), `src?: string` (photo de profil, absente aujourd'hui), `initial?: string` (initiale dérivée de l'identité de session, repli), `isGuest?: boolean` (icône profil neutre, D-26), `onClick: () => void`, `size?: 'header'`.
- **États** : par défaut, survol/actif (anneau `focus-ring`), connecté (initiale sur fond `brand`/`on-brand`), invité (icône neutre sur `tint`) ; **cible tactile ≥ 44×44 px** (44 px sur mobile, jusqu'à 40 px visuel + marge de contact sur desktop compact — jamais < 44 mesuré).
- **Accessibilité — selon le comportement réellement implémenté** (le panneau n'est **pas** un `menu` : c'est une composition de boutons ouvrant des modales existantes) :
  - `aria-expanded` + `aria-controls` (id du panneau) sur l'avatar ; focus visible (`--color-focus-ring`) ;
  - ouverture au clavier par **Entrée / Espace** (comportement natif du `<button>`, aucun gestionnaire custom) ;
  - à l'ouverture, le **focus va au premier élément du panneau** ; `Tab` circule dans le panneau ; **Échap ferme** et **ramène le focus sur l'avatar** ; clic extérieur ferme également ;
  - sur mobile la présentation passe par `ModalShell` (comportements accessibles existants : `onDismiss` = Échap + clic extérieur, `useCloseOnBack`), avec la **même restauration de focus vers l'avatar** à la fermeture ;
  - aucun rôle `menu`/`tablist` artificiel.
- **Langues/RTL** : libellé i18n 4 variantes ; icône symétrique (aucun côté codé).
- **Tests DOM** : rendu des 3 états, clic → `onClick`, cible ≥ 44 px (mesurée dans le test), `aria-*`.

### 2.3 `PillTab` (local, `src/app/layout/PillTab.tsx`)

- **Rôle** : lien de nav desktop à pastille (D-22 ; état actif fond `--tint` selon D4 `registre.html`). **Local à `src/app/layout/`** tant qu'aucun deuxième consommateur n'existe (règle du dossier de référence) — pas dans `src/shared/ui`.
- **Props typées** : `href: string`, `label: string`, `active: boolean` — **véritable lien de navigation** : rendu avec `Link` du routeur (le composant reste local à l'app), `href` en props, jamais `useNavigate` déguisé ; **signal d'état = `aria-current="page"`** sur le lien actif — **le modèle `tablist`/`role="tab"` n'est pas employé** (il correspond à un autre comportement).
- **Rendu** : pastille arrondie pleine largeur de texte ; inactif = texte `ink-muted`, survol `hover:text-ink` ; actif = fond `tint`, texte `brand-text`, bordure transparente — **tokens uniquement** ; cible ≥ 44 px (hauteur de contact ≥ 44, `py` suffisant) ; focus visible.
- **Tests** : état actif/inactif (classe ou style), `aria-current="page"` présent uniquement sur l'actif, absence de `role="tab"`, `href` transmis, navigation réelle au clic.

### 2.4 Panneau compact (local, `src/app/layout/ProfilePanel.tsx` — composition, pas un composant générique)

- **Rôle** : le panneau ouvert par l'avatar (D-23, version **compacte** validée — pas l'écran dédié complet des maquettes).
- **Contenu — destinations existantes uniquement** (aucun écran inventé, aucun lien mort) :
  - **Profil / Connexion** : ouvre la `UserAccountModal` **existante** (profil, connexion, inscription ; déconnexion incluse) — comportement actuel du bouton Compte, préservé ;
  - **Réglages** : ouvre la `SettingsModal` **existante** (Affichage = mode, Langue, Application) — **le panneau ne contient aucun sélecteur de thème** (N6 : mode seulement) ;
  - **badge backoffice + « Quitter »** (staff authentifié) : repris tels quels (desktop `sm+` ; sur téléphone ils restent dans Réglages › Application, convention conservée) ;
  - la langue reste dans l'en-tête desktop (aucune régression) et dans Réglages (mobile) — le panneau n'ajoute pas de doublon.
- **Présentation** : panneau ancré sous l'avatar sur desktop (`md+`) ; sur mobile, même contenu rendu dans une fenêtre `ModalShell` + `useCloseOnBack` (une composition, deux présentations responsives — jamais deux écrans) ; aucun élément n'élargit la page à 320 px.
- **Accessibilité (comportement implémenté, ARIA adapté)** : le panneau est un conteneur étiqueté (`role="group"` + `aria-label` i18n ou équivalent) — **jamais `role="menu"`** ; ouverture **Entrée/Espace** depuis l'avatar ; **Échap** et **clic extérieur** ferment ; **focus initial** sur le premier élément, **focus rendu à l'avatar** à la fermeture ; sur mobile, la fenêtre `ModalShell` apporte ses comportements accessibles existants (Échap, clic extérieur, retour arrière) et la restauration de focus est identique.
- **Tests DOM** : ouverture/fermeture (souris + clavier Échap), entrées présentes selon l'état de session, focus rendu à l'avatar, aucune appellation de marque en dur, aucun rôle `menu`.

### 2.5 `BrandMark` (existant — vérification seulement)

Créé en 2.6.1a avec la configuration `brand.ts` : **aucune modification prévue** ; vérifier en revue que le canal staff (3 clics) et les replis restent intacts après la retouche d'en-tête.

---

## 3. Navigation mobile et desktop

- **Mobile (barre basse `BottomNav`)** : structure inchangée (5 onglets, badge frigo, « appuyez encore pour quitter » conservé via `goHome`) ; **couleurs migrées vers les tokens** (§ 4) ; **état actif en pastille** : fond `tint` arrondi derrière l'icône+libellé de l'onglet actif (motif D4), indicateur bas remplacé par cette pastille — cibles 61×64 px inchangées (≥ 44 px).
- **Desktop (`Header`)** : les liens inline deviennent des `PillTab` (D-22) ; mêmes destinations et libellés i18n, même mémoire de filtres (`useRecipesHref`), même lien « recettes » actif aussi sur `/suggestions`.
- **Conventions conservées** : en-tête de hauteur fixe `h-16` (**zéro CLS**) ; marque lisible (BrandMark, tagline cachée sur très petit écran comme aujourd'hui) ; canal staff 3 clics intact ; badge/Quitter backoffice aux emplacements actuels.

## 4. Suppression des couleurs codées en dur (adoption des variables)

**Inventaire exact (grep vérifié, état 2.6.1a)** — tout est migré vers les tokens du thème dans ce lot :

| Fichier                                  | Occurrences                                                                                                                                                                                   | Migration                                                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/layout/BottomNav.tsx`           | 2 lignes (`bg-white/95 dark:bg-slate-900/95`, `text-slate-500 dark:text-slate-400`, `hover:text-slate-900 dark:hover:text-white`)                                                             | fond `surface` (+`/95` translucide conservé par token), texte inactif `ink-muted`, survol `ink`                                                                    |
| `src/app/layout/Header.tsx`              | 7 lignes (`text-slate-600/300`, `hover:text-slate-900/white`, `text-slate-400 hover:text-rose-500` (Quitter), bordures/textes `slate-200/700/500` du bouton Compte et du sélecteur de langue) | texte nav `ink`/`ink-muted`, danger du bouton Quitter → `danger`/`dangerText` (2.6.1a), bordures `line`/`lineStrong`, textes `ink`/`ink-muted`, icônes `ink-muted` |
| `src/shared/ui/ScrollToTopButton.tsx`    | 1 (`ring-white/20` — halo décoratif sur fond `brand`)                                                                                                                                         | `ring-on-brand/20` (token, sémantiquement équivalent) — vérifier le rendu clair/sombre                                                                             |
| `src/app/AppLayout.tsx`, `BrandMark.tsx` | **0** (déjà à tokens)                                                                                                                                                                         | —                                                                                                                                                                  |

- **Garde anti-régression (test)** : extension du test d'architecture — **aucune classe de palette codée en dur** (`slate-*`, `rose-*`, `emerald-*`, `white/`, `red-*`, `zinc-*`, `gray-*`, hexagonaux `#…`) dans **les fichiers du shell concernés par ce lot et les nouveaux composants créés ici** (`src/app/layout/*`, `src/app/AppLayout.tsx`, `src/shared/ui/{Skeleton,AvatarButton,ScrollToTopButton}.tsx`) hors tests (même mécanisme que la garde N8).
- **Portée volontairement limitée** : la garde **ne couvre pas** les écrans et composants hors périmètre (features, backoffice, écrans restés à leur style actuel) — elle ne doit **pas** bloquer involontairement des fichiers que ce lot ne touche pas ; l'adoption des tokens dans les autres fonctionnalités reste **progressive, dans leurs lots respectifs** (2.6.2+).

## 5. Correction obligatoire des cibles tactiles (reportée de 2.6.1a)

| Cible                          | État constaté (2.6.1a)     | Après 2.6.1b                                                                                              |
| ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Bouton Compte                  | 36×28 px                   | **supprimé** → `AvatarButton` **44×44 px**                                                                |
| Roue Réglages                  | 34×34 px                   | **supprimée** → même `AvatarButton` (le panneau mène à Réglages)                                          |
| Marque (`BrandMark`)           | ~196×36 px                 | zone de contact étendue à **≥ 44 px de haut** (`py`/`min-h`), sans modifier la hauteur d'en-tête (`h-16`) |
| Sélecteur de langue            | ~85×28 px                  | hauteur de contact **≥ 44 px** (espacement vertical, mêmes dimensions visuelles)                          |
| Badge backoffice + Quitter     | ≥ 28 px, desktop seulement | badge cliquable ≥ 44 px ; « Quitter » intégré à une cible ≥ 44 px (marge)                                 |
| Barre basse, pastilles desktop | 61×64 px ✓                 | inchangées (≥ 44)                                                                                         |

**Critères d'acceptation (obligatoires, non facultatifs) — répartition des moyens** :

- **happy-dom (tests DOM)** : contrats, classes, styles déclarés et attributs (`aria-*`, dimensions minimales exprimées dans les classes/styles) — **jamais** une mesure de layout ;
- **Chromium (navigateur réel)** : **mesure effective des dimensions calculées** et vérification des chevauchements — **la validation des 44×44 px repose exclusivement sur le navigateur réel**, en ciblant particulièrement les éléments rapprochés de l'en-tête (320/375/768) ;
- **toute cible interactive de l'en-tête et de la barre basse ≥ 44×44 px mesurées** (navigateur réel, 320/375 et 768) ;
- **vérification sur mobile et tablette** (320, 375, 768) ;
- **absence de chevauchement** (cibles agrandies dans `h-16` : vérifier qu'aucune ne se chevauche ni ne déborde de l'en-tête) ;
- **aucune dégradation visuelle** (captures avant/après comparées : hauteurs d'en-tête identiques, espacements équilibrés, clair et sombre) ;
- les mesures et captures sont consignées au rapport.

## 6. Fichiers concernés, dépendances

**Créés** : `src/shared/ui/Skeleton.tsx`, `src/shared/ui/AvatarButton.tsx`, `src/app/layout/PillTab.tsx`, `src/app/layout/ProfilePanel.tsx` (+ tests `*.test.tsx` happy-dom).
**Modifiés** : `src/app/layout/Header.tsx` (pastilles, avatar, cibles, tokens) · `src/app/layout/BottomNav.tsx` (tokens, pastille active) · `src/app/AppLayout.tsx` (état d'ouverture du panneau, cibles si touchées) · `src/features/recipes/RecipesPage.tsx` (squelette → `Skeleton`) · `src/shared/ui/ScrollToTopButton.tsx` (1 token) · `src/shared/i18n/translations.ts` + `derjaArabic.ts` (libellés du panneau + avatar, **4 langues**) · `src/core/architecture.test.ts` (garde « zéro palette en dur »).
**Dépendances** : **aucune nouvelle** (happy-dom déjà présent depuis 2.6.1a) — aucune installation autorisée sans validation.
**Non touchés** : `src/core/**` (aucun changement de contrat), `ThemeProvider`/`resolveTheme` (mécanique 2.6.1a), `brand.ts`/`BrandMark`, routes, serveur, base.

## 7. Tests automatisés et vérifications réelles

**Automatisés (attendus verts avant rapport)** :

- nouveaux tests DOM (happy-dom) : `Skeleton`, `AvatarButton` (états + cible ≥ 44 + `aria-*`), `PillTab` (actif/inactif), `ProfilePanel` (ouvertures, i18n, aucun texte de marque en dur) ;
- garde d'architecture « zéro couleur en dur » dans le shell ;
- suite complète `npm run check` : typecheck + oxlint 0 warning + Prettier + **tous les tests** (870 à l'ouverture du lot — la suite entière doit rester verte, y compris matrice de persistance et contrastes de 2.6.1a).

**Vérifications réelles navigateur (Chromium, protocole 2.6.1a, serveur isolé, aucune donnée réelle)** :

- **Mesure réelle des cibles** : dimensions calculées (`getBoundingClientRect`) de chaque élément interactif de l'en-tête et de la barre basse + **détection de chevauchement** (intersection des rectangles) — **validation des 44×44 px sur navigateur réel uniquement** (happy-dom ne mesure pas le layout), à 320/375/768, en ciblant particulièrement les éléments rapprochés de l'en-tête ; tableau au rapport ;
- **matrice multilingue et RTL (couverture par risque, sans multiplier les combinaisons)** :

  | Scénario | Largeur | Langue / mode     | Ce qui est vérifié                                                                          |
  | -------- | ------- | ----------------- | ------------------------------------------------------------------------------------------- |
  | S1       | 320     | derja · clair     | shell complet, cibles, panneau, squelette, libellés longs (troncature, **débordement nul**) |
  | S2       | 320     | ar · sombre       | RTL complet (pastilles, panneau, avatar), cibles, barre basse thémée                        |
  | S3       | 320     | derja_ar · sombre | **2ᵉ variante RTL** : symétrie identique à S2, libellés propres à derja_ar                  |
  | S4       | 375     | fr · clair        | libellés français longs, panneau, cibles                                                    |
  | S5       | 768     | fr · clair        | nav desktop pastilles, avatar, cibles élargies, chevauchements                              |
  | S6       | 768     | ar · clair        | RTL desktop, panneau, langue dans l'en-tête                                                 |
  | S7       | 1280    | fr · clair        | nav desktop, pastille active `tint`, LCP multi-mesures                                      |
  | S8       | 1280    | ar · sombre       | RTL desktop sombre, marque, header                                                          |

  **les 4 langues** (derja, français, arabe, derja_ar) et **les 2 variantes RTL** sont ainsi couvertes ; les **libellés longs** sont vérifiés dans les 4 langues à 320 (troncature maîtrisée, aucun débordement de page ni chevauchement) ;

- clair/sombre : aucun fond figé (la barre basse suit le thème sombre Zitouna, plus de `white/95`) ;
- **perfs** : **LCP mesuré plusieurs fois** (≥ 3 mesures à chaud par condition, avant/après dans des conditions comparables — même serveur, même protocole, même onglet ; comparaison des **médianes représentatives**, pas d'une seule exécution) ; poids transféré ; **CLS mesuré à 0**, y compris **à l'ouverture et à la fermeture du panneau** (observation `layout-shift` pendant l'interaction) ; en-tête à hauteur fixe ; chiffres au rapport.

## 8. Risques de régression et parades

| Risque                                                                                                                     | Impact | Parade                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La roue dentée disparaît : réflexe « Réglages » perdu                                                                      | moyen  | Réglages reste en **1 geste** (avatar → panneau → Réglages) ; libellés i18n explicites ; mention au rapport pour la revue du chef                                                         |
| Panneau trop riche = invention d'écran                                                                                     | moyen  | destinations **existantes uniquement** (§ 2.4) ; aucun lien mort ; D-26 (invité) suit le comportement actuel sans nouvel écran                                                            |
| Cibles agrandies cassent l'alignement de l'en-tête                                                                         | moyen  | hauteur `h-16` inchangée ; alignement vérifié aux 4 dimensions ; captures avant/après                                                                                                     |
| Pastille active `tint` illisible sur un thème à `tint` faible                                                              | faible | `tint` + `brand-text` sont des tokens AA vérifiés en 2.6.1a (paires réelles) ; contrastes recalculés sur les **nouvelles associations** (pastille `tint`/`brand-text`, avatar) au rapport |
| Régression des comportements conservés (canal 3 clics, badge/quitter, mémoire de filtres, « appuyez encore pour quitter ») | moyen  | checklist de non-régression au § 7 + suite complète verte                                                                                                                                 |
| CLS à l'ouverture du panneau                                                                                               | faible | hauteur fixe du header ; panneau en overlay (aucun décalage de flux) ; CLS mesuré = 0                                                                                                     |

## 8 bis. Extensibilité multilingue — vérification architecturale (non-implémentation)

**Objet** : vérifier que le lot 2.6.1b **ne crée aucune limitation** qui obligerait, plus tard, à modifier
les tables SQL, les composants frontend ou les formulaires CMS pour ajouter une langue. **C'est une
vérification de compatibilité, pas le lot CMS multilingue** : rien n'est développé, installé ou modifié
ici. **Suite à cette vérification, l'orientation architecturale multilingue a été VALIDÉE par le chef** :
voir `orientation-multilingue-validee.md` (registre centralisé des langues en base, tables de traduction
relationnelles par entité réellement localisable, sans JSON ni EAV) — les décisions D1–D3 ci-dessous sont
**levées** par cette orientation ; le lot d'implémentation reste soumis au cycle habituel.
**Références croisées** : doc 18 (§ 4.4 messages — deux étages ; § 3 slugs/SEO dans les versions de page),
contrats de données (`server/storage/sqlStore.ts` — **écart architectural enregistré : documents métier en colonne `data` JSON**, voir 8 bis-2 bis),
i18n (`src/core/shared/language.ts`, `localized.ts`), principes d'extensibilité (CLAUDE.md § Langues).

### 8 bis-1. Vérification point par point — statut honnête

| Élément                     | Comportement attendu (chef)                                               | **Déjà garanti par l'architecture actuelle**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Prévu, pas encore implémenté**                                                                                                                           | **À développer (lot CMS ou lot dédié)**                                                                                                                                                                                                            | Risques / dépendances                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Langues disponibles**     | liste dynamique, non limitée aux 4 actuelles                              | `LANGUAGES` est la **seule liste** (core) ; tous les consommateurs (`LANGUAGE_CODES`, `localizedField`, `withLocalizedField`, sélecteurs) itèrent depuis cette liste — **aucune langue n'est codée en dur ailleurs** ; les champs localisés sont nommés `<champ>_<code>` et découverts dynamiquement                                                                                                                                                                                                                                                                                                                                              | liste portée en **configuration backoffice** (langues configurées)                                                                                         | lot CMS : registre de langues en base + validation core générique                                                                                                                                                                                  | le type `Language` est une union littérale (`'fr' / 'ar' / 'derja' / 'derja_ar'`) : l'élargissement dynamique exige de remplacer l'union par un contrat par chaîne validée — **décision de type (D1 ci-dessous)**                                                                                                                                                                                                           |
| **Configuration**           | ajout / activation / désactivation depuis le backoffice                   | les écrans consomment `languageInfo()` et `SELECTOR_ORDER` (core) — aucun sélecteur ne fige une langue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | écran de gestion des langues (activer/désactiver, ordre du sélecteur)                                                                                      | lot CMS (avec la décision D1)                                                                                                                                                                                                                      | une langue **désactivée** doit rester lisible sur les appareils déjà configurés (repli sur la famille, comme les replis actuels) — règle à définir                                                                                                                                                                                                                                                                          |
| **Base SQL**                | aucune modification de schéma pour ajouter une langue                     | **⚠ écart enregistré, pas une garantie** : l'implémentation SQL **actuelle** (adaptateur de préparation à la portabilité, câblé en test/local) stocke chaque document métier en colonne `data` JSON — cette caractéristique **ne constitue pas une validation de conformité** à la règle de persistance relationnelle (CLAUDE.md, point 9 : jamais « tout en JSON » dans SQL) et **n'est pas utilisée ici pour justifier l'extensibilité multilingue** ; **écart architectural enregistré à traiter dans le périmètre de la migration SQL**, sans correction dans le lot 2.6.1b (aucun code, aucune migration, aucun changement d'adaptateur ici) | —                                                                                                                                                          | pour **tout schéma SQL futur** (CMS et collections migrées) : la forme des contenus localisés est **relationnelle** — **orientation validée : tables de traduction par entité réellement localisable** (voir `orientation-multilingue-validee.md`) | l'objectif du chef (une langue sans évolution du schéma SQL) est atteint **avec** une modélisation relationnelle, pas par du JSON                                                                                                                                                                                                                                                                                           |
| **Champs CMS**              | formulaires localisés générés dynamiquement selon les langues configurées | les formulaires actuels (éditeur de recette) itèrent déjà les langues depuis `LANGUAGES` (onglets de langue) — le mécanisme d'itération est en place                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | formulaires CMS alimentés par le registre de langues                                                                                                       | lot CMS                                                                                                                                                                                                                                            | dépend de D1 + D2 ; les validateurs du core exigent aujourd'hui `fr`/`derja`/`ar` (`ALWAYS_STORED`) — l'ensemble des langues obligatoires doit devenir configurable                                                                                                                                                                                                                                                         |
| **Frontend**                | affichage dans la nouvelle langue sans modification des composants        | les composants (shell inclus, **y compris les créations de 2.6.1b**) rendent tout texte via les clés i18n et la résolution `pickLocalized` ; **direction et police** viennent de `languageInfo(code).dir` / family (RTL via `[dir='rtl']`) — **aucun composant de 2.6.1b n'ajoute d'hypothèse de langue** (squelette sans texte, avatar/pastilles/panneau à clés i18n)                                                                                                                                                                                                                                                                            | —                                                                                                                                                          | rien pour 2.6.1b ; pour une langue nouvelle : ses traductions d'interface doivent exister (voir ligne suivante)                                                                                                                                    | la variante typographique (police arabe Cairo, dirigée par la famille `ar`) couvre une langue RTL nouvelle sans retouche ; une langue nouvelle ni latine ni arabe exigerait sa police (décision produit)                                                                                                                                                                                                                    |
| **Traductions d'interface** | ajout sans modification du code si l'i18n le permet                       | l'i18n actuel charge les textes **depuis le bundle** (`translations.ts`, 4 objets) — l'ajout d'une langue **exige aujourd'hui une modification de code** ; c'est documenté comme tel depuis l'origine (« one entry in LANGUAGES (+ its interface texts) »)                                                                                                                                                                                                                                                                                                                                                                                        | doc 18 § 4.4 : messages **éditoriaux** en base + rapport « traductions manquantes » ; messages techniques essentiels restent dans le bundle par conception | lot CMS (2ᵉ étage) : textes d'interface éditoriaux en base, langues supplémentaires servies sans déploiement                                                                                                                                       | **complété par l'orientation validée (§ 6 du document)** : un seul mécanisme i18n — catalogues dynamiques (source actualisée, versionnés, cache IndexedDB, actualisation atomique en ligne) pour **tous** les textes, y compris techniques et essentiels ; le bundle fournit le **fallback embarqué** des messages essentiels (jamais un second mécanisme) — l'ajout d'une langue ne nécessite aucun redéploiement frontend |
| **Fallbacks**               | langue de remplacement configurable                                       | la chaîne `LANGUAGES.fallback` existe, par langue, **et est déjà utilisée partout** (`pickLocalized`, replis) ; le français reste la référence finale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | fallback configurable depuis le backoffice                                                                                                                 | lot CMS                                                                                                                                                                                                                                            | les fallbacks par défaut actuels sont validés (contenu existant) ; les rendre configurables ne change rien au mécanisme                                                                                                                                                                                                                                                                                                     |
| **LTR / RTL**               | direction et configuration adaptées                                       | `dir` est une donnée de `LanguageInfo` (pas un champ codé en dur) ; le CSS applique `[dir='rtl']` globalement ; les composants 2.6.1b utilisent les propriétés logiques (`ms/me/ps/pe`)                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —                                                                                                                                                          | pour une nouvelle langue : son `dir`, `htmlLang`, `collation` dans son entrée de registre (données, pas code)                                                                                                                                      | aucun blocage connu ; `collation` est déjà portée par l'entrée (tri alphabétique)                                                                                                                                                                                                                                                                                                                                           |
| **SEO**                     | slugs, titres et métadonnées localisés                                    | les titres de pages serveur sont localisés (`server/seo.ts`) ; le contenu publié porte ses champs localisés ; **le slug de recette est aujourd'hui unique** (`slug`, non localisé)                                                                                                                                                                                                                                                                                                                                                                                                                                                                | doc 18 : slugs, titres et SEO **dans les versions de page** (par génération) — conçus pour être localisés                                                  | lot CMS : slugs localisés × langue, redirections par langue                                                                                                                                                                                        | un slug localisé nouveau est **ajouté** (nouveaux champs) : aucun des slugs existants n'est remplacé (rétrocompatibilité) ; dépend de D2                                                                                                                                                                                                                                                                                    |

### 8 bis-2. Ce que le lot 2.6.1b garantit (et vérifie en revue)

- **Aucune nouvelle limitation** : les composants créés (`Skeleton`, `AvatarButton`, `PillTab`, `ProfilePanel`) et modifiés (`Header`, `BottomNav`) ne contiennent **aucune langue, aucune direction, aucun texte en dur** — tout passe par les clés i18n, `languageInfo()` et la liste `LANGUAGES` ; le squelette est sans texte.
- **Aucune donnée ni aucun schéma touchés** : le lot ne modifie ni contrat, ni collection, ni adapter — la compatibilité SQL/Firestore (§ CLAUDE.md) reste exactement celle de 2.6.1a (persistance démontrée, rapport complémentaire § 14).
- **Vérifiés en revue du code du lot** : (a) aucun tableau de libellés hors i18n dans les nouveaux composants ; (b) aucune constante de langue (`'fr'/'ar'/'derja'`) hors du core ; (c) aucune propriété logique remplacée par un côté codé (L/R) ; (d) le garde-fou « zéro texte en dur » existant reste vert.

### 8 bis-2 bis. Écart architectural enregistré (hors périmètre de 2.6.1b)

Le stockage des documents métier en colonne `data` JSON dans l'adaptateur SQL actuel est **en contradiction
avec la règle permanente de persistance relationnelle** (CLAUDE.md, § « Compatibilité permanente
Firebase / SQL », point 9 — _jamais « tout en JSON » dans SQL_ : tables dédiées, colonnes typées, clés,
contraintes, index ; JSON réservé aux échanges, imports/exports et sauvegardes). Cet écart est
**enregistré comme point architectural à traiter dans le périmètre de la migration SQL** (modélisation
relationnelle des collections : tables et colonnes typées, relations et clés étrangères, contraintes
d'intégrité et d'unicité, index adaptés, structures normalisées) — **pas corrigé dans le lot 2.6.1b**
(aucun code, aucune migration, aucun changement d'adaptateur, aucun changement de périmètre du shell ici).
**La règle de persistance relationnelle est permanente et s'impose à tous les futurs lots de Chnawa Ntayeb.**

### 8 bis-3. Décisions D1–D3 — levées par l'orientation validée du chef

**Après cette vérification, le chef a validé l'orientation architecturale multilingue**
(`orientation-multilingue-validee.md`) :

| #      | Décision                                  | **Statut**                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | Source de la liste des langues            | **levée — orientation validée** : registre centralisé **en base** (code, noms natif/affiché, direction, locale, fallback, statut actif/inactif, formats date/nombre, police éventuelle), géré depuis le backoffice ; l'union `Language` du core devient transitoire (extension par chaînes validées au lot d'implémentation)                                                                                                                 |
| **D2** | Forme des contenus localisés en SQL       | **levée — orientation validée** : **tables de traduction relationnelles par entité réellement localisable** (`recipes`+`recipe_translations`, etc.), colonnes typées, clés étrangères, unicité entité × langue (garde serveur côté Firestore), index adaptés ; **JSON exclu** (règle permanente), **EAV et table universelle exclus** ; un nouvel attribut localisé reste une évolution classique (colonne typée + migration SQL acceptable) |
| **D3** | Étendre `LocalizedText` / `ALWAYS_STORED` | **levée en direction** : les champs `<champ>_<code>` embarqués deviennent **transitoires** — la migration vers les tables de traduction est planifiée au lot approprié, avec **repli de lecture sur les champs embarqués** pendant la transition (aucun retour arrière perdu) ; l'extension du contrat est détaillée au lot d'implémentation                                                                                                 |

**Conclusion de la vérification (mise à jour)** : l'architecture **frontend** (clés i18n, champs
`<champ>_<code>` découverts dynamiquement, direction/fallback portés par `LanguageInfo`) permet
d'ajouter une langue **sans modifier les composants ni les formulaires CMS** ; côté SQL, l'objectif
(une langue depuis le backoffice, sans modification du schéma) est atteint **avec une véritable
modélisation relationnelle** (tables de traduction, orientation validée). **L'implémentation SQL
actuelle en colonne `data` JSON ne doit plus être citée comme preuve de cette extensibilité** : c'est un
écart architectural enregistré (8 bis-2 bis), à traiter dans le périmètre de la migration SQL, sans
correction dans 2.6.1b. Ce qui exige encore du développement reste **identifié et borné** (registre en
base, catalogues d'interface dynamiques, tables de traduction + migration, slugs localisés — scénarios
de validation 1–10 au document d'orientation).
**Le lot 2.6.1b n'introduit aucune limitation nouvelle.**

## 9. Rollback

- **Un seul commit pour 2.6.1b** — **exécuté uniquement sur autorisation explicite du chef, même après validation du rapport final** (jamais automatique) ; aucun commit avant.
- `revert` du commit = retour exact à l'état 2.6.1a : **aucune migration de données, aucun changement de contrat** (les composants sont de la présentation ; les thèmes et préférences ne sont pas touchés) ;
- la création de `Skeleton`/`AvatarButton`/`PillTab`/`ProfilePanel` est additive : un revert ne laisse aucun résidu en base ni en préférences ;
- en cas de blocage en cours de lot : les retouches `Header`/`BottomNav` peuvent être figées séparément (fichiers indépendants) — décision du chef au cas par cas.

## 10. Critères de clôture (récapitulatif)

1. `npm run check` vert complet (y compris gardes de 2.6.1a) ;
2. garde « zéro couleur en dur » verte sur le shell (BottomNav, Header, ScrollToTop, nouveaux composants) ;
3. cibles tactiles ≥ 44×44 mesurées dans le navigateur (mobile + tablette), sans chevauchement ni dégradation visuelle — **correction obligatoire** ;
4. pastilles desktop + barre basse thémées (fond `tint` actif, **`aria-current="page"`, aucun modèle `tablist`**), avatar/panneau compact fonctionnel (**ARIA selon le comportement réel, aucun rôle `menu`** ; Entrée/Espace, Échap, clic extérieur, focus rendu à l'avatar), squelette `Skeleton` en place ;
5. responsive 320/375/768/1280, 4 langues, RTL, clair/sombre — captures au rapport ;
6. perfs : CLS 0, LCP non dégradé (protocole 2.6.1a), chiffres au rapport ;
7. aucune fonctionnalité retirée, aucun composant hors périmètre anticipé (accueil, cloche, écrans favoris/historique restent aux lots prévus) ;
8. **extensibilité multilingue vérifiée en revue** (§ 8 bis : aucune langue, direction ou texte en dur dans les composants du lot ; aucun contrat ni schéma touché) ; rapport remis → **arrêt et attente de validation avant toute suite**.
