# 07 · Backoffice super admin (`/admin`)

> Refonte en cours (nouvelle navigation : faite ; workflow de validation et workflows configurables : à
> venir) : [14-refonte-backoffice.md](14-refonte-backoffice.md).

## Accès

- Adresse `/admin`, ou trois clics sur le logo, ou depuis la fenêtre « Compte ».
- Une fois connecté : badge « Super admin » et « Quitter » dans l'en-tête (ordinateur et tablette) ;
  sur téléphone, Réglages › Application, section « Super admin » (accès au backoffice, quitter le mode super admin).
- Connexion vérifiée **uniquement par le serveur** (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) :
  5 tentatives ratées par quart d'heure et par adresse IP, session de 8 heures.
- Si le serveur dispose de `FIREBASE_SERVICE_ACCOUNT`, la session donne aussi le droit d'écrire
  dans Firestore (statut « Connecté ») ; sinon le backoffice fonctionne en **mode local** :
  les modifications restent sur l'appareil.
- Le code du backoffice n'est téléchargé que par le super admin (chargement à la demande).
- **Membres de l'équipe** : un compte du site (connexion par e-mail) ajouté dans Workflows › Équipe
  ouvre `/admin` sans le mot de passe super admin, avec les droits de son rôle. Le menu et les adresses ne
  montrent que les pages permises (`requires` dans le registre : Moteur, Apparence et Données
  demandent « publier », Workflows « gérer les workflows ») ; les règles de la base vérifient de
  nouveau chaque écriture. « Se déconnecter » ferme alors la session du compte.

## Navigation et pages (`src/features/backoffice/`)

**Une adresse par page** (`BACKOFFICE_PAGES`, `ENGINE_PAGES`, `backofficePath()` dans `src/shared/paths.ts`) : le
retour et le rechargement gardent la page. `AppRoutes` envoie `/admin/*` au backoffice, qui déclare ses
routes à partir du **registre des sections** (`shell/sections.tsx`).

