# Lot F1 — A4 : intégrité du stock local (rapport d'implémentation)

> **Statut** : implémenté le 25/11/2026 sur la branche `fix/stock-sync-integrity` (créée depuis
> `develop` @ `394fc0e`), **non commité** (commit et PR sur autorisations distinctes). Décision
> du chef : **AR-1, option α (préservation intégrale)** — les caps sont une politique
> d'**admission**, jamais un filtre de relecture de l'état propre. Anomalie d'origine :
> X-17 (troncature silencieuse `st_fridge_ing0299`, cause racine A4 du
> `lot-F1-corrections-dossier.md` § 3).

## 1. Règle mise en œuvre

| Chemin | Lecture | Caps |
| --- | --- | --- |
| Relecture du document **propre** (`getKitchenDoc` → stock et cartes legacy) | `parseStockSectionUnbounded` / `parseElementSetUnbounded` (core) | **sans** |
| Restauration de sauvegarde (`saveStock` côté dépôt local, `parseBackup`) | non borné | **sans** |
| Adoption du **serveur** (`mergeStock`, `mergeElementSet`) | `parseStockSection` / `parseElementSet` (inchangés) | **conservées** |
| Validation **serveur** des pushes (`readStockSection` + caps de route) | inchangée | **conservées** |
| Enveloppes malformées | écartées **par enveloppe** (corruption), comme avant | inchangé |

Nouveaux exports du core (TypeScript pur, `export *` via `@/core/kitchen`) :
`parseStockSectionUnbounded` (`entries.ts`), `parseElementSetUnbounded` (`elementSets.ts`),
`isStaleDevice` (règle D3, même fichier).

## 2. Garde mémoire de l'import (exigence AR-1 explicite)

La préservation intégrale ne doit pas devenir un risque mémoire : un garde-fou **transport**
refuse un fichier de sauvegarde absurdement volumineux **avant tout parse** —
`BACKUP_IMPORT_MAX_CHARS = 33 554 432` dans `src/core/backup/backup.ts`, appliqué dans
`CatalogAdmin.importBackup` (refus explicite `{ ok: false }`, le verdict d'échec existant de
l'interface). Base de calibrage : borne extrême contractuelle mesurée du stock seul
**C3 = 9 585 094 octets** (mesure du 20/11) — la garde laisse une marge large pour le
catalogue, jamais une troncature. Un JSON malformé reste refusé par le `try/catch` existant ;
les enveloppes malformées restent écartées par enveloppe (lecture tolérante, inchangée).

**Unité de la limite (précision demandée par le chef, 25/11 au soir, reformulation validée)** :
la garde compte des **unités de code UTF-16** (`string.length`) — limite de 33 554 432 unités,
correspondant à **64 Mio dans une représentation UTF-16 théorique à deux octets par unité**.
Cette limite borne la **longueur logique** de la chaîne : elle **ne constitue pas une mesure
exacte de sa consommation mémoire réelle** (un moteur peut stocker une chaîne de façon plus
compacte que cette représentation) **ni de la taille UTF-8 du fichier**. La taille UTF-8 du
fichier sur disque est une **grandeur différente que la garde ne mesure pas délibérément** :
elle varie d'environ 32 Mio (ASCII pur, 1 octet par unité) à environ 128 Mio (chaque unité =
caractère hors BMP, 4 octets par unité). Mesurer les octets UTF-8 exigerait d'encoder d'abord
toute la chaîne — une allocation du même ordre que le parse lui-même, contre le risque précis
que la garde prévient. Dans toute représentation et tout encodage, la borne reste très
au-dessus du pire cas légal mesuré C3 = 9 585 094 octets (≥ 3,4× même à 1 octet par unité).
Un test démontre la sémantique (chaîne astrale à la limite acceptée : 2 unités mais 4 octets
UTF-8 par caractère).

**Test d'intégration de l'import (complément demandé par le chef, 25/11 au soir)** : un
`CatalogAdmin.test.ts` vérifie qu'un fichier **dépassant la limite** (sinon contenu valide)
renvoie `{ ok: false }`, laisse le catalogue **strictement inchangé** (recettes, ingrédients,
unités) et **n'effectue aucune écriture cuisine** (aucune restauration partielle) ; un contrôle
positif confirme qu'une sauvegarde légitime s'importe toujours (la garde ne mord jamais sous
la borne).

**Lecture serveur de l'état stocké (invariant, point A4-b arbitré — comportement inchangé)** :
le serveur relit son **propre** stock stocké avec le lecteur borné (`kitchenRoutes.ts`, fusion
§ 7.1). C'est sûr **par invariant**, pas par accident : toute voie d'écriture du stock côté
serveur passe l'admission stricte (`withinStockCaps` **avant** tout stockage — la fusion et
les cartes legacy), donc les données stockées respectent toujours les caps et la lecture
bornée est **sans perte** (il n'y a jamais d'enveloppe hors caps à écarter). L'invariant est
documenté **dans le code** (`kitchenRoutes.ts`) : toute future voie d'écriture doit le
maintenir — sinon la base de fusion se réduirait à `{}` silencieusement. Aucun changement de
comportement, aucun test nouveau nécessaire (l'admission est déjà prouvée par les tests B1a–
B1d committés de `app.test.ts`).

