# Contrats API centralisés (F7)

> Ids : F7 (ex-T3), phase 2 (conception 2.6.0) · Famille : fondations-techniques ·
> Statut : décisions D15/D16 **acceptées**, recommandation AR-5 **acquise**, chantier **non commencé** ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Fiabiliser les endpoints du backoffice en centralisant les contrats API (`/admin/api/*` et `/api/*`) :
un seul lieu déclaratif des contrats, consommé par le client et le serveur. Périmètre **léger et
justifié** (AR-5) : démonstration préalable de problèmes réels, duplications, bénéfices, risques et
tests de contrat — **pas de refactorisation cosmétique**.

## 2. Contexte et état initial

Les contrats actuels sont déclarés dans `src/infrastructure/http/` et `server/routes/` sans source
unique ; la duplication client/serveur est le risque constaté par T3. La conception initiale (2.6.0)
a été favorable sous conditions.

## 3. Fonctionnalités et règles métier

Renvoi : `docs/solution/serveur-api.md` (endpoints en vigueur), `docs/solution/architecture.md` (couches).
Règle permanente : le client n'importe jamais un SDK fournisseur ; les contrats restent des
interfaces du domaine (`src/application/ports.ts`), l'implémentation reste dans l'infrastructure.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D15 | Contrats API centralisés dans 2.6.0 : favorable avec conditions (pas de dépendances circulaires, tests de contrat) | ACQUISE (plan-consolide § 8) |
| D16 | Politique de versionnement API : politique légère (1 page) avant publication native, pas de versionnement prématuré | ACQUISE (plan-consolide § 8) |
| AR-5 | T3 = lot F7 dédié, périmètre léger et justifié — démonstration exigée avant travaux | ACQUISE |

## 5. Architecture, contrats, modèles

Un module de contrats partagé client/serveur (définitions typées des endpoints), branché côté
client dans l'infrastructure HTTP et côté serveur dans les routes ; aucun SDK de base dans les
contrats. Détail à concevoir au dossier F7 (périmètre précis, choix de représentation) — la
conception détaillée n'est pas écrite.

## 6. Dépendances

- **Dépend de** : rien (parallélisable dès maintenant) — F7 figure parmi les lots parallèles validés.
- **Contrats partagés** : `src/application/ports.ts` ; tests de contrat (harnais commun).
- **Débloque** : fiabilisation des écrans backoffice consommant les endpoints.
- **Impacts** : `server/routes/*`, `src/infrastructure/http/*` — périmètre à borner au dossier.

## 7. Contraintes sécurité/performance

Endpoints backoffice sous `/admin/api/*` (super admin, vérifié serveur et base) ; publics sous
`/api/*` ; pas d'injection ; gardes de taille des payloads inchangées (renvoi stock-entrees-sync
pour `/api/kitchen`).

## 8. Étapes de réalisation et critères d'acceptation

1. **Dossier de démonstration** (obligatoire, AR-5) : problèmes réels recensés, duplications
   constatées, bénéfices, risques, périmètre proposé — soumis au chef avant tout code.
2. Si démonstration validée : extraction des contrats, branchement client/serveur, tests de contrat.
Critères : zéro changement de comportement des endpoints ; tests de contrat verts client et serveur ;
pas de dépendance circulaire.

## 9. Stratégie de tests

Tests de contrat partagés (même exigence que les ports de données) ; non-régression des routes
existantes (`npm run check` + suites serveur).

## 10. Preuves disponibles

Aucune (chantier non commencé). Décisions : plan-consolide § 8 (analyses/
`docs/evolutions/fondations-techniques/bascule-fournisseur/` pour la phase 1 ; registre dissous dans
`docs/roadmap.md`).

## 11. État réel d'avancement, points ouverts, prochaines étapes

Décisions acceptées, **aucun code**. Prochaine étape : dossier de démonstration AR-5, à soumettre
au chef. Aucun statut ne doit être extrapolé.

## 12. Provenance

Decisions : plan-consolide § 8 (D15/D16) · reorientation § 6 F7 + AR-5 · registre dissous dans
`docs/roadmap.md`. Sources originales transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
