# Rapport de réalisation — Lot 2.6.0 « Socle »

**Statut : réalisé, `npm run check` intégralement vert, tests fonctionnels exécutés sur un serveur
de test réel, commit autorisé par le chef.**
Rapport obligatoire du cycle § 19, conformément au dossier validé
(`lot-2.6.0-socle-dossier.md`, partie B) et à l'autorisation d'implémentation reçue.

---

## 1. Fichiers créés et modifiés

| Fichier                                                | Nature                                                                                                                                                               | Lot     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `src/application/ports.ts`                             | **modifié** — nouveau port `HostLifecycle` (+16 l.)                                                                                                                  | T1      |
| `src/infrastructure/host/browserHostLifecycle.ts`      | **créé** — adaptateur navigateur du port                                                                                                                             | T1      |
| `src/infrastructure/host/browserHostLifecycle.test.ts` | **créé** — 3 tests de l'adaptateur                                                                                                                                   | T1      |
| `src/application/kitchen/KitchenSync.ts`               | **modifié** — injection du port, plus aucun `window`/`document` (64 l. réécrites, comportement identique)                                                            | T1      |
| `src/application/kitchen/KitchenSync.test.ts`          | **modifié** — faux `HostLifecycle` remplace les `vi.stubGlobal('window'/'document')` ; +4 scénarios ; warning no-shadow supprimé                                     | T1      |
| `src/app/container.ts`                                 | **modifié** — câblage de l'adaptateur (2 lignes)                                                                                                                     | T1      |
| `src/core/architecture.test.ts`                        | **modifié** — T2 : garde des globals navigateur étendue à `src/application` ; T4 : test explicite « SDK fournisseurs uniquement dans `src/infrastructure` » (+28 l.) | T2 + T4 |
| `docs/encyclopedie/02-architecture.md`                 | **modifié** — règles de dépendances (`src/application` sans accès plateforme) + paragraphe « SDK fournisseurs isolés derrière des ports »                            | T4      |
| `CLAUDE.md`                                            | **modifié** — convention permanente « plateforme et SDK fournisseurs derrière des ports » (+1 l.)                                                                    | T4      |

Aucune dépendance npm ajoutée. `src/core` métier et `server/` : non touchés.

## 2. Changements réalisés et justification

**T1 — `HostLifecycle`** : port `defer(fn, ms)` (temporisateur annulable) et
`subscribeVisibility(onHidden, onVisible)` (désabonnement renvoyé). L'adaptateur navigateur
est le seul endroit où `visibilitychange`, `pagehide` et `visibilityState` sont touchés pour
la couche applicative. Dans `KitchenSync` : `pushTimer` (id) devient `cancelPush` (fonction
d'annulation) ; `handleVisibility` se scinde en `handleHidden` (flush immédiat du push en
attente — arrière-plan **et** mise en parc BFCache via `pagehide`) et `handleVisible` (pull au
retour, plafond 60 s inchangé). Délais (2 s), déclencheurs, garde anti-réponses périmées par
compte, protection de l'écho des données serveur (`applying` + `suspend`) : **inchangés**.

**T2 — garde** : le test « never touches the host platform directly » applique le même jeu
`FORBIDDEN_GLOBALS` (window, document, localStorage, sessionStorage, navigator, fetch) aux
sources de `src/application` ; les adaptateurs d'infrastructure restent exemptés.

**T4 — règle** : test d'architecture explicite — aucun import `firebase`/`@google` hors de
`src/infrastructure` — et règle écrite dans `02-architecture.md` (tableau des dépendances +
paragraphe dédié) et `CLAUDE.md`.

**Correctif au passage (prévu au dossier B.3)** : le warning lint préexistant
`KitchenSync.test.ts` (no-shadow) est supprimé.

## 3. Tests automatisés exécutés et résultats

- `npm run check` complet (exécuté deux fois : après implémentation, puis après les tests
  fonctionnels) : typecheck ✅ · lint ✅ (**0 warning**, contre 1 avant) · format ✅ ·
  **vitest : 92 fichiers passés, 831 tests passés, 29 ignorés** (suite émulateur Firestore
  proprement skippée, aucun échec).
- Exécution ciblée des trois fichiers touchés : 36/36 verts.
- Nouveaux scénarios automatisés (9) :
  - `KitchenSync` : cycles de visibilité répétés (chaque passage en arrière-plan flush, le
    retour garde le plafond 60 s) · `stop()` désabonne du host et annule le timer armé ·
    changement de compte annule le push en attente (la section reste pendante) · flush
    pendant un push en vol (aucune perte, sections fusionnées) ;
  - adaptateur navigateur : `pagehide` → masqué (mise en parc BFCache comprise),
    `visibilitychange` masqué/visible (reprise BFCache), désabonnement effectif,
    `defer` s'exécute une fois et son annulation annule vraiment.

## 4. Tests fonctionnels réellement exécutés (serveur de test + navigateur réel)

