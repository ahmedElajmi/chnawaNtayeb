/* Page commune : trois graphiques (barres, lignes, anneaux) dans une carte,
   le même HTML pour tous les candidats — seule l'implémentation change. */
export function pageHtml(title, note) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — benchmark diagrammes · lot 2.1</title>
<style>
 body{margin:0;font:14px system-ui;color:#0f172a;background:#fbf9f5}
 .card{background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:16px;margin:16px;box-shadow:0 1px 3px rgba(24,51,21,.08)}
 h1{font-size:18px;margin:16px} .muted{color:#64748b;font-size:12px}
 .chart{height:220px;position:relative} .chart svg,.chart canvas{display:block;width:100%;height:100%}
 .access{font-size:11px;color:#64748b;margin-top:4px}
 table.acc{font-size:11px;border-collapse:collapse;margin-top:6px}
 table.acc td,table.acc th{border:1px solid #e8e4dc;padding:2px 6px}
</style></head><body>
<h1>${title}</h1><p class="muted">${note}</p>
</body></html>`;
}

/* Table d'alternative textuelle (accessibilité) : injectée dans la zone dédiée. */
export function tableFor(elId, rows) {
  const el = document.getElementById(elId);
  if (!el) return;
  const t = document.createElement('table');
  t.className = 'acc';
  t.innerHTML =
    '<caption style="text-align:left">Données du graphique (alternative textuelle)</caption>' +
    rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('');
  el.appendChild(t);
}
