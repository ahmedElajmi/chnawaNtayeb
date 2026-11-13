# 14 · Refonte du backoffice et workflow de validation (plan)

> **Statut : plan validé, pas encore réalisé.** Cette page garde la refonte de `/patron` et le workflow de
> validation du contenu, pour les reprendre. Le fonctionnement actuel est décrit dans
> [07-backoffice.md](07-backoffice.md).

## Partie A — Refonte de `/patron`

### Constat

- **En-tête trop haut** : sur téléphone, il occupe la moitié de l'écran (bandeau « Mode local uniquement » de cinq
  lignes, carte d'en-tête, description).
- **Libellés** : ils mélangent les langues, et ceux du backoffice ne suivent pas encore la langue courante.
- **Navigation** :
  - six onglets horizontaux, dont certains sont cachés sur mobile ;
  - aucune adresse par onglet : le retour et le rechargement perdent l'onglet.
- **Onglet Moteur** : une seule page d'environ 3 500 px, avec huit sections (simulateur, scénarios, mises en
  avant, remplacements, seuils, ordre, historique…).
- **Tableau de bord** : il donne des chiffres, mais rien « à faire ».
- **Onglet Données** : il est technique et mélange sauvegarde et synchronisation.
- **Code** :
  - les styles sont recopiés dans chaque onglet ;
  - ajouter une section oblige à modifier `BackofficeView.tsx`.

### Proposition

- **Mise en page** :
  - un menu latéral sur ordinateur ;
  - sur téléphone, une barre compacte « ☰ Section ● » qui ouvre le menu ;
  - une pastille d'état à la place du bandeau.
- **Une adresse par page**, déclarée dans `src/shared/paths.ts` et `src/app/AppRoutes.tsx` :
  - `/patron/recettes` et `/patron/ingredients` ;
  - `/patron/moteur/{simulateur,scenarios,mises-en-avant,remplacements,reglages,historique}` ;
  - `/patron/apparence` et `/patron/donnees` ;
  - `/patron/a-valider` (voir partie B).
- **Registre des sections** : une nouvelle page = une entrée. Il est prêt pour les catégories (tags) et les
  textes du CMS.
- **Kit d'interface partagé** :
  - `AdminPage`, des cartes, une liste paginée, des puces de filtre ;
  - une pastille de statut, et la confirmation par `ModalShell` ;
  - un contexte `useNotify` pour les messages, à la place des props `onNotify` ;
  - les composants de la partie B : `SegmentedProgress`, `StatusBadge`, `StepTrail`, `ValidationGrid`.
- **Accueil « À faire »** :
  - les comptes viennent d'une fonction testée du core, `catalogHealth` (recettes sans photo, traductions
    manquantes, ingrédients sans prix, éléments à valider…) ;
  - chaque compte ouvre la liste filtrée correspondante.
- **Moteur** : découpé en sous-pages.
- **Données** : une page plus claire, avec d'un côté la sauvegarde et la restauration, de l'autre la
  synchronisation.
- **Libellés** :
  - tous traduits dans toutes les langues et variantes, en suivant la langue courante ;
  - un dictionnaire propre au backoffice, chargé avec le morceau `/patron`.

### Sans régression

- Les éditeurs et les panneaux du moteur sont **déplacés, pas réécrits**.
- La liste des fonctions de [07-backoffice.md](07-backoffice.md) sert de checklist. Elle est revérifiée à 1280,
  375 et 320 px.
- Le travail est découpé en petites PR, dont l'ordre est donné en partie C.

## Partie B — Workflow de validation du contenu

### Pourquoi

Aujourd'hui, une recette n'a qu'un booléen `is_published` :

- une nouvelle recette naît publiée (`newRecipeDraft`) ;
- une modification est visible tout de suite ;
- un brouillon reste lisible par tous (`firestore.rules`, `recipes` : `allow read: if true`) et chaque appareil
  le télécharge ;
- aucun contrôle de qualité n'est fait avant la mise en ligne ;
- il n'y a qu'un seul compte patron.

