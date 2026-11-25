/* Chnawa Ntayeb — maquettes D4 (v4.5) : génère les pages HTML depuis tools/pages.mjs.
   Usage : node tools/generate-pages.mjs   (sans dépendance)
   Chaque page produite ne contient AUCUN contenu : habillage + schéma JSON de blocs ; le rendu est fait par
   assets/components.js + assets/cn/*.js à partir de assets/data.js. C'est le contrat attendu du futur moteur CMS. */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SCRIPTS = ['assets/data.js', 'assets/components.js', 'assets/cn/i18n.js', 'assets/cn/common.js', 'assets/cn/home.js', 'assets/cn/fridge.js', 'assets/cn/recipe.js', 'assets/cn/flows.js', 'assets/cn/account.js', 'assets/app.js'];
const ICON_BACK = '<svg class="ic flip-rtl" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const ICON_CLOSE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const controls = (p) => {
  const hasAds = p.blocks.some((b) => b.c === 'ad-slot') || p.adRail;
  const demo = (p.demo || []).map((d) => `  <div class="grp" style="flex-wrap:wrap"><span class="lbl">${esc(d.label)}</span>\n${d.values.map(([v, l]) => `    <button class="ctl demo-attr" data-attr="${d.attr}" data-v="${v}" aria-pressed="${v === d.def}">${esc(l)}</button>`).join('\n')}</div>\n`).join('');
  return `<div class="controls" role="toolbar" aria-label="Commandes de démonstration (masquables)">
  <div class="grp"><span class="lbl">Direction</span>
    <button class="ctl dir-ctl" data-dir="A" aria-pressed="false">A</button>
    <button class="ctl dir-ctl" data-dir="B" aria-pressed="false">B</button>
    <button class="ctl dir-ctl" data-dir="FK" aria-pressed="false">FK</button></div>
  <div class="grp"><span class="lbl">Mode</span>
    <button class="ctl mode-ctl" data-mode="light" aria-pressed="true">Clair</button>
    <button class="ctl mode-ctl" data-mode="dark" aria-pressed="false">Sombre</button></div>
  <div class="grp" data-lang-group><span class="lbl">Langue</span>
    <button class="ctl lang-ctl" data-lang="fr" aria-pressed="true">FR</button>
    <button class="ctl lang-ctl" data-lang="derja" aria-pressed="false">Derja</button>
    <button class="ctl lang-ctl" data-lang="ar" aria-pressed="false">عربي</button>
    <button class="ctl lang-ctl" data-lang="derja_ar" aria-pressed="false">دارجة</button></div>
${demo}${hasAds ? '  <div class="grp"><span class="lbl">Pub</span><button class="ctl ads-ctl" aria-pressed="true">On</button></div>\n' : ''}  <a class="ctl" href="index.html">← Index</a>
</div>`;
};

const body = (p) => {
  const root = '<div data-page-root></div>';
  if (p.chrome === 'none') return `<div class="pagewrap">${root}</div>`;
  if (p.chrome === 'bare') return `<main style="min-height:100vh;max-width:480px;margin-inline:auto;padding:var(--sp-4)">${root}</main>`;
  if (p.chrome === 'flow') {
    const lead = p.close ? `<a class="icon-btn" href="${p.close}" aria-label="Annuler" data-i18n="recognizeCancel" data-i18n-attr="aria-label">${ICON_CLOSE}</a>` : `<a class="icon-btn" href="${p.back}" aria-label="Retour" data-i18n="back" data-i18n-attr="aria-label">${ICON_BACK}</a>`;
    const title = p.flowTitleKey ? `<b data-i18n="${p.flowTitleKey}">${esc(p.title)}</b>` : '<span class="brand brand-display">Chnawa Ntayeb<small>by chef Souhed</small></span>';
    return `<div class="pagewrap">
  <header class="cook-topbar">${lead}${title}<span style="width:44px"></span></header>
  <main class="page-main"${p.narrow ? ` style="max-width:${p.narrow}px"` : ''}>${root}</main>
</div>`;
  }
  const nav = p.nav ? ` data-current="${p.nav}"` : '';
  return `<div class="pagewrap">
  <header data-shell="topbar"${p.back ? ` data-back="${p.back}"` : ''}>${p.headerActions || ''}</header>
  <div style="display:flex;flex:1;width:100%">
    <nav data-shell="side"${nav}></nav>
    <main class="page-main${p.wide ? ' wide' : ''}"${p.bottomPad ? ` style="padding-bottom:${p.bottomPad}px"` : ''}>
      ${root}
    </main>${p.adRail ? `
    <aside class="ad-rail" aria-label="Colonne publicitaire" data-show-attr="data-home-state" data-show-in="empty filled favs planning grocery"><div data-c="ad-slot" data-props='{"id":"home_side_1","format":"v300"}'></div></aside>` : ''}
  </div>
  <nav data-shell="bottom"${nav}></nav>
</div>`;
};

for (const p of PAGES) {
  const attrs = (p.demo || []).map((d) => ` ${d.attr}="${d.def}"`).join('');
  const hashInit = (p.demo || []).map((d) => `try{var m=location.hash.match(/(?:state=)?(\\w+)/);if(m&&${JSON.stringify(d.values.map((v) => v[0]))}.indexOf(m[1])!==-1)document.documentElement.setAttribute('${d.attr}',m[1]);}catch(e){}`).join('');
  const schema = JSON.stringify({ page: p.file.replace('.html', ''), blocks: p.blocks }, null, 2);
  const out = `<!doctype html>
<html lang="fr" data-dir="C" data-mode="light" data-langs="fr,derja,ar,derja_ar"${attrs}>
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)} — Chnawa Ntayeb</title>
<link rel="stylesheet" href="assets/app.css" />
<link rel="stylesheet" href="assets/components.css" />
<!-- Page générée par tools/generate-pages.mjs depuis tools/pages.mjs — ne pas modifier à la main. -->
${hashInit ? `<script>${hashInit}</script>\n` : ''}</head>
<body>
${controls(p)}

${body(p)}

<script type="application/json" id="page-schema">
${schema}
</script>
${SCRIPTS.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
  writeFileSync(join(root, p.file), out);
  console.log('généré', p.file, '·', p.blocks.length, 'blocs');
}
