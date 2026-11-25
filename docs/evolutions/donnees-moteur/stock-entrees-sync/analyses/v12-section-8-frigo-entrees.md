
## Annexe — V12 § 8 — Le frigo : entrées souples

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 303-372), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 8. Le frigo : entrées souples — présence d'abord, quantité quand elle est connue

**Principe de simplicité et de quantité facultative** : la saisie des quantités n'est
**jamais** une condition pour utiliser le moteur. L'utilisateur gère son frigo en
déclarant simplement la **présence** ou l'absence des ingrédients (Tomates · Pommes de
terre · Poulet · Huile d'olive…) ; les quantités sont facultatives, renseignées à la
main, obtenues d'une source fiable ou estimées par la reconnaissance visuelle quand la
précision le permet. La quantité inconnue est une **vraie situation métier**, jamais une
valeur artificielle (pas de 999999) : elle n'est assimilée ni à zéro ni à illimité.

`FridgeEntry { id, ingredient_id, quantity?, unit?, expires_at?, expiry_type?,
reserved?, reserved_quantity?, permanent?, exhausted_at?, origin, note?, added_at }` —
une entrée physique (une boîte, un paquet) ; plusieurs entrées par ingrédient ; une
entrée générique n'est jamais équivalente à une variante précise. **Sémantique définie** :

- **présence seule** (sans quantité) = « j'en possède » — disponible, sans jamais
  signifier « quantité illimitée » ;
- **quantité renseignée** = présence + vérification de la quantité nécessaire
  (ex. 500 g de tomates dont 200 g réservés → 300 g disponibles : la réservation
  quantitative reste possible, `reserved_quantity ≤ quantity`, même unité) ;
- **réservation facultative, dans les deux modes** : quantitative quand la quantité est
  connue ; **entrée entière réservée** (`reserved: true`) quand elle ne l'est pas —
  « je garde ce poulet pour vendredi » retire le poulet des recettes sans inventer des
  grammes réservés. Les deux modes sont **mutuellement exclusifs**, avec des
  validations qui empêchent les états incohérents : `reserved_quantity` exige une
  quantité connue et interdit `reserved: true` (et inversement),
  `reserved_quantity ≤ quantity`, même unité ;
- **origine obligatoire** (`origin: 'manual' | 'photo' | 'import'`) : la photo
  **propose** des ingrédients, elle n'ajoute rien toute seule — seuls les ingrédients
  **confirmés par l'utilisateur** entrent dans le frigo (la reconnaissance de l'IA est
  une proposition, la présence confirmée une action du client) ; jamais de quantité
  inventée ; le client confirme et obtient aussitôt des suggestions ;
- la péremption porte **deux champs** : `expires_at` + `expiry_type: 'DLC' | 'DDM'` —
  DLC dépassée = indisponible ; DDM dépassée = déclassé, pas supprimé (le traitement
  métier diffère) ;
- plusieurs entrées du même ingrédient s'additionnent quand les unités sont
  compatibles.

**Ingrédients de base du placard (stock permanent)** : Sel, poivre, huile d'olive,
vinaigre, sucre, farine, cumin, curcuma, paprika… peuvent être déclarés **une seule
fois** comme possédés habituellement (`permanent: true`) ; le moteur les considère
alors disponibles **par défaut**, tant que le client n'a pas déclaré qu'il n'en possède
plus. Ce statut représente une **présence habituelle, jamais une quantité illimitée** :
deux états simples — **actif** et **temporairement épuisé** (`exhausted_at`, « je n'ai
plus de cumin ») — avec une **réactivation en un geste**, sans jamais obliger à
renseigner des quantités. Ce statut est **réservé aux ingrédients de base et épices** —
le poulet, les tomates ou les pommes de terre ne sont **jamais** disponibles
automatiquement.

**Permanent et entrées physiques du même ingrédient** : les entrées physiques
quantifiées sont la **seule réalité quantitative** — le stock permanent ne compte
jamais comme une quantité fictive ou illimitée. Si l'ingrédient a des entrées
physiques, ce sont elles qui portent les quantités ; le permanent ne couvre
qualitativement que ce qu'elles ne couvrent pas. Si une entrée physique est épuisée ou
supprimée, elle disparaît du stock — **rien n'est réinventé** ; si l'ingrédient reste
déclaré permanent, la couverture redevient purement qualitative (« présent, quantité
non vérifiée », sous réserve). Testé : entrée permanente + entrée physique du même
ingrédient, puis épuisement puis suppression de l'entrée physique.

**Synchronisation** : le frigo actuel est un `ElementSet` d'ids (horloges hybrides,
tombstones, purge). **Orientation validée** : étendre le CRDT aux entrées (chaque entrée
porte sa version HLC, les tombstones restent le mécanisme de suppression) — **pas une
simple modification de structure**. Spécification du sync imposée par sa matrice de
tests : ajout hors ligne sur deux appareils, modification simultanée d'une quantité,
suppression sur un appareil pendant que l'autre est hors ligne, deux entrées du même
ingrédient, rejeu répété d'une même opération, modification pendant une synchronisation,
fusion et purge des anciennes entrées — **aucune opération ne se perd silencieusement**,
la résolution de conflits est écrite dans le contrat et testée sur chaque cas.
Migration : ids actuels → entrées « présence seule » (sans quantité), réversible.

