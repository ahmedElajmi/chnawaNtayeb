# 18 · CMS : atelier, validation, publication (conception validée — évolution cms-staged-online)

> **Transfert Étape C** : contenu intégral de `docs/encyclopedie/18-cms-experiences.md`, chemins de renvoi mis à jour. Source transférée intégralement ici, puis supprimée au nettoyage autorisé (non-perte : copie intégrale vérifiée). Cibles atelier/CMS du 14 (thèmes, réglages du moteur hors workflow case par case, textes du CMS) : voir `docs/solution/atelier-edition.md` (en vigueur) et la section périmètre ci-dessous.
> Le document d'origine suit avec son titre et sa structure d'origine, conservés tels quels (niveaux de titres compris).

# 18. Architecture cible — CMS et gestion des expériences

**Statut** : architecture **clôturée** — direction générale, huit décisions structurantes et clarifications
techniques **validées par le chef**. L'intégration dans le plan de réalisation (amendement) est présentée
pour validation. Aucun développement lancé : ce document définit **la cible**, pas l'implémentation.

Ce document répond à l'évolution de la vision du CMS : permettre aux collaborateurs de gérer depuis le
back-office l'expérience du site et de l'application avec un maximum de flexibilité, sans intervention
systématique des développeurs, en garantissant performance, sécurité et maintenabilité.

## 18 — CMS et gestion des expériences

> **NATURE DU DOCUMENT (Étape B)** : orientation **validée** mais **cible non implémentée** (lot
> CMS à venir) — jamais des règles en vigueur : le lot CMS n'existe pas encore. Rien à extraire
> vers les documents de domaine à ce stade ; ses principes permanents (performance et
> exploitabilité, § 8) sont déjà couverts par `09-qualite-tests.md` (extraction 17 § 21.11) et
> CLAUDE.md (réflexe de conception n° 1). Les décisions qu'il porte validées sont tracées dans la roadmap (§ 6 bis — retranscription du tableau § 6 du registre, supprimé au nettoyage autorisé).

## 1. Objectif et principes (validés)

1. **Simplicité avant abstractions** : la meilleure architecture répond aux besoins avec le moins de
   complexité nécessaire ; un mécanisme commun pour tous les contenus publiables, jamais une copie par
   domaine ; pas de moteur de règles universel, pas d'injection de code.
2. **Registres fermés** : composants, opérateurs de règles, canaux, types de sections vivent dans le code
   (`src/core`), validés par le cœur — jamais définis en base ; le back-office configure, il ne programme pas.
3. **Règles métier intangibles** : le CMS décide **quoi montrer et à qui**, jamais ce que sont les données ;
   le ciblage (marketing) et les autorisations (RBAC, entitlements) restent deux mécanismes disjoints.
4. **Persistance relationnelle réelle** : aucune entité métier en JSON/JSONB en SQL — tables, colonnes
   typées, clés primaires et étrangères, contraintes, index ; JSON réservé aux API, transport,
   imports/exports, sauvegardes. Compatible Firestore (aujourd'hui) et SQL relationnel (cible) : sémantique
   identique, représentations isolées dans les adaptateurs (contrat DataStore, règle 8 bis des identifiants).
5. **Exigence permanente de performance et d'exploitabilité** (règle 11 du plan § 21) : chaque choix est
   examiné au regard de la latence, du poids, du nombre de requêtes, du cache, des volumes croissants et
   des coûts d'exploitation ; pas de promesse sans mesures ; pas d'infrastructure supplémentaire sans
   justification mesurée.
6. **Données personnelles hors cycle de publication** : frigo, favoris, courses, comptes gardent leur cycle
   propre ; l'échine de publication **refuse** leur abonnement (garde testée).

## 2. Modules cible et responsabilités

| Module                            | Responsabilité unique                                                                              | N'assume jamais                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Échine Staged/Online**          | Cycle de vie commun de tout contenu publiable (§ 4.1)                                              | Connaître un domaine métier         |
| **Résolveur d'expérience**        | Produire le modèle résolu pour (chemin, canal, langue, classe d'audience, instant)                 | Rendre, stocker, valider des droits |
| **Registre de composants**        | Contrat des briques : clé, schéma typé, validateur core, variantes, dépendances, **forme SQL**     | Rendre un composant                 |
| **Pages**                         | Sections ordonnées et typées, traductions ×4, SEO, liens typés                                     | Décider de la visibilité            |
| **Médias**                        | Inventaire réutilisable : url, type, alt ×4, point focal, tags, détection de lien cassé            | Stocker des fichiers                |
| **Thèmes visuels**                | Apparence : tokens (existant `AppTheme`), variantes de composants                                  | Se substituer au ciblage            |
| **Thèmes éditoriaux**             | Composition : gabarits, sections, mises en avant, tris, paramètres propres                         | Contenir du contenu                 |
| **Expériences**                   | Lier thèmes + composition + ciblage + programme + priorité ; surcharges partielles par dimension   | Contenir du contenu                 |
| **Groupes (mécanisme mutualisé)** | Groupes d'employés **et** de clients, adhésions, historique — domaines verrouillés en base (§ 4.2) | Porter des rôles pour les clients   |
| **Rôles & permissions**           | Résolution par groupes, union, refus par défaut (§ 4.2)                                            | Permissions individuelles           |
| **Segments**                      | Critères dynamiques évalués, registre fermé de champs/opérateurs (4.1)                             | Stocker des membres                 |
| **Messages**                      | Référentiel clés ×4 langues, replis existants, rapport des traductions manquantes                  | Contenir de la logique              |
| **Configuration**                 | Flags (4.2), réglages, règles d'affichage — publiables                                             | Remplacer le RBAC ou le métier      |
| **Canaux**                        | Registre web desktop / web mobile (PWA) / natif **réservé** ; adaptations de rendu                 | Dupliquer le contenu                |

