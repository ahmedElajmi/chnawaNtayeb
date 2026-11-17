# Audit de préparation à l'implémentation — Chnawa Ntayeb

**Objet** : état réel du projet existant, écarts, risques, plan d'implémentation proposé et décisions
à arbitrer — clôture de la conception UX/UI (D4) et préparation du passage à l'implémentation.
**Méthode** : lecture vérifiée du code (`src/`, `server/`, `firestore.rules`, `public/sw.js`,
`package.json`), des documents validés (17-plan-de-realisation, 18-cms, dossiers de lots 1.1–1.5)
et du paquet de maquettes D4 (`docs/encyclopedie/mockups/d4`). Aucun développement effectué.
**Limite de vérification** : `npm run check` n'a pas pu être exécuté au moment de l'audit
(blocage d'exécution de l'environnement) — à relancer en ouverture du premier lot ; les conclusions
de « testé » reposent sur les suites existantes et les rapports des lots clôturés.

---

## 1. État réel du projet

### 1.1 Architecture et contrats (phase 1 — terminée)

| Élément                                                                                                                                                | État                                                                    | Preuve                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Contrat `DataStore` durci (révisions strictement croissantes, curseur composite, `commit` ≤ 10 ops, validation JSON récursive, garanties identifiants) | ✓ terminé, clôturé (lot 1.2, commit `67cce86`)                          | `server/storage/types.ts`, `contract.ts`                                                                |
| Cadre d'adaptateurs : sélection centrale `DATA_STORE`, mémoire de référence, SQLite via Knex, Firestore SDK isolé                                      | ✓ terminé (lot 1.3, `22a6976`)                                          | `sqlStore.ts`, `memoryDataStore.ts`, `firestoreStore.ts`, `firebaseSdkGuard.test.ts`                    |
| Mécanismes transversaux : transactions, classes de conflit, contention par moteur, baseline perf 100k                                                  | ✓ terminé (lot 1.4, `d860a68`) ; **seuils de perf non fixés (🚩)**      | `contention.test.ts`, `perfSmoke.test.ts`, dossier 1.4 (rattrapage 100k < 0,5 s ; p95 écriture 0,39 ms) |
| Ports applicatifs côté client                                                                                                                          | ✓ en place                                                              | `src/application/ports.ts` (25+ ports), `src/app/container.ts` (composition racine unique)              |
| Adaptateurs client : HTTP + IndexedDB + mémoire, contrats par port                                                                                     | ✓ en place                                                              | `src/infrastructure/{http,indexeddb,local,memory,contracts}`                                            |
| Lot 1.5 (répétition générale)                                                                                                                          | **reporté, obligatoire** — après 5b + mapping 6a, avant la migration 6a | plan § 5                                                                                                |
| Lot 1.6 (nettoyage post-bascule)                                                                                                                       | reporté à la bascule effective                                          | plan § 5                                                                                                |

**Fournisseur actif** : Firestore (Firebase Admin côté serveur), aucune écriture directe hors
adaptateur ; la bascule SQL reste une décision explicite future (séquence 5b → mapping 6a → 1.5 → 6a).

### 1.2 Domaine et données

