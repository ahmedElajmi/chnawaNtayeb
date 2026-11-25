# Index de la documentation — Chnawa Ntayeb

> Entrée de la documentation. Règle de lecture : **`docs/solution/` = ce qui est implémenté et
> validé (en vigueur)** — seul le contenu effectivement en vigueur y figure ; **`docs/evolutions/` =
> un dossier par chantier** (autonomie documentaire) ; **`docs/roadmap.md` = synthèse non
> normative** (état, rails, séquencement, décisions sans lot) ; **`docs/reference-visuelle/site/` =
> maquettes D4 (référence UX/UI — les données fictives des maquettes ne valent jamais règles
> métier)**. Un statut se prouve : décision acceptée (trace), code présent (lecture du fichier +
> état du dépôt), tests exécutés (sorties datées), code commité (`git show` + branche), livraison
> effective (environnement cible nommé) — aucune extrapolation, un push n'est jamais une livraison.

## Arborescence

```
CLAUDE.md                          guide opérationnel (racine)
docs/
├── index.md                       cette page
├── roadmap.md                     synthèse : phases 0–13, F1–F8, E0–E7, statuts, décisions
├── solution/                      en vigueur
│   ├── produit.md · architecture.md · domaine.md · moteur-matching.md
│   ├── donnees-sync.md · interface.md · backoffice.md · atelier-edition.md
│   ├── serveur-api.md · qualite-tests.md · exploitation.md · guides.md
│   ├── recherche.md · comptes.md
│   └── references/                analyse-identifiants-techniques-fonctionnels.md ·
│                                  scenarios-initiaux.json · LISEZMOI.md
├── evolutions/
│   ├── _transverses/               traces historiques (bilan-etape-b.md, analyses/audits-consolides.md)
│   ├── fondations-techniques/     bascule-fournisseur · contrats-api
│   ├── donnees-moteur/            stock-entrees-sync · conversions-disponibilite ·
│   │                              substitutions · moteur-matching · catalogue-modeles
│   ├── consultation-catalogue/    accueil · catalogue-suggestions · fiche-mode-cuisine ·
│   │                              budget-recettes
│   ├── frigo-courses-planning/    frigo-courses-ui · planning
│   ├── experience-utilisateur/    comptes-invite · notifications · i18n-dynamique
│   ├── backoffice-cms/            roles-permissions · cms-staged-online · contenu-editorial
│   └── donnees-usage-monetisation/ analytics · publicite · commerce-frontieres
└── reference-visuelle/site/       pages · assets/ (brand/, cn/) · captures/ · tools/ · benchmark/
```

Les dossiers créés ou restructurés à l'Étape C contiennent `evolution.md` au squelette normalisé
(référence du chantier : objectifs, règles, décisions, architecture, dépendances, étapes, tests,
preuves, état, provenance). Quatre dossiers conservent une **structure historique propre** —
`stock-entrees-sync`, `bascule-fournisseur`, `accueil`, `cms-staged-online` (consolidations des
Étapes B/C) : leur organisation est conservée telle quelle, avec leurs contenus techniques,
décisions et preuves — sans préjuger que chaque élément de leur source ait été retranscrit
intégralement dans le dossier principal. Les dossiers gardent, quand leur valeur le justifie,
`analyses/` (sources verbatim transférées) et `preuves/` (mesures, runs).

## Consultation

1. **Comprendre le produit** : `solution/produit.md`.
2. **Travailler sur un chantier** : son `evolution.md` (statuts par élément + preuves), puis ses
   `analyses/` (détail verbatim) ; les chantiers sans dossier figurent dans `roadmap.md` § 3.
3. **Vérifier un statut** : `evolution.md` § 2/§ 10 ou équivalent + `roadmap.md` § 1 (jamais une seule source) ;
   les statuts par élément, jamais généralisés.
4. **Règles transversales** : `CLAUDE.md` (référentiel), complété par `solution/`.

## Traces historiques et consolidations transverses

`docs/evolutions/_transverses/` n'est pas une famille d'évolution : il conserve des traces
historiques et transverses — `bilan-etape-b.md` (trace de l'Étape B) et
`analyses/audits-consolides.md` (synthèse des audits). Conservés pour la traçabilité, distincts
des dossiers d'évolution.

## Historique

La documentation antérieure (encyclopédie 01–18, `donnees/`, maquettes d3/d4) a été transférée à
l'Étape C selon une matrice fichier par fichier, puis les sources ont été supprimées de leurs
anciens emplacements lors du nettoyage autorisé, après contrôle de non-perte. Les contenus utiles
et extraits transférés restent disponibles à leurs nouveaux emplacements ; le bilan C5 fait foi
pour la correspondance et le contrôle (journal d'exécution conservé comme trace complémentaire,
hors arborescence documentaire).
