# 01 · Produit

## L'idée

**Chnowa Ntayeb ?** (« Qu'est-ce que je cuisine ? » en derja tunisienne) by **Chef Souhed**
aide à trouver quoi cuisiner en 30 secondes avec ce qu'il y a dans le frigo, en priorité des
plats tunisiens familiaux. Slogan : _« Elli 3andek fel frigo, na3mlou bih makla ! »_.

C'est une **application web installable (PWA)** : elle fonctionne dans le navigateur, s'installe
sur l'écran d'accueil d'un téléphone et reste utilisable hors ligne.

## Les utilisateurs

| Qui                          | Ce qu'il fait                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Visiteur                     | Coche les ingrédients de son frigo, voit ses suggestions et tout le catalogue, prépare menu et courses (ne crée ni ingrédient ni recette) |
| Visiteur avec un compte      | Idem, compte Firebase (invité ou e-mail)                                                                                                  |
| Super admin (administrateur) | Seul à gérer recettes, ingrédients, prix, thèmes et réglages du moteur, dans `/admin`                                                     |

## Les écrans

| Adresse         | Écran         | Rôle                                                                                                                                                                                     |
| --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Accueil       | Présentation, raccourcis (express, < 5 DT, tradition, healthy), recettes prêtes                                                                                                          |
| `/fridge`       | El Frigo      | Cocher ses ingrédients (récapitulatif en haut), bouton panier par ingrédient (ajout direct à la liste de courses), placard, scan photo (IA) ; ajout d'ingrédients réservé au super admin |
| `/recipes`      | Maklet        | Catalogue complet (recettes faisables avec le frigo en premier), avec filtres                                                                                                            |
| `/suggestions`  | Suggestions   | Recettes classées en « prêtes », « presque prêtes », « idées » selon le frigo                                                                                                            |
| `/recipe/:slug` | Fiche recette | Ingrédients (disponibles / manquants / remplacés), étapes, vidéo, manquants sélectionnables ajoutés aux courses                                                                          |
| `/planner`      | Menu Jom3a    | Menu de la semaine (déjeuner, dîner ; entrée, plat, dessert), génération automatique                                                                                                     |
| `/grocery`      | Qadhya        | Liste de courses (générée depuis le menu, ajout d'ingrédients du catalogue ou manuel), unités changeables, partage WhatsApp                                                              |
| `/admin`        | Backoffice    | Administration (voir [07 Backoffice](07-backoffice.md))                                                                                                                                  |

## Catalogue et suggestions : deux écrans

- **`/recipes` (Toutes les recettes)** : toutes les recettes publiées, quel que soit le frigo. Les
  recettes faisables passent en premier (prêtes → presque prêtes → idées → les autres).
- **`/suggestions` (Mes suggestions)** : uniquement les recettes liées au frigo, par niveau. C'est là
  que mène le bouton « Trouver mes recettes ! » du frigo. Frigo vide : invitation à le remplir.

Des onglets en haut des deux écrans permettent de passer de l'un à l'autre en gardant les filtres.

## Les trois niveaux de suggestions

- **Njem ntayebha tawa ! (prêtes)** : rien à acheter.
- **Naqsek ken chwaya (presque prêtes)** : une ou deux courses.
- **Afkar okhra behya (idées)** : recettes liées au frigo, mais avec davantage de courses.

Le détail des règles est dans [04 Moteur de matching](04-moteur-matching.md).

## Langues

Trois langues d'interface et de contenu : **derja** (tunisien en alphabet latin, par défaut),
**français** et **arabe** (affichage de droite à gauche). Chaque recette, ingrédient et thème
a ses trois noms (`name_fr`, `name_derja`, `name_ar`).

## Vocabulaire

| Terme                    | Sens                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frigo                    | Ingrédients cochés par l'utilisateur                                                                                                                           |
| Placard (pantry)         | Ingrédients toujours disponibles à la maison (sel, huile, épices…), réglables par l'utilisateur                                                                |
| Ingrédient clé (`key`)   | Sans lui le plat n'existe pas (merguez d'une ojja merguez)                                                                                                     |
| Secondaire (`secondary`) | Nécessaire, mais on peut l'acheter (oignon, poivron…)                                                                                                          |
| Épice / base (`staple`)  | Sel, huile, épices : ne bloque jamais une recette                                                                                                              |
| Substitution             | Ingrédient qui en remplace un autre (agneau au lieu de bœuf)                                                                                                   |
| Unités compatibles       | Deux unités de même famille (g et kg, ml et l) : on peut les additionner et convertir ; deux choses comptées différentes (pièce, botte) ne se mélangent jamais |
| Catégorie (course)       | Entrée, plat principal ou dessert                                                                                                                              |
| Express                  | Recette de 20 minutes ou moins (calculé, pas saisi)                                                                                                            |
| Healthy                  | Plat équilibré, marqué par le super admin                                                                                                                      |
| Super admin              | Administrateur, connecté par le serveur                                                                                                                        |
| Scénario du chef         | Règle de qualité « avec ce frigo, on doit voir ces plats »                                                                                                     |
| DT                       | Dinar tunisien                                                                                                                                                 |
