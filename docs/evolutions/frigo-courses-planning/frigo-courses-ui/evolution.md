# Frigo & courses — UI (E4)

> Ids : E4 (reorientation § 6), ex-lot 2.6.6/2.6.7 · Famille : frigo-courses-planning ·
> Statut : périmètre et arbitrages tracés ; **non commencé** ; **après F1 et F2** (AR-1) ·
> Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Interface définitive du frigo (stock en entrées) et des courses : deux écrans séparés —
`courses.html` (liste active) ≠ `liste-detail.html` (gérer les listes) (D-08) ; récapitulatif des
ingrédients choisis en haut du frigo ; frigo volumineux (D-27).

## 2. Contexte et état initial

Le **stock en entrées est livré** (F1 : fonctionnel sur la branche de travail) ; les listes
nommées sont en vigueur (renvoi `docs/solution/donnees-sync.md`, `docs/solution/domaine.md`). La
maquette `courses.html`/`liste-detail.html`/`frigo.html` définit la cible. L'interface actuelle
reste servie tant que E4 n'est pas réalisé.

## 3. Fonctionnalités et règles métier

- Frigo : recherche, carrousel avec nombres, Liste/Mosaïque, tri, 8 par catégorie (D-27) ;
  récapitulatif en haut ; retrait réversible (barre « Annuler » 6 s, D-17).
- Courses : liste active affichée partout (getter de compat `kitchen.groceryList`), fusion
  `addGroceryItems` (unités compatibles = une ligne, incompatibles = deux), `GroceryListChooserModal`
  quand plusieurs listes — en vigueur, renvoi `docs/solution/domaine.md` (§ grocery).
- Quantités vérifiées et épuisement réel affichés honnêtement (F2 : verdict jamais appuyé sur
  une quantité inconnue).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| AR-1 | E4 **après F1 et F2** — jamais l'interface définitive sur le modèle à ids | ACQUISE ✅ |
| D-08 | Courses : liste active ≠ gestion des listes | APPLIQUÉE-D4 🚩 |
| D-17 | Retrait réversible sans fenêtre | APPLIQUÉE-D4 🚩 |
| D-27 | Frigo volumineux : recherche, carrousel, tri | APPLIQUÉE-D4 🚩 |
| D-28 | R1/R2/R3 retenus | ACQUISE |
| S7 | Tri des courses selon l'ordre du marché | OUVERTE (rejoindrait ce lot) |

## 5. Architecture, contrats, modèles

Consomme les entrées du stock (F1), les conversions/disponibilité (F2), les listes nommées ;
bouton « haut de page » (`ScrollToTopButton`), barre collante du frigo — conventions en vigueur
(`docs/solution/interface.md`).

## 6. Dépendances

- **Prérequis** : F1 (livré) **et F2** (AR-1) — jamais avant.
- **Contrats partagés** : entrées du stock, unités, listes de courses, planning (résumé).
- **Débloque** : résumés planning ; l'app existante reste servie en attendant.

## 7. Contraintes sécurité/performance

Aucune perte de saisie ; fenêtres via `ModalShell`/`useCloseOnBack` ; mobile 375/320 px ; totaux
justes ; aucune mention de la base dans les textes.

## 8. Étapes de réalisation et critères d'acceptation

Périmètre détaillé au dossier après F2. Critères : parité maquette à 375/320 px, 4 langues + RTL ;
« appuyez encore pour quitter » conservé sur l'accueil ; retrait réversible vérifié.

## 9. Stratégie de tests

Tests d'intégration UI sur le stock (retrait, ré-ajout, fusion), i18n, mobile.

## 10. Preuves disponibles

Maquettes D4 (frigo, courses, liste-detail, captures) ; stock F1 : preuves dans
`../../donnees-moteur/stock-entrees-sync/` (analyses/, preuves/). Aucune implémentation E4.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Périmètre tracé, non commencé. Démarrage après F2. Ouverts : confirmations D-08/D-17/D-27 à
l'implémentation, S7.

## 12. Provenance

Reorientation § 6 E4 · AR-1 · D-08/D-17/D-27/D-28 (audit D4 § 11) · registre dissous dans
`docs/roadmap.md`. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
