# Rapport d'implémentation — Lot 2.6.1b « Composants du shell & adoption des variables »

**Statut** : implémentation **terminée et vérifiée** — rapport remis au chef, **complété par les vérifications finales demandées** (clavier panneau, session super admin réelle, empilement/historique) : `lot-2.6.1b-shell-composants-rapport-complement.md` — **toutes PASS, aucune correction** ; **validation technique + contrôle manuel du clavier concluant ; commité sur autorisation explicite du chef** (`f8fc85b` feat) — **lot 2.6.1 clôturé**. **Aucun commit exécuté** ;
l'exécution du commit de 2.6.1b attend **l'autorisation explicite du chef** (règle du dossier de référence).
**Références** : `lot-2.6.1b-shell-composants-dossier.md` (dossier validé — périmètre exécuté tel quel),
`lot-2.6.1a-identite-rapport.md` + complément (état de départ), `orientation-multilingue-validee.md`
(aucune incidence sur ce lot).
**État Git au moment du rapport** : branche `feature/datastore-contract`, commits `3f7565c`
(feat 2.6.1a) + `6107ab5` (docs 2.6.1b/orientation), arbre propre avant le lot ; le diff non commité
actuel = le périmètre 2.6.1b exclusivement (18 fichiers, liste § 1).

---

## 1. Fichiers — créé / modifié (conformes au dossier § 6)

**Créés (8)** :

- `src/shared/ui/Skeleton.tsx` + `Skeleton.test.tsx` — squelette partagé (`width`/`height`/`rounded`,
  `aria-hidden`, pulsation sur token `bg-line`) ;
- `src/shared/ui/AvatarButton.tsx` + `AvatarButton.test.tsx` — avatar d'en-tête (D-23) : `label`/`src`/
  `initial`/`isGuest`/`expanded`/`panelId`/`onClick`/`buttonRef` ; **le composant ne connaît ni la modale
  ni le panneau** ;
- `src/app/layout/PillTab.tsx` + `PillTab.test.tsx` — lien de nav desktop à pastille (D-22), **local**
  (un seul consommateur) : `Link` réel, `href` en props, **`aria-current="page"`**, aucun modèle
  `tablist`/`role="tab"` ;
- `src/app/layout/ProfilePanel.tsx` + `ProfilePanel.test.tsx` — panneau compact (composition) :
  conteneur étiqueté **`role="group"`** (+ `aria-label` i18n), **jamais `role="menu"`**, focus initial
  sur la première entrée.

**Modifiés (10)** :

- `src/app/layout/Header.tsx` — nav desktop inline → **`PillTab`** (mêmes destinations, même mémoire de
  filtres via `useRecipesHref`, « recettes » actif aussi sur `/suggestions`) ; **Compte + roue dentée
  supprimés → `AvatarButton`** (D-23) ; popover desktop du panneau (Échap + clic extérieur via
  `document`, ancré sous l'avatar, dans l'en-tête) ; badge « Super admin » et « Quitter » **repris
  tels quels** (sm+, téléphone inchangés) ; sélecteur de langue conservé ;
- `src/app/layout/BottomNav.tsx` — fond `surface/95` (plus de `white/95 slate-900/95`), textes
  `ink-muted`/`ink`, **pastille active `tint` + `brand-text`** remplaçant le trait bas ;
- `src/app/AppLayout.tsx` — état du panneau (`isProfileOpen`), détection `md` (popover ↔ ModalShell),
  **entrées = destinations existantes uniquement** (`UserAccountModal`, `SettingsModal`) ; mobile : le
  même contenu dans une **`ModalShell`** + `useCloseOnBack` (une composition, deux présentations) ;
  restauration du **focus sur l'avatar** à chaque fermeture ;
