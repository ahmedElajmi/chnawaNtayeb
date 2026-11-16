# 15 — Plan directeur et architecture plateforme (document unique, v12)

Le **document de référence unique** : vue globale de toutes les modifications prévues par
domaine **et** la profondeur technique (moteur de matching, modèles, règles). Le moteur
Frigo ↔ Recettes est le **cœur fonctionnel** et la valeur différenciatrice : intelligent,
fiable, performant, paramétrable, administrable par des employés non techniques. Ses cinq
exigences sont indissociables : pertinence, fiabilité, performance, paramétrage métier,
expérience d'administration. **La précision prime sur le volume de suggestions** — mieux
vaut 8 recettes réellement réalisables que 30 dont plusieurs reposent sur des
correspondances erronées. Objectif d'échelle : 50 000 recettes et des centaines de règles
sans que l'administration ni la performance ne s'effondrent. **Utilisable sans jamais
saisir une seule quantité** — la quantité est une information complémentaire
facultative : deux modes de fonctionnement, **simple** (présence seule) et **avancé**
(quantités quand elles sont connues) (§ 8, § 12).

**Contraintes directrices** : budget zéro — **aucune fonctionnalité essentielle ne
dépend d'un service externe payant** (si un service externe devient indisponible ou
payant, les fonctionnalités principales continuent, en dégradation gracieuse : le scan
photo tombe sur la saisie manuelle) ; tout le contenu est préservé ; **aucune
modification du code, des modèles ou de la base sans validation explicite**.

**Préserver sans reconstruire** : la nouvelle architecture conserve les fonctionnalités
disponibles — elle ne supprime rien pour simplifier et ne repart de zéro sans raison.
Restent pleinement légitimes : modifier les implémentations limitées, remplacer les
mécanismes dépassés, refactoriser pour la qualité et la maintenabilité, regrouper ce
qui est dispersé, supprimer les dépendances inutiles et les mécanismes redondants,
faire évoluer les modèles quand c'est nécessaire. La priorité : **conserver le
comportement fonctionnel attendu** tout en améliorant profondément la qualité de
l'implémentation. La qualité du code n'est pas une phase ponctuelle : c'est une
**exigence permanente** de toutes les phases (§ 31).

## PARTIE I — Vue d'ensemble

### 1. Synoptique des modifications par domaine

| #   | Domaine                            | État actuel (vérifié dans le code) | Modifications                                                                          | Phase |
| --- | ---------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| 1   | Recettes                           | Riche, validé par atelier          | Lignes identifiées, précision, tag_ids                                                 | 5b–6a |
| 2   | Ingrédients                        | Plat                               | Hiérarchie de variantes, précisions, conversions, fusions avec opération compensatoire | 5b–6a |
| 3   | Moteur de matching                 | Présence d'ids, sans quantités     | Reconstruit : frigo quantifié, allocation des stocks, niveaux, verdicts, explicabilité | 5a–6c |
| 4   | Classification                     | Arbre de catégories                | Axes, tags, migration `cuisine_type`                                                   | 6     |
| 5   | Organisation éditoriale            | Aucune                             | Groupes, collections, sélections, instantanés                                          | 6     |
| 6   | Présentation et campagnes          | Home codée                         | Sections, campagnes, prévisualisation                                                  | 7     |
| 7   | Back-office                        | Permissions limitées               | Refonte : identité, RBAC, widgets, diagrammes, laboratoire                             | 2–3   |
| 8   | Plateforme                         | Réglages moteur + thèmes           | Fonctionnalités, règles, entitlements-dons, audit                                      | 4     |
| 9   | Données                            | Firestore derrière `DataStore`     | Contrats par domaine, SQL hybride, migration                                           | 1     |
| 10  | Analytics                          | Aucune                             | Événements groupés, agrégats, minimisation                                             | 9     |
| 11  | Publicité                          | Aucune                             | Régie interne, décision serveur, entitlement prioritaire                               | 10    |
| 12  | Commerce, abonnements, restaurants | Aucune                             | **Frontières seulement** — rien de créé                                                | 11–13 |

### 2. Architecture cible : domaines et dépendances

Monolithe **modulaire** (la couche hexagonale actuelle) : quinze domaines aux frontières
explicites, un seul déploiement, extraction ultérieure possible par contrat.

```
Core Platform (règles, fonctionnalités, droits, localisation, audit)
   │
   ├── Identity & Access ─── Feature Management ─── Entitlements
   │
   ├── CATALOGUE CULINAIRE (le cœur actuel et futur)
   │     ├── Recipe Catalog
   │     ├── Ingredient Catalog (+ variantes, substitutions, unités)
   │     ├── Classification & Taxonomy
   │     ├── Content Organization (groupes, collections, campagnes, sections)
   │     ├── Selection Engine ──→ Recommendation Engine
   │     └── (sert de contexte à) → Advertising → Analytics
   │
   ├── COMMERCE ALIMENTAIRE (futur, frontières posées dès maintenant)
   │     ├── Product Commerce · Food Ordering · Partner Integrations
   │     └── Restaurants & plats préparés (Dish ≠ Recipe)
```

Dépendances assumées (les seules) : le Commerce **lit** le catalogue culinaire via ses
contrats et ne l'écrit jamais ; la Recommandation et la Publicité consomment du
**contexte**, jamais la structure interne d'un autre domaine ; l'Analytics est écrit par
tous, lu par le backoffice.

### 3. Inventaire de l'existant → domaine, et ce qui ne change PAS

| Fonctionnalité actuelle                                 | Domaine cible                   | Risque                                    |
| ------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| Recettes, atelier, validation, versions                 | Recipe Catalog                  | Faible                                    |
| Ingrédients, unités, prix min/max                       | Ingredient Catalog              | Moyen (variantes)                         |
| Catégories recettes / ingrédients                       | Classification                  | Faible                                    |
| Substitutions + réglages moteur                         | Ingredient Catalog / Selection  | Faible (modèle contextuel conservé)       |
| Frigo, kitchen sync                                     | Ingredient Catalog / Selection  | **Moyen** (entrées quantifiées)           |
| Listes de courses multiples, rayons, budget             | Ingredient Catalog (parcours A) | Faible — déjà sans dépendance commerciale |
| Recherche locale (MiniSearch)                           | Selection Engine                | Faible                                    |
| Comptes atomiques, équipe, rôles                        | Identity & Access               | Faible                                    |
| Thèmes, pays, PWA, sauvegarde JSON, SEO/SSR, scan photo | Core Platform / Interface       | Faible à nul                              |

**Préservations (aucune régression)** : atelier et validation cellule par cellule et
versions immuables ; publication de contenu validé seulement ; comptes (client /
employé / super admin, création atomique) ; frigo et hors-ligne ; recherche locale ;
listes de courses nommées et fusion par unité compatible ; rayons ; budget ; PWA et
installation ; thèmes ; sauvegarde / restauration JSON ; SEO serveur ; les 4 langues et
leur système ; coûts en fourchette ; accueil actuel en repli ; scan photo facultatif.

## PARTIE II — Fondations techniques

### 4. Indépendance du fournisseur de données

**État vérifié** : le client n'a **aucun** SDK Firebase (gardé par un test
d'architecture), sans Firebase Auth (comptes `users` + `auth`, sessions signées par le
serveur) ; registre serveur des collections avec niveaux d'accès (`public`/`admin`/
`server`) ; `DataStore` avec implémentation SQL (Knex : Postgres, MySQL, SQL Server,
SQLite) existante, non branchée ; restants à découper : `server/app.ts`,
`server/seo.ts`, `server/storage/identity.ts`, `server/firebaseAdmin.ts`, `deploy:rules`.

- **Contrats par domaine** (`RecipeRepository`, `IngredientRepository`,
  `UserRepository`, `EditorialRepository`, `AdRepository`, `AnalyticsRepository`…) :
  `search(criteria) → PaginatedResult` avec **curseur opaque**, `count(criteria)` pour
  les totaux justes, **contrat transactionnel** `runInTransaction` (`READ COMMITTED`,
  classe `conflict` distincte, rejoue ≤ 3 pour opérations pures, rollback total).
  Services applicatifs pour les opérations multi-repositories (la création atomique de
  compte se transpose telle quelle).
- **SQL hybride, défini entité par entité** : relationnel strict pour `users`, `admins`,
  `roles`, entitlements, taxonomies, relations, événements ; hybride pour recettes et
  ingrédients (colonnes typées pour statut, temps, coûts, noms localisés — JSON pour
  étapes/ingrédients relus par les parsers inchangés) ; JSON + colonnes de pilotage pour
  groupes/campagnes/sections ; **jamais « tout en JSON dans SQL »**.