## 3. Tests (voie unitaire, exécutés le 25/11)

| Test | Fichier | Critère — résultat |
| --- | --- | --- |
| Relecture 2 601 enveloppes intactes (600+300 actives + 2 000 tombstones + 1 toggle, `st_fridge_ing0299` présent) ; le lecteur borné refuse toujours la section entière | `entries.test.ts` | **réussi** |
| Tolérance par enveloppe conservée (malformée écartée) | `entries.test.ts` | **réussi** |
| Forme refusée (non-objet, tableau) | `entries.test.ts` | **réussi** |
| Carte legacy 301 éléments relue intacte, bornée inchangée (300) | `elementSets.test.ts` | **réussi** |
| Restauration hors caps **entière** (2302 enveloppes relues via `getKitchenDoc`, `loadFridge` = 301) | `localRepositories.test.ts` | **réussi** |
| Adoption serveur hors caps **toujours refusée** (`mergeStock` borné) | `localRepositories.test.ts` | **réussi** |
| Sauvegarde au-delà des caps relue entière (301 enveloppes) | `backup.test.ts` | **réussi** |
| Garde d'import : borne exacte acceptée, +1 caractère refusé | `backup.test.ts` | **réussi** |
| Garde d'import : sémantique UTF-16 démontrée (chaîne astrale à la limite acceptée, UTF-8 plus volumineux) | `backup.test.ts` | **réussi** (revue 25/11 au soir) |
| **Import surdimensionné** : `{ ok: false }`, catalogue strictement inchangé, **aucune écriture cuisine** | `CatalogAdmin.test.ts` | **réussi** (revue 25/11 au soir) |
| Contrôle positif : une sauvegarde légitime s'importe toujours | `CatalogAdmin.test.ts` | **réussi** (revue 25/11 au soir) |

**Décompte de la campagne** : voir le rapport de campagne V1 (voie unitaire complète :
1 107 passés / 8 ignorés / 0 échec — 113 fichiers, dont 14 tests nouveaux A4/D3, zéro
régression par rapport à la baseline du 25/11) et le rapport des corrections du 25/11 au soir
(voie unitaire complète après corrections D3-a/D3-b/A4-a : **1 112 passés / 8 ignorés /
0 échec — 114 fichiers**, soit 5 tests nouveaux, zéro régression).

## 4. Effet sur le scénario mesuré (X-17)

Après correction, le scénario du harnais `caps` donne : état adopté 2 600 enveloppes + 1 toggle
→ **2 601 enveloppes persistées et relues intactes** (`st_fridge_ing0299` présent),
`pending = ['stock']`, push 400, retry — la troncature disparaît. Le mécanisme « refus
explicite » du serveur reste la seule garde de volume ; l'interface garde son état `failed`
(simulation UI = évolution séparée, hors F1).

## 5. Vérification AR-4 — `a1debug.test.ts` (assertion « merge caps refusal keeps its reason »)

L'assertion utile du diagnostic `a1debug.test.ts` (21/11) est **déjà couverte par le test
committé** `server/routes/kitchenRoutes.stock.test.ts` « the caps are applied on the merged
stock » (l. 520–537) : **même scénario** (premier push 300 → 200 ; second push 300 entrantes
différentes → fusion 600 > cap → **400 avec la raison `stock-caps` conservée** ; section
stockée intacte à 300). Aucun nouveau test n'est ajouté (règle anti-duplication du projet).
**Vérification faite le 25/11** (lecture des deux tests) ; la **suppression** du fichier
`a1debug.test.ts` suivra la campagne V2, avec l'inventaire AR-4 complet et sous autorisation.

## 6. Restes

- Campagne émulateur complète sur l'état final (JDK 21) : **exécutée** le 25/11 — 54/54,
  0 échec (`preuves/lot-F1-A4-D3-campagne-V1-V2-2026-11-25.md`) ; l'anomalie **à froid**
  de l'émulateur reste ouverte (réchauffage = condition de campagne, pas une correction).
- Fichiers touchés : `src/core/kitchen/entries.ts`, `elementSets.ts`, `src/core/backup/backup.ts`,
  `src/infrastructure/local/storage.ts`, `localRepositories.ts`, `src/application/catalog/CatalogAdmin.ts`
  + tests (`entries.test.ts`, `elementSets.test.ts`, `backup.test.ts`, `localRepositories.test.ts`,
  `CatalogAdmin.test.ts` — nouveau) + commentaire d'invariant dans `server/routes/kitchenRoutes.ts`
  (A4-b, comportement inchangé).
