# 08 · Serveur et API

Express 4, lancé avec `tsx`. Il sert l'API, les pages pour les moteurs de recherche et
l'application (Vite en développement, `dist/` en production).

## Organisation

| Fichier                                 | Rôle                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `server.ts`                             | Point d'entrée : lit la configuration, crée l'API, ajoute Vite ou `dist/`     |
| `server/app.ts`                         | `createApiApp({ adminConfig, vision })` : API avec dépendances injectées      |
| `server/routes/patronRoutes.ts`         | Connexion et session patron                                                   |
| `server/routes/visionRoutes.ts`         | Scan photo du frigo                                                           |
| `server/routes/seoRoutes.ts`            | `sitemap.xml`, `robots.txt`, pages rendues pour le SEO                        |
| `server/vision/visionProvider.ts`       | Interface `VisionProvider` (indépendante du fournisseur d'IA)                 |
| `server/vision/geminiVisionProvider.ts` | Implémentation Google Gemini                                                  |
| `server/vision/scanValidation.ts`       | Vérification de l'image, du catalogue envoyé et de la réponse de l'IA (testé) |
| `server/seo.ts`                         | HTML des pages publiques (titre, description, schema.org, contenu lisible)    |
| `server/patronAuth.ts`                  | Configuration admin, jetons de session signés (HMAC-SHA256), comparaison sûre |
| `server/firebaseAdmin.ts`               | Firebase Admin : jeton Firebase du patron, lecture du catalogue pour le SEO   |

## Points d'accès

| Méthode | Adresse                           | Rôle                                                                   |
| ------- | --------------------------------- | ---------------------------------------------------------------------- |
| GET     | `/api/health`                     | État du serveur                                                        |
| POST    | `/api/auth/patron-login`          | Identifiants → jeton de session (8 h) + jeton Firebase si configuré    |
| GET     | `/api/auth/patron-verify`         | Vérifie le jeton (`Authorization: Bearer …`)                           |
| POST    | `/api/auth/patron-firebase-token` | Nouveau jeton Firebase pour une session existante (après rechargement) |
| POST    | `/api/vision/scan-fridge`         | Photo + catalogue → ingrédients reconnus + idées de plats              |
| GET     | `/sitemap.xml`, `/robots.txt`     | Référencement                                                          |

## Sécurité

- **Patron** : le mot de passe ne vit que sur le serveur ; mot de passe d'au moins 12 caractères et
  secret de session d'au moins 32, sinon la connexion est désactivée ; les deux champs sont toujours
  comparés (pas d'indice sur celui qui est faux) ; 5 échecs par quart d'heure et par IP.
- **Jetons de session** : signés, avec expiration ; le navigateur ne fait que les présenter.
- **Firestore** : le jeton Firebase du patron porte le droit `patron: true`, exigé par les règles.
- **Scan photo** : JPEG, PNG ou WebP, 4 Mo maximum, 10 scans par heure et par IP ; le catalogue
  envoyé est nettoyé (ids valides, noms sans retour à la ligne) ; la réponse de l'IA n'est jamais
  crue sur parole (ids inconnus → `null`, tailles limitées).
- `trust proxy` activé (hébergement derrière un proxy, pour les limites par IP) ; en-tête `x-powered-by` retiré.

## Scan photo : changer de fournisseur d'IA

1. Écrire `server/vision/<fournisseur>VisionProvider.ts` qui implémente `VisionProvider.scanFridge`.
2. Le choisir dans `server.ts` à la place de `createGeminiVisionProvider`.
   La validation (`scanValidation.ts`) et la route ne changent pas.

## SEO

Les adresses `/`, `/recettes` et `/recette/<slug>` sont envoyées avec leur titre, leur description,
l'adresse canonique, les cartes de partage, les données schema.org (recette) et un contenu lisible ;
l'application remplace ensuite ce contenu. `/suggestions` dépend du frigo de chacun : pas de page SEO.
Une recette inconnue renvoie une page 404. Le catalogue
utilisé est celui de Firestore si le serveur y a accès (cache de 10 minutes), sinon le catalogue intégré.
