# Lot 2.6.1a — Rapport complémentaire (vérifications demandées après le premier rapport)

**Statut** : vérifications complémentaires exécutées · **aucun commit, aucune fusion, aucun démarrage de 2.6.1b** · périmètre 2.6.1a strictement respecté (aucune règle métier ni architecture modifiée pour ces vérifications).
**Complète** : `lot-2.6.1a-identite-rapport.md` (§ 11 = responsive réel, § 12 = persistance réelle, § 13 = constats et état final).

---

## 11. Vérifications responsive dans un véritable navigateur (Chromium)

**Méthode** : navigateur réel (Chromium, aperçu intégré DeepAI Code), application servie par un **serveur de développement isolé** (port 3003, `DATA_STORE=memory` — aucune donnée réelle). Chaque dimension exacte (320 / 375 / 768 / 1280 px CSS) est rendue dans un cadre dédié à cette largeur ; le mode et la langue sont posés dans les préférences avant chaque rendu. Mesures : débordements (`scrollWidth` vs `clientWidth`), éléments hors cadre, cibles tactiles (header + navigation), navigation SPA réelle (clic → changement d'adresse), modale Réglages (ouverture + contenu), variables de thème.

### Résultats par dimension

| Dimension | Langue / mode | En-tête & marque                                         | Navigation                                               | Débordements                            | Cibles tactiles                      | Modale Réglages                                                               |
| --------- | ------------- | -------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| **320**   | derja · clair | lockup lisible (symbole + « Chnawa Ntayeb » + signature) | barre basse 61×64 px, clic `→ /fridge` ✓                 | **aucun** (`scrollWidth ≤ clientWidth`) | nav ✓ ; 2 boutons d'en-tête < 44 px¹ | ouvre ✓ ; onglets Chakl/Lougha/L'application ; **grille de thèmes absente** ✓ |
| **320**   | ar · sombre   | RTL ✓, marque lisible                                    | RTL ✓, « الأسبوع »                                       | **aucun**                               | idem¹                                | ouvre ✓ (arabe, sans grille)                                                  |
| **375**   | fr · clair    | ✓ + Fraunces sur titres                                  | « Semaine » ✓ (D-11)                                     | **aucun**                               | idem¹                                | ✓ onglets français, sans grille                                               |
| **375**   | ar · sombre   | ✓ RTL                                                    | RTL ✓                                                    | **aucun**                               | idem¹                                | ✓ « العرض/اللغة/التطبيق »                                                     |
| **768**   | fr · clair    | ✓                                                        | nav en-tête (4 liens) + barre basse, clic `→ /recipes` ✓ | **aucun**                               | nav ✓ ; Réglages 34 px¹              | ✓ sans grille                                                                 |
| **768**   | ar · sombre   | ✓ RTL                                                    | RTL ✓                                                    | **aucun**                               | —                                    | ✓                                                                             |
| **1280**  | fr · clair    | ✓                                                        | nav en-tête, clic `→ /planner` ✓                         | **aucun**                               | Réglages 34 px¹                      | ✓ sans grille                                                                 |
| **1280**  | ar · sombre   | ✓ RTL                                                    | RTL ✓                                                    | **aucun**                               | —                                    | ✓                                                                             |

¹ **Constat préexistant, hors régression 2.6.1a** : les boutons d'en-tête « Compte » (36×28 px) et « Réglages » (34×34 px) sont sous les 44 px de cible tactile. Ils existaient identiquement avant le lot (même en-tête h-16, mêmes dimensions) ; **aucune correction appliquée** (hors périmètre) — proposition : ajuster les zones de contact de ces deux boutons lors de l'**adoption intégrale des variables du shell en 2.6.1b** (où l'en-tête est de toute façon retravaillé). Décision à votre main.
Les variables Zitouna sont vérifiées à chaque dimension (clair `#B84D1A`/crème `#FDF6EC`, sombre `#F08A4B`/`#1A120C`) ; l'élément décoratif du héros (`IMG.absolute.-right-6`) dépasse visuellement mais **sans élargir la page** (garde `overflow-x: clip`, `scrollWidth ≤ clientWidth` partout).

### Captures (fichiers PNG, enregistrées pendant la session)

- 320 clair (Réglages ouvert) : `browser-screenshot-127-0-0-1-mwm8oglb-2d214b39.png`
- 320 sombre RTL (frigo) : `browser-screenshot-127-0-0-1-mwm8pejk-313fa316.png`
- 375 clair (fr) : `browser-screenshot-127-0-0-1-mwm8qa0w-35b819a2.png`
- 375 sombre RTL : `browser-screenshot-127-0-0-1-mwm8qsvu-271b1354.png`
- 768 clair : `browser-screenshot-127-0-0-1-mwm8rbwp-c1750dbf.png` · 768 sombre RTL : `browser-screenshot-127-0-0-1-mwm8rzqd-5807008b.png`
- 1280 clair : `browser-screenshot-127-0-0-1-mwm8sl9q-c99aa2b2.png` · 1280 sombre RTL : `browser-screenshot-127-0-0-1-mwm8t7r2-8ebcae2f.png`

(Chemins complets sous `%USERPROFILE%\.deepai-code\userdata\browser-artifacts\` ; les captures sont aussi visibles dans le fil.)

---

## 12. Vérification complète de la persistance des thèmes (scénarios réels)

**Environnement isolé** : serveur de développement dédié (port 3003), `DATA_STORE=memory` (magasin mémoire — **aucune donnée réelle touchée**), session super admin locale de test créée pour la session et détruite avec le serveur. Exécution par les **vrais endpoints HTTP** (`/admin/api/login`, `PUT/GET/DELETE /api/data/themes/:id`, `/api/themes`).

| #   | Scénario                                                                                                                                                                                                            | Résultat                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Créer un thème personnalisé **28 couleurs** (clair + sombre complets)                                                                                                                                               | ✅                                 |
| 2   | Le **sauvegarder dans le stockage serveur** (`PUT /api/data/themes/zitouna-test-28`)                                                                                                                                | ✅ `{"ok":true,"revision":1}`      |
| 3   | **Le relire** et comparer **toutes les valeurs** : 28 clés × 2 modes identiques valeur par valeur ; présent dans la liste publiée `/api/themes`                                                                     | ✅ 28/28 + 28/28                   |
| 4   | **Exporter en JSON** (document relu → sérialisation JSON)                                                                                                                                                           | ✅                                 |
| 5   | **Restaurer** (réécriture depuis l'export JSON via le même chemin d'écriture) puis revérifier : thème **identique** (`JSON.stringify(light/dark)` égaux), 28 clés conservées                                        | ✅                                 |
| 6   | **Thème ancien 16 couleurs** : enregistré tel quel ; relecture = exactement 16 clés (aucune couleur dérivée écrite) ; ré-enregistrement à l'identique = toujours 16 clés ; les 16 valeurs conservées telles quelles | ✅ **aucune écriture destructive** |
| 7   | **Cache hors ligne + thème résolu après rechargement** (navigateur réel, cf. ci-dessous)                                                                                                                            | ✅                                 |

### Scénario 7 en détail (navigateur réel)

- **Instantané hors ligne complet** : après un chargement, `chnowa_active_theme_vars_v1` contient **29 variables** (28 couleurs + `--font-display`) = le **thème résolu** (Zitouna sombre : `tint #3A2414`, `lineStrong #806A55`, `infoText #93B4FF`) — jamais une préférence transformée en règle.
- **Instantané ancien format (17 vars, simulé volontairement)** → rechargement : l'application s'applique correctement (couleurs dérivées complètes : `tint`, `lineStrong` calculées), **aucune erreur**, et l'instantané est **réécrit au nouveau format** (29 vars). Aucune perte, aucun écran cassé.
- **Hors ligne réel simulé** : serveur arrêté **page ouverte** — `fetch('/api/themes')` échoue comme attendu ; l'application reste vivante et thémée ; ouverture de Réglages et **bascule clair réussie hors ligne** (brand `#B84D1A`, surface `#FDF6EC`), préférences `mode=light` enregistrées, instantané réécrit (29 vars, `dark:false`), **sans rechargement**. (Limite assumée : le service worker n'est actif qu'en build de production, donc un rechargement complet hors ligne en développement ne peut pas charger les modules — la reprise hors ligne réelle reste couverte par le mécanisme d'instantané + le repli `fetchPublished` → cache, testé au niveau adaptateur.)

**Conclusion persistance** : aucune donnée perdue sur toute la chaîne (écriture → relecture → export JSON → restauration), les replis de lecture ne provoquent **aucune écriture** (le document ancien reste à 16 clés après ré-enregistrement).

## 13. Problèmes détectés, non-régression, état final

**Problèmes détectés et corrections** : aucun défaut du lot. Deux observations **préexistantes** signalées sans correction (hors périmètre, présentées conformément à la condition 3) :

1. cibles tactiles < 44 px des deux boutons d'en-tête (Compte 36×28, Réglages 34×34) — correction proposée en 2.6.1b avec l'adoption du shell ;
2. l'élément décoratif du héros dépasse visuellement son cadre sans jamais élargir la page (comportement inchangé, garde active).

**Tests de non-régression** : `npm run check` rejoué **après toutes les vérifications** : typecheck ✓ · oxlint 0 warning · Prettier ✓ · **870 tests passés / 29 skippés** (96 fichiers). Aucun fichier de code modifié par les vérifications (le harnais de mesure et le script de persistance étaient temporaires et **supprimés**).

**État final de Git** (branche `feature/datastore-contract`, aucun nouveau commit) :

- 20 fichiers modifiés + 9 nouveaux (le périmètre du premier rapport, inchangé : `index.html`, 12 sources + tests sous `src/`, `package.json`/lock, `CLAUDE.md`, docs) ;
- nouveaux : `src/app/brand.ts`, `src/app/themeConfig.ts`, `src/app/layout/BrandMark.tsx` (+ test), `src/app/providers/ThemeContext.test.tsx`, `src/application/theme/resolveTheme.ts` (+ test), `src/core/theme/theme.test.ts`, docs (dossier, rapport, rapport complémentaire, maquette filtres) ;
- **aucun fichier temporaire restant**, **aucune fusion**, worktree propre vis-à-vis du périmètre.

**Environnements** : serveur isolé 3003 **arrêté** ; port 3000 du chef non touché ; aucun serveur de test restant.

---

## 14. Clarification export/import et persistance durable (demande du chef)

### Ce qui a réellement été exécuté (premier complément, § 12)

- **Le mécanisme d'écriture/lecture réel des thèmes de l'application a été exécuté** : l'enregistrement d'un thème passe par `themesHttp.save` → `PUT /api/data/themes/:id` (le chemin qu'emprunte l'éditeur de thèmes du backoffice), la relecture par `fetchPublished`/`fetchAll` → `GET /api/themes` et `GET /api/data/themes/:id`. Le scénario 1–6 a utilisé exactement ces chemins.
- **La sauvegarde JSON utilisateur (`createBackup`/`parseBackup`) n'a PAS été exécutée — et ne peut pas couvrir les thèmes** : vérifié dans le code, ce mécanisme ne porte que les recettes, ingrédients, planning hebdo, favoris et listes de courses (`src/core/backup/backup.ts`) ; les thèmes en sont **hors champ par conception** (la sauvegarde JSON utilisateur est une sauvegarde du contenu du chef, pas de l'habillage). De même, l'import atelier (`/admin/api/workspace/*`) couvre uniquement recettes et ingrédients.
- L'« export JSON » du § 12 était donc la **sérialisation du document relu** restaurée par le **même endpoint d'écriture que l'éditeur** : cela valide la conservation et la sérialisation, comme indiqué — ce n'était pas la fonctionnalité « Sauvegarde JSON » de l'interface (qui, pour les thèmes, n'existe pas).

