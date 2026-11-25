# Annexe à l'audit de préparation à l'implémentation — Périmètre complet & architecture frontend

**Objet** : compléter `audit-preparation-implementation.md` avec (1) l'inventaire consolidé de
**tout** le périmètre fonctionnel défini par le projet (V12 `15-catalogue-organise.md`, plan de
réalisation `17-plan-de-realisation.md`, architecture CMS `18-cms-experiences.md`, paquet de
conception `mockups/d4`), (2) la matrice de traçabilité besoins → décisions → code → lots,
(3) l'architecture frontend par composants réutilisables, (4) la confirmation que le backlog
reporté reste dans la feuille de route, (5) les contradictions et décisions à arbitrer.
**Aucun développement, aucune modification de fichier ou de décision existante.**

---

## 1. Inventaire consolidé du périmètre fonctionnel

Constat de cadrage : le lot de conception D4 (référence UX/UI du **client**) ne couvre qu'une
partie du produit prévu. Les fonctionnalités suivantes, discutées et validées ailleurs, restent
intégralement d'actualité et ont chacune une phase/lot dans le plan de réalisation :

**Familles de besoins** (sources : V12 § 1/6–24, plan § 5–17 + amendement CMS, D4 registre
D-01…D-33, section Budget § 24 du plan) :

1. **Catalogue & éditeurs** : hiérarchie de variantes d'ingrédients (décision différée 5b.1),
   politiques de précision, lignes de recette avec identité propre et lien aux étapes, tags
   éditoriaux, fusion de doublons avec aperçu et opération inverse, règles obsolètes signalées,
   éditeur de recette renforcé, gestion administrative du frigo, gestion des prix (unité de
   référence, fraîcheur, mise à jour groupée) — lots 5b, 6a.4, B3/B4.
2. **Moteur de matching** : frigo à entrées souples (quantités facultatives, réservations
   exclusives, DLC/DDM, stock permanent), compatibilités explicites, substitutions à priorité
   déterministe avec exceptions et héritage désactivable, conversions exacte/approximative/
   impossible, allocation des stocks sans double consommation, 6 niveaux par ligne, 6 verdicts +
   « sous réserve », portions réduites, explicabilité ligne par ligne, corpus + double exécution
   - laboratoire — lots 5a, 5b.3, 5c, 6a.1, 6b, 6c.
3. **Client (app publique)** : tout ce que couvre le rail 2.6.x (accueil C + états, catalogue
   R1/R2/R3 + F1/F2/F3, fiche recette, mode cuisine, frigo, courses, planning, comptes/invité,
   notifications, favoris, historique, scan, bienvenue/onboarding) + expérience multilingue/RTL/
   thèmes + PWA (déjà là) + scan photo amélioré.
4. **Back-office** : fondations D3 (shell, navigation, recherche globale, tableaux à actions
   groupées, tableau de bord à widgets, prévisualisation publique), RBAC complet (groupes & rôles,
   anti-élévation, dernier super admin), localisation, dette — lots 2.2, 2.5, 2.7, 2.8, 3.1–3.5, 4.4.
5. **Plateforme** : noyau de règles, fonctionnalités (interrupteur + rollout + kill switch),
   cycle de vie des configurations + échine Staged/Online, entitlements-dons, migration de
   l'atelier vers l'échine — lots 4.1–4.6.
6. **CMS & expériences** (18) : échine de publication, résolveur d'expérience, registre de
   composants, pages, médias, thèmes visuels/éditoriaux, expériences, groupes mutualisés,
   segments, messages, canaux — conception intégrée aux lots 2.2/2.3/2.4, implémentation 4.3/4.6/7.3/7.4.
7. **Classification, organisation éditoriale, présentation** : axes, tags, `RecipeSelection`,
   groupes éditoriaux, collections, campagnes, sections d'affichage, éditeur de home,
   prévisualisation complète — lots 7.1–7.5.
