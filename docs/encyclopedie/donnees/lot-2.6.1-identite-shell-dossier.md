# Lot 2.6.1 — Identité & Shell — dossier de réalisation (v3, finale)

Statut : **présenté pour validation finale du chef** — aucun code modifié.
Historique : v2 (orientations thèmes/layouts/CMS intégrées) → v3 (responsabilité de sélection du thème,
garanties de changement de thème, responsive ≠ layouts alternatifs, critères UX/UI et accessibilité,
décision Fraunces justifiée par mesure) → **finale** (A3 reclassé décision retenue ; limites des tests
DOM précisées ; localité des composants partagés ; comportement de la résolution asynchrone future).
Références : plan consolidé pré-implémentation (matrice + séquencement), maquettes D4 (référence UX/UI),
doc 18 « CMS et gestion des expériences », dossier et rapport du lot 2.6.0 (commit `2ec4a74`, clôturé).

---

## 1. Objectifs et périmètre

**Objectif** : faire adopter à l'application réelle l'identité visuelle « C — Zitouna vive » (D4, D-04 🚩)
et moderniser le shell commun (en-tête, navigations, thèmes, états, accessibilité), sans retirer aucune
fonctionnalité (hors retrait demandé du sélecteur de thème client, § 2.1), sans toucher aux règles
métier et au moteur, et **sans enfermer l'application** dans une architecture incompatible avec le
futur système backoffice de thèmes, layouts et expériences (§ 2, § 6).

**Inclus dans le lot**

| Objet                                                                                                                                                                                 | Décision                                                  | État actuel                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Direction C « Zitouna vive » comme thème attribué par défaut                                                                                                                          | D-04 🚩 à valider (A1)                                    | absent                                         |
| Séparation des responsabilités du thème : core = contrats/validation ; configuration centralisée = défaut ; ThemeProvider = application seule                                         | ✅ retenue (v3)                                           | ThemeProvider lit lui-même la préférence       |
| Retrait du sélecteur de thème côté client (choix = backoffice)                                                                                                                        | ✅ retenue                                                | Réglages › Affichage propose les thèmes        |
| Le client ne choisit que le **mode** clair / sombre / système, indépendant du thème                                                                                                   | ✅ retenue                                                | déjà le cas pour le mode                       |
| Garanties au changement de thème (§ 7.2)                                                                                                                                              | ✅ retenue (v3)                                           | non spécifiées                                 |
| Alignement de la marque sur les appellation actuelles « Chnawa Ntayeb / by chef Souhed » **comme valeurs par défaut** (D-05 requalifié : non définitives, remplaçables intégralement) | ✅ décision retenue                                       | app affiche « Chnowa Ntayeb / by Chef Souhed » |
| Libellé « Semaine » dans la barre basse (D-11)                                                                                                                                        | 🚩 texte                                                  | « Menu Semaine »                               |
| Navigation desktop à pastilles (D-22)                                                                                                                                                 | ✅ retenue par le chef                                    | liens inline soulignés                         |
| Avatar remplaçant la roue dentée + panneau compact (D-23)                                                                                                                             | ✅ **validée (chef) — décision retenue, plus à arbitrer** | roue dentée + bouton compte                    |
| Nettoyage des couleurs en dur du shell (`slate-*`, `white/95`, `rose-500`)                                                                                                            | —                                                         | dette repérée                                  |
| États de chargement partagés (squelettes)                                                                                                                                             | shell.html                                                | ad-hoc (`animate-pulse` × 2)                   |
| Contraintes « non-enfermement » (§ 6) respectées dès 2.6.1                                                                                                                            | ✅ retenue                                                | à respecter                                    |

**Exclus du lot (reste à la roadmap, jamais abandonné)**

