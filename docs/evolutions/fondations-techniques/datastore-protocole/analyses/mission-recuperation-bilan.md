# Mission de récupération documentaire — bilan consolidé unique

> **Transfert verbatim** — provenance : historique conversationnel transmis par le chef
> (pièce `historiqe.md`, consulté le 25/11/2026 ; lignes 5115–5248 du fichier source). Bilan de la
> mission de déblocage : résultats A–D avec classification, décisions historiques confirmées (non
> rouvertes), lacunes restantes, les deux conditions exactes de déblocage de L2, sujets
> indépendants. Les tentatives d'archives déjà échouées ne sont pas relancées ; aucun contenu
> historique absent n'est reconstitué. Le vocabulaire (base, SDK, termes conversationnels) reste
> celui des fiches d'origine — aucune norme de nommage du projet n'est appliquée rétroactivement.


# Mission complémentaire — Bilan consolidé unique de restitution
**Exclusivement documentaire — aucune modification du dépôt, aucun code, test, mesure, opération Git, démarrage de lot, arbitrage automatique. Mission terminée à cette restitution.**

---

## 0. Vérifications menées (nouvelles, non identiques aux tentatives précédentes)

| Emplacement | Résultat |
|---|---|
| Répertoires cachés du dépôt (` .aistudio`, `.claude`, `.vitest`, `brand`, logs `d4-*.log`, `firebase-blueprint.json`, `metadata.json`) — **jamais couverts auparavant** | **Aucune occurrence** de `SCH-`, `ARB-07`, `A-12`, `P4/G1` |
| `.aistudio/artifacts/brain/…/implementation_plan.md` | Plan AI Studio ancien, antérieur et sans rapport avec le protocole L2.2 — **zéro mot-clé d'archive** |
| Ancienne conversation (lecture) | **Non relancée** — refus explicite de l'environnement déjà enregistré ; tentatives identiques interdites |

**Conclusion des recherches** : aucune source originale accessible. Restitution selon le § 4 de votre mission : éléments récupérables, éléments confirmés, lacunes — puis, pour DC-2 et DC-8, **deux propositions de résolution documentaires distinctes, clairement identifiées comme nouvelles et non comme récupération historique**.

---

## 1. Résultats A–D avec classification

### A. DC-2 / ARB-01-SCH-1…SCH-9