- **Deux curseurs** : sync `(revision, id)` (départage par id, journal) et listes
  publiques `(clé_de_tri, id)` (ordre stable dans une page).
- **Tests au-delà de la parité fonctionnelle** : concurrence, contraintes, migrations de
  schéma, performance sur base de référence (100 000 recettes).
- **Migration en 7 étapes** : sauvegarde complète → validation volumes/relations →
  import test + comparaison → **test de restauration obligatoire** → bascule lecture
  puis écriture (Firestore maintenu en lecture seule) → retour arrière seuillé →
  clôture après une semaine d'exploitation comparée.
- **Séquençage anti-double-migration** : la phase 1 valide les **contrats, adaptateurs
  et mécanismes SQL** (tests de contrat sur SQLite et Postgres, transactions,
  curseurs, concurrence) et ne migre que les domaines **stables** (identité, comptes,
  audit) ; la **migration définitive des données métier** (recettes, ingrédients,
  frigo) n'est engagée **qu'une fois les modèles cibles stabilisés** (fin de 5b) et
  intervient en phase 6a, avec le changement de modèles — **éviter deux migrations
  successives des mêmes données**. Firestore reste la source de vérité jusqu'à la
  bascule de la phase 6a.

### 5. RBAC et back-office

**Limites actuelles vérifiées** : permissions limitées à `can_publish`/`can_manage`, pas
de RBAC par module × action, pas de tableau de bord réel, pas de recherche globale, pas
de tableaux avec actions groupées, identité visuelle = celle du site.

**Modèle de permissions** : actions `access, read, search, create, update, delete,
publish, export, manage` par **ressource**, périmètres `all` / `own` / `list`
(modélisés, activés à la demande). **Règles de résolution écrites et testées** : union
des rôles, **refus par défaut** (ressource ou action inconnue = refus), `manage` ⊃
autres actions sur la même ressource **sauf la ressource `roles`** (jamais déduite),
supprimer un contenu publié exige `delete` **et** `publish`, `export` exigé
explicitement, scope `own` = `updated_by` vérifié **par item côté serveur** (y compris
actions groupées), scope `list` relu à chaque contrôle, **anti-élévation** (on ne peut
accorder que ce qu'on détient), cache invalidé par `permissions_revision`, journal de
tout changement et refus. **Dernier super administrateur** : comptage et écriture dans
la même transaction, **avec un verrouillage ou contrôle transactionnel adapté** — une
simple transaction `READ COMMITTED` ne garantit pas seule l'invariant quand deux
administrateurs tentent simultanément de supprimer ou rétrograder les deux derniers
super administrateurs ; l'invariant est vérifié par un **test de concurrence réel** de
cette double opération.

**Interface** (maquettes validées comme prototypes de direction, qualité visuelle
finalisée en phase 2) : identité graphique distincte du site ; navigation repliable,
contexte clair, **menu construit depuis les permissions effectives** ; recherche
globale ; tableaux (filtres, tri, pagination, actions groupées) ; **tableau de bord à
widgets** réorganisables/masquables par rôle, filtres temporels, liens vers les listes,
états vides et erreurs traduits ; **diagrammes sans dépendance lourde** — composants
internes ou bibliothèque légère, **sur décision d'une étude comparative** (performance,
poids frontend, accessibilité, maintenance — plan de réalisation § 20) alimentés
**uniquement par les agrégats** ; prévisualisation
publique dans les **vrais composants** (4 langues × RTL × thème × mode × 320/375/tablet/
desktop × profil × campagne simulée, onglet SEO, bandeau « non publiée ») ; **parité
fonctionnelle mobile/desktop** : toutes les capacités autorisées par les permissions
sont accessibles depuis les deux environnements — recettes et ingrédients, validation
et publication, comptes, rôles et permissions, règles du moteur, **laboratoire
complet**, organisation éditoriale, campagnes et présentation, statistiques,
publicité, historique et restaurations, **y compris les opérations complexes**
(comparaisons de configurations, restaurations) — la présentation s'adapte
(tableaux vs cartes, formulaires tactiles, navigation), **jamais les capacités** ; vérifié par les critères
d'acceptation de chaque phase (§ 25) ; **conception UX menée en parallèle de la
conception technique du moteur, jamais après**.

## PARTIE III — Catalogue culinaire

### 6. Catalogue des recettes

**Ne change pas** : workflow d'atelier, coûts en fourchette, slugs, SEO. **Change** :

1. Lignes d'ingrédient avec **id propre**, précision, préparation, lien aux étapes
   (§ 7.2) — plusieurs variantes du même générique = besoins indépendants.
2. `tag_ids` (tags éditoriaux : « recette de grand-mère »…).
3. `cuisine_type` (liste figée) glisse vers un axe ; le champ reste écrit un temps.
4. Éditeur renforcé : lignes indépendantes (réordonnancement, suppression), association
   ligne ↔ étapes, obligatoire/facultatif visible, choix générique/variante, **quantités
   conservées au changement de portions** (`scaleIngredients` garde chaque ligne,
   jamais fusionnées), détection de saisie non enregistrée ; l'indicateur de complétude
   **signale sans jamais bloquer** un brouillon.

### 7. Catalogue des ingrédients

**Actuel** : liste plate d'`Ingredient` (noms, prix min/max, famille, photo) ;
recettes, frigo, courses, moteur et recherche référencent des ids.

#### 7.1. Hiérarchie de variantes — décision différée

« Une entité + `variant_of` » (variante = ingrédient référençable, héritage du
générique pour prix/famille/description) **ou** deux entités (`Ingredient` +
`IngredientVariant`) : **décision à la phase 5b** sur critères mesurables (matching
variantes/génériques, courses, conversions, migration des références, requêtes
« variantes de », clarté des substitutions) — la simplicité du modèle ne prime pas sur
la précision métier. Profondeur bornée à 3 (configurable, **pas de limite artificielle**
si les besoins le justifient), cycles refusés.

#### 7.2. Politiques de précision (indépendantes du choix structurel)

| Situation                                 | Exemple                               | Comportement                                                   |
| ----------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| Générique directement utilisable          | Sel, sucre, farine                    | « Sel » peut être enregistré sans variante                     |
| Générique utilisable, variante préférable | Tomate, oignon, fromage               | Générique ou variante ; la précision compte dans le classement |
| Variante obligatoire                      | Huile d'olive, crème selon la recette | Le générique ne satisfait pas le besoin                        |

`variant_policy: 'generic_selectable' | 'variant_preferred' | 'variant_required'`
(+ variante par défaut) **et** précision demandée par la ligne de recette. **Interaction
définie** : la politique du catalogue fixe le maximum de souplesse ; la ligne peut la
**resserrer** (`exact`) mais jamais l'élargir ; la règle effective est la plus stricte
des deux — testée. Trois niveaux distincts : **catalogue** (quelles formes existent),
**recette** (quelle précision est exigée), **frigo** (quelle précision l'utilisateur
connaît) — une entrée générique du frigo ne satisfait jamais un besoin exigeant une
variante.

#### 7.3. Ligne de recette (`RecipeIngredient`)

```ts
interface RecipeIngredient {
  id: string; // identité propre de la ligne
  ingredient_id: string; // générique OU variante
  quantity_base: number;
  unit: string;
  is_optional?: boolean;
  role?: IngredientRole;
  precision?: 'any_variant' | 'exact';
  preparation_fr?: string; /* idem */
  step_numbers?: number[];
  note_fr?: string; /* idem */
  substitutes?: string[]; // alternatives déclarées pour cette ligne, évaluées par les règles
}
```

**Un seul système de décision** : le moteur centralisé de règles de substitution est la
**source de vérité** pour les substitutions contextuelles. `substitutes` sur une ligne
n'est jamais un second moteur : c'est la liste des alternatives **explicitement
déclarées pour cette ligne**, qui sont ensuite évaluées selon les mêmes règles du
moteur — jamais deux systèmes indépendants capables de décisions contradictoires.

Jamais indexé par l'id d'ingrédient ; deux lignes identiques en apparence ne fusionnent
jamais automatiquement (action d'administration avec aperçu). Impacts traités en phase :
affichage, portions, courses, substitutions, frigo, matching, sauvegarde JSON
(aller-retour testé).

#### 7.4. Fusion de doublons et règles obsolètes

**Fusion** : opération d'administration qui réécrit les références (recettes, frigo,
courses, moteur) avec historique des références modifiées et **opération inverse
compensatoire** — la restauration de version ne suffit pas (elle annulerait des
modifications ultérieures) ; l'opération inverse est testée. **Aucune fusion
irréversible sans filet** : **prévisualisation des conséquences** (recettes, frigo,
courses, règles affectées) et **confirmation explicite** avant application. **Règles obsolètes** :
renommer, déplacer ou fusionner un ingrédient **signale** à l'administrateur toutes les
règles de compatibilité et de substitution qui le référencent (index
règle → ingrédients, validation des dépendances).