### Persistance durable (demande 3) — exécutée en complément, résultat

**Protocole** (vérification seule, aucune modification de code, environnement isolé) :

1. serveur démarré avec `DATA_STORE=sql` + `SQLITE_PATH` = fichier SQLite temporaire dédié (port 3004) ;
2. écriture des deux thèmes de test via les **vrais endpoints** (`PUT /api/data/themes/…`, session super admin locale) — `revision 1` et `2` confirmées ;
3. **arrêt brutal du processus serveur** (`taskkill`) ;
4. **redémarrage sur le même fichier SQLite** ;
5. relecture et comparaison.

**Résultat** :

```
READ full 28 values intact: true            (28 valeurs × 2 modes identiques)
READ old theme still exactly 16 keys: true  (aucune clé dérivée écrite)
READ /api/themes published ids: zitouna-test-28,old-16-test
DURABLE PERSISTENCE AFTER RESTART: PASSED
```

La persistance survit à un arrêt/redémarrage du serveur avec un stockage durable — démontrée sur l'adaptateur SQLite du contrat (le fournisseur de production Firestore garantit la même persistance par construction, via le même chemin d'écriture).

### Reste-il quelque chose à vérifier ?

- **Non** pour le périmètre 2.6.1a : le mécanisme d'écriture/lecture réel (éditeur de thèmes), la conservation intégrale, la restauration depuis un export sérialisé, la non-destruction des thèmes anciens et la persistance durable après redémarrage sont exécutés et passés.
- **Hors périmètre, pour mémoire** : la sauvegarde JSON utilisateur reste limitée aux données du chef (recettes/ingrédients/planning/favoris/courses) — si l'on souhaite un jour inclure les thèmes dans cette sauvegarde, c'est une **évolution de fonctionnalité** (décision produit + lot dédié), pas une vérification de 2.6.1a.
