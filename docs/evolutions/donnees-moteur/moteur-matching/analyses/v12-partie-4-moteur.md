
## Annexe — V12 PARTIE IV — Le moteur de matching (§ 9–17)

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 373-716), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

## PARTIE IV — Le moteur de matching

### 9. Audit réel du moteur actuel

**Ce qui existe et reste pertinent** : pipeline `filters → analysis → scoring → tiers →
ranking` (un module par étape, testé et remplaçable) ; `MatchingConfig` versionnée,
fusionnée, bornée (`resolveMatchingConfig`) ; substitutions contextuelles ; rôles
key/secondary/staple ; tiers ready/almost/ideas qui séparent contraintes bloquantes et
classement ; boosts datés ; simulateur + scénarios du chef + `npm run diagnose:matching` ;
`scaleIngredients`.

**Limites mesurées** : quantités et unités **ignorées** (frigo = ensemble d'ids) ;
3 statuts seulement (disponible/remplacé/manquant) ; aucune conversion d'ingrédient ;
pas d'incertitude ; pas d'explicabilité ; paramétrage technique brut. Le squelette est
**gardé** ; l'analyse, le frigo et les conversions sont **reconstruits**. Le moteur vit
dans `src/core/matching`, testé sans React ni stockage — indépendance déjà vraie,
maintenue.

**Réponses aux limites identifiées** — chaque limite du moteur actuel a sa réponse
écrite :

| Limite du moteur actuel                                                                | Réponse du nouveau moteur                                                                           |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Quantités et unités ignorées (frigo = ensemble d'ids)                                  | Frigo à entrées souples (§ 8) + allocation sans double consommation (§ 12)                          |
| Utilité bloquée derrière des saisies de quantités                                      | Deux modes : **simple** (présence seule, jamais bloqué pour insuffisance) et **avancé** (quantités) |
| Scan photo incapable de donner une quantité fiable                                     | Présence détectée = disponible, quantité jamais inventée (§ 8, § 17)                                |
| 3 statuts seulement                                                                    | 6 niveaux par ligne + 6 verdicts distingués (§ 12)                                                  |
| Aucune conversion d'ingrédient                                                         | Conversions exacte / approximative marquée / impossible (§ 11)                                      |
| Substitution générale appliquée partout (« viande → viande hachée » dans une mloukhia) | Contexte, exceptions, priorité déterministe et prudence sur recette non évaluée (§ 10)              |
| Pas d'incertitude                                                                      | Niveau `incertain` + verdict « non évaluable » ; l'incertain n'est jamais compté comme disponible   |
| Pas d'explicabilité                                                                    | Piste de justification par ligne + explication des changements de verdict (§ 12)                    |
| Paramétrage technique brut                                                             | Deux niveaux de paramétrage + laboratoire de simulation (§ 13–14)                                   |

### 10. Hiérarchie, compatibilité, substitution : trois notions séparées

| Notion            | Signification                                   | Modélisation                                                                     |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **Hiérarchie**    | Organisation du catalogue (`variant_of`)        | Ne déduit **jamais** une équivalence                                             |
| **Compatibilité** | Capacité d'un ingrédient à satisfaire un besoin | Règle **explicite validée par l'admin** (demande ↔ réponse, contexte facultatif) |
| **Substitution**  | Remplacement culinaire autorisé sous conditions | `SubstitutionRule` conservé, étendu aux variantes                                |

Règle absolue, testée : **aucune équivalence déduite du seul parent** — posséder du
concentré ne signifie pas posséder des tomates cerises.

**Priorité déterministe des règles de substitution** (de la plus précise à la plus
générale — une exception précise **prévaut** toujours sur une règle générale, testé) :

1. règle spécifique à la recette, y compris exception d'interdiction (« pas dans la
   mloukhia ») ;
2. règle par technique culinaire ou type de préparation (« dans les sauces », « pas
   dans une salade ») ;
3. règle par catégorie de recette ;
4. règle générale ingrédient → ingrédient.

**Conflits de même priorité** : si plusieurs règles du même niveau sont applicables,
le comportement est **déterministe et défini** (ordre stable documenté — ex. la règle
la plus récemment validée l'emporte) et testé ; les règles concurrentes sont
**signalées** dans le laboratoire pour que l'employé les arbitre.

**Prudence** : si aucun contexte ne permet d'évaluer la compatibilité (recette non
analysée, catégorie absente), **pas d'acceptation automatique** — la ligne tombe en
`incertain` et le verdict reste prudent. Exemple de référence (viande → viande hachée) :
spaghetti à la viande acceptée si la préparation le permet · makrouna acceptée selon la
variante · mloukhia **refusée** par l'exception de recette · recette non évaluée →
**pas d'acceptation automatique**. L'employé saisit règles et exceptions par champs
guidés (§ 13), jamais en JSON.

### 11. Conversions de quantités

Exacte (familles d'unités + conversions de variante : « boîte de 400 g » ↔ 400 g) ·
approximative connue (densité déclarée par ingrédient, **toujours marquée**, plafonnée
par la tolérance configurée) · impossible ou inconnue (c.à.s ↔ grammes sans densité,
**« pièce » ↔ masse sans poids moyen déclaré** : jamais de poids standard supposé) → la
ligne est **incertaine**, jamais satisfaite au doigt mouillé. Une entrée de frigo sans
quantité couvre un besoin qualitativement, avec l'incertitude correspondante.

### 12. Architecture du nouveau moteur

**Pipeline par étapes (chaque étape testée et remplaçable)** :

```
0. Filtres (inchangés)
1. Correspondance exacte : variante demandée = variante possédée + quantité suffisante
2. Correspondance par précision : « any_variant » satisfait par variante ou générique ;
   « exact » jamais satisfait autrement
3. Compatibilités validées (règles explicites)
4. Substitutions culinaires (règles + par recette, contexte : plat, rôle, clé)
5. ALLOCATION DES STOCKS : uniquement sur les entrées **quantifiées** — les besoins
   (lignes) et le stock sont appariés SANS jamais consommer deux fois la même
   quantité ; reste, manquant exact, surplus ; quand plusieurs substitutions sont
   possibles, comparaison déterministe des allocations (exact > compatible >
   substitution ; à égalité, priorité aux entrées les plus proches de péremption).
   Les entrées en **présence seule** (ou stock permanent) couvrent la forme du besoin,
   jamais la quantité : couverture qualitative, marquée « sous réserve »
6. Fiabilité : confiance par ligne, verdict par recette
```

L'allocation est déterministe, testée contre la double consommation (le corpus inclut
le cas « une entrée, deux lignes qui la demandent ») et son résultat fait partie de la
justification. Elle ne s'exécute que sur les entrées quantifiées : une entrée en
présence seule n'a rien à allouer et ne peut pas faire croire à une quantité vérifiée.

**Présence seule et stock partagé entre les lignes** : quand plusieurs lignes d'une
même recette demandent le même ingrédient **sans quantité connue**, le moteur ne
décide **pas** ligne par ligne que chacune est quantitativement couverte — le stock
inconnu est **partagé** : toutes ces lignes portent le niveau « présent, quantité non
vérifiée », l'incertitude est **explicite et conjointe**, et la garantie n'est jamais
faite. Testé : plusieurs lignes d'un même ingrédient en présence seule ne produisent
jamais une faisabilité vérifiée.

**États du stock (ce que le moteur sait, par ingrédient)** : disponible **confirmé**
(présence + quantité suffisante) · disponible **quantité inconnue** (présence seule,
manuel, photo, import) · **partiellement** disponible (quantité connue insuffisante) ·
**réservé** (entrées réservées, quantitatives ou entières) · **manquant** ·
**incertain**. Une quantité inconnue n'est jamais assimilée à zéro ni à illimité ; un
stock permanent épuisé n'est plus disponible tant qu'il n'est pas réactivé.

**Suggestions individuelles** : chaque recette est évaluée **indépendamment**, comme si
le stock lui était entièrement dédié — trois recettes proposées qui utilisent toutes
des tomates ne signifient pas que le stock permet de préparer les trois ; cette limite
est **expliquée à l'utilisateur**. La planification (préparer plusieurs recettes
ensemble) exigera une **allocation globale cohérente** : volontairement non implémenté
pour l'instant (§ 29), prévu derrière la même fonction d'allocation.

