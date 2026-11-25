# Lot F1 — A1 : dossier d'implémentation (limite HTTP dédiée `/api/kitchen`)

> **Statut** : dossier d'implémentation — **v2, renforcé après revue du chef** (test C1
> obligatoire ; construction précise de la frontière ; distinction 413 / 400-parse /
> 400-métier ; vérification factuelle du rate limiting ; faits mesurés séparés des
> hypothèses) — **toujours soumis à validation, aucune implémentation autorisée par sa
> seule présentation** (cycle du projet : dossier → validation → réalisation → rapport →
> validation → commit sur autorisation distincte).
> **Base** : orientation A1 validée par le chef (limite dédiée 3 Mio, aucun élargissement des
> autres endpoints, aucune cap métier modifiée, option B et 2 000 tombstones préservées,
> distinction 413/400 conservée) ; mesure full-caps `lot-F1-A1-mesure-fullcaps.md` (C1 =
> 2 435 950 octets, HTTP 200) ; complément `lot-F1-A1-mesure-fullcaps-complement.md` (marges
> exactes : C1 +29,13 %, C2 +22,50 % ; `'3mb'` = 3 145 728 octets vérifié par `bytes`).
> Ne rouvre aucune décision ; n'aborde pas les limites structurelles (dossier de contrat
> distinct, non ouvert).

---

## 1. Périmètre exact des modifications