8. **Recommandations, analytics, publicité** : dédoublonnage, mixage recherche/matching/
   recommandation, événements fermés + consentement + agrégats, décision publicitaire serveur +
   `no_ads` prioritaire + régie interne sans SDK — lots 8.1–8.2, 9.1–9.4, 10.1–10.5.
9. **Budget** : core Budget pur, coût dérivé, filtres et rubriques budgétaires, gestion
   back-office des prix, « rapport qualité/prix » facultatif — lots B1–B6 (section § 24 du plan,
   **proposée et non validée** — voir arbitrage A15).
10. **Commerce, abonnements, restaurants** : frontières seulement — lots 11–13 conditionnels.
11. **Volontairement non implémenté (V12 § 29)** : réservations automatiques menu ↔ frigo,
    allocation globale du stock entre plusieurs recettes planifiées, péremption par photo,
    apprentissage automatique, IA décisionnaire, commerce anticipé — **backlog assumé, jamais abandonné**.

### Vérification « chaque besoin a son lot » ✅

Chaque famille ci-dessus renvoie à un lot du plan § 23 (table de référence unique). Les seuls
besoins nouveaux issus de D4 qui n'existaient pas dans le plan sont traités dans le rail
2.6.x (notifications, mode cuisine, écrans comptes/invité, scan complet, deck/étals/mosaïque,
phrase de filtres) — ils reçoivent désormais leur lot explicite (§ 3 ci-dessous).

---

## 2. Matrice de traçabilité (besoin → décision → code → lot)

Légende code : ✓ terminé · ◐ partiel · ✗ absent. Lots « 2.6.x » = rail client proposé dans
l'audit ; les autres = lots du plan de réalisation inchangés.

### 2.1 Catalogue & éditeurs

| Besoin                                               | Décision / source           | Code                  | Lot                                      |
| ---------------------------------------------------- | --------------------------- | --------------------- | ---------------------------------------- |
| Collections suivies en incrémental, copie hors ligne | V12 § 4 ; convention CLAUDE | ✓                     | —                                        |
| Atelier → validation → publication                   | V12 § 3 ; convention CLAUDE | ✓                     | 4.6 (migration échine)                   |
| Catégories 2 arbres + type de plat fixe              | V12 ; D-24                  | ✓                     | — (contenu 16 catégories : D-24)         |
| Unités + registre + descriptions                     | V12 ; convention CLAUDE     | ✓                     | 5c.3 (conversions)                       |
| Prix en fourchette + coût recette                    | V12 ; § 24.1                | ✓                     | B1–B4 (enrichissement)                   |
| Tags éditoriaux + axes (vendredi, ramadan)           | V12 § 18                    | ✗                     | 7.1                                      |
| Lignes de recette avec id propre, précision, étapes  | V12 § 7.3                   | ◐ (sans id/precision) | 5b.2 → 6a.1/6a.4                         |
| Hiérarchie de variantes                              | V12 § 7.1 ; arbitrage n°1   | ✗                     | 5b.1 → 6a.1                              |
| Fusion de doublons + règles obsolètes                | V12 § 7.4                   | ✗                     | 5b/6a (avec éditeurs)                    |
| Sauvegarde JSON aller-retour                         | V12 § 3                     | ✓                     | — (extension aux nouveaux champs : 6a.4) |

### 2.2 Moteur de matching