**Niveaux par ligne** : `exact` · `partial` (bonne forme, quantité insuffisante —
manquant exact calculé) · `compatible` · `substituted` · `présent, quantité non
vérifiée` (présence sûre, quantité inconnue — distinct de `incertain`, qui lui couvre
donnée ou conversion inconnue) · `missing`. **Trois informations séparées** :
obligatoire/facultatif (le facultatif absent ne pénalise jamais le verdict), rôle
culinaire (un secondaire reste obligatoire s'il n'est pas marqué facultatif), poids de
classement.

**Verdicts distingués** :

| Verdict                                     | Signification                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Réalisable **maintenant**                   | Tous les besoins obligatoires couverts, sans substitution                      |
| Réalisable **avec substitutions**           | Couverts, dont certains par substitution autorisée                             |
| Réalisable **avec ajustement des portions** | Les stocks couvrent une version réduite de la recette                          |
| Réalisable **après achat**                  | Certains besoins obligatoires restent à acheter (manque exact affiché)         |
| Partiellement réalisable                    | Une partie couverte, la recette ne peut pas encore être préparée intégralement |
| **Non évaluable**                           | Les informations ne permettent pas de conclure sûrement (seuil configurable)   |

**Conditions déterministes et priorité des verdicts** (évalués dans cet ordre,
testés) :

