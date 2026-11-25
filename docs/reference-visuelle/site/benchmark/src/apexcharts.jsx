/* Candidat ApexCharts 4 (react-apexcharts). Protocole v2 (voir bench.js). */

window.__errs = [];
window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message).slice(0, 600)));
const __origCe = console.error;
console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 600)); __origCe(...a); };

import React, { memo, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Chart from 'react-apexcharts';
import { makeData, BARS, COLORS } from './data.js';
import { pageHtml, tableFor } from './page.js';
import { mountBenchBlock, startBench, nextFrame, commitTick } from './bench.js';

document.body.innerHTML = pageHtml('ApexCharts', 'Complet, plus lourd — mêmes graphiques, mêmes données.');

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

const noAnim = { chart: { animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false } } };

const LineCard = memo(function LineCard({ line }) {
  return (
    <Chart type="area" width="100%" height="100%" options={{ ...noAnim, xaxis: { type: 'numeric', labels: { show: false }, axisTicks: { show: false } }, yaxis: { labels: { show: false } } }} series={[{ name: 'y', data: line.map((p) => [p.x, p.y]) }]} />
  );
});
const DonutCard = memo(function DonutCard({ donut }) {
  return (
    <Chart type="donut" width="100%" height="100%" options={{ ...noAnim, labels: donut.map((d) => d.name), colors: COLORS, legend: { show: false } }} series={donut.map((d) => d.v)} />
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
      <div className="card"><div className="chart"><Chart type="bar" width="100%" height="100%" options={{ ...noAnim, plotOptions: { bar: { distributed: false } }, xaxis: { categories: bars.map((b) => b.name) } }} series={[{ name: 'v', data: bars.map((b) => b.v) }]} /></div><div id="acc-bar"></div></div>
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