| Page        | Adresse               | Fichier                                             | Fonctions                                                                               |
| ----------- | --------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Accueil     | `/admin`              | `review/TodoList.tsx`, `dashboard/DashboardTab.tsx` | « À faire », chiffres clés, actions rapides                                             |
| À valider   | `/admin/a-valider`    | `review/QueuePage.tsx`                              | File regroupée, relecture en série, validation groupée                                  |
| Recettes    | `/admin/recettes`     | `recipes/RecipesTab.tsx`, `RecipeEditorModal.tsx`   | Liste (statuts, filtres), créer, modifier, dupliquer, supprimer                         |
| Ingrédients | `/admin/ingredients`  | `ingredients/IngredientsTab.tsx`                    | Liste (statuts), ajouter, modifier, prix min–max (via l'atelier), descriptions d'unités |
| Catégories  | `/admin/categories/…` | `categories/CategoriesPage.tsx`                     | Arbres des catégories (recettes, ingrédients), affectation                              |
| Moteur      | `/admin/moteur/…`     | `matching/`                                         | Six sous-pages (voir ci-dessous)                                                        |
| Apparence   | `/admin/apparence`    | `themes/ThemeEditor.tsx`                            | Créer, prévisualiser, publier des thèmes (contraste vérifié)                            |
| Workflows   | `/admin/workflows/…`  | `workflows/WorkflowPages.tsx`                       | Étapes et cases, rôles, équipe (voir ci-dessous)                                        |
| Données     | `/admin/donnees`      | `data/DataTab.tsx`                                  | Tout remettre à valider, sauvegarde JSON, synchronisation                               |

**Cadre** (`shell/BackofficeLayout.tsx`) :

- ordinateur (1024 px et plus) : menu latéral fixe (sections, nombre de recettes et d'ingrédients,
  pastille d'état, déconnexion) ;
- téléphone et tablette : une barre compacte « ☰ Section ● » sous l'en-tête, qui ouvre le menu en
  panneau ; le point indique l'état. Choisir une page remplace l'entrée du menu dans l'historique : le
  retour ramène à la page précédente ;
- **pastille d'état** à la place de l'ancien bandeau : « Publié pour tous » ou « Local seulement », avec
  l'explication au toucher ;
- titre et description de la page, puis la page.

**Ajouter une page** = une entrée dans `BACKOFFICE_SECTIONS` (icône, libellés, page ou sous-pages, nombre
affiché, cadre partagé des sous-pages) + son adresse dans `BACKOFFICE_PAGES` + ses libellés : menu, menu
mobile, adresse et titre suivent.

**Partagé par toutes les pages** (`shell/`) :

- `NotifyProvider` / `useNotify()` : messages de succès et d'erreur (plus de prop `onNotify` à faire
  descendre) ;
- `RecipeEditorProvider` / `useRecipeEditor()` : l'éditeur de recette s'ouvre depuis n'importe quelle page
  (accueil, liste, plus tard la page « À valider ») ;
- `useAdmin()` : les actions du catalogue (`useCatalogAdmin`) branchées sur ces messages ;
- `pages.tsx` : chaque page rassemble ce dont son panneau a besoin ; les panneaux ont été déplacés, pas
  réécrits.

**Libellés traduits** : `i18n/backofficeTexts.ts` (toutes les langues et variantes, la دارجة ne liste que
ce qui diffère de l'arabe ; chargé seulement avec `/admin`), lus par `useBackofficeText()`. Le cadre, le
menu, les titres des pages et la barre de publication du moteur sont traduits ; le contenu des autres
panneaux reste en français jusqu'à leur passage dans ce dictionnaire. Un test vérifie que chaque libellé
existe dans chaque langue, avec les mêmes `{repères}`.

Les actions sur le catalogue passent par `useCatalogAdmin` (service `CatalogAdmin`, `src/application`) :
chaque action s'affiche tout de suite sur cet appareil, est écrite dans la base (document complet,
versionné), puis arrive **en direct** sur tous les autres appareils ouverts. Le résultat (succès ou
erreur lisible) est affiché. Une suppression publie une marque de suppression. « Récupérer depuis le
cloud » relit tout le catalogue. À la première connexion du super admin, une base vide reçoit le catalogue
intégré (`seedIfEmpty`, une seule lecture).

**Langue** : les noms (recettes, ingrédients, thèmes, catégories) suivent la langue du site, et
l'éditeur de recette s'ouvre sur l'onglet de cette langue (il revient au français si un champ
obligatoire en français manque). Les libellés du backoffice sont encore en français (traduction prévue
avec la refonte).

**Champs dans toutes les langues et variantes** : tout texte affiché au public se saisit en français,
derja en lettres latines (3 / 7 / 9), derja en lettres arabes (دارجة) et arabe littéraire, avec le
composant `ui/LocalizedField.tsx` (écritures arabes de droite à gauche). La liste vient de `LANGUAGES` :
une nouvelle variante apparaît d'elle-même. Le français est obligatoire ; une langue laissée vide affiche
celle de sa liste de repli, et le champ vide l'indique (« Vide : « … » est affiché »).

**Éditeur de recette** (`recipes/RecipeEditorModal.tsx`, plein écran sur téléphone) : nom, description,
**étapes de préparation** et astuce du chef dans toutes les langues et variantes ; temps, coût, portions, image,
vidéo YouTube (vérifiée), catégorie, type de cuisine, healthy, ingrédients avec leur **rôle** et leurs
remplaçants propres à la recette.

- **Sections** (Infos · Photo & vidéo · Ingrédients · Étapes · Astuce) avec des raccourcis en haut et
  leur état : complet, à compléter, à vérifier (aucun ingrédient clé, étape sans français), facultatif
  (`recipeSectionStatus`, `RecipeEditorChrome.tsx`).