1. **Couverture en forme d'abord** : au moins un besoin obligatoire sans correspondance
   (ni précision, ni compatibilité, ni substitution autorisée) → **partiellement
   réalisable** — un ingrédient manque en nature, pas seulement en quantité (ex. des
   courgettes demandées, non possédées, aucune substitution autorisée) ;
2. sinon, **quantités** : au moins une quantité **définitivement insuffisante**
   (entrée quantifiée, manque exact calculé) → **réalisable après achat** — la recette
   se complète par des achats, la liste exacte est affichée (ex. 500 g de tomates
   demandés, 200 g possédés → acheter 300 g) ;
3. sinon, couverture complète : sans substitution utilisée → **maintenant** ; avec
   substitution autorisée utilisée → **avec substitutions** ;
4. information insuffisante pour conclure (seuil configurable) → **non évaluable**.

Une quantité **inconnue** ne déclenche jamais « après achat » (rien d'achetable de
sûr) : le verdict principal est calculé sur les quantités connues et le qualificatif
« sous réserve » porte l'incertitude. « Réalisable avec ajustement des portions »
découle de la comparaison des stocks disponibles à une version réduite (voir portions
réduites ci-dessous).

**Qualificatif « sous réserve »** : quand une couverture s'appuie sur une quantité
inconnue (présence seule, stock permanent), la recette reste proposable mais est
marquée **« réalisable sous réserve de vérifier la quantité de X »** — ni exclue pour
insuffisance, ni présentée comme garantie. Une quantité inconnue dégrade la garantie,
jamais la présence. **Il reste indépendant du verdict principal** : il se superpose à
« réalisable maintenant », « avec substitutions » ou « après achat » — le verdict porte
la couverture, le qualificatif porte l'incertitude de quantité.

**Une recette « réalisable » (garantie) ne repose jamais sur une correspondance
incertaine ni sur une quantité inconnue** — ces cas produisent « sous réserve », jamais
« réalisable maintenant ».

**Portions réduites — intégrée au moteur, avec trois faisabilités distinguées** :

1. faisabilité pour le **nombre de portions demandé** (verdicts ci-dessus) ;
2. faisabilité pour un **nombre de portions réduit** (ex. 400 g de viande pour
   4 personnes, 200 g possédés → version pour 2 personnes, avec la quantité exacte
   nécessaire) ;
3. quantité exacte requise dans les deux cas.

La recette originale n'est **jamais modifiée** ; une réduction n'est jamais supposée
linéaire par défaut — quand une préparation ne se réduit pas bien (levure,
conversions en unités indivisibles), la ligne devient `incertaine` et le signal est
donné.

**Explicabilité** : chaque ligne conserve sa piste de justification — entrée(s)
utilisée(s) et **quantité restante après allocation**, conversion (exacte/approximative

- facteur), règle (id + condition respectée), manquant calculé. L'interface répond :
  pourquoi cette recette est proposée, ce qui manque exactement, quelles quantités
  acheter, quoi utiliser avant péremption, pourquoi le verdict a changé entre deux
  configurations.

### 13. Paramétrage à deux niveaux

**Niveau métier (employé formé)** : profils Strict / Équilibré / Flexible comme
préréglages modifiables, décrits en langage clair avec leur conséquence visible
(recettes proposées sur le jeu de référence) ; **éditeur de règles visuel** — « le
concentré peut remplacer la tomate fraîche dans les sauces, mais pas dans une salade »
se saisit par champs guidés (depuis → vers · quand · priorité), jamais en JSON ; chaque
règle affiche ce qu'elle fait, quand elle s'applique, **pourquoi elle a été créée**
(note obligatoire), **quelles recettes elle affecte** (index règle → recettes) et les
résultats produits (simulation immédiate sur échantillon).

