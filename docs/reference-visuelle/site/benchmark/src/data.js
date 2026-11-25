/* Corpus de données factices IDENTIQUE pour tous les candidats (versionné ici).
   Trois types de graphiques : barres, lignes/aires, anneaux. */

export function series(n) {
  // Série temporelle déterministe (pas d'aléatoire) : même courbe pour tous les candidats.
  const line = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    line.push({
      x: i,
      y: Math.round(50 + 30 * Math.sin(t * 6.28 * 3) + 12 * Math.sin(t * 6.28 * 11) + t * 20),
    });
  }
  return line;
}

export const BARS = [
  { name: 'Ojja', v: 412 },
  { name: 'Kosksi', v: 388 },
  { name: 'Kafteji', v: 301 },
  { name: 'Brik', v: 276 },
  { name: 'Slata', v: 240 },
  { name: 'Mloukhia', v: 198 },
  { name: 'Chorba', v: 176 },
  { name: 'Tajine', v: 143 },
  { name: 'Samsa', v: 118 },
  { name: 'Mhamsa', v: 96 },
  { name: 'Rouz', v: 74 },
  { name: 'Assida', v: 52 },
];

export const DONUT = [
  { name: 'Légumes', v: 35 },
  { name: 'Viandes', v: 25 },
  { name: 'Épices', v: 18 },
  { name: 'Base', v: 14 },
  { name: 'Autres', v: 8 },
];

export const COLORS = ['#2d5a27', '#c75128', '#d99b26', '#64748b', '#34502f'];

export function makeData(n, variant = 0) {
  /* Deux variantes distinctes du même corpus : l'opérande "mise à jour" charge un jeu
     de données RÉELLEMENT différent (sinon la mesure serait un no-op). */
  const shift = variant ? 1.3 : 0;
  const gain = variant ? 0.75 : 1;
  const line = series(n).map((p) => ({
    x: p.x,
    y: Math.max(1, Math.round((p.y + 40 * Math.sin(shift)) * gain)),
  }));
  const donut = variant ? DONUT.map((d) => ({ name: d.name, v: Math.round(d.v * 0.82) })) : DONUT;
  return { line, bars: BARS, donut };
}