- **Catalogue** : recettes + ingrédients + unités + pays, collections suivies en incrémental
  (`SyncedCollectionStore` + `LocalCollectionCache` IndexedDB + poller serveur), validation à la lecture
  (`parseStoredRecipes`/`parseStoredIngredients`), fourchettes de prix (`pricing.ts`, `costEstimate.ts`),
  substitution par recette (`RecipeIngredient.substitutes`), rôles d'ingrédient (key/secondary/staple),
  **seed** d'origine (recettes tunisiennes + internationales) — les données publiques réelles restent à
  administrer (le catalogue de démonstration D4 n'est pas la production).
- **Validation éditoriale** : atelier + revue (workspaces, publication atomique, versions, workflows ×
  rôles) — opérationnel.
- **Catégories** : deux arbres gérés en base, type de plat fixe à part.
- **Frigo / cuisine** : `ElementSet` d'**ids sans quantités** (frigo, garde-manger, favoris), sync
  compte (`KitchenSync`, ledger, scope par uid, invité = local), listes de courses nommées + rayons +
  budget fourchette + historique archivé serveur, planning 7 jours × midi/soir (plat, entrée, dessert
  facultatifs) + budget hebdo.
- **Comptes** : clients / employés / super admin, création atomique (users + auth + réservation e-mail),
  politique de mot de passe configurable, verrouillage après échecs, annuaire paginé, sessions serveur
  pour le back-office.
- **Recherche** : MiniSearch côté appareil (`@/core/search` normalisation unique) + repli filtre nom.

### 1.3 Moteur de matching (v1 en production)

Pipeline filtres → analyse → score → tiers → ranking (`src/core/matching`), config validée et
publiable (historique de versions), mises en avant, scénarios du chef en base, simulateur back-office.
**Écart majeur avec la cible (6b/5c) et avec D4** :

1. le frigo ne porte **aucune quantité** — « présent » est qualitatif pour tout ; la sémantique
   « quantité inconnue ≠ suffisante » et l'état « à vérifier » de D4 n'ont pas encore de matière
   (ils viennent avec l'évolution du modèle frigo, séquence 6b.7a/6b.7b validée) ;
2. bornes des tiers actuelles (`almostMaxToBuy = 2`, idées = recettes liées au frigo) ≠ bornes D4
   (« Presque = 1–3 manquants », « À découvrir = 4+ ») ;
3. pas d'allocation de stocks, pas de « sous réserve », pas de conversions quantitatives, pas de piste
   de justification fine — ce sont les lots 5c + 6b, **ne pas les implémenter maintenant**.

### 1.4 Application client (screens actuels)

Routes : `/`, `/fridge`, `/recipes`, `/recipe/:slug`, `/suggestions`, `/planner`, `/grocery`,
`/admin` + redirections 301 françaises. Accueil = héros + 5 raccourcis + sections par tier ; pas
d'états personnalisés, pas de cloche, pas d'avatar, barre basse 5 destinations, thème clair/sombre
(AppTheme builtin : classique + fkhar), 4 langues avec RTL logique, PWA (SW offline-first, bannière
install, prompt de mise à jour, indicateur hors ligne), scan photo (Gemini) dans le frigo.

### 1.5 Back-office

12 pages (accueil, à valider, recettes, ingrédients, moteur ×6 sous-pages, apparence, données,
workflows, catégories ×2, équipe, clients ×2, sécurité), parité mobile visée, i18n back-office,
éditeurs recette/ingrédient avec brouillon, sécurité serveur systématique.

### 1.6 Conception UX/UI (D4) — référence validée

Paquet `mockups/d4` : 18 pages produites comme **schémas de blocs** (`tools/pages.mjs`) instanciées
par **59 composants** en 7 familles avec props typées, une source de données unique, 4 langues + RTL
réel, thèmes clair/sombre, 76 captures réelles vérifiées (0 débordement, 0 image cassée, 0 cible
< 40 px), 9/9 tests d'affichage du matching, 33 décisions tracées dans `registre.html`
(≈ 9 validées, 24 ouvertes). **D4 est la référence UX/UI pour l'implémentation** ; ses données et
scénarios sont démonstratifs, jamais des règles métier.

---

## 2. Tableau des fonctionnalités existantes et de leur avancement

Légende : **✓ terminé** (testé, utilisé en production) · **◐ partiel** (existe, incomplet vs D4 ou
vs cible 6b) · **✗ absent** (aucun code) — ne jamais considérer « terminé » parce qu'un écran existe.

| Domaine          | Fonctionnalité                                                             | État | Notes                                                       |
| ---------------- | -------------------------------------------------------------------------- | ---- | ----------------------------------------------------------- |
| Contrats données | DataStore + adaptateurs + mécanismes                                       | ✓    | phase 1 clôturée ; seuils perf 🚩                           |
| Catalogue        | Sync incrémentale + IndexedDB + validation                                 | ✓    |                                                             |
| Catalogue        | Coût en fourchette (`recipeCostRange`)                                     | ✓    | `pricing.ts`, `costEstimate.ts`                             |
| Catalogue        | Workflow atelier → validation → publication                                | ✓    | `@/core/review`                                             |
| Catalogue        | Catégories (2 arbres gérés)                                                | ✓    |                                                             |
| Catalogue        | Unités (registre, descriptions)                                            | ✓    |                                                             |
| Catalogue        | Sauvegarde/restauration JSON                                               | ✓    |                                                             |
| Catalogue        | Tags d'étal (vendredi, ramadan…)                                           | ✗    | vient avec 7.1 (axes/tags)                                  |
| Recherche        | MiniSearch + normalisation                                                 | ✓    | appareil uniquement                                         |
| Recherche        | Suggestions de requête, filtre « avec/sans » (F2), phrase (F1)             | ✗    | D4 ; F3 partiel (filtres URL existent)                      |
| Moteur           | v1 filtres/analyse/score/tiers/ranking + config                            | ✓    |                                                             |
| Moteur           | Niveaux avec raison affichée, « à vérifier »                               | ✗/◐  | raison absente ; « à vérifier » attend 6b.7b                |
| Moteur           | Allocation, « sous réserve », justificabilité, laboratoire                 | ✗    | lots 5c + 6b                                                |
| Frigo            | Élément sets + sync compte + invité                                        | ✓    | ids sans quantités (séquence 6b.7b)                         |
| Frigo            | Scan photo → confirmation → ajout                                          | ◐    | basique (D4 veut 6 états, corrections, erreurs, hors ligne) |
| Frigo            | « Épuisé », édition quantité, retrait + Annuler, vue 64+                   | ✗    | D4 ; dépendra du modèle entrées                             |
| Suggestions      | 3 niveaux (prête/presque/idées) + filtres gardés                           | ✓    | bornes ≠ D4 (arbitrage A2)                                  |
| Recettes         | Catalogue filtré/trié, fiche recette (étapes, coût, substitution affichée) | ◐    | substitution accept/refuse et portions à ajouter (D4)       |
| Recettes         | Étals (R1), mosaïque (R2), « Ce soir » (R3)                                | ✗    | D4, arbitrage A3                                            |
| Recettes         | Onglet Favoris                                                             | ✗    | favoris existent en données + filtre                        |
| Planning         | 7 jours × midi/soir + budget                                               | ✓    |                                                             |
| Planning         | Bande de jours P1, portions, restes, Ramadan, copier, WhatsApp             | ✗    | D4 + D-29 🚩                                                |
| Courses          | Listes nommées, rayons, progression, budget                                | ✓    |                                                             |
| Courses          | « Mes listes » séparé, « dans le panier », fusion d'ajout                  | ◐    | fusion compatible existe (`addGroceryItems`)                |
| Comptes          | 3 niveaux, création atomique, E.164, politique mdp                         | ✓    |                                                             |
| Comptes          | Profil invité, page connexion, écran profil, panneau avatar                | ✗    | D4 (D-23/D-26)                                              |
| Comptes          | Vérification e-mail                                                        | ✗    | prévu plus tard (port honnête `false`)                      |
| Notifications    | Cloche, badge, centre, préférences                                         | ✗    | aucune trace dans le code                                   |
| Historique       | Archivage serveur des listes                                               | ✓    |                                                             |
| Historique       | Consultations récentes (UI)                                                | ✗    | données → à vérifier côté client                            |
| Scan             | Provider Gemini + validation serveur                                       | ✓    | 🚩 clé API/quota (A10)                                      |
| Mode cuisine     | Écran pas-à-pas, minuteur, ingrédients de l'étape                          | ✗    | D4                                                          |
| PWA              | SW, install, mise à jour, hors ligne                                       | ✓    | cache photos à étendre aux nouveaux hosts                   |
| SEO              | Pages servées aux robots, 301, listes ×100                                 | ✓    |                                                             |
| Pub              | Aucune (aucun emplacement réel)                                            | ✗    | D4 = emplacements uniquement ; 10.x plus tard               |
| Design           | AppTheme A + fkhar, i18n 4 langues, RTL logique                            | ✓    | direction C « Zitouna » absente (🚩 A4)                     |
| Design           | Logo définitif                                                             | ✗    | fourniture chef (D-18)                                      |
| Back-office      | 12 pages + éditeurs + simulateur                                           | ✓    |                                                             |
| CMS (18)         | Échine, expériences, groupes, messages…                                    | ✗    | architecture clôturée, rien d'implémenté                    |
| i18n             | Chaînes D4 nouvelles (~200 clés)                                           | ✗    | à produire à l'implémentation                               |

---

## 3. Écarts et risques importants

### Écarts structurants (E)

1. **E1 — Sémantique de correspondance** : D4 affiche des niveaux avec « à vérifier » (quantité
   inconnue) ; le frigo réel ne porte aucune quantité et le moteur ne produit pas cet état.
   Tout affichage D4 doit être traduit en règles d'affichage sur les données **actuelles**, sans
   inventer de quantités (arbitrage A1).
2. **E2 — Bornes des niveaux** : moteur (`almost ≤ 2 achats`) ≠ D4 (« Presque = 1–3 », « À
   découvrir = 4+ ») ; de plus les « idées » actuelles = recettes _liées_ au frigo, alors que
   l'onglet « À découvrir » D4 inclut des recettes non liées (arbitrage A2).
3. **E3 — Étals (R1)** : exigent des requêtes enregistrées gérées par le chef ; le modèle `Recipe`
   n'a pas de tags — les étals fondés sur « vendredi/Ramadan » attendent 7.1. Solution progressive
   proposée en A3.
4. **E4 — Notifications, mode cuisine, profil/invité/connexion, écran favoris, historique UI,
   bienvenue/onboarding** : absents du code, conçus dans D4.
5. **E5 — Identité** : direction C « Zitouna », logo chef, libellés — AppTheme non modifié à ce
   jour (conforme) ; le passage à C exigera un lot dédié (A4).
6. **E6 — Contenu réel** : le catalogue de démonstration D4 (15 recettes, 16 catégories, frigo
   canonique) n'est pas la base de production ; les données réelles (photos du chef, catégories
   validées D-24, prix) restent à administrer.

### Risques (R)

1. **R1 — Fausse promesse de matching** : reproduire les niveaux D4 sans la sémantique réelle
   produirait exactement ce que le projet interdit (« jamais un oui trompeur »). Mitigation :
   règles d'affichage écrites dans `src/core`, testées, sur les données réelles du moteur.
2. **R2 — Scope creep front-end** : 59 composants de maquette ≠ 59 composants à coder d'abord.
   Mitigation : n'implémenter que ce que les écrans consomment (les autres viennent avec leurs
   écrans ou le CMS).
