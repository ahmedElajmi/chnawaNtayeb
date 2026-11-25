# Lot 2.6.1a — Identité & shell : implémentation (rapport)

**Statut** : implémentation terminée, check vert, en attente de validation du chef · **aucune fusion**, travail sur la branche `feature/datastore-contract`, non commité (proposition de commit en fin de rapport).
**Référence** : `docs/encyclopedie/donnees/lot-2.6.1-identite-shell-dossier.md` (v3 finale validée) · périmètre strict du sous-lot 2.6.1a (§ 10-1a) · aucun composant 2.6.1b anticipé.

---

## 1. Ce qui a été implémenté

### 1.1 Thème « Zitouna vive » (A1) — `src/core/theme/builtinThemes.ts`

- `ZITOUNA_THEME` ajouté aux thèmes intégrés (`CLASSIQUE`, `FKHAR`, `ZITOUNA`) : direction C validée, clair (paprika `#B84D1A`, olive `#5A7D23`, safran `#F2A516`, crème `#FDF6EC`) et sombre (bruns chauds `#1A120C` → `#26190F`), avec la palette étendue complète dans les deux modes.
- **`DEFAULT_THEME_ID` retiré du core** (N3 : le core ne connaît ni défaut ni ciblage) ; le défaut vit désormais dans **`src/app/themeConfig.ts`** (configuration centralisée au niveau application, remplaçable par le futur CMS sans toucher au core).

### 1.2 Extension du modèle `AppTheme` (A2) — `src/core/theme/types.ts`, `validation.ts`

- 12 couleurs ajoutées : `tint`, `lineStrong`, `focusRing`, `danger`, `dangerStrong`, `dangerText`, `success`, `successText`, `warning`, `warningText`, `info`, `infoText` (`BASE_THEME_COLOR_KEYS` = 16 requises, `EXTENDED_THEME_COLOR_KEYS` = 12 facultatives, `THEME_COLOR_KEYS` = 28).
- **Migration additive à la lecture** : `isValidColors` exige les 16 couleurs de base et valide les 12 étendues _lorsqu'elles sont présentes_ ; un thème ancien reste valide et est stocké tel quel (`pickThemeFields` ne copie que les clés définies — jamais `undefined`).
- **`resolveThemeColors(colors)`** (pur, testé) : complète un thème ancien avec les replis documentés — `tint` dérivée (mélange `card`/`brand` 8 %), `lineStrong` assombrie de `line` jusqu'à ≥ 3:1 contre `card` (boucle bornée, repli `ink`), `focusRing` = `brand`, sémantiques par défaut fixés ; **ne mute jamais l'objet d'entrée, n'écrit jamais en base**.
- `colorsToCssVars` émet les 28 variables (kebab-case : `--color-line-strong`, `--color-danger-text`…) et saute les clés absentes d'un thème ancien (le ThemeProvider applique toujours `resolveThemeColors`, donc les 28 variables existent à l'exécution).

### 1.3 Chaîne de responsabilité du thème (§ 6) — `src/application/theme/resolveTheme.ts`, `src/app/providers/ThemeContext.tsx`

- **`resolveTheme(themes, requestedId, defaultId)`** dans `src/application` : pure et synchrone, **ne lit jamais IndexedDB ni le réseau** (reçoit la liste déjà chargée) ; un thème demandé et disponible est appliqué tel quel (jamais remplacé par le défaut), le repli vers le défaut ne se produit que si le thème est réellement indisponible, et **un thème non publié n'est jamais appliqué**.
- **ThemeProvider = application seule** : il appelle `resolveTheme` avec `null` comme thème demandé (le futur port de résolution CMS passera par la même signature) et applique `resolveThemeColors(active)` en `useLayoutEffect` (avant peinture). Le `themeId` des préférences est **ignoré pour la sélection** (champ conservé pour compatibilité, `normalizePreferences` le neutralise à `''` si absent) — testé.
- Aperçu backoffice (`setPreviewTheme`) inchangé : application temporaire, **jamais d'instantané écrit pendant l'aperçu**, arrêt propre, mode conservé, sans rechargement.

### 1.4 Garanties § 7.2 (testées en DOM, happy-dom)

