# Complément de rapport — Lot 2.6.1b : vérifications finales demandées par le chef

**Statut** : les **trois vérifications complémentaires sont exécutées et toutes concluantes** —
**aucun défaut constaté, aucune correction nécessaire** (aucune modification de code depuis le rapport
principal). Rapport principal : `lot-2.6.1b-shell-composants-rapport.md`. **Validation technique du
chef obtenue et contrôle manuel du clavier matériel concluant** ; **commit exécuté sur autorisation
explicite du chef** (`f8fc85b` feat, 18 fichiers de code — vérifié par le chef) ; **lot 2.6.1 clôturé**.
Étape suivante : dossier d'exécution 2.6.2 uniquement (composants réutilisables et fondations ;
Home Page complète = 2.6.3), présenté pour revue — aucun développement avant accord explicite.

**Protocole** : serveur isolé port 3001 (`DATA_STORE=memory`), harnais iframe à largeur exacte piloté
par `preview_evaluate` (supprimé après vérification), serveur arrêté à la fin, aucune donnée réelle.

---

## A. Navigation clavier dans le panneau desktop (768/1280)

| Vérification                 | Résultat                                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus initial à l'ouverture  | **✓ première entrée** (focus posé par le panneau, vérifié `document.activeElement`)                                                                                                                       |
| Entrées focusables           | **2** (Profil/Connexion, Réglages) — aucune autre cible dans le panneau                                                                                                                                   |
| Tab : après la 2ᵉ entrée     | **✓ le focus sort du panneau vers l'élément suivant hors panneau** — le popover **non modal** ne piège pas le focus (comportement volontaire et conforme : un panneau ancré n'est pas une fenêtre modale) |
| Maj+Tab depuis la 1ʳᵉ entrée | **✓ retour sur l'avatar** (l'avatar précède le panneau dans l'ordre DOM — vérifié `compareDocumentPosition`)                                                                                              |
| Échap                        | **✓ ferme le panneau et rend le focus à l'avatar** (vérifié en réel)                                                                                                                                      |

**Méthode et limite honnête** : un événement `Tab` synthétique n'a **pas d'action par défaut** dans
Chromium (seuls les événements trusted déplacent le focus). La circulation Tab/Maj+Tab est donc
**vérifiée par la structure** (ordre DOM, éléments focusables, absence de piège, ordre avatar→panneau)
**plus une marche de focus** (`focus()` dans l'ordre du parcours natif).

**Tentative d'appui clavier réel automatisé (vérification complémentaire du chef)** : l'outil d'appui
clavier de l'environnement (`preview_press`) **ne délivre aucun événement dans l'onglet de vérification**
(capture par écouteur : **0 keydown reçu**, sur la page directe comme via le harnais) — l'appui
matériel ne peut pas être automatisé ici. **Liste de passage manuel (≈ 30 s, pour le chef)** :

1. ouvrir le panneau avec l'avatar (clic ou Entrée) ;
2. Tab → la 2ᵉ entrée (« Réglages ») ; Maj+Tab → retour « Profil/Connexion », puis avatar ;
3. Tab depuis la 2ᵉ entrée → **sortie du panneau** (non modal, focus dans la page) ;
4. Échap → **panneau fermé, focus revenu sur l'avatar**.

L'Échap est déjà vérifié **en réel** côté application (l'application écoute `keydown` — un Échap
synthétique exerce exactement le chemin applicatif : fermeture + restauration de focus, PASS).

## B. Session Super admin réelle

Serveur isolé avec identifiants de test (`ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`) ;
connexion **par le vrai endpoint** `POST /admin/api/login` (token signé), token posé là où le lit
l'adaptateur (`sessionStorage`, même mécanisme que l'application), puis rechargement de l'app :

| Vérification                  | Desktop (1280)                                                     | Mobile (375)                                                                              |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Badge « Super admin » affiché | **✓ 111×44 px**, lien `/admin`                                     | **✓ masqué** (0 cible visible — il vit dans Réglages › Application, convention conservée) |
| Bouton « Quitter »            | **✓ 54×44 px**                                                     | **✓ masqué**                                                                              |
| Déconnexion réelle            | **✓** clic → token effacé (`sessionStorage` vide), badge disparaît | —                                                                                         |
| Zones tactiles                | badge et Quitter **≥ 44 px** (correction du lot vérifiée en réel)  | avatar 44×44 ; **0 cible < 44 px** dans l'en-tête ; débordement 0                         |
| Régression                    | aucune (barre inchangée hors cibles élargies)                      | aucune                                                                                    |

## C. Empilement panneau / modale — desktop + mobile

**Desktop (768/900, popover)** :

1. Panneau ouvert → « Réglages » → **modale ouverte par-dessus le panneau** (le panneau reste ouvert
   dessous — pile volontaire, historique cohérent) ;
2. clic extérieur **pendant que la modale couvre le panneau** → **le panneau reste ouvert** (garde de
   démission : aucune unwinding d'historique pendant la modale — vérifié) ;
3. Échap → **modale fermée, panneau toujours ouvert** ;
4. clic extérieur → **panneau fermé, focus rendu à l'avatar**, écran inchangé (`/`).

**Mobile (375/760, ModalShell) — bouton Retour et historique** :

1. Panneau ouvert → « Réglages » → **2 overlays empilés** (panneau + modale) ;
2. **Retour n°1** → **la modale se ferme, le panneau reste**, l'écran ne quitte pas (`/`) ;
3. **Retour n°2** → **le panneau se ferme**, même écran (`/`) — l'historique est exactement consommé,
   aucun « Retour » perdu, aucune sortie de page ;
4. réouverture : Échap ferme + focus avatar ✓ ; clic extérieur (backdrop) ferme + focus avatar ✓.

---

## Conclusion du complément

- **A, B, C : tous les points PASS** — aucune correction, aucun changement de périmètre, aucune
  dépendance ; le diff non commité reste exactement le périmètre 2.6.1b (18 fichiers de code + ce
  complément de rapport).
- Le rapport principal reste valable intégralement ; ce complément le complète sans le modifier
  (hors la mention de statut).

**Arrêt** : aucun commit, aucune fusion, aucun lot (2.6.2/2.6.8) tant que la validation explicite du
chef n'est pas reçue. Serveur de test arrêté, harnais supprimé, port 3000 du chef intact.
