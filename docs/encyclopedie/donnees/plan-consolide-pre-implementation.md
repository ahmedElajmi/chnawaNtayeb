# Proposition consolidée pré-implémentation — Chnawa Ntayeb

**Objet** : version consolidée et concise demandée par le chef — corrections de l'audit (sémantique
du matching en tête), matrice de traçabilité complète, architecture frontend concrète, adaptations
mobile réellement justifiées, séquencement des lots et arbitrages. **Aucun développement, aucune
modification de code.** Rien n'est validé implicitement : les décisions 🚩 attendent votre accord.
**Base** : audit (`audit-preparation-implementation.md`), annexes (périmètre + architecture
frontend ; évolutivité/mobile), V12, plan § 17, CMS § 18, paquet D4. Cette note **consolide** ;
les annexes restent les documents de détail.

---

## 1. Corrections à l'audit

### 1.1 Sémantique du matching — la correction principale (directive du chef, intégrée)

L'audit proposait « Prête = 0 manquant ». **Corrigé** : tant que le modèle de quantités n'existe
pas (séquence validée 6b.7a/6b.7b), la présence d'un ingrédient ne prouve **rien** sur la quantité
— un frigo sans quantités rend **toutes** les présences « quantités inconnues ». Quatre catégories
sont donc distinguées dans les règles d'affichage (et nulle part ailleurs avant leur lot) :

| Catégorie                    | Signification                                        | Existe aujourd'hui ?                              |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Présent                      | « j'en possède » (présence déclarée)                 | ✓ (tout le frigo actuel)                          |
| Manquant                     | absent du stock                                      | ✓ (moteur v1)                                     |
| Quantité inconnue            | présent, disponibilité réelle **à vérifier**         | ✓ de facto (c'est l'état de tout le frigo actuel) |
| Quantité vérifiée suffisante | exploitable seulement quand les quantités existeront | ✗ — attend 6b.7b                                  |

**Règle d'affichage adoptée comme base** (proposée, wording à valider — D1) :

- le niveau supérieur ne dit jamais « Prête » ni « Réalisable maintenant » ; il dit
  **« Tous les ingrédients semblent présents — quantités à vérifier »** ;
- les niveaux suivants restent nommés sur les manquants réels (Presque / À découvrir, bornes 🚩 D2) ;
- l'action principale du niveau supérieur n'est pas « Passer en mode cuisine » comme garantie :
  **« Voir la recette »** (la préparation reste possible depuis la fiche, libellé factuel
  « Commencer la préparation »), l'ajout des manquants à la liste reste l'action secondaire
  quand il y en a ;
- cette sémantique est écrite **une fois** dans `src/core` (fonctions pures : niveau, raison,
  action) avec ses tests, et consommée par tous les écrans — les maquettes D4 restent la référence
  de mise en forme, pas des règles métier ;
- **aucune gestion de quantités ni modification du modèle de stock maintenant** — la règle est
  écrite pour que l'état « quantité vérifiée » s'y branche au lot 6b.7b sans refonte.

### 1.2 SQLite : clarification vérifiée (sans rouvrir la décision)

La stratégie confirmée est **conservée** : Firestore fournisseur actif ; SQLite prouve la
compatibilité ; un autre moteur SQL = étape distincte avec ses validations. Vérification demandée
et faite — ce que les tests couvrent **réellement** :