Objectifs :

- **Rien en ligne sans validation**, faite étape par étape et partie par partie.
- **Pouvoir s'arrêter et reprendre** sans refaire ce qui est validé, grâce à un état détaillé.
- **Une modification dans une langue n'invalide que cette langue.**
- **L'ancienne version reste en ligne** pendant qu'on modifie.
- D'autres rédacteurs pourront venir plus tard ; **l'admin seul a tous les droits**.
- **Workflows flexibles**, modifiables depuis le backoffice.
- Tout le contenu est concerné : recettes, ingrédients, thèmes, réglages du moteur, catégories et textes.

### Deux espaces, un mécanisme générique

| Espace                                            | Contenu                                            | Lecture                          | Écriture                  |
| ------------------------------------------------- | -------------------------------------------------- | -------------------------------- | ------------------------- |
| **Public** (`recipes`, `ingredients`…, inchangés) | versions validées seulement                        | tout le monde (synchro actuelle) | qui a le droit de publier |
| **Atelier** (`recipes_workspace`…)                | copies de travail, état de chaque case, historique | l'équipe                         | l'équipe, selon son rôle  |

- L'atelier réutilise `SyncedCollectionStore`, `SharedCollectionSource` / `SharedCollectionWriter`, la copie
  IndexedDB et `createFirestoreSharedCollection`, avec un autre nom de collection. **Aucun nouveau mécanisme de
  synchronisation.**
- Le public ne télécharge plus les brouillons : ils deviennent privés et coûtent moins de lectures.

### La grille de validation : partie × langue

Chaque type de contenu déclare dans le core ses **parties**. Les parties de texte sont **découpées par langue** ;
les autres sont communes à toutes les langues. Pour une recette :

| Partie                                                       | FR               | Derja | دارجة | عربي |
| ------------------------------------------------------------ | ---------------- | ----- | ----- | ---- |
| Nom et description                                           | case             | case  | case  | case |
| Médias (photo, vidéo)                                        | une case commune |       |       |      |
| Infos et ingrédients (temps, portions, catégorie, quantités) | une case commune |       |       |      |
| Étapes                                                       | case             | case  | case  | case |
| Astuce du chef                                               | case             | case  | case  | case |

- **Chaque case a sa propre empreinte**, calculée sur ses seules données. Par exemple, la case « Étapes × Derja »
  ne contient que les textes derja des étapes.
- Modifier un texte derja n'invalide **que** la case derja ; modifier le français n'invalide que la case
  française. Les traductions restent validées, avec un simple rappel « le français a changé depuis ».
- Ajouter une étape n'invalide pas les autres langues : leur case indique « 1 texte à traduire ».
- Les colonnes viennent de `LANGUAGES` : une nouvelle langue ou variante ajoute une colonne d'elle-même.

L'état d'une case est **stocké** dans la copie de travail :
`cells: Record<cellId, { state, approved_hash, note?, by, at }>`.

| État        | Sens                                                              |
| ----------- | ----------------------------------------------------------------- |
| À compléter | un point bloquant de la checklist manque                          |
| Prête       | complète, pas encore relue                                        |
| Validée     | validée, et l'empreinte n'a pas changé depuis                     |
| Modifiée    | validée puis modifiée : seule cette case est à revalider          |
| À corriger  | renvoyée avec une note, qui s'affiche sur le champ dans l'éditeur |

### Validation par étapes, avec reprise

Le workflow est une suite d'**étapes** qui regroupent des cases. Pour une recette, par défaut :

1. Nom et description (FR)
2. Médias
3. Infos et ingrédients
4. Étapes (FR)
5. Astuce du chef (FR)
6. Traductions (une sous-étape par langue ou variante)
7. Aperçu « comme le public », puis **Valider et publier**

L'écran de validation d'un élément contient, de haut en bas :

- le **fil d'étapes** (validée, en cours, à faire) ;
- une **barre segmentée** (un segment par case, de la couleur de son état) avec deux pourcentages :
  - **validation** : cases validées sur cases requises ;
  - **complétude** : points de la checklist remplis ;
