
## Annexe — V12 § 21 — Plateforme

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 745-766), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 21. Plateforme (fonctionnalités, droits, configurations)

**Fonctionnalités** (`features` : interrupteur global, règle d'accès, rollout %,
fenêtre, kill switch — n'active que des services dont le code existe, registre fermé).
Une fonctionnalité peut être activée ou désactivée, visible par tous, réservée aux
connectés, accessible à certains groupes ou profils, portée par un entitlement
(Premium/VIP **sans aucun type codé**, via les dons) ou disponible dans certains
contextes. Un système d'abonnement complet pourra être ajouté plus tard **sans refondre
la gestion des accès** — l'entitlement est déjà la couture. La logique des
fonctionnalités reste **distincte des règles métier du moteur** ;
**moteur de règles commun** (registre fermé de champs/opérateurs, bornes : profondeur
≤ 4, ≤ 30 critères ; tables de vérité à 3 états : `all`/`any`/`not` avec `inconnu`,
fail-closed, **`not(inconnu) = faux`** — masquer ne peut jamais accorder ; évaluation
client pour l'affichage, **serveur pour toute opération protégée**) ;
**entitlements-dons** (`EntitlementGrant` : clé, source manual/subscription/promotion/
partnership/trial, `granted_at`, `expires_at`, `revoked_at` — la liste plate est un
cache résolu, la source de vérité est la table des dons ; **aucun type Premium/VIP
codé**) ; **cycle de vie unique des configurations** (Brouillon → Prévisualisation →
Publication → Historique → Restauration qui crée une version ; kill switch ;
`audit_logs`) ; **localisation** : rien à faire — `LocalizedText` + `LanguageInfo`
existent déjà, l'ajout d'une langue ne touche pas les modèles.

