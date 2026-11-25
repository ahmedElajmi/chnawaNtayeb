
## Annexe — Plan 17 § 12 — Phase 6a (bascule + évolution des modèles)

> **Transfert verbatim** de `docs/encyclopedie/17-plan-de-realisation.md` (lignes 263-323), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## 12. Phase 6a — Bascule globale du fournisseur + évolution des modèles (sur SQL)

**Architecture validée (décision du chef)** : la bascule est **globale et unique** —
**transformation des documents en structures relationnelles** (modèles logiques
**actuels** — aucune évolution sémantique 5b dans cette opération) : tables dédiées par
domaine, colonnes typées, clés primaires/étrangères, contraintes d'intégrité et
d'unicité, index — **jamais de documents JSON en colonnes** (règle permanente,
`CLAUDE.md` ; JSON réservé aux échanges API, imports/exports et sauvegardes ; toute
exception validée explicitement), **export complet
pendant le gel des écritures** (la solution la plus fiable ; le delta incrémental reste
documenté comme optimisation conditionnelle, admissible seulement une fois le curseur
composite démontré), **comparaison exhaustive zéro écart** (re-sérialisation canonique
source ↔ cible + compteurs), bascule de la variable
d'environnement, **retour arrière symétrique** (transformation inverse SQL relationnel →
documents Firestore, données/identifiants/révisions/marqueurs conservés — conçue et
démontrée en 1.5) tant que non clôturé — **jamais de double écriture**. L'**évolution des
modèles** (5b.2/5b.5) est **séparée** du changement de fournisseur : elle s'applique
**après la bascule, directement sur SQL** (DDL, backfills, comparaison avant/après,
opération inverse) — les deux transformations ne sont **jamais cumulées**. Le frigo est
transformé tel quel ; son évolution de modèle (ids → entrées) reste soumise à
6b.7a/6b.7b (séquence ci-dessous). **Prérequis distincts** : la bascule ne dépend que
de la procédure validée en 1.5 et de la décision du chef ; les évolutions de modèles
dépendent en plus de 5b.5 (mapping) et s'exécutent après.

| Lot  | Objectif & périmètre                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Existant             | Dépend de                                                                                                                                                                                                                                                                                           | Livrables & critères                                                                                                                                                                                                                                                                                     | Risques / décisions                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 6a.1 | Outils d'**évolution des modèles sur SQL, après la bascule globale** (§ 12) : transformation des modèles 5b (mapping 5b.5 exécuté en DDL/backfills, aperçu avant application, opération inverse, comparaison avant/après) ; **frigo : évolution du modèle ids → entrées préparée sans exécution** — elle n'intervient qu'après le déploiement et la validation du nouveau sync en 6b.7a, puis 6b.7b, § 12 ci-dessous                                                                                                                                                                                              | C données            | recettes/ingrédients : 5b.5 + 1.2 + 1.3 + 1.4 ; préparation frigo : 5b.3 + 5b.5 + 1.2 + 1.3 + 1.4 — **lots 1.x énumérés explicitement : contrats (1.2), cadre d'adaptateurs (1.3), mécanismes transactionnels (1.4) ; 1.1 n'est pas un prérequis bloquant, 1.5–1.6 ne concernent pas ces domaines** | Outils + comparaison avant/après zéro écart ; critère : restauration testée                                                                                                                                                                                                                              | 🚩 exécution des transformations de modèles |
| 6a.2 | Écrans d'administration de la migration (D5) : aperçu des conséquences, confirmation, rapport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —                    | 6a.1 + D5                                                                                                                                                                                                                                                                                           | Maquette validée puis page ; critère : aucune migration sans confirmation                                                                                                                                                                                                                                | —                                           |
| 6a.3 | **Stratégie de transition révisée (architecture validée)** : bascule **globale** — gel des écritures, **export complet** des collections (révisions et marqueurs compris), import, **comparaison exhaustive zéro écart**, bascule de la variable d'environnement, dégel ; **une seule source de vérité à tout instant, jamais de double écriture indépendante** ; **retour arrière symétrique** tant que non clôturé, **démontré dans les scénarios A et B de 1.5** (y compris la monotonie des révisions après un retour arrière tardif) — la « double lecture par domaine » est abandonnée (aucun mode hybride) | M `DataStore`        | 6a.1 + procédure validée en 1.5                                                                                                                                                                                                                                                                     | Critère : procédure testée (export complet, comparaison, bascule, **retour arrière A et B vérifié**)                                                                                                                                                                                                     | —                                           |
| 6a.4 | **Implémentation des éditeurs métier (D5)** : éditeur de recette renforcé (lignes indépendantes, portions, complétude non bloquante), éditeur d'ingrédient + variantes, **gestion administrative du frigo** — sur les modèles stabilisés en 5b.2 ; tests aller-retour sauvegarde JSON ; non-régression de l'éditeur existant. **La gestion administrative du frigo ne déclenche pas sa migration effective** : celle-ci respecte la séquence 6b.7a/6b.7b (§ 12) et ses validations                                                                                                                                | M éditeurs existants | 5b.2 + D5 validé                                                                                                                                                                                                                                                                                    | Critère : parité mobile, quantités conservées au changement de portions, tests de migration des anciens champs **limités aux modèles traités dans ce lot (recettes et ingrédients)** — **en aucun cas une migration anticipée du frigo**, exclusivement soumise à 6b.7a → autorisation explicite → 6b.7b | 🚩 validation des maquettes D5              |

**Séquence du frigo — source de vérité, retours arrière et clôture** :

1. **Préparation** (5b.3 + 5b.5) : prototype du sync validé **sur le modèle d'entrée
   stabilisé** ; mapping réversible conçu **une seule fois** (jamais deux migrations
   du frigo).
2. **Bascule globale du fournisseur (décision explicite, § 12)** : **toutes** les
   collections — frigo compris — sont **transformées en structures relationnelles**
   (aucun changement de modèle — sémantique inchangée ; export complet pendant le gel
   des écritures) ; le mécanisme actuel du frigo (`ElementSet` d'ids) fonctionne à
   l'identique après la transformation ; **l'évolution du modèle frigo (ids → entrées)
   reste une opération séparée**, soumise à 6b.7a/6b.7b.
3. **6b.7a — déploiement du nouveau sync** : implémentation en **double flux** avec
   l'ancien `ElementSet` (compatibilité ancien modèle ↔ modèle cible vérifiée sur
   données réelles), matrice de concurrence complète **avant** toute évolution du
   modèle frigo (6b.7b) — indépendante du fournisseur actif.
4. **Évolution effective du modèle frigo (6b.7b)** (après validation explicite de
   6b.7a et accord du chef, sur le fournisseur actif) : bascule ids → entrées
   « présence seule », opération réversible ;
   **source de vérité** : le mécanisme actuel jusqu'à la bascule, le nouveau sync
   ensuite — **jamais les deux en écriture indépendante sur les mêmes données**.
5. **Retour arrière** : possible tant que la bascule n'est pas clôturée ; les
   modifications **hors ligne et multi-appareils** faites pendant la transition sont
   **préservées** (journal + tombstones maintenus des deux côtés, testés : modification
   hors ligne, bascule, retour en ligne, aucune perte) — cas ajouté à la matrice de
   6b.7a.
6. **Clôture de l'ancien mécanisme** : uniquement après validation de la migration du
   frigo **et** une période d'observation couvrant multi-appareils et hors ligne ;
   retrait de l'ancien `ElementSet` et de son code après analyse d'usage (§ 31 V12) ;
   condition : **aucune donnée ancienne restée hors du nouveau sync**.

