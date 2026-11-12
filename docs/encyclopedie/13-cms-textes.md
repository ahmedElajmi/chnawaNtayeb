# 13 · CMS des textes de l'interface (étude)

> **Statut : étude de conception, rien n'est implémenté.** Cette page décrit comment rendre les textes
> de l'interface (aujourd'hui dans `src/shared/i18n/translations.ts`) modifiables par le patron dans
> `/patron`, sans toucher au code. Elle suit la checklist de `CLAUDE.md` et réutilise la
> **synchronisation incrémentale générique** développée en parallèle (voir « Synchronisation »),
> sans la redéfinir.

## Objectif et périmètre

- Le patron corrige ou traduit un texte de l'interface publique (« Warini chnowa ntayeb », libellés
  des filtres, messages vides, toasts…) dans les trois langues, depuis `/patron` › **Textes**.
- Les valeurs actuelles du code restent les **valeurs par défaut** : une base vide = l'application
  d'aujourd'hui, à l'identique. Le patron n'enregistre que des **surcharges**.
- Le changement arrive chez tous les visiteurs sans nouvelle version de l'application.

**Hors périmètre** (à garder en tête, pas dans cette étude) :

| Sujet                                                | Pourquoi                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Contenu du catalogue (recettes, ingrédients, thèmes) | Déjà multilingue et modifiable (`LocalizedField`, voir [07](07-backoffice.md))               |
| Textes du backoffice (clés `bo…`, libellés en dur)   | Le backoffice est en français en dur ; les 19 clés `bo…` sont à retirer, pas à éditer        |
| `index.html`, `manifest.json`, SEO du serveur        | Lus avant React ou par le serveur ; ils ont leur propre cycle (voir [08](08-serveur-api.md)) |
| Pluriels grammaticaux (`person` / `persons`)         | Gardés tels quels ; un vrai format de pluriel serait une évolution séparée                   |

## État actuel

- `translations.ts` : une interface `TranslationDictionary` (≈ 180 clés, à plat, en camelCase, sections
  marquées par des commentaires `// Navigation`, `// Filters`…) et un objet `translations` par langue
  (`derja`, `fr`, `ar`), soit ≈ 540 textes.
- Seul `src/app/providers/LanguageContext.tsx` l'importe ; il expose `t = translations[language]`.
  147 clés distinctes sont lues dans les écrans (`t.navHome`…).
- Trois variables existent : `{n}`, `{course}`, `{list}`, remplacées à la main par
  `t.xxx.replace('{n}', …)` dans les écrans (ex. `WeeklyPlannerView.tsx`).
- Plusieurs textes contiennent `<` légitimement (`'< 30 min'`) ; le texte le plus long fait 169
  caractères (`heroSubtitle` en arabe).
- Aucun texte n'est rendu en HTML (`dangerouslySetInnerHTML` absent de `src/`).

## Principes retenus

1. **Défaut dans le code, surcharge en base.** Le code reste la référence complète et typée ; la base
   ne contient que ce que le patron a changé (quelques dizaines à quelques centaines de documents).
2. **Une clé = un document.** Écriture et synchronisation au grain le plus fin ; aucune limite de
   taille de document ; un changement coûte une lecture par appareil, pas tout le dictionnaire.
3. **Le domaine décide** (clés connues, variables, longueurs, contenu interdit) ; la base et ses règles
   ne font que l'appliquer en défense.
4. **Aucun ralentissement du premier affichage** : les textes s'affichent tout de suite avec ce que
   l'appareil connaît déjà ; la base ne sert qu'à mettre à jour.
5. **Rien de nouveau quand ça existe** : synchronisation générique, `LocalizedField`,
   `EditorLanguageProvider`, `ModalShell`, `useCloseOnBack`, `parseBackup`, modèle de brouillon.

## Modèle de données

### Domaine (`src/core/uitext`, nouveau module)

Le dictionnaire par défaut est de la donnée pure : il **déménage** dans le domaine pour que la
validation connaisse les clés et leurs variables (le domaine ne peut pas importer `src/shared`).