## 3. Modèles de données (relationnels, validés)

### 3.1 Identités (vérifié dans le code)

Clients et employés partagent déjà une même entité de profil : `users/{uid}` (champ `type` = `client` |
`employee`, variantes de clients = données), les employés ayant en plus un document `admins/{uid}` ;
`auth` porte les identifiants. Le profil porte un compteur `permissions_revision` (invalidation ciblée
des permissions, § 4.2) ; en SQL, `users` porte un index unique `(id, type)` exploité par les FK composites
(§ 3.2). La mutualisation des groupes référence `users` une seule fois — **aucun
rapprochement artificiel des modèles d'identité**, aucune relation polymorphe.

### 3.2 Groupes, rôles, permissions

```sql
groups ( id PK, domain CHECK (domain IN ('employee','client')), name_fr, name_derja, name_ar,
         name_derja_ar, status CHECK (status IN ('active','disabled')),
         created_by FK→users, created_at,
         permissions_revision BIGINT NOT NULL DEFAULT 0 )  -- invalidation ciblée des permissions (§ 4.2)

-- Appartenance ACTUELLE uniquement ; les FK composites + CHECK verrouillent le domaine EN BASE :
group_members ( group_id, group_domain,   -- FK (group_id, group_domain) → groups(id, domain)
                user_id, user_type,       -- FK (user_id,  user_type)  → users(id, type) [index unique]
                added_by FK→users, added_at,
                CHECK (user_type = group_domain),
                PRIMARY KEY (group_id, user_id) )

-- Historique append-only : ajouts, retraits, réintégrations (qui, quoi, quand, commentaire)
group_membership_events ( id PK, group_id FK, user_id FK,
                          op CHECK (op IN ('added','removed')), actor FK→users, at, comment NULL )

-- Rôles et permissions : domaine EMPLOYÉ exclusif (aucune colonne domaine — implicite)
roles ( id PK, name_fr, name_derja, name_ar, name_derja_ar )
group_roles ( group_id, group_domain,     -- FK (group_id, group_domain) → groups(id, domain)
              role_id FK→roles, granted_by FK→users, granted_at,
              CHECK (group_domain = 'employee'),   -- un groupe client ne peut porter AUCUN rôle
              PRIMARY KEY (group_id, role_id) )
permissions ( id PK, resource, action, scope CHECK (scope IN ('all','own','list')) )
role_permissions ( role_id FK→roles, permission_id FK→permissions, PRIMARY KEY (role_id, permission_id) )
```

**Principes validés** : les rôles sont attribués **exclusivement aux groupes** (aucune permission
individuelle, aucune exception) ; permissions effectives = **union** des rôles des groupes actifs, **refus
par défaut** ; **aucune permission négative** — retirer un droit = retirer un rôle d'un groupe ou un membre
d'un groupe (pas de moteur de résolution de conflits) ; un utilisateur quitte un groupe → permissions
recalculées à la résolution suivante ; groupe désactivé → exclu de la résolution sans supprimer adhésions
ni historique ; anti-élévation (éditer groupes/rôles exige `roles.manage`, mutations journalisées) ;
**garde du dernier super admin** testée en concurrence ; groupes de clients et d'employés = même mécanisme,
domaines séparés par la base, **l'appartenance à un groupe de clients n'accorde jamais de droit
administratif**.

### 3.3 Pages, composants, médias

```sql
-- TOUTE section vit DANS une version de page : les versions publiées sont immuables
-- et reproductibles — restaurer une version relit SES lignes, jamais des lignes courantes.
-- pages ne porte que l'identité stable et le pointeur du STAGE (espace de travail) ;
-- la version publiée est retrouvée via la GÉNÉRATION ACTIVE (§ 3.5) — aucun second pointeur de publication.
pages ( id PK,
        staged_version_id NULL )
        -- FK COMPOSITE (staged_version_id, id) → page_versions(id, page_id) — UNIQUE (id, page_id)
        -- sur page_versions : le stage appartient forcément à SA page (garantie EN BASE).
        -- Règle générale : toute référence vers une version porte l'identifiant du parent et s'appuie
        -- sur une FK composite — aucune version ne peut être associée accidentellement à une autre
        -- entité (pages, recettes, expériences, tous domaines versionnés).
page_versions ( id PK, page_id FK→pages(id), kind CHECK (kind IN ('staged','published')),
                base_revision, created_by FK→users, created_at,
                slug_fr, slug_derja, slug_ar, slug_derja_ar,      -- données éditoriales VERSIONNÉES :
                title_fr, title_derja, title_ar, title_derja_ar,  -- slugs, titres et SEO appartiennent
                seo_title_×4, seo_description_×4 )                -- à la version, pas à la page
-- Unicité des slugs PUBLIÉS, VERSIONNÉE PAR GÉNÉRATION : chaque génération possède son propre
-- ensemble de slugs ; la résolution des URL lit exclusivement l'index de la génération active —
-- cohérence garantie entre contenu publié, slugs, langues et retour à une génération précédente.
generation_slug_index ( generation_id FK→content_generations(id), language, slug,
                        page_id FK→pages(id), PRIMARY KEY (generation_id, language, slug) )
-- alimentée à la PRÉPARATION de la génération (écritures invisibles, idempotentes, dérivées des
-- versions de pages incluses) ; la PK refuse un doublon au sein d'une même génération ; les slugs
-- du stage sont validés par le core, le conflit réel est détecté à la préparation. La bascule de
-- génération reste atomique : le pointeur et l'index de slugs de la génération désignent toujours
-- un ensemble cohérent. `slug_redirects` (301) reste GLOBAL mais pointe l'IDENTITÉ de la page
-- (page_id), jamais un slug figé — la destination canonique est résolue avec l'index de la génération
-- active (§ 3.3-ci-dessous) ; un slug de la génération active est prioritaire sur toute redirection.
page_version_sections ( id PK, version_id FK→page_versions(id), ordre, component_key,  -- registre FERMÉ
                        visibility_rule_id NULL, PRIMARY KEY(id) )

-- Une TABLE PAR COMPOSANT, déclarée par le registre (schéma + validateur + forme SQL dans le même code) :
section_param_recipe_list (
  section_id PK FK→page_version_sections(id) ON DELETE CASCADE,
  mode VARCHAR(8) NOT NULL CHECK (mode IN ('grid','list')),
  limit_count SMALLINT NOT NULL CHECK (limit_count BETWEEN 3 AND 24),
  selection_id UUID NULL REFERENCES selections(id),
  title_fr, title_derja, title_ar, title_derja_ar NOT NULL )   -- contenus localisés typés
```