#### 7.5. Substitutions

Le modèle contextuel existant (`SubstitutionRule` : `notForCourses`, `notWhenKey`,
priorités, surcharge admin via les réglages) est **conservé** et étendu aux variantes.
**Héritage des règles génériques : explicite, configurable, désactivable** — une règle
définie pour un générique ne s'applique à ses variantes que si l'héritage est activé ;
une variante peut le désactiver ; une règle spécifique à une variante **remplace ou
restreint** la règle du générique ; la relation hiérarchique seule ne suffit jamais à
autoriser une substitution. Les substitutions restent **explicites et conditionnées** —
jamais déduites du seul parent. La hiérarchie de priorité, les exceptions d'interdiction
et la règle de prudence sont définies au § 10 ; l'employé gère règles et exceptions par
champs guidés, jamais en JSON, et le moteur explique chaque acceptation ou refus (règle
appliquée, conditions vérifiées).

### 8. Le frigo : entrées souples — présence d'abord, quantité quand elle est connue

**Principe de simplicité et de quantité facultative** : la saisie des quantités n'est
**jamais** une condition pour utiliser le moteur. L'utilisateur gère son frigo en
déclarant simplement la **présence** ou l'absence des ingrédients (Tomates · Pommes de
terre · Poulet · Huile d'olive…) ; les quantités sont facultatives, renseignées à la
main, obtenues d'une source fiable ou estimées par la reconnaissance visuelle quand la
précision le permet. La quantité inconnue est une **vraie situation métier**, jamais une
valeur artificielle (pas de 999999) : elle n'est assimilée ni à zéro ni à illimité.

`FridgeEntry { id, ingredient_id, quantity?, unit?, expires_at?, expiry_type?,
reserved?, reserved_quantity?, permanent?, exhausted_at?, origin, note?, added_at }` —
une entrée physique (une boîte, un paquet) ; plusieurs entrées par ingrédient ; une
entrée générique n'est jamais équivalente à une variante précise. **Sémantique définie** :

- **présence seule** (sans quantité) = « j'en possède » — disponible, sans jamais
  signifier « quantité illimitée » ;
- **quantité renseignée** = présence + vérification de la quantité nécessaire
  (ex. 500 g de tomates dont 200 g réservés → 300 g disponibles : la réservation
  quantitative reste possible, `reserved_quantity ≤ quantity`, même unité) ;
- **réservation facultative, dans les deux modes** : quantitative quand la quantité est
  connue ; **entrée entière réservée** (`reserved: true`) quand elle ne l'est pas —
  « je garde ce poulet pour vendredi » retire le poulet des recettes sans inventer des
  grammes réservés. Les deux modes sont **mutuellement exclusifs**, avec des
  validations qui empêchent les états incohérents : `reserved_quantity` exige une
  quantité connue et interdit `reserved: true` (et inversement),
  `reserved_quantity ≤ quantity`, même unité ;
- **origine obligatoire** (`origin: 'manual' | 'photo' | 'import'`) : la photo
  **propose** des ingrédients, elle n'ajoute rien toute seule — seuls les ingrédients
  **confirmés par l'utilisateur** entrent dans le frigo (la reconnaissance de l'IA est
  une proposition, la présence confirmée une action du client) ; jamais de quantité
  inventée ; le client confirme et obtient aussitôt des suggestions ;
- la péremption porte **deux champs** : `expires_at` + `expiry_type: 'DLC' | 'DDM'` —
  DLC dépassée = indisponible ; DDM dépassée = déclassé, pas supprimé (le traitement
  métier diffère) ;
- plusieurs entrées du même ingrédient s'additionnent quand les unités sont
  compatibles.

**Ingrédients de base du placard (stock permanent)** : Sel, poivre, huile d'olive,
vinaigre, sucre, farine, cumin, curcuma, paprika… peuvent être déclarés **une seule
fois** comme possédés habituellement (`permanent: true`) ; le moteur les considère
alors disponibles **par défaut**, tant que le client n'a pas déclaré qu'il n'en possède
plus. Ce statut représente une **présence habituelle, jamais une quantité illimitée** :
deux états simples — **actif** et **temporairement épuisé** (`exhausted_at`, « je n'ai
plus de cumin ») — avec une **réactivation en un geste**, sans jamais obliger à
renseigner des quantités. Ce statut est **réservé aux ingrédients de base et épices** —
le poulet, les tomates ou les pommes de terre ne sont **jamais** disponibles
automatiquement.

**Permanent et entrées physiques du même ingrédient** : les entrées physiques
quantifiées sont la **seule réalité quantitative** — le stock permanent ne compte
jamais comme une quantité fictive ou illimitée. Si l'ingrédient a des entrées
physiques, ce sont elles qui portent les quantités ; le permanent ne couvre
qualitativement que ce qu'elles ne couvrent pas. Si une entrée physique est épuisée ou
supprimée, elle disparaît du stock — **rien n'est réinventé** ; si l'ingrédient reste
déclaré permanent, la couverture redevient purement qualitative (« présent, quantité
non vérifiée », sous réserve). Testé : entrée permanente + entrée physique du même
ingrédient, puis épuisement puis suppression de l'entrée physique.

**Synchronisation** : le frigo actuel est un `ElementSet` d'ids (horloges hybrides,
tombstones, purge). **Orientation validée** : étendre le CRDT aux entrées (chaque entrée
porte sa version HLC, les tombstones restent le mécanisme de suppression) — **pas une
simple modification de structure**. Spécification du sync imposée par sa matrice de
tests : ajout hors ligne sur deux appareils, modification simultanée d'une quantité,
suppression sur un appareil pendant que l'autre est hors ligne, deux entrées du même
ingrédient, rejeu répété d'une même opération, modification pendant une synchronisation,
fusion et purge des anciennes entrées — **aucune opération ne se perd silencieusement**,
la résolution de conflits est écrite dans le contrat et testée sur chaque cas.
Migration : ids actuels → entrées « présence seule » (sans quantité), réversible.

## PARTIE IV — Le moteur de matching

### 9. Audit réel du moteur actuel

**Ce qui existe et reste pertinent** : pipeline `filters → analysis → scoring → tiers →
ranking` (un module par étape, testé et remplaçable) ; `MatchingConfig` versionnée,
fusionnée, bornée (`resolveMatchingConfig`) ; substitutions contextuelles ; rôles
key/secondary/staple ; tiers ready/almost/ideas qui séparent contraintes bloquantes et
classement ; boosts datés ; simulateur + scénarios du chef + `npm run diagnose:matching` ;
`scaleIngredients`.