3. **R3 — État de vérification inconnu** : `npm run check` à relancer en ouverture ; la branche
   `feature/datastore-contract` contient des maquettes non commitées (d3, d4, zips) à intégrer ou
   ignorer volontairement avant le premier lot de code.
4. **R4 — Dépendance externe de photos** : maquettes sur Wikimedia Commons, production sur
   Unsplash/hébergeur — coût réseau et licences à cadrer (séance photo D-21 🚩).
5. **R5 — Vision Gemini** : clé API + quota ; fonctionnalité facultative avec repli manuel —
   respect du « budget zéro » à confirmer explicitement (A10).
6. **R6 — Volume i18n** : ~200 nouvelles clés × 4 langues ; la relecture native (D-15) est un
   prérequis de publication, pas d'implémentation.
7. **R7 — Règles Firestore** : tout nouvel endpoint (notifications…) exige sa règle au plus strict
   avant branchement.
8. **R8 — Performance** : bundle client (React 19 + Tailwind 4 déjà en place), budgets interface à
   figer après validation D4 (plan § 13 : interaction < 100 ms, navigation < 200 ms) ; ne pas
   dégrader le lazy-loading du back-office ni la sync incrémentale.
9. **R9 — Non-régression** : les écrans actuels continuent de servir pendant la reconstruction
   D4 — passer écran par écran, jamais de refonte globale en un lot.
