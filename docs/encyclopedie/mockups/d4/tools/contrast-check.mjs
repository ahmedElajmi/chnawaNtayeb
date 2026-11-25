/* Outil de vérification des contrastes WCAG (usage : node tools/contrast-check.mjs).
   Vérifie les couples réellement utilisés par les maquettes : texte de bouton (repos et
   survol), texte d'erreur/succès/avertissement/information, bordures utiles (≥ 3:1),
   anneaux de focus (≥ 3:1) — pour les trois directions (A, B, FK) en clair et en sombre.
   Minimas : texte ≥ 4,5:1 (AA), éléments non textuels ≥ 3:1. */
const L = (hex) => {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    let v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const T = [
  ['B light primary (white)', '#ffffff', '#3b4654', 4.5],
  ['B light primary hover (white)', '#ffffff', '#2c3642', 4.5],
  ['B light saffron btn (white)', '#ffffff', '#b45309', 4.5],
  ['B light saffron hover (white)', '#ffffff', '#9a4608', 4.5],
  ['B light focus ring on card', '#3b4654', '#ffffff', 3],
  ['B light field border on card', '#8a94a3', '#ffffff', 3],
  ['B light error text on card', '#b3261e', '#ffffff', 4.5],
  ['B light muted on card', '#6b6f6b', '#ffffff', 4.5],
  ['B dark primary (ink)', '#1a1f26', '#e0a63f', 4.5],
  ['B dark primary hover (ink)', '#1a1f26', '#eab55a', 4.5],
  ['B dark focus ring on card', '#e0a63f', '#1a1f26', 3],
  ['B dark field border on card', '#6b7684', '#1a1f26', 3],
  ['B dark error text on card', '#f28b82', '#1a1f26', 4.5],
  ['B dark muted on card', '#9aa5b1', '#1a1f26', 4.5],
  ['A light primary (white)', '#ffffff', '#2d5a27', 4.5],
  ['A light primary hover (white)', '#ffffff', '#23471e', 4.5],
  ['A light danger (white)', '#ffffff', '#c0392b', 4.5],
  ['A light danger hover (white)', '#ffffff', '#a93226', 4.5],
  ['A light focus ring on card', '#2d5a27', '#ffffff', 3],
  ['A light field border on card', '#8a9186', '#ffffff', 3],
  ['A light muted on card', '#64748b', '#ffffff', 4.5],
  ['A light error text on card', '#b3261e', '#ffffff', 4.5],
  ['A dark primary (white)', '#ffffff', '#2d5a27', 4.5],
  ['A dark primary hover (white)', '#ffffff', '#3b7233', 4.5],
  ['A dark danger (white)', '#ffffff', '#c0392b', 4.5],
  ['A dark danger hover (white)', '#ffffff', '#a93226', 4.5],
  ['A dark focus ring on card', '#34d399', '#1e293b', 3],
  ['A dark field border on card', '#64748b', '#1e293b', 3],
  ['A dark muted on card', '#94a3b8', '#1e293b', 4.5],
  ['A dark error text on card', '#f28b82', '#1e293b', 4.5],
  ['FK light primary (cream)', '#f6eedf', '#1f3f8f', 4.5],
  ['FK light accent (white)', '#ffffff', '#c8361e', 4.5],
  ['FK light focus on card', '#1f3f8f', '#fffcf5', 3],
  ['FK dark primary (navy)', '#14183a', '#e7a33b', 4.5],
  ['FK dark focus on card', '#e7a33b', '#1e2350', 3],
  ['FK light field border on card (v4)', '#9a8763', '#fffcf5', 3],
  ['FK dark field border on card', '#6a71a8', '#1e2350', 3],
  /* v4.1 — direction C « Zitouna vive » (paprika / olive / safran) */
  ['C light primary (white on paprika)', '#ffffff', '#b84d1a', 4.5],
  ['C light primary hover (white)', '#ffffff', '#a8461a', 4.5],
  ['C light accent (white on olive)', '#ffffff', '#5a7d23', 4.5],
  ['C light brand text on surface', '#a8461a', '#fdf6ec', 4.5],
  ['C light olive text on surface', '#4b6a1c', '#fdf6ec', 4.5],
  ['C light muted on surface', '#75604d', '#fdf6ec', 4.5],
  ['C light muted on tint (unread)', '#75604d', '#fdebd3', 4.5],
  ['C light ink on saffron kicker', '#2a1d14', '#f2a516', 4.5],
  ['C light danger text on card', '#b4233c', '#ffffff', 4.5],
  ['C light white on danger', '#ffffff', '#b4233c', 4.5],
  ['C light warning on surface', '#8a6100', '#fdf6ec', 4.5],
  ['C light field border on card', '#9a8670', '#ffffff', 3],
  ['C dark primary (ink on paprika)', '#1a120c', '#f08a4b', 4.5],
  ['C dark brand text on card', '#f5a36e', '#26190f', 4.5],
  ['C dark muted on card', '#c4ae98', '#26190f', 4.5],
  ['C dark olive text on card', '#b9d27a', '#26190f', 4.5],
  ['C dark error text on card', '#f28b82', '#26190f', 4.5],
  ['C dark white on danger', '#ffffff', '#c42f45', 4.5],
  ['C dark field border on card', '#806a55', '#26190f', 3],
  /* v4 — barre « Annuler » (encre sur fond inversé) */
  ['A light snackbar text', '#fbf9f5', '#0f172a', 4.5],
  ['A dark snackbar text', '#151a16', '#f1f5f9', 4.5],
];
let fail = 0;
for (const [name, fg, bg, th] of T) {
  const r = ratio(fg, bg);
  const ok = r >= th;
  if (!ok) fail++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + r.toFixed(2) + ' (min ' + th + ') ' + name);
}
console.log(fail ? fail + ' FAILURES' : 'ALL PASS');