- la **grille partie × langue**.

Les boutons et le comportement :

- **Reprendre** ouvre la première case non validée.
- Dans une case, on voit :
  - les différences avec la version en ligne, pour cette case seulement ;
  - sa checklist ;
  - les boutons Valider, À corriger (avec une note) et Passer.
- Une étape peut être libre ou ordonnée : c'est un réglage du workflow.
- On publie quand toutes les cases **requises** sont validées.
- Une langue facultative qui n'est pas encore validée n'est pas publiée : le public garde sa version précédente,
  ou la langue de repli. Elle sera publiée seule quand elle sera validée.

### Contrôle qualité

Un registre de règles est défini par type : `ReviewRule<T> { id, cell, level, check(item, ctx) }`. Chaque règle
est rattachée à une case, ce qui donne les états et les pourcentages. Il réutilise :

- `validateRecipe` et `validateIngredient` ;
- `recipeSectionStatus` et `missingTranslations`, à déplacer dans le core ;
- le contrôle des prix incohérents ;
- les scénarios du moteur : les réglages ne sont publiés que si tous les scénarios du chef passent.

Les dépendances sont aussi contrôlées :

- une recette qui utilise un ingrédient non publié propose de valider cet ingrédient dans le même envoi ;
- on ne peut pas retirer un ingrédient utilisé par une recette en ligne.

### Workflows et rôles configurables

Les **workflows sont des données en base** (collection `workflows`, un document par type). Le code fournit le
vocabulaire : les parties, les langues, les règles et les actions. Le workflow les combine.

`WorkflowDefinition` est relue par `parseWorkflowDefinition` / `resolveWorkflow`, qui donnent des valeurs par
défaut comme `resolveMatchingConfig`. Elle contient :

- les **étapes** : leur nom dans toutes les langues, leurs cases, et si elles sont libres ou ordonnées ;
- pour **chaque case** : si elle est requise ou facultative, et le rôle qui peut la valider ;
- le **niveau de chaque règle** : bloquante, conseillée ou désactivée ;
- les **langues requises** ;
- des **options** : validation groupée, publication partielle des langues, revalidation exigée ou non après une
  modification d'une partie donnée.

**Rôles** (collection `roles`) :

- ils ont des droits : éditer, valider telle étape, publier, gérer les workflows ;
- l'**admin** a tous les droits, ne peut pas être retiré et peut toujours débloquer ;
- par défaut, il existe quatre rôles : rédacteur, traducteur (cases de langue seulement), validateur et admin.

**Éditeur de workflow** (Réglages › Workflows, admin seulement) :

- les étapes sont réordonnables, et leurs cases se cochent dans une mini-grille partie × langue ;
- on y règle si chaque case est requise, quel rôle la valide et le niveau de chaque règle ;
- un **aperçu de l'impact** s'affiche avant d'enregistrer, par exemple « 12 recettes en ligne auraient des
  cases requises non validées ». Il est calculé par le core sur la copie locale, sans lecture de la base ;
- chaque version est gardée dans un historique, et on peut revenir à une version précédente ;
- changer de workflow ne détruit aucune validation.

`validateWorkflow` garantit :

- au moins une étape ;
- la case « nom en français » toujours requise ;
- au moins un rôle qui peut publier ;
- qu'une case inconnue est ignorée, avec un avertissement.

Les règles Firestore vérifient le rôle pour publier et pour modifier `workflows` et `roles`. L'historique garde
qui a fait chaque action.

### Page « À valider » (affichage regroupé)

C'est la tête de l'accueil « À faire », avec un compteur dans le menu.

- **Regroupement** au choix : par élément, par étape ou partie (« Médias : 4 », « Étapes × دارجة : 12 »), par
  langue, par type de contenu ou par auteur.
