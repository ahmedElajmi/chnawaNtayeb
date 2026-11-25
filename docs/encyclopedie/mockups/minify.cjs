// Builds min.html from backoffice.html (strip comments, collapse indentation).
const fs = require('fs');
const p = __dirname + '/backoffice.html';
let s = fs.readFileSync(p, 'utf8');
s = s
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/\n{2,}/g, '\n');
fs.writeFileSync(__dirname + '/min.html', s);
console.log('min.html', s.length, 'chars');