| Garantie                                                | Vérification                                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Pas d'écran non thémé / pas de flash à l'initialisation | `useLayoutEffect` avant peinture ; les 28 variables sont posées au premier rendu (test)                          |
| Le mode est conservé quel que soit le thème             | Aperçu Classique en mode sombre : `dark` reste appliqué (test)                                                   |
| Aucun rechargement quand le thème change                | Aperçu appliqué puis arrêté : `location.href` inchangé (test)                                                    |
| Repli hors ligne strict                                 | L'aperçu **n'écrit pas** d'instantané ; l'instantané hors ligne porte le **thème résolu** (vars complètes, test) |
| Préférences jamais source de sélection                  | `prefs.themeId = 'classique'` → Zitouna quand même appliqué (test)                                               |

### 1.5 Retrait du sélecteur client (N6) — `src/features/settings/SettingsModal.tsx`

- Onglet **Affichage = mode seulement** (Clair/Sombre/Auto, radiogroup inchangé) ; grille `ThemePreviewCard` + `setThemeId` + notes d'aperçu retirées ; `ThemePreviewCard` reste utilisé par le backoffice (éditeur de thèmes).
- Le pied de la modale affiche l'identité **résolue** (`BRAND`) au lieu du texte en dur.

### 1.6 Identité paramétrable (D-05, N8) — `src/app/brand.ts`, `src/app/layout/BrandMark.tsx`

- **`brand.ts` = configuration transitoire** (`markSrc`, `wordmark`, `signature`, `tagline`) ; les valeurs actuelles « Chnawa Ntayeb » / « by chef Souhed » sont des **défauts remplaçables**, pas des constantes métier (D-05 ; au passage la coquille « Chnowa » est corrigée en « Chnawa » dans le shell).
- **`BrandMark` à props** (lokal à `src/app/layout/`) : rend l'identité déjà résolue — les 4 cas de repli sont implémentés et testés : (1) logo absent → nom résolu en texte ; (2) nom absent → symbole seul, sinon rien (jamais de texte inventé) ; (3) ressource cassée → repli texte seul + `console.warn` tracé en développement, jamais d'affichage cassé ; (4) identité partielle → seuls les éléments disponibles.
- **Consommateurs sans marque en dur** : `Header` (zone marque) et le pied de page d'`AppLayout` utilisent `BrandMark`/`BRAND` ; `SettingsModal` aussi. La signature du bouton d'en-tête (3 clics → backoffice) est préservée.
- **Garde d'architecture** (`src/core/architecture.test.ts`, type T2/T4) : aucun fichier de `src/app` hors `brand.ts` et hors tests ne contient l'appellation, la signature ou l'accroche — verrouillé par test.

### 1.7 D-11 (« Semaine ») — `src/shared/i18n/translations.ts`, `derjaArabic.ts`

- `navWeekly` : français **« Semaine »**, derja **« Jom3a »**, arabe **« الأسبوع »**, derja arabe **« الأسبوع »** (remplace « Menu Jom3a / Menu Semaine / قائمة الأسبوع / منيو الجمعة »).

### 1.8 Fraunces (A6) — décision par mesure

