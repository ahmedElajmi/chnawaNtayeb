# Comptes & parcours invité (F4 — volet parcours)

> Ids : F4 (2.3→3.x + modèle D8), E6 · Famille : experience-utilisateur ·
> Statut : D8/D-23/D-26 **acceptées** ; parcours à présenter au dossier ; **F4 non commencé** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Parcours utilisateur : client non connecté (invité) fonctionnel sans compte, connexion / création
de compte (téléphone E.164, `normalizePhone`), profil à la place de Réglages. Volet **RBAC** du
même lot F4 : `../backoffice-cms/roles-permissions/` (contrat partagé = modèle de permissions/groupes,
référence dans ce dossier, renvois réciproques).

## 2. Contexte et état initial

Les comptes existent (trois niveaux : client, employé, super admin ; création atomique `users` +
`auth` + réservation `email_index` dans un seul `commit` — renvoi `docs/solution/comptes.md`, en
vigueur). La **cible** invité/profil est définie par D-23/D-26 + D8 ; les maquettes
(`profil.html`, `connexion.html`, `onboarding.html`, `bienvenue.html`) montrent les parcours.

## 3. Fonctionnalités et règles métier

- Invité : **tout fonctionne sans compte** ; différences invité/connecté présentées au dossier
  (D8 : parcours validés au dossier) ; l'invité est invitée par une carte (maquette D4).
- Profil : avatar à la place de Réglages (D-23 ✅) — **modifia la convention « roue dentée » de
  CLAUDE.md** (impact CLAUDE.md à intégrer au lot, jamais modifié à part).
- Connexion/création : téléphone **E.164** en un seul champ ; unicité par garde (`email_index`),
  jamais un seul pré-contrôle ; suppression de compte → libération de la réservation.
- Onboarding/bienvenue : **hors routes publiques** (D9 ✅, SEO préservé) — section de ce lot.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D8 | Invité/profil/connexion (D-23/D-26) : parcours et différences présentés au dossier | CIBLE — favorable (chef) |
| D-23 | Profil à la place de Réglages (avatar) | ACQUISE (chef) |
| D-26 | Client non connecté : tout fonctionne sans compte ; parcours E.164 | APPLIQUÉE-D4 🚩 |
| D9 | Bienvenue/onboarding hors routes publiques | ACQUISE |
| S12/D-16 | Préférences alimentaires dès l'onboarding | OUVERTE 🚩 |
| S6 | Taille du texte (A/A+/A++) dans le profil | OUVERTE |

## 5. Architecture, contrats, modèles

Aucun droit dérivé d'un e-mail écrit dans le code ; le champ `type` vaut `client` ou `employee`
(les variantes de clients sont des données) ; préférences dans les sections de sync existantes ;
profils compatibles Firestore/SQL (identifiants, unicité, transactions — création atomique déjà
en vigueur).

## 6. Dépendances

- **Prérequis** : rien (F4 parallélisable dès maintenant).
- **Contrat partagé (avec roles-permissions)** : modèle de permissions/groupes — référence dans
  `../backoffice-cms/roles-permissions/evolution.md` ; les deux `evolution.md` se citent.
- **Débloque** : F6 (notifications utilisent la session), E6, préférences utilisateur.

## 7. Contraintes sécurité/performance

Aucun secret côté client ; hash avant toute écriture ; gardes de création atomique ; téléphone
normalisé E.164 ; aucune élévation de droits possible côté client.

## 8. Étapes de réalisation et critères d'acceptation

1. Dossier F4 : parcours invité/connecté, différences, modèle D8, impact CLAUDE.md (D-23) — soumis
   au chef.
2. Implémentation volet parcours (volet RBAC : dossier roles-permissions).
Critères : invité sans régression, création atomique vérifiée, mobile 375/320 px, i18n.

## 9. Stratégie de tests

Tests d'identité (existant), tests de parcours (maquette), tests de gardes (unicité), i18n.

## 10. Preuves disponibles

Comptes en vigueur : `docs/solution/comptes.md` (code commité, tests). Maquettes : référence visuelle.
Aucune implémentation F4.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Décisions acceptées, non commencé. Prochaine étape : dossier F4 (parcours + différences + impact
CLAUDE.md). Ouverts : S12/D-16, S6, D-19 (nom arabe du logo — identité).

## 12. Provenance

D8/D9/D-23/D-26 (registre dissous dans `docs/roadmap.md`) · `docs/solution/comptes.md` (en vigueur).
Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
