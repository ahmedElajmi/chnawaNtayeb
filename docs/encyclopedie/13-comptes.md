# 13 · Comptes, profils et pays

Qui peut faire quoi, où vivent les données d'un compte, et comment créer un employé ou ouvrir un pays.

## Le modèle en trois niveaux

| Niveau          | Identité                                                                                                                                                                      | Droits                                                                                   | Où                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------ |
| **Client**      | Compte Firebase créé par le formulaire (`/inscription`)                                                                                                                       | Tout ce qu'un visiteur fait + ses données personnelles (favoris, frigo, profil)          | `users/{uid}`                  |
| **Employé**     | Même chose, mais le compte est **créé par le super admin** depuis le backoffice                                                                                               | + les droits de son rôle de l'équipe (voir [09](09-qualite-tests.md) et l'onglet Équipe) | `users/{uid}` + `admins/{uid}` |
| **Super admin** | **Jamais un compte Firebase normal** : identifiant/mot de passe du serveur (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) → session signée → jeton Firebase avec le droit `super admin` | Tous les droits                                                                          | Session serveur uniquement     |

Règles d'or :

- **Le champ `type` d'un profil vaut `client` ou `employee`** — il décrit la structure, jamais des variantes de clients (celles-là sont des données : `segment`, `tags`, futurs abonnements). Une variante de client ne doit jamais devenir une valeur de `type`.
- **Les fonctions client sont universelles** : un employé consulte le frigo, les suggestions et les courses avec son propre compte, exactement comme un client ; ses droits ne s'activent que dans `/admin`.
- **Aucun droit ne vient d'une adresse e-mail écrite dans le code ou les règles** : le backdoor e-mail a été supprimé. Le super admin passe par sa session, un employé par son rôle.

## Le profil (`users/{uid}`)

Champs : `uid`, `type`, `email`, `displayName`, `phone` (**E.164**, ex. `+21620123456` — l'indicatif fait partie du
nombre, jamais un champ séparé), `address` (bloc facultatif : `line`, `region`, `city`, `postalCode`, `country`),
`preferredLanguage`, `isAnonymous`, `favorites`, `savedFridge`, `lastLogin`. Un profil sans `type` est un client
(lecture tolérante, comme les anciens documents).

- Validations : `src/core/accounts` (`validateRegistration`, `validateProfileUpdate`, `normalizePhone` — via
  `libphonenumber-js`, la seule dépendance ajoutée). Le téléphone est facultatif et **non vérifié** pour l'instant :
  la porte d'une vérification SMS est le champ futur `phone_verified`.
- Le client ne peut écrire que son propre profil, avec la whitelist des règles (`isValidUserProfile`) ; le super admin et
  les membres `can_manage` peuvent les lire (jamais les favoris du frigo affichés : la fiche du backoffice ne montre
  que l'e-mail, l'inscription et la dernière connexion).
- Port : `AccountProfileRepository` (+ contrat `accountProfile.contract.ts`), store `AccountProfileStore`.

## L'inscription et le profil dans l'interface

- `UserAccountModal` : deux onglets (connexion / inscription). L'inscription porte nom, téléphone
  (`PhoneInput`), adresse facultative (`AddressFields`) et langue préférée ; les erreurs de validation
  s'affichent sur leur champ.
- Compte connecté (non invité) : section **Mon profil** — modifier nom, téléphone, adresse, langue, et changer
  son mot de passe (re-authentification d'abord).
- `PhoneInput` (`src/shared/ui`) : indicatif en liste déroulante rechercheable (drapeau calculé depuis le code ISO,
  nom du pays via `Intl.DisplayNames` — natif, aucune table de traduction) + champ national. `AddressFields` :
  pays (drapeau + nom), région (liste du pays), ville, rue, code postal. Les deux sont libres de toute logique
  métier : les règles vivent dans le core.

## Les pays (`countries/{iso}`)

Collection partagée **comme les recettes** : `SyncedCollectionStore` + copie IndexedDB, écritures du super admin,
lecture publique. Chaque document : `id` (ISO 2 lettres), `dial` (`+216`), `enabled`, `regions`
(`{id, name_fr, name_ar}` — la derja affiche le nom arabe), `postal_digits` facultatif.

- **Le super admin active ou désactive un pays d'un clic** (backoffice › Utilisateurs & pays), sans déploiement ;
  les sélecteurs de l'application ne proposent que les pays activés (téléphone : tous les indicatifs connus,
  pour ne jamais bloquer un numéro étranger).