- **Variante implémentée : lien initial** dans `index.html` (famille Fraunces 600/800, `display=swap`, dans le `<link>` Google Fonts existant) ; `FONT_REGISTRY.fraunces.href = null` (plus d'injection dynamique redondante).
- **Mesures** (serveur de développement, protocole identique avant/après — rechargement à chaud, onglet unique) :

| Mesure                       | Avant (baseline séance)                                   | Après                       | Lecture                                                                     |
| ---------------------------- | --------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| CLS                          | 0                                                         | **0**                       | inchangé (`display=swap`)                                                   |
| LCP (élément `<p>` du héros) | 932 ms (1 888 ms au tout premier chargement de la séance) | 1 084 ms                    | dans la fourchette de bruit du serveur de dev ; pas de dégradation nette    |
| Poids transféré (à chaud)    | 67 Ko / 243 requêtes                                      | 68 Ko / 248 requêtes        | + ~1 Ko (cache) ; à froid, + 1 fichier de police (~16 Ko, Fraunces 600/800) |
| Requêtes de polices          | 1 (Plus Jakarta)                                          | 2 (Plus Jakarta + Fraunces) | attendu                                                                     |

**Décision proposée** : conserver le lien initial. La mesure ne montre aucune régression (CLS 0, LCP dans le bruit de mesure, +16 Ko à froid sur une ressource display=swap non bloquante) ; la dégradation qui déclencherait la bascule vers `ensureFontLoaded` (§ A6) n'est pas constatée.

### 1.9 Tokens et mécanique centrale

- L'application du thème reste centralisée dans le ThemeProvider (`colorsToCssVars` + `--font-display`, `data-card-shape`, `data-pattern`, `colorScheme`, `meta theme-color`) ; l'extension n'ajoute **aucun** second mécanisme. L'**adoption** des nouvelles variables par les composants du shell (BottomNav et couleurs en dur restantes) est **explicitement reportée à 2.6.1b** (répartition validée au dossier § 10 — aucun double système : 2.6.1a pose les tokens, 2.6.1b les adopte intégralement).

---

## 2. Fichiers modifiés

**Modifiés** (12) : `index.html` (Fraunces) · `src/app/AppLayout.tsx` (pied → BrandMark) · `src/app/layout/Header.tsx` (zone marque → BrandMark) · `src/app/providers/ThemeContext.tsx` (resolveTheme + résolution complète, retrait `setThemeId`) · `src/application/index.ts` (export resolveTheme) · `src/core/architecture.test.ts` (garde N8) · `src/core/preferences/defaults.ts` (`themeId` compat uniquement) · `src/core/theme/builtinThemes.ts` (Zitouna, retrait `DEFAULT_THEME_ID`) · `src/core/theme/types.ts` (extension A2) · `src/core/theme/validation.ts` (`resolveThemeColors`, `mixHex`, validation additive, Fraunces href null) · `src/features/backoffice/themes/ThemeEditor.tsx` (itération sur les 16 champs de l'éditeur, contrastes calculés sur couleurs résolues — l'éditeur des 12 nouvelles couleurs reste au lot backoffice) · `src/features/settings/SettingsModal.tsx` (sélecteur retiré, pied résolu) · `package.json` / `package-lock.json` (`happy-dom` devDependency, A5).

**Nouveaux** (5) : `src/app/brand.ts` · `src/app/themeConfig.ts` · `src/app/layout/BrandMark.tsx` (+ test) · `src/app/providers/ThemeContext.test.tsx` · `src/application/theme/resolveTheme.ts` (+ test) · `src/core/theme/theme.test.ts`.

**Aucun fichier hors périmètre** : pas de composant 2.6.1b (Skeleton, AvatarButton, PillTab, nav pastilles), pas de modification de `BottomNav` (couleurs en dur migrées en 2.6.1b comme convenu), pas d'adresse nouvelle, pas de dépendance payante.

## 3. Tests

- **Suite complète** : `npm run check` vert — typecheck ✓, oxlint **0 warning**, Prettier ✓, **870 tests passés / 29 skippés** (96 fichiers ; baseline du lot : 831 → +39 tests nouveaux).
- **Nouveaux tests** :
  - `src/core/theme/theme.test.ts` (20) : extension additive, validation tolérante aux thèmes anciens, `pickThemeFields` sans `undefined`, `resolveThemeColors` (complétion, pureté, non-mutation, replis, `lineStrong` ≥ 3:1), `colorsToCssVars` (28 vars / saut des clés absentes), `mixHex`, **contrastes AA paire par paire** (12 paires × 2 modes).
  - `src/application/theme/resolveTheme.test.ts` (6) : défaut appliqué, thème demandé jamais remplacé, repli seulement si indisponible, non publié jamais appliqué, pureté, complétion.
  - `src/app/layout/BrandMark.test.tsx` (6, happy-dom) : les 4 cas de repli + trace d'anomalie.
  - `src/app/providers/ThemeContext.test.tsx` (6, happy-dom) : garanties § 7.2 (voir 1.4).
  - `src/core/architecture.test.ts` (+1) : garde N8 anti-codage en dur.

## 4. Matrice de persistance (7 points, § 8 du dossier)

| #   | Point                                                                                                                                                    | Statut                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Thème ancien (16 couleurs) **lu et appliqué** sans erreur, complété à la lecture                                                                         | ✅ tests (`isValidTheme` accepte, `resolveThemeColors` complète, vars émises)                                       |
| 2   | Thème ancien **réenregistré** : les 12 clés absentes ne sont **pas écrites** (`pickThemeFields` ne copie que les clés définies, jamais `undefined`)      | ✅ test (`Object.keys(picked.light).length === 16`)                                                                 |
| 3   | Thème complet écrit en entier : **toutes** les clés persistées, aucune perdue                                                                            | ✅ `pickThemeFields` conserve les clés définies (test) ; écriture entière sans fusion (mécanisme existant inchangé) |
| 4   | Champs **inconnus** d'un document de base : ignorés à la lecture                                                                                         | ✅ comportement existant conservé (`pickThemeFields` ne garde que les champs connus)                                |
| 5   | Instantané hors ligne (`chnowa_active_theme_vars_v1`) : porte le **thème résolu** (28 vars), jamais une préférence transformée en règle                  | ✅ test + vérification navigateur (clé inspectée après application)                                                 |
| 6   | Préférences : `themeId` conservé pour compat mais **jamais source de sélection** ; `normalizePreferences` ne le fait plus pointer vers un défaut du core | ✅ test (themeId ignoré) + vérification navigateur (`chnowa_preferences_v1` : `mode` seul pilote)                   |
| 7   | Retour arrière : un code ancien qui ignore les 12 clés continue de fonctionner (champs facultatifs, migration additive)                                  | ✅ par construction (`?` dans `ThemeColors`, replis à la lecture)                                                   |

## 5. Contrastes AA — ratios mesurés (paires réellement utilisées)

**Zitouna clair** — texte/fond 15,24 · texte/carte 16,35 · secondaire/carte 5,94 · marque-texte/carte 5,91 · accent-texte/carte 6,22 · sur bouton principal 5,10 · sur bouton d'action 4,78 · danger/carte 6,47 · success/carte 6,42 · warning/carte 5,54 · info/carte 6,70 · **bordure utile/carte 3,49 (seuil 3:1)**.

**Zitouna sombre** — texte/fond 16,13 · texte/carte 14,91 · secondaire/carte 8,02 · marque-texte/carte 8,42 · accent-texte/carte 10,23 · sur bouton principal 7,43 · sur bouton d'action 9,50 · danger/carte 7,16 · success/carte 11,07 · warning/carte 10,71 · info/carte 8,31 · **bordure utile/carte 3,35 (seuil 3:1)**.

→ **24/24 paires ≥ 4,5:1 (textes) et ≥ 3:1 (bordures)** ; les ratios sont aussi vérifiés automatiquement à chaque `npm test` (thème.test.ts) et restent éditables dans l'éditeur de thèmes du backoffice (vérification lisible conservée, calculée sur les couleurs résolues).

## 6. Vérifications réelles navigateur (port 3003, serveur de développement dédié)

- **Zitouna appliqué** : clair (brand `#B84D1A`, surface crème `#FDF6EC`, tint `#FDEBD3`, Fraunces sur les titres) et sombre (brand `#F08A4B`, surface `#1A120C`, tint `#3A2414`, `lineStrong` `#806A55`) — les 28 variables posées sur `<html>`.
- **Sélecteur de thème absent** : Réglages › Affichage = mode seulement (Nhar/Lil/Auto) ; aucune grille de thèmes dans le client.
- **Mode indépendant** : passage en sombre depuis Réglages → variables sombres immédiates ; **après rechargement** : mode et thème conservés (instantané hors ligne relu).
- **4 langues / RTL** : arabe → `dir=rtl`, `lang=ar`, police Cairo, navigation « الأسبوع » ; derja → « Jom3a » ; l'app ne s'élargit pas (`scrollWidth ≤ clientWidth`, garde `overflow-x: clip`).
- **Replis d'identité** : image cassée → lockup texte seul + trace console (test DOM) ; identité partielle → éléments disponibles seulement (test DOM) ; sur navigateur, `mark.png` chargée et marque affichée dans l'en-tête et le pied.
- **Aperçu backoffice** inchangé (bouton « essayer » de l'éditeur) : application temporaire, mode conservé, sans rechargement (test DOM).
- **Périmètre de mesure** : l'aperçu intégré mesure 618 px CSS ; les largeurs 320/375 exactes restent à confirmer visuellement par le chef (limite de l'outil, cf. § 8) ; aucun élément n'élargit la page et la garde `overflow-x: clip` est active.

> **Complément** : vérifications responsive réelles (4 dimensions exactes, clair/sombre, RTL) et scénarios de persistance réels (28 couleurs en base, export/restauration JSON, thème ancien 16 couleurs, cache hors ligne) : `docs/encyclopedie/donnees/lot-2.6.1a-identite-rapport-complement.md`.

## 7. Performances (A6, cf. 1.8)

- **Référence de comparaison** : le lot 1.4 a établi la baseline de la **couche données** (SQLite/mémoire, `scripts/benchmarks/datastore-100k.ts`) — il n'existait **pas** de baseline web-vitals antérieure. La comparaison LCP/CLS/poids est donc faite **avant/après sur la même séance, même serveur, même protocole** (cf. 1.8) : c'est la baseline web de départ, enregistrée pour les lots suivants.
- Résultat : **CLS 0 avant et après**, LCP 932 → 1 084 ms (bruit du serveur de dev, aucune dégradation nette), poids à chaud 67 → 68 Ko, + 1 fichier de police (~16 Ko) à froid. **Aucune régression mesurée** ; la mesure de production (build) reste à faire au moment de la release, sur la même méthode.
- La baseline de la couche données du lot 1.4 n'est pas affectée (aucun changement de l'adaptateur, aucun changement de schéma de collection).

