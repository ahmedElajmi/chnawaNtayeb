---
domaine: transverse
niveau: analyse (3, informatif — jamais normatif)
nature: audits consolidés — conclusions + renvois
statut: consolidé Étape B — sources préservées
autorité: docs/encyclopedie/donnees/audit-*.md (B-33…B-35 du livrable v2.3)
---

# K-4 — Audits consolidés

> Document informatif : les audits sont des **photographies datées**, jamais des règles en
> vigueur. Leurs conclusions qui restent vraies ont été reprises dans les dossiers d'évolution
> (K-1…K-3) ; leurs décisions à arbitrer ont, pour la plupart, été arbitrées ensuite.

## 1. Les trois audits (sources préservées)

| Document | Objet | Statut à date |
|----------|-------|---------------|
| `audit-preparation-implementation.md` | État réel du projet, écarts, risques, plan d'implémentation proposé, décisions à arbitrer — clôture de la conception UX/UI (D4) | limite déclarée : `npm run check` non exécutable au moment de l'audit (à relancer en ouverture du premier lot) |
| `audit-annexe-evolutivite-mobile.md` | Évolutivité et préparation au mobile natif réutilisant le cœur fonctionnel — **sans développement** ; choix de la technologie **non pris** (arbitrage M4 = étude de faisabilité à la porte mobile) | annexe |
| `audit-annexe-perimetre-architecture-frontend.md` | Inventaire consolidé du périmètre fonctionnel complet (V12/15, plan 17, CMS 18, maquettes D4), matrice de traçabilité besoins → décisions → code → lots, architecture frontend par composants réutilisables, backlog reporté maintenu | annexe |

## 2. Suivi des conclusions

- Le **plan d'implémentation** proposé par l'audit a été consolidé et arbitrée dans
  `plan-consolide-pre-implementation.md` (§ 6/§ 8 — arbitrages du chef « font foi ») puis
  **réorienté** dans `reorientation-roadmap-carte-fonctionnelle.md` (AR-1…AR-6).
- Les **décisions à arbitrer** de l'audit (§ 5) sont supplantées, pour celles qui ont été
  arbitrées, par le registre des décisions (`../registre-decisions.md`) ; les autres restent
  ouvertes et y sont listées.
- Les **risques** qui restent d'actualité sont suivis dans le livrable v2.3 § 9
  (`audit-phase-a-matrice-documentaire.md`) — le registre ne les duplique pas.

## 3. Usage

Charger ces audits **uniquement** si la tâche exige l'état d'avant-implémentation ou l'historique
de raisonnement (niveau 3 du modèle de lecture, `docs/index.md`).
