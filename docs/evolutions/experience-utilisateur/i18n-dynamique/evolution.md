# Internationalisation dynamique (registre des langues en base)

> Ids : orientation validée (id de lot **à arbitrer** — point ouvert A.3) · Famille : experience-utilisateur ·
> Statut : orientation **validée** ; **rien d'implémenté** ; convention actuelle = transitoire ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

À terme : **registre centralisé des langues en base** (ajout/activation/désactivation depuis le
backoffice, sans modifier le schéma SQL, les composants ni les formulaires) et **tables de
traduction relationnelles par entité réellement localisable**. **Jamais** de JSON de persistance,
d'EAV ni de table universelle de traductions.

## 2. Contexte et état initial

Convention **en vigueur** (transitoire) : une seule liste `LANGUAGES` (`@/core/shared`) — français
(référence), arabe littéraire, derja latine (3, 7, 9), derja arabe (`derja_ar`) — et contenu
multilingue en champs `<champ>_<langue>` lus via `pickLocalized`/`localizedField` ; le backoffice
suit la langue courante ; **aucun texte affiché en dur** (renvoi `docs/solution/interface.md`,
`docs/solution/comptes.md`).

## 3. Fonctionnalités et règles métier

- Registre des langues **en base** : ajout/activation/désactivation depuis le backoffice —
  l'adaptateur SQL de préparation en colonne `data` JSON est **un écart architectural enregistré**
  (voir point 9 du § Compatibilité permanente) ; l'écart est explicité, jamais normalisé.
- Tables de traduction relationnelles par entité réellement localisable (cible).
- Aucun texte affiché en dur : une erreur d'infrastructure est un **code** que l'interface traduit.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| Orientation multilingue validée | registre en base + tables relationnelles = cible ; champs `<champ>_<langue>` + `LANGUAGES` = convention en vigueur en attendant | VALIDÉE (orientation) — rien d'implémenté |
| D-15 | Relecture native des traductions (`assets/cn/i18n.js` des maquettes, 4 langues) avant implémentation | OUVERTE 🚩 |
| A.3 (ouvert) | id de lot de cette évolution | **à arbitrer** (ou statut sans id assumé) |

## 5. Architecture, contrats, modèles

Registre = collection/table de langues (identifiants stables, activation) ; tables de traduction
par entité localisable (clés primaires/étrangères, unicité par langue) — compatible Firestore et
SQL (sémantique identique, révisions et suppressions logiques conservées) ; le JSON reste réservé
aux échanges API et sauvegardes.

## 6. Dépendances

- **Prérequis** : décision de lot (A.3) ; D-15 (relecture native) avant implémentation.
- **Contrats partagés** : `LANGUAGES`/`pickLocalized` (en vigueur), backoffice (édition multilingue),
  CMS (textes, lot contenu-editorial).
- **Débloque** : ajout de langues sans déploiement de code.

## 7. Contraintes sécurité/performance

Aucune référence de langue non enregistrée (relecture du core) ; volumes maîtrisés (index par
langue) ; compatible avec les deux fournisseurs.

## 8. Étapes de réalisation et critères d'acceptation

1. Arbitrage du lot (A.3) + D-15.
2. Registre en base + backoffice de gestion.
3. Migration des champs `<champ>_<langue>` vers les tables (additive, réversible, sans perte).
Critères : aucune régression d'affichage (4 langues + RTL), backoffice suit la langue courante.

## 9. Stratégie de tests

Tests d'aller-retour de migration des textes, tests du registre (activation/désactivation),
i18n 4 langues.

## 10. Preuves disponibles

Convention en vigueur (code commité, tests). Conception : intégralité de l'orientation validée
**transférée ici** (§ 3–8 ci-dessus) — fichier source
`orientation-multilingue-validee.md` — absorbée intégralement ici, puis source supprimée au nettoyage autorisé (couverture contrôlée dans le bilan C5).

## 11. État réel d'avancement, points ouverts, prochaines étapes

Orientation validée, rien d'implémenté. Ouverts : id de lot (A.3), D-15.

## 12. Provenance

Orientation-multilingue validée (absorbée ici — source supprimée au nettoyage autorisé) · registre dissous dans
`docs/roadmap.md` (D-15) · renvois depuis `cms-staged-online/evolution.md` (§ cohérence
multilingue) et `docs/solution/comptes.md`.
