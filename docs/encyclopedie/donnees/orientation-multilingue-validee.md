# Orientation architecturale multilingue — validée par le chef

**Statut** : orientation **validée** par le chef (délibération du jour, après la vérification d'extensibilité
du dossier d'exécution 2.6.1b, § 8 bis). Ce document est la **référence** pour tout lot futur touchant aux
langues, aux contenus localisés, à l'i18n et au CMS. **Rien n'est implémenté à ce stade** : aucun
développement, aucune migration SQL, aucune modification de code n'est autorisé par cette validation —
l'implémentation passera par le cycle habituel (dossier d'exécution → validation → rapport → validation).
**Documents liés** : doc 18 (CMS — note de cohérence ajoutée), dossier d'exécution 2.6.1b (§ 8 bis —
vérification d'extensibilité, désormais alignée sur cette orientation), CLAUDE.md (§ Langues — note
transitoire), CLAUDE.md § « Compatibilité permanente Firebase / SQL » (règle permanente 9).

---

## 1. Orientation validée — résumé

Un multilingue **réellement extensible** (une langue s'ajoute depuis le backoffice, sans modifier le code
frontend, les composants React, les formulaires CMS ou le schéma SQL), obtenu avec **une architecture aussi
simple que possible** : modélisation **relationnelle classique**, **sans** moteur générique d'attributs
dynamiques ni sur-ingénierie. Le nombre de langues n'est **jamais limité à quatre ni à une liste figée dans
le code**.

## 2. Registre centralisé des langues (validé)

Une **configuration de langue** vit en base (registre), gérée depuis le backoffice (ajout, activation,
désactivation). Chaque entrée porte notamment :

