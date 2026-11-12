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

| Onglet          | Fichier                                           | Fonctions                                                        |
| --------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Tableau de bord | `dashboard/DashboardTab.tsx`                      | Chiffres clés, actions rapides                                   |
| Recettes        | `recipes/RecipesTab.tsx`, `RecipeEditorModal.tsx` | Liste, recherche, publier/dépublier, créer, modifier, supprimer  |
| Ingrédients     | `ingredients/IngredientsTab.tsx`                  | Ajouter, modifier (noms, unité, catégorie, prix), prix du marché |
| Moteur          | `matching/`                                       | Réglages du moteur (voir ci-dessous)                             |
| Thèmes          | `themes/ThemeEditor.tsx`                          | Créer, prévisualiser, publier des thèmes (contraste vérifié)     |
| Données         | `data/DataTab.tsx`                                | Sauvegarde/restauration JSON, synchronisation avec la base       |

Les actions sur le catalogue passent par `useCatalogAdmin` (port `CatalogAdminGateway`) : chaque
action enregistre localement, publie dans la base, rafraîchit les écrans et affiche le résultat
(succès ou erreur lisible).

**Champs en trois langues** : tout texte affiché au public se saisit en français, derja (lettres
latines, 3 / 7 / 9) et arabe, avec le composant `ui/LocalizedField.tsx` (arabe de droite à gauche).
Le français est la langue de référence : derja ou arabe vide → le français est affiché.

**Éditeur de recette** : nom, description, **étapes de préparation** et astuce du chef dans les trois
langues ; temps, prix, portions, image, vidéo YouTube (vérifiée), catégorie, type de cuisine,
healthy, ingrédients avec leur **rôle** et leurs substitutions. Les étapes (`RecipeStepsEditor.tsx`)
s'ajoutent, se suppriment et se déplacent (monter / descendre) ; elles sont renumérotées à
l'enregistrement. Avant d'enregistrer, `validateRecipe` (domaine) vérifie le nom français, au
moins un ingrédient et au moins une étape en français. Une nouvelle recette commence avec une
étape vide. L'adresse de la recette est générée à partir du nom et rendue unique (`recipeDraft.ts`,
testé). Retirer la vidéo la supprime aussi de la base (document remplacé en entier, voir
[05](05-application-donnees.md)).

**Éditeur d'ingrédient** (`ingredients/IngredientEditorModal.tsx`, bouton crayon de la liste) :
noms dans les trois langues, catégorie, unité, prix ; vérifié par `validateIngredient`.

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
