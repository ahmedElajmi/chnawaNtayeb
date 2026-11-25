# Propositions — représentation HTTP de l'epoch et cadrage de L1

> **Statut : [PROPOSITION — cadrages précisés pour arbitrage].** La direction de l'epoch
> (`X-Kitchen-Epoch`, option a) et le **principe** du périmètre L1 sont **retenus par le chef** ;
> les précisions ci-dessous complètent ces retenues. **Aucun GO d'implémentation n'est donné** —
> ni l'arbitrage de cette fiche, ni toute autre validation, n'autorisent le démarrage d'un lot.

## 1. `X-Kitchen-Epoch` — représentation HTTP de l'epoch d'origine

Décision de principe retenue (chef) : option (a) — en-tête dédié ; l'en-tête transporte **uniquement
l'epoch d'origine de l'intention**, jamais une valeur permettant au client de choisir l'epoch
active ; le serveur est **seul responsable** de déterminer l'epoch active (DC2-A04) et de
**comparer** les deux valeurs à chaque requête ; une intention créée dans une ancienne epoch n'est
jamais réinterprétée dans une nouvelle. Les contrôles techniques listés ci-dessous (lecture
`rawHeaders`, cas de duplication, transit proxy) sont des **validations futures [À DÉMONTRER]** —
aucun n'est acquis sans exécution et preuve.

### 1.1 Format canonique de l'en-tête

| Propriété | Proposition |
|---|---|
| Nom | `X-Kitchen-Epoch` (nom HTTP insensible à la casse ; lecture via la valeur normalisée) |
| Valeur | entier **non négatif**, notation décimale ASCII : 1 à 16 chiffres, **sans** zéro initial pour les valeurs multi-chiffres ; **`0` est une epoch légale** (l'epoch zéro est la première epoch du compte — sauf preuve documentaire contraire, aucune source accessible n'interdit la valeur zéro) ; sans signe, sans séparateur, sans espace |
| Borne | valeur ≤ 2⁵³ − 1 (9 007 199 254 740 991) — même famille de garantie d'entier exact que le reste du corpus ; 16 chiffres suffisent (`0` à 16 chiffres) |
| Cohérence | même convention de bornes de format que `X-Kitchen-Protocol-Version` (B22-07 : longueur ≤ 32, composantes bornées) — l'epoch est **un seul** entier, pas une version composée |

### 1.2 Validation et traitement des valeurs