| Vérifié par les tests actuels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Couverture                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrat `DataStore` complet sur SQLite (`contract.ts`, ~20 comportements) : écritures + révisions strictement croissantes, flux de changements paginé, marqueurs de suppression, `commit` atomique avec garde (conflict → rien n'est écrit), réservation e-mail (claim exactement une fois), `transact` sérialisé sous concurrence (aucune section perdue), curseur composite (révision partagée par commit, groupe livré entier, frontière inclusive), validation JSON (`undefined`, NaN, Date, circulaire — rien d'écrit en cas de refus), garanties identifiants (intersection Firestore/SQL, légaux non exclus), enveloppe ≤ 10 ops, pagination avec total exact et curseur | ✓                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Contention SQLite dédiée (`contention.test.ts`, lot 1.4) + baseline perf 100k (`perfSmoke`, dossier 1.4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✓                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Suite identique sur **mémoire** (référence) et **émulateur Firestore** (skippée proprement si l'émulateur est absent — jamais un faux vert)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ✓                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Contraintes relationnelles du domaine** (clés étrangères composites, CHECK, colonnes typées, index par domaine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✗ **non couverts — par conception** : l'adaptateur SQL actuel est volontairement « une table par collection » (id · document JSON · révision), présenté dans son en-tête comme « portability preparation » ; la **transformation relationnelle** (FK composites, CHECK, index — formes publiées dans 18 § 3) est le lot **6a**, après 5b. Ce n'est pas une lacune : c'est la séquence anti-double-migration validée |

**Divergences Firestore / SQLite couvertes et documentées** (matrice des capacités, lot 1.4) :
concurrence (transactions natives Firestore vs écritures sérialisées `BEGIN IMMEDIATE` +
`busy_timeout`), révisions (compteur en transaction côté Firestore, calculées par l'instruction
côté SQL — jamais l'horloge), marqueurs de suppression (document tombstone vs `deleted`), curseurs
(négociation ancien/nouveau format), JSON (types natifs vs JSON colonne + `json_extract`).
**Correction apportée à l'audit** : la formulation « SQLite vérifie la compatibilité des modèles,
des relations et des opérations » doit se lire — _opérations : vérifiées ; relations du domaine :
conçues et vérifiées à 6a sur les modèles stabilisés 5b_. Aucune réouverture du choix.

### 1.3 A2 (seuils 1–3 / 4+) : non validé — justification et conséquences

Les seuils D4 ne sont **pas** des règles métier validées. Justification et conséquences pour
décider :

**État actuel du moteur** (configurable, pas codé en dur) : Presque = ≤ 2 achats, avec contraintes
propres (≤ 1 ingrédient clé manquant ; si un clé manque, ≤ 1 achat au total) ; Idées = recettes
_liées_ au frigo. **D4 proposait** : Presque = 1–3 manquants, À découvrir = 4+.

- **Fait mesurable** : sur le corpus de démonstration (15 recettes), les deux jeux donnent la
  **même** répartition (1 au complet / 2 presque / 12 à découvrir) — aucune recette n'a exactement
  3 manquants. La différence n'apparaît que sur des données réelles.
- **Conséquences d'élargir Presque à 3** : plus de recettes dans « Presque » (risque de diluer la
  valeur du niveau — la promesse « il ne manque presque rien » s'affaiblit), plus d'incitations
  d'achat, classement inchangé (les moins de manquants d'abord). Le contrainte clé
  (`almostMaxMissingKey`) resterait à conserver pour éviter des « presque » sans leur ingrédient
  principal.
- **Conséquence d'étendre « À découvrir » aux recettes non liées** : le niveau perdrait son
  caractère « à partir de mon frigo » et tendrait vers le catalogue complet.
- **Recommandation technique** : ne **pas** modifier le moteur maintenant ; implémenter les
  bornes d'affichage comme **constantes configurables** (`MatchingConfig.tiers` existe déjà pour
  « presque » ; ajout d'une constante d'affichage pour le seuil 4+), valeurs initiales = bornes
  actuelles du moteur ; la décision définitive des bornes se prend **avec le corpus 5a** (lot
  5a.1/5c), où elle sera mesurée et non devinée. **D2 = à arbitrer après justification** —
  conserver les bornes actuelles tant que D2 n'est pas tranché.

### 1.4 Autres corrections de forme

- **M4/T4 reformulé** (conforme à votre instruction) : _pas de dépendance directe aux SDK
  fournisseurs dans le domaine ou la logique métier ; si un SDK est nécessaire (ex. push natif),
  il est isolé derrière un port et un adaptateur remplaçable_ — pas d'interdiction absolue.
- **T2 bornes précisées** : la garde d'architecture s'étend à `src/core` + `src/application`
  (interdiction des dépendances directes aux plateformes/fournisseurs) ; **les adaptateurs
  d'infrastructure restent libres** d'utiliser les API des plateformes.
- **T8 précisé** : politique de versionnement définie **avant la publication native** ; pas de
  `/v1` prématuré ; compatibilité ascendante pour les évolutions non cassantes, gestion des
  capacités, dépréciation et durée de support documentées.
- **Étape 0 à ajouter à l'ouverture du premier lot** : `npm run check` exécuté et **documenté**
  (impossible pendant l'audit) ; état Git — les maquettes non commitées (`d3/`, `d4/`, zips,
  documents d'audit) seront soit commitées volontairement, soit explicitement exclues, à décider ;
  distinction présente dans le code / couverte par tests / déployée en production établie dans le
  rapport d'ouverture (le déploiement réel n'est pas vérifiable depuis l'environnement d'audit).

---

## 2. Matrice de traçabilité complète

Légende — état code : **✓** existant et testé · **◐** partiel · **✗** absent · ** {?}** à vérifier
(ouverture du premier lot). Statut : **✅** validé (chef) · **🚩** à arbitrer · **📅** planifié ·
**⏳** différé (feuille de route — différer ≠ abandonner). Aucune fonctionnalité déjà discutée
n'est sortie de cette table.

### 2.1 Client — écrans et parcours

| Besoin                                                                    | Code                     | Écart cible               | Lot             | Dépend de                  | Statut                              |
| ------------------------------------------------------------------------- | ------------------------ | ------------------------- | --------------- | -------------------------- | ----------------------------------- |
| Accueil composition C + 6 états                                           | ✗                        | D4 validé                 | 2.6.3           | 2.6.2                      | ✅ (D-01)                           |
| Catalogue R1 étals / R2 mosaïque / R3 deck                                | ✗                        | D4                        | 2.6.4           | 2.6.2 ; étals à tags : 7.1 | ✅ (D-28) ; périmètre étals 🚩 D3   |
| Filtres F1 phrase / F2 avec-sans / F3 puces+feuille                       | ◐ (filtres URL)          | D4                        | 2.6.4           | 2.6.2                      | 📅                                  |
| Suggestions 3 niveaux + raison + « quantités à vérifier »                 | ◐ (3 tiers, sans raison) | § 1.1                     | 2.6.4           | règles d'affichage core    | 🚩 D1/D2                            |
| Onglet Favoris + ♥/⤓ hors ligne                                           | ◐ (données + filtre)     | D4                        | 2.6.8           | —                          | 🚩 D4 (D-06/D-07)                   |
| Fiche recette (4 infos, 3 états, portions, substitution acceptée/refusée) | ◐                        | D4                        | 2.6.5           | —                          | 📅                                  |
| Mode cuisine (pas-à-pas, minuteur, reprise `#stepN`)                      | ✗                        | D4                        | 2.6.5           | —                          | 📅                                  |
| Frigo : annuler, épuisé*, recherche, mosaïque 64+, édition neutre         | ◐                        | D4 ; *épuisé réel : 6b.7b | 2.6.6           | —                          | 📅 (D-27)                           |
| Courses : « dans le panier », mes listes séparé                           | ◐                        | D4                        | 2.6.6           | —                          | 🚩 D5 (D-08)                        |
| Planning bande P1 + résumé calculé                                        | ◐ (table)                | D4                        | 2.6.7           | —                          | ✅ (D-28)                           |
| Outils P3 (Ramadan, double, portions, copier, WhatsApp)                   | ✗                        | D4 ; D-29                 | 2.6.7           | 🚩 D6                      | 🚩                                  |
| Notifications (cloche, badge, centre, préférences, port push-ready)       | ✗                        | D4 ; D-20 desktop ✅      | 2.6.8           | règles Firestore           | 🚩 D7 (périmètre)                   |
| Profil / invité / connexion / panneau avatar                              | ◐ (modale compte)        | D4 ; D-23/D-26            | 2.6.8           | —                          | 🚩 D8                               |
| Bienvenue + onboarding                                                    | ✗                        | D4                        | 2.6.8           | hors SEO (🚩 D9)           | 📅                                  |
| Scan complet (6 états, corrections, erreurs, hors ligne)                  | ◐                        | D4                        | 2.6.8           | —                          | 📅                                  |
| Historique consultations (UI)                                             | ✗ (données serveur ✓)    | D4                        | 2.6.8           | —                          | 📅 · code client {?}                |
| Identité C « Zitouna » + shell (cloche/avatar, barre haute)               | ✗/◐                      | D4                        | 2.6.1           | AppTheme                   | 🚩 D3 (D-04)                        |
| Marque « Chnawa Ntayeb » dans l'app + CLAUDE.md                           | ✗                        | D-05                      | lot dédié court | —                          | 🚩 D10                              |
| Libellé « Semaine » (barre basse)                                         | ✗                        | D-11                      | 2.6.1           | —                          | 🚩 D11                              |
| Emplacements pub (conteneurs toujours repliés)                            | ✗                        | D4 ; D-10                 | 2.6.3–2.6.5     | —                          | 🚩 D12 (placement), contenu 10.x ⏳ |

### 2.2 Moteur, frigo, données

| Besoin                                                                         | Code                    | Écart cible            | Lot                            | Dépend de              | Statut             |
| ------------------------------------------------------------------------------ | ----------------------- | ---------------------- | ------------------------------ | ---------------------- | ------------------ |
| Moteur v1 + config + scénarios + simulateur                                    | ✓                       | —                      | —                              | —                      | ✅                 |
| Règles d'affichage (niveau, raison, action) en core                            | ✗                       | § 1.1                  | 2.6.2                          | —                      | 📅 (wording 🚩 D1) |
| Bornes des niveaux                                                             | ◐ (2)                   | D4 (1–3/4+) non validé | constantes 2.6.4 ; décision 5c | corpus 5a              | 🚩 D2              |
| Corpus + baseline moteur + harnais                                             | ◐ (`diagnose:matching`) | V12 § 16               | 5a.1–5a.3                      | cas métier du chef     | 📅 🚩 (fourniture) |
| Frigo à entrées (quantités facultatives, DLC/DDM, réservations, permanent)     | ✗ (ids)                 | V12 § 8                | 5b.2 → 6b.7a/6b.7b             | 5b.3 ; portes validées | 📅 ⏳ (séquence)   |
| Compatibilités + substitutions priorité/exceptions/héritage                    | ◐                       | V12 § 10               | 5c.1–5c.2 → 6b.3               | 5b.2                   | 📅 ⏳              |
| Conversions exacte/approximative/impossible                                    | ✗                       | V12 § 11               | 5c.3 → 6b.2                    | 5b.2                   | 📅 ⏳              |
| Allocation + 6 verdicts + « sous réserve » + portions réduites + explicabilité | ✗                       | V12 § 12               | 6b                             | 5c.5                   | 📅 ⏳              |
| Laboratoire 3 vues + simulations + portes publication                          | ✗                       | V12 § 14               | 6b.8                           | 2.8, 3.x, 4.3          | 📅 ⏳              |
| Modèles ingrédients/recettes (variantes, lignes, tags)                         | ◐                       | V12 § 6–7              | 5b → 6a                        | décision ouverte n°1   | 📅 ⏳ 🚩           |
| Migration SQL (répétition 1.5, bascule 6a, moteur 6b)                          | ◐ (mécanismes faits)    | § 12                   | 1.5 → 6a → 6b → 6c             | séquence validée       | 📅 ⏳ ✅           |
| Baseline couche données + seuils perf                                          | ◐ (baseline mesurée)    | seuils                 | décision                       | —                      | 🚩 D13             |

### 2.3 Back-office, plateforme, CMS

| Besoin                                                                        | Code              | Écart cible        | Lot           | Dépend de              | Statut |
| ----------------------------------------------------------------------------- | ----------------- | ------------------ | ------------- | ---------------------- | ------ |
| Fondations D3 (shell, recherche globale, tableaux, widgets, prévisualisation) | ✗                 | V12 § 5            | 2.2 → 2.8     | maquettes D3 partie 2  | 📅     |
| RBAC groupes & rôles (anti-élévation, dernier super admin)                    | ◐ (2 permissions) | V12 § 5 ; 18 § 3.2 | 2.3 → 3.1–3.5 | —                      | 📅     |
| Noyau de règles + fonctionnalités + entitlements-dons                         | ✗                 | V12 § 21           | 4.1, 4.2, 4.5 | —                      | 📅     |
| Échine Staged/Online + migration atelier                                      | ◐ (historiques)   | 18 § 4             | 4.3 → 4.6     | 4.1                    | 📅     |
| CMS (pages, médias, expériences, groupes, segments, messages)                 | ✗                 | 18                 | 7.3/7.4       | conception 2.2/2.3/2.4 | 📅 ⏳  |
| Dette technique                                                               | —                 | plan 2.7           | 2.7           | —                      | 📅     |
| Éditeurs renforcés (lignes, variantes, prix, frigo admin)                     | ◐                 | V12 § 6–7 ; D5     | 6a.4, B4      | 5b.2, D5 validé        | 📅 ⏳  |

### 2.4 Éditorial, recommandations, analytics, pub, budget, commerce

| Besoin                                                                                            | Code                  | Écart cible | Lot       | Dépend de                   | Statut        |
| ------------------------------------------------------------------------------------------------- | --------------------- | ----------- | --------- | --------------------------- | ------------- |
| Axes/tags + sélections + groupes éditoriaux + collections                                         | ✗                     | V12 § 18–19 | 7.1–7.3   | 6a.1                        | 📅 ⏳         |
| Campagnes + sections + éditeur de home + prévisualisation                                         | ✗                     | V12 § 20    | 7.4/7.5   | 7.3                         | 📅 ⏳         |
| Recommandations + mixage recherche                                                                | ✗                     | V12         | 8.1/8.2   | 7.2, 9.2                    | 📅 ⏳         |
| Analytics (événements fermés, consentement, agrégats)                                             | ✗                     | V12 § 22    | 9.1–9.4   | 4.1                         | 📅 ⏳         |
| Publicité (décision serveur, no_ads, régie interne, « sponsorisé »)                               | ✗                     | V12 § 23    | 10.1–10.5 | 4.1/4.5, 7.4                | 📅 ⏳         |
| Budget (coût, filtres, rubriques, back-office prix, qualité/prix)                                 | ◐ (socle fourchettes) | § 24        | B1–B6     | 🚩 validation de la section | 🚩 D14 ⏳     |
| Commerce / abonnements / restaurants                                                              | ✗ (frontières seules) | V12 § 24    | 11–13     | porte de passage            | ⏳ 🚩         |
| Backlog assumé (V12 § 29 : réservations auto, allocation globale planning, ML, IA décisionnaire…) | ✗                     | —           | —         | —                           | ⏳ (maintenu) |

### 2.5 Socle technique transversal

| Besoin                                                                           | Code                             | Écart | Lot               | Statut |
| -------------------------------------------------------------------------------- | -------------------------------- | ----- | ----------------- | ------ |
| Cycle de vie injecté dans `KitchenSync` (`window` retiré de `src/application`)   | ✗ (couplage trouvé)              | T1    | 2.6.0             | 📅     |
| Garde d'architecture étendue à `src/application` (infrastructure exemptée)       | ✗                                | T2    | 2.6.0             | 📅     |
| Règle « SDK fournisseur isolé derrière port » écrite + testée                    | ◐ (garde cœur)                   | T4    | 2.6.0             | 📅     |
| Contrats API centralisés (chemins + DTO + erreurs + auth)                        | ✗ (~19 fichiers)                 | T3    | 2.6.0 (ou 2.6.1)  | 🚩 D15 |
| État des filtres en store, URL = projection                                      | ✗                                | T5    | 2.6.4             | 📅     |
| Composants sans router (hrefs en props)                                          | ◐ (motif D4 conforme)            | T6    | règle 2.6.1/2.6.2 | 📅     |
| Port notifications (local → push possible)                                       | ✗                                | T7    | 2.6.8             | 📅     |
| Politique de versionnement API (avant publication native ; pas de /v1 prématuré) | ✗                                | T8    | décision légère   | 🚩 D16 |
| Extraction en paquets                                                            | ✗ (monolithe modulaire conservé) | T9    | porte mobile      | ⏳ ✅  |

---

## 3. Architecture frontend — proposition concrète

**Règle directrice** : la logique métier ne vit jamais dans un composant ; une page est un
assemblage ; la réutilisation se prouve ; les 59 composants D4 sont un inventaire, pas un plan de
charge. Quatre couches :

**Couche 1 — UI générique** `src/shared/ui/` — aucun import du domaine :
`Rail` (carrousel), `Chips`/`ChipFilter`, `Tabs`, `PageHeading`, `EmptyState`, `SkeletonList`,
`Sheet` (feuille basse/centrée, sur `ModalShell` existant), `OfflineStrip`, `InstallBanner` (existe),
`ShowMore` (existe), `IconLink`. Chacun : props typées, propriétés logiques RTL, test rendu +
interaction, textes par clés i18n.

**Couche 2 — métier réutilisables** `src/features/<domaine>/components/` — importe les **types**
de `@/core/...`, jamais de logique décisionnaire : `RecipeCard` (variantes `grid | featured |
compact | deck`), `MatchingBadge`, `MatchReason` (consomme la fonction core), `PriceRange`,
`CategoryRail`, `Shelf`, `FridgePeek`, `GroceryProgress`, `FavoritesStrip`, `FilterSentence`,
`IngredientFilter`, `QuickFilters`, `ActiveFilters`, `RecipeViews` (R1/R2/R3), `WeekStrip`,
`PlanSummary`, `NotifCenter`, `ListsManager`, `RecipeCollection`, `HistoryList`, `ScanFlow`.
**Navigation découplée** : tout lien arrive en prop (`href`, `onNavigate`) — jamais
`react-router` dans un composant des couches 1–2.

**Couche 3 — écrans** `src/features/<écran>/` : `HomePage`, `RecipesPage`, `SuggestionsPage`,
`RecipeDetailRoute`, `CookModePage`, `FridgePage`, `GroceryPage`, `ListsPage`, `PlannerPage`,
`NotificationsPage`, `FavorisPage`, `HistoryPage`, `ProfilePage`, `ScanRoute`, `WelcomeFlow`,
`OnboardingFlow`, `AuthRoute`. Assemblage + états d'écran (chargement, erreur, vide, hors ligne)

- routage web uniquement ici.

**Couche 4 — logique** : `src/core` (règles d'affichage du matching : niveau/raison/action, pures
et testées) · `src/application` (stores : état partagé des filtres T5, stores existants) ·
`src/infrastructure` (adaptateurs) · `src/app/container.ts` (composition, unique).

**Garde-fous anti-extrêmes** : un composant est extrait en couche 1–2 quand **D4 le réutilise entre
écrans** ou quand un second écran en a besoin ; à usage unique, il reste local à l'écran. Aucun
composant paramétrable par une pile de booléens ; aucune logique métier dans le JSX ; état local
d'interface autorisé (sélections, ouvertures), état métier jamais.

**Implémentation progressive** : 2.6.1 (shell) et 2.6.2 posent les premières couches 1–2
nécessaires aux écrans suivants ; la bibliothèque s'enrichit à chaque lot avec ses tests ; le
registre D4 (59) sert de carte de couverture (`composants-cms.html` reste la référence des props).

---

## 4. Adaptations mobile — triées selon votre instruction

**A. Corrections nécessaires dès maintenant** (problèmes identifiés, valeur réelle immédiate) :

- **T1** — injecter le cycle de vie dans `KitchenSync` (le couplage `window`/`document` trouvé
  dans `src/application` est un défaut réel de frontière, pas une anticipation théorique) ;
- **T2** — étendre la garde d'architecture à `src/application` (le garde existe pour le cœur ;
  l'étendre referme la porte que T1 a montrée ouverte). Infrastructure exemptée, conformément à
  votre instruction ;
- **T4** — écrire la règle « pas de dépendance directe aux SDK fournisseurs dans le domaine ou la
  logique métier ; SDK nécessaire → isolé derrière port + adaptateur remplaçable ».

**B. Utiles à la PWA **et** à l'évolution native (intégrées aux lots prévus, jamais un chantier
parallèle)** :