- **Assignation des thèmes depuis le backoffice** (thème desktop, thème mobile, thèmes de campagnes,
  thèmes d'expériences éditoriales ou de groupes) → lot CMS (doc 18 § 7).
- **Layouts alternatifs par type de page** choisis au backoffice → lot CMS, dimension « composition de
  page » ; **aucun** layout alternatif n'est construit dans 2.6.1.
- **Système de ciblage / expériences** (surcharges, priorités, fenêtres, groupes, segments) → lot CMS
  sur le mécanisme doc 18 § 3.6 ; rien n'est reconstruit dans 2.6.1.
- Éditeur de thèmes du backoffice (nouveaux champs) → lot CMS ; en 2.6.1, l'éditeur conserve son
  comportement actuel sur les thèmes existants.
- Cloche et panneau de notifications (D-20) → lot **2.6.8** : rien de visible tant que le port
  notifications n'existe pas (D12 : emplacements préparés toujours repliés, aucune pub visible).
- Catalogue des 59 composants D4 → implémentation **progressive** (2.6.2 et suivants), jamais en bloc.
- Accueil « personnel d'abord » (D-01) → lot 2.6.2 ; catégories affichées (D-24) → lot 2.6.2+.
- Frigo enrichi (D-27), carrousel (D-25), annulation 6 s (D-17) → lots suivants selon séquencement.
- Portrait du chef et photos définitives (D-21) → contenu du chef, hors code.
- Logo définitif (D-18) → fourni par le chef ; le symbole actuel reste en place, le texte s'aligne comme **valeur par défaut** de la configuration transitoire (D-05 requalifié).
- T3 (contrats API) : **lot dédié déjà validé par le chef**, distinct de 2.6.1.

## 2. Orientations produit retenues (chef) et leurs conséquences

### 2.1 Thèmes — décision retenue

> Le choix du thème appartient **exclusivement au backoffice** : thème pour desktop, thème pour mobile,
> thèmes de campagnes promotionnelles, thèmes d'expériences éditoriales ou de groupes de clients.
> Le client choisit uniquement son **mode** (clair / sombre / système), indépendant du thème appliqué.

Conséquences pour 2.6.1 :

1. Le sélecteur de thème de Réglages › Affichage est **retiré** (grille `ThemePreviewCard` + `setThemeId`
   côté UI) ; l'onglet Affichage ne garde que le mode. Aucun composant de l'app publique ne propose
   plus un choix de thème au visiteur.
2. **Responsabilité de sélection (v3)** — chaîne de responsabilité explicite :
   - le **core** (`src/core/theme`) définit les **contrats** (`AppTheme`, `ThemeColors`, `DisplayFont`,
     `CardShape`, `ThemePattern`) et la **validation** (`validateTheme`, `contrastRatio`,
     `colorsToCssVars`) ; il ne connaît ni campagnes, ni groupes, ni règles de ciblage, ni la notion de
     « thème par défaut » de l'application ;
   - une **configuration centralisée** (niveau application/conteneur, hors core) fournit aujourd'hui le
     thème attribué par défaut ;
   - le **ThemeProvider** reçoit le thème **résolu** et n'est responsable que de son **application**
     (variables CSS, police d'affichage) — plus aucune lecture de préférence pour choisir le thème ;
   - le futur CMS remplace la source actuelle par sa **résolution serveur** derrière un port, sans
     modifier le fonctionnement du ThemeProvider.
3. **Préférences de l'appareil — jamais une source de sélection du thème** : l'ancienne donnée
   `themeId` peut être **conservée temporairement pour la compatibilité** (tolérée à la lecture
   comme migration, jamais perdue), mais elle est **ignorée pour la sélection effective** du thème ;
   les préférences de l'appareil conservent uniquement le **mode d'affichage** et les éventuelles
   préférences locales autorisées — elles ne peuvent **jamais redevenir** une source de sélection
   du thème (N4, N6).
4. **Cache hors ligne** : il peut conserver le **thème résolu** pour garantir son application sans
   connexion, mais il ne transforme **jamais** une préférence client en règle d'attribution du
   thème — ce que le cache porte est le résultat d'une résolution, pas un choix du client.
5. Les trois thèmes intégrés (Classique, Fkhar, Zitouna) restent **valides et appliquables** — ils
   deviennent des valeurs affectables par le futur backoffice, plus des options de réglage client.
   Leur non-régression se vérifie en rendu direct (§ 8), plus par une bascule client.

### 2.2 Layouts — décision retenue

> Le backoffice doit pouvoir proposer plusieurs **layouts alternatifs** par type de page (accueil,
> catalogue, suggestions, détail recette, frigo, planning…) et choisir le layout appliqué,
> **indépendamment du thème**. Les layouts sont constitués de composants frontend réutilisables avec des
> variantes prédéfinies et des paramètres typés — pas d'édition libre du HTML ou du CSS depuis le
> backoffice.

**Distinction explicite responsive ↔ layout alternatif** (v3) :

- **Responsive** : l'adaptation d'**un même layout** aux dimensions de l'écran (320 → 1280) par ses
  variantes internes — grilles qui se replient, nav qui passe de barre haute à barre basse, tailles
  typographiques. Un layout est **responsif par construction** et doit rester fonctionnel sur toutes
  les dimensions ; c'est une propriété des composants, jamais un choix.
- **Layout alternatif** : une **composition différente** du même type de page (par ex. accueil en
  variantes éditoriales), choisie par le backoffice, **indépendante du thème** et indépendante de
  l'appareil. Chaque composition contient son propre comportement responsive : **les variantes
  desktop/mobile ne créent jamais des pages indépendantes** — il y a toujours un seul composant de
  page qui s'adapte, et un choix de composition qui lui est orthogonal.

**Alternatives conservées comme base de conception (décision retenue)** : les alternatives de
composition présentées dans D4 ne sont **pas écartées** par le choix d'une composition par défaut —
elles restent tracées dans la vision produit et la roadmap, comme futures layouts alternatifs
affectables au backoffice :

- **Filtres de la page Recettes** : « Feuille d'abord » et « Phrase seule »
  (`recettes-filtres-alt.html`, v4.7 🚩 à arbitrer) à côté de la variante validée (D-28) ;
- **Nav desktop** : « Pastilles » (retenue, D-22) avec les variantes « Éditorial » et « Dock »
  jouables dans `registre.html` ;
- **Accueil** : compositions A et B archivées (`accueil.html`, `accueil-b.html`) à côté de C (D-01).

Conséquence pour 2.6.1 : aucun layout alternatif n'est développé ; les composants du lot respectent les
contraintes de non-enfermement (§ 6) — en particulier N5 (écrans composés de composants sans hypothèse
de mise en page globale, comportement responsive intégré aux composants, pas au découpage des pages).
Le mécanisme des layouts rejoindra la dimension « composition de page » du CMS (doc 18 § 3.3 :
sections versionnées, paramètres typés, schémas fermés) — **pas un deuxième système**. Un layout du
CMS = des composants réutilisables à variantes et paramètres typés, responsive intégré, évoluant
indépendamment du thème, **sans édition libre de HTML/CSS** depuis le backoffice.

### 2.3 Ciblage et expériences — décision retenue

> Les affectations de thèmes et de layouts se contextualisent : desktop / mobile, campagnes
> promotionnelles, expériences éditoriales, groupes de clients (manuels et segments dynamiques).
> **Réutiliser le mécanisme d'expériences CMS** (doc 18 § 3.6) et ses **surcharges indépendantes par
> dimension** : une expérience surcharge uniquement le thème, uniquement le layout, ou les deux.
> Résolution déterministe des priorités en cas de concurrence, et dates de validité des campagnes.

Conséquence pour 2.6.1 : **rien à construire** ; le dossier du futur lot CMS s'appuiera directement sur
doc 18 § 3.6, qui prévoit déjà tout ce qui précède :

| Exigence du chef                                           | Couvert par doc 18                                                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surcharge uniquement thème, uniquement layout, ou les deux | « surcharges PARTIELLES : chaque dimension est facultative (thème visuel, thème éditorial, composition de page, messages) ; au moins une dimension surchargée »                  |
| Priorité déterministe en cas de concurrence                | « l'expérience éligible la plus prioritaire gagne par dimension ; départage stable par identifiant ; avertissement back-office en cas de conflit »                               |
| Dates de validité des campagnes                            | `starts_at` / `ends_at` + statuts `draft / scheduled / active / archived`                                                                                                        |
| Groupes manuels et segments dynamiques                     | `experience_version_group_audiences` (groupes client) + `experience_version_segment_audiences` (segments typés), rattachés à la version                                          |
| Desktop / mobile                                           | éligibilité par **canal** prévue ; la modélisation exacte de la paire thème desktop/thème mobile (dimension canal ou paires par défaut) sera arbitrée dans le dossier du lot CMS |
| Un seul système de personnalisation                        | les expériences portent thèmes + composition + ciblage + programme + priorité (doc 18 § 2)                                                                                       |

**Thèmes alternatifs conservés (décision retenue)** : Classique, Fkhar et Zitouna restent des thèmes
disponibles, et la direction **B « Contemporain sobre » est conservée comme candidate** issue de D4
(ajout possible comme thème intégré au lot CMS — données pures, même modèle de tokens). Le fait de
retenir éventuellement Zitouna comme défaut ne supprime ni n'abandonne aucun autre thème. Le futur
backoffice devra : gérer les **thèmes disponibles**, les **prévisualiser** (mécanisme d'aperçu
existant), **choisir celui à appliquer**, avec des **affectations différentes** selon desktop, mobile,
campagnes promotionnelles, expériences éditoriales et groupes de clients. **Chaque thème gère ses
propres variantes clair/sombre**, indépendantes du mode choisi par le visiteur (N4).

Le **core ne doit jamais connaître** les campagnes, groupes ou règles de ciblage : la résolution des
expériences vit côté serveur (doc 18 : classe d'audience calculée à la requête, jamais envoyée par le
client) et n'atteint l'application que comme « thème résolu » et « composition résolue » derrière des
ports (§ 6, N3).

### 2.4 Identité visuelle et éditoriale paramétrables — décision retenue

> **Une identité entièrement évolutive** : les appellations actuelles (« Chnawa Ntayeb »,
> « by chef Souhed ») ne sont **ni validées définitivement, ni figées** — elles correspondent à
> l'identité actuelle du projet et pourront évoluer, être modifiées ou remplacées intégralement.
> Elles ne sont donc **pas des constantes métier, ni des libellés définitifs, ni des éléments
> immuables dans le code**. Le futur backoffice paramètre : le nom de l'application et de la marque,
> la signature et le slogan principal, les logos complets et leurs éléments graphiques, les symboles,
> icônes et variantes du logo, les compositions graphiques et typographies associées, les
> déclinaisons pour fonds clairs et sombres, les versions mobile et desktop. Les valeurs actuelles
> servent de **défauts** et restent remplaçables intégralement.

> À terme, le backoffice gère **sans modification du code** : le logo principal et ses variantes
> (clair, sombre, horizontal, compact, icône), les logos des partenaires et marques, les photos des
> chefs et contributeurs, les images promotionnelles, bannières et visuels de campagnes, les autres
> ressources graphiques de l'identité — avec une **gestion des formats, dimensions, variantes et
> fonds** ; ainsi que **les textes** : slogan principal, accroches de l'accueil, slogans et messages
> des campagnes, textes promotionnels et signatures des partenaires, contenus éditoriaux des pages —
> avec les langues de l'application (arabe et RTL inclus).

**Distinction des deux familles de textes** : les **textes structurels de l'interface** (libellés,
navigation, boutons) restent gérés par le **système de traduction** existant ; les **contenus
éditoriaux et commerciaux** (slogans, accroches, messages de campagnes, signatures) passent par le
CMS. Aucun des deux ne vit en dur dans un composant.

**Réutilisation du CMS, jamais un système parallèle** : la bibliothèque de **médias** (doc 18 § 3.3)
pour les images et logos, les **champs éditoriaux localisés** (`<champ>_<langue>`, doc 18 § 3.3) pour
les noms, slogans et textes, des **composants réutilisables** alimentés par les **données résolues**,
la **publication contrôlée et l'historique des modifications** (cycle Staged/Online, doc 18 § 4.1),
et la **ciblabilité** future de certains contenus selon expériences éditoriales, campagnes, groupes
de clients et canaux (doc 18 § 3.6). **Aucun composant React n'embarque définitivement** logos,
images, noms ou slogans dans son code.

**Architecture (principe permanent)** : `brand.ts` n'est **pas la source définitive de l'identité** —
c'est la **configuration transitoire** qui fournit les valeurs par défaut de la phase actuelle. La
chaîne est : `brand.ts` (défauts) → futur CMS (ressources et contenus **résolus**) → composants qui
consomment **une identité déjà résolue**. Les composants **ne connaissent pas l'origine** des
ressources et ne contiennent **aucune identité de marque figée** ; le passage de la configuration
locale aux données du CMS ne nécessitera **aucune modification des composants consommateurs**.

Conséquences pour 2.6.1 (préparation, pas développement) :

1. **Configuration transitoire** : `src/app/brand.ts` centralise les **défauts actuels** (symbole,
   wordmark, signature, chemins des icônes) — une seule source au niveau application/conteneur, avec
   la vocation explicite d'être **remplacée** par la résolution du CMS.
2. `BrandMark`, `Header` et les autres composants du shell reçoivent **l'identité résolue en props**
   (ressources + textes + taille) — aucun d'eux ne contient de nom, de signature, de chemin d'image
   ni de composition graphique figés.
3. Les appellations actuelles « Chnawa Ntayeb » / « by chef Souhed » sont utilisées comme **défauts
   de la configuration transitoire** (alignement D-05 réalisé dans la configuration, pas dans le
   code des composants) — remplaçables intégralement depuis le futur backoffice.
4. Les ressources actuelles (`/mark.png`, favicon, icônes PWA de `public/`) servent de **défauts** ;
   le futur CMS les remplacera par des ressources résolues (bibliothèque de médias, routes
   `/brand/*` éventuelles) — préparation documentée, rien n'est construit.
5. **Replis de ressources** : si une ressource résolue est absente ou indisponible (image cassée,
   chemin absent), le composant se replie sur le défaut suivant de la chaîne (défaut de la
   configuration transitoire, puis lockup **texte seul**) — jamais d'affichage cassé ni d'écran vide.
6. Les **textes structurels** du shell restent des clés i18n (4 langues, RTL) ; les **accroches
   éditoriales** de l'accueil ne changent pas dans ce lot et passeront au CMS avec leurs champs
   localisés.

### 2.5 Synthèse de validation demandée

| Catégorie                                     | Éléments                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Décisions déjà retenues**                   | choix du thème = backoffice seul (desktop, mobile, campagnes, éditorial, groupes) ; client = mode seulement, indépendant du thème ; core = contrats/validation du thème, jamais le choix ni le ciblage ; configuration centralisée = défaut actuel ; ThemeProvider = application seule ; **avatar + panneau compact validés (D-23, chef)** ; layouts alternatifs backoffice par type de page (composants à variantes et paramètres typés, pas d'HTML/CSS libre), responsive ≠ choix de composition ; ciblage via le mécanisme d'expériences CMS unique (surcharges partielles, priorités déterministes, fenêtres de validité) ; **thèmes alternatifs conservés** (Classique, Fkhar, Zitouna + candidat B « Contemporain sobre ») avec gestion backoffice (prévisualisation, choix, affectation desktop/mobile/campagnes/éditorial/groupes) et variantes clair/sombre **par thème** ; **alternatives de layouts conservées** comme base de conception (filtres, nav desktop Éditorial/Dock, accueils A/B) ; **identité visuelle et éditoriale paramétrables** à terme (logo + variantes, logos partenaires, photos, visuels de campagnes ; slogans et textes localisés ar/RTL) via le CMS — médias (doc 18 § 3.3) + champs éditoriaux + ciblage (doc 18 § 3.6) — préparé en 2.6.1 par une configuration centrale de la marque et des composants à props, jamais en dur ; 2.6.1 reste identité + shell sans anticiper le système CMS |
| **Arbitrages clôturés (validés par le chef)** | **A1** : C « Zitouna vive » = thème attribué par défaut (examen visuel fait) ; **A2** : extension des 12 couleurs autorisée (compatibilité + repli) ; **A5** : `happy-dom` autorisé (limite : vérification navigateur maintenue) ; **A6** : décision par mesures (LCP, poids, CLS), chiffres au rapport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Hors périmètre (roadmap)**                  | assignation desktop/mobile et par campagnes/groupes ; layouts alternatifs ; expériences et ciblage ; éditeur de thèmes complet (nouveaux champs) ; cloche/notifications (2.6.8) ; accueil C (2.6.2) ; catalogue 59 composants ; photos (D-21) ; logo (D-18) ; T3 lot dédié                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Impacts architecturaux**                    | § 6 (N1–N7, vérifiables à la revue de code dès 2.6.1) et § 7 (modèle de thème compatible avec l'assignation serveur ; garanties de changement de thème)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## 3. État actuel du code et composants réutilisables

**Shell** — `src/app/AppLayout.tsx` : Header + BottomNav + modales globales (Réglages, Compte) + bandeaux
(Installation, Inviter à synchroniser, Hors ligne) + bouton haut de page + garde « appuyez encore pour
quitter ».

- `src/app/layout/Header.tsx` : marque (3 clics = canal employé), nav desktop inline 4 liens, badge/quitter
  super admin, bouton compte, sélecteur de langue, roue dentée → Réglages.
- `src/app/layout/BottomNav.tsx` : 5 onglets (Accueil, Frigo + badge, Recettes, Menu Semaine, Courses),
  cibles ≥ 44 px, `pb-safe`.
- Thème : `AppTheme` = **16 couleurs** + `displayFont` + `cardShape` + `pattern` → variables CSS Tailwind
  (`--color-*`, `colorsToCssVars`) ; 2 thèmes intégrés (Classique, Fkhar · Nabeul) + thèmes admin
  publiés ; modes clair / sombre / système ; variables appliquées par `ThemeProvider` en un point
  unique (déjà `useLayoutEffect`) ; thèmes chargés en cache hors ligne. Aucun thème intégré n'est
  supprimé.
- Réglages › Affichage : grille de cartes de thèmes (`ThemePreviewCard` + `setThemeId`) **à retirer**
  (§ 2.1) ; le mode (clair / sombre / système) reste.

**Composants partagés déjà en place** (`src/shared/ui`) : `ModalShell`, `ShowMore`, `IngredientThumb`,
`InstallBanner`, `OfflineIndicator`, `SyncInviteBanner`, `UpdatePrompt`, `ScrollToTopButton`, champs de
formulaire. Ils constituent la première couche ; le lot ne les remplace pas, il les habille.

**Dette repérée (à corriger dans ce lot, dans le périmètre shell)** : `BottomNav` et des parties du
`Header` codent des couleurs Tailwind en dur (`slate-500/900`, `white/95`, `rose-500`, bordures
`slate-200/700`) au lieu des variables de thème — les thèmes autres que Classique ne teintent pas
toujours la barre basse et le mode sombre n'y suit pas le thème.

**État des chargements** : pas de squelette partagé ; deux `animate-pulse` ad-hoc (RecipesPage, DataTab).

## 4. Correspondance D4 ↔ application réelle

| Élément D4                                                                              | Application réelle                      | Verdict                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Topbar mobile (marque 2 lignes + réglages)                                              | `Header` (marque, compte, langue, roue) | conforme, à re-typer                                                                              |
| Barre basse 5 onglets + badge frigo                                                     | `BottomNav`                             | conforme, couleurs en dur à migrer                                                                |
| Pastille d'onglet actif (fond `--tint`, C)                                              | texte coloré simple                     | à implémenter                                                                                     |
| Nav desktop « pastilles » (D-22)                                                        | liens inline                            | à remplacer                                                                                       |
| Avatar ouvre le profil (D-23)                                                           | roue dentée + bouton compte             | à remplacer                                                                                       |
| Cloche de notifications (D-20)                                                          | absente                                 | **hors lot** (2.6.8)                                                                              |
| Branding actuel « Chnawa Ntayeb / by chef Souhed » (D-05 — **défauts, non définitifs**) | « Chnowa Ntayeb / by Chef Souhed »      | à aligner                                                                                         |
| « Semaine » (D-11)                                                                      | « Menu Semaine »                        | à aligner                                                                                         |
| Squelettes de chargement                                                                | `animate-pulse` ad-hoc                  | composant partagé à créer                                                                         |
| Bandeaux hors ligne / installation / sync                                               | déjà présents                           | habillage uniquement                                                                              |
| Thème clair/sombre + halo crème C                                                       | 16 couleurs, pas de `tint`              | extension de modèle (§ 7)                                                                         |
| Choix de thème par le visiteur (maquettes de démonstration A/B/FK)                      | Réglages › Affichage                    | **retiré** (§ 2.1 : la démo `data-dir` des maquettes est un outil d'audit, pas un réglage client) |

Les comportements simulés des maquettes (résultats de matching déclarés dans `data.js`, scénarios de
démo, sélecteur de directions) ne deviennent **jamais** des règles métier : seule la présentation passe
dans le code.

## 5. Propositions visuelles et arbitrages nécessaires

Les quatre directions restent comparées dans les maquettes (`data-dir` A / B / FK / C — outil d'audit
et de démonstration pour le chef, pas une fonctionnalité). Différences concrètes :

|              | A « Classique » (actuel)                                              | B « Contemporain sobre »                        | FK « Fkhar · Nabeul »                                   | **C « Zitouna vive » (proposée)**                                |
| ------------ | --------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Ambiance     | vert + terracotta, sans-serif                                         | ardoise + safran, sobre, froide                 | bleu Nabeul + rouge + arches + zellige                  | **paprika, olive, safran sur crème chaud**                       |
| Personnalité | combinaison répandue (V-01 : produit interchangeable)                 | distincte mais loin du positionnement culinaire | forte mais folklorique ; risquée en identité par défaut | **tunisienne sans folklore ; chaleureuse, vive**                 |
| Sombre       | cartes ardoise sur fond vert-noir (V-02 : deux familles incohérentes) | gris bleuté froid                               | bleu nuit                                               | **bruns chauds (#1a120c → #26190f), jamais gris-bleu**           |
| Titres       | Plus Jakarta partout                                                  | Plus Jakarta                                    | Fraunces                                                | **Fraunces (titres latin), interface Plus Jakarta, arabe Cairo** |
| Rayons       | 16 px                                                                 | 10 px resserrés                                 | arche (cardShape)                                       | **20 px**                                                        |
| Danger       | rouge proche du terracotta                                            | rouge                                           | rouge                                                   | **cramoisi #b4233c, distinct du paprika**                        |
| Contrastes   | AA                                                                    | AA                                              | AA (line-strong corrigé v4)                             | **AA vérifié (58/58, `tools/contrast-check.mjs`)**               |

**Recommandation : C.** Argumentaire : le vivant vient de trois couleurs franches utilisées avec
parcimonie (une action paprika par écran, accents safran, olive pour les repères) sur un fond crème —
chaleur immédiate, cohérente avec la cuisine tunisienne du quotidien, sans motif folklorique autour du
logo (règle « à éviter » de `identite.html`). Avec l'orientation § 2.1, C devient le thème **attribué
par défaut** ; A et Fkhar restent des thèmes valides pour le futur backoffice (non-régression vérifiée
au § 8 en rendu direct, plus par un choix client).

**Aucune direction n'est abandonnée (décision retenue)** : retenir C (ou tout autre défaut) ne
signifie pas supprimer les autres. Classique (A), Fkhar, Zitouna restent des thèmes conservés et
la direction **B « Contemporain sobre » reste une candidate à part entière**, conservée comme
alternative issue de D4, ajoutable comme thème intégré au lot CMS (§ 2.3).

**Décision D-04 : validée (chef)** — la direction C « Zitouna vive » est confirmée comme thème
attribué par défaut, après examen visuel des maquettes D4 ; le rendu réel sera vérifié
visuellement à nouveau après le sous-lot 2.6.1a (vérification, pas revalidation).

### Arbitrages restants (les seuls encore ouverts)

| Arbitrage | Question                                                                                                                                                    | Recommandation                                                                                                                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1**    | D-04 : C « Zitouna vive » devient-elle le thème attribué par défaut (fourni par la configuration centralisée en 2.6.1, assignation backoffice au lot CMS) ? | **✅ VALIDÉE (chef)** après examen visuel des maquettes D4. Indépendance conservée : le défaut reste modifiable par simple configuration (aucun changement du core ni du ThemeProvider)                                                                                                         |
| **A2**    | Extension du modèle `AppTheme` : 3 couleurs utilitaires (`tint`, `lineStrong`, `focusRing`) + 9 sémantiques (danger/success/warning/info ×3) — voir § 7.1   | **✅ VALIDÉE (chef)** — modèle complet D4, migration transparente des thèmes existants ; réalisable indépendamment de A1                                                                                                                                                                        |
| **A5**    | Ajouter `happy-dom` (dépendance de dev, gratuite) pour tester les composants partagés                                                                       | **✅ VALIDÉE (chef)** — avec sa limite assumée : les tests DOM automatisent contrats, ARIA, comportements et certaines propriétés CSS ; la vérification dans un vrai navigateur reste requise (44 px au contact, RTL visuel, chevauchements, responsive 320-1280)                               |
| **A6**    | Chargement de Fraunces : lien initial vs chargement à la demande — **décision tranchée par mesure**, pas par principe                                       | Implémenter d'abord avec le lien initial, **mesurer** (LCP, poids transféré, CLS) selon la méthode du lot 1.4 ; si la mesure ne justifie pas le chargement initial, basculer sur `ensureFontLoaded` au premier rendu du thème ; la décision et les chiffres sont consignés au rapport de 2.6.1a |

**Statuts (validés par le chef)** : A1 — **validée**, direction C « Zitouna vive » choisie comme
thème attribué par défaut (examen visuel des maquettes D4 fait) ; A2 — **validée**, extension des
12 couleurs autorisée avec les mécanismes de compatibilité et de repli prévus ; A5 — **validée**,
`happy-dom` autorisé comme dépendance de développement ; A6 — approche fondée sur les mesures
(LCP, poids transféré, CLS) confirmée. **Ces validations concernent les arbitrages de conception
uniquement et ne valent pas autorisation de développement du sous-lot 2.6.1a.**

**Décision déjà retenue (reclassée, plus à arbitrer) — D-23 avatar** : l'avatar remplace la roue
dentée dès 2.6.1 avec un **panneau compact** qui ouvre les modales existantes (Réglages, Compte) ;
écran profil complet plus tard. Validée par le chef.

## 6. Architecture frontend et contraintes de non-enfermement

Décomposition à respecter strictement (plan consolidé § architecture + composants) :

1. **UI génériques partagés** (`src/shared/ui`) — **localité d'abord (règle des composants partagés)** :
   un composant utilisé par un seul écran reste **local** à cet écran (`src/app/layout/`,
   `src/features/<écran>/`) ; le passage dans `src/shared/ui` n'a lieu que sur une **justification
   concrète de réutilisation** (un deuxième consommateur existe déjà, ou est déjà retenu par le
   découpage des lots). Aucune abstraction générique prématurée ; chacun garde son contrat (rôle,
   props typées, états, accessibilité, RTL, tests) :
   - `BrandMark` : lockup marque, **toutes ses ressources et ses textes reçus en props** (ressource
     graphique, wordmark, signature, taille) avec des défauts fournis par la **configuration
     transitoire `brand.ts`** (§ 2.4) — le composant ne contient **ni nom, ni signature, ni chemin
     d'image, ni URL fixe, ni composition figée** ; repli « texte seul » si la ressource manque ;
     aucune dépendance routeur — **un seul consommateur (Header) : local** à `src/app/layout/`,
     monté en partagé si un deuxième écran l'utilise (fiche recette, bienvenue) ;
   - `Skeleton` : placeholder de chargement (largeur/hauteur/lignes en props, `aria-hidden`) —
     **réutilisation concrète** : RecipesPage ET les états du shell ; créé partagé dès 2.6.1b ;
   - `PillTab` : **lien** de nav desktop à pastille, `href` en props (jamais `useNavigate`), **`aria-current="page"`
     sur l'actif — pas de modèle `tablist`/`role="tab"`** — **un seul consommateur (nav desktop) : local** à
     `src/app/layout/` ;
   - le panneau avatar (D-23) n'est **pas un `menu`** : composition de boutons ouvrant les modales existantes
     (`aria-expanded`/`aria-controls`, Entrée/Espace, Échap + clic extérieur, focus rendu à l'avatar) ;
   - **extensibilité multilingue vérifiée** (§ 8 bis du dossier d'exécution) : aucune limitation nouvelle
     créée par 2.6.1b ; suite à la vérification, **orientation architecturale multilingue validée par le
     chef** → `orientation-multilingue-validee.md` (registre centralisé en base, tables de traduction
     relationnelles par entité réellement localisable, sans JSON ni EAV, catalogues d'interface
     dynamiques, scénarios de validation 1–10) ; l'implémentation SQL actuelle (colonne `data` JSON)
     reste un **écart architectural enregistré** (règle permanente CLAUDE.md point 9), à traiter dans le
     périmètre de la migration SQL, pas dans 2.6.1b ;
   - `AvatarButton` : bouton d'ouverture du profil, contenu en props, `aria-haspopup` — **deux
     consommateurs dès 2.6.1b** (Header desktop, panneau sur mobile) : partagé justifié.
     En résumé : seuls `Skeleton` et `AvatarButton` entrent dans `src/shared/ui` au lot ; `BrandMark` (créé en 2.6.1a, à props) et `PillTab` restent locaux tant qu'aucun deuxième consommateur n'existe.
2. **Composants métier réutilisables** : aucun nouveau — `IngredientThumb`, `ModalShell`… restent.
3. **Composants spécifiques** : `Header`, `BottomNav`, futur `ProfilePanel` (2.6.1b), dans
   `src/app/layout/` / `src/features/settings/` — sans logique métier.
4. **Compositions de pages** : `AppLayout` assemble ; aucune page ne change de logique.
5. **Logique métier séparée** : rien ne change dans `src/core` et `src/application`, **sauf** la
   mécanique de thème (§ 7), qui est une donnée de préférence déjà gérée par ces couches.

**Contraintes de non-enfermement** (impacts du futur système thèmes/layouts/expériences) :

| #   | Contrainte dès 2.6.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Ce que le lot CMS changera (et ne changera pas)                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | **L'application d'un thème reste centralisée** : un seul endroit (`ThemeProvider`) transforme un `AppTheme` en variables CSS. Rien d'autre n'applique des couleurs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Le CMS change **qui choisit** le `AppTheme` (résolution serveur) ; l'application ne change pas.                                                                             |
| N2  | **Un écran ne référence jamais un id de thème, une couleur ou une police** : il consomme des variables CSS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Aucun changement ; les expériences surchargent le thème par-dessus.                                                                                                         |
| N3  | **Le core définit les contrats et la validation des thèmes, rien d'autre** : aucune notion de thème par défaut, de campagne, de groupe ou de ciblage dans `src/core`. La sélection vit **hors core** : configuration centralisée (défaut actuel) puis résolution serveur (CMS) derrière un port d'application.                                                                                                                                                                                                                                                                                                                                                                                            | La source de résolution est remplacée ; les contrats, la validation et l'application ne changent pas.                                                                       |
| N4  | **Le mode (clair/sombre/système) reste une préférence locale du client**, indépendante du thème appliqué — quel que soit le thème résolu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Aucun changement ; une expérience peut fournir un thème différent sans toucher au mode du client.                                                                           |
| N5  | **Les écrans restent composés de composants** sans hypothèse sur la mise en page globale (aucun écran ne dessine son propre chrome) ; le comportement **responsive** est porté par les composants (variantes internes), jamais par des pages séparées par appareil.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Un layout alternatif = une autre composition des mêmes composants (dimension « composition de page » du CMS, doc 18 § 3.3) — pas un fork par écran ni un fork par appareil. |
| N6  | **Aucun sélecteur de thème côté client**, aucun code de bascule de thème dans l'UI publique.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Retiré en 2.6.1a ; l'aperçu backoffice (`setPreviewTheme`) reste le seul mécanisme de prévisualisation.                                                                     |
| N7  | **Le ThemeProvider ne décide rien** : il reçoit un `AppTheme` résolu (et le mode du client) et l'applique ; ses garanties sont celles du § 7.2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Aucun changement ; le port de résolution alimente le ThemeProvider, jamais le contraire.                                                                                    |
| N8  | **Aucune identité figée dans les composants** : les composants du shell consomment **une identité déjà résolue** (ressources + textes) reçue en props, fournie par la configuration transitoire `brand.ts` (défauts actuels, **non définitifs**) ; le futur CMS en sera la source résolue, **sans modifier les consommateurs**. Ni nom, ni signature, ni chemin d'image, ni URL fixe, ni composition graphique dans le code des composants ; les textes structurels restent des clés i18n (4 langues, RTL) ; **repli fiable** si une ressource manque (jamais d'affichage cassé) — le texte de secours vient toujours de l'identité résolue, **jamais d'une appellation codée en dur dans un composant**. | Le CMS remplacera la source par les données résolues (médias + champs éditoriaux + publication contrôlée + ciblage, doc 18) ; les composants ne changent pas.               |

Règles transverses inchangées : composants partagés sans import du routeur ni de Firebase ni
d'`src/infrastructure` ; textes toujours traduits (aucune chaîne en dur, backoffice compris) ; RTL via
propriétés logiques (`ms-*`/`me-*`/`ps-*`/`pe-*`, `rtl:`) ; cibles ≥ 44 px ; zéro CLS (hauteurs
d'en-tête fixes).

**Fichiers principaux du lot** — 2.6.1a : `src/core/theme/*` (modèle + validation + `ZITOUNA_THEME`),
`src/app/providers/ThemeContext.tsx` (application seule), `src/application/theme/*` (`resolveTheme`),
`src/index.css` (variables), `src/app/brand.ts` (**configuration transitoire** de la marque, défauts
non définitifs, § 2.4), `src/app/layout/BrandMark.tsx` (à props, repli « texte seul »),
`Header.tsx` / `BottomNav.tsx` (libellés, variables, couleurs de thème). 2.6.1b :
`src/shared/ui/{Skeleton,AvatarButton}.tsx`, `PillTab` local, `ProfilePanel` compact, adoption
complète des variables dans le shell (`BrandMark` créé en 2.6.1a).

## 7. Impacts fonctionnels et techniques

### 7.1 Extension du modèle de thème (A2) — analyse de compatibilité permanente (CLAUDE.md, § Firebase/SQL)

> **A2 validée par le chef** : l'ajout des 12 champs de couleurs (et leurs valeurs de repli) est
> autorisé, avec les mécanismes de compatibilité et de repli prévus ci-dessous. La variante « sans
> extension » reste documentée comme repli possible si un obstacle technique imprévu apparaissait.

| Élément             | Analyse                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modèle cible        | `ThemeColors` : + `tint` (fonds doux), `lineStrong` (bordures utiles ≥ 3:1), `focusRing`, + `danger`/`dangerStrong`/`dangerText`, `success`/`successText`, `warning`/`warningText`, `info`/`infoText`                                                                                                                                                                                                              |
| Firestore           | mêmes documents `app_themes` ; champs hex supplémentaires validés ; thèmes existants complétés par des valeurs de repli à la lecture (`migrateThemes`, comme `migrateIngredients`)                                                                                                                                                                                                                                 |
| SQL (préparation)   | la table `themes` (une table par collection) gagne 12 colonnes typées ; aucune relation ni aucun index nouveau ; le futur système d'assignation restera modélisé selon doc 18 (tables typées, FK réelles et composites, jamais de JSON)                                                                                                                                                                            |
| Contrat de stockage | aucune opération nouvelle ; le thème reste un objet écrit en entier, sans fusion ni `undefined`                                                                                                                                                                                                                                                                                                                    |
| Données existantes  | thèmes admin déjà publiés sans les nouvelles clés : valeurs de repli dérivées (danger = rouge actuel, tint = surface légèrement teintée, focusRing = brand) — **jamais** une lecture `undefined`                                                                                                                                                                                                                   |
| Tests               | **matrice de compatibilité et de persistance complète (§ 8)** : lecture des anciens thèmes sans les 12 propriétés, replis appliqués, sauvegarde/restauration, allers-retours entre mécanismes de persistance, conservation de Classique/Fkhar, absence de régression sur les thèmes personnalisés, compatibilité des données existantes sans perte ni modification destructive ; contraste AA des valeurs de repli |
| Persistance         | les thèmes restent des objets **écrits en entier, sans fusion ni `undefined`** ; un thème ancien relu puis réécrit ne perd **aucune donnée** (aucun champ retiré, aucune réécriture destructive) ; la migration est **additive à la lecture** — aucune transformation de stockage obligatoire                                                                                                                      |
| Limites             | l'éditeur de thème du backoffice affichera les nouveaux champs au lot CMS ; en attendant, il écrit des thèmes complets via les valeurs de repli                                                                                                                                                                                                                                                                    |

D4 note ces ajouts comme « extensions de modèle, signalées » (commentaires d'`app.css`) : les couleurs
sémantiques sont **indépendantes de l'accent** — leur signification ne change pas selon la direction.

### 7.2 Garanties au changement de thème (vérifiées dès 2.6.1a)

| Garantie                                        | Comportement exigé                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Vérification                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Pas de flash visuel à l'initialisation**      | au démarrage, le thème intégré ou **disponible dans le cache** est appliqué immédiatement (variables posées par `useLayoutEffect` avant peinture, déjà le cas, conservé) : l'application ne doit **jamais afficher d'écran non thémé** ni provoquer de flash lié à l'initialisation du thème. Distinction assumée : lors d'une **future résolution CMS**, si le serveur fournit ultérieurement un thème différent de celui appliqué initialement, un **changement visuel peut se produire** — l'absence de changement n'est pas promise dans ce scénario (cf. ligne « Résolution distante asynchrone » ci-dessous)                                    | test (mode DOM, si A5) : les variables sont posées à l'engagement du commit initial ; vérification manuelle navigation froide   |
| **Pas d'affichage d'un thème incorrect**        | le thème résolu est disponible **de façon synchrone** avant le premier rendu : les thèmes intégrés (dont le défaut) sont dans le bundle ; aucun état intermédiaire « sans thème » n'est rendu                                                                                                                                                                                                                                                                                                                                                                                                                                                         | test : premier rendu = variables du thème résolu ; vérification manuelle chargement                                             |
| **Mode conservé lors d'un changement de thème** | le mode (clair/sombre/système) est un état indépendant : changer de thème ne le réinitialise pas ; changer de mode ne recharge pas le thème (N4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | test : bascule de thème puis lecture du mode (inchangé) ; bascule de mode puis lecture du thème (inchangé)                      |
| **Thème demandé indisponible hors ligne**       | les thèmes intégrés sont toujours disponibles (bundle) ; **repli seulement si le thème demandé est réellement indisponible** (ni dans le bundle ni dans la copie hors ligne) : un thème personnalisé déjà disponible localement **reste appliqué**, jamais remplacé par le défaut ; un thème publié absent hors ligne → **repli automatique sur le thème par défaut** (intégré), sans message d'erreur ni écran vide ; à la reconnexion, la liste publiée est rafraîchie et le thème résolu peut être réappliqué sans rechargement                                                                                                                    | test (faux adaptateurs) : thème inconnu/hors copie → défaut ; vérification manuelle hors ligne                                  |
| **Résolution distante asynchrone (futur CMS)**  | deux situations distinguées : **(1) première visite sans résolution serveur disponible** → le thème intégré par défaut est affiché immédiatement, sans écran vide ni absence de thème ; **(2) visite avec une résolution serveur déjà disponible** → le thème ciblé est appliqué **avant le premier affichage** lorsque le contexte le permet. Si une résolution distante n’arrive qu’**après** le premier affichage, un **changement de thème est possible** : l’absence de transition n’est **pas promise** dans ce cas — le mécanisme d’application (bootstrap serveur, données de démarrage ou équivalent) sera étudié dans le dossier du lot CMS | test du contrat de résolution (thème intégré immédiat en repli ; thème résolu appliqué sans état intermédiaire)                 |
| **Sans rechargement complet**                   | changer de thème ou de mode **ne recharge jamais la page** : seules les variables CSS et la police d'affichage changent ; les données, la navigation et la saisie en cours sont intactes                                                                                                                                                                                                                                                                                                                                                                                                                                                              | test : le thème change sans événement de navigation ; vérification manuelle (frigo rempli + changement de thème = aucune perte) |
| **Police d'affichage du nouveau thème**         | appliquée via `ensureFontLoaded` (lien injecté, `display=swap`) ou déjà présente si chargée au départ (A6) ; un FOUT d'appoint est possible lors du premier changement vers une police non encore chargée — sans rechargement ni décalage de mise en page majeur                                                                                                                                                                                                                                                                                                                                                                                      | test : le lien de police est posé à l'application du thème ; vérification manuelle                                              |

Ces garanties appartiennent à la couche d'application du thème (N7) et sont réutilisables telles
quelles par le lot CMS : la résolution serveur alimente le même ThemeProvider avec les mêmes
comportements de repli.

### 7.3 Source du thème appliqué (orientation § 2.1, v3)

- Le **core** fournit les contrats, la validation et le registre des thèmes intégrés : **uniquement
  les définitions et données des thèmes** (Classique, Fkhar, Zitouna) — il **ne décide jamais
  lequel** doit être appliqué et **ne contient aucune logique de sélection du thème par défaut**.
  La sélection reste exclusivement **aujourd'hui** dans la configuration centralisée de
  l'application, **demain** dans la résolution serveur du CMS, derrière un port.
- Une **configuration centralisée** (niveau application/conteneur, ex. fournie par `container.ts`)
  fournit aujourd'hui l'id du thème par défaut (`zitouna` si A1).
- Une petite **fonction de résolution dans `src/application`** (`resolveTheme`) sélectionne le
  `AppTheme`. Elle est **purement synchrone** : elle **ne lit jamais elle-même** IndexedDB ou le
  réseau — elle **reçoit les données déjà chargées** (thèmes intégrés du bundle + copie locale déjà
  chargée par l'infrastructure). Sélection : thème demandé (futur port de résolution) → trouvé
  (bundle **ou copie locale**) = appliqué, **jamais remplacé par le défaut** ; repli sur le thème
  par défaut de la configuration **seulement si le thème demandé est réellement indisponible**
  (introuvable dans le bundle ET dans la copie chargée, ou non publié). **Repli documenté si le
  thème demandé n'est pas encore disponible** : tant que la donnée n'est pas chargée, le thème
  par défaut est appliqué (garantie « thème résolu avant le premier affichage lorsque les données
  sont disponibles » du § 7.2) ; quand la donnée arrive, la résolution est rejouée avec le même
  contrat, sans rechargement. Testée avec de faux adaptateurs, y compris les deux situations du
  repli hors ligne (§ 8). Le ThemeProvider ne résout rien : il reçoit le résultat (N7).
- Le lot CMS remplacera la configuration par sa résolution serveur derrière un port ; le core, la
  fonction de repli et le ThemeProvider ne changent pas.
- **Préférences de l'appareil** : elles ne sont **jamais** une source de sélection du thème —
  l'ancien `themeId` est conservé temporairement pour la compatibilité mais **ignoré pour la
  sélection effective** ; seuls le **mode** et les préférences locales autorisées y restent.
- **Cache hors ligne** : il porte le **thème résolu** (pour l'application sans connexion), jamais
  une préférence client transformée en règle d'attribution.
- **Résolution distante et asynchrone (futur CMS) — deux situations** : le ThemeProvider reçoit
  **toujours un thème résolu** (« un `AppTheme`, jamais un chargement en cours ») et un thème
  **intégré est disponible immédiatement** comme repli (dans le bundle).
  **(1) Première visite sans résolution serveur disponible** : le thème intégré par défaut est
  affiché immédiatement, sans écran vide ni absence de thème.
  **(2) Visite avec une résolution serveur déjà disponible** : le thème ciblé est appliqué **avant le
  premier affichage** lorsque le contexte le permet — pour le futur CMS, une **résolution initiale
  intégrée au chargement** (bootstrap serveur, données de démarrage ou mécanisme équivalent) sera
  étudiée dans son dossier.
  Si une résolution distante n'arrive qu'**après** le premier affichage, un **changement de thème est
  possible** : l'absence de transition n'est **pas promise** dans ce cas — seule l'absence d'état
  incorrect (écran sans thème, thème erroné) reste garantie. La stratégie de mise à jour après
  résolution serveur (moment d'application, transition, cohérence avec la composition de page) sera
  détaillée dans le dossier du lot CMS — rien n'est anticipé dans 2.6.1 au-delà du contrat « thème
  résolu + repli intégré immédiat ».

### 7.3 bis Résolution de l'identité et replis de ressources (orientation § 2.4)

- **Chaîne** : `brand.ts` (défauts transitoires) → futur CMS (identité **résolue** : médias de la
  bibliothèque, champs éditoriaux localisés, publication contrôlée Staged/Online, historique) →
  composants consommant une identité déjà résolue en props. Le changement de source ne touche aucun
  consommateur (N8).
- **Replis — quatre cas distingués** (le texte affiché en secours vient **toujours de l'identité
  résolue** : phase actuelle = configuration transitoire `brand.ts` ; à terme = identité résolue du
  CMS — **jamais une appellation codée en dur** dans `BrandMark` ou un autre composant) :
  **(1) logo absent** → afficher le **nom de marque résolu sous forme de texte**, si disponible
  (lockup texte seul) ;
  **(2) nom de marque absent** → **comportement neutre et propre** (symbole seul si disponible,
  sinon rien d'affiché proprement) — **sans inventer de texte ni réintroduire une ancienne
  appellation** ;
  **(3) ressource invalide ou inaccessible** (image cassée, chemin absent, média non publié) →
  appliquer le repli prévu, **éviter tout affichage cassé** et **tracer l'anomalie** (journal
  diagnostic du shell, visible en développement) pour faciliter sa correction ;
  **(4) identité partiellement disponible** → afficher **uniquement les éléments réellement
  disponibles**, sans empêcher le reste de l'application de fonctionner.
  Le mécanisme reste **simple, fiable et cohérent avec la performance** (pas de chargement
  supplémentaire, pas de re-render lourd) ; des tests couvrent les quatre cas.
- **Formats et variantes** : la gestion des formats, dimensions, variantes et fonds (clair/sombre,
  mobile/desktop) est une donnée de la bibliothèque de médias du CMS — hors lot, notée au dossier CMS.
- **Textes** : structurels = système de traduction (i18n, 4 langues, RTL) ; éditoriaux et
  commerciaux = champs CMS localisés — aucune des deux familles en dur dans un composant.

### 7.4 Performances

- Aucune dépendance nouvelle en production (Google Fonts déjà utilisées ; Fraunces = 1 famille
  supplémentaire, poids 600/700, `display=swap`, preconnect déjà en place).
- **Fraunces (A6)** : la variante de chargement (lien initial vs à la demande) est tranchée par
  **mesure** — LCP, poids transféré, CLS, comparés à la baseline du lot 1.4 selon la méthode
  reproductible (D13) ; chiffres et décision consignés au rapport de 2.6.1a.
- Halo crème C = `radial-gradient` CSS, zéro ressource image ; `pattern: 'none'` = aucun SVG chargé.
- Icônes : lucide déjà présent, aucune police d'icône nouvelle.
- Zéro CLS : hauteurs d'en-tête et de barre basse inchangées et fixes ; `Skeleton` réserve la place.

## 8. Tests et critères d'acceptation

- `npm run check` vert à la clôture de chaque sous-lot (typecheck, lint 0 warning, format, tous les tests).

**2.6.1a — critères automatisés**

- **Validation hex des 12 nouvelles clés** (léger : reprise des helpers existants).
- **Compatibilité et persistance des thèmes (matrice obligatoire, pas seulement en mémoire)** :
  1. **lecture d'un ancien thème enregistré sans les 12 nouvelles propriétés** (thème intégré, thème
     admin publié, sauvegarde JSON importée) → aucune lecture `undefined`, **valeurs de repli
     appliquées** (danger = rouge actuel, tint = surface teintée, focusRing = brand, sémantiques = base) ;
  2. **application correcte des replis** : variables CSS générées complètes et contrastes AA des
     paires réelles avec valeurs de repli ;
  3. **sauvegarde et restauration** : export JSON (objets complets, toutes langues/champs) puis
     import relu par le parseur — test d'aller-retour existant étendu aux 12 clés ;
  4. **allers-retours entre les mécanismes de persistance concernés** : magasin serveur
     (collection `app_themes`, écriture en entier sans fusion) → copie locale (cache hors ligne) →
     préférences de l'appareil → export/import JSON ; chaque allers-retours conserve les valeurs
     (y compris les valeurs de repli calculées à la lecture, sans les figer en base) ;
  5. **conservation des thèmes intégrés Classique et Fkhar** (et de la candidate B, tracée comme
     données D4) : valeurs inchangées, aucune suppression, réglages existants fonctionnels ;
  6. **absence de régression sur les thèmes personnalisés déjà enregistrés** : un thème admin
     relu/affiché avant et après le lot donne le même rendu (hors valeurs de repli ajoutées) ;
  7. **compatibilité des données existantes** : aucune perte, aucune modification destructive —
     la migration est additive, réversible en lisant avec l'ancien code (les champs ignorés).
- **Contrastes AA sur les associations réellement utilisées, y compris les boutons et leurs états
  interactifs** : le test core couvre les paires effectivement rendues par les composants — texte
  principal sur `card` et `surface`, texte atténué sur `card`/`tint`, `on-brand` sur `brand`,
  `brand-text` sur `card`, `line-strong` ≥ 3:1 sur `card`, `focus-ring` visible sur `card`, badge et
  pastille d'onglet actif (`--tint`) — **et les états interactifs des boutons** (repos, survol via
  `brand-strong`/`accent-strong` et leurs textes, appui actif, désactivé). Pour Zitouna clair et
  sombre, et pour les valeurs de repli des thèmes existants (registre D4 + associations du shell).
  **Le rapport de 2.6.1a consigne les ratios mesurés paire par paire** (tableau association → ratio,
  clair et sombre), pas uniquement le résultat global 58/58.
- Résolution de thème, **deux situations testées** : (1) un thème personnalisé **disponible
  localement** (cache hors ligne) est appliqué tel quel, **jamais remplacé par le défaut** ;
  (2) un thème **réellement indisponible** (inconnu / non publié / absent du bundle et de la copie
  hors ligne) → repli sur le défaut de la configuration ; le core ne connaît aucun défaut ni ciblage
  (garde : `src/core/theme` n'importe que ses propres types).
- Garanties § 7.2 : mode conservé lors d'un changement de thème ; thème résolu posé au premier rendu
  (pas d'état intermédiaire) ; changement de thème sans rechargement (aucun événement de navigation).
- `resolveTheme` est **synchrone et pure** : test vérifiant qu'elle reçoit des données déjà chargées
  et n'effectue aucune lecture IndexedDB/réseau elle-même ; repli par défaut tant que la donnée n'est
  pas disponible (rejeu au chargement sans rechargement).
- Le thème par défaut vient de la **configuration centralisée**, pas du core ni du ThemeProvider.
- **Identité paramétrable (§ 2.4)** : **aucun nom, chemin d'image, URL fixe ni texte de marque codé
  en dur** dans les composants du shell ; l'identité vient de la configuration transitoire
  `src/app/brand.ts` et passe par `BrandMark` et les props ; remplacer le fichier de symbole (même
  nom) ou les valeurs de la configuration suffit à changer le visuel, **sans modification de code des
  composants** ; les appellations actuelles sont vérifiées comme **valeurs de la configuration**
  (pas comme constantes du code).
- **Replis d'identité — quatre cas testés (§ 7.3 bis)** : (1) logo absent → nom de marque **résolu**
  affiché en texte ; (2) nom de marque absent → comportement neutre et propre, **aucun texte
  inventé ni ancienne appellation réintroduite** ; (3) ressource invalide ou inaccessible → repli
  sans affichage cassé + **anomalie tracée** ; (4) identité partiellement disponible → seuls les
  éléments disponibles affichés, le reste de l'app fonctionne.
- **Garde anti-codage en dur** : un test d'architecture vérifie qu'**aucune appellation actuelle**
  (« Chnawa Ntayeb », « by chef Souhed ») n'apparaît dans les composants hors de la configuration
  transitoire `brand.ts` (même mécanisme de lecture de sources que la garde T2/T4).

**2.6.1a — critères UX/UI et accessibilité (vérifiés manuellement, consignés au rapport)**

- **Hiérarchie visuelle et lisibilité des titres Fraunces** : échelle de titres lisible à 320 / 375 /
  768 / 1280, interligne et crénage sans collision, contraste des titres AA sur les fonds réels
  (crème, `tint`, héros photo), arabe et derja arabe restent en **Cairo** (Fraunces n'a pas de
  glyphes arabes — à vérifier explicitement sur les 4 langues).
- **Textes longs et libellés sur petits écrans** : marque sur deux lignes à 320 ; « Semaine » tient
  dans sa cellule à 320 et 375 (pas d'élargissement de la page, règle CLAUDE.md mobile) ; textes
  longs des bandeaux (installation, sync, hors ligne) enroulés sans débordement ; ellipses uniquement
  là où le D4 les prévoit.
- **Cohérence du mode sombre** : une seule famille de couleurs par écran (bruns chauds C, jamais de
  `slate-*` résiduel dans le shell) ; sémantiques (danger/succès/avertissement/info) lisibles en
  sombre ; aucun composant du shell ne reste clair en mode sombre.
- **Rendu RTL des composants du shell** : alignements logiques (marque à droite en RTL), barre basse
  et nav desktop miroir correctes, chevrons et flèches retournés, pastille d'onglet actif et badge
  positionnés du bon côté, aucun texte tronqué par le miroir — automatisé au niveau des attributs
  (si A5) et **vérifié visuellement dans le navigateur avec les 4 langues**.
- Cibles ≥ 44 px **mesurées dans le navigateur** (bottomnav, pastilles, avatar, boutons des
  bandeaux) ; focus visible sur les composants du shell (anneau `--focus-ring`).

**2.6.1b — critères automatisés (si A5)**

- Tests de contrat des composants partagés — rendu, `aria-*`, focus visible, comportements (clic,
  ouverture), certaines propriétés CSS et RTL avec les 4 langues, pas de dépendance routeur (garde :
  import interdit dans `src/shared`).
- **Limite assumée** : ces tests DOM automatisent contrats, ARIA, comportements et propriétés CSS ;
  ils ne remplacent **pas** la vérification navigateur — les dimensions réelles au contact (cibles
  ≥ 44 px), le rendu RTL visuel, les chevauchements et la qualité responsive restent vérifiés
  **dans le navigateur** (320 / 375 / 768 / 1280) et consignés au rapport.

**Critères d'acceptation fonctionnels (manuels, consignés au rapport)**

- **Le thème appliqué à la première visite est celui défini par la configuration centralisée** —
  Zitouna si A1 est validé, Classique sinon (aucune option de choix au client) ; Réglages ›
  Affichage ne propose plus que le mode ; le mode clair/sombre/système est fonctionnel et
  indépendant du thème.
- Changement de thème (aperçu backoffice) sans flash, sans rechargement, mode conservé ; hors ligne,
  repli propre sur le thème par défaut.
- Aucune classe `slate-*` résiduelle dans Header/BottomNav ; 1280 = pastilles, 768 = transition
  propre, 375/320 = barre basse et marque intactes ; avatar ouvre le panneau, Réglages et Compte
  inchangés.
- **Fraunces (A6)** : chiffres de mesure (LCP, poids, CLS) et décision consignés au rapport.

**Critères de préservation**

- Aucune fonctionnalité existante retirée à l'exception du sélecteur de thème client (retrait voulu,
  orientation § 2.1) ; aucune règle métier modifiée ; tous les tests existants (831) restent verts,
  seuls les tests du sélecteur de thème sont adaptés au nouveau comportement.

## 9. Risques et stratégie de retour arrière

| Risque                                                                                 | Impact | Parade                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension `ThemeColors` touche l'éditeur et les thèmes admin                           | moyen  | **matrice de persistance en 7 points (§ 8)** : lecture sans clés → replis, sauvegarde/restauration, allers-retours entre mécanismes, aucune perte ni réécriture destructive ; l'éditeur garde son comportement (champs nouveaux au lot CMS) ; retour arrière = lecture avec l'ancien code (champs ignorés) |
| Direction C rejetée à la validation visuelle                                           | faible | le thème Zitouna est un fichier du core (données) ; le défaut de la configuration redevient Classique = une constante ; **A2 reste utile indépendamment de A1** (toutes les directions utilisent les mêmes tokens)                                                                                         |
| Retrait du sélecteur de thème mal reçu par un client qui l'utilisait                   | faible | comportement demandé (§ 2.1) ; mention au rapport ; retour arrière possible en réactivant la section (commit séparé)                                                                                                                                                                                       |
| Préférence `themeId` obsolète sur les appareils déjà installés                         | faible | valeur tolérée à la lecture, ignorée pour le thème visible ; documentée comme migration                                                                                                                                                                                                                    |
| Ressource de marque manquante, invalide ou identité partielle                          | faible | quatre cas de repli testés (§ 7.3 bis) ; texte de secours toujours **résolu** (jamais codé en dur) ; anomalie **tracée** ; jamais d'affichage cassé ni d'écran vide                                                                                                                                        |
| FOUT de Fraunces lors du premier changement de thème (si A6 = chargement à la demande) | faible | `display=swap` + mesure ; si la mesure montre un coût d'expérience, reprendre le lien initial — décision justifiée au rapport                                                                                                                                                                              |
| Thème résolu non présent en cache hors ligne (thème publié récent)                     | faible | repli automatique sur le thème intégré par défaut (§ 7.2), jamais d'écran vide ; rafraîchissement à la reconnexion                                                                                                                                                                                         |
| Tests DOM changent l'outillage                                                         | faible | `happy-dom` en devDependency, aucun impact prod ; environnement scoping limité aux fichiers concernés                                                                                                                                                                                                      |
| Divergence maquette / réel                                                             | moyen  | correspondance § 4 recheckée à chaque sous-lot ; les comportements simulés restent hors code                                                                                                                                                                                                               |
| Enfermement incompatible avec le futur système CMS                                     | moyen  | contraintes N1–N7 vérifiables à la revue du code ; le ThemeProvider ne décide rien (N7) : le changement de source du thème est invisible pour le reste                                                                                                                                                     |
| Retour arrière                                                                         | —      | deux commits séparés (a, b) ; revert d'un commit = retour à l'état antérieur sans migration de données (les champs de thème ajoutés sont ignorés à la lecture par l'ancien code)                                                                                                                           |

## 10. Découpage en sous-lots

| Sous-lot   | Contenu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Critère de clôture                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **2.6.1a** | Thème Zitouna (A1 après validation) + extension du modèle `AppTheme` (**A2 validée**) + chaîne de responsabilité du thème (core = contrats, config = défaut, application = résolution, ThemeProvider = application seule) + **configuration transitoire de la marque `src/app/brand.ts` (défauts non définitifs) + `BrandMark` à props avec repli « texte seul » (N8)** + retrait du sélecteur client + garanties § 7.2 + D-05 / D-11 + **mise en place des tokens et de la mécanique centrale d'application du thème** + Fraunces décidée par mesure (A6)                                                                                                                                                                               | check vert ; **matrice de persistance verte (7 points, § 8)** ; contrastes AA sur les associations réelles (ratios au rapport) ; résolution et garanties testées ; sélecteur absent du client, mode indépendant ; chiffres LCP/poids/CLS au rapport ; **vérifications réelles navigateur : 320/375/768/1280, 4 langues, RTL, replis d'identité** ; aucune fonctionnalité existante retirée ; **aucun composant 2.6.1b anticipé** ; rapport remis |
| **2.6.1b** | Composants du shell (Skeleton et AvatarButton partagés ; PillTab local — `BrandMark` déjà créé en 2.6.1a avec la configuration de marque, cf. § 10-1a) + nav desktop pastilles + avatar/panneau compact (D-23, décision retenue) + **correction obligatoire des cibles tactiles de l'en-tête < 44 px (Compte 36×28, Réglages 34×34 — constaté en 2.6.1a, reporté ici)** + **adoption complète des variables de thème dans les composants du shell (Header, BottomNav et composants concernés) : le nettoyage des couleurs en dur se conclut ici, aucune couleur codée en dur ne subsiste à la clôture du lot** + tests DOM (**A5 validée** ; la vérification navigateur reste requise en complément) + vérifications navigateur 320-1280 | check vert, RTL 4 langues (tests DOM + vérification navigateur), zéro couleur en dur résiduelle, **cibles tactiles en-tête ≥ 44×44 px vérifiées sur mobile et tablette, sans chevauchement ni dégradation visuelle**, rapport remis                                                                                                                                                                                                              |

**Répartition du nettoyage des couleurs** : 2.6.1a pose les tokens et la mécanique centrale
d'application du thème ; 2.6.1b adopte intégralement ces variables dans les composants du shell
(Header, BottomNav et composants concernés) — aucune couleur codée en dur ne subsiste à la clôture du
lot, et aucun double système n'est toléré entre les deux sous-lots.

Chaque sous-lot suit le cycle complet : dossier (ce document, § sous-lot) → validation → réalisation →
tests → rapport → validation. **Aucun développement avant l'accord explicite du chef** : la validation
du présent dossier et celle des arbitrages ne valent **pas** autorisation de développement — le
sous-lot 2.6.1a ne démarre que sur autorisation explicite, et **2.6.1b reste conditionné au bilan et à
la validation du rapport de 2.6.1a**.

> **Statut** : 2.6.1a **validé et clôturé (chef)** — implémentation + rapport + rapport complémentaire (responsive réel 4 dimensions ; persistance réelle : 28 couleurs via les vrais endpoints, export sérialisé/restauration, ancien 16 couleurs intact, persistance SQLite après arrêt brutal et redémarrage) ; cibles tactiles < 44 px reportées en **correction obligatoire de 2.6.1b** ; les thèmes ne font pas partie de la sauvegarde JSON utilisateur (hors champ par conception — à conserver au suivi des évolutions). 2.6.1b : dossier d'exécution remis (`docs/encyclopedie/donnees/lot-2.6.1b-shell-composants-dossier.md`) — **aucun développement avant validation explicite du chef**.
> `docs/encyclopedie/donnees/lot-2.6.1a-identite-rapport.md` (attente validation avant 2.6.1b).

Le lot CMS (assignation desktop/mobile, campagnes, groupes, layouts alternatifs, expériences) fera
l'objet de son propre dossier, sur la base de doc 18 § 3.6 — aucun développement anticipé dans 2.6.1.

---

## Annexes — traçabilité

Le plan consolidé est mis à jour avec ce dossier : ligne 2.6.0 passée en « fait » (`2ec4a74`), T3 noté
« lot dédié validé », lignes 2.6.1 pointant vers le présent dossier et portant l'orientation
« thème choisi par le backoffice », nouvelles lignes « layouts alternatifs » et « assignation de
thèmes par campagnes/groupes » renvoyées au lot CMS, une ligne « identité visuelle et éditoriale
**thèmes alternatifs (candidat B inclus)** et des **alternatives de composition D4** comme base de
conception tracée — rien de prévu dans la roadmap n'est considéré comme abandonné. Aucune fonctionnalité différée n'est retirée de la
roadmap (D-01, D-12, D-17, D-20, D-21, D-24, D-25, D-26, D-27, D-29, D-31… restent listés).
