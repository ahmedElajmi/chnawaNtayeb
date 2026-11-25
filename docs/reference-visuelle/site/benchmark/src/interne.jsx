/* Candidat « interne » : React 19 + SVG maison — ligne de base (aucune bibliothèque).
   Protocole v2 : rendu initial = montage à froid (clé React), mise à jour = vrai
   changement de données (deux variantes), interaction isolée sur les barres
   (lignes et anneaux mémoïsés). */

window.__errs = [];
window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message).slice(0, 600)));
const __origCe = console.error;
console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 600)); __origCe(...a); };

import React, { memo, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { makeData, BARS, COLORS } from './data.js';
import { pageHtml, tableFor } from './page.js';
import { mountBenchBlock, startBench, nextFrame, commitTick } from './bench.js';

document.body.innerHTML = pageHtml(
  'Interne (SVG maison)',
  'React 19 + SVG hand-crafté — ligne de base du benchmark (aucune bibliothèque de graphiques).',
);

function useCtl() {
  const [n, setN] = useState(200);
  const [variant, setVariant] = useState(0);
  const [flip, setFlip] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  useEffect(() => {
    window.__ctl = {
      mount: async (v) => { setVariant(0); setN(v); setMountKey((k) => k + 1); await commitTick(); },
      update: async (v, va) => { setN(v); setVariant(va); await commitTick(); },
      flip: async () => { setFlip((f) => f + 1); await commitTick(); },
    };
  }, []);
  return { n, variant, flip, mountKey };
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
      {data.map((d, i) => (
        <rect key={d.name} x={4 + i * 25} y={190 - (d.v / max) * 170} width={18} height={(d.v / max) * 170} fill="#2d5a27" />
      ))}
    </svg>
  );
}
const LineChart = memo(function LineChart({ data }) {
  const max = Math.max(...data.map((d) => d.y));
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * 300},${190 - (d.y / max) * 170}`).join(' ');
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#c75128" strokeWidth="2" />
    </svg>
  );
});
const DonutChart = memo(function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.v, 0);
  let a = 0;
  const segs = data.map((d, i) => {
    const a0 = (a / total) * 2 * Math.PI;
    a += d.v;
    const a1 = (a / total) * 2 * Math.PI;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r, ang) => `${150 + r * Math.cos(ang)},${100 + r * Math.sin(ang)}`;
    return (
      <path key={d.name} d={`M${p(70, a0)} A70 70 0 ${large} 1 ${p(70, a1)} L${p(45, a1)} A45 45 0 ${large} 0 ${p(45, a0)}Z`} fill={COLORS[i % COLORS.length]} />
    );
  });
  return <svg viewBox="0 0 300 200" aria-hidden="true">{segs}</svg>;
});

function App() {
  const { n, variant, flip, mountKey } = useCtl();
  const data = useMemo(() => makeData(n, variant), [n, variant]);
  const bars = flip % 2 ? [...BARS].reverse() : BARS;
  useEffect(() => {
    tableFor('acc-bar', bars.map((b) => [b.name, b.v]));
    tableFor('acc-line', [['points', String(data.line.length)], ['dernier', String(data.line.at(-1).y)]]);
    tableFor('acc-donut', data.donut.map((d) => [d.name, d.v + ' %']));
  }, [n, variant, flip]);
  return (
    <React.Fragment key={mountKey}>
      <div className="card"><div className="chart"><BarChart data={bars} /></div><div id="acc-bar"></div></div>
      <div className="card"><div className="chart"><LineChart data={data.line} /></div><div id="acc-line"></div></div>
      <div className="card"><div className="chart"><DonutChart data={data.donut} /></div><div id="acc-donut"></div></div>
    </React.Fragment>
  );
}

createRoot(document.body.appendChild(document.createElement('div'))).render(<App />);

const box = mountBenchBlock();
if (box) {
  startBench(box, {
    async render(n) {
      const t0 = performance.now();
      await window.__ctl.mount(n); // montage à froid : l'arbre des graphiques est remonté
      await nextFrame();
      return performance.now() - t0;
    },
    async update(n, variant) {
      const t0 = performance.now();
      await window.__ctl.update(n, variant); // vrai changement de données (variante alternée)
      await nextFrame();
      return performance.now() - t0;
    },
    async interact() {
      const t0 = performance.now();
      await window.__ctl.flip(); // ne change que les barres (lignes/anneaux mémoïsés)
      await nextFrame();
      return performance.now() - t0;
    },
  });
}