**Limites mesurées** : quantités et unités **ignorées** (frigo = ensemble d'ids) ;
3 statuts seulement (disponible/remplacé/manquant) ; aucune conversion d'ingrédient ;
pas d'incertitude ; pas d'explicabilité ; paramétrage technique brut. Le squelette est
**gardé** ; l'analyse, le frigo et les conversions sont **reconstruits**. Le moteur vit
dans `src/core/matching`, testé sans React ni stockage — indépendance déjà vraie,
maintenue.

**Réponses aux limites identifiées** — chaque limite du moteur actuel a sa réponse
écrite :

| Limite du moteur actuel                                                                | Réponse du nouveau moteur                                                                           |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Quantités et unités ignorées (frigo = ensemble d'ids)                                  | Frigo à entrées souples (§ 8) + allocation sans double consommation (§ 12)                          |
| Utilité bloquée derrière des saisies de quantités                                      | Deux modes : **simple** (présence seule, jamais bloqué pour insuffisance) et **avancé** (quantités) |
| Scan photo incapable de donner une quantité fiable                                     | Présence détectée = disponible, quantité jamais inventée (§ 8, § 17)                                |
| 3 statuts seulement                                                                    | 6 niveaux par ligne + 6 verdicts distingués (§ 12)                                                  |
| Aucune conversion d'ingrédient                                                         | Conversions exacte / approximative marquée / impossible (§ 11)                                      |
| Substitution générale appliquée partout (« viande → viande hachée » dans une mloukhia) | Contexte, exceptions, priorité déterministe et prudence sur recette non évaluée (§ 10)              |
| Pas d'incertitude                                                                      | Niveau `incertain` + verdict « non évaluable » ; l'incertain n'est jamais compté comme disponible   |
| Pas d'explicabilité                                                                    | Piste de justification par ligne + explication des changements de verdict (§ 12)                    |
| Paramétrage technique brut                                                             | Deux niveaux de paramétrage + laboratoire de simulation (§ 13–14)                                   |

### 10. Hiérarchie, compatibilité, substitution : trois notions séparées

| Notion            | Signification                                   | Modélisation                                                                     |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **Hiérarchie**    | Organisation du catalogue (`variant_of`)        | Ne déduit **jamais** une équivalence                                             |
| **Compatibilité** | Capacité d'un ingrédient à satisfaire un besoin | Règle **explicite validée par l'admin** (demande ↔ réponse, contexte facultatif) |
| **Substitution**  | Remplacement culinaire autorisé sous conditions | `SubstitutionRule` conservé, étendu aux variantes                                |

Règle absolue, testée : **aucune équivalence déduite du seul parent** — posséder du
concentré ne signifie pas posséder des tomates cerises.

**Priorité déterministe des règles de substitution** (de la plus précise à la plus
générale — une exception précise **prévaut** toujours sur une règle générale, testé) :

1. règle spécifique à la recette, y compris exception d'interdiction (« pas dans la
   mloukhia ») ;
2. règle par technique culinaire ou type de préparation (« dans les sauces », « pas
   dans une salade ») ;
3. règle par catégorie de recette ;
4. règle générale ingrédient → ingrédient.

**Conflits de même priorité** : si plusieurs règles du même niveau sont applicables,
le comportement est **déterministe et défini** (ordre stable documenté — ex. la règle
la plus récemment validée l'emporte) et testé ; les règles concurrentes sont
**signalées** dans le laboratoire pour que l'employé les arbitre.

**Prudence** : si aucun contexte ne permet d'évaluer la compatibilité (recette non
analysée, catégorie absente), **pas d'acceptation automatique** — la ligne tombe en
`incertain` et le verdict reste prudent. Exemple de référence (viande → viande hachée) :
spaghetti à la viande acceptée si la préparation le permet · makrouna acceptée selon la
variante · mloukhia **refusée** par l'exception de recette · recette non évaluée →
**pas d'acceptation automatique**. L'employé saisit règles et exceptions par champs
guidés (§ 13), jamais en JSON.

### 11. Conversions de quantités

Exacte (familles d'unités + conversions de variante : « boîte de 400 g » ↔ 400 g) ·
approximative connue (densité déclarée par ingrédient, **toujours marquée**, plafonnée
par la tolérance configurée) · impossible ou inconnue (c.à.s ↔ grammes sans densité,
**« pièce » ↔ masse sans poids moyen déclaré** : jamais de poids standard supposé) → la
ligne est **incertaine**, jamais satisfaite au doigt mouillé. Une entrée de frigo sans
quantité couvre un besoin qualitativement, avec l'incertitude correspondante.

### 12. Architecture du nouveau moteur

**Pipeline par étapes (chaque étape testée et remplaçable)** :

```
0. Filtres (inchangés)
1. Correspondance exacte : variante demandée = variante possédée + quantité suffisante
2. Correspondance par précision : « any_variant » satisfait par variante ou générique ;
   « exact » jamais satisfait autrement
3. Compatibilités validées (règles explicites)
4. Substitutions culinaires (règles + par recette, contexte : plat, rôle, clé)
5. ALLOCATION DES STOCKS : uniquement sur les entrées **quantifiées** — les besoins
   (lignes) et le stock sont appariés SANS jamais consommer deux fois la même
   quantité ; reste, manquant exact, surplus ; quand plusieurs substitutions sont
   possibles, comparaison déterministe des allocations (exact > compatible >
   substitution ; à égalité, priorité aux entrées les plus proches de péremption).
   Les entrées en **présence seule** (ou stock permanent) couvrent la forme du besoin,
   jamais la quantité : couverture qualitative, marquée « sous réserve »
6. Fiabilité : confiance par ligne, verdict par recette
```

L'allocation est déterministe, testée contre la double consommation (le corpus inclut
le cas « une entrée, deux lignes qui la demandent ») et son résultat fait partie de la
justification. Elle ne s'exécute que sur les entrées quantifiées : une entrée en
présence seule n'a rien à allouer et ne peut pas faire croire à une quantité vérifiée.

**Présence seule et stock partagé entre les lignes** : quand plusieurs lignes d'une
même recette demandent le même ingrédient **sans quantité connue**, le moteur ne
décide **pas** ligne par ligne que chacune est quantitativement couverte — le stock
inconnu est **partagé** : toutes ces lignes portent le niveau « présent, quantité non
vérifiée », l'incertitude est **explicite et conjointe**, et la garantie n'est jamais
faite. Testé : plusieurs lignes d'un même ingrédient en présence seule ne produisent
jamais une faisabilité vérifiée.

**États du stock (ce que le moteur sait, par ingrédient)** : disponible **confirmé**
(présence + quantité suffisante) · disponible **quantité inconnue** (présence seule,
manuel, photo, import) · **partiellement** disponible (quantité connue insuffisante) ·
**réservé** (entrées réservées, quantitatives ou entières) · **manquant** ·
**incertain**. Une quantité inconnue n'est jamais assimilée à zéro ni à illimité ; un
stock permanent épuisé n'est plus disponible tant qu'il n'est pas réactivé.

**Suggestions individuelles** : chaque recette est évaluée **indépendamment**, comme si
le stock lui était entièrement dédié — trois recettes proposées qui utilisent toutes
des tomates ne signifient pas que le stock permet de préparer les trois ; cette limite
est **expliquée à l'utilisateur**. La planification (préparer plusieurs recettes
ensemble) exigera une **allocation globale cohérente** : volontairement non implémenté
pour l'instant (§ 29), prévu derrière la même fonction d'allocation.

**Niveaux par ligne** : `exact` · `partial` (bonne forme, quantité insuffisante —
manquant exact calculé) · `compatible` · `substituted` · `présent, quantité non
vérifiée` (présence sûre, quantité inconnue — distinct de `incertain`, qui lui couvre
donnée ou conversion inconnue) · `missing`. **Trois informations séparées** :
obligatoire/facultatif (le facultatif absent ne pénalise jamais le verdict), rôle
culinaire (un secondaire reste obligatoire s'il n'est pas marqué facultatif), poids de
classement.

**Verdicts distingués** :

| Verdict                                     | Signification                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Réalisable **maintenant**                   | Tous les besoins obligatoires couverts, sans substitution                      |
| Réalisable **avec substitutions**           | Couverts, dont certains par substitution autorisée                             |
| Réalisable **avec ajustement des portions** | Les stocks couvrent une version réduite de la recette                          |
| Réalisable **après achat**                  | Certains besoins obligatoires restent à acheter (manque exact affiché)         |
| Partiellement réalisable                    | Une partie couverte, la recette ne peut pas encore être préparée intégralement |
| **Non évaluable**                           | Les informations ne permettent pas de conclure sûrement (seuil configurable)   |

**Conditions déterministes et priorité des verdicts** (évalués dans cet ordre,
testés) :

1. **Couverture en forme d'abord** : au moins un besoin obligatoire sans correspondance
   (ni précision, ni compatibilité, ni substitution autorisée) → **partiellement
   réalisable** — un ingrédient manque en nature, pas seulement en quantité (ex. des
   courgettes demandées, non possédées, aucune substitution autorisée) ;
2. sinon, **quantités** : au moins une quantité **définitivement insuffisante**
   (entrée quantifiée, manque exact calculé) → **réalisable après achat** — la recette
   se complète par des achats, la liste exacte est affichée (ex. 500 g de tomates
   demandés, 200 g possédés → acheter 300 g) ;
3. sinon, couverture complète : sans substitution utilisée → **maintenant** ; avec
   substitution autorisée utilisée → **avec substitutions** ;
4. information insuffisante pour conclure (seuil configurable) → **non évaluable**.

Une quantité **inconnue** ne déclenche jamais « après achat » (rien d'achetable de
sûr) : le verdict principal est calculé sur les quantités connues et le qualificatif
« sous réserve » porte l'incertitude. « Réalisable avec ajustement des portions »
découle de la comparaison des stocks disponibles à une version réduite (voir portions
réduites ci-dessous).

**Qualificatif « sous réserve »** : quand une couverture s'appuie sur une quantité
inconnue (présence seule, stock permanent), la recette reste proposable mais est
marquée **« réalisable sous réserve de vérifier la quantité de X »** — ni exclue pour
insuffisance, ni présentée comme garantie. Une quantité inconnue dégrade la garantie,
jamais la présence. **Il reste indépendant du verdict principal** : il se superpose à
« réalisable maintenant », « avec substitutions » ou « après achat » — le verdict porte
la couverture, le qualificatif porte l'incertitude de quantité.

**Une recette « réalisable » (garantie) ne repose jamais sur une correspondance
incertaine ni sur une quantité inconnue** — ces cas produisent « sous réserve », jamais
« réalisable maintenant ».