- La **graine intégrée** (`src/core/accounts/countriesSeed.ts`) couvre la première visite : régénérée par
  `npm run build:countries` depuis des jeux de données libres (`country-region-data` + indicatifs de
  `libphonenumber-js`), Tunisie complète et activée.
- La Tunisie d'abord, l'international ensuite : ouvrir un pays = l'activer + compléter ses régions dans le
  backoffice. Les formats génériques (code postal 3-10 alphanumériques) acceptent déjà tout pays.
- Port générique : `SharedCollectionSource`/`Writer` (aucun nouveau port), adaptateur
  `firestoreCountries`, cache IndexedDB `'countries'`, contrat `sharedCollection.contract.ts`.

## Créer un employé

Backoffice › **Équipe** pour les membres, **Clients › Pays** pour les pays, **Clients › Comptes** pour l'annuaire :

1. Le super admin saisit l'e-mail, le nom affiché et le rôle, puis « **Créer le compte** ».
2. Le serveur (`POST /admin/api/employees`, session admin obligatoire, Admin SDK) crée le compte Firebase
   avec un **mot de passe temporaire** et l'affiche une fois : le super admin le transmet lui-même.
3. Le membre est ajouté à l'équipe (`admins/{uid}`) avec son rôle (les droits que lisent les règles).
4. L'employé se connecte avec le mot de passe temporaire et le change dans Mon profil.

Le client ne crée jamais un droit : la création passe par le serveur, la promotion passe par l'équipe.

## L'annuaire des comptes (backoffice › Clients › Comptes)

Liste paginée (24 par page, total exact via agrégation), recherche par **préfixe d'e-mail**, filtre par type
(tous / clients / employés). Chaque ligne : nom, e-mail, téléphone, badge de type, dernière connexion —
jamais les favoris ni le frigo de qui que ce soit. Port `AccountDirectoryRepository` (+ contrat), store
`AccountDirectoryStore`, adaptateur `firestoreAccountDirectory`. Le filtre de type lit le champ stocké :
un ancien document sans `type` n'apparaît que sous « tous » (il est retypé `client` à sa prochaine connexion).

## Évolutions prévues (portes déjà ouvertes)

- **Vérification du téléphone** (`phone_verified`) : SMS via Firebase Phone Auth ou Twilio, côté serveur.
- **Abonnements** : collection `subscriptions` écrite par le serveur (paiement/webhook) ; jamais un champ copié
  dans le profil.
- **Promotions** : collections `promotions` + `redemptions` et un module pur `src/core/promotions`, sur le même
  modèle que le moteur de matching ; les fourchettes de prix du domaine absorbent les remises.
- **Journal d'activité et statistiques** (phase 3) : les lectures backoffice de données personnelles y seront
  journalées.

## Authentification serveur (indépendante de Firebase Auth)

Depuis la centralisation, **l'authentification ne dépend plus de Firebase Auth** :

