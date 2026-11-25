
## Annexe — V12 § 7 — Catalogue des ingrédients

> **Transfert verbatim** de `docs/encyclopedie/15-catalogue-organise.md` (lignes 216-302), Étape C. Source supprimée au nettoyage autorisé après contrôle de non-perte.

### 7. Catalogue des ingrédients

**Actuel** : liste plate d'`Ingredient` (noms, prix min/max, famille, photo) ;
recettes, frigo, courses, moteur et recherche référencent des ids.

#### 7.1. Hiérarchie de variantes — décision différée

« Une entité + `variant_of` » (variante = ingrédient référençable, héritage du
générique pour prix/famille/description) **ou** deux entités (`Ingredient` +
`IngredientVariant`) : **décision à la phase 5b** sur critères mesurables (matching
variantes/génériques, courses, conversions, migration des références, requêtes
« variantes de », clarté des substitutions) — la simplicité du modèle ne prime pas sur
la précision métier. Profondeur bornée à 3 (configurable, **pas de limite artificielle**
si les besoins le justifient), cycles refusés.

#### 7.2. Politiques de précision (indépendantes du choix structurel)

| Situation                                 | Exemple                               | Comportement                                                   |
| ----------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| Générique directement utilisable          | Sel, sucre, farine                    | « Sel » peut être enregistré sans variante                     |
| Générique utilisable, variante préférable | Tomate, oignon, fromage               | Générique ou variante ; la précision compte dans le classement |
| Variante obligatoire                      | Huile d'olive, crème selon la recette | Le générique ne satisfait pas le besoin                        |

`variant_policy: 'generic_selectable' | 'variant_preferred' | 'variant_required'`
(+ variante par défaut) **et** précision demandée par la ligne de recette. **Interaction
définie** : la politique du catalogue fixe le maximum de souplesse ; la ligne peut la
**resserrer** (`exact`) mais jamais l'élargir ; la règle effective est la plus stricte
des deux — testée. Trois niveaux distincts : **catalogue** (quelles formes existent),
**recette** (quelle précision est exigée), **frigo** (quelle précision l'utilisateur
connaît) — une entrée générique du frigo ne satisfait jamais un besoin exigeant une
variante.

#### 7.3. Ligne de recette (`RecipeIngredient`)

```ts
interface RecipeIngredient {
  id: string; // identité propre de la ligne
  ingredient_id: string; // générique OU variante
  quantity_base: number;
  unit: string;
  is_optional?: boolean;
  role?: IngredientRole;
  precision?: 'any_variant' | 'exact';
  preparation_fr?: string; /* idem */
  step_numbers?: number[];
  note_fr?: string; /* idem */
  substitutes?: string[]; // alternatives déclarées pour cette ligne, évaluées par les règles
}
```

**Un seul système de décision** : le moteur centralisé de règles de substitution est la
**source de vérité** pour les substitutions contextuelles. `substitutes` sur une ligne
n'est jamais un second moteur : c'est la liste des alternatives **explicitement
déclarées pour cette ligne**, qui sont ensuite évaluées selon les mêmes règles du
moteur — jamais deux systèmes indépendants capables de décisions contradictoires.

Jamais indexé par l'id d'ingrédient ; deux lignes identiques en apparence ne fusionnent
jamais automatiquement (action d'administration avec aperçu). Impacts traités en phase :
affichage, portions, courses, substitutions, frigo, matching, sauvegarde JSON
(aller-retour testé).

#### 7.4. Fusion de doublons et règles obsolètes

**Fusion** : opération d'administration qui réécrit les références (recettes, frigo,
courses, moteur) avec historique des références modifiées et **opération inverse
compensatoire** — la restauration de version ne suffit pas (elle annulerait des
modifications ultérieures) ; l'opération inverse est testée. **Aucune fusion
irréversible sans filet** : **prévisualisation des conséquences** (recettes, frigo,
courses, règles affectées) et **confirmation explicite** avant application. **Règles obsolètes** :
renommer, déplacer ou fusionner un ingrédient **signale** à l'administrateur toutes les
règles de compatibilité et de substitution qui le référencent (index
règle → ingrédients, validation des dépendances).

#### 7.5. Substitutions

Le modèle contextuel existant (`SubstitutionRule` : `notForCourses`, `notWhenKey`,
priorités, surcharge admin via les réglages) est **conservé** et étendu aux variantes.
**Héritage des règles génériques : explicite, configurable, désactivable** — une règle
définie pour un générique ne s'applique à ses variantes que si l'héritage est activé ;
une variante peut le désactiver ; une règle spécifique à une variante **remplace ou
restreint** la règle du générique ; la relation hiérarchique seule ne suffit jamais à
autoriser une substitution. Les substitutions restent **explicites et conditionnées** —
jamais déduites du seul parent. La hiérarchie de priorité, les exceptions d'interdiction
et la règle de prudence sont définies au § 10 ; l'employé gère règles et exceptions par
champs guidés, jamais en JSON, et le moteur explique chaque acceptation ou refus (règle
appliquée, conditions vérifiées).

