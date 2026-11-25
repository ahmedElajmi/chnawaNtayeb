/* Candidat visx — D3 bas niveau, modulaire (@visx/scale, shape, axis, group). Protocole v2. */

window.__errs = [];
window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message).slice(0, 600)));
const __origCe = console.error;
console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 600)); __origCe(...a); };

import React, { memo, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scaleLinear, scaleBand } from '@visx/scale';
import { Group } from '@visx/group';
import { LinePath, Bar as VisxBar, Arc } from '@visx/shape';
import { makeData, BARS, COLORS } from './data.js';
import { pageHtml, tableFor } from './page.js';
import { mountBenchBlock, startBench, nextFrame, commitTick } from './bench.js';

document.body.innerHTML = pageHtml('visx (modulaire)', 'D3 bas niveau, poids à la carte — mêmes graphiques, mêmes données.');

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

const W = 300, H = 200;

const LineCard = memo(function LineCard({ line }) {
  const xLine = scaleLinear({ domain: [0, line.length - 1], range: [0, W] });
  const yLine = scaleLinear({ domain: [Math.min(...line.map((p) => p.y)), Math.max(...line.map((p) => p.y))], range: [H, 0] });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <LinePath data={line} x={(p) => xLine(p.x)} y={(p) => yLine(p.y)} stroke={COLORS[1]} strokeWidth={2} fill="none" />
    </svg>
  );
});
const DonutCard = memo(function DonutCard({ donut }) {
  const total = donut.reduce((s, d) => s + d.v, 0);
  let angle = 0;
  const arcs = donut.map((d, i) => {
    const a0 = (angle / total) * 2 * Math.PI;
    angle += d.v;
    const a1 = (angle / total) * 2 * Math.PI;
    return { a0, a1, fill: COLORS[i % COLORS.length], name: d.name };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {arcs.map((a) => <Arc key={a.name} cx={W / 2} cy={H / 2} outerRadius={68} innerRadius={40} startAngle={a.a0 - Math.PI / 2} endAngle={a.a1 - Math.PI / 2} fill={a.fill} />)}
    </svg>
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
  const xBand = scaleBand({ domain: bars.map((b) => b.name), range: [0, W], padding: 0.2 });
  const yBar = scaleLinear({ domain: [0, Math.max(...bars.map((b) => b.v))], range: [H, 0] });
  return (
    <React.Fragment key={mountKey}>
      <div className="card"><div className="chart"><svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><Group>{bars.map((b) => <VisxBar key={b.name} x={xBand(b.name)} y={yBar(b.v)} width={xBand.bandwidth()} height={H - yBar(b.v)} fill={COLORS[0]} />)}</Group></svg></div><div id="acc-bar"></div></div>
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