**Niveau avancé (administrateur habilité)** : seuils, pondérations, facteurs de
fiabilité, tolérances — avec description, impact expliqué, valeur recommandée, limites
de sécurité et **indicateur de risque** ; inutiles au quotidien ; tout passe par le
laboratoire avant publication.

**Deux niveaux d'évolution distingués** : l'employé configure **librement** tout ce que
le registre du moteur sait déjà faire (combinaisons de conditions, critères et actions
existants) ; lorsqu'une nouvelle règle exige un opérateur, un critère ou un algorithme
absent, une **évolution technique** est nécessaire **une seule fois** — puis la
nouvelle capacité est configurable depuis le back-office à vie. Objectif : ne pas
développer une fonctionnalité nouvelle pour chaque règle métier.

**Configurable sans code (quand la capacité existe)** : équivalences et compatibilités
entre ingrédients ; substitutions et leurs conditions ; exceptions d'interdiction ;
obligatoire/facultatif ; rôles culinaires ; seuils de tolérance ; profils strict /
équilibré / flexible ; priorités et pondérations ; comportements quantités et unités ;
règles de péremption (DLC/DDM) ; critères de pertinence et de classement. Chaque
règle : créer, modifier, dupliquer, désactiver, tester et publier depuis une interface
claire ; paramètres avancés réservés aux profils autorisés, encadrés, validés, avec
recommandations.

**Garde-fous** : une configuration ne peut jamais transformer une approximation en
exact, autoriser une substitution non déclarée, dépasser les bornes de
`resolveMatchingConfig`, ni rendre le moteur plus permissif que les règles déclarées.
Paramétrable = **borné, validé, versionné et simulé** — jamais arbitraire. Le moteur de
règles commun reste un **socle technique** : les politiques (accès, visibilité
éditoriale, matching, publicité) gardent leurs règles métier distinctes.

### 14. Laboratoire de matching (backoffice)

Trois vues sur un même résultat — **synthétique** (verdict, fiabilité, couvert/manquant),
**détaillée** (justification de chaque ligne), **technique** (allocation des stocks,
conversions exécutées, règles exécutées, temps) — et six capacités :

1. **Simulation individuelle** : recette + frigo fictif (quantités, unités, variantes,
   péremptions) + profil → chaque correspondance expliquée.
2. **Comparaison de configurations côte à côte** : publiée vs brouillon vs alternative —
   recettes gagnées, perdues, verdicts changés, régressions, dégradations de performance.
3. **Bibliothèque de scénarios** (scénarios du chef étendus), chaque scénario avec son
   résultat attendu.
4. **Simulation globale** : métriques sur le corpus (évaluées, verdicts changés, faux
   positifs, faux négatifs, incertaines, écarts de quantités, temps) — **tâche serveur
   asynchrone avec progression et annulation** dès que le traitement dépasse le budget
   client (le back-office ne se bloque jamais) ; le client en voit les agrégats et les
   échantillons.
5. **Simulation sans risque** : règles et stocks fictifs modifiables, retour à l'état
   initial — les données réelles ne sont jamais touchées.
6. **Portes de publication** : Brouillon → Simulation → Analyse → Validation →
   Publication → Historique ; un échec critique **bloque** la publication ou exige une
   validation explicitement autorisée selon la gravité ; la validation affiche un
   **résumé des conséquences** (recettes gagnées, perdues, verdicts changés, règles
   impliquées), pas un simple bouton ; explication précise de chaque changement de
   verdict (règle modifiée, seuil abaissé, conversion changée).