**Tout le contenu éditorial vit dans la version** : sections, paramètres, **slugs, titres et SEO** —
l'édition du stage modifie les lignes de la version `staged` ; publier = **copier** les lignes staged vers
une nouvelle version `published` (les versions publiées ne sont **jamais mutées**) ; restaurer = copier les
lignes d'une version historique vers une nouvelle version staged — une version publiée ancienne reste
**intégralement reproductible** (sections, paramètres, slugs, titres et SEO proprement les siens) :
la restauration est **complète, pas seulement celle des sections**. **La génération active est la source de
vérité** pour retrouver la version publiée (`publication_pointer → generation_page_items → version_id`) —
`pages` ne porte **aucun second pointeur de publication** ; `staged_version_id` ne pointe que l'espace de
travail, jamais ce qui est publié. Côté Firestore, la version publiée est un **instantané structuré** du
document (sections et métadonnées typées, jamais de JSON libre), même sémantique.

Liens typés par identifiant (jamais d'URL libre), parenté et références croisées. **Redirections SEO —
deux règles** : `slug_redirects` (301) reste **global** (prolongeant le mécanisme `LEGACY_PATHS`) mais
(1) un slug présent dans l'index de la **génération active est prioritaire** sur une redirection ancienne,
et (2) une redirection pointe vers **l'identité de la page** (`page_id`), **jamais vers un slug figé** —
la destination canonique est **résolue avec l'index de la génération active** (slug courant de la page dans
la langue demandée) : une redirection ne devient jamais incorrecte après une modification ou une
restauration de génération. `canonical` = slug de la langue courante, `hreflang` émis depuis les slugs de
la **version publiée**. **Médias** : `media_items` relationnel
(métadonnées) distinct du stockage physique d'objets ; suppression **bloquée** tant que référencé (graphe
de dépendances, rapport explicite).