| Situation | Comportement proposé |
|---|---|
| Absente (requête d'opération protégée) | refus — composante d'identité manquante : mapping A-6 (`refusal_id_noncanonical`) lorsque applicable ; sinon code à arbitrer (DC8-A02 : ne pas inventer de code) |
| Absente (requête ordinaire, hors `prepare`) | ignorée en v1 — l'epoch d'origine n'est obligatoire que pour les opérations protégées (A.3 règle unifiée) |
| Non conforme au format (§ 1.1) | refus typé — situation de transport mal formé ; code selon le mapping DC8-A02 (identité non canonique si l'epoch est traitée comme composante d'identité), sinon arbitrage |
| **Dupliquée** (deux valeurs distinctes présentes) | refus — la valeur de l'identité est ambiguë ; jamais « première valeur retenue » ni fusion ; le format d'en-tête HTTP autorise la répétition, la cohérence du protocole ne le tolère pas |
| Dupliquée avec la même valeur | déduplication de lecture documentée (un seul entier identique) — acceptable, aucune information perdue |
| **En-têtes fusionnés ou ambigus** (proxy/CDN recombinant plusieurs lignes) | la lecture s'opère sur les valeurs **brutes de la requête** (`req.rawHeaders`, précédent B22-07) — jamais sur la vue fusionnée du parseur ; deux lignes de même valeur ⇒ § ci-dessus ; deux lignes de valeurs distinctes ⇒ refus ; une valeur recombinée non conforme au format (ex. virgule collée) ⇒ refus de format — jamais de tentative de décomposition automatique |
| Valeur d'une **epoch fermée** | `refusal_epoch_closed` (DC8-A01 D8) |
| État de l'epoch **indéterminé** | **fail-closed et réconciliation** (O-11) — jamais traité comme un refus métier ordinaire |
| Client propose une epoch « active » différente | impossible par construction — l'epoch active est déterminée par le serveur seul (DC2-A04) ; l'en-tête ne transporte que l'epoch **d'origine** de l'intention |

### 1.3 Retries et immuabilité

- L'epoch d'origine est **persistée avec l'intention** (même pattern que `opId`, A-5) et retransmise
  **identique** à chaque retry ; le serveur ne déduit jamais l'epoch d'origine de l'état courant.
- La comparaison serveur (origine vs active) est refaite à chaque appel — un retry survenu après
  une rotation est refusé si l'epoch d'origine est fermée ; **aucune** réinterprétation.

### 1.4 Vérification proxy et solution de repli

- **Avant toute implémentation** : vérifier concrètement que l'en-tête personnalisé transite
  par le proxy de production (Render) sans réécriture ni suppression — plan de contrôle :
  (1) requête de test signée vers l'endpoint réel avec `X-Kitchen-Epoch` et valeurs de contrôle
  (`0`, valeur multi-chiffres, valeur hors borne, valeur dupliquée) ; (2) constat du côté serveur
  via `req.rawHeaders` (verbatim, jamais la vue fusionnée) ; (3) résultat consigné dans les
  preuves de ce dossier (règle de traçabilité). Ce contrôle fait partie du lot qui implémente le
  transport (après GO) — son absence ne vaut jamais une validation.
- Si la vérification échoue : **repli = champ dans le corps de la requête** (enveloppe de
  transport, hors payload métier et hors digest, α) — **décision documentée** dans ce dossier
  avec la preuve de l'échec du transit ; l'en-tête reste le premier choix.
- L'arbitrage de la présente fiche **ne donne aucune autorisation d'implémentation**.

## 2. Cadrage de L1 — « socle de canonisation et de digest »

**Porté par l'approbation de principe du chef ; pas un GO.** Le périmètre est nommé
**socle de canonisation et de digest** — il ne constitue **pas** une implémentation de l'identité :
`consId` (encodage/décodage, A-3) et `opId` (génération CSPRNG, A-5) **sont exclus de L1** et
restent L2 (précisions A-3 manquantes + projection payload requises).

### 2.1 Contenu du périmètre

1. **Sérialiseur canonique générique** (core pur TypeScript, horloge/aléatoire/ids injectés selon
   les conventions) : implémente P-1…P-7 **sur du JSON générique** — la liste blanche des champs
   du payload (projection DC-2) est **hors L1** et viendra de L2.
2. **Digest** : SHA-256 des octets UTF-8 du canonique → Base64URL sans padding (43), côté serveur
   (DC-7) ; déterminisme testé.
3. **Registre des codes de refus confirmés** : les 4 noms confirmés
   (`refusal_payload_invalid`, `refusal_cap_exceeded`, `refusal_epoch_closed`,
   `refusal_capacity`) + ordre de priorité contractuel C-2 (repris par DC8-A08) ; **aucun code
   inventé** ; les codes résiduels restent à arbitrer à l'implémentation.
4. **Harnais de vecteurs des cas limites** (§ 2.2) — chaque vecteur porte son résultat attendu et
   la règle P-1…P-7 qui le justifie.

### 2.2 Stratégie de détection des clés JSON dupliquées (point demandé)

Un `JSON.parse` simple **ne permet pas** la détection après parsing (les doublons sont perdus dans
l'objet obtenu — dernier-gagnant). Stratégie proposée pour L1 : **détection sur le JSON brut,
avant toute perte**, au choix parmi (à trancher et tester en L1) :

- (a) **pré-analyse du texte brut** (scan de paires `nom` : valeur par niveau, avec suivi
  d'imbrication et des littéraux de chaînes échappés) — aucune dépendance, portée limitée à la
  détection, exécutée avant `JSON.parse` ; ou
- (b) **parseur conservant les paires** (revival avec collecte des clés répétées) puis refus.

Recommandation : (a) — séparation claire entre détection (texte brut) et analyse (standard), plus
simple à prouver, pas de parseur maison complet. Dans les deux cas :

- une clé dupliquée à **n'importe quel niveau d'imbrication** ⇒ `refusal_payload_invalid`
  (P-1, jamais dernier-gagnant) ;
- l'équivalence des clés s'apprécie **après décodage des échappements JSON** : `"a"` et
  `"\u0061"` désignent **la même clé** — leur coexistence est une duplication, même si les
  séquences brutes diffèrent (c'est la sémantique que le parsing appliquerait ; détecter les
  doublons « texte brut identique seulement » laisserait passer une perte silencieuse du
  parseur standard) ; l'échappement **n'est jamais normalisé** dans la valeur de la clé pour
  autant — la détection compare les noms décodés, la canonisation sérialise la valeur décodée
  (P-6a) ;
- la détection intervient **avant que le parsing ne perde l'information** : elle s'exécute sur
  le texte brut (ou un parseur à paires préservées) et son refus précède toute construction
  d'objet — la détection ne repose jamais sur l'objet résultant de `JSON.parse`.

Ce choix est un **arbitrage technique de L1** à confirmer avec le périmètre.

### 2.3 Vecteurs de canonisation — résultats attendus et règles justificatives

| Vecteur (entrée) | Résultat attendu | Règle |
|---|---|---|
| `{"a":1,"a":2}` (texte brut) | refus `refusal_payload_invalid` — détection **avant** l'effondrement du parseur | **P-1** |
| `{"a":1,"\u0061":2}` | refus `refusal_payload_invalid` — les deux clés sont **équivalentes après décodage des échappements** : duplication détectée même si les séquences brutes diffèrent | **P-1** |
| `-0` (littéral) | refus `refusal_payload_invalid` | **P-3 / DC-4b** (restriction explicite du profil) |
| `1e2` et `100` | même valeur analysée ⇒ **même empreinte** (injectivité sur la valeur analysée, documentée et testée — jamais qualifiée de garantie mathématique) | **P-2** (sérialisation RFC 8785, `Number::toString`, plus court aller-retour) |
| `1.5`, `0.1` | canonisation déterministe ; fraction **légale en canon** (le refus de fraction ne s'applique qu'au champ `quantity` du payload, règle de projection — jamais au sérialiseur générique) | **P-2** |
| `1e999` | refus `refusal_payload_invalid` — **débordement** : la grammaire JSON est valide mais la valeur s'analyse en `Infinity`, hors domaine (grammaire JSON valide ≠ valeur admise) | **P-2 / DC-4b** |
| `1e-999` | refus `refusal_payload_invalid` — **sous-débordement** : littéral non nul s'analysant en zéro, perte de précision détectée **à partir du littéral** (mantisse/exposant), jamais depuis la valeur convertie | **P-2** (précision de la fiche v4 : « détection fiable du sous-débordement ») |
| `0`, `0.0`, `0e0` | admis — zéro **réellement représenté** (forme zéro positif), distinct du sous-débordement ci-dessus | **P-2** |
| `"\ud800"` (surrogate isolé) | refus `refusal_payload_invalid` | **P-5** |
| clés d'objets | tri par **unités de code UTF-16** ; vecteur de divergence `["a","B","é","𐐀"]` documentant l'ordre UTF-16 ≠ ordre UTF-8 (choix assumé de la fiche v6) | **P-6a / DC-4** |
| tableau `["b","a"]` | conservé tel quel — **jamais trié, jamais dédupliqué** ; **aucune sémantique d'ensemble implicite** (le `set`/`multiset` est une déclaration **par champ**, DC-5, hors L1) | **P-7 / DC-5** |
| `null` explicite | refus `refusal_payload_invalid` | **DC-3** |
| profondeur 65 / 100 001 nœuds / > 256 KiB entrée / > 512 KiB canonique | refus `refusal_cap_exceeded` aux bornes exactes | **DC-6 / DC8-A01 D1/D7** |

### 2.4 Procédure DT-01 (confirmée par le chef)

- Au GO de L1 : exécution de référence `npm run typecheck`, **sortie archivée verbatim** dans les
  preuves de ce dossier — les 8 erreurs préexistantes (4 × `scripts/diagnostics/measure-lot-F1.ts`,
  3 × `scripts/diagnostics/measure-a1-fullcaps.ts`, 1 × `server/routes/lotF1LegacyFixture.test.ts`)
  sont gelées.
- Pendant L1 : **aucune correction opportuniste** des 8 erreurs ; toute correction est une
  intervention distincte, jamais un bloqueur de L2.
- Fin de L1 : contrôle distinct — les fichiers **touchés par L1** ne doivent introduire **aucune
  nouvelle erreur** ; les 8 erreurs gelées restent inchangées ; toute nouvelle erreur est
  distinguée des huit initiales et traitée comme une régression de L1.

### 2.5 Critères d'acceptation de L1 (à valider avec le périmètre)

- typecheck = **exactement** les 8 erreurs gelées, aucune nouvelle (voie `unit` verte) ;
- les vecteurs § 2.3 passent, avec le résultat attendu et la règle citée ;
- le déterminisme du digest est testé (même canonique ⇒ même empreinte 43) ;
- périmètre respecté sans empiètement sur L2 (aucun contrat `prepare`, aucun Reg1, aucune
  identité) ;
- résultats réels consignés dans les preuves de ce dossier (règle de traçabilité) ;
- **`npm run check` n'est pas un critère de clôture du protocole** : l'état DT-01 est documenté.

### 2.6 Exclusions explicites de L1

Contrat `prepare` et endpoints (L2) · projection du payload (L2, après arbitrage) · `consId` et
`opId` (identité, L2) · Reg1, index, head, ref, budget 3/4 (L2) · journal témoin (O-3, lot
ultérieur) · epochs et rotations (O-11, L2/L4) · tout ce qui relève des démonstrations (L5+).
