# 08 · Serveur et API

Express 4, lancé avec `tsx`. Il sert l'API, les pages pour les moteurs de recherche et
l'application (Vite en développement, `dist/` en production).

## Organisation

| Fichier                                 | Rôle                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `server.ts`                             | Point d'entrée : lit la configuration, crée l'API, ajoute Vite ou `dist/`                             |
| `server/app.ts`                         | `createApiApp({ adminConfig, vision })` : API avec dépendances injectées                              |
| `server/routes/adminRoutes.ts`          | Connexion et session super admin                                                                      |
| `server/routes/visionRoutes.ts`         | Scan photo du frigo                                                                                   |
| `server/routes/seoRoutes.ts`            | `sitemap.xml`, `robots.txt`, pages rendues pour le SEO                                                |
| `server/vision/visionProvider.ts`       | Interface `VisionProvider` (indépendante du fournisseur d'IA)                                         |
| `server/vision/geminiVisionProvider.ts` | Implémentation Google Gemini                                                                          |
| `server/vision/scanValidation.ts`       | Vérification de l'image, du catalogue envoyé et de la réponse de l'IA (testé)                         |
| `server/seo.ts`                         | HTML des pages publiques (titre, description, schema.org, contenu lisible)                            |
| `server/adminAuth.ts`                   | Configuration admin, jetons de session signés (HMAC-SHA256), comparaison sûre                         |
| `server/firebaseAdmin.ts`               | Firebase Admin : accès Firestore (stockage derrière le contrat), droits des employés (`admins/{uid}`) |

## Points d'accès

Le détail complet des comptes est dans [13 Comptes](13-comptes.md), celui des données dans [05 Application & données](05-application-donnees.md).

| Méthode           | Adresse                                                                           | Rôle                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET               | `/api/health`                                                                     | État du serveur                                                                                                                                                                                                                                                                                                                                                                    |
| POST              | `/admin/api/login` · `/admin/api/verify`                                          | Identifiants → jeton de session (8 h) · vérification du jeton (`Authorization: Bearer …`)                                                                                                                                                                                                                                                                                          |
| POST              | `/api/auth/register` · `/login` · `/guest`                                        | Inscription, connexion, invité (sessions du site, `expires_at` inclus)                                                                                                                                                                                                                                                                                                             |
| GET               | `/api/auth/me` · `/api/auth/password-criteria`                                    | Profil de la session · critères de mot de passe publics                                                                                                                                                                                                                                                                                                                            |
| POST              | `/api/auth/change-password`                                                       | Changement de mot de passe (session requise)                                                                                                                                                                                                                                                                                                                                       |
| PUT               | `/api/auth/profile` · `/api/auth/sync-lists`                                      | Profil (adresse revalidée) · favoris + frigo de l'account                                                                                                                                                                                                                                                                                                                          |
| GET · PUT         | `/api/kitchen`                                                                    | La cuisine du compte (frigo, favoris, placard, menu, liste, préférences) : document server-only `kitchen/{uid}` ; le PUT garde une section seulement si elle est plus récente (nouveau gagne par section) — session Bearer client/employé, invités refusés, 30 req/min/IP, sections plafonnées (favoris/frigo ≤ 300, placard ≤ 100, liste ≤ 500) ; 1 lecture + 1 écriture par push |
| GET · POST · DEL  | `/api/kitchen/history` · `/api/kitchen/history/:id`                               | Les listes de courses archivées du compte (50 max, les plus récentes d'abord) : POST archive une entrée validée (≤ 500 articles, commentaire ≤ 300), DELETE ne retire que celles du compte — session Bearer client/employé, invités refusés                                                                                                                                        |
| POST              | `/api/data/changes`                                                               | Delta de toutes les collections suivies (watermark : client à jour = 0 lecture)                                                                                                                                                                                                                                                                                                    |
| GET               | `/api/data/:name/empty` · `/where` · `/:id`                                       | Collection vide · requête par champ (managers) · un document                                                                                                                                                                                                                                                                                                                       |
| PUT/DELETE · POST | `/api/data/:name/:id` · `/api/data/:name` (batch) · `/api/data/:name/replace`     | Écritures (droits « publisher », collections serveur exclues)                                                                                                                                                                                                                                                                                                                      |
| POST              | `/admin/api/workspace/save` · `/publish` · `/unpublish` · `/import`               | Écritures atomiques du workflow (garde `written_at`)                                                                                                                                                                                                                                                                                                                               |
| GET/POST          | `/api/settings/matching` · `/api/settings/review` · `/admin/api/settings/publish` | Réglages actifs (matching public, review manager) + publication versionnée                                                                                                                                                                                                                                                                                                         |
| GET               | `/api/themes`                                                                     | Thèmes publiés (visiteur) · tous les thèmes (managers)                                                                                                                                                                                                                                                                                                                             |
| GET               | `/admin/api/accounts` · `/lookup`                                                 | Annuaire paginé des comptes · recherche par e-mail (managers)                                                                                                                                                                                                                                                                                                                      |
| POST              | `/api/accounts/employees`                                                         | Création d'un compte employé (session super admin, mot de passe temporaire)                                                                                                                                                                                                                                                                                                        |
| POST              | `/api/vision/scan-fridge`                                                         | Photo + catalogue → ingrédients reconnus + idées de plats                                                                                                                                                                                                                                                                                                                          |
| GET               | `/sitemap.xml`, `/robots.txt`                                                     | Référencement                                                                                                                                                                                                                                                                                                                                                                      |

## Sécurité

- **Super admin** : le mot de passe ne vit que sur le serveur ; mot de passe d'au moins 12 caractères et
  secret de session d'au moins 32, sinon la connexion est désactivée ; les deux champs sont toujours
  comparés (pas d'indice sur celui qui est faux) ; 5 échecs par quart d'heure et par IP.
- **Jetons de session** : signés, avec expiration ; le navigateur ne fait que les présenter. Un seul
  mécanisme pour tous (super admin, employés, clients, invités) — aucune identité cloud côté client.
- **Droits** : chaque requête de données repasse par `resolveIdentity` (session super admin → tout ;
  employé → droits de `admins/{uid}` ; visiteur → lecture des collections publiques seulement).
- **Scan photo** : JPEG, PNG ou WebP, 4 Mo maximum, 10 scans par heure et par IP ; le catalogue
  envoyé est nettoyé (ids valides, noms sans retour à la ligne) ; la réponse de l'IA n'est jamais
  crue sur parole (ids inconnus → `null`, tailles limitées).
- `trust proxy` activé (hébergement derrière un proxy, pour les limites par IP) ; en-tête `x-powered-by` retiré.
- **En-têtes de sécurité** (`server/headers.ts`, branché dans `server/app.ts`) : `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, HSTS en https, et une **CSP minimale** qui ne
  restreint que des mécanismes que l'application n'utilise pas (`frame-ancestors`, `base-uri`,
  `form-action`, `object-src`) — aucune page légitime ne peut être cassée. Une CSP complète
  (scripts, styles, frames, connexions) devra d'abord tourner en mode `Report-Only` : le script
  inline du thème et le serveur Vite de développement seraient sinon bloqués.

## Scan photo : changer de fournisseur d'IA

1. Écrire `server/vision/<fournisseur>VisionProvider.ts` qui implémente `VisionProvider.scanFridge`.
2. Le choisir dans `server.ts` à la place de `createGeminiVisionProvider`.
   La validation (`scanValidation.ts`) et la route ne changent pas.

## SEO

Beaucoup de robots et d'assistants IA (ChatGPT…) ne lancent pas le JavaScript : ils ne voient que le HTML
envoyé par le serveur. **Chaque adresse publique** est donc envoyée avec son titre, sa description,
l'adresse canonique, les cartes de partage, les données schema.org et une **copie lisible** de son contenu
(`server/seo.ts`, table `SCREENS`) :

| Adresse                | Copie lisible                                                   | Indexée                 |
| ---------------------- | --------------------------------------------------------------- | ----------------------- |
| `/`                    | présentation + recettes (1re page) + lien vers toutes           | oui                     |
| `/recettes`            | toutes les recettes par plat, `ItemList`                        | oui                     |
| `/recette/<slug>`      | recette complète (ingrédients, étapes, astuce), `Recipe`        | oui                     |
| `/frigo`               | tous les ingrédients par catégorie avec leur fourchette de prix | oui                     |
| `/suggestions`         | explication + recettes                                          | canonique → `/recettes` |
| `/semaine`, `/courses` | titre et explication (contenu personnel, gardé sur l'appareil)  | non (`noindex, follow`) |

- **Invisible pour les visiteurs** : la copie est toujours dans `<main class="seo-fallback">` (fonction
  `fallback`), masquée par `index.html` (le logo s'affiche pendant le chargement, le texte seulement sans
  JavaScript) puis remplacée par React. Un test vérifie que chaque page l'utilise.
- **Listes par pages** : au plus `LIST_PAGE_SIZE` (100) éléments, total réel affiché, liens
  « Page suivante / précédente » (`?page=2`, `rel="next"`) que les robots suivent ; une page au-delà de
  la fin renvoie 404. L'accueil montre la 1re page et renvoie vers `/recettes`.
- **Peu importe l'en-tête `Accept`** : toute requête GET ou HEAD sur une adresse publique reçoit la page
  (certains robots n'envoient pas `text/html`). Les autres adresses (`/admin`, fichiers, `/api`) ne
  passent pas par le catalogue (`isSeoPath`).
- Une recette ou une adresse de liste inconnue renvoie une page 404 (`noindex`).
- **Adresse de base** : toutes ces URLs (canonical, sitemap, robots) viennent de la variable
  `APP_URL` (`server/http.ts`, `getBaseUrl`). Les en-têtes de la requête ne sont jamais lus :
  un client peut les forger (empoisonnement de canonical/sitemap). En production, le serveur
  refuse de démarrer sans `APP_URL` ; en développement il retombe sur `http://localhost:PORT`.
- **Nouvelle adresse publique** : ajouter son constructeur dans `SCREENS` (sinon les robots la voient vide).
- Le catalogue utilisé est celui de Firestore si le serveur y a accès (seulement les changements, au plus
  une fois par minute et seulement quand une page est demandée), sinon le catalogue intégré. Il est lu
  dès le démarrage du serveur (`server.ts`) pour que le premier robot après un réveil n'attende pas la base.
- Tests : `server/seo.test.ts`.
