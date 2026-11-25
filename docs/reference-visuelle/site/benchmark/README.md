# Benchmark des bibliothèques de diagrammes — lot 2.1

Harnais de comparaison (poids + performance) de 6 candidats : interne, Recharts,
Chart.js, visx, ApexCharts, ECharts. **Les conclusions de performance ne sont
conservées que pour les poids (builds de production) ; les mesures d'exécution
sont à reprendre sous le protocole v2** (montage à froid, warm-up, médiane paire,
React épinglé 19.0.1).

## Contenu conservé

- `package.json` — dépendances épinglées (React 19.0.1) ;
- `vite.config.mjs` — 6 entrées de build ;
- `src/` — `data.js` (corpus déterministe, 2 variantes), `bench.js` (protocole v2),
  `page.js`, et les 6 implémentations JSX (`interne`, `recharts`, `chartjs`,
  `visx`, `apexcharts`, `echarts`) ;
- `*.html` — pages auto-mesurantes (`?bench=1`) ;
- `entries.js`.

## Reproduction

```bash
cd docs/encyclopedie/mockups/d3/benchmark
npm install
npm run build          # poids (dist/, delta gzip par entrée)
npx vite preview       # puis ouvrir chaque page avec ?bench=1
```

Chaque page `?bench=1` mesure : rendu initial à froid (montage par clé React),
mise à jour (alternance de deux jeux de données réels), interaction isolée sur
les barres (lignes/anneaux mémoïsés) — 5 exécutions, médiane + dispersion,
aux volumes 200 / 1 000 / 5 000 points.

## Nettoyage

`node_modules/` et `dist/` sont volontairement **absents du livrable final** :
ils sont reconstitués par `npm install` / `npm run build`. Si un reste est
présent dans l'archive reçue (environ 14 000 fichiers / 40 Mo avec dépendances),
le supprimer avant diffusion :

```bash
rm -rf node_modules dist
```
