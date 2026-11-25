/* Candidat ECharts 6 (init direct, sans wrapper). Protocole v2 (voir bench.js). */

window.__errs = [];
window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message).slice(0, 600)));
const __origCe = console.error;
console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 600)); __origCe(...a); };

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { makeData, BARS, COLORS } from './data.js';
import { pageHtml, tableFor } from './page.js';
import { mountBenchBlock, startBench, nextFrame, commitTick } from './bench.js';

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer]);

document.body.innerHTML = pageHtml('ECharts', 'Très complet, le plus lourd — mêmes graphiques, mêmes données.');

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
  const ref = useRef(null);
  useEffect(() => {
    const chart = echarts.init(ref.current);
    chart.setOption({
      animation: false,
      xAxis: { type: 'category', data: line.map((p) => p.x) },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: line.map((p) => p.y), showSymbol: false }],
    });
    return () => chart.dispose();
  }, [line]);
  return <div className="chart" ref={ref}></div>;
});
const DonutCard = memo(function DonutCard({ donut }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = echarts.init(ref.current);
    chart.setOption({
      animation: false,
      series: [{ type: 'pie', radius: ['38%', '65%'], data: donut.map((x, i) => ({ name: x.name, value: x.v, itemStyle: { color: COLORS[i % COLORS.length] } })) }],
    });
    return () => chart.dispose();
  }, [donut]);
  return <div className="chart" ref={ref}></div>;
});

function App() {
  const { n, variant, flip, mountKey } = useCtl();
  const data = useMemo(() => makeData(n, variant), [n, variant]);
  const bars = flip % 2 ? [...BARS].reverse() : BARS;
  const barRef = useRef(null);
  useEffect(() => {
    tableFor('acc-bar', bars.map((b) => [b.name, b.v]));
    tableFor('acc-line', [['points', String(data.line.length)], ['dernier', String(data.line.at(-1).y)]]);
    tableFor('acc-donut', data.donut.map((d) => [d.name, d.v + ' %']));
  }, [n, variant, flip]);
  useEffect(() => {
    const chart = echarts.init(barRef.current);
    chart.setOption({
      animation: false,
      xAxis: { data: bars.map((x) => x.name) },
      yAxis: {},
      series: [{ type: 'bar', data: bars.map((x) => x.v) }],
    });
    return () => chart.dispose();
  }, [flip]);
  return (
    <React.Fragment key={mountKey}>
      <div className="card"><div className="chart" ref={barRef}></div><div id="acc-bar"></div></div>
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
