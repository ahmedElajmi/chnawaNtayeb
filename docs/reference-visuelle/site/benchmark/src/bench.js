/* Moteur de mesure commun : rendu initial, mise à jour des données, interaction,
   pour 200 / 1000 / 5000 points — 5 passages, médiane + min/max affichés sur la page.
   Corrections après l'audit UX/UI (protocole v2) :
   - « rendu initial » = MONTAGE À FROID (remontage complet de l'arbre des graphiques
     à chaque passage, via clé React) — plus jamais un graphique déjà monté ;
   - « mise à jour » = VRAI changement de données (deux variantes du corpus alternées) ;
   - l'interaction est ISOLÉE sur les barres (les autres graphiques sont mémoïsés) ;
   - le warm-up (1er passage) est exclu pour LES TROIS opérations ;
   - la médiane gère les effectifs pairs (moyenne des deux valeurs centrales). */

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function stat(arr) {
  return { med: median(arr).toFixed(1), min: Math.min(...arr).toFixed(1), max: Math.max(...arr).toFixed(1) };
}
export function nextFrame() {
  return new Promise((r) => {
    let done = false;
    const to = setTimeout(() => { if (!done) { done = true; r(); } }, 120); // onglet en arrière-plan : rAF est throttlé
    requestAnimationFrame(() => { if (!done) { done = true; clearTimeout(to); r(); } });
  });
}

/* Tick de commit : MessageChannel (non throttlé, s'exécute après le travail planifié par React). */
export function commitTick() {
  return new Promise((r) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => r();
    ch.port2.postMessage(0);
  });
}

/* runner: { render(n, variant, first), update(n, variant, first), interact(n, variant, first) } —
   chaque méthode prend son propre temps (t0 → fin du travail réel + fin du frame suivant)
   et le RETOURNE en ms ; la stabilisation entre passages est hors mesure. */
export async function runBench(container, runner) {
  const volumes = [200, 1000, 5000];
  const runs = 5;
  const kinds = ['render', 'update', 'interact'];
  const results = {};
  for (const n of volumes) {
    const perKind = {};
    for (const kind of kinds) {
      const times = [];
      for (let i = 0; i < runs; i++) {
        const variant = kind === 'update' ? i % 2 : 0; // la mise à jour alterne deux jeux réels
        const dt = await runner[kind](n, variant, i === 0);
        if (i < runs - 1) await nextFrame();
        if (i !== 0) times.push(dt); // 1er passage = warm-up pour TOUTES les opérations
      }
      perKind[kind] = stat(times);
    }
    results[n] = perKind;
    container.insertAdjacentHTML(
      'beforeend',
      `<p style="margin:4px 0">Corpus <b>${n}</b> pts — rendu initial <b>${perKind.render.med}</b> ms ` +
        `(${perKind.render.min}–${perKind.render.max}) · mise à jour <b>${perKind.update.med}</b> ms ` +
        `(${perKind.update.min}–${perKind.update.max}) · interaction <b>${perKind.interact.med}</b> ms ` +
        `(${perKind.interact.min}–${perKind.interact.max})</p>`,
    );
    container.setAttribute('data-bench-done', '1');
  }
  return results;
}

/* Démarrage robuste : attend que le contrôleur de la page soit prêt, puis mesure.
   Les erreurs sont affichées sur la page (jamais avalées en silence). */
export function startBench(box, runner, ready = () => window.__ctl) {
  const attempt = async () => {
    if (!ready()) { setTimeout(attempt, 100); return; }
    try {
      await runBench(box, runner);
    } catch (e) {
      box.insertAdjacentHTML('beforeend', `<p style="color:#b91c1c">Erreur de mesure : ${e && e.message}</p>`);
      box.setAttribute('data-bench-error', '1');
    }
  };
  attempt();
}

export function mountBenchBlock() {
  const params = new URLSearchParams(location.search);
  const out = document.createElement('div');
  out.style.cssText = 'font:12px system-ui;padding:12px 16px;color:#0f172a;background:#f8fafc;border-top:1px solid #e2e8f0';
  out.innerHTML = '<h3 style="margin:0 0 6px;font-size:14px">Mesures (5 passages, médiane / min / max en ms — protocole v2 : montage à froid, mise à jour = vrai changement, interaction isolée sur les barres)</h3>';
  if (!params.get('bench')) {
    out.insertAdjacentHTML('beforeend', '<p style="color:#64748b">Ajoutez <code>?bench=1</code> à l’URL pour lancer la mesure automatique.</p>');
  }
  const box = document.createElement('div');
  box.id = 'bench-out';
  out.appendChild(box);
  document.body.appendChild(out);
  return params.get('bench') ? box : null;
}