**Ajout d'un composant** (maîtrisé, quatre étapes) : schéma + validateur + rendu + forme SQL dans le
registre → migration SQL forward **et** retour arrière dans la même évolution → mêmes champs typés côté
Firestore (sémantique identique) → tests de contrat sur les deux adaptateurs.
**Retrait d'un composant — jamais de perte de contenu** : la vérification des références couvre les pages
**publiées, le stage ET toutes les versions historiques** — une seule requête indexée sur
`page_version_sections.component_key` (les versions étant des lignes relationnelles). Tant qu'une version
restaurable référence le composant, il reste **déprécié** (retiré de l'éditeur, conservé en code) ;
suppression physique uniquement à zéro référence, après export de sauvegarde — **aucun retour arrière de
version du code n'entraîne de perte de contenu créé par les employés**. **Conservation des versions
historiques** : conservées **par défaut** (aucune purge automatique) ; un archivage définitif d'anciennes
versions est une **action d'administration explicite**, après export de sauvegarde, jamais automatique —
toute politique de rétention future (volumes mesurés) sera une décision séparée.

### 3.4 Segments (critères dynamiques) — typés, jamais de JSON

```sql
audience_segments ( id PK, name_fr, name_derja, name_ar, name_derja_ar, created_by, created_at )
segment_criteria ( id PK, segment_id FK, field_id,  -- registre FERMÉ de champs typés (4.1)
                   operator,                         -- opérateur du registre fermé
                   value_type CHECK (value_type IN ('text','int','decimal','bool','date','enum')),
                   value_text VARCHAR(255) NULL, value_int BIGINT NULL,
                   value_decimal NUMERIC(12,4) NULL, value_bool BOOLEAN NULL,
                   value_date DATE NULL, value_enum VARCHAR(64) NULL,  -- valeurs validées contre le registre
                   PRIMARY KEY(id),
                   -- exactement UNE colonne de valeur renseignée, conforme au discriminateur :
                   CHECK ( (value_type = 'text'    AND value_text   IS NOT NULL AND value_int IS NULL
                            AND value_decimal IS NULL AND value_bool IS NULL AND value_date IS NULL
                            AND value_enum IS NULL)
                        OR (value_type = 'int'     AND value_int    IS NOT NULL AND value_text IS NULL
                            AND value_decimal IS NULL AND value_bool IS NULL AND value_date IS NULL
                            AND value_enum IS NULL)
                        OR (value_type = 'decimal' AND value_decimal IS NOT NULL AND value_text IS NULL
                            AND value_int IS NULL AND value_bool IS NULL AND value_date IS NULL
                            AND value_enum IS NULL)
                        OR (value_type = 'bool'    AND value_bool   IS NOT NULL AND value_text IS NULL
                            AND value_int IS NULL AND value_decimal IS NULL AND value_date IS NULL
                            AND value_enum IS NULL)
                        OR (value_type = 'date'    AND value_date   IS NOT NULL AND value_text IS NULL
                            AND value_int IS NULL AND value_decimal IS NULL AND value_bool IS NULL
                            AND value_enum IS NULL)
                        OR (value_type = 'enum'    AND value_enum   IS NOT NULL AND value_text IS NULL
                            AND value_int IS NULL AND value_decimal IS NULL AND value_bool IS NULL
                            AND value_date IS NULL) ) )
```

Bornes 4.1 : ≤ 30 critères par segment, profondeur ≤ 4 ; cohérence champ/type/opérateur garantie deux fois
(validateur du core + contraintes SQL) ; administrables en back-office, formulaire généré du registre.

### 3.5 Publication par génération

```sql
content_generations ( id PK, status CHECK (status IN ('preparing','ready','active','abandoned')),
                      created_by FK→users, created_at,
                      base_generation_id BIGINT NULL REFERENCES content_generations(id) )
                      -- la génération ACTIVE sur laquelle celle-ci a été construite
publication_pointer ( scope PK, active_generation_id REFERENCES content_generations(id) )

-- Références TYPÉES par domaine (FK réelles — jamais d'item_id polymorphe) : les versions de chaque
-- domaine sont des tables d'historique à colonnes typées, et le contenu d'une version est lui-même
-- relationnel (pages : § 3.3 ; recettes : recipe_versions avec les mêmes colonnes typées que recipes…).
-- FK COMPOSITE : la table des versions porte UNIQUE (id, <contenu>_id), donc la FK (version_id,
-- <contenu>_id) garantit EN BASE que la version appartient au contenu référencé — une ligne ne peut
-- pas associer la page A à une version de la page B ; standard SQL, portable :
generation_page_items   ( generation_id FK→content_generations(id), page_id FK→pages(id),
                          version_id,   -- FK (version_id, page_id) → page_versions(id, page_id)
                          PRIMARY KEY (generation_id, page_id) )
generation_recipe_items ( generation_id FK→content_generations(id), recipe_id FK→recipes(id),
                          version_id,   -- FK (version_id, recipe_id) → recipe_versions(id, recipe_id)
                          PRIMARY KEY (generation_id, recipe_id) )
generation_experience_items ( generation_id FK→content_generations(id), experience_id FK→experiences(id),
                              version_id,   -- FK (version_id, experience_id) → experience_versions(id, experience_id)
                              PRIMARY KEY (generation_id, experience_id) )
-- … une paire (versions + items) par domaine publiant en groupe (ingrédients, menus, thèmes,
-- messages, configurations) ; un domaine sans publication groupée n'a ni l'une ni l'autre.
-- Les EXPÉRIENCES publient par ce même mécanisme (§ 3.6) — pas de second système de publication.
```

Cohérence des publications groupées **sans transaction multi-collections** (non portable) : préparer des
versions immuables (écritures indépendantes, idempotentes, invisibles) → vérifier le graphe de dépendances
(dépendance critique absente = blocage) → **activer par une seule écriture atomique du pointeur** ;
les lecteurs résolvent `pointeur → génération → versions` (copy-on-write, éléments inchangés réutilisés).
Publication individuelle = génération de taille 1 — **un seul mécanisme**.

- **Initialisation explicite** : à l'initialisation, une **génération 0 vide** est créée et le pointeur la
  référence — **aucun NULL dans la garde** (`active_generation_id` toujours défini) ; la première
  publication utilise la génération 0 comme base ; les activations concurrentes de la première génération
  sont départagées par la même garde optimiste — **testées**.
- **Concurrence** (garde optimiste) : une génération mémorise sa `base_generation_id` ; l'activation vérifie
  **dans la même écriture atomique** que le pointeur pointe encore sur cette base — Firestore : transaction
  sur le document pointeur ; SQL : `UPDATE publication_pointer SET active_generation_id = :new WHERE scope =
:s AND active_generation_id = :base` (zéro ligne modifiée = refus). Refus → reprise du delta (éléments
  publiés entre-temps repris de leur nouvelle version), **jamais d'écrasement silencieux**.
- **Échec partiel / reprise** : le pointeur ne bascule qu'une fois le lot `ready` ; échec en préparation →
  génération `abandoned`, aucun effet visible, relance sans danger ; le balayage reprend les `preparing` ;
  une `ready` non activée après délai est **signalée au back-office** (choix humain, jamais d'activation
  automatique tardive) ; publication programmée = balayage minute idempotent, reprise après redémarrage.
- **Retour arrière** : repointer vers la génération précédente (une écriture).
- **Volume — une publication logique = UNE activation** : le **≤ 100 éléments** est un **seuil de
  performance de préparation** (coût linéaire, activation O(1)), pas une limite de publication ; une
  publication logique plus grande est **refusée proprement** (rapport explicite, proposition de découpage
  en publications logiquement indépendantes, chacune cohérente) — **jamais de découpage automatique en
  plusieurs activations visibles** : les utilisateurs ne voient jamais d'état intermédiaire d'un même lot.

### 3.6 Expériences et ciblage

```sql
-- Les EXPÉRIENCES suivent le MÊME cycle Staged/Online que toute entité publiable (§ 4.1, § 3.5) :
-- la définition est versionnée, le stage est l'espace de travail, la génération active porte la
-- version publiée — UNE modification en stage ne change JAMAIS l'expérience visible tant que la
-- publication n'est pas activée.
experiences ( id PK,
              staged_version_id NULL,   -- FK (staged_version_id, id) → experience_versions(id, experience_id)
              status CHECK (status IN ('draft','scheduled','active','archived')) )
experience_versions ( id PK, experience_id FK→experiences(id),
                      kind CHECK (kind IN ('staged','published')),
                      base_revision, created_by FK→users, created_at,
                      name_fr, name_derja, name_ar, name_derja_ar,
                      priority INT NOT NULL, starts_at NULL, ends_at NULL,   -- dates et activation
                      visual_theme_id NULL FK, editorial_theme_id NULL FK,
                      overrides…, conditions d'affichage… )   -- TOUT versionné, colonnes typées
                      -- UNIQUE (id, experience_id) → FK composites des associations ci-dessous
-- Surcharges PARTIELLES : chaque dimension est facultative (thème visuel, thème éditorial,
-- composition de page, messages) ; au moins une dimension surchargée
-- Associations de ciblage RATTACHÉES À LA VERSION (le ciblage publié ne change pas au stage) :
experience_version_group_audiences ( experience_version_id, group_id, group_domain,
                                     mode CHECK (mode IN ('include','exclude')),
                                     -- FK (group_id, group_domain) → groups(id, domain) + garde EN BASE :
                                     CHECK (group_domain = 'client'),   -- jamais un groupe d'employés
                                     -- FK (experience_version_id, experience_id) → experience_versions(id, experience_id)
                                     PRIMARY KEY (experience_version_id, group_id) )
experience_version_segment_audiences ( experience_version_id, experience_id, segment_id,
                                       mode CHECK (mode IN ('include','exclude')),
                                       -- FK (experience_version_id, experience_id) → experience_versions(id, experience_id)
                                       PRIMARY KEY (experience_version_id, segment_id) )
```

**Deux tables d'association distinctes, rattachées à la VERSION de l'expérience** (FK réelles et
composites — jamais de référence polymorphe). **Les deux erreurs croisées sont impossibles en base**, par
garde symétrique : `group_roles` interdit un rôle à un groupe **client**,
`experience_version_group_audiences` interdit un groupe **employé** dans le ciblage — une erreur de
configuration ne peut pas cibler une expérience publique depuis un groupe d'employés. Cinq dimensions
séparées : thème visuel / thème éditorial / règles d'affichage / ciblage
d'audience / canal. **Résolution déterministe** : éligibilité par expérience (statut ∧ fenêtre ∧ audience ∧ canal ∧
langue) ; par dimension, l'expérience éligible **la plus prioritaire** gagne ; pas de gagnant → repli sur le
défaut ; départage **stable par identifiant** (jamais `updated_at`) ; **avertissement back-office** en cas
de conflit de priorité entre expériences compatibles ; tests : expériences concurrentes, priorités égales,
surcharges partielles, fenêtres entrantes/expirées. Une expérience type **Ramadan** est 100 % donnée :
création, programmation, priorité, repli automatique — sans code ni déploiement.

