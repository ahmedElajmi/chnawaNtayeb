# Rôles & permissions (F4 — volet RBAC)

> Ids : F4 (RBAC), phases 2 (conception) / 3 (3.1–3.5) / 4 (entitlements) · Famille : backoffice-cms ·
> Statut : conception tracée (3.1–3.5 + V12 § 5/21) ; 🚩 bascule des rôles ; **non commencé** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

RBAC : groupes & rôles anti-élévation, vérifiés serveur et base, journal des actions, dernier
super admin non retirable ; entitlements (fonctionnalités, dons, Premium/VIP **sans aucun type
codé**). Volet **parcours** du même lot F4 : `../../experience-utilisateur/comptes-invite/`
(contrat partagé = modèle de permissions/groupes, référence ici, renvois réciproques).

## 2. Contexte et état initial

Aujourd'hui un seul compte super admin ; droits vérifiés côté serveur et base pour les accès
super admin (en vigueur — renvoi `docs/solution/backoffice.md`). Les rôles de l'atelier
(rédacteur, traducteur, validateur, admin) existent comme **conception** dans le workflow de
validation (renvoi `docs/solution/atelier-edition.md`).

## 3. Fonctionnalités et règles métier

- Groupes et rôles : droits (éditer, valider telle étape, publier, gérer les workflows) ;
  **anti-élévation** — aucun droit ne vient d'un e-mail écrit dans le code ; vérification
  **serveur + base** (règles Firestore côté base) ; journal qui a fait quoi.
- L'**admin** a tous les droits, ne peut pas être retiré et peut toujours débloquer ; le
  **dernier super admin** n'est jamais retirable.
- Entitlements : fonctionnalités (`features` : interrupteur global, règle d'accès, rollout %,
  fenêtre, kill switch — n'active que des services dont le code existe, registre fermé) ; portés
  par un entitlement (Premium/VIP via les dons) **sans aucun type codé**.
- Rôles de l'atelier : 4 rôles par défaut (rédacteur, traducteur — cases de langue seulement,
  validateur, admin).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D8 | Modèle d'accès invité/profil/connexion — contrat partagé avec comptes-invite | CIBLE |
| D-23 | Profil à la place de Réglages (impact CLAUDE.md au lot) | ACQUISE |
| 🚩 | Bascule des rôles (migration des droits existants) | point de contrôle |

## 5. Architecture, contrats, modèles

Collections `roles`/`groups` (nouvelles) relues par le core (`parseWorkflowDefinition` /
`resolveWorkflow` pour les workflows, même exigence pour les rôles) ; vérification serveur +
règles de base ; journal d'audit ; compatible Firestore/SQL (unicité, transactions, anti-élévation
démontrée des deux côtés). Conception RBAC transférée verbatim : `analyses/v12-section-5-rbac.md`
(V12 § 5), `analyses/v12-section-21-plateforme.md` (V12 § 21), `analyses/plan17-section-7-phase-3.md`.

## 6. Dépendances

- **Prérequis** : rien (F4 parallèle) ; conception validée avant 3.x.
- **Contrat partagé (avec comptes-invite)** : modèle de permissions/groupes.
- **Débloque** : F6, E7, laboratoire (permissions `matching_settings`), widgets/analytics.

## 7. Contraintes sécurité/performance

Refus par défaut ; anti-élévation testée ; dernier super admin ; limites de débit ; aucune
différence de garantie entre Firestore et SQL (transactions analysées).

## 8. Étapes de réalisation et critères d'acceptation

3.1–3.5 selon plan 17 § 7 (annexe) : modèles de rôles, vérification serveur, journal,
invalidation, bascule (🚩). Critères : tables de vérité testées, anti-élévation vérifiée des deux
fournisseurs, parité mobile/desktop du back-office.

## 9. Stratégie de tests

Tests de sécurité (refus par défaut, revérification serveur, anti-élévation, dernier super admin),
tests de contrat des collections rôles/groupes, tables de vérité.

## 10. Preuves disponibles

Droits actuels : `docs/solution/backoffice.md` (code commité, tests). Conception : analyses/
verbatim (V12 § 5/21, plan 17 § 7). Aucune implémentation 3.x.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception tracée, non commencée. 🚩 bascule des rôles (point de contrôle). Dossier F4 à produire
avec comptes-invite.

## 12. Provenance

V12 § 5/21 + plan 17 § 7/8 (analyses/ verbatim) · D8/D-23 · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