| Donnée                         | Rôle                                          | État actuel du code                                                                         |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Code linguistique              | identifiant stable (`fr`, `ar`, …)            | existe (`LanguageInfo.code`)                                                                |
| Nom natif / nom affiché        | sélecteurs, onglets                           | existe (`label`, `selectorLabel`, `short`, `description`)                                   |
| Direction LTR/RTL              | rendu, alignements                            | existe (`dir`)                                                                              |
| Locale régionale               | `lang` HTML, tri (`htmlLang`, `collation`)    | existe                                                                                      |
| Fallback                       | chaîne de repli, par langue                   | existe (`fallback`)                                                                         |
| Statut actif/inactif           | langue visible ou repliée                     | **à développer** (l'union `Language` + `LANGUAGES` du core reste la source **transitoire**) |
| Formatage des dates et nombres | formats régionaux                             | **à développer** (les textes seuls sont localisés aujourd'hui)                              |
| Police d'écriture (éventuel)   | variante typographique (famille `ar` → Cairo) | partiel (famille `fr`/`ar` existante)                                                       |

**Statut honnête — trois niveaux distincts** :

1. **Ce qui existe déjà** : `LANGUAGES` est défini **dans le code**, le type `Language` est une **union
   TypeScript limitée aux quatre langues actuelles**, et les formulaires et composants parcourent cette
   liste existante. Les mécanismes centralisés (`languageInfo()`, `SELECTOR_ORDER`, `pickLocalized`,
   itération sur `LANGUAGE_CODES` pour les champs `<champ>_<code>`) constituent **un point d'entrée
   unique** qui **facilite** l'évolution : la source de la liste et l'extension du contrat `Language`
   (union littérale → chaînes validées par le core) sont localisées, ce qui limite la portée d'une
   future évolution — sans en démontrer la possibilité.
2. **Ce qui n'est pas encore garanti** : l'ajout **réel** d'une cinquième langue **depuis le backoffice**
   sans modification du frontend, des composants ou des formulaires CMS **n'est pas démontré** par le code
   actuel — l'organisation actuelle le facilite, elle ne le prouve pas.
3. **Ce qui reste à développer** : le **registre en base**, l'**évolution du contrat `Language`**, les
   **catalogues i18n dynamiques** et leur **intégration aux formulaires CMS** (onglets et champs générés
   selon les langues actives).

La compatibilité réelle avec une cinquième langue **sera démontrée par les scénarios d'acceptation du
futur lot d'implémentation** (§ 11, scénarios 1 à 4), jamais affirmée par avance.

## 3. Stockage relationnel des traductions (validé)

- **Une table de traduction par entité réellement localisable** — et uniquement là : `recipes` +
  `recipe_translations`, `ingredients` + `ingredient_translations`, `categories` +
  `category_translations`, `units` + `unit_translations`, pages CMS + leurs données localisées.
- Les **tables métier** conservent les informations indépendantes de la langue ; les **tables de
  traduction** ne contiennent que les champs localisés.
- Chaque table de traduction conserve : **colonnes SQL typées**, **clés étrangères réelles** vers son
  entité, **contraintes d'unicité adaptées** (notamment entité × langue), **index adaptés** aux usages et
  aux recherches.
- **Compatibilité Firebase** (règle permanente) : la même sémantique existe côté Firestore (collection de
  traductions par entité, document par langue) ; l'**unicité (entité, langue)** y est garantie par une
  garde serveur (même mécanisme que la réservation `email_index` des comptes) — jamais par un seul
  pré-contrôle client ; les tests de contrat couvrent les deux adaptateurs (règle 6 de CLAUDE.md).
- **Pas de table universelle** de traductions (`entity_type` / `entity_id` / `field` / `value`) — exclu.
- **Pas de moteur EAV** ni d'attributs localisés dynamiques — exclu.
- **Aucune entité métier persistée en document ou colonne JSON dans SQL** — règle permanente (CLAUDE.md
  point 9) ; le stockage actuel de l'adaptateur SQL de préparation en colonne `data` JSON reste un
  **écart architectural enregistré**, à traiter dans le périmètre de la migration SQL (dossier d'exécution
  2.6.1b, § 8 bis-2 bis).

## 4. Nouveaux attributs localisés (validé)

L'ajout d'un nouvel attribut localisé (`chef_tip`, `subtitle`, `seo_title`, …) reste une **évolution
classique et maîtrisée** : colonne SQL typée dans la table de traduction concernée → évolution du
contrat/API → champ dans le formulaire CMS correspondant → adaptation de l'affichage frontend si
nécessaire. **Une migration SQL est acceptable pour cela** : l'objectif n'est pas de supprimer toute
évolution du schéma, mais de conserver un modèle simple, compréhensible, fiable et facile à faire évoluer.
Le CMS **ne permet pas** de créer arbitrairement des attributs métier : les champs localisés restent
définis par les développeurs et correspondent aux colonnes réellement disponibles.

## 5. Formulaires CMS dynamiques (validé)

- Les formulaires CMS **récupèrent les langues actives depuis le registre** et génèrent automatiquement
  onglets et champs de traduction — l'ajout de l'italien fait apparaître un onglet italien sans modifier
  le code du formulaire.
- Les formulaires actuels (éditeur de recette) itèrent déjà les langues depuis la liste du core — le
  mécanisme d'itération existe ; sa source passe du registre du code au registre en base au lot
  d'implémentation.
- **Champs localisés = colonnes réelles** : l'onglet apparaît pour la langue, les champs pour chaque
  attribut localisé défini par les développeurs.

## 6. Traductions de l'interface (validé — complété par le chef)

**Règle validée (chef)** : **un seul mécanisme i18n pour toute l'interface** — jamais deux mécanismes
indépendants. **Les catalogues dynamiques sont la source actualisée des traductions ; le bundle initial
fournit un fallback embarqué pour les messages essentiels. Les catalogues téléchargés sont mis en cache et
actualisés automatiquement dès qu'une connexion permet de récupérer une version plus récente.**

### 6-1. Source des traductions

- Les **catalogues i18n dynamiques** couvrent **tous les textes de l'interface** : textes structurels
  (navigation, boutons, formulaires, libellés), messages fonctionnels, **messages techniques et messages
  d'erreur**, et messages essentiels nécessaires au fonctionnement de l'application.
- Les **messages techniques essentiels** sont **également présents dans le bundle initial comme solution
  de secours** : l'application peut toujours afficher un message compréhensible, même si aucun catalogue
  distant n'est disponible. Ce n'est **pas** un second mécanisme : c'est le **fallback embarqué du même
  mécanisme unique** (le résolveur lit d'abord le catalogue actif, puis le fallback embarqué).
- L'ajout d'une langue ou la modification de ses traductions **ne nécessite aucun redéploiement frontend**.

### 6-2. Actualisation automatique des catalogues

- **Version identifiable par langue** (version indépendante par catalogue).
- **Vérification légère** des versions disponibles (contrôle proportionné — au démarrage et lors des
  passages en ligne ; jamais de dégradation des performances ni de la consommation réseau ; pas de
  téléchargement répétitif ou inutile).
- Si une version plus récente existe **et qu'Internet est disponible** : téléchargement du catalogue
  nécessaire uniquement → **vérification d'intégrité et de validité** → actualisation du **cache IndexedDB**
  → traductions utilisées **sans rechargement complet** de l'application.
- **Mise à jour atomique** : un catalogue incomplet ou invalide **ne remplace jamais** la dernière version
  valide ; en cas d'échec du téléchargement, **l'ancienne version valide est conservée**.

### 6-3. Changement de langue

1. Catalogue déjà en cache → utilisé **immédiatement**.
2. Sinon → **fallback temporaire** (langue de repli configurée).
3. Si Internet est disponible → téléchargement du catalogue demandé.
4. Une fois téléchargé et validé → l'interface **adopte automatiquement** les nouvelles traductions.

Comportement identique pour les textes classiques, les messages fonctionnels et les messages techniques.

### 6-4. Fonctionnement hors ligne

- Catalogues **déjà téléchargés conservés dans IndexedDB** — une langue déjà chargée reste utilisable hors
  ligne (même famille de mécanisme que le cache du thème résolu `chnowa_active_theme_vars_v1`).
- Une modification publiée dans le backoffice **n'affecte pas** le catalogue local tant que sa nouvelle
  version n'a pas été récupérée.
- Une langue jamais téléchargée utilise **temporairement le fallback** disponible.
- Les **messages techniques essentiels** restent disponibles **grâce au fallback embarqué du bundle** :
  l'application **ne doit jamais se retrouver sans possibilité d'afficher un message d'erreur
  compréhensible**. Conséquence assumée, cohérente avec la chaîne de repli existante (référence finale :
  français) : à la toute première visite d'une langue nouvellement ajoutée, si son catalogue n'est pas
  encore en cache et qu'aucune connexion n'est disponible, les textes non essentialistes se replient sur
  la langue de fallback et les messages essentiels s'affichent dans la langue du fallback embarqué — dès
  le premier chargement en ligne, la langue est servie.

### 6-5. Publication depuis le backoffice

- Ajout ou modification d'une traduction → **publication d'une nouvelle version du catalogue concerné**.
- L'application **détecte cette version à sa prochaine vérification en ligne**, télécharge **uniquement le
  catalogue nécessaire**, actualise son cache et les traductions affichées.
- La publication des traductions suit le **workflow de validation** existant (atelier → page de
  validation → collection publique), comme toute donnée partagée (SyncedCollectionStore + cache IndexedDB).

### 6-6. Points techniques à prévoir (au lot d'implémentation)

Version indépendante par langue · vérification légère des versions · téléchargement uniquement lorsqu'une
mise à jour est nécessaire · cache IndexedDB · mise à jour atomique · conservation de la dernière version
valide · gestion des échecs réseau · **absence de rechargement complet** · cohérence avec le
fonctionnement **PWA** et la synchronisation hors ligne existants (service worker, copie IndexedDB,
last-write-wins) · prévention des téléchargements répétitifs et inutiles.

- Aujourd'hui : les textes d'interface vivent dans le bundle (`translations.ts`, 4 langues) —
  l'ajout d'une langue **exige encore du code** ; c'est le point **prévu mais pas implémenté** majeur.

## 7. Résolution des traductions et fallback (validé)

Un mécanisme **centralisé** (core) gère : langue demandée → disponibilité de la traduction → fallback
configuré → niveaux de repli supplémentaires → contenus incomplets → **langues désactivées** (une langue
désactivée reste lisible sur les appareils déjà configurés via la chaîne de repli — règle à préciser au
dossier du lot). Les composants frontend **ne gèrent jamais** ces règles : `pickLocalized` / le
résolveur central restent les seuls points de résolution, étendus au registre.

## 8. RTL/LTR et formats régionaux (validé)

- La **direction** est déterminée par la configuration de la langue (`dir` de l'entrée du registre) —
  jamais codée par composant ; le CSS applique `[dir='rtl']` globalement (existant).
- Le frontend s'adapte automatiquement : direction, alignements et espacements, navigation, formulaires,
  **icônes directionnelles** (retournement via utilitaires directionnels, pas de côtés codés), formats de
  dates, nombres et données régionales (via la locale de l'entrée — `Intl` côté interface).
- **Propriétés CSS logiques** (`ms/me/ps/pe`, inline/block) plutôt que gauche/droite codées — convention
  déjà en vigueur et vérifiée dans le shell (2.6.1b).

## 9. Contraintes architecturales impératives (rappel validé)

1. Aucune entité métier persistée en document ou colonne JSON dans SQL — **règle permanente**.
2. Données métier relationnelles : colonnes typées, relations, contraintes, index.
3. JSON réservé aux échanges API, imports/exports, sauvegardes et formats de transport.
4. Pas de table universelle de traductions (`entity_type/entity_id/field/value`).
5. Pas de moteur EAV ni d'attributs localisés dynamiques.
6. Pas de complexité supplémentaire sans besoin fonctionnel concret.
7. Performances, compatibilité Firebase/SQL, synchronisation et fonctionnement hors ligne préservés
   (règles permanentes de CLAUDE.md § Compatibilité).

## 10. Ce qui existe déjà / prévu / à développer (statut honnête)

| Domaine                 | Existe déjà (garanti)                                                                                                                                             | Prévu, pas implémenté                                                                                                    | À développer (lots futurs)                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registre des langues    | mécanismes centralisés sur une liste **figée dans le code** (facilitent l'évolution, ne la prouvent pas) ; données par langue (code, noms, dir, locale, fallback) | registre en base + gestion backoffice                                                                                    | écran de gestion, statut actif/inactif, extension du contrat `Language` (union → chaînes validées), cache hors ligne du registre                                                        |
| Traductions de contenu  | champs `<champ>_<code>` découverts dynamiquement ; validateurs multilingues                                                                                       | tables de traduction par entité                                                                                          | **migration** des champs embarqués vers les tables de traduction (repli de lecture sur les champs embarqués pendant la transition), gardes d'unicité côté Firestore, index de recherche |
| Traductions d'interface | bundle 4 langues, replis                                                                                                                                          | mécanisme unique validé (catalogues dynamiques = source actualisée ; bundle = fallback embarqué des messages essentiels) | catalogues en base, versionnés, mis en cache IndexedDB, actualisation atomique en ligne ; rapport « traductions manquantes » (doc 18 § 4.4)                                             |
| Résolution/fallback     | `pickLocalized` central (chaîne par langue)                                                                                                                       | gestion des langues désactivées                                                                                          | extension du résolveur au registre (désactivée, niveaux supplémentaires)                                                                                                                |
| RTL/formats             | `dir` par entrée, CSS logique, `[dir='rtl']`, famille typographique `ar`                                                                                          | formats date/nombre par langue                                                                                           | `Intl` piloté par la locale du registre, icônes directionnelles auditées                                                                                                                |
| SEO                     | titres serveur localisés ; slug unique (non localisé)                                                                                                             | slugs/SEO dans les versions de page (doc 18)                                                                             | slugs localisés × langue, redirections par langue                                                                                                                                       |

## 11. Scénarios de validation concrets (critères d'acceptation du lot d'implémentation)

Chaque scénario s'exécute en vérification réelle (protocole des lots précédents) et apparaît au rapport :

1. **Ajouter une cinquième langue** (italien) depuis le backoffice : registre mis à jour, langue active.
2. **Vérifier qu'aucune modification du schéma SQL n'est nécessaire** : les tables de traduction
   accueillent une ligne de plus par entité traduite ; aucun `ALTER TABLE`.
3. **Formulaires CMS** : les formulaires concernés affichent automatiquement les onglets et champs de
   l'italien, sans modification de leur code.
4. **Composants frontend** : navigation, shell, fiches rendus en italien sans modification de composant.
5. **Catalogues d'interface** : l'italien est servi sans redéploiement du frontend (catalogue dynamique,
   versionné, en cache).
6. **Fallbacks** : traductions partiellement absentes → repli configuré (chaîne complète vérifiée).
7. **Direction et formats** : une langue RTL et une langue LTR nouvelles — direction, alignements,
   icônes directionnelles, formats de dates/nombres.
8. **Hors ligne et synchronisation** : registre et catalogues en cache ; première visite hors ligne d'une
   langue neuve → repli français ; en ligne → langue servie ; sync incrémentale inchangée.
9. **Compatibilité des modèles** avec les stockages SQL **et** Firestore : tests de contrat sur les deux
   adaptateurs (unicité entité × langue incluse).
10. **Performances** avec plusieurs langues et un volume représentatif de contenus : lectures par page,
    recherche, résolution — protocole de mesure du lot (baselines 1.4).

## 12. Incompatibilités identifiées et arbitrages restants (pour décision du chef, au lot concerné)

| #      | Point                                                                                                                 | Situation                                                                                               | Options / conséquences                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** | **doc 18 § 3.3 — colonnes localisés fixes** (`slug_×4`, `title_×4`, `seo_×4` dans `page_versions`, `section_param_*`) | en tension avec l'orientation validée (tables de traduction par entité)                                 | (a) table de traduction de version (`page_version_translations` ou équivalent par famille de tables), alignée sur le pattern § 3 ; (b) conserver les colonnes fixes **uniquement** pour les pages (contenu profondément versionné) — arbitrage **à faire au dossier du lot CMS** ; aucune des deux n'est pré-validée |
| **A2** | **Convention CLAUDE.md « champs `<champ>_<langue>` »**                                                                | la convention actuelle du code reste en vigueur jusqu'à l'implémentation ; elle devient **transitoire** | mise à jour de la convention **au moment de l'implémentation** (avec la migration) ; note transitoire ajoutée à CLAUDE.md aujourd'hui                                                                                                                                                                                |
| **A3** | **Sauvegarde JSON et exports**                                                                                        | les exports/restaurations contiennent des documents complets (champs embarqués)                         | après migration : export = forme embarquée reconstituée (JSON autorisé pour l'échange) ou forme jointe — **choix au dossier du lot** ; aucun retour arrière perdu : le repli de lecture sur les champs embarqués reste possible                                                                                      |
| **A4** | **Performance de la jointure de traduction**                                                                          | lire une recette en N langues = jointure `recipes` + `recipe_translations`                              | index (entité, langue) et lecture par langue demandée uniquement ; à mesurer au protocole du lot (scénario 10) ; Firestore : lecture de sous-collection filtrée par langue                                                                                                                                           |

**Arbitrages techniques propres au mécanisme i18n unique (B — présentés, non tranchés) :**

| #      | Point                                          | Options / conséquences                                                                                                                                                                                                                                                                                                                                                                      |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B1** | **Langue du fallback embarqué dans le bundle** | (a) français seul (langue de référence, ensemble fini et stable — léger, cohérent avec la chaîne de repli existante) ; (b) fallback embarqué des 4 langues actuelles (couverture immédiate avant premier téléchargement, au prix d'un bundle plus lourd) — **conséquence (a)** : un message essentiel d'une langue neuve s'affiche en français jusqu'au premier téléchargement du catalogue |
| **B2** | **Cadence de vérification des versions**       | (a) au démarrage de l'application uniquement ; (b) au démarrage + à chaque retour en ligne (détection plus rapide, coût réseau minime si la vérification est une requête légère versionnée) — la proportionnalité (§ 6-6) impose de mesurer le coût au protocole du lot                                                                                                                     |
| **B3** | **Contrat du catalogue téléchargé**            | format, hash/signature d'intégrité, taille maximale, validation par le core (toute donnée externe relue par le core) — à définir au dossier du lot ; la validation du core est un principe déjà établi, la forme reste à concevoir                                                                                                                                                          |

**Aucun de ces arbitrages n'est tranché ici** — ils seront présentés dans les dossiers d'exécution des
lots concernés (CMS, migration SQL, i18n dynamique) avec leurs conséquences complètes.
