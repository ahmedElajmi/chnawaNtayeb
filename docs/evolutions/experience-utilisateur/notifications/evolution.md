# Notifications (E6 volet, F8)

> Ids : D-20 + D7 (périmètre), port T7, lot différé (F8) · Famille : experience-utilisateur ·
> Statut : **conception validée** (D-20 ✅, D7 ✅ périmètre) ; **lot différé** — pas de dossier
> d'exécution avant son chantier · Mise à jour : Étape C (21/11/2026)

## 1. Objectifs et périmètre

Notifications non intrusives : rappels de cuisson, « ce soir », nouveautés. Desktop : panneau sous
la cloche ; mobile : écran dédié (D-20). **Opt-in tardif**, aucune collection nouvelle (D7).

## 2. Contexte et état initial

Maquette `notifications.html` (D4) + captures. Aucune implémentation ; le lot est différé (F8,
après F4/F6).

## 3. Fonctionnalités et règles métier

- Panneau desktop sous la cloche ; écran dédié mobile (D-20, ACQUISE ✅ chef).
- Périmètre minimal (D7, ACQUISE) : rappels cuisson + « ce soir » + nouveautés ; opt-in tardif ;
  **aucune collection nouvelle** — réutilise les mécanismes existants.
- Jamais entre deux niveaux de suggestions (D-10 — zones pub exclues, rattachée à publicite).

## 4. Décisions et arbitrages

| Id | Décision | Statut |
|----|----------|--------|
| D-20 | Panneau desktop / écran mobile dédié | ACQUISE (chef) |
| D7 | Périmètre : rappels cuisson + « ce soir » + nouveautés, opt-in tardif, aucune collection nouvelle, pas de push prématuré | ACQUISE |
| T7 | Port de notifications (défini, à implémenter au lot) | conception |

## 5. Architecture, contrats, modèles

Port T7 derrière l'architecture (aucun SDK direct dans le domaine) ; notifications locales
(planifiées côté client), pas de service push avant décision explicite ; i18n 4 langues.

## 6. Dépendances

- **Prérequis** : F4 (session/invité), F6 ; lot différé (F8).
- **Contrats partagés** : réglages (opt-in), mode cuisine (rappels cuisson).
- **Débloque** : rien en aval direct.

## 7. Contraintes sécurité/performance

Aucune donnée personnelle dans les messages ; opt-in explicite ; aucune collection nouvelle.

## 8. Étapes de réalisation et critères d'acceptation

Au lot (différé) : port T7, panneau/écran, opt-in dans Réglages. Critères : parité maquette,
aucune notification avant opt-in, mobile 375/320 px.

## 9. Stratégie de tests

Tests du port (faux adaptateur), tests d'affichage, i18n.

## 10. Preuves disponibles

Maquettes D4 (notifications + captures). Aucune implémentation.

## 11. État réel d'avancement, points ouverts, prochaines étapes

Conception validée ; lot différé. Dossier d'exécution à produire au moment du chantier
(règle « pas de dossiers presque vides » respectée : ce dossier documentaire existe déjà).

## 12. Provenance

D-20/D7 (registre dissous dans `docs/roadmap.md`) · audit D4 § 11. Sources transférées (extraits verbatim à étendue indiquée), puis supprimées au nettoyage autorisé après contrôle de non-perte.