**Portions réduites — intégrée au moteur, avec trois faisabilités distinguées** :

1. faisabilité pour le **nombre de portions demandé** (verdicts ci-dessus) ;
2. faisabilité pour un **nombre de portions réduit** (ex. 400 g de viande pour
   4 personnes, 200 g possédés → version pour 2 personnes, avec la quantité exacte
   nécessaire) ;
3. quantité exacte requise dans les deux cas.

La recette originale n'est **jamais modifiée** ; une réduction n'est jamais supposée
linéaire par défaut — quand une préparation ne se réduit pas bien (levure,
conversions en unités indivisibles), la ligne devient `incertaine` et le signal est
donné.

**Explicabilité** : chaque ligne conserve sa piste de justification — entrée(s)
utilisée(s) et **quantité restante après allocation**, conversion (exacte/approximative

- facteur), règle (id + condition respectée), manquant calculé. L'interface répond :
  pourquoi cette recette est proposée, ce qui manque exactement, quelles quantités
  acheter, quoi utiliser avant péremption, pourquoi le verdict a changé entre deux
  configurations.

### 13. Paramétrage à deux niveaux

**Niveau métier (employé formé)** : profils Strict / Équilibré / Flexible comme
préréglages modifiables, décrits en langage clair avec leur conséquence visible
(recettes proposées sur le jeu de référence) ; **éditeur de règles visuel** — « le
concentré peut remplacer la tomate fraîche dans les sauces, mais pas dans une salade »
se saisit par champs guidés (depuis → vers · quand · priorité), jamais en JSON ; chaque
règle affiche ce qu'elle fait, quand elle s'applique, **pourquoi elle a été créée**
(note obligatoire), **quelles recettes elle affecte** (index règle → recettes) et les
résultats produits (simulation immédiate sur échantillon).

**Niveau avancé (administrateur habilité)** : seuils, pondérations, facteurs de
fiabilité, tolérances — avec description, impact expliqué, valeur recommandée, limites
de sécurité et **indicateur de risque** ; inutiles au quotidien ; tout passe par le
laboratoire avant publication.

**Deux niveaux d'évolution distingués** : l'employé configure **librement** tout ce que
le registre du moteur sait déjà faire (combinaisons de conditions, critères et actions
existants) ; lorsqu'une nouvelle règle exige un opérateur, un critère ou un algorithme
absent, une **évolution technique** est nécessaire **une seule fois** — puis la
nouvelle capacité est configurable depuis le back-office à vie. Objectif : ne pas
développer une fonctionnalité nouvelle pour chaque règle métier.

**Configurable sans code (quand la capacité existe)** : équivalences et compatibilités
entre ingrédients ; substitutions et leurs conditions ; exceptions d'interdiction ;
obligatoire/facultatif ; rôles culinaires ; seuils de tolérance ; profils strict /
équilibré / flexible ; priorités et pondérations ; comportements quantités et unités ;
règles de péremption (DLC/DDM) ; critères de pertinence et de classement. Chaque
règle : créer, modifier, dupliquer, désactiver, tester et publier depuis une interface
claire ; paramètres avancés réservés aux profils autorisés, encadrés, validés, avec
recommandations.

**Garde-fous** : une configuration ne peut jamais transformer une approximation en
exact, autoriser une substitution non déclarée, dépasser les bornes de
`resolveMatchingConfig`, ni rendre le moteur plus permissif que les règles déclarées.
Paramétrable = **borné, validé, versionné et simulé** — jamais arbitraire. Le moteur de
règles commun reste un **socle technique** : les politiques (accès, visibilité
éditoriale, matching, publicité) gardent leurs règles métier distinctes.

### 14. Laboratoire de matching (backoffice)

Trois vues sur un même résultat — **synthétique** (verdict, fiabilité, couvert/manquant),
**détaillée** (justification de chaque ligne), **technique** (allocation des stocks,
conversions exécutées, règles exécutées, temps) — et six capacités :

1. **Simulation individuelle** : recette + frigo fictif (quantités, unités, variantes,
   péremptions) + profil → chaque correspondance expliquée.
2. **Comparaison de configurations côte à côte** : publiée vs brouillon vs alternative —
   recettes gagnées, perdues, verdicts changés, régressions, dégradations de performance.
3. **Bibliothèque de scénarios** (scénarios du chef étendus), chaque scénario avec son
   résultat attendu.
4. **Simulation globale** : métriques sur le corpus (évaluées, verdicts changés, faux
   positifs, faux négatifs, incertaines, écarts de quantités, temps) — **tâche serveur
   asynchrone avec progression et annulation** dès que le traitement dépasse le budget
   client (le back-office ne se bloque jamais) ; le client en voit les agrégats et les
   échantillons.
5. **Simulation sans risque** : règles et stocks fictifs modifiables, retour à l'état
   initial — les données réelles ne sont jamais touchées.
6. **Portes de publication** : Brouillon → Simulation → Analyse → Validation →
   Publication → Historique ; un échec critique **bloque** la publication ou exige une
   validation explicitement autorisée selon la gravité ; la validation affiche un
   **résumé des conséquences** (recettes gagnées, perdues, verdicts changés, règles
   impliquées), pas un simple bouton ; explication précise de chaque changement de
   verdict (règle modifiée, seuil abaissé, conversion changée).

L'employé voit toujours **la configuration active** et **les brouillons en cours**
(barre d'état permanente). Permissions RBAC sur `matching_settings` : `read`, `edit`,
`simulate`, `validate`, `publish`, avec **séparation configurable auteur / valideur**
(`require_second_approval`) ; chaque changement tracé (auteur, avant/après, note) ;
configurations identifiables et restaurables.

Le laboratoire consulte aussi les **correspondances acceptées et refusées** (règles
appliquées, conditions vérifiées) et détecte les **régressions** par la bibliothèque de
scénarios. Toutes ses capacités sont accessibles **sur mobile et desktop**
(présentation adaptée, § 5). La bascule entre exécution immédiate et asynchrone est
**déterminée par des mesures réelles**, jamais fixée arbitrairement (§ 15).

**Fiabilité des tâches asynchrones** : gestion **persistante** des tâches, à travers la
base de données existante (aucun service ni infrastructure payants) ; une simulation ne
disparaît pas silencieusement au redémarrage du serveur — son état est retrouvé ; une
même tâche n'est jamais exécutée plusieurs fois involontairement ; l'annulation est
prise en compte proprement ; les résultats sont rattachés à la **version exacte** de la
configuration et du catalogue testés (versions immuables) ; les traitements simultanés
sont encadrés pour ne pas saturer le serveur.

### 15. Performance : exigence architecturale

**Budgets mesurables par volume** (ajustés aux mesures réelles, vérifiés à chaque phase
par des tests de charge automatiques — une régression de performance fait échouer la
phase comme un test faux) :

| Volume (recettes × frigo) | Budget d'une passe complète              | Par recette |
| ------------------------- | ---------------------------------------- | ----------- |
| Actuel (312 × 60)         | < 50 ms (mobile milieu de gamme)         | —           |
| 10 000 × 60               | < 600 ms                                 | < 60 µs     |
| 50 000 × 60               | évaluation paresseuse obligatoire, < 3 s | < 60 µs     |

**Protocole de mesure** (annoncé, jamais promis) : **environnement défini précisément**
(exécution navigateur ou serveur, appareil, mémoire), temps excluant le chargement des
données mais incluant l'analyse, volumes et complexité de règles fixes, frigo de taille
définie, **p95/p99** sur une série de passes ; frigo modifié et recherche **pendant**
une simulation sont testés. **Pertinence avant vitesse** : le moteur n'arrête **jamais**
l'analyse au seul motif qu'il a trouvé suffisamment de recettes réalisables (une 11e
recette plus pertinente ne doit pas être ignorée parce que 10 sont venues vite) ; les
critères bloquants sont évalués rapidement, les candidats classés selon une stratégie
fiable, et l'arrêt anticipé n'intervient que **démontré** : quand les recettes restantes
ne peuvent plus améliorer le résultat affiché ; chaque optimisation est comparée à une
**exécution de référence complète** sur le corpus de tests. La performance n'est jamais
une excuse pour dégrader la pertinence. **Techniques imposées** :
index par ingrédient et variante ; préparation des données hors boucle ; mémoïsation
des conversions ; évaluation paresseuse et arrêt anticipé (les tiers coupent tôt) ;
**recalcul incrémental** via l'index règle → recettes (mécanisme des signatures de
sélection) ; caches explicites ; recherche et matching **séparés** (frigo vide =
navigation, jamais un matching sans matière) ; le laboratoire mesure le **coût par
règle** pour repérer celles qui dégradent le moteur.

### 16. Fiabilité : corpus, métriques, objectifs