L'employé voit toujours **la configuration active** et **les brouillons en cours**
(barre d'état permanente). Permissions RBAC sur `matching_settings` : `read`, `edit`,
`simulate`, `validate`, `publish`, avec **séparation configurable auteur / valideur**
(`require_second_approval`) ; chaque changement tracé (auteur, avant/après, note) ;
configurations identifiables et restaurables.

Le laboratoire consulte aussi les **correspondances acceptées et refusées** (règles
appliquées, conditions vérifiées) et détecte les **régressions** par la bibliothèque de
scénarios. Toutes ses capacités sont accessibles **sur mobile et desktop**
(présentation adaptée, § 5). La bascule entre exécution immédiate et asynchrone est
**déterminée par des mesures réelles**, jamais fixée arbitrairement (§ 15).

**Fiabilité des tâches asynchrones** : gestion **persistante** des tâches, à travers la
base de données existante (aucun service ni infrastructure payants) ; une simulation ne
disparaît pas silencieusement au redémarrage du serveur — son état est retrouvé ; une
même tâche n'est jamais exécutée plusieurs fois involontairement ; l'annulation est
prise en compte proprement ; les résultats sont rattachés à la **version exacte** de la
configuration et du catalogue testés (versions immuables) ; les traitements simultanés
sont encadrés pour ne pas saturer le serveur.

### 15. Performance : exigence architecturale

**Budgets mesurables par volume** (ajustés aux mesures réelles, vérifiés à chaque phase
par des tests de charge automatiques — une régression de performance fait échouer la
phase comme un test faux) :

| Volume (recettes × frigo) | Budget d'une passe complète              | Par recette |
| ------------------------- | ---------------------------------------- | ----------- |
| Actuel (312 × 60)         | < 50 ms (mobile milieu de gamme)         | —           |
| 10 000 × 60               | < 600 ms                                 | < 60 µs     |
| 50 000 × 60               | évaluation paresseuse obligatoire, < 3 s | < 60 µs     |

**Protocole de mesure** (annoncé, jamais promis) : **environnement défini précisément**
(exécution navigateur ou serveur, appareil, mémoire), temps excluant le chargement des
données mais incluant l'analyse, volumes et complexité de règles fixes, frigo de taille
définie, **p95/p99** sur une série de passes ; frigo modifié et recherche **pendant**
une simulation sont testés. **Pertinence avant vitesse** : le moteur n'arrête **jamais**
l'analyse au seul motif qu'il a trouvé suffisamment de recettes réalisables (une 11e
recette plus pertinente ne doit pas être ignorée parce que 10 sont venues vite) ; les
critères bloquants sont évalués rapidement, les candidats classés selon une stratégie
fiable, et l'arrêt anticipé n'intervient que **démontré** : quand les recettes restantes
ne peuvent plus améliorer le résultat affiché ; chaque optimisation est comparée à une
**exécution de référence complète** sur le corpus de tests. La performance n'est jamais
une excuse pour dégrader la pertinence. **Techniques imposées** :
index par ingrédient et variante ; préparation des données hors boucle ; mémoïsation
des conversions ; évaluation paresseuse et arrêt anticipé (les tiers coupent tôt) ;
**recalcul incrémental** via l'index règle → recettes (mécanisme des signatures de
sélection) ; caches explicites ; recherche et matching **séparés** (frigo vide =
navigation, jamais un matching sans matière) ; le laboratoire mesure le **coût par
règle** pour repérer celles qui dégradent le moteur.

### 16. Fiabilité : corpus, métriques, objectifs

Corpus = scénarios du chef étendus, résultat attendu par cas (y compris « non
évaluable ») : variantes d'un même ingrédient en recette et au frigo, quantités
insuffisantes, unités incompatibles, conversions approximatives, substitutions
interdites / conditionnelles, facultatifs, absents, doublons, péremption proche,
**double demande sur une même entrée**, informations insuffisantes, **frigo sans
aucune quantité**, mélange d'entrées quantifiées et de présence seule, **stock
permanent déclaré puis épuisé**, réservation entière sans quantité, origine photo
(présence détectée), **plusieurs lignes du même ingrédient en présence seule**
(stock partagé, incertitude conjointe). Métriques séparées :
**faux positifs (priorité absolue)**, faux négatifs, précision des quantités,
pertinence du classement, part des « non évaluables », temps. Objectifs avant bascule :
**zéro faux positif sur le corpus en profil strict** ; seuils fixés avec le chef pour
« équilibré ». Aucun taux nul promis — la prudence est structurelle. Couverture
progressive : scénarios unitaires, combinatoires, cas réels anonymisés.

### 17. IA générative : jamais décideuse, jamais payante par défaut

Le moteur est **déterministe** (même catalogue + frigo + config = même résultat, testé).
L'IA ne décide jamais et **n'est pas une dépendance du plan** : la seule intégration
existante — le scan photo (Gemini, port `VisionProvider`) — est facultative, sans clé le
scanner est désactivé et la plateforme reste complète ; si une clé gratuite devient
disponible, le même port suffit. L'IA peut **assister** (proposer règles, mappings,
variantes) : chaque proposition passe par l'atelier et la validation humaine — et sans
IA, ces propositions se saisissent à la main. **Le scan photo sert la simplicité** : il
reconnaît la **présence** des ingrédients, jamais leur quantité avec certitude ; la
reconnaissance est une **proposition** — seuls les ingrédients **confirmés par
l'utilisateur** sont ajoutés au frigo, puis les suggestions arrivent aussitôt, sans
aucune saisie de quantité obligatoire (mode simple, § 8).