| Élément | Classe |
|---|---|
| Neuf fiches SCH : contenu intégral | **INFORMATION MANQUANTE** |
| Projection exacte du schéma (liste des champs) | **INFORMATION MANQUANTE** |
| Direction DC-2 : whitelist stricte, rejet des champs inconnus | **DÉCISION CONFIRMÉE** (arbitrage canon-prepare-v1, cette conversation) |
| Profil canonique P-1…P-7 (doublons détectés après décodage d'échappement ; nombres binary64 injectifs sur valeur parsée ; Infinity/underflow/-0 rejetés ; tri UTF-16 sans NFC ; égalité = octets canoniques ; sémantiques de déduplication déclarées par champ ; tableaux ordonnés jamais triés) | **DÉCISION CONFIRMÉE** (DC-1, DC-4, DC-4b, DC-5, DC-4b) |
| Plafonds : entrée 256 KiB, canonique 512 KiB, profondeur 64, 100 000 nœuds, `refusal_cap_exceeded` | **DÉCISION CONFIRMÉE** (DC-6) |
| Caps en octets UTF-8 : DEVICE_RAW ≤ 96, TOKEN ≤ 64, USAGE_TAG ≤ 16, CONSUMER ≤ 400, DIGEST = 43 | **DÉCISION CONFIRMÉE** (Session A, résumé validé) |
| null interdit ; opId CSPRNG ≥ 128 bits ; cap 10¹⁵ | **DÉCISION CONFIRMÉE** (DC-3, Session A) |
| digest = SHA-256 → Base64URL sans padding, 43 caractères, **serveur seul** | **DÉCISION CONFIRMÉE** (R-7a, DC-7) |
| Règles de validation/normalisation par champ, déclinaisons DC-5 par champ | **INFORMATION MANQUANTE** (dépend de la liste de champs) |

### B. DC-8 / A-12

| Élément | Classe |
|---|---|
| Énumération verbatim des cinq situations, ordre compris | **INFORMATION MANQUANTE** |
| Fragment S1 : classification terminale opposée | **DÉCISION CONFIRMÉE** (fragments validés) |
| Fragment S2 : index contenu/association incompatible | **DÉCISION CONFIRMÉE** (fragments validés) |
| Total cinq situations, « inchangées » | **DÉCISION CONFIRMÉE** (référence répétée dans les synthèses) |
| Taxonomie : 8 codes existants + 8ᵉ `refusal_payload_invalid` ; ordre de priorité des refus contractuel pour les causes effectivement détectables | **DÉCISION CONFIRMÉE** (Session A + C2) |
| `refusal_cap_exceeded` (application documentée), `refusal_epoch_closed` (O-12, activable) | **DÉCISION CONFIRMÉE** |
| Correspondance S1/S2 ↔ taxonomie | **RECOMMANDATION** (formulée dans les fiches, non arbitrée faute de la liste complète) |
| Noms des six autres codes du référentiel | **INFORMATION MANQUANTE** (table Session A § 4 hors de portée) |

### C. ARB-07 / ARB-07-O

| Élément | Classe |
|---|---|
| **ARB-07** = WriteGuard / CAS numérique (`server/storage/types.ts:54`) — piste conserver distincte | **DÉCISION CONFIRMÉE** (distinction posée dans les fiches antérieures ; décision WriteGuard historique préservée) |
| **ARB-07-O** = cycle de vie du nonce — Session B, avant L3 | **DÉCISION CONFIRMÉE** (existence et échéance) |
| Décisions/recommandations exactes sur le nonce (périmètre, liaison, validité, consommation) | **INFORMATION MANQUANTE** |
| Lien ARB-07-O ↔ SC-O11-05 (déclencheur de rotation, ouvert) | **DÉCISION CONFIRMÉE** (rattachement posé dans l'arbitrage O-11) |

### D. P4 / G1–G5

| Élément | Classe |
|---|---|
| Définition de P4 et sujets G1–G5 | **INFORMATION MANQUANTE** — dernière recherche ciblée négative (incluant les emplacements cachés) |
| O-8 non bloquant L2 | **DÉCISION CONFIRMÉE** |

---

## 2. Sources et provenance

- **Fiches et arbitrages de la présente conversation** (validés par vous) : seule source de classe DÉCISION CONFIRMÉE.
- **Résumé compacté interne** : fragments indirects, signalés comme tels.
- **Dépôt, emplacements cachés inclus** : vérifié, négatif.
- **Ancienne conversation** : inaccessible (refus d'environnement enregistré, non contourné).

## 3. Décisions historiques confirmées (non rouvertes)

Session A (A-1…A-12, invariants I-1…I-18, C-1…C-9, taxonomie 8+1 codes, budget 3/4) ; canon-prepare-v1 (P-1…P-7, DC-1…DC-14) ; R-7a ; O-11, O-3, O-13, O-4 niveau A ; RECO (a)(b)(c) ; O-12 ; ARB-01/ARB-02 ; D6 strict ; P2 ; J4 [N2]. **Aucune contradiction matérielle détectée — rien n'est rouvert.**

## 4. Lacunes restantes (empêchant une décision fiable sans nouvelle proposition)

1. Liste exacte des champs du schéma de préparation (SCH) — règles par champ, déclinaisons DC-5, R-7b ;
2. Énumération verbatim des cinq situations A-12 ;
3. Noms des six autres codes du tableau Session A § 4 ;
4. Contenu décisionnel ARB-07-O (nonce) ;
5. Définition P4 / G1–G5.

---

## 5. PROPOSITION-NOUVELLE-DC-2 — projection de remplacement (ne remplace aucune source historique ; soumise à votre arbitrage explicite)

**Statut : [NOUVELLE PROPOSITION — non historique].** Enveloppe de la requête de préparation, whitelist stricte, construite exclusivement sur les décisions confirmées. Tout champ non listé = **rejeté** (direction DC-2 décidée).

| Champ | Statut | Contraintes (ancrages confirmés) |
|---|---|---|
| `deviceId` | requis | chaîne, UTF-8 ≤ 96 octets (A-x caps) ; entre dans `consId` format `~`/échappement |
| `epoch` | requis | entier monotone ≥ 1, ≤ 10¹⁵ ; doit correspondre à l'epoch courante de l'espace (fail-closed sinon) |
| `opId` | requis | CSPRNG ≥ 128 bits d'entropie ; jamais réutilisé (I-17 : reprise cas 4 sur la même identité logique uniquement) |
| `token` | facultatif | UTF-8 ≤ 64 octets (cap confirmé) |
| `usageTag` | facultatif | UTF-8 ≤ 16 octets (cap confirmé) |
| `consumer` | facultatif | UTF-8 ≤ 400 octets (cap confirmé) |
| `digest` | **interdit côté client** | serveur seul (DC-7) ; SHA-256→Base64URL 43 (R-7a) ; champ reçu = rejet |
| — (payload métier de l'opération protégée) | **[À ARBITRER]** | les champs métiers éventuels ne sont pas reconstructibles ; soit définis par vous dans cette proposition, soit la préparation v1 ne porte qu'une intention sans payload métier |

**Conséquences si acceptée** : R-7b (sémantique du digest sur le domaine défini) et déclinaisons DC-5 (sémantique de déduplication déclarée **par champ de cette table** — ex. `deviceId`/`opId` scalaires : aucune déduplication ; tableaux ordonnés : P-7) se finalisent avec DC-2.

## 6. PROPOSITION-NOUVELLE-DC-8 — couverture de remplacement (ne remplace aucune source historique ; soumise à votre arbitrage explicite)

**Statut : [NOUVELLE PROPOSITION — non historique].** Remplace « couverture des cinq situations historiques » par une **énumération neuve des causes effectivement détectables à la préparation**, toutes mappées sur la taxonomie confirmée :

| Situation neuve | Code proposé |
|---|---|
| N1 : payload non conforme au profil canonique (P-1…P-7) | `refusal_payload_invalid` |
| N2 : champ inconnu / hors whitelist | `refusal_payload_invalid` |
| N3 : dépassement de plafond (taille/profondeur/nœuds) | `refusal_cap_exceeded` |
| N4 : epoch clôturée ou état indéterminé | `refusal_epoch_closed` (O-11/O-12) |
| N5 : conflit d'unicité (index/ordinal) | **[code existant du tableau Session A § 4 — nom à relire au référentiel]** |
| N6 : échec transactionnel/indéterminé | fail-closed + réconciliation (SC-O3-03/SC-O13-05), **pas un code de refus métier** |

Si vous arbitrez cette proposition, l'énumération historique A-12 **cesse d'être un prérequis documentaire** — le couplage R-7a/R-7b et DC-5 reste régi par DC-2 arbitré.

---

## 7. Les deux conditions exactes permettant de débloquer L2

1. **DC-2 finalisé** — soit par récupération historique de L2.2 (nécessite votre autorisation d'accès à l'ancienne conversation), soit par **acceptation explicite de la PROPOSITION-NOUVELLE-DC-2** (§ 5) ; R-7b et les déclinaisons DC-5 se finalisent avec elle.
2. **DC-8 finalisé** — soit par récupération de l'énumération A-12, soit par **acceptation explicite de la PROPOSITION-NOUVELLE-DC-8** (§ 6).

L'alternative « nouvelle proposition » est **la seule voie qui débloque L2 sans accès aux archives**.

## 8. Sujets indépendants à traiter ultérieurement (hors L2)

**O-2 final** (nécessite ARB-07-O — récupération ou reformulation) · **O-8** (P4/G1–G5 — récupération, ou reformulation explicite de votre part ; non bloquant L2) · **O-4 niveau B** (après O-5) · **O-5, O-6, O-7, O-9, DC-7-bis (avant L3), P3** · GO L1 + gel DT-01 (instruction distincte).

---

**Fin de mission** — quatre recherches menées, quatre résultats présentés, deux propositions distinctes soumises à votre arbitrage explicite. **Aucun arbitrage rendu à votre place ; aucune reconstruction verbatim ; aucune intervention sur le dépôt ; aucun GO implicite. Toute résolution attend votre accord.**