# Publicité (10.x)

> Ids : phase 10, F8 · Famille : donnees-usage-monetisation ·
> Statut : **conception validée** (V12 § 23) ; différée ; **non commencée** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Régie **interne** : décision serveur, entitlement prioritaire (retirer la pub via les dons),
emplacements prédéfinis. Jamais entre deux niveaux de suggestions (D-10/D12).

## 2. Contexte et état initial

Emplacements **préparés mais toujours repliés, aucune publicité visible** (D12, ACQUISE) ; la
maquette `publicite.html` montre la cible. Aucune implémentation.

## 3. Fonctionnalités et règles métier

- Décision d'affichage **serveur** ; entitlement (dons) prioritaire — **Premium/VIP sans aucun
  type codé** (V12 § 21, renvoi roles-permissions).
- Zones : jamais entre deux niveaux de suggestions ; zones exclues (cuisine, formulaires,
  onboarding, scan — D-10 OUVERTE 🚩 pour la liste exacte) ; `grocery_footer_1` supprimé.
- Réconciliation nocturne, rapports sans traces personnelles (avec analytics : audience agrégée).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D12 | Emplacements préparés mais toujours repliés, aucune pub visible | ACQUISE |
| D-10 | Zones exclues / jamais entre deux niveaux | OUVERTE 🚩 (arbitrage de la liste exacte) |
| D10 (plan-consolide) | Marque app + CLAUDE.md → « Chnawa Ntayeb / by chef Souhed » | ACQUISE (identité, recoupe D-05) |

## 5. Architecture, contrats, modèles

Slots déclarés en données ; décision serveur ; entitlements (dons) — compatible Firestore/SQL ;
aucun SDK publicitaire tiers sans décision explicite. Conception intégrale : `analyses/v12-section-23-publicite.md`.

## 6. Dépendances

- **Prérequis** : entitlements (roles-permissions), audience agrégée (analytics), phase 10 différée.
- **Contrat partagé (avec analytics)** : audience agrégée sans données personnelles.
- **Débloque** : revenus conditionnels (porte 6–10 pour le commerce).

## 7. Contraintes sécurité/performance

Décision serveur (jamais côté client seul) ; aucune trace personnelle ; slots repliés tant que
non activé (D12) ; réconciliation nocturne robuste.

## 8. Étapes de réalisation et critères d'acceptation

Selon V12 § 23 (annexe) : slots, décision serveur, réconciliation, rapports. Critère de phase :
réconciliation nocturne, rapports sans traces personnelles.

## 9. Stratégie de tests

Tests de décision serveur, tests d'entitlement, réconciliation (tables de vérité).

## 10. Preuves disponibles

Slots préparés (maquette). Conception : `analyses/v12-section-23-publicite.md` (verbatim).

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, différée. Ouvert : D-10 (liste exacte des zones exclues).

## 12. Provenance

V12 § 23 (annexe verbatim) · D12/D-10/D-05 (registre dissous dans `docs/roadmap.md`). Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
