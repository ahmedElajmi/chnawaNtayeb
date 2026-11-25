# Fragments Session A confirmés — retranscription partielle, jamais reconstituée

> **Transfert de fragments avec provenance** — la fiche originale de Session A (A-1…A-12,
> I-1…I-19, C-1…C-9) n'est **pas accessible** ; seule existe la synthèse par famille
> (`roadmap.md` § 6 bis, retranscription du tableau du § 6 de `registre-decisions.md`,
> comparaison ligne par ligne validée) et les **fragments cités** dans les fiches ultérieures du
> corpus. Ce fichier compile ces fragments avec leur source exacte. **Aucun fragment manquant
> n'est reconstitué** ; la liste des détails non transcrits est maintenue (fin de fichier).
> Statut famille : **[DÉCIDÉ-A]** — arbitrages non rouverts.

## A-3 — `consId` (encodage des identifiants composés)

**Règle générale et ordre fixe : [DÉCIDÉ]. Transcription exacte : partielle.**

| Fragment confirmé | Source (citation) |
|---|---|
| séparateur `~` ; échappement de `%` ; **ordre fixe des composantes** ; décodage strict ; **aucune normalisation** | livrable B (B1), `analyses/livrables-abcd.md` |
| `consumer` en **dernière composante** (verbatim) | livrable B (B1) |
| plafonds UTF-8 **96 / 64 / 16 / 400 / 43** | livrable B (B1) |
| **Manquant** : valeur exacte de l'ordre des composantes ; jeu exact des caractères échappés | livrable B (B1) — *implémentation de l'encodage/décodage en L2 exige la précision, à signaler avant* |

## A-4 — Plafond numérique 10¹⁵

**Plafond + contrainte d'entier exact : [CONFIRMÉ]. Cible du champ : [POINT OUVERT].**

| Fragment confirmé | Source |
|---|---|
| un plafond numérique 10¹⁵ et une contrainte d'entier exact existent | livrable B (B4) |
| portée : conservée pour le champ auquel A-4 s'applique, **non étendue** à `epoch`/`ordinal` sans confirmation (DC2-A05 [DÉCIDÉ — PRÉCISION DE PORTÉE]) | arbitrages utilisateur DC-2, `analyses/arbitrages-utilisateur.md` |
| **Manquant** : la cible exacte du champ (aucune source accessible ne la nomme) | livrable B (B4) ; proposition argumentée dans la fiche de projection |

## A-5 — `opId` (identité des intentions)

**Règle complète : [DÉCIDÉ]** (reprise intégrale dans l'arbitrage DC2-A01 du chef).

| Fragment confirmé | Source |
|---|---|
| CSPRNG ≥ 128 bits d'entropie ; Base64URL sans padding ; persistance locale dès la création de l'intention, avant transmission ; **même `opId` pour les retries d'une même intention** ; identité `(device, epoch, opId)` | arbitrage DC2-A01 (chef), `analyses/arbitrages-utilisateur.md` |
| **Hors arbitrage volontaire** : unicité globale entre devices non décidée et non requise ; plafond de longueur non décidé et non requis | idem (§ 3) |

## A-6 — `head` et refus d'identifiant non canonique

**Règles : [DÉCIDÉ]. Contenu verbatim du head : non transcrit.**

| Fragment confirmé | Source |
|---|---|
| head de la forme `head~e{E}~{D%}` ; suivi de **`nextOrdinal` uniquement** ; fermeture d'epoch **séparée** (O-11/O-12) ; `refusal_id_noncanonical` défini | livrable B (B2) |
| **Manquant** : contenu verbatim complet du head | livrable B (B2) — *implémentation de l'écriture du head exige la précision* |
| heads **permanents pendant l'epoch ouverte** | SC-O4-A01 (citant A-8 [DÉCIDÉ]), `analyses/o13-o4-fiches.md` |

## A-9 — Budget d'écritures

| Fragment confirmé | Source |
|---|---|
| Reg1 ≡ index (claim-once) ; 3 écritures nominales, 4 à la première préparation ; la mesure réelle reste **[À DÉMONTRER]** | matrice D (D-3), `analyses/livrables-abcd.md` (DC-14/A-9) |

## A-12 — Taxonomie des situations

| Fragment confirmé | Source |
|---|---|
| **cinq situations non transmises** — D11/D12 restent des **hypothèses de couverture nouvelles** (DC8-A03/A04), **jamais** une reconstitution de la fiche originale | arbitrages DC8-A03/A04 + livrable B (B5) |

## Invariants (I) et conditions (C) — citations confirmées

| Fragment | Source |
|---|---|
| **I-14** : liveness **non décroissante** ; exclusion des appareils à liveness insuffisante de la purge ; réintégration sans régression | RECO (c) / SC-O4-A04, `analyses/o13-o4-fiches.md` |
| **I-15** : la clôture est nécessaire à toute purge post-clôture | SC-O4-A02 |
| **I-12, I-16** : indéterminé ⇒ **fail-closed** | fiche v6 § 3 |
| **C-2** : ordre de priorité contractuel pour les causes détectables (ordre repris par DC8-A08) | livrable B (B5) |
| **C-4 / C-8** : portée **compte-entière** (O-11, journal) | corrections consolidées (corpus, fiches Session C) |
| **C-7** : le journal témoin est **externe** au périmètre de restauration | corrections consolidées (O-3/SC-O3-01) |
| **Manquant** : formulation complète de I-1…I-19 et C-1…C-9 (hors fragments ci-dessus) | jamais retranscrite — retranscription exigeant la trace de session (DT-05) |

## Tableau Session A § 4 — codes de refus

| Fragment confirmé | Source |
|---|---|
| **4 noms confirmés** : `refusal_payload_invalid`, `refusal_cap_exceeded`, `refusal_epoch_closed`, `refusal_capacity` (fragment) ; ordre de priorité contractuel (C-2) pour les causes détectables ; le « tableau des neuf lignes » provient du **résumé conversationnel** et n'est **pas** une transcription historique complète | livrable B (B5) — version corrigée (bloc 4, `analyses/livrables-abcd.md`) |
| **Manquant** : noms des autres codes et leurs conditions d'usage ; conditions exactes de `refusal_capacity`, garanties de rollback, distinction refus certain / résultat indéterminé | livrable B (B6) — *les codes résiduels se choisissent à l'implémentation, avec arbitrage si un code dédié s'avère nécessaire* |

## Récapitulatif des détails non transcrits (aucune complétion)

1. ordre exact des composantes de `consId` et jeu de caractères échappés (A-3) ;
2. contenu verbatim complet du `head` (A-6) ;
3. cible exacte du plafond 10¹⁵ (A-4) ;
4. formulation exacte de la sémantique `list` (DC-5 — règle générale [DÉCIDÉ]) ;
5. tableau complet des codes de refus de Session A § 4 ;
6. conditions exactes, garanties de rollback et distinction refus certain / indéterminé de
   `refusal_capacity` ;
7. formulation complète de I-1…I-19 et C-1…C-9 (DT-05).

Chacun de ces détails doit être **signalé explicitement avant toute implémentation qui en
dépend** — ils ne bloquent ni les arbitrages, ni la consolidation L2 (dossier de cadrage C).