- **Une langue à la fois** : onglets FR | Derja · دارجة · عربي (`ui/editorLanguage.tsx`, la famille arabe
  séparée du français ; flèches du clavier pour changer d'onglet, dans le sens de lecture) ; chaque
  champ `LocalizedField` n'affiche que la langue choisie, avec en rappel les textes d'où l'on traduit
  (français ; plus la derja latine pour la دارجة, la دارجة pour l'arabe). Un compteur sur chaque onglet
  indique les textes encore à traduire (`missingTranslations`, toutes variantes). Hors de l'éditeur de
  recette (éditeur d'ingrédient), toutes les langues restent côte à côte (deux colonnes).
- **Barre d'enregistrement toujours visible** en bas. Une erreur s'affiche au-dessus, ramène à la
  section concernée (onglet FR pour un texte obligatoire) et entoure le champ en rouge.
- **Rien ne se perd** : le contenu est gardé en brouillon sur l'appareil pendant la saisie
  (`useRecipeDraftAutosave`, port `RecipeDraftRepository`) et à la fermeture, quelle qu'elle soit
  (bouton retour compris). « Annuler » ou ✕ avec des modifications demande : continuer, fermer en
  gardant le brouillon, ou abandonner. À la réouverture de la même recette (ou d'une nouvelle
  recette), « Reprendre / Ignorer ». Quitter la page avec des modifications demande confirmation.
- **Ingrédients** (`RecipeIngredientsEditor.tsx`) : on ajoute en tapant quelques lettres dans
  n'importe quelle langue (`ui/IngredientSearch.tsx` : vignette, catégorie, flèches + Entrée) ;
  toucher le nom permet de le remplacer, l'unité suit alors l'ingrédient (sauf unité saisie à la main).
  Quantité et unité (`ui/NumberField.tsx` : champ vidable, virgule acceptée ; `ui/UnitInput.tsx` :
  unités proposées), « Facultatif », rôle en trois boutons de couleur (Clé / Secondaire / Placard,
  avec leur explication) et **remplaçants pour cette recette**.
- **Coût suggéré** d'après les fourchettes de prix des ingrédients (`suggestRecipeCost`), avec le nombre
  d'ingrédients chiffrés ; « Utiliser » (milieu de la fourchette, au demi-dinar) n'est proposé que si
  au moins la moitié des ingrédients sont chiffrés.
- **Aperçu** : la fiche recette publique (`RecipeDetailModal`) avec le contenu en cours ; retour la ferme.
- **Dupliquer** (liste des recettes) : ouvre l'éditeur sur une copie non publiée, « (copie) » dans le nom.
- Boutons et textes de l'éditeur en français, quelle que soit la langue du site. Les étapes (`RecipeStepsEditor.tsx`)
  s'ajoutent, se suppriment et se déplacent (monter / descendre) ; elles sont renumérotées à
  l'enregistrement. Avant d'enregistrer, `validateRecipe` (domaine) vérifie le nom français, au
  moins un ingrédient et au moins une étape en français. Une nouvelle recette commence avec une
  étape vide. L'adresse de la recette est générée à partir du nom et rendue unique (`recipeDraft.ts`,
  testé). Retirer la vidéo la supprime aussi de la base (document remplacé en entier, voir
  [05](05-application-donnees.md)).

**Aperçus en direct de la photo et de la vidéo** (`recipes/RecipeMediaFields.tsx`) : la photo s'affiche
dans le même cadre que la carte de recette (ratio 4/3, nom en bas, logo de secours), avec son état
(chargement, image introuvable → le logo sera montré au public) et « Retirer la photo ». La vidéo
YouTube reconnue s'affiche avec le lecteur même de la fiche recette (`RecipeVideo`, lecture possible),
avec « Retirer la vidéo ».

**Éditeur d'ingrédient** (`ingredients/IngredientEditorModal.tsx`) : création (bouton « Ajouter un
ingrédient ») et modification (bouton crayon). Noms dans toutes les langues et variantes, catégorie, unité d'achat,
**prix minimum et maximum**, **lien de la photo** avec aperçu en direct de la vignette publique
(`IngredientThumb`, taille `lg`) : photo, ou pastille de la catégorie si vide / lien cassé ; « Retirer
la photo ». Vérifié par `validateIngredient` avant l'enregistrement.

Un nom français déjà utilisé par un autre ingrédient (casse et accents ignorés) est signalé pendant la
saisie et refusé à l'enregistrement (`findDuplicateIngredient`).

**Liste des ingrédients** : triée par nom ; vignette, nom, catégorie (libellés français,
`ingredients/categories.ts`), unité, **nombre de recettes qui l'utilisent**, « sans photo » le cas
échéant, et deux champs min / max modifiables directement ; « Enregistrer les prix » valide chaque
fourchette (min ≤ max) avant d'écrire quoi que ce soit. **Filtres** : ce qu'il reste à compléter
(Sans photo, Prix fixe min = max, Dans aucune recette, avec leur nombre) et catégories ; le nombre
d'ingrédients affichés est indiqué.

**Descriptions d'unités** (`ingredients/UnitsSection.tsx`, bas de l'onglet Ingrédients) : la section
**Unités** gère les infobulles expliquées au public (« c.à.s » → « Cuillère à soupe… »), sur la
collection partagée `units` (suivie comme le catalogue, voir [05](05-application-donnees.md)) :