**Ciblage — trois régimes d'évaluation** : critères simples à la requête (session, canal, langue, fenêtre,
entitlement — négligeable) ; **adhésions manuelles** par lecture indexée de `group_members` ; **indicateurs
métier = agrégats préparés** (mécanisme 9.2 : agrégats quotidiens exposés comme faits indexés — jamais
d'agrégation à l'affichage ; fraîcheur quotidienne, borne assumée et affichée dans l'éditeur). Combination
au niveau du ciblage : union des inclusions moins les exclusions (`exclusion > inclusion`), déterministe.

**Isolation des utilisateurs** : la classe d'audience est calculée **côté serveur** à chaque requête depuis
la session authentifiée (uid → faits métier via ports) ; le client n'envoie jamais sa classe, aucune API ne
permet d'en demander une autre ; la simulation/persona est un endpoint réservé aux permissions de
simulation ; le CMS n'accorde ni n'élargit aucun droit — l'accès aux données passe toujours par les
contrôles métier.

> **Note de cohérence (orientation multilingue validée)** — `docs/evolutions/experience-utilisateur/i18n-dynamique/evolution.md` :
> le chef a validé des **tables de traduction relationnelles par entité réellement localisable**
> (`recipes`+`recipe_translations`, …), **sans JSON ni EAV ni table universelle**, et un **registre
> centralisé des langues en base** (ajout/activation/désactivation depuis le backoffice, sans modifier le
> schéma SQL, les composants ni les formulaires). Les **colonnes localisées fixes** de ce document
> (`slug_×4`, `title_×4`, `seo_×4` dans `page_versions` et `section_param_*`) sont **en tension** avec
> cette orientation : les options (a) table de traduction de version alignée sur le pattern des entités ou
> (b) conservation ciblée des colonnes fixes pour les pages seront **arbitrées au dossier du lot CMS**
> (arbitrage A1 du document d'orientation — aucune des deux n'est pré-validée). `generation_slug_index`
> (déjà dimensionné par `language`) reste compatible telle quelle.

## 4. Mécanismes (validés)

### 4.1 Échine Staged/Online

Un service transversal ; chaque domaine publiable **s'abonne** (collections, dépendances, hook
d'invalidation) — l'échine ignore les domaines. **Stage partagé** (ni brouillon individuel, ni document
géant unique) : par contenu publiable, un stage accessible aux employés autorisés ; écriture entière gardée
par la révision de base — divergence → **avertissement avec comparaison et choix explicite**, jamais
d'écrasement silencieux, jamais de fusion automatique. Chaque action (édition, validation, **refus**,
publication, restauration) journalisée avec auteur, horodatage, commentaire. **Cinq droits distincts**
(`view`, `edit`, `validate`, `publish`, `restore`) résolus par le RBAC, vérifiés serveur **et** base ; refus
journalisés. Versions immuables à chaque publication ; **restauration → stage par défaut** (repassant par la
validation) ; « restaurer + publier » = action distincte exigeant `restore` + `publish` ; l'historique n'est
jamais réécrit. **Migration de l'atelier actuel** (`@/core/review`) vers le stage partagé = évolution
distincte (lot 4.6 du plan), gardes conservées à l'identique, suite de non-régression dédiée.