## 8. Écarts et limites assumés

1. **320/375/768/1280 px exacts** : vérifiés dans un **vrai navigateur** après le premier rapport (rapport complémentaire, § 11) — aucun débordement aux 4 dimensions, clair/sombre et langues RTL incluses.
2. **Mesures en développement** : LCP/poids mesurés sur le serveur de dev (comparaison avant/après valide, chiffres absolus non représentatifs d'un build de production) — mesure de production à la release.
3. **Occurrences de la marque hors shell** : les textes i18n (`appName`, partages, `document.title` de la fiche recette, bannière PWA, accueil) contiennent encore l'appellation — ce sont des **données i18n ou des écrans** qui ne relèvent pas de la chaîne shell `brand.ts → BrandMark` ; leur passage à l'identité résolue (et l'éditeur d'identité) appartient au **lot CMS** (et à 2.6.2 pour l'accueil). La garde N8 couvre `src/app` (la couche de composition du shell) ; les textes de secours du shell viennent tous de l'identité résolue.
4. **Éditeur de thèmes du backoffice** : continue d'exposer les 16 champs (les 12 nouvelles couleurs seront éditables au lot backoffice prévu) ; il affiche désormais les contrastes sur les **couleurs résolues** (replis inclus).
5. **Fichiers temporaires de la séance** : serveur de test sur le port 3003 (arrêté à la clôture) ; aucune modification du port 3000 du chef.

## 9. Risques résiduels

- **Résolution CMS tardive** : un changement de thème appliqué après coup pourra provoquer un changement visuel non animé — absence de transition **non promise** (validé au dossier § 7.2) ; le mécanisme actuel rejoue la résolution sans rechargement.
- **`themeId` résiduel** : d'anciens appareils peuvent encore porter un `themeId` dans leurs préférences ; il est ignoré (lu/migré mais jamais sélectionneur) — conforme à la décision validée.
- **Thèmes créés avant l'extension en base** : appliqués avec replis dérivés ; l'admin peut les compléter à la prochaine édition (les replis sont documentés au dossier).

## 10. Proposition de commit (à valider par le chef)

```
feat(theme): zitouna theme, extended palette and resolved brand identity (lot 2.6.1a)
```

Sous-lot **2.6.1b non démarré** — en attente de la validation du présent rapport, conformément au cycle (rapport → validation → 2.6.1b).