**Moyen** : le serveur de développement en cours sur le port 3000 sert l'ancien code (son
observateur de fichiers est désactivé) ; une **instance de test dédiée** a été démarrée sur le
port 3001 avec `DATA_STORE=memory` (mode local prévu par le serveur, données éphémères —
**aucune écriture en production**) ; scénarios exécutés dans un vrai navigateur (onglet piloté)
sur l'app servie par cette instance, compte client réel créé sur l'instance, appels
`/api/kitchen` observés à la fois côté page (instrumentation réseau) et côté serveur (lecture
directe de l'API avec le jeton de session). Résultats observés :

| #   | Scénario                                    | Résultat réellement observé                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Connexion + sync initiale du frigo          | Session restaurée au démarrage → rattrapage : `GET /api/kitchen` réussi, `lastSyncedAt` enregistré localement, `pending` vide (tout confirmé serveur)                                                                                                                                                                                                                                                                                                                         |
| 2   | Modification du frigo → push ~2 s           | Ajout de « Tmatem » via l'interface → `PUT /api/kitchen` (sections `['fridge']`) **2 010 ms** après la modification, HTTP 200, `pending` ramené à 0. Deuxième observation identique (placard) : **2 012 ms**                                                                                                                                                                                                                                                                  |
| 3   | Arrière-plan → flush                        | Changement armé (suppression de « Batata ») **puis navigation hors de la page dans le même contexte (300 ms, avant les 2 s du débouche)** → `pagehide` réel → flush : le serveur confirme la marque de suppression (`removed: ['ing_pomme_de_terre']`). Vérifié côté serveur, pas seulement côté page                                                                                                                                                                         |
| 4   | Retour au premier plan → pull, plafond 60 s | Événement de visibilité réel observé pendant la session (bascule d'onglet) → **un seul** `GET /api/kitchen`, autorisé par la garde (686 s depuis le pull précédent) ; aucun autre GET en ~390 s malgré les interactions (les pushes n'entraînent jamais de pull). Le second cycle dans les 60 s n'a pas pu être déclenché pour de vrai (voir limites) : couvert par les tests automatisés                                                                                     |
| 5   | Hors ligne → rien ne se perd, reprise       | Serveur de test arrêté avant le débouche : push tenté à **2 009 ms** → `Failed to fetch` → **`pending` conservé**, `lastSyncedAt` inchangé. Serveur relancé, app rouverte → rattrapage du démarrage : push parti, `pending` vide, `lastSyncedAt` mis à jour ; le serveur a convergé (frigo visible = tomate + oignon, la pierre tombale de Batata conservée — jamais ressuscitée)                                                                                             |
| 6a  | Changement de compte                        | Déconnexion automatique observée (session refusée par `/api/auth/me` → nettoyage) puis **connexion réelle via le formulaire** (« Odkhel ») : session u2, **document local neuf créé pour u2**, document de u1 intact (aucun mélange), **`GET /api/kitchen` 138 ms après le submit** (pull du changement de compte)                                                                                                                                                            |
| 6b  | Retour depuis le BFCache                    | **Non exerçable dans ce navigateur d'automatisation** : le retour arrière a produit un document neuf (pas de restauration BFCache constatée). Le chemin « page masquée → reprise » a été observé réellement via l'événement de visibilité du scénario 4 ; la partie BFCache du flux reste couverte par le test automatisé de l'adaptateur (`pagehide` → masqué) et par le comportement réel du scénario 3 (le même handler `onHidden` sert l'arrière-plan et le parc BFCache) |

**Limites honnêtes** : (a) le second cycle de visibilité dans les 60 s (plafond strict du
scénario 4) et (b) la restauration BFCache réelle n'ont pas pu être provoqués dans ce
navigateur d'automatisation — les deux sont couverts par les tests automatisés et le code de
déclenchement est strictement identique à celui du flux observé réellement.

## 5. Écarts par rapport au dossier

1. **Port réduit d'un membre (confirmé au chef)** : `isHidden(): boolean` prévu au dossier B.3
   n'existe pas — la séparation des deux callbacks (`onHidden`/`onVisible`) rend la lecture de
   `document.visibilityState` inutile dans la couche applicative ; un membre jamais utilisé
   aurait été une surface morte. **Confirmé par les tests fonctionnels** : tous les
   comportements attendus (arrière-plan, BFCache, retour) passent par les deux callbacks.
   Sémantique identique, écart documenté ici.
2. Aucun autre écart. T3 exclu (lot séparé), aucune règle métier, aucun modèle, aucune
   interface touchée — conforme aux limites du lot (vérifié : le diff ne contient que les
   fichiers listés en § 1).

## 6. Commit

- Commit autorisé par le chef après tests fonctionnels ; voir le hash dans l'historique
  (`refactor(app): inject host lifecycle (lot 2.6.0)`), fichiers indexés vérifiés par
  `git diff --cached` avant commit, `git status` propre après.
- Branche `feature/datastore-contract`. Aucune fusion vers `develop`/`master`.

## 7. Risques résiduels

- **BFCache réel non observé** dans le navigateur d'automatisation (§ 4, 6b) — le code du
  handler est partagé avec le flux arrière-plan observé ; à confirmer un jour sur un vrai
  mobile/web si besoin, sans changement de code attendu.
- **Plafond 60 s en conditions réelles** : observé positivement (un seul pull déclenché par
  visibilité) ; le blocage strict sous 60 s reste test-automatisé.
- La garde T2 détecte par expression régulière (y compris dans les commentaires) : un
  commentaire contenant « document (… » déclencherait un faux positif — arbitrage assumé,
  cohérent avec la garde `src/core` existante.
- Aucun autre risque identifié : pas de données, pas de schéma, pas de dépendance, retour
  arrière = revert du commit unique.