- **T3** — centraliser les contrats API (DTO, formats requête/réponse, erreurs, authentification,
  règles de compatibilité ; sans dépendances circulaires ; tests de contrat) — valeur immédiate
  pour la cohérence client/serveur ;
- **T5** — état des filtres en store (lot 2.6.4) ; **T6** — composants sans router (règle des
  lots 2.6.1/2.6.2) ; **T7** — port notifications (lot 2.6.8).

**C. Attendre le lancement réel du projet mobile** (porte explicite) : extraction en paquets (T9),
adaptateurs natifs (stockage sécurisé, SQLite/AsyncStorage), push (FCM/APNs), synchronisation en
arrière-plan, tests sur vrais appareils, expiration/renouvellement/révocation des jetons en
conditions natives. **Rien de tout cela n'est construit maintenant** ; le protocole de sync, HLC,
tombstones et curseurs restent inchangés et seront **réutilisés**, les comportements spécifiques
iOS/Android étant traités par des adaptateurs et testés sur appareils réels **à ce moment-là**.

---

## 5. Séquencement proposé

**Étape 0 — Ouverture (avant tout lot)** : `npm run check` exécuté et documenté · état Git tranché
(maquettes d3/d4/zips + documents d'audit : commit volontaire ou exclusion explicite) · rapport
d'ouverture code/testé/déployé. _Dépendance : rien. Durée : une séance._

**Rail client** (chaque lot : dossier de réalisation → votre validation → réalisation → rapport →
validation ; `npm run check` vert ; non-régression écran par écran ; 4 langues + RTL ;
320/375/768/1280 ; cibles ≥ 44 px ; textes i18n ; zéro dépendance payante) :

| Ordre | Lot                                    | Contenu                                                                                                                     | Dépend de                     | Critères d'acceptation principaux                                                                |
| ----- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| 1     | **2.6.0 Socle (réduit)**               | T1 + T2 + T4 ; T3 si D15 ✅ (sinon intégré à 2.6.1)                                                                         | étape 0                       | garde étendue au vert ; KitchenSync sans `window` ; contrats centralisés + tests de contrat HTTP |
| 2     | **2.6.1 Identité & shell**             | direction C 🚩 D3, en-tête cloche/avatar, barre basse (« Semaine » 🚩 D11), barre haute desktop, bandeaux                   | 2.6.0 + D3                    | contrastes 58/58 ; RTL 4 langues ; aucune régression A/fkhar                                     |
| 3     | **2.6.2 Composants communs**           | couches 1–2 des composants consommés par les écrans ; règles d'affichage matching en core (wording 🚩 D1)                   | 2.6.1                         | tests par composant ; badges/raisons conformes § 1.1                                             |
| 4     | **2.6.4 Catalogue & suggestions**      | R1/R2/R3, F1/F2/F3, 3 niveaux avec raison, onglet Favoris 🚩 D4, bornes = constantes (D2)                                   | 2.6.2                         | scénarios d'affichage portés en tests Vitest ; totaux justes ; filtres gardés entre écrans       |
| 5     | **2.6.5 Fiche recette & mode cuisine** | fiche `?id=`, substitution acceptée/refusée (affichage), mode cuisine, minuteur, reprise                                    | 2.6.2                         | minuteur réel ; sortie neutre ; hors ligne                                                       |
| 6     | **2.6.3 Accueil C**                    | composition C + 6 états ; conteneurs pub repliés 🚩 D12                                                                     | 2.6.2                         | états testés ; zéro CLS ; accueil actuel en repli pendant le lot                                 |
| 7     | **2.6.6 Frigo & courses**              | frigo amélioré (sans migration du modèle), courses, mes listes 🚩 D5                                                        | 2.6.2                         | retrait annulable testé ; sync non régressée                                                     |
| 8     | **2.6.7 Planning**                     | bande P1 + résumé calculé ; outils P3 si 🚩 D6 ✅                                                                           | 2.6.2                         | résumé = source unique ; liste reliée à courses                                                  |
| 9     | **2.6.8 Secondaires & comptes**        | notifications 🚩 D7 (port T7), favoris, historique, profil/invité/connexion 🚩 D8, bienvenue/onboarding 🚩 D9, scan complet | 2.6.2 ; règles Firestore (R7) | états vides/erreurs/hors ligne ; permission jamais à l'ouverture                                 |

**Rails parallèles (inchangés)** : 5a dès la fourniture des cas métier 🚩 · 2.7 dette · 4.1 noyau
de règles · puis 1.5 → 6a → 6b → 6c (séquence validée — aucune évolution du modèle frigo ni du
moteur avant ces portes). Les arbitrages D1–D16 bloquent seulement leur lot, pas le rail entier.

---

## 6. Décisions à arbitrer — recommandations techniques vs décisions

**Légende** : [RT] = recommandation technique (je l'applique si vous ne vous y opposez pas, dans
le lot prévu) · [DA] = décision de l'chef requise avant le lot concerné (rien ne bouge sans accord).

| #                                   | Décision                                                                                                                                                             | Recommandation                                                                                                                    | Nature                                                                       | Conséquence d'un refus                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **D1**                              | Wording honnête du niveau supérieur : base « Tous les ingrédients semblent présents — quantités à vérifier » ; variantes courtes proposées au dossier du lot         | [DA] — wording produit                                                                                                            | CTA = « Voir la recette » (jamais « Passer en mode cuisine » comme garantie) | Proposer d'autres formulations avant 2.6.2                    |
| **D2**                              | Bornes des niveaux                                                                                                                                                   | Constantes configurables, valeurs = bornes actuelles ; décision finale avec le corpus 5a                                          | [DA] aujourd'hui pour les constantes ; arbitrage final en 5c                 | On garde strictement les bornes du moteur actuel              |
| **D3**                              | Direction C « Zitouna » dans AppTheme (A/fkhar conservés)                                                                                                            | C par défaut des maquettes                                                                                                        | [DA] (D-04)                                                                  | Direction A conservée, shell quand même livrable              |
| **D4**                              | Favoris : 3ᵉ onglet Recettes ; ♥ ≠ ⤓ ; pas de 3ᵉ notion                                                                                                              | Suivre D-06/D-07                                                                                                                  | [DA]                                                                         | Favoris restent accessibles par le filtre actuel              |
| **D5**                              | Séparer « faire ses courses » / « gérer les listes »                                                                                                                 | Suivre D-08                                                                                                                       | [DA]                                                                         | Écran unique actuel conservé                                  |
| **D6**                              | Outils planning P3 comme règles métier (D-29)                                                                                                                        | Implémenter P1 seul si non confirmé                                                                                               | [DA]                                                                         | P1 seul livré en 2.6.7                                        |
| **D7**                              | Périmètre notifications                                                                                                                                              | Rappels cuisson + « ce soir » + nouveautés ; opt-in tardif ; **aucune collection nouvelle** (source locale ; push futur via port) | [DA]                                                                         | Réduire aux rappels de cuisson seulement                      |
| **D8**                              | Invité/profil/connexion (D-23/D-26)                                                                                                                                  | Appliquer D4                                                                                                                      | [DA]                                                                         | Modale compte actuelle conservée                              |
| **D9**                              | Bienvenue/onboarding hors routes publiques (SEO)                                                                                                                     | Flux plein-écran, jamais dans `SCREENS`                                                                                           | [RT]                                                                         | Routes non indexées si vous préférez des adresses             |
| **D10**                             | Marque dans l'app + CLAUDE.md → « Chnawa Ntayeb / by chef Souhed »                                                                                                   | Lot court dédié                                                                                                                   | [DA] (D-05)                                                                  | Statu quo (incohérence maquettes/app persistante)             |
| **D11**                             | Libellé « Semaine »                                                                                                                                                  | Suivre D-11                                                                                                                       | [RT]                                                                         | « Menu Semaine » sur 2 lignes conservé                        |
| **D12**                             | Emplacements pub : conteneurs dès 2.6.x, toujours repliés ; pas de pub entre niveaux de suggestions ; retirer grocery_footer_1 (D-10)                                | Appliquer D-10                                                                                                                    | [DA]                                                                         | Conteneurs quand même repliés ; placement à revoir en 10.x    |
| **D13**                             | Seuils de perf de la couche données (sur baseline 1.4)                                                                                                               | Fixer des seuils d'alerte mesurés                                                                                                 | [DA]                                                                         | Sans seuils, le benchmark de fumée garde sa garde anti-dérive |
| **D14**                             | Valider le principe de la section Budget (B1–B6)                                                                                                                     | Principe oui ; exécution après 6a                                                                                                 | [DA]                                                                         | Backlog ⏳ inchangé                                           |
| **D15**                             | Contrats API centralisés (T3) dans 2.6.0                                                                                                                             | Oui                                                                                                                               | [DA] (léger)                                                                 | T3 déplacé dans 2.6.1                                         |
| **D16**                             | Politique de versionnement API (compatibilité ascendante, capacités, dépréciation, support ; `/v1` seulement à la première rupture, **avant la publication native**) | Rédiger la politique (1 page)                                                                                                     | [RT]                                                                         | À trancher avant publication native dans tous les cas         |
| **M4**                              | Technologie mobile                                                                                                                                                   | RN/Expo = hypothèse de travail ; décision par étude de faisabilité à la porte mobile                                              | [DA] différée                                                                | Aucun code mobile avant                                       |
| **M5/T9**                           | Extraction en paquets                                                                                                                                                | Attendre la porte mobile                                                                                                          | ✅ confirmé                                                                  | —                                                             |
| **M1/T4**                           | Règle SDK fournisseurs (isolés derrière port, pas d'interdiction absolue)                                                                                            | Adopter la formulation du chef                                                                                                    | [DA] légère                                                                  | Règle restera implicite (risque de dérive)                    |
| **A17→D7, A18→D9, A19→D3, A21→D12** | (fusionnés ci-dessus)                                                                                                                                                | —                                                                                                                                 | —                                                                            | —                                                             |

**Non-décisions** : la stratégie SQLite/Firestore (§ 1.2), la séquence 1.5→6a→6b→6c, le backlog
différé (§ 2.4 ⏳) et la convention « quantités jamais obligatoires » sont **confirmés et
présumés acquis** — je ne les rouvre pas.

---

## 7. Exigences de qualité permanentes (rappel consolidé)

Avant chaque lot : `npm run check` vert et documenté · état Git propre · tests de non-régression
(frigo, sync, matching, recherche, listes, atelier) · parcours vérifiés mobile/tablette/desktop ·
4 langues + RTL · accessibilité et cibles tactiles · mesures de performance reproductibles quand
l'impact le justifie (budgets § 13 du plan) · aucune dépendance payante nouvelle · distinction
établie entre présent dans le code / couvert par les tests / déployé en production (rapport
d'ouverture puis mini-rapports de lot).

---

## 8. Arbitrages reçus (valident la § 6)

Décisions du chef — font foi devant les statuts [DA] de la § 6 :

- **Confirmés définitivement** : stratégie SQLite/Firestore (ne pas rouvrir) ; principe « présence ≠ quantité suffisante », wording de base « Tous les ingrédients semblent présents — quantités à vérifier », CTA « Voir la recette », logique centralisée dans `src/core` sans toucher au modèle de stock ; **bornes actuelles du moteur maintenues** (D2 : les seuils D4 ne sont pas des règles métier, réévaluation seulement avec le corpus 5a) ; architecture frontend en 4 couches ; orientations mobile (cycle de vie injecté, garde étendue à `src/application`, pas de SDK fournisseur direct dans le domaine/logique métier, SDK isolés derrière ports/adaptateurs remplaçables, monolithe modulaire, pas de natif ni d'extraction maintenant) ; T4 adopté (isolation derrière ports) ; M4 = hypothèse de travail, pas un choix ; T9 différé.
- **Produit** : D4 favorable (favoris ≠ hors ligne, cœur du parcours à définir au dossier) ; D5 validé (courses ≠ gestion des listes) ; D7 périmètre minimal non intrusif, pas de push prématuré ; D8 parcours invité et connecté conservés, différences présentées au dossier ; D9 favorable sans dégrader le SEO ; **D10 exactement « Chnawa Ntayeb » et « by chef Souhed »** ; D11 « Semaine » validé ; D12 emplacements préparés mais **toujours repliés, aucune publicité visible** ; D13 seuils à partir de mesures réelles reproductibles ; D14 en feuille de route, périmètre arbitré avant réalisation ; D15 favorable avec conditions (pas de dépendances circulaires, tests de contrat) ; D16 politique légère avant publication native, pas de versionnement prématuré.
- **À valider encore** : D3 (direction C « Zitouna » : validation **visuelle** requise avant de modifier l'identité — D4 reste la référence UX/UI) ; D6 (outils P3 : dossier fonctionnel détaillé obligatoire avant intégration, P1 prioritaire) ; le cœur exact du parcours Favoris (D4) et les différences invité/connecté (D8) seront présentés dans leurs dossiers de lot.
- **Composants partagés** : contrat obligatoire (rôle, props typées, états et comportements, accessibilité, langues/RTL, tests, dépendances maîtrisées) ; un composant à usage unique peut rester local ; ni duplication ni abstraction excessive.
- **Séparation moteur/présentation** : résultats du moteur, interprétation métier et présentation = trois responsabilités distinctes ; les constantes d'affichage ne modifient jamais indirectement le moteur.
- **Traçabilité** : cette matrice reste une référence vivante — toute fonctionnalité discutée y est ajoutée avec état, lot et dépendances ; une fonctionnalité différée reste dans la feuille de route.

## 9. Prochaine étape

1. Vous tranchez les décisions [DA] restantes (D3, D4 cœur de parcours, D8 différences — D1, D5, D7, D11, D12, D15 sont tranchés) ;
2. J'exécute l'étape 0 (check documenté, état Git) puis je rédige le **dossier de réalisation du
   premier lot retenu** — approche, périmètre/fichiers, impacts et non-régression, livrables,
   critères — **pour validation avant tout code** ;
3. Puis lot par lot : implémenter, tester, mesurer, corriger, documenter, avancer.