| Fichier | Nature | Contenu de la modification |
| --- | --- | --- |
| `server/app.ts` | **code de production** — unique fichier modifié | Une constante nommée + une branche dans le sélecteur JSON existant (lignes 77–86). **Aucune autre modification** : routes, caps métier, validateurs, client — inchangés |
| `server/app.test.ts` | **test commis** — extension (fichier existant, modification listée pour autorisation) | Un nouveau bloc `describe` pour la limite de transport, via le harnais `createApiApp` déjà présent (SQLite temporaire par variable d'environnement) |
| — | **aucun fichier client** | Aucun changement client nécessaire ; les clients actuels bénéficient automatiquement de la limite élargie |

Hors périmètre explicite : `server/routes/kitchenRoutes.ts` (validation métier inchangée),
`kitchenRoutes.stock.test.ts` (restera vert tel quel), tout autre endpoint, toute
documentation générale (mise à jour documentaire seulement à la demande du chef, en fin de
release — règle du plan § 1).

## 2. La constante `KITCHEN_BODY_LIMIT`

```ts
/** Transport bound for /api/kitchen (lot F1 A1, chef-validated): the full-caps legitimate
 *  worst case measured 2 435 950 bytes (report 2026-11-20, config C1, HTTP 200); 3 MiB =
 *  3 145 728 bytes leaves +29.13 % (C2: 2 567 965 bytes, +22.50 %). Business caps remain the
 *  reference protection; above the bound body-parser answers 413 before any handler. */
const KITCHEN_BODY_LIMIT = '3mb'; // bytes('3mb') = 3 145 728
```

- Valeur en **octets exacts : 3 145 728** (vérifié le jour du complément : `bytes('3mb')` →
  3 145 728 — `body-parser` interprète `mb` en binaire, comme les limites existantes
  `'100kb'` = 102 400 et `'5mb'` = 5 242 880).
- La marge exacte (C1 **+29,13 %**, C2 **+22,50 %**) est citée en commentaire ; C3
  (9 585 094 octets, borne extrême contractuelle jamais observée) reste **au-dessus** de la
  limite → 413 assumé comme garde-fou transport, documenté.

## 3. Mécanisme de sélection du middleware Express

**État actuel vérifié** (`server/app.ts`, lignes 77–86) :

```ts
const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '5mb' });
app.use((req, res, next) => {
  if (req.path === VISION_PATH || req.path.startsWith('/api/data/')) return bigJson(req, res, next);
  return smallJson(req, res, next);
});
```

**Modification proposée** — correspondance **précise** exigée par le chef :

```ts
const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '5mb' });
const kitchenJson = express.json({ limit: KITCHEN_BODY_LIMIT });
// Exact match: /api/kitchen itself and its real sub-routes (/api/kitchen/history),
// never a sibling path that merely starts with the same prefix (e.g. a hypothetical
// /api/kitchenX) — no accidental widening beyond the kitchen route space.
const isKitchenPath = (path: string): boolean => path === '/api/kitchen' || path.startsWith('/api/kitchen/');
app.use((req, res, next) => {
  if (req.path === VISION_PATH || req.path.startsWith('/api/data/')) return bigJson(req, res, next);
  if (isKitchenPath(req.path)) return kitchenJson(req, res, next);
  return smallJson(req, res, next);
});
```

**Pourquoi cette forme et pas `startsWith('/api/kitchen')` seul** : la forme simple
sélectionnerait aussi une future route voisine dont le nom commencerait par le même préfixe
sans appartenir à l'espace kitchen (ex. `/api/kitchen-v2`). La fonction ci-dessus n'accepte
que le chemin exact et ses **sous-chemins réels**.

**Routes réelles couvertes (vérifiées dans le code)** : `GET /api/kitchen`,
`PUT /api/kitchen`, `POST /api/kitchen/history` (`server/routes/kitchenRoutes.ts`, l. 544,
552, 678) — **aucune autre route** du serveur ne commence par `/api/kitchen`
(vérifié par recherche dans `server/` hors tests : seuls `kitchenRoutes.ts` et le registre
`collections.ts` mentionnent ce préfixe). La sous-route `history` est **délibérément
incluse** : son pire cas contractuel (500 articles + commentaires ≤ 300 caractères par
entrée, `HISTORY` caps) peut lui aussi approcher ou dépasser 100 Kio.

**Vérification du middleware concerné (demandée par le chef)** : le sélecteur est enregistré
**avant tous les montages de routes** (l. 82–86, contre l. 108–111 pour `backofficeAuthRoutes`,
`accountRoutes`, `authRoutes`, `kitchenRoutes`) — Express exécute les middleware dans l'ordre
d'enregistrement, donc le parseur JSON traite le corps **avant tout gestionnaire de route**.
`body-parser`/`raw-body` **abandonne la lecture au dépassement** de la limite et répond 413
**avant** tout handler : rien n'est lu en mémoire au-delà, rien n'est écrit, aucun verdict
métier n'est produit — la distinction **413 (transport) / 400 (métier)** est structurellement
préservée.

## 4. Tests (extension de `server/app.test.ts` — Vitest, projet `unit`, SQLite temporaire)

Le harnais existant de `app.test.ts` boote le **vrai** `createApiApp` — c'est lui qui porte la
limite de transport (contrairement à `kitchenRoutes.stock.test.ts`, qui boote son propre
app sans limite). Les payloads de test sont **construits programmatiquement** avec les mêmes
fonctions du core que la mesure (`activeEnvelope`, `tombstoneEnvelope`, `presenceEntryId`,
`projectStockToLegacy`) — aucun fixture volumineux commite.

**Le test C1 (~2,4 Mio) est OBLIGATOIRE** (et non simplement recommandé) : le PUT d'un
payload de forme C1 (toutes les sections à leurs comptages maximaux, ~2 435 950 octets) doit
être accepté en HTTP 200 — c'est lui qui prouve que la limite couvre le pire cas légitime
mesuré.

| # | Test | Critère |
| --- | --- | --- |
| 1 | **HTTP 200 — payload légal C1 (OBLIGATOIRE)** | PUT d'un corps de forme C1 (toutes sections aux comptages caps, construit programmatiquement ; taille assertée par `Buffer.byteLength` ≥ 2 400 000 octets) → **200**, état stocké, `GET` retourne les sections, **caps métier respectées** (contenu légal par construction) |
| 2 | **HTTP 200 — push légal intermédiaire** | B1c (stock à caps seul, ≈ 498,1 Kio) → 200 (couvre la plage au-delà de l'ancienne limite 100 Kio) |
| 3 | **HTTP 413 — au-delà de la limite** | Corps > 3 145 728 octets → **413**, aucune raison métier dans la réponse, rien de traité |
| 4 | **Borne exacte — sous la limite** | Payload **valide au niveau métier** de taille exacte `3 145 728 − δ` octets (construction ci-dessous) → **200** |
| 5 | **Borne exacte — à la limite et au-delà** | Payload valide de taille **exactement** 3 145 728 octets → **pas de 413** (sémantique `raw-body` : le refus porte sur `length > limit`, l'égalité passe — asserter empiriquement à l'implémentation) ; limite **+ 1 octet** → **413** |
| 6 | **Distinction 413 / 400-parse / 400-métier** | Trois corps, trois verdicts distincts : (a) JSON **malformé** sous la limite → **400** venant du parseur (`entity.parse.failed`), sans raison métier ; (b) JSON valide mais **caps violées** → **400** avec **raison métier** (`stock-caps`) ; (c) corps **trop gros** → **413**, avant tout handler. La 413 ne porte jamais une raison métier ; la 400 métier la porte |
| 7 | **Refus métier préservés** | B1a–B1d → **restent des 400** avec leur raison (`stock-caps`) — le changement de transport ne transforme jamais un refus métier en 413 ni en acceptation |
| 8 | **Autres endpoints inchangés** | Petit JSON hors kitchen : > 100 Kio → **413** (inchangé) ; `/api/data/*` et vision : limite 5 Mio inchangée |
| 9 | **Sélecteur précis** | Requête vers `/api/kitchenX` (aucune route, 404 attendue) : soumise à la limite **100 Kio** — la branche kitchen ne l'attrape pas ; `/api/kitchen/history` couverte par la branche kitchen |
| 10 | **Reproductibilité** | Deux exécutions de la suite, mêmes résultats |

**Construction d'un payload valide juste sous la limite (tests 4-5).** C1 est déjà **à toutes
les caps** : il ne peut pas être agrandi légalement par les champs bornés. Construction en
deux niveaux, documentée honnêtement :

1. **Réglage grossier par les champs à caps** : un document valide de forme C1 partiellement
   rempli (600 entrées actives avec notes ≤ 300 caractères + K tombstones stubs, ≈ 0,61 Kio
   par tombstone — granularité mesurée M1b) porte la taille près de la cible à quelques Kio
   près ;
2. **Réglage fin par un champ légal sans cap** : la précision du dernier octet est obtenue
   par la longueur du nom d'**un seul article personnalisé** (`name` — champ légal, sans cap
   contractuelle : le gap documenté du complément A1 § 2, jamais une troncature ni une
   valeur interdite). La taille exacte est vérifiée **avant l'envoi** par
   `Buffer.byteLength`, et le test assert la taille visée.

Le payload ainsi construit est **valide au niveau métier** (aucune cap violée : les comptages
restent sous les caps, les champs bornés respectent leurs bornes) — le verdict 200 prouve
donc la frontière de transport, pas une tolérance métier. Le cas « limite + 1 » ajoute un
octet à ce même champ légal → 413. Cet écart d'un octet ne peut pas être confondu avec une
erreur de parsing (JSON valide des deux côtés) ni avec un refus métier (aucune cap
traversée) — les trois familles d'erreur sont distinguées par le test 6.

Les tests 7 (B1a–B1d) et les suites existantes de `kitchenRoutes.stock.test.ts` servent de
non-régression ; `npm run check` (typecheck + lint + format + tests) vert sur le périmètre
du lot, dette préexistante hors périmètre inchangée (convention des lots A2/A3/T1).

## 5. Risques et moyens de prévention

**Vérification factuelle du rate limiting (demandée — code relu, rien modifié)** :

- Le limiteur `syncLimiter` est défini **dans le routeur kitchen**
  (`server/routes/kitchenRoutes.ts`, l. 483-490) : `windowMs = 60 000` (1 minute),
  `limit = options.syncLimit ?? 30` (30 requêtes/minute par défaut — la production ne passe
  pas d'option, donc 30/min), en-têtes standard `draft-8`.
- Il est appliqué **par route**, sur les trois endpoints concernés : `GET /api/kitchen`
  (l. 544), `PUT /api/kitchen` (l. 552), `POST /api/kitchen/history` (l. 678). La couverture
  du limiteur correspond donc **exactement** à l'espace de routes de la branche de transport.
- **Nuance d'ordre importante** : le limiteur s'exécute **après** le parseur JSON (middleware
  d'app enregistré avant le routeur) — il borne la **fréquence** des requêtes, mais un corps
  surdimensionné est déjà lu/rejeté (413) **avant** d'atteindre le limiteur. La protection
  réelle contre les corps excessifs est donc **la limite de transport elle-même** (qui
  borne aussi la mémoire : `raw-body` **abandonne la lecture au dépassement** — un corps de
  9 Mio n'est jamais bufferisé en entier, la lecture s'arrête à ~3 Mio puis 413, vérifié par
  la trace `PayloadTooLargeError` de la campagne C3).
- **Faits mesurés vs hypothèses** (demandé) : les **faits mesurés** sont les tailles de
  payload et les verdicts HTTP de la mesure A1 (C1/C2/C3, 2 exécutions identiques) et les
  tailles par section. Le coût de **parsing** d'un corps de 3 Mio (CPU ~dizaines de ms,
  mémoire transitoire ~2-3× la taille du corps) est une **hypothèse raisonnée, non mesurée**
  — aucune campagne de parsing n'a été lancée ; elle sera observable dans les tests (les
  10 tests tournent en projet `unit` sans émulateur) et, si un impact réel apparaissait, il
  serait traité comme un défaut du lot, pas comme un compromis accepté.

| Risque | Prévention |
| --- | --- |
| Surface d'acceptation élargie (3 Mio vs 100 Kio par requête kitchen) | Caps métier inchangées (`withinStockCaps`, B1a–B1d) = protection de référence ; limiteur de sync inchangé (30/min par défaut, couvrant exactement les trois endpoints — voir vérification ci-dessus) ; lecture abandonnée à la limite (`raw-body`), jamais un corps complet au-delà |
| Rafales de gros corps (coût mémoire/CPU — hypothèse non mesurée) | La borne transport cap chaque requête à 3 145 728 octets lus ; le limiteur borne la fréquence ; toute mesure de parsing nécessaire se fera dans les tests du lot, jamais une hypothèse devenue compromis silencieux |
| Sélecteur trop large (préoccupation du chef) | Fonction de correspondance exacte + sous-chemins uniquement ; test n° 9 dédié au cas hypothétique `/api/kitchenX` |
| Confusion transport/métier | 413 émis **avant** tout handler (position du middleware vérifiée) ; test n° 6 verrouille la distinction 413 / 400-parse / 400-métier |
| Champs sans cap structurelle (`preferences`, `name`/`quantity` d'article) pourraient, à terme, approcher la limite | **Hors périmètre A1** — dossier de contrat distinct (propositions déjà consignées au complément § 2, non validées) ; la limite 3 Mio couvre C1/C2 mesurés avec marge exacte |
| Régression des suites existantes | `npm run check` + suites kitchen inchangées ; la modification est confinée au sélecteur (une constante, une branche, un parseur supplémentaire — aucun comportement des routes modifié) |
| Retour arrière | Une constante + une branche : suppression en une révision, aucun modèle, aucune donnée, aucun client affecté |

## 6. Critères objectifs de validation

1. La constante `KITCHEN_BODY_LIMIT` existe avec le chiffrage cité en commentaire.
2. La correspondance est **exacte** (chemin + sous-chemins, jamais un préfixe seul) — test n° 9.
3. Le parseur kitchen est enregistré avant les routes (ordre inchangé du fichier) — 413 avant tout handler.
4. **Tests 1–10 au vert**, dont le test C1 obligatoire (payload légal ~2,4 Mio accepté) et la
   distinction 413 / 400-parse / 400-métier ; `kitchenRoutes.stock.test.ts` et les suites
   existantes restent vertes.
5. Aucune autre limite d'endpoint modifiée (test n° 8) ; aucune cap métier modifiée.
6. `npm run check` vert sur le périmètre du lot ; rapport de lot remis pour validation ;
   commits uniquement sur autorisation distincte.

## 7. Ce que ce dossier ne fait pas

- Il n'applique aucune modification de code (aucune autorisation reçue à ce stade).
- Il ne touche ni aux caps métier, ni à l'option B (stockage partitionné, capacité
  2 000 tombstones préservée), ni aux limites structurelles (`preferences`,
  `name`/`quantity` d'article — dossier de contrat distinct, non ouvert).
- Il ne modifie aucun document de référence au-delà de la consolidation déjà actualisée
  (lignes L4 A1 : orientation validée, implémentation en attente).
- Il ne traite pas la franchise UI « échec de sync silencieux » (demandable séparément).
