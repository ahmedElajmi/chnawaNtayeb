/* Chnawa Ntayeb — maquettes D4 : captures RÉELLES du navigateur (Edge ou Chrome headless, profil temporaire).
   Émulation exacte de la fenêtre par le protocole DevTools (Emulation.setDeviceMetricsOverride), sans dépendance.
   Usage : node tools/capture.mjs <url-de-base> <dossier-de-sortie> <chemin-du-navigateur> <dossier-profil-temporaire>
   ex. node tools/capture.mjs http://localhost:4310/d4 captures "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" C:/tmp/prof */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [base, outDir, browser, profile] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const WIDTHS = [[320, 700], [375, 812], [390, 844], [768, 1024], [1024, 800], [1280, 800]];
const PAGES = ['accueil-c', 'frigo', 'suggestions', 'recette', 'mode-cuisine', 'courses', 'planning', 'notifications'];
const JOBS = [];
for (const p of PAGES) for (const [w, h] of WIDTHS) JOBS.push({ name: `${p}_${w}`, url: `${base}/${p}.html?embed=1`, w, h });
/* Variantes : RTL (arabe), mode sombre, états vides / alternatifs, scénarios de correspondance. */
for (const p of PAGES) JOBS.push({ name: `${p}_375_ar`, url: `${base}/${p}.html?embed=1&lang=ar`, w: 375, h: 812 });
for (const p of PAGES) JOBS.push({ name: `${p}_375_sombre`, url: `${base}/${p}.html?embed=1&mode=dark`, w: 375, h: 812 });
JOBS.push({ name: 'accueil-c_1280_ar_sombre', url: `${base}/accueil-c.html?embed=1&lang=ar&mode=dark`, w: 1280, h: 800 });
JOBS.push({ name: 'etat_accueil-nouveau_375', url: `${base}/accueil-c.html?embed=1#state=new`, w: 375, h: 812 });
JOBS.push({ name: 'etat_accueil-frigo-vide_375', url: `${base}/accueil-c.html?embed=1#state=empty`, w: 375, h: 812 });
JOBS.push({ name: 'etat_accueil-planning_375', url: `${base}/accueil-c.html?embed=1#state=planning`, w: 375, h: 812 });
JOBS.push({ name: 'etat_frigo-64_375', url: `${base}/frigo.html?embed=1#big`, w: 375, h: 812 });
JOBS.push({ name: 'etat_frigo-64_1280', url: `${base}/frigo.html?embed=1#big`, w: 1280, h: 800 });
JOBS.push({ name: 'etat_recette-sans-etapes_375', url: `${base}/recette.html?embed=1&id=marqa`, w: 375, h: 812 });
JOBS.push({ name: 'etat_profil-invite_375', url: `${base}/profil.html?embed=1&auth=guest`, w: 375, h: 812 });
JOBS.push({ name: 'etat_favoris_375', url: `${base}/favoris.html?embed=1`, w: 375, h: 812 });
JOBS.push({ name: 'scenarios_1280', url: `${base}/scenarios.html?embed=1`, w: 1280, h: 1400 });
JOBS.push({ name: 'recette-kosksi_390', url: `${base}/recette.html?embed=1&id=kosksi`, w: 390, h: 844 });
JOBS.push({ name: 'mode-cuisine-bsissa_375', url: `${base}/mode-cuisine.html?embed=1&id=bsissa`, w: 375, h: 812 });

const port = 9333;
const proc = spawn(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) { await sleep(250); try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch { /* démarrage */ } }
if (!wsUrl) { proc.kill(); throw new Error('navigateur injoignable'); }
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener('open', r));
let seq = 0; const pending = new Map(); const events = [];
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else events.push(d); });
const send = (method, params = {}, sessionId) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params, sessionId })); });

const report = [];
for (const j of JOBS) {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: j.w < 768 }, sessionId);
  await send('Page.navigate', { url: j.url }, sessionId);
  await sleep(2600); /* chargement, polices, photos, rendu des composants */
  const probe = await send('Runtime.evaluate', { expression: `JSON.stringify({ over: document.documentElement.scrollWidth - innerWidth, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length, dir: document.dir || 'ltr', blocks: document.querySelectorAll('[data-c]').length, empty: [...document.querySelectorAll('[data-page-root] > [data-c]')].filter(b => !b.hidden && !b.innerHTML.trim() && b.dataset.c !== 'active-filters').length })`, returnByValue: true }, sessionId);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 }, sessionId);
  writeFileSync(join(outDir, j.name + '.jpg'), Buffer.from(shot.result.data, 'base64'));
  report.push({ name: j.name, w: j.w, ...JSON.parse(probe.result.result.value) });
  await send('Target.closeTarget', { targetId });
}
writeFileSync(join(outDir, 'rapport-captures.json'), JSON.stringify(report, null, 2));
ws.close(); proc.kill();
const bad = report.filter((r) => r.over > 0 || r.broken || r.empty);
console.log(report.length, 'captures ·', bad.length, 'avec anomalie', JSON.stringify(bad));