**Firestore : règles de sécurité vs contrôles serveur** — le SDK Admin contourne les règles : les écritures
back-office (via serveur) sont gardées **dans le serveur** (vérification systématique des droits, journal,
RBAC) ; les règles Firestore protègent les chemins client (sync frigo, lecture publique). Les deux niveaux
sont distincts et testés séparément.

### 4.2 Permissions — cohérence et invalidation ciblée

**Trois compteurs de révision** (pas de compteur global) :

| Mutation                             | Compteur                                                                                 | Effet                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Adhésion/retrait d'un utilisateur    | `users.permissions_revision` (sur le profil, lu à chaque requête authentifiée)           | Recalcul des permissions de **cet utilisateur**   |
| Rôle ajouté/retiré à un groupe       | `groups.permissions_revision` (sur le groupe)                                            | Les membres du groupe la voient au calcul suivant |
| Permission ajoutée/retirée à un rôle | `groups.permissions_revision` des groupes portant ce rôle (peu nombreux, même opération) | Propagation par les groupes                       |

Clé de cache = `(révision utilisateur, révisions des groupes dont il est membre)` — vérification **paresseuse
à la lecture** (quelques compteurs indexés), recalcul si la clé a changé. Le cache n'est qu'une
**optimisation de rendu**. **Garantie de cohérence — l'autorisation et la mutation protégée sont liées, avec
des mécanismes distincts par fournisseur** :

- **Firestore** : `runTransaction` est **optimiste de bout en bout** — si un document lu (profil, adhésions,
  révisions de groupes) change entre la lecture et le `commit`, la transaction est **rejouée ou annulée** :
  la décision de droits est toujours prise sur un état non obsolète, par construction ;
- **SQL** : une transaction classique ne suffit pas (l'isolation et les verrous dépendent du moteur) — la
  transaction de mutation **verrouille les lignes dont dépendent les droits** : `SELECT … FOR UPDATE` sur la
  ligne `users` (compteur de révision) et sur les lignes `groups` membres — supporté par PostgreSQL, MySQL,
  SQL Server ; une révocation concurrente **bloque jusqu'au commit** ou s'exécute après, jamais entre la
  lecture et l'écriture ; **SQLite** : un seul rédacteur à la fois (sérialisation par le verrou d'écriture
  de la base) — la même transaction est sûre par construction ;
- **Une relecture des permissions hors de la transaction de mutation n'est pas une garantie** (un droit peut
  être retiré entre la lecture et l'écriture) : elle ne sert qu'à l'affichage, jamais à autoriser une
  écriture.

**Test réel, sur les deux adaptateurs, avec deux opérations réellement concurrentes** : un administrateur
retire un droit pendant qu'une autre opération tente de publier ou de modifier des données → le résultat
reste correct (mutation rejetée, ou appliquée avec les droits frais en cas de rejeu Firestore) — scénario
**exécuté, pas simulé**, comportement vérifié séparément pour chaque garantie Firestore et SQL.