| Besoin                                                                             | Décision / source     | Code                                               | Lot                                                                 |
| ---------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Pipeline v1 + config versionnée + boosts + scénarios + simulateur                  | V12 § 9               | ✓                                                  | —                                                                   |
| Frigo à entrées souples (quantités facultatives, DLC/DDM, réservations, permanent) | V12 § 8 (arbitrés)    | ✗ (ids seuls)                                      | 5b.2/5b.3 → 6b.7a/6b.7b                                             |
| Niveaux D4 affichés (prête/presque/à découvrir + raison + « à vérifier »)          | D4 (D-02, D-32, D-33) | ◐ (3 tiers sans raison)                            | **2.6.2/2.6.4** (règles d'affichage en `src/core`, arbitrage A1/A2) |
| Compatibilités explicites + substitutions priorité/exceptions/héritage             | V12 § 10 ; 5c.1/5c.2  | ◐ (substituts par recette)                         | 5c → 6b.3                                                           |
| Conversions exacte/approximative/impossible                                        | V12 § 11 ; 5c.3       | ✗                                                  | 5c.3 → 6b.2                                                         |
| Allocation des stocks (double consommation, stock partagé)                         | V12 § 12              | ✗                                                  | 6b.1/6b.4                                                           |
| 6 verdicts + « sous réserve » + portions réduites                                  | V12 § 12 ; 5c.5       | ✗                                                  | 5c.5 → 6b.5                                                         |
| Explicabilité (piste par ligne)                                                    | V12 § 12              | ✗                                                  | 6b.4                                                                |
| Corpus + baseline + harnais                                                        | V12 § 16 ; 5a         | ◐ (`diagnose:matching`, `scenarios-initiaux.json`) | 5a.1–5a.3 (🚩 cas métier du chef)                                   |
| Laboratoire 3 vues + simulation + portes de publication                            | V12 § 14 ; 6b.8       | ✗                                                  | 6b.8                                                                |
| Scan photo : propose, l'utilisateur confirme                                       | V12 § 17 ; D4 scan    | ◐                                                  | 2.6.8 (écran) + 6b.7b (entrées)                                     |

### 2.3 Client (rail 2.6.x)

| Besoin                                                             | Décision / source             | Code                                 | Lot                                      |
| ------------------------------------------------------------------ | ----------------------------- | ------------------------------------ | ---------------------------------------- |
| Accueil composition C + 6 états                                    | D-01 ✅ (chef)                | ✗                                    | 2.6.3                                    |
| Catalogue R1/R2/R3 + F1/F2/F3                                      | D-28 ✅ (chef)                | ◐ (filtres URL, sans R1/R2/R3/F1/F2) | 2.6.4                                    |
| Fiche recette (4 infos, 3 états, substitution, portions)           | D4 ; E-05                     | ◐                                    | 2.6.5                                    |
| Mode cuisine                                                       | D4 ; § 21 règle 7             | ✗                                    | 2.6.5                                    |
| Frigo amélioré (annuler, épuisé*, recherche, 64+)                  | D-27 ; E-01/02/03             | ◐                                    | 2.6.6 (*épuisé réel : 6b.7b)             |
| Courses : « dans le panier », mes listes séparé                    | D-08 ; E-08                   | ◐                                    | 2.6.6                                    |
| Planning P1 bande de jours + résumé calculé                        | D-28 ✅                       | ◐ (table actuelle)                   | 2.6.7                                    |
| Outils planning P3 (Ramadan, double, WhatsApp…)                    | D-29 🚩                       | ✗                                    | 2.6.7 (si A9 validé)                     |
| Notifications (cloche, centre, préférences)                        | D-20 ✅ (desktop) ; mobile 🚩 | ✗                                    | 2.6.8 + arbitrage A11                    |
| Favoris 3ᵉ onglet + ♥/⤓                                            | D-06/D-07 🚩                  | ◐ (données + filtre)                 | 2.6.8                                    |
| Historique consultations (UI)                                      | D4                            | ✗ (données serveur ✓)                | 2.6.8                                    |
| Profil / invité / connexion                                        | D-23 ✅, D-26 🚩              | ◐ (modale compte)                    | 2.6.8                                    |
| Bienvenue + onboarding                                             | D4 parcours 1                 | ✗                                    | 2.6.8                                    |
| Scan complet (6 états, erreurs, hors ligne)                        | D4 ; M-04                     | ◐                                    | 2.6.8                                    |
| Identité C « Zitouna » + shell cloche/avatar + barre haute desktop | D-04 🚩, D-20/D-22/D-23 ✅    | ✗/◐                                  | 2.6.1                                    |
| Composants communs (rail, badges+raison, cartes ×4…)               | D-30 ✅                       | ✗                                    | 2.6.2                                    |
| Emplacements pub (toujours repliés avant 10.x)                     | D-10 🚩 ; 10.4                | ✗                                    | 2.6.3–2.6.5 (conteneurs), 10.x (contenu) |

### 2.4 Back-office, plateforme, CMS

| Besoin                                                                        | Décision / source                  | Code                                                        | Lot                                     |
| ----------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| Fondations D3 (shell, recherche globale, tableaux, widgets, prévisualisation) | V12 § 5 ; plan § 6                 | ✗ (back-office actuel fonctionnel mais sans ces fondations) | 2.2 (conception) → 2.8 (implémentation) |
| RBAC complet (groupes & rôles, anti-élévation, dernier super admin)           | V12 § 5 ; 18 § 3.2 ; amendement 18 | ◐ (can_publish/can_manage)                                  | 2.3 (conception) → 3.1–3.5              |
| Noyau de règles + fonctionnalités + entitlements                              | V12 § 21                           | ✗                                                           | 4.1, 4.2, 4.5                           |
| Cycle de vie config + échine Staged/Online + audit                            | V12 § 21 ; 18 § 4                  | ◐ (historiques par domaine)                                 | 4.3 → 4.6                               |
| CMS (pages, médias, expériences, groupes, segments, messages)                 | 18 (clôturée)                      | ✗                                                           | 7.3/7.4 (+ conception 2.2/2.3/2.4)      |
| Dette technique                                                               | plan 2.7                           | —                                                           | 2.7                                     |

### 2.5 Organisation, recommandations, analytics, pub, budget, commerce

| Besoin                                                | Décision / source | Code                     | Lot                            |
| ----------------------------------------------------- | ----------------- | ------------------------ | ------------------------------ |
| Sélections + groupes éditoriaux + collections         | V12 § 19          | ✗                        | 7.2/7.3                        |
| Campagnes + sections + éditeur de home                | V12 § 20          | ✗                        | 7.4/7.5                        |
| Recommandations + mixage recherche                    | V12 § 25          | ✗                        | 8.1/8.2                        |
| Analytics (événements fermés, consentement, agrégats) | V12 § 22          | ✗                        | 9.1–9.4                        |
| Publicité (décision serveur, no_ads, régie interne)   | V12 § 23          | ✗                        | 10.1–10.5                      |
| Budget (coût, filtres, rubriques, back-office prix)   | § 24 du plan      | ◐ (socle fourchettes)    | B1–B6 🚩 (section non validée) |
| Commerce / abonnements / restaurants                  | V12 § 24          | ✗ (frontières seulement) | 11–13 conditionnels            |

---

## 3. Architecture frontend par composants réutilisables

### 3.1 Principes (exigence du chef + conventions existantes)

1. **La logique métier ne vit jamais dans un composant** : les règles d'affichage du matching
   (`displayLevel`, `ctaKind`, construction de la « raison », wording des états) sont des
   fonctions pures de `src/core/matching` (avec leurs tests) ; les composants reçoivent des
   **données déjà calculées** ou des stores applicatifs.
2. **Une page = un assemblage** de composants, sans logique métier — la page D4 (`schema de
blocs`) devient un composant React par bloc ; le schéma reste la spécification de la page.
3. **Props typées, responsabilité unique, comportements cohérents** : chaque composant a un
   fichier, des props TS documentées, un test (rendu + comportement clavier/états), des
   propriétés logiques RTL, des textes par clés i18n — jamais en dur.
4. **La réutilisation se prouve** : un composant est extrait quand D4 le réutilise entre écrans
   (carte de recette, rail, étal, badges) ou quand un second écran en a besoin — jamais de
   découpage artificiel, jamais de « super-composant » paramétrable par 15 booléens.
5. **Inventaire D4 = référence, pas plan de charge immédiat** : les 59 composants sont l'inventaire
   ; l'ordre d'implémentation suit les écrans du rail 2.6.x ; les composants non consommés par un
   écran attendent leur écran (ou le CMS pour les blocs éditoriaux).

### 3.2 Quatre couches (cohérentes avec l'hexagonale existante)

| Couche                     | Emplacement                          | Contenu (issu de D4)                                                                                                                                                                                                                                                                  | Règle                                                                                      |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **1. UI générique**        | `src/shared/ui/`                     | rail (carrousel), chips + chips actives, onglets, page-heading, bandeaux (install ✓, hors ligne ✓, erreur), feuilles/modales (ModalShell ✓), match-badge, drapeaux (♥/⤓), skeletons, états vides, note de conception (dev-only), boutons d'icône                                      | zéro connaissance du métier ; aucune dépendance au catalogue                               |
| **2. Métier réutilisable** | `src/features/<domaine>/components/` | recipe-card (4 variantes), category-rail, shelf, fridge-peek, grocery-progress, favorites-strip, filter-sentence, ingredient-filter, quick-filters, active-filters, recipe-views (R1/R2/R3), level-section, recipe-rail, notif-center, lists-manager, history-list, recipe-collection | connaît le domaine par ses **types** (`@/core/...`) uniquement ; réutilisable entre écrans |
| **3. Écran**               | `src/features/<écran>/`              | HomePage, RecipesPage, SuggestionsPage, RecipeDetailRoute, CookModePage, FridgePage, GroceryPage, PlannerPage, NotificationsPage, FavorisPage…                                                                                                                                        | assemblage + routage + états d'écran ; aucune règle métier                                 |
| **4. État & logique**      | `src/core` + `src/application`       | règles d'affichage matching (`displayLevel`, `ctaKind`, `reasonFor`) avec tests ; store des filtres partagés (équivalent `CN.filters` — un store applicatif écrit par F1/F2/F3 et lu par les vues) ; stores existants (Catalog, Kitchen…)                                             | test d'architecture maintenu : le cœur ne dépend ni de React ni du stockage                |

### 3.3 Mapping des 59 composants D4 → couches cibles

| Famille D4            | Composants                                                                                                                                                                                | Couche cible                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| common (10)           | page-heading, link-tabs, note, offline-strip, install-banner, guest-card, ad-slot, link-button, tabs, recipe-rail                                                                         | 1 (générique) — recipe-rail en 2 (compose recipe-card)                                                                                     |
| home (6)              | home-greeting, home-hero, fridge-peek, grocery-progress, favorites-strip, warm-band                                                                                                       | 2 (features/home) — assemblés par HomePage (3)                                                                                             |
| recipe (11)           | level-section, how-ranked, recipe-hero, recipe-facts, recipe-status, recipe-actions, recipe-ingredients, recipe-steps, recipe-cta, scenario-tests, cook-mode                              | 2 (features/recipes, features/cooking) — scenario-tests reste un outil d'audit (test Vitest de référence, pas un écran produit)            |
| fridge (2)            | fridge-add, fridge-inventory                                                                                                                                                              | 2 (features/fridge)                                                                                                                        |
| flows (4)             | scan-flow, welcome-flow, fridge-onboarding, auth-form                                                                                                                                     | 2 (features/account, features/fridge)                                                                                                      |
| account (12)          | grocery-list, grocery-add, lists-manager, recipe-collection, history-list, notif-center, profile-header, profile-stats, profile-menu, profile-settings, food-prefs, account-actions       | 2 (features/grocery, features/account)                                                                                                     |
| composants.js (14)    | recipe-card, section-head, category-rail, shelf, recipe-views, panel, search-box, filter-sentence, ingredient-filter, quick-filters, active-filters, week-strip, plan-tools, plan-summary | recipe-card/section-head/category-rail/shelf → 1–2 ; recipe-views/filters → 2 (recipes) ; week-strip/plan-tools/plan-summary → 2 (planner) |
| shell (hors registre) | en-tête, barre basse, barre haute desktop, panneau notifications, panneau profil                                                                                                          | `src/app/layout/` (existant, étendu en 2.6.1)                                                                                              |

### 3.4 Et après le rail client

Le registre D4 (clé → schéma typé + validateur) préfigure le **registre de composants du CMS**
(18 § 2) : à l'arrivée du CMS (7.3/7.4), les mêmes composants deviennent les briques rendues par
les pages enregistrées — la forme « page = liste ordonnée de blocs typés » est conservée dès
maintenant (chaque écran 2.6.x est écrit comme un assemblage documenté), sans construire
l'infrastructure CMS avant sa porte.

---

## 4. Fonctionnalités reportées : confirmation de maintien dans la feuille de route

**Rien n'est abandonné.** Conformément au plan § 23 (table de référence unique) et à la V12 § 29 :

- **Reportés avec séquence validée** : 1.5 (répétition générale, après 5b + mapping 6a) et 1.6
  (nettoyage post-bascule) — obligatoires, jamais supprimés.
- **Restent programmés** : 2.2/2.5/2.8 (fondations back-office), 2.7 (dette), 3.1–3.5 (RBAC),
  4.1–4.6 (plateforme + échine), 5a/5b/5c (corpus, modèles, règles), 6a/6b/6c (migration SQL,
  moteur, bascule), 7.1–7.5 (classification, éditorial, CMS, campagnes), 8.x (recommandations),
  9.x (analytics), 10.x (publicité).
- **Conditionnels (porte explicite requise)** : B1–B6 (budget — section non validée 🚩),
  11–13 (commerce, abonnements, restaurants).
- **Volontairement non implémenté (backlog assumé, V12 § 29)** : réservations automatiques
  menu ↔ frigo, allocation globale du stock en planification, détection de péremption par photo,
  apprentissage automatique, IA décisionnaire, commerce anticipé, extraction de services.

Les lots 2.6.x **ne modifient ni cette feuille de route ni ces dépendances** ; ils occupent le
rail front-end client laissé libre par la validation des maquettes D4 (D1/D2 couvertes).

---

## 5. Contradictions identifiées entre anciennes décisions et plan actuel

| #   | Contradiction                                                                                                                                                | Statut                                                         | Résolution proposée                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | V12 § 4 (« SQL hybride, JSON pour étapes/ingrédients ») **vs** décision validée 6a + 18 § 1.4 (« jamais de JSON en colonnes, transformation relationnelle ») | La décision 6a, plus récente et validée, **supplante** V12 § 4 | Marquer V12 § 4 comme supplanté lors de la prochaine mise à jour documentaire (fin de release, à votre demande) — aucun impact de code         |
| C2  | Le plan § 3 nomme « D4 » le paquet **Laboratoire**, alors que « D4 » désigne désormais le paquet de maquettes client                                         | Risque de confusion dans les dossiers                          | Renommer la référence du paquet de maquettes (ex. « paquet de conception client MD4 ») ou renuméroter les paquets du plan § 3 — 🚩 choix (A16) |
| C3  | CLAUDE.md « icône d'en-tête = roue dentée » **vs** D-23 validé (avatar remplace la roue)                                                                     | Tracé dans D-23                                                | Modification de la convention à l'implémentation (2.6.8), avec l'alignement de marque A13                                                      |
| C4  | Registre D3 « suggestions avant nouveautés / accueil A vs B 🚩 » **vs** D-01 validé (composition C)                                                          | Périmé mais non marqué dans registre.html                      | Nettoyage du registre (marquer les entrées supplantées, comme la ligne D-05) — autorisation demandée                                           |
| C5  | Bornes du moteur actuel (almost ≤ 2, idées = liées) **vs** niveaux D4 (1–3 / 4+ ; « à découvrir »)                                                           | Arbitrage ouvert (A1/A2)                                       | Règles d'affichage dans `src/core` sur décision A1/A2 — le moteur 6b reste la cible sémantique complète (V12 § 12)                             |
| C6  | Conventions CLAUDE « favoris via Réglages » **vs** D-06 (3ᵉ onglet Recettes)                                                                                 | Tracé                                                          | Alignement à l'implémentation (2.6.8) si A6 confirmé                                                                                           |

---

## 6. Décisions supplémentaires à arbitrer (complément aux A1–A14 de l'audit)

| #       | Décision                                                    | Options et recommandation                                                                                                                                                                                                                                                                                                     |
| ------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A15** | Valider la section § 24 (Budget) du plan (lots B1–B6)       | Recommandé : valider le **principe** (le socle fourchettes existe déjà) ; B3 dépend de toute façon de 6a — la validation peut être « principe oui, exécution après 6a »                                                                                                                                                       |
| **A16** | Nom du paquet de maquettes (C2)                             | Recommandé : référencer les maquettes comme « paquet de conception client » dans le plan § 3 et garder D4 pour le laboratoire — évite de renommer tous les dossiers                                                                                                                                                           |
| **A17** | Notifications : source des données                          | Recommandé : **aucune collection nouvelle** — rappels de cuisson et « ce soir : à acheter » générés localement par l'app ; « nouveautés du chef » alimentera plus tard le flux depuis l'échine (4.3/7.3) ; permission système opt-in tardif. Alternative (à éviter maintenant) : collection `notifications` serveur dès 2.6.8 |
| **A18** | Bienvenue / onboarding : adresses publiques ou flux intégré | Recommandé : **pas de routes publiques indexables** — écrans plein-facet du client (jamais dans `SCREENS` du SEO), l'utilisateur revient sur l'accueil ; alternative : routes `/welcome` non indexées                                                                                                                         |
| **A19** | Étals : configuration initiale (A3)                         | Recommandé : étals frigo + ≤ 30 min + budget + type de plat (champs existants), en configuration code ; les étals à tags (vendredi, Ramadan) et leur gestion admin attendent 7.1/7.3                                                                                                                                          |
| **A20** | Priorité de démarrage du rail client                        | Recommandé : 2.6.1 → 2.6.2 → 2.6.4 (catalogue/suggestions, cœur du produit) → 2.6.5 (fiche + mode cuisine) → 2.6.3 (accueil) → 2.6.6 → 2.6.7 → 2.6.8. Alternative : l'ordre de l'audit (accueil d'abord) — l'accueil consommant les composants des autres écrans, l'ordre recommandé évite de le retoucher                    |
| **A21** | Emplacements pub avant 10.x                                 | Recommandé : les conteneurs `ad-slot` existent dès 2.6.x, **toujours repliés** (config désactivée) — aucun contenu publicitaire avant 10.3/10.4                                                                                                                                                                               |

---

## 7. Synthèse

Le périmètre complet est **tracé et couvert** : chaque besoin issu de la V12, du plan, du CMS et
de D4 possède un lot ; les reportés restent dans la feuille de route avec leurs portes ; deux
contradictions documentaires (C1, C2) et quatre conventions à aligner (C3–C6) sont identifiées
avec leur résolution. L'architecture frontend proposée reprend la décomposition D4 en quatre
couches sans sur-génération : la logique métier descend dans `src/core`, les composants
réutilisables vivent par domaine, les pages assemblent, le registre D4 sert d'inventaire et
prépare le registre du CMS. Aucun développement n'est lancé — les lots 2.6.x attendent vos
arbitrages A1–A21 puis le dossier de réalisation du premier lot retenu.
