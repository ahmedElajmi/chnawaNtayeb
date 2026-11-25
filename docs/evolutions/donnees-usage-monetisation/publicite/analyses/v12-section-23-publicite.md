
## Annexe — V12 § 23 — Publicité

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 778-788), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 23. Publicité

**Entitlement `no_ads` prioritaire sur toute règle d'affichage** : le droit de ne pas
voir de pub l'emporte toujours (la zone est masquée, jamais allégée). Décision
**serveur** (préfiltrage indexé → règles → fréquence → classement) ; le client ne voit
jamais ciblage, budget ni stratégie ; **contextuelle d'abord**, ciblage individuel
seulement derrière consentement ; idempotence par `event_id`, fréquence comptée **à la
décision** (jamais déduite des événements client), audience unique agrégée, jeton
signé, réconciliation nocturne, « sponsorisé » obligatoire et traduit ; **régie
interne**, aucune dépendance à un SDK tiers — compatible budget zéro.