**Protocole commun à toute opération modifiant les droits effectifs** (groupes, rôles, permissions,
appartenances d'employés aux groupes) : vérification + écriture **dans la même transaction**, avec
verrouillage des lignes de révision concernées ; **ordre de verrouillage fixe** (`users` → `groups` →
`roles`/`permissions`, du parent vers l'enfant) pour éviter les interblocages ; les compteurs concernés
sont incrémentés **dans la même transaction**.

**Garanties démontrées vs conçues — aucune garantie présentée sans test sur le moteur concerné** :

- **démontré aujourd'hui (SQLite, lot 1.4)** : la **contention générique du DataStore** (deux connexions
  réelles, sérialisation des écritures, rejeux de transaction) est **exécutée** — elle démontre que le
  stockage sérialise les écritures concurrentes, **pas encore** le protocole de sécurité des droits ;
- **à écrire** : les scénarios **spécifiques aux droits** (retrait d'un droit pendant une mutation
  protégée, double suppression du dernier super admin, mutation de groupe pendant un calcul de
  permissions) seront **écrits avec le protocole documenté ci-dessus** dans les lots qui implémentent ces
  opérations (3.x, 4.3) — ils ne sont **pas** présentés comme déjà validés ;
- **conçu, non démontré (PostgreSQL, MySQL, autres moteurs)** : sémantique `SELECT … FOR UPDATE`, ordre de
  verrouillage, niveaux d'isolation — validés **uniquement** par la suite de tests du moteur lorsqu'un
  autre moteur SQL sera retenu (règle établie : un dialecte implémenté n'est jamais une preuve de
  compatibilité) ;
- **Firestore** : garantie **par construction** du `runTransaction` optimiste (rejeu/annulation), vérifiée
  par le test de concurrence à deux opérations (à écrire avec les scénarios de droits).

### 4.3 Architecture des caches — quatre niveaux explicites

**A. Cache serveur** — mémoire du processus Node.js (`Map` ou LRU borné) : contenu CMS résolu, thèmes,
expériences, configurations et messages éditoriaux ; **taille maximale configurable**, expiration par
événement temporel, invalidation ciblée (dépendances réelles) et **surveillance de la cardinalité des
variantes** ; **local à chaque instance — aucune garantie de partage entre plusieurs instances**.

**B. Cache HTTP** — `Cache-Control`, `ETag` (et éventuellement `Last-Modified`) pour éviter les
téléchargements inutiles ; **les données personnalisées ne sont jamais servies à un autre utilisateur par
un cache partagé** (`Cache-Control: private`, `no-store` pour les données personnelles) — les couches
partagées ne reçoivent que des réponses de classe publique.

**C. Cache client (IndexedDB)** — contenus nécessaires à l'application et à son fonctionnement hors ligne
(`LocalCollectionCache` existant) ; les **données personnelles opérationnelles** (frigo, listes de courses)
**ne passent pas par les caches CMS** : ce sont des données personnelles, pas des contenus CMS — elles
gardent leurs mécanismes de synchronisation existants (`KitchenSync`).

**D. Cache PWA** (Service Worker + Cache Storage) — application, fichiers JS/CSS, icônes, ressources
statiques et éléments du fonctionnement hors ligne ; **fallback cohérent** en cas d'indisponibilité du
réseau (mode dégradé : messages essentiels + accueil caché).

**Pas de Redis à ce stade** : il ne sera étudié que si des mesures démontrent un besoin réel de cache
partagé, de synchronisation entre instances ou de capacité mémoire supplémentaire.

**Clés et invalidation — cohérence de la génération sans invalidation massive** :

- la clé porte les **versions des objets réellement utilisés** (identifiant de version de page, révision de
  message, révision de thème…) et **jamais une révision globale de collection** — une modification isolée
  ne doit pas rendre périmé tout un chemin ;
- **trois rôles distincts** : (1) la **clé** identifie exactement le contenu servi ; (2) l'**invalidation
  active** suit les **dépendances réelles** — le graphe désigne les entrées qui ont déclaré l'objet
  modifié, **et elles seules** ; (3) les **compteurs de révision par collection** ne sont qu'un **filet de
  détection de périmé** (revalidation paresseuse à la lecture), jamais un moteur d'invalidation massive ;
- **la génération n'invalide pas tout** : une publication réutilise les versions inchangées
  (copy-on-write) — **la plupart des entrées survivent à la bascule** ; une entrée enregistre la génération
  dont elle provient et, à la relecture, vérifie que **ses versions appartiennent toujours à la génération
  active** (contrôle bon marché) : oui → servie, non → recalculée — **jamais de mélange de contenus de
  générations différentes** ; **lecture cohérente** : chaque requête lit **une seule fois** le pointeur de
  génération et sert à partir de cet instantané — la vérification d'appartenance des versions et la
  restitution du contenu partagent la **même lecture** du pointeur ; une publication concurrente entre-temps
  ne peut pas faire servir une entrée devenue invalide : elle ne s'applique qu'aux requêtes suivantes
  (aucune architecture de cache supplémentaire) ;
- la **classe d'audience** fait partie de la clé et les réponses personnalisées sont `private` — **aucune
  fuite entre audiences ou utilisateurs** ;
- **classe d'audience : une borne à contrôler, pas une promesse** — la cardinalité **peut croître** avec
  les groupes manuels et les segments ; le back-office surveille le nombre de classes actives et la taille
  des entrées, **alerte** au-delà d'un seuil configurable, et impose la reformulation en segments si la
  cardinalité devient excessive (ex. un groupe par client) ;
- **expiration temporelle exacte** : à l'écriture, chaque entrée calcule **le prochain événement temporel**
  qui peut changer son résultat (début/fin de fenêtre d'expérience, publication programmée du chemin) et
  expire exactement à cette date.

**Hors ligne** : la dernière expérience publiée est rendue depuis le cache ; le CMS n'introduit **aucune
file d'écriture hors ligne** (lecture seule du publié) ; la sync frigo/courses garde ses mécanismes
existants.

### 4.4 Messages — un mécanisme i18n unique, deux sources (harmonisé)

> **Harmonisation (orientation multilingue validée)** — `docs/evolutions/experience-utilisateur/i18n-dynamique/evolution.md` § 6 :
> le chef a validé un **mécanisme i18n unique pour toute l'interface** — **les catalogues dynamiques en
> base sont la source actualisée de tous les textes** (structurels, fonctionnels, techniques, essentiels),
> **versionnés par langue, mis en cache IndexedDB et actualisés atomiquement en ligne, sans rechargement** ;
> **le bundle initial fournit le fallback embarqué des messages essentiels** (l'application doit toujours
> pouvoir afficher un message compréhensible, même sans catalogue distant). L'ancienne formulation
> « les messages techniques essentiels restent dans le bundle et ne dépendent jamais du CMS » est
> **remplacée** par ce principe : les messages essentiels _tirent aussi_ du catalogue dynamique, le bundle
> n'est plus que leur **secours**. L'ajout d'une langue ne nécessite aucun redéploiement frontend.

**Catalogues dynamiques** : en base, publiables par l'échine (workflow de validation), versionnés par
langue, cachés hors ligne (dernière version valide, IndexedDB) ; **codes d'erreur stables côté backend**
(`infra.*`, codes de domaine), traduits côté frontend. **Fallback embarqué** : messages essentiels dans le
bundle initial (hors ligne garanti), consultés lorsque le catalogue actif n'est pas disponible. Replis =
chaîne `LANGUAGES.fallback` existante (référence finale : français) ; **rapport « traductions
manquantes »** dans le back-office (par clé, par langue) ; le contrôle automatisé « zéro texte en dur »
(extension du lot 4.4) concerne les **textes métier et éditoriaux** — les **messages essentiels** sont
couverts par le mécanisme unique (catalogue + fallback embarqué), jamais par du texte en dur.

### 4.5 Multicanal

Contenu unique, adaptations de rendu par canal/viewport déclarées par les composants (bornées) ; responsive
= dimension de résolution + CSS des variantes ; le natif lira le **modèle résolu** via `/api/*` (déjà
indépendant du canal) — couture réservée, **aucun développement natif** sans décision explicite du chef.

## 5. Limites initiales (centralisées, testées, réévaluables)

| Limite                            | Valeur             | Justification                                                                                                                                                                                              | Où                    |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Sections par page                 | ≤ 30               | **Estimation initiale** (≈ 3–4 Ko localisés par section → ~120 Ko, marge sur la limite Firestore de 1 Mo) — **à confirmer par un protocole de mesure réel au lot** ; lisibilité d'édition ; temps de rendu | Validateur du core    |
| Critères par segment / profondeur | ≤ 30 / ≤ 4         | Coût d'évaluation, charge cognitive                                                                                                                                                                        | 4.1 + contraintes SQL |
| Éléments par génération           | ≤ 100              | **Seuil de performance de préparation** (coût linéaire, activation O(1)) — au-delà : **refus propre**, jamais de découpage automatique en activations visibles                                             | Échine                |
| Chaînes                           | bornées par schéma | Taille des documents, UX de saisie                                                                                                                                                                         | Validateurs du core   |

Chaque borne vit dans un validateur **testé** ; elles sont des **limites initiales**, réévaluées sur
mesures représentatives — jamais définitives sans justification.

## 6. Décisions validées vs reste à concevoir

| Décisions **validées** (architecture close)                                                                                                                                                                                                                                          | Fonctionnalités **restant à concevoir puis implémenter**                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Échine Staged/Online transversale (stage partagé, versions, journal, cinq droits, concurrence, génération + garde optimiste, programmation, invalidation ciblée)                                                                                                                     | Détails d'interface des éditeurs (pages, expériences, groupes, messages, médiathèque) — maquettes D3/D4/D6                                                    |
| Rôles exclusivement par groupes ; union sans permissions négatives ; domaines verrouillés en base ; historique par événements ; garde dernier super admin                                                                                                                            | Jeux de rôles/permissions finaux et périmètres (conception 2.3, implémentation 3.x)                                                                           |
| Publication par génération, initialisation explicite, garde optimiste, reprise, **une activation par publication logique**                                                                                                                                                           | Registre de composants : liste initiale des composants (héros, texte borné, galerie, liste de recettes, encart marque, CTA, FAQ, contact…) — à définir au lot |
| Table relationnelle par composant ; **tout le contenu éditorial versionné** (sections, paramètres, slugs, titres, SEO ; définition et ciblage des expériences) ; critères de segments typés ; FK réelles et composites (items typés par domaine, ciblage limité aux groupes clients) | Modèle des gabarits de thèmes éditoriaux (schémas fermés) — conception au lot                                                                                 |
| Résolution par dimension, priorité explicite, départage par identifiant, avertissement de conflit                                                                                                                                                                                    | Critères de segments disponibles (faits exposés par les services métier) — à inventorier avec le chef                                                         |
| Deux étages de messages ; ciblage à trois régimes ; cache multicouche ; pas de Redis ; natif différé                                                                                                                                                                                 | Écrans du back-office (2.2/2.3/2.4), éditorial et serving (7.x)                                                                                               |

## 7. Impacts sur le plan de réalisation

Voir l'amendement intégré au plan (`17-plan-de-realisation.md`) : phase 2 (conception CMS intégrée à
2.2/2.3/2.4 — **pas repoussée** à la phase 7), phase 3 (rôles par groupes, écran « Groupes & rôles »,
migration 3.5), phase 4 (4.3 = échine transversale ; **nouveau lot 4.6** : migration de l'atelier vers
l'échine, avec ses tests de non-régression), phase 7 (7.3 étendu : pages CMS, composants, médias, messages ;
7.4 étendu : expériences, thèmes éditoriaux, ciblage groupes/segments ; 9.2 : agrégats exposés comme faits
de ciblage). Aucune phase nouvelle, aucun lot superflu.

## 8. Principe permanent de performance et d'exploitabilité

Rappelé comme **règle 11** du plan (§ 21) et applicable à chaque proposition de ce document : examiner la
latence (p95/p99), le CPU/mémoire, le poids des bundles, le nombre de requêtes, l'efficacité du cache, le
comportement aux volumes croissants, les coûts d'exploitation ; signaler tout choix risqué **avant
validation** avec ses alternatives ; aucune promesse de performance sans mesures ; tests et benchmarks
représentatifs quand l'impact le justifie ; identifier les risques réels, mesurer au bon moment, corriger
ce qui pose effectivement problème.

**Principes appliqués au rendu et au cache** (vérifiés par la conception des lots) :

1. **Le front-office ne reconstruit pas le CMS à chaque affichage** — le modèle résolu est **préparé à la
   publication** et servi depuis le cache (§ 4.3) ;
2. Le contenu publié est résolu **une fois par version**, pas par requête ; les visiteurs partagent la même
   entrée de cache par clé complète (§ 4.3) ;
3. Segments et groupes évalués **sans multiplier les requêtes** : une lecture indexée des adhésions,
   critères simples de session, agrégats préparés — **jamais d'agrégation à l'affichage** ;
4. Les composants restent **légers** : ils ne chargent que leurs dépendances nécessaires, déclarées dans le
   registre ;
5. Les changements invalident **les éléments concernés** (dépendances réelles), jamais systématiquement
   tout le catalogue ;
6. Les performances sont **vérifiées sur mobile et avec des volumes représentatifs** — les limites
   initiales sont mesurées et réévaluables, **pas des garanties de performance**.
