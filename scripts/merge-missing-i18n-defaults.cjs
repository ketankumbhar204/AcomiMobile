/**
 * Extract t('key', { defaultValue: '...' }) from src and merge missing keys into en.json.
 * Also reports keys used without a defaultValue that are still missing.
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function get(o, p) {
  return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
}

function set(o, p, v) {
  const parts = p.split('.');
  let cur = o;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = v;
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

// Match t('key'...) or t("key"...) optionally with defaultValue nearby in same call
const callRe = /\bt\(\s*(['"])([^'"]+)\1([^)]*)\)/gs;

const withDefault = new Map(); // key -> defaultValue
const withoutDefault = new Set();

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = callRe.exec(text))) {
    const key = m[2];
    if (!key || key.includes('{{')) continue;
    const rest = m[3] || '';
    const dv =
      rest.match(/defaultValue\s*:\s*['"]([^'"]*)['"]/) ||
      rest.match(/defaultValue\s*:\s*`([^`]*)`/);
    if (dv) {
      if (!withDefault.has(key)) withDefault.set(key, dv[1]);
    } else {
      withoutDefault.add(key);
    }
  }
}

let added = 0;
const addedKeys = [];
for (const [key, value] of [...withDefault.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (get(en, key) === undefined) {
    set(en, key, value);
    added++;
    addedKeys.push(`${key} = ${JSON.stringify(value)}`);
  }
}

const stillMissing = [];
for (const key of [...withoutDefault].sort()) {
  if (get(en, key) === undefined && !withDefault.has(key)) {
    stillMissing.push(key);
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('Added from defaultValue:', added);
addedKeys.slice(0, 80).forEach((l) => console.log(' +', l));
if (addedKeys.length > 80) console.log(' ...and', addedKeys.length - 80, 'more');
console.log('Still missing (no defaultValue in source):', stillMissing.length);
stillMissing.slice(0, 100).forEach((k) => console.log(' ?', k));
if (stillMissing.length > 100) console.log(' ...and', stillMissing.length - 100, 'more');