10. **R10 — Accessibilité** : contrastes et cibles vérifiés en maquette ; lecteur d'écran réel
    (NVDA/TalkBack) reste à tester en 2.8+/implémentation.

---

## 4. Plan d'implémentation proposé

Le fil existant (1.5 → 6a → 6b → 6c… et 5a/5b/5c) **ne change pas** ; le lot 2.6 (maquettes D1/D2
client) étant désormais **couvert et validé par D4**, l'implémentation front-end client peut
démarrer. Chaque lot suit le cycle obligatoire du plan § 19 (présentation → validation →
réalisation → rapport → validation avant le suivant) ; `npm run check` vert à chaque clôture.

### Rail client (lots 2.6.x) — dans l'ordre

| Lot                                                    | Objectif et périmètre                                                                                                                                                                                                                                 | Dépend de                            | Règles métier à définir                                                                                  | Fichiers/modules pressentis                                                                                    | Tests et critères d'acceptation                                                                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **2.6.1 Fondations d'identité & shell**                | Extension AppTheme avec la direction C « Zitouna » (🚩 A4) ; shell : en-tête (cloche + avatar), barre basse 5 destinations (dont « Semaine »), barre haute desktop (variante retenue D-22), bandeaux install/hors ligne ; libellés i18n des 4 langues | A4 validé                            | libellé « Semaine » (A5)                                                                                 | `src/core/theme/builtinThemes.ts`, `src/index.css`, `src/app/layout/*`, `src/shared/ui/*`, `src/shared/i18n/*` | contrastes 58/58 (`tools/contrast-check.mjs`), RTL 4 langues, 320/375/768/1280, aucune régression des thèmes A/fkhar          |
| **2.6.2 Bibliothèque de composants communs**           | Traduction des composants D4 réellement consommés par les écrans : rail carrousel, chips, carte de recette (4 variantes) avec **badge + raison**, feuilles basses, panneau, skeletons, états vides — props identiques aux maquettes                   | 2.6.1                                | règle d'affichage du niveau + raison (A1)                                                                | `src/shared/ui/`, `src/features/*` (composants transverses)                                                    | tests unitaires par composant, propriétés logiques, cibles ≥ 44 px                                                            |
| **2.6.3 Accueil (composition C) et ses états**         | 6 états (nouveau, frigo vide, rempli, favoris, planning, courses en cours), héros adaptatif, aperçu frigo, étal « avec ce que j'ai », bande éditoriale, conteneurs d'emplacement pub **toujours repliés** tant que 10.x n'existe pas                  | 2.6.2                                | états d'accueil (données locales uniquement, aucun calcul lourd)                                         | `src/features/home/`, `src/shared/paths.ts` (aucune nouvelle adresse publique)                                 | états testés, zéro CLS, accueil actuel conservé en repli pendant le lot                                                       |
| **2.6.4 Catalogue & suggestions (R1/R2/R3, F1/F2/F3)** | Page Recettes : phrase F1, inclure/exclure (F2), puces + feuille (F3), vues étals/mosaïque/déck ; page Suggestions : 3 niveaux avec raison, rappel frigo + Modifier, onglet Favoris (🚩 A6)                                                           | 2.6.2 ; bornes du moteur (A2)        | bornes des niveaux, périmètre d'« À découvrir », étals au périmètre progressif (A3)                      | `src/core/matching` (règles d'affichage uniquement), `src/features/recipes`, `src/features/suggestions`        | scénarios d'affichage type `scenarios.html` portés en tests Vitest ; totaux justes ; filtres gardés entre écrans (convention) |
| **2.6.5 Fiche recette & mode cuisine**                 | Fiche unique `?id=` : 4 informations (préparation/cuisson/difficulté/portions), ingrédients à 3 états, substitution acceptée/refusée (affichage), étapes, **mode cuisine** (pas-à-pas, minuteur, ingrédients de l'étape, reprise `#stepN`)            | 2.6.2 ; sémantique substitution (A7) | portions non bloquantes, reprise après interruption                                                      | `src/features/recipes/components/`, nouveau `src/features/cooking/`                                            | minuteur réel, `prefers-reduced-motion`, sortie neutre, hors ligne                                                            |
| **2.6.6 Frigo & courses**                              | Frigo : recherche, catégories, « quantité non renseignée » neutre, **sans** migration du modèle (ids), retrait + Annuler ; Courses : ligne entière cliquable, « dans le panier », progression ≠ budget, écran « Mes listes » séparé (A8)              | 2.6.2 ; A8                           | wording des états de quantité (jamais de reproche)                                                       | `src/features/fridge`, `src/features/grocery`                                                                  | retrait annulable testé, sync invité/compte non régressée                                                                     |
| **2.6.7 Planning**                                     | Bande de jours P1, portions/restes/déplacement, résumé calculé (repas · achats · fourchette), outils P3 sous arbitrage (A9)                                                                                                                           | 2.6.2 ; A9                           | mode Ramadan, « cuisiner double », portions (D-29)                                                       | `src/features/planner`, `src/core/planning`                                                                    | résumé calculé = source unique ; création de liste reliée à courses                                                           |
| **2.6.8 Écrans secondaires & comptes**                 | Notifications (cloche + écran dédié — périmètre A11), favoris (♥/⤓, A6), historique consultations, profil/invité/connexion, bienvenue + onboarding, scan amélioré (6 états)                                                                           | 2.6.2 ; A11, A12                     | distinctions favori/hors ligne, périmètre notifications, reprise données locales à la création de compte | `src/features/*`, nouveaux endpoints + `firestore.rules` (R7)                                                  | états vides/erreurs/hors ligne ; permission notifications jamais à l'ouverture                                                |

### Rails parallèles (déjà prévus par le plan, inchangés)

- **5a (corpus + baseline moteur)** — dès que les cas métier du chef sont fournis ; nourrit 5b/5c/6b.
- **2.7 (dette technique)** — indépendant, à lancer quand le rail client est posé.
- **4.1 (noyau de règles)** — indépendant, prérequis des phases 4/6b.
- **1.5 → 6a → 6b → 6c** — séquence validée : répétition générale après 5b + mapping 6a, bascule
  SQL sur décision explicite, moteur 6b après 5b/5c. **Aucune évolution du modèle frigo ni du
  moteur avant ces portes.**

### Règles transverses de tous les lots

`npm run check` vert · non-régression écran par écran (l'app actuelle reste servie) · 4 langues + RTL
vérifiés · 320/375/768/1280 · cibles ≥ 44 px · propriétés logiques · textes jamais en dur · zéro
dépendance payante nouvelle · emplacements pub présents mais toujours repliés avant 10.x · aucune
quantité obligatoire · aucune évolution de modèle sans la porte 6a/6b correspondante.

---

## 5. Décisions à arbitrer (🚩)

| #       | Décision                                                                                 | Options et recommandation                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1**  | Traduction des niveaux D4 sur les données actuelles (sans quantités)                     | **Recommandé** : règles d'affichage dans `src/core` — Prête = 0 manquant (quantités connues non vérifiables aujourd'hui), Presque = 1–3 manquants, À découvrir = 4+ ; l'état « à vérifier » (quantité inconnue) est codé dans la règle mais vide tant que le frigo ne porte pas de quantités (6b.7b). Alternatif : conserver les niveaux actuels tels quels (écran moins proche de D4) |
| **A2**  | Bornes et périmètre des niveaux                                                          | D4 : Presque = 1–3 manquants, À découvrir = 4+ ; moteur actuel : almost ≤ 2, idées = recettes liées. Recommandé : adopter les bornes D4 (1–3 / 4+) et garder les suggestions limitées aux recettes liées au frigo (« À découvrir » inclut les liées à 4+, pas tout le catalogue)                                                                                                       |
| **A3**  | Étals (R1) : périmètre initial                                                           | Étals basés sur les champs existants (frigo, ≤ 30 min, budget, type de plat) en configuration code ; étals à tags (vendredi, Ramadan) attendent 7.1. Recommandé : deux étapes, pas de collection nouvelle maintenant                                                                                                                                                                   |
| **A4**  | Direction visuelle C « Zitouna » dans AppTheme                                           | Confirmer D-04 avant de toucher `builtinThemes.ts` ; A/fkhar conservés, C par défaut                                                                                                                                                                                                                                                                                                   |
| **A5**  | Libellé « Menu Semaine » → « Semaine » (barre basse)                                     | Suivre D-11                                                                                                                                                                                                                                                                                                                                                                            |
| **A6**  | Favoris : 3ᵉ onglet dans Recettes ; ♥ ≠ ⤓ hors ligne                                     | Suivre D-06/D-07 (D-07 : ne pas créer de 3ᵉ notion)                                                                                                                                                                                                                                                                                                                                    |
| **A7**  | Substitution : accepter/refuser à l'affichage dès maintenant                             | La logique existe (recettes × règles) ; l'acceptation modifie l'affichage de la préparation courante seulement — conforme D-33                                                                                                                                                                                                                                                         |
| **A8**  | Courses : séparer « faire ses courses » / « gérer les listes »                           | Suivre D-08                                                                                                                                                                                                                                                                                                                                                                            |
| **A9**  | Outils planning P3 (Ramadan, cuisiner double, portions, note, copier, WhatsApp)          | Confirmer comme règles métier (D-29) avant d'implémenter ; sinon livrer P1 seul                                                                                                                                                                                                                                                                                                        |
| **A10** | Vision Gemini : maintenance de la clé API (gratuit/quotas)                               | Confirmer que le scan reste une fonctionnalité optionnelle avec repli manuel, sans coût obligatoire                                                                                                                                                                                                                                                                                    |
| **A11** | Périmètre des notifications                                                              | Rappels de cuisson + « ce soir » + nouveautés, opt-in tardif (D-20 validé pour le desktop ; catégories à trancher)                                                                                                                                                                                                                                                                     |
| **A12** | Note communautaire (étoiles) et statistiques profil (« DT économisés »)                  | Recommandé : retirer les deux (D-12/D-13) — pas de règle métier qui les soutienne                                                                                                                                                                                                                                                                                                      |
| **A13** | Marque : passer l'app et `CLAUDE.md` à « Chnawa Ntayeb / by chef Souhed »                | Lot de code dédié (D-05), en attente de votre feu vert                                                                                                                                                                                                                                                                                                                                 |
| **A14** | Contenus réels : catégories (16, D-24), photos (séance D-21), texte arabe du logo (D-19) | À fournir/valider avant publication, pas avant implémentation                                                                                                                                                                                                                                                                                                                          |

---

## 6. Ce que cet audit ne conclut pas

- Aucune fonctionnalité n'est déclarée « terminée » sans base vérifiable ; les statuts ✓ reposent sur
  les suites de tests existantes et les rapports des lots clôturés — `npm run check` reste la
  confirmation d'ouverture du premier lot.
- Les chiffres de D4 (1/2/12, 37,40–48,40 DT…) sont des données de démonstration : la conformité
  d'affichage visée est **structurelle** (mêmes composants, mêmes règles d'affichage), jamais la
  reproduction de ces valeurs.
- Le plan conserve les portes validées : rien du moteur nouveau (6b) ni de la bascule SQL (6a) ne
  démarre pendant les lots 2.6.x ; l'atelier (4.6) et l'échine CMS restent dans leur séquence.
