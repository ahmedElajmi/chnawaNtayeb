# Moteur de matching (F3 — noyau, 6b, 6c)

> Ids : F3 (5a + 5c + 6b.1/3/4/5 + 6b.6 + 6b.8 + 6c), phases 5a–6c · Famille : donnees-moteur ·
> Statut : conception validée ; **corpus chef 🚩** ; implémentation non commencée ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Reconstruction de l'analyse du moteur : frigo quantifié, allocation sans double consommation,
niveaux et verdicts honnêtes, explicabilité complète — le squelette actuel est **gardé**
(`filters → analysis → scoring → tiers → ranking`), l'analyse, le frigo et les conversions sont
**reconstruits**. Inclut le laboratoire (6b.8, D4) et la validation/bascule/retrait (6c).

## 2. Contexte et état initial

Limites mesurées du moteur actuel : quantités/unités ignorées, 3 statuts, aucune conversion, pas
d'incertitude, pas d'explicabilité. Chaque limite a sa réponse écrite (V12 § 9, transféré verbatim
dans `analyses/v12-partie-4-moteur.md`). En vigueur : `MatchingConfig` + `resolveMatchingConfig`,
scénarios du chef en base, deux listes séparées (`/recettes` = catalogue, `/suggestions` = moteur) —
renvoi `docs/solution/moteur-matching.md`.

## 3. Fonctionnalités et règles métier

- **Précision prime** : la précision l'emporte sur la vitesse (jamais d'arrêt anticipé prématuré).
- Deux modes : **simple** (présence seule, jamais bloqué pour insuffisance) et **avancé** (quantités).
- 6 niveaux par ligne + 6 verdicts ; qualificatif « sous réserve » ; portions réduites (3 faisabilités).
- Allocation : entrée utilisée, restant, conversion, règle, manquant — piste de justification
  complète ; « une entrée, deux lignes » correct ; départages déterministes documentés.
- Laboratoire (D4) : un employé **non technique** crée, compare, simule, publie (portes) et
  comprend pourquoi une publication est bloquée — évalué sur l'autonomie réelle, pas sur les écrans.
- IA : **jamais décisionnelle, jamais payante par défaut** (V12 § 17) — règle en vigueur
  `docs/solution/produit.md`.

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D1 | Wording niveau supérieur + CTA « Voir la recette » | ACQUISE (font foi) |
| D2 | Bornes des niveaux maintenues ; réévaluation seulement avec le corpus 5a | ACQUISE |
| D-33/D-32 | Affichage substitutions (volet dédié : `../substitutions/`) | ACQUISE |
| D-03/D-02 | Ingrédients de base / quantité à vérifier | OUVERTES 🚩 |
| AR-2 | Persistance des substitutions | OUVERTE ⏳ (dossier F3) |
| 🚩 | **Corpus du chef (fourniture)** — prérequis de réalisation, pas un arbitrage documentaire | en attente |

## 5. Architecture, contrats, modèles

`src/core/matching` pur (sans React ni stockage) ; entrées du frigo (F1) + conversions (F2) +
substitutions (volet dédié) alimentent l'allocation (6b.4) ; laboratoire branché sur le cycle de
vie des configurations (4.3) et les permissions `matching_settings` (3.x) ; correspondance détaillée
des travaux dans `docs/roadmap.md` § 4 (6b couvert par F1–F3 : 6b.1–6b.5, 6b.7a ; restent 6b.6, 6b.8,
re-validation sync, transpositions).

## 6. Dépendances

- **Prérequis** : F1 (livré), F2, corpus 5a ; 5c (conception) ; 2.8 (labo conçu) ; 4.3 ; 3.x.
- **Précision 1 (6b)** : la revalidation du sync sur SQL **précède** la transposition effective du
  modèle frigo.
- **Précision 2 (6b/6c)** : l'ancien et le nouveau moteur restent exécutables jusqu'à la fin de la
  comparaison 6b.6 ; **la bascule et le retrait relèvent de 6c**.
- **Débloque** : E3 complet, E4, résumés planning, 8.1/8.2 (différé).

## 7. Contraintes sécurité/performance

Budgets V12 § 15 (< 50 ms / < 600 ms / < 3 s par volume, < 60 µs par recette) ; seuils figés avant
6b.6 ; laboratoire : simulation individuelle < ~100 ms (à figer), bascule async au seuil mesuré.

## 8. Étapes de réalisation et critères d'acceptation

1. Corpus constitué et mesuré (5a.1–5a.3) — harnais réutilisable en 6b.
2. Stratégie d'allocation comparée (6b.1, 🚩 choix, départages déterministes).
3. Étapes moteur 6b.2–6b.5 (avec F2 et volet substitutions).
4. **6b.6** : double exécution ancien/nouveau sur le corpus validé — zéro faux positif en strict
   **sur le corpus** (jamais présenté comme une garantie hors corpus), 4 familles de mesures,
   budgets tenus, seuil asynchrone mesuré.
5. **6b.8** : laboratoire — critères fonctionnels vérifiés par tâches réelles + parité mobile.
6. **6c** : validation métier avec le chef (6c.1), bascule contrôlée (6c.2, repli possible),
   retrait de l'ancien moteur (6c.3).

## 9. Stratégie de tests

Harnais 5a.3 (reproductible) ; tests anti-double-consommation ; tests de sémantique ; double
exécution ; critères fonctionnels du laboratoire par tâches réelles.

## 10. Preuves disponibles

Aucune implémentation nouvelle. Conception : `analyses/v12-partie-4-moteur.md` (V12 § 9–17),
`analyses/plan17-section-9/11/13/14-*.md`. L'exigence extraite du plan V12 est aussi dans
`docs/solution/moteur-matching.md` (« Exigences permanentes du moteur », Étape B).

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée, non commencée. Bloquant principal : corpus chef 🚩 (fourniture). Ouverts :
AR-2, D-02/D-03, 🚩 choix de la stratégie (6b.1), seuil async (6b.6), bascule production (6c.2,
décision explicite du chef).

## 12. Provenance

V12 PARTIE IV (analyses/ verbatim) · plan 17 § 9/11/13/14 (analyses/ verbatim) · reorientation F3
+ § 7 bis · registre dissous dans `docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