- ajouter ou modifier une unité : **libellé exact** tel qu'écrit sur les ingrédients et les articles
  (l'id est créé en le slugifiant : « c.à.s » → `c-a-s`) et **description dans chaque langue et
  variante** (`LocalizedField`, le français est obligatoire) ; validé par `validateUnitInfo`
  (libellé unique — « KG » et « kg » sont le même —, description française requise) ;
- suppression avec confirmation (marque de suppression) ; chaque écriture passe par
  `CatalogAdmin.saveUnit` / `deleteUnit` : affichée tout de suite sur l'appareil, écrite en base,
  arrivée en direct ailleurs ;
- le public voit la description en infobulle (`UnitInfo`) partout où l'unité est affichée ; sans
  description configurée, l'unité reste nue (rien n'est écrit dans le code). Les règles Firestore du
  bloc `units` doivent être déployées (`npm run deploy:rules`) pour que les écritures passent.

**Restauration d'une sauvegarde** (onglet Données) : relue par `parseBackup` ; le message indique le
nombre de recettes et d'ingrédients restaurés et les éléments illisibles ignorés, et rappelle
d'« Envoyer vers le cloud » pour publier.

## Validation des recettes (`/admin/recettes/<id>`)

Rien n'est en ligne sans validation (règles : [03 › review](03-domaine.md), données :
[05](05-application-donnees.md), plan : [14](14-refonte-backoffice.md)).

- **Enregistrer** dans l'éditeur écrit dans l'**atelier**, jamais dans la collection publique, puis ouvre
  la page de validation de la recette. Une nouvelle recette naît hors ligne. Une recette déjà en ligne
  qui est modifiée pour la première fois part de sa version en ligne, validée : seules les cases
  touchées repassent à valider, et le public garde l'ancienne version jusqu'à la publication.
- **Liste** (`RecipesTab`) : copies de l'atelier puis recettes en ligne jamais passées par l'atelier ;
  chaque ligne a son statut (`StatusBadge` : En ligne, En ligne · modifs en attente, À corriger, Prête à
  publier, En relecture, À compléter, À valider), une mini-barre segmentée et le pourcentage validé ;
  filtres Toutes, À valider, À corriger, À compléter, Modifs en attente, En ligne, avec leur nombre sur
  toute la liste, plus **À enrichir** (données incomplètes) ; tri par statut, nom ou complétude.
  Chaque ligne a un **bouton qui dit l'action à faire** (`NextActionLink`, `review/reviewUi.tsx`) :
  « Valider (40 %) », « Valider les changements », « Publier », « Corriger », « Compléter » ; une recette en
  ligne entièrement validée n'en a pas (rien à faire). Le nom ouvre toujours la fiche (historique,
  versions, retirer du site). Sous chaque ligne, la **complétude des données** (`CompletenessMeter`) :
  un anneau, le pourcentage et ce qui manque en quelques mots (« Photo · دارجة · Astuce »), validée ou
  non. Mêmes boutons et complétude dans la liste des ingrédients.
