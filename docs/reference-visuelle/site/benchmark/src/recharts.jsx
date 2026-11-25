/* Candidat Recharts 3 — React natif. Protocole v2 (voir bench.js). */

window.__errs = [];
window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message).slice(0, 600)));
const __origCe = console.error;
console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 600)); __origCe(...a); };

import React, { memo, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { makeData, BARS, COLORS } from './data.js';
import { pageHtml, tableFor } from './page.js';
import { mountBenchBlock, startBench, nextFrame, commitTick } from './bench.js';

document.body.innerHTML = pageHtml('Recharts', 'React natif, très répandu — mêmes graphiques, mêmes données.');

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

const LineCard = memo(function LineCard({ line }) {
  return (
    <ResponsiveContainer>
      <LineChart data={line}><XAxis dataKey="x" hide /><YAxis hide /><Line dataKey="y" stroke="#c75128" dot={false} isAnimationActive={false} /><Tooltip /></LineChart>
    </ResponsiveContainer>
  );
});
const DonutCard = memo(function DonutCard({ donut }) {
  return (
    <ResponsiveContainer>
      <PieChart><Pie data={donut} dataKey="v" innerRadius={40} outerRadius={68} isAnimationActive={false}>{donut.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
    </ResponsiveContainer>
  );
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
      <div className="card"><div className="chart"><ResponsiveContainer><BarChart data={bars}><XAxis dataKey="name" hide /><YAxis hide /><Bar dataKey="v" isAnimationActive={false}>{bars.map((b) => <Cell key={b.name} fill={COLORS[0]} />)}</Bar><Tooltip /></BarChart></ResponsiveContainer></div><div id="acc-bar"></div></div>
      <div className="card"><div className="chart"><LineCard line={data.line} /></div><div id="acc-line"></div></div>
      <div className="card"><div className="chart"><DonutCard donut={data.donut} /></div><div id="acc-donut"></div></div>
    </React.Fragment>
  );
}

createRoot(document.body.appendChild(document.createElement('div'))).render(<App />);

const box = mountBenchBlock();
if (box) {
  startBench(box, {
    async render(n) {
      const t0 = performance.now();
      await window.__ctl.mount(n);
      await nextFrame();
      return performance.now() - t0;
    },
    async update(n, variant) {
      const t0 = performance.now();
      await window.__ctl.update(n, variant);
      await nextFrame();
      return performance.now() - t0;
    },
    async interact() {
      const t0 = performance.now();
      await window.__ctl.flip();
      await nextFrame();
      return performance.now() - t0;
    },
  });
}