- Chaque groupe affiche son total exact (calculé sur toute la file) et sa barre segmentée. La liste est paginée.
- **Relecture en série** : les cases d'un groupe s'enchaînent d'un élément à l'autre.
  - Raccourcis clavier : `V` pour valider, `C` pour demander une correction, `→` pour passer.
  - Sur téléphone, de grands boutons.
- **Validation groupée** : « Valider les 8 cases prêtes sans point bloquant », avec une confirmation qui les liste.
- Dans les listes de recettes et d'ingrédients :
  - un badge de statut et une mini-barre ;
  - des filtres Toutes, En ligne, Modifs en attente, À valider, À corriger, À compléter et Brouillons ;
  - ces filtres remplacent l'œil En ligne / Brouillon.

### Publication, historique, conflits

« Valider et publier » fait **une seule écriture atomique** (transaction dans l'adapter), qui enregistre :

1. le document public, recomposé à partir des cases validées ;
2. la copie de travail ;
3. une copie de la version publiée dans `<collection>_versions`, une collection où l'on ne fait qu'ajouter.

« Revenir à cette version » republie une de ces copies.

Si deux personnes modifient le même élément, `base_revision` est contrôlée et l'interface affiche « Modifiée
entre-temps par X ».

### Performance

- Les empreintes (FNV-1a sur un JSON stable de la tranche) sont calculées **à l'enregistrement**. Les listes ne
  font que lire les états déjà stockés.
- `reviewSummary` ne recalcule que les copies qui ont changé, en comparant les références (comme
  `planIndexUpdate`).
- Workflows et rôles tiennent en quelques petits documents, gardés en copie locale.

### Migration sans régression

- Une action admin unique crée une copie « toutes cases validées » de chaque élément public.
- Les éléments `is_published: false` deviennent des brouillons dans l'atelier, et une marque de suppression est
  publiée côté public.
- `is_published` reste lu pendant la transition.
- La SEO et la recherche ne changent pas.
- La sauvegarde JSON couvre le public, l'atelier et les workflows. Elle est relue par `parseBackup`, avec un test
  d'aller-retour.

## Partie C — Ordre des PR

1. **Shell** : routes, registre des sections, kit d'interface, libellés traduits.
2. **Core** : `src/core/review` (parties, cases, empreintes, états, pourcentages, règles, `WorkflowDefinition`,
   rôles, `reviewSummary`, impact d'un changement), avec ses tests.
3. **Données** :
   - les ports `ReviewWorkspace<T>`, `WorkflowRepository` et `RoleRepository` ;
   - le `ReviewStore` ;
   - les adapters et leurs tests de contrat ;
   - `firestore.rules` et la migration.
4. **Écran de validation** : fil d'étapes, grille, reprise, différences, aperçu public, états affichés dans
   l'éditeur et les listes.
5. **Page « À valider »** : regroupements, relecture en série, validation groupée.
6. **Éditeur de workflows et de rôles**, et comptes de l'équipe.
7. **Accueil « À faire »**, sous-pages du moteur, page Données (fin de la refonte).
8. **Extension** à d'autres contenus :
   - thèmes, moteur et scénarios, une fois passés à la synchro générique ;
   - catégories et textes du CMS (étude des textes d'interface, PR #9).

### Réflexes de conception

- **Évolutif** : les états sont stockés, les empreintes calculées à l'écriture, le résumé incrémental, les pages
  ont des totaux exacts, et le public ne télécharge plus les brouillons.
- **Organisé** : `core/review` en TypeScript pur, puis les ports et stores, puis les adapters, branchés dans
  `container.ts`.
- **Factorisé** :
  - un seul moteur pour tout le contenu ;
  - un type de contenu = des parties, des règles et un parseur ;
  - une langue = une colonne ;
  - un workflow = des données.
- **Sûr** : rôles vérifiés par les règles de la base, admin qu'on ne peut pas retirer, workflow relu par le core,
  validation liée à l'empreinte de chaque case.
- **Agréable** : fil d'étapes, grille d'état, reprise en un clic, relecture en série, notes affichées sur le
  champ, aperçu réel.