Corpus = scénarios du chef étendus, résultat attendu par cas (y compris « non
évaluable ») : variantes d'un même ingrédient en recette et au frigo, quantités
insuffisantes, unités incompatibles, conversions approximatives, substitutions
interdites / conditionnelles, facultatifs, absents, doublons, péremption proche,
**double demande sur une même entrée**, informations insuffisantes, **frigo sans
aucune quantité**, mélange d'entrées quantifiées et de présence seule, **stock
permanent déclaré puis épuisé**, réservation entière sans quantité, origine photo
(présence détectée), **plusieurs lignes du même ingrédient en présence seule**
(stock partagé, incertitude conjointe). Métriques séparées :
**faux positifs (priorité absolue)**, faux négatifs, précision des quantités,
pertinence du classement, part des « non évaluables », temps. Objectifs avant bascule :
**zéro faux positif sur le corpus en profil strict** ; seuils fixés avec le chef pour
« équilibré ». Aucun taux nul promis — la prudence est structurelle. Couverture
progressive : scénarios unitaires, combinatoires, cas réels anonymisés.

### 17. IA générative : jamais décideuse, jamais payante par défaut

Le moteur est **déterministe** (même catalogue + frigo + config = même résultat, testé).
L'IA ne décide jamais et **n'est pas une dépendance du plan** : la seule intégration
existante — le scan photo (Gemini, port `VisionProvider`) — est facultative, sans clé le
scanner est désactivé et la plateforme reste complète ; si une clé gratuite devient
disponible, le même port suffit. L'IA peut **assister** (proposer règles, mappings,
variantes) : chaque proposition passe par l'atelier et la validation humaine — et sans
IA, ces propositions se saisissent à la main. **Le scan photo sert la simplicité** : il
reconnaît la **présence** des ingrédients, jamais leur quantité avec certitude ; la
reconnaissance est une **proposition** — seuls les ingrédients **confirmés par
l'utilisateur** sont ajoutés au frigo, puis les suggestions arrivent aussitôt, sans
aucune saisie de quantité obligatoire (mode simple, § 8).

## PARTIE V — Les autres domaines

### 18. Classification

Racines des arbres déclarées comme **axes** (`presentation: filter/group/both`,
`selection: single/multiple` — champs facultatifs, zéro migration des documents) ;
**tags** (`tags` + `tag_ids`) ; filtrage « au plus une valeur par axe `single` » appliqué
par `normalizeCategoryIds` ; pages publiques d'axe et de groupe servées depuis les
instantanés. Moteur, filtres conservés entre écrans, compteurs justes : inchangés.

### 19. Organisation éditoriale

