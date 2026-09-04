const fs = require('fs');
const path = require('path');
const en = require('../src/i18n/locales/en.json');

function get(o, p) {
  return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
}

function walk(d, files = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.test\.|__tests__/.test(e.name)) files.push(p);
  }
  return files;
}

const files = walk(path.join(__dirname, '..', 'src'));
const keyRe = /\bt\(\s*['"]([^'"]+)['"]/g;
const missing = new Map();

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = keyRe.exec(text))) {
    const k = m[1];
    if (!k || k.includes('{{')) continue;
    if (get(en, k) === undefined) {
      if (!missing.has(k)) missing.set(k, []);
      missing.get(k).push(f.replace(/\\/g, '/'));
    }
  }
}

const list = [...missing.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log('Missing keys in en.json used by t():', list.length);
for (const [k, locs] of list.slice(0, 120)) {
  console.log(k, '<-', locs[0]);
}
if (list.length > 120) console.log('...and', list.length - 120, 'more');