- **Sessions serveur** pour tous : invité (jeton anonyme), client, employé (8 h), super admin (8 h, identifiants d'environnement). Signées HMAC avec `ADMIN_SESSION_SECRET`.
- **Mots de passe** : collection **`auth/{uid}`** (serveur seul, jamais servie aux clients) contenant la chaîne **PHC** — l'algorithme et ses paramètres sont dans la chaîne. Hachage **argon2id** (`@node-rs/argon2`) par défaut.
- **Registre de hacheurs** (`server/auth/hashers.ts`) : `verify` lit l'algorithme depuis la chaîne PHC — un ancien haché reste vérifiable après un changement d'algorithme ; à chaque connexion réussie, re-hachage avec l'algorithme configuré.
- **Politique de mot de passe** (`settings/password`, page **Sécurité** de /admin) : algorithme, paramètres argon2 (mémoire/itérations/parallélisme), longueur minimale, classes de caractères exigées, mode de migration (`auto` = re-hachage transparent / `force_change` = nouveau mot de passe demandé à la connexion), verrouillage (tentatives, minutes, déverrouillage automatique) + **déverrouillage manuel** sur la fiche du client dans l'annuaire.
- **Création des employés** : `/admin/api/employees` écrit `users/{uid}` + `auth/{uid}` via le contrat de stockage (mot de passe temporaire argon2) — plus aucun compte Firebase Auth n'est créé.
- Endpoints : `/api/auth/register|login|guest|me|change-password`, `PUT /api/auth/profile`, `PUT /api/auth/sync-lists` (favoris/frigo), `GET /api/auth/password-criteria` (sous-ensemble public : longueur minimale + classes exigées, jamais l'algorithme ni le verrouillage), `/admin/api/password-policy`, `/admin/api/accounts/:uid/unlock`.
- Port client : `PasswordPolicyGateway` (contrat + jumeau mémoire + adaptateur HTTP).

### Côté navigateur (sessions du site)

- L'interface ne connaît **aucune logique de compte** : `userAuthHttpGateway` appelle `/api/auth/*`, le serveur décide qui est connecté et signe le jeton.
- Le jeton de session vit dans **`localStorage`** (clé `user_session`, avec sa date d'expiration) : la session survit au redémarrage de la PWA ; un jeton expiré ou refusé par `/api/auth/me` est effacé silencieusement.
- Le formulaire d'inscription affiche les **critères en vigueur** (longueur minimale, classes exigées) via `GET /api/auth/password-criteria`, avec confirmation du mot de passe, indicateur de robustesse et œil afficher/masquer (`PasswordInput` partagé).
- États honnêtes dans le modal compte : **Invité** (bandeau « tes données restent sur cet appareil » + bouton principal « Créer mon compte »), **Client** (fiche profil + changement de mot de passe), **Équipe** (badge dédié). Aucun lien vers le backoffice n'est exposé au public : l'accès passe par l'URL `/admin` (ou le raccourci « Espace admin » du manifeste PWA).
- Développement local sans Firebase : `LOCAL_MEMORY_STORE=1 npm run dev` garde toutes les données en mémoire (refusé en production).

### Comment appliquer un changement touchant Firebase (runbook anti-blocage)

| Changement                                           | Ordre d'application                                                                                                                  | Effet                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Renommage du claim (`superAdmin`)                    | Rien à faire : le claim n'est plus lu par personne (les sessions serveur décident)                                                   | —                                                                         |
| Nouvelles collections (`auth`, `users`, `settings`)  | Rien à faire côté Firebase : créées à l'usage ; `npm run deploy:rules` pour garder le deny-all cohérent                              | Aucune interruption                                                       |
| Employés                                             | Les créer depuis `/admin` (Équipe) : le compte vit dans `users`+`auth`, plus dans Firebase Auth                                      | Le mot de passe temporaire s'affiche une fois                             |
| Bascule des données vers `/api/data/*` (PR D, faite) | Rien : le SDK Firebase a quitté le navigateur, `FIREBASE_SERVICE_ACCOUNT` reste requis sur Render (le serveur lit/écrit Firestore)   | Les règles Firestore deviennent un second filet, plus la porte principale |
| Passage à SQL (plus tard)                            | `DATA_STORE=postgres` + importer le backup JSON dans les tables (id + JSONB + revision) ; les hachés argon2 suivent avec les comptes | Les clients gardent leur mot de passe (les hachés sont chez nous)         |

**Firebase Auth devient inutile** : aucun compte n'y est créé ni vérifié ; la console Firebase ne sert plus qu'au projet Firestore. Rien à supprimer côté console — le vide ne gêne pas.