`RecipeSelection` (critères bornés, exécution adaptative : requête paginée / instantané
/ mémoire avec garde-fous) ; **groupes éditoriaux** (arborescence, MANUAL / DYNAMIC /
HYBRID, contrôle d'affichage par nœud, adressables directement par slug) ;
**collections** (sélections plates réutilisables) ; invalidation par contenu **et** par
signatures de sélection ; un instantané est une **optimisation de lecture, jamais une
source de vérité**.

### 20. Présentation et campagnes

**Campagnes éditoriales** (`ContentCampaign` : dates en données, ressaisie annuelle
pour Ramadan, badge ciblé, sponsoring distinct) ; **sections d'affichage**
(`DisplaySection` : source paramétrable, layout, visibilité par règle avec
`off_period` hidden/collapsed/normal) ; **éditeur de home** (glisser-déposer,
prévisualisation par profil) ; l'accueil actuel reste le repli tant qu'aucune section
n'est publiée.

### 21. Plateforme (fonctionnalités, droits, configurations)

**Fonctionnalités** (`features` : interrupteur global, règle d'accès, rollout %,
fenêtre, kill switch — n'active que des services dont le code existe, registre fermé).
Une fonctionnalité peut être activée ou désactivée, visible par tous, réservée aux
connectés, accessible à certains groupes ou profils, portée par un entitlement
(Premium/VIP **sans aucun type codé**, via les dons) ou disponible dans certains
contextes. Un système d'abonnement complet pourra être ajouté plus tard **sans refondre
la gestion des accès** — l'entitlement est déjà la couture. La logique des
fonctionnalités reste **distincte des règles métier du moteur** ;
**moteur de règles commun** (registre fermé de champs/opérateurs, bornes : profondeur
≤ 4, ≤ 30 critères ; tables de vérité à 3 états : `all`/`any`/`not` avec `inconnu`,
fail-closed, **`not(inconnu) = faux`** — masquer ne peut jamais accorder ; évaluation
client pour l'affichage, **serveur pour toute opération protégée**) ;
**entitlements-dons** (`EntitlementGrant` : clé, source manual/subscription/promotion/
partnership/trial, `granted_at`, `expires_at`, `revoked_at` — la liste plate est un
cache résolu, la source de vérité est la table des dons ; **aucun type Premium/VIP
codé**) ; **cycle de vie unique des configurations** (Brouillon → Prévisualisation →
Publication → Historique → Restauration qui crée une version ; kill switch ;
`audit_logs`) ; **localisation** : rien à faire — `LocalizedText` + `LanguageInfo`
existent déjà, l'ajout d'une langue ne touche pas les modèles.

### 22. Analytics

Liste **fermée** d'événements (consultation, recherche, CTR, favoris), **sans donnée
identifiable ni ré-identifiable** (pas de user-agent, pas d'empreinte) ; **collecte
explicite et transparente** : aucun événement à l'insu de l'utilisateur, anonymisation
par construction à la collecte, bascule de consentement dans Réglages › Confidentialité ;
envoi par lots échantillonnés ; **agrégats quotidiens serveur** ; bruts 30 jours puis
purge, agrégats conservés ; rétention et champs documentés et publiés dans Réglages ›
Confidentialité ; widgets et diagrammes alimentés uniquement par les agrégats ; le tri
« populaire » des sélections se nourrit des agrégats.

### 23. Publicité

**Entitlement `no_ads` prioritaire sur toute règle d'affichage** : le droit de ne pas
voir de pub l'emporte toujours (la zone est masquée, jamais allégée). Décision
**serveur** (préfiltrage indexé → règles → fréquence → classement) ; le client ne voit
jamais ciblage, budget ni stratégie ; **contextuelle d'abord**, ciblage individuel
seulement derrière consentement ; idempotence par `event_id`, fréquence comptée **à la
décision** (jamais déduite des événements client), audience unique agrégée, jeton
signé, réconciliation nocturne, « sponsorisé » obligatoire et traduit ; **régie
interne**, aucune dépendance à un SDK tiers — compatible budget zéro.

### 24. Commerce, abonnements, restaurants : frontières seulement

Aucune collection créée avant les phases 11–13, et après une porte de passage (succès
des phases 6–10). Règles de frontière : rien de commercial dans le catalogue culinaire
ni dans les listes de courses ; le mapping ingrédient ↔ produit est **saisi et validé
par l'administration, jamais automatique** ; la conversion `ShoppingList → Cart` est une
fonction pure qui produit des propositions validées ligne par ligne (conditionnements,
surplus, substitutions proposées) — la liste n'est jamais remplacée ; une commande
conserve un **instantané** produit/offre/prix ; sous-commandes multi-vendeurs possibles
(ports paiement/livraison, aucun fournisseur imposé) ; `Dish` ≠ `Recipe`, `FoodProvider`,
`RestaurantLocation`, `Menu`, `DishOffer`, `Order`, `Fulfillment`. Le parcours A
(courses autonomes) reste exactement le comportement actuel.

## PARTIE VI — Réalisation

### 25. Roadmap (phases 0–13)

Les fondations 1–4, puis la séquence moteur/ingrédients — la **conception UX du
back-office et du laboratoire avance en parallèle** de la conception technique du
moteur, jamais après :

| Phase | Contenu                                                                                                 | Condition de passage                                               |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0     | Audit (fait, maintenu à jour)                                                                           | Inventaire convergent                                              |
| 1     | Contrats métier + indépendance fournisseur + SQL (mécanismes ; migration définitive reportée à 6a, § 4) | Contrats sur SQLite et Postgres, migration répétée en base de test |
| 2     | Fondations back-office, design system, **RBAC conçu**, écrans du laboratoire conçus (mobile et desktop) | Maquettes validées, résolution testée                              |
| 3     | Rôles et permissions implémentés                                                                        | Vérification serveur + journal + invalidation                      |
| 4     | Fonctionnalités, règles versionnées, localisation, audit                                                | Tables de vérité testées, bundle résolu                            |
| 5a    | Audit du moteur (fait) + **corpus constitué, mesuré sur le moteur actuel**                              | Métriques de départ publiées                                       |
| 5b    | Conception : Ingredient/RecipeIngredient/Fridge (décision § 7.1, sync § 8), écrans du laboratoire       | Modèles + contrats du sync + maquettes validées                    |
| 5c    | Conception des règles : compatibilités, substitutions, conversions, paramétrage à deux niveaux          | Bornes et garde-fous testés                                        |
| 6a    | Migration des données (hiérarchie, lignes, frigo → entrées ; aperçu avant application)                  | Réversible, comparée                                               |
| 6b    | Moteur par étapes + **double exécution ancien/nouveau sur le corpus**                                   | Zéro faux positif en strict, budgets tenus                         |
| 6c    | Validation métier, bascule contrôlée, retrait de l'ancien moteur                                        | Repli possible tant que non basculé                                |
| 7     | Présentation, campagnes, prévisualisation complète                                                      | Aperçu 4 langues × 2 modes × 3 appareils × profils                 |
| 8     | Recommandations                                                                                         | Dédoublonnage et exclusions testés                                 |
| 9     | Analytics                                                                                               | Agrégats quotidiens, confidentialité vérifiée                      |
| 10    | Publicité                                                                                               | Réconciliation nocturne, rapports sans traces personnelles         |
| 11    | Catalogue commercial (mapping validé humainement)                                                       | Mapping 100 % validé                                               |
| 12    | Paniers et commandes (conversion contrôlée, multi-vendeurs, instantanés)                                | Parcours A inchangé (non-régression dédiée)                        |
| 13    | Restaurants et plats préparés, puis abonnements (si besoin confirmé)                                    | —                                                                  |

Chaque phase passe les critères consolidés : `npm run check` **+** tests unitaires (y
compris tables de vérité et valeurs inconnues) **+** tests de contrat (memory, SQLite,
Postgres) **+** non-régression des fonctionnalités préservées **+** tests de sécurité
(refus par défaut, revérification serveur, anti-élévation, dernier super admin, limites
de débit) **+** performance et sécurité vérifiées quand la phase l'exige **+** **parité
fonctionnelle mobile/desktop du back-office vérifiée** **+** nettoyage et
refactorisation des composants concernés effectués et testés (§ 31) **+**
documentation des résultats, des réserves et sauvegarde testée. **La décomposition en
lots de travaux, les dépendances, les maquettes à valider et les points de contrôle
détaillés vivent dans le plan de réalisation (`17-plan-de-realisation.md`).**
Les maquettes (`docs/encyclopedie/mockups/backoffice.html`) sont des prototypes de
direction, pas une référence pixel-perfect — les écrans réels affichent les données
réelles et des états vides traduits.

### 26. Impact code prévu (vue synthétique)

| Livrable                                                                                            | Type                       | Phase             |
| --------------------------------------------------------------------------------------------------- | -------------------------- | ----------------- |
| `src/core/rules` (registre, évaluateur, tables de vérité)                                           | nouveau                    | 4                 |
| `src/core/features` (fonctionnalités, bundle résolu)                                                | nouveau                    | 4                 |
| `src/core/permissions` (RBAC, résolution, anti-élévation)                                           | nouveau                    | 2–3               |
| `src/core/ingredients` (hiérarchie, précisions, conversions)                                        | évolution de `catalog`     | 5b–6a             |
| `src/core/matching` (frigo à entrées souples, allocation, niveaux, verdicts, piste)                 | refonte interne            | 5a–6c             |
| `src/core/selection` (`RecipeSelection`, exécution adaptative)                                      | nouveau                    | 6                 |
| `src/core/showcase` (campagnes, sections, visibilité)                                               | nouveau                    | 7                 |
| `src/core/commerce` (frontières : mapping, conversion liste → panier)                               | stub documenté             | —                 |
| `src/shared/ui/charts` (si composants internes retenus)                                             | nouveau                    | 2                 |
| Ports + stores + adapters + contrats par domaine                                                    | application/infrastructure | 1                 |
| Pages backoffice : Équipe & rôles, Fonctionnalités, Laboratoire, Organisation, Publicité, Analytics | interface                  | 2–3, 6–10         |
| Règles de base + registre serveur des nouvelles collections                                         | infrastructure             | au fil des phases |

### 27. Risques transversaux

1. **Migration des données** (ingrédients → hiérarchie, frigo → entrées) : le risque
   n°1 — contenu par réversibilité, aperçu avant application et double exécution du
   moteur.
2. **Double consommation de stock** : couverte par l'allocation déterministe et ses
   tests dédiés.
3. **Sur-dimensionnement** : rien de commercial ni publicitaire avant les portes de
   passage ; les frontières suffisent.
4. **Complexité du paramétrage** : contenue par les deux niveaux et les garde-fous.
5. **Performance** : contenue par les budgets et les tests de charge en critère de
   phase.
6. **Budget zéro** : aucune brique n'exige un service payant ; les portes futures
   (paiement, scan photo, recherche hébergée à 50 000 recettes) restent facultatives
   derrière des ports.
7. **Sur-ingénierie** : chaque abstraction, module et mécanisme doit avoir une
   justification concrète ; une architecture experte mais **pragmatique**, adaptée aux
   moyens réels du projet — vérifié en revue de chaque phase.

### 28. Décisions ouvertes (statuts de la revue)

| Décision                                               | Statut                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle ingrédients (une entité + `variant_of` ou deux) | Ouverte — phase 5b, audit + tests comparatifs                                                                                                                   |
| Synchronisation du frigo                               | **Orientation validée** — étendre le CRDT si les tests de concurrence le valident                                                                               |
| Matching générique/variante                            | **Principe validé** — la précision demandée par la recette prime                                                                                                |
| Conversions dans les courses                           | **Orientation validée** — conditionnements distincts quand la nature diffère (conditionnement commercial ≠ variante culinaire)                                  |
| Profondeur de la hiérarchie                            | 3 recommandés, pas de limite artificielle si les besoins le justifient — confirmé en 5b                                                                         |
| Seuils de fiabilité                                    | **Validé** — définis depuis le corpus, jamais arbitrairement                                                                                                    |
| DLC / DDM                                              | **Arbitré** — un champ `expires_at` accompagné de `expiry_type: 'DLC' \| 'DDM'` (§ 8)                                                                           |
| Réservation du stock                                   | **Arbitré (précisé v12)** — deux modes **exclusifs** : quantitative (`reserved_quantity`) quand la quantité est connue, entrée entière (`reserved`) sinon (§ 8) |
| Héritage des règles génériques                         | **Arbitré** — explicite, configurable, désactivable ; une règle de variante remplace ou restreint la règle du générique (§ 7.5)                                 |
| Portions réduites                                      | **Arbitré** — intégrée au nouveau moteur ; trois faisabilités distinguées, recette originale jamais modifiée (§ 12)                                             |
| Saisie des quantités                                   | **Arbitré (v10)** — **jamais obligatoire** ; mode simple (présence seule) et mode avancé (quantités) (§ 8, § 12)                                                |
| Ingrédients de base (placard)                          | **Arbitré (v10, précisé v11)** — présence habituelle (jamais illimitée), épuisé temporaire + réactivation en un geste, sans quantités (§ 8)                     |
| Présence seule entre plusieurs lignes                  | **Précisé (v11)** — stock inconnu partagé : incertitude conjointe explicite, jamais une faisabilité vérifiée (§ 12)                                             |
| Suggestions individuelles                              | **Précisé (v11)** — évaluation par recette, limite expliquée à l'utilisateur ; allocation globale réservée à la planification future (§ 12, § 29)               |
| Détection photo                                        | **Précisé (v11)** — l'IA **propose**, seul l'utilisateur **confirme** ce qui entre dans le frigo (§ 8, § 17)                                                    |
| Stock permanent + entrées physiques                    | **Précisé (v12)** — les entrées physiques portent les quantités ; le permanent reste qualitatif, rien n'est réinventé à l'épuisement (§ 8)                      |
| Verdicts après achat / partiellement                   | **Précisé (v12)** — conditions et priorité déterministes : forme d'abord, puis quantités ; « sous réserve » indépendant du verdict (§ 12)                       |
| Séquençage de la migration SQL                         | **Précisé (v12)** — phase 1 = mécanismes ; migration définitive des données métier en 6a, après stabilisation des modèles (§ 4)                                 |
| Simulation globale asynchrone                          | **À mesurer** — gestion persistante des tâches (§ 14), bascule déterminée par des mesures réelles (§ 15), tranchée en 6b                                        |
| Périmètre mobile du laboratoire                        | **Résolu (v8)** — parité fonctionnelle mobile/desktop, présentation adaptée                                                                                     |
| Analytics                                              | **Validé** — liste fermée d'événements, collecte, consentement et rétention documentés (§ 22)                                                                   |
| Maquettes                                              | **Validé** — prototypes actuels comme direction, finalisation des écrans en phase 2                                                                             |
| Plan directeur                                         | **Validé sous réserves** — la V12 intègre les clarifications de la revue ; vérification finale avant définition de la phase 0/1                                 |

### 29. Volontairement pas implémenté

Réservations automatiques menu ↔ frigo (marqueur manuel d'abord, lien automatique avec
le menu plus tard), **planification des repas avec allocation globale du stock entre
plusieurs recettes préparées ensemble** (les suggestions restent individuelles,
§ 12 ; la planification future réutilisera la même fonction d'allocation), détection
de péremption par photo, apprentissage automatique des règles, IA décisionnaire,
commerce et commandes, abonnements, ciblage publicitaire individuel, extraction de
services.

## PARTIE VII — Méthodologie, qualité et vérifications

### 30. Méthodologie de réalisation et de validation

**Avant toute modification du code** : finaliser le plan directeur consolidé (fait —
ce document) ; vérifier que toutes les fonctionnalités existantes sont prises en compte
(§ 3) ; identifier les décisions architecturales ouvertes (§ 28) ; définir précisément
les objectifs, le périmètre et les critères d'acceptation de chaque phase ; identifier
les dépendances entre phases ; définir tests, stratégies de migration et de retour
arrière.

**Boucle de chaque phase** : audit de l'existant concerné → composants à
**conserver / modifier / remplacer / supprimer** → architecture cible → stratégie
d'implémentation → développement progressif → **nettoyage et refactorisation des
composants concernés (§ 31)** → tests des fonctionnalités existantes et nouvelles →
performance et sécurité → **tests du back-office sur mobile et desktop** →
documentation des résultats et des réserves → validation avant la phase suivante quand
prévu.

**Aucune modification du code sur la seule base de ce document** : les phases et leurs
spécifications sont validées avant leur exécution.

### 31. Qualité du code : exigence permanente

Règle transversale pour **toutes** les phases — pas une phase ponctuelle de nettoyage.
Objectif : un code de niveau professionnel, structuré au niveau attendu d'un
architecte logiciel expérimenté.

**Attendu** : supprimer le code mort, les fonctions inutilisées, les mécanismes
abandonnés et les dépendances devenues inutiles ; éliminer les duplications ;
factoriser les traitements communs **au bon niveau, sans abstraction artificielle** ;
respecter strictement les responsabilités de chaque module et couche ; éviter les
composants volumineux et les fonctions surchargées à responsabilités multiples ;
contrats clairs entre domaines ; réutilisation et composition plutôt que duplication ;
séparation des responsabilités, cohésion, faible couplage ; **pas de dépendances
circulaires ni d'accès directs au stockage** ; noms explicites, types cohérents,
constantes centralisées quand pertinent ; erreurs, validations et cas limites traités ;
standards de sécurité ; **tests pertinents pour sécuriser chaque refactorisation** ;
commentaires obsolètes supprimés, décisions architecturales réellement utiles
documentées.

**Deux extrêmes évités** : conserver du mauvais code par peur de toucher à l'existant ;
refactoriser massivement sans justification au risque de casser du fonctionnel. Chaque
nettoyage est **justifié, testé et progressif**.

**Prudence avant toute suppression** : distinguer le code réellement inutilisé du code
utilisé **indirectement, dynamiquement ou par configuration** (registres, URLs,
sérialisation, instantanés) — vérifié par recherche d'usage puis par les tests, avant
de retirer quoi que ce soit.

**Pragmatisme** : chaque abstraction, chaque module, chaque mécanisme doit avoir une
**justification concrète** — une architecture experte mais pragmatique, performante et
adaptée aux moyens réels du projet. La sur-ingénierie est traitée comme un risque à
part entière (§ 27) et vérifiée en revue de chaque phase.

### 32. Contrôle de la consolidation (checklist de la revue)

| Exigence de la revue                                        | Réponse dans ce document                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Le moteur répond aux problèmes identifiés dans l'existant   | Table limite → réponse, § 9                                       |
| Substitutions contextuelles et exceptions correctes         | § 7.5 et § 10 (priorité, prudence, exemple de référence)          |
| Règles métier configurables quand les capacités existent    | § 13 (deux niveaux d'évolution, liste configurable)               |
| Simulations valident les règles avant publication           | § 14 (laboratoire, portes de publication)                         |
| Asynchrone seulement quand utile, seuil mesuré              | § 14 et § 15 (protocole, jamais arbitraire)                       |
| Parité fonctionnelle mobile/desktop du back-office          | § 5 (nouveauté v8 — présentation adaptée, capacités équivalentes) |
| Évolutions anticipées sans implémentation prématurée        | § 21 (couture entitlement), § 24 (frontières commerce)            |
| Nettoyage et factorisation intégrés à toutes les phases     | § 30–31 (boucle de phase, exigence permanente)                    |
| Performance, sécurité, fiabilité, maintenabilité = critères | § 25 (critères consolidés de chaque phase)                        |

**Contradiction résolue dans cette version** : la v7 limitait la comparaison de
configurations du laboratoire au desktop ; la **parité fonctionnelle mobile/desktop**
est maintenant la règle — la comparaison reste une vue conçue pour l'écran large,
**accessible et utilisable sur mobile** avec une présentation adaptée. Implication :
itération de conception mobile du laboratoire ajoutée à la phase 2 (consignée dans ses
critères de passage).

**Corrections intégrées dans la v9** (revue de la v8) : réservation quantitative +
`expiry_type` dans le frigo (§ 8) ; héritage explicite des règles génériques (§ 7.5) ;
`substitutes` subordonné aux règles centrales (§ 7.3) ; pertinence avant vitesse —
pas d'arrêt anticipé prématuré, comparaison à l'exécution de référence (§ 15) ;
fiabilité des tâches asynchrones persistantes (§ 14) ; invariant du dernier super
administrateur sous verrouillage + test de concurrence (§ 5) ; portions réduites
arbitrées et intégrées (§ 12) ; environnement de mesure précisé, conflits de règles de
même priorité définis, fusion avec prévisualisation + confirmation, modalités
d'analytics précisées, parité vérifiée aussi pour les opérations complexes (§ 5, § 10,
§ 7.4, § 22).

**Corrections intégrées dans la v10** (revue de la V9) : **quantité jamais
obligatoire** — deux modes simple/avancé, la présence seule suffit et ne bloque jamais
une recette pour insuffisance (§ 8, § 12) ; qualificatif « sous réserve de vérifier la
quantité de X » (§ 12) ; **ingrédients de base du placard** en stock permanent déclaré
une fois, réservé aux bases et épices (§ 8) ; réservation facultative, quantitative ou
entrée entière sans quantité inventée (§ 8) ; **origine obligatoire** des entrées
(manuel, photo, import), la présence détectée par photo vaut disponibilité (§ 8, § 17) ;
états du stock distingués du niveau de ligne (§ 12) ; corpus étendu aux frigos sans
quantités et au stock permanent (§ 16).

**Clarifications intégrées dans la v11** (revue de la V10) : **présence seule et
stock partagé** — plusieurs lignes du même ingrédient sans quantité connue portent une
incertitude **conjointe** explicite, jamais une faisabilité vérifiée (§ 12, § 16) ;
**suggestions individuelles** — chaque recette évaluée comme si le stock lui était
dédié, limite expliquée à l'utilisateur, allocation globale réservée à la
planification future (§ 12, § 29) ; **stock permanent** — présence habituelle, jamais
illimitée, état temporairement épuisé + réactivation en un geste sans quantités (§ 8) ;
**détection photo** — l'IA propose, seul l'utilisateur confirme ce qui entre dans le
frigo (§ 8, § 17). Vérifié : aucune contradiction avec les verdicts (§ 12), le corpus
(§ 16), les règles du frigo (§ 8) ni la roadmap (§ 25).

**Clarifications intégrées dans la v12** (revue de la V11) : **cohérence des
réservations** — la contradiction § 8 / § 28 corrigée : deux modes **mutuellement
exclusifs** avec validations anti-états incohérents (§ 8, § 28) ; **permanent +
entrées physiques** — les entrées physiques portent les quantités, le permanent reste
qualitatif, rien n'est réinventé à l'épuisement ou la suppression (§ 8) ; **verdicts
« après achat » / « partiellement réalisable »** — conditions et priorité
déterministes (forme d'abord, puis quantités), exemples, « sous réserve » déclaré
indépendant du verdict principal (§ 12) ; **séquençage de la migration SQL** — phase 1
valide mécanismes et domaines stables, migration définitive des données métier
reportée à 6a après stabilisation des modèles, Firestore reste source de vérité
jusqu'à la bascule (§ 4, § 25).