- `src/app/layout/BrandMark.tsx` — **une seule retouche autorisée par le dossier § 5** : zone de contact
  du bouton de marque ≥ 44 px (`min-h-[44px] py-1`, hauteur d'en-tête inchangée) ; props et replis
  inchangés (vérifié par ses tests) ;
- `src/features/recipes/RecipesPage.tsx` — état « catalogue en cours » : **carte squelette structurée
  (3 `Skeleton`)** au lieu du bloc `animate-pulse` ad-hoc ; `DataTab` (indicateur « en direct »)
  **inchangé** ;
- `src/shared/ui/ScrollToTopButton.tsx` — `ring-white/20` → **`ring-on-brand/20`** ;
- `src/shared/i18n/translations.ts` + `derjaArabic.ts` — **2 clés nouvelles × 4 langues**
  (`avatarLabel`, `profilePanelLabel`) ; les entrées du panneau réutilisent les clés existantes
  (`accountMine`/`accountSignIn`, `settingsTitle`) — aucun texte en dur ;
- `src/index.css` — enregistrement des **tokens de couleurs étendus** dans `@theme` (valeurs par défaut
  de la palette « Classique », surchargées à l'exécution par le thème résolu) : `tint`, `line-strong`,
  `focus-ring`, `danger×3`, `success×2`, `warning×2`, `info×2` — rend disponibles `bg-tint`,
  `border-line-strong`, `ring-focus-ring`, `text-danger-text`… ;
- `src/core/architecture.test.ts` — **garde « zéro palette en dur »** (§ 4 du dossier) : aucune classe
  `slate-/rose-/emerald-/red-/zinc-/gray-/…-<chiffre>`, `white/`, `black/` ni hexadécimal dans
  `src/app/layout/*`, `src/app/AppLayout.tsx`, `src/shared/ui/{Skeleton,AvatarButton,ScrollToTopButton}.tsx`
  hors tests — **portée volontairement limitée** aux fichiers du lot (le backoffice et les autres
  écrans ne sont pas bloqués ; adoption progressive dans leurs lots).

**Hors périmètre, non touchés** : `src/core/**` (aucun contrat), `ThemeProvider`/`resolveTheme`,
`brand.ts`, routes, serveur, base ; **aucune dépendance ajoutée**.

---

## 2. Fonctionnalités réalisées (contrats du dossier § 2–3)

| Élément                  | Réalisé                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skeleton` partagé       | ✓ (3 tests DOM) ; adopté par `RecipesPage` uniquement                                                                                                                                 |
| `AvatarButton` partagé   | ✓ (4 tests DOM) ; 3 états (connecté/initiale, invité, photo), 44×44 px, `aria-expanded`/`aria-controls`, Entrée/Espace natifs (aucun gestionnaire custom), focus visible `focus-ring` |
| `PillTab` local          | ✓ (4 tests DOM) ; `aria-current="page"` sur l'actif uniquement, absence de `role="tab"` vérifiée par test, navigation réelle au clic vérifiée par test                                |
| `ProfilePanel`           | ✓ (4 tests DOM) ; `role="group"` + label i18n, jamais `menu`, 2 entrées existantes, focus initial première entrée                                                                     |
| Nav desktop pastilles    | ✓ fond `tint` actif, mêmes destinations/libellés                                                                                                                                      |
| Barre basse              | ✓ tokens + pastille active `tint` (cibles 72×64 conservées)                                                                                                                           |
| Cibles < 44 px corrigées | ✓ Compte 36×28 et Réglages 34×34 **supprimés** (→ avatar 44×44) ; marque ≥ 45 px ; langue ≥ 44 px ; badge + Quitter ≥ 44 px                                                           |
| Zéro couleur en dur      | ✓ garde d'architecture verte sur le périmètre exact du lot                                                                                                                            |
| Squelette                | ✓ `RecipesPage` ; `DataTab` inchangé                                                                                                                                                  |
| i18n 4 langues           | ✓ (2 nouvelles clés, entrées réutilisées) ; RTL via les propriétés logiques existantes                                                                                                |

---

## 3. Tests automatisés

- **Nouveaux** : `Skeleton` (3), `AvatarButton` (4), `PillTab` (4), `ProfilePanel` (4), garde
  « zéro palette en dur » (+1 dans `architecture.test.ts`) = **16 tests nouveaux**.
- **Suite complète `npm run check` : verte** — typecheck + oxlint 0 warning + Prettier +
  **886 tests passés / 29 skippés (100 fichiers)** (baseline 870 → +16 ; y compris matrice de
  persistance et contrastes de 2.6.1a et garde N8).
- Garde vérifiée négativement : une classe `slate-*`, `white/` ou un hexadécimal dans un fichier du
  périmètre fait échouer le test (regex validée sur une liste de chaînes bonnes/mauvaises).

---

## 4. Vérifications réelles navigateur (Chromium, serveur isolé port 3001, `DATA_STORE=memory`)

Protocole : harnais iframe à largeur exacte piloté par `preview_evaluate` (fichier temporaire
`public/__shell-harness.html`, **supprimé après vérification**) ; aucune donnée réelle.

### 4.1 Mesure réelle des cibles tactiles (Chromium seul, happy-dom ne mesure pas le layout)

| Largeur     | Cibles mesurées (en-tête)                                        | Cibles barre basse      | Cibles < 44 px | Chevauchements |
| ----------- | ---------------------------------------------------------------- | ----------------------- | -------------- | -------------- |
| 320 (S1–S3) | marque ~196–203×45, avatar 44×44                                 | 5 liens 64×64 (grid 64) | **0**          | **0**          |
| 375 (S4)    | marque 203×45, avatar 44×44                                      | 5 liens 72×64           | **0**          | **0**          |
| 768 (S5–S6) | marque ≥ 49, pills nav 44 (hauteur), langue 132×44, avatar 44×44 | (barre masquée md+)     | **0**          | **0**          |

Hauteur d'en-tête mesurée : **65 px (64 + bordure) aux 6 dimensions** — inchangée (zéro CLS de
l'en-tête) ; débordement horizontal : **0 px partout**.

### 4.2 Panneau compact — comportements vérifiés en réel

- **Mobile (320/375, ModalShell)** : ouverture (avatar `aria-expanded`), focus sur la première entrée,
  Échap ferme et **ramène le focus sur l'avatar**, clic extérieur ferme (identique), aucun rôle `menu`,
  aucune évaporation de saisie (pas de formulaire dans le panneau).
- **Desktop (768/1280, popover ancré)** : panneau sous l'avatar aligné à droite, **dans l'en-tête** ;
  Échap ferme + focus avatar ; clic extérieur ferme + focus avatar ; entrée « Réglages » ouvre la
  `SettingsModal` réelle (vérifiée : « Affichage » présent) ; entrée « Profil/Connexion » ouvre la
  `UserAccountModal` réelle.
- **Note d'implémentation (dossier § 2.4 respecté, précision de comportement)** : la destination
  s'ouvre **par-dessus le panneau** (overlays empilés) — fermer la destination **ramène au panneau
  ouvert**, puis Échap/clic extérieur ferme le panneau et rend le focus à l'avatar. Cette pile évite la
  contention d'historique de `useCloseOnBack` (deux overlays se fermeraient mutuellement au même
  instant : constaté puis corrigé pendant la vérification — les entrées n'ouvraient pas la modale) ;
  le décompte d'historique reste exact (profondeur panneau 1, modale 2, retour en cascade).
- Pendant l'ouverture **et** la fermeture du panneau : **aucun décalage de mise en page mesuré**
  (observation `layout-shift` : cumul identique avant/après interaction).

### 4.3 Matrice multilingue et RTL (couverture par risque — 8 scénarios du dossier)

| Scénario                   | Résultat                                                                      |
| -------------------------- | ----------------------------------------------------------------------------- |
| S1 320 · derja · clair     | ✓ shell complet, cibles, panneau, squelette, libellés tronqués, débordement 0 |
| S2 320 · ar · sombre       | ✓ RTL complet, cibles, barre basse thémée sombre (pastille `tint`)            |
| S3 320 · derja_ar · sombre | ✓ 2ᵉ variante RTL, libellés propres (ex. « الأكاي »)                          |
| S4 375 · fr · clair        | ✓ libellés français, panneau, cibles                                          |
| S5 768 · fr · clair        | ✓ pastilles desktop, popover, cibles élargies, zéro chevauchement             |
| S6 768 · ar · clair        | ✓ RTL desktop, panneau, langue dans l'en-tête (132×44)                        |
| S7 1280 · fr · clair       | ✓ pastilles, pastille active `tint`, panneau popover, CLS interaction 0       |
| S8 1280 · ar · sombre      | ✓ RTL desktop sombre, marque, débordement 0                                   |

`dir` (`rtl`/`ltr`) et mode sombre vérifiés sur `<html>` à chaque scénario ; les 4 langues et les 2
variantes RTL sont couvertes ; captures : S1, S2, S5 (popover ouvert), S8 sous
`%USERPROFILE%\.deepai-code\userdata\browser-artifacts\browser-screenshot-localhost-mwme*.png`.

### 4.4 Squelette réel

Capturé en réel sur `/recipes` (chargement) : carte structurée `bg-card` avec **3 blocs `Skeleton`**
(`aria-hidden` + pulsation) à ~581 ms, débordement 0.

### 4.5 Non-régression (checklist du dossier § 8)

- Canal staff 3 clics : **vérifié en réel** (3 clics marque → `/admin`) ;
- badge « Super admin » + « Quitter » : code repris tel quel (sm+), cibles remontées ≥ 44 px
  (la session super admin n'a pas été instanciée en réel — mécanisme inchangé, testé par la suite) ;
- mémoire de filtres (`useRecipesHref`) : code inchangé, liens de nav réutilisés ;
- « appuyez encore pour quitter » (`goHome`), bandeau d'installation, indicateur hors ligne :
  inchangés ;
- `BrandMark` : props/replis/canal inchangés (ses 6 tests passent) ;
- sélecteur de langue : inchangé (cible ≥ 44 px) ;
- `DataTab` (indicateur « en direct ») : inchangé.

### 4.6 Contrastes des nouvelles associations (calculés, tokens Zitouna)

| Association                                            | Clair    | Sombre   |
| ------------------------------------------------------ | -------- | -------- |
| Pastille active : texte `brand-text` sur fond `tint`   | **6,91** | **7,17** |
| Barre basse/pills inactifs : `ink-muted` sur `surface` | 5,53     | 8,68     |
| Avatar connecté : initiale `on-brand` sur `brand`      | 4,76     | 7,43     |
| Avatar invité : icône `ink-muted` sur `tint`           | 5,09     | —        |
| « Quitter » : `danger-text` sur `surface`              | 6,03     | 7,74     |

Toutes ≥ 4,5:1 (AA texte normal) ✓.

---

## 5. Performances (protocole du dossier : ≥ 3 mesures à chaud, médianes, mêmes conditions)

Serveur isolé 3001, onglet identique, 1280 px, fr clair, cache à chaud :

| Condition               | LCP (ms, à chaud)               | Médiane                             | CLS   | Poids transféré |
| ----------------------- | ------------------------------- | ----------------------------------- | ----- | --------------- |
| **Avant** (état 2.6.1a) | 1236, 1284, 848, 836            | **848**                             | 0     | 69 756 o        |
| **Après** (2.6.1b)      | 1216, 1188, 1036, 840, 852, 836 | **840** (3 dernières : 840/852/836) | **0** | 69 900 o        |

- LCP : **aucune dégradation** (médiane à chaud 848 → 840 ms ; les premières valeurs des deux séries
  reflètent le réchauffement du transform Vite, identique des deux côtés) ;
- poids : **+144 octets** (2 clés i18n × 4 langues + garde) — bundle inchangé sinon ;
- **CLS = 0** partout, y compris ouverture/fermeture du panneau (§ 4.2) ; en-tête à hauteur fixe.

---

## 6. Risques résiduels et points de revue

1. **Réflexe « Réglages »** : la roue dentée disparaît ; Réglages reste en 2 gestes (avatar →
   Réglages) — libellés i18n explicites ; revue du chef demandée (risque annoncé au dossier).
2. **Pile panneau/modale** : la destination s'ouvre par-dessus le panneau (§ 4.2) — comportement
   simple et cohérent avec l'historique ; à confirmer par le chef à la revue.
3. **Session super admin non instanciée en réel** (badge/Quitter) : mécanisme inchangé, cibles
   remontées ≥ 44 px ; vérification réelle possible sur demande du chef.
4. CLS mesuré **0** sur la page réelle ; le cumul 0,0063 observé dans le harnais iframe est un artefact
   de l'insertion de l'iframe elle-même (vérifié : 0 sans harnais, mêmes conditions).
5. La garde « zéro palette » est **limitée aux fichiers du lot** (dossier § 4) — l'adoption ailleurs
   reste progressive (2.6.2+) ; les écrans hors périmètre conservent leurs couleurs actuelles.

---

## 7. Critères de clôture (dossier § 10) — état

1. `npm run check` vert complet ✓ ; 2. garde zéro couleur verte sur le shell ✓ ; 3. cibles ≥ 44×44
   mesurées Chromium, sans chevauchement ni dégradation ✓ ; 4. pastilles + barre basse thémées,
   `aria-current`, panneau ARIA conforme, squelette ✓ ; 5. `BrandMark` inchangé (cible tactile § 5
   seulement) ✓ ; 6. aucune dépendance, aucune donnée, aucun contrat touché ✓ ; 7. perfs : CLS 0, LCP
   médiane non dégradée (840 vs 848 ms), +144 o ✓ ; 8. extensibilité multilingue : revue faite — aucun
   texte, langue, direction en dur dans les composants du lot ✓.

**Arrêt conformément aux instructions : après ce rapport, aucun commit, aucune fusion, aucun lot
suivant (2.6.2, 2.6.8 ou autre) ne sera démarré sans validation explicite du chef.**