- **Page de validation** (`review/RecipeReviewPage.tsx`, une adresse par recette : on y revient, on
  recharge, on reprend) :
  - en-tête : nom, statut, Modifier, Aperçu public (la vraie fiche recette, avec ce qui serait publié),
    Retirer du site, **Publier** quand toutes les cases obligatoires sont validées ;
  - barre segmentée (une case = un segment, sa couleur = son état) avec le pourcentage validé et la
    complétude, puis le **fil d'étapes** du workflow (une étape fermée est grisée si le workflow est
    ordonné) ;
  - **Reprendre** ouvre la première case non validée ; « Valider les N parties prêtes » valide d'un coup
    les cases prêtes sans point bloquant (avec la liste en confirmation) ;
  - **grille partie × langue** (`review/reviewUi.tsx`) : chaque case montre son état (icône + couleur,
    `*` = obligatoire) ; une partie commune occupe toute la ligne ;
  - **case choisie** : son contenu dans l'atelier et, s'il diffère, sa version en ligne à côté ; la note
    de correction ; ses contrôles (bloquants, conseillés) ; **Valider** (impossible pour une case à
    compléter), **À corriger** avec une note obligatoire, **Suivant** ; après une validation, la case
    suivante non validée s'ouvre.
- **Notes de correction dans l'éditeur** : les cases renvoyées s'affichent en haut du formulaire, avec
  leur note.
- **Hors connexion à la base** (mode local) : l'atelier garde la modification sur l'appareil, avec un
  message d'erreur, comme le catalogue.
- **Tout remettre à valider** (Données, droit « gérer les workflows » + « publier ») : chaque recette
  repart de zéro (aucune case validée), garde son contenu et son historique, et quitte le site jusqu'à
  sa publication (`ReviewStore.resetAllForReview`, par lots de 10 avec progression). Le site public
  affiche alors « Les recettes arrivent » : plus aucune recette intégrée au code n'est montrée au public
  (le catalogue public ne contient que des recettes validées, côté appareil comme côté serveur).
- **Complétude** : dans la fiche, la complétude se déplie et liste chaque donnée manquante ; un clic
  ouvre sa case.
- **Ingrédients** : même chemin que les recettes. L'éditeur d'ingrédient et « Enregistrer les prix »
  écrivent dans l'atelier (`IngredientEditorProvider`, `shell/`) ; chaque ingrédient a sa page de
  validation (`/admin/ingredients/<id>` : nom par langue, catégorie et unité, prix, photo). Une recette
  ne peut être publiée qu'avec des ingrédients en ligne (contrôle « Ingrédients en ligne »).
- La page de validation (`review/ReviewPage.tsx`) est la même pour tous les types de contenu : ce qui
  change (nom, liste, éditeur, contenu d'une case, aperçu) est décrit par une « vue » par type
  (`review/kindViews.tsx`). Le panneau d'une case (`review/CellReviewPanel.tsx`) sert aussi à la
  relecture en série. En bas de page, l'**historique** : ce qui est arrivé à l'élément (enregistré,
  validé, renvoyé, publié…), les versions publiées et « Rétablir » (republie une version).
- Les thèmes et les réglages du moteur gardent leur propre publication (brouillon, scénarios du chef,
  historique des versions) : ils n'ont pas de textes par langue à valider case par case.

## Catégories (`/admin/categories/{recettes,ingredients}`)

Deux arbres gérés à part (`@/core/categories`, collections `recipe_categories` et
`ingredient_categories`, synchronisées comme le catalogue) :

- **Arbre** à plusieurs niveaux (4 au plus, `MAX_CATEGORY_DEPTH`) : déplier / replier, monter /
  descendre parmi ses sœurs, ajouter une sous-catégorie, modifier (nom dans chaque langue, icône,
  « placée sous » : les choix qui créeraient une boucle ou dépasseraient la profondeur sont exclus),
  supprimer. Chaque nœud montre son nombre d'éléments (sous-catégories comprises ; le détail au
  survol) et le nombre de langues où son nom manque.
