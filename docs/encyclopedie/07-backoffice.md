# 07 · Backoffice patron (`/patron`)

## Accès

- Adresse `/patron`, ou trois clics sur le logo, ou depuis la fenêtre « Compte ».
- Une fois connecté : badge « Patron » et « Quitter » dans l'en-tête (ordinateur et tablette) ;
  sur téléphone, Réglages › Application, section « Patron » (accès au backoffice, quitter le mode patron).
- Connexion vérifiée **uniquement par le serveur** (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) :
  5 tentatives ratées par quart d'heure et par adresse IP, session de 8 heures.
- Si le serveur dispose de `FIREBASE_SERVICE_ACCOUNT`, la session donne aussi le droit d'écrire
  dans Firestore (statut « Connecté ») ; sinon le backoffice fonctionne en **mode local** :
  les modifications restent sur l'appareil.
- Le code du backoffice n'est téléchargé que par le patron (chargement à la demande).

## Onglets (`src/features/backoffice/`)

| Onglet          | Fichier                                           | Fonctions                                                       |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| Tableau de bord | `dashboard/DashboardTab.tsx`                      | Chiffres clés, actions rapides                                  |
| Recettes        | `recipes/RecipesTab.tsx`, `RecipeEditorModal.tsx` | Liste, recherche, publier/dépublier, créer, modifier, supprimer |
| Ingrédients     | `ingredients/IngredientsTab.tsx`                  | Ajouter, modifier (noms, unité, catégorie, photo), prix min–max |
| Moteur          | `matching/`                                       | Réglages du moteur (voir ci-dessous)                            |
| Thèmes          | `themes/ThemeEditor.tsx`                          | Créer, prévisualiser, publier des thèmes (contraste vérifié)    |
| Données         | `data/DataTab.tsx`                                | Sauvegarde/restauration JSON, synchronisation avec la base      |

Les actions sur le catalogue passent par `useCatalogAdmin` (service `CatalogAdmin`, `src/application`) :
chaque action s'affiche tout de suite sur cet appareil, est écrite dans la base (document complet,
versionné), puis arrive **en direct** sur tous les autres appareils ouverts. Le résultat (succès ou
erreur lisible) est affiché. Une suppression publie une marque de suppression. « Récupérer depuis le
cloud » relit tout le catalogue. À la première connexion du patron, une base vide reçoit le catalogue
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

**Restauration d'une sauvegarde** (onglet Données) : relue par `parseBackup` ; le message indique le
nombre de recettes et d'ingrédients restaurés et les éléments illisibles ignorés, et rappelle
d'« Envoyer vers le cloud » pour publier.

## Onglet Moteur

Permet de régler le moteur « Warini chnowa ntayeb » sans toucher au code
(fonctionnement du moteur : [04](04-moteur-matching.md)).

1. **Brouillon** : chaque modification reste un brouillon tant qu'elle n'est pas publiée.
2. **Simulateur** : un frigo (ou un frigo type), et côte à côte les suggestions publiées et celles
   du brouillon ; ce qui change est en couleur.
3. **Scénarios du chef** (enregistrés en base, `matching_scenarios`) : rejoués avec le brouillon ;
   un scénario cassé par le brouillon est signalé, et la publication est bloquée tant que « publier
   malgré tout » n'est pas coché. Le patron peut **ajouter**, **modifier** (formulaire guidé : frigo,
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