```ts
// src/core/uitext/defaults.ts : contenu actuel de translations.ts, découpé en sections
export const UI_TEXT_SECTIONS = {
  navigation: { navHome: { derja: 'Dar', fr: 'Accueil', ar: 'الرئيسية' }, /* … */ },
  fridge:     { /* … */ },
  // …
} as const;

export type UiTextKey = /* union de toutes les clés, dérivée de UI_TEXT_SECTIONS */;
export type UiTextSection = keyof typeof UI_TEXT_SECTIONS;
export type UiTextDictionary = Record<UiTextKey, string>; // remplace TranslationDictionary

/** What the patron changed for one key; an absent language means "use the code default". */
export interface UiTextOverride {
  key: UiTextKey;
  fr?: string;
  derja?: string;
  ar?: string;
}
```

- Les **sections** (Navigation, Frigo, Filtres, Fiche recette, Menu, Courses…) deviennent des données
  (aujourd'hui des commentaires) : l'écran du patron s'en sert pour regrouper et filtrer.
- `src/shared/i18n/translations.ts` disparaît (ou ne fait que réexporter le temps de la migration) :
  **une seule** source des textes par défaut.
- Les clés restent **identiques** aux noms actuels (`navHome`) : pas de renommage, pas de risque.
  Une clé renommée plus tard passe par une table `UI_TEXT_RENAMES` (ancienne → nouvelle) appliquée à la
  lecture ; une clé supprimée du code rend sa surcharge **orpheline** (ignorée, signalée au patron).

### Résolution d'un texte (une seule fonction, dans le domaine)

Pour une clé et une langue, la valeur affichée est la première non vide de :

1. surcharge du patron dans la langue demandée ;
2. défaut du code dans la langue demandée ;
3. surcharge française (le français est la langue de référence) ;
4. défaut français du code.

```ts
resolveUiTexts(language, overrides: ReadonlyMap<UiTextKey, UiTextOverride>): UiTextDictionary
```

L'étape 2 passe **avant** l'étape 3 : si le patron corrige seulement le français, le derja et l'arabe
du code restent affichés (ils sont déjà traduits). L'écran du patron signale alors que la traduction
derja / arabe ne correspond peut-être plus (voir « Traductions à revoir »). Cette fonction remplace
`translations[language] || translations.derja` et réutilise la logique de repli de `pickLocalized`
(pas de second ordre de langues codé ailleurs).

### Stockage (base, collection `ui_texts`)

| Champ        | Type                  | Rôle                                                                      |
| ------------ | --------------------- | ------------------------------------------------------------------------- |
| id du doc    | clé (`navHome`)       | Une clé = un document                                                     |
| `fr`         | texte, facultatif     | Surcharge française                                                       |
| `derja`      | texte, facultatif     | Surcharge derja (lettres latines, 3 / 7 / 9)                              |
| `ar`         | texte, facultatif     | Surcharge arabe                                                           |
| `based_on`   | texte, facultatif     | Empreinte du défaut français au moment de la modification (voir plus bas) |
| `updated_at` | horodatage du serveur | Version, utilisée par la synchronisation incrémentale                     |
| `deleted`    | booléen               | Marqueur de suppression (« Rétablir le texte d'origine »)                 |

- **Rétablir le texte d'origine** d'une clé = écrire `deleted: true` (sans les textes) plutôt que
  supprimer le document : les autres appareils, qui ne relisent que ce qui a changé depuis leur
  dernière version, apprennent ainsi la suppression. Le nettoyage physique des marqueurs anciens est
  l'affaire de la synchronisation générique, pas de ce module.
- Rétablir **une seule langue** = réécrire le document entier sans cette langue (règle « objet écrit
  en entier, sans fusion » de `CLAUDE.md`).
- `based_on` : empreinte courte (hachage) du défaut français du code. Si le défaut change dans une
  future version du code, l'écran du patron signale « le texte d'origine a changé depuis votre
  modification ». Facultatif, utile, peu coûteux.
- Les noms de champs (`updated_at`, `deleted`) sont ceux de la synchronisation générique ; s'ils
  diffèrent à sa livraison, on s'aligne sur elle.

## Validation (domaine, `src/core/uitext`)

Deux fonctions, testées à côté (`uiText.test.ts`) :

- `parseUiTextOverride(raw: unknown): UiTextOverride | null` : **toute** donnée lue (base, cache,
  sauvegarde) passe par elle. Clé inconnue (après `UI_TEXT_RENAMES`) → ignorée et comptée ; langue
  invalide → cette langue est ignorée, les autres sont gardées ; aucune langue valide → `null`.
- `validateUiTextOverride(override): ValidationError[]` : ce que le patron saisit, avant
  l'enregistrement. Erreurs avec leur `field` (`fr`, `derja`, `ar`) pour être affichées sur le champ.

| Règle                    | Détail                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clé connue               | La clé existe dans `UI_TEXT_SECTIONS` (les clés `bo…` et les clés verrouillées sont refusées)                                                                                             |
| Variables conservées     | L'ensemble des variables `{nom}` d'un texte est **exactement** celui du défaut français de la clé : ni oubli (`{n}` disparu → « 3 » n'apparaît plus), ni ajout (`{prix}` jamais remplacé) |
| Texte non vide           | Une langue vide ou faite d'espaces = « pas de surcharge » pour cette langue (texte nettoyé : espaces de début et de fin, espaces multiples)                                               |
| Longueur                 | Maximum absolu **300 caractères** (plus long que tout texte actuel, 169) ; avertissement non bloquant au-delà de 2 × la longueur du défaut (risque de mise en page cassée à 320 px)       |
| Pas de balisage          | Refus de `<` suivi d'une lettre, de `/` ou de `!` (balise, commentaire) ; `'< 30 min'` reste accepté. Refus des caractères de contrôle et des schémas `javascript:` / `data:`             |
| Pas de nouvelle accolade | `{` ou `}` hors d'une variable valide refusés (évite les variables mal écrites)                                                                                                           |

**Défense en profondeur contre l'injection** : la validation n'est pas la seule barrière. Les textes ne
sont **jamais** rendus en HTML (React échappe le texte) ; un test d'architecture ajouté à
`architecture.test.ts` interdit `dangerouslySetInnerHTML` dans `src/features`, `src/shared` et `src/app`.
Un texte utilisé dans une adresse (partage WhatsApp) passe toujours par `encodeURIComponent`.

**Variables** : une fonction du domaine `formatUiText(template, values)` remplace les
`t.xxx.replace('{n}', …)` des écrans (une seule règle, testée ; une variable absente des valeurs reste
visible plutôt que de planter). Les variables connues sont déduites des défauts, pas d'une liste à
maintenir à la main.

**Clés verrouillées** : une courte liste `UI_TEXT_LOCKED` (ex. `appName`, la marque) que le patron voit
mais ne peut pas modifier. Décision à confirmer avec le propriétaire.

## Port et store (`src/application`)

### Port (mots du domaine, aucun nom de base)

La synchronisation générique fournit les ports de collection synchronisée
(`SyncedCollectionSource<T>` pour la base, `LocalCollectionCache<T>` pour la copie hors ligne). Les
textes n'ajoutent qu'un port d'**écriture** du patron et un **instantané** pour le premier affichage :

```ts
/** UI text overrides written by the patron (shared database = source of truth). */
export interface UiTextAdminGateway {
  /** Creates or replaces the overrides of these keys, all or nothing. */
  saveOverrides(overrides: UiTextOverride[]): Promise<WriteResult>;
  /** Back to the code defaults for these keys (other devices learn it at their next sync). */
  resetToDefault(keys: UiTextKey[]): Promise<WriteResult>;
}

/** Overrides of one language, read synchronously before the first render (device copy). */
export interface UiTextSnapshot {
  read(language: Language): Partial<Record<UiTextKey, string>> | null;
  write(language: Language, texts: Partial<Record<UiTextKey, string>>): void;
}
```

Si la synchronisation générique expose déjà une écriture par lot (`saveMany` / `markDeleted`), le
port d'écriture se réduit à elle : à décider au moment de l'implémentation, sans dupliquer.

### Store `UiTextStore`

- Construit sur `SyncedCollectionStore<UiTextOverride>` (configuré avec `parseUiTextOverride`) : il en
  reçoit la liste des surcharges à jour et leur version, sans rien réimplémenter (ni requête, ni
  cache, ni écoute).
- État exposé : `version` (change à chaque mise à jour) et `dictionary(language)` →
  `resolveUiTexts(...)`, **mémoïsé** par `(language, version)` : le même objet tant que rien ne
  change, donc aucun rendu inutile des écrans.
- À chaque mise à jour, il écrit l'instantané de la langue active (`UiTextSnapshot`).
- Méthodes du patron : `save(overrides)` (valide avec `validateUiTextOverride`, refuse tout le lot à la
  première erreur, renvoie les erreurs par clé et par champ), `reset(keys)`.
- Testé avec de faux adapters (source en mémoire, cache en mémoire, instantané en mémoire).

## Synchronisation (réutilisée, pas redéfinie)

Le mécanisme générique développé en parallèle fournit, pour toute collection partagée :

- `SyncedCollectionStore<T>` : état observable de la collection, version connue, fusion des
  changements ;
- `SyncedCollectionSource<T>` : adapter de base qui lit **seulement** les documents dont
  `updated_at > dernière version connue`, puis écoute en direct (`onSnapshot`) ;
- `LocalCollectionCache<T>` : copie hors ligne sur l'appareil (IndexedDB).

Les textes s'y branchent comme une collection de plus : `ui_texts`, type `UiTextOverride`, fonction
de lecture `parseUiTextOverride`. **Aucune** requête, écoute ou gestion de cache propre aux textes.
Hypothèse de cette étude : les noms et le contrat ci-dessus sont ceux de la synchronisation livrée ;
toute différence se règle dans `container.ts` et dans le store, pas dans le domaine ni les écrans.

## Règles de la base (`firestore.rules`)

```
// UI text overrides edited in /patron: public read, admin-only write, strict schema.
function isUiTextKey(id) {
  return id is string && id.matches('^[a-zA-Z][a-zA-Z0-9]{0,63}$');
}

function isUiTextValue(data, field) {
  return !(field in data) || (data[field] is string && data[field].size() > 0 && data[field].size() <= 300);
}

match /ui_texts/{key} {
  allow read: if true;
  allow write: if isAdmin() && isUiTextKey(key)
    && request.resource.data.keys().hasOnly(['fr', 'derja', 'ar', 'based_on', 'updated_at', 'deleted'])
    && isUiTextValue(request.resource.data, 'fr')
    && isUiTextValue(request.resource.data, 'derja')
    && isUiTextValue(request.resource.data, 'ar')
    && optionalString(request.resource.data, 'based_on', 64)
    && request.resource.data.updated_at == request.time
    && request.resource.data.deleted is bool;
  // No delete: resetting writes a deletion marker so other devices learn it.
}
```

- `updated_at == request.time` : la version vient du serveur, jamais de l'appareil (une horloge
  fausse ne peut pas casser la synchronisation incrémentale).
- La règle ne connaît pas la liste des clés (elle vit dans le code) : une clé inconnue écrite en base
  est simplement ignorée à la lecture par `parseUiTextOverride`.
- Ces détails (requête, horodatage du serveur, lot d'écriture) restent dans l'adapter et dans
  `firestore.rules`, jamais dans le domaine, les stores ou les écrans. Déploiement :
  `npm run deploy:rules`.

## Hors ligne et coût en lectures

| Situation                               | Lectures de la base                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| Aucun texte modifié (cas actuel)        | 1 requête vide par visite (minimum facturé), rien d'autre  |
| Première visite, _N_ surcharges en base | _N_ lectures, une seule fois                               |
| Visite suivante, rien n'a changé        | 1 requête vide                                             |
| Le patron enregistre _k_ textes         | _k_ lectures par appareil connecté ou à sa visite suivante |
| Le patron rétablit _k_ textes           | _k_ lectures (marqueurs de suppression)                    |

- Le coût dépend du nombre de **surcharges**, jamais du nombre de clés du code : des milliers de clés
  par défaut ne coûtent rien. Même avec des milliers de surcharges, seul le premier chargement d'un
  nouvel appareil les lit toutes ; ensuite seuls les changements sont lus.
- Les textes changent rarement : l'écoute en direct ne coûte presque rien. Si la synchronisation
  générique permet de choisir par collection (écoute en direct ou lecture à l'ouverture seulement),
  les textes peuvent se contenter de la lecture à l'ouverture et au retour sur l'onglet.
- Hors ligne : la copie IndexedDB (synchronisation générique) et l'instantané suffisent ; sans aucune
  copie, les défauts du code s'affichent. L'application ne bloque jamais sur la base.

## Premier affichage (`LanguageContext`)

Contrainte : IndexedDB est asynchrone, le premier rendu ne doit pas l'attendre, et un texte ne doit pas
« sauter » de la version du code à celle du patron sous les yeux du visiteur.

1. **Avant le rendu** : `LanguageProvider` lit l'instantané synchrone de la langue active
   (`UiTextSnapshot`, petite clé `localStorage` `chnowa_ui_texts_snapshot_v1`, ne contenant que les
   surcharges de cette langue, déjà résolues). Même principe que la copie des couleurs du thème
   (`chnowa_active_theme_vars_v1`) : coût négligeable, aucun clignotement.
2. **Fusion** : `t = { ...défauts[langue], ...instantané }`, calculée une fois par `useMemo` sur
   `(language, version)` ; ≈ 180 clés, une fraction de milliseconde.
3. **Ensuite** : le `UiTextStore` charge la copie IndexedDB puis la base ; à chaque nouvelle version,
   le contexte reçoit le nouveau dictionnaire résolu (`useSyncExternalStore`) et met l'instantané à jour.
4. **Changement de langue** : l'instantané de la nouvelle langue n'existe peut-être pas encore ; le
   store a déjà toutes les surcharges en mémoire, la résolution est immédiate.

`t` garde son type (`UiTextDictionary`, mêmes clés qu'aujourd'hui) : **aucun écran ne change**, sauf
les quelques `replace('{…}')` remplacés par `formatUiText`. Le contexte reste sans règle métier : il
appelle `resolveUiTexts` via le store.

## Écran du patron (`/patron` › Textes)

Nouvel onglet `src/features/backoffice/texts/` (`UiTextsTab.tsx`, `UiTextEditor.tsx`), libellés en
français en dur, chargé à la demande comme le reste du backoffice.

### Liste

- **Recherche** instantanée dans la clé, les défauts et les surcharges des trois langues (casse et
  accents ignorés, même normalisation que la recherche d'ingrédients ; aide du domaine
  `searchUiTexts`, testée).
- **Filtres** (avec leur nombre, comme la liste des ingrédients) : Section · Modifiés · **Traduction
  à revoir** (français modifié mais pas le derja ou l'arabe ; ou défaut du code changé depuis la
  modification, `based_on`) · **Traduction manquante** (langue dont la valeur affichée retombe sur le
  français) · Avec variables · Orphelins (surcharge d'une clé disparue du code, à supprimer).
- Chaque ligne est une **carte** (pas un tableau, lisible à 320 px) : texte affiché dans la langue
  choisie, pastille « modifié », pastilles des langues à revoir, nom de la section. La clé technique
  (`navHome`) est discrète, utile au développeur, pas au patron.
- Calculs des filtres et des compteurs dans le domaine (`uiTextStatus`), pas dans les composants.

### Édition

- Fenêtre `ModalShell` (plein écran sur téléphone), fermée par le bouton retour (`useCloseOnBack`).
- Onglets de langue **FR / Derja / عربي** (`EditorLanguageProvider`) et `LocalizedField` : une langue à la
  fois, le français en rappel pendant la traduction, l'arabe de droite à gauche, compteur des
  traductions manquantes sur chaque onglet.
- Sous chaque champ : **texte d'origine** (défaut du code) et bouton « Rétablir l'origine » pour cette
  langue ; en bas, « Rétablir les trois langues » (marqueur de suppression).
- **Variables** affichées en pastilles à insérer d'un toucher (`{n}`) ; une variable manquante ou en
  trop est signalée **sur le champ** pendant la saisie, avant même l'enregistrement.
- **Aperçu en direct** : le texte tel que le visiteur le verra, avec des valeurs d'exemple pour les
  variables (`{n}` → 3), dans la direction de la langue, à la largeur d'un téléphone (320 px), pour
  voir tout de suite un texte trop long. Plus tard : un mode « voir sur le site » qui applique le
  brouillon au seul appareil du patron pendant qu'il navigue.
- **Barre d'enregistrement fixe** : « Enregistrer (_n_ textes) » publie toutes les modifications en
  un lot (tout ou rien) ; erreur → ramène au texte et à la langue concernés, champ entouré de rouge.
- **Rien ne se perd** : modifications non enregistrées gardées en brouillon sur l'appareil, avec
  confirmation avant de les perdre, selon le modèle de l'éditeur de recette. Le port
  `RecipeDraftRepository` est à **généraliser** (brouillon d'un objet du backoffice identifié par un
  type et un id) plutôt qu'à dupliquer.
- Résultat affiché comme pour le catalogue : « 3 textes publiés », ou l'erreur lisible.

## Sauvegarde et restauration (JSON)

- La sauvegarde de l'onglet Données gagne une section `ui_texts` : **les surcharges complètes**
  (trois langues, `based_on`), pas les défauts du code (ils sont dans le code).
- La restauration relit cette section par `parseBackup`, qui délègue à `parseUiTextOverride` : clés
  inconnues ignorées et comptées dans le message (« 2 textes ignorés : clés inconnues »). Une ancienne
  sauvegarde sans section `ui_texts` reste valide.
- Comme le reste de la sauvegarde, la restauration s'applique sur l'appareil puis « Envoyer vers le
  cloud » publie (les surcharges absentes de la sauvegarde ne sont pas effacées : une restauration ne
  doit pas détruire de travail par surprise ; un « tout rétablir » explicite existe à part).
- Test d'aller-retour dans `backup.test.ts`, comme pour les recettes et les ingrédients.
- Facultatif : un export « à traduire » (toutes les clés, défaut + valeur affichée, par langue) pour un
  traducteur externe ; c'est un **export**, jamais une source de données de l'application.

## Migration

- Aucune donnée à migrer : la collection `ui_texts` démarre vide, l'application reste identique.
- Le seul changement de code « à risque » est le déménagement du dictionnaire dans `src/core/uitext`,
  sans changer une seule valeur : vérifié par un test qui compare clé par clé l'ancien et le nouveau
  dictionnaire avant de supprimer l'ancien fichier.
- Les 19 clés `bo…` sont retirées du dictionnaire (le backoffice est en français en dur), dans une
  étape séparée.
- Repli : vider la collection (ou ne pas déployer l'onglet) ramène exactement aux textes du code.

## Risques

| Risque                                               | Parade                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| La synchronisation générique n'est pas encore livrée | Étapes 1 à 3 du plan indépendantes ; l'adapter de base attend sa fusion dans `develop`              |
| Variable oubliée (« {n} recettes » → « recettes »)   | Refusée par le domaine, signalée pendant la saisie                                                  |
| Texte trop long, mise en page cassée sur téléphone   | Limite absolue, avertissement à 2 × le défaut, aperçu à 320 px                                      |
| Injection de HTML / lien                             | Validation du domaine + rendu React uniquement + test d'architecture sans `dangerouslySetInnerHTML` |
| Texte du code changé, surcharge devenue fausse       | `based_on` + filtre « Traduction à revoir »                                                         |
| Clé supprimée ou renommée dans le code               | `UI_TEXT_RENAMES`, surcharges orphelines ignorées et signalées                                      |
| Clignotement des textes au démarrage                 | Instantané synchrone de la langue active                                                            |
| Coût de lecture                                      | Lecture incrémentale, documents par clé, seulement les surcharges                                   |
| Patron qui modifie la marque ou un texte légal       | `UI_TEXT_LOCKED`                                                                                    |
| Règles de la base non déployées                      | Écriture refusée → message lisible ; étape `npm run deploy:rules` dans le plan                      |

## Plan d'implémentation (checklist de `CLAUDE.md`)

Chaque étape = une branche `feature/…` depuis `develop`, `npm run check` vert, PR vers `develop`.

1. **Domaine, sans changement visible** (`feature/ui-text-core`)
   - Déménager le dictionnaire dans `src/core/uitext/defaults.ts`, découpé en sections ; types
     `UiTextKey`, `UiTextDictionary`, `UiTextOverride` ; `LanguageContext` l'importe par `@/core/uitext`.
   - `formatUiText` + remplacement des `replace('{…}')` des écrans.
   - Test de non-régression (mêmes clés, mêmes valeurs) ; retrait des clés `bo…`.
2. **Règles du domaine** (même branche ou suivante)
   - `resolveUiTexts`, `parseUiTextOverride`, `validateUiTextOverride`, `uiTextStatus`,
     `searchUiTexts`, `UI_TEXT_RENAMES`, `UI_TEXT_LOCKED`, avec leurs tests.
   - Garde `dangerouslySetInnerHTML` dans `architecture.test.ts`.
3. **Application** (`feature/ui-text-store`)
   - Ports `UiTextAdminGateway` et `UiTextSnapshot` dans `ports.ts` ; `UiTextStore` sur
     `SyncedCollectionStore<UiTextOverride>`, testé avec de faux adapters.
   - Implémentations en mémoire (`src/infrastructure/memory/`) et **tests de contrat**
     (`src/infrastructure/contracts/uiTextAdminGateway.contract.ts`, `uiTextSnapshot.contract.ts`).
4. **Infrastructure** (`feature/ui-text-sync`, après fusion de la synchronisation générique)
   - Adapter de base : la source générique configurée sur `ui_texts` + écriture par lot (document
     entier, `updated_at` du serveur, marqueur de suppression) ; adapter `localStorage` de
     l'instantané. Les deux passent les tests de contrat.
   - Règles `ui_texts` dans `firestore.rules`, `npm run deploy:rules`.
   - Branchement **uniquement** dans `src/app/container.ts` ; hook `useUiTexts()` dans
     `ContainerContext.tsx`.
5. **Affichage public** : `LanguageContext` lit l'instantané puis suit le store (étape « Premier
   affichage ») ; vérification à 375 px et 320 px dans les trois langues.
6. **Backoffice** (`feature/ui-text-editor`) : onglet Textes, liste, filtres, éditeur, aperçu,
   brouillon (port de brouillon généralisé), barre d'enregistrement ; vérifié à 320 px.
7. **Sauvegarde** : section `ui_texts` dans l'export, `parseBackup`, test d'aller-retour.
8. **Documentation** : cette page passe de « étude » à « référence » ; mise à jour de
   [05](05-application-donnees.md) (store, ports, collection, clé `localStorage`), [06](06-interface.md)
   (section Langues), [07](07-backoffice.md) (onglet Textes), [10](10-exploitation.md) (règles) et
   de `CLAUDE.md` (convention : « un texte d'interface se lit par `t`, son défaut vit dans
   `@/core/uitext`, le patron le surcharge dans /patron › Textes ; variables via `formatUiText` »).

## Décisions à confirmer

- Clés verrouillées (`appName`, autres textes de marque ou légaux ?).
- Écoute en direct ou lecture à l'ouverture seulement pour cette collection (selon ce que permet la
  synchronisation générique).
- Mode « voir sur le site » de l'aperçu : dès la première version ou plus tard.