- **Suppression** refusée pour une catégorie d'origine, une catégorie qui a des sous-catégories ou qui
  contient encore des éléments (`deletionBlocker`).
- **Affectation** : choisir une catégorie montre ses éléments (paginés) ; une recherche permet d'en
  ajouter plusieurs d'un coup (recettes) ou de déplacer des ingrédients ici. Tout passe par l'atelier :
  pour une recette, seule la case « Infos et ingrédients » revient à valider ; pour un ingrédient, la
  case « Catégorie et unité ».
- **Recettes** : plusieurs catégories par recette, à n'importe quel niveau ; être dans « Chorba » met
  aussi dans « Ramadan » (ancêtres implicites). Le **type de plat** (entrée, plat, dessert) reste un
  champ fixe à part : le moteur, le planning et les substitutions s'en servent. L'éditeur de recette a
  un sélecteur de catégories (`RecipeCategoryPicker`).
- **Ingrédients** : une catégorie par ingrédient. Les 9 catégories historiques sont des catégories
  **d'origine** (mêmes ids, `BUILT_IN_INGREDIENT_CATEGORIES`) : renommables et déplaçables, jamais
  supprimées. Une catégorie créée prend les couleurs de sa plus proche ancêtre d'origine (vignette sans
  photo, `ingredientVisualOf`) et son icône.
- **Regroupement** : les listes de recettes et d'ingrédients ont « Regrouper par catégorie » et un
  niveau (`?groupe=categorie&niveau=2`, `ui/CategoryGroups.tsx`) : une section repliable par catégorie,
  avec son nombre, paginée ; « Sans catégorie » en dernier.

## Page « À valider » (`/admin/a-valider`)

- Comptes sur toute la file : parties à valider, éléments concernés, à corriger, prêts à publier ;
  le nombre de parties en attente s'affiche aussi dans le menu.
