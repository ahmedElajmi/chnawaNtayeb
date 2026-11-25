# Commerce, abonnements, restaurants — frontières seulement (11–13)

> Ids : phases 11–13, conditionnel (porte 6–10) · Famille : donnees-usage-monetisation ·
> Statut : **frontières validées** (V12 § 24-commerce) ; **conditionnel** ; rien de créé ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

**Frontières seulement** : ce que le commerce ne fera **jamais** — rien de créé tant que la porte
(success des phases 6–10) n'est pas franchie et confirmée. Pas de catalogue, de panier ni
d'abonnement dans le code actuel.

## 2. Contexte et état initial

Aucune fonctionnalité commerciale existante. Les maquettes de propositions (S3…S10) ne concernent
pas le commerce. Conception intégrale : `analyses/v12-section-24-commerce-frontieres.md` +
`analyses/plan17-section-17-phases-11-13.md`.

## 3. Fonctionnalités et règles métier

Frontières (font foi, V12 § 24-commerce) : pas de vente dans l'application tant que non confirmé ;
le catalogue commercial (phase 11) exigera un **mapping validé humainement** ; conversion
contrôlée, multi-vendeurs, instantanés (phase 12) ; restaurants et plats préparés puis
abonnements (phase 13, si besoin confirmé).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| Frontières V12 § 24-commerce | frontières seulement — rien de créé | validées |
| Porte | conditionnelle sur le succès des phases 6–10 | non franchie |

## 5. Architecture, contrats, modèles

Aucun modèle créé. Le jour de l'ouverture : modélisation relationnelle complète (pas de
« tout en JSON »), comptes marchands, commandes — compatibilité double fournisseur exigée dès la
conception.

## 6. Dépendances

- **Prérequis** : porte 6–10 franchie + décision explicite du chef.
- **Contrats partagés** : entitlements, analytics/publicite (audience), comptes.

## 7. Contraintes sécurité/performance

Frontières : aucune donnée de paiement dans l'application tant que non confirmé ; conformité à
définir au dossier (le jour venu).

## 8. Étapes de réalisation et critères d'acceptation

Aucune étape tant que la porte n'est pas franchie. Les critères de phases 11–13 sont écrits
(annexe) mais **ne déclenchent rien automatiquement**.

## 9. Stratégie de tests

À définir au dossier (le jour venu).

## 10. Preuves disponibles

Aucune implémentation. Conception de frontières : analyses/ verbatim.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conditionnel — porte non franchie. Aucune action tant que le chef ne confirme pas l'ouverture.

## 12. Provenance

V12 § 24-commerce + plan 17 § 17 (analyses/ verbatim) · registre dissous dans `docs/roadmap.md`.
Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