- **Regrouper par** élément, étape, partie, langue (« Étapes × دارجة »), type, **catégorie** (famille
  de la recette ou de l'ingrédient ; une recette dans deux familles compte dans les deux) ou auteur
  (`groupQueue`, `?groupe=` dans l'adresse) ; chaque groupe a son nombre et une barre colorée.
- **Relire** : les cases du groupe défilent d'un élément à l'autre (« 3 / 12 ») avec le même panneau
  que la fiche ; raccourcis clavier `V` valider, `C` à corriger, `→` suivant ; grands boutons sur
  téléphone.
- **Valider les N parties prêtes** (si le workflow le permet) : seulement les cases sans point bloquant,
  après une confirmation qui les liste ; une écriture par élément.

## Accueil « À faire »

`review/TodoList.tsx`, au-dessus des chiffres clés : parties à valider, éléments renvoyés, prêts à
publier, puis ce qui manque au catalogue (`catalogHealth`, `@/core/catalog` : recettes aux données
incomplètes, à traduire, sans photo ; ingrédients à l'unité ou au prix douteux, sans photo, dans aucune
recette), compté sur les recettes de l'équipe (copies de l'atelier comprises). Chaque ligne ouvre la
liste filtrée (`?filtre=` : les listes de recettes et d'ingrédients lisent leur filtre dans l'adresse).

## Workflows (`/admin/workflows/…`)

Trois sous-pages qui partagent un brouillon (`ReviewSettingsDraftProvider`) et une barre
d'enregistrement (version en vigueur, avertissements de lecture, problèmes qui empêchent
d'enregistrer, note, historique des versions avec « Ouvrir dans le brouillon ») :

- **Étapes** (`etapes`), par type de contenu : options (étapes dans l'ordre, validation groupée,
  publication sans attendre une langue facultative) ; étapes réordonnables, nom dans chaque langue,
  rôles qui valident l'étape ; pour chaque **partie × langue** : son étape (ou aucune) et si elle est
  obligatoire (le nom en français l'est toujours) ; niveau de chaque contrôle (bloquant, conseillé,
  désactivé). **Aperçu d'impact** avant d'enregistrer : combien d'éléments en ligne auraient des parties
  obligatoires non validées (`ReviewStore.impactOf`, calculé sur l'appareil).
- **Rôles** (`roles`) : nom, droits (modifier, envoyer, valider, publier, gérer les workflows, gérer les
  rôles et l'équipe), limite à des langues (traducteur) ; l'administrateur ne se modifie pas ; un rôle
  donné à des membres ne se supprime pas.
- **Équipe** (`equipe`) : ajouter un compte par son e-mail (la personne doit s'être connectée une fois
  sur le site), changer son rôle, le retirer. À chaque enregistrement des rôles, les droits recopiés
  sur les membres sont remis à jour (`TeamStore.refreshRights`).

## Moteur (`/admin/moteur`)

Permet de régler le moteur « Warini chnowa ntayeb » sans toucher au code
(fonctionnement du moteur : [04](04-moteur-matching.md)).

Six sous-pages, chacune avec son adresse : `simulateur` (ouverte par défaut), `scenarios`,
`mises-en-avant`, `remplacements`, `reglages` (seuils et poids, puis ordre), `historique`. Le brouillon est
partagé par toutes (`matching/MatchingDraftContext.tsx`) : on peut changer un réglage puis aller voir
les scénarios sans le perdre. La barre de publication (version en ligne, brouillon, note, scénarios
cassés, export / import) reste en haut de chaque sous-page (`EnginePublishBar`). Quitter le moteur
abandonne le brouillon, comme avant.

1. **Brouillon** : chaque modification reste un brouillon tant qu'elle n'est pas publiée.
2. **Simulateur** : un frigo (ou un frigo type), et côte à côte les suggestions publiées et celles
   du brouillon ; ce qui change est en couleur.
3. **Scénarios du chef** (enregistrés en base, `matching_scenarios`) : rejoués avec le brouillon ;
   un scénario cassé par le brouillon est signalé, et la publication est bloquée tant que « publier
   malgré tout » n'est pas coché. Le super admin peut **ajouter**, **modifier** (formulaire guidé : frigo,
   placard, filtres, vérifications par type, résultat en direct), **tester** (suggestions du scénario
   avec le brouillon), **supprimer**, **lancer les tests** (relecture de la base et nouveau passage),
   **exporter / importer** (JSON de sauvegarde ; un import remplace la liste en base). Fichier de
   départ : `docs/encyclopedie/donnees/scenarios-initiaux.json`.
4. **Mises en avant** : recette, priorité (1 à 10), date de fin facultative.
5. **Remplacements** : règles « X peut être remplacé par Y », sauf pour certaines catégories,
   sauf quand c'est l'ingrédient principal.
6. **Seuils et poids** : nombre d'achats pour « presque prête », poids des ingrédients, valeur d'un remplacement…
7. **Ordre d'affichage** : critères de tri de chaque niveau, à réordonner.
8. **Historique** : chaque publication crée une version ; on peut ouvrir une ancienne version dans
   le brouillon ou la republier (cela crée une nouvelle version).
9. **Exporter / importer** : fichier JSON des réglages ; un import arrive dans le brouillon.

Une publication écrit `settings/matching` et une nouvelle version dans `matching_settings_versions`
(transaction Firestore). Elle s'applique à tous les visiteurs au chargement suivant.
